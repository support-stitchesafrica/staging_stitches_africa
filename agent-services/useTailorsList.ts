// hooks/useTailorsList.ts
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

export interface Tailor {
  id: string;

  status?: string;
  verifiedAt?: any; // Timestamp or string depending on how it's stored

  // Address Verification
  companyAddressVerification?: {
    city?: string;
    country?: string;
    postCode?: string;
    proofOfAddress?: string;
    state?: string;
    status?: string;
    streetAddress?: string;
  };

  // Company Verification
  companyVerification?: {
    address?: string;
    businessName?: string;
    city?: string | null;
    companyStatus?: string;
    documentImageUrl?: string;
    registrationNumber?: string;
    state?: string;
    typeOfEntity?: string;
  };

  // Identity Verification
  identityVerification?: {
    countryCode?: string;
    feedbackMessage?: string;
    fullName?: string;
    idNumber?: string;
    middleName?: string | null;
    status?: string;
    verificationType?: string;
  };

  // Tailor Profile Info
  tailor_registered_info?: {
    email: string;
    firstName?: string; // assuming key is camelCase
    lastName?: string;
    id?: string;
    [key: string]: any;
  };

  // Key Personnel (array of directors, shareholders, etc.)
  keyPersonnel?: {
    countryOfResidence?: string;
    designation?: string;
    gender?: string;
    isCorporate?: boolean | null;
    name?: string;
    nationality?: string | null;
  }[];

  // Featured works (if any)
  featured_works?: any[];

  // Transactions (if any)
  transactions?: any[];

  // Wallet (if any)
  wallet?: number;

  // Additional unknown fields
  [key: string]: any;
}


export const useTailorsList = () => {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTailors = async () => {
      try {
        const tailorsCol = collection(db, "staging_tailors");
        const querySnapshot = await getDocs(tailorsCol);
        const tailorList: Tailor[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTailors(tailorList);
      } catch (error) {
        console.error("Error fetching tailors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTailors();
  }, []);

  return { tailors, loading };
};
