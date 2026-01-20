import { apiGet, apiPost, checkBackendHealth } from "@/lib/api";

// Updated API base URL
const API_BASE_URL = "https://iotforai.com/iot/v1";
export interface DeviceCountResponse {
  deviceCount: number;
  hasDevices: boolean;
}
const API_PREFIX = "/iot/v1";

// Types for sensor API requests/responses matching the real API structure
export interface CreateSensorRequest {
  deviceId?: number; // Optional foreign key
  sensorType: string; // Required
  unitOfMeasurement: string; // Required
  minValue: number; // Required
  maxValue: number; // Required
  calibrationData: string; // Required
  sensorName: string; // Required
  sensorModel: string; // Required
  sensorSerialNumber: string; // Required
  gatewayId?: number; // Optional foreign key
  locationName: string; // Required
  latitude?: number; // Optional
  longitude?: number; // Optional
}

export interface CreateSensorResponse {
  sensorId: number;
  deviceId?: number;
  sensorType: string;
  unitOfMeasurement: string;
  minValue: number;
  maxValue: number;
  calibrationData: string;
  sensorName: string;
  sensorModel: string;
  sensorSerialNumber: string;
  gatewayId?: number;
  locationName: string;
  latitude?: number;
  longitude?: number;
}

export interface Sensor {
  sensorId: number;
  deviceId?: number;
  sensorType: string;
  unitOfMeasurement: string;
  minValue: number;
  maxValue: number;
  calibrationData: string;
  sensorName: string;
  sensorModel: string;
  sensorSerialNumber: string;
  gatewayId?: number;
  locationName: string;
  latitude?: number;
  longitude?: number;
}

// Types for device API requests/responses
export interface CreateDeviceRequest {
  deviceId?: number;
  deviceName: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  installationDate: string;
  status: string;
  locationId: number;
  gatewayId: number;
  lastCommunication: string;
}

export interface Device {
  deviceId: number;
  deviceName: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  installationDate: string;
  status: string;
  locationId: number;
  gatewayId: number;
  lastCommunication: string;
}

// Device Service Class
export class DeviceService {
  private static instance: DeviceService;
  private backendAvailable: boolean | null = null;

  private constructor() {}

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  // Check if backend is available (cached)
  private async isBackendAvailable(): Promise<boolean> {
    if (this.backendAvailable === null) {
      this.backendAvailable = await checkBackendHealth();
    }
    return this.backendAvailable;
  }

  // Create a new sensor using real API
  public async createSensor(
    sensorData: CreateSensorRequest
  ): Promise<CreateSensorResponse> {
    try {
      // Call real API directly - no fallback to mock
      const response = await apiPost<CreateSensorResponse, CreateSensorRequest>(
        "/sensor/",
        sensorData
      );
      console.log("Sensor created successfully:", response);
      return response;
    } catch (error) {
      console.error("Failed to create sensor via API:", error);
      throw error; // Re-throw the error instead of falling back to mock
    }
  }

  // Create a new device
  public async createDevice(deviceData: CreateDeviceRequest): Promise<Device> {
    const backendAvailable = await this.isBackendAvailable();

    if (backendAvailable) {
      try {
        // Call real API
        const response = await apiPost<Device, CreateDeviceRequest>(
          "/device/",
          deviceData
        );
        return response;
      } catch (error) {
        console.error(
          "Failed to create device via API, falling back to mock:",
          error
        );
        // Fallback to mock if API fails
        return this.createMockDevice(deviceData);
      }
    } else {
      // Use mock implementation
      return this.createMockDevice(deviceData);
    }
  }

  // Get all sensors using real API
  public async getSensors(): Promise<Sensor[]> {
    try {
      // Call real API directly - no fallback to mock
      const sensors = await apiGet<Sensor[]>("/sensor/");
      console.log("Sensors fetched successfully:", sensors);
      return sensors;
    } catch (error) {
      console.error("Failed to fetch sensors via API:", error);
      throw error; // Re-throw the error instead of falling back to mock
    }
  }

  // Get all devices
  public async getDevices(): Promise<Device[]> {
    const backendAvailable = await this.isBackendAvailable();

    if (backendAvailable) {
      try {
        return await apiGet<Device[]>("/device/");
      } catch (error) {
        console.error(
          "Failed to fetch devices via API, falling back to mock:",
          error
        );
        return this.getMockDevices();
      }
    } else {
      return this.getMockDevices();
    }
  }

  // Mock implementation for device creation (kept for devices only)
  private async createMockDevice(
    deviceData: CreateDeviceRequest
  ): Promise<Device> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResponse: Device = {
      deviceId: deviceData.deviceId || Math.floor(Math.random() * 10000),
      deviceName: deviceData.deviceName,
      deviceType: deviceData.deviceType,
      manufacturer: deviceData.manufacturer,
      model: deviceData.model,
      firmwareVersion: deviceData.firmwareVersion,
      installationDate: deviceData.installationDate,
      status: deviceData.status,
      locationId: deviceData.locationId,
      gatewayId: deviceData.gatewayId,
      lastCommunication: deviceData.lastCommunication,
    };

    console.log("Mock device created:", mockResponse);
    return mockResponse;
  }

  // Mock devices data (kept for devices only)
  private async getMockDevices(): Promise<Device[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return [
      {
        deviceId: 1,
        deviceName: "Temperature Monitor 1",
        deviceType: "temperature",
        manufacturer: "SensorTech",
        model: "ST-TEMP-2024",
        firmwareVersion: "1.2.3",
        installationDate: "2024-01-15",
        status: "active",
        locationId: 1,
        gatewayId: 1,
        lastCommunication: "2025-07-10T06:35:23.645Z",
      },
      {
        deviceId: 2,
        deviceName: "Humidity Sensor 1",
        deviceType: "humidity",
        manufacturer: "IoTCorp",
        model: "IC-HUM-100",
        firmwareVersion: "2.1.0",
        installationDate: "2024-02-20",
        status: "active",
        locationId: 2,
        gatewayId: 1,
        lastCommunication: "2025-07-10T06:30:15.234Z",
      },
    ];
  }

  // Get sensor by ID using real API
  public async getSensorById(id: number): Promise<Sensor | null> {
    try {
      return await apiGet<Sensor>(`/sensor/${id}`);
    } catch (error) {
      console.error("Failed to fetch sensor via API:", error);
      throw error;
    }
  }

  // Get device by ID
  public async getDeviceById(id: number): Promise<Device | null> {
    const backendAvailable = await this.isBackendAvailable();

    if (backendAvailable) {
      try {
        return await apiGet<Device>(`/device/${id}`);
      } catch (error) {
        console.error("Failed to fetch device via API:", error);
        return null;
      }
    } else {
      // Mock implementation
      const devices = await this.getMockDevices();
      return devices.find((device) => device.deviceId === id) || null;
    }
  }

  //get deviceCount
  public async getDeviceCount(): Promise<DeviceCountResponse | null> {
    try {
      const response = await apiGet<DeviceCountResponse>(
        `${API_PREFIX}/device/getCountOfDevices`
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch device count:", error);
      return null;
    }
  }

  // Reset backend availability check (useful for retry scenarios)
  public resetBackendCheck(): void {
    this.backendAvailable = null;
  }
}

// Export singleton instance
export const deviceService = DeviceService.getInstance();
