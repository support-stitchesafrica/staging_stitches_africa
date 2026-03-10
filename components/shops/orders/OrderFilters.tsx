'use client';

interface OrderFiltersProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  orderCount: number;
}

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function OrderFilters({
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  orderCount,
}: OrderFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders by title, order ID, or tailor..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {orderCount} {orderCount === 1 ? 'order' : 'orders'} found
        </div>
      </div>

      {/* Active Filters */}
      {(selectedStatus !== 'all' || searchTerm) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {ORDER_STATUSES.find(s => s.value === selectedStatus)?.label}
                <button
                  onClick={() => onStatusChange('all')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                >
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                    <path fillRule="evenodd" d="M5.354 4L8 1.354 6.646.146 4 2.793 1.354.146.146 1.354 2.793 4 .146 6.646 1.354 7.854 4 5.207l2.646 2.647L7.854 6.646 5.207 4z" />
                  </svg>
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                >
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                    <path fillRule="evenodd" d="M5.354 4L8 1.354 6.646.146 4 2.793 1.354.146.146 1.354 2.793 4 .146 6.646 1.354 7.854 4 5.207l2.646 2.647L7.854 6.646 5.207 4z" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={() => {
                onStatusChange('all');
                onSearchChange('');
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}