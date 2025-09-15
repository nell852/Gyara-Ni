import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  
  // Only redirect if there's an actual error or no user
  if (error) {
    console.error("Auth error in dashboard layout:", error)
    redirect("/auth/login")
  }
  
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile error in dashboard layout:", profileError)
    redirect("/auth/login")
  }

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <DashboardSidebar userRole={profile.role} />
        </Sidebar>
        <SidebarInset className="flex-1">
          <DashboardHeader user={profile} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="container mx-auto px-0 sm:px-2 lg:px-4">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
