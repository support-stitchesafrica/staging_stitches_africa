"use client"

import { useState, useEffect } from "react";
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Package,
  History,
  CreditCard,
  Settings,
  Menu,
  LogOut,
  User,
  PanelsTopLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { logoutTailor } from "@/vendor-services/userAuth"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isTailor, setIsTailor] = useState(false)
  const [isSubTailor, setIsSubTailor] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    setIsTailor(user?.is_tailor === true)
    setIsSubTailor(user?.is_sub_tailor === true)
  }, [])

  const handleLogout = async () => {
    await logoutTailor()
    setShowLogoutModal(false)
    router.push("/vendor") // Redirect to login after logout
  }

  const baseNavigation = [
    { name: "Dashboard", href: "/vendor/dashboard", icon: Home },
    { name: "Products", href: "/vendor/products", icon: Package },
  ]

  if (isSubTailor) {
    baseNavigation.push({
      name: "Profile",
      href: "/vendor/profile",
      icon: PanelsTopLeft,
    })
  }

  const tailorOnlyNavigation = [
    { name: "Order History", href: "/vendor/orders", icon: History },
    { name: "User Management", href: "/vendor/tailors", icon: User },
    { name: "Transactions", href: "/vendor/transactions", icon: CreditCard },
    { name: "Settings", href: "/vendor/settings", icon: Settings },
  ]

  const navigation = isTailor
    ? [...baseNavigation, ...tailorOnlyNavigation]
    : baseNavigation

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="p-2 rounded-lg">
                <img
                  src="/Stitches-Africa-Logo-06.png"
                  alt="logo"
                  className="w-20 h-20"
                />
              </div>
              <span className="text-xl font-bold text-gray-900 z-10 ms-[-30px]">
                Vendor
              </span>
            </Link>

            {/* Desktop Navigation (lg and above) */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gray-200 text-gray-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-300"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Desktop Logout Button (lg and above) */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600"
                onClick={() => setShowLogoutModal(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile + Tablet Menu (up to md) */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <Link
                  href="/vendor/dashboard"
                  className="flex items-center space-x-2 mx-auto justify-center"
                >
                  <div className="p-2 rounded-lg">
                    <img
                      src="/Stitches-Africa-Logo-06.png"
                      alt="logo"
                      className="w-20 h-20"
                    />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 z-10 ms-[-30px]">
                    Vendor
                  </span>
                </Link>

                <div className="space-y-2 mt-6">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full",
                          isActive
                            ? "bg-purple-100 text-purple-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600"
                    onClick={() => {
                      setIsOpen(false)
                      setShowLogoutModal(true)
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to log out?
          </p>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
