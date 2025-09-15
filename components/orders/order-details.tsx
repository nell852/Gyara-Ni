"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, CheckCircle, XCircle, Truck, User, Phone, CreditCard, Calendar } from "lucide-react"

interface OrderDetailsProps {
  order: {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string
    status: string
    total_amount: number
    payment_method: string
    payment_status: string
    notes: string
    created_at: string
    order_items: {
      id: string
      quantity: number
      unit_price: number
      total_price: number
      products: {
        name: string
        price: number
        barcode: string
      } | null
    }[]
    profiles: { full_name: string } | null
  }
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateOrder = async () => {
    setIsLoading(true)
    try {
      // If transitioning to confirmed, use RPC to confirm order transactionally
      if (order.status !== "confirmed" && status === "confirmed") {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Utilisateur non connecté")
        const { error } = await supabase.rpc("confirm_order", {
          p_order_id: order.id,
          p_user_id: user.id,
        })
        if (error) throw error
        // Update payment status separately if changed
        if (paymentStatus !== order.payment_status) {
          const { error: payErr } = await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", order.id)
          if (payErr) throw payErr
        }
      } else {
        const { error } = await supabase
          .from("orders")
          .update({
            status,
            payment_status: paymentStatus,
          })
          .eq("id", order.id)
        if (error) throw error
      }

      router.refresh()
    } catch (error) {
      if (error && typeof error === "object") {
        console.error("Error updating order:", error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "preparing":
        return <Clock className="h-4 w-4" />
      case "ready":
        return <CheckCircle className="h-4 w-4" />
      case "delivered":
        return <Truck className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary" as const
      case "confirmed":
        return "default" as const
      case "preparing":
        return "secondary" as const
      case "ready":
        return "default" as const
      case "delivered":
        return "default" as const
      case "cancelled":
        return "destructive" as const
      default:
        return "outline" as const
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente"
      case "confirmed":
        return "Confirmée"
      case "preparing":
        return "En préparation"
      case "ready":
        return "Prête"
      case "delivered":
        return "Livrée"
      case "cancelled":
        return "Annulée"
      default:
        return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces"
      case "card":
        return "Carte bancaire"
      case "mobile_money":
        return "Mobile Money"
      default:
        return method || "Non spécifié"
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Order Information */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Client</div>
                  <div className="font-medium">{order.customer_name || "Client anonyme"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Téléphone</div>
                  <div className="font-medium">{order.customer_phone || "Non renseigné"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Mode de paiement</div>
                  <div className="font-medium">{getPaymentMethodLabel(order.payment_method)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Date de création</div>
                  <div className="font-medium">{new Date(order.created_at).toLocaleString("fr-FR")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles commandés</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.order_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.products?.name}</div>
                        <div className="text-sm text-muted-foreground">{item.products?.barcode}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(item.unit_price)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatPrice(item.total_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Management */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Statut actuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                {order.payment_status === "paid" ? "Payé" : "En attente de paiement"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modifier le statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut de la commande</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="preparing">En préparation</SelectItem>
                  <SelectItem value="ready">Prête</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut du paiement</label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={updateOrder}
              disabled={isLoading || (status === order.status && paymentStatus === order.payment_status)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </CardContent>
        </Card>

        {order.profiles && (
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="text-muted-foreground">Créée par</div>
                <div className="font-medium">{order.profiles.full_name}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
