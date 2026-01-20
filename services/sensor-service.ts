import { apiDelete, apiGet, apiPost } from "@/lib/api";

const API_PREFIX = "/iot/v1";

// Helper to get companyId and clientId from localStorage
function getCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("iot-selected-company-id");
}

function getClientId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("iot-selected-client-id");
}

export interface SensorReading {
  rawdataId: number;
  sensorId: string;
  incomingCounter: number | null;
  incomingDate: string;
  modifiedDate: string | null;
  numberOfUnits: number;
  sensorDataStatus: string | null;
  usageString: string;
  serviceType: string | null;
  deleteFlag: boolean;
  integrationTransactionId: string | null;
  volume: string | null;
  returnTemperature: string | null;
  diffTemperature: string | null;
  energyConsumption: string | null;
  humidity: string | null;
  battery: string | null;
  temperature: string | null;
  flowTemp: string | null;
  pm25: string | null;
  pm10: string | null;
  pressure: string | null;
  co2: string | null;
  tvoc: string | null;
  hcho: string | null;
  pir: string | null;
  light: string | null;
  buzzer: string | null;
  powerKw: string | null;
  volumeFlowM3h: string | null;
  leakage: string | null;
}

export interface Sensor {
  sensorId: string;
  sensorSerialNumber: string;
  sensorName: string;
  sensorType: string;
  location: string;
  status: "online" | "offline";
  batteryLevel?: number;
  lastSeen?: string;
  devUI?: string;
}

export interface Reading {
  readingId: string;
  sensorSerialNumber: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  soilMoisture?: number;
  ph?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  [key: string]: any;
}
export interface SensorInfo {
  sensorId: number;
  deviceId?: number;
  sensorName: string;
  sensorType: string;
  sensorModel: string;
  sensorSerialNumber: string;
  unitOfMeasurement: string;
  gatewayId: number;
  locationName: string;
  latitude?: number;
  longitude?: number;
  minValue: number;
  maxValue: number;
  calibrationData: string;
  devEUI?: string;
  gatewayname?: String;
  companyId: number;
  clientId?: number;
}

export interface CreateSensorRequest extends Omit<SensorInfo, "sensorId"> {
  sensorId?: number;
}

class SensorService {
  private backendAvailable: boolean | null = null;

  resetBackendCheck() {
    this.backendAvailable = null;
  }

  async getSensors(
    companyId?: number | string | null,
    clientId?: number | string | null
  ): Promise<SensorInfo[]> {
    try {
      // Get companyId and clientId from parameters or localStorage
      const resolvedCompanyId = companyId ?? getCompanyId();
      const resolvedClientId = clientId ?? getClientId();

      // Prepare request body with companyId and clientId
      const requestBody: { companyId: number | null; clientId: number | null } =
        {
          companyId: resolvedCompanyId ? Number(resolvedCompanyId) : null,
          clientId: resolvedClientId ? Number(resolvedClientId) : null,
        };

      // Use POST method with body for getSensorDetails endpoint
      const data = await apiPost<
        SensorInfo[],
        { companyId: number | null; clientId: number | null }
      >(`${API_PREFIX}/sensor/getSensorDetails`, requestBody);
      this.backendAvailable = true;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching sensors:", error);
      this.backendAvailable = false;
      throw new Error(
        "Failed to connect to the sensor API. Please check your connection."
      );
    }
  }

  //delete sensor
  async deleteSensor(sensorId: number): Promise<void> {
    try {
      await apiDelete<void>(`${API_PREFIX}/sensor/${sensorId}`);
    } catch (error) {
      console.error(`Error deleting sensor ${sensorId}:`, error);
      throw new Error("Failed to delete the sensor. Please try again.");
    }
  }

  //get sensor readings
  async getSensorReadings(): Promise<SensorReading[]> {
    try {
      const data = await apiGet<SensorReading[]>(
        `${API_PREFIX}/GetSensorReadings`
      );
      this.backendAvailable = true;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching sensor readings:", error);
      this.backendAvailable = false;
      throw new Error(
        "Failed to connect to the readings API. Please check your connection."
      );
    }
  }

  async createSensor(sensorData: CreateSensorRequest): Promise<SensorInfo> {
    try {
      const data = await apiPost<SensorInfo, CreateSensorRequest>(
        `${API_PREFIX}/sensor/`,
        sensorData
      );
      this.backendAvailable = true;
      return data;
    } catch (error) {
      console.error("Error creating sensor:", error);
      this.backendAvailable = false;
      throw new Error(
        "Failed to create sensor. Please check your connection and try again."
      );
    }
  }

  getLatestReadingForSensor(
    sensorSerialNumber: string,
    readings: SensorReading[]
  ): SensorReading | null {
    // Map sensorSerialNumber to sensorId in readings response
    const sensorReadings = readings.filter(
      (reading) => reading.sensorId === sensorSerialNumber
    );
    if (sensorReadings.length === 0) return null;

    // Sort by incomingDate descending and return the latest
    return sensorReadings.sort(
      (a, b) =>
        new Date(b.incomingDate).getTime() - new Date(a.incomingDate).getTime()
    )[0];
  }

  formatTimeAgo(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      if (diffInMinutes < 10080)
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
      return `${Math.floor(diffInMinutes / 10080)}w ago`;
    } catch {
      return "Unknown";
    }
  }

  isBackendAvailable(): boolean | null {
    return this.backendAvailable;
  }
}

export const sensorService = new SensorService();
