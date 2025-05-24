import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import * as profileService from "@/api/services/profileService"

// Define the validation schema for social links updates
const socialLinksSchema = z.object({
  github: z.string().url("Invalid GitHub URL").max(255).nullish(),
  linkedin: z.string().url("Invalid LinkedIn URL").max(255).nullish(),
  twitter: z.string().url("Invalid Twitter URL").max(255).nullish(),
})

// PUT /api/profile/social - Update user's social links
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
      const validatedData = socialLinksSchema.parse(body)

      // Convert null values to undefined for the service function
      const sanitizedLinks = {
        github:
          validatedData.github === null ? undefined : validatedData.github,
        linkedin:
          validatedData.linkedin === null ? undefined : validatedData.linkedin,
        twitter:
          validatedData.twitter === null ? undefined : validatedData.twitter,
      }

      const result = await profileService.updateSocialLinks(
        user.id,
        sanitizedLinks
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
    console.error("Social links update error:", error)
    return NextResponse.json(
      { error: "Failed to update social links", status: "error" },
      { status: 500 }
    )
  }
}
