"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { fetchFromApi, putToApi } from "@/utils/api"
import { TApiResponse, TUser, UserRole } from "@/types/api"

// Context type
type TUserContextType = {
  user: TUser | null
  isLoading: boolean
  error: Error | null
  refreshUser: () => Promise<void>
  updateUser: (data: Partial<TUser>) => Promise<TUser | null>
}

// Create context with default values
const UserContext = createContext<TUserContextType>({
  user: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
  updateUser: async () => null,
})

// Props for provider
type TUserProviderProps = {
  children: ReactNode
}

// Provider component
export function UserProvider({ children }: TUserProviderProps) {
  const [user, setUser] = useState<TUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Fetch user profile
  const refreshUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetchFromApi<TApiResponse<TUser>>("/profile")
      setUser(response.data || null)
      setError(null)
      // Reset retry count on success
      setRetryCount(0)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch user profile")
      )
      console.error("Error fetching user profile:", err)

      // If error is related to RLS policies or similar, try again with a delay
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
        console.log(
          `Retrying profile fetch in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`
        )

        // Increment retry count and try again after delay
        setRetryCount((prev) => prev + 1)
        setTimeout(refreshUser, delay)
        return
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update user profile
  const updateUser = async (data: Partial<TUser>) => {
    try {
      const response = await putToApi<TApiResponse<TUser>>("/profile", data)
      setUser(response.data || null)
      return response.data || null
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to update user profile")
      setError(error)
      throw error
    }
  }

  // Load user on mount
  useEffect(() => {
    refreshUser()
    // We don't want to include retryCount in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Hook to use the user context
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
