"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface SalesChartProps {
  data: Array<{ created_at: string; total_amount: number }>
}

export function SalesChart({ data }: SalesChartProps) {
  // Group sales by date
  const salesByDate = data.reduce(
    (acc, order) => {
      const date = format(parseISO(order.created_at), "yyyy-MM-dd")
      if (!acc[date]) {
        acc[date] = { date, sales: 0, orders: 0 }
      }
      acc[date].sales += order.total_amount
      acc[date].orders += 1
      return acc
    },
    {} as Record<string, { date: string; sales: number; orders: number }>,
  )

  const chartData = Object.values(salesByDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      formattedDate: format(parseISO(item.date), "dd MMM", { locale: fr }),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 bg-orange-500 rounded-full" />
          Évolution des Ventes
        </CardTitle>
        <CardDescription>Ventes des 30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="formattedDate" className="text-xs fill-muted-foreground" />
            <YAxis className="text-xs fill-muted-foreground" />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} FCFA`, "Ventes"]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ fill: "#ea580c", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
