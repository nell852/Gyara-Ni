import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { StockAlerts } from "@/components/inventory/stock-alerts"
import { ExportStock } from "@/components/inventory/export-stock" // <-- import
import { Button } from "@/components/ui/button"
import { Plus, TrendingDown } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function InventoryContent() {
  const supabase = await createClient()

  const { data: inventory } = await supabase
    .from("inventory")
    .select(`
      *,
      products (
        id,
        name,
        barcode,
        price,
        categories (name)
      )
    `)
    .order("last_updated", { ascending: false })

  return <InventoryTable inventory={inventory || []} />
}

async function StockAlertsContent() {
  const supabase = await createClient()

  const { data: lowStockItems } = await supabase
    .from("inventory")
    .select(`
      *,
      products (name, categories (name))
    `)
    .lte("quantity", 5)
    .order("quantity", { ascending: true })

  if (!lowStockItems || lowStockItems.length === 0) return null

  return <StockAlerts items={lowStockItems} />
}

function InventorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export default async function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gestion des stocks</h2>
          <p className="text-muted-foreground">Suivez et gérez votre inventaire en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory/movements">
              <TrendingDown className="mr-2 h-4 w-4" />
              Historique
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/dashboard/inventory/adjust">
              <Plus className="mr-2 h-4 w-4" />
              Ajuster stock
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<InventorySkeleton />}>
        <StockAlertsContent />
        <ExportStock /> {/* <-- Ajouté ici */}
        <InventoryContent />
      </Suspense>
    </div>
  )
}
