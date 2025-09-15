"use client"

import { Button } from "@/components/ui/button"
import { CheckCheck, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function NotificationActions() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)

      router.refresh()
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteAllRead = async () => {
    setLoading(true)
    try {
      await supabase.from("notifications").delete().eq("is_read", true)

      router.refresh()
    } catch (error) {
      console.error("Error deleting notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={markAllAsRead}
        disabled={loading}
        className="flex items-center gap-2 bg-transparent"
      >
        <CheckCheck className="h-4 w-4" />
        Tout marquer comme lu
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={deleteAllRead}
        disabled={loading}
        className="flex items-center gap-2 bg-transparent"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer les lues
      </Button>
    </div>
  )
}
