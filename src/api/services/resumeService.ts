import { createClient } from "@/utils/supabase/server"
import { TApiResponse, UserRole } from "@/types"
import {
  extractTextFromPdfUrl,
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

    // 1. Upload file to Supabase Storage
    const timestamp = Date.now()
    const storagePath = `${userId}/${timestamp}_${fileName}`
    console.log(
      `[ResumeUpload] Attempting upload: fileName=${fileName}, storagePath=${storagePath}, fileType=${fileType}, fileSize=${file?.length}`
    )
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("resumes")
      .upload(storagePath, file, {
        contentType: fileType,
        upsert: true,
      })
    console.log(
      `[ResumeUpload] Upload result: error=${uploadError ? uploadError.message : "none"}, data=${JSON.stringify(uploadData)}`
    )

    if (uploadError) {
      return {
        error: "Failed to upload resume file: " + uploadError.message,
        status: 500,
      }
    }

    // 2. Get public URL for the uploaded file (for storing in profile)
    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(storagePath)
    const resumeUrl = urlData.publicUrl
    console.log(`[ResumeUpload] Public URL for uploaded file: ${resumeUrl}`)

    // 3. Generate a signed URL for extraction (valid for 180 seconds)
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from("resumes").createSignedUrl(storagePath, 180)
    if (signedUrlError || !signedUrlData?.signedUrl) {
      // Clean up uploaded file if signed URL generation fails
      await supabase.storage.from("resumes").remove([storagePath])
      return {
        error: "Failed to generate signed URL for resume extraction",
        status: 500,
      }
    }
    const signedResumeUrl = signedUrlData.signedUrl
    console.log(`[ResumeUpload] Signed URL for extraction: ${signedResumeUrl}`)

    // 4. Extract text from the PDF at the signed URL
    let resumeText: string
    try {
      resumeText = await extractTextFromPdfUrl(signedResumeUrl)
    } catch (error) {
      // Clean up uploaded file if extraction fails
      await supabase.storage.from("resumes").remove([storagePath])
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract text from resume PDF",
        status: 500,
      }
    }

    // Validate that the PDF has enough content
    if (!resumeText || resumeText.trim().length < 50) {
      // Clean up uploaded file if resume is too short
      await supabase.storage.from("resumes").remove([storagePath])
      return {
        error:
          "The resume appears to be empty or contains insufficient text content. Please upload a valid resume with meaningful content.",
        status: 400,
      }
    }

    // 5. Store in Qdrant and get point ID
    let qdrantPointId: string
    try {
      qdrantPointId = await storeResume(userId, resumeText, resumeUrl)
    } catch (error) {
      // Clean up uploaded file if Qdrant storage fails
      await supabase.storage.from("resumes").remove([storagePath])
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to store resume in vector database",
        status: 500,
      }
    }

    // 6. Update profile with resume info
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
      // Try to clean up the Qdrant vector and uploaded file if profile update fails
      try {
        await deleteResume(qdrantPointId)
      } catch {
        // Non-critical cleanup error
      }
      await supabase.storage.from("resumes").remove([storagePath])
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
