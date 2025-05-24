"use client"

import { useUser } from "@/providers/UserProvider"
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
import Link from "next/link"

export default function SelectRolePage() {
  const { user, updateUser, isLoading } = useUser()
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
  if (user?.role_selected) {
    router.push("/dashboard")
    return null
  }

  // This is a placeholder - will be fully implemented in Phase 2
  const handleRoleSelection = async (role: UserRole) => {
    try {
      setIsUpdating(true)
      setError("")

      // Update the user's role and mark it as explicitly selected
      const updatedUser = await updateUser({
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
      <div className="p-4 w-full ">
        <Card className="w-full max-w-xl mx-auto shadow-lg border border-white/10 bg-background/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Select Your Role</CardTitle>
            <CardDescription>
              Choose how you want to use the AI Hiring Platform
              {user?.role === UserRole.Candidate && (
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
                user?.role === UserRole.Candidate ? "default" : "outline"
              }
              className={`
                w-full h-auto py-5 px-5 rounded-xl flex items-center gap-4 justify-start transition
                ${
                  user?.role === UserRole.Candidate
                    ? "bg-primary/80 text-white shadow-md"
                    : "bg-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                }
              `}
              onClick={() => handleRoleSelection(UserRole.Candidate)}
              disabled={isUpdating}
            >
              <UserCircle className="h-6 w-6 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div
                  className={`font-semibold text-lg ${user?.role === UserRole.Candidate ? "text-white" : "text-foreground"}`}
                >
                  I'm looking for jobs
                  {user?.role === UserRole.Candidate && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div
                  className={`text-sm mt-1 ${user?.role === UserRole.Candidate ? "text-blue-100" : "text-muted-foreground"}`}
                >
                  Create a profile, upload your resume, and get matched with
                  opportunities
                </div>
              </div>
            </Button>

            <Button
              variant={
                user?.role === UserRole.Recruiter ? "default" : "outline"
              }
              className={`
                w-full h-auto py-5 px-5 rounded-xl flex items-center gap-4 justify-start transition
                ${
                  user?.role === UserRole.Recruiter
                    ? "bg-primary/80 text-white shadow-md"
                    : "bg-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                }
              `}
              onClick={() => handleRoleSelection(UserRole.Recruiter)}
              disabled={isUpdating}
            >
              <Users className="h-6 w-6 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div
                  className={`font-semibold text-lg ${user?.role === UserRole.Recruiter ? "text-white" : "text-foreground"}`}
                >
                  I'm hiring candidates
                  {user?.role === UserRole.Recruiter && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div
                  className={`text-sm mt-1 ${user?.role === UserRole.Recruiter ? "text-blue-100" : "text-muted-foreground"}`}
                >
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
            <div className="pt-2 text-xs text-muted-foreground text-center">
              <Link
                href="/profile"
                className="underline hover:text-primary transition"
              >
                Go to your profile
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
