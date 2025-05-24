import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import * as profileService from "@/api/services/profileService"
import { UserRole } from "@/types"

// Define the validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum([UserRole.Candidate, UserRole.Recruiter]).optional(),
  github: z.string().url().max(255).nullish(),
  linkedin: z.string().url().max(255).nullish(),
  twitter: z.string().url().max(255).nullish(),
})

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Get user ID from the server-side Supabase client session
    const supabase = await import("@/utils/supabase/server").then((mod) =>
      mod.createClient()
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required", status: "error" },
        { status: 401 }
      )
    }

    const result = await profileService.getUserProfile(user.id)

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, status: "error" },
        { status: result.status }
      )
    }

    return NextResponse.json(
      { data: result.data, status: "success" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Profile GET error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve profile", status: "error" },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from the server-side Supabase client session
    const supabase = await import("@/utils/supabase/server").then((mod) =>
      mod.createClient()
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required", status: "error" },
        { status: 401 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()

    try {
      const validatedData = updateProfileSchema.parse(body)

      // Convert null values to undefined for the service function
      const sanitizedData = {
        name: validatedData.name,
        role: validatedData.role,
        github:
          validatedData.github === null ? undefined : validatedData.github,
        linkedin:
          validatedData.linkedin === null ? undefined : validatedData.linkedin,
        twitter:
          validatedData.twitter === null ? undefined : validatedData.twitter,
      }

      const result = await profileService.updateUserProfile(
        user.id,
        sanitizedData
      )

      if ("error" in result) {
        return NextResponse.json(
          { error: result.error, status: "error" },
          { status: result.status }
        )
      }

      return NextResponse.json(
        { data: result.data, status: "success" },
        { status: 200 }
      )
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationError.errors,
            status: "error",
          },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    console.error("Profile PUT error:", error)
    return NextResponse.json(
      { error: "Failed to update profile", status: "error" },
      { status: 500 }
    )
  }
}
