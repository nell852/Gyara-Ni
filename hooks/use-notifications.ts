"use client"
import { useEffect, useState, useContext, createContext } from "react"
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

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

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

  const markAsRead = async (id: string) => {
    try {
      if (!isValidUUID(id)) throw new Error("ID invalide")
      await supabase.from("notifications").update({ is_read: true }).eq("id", id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error(error)
      await fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error(error)
      await fetchNotifications()
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      if (!isValidUUID(id)) throw new Error("ID invalide")
      await supabase.from("notifications").delete().eq("id", id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setUnreadCount((prev) =>
        Math.max(0, prev - (notifications.find((n) => n.id === id && !n.is_read) ? 1 : 0))
      )
    } catch (error) {
      console.error(error)
      await fetchNotifications()
    }
  }

  useEffect(() => {
    fetchNotifications()
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          if (!(payload.new as Notification).is_read) {
            setUnreadCount((prev) => prev + 1)
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } : n))
          )
          setUnreadCount((prev) =>
            Math.max(
              0,
              prev +
                ((payload.new as Notification).is_read &&
                !(payload.old as Notification).is_read
                  ? -1
                  : 0)
            )
          )
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          setUnreadCount((prev) =>
            Math.max(0, prev - (!(payload.old as Notification).is_read ? 1 : 0))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications,
      } as NotificationsContextType} // 👉 contournement ici
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
