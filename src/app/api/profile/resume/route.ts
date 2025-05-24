import { NextRequest, NextResponse } from "next/server"
import * as resumeService from "@/api/services/resumeService"

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// POST /api/profile/resume - Upload a resume
export async function POST(request: NextRequest) {
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

    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error: "Resume must be uploaded as multipart/form-data",
          status: "error",
        },
        { status: 400 }
      )
    }

    // Parse the form data
    const formData = await request.formData()
    const resumeFile = formData.get("resume") as File | null

    if (!resumeFile) {
      return NextResponse.json(
        { error: "No resume file provided", status: "error" },
        { status: 400 }
      )
    }

    // Check file size
    if (resumeFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit", status: "error" },
        { status: 400 }
      )
    }

    // Check file type (PDF only)
    if (resumeFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted", status: "error" },
        { status: 400 }
      )
    }

    // Convert file to Buffer
    const fileBuffer = Buffer.from(await resumeFile.arrayBuffer())

    // Process the resume
    const result = await resumeService.processResume(
      user.id,
      fileBuffer,
      resumeFile.name,
      resumeFile.type
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
    console.error("Resume upload error:", error)
    return NextResponse.json(
      { error: "Failed to process resume upload", status: "error" },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/resume - Delete a resume
export async function DELETE(request: NextRequest) {
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

    // Delete the resume
    const result = await resumeService.deleteResumeForUser(user.id)

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, status: "error" },
        { status: result.status }
      )
    }

    return NextResponse.json(
      { message: "Resume deleted successfully", status: "success" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Resume deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete resume", status: "error" },
      { status: 500 }
    )
  }
}
