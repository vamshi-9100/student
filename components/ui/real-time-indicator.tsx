"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

interface RealTimeIndicatorProps {
  isConnected?: boolean
  lastUpdate?: string
}

export function RealTimeIndicator({ isConnected = true, lastUpdate }: RealTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
        {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isConnected ? "Live" : "Offline"}
      </Badge>
      {lastUpdate && <span className="text-xs text-gray-500 dark:text-gray-400">Last update: {lastUpdate}</span>}
    </div>
  )
}
