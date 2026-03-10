"use client";

import { useState } from "react";
import { Bell, Search, Calendar, Menu, X } from "lucide-react";
import { FinancierSidebar } from "@/components/financier/shared/FinancierSidebar";

export default function FinancierDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const currentDate = new Date().toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric"
	});

	return (
		<div className="flex h-screen w-full bg-gray-50">
			{/* Sidebar */}
			<FinancierSidebar />

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top Navbar */}
				<header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 gap-6">
					{/* Left Section */}
					<div className="flex items-center gap-4">
						{/* Mobile Menu Toggle */}
						<button
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
						>
							{mobileMenuOpen ? (
								<X className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
							) : (
								<Menu className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
							)}
						</button>

						{/* Date Display */}
						<div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
							<Calendar className="w-4 h-4" strokeWidth={2.5} />
							<span className="font-medium">{currentDate}</span>
						</div>
					</div>

					{/* Center - Search Bar */}
					<div className="flex-1 max-w-2xl hidden lg:block">
						<div className="relative">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2.5} />
							<input
								type="text"
								placeholder="Search loans, users, transactions..."
								className="w-full h-10 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
							/>
						</div>
					</div>

					{/* Right Section */}
					<div className="flex items-center gap-4">
						{/* Notifications */}
						<div className="relative p-2 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors group">
							<Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" strokeWidth={2.5} />
							{/* Notification Dot with Ping Animation */}
							<span className="absolute top-1.5 right-1.5 flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
							</span>
						</div>

						{/* Quick Stats */}
						<div className="hidden xl:flex items-center gap-6 pl-6 ml-2 border-l border-gray-200">
							<div className="flex flex-col">
								<span className="text-xs font-medium text-gray-500">Active Loans</span>
								<span className="text-sm font-bold text-gray-900">312</span>
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-medium text-gray-500">Pending</span>
								<span className="text-sm font-bold text-blue-600">5</span>
							</div>
						</div>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-auto">
					<div className="px-6 py-8 max-w-7xl mx-auto w-full">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
