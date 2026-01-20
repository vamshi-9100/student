"use client"

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"

interface AlertContextType {
  isAlertActive: boolean
  startAlert: () => void
  stopAlert: () => void
  alertInfo: {
    title: string
    message: string
    sensorId?: string
    location?: string
    timestamp?: Date
  } | null
  setAlertInfo: (info: { title: string; message: string; sensorId?: string; location?: string; timestamp?: Date } | null) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isAlertActive, setIsAlertActive] = useState(false)
  const [alertInfo, setAlertInfo] = useState<{
    title: string
    message: string
    sensorId?: string
    location?: string
    timestamp?: Date
  } | null>(null)
  const [vibrateIntervalId, setVibrateIntervalId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const isPlayingRef = useRef(false)

  // Initialize audio element once on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("/alert.mp3")
      audio.loop = true
      audio.preload = "auto"
      audioRef.current = audio

      // Track playing state via events
      const handlePlay = () => {
        isPlayingRef.current = true
      }
      const handlePause = () => {
        isPlayingRef.current = false
      }
      const handleEnded = () => {
        isPlayingRef.current = false
      }

      audio.addEventListener("play", handlePlay)
      audio.addEventListener("pause", handlePause)
      audio.addEventListener("ended", handleEnded)

      return () => {
        audio.removeEventListener("play", handlePlay)
        audio.removeEventListener("pause", handlePause)
        audio.removeEventListener("ended", handleEnded)
      }
    }
  }, [])

  const startVibration = useCallback(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return
    if (!("vibrate" in navigator)) return

    // Clear any existing interval
    if (vibrateIntervalId !== null) {
      window.clearInterval(vibrateIntervalId)
    }

    // Pattern: vibrate 500ms, pause 300ms, repeat
    const id = window.setInterval(() => {
      navigator.vibrate([500, 300, 500])
    }, 2000)

    setVibrateIntervalId(id)
  }, [vibrateIntervalId])

  const stopVibration = useCallback(() => {
    if (typeof window !== "undefined" && vibrateIntervalId !== null) {
      window.clearInterval(vibrateIntervalId)
      setVibrateIntervalId(null)
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0)
    }
  }, [vibrateIntervalId])

  const startAlert = useCallback(() => {
    // Guard: If an alert is already active, don't start another instance
    if (isAlertActive) {
      return
    }

    // Guard: Check if audio element exists
    if (!audioRef.current) {
      // eslint-disable-next-line no-console
      console.warn("Audio element not initialized")
      return
    }

    const audio = audioRef.current

    // Guard: Check element state - if already playing, don't restart
    if (!audio.paused && isPlayingRef.current) {
      // Already playing, just mark as active
      setIsAlertActive(true)
      startVibration()
      return
    }

    // Mark alert as active
    setIsAlertActive(true)

    // Start audio with proper promise handling
    try {
      // Reset audio to beginning
      audio.currentTime = 0
      audio.loop = true

      // User click on "Alerts Demo" is the gesture that allows play()
      // Always handle the play() promise to avoid uncaught rejections
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        // Store the promise to track pending operations
        playPromiseRef.current = playPromise

        playPromise
          .then(() => {
            // Playback started successfully
            isPlayingRef.current = true
            playPromiseRef.current = null
          })
          .catch((error) => {
            // Handle play errors
            isPlayingRef.current = false
            playPromiseRef.current = null

            // AbortError is expected when pause() interrupts play() - silently handle it
            if (error && error.name === "AbortError") {
              return
            }

            // Log other errors (autoplay restrictions, network issues, etc.)
            // eslint-disable-next-line no-console
            console.warn("Unable to start alert sound:", error)
          })
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Unable to start alert sound:", e)
      isPlayingRef.current = false
      playPromiseRef.current = null
    }

    // Start vibration pattern
    startVibration()
  }, [isAlertActive, startVibration])

  const stopAlert = useCallback(() => {
    setIsAlertActive(false)

    // Stop audio with proper race condition handling
    if (audioRef.current) {
      try {
        const audio = audioRef.current

        // Avoid race condition: If there's a pending play() promise,
        // catch its rejection before pausing to prevent uncaught AbortError
        if (playPromiseRef.current) {
          playPromiseRef.current.catch((error) => {
            // AbortError is expected when pause() interrupts play() - silently handle it
            if (error && error.name === "AbortError") {
              return
            }
            // Log other unexpected errors
            // eslint-disable-next-line no-console
            console.warn("Play promise rejected:", error)
          })
          playPromiseRef.current = null
        }

        // Guard: Only pause if actually playing
        if (!audio.paused) {
          audio.pause()
        }

        // Reset audio state
        audio.currentTime = 0
        audio.loop = false
        isPlayingRef.current = false
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Unable to stop alert sound:", e)
        isPlayingRef.current = false
        playPromiseRef.current = null
      }
    }

    // Stop vibration
    stopVibration()
  }, [stopVibration])

  // Stop alert when user logs out
  useEffect(() => {
    if (!user && isAlertActive) {
      stopAlert()
    }
  }, [user, isAlertActive, stopAlert])

  return (
    <AlertContext.Provider
      value={{
        isAlertActive,
        startAlert,
        stopAlert,
        alertInfo,
        setAlertInfo,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}

