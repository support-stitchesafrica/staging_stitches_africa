'use client';

import { useState, useEffect } from 'react';
import { FileText, Calendar, Download, Plus, Trash2, Edit, Clock } from 'lucide-react';
import ExportButton from '@/components/marketing/export/ExportButton';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';

interface ReportTemplate
{
    id: string;
    name: string;
    description: string;
    type: 'vendor_performance' | 'team_performance' | 'organization_analytics' | 'custom';
    filters: Record<string, any>;
    schedule?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        dayOfWeek?: number;
        dayOfMonth?: number;
        time: string;
        enabled: boolean;
    };
    createdAt: Date;
    lastRun?: Date;
}

export default function ReportsPage()
{
    const [reports, setReports] = useState<ReportTemplate[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);

    useEffect(() =>
    {
        // Load saved reports from localStorage
        const savedReports = localStorage.getItem('marketing_reports');
        if (savedReports)
        {
            const parsed = JSON.parse(savedReports);
            setReports(parsed.map((r: any) => ({
                ...r,
                createdAt: new Date(r.createdAt),
                lastRun: r.lastRun ? new Date(r.lastRun) : undefined
            })));
        }
    }, []);

    const saveReports = (updatedReports: ReportTemplate[]) =>
    {
        localStorage.setItem('marketing_reports', JSON.stringify(updatedReports));
        setReports(updatedReports);
    };

    const handleDeleteReport = (reportId: string) =>
    {
        const updated = reports.filter(r => r.id !== reportId);
        saveReports(updated);
    };

    const handleRunReport = (report: ReportTemplate) =>
    {
        // Update last run time
        const updated = reports.map(r =>
            r.id === report.id ? { ...r, lastRun: new Date() } : r
        );
        saveReports(updated);
    };

    return (
        <MarketingAuthGuard requiredPermissions={['canExportData']}>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-6 h-6" />
                            Reports & Analytics
                        </h1>
                        <p className="text-gray-600">Create, schedule, and manage custom reports</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Report
                    </button>
                </div>
            </div>

            {/* Quick Reports */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickReportCard
                        title="Vendor Performance"
                        description="Export all vendor metrics"
                        icon={FileText}
                        endpoint="/api/marketing/export/vendors"
                        filename={`vendor-performance-${new Date().toISOString().split('T')[0]}.csv`}
                        exportType="vendors"
                    />
                    <QuickReportCard
                        title="Organization Analytics"
                        description="Overall organization metrics"
                        icon={FileText}
                        endpoint="/api/marketing/export/analytics"
                        filename={`organization-analytics-${new Date().toISOString().split('T')[0]}.csv`}
                        exportType="analytics"
                    />
                    <QuickReportCard
                        title="User Data"
                        description="Export user information"
                        icon={FileText}
                        endpoint="/api/marketing/export/users"
                        filename={`user-data-${new Date().toISOString().split('T')[0]}.csv`}
                        exportType="users"
                    />
                    <QuickReportCard
                        title="Team Performance"
                        description="Team metrics and rankings"
                        icon={FileText}
                        endpoint="/api/marketing/export/teams"
                        filename={`team-performance-${new Date().toISOString().split('T')[0]}.csv`}
                        exportType="teams"
                    />
                </div>
            </div>

            {/* Saved Reports */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Reports</h2>
                {reports.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reports</h3>
                        <p className="text-gray-500 mb-4">Create custom reports with filters and scheduling</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                        >
                            Create Your First Report
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((report) => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                onDelete={handleDeleteReport}
                                onRun={handleRunReport}
                                onEdit={(r) =>
                                {
                                    setSelectedReport(r);
                                    setShowCreateModal(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Report Modal */}
            {showCreateModal && (
                <CreateReportModal
                    report={selectedReport}
                    onClose={() =>
                    {
                        setShowCreateModal(false);
                        setSelectedReport(null);
                    }}
                    onSave={(report) =>
                    {
                        if (selectedReport)
                        {
                            // Update existing
                            const updated = reports.map(r => r.id === report.id ? report : r);
                            saveReports(updated);
                        } else
                        {
                            // Create new
                            saveReports([...reports, report]);
                        }
                        setShowCreateModal(false);
                        setSelectedReport(null);
                    }}
                />
            )}
        </div>
        </MarketingAuthGuard>
    );
}

function QuickReportCard({
    title,
    description,
    icon: Icon,
    endpoint,
    filename,
    exportType
}: {
    title: string;
    description: string;
    icon: any;
    endpoint: string;
    filename: string;
    exportType: 'vendors' | 'analytics' | 'users' | 'teams';
})
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            <ExportButton
                label="Generate"
                endpoint={endpoint}
                filename={filename}
                exportType={exportType}
                variant="primary"
                size="sm"
            />
        </div>
    );
}

function ReportCard({
    report,
    onDelete,
    onRun,
    onEdit
}: {
    report: ReportTemplate;
    onDelete: (id: string) => void;
    onRun: (report: ReportTemplate) => void;
    onEdit: (report: ReportTemplate) => void;
})
{
    const getEndpoint = () =>
    {
        switch (report.type)
        {
            case 'vendor_performance': return '/api/marketing/export/vendors';
            case 'team_performance': return '/api/marketing/export/teams';
            case 'organization_analytics': return '/api/marketing/export/analytics';
            default: return '/api/marketing/export/vendors';
        }
    };

    const getExportType = (): 'vendors' | 'analytics' | 'users' | 'teams' =>
    {
        switch (report.type)
        {
            case 'vendor_performance': return 'vendors';
            case 'team_performance': return 'teams';
            case 'organization_analytics': return 'analytics';
            default: return 'vendors';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.name}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(report)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(report.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Schedule Info */}
            {report.schedule?.enabled && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-900">
                        <Clock className="w-4 h-4" />
                        <span>
                            Scheduled: {report.schedule.frequency} at {report.schedule.time}
                        </span>
                    </div>
                </div>
            )}

            {/* Last Run */}
            {report.lastRun && (
                <div className="mb-4 text-sm text-gray-600">
                    Last run: {report.lastRun.toLocaleString()}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <ExportButton
                    label="Run Report"
                    endpoint={getEndpoint()}
                    filename={`${report.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`}
                    exportType={getExportType()}
                    filters={report.filters}
                    variant="primary"
                    size="sm"
                />
            </div>
        </div>
    );
}

function CreateReportModal({
    report,
    onClose,
    onSave
}: {
    report: ReportTemplate | null;
    onClose: () => void;
    onSave: (report: ReportTemplate) => void;
})
{
    const [formData, setFormData] = useState<Partial<ReportTemplate>>({
        name: report?.name || '',
        description: report?.description || '',
        type: report?.type || 'vendor_performance',
        filters: report?.filters || {},
        schedule: report?.schedule || {
            frequency: 'weekly',
            dayOfWeek: 1,
            time: '09:00',
            enabled: false
        }
    });

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();

        const newReport: ReportTemplate = {
            id: report?.id || `report_${Date.now()}`,
            name: formData.name!,
            description: formData.description!,
            type: formData.type!,
            filters: formData.filters!,
            schedule: formData.schedule,
            createdAt: report?.createdAt || new Date(),
            lastRun: report?.lastRun
        };

        onSave(newReport);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {report ? 'Edit Report' : 'Create New Report'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="vendor_performance">Vendor Performance</option>
                            <option value="team_performance">Team Performance</option>
                            <option value="organization_analytics">Organization Analytics</option>
                        </select>
                    </div>

                    {/* Schedule */}
                    <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-medium text-gray-700">
                                Schedule Report
                            </label>
                            <input
                                type="checkbox"
                                checked={formData.schedule?.enabled}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    schedule: { ...formData.schedule!, enabled: e.target.checked }
                                })}
                                className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                        </div>

                        {formData.schedule?.enabled && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Frequency
                                    </label>
                                    <select
                                        value={formData.schedule.frequency}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            schedule: { ...formData.schedule!, frequency: e.target.value as any }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.schedule.time}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            schedule: { ...formData.schedule!, time: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            {report ? 'Update Report' : 'Create Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
