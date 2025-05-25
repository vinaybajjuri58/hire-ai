"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/hooks/useProfile"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { AlertCircle, Check, Loader2 } from "lucide-react"

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

export function ProfileForm() {
  const { profile, updateProfile, isLoading: profileLoading } = useProfile()

  // Form state
  const [name, setName] = useState("")
  const [github, setGithub] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [twitter, setTwitter] = useState("")

  // Form validation state
  const [errors, setErrors] = useState<{
    name?: string
    github?: string
    linkedin?: string
    twitter?: string
  }>({})

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Update form fields when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
      setGithub(profile.github || "")
      setLinkedin(profile.linkedin || "")
      setTwitter(profile.twitter || "")
    }
  }, [profile])

  // Form validation
  const validateForm = () => {
    const newErrors: {
      name?: string
      github?: string
      linkedin?: string
      twitter?: string
    } = {}

    // Validate name (required)
    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    // Validate GitHub URL (optional)
    if (github && !URL_REGEX.test(github)) {
      newErrors.github = "Please enter a valid URL"
    }

    // Validate LinkedIn URL (optional)
    if (linkedin && !URL_REGEX.test(linkedin)) {
      newErrors.linkedin = "Please enter a valid URL"
    }

    // Validate Twitter URL (optional)
    if (twitter && !URL_REGEX.test(twitter)) {
      newErrors.twitter = "Please enter a valid URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset status
    setSubmitError("")
    setSubmitSuccess(false)

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateProfile({
        name,
        github: github || undefined,
        linkedin: linkedin || undefined,
        twitter: twitter || undefined,
      })

      setSubmitSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update profile"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Your basic profile information - will be visible to recruiters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {submitError && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {submitError}
            </div>
          )}

          {/* Success message */}
          {submitSuccess && (
            <div className="p-3 text-sm bg-primary/10 text-primary rounded-md flex items-center gap-2">
              <Check className="h-4 w-4" />
              Profile updated successfully!
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email field (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted/50"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* GitHub field */}
          <div className="space-y-2">
            <Label htmlFor="github">GitHub Profile</Label>
            <Input
              id="github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/yourusername"
              disabled={isSubmitting}
              aria-invalid={!!errors.github}
            />
            {errors.github && (
              <p className="text-sm text-destructive">{errors.github}</p>
            )}
          </div>

          {/* LinkedIn field */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourusername"
              disabled={isSubmitting}
              aria-invalid={!!errors.linkedin}
            />
            {errors.linkedin && (
              <p className="text-sm text-destructive">{errors.linkedin}</p>
            )}
          </div>

          {/* Twitter field */}
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter Profile</Label>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/yourusername"
              disabled={isSubmitting}
              aria-invalid={!!errors.twitter}
            />
            {errors.twitter && (
              <p className="text-sm text-destructive">{errors.twitter}</p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
