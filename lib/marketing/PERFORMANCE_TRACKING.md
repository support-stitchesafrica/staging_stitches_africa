# Marketing Dashboard - Performance Tracking

## Overview

The Performance Tracking system provides comprehensive analytics for team and member performance in the Marketing Dashboard. It calculates metrics based on vendor assignments and provides visualizations through leaderboards and trend charts.

## Features

### 1. Team Performance Tracking
- **Total Assignments**: Aggregate count of all assignments for team members
- **Active Assignments**: Current ongoing assignments
- **Completed Assignments**: Successfully completed assignments
- **Conversion Rate**: Percentage of completed vs total resolved assignments
- **Average per Member**: Distribution of assignments across team members

### 2. Member Performance Tracking
- **Individual Metrics**: Track each member's assignment statistics
- **Conversion Rates**: Individual success rates
- **Team Affiliation**: Link members to their teams
- **Performance Comparison**: Compare members across teams

### 3. Leaderboards
- **Team Leaderboard**: Ranks teams by performance score
- **Member Leaderboard**: Ranks individuals by performance score
- **Scoring Algorithm**: `(completedAssignments * 10) + (conversionRate * 2)`
- **Top Performers**: Highlight best performing teams and members

### 4. Performance Trends
- **Time-based Analysis**: Track performance over months or weeks
- **Visual Charts**: Bar charts showing assignment trends
- **Conversion Tracking**: Monitor conversion rates over time
- **Historical Data**: View up to 12 periods of historical performance

## Architecture

### Service Layer

**File**: `lib/marketing/performance-service.ts`

The `PerformanceService` class provides all performance calculation methods:

```typescript
// Team Performance
PerformanceService.calculateTeamPerformance(teamId: string)
PerformanceService.calculateAllTeamsPerformance()
PerformanceService.calculateTeamConversionRate(teamId: string)
PerformanceService.getTeamMetrics(teamId: string)

// Member Performance
PerformanceService.calculateMemberPerformance(userId: string)
PerformanceService.calculateTeamMembersPerformance(teamId: string)
PerformanceService.calculateMemberConversionRate(userId: string)
PerformanceService.getMemberMetrics(userId: string)

// Leaderboards
PerformanceService.generateTeamLeaderboard(limit?: number)
PerformanceService.generateMemberLeaderboard(teamId?: string, limit?: number)

// Trends
PerformanceService.calculatePerformanceTrends(
  userId?: string,
  teamId?: string,
  periodType: 'month' | 'week',
  periodsCount: number
)

// Utilities
PerformanceService.compareTeams(teamId1: string, teamId2: string)
PerformanceService.getTopPerformers(limit: number)
```

### Component Layer

**Directory**: `components/marketing/performance/`

#### TeamLeaderboard
Displays ranked list of teams by performance score.

```tsx
<TeamLeaderboard 
  limit={10} 
  showDetails={true} 
/>
```

**Props**:
- `limit?: number` - Maximum number of teams to display (default: 10)
- `showDetails?: boolean` - Show detailed metrics (default: true)

#### MemberLeaderboard
Displays ranked list of members by performance score.

```tsx
<MemberLeaderboard 
  teamId="team123"
  limit={10} 
  showDetails={true} 
/>
```

**Props**:
- `teamId?: string` - Filter by specific team
- `limit?: number` - Maximum number of members to display (default: 10)
- `showDetails?: boolean` - Show detailed metrics (default: true)

#### PerformanceTrends
Displays performance trends over time with charts.

```tsx
<PerformanceTrends 
  userId="user123"
  teamId="team123"
  periodType="month"
  periodsCount={6}
  title="Performance Trends"
/>
```

**Props**:
- `userId?: string` - Filter by specific user
- `teamId?: string` - Filter by specific team
- `periodType?: 'month' | 'week'` - Time period granularity (default: 'month')
- `periodsCount?: number` - Number of periods to display (default: 6)
- `title?: string` - Custom title

#### PerformanceDashboard
Comprehensive dashboard combining all performance displays.

```tsx
<PerformanceDashboard 
  teamId="team123"
  userId="user123"
  showTeamLeaderboard={true}
  showMemberLeaderboard={true}
  showTrends={true}
/>
```

**Props**:
- `teamId?: string` - Filter by specific team
- `userId?: string` - Filter by specific user
- `showTeamLeaderboard?: boolean` - Show team leaderboard (default: true)
- `showMemberLeaderboard?: boolean` - Show member leaderboard (default: true)
- `showTrends?: boolean` - Show performance trends (default: true)

#### PerformanceMetricsCard
Displays detailed metrics for a team or member.

```tsx
<PerformanceMetricsCard 
  type="team"
  id="team123"
  showComparison={false}
/>
```

**Props**:
- `type: 'team' | 'member'` - Type of entity
- `id: string` - Team ID or User ID
- `showComparison?: boolean` - Show comparison data (default: false)

## Data Models

### TeamPerformance
```typescript
interface TeamPerformance {
  teamId: string;
  teamName: string;
  leadUserId: string;
  leadName: string;
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;
  conversionRate: number;
  memberCount: number;
  averageAssignmentsPerMember: number;
  lastUpdated: Timestamp;
}
```

### MemberPerformance
```typescript
interface MemberPerformance {
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
  conversionRate: number;
  lastUpdated: Timestamp;
}
```

### PerformanceTrend
```typescript
interface PerformanceTrend {
  period: string; // e.g., "2024-01", "2024-W01"
  totalAssignments: number;
  completedAssignments: number;
  conversionRate: number;
}
```

### TeamLeaderboard
```typescript
interface TeamLeaderboard {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  completedAssignments: number;
  conversionRate: number;
}
```

### MemberLeaderboard
```typescript
interface MemberLeaderboard {
  rank: number;
  userId: string;
  userName: string;
  teamName?: string;
  score: number;
  completedAssignments: number;
  conversionRate: number;
}
```

## Metrics Calculation

### Conversion Rate
```
conversionRate = (completedAssignments / (completedAssignments + cancelledAssignments)) * 100
```

If no assignments are resolved (completed or cancelled), conversion rate is 0%.

### Performance Score
```
score = (completedAssignments * 10) + (conversionRate * 2)
```

This weighted formula prioritizes:
- Completed assignments (10 points each)
- Conversion rate (2 points per percentage point)

### Average Assignments per Member
```
averageAssignmentsPerMember = totalAssignments / memberCount
```

## Usage Examples

### Display Team Performance
```typescript
import { PerformanceService } from '@/lib/marketing/performance-service';

// Get team performance
const performance = await PerformanceService.calculateTeamPerformance('team123');

console.log(`Team: ${performance.teamName}`);
console.log(`Total Assignments: ${performance.totalAssignments}`);
console.log(`Conversion Rate: ${performance.conversionRate}%`);
```

### Display Member Performance
```typescript
import { PerformanceService } from '@/lib/marketing/performance-service';

// Get member performance
const performance = await PerformanceService.calculateMemberPerformance('user123');

console.log(`Member: ${performance.userName}`);
console.log(`Completed: ${performance.completedAssignments}`);
console.log(`Conversion Rate: ${performance.conversionRate}%`);
```

### Generate Leaderboard
```typescript
import { PerformanceService } from '@/lib/marketing/performance-service';

// Get top 10 teams
const teamLeaderboard = await PerformanceService.generateTeamLeaderboard(10);

teamLeaderboard.forEach(team => {
  console.log(`${team.rank}. ${team.teamName} - Score: ${team.score}`);
});
```

### Track Performance Trends
```typescript
import { PerformanceService } from '@/lib/marketing/performance-service';

// Get last 6 months of trends for a team
const trends = await PerformanceService.calculatePerformanceTrends(
  undefined,
  'team123',
  'month',
  6
);

trends.forEach(trend => {
  console.log(`${trend.period}: ${trend.completedAssignments} completed (${trend.conversionRate}%)`);
});
```

### Compare Teams
```typescript
import { PerformanceService } from '@/lib/marketing/performance-service';

// Compare two teams
const comparison = await PerformanceService.compareTeams('team1', 'team2');

console.log(`Better Team: ${comparison.comparison.betterTeam}`);
console.log(`Assignment Difference: ${comparison.comparison.assignmentsDiff}`);
console.log(`Conversion Rate Difference: ${comparison.comparison.conversionRateDiff}%`);
```

## Integration with Dashboards

### Super Admin Dashboard
```tsx
import { PerformanceDashboard } from '@/components/marketing/performance';

export default function SuperAdminDashboard() {
  return (
    <div>
      <h1>Super Admin Dashboard</h1>
      <PerformanceDashboard 
        showTeamLeaderboard={true}
        showMemberLeaderboard={true}
        showTrends={true}
      />
    </div>
  );
}
```

### Team Lead Dashboard
```tsx
import { PerformanceDashboard } from '@/components/marketing/performance';

export default function TeamLeadDashboard({ teamId }: { teamId: string }) {
  return (
    <div>
      <h1>Team Lead Dashboard</h1>
      <PerformanceDashboard 
        teamId={teamId}
        showTeamLeaderboard={false}
        showMemberLeaderboard={true}
        showTrends={true}
      />
    </div>
  );
}
```

### Team Member Dashboard
```tsx
import { PerformanceMetricsCard } from '@/components/marketing/performance';

export default function TeamMemberDashboard({ userId }: { userId: string }) {
  return (
    <div>
      <h1>My Performance</h1>
      <PerformanceMetricsCard 
        type="member"
        id={userId}
      />
    </div>
  );
}
```

## Performance Considerations

### Caching
The performance service does not implement caching internally. Consider implementing caching at the component level or using React Query/SWR for data fetching.

### Optimization Tips
1. **Batch Queries**: When calculating performance for multiple teams/members, use batch operations
2. **Pagination**: Use the `limit` parameter in leaderboards to reduce data transfer
3. **Selective Loading**: Only load the performance data needed for the current view
4. **Background Updates**: Consider updating performance metrics in the background

### Firestore Queries
The service makes multiple Firestore queries. For large datasets:
- Consider implementing server-side aggregation
- Use Firestore composite indexes for complex queries
- Implement pagination for large result sets

## Testing

### Unit Tests
Test individual performance calculations:
```typescript
import { PerformanceService } from '@/lib/marketing/performance-service';

describe('PerformanceService', () => {
  it('should calculate team performance correctly', async () => {
    const performance = await PerformanceService.calculateTeamPerformance('team123');
    expect(performance.teamId).toBe('team123');
    expect(performance.conversionRate).toBeGreaterThanOrEqual(0);
    expect(performance.conversionRate).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests
Test with real Firestore data in a test environment.

## Requirements Validation

This implementation satisfies the following requirements from the design document:

- **Requirement 11.1**: Calculate team performance from real vendor assignments ✓
- **Requirement 11.2**: Calculate team conversion rates from vendor verification status ✓
- **Requirement 11.3**: Calculate individual member performance metrics ✓
- **Requirement 11.4**: Display team and member leaderboards with performance trends ✓

## Future Enhancements

1. **Real-time Updates**: Implement Firestore listeners for live performance updates
2. **Export Functionality**: Allow exporting performance data to CSV/PDF
3. **Custom Date Ranges**: Allow users to select custom date ranges for trends
4. **Performance Goals**: Set and track performance goals for teams/members
5. **Notifications**: Alert users when performance thresholds are met
6. **Advanced Analytics**: Add more sophisticated metrics and ML-based insights
7. **Comparison Views**: Side-by-side comparison of multiple teams/members
8. **Historical Snapshots**: Store periodic performance snapshots for long-term analysis

## Support

For issues or questions about the performance tracking system, please refer to:
- Main documentation: `.kiro/specs/marketing-dashboard-fixes/`
- Design document: `.kiro/specs/marketing-dashboard-fixes/design.md`
- Requirements: `.kiro/specs/marketing-dashboard-fixes/requirements.md`
