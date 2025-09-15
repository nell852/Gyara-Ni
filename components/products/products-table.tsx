"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, MoreHorizontal, Search, Package } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price: number
  cost_price: number
  barcode: string
  is_active: boolean
  categories: { name: string } | null
  inventory: { quantity: number; min_stock_level: number }[] | null
}

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.categories?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (productId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (!error) {
        router.refresh()
      }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStockStatus = (inventory: Product["inventory"]) => {
    if (!inventory || inventory.length === 0) {
      return { status: "Aucun stock", variant: "secondary" as const }
    }

    const stock = inventory[0]
    if (!stock || stock.quantity === undefined || stock.min_stock_level === undefined) {
      return { status: "Stock non défini", variant: "secondary" as const }
    }

    if (stock.quantity <= stock.min_stock_level) {
      return { status: "Stock faible", variant: "destructive" as const }
    } else if (stock.quantity <= stock.min_stock_level * 2) {
      return { status: "Stock moyen", variant: "secondary" as const }
    } else {
      return { status: "En stock", variant: "default" as const }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des produits</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
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
                <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.inventory)
              const stockQuantity = product.inventory?.[0]?.quantity ?? 0

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.barcode}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {product.categories?.name || "Sans catégorie"}
                      </div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        Stock: {stockQuantity}
                      </div>
                      <div className="mt-1 md:hidden">
                        <Badge variant={stockStatus.variant} className="text-xs">{stockStatus.status}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{product.categories?.name || "Sans catégorie"}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span>{stockQuantity}</span>
                      <Badge variant={stockStatus.variant} className="hidden lg:inline-flex">{stockStatus.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" forceMount className="z-[200]">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/inventory/${product.id}/adjust`}>
                            <Package className="mr-2 h-4 w-4" />
                            Ajuster le stock
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucun produit trouvé</div>
        )}
      </CardContent>
    </Card>
  )
}
