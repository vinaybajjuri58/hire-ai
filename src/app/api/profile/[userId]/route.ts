import { NextRequest, NextResponse } from "next/server"
import * as profileService from "@/api/services/profileService"

// GET /api/profile/[userId] - Get a candidate profile by ID (for recruiters)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params
    const candidateId = resolvedParams.userId

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidate ID is required", status: "error" },
        { status: 400 }
      )
    }

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

    // Call the service function to get candidate profile
    const result = await profileService.getCandidateProfile(
      user.id,
      candidateId
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
  } catch (error) {
    console.error("Get candidate profile error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve candidate profile", status: "error" },
      { status: 500 }
    )
  }
}
