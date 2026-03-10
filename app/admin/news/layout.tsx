"use client"

import type React from "react"

import { useState } from "react";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Newspaper, Plus, Settings, Menu, LogOut, Eye, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { auth } from "@/firebase"
import { logoutAdmin } from "@/admin-services/adminAuth"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/news",
    icon: LayoutDashboard,
  },
  {
    name: "All News",
    href: "/admin/news/news",
    icon: Newspaper,
  },
  {
    name: "Create News",
    href: "/admin/news/news/create",
    icon: Plus,
  },
  {
    name: "Analytics",
    href: "/admin/news/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/admin/news/settings",
    icon: Settings,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
})
{
   const adminName =
  typeof window !== "undefined"
    ? localStorage.getItem("adminName") || "Admin"
    : "Admin";
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full", mobile ? "w-full" : "w-64")}>
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Newspaper className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Stitches Africa</h2>
          <p className="text-xs text-gray-500">News Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) =>
        {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-sm font-medium">{adminName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{adminName}</p>
            <p className="text-xs text-gray-500">{auth.currentUser?.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
              <Eye className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <Button onClick={logoutAdmin} variant="outline" size="sm" className="w-full justify-start bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="bg-white dark:bg-gray-800 h-full">
            <Sidebar mobile />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="font-semibold">News Dashboard</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
