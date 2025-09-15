"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductCombobox } from "@/components/ui/product-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, RotateCcw } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  barcode: string
  categories: { name: string } | null
  inventory: {
    quantity: number
    min_stock_level: number
    max_stock_level: number
  }[]
}

interface StockAdjustmentFormProps {
  products: Product[]
}

export function StockAdjustmentForm({ products }: StockAdjustmentFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movementType, setMovementType] = useState<"in" | "out" | "adjustment">("in")
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setSelectedProduct(product || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || quantity === 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Utilisateur non connecté")

      // Create stock movement
      const { error: movementError } = await supabase.from("stock_movements").insert([
        {
          product_id: selectedProduct.id,
          movement_type: movementType,
          quantity: movementType === "out" ? Math.abs(quantity) : quantity,
          reason,
          created_by: user.id,
        },
      ])

      if (movementError) throw movementError

      // Reset form
      setSelectedProduct(null)
      setQuantity(0)
      setReason("")
      setMovementType("in")

      router.push("/dashboard/inventory")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStock = () => {
    return selectedProduct?.inventory?.[0]?.quantity || 0
  }

  const getNewStock = () => {
    const current = getCurrentStock()
    switch (movementType) {
      case "in":
        return current + quantity
      case "out":
        return current - quantity
      case "adjustment":
        return quantity
      default:
        return current
    }
  }

  const movementTypes = [
    { value: "in", label: "Entrée de stock", icon: Plus, color: "text-green-600" },
    { value: "out", label: "Sortie de stock", icon: Minus, color: "text-red-600" },
    { value: "adjustment", label: "Ajustement", icon: RotateCcw, color: "text-blue-600" },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sélection du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produit</Label>
              <ProductCombobox 
                products={products}
                value={selectedProduct?.id || ''}
                onValueChange={handleProductSelect}
                placeholder="Sélectionner un produit..."
                emptyMessage="Aucun produit trouvé."
              />
            </div>

            {selectedProduct && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Produit:</span> {selectedProduct.name}
                  </div>
                  <div>
                    <span className="font-medium">Catégorie:</span> {selectedProduct.categories?.name || "Aucune"}
                  </div>
                  <div>
                    <span className="font-medium">Stock actuel:</span> {getCurrentStock()} unités
                  </div>
                  <div>
                    <span className="font-medium">Code-barres:</span> {selectedProduct.barcode || "Aucun"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Mouvement de stock</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Type de mouvement</Label>
                <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className={`h-4 w-4 ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {movementType === "adjustment" ? "Nouveau stock" : "Quantité"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  required
                  min={movementType === "adjustment" ? "0" : "1"}
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                  placeholder={movementType === "adjustment" ? "Stock final souhaité" : "Nombre d'unités"}
                />
                {quantity > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Stock après opération: <span className="font-medium">{getNewStock()} unités</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Motif</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Raison du mouvement de stock (optionnel)"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading || quantity === 0} className="bg-primary hover:bg-primary/90">
                  {isLoading ? "Enregistrement..." : "Enregistrer le mouvement"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/inventory")}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
