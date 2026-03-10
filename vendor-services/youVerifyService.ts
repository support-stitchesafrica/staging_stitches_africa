// services/youVerifyService.ts
import { callInRegion } from "@/lib/firebase/functionClient";   // 👈 NEW
import { NigerianDriverLicenseVerificationModel } from "@/types/NigerianDriverLicenseVerification";
import { NigerianPhoneNumberVerificationModel } from "@/types/NigerianPhoneNumberVerification";
import { BusinessVerificationModel } from "@/types/BusinessVerificationModel";
import { SAIDVerificationModel } from "@/types/said";
import { GhanaPassportVerificationModel } from "@/types/ghanaPassport";
import { KenyanPassportVerificationModel } from "@/types/kenyaPassport";
import { NigerianBvnVerificationModel } from "@/types/NigerianBvnVerification";
import * as functions from "firebase-functions";

async function callVerifyFunction<T>(
  functionName: string,
  data: Record<string, any>,
  retries: number = 2
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`${functionName} attempt ${attempt + 1}/${retries + 1}`);
      const res = await callInRegion<Record<string, any>, T>(functionName, data);
      if (typeof res !== "object") throw new Error("Invalid response format");
      return res as T;
    } catch (error: any) {
      lastError = error;
      console.error(`${functionName} attempt ${attempt + 1} failed:`, error?.message);
      
      // Don't retry on non-timeout errors
      if (error?.message && !error.message.includes("deadline-exceeded") && !error.message.includes("timeout")) {
        throw new Error(error?.message || `Unexpected error during ${functionName}`);
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`${functionName} failed after ${retries + 1} attempts:`, lastError);
  throw new Error(lastError?.message || `Timeout error during ${functionName}. Please try again.`);
}

// NIN Verification
export async function verifyNin(data: {
  nin: string;
  isSubjectConsent: boolean;
  isLive?: boolean;
  premiumNin?: boolean;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  selfieImage?: string;
}) {
  return await callVerifyFunction("verifyNin", data);
}

// Driver’s Licence Verification
export async function verifyDriversLicense(data: {
  licenseNumber: string;
  isLive?: boolean;
}) {
  return await callVerifyFunction<NigerianDriverLicenseVerificationModel>(
    "verifyDriversLicense",
    data
  );
}

// BVN Verification
export async function verifyBvn(data: {
  bvn: string;
  isSubjectConsent: boolean;
  isLive?: boolean;
  selfieImage?: string;
  metadata?: Record<string, any>;
}): Promise<NigerianBvnVerificationModel> {
  return await callVerifyFunction<NigerianBvnVerificationModel>("verifyBvn", data);
}

// Passport (Nigeria)
export async function verifyPassport(data: {
  passportNumber: string;
  isSubjectConsent: boolean;
  lastName: string;
  isLive?: boolean;
  firstName?: string;
  dateOfBirth?: string;
  selfieImage?: string;
  metadata?: Record<string, any>;
}) {
  return await callVerifyFunction("verifyPassport", data);
}

// Business
export async function verifyBusiness(data: {
  registrationNumber: string;
  countryCode: string;
  isLive?: boolean;
  isConsent?: boolean;
  premium?: boolean;
}) {
  const payload: Record<string, any> = {
    registrationNumber: data.registrationNumber.trim(),
    countryCode: data.countryCode.trim().toUpperCase(),
    isLive: data.isLive ?? true,
    isConsent: data.isConsent ?? true,
    premium: data.premium ?? false,
  };
  return await callVerifyFunction<BusinessVerificationModel>("verifyBusiness", payload);
}

// Phone Number
export async function verifyPhoneNumber(data: {
  mobile: string;
  isSubjectConsent: boolean;
  isLive?: boolean;
  metadata?: Record<string, any>;
}): Promise<NigerianPhoneNumberVerificationModel> {
  return await callVerifyFunction<NigerianPhoneNumberVerificationModel>("verifyPhoneNumber", data);
}

// Ghana Passport
export async function verifyGhanaPassport(data: {
  passportNumber: string;
  isSubjectConsent: boolean;
  isLive?: boolean;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  selfieImage?: string;
  metadata?: Record<string, any>;
}) {
  return await callVerifyFunction<GhanaPassportVerificationModel>("verifyGhanaPassport", data);
}

// Kenya Passport
export async function verifyKenyanPassport(data: {
  passportNumber: string;
  isSubjectConsent: boolean;
  isLive?: boolean;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
  selfieImage?: string;
  metadata?: Record<string, any>;
}) {
  return await callVerifyFunction<KenyanPassportVerificationModel>("verifyKenyanPassport", data);
}

// South African ID
export async function verifySouthAfricanID(data: {
  saidNumber: string;
  isSubjectConsent: boolean;
  isLive?: boolean;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
}) {
  return await callVerifyFunction<SAIDVerificationModel>("verifySouthAfricanID", data);
}
