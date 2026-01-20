"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { appInitService, AppInitResponse } from "@/services/app-init-service";
import { useTheme } from "@/contexts/theme-context";

interface AppInitContextType {
  appDetails: AppInitResponse | null;
  logo: string | null;
  appName: string | null;
  appTitle: string | null;
  appSubtitle: string | null;
  companyName: string | null;
  companyShortName: string | null;
  companyId: string | null;
  logoUrl: string | null;
  themePreference: string | null;
  isLoading: boolean;
  initApp: (subdomain: string) => Promise<void>;
}

const AppInitContext = createContext<AppInitContextType | undefined>(undefined);

export function AppInitProvider({ children }: { children: ReactNode }) {
  const [appDetails, setAppDetails] = useState<AppInitResponse | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState<string | null>(null);
  const [appSubtitle, setAppSubtitle] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyShortName, setCompanyShortName] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme: setUiTheme } = useTheme();

  const applyAppInitData = useCallback(
    (data: AppInitResponse) => {
      setAppDetails(data);
      setLogo(data.logo ?? data.companyLogo ?? null);
      setLogoUrl(data.logoUrl ?? null);
      setAppName(data.appName ?? data.appTitle ?? null);
      setAppTitle(data.appTitle ?? data.appName ?? null);
      setAppSubtitle(data.appSubtitle ?? null);
      setCompanyName(data.companyName ?? null);
      setCompanyShortName(
        data.companyShortName ? String(data.companyShortName) : null
      );
      setCompanyId(
        data.companyId !== undefined && data.companyId !== null
          ? String(data.companyId)
          : null
      );
      const normalizedTheme =
        typeof data.theme === "string" ? data.theme.trim().toLowerCase() : null;
      if (normalizedTheme === "dark" || normalizedTheme === "light") {
        setThemePreference(normalizedTheme);
        setUiTheme(normalizedTheme);
      } else {
        setThemePreference(null);
      }
    },
    [setUiTheme]
  );

  const initApp = useCallback(
    async (subdomain: string) => {
      if (!subdomain) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await appInitService.initApplication(subdomain);
        if (response) {
          applyAppInitData(response);
          if (typeof window !== "undefined") {
            const nextTitle = response.companyName
              ? `${response.companyName} - IoT Dashboard`
              : "IoT Dashboard";

            document.title = nextTitle;
            let logoUrl = "";

            if (response.companyLogo) {
              const base64 = response.companyLogo;

              logoUrl = base64.startsWith("data:")
                ? base64
                : `data:image/png;base64,${base64}`;
            }

            // Remove existing favicon(s)
            const icons = document.querySelectorAll("link[rel='icon']");
            icons.forEach((i) => i.remove());
            //falback to default icon
            if (!logoUrl) {
              const link = document.createElement("link");
              link.rel = "icon";
              link.href = "/favicon.ico";
              document.head.appendChild(link);
              return;
            }

            //  Insert new favicon
            const link = document.createElement("link");
            link.rel = "icon";
            link.type = "image/png";
            link.href = logoUrl;
            document.head.appendChild(link);
          }
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAppInitData]
  );

  const contextValue: AppInitContextType = {
    appDetails,
    logo,
    appName,
    appTitle,
    appSubtitle,
    companyName,
    companyShortName,
    companyId,
    logoUrl,
    themePreference,
    isLoading,
    initApp,
  };

  return (
    <AppInitContext.Provider value={contextValue}>
      {children}
    </AppInitContext.Provider>
  );
}

export function useAppInit() {
  const context = useContext(AppInitContext);
  if (context === undefined) {
    throw new Error("useAppInit must be used within an AppInitProvider");
  }
  return context;
}
