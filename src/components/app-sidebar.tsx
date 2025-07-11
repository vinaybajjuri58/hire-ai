"use client"

import * as React from "react"
import { LayoutDashboard, MessageSquare, UserCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SignOutButton } from "@/components/SignOutButton"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { fetchFromApi } from "@/utils/api"
import { TChatListItem } from "@/types/chat"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/useProfile"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [chats, setChats] = useState<TChatListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { profile, isCandidate, isRecruiter } = useProfile()

  // Extract the current chat ID from the path if we're on a chat page
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.split("/")[2]
    : undefined

  useEffect(() => {
    // Only fetch chats for recruiters
    if (isRecruiter) {
      fetchChats()
    } else {
      setIsLoading(false)
    }
  }, [isRecruiter])

  async function fetchChats() {
    try {
      setIsLoading(true)
      const data = await fetchFromApi<{ data: TChatListItem[] }>("/chats")
      setChats(data.data || [])
    } catch (err) {
      console.error("Error fetching chats:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">AI Hiring Platform</span>
                  <span className="text-xs">Dashboard</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Candidate-specific navigation */}
        {isCandidate && (
          <div className="px-3 py-2">
            <Link href="/profile">
              <Button variant="secondary" className="w-full justify-start">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Recruiter-specific navigation */}
        {isRecruiter && (
          <>
            <div className="mt-2 px-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-1">
                Your Chat
              </div>

              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : chats.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No chat yet
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    key={chats[0].id}
                    href={`/chat/${chats[0].id}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-muted",
                      currentChatId === chats[0].id
                        ? "bg-muted font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{chats[0].title}</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>
          {profile && (
            <div className="text-sm text-muted-foreground mb-4">
              <div className="font-medium">{profile.name}</div>
              <div>{profile.email}</div>
              <div className="mt-1 text-xs">
                Role: {profile.role || "Not set"}
              </div>
            </div>
          )}
          <SignOutButton className="w-full justify-start" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
