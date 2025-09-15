"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, FileSpreadsheet, FileText, File } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
}

export function ExportOrders() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const supabase = createClient()

  const getDateRange = (p: "daily" | "weekly" | "monthly") => {
    const now = new Date()
    switch (p) {
      case "daily": {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        return { start: start.toISOString(), end: end.toISOString() }
      }
      case "weekly": {
        const currentDay = now.getDay()
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0)
        const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        return { start: start.toISOString(), end: end.toISOString() }
      }
      case "monthly": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)
        end.setTime(end.getTime() - 1)
        return { start: start.toISOString(), end: end.toISOString() }
      }
    }
  }

  const fetchOrders = async () => {
    const { start, end } = getDateRange(period)
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }
    return data || []
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount)

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "En attente",
      confirmed: "Confirmée",
      preparing: "En préparation",
      ready: "Prête",
      delivered: "Livrée",
      cancelled: "Annulée"
    }
    return labels[status as keyof typeof labels] || status
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels = { paid: "Payé", pending: "En attente", refunded: "Remboursé" }
    return labels[status as keyof typeof labels] || status
  }

  // ---------- Export Excel ----------
  const exportToExcel = async () => {
    setLoading(true)
    try {
      const orders = await fetchOrders()
      const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0)

      const data = orders.map(o => ({
        "Numéro": o.order_number,
        "Client": o.customer_name || "Client anonyme",
        "Téléphone": o.customer_phone || "",
        "Total": formatCurrency(o.total_amount),
        "Statut": getStatusLabel(o.status),
        "Paiement": getPaymentStatusLabel(o.payment_status),
        "Méthode": o.payment_method || "",
        "Date": new Date(o.created_at).toLocaleDateString("fr-FR"),
        "Heure": new Date(o.created_at).toLocaleTimeString("fr-FR")
      }))

      // Ligne du total
      data.push({
        "Numéro": "",
        "Client": "",
        "Téléphone": "",
        "Total": `TOTAL VENTES : ${formatCurrency(totalSales)}`
      })

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Commandes")
      const fileName = `commandes_${period}_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (e) {
      console.error("Error exporting to Excel:", e)
    }
    setLoading(false)
  }

  // ---------- Export PDF ----------
  const exportToPDF = async () => {
    setLoading(true)
    try {
      const orders = await fetchOrders()
      const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0)

      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text("Export des Commandes", 20, 20)

      const labels = { daily: "Journalières", weekly: "Hebdomadaires", monthly: "Mensuelles" }
      doc.setFontSize(12)
      doc.text(`Période: ${labels[period]}`, 20, 35)
      doc.text(`Date d'export: ${new Date().toLocaleDateString("fr-FR")}`, 20, 45)

      const tableData = orders.map(o => [
        o.order_number,
        o.customer_name || "Client anonyme",
        formatCurrency(o.total_amount),
        getStatusLabel(o.status),
        getPaymentStatusLabel(o.payment_status),
        new Date(o.created_at).toLocaleDateString("fr-FR")
      ])

      autoTable(doc, {
        head: [["N°", "Client", "Total", "Statut", "Paiement", "Date"]],
        body: tableData,
        startY: 55,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      // Total des ventes
      doc.setFontSize(12)
      doc.text(`Total des ventes: ${formatCurrency(totalSales)}`, 20, doc.lastAutoTable.finalY + 10)

      const fileName = `commandes_${period}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (e) {
      console.error("Error exporting to PDF:", e)
    }
    setLoading(false)
  }

  // ---------- Export TXT ----------
  const exportToTXT = async () => {
    setLoading(true)
    try {
      const orders = await fetchOrders()
      const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0)

      let content = "EXPORT DES COMMANDES\n=====================\n\n"
      const labels = { daily: "Journalières", weekly: "Hebdomadaires", monthly: "Mensuelles" }
      content += `Période: ${labels[period]}\n`
      content += `Date d'export: ${new Date().toLocaleDateString("fr-FR")}\n`
      content += `Nombre de commandes: ${orders.length}\n\n`

      orders.forEach((o, i) => {
        content += `${i + 1}. Commande ${o.order_number}\n`
        content += `   Client: ${o.customer_name || "Client anonyme"}\n`
        content += `   Téléphone: ${o.customer_phone || "Non renseigné"}\n`
        content += `   Total: ${formatCurrency(o.total_amount)}\n`
        content += `   Statut: ${getStatusLabel(o.status)}\n`
        content += `   Paiement: ${getPaymentStatusLabel(o.payment_status)}\n`
        content += `   Date: ${new Date(o.created_at).toLocaleString("fr-FR")}\n\n`
      })

      content += `=====================\nTOTAL DES VENTES: ${formatCurrency(totalSales)}\n`

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `commandes_${period}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Error exporting to TXT:", e)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DownloadIcon className="h-5 w-5" />
          Export des Commandes
        </CardTitle>
        <CardDescription>Exportez vos commandes au format Excel, PDF ou TXT</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium">Période</label>
            <Select value={period} onValueChange={(v: "daily" | "weekly" | "monthly") => setPeriod(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Journalières (aujourd'hui)</SelectItem>
                <SelectItem value="weekly">Hebdomadaires (cette semaine)</SelectItem>
                <SelectItem value="monthly">Mensuelles (ce mois)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportToExcel} disabled={loading} variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
          </Button>
          <Button onClick={exportToPDF} disabled={loading} variant="outline" className="flex items-center gap-2">
            <File className="h-4 w-4 text-red-600" /> PDF
          </Button>
          <Button onClick={exportToTXT} disabled={loading} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" /> TXT
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
