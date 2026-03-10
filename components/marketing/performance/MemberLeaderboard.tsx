'use client';

import React, { useEffect, useState } from 'react';
import { PerformanceService, MemberLeaderboard as MemberLeaderboardType } from '@/lib/marketing/performance-service';
import { Award, TrendingUp, Target, Users } from 'lucide-react';

interface MemberLeaderboardProps {
  teamId?: string;
  limit?: number;
  showDetails?: boolean;
}

export default function MemberLeaderboard({ 
  teamId, 
  limit = 10, 
  showDetails = true 
}: MemberLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<MemberLeaderboardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [teamId, limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PerformanceService.generateMemberLeaderboard(teamId, limit);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading member leaderboard:', err);
      setError('Failed to load member leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">
            {teamId ? 'Team Member Leaderboard' : 'Member Leaderboard'}
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">
            {teamId ? 'Team Member Leaderboard' : 'Member Leaderboard'}
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">
            {teamId ? 'Team Member Leaderboard' : 'Member Leaderboard'}
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          No member performance data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">
              {teamId ? 'Team Member Leaderboard' : 'Member Leaderboard'}
            </h3>
          </div>
          <button
            onClick={loadLeaderboard}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="divide-y">
        {leaderboard.map((member) => (
          <div
            key={member.userId}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`text-2xl font-bold ${getRankColor(member.rank)} min-w-[3rem] text-center`}>
                {getRankBadge(member.rank)}
              </div>

              {/* Member Info */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{member.userName}</h4>
                {member.teamName && (
                  <p className="text-sm text-gray-500">{member.teamName}</p>
                )}
                
                {showDetails && (
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">
                        {member.completedAssignments} completed
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">
                        {member.conversionRate.toFixed(1)}% conversion
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Score Badge */}
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {member.score.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
