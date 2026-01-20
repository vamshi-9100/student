"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bell,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  Zap,
  Eye,
  Play,
  Pause,
} from "lucide-react"

const rulesData = [
  {
    id: "rule_001",
    name: "High Temperature Alert",
    description: "Trigger alert when temperature exceeds 35°C",
    condition: "Temperature > 35°C",
    action: "Send Email + SMS",
    status: "active",
    priority: "high",
    lastTriggered: "2 hours ago",
    triggerCount: 15,
    devices: ["temp_sensor_01", "temp_sensor_03"],
  },
  {
    id: "rule_002",
    name: "Low Humidity Warning",
    description: "Alert when humidity drops below 30%",
    condition: "Humidity < 30%",
    action: "Dashboard Notification",
    status: "active",
    priority: "medium",
    lastTriggered: "1 day ago",
    triggerCount: 8,
    devices: ["humidity_sensor_02"],
  },
  {
    id: "rule_003",
    name: "Device Offline Detection",
    description: "Notify when device hasn't reported for 10 minutes",
    condition: "Last Seen > 10 minutes",
    action: "Email Alert",
    status: "inactive",
    priority: "high",
    lastTriggered: "Never",
    triggerCount: 0,
    devices: ["All Devices"],
  },
  {
    id: "rule_004",
    name: "Soil Moisture Low",
    description: "Water irrigation trigger for garden sensors",
    condition: "Soil Moisture < 200 centibars",
    action: "Activate Irrigation + Notification",
    status: "active",
    priority: "medium",
    lastTriggered: "6 hours ago",
    triggerCount: 23,
    devices: ["soil_sensor_01", "soil_sensor_02"],
  },
  {
    id: "rule_005",
    name: "Tank Level Critical",
    description: "Critical alert for low tank levels",
    condition: "Ultrasonic Distance < 10 cm",
    action: "Emergency Alert + SMS",
    status: "active",
    priority: "critical",
    lastTriggered: "Never",
    triggerCount: 0,
    devices: ["ultrasonic_tank_a", "ultrasonic_tank_b"],
  },
]

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

const actionIcons = {
  email: Mail,
  sms: MessageSquare,
  notification: Bell,
  automation: Zap,
}

export default function RulesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredRules = rulesData.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || rule.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const toggleRuleStatus = (ruleId: string) => {
    // In a real app, this would update the rule status
    console.log(`Toggling rule ${ruleId}`)
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
          <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
          <p className="text-gray-600">Create and manage automated responses to sensor data</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rules", value: rulesData.length, color: "text-blue-600" },
          { label: "Active", value: rulesData.filter((r) => r.status === "active").length, color: "text-green-600" },
          { label: "Inactive", value: rulesData.filter((r) => r.status === "inactive").length, color: "text-gray-600" },
          {
            label: "Triggered Today",
            value: rulesData.reduce((sum, r) => sum + (r.lastTriggered.includes("hour") ? 1 : 0), 0),
            color: "text-orange-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className={`text-sm ${stat.color}`}>{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Status: {filterStatus === "all" ? "All" : filterStatus}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Rules</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("active")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>Inactive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule, index) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                      <Badge className={priorityColors[rule.priority as keyof typeof priorityColors]}>
                        {rule.priority}
                      </Badge>
                      <Badge variant={rule.status === "active" ? "default" : "secondary"}>{rule.status}</Badge>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-3">{rule.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Condition:</span>
                        <div className="text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded mt-1">
                          {rule.condition}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Action:</span>
                        <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded mt-1">
                          {rule.action}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Last Triggered:</span> {rule.lastTriggered}
                      </div>
                      <div>
                        <span className="font-medium">Trigger Count:</span> {rule.triggerCount}
                      </div>
                      <div>
                        <span className="font-medium">Devices:</span> {rule.devices.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Switch checked={rule.status === "active"} onCheckedChange={() => toggleRuleStatus(rule.id)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {rule.status === "active" ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 dark:text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
