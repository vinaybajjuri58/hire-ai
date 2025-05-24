"use client"

import { useProfile } from "@/hooks/useProfile"
import { UserRole } from "@/types/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ErrorMessage } from "@/components/ui/error-message"
import { LoadingIndicator } from "@/components/ui/loading-indicator"

export default function SelectRolePage() {
  const { profile, updateProfile, isLoading } = useProfile()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingIndicator text="Loading your profile..." />
      </div>
    )
  }

  // If user has already explicitly selected a role, redirect to dashboard
  if (profile?.role_selected) {
    router.push("/dashboard")
    return null
  }

  // For users with candidate role, we can still let them see the selection page
  // This gives them a chance to switch to recruiter if they want

  // This is a placeholder - will be fully implemented in Phase 2
  const handleRoleSelection = async (role: UserRole) => {
    try {
      setIsUpdating(true)
      setError("")

      // Update the user's role and mark it as explicitly selected
      await updateProfile({
        role,
        role_selected: true,
      })

      // Redirect to appropriate dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update role. Please try again."
      )
      console.error("Error setting role:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-4 w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Select Your Role</CardTitle>
            <CardDescription>
              Choose how you want to use the AI Hiring Platform
              {profile?.role === UserRole.Candidate && (
                <span className="block mt-1 text-primary font-medium">
                  You currently have the candidate role
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && <ErrorMessage message={error} />}

            <Button
              variant={
                profile?.role === UserRole.Candidate ? "default" : "outline"
              }
              className="h-auto py-4 flex items-start gap-4 justify-start"
              onClick={() => handleRoleSelection(UserRole.Candidate)}
              disabled={isUpdating}
            >
              <UserCircle className="h-6 w-6" />
              <div className="text-left">
                <div className="font-medium">
                  I'm looking for jobs
                  {profile?.role === UserRole.Candidate && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Create a profile, upload your resume, and get matched with
                  opportunities
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex items-start gap-4 justify-start"
              onClick={() => handleRoleSelection(UserRole.Recruiter)}
              disabled={isUpdating}
            >
              <Users className="h-6 w-6" />
              <div className="text-left">
                <div className="font-medium">I'm hiring candidates</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Search for qualified candidates, review profiles, and contact
                  matches
                </div>
              </div>
            </Button>

            {isUpdating && (
              <div className="mt-2">
                <LoadingIndicator text="Updating your role..." />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
