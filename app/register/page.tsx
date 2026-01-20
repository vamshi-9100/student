"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimatedButton } from "@/components/ui/animated-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { getTextSize } from "@/lib/text-sizes"
import { AlertCircle, Shield, Activity, Globe } from "lucide-react"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const { register, isLoading } = useAuth()
  const { t, isRTL } = useLanguage()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !email || !password || !confirmPassword) {
      setError(t("fillRequiredFields"))
      return
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"))
      return
    }

    const success = await register(username, email, password)
    if (success) {
      router.push("/dashboard")
    } else {
      setError(t("registrationFailed"))
    }
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
  ]

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-3 sm:p-4 transition-colors"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Theme and Language Toggles */}
      <div
        className={`absolute top-3 ${isRTL ? "left-3" : "right-3"} sm:top-4 ${isRTL ? "sm:left-4" : "sm:right-4"} flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div
        className={`w-full max-w-6xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-center ${isRTL ? "lg:grid-cols-2" : ""}`}
      >
        {/* Left side - Branding - Hidden on mobile, shown on lg+ */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={`hidden lg:block space-y-6 lg:space-y-8 ${isRTL ? "order-2" : "order-1"}`}
        >
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Image
                src="/images/default_logo.png"
                alt="IOTforAi"
                width={200}
                height={80}
                className="h-12 w-auto"
              />
            </motion.div>
            <p
              className={`text-gray-600 dark:text-gray-300 ${getTextSize("formDescription")} ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("joinThousandsOfUsers")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <feature.icon className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <h3 className={`font-semibold text-gray-900 dark:text-white ${getTextSize("h5")}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-gray-600 dark:text-gray-400 ${getTextSize("bodySmall")}`}>{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right side - Register Form */}
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
              className={`flex items-center justify-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Image
                src="/images/default_logo.png"
                alt="IOTforAi"
                width={160}
                height={60}
                className="h-10 w-auto"
              />
            </motion.div>
            <p className={`text-gray-600 dark:text-gray-300 ${getTextSize("body")}`}>{t("joinIoTPlatform")}</p>
          </div>

          <Card className="shadow-xl border-0 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="space-y-1 text-center px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className={`font-bold dark:text-white ${getTextSize("formTitle")}`}>
                {t("createAccount")}
              </CardTitle>
              <CardDescription className={`dark:text-gray-400 ${getTextSize("formDescription")}`}>
                {t("createIoTAccount")}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className={`dark:text-gray-200 ${getTextSize("formLabel")} ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("username")}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={`${t("username")}...`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`h-10 sm:h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${getTextSize("formInput")} ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={`dark:text-gray-200 ${getTextSize("formLabel")} ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={`${t("email")}...`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-10 sm:h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${getTextSize("formInput")} ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className={`dark:text-gray-200 ${getTextSize("formLabel")} ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("password")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={`${t("password")}...`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-10 sm:h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${getTextSize("formInput")} ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className={`dark:text-gray-200 ${getTextSize("formLabel")} ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={`${t("confirmPassword")}...`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-10 sm:h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${getTextSize("formInput")} ${isRTL ? "text-right" : "text-left"}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span
                      className={`text-red-600 dark:text-red-400 ${getTextSize("formError")} ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {error}
                    </span>
                  </motion.div>
                )}

                <AnimatedButton
                  type="submit"
                  className={`w-full h-10 sm:h-11 ${getTextSize("buttonLarge")}`}
                  isLoading={isLoading}
                >
                  {t("register")}
                </AnimatedButton>

                <div className="text-center">
                  <p className={`text-gray-600 dark:text-gray-400 ${getTextSize("body")}`}>
                    {t("alreadyHaveAccount")}{" "}
                    <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      {t("login")}
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
