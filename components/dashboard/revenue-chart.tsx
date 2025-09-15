"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, parseISO, startOfWeek } from "date-fns"
import { fr } from "date-fns/locale"

interface RevenueChartProps {
  data: Array<{ created_at: string; total_amount: number }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Group revenue by week
  const revenueByWeek = data.reduce(
    (acc, order) => {
      const orderDate = parseISO(order.created_at)
      const weekStart = startOfWeek(orderDate, { weekStartsOn: 1 })
      const weekKey = format(weekStart, "yyyy-MM-dd")

      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          revenue: 0,
          orders: 0,
          formattedWeek: format(weekStart, "dd MMM", { locale: fr }),
        }
      }
      acc[weekKey].revenue += order.total_amount
      acc[weekKey].orders += 1
      return acc
    },
    {} as Record<string, { week: string; revenue: number; orders: number; formattedWeek: string }>,
  )

  const chartData = Object.values(revenueByWeek)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8) // Last 8 weeks

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 bg-amber-600 rounded-full" />
          Revenus Hebdomadaires
        </CardTitle>
        <CardDescription>Revenus des 8 dernières semaines</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="formattedWeek" className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} FCFA`, "Revenus"]}
              labelFormatter={(label) => `Semaine du ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
