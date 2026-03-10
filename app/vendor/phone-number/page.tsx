"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPhoneNumber } from "@/vendor-services/youVerifyService";
import {
	saveIdentityVerification,
	verifyAndUpdateIdentity,
} from "@/vendor-services/firebaseService";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { getCurrentUserId } from "@/lib/globalFunctions";
import { ArrowLeft } from "lucide-react";

export default function PhoneNumberScreen() {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const { user } = useAuth();

	const [userId, setUserId] = useState<string | null>(null);

	// ✅ fallback to localStorage if getCurrentUserId is null
	useEffect(() => {
		const id = getCurrentUserId();
		if (id) {
			setUserId(id);
		} else if (typeof window !== "undefined") {
			const tailorUID = localStorage.getItem("tailorUID");
			if (tailorUID) {
				setUserId(tailorUID);
				console.log("Fallback userId from localStorage:", tailorUID);
			} else {
				toast.warning("No userId found");
			}
		}
	}, []);

	const handleVerifyNow = async () => {
		if (!phoneNumber) {
			toast.error("Please fill in your phone number");
			return;
		}

		if (!userId) {
			toast.error("User not authenticated");
			return;
		}

		try {
			setLoading(true);

			// Call YouVerify API
			const response = await verifyPhoneNumber({
				mobile: phoneNumber,
				isSubjectConsent: true,
				isLive: true,
			});

			if (!response?.data?.phoneDetails) {
				toast.error("Identity verification failed. Please try again.");
				return;
			}

			const fullName = response.data.phoneDetails[0].fullName;
			const idNumber = response.data.idNumber;

			// Save to Firestore
			await saveIdentityVerification({
				userId,
				idNumber,
				fullName,
				verificationType: "phone number",
				countryCode: "NG",
			});

			// Update status in Firestore
			await verifyAndUpdateIdentity(userId);

			toast.success("Identity verified successfully!");
			router.push("/company-proof-of-address");
		} catch (error: any) {
			console.error("Verification error:", error);
			toast.error(error.message || "Verification failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
			{/* Card */}
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
				{/* AppBar */}
				<div className="flex items-center mb-6">
					<button
						onClick={() => router.back()}
						className="p-2 rounded-full hover:bg-gray-100 transition"
					>
						<ArrowLeft className="w-6 h-6 text-gray-700" />
					</button>
				</div>

				{/* Title */}
				<h1 className="text-2xl font-bold text-gray-900 text-center">
					Phone Number Verification
				</h1>
				<p className="text-gray-600 text-center mt-2">
					Enter your phone number to continue.
				</p>

				{/* Form */}
				<div className="mt-8">
					<label className="block text-gray-700 font-medium mb-2">
						Valid Phone Number
					</label>
					<input
						type="text"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 border-gray-300 focus:ring-black"
						placeholder="Enter phone number"
					/>

					{/* Verify Button */}
					<button
						onClick={handleVerifyNow}
						disabled={loading}
						className="w-full bg-black text-white py-3 rounded-xl font-semibold mt-6 shadow-md hover:bg-gray-800 disabled:opacity-50 transition"
					>
						{loading ? "Verifying..." : "Verify Now"}
					</button>
				</div>
			</div>
		</div>
	);
}
