/**
 * My Vendors Page - Team Member Vendor Management
 */

'use client';

import { useState, useEffect } from 'react';
import
    {
        Building2,
        Search,
        Package,
        DollarSign,
        Clock,
        Eye,
        MessageSquare
    } from 'lucide-react';
import { useTailors, type Tailor } from '@/admin-services/useTailors';
import MarketingAuthGuard from '@/components/marketing/MarketingAuthGuard';

interface VendorAssignment
{
    id: string;
    vendorId: string;
    assignedToUserId: string;
    assignedByUserId: string;
    assignmentDate: Date;
    status: 'active' | 'inactive';
    notes: string[];
    lastEngagementDate?: Date;
}

export default function MyVendorsPage()
{
    return (
        <MarketingAuthGuard requiredRole="team_member">
            <MyVendorsContent />
        </MarketingAuthGuard>
    );
}

function MyVendorsContent()
{
    const { tailors, loading: tailorsLoading, error: tailorsError } = useTailors();
    const [assignedVendors, setAssignedVendors] = useState<Tailor[]>([]);
    const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() =>
    {
        loadVendorData();
    }, [tailors]);

    const loadVendorData = async () =>
    {
        try
        {
            setLoading(true);

            // TODO: Replace with actual user ID from auth context
            const currentUserId = 'current-user-id';

            // Load vendor assignments for current user
            const assignmentsResponse = await fetch(`/api/marketing/vendors/assignments?userId=${currentUserId}`);
            if (assignmentsResponse.ok)
            {
                const assignmentsResult = await assignmentsResponse.json();
                if (assignmentsResult.success)
                {
                    setAssignments(assignmentsResult.data);

                    // Filter tailors to show only assigned ones
                    const assignedVendorIds = assignmentsResult.data.map((a: VendorAssignment) => a.vendorId);
                    const filteredVendors = tailors?.filter(tailor => assignedVendorIds.includes(tailor.id)) || [];
                    setAssignedVendors(filteredVendors);
                }
            }

        } catch (error)
        {
            console.error('Error loading vendor data:', error);
            setError('Failed to load vendor data');
        } finally
        {
            setLoading(false);
        }
    };

    const filteredVendors = assignedVendors.filter(vendor =>
    {
        const matchesSearch = vendor.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.brandName?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;

        const assignment = assignments.find(a => a.vendorId === vendor.id);
        const matchesStatus = assignment?.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading || tailorsLoading)
    {
        return <div className="animate-pulse">Loading vendors...</div>;
    }

    if (error || tailorsError)
    {
        return <div className="text-red-600">Error: {error || tailorsError}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Vendors</h1>
                    <p className="text-gray-600">Manage your assigned vendors</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <button
                    onClick={loadVendorData}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Refresh
                </button>
            </div>

            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor) =>
                {
                    const assignment = assignments.find(a => a.vendorId === vendor.id);
                    return (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            assignment={assignment}
                        />
                    );
                })}
            </div>

            {filteredVendors.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'Try adjusting your search criteria.' : 'No vendors have been assigned to you yet.'}
                    </p>
                </div>
            )}
        </div>
    );
}

function VendorCard({ vendor, assignment }: { vendor: Tailor; assignment?: VendorAssignment })
{
    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {vendor.brand_name || vendor.brandName || 'Unknown Brand'}
                    </h3>
                    <p className="text-sm text-gray-500">{vendor.wear_specialization || 'Fashion'}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${assignment?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {assignment?.status || 'Unknown'}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    {vendor.totalProducts || 0} Products
                </div>
                <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {vendor.totalOrders || 0} Orders
                </div>
                {assignment?.lastEngagementDate && (
                    <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        Last contact: {new Date(assignment.lastEngagementDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact
                </button>
            </div>
        </div>
    );
}