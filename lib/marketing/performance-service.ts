/**
 * Marketing Dashboard Performance Service
 * Handles team and member performance tracking and calculations
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { VendorAssignmentService } from './vendor-assignment-service';
import { TeamService, Team } from './team-service';
import { UserService, User } from './user-service';
import { VendorAssignment } from './types';

// Performance Types
export interface TeamPerformance {
  teamId: string;
  teamName: string;
  leadUserId: string;
  leadName: string;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;
  conversionRate: number; // completed / (completed + cancelled)
  memberCount: number;
  averageAssignmentsPerMember: number;
  lastUpdated: Timestamp;
}

export interface MemberPerformance {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  teamId?: string;
  teamName?: string;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;
  conversionRate: number; // completed / (completed + cancelled)
  lastUpdated: Timestamp;
}

export interface PerformanceTrend {
  period: string; // e.g., "2024-01", "2024-W01"
  totalAssignments: number;
  completedAssignments: number;
  conversionRate: number;
}

export interface TeamLeaderboard {
  rank: number;
  teamId: string;
  teamName: string;
  score: number; // Based on weighted metrics
  completedAssignments: number;
  conversionRate: number;
}

export interface MemberLeaderboard {
  rank: number;
  userId: string;
  userName: string;
  teamName?: string;
  score: number; // Based on weighted metrics
  completedAssignments: number;
  conversionRate: number;
}

// Performance Service Class
export class PerformanceService {
  /**
   * Calculate team performance metrics
   * Aggregates all assignments for team members
   */
  static async calculateTeamPerformance(teamId: string): Promise<TeamPerformance> {
    try {
      // Get team details
      const team = await TeamService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Get all team member IDs (including lead)
      const memberIds = [team.leadUserId, ...team.memberUserIds];

      // Aggregate assignments for all team members
      let totalAssignments = 0;
      let activeAssignments = 0;
      let completedAssignments = 0;
      let cancelledAssignments = 0;

      for (const memberId of memberIds) {
        const memberAssignments = await VendorAssignmentService.getAssignmentsByUser(memberId);
        
        totalAssignments += memberAssignments.length;
        activeAssignments += memberAssignments.filter(a => a.status === 'active').length;
        completedAssignments += memberAssignments.filter(a => a.status === 'completed').length;
        cancelledAssignments += memberAssignments.filter(a => a.status === 'cancelled').length;
      }

      // Calculate conversion rate
      const totalResolved = completedAssignments + cancelledAssignments;
      const conversionRate = totalResolved > 0 
        ? (completedAssignments / totalResolved) * 100 
        : 0;

      // Calculate average assignments per member
      const averageAssignmentsPerMember = memberIds.length > 0 
        ? totalAssignments / memberIds.length 
        : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        leadUserId: team.leadUserId,
        leadName: team.leadName || '',
        totalAssignments,
        activeAssignments,
        completedAssignments,
        cancelledAssignments,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
        memberCount: memberIds.length,
        averageAssignmentsPerMember: Math.round(averageAssignmentsPerMember * 100) / 100,
        lastUpdated: Timestamp.now()
      };
    } catch (error) {
      console.error('Error calculating team performance:', error);
      throw new Error('Failed to calculate team performance');
    }
  }

  /**
   * Calculate performance for all teams
   */
  static async calculateAllTeamsPerformance(): Promise<TeamPerformance[]> {
    try {
      const teams = await TeamService.getAllTeams(false); // Only active teams
      
      const performances: TeamPerformance[] = [];
      for (const team of teams) {
        const performance = await this.calculateTeamPerformance(team.id);
        performances.push(performance);
      }

      return performances;
    } catch (error) {
      console.error('Error calculating all teams performance:', error);
      throw new Error('Failed to calculate teams performance');
    }
  }

  /**
   * Calculate team conversion rate
   * Percentage of completed assignments vs total resolved (completed + cancelled)
   */
  static async calculateTeamConversionRate(teamId: string): Promise<number> {
    try {
      const performance = await this.calculateTeamPerformance(teamId);
      return performance.conversionRate;
    } catch (error) {
      console.error('Error calculating team conversion rate:', error);
      return 0;
    }
  }

  /**
   * Get team metrics summary
   */
  static async getTeamMetrics(teamId: string): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    conversionRate: number;
    memberCount: number;
  }> {
    try {
      const performance = await this.calculateTeamPerformance(teamId);
      
      return {
        totalAssignments: performance.totalAssignments,
        activeAssignments: performance.activeAssignments,
        completedAssignments: performance.completedAssignments,
        conversionRate: performance.conversionRate,
        memberCount: performance.memberCount
      };
    } catch (error) {
      console.error('Error getting team metrics:', error);
      throw new Error('Failed to retrieve team metrics');
    }
  }

  /**
   * Calculate member performance metrics
   * Aggregates all assignments for a specific user
   */
  static async calculateMemberPerformance(userId: string): Promise<MemberPerformance> {
    try {
      // Get user details
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get all assignments for the user
      const assignments = await VendorAssignmentService.getAssignmentsByUser(userId);

      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter(a => a.status === 'active').length;
      const completedAssignments = assignments.filter(a => a.status === 'completed').length;
      const cancelledAssignments = assignments.filter(a => a.status === 'cancelled').length;

      // Calculate conversion rate
      const totalResolved = completedAssignments + cancelledAssignments;
      const conversionRate = totalResolved > 0 
        ? (completedAssignments / totalResolved) * 100 
        : 0;

      // Get team name if user is in a team
      let teamName: string | undefined;
      if (user.teamId) {
        const team = await TeamService.getTeamById(user.teamId);
        teamName = team?.name;
      }

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        teamId: user.teamId,
        teamName,
        totalAssignments,
        activeAssignments,
        completedAssignments,
        cancelledAssignments,
        conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimals
        lastUpdated: Timestamp.now()
      };
    } catch (error) {
      console.error('Error calculating member performance:', error);
      throw new Error('Failed to calculate member performance');
    }
  }

  /**
   * Calculate performance for all members in a team
   */
  static async calculateTeamMembersPerformance(teamId: string): Promise<MemberPerformance[]> {
    try {
      const team = await TeamService.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const memberIds = [team.leadUserId, ...team.memberUserIds];
      
      const performances: MemberPerformance[] = [];
      for (const memberId of memberIds) {
        const performance = await this.calculateMemberPerformance(memberId);
        performances.push(performance);
      }

      return performances;
    } catch (error) {
      console.error('Error calculating team members performance:', error);
      throw new Error('Failed to calculate team members performance');
    }
  }

  /**
   * Calculate member conversion rate
   */
  static async calculateMemberConversionRate(userId: string): Promise<number> {
    try {
      const performance = await this.calculateMemberPerformance(userId);
      return performance.conversionRate;
    } catch (error) {
      console.error('Error calculating member conversion rate:', error);
      return 0;
    }
  }

  /**
   * Get member metrics summary
   */
  static async getMemberMetrics(userId: string): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    conversionRate: number;
  }> {
    try {
      const performance = await this.calculateMemberPerformance(userId);
      
      return {
        totalAssignments: performance.totalAssignments,
        activeAssignments: performance.activeAssignments,
        completedAssignments: performance.completedAssignments,
        conversionRate: performance.conversionRate
      };
    } catch (error) {
      console.error('Error getting member metrics:', error);
      throw new Error('Failed to retrieve member metrics');
    }
  }

  /**
   * Generate team leaderboard
   * Ranks teams by performance score
   */
  static async generateTeamLeaderboard(limit?: number): Promise<TeamLeaderboard[]> {
    try {
      const performances = await this.calculateAllTeamsPerformance();
      
      // Calculate score for each team
      // Score = (completedAssignments * 10) + (conversionRate * 2)
      const leaderboard = performances.map(perf => ({
        teamId: perf.teamId,
        teamName: perf.teamName,
        completedAssignments: perf.completedAssignments,
        conversionRate: perf.conversionRate,
        score: (perf.completedAssignments * 10) + (perf.conversionRate * 2)
      }));

      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score);

      // Add ranks
      const rankedLeaderboard: TeamLeaderboard[] = leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

      // Apply limit if specified
      return limit ? rankedLeaderboard.slice(0, limit) : rankedLeaderboard;
    } catch (error) {
      console.error('Error generating team leaderboard:', error);
      throw new Error('Failed to generate team leaderboard');
    }
  }

  /**
   * Generate member leaderboard
   * Ranks members by performance score
   */
  static async generateMemberLeaderboard(
    teamId?: string,
    limit?: number
  ): Promise<MemberLeaderboard[]> {
    try {
      let users: User[];
      
      if (teamId) {
        // Get members of specific team
        const team = await TeamService.getTeamById(teamId);
        if (!team) {
          throw new Error('Team not found');
        }
        const memberIds = [team.leadUserId, ...team.memberUserIds];
        users = [];
        for (const memberId of memberIds) {
          const user = await UserService.getUserById(memberId);
          if (user) users.push(user);
        }
      } else {
        // Get all active users
        users = await UserService.getUsers({ isActive: true });
      }

      // Calculate performance for each user
      const performances: MemberPerformance[] = [];
      for (const user of users) {
        const performance = await this.calculateMemberPerformance(user.id);
        performances.push(performance);
      }

      // Calculate score for each member
      // Score = (completedAssignments * 10) + (conversionRate * 2)
      const leaderboard = performances.map(perf => ({
        userId: perf.userId,
        userName: perf.userName,
        teamName: perf.teamName,
        completedAssignments: perf.completedAssignments,
        conversionRate: perf.conversionRate,
        score: (perf.completedAssignments * 10) + (perf.conversionRate * 2)
      }));

      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score);

      // Add ranks
      const rankedLeaderboard: MemberLeaderboard[] = leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

      // Apply limit if specified
      return limit ? rankedLeaderboard.slice(0, limit) : rankedLeaderboard;
    } catch (error) {
      console.error('Error generating member leaderboard:', error);
      throw new Error('Failed to generate member leaderboard');
    }
  }

  /**
   * Calculate performance trends over time
   * Groups assignments by time period (month or week)
   */
  static async calculatePerformanceTrends(
    userId?: string,
    teamId?: string,
    periodType: 'month' | 'week' = 'month',
    periodsCount: number = 6
  ): Promise<PerformanceTrend[]> {
    try {
      let assignments: VendorAssignment[];

      if (userId) {
        // Get assignments for specific user
        assignments = await VendorAssignmentService.getAssignmentsByUser(userId);
      } else if (teamId) {
        // Get assignments for all team members
        const team = await TeamService.getTeamById(teamId);
        if (!team) {
          throw new Error('Team not found');
        }
        const memberIds = [team.leadUserId, ...team.memberUserIds];
        assignments = [];
        for (const memberId of memberIds) {
          const memberAssignments = await VendorAssignmentService.getAssignmentsByUser(memberId);
          assignments.push(...memberAssignments);
        }
      } else {
        // Get all assignments
        assignments = await VendorAssignmentService.getAssignments();
      }

      // Group assignments by period
      const periodMap = new Map<string, VendorAssignment[]>();
      
      assignments.forEach(assignment => {
        const date = assignment.assignedAt.toDate();
        let periodKey: string;
        
        if (periodType === 'month') {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // Week number
          const weekNum = this.getWeekNumber(date);
          periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        }
        
        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, []);
        }
        periodMap.get(periodKey)!.push(assignment);
      });

      // Calculate metrics for each period
      const trends: PerformanceTrend[] = [];
      const sortedPeriods = Array.from(periodMap.keys()).sort().reverse().slice(0, periodsCount);
      
      for (const period of sortedPeriods) {
        const periodAssignments = periodMap.get(period) || [];
        const totalAssignments = periodAssignments.length;
        const completedAssignments = periodAssignments.filter(a => a.status === 'completed').length;
        const cancelledAssignments = periodAssignments.filter(a => a.status === 'cancelled').length;
        
        const totalResolved = completedAssignments + cancelledAssignments;
        const conversionRate = totalResolved > 0 
          ? (completedAssignments / totalResolved) * 100 
          : 0;
        
        trends.push({
          period,
          totalAssignments,
          completedAssignments,
          conversionRate: Math.round(conversionRate * 100) / 100
        });
      }

      // Sort by period ascending (oldest to newest)
      trends.sort((a, b) => a.period.localeCompare(b.period));

      return trends;
    } catch (error) {
      console.error('Error calculating performance trends:', error);
      throw new Error('Failed to calculate performance trends');
    }
  }

  /**
   * Helper: Get ISO week number
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Compare team performance
   * Returns comparison between two teams
   */
  static async compareTeams(teamId1: string, teamId2: string): Promise<{
    team1: TeamPerformance;
    team2: TeamPerformance;
    comparison: {
      assignmentsDiff: number;
      conversionRateDiff: number;
      betterTeam: string;
    };
  }> {
    try {
      const team1Perf = await this.calculateTeamPerformance(teamId1);
      const team2Perf = await this.calculateTeamPerformance(teamId2);

      const assignmentsDiff = team1Perf.completedAssignments - team2Perf.completedAssignments;
      const conversionRateDiff = team1Perf.conversionRate - team2Perf.conversionRate;
      
      // Determine better team based on score
      const team1Score = (team1Perf.completedAssignments * 10) + (team1Perf.conversionRate * 2);
      const team2Score = (team2Perf.completedAssignments * 10) + (team2Perf.conversionRate * 2);
      const betterTeam = team1Score > team2Score ? team1Perf.teamName : team2Perf.teamName;

      return {
        team1: team1Perf,
        team2: team2Perf,
        comparison: {
          assignmentsDiff,
          conversionRateDiff: Math.round(conversionRateDiff * 100) / 100,
          betterTeam
        }
      };
    } catch (error) {
      console.error('Error comparing teams:', error);
      throw new Error('Failed to compare teams');
    }
  }

  /**
   * Get top performing members across all teams
   */
  static async getTopPerformers(limit: number = 10): Promise<MemberPerformance[]> {
    try {
      const users = await UserService.getUsers({ isActive: true });
      
      const performances: MemberPerformance[] = [];
      for (const user of users) {
        const performance = await this.calculateMemberPerformance(user.id);
        performances.push(performance);
      }

      // Sort by completed assignments and conversion rate
      performances.sort((a, b) => {
        const scoreA = (a.completedAssignments * 10) + (a.conversionRate * 2);
        const scoreB = (b.completedAssignments * 10) + (b.conversionRate * 2);
        return scoreB - scoreA;
      });

      return performances.slice(0, limit);
    } catch (error) {
      console.error('Error getting top performers:', error);
      throw new Error('Failed to retrieve top performers');
    }
  }
}

// Export utilities
export const performanceUtils = {
  PerformanceService
};
