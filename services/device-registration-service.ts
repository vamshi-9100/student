import { apiPost } from "@/lib/api"

const API_PREFIX = "/iot/mobile/device"

export interface RegisterDeviceRequest {
  deviceId: string
  deviceToken: string
  appVersion: string
  osType: string
  osVersion: string
  userId?: string | null
  companyId?: string | null
  clientId?: string | null
  deviceName?: string | null
}

export interface RegisterDeviceResponse {
  deviceId: string
  deviceToken: string
  registeredAt: string
  [key: string]: unknown
}

export interface StoredDeviceRegistration extends RegisterDeviceResponse {
  deviceName?: string | null
  userId?: string | null
  companyId?: string | null
  clientId?: string | null
}

const DEVICE_REGISTRATION_STORAGE_KEY = "iot-device-registrations-v2"
const DEVICE_ID_STORAGE_KEY = "iot-device-unique-id"

function hashString(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Generate or retrieve a stable device id for this browser/device
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return `WEB_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing

  const fingerprintParts = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String((navigator as any).hardwareConcurrency ?? ""),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  ].join("|")

  // Deterministic device id derived from device/browser properties to stay stable per device
  const hash = hashString(fingerprintParts)
  const deviceId = `WEB_${hash}`
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId)
  return deviceId
}

function loadRegistrations(): StoredDeviceRegistration[] {
  if (typeof window === "undefined") return []
  const stored = window.localStorage.getItem(DEVICE_REGISTRATION_STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRegistrations(registrations: StoredDeviceRegistration[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DEVICE_REGISTRATION_STORAGE_KEY, JSON.stringify(registrations))
}

export function storeDeviceRegistration(data: StoredDeviceRegistration): void {
  const list = loadRegistrations()
  const idx = list.findIndex(
    (entry) =>
      entry.deviceId === data.deviceId &&
      entry.userId === data.userId &&
      entry.companyId === data.companyId
  )
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...data }
  } else {
    list.push(data)
  }
  saveRegistrations(list)
}

export function getStoredDeviceRegistrations(
  userId?: string | null,
  companyId?: string | null
): StoredDeviceRegistration[] {
  const list = loadRegistrations()
  if (!userId && !companyId) return list
  return list.filter((entry) => {
    const userMatch = userId ? entry.userId === userId : true
    const companyMatch = companyId ? entry.companyId === companyId : true
    return userMatch && companyMatch
  })
}

export function removeStoredDeviceRegistration(
  deviceId: string,
  userId?: string | null,
  companyId?: string | null
): void {
  const list = loadRegistrations().filter((entry) => {
    const sameDevice = entry.deviceId === deviceId
    const sameUser = userId ? entry.userId === userId : true
    const sameCompany = companyId ? entry.companyId === companyId : true
    // remove only matching; keep all others
    return !(sameDevice && sameUser && sameCompany)
  })
  saveRegistrations(list)
}

export function clearDeviceRegistrations(): void {
  saveRegistrations([])
}

class DeviceRegistrationService {
  public async registerDevice(
    request: RegisterDeviceRequest
  ): Promise<StoredDeviceRegistration | null> {
    try {
      const response = await apiPost<RegisterDeviceResponse, RegisterDeviceRequest>(
        `${API_PREFIX}/registerDevices`,
        request
      )

      if (response) {
        // Store registration info with metadata
        const stored: StoredDeviceRegistration = {
          ...response,
          deviceName: request.deviceName ?? null,
          userId: request.userId ?? null,
          companyId: request.companyId ?? null,
          clientId: request.clientId ?? null,
        }
        storeDeviceRegistration(stored)
        return stored
      }

      return null
    } catch (error) {
      console.error("Failed to register device:", error)
      throw error
    }
  }
}

export const deviceRegistrationService = new DeviceRegistrationService()

