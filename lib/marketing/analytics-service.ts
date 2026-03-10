/**
 * Marketing Analytics Service
 * Aggregates and analyzes tailor data for marketing dashboard insights
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  startAfter,
  limit
} from 'firebase/firestore';
import { db } from '@/firebase';
import { 
  getTailorById, 
  getAllOrdersByTailor,
  type Tailor, 
  type UserOrder, 
  type TailorWork,
  type User as TailorUser
} from '@/admin-services/useTailors';
import { getTailorActivities, type TailorActivity } from '@/admin-services/getTailorActivities';
import { getAllTailorTransactions, type TailorTransaction } from '@/admin-services/getTailorTransactions';
import { TeamAssignmentService, type VendorAssignment } from './team-assignment-service';
import { UserService, type User } from './user-service';
import { UserServiceServer } from './user-service-server';
import { AnalyticsPersistenceService } from './analytics-persistence-service';

// Import admin SDK for server-side operations
import { adminDb } from '@/lib/firebase-admin';

// Analytics Types
export interface VendorPerformanceMetrics {
  vendorId: string;
  vendorName: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  teamId?: string;
  
  // Product Metrics
  totalProducts: number;
  activeProducts: number;
  averageProductPrice: number;
  
  // Order Metrics
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  
  // Revenue Metrics
  totalRevenue: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  
  // Customer Metrics
  totalCustomers: number;
  repeatCustomers: number;
  customerRetentionRate: number;
  
  // Activity Metrics
  lastActivityDate?: Date;
  totalActivities: number;
  engagementScore: number;
  
  // Growth Metrics
  monthlyGrowthRate: number;
  orderGrowthRate: number;
  revenueGrowthRate: number;
  
  // Performance Indicators
  performanceScore: number;
  status: 'excellent' | 'good' | 'average' | 'needs_attention';
  
  // Assignment Info
  assignmentDate?: Date;
  daysSinceAssignment?: number;
}

export interface TeamPerformanceMetrics {
  teamId: string;
  teamName: string;
  teamLeadId: string;
  teamLeadName: string;
  
  // Team Composition
  totalMembers: number;
  activeMembers: number;
  
  // Vendor Metrics
  totalVendors: number;
  activeVendors: number;
  averageVendorsPerMember: number;
  
  // Performance Metrics
  totalRevenue: number;
  averageRevenuePerVendor: number;
  averageRevenuePerMember: number;
  
  // Order Metrics
  totalOrders: number;
  completedOrders: number;
  averageOrdersPerVendor: number;
  
  // Growth Metrics
  monthlyGrowthRate: number;
  teamPerformanceScore: number;
  
  // Member Performance
  topPerformingMembers: Array<{
    userId: string;
    userName: string;
    vendorCount: number;
    totalRevenue: number;
    performanceScore: number;
  }>;
  
  // Vendor Distribution
  vendorDistribution: Array<{
    userId: string;
    userName: string;
    vendorCount: number;
    totalRevenue: number;
  }>;
}

export interface OrganizationAnalytics {
  // Overall Metrics
  totalVendors: number;
  activeVendors: number;
  totalTeams: number;
  totalUsers: number;
  
  // Revenue Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenuePerVendor: number;
  
  // Order Metrics
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  
  // Growth Metrics
  monthlyGrowthRate: number;
  vendorGrowthRate: number;
  revenueGrowthRate: number;
  
  // Performance Rankings
  topPerformingTeams: Array<{
    teamId: string;
    teamName: string;
    totalRevenue: number;
    vendorCount: number;
    performanceScore: number;
  }>;
  
  topPerformingUsers: Array<{
    userId: string;
    userName: string;
    role: string;
    vendorCount: number;
    totalRevenue: number;
    performanceScore: number;
  }>;
  
  topPerformingVendors: Array<{
    vendorId: string;
    vendorName: string;
    assignedToUserId?: string;
    assignedToUserName?: string;
    totalRevenue: number;
    totalOrders: number;
    performanceScore: number;
  }>;
  
  // Conversion Metrics
  bdmConversionRate: number;
  averageVendorOnboardingTime: number;
  
  // Trend Data
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    orders: number;
    newVendors: number;
    activeVendors: number;
  }>;
}

export interface VendorInsights {
  vendorId: string;
  vendorName: string;
  
  // Basic Info
  businessType: string;
  registrationDate: Date;
  assignmentHistory: Array<{
    userId: string;
    userName: string;
    assignmentDate: Date;
    transferDate?: Date;
    reason?: string;
  }>;
  
  // Performance Summary
  performanceMetrics: VendorPerformanceMetrics;
  
  // Product Analysis
  productAnalysis: {
    totalProducts: number;
    categories: Array<{
      category: string;
      count: number;
      averagePrice: number;
      totalRevenue: number;
    }>;
    priceRange: {
      min: number;
      max: number;
      average: number;
    };
    topSellingProducts: Array<{
      productId: string;
      title: string;
      price: number;
      orderCount: number;
      revenue: number;
    }>;
  };
  
  // Customer Analysis
  customerAnalysis: {
    totalCustomers: number;
    repeatCustomers: number;
    customerLocations: Array<{
      country: string;
      state: string;
      city: string;
      count: number;
    }>;
    orderFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  
  // Revenue Analysis
  revenueAnalysis: {
    totalRevenue: number;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      orderCount: number;
      percentage?: number;
    }>;
    revenueByCategory: Array<{
      category: string;
      revenue: number;
      percentage: number;
    }>;
  };
  
  // Activity Timeline
  activityTimeline: Array<{
    date: Date;
    type: 'order' | 'product_added' | 'assignment' | 'interaction';
    description: string;
    value?: number;
  }>;
  
  // Recommendations
  recommendations: Array<{
    type: 'growth' | 'engagement' | 'product' | 'customer';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }>;
}

// Analytics Service Class
export class AnalyticsService {
  
  /**
   * Get tailor stats - SERVER SIDE VERSION
   */
  static async getTailorStatsServerSide(): Promise<{ enrichedTailors: any[] }> {
    try {
      console.log('getTailorStatsServerSide called');
      
      // Check if adminDb is properly initialized
      if (!adminDb) {
        console.error('Firebase Admin DB is not initialized');
        throw new Error('Firebase Admin DB is not initialized');
      }
      
      // Using admin SDK for server-side operations
      console.log('Fetching tailors collection...');
      const tailorsSnapshot = await adminDb.collection("staging_tailors").get();
      console.log('Got tailors snapshot with', tailorsSnapshot.docs.length, 'documents');
      
      console.log('Processing tailors data...');
      const enrichedTailors = await Promise.all(
        tailorsSnapshot.docs.map(async (doc) => {
          const tailorData: any = doc.data();
          console.log('Processing tailor:', doc.id);
          
          // Get orders for this tailor
          console.log('Fetching orders for tailor:', doc.id);
          const ordersSnapshot = await adminDb.collection("staging_orders")
            .where('tailor_id', '==', doc.id)
            .get();
          console.log('Got orders for tailor', doc.id, ':', ordersSnapshot.docs.length, 'orders');
          
          const orders: any[] = ordersSnapshot.docs.map(orderDoc => ({
            id: orderDoc.id,
            ...(orderDoc.data() as any)
          }));
          
          // Get products for this tailor
          console.log('Fetching products for tailor:', doc.id);
          const productsSnapshot = await adminDb.collection("staging_tailor_works")
            .where('tailorId', '==', doc.id)
            .get();
          console.log('Got products for tailor', doc.id, ':', productsSnapshot.docs.length, 'products');
          
          const products: any[] = productsSnapshot.docs.map(productDoc => ({
            id: productDoc.id,
            ...(productDoc.data() as any)
          }));
          
          const result = {
            id: doc.id,
            ...tailorData,
            orders,
            products,
            totalOrders: orders.length,
            totalProducts: products.length
          };
          
          console.log('Processed tailor', doc.id, 'with', orders.length, 'orders and', products.length, 'products');
          return result;
        })
      );
      
      console.log('Processed all tailors, returning', enrichedTailors.length, 'enriched tailors');
      return { enrichedTailors };
    } catch (error) {
      console.error('Error in getTailorStatsServerSide:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to retrieve tailor statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Calculate vendor performance metrics
   */
  static async calculateVendorPerformance(vendorId: string): Promise<VendorPerformanceMetrics> {
    try {
      // Get vendor (tailor) data
      const vendor = await getTailorById(vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Get assignment info
      const assignments = await TeamAssignmentService.getAllVendorAssignments();
      const currentAssignment = assignments.find(a => 
        a.vendorId === vendorId && a.status === 'active'
      );

      // Get assigned user info
      let assignedUser: User | null = null;
      if (currentAssignment) {
        assignedUser = await UserService.getUserById(currentAssignment.assignedToUserId);
      }

      // Calculate product metrics
      const products = vendor.products || [];
      const activeProducts = products.filter(p => (p as any).wear_quantity > 0);
      const totalProducts = products.length;
      const averageProductPrice = products.length > 0 
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
        : 0;

      // Calculate order metrics
      const orders = vendor.orders || [];
      const completedOrders = orders.filter(o => o.order_status === 'completed').length;
      const pendingOrders = orders.filter(o => 
        ['pending', 'processing', 'shipped'].includes(o.order_status)
      ).length;
      const cancelledOrders = orders.filter(o => o.order_status === 'cancelled').length;

      // Calculate revenue metrics
      const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = orders.filter(o => 
        new Date(o.created_at) >= thirtyDaysAgo
      );
      const monthlyRevenue = recentOrders.reduce((sum, order) => sum + (order.price || 0), 0);

      // Calculate customer metrics
      const uniqueCustomers = new Set(orders.map(o => o.user_id));
      const totalCustomers = uniqueCustomers.size;
      
      // Calculate repeat customers
      const customerOrderCounts = new Map<string, number>();
      orders.forEach(order => {
        const count = customerOrderCounts.get(order.user_id) || 0;
        customerOrderCounts.set(order.user_id, count + 1);
      });
      const repeatCustomers = Array.from(customerOrderCounts.values())
        .filter(count => count > 1).length;
      const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      // Calculate activity metrics
      const activities = await getTailorActivities();
      const vendorActivities = activities.filter(a => a.user_id === vendorId);
      const lastActivity = vendorActivities.length > 0 
        ? new Date(vendorActivities[0].timestamp) 
        : undefined;
      
      // Calculate engagement score (0-100)
      const engagementScore = this.calculateEngagementScore({
        totalOrders: orders.length,
        totalProducts: totalProducts,
        totalCustomers,
        recentActivities: vendorActivities.filter(a => 
          new Date(a.timestamp) >= thirtyDaysAgo
        ).length,
        monthlyRevenue
      });

      // Calculate growth metrics
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const previousMonthOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      });
      
      const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.price || 0), 0);
      const monthlyGrowthRate = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      const orderGrowthRate = previousMonthOrders.length > 0 
        ? ((recentOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100 
        : 0;

      const revenueGrowthRate = monthlyGrowthRate;

      // Calculate performance score and status
      const performanceScore = this.calculatePerformanceScore({
        engagementScore,
        monthlyGrowthRate,
        customerRetentionRate,
        averageOrderValue,
        totalOrders: orders.length
      });

      const status = this.getPerformanceStatus(performanceScore);

      // Calculate assignment info
      const assignmentDate = currentAssignment?.assignmentDate.toDate();
      const daysSinceAssignment = assignmentDate 
        ? Math.floor((Date.now() - assignmentDate.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        vendorId,
        vendorName: vendor.brand_name || 'Unknown Vendor',
        assignedToUserId: currentAssignment?.assignedToUserId,
        assignedToUserName: assignedUser?.name,
        teamId: currentAssignment?.teamId,
        
        // Product Metrics
        totalProducts,
        activeProducts: activeProducts.length,
        averageProductPrice,
        
        // Order Metrics
        totalOrders: orders.length,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        
        // Revenue Metrics
        totalRevenue,
        averageOrderValue,
        monthlyRevenue,
        
        // Customer Metrics
        totalCustomers,
        repeatCustomers,
        customerRetentionRate,
        
        // Activity Metrics
        lastActivityDate: lastActivity,
        totalActivities: vendorActivities.length,
        engagementScore,
        
        // Growth Metrics
        monthlyGrowthRate,
        orderGrowthRate,
        revenueGrowthRate,
        
        // Performance Indicators
        performanceScore,
        status,
        
        // Assignment Info
        assignmentDate,
        daysSinceAssignment
      };
    } catch (error) {
      console.error('Error calculating vendor performance:', error);
      throw new Error('Failed to calculate vendor performance metrics');
    }
  }

  /**
   * Calculate team performance metrics
   */
  static async calculateTeamPerformance(teamId: string): Promise<TeamPerformanceMetrics> {
    try {
      // Get team info
      const team = await TeamAssignmentService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Get team lead info
      const teamLead = await UserService.getUserById(team.leadUserId);
      if (!teamLead) {
        throw new Error('Team lead not found');
      }

      // Get team members
      const teamMembers = await TeamAssignmentService.getTeamMembers(teamId);
      const activeMembers = teamMembers.filter(m => m.isActive);

      // Get team vendor assignments
      const teamAssignments = await TeamAssignmentService.getTeamVendorAssignments(teamId);
      const activeVendors = teamAssignments.filter(a => a.status === 'active');

      // Calculate vendor performance for each assigned vendor
      const vendorPerformances = await Promise.all(
        activeVendors.map(assignment => 
          this.calculateVendorPerformance(assignment.vendorId)
        )
      );

      // Aggregate team metrics
      const totalRevenue = vendorPerformances.reduce((sum, vp) => sum + vp.totalRevenue, 0);
      const totalOrders = vendorPerformances.reduce((sum, vp) => sum + vp.totalOrders, 0);
      const completedOrders = vendorPerformances.reduce((sum, vp) => sum + vp.completedOrders, 0);

      const averageRevenuePerVendor = activeVendors.length > 0 ? totalRevenue / activeVendors.length : 0;
      const averageRevenuePerMember = activeMembers.length > 0 ? totalRevenue / activeMembers.length : 0;
      const averageVendorsPerMember = activeMembers.length > 0 ? activeVendors.length / activeMembers.length : 0;
      const averageOrdersPerVendor = activeVendors.length > 0 ? totalOrders / activeVendors.length : 0;

      // Calculate growth metrics
      const monthlyGrowthRate = vendorPerformances.length > 0 
        ? vendorPerformances.reduce((sum, vp) => sum + vp.monthlyGrowthRate, 0) / vendorPerformances.length 
        : 0;

      // Calculate team performance score
      const teamPerformanceScore = vendorPerformances.length > 0 
        ? vendorPerformances.reduce((sum, vp) => sum + vp.performanceScore, 0) / vendorPerformances.length 
        : 0;

      // Calculate member performance
      const memberPerformanceMap = new Map<string, {
        vendorCount: number;
        totalRevenue: number;
        performanceScores: number[];
      }>();

      vendorPerformances.forEach(vp => {
        if (vp.assignedToUserId) {
          const existing = memberPerformanceMap.get(vp.assignedToUserId) || {
            vendorCount: 0,
            totalRevenue: 0,
            performanceScores: []
          };
          
          existing.vendorCount++;
          existing.totalRevenue += vp.totalRevenue;
          existing.performanceScores.push(vp.performanceScore);
          
          memberPerformanceMap.set(vp.assignedToUserId, existing);
        }
      });

      // Create top performing members list
      const topPerformingMembers = Array.from(memberPerformanceMap.entries())
        .map(([userId, metrics]) => {
          const user = teamMembers.find(m => m.id === userId);
          const avgPerformanceScore = metrics.performanceScores.length > 0 
            ? metrics.performanceScores.reduce((sum, score) => sum + score, 0) / metrics.performanceScores.length 
            : 0;
          
          return {
            userId,
            userName: user?.name || 'Unknown User',
            vendorCount: metrics.vendorCount,
            totalRevenue: metrics.totalRevenue,
            performanceScore: avgPerformanceScore
          };
        })
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 5);

      // Create vendor distribution
      const vendorDistribution = Array.from(memberPerformanceMap.entries())
        .map(([userId, metrics]) => {
          const user = teamMembers.find(m => m.id === userId);
          return {
            userId,
            userName: user?.name || 'Unknown User',
            vendorCount: metrics.vendorCount,
            totalRevenue: metrics.totalRevenue
          };
        })
        .sort((a, b) => b.vendorCount - a.vendorCount);

      return {
        teamId,
        teamName: team.name,
        teamLeadId: team.leadUserId,
        teamLeadName: teamLead.name,
        
        // Team Composition
        totalMembers: teamMembers.length,
        activeMembers: activeMembers.length,
        
        // Vendor Metrics
        totalVendors: activeVendors.length,
        activeVendors: activeVendors.length,
        averageVendorsPerMember,
        
        // Performance Metrics
        totalRevenue,
        averageRevenuePerVendor,
        averageRevenuePerMember,
        
        // Order Metrics
        totalOrders,
        completedOrders,
        averageOrdersPerVendor,
        
        // Growth Metrics
        monthlyGrowthRate,
        teamPerformanceScore,
        
        // Member Performance
        topPerformingMembers,
        vendorDistribution
      };
    } catch (error) {
      console.error('Error calculating team performance:', error);
      throw new Error('Failed to calculate team performance metrics');
    }
  }

  /**
   * Calculate organization analytics with role-based access control
   * Uses server-side operations for better performance and permissions
   * Fetches from marketing_analytics collection if available, otherwise calculates fresh
   */
  static async calculateOrganizationAnalytics(userRole: string, userTeamId?: string, forceRefresh: boolean = false): Promise<OrganizationAnalytics> {
    try {
      console.log('calculateOrganizationAnalytics called with role:', userRole, 'teamId:', userTeamId, 'forceRefresh:', forceRefresh);
      
      // Try to get cached analytics from Firestore first (unless force refresh)
      if (!forceRefresh) {
        const cachedAnalytics = await AnalyticsPersistenceService.getAnalyticsServerSide('organization');
        if (cachedAnalytics) {
          console.log('✅ Using cached organization analytics from Firestore');
          // Convert to OrganizationAnalytics format
          return {
            totalVendors: cachedAnalytics.totalVendors,
            activeVendors: cachedAnalytics.activeVendors,
            totalTeams: cachedAnalytics.totalTeams,
            totalUsers: cachedAnalytics.totalUsers,
            totalRevenue: cachedAnalytics.totalRevenue,
            monthlyRevenue: cachedAnalytics.monthlyRevenue,
            averageRevenuePerVendor: cachedAnalytics.activeVendors > 0 
              ? cachedAnalytics.totalRevenue / cachedAnalytics.activeVendors 
              : 0,
            totalOrders: cachedAnalytics.totalOrders,
            completedOrders: cachedAnalytics.completedOrders,
            averageOrderValue: cachedAnalytics.averageOrderValue,
            monthlyGrowthRate: cachedAnalytics.monthlyGrowthRate,
            vendorGrowthRate: cachedAnalytics.vendorGrowthRate,
            revenueGrowthRate: cachedAnalytics.revenueGrowthRate,
            topPerformingTeams: [],
            topPerformingUsers: [],
            topPerformingVendors: [],
            bdmConversionRate: cachedAnalytics.bdmConversionRate,
            averageVendorOnboardingTime: cachedAnalytics.averageVendorOnboardingTime,
            monthlyTrends: []
          };
        }
      }
      
      console.log('Calculating fresh organization analytics...');
      
      // Check if adminDb is properly initialized
      if (!adminDb) {
        throw new Error('Firebase Admin DB is not initialized');
      }

      // Fetch Global Data directly as requested plus Enriched Tailors for detailed metrics
      console.log('Fetching analytical data...');
      
      const [ordersSnapshot, tailorsSnapshot] = await Promise.all([
        adminDb.collection('all_orders').get(),
        adminDb.collection("staging_tailors").get()
      ]);

      // Calculate basic global metrics
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const totalVendors = tailorsSnapshot.size;
      const activeVendors = totalVendors; // Using HEAD definition

      // Fetch Enriched Tailors for deeper analysis (Remote requirement)
      const { enrichedTailors } = await AnalyticsService.getTailorStatsServerSide();

      // Fetch Assignments for onboarding time (Remote requirement)
      const allAssignments = await TeamAssignmentService.getAllVendorAssignments();
      const activeAssignments = allAssignments.filter(a => a.status === 'active');

      // Calculate Total Revenue (Price + Shipping)
      const totalRevenue = allOrders.reduce((sum, order) => {
        const price = Number(order.price) || 0;
        const shipping = Number(order.shipping_fee) || 0;
        return sum + price + shipping;
      }, 0);

      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter(o => o.order_status === 'completed' || o.status === 'completed').length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate Monthly Revenue (Current Month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyOrders = allOrders.filter(order => {
        // Handle Timestamp or date string or Date object
        let date: Date;
        if (order.created_at?.toDate) {
             date = order.created_at.toDate();
        } else if (order.timestamp?.toDate) {
             date = order.timestamp.toDate(); 
        } else if (order.created_at) {
             date = new Date(order.created_at);
        } else if (order.timestamp) {
             date = new Date(order.timestamp);
        } else {
             return false;
        }
        return date >= startOfMonth;
      });

      const monthlyRevenue = monthlyOrders.reduce((sum, order) => {
        const price = Number(order.price) || 0;
        const shipping = Number(order.shipping_fee) || 0;
        return sum + price + shipping;
      }, 0);
      
      // Basic Growth calc (Last Month vs This Month)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const lastMonthOrders = allOrders.filter(order => {
         let date: Date;
         if (order.created_at?.toDate) { date = order.created_at.toDate(); }
         else if (order.timestamp?.toDate) { date = order.timestamp.toDate(); }
         else if (order.created_at) { date = new Date(order.created_at); }
         else if (order.timestamp) { date = new Date(order.timestamp); }
         else { return false; }
         return date >= startOfLastMonth && date <= endOfLastMonth;
      });

      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => {
        const price = Number(order.price) || 0;
        const shipping = Number(order.shipping_fee) || 0;
        return sum + price + shipping;
      }, 0);

      const monthlyGrowthRate = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Calculate average vendor onboarding time (Remote Feature)
      const completedAssignments = allAssignments.filter((a: any) => a.status === 'active');
      const onboardingTimes = completedAssignments.map((a: any) => {
        const assignmentDate = a.assignmentDate.toDate();
        // Just mocking onboarding duration as assignment duration for now based on Remote logic
        const current = new Date();
        return Math.floor((current.getTime() - assignmentDate.getTime()) / (1000 * 60 * 60 * 24));
      });
      
      const averageVendorOnboardingTime = onboardingTimes.length > 0 
        ? onboardingTimes.reduce((sum: number, time: number) => sum + time, 0) / onboardingTimes.length 
        : 0;

      // Generate monthly trends (last 6 months)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        // Using enriched tailors data for more accurate historical aggregation if available
        // Otherwise fallback effectively to 0 if enrichedTailors is empty
        const monthRevenue = enrichedTailors.reduce((sum: number, tailor: any) => {
          const monthOrders = (tailor.orders || []).filter((o: any) => {
            const orderDate = new Date(o.created_at);
            return orderDate >= monthStart && orderDate < monthEnd;
          });
          return sum + monthOrders.reduce((orderSum: number, order: any) => orderSum + (order.price || 0), 0);
        }, 0);
        
        const monthOrderCount = enrichedTailors.reduce((sum: number, tailor: any) => {
          const count = (tailor.orders || []).filter((o: any) => {
            const orderDate = new Date(o.created_at);
            return orderDate >= monthStart && orderDate < monthEnd;
          }).length;
          return sum + count;
        }, 0);
        
        const newVendorsInMonth = activeAssignments.filter((a: any) => {
          const assignmentDate = a.assignmentDate.toDate();
          return assignmentDate >= monthStart && assignmentDate < monthEnd;
        }).length;
        
        const activeVendorsInMonth = activeAssignments.filter((a: any) => {
          const assignmentDate = a.assignmentDate.toDate();
          return assignmentDate < monthEnd;
        }).length;
        
        monthlyTrends.push({
          month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
          revenue: monthRevenue,
          orders: monthOrderCount,
          newVendors: newVendorsInMonth,
          activeVendors: activeVendorsInMonth
        });
      }

      const result = {
        // Overall Metrics
        totalVendors,
        activeVendors,
        totalTeams: 0, 
        totalUsers: 0, 
        
        // Revenue Metrics
        totalRevenue,
        monthlyRevenue,
        averageRevenuePerVendor: totalVendors > 0 ? totalRevenue / totalVendors : 0,
        
        // Order Metrics
        totalOrders,
        completedOrders,
        averageOrderValue,
        
        // Growth Metrics
        monthlyGrowthRate,
        vendorGrowthRate: 0,
        revenueGrowthRate: monthlyGrowthRate,
        
        // Performance Rankings
        topPerformingTeams: [],
        topPerformingUsers: [],
        topPerformingVendors: [],
        
        // Conversion Metrics
        bdmConversionRate: 0,
        averageVendorOnboardingTime,
        
        // Trend Data
        monthlyTrends
      };
      
      // Persist analytics to Firestore for caching
      try {
        await AnalyticsPersistenceService.saveAnalytics('organization', {
          totalVendors: result.totalVendors,
          activeVendors: result.activeVendors,
          totalTeams: result.totalTeams,
          totalUsers: result.totalUsers,
          totalRevenue: result.totalRevenue,
          monthlyRevenue: result.monthlyRevenue,
          totalOrders: result.totalOrders,
          completedOrders: result.completedOrders,
          averageOrderValue: result.averageOrderValue,
          monthlyGrowthRate: result.monthlyGrowthRate,
          vendorGrowthRate: result.vendorGrowthRate,
          revenueGrowthRate: result.revenueGrowthRate,
          bdmConversionRate: result.bdmConversionRate,
          averageVendorOnboardingTime: result.averageVendorOnboardingTime
        });
      } catch (persistError) {
        console.error('Error persisting analytics:', persistError);
        // Don't fail the request if persistence fails
      }
      
      return result;
    } catch (error) {
      console.error('Error calculating organization analytics:', error);
      throw new Error(`Failed to calculate organization analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate detailed vendor insights
   */
  static async generateVendorInsights(vendorId: string): Promise<VendorInsights> {
    try {
      // Get vendor data
      const vendor = await getTailorById(vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Get performance metrics
      const performanceMetrics = await this.calculateVendorPerformance(vendorId);

      // Get assignment history
      const assignmentHistory = await TeamAssignmentService.getVendorAssignmentHistory(vendorId);
      const assignmentHistoryWithUsers = await Promise.all(
        assignmentHistory.map(async assignment => {
          const user = await UserService.getUserById(assignment.assignedToUserId);
          return {
            userId: assignment.assignedToUserId,
            userName: user?.name || 'Unknown User',
            assignmentDate: assignment.assignmentDate.toDate(),
            transferDate: assignment.status === 'transferred' ? new Date() : undefined,
            reason: assignment.notes
          };
        })
      );

      // Analyze products
      const products = vendor.products || [];
      const categoryMap = new Map<string, { count: number; totalPrice: number; totalRevenue: number }>();
      
      products.forEach(product => {
        const category = (product as any).category || 'Uncategorized';
        const existing = categoryMap.get(category) || { count: 0, totalPrice: 0, totalRevenue: 0 };
        existing.count++;
        existing.totalPrice += product.price || 0;
        
        // Calculate revenue for this product from orders
        const productOrders = (vendor.orders || []).filter(o => o.product_id === product.id);
        const productRevenue = productOrders.reduce((sum, order) => sum + (order.price || 0), 0);
        existing.totalRevenue += productRevenue;
        
        categoryMap.set(category, existing);
      });

      const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        averagePrice: data.count > 0 ? data.totalPrice / data.count : 0,
        totalRevenue: data.totalRevenue
      }));

      const prices = products.map(p => p.price || 0).filter(p => p > 0);
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
        average: prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0
      };

      // Calculate top selling products
      const productSalesMap = new Map<string, { orderCount: number; revenue: number }>();
      (vendor.orders || []).forEach(order => {
        const existing = productSalesMap.get(order.product_id) || { orderCount: 0, revenue: 0 };
        existing.orderCount++;
        existing.revenue += order.price || 0;
        productSalesMap.set(order.product_id, existing);
      });

      const topSellingProducts = Array.from(productSalesMap.entries())
        .map(([productId, sales]) => {
          const product = products.find(p => p.id === productId);
          return {
            productId,
            title: product?.title || 'Unknown Product',
            price: product?.price || 0,
            orderCount: sales.orderCount,
            revenue: sales.revenue
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Analyze customers
      const orders = vendor.orders || [];
      const uniqueCustomers = new Set(orders.map(o => o.user_id));
      const customerOrderCounts = new Map<string, number>();
      orders.forEach(order => {
        const count = customerOrderCounts.get(order.user_id) || 0;
        customerOrderCounts.set(order.user_id, count + 1);
      });
      const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;

      // Analyze customer locations
      const locationMap = new Map<string, number>();
      orders.forEach(order => {
        if (order.user_address) {
          const location = `${order.user_address.country}-${order.user_address.state}-${order.user_address.city}`;
          locationMap.set(location, (locationMap.get(location) || 0) + 1);
        }
      });

      const customerLocations = Array.from(locationMap.entries())
        .map(([location, count]) => {
          const [country, state, city] = location.split('-');
          return { country, state, city, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate order frequency
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const orderFrequency = {
        daily: orders.filter(o => new Date(o.created_at) >= oneDayAgo).length,
        weekly: orders.filter(o => new Date(o.created_at) >= oneWeekAgo).length,
        monthly: orders.filter(o => new Date(o.created_at) >= oneMonthAgo).length
      };

      // Generate monthly revenue analysis (last 12 months)
      const monthlyRevenue = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= monthStart && orderDate < monthEnd;
        });
        
        const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.price || 0), 0);
        
        monthlyRevenue.push({
          month: monthStart.toISOString().substring(0, 7),
          revenue: monthRevenue,
          orderCount: monthOrders.length
        });
      }

      // Calculate revenue by category
      const totalRevenue = performanceMetrics.totalRevenue;
      const revenueByCategory = categories.map(cat => ({
        category: cat.category,
        revenue: cat.totalRevenue,
        percentage: totalRevenue > 0 ? (cat.totalRevenue / totalRevenue) * 100 : 0
      }));

      // Generate activity timeline
      const activities = await getTailorActivities();
      const vendorActivities = activities.filter(a => a.user_id === vendorId);
      
      const activityTimeline = [
        ...vendorActivities.map(activity => ({
          date: new Date(activity.timestamp),
          type: 'interaction' as const,
          description: activity.message,
          value: typeof activity.value === 'number' ? activity.value : undefined
        })),
        ...orders.map(order => ({
          date: new Date(order.created_at),
          type: 'order' as const,
          description: `Order placed: ${order.title}`,
          value: order.price
        })),
        ...products.map(product => ({
          date: new Date(product.createdAt),
          type: 'product_added' as const,
          description: `Product added: ${product.title}`,
          value: product.price
        })),
        ...assignmentHistoryWithUsers.map(assignment => ({
          date: assignment.assignmentDate,
          type: 'assignment' as const,
          description: `Assigned to ${assignment.userName}`,
          value: undefined
        }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);

      // Generate recommendations
      const recommendations = this.generateVendorRecommendations(performanceMetrics, {
        totalProducts: products.length,
        totalOrders: orders.length,
        categories: categories.length,
        repeatCustomerRate: uniqueCustomers.size > 0 ? (repeatCustomers / uniqueCustomers.size) * 100 : 0
      });

      return {
        vendorId,
        vendorName: vendor.brand_name || 'Unknown Vendor',
        businessType: vendor.brand_category?.[0] || 'Unknown',
        registrationDate: vendor.tailor_registered_info?.id ? new Date() : new Date(), // Fallback
        assignmentHistory: assignmentHistoryWithUsers,
        performanceMetrics,
        productAnalysis: {
          totalProducts: products.length,
          categories,
          priceRange,
          topSellingProducts
        },
        customerAnalysis: {
          totalCustomers: uniqueCustomers.size,
          repeatCustomers,
          customerLocations,
          orderFrequency
        },
        revenueAnalysis: {
          totalRevenue: performanceMetrics.totalRevenue,
          monthlyRevenue,
          revenueByCategory
        },
        activityTimeline,
        recommendations
      };
    } catch (error) {
      console.error('Error generating vendor insights:', error);
      throw new Error('Failed to generate vendor insights');
    }
  }

  /**
   * Calculate engagement score (0-100)
   */
  private static calculateEngagementScore(metrics: {
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    recentActivities: number;
    monthlyRevenue: number;
  }): number {
    const {
      totalOrders,
      totalProducts,
      totalCustomers,
      recentActivities,
      monthlyRevenue
    } = metrics;

    // Weighted scoring system
    const orderScore = Math.min((totalOrders / 10) * 20, 20); // Max 20 points
    const productScore = Math.min((totalProducts / 5) * 15, 15); // Max 15 points
    const customerScore = Math.min((totalCustomers / 5) * 15, 15); // Max 15 points
    const activityScore = Math.min((recentActivities / 5) * 25, 25); // Max 25 points
    const revenueScore = Math.min((monthlyRevenue / 1000) * 25, 25); // Max 25 points

    return Math.round(orderScore + productScore + customerScore + activityScore + revenueScore);
  }

  /**
   * Calculate performance score (0-100)
   */
  private static calculatePerformanceScore(metrics: {
    engagementScore: number;
    monthlyGrowthRate: number;
    customerRetentionRate: number;
    averageOrderValue: number;
    totalOrders: number;
  }): number {
    const {
      engagementScore,
      monthlyGrowthRate,
      customerRetentionRate,
      averageOrderValue,
      totalOrders
    } = metrics;

    // Weighted performance calculation
    const engagementWeight = 0.3;
    const growthWeight = 0.25;
    const retentionWeight = 0.2;
    const orderValueWeight = 0.15;
    const volumeWeight = 0.1;

    const normalizedGrowth = Math.max(0, Math.min(100, monthlyGrowthRate + 50)); // Normalize -50 to +50 to 0-100
    const normalizedRetention = customerRetentionRate;
    const normalizedOrderValue = Math.min((averageOrderValue / 500) * 100, 100); // Normalize to $500 max
    const normalizedVolume = Math.min((totalOrders / 20) * 100, 100); // Normalize to 20 orders max

    const score = (
      engagementScore * engagementWeight +
      normalizedGrowth * growthWeight +
      normalizedRetention * retentionWeight +
      normalizedOrderValue * orderValueWeight +
      normalizedVolume * volumeWeight
    );

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Get performance status based on score
   */
  private static getPerformanceStatus(score: number): 'excellent' | 'good' | 'average' | 'needs_attention' {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'average';
    return 'needs_attention';
  }

  /**
   * Generate vendor recommendations
   */
  private static generateVendorRecommendations(
    performance: VendorPerformanceMetrics,
    additionalData: {
      totalProducts: number;
      totalOrders: number;
      categories: number;
      repeatCustomerRate: number;
    }
  ): Array<{
    type: 'growth' | 'engagement' | 'product' | 'customer';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
  }> {
    const recommendations = [];

    // Performance-based recommendations
    if (performance.performanceScore < 50) {
      recommendations.push({
        type: 'growth' as const,
        priority: 'high' as const,
        title: 'Improve Overall Performance',
        description: 'Vendor performance is below average and needs immediate attention.',
        actionItems: [
          'Schedule one-on-one meeting to identify challenges',
          'Review product portfolio and pricing strategy',
          'Analyze customer feedback and market positioning',
          'Develop action plan with specific milestones'
        ]
      });
    }

    // Product recommendations
    if (additionalData.totalProducts < 3) {
      recommendations.push({
        type: 'product' as const,
        priority: 'high' as const,
        title: 'Expand Product Portfolio',
        description: 'Limited product range may be restricting growth potential.',
        actionItems: [
          'Identify trending product categories',
          'Support vendor in product development',
          'Provide market research and customer insights',
          'Set target of 5-10 products within next quarter'
        ]
      });
    }

    // Customer retention recommendations
    if (additionalData.repeatCustomerRate < 20) {
      recommendations.push({
        type: 'customer' as const,
        priority: 'medium' as const,
        title: 'Improve Customer Retention',
        description: 'Low repeat customer rate indicates potential service or quality issues.',
        actionItems: [
          'Implement customer feedback collection system',
          'Review order fulfillment and delivery processes',
          'Develop customer loyalty program',
          'Improve post-purchase communication'
        ]
      });
    }

    // Engagement recommendations
    if (performance.engagementScore < 40) {
      recommendations.push({
        type: 'engagement' as const,
        priority: 'medium' as const,
        title: 'Increase Vendor Engagement',
        description: 'Low engagement levels may indicate lack of support or motivation.',
        actionItems: [
          'Increase frequency of check-ins and support calls',
          'Provide training on platform features and best practices',
          'Share performance insights and improvement opportunities',
          'Connect with other successful vendors for peer learning'
        ]
      });
    }

    // Growth recommendations
    if (performance.monthlyGrowthRate < 0) {
      recommendations.push({
        type: 'growth' as const,
        priority: 'high' as const,
        title: 'Address Declining Growth',
        description: 'Negative growth trend requires immediate intervention.',
        actionItems: [
          'Conduct comprehensive business review',
          'Identify and address operational bottlenecks',
          'Review competitive positioning and pricing',
          'Develop recovery plan with clear targets'
        ]
      });
    } else if (performance.monthlyGrowthRate < 10) {
      recommendations.push({
        type: 'growth' as const,
        priority: 'low' as const,
        title: 'Accelerate Growth',
        description: 'Steady performance with potential for acceleration.',
        actionItems: [
          'Explore new marketing channels and strategies',
          'Optimize product listings and descriptions',
          'Consider seasonal promotions and campaigns',
          'Expand to new customer segments'
        ]
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }
}

// Export analytics utilities
export const analyticsUtils = {
  AnalyticsService
};