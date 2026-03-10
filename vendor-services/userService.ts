// /vendor-services/userService.ts
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

// ✅ Update AddUserParams
interface AddUserParams {
  userId: string;
  firstName?: string;   // optional
  lastName?: string;    // optional
  email: string;
  shoppingPreference?: string;
  languagePreference?: string;
  isTailor?: boolean;
  phoneNumber?: string;
  role?: string;
  brand_logo: string;   // required
  brand_name: string;   // required
  type: string[];       // ✅ now array of strings
}

// ✅ Function
export const addUser = async ({
  userId,
  firstName,
  lastName,
  email,
  shoppingPreference = "default",
  languagePreference = "en",
  isTailor = false,
  phoneNumber,
  role = "verifier",
  brand_logo,
  brand_name,
  type
}: AddUserParams) => {
  try {
    if (!userId) throw new Error("User ID is required");

    const userDoc = doc(db, "staging_users", userId);

    if (isTailor) {
      await setDoc(userDoc, {
        first_name: firstName ?? null,  // ✅ optional
        last_name: lastName ?? null,    // ✅ optional
        email,
        phone_number: phoneNumber ?? null,
        shopping_preference: shoppingPreference,
        language_preference: languagePreference,
        is_tailor: true,
        is_sub_tailor: false,
        is_general_admin: false,
        role: "verifier",
        brand_logo,
        brand_name,
        type: Array.isArray(type) ? type : [type], // ✅ always save as array
      });
      return;
    }

    // General user
    await setDoc(userDoc, {
      first_name: firstName ?? null,
      last_name: lastName ?? null,
      email,
      phone_number: phoneNumber ?? null,
      shopping_preference: shoppingPreference,
      language_preference: languagePreference,
      is_tailor: false,
      is_general_admin: false,
      transactions: [],
      ratings: [],
      role,
      brand_logo,
      brand_name,
      type: Array.isArray(type) ? type : [type], // ✅ ensure array
    });
  } catch (error: any) {
    console.error("Failed to add user:", error);
    throw error;
  }
};
