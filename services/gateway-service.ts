import { apiGet, apiPost } from "@/lib/api";

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

export interface GatewayInfo {
  gatewayId: number;
  gatewayName: string;
  gatewayType: string;
  ipAddress: string;
  status: String;
  isActive: boolean;
  model: string;
  region: string;
  serialNumber: string;
  firmwareVersion: string;
  hardwareVersion: string;
  cpuLoad: string;
  locationName: string;
  latitude?: string;
  longitude?: string;
  ramCapacity?: string;
  ramAvailable?: string;
  emmcAvailable?: string;
  emmcCapacity?: string;
  lastSeen: "2024-01-15T10:30:00Z";
  devicesConnected: 12;
  signalStrength: 85;
  companyId: number;
  clientId: number;
}

export interface CreateGatewayRequest extends Omit<GatewayInfo, "gatewayId"> {
  gatewayId?: number;
}

class GatewayService {
  private backendAvailable: boolean | null = null;

  resetBackendCheck() {
    this.backendAvailable = null;
  }

  /* async getGateways(): Promise<GatewayInfo[]> {
    try {
      const data = await apiGet<GatewayInfo[]>(
        `${API_PREFIX}/GetGatewayDetails`
      );
      this.backendAvailable = true;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching gateways:", error);
      this.backendAvailable = false;
      throw new Error(
        "Failed to connect to the gateway API. Please check your connection."
      );
    }
  }*/
  async getGateways(
    companyId?: number | string | null,
    clientId?: number | string | null
  ): Promise<GatewayInfo[]> {
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
        GatewayInfo[],
        { companyId: number | null; clientId: number | null }
      >(`${API_PREFIX}/GetGatewayDetails`, requestBody);
      this.backendAvailable = true;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching gateways:", error);
      this.backendAvailable = false;
      throw new Error(
        "Failed to connect to the sensor API. Please check your connection."
      );
    }
  }

  async createGateway(gatewayData: CreateGatewayRequest): Promise<GatewayInfo> {
    try {
      const data = await apiPost<GatewayInfo, CreateGatewayRequest>(
        `${API_PREFIX}/AddGateway`,
        gatewayData
      );
      this.backendAvailable = true;
      return data;
    } catch (error) {
      console.error("Error creating gateway:", error);
      this.backendAvailable = false;
      throw new Error(
        "Failed to create gateway. Please check your connection and try again."
      );
    }
  }
}
export const gatewayService = new GatewayService();
