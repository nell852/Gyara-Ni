import { createClient } from "@/lib/supabase/server"

export type NotificationType = "low_stock" | "new_order" | "order_status" | "system"

interface CreateNotificationParams {
  title: string
  message: string
  type: NotificationType
  userId?: string
  actionUrl?: string
}

export async function createNotification({ title, message, type, userId, actionUrl }: CreateNotificationParams) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      type,
      user_id: userId,
      action_url: actionUrl,
      read: false,
    })

    if (error) {
      console.error("Error creating notification:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error creating notification:", error)
    return false
  }
}

export async function createLowStockNotification(productName: string, currentStock: number, minStock: number) {
  return createNotification({
    title: "Stock Faible Détecté",
    message: `Le produit "${productName}" a un stock faible (${currentStock} restant, minimum: ${minStock}). Réapprovisionnement nécessaire.`,
    type: "low_stock",
    actionUrl: "/dashboard/inventory",
  })
}

export async function createNewOrderNotification(orderNumber: string, customerName: string, totalAmount: number) {
  return createNotification({
    title: "Nouvelle Commande Reçue",
    message: `Commande #${orderNumber} de ${customerName} pour ${totalAmount.toLocaleString()} FCFA.`,
    type: "new_order",
    actionUrl: `/dashboard/orders`,
  })
}

export async function createOrderStatusNotification(
  orderNumber: string,
  oldStatus: string,
  newStatus: string,
  customerName: string,
) {
  const statusLabels = {
    pending: "En attente",
    confirmed: "Confirmée",
    preparing: "En préparation",
    ready: "Prête",
    delivered: "Livrée",
    cancelled: "Annulée",
  }

  const oldLabel = statusLabels[oldStatus as keyof typeof statusLabels] || oldStatus
  const newLabel = statusLabels[newStatus as keyof typeof statusLabels] || newStatus

  return createNotification({
    title: "Statut Commande Modifié",
    message: `Commande #${orderNumber} de ${customerName}: ${oldLabel} → ${newLabel}`,
    type: "order_status",
    actionUrl: `/dashboard/orders`,
  })
}

export async function createSystemNotification(title: string, message: string) {
  return createNotification({
    title,
    message,
    type: "system",
  })
}

// Function to check and create low stock notifications
export async function checkLowStockAndNotify() {
  const supabase = await createClient()

  try {
    const { data: lowStockItems } = await supabase
      .from("inventory")
      .select(`
        *,
        products (name)
      `)
      .lte("quantity", 5) // Items with 5 or less in stock

    if (lowStockItems && lowStockItems.length > 0) {
      for (const item of lowStockItems) {
        // Check if we already sent a notification for this item recently (within 24 hours)
        const { data: recentNotification } = await supabase
          .from("notifications")
          .select("id")
          .eq("type", "low_stock")
          .ilike("message", `%${item.products?.name}%`)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (!recentNotification || recentNotification.length === 0) {
          await createLowStockNotification(
            item.products?.name || "Produit inconnu",
            item.quantity,
            item.min_quantity || 5,
          )
        }
      }
    }
  } catch (error) {
    console.error("Error checking low stock:", error)
  }
}
