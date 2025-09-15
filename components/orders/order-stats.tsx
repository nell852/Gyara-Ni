import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, DollarSign, Clock, CheckCircle } from "lucide-react"

interface OrderStatsProps {
  stats: {
    todayOrders: number
    todayRevenue: number
    pendingOrders: number
    readyOrders: number
  }
}

export function OrderStats({ stats }: OrderStatsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const statsData = [
    {
      title: "Commandes aujourd'hui",
      value: stats.todayOrders,
      description: "Total du jour",
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Chiffre d'affaires",
      value: formatPrice(stats.todayRevenue),
      description: "Revenus du jour",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "En attente",
      value: stats.pendingOrders,
      description: "À traiter",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Prêtes",
      value: stats.readyOrders,
      description: "À livrer",
      icon: CheckCircle,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
