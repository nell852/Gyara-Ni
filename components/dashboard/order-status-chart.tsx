"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface OrderStatusChartProps {
  data: Array<{ status: string }>
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const statusLabels = {
    pending: "En attente",
    confirmed: "Confirmées",
    preparing: "En préparation",
    ready: "Prêtes",
    delivered: "Livrées",
    cancelled: "Annulées",
  }

  const statusColors = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    preparing: "#ea580c",
    ready: "#10b981",
    delivered: "#059669",
    cancelled: "#ef4444",
  }

  const statusCounts = data.reduce(
    (acc, order) => {
      const status = order.status as keyof typeof statusLabels
      if (!acc[status]) {
        acc[status] = {
          status: statusLabels[status] || status,
          count: 0,
          fill: statusColors[status] || "#6b7280",
        }
      }
      acc[status].count += 1
      return acc
    },
    {} as Record<string, { status: string; count: number; fill: string }>,
  )

  const chartData = Object.values(statusCounts)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 bg-blue-600 rounded-full" />
          Statut des Commandes
        </CardTitle>
        <CardDescription>Répartition des commandes d'aujourd'hui</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs fill-muted-foreground" />
            <YAxis type="category" dataKey="status" className="text-xs fill-muted-foreground" width={80} />
            <Tooltip
              formatter={(value: number) => [`${value}`, "Commandes"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
