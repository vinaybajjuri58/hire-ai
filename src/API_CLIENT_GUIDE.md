# Client-Side API Integration Guide

This guide provides examples of how to integrate with the hiring platform API from the client side. It covers common use cases for both candidate and recruiter roles.

## Authentication

All API requests require authentication. The Supabase client handles authentication tokens automatically through cookies, so you don't need to manually include auth headers.

## Using API Utility Functions

The project includes utility functions in `src/utils/api.ts` that simplify API calls using axios:

```typescript
import { fetchFromApi, postToApi, putToApi, deleteFromApi } from "@/utils/api"
```

These functions automatically handle error extraction and provide type safety.

## Profile Management

### Get Current User Profile

```typescript
import { fetchFromApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

async function getCurrentProfile() {
  try {
    const response = await fetchFromApi<TApiResponse<TUser>>("/profile")
    return response.data
  } catch (error) {
    console.error("Failed to get profile:", error)
    throw error
  }
}
```

### Update User Profile

```typescript
import { putToApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

async function updateProfile(profileData: {
  name?: string
  role?: "candidate" | "recruiter"
  github?: string
  linkedin?: string
  twitter?: string
}) {
  try {
    const response = await putToApi<TApiResponse<TUser>, typeof profileData>(
      "/profile",
      profileData
    )
    return response.data
  } catch (error) {
    console.error("Failed to update profile:", error)
    throw error
  }
}
```

### Update Social Links

```typescript
import { putToApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

async function updateSocialLinks(links: {
  github?: string
  linkedin?: string
  twitter?: string
}) {
  try {
    const response = await putToApi<TApiResponse<TUser>, typeof links>(
      "/profile/social",
      links
    )
    return response.data
  } catch (error) {
    console.error("Failed to update social links:", error)
    throw error
  }
}
```

## Recruiter-Specific Functions

### Get Candidate Profile

```typescript
import { fetchFromApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

async function getCandidateProfile(candidateId: string) {
  try {
    const response = await fetchFromApi<TApiResponse<TUser>>(
      `/profile/${candidateId}`
    )
    return response.data
  } catch (error) {
    console.error("Failed to get candidate profile:", error)
    throw error
  }
}
```

### Search Candidates (Basic Text Search)

```typescript
import { fetchFromApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

async function searchCandidates(query: string, limit: number = 10) {
  try {
    const params = new URLSearchParams({ query, limit: limit.toString() })
    const response = await fetchFromApi<TApiResponse<TUser[]>>(
      `/profile/search?${params}`
    )
    return response.data
  } catch (error) {
    console.error("Failed to search candidates:", error)
    throw error
  }
}
```

### Semantic Resume Search

```typescript
import { fetchFromApi } from "@/utils/api"
import { TApiResponse } from "@/types"

type TCandidateResult = {
  id: string
  name: string
  email: string
  github?: string
  linkedin?: string
  twitter?: string
  resume_url?: string
  similarity: number
}

async function searchResumes(query: string, limit: number = 10) {
  try {
    const params = new URLSearchParams({ query, limit: limit.toString() })
    const response = await fetchFromApi<TApiResponse<TCandidateResult[]>>(
      `/profile/resume/search?${params}`
    )
    return response.data
  } catch (error) {
    console.error("Failed to search resumes:", error)
    throw error
  }
}
```

## Candidate-Specific Functions

### Upload Resume

```typescript
import apiClient from "@/utils/apiClient"
import { TApiResponse } from "@/types"

async function uploadResume(file: File) {
  try {
    // Check file type
    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are accepted")
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5MB limit")
    }

    // Create form data
    const formData = new FormData()
    formData.append("resume", file)

    // For FormData, we need to use apiClient directly
    // and set the right content type header
    const response = await apiClient.post<
      TApiResponse<{
        resumeUrl: string
        qdrantPointId: string
      }>
    >("/profile/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data.data
  } catch (error) {
    console.error("Resume upload error:", error)
    throw error
  }
}
```

### Delete Resume

```typescript
import { deleteFromApi } from "@/utils/api"
import { TApiResponse } from "@/types"

async function deleteResume() {
  try {
    const response = await deleteFromApi<TApiResponse<null>>("/profile/resume")
    return true
  } catch (error) {
    console.error("Resume deletion error:", error)
    throw error
  }
}
```

## React Hooks Pattern

You can create custom hooks to manage API state. Here's an example pattern that's consistent with the project:

```typescript
import { useState, useEffect, useCallback } from "react"
import { fetchFromApi, putToApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

// Profile hook
export function useProfile() {
  const [profile, setProfile] = useState<TUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetchFromApi<TApiResponse<TUser>>("/profile")
      setProfile(response.data)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch profile")
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update profile
  const updateProfile = useCallback(async (profileData: Partial<TUser>) => {
    try {
      const response = await putToApi<TApiResponse<TUser>>(
        "/profile",
        profileData
      )
      setProfile(response.data)
      return response.data
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update profile")
    }
  }, [])

  // Load profile on mount
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  }
}

// Search results hook
export function useResumeSearch() {
  const [results, setResults] = useState<TCandidateResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const searchResumes = useCallback(
    async (query: string, limit: number = 10) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          query,
          limit: limit.toString(),
        })
        const response = await fetchFromApi<TApiResponse<TCandidateResult[]>>(
          `/profile/resume/search?${params}`
        )
        setResults(response.data)
        setError(null)
        return response.data
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to search resumes")
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    results,
    isLoading,
    error,
    searchResumes,
  }
}
```

## React Components Example

### Profile Form Component

```tsx
import { useState } from "react"
import { useProfile } from "@/hooks/useProfile"

export function ProfileForm() {
  const { profile, updateProfile, isLoading: profileLoading } = useProfile()
  const [name, setName] = useState(profile?.name || "")
  const [github, setGithub] = useState(profile?.github || "")
  const [linkedin, setLinkedin] = useState(profile?.linkedin || "")
  const [twitter, setTwitter] = useState(profile?.twitter || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Update form fields when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
      setGithub(profile.github || "")
      setLinkedin(profile.linkedin || "")
      setTwitter(profile.twitter || "")
    }
  }, [profile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      await updateProfile({
        name,
        github,
        linkedin,
        twitter,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profileLoading) {
    return <div>Loading profile...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  )
}
```

### Resume Upload Component

```tsx
import { useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { uploadResume, deleteResume } from "@/utils/resumeApi"

export function ResumeUpload() {
  const { profile, refreshProfile } = useProfile()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  async function handleUpload() {
    if (!file) return

    setIsUploading(true)
    setError("")

    try {
      await uploadResume(file)
      // Refresh profile to get updated resume_url
      refreshProfile()
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDeleteResume() {
    try {
      await deleteResume()
      // Refresh profile to update UI
      refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resume")
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload Resume"}
      </button>
      {error && <div className="error">{error}</div>}
      {profile?.resume_url && (
        <div>
          <p>
            Current Resume:{" "}
            <a
              href={profile.resume_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View
            </a>
          </p>
          <button onClick={handleDeleteResume}>Delete Resume</button>
        </div>
      )}
    </div>
  )
}
```

### Candidate Search Component

```tsx
import { useState } from "react"
import { useResumeSearch } from "@/hooks/useResumeSearch"

export function CandidateSearch() {
  const [query, setQuery] = useState("")
  const { results, isLoading, error, searchResumes } = useResumeSearch()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      await searchResumes(query)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for skills, experience..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {isLoading && <div>Loading results...</div>}
      {error && <div className="error">{error.message}</div>}

      <div className="results">
        {results.map((candidate) => (
          <div key={candidate.id} className="candidate-card">
            <h3>{candidate.name}</h3>
            <p>Match score: {Math.round(candidate.similarity * 100)}%</p>
            <div className="links">
              {candidate.github && (
                <a
                  href={candidate.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              )}
              {candidate.linkedin && (
                <a
                  href={candidate.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              )}
              {candidate.resume_url && (
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resume
                </a>
              )}
            </div>
          </div>
        ))}

        {results.length === 0 && query && (
          <p>No candidates found matching your search criteria.</p>
        )}
      </div>
    </div>
  )
}
```

## Error Handling

The API utility functions already extract error messages, but you can add additional handling:

```typescript
import { putToApi } from "@/utils/api"
import { useRouter } from "next/navigation"

function SomeComponent() {
  const router = useRouter()

  async function updateSomething() {
    try {
      await putToApi("/some-endpoint", data)
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes("Authentication required")) {
        router.push("/login")
      } else {
        // Display error message to user
        setError(error.message)
      }
    }
  }
}
```

## Role-Based UI

Conditionally render UI elements based on the user's role:

```tsx
import { useProfile } from "@/hooks/useProfile"

function DashboardPage() {
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!profile) {
    return <div>Error loading profile</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {profile.role === "candidate" ? (
        <CandidateDashboard profile={profile} />
      ) : (
        <RecruiterDashboard profile={profile} />
      )}
    </div>
  )
}
```

## API Response Types

Define TypeScript types for API responses:

```typescript
// User profile
type TUser = {
  id: string
  name: string
  email: string
  createdAt: string
  role: "candidate" | "recruiter"
  github?: string
  linkedin?: string
  twitter?: string
  resume_url?: string
}

// Candidate search result
type TCandidateResult = {
  id: string
  name: string
  email: string
  github?: string
  linkedin?: string
  twitter?: string
  resume_url?: string
  similarity: number
}

// API response wrapper
type TApiResponse<T> = {
  data: T
  status: "success"
}

// Error response
type TApiError = {
  error: string
  status: "error"
  details?: Array<{ path: string[]; message: string }>
}
```

This allows you to use strong typing with API calls:

```typescript
import { fetchFromApi } from "@/utils/api"
import { TApiResponse, TUser } from "@/types"

const response = await fetchFromApi<TApiResponse<TUser[]>>(
  "/profile/search?query=react"
)
```
