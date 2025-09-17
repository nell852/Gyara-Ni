"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  action_url?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications :", error)
    } finally {
      setLoading(false)
    }
  }

  // Marquer une notification comme lue
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)

      if (error) {
        throw error
      }

      // Mise à jour locale de l'état
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Erreur lors du marquage comme lu :", error)
      await fetchNotifications()
    }
  }

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false)

      if (error) {
        throw error
      }

      // Mise à jour locale de l'état
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues :", error)
      await fetchNotifications()
    }
  }

  // Supprimer une notification
  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      // Mise à jour locale de l'état
      setNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      )
      setUnreadCount((prev) =>
        Math.max(0, prev - (notifications.find((n) => n.id === id && !n.is_read) ? 1 : 0))
      )
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification :", error)
      await fetchNotifications()
    }
  }

  // Initialisation et abonnement en temps réel
  useEffect(() => {
    fetchNotifications()

    // Abonnement aux changements en temps réel
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE" || payload.eventType === "DELETE") {
            fetchNotifications()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}
