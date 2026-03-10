/**
 * System Settings Component
 * 
 * Manages system-wide configuration, feature flags, and administrative settings.
 * Integrates with admin collections for system management.
 * 
 * Requirements: 11.5, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Database, 
  Globe, 
  Bell, 
  Mail, 
  Key, 
  Activity,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Toggle
} from 'lucide-react';
import DashboardCard from '../DashboardCard';
import StatsCard from '../StatsCard';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';

interface SystemConfig {
  general: {
    siteName: string;
    siteUrl: string;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
  };
  features: {
    userRegistration: boolean;
    guestCheckout: boolean;
    productReviews: boolean;
    wishlist: boolean;
    referralProgram: boolean;
  };
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  email: 'healthy' | 'warning' | 'error';
  uptime: string;
  lastBackup: string;
}

export default function SystemSettings() {
  const { hasPermission } = useBackOfficeAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  const canWrite = hasPermission('admin', 'write');
  const canDelete = hasPermission('admin', 'delete');

  useEffect(() => {
    async function fetchSystemData() {
      try {
        setLoading(true);
        setError(null);

        // Mock data - in real implementation, fetch from API
        const mockConfig: SystemConfig = {
          general: {
            siteName: 'Stitches Africa',
            siteUrl: 'https://stitchesafrica.com',
            maintenanceMode: false,
            debugMode: false,
          },
          email: {
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUser: 'noreply@stitchesafrica.com',
            smtpSecure: true,
            fromEmail: 'noreply@stitchesafrica.com',
            fromName: 'Stitches Africa',
          },
          notifications: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            adminAlerts: true,
          },
          security: {
            sessionTimeout: 30,
            maxLoginAttempts: 5,
            passwordMinLength: 8,
            requireTwoFactor: false,
          },
          features: {
            userRegistration: true,
            guestCheckout: true,
            productReviews: true,
            wishlist: true,
            referralProgram: true,
          },
        };

        const mockHealth: SystemHealth = {
          database: 'healthy',
          api: 'healthy',
          storage: 'healthy',
          email: 'warning',
          uptime: '99.9%',
          lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        };

        setConfig(mockConfig);
        setHealth(mockHealth);
      } catch (err) {
        console.error('Error fetching system data:', err);
        setError('Failed to load system settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSystemData();
  }, []);

  const handleSave = async () => {
    if (!canWrite || !config) return;

    try {
      setSaving(true);
      // Mock save - in real implementation, send to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving config:', config);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardCard title="System Settings" description="Loading settings...">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-16"></div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Error" description="Failed to load system settings" icon={Settings}>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </DashboardCard>
    );
  }

  if (!config || !health) {
    return null;
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'features', label: 'Features', icon: Toggle },
    { id: 'health', label: 'System Health', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        {canWrite && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          value="Healthy"
          label="Database Status"
          icon={Database}
          variant={health.database === 'healthy' ? 'success' : 'warning'}
        />
        
        <StatsCard
          value="Active"
          label="API Status"
          icon={Globe}
          variant={health.api === 'healthy' ? 'success' : 'warning'}
        />
        
        <StatsCard
          value={health.uptime}
          label="System Uptime"
          icon={Activity}
          variant="primary"
        />
        
        <StatsCard
          value="24h ago"
          label="Last Backup"
          icon={Shield}
          variant="secondary"
        />
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                    disabled={!canWrite}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={config.general.siteUrl}
                    onChange={(e) => updateConfig('general', 'siteUrl', e.target.value)}
                    disabled={!canWrite}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                    <p className="text-sm text-gray-500">Temporarily disable site access for maintenance</p>
                  </div>
                  <button
                    onClick={() => updateConfig('general', 'maintenanceMode', !config.general.maintenanceMode)}
                    disabled={!canWrite}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.general.maintenanceMode ? 'bg-blue-600' : 'bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Debug Mode</h4>
                    <p className="text-sm text-gray-500">Enable detailed error logging and debugging</p>
                  </div>
                  <button
                    onClick={() => updateConfig('general', 'debugMode', !config.general.debugMode)}
                    disabled={!canWrite}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.general.debugMode ? 'bg-blue-600' : 'bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.general.debugMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(health).map(([key, value]) => {
                  if (key === 'uptime' || key === 'lastBackup') return null;
                  
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 capitalize">
                            {key} Service
                          </h4>
                          <p className="text-sm text-gray-500">
                            Current status and health check
                          </p>
                        </div>
                        <div className={`flex items-center space-x-2 ${getHealthColor(value as string)}`}>
                          {getHealthIcon(value as string)}
                          <span className="text-sm font-medium capitalize">{value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">System Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Uptime:</span>
                    <span className="ml-2 font-medium text-blue-900">{health.uptime}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Last Backup:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {new Date(health.lastBackup).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add other tab content as needed */}
          {activeTab !== 'general' && activeTab !== 'health' && (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {tabs.find(t => t.id === activeTab)?.label} settings will be implemented here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SystemSettings);
