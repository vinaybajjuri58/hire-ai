import { requireAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { UserProvider } from "@/providers/UserProvider"

// This layout is for authenticated pages like dashboard, account, etc.
export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side auth check with redirect
  await requireAuth()

  return (
    <UserProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </UserProvider>
  )
}
