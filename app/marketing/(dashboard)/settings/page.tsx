'use client';

import { Settings } from 'lucide-react';
import { NotificationPreferencesComponent } from '@/components/marketing/notifications/NotificationPreferences';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export default function SettingsPage()
{
    const { marketingUser } = useMarketingAuth();

    if (!marketingUser)
    {
        return null;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Settings className="h-8 w-8" />
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="space-y-6">
                <NotificationPreferencesComponent userId={marketingUser.id} />
            </div>
        </div>
    );
}
