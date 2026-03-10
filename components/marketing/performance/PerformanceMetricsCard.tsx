'use client';

import React, { useEffect, useState } from 'react';
import { PerformanceService, TeamPerformance, MemberPerformance } from '@/lib/marketing/performance-service';
import { TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Activity } from 'lucide-react';

interface PerformanceMetricsCardProps {
  type: 'team' | 'member';
  id: string; // teamId or userId
  showComparison?: boolean;
}

export default function PerformanceMetricsCard({ 
  type, 
  id,
  showComparison = false 
}: PerformanceMetricsCardProps) {
  const [performance, setPerformance] = useState<TeamPerformance | MemberPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformance();
  }, [type, id]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (type === 'team') {
        const data = await PerformanceService.calculateTeamPerformance(id);
        setPerformance(data);
      } else {
        const data = await PerformanceService.calculateMemberPerformance(id);
        setPerformance(data);
      }
    } catch (err) {
      console.error('Error loading performance:', err);
      setError('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConversionBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-50';
    if (rate >= 60) return 'bg-blue-50';
    if (rate >= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'No data available'}</p>
          <button
            onClick={loadPerformance}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isTeam = 'teamName' in performance;
  const name = isTeam 
    ? (performance as TeamPerformance).teamName 
    : (performance as MemberPerformance).userName;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {isTeam ? 'Team Performance' : 'Member Performance'}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Assignments */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {performance.totalAssignments}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>

          {/* Active Assignments */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {performance.activeAssignments}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>

          {/* Completed Assignments */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {performance.completedAssignments}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>

          {/* Conversion Rate */}
          <div className={`${getConversionBgColor(performance.conversionRate)} rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              {performance.conversionRate >= 50 ? (
                <TrendingUp className={`w-5 h-5 ${getConversionColor(performance.conversionRate)}`} />
              ) : (
                <TrendingDown className={`w-5 h-5 ${getConversionColor(performance.conversionRate)}`} />
              )}
            </div>
            <div className={`text-2xl font-bold ${getConversionColor(performance.conversionRate)}`}>
              {performance.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Conversion</div>
          </div>
        </div>

        {/* Additional Team Metrics */}
        {isTeam && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Team Members</div>
                <div className="text-xl font-semibold text-gray-900">
                  {(performance as TeamPerformance).memberCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg per Member</div>
                <div className="text-xl font-semibold text-gray-900">
                  {(performance as TeamPerformance).averageAssignmentsPerMember.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Member Metrics */}
        {!isTeam && (performance as MemberPerformance).teamName && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm text-gray-600">Team</div>
            <div className="text-lg font-semibold text-gray-900">
              {(performance as MemberPerformance).teamName}
            </div>
          </div>
        )}

        {/* Cancelled Assignments */}
        {performance.cancelledAssignments > 0 && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <div className="text-sm font-medium text-red-900">
                {performance.cancelledAssignments} Cancelled
              </div>
              <div className="text-xs text-red-700">
                May need attention
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
