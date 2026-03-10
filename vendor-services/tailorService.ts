// services/tailorService.ts
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/* ----------------------- Type Definitions ----------------------- */

export interface KeyPersonnel {
  countryOfResidence: string;
  designation: string;
  gender: string;
  isCorporate: boolean | null;
  name: string;
  nationality: string | null;
}

export interface TailorKyc {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  brandName?: string;
  brandLogo?: string;
  type?: string[] | string;  // Support both array and string for backward compatibility
  ratings?: number;
  wallet?: number;
  hasSubaccount?: boolean;
  splitPercentage?: number;

  flutterwaveSubaccount?: {
    id: number;
    account_bank: string;
    account_number: string;
    bank_name: string;
    business_name: string;
    full_name: string;
    split_type: string;
    split_value: number;
    subaccount_id: string;
    created_at: string;
  };

  companyAddressVerification?: {
    city: string;
    country: string;
    postCode: string;
    proofOfAddress: string;
    state: string;
    status: string;
    streetAddress: string;
  };

  companyVerification?: {
    address: string;
    businessName: string;
    companyStatus: string;
    documentImageUrl: string;
    registrationNumber: string;
    state: string;
    status: string;
    typeOfEntity: string;
    verifiedAt: string | Date;
  };

  identityVerification?: {
    countryCode: string;
    feedbackMessage: string;
    fullName: string;
    idNumber: string;
    middleName: string | null;
    status: string;
    verificationType: string;
  };

  keyPersonnel?: KeyPersonnel[];
}

/* ----------------------- Get Tailor KYC ----------------------- */

export const getTailorKyc = async (tailorId: string): Promise<TailorKyc | null> => {
  try {
    const docRef = doc(db, "staging_tailors", tailorId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`Tailor with ID ${tailorId} not found`);
      return null;
    }

    const data = docSnap.data();

    const kycDetails: TailorKyc = {
      id: tailorId,
      email: data?.tailor_registered_info?.email,
      firstName: data?.tailor_registered_info?.["first-name"],
      lastName: data?.tailor_registered_info?.["last-name"],
      brandName: data?.brandName,
      brandLogo: data?.brand_logo,
      type: Array.isArray(data?.type) 
        ? data.type 
        : data?.type 
        ? [data.type] 
        : [],
      ratings: data?.ratings,
      wallet: data?.wallet,
      hasSubaccount: data?.hasSubaccount,
      splitPercentage: data?.splitPercentage,
      flutterwaveSubaccount: data?.flutterwaveSubaccount,
      companyAddressVerification: data?.["company-address-verification"],
      companyVerification: data?.["company-verification"],
      identityVerification: data?.["identity-verification"],
      keyPersonnel: data?.keyPersonnel || [],
    };

    return kycDetails;
  } catch (error) {
    console.error("Error fetching KYC details:", error);
    throw error;
  }
};

/* ----------------------- Create Tailor Data ----------------------- */

export async function createTailorData(
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  brandName: string,
  brandLogo: string,
  type: string[] // multiple categories
): Promise<void> {
  try {
    const tailorRef = doc(db, "staging_tailors", userId);

    const tailorData = {
      tailor_registered_info: {
        "first-name": firstName,
        "last-name": lastName,
        email,
        id: userId,
      },
      "company-verification": {
        status: null,
      },
      "identity-verification": {
        status: null,
      },
      "company-address-verification": {
        status: null,
      },
      featured_works: [],
      ratings: 0.0,
      wallet: 0.0,
      transactions: [],
      brandName,
      brand_logo: brandLogo,
      type,
      hasSubaccount: false,
      splitPercentage: null,
    };

    await setDoc(tailorRef, tailorData);

    console.log("✅ Tailor data created successfully");

    // 🟢 Duplicate to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", userId);
      await setDoc(localTailorRef, tailorData);
      console.log("✅ Tailor data duplicated to tailors_local:", userId);
    } catch (localError) {
      console.error("❌ Error duplicating to tailors_local:", localError);
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("❌ Failed to create tailor data:", error);
    throw error;
  }
}

/* ----------------------- Update Flutterwave Subaccount ----------------------- */

export async function updateTailorSubaccount(
  tailorId: string,
  subaccountData: TailorKyc["flutterwaveSubaccount"]
): Promise<void> {
  try {
    const tailorRef = doc(db, "staging_tailors", tailorId);

    const updateData = {
      flutterwaveSubaccount: subaccountData,
      hasSubaccount: true,
      splitPercentage: 80,
    };

    await updateDoc(tailorRef, updateData);

    console.log("✅ Tailor Flutterwave subaccount updated successfully");

    // 🟢 Duplicate update to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", tailorId);
      const localDocSnap = await getDoc(localTailorRef);
      
      if (localDocSnap.exists()) {
        await updateDoc(localTailorRef, updateData);
        console.log("✅ Tailor subaccount updated in tailors_local:", tailorId);
      } else {
        console.log("⚠️ Tailor not found in tailors_local, skipping update");
      }
    } catch (localError) {
      console.error("❌ Error updating tailors_local:", localError);
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("❌ Failed to update subaccount:", error);
    throw error;
  }
}
