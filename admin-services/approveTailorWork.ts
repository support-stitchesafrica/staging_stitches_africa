// services/approveTailorWork.ts
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/**
 * Approves a tailor work if it's currently not verified.
 * @param workId - The Firestore document ID of the tailor work
 * @returns {Promise<boolean>} - Returns true if approved, false if already verified
 */
export async function approveTailorWork(workId: string): Promise<boolean> {
  const workRef = doc(db, "staging_tailor_works", workId);
  const workSnap = await getDoc(workRef);

  if (!workSnap.exists()) {
    throw new Error("Tailor work not found");
  }

  const data = workSnap.data();

  if (data.is_verified) {
    // Already approved
    return false;
  }

  await updateDoc(workRef, { is_verified: true });
  return true;
}
export async function rejectTailorWork(
  workId: string,
  reason?: string
): Promise<boolean> {
  const workRef = doc(db, "staging_tailor_works", workId);
  const workSnap = await getDoc(workRef);

  if (!workSnap.exists()) {
    throw new Error("Tailor work not found");
  }

  const data = workSnap.data();

  if (data.is_verified) {
    // Already approved — cannot reject
    return false;
  }

  if (data.is_rejected) {
    // Already rejected
    return false;
  }

  await updateDoc(workRef, { 
    is_rejected: true,
    rejection_reason: reason || null 
  });

  return true;
}
