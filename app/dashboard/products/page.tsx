import { createClient } from "@/lib/supabase/server"
import { ProductsTable } from "@/components/products/products-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function ProductsContent() {
  const supabase = await createClient()

  // Fetch products (without relying on implicit nested relation for inventory)
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories (name)
    `)
    .order("created_at", { ascending: false })

  const productList = products || []

  // Fetch inventory rows and merge by product_id to ensure robustness
  const { data: inventoryRows } = await supabase
    .from("inventory")
    .select("product_id, quantity, min_stock_level")

  const byProductId = new Map<string, { quantity: number; min_stock_level: number }>()
  inventoryRows?.forEach((row: { product_id: string; quantity: number; min_stock_level: number }) => {
    byProductId.set(row.product_id, {
      quantity: row.quantity ?? 0,
      min_stock_level: row.min_stock_level ?? 0,
    })
  })

  const merged = productList.map((p: any) => {
    const inv = byProductId.get(p.id)
    return {
      ...p,
      inventory: inv ? [{ quantity: inv.quantity, min_stock_level: inv.min_stock_level }] : [],
    }
  })

  return <ProductsTable products={merged} />
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export default async function ProductsPage() {
  // Server-side guard: only admins can access products page
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    // Not authenticated, redirect via dashboard layout middleware
    return null
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    // Hide page for non-admins
    return null
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Produits</h2>
          <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
