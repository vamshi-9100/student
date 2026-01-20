"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  sensorService,
  SensorInfo,
  SensorReading,
} from "@/services/sensor-service";
import { gatewayService, GatewayInfo } from "@/services/gateway-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Filter,
  Layers,
  Thermometer,
  Droplets,
  Waves,
  Router,
} from "lucide-react";
import { LoadScript, GoogleMap, OverlayView } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyC4cvLAx_eBq4Cbl5jSr_PLcGT6AJQK25U";

// Mock device locations
/*{
  const deviceLocations = [
    {
      id: "temp_001",
      name: "Temperature Sensor 1",
      type: "temperature",
      lat: 40.7128,
      lng: -74.006,
      status: "online",
      value: "23.5°C",
      location: "Building A - Floor 1",
    },
    {
      id: "humidity_001",
      name: "Humidity Sensor 1",
      type: "humidity",
      lat: 40.713,
      lng: -74.0058,
      status: "online",
      value: "65%",
      location: "Building A - Floor 2",
    },
    {
      id: "soil_001",
      name: "Soil Moisture 1",
      type: "soil",
      lat: 40.7125,
      lng: -74.0065,
      status: "warning",
      value: "180 cb",
      location: "Garden Area",
    },
    {
      id: "gateway_001",
      name: "Main Gateway",
      type: "gateway",
      lat: 40.7127,
      lng: -74.0062,
      status: "online",
      value: "24 devices",
      location: "Central Hub",
    },
  ];
}*/

export interface DeviceLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: string;
  value: string;
  location: string;
}

// Function that returns the final const array
export async function getDeviceLocations(): Promise<DeviceLocation[]> {
  const [gateways, sensors] = await Promise.all([
    gatewayService.getGateways(),
    sensorService.getSensors(),
  ]);

  const gatewayDevices: DeviceLocation[] = gateways.map((gw: GatewayInfo) => ({
    id: `gateway_${gw.gatewayId}`,
    name: gw.gatewayName,
    type: "gateway",
    lat: gw.latitude ? parseFloat(gw.latitude) : 0,
    lng: gw.longitude ? parseFloat(gw.longitude) : 0,
    status: gw.isActive ? "online" : "offline",
    value: `${gw.devicesConnected ?? 0} devices`,
    location: gw.locationName || "Unknown",
  }));

  const sensorDevices: DeviceLocation[] = sensors.map((sensor: SensorInfo) => ({
    id: `sensor_${sensor.sensorId}`,
    name: sensor.sensorName,
    type: sensor.sensorType.toLowerCase(),
    lat: sensor.latitude ?? 0,
    lng: sensor.longitude ?? 0,
    status: "online",
    value: sensor.unitOfMeasurement || "N/A",
    location: sensor.locationName || "Unknown",
  }));

  // ✅ Here it becomes the final const array
  const deviceLocations: DeviceLocation[] = [
    ...gatewayDevices,
    ...sensorDevices,
  ];

  return deviceLocations;
}

export default function MapsPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [mapView, setMapView] = useState<"satellite" | "roadmap" | "terrain">(
    "satellite"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [deviceLocations, setDeviceLocations] = useState<DeviceLocation[]>([]);

  useEffect(() => {
    async function fetchData() {
      const deviceLocations = await getDeviceLocations();
      console.log("Final const deviceLocations:", deviceLocations);
      setDeviceLocations(deviceLocations); // if rendering on a map
    }
    fetchData();
  }, []);

  const filteredDevices = deviceLocations.filter(
    (d) => filterType === "all" || d.type === filterType
  );

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return Thermometer;
      case "humidity":
        return Droplets;
      case "soil":
        return Waves;
      case "gateway":
        return Router;
      default:
        return MapPin;
    }
  };

  const defaultCenter = { lat: 40.7127, lng: -74.006 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 lg:items-center"
      >
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Device Maps
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Visualize your IoT devices on an interactive map
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Filters
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 sm:h-9 text-xs sm:text-sm bg-transparent"
              >
                <Layers className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="capitalize">{mapView}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setMapView("satellite")}>
                Satellite
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapView("roadmap")}>
                Street
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapView("terrain")}>
                Terrain
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
        >
          {["all", "temperature", "humidity", "soil", "gateway"].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              onClick={() => setFilterType(type)}
              className="capitalize text-xs sm:text-sm h-8 sm:h-9"
            >
              {type}
            </Button>
          ))}
        </motion.div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 h-[400px] sm:h-[500px] lg:h-[600px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-[400px] sm:h-[500px] lg:h-[400px] dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-0 h-full">
                <LoadScript
                  googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                  libraries={[]}
                >
                  <div className="relative w-full h-full">
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={mapCenter}
                      zoom={16}
                      mapTypeId={mapView}
                      onLoad={(map) => setMap(map)}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        zoomControl: true,
                      }}
                    >
                      {/* Overlay Markers */}
                      {filteredDevices.map((device) => {
                        const Icon = getDeviceIcon(device.type);
                        return (
                          <OverlayView
                            key={device.id}
                            position={{ lat: device.lat, lng: device.lng }}
                            mapPaneName={OverlayView.FLOAT_PANE}
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`p-2 rounded-full shadow-lg cursor-pointer ${
                                  device.status === "online"
                                    ? "bg-green-500"
                                    : device.status === "warning"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                //on click of sensor it is zoomed
                                onClick={() => {
                                  setSelectedDevice(device.id); // highlight in list
                                  if (map) {
                                    map.panTo({
                                      lat: device.lat,
                                      lng: device.lng,
                                    });
                                    map.setZoom(13);
                                  }
                                }}
                                onMouseEnter={() =>
                                  setSelectedDevice(device.id)
                                }
                                onMouseLeave={() => setSelectedDevice(null)}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </div>

                              {selectedDevice === device.id && (
                                <div className="mt-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border dark:border-gray-600 min-w-[200px] sm:min-w-[240px]">
                                  <h4 className="font-semibold text-sm dark:text-white">
                                    {device.name}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {device.location}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-base sm:text-lg font-bold dark:text-white">
                                      {device.value}
                                    </span>
                                    <Badge
                                      variant={
                                        device.status === "online"
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {device.status}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          </OverlayView>
                        );
                      })}
                    </GoogleMap>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border dark:border-gray-600 z-20">
                      <h4 className="font-semibold text-sm mb-2 dark:text-white">
                        Legend
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="dark:text-gray-300">Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          <span className="dark:text-gray-300">Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          <span className="dark:text-gray-300">Offline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </LoadScript>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Device List + Stats */}
        <div className="space-y-4">
          {/* Device List Card */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg dark:text-white">
                Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6 max-h-[calc(7*64px)] overflow-y-auto">
              {filteredDevices.map((device, index) => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md dark:border-gray-600 ${
                      selectedDevice === device.id
                        ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:ring-blue-400"
                        : "bg-white dark:bg-gray-700"
                    }`}
                    //zoom on the map
                    onClick={() => {
                      setSelectedDevice(device.id); // highlight
                      if (map) {
                        map.panTo({ lat: device.lat, lng: device.lng });
                        map.setZoom(10); // adjust zoom level
                      }
                    }}

                    // onClick={() => setSelectedDevice(device.id)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          device.type === "temperature"
                            ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                            : device.type === "humidity"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                            : device.type === "soil"
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
                        }`}
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {device.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {device.location}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {device.value}
                          </span>
                          <Badge
                            variant={
                              device.status === "online"
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {device.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg dark:text-white">
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Devices:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {deviceLocations.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Online:
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {deviceLocations.filter((d) => d.status === "online").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Warning:
                </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {deviceLocations.filter((d) => d.status === "warning").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Offline:
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {deviceLocations.filter((d) => d.status === "offline").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
         
    </div>
  );
}
