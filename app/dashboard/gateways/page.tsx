"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddGatewayForm } from "@/components/forms/add-gateway-form";
import { useLanguage } from "@/contexts/language-context";
import { getTextSize } from "@/lib/text-sizes";
import {
  Zap,
  Search,
  Filter,
  MoreVertical,
  Wifi,
  WifiOff,
  MapPin,
  Cpu,
  Globe,
  Calendar,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Signal,
} from "lucide-react";
import { GatewayInfo, gatewayService } from "@/services/gateway-service";

// Mock data for gateways
const mockGateways = [
  {
    id: "gw_001",
    name: "Main Building Gateway",
    type: "LoRaWAN",
    status: "online",
    location: "Building A - Floor 1",
    region: "US915",
    lastSeen: "2024-01-15T10:30:00Z",
    devicesConnected: 12,
    signalStrength: 85,
    firmwareVersion: "v2.1.3",
  },
  {
    id: "gw_002",
    name: "Warehouse Gateway",
    type: "WiFi",
    status: "offline",
    location: "Warehouse - Zone B",
    region: "EU868",
    lastSeen: "2024-01-14T15:45:00Z",
    devicesConnected: 8,
    signalStrength: 0,
    firmwareVersion: "v2.0.1",
  },
  {
    id: "gw_003",
    name: "Parking Lot Gateway",
    type: "Cellular",
    status: "online",
    location: "Parking Area",
    region: "US915",
    lastSeen: "2024-01-15T11:15:00Z",
    devicesConnected: 5,
    signalStrength: 92,
    firmwareVersion: "v2.1.3",
  },
];

export default function GatewaysPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddGatewayOpen, setIsAddGatewayOpen] = useState(false);
  const [mockGateways, setMockGateways] = useState<GatewayInfo[]>([]);
  const { t, isRTL } = useLanguage();

  //  Fetch gateways on mount
  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const data = await gatewayService.getGateways();
        setMockGateways(data);
      } catch (err) {
        console.error("Failed to fetch gateways:", err);
        // setError(t("failedToLoadGateways"))
      } finally {
        //setLoading(false)
      }
    };

    fetchGateways();
  }, [t]);

  const filteredGateways = mockGateways.filter((gateway) => {
    const matchesSearch =
      gateway.gatewayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gateway.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gateway.gatewayType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" ||
      gateway.gatewayType.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus =
      selectedStatus === "all" || gateway.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t("justNow");
    if (diffInMinutes < 60)
      return t("minutesAgo").replace("{minutes}", diffInMinutes.toString());
    if (diffInMinutes < 1440)
      return t("hoursAgo").replace(
        "{hours}",
        Math.floor(diffInMinutes / 60).toString()
      );
    return t("daysAgo").replace(
      "{days}",
      Math.floor(diffInMinutes / 1440).toString()
    );
  };

  const getSignalIcon = (strength: number) => {
    if (strength === 0) return WifiOff;
    if (strength < 30) return Signal;
    if (strength < 70) return Wifi;
    return Signal;
  };

  const getSignalColor = (strength: number) => {
    if (strength === 0) return "text-gray-400";
    if (strength < 30) return "text-red-500";
    if (strength < 70) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div
      className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 ${
          isRTL ? "sm:flex-row-reverse" : ""
        }`}
      >
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1
            className={`font-bold text-gray-900 dark:text-white ${getTextSize(
              "h1"
            )}`}
          >
            {t("gateways")}
          </h1>
          <p
            className={`text-gray-600 dark:text-gray-400 ${getTextSize(
              "body"
            )}`}
          >
            {t("manageNetworkGateways")}
          </p>
        </div>
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" className={getTextSize("button")}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("refresh")}
          </Button>
          <Button
            onClick={() => setIsAddGatewayOpen(true)}
            className={getTextSize("button")}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t("addGateway")}
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 ${
          isRTL ? "sm:flex-row-reverse sm:space-x-reverse" : ""
        }`}
      >
        <div className="flex-1">
          <div className="relative">
            <Search
              className={`absolute ${
                isRTL ? "right-3" : "left-3"
              } top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`}
            />
            <Input
              placeholder={t("searchGateways")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${isRTL ? "pr-10" : "pl-10"} ${getTextSize("input")}`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        </div>
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className={`w-[140px] ${getTextSize("input")}`}>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={getTextSize("body")}>
                {t("allTypes")}
              </SelectItem>
              <SelectItem value="lorawan" className={getTextSize("body")}>
                LoRaWAN
              </SelectItem>
              <SelectItem value="wifi" className={getTextSize("body")}>
                WiFi
              </SelectItem>
              <SelectItem value="cellular" className={getTextSize("body")}>
                Cellular
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className={`w-[120px] ${getTextSize("input")}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={getTextSize("body")}>
                {t("allStatus")}
              </SelectItem>
              <SelectItem value="online" className={getTextSize("body")}>
                {t("online")}
              </SelectItem>
              <SelectItem value="offline" className={getTextSize("body")}>
                {t("offline")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: t("totalGateways"),
            value: mockGateways.length,
            icon: Zap,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            title: t("online"),
            value: mockGateways.filter((g) => g.status === "online").length,
            icon: CheckCircle,
            color: "text-green-600 dark:text-green-400",
          },
          {
            title: t("offline"),
            value: mockGateways.filter((g) => g.status === "offline").length,
            icon: AlertCircle,
            color: "text-red-600 dark:text-red-400",
          },
          {
            title: t("connectedDevices"),
            value: mockGateways.reduce((sum, g) => sum + g.devicesConnected, 0),
            icon: Wifi,
            color: "text-purple-600 dark:text-purple-400",
          },
        ].map((stat, index) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div
                className={`flex items-center justify-between ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p
                    className={`text-gray-600 dark:text-gray-400 ${getTextSize(
                      "bodySmall"
                    )}`}
                  >
                    {stat.title}
                  </p>
                  <p
                    className={`font-bold ${stat.color} ${getTextSize(
                      "statValue"
                    )}`}
                  >
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Gateways Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredGateways.map((gateway, index) => {
          const SignalIcon = getSignalIcon(gateway.signalStrength);
          const signalColor = getSignalColor(gateway.signalStrength);

          return (
            <motion.div
              key={gateway.gatewayId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700 h-full">
                <CardHeader className="pb-2">
                  <div
                    className={`flex items-start justify-between gap-2 ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <CardTitle
                        className={`${getTextSize(
                          "cardTitle"
                        )} font-semibold text-gray-900 dark:text-white truncate ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                        title={gateway.gatewayName}
                      >
                        {gateway.gatewayName}
                      </CardTitle>
                      <p
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-500 dark:text-gray-400 truncate ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        Serial #: {gateway.serialNumber}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            {t("details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("settings")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 dark:text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Status and Type */}
                    <div
                      className={`flex items-center justify-between gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Badge
                        variant={
                          gateway.status === "online"
                            ? "default"
                            : "destructive"
                        }
                        className={getTextSize("badge")}
                      >
                        {gateway.status === "online"
                          ? t("online")
                          : t("offline")}
                      </Badge>
                      <Badge variant="outline" className={getTextSize("badge")}>
                        {gateway.gatewayType}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div
                      className={`flex items-center gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-600 dark:text-gray-400 truncate ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {gateway.locationName}
                      </span>
                    </div>
                    {/* model */}
                    <div
                      className={`flex items-center gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-600 dark:text-gray-400 truncate ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {gateway.model}
                      </span>
                    </div>
                    {/* region */}
                    <div
                      className={`flex items-center gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-600 dark:text-gray-400 truncate ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {gateway.region}
                      </span>
                    </div>

                    {/* Signal Strength */}
                    <div
                      className={`flex items-center gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <SignalIcon
                        className={`w-4 h-4 ${signalColor} flex-shrink-0`}
                      />
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-600 dark:text-gray-400 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {gateway.signalStrength > 0
                          ? `${gateway.signalStrength}% ${t("signal")}`
                          : t("noSignal")}
                      </span>
                    </div>

                    {/* Connected Devices */}
                    <div
                      className={`flex items-center gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Wifi className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-600 dark:text-gray-400 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {gateway.devicesConnected} {t("devicesConnected")}
                      </span>
                    </div>

                    {/* Last Seen */}
                    <div
                      className={`flex items-center gap-2 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-500 dark:text-gray-400 ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {t("lastSeen")}: {formatLastSeen(gateway.lastSeen)}
                      </span>
                    </div>

                    {/* Firmware Version */}
                    <div
                      className={`pt-2 border-t dark:border-gray-600 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      <span
                        className={`${getTextSize(
                          "caption"
                        )} text-gray-500 dark:text-gray-400`}
                      >
                        {t("firmware")}: {gateway.firmwareVersion}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {filteredGateways.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3
            className={`font-semibold text-gray-900 dark:text-white mb-2 ${getTextSize(
              "h4"
            )}`}
          >
            {t("noGatewaysFound")}
          </h3>
          <p
            className={`text-gray-600 dark:text-gray-400 mb-4 ${getTextSize(
              "body"
            )}`}
          >
            {searchTerm || selectedType !== "all" || selectedStatus !== "all"
              ? t("tryAdjustingFilters")
              : t("getStartedByAdding")}
          </p>
          {!searchTerm &&
            selectedType === "all" &&
            selectedStatus === "all" && (
              <Button
                onClick={() => setIsAddGatewayOpen(true)}
                className={getTextSize("button")}
              >
                <Zap className="w-4 h-4 mr-2" />
                {t("addFirstGateway")}
              </Button>
            )}
        </motion.div>
      )}

      {/* Add Gateway Form */}
      <AddGatewayForm
        open={isAddGatewayOpen}
        onOpenChange={setIsAddGatewayOpen}
      />
    </div>
  );
}
