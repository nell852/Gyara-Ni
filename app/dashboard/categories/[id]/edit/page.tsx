import { CategoryForm } from "@/components/categories/category-form"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single()

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/categories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Modifier la catégorie</h2>
          <p className="text-muted-foreground">Modifiez les informations de la catégorie</p>
        </div>
      </div>

      <CategoryForm category={category} />
    </div>
  )
}