"use client";

import { useState, useEffect } from 'react';
import { Plus, Upload, Download, BarChart3, Settings, Search } from 'lucide-react';
import { BogoMappingsList } from './BogoMappingsList';
import { BogoMappingForm } from './BogoMappingForm';
import { BogoBulkImport } from './BogoBulkImport';
import { BogoAnalyticsDashboard } from './BogoAnalyticsDashboard';
import { bogoMappingService } from '@/lib/bogo/mapping-service';
import type { BogoMapping, BogoDashboardData } from '@/types/bogo';

type DashboardView = 'mappings' | 'create' | 'bulk-import' | 'analytics';

export function BogoDashboard() {
  const [currentView, setCurrentView] = useState<DashboardView>('mappings');
  const [mappings, setMappings] = useState<BogoMapping[]>([]);
  const [dashboardData, setDashboardData] = useState<BogoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all mappings
      const allMappings = await bogoMappingService.getAllMappings({
        orderBy: 'updatedAt',
        orderDirection: 'desc'
      });
      setMappings(allMappings);

      // Calculate dashboard metrics
      const activeMappings = allMappings.filter(m => m.active);
      const totalRedemptions = allMappings.reduce((sum, m) => sum + m.redemptionCount, 0);
      const totalRevenue = allMappings.reduce((sum, m) => sum + m.totalRevenue, 0);

      // Get top performing mappings
      const topPerformingMappings = allMappings
        .filter(m => m.redemptionCount > 0)
        .sort((a, b) => b.redemptionCount - a.redemptionCount)
        .slice(0, 5)
        .map(m => ({
          mappingId: m.id,
          mainProductName: `Product ${m.mainProductId}`, // In real app, would fetch product name
          redemptions: m.redemptionCount,
          revenue: m.totalRevenue
        }));

      // Calculate recent activity (mock data for now)
      const recentActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          redemptions: Math.floor(Math.random() * 50),
          revenue: Math.floor(Math.random() * 10000)
        };
      }).reverse();

      // Get upcoming expirations
      const now = new Date();
      const upcomingExpirations = allMappings
        .filter(m => {
          const expiresAt = m.promotionEndDate.toDate();
          const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry > 0 && daysUntilExpiry <= 7; // Expiring within 7 days
        })
        .map(m => ({
          mappingId: m.id,
          mainProductName: `Product ${m.mainProductId}`,
          expiresAt: m.promotionEndDate.toDate()
        }));

      const dashboardMetrics: BogoDashboardData = {
        activeMappings: activeMappings.length,
        totalRedemptions,
        totalRevenue,
        topPerformingMappings,
        recentActivity,
        upcomingExpirations
      };

      setDashboardData(dashboardMetrics);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingCreated = () => {
    loadDashboardData();
    setCurrentView('mappings');
  };

  const handleMappingUpdated = () => {
    loadDashboardData();
  };

  const handleBulkImportComplete = () => {
    loadDashboardData();
    setCurrentView('mappings');
  };

  const handleExportMappings = async (format: 'csv' | 'json') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        content = await bogoMappingService.exportMappingsToCSV();
        filename = `bogo-mappings-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = await bogoMappingService.exportMappingsToJSON();
        filename = `bogo-mappings-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export mappings:', err);
      setError('Failed to export mappings. Please try again.');
    }
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = searchTerm === '' || 
      mapping.mainProductId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.freeProductIds.some(id => id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      mapping.promotionName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === null || mapping.active === filterActive;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-600">Monitor your BOGO promotion performance</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentView('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Mapping
            </button>
            <button
              onClick={() => setCurrentView('bulk-import')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </button>
            <div className="relative">
              <button
                onClick={() => {}}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                <div className="py-1">
                  <button
                    onClick={() => handleExportMappings('csv')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExportMappings('json')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 text-sm font-medium">Active Mappings</div>
              <div className="text-2xl font-bold text-blue-900">{dashboardData.activeMappings}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 text-sm font-medium">Total Redemptions</div>
              <div className="text-2xl font-bold text-green-900">{dashboardData.totalRedemptions.toLocaleString()}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 text-sm font-medium">Total Revenue</div>
              <div className="text-2xl font-bold text-purple-900">${dashboardData.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-orange-600 text-sm font-medium">Expiring Soon</div>
              <div className="text-2xl font-bold text-orange-900">{dashboardData.upcomingExpirations.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setCurrentView('mappings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'mappings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Manage Mappings
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>

        <div className="p-6">
          {currentView === 'mappings' && (
            <div className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search mappings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterActive(value === 'all' ? null : value === 'active');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              <BogoMappingsList
                mappings={filteredMappings}
                onMappingUpdated={handleMappingUpdated}
                onRefresh={loadDashboardData}
              />
            </div>
          )}

          {currentView === 'create' && (
            <BogoMappingForm
              onSuccess={handleMappingCreated}
              onCancel={() => setCurrentView('mappings')}
            />
          )}

          {currentView === 'bulk-import' && (
            <BogoBulkImport
              onSuccess={handleBulkImportComplete}
              onCancel={() => setCurrentView('mappings')}
            />
          )}

          {currentView === 'analytics' && dashboardData && (
            <BogoAnalyticsDashboard dashboardData={dashboardData} />
          )}
        </div>
      </div>
    </div>
  );
}