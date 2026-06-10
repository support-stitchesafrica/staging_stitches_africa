"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import
	{
		saveIdentityVerification,
		verifyAndUpdateIdentity,
	} from "@/vendor-services/firebaseService";
import { getCurrentUserId } from "@/lib/globalFunctions";

export default function PhoneNumberScreen()
{
	const [phoneNumber, setPhoneNumber] = useState("");
	const [loading, setLoading] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() =>
	{
		const id = getCurrentUserId();
		if (id)
		{
			setUserId(id);
		} else if (typeof window !== "undefined")
		{
			const tailorUID = localStorage.getItem("tailorUID");
			if (tailorUID)
			{
				setUserId(tailorUID);
			} else
			{
				toast.warning("No userId found");
			}
		}
	}, []);

	const handleVerifyNow = async () =>
	{
		if (!phoneNumber)
		{
			toast.error("Please fill in your phone number");
			return;
		}
		if (!userId)
		{
			toast.error("User not authenticated");
			return;
		}

		try
		{
			setLoading(true);

			await saveIdentityVerification({
				userId,
				idNumber: phoneNumber,
				fullName: "",
				verificationType: "phone number",
				countryCode: "NG",
			});

			await verifyAndUpdateIdentity(userId);

			toast.success("Phone number saved successfully!");
			router.push("/vendor/company-proof-of-address");
		} catch (error: any)
		{
			console.error("Save error:", error);
			toast.error(error.message || "Failed to save. Please try again.");
		} finally
		{
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
				<div className="flex items-center mb-6">
					<button
						onClick={() => router.back()}
						className="p-2 rounded-full hover:bg-gray-100 transition"
					>
						<ArrowLeft className="w-6 h-6 text-gray-300" />
					</button>
				</div>

				<h1 className="text-2xl font-bold text-gray-900 text-center">
					Phone Number Verification
				</h1>
				<p className="text-gray-600 text-center mt-2">
					Enter your phone number to continue.
				</p>

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

					<button
						onClick={handleVerifyNow}
						disabled={loading}
						className="w-full bg-black text-white py-3 rounded-xl font-semibold mt-6 shadow-md hover:bg-gray-800 disabled:opacity-50 transition"
					>
						{loading ? "Saving..." : "Continue"}
					</button>
				</div>
			</div>
		</div>
	);
}
