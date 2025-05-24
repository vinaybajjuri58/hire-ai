"use client"

import { RoleGuard } from "@/components/RoleGuard"
import { UserRole } from "@/types/api"

type TClientLayoutProps = {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackPath?: string
}

/**
 * Client-side layout wrapper that handles role-based access control
 * If no requiredRoles are provided, all authenticated users can access
 */
export default function ClientLayout({
  children,
  requiredRoles = [UserRole.Candidate, UserRole.Recruiter],
  fallbackPath = "/dashboard",
}: TClientLayoutProps) {
  return (
    <RoleGuard allowedRoles={requiredRoles} fallbackPath={fallbackPath}>
      {children}
    </RoleGuard>
  )
}
