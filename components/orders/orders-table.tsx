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
  updated_at: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    total_price: number
    products: { name: string } | null
  }[]
  profiles: { full_name: string; role: string } | null
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
  const [isDeleting, setIsDeleting] = useState(false)
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(price)

  const getItemsCount = (items: Order["order_items"]) =>
    items.reduce((sum, item) => sum + item.quantity, 0)

  const getStatusIcon = (status: string) => {
    const map: Record<string, JSX.Element> = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      preparing: <Clock className="h-4 w-4" />,
      ready: <CheckCircle className="h-4 w-4" />,
      delivered: <Truck className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />,
    }
    return map[status] || <Clock className="h-4 w-4" />
  }

  const getStatusLabel = (s: string) =>
    ({ pending: "En attente", confirmed: "Confirmée", preparing: "En préparation",
       ready: "Prête", delivered: "Livrée", cancelled: "Annulée" }[s] || s)

  const getStatusVariant = (s: string) =>
    ({ pending: "secondary", preparing: "secondary", cancelled: "destructive" }[s] || "default") as const

  const getPaymentStatusLabel = (s: string) =>
    ({ paid: "Payé", pending: "Non Payé", refunded: "Remboursé" }[s] || s)

  const getPaymentStatusVariant = (s: string) =>
    ({ paid: "default", pending: "secondary", refunded: "destructive" }[s] || "outline") as const

  // --- Mise à jour atomique via RPC Supabase ---
  const updateOrderAndPaymentStatus = async (
    orderId: string,
    newOrderStatus: string,
    newPaymentStatus: string
  ) => {
    setIsUpdating(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error("Utilisateur non connecté")

      const { data: result, error: rpcError } = await supabase.rpc("update_order_status_atomic", {
        p_order_id: orderId,
        p_order_status: newOrderStatus,
        p_payment_status: newPaymentStatus,
        p_user_id: user.id
      })
      if (rpcError) throw new Error(`Erreur RPC: ${rpcError.message}`)
      if (!result?.success) throw new Error(result?.error || "Erreur lors de la mise à jour atomique")

      setIsDialogOpen(false)
      setEditingOrder(null)
      router.refresh()
      toast({ title: "Succès", description: `Commande ${result.order_number} mise à jour.` })
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Une erreur inattendue",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // --- Suppression ---
  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Voulez-vous vraiment supprimer la commande ${order.order_number} ?`)) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("orders").delete().eq("id", order.id)
      if (error) throw new Error(error.message)
      toast({ title: "Commande supprimée", description: `Commande ${order.order_number} supprimée avec succès.` })
      router.refresh()
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Erreur lors de la suppression",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setIsDialogOpen(true)
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
          <Table className="min-w-[1100px] sm:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead className="hidden sm:table-cell">Client</TableHead>
                <TableHead className="hidden md:table-cell">Articles</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Paiement</TableHead>
                <TableHead className="hidden xl:table-cell">Créée le</TableHead>
                <TableHead className="hidden xl:table-cell">Mise à jour le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell className="hidden sm:table-cell">{order.customer_name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.order_items.map((item) => (
                      <div key={item.id}>
                        {item.quantity} x {item.products?.name || "Produit inconnu"}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{formatPrice(order.total_amount)}</TableCell>
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
                  <TableCell className="hidden xl:table-cell">
                    {new Date(order.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {new Date(order.updated_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                    {order.profiles?.role === "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteOrder(order)}
                        disabled={isDeleting}
                      >
                        <XCircle className="h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
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

      {/* Dialog d’édition */}
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Non Payé</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUpdating}>
                  Annuler
                </Button>
                <Button
                  onClick={() =>
                    updateOrderAndPaymentStatus(
                      editingOrder.id,
                      editingOrder.status,
                      editingOrder.payment_status
                    )
                  }
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
