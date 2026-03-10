import { httpsCallable, getFunctions } from "firebase/functions";
import { getFirebaseApp } from "@/lib/firebase";

export interface AnalyticsOverviewResponse {
  // Current Period
  dau: number;
  mau: number;
  sessions: number;
  pageViews: number;

  // Previous Period (For Comparison)
  previousDau: number;
  previousMau: number;
  previousSessions: number;
  previousPageViews: number;

  // Visuals & Breakdown
  trafficTrend: Array<{
    date: string;
    sessions: number;
  }>;
  topPages: Array<{
    path: string;
    title: string;
    views: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
  // Custom Funnel Metrics
  signupStart: number;
  signupComplete: number;
}

export const fetchAnalyticsOverview = async (): Promise<AnalyticsOverviewResponse> => {
  try {
    const app = await getFirebaseApp();
    const functions = getFunctions(app, 'europe-west1');
    
    const getAnalyticsOverview = httpsCallable<void, AnalyticsOverviewResponse>(
      functions, 
      'getAnalyticsOverview'
    );
    
    const result = await getAnalyticsOverview();
    return result.data;
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    throw error;
  }
};
