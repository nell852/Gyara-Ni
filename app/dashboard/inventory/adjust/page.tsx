import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function StockAdjustPage() {
  const supabase = await createClient()

  // Fetch products and inventory separately to ensure quantities are accurate
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .eq("is_active", true)
    .order("name")

  const { data: inventoryRows } = await supabase
    .from("inventory")
    .select("product_id, quantity, min_stock_level, max_stock_level")

  const byProductId = new Map<string, { quantity: number; min_stock_level: number; max_stock_level: number | null }>()
  inventoryRows?.forEach((row: { product_id: string; quantity: number; min_stock_level: number; max_stock_level: number | null }) => {
    byProductId.set(row.product_id, {
      quantity: row.quantity ?? 0,
      min_stock_level: row.min_stock_level ?? 0,
      max_stock_level: row.max_stock_level ?? null,
    })
  })

  const merged = (products || []).map((p: any) => {
    const inv = byProductId.get(p.id)
    return {
      ...p,
      inventory: inv
        ? [{ quantity: inv.quantity, min_stock_level: inv.min_stock_level, max_stock_level: inv.max_stock_level }]
        : [],
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'inventaire
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Ajustement de stock</h2>
          <p className="text-muted-foreground">Enregistrez les entrées, sorties et ajustements de stock</p>
        </div>
      </div>

      <StockAdjustmentForm products={merged} />
    </div>
  )
}
