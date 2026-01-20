"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useSensorStore } from "@/stores/sensor-store"
import { sensorService, type SensorReading, type SensorInfo } from "@/services/sensor-service"
import { useLanguage } from "@/contexts/language-context"
import { generateFormattedExcel, downloadExcel, formatTimestamp, type ExportData } from "@/lib/excel-export"
import { getTextSize } from "@/lib/text-sizes"
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Battery,
  Gauge,
  Lightbulb,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

export default function SensorReadingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const sensorId = params.sensorId as string

  const [sensor, setSensor] = useState<SensorInfo | null>(null)
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [filteredReadings, setFilteredReadings] = useState<SensorReading[]>([])
  const [visibleCount, setVisibleCount] = useState(100)
  const [loading, setLoading] = useState(true)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  // Export-specific controls (initialized from current UI filters when modal opens)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")
  const [exportSortBy, setExportSortBy] = useState("date-desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")

  // Zustand store
  const { sensors, readings: allReadings, fetchAll } = useSensorStore()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // If we don't have data in store, fetch it
        if (sensors.length === 0 || allReadings.length === 0) {
          await fetchAll()
        }

        // Find the specific sensor by sensorSerialNumber (since that's what we use in the URL)
        const sensorInfo = sensors.find((s) => s.sensorSerialNumber?.toString() === sensorId?.toString())
        if (!sensorInfo) {
          toast({
            title: t("error"),
            description: "The requested sensor could not be found.",
            variant: "destructive",
          })
          router.push("/dashboard/sensors")
          return
        }

        setSensor(sensorInfo)

        // Filter readings for this sensor using sensorSerialNumber
        const sensorReadings = allReadings
          .filter((reading) => reading.sensorId === sensorId)
          .sort((a, b) => new Date(b.incomingDate).getTime() - new Date(a.incomingDate).getTime())
        setReadings(sensorReadings)
        setFilteredReadings(sensorReadings)
      } catch (error) {
        console.error("Error fetching sensor readings:", error)
        toast({
          title: t("error"),
          description: "Failed to load sensor readings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (sensorId) {
      fetchData()
    }
  }, [sensorId, router, toast, sensors, allReadings, fetchAll, t])

  useEffect(() => {
    let filtered = [...readings]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((reading) => {
        const idString = String(reading.rawdataId ?? reading.incomingCounter ?? "")
        return (
          idString.includes(searchTerm) ||
          reading.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reading.incomingDate.includes(searchTerm)
        )
      })
    }

    // Apply date filter
    const now = new Date()
    if (dateFilter !== "all") {
      const filterDate = new Date()
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      filtered = filtered.filter((reading) => new Date(reading.incomingDate) >= filterDate)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.incomingDate).getTime()
      const dateB = new Date(b.incomingDate).getTime()

      switch (sortBy) {
        case "date-asc":
          return dateA - dateB
        case "date-desc":
        default:
          return dateB - dateA
      }
    })

    setFilteredReadings(filtered)
    setVisibleCount(100)
  }, [readings, searchTerm, dateFilter, sortBy])

  const paginatedReadings = filteredReadings.slice(0, visibleCount)

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Use US locale with 12-hour clock to match: 12/2/2025, 6:14:00 PM
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      })
    } catch {
      return "Invalid Date"
    }
  }

  const getReadingValue = (reading: SensorReading, field: keyof SensorReading) => {
    const value = reading[field]
    return value ? String(value) : "-"
  }

  const exportReadings = () => {
    try {
      if (!sensor) return

      // Start from all readings for this sensor
      let exportSource = [...readings]

      // Apply start date filter (inclusive)
      if (exportStartDate) {
        const start = new Date(`${exportStartDate}T00:00:00`)
        exportSource = exportSource.filter(
          (reading) => new Date(reading.incomingDate) >= start,
        )
      }

      // Apply end date filter (inclusive to end of day)
      if (exportEndDate) {
        const end = new Date(`${exportEndDate}T23:59:59`)
        exportSource = exportSource.filter(
          (reading) => new Date(reading.incomingDate) <= end,
        )
      }

      // Apply sort for export (newest or oldest first)
      exportSource.sort((a, b) => {
        const dateA = new Date(a.incomingDate).getTime()
        const dateB = new Date(b.incomingDate).getTime()

        switch (exportSortBy) {
          case "date-asc":
            return dateA - dateB
          case "date-desc":
          default:
            return dateB - dateA
        }
      })

      // Convert readings to export format (matching UI table exactly, with units)
      const exportData: ExportData[] = exportSource.map((reading) => ({
        id: reading.rawdataId ?? reading.incomingCounter ?? "",
        dateTime: formatDate(reading.incomingDate),
        temperature: reading.temperature != null ? `${reading.temperature}°C` : "-",
        humidity: reading.humidity != null ? `${reading.humidity}%` : "-",
        battery: reading.battery != null ? `${reading.battery}%` : "-",
        pm25: reading.pm25 != null ? `${reading.pm25} µg/m³` : "-",
        pm10: reading.pm10 != null ? `${reading.pm10} µg/m³` : "-",
        pressure: reading.pressure != null ? `${reading.pressure} hPa` : "-",
        co2: reading.co2 != null ? `${reading.co2} ppm` : "-",
        tvoc: reading.tvoc != null ? `${reading.tvoc} mg/m³` : "-",
        hcho: reading.hcho != null ? `${reading.hcho} mg/m³` : "-",
        pir: reading.pir ?? "-",
        light: reading.light != null ? `${reading.light} lux` : "-",
        leakage: reading.leakage != null ? String(reading.leakage) : "-",
      }))

      // Generate formatted Excel workbook
      const timestamp = new Date()
      const wb = generateFormattedExcel(exportData, {
        companyName: t("companyName"),
        title: t("latestReadings"),
        timestamp: timestamp.toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        }),
        language: language,
        totalCount: exportData.length,
      })

      // Generate filename: deviceName_SerialNumber_Timestamp.xlsx
      const formattedTimestamp = formatTimestamp(timestamp)
      const filename = `${sensor.sensorName}_${sensor.sensorSerialNumber}_${formattedTimestamp}.xlsx`

      // Download the file
      downloadExcel(wb, filename)

      toast({
        title: t("exportSuccess"),
        description: t("exportSuccessDescription"),
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: t("exportFailed"),
        description: t("exportFailedDescription"),
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await fetchAll()
      toast({
        title: t("success"),
        description: "Sensor readings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: t("error"),
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className={getTextSize("body")}>{t("loading")}...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!sensor) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Card className="p-6 sm:p-8 text-center max-w-md mx-auto">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
              <div>
                <h3 className={`${getTextSize("h3")} font-semibold text-gray-900 dark:text-white`}>
                  {t("noSensorsFound")}
                </h3>
                <p className={`${getTextSize("body")} text-gray-600 dark:text-gray-400 mt-2`}>
                  The requested sensor could not be found.
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard/sensors")} className={getTextSize("button")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("back")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard/sensors")}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className={`${getTextSize("h1")} font-bold text-gray-900 dark:text-white`}>
                {sensor.sensorName} {t("latestReadings")}
              </h1>
              <p className={`${getTextSize("body")} text-gray-600 dark:text-gray-400`}>
                {t("sensorId")}: {sensor.sensorId} • {filteredReadings.length} {t("readingsCount")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${getTextSize("button")}`}
            >
              <RefreshCw className="w-4 h-4" />
              {t("refresh")}
            </Button>
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <Button
                type="button"
                onClick={() => {
                  // Initialize export controls (clear dates, use current sort)
                  setExportStartDate("")
                  setExportEndDate("")
                  setExportSortBy(sortBy)
                  setExportDialogOpen(true)
                }}
                className={`flex items-center gap-2 ${getTextSize("button")}`}
              >
                <Download className="w-4 h-4" />
                {t("exportExcel")}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("exportExcel")}</DialogTitle>
                  <DialogDescription>
                    Choose the date range, and sort order to use for the exported data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Date range selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={getTextSize("bodySmall")}>Start date</label>
                      <Input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className={getTextSize("input")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={getTextSize("bodySmall")}>End date</label>
                      <Input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className={getTextSize("input")}
                      />
                    </div>
                  </div>

                  {/* Sort options (same as UI) */}
                  <div className="space-y-1">
                    <label className={getTextSize("bodySmall")}>Sort</label>
                    <Select value={exportSortBy} onValueChange={setExportSortBy}>
                      <SelectTrigger className={getTextSize("button")}>
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc" className={getTextSize("button")}>
                          Newest First
                        </SelectItem>
                        <SelectItem value="date-asc" className={getTextSize("button")}>
                          Oldest First
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className={getTextSize("button")}
                    onClick={() => setExportDialogOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    className={getTextSize("button")}
                    onClick={() => {
                      setExportDialogOpen(false)
                      exportReadings()
                    }}
                  >
                    {t("export")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={`${t("search")}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${getTextSize("input")}`}
            />
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className={`w-full sm:w-[140px] ${getTextSize("button")}`}>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t("filter")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className={getTextSize("button")}>
                  All Time
                </SelectItem>
                <SelectItem value="today" className={getTextSize("button")}>
                  Today
                </SelectItem>
                <SelectItem value="week" className={getTextSize("button")}>
                  Last Week
                </SelectItem>
                <SelectItem value="month" className={getTextSize("button")}>
                  Last Month
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={`w-full sm:w-[140px] ${getTextSize("button")}`}>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc" className={getTextSize("button")}>
                  Newest First
                </SelectItem>
                <SelectItem value="date-asc" className={getTextSize("button")}>
                  Oldest First
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Total Readings",
            value: readings.length,
            color: "text-blue-600",
            icon: Activity,
          },
          {
            label: "Filtered",
            value: filteredReadings.length,
            color: "text-green-600",
            icon: Filter,
          },
          {
            label: "Latest Reading",
            value: readings.length > 0 ? sensorService.formatTimeAgo(readings[0]?.incomingDate) : "Never",
            color: "text-purple-600",
            icon: Clock,
          },
          {
            label: "Date Range",
            value:
              readings.length > 0
                ? `${Math.ceil(
                    (new Date().getTime() - new Date(readings[readings.length - 1]?.incomingDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )}d`
                : "0d",
            color: "text-orange-600",
            icon: Calendar,
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
                    <div className={`${getTextSize("h3")} font-bold`}>{stat.value}</div>
                    <div className={`${getTextSize("cardText")} ${stat.color}`}>{stat.label}</div>
                  </div>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Readings Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className={getTextSize("h3")}>{t("latestReadings")}</CardTitle>
            <CardDescription className={getTextSize("bodySmall")}>
              {paginatedReadings.length === readings.length
                ? "Showing all readings"
                : `Showing ${paginatedReadings.length} of ${readings.length} readings`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReadings.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className={`${getTextSize("h3")} font-semibold text-gray-900 dark:text-white mb-2`}>
                  {t("noReadingsFound")}
                </h3>
                <p className={`${getTextSize("body")} text-gray-600 dark:text-gray-400`}>
                  {searchTerm || dateFilter !== "all"
                    ? "No readings match your current filters."
                    : "No readings have been recorded for this sensor yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                  {paginatedReadings.map((reading) => (
                    <Card
                      key={reading.rawdataId ?? reading.incomingCounter ?? reading.incomingDate}
                      className="p-3 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getTextSize("badge")}>
                            ID: {reading.rawdataId ?? reading.incomingCounter ?? "-"}
                          </Badge>
                          <span className={`${getTextSize("caption")} text-gray-500 dark:text-gray-400`}>
                            {sensorService.formatTimeAgo(reading.incomingDate)}
                          </span>
                        </div>
                        <div className={`${getTextSize("caption")} text-gray-600 dark:text-gray-400`}>
                          {formatDate(reading.incomingDate)}
                        </div>
                        <div className={`grid grid-cols-2 gap-2 ${getTextSize("caption")}`}>
                          {reading.temperature && (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-red-500" />
                              <span>{reading.temperature}°C</span>
                            </div>
                          )}
                          {reading.humidity && (
                            <div className="flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-blue-500" />
                              <span>{reading.humidity}%</span>
                            </div>
                          )}
                          {reading.battery && (
                            <div className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-green-500" />
                              <span>{reading.battery}%</span>
                            </div>
                          )}
                          {reading.pm25 && (
                            <div className="flex items-center gap-1">
                              <Wind className="w-3 h-3 text-purple-500" />
                              <span>PM2.5: {reading.pm25}</span>
                            </div>
                          )}
                          {reading.pressure && (
                            <div className="flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-orange-500" />
                              <span>{reading.pressure} hPa</span>
                            </div>
                          )}
                          {reading.light && (
                            <div className="flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-yellow-500" />
                              <span>{reading.light} lux</span>
                            </div>
                          )}
                          {reading.leakage && (
                            <div className="flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-cyan-500" />
                              <span>Leakage: {reading.leakage}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <Table className="hidden sm:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={getTextSize("tableHeader")}>ID</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Date & Time</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Temperature</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Humidity</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Battery</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>PM2.5</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>PM10</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Pressure</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>CO2</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>TVOC</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>HCHO</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>PIR</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Light</TableHead>
                      <TableHead className={getTextSize("tableHeader")}>Leakage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReadings.map((reading) => (
                      <TableRow
                        key={reading.rawdataId ?? reading.incomingCounter ?? reading.incomingDate}
                      >
                        <TableCell>
                          <Badge variant="outline" className={getTextSize("badge")}>
                            {reading.rawdataId ?? reading.incomingCounter ?? "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className={`${getTextSize("tableCell")} font-medium`}>
                              {formatDate(reading.incomingDate)}
                            </div>
                            <div className={`${getTextSize("caption")} text-gray-500`}>
                              {sensorService.formatTimeAgo(reading.incomingDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reading.temperature ? (
                            <div className="flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-red-500" />
                              <span className={getTextSize("tableCell")}>{reading.temperature}°C</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reading.humidity ? (
                            <div className="flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-blue-500" />
                              <span className={getTextSize("tableCell")}>{reading.humidity}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reading.battery ? (
                            <div className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-green-500" />
                              <span className={getTextSize("tableCell")}>{reading.battery}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "pm25")}</span>
                          {reading.pm25 && (
                            <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>µg/m³</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "pm10")}</span>
                          {reading.pm10 && (
                            <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>µg/m³</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "pressure")}</span>
                          {reading.pressure && (
                            <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>hPa</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "co2")}</span>
                          {reading.co2 && <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>ppm</span>}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "tvoc")}</span>
                          {reading.tvoc && (
                            <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>mg/m³</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "hcho")}</span>
                          {reading.hcho && (
                            <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>mg/m³</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reading.pir ? (
                            <Badge
                              variant={reading.pir === "Occupied" ? "default" : "secondary"}
                              className={getTextSize("badge")}
                            >
                              {reading.pir}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "light")}</span>
                          {reading.light && <span className={`${getTextSize("caption")} text-gray-500 ml-1`}>lux</span>}
                        </TableCell>
                        <TableCell>
                          <span className={getTextSize("tableCell")}>{getReadingValue(reading, "leakage")}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredReadings.length > paginatedReadings.length && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className={getTextSize("button")}
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + 100, filteredReadings.length),
                    )
                  }
                >
                  Load more ({filteredReadings.length - paginatedReadings.length} remaining)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
