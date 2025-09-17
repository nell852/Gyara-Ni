import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Warehouse, ShoppingCart, DollarSign } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

// Lazy load heavy chart components to reduce initial bundle size
const SalesChart = dynamic(() => import("@/components/dashboard/sales-chart").then(mod => ({ default: mod.SalesChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full" />
})

const RevenueChart = dynamic(() => import("@/components/dashboard/revenue-chart").then(mod => ({ default: mod.RevenueChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full" />
})

const TopProductsChart = dynamic(() => import("@/components/dashboard/top-products-chart").then(mod => ({ default: mod.TopProductsChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full" />
})

const OrderStatusChart = dynamic(() => import("@/components/dashboard/order-status-chart").then(mod => ({ default: mod.OrderStatusChart })), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full" />
})

async function DashboardStats() {
  const supabase = await createClient()

  const [
    { count: productsCount },
    { count: categoriesCount },
    { count: ordersCount },
    { data: lowStockItems },
    { data: todayOrders },
    { data: revenueData },
    { data: topProducts },
    { data: ordersByStatus },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select(`*, products (name)`).lte("quantity", 5).limit(5),
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", `${new Date().toISOString().split("T")[0]}T00:00:00`)
      .lte("created_at", `${new Date().toISOString().split("T")[0]}T23:59:59`)
      .eq("status", "confirmed"),
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "confirmed"),
    supabase
      .from("order_items")
      .select(`
        quantity,
        unit_price,
        products!inner (name)
      `)
      .limit(10),
    supabase.from("orders").select("status").gte("created_at", new Date().toISOString().split("T")[0]),
  ])

  const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
  const avgOrderValue = revenueData?.length ? totalRevenue / revenueData.length : 0

  const stats = [
    {
      title: "Revenus du Jour",
      value: `${todayRevenue.toLocaleString()} FCFA`,
      description: `${todayOrders?.length || 0} commandes aujourd'hui`,
      icon: DollarSign,
      color: "text-amber-100",
      bgColor: "bg-gradient-to-br from-amber-700 to-amber-800",
    },
    {
      title: "Total Produits",
      value: productsCount || 0,
      description: "Produits dans le catalogue",
      icon: Package,
      color: "text-amber-100",
      bgColor: "bg-gradient-to-br from-amber-600 to-amber-700",
    },
    {
      title: "Alertes Stock",
      value: lowStockItems?.length || 0,
      description: "Articles en stock faible",
      icon: Warehouse,
      color: "text-amber-100",
      bgColor: "bg-gradient-to-br from-amber-800 to-amber-900",
    },
    {
      title: "Commandes Totales",
      value: ordersCount || 0,
      description: `Panier moyen: ${avgOrderValue.toLocaleString()} FCFA`,
      icon: ShoppingCart,
      color: "text-amber-100",
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
  ]

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`${stat.bgColor} border-0 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.color}`}>{stat.title}</CardTitle>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className={`text-xs ${stat.color} opacity-90`}>{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SalesChart data={revenueData || []} />
        <OrderStatusChart data={ordersByStatus || []} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart data={revenueData || []} />
        <TopProductsChart data={(topProducts || []).filter(item => item.products?.name)} />
      </div>

      {lowStockItems && lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertes Stock Faible</CardTitle>
            <CardDescription>Produits nécessitant un réapprovisionnement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg"
                >
                  <span className="font-medium">{item.products?.name}</span>
                  <span className="text-sm text-orange-600 dark:text-orange-400">Stock: {item.quantity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Tableau de bord</h2>
        <p className="text-muted-foreground">Vue d'ensemble de votre boutique Gyara Ni</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />
      </Suspense>
    </div>
  )
}
