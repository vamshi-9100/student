"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { apiGet, apiPost, authStorage, ApiException } from "@/lib/api"

interface CompanySummary {
  id: string
  name: string
  logoUrl?: string
  logo?: string | unknown
  appName?: string
  documentTitle?: string
  [key: string]: unknown
}

interface ClientSummary {
  id: string
  name: string
  clientId?: string | number
  companyId?: string | number
  company?: CompanySummary
  [key: string]: unknown
}

interface User {
  id: string
  username: string
  email?: string
  role: string
  companyId?: string
  companyName?: string
  companies?: CompanySummary[]
  metadata?: Record<string, unknown>
}

interface AuthTokens {
  accessToken: string
  refreshToken?: string | null
  expiresAt?: number | null
}

interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface LoginOptions {
  useRealAuth?: boolean
  companyId?: string | number | null
}

interface AuthContextType {
  user: User | null
  tokens: AuthTokens | null
  companies: CompanySummary[]
  selectedCompany: CompanySummary | null
  clients: ClientSummary[]
  selectedClient: ClientSummary | null
  selectCompany: (companyId: string | null) => void
  selectClient: (clientId: string | null) => void
  login: (username: string, password: string, options?: LoginOptions) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  isLoading: boolean
  useRealAuth: boolean
  setUseRealAuth: (value: boolean) => void
  authError: string | null
  clearAuthError: () => void
}

const USER_STORAGE_KEY = "iot-user"
const COMPANIES_STORAGE_KEY = "iot-user-companies"
const SELECTED_COMPANY_STORAGE_KEY = "iot-selected-company"
const CLIENTS_STORAGE_KEY = "iot-user-clients"
const SELECTED_CLIENT_STORAGE_KEY = "iot-selected-client"
const USE_REAL_AUTH_KEY = "iot-use-real-auth"
const LOGIN_EXPIRY_KEY = "iot-login-expiry"

const DEFAULT_APP_NAME = "IoT Dashboard"
const DEFAULT_DOCUMENT_TITLE = "IoT Dashboard - Lotus Pacific Technologies"

const isBrowser = typeof window !== "undefined"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function fallbackCompaniesFromUser(user: User | null, defaultList: CompanySummary[] = []): CompanySummary[] {
  if (defaultList.length > 0) {
    return defaultList
  }
  if (user?.companies && user.companies.length > 0) {
    return user.companies
  }
  if (user?.companyId) {
    return [
      {
        id: user.companyId,
        name: user.companyName ?? user.companyId,
      },
    ]
  }
  return []
}

function normalizeCompany(raw: unknown): CompanySummary | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const candidate = raw as Record<string, unknown>
  const idCandidate =
    candidate.id ??
    candidate.companyId ??
    candidate.company_id ??
    candidate.code ??
    candidate.slug ??
    candidate.uuid ??
    candidate.identifier

  const nameCandidate =
    candidate.name ??
    candidate.companyName ??
    candidate.company_name ??
    candidate.displayName ??
    candidate.display_name ??
    candidate.title

  if (!idCandidate && !nameCandidate) {
    return null
  }

  const id = String(idCandidate ?? nameCandidate)
  const name = String(nameCandidate ?? idCandidate ?? DEFAULT_APP_NAME)

  return {
    id,
    name,
    logoUrl:
      (candidate.logoUrl as string | undefined) ??
      (candidate.logo_url as string | undefined) ??
      (candidate.logo as string | undefined) ??
      (candidate.brandLogo as string | undefined),
    appName:
      (candidate.appName as string | undefined) ??
      (candidate.app_name as string | undefined) ??
      (candidate.displayName as string | undefined) ??
      (candidate.display_name as string | undefined),
    documentTitle:
      (candidate.documentTitle as string | undefined) ??
      (candidate.document_title as string | undefined) ??
      (candidate.pageTitle as string | undefined),
    ...candidate,
  }
}

function extractCompanies(rawUser: unknown): CompanySummary[] {
  if (!rawUser || typeof rawUser !== "object") {
    return []
  }

  const userRecord = rawUser as Record<string, unknown>
  const collections: unknown[] = []

  if (Array.isArray(userRecord.companies)) {
    collections.push(...userRecord.companies)
  }

  if (Array.isArray(userRecord.organisations)) {
    collections.push(...userRecord.organisations)
  }

  if (Array.isArray(userRecord.organizations)) {
    collections.push(...userRecord.organizations)
  }

  if (Array.isArray(userRecord.tenants)) {
    collections.push(...userRecord.tenants)
  }

  if (userRecord.company) {
    collections.push(userRecord.company)
  }

  if (userRecord.primaryCompany) {
    collections.push(userRecord.primaryCompany)
  }

  const companies = collections
    .map((entry) => normalizeCompany(entry))
    .filter((company): company is CompanySummary => company !== null)

  const uniqueMap = new Map<string, CompanySummary>()
  companies.forEach((company) => {
    uniqueMap.set(company.id, { ...company })
  })

  return Array.from(uniqueMap.values())
}

function normalizeUser(raw: unknown): User {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid user payload")
  }

  const payload = raw as Record<string, unknown>
  const baseUser: Record<string, unknown> =
    typeof payload.user === "object" && payload.user
      ? (payload.user as Record<string, unknown>)
      : payload

  const companies = extractCompanies(baseUser)
  const primaryCompany =
    normalizeCompany(baseUser.company) ??
    normalizeCompany(baseUser.primaryCompany) ??
    companies[0] ??
    null

  const roleCandidate =
    baseUser.role ??
    (Array.isArray(baseUser.roles) ? baseUser.roles[0] : undefined) ??
    "USER"

  const idCandidate =
    baseUser.id ??
    baseUser.userId ??
    baseUser.user_id ??
    baseUser.username ??
    baseUser.email ??
    "unknown-user"

  const usernameCandidate =
    baseUser.username ?? baseUser.email ?? baseUser.name ?? "user"

  return {
    id: String(idCandidate),
    username: String(usernameCandidate),
    email: baseUser.email ? String(baseUser.email) : undefined,
    role: String(roleCandidate).toUpperCase(),
    companyId:
      (baseUser.companyId as string | undefined) ??
      (baseUser.company_id as string | undefined) ??
      primaryCompany?.id,
    companyName:
      (baseUser.companyName as string | undefined) ??
      (baseUser.company_name as string | undefined) ??
      primaryCompany?.name,
    companies,
    metadata: baseUser,
  }
}

function normalizeClient(raw: unknown): ClientSummary | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const candidate = raw as Record<string, unknown>
  const idCandidate =
    candidate.id ??
    candidate.clientId ??
    candidate.client_id ??
    candidate.code ??
    candidate.slug

  const nameCandidate =
    candidate.name ??
    candidate.clientName ??
    candidate.client_name ??
    candidate.clinetName ??
    candidate.displayName

  if (!idCandidate && !nameCandidate) {
    return null
  }

  const id = String(idCandidate ?? nameCandidate)
  const name = String(nameCandidate ?? idCandidate ?? "Unknown Client")

  const companyId =
    candidate.companyId ??
    candidate.company_id ??
    (candidate.company && typeof candidate.company === "object"
      ? (candidate.company as Record<string, unknown>).companyId ??
        (candidate.company as Record<string, unknown>).company_id
      : undefined)

  return {
    id,
    name,
    clientId: idCandidate ? (typeof idCandidate === "number" ? idCandidate : Number.parseInt(String(idCandidate), 10)) : undefined,
    companyId: companyId ? (typeof companyId === "number" ? companyId : Number.parseInt(String(companyId), 10)) : undefined,
    company: candidate.company ? normalizeCompany(candidate.company) ?? undefined : undefined,
    ...candidate,
  }
}

function determineInitialCompany(
  user: User | null,
  companyList: CompanySummary[],
  storedCompany: CompanySummary | null,
): CompanySummary | null {
  // If there's a stored company selection, use it
  if (storedCompany) {
    const match = companyList.find((company) => company.id === storedCompany.id)
    if (match) {
      return match
    }
  }

  if (!user) {
    // No user - default to Global view (null)
    return null
  }

  const upperRole = user.role?.toUpperCase()

  // For Super Admin, default to Global view (null) to show all data
  if (upperRole === "ROLE_ADMIN") {
    return null
  }

  // For other roles, use their associated company
  if (upperRole !== "ROLE_ADMIN") {
    const companyMatch = companyList.find((company) => company.id === user.companyId)
    if (companyMatch) {
      return companyMatch
    }

    if (user.companyId) {
      return {
        id: user.companyId,
        name: user.companyName ?? user.companyId,
      }
    }
  }

  // Default to Global view (null) to show all data
  return null
}

function determineInitialClient(
  user: User | null,
  clientList: ClientSummary[],
  storedClient: ClientSummary | null,
): ClientSummary | null {
  // If there's a stored client selection, use it
  if (storedClient) {
    const match = clientList.find((client) => client.id === storedClient.id)
    if (match) {
      return match
    }
  }

  if (!user) {
    // No user - default to "All" (null) to show all data
    return null
  }

  const upperRole = user.role?.toUpperCase()

  // For Client Admin/User, use their associated client
  if (upperRole === "CLIENT_ADMIN" || upperRole === "CLIENT_USER") {
    const clientMatch = clientList.find((client) => client.id === user.metadata?.clientId)
    if (clientMatch) {
      return clientMatch
    }
  }

  // Default to "All" (null) to show all data
  return null
}

function updateDocumentMetadata(company: CompanySummary | null, client: ClientSummary | null) {
  if (!isBrowser) {
    return
  }

  // Simple title format: "CompanyName - IoT Dashboard"
  // If no company (Global view), just show "IoT Dashboard"
  const nextTitle = company?.name 
    ? `${company.name} - IoT Dashboard`
    : "IoT Dashboard"

  // Update document title - always update to ensure it's current
  if (document.title !== nextTitle) {
    document.title = nextTitle
  }

  const displayName = client?.name ?? company?.appName ?? company?.name ?? DEFAULT_APP_NAME
  document.documentElement.setAttribute("data-company-name", company?.name ?? DEFAULT_APP_NAME)
  document.documentElement.setAttribute("data-app-name", displayName)
  if (client) {
    document.documentElement.setAttribute("data-client-name", client.name)
  }

  // Update favicon if company has a logo
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    // Try multiple selectors for favicon links
    const faviconSelectors = [
      "link[rel='icon']",
      "link[rel='shortcut icon']",
      "link[rel*='icon']",
    ]
    
    let faviconLink = null
    for (const selector of faviconSelectors) {
      faviconLink = document.querySelector(selector) as HTMLLinkElement | null
      if (faviconLink && faviconLink.rel.includes("icon")) break
    }

    // Check if company has logo, or if client has company with logo
    const companyWithLogo = company || client?.company
    if (companyWithLogo?.logo || companyWithLogo?.logoUrl || company?.logoUrl) {
      let logoUrl = ""
      
      // Check logo first (base64 or data URL) - prioritize company logo, then client's company logo
      const logoToUse = company?.logo || client?.company?.logo || companyWithLogo?.logo
      if (logoToUse) {
        if (typeof logoToUse === "string") {
          if (logoToUse.startsWith("data:") || logoToUse.startsWith("http")) {
            logoUrl = logoToUse
          } else {
            // Assume it's base64
            logoUrl = `data:image/png;base64,${logoToUse}`
          }
        }
      }
      
      // Fallback to logoUrl
      if (!logoUrl) {
        logoUrl = company?.logoUrl || client?.company?.logoUrl || companyWithLogo?.logoUrl || ""
      }

      if (logoUrl) {
        // Remove existing favicon links to avoid duplicates
        const existingFavicons = document.querySelectorAll("link[rel*='icon']")
        existingFavicons.forEach((link) => {
          if (link.getAttribute("rel")?.includes("icon") && !link.getAttribute("rel")?.includes("apple")) {
            link.remove()
          }
        })

        // Create or update favicon link
        const link = document.createElement("link")
        link.rel = "icon"
        link.type = "image/png"
        link.href = logoUrl
        document.head.appendChild(link)
        console.log("Favicon updated to company logo:", company?.name, "Logo URL:", logoUrl.substring(0, 50) + "...")
        
        // Also update apple-touch-icon if it exists
        const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null
        if (appleTouchIcon) {
          appleTouchIcon.href = logoUrl
        }
      } else {
        console.log("No logo URL found for company:", company?.name, "Logo:", company?.logo, "LogoUrl:", company?.logoUrl)
      }
    } else {
      // Reset to default favicon if no company logo
      // Remove existing custom favicons
      const existingFavicons = document.querySelectorAll("link[rel*='icon']")
      existingFavicons.forEach((link) => {
        if (link.getAttribute("rel")?.includes("icon") && !link.getAttribute("rel")?.includes("apple")) {
          link.remove()
        }
      })

      // Create default favicon link (sync with default logo used in login)
      const link = document.createElement("link")
      link.rel = "icon"
      link.type = "image/png"
      link.href = "/images/default_logo.png"
      document.head.appendChild(link)
    }
  }, 0)
}

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null
  }
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.warn("Failed to parse stored JSON value:", error)
    return null
  }
}

function createTokens(accessToken: string, refreshToken?: string | null, expiresInSeconds?: number | null): AuthTokens {
  const expiresAt =
    expiresInSeconds && expiresInSeconds > 0 ? Date.now() + expiresInSeconds * 1000 : null
  return {
    accessToken,
    refreshToken: refreshToken ?? null,
    expiresAt,
  }
}

function extractMessageFromDetails(details: unknown): string | null {
  if (!details) {
    return null
  }

  if (typeof details === "string") {
    const trimmed = details.trim()
    if (!trimmed) {
      return null
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
        return parsed.message.trim()
      }
      return trimmed
    } catch {
      return trimmed
    }
  }

  if (typeof details === "object") {
    const record = details as Record<string, unknown>
    if (typeof record.message === "string" && record.message.trim().length > 0) {
      return record.message.trim()
    }
  }

  return null
}

function extractErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof ApiException) {
    const detailMessage = extractMessageFromDetails(error.details)
    if (detailMessage) {
      return detailMessage
    }

    if (error.status === 401) {
      return "Invalid username or password."
    }
    if (error.status === 404) {
      return "Authentication service is unavailable."
    }
    return error.message || defaultMessage
  }

  if (error instanceof Error) {
    return error.message || defaultMessage
  }

  return defaultMessage
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [companies, setCompanies] = useState<CompanySummary[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [hasFetchedCompanyList, setHasFetchedCompanyList] = useState(false)
  const [useRealAuth, setUseRealAuthState] = useState<boolean>(true)
  const pendingCompanyFetchRef = useRef<Promise<CompanySummary[] | null> | null>(null)
  const pendingClientFetchRef = useRef<Promise<ClientSummary[] | null> | null>(null)
  const pendingUserDetailsFetchRef = useRef<Promise<unknown | null> | null>(null)
  const hasAttemptedUserDetailsRef = useRef<boolean>(false)
  const userDetailsFetchFailedRef = useRef<boolean>(false)
  const hasAttemptedSyncCompaniesRef = useRef<boolean>(false)
  const isSyncingCompaniesRef = useRef<boolean>(false)

  const setUseRealAuth = useCallback((value: boolean) => {
    // Always use real auth - this is kept for API compatibility but does nothing
    setUseRealAuthState(true)
  }, [])

  const persistState = useCallback(
    (
      nextUser: User | null,
      nextTokens: AuthTokens | null,
      nextCompanies: CompanySummary[],
      nextSelectedCompany: CompanySummary | null,
      nextClients: ClientSummary[],
      nextSelectedClient: ClientSummary | null,
      authMode: boolean,
    ) => {
      setUser(nextUser)
      setTokens(nextTokens)
      setCompanies(nextCompanies)
      setSelectedCompany(nextSelectedCompany)
      setClients(nextClients)
      setSelectedClient(nextSelectedClient)
      setUseRealAuthState(authMode)

      if (!isBrowser) {
        return
      }

      if (nextUser) {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
      } else {
        window.localStorage.removeItem(USER_STORAGE_KEY)
      }

      if (nextTokens?.expiresAt) {
        window.localStorage.setItem(LOGIN_EXPIRY_KEY, String(nextTokens.expiresAt))
      } else {
        window.localStorage.removeItem(LOGIN_EXPIRY_KEY)
      }

      if (nextCompanies.length > 0) {
        window.localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(nextCompanies))
      } else {
        window.localStorage.removeItem(COMPANIES_STORAGE_KEY)
      }

      if (nextSelectedCompany) {
        window.localStorage.setItem(
          SELECTED_COMPANY_STORAGE_KEY,
          JSON.stringify(nextSelectedCompany),
        )
        authStorage.setCompanyId(nextSelectedCompany.id)
      } else {
        window.localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY)
        authStorage.setCompanyId(null)
      }

      if (nextClients.length > 0) {
        window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(nextClients))
      } else {
        window.localStorage.removeItem(CLIENTS_STORAGE_KEY)
      }

      if (nextSelectedClient) {
        window.localStorage.setItem(
          SELECTED_CLIENT_STORAGE_KEY,
          JSON.stringify(nextSelectedClient),
        )
        authStorage.setClientId(nextSelectedClient.id)
      } else {
        window.localStorage.removeItem(SELECTED_CLIENT_STORAGE_KEY)
        authStorage.setClientId(null)
      }

      window.localStorage.setItem(USE_REAL_AUTH_KEY, "true")
      updateDocumentMetadata(nextSelectedCompany, nextSelectedClient)
      setHasFetchedCompanyList(authMode && nextCompanies.length > 0)
    },
    [],
  )

  const clearSession = useCallback(() => {
    persistState(null, null, [], null, [], null, true)
    authStorage.clear()
    setHasFetchedCompanyList(false)
    hasAttemptedUserDetailsRef.current = false
    userDetailsFetchFailedRef.current = false
    pendingUserDetailsFetchRef.current = null
    hasAttemptedSyncCompaniesRef.current = false
    isSyncingCompaniesRef.current = false
  }, [persistState])

  useEffect(() => {
    if (!isBrowser || hydrated) {
      return
    }

    // Don't make API calls if we're on the login page
    const currentPath = window.location.pathname
    if (currentPath === "/login" || currentPath.startsWith("/login/")) {
      setHydrated(true)
      return
    }

    const storedUser = safeParse<User>(window.localStorage.getItem(USER_STORAGE_KEY))
    const storedCompanies =
      safeParse<CompanySummary[]>(window.localStorage.getItem(COMPANIES_STORAGE_KEY)) ?? []
    const storedSelectedCompany = safeParse<CompanySummary>(
      window.localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY),
    )

    // Always use real auth
    setUseRealAuthState(true)

    const loginExpiryRaw = window.localStorage.getItem(LOGIN_EXPIRY_KEY)
    const loginExpiry = loginExpiryRaw ? Number.parseInt(loginExpiryRaw, 10) : null

    const expirationValid = !loginExpiry || (loginExpiry && loginExpiry > Date.now())

    if (storedUser && expirationValid) {
      const accessToken = window.localStorage.getItem("iot-access-token")
      const refreshToken = window.localStorage.getItem("iot-refresh-token")
      const accessExpiryRaw = window.localStorage.getItem("iot-access-expiry")
      const accessExpiry = accessExpiryRaw ? Number.parseInt(accessExpiryRaw, 10) : null

      const nextTokens =
        accessToken != null
          ? {
              accessToken,
              refreshToken,
              expiresAt: accessExpiry,
            }
          : null

      const storedClients = safeParse<ClientSummary[]>(window.localStorage.getItem(CLIENTS_STORAGE_KEY)) ?? []
      const storedSelectedClient = safeParse<ClientSummary>(window.localStorage.getItem(SELECTED_CLIENT_STORAGE_KEY))

      // Only fetch fresh data if we have both user and token (user is logged in)
      // Don't fetch on login page - only after successful login or on page refresh after login
      if (accessToken && storedUser && !hasAttemptedUserDetailsRef.current) {
        hasAttemptedUserDetailsRef.current = true
        void (async () => {
          try {
            // Inline fetch to avoid dependency issues - prevent concurrent calls
            if (pendingUserDetailsFetchRef.current) {
              return
            }
            const fetchPromise = (async () => {
              try {
                const userDetails = await apiGet<unknown>("/iot/user/getuserDetails", {
                  accessToken,
                  includeCompanyId: false,
                })
                userDetailsFetchFailedRef.current = false
                return userDetails
              } catch (error) {
                userDetailsFetchFailedRef.current = true
                const errorMessage = error instanceof Error ? error.message : "Failed to fetch user details"
                console.warn("Failed to fetch user details from backend:", error)
                setAuthError(`Unable to load user details: ${errorMessage}`)
                return null
              }
            })()
            pendingUserDetailsFetchRef.current = fetchPromise
            const userDetails = await fetchPromise
            pendingUserDetailsFetchRef.current = null

            if (userDetails) {
              const normalizedUser = normalizeUser(userDetails)
              const companiesFromResponse =
                normalizedUser.companies && normalizedUser.companies.length > 0
                  ? normalizedUser.companies
                  : extractCompanies(userDetails)

              let finalCompanies = fallbackCompaniesFromUser(normalizedUser, companiesFromResponse)
              let finalClients = storedClients
              let initialClient = storedSelectedClient

              const upperRole = normalizedUser.role?.toUpperCase()
              const isCompanyAdmin = upperRole === "COMPANY_ADMIN" || upperRole === "COMPANY_USER" || upperRole === "ROLE_USER"

              // For COMPANY_ADMIN, COMPANY_USER, or ROLE_USER, skip getAllCompanies and fetch clients directly
              if (isCompanyAdmin && normalizedUser.companyId) {
                // Skip getAllCompanies for these roles - it's unnecessary
                // Use the user's companyId to fetch clients
                try {
                  const clientResponse = await apiGet<unknown[] | unknown>("/iot/client/getcleintDetails", {
                    accessToken,
                    includeCompanyId: false,
                    query: { companyId: normalizedUser.companyId },
                  })

                  let responseArray: unknown[] = []
                  if (Array.isArray(clientResponse)) {
                    responseArray = clientResponse
                  } else if (clientResponse && typeof clientResponse === "object") {
                    responseArray = [clientResponse]
                  }

                  const normalizedClients = responseArray
                    .map((entry) => normalizeClient(entry))
                    .filter((client): client is ClientSummary => client !== null)

                  if (normalizedClients.length > 0) {
                    finalClients = normalizedClients
                  }
                  // Default to no client selected (null)
                  initialClient = null
                } catch (error) {
                  console.warn("Failed to fetch clients on reload:", error)
                }
                setHasFetchedCompanyList(false)
              } else {
                // Fetch companies from backend - only use valid endpoint
                try {
                  const response = await apiGet<unknown[]>("/iot/v1/company/getallCompanies", {
                    accessToken,
                    includeCompanyId: false,
                  })
                  if (Array.isArray(response)) {
                    const normalized = response
                      .map((entry) => normalizeCompany(entry))
                      .filter((company): company is CompanySummary => company !== null)
                    if (normalized.length > 0) {
                      finalCompanies = normalized
                      setHasFetchedCompanyList(true)
                    } else {
                      finalCompanies = fallbackCompaniesFromUser(normalizedUser, finalCompanies)
                      setHasFetchedCompanyList(false)
                    }
                  } else {
                    finalCompanies = fallbackCompaniesFromUser(normalizedUser, finalCompanies)
                    setHasFetchedCompanyList(false)
                  }
                } catch (error) {
                  console.warn("Failed to fetch companies from backend:", error)
                  finalCompanies = fallbackCompaniesFromUser(normalizedUser, finalCompanies)
                  setHasFetchedCompanyList(false)
                }

                const initialCompany = determineInitialCompany(normalizedUser, finalCompanies, storedSelectedCompany)

                // Fetch clients if user is company admin or super admin
                if (initialCompany && (upperRole === "COMPANY_ADMIN" || upperRole === "COMPANY_USER" || upperRole === "ROLE_ADMIN")) {
                  try {
                    const clientResponse = await apiGet<unknown[] | unknown>("/iot/client/getcleintDetails", {
                      accessToken,
                      includeCompanyId: false,
                      query: { companyId: initialCompany.id },
                    })

                    let responseArray: unknown[] = []
                    if (Array.isArray(clientResponse)) {
                      responseArray = clientResponse
                    } else if (clientResponse && typeof clientResponse === "object") {
                      responseArray = [clientResponse]
                    }

                    const normalizedClients = responseArray
                      .map((entry) => normalizeClient(entry))
                      .filter((client): client is ClientSummary => client !== null)

                    if (normalizedClients.length > 0) {
                      finalClients = normalizedClients
                      // Default to "All" (null) instead of first client
                      initialClient = determineInitialClient(normalizedUser, finalClients, storedSelectedClient) ?? null
                    }
                  } catch (error) {
                    console.warn("Failed to fetch clients on reload:", error)
                  }
                }
              }

              const initialCompany = isCompanyAdmin && normalizedUser.companyId
                ? finalCompanies.find((c) => c.id === normalizedUser.companyId) ?? fallbackCompaniesFromUser(normalizedUser, [])[0] ?? null
                : determineInitialCompany(normalizedUser, finalCompanies, storedSelectedCompany)

              // For Super Admin, default to Global view (null), otherwise use determined company
              const resolvedInitialCompany = initialCompany ?? (normalizedUser.role?.toUpperCase() === "ROLE_ADMIN" ? null : finalCompanies[0] ?? null)
              persistState(normalizedUser, nextTokens, finalCompanies, resolvedInitialCompany, finalClients, initialClient, true)
            } else {
              // Fallback to stored data if fetch fails
              const initialCompany = determineInitialCompany(storedUser, storedCompanies, storedSelectedCompany)
              const initialClient = determineInitialClient(storedUser, storedClients, storedSelectedClient)
              persistState(storedUser, nextTokens, storedCompanies, initialCompany, storedClients, initialClient, true)
              setHasFetchedCompanyList(storedCompanies.length > 0)
            }
          } catch (error) {
            console.warn("Failed to fetch user details on reload, using stored data:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch user details"
            setAuthError(`Unable to load user details: ${errorMessage}`)
            // Fallback to stored data if fetch fails
            const initialCompany = determineInitialCompany(storedUser, storedCompanies, storedSelectedCompany)
            const initialClient = determineInitialClient(storedUser, storedClients, storedSelectedClient)
            persistState(storedUser, nextTokens, storedCompanies, initialCompany, storedClients, initialClient, true)
            setHasFetchedCompanyList(storedCompanies.length > 0)
          }
        })()
      } else {
        // No token available, use stored data
        const initialCompany = determineInitialCompany(storedUser, storedCompanies, storedSelectedCompany)
        const initialClient = determineInitialClient(storedUser, storedClients, storedSelectedClient)
        persistState(storedUser, nextTokens, storedCompanies, initialCompany, storedClients, initialClient, true)
        setHasFetchedCompanyList(storedCompanies.length > 0)
      }
    } else {
      clearSession()
    }

    setHydrated(true)
  }, [clearSession, hydrated, persistState])

  // Update document metadata whenever company or client changes
  useEffect(() => {
    if (hydrated && isBrowser) {
      updateDocumentMetadata(selectedCompany, selectedClient)
    }
  }, [selectedCompany, selectedClient, hydrated])
  
  // Also update on initial hydration to ensure title is set
  useEffect(() => {
    if (hydrated && isBrowser && selectedCompany === null && document.title !== "IoT Dashboard") {
      // Ensure title is set even if no company is selected
      updateDocumentMetadata(null, null)
    }
  }, [hydrated, selectedCompany])

  const selectCompany = useCallback(
    (companyId: string | null) => {
      if (!companyId) {
        // Global view selected - clear company but keep existing clients for Super Admin
        // For Super Admin, we might want to keep clients visible even in global view
        const upperRole = user?.role?.toUpperCase()
        if (upperRole === "ROLE_ADMIN" && clients.length > 0) {
          // Keep existing clients when switching to global view
          persistState(user, tokens, companies, null, clients, null, true)
        } else {
          persistState(user, tokens, companies, null, [], null, true)
        }
        // Update metadata immediately when company is cleared
        updateDocumentMetadata(null, null)
        return
      }

      const nextCompany = companies.find((company) => company.id === companyId) ?? null
      // When company changes, clear client selection and fetch new clients
      if (nextCompany && tokens?.accessToken) {
        void fetchClientsFromBackend(nextCompany.id, tokens.accessToken).then((fetchedClients) => {
          const finalClients = fetchedClients ?? []
          // Default to "All" (null) when clients are fetched
          persistState(user, tokens, companies, nextCompany, finalClients, null, true)
          // Update metadata immediately after state is persisted
          updateDocumentMetadata(nextCompany, null)
        })
      } else {
        persistState(user, tokens, companies, nextCompany, clients, null, true)
        // Update metadata immediately after state is persisted
        updateDocumentMetadata(nextCompany, null)
      }
    },
    [companies, clients, persistState, tokens, user],
  )

  const selectClient = useCallback(
    (clientId: string | null) => {
      if (!clientId) {
        persistState(user, tokens, companies, selectedCompany, clients, null, true)
        // Update metadata immediately when client is cleared
        updateDocumentMetadata(selectedCompany, null)
        return
      }

      const nextClient = clients.find((client) => client.id === clientId) ?? null
      persistState(user, tokens, companies, selectedCompany, clients, nextClient, true)
      // Update metadata immediately after state is persisted
      updateDocumentMetadata(selectedCompany, nextClient)
    },
    [clients, companies, persistState, selectedCompany, tokens, user],
  )

  const fetchCompaniesFromBackend = useCallback(
    async (accessTokenOverride?: string | null): Promise<CompanySummary[] | null> => {
      if (pendingCompanyFetchRef.current) {
        return pendingCompanyFetchRef.current
      }

      const tokenToUse = accessTokenOverride ?? tokens?.accessToken ?? null
      if (!tokenToUse) {
        return null
      }

      // Only use the valid endpoint
      const endpoints = [
        "/iot/v1/company/getallCompanies",
      ]

      const fetchPromise = (async () => {
        for (const endpoint of endpoints) {
          try {
            const response = await apiGet<unknown[]>(endpoint, {
              accessToken: tokenToUse,
              includeCompanyId: false,
            })
            if (!Array.isArray(response)) {
              continue
            }
            const normalized = response
              .map((entry) => normalizeCompany(entry))
              .filter((company): company is CompanySummary => company !== null)

            if (normalized.length > 0) {
              return normalized
            }
          } catch (error) {
            console.warn(`Failed to fetch companies from ${endpoint}:`, error)
          }
        }
        return null
      })()

      pendingCompanyFetchRef.current = fetchPromise
      const result = await fetchPromise
      pendingCompanyFetchRef.current = null
      return result
    },
    [tokens?.accessToken],
  )

  const fetchUserDetailsFromBackend = useCallback(
    async (accessTokenOverride?: string | null, showError: boolean = true): Promise<unknown | null> => {
      // Prevent concurrent calls
      if (pendingUserDetailsFetchRef.current) {
        return pendingUserDetailsFetchRef.current
      }

      const tokenToUse = accessTokenOverride ?? tokens?.accessToken ?? null
      if (!tokenToUse) {
        return null
      }

      // If we've already failed and this is not a retry, don't try again
      if (userDetailsFetchFailedRef.current && !accessTokenOverride) {
        return null
      }

      const fetchPromise = (async () => {
        try {
          const userDetails = await apiGet<unknown>("/iot/user/getuserDetails", {
            accessToken: tokenToUse,
            includeCompanyId: false,
          })
          userDetailsFetchFailedRef.current = false
          return userDetails
        } catch (error) {
          userDetailsFetchFailedRef.current = true
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch user details"
          console.warn("Failed to fetch user details from backend:", error)
          if (showError) {
            setAuthError(`Unable to load user details: ${errorMessage}`)
          }
          return null
        }
      })()

      pendingUserDetailsFetchRef.current = fetchPromise
      const result = await fetchPromise
      pendingUserDetailsFetchRef.current = null
      return result
    },
    [tokens?.accessToken],
  )

  const fetchClientsFromBackend = useCallback(
    async (companyId: string, accessTokenOverride?: string | null): Promise<ClientSummary[] | null> => {
      if (pendingClientFetchRef.current) {
        return pendingClientFetchRef.current
      }

      const tokenToUse = accessTokenOverride ?? tokens?.accessToken ?? null
      if (!tokenToUse || !companyId) {
        return null
      }

      const endpoint = "/iot/client/getcleintDetails"

      const fetchPromise = (async () => {
        try {
          const response = await apiGet<unknown[] | unknown>(endpoint, {
            accessToken: tokenToUse,
            includeCompanyId: false,
            query: { companyId },
          })

          // Handle both array and single object responses
          let responseArray: unknown[] = []
          if (Array.isArray(response)) {
            responseArray = response
          } else if (response && typeof response === "object") {
            responseArray = [response]
          }

          const normalized = responseArray
            .map((entry) => normalizeClient(entry))
            .filter((client): client is ClientSummary => client !== null)

          return normalized.length > 0 ? normalized : null
        } catch (error) {
          console.warn(`Failed to fetch clients from ${endpoint}:`, error)
          return null
        }
      })()

      pendingClientFetchRef.current = fetchPromise
      const result = await fetchPromise
      pendingClientFetchRef.current = null
      return result
    },
    [tokens?.accessToken],
  )

  const syncCompaniesWithBackend = useCallback(
    async (
      baseUser: User | null,
      baseTokens: AuthTokens | null,
      baseSelectedCompany: CompanySummary | null,
      baseClients: ClientSummary[],
      baseSelectedClient: ClientSummary | null,
      authMode: boolean,
      accessTokenOverride?: string | null,
    ) => {
      // Prevent concurrent calls
      if (isSyncingCompaniesRef.current) {
        return
      }

      isSyncingCompaniesRef.current = true
      try {
        const resolvedUser = baseUser ?? user
        const resolvedTokens = baseTokens ?? tokens

        const upperRole = resolvedUser?.role?.toUpperCase()
        const isCompanyAdmin = upperRole === "COMPANY_ADMIN" || upperRole === "COMPANY_USER" || upperRole === "ROLE_USER"

        let backendCompanies: CompanySummary[] | null = null
        let finalCompanies = fallbackCompaniesFromUser(resolvedUser, companies)

        // For COMPANY_ADMIN, COMPANY_USER, or ROLE_USER, skip getAllCompanies
        if (!isCompanyAdmin) {
          backendCompanies = await fetchCompaniesFromBackend(accessTokenOverride)
          finalCompanies =
            backendCompanies && backendCompanies.length > 0
              ? backendCompanies
              : fallbackCompaniesFromUser(resolvedUser, companies)
        }

        // For Super Admin, default to Global view (null), otherwise use determined company
        const determinedCompany = determineInitialCompany(resolvedUser, finalCompanies, baseSelectedCompany)
        const resolvedSelectedCompany = determinedCompany ?? (resolvedUser?.role?.toUpperCase() === "ROLE_ADMIN" ? null : finalCompanies[0] ?? null)

        // Fetch clients if company is selected or if user is COMPANY_ADMIN/COMPANY_USER/ROLE_USER
        let finalClients = baseClients
        let resolvedSelectedClient = baseSelectedClient
        if (resolvedUser) {
          const companyIdToUse = isCompanyAdmin && resolvedUser.companyId
            ? resolvedUser.companyId
            : resolvedSelectedCompany?.id

          if (companyIdToUse && (upperRole === "COMPANY_ADMIN" || upperRole === "COMPANY_USER" || upperRole === "ROLE_USER" || upperRole === "ROLE_ADMIN")) {
            const backendClients = await fetchClientsFromBackend(companyIdToUse, accessTokenOverride)
            if (backendClients && backendClients.length > 0) {
              finalClients = backendClients
              // For COMPANY_ADMIN/COMPANY_USER/ROLE_USER, default to no client selected (null)
              if (isCompanyAdmin) {
                resolvedSelectedClient = null
              } else {
                // Default to "All" (null) instead of first client
                resolvedSelectedClient = determineInitialClient(resolvedUser, finalClients, baseSelectedClient) ?? null
              }
            }
          }
        }

        persistState(resolvedUser, resolvedTokens, finalCompanies, resolvedSelectedCompany, finalClients, resolvedSelectedClient, true)
        setHasFetchedCompanyList(Boolean(backendCompanies && backendCompanies.length > 0))
        hasAttemptedSyncCompaniesRef.current = true
      } finally {
        isSyncingCompaniesRef.current = false
      }
    },
    [companies, fetchCompaniesFromBackend, fetchClientsFromBackend, persistState, tokens, user],
  )

  const login = useCallback(
    async (username: string, password: string, options?: LoginOptions) => {
      setIsLoading(true)
      setAuthError(null)

      try {
        const payload: { username: string; password: string; companyId?: string | number | null } = {
          username,
          password,
        }
        if (options?.companyId !== undefined && options?.companyId !== null && options.companyId !== "") {
          payload.companyId = options.companyId
        }

        const response = await apiPost<unknown, typeof payload>(
          "/iot/auth/login",
          payload,
          { skipAuth: true, includeCompanyId: false },
        )

        const refreshToken: string | null =
          (response as Record<string, unknown>)?.refresh_token?.toString() ??
          (response as Record<string, unknown>)?.refreshToken?.toString() ??
          null

        const accessToken: string =
          (response as Record<string, unknown>)?.access_token?.toString() ??
          (response as Record<string, unknown>)?.accessToken?.toString() ??
          (response as Record<string, unknown>)?.token?.toString() ??
          ""

        if (!accessToken) {
          throw new Error("Authentication token missing from response.")
        }

        const expiresInRaw =
          (response as Record<string, unknown>)?.expires_in ??
          (response as Record<string, unknown>)?.expiresIn ??
          3600

        const expiresInSeconds = Number(expiresInRaw) || 3600
        authStorage.setAccessToken(accessToken, expiresInSeconds)
        authStorage.setRefreshToken(refreshToken)

        const newTokens = createTokens(accessToken, refreshToken, expiresInSeconds)

        // Fetch user details from backend
        let userDetails: unknown = response
        try {
          userDetails = await fetchUserDetailsFromBackend(accessToken, true)
          if (!userDetails) {
            // Fallback to login response if fetch fails
            userDetails = response
          }
        } catch (error) {
          console.warn("Failed to fetch user details, using login response:", error)
          const errorMessage = error instanceof Error ? error.message : "Failed to fetch user details"
          setAuthError(`Unable to load user details: ${errorMessage}`)
          userDetails = response
        }

        const normalizedUser = normalizeUser(userDetails)
        const companiesFromResponse =
          normalizedUser.companies && normalizedUser.companies.length > 0
            ? normalizedUser.companies
            : extractCompanies(userDetails)

        let finalCompanies = fallbackCompaniesFromUser(normalizedUser, companiesFromResponse)
        let finalClients: ClientSummary[] = []
        let initialClient: ClientSummary | null = null

        const upperRole = normalizedUser.role?.toUpperCase()
        const isCompanyAdmin = upperRole === "COMPANY_ADMIN" || upperRole === "COMPANY_USER" || upperRole === "ROLE_USER"

        // For COMPANY_ADMIN, COMPANY_USER, or ROLE_USER, skip getAllCompanies
        if (!isCompanyAdmin) {
          const backendCompanies = await fetchCompaniesFromBackend(accessToken)
          if (backendCompanies && backendCompanies.length > 0) {
            finalCompanies = backendCompanies
            setHasFetchedCompanyList(true)
            hasAttemptedSyncCompaniesRef.current = true
          } else {
            finalCompanies = fallbackCompaniesFromUser(normalizedUser, finalCompanies)
            setHasFetchedCompanyList(false)
          }
        } else {
          setHasFetchedCompanyList(false)
        }

        const initialCompany = determineInitialCompany(normalizedUser, finalCompanies, null)
        
        // Fetch clients if user is company admin or super admin
        const companyIdToUse = isCompanyAdmin && normalizedUser.companyId
          ? normalizedUser.companyId
          : initialCompany?.id

        if (companyIdToUse && (upperRole === "COMPANY_ADMIN" || upperRole === "COMPANY_USER" || upperRole === "ROLE_USER" || upperRole === "ROLE_ADMIN")) {
          const backendClients = await fetchClientsFromBackend(companyIdToUse, accessToken)
          if (backendClients && backendClients.length > 0) {
            finalClients = backendClients
            // For COMPANY_ADMIN/COMPANY_USER/ROLE_USER, default to no client selected (null)
            if (isCompanyAdmin) {
              initialClient = null
            } else {
              // Default to "All" (null) instead of first client
              initialClient = determineInitialClient(normalizedUser, finalClients, null) ?? null
            }
          }
        }

        // For Super Admin, default to Global view (null), otherwise use determined company
        const resolvedInitialCompany = initialCompany ?? (normalizedUser.role?.toUpperCase() === "ROLE_ADMIN" ? null : finalCompanies[0] ?? null)
        persistState(normalizedUser, newTokens, finalCompanies, resolvedInitialCompany, finalClients, initialClient, true)

      setIsLoading(false)
      return true
      } catch (error) {
        const message = extractErrorMessage(error, "Unable to sign in. Please try again.")
        setAuthError(message)
        console.error("Login failed:", error)
        // Clear context on login failure
        clearSession()
        setIsLoading(false)
        return false
      }
    },
    [persistState, fetchUserDetailsFromBackend, fetchCompaniesFromBackend, fetchClientsFromBackend, clearSession],
  )

  const register = useCallback(
    async (userData: RegisterData): Promise<boolean> => {
      setIsLoading(true)
      setAuthError(null)

      if (userData.password !== userData.confirmPassword) {
        setAuthError("Passwords do not match.")
    setIsLoading(false)
    return false
  }

      try {
        // Call backend registration API
        const response = await apiPost<unknown, RegisterData>(
          "/iot/auth/register",
          userData,
          { skipAuth: true, includeCompanyId: false },
        )

        // After successful registration, attempt to login
        const loginResult = await login(userData.username, userData.password)
        setIsLoading(false)
        return loginResult
      } catch (error) {
        const message = extractErrorMessage(error, "Unable to register. Please try again.")
        setAuthError(message)
        console.error("Registration failed:", error)
        setIsLoading(false)
        return false
      }
    },
    [login],
  )

  const logout = useCallback(async () => {
    // Clear context and redirect to login - no API call needed
    clearSession()
    if (isBrowser) {
      window.location.href = "/login"
    }
  }, [clearSession])

  const refreshSession = useCallback(async () => {
    const refreshToken = tokens?.refreshToken

    if (!refreshToken) {
    return false
  }

    try {
      const response = await apiPost(
        "/iot/auth/refresh",
        { refresh_token: refreshToken },
        { skipAuth: true, includeCompanyId: false, refreshToken },
      )

      const accessToken: string =
        (response as Record<string, unknown>)?.access_token?.toString() ??
        (response as Record<string, unknown>)?.accessToken?.toString() ??
        (response as Record<string, unknown>)?.token?.toString() ??
        ""

      if (!accessToken) {
        throw new Error("Failed to refresh access token.")
      }

      const newRefreshToken: string | null =
        (response as Record<string, unknown>)?.refresh_token?.toString() ??
        (response as Record<string, unknown>)?.refreshToken?.toString() ??
        refreshToken

      const expiresInRaw =
        (response as Record<string, unknown>)?.expires_in ??
        (response as Record<string, unknown>)?.expiresIn ??
        3600

      const expiresInSeconds = Number(expiresInRaw) || 3600

      authStorage.setAccessToken(accessToken, expiresInSeconds)
      authStorage.setRefreshToken(newRefreshToken)

      const updatedTokens = createTokens(accessToken, newRefreshToken, expiresInSeconds)
      persistState(user, updatedTokens, companies, selectedCompany, clients, selectedClient, true)
      setHasFetchedCompanyList(false)

      return true
    } catch (error) {
      console.error("Failed to refresh session:", error)
      clearSession()
      return false
    }
  }, [clearSession, companies, clients, persistState, selectedCompany, selectedClient, tokens?.refreshToken, user])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }
    if (hasFetchedCompanyList) {
      return
    }
    if (!tokens?.accessToken) {
      return
    }
    // Only attempt once per session
    if (hasAttemptedSyncCompaniesRef.current) {
      return
    }

    hasAttemptedSyncCompaniesRef.current = true
    void syncCompaniesWithBackend(user, tokens, selectedCompany, clients, selectedClient, true, tokens.accessToken)
  }, [
    hydrated,
    hasFetchedCompanyList,
    tokens?.accessToken,
  ])

  useEffect(() => {
    setHasFetchedCompanyList((prev) => prev && companies.length > 0)
  }, [companies.length])

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      tokens,
      companies,
      selectedCompany,
      clients,
      selectedClient,
      selectCompany,
      selectClient,
      login,
      register,
      logout,
      refreshSession,
      isLoading,
      useRealAuth,
      setUseRealAuth,
      authError,
      clearAuthError,
    }),
    [
      authError,
      clearAuthError,
      clients,
      companies,
      isLoading,
      login,
      logout,
      refreshSession,
      register,
      selectClient,
      selectCompany,
      selectedClient,
      selectedCompany,
      tokens,
      useRealAuth,
      setUseRealAuth,
      user,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
