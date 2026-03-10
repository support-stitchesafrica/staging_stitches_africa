"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { freeGiftRepository } from "@/lib/firestore";
import { Loader2, X, Gift, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface State {
	name: string;
	state_code: string;
}

interface Country {
	name: string;
	iso3: string;
	iso2: string;
	states: State[];
}

export function FreeGiftPopup() {
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState<"intro" | "form" | "success">("intro");
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		address: "",
		city: "",
		state: "",
		country: "",
		postCode: "",
	});

	const [countries, setCountries] = useState<Country[]>([]);
	const [availableStates, setAvailableStates] = useState<State[]>([]);

	const fireFlowerConfetti = () => {
		confetti({
			particleCount: 120,
			spread: 70,
			origin: { y: 0.6 },
			shapes: ["circle"],
			colors: ["#0F5132", "#C6A75E", "#F2E8CF", "#6B8E23"],
			scalar: 1.2,
		});

		confetti({
			particleCount: 60,
			angle: 60,
			spread: 55,
			origin: { x: 0 },
			colors: ["#C6A75E"],
		});

		confetti({
			particleCount: 60,
			angle: 120,
			spread: 55,
			origin: { x: 1 },
			colors: ["#0F5132"],
		});
	};

	useEffect(() => {
		// Check local storage/session storage logic
		const hasClaimed = localStorage.getItem("stitches_free_gift_claimed");
		const hasSeenSession = sessionStorage.getItem("stitches_free_gift_seen");

		if (!hasClaimed && !hasSeenSession) {
			// Show after a small delay
			const timer = setTimeout(() => {
				setIsOpen(true);
				sessionStorage.setItem("stitches_free_gift_seen", "true");
				// Optional: Fire confetti on open if desired, but usually better on success
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, []);

	// Fetch countries and states
	useEffect(() => {
		const fetchCountries = async () => {
			try {
				const response = await fetch("/jsons/countries_and_states.json");
				const data = await response.json();
				if (!data.error && data.data) {
					setCountries(data.data);
				}
			} catch (error) {
				console.error("Error fetching countries:", error);
			}
		};
		fetchCountries();
	}, []);

	// Update available states when country changes
	useEffect(() => {
		if (formData.country) {
			const selectedCountry = countries.find(
				(c) => c.name === formData.country
			);
			if (selectedCountry) {
				setAvailableStates(selectedCountry.states);
				// Clear state if it doesn't belong to the new country
				if (
					formData.state &&
					!selectedCountry.states.find((s) => s.name === formData.state)
				) {
					setFormData((prev) => ({ ...prev, state: "" }));
				}
			} else {
				setAvailableStates([]);
			}
		} else {
			setAvailableStates([]);
		}
	}, [formData.country, countries]);

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleClaimClick = () => {
		setStep("form");
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Basic validation
			if (
				!formData.email ||
				!formData.address ||
				!formData.country ||
				!formData.state
			) {
				toast.error("Please fill in all required fields");
				setLoading(false);
				return;
			}

			await freeGiftRepository.claimGift(formData);

			localStorage.setItem("stitches_free_gift_claimed", "true");
			setStep("success");
			fireFlowerConfetti(); // Fire confetti on success
			toast.success("Gift claimed successfully!");
		} catch (error: any) {
			console.error("Error claiming gift:", error);
			toast.error(error.message || "Failed to claim gift. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const backdropVariants: Variants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1 },
	};

	const modalVariants: Variants = {
		hidden: { scale: 0.9, opacity: 0, y: 20 },
		visible: {
			scale: 1,
			opacity: 1,
			y: 0,
			transition: { type: "spring", duration: 0.5 },
		},
		exit: { scale: 0.9, opacity: 0, y: 20 },
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
					variants={backdropVariants}
					initial="hidden"
					animate="visible"
					exit="hidden"
				>
					<motion.div
						className="relative w-full sm:w-[90%] max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
						variants={modalVariants}
					>
						{/* Close Button */}
						<div className="absolute right-4 top-4 z-10">
							<button
								onClick={handleClose}
								className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						{/* Content Switcher */}
						<div className="flex-1 overflow-y-auto p-6 sm:p-8">
							<AnimatePresence mode="wait">
								{step === "intro" && (
									<motion.div
										key="intro"
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: 20 }}
										className="text-center py-4"
									>
										<div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center text-5xl shadow-inner">
											🎁
										</div>
										<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
											Hooray! A Free Gift 🎉
										</h2>
										<p className="mx-auto max-w-xs text-gray-600 leading-relaxed mb-8 text-base">
											You’ve unlocked a special Stitches Africa surprise. Claim
											your free gift and elevate your African style.
										</p>
										<button
											onClick={handleClaimClick}
											className="w-full rounded-xl bg-gradient-to-r from-green-900 to-green-700 py-4 text-white font-bold text-lg hover:opacity-90 transition shadow-xl shadow-green-900/20 active:scale-[0.98]"
										>
											🎁 Claim My Free Gift
										</button>
									</motion.div>
								)}

								{step === "form" && (
									<motion.div
										key="form"
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: -20 }}
									>
										<div className="mb-6 text-center">
											<div className="flex items-center justify-center gap-2 mb-2">
												<span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">
													1
												</span>
												<div className="h-1 w-8 bg-gray-100 rounded-full"></div>
												<span className="h-8 w-8 rounded-full bg-green-900 text-white flex items-center justify-center text-sm font-bold shadow-lg">
													2
												</span>
												<div className="h-1 w-8 bg-gray-100 rounded-full"></div>
												<span className="h-8 w-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-bold">
													3
												</span>
											</div>
											<h3 className="text-xl font-bold text-gray-900">
												Shipping Details 🚚
											</h3>
											<p className="text-sm text-gray-500">
												Where should we send your gift?
											</p>
										</div>

										<form onSubmit={handleSubmit} className="space-y-4">
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div>
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
														First Name
													</label>
													<input
														type="text"
														name="firstName"
														required
														value={formData.firstName}
														onChange={handleInputChange}
														className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium"
														placeholder="John"
													/>
												</div>
												<div>
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
														Last Name
													</label>
													<input
														type="text"
														name="lastName"
														required
														value={formData.lastName}
														onChange={handleInputChange}
														className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium"
														placeholder="Doe"
													/>
												</div>
											</div>

											<div>
												<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
													Email Address
												</label>
												<input
													type="email"
													name="email"
													required
													value={formData.email}
													onChange={handleInputChange}
													className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium"
													placeholder="john@example.com"
												/>
											</div>

											<div>
												<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
													Address
												</label>
												<input
													type="text"
													name="address"
													required
													value={formData.address}
													onChange={handleInputChange}
													className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium"
													placeholder="123 Fashion St"
												/>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div>
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
														Country
													</label>
													<div className="relative">
														<select
															name="country"
															required
															value={formData.country}
															onChange={handleInputChange}
															className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium pr-8"
														>
															<option value="">Select Country</option>
															{countries.map((country) => (
																<option key={country.iso3} value={country.name}>
																	{country.name}
																</option>
															))}
														</select>
														<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
															<svg
																className="h-4 w-4 fill-current"
																viewBox="0 0 20 20"
															>
																<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
															</svg>
														</div>
													</div>
												</div>
												<div>
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
														State
													</label>
													<div className="relative">
														<select
															name="state"
															required
															value={formData.state}
															onChange={handleInputChange}
															disabled={
																!formData.country ||
																availableStates.length === 0
															}
															className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400 transition-all font-medium pr-8"
														>
															<option value="">Select State</option>
															{availableStates.map((state) => (
																<option
																	key={state.state_code}
																	value={state.name}
																>
																	{state.name}
																</option>
															))}
														</select>
														<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
															<svg
																className="h-4 w-4 fill-current"
																viewBox="0 0 20 20"
															>
																<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
															</svg>
														</div>
													</div>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
														City
													</label>
													<input
														type="text"
														name="city"
														required
														value={formData.city}
														onChange={handleInputChange}
														className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium"
														placeholder="City"
													/>
												</div>
												<div>
													<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
														Post Code
													</label>
													<input
														type="text"
														name="postCode"
														required
														value={formData.postCode}
														onChange={handleInputChange}
														className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base focus:border-green-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all font-medium"
														placeholder="10001"
													/>
												</div>
											</div>

											<button
												type="submit"
												disabled={loading}
												className="mt-6 w-full rounded-xl bg-gradient-to-r from-green-900 to-green-700 py-4 font-bold text-white hover:opacity-90 transition-all shadow-xl shadow-green-900/20 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
											>
												{loading ? (
													<span className="flex items-center justify-center">
														<Loader2 className="mr-2 h-5 w-5 animate-spin" />
														Processing...
													</span>
												) : (
													"🎁 Claim My Gift"
												)}
											</button>
										</form>
									</motion.div>
								)}

								{step === "success" && (
									<motion.div
										key="success"
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="flex flex-col items-center justify-center py-8 text-center"
									>
										<motion.div
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{
												type: "spring",
												stiffness: 200,
												damping: 20,
											}}
											className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-green-100 text-green-600 text-6xl shadow-inner ring-8 ring-green-50"
										>
											🎉
										</motion.div>
										<h3 className="mb-3 text-2xl font-bold text-gray-900">
											You're on the list!
										</h3>
										<p className="mb-10 text-gray-600 leading-relaxed max-w-sm mx-auto">
											We've received your details. Your exclusive free gift will
											be processed soon.
											<br />
											<span className="text-sm font-medium text-green-700 mt-2 block">
												Check your email for confirmation!
											</span>
										</p>
										<button
											onClick={handleClose}
											className="w-full rounded-xl bg-gray-900 py-4 font-bold text-white hover:bg-gray-800 transition-all shadow-lg text-lg"
										>
											Continue Shopping
										</button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
