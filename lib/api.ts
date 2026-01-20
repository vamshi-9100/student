const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8888";

const isBrowser = typeof window !== "undefined";

const ACCESS_TOKEN_KEY = "iot-access-token";
const REFRESH_TOKEN_KEY = "iot-refresh-token";
const ACCESS_EXPIRY_KEY = "iot-access-expiry";

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface ApiRequestOptions {
  /**
   * When true, do not attach auth headers or attempt token refresh.
   */
  skipAuth?: boolean;
  /**
   * Optional access token override.
   */
  accessToken?: string | null;
  /**
   * Optional refresh token override (used internally when retrying).
   */
  refreshToken?: string | null;
  /**
   * Explicit companyId to send with the request.
   */
  companyId?: string | null;
  /**
   * Explicit clientId to send with the request.
   */
  clientId?: string | null;
  /**
   * Custom headers to merge into the request.
   */
  headers?: Record<string, string>;
  /**
   * Query parameters to append to the endpoint.
   */
  query?: Record<string, string | number | boolean | undefined | null>;
  /**
   * When false, do not include company data automatically.
   */
  includeCompanyId?: boolean;
  /**
   * When false, do not include client data automatically.
   */
  includeClientId?: boolean;
  signal?: AbortSignal;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiException extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.details = details;
  }
}

let refreshPromise: Promise<string | null> | null = null;

function getStoredValue(key: string): string | null {
  if (!isBrowser) {
    return null;
  }
  return window.localStorage.getItem(key);
}

function setStoredValue(key: string, value: string | null) {
  if (!isBrowser) {
    return;
  }
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
}

function resolveAccessToken(options?: ApiRequestOptions): string | null {
  if (options?.skipAuth) {
    return null;
  }

  if (options?.accessToken) {
    return options.accessToken;
  }

  const token = getStoredValue(ACCESS_TOKEN_KEY);
  const expiry = getStoredValue(ACCESS_EXPIRY_KEY);

  if (!token) {
    return null;
  }

  if (expiry) {
    const expiryTime = Number.parseInt(expiry, 10);
    if (!Number.isNaN(expiryTime) && expiryTime < Date.now()) {
      // Token expired; let caller trigger refresh.
      return token;
    }
  }

  return token;
}

function resolveRefreshToken(options?: ApiRequestOptions): string | null {
  if (options?.skipAuth) {
    return null;
  }

  if (options?.refreshToken) {
    return options.refreshToken;
  }

  return getStoredValue(REFRESH_TOKEN_KEY);
}
function buildUrl(endpoint: string, options?: ApiRequestOptions): string {
  const baseUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(baseUrl, "http://dummy-base");

  const queryParams = options?.query ?? {};
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  // The dummy base ensures correct relative handling; strip it before returning.
  return url.href.replace(url.origin, "");
}

async function refreshAccessToken(
  options?: ApiRequestOptions
): Promise<string | null> {
  if (options?.skipAuth) {
    return null;
  }

  if (!isBrowser) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = resolveRefreshToken(options);

      if (!refreshToken) {
        refreshPromise = null;
        return null;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/iot/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to refresh token:", errorText);
          setStoredValue(ACCESS_TOKEN_KEY, null);
          setStoredValue(REFRESH_TOKEN_KEY, null);
          setStoredValue(ACCESS_EXPIRY_KEY, null);
          refreshPromise = null;
          return null;
        }

        const data = await response.json();
        const newAccessToken: string | null =
          data?.access_token ?? data?.accessToken ?? data?.token ?? null;
        const newRefreshToken: string | null =
          data?.refresh_token ?? data?.refreshToken ?? refreshToken ?? null;
        const expiresIn: number | null =
          data?.expires_in ?? data?.expiresIn ?? data?.expires ?? null;

        setStoredValue(ACCESS_TOKEN_KEY, newAccessToken);
        setStoredValue(REFRESH_TOKEN_KEY, newRefreshToken);
        if (expiresIn) {
          const expiryTimestamp = Date.now() + Number(expiresIn) * 1000;
          setStoredValue(ACCESS_EXPIRY_KEY, expiryTimestamp.toString());
        }

        refreshPromise = null;
        return newAccessToken;
      } catch (error) {
        console.error("Unexpected error while refreshing access token:", error);
        setStoredValue(ACCESS_TOKEN_KEY, null);
        setStoredValue(REFRESH_TOKEN_KEY, null);
        setStoredValue(ACCESS_EXPIRY_KEY, null);
        refreshPromise = null;
        return null;
      }
    })();
  }

  return refreshPromise;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson =
    contentType.includes("application/json") || contentType.includes("+json");

  if (!isJson) {
    await response.text(); // consume body to avoid locking the stream
    return {} as T;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiException("Invalid JSON response from API", response.status);
  }
}

async function makeRequest<TResponse, TRequest = unknown>(
  method: HttpMethod,
  endpoint: string,
  body?: TRequest,
  options?: ApiRequestOptions,
  retrying = false
): Promise<TResponse> {
  const url = buildUrl(endpoint, options);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers ?? {}),
  };

  const accessToken = resolveAccessToken(options);
  if (accessToken && !options?.skipAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers,
      body:
        method === "GET" || method === "DELETE"
          ? undefined
          : JSON.stringify(body),
      signal: options?.signal,
    });

    if (response.ok) {
      if (response.status === 204) {
        return {} as TResponse;
      }
      return parseJsonResponse<TResponse>(response);
    }

    if (response.status === 401 && !retrying && !options?.skipAuth) {
      const refreshedToken = await refreshAccessToken(options);

      if (refreshedToken) {
        return makeRequest<TResponse, TRequest>(
          method,
          endpoint,
          body,
          { ...options, accessToken: refreshedToken },
          true
        );
      }
    }

    const errorText = await response.text();
    throw new ApiException(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorText
    );
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiException(
        "Network error: Unable to connect to the API server"
      );
    }

    throw new ApiException(
      `Unexpected error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function apiGet<T>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  return makeRequest<T>("GET", endpoint, undefined, options);
}

export async function apiPost<TResponse, TRequest>(
  endpoint: string,
  data: TRequest,
  options?: ApiRequestOptions
): Promise<TResponse> {
  return makeRequest<TResponse, TRequest>("POST", endpoint, data, options);
}

export async function apiPut<TResponse, TRequest>(
  endpoint: string,
  data: TRequest,
  options?: ApiRequestOptions
): Promise<TResponse> {
  return makeRequest<TResponse, TRequest>("PUT", endpoint, data, options);
}

export async function apiDelete<T>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<T> {
  return makeRequest<T>("DELETE", endpoint, undefined, options);
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.warn("Backend health check failed:", error);
    return false;
  }
}

export const authStorage = {
  getAccessToken(): string | null {
    return getStoredValue(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return getStoredValue(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token: string | null, expiresInSeconds?: number | null) {
    setStoredValue(ACCESS_TOKEN_KEY, token);
    if (expiresInSeconds) {
      const expiryTimestamp = Date.now() + expiresInSeconds * 1000;
      setStoredValue(ACCESS_EXPIRY_KEY, expiryTimestamp.toString());
    } else if (token === null) {
      setStoredValue(ACCESS_EXPIRY_KEY, null);
    }
  },

  setRefreshToken(token: string | null) {
    setStoredValue(REFRESH_TOKEN_KEY, token);
  },

  clear() {
    setStoredValue(ACCESS_TOKEN_KEY, null);
    setStoredValue(REFRESH_TOKEN_KEY, null);
    setStoredValue(ACCESS_EXPIRY_KEY, null);
  },
};
