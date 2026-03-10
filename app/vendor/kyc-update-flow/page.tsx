"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyVerificationEdit } from "@/components/vendor/CompanyVerificationEdit";
import { IdentityVerificationEdit } from "@/components/IdentityVerificationEdit";
import { AddressVerificationEdit } from "@/components/vendor/AddressVerificationEdit";
import { getTailorKyc } from "@/vendor-services/tailorService";
import { Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";

// ✅ Wrapped content in a separate component to isolate useSearchParams safely
function KycUpdateFlowContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [kycData, setKycData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [currentStep, setCurrentStep] = useState(0);

	// Get selected items from URL params
	const company = searchParams.get("company") === "true";
	const identity = searchParams.get("identity") === "true";
	const address = searchParams.get("address") === "true";

	// Build flow array in correct order
	const flow: string[] = [];
	if (company) flow.push("company");
	if (identity) flow.push("identity");
	if (address) flow.push("address");

	useEffect(() => {
		const fetchKycData = async () => {
			const tailorUID = localStorage.getItem("tailorUID");
			if (!tailorUID) {
				router.push("/vendor/settings");
				return;
			}

			try {
				const data = await getTailorKyc(tailorUID);
				setKycData(data);
			} catch (error) {
				console.error("Error fetching KYC data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchKycData();
	}, [router]);

	// Reset KYC approval status to allow future requests
	const resetKycApprovalStatus = async () => {
		try {
			const tailorUID = localStorage.getItem("tailorUID");
			if (!tailorUID) return;

			const userRef = doc(db, "staging_users", tailorUID);
			const tailorRef = doc(db, "staging_tailors", tailorUID);

			const resetPayload = {
				adminApprovedKycUpload: false,
				requestKycUpload: false,
				kycApprovalStatus: "",
				adminNote: null,
				updatedAt: new Date().toISOString(),
			};

			await Promise.all([
				updateDoc(userRef, resetPayload),
				updateDoc(tailorRef, resetPayload),
			]);

			console.log("KYC approval status reset successfully");
		} catch (error) {
			console.error("Error resetting KYC approval status:", error);
		}
	};

	const handleNext = async () => {
		if (currentStep < flow.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			await resetKycApprovalStatus();
			toast.success("KYC documents updated successfully!");
			router.push("/vendor/settings?tab=kyc&success=true");
		}
	};

	const handleBack = async () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		} else {
			if (flow.length === 1) {
				await resetKycApprovalStatus();
			}
			router.push("/vendor/settings");
		}
	};

	const handleCancel = async () => {
		if (currentStep === flow.length - 1) {
			await resetKycApprovalStatus();
		}
		router.push("/vendor/settings");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (flow.length === 0) {
		router.push("/vendor/settings");
		return null;
	}

	const currentFlow = flow[currentStep];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Progress Indicator */}
			<div className="bg-white border-b">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-lg font-semibold">
							Update KYC Documents ({currentStep + 1}/{flow.length})
						</h2>
						<button
							onClick={handleBack}
							className="text-sm text-gray-600 hover:text-gray-900"
						>
							← Back
						</button>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all"
							style={{
								width: `${((currentStep + 1) / flow.length) * 100}%`,
							}}
						/>
					</div>
				</div>
			</div>

			{/* Current Step */}
			<div className="container mx-auto px-4 py-8">
				{currentFlow === "company" && (
					<CompanyVerificationEdit
						existingData={kycData?.companyVerification}
						onSave={handleNext}
						onCancel={handleCancel}
					/>
				)}

				{currentFlow === "identity" && (
					<IdentityVerificationEdit
						existingData={kycData?.identityVerification}
						countryCode={kycData?.identityVerification?.countryCode}
						onSave={handleNext}
						onCancel={handleCancel}
					/>
				)}

				{currentFlow === "address" && (
					<AddressVerificationEdit
						existingData={kycData?.companyAddressVerification}
						onSave={handleNext}
						onCancel={handleCancel}
					/>
				)}
			</div>
		</div>
	);
}

// ✅ Wrap the content in a Suspense boundary to fix the build error
export default function KycUpdateFlowPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
				</div>
			}
		>
			<KycUpdateFlowContent />
		</Suspense>
	);
}
