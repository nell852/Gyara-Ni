"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductCombobox } from "@/components/ui/product-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  categories: { name: string } | null
  inventory: { quantity: number }[]
}

interface OrderItem {
  product: Product
  quantity: number
}

interface NewOrderFormProps {
  products: Product[]
}

export function NewOrderForm({ products }: NewOrderFormProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const addProduct = () => {
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    const existingItem = orderItems.find((item) => item.product.id === product.id)
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setOrderItems([...orderItems, { product, quantity: 1 }])
    }
    setSelectedProductId("")
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }

    setOrderItems(orderItems.map((item) => (item.product.id === productId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.product.id !== productId))
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (orderItems.length === 0) {
      setError("Veuillez ajouter au moins un produit à la commande")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate stock against server inventory to avoid stale UI data
      const productIds = orderItems.map((item) => item.product.id)
      const { data: inventoryRows, error: inventoryError } = await supabase
        .from("inventory")
        .select("product_id, quantity")
        .in("product_id", productIds)

      if (inventoryError) throw inventoryError

      const productIdToQty = new Map<string, number>()
      inventoryRows?.forEach((row: { product_id: string; quantity: number }) => {
        productIdToQty.set(row.product_id, row.quantity ?? 0)
      })

      const insufficient = orderItems.find((item) => {
        const available = productIdToQty.get(item.product.id) ?? 0
        return item.quantity > available
      })

      if (insufficient) {
        const available = productIdToQty.get(insufficient.product.id) ?? 0
        throw new Error(
          `Stock insuffisant pour "${insufficient.product.name}". Disponible: ${available}, demandé: ${insufficient.quantity}`,
        )
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Utilisateur non connecté")

      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase.rpc("generate_order_number")
      if (orderNumberError) throw orderNumberError

      const orderData = {
        order_number: orderNumberData,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        total_amount: calculateTotal(),
        payment_method: paymentMethod || null,
        payment_status: paymentMethod ? "paid" : "pending",
        created_by: user.id,
      }

      // Create order
      const { data: order, error: orderError } = await supabase.from("orders").insert([orderData]).select().single()

      if (orderError) throw orderError

      // Create order items
      const orderItemsData = orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

      if (itemsError) throw itemsError

      router.push(`/dashboard/orders/${order.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getAvailableStock = (product: Product) => {
    return product.inventory?.[0]?.quantity || 0
  }

  const isProductAvailable = (product: Product) => {
    return getAvailableStock(product) > 0
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Order Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nom du client</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom du client (optionnel)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Téléphone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+225 XX XX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ajouter des produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <ProductCombobox 
                products={products}
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                placeholder="Sélectionner un produit..."
                emptyMessage="Aucun produit trouvé."
                className="flex-1"
              />
              <Button onClick={addProduct} disabled={!selectedProductId}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Récapitulatif de la commande
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucun produit ajouté</div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">{formatPrice(item.product.price)} / unité</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= getAvailableStock(item.product)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}

              <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
                {isLoading ? "Création..." : "Créer la commande"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
