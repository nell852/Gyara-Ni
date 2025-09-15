import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "@/components/orders/orders-table"
import { OrderStats } from "@/components/orders/order-stats"
import { ExportOrders } from "@/components/orders/export-orders"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function OrdersContent() {
  const supabase = await createClient()

  // Get orders with items
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        unit_price,
        total_price,
        products (name)
      ),
      profiles!created_by (full_name)
    `)
    .order("created_at", { ascending: false })

  return <OrdersTable orders={orders || []} />
}

async function OrdersStats() {
  const supabase = await createClient()

  // Get today's stats
  const today = new Date().toISOString().split("T")[0]
  const [{ count: todayOrders }, { data: todayRevenue }, { count: pendingOrders }, { count: readyOrders }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .eq("status", "confirmed"),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "confirmed")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "ready"),
    ])

  const todayRevenueTotal = todayRevenue?.reduce((sum, order) => sum + order.total_amount, 0) || 0

  const stats = {
    todayOrders: todayOrders || 0,
    todayRevenue: todayRevenueTotal,
    pendingOrders: pendingOrders || 0,
    readyOrders: readyOrders || 0,
  }

  return <OrderStats stats={stats} />
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export default async function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gestion des commandes</h2>
          <p className="text-muted-foreground">Suivez et gérez toutes vos commandes en temps réel</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle commande
          </Link>
        </Button>
      </div>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersStats />
        <ExportOrders />
        <OrdersContent />
      </Suspense>
    </div>
  )
}
