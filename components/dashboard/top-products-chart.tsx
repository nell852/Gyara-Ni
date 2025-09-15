"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface TopProductsChartProps {
  data: Array<{
    quantity: number
    unit_price: number
    products: { name: string } | null
  }>
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  // Calculate top products by revenue
  const productRevenue = data.reduce(
    (acc, item) => {
      if (!item.products?.name) return acc

      const productName = item.products.name
      const revenue = item.quantity * item.unit_price

      if (!acc[productName]) {
        acc[productName] = { name: productName, revenue: 0, quantity: 0 }
      }
      acc[productName].revenue += revenue
      acc[productName].quantity += item.quantity
      return acc
    },
    {} as Record<string, { name: string; revenue: number; quantity: number }>,
  )

  const chartData = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((item, index) => ({
      ...item,
      fill: [
        "#ea580c", // orange-600
        "#d97706", // amber-600
        "#dc2626", // red-600
        "#7c2d12", // orange-900
        "#92400e", // amber-800
        "#991b1b", // red-800
      ][index],
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 bg-red-600 rounded-full" />
          Top Produits
        </CardTitle>
        <CardDescription>Produits les plus vendus par revenus</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="revenue"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} FCFA`, "Revenus"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
