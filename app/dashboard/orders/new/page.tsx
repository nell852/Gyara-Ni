import { NewOrderForm } from "@/components/orders/new-order-form"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewOrderPage() {
  const supabase = await createClient()

  // Fetch products and inventory separately, then merge to avoid empty nested relations
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
    .select("product_id, quantity")

  const byProductId = new Map<string, { quantity: number }>()
  inventoryRows?.forEach((row: { product_id: string; quantity: number }) => {
    byProductId.set(row.product_id, { quantity: row.quantity ?? 0 })
  })

  const merged = (products || []).map((p: any) => {
    const inv = byProductId.get(p.id)
    return {
      ...p,
      inventory: inv ? [{ quantity: inv.quantity }] : [],
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Nouvelle commande</h2>
          <p className="text-muted-foreground">Créez une nouvelle commande pour un client</p>
        </div>
      </div>

      <NewOrderForm products={merged} />
    </div>
  )
}
