"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Edit, Clock, CheckCircle, XCircle, Truck, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  status: string
  total_amount: number
  payment_method: string
  payment_status: string
  created_at: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    total_price: number
    products: { name: string } | null
  }[]
  profiles: { full_name: string } | null
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })


  // Fonction atomique UNIQUE pour mettre à jour statut commande et paiement
  const updateOrderAndPaymentStatus = async (orderId: string, newOrderStatus: string, newPaymentStatus: string) => {
    setIsUpdating(true)
    
    try {
      // Obtenir l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("Utilisateur non connecté")
      }

      // Utiliser la fonction RPC atomique pour TOUS les cas
      const { data: result, error: rpcError } = await supabase.rpc("update_order_status_atomic", {
        p_order_id: orderId,
        p_order_status: newOrderStatus, 
        p_payment_status: newPaymentStatus,
        p_user_id: user.id
      })
      
      if (rpcError) {
        throw new Error(`Erreur RPC: ${rpcError.message}`)
      }
      
      // Vérifier le résultat de la fonction atomique
      if (!result?.success) {
        throw new Error(result?.error || "Erreur lors de la mise à jour atomique")
      }

      // Succès: fermer le dialog et rafraîchir
      setIsDialogOpen(false)
      setEditingOrder(null)
      router.refresh()
      
      toast({
        title: "Succès",
        description: `Commande ${result.order_number} mise à jour avec succès.`,
      })
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setIsDialogOpen(true)
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

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" as const
      case "pending":
        return "secondary" as const
      case "refunded":
        return "destructive" as const
      default:
        return "outline" as const
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Payé"
      case "pending":
        return "Non Payé"
      case "refunded":
        return "Remboursé"
      default:
        return status
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getItemsCount = (items: Order["order_items"]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des commandes</CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmées</SelectItem>
              <SelectItem value="preparing">En préparation</SelectItem>
              <SelectItem value="ready">Prêtes</SelectItem>
              <SelectItem value="delivered">Livrées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <Table className="min-w-[1000px] sm:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead className="hidden sm:table-cell">Client</TableHead>
                <TableHead className="hidden md:table-cell">Articles</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Paiement</TableHead>
                <TableHead className="hidden xl:table-cell">Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {order.customer_name || "Client anonyme"}
                    </div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {getItemsCount(order.order_items)} article(s)
                    </div>
                    <div className="flex gap-2 mt-1 lg:hidden">
                      <Badge variant={getStatusVariant(order.status)} className="text-xs">
                        {getStatusLabel(order.status)}
                      </Badge>
                      <Badge variant={getPaymentStatusVariant(order.payment_status)} className="text-xs">
                        {getPaymentStatusLabel(order.payment_status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground xl:hidden mt-1">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div>
                    <div className="font-medium">{order.customer_name || "Client anonyme"}</div>
                    <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">
                    <div>{getItemsCount(order.order_items)} article(s)</div>
                    <div className="text-muted-foreground">
                      {order.order_items.slice(0, 2).map((item, index) => (
                        <div key={item.id}>
                          {item.quantity}x {item.products?.name}
                        </div>
                      ))}
                      {order.order_items.length > 2 && <div>+{order.order_items.length - 2} autres...</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{formatPrice(order.total_amount)}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{new Date(order.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditOrder(order)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucune commande trouvée</div>
        )}
      </CardContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Commande: {editingOrder.order_number}</h4>
                <p className="text-sm text-muted-foreground">
                  Client: {editingOrder.customer_name || "Client anonyme"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatPrice(editingOrder.total_amount)}
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Statut de la commande</label>
                  <Select
                    value={editingOrder.status}
                    onValueChange={(value) =>
                      setEditingOrder({ ...editingOrder, status: value })
                    }
                  >
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
                
                <div>
                  <label className="text-sm font-medium">Statut de paiement</label>
                  <Select
                    value={editingOrder.payment_status}
                    onValueChange={(value) =>
                      setEditingOrder({ ...editingOrder, payment_status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Non Payé</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    updateOrderAndPaymentStatus(
                      editingOrder.id, 
                      editingOrder.status, 
                      editingOrder.payment_status
                    )
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
