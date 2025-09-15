import { createClient } from "@/lib/supabase/server"
import { CategoriesTable } from "@/components/categories/categories-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function CategoriesContent() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select(`
      *,
      products (count)
    `)
    .order("created_at", { ascending: false })

  return <CategoriesTable categories={categories || []} />
}

function CategoriesSkeleton() {
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

export default async function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Catégories</h2>
          <p className="text-muted-foreground">Organisez vos produits par Catégories</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/dashboard/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Link>
        </Button>
      </div>

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  )
}
