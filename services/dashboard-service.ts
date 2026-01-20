import { apiGet } from "@/lib/api";

const API_PREFIX = "/iot/v1";

export interface DashboardResponse {
  companyCount: number;
  deviceCount: number;
  hasCompanies: boolean;
  hasDevices: boolean;
}

export interface DashboardQueryOptions {
  companyId?: string | null;
  clientId?: string | null;
  signal?: AbortSignal;
}

class DashboardService {
  public async getDashboardData(
    options?: DashboardQueryOptions
  ): Promise<DashboardResponse | null> {
    try {
      const response = await apiGet<DashboardResponse>(`${API_PREFIX}/dashboard`, {
        companyId: options?.companyId ?? undefined,
        clientId: options?.clientId ?? undefined,
        signal: options?.signal,
      });
      return response;
    } catch (error) {
      if (options?.signal?.aborted) {
        return null;
      }
      console.error("Failed to fetch dashboard data:", error);
      return null;
    }
  }
}

export const dashboardService = new DashboardService();

