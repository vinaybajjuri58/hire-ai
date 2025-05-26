"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { fetchFromApi, postToApi } from "@/utils/api"
import ClientLayout from "../client-layout"
import { UserRole } from "@/types/api"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { ErrorMessage } from "@/components/ui/error-message"

export default function ChatPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  useEffect(() => {
    async function createInitialChat() {
      try {
        setError("")
        // First check if there are any existing chats
        const chatsResponse = await fetchFromApi<{ data: { id: string }[] }>(
          "/chats"
        )

        if (chatsResponse.data && chatsResponse.data.length > 0) {
          // If chats exist, redirect to the first one
          router.push(`/chat/${chatsResponse.data[0].id}`)
          return
        }

        // If no chats exist, create a new chat
        const chatResponse = await postToApi<{ data: { id: string } }>(
          "/chats",
          {
            title: "Candidate Search",
          }
        )

        router.push(`/chat/${chatResponse.data.id}`)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create or load chat"
        )
        console.error("Error in chat redirect:", err)
      }
    }

    createInitialChat()
  }, [router])

  return (
    <ClientLayout requiredRoles={[UserRole.Recruiter]}>
      <div className="h-full flex flex-col items-center justify-center">
        <div className="space-y-4 max-w-md text-center">
          <div className="bg-primary/10 text-primary rounded-full p-3 mx-auto w-fit">
            <MessageSquare size={24} />
          </div>
          <h1 className="text-2xl font-bold">Candidate Search</h1>

          {error ? (
            <div className="space-y-4">
              <ErrorMessage message={error} />
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Setting up your candidate search chat...
              </p>
              <div className="flex justify-center mt-4">
                <LoadingIndicator text="Creating chat..." />
              </div>
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
