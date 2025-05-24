import { NextRequest, NextResponse } from "next/server"
import * as profileService from "@/api/services/profileService"
import { z } from "zod"

// Define validation schema for search parameters
const searchParamsSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query too long"),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10),
})

// GET /api/profile/search - Search for candidates (for recruiters)
export async function GET(request: NextRequest) {
  try {
    // Get recruiter ID from the server-side Supabase client session
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

    // Parse and validate search parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const limitParam = searchParams.get("limit")

    // Parse limit with proper validation
    let limit = 10 // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 50) // Cap at 50
      }
    }

    // Validate parameters
    try {
      searchParamsSchema.parse({ query, limit })
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

    // Call the service function to search candidates
    const result = await profileService.searchCandidates(user.id, query, limit)

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
    console.error("Search candidates error:", error)
    return NextResponse.json(
      { error: "Failed to search candidates", status: "error" },
      { status: 500 }
    )
  }
}
