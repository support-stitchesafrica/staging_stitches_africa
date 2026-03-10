"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Home,
	Package,
	ShoppingBag,
	CreditCard,
	Settings,
	Menu,
	LogOut,
	User,
	Bell,
	Search,
	Plus,
	BarChart3,
	Users,
	Heart,
	Store,
	ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { logoutTailor } from "@/vendor-services/userAuth";
import { Input } from "@/components/ui/input";

export function ModernNavbar() {
	const pathname = usePathname();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [isTailor, setIsTailor] = useState(false);
	const [isSubTailor, setIsSubTailor] = useState(false);
	const [tailorName, setTailorName] = useState("Vendor");
	const [searchQuery, setSearchQuery] = useState("");

	// ✅ New states
	const [brandLogo, setBrandLogo] = useState<string | null>(null);
	const [brandName, setBrandName] = useState<string>("");
	const [tailorsName, setTailorsName] = useState<string>("");

	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		const name = localStorage.getItem("tailorName") || "Vendor";

		setIsTailor(user?.is_tailor === true);
		setIsSubTailor(user?.is_sub_tailor === true);
		setTailorName(name);

		// ✅ Set brand data
		setBrandLogo(user?.brand_logo || "/Stitches-Africa-Logo-06.png");
		setBrandName(user?.brand_name || "Stitches Africa");
		setTailorsName(user?.first_name);
	}, []);

	const handleLogout = async () => {
		await logoutTailor();
		setShowLogoutModal(false);
		router.push("/vendor");
	};

	const baseNavigation = [
		{ name: "Dashboard", href: "/vendor/dashboard", icon: Home },
		{ name: "Products", href: "/vendor/products", icon: Package },
		{ name: "Orders", href: "/vendor/orders", icon: ShoppingBag },
	];

	const tailorOnlyNavigation = [
		// { name: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
		{ name: "Storefront", href: "/vendor/storefront", icon: Store },
		{ name: "Waitlists", href: "/vendor/waitlists", icon: ListChecks },
		{ name: "Team", href: "/vendor/tailors", icon: Users },
		{ name: "Transactions", href: "/vendor/transactions", icon: CreditCard },
		{ name: "Wishlist", href: "/vendor/wishlist", icon: Heart },
		{ name: "Settings", href: "/vendor/settings", icon: Settings },
	];

	const navigation = isTailor
		? [...baseNavigation, ...tailorOnlyNavigation]
		: [
				...baseNavigation,
				{ name: "Profile", href: "/vendor/profile", icon: User },
		  ];

	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		setIsTailor(user?.is_tailor === true);
		setIsSubTailor(user?.is_sub_tailor === true);
	}, []);

	return (
		<>
			{/* Modern Navbar */}
			<nav className="border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<Link
							href="/vendor/dashboard"
							className="flex items-center space-x-3"
						>
							<div className="relative">
								<img
									src="/Stitches-Africa-Logo-06.png"
									alt="Stitches Africa"
									className="w-10 h-10 object-contain"
								/>
							</div>
							<div className="hidden sm:block">
								<span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
									Stitches Africa
								</span>
								<div className="text-xs text-gray-500 -mt-1">Vendor Portal</div>
							</div>
						</Link>

						{/* Desktop Search */}
						<div className="hidden md:flex flex-1 max-w-lg mx-8">
							<div className="relative w-full">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<Input
									type="text"
									placeholder="Search products, orders..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 pr-4 py-2 w-full bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-200 rounded-full"
								/>
							</div>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden lg:flex items-center space-x-1">
							{navigation.slice(0, 4).map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={cn(
											"flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
											isActive
												? "bg-gray-900 text-white shadow-lg"
												: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
										)}
									>
										<item.icon className="h-4 w-4" />
										<span>{item.name}</span>
									</Link>
								);
							})}
						</div>

						{/* Desktop Actions */}
						<div className="hidden lg:flex items-center space-x-4">
							{/* Quick Add Button */}
							<Button
								size="sm"
								onClick={() => router.push("/vendor/products/create")}
								className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-full px-4"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Product
							</Button>

							{/* Notifications */}
							<Button
								variant="ghost"
								size="sm"
								className="relative rounded-full"
							>
								<Bell className="h-5 w-5 text-gray-600" />
								<span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
							</Button>

							{/* Profile Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="relative h-10 w-10 rounded-full"
									>
										<Avatar className="h-12 w-12">
											<AvatarImage
												src={brandLogo || "/placeholder-avatar.jpg"}
												alt={tailorName}
											/>
											<AvatarFallback className="bg-gradient-to-r from-gray-900 to-gray-700 text-white text-lg">
												{brandName.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">
												{brandName}
											</p>
											<p className="text-xs leading-none text-muted-foreground">
												{tailorsName}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{navigation.slice(4).map((item) => (
										<DropdownMenuItem key={item.name} asChild>
											<Link href={item.href} className="flex items-center">
												<item.icon className="mr-2 h-4 w-4" />
												<span>{item.name}</span>
											</Link>
										</DropdownMenuItem>
									))}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-red-600 focus:text-red-600"
										onClick={() => setShowLogoutModal(true)}
									>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Mobile Menu */}
						<Sheet open={isOpen} onOpenChange={setIsOpen}>
							<SheetTrigger asChild className="lg:hidden">
								<Button variant="ghost" size="sm" className="rounded-full">
									<Menu className="h-5 w-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-80 p-0">
								<div className="flex flex-col h-full">
									{/* Mobile Header */}
									<div className="p-6 border-b border-gray-100">
										<div className="flex items-center space-x-3">
											<Avatar className="h-12 w-12">
												<AvatarImage
													src={brandLogo || "/placeholder-avatar.jpg"}
													alt={tailorName}
												/>
												<AvatarFallback className="bg-gradient-to-r from-gray-900 to-gray-700 text-white text-lg">
													{brandName.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-semibold text-gray-900">
													{brandName}
												</p>
												{/* <p className="text-sm text-gray-500">
                                                    {isTailor ? "Tailor" : "Sub Tailor"}
                                                </p> */}
											</div>
										</div>
									</div>

									{/* Mobile Search */}
									<div className="p-4 border-b border-gray-100">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<Input
												type="text"
												placeholder="Search..."
												className="pl-10 bg-gray-50 border-0 rounded-full"
												autoFocus={false}
												tabIndex={-1}
											/>
										</div>
									</div>

									{/* Mobile Navigation */}
									<div className="flex-1 p-4">
										<div className="space-y-2">
											{navigation.map((item) => {
												const isActive = pathname === item.href;
												return (
													<Link
														key={item.name}
														href={item.href}
														onClick={() => setIsOpen(false)}
														className={cn(
															"flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full",
															isActive
																? "bg-gray-900 text-white shadow-lg"
																: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
														)}
													>
														<item.icon className="h-5 w-5" />
														<span>{item.name}</span>
													</Link>
												);
											})}
										</div>
									</div>

									{/* Mobile Footer */}
									<div className="p-4 border-t border-gray-100">
										<Button
											variant="ghost"
											className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
											onClick={() => {
												setIsOpen(false);
												setShowLogoutModal(true);
											}}
										>
											<LogOut className="h-4 w-4 mr-3" />
											Log out
										</Button>
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</nav>

			{/* Logout Confirmation Modal */}
			<Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Sign out of your account?</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-gray-600">
						You will be redirected to the login page.
					</p>
					<DialogFooter className="mt-6">
						<Button variant="outline" onClick={() => setShowLogoutModal(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleLogout}
							className="bg-red-600 hover:bg-red-700"
						>
							Sign out
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
