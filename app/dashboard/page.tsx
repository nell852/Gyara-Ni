'use client'

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarTrigger } from "@/components/sidebar/sidebar-trigger"

// Lazy load server component for client
const DashboardStats = dynamic(
  () => import("@/components/dashboard/DashboardStats.server"),
  { ssr: false }
)

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Tableau de bord</h2>
        <SidebarTrigger />
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  )
}
