import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

type TErrorMessageProps = {
  message: string
  className?: string
}

/**
 * A component for displaying error messages with consistent styling
 * Uses theme-aware colors as recommended in the Tailwind theme guide
 */
export function ErrorMessage({ message, className }: TErrorMessageProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        "bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-start gap-2",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">{message}</div>
    </div>
  )
}
