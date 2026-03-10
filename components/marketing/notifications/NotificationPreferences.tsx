/**
 * Notification Preferences Component
 * Allows users to manage their notification preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { NotificationPreferences } from '@/lib/marketing/types';

interface NotificationPreferencesComponentProps {
  userId: string;
}

const defaultPreferences: Omit<NotificationPreferences, 'userId' | 'updatedAt'> = {
  emailNotifications: {
    invitations: true,
    vendorAssignments: true,
    vendorReassignments: true,
    systemAlerts: true,
    roleChanges: true,
    teamAssignments: true,
    taskUpdates: true,
    taskAssignments: true,
  },
  inAppNotifications: {
    invitations: true,
    vendorAssignments: true,
    vendorReassignments: true,
    systemAlerts: true,
    roleChanges: true,
    teamAssignments: true,
    taskUpdates: true,
    taskAssignments: true,
  },
};

const notificationTypes = [
  { key: 'invitations', label: 'Invitations', description: 'Team and collaboration invitations' },
  { key: 'vendorAssignments', label: 'Vendor Assignments', description: 'New vendor assignments' },
  { key: 'vendorReassignments', label: 'Vendor Reassignments', description: 'Vendor reassignment updates' },
  { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
  { key: 'roleChanges', label: 'Role Changes', description: 'Changes to your role or permissions' },
  { key: 'teamAssignments', label: 'Team Assignments', description: 'Team-related assignments' },
  { key: 'taskUpdates', label: 'Task Updates', description: 'Updates on your tasks' },
  { key: 'taskAssignments', label: 'Task Assignments', description: 'New task assignments' },
];

export function NotificationPreferencesComponent({ userId }: NotificationPreferencesComponentProps) {
  const [preferences, setPreferences] = useState<Omit<NotificationPreferences, 'userId' | 'updatedAt'>>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefsRef = doc(db, 'marketing_notification_preferences', userId);
      const prefsSnap = await getDoc(prefsRef);

      if (prefsSnap.exists()) {
        const data = prefsSnap.data() as NotificationPreferences;
        setPreferences({
          emailNotifications: data.emailNotifications,
          inAppNotifications: data.inAppNotifications,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const prefsRef = doc(db, 'marketing_notification_preferences', userId);
      
      await setDoc(prefsRef, {
        userId,
        ...preferences,
        updatedAt: Timestamp.now(),
      });

      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (
    category: 'emailNotifications' | 'inAppNotifications',
    key: string,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications about marketing activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Email Notifications</h3>
          </div>
          <div className="space-y-4 pl-7">
            {notificationTypes.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`email-${key}`} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={`email-${key}`}
                  checked={preferences.emailNotifications[key as keyof typeof preferences.emailNotifications]}
                  onCheckedChange={(checked) => handleToggle('emailNotifications', key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">In-App Notifications</h3>
          </div>
          <div className="space-y-4 pl-7">
            {notificationTypes.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`inapp-${key}`} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={`inapp-${key}`}
                  checked={preferences.inAppNotifications[key as keyof typeof preferences.inAppNotifications]}
                  onCheckedChange={(checked) => handleToggle('inAppNotifications', key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
