/**
 * Report Scheduler Service
 * Handles scheduled report generation and distribution
 */

import { ExportService } from './export-service';
import { AnalyticsService } from './analytics-service';
import { TeamAssignmentService } from './team-assignment-service';
import { UserService } from './user-service';

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  type: 'vendor_performance' | 'team_performance' | 'organization_analytics' | 'user_data';
  filters: Record<string, any>;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    time: string; // HH:MM format
    enabled: boolean;
  };
  recipients: string[]; // Email addresses
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export class ReportSchedulerService {
  
  /**
   * Calculate next run time for a scheduled report
   */
  static calculateNextRun(schedule: ScheduledReport['schedule']): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (schedule.frequency) {
      case 'daily':
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Find next occurrence of the specified day of week
        const targetDay = schedule.dayOfWeek || 1; // Default to Monday
        const currentDay = nextRun.getDay();
        let daysUntilTarget = targetDay - currentDay;
        
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }
        
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;
        
      case 'monthly':
        // Find next occurrence of the specified day of month
        const targetDate = schedule.dayOfMonth || 1; // Default to 1st
        nextRun.setDate(targetDate);
        
        // If date has passed this month, move to next month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        
        // Handle months with fewer days
        if (nextRun.getDate() !== targetDate) {
          nextRun.setDate(0); // Set to last day of previous month
        }
        break;
    }
    
    return nextRun;
  }

  /**
   * Check if a report should run now
   */
  static shouldRunNow(report: ScheduledReport): boolean {
    if (!report.schedule.enabled) {
      return false;
    }
    
    const now = new Date();
    const nextRun = report.nextRun || this.calculateNextRun(report.schedule);
    
    // Check if we're within 5 minutes of the scheduled time
    const timeDiff = Math.abs(now.getTime() - nextRun.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeDiff <= fiveMinutes;
  }

  /**
   * Generate and distribute a scheduled report
   */
  static async runScheduledReport(report: ScheduledReport): Promise<void> {
    try {
      console.log(`Running scheduled report: ${report.name}`);
      
      // Generate report data based on type
      let data: any;
      let filename: string;
      
      switch (report.type) {
        case 'vendor_performance':
          const assignments = await TeamAssignmentService.getAllVendorAssignments();
          const vendorPerformances = await Promise.all(
            assignments.map(a => AnalyticsService.calculateVendorPerformance(a.vendorId))
          );
          data = vendorPerformances.filter(p => p !== null);
          filename = `vendor-performance-${new Date().toISOString().split('T')[0]}.csv`;
          await ExportService.exportVendorPerformance(data, { format: 'csv', filename });
          break;
          
        case 'team_performance':
          const teams = await TeamAssignmentService.getAllTeams();
          const teamPerformances = await Promise.all(
            teams.map(t => AnalyticsService.calculateTeamPerformance(t.id))
          );
          data = teamPerformances.filter(p => p !== null);
          filename = `team-performance-${new Date().toISOString().split('T')[0]}.csv`;
          await ExportService.exportTeamPerformance(data, { format: 'csv', filename });
          break;
          
        case 'organization_analytics':
          data = await AnalyticsService.calculateOrganizationAnalytics();
          filename = `organization-analytics-${new Date().toISOString().split('T')[0]}.csv`;
          await ExportService.exportOrganizationAnalytics(data, { format: 'csv', filename });
          break;
          
        case 'user_data':
          data = await UserService.getUsers();
          filename = `user-data-${new Date().toISOString().split('T')[0]}.csv`;
          await ExportService.exportUserData(data, { format: 'csv', filename });
          break;
      }
      
      // TODO: Send report via email to recipients
      // This would require email service integration
      console.log(`Report generated: ${filename}`);
      console.log(`Recipients: ${report.recipients.join(', ')}`);
      
      // Update last run time
      report.lastRun = new Date();
      report.nextRun = this.calculateNextRun(report.schedule);
      
    } catch (error) {
      console.error(`Error running scheduled report ${report.name}:`, error);
      throw error;
    }
  }

  /**
   * Process all scheduled reports
   * This should be called periodically (e.g., every 5 minutes) by a cron job
   */
  static async processScheduledReports(reports: ScheduledReport[]): Promise<void> {
    const reportsToRun = reports.filter(report => this.shouldRunNow(report));
    
    console.log(`Processing ${reportsToRun.length} scheduled reports`);
    
    for (const report of reportsToRun) {
      try {
        await this.runScheduledReport(report);
      } catch (error) {
        console.error(`Failed to run report ${report.name}:`, error);
        // Continue with other reports even if one fails
      }
    }
  }

  /**
   * Validate report schedule configuration
   */
  static validateSchedule(schedule: ScheduledReport['schedule']): { valid: boolean; error?: string } {
    if (!schedule.time || !/^\d{2}:\d{2}$/.test(schedule.time)) {
      return { valid: false, error: 'Invalid time format. Use HH:MM' };
    }
    
    const [hours, minutes] = schedule.time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return { valid: false, error: 'Invalid time values' };
    }
    
    if (schedule.frequency === 'weekly') {
      if (schedule.dayOfWeek === undefined || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
        return { valid: false, error: 'Invalid day of week (0-6)' };
      }
    }
    
    if (schedule.frequency === 'monthly') {
      if (schedule.dayOfMonth === undefined || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
        return { valid: false, error: 'Invalid day of month (1-31)' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Get human-readable schedule description
   */
  static getScheduleDescription(schedule: ScheduledReport['schedule']): string {
    const time = schedule.time;
    
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${time}`;
        
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[schedule.dayOfWeek || 1];
        return `Every ${dayName} at ${time}`;
        
      case 'monthly':
        const day = schedule.dayOfMonth || 1;
        const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
        return `Monthly on the ${day}${suffix} at ${time}`;
        
      default:
        return 'Unknown schedule';
    }
  }
}
