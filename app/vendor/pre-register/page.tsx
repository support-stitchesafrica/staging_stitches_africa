"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { VendorSLAAgreement } from "@/components/vendor/VendorSLAAgreement";

const preRegisterSchema = z.object({
	fullName: z.string().min(2, "Full name is required"),
	email: z.string().email("Invalid email"),
	phone: z.string().min(10, "Phone number is required"),
	businessName: z.string().optional(),
	category: z.string().optional(),
	brand_logo: z.any().optional(),
});

type PreRegisterValues = z.infer<typeof preRegisterSchema>;

export default function PreRegisterPage()
{
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [acceptedSLA, setAcceptedSLA] = useState(false);
	const [showSLADialog, setShowSLADialog] = useState(false);

	const form = useForm<PreRegisterValues>({
		resolver: zodResolver(preRegisterSchema),
		defaultValues: {
			fullName: "",
			email: "",
			phone: "",
			businessName: "",
			category: "",
			brand_logo: undefined,
		},
	});

	// Handle logo upload
	const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) =>
	{
		const file = e.target.files?.[0];
		if (file)
		{
			setLogoFile(file);
			setLogoPreview(URL.createObjectURL(file));
			form.setValue("brand_logo", file, { shouldValidate: true });
		}
	};

	const handleSubmit = async (data: PreRegisterValues) =>
	{
		if (!acceptedSLA)
		{
			toast.error("You must accept the Vendor Platform Agreement to continue");
			return;
		}

		setLoading(true);
		try
		{
			let brandLogoUrl =
				"https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png"; // Default fallback

			// Upload logo if provided
			if (logoFile)
			{
				try
				{
					const { uploadImageService } = await import(
						"@/vendor-services/uploadImageService"
					);
					// Use email as temporary ID for pre-registration uploads
					const tempId = `prereg_${Date.now()}`;
					brandLogoUrl = await uploadImageService(logoFile, tempId);
				} catch (uploadError)
				{
					console.error("Logo upload failed, using fallback:", uploadError);
					// Continue with fallback logo
				}
			}

			const response = await fetch("/api/vendor/pre-register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...data,
					brand_logo: brandLogoUrl,
				}),
			});

			const result = await response.json();

			if (!response.ok)
			{
				throw new Error(result.error || "Submission failed");
			}

			setSubmitted(true);
			toast.success("Application submitted successfully!");
		} catch (error: any)
		{
			console.error("Pre-registration error:", error);
			toast.error(error.message || "Submission failed. Please try again.");
		} finally
		{
			setLoading(false);
		}
	};

	if (submitted)
	{
		return (
			<div className="min-h-screen flex flex-col md:flex-row">
				{/* Left section - similar to signup page */}
				<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
					<div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
					<img
						src="/images/african-fashion-6.png"
						alt="Fashion Design"
						className="absolute inset-0 w-full h-full object-cover opacity-20"
					/>

					<div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
						<div className="space-y-6 text-center">
							<CheckCircle2 className="h-20 w-20 text-emerald-400 mx-auto" />
							<h2 className="text-4xl font-bold">Application Received!</h2>
							<p className="text-lg text-gray-300 max-w-md">
								Thank you for your interest in becoming a Stitches Africa
								vendor.
							</p>
						</div>
					</div>
				</div>

				{/* Right section - confirmation */}
				<div className="flex w-full lg:w-1/2 items-center justify-center p-6 bg-white">
					<div className="max-w-md text-center space-y-6">
						<div className="lg:hidden">
							<CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
						</div>
						<h2 className="text-3xl font-bold text-gray-900">
							Application Received!
						</h2>
						<div className="space-y-4 text-gray-600">
							<p>
								Thank you for your interest in becoming a Stitches Africa
								vendor.
							</p>
							<p>
								Our onboarding team will review your application and reach out
								to you shortly via email or phone to guide you through the next
								steps.
							</p>
							<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
								<p className="font-semibold text-amber-900">What's Next?</p>
								<ul className="mt-2 space-y-1 text-left text-amber-800">
									<li>• Our team will verify your information</li>
									<li>• You'll receive a personalized signup link</li>
									<li>• Complete your full vendor registration</li>
									<li>• Start selling on Stitches Africa!</li>
								</ul>
							</div>
						</div>
						<Link
							href="/"
							className="inline-block text-sm text-gray-500 hover:text-gray-700"
						>
							← Back to Home
						</Link>
					</div>
				</div>
			</div>
		);
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
									Join Africa's Premier Fashion Marketplace
								</span>
							</div>
							<h2 className="text-4xl font-bold leading-tight">
								Start Your Vendor <br />
								<span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
									Journey Today
								</span>
							</h2>
							<p className="text-lg text-gray-300 leading-relaxed">
								Apply to become a verified vendor on Stitches Africa. Our team
								will guide you through a simple onboarding process.
							</p>
						</div>

						<div className="space-y-3 text-sm">
							<div className="flex items-center space-x-3">
								<div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
								<span>Quick & Simple Application</span>
							</div>
							<div className="flex items-center space-x-3">
								<div className="w-2 h-2 bg-blue-400 rounded-full"></div>
								<span>Dedicated Onboarding Support</span>
							</div>
							<div className="flex items-center space-x-3">
								<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
								<span>Verified Vendor Status</span>
							</div>
							<div className="flex items-center space-x-3">
								<div className="w-2 h-2 bg-pink-400 rounded-full"></div>
								<span>Access to Global Market</span>
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
			<div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-10 bg-white">
				<div className="w-full max-w-md">
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-5"
					>
						<div className="space-y-2">
							<h2 className="text-2xl font-bold text-gray-900">
								Become a Vendor
							</h2>
							<p className="text-sm text-gray-600">
								Fill out this quick form and our team will reach out to you
								shortly.
							</p>
						</div>

						{/* Brand Logo Upload (Optional) */}
						<div className="flex flex-col items-center space-y-2">
							<div className="relative">
								<div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
									{logoPreview ? (
										<img
											src={logoPreview}
											alt="Brand Logo Preview"
											className="object-cover w-full h-full"
										/>
									) : (
										<span className="text-gray-400 text-xs text-center px-2">
											Upload Logo
										</span>
									)}
								</div>
								<input
									type="file"
									accept="image/*"
									onChange={handleLogoChange}
									className="absolute inset-0 opacity-0 cursor-pointer"
									disabled={loading}
								/>
							</div>
							<span className="text-xs text-gray-500">
								Brand Logo (optional - defaults to Stitches Africa logo)
							</span>
						</div>

						{/* Full Name */}
						<div>
							<Label htmlFor="fullName" className="text-gray-700">
								Full Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="fullName"
								{...form.register("fullName")}
								placeholder="John Doe"
								className="mt-1 bg-white border-gray-300 text-gray-900"
								disabled={loading}
							/>
							{form.formState.errors.fullName && (
								<p className="text-xs text-red-500 mt-1">
									{form.formState.errors.fullName.message}
								</p>
							)}
						</div>

						{/* Email */}
						<div>
							<Label htmlFor="email" className="text-gray-700">
								Email Address <span className="text-red-500">*</span>
							</Label>
							<Input
								id="email"
								{...form.register("email")}
								type="email"
								placeholder="you@example.com"
								className="mt-1 bg-white border-gray-300 text-gray-900"
								disabled={loading}
							/>
							{form.formState.errors.email && (
								<p className="text-xs text-red-500 mt-1">
									{form.formState.errors.email.message}
								</p>
							)}
						</div>

						{/* Phone */}
						<div>
							<Label htmlFor="phone" className="text-gray-700">
								Phone Number <span className="text-red-500">*</span>
							</Label>
							<Input
								id="phone"
								{...form.register("phone")}
								placeholder="+2348012345678"
								className="mt-1 bg-white border-gray-300 text-gray-900"
								disabled={loading}
							/>
							{form.formState.errors.phone && (
								<p className="text-xs text-red-500 mt-1">
									{form.formState.errors.phone.message}
								</p>
							)}
						</div>

						{/* Business Name (Optional) */}
						<div>
							<Label htmlFor="businessName" className="text-gray-700">
								Business Name <span className="text-xs text-red-500">*</span>
							</Label>
							<Input
								id="businessName"
								{...form.register("businessName")}
								placeholder="My Fashion Brand"
								className="mt-1 bg-white border-gray-300 text-gray-900"
								disabled={loading}
							/>
						</div>

						{/* Category (Optional) */}
						<div>
							<Label htmlFor="category" className="text-gray-700">
								Category (Optional)
							</Label>
							<Input
								id="category"
								{...form.register("category")}
								placeholder="e.g., Bespoke, Ready to Wear"
								className="mt-1 bg-white border-gray-300 text-gray-900"
								disabled={loading}
							/>
							<p className="text-xs text-gray-500 mt-1">
								What type of fashion products do you create?
							</p>
						</div>

						{/* SLA Agreement */}
						<div className="space-y-3 mt-4">
							<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
										<span className="text-xs text-red-500">(Required)</span>
									</span>
								</label>
							</div>
						</div>

						{/* Submit Button */}
						<Button
							type="submit"
							className="w-full bg-black text-white hover:bg-gray-800"
							disabled={loading || !acceptedSLA}
						>
							{loading ? "Submitting Application..." : "Submit Application"}
						</Button>

						{/* Already have account */}
						<p className="text-center text-sm text-gray-600">
							Already approved?{" "}
							<Link
								href="/vendor"
								className="text-black font-semibold hover:underline"
							>
								Sign In
							</Link>
						</p>
					</form>

					{/* SLA Agreement Modal */}
					<VendorSLAAgreement
						open={showSLADialog}
						onOpenChange={setShowSLADialog}
						brandName={form.watch("businessName") || "[Your Brand Name]"}
						businessAddress="[Your Business Address]"
						onAccept={() =>
						{
							setAcceptedSLA(true);
							setShowSLADialog(false);
							toast.success("Vendor Agreement accepted");
						}}
						onDecline={() =>
						{
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
