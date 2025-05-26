"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import ClientLayout from "../../client-layout"
import { UserRole } from "@/types/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfile } from "@/hooks/useProfile"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { ErrorMessage } from "@/components/ui/error-message"
import { useRouter } from "next/navigation"
import { TUser } from "@/types/api"
import { fetchFromApi } from "@/utils/api"
import {
  File,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Mail,
} from "lucide-react"

export default function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = React.use(params)
  const router = useRouter()
  const {
    profile: currentUserProfile,
    isLoading: currentUserLoading,
    isRecruiter,
    isCandidate,
  } = useProfile()
  const [profileData, setProfileData] = useState<TUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile data for the requested profileId
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchFromApi<{ data: TUser }>(
          `/profile/${profileId}`
        )
        setProfileData(response.data)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile")
        setIsLoading(false)
      }
    }
    if (!currentUserLoading) {
      fetchProfileData()
    }
  }, [profileId, currentUserLoading])

  // Access control logic
  useEffect(() => {
    if (!currentUserLoading && currentUserProfile) {
      if (isCandidate) {
        router.push("/profile")
      } else if (isRecruiter && profileId === currentUserProfile.id) {
        router.push("/dashboard")
      }
    }
  }, [
    currentUserLoading,
    currentUserProfile,
    isCandidate,
    isRecruiter,
    router,
    profileId,
  ])

  if (currentUserLoading || isLoading) {
    return (
      <ClientLayout>
        <div className="container py-6 max-w-4xl">
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
                <LoadingIndicator text="Loading profile..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  if (error) {
    return (
      <ClientLayout>
        <div className="container py-6 max-w-4xl">
          <ErrorMessage message={error} className="mb-6" />
        </div>
      </ClientLayout>
    )
  }

  if (!profileData) {
    return (
      <ClientLayout>
        <div className="container py-6 max-w-4xl">
          <ErrorMessage message="Profile not found." className="mb-6" />
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout requiredRoles={[UserRole.Recruiter]}>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Candidate Profile</h1>
        <div className="space-y-6">
          {/* Basic Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Candidate details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <h3 className="font-semibold text-lg">{profileData.name}</h3>
                {profileData.email && (
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{profileData.email}</span>
                  </div>
                )}
              </div>
              {/* Social Links */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium">Social Profiles</h4>
                <div className="flex flex-wrap gap-3">
                  {profileData.github && (
                    <a
                      href={profileData.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {profileData.linkedin && (
                    <a
                      href={profileData.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profileData.twitter && (
                    <a
                      href={profileData.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </a>
                  )}
                  {!profileData.github &&
                    !profileData.linkedin &&
                    !profileData.twitter && (
                      <span className="text-sm text-muted-foreground">
                        No social profiles provided
                      </span>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Resume Section */}
          {profileData.resume_url && (
            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
                <CardDescription>
                  Candidate&apos;s uploaded resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-md bg-background">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-md">
                      <File className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">Resume</h3>
                      <div className="mt-2">
                        <a
                          href={profileData.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Resume
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
