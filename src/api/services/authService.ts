import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  TApiResponse,
  TAuthResponse,
  TLoginRequest,
  TSignupRequest,
  UserRole,
} from "@/types"

export async function login(
  credentials: TLoginRequest
): Promise<TApiResponse<TAuthResponse>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    // First, just try to authenticate - most reliable method
    const authResponse = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    // If invalid credentials or user not found
    if (authResponse.error) {
      // If error suggests user doesn't exist, provide a clearer message
      if (authResponse.error.message?.includes("Invalid login credentials")) {
        // Use the profiles table with admin client to check if user exists
        // This bypasses RLS restrictions
        const { data: profileCheck } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", credentials.email)
          .maybeSingle()

        if (!profileCheck) {
          return {
            error: "This email is not registered. Please sign up first.",
            status: 404,
          }
        } else {
          // User exists but password is wrong
          return {
            error: "Invalid password. Please try again.",
            status: 401,
          }
        }
      }

      // Check if the error is related to email verification
      if (
        authResponse.error.message?.includes("Email not confirmed") ||
        authResponse.error.message?.includes("Email verification required") ||
        authResponse.error.code === "email_not_confirmed"
      ) {
        return {
          error:
            "Please verify your email before logging in. Check your inbox for a verification link or request a new one.",
          status: 403,
          emailVerificationRequired: true,
        }
      }

      // For any other errors, return the error
      return {
        error: authResponse.error.message,
        status: 401,
      }
    }

    const data = authResponse.data

    // If no data returned (shouldn't happen with successful auth)
    if (!data || !data.user) {
      return {
        error: "Authentication failed. Please check your credentials.",
        status: 401,
      }
    }

    // Use admin client to bypass RLS policies when fetching the profile
    // This prevents infinite recursion errors in RLS policies
    const { data: userData, error: userError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    // If profile not found, create one
    if (userError) {
      console.error("User error:", userError)
      if (userError.code === "PGRST116") {
        // Create a basic profile for the user
        const { error: insertError } = await adminClient
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || "",
            role: UserRole.Candidate, // Use enum instead of string
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })

        if (insertError) {
          return {
            error: "Failed to setup user profile",
            status: 500,
          }
        }

        // Return basic user data from auth
        return {
          data: {
            user: {
              id: data.user.id,
              name: data.user.user_metadata?.name || "",
              email: data.user.email || "",
              createdAt: new Date().toISOString(),
              role: UserRole.Candidate, // Use enum instead of string
            },
            token: data.session?.access_token,
            emailVerified: false,
          },
          status: 200,
        }
      }

      return {
        error: "Failed to retrieve user information: " + userError.message,
        status: 500,
      }
    }

    // Return user data from profile
    return {
      data: {
        user: {
          id: userData.id,
          name: userData.name || "",
          email: userData.email,
          createdAt: userData.created_at,
          role: userData.role,
          github: userData.github || "",
          linkedin: userData.linkedin || "",
          twitter: userData.twitter || "",
          resume_url: userData.resume_url || "",
        },
        token: data.session?.access_token,
        emailVerified: true,
      },
      status: 200,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      error: "Authentication failed. Server error occurred.",
      status: 500,
    }
  }
}

export async function signup(
  userData: TSignupRequest
): Promise<TApiResponse<TAuthResponse>> {
  const adminClient = createAdminClient()

  try {
    // Check if user already exists - using admin client to bypass RLS
    const { data: existingUser, error: checkError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", userData.email)
      .maybeSingle()

    if (checkError) {
      console.error("User existence check error:", checkError)
    }

    if (existingUser && existingUser.id) {
      return {
        error:
          "This email is already registered. Please log in or use a different email.",
        status: 409, // Conflict status code
      }
    }

    // Register the user with Supabase Auth
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: false, // Email verification required
        user_metadata: {
          name: userData.name, // Store name in user metadata
        },
      })

    if (authError) {
      // Handle specific error cases
      if (authError.message.includes("already been registered")) {
        return {
          error:
            "This email is already registered. Please log in or use a different email.",
          status: 409, // Conflict status code
        }
      }

      if (authError.message.includes("password")) {
        return {
          error: "Password must be at least 6 characters long.",
          status: 400,
        }
      }

      return {
        error: authError.message || "Failed to create account",
        status: 400,
      }
    }

    if (!authData?.user) {
      return {
        error: "Failed to create user",
        status: 500,
      }
    }

    // Send verification email after user creation
    try {
      await adminClient.auth.admin.inviteUserByEmail(userData.email)
    } catch (inviteError) {
      console.error("Failed to send verification email:", inviteError)
      // Do not fail signup if invite fails, just log
    }

    // Instead of relying on a trigger, create the profile directly with admin client
    // This ensures we bypass any RLS policies that might cause recursion
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: authData.user.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || UserRole.Candidate,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
    }

    // Try to update the profile with name and role - using admin client
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        name: userData.name,
        role: userData.role || UserRole.Candidate, // Use enum instead of string
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
    }

    // Return success but without a token - they need to verify email first
    return {
      data: {
        user: {
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          createdAt: new Date().toISOString(),
          role: userData.role || UserRole.Candidate, // Use enum instead of string
        },
        // No token - must verify email first
        emailVerified: false,
      },
      status: 201,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed"
    console.error("Signup error:", errorMessage)

    // Check for common error patterns
    if (
      errorMessage.includes("already") &&
      errorMessage.includes("registered")
    ) {
      return {
        error:
          "This email is already registered. Please log in or use a different email.",
        status: 409,
      }
    }

    return {
      error: errorMessage,
      status: 500,
    }
  }
}

export async function signout(): Promise<TApiResponse<null>> {
  try {
    const { error: signOutError } = await (await createClient()).auth.signOut()

    if (signOutError) {
      return {
        error: signOutError.message,
        status: 500,
      }
    }

    return {
      data: null,
      status: 200,
    }
  } catch (error) {
    console.error("Sign out error:", error)
    return {
      error: "Failed to sign out",
      status: 500,
    }
  }
}
