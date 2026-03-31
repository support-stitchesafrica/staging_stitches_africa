import { db } from "@/firebase";
import {
	collection,
	addDoc,
	getDocs,
	getDoc,
	doc,
	updateDoc,
	query,
	where,
	Timestamp,
	orderBy,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface VendorPreRegistration {
	id?: string;
	fullName: string;
	email: string;
	phone: string;
	businessName?: string;
	category?: string;
	brand_logo?: string;
	status: "pending" | "approved" | "rejected";
	approvalToken?: string;
	createdAt: Timestamp;
	approvedAt?: Timestamp;
	approvedBy?: string;
	notes?: string;
}

const PRE_REG_COLLECTION = "staging_vendor_pre_registrations";

/**
 * Create a new vendor pre-registration
 */
export async function createPreRegistration(
	data: Omit<
		VendorPreRegistration,
		"id" | "createdAt" | "status" | "approvalToken"
	>
): Promise<string> {
	try {
		const docRef = await addDoc(collection(db, PRE_REG_COLLECTION), {
			...data,
			status: "pending",
			createdAt: Timestamp.now(),
		});
		return docRef.id;
	} catch (error) {
		console.error("Error creating pre-registration:", error);
		throw error;
	}
}

/**
 * Get all pending pre-registrations
 */
export async function getPendingPreRegistrations(): Promise<
	VendorPreRegistration[]
> {
	try {
		const q = query(
			collection(db, PRE_REG_COLLECTION),
			where("status", "==", "pending"),
			orderBy("createdAt", "desc")
		);
		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					...doc.data(),
				} as VendorPreRegistration)
		);
	} catch (error) {
		console.error("Error getting pending pre-registrations:", error);
		throw error;
	}
}

/**
 * Get all pre-registrations (for admin dashboard)
 */
export async function getAllPreRegistrations(): Promise<
	VendorPreRegistration[]
> {
	try {
		const q = query(
			collection(db, PRE_REG_COLLECTION),
			orderBy("createdAt", "desc")
		);
		const snapshot = await getDocs(q);
		return snapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					...doc.data(),
				} as VendorPreRegistration)
		);
	} catch (error) {
		console.error("Error getting all pre-registrations:", error);
		throw error;
	}
}

/**
 * Get a pre-registration by ID
 */
export async function getPreRegistrationById(
	preRegId: string
): Promise<VendorPreRegistration | null> {
	try {
		const docRef = doc(db, PRE_REG_COLLECTION, preRegId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data(),
		} as VendorPreRegistration;
	} catch (error) {
		console.error("Error getting pre-registration by ID:", error);
		throw error;
	}
}

/**
 * Approve a vendor pre-registration and generate approval token
 */
export async function approvePreRegistration(
	preRegId: string,
	approvedBy: string,
	notes?: string
): Promise<string> {
	try {
		// Generate unique approval token
		const approvalToken = uuidv4();
		const docRef = doc(db, PRE_REG_COLLECTION, preRegId);

		await updateDoc(docRef, {
			status: "approved",
			approvalToken,
			approvedAt: Timestamp.now(),
			approvedBy,
			...(notes && { notes }),
		});

		return approvalToken;
	} catch (error) {
		console.error("Error approving pre-registration:", error);
		throw error;
	}
}

/**
 * Reject a vendor pre-registration
 */
export async function rejectPreRegistration(
	preRegId: string,
	rejectedBy: string,
	notes?: string
): Promise<void> {
	try {
		const docRef = doc(db, PRE_REG_COLLECTION, preRegId);

		await updateDoc(docRef, {
			status: "rejected",
			approvedAt: Timestamp.now(),
			approvedBy: rejectedBy,
			...(notes && { notes }),
		});
	} catch (error) {
		console.error("Error rejecting pre-registration:", error);
		throw error;
	}
}

/**
 * Get pre-registration by approval token
 */
export async function getPreRegistrationByToken(
	token: string
): Promise<VendorPreRegistration | null> {
	try {
		const q = query(
			collection(db, PRE_REG_COLLECTION),
			where("approvalToken", "==", token),
			where("status", "==", "approved")
		);
		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			return null;
		}

		const doc = snapshot.docs[0];
		return {
			id: doc.id,
			...doc.data(),
		} as VendorPreRegistration;
	} catch (error) {
		console.error("Error getting pre-registration by token:", error);
		throw error;
	}
}

/**
 * Check if email already exists in pre-registrations
 */
export async function checkEmailExists(email: string): Promise<boolean> {
	try {
		const q = query(
			collection(db, PRE_REG_COLLECTION),
			where("email", "==", email)
		);
		const snapshot = await getDocs(q);
		return !snapshot.empty;
	} catch (error) {
		console.error("Error checking email existence:", error);
		throw error;
	}
}

