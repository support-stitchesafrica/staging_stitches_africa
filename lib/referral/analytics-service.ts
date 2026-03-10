import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  Timestamp,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { 
  ReferralAnalytics, 
  ChartData, 
  AdminChartData, 
  DateRange,
  ReportParams,
  Report
} from './types';

/**
 * AnalyticsService - Handles analytics data aggregation and reporting
 * Requirements: 5.1, 5.2, 12.5, 14.1, 14.2, 14.4, 14.5
 */
export class AnalyticsService {
  /**
   * Aggregate daily statistics for a specific date
   * Requirement 14.1, 14.2
   */
  static async aggregateDailyStats(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      // Get all referrals created on this date
      const referralsQuery = query(
        collection(db, "staging_referrals"),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      const totalSignups = referralsSnapshot.size;

      // Get all purchases on this date
      const purchasesQuery = query(
        collection(db, "staging_referralPurchases"),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);
      const totalPurchases = purchasesSnapshot.size;

      // Calculate total revenue
      let totalRevenue = 0;
      purchasesSnapshot.forEach((doc) => {
        const purchase = doc.data();
        totalRevenue += purchase.amount || 0;
      });

      // Get total points awarded
      const transactionsQuery = query(
        collection(db, "staging_referralTransactions"),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      let totalPointsAwarded = 0;
      transactionsSnapshot.forEach((doc) => {
        const transaction = doc.data();
        totalPointsAwarded += transaction.points || 0;
      });

      // Get active referrers (those who had activity on this date)
      const activeReferrerIds = new Set<string>();
      referralsSnapshot.forEach((doc) => {
        const referral = doc.data();
        activeReferrerIds.add(referral.referrerId);
      });
      purchasesSnapshot.forEach((doc) => {
        const purchase = doc.data();
        activeReferrerIds.add(purchase.referrerId);
      });
      const activeReferrers = activeReferrerIds.size;

      // Calculate conversion rate
      const conversionRate = totalSignups > 0 
        ? (totalPurchases / totalSignups) * 100 
        : 0;

      // Create analytics document
      const dateId = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const analyticsData: ReferralAnalytics = {
        id: dateId,
        date: startTimestamp,
        totalSignups,
        totalPurchases,
        totalRevenue,
        totalPointsAwarded,
        activeReferrers,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      };

      // Save to Firestore
      await setDoc(doc(db, 'referralAnalytics', dateId), analyticsData);
    } catch (error) {
      console.error('Error aggregating daily stats:', error);
      throw error;
    }
  }

  /**
   * Get chart data for a specific referrer
   * Requirement 5.1, 5.2
   */
  static async getChartData(referrerId: string, range: DateRange): Promise<ChartData> {
    try {
      const { startDate, endDate } = this.getDateRangeTimestamps(range);

      // Get referrals over time
      const referralsQuery = query(
        collection(db, "staging_referrals"),
        where('referrerId', '==', referrerId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'asc')
      );
      const referralsSnapshot = await getDocs(referralsQuery);

      // Get purchases over time
      const purchasesQuery = query(
        collection(db, "staging_referralPurchases"),
        where('referrerId', '==', referrerId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'asc')
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);

      // Aggregate data by date
      const dataByDate = new Map<string, { signups: number; revenue: number }>();

      referralsSnapshot.forEach((doc) => {
        const referral = doc.data();
        const date = referral.createdAt.toDate().toISOString().split('T')[0];
        const existing = dataByDate.get(date) || { signups: 0, revenue: 0 };
        existing.signups += 1;
        dataByDate.set(date, existing);
      });

      purchasesSnapshot.forEach((doc) => {
        const purchase = doc.data();
        const date = purchase.createdAt.toDate().toISOString().split('T')[0];
        const existing = dataByDate.get(date) || { signups: 0, revenue: 0 };
        existing.revenue += purchase.amount || 0;
        dataByDate.set(date, existing);
      });

      // Convert to array and sort
      const chartData: ChartData = {
        labels: [],
        signups: [],
        revenue: []
      };

      const sortedDates = Array.from(dataByDate.keys()).sort();
      sortedDates.forEach((date) => {
        const data = dataByDate.get(date)!;
        chartData.labels.push(date);
        chartData.signups.push(data.signups);
        chartData.revenue.push(parseFloat(data.revenue.toFixed(2)));
      });

      return chartData;
    } catch (error) {
      console.error('Error getting chart data:', error);
      throw error;
    }
  }

  /**
   * Get admin chart data for overall program analytics
   * Requirement 14.1, 14.2
   */
  static async getAdminChartData(range: DateRange): Promise<AdminChartData> {
    try {
      const { startDate, endDate } = this.getDateRangeTimestamps(range);

      // Query analytics collection for the date range
      const analyticsQuery = query(
        collection(db, 'referralAnalytics'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      const analyticsSnapshot = await getDocs(analyticsQuery);

      const chartData: AdminChartData = {
        labels: [],
        referrers: [],
        referees: [],
        revenue: [],
        points: []
      };

      // Aggregate cumulative data
      let cumulativeReferrers = 0;
      let cumulativeReferees = 0;

      analyticsSnapshot.forEach((doc) => {
        const analytics = doc.data() as ReferralAnalytics;
        const date = analytics.date.toDate().toISOString().split('T')[0];
        
        cumulativeReferrers += analytics.activeReferrers;
        cumulativeReferees += analytics.totalSignups;

        chartData.labels.push(date);
        chartData.referrers.push(cumulativeReferrers);
        chartData.referees.push(cumulativeReferees);
        chartData.revenue.push(parseFloat(analytics.totalRevenue.toFixed(2)));
        chartData.points.push(analytics.totalPointsAwarded);
      });

      // Get top performers
      const referrersQuery = query(
        collection(db, "staging_referralUsers"),
        orderBy('totalReferrals', 'desc'),
        limit(10)
      );
      const referrersSnapshot = await getDocs(referrersQuery);

      chartData.topPerformers = [];
      referrersSnapshot.forEach((doc) => {
        const referrer = doc.data();
        chartData.topPerformers!.push({
          name: referrer.fullName,
          referrals: referrer.totalReferrals,
          revenue: parseFloat((referrer.totalRevenue || 0).toFixed(2)),
          points: referrer.totalPoints
        });
      });

      return chartData;
    } catch (error) {
      console.error('Error getting admin chart data:', error);
      throw error;
    }
  }

  /**
   * Generate a custom report based on parameters
   * Requirement 14.4
   */
  static async generateReport(params: ReportParams): Promise<Report> {
    try {
      const { startDate, endDate, type, filters } = params;
      const start = Timestamp.fromDate(startDate);
      const end = Timestamp.fromDate(endDate);

      const report: Report = {
        id: `report_${Date.now()}`,
        type,
        startDate,
        endDate,
        generatedAt: new Date(),
        data: [],
        summary: {
          totalReferrers: 0,
          totalReferees: 0,
          totalRevenue: 0,
          totalPoints: 0,
          conversionRate: 0
        }
      };

      if (type === 'referrers') {
        // Get all referrers data
        let referrersQuery = query(
          collection(db, "staging_referralUsers"),
          where('createdAt', '>=', start),
          where('createdAt', '<=', end)
        );

        const referrersSnapshot = await getDocs(referrersQuery);
        
        report.data = referrersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.fullName,
            email: data.email,
            referralCode: data.referralCode,
            totalReferrals: data.totalReferrals,
            totalPoints: data.totalPoints,
            totalRevenue: data.totalRevenue,
            createdAt: data.createdAt.toDate()
          };
        });

        report.summary.totalReferrers = report.data.length;
        report.summary.totalReferees = report.data.reduce((sum, r) => sum + r.totalReferrals, 0);
        report.summary.totalRevenue = report.data.reduce((sum, r) => sum + r.totalRevenue, 0);
        report.summary.totalPoints = report.data.reduce((sum, r) => sum + r.totalPoints, 0);
      } else if (type === 'referrals') {
        // Get all referrals data
        const referralsQuery = query(
          collection(db, "staging_referrals"),
          where('createdAt', '>=', start),
          where('createdAt', '<=', end)
        );

        const referralsSnapshot = await getDocs(referralsQuery);
        
        report.data = referralsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            referrerId: data.referrerId,
            refereeName: data.refereeName,
            refereeEmail: data.refereeEmail,
            status: data.status,
            signUpDate: data.signUpDate.toDate(),
            totalPurchases: data.totalPurchases,
            totalSpent: data.totalSpent,
            pointsEarned: data.pointsEarned
          };
        });

        report.summary.totalReferees = report.data.length;
        report.summary.totalRevenue = report.data.reduce((sum, r) => sum + (r.totalSpent || 0), 0);
        report.summary.totalPoints = report.data.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
      } else if (type === 'transactions') {
        // Get all transactions data
        const transactionsQuery = query(
          collection(db, "staging_referralTransactions"),
          where('createdAt', '>=', start),
          where('createdAt', '<=', end)
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        report.data = transactionsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            referrerId: data.referrerId,
            type: data.type,
            points: data.points,
            amount: data.amount,
            description: data.description,
            createdAt: data.createdAt.toDate()
          };
        });

        report.summary.totalPoints = report.data.reduce((sum, t) => sum + t.points, 0);
        report.summary.totalRevenue = report.data.reduce((sum, t) => sum + (t.amount || 0), 0);
      }

      // Calculate conversion rate if applicable
      if (report.summary.totalReferees > 0) {
        const purchasesQuery = query(
          collection(db, "staging_referralPurchases"),
          where('createdAt', '>=', start),
          where('createdAt', '<=', end)
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);
        const uniqueReferees = new Set(purchasesSnapshot.docs.map(doc => doc.data().refereeId));
        report.summary.conversionRate = (uniqueReferees.size / report.summary.totalReferees) * 100;
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Export data to CSV format
   * Requirement 12.5, 14.5
   */
  static async exportToCSV(data: any[]): Promise<string> {
    try {
      if (!data || data.length === 0) {
        return '';
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Create CSV header row
      const csvRows = [headers.join(',')];

      // Add data rows
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          
          // Handle different data types
          if (value === null || value === undefined) {
            return '';
          }
          
          if (value instanceof Date) {
            return value.toISOString();
          }
          
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        });
        
        csvRows.push(values.join(','));
      }

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export data to PDF format (returns base64 encoded string)
   * Requirement 12.5, 14.5
   * Note: This is a simplified implementation. In production, use a library like jsPDF or pdfmake
   */
  static async exportToPDF(data: any[]): Promise<string> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use a PDF generation library
      // For now, we'll return a base64 encoded HTML representation
      
      if (!data || data.length === 0) {
        return '';
      }

      const headers = Object.keys(data[0]);
      
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Referral Program Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(h => {
                    const value = row[h];
                    if (value instanceof Date) {
                      return `<td>${value.toLocaleString()}</td>`;
                    }
                    return `<td>${value !== null && value !== undefined ? value : ''}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Return base64 encoded HTML
      // In production, this would be converted to actual PDF using a library
      return Buffer.from(html).toString('base64');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Helper method to get date range timestamps
   */
  private static getDateRangeTimestamps(range: DateRange): { startDate: Timestamp; endDate: Timestamp } {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    return {
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(now)
    };
  }
}
