import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

interface AdjustStockPageProps {
  params: { productId: string }
}

export default async function AdjustStockPage({ params }: AdjustStockPageProps) {
  const { productId } = params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .eq("id", productId)
    .eq("is_active", true)
    .single()

  const { data: inventoryRow } = await supabase
    .from("inventory")
    .select("product_id, quantity, min_stock_level, max_stock_level")
    .eq("product_id", productId)
    .single()

  if (!product) {
    notFound()
  }

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
          <h2 className="text-3xl font-bold text-foreground">Ajuster le stock</h2>
          <p className="text-muted-foreground">Ajustez le stock pour {product.name}</p>
        </div>
      </div>

      <StockAdjustmentForm
        products={[
          {
            ...product,
            inventory: inventoryRow
              ? [
                  {
                    quantity: inventoryRow.quantity,
                    min_stock_level: inventoryRow.min_stock_level,
                    max_stock_level: inventoryRow.max_stock_level,
                  },
                ]
              : [],
          },
        ]}
      />
    </div>
  )
}