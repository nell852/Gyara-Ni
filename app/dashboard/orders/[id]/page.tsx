import { createClient } from "@/lib/supabase/server"
import { OrderDetails } from "@/components/orders/order-details"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

interface OrderPageProps {
  params: { id: string }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (name, price, barcode)
      ),
      profiles!created_by (full_name)
    `)
    .eq("id", id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Commande #{order.order_number}</h2>
          <p className="text-muted-foreground">Détails et gestion de la commande</p>
        </div>
      </div>

      <OrderDetails order={order} />
    </div>
  )
}
