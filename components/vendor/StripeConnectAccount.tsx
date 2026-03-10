"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	CheckCircle,
	AlertCircle,
	ExternalLink,
	RefreshCw,
	CreditCard,
	Clock,
	X,
	Loader2,
	AlertTriangle,
	Info,
	CheckCircle2,
	TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { PayoutHistory } from "./PayoutHistory";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

interface StripeConnectAccountProps {
	tailorUID: string;
	email: string;
	businessName?: string;
	country?: string;
	onSuccess?: () => void;
}

interface AccountStatus {
	accountId: string;
	email: string;
	detailsSubmitted: boolean;
	chargesEnabled: boolean;
	payoutsEnabled: boolean;
	country: string;
	defaultCurrency: string;
	created: number;
	type: string;
	balance: {
		available: Array<{ amount: number; currency: string }>;
		pending: Array<{ amount: number; currency: string }>;
		connectReserved: Array<{ amount: number; currency: string }>;
		livemode: boolean;
	};
	requirements: {
		currentlyDue: string[];
		eventuallyDue: string[];
		pastDue: string[];
		pendingVerification: string[];
		disabledReason: string | null;
		errors: Array<{ code: string; reason: string; requirement: string }>;
	};
	capabilities: {
		cardPayments: string;
		transfers: string;
	};
	payouts: {
		schedule: any;
		statementDescriptor: string;
		debitNegativeBalances: boolean;
	};
	businessProfile: {
		name: string;
		productDescription: string;
		supportEmail: string;
		supportPhone: string;
		supportUrl: string;
		url: string;
	};
	metadata: Record<string, any>;
	cached?: boolean;
	requestId?: string;
	lastUpdated?: string;
}

// Enhanced loading states
type LoadingState =
	| "idle"
	| "checking"
	| "creating"
	| "connecting"
	| "refreshing"
	| "updating";

// Operation result types
interface OperationResult {
	success: boolean;
	message: string;
	data?: any;
	error?: string;
}

export const StripeConnectAccount: React.FC<StripeConnectAccountProps> = ({
	tailorUID,
	email,
	businessName,
	country = "US",
	onSuccess,
}) => {
	console.log("[DEBUG] StripeConnectAccount component rendered with props:", {
		tailorUID,
		email,
		businessName,
		country,
		hasTailorUID: !!tailorUID,
		hasEmail: !!email,
	});

	const [loadingState, setLoadingState] = useState<LoadingState>("idle");
	const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
		null
	);
	const [accountId, setAccountId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [operationProgress, setOperationProgress] = useState(0);
	const [lastOperation, setLastOperation] = useState<OperationResult | null>(
		null
	);
	const [retryCount, setRetryCount] = useState(0);
	// Initialize from localStorage if available
	const [onboardingUrl, setOnboardingUrl] = useState<string | null>(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(`stripe_onboarding_url_${tailorUID}`);
			return stored || null;
		}
		return null;
	});
	const onboardingUrlRef = useRef<string | null>(null); // Track URL in ref to prevent clearing
	const urlJustSetRef = useRef(false); // Flag to prevent clearing URL immediately after setting

	// Refs for timeout and abort controllers
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const hasCheckedRef = useRef(false);
	const shouldGetOnboardingLinkRef = useRef(false);
	const pendingAccountIdRef = useRef<string | null>(null);

	useEffect(() => {
		// Prevent double execution in React Strict Mode
		if (hasCheckedRef.current) {
			console.log("[DEBUG] checkExistingAccount skipped - already checked");
			return;
		}

		// Only proceed if we have required props
		if (!tailorUID || !email) {
			console.log(
				"[DEBUG] useEffect: Skipping checkExistingAccount - missing props",
				{
					tailorUID,
					email,
				}
			);
			return;
		}

		hasCheckedRef.current = true;

		console.log("[DEBUG] useEffect: Calling checkExistingAccount on mount", {
			tailorUID,
			email,
		});
		checkExistingAccount();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tailorUID]); // Only depend on tailorUID - email is checked inside the function

	// Load saved Stripe onboarding URL from Firestore
	useEffect(() => {
		const loadSavedOnboardingUrl = async () => {
			if (!tailorUID) {
				console.log("[StripeConnect] Skipping load saved URL - no tailorUID");
				return;
			}

			// First check localStorage
			const localStoredUrl =
				typeof window !== "undefined"
					? localStorage.getItem(`stripe_onboarding_url_${tailorUID}`)
					: null;

			if (localStoredUrl) {
				console.log("[StripeConnect] Found saved URL in localStorage");
				setOnboardingUrl(localStoredUrl);
				onboardingUrlRef.current = localStoredUrl;
				return; // Don't fetch from Firestore if we have it locally
			}

			try {
				const firebaseDb = await getFirebaseDb();
				const tailorRef = doc(firebaseDb, "tailors", tailorUID);
				const tailorDoc = await getDoc(tailorRef);

				if (!tailorDoc.exists()) {
					console.log("[StripeConnect] Tailor not found in Firestore");
					return;
				}

				const tailorData = tailorDoc.data();
				const savedUrl = tailorData?.stripeOnboardingUrl;

				if (savedUrl) {
					console.log("[StripeConnect] Loaded onboarding URL from Firestore");
					setOnboardingUrl(savedUrl);
					onboardingUrlRef.current = savedUrl;

					// Also save to localStorage for faster access next time
					if (typeof window !== "undefined") {
						localStorage.setItem(
							`stripe_onboarding_url_${tailorUID}`,
							savedUrl
						);
					}
				}
			} catch (error) {
				console.error(
					"[StripeConnect] Error loading onboarding URL from Firestore:",
					error
				);
				// This is non-critical, just log and continue
			}
		};

		loadSavedOnboardingUrl();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tailorUID]);

	// Debug: Log onboardingUrl changes and sync ref
	useEffect(() => {
		console.log("[DEBUG] onboardingUrl state changed", {
			onboardingUrl,
			hasUrl: !!onboardingUrl,
			urlPreview: onboardingUrl ? onboardingUrl.substring(0, 50) + "..." : null,
			refValue: onboardingUrlRef.current,
		});
		// Sync ref with state to ensure it's always up to date
		if (onboardingUrl) {
			onboardingUrlRef.current = onboardingUrl;
			urlJustSetRef.current = true;
			// Reset flag after a delay
			setTimeout(() => {
				urlJustSetRef.current = false;
			}, 10000); // 10 seconds should be enough
		} else if (onboardingUrlRef.current && urlJustSetRef.current) {
			// If state was cleared but ref still has it and flag is set, restore state
			console.log(
				"[DEBUG] State cleared but ref has URL - restoring from useEffect",
				{
					refUrl: onboardingUrlRef.current,
				}
			);
			setOnboardingUrl(onboardingUrlRef.current);
		}
	}, [onboardingUrl]);

	// Debug: Log accountId changes
	useEffect(() => {
		console.log("[DEBUG] accountId state changed", {
			accountId,
			hasAccountId: !!accountId,
		});
	}, [accountId]);

	// Cleanup function for timeouts and abort controllers
	useEffect(() => {
		return () => {
			// Clear timeout if it exists
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			// Abort any pending requests when component unmounts
			if (abortControllerRef.current) {
				try {
					abortControllerRef.current.abort();
				} catch (err) {
					// Ignore errors from aborting (request might already be complete)
					console.log(
						"[StripeConnect] Cleanup: Request already completed or aborted"
					);
				}
				abortControllerRef.current = null;
			}
		};
	}, []);

	// Listen for Stripe onboarding completion events
	useEffect(() => {
		const handleOnboardingComplete = async () => {
			console.log("[StripeConnect] Stripe onboarding completed, refreshing account status");

			// Clear the saved onboarding URL from Firestore since setup is complete
			if (tailorUID) {
				try {
					const firebaseDb = await getFirebaseDb();
					const tailorRef = doc(firebaseDb, "tailors", tailorUID);
					await updateDoc(tailorRef, {
						stripeOnboardingUrl: null,
						stripeOnboardingUrlUpdatedAt: new Date(),
					});
					console.log("[StripeConnect] Cleared onboarding URL from Firestore");

					// Also clear from localStorage
					if (typeof window !== "undefined") {
						localStorage.removeItem(`stripe_onboarding_url_${tailorUID}`);
					}

					// Clear from state and ref
					setOnboardingUrl(null);
					onboardingUrlRef.current = null;
				} catch (error) {
					console.error("[StripeConnect] Error clearing onboarding URL:", error);
					// Continue anyway - this is non-critical
				}
			}

			if (accountId) {
				handleRefreshStatus(true); // Force refresh from Stripe
			}
		};

		const handleOnboardingRefresh = () => {
			console.log("[StripeConnect] Stripe onboarding refresh requested");
			if (accountId) {
				handleRefreshStatus(false); // Refresh with cache allowed
			}
		};

		window.addEventListener("stripe_onboarding_complete", handleOnboardingComplete);
		window.addEventListener("stripe_onboarding_refresh", handleOnboardingRefresh);

		return () => {
			window.removeEventListener("stripe_onboarding_complete", handleOnboardingComplete);
			window.removeEventListener("stripe_onboarding_refresh", handleOnboardingRefresh);
		};
	}, [accountId, tailorUID]);

	// Enhanced timeout and cancellation handling
	const setupOperationTimeout = (
		operation: string,
		duration: number = 15000
	) => {
		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Setup abort controller
		abortControllerRef.current = new AbortController();

		// Setup timeout
		timeoutRef.current = setTimeout(() => {
			console.error(`[StripeConnect] ${operation} timeout after ${duration}ms`);
			setLoadingState("idle");
			setError(
				`Operation timed out after ${
					duration / 1000
				} seconds. Please check your connection and try again.`
			);

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			toast.error(`${operation} timed out. Please try again.`, {
				action: {
					label: "Retry",
					onClick: () => {
						setError(null);
						checkExistingAccount();
					},
				},
			});
		}, duration);

		return abortControllerRef.current;
	};

	const clearOperationTimeout = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const cancelCurrentOperation = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		clearOperationTimeout();
		setLoadingState("idle");
		setOperationProgress(0);
		setError(null);
		toast.info("Operation cancelled");
	};

	// Enhanced error handling with specific guidance
	const handleError = (error: any, operation: string): OperationResult => {
		// Silently ignore AbortError - it's expected when component unmounts or operation is cancelled
		if (
			error.name === "AbortError" ||
			error.message === "signal is aborted without reason"
		) {
			console.log(
				`[StripeConnect] ${operation} was aborted (expected behavior)`
			);
			return {
				success: false,
				message: "Operation cancelled",
				error: "",
			};
		}

		console.error(`[StripeConnect] ${operation} error:`, error);

		let message = "An unexpected error occurred. Please try again.";
		let guidance = "";

		if (error.message?.includes("timeout")) {
			message = "Request timed out.";
			guidance =
				"This usually indicates a slow internet connection. Please try again.";
		} else if (
			error.message?.includes("network") ||
			error.message?.includes("fetch")
		) {
			message = "Network connection error.";
			guidance = "Please check your internet connection and try again.";
		} else if (error.message?.includes("validation")) {
			message = "Invalid information provided.";
			guidance = "Please check that all required fields are filled correctly.";
		} else if (error.message?.includes("permission")) {
			message = "Permission denied.";
			guidance = "Please contact support if this issue persists.";
		}

		const result: OperationResult = {
			success: false,
			message,
			error: guidance,
		};

		setLastOperation(result);
		setError(`${message} ${guidance}`);

		return result;
	};

	// Enhanced success handling
	const handleSuccess = (message: string, data?: any): OperationResult => {
		const result: OperationResult = {
			success: true,
			message,
			data,
		};

		setLastOperation(result);
		setError(null);

		toast.success(message, {
			duration: 4000,
			icon: <CheckCircle2 className="h-4 w-4" />,
		});

		if (onSuccess) {
			onSuccess();
		}

		return result;
	};

	const checkExistingAccount = async () => {
		// Prevent multiple simultaneous calls
		if (loadingState !== "idle") {
			console.log(
				"[DEBUG] checkExistingAccount blocked - loadingState is not idle",
				{
					loadingState,
				}
			);
			return;
		}

		try {
			console.log("[DEBUG] checkExistingAccount starting", {
				tailorUID,
				email,
				businessName,
				country,
				currentAccountId: accountId,
			});

			setLoadingState("checking");
			setOperationProgress(10);
			setError(null);

			console.log("[StripeConnect] Checking existing account for:", {
				tailorUID,
				email,
				businessName,
				country,
			});

			// Validate required fields
			if (!tailorUID || !email) {
				console.error("[StripeConnect] Missing required fields:", {
					tailorUID,
					email,
				});
				handleError(
					new Error(
						"Missing required information. Please ensure your profile is complete."
					),
					"Account Check"
				);
				setLoadingState("idle");
				return;
			}

			setOperationProgress(25);

			// Setup timeout and abort controller
			const controller = setupOperationTimeout("Account Check", 15000);

			setOperationProgress(40);

			// Prepare request body
			const requestBody = {
				tailorUID,
				email,
				businessName: businessName?.trim() || "",
				country: country || "US",
			};

			console.log("[StripeConnect] Sending request with body:", requestBody);

			const response = await fetch("/api/stripe/connect/create-account", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal,
			});

			setOperationProgress(70);

			const data = await response.json();

			if (response.ok && data.accountId) {
				console.log("[DEBUG] ✅ Account ID received from API:", data.accountId);
				console.log("[DEBUG] Setting accountId state...");
				setAccountId(data.accountId);
				console.log(
					"[DEBUG] accountId state should be set to:",
					data.accountId
				);
				setOperationProgress(85);

				// NEVER clear onboarding URL if it exists in localStorage, ref, or was just set
				const storedUrl =
					typeof window !== "undefined" && tailorUID
						? localStorage.getItem(`stripe_onboarding_url_${tailorUID}`)
						: null;

				if (onboardingUrlRef.current || urlJustSetRef.current || storedUrl) {
					console.log("[DEBUG] Keeping onboardingUrl - URL exists somewhere", {
						hasUrlInRef: !!onboardingUrlRef.current,
						hasStoredUrl: !!storedUrl,
						urlJustSet: urlJustSetRef.current,
						url: onboardingUrlRef.current
							? onboardingUrlRef.current.substring(0, 50) + "..."
							: storedUrl
							? storedUrl.substring(0, 50) + "..."
							: null,
					});
					// Restore from localStorage if state is empty
					if (!onboardingUrl && storedUrl) {
						console.log("[DEBUG] Restoring URL from localStorage");
						setOnboardingUrl(storedUrl);
						onboardingUrlRef.current = storedUrl;
					}
				} else if (!shouldGetOnboardingLinkRef.current) {
					console.log(
						"[DEBUG] Clearing onboardingUrl - initial check, no URL set anywhere"
					);
					setOnboardingUrl(null);
					onboardingUrlRef.current = null;
				} else {
					console.log(
						"[DEBUG] Keeping onboardingUrl - user requested new link",
						{
							shouldGetOnboardingLink: shouldGetOnboardingLinkRef.current,
						}
					);
				}

				// If account exists, fetch full status
				if (data.detailsSubmitted) {
					await fetchAccountStatus(data.accountId);
					// Set the accountId in ref so handleConnectStripe can use it
					pendingAccountIdRef.current = data.accountId;
					// After fetching status completes, get the onboarding link so user can complete setup
					await handleConnectStripe();
				} else {
					// Account needs more information or Stripe hasn't verified it yet
					// This could mean:
					// 1. Details not submitted yet
					// 2. Details submitted but Stripe is still reviewing
					// 3. Details submitted but Stripe needs more information
					// Generate onboarding link to complete/update setup
					const isFullyVerified = data.chargesEnabled && data.payoutsEnabled;
					console.log(
						"[DEBUG] Account needs verification or more information from Stripe",
						{
							detailsSubmitted: data.detailsSubmitted,
							chargesEnabled: data.chargesEnabled,
							payoutsEnabled: data.payoutsEnabled,
							isFullyVerified,
							shouldGetOnboardingLink: shouldGetOnboardingLinkRef.current,
						}
					);

					if (
						shouldGetOnboardingLinkRef.current ||
						(data.detailsSubmitted && !isFullyVerified)
					) {
						// If user clicked to get onboarding link, automatically get it now
						console.log(
							"[DEBUG] Should get onboarding link, will call handleConnectStripe"
						);
						shouldGetOnboardingLinkRef.current = false;
						// Use the accountId from the response
						const newAccountId = data.accountId;
						// Set accountId in state and ref
						setAccountId(newAccountId);
						pendingAccountIdRef.current = newAccountId;
						setTimeout(() => {
							console.log(
								"[DEBUG] Calling handleConnectStripe with accountId:",
								newAccountId
							);
							handleConnectStripe();
						}, 300);
					}
				}

				setOperationProgress(100);
				handleSuccess("Account information loaded successfully");
			} else {
				console.error("[DEBUG] ❌ Failed to get account ID from API", {
					responseOk: response.ok,
					hasAccountId: !!data.accountId,
					status: response.status,
					statusText: response.statusText,
					error: data.error,
					fullData: data,
					responseHeaders: Object.fromEntries(response.headers.entries()),
				});
				console.error("[StripeConnect] Failed to get account ID:", data);

				// If response is ok but no accountId, log more details
				if (response.ok && !data.accountId) {
					console.error(
						"[DEBUG] ⚠️ Response OK but no accountId! This is strange if account exists in DB"
					);
				}

				handleError(
					new Error(data.error || "Failed to initialize Stripe account"),
					"Account Check"
				);
			}
		} catch (error: any) {
			// Only handle error if it's not an AbortError (which is expected on cleanup)
			if (
				error.name !== "AbortError" &&
				error.message !== "signal is aborted without reason"
			) {
				handleError(error, "Account Check");
			} else {
				// Silently handle abort - component might be unmounting
				console.log("[StripeConnect] Account check was aborted");
			}
		} finally {
			clearOperationTimeout();
			// Reset state - AbortError is already handled silently above
			setLoadingState("idle");
			setOperationProgress(0);
		}
	};

	const fetchAccountStatus = async (
		accId: string,
		forceRefresh: boolean = false
	) => {
		try {
			setLoadingState("refreshing");
			setOperationProgress(20);

			// Setup timeout and abort controller
			const controller = setupOperationTimeout("Status Refresh", 10000);

			setOperationProgress(40);

			const response = await fetch("/api/stripe/connect/account-status", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					accountId: accId,
					tailorUID,
					forceRefresh,
				}),
				signal: controller.signal,
			});

			setOperationProgress(70);

			const data = await response.json();

			if (response.ok) {
				setAccountStatus(data);
				setOperationProgress(100);

				// Clear onboarding URL if account is fully set up
				if (data.detailsSubmitted && data.chargesEnabled) {
					onboardingUrlRef.current = null;
					setOnboardingUrl(null);
				}

				if (forceRefresh) {
					handleSuccess(
						data.cached
							? "Status refreshed from cache"
							: "Status refreshed from Stripe"
					);
				}
			} else {
				handleError(
					new Error(data.error || "Failed to fetch account status"),
					"Status Refresh"
				);
			}
		} catch (error: any) {
			// Only handle error if it's not an AbortError (which is expected on cleanup)
			if (
				error.name !== "AbortError" &&
				error.message !== "signal is aborted without reason"
			) {
				handleError(error, "Status Refresh");
			} else {
				console.log("[StripeConnect] Status refresh was aborted");
			}
		} finally {
			clearOperationTimeout();
			// Reset state - AbortError is already handled silently above
			setLoadingState("idle");
			setOperationProgress(0);
		}
	};

	const handleConnectStripe = async () => {
		let onboardingUrlSet = false; // Track if we successfully set the URL

		try {
			// Use pending accountId from ref, or state accountId
			const accountIdToUse = pendingAccountIdRef.current || accountId;
			// Clear the ref after using it
			if (pendingAccountIdRef.current) {
				pendingAccountIdRef.current = null;
			}

			console.log("[DEBUG] handleConnectStripe called", {
				accountId: accountIdToUse,
				stateAccountId: accountId,
				tailorUID,
				currentOnboardingUrl: onboardingUrl,
			});

			setLoadingState("connecting");
			setOperationProgress(15);
			setError(null);

			if (!accountIdToUse) {
				console.error("[DEBUG] No accountId found!");
				handleError(
					new Error("Account ID not found. Please refresh the page."),
					"Connect Stripe"
				);
				setLoadingState("idle");
				return;
			}

			setOperationProgress(30);

			// Setup timeout and abort controller
			const controller = setupOperationTimeout("Connect Stripe", 12000);

			setOperationProgress(50);

			console.log("[DEBUG] Fetching account link", {
				accountId: accountIdToUse,
				tailorUID,
				endpoint: "/api/stripe/connect/account-link",
			});

			// Get account link for onboarding
			const response = await fetch("/api/stripe/connect/account-link", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					accountId: accountIdToUse,
					tailorUID,
				}),
				signal: controller.signal,
			});

			setOperationProgress(75);

			const data = await response.json();
			console.log("[DEBUG] Account link API response", {
				status: response.status,
				ok: response.ok,
				hasUrl: !!data.url,
				url: data.url ? data.url.substring(0, 50) + "..." : null,
				data,
			});

			if (response.ok && data.url) {
				setOperationProgress(100);

				// Store the onboarding URL instead of auto-opening
				// Update state, ref, AND localStorage for persistence
				onboardingUrlRef.current = data.url;
				urlJustSetRef.current = true;
				setOnboardingUrl(data.url);

				// Store in localStorage so it persists even if state gets cleared
				if (typeof window !== "undefined" && tailorUID) {
					localStorage.setItem(`stripe_onboarding_url_${tailorUID}`, data.url);
				}

				// Save onboarding URL to Firestore
				if (tailorUID) {
					try {
						const firebaseDb = await getFirebaseDb();
						const tailorRef = doc(firebaseDb, "tailors", tailorUID);
						await updateDoc(tailorRef, {
							stripeOnboardingUrl: data.url,
							stripeOnboardingUrlUpdatedAt: new Date(),
						});
						console.log("[StripeConnect] Onboarding URL saved to Firestore");
					} catch (error) {
						console.error("[StripeConnect] Failed to save onboarding URL to Firestore:", error);
						// Continue anyway - URL is still in localStorage
					}
				}

				onboardingUrlSet = true; // Mark that we successfully set the URL

				// Verify state was set after a brief delay
				setTimeout(() => {
					const localStoredUrl = localStorage.getItem(`stripe_onboarding_url_${tailorUID}`);
					// If state was cleared but ref still has it, restore state
					if (!onboardingUrl && onboardingUrlRef.current) {
						// Force update both state and flag
						urlJustSetRef.current = true;
						setOnboardingUrl(onboardingUrlRef.current);
						// Keep the flag set for a bit longer to prevent clearing
						setTimeout(() => {
							urlJustSetRef.current = false;
						}, 10000); // 10 seconds
					}
				}, 200);

				// Show success message
				toast.success("Onboarding link ready!", {
					duration: 4000,
					icon: <ExternalLink className="h-4 w-4" />,
					description:
						"Click the button below to complete your Stripe account setup.",
				});
			} else {
				console.error("[DEBUG] Failed to get onboarding URL", {
					responseOk: response.ok,
					hasUrl: !!data.url,
					error: data.error,
					fullData: data,
				});
				handleError(
					new Error(data.error || "Failed to create onboarding link"),
					"Connect Stripe"
				);
			}
		} catch (error: any) {
			// Only handle error if it's not an AbortError (which is expected on cleanup)
			if (
				error.name !== "AbortError" &&
				error.message !== "signal is aborted without reason"
			) {
				handleError(error, "Connect Stripe");
			} else {
				console.log("[StripeConnect] Connect Stripe was aborted");
			}
		} finally {
			clearOperationTimeout();
			// Only reset loadingState if we didn't successfully set the onboarding URL
			// (onboardingUrlSet is a local variable, so it reflects the actual success state)
			if (!onboardingUrlSet && loadingState === "connecting") {
				setLoadingState("idle");
			}
			setOperationProgress(0);
		}
	};

	const handleRefreshStatus = async (forceRefresh: boolean = false) => {
		if (!accountId) {
			toast.error("No account ID available to refresh");
			return;
		}

		await fetchAccountStatus(accountId, forceRefresh);
	};

	const handleRetryOperation = () => {
		setRetryCount((prev) => prev + 1);
		setError(null);
		setLastOperation(null);

		if (retryCount < 3) {
			checkExistingAccount();
		} else {
			toast.error(
				"Maximum retry attempts reached. Please refresh the page or contact support."
			);
		}
	};

	const formatAmount = (amount: number, currency: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(amount / 100);
	};

	// Enhanced loading state display
	const renderLoadingState = () => {
		const loadingMessages: Record<Exclude<LoadingState, "idle">, string> = {
			checking: "Checking your account...",
			creating: "Setting up your Stripe account...",
			connecting: "Connecting to Stripe...",
			refreshing: "Refreshing account status...",
			updating: "Updating account information...",
		};

		const loadingIcons: Record<
			Exclude<LoadingState, "idle">,
			React.ReactElement
		> = {
			checking: <Loader2 className="h-6 w-6 animate-spin text-blue-500" />,
			creating: <CreditCard className="h-6 w-6 animate-pulse text-green-500" />,
			connecting: (
				<ExternalLink className="h-6 w-6 animate-pulse text-purple-500" />
			),
			refreshing: (
				<RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
			),
			updating: <Clock className="h-6 w-6 animate-pulse text-indigo-500" />,
		};

		return (
			<Card className="border-2 border-blue-100">
				<CardContent className="p-6">
					<div className="flex flex-col items-center justify-center space-y-6">
						<div className="flex items-center space-x-3">
							{loadingState !== "idle" &&
								loadingIcons[loadingState as Exclude<LoadingState, "idle">]}
							<span className="text-lg font-medium text-gray-700">
								{loadingState !== "idle" &&
									loadingMessages[
										loadingState as Exclude<LoadingState, "idle">
									]}
							</span>
						</div>

						{operationProgress > 0 && (
							<div className="w-full max-w-xs space-y-2">
								<Progress value={operationProgress} className="h-2" />
								<p className="text-xs text-center text-gray-500">
									{operationProgress}% complete
								</p>
							</div>
						)}

						<p className="text-sm text-gray-500 text-center max-w-md">
							{loadingState === "checking" &&
								"We're verifying your account information and setting up your Stripe integration."}
							{loadingState === "creating" &&
								"Creating your secure Stripe Connect account. This ensures you can receive payments safely."}
							{loadingState === "connecting" &&
								"Preparing your onboarding experience. You'll be redirected to Stripe shortly."}
							{loadingState === "refreshing" &&
								"Getting the latest information from Stripe about your account status."}
							{loadingState === "updating" &&
								"Saving your account updates. Please wait while we process the changes."}
						</p>

						<div className="flex space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={cancelCurrentOperation}
								className="flex items-center space-x-1"
							>
								<X className="h-4 w-4" />
								<span>Cancel</span>
							</Button>

							{retryCount > 0 && retryCount < 3 && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleRetryOperation}
									className="flex items-center space-x-1"
								>
									<RefreshCw className="h-4 w-4" />
									<span>Retry ({3 - retryCount} left)</span>
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	// Enhanced error state display
	const renderErrorState = () => {
		if (!error && !lastOperation?.error) return null;

		const errorMessage =
			error || lastOperation?.error || "An unknown error occurred";

		return (
			<Alert className="border-red-200 bg-red-50 mb-4">
				<AlertTriangle className="h-4 w-4 text-red-600" />
				<AlertDescription>
					<div className="space-y-3">
						<div>
							<p className="font-medium text-red-900 mb-1">
								Something went wrong
							</p>
							<p className="text-sm text-red-800">{errorMessage}</p>
						</div>

						<div className="flex space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleRetryOperation}
								disabled={retryCount >= 3}
								className="text-red-700 border-red-300 hover:bg-red-100"
							>
								<RefreshCw className="h-4 w-4 mr-1" />
								{retryCount >= 3
									? "Max retries reached"
									: `Retry (${3 - retryCount} left)`}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setError(null);
									setLastOperation(null);
									setRetryCount(0);
								}}
								className="text-red-700 border-red-300 hover:bg-red-100"
							>
								<X className="h-4 w-4 mr-1" />
								Dismiss
							</Button>
						</div>
					</div>
				</AlertDescription>
			</Alert>
		);
	};

	// Enhanced success state display
	const renderSuccessState = () => {
		if (!lastOperation?.success) return null;

		return (
			<Alert className="border-green-200 bg-green-50 mb-4">
				<CheckCircle2 className="h-4 w-4 text-green-600" />
				<AlertDescription>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-green-900 mb-1">Success!</p>
							<p className="text-sm text-green-800">{lastOperation.message}</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setLastOperation(null)}
							className="text-green-700 hover:bg-green-100"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</AlertDescription>
			</Alert>
		);
	};

	// Show loading state
	if (loadingState !== "idle" && !accountStatus && !accountId) {
		return renderLoadingState();
	}

	// Account not set up yet
	if (!accountStatus || !accountStatus.detailsSubmitted) {
		return (
			<div className="space-y-4">
				{renderErrorState()}
				{renderSuccessState()}

				<Card className="border-2 border-blue-100">
					<CardHeader>
						<CardTitle className="flex items-center">
							<CreditCard className="h-5 w-5 mr-2" />
							Connect Your Stripe Account
						</CardTitle>
						<CardDescription>
							Set up your Stripe account to receive payouts directly to your
							bank account
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert>
							<Info className="h-4 w-4" />
							<AlertDescription>
								You need to connect your Stripe account to receive payments.
								This is a secure process handled by Stripe.
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<h4 className="font-medium">What you'll need:</h4>
							<ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
								<li>Business or personal information</li>
								<li>Bank account details</li>
								<li>Tax identification number</li>
								<li>Government-issued ID</li>
							</ul>
						</div>

						{/* International Account Information */}
						<Alert className="border-blue-200 bg-blue-50">
							<Info className="h-4 w-4 text-blue-600" />
							<AlertDescription>
								<div className="space-y-2">
									<p className="font-medium text-blue-900">International Account Information</p>
									<p className="text-sm text-blue-800">
										Since you're operating internationally, Stripe will require additional information:
									</p>
									<ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-2">
										<li>Your company's registration details and address</li>
										<li>Bank account information in your country</li>
										<li>Additional compliance and identity verification documents</li>
										<li>Details about your business operations and customer base</li>
									</ul>
									<p className="text-sm text-blue-800 mt-2">
										This helps Stripe comply with international financial regulations and protect both you and your customers.
									</p>
								</div>
							</AlertDescription>
						</Alert>

						{/* Enhanced progress indicator for setup */}
						{loadingState === "connecting" && operationProgress > 0 && (
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>Preparing onboarding...</span>
									<span>{operationProgress}%</span>
								</div>
								<Progress value={operationProgress} className="h-2" />
							</div>
						)}

						{/* Debug info (dev only) */}
						{/* {process.env.NODE_ENV === "development" && (
							<div className="p-2 bg-gray-100 rounded text-xs font-mono">
								<div>Debug Info:</div>
								<div>
									onboardingUrl: {onboardingUrl ? "✅ Set" : "❌ Not set"}
								</div>
								<div>accountId: {accountId || "❌ Not set"}</div>
								<div>loadingState: {loadingState}</div>
								{onboardingUrl && (
									<div className="mt-1 text-blue-600 break-all">
										URL: {onboardingUrl.substring(0, 80)}...
									</div>
								)}
							</div>
						)} */}

						{/* Show onboarding link button if URL is available */}
						{(() => {
							// Check state, ref, AND localStorage for the URL
							const storedUrl =
								typeof window !== "undefined" && tailorUID
									? localStorage.getItem(`stripe_onboarding_url_${tailorUID}`)
									: null;
							const urlToUse =
								onboardingUrl || onboardingUrlRef.current || storedUrl;
							const shouldShowButton = !!urlToUse;

							// If we have a URL anywhere but not in state, restore state
							if (!onboardingUrl && urlToUse) {
								console.log(
									"[DEBUG] URL exists but not in state - restoring state",
									{ urlToUse: urlToUse.substring(0, 50) + "..." }
								);
								// Use setTimeout to avoid state update during render
								setTimeout(() => {
									setOnboardingUrl(urlToUse);
									onboardingUrlRef.current = urlToUse;
									urlJustSetRef.current = true;
								}, 0);
							}

							return shouldShowButton ? (
								<div className="space-y-3">
									<Alert className="border-blue-200 bg-blue-50">
										<Info className="h-4 w-4 text-blue-600" />
										<AlertDescription className="text-blue-900">
											<p className="font-medium mb-1">
												Ready to complete onboarding!
											</p>
											<p className="text-sm">
												Click the button below to open Stripe's secure
												onboarding form in a new window. You'll complete your
												business information, verify your identity, and add your
												bank details.
											</p>
										</AlertDescription>
									</Alert>
									<a
										href={urlToUse}
										target="_blank"
										rel="noopener noreferrer"
										className="w-full bg-[#635BFF] hover:bg-[#5851DF] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										onClick={() => {
											console.log("[DEBUG] Onboarding link clicked", {
												url: urlToUse,
											});
										}}
									>
										<ExternalLink className="h-5 w-5" />
										Go to Stripe Onboarding
									</a>
									<Button
										variant="outline"
										onClick={() => {
											console.log(
												"[DEBUG] Cancel clicked, clearing onboarding URL"
											);
											urlJustSetRef.current = false;
											onboardingUrlRef.current = null;
											setOnboardingUrl(null);
											// Clear from localStorage too
											if (typeof window !== "undefined" && tailorUID) {
												localStorage.removeItem(
													`stripe_onboarding_url_${tailorUID}`
												);
											}
											setLoadingState("idle");
										}}
										className="w-full"
									>
										Cancel
									</Button>
								</div>
							) : null;
						})()}
						{(() => {
						const storedUrl = typeof window !== "undefined" && tailorUID
							? localStorage.getItem(`stripe_onboarding_url_${tailorUID}`)
							: null;
						const shouldShowConnectButton = !onboardingUrl && !onboardingUrlRef.current && !storedUrl;
					return shouldShowConnectButton;
					})() && (
							<Button
								onClick={async () => {
									console.log("[DEBUG] Connect with Stripe button clicked", {
										hasAccountId: !!accountId,
										accountId,
										loadingState,
										currentOnboardingUrl: onboardingUrl,
									});
									// If no accountId, try to create one first
									if (!accountId) {
										console.log("[DEBUG] No accountId, creating account first");
										shouldGetOnboardingLinkRef.current = true;
										await checkExistingAccount();
										// Wait for accountId to be set via useEffect watching accountId changes
										// The checkExistingAccount function will automatically call handleConnectStripe
										// when shouldGetOnboardingLinkRef is true and accountId is set
									} else {
										console.log(
											"[DEBUG] AccountId exists, getting onboarding link"
										);
										handleConnectStripe();
									}
								}}
								disabled={loadingState !== "idle"}
								className="w-full bg-[#635BFF] hover:bg-[#5851DF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{loadingState === "connecting" ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Preparing onboarding link...
									</>
								) : loadingState === "checking" ? (
									<>
										<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
										Checking account...
									</>
								) : (
									<>
										<ExternalLink className="h-4 w-4 mr-2" />
										Connect with Stripe
									</>
								)}
							</Button>
						)}

						{/* Cancel button during operations */}
						{loadingState !== "idle" && (
							<Button
								variant="outline"
								onClick={cancelCurrentOperation}
								className="w-full"
							>
								<X className="h-4 w-4 mr-2" />
								Cancel Operation
							</Button>
						)}

						<p className="text-xs text-gray-500 text-center">
							By connecting, you agree to Stripe's{" "}
							<a
								href="https://stripe.com/connect-account/legal"
								target="_blank"
								rel="noopener noreferrer"
								className="underline"
							>
								Connected Account Agreement
							</a>
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Account is set up
	return (
		<div className="space-y-6">
			{renderErrorState()}
			{renderSuccessState()}

			{/* Account Status Card */}
			<Card className="border-2 border-emerald-100">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center">
							<CheckCircle className="h-5 w-5 mr-2 text-emerald-600" />
							Stripe Account Connected
							{accountStatus.cached && (
								<Badge variant="secondary" className="ml-2 text-xs">
									Cached
								</Badge>
							)}
						</CardTitle>
						<div className="flex space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleRefreshStatus(false)}
								disabled={loadingState === "refreshing"}
							>
								<RefreshCw
									className={`h-4 w-4 mr-2 ${
										loadingState === "refreshing" ? "animate-spin" : ""
									}`}
								/>
								{loadingState === "refreshing" ? "Refreshing..." : "Refresh"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleRefreshStatus(true)}
								disabled={loadingState === "refreshing"}
								title="Force refresh from Stripe (bypasses cache)"
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Force Refresh
							</Button>
						</div>
					</div>
					<CardDescription className="flex items-center justify-between">
						<span>
							Your Stripe account is active and ready to receive payouts
						</span>
						{accountStatus.lastUpdated && (
							<span className="text-xs text-gray-500">
								Last updated:{" "}
								{new Date(accountStatus.lastUpdated).toLocaleString()}
							</span>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Enhanced refresh progress */}
					{loadingState === "refreshing" && operationProgress > 0 && (
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Refreshing account status...</span>
								<span>{operationProgress}%</span>
							</div>
							<Progress value={operationProgress} className="h-2" />
						</div>
					)}

					{/* Enhanced Status Indicators */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="space-y-1">
							<p className="text-xs text-gray-500">Charges</p>
							<div className="flex items-center">
								{accountStatus.chargesEnabled ? (
									<>
										<CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
										<span className="text-sm font-medium text-emerald-600">
											Enabled
										</span>
									</>
								) : (
									<>
										<AlertCircle className="h-4 w-4 text-orange-600 mr-1" />
										<span className="text-sm font-medium text-orange-600">
											Disabled
										</span>
									</>
								)}
							</div>
						</div>

						<div className="space-y-1">
							<p className="text-xs text-gray-500">Payouts</p>
							<div className="flex items-center">
								{accountStatus.payoutsEnabled ? (
									<>
										<CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
										<span className="text-sm font-medium text-emerald-600">
											Enabled
										</span>
									</>
								) : (
									<>
										<AlertCircle className="h-4 w-4 text-orange-600 mr-1" />
										<span className="text-sm font-medium text-orange-600">
											Disabled
										</span>
									</>
								)}
							</div>
						</div>

						{/* Enhanced Capabilities Display */}
						<div className="space-y-1">
							<p className="text-xs text-gray-500">Card Payments</p>
							<Badge
								variant={
									accountStatus.capabilities?.cardPayments === "active"
										? "default"
										: "secondary"
								}
								className="text-xs"
							>
								{accountStatus.capabilities?.cardPayments || "inactive"}
							</Badge>
						</div>

						<div className="space-y-1">
							<p className="text-xs text-gray-500">Transfers</p>
							<Badge
								variant={
									accountStatus.capabilities?.transfers === "active"
										? "default"
										: "secondary"
								}
								className="text-xs"
							>
								{accountStatus.capabilities?.transfers || "inactive"}
							</Badge>
						</div>
					</div>

					{/* Account Details */}
					<div className="grid grid-cols-2 gap-4 pt-4 border-t">
						<div className="space-y-1">
							<p className="text-xs text-gray-500">Account ID</p>
							<p className="text-sm font-mono">{accountStatus.accountId}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-gray-500">Country</p>
							<p className="text-sm">{accountStatus.country}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-gray-500">Email</p>
							<p className="text-sm">{accountStatus.email}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-gray-500">Currency</p>
							<p className="text-sm">
								{accountStatus.defaultCurrency.toUpperCase()}
							</p>
						</div>
					</div>

					{/* Enhanced Requirements Display */}
					{(accountStatus.requirements.currentlyDue.length > 0 ||
						accountStatus.requirements.pastDue.length > 0 ||
						accountStatus.requirements.errors.length > 0) && (
						<Alert className="border-orange-200 bg-orange-50">
							<AlertCircle className="h-4 w-4 text-orange-600" />
							<AlertDescription>
								<div className="space-y-3">
									<p className="font-medium text-orange-900">Action Required</p>

									{accountStatus.requirements.pastDue.length > 0 && (
										<div>
											<p className="text-sm font-medium text-red-800 mb-1">
												Past Due Items:
											</p>
											<ul className="text-sm text-red-700 list-disc list-inside">
												{accountStatus.requirements.pastDue.map((item, idx) => (
													<li key={idx}>{item.replace(/_/g, " ")}</li>
												))}
											</ul>
										</div>
									)}

									{accountStatus.requirements.currentlyDue.length > 0 && (
										<div>
											<p className="text-sm font-medium text-orange-800 mb-1">
												Currently Due:
											</p>
											<ul className="text-sm text-orange-700 list-disc list-inside">
												{accountStatus.requirements.currentlyDue.map(
													(item, idx) => (
														<li key={idx}>{item.replace(/_/g, " ")}</li>
													)
												)}
											</ul>
										</div>
									)}

									{accountStatus.requirements.errors.length > 0 && (
										<div>
											<p className="text-sm font-medium text-red-800 mb-1">
												Errors:
											</p>
											<ul className="text-sm text-red-700 list-disc list-inside">
												{accountStatus.requirements.errors.map((error, idx) => (
													<li key={idx}>
														{error.reason} ({error.requirement})
													</li>
												))}
											</ul>
										</div>
									)}

									{accountStatus.requirements.disabledReason && (
										<div>
											<p className="text-sm font-medium text-red-800 mb-1">
												Account Disabled:
											</p>
											<p className="text-sm text-red-700">
												{accountStatus.requirements.disabledReason}
											</p>
										</div>
									)}

									<Button
										variant="outline"
										size="sm"
										onClick={handleConnectStripe}
										disabled={loadingState === "connecting"}
										className="mt-3"
									>
										{loadingState === "connecting" ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Connecting...
											</>
										) : (
											<>
												<ExternalLink className="h-4 w-4 mr-2" />
												Complete Setup
											</>
										)}
									</Button>
								</div>
							</AlertDescription>
						</Alert>
					)}

					{/* Stripe Dashboard Link */}
					<div className="pt-4 border-t">
						<Button
							variant="outline"
							className="w-full"
							onClick={() =>
								window.open("https://dashboard.stripe.com", "_blank")
							}
						>
							<ExternalLink className="h-4 w-4 mr-2" />
							Open Stripe Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Enhanced Balance Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Account Balance</CardTitle>
							<CardDescription>
								Your current Stripe balance
								{accountStatus.balance.livemode ? (
									<Badge variant="default" className="ml-2">
										Live
									</Badge>
								) : (
									<Badge variant="secondary" className="ml-2">
										Test
									</Badge>
								)}
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleRefreshStatus(true)}
							disabled={loadingState === "refreshing"}
							title="Refresh balance from Stripe"
						>
							<RefreshCw
								className={`h-4 w-4 ${
									loadingState === "refreshing" ? "animate-spin" : ""
								}`}
							/>
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Available Balance */}
						<div className="space-y-2">
							<p className="text-xs text-gray-500 flex items-center">
								<CheckCircle className="h-3 w-3 mr-1 text-emerald-500" />
								Available
							</p>
							{accountStatus.balance.available.length > 0 ? (
								accountStatus.balance.available.map((bal, idx) => (
									<p key={idx} className="text-2xl font-bold text-emerald-600">
										{formatAmount(bal.amount, bal.currency)}
									</p>
								))
							) : (
								<p className="text-2xl font-bold text-gray-400">$0.00</p>
							)}
						</div>

						{/* Pending Balance */}
						<div className="space-y-2">
							<p className="text-xs text-gray-500 flex items-center">
								<Clock className="h-3 w-3 mr-1 text-orange-500" />
								Pending
							</p>
							{accountStatus.balance.pending.length > 0 ? (
								accountStatus.balance.pending.map((bal, idx) => (
									<p key={idx} className="text-2xl font-bold text-orange-600">
										{formatAmount(bal.amount, bal.currency)}
									</p>
								))
							) : (
								<p className="text-2xl font-bold text-gray-400">$0.00</p>
							)}
						</div>

						{/* Connect Reserved Balance */}
						<div className="space-y-2">
							<p className="text-xs text-gray-500 flex items-center">
								<AlertCircle className="h-3 w-3 mr-1 text-blue-500" />
								Reserved
							</p>
							{accountStatus.balance.connectReserved &&
							accountStatus.balance.connectReserved.length > 0 ? (
								accountStatus.balance.connectReserved.map((bal, idx) => (
									<p key={idx} className="text-2xl font-bold text-blue-600">
										{formatAmount(bal.amount, bal.currency)}
									</p>
								))
							) : (
								<p className="text-2xl font-bold text-gray-400">$0.00</p>
							)}
						</div>
					</div>

					{/* Balance explanation */}
					<div className="mt-4 p-3 bg-gray-50 rounded-lg">
						<p className="text-xs text-gray-600">
							<strong>Available:</strong> Funds ready for payout.
							<strong className="ml-2">Pending:</strong> Funds being processed.
							<strong className="ml-2">Reserved:</strong> Funds held by Stripe.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Enhanced Account Information Card */}
			<Card>
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
					<CardDescription>
						Details about your Stripe Connect account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-3">
							<div>
								<p className="text-xs text-gray-500">Account ID</p>
								<p className="text-sm font-mono bg-gray-100 p-1 rounded">
									{accountStatus.accountId}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500">Email</p>
								<p className="text-sm">{accountStatus.email}</p>
							</div>
							<div>
								<p className="text-xs text-gray-500">Country</p>
								<p className="text-sm">{accountStatus.country}</p>
							</div>
						</div>
						<div className="space-y-3">
							<div>
								<p className="text-xs text-gray-500">Currency</p>
								<p className="text-sm">
									{accountStatus.defaultCurrency.toUpperCase()}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500">Account Type</p>
								<Badge variant="outline">{accountStatus.type}</Badge>
							</div>
							<div>
								<p className="text-xs text-gray-500">Created</p>
								<p className="text-sm">
									{new Date(accountStatus.created * 1000).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>

					{/* Business Profile */}
					{accountStatus.businessProfile?.name && (
						<div className="mt-4 pt-4 border-t">
							<h4 className="text-sm font-medium mb-2">Business Profile</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-xs text-gray-500">Business Name</p>
									<p>{accountStatus.businessProfile.name}</p>
								</div>
								{accountStatus.businessProfile.supportEmail && (
									<div>
										<p className="text-xs text-gray-500">Support Email</p>
										<p>{accountStatus.businessProfile.supportEmail}</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() =>
								window.open("https://dashboard.stripe.com", "_blank")
							}
						>
							<ExternalLink className="h-4 w-4 mr-2" />
							Open Stripe Dashboard
						</Button>
						<Button
							variant="outline"
							onClick={handleConnectStripe}
							disabled={loadingState === "connecting"}
							className="flex-1"
						>
							{loadingState === "connecting" ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Connecting...
								</>
							) : (
								<>
									<ExternalLink className="h-4 w-4 mr-2" />
									Update Account
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Payout History Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<TrendingUp className="h-5 w-5 mr-2" />
						Payout History
					</CardTitle>
					<CardDescription>
						View your earnings history and transaction details
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PayoutHistory tailorUID={tailorUID} />
				</CardContent>
			</Card>
		</div>
	);
};
