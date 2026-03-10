/**
 * Marketing Dashboard Sidebar Component
 * Navigation sidebar for marketing dashboard with role-based menu items
 */

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
	Home,
	Building2,
	Users,
	BarChart3,
	Settings,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Target,
	FileText,
	Bell,
	CheckCircle,
	BookOpen,
	MessageCircle,
	TimerIcon,
	Crown,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { NotificationServiceClient } from "@/lib/marketing/notification-service-client";

export interface MarketingSidebarProps {
	currentPath?: string;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
	userRole?: string;
	userName?: string;
	userEmail?: string;
	userId?: string;
}

interface NavItem {
	title: string;
	url: string;
	icon: React.ComponentType<{ className?: string }>;
	roles: string[];
}

const navItems: NavItem[] = [
	{
		title: "Dashboard",
		url: "/marketing",
		icon: Home,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
	{
		title: "My Vendors",
		url: "/marketing/my-vendors",
		icon: Building2,
		roles: ["team_member"],
	},
	{
		title: "My Tasks",
		url: "/marketing/my-tasks",
		icon: Target,
		roles: ["team_member"],
	},
	{
		title: "Tailor Storyboards",
		url: "/marketing/tailor-storyboards",
		icon: BookOpen,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
	{
		title: "Vendor Management",
		url: "/marketing/vendors",
		icon: Building2,
		roles: ["bdm"],
	},
	{
		title: "Team Management",
		url: "/marketing/team",
		icon: Users,
		roles: ["team_lead"],
	},
	{
		title: "Teams Administration",
		url: "/marketing/admin/teams",
		icon: Users,
		roles: ["super_admin"],
	},
	{
		title: "Performance",
		url: "/marketing/performance",
		icon: BarChart3,
		roles: ["super_admin", "team_lead", "bdm"],
	},
	{
		title: "Reports",
		url: "/marketing/reports",
		icon: FileText,
		roles: ["super_admin", "team_lead", "bdm"],
	},
	{
		title: "Activity Audit",
		url: "/marketing/audit",
		icon: FileText,
		roles: ["super_admin"],
	},
	{
		title: "Notifications",
		url: "/marketing/notifications",
		icon: Bell,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
	{
		title: "Product Approvals",
		url: "/marketing/approvals",
		icon: CheckCircle,
		roles: ["super_admin", "team_lead", "bdm"],
	},
	{
		title: "Vendor Approvals",
		url: "/marketing/vendor-approvals",
		icon: CheckCircle,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
	{
		title: "Agent Chat",
		url: "/marketing/agent-chat",
		icon: MessageCircle,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
	{
		title: "Collections waitlist",
		url: "/marketing/waitlists",
		icon: TimerIcon,
		roles: ["super_admin", "team_lead", "bdm"],
	},
	// VVIP Program - Unified Module - Requirements: 10.1, 10.2, 10.3, 10.4, 10.7
	{
		title: "VVIP Program",
		url: "/marketing/vvip",
		icon: Crown,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
	{
		title: "Settings",
		url: "/marketing/settings",
		icon: Settings,
		roles: ["super_admin", "team_lead", "bdm", "team_member"],
	},
];

export const MarketingSidebar: React.FC<MarketingSidebarProps> = ({
	currentPath: propPath,
	isCollapsed: propIsCollapsed,
	onToggleCollapse,
	userRole = "team_member",
	userName = "Marketing User",
	userEmail = "user@stitchesafrica.com",
	userId,
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const [internalCollapsed, setInternalCollapsed] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	// Use prop if provided, otherwise use internal state
	const isCollapsed =
		propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;
	const currentPath = propPath || pathname;

	// Load unread notification count
	useEffect(() => {
		const loadUnreadCount = async () => {
			if (!userId) return;

			try {
				const count = await NotificationServiceClient.getUnreadCount(userId);
				setUnreadCount(count);
			} catch (error) {
				console.error("Error loading unread count:", error);
			}
		};

		if (userId) {
			loadUnreadCount();
			// Refresh count every 30 seconds
			const interval = setInterval(loadUnreadCount, 30000);
			return () => clearInterval(interval);
		}
	}, [userId]);

	// Filter navigation items based on user's role
	const filteredNavItems = useMemo(() => {
		return navItems.filter((item) => item.roles.includes(userRole));
	}, [userRole]);

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
		if (path === "/marketing") {
			return currentPath === path || currentPath === "/marketing/dashboard";
		}
		// Handle VVIP unified module - all VVIP paths should highlight the single VVIP Program item
		if (path === "/marketing/vvip") {
			return currentPath?.startsWith("/marketing/vvip");
		}
		return currentPath?.startsWith(path);
	};

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			// TODO: Implement actual logout logic
			toast.success("Logged out successfully");
			router.push("/marketing/login"); // Fixed typo from 'logoin'
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
                transition-all duration-300 ease-in-out
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
						<div>
							<span className="text-lg font-bold text-gray-900">
								Stitches Africa
							</span>
							<p className="text-xs text-gray-600">Marketing Dashboard</p>
						</div>
					</div>
				)}
				{isCollapsed && (
					<div className="flex items-center justify-center w-full">
						<Image
							src="/Stitches-Africa-Logo-06.png"
							alt="SA"
							width={52}
							height={52}
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
                                        transition-colors duration-200 relative
                                        ${
																					active
																						? "bg-primary/20 text-primary font-medium"
																						: "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
																				}
                                        ${isCollapsed ? "justify-center" : ""}
                                    `}
									title={isCollapsed ? item.title : undefined}
								>
									<div className="relative">
										<Icon
											className={`${
												isCollapsed ? "w-5 h-5" : "w-5 h-5"
											} flex-shrink-0`}
										/>
										{item.title === "Notifications" && unreadCount > 0 && (
											<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
												{unreadCount > 9 ? "9+" : unreadCount}
											</span>
										)}
									</div>
									{!isCollapsed && (
										<>
											<span className="text-sm font-medium">{item.title}</span>
											{item.title === "Notifications" && unreadCount > 0 && (
												<span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
													{unreadCount > 9 ? "9+" : unreadCount}
												</span>
											)}
										</>
									)}
									{active && !isCollapsed && item.title !== "Notifications" && (
										<div className="ml-auto w-1 h-6 bg-primary rounded-full" />
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
				{!isCollapsed && (
					<div className="px-3 py-2 text-xs text-gray-600 space-y-1.5">
						<div className="font-medium text-gray-900 truncate">{userName}</div>
						<div className="truncate">{userEmail}</div>
						<div className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
							{formatRoleName(userRole)}
						</div>
					</div>
				)}

				{/* Logout Button */}
				<span
					onClick={handleLogout}
					className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        text-gray-700 hover:bg-red-50 hover:text-red-600
                        transition-colors duration-200
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
                        text-gray-700 hover:bg-gray-100 hover:text-gray-900
                        transition-colors duration-200
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
