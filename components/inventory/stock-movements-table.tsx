"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Minus, RotateCcw, TrendingDown } from "lucide-react"

interface StockMovement {
  id: string
  movement_type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  created_at: string
  products: { name: string; barcode: string } | null
  profiles: { full_name: string } | null
}

interface StockMovementsTableProps {
  movements: StockMovement[]
}

export function StockMovementsTable({ movements }: StockMovementsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || movement.movement_type === filterType

    return matchesSearch && matchesType
  })

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "in":
        return <Plus className="h-4 w-4 text-green-600" />
      case "out":
        return <Minus className="h-4 w-4 text-red-600" />
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return <TrendingDown className="h-4 w-4" />
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case "in":
        return "Entrée"
      case "out":
        return "Sortie"
      case "adjustment":
        return "Ajustement"
      default:
        return type
    }
  }

  const getMovementVariant = (type: string) => {
    switch (type) {
      case "in":
        return "default" as const
      case "out":
        return "destructive" as const
      case "adjustment":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Historique des mouvements
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mouvements</SelectItem>
              <SelectItem value="in">Entrées uniquement</SelectItem>
              <SelectItem value="out">Sorties uniquement</SelectItem>
              <SelectItem value="adjustment">Ajustements uniquement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="-mx-4 sm:mx-0 overflow-x-auto">
          <Table className="min-w-[800px] sm:min-w-0">
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead className="hidden md:table-cell">Motif</TableHead>
                <TableHead className="hidden lg:table-cell">Utilisateur</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {filteredMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="hidden sm:table-cell">{new Date(movement.created_at).toLocaleString("fr-FR")}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{movement.products?.name}</div>
                    <div className="text-sm text-muted-foreground">{movement.products?.barcode}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {new Date(movement.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getMovementVariant(movement.movement_type)} className="flex items-center gap-1 w-fit">
                    {getMovementIcon(movement.movement_type)}
                    {getMovementLabel(movement.movement_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-medium ${
                      movement.movement_type === "in"
                        ? "text-green-600"
                        : movement.movement_type === "out"
                          ? "text-red-600"
                          : "text-blue-600"
                    }`}
                  >
                    {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "-" : ""}
                    {movement.quantity}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">{movement.reason || "Aucun motif spécifié"}</TableCell>
                <TableCell className="hidden lg:table-cell">{movement.profiles?.full_name || "Utilisateur inconnu"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>

        {filteredMovements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucun mouvement trouvé</div>
        )}
      </CardContent>
    </Card>
  )
}
