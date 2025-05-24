import { createClient } from "@/utils/supabase/server"
import { TApiResponse, UserRole } from "@/types"
import {
  extractTextFromPdf,
  storeResume,
  searchResumes,
  deleteResume,
} from "@/utils/qdrant"

/**
 * Process and store a resume
 */
export async function processResume(
  userId: string,
  file: Buffer,
  fileName: string,
  fileType: string
): Promise<
  TApiResponse<{
    resumeUrl: string
    qdrantPointId: string
  }>
> {
  const supabase = await createClient()

  try {
    // Verify the user exists and is a candidate
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return {
        error: "User profile not found",
        status: 404,
      }
    }

    if (profile.role !== UserRole.Candidate) {
      return {
        error: "Only candidates can upload resumes",
        status: 403,
      }
    }

    // Extract text from PDF
    try {
      const resumeText = await extractTextFromPdf(file)

      // Validate that the PDF has enough content
      if (!resumeText || resumeText.trim().length < 50) {
        return {
          error:
            "The resume appears to be empty or contains insufficient text content. Please upload a valid resume with meaningful content.",
          status: 400,
        }
      }

      // Upload file to Supabase Storage
      const timestamp = Date.now()
      const storagePath = `${userId}/${timestamp}_${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, file, {
          contentType: fileType,
          upsert: true,
        })

      if (uploadError) {
        return {
          error: "Failed to upload resume file: " + uploadError.message,
          status: 500,
        }
      }

      // Get URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(storagePath)

      const resumeUrl = urlData.publicUrl

      // Store in Qdrant and get point ID
      const qdrantPointId = await storeResume(userId, resumeText, resumeUrl)

      // Update profile with resume info
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          resume_url: resumeUrl,
          resume_text: resumeText,
          qdrant_point_id: qdrantPointId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        // Try to clean up the Qdrant vector if profile update fails
        try {
          await deleteResume(qdrantPointId)
        } catch {
          // Non-critical cleanup error
        }

        return {
          error: "Failed to update profile with resume information",
          status: 500,
        }
      }

      return {
        data: {
          resumeUrl,
          qdrantPointId,
        },
        status: 200,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process resume PDF"
      return {
        error: errorMessage,
        status: 500,
      }
    }
  } catch (error) {
    console.error("Resume processing error:", error)
    return {
      error: "Failed to process resume",
      status: 500,
    }
  }
}

/**
 * Search for candidates using resume semantic search
 */
export async function searchCandidateResumes(
  recruiterId: string,
  query: string,
  limit: number = 10
): Promise<
  TApiResponse<
    Array<{
      id: string
      name: string
      email: string
      github?: string
      linkedin?: string
      twitter?: string
      resume_url?: string
      similarity: number
    }>
  >
> {
  const supabase = await createClient()

  try {
    // Verify the requester is a recruiter
    const { data: recruiterProfile, error: recruiterError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", recruiterId)
      .single()

    if (
      recruiterError ||
      !recruiterProfile ||
      recruiterProfile.role !== UserRole.Recruiter
    ) {
      return {
        error: "Only recruiters can search for candidates",
        status: 403,
      }
    }

    // Search in Qdrant
    const searchResults = await searchResumes(query, limit)

    if (!searchResults || searchResults.length === 0) {
      return {
        data: [],
        status: 200,
      }
    }

    // Get user IDs from search results
    const userIds = searchResults.map((result) => result.userId)

    // Get candidate profiles from Supabase
    const { data: candidateProfiles, error: candidatesError } = await supabase
      .from("profiles")
      .select("id, name, email, github, linkedin, twitter, resume_url")
      .in("id", userIds)
      .eq("role", UserRole.Candidate)

    if (candidatesError) {
      return {
        error: "Failed to fetch candidate profiles: " + candidatesError.message,
        status: 500,
      }
    }

    // Combine search results with profile data
    const candidates = candidateProfiles.map((profile) => {
      const matchingResult = searchResults.find(
        (result) => result.userId === profile.id
      )
      return {
        ...profile,
        similarity: matchingResult ? matchingResult.similarity : 0,
      }
    })

    // Sort by similarity score (highest first)
    candidates.sort((a, b) => b.similarity - a.similarity)

    return {
      data: candidates,
      status: 200,
    }
  } catch (error) {
    console.error("Resume search error:", error)
    return {
      error: "Failed to search for candidates",
      status: 500,
    }
  }
}

/**
 * Delete a resume and its vector representation
 */
export async function deleteResumeForUser(
  userId: string
): Promise<TApiResponse<null>> {
  const supabase = await createClient()

  try {
    // Get the current Qdrant point ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("qdrant_point_id, resume_url")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return {
        error: "User profile not found",
        status: 404,
      }
    }

    const qdrantPointId = profile.qdrant_point_id
    const resumeUrl = profile.resume_url

    if (!qdrantPointId && !resumeUrl) {
      return {
        error: "No resume found for this user",
        status: 404,
      }
    }

    const cleanupErrors: string[] = []

    // Delete from Qdrant if point ID exists
    if (qdrantPointId) {
      try {
        await deleteResume(qdrantPointId)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        cleanupErrors.push(`Qdrant cleanup: ${errorMessage}`)
        console.error("Error deleting from Qdrant:", error)
        // Continue with other cleanup steps
      }
    }

    // Delete from Supabase Storage if URL exists
    if (resumeUrl) {
      try {
        // Extract path from URL
        const url = new URL(resumeUrl)
        const path = url.pathname.split("/").slice(-2).join("/")

        if (path) {
          await supabase.storage.from("resumes").remove([path])
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        cleanupErrors.push(`Storage cleanup: ${errorMessage}`)
        console.error("Error deleting from Storage:", error)
        // Continue with profile update
      }
    }

    // Update profile to remove resume references
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        resume_url: null,
        resume_text: null,
        qdrant_point_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return {
        error: "Failed to update profile after resume deletion",
        status: 500,
      }
    }

    // If there were cleanup errors but the profile was updated, return a warning
    if (cleanupErrors.length > 0) {
      console.warn(
        `Resume deletion completed with warnings: ${cleanupErrors.join("; ")}`
      )
    }

    return {
      data: null,
      status: 200,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Resume deletion error:", error)
    return {
      error: `Failed to delete resume: ${errorMessage}`,
      status: 500,
    }
  }
}
