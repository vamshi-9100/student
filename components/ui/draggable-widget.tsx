"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Maximize2, Minimize2, Settings, X } from "lucide-react"

interface DraggableWidgetProps {
  title: string
  children: React.ReactNode
  onRemove?: () => void
  onSettings?: () => void
  className?: string
  defaultExpanded?: boolean
}

export function DraggableWidget({
  title,
  children,
  onRemove,
  onSettings,
  className = "",
  defaultExpanded = true,
}: DraggableWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      className={`cursor-move ${className}`}
    >
      <Card className={`transition-all duration-200 ${isDragging ? "shadow-2xl" : "shadow-md"} hover:shadow-lg`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-6 w-6">
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
            {onSettings && (
              <Button variant="ghost" size="icon" onClick={onSettings} className="h-6 w-6">
                <Settings className="w-3 h-3" />
              </Button>
            )}
            {onRemove && (
              <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6 text-red-500">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        {isExpanded && <CardContent className="pt-0">{children}</CardContent>}
      </Card>
    </motion.div>
  )
}
