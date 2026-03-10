'use client';

import { useState } from 'react';
import { NotificationPreferences as NotificationPreferencesType } from '@/types/vendor-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Mail,
  Bell,
  Package,
  DollarSign,
  TrendingDown,
  Star,
  Trophy,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferencesProps {
  preferences: NotificationPreferencesType;
  onSave: (preferences: Partial<Omit<NotificationPreferencesType, 'vendorId' | 'updatedAt'>>) => Promise<void>;
}

export function NotificationPreferences({
  preferences,
  onSave
}: NotificationPreferencesProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggleEmail = () => {
    setLocalPreferences(prev => ({
      ...prev,
      emailNotifications: !prev.emailNotifications
    }));
    setHasChanges(true);
  };

  const handleTogglePush = () => {
    setLocalPreferences(prev => ({
      ...prev,
      pushNotifications: !prev.pushNotifications
    }));
    setHasChanges(true);
  };

  const handleToggleCategory = (category: keyof NotificationPreferencesType['categories']) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        emailNotifications: localPreferences.emailNotifications,
        pushNotifications: localPreferences.pushNotifications,
        categories: localPreferences.categories
      });
      setHasChanges(false);
      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const categories = [
    {
      key: 'stock' as const,
      label: 'Stock Alerts',
      description: 'Low stock, out of stock, and inventory warnings',
      icon: <Package className="h-5 w-5 text-orange-600" />
    },
    {
      key: 'payout' as const,
      label: 'Payout Notifications',
      description: 'Payment processing, transfers, and payout updates',
      icon: <DollarSign className="h-5 w-5 text-emerald-600" />
    },
    {
      key: 'performance' as const,
      label: 'Performance Alerts',
      description: 'Sales metrics, cancellation rates, and quality issues',
      icon: <TrendingDown className="h-5 w-5 text-red-600" />
    },
    {
      key: 'ranking' as const,
      label: 'Ranking Updates',
      description: 'Product visibility, ranking changes, and optimization tips',
      icon: <Star className="h-5 w-5 text-amber-600" />
    },
    {
      key: 'milestone' as const,
      label: 'Milestones & Achievements',
      description: 'Sales milestones, trending products, and celebrations',
      icon: <Trophy className="h-5 w-5 text-blue-600" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-600">
            Manage how you receive notifications
          </p>
        </div>
      </div>

      {/* Delivery Methods */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Delivery Methods</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive important alerts and updates via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={localPreferences.emailNotifications}
              onCheckedChange={handleToggleEmail}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Label htmlFor="push-notifications" className="text-base font-medium cursor-pointer">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Get instant notifications in your browser
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={localPreferences.pushNotifications}
              onCheckedChange={handleTogglePush}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Notification Categories</CardTitle>
          <CardDescription>
            Select which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(category => (
            <div key={category.key} className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                  {category.icon}
                </div>
                <div>
                  <Label
                    htmlFor={`category-${category.key}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {category.label}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
              <Switch
                id={`category-${category.key}`}
                checked={localPreferences.categories[category.key]}
                onCheckedChange={() => handleToggleCategory(category.key)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Actions */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mr-auto">
            You have unsaved changes
          </p>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
