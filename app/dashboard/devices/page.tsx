"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { deviceService, type CreateDeviceRequest, type Device } from "@/services/device-service"
import {
  Thermometer,
  Droplets,
  Waves,
  Ruler,
  Wind,
  Zap,
  Camera,
  Gauge,
  Plus,
  MapPin,
  Save,
  X,
  Search,
  Filter,
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react"

// Device types with their configurations
const deviceTypes = [
  {
    id: "temperature",
    name: "Temperature Sensor",
    icon: Thermometer,
    color: "bg-red-500",
    description: "Monitor ambient and surface temperatures with high precision",
    units: ["°C", "°F", "K"],
    defaultRange: { min: -40, max: 85 },
    count: 45,
    category: "sensor",
  },
  {
    id: "humidity",
    name: "Humidity Sensor",
    icon: Droplets,
    color: "bg-blue-500",
    description: "Measure relative humidity levels and moisture content",
    units: ["%", "g/m³", "ppm"],
    defaultRange: { min: 0, max: 100 },
    count: 32,
    category: "sensor",
  },
  {
    id: "soil",
    name: "Soil Moisture",
    icon: Waves,
    color: "bg-green-500",
    description: "Monitor soil moisture and conductivity for agriculture",
    units: ["centibars", "%", "kPa"],
    defaultRange: { min: 0, max: 200 },
    count: 28,
    category: "sensor",
  },
  {
    id: "ultrasonic",
    name: "Ultrasonic Distance",
    icon: Ruler,
    color: "bg-purple-500",
    description: "Measure distance and level detection with ultrasonic waves",
    units: ["cm", "m", "ft", "in"],
    defaultRange: { min: 2, max: 400 },
    count: 15,
    category: "sensor",
  },
  {
    id: "air_quality",
    name: "Air Quality",
    icon: Wind,
    color: "bg-orange-500",
    description: "Monitor air quality and pollutant levels",
    units: ["µg/m³", "ppm", "AQI"],
    defaultRange: { min: 0, max: 500 },
    count: 12,
    category: "monitor",
  },
  {
    id: "pressure",
    name: "Pressure Sensor",
    icon: Gauge,
    color: "bg-indigo-500",
    description: "Measure atmospheric and fluid pressure accurately",
    units: ["Pa", "kPa", "bar", "psi"],
    defaultRange: { min: 0, max: 1000 },
    count: 8,
    category: "sensor",
  },
  {
    id: "power",
    name: "Power Monitor",
    icon: Zap,
    color: "bg-yellow-500",
    description: "Monitor electrical consumption and power quality",
    units: ["W", "kW", "V", "A"],
    defaultRange: { min: 0, max: 10000 },
    count: 18,
    category: "monitor",
  },
  {
    id: "camera",
    name: "Camera Sensor",
    icon: Camera,
    color: "bg-pink-500",
    description: "Visual monitoring and image capture capabilities",
    units: ["MP", "fps", "lux"],
    defaultRange: { min: 0, max: 100 },
    count: 6,
    category: "camera",
  },
]

// Mock gateways for selection
const availableGateways = [
  { id: 1, name: "Ethernet Gateway 4", location: "Building A" },
  { id: 2, name: "Wireless Adapter", location: "Building B" },
  { id: 3, name: "LoRaWAN Gateway", location: "Building C" },
]

// Mock locations for selection
const availableLocations = [
  { id: 1, name: "Building A - Floor 1" },
  { id: 2, name: "Building A - Floor 2" },
  { id: 3, name: "Building B - Rooftop" },
  { id: 4, name: "Building C - Basement" },
  { id: 5, name: "Outdoor Zone 1" },
]

interface DeviceFormData {
  deviceId?: string
  deviceName: string
  deviceType: string
  manufacturer: string
  model: string
  firmwareVersion: string
  installationDate: string
  status: string
  locationId: string
  gatewayId: string
  lastCommunication: string
}

const initialFormData: DeviceFormData = {
  deviceName: "",
  deviceType: "",
  manufacturer: "",
  model: "",
  firmwareVersion: "1.0.0",
  installationDate: new Date().toISOString().split("T")[0],
  status: "active",
  locationId: "",
  gatewayId: "",
  lastCommunication: new Date().toISOString(),
}

export default function DevicesPage() {
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<DeviceFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [backendStatus, setBackendStatus] = useState<"checking" | "available" | "unavailable">("checking")
  const [existingDevices, setExistingDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch existing devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true)
        setBackendStatus("checking")

        // Reset backend check to get fresh status
        deviceService.resetBackendCheck()

        const devicesData = await deviceService.getDevices()
        setExistingDevices(devicesData)
        setBackendStatus("available")
      } catch (error) {
        console.error("Error fetching devices:", error)
        setBackendStatus("unavailable")
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [])

  const filteredDeviceTypes = deviceTypes.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCategory === "all" || device.category === filterCategory
    return matchesSearch && matchesFilter
  })

  const handleDeviceTypeSelect = (deviceType: any) => {
    setSelectedDeviceType(deviceType.id)
    setFormData({
      ...initialFormData,
      deviceType: deviceType.id,
      deviceName: `${deviceType.name} ${Math.floor(Math.random() * 100)}`,
      manufacturer: "IoT Corp",
      model: `${deviceType.id.toUpperCase()}-2024`,
    })
    setShowForm(true)
  }

  const handleInputChange = (field: keyof DeviceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateDeviceId = () => {
    return Math.floor(Math.random() * 10000) + 1000
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.deviceName || !formData.deviceType || !formData.manufacturer || !formData.model) {
        throw new Error("Please fill in all required fields")
      }

      // Prepare API request data
      const deviceRequest: CreateDeviceRequest = {
        deviceId: formData.deviceId ? Number.parseInt(formData.deviceId) : generateDeviceId(),
        deviceName: formData.deviceName,
        deviceType: formData.deviceType,
        manufacturer: formData.manufacturer,
        model: formData.model,
        firmwareVersion: formData.firmwareVersion || "1.0.0",
        installationDate: formData.installationDate,
        status: formData.status || "active",
        locationId: Number.parseInt(formData.locationId) || 0,
        gatewayId: Number.parseInt(formData.gatewayId) || 0,
        lastCommunication: formData.lastCommunication || new Date().toISOString(),
      }

      // Call the device service
      const response = await deviceService.createDevice(deviceRequest)

      // Show success message
      toast({
        title: "Device Created Successfully",
        description: `Device "${response.deviceName}" (ID: ${response.deviceId}) has been created and configured.`,
        duration: 5000,
      })

      // Refresh devices list
      const updatedDevices = await deviceService.getDevices()
      setExistingDevices(updatedDevices)

      // Reset form
      setFormData(initialFormData)
      setShowForm(false)
      setSelectedDeviceType(null)
    } catch (error: any) {
      console.error("Error creating device:", error)

      // Show error message
      toast({
        title: "Error Creating Device",
        description: error.message || "Failed to create device. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location Retrieved",
            description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Location Error",
            description: "Unable to get current location. Please select from available locations.",
            variant: "destructive",
          })
        },
      )
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Device Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Add and configure your IoT devices and sensors
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Backend Status Indicator */}
            <div className="flex items-center justify-center sm:justify-start gap-2 order-2 sm:order-1">
              {backendStatus === "checking" && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-xs">Checking API...</span>
                </div>
              )}
              {backendStatus === "available" && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs">API Connected</span>
                </div>
              )}
              {backendStatus === "unavailable" && (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs">Mock Mode</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm order-1 sm:order-2 text-center">
              {loading
                ? "..."
                : `${existingDevices.length + deviceTypes.reduce((sum, device) => sum + device.count, 0)} Total Devices`}
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search device types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem
                value="all"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
              >
                All Categories
              </SelectItem>
              <SelectItem
                value="sensor"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
              >
                Sensors
              </SelectItem>
              <SelectItem
                value="monitor"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
              >
                Monitors
              </SelectItem>
              <SelectItem
                value="camera"
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
              >
                Cameras
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Device Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {filteredDeviceTypes.map((deviceType, index) => (
          <motion.div
            key={deviceType.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full"
          >
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700 h-full flex flex-col group hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
              onClick={() => handleDeviceTypeSelect(deviceType)}
            >
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${deviceType.color} text-white group-hover:scale-110 transition-transform`}
                  >
                    <deviceType.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {deviceType.count}
                  </Badge>
                </div>
                <CardTitle className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {deviceType.name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  {deviceType.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <div className="flex flex-wrap gap-1 mb-4">
                  {deviceType.units.slice(0, 3).map((unit) => (
                    <Badge
                      key={unit}
                      variant="outline"
                      className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
                    >
                      {unit}
                    </Badge>
                  ))}
                  {deviceType.units.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700"
                    >
                      +{deviceType.units.length - 3}
                    </Badge>
                  )}
                </div>
                <Button
                  className="w-full text-xs sm:text-sm mt-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  size="sm"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Device
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Device Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 dark:text-white text-base sm:text-lg">
              {selectedDeviceType && (
                <div
                  className={`p-2 rounded-lg ${deviceTypes.find((d) => d.id === selectedDeviceType)?.color} text-white`}
                >
                  {(() => {
                    const deviceType = deviceTypes.find((d) => d.id === selectedDeviceType)
                    const IconComponent = deviceType?.icon
                    return IconComponent ? <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" /> : null
                  })()}
                </div>
              )}
              Add New {deviceTypes.find((d) => d.id === selectedDeviceType)?.name || "Device"}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400 text-xs sm:text-sm">
              Configure your new device with the details below. All fields marked with * are required.
              {backendStatus === "unavailable" && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border dark:border-orange-800">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Running in mock mode - API not available
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[75vh] pr-2 sm:pr-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger
                    value="basic"
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  >
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  >
                    Location & Gateway
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  >
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-3 sm:space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deviceName" className="text-xs sm:text-sm">
                        Device Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="deviceName"
                        placeholder="e.g., Temperature Sensor 01"
                        value={formData.deviceName}
                        onChange={(e) => handleInputChange("deviceName", e.target.value)}
                        required
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deviceType" className="text-xs sm:text-sm">
                        Device Type <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="deviceType"
                        value={formData.deviceType}
                        onChange={(e) => handleInputChange("deviceType", e.target.value)}
                        required
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manufacturer" className="text-xs sm:text-sm">
                        Manufacturer <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="manufacturer"
                        placeholder="e.g., SensorTech, IoT Corp"
                        value={formData.manufacturer}
                        onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                        required
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-xs sm:text-sm">
                        Model <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="model"
                        placeholder="e.g., ST-TEMP-2024"
                        value={formData.model}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                        required
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firmwareVersion" className="text-xs sm:text-sm">
                        Firmware Version
                      </Label>
                      <Input
                        id="firmwareVersion"
                        placeholder="e.g., 1.2.3"
                        value={formData.firmwareVersion}
                        onChange={(e) => handleInputChange("firmwareVersion", e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-xs sm:text-sm">
                        Status
                      </Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectItem
                            value="active"
                            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-sm"
                          >
                            Active
                          </SelectItem>
                          <SelectItem
                            value="inactive"
                            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-sm"
                          >
                            Inactive
                          </SelectItem>
                          <SelectItem
                            value="maintenance"
                            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-sm"
                          >
                            Maintenance
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="installationDate" className="text-xs sm:text-sm">
                        Installation Date
                      </Label>
                      <Input
                        id="installationDate"
                        type="date"
                        value={formData.installationDate}
                        onChange={(e) => handleInputChange("installationDate", e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deviceId" className="text-xs sm:text-sm">
                        Device ID (Optional)
                      </Label>
                      <Input
                        id="deviceId"
                        placeholder="e.g., 1001"
                        value={formData.deviceId || ""}
                        onChange={(e) => handleInputChange("deviceId", e.target.value)}
                        type="number"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty to auto-generate</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-3 sm:space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="locationId" className="text-xs sm:text-sm">
                        Location
                      </Label>
                      <Select
                        value={formData.locationId}
                        onValueChange={(value) => handleInputChange("locationId", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          {availableLocations.map((location) => (
                            <SelectItem
                              key={location.id}
                              value={location.id.toString()}
                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-sm"
                            >
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gatewayId" className="text-xs sm:text-sm">
                        Gateway
                      </Label>
                      <Select
                        value={formData.gatewayId}
                        onValueChange={(value) => handleInputChange("gatewayId", value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm">
                          <SelectValue placeholder="Select gateway" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectItem
                            value="0"
                            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-sm"
                          >
                            No Gateway
                          </SelectItem>
                          {availableGateways.map((gateway) => (
                            <SelectItem
                              key={gateway.id}
                              value={gateway.id.toString()}
                              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-sm"
                            >
                              {gateway.name} - {gateway.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        className="text-xs sm:text-sm bg-transparent w-full sm:w-auto"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Current Location
                      </Button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">For GPS coordinates reference</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-3 sm:space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lastCommunication" className="text-xs sm:text-sm">
                        Last Communication
                      </Label>
                      <Input
                        id="lastCommunication"
                        type="datetime-local"
                        value={formData.lastCommunication.slice(0, 16)}
                        onChange={(e) => handleInputChange("lastCommunication", e.target.value + ":00.000Z")}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        When the device last communicated with the system
                      </p>
                    </div>

                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                        Device Summary
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="ml-2 text-gray-900 dark:text-white truncate">
                            {formData.deviceName || "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{formData.deviceType || "Not set"}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Manufacturer:</span>
                          <span className="ml-2 text-gray-900 dark:text-white truncate">
                            {formData.manufacturer || "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Model:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{formData.model || "Not set"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none text-xs sm:text-sm">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Device
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
