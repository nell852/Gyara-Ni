"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  description: string
  created_at: string
  products: { count: number }[]
}

interface CategoriesTableProps {
  categories: Category[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (categoryId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId)

      if (!error) {
        router.refresh()
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des catégories</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <Table className="min-w-[720px] sm:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Produits</TableHead>
                <TableHead className="hidden lg:table-cell">Date de création</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div>
                    {category.name}
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {category.description || "Aucune description"}
                    </div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {category.products?.[0]?.count || 0} produits
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{category.description || "Aucune description"}</TableCell>
                <TableCell className="hidden md:table-cell">{category.products?.[0]?.count || 0}</TableCell>
                <TableCell className="hidden lg:table-cell">{new Date(category.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/categories/${category.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(category.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucune catégorie trouvée</div>
        )}
      </CardContent>
    </Card>
  )
}
