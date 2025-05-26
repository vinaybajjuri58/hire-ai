import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type TLoadingIndicatorProps = {
  text?: string
  className?: string
  iconClassName?: string
}

/**
 * A component for displaying loading states with consistent styling
 * Uses theme-aware colors as recommended in the Tailwind theme guide
 */
export function LoadingIndicator({
  text = "Loading...",
  className,
  iconClassName,
}: TLoadingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center text-muted-foreground",
        className
      )}
    >
      <Loader2 className={cn("h-5 w-5 mr-2 animate-spin", iconClassName)} />
      <span>{text}</span>
    </div>
  )
}
