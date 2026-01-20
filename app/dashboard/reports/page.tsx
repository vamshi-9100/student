"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, Calendar, Filter, Search, Eye, Share, MoreVertical } from "lucide-react"

const reportsData = [
  {
    id: "RPT_001",
    name: "Daily Sensor Summary",
    type: "Automated",
    status: "Generated",
    lastGenerated: "2024-01-15 08:00",
    size: "2.4 MB",
    format: "PDF",
    description: "Daily summary of all sensor readings and alerts",
  },
  {
    id: "RPT_002",
    name: "Weekly Performance Report",
    type: "Scheduled",
    status: "Generating",
    lastGenerated: "2024-01-14 23:59",
    size: "5.1 MB",
    format: "Excel",
    description: "Weekly performance metrics and device uptime analysis",
  },
  {
    id: "RPT_003",
    name: "Monthly Energy Consumption",
    type: "Manual",
    status: "Generated",
    lastGenerated: "2024-01-01 12:00",
    size: "1.8 MB",
    format: "PDF",
    description: "Monthly energy consumption analysis across all devices",
  },
  {
    id: "RPT_004",
    name: "Alert History Report",
    type: "On-Demand",
    status: "Failed",
    lastGenerated: "2024-01-14 15:30",
    size: "0 MB",
    format: "CSV",
    description: "Historical alert data and response times",
  },
  {
    id: "RPT_005",
    name: "Device Health Check",
    type: "Automated",
    status: "Generated",
    lastGenerated: "2024-01-15 06:00",
    size: "3.2 MB",
    format: "PDF",
    description: "Comprehensive device health and maintenance report",
  },
]

const quickReports = [
  { name: "Last 24 Hours", description: "Recent sensor data and alerts" },
  { name: "Device Status", description: "Current status of all devices" },
  { name: "Network Performance", description: "Gateway and connectivity metrics" },
  { name: "Alert Summary", description: "Recent alerts and notifications" },
]

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredReports = reportsData.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || report.status.toLowerCase() === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "generated":
        return "default"
      case "generating":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and manage your IoT data reports</p>
        </div>
        <Button className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Create Report
        </Button>
      </motion.div>

      {/* Quick Reports */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickReports.map((report, index) => (
                <motion.div
                  key={report.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-2">{report.name}</h3>
                      <p className="text-xs text-gray-600 mb-3">{report.description}</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="w-3 h-3 mr-2" />
                        Generate
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Status: {filterStatus === "all" ? "All" : filterStatus}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Reports</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("generated")}>Generated</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("generating")}>Generating</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("failed")}>Failed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Reports Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Generated</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-gray-600">{report.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{report.lastGenerated}</TableCell>
                    <TableCell>{report.size}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{report.format}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {report.status === "Generated" && (
                          <>
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </>
                        )}
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
                              <Share className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
