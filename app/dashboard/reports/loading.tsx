import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="md" />
          <span className="text-sm sm:text-base">Loading reports...</span>
        </div>
      </div>
    </div>
  )
}
