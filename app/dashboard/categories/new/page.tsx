import { CategoryForm } from "@/components/categories/category-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewCategoryPage() {
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
          <h2 className="text-3xl font-bold text-foreground">Nouvelle catégorie</h2>
          <p className="text-muted-foreground">Ajoutez une nouvelle catégorie de produits</p>
        </div>
      </div>

      <CategoryForm />
    </div>
  )
}