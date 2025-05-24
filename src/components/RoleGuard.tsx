"use client"

import { useProfile } from "@/hooks/useProfile"
import { UserRole } from "@/types/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { Card, CardContent } from "@/components/ui/card"

type TRoleGuardProps = {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallbackPath?: string
}

/**
 * A component that restricts access to children based on user role
 * Shows a loading state while checking, and redirects if user's role is not allowed
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = "/dashboard",
}: TRoleGuardProps) {
  const { profile, isLoading, hasNoRole } = useProfile()
  const router = useRouter()

  useEffect(() => {
    // Only check after loading is complete
    if (!isLoading) {
      // If user has no role, they need to select one
      if (hasNoRole) {
        router.push("/select-role")
        return
      }

      // If user's role is not in allowed roles, redirect to fallback
      if (profile?.role && !allowedRoles.includes(profile.role)) {
        router.push(fallbackPath)
      }
    }
  }, [isLoading, profile, router, allowedRoles, fallbackPath, hasNoRole])

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex justify-center pt-4">
                <LoadingIndicator text="Checking access..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no user or role doesn't match, show nothing (redirect is happening)
  if (!profile || (profile.role && !allowedRoles.includes(profile.role))) {
    return null
  }

  // User has the correct role, show children
  return <>{children}</>
}
