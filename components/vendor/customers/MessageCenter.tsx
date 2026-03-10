"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	MessageSquare,
	Send,
	Search,
	Filter,
	Clock,
	CheckCheck,
	User,
	ShoppingBag,
	MapPin,
	TrendingUp,
	AlertCircle
} from "lucide-react";
import { AnonymizedCustomer, CustomerSegment } from "@/types/vendor-analytics";
import { cn } from "@/lib/utils";
import { formatUSD } from "@/lib/utils/currency";

interface Message {
	id: string;
	customerId: string;
	subject: string;
	preview: string;
	content: string;
	timestamp: Date;
	isRead: boolean;
	status: 'pending' | 'replied' | 'resolved';
	category: 'order' | 'product' | 'general' | 'complaint';
}

interface MessageCenterProps {
	vendorId: string;
	customers: AnonymizedCustomer[];
}

export function MessageCenter({ vendorId, customers }: MessageCenterProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
	const [selectedCustomer, setSelectedCustomer] = useState<AnonymizedCustomer | null>(null);
	const [replyText, setReplyText] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'replied' | 'resolved'>('all');
	const [filterCategory, setFilterCategory] = useState<'all' | Message['category']>('all');
	const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');

	// Mock messages for demonstration
	useEffect(() => {
		// In a real implementation, fetch messages from Firestore
		const mockMessages: Message[] = customers.slice(0, 10).map((customer, index) => ({
			id: `msg-${index}`,
			customerId: customer.customerId,
			subject: getRandomSubject(index),
			preview: getRandomPreview(index),
			content: getRandomContent(index),
			timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
			isRead: Math.random() > 0.5,
			status: ['pending', 'replied', 'resolved'][Math.floor(Math.random() * 3)] as Message['status'],
			category: ['order', 'product', 'general', 'complaint'][Math.floor(Math.random() * 4)] as Message['category']
		}));

		setMessages(mockMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
	}, [customers]);

	const getRandomSubject = (index: number): string => {
		const subjects = [
			"Question about order delivery",
			"Product sizing inquiry",
			"Request for custom design",
			"Issue with recent order",
			"Feedback on product quality",
			"Inquiry about bulk orders",
			"Question about return policy",
			"Request for product availability",
			"Compliment on service",
			"Question about payment options"
		];
		return subjects[index % subjects.length];
	};

	const getRandomPreview = (index: number): string => {
		const previews = [
			"Hi, I wanted to check on the status of my order...",
			"Could you provide more details about the sizing...",
			"I'm interested in a custom design for...",
			"I received my order but there seems to be...",
			"Just wanted to say the quality is excellent...",
			"I'm planning to order in bulk, can we discuss...",
			"What is your policy on returns and exchanges...",
			"Is this product currently in stock...",
			"Thank you for the wonderful service...",
			"Do you accept installment payments..."
		];
		return previews[index % previews.length];
	};

	const getRandomContent = (index: number): string => {
		const contents = [
			"Hi, I wanted to check on the status of my order. It's been a few days and I haven't received any updates. Could you please let me know when I can expect delivery?",
			"Could you provide more details about the sizing for this product? I want to make sure I order the right size. What are your recommendations?",
			"I'm interested in a custom design for a special event. Do you offer custom tailoring services? If so, what's the process and timeline?",
			"I received my order but there seems to be an issue with the quality. One of the items has a defect. How can we resolve this?",
			"Just wanted to say the quality is excellent! I'm very satisfied with my purchase and will definitely order again. Keep up the great work!",
			"I'm planning to order in bulk for my boutique. Can we discuss pricing and delivery options for large orders?",
			"What is your policy on returns and exchanges? I may need to return an item that doesn't fit properly.",
			"Is this product currently in stock? I'd like to place an order but want to confirm availability first.",
			"Thank you for the wonderful service! The delivery was fast and the product quality exceeded my expectations.",
			"Do you accept installment payments? I'm interested in purchasing multiple items but would prefer to pay in installments."
		];
		return contents[index % contents.length];
	};

	const handleSelectMessage = (message: Message) => {
		setSelectedMessage(message);
		const customer = customers.find(c => c.customerId === message.customerId);
		setSelectedCustomer(customer || null);
		
		// Mark as read
		if (!message.isRead) {
			setMessages(prev => prev.map(m => 
				m.id === message.id ? { ...m, isRead: true } : m
			));
		}
	};

	const handleSendReply = () => {
		if (!replyText.trim() || !selectedMessage) return;

		// In a real implementation, send message to Firestore
		console.log('Sending reply:', {
			messageId: selectedMessage.id,
			customerId: selectedMessage.customerId,
			reply: replyText
		});

		// Update message status
		setMessages(prev => prev.map(m => 
			m.id === selectedMessage.id ? { ...m, status: 'replied' } : m
		));

		setReplyText("");
		// Show success toast
	};

	const handleResolve = () => {
		if (!selectedMessage) return;

		setMessages(prev => prev.map(m => 
			m.id === selectedMessage.id ? { ...m, status: 'resolved' } : m
		));

		setSelectedMessage(prev => prev ? { ...prev, status: 'resolved' } : null);
	};

	const filteredMessages = messages.filter(message => {
		const matchesSearch = message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
			message.preview.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
		const matchesCategory = filterCategory === 'all' || message.category === filterCategory;
		return matchesSearch && matchesStatus && matchesCategory;
	});

	const unreadCount = messages.filter(m => !m.isRead).length;
	const pendingCount = messages.filter(m => m.status === 'pending').length;

	const getStatusColor = (status: Message['status']) => {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'replied':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'resolved':
				return 'bg-green-100 text-green-800 border-green-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	};

	const getCategoryIcon = (category: Message['category']) => {
		switch (category) {
			case 'order':
				return <ShoppingBag className="h-3 w-3" />;
			case 'product':
				return <MessageSquare className="h-3 w-3" />;
			case 'complaint':
				return <AlertCircle className="h-3 w-3" />;
			default:
				return <MessageSquare className="h-3 w-3" />;
		}
	};

	const getSegmentColor = (segment: CustomerSegment['type']) => {
		switch (segment) {
			case 'new':
				return 'text-blue-600 bg-blue-50';
			case 'returning':
				return 'text-green-600 bg-green-50';
			case 'frequent':
				return 'text-purple-600 bg-purple-50';
			case 'high-value':
				return 'text-amber-600 bg-amber-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
			{/* Messages List */}
			<Card className="lg:col-span-1 border-gray-200 flex flex-col">
				<CardHeader className="pb-3 border-b border-gray-100">
					<div className="flex items-center justify-between mb-4">
						<div>
							<CardTitle className="text-lg">Messages</CardTitle>
							<CardDescription className="text-sm">
								{unreadCount} unread, {pendingCount} pending
							</CardDescription>
						</div>
					</div>

					{/* Search */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Search messages..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 bg-gray-50 border-gray-200"
						/>
					</div>

					{/* Filters */}
					<div className="flex gap-2 mt-3">
						<Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
							<SelectTrigger className="flex-1 h-9 text-sm">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="replied">Replied</SelectItem>
								<SelectItem value="resolved">Resolved</SelectItem>
							</SelectContent>
						</Select>

						<Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}>
							<SelectTrigger className="flex-1 h-9 text-sm">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								<SelectItem value="order">Orders</SelectItem>
								<SelectItem value="product">Products</SelectItem>
								<SelectItem value="general">General</SelectItem>
								<SelectItem value="complaint">Complaints</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<CardContent className="flex-1 overflow-y-auto p-0">
					<div className="divide-y divide-gray-100">
						{filteredMessages.length === 0 ? (
							<div className="p-8 text-center text-gray-500">
								<MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
								<p className="text-sm">No messages found</p>
							</div>
						) : (
							filteredMessages.map((message) => (
								<button
									key={message.id}
									onClick={() => handleSelectMessage(message)}
									className={cn(
										"w-full p-4 text-left hover:bg-gray-50 transition-colors",
										selectedMessage?.id === message.id && "bg-blue-50 hover:bg-blue-50",
										!message.isRead && "bg-blue-50/30"
									)}
								>
									<div className="flex items-start justify-between mb-2">
										<div className="flex items-center gap-2">
											<Avatar className="h-8 w-8">
												<AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white text-xs">
													{message.customerId.substring(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className={cn(
													"text-sm truncate",
													!message.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"
												)}>
													Customer {message.customerId.substring(0, 8)}
												</p>
											</div>
										</div>
										{!message.isRead && (
											<div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
										)}
									</div>

									<p className={cn(
										"text-sm mb-2 truncate",
										!message.isRead ? "font-medium text-gray-900" : "text-gray-700"
									)}>
										{message.subject}
									</p>

									<p className="text-xs text-gray-500 mb-2 line-clamp-2">
										{message.preview}
									</p>

									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className={cn("text-xs", getStatusColor(message.status))}>
												{message.status}
											</Badge>
											<Badge variant="outline" className="text-xs">
												{getCategoryIcon(message.category)}
												<span className="ml-1 capitalize">{message.category}</span>
											</Badge>
										</div>
										<span className="text-xs text-gray-400 flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatTimestamp(message.timestamp)}
										</span>
									</div>
								</button>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* Message Detail & Reply */}
			<Card className="lg:col-span-2 border-gray-200 flex flex-col">
				{selectedMessage && selectedCustomer ? (
					<>
						<CardHeader className="pb-4 border-b border-gray-100">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4">
									<Avatar className="h-12 w-12">
										<AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
											{selectedMessage.customerId.substring(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<CardTitle className="text-lg mb-1">{selectedMessage.subject}</CardTitle>
										<div className="flex items-center gap-3 text-sm text-gray-600">
											<span className="flex items-center gap-1">
												<User className="h-3 w-3" />
												Customer {selectedMessage.customerId.substring(0, 8)}
											</span>
											<span className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{formatFullTimestamp(selectedMessage.timestamp)}
											</span>
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="outline" className={cn("text-xs", getStatusColor(selectedMessage.status))}>
										{selectedMessage.status}
									</Badge>
									{selectedMessage.status !== 'resolved' && (
										<Button
											size="sm"
											variant="outline"
											onClick={handleResolve}
											className="text-xs"
										>
											<CheckCheck className="h-3 w-3 mr-1" />
											Mark Resolved
										</Button>
									)}
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex-1 overflow-y-auto p-6">
							<div className="space-y-6">
								{/* Customer Info Card */}
								<Card className="bg-gray-50 border-gray-200">
									<CardContent className="p-4">
										<h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<p className="text-gray-600 mb-1">Segment</p>
												<Badge className={cn("text-xs capitalize", getSegmentColor(selectedCustomer.segment))}>
													{selectedCustomer.segment}
												</Badge>
											</div>
											<div>
												<p className="text-gray-600 mb-1">Location</p>
												<p className="text-gray-900 flex items-center gap-1">
													<MapPin className="h-3 w-3" />
													{selectedCustomer.location.city}, {selectedCustomer.location.state}
												</p>
											</div>
											<div>
												<p className="text-gray-600 mb-1">Total Orders</p>
												<p className="text-gray-900 flex items-center gap-1">
													<ShoppingBag className="h-3 w-3" />
													{selectedCustomer.orderCount}
												</p>
											</div>
											<div>
												<p className="text-gray-600 mb-1">Lifetime Value</p>
												<p className="text-gray-900 flex items-center gap-1">
													<TrendingUp className="h-3 w-3" />
													{formatUSD(selectedCustomer.lifetimeValue)}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Message Content */}
								<div>
									<h4 className="text-sm font-semibold text-gray-900 mb-3">Message</h4>
									<div className="bg-white border border-gray-200 rounded-lg p-4">
										<p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
									</div>
								</div>

								{/* Reply Section */}
								<div>
									<h4 className="text-sm font-semibold text-gray-900 mb-3">Reply</h4>
									<Textarea
										placeholder="Type your reply here... (Customer identity remains anonymous)"
										value={replyText}
										onChange={(e) => setReplyText(e.target.value)}
										className="min-h-[120px] mb-3 resize-none"
									/>
									<div className="flex items-center justify-between">
										<p className="text-xs text-gray-500">
											<AlertCircle className="h-3 w-3 inline mr-1" />
											All customer data is anonymized for privacy
										</p>
										<Button
											onClick={handleSendReply}
											disabled={!replyText.trim()}
											className="bg-gray-900 hover:bg-gray-800"
										>
											<Send className="h-4 w-4 mr-2" />
											Send Reply
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</>
				) : (
					<CardContent className="flex-1 flex items-center justify-center">
						<div className="text-center text-gray-500">
							<MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
							<p className="text-lg font-medium mb-2">No message selected</p>
							<p className="text-sm">Select a message from the list to view and reply</p>
						</div>
					</CardContent>
				)}
			</Card>
		</div>
	);
}

function formatTimestamp(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString();
}

function formatFullTimestamp(date: Date): string {
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}
