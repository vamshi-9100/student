import { apiGet } from "@/lib/api";

const API_PREFIX = "/iot/api";
// Helper to get companyId and clientId from localStorage
function getCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("iot-selected-company-id");
}

function getClientId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("iot-selected-client-id");
}
export interface AlertResponse {
  alertId: number;
  sensorSerialNumber: string;
  companyId: number;
  clientId?: number | null;
  alertType: string;
  alertStatus: string;
  alertMessage?: string | null;
  createdAt: string;
  deactivatedAt?: string | null;
  updatedAt?: string | null;
  type?: "warning" | null;
}
export interface AlertListResponse {
  alerts: AlertResponse[];
  total: number;
}
export interface AlertQueryOptions {
  companyId?: string | null;
  clientId?: string | null;
  alertStatus?: string | null;
}

class AlertService {
  public async listAlerts(
    options?: AlertQueryOptions
  ): Promise<{ alerts: AlertResponse[]; total: number } | null> {
    try {
      const resolvedCompanyId = options?.companyId ?? getCompanyId();
      const resolvedClientId = options?.clientId ?? getClientId();
      const alerts = await apiGet<AlertResponse[]>(
        `${API_PREFIX}/alerts/list`,
        {
          companyId: resolvedCompanyId ?? undefined,
          clientId: resolvedClientId ?? undefined,
          query: {
            alertStatus: options?.alertStatus ?? undefined,
          },
        }
      );

      if (!alerts) return null;

      const total = alerts.length;

      return { alerts, total };
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      return null;
    }
  }
}

export const alertService = new AlertService();
