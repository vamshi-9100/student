import { create } from "zustand"
import { persist } from "zustand/middleware"
import { sensorService, type SensorInfo, type SensorReading } from "@/services/sensor-service"

interface SensorWithReading extends SensorInfo {
  latestReading?: SensorReading|null
  isOnline: boolean
  lastSeen: string
}

interface SensorStore {
  sensors: SensorInfo[]
  readings: SensorReading[]
  sensorsWithReadings: SensorWithReading[]
  loading: boolean
  error: string | null
  lastFetch: number | null

  // Actions
  fetchSensors: () => Promise<void>
  fetchReadings: () => Promise<void>
  fetchAll: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useSensorStore = create<SensorStore>()(
  persist(
    (set, get) => ({
      sensors: [],
      readings: [],
      sensorsWithReadings: [],
      loading: false,
      error: null,
      lastFetch: null,

      fetchSensors: async () => {
        try {
          set({ loading: true, error: null })
          const sensors = await sensorService.getSensors()
          set({ sensors })

          // Update combined data
          const { readings } = get()
          const combined = combineSensorsWithReadings(sensors, readings)
          set({ sensorsWithReadings: combined, lastFetch: Date.now() })
        } catch (error: any) {
          set({ error: error.message || "Failed to fetch sensors" })
        } finally {
          set({ loading: false })
        }
      },

      fetchReadings: async () => {
        try {
          set({ loading: true, error: null })
          const readings = await sensorService.getSensorReadings()
          set({ readings })

          // Update combined data
          const { sensors } = get()
          const combined = combineSensorsWithReadings(sensors, readings)
          set({ sensorsWithReadings: combined, lastFetch: Date.now() })
        } catch (error: any) {
          set({ error: error.message || "Failed to fetch readings" })
        } finally {
          set({ loading: false })
        }
      },

      fetchAll: async () => {
        try {
          set({ loading: true, error: null })
          sensorService.resetBackendCheck()

          const [sensors, readings] = await Promise.all([sensorService.getSensors(), sensorService.getSensorReadings()])

          const combined = combineSensorsWithReadings(sensors, readings)

          set({
            sensors,
            readings,
            sensorsWithReadings: combined,
            lastFetch: Date.now(),
          })
        } catch (error: any) {
          set({ error: error.message || "Failed to fetch data" })
        } finally {
          set({ loading: false })
        }
      },

      clearError: () => set({ error: null }),
      reset: () =>
        set({
          sensors: [],
          readings: [],
          sensorsWithReadings: [],
          loading: false,
          error: null,
          lastFetch: null,
        }),
    }),
    {
      name: "sensor-store",
      partialize: (state) => ({
        sensors: state.sensors,
        readings: state.readings,
        sensorsWithReadings: state.sensorsWithReadings,
        lastFetch: state.lastFetch,
      }),
    },
  ),
)

// Helper function to combine sensors with readings
function combineSensorsWithReadings(sensors: SensorInfo[], readings: SensorReading[]): SensorWithReading[] {
  return sensors
    .map((sensor) => {
      // Map sensorSerialNumber to sensorId in readings
      const latestReading = sensorService.getLatestReadingForSensor(sensor.sensorSerialNumber, readings)

      const isOnline = latestReading !== null
      const lastSeen = latestReading ? sensorService.formatTimeAgo(latestReading.incomingDate) : "Never"

      return {
        ...sensor,
        latestReading,
        isOnline,
        lastSeen,
      }
    })
    .sort((a, b) => {
      // Sort online sensors first
      if (a.isOnline && !b.isOnline) return -1
      if (!a.isOnline && b.isOnline) return 1

      // Then sort by last seen (most recent first)
      if (a.latestReading && b.latestReading) {
        return new Date(b.latestReading.incomingDate).getTime() - new Date(a.latestReading.incomingDate).getTime()
      }

      return 0
    })
}
