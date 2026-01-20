"use client"

import { useEffect, useState, useCallback } from "react"
import { getFCMToken, onForegroundMessage, isNotificationSupported, refreshFCMToken } from "@/lib/firebase"
import {
  deviceRegistrationService,
  getStoredDeviceRegistrations,
  getOrCreateDeviceId,
  type StoredDeviceRegistration,
  removeStoredDeviceRegistration,
} from "@/services/device-registration-service"
import { useAuth } from "@/contexts/auth-context"
import { useAlert } from "@/contexts/alert-context"
import { useToast } from "@/components/ui/use-toast"
import type { MessagePayload } from "firebase/messaging"

export function useFCM() {
  const { user } = useAuth()
  const { startAlert, setAlertInfo } = useAlert()
  const { toast } = useToast()
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<StoredDeviceRegistration[]>([])

  const getCompanyId = () => {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem("iot-selected-company-id")
  }

  const getClientId = () => {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem("iot-selected-client-id")
  }

  // Check if device is already registered and get token
  useEffect(() => {
    const id = getOrCreateDeviceId()
    setDeviceId(id)

    const companyId = getCompanyId()
    const storedList = getStoredDeviceRegistrations(user?.username ?? null, companyId)
    setRegistrations(storedList)
    const stored = storedList.find((entry) => entry.deviceId === id)
    if (stored) {
      setIsRegistered(true)
      setFcmToken(stored.deviceToken)
    }

    // Try to get token even if not registered (for testing)
    getFCMToken()
      .then((token) => {
        if (token) {
          setFcmToken(token)
        }
      })
      .catch((err) => {
        console.warn("Could not get FCM token:", err)
      })
  }, [user?.username])

  // Register device with backend
  const registerDevice = useCallback(async (deviceName?: string) => {
    if (!isNotificationSupported()) {
      setError("Notifications are not supported in this browser")
      return false
    }

    if (!deviceName || deviceName.trim().length === 0) {
      setError("Please enter a device name")
      return false
    }

    const ensuredDeviceId = deviceId ?? getOrCreateDeviceId()
    const companyId = getCompanyId()
    // Prevent duplicate registration on the same device for the same user/company
    const alreadyRegistered = registrations.some(
      (entry) =>
        entry.deviceId === ensuredDeviceId &&
        entry.userId === (user?.username ?? null) &&
        entry.companyId === (companyId ?? null)
    )
    if (alreadyRegistered) {
      setError("This device is already registered. Please unregister first.")
      toast({
        title: "Already registered",
        description: "This device is already registered for alerts.",
      })
      return false
    }

    setIsRegistering(true)
    setError(null)

    try {
      // Get FCM token (force refresh so each user/device can have a distinct token)
      const token = await refreshFCMToken()
      if (!token) {
        setError("Failed to get FCM token. Please allow notifications.")
        setIsRegistering(false)
        return false
      }

      setFcmToken(token)

      // Get OS info
      const osType = navigator.platform.includes("Win") ? "Windows" : 
                     navigator.platform.includes("Mac") ? "macOS" :
                     navigator.platform.includes("Linux") ? "Linux" : "Unknown"
      const osVersion = navigator.userAgent
      const clientId = getClientId()

      // Register with backend
      const response = await deviceRegistrationService.registerDevice({
        deviceId: ensuredDeviceId,
        deviceToken: token,
        appVersion: "1.0.0",
        osType,
        osVersion,
        userId: user?.username || undefined,
        companyId: companyId ?? undefined,
        clientId: clientId ?? undefined,
        deviceName,
      })

      if (response) {
        setIsRegistered(true)
        const updatedList = getStoredDeviceRegistrations(user?.username ?? null, companyId)
        setRegistrations(updatedList)
        toast({
          title: "Device Registered",
          description: "Your device has been registered for push notifications. You will receive alerts when they occur.",
        })
        return true
      } else {
        setError("Failed to register device")
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register device"
      setError(errorMessage)
      console.error("Device registration error:", err)
      return false
    } finally {
      setIsRegistering(false)
    }
  }, [user, deviceId])

  const unregisterDevice = useCallback(
    (target?: StoredDeviceRegistration) => {
      const currentDeviceId = deviceId ?? getOrCreateDeviceId()
      const companyId = getCompanyId()
      const targetDeviceId = target?.deviceId ?? currentDeviceId
      removeStoredDeviceRegistration(targetDeviceId, user?.username ?? null, companyId)
      const updated = getStoredDeviceRegistrations(user?.username ?? null, companyId)
      setRegistrations(updated)
      if (targetDeviceId === currentDeviceId) {
        setIsRegistered(false)
      }
    },
    [deviceId, user?.username]
  )

  // Set up FCM message listener (works even if not registered with backend)
  // Try to set up listener even without token, in case token is obtained later
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    let setupAttempted = false

    const setupListener = async () => {
      if (setupAttempted) return
      setupAttempted = true

      try {
        const unsub = await onForegroundMessage((payload: MessagePayload) => {
          console.log("✅ Received FCM foreground message:", payload)

          // Extract alert data from notification
          const notification = payload.notification
          const data = payload.data as Record<string, string> | undefined

          // Log for debugging
          console.log("Notification:", notification)
          console.log("Data:", data)

          if (notification || data) {
            // Set alert info
            setAlertInfo({
              title: notification?.title || data?.title || "Alert",
              message: notification?.body || data?.message || data?.alertMessage || "New alert received",
              sensorId: data?.sensorId || data?.sensorSerialNumber,
              location: data?.location || data?.locationName,
              timestamp: new Date(),
            })

            // Start alert (sound + vibration)
            startAlert()

            // Show toast notification
            toast({
              title: notification?.title || "Alert Received",
              description: notification?.body || data?.message || "New alert notification",
            })
          }
        })

        if (unsub) {
          unsubscribe = unsub
          console.log("✅ FCM foreground message listener set up successfully")
        } else {
          console.warn("⚠️ FCM foreground message listener returned null")
        }
      } catch (error) {
        console.error("❌ Failed to set up FCM message listener:", error)
        setupAttempted = false // Allow retry
      }
    }

    // Try to set up listener immediately
    setupListener()

    // Also try when token becomes available
    if (fcmToken) {
      setupListener()
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
        console.log("🔄 FCM foreground message listener unsubscribed")
      }
    }
  }, [fcmToken, startAlert, setAlertInfo, toast])

  // Register service worker for background messages and listen for messages
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Set up service worker message listener (works even without token)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log("✅ Received message from service worker:", event.data)
      
      if (event.data && event.data.type === 'FCM_MESSAGE') {
        const payload = event.data.payload || event.data
        const notification = payload.notification || event.data.notification
        const data = payload.data || event.data.data

        console.log("Processing FCM message from service worker:", { notification, data })

        if (notification || data) {
          setAlertInfo({
            title: notification?.title || data?.title || "Alert",
            message: notification?.body || data?.message || data?.alertMessage || "New alert received",
            sensorId: data?.sensorId || data?.sensorSerialNumber,
            location: data?.location || data?.locationName,
            timestamp: new Date(),
          })

          startAlert()

          toast({
            title: notification?.title || "Alert Received",
            description: notification?.body || data?.message || "New alert notification",
          })
        }
      }
    }

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage)

    // Also try to get the service worker registration and listen
    navigator.serviceWorker.ready.then((registration) => {
      console.log("✅ Service Worker ready:", registration)
      
      // Listen for messages from service worker
      if (registration.active) {
        registration.active.addEventListener("message", handleServiceWorkerMessage)
      }
    }).catch((error) => {
      console.warn("⚠️ Service Worker not ready:", error)
    })

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage)
    }
  }, [startAlert, setAlertInfo, toast])

  return {
    isRegistered,
    isRegistering,
    error,
    registerDevice,
    unregisterDevice,
    fcmToken,
    deviceId,
    registrations,
    isSupported: isNotificationSupported(),
  }
}

