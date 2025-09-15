"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Package, ShoppingCart, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { NotificationActions } from "@/components/notifications/notification-actions"
import { useNotifications } from "@/hooks/use-notifications"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function NotificationsPage() {
  const { notifications, loading } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Package className="h-4 w-4 text-orange-600" />
      case "new_order":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case "order_status":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "system":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Badge variant="destructive">Stock Faible</Badge>
      case "new_order":
        return <Badge variant="default">Nouvelle Commande</Badge>
      case "order_status":
        return <Badge variant="secondary">Statut Commande</Badge>
      case "system":
        return <Badge variant="outline">Système</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Notifications</h2>
          <p className="text-muted-foreground">Gérez vos alertes et notifications</p>
        </div>
        <NotificationActions />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Chargement des notifications...</p>
            </CardContent>
          </Card>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={`${!notification.is_read ? "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {format(new Date(notification.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getNotificationBadge(notification.type)}
                    {!notification.is_read && <div className="h-2 w-2 bg-orange-500 rounded-full" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                {notification.action_url && (
                  <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                    Voir les détails
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-center">Vous n'avez aucune notification pour le moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
