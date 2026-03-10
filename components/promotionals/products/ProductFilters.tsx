'use client';

import { Search } from 'lucide-react';

interface ProductFiltersProps
{
    searchQuery: string;
    onSearchChange: (query: string) => void;
    vendors: string[];
    selectedVendor: string;
    onVendorChange: (vendor: string) => void;
}

export function ProductFilters({
    searchQuery,
    onSearchChange,
    vendors,
    selectedVendor,
    onVendorChange,
}: ProductFiltersProps)
{
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Search */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Products
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by name or vendor..."
                        className="w-full text-black pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                    />
                </div>
            </div>

            {/* Vendor Filter */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Vendor
                </label>
                <select
                    value={selectedVendor}
                    onChange={(e) => onVendorChange(e.target.value)}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                >
                    <option value="">All Vendors</option>
                    {vendors.map((vendor) => (
                        <option key={vendor} value={vendor}>
                            {vendor}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
