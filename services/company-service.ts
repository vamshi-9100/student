import { apiDelete, apiGet, apiPost } from "@/lib/api";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9999";

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
export interface CompanyCountResponse {
  companyCount: number;
  hasCompanies: boolean;
}
class CompanyService {
  private backendAvailable: boolean | null = null;

  resetBackendCheck() {
    this.backendAvailable = null;
  }

  //get deviceCount
  public async getCompanyCount(): Promise<CompanyCountResponse | null> {
    try {
      const response = await apiGet<CompanyCountResponse>(
        `${API_PREFIX}/company/getCountOfCompanies`
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch device count:", error);
      return null;
    }
  }
}
export const companyService = new CompanyService();
