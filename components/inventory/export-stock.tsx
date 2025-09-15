"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadIcon, FileSpreadsheet, FileText, File } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface InventoryItem {
  id: string
  quantity: number
  products: {
    id: string
    name: string
  }
}

export function ExportStock() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchInventory = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from("inventory")
      .select(`
        *,
        products (id, name)
      `)
      .order("last_updated", { ascending: false })

    if (error) {
      console.error("Erreur récupération stock:", error)
      return []
    }

    return data || []
  }

  const exportToExcel = async () => {
    setLoading(true)
    try {
      const inventory = await fetchInventory()
      const data = inventory.map(item => ({
        "Produit": item.products.name,
        "Quantité": item.quantity
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Stock")
      XLSX.writeFile(wb, `stock_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Erreur export Excel:", error)
    }
    setLoading(false)
  }

  const exportToPDF = async () => {
    setLoading(true)
    try {
      const inventory = await fetchInventory()
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text("Export du Stock", 20, 20)
      doc.setFontSize(12)
      doc.text(`Date d'export: ${new Date().toLocaleDateString("fr-FR")}`, 20, 30)

      const tableData = inventory.map(item => [item.products.name, item.quantity])
      autoTable(doc, {
        head: [["Produit", "Quantité"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 10 },
      })

      doc.save(`stock_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Erreur export PDF:", error)
    }
    setLoading(false)
  }

  const exportToTXT = async () => {
    setLoading(true)
    try {
      const inventory = await fetchInventory()
      let content = "EXPORT DU STOCK\n====================\n\n"
      inventory.forEach((item, index) => {
        content += `${index + 1}. Produit: ${item.products.name}\n`
        content += `   Quantité: ${item.quantity}\n\n`
      })

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `stock_${new Date().toISOString().split("T")[0]}.txt`
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
          Export du Stock
        </CardTitle>
        <CardDescription>Exportez votre stock au format Excel, PDF ou TXT</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 flex-wrap">
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
