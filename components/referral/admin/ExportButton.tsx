/**
 * Export Button Component
 * Provides CSV and PDF export functionality for referrer data
 * Requirement: 12.5
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import
    {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps
{
    token: string; // Firebase auth token for API calls
    filters?: {
        search?: string;
        filter?: string;
        dateFrom?: string;
        dateTo?: string;
    };
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
}

type ExportFormat = 'csv' | 'pdf';

/**
 * ExportButton Component
 * Allows admins to export referrer data in CSV or PDF format
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
    token,
    filters = {},
    variant = 'outline',
    size = 'default',
}) =>
{
    const [exporting, setExporting] = useState(false);
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

    /**
     * Handle export action
     * Requirement: 12.5 - CSV and PDF export functionality
     */
    const handleExport = async (format: ExportFormat) =>
    {
        try
        {
            setExporting(true);
            setExportingFormat(format);

            // Build query parameters
            const params = new URLSearchParams({
                format,
                ...filters,
            });

            // Call export API endpoint
            const response = await fetch(`/api/referral/admin/export?${params}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok)
            {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Export failed');
            }

            const data = await response.json();

            if (!data.success || !data.data)
            {
                throw new Error('Invalid export response');
            }

            // Download the file
            if (format === 'csv')
            {
                downloadCSV(data.data, data.filename || 'referrers-export.csv');
                toast.success('Export successful', {
                    description: 'CSV file has been downloaded',
                });
            } else if (format === 'pdf')
            {
                downloadPDF(data.data, data.filename || 'referrers-export.pdf');
                toast.success('Export successful', {
                    description: 'PDF file has been downloaded',
                });
            }
        } catch (err: any)
        {
            console.error('Error exporting data:', err);
            toast.error('Export failed', {
                description: err.message || 'Could not export data',
            });
        } finally
        {
            setExporting(false);
            setExportingFormat(null);
        }
    };

    /**
     * Download CSV file
     */
    const downloadCSV = (csvContent: string, filename: string) =>
    {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    /**
     * Download PDF file
     */
    const downloadPDF = (base64Content: string, filename: string) =>
    {
        // Convert base64 to blob
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++)
        {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} disabled={exporting}>
                    {exporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            Export
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                    {exportingFormat === 'csv' && (
                        <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                    {exportingFormat === 'pdf' && (
                        <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
