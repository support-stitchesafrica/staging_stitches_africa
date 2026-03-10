"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseAuthService } from "@/vendor-services/authService";
import { createTailorData } from "@/vendor-services/tailorService";
import { addUser } from "@/vendor-services/userService";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/dialog";
import Link from "next/link";
import { loginTailor } from "@/vendor-services/userAuth";
import { uploadImageService } from "@/vendor-services/uploadImageService";
import { Eye, EyeOff, Lock, Sparkles } from "lucide-react";
import Select from "react-select";
import { VendorSLAAgreement } from "@/components/vendor/VendorSLAAgreement";

// ✅ Step 1 schema (multi-select support)
const signupSchema = z.object({
	brandName: z.string().min(1, "Brand name is required"),
	phone: z.string().min(1, "Phone is required"),
	email: z.string().email("Invalid email"),
	password: z.string().min(6, "Password must be at least 6 chars"),
	type: z
		.array(z.enum(["Bespoke", "Ready to Wear"]))
		.min(1, "Select at least one type"),
	brand_logo: z.any().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function SignupPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const authService = new FirebaseAuthService();
	const [loading, setLoading] = useState(false);
	const [tokenValid, setTokenValid] = useState(false);
	const [checkingToken, setCheckingToken] = useState(true);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
	const [acceptedSLA, setAcceptedSLA] = useState(false);
	const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
	const [showSLADialog, setShowSLADialog] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [logoFile, setLogoFile] = useState<File | null>(null);

	const form = useForm<SignupFormValues>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			brandName: "",
			phone: "",
			email: "",
			password: "",
			brand_logo: undefined,
			type: [], // ✅ now array
		},
	});

	// ✅ Verify approval token on mount
	useEffect(() => {
		const token = searchParams.get("token");

		if (!token) {
			toast.error("Invalid access. Please apply first.");
			router.push("/vendor/pre-register");
			return;
		}

		// Verify token with backend
		fetch(`/api/vendor/verify-token?token=${token}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.valid) {
					setTokenValid(true);
					// Pre-fill form with approved data
					if (data.email) form.setValue("email", data.email);
					if (data.phone) form.setValue("phone", data.phone);
					if (data.businessName) form.setValue("brandName", data.businessName);
					// Pre-fill logo preview if available
					if (data.brand_logo) {
						setLogoPreview(data.brand_logo);
						toast.success(
							"Welcome! Your information has been pre-filled for convenience."
						);
					}
				} else {
					toast.error("Invalid or expired token. Please apply again.");
					router.push("/vendor/pre-register");
				}
			})
			.catch((error) => {
				console.error("Token verification error:", error);
				toast.error("Verification failed. Please try again.");
				router.push("/vendor/pre-register");
			})
			.finally(() => setCheckingToken(false));
	}, [searchParams, router, form]);

	// ✅ Handle Logo Upload
	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setLogoFile(file);
			setLogoPreview(URL.createObjectURL(file));
			form.setValue("brand_logo", file, { shouldValidate: true });
		}
	};

	const handleSignup = async (data: SignupFormValues) => {
		if (!acceptedTerms || !acceptedPrivacy || !acceptedSLA) {
			toast.error("You must accept Terms & Conditions, Privacy Policy, and Vendor Agreement");
			return;
		}

		if (!logoFile) {
			toast.error("Brand logo is required");
			return;
		}

		setLoading(true);
		try {
			const userCredential = await authService.registerUserWithEmailAndPassword(
				data.email,
				data.password
			);
			const userId = userCredential.user.uid;

			const brandLogoUrl = await uploadImageService(logoFile, userId);

			// ✅ Save to users collection
			await addUser({
				userId,
				email: data.email,
				isTailor: true,
				role: "verifier",
				firstName: "",
				lastName: "",
				phoneNumber: data.phone,
				brand_logo: brandLogoUrl,
				brand_name: data.brandName,
				type: data.type, // ✅ store as array
			});

			// ✅ Save to tailors collection
			await createTailorData(
				userId,
				"",
				"",
				data.email,
				data.brandName,
				brandLogoUrl,
				data.type // string[]
			);

			// ✅ Update SLA acceptance in tailors collection
			const { doc, updateDoc } = await import("firebase/firestore");
			const { db } = await import("@/firebase");
			const tailorRef = doc(db, "staging_tailors", userId);
			await updateDoc(tailorRef, {
				isSLA: true,
				slaAcceptedAt: new Date().toISOString(),
				slaVersion: "1.0",
			});

			toast.success(
				"Account created successfully. Please check your email to verify."
			);
			await fetch("/api/send-registration-mail", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: localStorage.getItem("tailorToken") || "",
				},
				body: JSON.stringify({
					to: data.email,
					brandName: data.brandName,
					email: data.email,
					type: data.type.join(", "), // ✅ stringify array for email
					logoUrl: "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
				}),
			});

			await loginTailor(data.email, data.password);
			router.push("/vendor/dashboard");
		} catch (error: any) {
			console.error("Signup failed:", error);
			toast.error(error.message || "Signup failed");
		} finally {
			setLoading(false);
		}
	};
	const privacyContent = (
		<div className="max-h-[400px] overflow-y-auto p-4 space-y-1 text-sm">
			{" "}
			<div className="flex justify-center mb-0 mt-[-60px]">
				{" "}
				<img
					src="/Stitches-Africa-Logo-06.png"
					alt="Stitches Afrika Corp Logo"
					className="h-64 w-auto"
				/>{" "}
			</div>{" "}
			<h2 className="text-lg font-bold mt-[-44px]">Privacy Policy</h2>{" "}
			<p>
				<strong>Effective Date:</strong> 23rd July 2025
			</p>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">1. Information We Collect</h3>{" "}
				<p>
					{" "}
					We may collect the following types of information: Personal
					Information including your name, email address, phone number, mailing
					address, date of birth, identification documents, and payment details.
					We also collect Usage Data such as how you access and use our services
					(IP address, browser type, device ID, pages visited), and Cookies &
					Tracking Technologies to improve user experience and analyze usage
					patterns.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">2. How We Use Your Information</h3>{" "}
				<p>
					{" "}
					We use the information we collect to provide and manage our services,
					communicate with you (updates, security alerts), process transactions,
					personalize and improve user experience, and comply with legal
					obligations.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">3. Sharing Your Information</h3>{" "}
				<p>
					{" "}
					We do not sell your personal information. We may share your data with
					service providers who help us operate our services, legal authorities
					when required, or in case of a business transfer such as a merger or
					acquisition.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">4. Data Security</h3>{" "}
				<p>
					{" "}
					We implement reasonable technical and organizational measures to
					protect your personal information from unauthorized access,
					alteration, disclosure, or destruction.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">5. Your Rights</h3>{" "}
				<p>
					{" "}
					Depending on your jurisdiction, you may have the right to access,
					correct, or delete your personal information, withdraw consent, object
					to or restrict certain processing, and lodge a complaint with a data
					protection authority.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">6. Retention of Information</h3>{" "}
				<p>
					{" "}
					We retain your personal data only for as long as necessary to fulfill
					the purposes outlined in this Privacy Policy or as required by law.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">7. Children's Privacy</h3>{" "}
				<p>
					{" "}
					Our services are not intended for individuals under the age of 18. We
					do not knowingly collect data from minors.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">8. Third-Party Links</h3>{" "}
				<p>
					{" "}
					Our platform may contain links to third-party sites. We are not
					responsible for the privacy practices or content of those websites.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">9. Changes to This Policy</h3>{" "}
				<p>
					{" "}
					We may update this Privacy Policy from time to time. Any changes will
					be posted on this page with an updated effective date.{" "}
				</p>{" "}
			</section>{" "}
			<section>
				{" "}
				<h3 className="font-semibold">10. Contact Us</h3>{" "}
				<p>
					{" "}
					If you have any questions about this Privacy Policy or wish to
					exercise your rights, please contact us at: <br />{" "}
					<strong>STITCHES AFRIKA CORP</strong> <br /> Email:
					info@stitchesafrica.com{" "}
				</p>{" "}
			</section>{" "}
		</div>
	);

	// Show loading screen while checking token
	if (checkingToken) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
					<p className="text-gray-600">Verifying your access...</p>
				</div>
			</div>
		);
	}

	// Don't render form if token is invalid (will redirect)
	if (!tokenValid) {
		return null;
	}

	return (
		<div className="min-h-screen flex flex-col md:flex-row">
			{/* Left section with background image */}
			<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
				<img
					src="/images/african-fashion-6.png"
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

			{/* Right section with form */}
			<div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-10">
				<div className="w-full max-w-md">
					<form
						onSubmit={form.handleSubmit(handleSignup)}
						className="space-y-4"
					>
						<h2 className="text-xl font-bold text-gray-900">Create Account</h2>

						{/* Brand Logo Upload */}
						<div className="flex flex-col items-center space-y-2">
							<div className="relative">
								<div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
									{logoPreview ? (
										<img
											src={logoPreview}
											alt="Brand Logo"
											className="object-cover w-full h-full"
										/>
									) : (
										<span className="text-gray-400 text-sm">Upload Logo</span>
									)}
								</div>
								<input
									type="file"
									accept="image/*"
									onChange={handleLogoChange}
									className="absolute inset-0 opacity-0 cursor-pointer"
									required
								/>
							</div>
							<span className="text-xs text-gray-500">
								Brand Logo (required)
							</span>
						</div>

						{/* Brand Name */}
						<div>
							<Label>Brand Name</Label>
							<Input
								{...form.register("brandName")}
								placeholder="My Fashion Brand"
								className="mt-1"
								disabled={loading}
							/>
						</div>

						{/* ✅ Multi-select Type */}
						<div>
							<Label>Type</Label>
							<Select
								isMulti
								options={[
									{ value: "Bespoke", label: "Bespoke" },
									{ value: "Ready to Wear", label: "Ready to Wear" },
								]}
								value={form
									.watch("type")
									?.map((val) => ({ value: val, label: val }))} // sync with form
								onChange={(selected) =>
									form.setValue(
										"type",
										selected.map((s) => s.value),
										{ shouldValidate: true }
									)
								}
								isDisabled={loading}
								className="mt-1"
								styles={{
									control: (base) => ({
										...base,
										borderRadius: "0.375rem", // rounded-md
										borderColor: "#d1d5db", // gray-300
										padding: "2px",
										color: "#000000",
									}),
									option: (base) => ({
										...base,
										color: "#000000",
									}),
									singleValue: (base) => ({
										...base,
										color: "#000000",
									}),
									input: (base) => ({
										...base,
										color: "#000000",
									}),
								}}
							/>
							<p className="text-xs text-gray-500 mt-1">
								You can select multiple types
							</p>
						</div>

						{/* Phone */}
						<div>
							<Label>Phone</Label>
							<Input
								{...form.register("phone")}
								placeholder="+2348012345678"
								className="mt-1"
								disabled={loading}
							/>
						</div>

						{/* Email */}
						<div>
							<Label>Email</Label>
							<Input
								{...form.register("email")}
								type="email"
								placeholder="you@example.com"
								className="mt-1"
								disabled={loading}
							/>
						</div>

						{/* Password */}
						<div>
							<Label htmlFor="password">Password</Label>
							<div className="relative mt-1">
								<Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="********"
									{...form.register("password")}
									disabled={loading}
									className="pl-10 pr-10"
								/>
								<button
									type="button"
									className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
									onClick={() => setShowPassword((prev) => !prev)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{/* Agreements Section */}
						<div className="space-y-3 mt-4">
							<p className="text-sm font-semibold text-gray-900">
								Required Agreements
							</p>
							<div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
								<label className="flex items-start space-x-3 cursor-pointer group">
									<input
										type="checkbox"
										checked={acceptedTerms}
										onChange={(e) => setAcceptedTerms(e.target.checked)}
										disabled={loading}
										className="mt-0.5 h-4 w-4 accent-green-600 cursor-pointer"
									/>
									<span className="text-sm flex-1 group-hover:text-gray-900">
										I accept the{" "}
										<a
											href="/terms"
											target="_blank"
											className="text-green-600 font-semibold hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											Terms & Conditions
										</a>
									</span>
								</label>

								<label className="flex items-start space-x-3 cursor-pointer group">
									<input
										type="checkbox"
										checked={acceptedPrivacy}
										readOnly
										className="mt-0.5 h-4 w-4 accent-green-600 cursor-pointer"
										onClick={() => !loading && setShowPrivacyDialog(true)}
									/>
									<span
										className="text-sm flex-1 group-hover:text-gray-900"
										onClick={() => !loading && setShowPrivacyDialog(true)}
									>
										I accept the{" "}
										<span className="text-green-600 font-semibold hover:underline">
											Privacy Policy
										</span>
									</span>
								</label>

								<label className="flex items-start space-x-3 cursor-pointer group">
									<input
										type="checkbox"
										checked={acceptedSLA}
										readOnly
										className="mt-0.5 h-4 w-4 accent-black cursor-pointer"
										onClick={() => !loading && setShowSLADialog(true)}
									/>
									<span
										className="text-sm flex-1 group-hover:text-gray-900"
										onClick={() => !loading && setShowSLADialog(true)}
									>
										I accept the{" "}
										<span className="text-black font-semibold hover:underline">
											Vendor Platform Agreement
										</span>{" "}
										<span className="text-xs text-gray-500">(Required)</span>
									</span>
								</label>
							</div>
						</div>

						{/* Submit */}
						<Button
							type="submit"
							className="w-full bg-black"
							disabled={loading || !acceptedTerms || !acceptedPrivacy || !acceptedSLA}
						>
							{loading ? "Creating Account..." : "Sign Up"}
						</Button>
					</form>
					{/* Sign In link */}
					<p className="mt-6 text-center text-sm text-gray-600">
						Already have an account?{" "}
						<Link href="/vendor" className="text-black ">
							Signin
						</Link>
					</p>
					{/* Privacy Dialog */}
					{/* Privacy Policy Dialog */}{" "}
					<Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
						{" "}
						<DialogContent className="max-w-lg">
							{" "}
							<DialogHeader> </DialogHeader> {privacyContent}{" "}
							<DialogFooter className="flex justify-end space-x-2 mt-4">
								{" "}
								<Button
									variant="outline"
									onClick={() => setShowPrivacyDialog(false)}
								>
									Cancel
								</Button>{" "}
								<Button
									onClick={() => {
										setAcceptedPrivacy(true);
										setShowPrivacyDialog(false);
									}}
								>
									{" "}
									Agree{" "}
								</Button>{" "}
							</DialogFooter>{" "}
						</DialogContent>{" "}
					</Dialog>

					{/* Vendor SLA Agreement Dialog */}
					<VendorSLAAgreement
						open={showSLADialog}
						onOpenChange={setShowSLADialog}
						brandName={form.watch("brandName") || "[Your Brand Name]"}
						businessAddress="[Your Business Address]"
						onAccept={() => {
							setAcceptedSLA(true);
							setShowSLADialog(false);
							toast.success("Vendor Agreement accepted");
						}}
						onDecline={() => {
							setAcceptedSLA(false);
							setShowSLADialog(false);
							toast.info("You must accept the Vendor Agreement to continue");
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default function SignupPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<div className="text-center space-y-4">
						<div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
						<p className="text-gray-600">Loading...</p>
					</div>
				</div>
			}
		>
			<SignupPageContent />
		</Suspense>
	);
}
