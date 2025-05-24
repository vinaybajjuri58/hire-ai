"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import ClientLayout from "../client-layout"
import { UserRole } from "@/types/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfile } from "@/hooks/useProfile"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { ErrorMessage } from "@/components/ui/error-message"

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile()

  return (
    <ClientLayout requiredRoles={[UserRole.Candidate]}>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        {error && <ErrorMessage message={error.message} className="mb-6" />}

        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <div className="flex justify-center pt-4">
                  <LoadingIndicator text="Loading your profile..." />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic profile information - will be visible to recruiters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Profile form will be implemented in Phase 3
                </p>
                <p className="font-medium">Current values:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>
                    <span className="font-medium">Name:</span> {profile?.name}
                  </li>
                  <li>
                    <span className="font-medium">Email:</span> {profile?.email}
                  </li>
                  <li>
                    <span className="font-medium">GitHub:</span>{" "}
                    {profile?.github || "Not set"}
                  </li>
                  <li>
                    <span className="font-medium">LinkedIn:</span>{" "}
                    {profile?.linkedin || "Not set"}
                  </li>
                  <li>
                    <span className="font-medium">Twitter:</span>{" "}
                    {profile?.twitter || "Not set"}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Management</CardTitle>
                <CardDescription>
                  Upload your resume to help recruiters find you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Resume upload will be implemented in Phase 3
                </p>
                <p className="mt-2">
                  <span className="font-medium">Current resume:</span>{" "}
                  {profile?.resume_url ? (
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Resume
                    </a>
                  ) : (
                    "No resume uploaded"
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
