// admin-services/kycApproval.ts
import { db } from "../firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
// TODO: Uncomment this when you're ready to send emails
// import { sendKycApprovalEmail } from "@/lib/emailTemplates/kycApprovalEmail";

export interface KycApprovalData {
  tailorId: string;
  approved: boolean;
  adminNote?: string;
}

/**
 * Admin approves or declines a KYC upload request
 * This updates both users and tailors collections
 */
export const handleKycApproval = async (
  tailorId: string,
  approved: boolean,
  adminNote?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const userRef = doc(db, "staging_users", tailorId);
    const tailorRef = doc(db, "staging_tailors", tailorId);

    const payload = {
      requestKycUpload: false, // Reset request flag
      adminApprovedKycUpload: approved,
      kycApprovalStatus: approved ? "approved" : "declined",
      adminNote: adminNote || "",
      kycApprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update in both collections
    await Promise.all([
      updateDoc(userRef, payload),
      setDoc(tailorRef, { ...payload }, { merge: true }),
    ]);

    // TODO: Send email notification to vendor about KYC approval/decline
    // - Email template for approval: "Your KYC request has been approved"
    // - Email template for decline: "Your KYC request has been declined. Reason: {adminNote}"
    // await sendKycApprovalEmail(tailorId, approved, adminNote);

    return {
      success: true,
      message: approved
        ? "KYC request approved successfully"
        : "KYC request declined successfully",
    };
  } catch (error: any) {
    console.error("Error handling KYC approval:", error);
    return {
      success: false,
      message: error.message || "Failed to process KYC approval",
    };
  }
};

/**
 * Check if a tailor has a pending KYC request
 */
export const hasPendingKycRequest = (tailor: any): boolean => {
  return (
    tailor?.requestKycUpload === true &&
    tailor?.adminApprovedKycUpload !== true
  );
};

/**
 * Get KYC request status for display
 */
export const getKycRequestStatus = (tailor: any): string => {
  if (tailor?.requestKycUpload === true) {
    return "Pending Review";
  }
  if (tailor?.adminApprovedKycUpload === true) {
    return "Approved";
  }
  if (tailor?.kycApprovalStatus === "declined") {
    return "Declined";
  }
  return "No Request";
};

