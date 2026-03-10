import { 
    collection, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    orderBy,
    serverTimestamp,
    getDoc,
    addDoc
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "../firebase";
import { TailorWork } from "./types";

export const triggerManualBackfill = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const functions = getFunctions(app, "europe-west1");
        const backfillFn = httpsCallable(functions, "manualTailorWorksBrandBackfill");
        const result = await backfillFn();
        return { success: true, message: (result.data as any).message || "Backfill triggered successfully" };
    } catch (error: any) {
        console.error("Error triggering backfill:", error);
        if (error.code) console.error("Error Code:", error.code);
        if (error.details) console.error("Error Details:", error.details);
        return { success: false, message: `Error: ${error.message} (Code: ${error.code || 'unknown'})` };
    }
};

/**
 * Fetch all products with 'pending' approval status
 */
export const getPendingProducts = async (): Promise<{ success: boolean; data?: TailorWork[]; message?: string }> => {
    try {
        const worksRef = collection(db, "staging_tailor_works");
        const q = query(
            worksRef, 
            where("approvalStatus", "==", "pending")
        );

        const querySnapshot = await getDocs(q);
        const products: TailorWork[] = [];
        
        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            
            // Fetch tailor name if not present (backward compatibility)
            let tailorName = data.tailor;
            
            if (!tailorName && data.tailor_id) {
                try {
                    const tailorRef = doc(db, "staging_tailors", data.tailor_id);
                    const tailorSnap = await getDoc(tailorRef);
                    if (tailorSnap.exists()) {
                        const tailorData = tailorSnap.data();
                        tailorName = tailorData.brandName || tailorData.brand_name || data.tailor_id;
                    }
                } catch (err) {
                    console.error("Error fetching tailor details for product:", docSnap.id, err);
                }
            }
            
            products.push({
                id: docSnap.id,
                ...data,
                tailor: tailorName || "Unknown Vendor",
                // Ensure required arrays are present
                images: data.images || [],
                tags: data.tags || [],
                sizes: data.sizes || [],
            } as TailorWork);
        }
        
        // Sort manually if needed, or rely on client side. 
        // Note: Firestore requires an index for compound queries like where(status) + orderBy(date).
        // For now, we return as is.
        
        return { success: true, data: products };
    } catch (error: any) {
        console.error("Error fetching pending products:", error);
        return { success: false, message: error.message };
    }
};

/**
 * Approve a product
 */
import { sendEmailToVendor } from "./emailService";

/**
 * Approve a product
 */
export const approveProduct = async (productId: string, adminId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const productRef = doc(db, "staging_tailor_works", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
             throw new Error("Product not found");
        }
        
        const productData = productSnap.data() as TailorWork;
        
        await updateDoc(productRef, {
            approvalStatus: "approved",
            approvedBy: adminId,
            approvedAt: serverTimestamp(),
        });

        // 🟢 Duplicate update to tailor_works_local collection (sync logic from other files)
        try {
            const localWorkRef = doc(db, "staging_tailor_works_local", productId);
            const localDocSnap = await getDoc(localWorkRef);
            if (localDocSnap.exists()) {
                await updateDoc(localWorkRef, {
                    approvalStatus: "approved",
                    approvedBy: adminId,
                    approvedAt: serverTimestamp()
                });
            }
        } catch (localError) {
            console.error("Error syncing approval to local:", localError);
        }
        
        // Notify Vendor
        if (productData.tailor_id) {
            sendEmailToVendor(
                productData.tailor_id, 
                { ...productData, id: productId }, 
                'approved'
            ).catch(err => console.error("Failed to send vendor approval email", err));
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error approving product:", error);
        return { success: false, message: error.message };
    }
};

/**
 * Reject a product
 */
export const rejectProduct = async (productId: string, reason: string, adminId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const productRef = doc(db, "staging_tailor_works", productId);
        const productSnap = await getDoc(productRef);
        
        if (!productSnap.exists()) {
             throw new Error("Product not found");
        }
        
        const productData = productSnap.data() as TailorWork;
        
        await updateDoc(productRef, {
            approvalStatus: "rejected",
            rejectionReason: reason,
            rejectedBy: adminId,
            rejectedAt: serverTimestamp()
        });

        // 🟢 Duplicate update to tailor_works_local collection
        try {
            const localWorkRef = doc(db, "staging_tailor_works_local", productId);
            const localDocSnap = await getDoc(localWorkRef);
            if (localDocSnap.exists()) {
                await updateDoc(localWorkRef, {
                    approvalStatus: "rejected",
                    rejectionReason: reason,
                    rejectedBy: adminId,
                    rejectedAt: serverTimestamp()
                });
            }
        } catch (localError) {
            console.error("Error syncing rejection to local:", localError);
        }
        
        // Notify Vendor
        if (productData.tailor_id) {
            sendEmailToVendor(
                productData.tailor_id, 
                { ...productData, id: productId }, 
                'rejected',
                reason
            ).catch(err => console.error("Failed to send vendor rejection email", err));
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error rejecting product:", error);
        return { success: false, message: error.message };
    }
};
