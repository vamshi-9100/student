"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiPost, authStorage, ApiException } from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "ACCOUNTANT";

interface User {
  id: string;
  username: string;
  role: Role;
  permissions: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

/* =========================================================
   CONSTANTS
========================================================= */

const USER_STORAGE_KEY = "sms-user";
const LOGIN_EXPIRY_KEY = "sms-login-expiry";

const isBrowser = typeof window !== "undefined";

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =========================================================
   HELPERS
========================================================= */

function createTokens(
  accessToken: string,
  refreshToken?: string | null,
  expiresInSeconds?: number | null
): AuthTokens {
  const expiresAt =
    expiresInSeconds && expiresInSeconds > 0
      ? Date.now() + expiresInSeconds * 1000
      : null;

  return {
    accessToken,
    refreshToken: refreshToken ?? null,
    expiresAt,
  };
}

function normalizeUser(raw: unknown): User {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid user payload");
  }

  const data = raw as Record<string, any>;

  return {
    id: String(data.id ?? data.userId),
    username: String(data.username),
    role: String(data.role).toUpperCase() as Role,
    permissions: Array.isArray(data.permissions)
      ? data.permissions.map(String)
      : [],
  };
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    if (error.status === 401) {
      return "Invalid username or password.";
    }
    return error.message ?? "Authentication failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

/* =========================================================
   PROVIDER
========================================================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* =======================================================
     SESSION PERSISTENCE
  ======================================================= */

  const persistSession = useCallback(
    (nextUser: User | null, nextTokens: AuthTokens | null) => {
      setUser(nextUser);
      setTokens(nextTokens);

      if (!isBrowser) return;

      if (nextUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }

      if (nextTokens?.expiresAt) {
        localStorage.setItem(LOGIN_EXPIRY_KEY, String(nextTokens.expiresAt));
      } else {
        localStorage.removeItem(LOGIN_EXPIRY_KEY);
      }
    },
    []
  );

  const clearSession = useCallback(() => {
    persistSession(null, null);
    authStorage.clear();
  }, [persistSession]);

  /* =======================================================
     HYDRATE FROM STORAGE
  ======================================================= */

  useEffect(() => {
    if (!isBrowser || hydrated) return;

    const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
    const expiryRaw = localStorage.getItem(LOGIN_EXPIRY_KEY);

    const expiresAt = expiryRaw ? Number(expiryRaw) : null;
    const stillValid = !expiresAt || expiresAt > Date.now();

    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();

    if (storedUserRaw && stillValid && accessToken) {
      setUser(JSON.parse(storedUserRaw));
      setTokens({
        accessToken,
        refreshToken,
        expiresAt,
      });
    } else if (refreshToken) {
      refreshSession();
    } else {
      clearSession();
    }

    setHydrated(true);
  }, [hydrated]);

  /* =======================================================
     LOGIN
  ======================================================= */

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      setAuthError(null);

      try {
        const response = await apiPost<any, any>(
          "/iot/auth/login",
          { username, password },
          { skipAuth: true }
        );

        const accessToken = response.access_token;
        const refreshToken = response.refresh_token ?? null;
        const expiresIn = response.expiresIn ?? 36000;

        if (!accessToken) {
          throw new Error("Access token missing");
        }
        authStorage.setAccessToken(accessToken, expiresIn);
        authStorage.setRefreshToken(refreshToken);

        const tokens = createTokens(accessToken, refreshToken, expiresIn);
        persistSession(user, tokens);

        setIsLoading(false);
        return true;
      } catch (error) {
        setAuthError(extractErrorMessage(error));
        clearSession();
        setIsLoading(false);
        return false;
      }
    },
    [clearSession, persistSession]
  );

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = useCallback(() => {
    clearSession();
    if (isBrowser) {
      window.location.href = "/login";
    }
  }, [clearSession]);

  /* =======================================================
     REFRESH TOKEN
  ======================================================= */

  const refreshSession = useCallback(async () => {
    if (!tokens?.refreshToken) return false;

    try {
      const response = await apiPost<any, any>(
        "/auth/refresh",
        { refreshToken: tokens.refreshToken },
        { skipAuth: true }
      );

      const accessToken = response.accessToken;
      const expiresIn = response.expiresIn ?? 3600;

      if (!accessToken) {
        throw new Error("Failed to refresh token");
      }

      authStorage.setAccessToken(accessToken, expiresIn);

      const updatedTokens = createTokens(
        accessToken,
        tokens.refreshToken,
        expiresIn
      );

      persistSession(user, updatedTokens);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [tokens, user, persistSession, clearSession]);

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value: AuthContextType = useMemo(
    () => ({
      user,
      tokens,
      login,
      logout,
      refreshSession,
      isLoading,
      authError,
      clearAuthError: () => setAuthError(null),
    }),
    [user, tokens, login, logout, refreshSession, isLoading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* =========================================================
   HOOK
========================================================= */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
