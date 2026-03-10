'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ExportService } from '@/lib/marketing/export-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface ExportButtonProps {
    label?: string;
    endpoint: string;
    filename: string;
    exportType: 'vendors' | 'analytics' | 'users' | 'teams';
    filters?: Record<string, string>;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export default function ExportButton({
    label = 'Export CSV',
    endpoint,
    filename,
    exportType,
    filters = {},
    variant = 'outline',
    size = 'md'
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { marketingUser, refreshUser } = useMarketingAuth();

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            // Build query string from filters
            const queryParams = new URLSearchParams(filters);
            const url = `${endpoint}?${queryParams.toString()}`;

            // Fetch data from API with authentication
            let response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch export data');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Export failed');
            }

            // Export based on type
            switch (exportType) {
                case 'vendors':
                    await ExportService.exportVendorPerformance(result.data, {
                        format: 'csv',
                        filename
                    });
                    break;
                case 'analytics':
                    await ExportService.exportOrganizationAnalytics(result.data, {
                        format: 'csv',
                        filename
                    });
                    break;
                case 'users':
                    await ExportService.exportUserData(result.data, {
                        format: 'csv',
                        filename
                    });
                    break;
                case 'teams':
                    await ExportService.exportTeamPerformance(result.data, {
                        format: 'csv',
                        filename
                    });
                    break;
            }

        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`
        flex items-center gap-2 rounded-lg font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
        >
            {isExporting ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    );
}
