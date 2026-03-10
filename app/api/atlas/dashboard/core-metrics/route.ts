import { NextRequest, NextResponse } from 'next/server';
import { getUserAnalytics, getWebSignupCount } from '@/services/installAnalytics';
import { getAverageSessionTime, getTotalAppUsage } from '@/services/sessionAnalytics';
import { getActiveUsersStats } from '@/services/activeUserAnalytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse dates if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Fetch all core metrics in parallel for maximum speed
    const [
      userAnalytics,
      webSignupCount,
      avgSessionTime,
      totalAppUsage,
      activeUsersStats
    ] = await Promise.all([
      getUserAnalytics(),
      getWebSignupCount(),
      getAverageSessionTime(start, end),
      getTotalAppUsage(start, end),
      getActiveUsersStats(30)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: userAnalytics.totalUsers,
        installCounts: userAnalytics.installCounts,
        webSignup: webSignupCount,
        avgSessionTime,
        totalAppUsage,
        activeUsersStats
      }
    });
  } catch (error) {
    console.error('Error fetching core metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch core metrics',
        data: {
          totalUsers: 0,
          installCounts: { android: 0, ios: 0, total: 0 },
          webSignup: 0,
          avgSessionTime: 0,
          totalAppUsage: { total_hours: 0, total_minutes: 0, total_sessions: 0, total_users: 0, avg_session_minutes: 0, avg_session_seconds: 0 },
          activeUsersStats: { totalActiveUsers: 0, genderDistribution: { male: 0, female: 0, unisex: 0, kids: 0, other: 0 }, percentages: { male: 0, female: 0, unisex: 0, kids: 0, other: 0 } }
        }
      },
      { status: 500 }
    );
  }
}