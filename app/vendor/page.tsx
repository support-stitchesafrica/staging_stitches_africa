"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { loginTailor } from "@/vendor-services/userAuth";
import { auth } from "@/firebase";

export default function ModernLoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		const result = await loginTailor(email, password);

		if (!result.success) {
			toast.error(result.message || "Login failed");
			setIsLoading(false);
			return;
		}

		try {
			await fetch("/api/send-admin-login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					to: email,
					adminName: auth.currentUser?.displayName || "Vendor",
					token: localStorage.getItem("tailorToken"),
				}),
			});
		} catch (err) {
			console.error("Failed to send login email:", err);
		}

		toast.success("Welcome back!");
		router.push("/vendor/dashboard");
		setIsLoading(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
			{/* Background Pattern */}

			<div className="relative min-h-screen flex">
				{/* Left Section - Hero */}
				<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
					<img
						src="/images/african-fashion-7.png"
						alt="Fashion Design"
						className="absolute inset-0 w-full h-full object-cover opacity-20"
					/>

					<div className="relative z-10 flex flex-col justify-between p-12 text-white">
						{/* Logo */}
						<div className="flex items-center space-x-3">
							<div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
								<img
									src="/Stitches-Africa-Logo-06.png"
									alt="Stitches Africa"
									className="w-8 h-8 object-contain"
								/>
							</div>
							<div>
								<h1 className="text-xl font-bold">Stitches Africa</h1>
								<p className="text-sm text-gray-300">Vendor Portal</p>
							</div>
						</div>

						{/* Hero Content */}
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
									<Sparkles className="h-4 w-4 text-amber-400" />
									<span className="text-sm font-medium">
										Premium Vendor Experience
									</span>
								</div>
								<h2 className="text-4xl font-bold leading-tight">
									Craft. Create. <br />
									<span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
										Connect.
									</span>
								</h2>
								<p className="text-lg text-gray-300 leading-relaxed">
									Join Africa's premier fashion marketplace. Showcase your
									craftsmanship, reach global customers, and grow your tailoring
									business.
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4 text-sm">
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
										<span>Global Reach</span>
									</div>
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-blue-400 rounded-full"></div>
										<span>Secure Payments</span>
									</div>
								</div>
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
										<span>Analytics Dashboard</span>
									</div>
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-pink-400 rounded-full"></div>
										<span>24/7 Support</span>
									</div>
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="text-sm text-gray-400">
							© 2024 Stitches Africa. Empowering African fashion globally.
						</div>
					</div>
				</div>

				{/* Right Section - Login Form */}
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="w-full max-w-md">
						{/* Mobile Logo */}
						<div className="lg:hidden flex flex-col items-center mb-8">
							<div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
								<img
									src="/Stitches-Africa-Logo-06.png"
									alt="Stitches Africa"
									className="w-10 h-10 object-contain"
								/>
							</div>
							<h1 className="text-2xl font-bold text-gray-900">
								Stitches Africa
							</h1>
							<p className="text-gray-600">Vendor Portal</p>
						</div>

						{/* Back Button */}
						<Button
							variant="ghost"
							className="mb-6 text-gray-600 hover:text-gray-900 p-0"
							onClick={() => router.push("/")}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Home
						</Button>

						{/* Login Card */}
						<Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
							<CardHeader className="space-y-1 pb-6">
								<CardTitle className="text-2xl font-bold text-gray-900">
									Welcome back
								</CardTitle>
								<CardDescription className="text-gray-600">
									Sign in to your vendor account to continue
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={handleLogin} className="space-y-5">
									<div className="space-y-2">
										<Label
											htmlFor="email"
											className="text-sm font-medium text-gray-700"
										>
											Email address
										</Label>
										<div className="relative">
											<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<Input
												id="email"
												type="email"
												placeholder="Enter your email"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												className="pl-10 h-12 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 text-black"
												required
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="password"
											className="text-sm font-medium text-gray-700"
										>
											Password
										</Label>
										<div className="relative">
											<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<Input
												id="password"
												type={showPassword ? "text" : "password"}
												placeholder="Enter your password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className="pl-10 pr-12 h-12 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 text-black"
												required
											/>
											<button
												type="button"
												className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</button>
										</div>
									</div>

									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<input
												id="remember"
												type="checkbox"
												className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 focus:ring-2"
											/>
											<Label
												htmlFor="remember"
												className="text-sm text-gray-600"
											>
												Remember me
											</Label>
										</div>
										<Link
											href="/forgot-password"
											className="text-sm text-gray-900 hover:text-gray-700 font-medium"
										>
											Forgot password?
										</Link>
									</div>

									<Button
										type="submit"
										className="w-full h-12 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-medium shadow-lg"
										disabled={isLoading}
									>
										{isLoading ? (
											<div className="flex items-center space-x-2">
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
												<span>Signing in...</span>
											</div>
										) : (
											"Sign in"
										)}
									</Button>
								</form>

								<div className="mt-6 text-center">
									<p className="text-sm text-gray-600">
										Don't have an account?{" "}
										<Link
											href="/vendor/signup"
											className="text-gray-900 font-medium hover:text-gray-700 transition-colors"
										>
											Create account
										</Link>
									</p>
								</div>

								{/* Social Proof */}
								<div className="mt-8 pt-6 border-t border-gray-100">
									<div className="text-center">
										<p className="text-xs text-gray-500 mb-3">
											Trusted by 1000+ vendors across Africa
										</p>
										<div className="flex items-center justify-center space-x-4 opacity-60">
											<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
											<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
											<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
											<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
