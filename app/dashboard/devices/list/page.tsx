"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { deviceService, type Device } from "@/services/device-service"
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Settings,
  Trash2,
  Edit,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  Plus,
} from "lucide-react"
import Link from "next/link"

export default function DeviceListPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [backendStatus, setBackendStatus] = useState<"checking" | "available" | "unavailable">("checking")
  const { toast } = useToast()

  // Fetch devices on component mount
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true)
        setBackendStatus("checking")

        // Reset backend check to get fresh status
        deviceService.resetBackendCheck()

        const devicesData = await deviceService.getDevices()
        setDevices(devicesData)
        setBackendStatus("available")
      } catch (error) {
        console.error("Error fetching devices:", error)
        setBackendStatus("unavailable")
        toast({
          title: "Error Loading Devices",
          description: "Failed to load devices. Using mock data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [toast])

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.deviceId.toString().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || device.status === filterStatus
    const matchesType = filterType === "all" || device.deviceType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "inactive":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "maintenance":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
          >
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="destructive" className="text-xs">
            Inactive
          </Badge>
        )
      case "maintenance":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs"
          >
            Maintenance
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        )
    }
  }

  const formatLastCommunication = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return "Just now"
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    } catch {
      return "Unknown"
    }
  }

  const deviceTypeOptions = [...new Set(devices.map((device) => device.deviceType))]

  const deviceStats = {
    total: devices.length,
    active: devices.filter((d) => d.status === "active").length,
    inactive: devices.filter((d) => d.status === "inactive").length,
    maintenance: devices.filter((d) => d.status === "maintenance").length,
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm sm:text-base">Loading devices...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Device List</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              View and manage all registered devices
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
            <Link href="/dashboard/devices" className="order-1 sm:order-2">
              <Button className="flex items-center gap-2 w-full sm:w-auto text-sm">
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Device</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Devices</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{deviceStats.total}</div>
            <p className="text-xs text-muted-foreground">All registered devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{deviceStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Inactive</CardTitle>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{deviceStats.inactive}</div>
            <p className="text-xs text-muted-foreground">Not responding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Maintenance</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{deviceStats.maintenance}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs sm:text-sm">
                All Status
              </SelectItem>
              <SelectItem value="active" className="text-xs sm:text-sm">
                Active
              </SelectItem>
              <SelectItem value="inactive" className="text-xs sm:text-sm">
                Inactive
              </SelectItem>
              <SelectItem value="maintenance" className="text-xs sm:text-sm">
                Maintenance
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs sm:text-sm">
                All Types
              </SelectItem>
              {deviceTypeOptions.map((type) => (
                <SelectItem key={type} value={type} className="capitalize text-xs sm:text-sm">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Devices Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Devices ({filteredDevices.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {filteredDevices.length === devices.length
                ? "Showing all devices"
                : `Showing ${filteredDevices.length} of ${devices.length} devices`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDevices.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Devices Found
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || filterStatus !== "all" || filterType !== "all"
                    ? "No devices match your current filters."
                    : "No devices have been registered yet."}
                </p>
                <Link href="/dashboard/devices">
                  <Button className="text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Device
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                  {filteredDevices.map((device) => (
                    <Card key={device.deviceId} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(device.status)}
                            <h3 className="font-medium text-sm truncate">{device.deviceName}</h3>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div>ID: {device.deviceId}</div>
                            <div>
                              Type:{" "}
                              <Badge variant="outline" className="text-xs capitalize">
                                {device.deviceType}
                              </Badge>
                            </div>
                            <div>Manufacturer: {device.manufacturer}</div>
                            <div>Model: {device.model}</div>
                            <div>Status: {getStatusBadge(device.status)}</div>
                            <div>Last Communication: {formatLastCommunication(device.lastCommunication)}</div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Device
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Device</TableHead>
                      <TableHead className="text-xs sm:text-sm">Type</TableHead>
                      <TableHead className="text-xs sm:text-sm">Manufacturer</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Location</TableHead>
                      <TableHead className="text-xs sm:text-sm">Gateway</TableHead>
                      <TableHead className="text-xs sm:text-sm">Last Communication</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.map((device) => (
                      <TableRow key={device.deviceId}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{device.deviceName}</div>
                            <div className="text-xs text-gray-500">ID: {device.deviceId}</div>
                            <div className="text-xs text-gray-400">{device.model}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {device.deviceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{device.manufacturer}</div>
                            <div className="text-xs text-gray-500">v{device.firmwareVersion}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(device.status)}
                            {getStatusBadge(device.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">Location ID: {device.locationId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {device.gatewayId ? `Gateway ${device.gatewayId}` : "No Gateway"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{formatLastCommunication(device.lastCommunication)}</div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Device
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
