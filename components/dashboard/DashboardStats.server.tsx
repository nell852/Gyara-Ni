import { createClient } from "@/lib/supabase/server"
import { Package, Warehouse, ShoppingCart, DollarSign } from "lucide-react"
import React from "react"

export default async function DashboardStats() {
  const supabase = await createClient()

  const [
    { count: productsCount },
    { count: ordersCount },
    { data: lowStockItems },
    { data: todayOrders },
    { data: revenueData },
    { data: topProducts },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select(`*, products (name)`).lte("quantity", 5).limit(5),
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", new Date().toISOString().split("T")[0] + "T00:00:00")
      .lte("created_at", new Date().toISOString().split("T")[0] + "T23:59:59")
      .eq("status", "confirmed"),
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq("status", "confirmed"),
    supabase
      .from("order_items")
      .select(`quantity, unit_price, products!inner (name)`)
      .limit(10),
  ])

  const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const avgOrderValue = revenueData?.length ? totalRevenue / revenueData.length : 0

  const stats = [
    {
      title: "Revenus du Jour",
      value: `${todayRevenue.toLocaleString()} FCFA`,
      description: `${todayOrders?.length || 0} commandes aujourd'hui`,
      icon: DollarSign,
      bgColor: "bg-gradient-to-br from-amber-700 to-amber-800",
    },
    {
      title: "Total Produits",
      value: productsCount || 0,
      description: "Produits dans le catalogue",
      icon: Package,
      bgColor: "bg-gradient-to-br from-amber-600 to-amber-700",
    },
    {
      title: "Alertes Stock",
      value: lowStockItems?.length || 0,
      description: "Articles en stock faible",
      icon: Warehouse,
      bgColor: "bg-gradient-to-br from-amber-800 to-amber-900",
    },
    {
      title: "Commandes Totales",
      value: ordersCount || 0,
      description: `Panier moyen: ${avgOrderValue.toLocaleString()} FCFA`,
      icon: ShoppingCart,
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map(stat => (
        <div
          key={stat.title}
          className={`${stat.bgColor} p-4 rounded-lg shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer`}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-white">{stat.title}</h3>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stat.value}</div>
          <p className="text-xs text-white/90 mt-1">{stat.description}</p>
        </div>
      ))}
    </div>
  )
}
