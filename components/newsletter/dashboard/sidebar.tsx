"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Mail, Users, FileText, Send, Settings, BarChart3, LogOut, UserCog } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Dashboard", href: "/newsletter", icon: LayoutDashboard },
  { name: "Campaigns", href: "/newsletter/campaigns", icon: Mail },
  { name: "Templates", href: "/newsletter/templates", icon: FileText },
  { name: "Subscribers", href: "/newsletter/subscribers", icon: Users },
  { name: "Users", href: "/newsletter/newsletter-users", icon: UserCog },
  { name: "Analytics", href: "/newsletter/analytics", icon: BarChart3 },
  { name: "Settings", href: "/newsletter/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { newsletterUser, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="hidden lg:flex h-full w-64 flex-col border-r border-border bg-card">
      
         {/* Header / Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/newsletter"
          className="flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-center rounded-md">
            {/* ✅ Responsive logo image */}
            <img
              src="/Stitches-Africa-Logo-06.png"
              alt="Stitches Africa Logo"
              className="h-10 w-auto sm:h-12 md:h-14 lg:h-16 object-contain"
            />
          </div>
          <span className="font-serif text-lg md:text-xl font-bold text-foreground">
            Branding
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg bg-muted p-3 hover:bg-accent transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-sm font-medium">
                  {newsletterUser?.displayName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-sm font-medium text-foreground truncate">{newsletterUser?.displayName || "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{newsletterUser?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
