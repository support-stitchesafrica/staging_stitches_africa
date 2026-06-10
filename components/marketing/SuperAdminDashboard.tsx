/**
 * Super Admin Dashboard Component
 * Comprehensive dashboard with full system overview and user management
 */

"use client";

import { useState, useEffect, useRef } from "react";
import {
	Users,
	Building2,
	TrendingUp,
	Activity,
	UserPlus,
	Settings,
	BarChart3,
	Shield,
	Clock,
	AlertTriangle,
	CheckCircle,
	XCircle,
	MoreHorizontal,
	Edit,
	Trash2,
	UserCheck,
	UserX,
	Download,
	Filter,
	Search,
	Eye,
	Plus,
	Target,
	Award,
	Zap,
	Calendar,
	Phone,
	Mail,
	ArrowUpRight,
	ArrowDownRight,
	DollarSign,
	Package,
	RefreshCw,
	Save,
	Shuffle,
} from "lucide-react";
import { useTailorsOptimized } from "@/admin-services/useTailorsOptimized";
import { useRouter } from "next/navigation";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import { AddMemberDialog } from "@/components/marketing/team/AddMemberDialog";
import {
	StatCardSkeleton,
	TableRowSkeleton,
	ChartSkeleton,
} from "@/components/marketing/SkeletonLoader";
import {
	useMarketingUsersOptimized,
	type MarketingUser,
} from "@/lib/marketing/useMarketingUsersOptimized";
import { useMarketingTeamsOptimized } from "@/lib/marketing/useMarketingTeamsOptimized";
import {
	AnalyticsDisplay,
	AnalyticsCard,
} from "@/components/marketing/AnalyticsDisplay";
import { FreeGiftAnalytics } from "@/components/marketing/analytics/FreeGiftAnalytics";
import { formatDate } from "date-fns";

interface DashboardStats {
	totalUsers: number;
	totalVendors: number;
	totalOrders: number;
	totalProducts: number;
	activeVendors: number;
	activeUsers: number;
	pendingInvitations: number;
	systemHealth: "good" | "warning" | "critical";
	totalRevenue: number;
	monthlyRevenue: number;
	monthlyGrowthRate: number;
	vendorGrowthRate: number;
	revenueGrowthRate: number;
	bdmConversionRate: number;
	averageVendorOnboardingTime: number;
}

export default function SuperAdminDashboard() {
	const {
		tailors,
		stats: tailorStats,
		loading: tailorsLoading,
		error: tailorsError,
		loadMore,
	} = useTailorsOptimized({
		initialLimit: 100, // Load more tailors to get accurate revenue data
		autoLoad: true,
	});

	// Use optimized user data hook
	const {
		users,
		stats: userStats,
		loading: usersLoading,
		error: usersError,
		refresh: refreshUsers,
	} = useMarketingUsersOptimized({
		autoLoad: true,
	});

	// Use optimized team data hook
	const {
		teams,
		stats: teamStats,
		loading: teamsLoading,
		error: teamsError,
		refresh: refreshTeams,
	} = useMarketingTeamsOptimized({
		autoLoad: true,
		includePerformance: true,
	});

	const [activeTab, setActiveTab] = useState<
		"overview" | "users" | "analytics" | "settings"
	>("overview");
	const [loading, setLoading] = useState(false); // Changed to false for faster initial render
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState<DashboardStats>({
		totalUsers: userStats.totalUsers,
		totalVendors: tailorStats.totalTailors,
		totalOrders: 0,
		totalProducts: 0,
		activeVendors: tailorStats.totalVerified,
		activeUsers: userStats.activeUsers,
		pendingInvitations: 0,
		systemHealth: "good",
		totalRevenue: 0,
		monthlyRevenue: 0,
		monthlyGrowthRate: 0,
		vendorGrowthRate: 0,
		revenueGrowthRate: 0,
		bdmConversionRate: 0,
		averageVendorOnboardingTime: 0,
	});

	const router = useRouter();
	const { refreshUser } = useMarketingAuth();
	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

	// Add this function to handle the invite user button click
	const handleInviteUser = () => {
		setIsInviteDialogOpen(true);
	};

	// Load orders for all tailors to calculate revenue
	// DISABLED: This operation is too expensive and causes page hangs
	// TODO: Move to a background job or server-side calculation
	const ordersLoadingRef = useRef(false);
	const ordersLoadedRef = useRef(false);

	useEffect(() => {
		const loadOrdersData = async () => {
			// Prevent multiple simultaneous loads
			if (ordersLoadingRef.current || ordersLoadedRef.current) return;
			if (tailors.length === 0) return;

			// TEMPORARILY DISABLED - causing page hangs
			console.log("⚠️ Orders loading is disabled to prevent page hangs");
			ordersLoadedRef.current = true;
			return;

			ordersLoadingRef.current = true;

			try {
				// Import Firestore functions
				const { collection, getDocs, collectionGroup } = await import(
					"firebase/firestore"
				);
				const { db } = await import("@/firebase");

				console.log("🔄 Loading all orders from Firestore...");

				// Get all users first
				const usersSnapshot = await getDocs(collection(db, "users_orders"));
				console.log(`Found ${usersSnapshot.size} users with orders`);

				// Fetch all orders from all users
				const allOrders: any[] = [];

				for (const userDoc of usersSnapshot.docs) {
					const userId = userDoc.id;
					const userOrdersSnapshot = await getDocs(
						collection(db, "users_orders", userId, "user_orders")
					);

					userOrdersSnapshot.docs.forEach((orderDoc) => {
						allOrders.push({
							id: orderDoc.id,
							userId,
							...orderDoc.data(),
						});
					});
				}

				console.log(
					`✅ Loaded ${allOrders.length} total orders from Firestore`
				);

				// Calculate revenue from orders
				const totalRevenue = allOrders.reduce((sum: number, order: any) => {
					return sum + (order.price || 0) * (order.quantity || 1);
				}, 0);

				// Calculate monthly revenue (last 30 days)
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const monthlyRevenue = allOrders.reduce((sum: number, order: any) => {
					const orderDate = order.created_at?.toDate
						? order.created_at.toDate()
						: order.created_at?.seconds
						? new Date(order.created_at.seconds * 1000)
						: order.created_at
						? new Date(order.created_at)
						: null;
					if (orderDate && orderDate >= thirtyDaysAgo) {
						return sum + (order.price || 0) * (order.quantity || 1);
					}
					return sum;
				}, 0);

				const totalOrders = allOrders.length;
				const totalProducts = tailors.reduce(
					(sum, tailor) => sum + (tailor.totalProducts || 0),
					0
				);

				// Calculate growth rates
				const previousMonthRevenue = totalRevenue - monthlyRevenue;
				const revenueGrowthRate =
					previousMonthRevenue > 0
						? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
						  100
						: 0;

				console.log("💰 Revenue calculation:", {
					totalOrders,
					totalRevenue: `$${totalRevenue.toFixed(2)}`,
					monthlyRevenue: `$${monthlyRevenue.toFixed(2)}`,
					revenueGrowthRate: `${revenueGrowthRate.toFixed(1)}%`,
				});

				setStats((prev) => ({
					...prev,
					totalUsers: userStats.totalUsers,
					totalVendors: tailorStats.totalTailors,
					activeVendors: tailorStats.totalTailors,
					activeUsers: userStats.activeUsers,
					systemHealth: tailorStats.totalTailors > 0 ? "good" : "warning",
					totalOrders,
					totalProducts,
					totalRevenue,
					monthlyRevenue,
					vendorGrowthRate: 0,
					revenueGrowthRate,
					monthlyGrowthRate: revenueGrowthRate,
				}));
				ordersLoadedRef.current = true;
			} catch (error) {
				console.error("❌ Error loading orders data:", error);
			} finally {
				ordersLoadingRef.current = false;
			}
		};

		// Only load once when tailors are first available
		if (tailors.length > 0) {
			loadOrdersData();
		}
	}, [tailors.length]); // Only depend on length to prevent re-running on every update

	const loadDashboardData = async () => {
		try {
			setLoading(true);

			// Get Firebase ID token
			const { auth } = await import("@/firebase");
			const currentUser = auth.currentUser;

			if (!currentUser) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			let idToken = await currentUser.getIdToken();

			// Load users and analytics in parallel for faster loading
			const [usersResponse, analyticsResponse] = await Promise.all([
				fetch("/api/marketing/users", {
					headers: { Authorization: `Bearer ${idToken}` },
				}).catch((err) => {
					console.error("Users fetch error:", err);
					return null;
				}),
				fetch("/api/marketing/analytics/organization", {
					headers: { Authorization: `Bearer ${idToken}` },
				}).catch((err) => {
					console.error("Analytics fetch error:", err);
					return null;
				}),
			]);

			// Handle analytics response
			if (analyticsResponse && analyticsResponse.ok) {
				const analyticsResult = await analyticsResponse.json();
				if (analyticsResult.success) {
					const analyticsData = analyticsResult.data;
					setStats((prev) => ({
						...prev,
						totalUsers: analyticsData?.totalUsers || prev.totalUsers,
						totalVendors: analyticsData?.totalVendors || 0,
						activeVendors: analyticsData?.activeVendors || 0,
						totalOrders: analyticsData?.totalOrders || 0,
						// totalProducts not returned by API currently, keep previous or 0
						totalRevenue: analyticsData?.totalRevenue || 0,
						monthlyRevenue: analyticsData?.monthlyRevenue || 0,
						monthlyGrowthRate: analyticsData?.monthlyGrowthRate || 0,
						vendorGrowthRate: analyticsData?.vendorGrowthRate || 0,
						revenueGrowthRate: analyticsData?.revenueGrowthRate || 0,
						bdmConversionRate: analyticsData?.bdmConversionRate || 0,
						averageVendorOnboardingTime:
							analyticsData?.averageVendorOnboardingTime || 0,
						systemHealth:
							(analyticsData?.activeVendors || 0) > 0 ? "good" : "warning",
					}));
				}
			}
		} catch (error) {
			console.error("Error loading dashboard data:", error);
			setError("Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	};

	// Show skeleton only if data is still loading on initial mount
	if (
		(tailorsLoading && tailors.length === 0) ||
		(usersLoading && users.length === 0)
	) {
		return <DashboardSkeleton />;
	}

	if (error || tailorsError || usersError) {
		return (
			<DashboardError
				error={error || tailorsError || usersError}
				onRetry={loadDashboardData}
			/>
		);
	}

	// Handle user actions (activate, deactivate, etc.)
	const handleUserAction = async (userId: string, action: string) => {
		try {
			// Implement user action logic here
			console.log(`Performing ${action} on user ${userId}`);
			// Refresh users after action
			refreshUsers();
		} catch (error) {
			console.error("Error performing user action:", error);
		}
	};

	return (
		<>
			<AddMemberDialog
				open={isInviteDialogOpen}
				onOpenChange={setIsInviteDialogOpen}
				onSuccess={() => {
					// Only refresh users, don't reload all dashboard data
					refreshUsers();
				}}
			/>

			<div className="space-y-6">
				{/* Header */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Super Admin Dashboard
						</h1>
						<p className="text-gray-600">
							Complete system overview and management
						</p>
					</div>
					<div className="flex gap-3">
						<button
							onClick={handleInviteUser}
							className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
						>
							<UserPlus className="w-4 h-4" />
							Invite User
						</button>
						<button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
							<Settings className="w-4 h-4" />
							Settings
						</button>
					</div>
				</div>
				{/* Tab Content */}
				{activeTab === "overview" && (
					<OverviewTab stats={stats} tailors={tailors} teams={teams} />
				)}

				{activeTab === "users" && (
					<UserManagementTab
						users={users}
						onUserAction={handleUserAction}
						onRefresh={refreshUsers}
					/>
				)}

				{activeTab === "settings" && <SystemSettingsTab />}
			</div>
		</>
	);
}

// Overview Tab Component
function OverviewTab({
	stats,
	tailors,
	teams,
}: {
	stats: DashboardStats;
	tailors: any[];
	teams: any[];
}) {
	// Format currency values
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	// Format percentage values
	const formatPercentage = (value: number) => {
		return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
	};

	// Determine trend color
	const getTrendColor = (value: number) => {
		if (value > 0) return "text-green-600";
		if (value < 0) return "text-red-600";
		return "text-gray-600";
	};

	const isLoading = stats.totalVendors === 0 && stats.activeVendors === 0;

	return (
		<div className="space-y-6">
			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{isLoading ? (
					<>
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
						<StatCardSkeleton />
					</>
				) : (
					<>
						<StatCard
							title="Total Revenue"
							value={formatCurrency(stats.totalRevenue)}
							subtitle="All time"
							icon={DollarSign}
							color="green"
							trend={`${formatPercentage(stats.revenueGrowthRate)} this month`}
						/>
						<StatCard
							title="Active Vendors"
							value={stats.activeVendors}
							subtitle={`${stats.totalVendors} total`}
							icon={Building2}
							color="blue"
							trend={`${formatPercentage(stats.vendorGrowthRate)} this month`}
						/>
						<StatCard
							title="Monthly Revenue"
							value={formatCurrency(stats.monthlyRevenue)}
							subtitle="Last 30 days"
							icon={TrendingUp}
							color="purple"
							trend={`${formatPercentage(
								stats.monthlyGrowthRate
							)} vs last month`}
						/>
						<StatCard
							title="Total Orders"
							value={stats.totalOrders}
							subtitle="All time"
							icon={Package}
							color="orange"
							trend={
								stats.totalOrders > 0
									? `${stats.totalVendors} vendors`
									: "No data"
							}
						/>
					</>
				)}
			</div>

			{/* Performance Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Conversion Metrics
					</h3>
					<div className="space-y-4">
						<div>
							<div className="flex justify-between mb-1">
								<span className="text-sm text-gray-600">
									BDM Conversion Rate
								</span>
								<span className="text-sm font-medium text-gray-900">
									{(stats.bdmConversionRate * 100).toFixed(1)}%
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full"
									style={{
										width: `${Math.min(100, stats.bdmConversionRate * 100)}%`,
									}}
								></div>
							</div>
						</div>
						<div>
							<div className="flex justify-between mb-1">
								<span className="text-sm text-gray-600">
									Avg. Onboarding Time
								</span>
								<span className="text-sm font-medium text-gray-900">
									{stats.averageVendorOnboardingTime.toFixed(0)} days
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-green-600 h-2 rounded-full"
									style={{
										width: `${Math.min(
											100,
											100 - (stats.averageVendorOnboardingTime / 30) * 100
										)}%`,
									}}
								></div>
							</div>
						</div>
					</div>
				</div>

				<SystemStatusCard />
				<RecentActivityCard />
			</div>

			{/* Free Gift Analytics */}
			<FreeGiftAnalytics />

			{/* Top Performing Teams */}
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-semibold text-gray-900">
						Top Performing Teams
					</h2>
					<button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
						<Eye className="w-4 h-4" />
						View All
					</button>
				</div>
				<div className="space-y-3">
					{teams && teams.length > 0 ? (
						teams
							.filter((t) => t.isActive)
							.sort(
								(a, b) =>
									(b.performance?.totalAssignments || 0) -
									(a.performance?.totalAssignments || 0)
							)
							.slice(0, 5)
							.map((team, index) => (
								<div
									key={team.id}
									className="flex items-center justify-between py-2"
								>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
											{index + 1}
										</div>
										<div>
											<p className="font-medium text-gray-900">{team.name}</p>
											<p className="text-sm text-gray-500">
												{team.performance?.memberCount || 0} members
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold text-gray-900">
											{team.performance?.totalAssignments || 0} assignments
										</p>
										<p className="text-sm text-gray-500">
											{team.performance?.conversionRate.toFixed(1) || 0}%
											conversion
										</p>
									</div>
								</div>
							))
					) : (
						<p className="text-gray-500 text-center py-4">
							No team data available
						</p>
					)}
				</div>
			</div>

			{/* Top Performing Vendors */}
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-semibold text-gray-900">
						Top Performing Vendors
					</h2>
					<button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
						<Eye className="w-4 h-4" />
						View All
					</button>
				</div>
				<div className="space-y-3">
					{tailors && tailors.length > 0 ? (
						tailors
							.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
							.slice(0, 5)
							.map((tailor, index) => (
								<div
									key={tailor.id}
									className="flex items-center justify-between py-2"
								>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
											{index + 1}
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{tailor.brand_name ||
													tailor.brandName ||
													"Unknown Brand"}
											</p>
											<p className="text-sm text-gray-500">
												{tailor.wear_specialization || "Fashion"}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold text-gray-900">
											{tailor.totalOrders || 0} orders
										</p>
										<p className="text-sm text-gray-500">
											{tailor.totalProducts || 0} products
										</p>
									</div>
								</div>
							))
					) : (
						<p className="text-gray-500 text-center py-4">
							No vendor data available
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

// User Management Tab Component
// User Management Tab Component
function UserManagementTab({
	users,
	onUserAction,
	onRefresh,
}: {
	users: MarketingUser[];
	onUserAction: (
		userId: string,
		action: "activate" | "deactivate" | "delete"
	) => void;
	onRefresh: () => void;
}) {
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState<
		"all" | "super_admin" | "team_lead" | "bdm" | "team_member"
	>("all");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "inactive"
	>("all");
	const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

	// Filter users based on search term, role, and status
	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesRole = roleFilter === "all" || user.role === roleFilter;

		const matchesStatus =
			statusFilter === "all" ||
			(statusFilter === "active" && user.isActive) ||
			(statusFilter === "inactive" && !user.isActive);

		return matchesSearch && matchesRole && matchesStatus;
	});

	// Get role counts for filter badges
	const roleCounts = {
		all: users.length,
		super_admin: users.filter((u) => u.role === "super_admin").length,
		team_lead: users.filter((u) => u.role === "team_lead").length,
		bdm: users.filter((u) => u.role === "bdm").length,
		team_member: users.filter((u) => u.role === "team_member").length,
	};

	return (
		<div className="space-y-6">
			{/* User Management Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">
						User Management
					</h2>
					<p className="text-sm text-gray-600">
						Manage all users and their permissions
					</p>
				</div>
				<div className="flex gap-3">
					<button
						onClick={onRefresh}
						className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
					>
						<RefreshCw className="w-4 h-4" />
						Refresh
					</button>
					<div className="relative">
						<button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
							<Download className="w-4 h-4" />
							Export
						</button>
					</div>
					<button
						onClick={() => setIsInviteDialogOpen(true)}
						className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
					>
						<UserPlus className="w-4 h-4" />
						Invite New User
					</button>
				</div>
			</div>

			<AddMemberDialog
				open={isInviteDialogOpen}
				onOpenChange={setIsInviteDialogOpen}
				onSuccess={onRefresh}
			/>

			{/* Filters and Search */}
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<div className="flex flex-col md:flex-row gap-4">
					{/* Search */}
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								type="text"
								placeholder="Search users by name or email..."
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>

					{/* Role Filter */}
					<div className="flex gap-2">
						{(
							["all", "super_admin", "team_lead", "bdm", "team_member"] as const
						).map((role) => (
							<button
								key={role}
								onClick={() => setRoleFilter(role)}
								className={`px-3 py-2 text-sm rounded-lg ${
									roleFilter === role
										? "bg-primary text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								{role === "all" ? "All" : role.replace("_", " ")}
								{role !== "all" && (
									<span className="ml-1 bg-white bg-opacity-20 rounded-full px-2 py-0.5">
										{roleCounts[role]}
									</span>
								)}
							</button>
						))}
					</div>

					{/* Status Filter */}
					<div className="flex gap-2">
						<button
							onClick={() => setStatusFilter("all")}
							className={`px-3 py-2 text-sm rounded-lg ${
								statusFilter === "all"
									? "bg-primary text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							All
						</button>
						<button
							onClick={() => setStatusFilter("active")}
							className={`px-3 py-2 text-sm rounded-lg flex items-center gap-1 ${
								statusFilter === "active"
									? "bg-green-100 text-green-800"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<CheckCircle className="w-4 h-4" />
							Active
						</button>
						<button
							onClick={() => setStatusFilter("inactive")}
							className={`px-3 py-2 text-sm rounded-lg flex items-center gap-1 ${
								statusFilter === "inactive"
									? "bg-red-100 text-red-800"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<XCircle className="w-4 h-4" />
							Inactive
						</button>
					</div>
				</div>
			</div>

			{/* Users Table */}
			<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
					<h3 className="text-sm font-medium text-gray-900">
						All Users ({filteredUsers.length})
					</h3>
					<div className="text-sm text-gray-500">
						Showing {Math.min(filteredUsers.length, 10)} of{" "}
						{filteredUsers.length} users
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									User
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Last Login
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredUsers.length > 0 ? (
								filteredUsers.slice(0, 10).map((user) => (
									<tr key={user.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex items-center">
												<div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
													<span className="text-sm font-medium text-white">
														{user.name.charAt(0).toUpperCase()}
													</span>
												</div>
												<div className="ml-4">
													<div className="text-sm font-medium text-gray-900">
														{user.name}
													</div>
													<div className="text-sm text-gray-500">
														{user.email}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													user.role === "super_admin"
														? "bg-red-100 text-red-800"
														: user.role === "team_lead"
														? "bg-blue-100 text-blue-800"
														: user.role === "bdm"
														? "bg-purple-100 text-purple-800"
														: "bg-gray-100 text-gray-800"
												}`}
											>
												{user.role.replace("_", " ").toUpperCase()}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
													user.isActive
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												}`}
											>
												{user.isActive ? (
													<>
														<CheckCircle className="w-3 h-3 mr-1" />
														Active
													</>
												) : (
													<>
														<XCircle className="w-3 h-3 mr-1" />
														Inactive
													</>
												)}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{user.lastLoginAt ? (
												<div className="flex items-center">
													<Clock className="w-4 h-4 mr-1" />
													{new Date(
														user.lastLoginAt.seconds * 1000
													).toLocaleDateString()}
												</div>
											) : (
												"Never"
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<UserActionsDropdown
												user={user}
												onAction={(action) => onUserAction(user.id, action)}
											/>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-4 text-center text-gray-500"
									>
										No users found matching your filters
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredUsers.length > 10 && (
					<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
						<div className="text-sm text-gray-700">
							Showing 1 to 10 of {filteredUsers.length} users
						</div>
						<div className="flex gap-2">
							<button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
								Previous
							</button>
							<button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
								Next
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// User Actions Dropdown Component
function UserActionsDropdown({
	user,
	onAction,
}: {
	user: MarketingUser;
	onAction: (action: "activate" | "deactivate" | "delete") => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="p-2 hover:bg-gray-100 rounded-lg"
			>
				<MoreHorizontal className="w-4 h-4" />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
					<div className="py-1">
						<button
							onClick={() => {
								onAction(user.isActive ? "deactivate" : "activate");
								setIsOpen(false);
							}}
							className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
						>
							{user.isActive ? (
								<>
									<UserX className="w-4 h-4 mr-2" />
									Deactivate User
								</>
							) : (
								<>
									<UserCheck className="w-4 h-4 mr-2" />
									Activate User
								</>
							)}
						</button>
						<button
							onClick={() => {
								// TODO: Open edit modal
								setIsOpen(false);
							}}
							className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
						>
							<Edit className="w-4 h-4 mr-2" />
							Edit User
						</button>
						{user.role !== "super_admin" && (
							<button
								onClick={() => {
									if (confirm("Are you sure you want to delete this user?")) {
										onAction("delete");
									}
									setIsOpen(false);
								}}
								className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete User
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// Analytics Tab Component
// Analytics Tab Component
function AnalyticsTab({
	stats,
	tailors,
}: {
	stats: DashboardStats;
	tailors: any[];
}) {
	const [activeSubTab, setActiveSubTab] = useState<"overview" | "team-members">(
		"overview"
	);

	// Apps specific formatting for this tab if needed, otherwise rely on helpers or imports
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	return (
		<div className="space-y-6">
			{/* Sub Navigation Tabs */}
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8">
					<button
						onClick={() => setActiveSubTab("overview")}
						className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
							activeSubTab === "overview"
								? "border-primary text-primary"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						<BarChart3 className="w-4 h-4" />
						Overview
					</button>
					<button
						onClick={() => setActiveSubTab("team-members")}
						className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
							activeSubTab === "team-members"
								? "border-primary text-primary"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						<Users className="w-4 h-4" />
						Team Performance
					</button>
				</nav>
			</div>

			{activeSubTab === "overview" && (
				<AnalyticsDisplay type="organization">
					{(data: any) => (
						<div className="space-y-6">
							{/* Vendor Assignment Tracking */}
							<div className="bg-white rounded-lg shadow-sm border p-6">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-lg font-semibold text-gray-900">
										Vendor Assignment Tracking
									</h3>
									<button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
										<Eye className="w-4 h-4" />
										View Details
									</button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-sm text-gray-500">Total Assignments</p>
											<div className="p-2 bg-blue-100 rounded-lg">
												<UserPlus className="w-4 h-4 text-blue-600" />
											</div>
										</div>
										<p className="text-2xl font-bold text-gray-900">1,248</p>
										<p className="text-sm text-green-600 flex items-center gap-1">
											<ArrowUpRight className="w-4 h-4" />
											+12.4% from last month
										</p>
									</div>
									<div className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-sm text-gray-500">
												Active Assignments
											</p>
											<div className="p-2 bg-green-100 rounded-lg">
												<CheckCircle className="w-4 h-4 text-green-600" />
											</div>
										</div>
										<p className="text-2xl font-bold text-gray-900">892</p>
										<p className="text-sm text-green-600 flex items-center gap-1">
											<ArrowUpRight className="w-4 h-4" />
											+8.2% from last month
										</p>
									</div>
									<div className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<p className="text-sm text-gray-500">Transfer Rate</p>
											<div className="p-2 bg-purple-100 rounded-lg">
												<Shuffle className="w-4 h-4 text-purple-600" />
											</div>
										</div>
										<p className="text-2xl font-bold text-gray-900">12.8%</p>
										<p className="text-sm text-red-600 flex items-center gap-1">
											<ArrowDownRight className="w-4 h-4" />
											-2.1% from last month
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</AnalyticsDisplay>
			)}

			{activeSubTab === "team-members" && <TeamMemberPerformanceAnalytics />}
		</div>
	);
}

// Add this new component for Team Member Performance Analytics
function TeamMemberPerformanceAnalytics() {
	const [teamMembers, setTeamMembers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedTeam, setSelectedTeam] = useState<string>("all");
	const [teams, setTeams] = useState<any[]>([]);
	const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">(
		"month"
	);

	useEffect(() => {
		loadTeamMemberPerformance();
		loadTeams();
	}, [selectedTeam, timeRange]);

	const loadTeams = async () => {
		try {
			const { auth } = await import("@/firebase");
			const currentUser = auth.currentUser;
			if (!currentUser) return;

			const idToken = await currentUser.getIdToken();
			const response = await fetch("/api/marketing/teams", {
				headers: {
					Authorization: `Bearer ${idToken}`,
				},
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setTeams(result.data);
				}
			}
		} catch (err) {
			console.error("Error loading teams:", err);
		}
	};

	const loadTeamMemberPerformance = async () => {
		try {
			setLoading(true);
			setError(null);

			const { auth } = await import("@/firebase");
			const currentUser = auth.currentUser;
			if (!currentUser) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			const idToken = await currentUser.getIdToken();

			// Build query parameters
			const params = new URLSearchParams();
			if (selectedTeam !== "all") {
				params.append("teamId", selectedTeam);
			}
			params.append("timeRange", timeRange);

			const response = await fetch(
				`/api/marketing/analytics/team-members?${params.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				}
			);

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					setTeamMembers(result.data);
				} else {
					setError(
						result.error || "Failed to load team member performance data"
					);
				}
			} else {
				setError("Failed to fetch team member performance data");
			}
		} catch (err) {
			console.error("Error loading team member performance:", err);
			setError("Failed to load team member performance data");
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
					<div className="grid grid-cols-1 gap-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="bg-white rounded-lg shadow-sm border p-6">
								<div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-6">
				<div className="flex items-center">
					<AlertTriangle className="h-5 w-5 text-red-400" />
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">
							Analytics Error
						</h3>
						<p className="mt-1 text-sm text-red-700">{error}</p>
						<button
							onClick={loadTeamMemberPerformance}
							className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header and Controls */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">
						Team Member Performance Analytics
					</h2>
					<p className="text-sm text-gray-600">
						Detailed performance metrics for all team members
					</p>
				</div>
				<div className="flex gap-3">
					<select
						value={selectedTeam}
						onChange={(e) => setSelectedTeam(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						<option value="all">All Teams</option>
						{teams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</select>
					<select
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value as any)}
						className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						<option value="week">Last Week</option>
						<option value="month">Last Month</option>
						<option value="quarter">Last Quarter</option>
					</select>
					<button
						onClick={loadTeamMemberPerformance}
						className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
					>
						<RefreshCw className="w-4 h-4" />
						Refresh
					</button>
				</div>
			</div>

			{/* Performance Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Users className="w-6 h-6 text-blue-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Members</p>
							<p className="text-2xl font-bold text-gray-900">
								{teamMembers.length}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-green-100 rounded-lg">
							<DollarSign className="w-6 h-6 text-green-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Avg. Revenue</p>
							<p className="text-2xl font-bold text-gray-900">
								{formatCurrency(
									teamMembers.reduce(
										(sum, member) => sum + (member.totalRevenue || 0),
										0
									) / Math.max(teamMembers.length, 1)
								)}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-purple-100 rounded-lg">
							<Target className="w-6 h-6 text-purple-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Avg. Score</p>
							<p className="text-2xl font-bold text-gray-900">
								{(
									teamMembers.reduce(
										(sum, member) => sum + (member.performanceScore || 0),
										0
									) / Math.max(teamMembers.length, 1)
								).toFixed(1)}
								%
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<div className="flex items-center">
						<div className="p-2 bg-orange-100 rounded-lg">
							<Package className="w-6 h-6 text-orange-600" />
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-gray-600">Total Vendors</p>
							<p className="text-2xl font-bold text-gray-900">
								{teamMembers.reduce(
									(sum, member) => sum + (member.assignedVendors || 0),
									0
								)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Team Member Performance Table */}
			<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-sm font-medium text-gray-900">
						Team Member Performance
					</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Team Member
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Team
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Role
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Vendors
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Revenue
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Performance
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Last Active
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{teamMembers.map((member) => (
								<tr key={member.id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
												<span className="text-sm font-medium text-white">
													{member.name?.charAt(0) || "U"}
												</span>
											</div>
											<div className="ml-4">
												<div className="text-sm font-medium text-gray-900">
													{member.name}
												</div>
												<div className="text-sm text-gray-500">
													{member.email}
												</div>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{member.teamName || "Unassigned"}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
											{member.role?.replace("_", " ") || "N/A"}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{member.assignedVendors || 0}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{formatCurrency(member.totalRevenue || 0)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<div className="flex items-center">
											<div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
												<div
													className="bg-primary h-2 rounded-full"
													style={{ width: `${member.performanceScore || 0}%` }}
												></div>
											</div>
											<span className="text-sm text-gray-900">
												{(member.performanceScore || 0).toFixed(1)}%
											</span>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{member.lastActive
											? formatDate(member.lastActive)
											: "Never"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{teamMembers.length === 0 && (
					<div className="text-center py-12">
						<Users className="mx-auto h-12 w-12 text-gray-400" />
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No team members found
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							No team members match the current filters.
						</p>
					</div>
				)}
			</div>

			{/* Performance Distribution Chart */}
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Performance Distribution
				</h3>
				<div className="h-64 flex items-center justify-center">
					<div className="text-center">
						<BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
						<p className="mt-2 text-sm text-gray-500">
							Performance distribution chart will be displayed here
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

// System Settings Tab Component
function SystemSettingsTab() {
	const [settings, setSettings] = useState({
		emailNotifications: true,
		smsNotifications: false,
		vendorAssignmentAlerts: true,
		performanceReports: true,
		autoAssignVendors: false,
		requireTwoFactorAuth: false,
		sessionTimeout: 30,
		maxLoginAttempts: 5,
	});

	const handleSettingChange = (key: string, value: any) => {
		setSettings((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleSaveSettings = () => {
		// In a real implementation, this would save to the backend
		alert("Settings saved successfully!");
	};

	return (
		<div className="space-y-6">
			{/* Settings Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">
						System Settings
					</h2>
					<p className="text-sm text-gray-600">
						Configure system-wide preferences and policies
					</p>
				</div>
				<button
					onClick={handleSaveSettings}
					className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
				>
					<Save className="w-4 h-4" />
					Save Settings
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Notification Settings */}
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Notification Settings
					</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-gray-900">Email Notifications</p>
								<p className="text-sm text-gray-500">
									Send system notifications via email
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={settings.emailNotifications}
									onChange={(e) =>
										handleSettingChange("emailNotifications", e.target.checked)
									}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-gray-900">SMS Notifications</p>
								<p className="text-sm text-gray-500">
									Send critical alerts via SMS
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={settings.smsNotifications}
									onChange={(e) =>
										handleSettingChange("smsNotifications", e.target.checked)
									}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-gray-900">
									Vendor Assignment Alerts
								</p>
								<p className="text-sm text-gray-500">
									Notify when vendors are assigned or reassigned
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={settings.vendorAssignmentAlerts}
									onChange={(e) =>
										handleSettingChange(
											"vendorAssignmentAlerts",
											e.target.checked
										)
									}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-gray-900">Performance Reports</p>
								<p className="text-sm text-gray-500">
									Send weekly performance reports
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={settings.performanceReports}
									onChange={(e) =>
										handleSettingChange("performanceReports", e.target.checked)
									}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
					</div>
				</div>

				{/* Assignment Settings */}
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Assignment Settings
					</h3>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-gray-900">Auto-assign Vendors</p>
								<p className="text-sm text-gray-500">
									Automatically assign new vendors to team members
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={settings.autoAssignVendors}
									onChange={(e) =>
										handleSettingChange("autoAssignVendors", e.target.checked)
									}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>

						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-gray-900">
									Require Two-Factor Authentication
								</p>
								<p className="text-sm text-gray-500">
									Enforce 2FA for all users
								</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={settings.requireTwoFactorAuth}
									onChange={(e) =>
										handleSettingChange(
											"requireTwoFactorAuth",
											e.target.checked
										)
									}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>

						<div>
							<p className="font-medium text-gray-900 mb-2">
								Session Timeout (minutes)
							</p>
							<input
								type="number"
								min="1"
								max="120"
								value={settings.sessionTimeout}
								onChange={(e) =>
									handleSettingChange(
										"sessionTimeout",
										parseInt(e.target.value) || 30
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
							/>
							<p className="text-sm text-gray-500 mt-1">
								Time before user sessions expire
							</p>
						</div>

						<div>
							<p className="font-medium text-gray-900 mb-2">
								Max Login Attempts
							</p>
							<input
								type="number"
								min="1"
								max="20"
								value={settings.maxLoginAttempts}
								onChange={(e) =>
									handleSettingChange(
										"maxLoginAttempts",
										parseInt(e.target.value) || 5
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
							/>
							<p className="text-sm text-gray-500 mt-1">
								Maximum failed login attempts before lockout
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* System Information */}
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					System Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="border border-gray-200 rounded-lg p-4">
						<p className="text-sm text-gray-500">Version</p>
						<p className="font-medium text-gray-900">v2.1.4</p>
					</div>
					<div className="border border-gray-200 rounded-lg p-4">
						<p className="text-sm text-gray-500">Last Updated</p>
						<p className="font-medium text-gray-900">Nov 28, 2025</p>
					</div>
					<div className="border border-gray-200 rounded-lg p-4">
						<p className="text-sm text-gray-500">Status</p>
						<p className="font-medium text-green-600 flex items-center gap-1">
							<CheckCircle className="w-4 h-4" />
							Operational
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

// Utility Components
function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	color,
	trend,
}: {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: any;
	color: "blue" | "green" | "purple" | "orange" | "red";
	trend?: string;
}) {
	const colorClasses = {
		blue: "bg-blue-50 text-blue-600",
		green: "bg-green-50 text-green-600",
		purple: "bg-purple-50 text-purple-600",
		orange: "bg-orange-50 text-orange-600",
		red: "bg-red-50 text-red-600",
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<p className="text-sm font-medium text-gray-600">{title}</p>
					<p className="text-2xl font-bold text-gray-900">{value}</p>
					{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
					{trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
				</div>
				<div className={`p-3 rounded-full ${colorClasses[color]}`}>
					<Icon className="w-6 h-6" />
				</div>
			</div>
		</div>
	);
}

function SystemStatusCard() {
	const [systemStatus, setSystemStatus] = useState({
		database: { status: "operational", message: "All systems normal" },
		authentication: { status: "operational", message: "All systems normal" },
		emailService: { status: "operational", message: "All systems normal" },
		storage: { status: "operational", message: "All systems normal" },
		api: { status: "degraded", message: "High latency in some regions" },
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "operational":
				return "text-green-600";
			case "degraded":
				return "text-yellow-600";
			case "down":
				return "text-red-600";
			default:
				return "text-gray-600";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "operational":
				return <CheckCircle className="w-4 h-4 mr-1" />;
			case "degraded":
				return <AlertTriangle className="w-4 h-4 mr-1" />;
			case "down":
				return <XCircle className="w-4 h-4 mr-1" />;
			default:
				return <CheckCircle className="w-4 h-4 mr-1" />;
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-semibold text-gray-900">System Status</h3>
				<button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
					<RefreshCw className="w-4 h-4" />
					Refresh
				</button>
			</div>
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<span className="text-sm text-gray-600">Database</span>
						<p className="text-xs text-gray-500">Firestore database</p>
					</div>
					<span
						className={`flex items-center text-sm ${getStatusColor(
							systemStatus.database.status
						)}`}
					>
						{getStatusIcon(systemStatus.database.status)}
						{systemStatus.database.status.charAt(0).toUpperCase() +
							systemStatus.database.status.slice(1)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<span className="text-sm text-gray-600">Authentication</span>
						<p className="text-xs text-gray-500">Firebase Auth</p>
					</div>
					<span
						className={`flex items-center text-sm ${getStatusColor(
							systemStatus.authentication.status
						)}}`}
					>
						{getStatusIcon(systemStatus.authentication.status)}
						{systemStatus.authentication.status.charAt(0).toUpperCase() +
							systemStatus.authentication.status.slice(1)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<span className="text-sm text-gray-600">Email Service</span>
						<p className="text-xs text-gray-500">SendGrid integration</p>
					</div>
					<span
						className={`flex items-center text-sm ${getStatusColor(
							systemStatus.emailService.status
						)}}`}
					>
						{getStatusIcon(systemStatus.emailService.status)}
						{systemStatus.emailService.status.charAt(0).toUpperCase() +
							systemStatus.emailService.status.slice(1)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<span className="text-sm text-gray-600">Storage</span>
						<p className="text-xs text-gray-500">Cloud Storage</p>
					</div>
					<span
						className={`flex items-center text-sm ${getStatusColor(
							systemStatus.storage.status
						)}}`}
					>
						{getStatusIcon(systemStatus.storage.status)}
						{systemStatus.storage.status.charAt(0).toUpperCase() +
							systemStatus.storage.status.slice(1)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<span className="text-sm text-gray-600">API</span>
						<p className="text-xs text-gray-500">Marketing API endpoints</p>
					</div>
					<span
						className={`flex items-center text-sm ${getStatusColor(
							systemStatus.api.status
						)}}`}
					>
						{getStatusIcon(systemStatus.api.status)}
						{systemStatus.api.status.charAt(0).toUpperCase() +
							systemStatus.api.status.slice(1)}
					</span>
				</div>
			</div>
			<div className="mt-4 pt-4 border-t border-gray-200">
				<p className="text-xs text-gray-500">
					Last updated:{" "}
					{new Date().toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</p>
			</div>
		</div>
	);
}

function RecentActivityCard() {
	const [activities, setActivities] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { refreshUser } = useMarketingAuth();

	useEffect(() => {
		loadRecentActivities();
	}, []);

	const loadRecentActivities = async () => {
		try {
			setLoading(true);

			// Get Firebase ID token
			const { auth } = await import("@/firebase");
			const currentUser = auth.currentUser;

			if (!currentUser) {
				setLoading(false);
				return;
			}

			let idToken = await currentUser.getIdToken();

			// Fetch recent activity logs
			let response = await fetch("/api/marketing/activity-logs?limit=5", {
				headers: {
					Authorization: `Bearer ${idToken}`,
				},
			});

			// If we get a 401, try refreshing the token
			if (response.status === 401) {
				await refreshUser();
				idToken = await currentUser.getIdToken(true);
				response = await fetch("/api/marketing/activity-logs?limit=5", {
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				});
			}

			if (response.ok) {
				const result = await response.json();
				if (result.success && result.data) {
					setActivities(result.data);
				}
			}
		} catch (error) {
			console.error("Error loading recent activities:", error);
		} finally {
			setLoading(false);
		}
	};

	// Format time ago
	const formatTimeAgo = (timestamp: any) => {
		const date = timestamp?.seconds
			? new Date(timestamp.seconds * 1000)
			: new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 60) {
			return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
		} else {
			return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
		}
	};

	// Format action name
	const formatAction = (action: string) => {
		return action
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
				<button
					onClick={loadRecentActivities}
					className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
				>
					<RefreshCw className="w-4 h-4" />
					Refresh
				</button>
			</div>
			<div className="space-y-3">
				{loading ? (
					<div className="text-center py-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
					</div>
				) : activities.length > 0 ? (
					activities.map((activity) => (
						<div
							key={activity.id}
							className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0"
						>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900">
									{formatAction(activity.action)}
								</p>
								<p className="text-sm text-gray-600 truncate">
									{activity.entityName ||
										activity.details?.vendorName ||
										"System activity"}
								</p>
								<p className="text-xs text-gray-500 mt-1">
									by {activity.userName || "System"}
								</p>
							</div>
							<div className="ml-2 flex-shrink-0">
								<span className="text-xs text-gray-400">
									{formatTimeAgo(activity.timestamp)}
								</span>
							</div>
						</div>
					))
				) : (
					<p className="text-sm text-gray-500 text-center py-4">
						No recent activity
					</p>
				)}
			</div>
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="animate-pulse">
				<div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
				<div className="h-4 bg-gray-200 rounded w-1/2"></div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="bg-white rounded-lg shadow-sm border p-6 animate-pulse"
					>
						<div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
						<div className="h-8 bg-gray-200 rounded w-1/2"></div>
					</div>
				))}
			</div>
		</div>
	);
}

function DashboardError({
	error,
	onRetry,
}: {
	error: string | null;
	onRetry: () => void;
}) {
	return (
		<div className="bg-red-50 border border-red-200 rounded-lg p-6">
			<div className="flex items-center">
				<AlertTriangle className="h-5 w-5 text-red-400" />
				<div className="ml-3">
					<h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
					<p className="mt-1 text-sm text-red-700">{error}</p>
					<button
						onClick={onRetry}
						className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
					>
						Try again
					</button>
				</div>
			</div>
		</div>
	);
}
