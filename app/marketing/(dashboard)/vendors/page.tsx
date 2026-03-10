/**
 * Marketing Dashboard - BDM Vendors Management Page
 * Dashboard for BDMs to manage vendors and assign them to teams
 * Requirements: 8.1, 8.2, 8.3
 */

'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Filter, MapPin, Phone, Mail, TrendingUp, UserPlus } from 'lucide-react';
import { BDMGuard } from '@/components/marketing/MarketingAuthGuard';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useTailorsOptimized } from '@/admin-services/useTailorsOptimized';
import type { Tailor } from '@/admin-services/useTailors';
import ExportButton from '@/components/marketing/export/ExportButton';

// Map Tailor to Vendor interface for compatibility
interface Vendor
{
    id: string;
    name: string;
    businessType: string;
    numberOfProducts: number;
    contactPerson: {
        name: string;
        phoneNumber: string;
        email: string;
    };
    address: {
        city: string;
        state: string;
        country: string;
    };
    status: 'active' | 'inactive';
    assignedToUserId?: string;
    assignedToUserName?: string;
    totalSales: number;
    totalOrders: number;
    createdAt: Date;
}

// Helper function to map Tailor to Vendor
const mapTailorToVendor = (tailor: Tailor): Vendor =>
{
    return {
        id: tailor.id,
        name: tailor.brand_name || tailor.brandName || 'Unknown Brand',
        businessType: tailor.wear_specialization || 'Fashion',
        numberOfProducts: tailor.totalProducts || 0,
        contactPerson: {
            name: tailor.tailor_registered_info?.['first-name'] && tailor.tailor_registered_info?.['last-name']
                ? `${tailor.tailor_registered_info['first-name']} ${tailor.tailor_registered_info['last-name']}`
                : tailor.identity_verification?.fullName || 'Unknown',
            phoneNumber: 'N/A', // Not available in tailor data
            email: tailor.tailor_registered_info?.email || 'N/A'
        },
        address: {
            city: tailor.company_address_verification?.city ||
                tailor.company_verification?.city ||
                tailor['company-verification']?.city || 'Unknown',
            state: tailor.company_address_verification?.state ||
                tailor.company_verification?.state ||
                tailor['company-verification']?.state || 'Unknown',
            country: tailor.company_address_verification?.country || 'Nigeria'
        },
        status: tailor.identity_verification?.status === 'verified' ? 'active' : 'inactive',
        assignedToUserId: undefined, // Will be implemented with marketing system
        assignedToUserName: undefined,
        totalSales: tailor.wallet || 0,
        totalOrders: tailor.totalOrders || 0,
        createdAt: new Date() // Not available in current tailor data
    };
};

export default function BDMVendorsPage()
{
    const { marketingUser } = useMarketingAuth();
    const { tailors, loading: tailorsLoading, error, loadMore, hasMore } = useTailorsOptimized({
        initialLimit: 50,
        autoLoad: true
    });
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [assignmentFilter, setAssignmentFilter] = useState<string>('all');

    useEffect(() =>
    {
        if (!tailorsLoading && tailors)
        {
            // Map tailors to vendors
            const mappedVendors = tailors.map(mapTailorToVendor);
            setVendors(mappedVendors);
            setLoading(false);
        }
        if (error)
        {
            setLoading(false);
        }
    }, [tailors, tailorsLoading, error]);

    const filteredVendors = vendors.filter(vendor =>
    {
        const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.businessType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.contactPerson.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
        const matchesAssignment = assignmentFilter === 'all' ||
            (assignmentFilter === 'assigned' && vendor.assignedToUserId) ||
            (assignmentFilter === 'unassigned' && !vendor.assignedToUserId);
        return matchesSearch && matchesStatus && matchesAssignment;
    });

    if (loading)
    {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error)
    {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vendors</h3>
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <BDMGuard>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-6 h-6" />
                                Vendor Management
                            </h1>
                            <p className="text-gray-600">Manage and track vendor relationships</p>
                        </div>
                        <div className="flex gap-2">
                            <ExportButton
                                label="Export Vendors"
                                endpoint="/api/marketing/export/vendors"
                                filename={`vendors-export-${new Date().toISOString().split('T')[0]}.csv`}
                                exportType="vendors"
                                filters={{
                                    status: statusFilter !== 'all' ? statusFilter : '',
                                    assignment: assignmentFilter !== 'all' ? assignmentFilter : ''
                                }}
                            />
                            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Vendor
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                                <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
                            </div>
                            <Building2 className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {vendors.filter(v => v.status === 'active').length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {vendors.reduce((sum, v) => sum + v.numberOfProducts, 0)}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {vendors.reduce((sum, v) => sum + v.totalOrders, 0)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Vendors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVendors.map((vendor) => (
                        <div key={vendor.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{vendor.name}</h3>
                                        <p className="text-sm text-gray-600">{vendor.businessType}</p>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vendor.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {vendor.status}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{vendor.numberOfProducts}</p>
                                        <p className="text-xs text-gray-600">Products</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{vendor.totalOrders}</p>
                                        <p className="text-xs text-gray-600">Orders</p>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Phone className="w-4 h-4" />
                                        <span>{vendor.contactPerson.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{vendor.contactPerson.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4" />
                                        <span>{vendor.address.city}, {vendor.address.state}</span>
                                    </div>
                                </div>

                                {/* Wallet/Sales Info */}
                                <div className="mb-4 p-2 bg-green-50 rounded-lg">
                                    <p className="text-xs text-green-600">Wallet Balance</p>
                                    <p className="text-sm font-medium text-green-900">${vendor.totalSales.toLocaleString()}</p>
                                </div>

                                {/* Assignment */}
                                {vendor.assignedToUserName ? (
                                    <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-600">Assigned to</p>
                                        <p className="text-sm font-medium text-blue-900">{vendor.assignedToUserName}</p>
                                    </div>
                                ) : (
                                    <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Not assigned</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                                        View Details
                                    </button>
                                    <button className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90">
                                        Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredVendors.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                        <p className="text-gray-500">
                            {vendors.length === 0
                                ? "No vendors available in the system"
                                : "Try adjusting your search or filter criteria"
                            }
                        </p>
                    </div>
                )}
            </div>
        </BDMGuard>
    );
}