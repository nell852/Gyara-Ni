"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Edit, Package, MoreHorizontal, Plus, Minus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface InventoryItem {
  id: string
  product_id: string
  quantity: number
  min_stock_level: number
  max_stock_level: number
  last_updated: string
  products: {
    id: string
    name: string
    barcode: string
    price: number
    categories: { name: string } | null
  } | null
}

interface InventoryTableProps {
  inventory: InventoryItem[]
}

export function InventoryTable({ inventory }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const filteredInventory = inventory.filter(
    (item) =>
      (item.products?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.products?.categories?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  const getStockStatus = (quantity: number, minLevel: number, maxLevel: number) => {
    // Vérifier d'abord le surstock (priorité la plus haute)
    if (maxLevel && quantity >= maxLevel) {
      return { 
        status: "Surstock", 
        variant: "secondary" as const, 
        className: "bg-blue-500 text-white hover:bg-blue-600",
        rowClassName: "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
      }
    } else if (quantity <= minLevel) {
      return { 
        status: "Stock critique", 
        variant: "secondary" as const, 
        className: "bg-yellow-500 text-white hover:bg-yellow-600",
        rowClassName: "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500"
      }
    } else if (quantity <= minLevel * 2) {
      return { 
        status: "Stock faible", 
        variant: "secondary" as const, 
        className: "bg-orange-500 text-white hover:bg-orange-600",
        rowClassName: "bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-500"
      }
    } else {
      return { 
        status: "Normal", 
        variant: "secondary" as const, 
        className: "bg-green-500 text-white hover:bg-green-600",
        rowClassName: "bg-green-50 hover:bg-green-100 border-l-4 border-green-500"
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

  const calculateStockValue = (quantity: number, price: number) => {
    return formatPrice(quantity * price)
  }

  const handleStockAdjustment = async (productId: string, adjustment: number) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${adjustment > 0 ? 'ajouter' : 'retirer'} ${Math.abs(adjustment)} unités ?`)) return
    
    try {
      const { data: currentInventory } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", productId)
        .single()

      if (currentInventory) {
        const newQuantity = Math.max(0, currentInventory.quantity + adjustment)
        
        const { error } = await supabase
          .from("inventory")
          .update({ 
            quantity: newQuantity,
            last_updated: new Date().toISOString()
          })
          .eq("product_id", productId)

        if (!error) {
          // Créer un mouvement de stock
          await supabase.from("stock_movements").insert({
            product_id: productId,
            movement_type: adjustment > 0 ? "in" : "out",
            quantity: Math.abs(adjustment),
            reason: `Ajustement ${adjustment > 0 ? 'positif' : 'négatif'} manuel`
          })
          
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'ajustement du stock:", error)
    }
  }

  const handleResetStock = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir remettre le stock à zéro ?")) return
    
    try {
      const { error } = await supabase
        .from("inventory")
        .update({ 
          quantity: 0,
          last_updated: new Date().toISOString()
        })
        .eq("product_id", productId)

      if (!error) {
        await supabase.from("stock_movements").insert({
          product_id: productId,
          movement_type: "adjustment",
          quantity: 0,
          reason: "Remise à zéro manuelle"
        })
        
        router.refresh()
      }
    } catch (error) {
      console.error("Erreur lors de la remise à zéro:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventaire détaillé
        </CardTitle>
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
          <Table className="min-w-[900px] sm:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell">Niveaux</TableHead>
                <TableHead className="hidden lg:table-cell">Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden xl:table-cell">Dernière MAJ</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => {
              if (!item.products) return null

              const stockStatus = getStockStatus(item.quantity, item.min_stock_level, item.max_stock_level)

              return (
                <TableRow key={item.id} className={stockStatus.rowClassName}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.products.name}</div>
                      <div className="text-sm text-muted-foreground">{item.products.barcode}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {item.products.categories?.name || "Sans catégorie"}
                      </div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        Stock: {item.quantity} unités
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{item.products.categories?.name || "Sans catégorie"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{item.quantity}</span>
                      <span className="text-sm text-muted-foreground">unités</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <div>Min: {item.min_stock_level}</div>
                      {item.max_stock_level && <div>Max: {item.max_stock_level}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{calculateStockValue(item.quantity, item.products.price)}</TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant} className={stockStatus.className}>
                      {stockStatus.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{new Date(item.last_updated).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" forceMount className="z-[200]">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/inventory/${item.product_id}/adjust`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Ajuster le stock
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStockAdjustment(item.product_id, 10)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter 10 unités
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStockAdjustment(item.product_id, -10)}>
                          <Minus className="mr-2 h-4 w-4" />
                          Retirer 10 unités
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/products/${item.product_id}/edit`}>
                            <Package className="mr-2 h-4 w-4" />
                            Modifier le produit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleResetStock(item.product_id)} 
                          className="text-destructive"
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Remettre à zéro
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

        {filteredInventory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucun produit en stock trouvé</div>
        )}
      </CardContent>
    </Card>
  )
}
