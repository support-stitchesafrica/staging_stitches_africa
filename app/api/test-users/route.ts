import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/marketing/user-service';
import { UserServiceServer } from '@/lib/marketing/user-service-server';
import { AnalyticsService } from '@/lib/marketing/analytics-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing users and analytics services directly...');
    
    // Test UserService.getUsersServerSide
    console.log('Testing UserService.getUsersServerSide...');
    const users = await UserServiceServer.getUsersServerSide({});
    console.log('UserService.getUsersServerSide returned:', users.length, 'users');
    
    // Test AnalyticsService.calculateOrganizationAnalytics
    console.log('Testing AnalyticsService.calculateOrganizationAnalytics...');
    const analytics = await AnalyticsService.calculateOrganizationAnalytics('super_admin');
    console.log('AnalyticsService.calculateOrganizationAnalytics returned successfully');
    
    return NextResponse.json({ 
      success: true,
      users: users.length,
      analytics: {
        totalVendors: analytics.totalVendors,
        totalTeams: analytics.totalTeams,
        totalUsers: analytics.totalUsers
      }
    });
  } catch (error: any) {
    console.error('Test failed:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}