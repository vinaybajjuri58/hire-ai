"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MessageSquare, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import ClientLayout from "../client-layout"
import { useProfile } from "@/hooks/useProfile"
import { fetchFromApi, postToApi } from "@/utils/api"

export default function DashboardPage() {
  const router = useRouter()
  const { isCandidate, isRecruiter } = useProfile()

  async function handleCandidateSearch() {
    // 1. Check for existing chat
    const chatsResponse = await fetchFromApi<{ data: { id: string }[] }>(
      "/chats"
    )
    if (chatsResponse.data && chatsResponse.data.length > 0) {
      router.push(`/chat/${chatsResponse.data[0].id}`)
      return
    }
    // 2. If not, create one
    const chatResponse = await postToApi<{ data: { id: string } }>("/chats", {
      title: "Candidate Search",
    })
    router.push(`/chat/${chatResponse.data.id}`)
  }

  return (
    <ClientLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your AI Hiring Platform Dashboard
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Show chat card only for recruiters */}
          {isRecruiter && (
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleCandidateSearch}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Candidate Search
                </CardTitle>
                <CardDescription>
                  Search for candidates using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Use natural language to find candidates matching your
                  requirements.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Show profile card for candidates */}
          {isCandidate && (
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push("/profile")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription>Manage your profile settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Update your information and upload your resume to get matched
                  with opportunities.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
