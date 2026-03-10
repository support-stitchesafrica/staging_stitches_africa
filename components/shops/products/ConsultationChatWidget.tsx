"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X, MessageCircle, User, Phone, Mail, Minimize2, Maximize2 } from "lucide-react";
import { agentChatService } from "@/lib/agent-chat/agent-chat-service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AgentChatSession, AgentChatMessage } from "@/types/agent-chat";

interface ConsultationChatWidgetProps {
	productId: string;
	productName: string;
	isOpen: boolean;
	onClose: () => void;
}

interface UserInfo {
	name: string;
	email: string;
	phone: string;
}

export function ConsultationChatWidget({
	productId,
	productName,
	isOpen,
	onClose,
}: ConsultationChatWidgetProps) {
	const { user } = useAuth();
	const [isMinimized, setIsMinimized] = useState(false);
	const [step, setStep] = useState<"form" | "chat">("form");
	const [userInfo, setUserInfo] = useState<UserInfo>({
		name: "",
		email: "",
		phone: "",
	});
	const [message, setMessage] = useState("");
	const [session, setSession] = useState<AgentChatSession | null>(null);
	const [messages, setMessages] = useState<AgentChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Generate a unique storage key for this product's consultation
	const getStorageKey = () => `consultation_session_${productId}`;

	// Load existing session from localStorage on mount
	useEffect(() => {
		if (!isOpen) return;

		const storageKey = getStorageKey();
		const savedSessionId = localStorage.getItem(storageKey);

		if (savedSessionId) {
			console.log('[ConsultationWidget] Found saved session:', savedSessionId);
			agentChatService.getAgentSession(savedSessionId).then(async (savedSession) => {
				if (savedSession && savedSession.status !== 'closed') {
					console.log('[ConsultationWidget] Resuming session:', savedSession.id);
					setSession(savedSession);
					setStep("chat");
					setUserInfo({
						name: savedSession.userName || "",
						email: savedSession.userEmail || "",
						phone: savedSession.userPhone || "",
					});
					// Load existing messages immediately
					try {
						const existingMessages = await agentChatService.getSessionMessages(savedSession.id);
						console.log('[ConsultationWidget] Loaded existing messages:', existingMessages.length);
						setMessages(existingMessages);
					} catch (error) {
						console.error('[ConsultationWidget] Error loading messages:', error);
					}
				} else {
					console.log('[ConsultationWidget] Saved session is closed or not found, clearing');
					localStorage.removeItem(storageKey);
				}
			}).catch((error) => {
				console.error('[ConsultationWidget] Error loading saved session:', error);
				localStorage.removeItem(storageKey);
			});
		}
	}, [isOpen, productId]);

	// Auto-scroll to bottom when messages update
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	// Subscribe to session messages
	useEffect(() => {
		if (!session?.id) {
			console.log('[ConsultationWidget] No session ID, skipping subscription');
			return;
		}

		console.log('[ConsultationWidget] Subscribing to messages for session:', session.id);
		const unsubscribe = agentChatService.subscribeToSessionMessages(
			session.id,
			(sessionMessages) => {
				console.log('[ConsultationWidget] Received messages update:', sessionMessages.length, 'messages');
				setMessages(sessionMessages);
			}
		);

		return () => {
			console.log('[ConsultationWidget] Unsubscribing from session:', session.id);
			unsubscribe();
		};
	}, [session?.id]);

	// Pre-fill user info if logged in
	useEffect(() => {
		if (user) {
			setUserInfo((prev) => ({
				...prev,
				name: user.displayName || prev.name,
				email: user.email || prev.email,
			}));
		}
	}, [user]);

	const handleStartChat = async () => {
		if (!userInfo.name.trim() || !userInfo.email.trim()) {
			toast.error("Please enter your name and email");
			return;
		}

		if (!userInfo.email.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}

		setIsLoading(true);
		try {
			console.log('[ConsultationWidget] Starting chat session...');
			// Create a new agent chat session
			const sessionId = `consultation-${productId}-${Date.now()}`;
			console.log('[ConsultationWidget] Creating session with ID:', sessionId);
			
			const newSession = await agentChatService.createAgentSession(
				sessionId,
				user?.uid || `guest-${Date.now()}`,
				{
					name: userInfo.name,
					email: userInfo.email,
					phone: userInfo.phone,
				},
				[]
			);
			console.log('[ConsultationWidget] Session created:', newSession.id);

			// Add initial message about the consultation (for agents only)
			const consultationDetails = [
				`📋 CONSULTATION REQUEST`,
				``,
				`Product: ${productName}`,
				`Product ID: ${productId}`,
				``,
				`Customer Name: ${userInfo.name}`,
				`Customer Email: ${userInfo.email}`,
				`Customer Phone: ${userInfo.phone || 'Not provided'}`,
				``,
				`Initial Message:`,
				`${message || 'No initial message provided'}`,
			].join('\n');

			const initialMessage = await agentChatService.addMessage(newSession.id, {
				role: "system",
				content: consultationDetails,
				messageType: "handoff",
			});
			console.log('[ConsultationWidget] Initial message added:', initialMessage.id);

			// Send email notification
			await fetch("/api/consultation/email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId: newSession.id,
					productId,
					productName,
					userInfo,
					message: message || "No initial message provided",
				}),
			});

			// Save session ID to localStorage for persistence
			const storageKey = getStorageKey();
			localStorage.setItem(storageKey, newSession.id);
			console.log('[ConsultationWidget] Session saved to localStorage');

			setSession(newSession);
			setStep("chat");
			toast.success("Consultation request sent! An agent will join shortly.");
		} catch (error) {
			console.error("[ConsultationWidget] Error starting consultation:", error);
			toast.error("Failed to start consultation. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendMessage = async () => {
		if (!session?.id || !message.trim()) {
			console.log('[ConsultationWidget] Cannot send message:', { hasSession: !!session?.id, hasMessage: !!message.trim() });
			return;
		}

		setIsSending(true);
		try {
			console.log('[ConsultationWidget] Sending message to session:', session.id);
			const sentMessage = await agentChatService.addMessage(session.id, {
				role: "user",
				content: message.trim(),
				messageType: "text",
			});
			console.log('[ConsultationWidget] Message sent:', sentMessage.id);
			setMessage("");
		} catch (error) {
			console.error("[ConsultationWidget] Error sending message:", error);
			toast.error("Failed to send message");
		} finally {
			setIsSending(false);
		}
	};

	const handleClose = () => {
		setIsMinimized(false);
		setStep("form");
		setSession(null);
		setMessages([]);
		setMessage("");
		// Clear saved session from localStorage
		const storageKey = getStorageKey();
		localStorage.removeItem(storageKey);
		console.log('[ConsultationWidget] Session cleared from localStorage');
		onClose();
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	return (
		<>
			{/* Chat Widget Container */}
			{isOpen && (
				<div
					className={`fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 flex flex-col ${
						isMinimized
							? "bottom-6 w-72 h-14"
							: "bottom-6 w-[380px] h-[550px]"
					}`}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-2xl flex-shrink-0">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
								<MessageCircle className="w-4 h-4 text-white" />
							</div>
							<div className="overflow-hidden">
								<h3 className="text-sm font-semibold truncate">
									{step === "form" ? "Schedule Consultation" : "Chat with Agent"}
								</h3>
								{!isMinimized && (
									<p className="text-xs text-gray-500 truncate">
										{step === "form" ? productName : "An agent will respond shortly"}
									</p>
								)}
							</div>
						</div>
						<div className="flex items-center gap-1">
							<button
								onClick={() => setIsMinimized(!isMinimized)}
								className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
								aria-label={isMinimized ? "Maximize" : "Minimize"}
							>
								{isMinimized ? (
									<Maximize2 className="w-4 h-4 text-gray-600" />
								) : (
									<Minimize2 className="w-4 h-4 text-gray-600" />
								)}
							</button>
							<button
								onClick={handleClose}
								className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
								aria-label="Close"
							>
								<X className="w-4 h-4 text-gray-600" />
							</button>
						</div>
					</div>

					{/* Content */}
					{!isMinimized && (
						<>
							{step === "form" ? (
								<div className="flex-1 overflow-y-auto p-4 space-y-4">
									<div className="bg-muted/50 p-4 rounded-lg">
										<p className="text-sm text-muted-foreground">
											Fill in your details below and our team will get back to you
											with personalized advice about this product.
										</p>
									</div>

									<div className="space-y-2">
										<Label htmlFor="name" className="flex items-center gap-2">
											<User className="w-4 h-4" />
											Full Name *
										</Label>
										<Input
											id="name"
											placeholder="Enter your full name"
											value={userInfo.name}
											onChange={(e) =>
												setUserInfo((prev) => ({ ...prev, name: e.target.value }))
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="email" className="flex items-center gap-2">
											<Mail className="w-4 h-4" />
											Email Address *
										</Label>
										<Input
											id="email"
											type="email"
											placeholder="Enter your email address"
											value={userInfo.email}
											onChange={(e) =>
												setUserInfo((prev) => ({ ...prev, email: e.target.value }))
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="flex items-center gap-2">
											<Phone className="w-4 h-4" />
											Phone Number
										</Label>
										<Input
											id="phone"
											type="tel"
											placeholder="Enter your phone number (optional)"
											value={userInfo.phone}
											onChange={(e) =>
												setUserInfo((prev) => ({ ...prev, phone: e.target.value }))
											}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="message">Brief Message</Label>
										<Textarea
											id="message"
											placeholder="Tell us what you'd like to know about this product..."
											rows={3}
											value={message}
											onChange={(e) => setMessage(e.target.value)}
										/>
									</div>

									<Button
										onClick={handleStartChat}
										disabled={isLoading}
										className="w-full"
									>
										{isLoading ? (
											<>Starting Chat...</>
										) : (
											<>
												<MessageCircle className="w-4 h-4 mr-2" />
												Request to Speak with Agent
											</>
										)}
									</Button>
								</div>
							) : (
								<>
									<ScrollArea className="flex-1 p-4">
										<div className="space-y-4">
											{messages.filter((msg) => msg.role !== "system").length === 0 ? (
												<div className="flex flex-col items-center justify-center h-full text-center py-8">
													<MessageCircle className="w-12 h-12 text-gray-400 mb-3" />
													<p className="text-gray-600 font-medium">Consultation Started</p>
													<p className="text-sm text-gray-500 mt-1">An agent will join shortly. Start by sending a message below.</p>
												</div>
											) : (
												messages.filter((msg) => msg.role !== "system").map((msg) => (
												<div
													key={msg.id}
													className={`flex ${
														msg.role === "user" ? "justify-end" : "justify-start"
													}`}
												>
													<div
														className={`flex items-end gap-2 max-w-[80%] ${
															msg.role === "user" ? "flex-row-reverse" : ""
														}`}
													>
														<Avatar className="w-8 h-8">
															<AvatarFallback
																className={
																	msg.role === "user"
																		? "bg-primary text-primary-foreground"
																		: "bg-muted"
																}
															>
																{msg.role === "user" ? (
																	<User className="w-4 h-4" />
																) : (
																	<span className="text-xs">AG</span>
																)}
															</AvatarFallback>
														</Avatar>
														<div
															className={`rounded-lg px-4 py-2 ${
																msg.role === "user"
																	? "bg-primary text-primary-foreground"
																	: "bg-muted"
															}`}
														>
															<p className="text-sm whitespace-pre-wrap">
																{msg.content}
															</p>
															<span className="text-xs opacity-70 mt-1 block">
																{formatTime(msg.timestamp)}
															</span>
														</div>
													</div>
												</div>
											)))
											}
											<div ref={messagesEndRef} />
										</div>
									</ScrollArea>

									<div className="p-4 border-t flex-shrink-0">
										<div className="flex gap-2">
											<Textarea
												value={message}
												onChange={(e) => setMessage(e.target.value)}
												placeholder="Type your message..."
												className="flex-1 min-h-[40px] max-h-[100px] resize-none"
												onKeyDown={(e) => {
													if (e.key === "Enter" && !e.shiftKey) {
														e.preventDefault();
														handleSendMessage();
													}
												}}
											/>
											<Button
												onClick={handleSendMessage}
												disabled={!message.trim() || isSending}
												size="icon"
											>
												{isSending ? (
													<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
												) : (
													<Send className="w-4 h-4" />
												)}
											</Button>
										</div>
									</div>
								</>
							)}
						</>
					)}
				</div>
			)}
		</>
	);
}
