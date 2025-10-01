"use client"

import { useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
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
import * as XLSX from "xlsx"
import jsPDF from "jspdf"

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

  // Nouveaux états pour export
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Filtrage des commandes
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Commandes d’une date choisie
  const ordersByDate = selectedDate
    ? orders.filter((o) => o.created_at.startsWith(selectedDate))
    : []

  // === Export Excel ===
  const exportExcel = () => {
    const data = ordersByDate.map((o) => ({
      Commande: o.order_number,
      Client: o.customer_name || "Anonyme",
      Téléphone: o.customer_phone,
      Total: o.total_amount,
      Statut: o.status,
      Paiement: o.payment_status,
      Date: o.created_at,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Commandes")
    XLSX.writeFile(wb, `commandes_${selectedDate}.xlsx`)
  }

  // === Export TXT ===
  const exportTxt = () => {
    const txt = ordersByDate
      .map(
        (o) =>
          `Commande: ${o.order_number} | Client: ${o.customer_name || "Anonyme"} | Total: ${o.total_amount} | Statut: ${o.status}`
      )
      .join("\n")
    const blob = new Blob([txt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `commandes_${selectedDate}.txt`
    a.click()
  }

  // === Export PDF ===
  const exportPdf = () => {
    const doc = new jsPDF()
    doc.text(`Commandes du ${selectedDate}`, 10, 10)
    ordersByDate.forEach((o, i) => {
      doc.text(
        `${i + 1}. ${o.order_number} - ${o.customer_name || "Anonyme"} - ${o.total_amount} XOF - ${o.status}`,
        10,
        20 + i * 10
      )
    })
    doc.save(`commandes_${selectedDate}.pdf`)
  }

  // Mise à jour des statuts (inchangé)
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

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setIsDialogOpen(true)
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(price)

  const formatCameroonTime = (isoDate: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Africa/Douala",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(isoDate))
  }

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">Liste des commandes</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
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

            {/* Bouton Export */}
            <Button onClick={() => setIsExportDialogOpen(true)}>Exporter par date</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <Table className="min-w-[1100px] sm:min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <div>{order.customer_name || "Client anonyme"}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.order_items.map((item) => (
                        <div key={item.id}>{item.quantity}x {item.products?.name}</div>
                      ))}
                    </TableCell>
                    <TableCell>{formatPrice(order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                        {getPaymentStatusLabel(order.payment_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCameroonTime(order.created_at)}</TableCell>
                    <TableCell>{order.profiles?.full_name || "Vendeur inconnu"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                        <Edit className="h-4 w-4" /> Modifier
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
      </Card>

      {/* Dialog d’export */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter les commandes par date</DialogTitle>
          </DialogHeader>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border p-2 rounded w-full"
          />

          {ordersByDate.length > 0 ? (
            <div className="flex gap-2 mt-4">
              <Button onClick={exportPdf}>📄 PDF</Button>
              <Button onClick={exportExcel}>📊 Excel</Button>
              <Button onClick={exportTxt}>📑 TXT</Button>
            </div>
          ) : (
            selectedDate && (
              <p className="text-sm text-muted-foreground mt-4">
                Aucune commande trouvée pour cette date.
              </p>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d’édition (inchangé) */}
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
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</>
                  ) : "Enregistrer"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
