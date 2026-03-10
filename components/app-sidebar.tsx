"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Users, Package, Settings, ChevronUp, LogOut, User, Scissors } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getAgentProfile } from "@/agent-services/adminAuth"
import { useEffect, useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/agent/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Vendors",
    url: "/agent/dashboard/vendors",
    icon: Users,
  },
  {
    title: "Products",
    url: "/agent/dashboard/products",
    icon: Package,
  },
  {
    title: "Settings",
    url: "/agent/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
   const [profile, setProfile] = useState<any>({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
      company: "",
      website: "",
      language_preference: "en",
    })
  
    const uid = typeof window !== "undefined" ? localStorage.getItem("agentUID") : null
  
    useEffect(() => {
      const fetchProfile = async () => {
        if (!uid) return
        const res = await getAgentProfile(uid)
        if (res.success) {
          setProfile({
            ...profile,
            ...res.data
          })
        }
      }
  
      fetchProfile()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid])

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="">
                  <img src="/images/Stitches Africa Logo-05.png" alt="logo" className="w-24 h-20" />
                </div>
                <div className="grid flex-1 ms-[-25px] text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Agent Portal</span>
                  <span className="truncate text-xs text-muted-foreground">Agent Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="John Doe" />
                    <AvatarFallback className="rounded-lg">{profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile.first_name} {profile.last_name}</span>
                    <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
