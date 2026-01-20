"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertTriangle, Bell, VolumeX, Vibrate, ArrowLeft, MapPin, Clock, Smartphone } from "lucide-react"

import { useAlert } from "@/contexts/alert-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTextSize } from "@/lib/text-sizes"
import { useToast } from "@/components/ui/use-toast"
import { useFCM } from "@/hooks/use-fcm"
import type { StoredDeviceRegistration } from "@/services/device-registration-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AlertsDemoPage() {
  const { isAlertActive, stopAlert, alertInfo } = useAlert()
  const router = useRouter()
  const { toast } = useToast()
  const { registrations, registerDevice, unregisterDevice, isRegistering, isRegistered, deviceId, fcmToken, error } = useFCM()
  const [showDeviceNameDialog, setShowDeviceNameDialog] = useState(false)
  const [deviceNameInput, setDeviceNameInput] = useState("")

  const handleUnregister = (registration: StoredDeviceRegistration) => {
    if (typeof window === "undefined") return
    const confirmed = window.confirm(
      `Unregister device "${registration.deviceName || registration.deviceId}"?`
    )
    if (confirmed) {
      unregisterDevice(registration)
      toast({
        title: "Device unregistered",
        description: "You can register this device again if needed.",
      })
    }
  }

  const handleRegister = async () => {
    const ok = await registerDevice(deviceNameInput.trim())
    if (ok) {
      setShowDeviceNameDialog(false)
      setDeviceNameInput("")
    }
  }

  // useEffect(() => {
  //   // If not super admin, send back to dashboard
  //   if (!isSuperAdmin) {
  //     router.replace("/dashboard")
  //   }
  // }, [isSuperAdmin, router])

  // if (!isSuperAdmin) {
  //   // Brief placeholder while redirecting non-admins
  //   return null
  // }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className={`${getTextSize("h1")} font-bold text-gray-900 dark:text-white`}>
                Alerts
              </h1>
              <p className={`${getTextSize("body")} text-gray-600 dark:text-gray-400`}>
                View active alerts and manage registered devices.
              </p>
            </div>
          </div>
            <div className="flex items-center gap-2">
              {isAlertActive && (
                <Badge
                  variant="destructive"
                  className={`flex items-center gap-2 ${getTextSize("badge")}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                  </span>
                  Alert Active
                </Badge>
              )}
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowDeviceNameDialog(true)}
                disabled={isRegistered}
              >
                <Smartphone className="w-4 h-4" />
                {isRegistered ? "Already registered on this device" : "Register for Alerts"}
              </Button>
            </div>
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                <Bell className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <CardTitle className={getTextSize("h3")}>Alert Management</CardTitle>
                <CardDescription className={getTextSize("bodySmall")}>
                  View active alerts and manage registered devices.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`${getTextSize("caption")} inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                  isAlertActive
                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      isAlertActive ? "bg-red-400" : "bg-emerald-400"
                    } opacity-75`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isAlertActive ? "bg-red-600" : "bg-emerald-600"
                    }`}
                  />
                </span>
                {isAlertActive ? "Alert active" : "Idle"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alert Details */}
            <div className="space-y-4">
              <h3 className={`${getTextSize("h4")} font-semibold text-gray-900 dark:text-gray-50`}>
                Alert Details
              </h3>
              <Card
                id="alert-details"
                className="border-2 border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-900/20"
              >
                <CardContent className="p-6 space-y-4">
                  {alertInfo ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-red-500 dark:bg-red-600">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className={`${getTextSize("h4")} font-bold text-red-800 dark:text-red-200`}>
                            {alertInfo.title}
                          </h4>
                          <p className={`${getTextSize("body")} text-red-700 dark:text-red-300 mt-1`}>
                            {alertInfo.message}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-red-200 dark:border-red-800">
                        {alertInfo.sensorId && (
                          <div className="flex items-start gap-2">
                            <Bell className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                              <p className={`${getTextSize("bodySmall")} font-medium text-red-800 dark:text-red-200`}>
                                Sensor ID
                              </p>
                              <p className={`${getTextSize("body")} text-red-700 dark:text-red-300`}>
                                #{alertInfo.sensorId}
                              </p>
                            </div>
                          </div>
                        )}
                        {alertInfo.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                              <p className={`${getTextSize("bodySmall")} font-medium text-red-800 dark:text-red-200`}>
                                Location
                              </p>
                              <p className={`${getTextSize("body")} text-red-700 dark:text-red-300`}>
                                {alertInfo.location}
                              </p>
                            </div>
                          </div>
                        )}
                        {alertInfo.timestamp && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <Clock className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                              <p className={`${getTextSize("bodySmall")} font-medium text-red-800 dark:text-red-200`}>
                                Alert Time
                              </p>
                              <p className={`${getTextSize("body")} text-red-700 dark:text-red-300`}>
                                {alertInfo.timestamp.toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className={`${getTextSize("body")} text-gray-600 dark:text-gray-400`}>
                        No active alert. Use the test button below to trigger a Firebase notification.
                      </p>
                    </div>
                  )}

                  {isAlertActive && (
                    <div className="pt-4 border-t border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3 mb-4">
                        <Vibrate className="w-5 h-5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <p className={`${getTextSize("bodySmall")} text-gray-700 dark:text-gray-300`}>
                          The alert sound and vibration are currently active. Click the button below to stop them.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        variant="destructive"
                        className={`w-full flex items-center justify-center gap-2 ${getTextSize("buttonLarge")}`}
                        onClick={stopAlert}
                      >
                        <VolumeX className="w-5 h-5" />
                        Stop Alert
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Registered devices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`${getTextSize("h4")} font-semibold text-gray-900 dark:text-gray-50`}>
                  Registered Devices
                </h3>
                <Button size="sm" variant="outline" onClick={() => setShowDeviceNameDialog(true)} className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Add Device
                </Button>
              </div>
              {registrations.length === 0 ? (
                <p className={`${getTextSize("body")} text-gray-600 dark:text-gray-400`}>
                  No devices registered yet. Register a device to receive alerts.
                </p>
              ) : (
                <div className="grid gap-3">
                  {registrations.map((reg) => (
                    <div
                      key={`${reg.deviceId}-${reg.deviceToken}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800"
                    >
                      <div className="space-y-1">
                        <p className={`${getTextSize("body")} font-semibold text-gray-900 dark:text-gray-100`}>
                          {reg.deviceName || "Unnamed Device"}
                        </p>
                        <p className={`${getTextSize("caption")} text-gray-500 dark:text-gray-400 break-all`}>
                          ID: {reg.deviceId}
                        </p>
                        {reg.userId && (
                          <p className={`${getTextSize("caption")} text-gray-500 dark:text-gray-400`}>
                            User: {reg.userId}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnregister(reg)}
                        >
                          Unregister
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Device Name Prompt Dialog */}
      <Dialog open={showDeviceNameDialog} onOpenChange={setShowDeviceNameDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register Alert Device</DialogTitle>
            <DialogDescription>Enter a name for this device before registering for alerts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="device-name-alert">Device Name</Label>
            <Input
              id="device-name-alert"
              placeholder="e.g., John's Laptop"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
            />
            {deviceId && (
              <p className="text-xs text-gray-500 break-all">Device ID: {deviceId}</p>
            )}
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDeviceNameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegister} disabled={isRegistering || !deviceNameInput.trim()}>
                {isRegistering ? "Registering..." : "Register"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


