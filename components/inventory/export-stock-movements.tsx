"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, FileSpreadsheet, FileText, File } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface StockMovement {
  id: string
  movement_type: "in" | "out" | "adjustment"
  quantity: number
  created_at: string
  products: { name: string; price: number } | null
  profiles: { full_name: string } | null
}

export function ExportStockMovements() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const supabase = createClient()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(amount)

  const getDateRange = (period: "daily" | "weekly" | "monthly") => {
    const now = new Date()
    switch (period) {
      case "daily":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString(),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
        }
      case "weekly":
        const currentDay = now.getDay()
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        return { start: startOfWeek.toISOString(), end: endOfWeek.toISOString() }
      case "monthly":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)
        endOfMonth.setTime(endOfMonth.getTime() - 1)
        return { start: startOfMonth.toISOString(), end: endOfMonth.toISOString() }
    }
  }

  const fetchMovements = async (): Promise<StockMovement[]> => {
    const { start, end } = getDateRange(period)
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        products (name, price),
        profiles!created_by (full_name)
      `)
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération mouvements:", error)
      return []
    }
    return data || []
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "in": return "Entrée"
      case "out": return "Sortie"
      case "adjustment": return "Ajustement"
      default: return type
    }
  }

  const computeTotals = (movements: StockMovement[]) => {
    let totalValue = 0
    const totalsByType: Record<string, number> = { Entrée: 0, Sortie: 0, Ajustement: 0 }
    movements.forEach((m) => {
      const lineTotal = (m.products?.price || 0) * m.quantity
      totalValue += lineTotal
      const typeLabel = getMovementLabel(m.movement_type)
      if (totalsByType[typeLabel] !== undefined) totalsByType[typeLabel] += lineTotal
    })
    return { totalValue, totalsByType }
  }

  const exportToExcel = async () => {
    setLoading(true)
    try {
      const movements = await fetchMovements()
      const { totalValue, totalsByType } = computeTotals(movements)

      const data = movements.map((m) => {
        const lineTotal = (m.products?.price || 0) * m.quantity
        return {
          Produit: m.products?.name || "N/A",
          Type: getMovementLabel(m.movement_type),
          Quantité: m.quantity,
          "Prix unitaire": formatCurrency(m.products?.price || 0),
          "Total ligne": formatCurrency(lineTotal),
          Utilisateur: m.profiles?.full_name || "Inconnu",
          Date: new Date(m.created_at).toLocaleString("fr-FR"),
        }
      })

      // Ajouter les totaux par type
      Object.entries(totalsByType).forEach(([type, value]) => {
        data.push({ Produit: `TOTAL ${type}`, "Total ligne": formatCurrency(value) })
      })
      // Ajouter total général
      data.push({ Produit: "TOTAL GENERAL", "Total ligne": formatCurrency(totalValue) })

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Mouvements")
      XLSX.writeFile(wb, `mouvements_${period}_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Erreur export Excel:", error)
    }
    setLoading(false)
  }

  const exportToPDF = async () => {
    setLoading(true)
    try {
      const movements = await fetchMovements()
      const { totalValue, totalsByType } = computeTotals(movements)

      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text("Export des mouvements de stock", 20, 20)
      doc.setFontSize(12)
      doc.text(`Date d'export: ${new Date().toLocaleDateString("fr-FR")}`, 20, 30)

      const tableData = movements.map((m) => [
        m.products?.name || "N/A",
        getMovementLabel(m.movement_type),
        m.quantity,
        formatCurrency(m.products?.price || 0),
        formatCurrency((m.products?.price || 0) * m.quantity),
        m.profiles?.full_name || "Inconnu",
        new Date(m.created_at).toLocaleString("fr-FR"),
      ])

      autoTable(doc, {
        head: [["Produit", "Type", "Quantité", "Prix unitaire", "Total ligne", "Utilisateur", "Date"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      let currentY = doc.lastAutoTable.finalY + 10
      Object.entries(totalsByType).forEach(([type, value]) => {
        doc.text(`Total ${type}: ${formatCurrency(value)}`, 20, currentY)
        currentY += 8
      })
      doc.text(`TOTAL GENERAL: ${formatCurrency(totalValue)}`, 20, currentY)

      doc.save(`mouvements_${period}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Erreur export PDF:", error)
    }
    setLoading(false)
  }

  const exportToTXT = async () => {
    setLoading(true)
    try {
      const movements = await fetchMovements()
      const { totalValue, totalsByType } = computeTotals(movements)
      let content = `EXPORT DES MOUVEMENTS DE STOCK\nPériode: ${period}\nDate d'export: ${new Date().toLocaleDateString("fr-FR")}\n\n`

      movements.forEach((m, i) => {
        const lineTotal = (m.products?.price || 0) * m.quantity
        content += `${i + 1}. Produit: ${m.products?.name || "N/A"}\n`
        content += `   Type: ${getMovementLabel(m.movement_type)}\n`
        content += `   Quantité: ${m.quantity}\n`
        content += `   Prix unitaire: ${formatCurrency(m.products?.price || 0)}\n`
        content += `   Total ligne: ${formatCurrency(lineTotal)}\n`
        content += `   Utilisateur: ${m.profiles?.full_name || "Inconnu"}\n`
        content += `   Date: ${new Date(m.created_at).toLocaleString("fr-FR")}\n\n`
      })

      Object.entries(totalsByType).forEach(([type, value]) => {
        content += `TOTAL ${type}: ${formatCurrency(value)}\n`
      })
      content += `TOTAL GENERAL: ${formatCurrency(totalValue)}\n`

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `mouvements_${period}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur export TXT:", error)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DownloadIcon className="h-5 w-5" />
          Export des mouvements
        </CardTitle>
        <CardDescription>Exportez l’historique des mouvements de stock avec total par type et total général</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 flex-wrap">
        <Select value={period} onValueChange={(v) => setPeriod(v as "daily" | "weekly" | "monthly")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Journalier</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={exportToExcel} disabled={loading} variant="outline" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
        </Button>
        <Button onClick={exportToPDF} disabled={loading} variant="outline" className="flex items-center gap-2">
          <File className="h-4 w-4 text-red-600" /> PDF
        </Button>
        <Button onClick={exportToTXT} disabled={loading} variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" /> TXT
        </Button>
      </CardContent>
    </Card>
  )
}
