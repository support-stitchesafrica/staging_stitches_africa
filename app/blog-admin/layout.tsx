"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	LayoutDashboard,
	Newspaper,
	Plus,
	Settings,
	Menu,
	LogOut,
	BarChart3,
	User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BlogAuthProvider, useBlogAuth } from "@/contexts/BlogAuthContext";
import { AuthGuard } from "@/components/blog-admin/auth/AuthGuard";

const navigation = [
	{
		name: "Dashboard",
		href: "/blog-admin",
		icon: LayoutDashboard,
	},
	{
		name: "All Posts",
		href: "/blog-admin/news",
		icon: Newspaper,
	},
	{
		name: "Create Post",
		href: "/blog-admin/news/create",
		icon: Plus,
		permission: "create_post" as const,
	},
	{
		name: "Users",
		href: "/blog-admin/users",
		icon: User,
		permission: "manage_users" as const,
	},
	{
		name: "Analytics",
		href: "/blog-admin/analytics",
		icon: BarChart3,
		permission: "view_analytics" as const,
	},
	{
		name: "Settings",
		href: "/blog-admin/settings",
		icon: Settings,
	},
];

const BlogAdminLayoutContent: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user, logout, hasPermission } = useBlogAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

	const handleLogout = async () => {
		await logout();
		router.push("/blog-admin/login");
	};

	const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
		<div className={cn("flex flex-col h-full", mobile ? "w-full" : "w-64")}>
			<div className="flex items-center gap-2 px-6 py-4 border-b">
				<div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
					<Newspaper className="h-4 w-4 text-white" />
				</div>
				<div>
					<h2 className="font-semibold text-lg">Stitches Africa</h2>
					<p className="text-xs text-gray-500">Blog Admin</p>
				</div>
			</div>

			<nav className="flex-1 px-4 py-6 space-y-2">
				{navigation.map((item) => {
					const isActive = pathname === item.href;
					const hasRequiredPermission =
						!item.permission || hasPermission(item.permission);

					if (!hasRequiredPermission) return null;

					return (
						<Link
							key={item.name}
							href={item.href}
							onClick={() => mobile && setSidebarOpen(false)}
							className={cn(
								"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
								isActive
									? "font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
									: "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.name}
						</Link>
					);
				})}
			</nav>

			<div className="p-4 border-t">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
						<User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium">
							{user?.firstName} {user?.lastName}
						</p>
						<p className="text-xs text-gray-500">{user?.email}</p>
						<p className="text-xs text-purple-600 dark:text-purple-400 capitalize">
							{user?.role}
						</p>
					</div>
				</div>
				<div className="space-y-2">
					<Button
						onClick={handleLogout}
						variant="outline"
						size="sm"
						className="w-full justify-start bg-transparent"
					>
						<LogOut className="h-4 w-4 mr-2" />
						Sign Out
					</Button>
				</div>
			</div>
		</div>
	);

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
						<h1 className="font-semibold">Blog Admin</h1>
					</div>
				</div>

				{/* Page Content */}
				<main className="flex-1">{children}</main>
			</div>
		</div>
	);
};

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	// Don't wrap public auth pages with BlogAuthProvider/AuthGuard logic that enforces login
	const publicPaths = ["/blog-admin/login", "/blog-admin/accept-invitation"];
	if (publicPaths.some((path) => pathname?.includes(path))) {
		// If it's the invitation page, we still want the Provider but not the Guard
		if (pathname?.includes("/blog-admin/accept-invitation")) {
			return <BlogAuthProvider>{children}</BlogAuthProvider>;
		}
		return <>{children}</>;
	}

	return (
		<BlogAuthProvider>
			<AuthGuard
				fallback={
					<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
						<div className="text-center">
							<h1 className="text-2xl font-bold mb-4">
								Blog Admin Access Required
							</h1>
							<p className="text-gray-600 mb-6">
								Please sign in to access the blog administration panel.
							</p>
							<Link href="/blog-admin/login">
								<Button>Sign In</Button>
							</Link>
						</div>
					</div>
				}
			>
				<BlogAdminLayoutContent>{children}</BlogAdminLayoutContent>
			</AuthGuard>
		</BlogAuthProvider>
	);
}
