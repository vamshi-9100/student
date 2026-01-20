"use client"

import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getMessaging, getToken, onMessage, MessagePayload, isSupported as isMessagingSupported, deleteToken } from "firebase/messaging"

// Firebase configuration (read from environment)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
}

// Initialize Firebase
let app: FirebaseApp | null = null
if (typeof window !== "undefined" && getApps().length === 0) {
  app = initializeApp(firebaseConfig)
}

// Get FCM token
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    // Check if messaging is supported
    const messagingSupported = await isMessagingSupported()
    if (!messagingSupported) {
      console.warn("Firebase Cloud Messaging is not supported in this browser")
      return null
    }

    if (!app) {
      console.warn("Firebase app not initialized")
      return null
    }

    const messaging = getMessaging(app)
    
    // Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.warn("Notification permission not granted")
      return null
    }

    // Get FCM token (VAPID key is optional for web, Firebase will use default if not provided)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY || undefined,
    })

    if (token) {
      return token
    } else {
      console.warn("No FCM token available")
      return null
    }
  } catch (error) {
    console.error("Error getting FCM token:", error)
    return null
  }
}

// Force-refresh FCM token (delete then re-issue) to support per-user/per-device separation
export async function refreshFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const messagingSupported = await isMessagingSupported()
    if (!messagingSupported) {
      console.warn("Firebase Cloud Messaging is not supported in this browser")
      return null
    }

    if (!app) {
      console.warn("Firebase app not initialized")
      return null
    }

    const messaging = getMessaging(app)

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.warn("Notification permission not granted")
      return null
    }

    // Delete existing token to ensure a new one is issued
    try {
      await deleteToken(messaging)
    } catch (err) {
      console.warn("Failed to delete existing FCM token (continuing):", err)
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY || undefined,
    })

    if (token) {
      return token
    }

    console.warn("No FCM token available after refresh")
    return null
  } catch (error) {
    console.error("Error refreshing FCM token:", error)
    return null
  }
}

// Listen for foreground messages
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  if (typeof window === "undefined" || !app) {
    return null
  }

  try {
    // Check if messaging is supported
    const supported = await isMessagingSupported()
    if (!supported) {
      console.warn("Firebase Cloud Messaging is not supported")
      return null
    }

    const messaging = getMessaging(app!)
    return onMessage(messaging, callback)
  } catch (error) {
    console.error("Error setting up foreground message listener:", error)
    return null
  }
}

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  return "Notification" in window && "serviceWorker" in navigator
}

