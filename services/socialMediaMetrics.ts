/**
 * Social Media Metrics Service
 * 
 * This service manages social media metrics data stored in Firestore.
 * Allows manual input and editing of social media metrics for the dashboard.
 */

import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface SocialMediaMetric {
	label: string;
	value: string;
}

export interface SocialMediaPlatform {
	platform: string;
	metrics: SocialMediaMetric[];
}

export interface SocialMediaMetrics {
	instagram: SocialMediaMetric[];
	tiktok: SocialMediaMetric[];
	linkedin: SocialMediaMetric[];
	x: SocialMediaMetric[];
}

const DEFAULT_METRICS: SocialMediaMetrics = {
	instagram: [
		{ label: "Cumulative Spend", value: "$2,450" },
		{ label: "Followers", value: "12.5K" },
		{ label: "Top Liked Posts", value: "1,234" },
		{ label: "Top Viewed Posts", value: "45.2K" },
		{ label: "Conversion Rate", value: "3.2%" },
	],
	tiktok: [
		{ label: "Cumulative Spend", value: "$1,890" },
		{ label: "Followers", value: "8.3K" },
		{ label: "Top Liked Posts", value: "2,156" },
		{ label: "Top Viewed Posts", value: "67.8K" },
		{ label: "Conversion Rate", value: "4.1%" },
	],
	linkedin: [
		{ label: "Cumulative Spend", value: "$2,780" },
		{ label: "Followers", value: "9.4K" },
		{ label: "Top Liked Posts", value: "678" },
		{ label: "Top Viewed Posts", value: "28.3K" },
		{ label: "Conversion Rate", value: "3.5%" },
	],
	x: [
		{ label: "Cumulative Spend", value: "$1,560" },
		{ label: "Followers", value: "6.2K" },
		{ label: "Top Liked Posts", value: "543" },
		{ label: "Top Viewed Posts", value: "18.9K" },
		{ label: "Conversion Rate", value: "2.1%" },
	],
};

const COLLECTION_NAME = "dashboard_settings";
const DOCUMENT_ID = "social_media_metrics";

/**
 * Get social media metrics from Firestore
 * Returns default metrics if none are stored
 */
export async function getSocialMediaMetrics(): Promise<SocialMediaMetrics> {
	try {
		const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists()) {
			const data = docSnap.data();
			return data.metrics as SocialMediaMetrics;
		}

		// Return default metrics if no data exists
		return DEFAULT_METRICS;
	} catch (error) {
		console.error("Error fetching social media metrics:", error);
		// Return default metrics on error
		return DEFAULT_METRICS;
	}
}

/**
 * Save social media metrics to Firestore
 */
export async function saveSocialMediaMetrics(
	metrics: SocialMediaMetrics
): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
		await setDoc(
			docRef,
			{
				metrics,
				updatedAt: new Date().toISOString(),
			},
			{ merge: true }
		);
	} catch (error) {
		console.error("Error saving social media metrics:", error);
		throw error;
	}
}

