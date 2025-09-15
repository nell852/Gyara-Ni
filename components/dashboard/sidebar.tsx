"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Package, Tags, Warehouse, ShoppingCart, BarChart3, Bell, User } from "lucide-react"
import { 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar"

interface SidebarProps {
  userRole: string
}

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: BarChart3, roles: ["admin", "vendeur"] },
  { name: "Produits", href: "/dashboard/products", icon: Package, roles: ["admin"] },
  { name: "Catégories", href: "/dashboard/categories", icon: Tags, roles: ["admin"] },
  { name: "Stock", href: "/dashboard/inventory", icon: Warehouse, roles: ["admin", "vendeur"] },
  { name: "Commandes", href: "/dashboard/orders", icon: ShoppingCart, roles: ["admin", "vendeur"] },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["admin", "vendeur"] },
  { name: "Mon profil", href: "/dashboard/profile", icon: User, roles: ["admin", "vendeur"] },
]

export function DashboardSidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole))
  const handleMobileClose = () => setOpenMobile(false)

  return (
    <>
      {/* Header avec logo plus grand et décorations fantaisistes */}
      <SidebarHeader className="p-4 border-b border-amber-300 flex justify-center sidebar-gradient-bg">
        <div className="flex flex-col items-center gap-2 sidebar-claw-decoration">
          <img src="/logo.jpg" alt="Logo Gyara Ni" className="h-16 w-auto object-contain drop-shadow-lg" />
          <span className="text-2xl font-bold text-white drop-shadow-md">Gyara Ni</span>
        </div>
      </SidebarHeader>

      {/* Menu de navigation avec style fantaisiste */}
      <SidebarContent className="p-2 sidebar-gradient-bg">
        <SidebarMenu>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.name} className="sidebar-menu-item">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={`w-full ${isActive ? 'bg-amber-600 text-white shadow-lg' : 'text-amber-100 hover:bg-amber-700 hover:text-white'}`}
                >
                  <Link 
                    href={item.href} 
                    prefetch={true}
                    onClick={handleMobileClose}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  )
}
