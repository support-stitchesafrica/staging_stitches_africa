/**
 * AI Shopping Assistant Chat Widget
 *
 * Floating chat interface for desktop and mobile
 * Features:
 * - Floating chat button (60x60px, bottom-right)
 * - Expandable chat window (400x600px desktop, full-screen mobile)
 * - Message bubbles with timestamps
 * - Textarea input with send button
 * - Mobile responsive with full-screen mode
 * - Auto-scroll to latest messages
 * - Typing indicators
 */

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
	MessageCircle,
	X,
	Send,
	Loader2,
	Minimize2,
	User,
	Bot,
	UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/contexts/CartContext";
import { useConsultationWidget } from "@/contexts/ConsultationWidgetContext";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { VendorCard } from "./VendorCard";
import { VirtualTryOnModal } from "./VirtualTryOnModal";
import { UserCredentialsForm } from "./UserCredentialsForm";
import { agentChatService } from "@/lib/agent-chat/agent-chat-service";
import type { AvatarConfig } from "./Avatar3DViewer";
import type { Product } from "@/types";
import type { UserCredentials } from "@/types/agent-chat";
import { scrollToBottomMultiple } from "@/lib/utils/chat-scroll";
import "./chat-widget.css";

interface Vendor {
	id: string;
	name: string;
	logo?: string;
	rating: number;
	location: string;
	specialties: string[];
	yearsOfExperience: number;
	shopUrl: string;
}

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	products?: Product[];
	productIds?: string[];
	vendors?: Vendor[];
	vendorIds?: string[];
}

export function ChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const { isConsultationOpen } = useConsultationWidget();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [isLoadingSession, setIsLoadingSession] = useState(false);
	const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
	const [userPhoto, setUserPhoto] = useState<string | null>(null);
	const [userAvatar, setUserAvatar] = useState<AvatarConfig | null>(null);
	const [isClearingSession, setIsClearingSession] = useState(false);

	// Agent handoff states
	const [showAgentHandoff, setShowAgentHandoff] = useState(false);
	const [showCredentialsForm, setShowCredentialsForm] = useState(false);
	const [isHandingOff, setIsHandingOff] = useState(false);
	const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
	const [userCredentials, setUserCredentials] =
		useState<Partial<UserCredentials> | null>(null);
	const [isConnectedToAgent, setIsConnectedToAgent] = useState(false);
	const [typingUsers, setTypingUsers] = useState<
		Array<{ userId: string; role: "user" | "agent"; isTyping: boolean }>
	>([]);
	const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
		null
	);

	const { addItem } = useCart();
	const isMobile = useIsMobile();
	const scrollRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Generate or retrieve unique user identifier
	const getUniqueUserId = useCallback((): string => {
		if (typeof window === "undefined") return "";

		// Check if we already have a unique user ID
		let uniqueUserId = localStorage.getItem("ai-chat-unique-user-id");

		// If not, generate one
		if (!uniqueUserId) {
			uniqueUserId = `user_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;
			localStorage.setItem("ai-chat-unique-user-id", uniqueUserId);
		}

		return uniqueUserId;
	}, []);

	// Touch gesture state for swipe-to-close
	const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
		null
	);
	const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
		null
	);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState(0);

	// Track product mentions in conversation for AI recommendations
	const trackProductMentions = async (productIds: string[]) => {
		try {
			// Get unique user identifier
			const uniqueUserId = getUniqueUserId();

			// Track each product mention with higher weight
			const trackPromises = productIds.map((productId) =>
				fetch("/api/ai-assistant/user-preferences", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: uniqueUserId,
						productId: productId,
						interactionType: "chat_mention",
						sessionId: sessionId,
					}),
				})
			);

			await Promise.all(trackPromises);
		} catch (error) {
			console.warn("Could not track product mentions:", error);
		}
	};

	// Auto-resize textarea - disabled temporarily to fix spacebar issue
	// Will re-enable once spacebar is working
	// useEffect(() => {
	// 	if (textareaRef.current) {
	// 		textareaRef.current.style.height = "auto";
	// 		textareaRef.current.style.height = `${Math.min(
	// 			textareaRef.current.scrollHeight,
	// 			120
	// 		)}px`;
	// 	}
	// }, [input]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		// Use the utility function for consistent scrolling
		scrollToBottomMultiple([10, 50, 100, 200]);
	}, [messages, typingUsers, isLoading]);

	// Load or restore session when chat opens
	useEffect(() => {
		if (isOpen && !sessionId && !isLoadingSession) {
			loadSession();
		}
	}, [isOpen, sessionId, isLoadingSession]);

	// Handle Agent Session Subscriptions
	useEffect(() => {
		if (!agentSessionId) {
			return;
		}

		console.log("Setting up agent session subscriptions for:", agentSessionId);

		// 1. Subscribe to Messages
		const unsubscribeMessages = agentChatService.subscribeToSessionMessages(
			agentSessionId,
			(agentMessages) => {
				// Convert all messages and update state
				const allMessages = agentMessages.map((msg) => ({
					id: msg.id,
					role: (msg.role === "user" ? "user" : "assistant") as
						| "user"
						| "assistant",
					content: msg.content,
					timestamp: msg.timestamp,
				}));

				// Update messages with all current messages
				setMessages(allMessages);

				// Check if we're connected to an agent
				const hasAgentMessage = agentMessages.some(
					(msg) => msg.role === "agent"
				);
				if (hasAgentMessage) {
					setIsConnectedToAgent(true);
				}
			}
		);

		// 2. Subscribe to Session Status update
		const unsubscribeSession = agentChatService.subscribeToSessionUpdates(
			agentSessionId,
			(updatedSession) => {
				if (updatedSession && updatedSession.status === "closed") {
					handleAgentSessionClosed();
				}
			}
		);

		// 3. Subscribe to Typing Indicators
		const unsubscribeTyping = agentChatService.subscribeToTypingIndicators(
			agentSessionId,
			(typing) => {
				setTypingUsers(typing);
			}
		);

		return () => {
			console.log("Cleaning up agent session subscriptions");
			unsubscribeMessages();
			unsubscribeSession();
			unsubscribeTyping();
		};
	}, [agentSessionId]);

	// Load user avatar when chat opens
	useEffect(() => {
		if (isOpen && !userAvatar) {
			loadUserAvatar();
		}
	}, [isOpen, userAvatar]);

	// Load user avatar from API
	const loadUserAvatar = async () => {
		try {
			const response = await fetch("/api/ai-assistant/avatar");
			if (response.ok) {
				const data = await response.json();
				if (data.avatar) {
					setUserAvatar({
						height: data.avatar.profile.height,
						bodyType: data.avatar.profile.bodyType,
						skinTone: getSkinToneHex(data.avatar.profile.skinTone),
						gender: data.avatar.profile.gender,
					});
				}
			}
		} catch (error) {
			console.error("Error loading user avatar:", error);
			// Set default avatar if loading fails
			setUserAvatar({
				height: 170,
				bodyType: "average",
				skinTone: "#C68642",
				gender: "unisex",
			});
		}
	};

	// Convert skin tone name to hex color
	const getSkinToneHex = (skinTone: string): string => {
		const toneMap: Record<string, string> = {
			fair: "#F5D7C3",
			light: "#E8B89A",
			medium: "#C68642",
			tan: "#A67C52",
			brown: "#8D5524",
			dark: "#5C3317",
		};
		return toneMap[skinTone] || "#C68642";
	};

	// Load session from localStorage or create new one
	const loadSession = async () => {
		setIsLoadingSession(true);
		try {
			// Get unique user identifier
			const uniqueUserId = getUniqueUserId();

			// Check if we have a stored agent session ID first
			const storedAgentSessionId = localStorage.getItem(
				"agent-chat-session-id"
			);

			if (storedAgentSessionId) {
				console.log("Found stored agent session ID:", storedAgentSessionId);

				try {
					// Try to restore the agent session
					const agentSession = await agentChatService.getAgentSession(
						storedAgentSessionId
					);

					if (agentSession && agentSession.status !== "closed") {
						console.log("Restoring agent session:", agentSession);

						// Restore agent session
						setAgentSessionId(agentSession.id);

						// Initial load of messages
						const agentMessages = await agentChatService.getSessionMessages(
							agentSession.id
						);

						// Convert agent messages to chat messages
						const restoredMessages = agentMessages.map((msg) => ({
							id: msg.id,
							role: (msg.role === "user" ? "user" : "assistant") as
								| "user"
								| "assistant",
							content: msg.content,
							timestamp: msg.timestamp,
						}));

						if (restoredMessages.length > 0) {
							setMessages(restoredMessages);
						}

						// Check connection status
						const hasAgent = agentMessages.some((m) => m.role === "agent");
						if (hasAgent) setIsConnectedToAgent(true);

						setIsLoadingSession(false);
						return; // Exit early since we restored agent session
					} else {
						console.log(
							"Agent session not found or closed, clearing stored ID"
						);
						localStorage.removeItem("agent-chat-session-id");
					}
				} catch (agentError) {
					console.error("Error restoring agent session:", agentError);
					localStorage.removeItem("agent-chat-session-id");
				}
			}

			// Check if we have a stored regular session ID
			const storedSessionId = localStorage.getItem("ai-chat-session-id");

			if (storedSessionId) {
				// Try to restore the session
				const response = await fetch(
					`/api/ai-assistant/session?sessionId=${storedSessionId}`
				);

				if (response.ok) {
					const data = await response.json();
					setSessionId(data.session.sessionId);

					// Restore message history
					const restoredMessages = data.history.map((msg: any) => ({
						id: msg.messageId,
						role: msg.role,
						content: msg.content,
						timestamp: new Date(msg.timestamp),
					}));

					if (restoredMessages.length > 0) {
						setMessages(restoredMessages);
					} else {
						// Add welcome message if no history
						addWelcomeMessage();
					}
				} else {
					// Session expired or not found, create new one
					await createNewSession(uniqueUserId);
				}
			} else {
				// No stored session, create new one
				await createNewSession(uniqueUserId);
			}
		} catch (error) {
			console.error("Error loading session:", error);
			// Fallback: add welcome message
			addWelcomeMessage();
		} finally {
			setIsLoadingSession(false);
		}
	};

	// Create a new session
	const createNewSession = async (uniqueUserId?: string) => {
		try {
			// If uniqueUserId not provided, get it
			const userId = uniqueUserId || getUniqueUserId();

			const response = await fetch("/api/ai-assistant/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});

			if (response.ok) {
				const data = await response.json();
				setSessionId(data.session.sessionId);
				localStorage.setItem("ai-chat-session-id", data.session.sessionId);
				addWelcomeMessage();
			}
		} catch (error) {
			console.error("Error creating session:", error);
			addWelcomeMessage();
		}
	};

	// Add welcome message
	const addWelcomeMessage = () => {
		setMessages([
			{
				id: "1",
				role: "assistant",
				content:
					"Hi! I'm your AI shopping assistant. I can help you find products, recommend vendors, and show you how clothes look on you with virtual try-on. What are you looking for today?",
				timestamp: new Date(),
			},
		]);
	};

	// Handle agent handoff request
	const handleAgentHandoff = () => {
		setShowAgentHandoff(true);

		// Add message about agent handoff
		const handoffMessage: Message = {
			id: Date.now().toString(),
			role: "assistant",
			content:
				"I'd be happy to connect you with one of our relationship managers for personalized assistance. They can help with complex inquiries, custom orders, and provide expert fashion advice. Would you like to proceed?",
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, handoffMessage]);
	};

	// Handle credentials form submission
	const handleCredentialsSubmit = async (credentials: {
		name: string;
		email: string;
		phone?: string;
		location?: string;
		message?: string;
	}) => {
		setIsHandingOff(true);

		try {
			console.log("Starting agent handoff process...", {
				credentials,
				sessionId,
			});

			// Save user credentials
			const userId = getUniqueUserId();
			const userCreds: Partial<UserCredentials> = {
				userId,
				email: credentials.email,
				name: credentials.name,
				phone: credentials.phone,
				location: credentials.location,
			};

			setUserCredentials(userCreds);

			console.log("Saving user credentials...", userCreds);

			// Try to save to database for analytics (non-blocking)
			try {
				await agentChatService.saveUserCredentials(userId, userCreds);
				console.log("User credentials saved successfully");
			} catch (credentialsError) {
				console.warn(
					"Failed to save user credentials, but continuing with handoff:",
					credentialsError
				);
				// Don't block the handoff process if credentials can't be saved
			}

			console.log("Creating agent chat session...", {
				sessionId: sessionId || userId,
				userId,
				userCreds,
				messagesCount: messages.length,
			});

			// Create agent chat session with current chat history
			const agentSession = await agentChatService.createAgentSession(
				sessionId || userId,
				userId,
				userCreds,
				messages
			);

			console.log("Agent session created successfully:", agentSession);

			setAgentSessionId(agentSession.id);

			// Store agent session ID in localStorage for persistence
			localStorage.setItem("agent-chat-session-id", agentSession.id);

			// Notify support team
			console.log("Notifying support team...");
			await agentChatService.notifySupport(agentSession.id, {
				userId,
				...credentials,
				sessionId: sessionId || userId,
				chatHistory: messages.length,
			});

			// Add confirmation message
			const confirmMessage: Message = {
				id: Date.now().toString(),
				role: "assistant",
				content: `Thank you, ${credentials.name}! I've connected you with our support team. A relationship manager will join this conversation shortly to assist you personally. Your session ID is: ${agentSession.id}`,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, confirmMessage]);

			// Hide forms
			setShowCredentialsForm(false);
			setShowAgentHandoff(false);

			console.log("Agent handoff completed successfully");
		} catch (error) {
			console.error("Error during agent handoff:", error);

			const errorMessage: Message = {
				id: Date.now().toString(),
				role: "assistant",
				content:
					"I apologize, but there was an issue connecting you with our team. Please try again or contact us directly at support@stitchesafrica.com",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsHandingOff(false);
		}
	};

	// Handle agent session closure
	const handleAgentSessionClosed = useCallback(() => {
		console.log("Agent session closed");

		const currentId = localStorage.getItem("agent-chat-session-id");
		if (!currentId) return;

		// Clear agent session data
		localStorage.removeItem("agent-chat-session-id");
		setAgentSessionId(null);
		setIsConnectedToAgent(false);
		setUserCredentials(null);
		setTypingUsers([]);

		// Add a message to inform the customer
		const closureMessage: Message = {
			id: Date.now().toString(),
			role: "assistant",
			content:
				"The agent has ended this conversation. Thank you for contacting us! If you need further assistance, feel free to start a new chat.",
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, closureMessage]);
	}, []);

	// Cancel agent handoff
	const handleCancelHandoff = () => {
		setShowAgentHandoff(false);
		setShowCredentialsForm(false);

		const cancelMessage: Message = {
			id: Date.now().toString(),
			role: "assistant",
			content:
				"No problem! I'm here to help you with anything you need. What would you like to explore?",
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, cancelMessage]);
	};

	// Clear session and start fresh
	const clearSession = async () => {
		if (isClearingSession) return;

		setIsClearingSession(true);

		try {
			// Clean up typing subscription
			if (typingTimeout) {
				clearTimeout(typingTimeout);
				setTypingTimeout(null);
			}

			if (sessionId) {
				try {
					await fetch(`/api/ai-assistant/session?sessionId=${sessionId}`, {
						method: "DELETE",
					});
				} catch (error) {
					console.error("Error deleting session:", error);
				}
			}

			localStorage.removeItem("ai-chat-session-id");
			localStorage.removeItem("agent-chat-session-id");
			setSessionId(null);
			setMessages([]);
			setAgentSessionId(null);
			setIsConnectedToAgent(false);
			setUserCredentials(null);
			setShowAgentHandoff(false);
			setShowCredentialsForm(false);
			await createNewSession();
		} finally {
			setIsClearingSession(false);
		}
	};

	// Focus textarea when chat opens
	useEffect(() => {
		if (isOpen && textareaRef.current) {
			// Small delay to ensure the component is fully rendered
			setTimeout(() => {
				textareaRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Prevent body scroll when mobile chat is open
	useEffect(() => {
		if (isMobile && isOpen) {
			document.body.classList.add("chat-open");
			document.body.style.overflow = "hidden";
			document.body.style.position = "fixed";
			document.body.style.width = "100%";
			document.body.style.height = "100%";
			return () => {
				document.body.classList.remove("chat-open");
				document.body.style.overflow = "";
				document.body.style.position = "";
				document.body.style.width = "";
				document.body.style.height = "";
			};
		}
	}, [isMobile, isOpen]);

	// Cleanup component-level timers
	useEffect(() => {
		return () => {
			if (typingTimeout) {
				clearTimeout(typingTimeout);
			}
		};
	}, [typingTimeout]);

	// Touch gesture handlers for swipe-to-close on mobile
	const handleTouchStart = (e: React.TouchEvent) => {
		if (!isMobile) return;

		// Don't interfere with textarea input - check if touch target is textarea or inside it
		const target = e.target as HTMLElement;
		if (
			target.tagName === "TEXTAREA" ||
			target.closest("textarea") ||
			target.closest('[data-slot="textarea"]')
		) {
			return; // Let textarea handle its own touch events
		}

		const touch = e.touches[0];
		setTouchStart({ x: touch.clientX, y: touch.clientY });
		setTouchEnd(null);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isMobile || !touchStart) return;

		// Don't interfere with textarea input - check if touch target is textarea or inside it
		const target = e.target as HTMLElement;
		if (
			target.tagName === "TEXTAREA" ||
			target.closest("textarea") ||
			target.closest('[data-slot="textarea"]') ||
			target.closest('[aria-label="Chat message input"]')
		) {
			// Don't prevent default for textarea - let it handle all events
			return;
		}

		const touch = e.touches[0];
		setTouchEnd({ x: touch.clientX, y: touch.clientY });

		// Calculate vertical drag distance
		const deltaY = touch.clientY - touchStart.y;

		// Only allow downward swipes and only from the top portion of the screen
		if (deltaY > 0 && touchStart.y < 100) {
			setIsDragging(true);
			setDragOffset(Math.min(deltaY, 300)); // Cap at 300px
			e.preventDefault();
		}
	};

	const handleTouchEnd = () => {
		if (!isMobile || !touchStart || !touchEnd) {
			setIsDragging(false);
			setDragOffset(0);
			return;
		}

		const deltaY = touchEnd.y - touchStart.y;

		// If swiped down more than 150px, close the chat
		if (deltaY > 150) {
			setIsOpen(false);
		}

		// Reset state
		setTouchStart(null);
		setTouchEnd(null);
		setIsDragging(false);
		setDragOffset(0);
	};

	// Handle typing indicators
	const handleTypingStart = useCallback(() => {
		if (agentSessionId && isConnectedToAgent) {
			const userId = getUniqueUserId();
			agentChatService.setTypingIndicator(agentSessionId, userId, true, "user");

			// Clear existing timeout
			if (typingTimeout) {
				clearTimeout(typingTimeout);
			}

			// Set new timeout to stop typing indicator
			const timeout = setTimeout(() => {
				agentChatService.setTypingIndicator(
					agentSessionId,
					userId,
					false,
					"user"
				);
			}, 3000);

			setTypingTimeout(timeout);
		}
	}, [agentSessionId, isConnectedToAgent, typingTimeout, getUniqueUserId]);

	const handleTypingStop = useCallback(() => {
		if (agentSessionId && isConnectedToAgent) {
			const userId = getUniqueUserId();
			agentChatService.setTypingIndicator(
				agentSessionId,
				userId,
				false,
				"user"
			);

			if (typingTimeout) {
				clearTimeout(typingTimeout);
				setTypingTimeout(null);
			}
		}
	}, [agentSessionId, isConnectedToAgent, typingTimeout, getUniqueUserId]);

	const handleSend = async () => {
		// Stop typing indicator when sending
		handleTypingStop();

		// Get value directly from textarea ref to avoid state issues
		const messageText = textareaRef.current?.value?.trim() || input.trim();
		if (!messageText || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: messageText,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		// Clear textarea directly
		if (textareaRef.current) {
			textareaRef.current.value = "";
		}
		setIsLoading(true);

		try {
			// If connected to agent, send message to agent chat
			if (agentSessionId && isConnectedToAgent) {
				await agentChatService.addMessage(agentSessionId, {
					role: "user",
					content: messageText,
					messageType: "text",
				});

				// Don't call AI API when connected to agent
				setIsLoading(false);
				return;
			}

			// Use the message text we already extracted (messageText is already defined above)

			// Call API with session ID
			const response = await fetch("/api/ai-assistant/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: messageText,
					sessionId: sessionId,
				}),
			});

			const data = await response.json();

			// Update session ID if this was a new session
			if (data.sessionId && data.sessionId !== sessionId) {
				setSessionId(data.sessionId);
				localStorage.setItem("ai-chat-session-id", data.sessionId);
			}

			// Fetch product details if product IDs are present
			let products: Product[] = [];
			if (data.productIds && data.productIds.length > 0) {
				try {
					const productResponse = await fetch("/api/ai-assistant/products", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ productIds: data.productIds }),
					});

					if (productResponse.ok) {
						const productData = await productResponse.json();
						products = productData.products || [];
					}
				} catch (error) {
					console.error("Error fetching products:", error);
				}
			}

			// Get vendor cards from response (already formatted by API)
			const vendors: Vendor[] = data.vendorCards || [];

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: data.message,
				timestamp: new Date(),
				products: products.length > 0 ? products : undefined,
				productIds: data.productIds,
				vendors: vendors.length > 0 ? vendors : undefined,
				vendorIds: data.vendorIds,
			};

			setMessages((prev) => [...prev, assistantMessage]);

			// Track product mentions in conversation
			if (data.productIds && data.productIds.length > 0) {
				trackProductMentions(data.productIds);
			}

			// Show cart confirmation if items were added
			if (data.cartItemCount !== undefined) {
				const cartMessage: Message = {
					id: (Date.now() + 2).toString(),
					role: "assistant",
					content: `You now have ${data.cartItemCount} item${
						data.cartItemCount !== 1 ? "s" : ""
					} in your cart.`,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, cartMessage]);
			}
		} catch (error: any) {
			console.error("Chat error:", error);

			// Handle different error scenarios
			let errorContent =
				"Sorry, I had trouble processing that. Please try again.";

			if (
				error?.message?.includes("network") ||
				error?.message?.includes("fetch")
			) {
				errorContent =
					"I'm having trouble connecting. Please check your internet connection and try again.";
			} else if (error?.status === 429) {
				errorContent =
					"I'm getting a lot of requests right now. Please wait a moment and try again.";
			} else if (error?.status === 503) {
				errorContent =
					"My AI service is temporarily unavailable. You can browse products manually or try again in a moment.";
			}

			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: errorContent,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Only prevent default for Enter (without Shift) to send message
		// Allow ALL other keys including spacebar to work normally
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
			return;
		}

		// For spacebar and all other keys, explicitly ensure they work
		// Don't call preventDefault or stopPropagation for any other key
		// Let the browser handle spacebar input naturally
	};

	// Product card action handlers - memoized to prevent re-renders
	const handleAddToCart = useCallback(
		async (product: Product) => {
			try {
				// Check if product requires size/color selection
				const requiresSize =
					product.type === "ready-to-wear" &&
					product.rtwOptions?.sizes &&
					product.rtwOptions.sizes.length > 0;

				const requiresColor =
					product.type === "ready-to-wear" &&
					product.rtwOptions?.colors &&
					product.rtwOptions.colors.length > 0;

				if (requiresSize || requiresColor) {
					// Ask user to select options
					const optionsMessage: Message = {
						id: Date.now().toString(),
						role: "assistant",
						content: `To add "${product.title}" to your cart, I need to know:
${
	requiresSize
		? `- Size: ${
				product.rtwOptions?.sizes
					?.map((s) => (typeof s === "string" ? s : s.label))
					.join(", ") ?? ""
		  }
`
		: ""
}${
							requiresColor && product.rtwOptions?.colors
								? `- Color: ${product.rtwOptions?.colors?.join(", ") ?? ""}
`
								: ""
						}
What would you like?`,
						timestamp: new Date(),
					};
					setMessages((prev) => [...prev, optionsMessage]);
					return;
				}

				// Add to cart using the cart context
				await addItem(product, 1);

				// Trigger cart refresh by dispatching a custom event
				// This will notify the header cart to update its count
				window.dispatchEvent(new CustomEvent("cart-updated"));

				const confirmMessage: Message = {
					id: Date.now().toString(),
					role: "assistant",
					content: `Great! I've added "${product.title}" to your cart. Would you like to continue shopping or proceed to checkout?`,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, confirmMessage]);
			} catch (error) {
				console.error("Error adding to cart:", error);
				const errorMessage: Message = {
					id: Date.now().toString(),
					role: "assistant",
					content:
						"Sorry, I had trouble adding that to your cart. Please try again.",
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			}
		},
		[addItem]
	);

	const handleViewDetails = useCallback((product: Product) => {
		// Navigate to product page
		window.open(`/shops/products/${product.product_id}`, "_blank");
	}, []);

	const handleTryOn = useCallback(
		(product: Product) => {
			// Check if user has an avatar
			if (!userAvatar) {
				// Create a default avatar and open try-on modal
				const defaultAvatar: AvatarConfig = {
					height: 170,
					bodyType: "average",
					skinTone: "#C68642",
					gender: "unisex",
				};
				setUserAvatar(defaultAvatar);

				// Ask user to customize avatar
				const avatarMessage: Message = {
					id: Date.now().toString(),
					role: "assistant",
					content: `I've created a default avatar for you! You can customize it by telling me your height (in cm), body type (slim, average, athletic, plus-size), and skin tone (fair, light, medium, tan, brown, dark). For now, let's see how this looks on you!`,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, avatarMessage]);

				// Open try-on modal with default avatar
				setTryOnProduct(product);
				return;
			}

			// Open try-on modal
			setTryOnProduct(product);
		},
		[userAvatar]
	);

	// Vendor card action handlers - memoized to prevent re-renders
	const handleVisitShop = useCallback((vendorId: string, shopUrl: string) => {
		// Navigate to vendor shop page
		window.open(shopUrl, "_blank");
	}, []);

	const handleViewProducts = useCallback((vendorId: string) => {
		// Navigate to products filtered by vendor
		window.open(`/shops?vendor=${vendorId}`, "_blank");
	}, []);

	const handleCloseTryOn = useCallback(() => {
		setTryOnProduct(null);
	}, []);

	const handleAddToCartFromTryOn = useCallback(
		async (product: Product, size?: string) => {
			try {
				// Add to cart using the cart context with selected size
				await addItem(product, 1, size ? { size } : undefined);

				// Trigger cart refresh by dispatching a custom event
				// This will notify the header cart to update its count
				window.dispatchEvent(new CustomEvent("cart-updated"));

				const confirmMessage: Message = {
					id: Date.now().toString(),
					role: "assistant",
					content: `Great choice! I've added "${product.title}" ${
						size ? `(Size ${size})` : ""
					} to your cart.`,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, confirmMessage]);
			} catch (error) {
				console.error("Error adding to cart from try-on:", error);
				const errorMessage: Message = {
					id: Date.now().toString(),
					role: "assistant",
					content:
						"Sorry, I had trouble adding that to your cart. Please try again.",
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			}
		},
		[addItem]
	);

	// Floating chat button (60x60px as per design spec)
	// Hide completely if consultation widget is open
	if (isConsultationOpen) {
		return null;
	}

	if (!isOpen) {
		return (
			<div
				className={cn(
					"fixed z-50 flex items-end gap-2",
					isMobile ? "bottom-5 right-5" : "bottom-6 right-6"
				)}
			>
				{/* Popup text */}
				<div className="bg-black text-white px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300 ">
					Shop with AI
				</div>
				<button
					onClick={() => setIsOpen(true)}
					className="w-[60px] h-[60px] bg-black hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
					aria-label="Open shopping assistant"
				>
					<MessageCircle className="w-7 h-7" />
				</button>
			</div>
		);
	}

	// Chat window - full screen on mobile, 400x600px on desktop
	return (
		<>
			<div
				className={cn(
					"fixed bg-white flex flex-col z-50 border border-gray-200 shadow-2xl transition-transform",
					isMobile
						? "inset-0 w-full h-full rounded-none"
						: "bottom-6 right-6 w-[400px] h-[600px] rounded-lg",
					isDragging && isMobile && "transition-none"
				)}
				style={
					isMobile && isDragging
						? { transform: `translateY(${dragOffset}px)` }
						: undefined
				}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				{/* Header */}
				<div
					className={cn(
						"flex items-center justify-between p-4 border-b bg-black text-white",
						isMobile ? "rounded-none" : "rounded-t-lg"
					)}
				>
					{/* Swipe indicator for mobile */}
					{isMobile && (
						<div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full" />
					)}

					<div className="flex items-center gap-2">
						<MessageCircle className="w-5 h-5" />
						<div className="flex flex-col">
							<h3 className="font-semibold">
								{isConnectedToAgent ? "Live Agent Chat" : "Shopping Assistant"}
							</h3>
							{isConnectedToAgent && (
								<span className="text-xs text-green-300 flex items-center gap-1">
									<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
									Agent Online
								</span>
							)}
						</div>
					</div>
					<div className="flex items-center gap-1">
						<button
							onClick={clearSession}
							className="hover:bg-gray-700 p-1.5 rounded transition-colors touch-manipulation"
							aria-label="Clear chat"
							title="Start new conversation"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						</button>
						{!isMobile && (
							<button
								onClick={() => setIsOpen(false)}
								className="hover:bg-gray-700 p-1.5 rounded transition-colors"
								aria-label="Minimize chat"
							>
								<Minimize2 className="w-4 h-4" />
							</button>
						)}
						<button
							onClick={() => setIsOpen(false)}
							className="hover:bg-gray-700 p-1.5 rounded transition-colors touch-manipulation"
							aria-label="Close chat"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Messages Area */}
				<ScrollArea
					className="flex-1 p-4 overflow-y-auto chat-scroll-area"
					ref={scrollRef}
				>
					<div className="space-y-4 pb-2 chat-messages">
						{/* Agent Handoff Button - Show only when session is active and as latest message */}
						{messages.length >= 3 &&
							!showAgentHandoff &&
							!agentSessionId &&
							!isConnectedToAgent &&
							sessionId &&
							messages[messages.length - 1]?.role === "assistant" && (
								<div className="flex justify-start w-full">
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
										<p className="text-sm text-blue-800 mb-3">
											Need more personalized help? Connect with one of our
											relationship managers for expert assistance.
										</p>
										<Button
											onClick={handleAgentHandoff}
											className="bg-blue-600 hover:bg-blue-700 text-white w-full"
											size="sm"
										>
											<UserCheck className="w-4 h-4 mr-2" />
											Chat with Human Agent
										</Button>
									</div>
								</div>
							)}

						{/* Agent Handoff Confirmation */}
						{showAgentHandoff && !showCredentialsForm && (
							<div className="flex justify-center my-4">
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
									<p className="text-sm text-blue-800 mb-3">
										Connect with our relationship manager for personalized
										assistance?
									</p>
									<div className="flex gap-2">
										<Button
											onClick={() => setShowCredentialsForm(true)}
											size="sm"
											className="bg-blue-600 hover:bg-blue-700"
										>
											Yes, Connect Me
										</Button>
										<Button
											onClick={handleCancelHandoff}
											variant="outline"
											size="sm"
										>
											Continue with AI
										</Button>
									</div>
								</div>
							</div>
						)}

						{/* User Credentials Form */}
						{showCredentialsForm && (
							<div className="my-4">
								<UserCredentialsForm
									onSubmit={handleCredentialsSubmit}
									onCancel={handleCancelHandoff}
									isLoading={isHandingOff}
								/>
							</div>
						)}

						{/* Agent Session Status */}
						{agentSessionId && (
							<div className="flex justify-center my-4">
								<div
									className={cn(
										"border rounded-lg p-3 max-w-sm text-center",
										isConnectedToAgent
											? "bg-green-50 border-green-200"
											: "bg-blue-50 border-blue-200"
									)}
								>
									<div className="flex items-center justify-center mb-2">
										<UserCheck
											className={cn(
												"w-5 h-5 mr-2",
												isConnectedToAgent ? "text-green-600" : "text-blue-600"
											)}
										/>
										<span
											className={cn(
												"text-sm font-medium",
												isConnectedToAgent ? "text-green-800" : "text-blue-800"
											)}
										>
											{isConnectedToAgent
												? "Agent Connected"
												: "Connected to Support"}
										</span>
									</div>
									<p
										className={cn(
											"text-xs",
											isConnectedToAgent ? "text-green-700" : "text-blue-700"
										)}
									>
										Session ID: {agentSessionId.slice(-8)}
									</p>
									<p
										className={cn(
											"text-xs mt-1",
											isConnectedToAgent ? "text-green-600" : "text-blue-600"
										)}
									>
										{isConnectedToAgent
											? "You're now chatting with a human agent"
											: "A relationship manager will join shortly"}
									</p>
									{!isConnectedToAgent && (
										<button
											onClick={() => window.location.reload()}
											className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
										>
											Refresh Connection
										</button>
									)}
								</div>
							</div>
						)}
						{messages.map((message) => (
							<div key={message.id} className="space-y-3 message-bubble">
								<div
									className={cn(
										"flex",
										message.role === "user" ? "justify-end" : "justify-start"
									)}
								>
									{message.role === "assistant" && (
										<div className="flex items-end mr-2 mb-1">
											<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
												<Bot className="w-4 h-4 text-white" />
											</div>
										</div>
									)}
									<div
										className={cn(
											"max-w-[80%] rounded-lg p-3 shadow-sm gpu-accelerated",
											message.role === "user"
												? "bg-blue-600 text-white rounded-br-sm"
												: "bg-blue-100 text-blue-900 rounded-bl-sm"
										)}
									>
										<p className="text-sm whitespace-pre-wrap leading-relaxed">
											{message.content}
										</p>
										<span
											className={cn(
												"text-xs mt-1.5 block",
												message.role === "user" ? "opacity-80" : "opacity-60"
											)}
										>
											{message.timestamp.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									{message.role === "user" && (
										<div className="flex items-end ml-2 mb-1">
											<div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
												<User className="w-4 h-4 text-white" />
											</div>
										</div>
									)}
								</div>

								{/* Product Cards - Responsive Grid */}
								{message.products && message.products.length > 0 && (
									<div className="flex justify-start w-full">
										<div
											className={cn(
												"grid gap-3 w-full card-enter",
												// Mobile: always 1 column for better readability
												// Desktop: 2 columns if multiple products, 1 if single
												message.products.length === 1
													? "grid-cols-1"
													: "grid-cols-1 sm:grid-cols-2"
											)}
										>
											{message.products.map((product) => (
												<ProductCard
													key={product.product_id}
													product={product}
													onAddToCart={handleAddToCart}
													onViewDetails={handleViewDetails}
													onTryOn={handleTryOn}
													className="w-full"
												/>
											))}
										</div>
									</div>
								)}

								{/* Vendor Cards - Responsive Grid */}
								{message.vendors && message.vendors.length > 0 && (
									<div className="flex justify-start w-full">
										<div
											className={cn(
												"grid gap-3 w-full card-enter",
												message.vendors.length === 1
													? "grid-cols-1"
													: message.vendors.length === 2
													? "grid-cols-2"
													: "grid-cols-1 sm:grid-cols-2"
											)}
										>
											{message.vendors.map((vendor) => (
												<VendorCard
													key={vendor.id}
													vendor={vendor}
													onVisitShop={handleVisitShop}
													onViewProducts={handleViewProducts}
													className="w-full"
												/>
											))}
										</div>
									</div>
								)}
							</div>
						))}
						{isLoading && (
							<div className="flex justify-start">
								<div className="bg-gray-800 rounded-lg rounded-bl-sm p-3 shadow-sm">
									<Loader2 className="w-5 h-5 animate-spin text-white" />
								</div>
							</div>
						)}

						{/* Agent Typing Indicator */}
						{typingUsers.some(
							(user) => user.role === "agent" && user.isTyping
						) && (
							<div className="flex justify-start">
								<div className="flex items-end mr-2 mb-1">
									<div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
										<Bot className="w-4 h-4 text-white" />
									</div>
								</div>
								<div className="bg-blue-100 text-blue-900 rounded-lg rounded-bl-sm p-3 shadow-sm">
									<div className="flex items-center space-x-1">
										<div className="flex space-x-1">
											<div
												className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
												style={{ animationDelay: "0ms" }}
											></div>
											<div
												className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
												style={{ animationDelay: "150ms" }}
											></div>
											<div
												className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
												style={{ animationDelay: "300ms" }}
											></div>
										</div>
										<span className="text-xs text-blue-700 ml-2">
											Agent is typing...
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Input Area */}
				<div
					className={cn(
						"p-4 border-t bg-gray-50",
						isMobile && "pb-safe" // Safe area for mobile devices
					)}
				>
					<div className="flex gap-2">
						<textarea
							ref={textareaRef}
							onChange={(e) => {
								// Debug logging
								const target = e.target as HTMLTextAreaElement;
								console.log("[TEXTAREA DEBUG] onChange:", {
									value: target.value,
									valueLength: target.value.length,
									cursorPosition: target.selectionStart,
									hasSpaces: target.value.includes(" "),
									spaceCount: (target.value.match(/ /g) || []).length,
									lastChar: target.value[target.value.length - 1],
									lastCharCode: target.value.charCodeAt(
										target.value.length - 1
									),
								});
								// Stop propagation to prevent parent handlers
								e.stopPropagation();
								// Sync state with textarea value - but don't control it
								setInput(target.value);

								// Handle typing indicators
								if (target.value.trim()) {
									handleTypingStart();
								} else {
									handleTypingStop();
								}
							}}
							onKeyDown={(e) => {
								const target = e.target as HTMLTextAreaElement;
								// Debug logging for keyboard events
								console.log("[TEXTAREA DEBUG] onKeyDown:", {
									key: e.key,
									keyCode: e.keyCode,
									code: e.code,
									targetValue: target.value,
									cursorPosition: target.selectionStart,
									willPreventDefault: e.key === "Enter" && !e.shiftKey,
								});

								// Handle spacebar explicitly - manually insert space if browser doesn't
								if (e.key === " " || e.keyCode === 32) {
									console.log(
										"[TEXTAREA DEBUG] Spacebar pressed - manually inserting space"
									);
									e.stopPropagation();

									// Manually insert space at cursor position
									const cursorPos = target.selectionStart;
									const textBefore = target.value.substring(0, cursorPos);
									const textAfter = target.value.substring(target.selectionEnd);
									const newValue = textBefore + " " + textAfter;

									// Update value and cursor position
									target.value = newValue;
									target.setSelectionRange(cursorPos + 1, cursorPos + 1);

									// Trigger onChange manually
									const changeEvent = new Event("input", { bubbles: true });
									target.dispatchEvent(changeEvent);

									// Prevent default to avoid double space
									e.preventDefault();
									return;
								}

								// Only handle Enter - everything else works normally
								if (e.key === "Enter" && !e.shiftKey) {
									console.log("[TEXTAREA DEBUG] Preventing Enter default");
									e.preventDefault();
									e.stopPropagation();
									handleSend();
									return;
								}
								// For all other keys, stop propagation to prevent parent interference
								e.stopPropagation();
							}}
							onKeyUp={(e) => {
								// Debug logging after key is released
								const target = e.target as HTMLTextAreaElement;
								if (e.key === " " || e.keyCode === 32) {
									console.log("[TEXTAREA DEBUG] onKeyUp - Spacebar released:", {
										targetValue: target.value,
										cursorPosition: target.selectionStart,
										hasSpace: target.value.includes(" "),
										spacePositions: Array.from(target.value)
											.map((char, idx) => (char === " " ? idx : -1))
											.filter((idx) => idx !== -1),
									});
								}
							}}
							onInput={(e) => {
								// Debug logging for input events (fires after browser processes the input)
								const target = e.target as HTMLTextAreaElement;
								console.log("[TEXTAREA DEBUG] onInput:", {
									value: target.value,
									cursorPosition: target.selectionStart,
									lastChar: target.value[target.value.length - 1],
									hasSpaces: target.value.includes(" "),
									valueArray: Array.from(target.value),
								});
								// Stop propagation to prevent parent handlers
								e.stopPropagation();
							}}
							placeholder="Ask me about products, styles, or get recommendations..."
							className={cn(
								"flex-1 bg-white resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
								isMobile && "text-[16px]" // Prevent zoom on iOS (must be 16px or larger)
							)}
							disabled={isLoading}
							aria-label="Chat message input"
							rows={1}
							autoComplete="off"
							spellCheck="true"
							style={{ minHeight: "40px", maxHeight: "120px" }}
						/>
						<Button
							onClick={handleSend}
							disabled={
								(!textareaRef.current?.value?.trim() && !input.trim()) ||
								isLoading
							}
							className={cn(
								"bg-black hover:bg-gray-800 touch-manipulation",
								isMobile ? "min-w-[56px] min-h-[56px]" : "min-w-[48px]" // Larger touch target on mobile
							)}
							size={isMobile ? "lg" : "default"}
							aria-label="Send message"
						>
							{isLoading ? (
								<Loader2
									className={cn(
										"animate-spin",
										isMobile ? "w-5 h-5" : "w-4 h-4"
									)}
								/>
							) : (
								<Send className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Virtual Try-On Modal */}
			{tryOnProduct && userAvatar && (
				<VirtualTryOnModal
					isOpen={true}
					onClose={handleCloseTryOn}
					product={tryOnProduct}
					avatarConfig={userAvatar}
					onAddToCart={handleAddToCartFromTryOn}
					userPhoto={userPhoto || undefined}
					onPhotoUpload={setUserPhoto}
				/>
			)}
		</>
	);
}