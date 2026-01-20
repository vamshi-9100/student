"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandList, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { sensorService, type Sensor, type Reading } from "@/services/sensor-service"
import {
  CalendarIcon,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Check,
  ChevronsUpDown,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"

type ChartType = "line" | "bar" | "area"
type DateRange = "100d" | "200d" | "300d" | "custom"

interface ChartData {
  timestamp: string
  [key: string]: number | string
}

const CHART_COLORS = {
  temperature: "#ef4444",
  humidity: "#3b82f6",
  pressure: "#8b5cf6",
  battery: "#10b981",
  pm25: "#f59e0b",
  pm10: "#ec4899",
  co2: "#06b6d4",
  tvoc: "#84cc16",
  hcho: "#f97316",
  light: "#eab308",
  pir: "#a855f7",
  flowTemp: "#f43f5e",
  returnTemperature: "#14b8a6",
  diffTemperature: "#6366f1",
  energyConsumption: "#f59e0b",
  volume: "#8b5cf6",
  volumeFlowM3h: "#06b6d4",
  powerKw: "#f97316",
  buzzer: "#a855f7",
}

const MAX_PARAMETERS = 3

export default function ChartsPage() {
  const { t, language, isRTL } = useLanguage()
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [selectedSensorId, setSelectedSensorId] = useState<string>("")
  const [allReadings, setAllReadings] = useState<Reading[]>([])
  const [filteredReadings, setFilteredReadings] = useState<Reading[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loadingSensors, setLoadingSensors] = useState(true)
  const [loadingReadings, setLoadingReadings] = useState(false)
  const [selectedParameters, setSelectedParameters] = useState<string[]>([])
  const [chartType, setChartType] = useState<ChartType>("line")
  const [dateRange, setDateRange] = useState<DateRange>("100d")
  const [customDateFrom, setCustomDateFrom] = useState<Date>()
  const [customDateTo, setCustomDateTo] = useState<Date>()
  const [availableParameters, setAvailableParameters] = useState<string[]>([])
  const [parameterDropdownOpen, setParameterDropdownOpen] = useState(false)

  // Get selected company and client from auth context
  const { selectedCompany, selectedClient } = useAuth()

  // Load sensors and all readings on mount
  useEffect(() => {
    loadData()
  }, [])

  // Refetch data when company or client selection changes
  useEffect(() => {
    loadData()
  }, [selectedCompany?.id, selectedClient?.id])

  // Filter readings when sensor or date range changes
  useEffect(() => {
    if (selectedSensorId && allReadings.length > 0) {
      filterReadings()
    } else if (!selectedSensorId) {
      // Reset when no sensor is selected
      setFilteredReadings([])
      setAvailableParameters([])
      setSelectedParameters([])
      setChartData([])
    }
  }, [selectedSensorId, dateRange, customDateFrom, customDateTo, allReadings])

  // Extract parameters and auto-select first 3 when filtered readings change
  useEffect(() => {
    if (filteredReadings.length > 0) {
      // Extract available parameters from readings
      const params = extractParameters(filteredReadings)
      console.log("Available parameters:", params)
      setAvailableParameters(params)

      // Auto-select first 3 parameters by default
      if (params.length > 0) {
        setSelectedParameters(params.slice(0, MAX_PARAMETERS))
      }
    } else {
      setAvailableParameters([])
      setChartData([])
      setSelectedParameters([])
    }
  }, [filteredReadings])

  // Reprocess chart data when selected parameters change
  useEffect(() => {
    if (filteredReadings.length > 0 && selectedParameters.length > 0) {
      processChartData(filteredReadings)
    } else if (selectedParameters.length === 0) {
      setChartData([])
    }
  }, [selectedParameters])

  const loadData = async () => {
    try {
      setLoadingSensors(true)
      setLoadingReadings(true)

      // Load sensors first
      const sensorsData = await sensorService.getSensors()
      setSensors(sensorsData)

      // Load all readings
      const readingsData = await sensorService.getSensorReadings()
      setAllReadings(readingsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoadingSensors(false)
      setLoadingReadings(false)
    }
  }

  const filterReadings = () => {
    if (!selectedSensorId) {
      setFilteredReadings([])
      return
    }

    // Find sensor info
    const sensorInfo = sensors.find((s) => s.sensorSerialNumber?.toString() === selectedSensorId?.toString())

    if (!sensorInfo) {
      setFilteredReadings([])
      return
    }

    // Filter readings by sensorId (same as readings page)
    let filtered = allReadings.filter((reading) => reading.sensorId === selectedSensorId)
    console.log("Filtered by sensor:", filtered.length)

    // Apply date range filter
    filtered = filterReadingsByDateRange(filtered)
    console.log("After date filter:", filtered.length)

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.incomingDate).getTime() - new Date(a.incomingDate).getTime())

    setFilteredReadings(filtered)
  }

  const filterReadingsByDateRange = (readings: Reading[]): Reading[] => {
    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case "100d":
        startDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)
        break
      case "200d":
        startDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000)
        break
      case "300d":
        startDate = new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000)
        break
      case "custom":
        if (customDateFrom && customDateTo) {
          return readings.filter((reading) => {
            const readingDate = new Date(reading.incomingDate)
            return readingDate >= customDateFrom && readingDate <= customDateTo
          })
        }
        return readings
      default:
        startDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000)
    }

    return readings.filter((reading) => {
      const readingDate = new Date(reading.incomingDate)
      return readingDate >= startDate
    })
  }

  const extractParameters = (readings: Reading[]): string[] => {
    const params = new Set<string>()
    const parameterKeys = [
      "temperature",
      "humidity",
      "pressure",
      "battery",
      "pm25",
      "pm10",
      "co2",
      "tvoc",
      "hcho",
      "light",
      "pir",
      "flowTemp",
      "returnTemperature",
      "diffTemperature",
      "energyConsumption",
      "volume",
      "volumeFlowM3h",
      "powerKw",
      "buzzer",
    ]

    // Check all readings to find which parameters have data
    readings.forEach((reading) => {
      parameterKeys.forEach((key) => {
        if (reading[key] !== null && reading[key] !== undefined) {
          params.add(key)
        }
      })
    })

    return Array.from(params)
  }

  const processChartData = (readingsData: Reading[]) => {
    if (selectedParameters.length === 0) {
      setChartData([])
      return
    }

    // Sort readings by date (oldest first for chart)
    const sortedReadings = [...readingsData].sort(
      (a, b) => new Date(a.incomingDate).getTime() - new Date(b.incomingDate).getTime(),
    )

    const processed: ChartData[] = sortedReadings.map((reading) => {
      const dataPoint: ChartData = {
        timestamp: format(new Date(reading.incomingDate), "MMM dd HH:mm"),
      }

      // Only include selected parameters
      selectedParameters.forEach((param) => {
        if (reading[param] !== null && reading[param] !== undefined) {
          dataPoint[param] = Number(reading[param])
        }
      })

      return dataPoint
    })

    setChartData(processed)
  }

  const calculateStats = (parameter: string) => {
    if (chartData.length === 0) return { avg: 0, min: 0, max: 0 }

    const values = chartData.map((d) => d[parameter]).filter((v) => typeof v === "number") as number[]

    if (values.length === 0) return { avg: 0, min: 0, max: 0 }

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg: avg.toFixed(2), min: min.toFixed(2), max: max.toFixed(2) }
  }

  const handleRefresh = async () => {
    setLoadingReadings(true)
    try {
      const readingsData = await sensorService.getSensorReadings()
      setAllReadings(readingsData)
    } catch (error) {
      console.error("Error refreshing readings:", error)
    } finally {
      setLoadingReadings(false)
    }
  }

  const handleParameterToggle = (parameter: string) => {
    setSelectedParameters((prev) => {
      if (prev.includes(parameter)) {
        // Always allow deselecting
        return prev.filter((p) => p !== parameter)
      } else {
        // Only allow selecting if less than MAX_PARAMETERS
        if (prev.length < MAX_PARAMETERS) {
          return [...prev, parameter]
        }
        return prev
      }
    })
  }

  const isParameterDisabled = (parameter: string) => {
    // Disable if max parameters reached and this parameter is not selected
    return selectedParameters.length >= MAX_PARAMETERS && !selectedParameters.includes(parameter)
  }

  const renderChart = () => {
    if (loadingReadings) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-600">{t("loadingReadings")}</p>
          </div>
        </div>
      )
    }

    if (!selectedSensorId) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t("selectSensorToView")}</p>
        </div>
      )
    }

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t("noReadingsFound")}</p>
        </div>
      )
    }

    if (selectedParameters.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t("selectParametersToView")}</p>
        </div>
      )
    }

    const ChartComponent = chartType === "line" ? LineChart : chartType === "bar" ? BarChart : AreaChart

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedParameters.map((param) => {
            const color = CHART_COLORS[param as keyof typeof CHART_COLORS] || "#000000"

            if (chartType === "line") {
              return (
                <Line
                  key={param}
                  type="monotone"
                  dataKey={param}
                  stroke={color}
                  strokeWidth={2}
                  name={t(param)}
                  dot={{ r: 3 }}
                />
              )
            } else if (chartType === "bar") {
              return <Bar key={param} dataKey={param} fill={color} name={t(param)} />
            } else {
              return (
                <Area
                  key={param}
                  type="monotone"
                  dataKey={param}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.6}
                  name={t(param)}
                />
              )
            }
          })}
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  return (
    <div className={cn("p-6 space-y-6", isRTL && "rtl")}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{t("analyticsCharts")}</h1>
        <p className="text-gray-600">{t("visualizeIoTData")}</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("filter")}
            </CardTitle>
            <CardDescription>{t("selectSensorToView")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sensor Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("selectSensor")}</label>
                <Select value={selectedSensorId} onValueChange={setSelectedSensorId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSensors ? t("loadingSensors") : t("selectSensor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sensors.map((sensor) => (
                      <SelectItem key={sensor.sensorSerialNumber} value={sensor.sensorSerialNumber}>
                        {sensor.sensorName} ({sensor.sensorSerialNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parameter Multi-Select Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("selectParameters")} (Max {MAX_PARAMETERS})
                </label>
                <Popover open={parameterDropdownOpen} onOpenChange={setParameterDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={parameterDropdownOpen}
                      className="w-full justify-between bg-transparent"
                      disabled={availableParameters.length === 0}
                    >
                      <span className="truncate">
                        {selectedParameters.length === 0
                          ? t("selectParameters")
                          : selectedParameters.length === 1
                            ? t(selectedParameters[0])
                            : `${selectedParameters.length} ${t("parametersSelected")}`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("searchParameters")} />
                      <CommandList>
                        <CommandEmpty>{t("noParametersFound")}</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {/* Warning message */}
                          {selectedParameters.length >= MAX_PARAMETERS && (
                            <div className="px-2 py-2 text-xs text-amber-600 bg-amber-50 border-b flex items-center gap-2">
                              <AlertCircle className="h-3 w-3" />
                              <span>Maximum {MAX_PARAMETERS} parameters can be selected</span>
                            </div>
                          )}
                          {/* Individual Parameters */}
                          {availableParameters.map((param) => {
                            const disabled = isParameterDisabled(param)
                            const isSelected = selectedParameters.includes(param)

                            return (
                              <CommandItem
                                key={param}
                                value={param}
                                onSelect={() => {
                                  handleParameterToggle(param)
                                }}
                                className={cn("cursor-pointer", disabled && "opacity-50")}
                              >
                                <div className="flex items-center space-x-2 w-full pointer-events-none">
                                  <div className="pointer-events-auto">
                                    <Checkbox checked={isSelected} disabled={disabled} />
                                  </div>
                                  <div className="flex items-center gap-2 flex-1">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0"
                                      style={{ backgroundColor: CHART_COLORS[param as keyof typeof CHART_COLORS] }}
                                    />
                                    <span className="truncate">{t(param)}</span>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("selectDateRange")}</label>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100d">{t("last100Days")}</SelectItem>
                    <SelectItem value="200d">{t("last200Days")}</SelectItem>
                    <SelectItem value="300d">{t("last300Days")}</SelectItem>
                    <SelectItem value="custom">{t("customRange")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("chartType")}</label>
                <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">{t("lineChart")}</SelectItem>
                    <SelectItem value="bar">{t("barChart")}</SelectItem>
                    <SelectItem value="area">{t("areaChart")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("from")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customDateFrom && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateFrom ? format(customDateFrom, "PPP") : t("from")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("to")}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customDateTo && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateTo ? format(customDateTo, "PPP") : t("to")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleRefresh} disabled={loadingReadings}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loadingReadings && "animate-spin")} />
                {t("refresh")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics Cards */}
      {selectedSensorId && chartData.length > 0 && selectedParameters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("totalReadings")}</p>
                  <p className="text-2xl font-bold">{chartData.length}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {selectedParameters.slice(0, 3).map((param, index) => {
            const stats = calculateStats(param)
            const icons = [TrendingUp, TrendingDown, TrendingUp]
            const colors = ["text-green-500", "text-orange-500", "text-red-500"]
            const Icon = icons[index % 3]
            const colorClass = colors[index % 3]

            return (
              <Card key={param}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t(param)}</p>
                      <p className="text-2xl font-bold">{stats.avg}</p>
                      <p className="text-xs text-gray-500">
                        Min: {stats.min} | Max: {stats.max}
                      </p>
                    </div>
                    <Icon className={cn("h-8 w-8", colorClass)} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      )}

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>{t("sensorReadings")}</CardTitle>
            <CardDescription>
              {selectedSensorId
                ? `${sensors.find((s) => s.sensorSerialNumber === selectedSensorId)?.sensorName || selectedSensorId} - ${selectedParameters.length}/${MAX_PARAMETERS} ${t("parametersSelected")}`
                : t("selectSensorToView")}
            </CardDescription>
          </CardHeader>
          <CardContent>{renderChart()}</CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
