import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDbInstance } from "../firebase";

export async function setProductAsTest(
	productId: string,
): Promise<{ success: boolean; message?: string }> {
	try {
		if (!productId) {
			return { success: false, message: "Product ID is required" };
		}

		const updateData = {
			isTest: true,
			updatedAt: new Date().toISOString(),
			updated_at: serverTimestamp(),
		};

		const workRef = doc(getDbInstance(), "tailor_works", productId);
		await updateDoc(workRef, updateData);

		try {
			const localWorkRef = doc(getDbInstance(), "tailor_works_local", productId);
			const localSnap = await getDoc(localWorkRef);
			if (localSnap.exists()) {
				await updateDoc(localWorkRef, updateData);
			}
		} catch (localError) {
			console.error("Error updating tailor_works_local isTest:", localError);
		}

		return { success: true };
	} catch (error: unknown) {
		console.error("Error setting product as test:", error);
		const message =
			error instanceof Error ? error.message : "Failed to set test product";
		return { success: false, message };
	}
}
