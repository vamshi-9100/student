import { apiGet } from "@/lib/api";

const API_PREFIX = "/iot/auth";

export interface AppInitResponse {
  logo?: string;
  appName?: string;
  logoUrl?: string;
  appTitle?: string;
  appSubtitle?: string;
  theme?: string;
  companyName?: string;
  companyId?: number | string;
  companyShortName?: string;
  companyLogo?: string;
  [key: string]: unknown;
}

class AppInitService {
  public async initApplication(subdomain: string): Promise<AppInitResponse | null> {
    try {
      const response = await apiGet<AppInitResponse>(
        `${API_PREFIX}/init-application/${subdomain}`,
        {
          skipAuth: true, // This endpoint doesn't require authentication
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to initialize application:", error);
      return null;
    }
  }
}

export const appInitService = new AppInitService();


