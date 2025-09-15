import { createClient } from "@/lib/supabase/server"
import { StockMovementsTable } from "@/components/inventory/stock-movements-table"
import { ExportStockMovements } from "@/components/inventory/export-stock-movements" // nouveau composant
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function StockMovementsPage() {
  const supabase = await createClient()

  const { data: movements } = await supabase
    .from("stock_movements")
    .select(`
      *,
      products (name, barcode),
      profiles!created_by (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

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
          <h2 className="text-3xl font-bold text-foreground">Historique des mouvements</h2>
          <p className="text-muted-foreground">Consultez l'historique complet des mouvements de stock</p>
        </div>
      </div>

      {/* Intégration du composant d'export */}
      <ExportStockMovements />

      {/* Tableau des mouvements */}
      <StockMovementsTable movements={movements || []} />
    </div>
  )
}
