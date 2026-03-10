"use client";

import React, { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
	Home,
	TrendingUp,
	ShoppingCart,
	Truck,
	Users,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Bot,
	ShieldAlert,
	Store,
	Gift,
	ShoppingBag,
	BarChart3,
	Layers,
	Bell,
	MessageCircle,
	UserCheck,
	Network,
	Ticket,
} from "lucide-react";
import Image from "next/image";
import { useAtlasAuth } from "@/contexts/AtlasAuthContext";
import { toast } from "sonner";
import { ROLE_PERMISSIONS } from "@/lib/atlas/types";

export interface AnalyticsSidebarProps {
	currentPath?: string;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

interface NavItem {
	title: string;
	url: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{ title: "Overview", url: "/atlas", icon: Home },
	{ title: "Analytics", url: "/atlas/analytics", icon: BarChart3 },
	{ title: "Traffic", url: "/atlas/traffic", icon: TrendingUp },
	{ title: "Sales", url: "/atlas/vendor-sales", icon: ShoppingCart },
	{ title: "Logistics", url: "/atlas/logistics", icon: Truck },
	{ title: "AI Assistant", url: "/atlas/ai-assistant-analytics", icon: Bot },
	{ title: "Agent Chat", url: "/atlas/agent-chat", icon: MessageCircle },
	{ title: "Vendor Analytics", url: "/atlas/vendor-analytics", icon: Store },
	{ title: "BOGO Analytics", url: "/atlas/bogo-analytics", icon: Gift },
	{ title: "Free Gifts", url: "/atlas/free-gifts", icon: Gift },
	{ title: "Notifications", url: "/atlas/notification-analytics", icon: Bell },
	{
		title: "Storefront Analytics",
		url: "/atlas/storefront-analytics",
		icon: ShoppingBag,
	},
	{
		title: "Collections Analytics",
		url: "/atlas/collections-analytics",
		icon: Layers,
	},
	{
		title: "Referral Analytics",
		url: "/atlas/referral-analytics",
		icon: UserCheck,
	},
	{
		title: "Hierarchical Referral Admin",
		url: "/atlas/hierarchical-referral-admin",
		icon: Network,
	},
	{ title: "Cross Analytics", url: "/atlas/cross-analytics", icon: BarChart3 },
	{ title: "Promotionals", url: "/atlas/bogo-promotions", icon: ShieldAlert },
	{ title: "Coupons", url: "/atlas/coupons", icon: Ticket },
	{ title: "Team", url: "/atlas/team", icon: Users },
];

export const AnalyticsSidebar: React.FC<AnalyticsSidebarProps> = ({
	currentPath: propPath,
	isCollapsed: propIsCollapsed,
	onToggleCollapse,
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const { logout, atlasUser } = useAtlasAuth();
	const [internalCollapsed, setInternalCollapsed] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	// Use prop if provided, otherwise use internal state
	const isCollapsed =
		propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
	const currentPath = propPath || pathname;

	// Filter navigation items based on user's role permissions
	const filteredNavItems = useMemo(() => {
		if (!atlasUser?.role) {
			return navItems;
		}

		const userPermissions = ROLE_PERMISSIONS[atlasUser.role];
		return navItems.filter((item) =>
			userPermissions.dashboards.includes(item.url)
		);
	}, [atlasUser?.role]);

	// Format role name for display
	const formatRoleName = (role: string): string => {
		return role
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	const handleToggle = () => {
		if (onToggleCollapse) {
			onToggleCollapse();
		} else {
			setInternalCollapsed(!internalCollapsed);
		}
	};

	const isActive = (path: string) => {
		if (path === "/atlas") {
			return currentPath === path;
		}
		return currentPath?.startsWith(path);
	};

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			await logout();
			toast.success("Logged out successfully");
			router.push("/atlas/auth");
		} catch (error) {
			console.error("Logout error:", error);
			toast.error("Failed to logout. Please try again.");
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<aside
			className={`
        bg-white border-r border-gray-200
        sidebar-transition
        flex flex-col
        h-screen sticky top-0
        ${isCollapsed ? "w-16" : "w-64"}
        overflow-y-auto
      `}
		>
			{/* Logo Section */}
			<div className="p-4 border-b border-gray-200 flex items-center justify-between">
				{!isCollapsed && (
					<div className="flex items-center gap-2">
						<Image
							src="/Stitches-Africa-Logo-06.png"
							alt="Stitches Africa"
							width={32}
							height={32}
							className="rounded"
						/>
						<span className="text-lg font-bold text-gray-900 font-ga">
							Stitches Africa
						</span>
					</div>
				)}
				{isCollapsed && (
					<div className="flex items-center justify-center w-full">
						<Image
							src="/Stitches-Africa-Logo-06.png"
							alt="SA"
							width={32}
							height={32}
							className="rounded"
						/>
					</div>
				)}
			</div>

			{/* Navigation Items */}
			<nav className="flex-1 p-2 overflow-y-auto">
				<ul className="space-y-1">
					{filteredNavItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.url);

						return (
							<li key={item.url}>
								<Link
									href={item.url}
									className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 ease-out
                      ${
												active
													? "bg-blue-50 text-blue-600 font-medium"
													: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
											}
                      ${isCollapsed ? "justify-center" : ""}
                    `}
									title={isCollapsed ? item.title : undefined}
								>
									<Icon
										className={`${
											isCollapsed ? "w-5 h-5" : "w-5 h-5"
										} flex-shrink-0`}
									/>
									{!isCollapsed && (
										<span className="text-sm font-medium">{item.title}</span>
									)}
									{active && !isCollapsed && (
										<div className="ml-auto w-1 h-6 bg-blue-600 rounded-full" />
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			{/* User Info and Logout Section */}
			<div className="p-2 border-t border-gray-200 space-y-1">
				{/* User Info */}
				{!isCollapsed && atlasUser && (
					<div className="px-3 py-2 text-xs text-gray-600 space-y-1.5">
						<div className="font-medium text-gray-900 truncate">
							{atlasUser.fullName}
						</div>
						<div className="truncate">{atlasUser.email}</div>
						{atlasUser.role && (
							<div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium">
								{formatRoleName(atlasUser.role)}
							</div>
						)}
					</div>
				)}

				{/* Logout Button */}
				<span
					onClick={handleLogout}
					className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-gray-600 hover:bg-red-50 hover:text-red-600
            transition-all duration-200 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isCollapsed ? "justify-center" : ""}
          `}
					title={isCollapsed ? "Logout" : undefined}
				>
					<LogOut className="w-5 h-5" />
					{!isCollapsed && (
						<span className="text-sm font-medium">
							{isLoggingOut ? "Logging out..." : "Logout"}
						</span>
					)}
				</span>

				{/* Collapse Toggle Button */}
				<span
					onClick={handleToggle}
					className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-gray-600 hover:bg-gray-50 hover:text-gray-900
            transition-all duration-200 ease-out
            ${isCollapsed ? "justify-center" : ""}
          `}
					title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{isCollapsed ? (
						<ChevronRight className="w-5 h-5" />
					) : (
						<>
							<ChevronLeft className="w-5 h-5" />
							<span className="text-sm font-medium">Collapse</span>
						</>
					)}
				</span>
			</div>
		</aside>
	);
};
