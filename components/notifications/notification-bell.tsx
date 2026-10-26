"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

// Le compteur vient de NotificationsProvider (via le header). Pas
// d'abonnement Realtime ici : le provider en a déjà un sur le canal
// "notifications", et un second .on() sur ce canal lève une erreur.
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const router = useRouter()

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="relative"
      onClick={() => router.push("/dashboard/notifications")}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}