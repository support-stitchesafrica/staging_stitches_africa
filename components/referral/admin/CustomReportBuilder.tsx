/**
 * Custom Report Builder Component
 * Allows admins to build custom reports by date range
 * Requirement: 14.4
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import
{
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import
{
    FileText,
    Calendar as CalendarIcon,
    Download,
    Loader2,
    Filter,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomReportBuilderProps
{
    token: string; // Firebase auth token for API calls
}

type ReportType = 'referrers' | 'referrals' | 'transactions' | 'analytics';
type ExportFormat = 'csv' | 'json' | 'pdf';

interface ReportConfig
{
    type: ReportType;
    startDate: Date | undefined;
    endDate: Date | undefined;
    format: ExportFormat;
    includeFields: {
        personalInfo: boolean;
        financialData: boolean;
        activityMetrics: boolean;
        timestamps: boolean;
    };
}

/**
 * CustomReportBuilder Component
 * Allows admins to configure and generate custom reports with date ranges and filters
 * Requirement: 14.4 - Allow admins to build custom reports by date range
 */
export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({ token }) =>
{
    const [config, setConfig] = useState<ReportConfig>({
        type: 'referrers',
        startDate: undefined,
        endDate: undefined,
        format: 'csv',
        includeFields: {
            personalInfo: true,
            financialData: true,
            activityMetrics: true,
            timestamps: true,
        },
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [lastReport, setLastReport] = useState<{
        type: string;
        generatedAt: Date;
        recordCount: number;
    } | null>(null);

    /**
     * Update report configuration
     */
    const updateConfig = <K extends keyof ReportConfig>(
        key: K,
        value: ReportConfig[K]
    ) =>
    {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    /**
     * Update field inclusion
     */
    const updateFieldInclusion = (field: keyof ReportConfig['includeFields'], checked: boolean) =>
    {
        setConfig((prev) => ({
            ...prev,
            includeFields: {
                ...prev.includeFields,
                [field]: checked,
            },
        }));
    };

    /**
     * Validate report configuration
     */
    const validateConfig = (): string | null =>
    {
        if (!config.startDate)
        {
            return 'Please select a start date';
        }
        if (!config.endDate)
        {
            return 'Please select an end date';
        }
        if (config.startDate > config.endDate)
        {
            return 'Start date must be before end date';
        }
        if (!Object.values(config.includeFields).some((v) => v))
        {
            return 'Please select at least one field category to include';
        }
        return null;
    };

    /**
     * Generate and download report
     */
    const generateReport = async () =>
    {
        const validationError = validateConfig();
        if (validationError)
        {
            toast.error('Invalid Configuration', {
                description: validationError,
            });
            return;
        }

        setIsGenerating(true);

        try
        {
            const response = await fetch('/api/referral/admin/reports/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: config.type,
                    startDate: config.startDate?.toISOString(),
                    endDate: config.endDate?.toISOString(),
                    format: config.format,
                    includeFields: config.includeFields,
                }),
            });

            if (!response.ok)
            {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate report');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const fileName = `referral-${config.type}-report-${format(config.startDate!, 'yyyy-MM-dd')}-to-${format(config.endDate!, 'yyyy-MM-dd')}.${config.format}`;
            a.download = fileName;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Update last report info
            setLastReport({
                type: config.type,
                generatedAt: new Date(),
                recordCount: 0, // Could be extracted from response headers
            });

            toast.success('Report Generated', {
                description: `Your ${config.type} report has been downloaded`,
            });
        } catch (err: any)
        {
            console.error('Error generating report:', err);
            toast.error('Generation Failed', {
                description: err.message || 'Could not generate report',
            });
        } finally
        {
            setIsGenerating(false);
        }
    };


    /**
     * Get report type description
     */
    const getReportTypeDescription = (type: ReportType): string =>
    {
        const descriptions = {
            referrers: 'Export all referrer accounts with their performance metrics',
            referrals: 'Export all referral relationships and their conversion status',
            transactions: 'Export all point-earning transactions and purchases',
            analytics: 'Export aggregated analytics data by date',
        };
        return descriptions[type];
    };

    /**
     * Get field category description
     */
    const getFieldDescription = (field: keyof ReportConfig['includeFields']): string =>
    {
        const descriptions = {
            personalInfo: 'Names, emails, and referral codes',
            financialData: 'Revenue, points, and purchase amounts',
            activityMetrics: 'Referral counts, conversion rates, and activity status',
            timestamps: 'Creation dates, update dates, and event timestamps',
        };
        return descriptions[field];
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Custom Report Builder
                </CardTitle>
                <CardDescription>
                    Generate custom reports with specific date ranges and data fields
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Report Type Selection */}
                <div className="space-y-2">
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select
                        value={config.type}
                        onValueChange={(value: ReportType) => updateConfig('type', value)}
                    >
                        <SelectTrigger id="report-type">
                            <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="referrers">Referrers Report</SelectItem>
                            <SelectItem value="referrals">Referrals Report</SelectItem>
                            <SelectItem value="transactions">Transactions Report</SelectItem>
                            <SelectItem value="analytics">Analytics Report</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {getReportTypeDescription(config.type)}
                    </p>
                </div>

                {/* Date Range Selection */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Start Date */}
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !config.startDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {config.startDate ? (
                                        format(config.startDate, 'PPP')
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={config.startDate}
                                    onSelect={(date) => updateConfig('startDate', date)}
                                    initialFocus
                                    disabled={(date) => date > new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !config.endDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {config.endDate ? (
                                        format(config.endDate, 'PPP')
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={config.endDate}
                                    onSelect={(date) => updateConfig('endDate', date)}
                                    initialFocus
                                    disabled={(date) => date > new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select
                        value={config.format}
                        onValueChange={(value: ExportFormat) => updateConfig('format', value)}
                    >
                        <SelectTrigger id="export-format">
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                            <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                            <SelectItem value="pdf">PDF (Portable Document Format)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Field Selection */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Label>Include Fields</Label>
                    </div>
                    <div className="space-y-3 rounded-lg border p-4">
                        {(Object.keys(config.includeFields) as Array<keyof ReportConfig['includeFields']>).map(
                            (field) => (
                                <div key={field} className="flex items-start space-x-3">
                                    <Checkbox
                                        id={field}
                                        checked={config.includeFields[field]}
                                        onCheckedChange={(checked) =>
                                            updateFieldInclusion(field, checked as boolean)
                                        }
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor={field}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                        >
                                            {field.replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {getFieldDescription(field)}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                        {lastReport && (
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>
                                    Last report: {lastReport.type} at{' '}
                                    {format(lastReport.generatedAt, 'PPp')}
                                </span>
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={generateReport}
                        disabled={isGenerating}
                        className="min-w-[140px]"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Generate Report
                            </>
                        )}
                    </Button>
                </div>

                {/* Quick Date Presets */}
                <div className="space-y-2 pt-4 border-t">
                    <Label className="text-xs text-muted-foreground">Quick Date Ranges</Label>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                            {
                                const end = new Date();
                                const start = new Date();
                                start.setDate(start.getDate() - 7);
                                updateConfig('startDate', start);
                                updateConfig('endDate', end);
                            }}
                        >
                            Last 7 Days
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                            {
                                const end = new Date();
                                const start = new Date();
                                start.setDate(start.getDate() - 30);
                                updateConfig('startDate', start);
                                updateConfig('endDate', end);
                            }}
                        >
                            Last 30 Days
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                            {
                                const end = new Date();
                                const start = new Date();
                                start.setDate(start.getDate() - 90);
                                updateConfig('startDate', start);
                                updateConfig('endDate', end);
                            }}
                        >
                            Last 90 Days
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                            {
                                const end = new Date();
                                const start = new Date(end.getFullYear(), 0, 1);
                                updateConfig('startDate', start);
                                updateConfig('endDate', end);
                            }}
                        >
                            This Year
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
