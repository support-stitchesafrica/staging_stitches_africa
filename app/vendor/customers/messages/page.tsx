"use client";

import { useEffect, useState } from "react";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { MessageCenter } from "@/components/vendor/customers/MessageCenter";
import { CustomerInsightsService } from "@/lib/vendor/customer-insights-service";
import { AnonymizedCustomer, DateRange } from "@/types/vendor-analytics";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Clock, CheckCheck } from "lucide-react";

export default function CustomerMessagesPage() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [customers, setCustomers] = useState<AnonymizedCustomer[]>([]);
	const customerInsightsService = new CustomerInsightsService();

	useEffect(() => {
		if (user?.uid) {
			fetchCustomers();
		}
	}, [user]);

	const fetchCustomers = async () => {
		if (!user?.uid) return;

		setLoading(true);
		try {
			// Fetch customers from the last 90 days for message context
			const dateRange: DateRange = {
				start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
				end: new Date(),
				preset: '90days'
			};

			const result = await customerInsightsService.getAnonymizedCustomers(user.uid, dateRange);

			if (result.success && result.data) {
				setCustomers(result.data);
			} else {
				toast.error('Failed to load customer data');
			}
		} catch (error) {
			console.error('Error fetching customers:', error);
			toast.error('Failed to load customer data');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<ModernNavbar />
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* Header Skeleton */}
					<div className="mb-8">
						<div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
						<div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
					</div>

					{/* Stats Skeleton */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						{Array.from({ length: 4 }).map((_, i) => (
							<Card key={i} className="border-gray-200">
								<CardContent className="p-6">
									<div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
									<div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
									<div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
								</CardContent>
							</Card>
						))}
					</div>

					{/* Message Center Skeleton */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<Card className="lg:col-span-1 border-gray-200">
							<CardContent className="p-6">
								<div className="h-96 bg-gray-200 rounded animate-pulse" />
							</CardContent>
						</Card>
						<Card className="lg:col-span-2 border-gray-200">
							<CardContent className="p-6">
								<div className="h-96 bg-gray-200 rounded animate-pulse" />
							</CardContent>
						</Card>
					</div>
				</main>
			</div>
		);
	}

	// Calculate message stats (mock data for now)
	const totalMessages = customers.length > 0 ? Math.floor(customers.length * 0.3) : 0;
	const unreadMessages = Math.floor(totalMessages * 0.4);
	const pendingMessages = Math.floor(totalMessages * 0.5);
	const resolvedMessages = totalMessages - pendingMessages;

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Customer Messages
					</h1>
					<p className="text-gray-600 text-lg">
						Communicate with customers while maintaining their privacy and anonymity
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card className="border-gray-200">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-blue-100 rounded-lg">
									<MessageSquare className="h-5 w-5 text-blue-600" />
								</div>
							</div>
							<div className="text-2xl font-bold text-gray-900 mb-1">
								{totalMessages}
							</div>
							<p className="text-sm text-gray-600">Total Messages</p>
						</CardContent>
					</Card>

					<Card className="border-gray-200">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-amber-100 rounded-lg">
									<Clock className="h-5 w-5 text-amber-600" />
								</div>
							</div>
							<div className="text-2xl font-bold text-gray-900 mb-1">
								{unreadMessages}
							</div>
							<p className="text-sm text-gray-600">Unread Messages</p>
						</CardContent>
					</Card>

					<Card className="border-gray-200">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-purple-100 rounded-lg">
									<Users className="h-5 w-5 text-purple-600" />
								</div>
							</div>
							<div className="text-2xl font-bold text-gray-900 mb-1">
								{pendingMessages}
							</div>
							<p className="text-sm text-gray-600">Pending Replies</p>
						</CardContent>
					</Card>

					<Card className="border-gray-200">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-2 bg-green-100 rounded-lg">
									<CheckCheck className="h-5 w-5 text-green-600" />
								</div>
							</div>
							<div className="text-2xl font-bold text-gray-900 mb-1">
								{resolvedMessages}
							</div>
							<p className="text-sm text-gray-600">Resolved</p>
						</CardContent>
					</Card>
				</div>

				{/* Message Center */}
				{customers.length > 0 ? (
					<MessageCenter vendorId={user?.uid || ''} customers={customers} />
				) : (
					<Card className="border-gray-200">
						<CardContent className="p-12 text-center">
							<MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								No customers yet
							</h3>
							<p className="text-gray-600">
								Once you have customers, you'll be able to communicate with them here
							</p>
						</CardContent>
					</Card>
				)}
			</main>
		</div>
	);
}
