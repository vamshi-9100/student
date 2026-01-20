"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDialog } from "@/contexts/dialogContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  sensorService,
  type CreateSensorRequest,
  type SensorReading,
} from "@/services/sensor-service";
import { useSensorStore } from "@/stores/sensor-store";
import { useAuth } from "@/contexts/auth-context";
import { getTextSize } from "@/lib/text-sizes";
import {
  Thermometer,
  Droplets,
  Waves,
  Ruler,
  MoreVertical,
  Search,
  Plus,
  Activity,
  Settings,
  Trash2,
  Eye,
  BarChart3,
  Save,
  X,
  Wifi,
  AlertCircle,
  Loader2,
  MapPin,
  RefreshCw,
  Battery,
  Wind,
  Gauge,
  Lightbulb,
  History,
  WifiOff,
  Clock,
  Bell,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { GatewayInfo, gatewayService } from "@/services/gateway-service";
import { alertService } from "@/services/alerts-service";
import { useFCM } from "@/hooks/use-fcm";

const sensorTypes = {
  humidity: { icon: Droplets, color: "bg-blue-500" },
  temperature: { icon: Thermometer, color: "bg-red-500" },
  soil: { icon: Waves, color: "bg-green-500" },
  ultrasonic: { icon: Ruler, color: "bg-purple-500" },
  "iot sensor": { icon: Activity, color: "bg-gray-500" },
  New: { icon: Activity, color: "bg-purple-600" },
};

// Device types with their configurations for the form
const deviceTypesConfig = [
  {
    id: "temperature",
    name: "Temperature Sensor",
    icon: Thermometer,
    color: "bg-red-500",
    description: "Monitor ambient and surface temperatures with high precision",
    units: ["°C", "°F", "K"],
    defaultRange: { min: -40, max: 85 },
    models: ["DHT22", "DS18B20", "LM35", "TMP36"],
  },
  {
    id: "humidity",
    name: "Humidity Sensor",
    icon: Droplets,
    color: "bg-blue-500",
    description: "Measure relative humidity levels and moisture content",
    units: ["%", "g/m³", "ppm"],
    defaultRange: { min: 0, max: 100 },
    models: ["SHT30", "DHT22", "HIH6130", "AM2302"],
  },
  {
    id: "soil",
    name: "Soil Moisture",
    icon: Waves,
    color: "bg-green-500",
    description: "Monitor soil moisture and conductivity for agriculture",
    units: ["centibars", "%", "kPa"],
    defaultRange: { min: 0, max: 200 },
    models: ["SM100", "EC-5", "10HS", "GS3"],
  },
  {
    id: "ultrasonic",
    name: "Ultrasonic Distance",
    icon: Ruler,
    color: "bg-purple-500",
    description: "Measure distance and level detection with ultrasonic waves",
    units: ["cm", "m", "ft", "in"],
    defaultRange: { min: 2, max: 400 },
    models: ["HC-SR04", "JSN-SR04T", "A02YYUW", "US-100"],
  },
  {
    id: "New",
    name: "Custom Sensor",
    icon: Activity,
    color: "bg-purple-600",
    description: "Custom sensor type for specialized applications",
    units: ["m3/h", "units", "value", "L/min", "°F"],
    defaultRange: { min: 0, max: 100 },
    models: ["CUSTOM-2024", "GENERIC-V1", "MULTI-SENSOR", "FLOW-2024"],
  },
];

// Mock gateways for selection
const availableGateways = [
  { id: 1, name: "Ethernet Gateway 4", location: "Building A" },
  { id: 2, name: "Wireless Adapter", location: "Building B" },
  { id: 3, name: "LoRaWAN Gateway", location: "Building C" },
];

interface SensorFormData {
  deviceId: string;
  sensorName: string;
  sensorType: string;
  sensorModel: string;
  sensorSerialNumber: string;
  unitOfMeasurement: string;
  gatewayId: string;
  locationName: string;
  latitude: string;
  longitude: string;
  minValue: string;
  maxValue: string;
  calibrationData: string;
  devEUI: string;
  companyId: string;
  clientId: string;
}

const initialFormData: SensorFormData = {
  deviceId: "",
  sensorName: "",
  sensorType: "",
  sensorModel: "",
  sensorSerialNumber: "",
  unitOfMeasurement: "",
  gatewayId: "",
  locationName: "",
  latitude: "",
  longitude: "",
  minValue: "",
  maxValue: "",
  calibrationData: "",
  devEUI: "",
  companyId: "",
  clientId: "",
};

export default function SensorsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [availableGateways, setAvailableGateways] = useState<GatewayInfo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<SensorFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { openDialog } = useDialog();
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [showDeviceNameDialog, setShowDeviceNameDialog] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState("");

  // FCM for push notifications
  const {
    isRegistered,
    isRegistering,
    error: fcmError,
    registerDevice,
    isSupported,
    fcmToken,
    deviceId,
  } = useFCM();

  const handleConfirmDeviceRegistration = useCallback(async () => {
    const success = await registerDevice(deviceNameInput.trim());
    if (success) {
      setShowDeviceNameDialog(false);
      setDeviceNameInput("");
    }
  }, [deviceNameInput, registerDevice]);

  // Inside your Sensors component

  const handleDeleteSensor = async (sensorId: number) => {
    try {
      await sensorService.deleteSensor(sensorId); //  backend call
      sensorService.getSensors(); //call api to refresh
    } catch (err) {
      console.error(err);
    }
  };

  //fetch gayeways from an api

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const data = await gatewayService.getGateways();
        setAvailableGateways(data);
      } catch (err) {
        console.error("Failed to load gateways:", err);
      }
    };

    fetchGateways();
  }, []);

  // Zustand store
  const { sensorsWithReadings, loading, error, fetchAll, clearError } =
    useSensorStore();

  // Get selected company and client from auth context
  const { selectedCompany, selectedClient, clients, companies } = useAuth();
  const companyOptions = useMemo(() => companies ?? [], [companies]);
  const clientOptions = useMemo(() => clients ?? [], [clients]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refetch data when company or client selection changes
  useEffect(() => {
    fetchAll();
  }, [selectedCompany?.id, selectedClient?.id, fetchAll]);

  //alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await alertService.listAlerts({
          companyId: selectedCompany?.id ?? null,
          clientId: selectedClient?.id ?? null,
          alertStatus: "ACTIVE",
        });

        if (res) {
          setActiveAlertsCount(res.total);
        }
      } catch (err) {
        console.error("error fetching alerts:", err);
      }
    };

    loadAlerts();
  }, [selectedCompany?.id, selectedClient?.id]);

  const filteredSensors = sensorsWithReadings.filter((sensor) => {
    const matchesSearch =
      sensor.sensorType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.sensorId.toString().includes(searchTerm.toLowerCase()) ||
      sensor.sensorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sensor.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleDeviceTypeSelect = (deviceType: any) => {
    setSelectedDeviceType(deviceType.id);
    setFormData({
      ...initialFormData,
      sensorType: deviceType.id,
      sensorName: `${deviceType.name} ${Math.floor(Math.random() * 100)}`,
      sensorModel: deviceType.models[0],
      unitOfMeasurement: deviceType.units[0],
      minValue: deviceType.defaultRange.min.toString(),
      maxValue: deviceType.defaultRange.max.toString(),
      calibrationData:
        deviceType.id === "New" ? "data" : '{"offset": 0, "scale": 1}',
    });
    setShowAddForm(true);
  };

  const handleInputChange = (field: keyof SensorFormData, value: string) => {
    setIsDirty(true);

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSerialNumber = (sensorType: string, model: string) => {
    const prefix = model.toUpperCase();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const year = new Date().getFullYear();
    return `${prefix}-${random}-${year}`;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          setIsDirty(true);
          toast({
            title: "Location Retrieved",
            description: "Current location has been set successfully.",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description:
              "Unable to get current location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.sensorName ||
        !formData.sensorType ||
        !formData.sensorModel ||
        !formData.sensorSerialNumber ||
        !formData.unitOfMeasurement ||
        !formData.locationName ||
        !formData.gatewayId ||
        !formData.companyId
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Prepare API request data matching the real API structure
      const sensorRequest: CreateSensorRequest = {
        deviceId: formData.deviceId
          ? Number.parseInt(formData.deviceId)
          : undefined,
        sensorName: formData.sensorName,
        sensorType: formData.sensorType,
        sensorModel: formData.sensorModel,
        sensorSerialNumber: formData.sensorSerialNumber,
        unitOfMeasurement: formData.unitOfMeasurement,
        gatewayId: Number.parseInt(formData.gatewayId),
        locationName: formData.locationName,
        latitude: formData.latitude
          ? Number.parseFloat(formData.latitude)
          : undefined,
        longitude: formData.longitude
          ? Number.parseFloat(formData.longitude)
          : undefined,
        minValue: Number.parseFloat(formData.minValue) || 0,
        maxValue: Number.parseFloat(formData.maxValue) || 100,
        calibrationData: formData.calibrationData || "data",
        devEUI: formData.devEUI || undefined,
        companyId: Number.parseInt(formData.companyId),
        clientId: formData.clientId
          ? Number.parseFloat(formData.clientId)
          : undefined,
      };

      // Call the sensor service
      const response = await sensorService.createSensor(sensorRequest);

      // Show success message
      toast({
        title: "Sensor Created Successfully",
        description: `Sensor "${response.sensorName}" (ID: ${response.sensorId}) has been created and configured.`,
        duration: 5000,
      });

      // Refresh sensors list
      await fetchAll();

      // Reset form
      setFormData(initialFormData);
      setShowAddForm(false);
      setSelectedDeviceType(null);
    } catch (error: any) {
      console.error("Error creating sensor:", error);

      // Show error message
      toast({
        title: "Error Creating Sensor",
        description:
          error.message ||
          "Failed to create sensor. Please check your connection and try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      attemptClose();
      return;
    }
    setShowAddForm(true);
  };

  const attemptClose = () => {
    if (isDirty) {
      setShowExitPrompt(true);
    } else {
      resetAndClose();
    }
  };

  const renderSensorValue = (
    reading: SensorReading | undefined,
    field: keyof SensorReading,
    unit?: string
  ) => {
    if (!reading || !reading[field]) return null;

    const value = reading[field] as string;
    //leakage texx in red colour
    const isAlert = field === "leakage" && value?.toLowerCase() === "leak";

    return (
      <div className="flex items-center justify-between">
        <span
          className={`${getTextSize(
            "caption"
          )} text-gray-500 dark:text-gray-400 capitalize`}
        >
          {field.replace(/([A-Z])/g, " $1").trim()}:
        </span>
        <span
          className={`${getTextSize("cardText")} font-medium ${
            isAlert ? "text-red-500" : "text-gray-900 dark:text-white"
          }`}
        >
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
    );
  };

  const getSensorIcon = (reading: SensorReading | undefined) => {
    if (!reading) return WifiOff;

    // Determine sensor type based on available readings
    if (reading.temperature) return Thermometer;
    if (reading.humidity) return Droplets;
    if (reading.pressure) return Gauge;
    if (reading.pm25 || reading.pm10) return Wind;
    if (reading.light) return Lightbulb;
    if (reading.battery) return Battery;

    return Activity;
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className={getTextSize("body")}>{t("sensors.loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  const resetAndClose = () => {
    setShowExitPrompt(false);
    setShowAddForm(false);
    setSelectedDeviceType(null);
    setFormData(initialFormData);
    setIsDirty(false);
  };

  if (error) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-6 sm:p-8 text-center max-w-md mx-auto">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
              <div>
                <h3
                  className={`${getTextSize(
                    "h3"
                  )} font-semibold text-gray-900 dark:text-white`}
                >
                  API Connection Error
                </h3>
                <p
                  className={`${getTextSize(
                    "body"
                  )} text-gray-600 dark:text-gray-400 mt-2`}
                >
                  {error}
                </p>
              </div>
              <Button
                onClick={fetchAll}
                className={`flex items-center gap-2 ${getTextSize("button")}`}
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1
              className={`${getTextSize(
                "h1"
              )} font-bold text-gray-900 dark:text-white`}
            >
              {t("sensors.title")}
            </h1>
            <p
              className={`${getTextSize(
                "body"
              )} text-gray-600 dark:text-gray-400`}
            >
              {t("sensors.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* API Status Indicator */}
            <div className="flex items-center justify-center sm:justify-start gap-2 order-2 sm:order-1">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                <span className={getTextSize("caption")}>
                  {t("sensors.apiConnected")}
                </span>
              </div>
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <Button
                onClick={fetchAll}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 bg-transparent flex-1 sm:flex-none ${getTextSize(
                  "button"
                )}`}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{t("common.refresh")}</span>
              </Button>
              {isSupported && (
                <>
                  <Button
                    onClick={() => setShowDeviceNameDialog(true)}
                    disabled={isRegistered || isRegistering}
                    variant={isRegistered ? "outline" : "default"}
                    size="sm"
                    className={`flex items-center gap-2 flex-1 sm:flex-none ${getTextSize(
                      "button"
                    )}`}
                    title={
                      isRegistered
                        ? "Device registered for alerts"
                        : "Register device for push notifications"
                    }
                  >
                    <Smartphone className="w-4 h-4" />
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Registering...</span>
                      </>
                    ) : isRegistered ? (
                      <span className="hidden sm:inline">
                        Alert Device Registered
                      </span>
                    ) : (
                      <span className="hidden sm:inline">Add Alert Device</span>
                    )}
                  </Button>
                  {isRegistered && fcmToken && (
                    <Button
                      onClick={() => setShowTokenDialog(true)}
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-2 ${getTextSize(
                        "button"
                      )}`}
                      title="View FCM Token for testing"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="hidden sm:inline">View Token</span>
                    </Button>
                  )}
                </>
              )}
              <Button
                className={`flex items-center gap-2 flex-1 sm:flex-none ${getTextSize(
                  "button"
                )}`}
                onClick={() => {
                  setShowAddForm(true);
                  setSelectedDeviceType(null);
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">{t("common.add")}</span>
                <span className="hidden sm:inline">{t("addSensor")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* FCM Error Message */}
        {fcmError && (
          <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-3 py-2">
            <p
              className={`${getTextSize(
                "caption"
              )} text-red-600 dark:text-red-400`}
            >
              {fcmError}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 w-full ${getTextSize("input")}`}
          />
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: t("totalSensors"),
            value: sensorsWithReadings.length,
            color: "text-blue-600",
            icon: Activity,
          },
          {
            label: t("online"),
            value: sensorsWithReadings.filter((s) => s.isOnline).length,
            color: "text-green-600",
            icon: Wifi,
          },
          {
            label: t("offline"),
            value: sensorsWithReadings.filter((s) => !s.isOnline).length,
            color: "text-red-600",
            icon: WifiOff,
          },
          {
            label: t("AlertsCount"),
            //value: sensorsWithReadings.filter((s) => s.latestReading).length,
            value: activeAlertsCount,
            color: "text-purple-600",
            icon: Bell,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`${getTextSize("h3")} font-bold`}>
                      {stat.value}
                    </div>
                    <div className={`${getTextSize("cardText")} ${stat.color}`}>
                      {stat.label}
                    </div>
                  </div>
                  <stat.icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredSensors.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-6 sm:p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                <div>
                  <h3
                    className={`${getTextSize(
                      "h3"
                    )} font-semibold text-gray-900 dark:text-white`}
                  >
                    {t("sensors.empty.title")}
                  </h3>
                  <p
                    className={`${getTextSize(
                      "body"
                    )} text-gray-600 dark:text-gray-400 mt-1`}
                  >
                    {searchTerm
                      ? t("sensors.empty.noMatch")
                      : t("sensors.empty.getStarted")}
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className={getTextSize("button")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addSensor")}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          filteredSensors.map((sensor, index) => {
            const SensorIcon = getSensorIcon(sensor.latestReading);
            const reading = sensor.latestReading;

            return (
              <motion.div
                key={sensor.sensorId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="overflow-hidden hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700 h-full cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/sensors/${sensor.sensorSerialNumber}/readings`
                    )
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg ${
                            sensor.isOnline
                              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          <SensorIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle
                            className={`block max-w-full truncate ${getTextSize(
                              "cardTitle"
                            )} font-semibold text-gray-900 dark:text-white`}
                          >
                            {sensor.sensorName}
                          </CardTitle>
                          <p
                            className={`${getTextSize(
                              "caption"
                            )} text-gray-500 dark:text-gray-400 truncate`}
                          >
                            Serial #: {sensor.sensorSerialNumber}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/sensors/${sensor.sensorSerialNumber}/readings`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <History className="w-4 h-4 mr-2" />
                              View Readings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <button
                              type="button"
                              className="text-red-600 dark:text-red-400 flex items-center w-full"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                console.log("Delete clicked:", sensor.sensorId);

                                openDialog(
                                  "delete",
                                  "Delete Sensor",
                                  "Are you sure you want to delete this sensor?",
                                  () => handleDeleteSensor(sensor.sensorId)
                                );
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {/* Status and Last Seen */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={sensor.isOnline ? "default" : "destructive"}
                          className={getTextSize("badge")}
                        >
                          {sensor.isOnline ? t("online") : t("offline")}
                        </Badge>
                        <div
                          className={`flex items-center gap-1 ${getTextSize(
                            "caption"
                          )} text-gray-500 dark:text-gray-400`}
                        >
                          <Clock className="w-3 h-3" />
                          {sensor.lastSeen}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`${getTextSize(
                            "caption"
                          )} text-gray-500 dark:text-gray-400`}
                        >
                          {t("common.location")}
                        </span>
                        <span
                          className={`${getTextSize(
                            "caption"
                          )} text-gray-900 dark:text-white truncate ml-2`}
                        >
                          {sensor.locationName}
                        </span>
                      </div>
                      {/* Location */}
                      <div className="flex items-left justify-between">
                        <span
                          className={`${getTextSize(
                            "caption"
                          )} text-gray-500 dark:text-gray-400`}
                        >
                          {t("common.gatewayname")}
                        </span>
                        <span
                          className={`${getTextSize(
                            "caption"
                          )} text-gray-900 dark:text-white truncate ml-2`}
                        >
                          {sensor.gatewayname}
                        </span>
                      </div>

                      {/* Sensor Readings */}
                      {reading ? (
                        <div className="space-y-1 pt-2 border-t dark:border-gray-600">
                          {renderSensorValue(reading, "temperature", "°C")}
                          {renderSensorValue(reading, "humidity", "%")}
                          {renderSensorValue(reading, "battery", "%")}
                          {renderSensorValue(reading, "pm10", "µg/m³")}
                          {renderSensorValue(reading, "pm25", "µg/m³")}
                          {renderSensorValue(reading, "hcho", "mg/m³")}
                          {renderSensorValue(reading, "tvoc", "mg/m³")}
                          {renderSensorValue(reading, "pressure", "hPa")}
                          {renderSensorValue(reading, "co2", "ppm")}
                          {renderSensorValue(reading, "leakage", "")}
                          {reading.pir && (
                            <div className="flex items-center justify-between">
                              <span
                                className={`${getTextSize(
                                  "caption"
                                )} text-gray-500 dark:text-gray-400`}
                              >
                                PIR Status:
                              </span>
                              <Badge
                                variant={
                                  reading.pir === "Occupied"
                                    ? "default"
                                    : "secondary"
                                }
                                className={getTextSize("badge")}
                              >
                                {reading.pir}
                              </Badge>
                            </div>
                          )}
                          {renderSensorValue(reading, "light", "lux")}
                        </div>
                      ) : (
                        <div className="pt-2 border-t dark:border-gray-600 text-center">
                          <div className="flex flex-col items-center gap-2 py-4">
                            <WifiOff className="w-6 h-6 text-gray-400" />
                            <span
                              className={`${getTextSize(
                                "caption"
                              )} text-gray-500 dark:text-gray-400`}
                            >
                              {t("sensors.noReadings")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Sensor Dialog */}
      <Dialog open={showAddForm} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <DialogHeader className="pb-2">
            <DialogTitle
              className={`flex items-center gap-2 dark:text-white ${getTextSize(
                "h3"
              )}`}
            >
              Add New Sensor
            </DialogTitle>
            <DialogDescription
              className={`dark:text-gray-400 ${getTextSize("bodySmall")}`}
            >
              {selectedDeviceType
                ? `Configure your new ${
                    deviceTypesConfig.find((d) => d.id === selectedDeviceType)
                      ?.name || "sensor"
                  }`
                : "First, select the type of sensor you want to add"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[75vh] pr-2 sm:pr-4">
            {!selectedDeviceType ? (
              // Device Type Selection
              <div className="space-y-4">
                <h3 className={`${getTextSize("h3")} font-semibold`}>
                  Select Sensor Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {deviceTypesConfig.map((deviceType) => (
                    <Card
                      key={deviceType.id}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                      onClick={() => handleDeviceTypeSelect(deviceType)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`p-2 rounded-lg ${deviceType.color} text-white group-hover:scale-110 transition-transform`}
                          >
                            <deviceType.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <h4
                            className={`font-semibold ${getTextSize(
                              "cardTitle"
                            )}`}
                          >
                            {deviceType.name}
                          </h4>
                        </div>
                        <p
                          className={`${getTextSize(
                            "bodySmall"
                          )} text-gray-600 dark:text-gray-400 mb-3 line-clamp-2`}
                        >
                          {deviceType.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {deviceType.units.slice(0, 3).map((unit) => (
                            <Badge
                              key={unit}
                              variant="outline"
                              className={getTextSize("badge")}
                            >
                              {unit}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Sensor Configuration Form
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger
                      value="basic"
                      className={`${getTextSize(
                        "button"
                      )} data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white`}
                    >
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger
                      value="location"
                      className={`${getTextSize(
                        "button"
                      )} data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white`}
                    >
                      Location
                    </TabsTrigger>
                    <TabsTrigger
                      value="advanced"
                      className={`${getTextSize(
                        "button"
                      )} data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white`}
                    >
                      Advanced
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="basic"
                    className="space-y-3 sm:space-y-4 mt-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="sensorName"
                          className={getTextSize("label")}
                        >
                          Sensor Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="sensorName"
                          placeholder="e.g., Temperature Sensor 01"
                          value={formData.sensorName}
                          onChange={(e) =>
                            handleInputChange("sensorName", e.target.value)
                          }
                          required
                          className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="sensorType"
                          className={getTextSize("label")}
                        >
                          Sensor Type
                        </Label>
                        <Input
                          id="sensorType"
                          value={formData.sensorType}
                          onChange={(e) =>
                            handleInputChange("sensorType", e.target.value)
                          }
                          required
                          className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="sensorModel"
                          className={getTextSize("label")}
                        >
                          Sensor Model <span className="text-red-500">*</span>
                        </Label>
                        {/*<Select
                          value={formData.sensorModel}
                          onValueChange={(value) =>
                            handleInputChange("sensorModel", value)
                          }
                        >
                          <SelectTrigger
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          >
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {deviceTypesConfig
                              .find((d) => d.id === selectedDeviceType)
                              ?.models.map((model) => (
                                <SelectItem
                                  key={model}
                                  value={model}
                                  className={getTextSize("input")}
                                >
                                  {model}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>*/}
                        <Input
                          id="sensorModel"
                          value={formData.sensorModel}
                          onChange={(e) =>
                            handleInputChange("sensorModel", e.target.value)
                          }
                          required
                          className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="sensorSerialNumber"
                          className={getTextSize("label")}
                        >
                          Serial Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="sensorSerialNumber"
                            placeholder="e.g., DHT22-001-2024"
                            value={formData.sensorSerialNumber}
                            onChange={(e) =>
                              handleInputChange(
                                "sensorSerialNumber",
                                e.target.value
                              )
                            }
                            required
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          />
                          {/*<Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const serial = generateSerialNumber(
                                formData.sensorType,
                                formData.sensorModel
                              );
                              handleInputChange("sensorSerialNumber", serial);
                            }}
                            className={`px-2 sm:px-3 ${getTextSize("button")}`}
                          >
                            Auto
                          </Button>*/}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="unitOfMeasurement"
                          className={getTextSize("label")}
                        >
                          Unit of Measurement{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.unitOfMeasurement}
                          onValueChange={(value) =>
                            handleInputChange("unitOfMeasurement", value)
                          }
                        >
                          <SelectTrigger
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          >
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {deviceTypesConfig
                              .find((d) => d.id === selectedDeviceType)
                              ?.units.map((unit) => (
                                <SelectItem
                                  key={unit}
                                  value={unit}
                                  className={getTextSize("input")}
                                >
                                  {unit}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="deviceId"
                          className={getTextSize("label")}
                        >
                          Device ID (Optional)
                        </Label>
                        <Input
                          id="deviceId"
                          placeholder="e.g., 1212"
                          value={formData.deviceId}
                          onChange={(e) =>
                            handleInputChange("deviceId", e.target.value)
                          }
                          type="number"
                          className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                      </div>

                      {/*companyand client}
                      <div className="space-y-2">
                        {/* Company Dropdown */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="company"
                          className={`${getTextSize("formLabel")} `}
                        >
                          {t("company")} <span className="text-red-500">*</span>
                        </Label>

                        <Select
                          value={
                            formData.companyId !== null
                              ? String(formData.companyId)
                              : ""
                          }
                          onValueChange={(value) =>
                            handleInputChange("companyId", value)
                          }
                        >
                          <SelectTrigger className={getTextSize("formInput")}>
                            <SelectValue placeholder={t("selectCompany")} />
                          </SelectTrigger>

                          <SelectContent>
                            {companyOptions.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Client Dropdown */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="client"
                          className={`${getTextSize("formLabel")}`}
                        >
                          {t("client")} <span className="text-red-500">*</span>
                        </Label>

                        <Select
                          value={
                            formData.clientId !== null
                              ? String(formData.clientId)
                              : ""
                          }
                          onValueChange={(value) =>
                            handleInputChange("clientId", value)
                          }
                        >
                          <SelectTrigger className={getTextSize("formInput")}>
                            <SelectValue placeholder={t("selectClient")} />
                          </SelectTrigger>

                          <SelectContent>
                            {clientOptions.map((client) => (
                              <SelectItem
                                key={client.clientId}
                                value={String(client.clientId)}
                              >
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="devEUI"
                          className={getTextSize("label")}
                        >
                          DevEUI (Optional)
                        </Label>
                        <Input
                          id="devEUI"
                          placeholder="e.g., device-ui-identifier"
                          value={formData.devEUI}
                          onChange={(e) =>
                            handleInputChange("devEUI", e.target.value)
                          }
                          className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="gatewayId"
                          className={getTextSize("label")}
                        >
                          Gateway <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.gatewayId}
                          onValueChange={(value) =>
                            handleInputChange("gatewayId", value)
                          }
                          required
                        >
                          <SelectTrigger
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          >
                            <SelectValue placeholder="Select gateway" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGateways.map((gateway) => (
                              <SelectItem
                                key={gateway.gatewayId}
                                value={gateway.gatewayId.toString()}
                                className={getTextSize("input")}
                              >
                                {gateway.gatewayName} - {gateway.locationName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="location"
                    className="space-y-3 sm:space-y-4 mt-4"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="locationName"
                          className={getTextSize("label")}
                        >
                          Location Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="locationName"
                          placeholder="e.g., Field 1, Plant Zone A"
                          value={formData.locationName}
                          onChange={(e) =>
                            handleInputChange("locationName", e.target.value)
                          }
                          required
                          className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          className={`bg-transparent w-full sm:w-auto ${getTextSize(
                            "button"
                          )}`}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Use Current Location
                        </Button>
                        <span
                          className={`${getTextSize(
                            "caption"
                          )} text-gray-500 dark:text-gray-400`}
                        >
                          Or enter coordinates manually
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="latitude"
                            className={getTextSize("label")}
                          >
                            Latitude
                          </Label>
                          <Input
                            id="latitude"
                            placeholder="e.g., 12.454"
                            value={formData.latitude}
                            onChange={(e) =>
                              handleInputChange("latitude", e.target.value)
                            }
                            type="number"
                            step="any"
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="longitude"
                            className={getTextSize("label")}
                          >
                            Longitude
                          </Label>
                          <Input
                            id="longitude"
                            placeholder="e.g., 23231.65"
                            value={formData.longitude}
                            onChange={(e) =>
                              handleInputChange("longitude", e.target.value)
                            }
                            type="number"
                            step="any"
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="advanced"
                    className="space-y-3 sm:space-y-4 mt-4"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="minValue"
                            className={getTextSize("label")}
                          >
                            Minimum Value
                          </Label>
                          <Input
                            id="minValue"
                            placeholder="e.g., 0.0"
                            value={formData.minValue}
                            onChange={(e) =>
                              handleInputChange("minValue", e.target.value)
                            }
                            type="number"
                            step="any"
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="maxValue"
                            className={getTextSize("label")}
                          >
                            Maximum Value
                          </Label>
                          <Input
                            id="maxValue"
                            placeholder="e.g., 20.0"
                            value={formData.maxValue}
                            onChange={(e) =>
                              handleInputChange("maxValue", e.target.value)
                            }
                            type="number"
                            step="any"
                            className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                              "input"
                            )}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="calibrationData"
                          className={getTextSize("label")}
                        >
                          Calibration Data
                        </Label>
                        <Textarea
                          id="calibrationData"
                          placeholder="data"
                          value={formData.calibrationData}
                          onChange={(e) =>
                            handleInputChange("calibrationData", e.target.value)
                          }
                          rows={3}
                          className={`font-mono bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 ${getTextSize(
                            "input"
                          )}`}
                        />
                        <p
                          className={`${getTextSize(
                            "caption"
                          )} text-gray-500 dark:text-gray-400`}
                        >
                          Enter calibration parameters or data
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedDeviceType(null);
                      setFormData(initialFormData);
                      attemptClose();
                    }}
                    className={`flex-1 sm:flex-none ${getTextSize("button")}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={attemptClose}
                    className={`flex-1 sm:flex-none ${getTextSize("button")}`}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 sm:flex-none ${getTextSize("button")}`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Sensor
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </ScrollArea>

          {/* Inline confirmation inside the SAME dialog */}
          {showExitPrompt && (
            <div className="sticky bottom-0 mt-3 rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900 p-4">
              <div
                className={`flex items-center justify-between gap-3 flex-row`}
              >
                <p
                  className={`${getTextSize(
                    "body"
                  )} text-yellow-900 dark:text-yellow-100`}
                >
                  {t("discardChangesTitle") || "Discard changes?"}
                  <span className="block text-sm text-yellow-800 dark:text-yellow-200">
                    {t("discardChangesDescription") ||
                      "You have unsaved changes. If you leave, your changes will be lost."}
                  </span>
                </p>
                <div className={`flex gap-2 flex-row-reverse`}>
                  <Button
                    variant="outline"
                    onClick={() => setShowExitPrompt(false)}
                  >
                    {t("cancel") || "Cancel"}
                  </Button>
                  <Button variant="destructive" onClick={resetAndClose}>
                    {t("ok") || "OK"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Device Name Prompt Dialog */}
      <Dialog
        open={showDeviceNameDialog}
        onOpenChange={setShowDeviceNameDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register Alert Device</DialogTitle>
            <DialogDescription>
              Enter a name for this device before registering for alerts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              placeholder="e.g., John's Laptop"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
            />
            {deviceId && (
              <p className="text-xs text-gray-500 break-all">
                Device ID: {deviceId}
              </p>
            )}
            {fcmError && <p className="text-xs text-red-600">{fcmError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeviceNameDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDeviceRegistration}
                disabled={isRegistering || !deviceNameInput.trim()}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Token Dialog */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Alert Token
            </DialogTitle>
            <DialogDescription>Copy this alert token.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alert Token</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={fcmToken || "No token available"}
                  readOnly
                  className="font-mono text-xs bg-gray-50 dark:bg-gray-900"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={async () => {
                    if (fcmToken) {
                      try {
                        await navigator.clipboard.writeText(fcmToken);
                        setTokenCopied(true);
                        toast({
                          title: "Token Copied",
                          description:
                            "Alert token has been copied to clipboard",
                        });
                        setTimeout(() => setTokenCopied(false), 2000);
                      } catch (err) {
                        console.error("Failed to copy token:", err);
                        toast({
                          title: "Copy Failed",
                          description: "Failed to copy token to clipboard",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  {tokenCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
