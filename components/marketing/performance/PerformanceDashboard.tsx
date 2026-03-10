'use client';

import React, { useState } from 'react';
import TeamLeaderboard from './TeamLeaderboard';
import MemberLeaderboard from './MemberLeaderboard';
import PerformanceTrends from './PerformanceTrends';
import { BarChart3, Users, Award, TrendingUp } from 'lucide-react';

interface PerformanceDashboardProps {
  teamId?: string;
  userId?: string;
  showTeamLeaderboard?: boolean;
  showMemberLeaderboard?: boolean;
  showTrends?: boolean;
}

export default function PerformanceDashboard({
  teamId,
  userId,
  showTeamLeaderboard = true,
  showMemberLeaderboard = true,
  showTrends = true
}: PerformanceDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'teams' | 'members' | 'trends'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Track team and member performance metrics
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>

        {/* View Selector */}
        <div className="mt-6 flex gap-2 border-b">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedView === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </div>
          </button>
          {showTeamLeaderboard && (
            <button
              onClick={() => setSelectedView('teams')}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedView === 'teams'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Teams
              </div>
            </button>
          )}
          {showMemberLeaderboard && (
            <button
              onClick={() => setSelectedView('members')}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedView === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Members
              </div>
            </button>
          )}
          {showTrends && (
            <button
              onClick={() => setSelectedView('trends')}
              className={`px-4 py-2 font-medium transition-colors ${
                selectedView === 'trends'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trends
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showTeamLeaderboard && (
            <div>
              <TeamLeaderboard limit={5} showDetails={true} />
            </div>
          )}
          {showMemberLeaderboard && (
            <div>
              <MemberLeaderboard teamId={teamId} limit={5} showDetails={true} />
            </div>
          )}
          {showTrends && (
            <div className="lg:col-span-2">
              <PerformanceTrends 
                userId={userId}
                teamId={teamId}
                periodType="month"
                periodsCount={6}
                title="Performance Trends (Last 6 Months)"
              />
            </div>
          )}
        </div>
      )}

      {selectedView === 'teams' && showTeamLeaderboard && (
        <div>
          <TeamLeaderboard limit={20} showDetails={true} />
        </div>
      )}

      {selectedView === 'members' && showMemberLeaderboard && (
        <div>
          <MemberLeaderboard teamId={teamId} limit={20} showDetails={true} />
        </div>
      )}

      {selectedView === 'trends' && showTrends && (
        <div className="space-y-6">
          <PerformanceTrends 
            userId={userId}
            teamId={teamId}
            periodType="month"
            periodsCount={12}
            title="Monthly Performance Trends"
          />
          <PerformanceTrends 
            userId={userId}
            teamId={teamId}
            periodType="week"
            periodsCount={12}
            title="Weekly Performance Trends"
          />
        </div>
      )}
    </div>
  );
}
