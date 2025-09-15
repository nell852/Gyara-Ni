"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, Moon, Sun, Globe } from "lucide-react"
import dynamic from "next/dynamic"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Lazy load notification bell
const NotificationBell = dynamic(
  () =>
    import("@/components/notifications/notification-bell").then(mod => ({
      default: mod.NotificationBell,
    })),
  { ssr: false, loading: () => <div className="h-8 w-8" /> }
)

interface HeaderProps {
  user: {
    full_name: string
    email: string
    role: string
  }
}

export function DashboardHeader({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  )
  const [lang, setLang] = React.useState<'fr' | 'en'>(() =>
    typeof window !== 'undefined' ? ((localStorage.getItem('lang') as 'fr' | 'en') || 'fr') : 'fr'
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', next === 'dark')
    if (typeof window !== 'undefined') localStorage.setItem('theme', next)
  }

  const toggleLang = () => {
    const next = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    if (typeof window !== 'undefined') localStorage.setItem('lang', next)
  }

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  const getRoleLabel = (role: string) => (role === "admin" ? "Administrateur" : "Vendeur")

  return (
    <header className="sticky top-0 z-50 h-14 sm:h-16 border-b border-border bg-gradient-to-r from-amber-800 to-amber-900 px-3 sm:px-4 md:px-6 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-white truncate">
          Tableau de bord
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <NotificationBell />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="hidden sm:flex text-white hover:bg-amber-700 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLang}
          title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
          className="hidden sm:flex text-white hover:bg-amber-700 hover:text-white"
        >
          <Globe className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="relative h-10 w-10 rounded-full cursor-pointer"
              onClick={() => router.push("/dashboard/profile")}
            >
              <Avatar className="h-10 w-10 ring-2 ring-white">
                <AvatarFallback className="bg-white text-amber-800 font-bold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuPortal>
            <DropdownMenuContent className="w-56 z-[200]" align="end" side="bottom" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{getRoleLabel(user.role)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </header>
  )
}
