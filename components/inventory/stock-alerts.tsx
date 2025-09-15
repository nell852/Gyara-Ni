import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package } from "lucide-react"

interface StockAlert {
  id: string
  quantity: number
  min_stock_level: number
  products: {
    name: string
    categories: { name: string } | null
  } | null
}

interface StockAlertsProps {
  items: StockAlert[]
}

export function StockAlerts({ items }: StockAlertsProps) {
  if (!items || items.length === 0) return null

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <AlertTriangle className="h-5 w-5" />
          Alertes de stock
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          {items.length} produit{items.length > 1 ? "s" : ""} nécessite{items.length > 1 ? "nt" : ""} un
          réapprovisionnement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">{item.products?.name}</div>
                  <div className="text-xs text-muted-foreground">{item.products?.categories?.name}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive" className="text-xs">
                  {item.quantity} restant
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">Min: {item.min_stock_level}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
