"use client"

import { useUser } from "@/providers/UserProvider"
import { TUser, UserRole } from "@/types/api"

/**
 * Hook for accessing and managing user profile data
 */
export function useProfile() {
  const { user, isLoading, error, updateUser, refreshUser } = useUser()

  /**
   * Update profile information
   * @param profileData - Partial user data to update
   */
  const updateProfile = async (profileData: Partial<TUser>) => {
    return updateUser(profileData)
  }

  /**
   * Check if user is a candidate
   */
  const isCandidate = user?.role === UserRole.Candidate

  /**
   * Check if user is a recruiter
   */
  const isRecruiter = user?.role === UserRole.Recruiter

  /**
   * Check if the role is undefined or not set
   */
  const hasNoRole = user && !user.role

  return {
    profile: user,
    isLoading,
    error,
    updateProfile,
    refreshProfile: refreshUser,
    isCandidate,
    isRecruiter,
    hasNoRole,
  }
}
