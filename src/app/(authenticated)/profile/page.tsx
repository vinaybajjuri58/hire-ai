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
import { ProfileForm } from "@/components/ProfileForm"
import { ResumeUpload } from "@/components/ResumeUpload"

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
            <ProfileForm />
            <ResumeUpload />
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
