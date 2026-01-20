"use client";

import type React from "react";

import { Suspense, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedButton } from "@/components/ui/animated-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useAppInit } from "@/contexts/app-init-context";
import { getTextSize } from "@/lib/text-sizes";
import { AlertCircle, Shield, Activity, Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function LoginPageContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading, authError, clearAuthError } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    logo,
    logoUrl,
    appName,
    appTitle,
    appSubtitle,
    companyName,
    companyId,
    initApp,
  } = useAppInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSubdomain = searchParams?.get("subdomain");
  const activeSubdomain = useMemo(() => {
    if (typeof window === "undefined") {
      return urlSubdomain || null;
    }
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    if (parts.length > 2 && parts[0]) {
      return parts[0];
    }
    return urlSubdomain || null;
  }, [urlSubdomain]);
  const requiresCompanyId = Boolean(activeSubdomain);

  // Initialize app with subdomain from URL param or hostname
  useEffect(() => {
    if (activeSubdomain) {
      initApp(activeSubdomain);
    }
  }, [activeSubdomain, initApp]);

  const displayAppTitle =
    appTitle || appName || companyName || "IOTforAi Dashboard";
  const displayAppSubtitle =
    appSubtitle || t("monitorControlAnalyze");

  // Determine logo path and alt text
  let logopath = "/images/default_logo.png";
  let alternativeText = displayAppTitle;

  // Use API response if available
  if (logoUrl) {
    logopath = logoUrl;
    alternativeText = appName || "IOTforAi";
  } else if (logo) {
    // Handle base64 logo
    if (logo.startsWith("data:") || logo.startsWith("http")) {
      logopath = logo;
    } else {
      logopath = `data:image/png;base64,${logo}`;
    }
    alternativeText = displayAppTitle;
  }

  useEffect(() => {
    if (authError) {
      setError(authError);
    } else {
      setError("");
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setError("");

    if (requiresCompanyId && !companyId) {
      setError("Company information unavailable. Please refresh and try again.");
      return;
    }

    if (!username || !password) {
      setError(t("fillRequiredFields"));
      return;
    }

    const success = await login(username, password, {
      companyId: requiresCompanyId ? companyId : undefined,
    });
    if (success) {
      router.push("/dashboard");
    } else {
      // Login failed - context is already cleared, stay on login page
      setError(authError || t("invalidCredentials"));
    }
  };

  const shouldBlockRender =
    Boolean(activeSubdomain) &&
    (isLoading || (!logo && !logoUrl && !appName && !companyName));

  if (shouldBlockRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-300">
            {t("loading")}...
          </p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Activity,
      title: t("realTimeMonitoring"),
      desc: t("trackDevicesRealTime"),
    },
    {
      icon: Shield,
      title: t("secureConnection"),
      desc: t("enterpriseGradeSecurity"),
    },
    {
      icon: Globe,
      title: t("globalCoverage"),
      desc: t("worldwideConnectivity"),
    },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-3 sm:p-4 transition-colors"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Theme and Language Toggles */}
      <div
        className={`absolute top-3 ${isRTL ? "left-3" : "right-3"} sm:top-4 ${
          isRTL ? "sm:left-4" : "sm:right-4"
        } flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div
        className={`w-full max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-center ${
          isRTL ? "lg:grid-cols-2" : ""
        }`}
      >
        {/* Left side - Branding - Hidden on mobile, shown on lg+ */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={`hidden lg:block space-y-6 lg:space-y-8 ${
            isRTL ? "order-2" : "order-1"
          }`}
        >
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`flex items-center gap-3 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Image
                src={logopath}
                alt={alternativeText}
                width={200}
                height={80}
                /*className="h-12 w-auto"*/
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <feature.icon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <h3
                    className={`font-semibold text-gray-900 dark:text-white ${getTextSize(
                      "h5"
                    )}`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-gray-600 dark:text-gray-400 ${getTextSize(
                      "bodySmall"
                    )}`}
                  >
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-full max-w-md mx-auto ${isRTL ? "order-1" : "order-2"}`}
        >
          {/* Mobile Logo - Only shown on mobile */}
          <div className="lg:hidden mb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`flex items-center justify-center gap-3 mb-4 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Image
                src={logopath}
                alt={alternativeText}
                width={160}
                height={60}
                className="h-10 w-auto"
              />
            </motion.div>
          </div>

          <Card className="shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="space-y-1 text-center px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle
                className={`font-bold dark:text-white ${getTextSize(
                  "formTitle"
                )}`}
              >
                {t("welcomeBack")}
              </CardTitle>
              <CardDescription
                className={`dark:text-gray-400 ${getTextSize(
                  "formDescription"
                )}`}
              >
                {t("signInToAccount")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className={`dark:text-gray-200 ${getTextSize(
                      "formLabel"
                    )} ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("username")}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={`${t("username")}...`}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) {
                        setError("");
                      }
                      clearAuthError();
                    }}
                    className={`h-10 sm:h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${getTextSize(
                      "formInput"
                    )} ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className={`dark:text-gray-200 ${getTextSize(
                      "formLabel"
                    )} ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("password")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={`${t("password")}...`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) {
                        setError("");
                      }
                      clearAuthError();
                    }}
                    className={`h-10 sm:h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${getTextSize(
                      "formInput"
                    )} ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span
                      className={`text-red-600 dark:text-red-400 ${getTextSize(
                        "formError"
                      )} ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {error}
                    </span>
                  </motion.div>
                )}

                <AnimatedButton
                  type="submit"
                  className={`w-full h-10 sm:h-11 ${getTextSize(
                    "buttonLarge"
                  )}`}
                  isLoading={isLoading}
                >
                  {t("login")}
                </AnimatedButton>

                <div className="text-center space-y-2">
                  <p
                    className={`text-gray-600 dark:text-gray-400 ${getTextSize(
                      "body"
                    )}`}
                  >
                    {t("dontHaveAccount")}{" "}
                    <Link
                      href="/register"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {t("register")}
                    </Link>
                  </p>
                  {/* <div className={`text-gray-500 dark:text-gray-500 space-y-1 ${getTextSize("formHelp")}`}>
                    <p>{t("demoCredentials")}:</p>
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-2 ${isRTL ? "sm:flex-row-reverse" : ""}`}
                    >
                      <span>
                        {t("username")}: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">admin</code>
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {t("password")}: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">password</code>
                      </span>
                    </div>
                  </div> */}
                </div>
              </form>
            </CardContent>
          </Card>
          {/* Footer */}
          <div className="text-center py-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              ©2025 {displayAppTitle}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
