"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraggableWidget } from "@/components/ui/draggable-widget";
import { RealTimeIndicator } from "@/components/ui/real-time-indicator";
import { useAuth } from "@/contexts/auth-context";
import { getTextSize } from "@/lib/text-sizes";
import {
  Activity,
  Cpu,
  Router,
  Wifi,
  TrendingUp,
  TrendingDown,
  Bell,
  Map,
  Settings,
  RefreshCw,
  Clock,
  Zap,
  ThermometerSun,
  Droplets,
  Waves,
  ArrowRight,
  Plus,
  Building,
  AlertTriangle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "@/services/dashboard-service";
import { useAlert } from "@/contexts/alert-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { alertService } from "@/services/alerts-service";
import type { AlertResponse } from "@/services/alerts-service";
import { formatDateTime } from "@/lib/DateTimeFormatter";

// Mock data for charts with real-time updates
const generateTemperatureData = () => [
  { time: "00:00", value: 22.5 + Math.random() * 2 },
  { time: "04:00", value: 21.8 + Math.random() * 2 },
  { time: "08:00", value: 24.2 + Math.random() * 2 },
  { time: "12:00", value: 28.5 + Math.random() * 2 },
  { time: "16:00", value: 31.2 + Math.random() * 2 },
  { time: "20:00", value: 26.8 + Math.random() * 2 },
];

const generateHumidityData = () => [
  { time: "00:00", value: 65 + Math.random() * 10 },
  { time: "04:00", value: 68 + Math.random() * 10 },
  { time: "08:00", value: 62 + Math.random() * 10 },
  { time: "12:00", value: 55 + Math.random() * 10 },
  { time: "16:00", value: 48 + Math.random() * 10 },
  { time: "20:00", value: 58 + Math.random() * 10 },
];

/*const stats = [
  {
    title: "Total Devices",
    value: "1,247",
    change: "+12%",
    trend: "up",
    icon: Cpu,
    color: "text-blue-600",
  },
  {
    title: "Active Gateways",
    value: "89",
    change: "+3%",
    trend: "up",
    icon: Router,
    color: "text-green-600",
  },
  {
    title: "Data Points Today",
    value: "2.4M",
    change: "+18%",
    trend: "up",
    icon: Activity,
    color: "text-purple-600",
  },
  {
    title: "Network Uptime",
    value: "99.8%",
    change: "-0.1%",
    trend: "down",
    icon: Wifi,
    color: "text-orange-600",
  },
]*/

/*const recentAlerts = [
  {
    id: 1,
    type: "warning",
    message: "Temperature sensor offline in Zone A",
    time: "2 min ago",
  },
  {
    id: 2,
    type: "error",
    message: "Gateway connection lost - Building 3",
    time: "15 min ago",
  },
  {
    id: 3,
    type: "success",
    message: "New device registered successfully",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "info",
    message: "Scheduled maintenance completed",
    time: "2 hours ago",
  },
];*/

const deviceStatus = [
  { name: "Temperature Sensors", total: 450, online: 442, offline: 8 },
  { name: "Humidity Sensors", total: 320, online: 318, offline: 2 },
  { name: "Motion Detectors", total: 180, online: 175, offline: 5 },
  { name: "Smart Meters", total: 297, online: 290, offline: 7 },
];

const quickActions: Array<{
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  link: string;
  onClick?: () => void;
}> = [
  {
    name: "View All Sensors",
    icon: Cpu,
    color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    link: "/dashboard/sensors",
  },
  {
    name: "Alerts",
    icon: AlertTriangle,
    color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
    link: "/dashboard/alerts",
  },
  {
    name: "Check Gateways",
    icon: Router,
    color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    link: "/dashboard/gateways",
  },
  {
    name: "View Device Map",
    icon: Map,
    color:
      "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    link: "/dashboard/maps",
  },
  {
    name: "Manage Rules",
    icon: Zap,
    color:
      "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    link: "/dashboard/rules",
  },
];

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "Humidity",
    color: "hsl(var(--chart-2))",
  },
  packets: {
    label: "Packets",
    color: "hsl(var(--chart-3))",
  },
};

export default function DashboardPage() {
  const { user, selectedCompany, selectedClient } = useAuth();
  const { isAlertActive, startAlert, setAlertInfo } = useAlert();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [temperatureData, setTemperatureData] = useState(
    generateTemperatureData()
  );
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [recentAlerts, setRecentAlerts] = useState<AlertResponse[]>([]);
  const [companyCount, setCompanyCount] = useState<number>(0);
  const [hasDevices, setHasDevices] = useState<boolean>(true);
  const [hasCompanies, setHasCompanies] = useState<boolean>(true);
  const [humidityData, setHumidityData] = useState(generateHumidityData());
  const [widgets, setWidgets] = useState([
    { id: "temp", title: "Temperature", visible: true },
    { id: "humidity", title: "Humidity", visible: true },
    { id: "alerts", title: "Alerts", visible: true },
    { id: "devices", title: "Device Status", visible: true },
  ]);
  const statsRequestRef = useRef<AbortController | null>(null);

  const isSuperAdmin = user?.role === "ROLE_ADMIN";

  const isHandlingClickRef = useRef(false);

  const handleAlertDemoClick = useCallback(() => {
    // Guard: Prevent rapid clicking/race conditions
    if (isHandlingClickRef.current) {
      return;
    }

    isHandlingClickRef.current = true;

    // Set alert information for the demo
    setAlertInfo({
      title: "Critical Leak Detected",
      message:
        "Sensor #1234 in Building A has exceeded the leakage threshold. Immediate action required.",
      sensorId: "1234",
      location: "Building A, Floor 2, Room 204",
      timestamp: new Date(),
    });

    // Open the modal – sound will start when the modal becomes visible
    setShowAlertModal(true);

    // Reset guard after a short delay to allow normal clicking
    setTimeout(() => {
      isHandlingClickRef.current = false;
    }, 300);
  }, [setAlertInfo]);

  // Start the alert sound when the modal is opened
  useEffect(() => {
    if (showAlertModal && !isAlertActive) {
      startAlert();
    }
  }, [showAlertModal, isAlertActive, startAlert]);

  const quickActionsForUser = useMemo(() => {
    if (!isSuperAdmin) return quickActions;

    return [
      ...quickActions,
      {
        name: "Alerts Demo",
        icon: AlertTriangle,
        color:
          "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
        link: "#",
        onClick: handleAlertDemoClick,
      },
    ];
  }, [isSuperAdmin, handleAlertDemoClick]);

  // Real-time data updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTemperatureData(generateTemperatureData());
      setHumidityData(generateHumidityData());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  const loadDashboardStats = useCallback(
    async (options?: { showSpinner?: boolean }) => {
      if (statsRequestRef.current) {
        statsRequestRef.current.abort();
      }

      const controller = new AbortController();
      statsRequestRef.current = controller;

      if (options?.showSpinner) {
        setRefreshing(true);
      }

      try {
        const dashboardResp = await dashboardService.getDashboardData({
          companyId: selectedCompany?.id ?? null,
          clientId: selectedClient?.id ?? null,
          signal: controller.signal,
        });
        if (dashboardResp) {
          setDeviceCount(dashboardResp.deviceCount ?? 0);
          setCompanyCount(dashboardResp.companyCount ?? 0);
          setHasDevices(dashboardResp.hasDevices ?? true);
          setHasCompanies(dashboardResp.hasCompanies ?? true);
        }
      } catch (e) {
        if (
          !(
            e instanceof DOMException &&
            (e.name === "AbortError" ||
              e.message === "The user aborted a request.")
          )
        ) {
          console.error("Failed loading stats", e);
        }
      } finally {
        if (options?.showSpinner) {
          setRefreshing(false);
        }
      }
    },
    [selectedClient?.id, selectedCompany?.id]
  );

  useEffect(() => {
    void loadDashboardStats();

    return () => {
      if (statsRequestRef.current) {
        statsRequestRef.current.abort();
      }
    };
  }, [loadDashboardStats]);

  const refreshData = () => {
    setTemperatureData(generateTemperatureData());
    setHumidityData(generateHumidityData());
    void loadDashboardStats({ showSpinner: true });
  };

  useEffect(() => {
    async function loadAlerts() {
      const res = await alertService.listAlerts({
        companyId: selectedCompany?.id ?? null,
        clientId: selectedClient?.id ?? null,
        alertStatus: "ACTIVE",
      });

      if (res) {
        setRecentAlerts(res.alerts);
      }
    }

    loadAlerts();
  }, [selectedClient?.id, selectedCompany?.id]);
  const type = "warning"; // fallback to constant colour

  //set real values for cards
  const stats = [
    {
      title: "Total Companies",
      value: companyCount.toLocaleString(),
      change: "+12%",
      trend: "up",
      icon: Building,
      color: "text-blue-600",
      visible: hasCompanies,
    },
    {
      title: "Total Devices",
      value: deviceCount.toLocaleString(),
      change: "+12%",
      trend: "up",
      icon: Cpu,
      color: "text-blue-600",
      visible: hasDevices,
    },
    {
      title: "Active Gateways",
      value: "89",
      change: "+3%",
      trend: "up",
      icon: Router,
      color: "text-green-600",
      visible: true, // Keep hardcoded cards visible
    },
    {
      title: "Data Points Today",
      value: "2.4M",
      change: "+18%",
      trend: "up",
      icon: Activity,
      color: "text-purple-600",
      visible: true, // Keep hardcoded cards visible
    },
    {
      title: "Network Uptime",
      value: "99.8%",
      change: "-0.1%",
      trend: "down",
      icon: Wifi,
      color: "text-orange-600",
      visible: true, // Keep hardcoded cards visible
    },
  ].filter((stat) => stat.visible !== false);
  const removeWidget = (widgetId: string) => {
    setWidgets(
      widgets.map((w) => (w.id === widgetId ? { ...w, visible: false } : w))
    );
  };

  const addWidget = (widgetId: string) => {
    setWidgets(
      widgets.map((w) => (w.id === widgetId ? { ...w, visible: true } : w))
    );
  };

  const companyBadgeLabel = useMemo(
    () => selectedCompany?.name ?? selectedCompany?.appName ?? "Worldwide",
    [selectedCompany?.appName, selectedCompany?.name]
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Header with Welcome and Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0"
      >
        <div className="space-y-1 sm:space-y-2">
          <h1
            className={`font-bold text-gray-900 dark:text-white ${getTextSize(
              "h1"
            )}`}
          >
            Welcome back, {user?.username || "User"}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={getTextSize("badge")}>
              {companyBadgeLabel}
            </Badge>
            {user?.role && (
              <Badge variant="secondary" className={getTextSize("badge")}>
                {user.role.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <p
              className={`text-gray-600 dark:text-gray-400 flex items-center gap-2 ${getTextSize(
                "body"
              )}`}
            >
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="sm:hidden">
                {currentTime.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
            <RealTimeIndicator isConnected={true} lastUpdate="Just now" />
          </div>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className={`h-8 sm:h-9 bg-transparent ${getTextSize("button")}`}
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button
            className={`flex items-center gap-2 h-8 sm:h-9 ${getTextSize(
              "button"
            )}`}
            size="sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            Add Widget
          </Button>
        </div>
      </motion.div>

      {/* Tabs for different dashboard views */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px] mb-4 h-9 sm:h-10">
          <TabsTrigger value="overview" className={getTextSize("button")}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className={getTextSize("button")}>
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className={getTextSize("button")}>
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                    <CardTitle
                      className={`font-medium text-gray-600 dark:text-gray-400 leading-tight ${getTextSize(
                        "statLabel"
                      )}`}
                    >
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`p-1 sm:p-2 rounded-full ${stat.color.replace(
                        "text",
                        "bg"
                      )} bg-opacity-20 dark:bg-opacity-30`}
                    >
                      <stat.icon
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          stat.color
                        } dark:${stat.color.replace("600", "400")}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div
                      className={`font-bold dark:text-white ${getTextSize(
                        "statValue"
                      )}`}
                    >
                      {stat.value}
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 ${getTextSize(
                        "caption"
                      )}`}
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                      )}
                      <span
                        className={
                          stat.trend === "up"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {stat.change}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">
                        from last month
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions (moved directly below stats) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle
                  className={`dark:text-white ${getTextSize("cardTitle")}`}
                >
                  Quick Actions
                </CardTitle>
                <CardDescription
                  className={`dark:text-gray-400 ${getTextSize("cardText")}`}
                >
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  {quickActionsForUser.map((action, index) => (
                    <motion.div
                      key={action.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className={`w-full h-full flex flex-col items-center justify-center gap-2 py-3 sm:py-4 lg:py-6 hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[80px] sm:min-h-[100px] bg-transparent ${getTextSize(
                          "button"
                        )}`}
                        onClick={action.onClick}
                        asChild={!action.onClick}
                      >
                        {action.onClick ? (
                          <>
                            <div
                              className={`p-2 sm:p-3 rounded-full ${
                                action.color.split(" ")[0]
                              } ${action.color.split(" ")[1]}`}
                            >
                              <action.icon
                                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  action.color.split(" ")[2]
                                } ${action.color.split(" ")[3]}`}
                              />
                            </div>
                            <span
                              className={`font-medium dark:text-white text-center leading-tight ${getTextSize(
                                "widgetText"
                              )}`}
                            >
                              {action.name}
                            </span>
                          </>
                        ) : (
                          <a href={action.link}>
                            <div
                              className={`p-2 sm:p-3 rounded-full ${
                                action.color.split(" ")[0]
                              } ${action.color.split(" ")[1]}`}
                            >
                              <action.icon
                                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  action.color.split(" ")[2]
                                } ${action.color.split(" ")[3]}`}
                              />
                            </div>
                            <span
                              className={`font-medium dark:text-white text-center leading-tight ${getTextSize(
                                "widgetText"
                              )}`}
                            >
                              {action.name}
                            </span>
                          </a>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Draggable Widgets Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Alerts Widget */}
            {widgets.find((w) => w.id === "alerts")?.visible && (
              <DraggableWidget
                title="Recent Alerts"
                onRemove={() => removeWidget("alerts")}
                onSettings={() => console.log("Settings for alerts")}
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`font-normal ${getTextSize("badge")}`}
                    >
                      {recentAlerts.length} new
                    </Badge>
                    <RealTimeIndicator isConnected={true} />
                  </div>
                  {recentAlerts.map((alert) => (
                    <motion.div
                      key={alert.alertId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: alert.alertId * 0.1 }}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          /*alert.type === "error"
                            ? "bg-red-500"
                            : alert.type === "warning"
                            ? "bg-orange-500"
                            : alert.type === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"*/
                          type === "warning"
                            ? "bg-orange-500"
                            : type === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-gray-900 dark:text-white line-clamp-2 ${getTextSize(
                            "widgetText"
                          )}`}
                        >
                          {alert.alertMessage}
                        </p>
                        <p
                          className={`text-gray-500 dark:text-gray-400 mt-1 ${getTextSize(
                            "caption"
                          )}`}
                        >
                          {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </DraggableWidget>
            )}

            {/* Device Status Widget */}
            {widgets.find((w) => w.id === "devices")?.visible && (
              <DraggableWidget
                title="Device Status"
                onRemove={() => removeWidget("devices")}
                onSettings={() => console.log("Settings for devices")}
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`font-normal ${getTextSize("badge")}`}
                    >
                      {deviceStatus.reduce(
                        (sum, device) => sum + device.offline,
                        0
                      )}{" "}
                      offline
                    </Badge>
                    <RealTimeIndicator isConnected={true} />
                  </div>
                  {deviceStatus.map((device, index) => {
                    const percentage = (device.online / device.total) * 100;
                    return (
                      <motion.div
                        key={device.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-medium dark:text-white truncate pr-2 ${getTextSize(
                              "widgetText"
                            )}`}
                          >
                            {device.name}
                          </span>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-green-600 dark:text-green-400 ${getTextSize(
                                "badge"
                              )}`}
                            >
                              {device.online}
                            </Badge>
                            {device.offline > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-red-600 dark:text-red-400 ${getTextSize(
                                  "badge"
                                )}`}
                              >
                                {device.offline}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p
                          className={`text-gray-500 dark:text-gray-400 ${getTextSize(
                            "caption"
                          )}`}
                        >
                          {percentage.toFixed(1)}% operational
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </DraggableWidget>
            )}
          </div>

          {/* Live Sensor Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle
                  className={`dark:text-white ${getTextSize("cardTitle")}`}
                >
                  Live Sensor Data
                </CardTitle>
                <CardDescription
                  className={`dark:text-gray-400 ${getTextSize("cardText")}`}
                >
                  Real-time readings from key sensors
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    {
                      name: "Temperature",
                      value: "24.5°C",
                      trend: "+0.8°C",
                      icon: ThermometerSun,
                      color: "text-red-600 dark:text-red-400",
                      bgColor: "bg-red-100 dark:bg-red-900",
                    },
                    {
                      name: "Humidity",
                      value: "58%",
                      trend: "-2%",
                      icon: Droplets,
                      color: "text-blue-600 dark:text-blue-400",
                      bgColor: "bg-blue-100 dark:bg-blue-900",
                    },
                    {
                      name: "Soil Moisture",
                      value: "240 cb",
                      trend: "+10 cb",
                      icon: Waves,
                      color: "text-green-600 dark:text-green-400",
                      bgColor: "bg-green-100 dark:bg-green-900",
                    },
                  ].map((sensor, index) => (
                    <motion.div
                      key={sensor.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 p-3 sm:p-4 hover:shadow-md transition-shadow widget-active"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`p-2 rounded-full ${sensor.bgColor} flex-shrink-0`}
                        >
                          <sensor.icon
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${sensor.color}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-medium text-gray-900 dark:text-white data-live truncate ${getTextSize(
                              "widgetText"
                            )}`}
                          >
                            {sensor.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`font-bold dark:text-white ${getTextSize(
                                "statValue"
                              )}`}
                            >
                              {sensor.value}
                            </span>
                            <span
                              className={`${
                                sensor.trend.startsWith("+")
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-green-600 dark:text-green-400"
                              } ${getTextSize("caption")}`}
                            >
                              {sensor.trend}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="px-3 sm:px-6 pb-3 sm:pb-6 pt-0">
                <Button
                  variant="outline"
                  className={`w-full flex items-center justify-center gap-2 h-8 sm:h-9 bg-transparent ${getTextSize(
                    "button"
                  )}`}
                >
                  View All Sensor Data
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 sm:space-y-6">
          {/* Performance Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Temperature Chart Widget */}
            {widgets.find((w) => w.id === "temp")?.visible && (
              <DraggableWidget
                title="Temperature Trend"
                onRemove={() => removeWidget("temp")}
                onSettings={() => console.log("Settings for temperature")}
              >
                <div className="space-y-2">
                  <RealTimeIndicator isConnected={true} lastUpdate="30s ago" />
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={temperatureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" fontSize={12} />
                        <YAxis fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--color-temperature)"
                          strokeWidth={2}
                          name="Temperature (°C)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </DraggableWidget>
            )}

            {/* Humidity Chart Widget */}
            {widgets.find((w) => w.id === "humidity")?.visible && (
              <DraggableWidget
                title="Humidity Trend"
                onRemove={() => removeWidget("humidity")}
                onSettings={() => console.log("Settings for humidity")}
              >
                <div className="space-y-2">
                  <RealTimeIndicator isConnected={true} lastUpdate="30s ago" />
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={humidityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" fontSize={12} />
                        <YAxis fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="var(--color-humidity)"
                          strokeWidth={2}
                          name="Humidity (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </DraggableWidget>
            )}
          </div>

          {/* System Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle
                  className={`dark:text-white ${getTextSize("cardTitle")}`}
                >
                  System Performance
                </CardTitle>
                <CardDescription
                  className={`dark:text-gray-400 ${getTextSize("cardText")}`}
                >
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    {
                      name: "CPU Usage",
                      value: "32%",
                      max: "100%",
                      color: "bg-blue-500",
                    },
                    {
                      name: "Memory Usage",
                      value: "2.4GB",
                      max: "8GB",
                      color: "bg-green-500",
                    },
                    {
                      name: "Storage",
                      value: "45GB",
                      max: "100GB",
                      color: "bg-purple-500",
                    },
                  ].map((metric, index) => {
                    const percentage =
                      (Number.parseInt(metric.value) /
                        Number.parseInt(metric.max.replace(/\D/g, ""))) *
                      100;
                    return (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between">
                          <span
                            className={`font-medium dark:text-white ${getTextSize(
                              "widgetText"
                            )}`}
                          >
                            {metric.name}
                          </span>
                          <span
                            className={`text-gray-600 dark:text-gray-400 ${getTextSize(
                              "widgetText"
                            )}`}
                          >
                            {metric.value} / {metric.max}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${metric.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 sm:space-y-6">
          {/* System Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle
                  className={`dark:text-white ${getTextSize("cardTitle")}`}
                >
                  System Insights
                </CardTitle>
                <CardDescription
                  className={`dark:text-gray-400 ${getTextSize("cardText")}`}
                >
                  AI-powered recommendations and insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                {[
                  {
                    title: "Potential Energy Savings",
                    description:
                      "Based on your usage patterns, you could save up to 15% on energy by optimizing temperature sensor settings in Building A.",
                    icon: Zap,
                    color: "text-yellow-600 dark:text-yellow-400",
                    bgColor: "bg-yellow-100 dark:bg-yellow-900",
                  },
                  {
                    title: "Maintenance Required",
                    description:
                      "Humidity sensor in Zone B shows irregular readings. Scheduled maintenance is recommended within the next 7 days.",
                    icon: Settings,
                    color: "text-blue-600 dark:text-blue-400",
                    bgColor: "bg-blue-100 dark:bg-blue-900",
                  },
                  {
                    title: "Network Optimization",
                    description:
                      "Gateway 3 is handling 45% of all traffic. Consider redistributing sensors to balance the network load.",
                    icon: Activity,
                    color: "text-green-600 dark:text-green-400",
                    bgColor: "bg-green-100 dark:bg-green-900",
                  },
                ].map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div
                      className={`p-2 rounded-full ${insight.bgColor} self-start flex-shrink-0`}
                    >
                      <insight.icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${insight.color}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`font-medium text-gray-900 dark:text-white ${getTextSize(
                          "widgetTitle"
                        )}`}
                      >
                        {insight.title}
                      </h3>
                      <p
                        className={`text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${getTextSize(
                          "widgetText"
                        )}`}
                      >
                        {insight.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
              <CardFooter className="px-3 sm:px-6 pb-3 sm:pb-6">
                <Button
                  variant="outline"
                  className={`w-full h-8 sm:h-9 bg-transparent ${getTextSize(
                    "button"
                  )}`}
                >
                  View All Insights
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Predictive Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle
                  className={`dark:text-white ${getTextSize("cardTitle")}`}
                >
                  Predictive Analytics
                </CardTitle>
                <CardDescription
                  className={`dark:text-gray-400 ${getTextSize("cardText")}`}
                >
                  Forecasts based on historical data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    {
                      title: "Temperature Forecast",
                      prediction:
                        "Expected to rise by 3°C over the next 24 hours",
                      confidence: "High (92%)",
                      icon: ThermometerSun,
                      color: "text-red-600 dark:text-red-400",
                      bgColor: "bg-red-100 dark:bg-red-900",
                    },
                    {
                      title: "Humidity Forecast",
                      prediction:
                        "Expected to decrease by 5% over the next 24 hours",
                      confidence: "Medium (78%)",
                      icon: Droplets,
                      color: "text-blue-600 dark:text-blue-400",
                      bgColor: "bg-blue-100 dark:bg-blue-900",
                    },
                  ].map((forecast, index) => (
                    <Card
                      key={forecast.title}
                      className="border shadow-sm dark:bg-gray-700 dark:border-gray-600"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${forecast.bgColor} flex-shrink-0`}
                          >
                            <forecast.icon
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${forecast.color}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3
                              className={`font-medium text-gray-900 dark:text-white ${getTextSize(
                                "widgetTitle"
                              )}`}
                            >
                              {forecast.title}
                            </h3>
                            <p
                              className={`text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${getTextSize(
                                "widgetText"
                              )}`}
                            >
                              {forecast.prediction}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`text-gray-500 dark:text-gray-400 ${getTextSize(
                                  "caption"
                                )}`}
                              >
                                Confidence:
                              </span>
                              <Badge
                                variant="outline"
                                className={getTextSize("badge")}
                              >
                                {forecast.confidence}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Alert Modal with Jumping Animation */}
      <Dialog
        open={showAlertModal}
        onOpenChange={setShowAlertModal}
      >
        <DialogContent 
          className="sm:max-w-[500px] p-0 overflow-hidden border-2 border-red-500 dark:border-red-600"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/40 p-6"
          >
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="p-3 rounded-full bg-red-500 dark:bg-red-600"
                >
                  <AlertTriangle className="w-8 h-8 text-white" />
                </motion.div>
                <DialogTitle className={`text-2xl font-bold text-red-800 dark:text-red-200 ${getTextSize("h2")}`}>
                  Critical Alert
                </DialogTitle>
              </div>
              <DialogDescription className={`text-red-700 dark:text-red-300 ${getTextSize("body")}`}>
                An urgent alert has been triggered. Please review the details below.
              </DialogDescription>
            </DialogHeader>
          </motion.div>

          <div className="p-6 space-y-4 bg-white dark:bg-gray-800">
            <div className="space-y-3">
              <div>
                <h3 className={`font-semibold text-gray-900 dark:text-white mb-2 ${getTextSize("h4")}`}>
                  Alert Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Critical Leak Detected</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Sensor #1234 in Building A has exceeded the leakage threshold.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Location</p>
                      <p className="text-gray-600 dark:text-gray-400">Building A, Floor 2, Room 204</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Time</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date().toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${getTextSize("bodySmall")}`}>
                The alert sound will continue playing until you navigate to the alert details page and stop it manually, or reload the page.
              </p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowAlertModal(false)}
              className={getTextSize("button")}
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                setShowAlertModal(false);
                router.push("/dashboard/alerts");
              }}
              className={`bg-red-600 hover:bg-red-700 text-white ${getTextSize("button")}`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Alert Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
