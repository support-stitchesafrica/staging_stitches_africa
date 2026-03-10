# Performance Tracking - Usage Examples

## Quick Start

### 1. Add Performance Dashboard to Super Admin View

```tsx
// In your SuperAdminDashboard.tsx or similar component
import { PerformanceDashboard } from '@/components/marketing/performance';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Existing dashboard content */}
      
      {/* Add Performance Dashboard */}
      <PerformanceDashboard 
        showTeamLeaderboard={true}
        showMemberLeaderboard={true}
        showTrends={true}
      />
    </div>
  );
}
```

### 2. Add Team Performance to Team Lead View

```tsx
// In your TeamLeadDashboard.tsx
import { PerformanceMetricsCard, MemberLeaderboard, PerformanceTrends } from '@/components/marketing/performance';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export default function TeamLeadDashboard() {
  const { user } = useMarketingAuth();
  const teamId = user?.teamId;

  if (!teamId) {
    return <div>No team assigned</div>;
  }

  return (
    <div className="space-y-6">
      {/* Team Performance Card */}
      <PerformanceMetricsCard 
        type="team"
        id={teamId}
      />

      {/* Team Member Leaderboard */}
      <MemberLeaderboard 
        teamId={teamId}
        limit={10}
        showDetails={true}
      />

      {/* Performance Trends */}
      <PerformanceTrends 
        teamId={teamId}
        periodType="month"
        periodsCount={6}
        title="Team Performance Trends"
      />
    </div>
  );
}
```

### 3. Add Member Performance to Team Member View

```tsx
// In your TeamMemberDashboard.tsx
import { PerformanceMetricsCard, PerformanceTrends } from '@/components/marketing/performance';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export default function TeamMemberDashboard() {
  const { user } = useMarketingAuth();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Performance</h2>

      {/* Personal Performance Card */}
      <PerformanceMetricsCard 
        type="member"
        id={user.id}
      />

      {/* Personal Performance Trends */}
      <PerformanceTrends 
        userId={user.id}
        periodType="month"
        periodsCount={6}
        title="My Performance Over Time"
      />
    </div>
  );
}
```

## Advanced Usage

### Custom Leaderboard with Filtering

```tsx
import { useState } from 'react';
import { TeamLeaderboard, MemberLeaderboard } from '@/components/marketing/performance';

export default function PerformanceView() {
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>();
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4">
        <select 
          value={selectedTeam || ''} 
          onChange={(e) => setSelectedTeam(e.target.value || undefined)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Teams</option>
          {/* Add team options */}
        </select>

        <select 
          value={leaderboardLimit} 
          onChange={(e) => setLeaderboardLimit(Number(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
        </select>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamLeaderboard 
          limit={leaderboardLimit}
          showDetails={true}
        />
        <MemberLeaderboard 
          teamId={selectedTeam}
          limit={leaderboardLimit}
          showDetails={true}
        />
      </div>
    </div>
  );
}
```

### Performance Comparison View

```tsx
import { useState, useEffect } from 'react';
import { PerformanceService } from '@/lib/marketing/performance-service';
import { PerformanceMetricsCard } from '@/components/marketing/performance';

export default function TeamComparisonView() {
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [comparison, setComparison] = useState<any>(null);

  const compareTeams = async () => {
    if (team1Id && team2Id) {
      const result = await PerformanceService.compareTeams(team1Id, team2Id);
      setComparison(result);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Compare Teams</h2>

      {/* Team Selection */}
      <div className="flex gap-4">
        <input 
          type="text" 
          placeholder="Team 1 ID"
          value={team1Id}
          onChange={(e) => setTeam1Id(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <input 
          type="text" 
          placeholder="Team 2 ID"
          value={team2Id}
          onChange={(e) => setTeam2Id(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <button 
          onClick={compareTeams}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Compare
        </button>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceMetricsCard type="team" id={team1Id} />
          <PerformanceMetricsCard type="team" id={team2Id} />
          
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Comparison Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {comparison.comparison.assignmentsDiff > 0 ? '+' : ''}
                  {comparison.comparison.assignmentsDiff}
                </div>
                <div className="text-sm text-gray-600">Assignment Difference</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {comparison.comparison.conversionRateDiff > 0 ? '+' : ''}
                  {comparison.comparison.conversionRateDiff}%
                </div>
                <div className="text-sm text-gray-600">Conversion Rate Difference</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {comparison.comparison.betterTeam}
                </div>
                <div className="text-sm text-gray-600">Better Performing Team</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Top Performers Widget

```tsx
import { useState, useEffect } from 'react';
import { PerformanceService, MemberPerformance } from '@/lib/marketing/performance-service';
import { Award, TrendingUp } from 'lucide-react';

export default function TopPerformersWidget() {
  const [topPerformers, setTopPerformers] = useState<MemberPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopPerformers();
  }, []);

  const loadTopPerformers = async () => {
    try {
      setLoading(true);
      const performers = await PerformanceService.getTopPerformers(5);
      setTopPerformers(performers);
    } catch (error) {
      console.error('Error loading top performers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Top Performers</h3>
      </div>

      <div className="space-y-3">
        {topPerformers.map((performer, index) => (
          <div key={performer.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-400">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{performer.userName}</div>
              <div className="text-sm text-gray-600">{performer.teamName}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600">
                {performer.completedAssignments}
              </div>
              <div className="text-xs text-gray-600">completed</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-blue-600">
                {performer.conversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">conversion</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Performance Metrics API Route

```typescript
// app/api/marketing/performance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PerformanceService } from '@/lib/marketing/performance-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'team' | 'member'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    let performance;
    if (type === 'team') {
      performance = await PerformanceService.calculateTeamPerformance(id);
    } else if (type === 'member') {
      performance = await PerformanceService.calculateMemberPerformance(id);
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Error fetching performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
```

### Using with React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { PerformanceService } from '@/lib/marketing/performance-service';

export function useTeamPerformance(teamId: string) {
  return useQuery({
    queryKey: ['teamPerformance', teamId],
    queryFn: () => PerformanceService.calculateTeamPerformance(teamId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

export function useMemberPerformance(userId: string) {
  return useQuery({
    queryKey: ['memberPerformance', userId],
    queryFn: () => PerformanceService.calculateMemberPerformance(userId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

// Usage in component
function TeamPerformanceView({ teamId }: { teamId: string }) {
  const { data: performance, isLoading, error } = useTeamPerformance(teamId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading performance</div>;
  if (!performance) return null;

  return (
    <div>
      <h2>{performance.teamName}</h2>
      <p>Total Assignments: {performance.totalAssignments}</p>
      <p>Conversion Rate: {performance.conversionRate}%</p>
    </div>
  );
}
```

## Integration Checklist

- [ ] Import performance components into your dashboard
- [ ] Add performance service to your API routes (if needed)
- [ ] Configure role-based access for performance views
- [ ] Test with real assignment data
- [ ] Add loading and error states
- [ ] Implement caching strategy (React Query recommended)
- [ ] Add refresh functionality
- [ ] Test performance with large datasets
- [ ] Add export functionality (optional)
- [ ] Configure Firestore indexes if needed

## Common Issues

### Issue: Performance calculations are slow
**Solution**: Implement caching with React Query or SWR. Consider server-side aggregation for large datasets.

### Issue: Leaderboards not updating
**Solution**: Check that assignments are being created with correct status. Verify Firestore permissions.

### Issue: Conversion rate is always 0
**Solution**: Ensure assignments have status 'completed' or 'cancelled'. Check that assignments are being properly updated.

### Issue: Trends showing no data
**Solution**: Verify that assignments have valid `assignedAt` timestamps. Check date range calculations.

## Best Practices

1. **Cache Performance Data**: Use React Query or similar for client-side caching
2. **Lazy Load Components**: Load performance components only when needed
3. **Implement Pagination**: For large leaderboards, implement pagination
4. **Add Refresh Buttons**: Allow users to manually refresh performance data
5. **Show Loading States**: Always show loading indicators during data fetching
6. **Handle Errors Gracefully**: Display user-friendly error messages
7. **Optimize Queries**: Use Firestore composite indexes for complex queries
8. **Monitor Performance**: Track query performance and optimize as needed
