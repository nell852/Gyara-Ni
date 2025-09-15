import { ProductForm } from "@/components/products/product-form"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Nouveau produit</h2>
          <p className="text-muted-foreground">Ajoutez un nouveau produit à votre catalogue</p>
        </div>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}
