"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { getTextSize } from "@/lib/text-sizes";
import Link from "next/link";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, logout, authError, clearAuthError } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = useMemo(
    () => searchParams?.toString() ?? "",
    [searchParams]
  );

  const userRole = user?.role?.toUpperCase() ?? "";
  const isSuperAdmin = userRole === "ROLE_ADMIN";
  const isCompanyAdmin =
    userRole === "COMPANY_ADMIN" ||
    userRole === "COMPANY_USER" ||
    userRole === "ROLE_USER";

  const normalizeLogo = useCallback((candidate?: unknown): string | null => {
    if (typeof candidate !== "string" || candidate.length === 0) {
      return null;
    }
    if (candidate.startsWith("data:") || candidate.startsWith("http")) {
      return candidate;
    }
    return `data:image/png;base64,${candidate}`;
  }, []);

  const languageLabel = useMemo(() => {
    if (language === "en") {
      return t("english");
    }
    if (language === "es") {
      return t("spanish");
    }
    if (language === "fr") {
      return t("french");
    }
    if (language === "de") {
      return t("german");
    }
    return t("arabic");
  }, [language, t]);

  const roleLabel = useMemo(() => {
    if (!user?.role) {
      return "";
    }
    // Format role nicely: ROLE_ADMIN -> Admin, COMPANY_ADMIN -> Company Admin, etc.
    const role = user.role.toUpperCase();
    if (role === "ROLE_ADMIN") {
      return "Super Admin";
    }
    if (role === "COMPANY_ADMIN") {
      return "Company Admin";
    }
    if (role === "COMPANY_USER" || role === "ROLE_USER") {
      return "Company User";
    }
    if (role === "CLIENT_ADMIN") {
      return "Client Admin";
    }
    if (role === "CLIENT_USER") {
      return "Client User";
    }
    // Fallback: replace underscores and capitalize
    return user.role
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }, [user?.role]);

  return (
    <>
      {authError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-3 sm:px-6 py-2 sm:py-3 ${
            isRTL ? "text-right" : "text-left"
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex items-center gap-2 flex-1 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
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
          className={`flex flex-wrap items-center justify-between gap-3 sm:gap-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <div
            className={`flex items-center gap-2 sm:gap-3 flex-shrink-0 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            {/* Logo placeholder to maintain consistent spacing */}
            {/*
            <div className="flex items-center justify-center min-w-[160px] max-w-[200px] pr-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center cursor-pointer"
              ></Link>
            </div>*/}
          </div>

          <div
            className={`hidden lg:flex flex-1 items-center gap-3 min-w-0 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <Badge
              variant="secondary"
              className={`hidden md:flex ${getTextSize("badge")}`}
            >
              v4.1.0
            </Badge>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center gap-1 sm:gap-2 px-2 h-8 sm:h-10 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline text-sm">
                    {languageLabel}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className={getTextSize("bodySmall")}>
                  {t("language")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className={`${getTextSize("bodySmall")} ${
                    language === "en" ? "bg-accent" : ""
                  }`}
                >
                  🇺🇸 {t("english")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("es")}
                  className={`${getTextSize("bodySmall")} ${
                    language === "es" ? "bg-accent" : ""
                  }`}
                >
                  🇪🇸 {t("spanish")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("fr")}
                  className={`${getTextSize("bodySmall")} ${
                    language === "fr" ? "bg-accent" : ""
                  }`}
                >
                  🇫🇷 {t("french")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("de")}
                  className={`${getTextSize("bodySmall")} ${
                    language === "de" ? "bg-accent" : ""
                  }`}
                >
                  🇩🇪 {t("german")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("ar")}
                  className={`${getTextSize("bodySmall")} ${
                    language === "ar" ? "bg-accent" : ""
                  }`}
                >
                  🇸🇦 {t("arabic")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/dashboard/alerts">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 h-8 sm:h-10 px-3"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Alerts</span>
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex items-center gap-1 sm:gap-2 px-1 sm:px-2 h-8 sm:h-10 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs sm:text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`hidden sm:block ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    <p className={`font-medium ${getTextSize("bodySmall")}`}>
                      {user?.username}
                    </p>
                    <p
                      className={`text-gray-500 dark:text-gray-400 ${getTextSize(
                        "caption"
                      )}`}
                    >
                      {roleLabel}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className={getTextSize("bodySmall")}>
                  {t("adminOptions")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className={getTextSize("bodySmall")}>
                  <Link
                    href="/account"
                    className={`flex items-center ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
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
                  className={`text-red-600 dark:text-red-400 ${getTextSize(
                    "bodySmall"
                  )}`}
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
  );
}
