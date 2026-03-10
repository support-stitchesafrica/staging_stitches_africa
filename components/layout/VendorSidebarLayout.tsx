'use client';

import
{
    SidebarProvider,
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import
{
    LayoutDashboard,
    Package,
    RotateCcw,
    Package2,
    BarChart3,
    FileText,
    Settings,
    HelpCircle,
    Search,
    Sun,
    Moon,
    Bell,
    LogOut
} from "lucide-react";
import { logoutAdmin } from "@/admin-services/adminAuth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { ReactNode } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import Link from "next/link";

interface SidebarLayoutProps
{
    children: ReactNode;
    pageTitle: string;
    pageDescription?: string;
}

const VendorSidebarLayout = ({ children, pageTitle, pageDescription }: SidebarLayoutProps) =>
{
    
        const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const adminName =
  typeof window !== "undefined"
    ? localStorage.getItem("adminName") || "Admin"
    : "Admin";
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() =>
    {
        const handleClickOutside = (event: MouseEvent) =>
        {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
            {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full flex-col md:flex-row">
                {/* Sidebar */}
                <Sidebar side="left" variant="sidebar" className="hidden md:flex">
                    <SidebarHeader className="border-b px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Package2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-purple-600 hidden lg:block">Stitches Africa</span>
                            <span className="text-lg font-semibold text-purple-600 lg:hidden">{adminName.slice(0, 2).toUpperCase()}</span>
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarMenu className="px-2 lg:px-4 py-2 space-y-1">
                            {[
                                { to: "/admin/vendor", icon: LayoutDashboard, label: "Dashboard" },
                                { to: "/admin/vendor/all-vendors", icon: Package, label: "All Vendors" },
                            ].map(({ to, icon: Icon, label }) => (
                                <SidebarMenuItem key={to}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={to}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${pathname === to
                                                ? "font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="">{label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>

                        <div className="mt-auto px-2 lg:px-4 pb-4">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="#"
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                    >
                                        <HelpCircle className="w-5 h-5" />
                                        <span className="hidden lg:block">Help & Support</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="flex items-center gap-3 px-3 py-3 mt-4 border-t dark:border-gray-700">
                                <div className="flex items-center gap-3 flex-1">

                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-sm font-medium">
                                            {adminName.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 hidden lg:block">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {adminName}
                                        </p>

                                    </div>
                                </div>
                                <button
                                    onClick={logoutAdmin}
                                    title="Logout"
                                    className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </SidebarContent>
                </Sidebar>

                {/* Main Content */}
                <SidebarInset className="flex-1 flex flex-col min-h-screen">
                    <header className="border-b bg-white dark:bg-gray-900 px-4 lg:px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-wrap">
                                <SidebarTrigger className="md:hidden" />
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
                                    {pageDescription && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 nd:block hidden">
                                            {pageDescription}
                                        </p>

                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
                                <div className="relative hidden sm:block max-w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="search"
                                        placeholder="Search..."
                                        className="pl-10 w-40 sm:w-64 lg:w-80 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="h-9 w-9"
                                >
                                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                </Button>

                                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                    <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                                </Button>

                                <div className="relative" ref={dropdownRef}>
                                    {/* Avatar Trigger */}
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => setIsOpen((prev) => !prev)}
                                    >
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback className="bg-purple-600 dark:bg-purple-900 text-white dark:text-purple-400 text-sm font-medium">
                                                {adminName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0 hidden lg:block">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {adminName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black/5 z-50">
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Admin
                                            </Link>
                                            <Link
                                                href="/admin/customers"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Customers
                                            </Link>
                                            <Link
                                                href="/admin/news"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                News
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 min-h-0">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default VendorSidebarLayout;
