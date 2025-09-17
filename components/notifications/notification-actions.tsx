"use client"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export function NotificationActions({
  unreadCount,
  markAllAsRead,
  deleteAllRead,
}: {
  unreadCount: number
  markAllAsRead: () => Promise<void>
  deleteAllRead: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    try {
      await markAllAsRead()
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues :", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAllRead = async () => {
    setLoading(true)
    try {
      await deleteAllRead()
    } catch (error) {
      console.error("Erreur lors de la suppression des notifications lues :", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button variant="ghost" size="icon" disabled={loading}>
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white">
            {unreadCount}
          </Badge>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleMarkAllAsRead}
        disabled={loading}
        className="flex items-center gap-2 bg-transparent"
      >
        <CheckCheck className="h-4 w-4" />
        Tout marquer comme lu
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDeleteAllRead}
        disabled={loading}
        className="flex items-center gap-2 bg-transparent"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer les lues
      </Button>
    </div>
  )
}
