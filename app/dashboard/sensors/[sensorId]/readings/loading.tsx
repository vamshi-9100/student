import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm sm:text-base">Loading sensor readings...</span>
        </div>
      </div>
    </div>
  )
}
