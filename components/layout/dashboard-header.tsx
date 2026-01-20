"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { useAlert } from "@/contexts/alert-context"
import { useAppInit } from "@/contexts/app-init-context"
import { getTextSize } from "@/lib/text-sizes"
import Link from "next/link"
import {
  User,
  Settings,
  Users,
  MapPin,
  Code,
  LogOut,
  Bell,
  Menu,
  Languages,
  Building,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, logout, companies, selectedCompany, clients, selectedClient, selectCompany, selectClient, authError, clearAuthError } = useAuth()
  const { isAlertActive, stopAlert } = useAlert()
  const { t, language, setLanguage, isRTL } = useLanguage()
  const { logo, logoUrl, appName } = useAppInit()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = useMemo(() => searchParams?.toString() ?? "", [searchParams])


  const userRole = user?.role?.toUpperCase() ?? ""
  const isSuperAdmin = userRole === "ROLE_ADMIN"
  const isCompanyAdmin = userRole === "COMPANY_ADMIN" || userRole === "COMPANY_USER" || userRole === "ROLE_USER"
  const companyOptions = useMemo(() => companies ?? [], [companies])
  const clientOptions = useMemo(() => clients ?? [], [clients])

  const normalizeLogo = useCallback((candidate?: unknown): string | null => {
    if (typeof candidate !== "string" || candidate.length === 0) {
      return null
    }
    if (candidate.startsWith("data:") || candidate.startsWith("http")) {
      return candidate
    }
    return `data:image/png;base64,${candidate}`
  }, [])

  const entityLogo = useMemo(() => {
    const clientCompanyLogo =
      normalizeLogo(selectedClient?.company?.logo) ??
      normalizeLogo(selectedClient?.company?.logoUrl)
    if (clientCompanyLogo) {
      return clientCompanyLogo
    }
    return (
      normalizeLogo(selectedCompany?.logo) ??
      normalizeLogo(selectedCompany?.logoUrl)
    )
  }, [normalizeLogo, selectedClient, selectedCompany])

  const initLogo = useMemo(() => {
    return normalizeLogo(logoUrl) ?? normalizeLogo(logo)
  }, [logo, logoUrl, normalizeLogo])

  const logoSrc = useMemo(() => {
    const defaultLogo = "/images/default_logo.png"
    if (selectedCompany || selectedClient) {
      return entityLogo ?? initLogo ?? defaultLogo
    }
    return initLogo ?? defaultLogo
  }, [entityLogo, initLogo, selectedClient, selectedCompany])

  const companyNameDisplay = selectedClient?.name ?? selectedCompany?.appName ?? selectedCompany?.name ?? appName ?? "IoT Dashboard"
  const logoAlt = `${companyNameDisplay} Logo`
  const shouldUnoptimizeLogo = useMemo(() => {
    if (!logoSrc) {
      return false
    }
    return logoSrc.startsWith("http") || logoSrc.startsWith("data:")
  }, [logoSrc])

  const languageLabel = useMemo(() => {
    if (language === "en") {
      return t("english")
    }
    if (language === "es") {
      return t("spanish")
    }
    if (language === "fr") {
      return t("french")
    }
    if (language === "de") {
      return t("german")
    }
    return t("arabic")
  }, [language, t])

  const roleLabel = useMemo(() => {
    if (!user?.role) {
      return ""
    }
    // Format role nicely: ROLE_ADMIN -> Admin, COMPANY_ADMIN -> Company Admin, etc.
    const role = user.role.toUpperCase()
    if (role === "ROLE_ADMIN") {
      return "Super Admin"
    }
    if (role === "COMPANY_ADMIN") {
      return "Company Admin"
    }
    if (role === "COMPANY_USER" || role === "ROLE_USER") {
      return "Company User"
    }
    if (role === "CLIENT_ADMIN") {
      return "Client Admin"
    }
    if (role === "CLIENT_USER") {
      return "Client User"
    }
    // Fallback: replace underscores and capitalize
    return user.role
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }, [user?.role])

  const handleCompanyChange = (value: string) => {
    // "global" means show all companies (no filter)
    if (value === "global") {
      selectCompany(null)
    } else {
      selectCompany(value || null)
    }
  }

  const handleClientChange = (value: string) => {
    // "all" means show all clients (no filter)
    if (value === "all") {
      selectClient(null)
    } else {
      selectClient(value || null)
    }
  }

  useEffect(() => {
    if (!selectedCompany?.id) {
      return
    }
    const params = new URLSearchParams(searchParamsString)
    if (params.get("companyId") === selectedCompany.id) {
      return
    }
    params.set("companyId", selectedCompany.id)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParamsString, selectedCompany?.id])

  useEffect(() => {
    if (!selectedCompany && searchParamsString.includes("companyId=")) {
      const params = new URLSearchParams(searchParamsString)
      params.delete("companyId")
      params.delete("clientId")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }
  }, [pathname, router, searchParamsString, selectedCompany])

  useEffect(() => {
    if (!selectedClient?.id) {
      const params = new URLSearchParams(searchParamsString)
      if (params.get("clientId")) {
        params.delete("clientId")
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      }
      return
    }
    const params = new URLSearchParams(searchParamsString)
    if (params.get("clientId") === selectedClient.id) {
      return
    }
    params.set("clientId", selectedClient.id)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParamsString, selectedClient?.id])

  return (
    <>
      {/* Global alert active banner - shown at top when alert is active */}
      {isAlertActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 sm:px-6 py-2 sm:py-3 ${isRTL ? "text-right" : "text-left"}`}
        >
          <div className={`flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-sm sm:text-base font-semibold text-red-600 dark:text-red-400">
                  Critical alert is active
                </span>
              </div>
            </div>
            <Button
              size="sm"
              className="h-7 px-2 text-xs sm:text-sm whitespace-nowrap"
              variant="outline"
              onClick={() => router.push("/dashboard/alerts")}
            >
              View details
            </Button>
          </div>
        </motion.div>
      )}

      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 sm:px-6 py-2 sm:py-3 ${isRTL ? "text-right" : "text-left"}`}
        >
          <div className={`flex items-center justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 flex-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm sm:text-base text-red-600 dark:text-red-400">
                {authError}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAuthError}
              className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4 transition-colors"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 sm:gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
        >
        <div className={`flex items-center gap-2 sm:gap-3 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Logo placeholder to maintain consistent spacing */}
          <div className="flex items-center justify-center min-w-[160px] max-w-[200px] pr-2">
            <Link href="/dashboard" className="inline-flex items-center justify-center cursor-pointer">
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={160}
                height={48}
                className="h-10 w-auto max-h-10"
                priority
                unoptimized={shouldUnoptimizeLogo}
              />
            </Link>
          </div>
        </div>

        <div
          className={`hidden lg:flex flex-1 items-center gap-3 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          {/* Company dropdown for Super Admin - Desktop only */}
          {isSuperAdmin && companyOptions.length > 0 && (
            <div className="flex-1 min-w-[160px] max-w-[220px]">
              <Select value={selectedCompany?.id ?? "global"} onValueChange={handleCompanyChange}>
                <SelectTrigger className={`w-full h-9 ${getTextSize("input")}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <SelectValue placeholder="Select company" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="global">
                    <span className={getTextSize("bodySmall")}>Worldwide</span>
                  </SelectItem>
                  {companyOptions.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <span className={getTextSize("bodySmall")}>{company.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client dropdown - shown after company selection (Super Admin) or directly (Company Admin) - Desktop only */}
          {((isSuperAdmin && clientOptions.length > 0) || (isCompanyAdmin && clientOptions.length > 0)) && (
            <div className="flex-1 min-w-[160px] max-w-[220px]">
              <Select value={selectedClient?.id ?? "all"} onValueChange={handleClientChange}>
                <SelectTrigger className={`w-full h-9 ${getTextSize("input")}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <SelectValue placeholder="Select client" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">
                    <span className={getTextSize("bodySmall")}>All</span>
                  </SelectItem>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className={getTextSize("bodySmall")}>{client.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 sm:gap-3 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Mobile dropdowns - Only show on screens smaller than lg */}
          {isSuperAdmin && companyOptions.length > 0 && (
            <div className="flex lg:hidden">
              <Select value={selectedCompany?.id ?? "global"} onValueChange={handleCompanyChange}>
                <SelectTrigger className={`min-w-[120px] max-w-[160px] h-9 ${getTextSize("input")}`}>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                    <Building className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <SelectValue placeholder="Company" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <span className={getTextSize("bodySmall")}>Worldwide</span>
                  </SelectItem>
                  {companyOptions.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <span className={getTextSize("bodySmall")}>{company.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {((isSuperAdmin && clientOptions.length > 0) || (isCompanyAdmin && clientOptions.length > 0)) && (
            <div className="flex lg:hidden">
              <Select value={selectedClient?.id ?? "all"} onValueChange={handleClientChange}>
                <SelectTrigger className={`min-w-[120px] max-w-[160px] h-9 ${getTextSize("input")}`}>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                    <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <SelectValue placeholder="Client" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className={getTextSize("bodySmall")}>All</span>
                  </SelectItem>
                  {clientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <span className={getTextSize("bodySmall")}>{client.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}


          <Badge variant="secondary" className={`hidden md:flex ${getTextSize("badge")}`}>
            v4.1.0
          </Badge>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center gap-1 sm:gap-2 px-2 h-8 sm:h-10 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm">{languageLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className={getTextSize("bodySmall")}>{t("language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLanguage("en")}
                className={`${getTextSize("bodySmall")} ${language === "en" ? "bg-accent" : ""}`}
              >
                🇺🇸 {t("english")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("es")}
                className={`${getTextSize("bodySmall")} ${language === "es" ? "bg-accent" : ""}`}
              >
                🇪🇸 {t("spanish")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("fr")}
                className={`${getTextSize("bodySmall")} ${language === "fr" ? "bg-accent" : ""}`}
              >
                🇫🇷 {t("french")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("de")}
                className={`${getTextSize("bodySmall")} ${language === "de" ? "bg-accent" : ""}`}
              >
                🇩🇪 {t("german")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage("ar")}
                className={`${getTextSize("bodySmall")} ${language === "ar" ? "bg-accent" : ""}`}
              >
                🇸🇦 {t("arabic")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/dashboard/alerts">
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 sm:h-10 px-3">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Alerts</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center gap-1 sm:gap-2 px-1 sm:px-2 h-8 sm:h-10 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`hidden sm:block ${isRTL ? "text-right" : "text-left"}`}>
                  <p className={`font-medium ${getTextSize("bodySmall")}`}>{user?.username}</p>
                  <p className={`text-gray-500 dark:text-gray-400 ${getTextSize("caption")}`}>{roleLabel}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className={getTextSize("bodySmall")}>{t("adminOptions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className={getTextSize("bodySmall")}>
                <Link
                  href="/account"
                  className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <User className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                  {t("account")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className={getTextSize("bodySmall")}>
                <MapPin className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                {t("locations")}
              </DropdownMenuItem>
              <DropdownMenuItem className={getTextSize("bodySmall")}>
                <Code className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                {t("api")}
              </DropdownMenuItem>
              <DropdownMenuItem className={getTextSize("bodySmall")}>
                <Settings className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className={`text-red-600 dark:text-red-400 ${getTextSize("bodySmall")}`}
              >
                <LogOut className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
    </>
  )
}
