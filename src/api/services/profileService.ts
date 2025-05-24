import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { TApiResponse, TUser, UserRole } from "@/types"

/**
 * Get a user's profile by ID
 */
export async function getUserProfile(
  userId: string
): Promise<TApiResponse<TUser>> {
  try {
    // Use admin client to bypass RLS policies
    // This prevents infinite recursion errors
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      return {
        error: "Failed to retrieve user profile: " + error.message,
        status: error.code === "PGRST116" ? 404 : 500,
      }
    }

    if (!data) {
      return {
        error: "User profile not found",
        status: 404,
      }
    }

    return {
      data: {
        id: data.id,
        name: data.name || "",
        email: data.email,
        createdAt: data.created_at,
        role: data.role as UserRole,
        role_selected: data.role_selected || false,
        github: data.github || "",
        linkedin: data.linkedin || "",
        twitter: data.twitter || "",
        resume_url: data.resume_url || "",
      },
      status: 200,
    }
  } catch (error) {
    console.error("Get profile error:", error)
    return {
      error: "Failed to retrieve user profile",
      status: 500,
    }
  }
}

/**
 * Update a user's profile
 * Note: Resume updates are not allowed through this function.
 * Use the dedicated resumeService functions for resume management.
 */
export async function updateUserProfile(
  userId: string,
  profileData: {
    name?: string
    role?: UserRole
    role_selected?: boolean
    github?: string
    linkedin?: string
    twitter?: string
  }
): Promise<TApiResponse<TUser>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    // Verify the user exists
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== userId) {
      return {
        error:
          "Unauthorized. User not found or not authorized to update this profile.",
        status: 401,
      }
    }

    // Remove resume_url if someone tries to update it directly
    // This prevents users from bypassing the proper resume upload process
    const safeProfileData = { ...profileData }
    if ("resume_url" in safeProfileData) {
      delete safeProfileData["resume_url"]
      console.warn(
        "Attempted to update resume_url directly. This field can only be updated through resumeService."
      )
    }

    // Update the profile using admin client to bypass RLS
    const { data, error } = await adminClient
      .from("profiles")
      .update({
        ...safeProfileData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return {
        error: "Failed to update profile: " + error.message,
        status: 500,
      }
    }

    return {
      data: {
        id: data.id,
        name: data.name || "",
        email: data.email,
        createdAt: data.created_at,
        role: data.role as UserRole,
        role_selected: data.role_selected || false,
        github: data.github,
        linkedin: data.linkedin,
        twitter: data.twitter,
        resume_url: data.resume_url,
      },
      status: 200,
    }
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      error: "Failed to update profile",
      status: 500,
    }
  }
}

/**
 * Update a user's social links
 */
export async function updateSocialLinks(
  userId: string,
  links: {
    github?: string
    linkedin?: string
    twitter?: string
  }
): Promise<TApiResponse<TUser>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    // Verify the user exists
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || user.id !== userId) {
      return {
        error:
          "Unauthorized. User not found or not authorized to update social links.",
        status: 401,
      }
    }

    // Validate URLs if provided
    for (const [key, url] of Object.entries(links)) {
      if (url && typeof url === "string") {
        try {
          // Simple URL validation
          new URL(url)
        } catch {
          return {
            error: `Invalid URL format for ${key}`,
            status: 400,
          }
        }
      }
    }

    // Update the profile with social links using admin client
    const { data, error } = await adminClient
      .from("profiles")
      .update({
        ...links,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return {
        error: "Failed to update social links: " + error.message,
        status: 500,
      }
    }

    return {
      data: {
        id: data.id,
        name: data.name || "",
        email: data.email,
        createdAt: data.created_at,
        role: data.role as UserRole,
        role_selected: data.role_selected || false,
        github: data.github,
        linkedin: data.linkedin,
        twitter: data.twitter,
        resume_url: data.resume_url,
      },
      status: 200,
    }
  } catch (error) {
    console.error("Update social links error:", error)
    return {
      error: "Failed to update social links",
      status: 500,
    }
  }
}

/**
 * Update user profile after login to set role and other details
 * Note: Resume updates are not allowed through this function.
 */
export async function updateProfileAfterLogin(
  userId: string,
  profileData: {
    name?: string
    role?: UserRole
    github?: string
    linkedin?: string
    twitter?: string
  }
): Promise<TApiResponse<TUser>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    // First get the current profile to preserve existing values using admin client
    const { data: existingProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      return {
        error: "Failed to retrieve existing profile",
        status: 500,
      }
    }

    // Remove resume_url if someone tries to update it directly
    const safeProfileData = { ...profileData }
    if ("resume_url" in safeProfileData) {
      delete safeProfileData["resume_url"]
      console.warn(
        "Attempted to update resume_url directly in updateProfileAfterLogin. This is not allowed."
      )
    }

    // Merge existing profile with new data, prioritizing new data
    const updatedProfile = {
      ...existingProfile,
      ...safeProfileData,
      // Always update the timestamp
      updated_at: new Date().toISOString(),
    }

    // Update the profile using admin client
    const { data, error } = await adminClient
      .from("profiles")
      .update(updatedProfile)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return {
        error: "Failed to update profile after login: " + error.message,
        status: 500,
      }
    }

    return {
      data: {
        id: data.id,
        name: data.name || "",
        email: data.email,
        createdAt: data.created_at,
        role: data.role as UserRole,
        role_selected: data.role_selected || false,
        github: data.github,
        linkedin: data.linkedin,
        twitter: data.twitter,
        resume_url: data.resume_url,
      },
      status: 200,
    }
  } catch (error) {
    console.error("Update profile after login error:", error)
    return {
      error: "Failed to update profile after login",
      status: 500,
    }
  }
}

/**
 * Get a candidate profile by ID (for recruiters)
 */
export async function getCandidateProfile(
  recruiterId: string,
  candidateId: string
): Promise<TApiResponse<TUser>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    // First verify the requester is a recruiter
    const { data: recruiterData, error: recruiterError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", recruiterId)
      .single()

    if (
      recruiterError ||
      !recruiterData ||
      recruiterData.role !== "recruiter"
    ) {
      return {
        error: "Unauthorized. Only recruiters can view candidate profiles.",
        status: 403,
      }
    }

    // Then get the candidate profile using admin client
    const { data, error } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", candidateId)
      .eq("role", "candidate")
      .single()

    if (error) {
      return {
        error: "Failed to retrieve candidate profile",
        status: error.code === "PGRST116" ? 404 : 500,
      }
    }

    if (!data) {
      return {
        error: "Candidate profile not found",
        status: 404,
      }
    }

    return {
      data: {
        id: data.id,
        name: data.name || "",
        email: data.email,
        createdAt: data.created_at,
        role: data.role as UserRole,
        role_selected: data.role_selected || false,
        github: data.github,
        linkedin: data.linkedin,
        twitter: data.twitter,
        resume_url: data.resume_url,
      },
      status: 200,
    }
  } catch (error) {
    console.error("Get candidate profile error:", error)
    return {
      error: "Failed to retrieve candidate profile",
      status: 500,
    }
  }
}

/**
 * Search for candidates (for recruiters)
 * Redirects to the semantic search in resumeService
 */
export async function searchCandidates(
  recruiterId: string,
  query: string,
  limit: number = 10
): Promise<TApiResponse<TUser[]>> {
  try {
    // Import resumeService dynamically to avoid circular dependencies
    const resumeService = await import("@/api/services/resumeService")

    // Use the semantic search from resumeService
    const result = await resumeService.searchCandidateResumes(
      recruiterId,
      query,
      limit
    )

    if ("error" in result || !result.data) {
      return {
        error: result.error || "No search results found",
        status: result.status || 404,
      }
    }

    // Convert the result format to match the expected TUser[] format
    return {
      data: result.data.map((candidate) => ({
        id: candidate.id,
        name: candidate.name || "",
        email: candidate.email,
        createdAt: new Date().toISOString(), // Create a timestamp since the source doesn't have it
        role: UserRole.Candidate,
        // Don't include role_selected since it's not in the source data
        github: candidate.github,
        linkedin: candidate.linkedin,
        twitter: candidate.twitter,
        resume_url: candidate.resume_url,
      })),
      status: 200,
    }
  } catch (error) {
    console.error("Search candidates error:", error)
    return {
      error: "Failed to search candidates",
      status: 500,
    }
  }
}
