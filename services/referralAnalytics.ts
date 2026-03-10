/**
 * Referral Analytics Service
 * 
 * This service fetches referral analytics from Firebase Firestore.
 * 
 * Data Sources:
 * - `referrals` collection: Referral records with signups and purchases
 * - `referralUsers` collection: Referral user data with codes and stats
 * - `referralTransactions` collection: Referral transaction history
 * 
 * Usage:
 * ```typescript
 * import { getReferralStats } from "@/services/referralAnalytics";
 * 
 * const stats = await getReferralStats(startDate, endDate);
 * ```
 */

import { db } from "@/firebase";
import {
	collection,
	getDocs,
	query,
	where,
	orderBy,
	limit,
	Timestamp,
	getCountFromServer,
} from "firebase/firestore";

export interface ReferralStats {
	totalReferrals: number;
	activeReferrals: number;
	totalRevenue: number;
	totalPointsEarned: number;
	totalSignups: number;
	totalPurchases: number;
}

export interface TopReferrer {
	referrerId: string;
	referrerName?: string;
	referralCode?: string;
	totalReferrals: number;
	totalRevenue: number;
	totalPoints: number;
}

export interface ReferralTrend {
	date: string;
	signups: number;
	transactions: number;
	revenue: number;
}

export interface ReferralTransactionType {
	type: string;
	count: number;
	totalPoints: number;
}

/**
 * Get overall referral statistics
 */
export async function getReferralStats(
	startDate?: Date,
	endDate?: Date
): Promise<ReferralStats> {
	try {
		const referralsRef = collection(db, "staging_referrals");
		let referralsQuery = query(referralsRef);

		if (startDate && endDate) {
			const adjustedStartDate = new Date(startDate);
			adjustedStartDate.setHours(0, 0, 0, 0);

			const adjustedEndDate = new Date(endDate);
			adjustedEndDate.setHours(23, 59, 59, 999);

			const startTimestamp = Timestamp.fromDate(adjustedStartDate);
			const endTimestamp = Timestamp.fromDate(adjustedEndDate);

			referralsQuery = query(
				referralsRef,
				where("createdAt", ">=", startTimestamp),
				where("createdAt", "<=", endTimestamp)
			);
		}

		const snapshot = await getDocs(referralsQuery);

		let totalReferrals = 0;
		let activeReferrals = 0;
		let totalRevenue = 0;
		let totalPointsEarned = 0;
		let totalSignups = 0;
		let totalPurchases = 0;

		snapshot.docs.forEach((doc) => {
			const data = doc.data();
			totalReferrals++;

			if (data.status === "active") {
				activeReferrals++;
			}

			if (data.totalSpent) {
				totalRevenue += data.totalSpent;
			}

			if (data.pointsEarned) {
				totalPointsEarned += data.pointsEarned;
			}

			if (data.totalPurchases) {
				totalPurchases += data.totalPurchases;
			}

			// Count signups (referrals with signUpDate)
			if (data.signUpDate) {
				totalSignups++;
			}
		});

		return {
			totalReferrals,
			activeReferrals,
			totalRevenue,
			totalPointsEarned,
			totalSignups,
			totalPurchases,
		};
	} catch (error) {
		console.error("Error fetching referral stats:", error);
		return {
			totalReferrals: 0,
			activeReferrals: 0,
			totalRevenue: 0,
			totalPointsEarned: 0,
			totalSignups: 0,
			totalPurchases: 0,
		};
	}
}

/**
 * Get top referrers by number of referrals and revenue
 */
export async function getTopReferrers(
	limitCount: number = 10,
	startDate?: Date,
	endDate?: Date
): Promise<TopReferrer[]> {
	try {
		const referralsRef = collection(db, "staging_referrals");
		let referralsQuery = query(referralsRef);

		if (startDate && endDate) {
			const adjustedStartDate = new Date(startDate);
			adjustedStartDate.setHours(0, 0, 0, 0);

			const adjustedEndDate = new Date(endDate);
			adjustedEndDate.setHours(23, 59, 59, 999);

			const startTimestamp = Timestamp.fromDate(adjustedStartDate);
			const endTimestamp = Timestamp.fromDate(adjustedEndDate);

			referralsQuery = query(
				referralsRef,
				where("createdAt", ">=", startTimestamp),
				where("createdAt", "<=", endTimestamp)
			);
		}

		const snapshot = await getDocs(referralsQuery);

		const referrerMap: {
			[key: string]: {
				referrerId: string;
				referrerName?: string;
				referralCode?: string;
				totalReferrals: number;
				totalRevenue: number;
				totalPoints: number;
			};
		} = {};

		snapshot.docs.forEach((doc) => {
			const data = doc.data();
			const referrerId = data.referrerId;

			if (!referrerId) return;

			if (!referrerMap[referrerId]) {
				referrerMap[referrerId] = {
					referrerId,
					totalReferrals: 0,
					totalRevenue: 0,
					totalPoints: 0,
				};
			}

			referrerMap[referrerId].totalReferrals++;
			referrerMap[referrerId].totalRevenue += data.totalSpent || 0;
			referrerMap[referrerId].totalPoints += data.pointsEarned || 0;

			// Try to get referral code from referralUsers collection
			if (data.referralCode && !referrerMap[referrerId].referralCode) {
				referrerMap[referrerId].referralCode = data.referralCode;
			}
		});

		// Convert to array and sort by total referrals
		const topReferrers = Object.values(referrerMap)
			.sort((a, b) => b.totalReferrals - a.totalReferrals)
			.slice(0, limitCount);

		// Try to enrich with names from referralUsers
		const referralUsersRef = collection(db, "staging_referralUsers");
		const referralUsersSnapshot = await getDocs(referralUsersRef);

		referralUsersSnapshot.docs.forEach((doc) => {
			const userData = doc.data();
			const userId = userData.userId;

			const referrer = topReferrers.find((r) => r.referrerId === userId);
			if (referrer) {
				referrer.referrerName = userData.fullName || userData.email;
				if (userData.referralCode && !referrer.referralCode) {
					referrer.referralCode = userData.referralCode;
				}
			}
		});

		return topReferrers;
	} catch (error) {
		console.error("Error fetching top referrers:", error);
		return [];
	}
}

/**
 * Get referral trend data over time
 */
export async function getReferralTrend(
	days: number = 30,
	startDate?: Date,
	endDate?: Date
): Promise<ReferralTrend[]> {
	try {
		const referralsRef = collection(db, "staging_referrals");
		const transactionsRef = collection(db, "staging_referralTransactions");

		let referralsQuery = query(referralsRef);
		let transactionsQuery = query(transactionsRef);

		if (startDate && endDate) {
			const adjustedStartDate = new Date(startDate);
			adjustedStartDate.setHours(0, 0, 0, 0);

			const adjustedEndDate = new Date(endDate);
			adjustedEndDate.setHours(23, 59, 59, 999);

			const startTimestamp = Timestamp.fromDate(adjustedStartDate);
			const endTimestamp = Timestamp.fromDate(adjustedEndDate);

			referralsQuery = query(
				referralsRef,
				where("createdAt", ">=", startTimestamp),
				where("createdAt", "<=", endTimestamp)
			);

			transactionsQuery = query(
				transactionsRef,
				where("createdAt", ">=", startTimestamp),
				where("createdAt", "<=", endTimestamp)
			);
		} else {
			// Default to last N days
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);
			const startTimestamp = Timestamp.fromDate(startDate);

			referralsQuery = query(
				referralsRef,
				where("createdAt", ">=", startTimestamp)
			);

			transactionsQuery = query(
				transactionsRef,
				where("createdAt", ">=", startTimestamp)
			);
		}

		const [referralsSnapshot, transactionsSnapshot] = await Promise.all([
			getDocs(referralsQuery),
			getDocs(transactionsQuery),
		]);

		// Group by date
		const trendMap: {
			[key: string]: {
				signups: number;
				transactions: number;
				revenue: number;
			};
		} = {};

		// Process referrals (signups)
		referralsSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			const timestamp = data.createdAt?.toDate?.() || data.signUpDate?.toDate?.() || new Date();
			const dateKey = timestamp.toISOString().split("T")[0];

			if (!trendMap[dateKey]) {
				trendMap[dateKey] = {
					signups: 0,
					transactions: 0,
					revenue: 0,
				};
			}

			if (data.signUpDate) {
				trendMap[dateKey].signups++;
			}
		});

		// Process transactions
		transactionsSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			const timestamp = data.createdAt?.toDate?.() || new Date();
			const dateKey = timestamp.toISOString().split("T")[0];

			if (!trendMap[dateKey]) {
				trendMap[dateKey] = {
					signups: 0,
					transactions: 0,
					revenue: 0,
				};
			}

			trendMap[dateKey].transactions++;
			trendMap[dateKey].revenue += data.points || 0; // Using points as proxy for value
		});

		// Convert to array and sort by date
		return Object.entries(trendMap)
			.map(([date, data]) => ({
				date,
				...data,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	} catch (error) {
		console.error("Error fetching referral trend:", error);
		return [];
	}
}

/**
 * Get referral transaction breakdown by type
 */
export async function getReferralTransactionTypes(
	startDate?: Date,
	endDate?: Date
): Promise<ReferralTransactionType[]> {
	try {
		const transactionsRef = collection(db, "staging_referralTransactions");
		let transactionsQuery = query(transactionsRef);

		if (startDate && endDate) {
			const adjustedStartDate = new Date(startDate);
			adjustedStartDate.setHours(0, 0, 0, 0);

			const adjustedEndDate = new Date(endDate);
			adjustedEndDate.setHours(23, 59, 59, 999);

			const startTimestamp = Timestamp.fromDate(adjustedStartDate);
			const endTimestamp = Timestamp.fromDate(adjustedEndDate);

			transactionsQuery = query(
				transactionsRef,
				where("createdAt", ">=", startTimestamp),
				where("createdAt", "<=", endTimestamp)
			);
		}

		const snapshot = await getDocs(transactionsQuery);

		const typeMap: { [key: string]: { count: number; totalPoints: number } } = {};

		snapshot.docs.forEach((doc) => {
			const data = doc.data();
			const type = data.type || "unknown";

			if (!typeMap[type]) {
				typeMap[type] = {
					count: 0,
					totalPoints: 0,
				};
			}

			typeMap[type].count++;
			typeMap[type].totalPoints += data.points || 0;
		});

		return Object.entries(typeMap)
			.map(([type, data]) => ({
				type: type.charAt(0).toUpperCase() + type.slice(1),
				count: data.count,
				totalPoints: data.totalPoints,
			}))
			.sort((a, b) => b.count - a.count);
	} catch (error) {
		console.error("Error fetching referral transaction types:", error);
		return [];
	}
}

/**
 * Get total referral users count
 */
export async function getTotalReferralUsers(): Promise<number> {
	try {
		const referralUsersRef = collection(db, "staging_referralUsers");
		const countSnapshot = await getCountFromServer(referralUsersRef);
		return countSnapshot.data().count;
	} catch (error) {
		console.error("Error fetching total referral users:", error);
		return 0;
	}
}

