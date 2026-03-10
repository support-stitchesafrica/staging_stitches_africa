'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T>
{
    key: string;
    header: string;
    accessor: (row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}

export interface DataTableGAProps<T>
{
    columns: ColumnDef<T>[];
    data: T[];
    sortable?: boolean;
    pagination?: boolean;
    pageSize?: number;
    className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTableGA<T extends Record<string, any>>({
    columns,
    data,
    sortable = true,
    pagination = true,
    pageSize = 10,
    className = '',
}: DataTableGAProps<T>)
{
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Handle column sorting
    const handleSort = (columnKey: string, isSortable: boolean = true) =>
    {
        if (!sortable || !isSortable) return;

        if (sortColumn === columnKey)
        {
            // Cycle through: asc -> desc -> null
            if (sortDirection === 'asc')
            {
                setSortDirection('desc');
            } else if (sortDirection === 'desc')
            {
                setSortDirection(null);
                setSortColumn(null);
            }
        } else
        {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // Handle keyboard navigation for sorting
    const handleSortKeyDown = (e: React.KeyboardEvent, columnKey: string, isSortable: boolean = true) =>
    {
        if (e.key === 'Enter' || e.key === ' ')
        {
            e.preventDefault();
            handleSort(columnKey, isSortable);
        }
    };

    // Sort data
    const sortedData = useMemo(() =>
    {
        if (!sortColumn || !sortDirection) return data;

        return [...data].sort((a, b) =>
        {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue === bValue) return 0;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortColumn, sortDirection]);

    // Paginate data
    const paginatedData = useMemo(() =>
    {
        if (!pagination) return sortedData;

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage, pageSize, pagination]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    // Render sort icon
    const renderSortIcon = (columnKey: string, isSortable: boolean = true) =>
    {
        if (!sortable || !isSortable) return null;

        if (sortColumn !== columnKey)
        {
            return <ChevronsUpDown className="w-4 h-4 text-ga-secondary" />;
        }

        if (sortDirection === 'asc')
        {
            return <ChevronUp className="w-4 h-4 text-ga-blue" />;
        }

        return <ChevronDown className="w-4 h-4 text-ga-blue" />;
    };

    return (
        <div
            className={`bg-ga-background border border-ga rounded-lg shadow-ga-card theme-transition ${className}`}
            role="region"
            aria-label="Data table"
        >
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]" role="table">
                    <thead className="bg-ga-surface border-b border-ga">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`
                    px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-ga-primary
                    ${sortable && column.sortable !== false ? 'cursor-pointer select-none hover:bg-ga-background transition-colors focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-inset' : ''}
                  `}
                                    style={column.width ? { width: column.width } : undefined}
                                    onClick={() => handleSort(column.key, column.sortable !== false)}
                                    onKeyDown={(e) => handleSortKeyDown(e, column.key, column.sortable !== false)}
                                    tabIndex={sortable && column.sortable !== false ? 0 : undefined}
                                    role="columnheader"
                                    aria-sort={
                                        sortColumn === column.key
                                            ? sortDirection === 'asc'
                                                ? 'ascending'
                                                : sortDirection === 'desc'
                                                    ? 'descending'
                                                    : 'none'
                                            : 'none'
                                    }
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className="truncate">{column.header}</span>
                                        {renderSortIcon(column.key, column.sortable !== false)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-3 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-ga-secondary"
                                >
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={`
                    border-b border-ga last:border-b-0
                    hover:bg-ga-surface transition-ga-fast theme-transition
                    ${rowIndex % 2 === 0 ? 'bg-ga-background' : 'bg-ga-surface/50'}
                  `}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-ga-primary"
                                        >
                                            {column.accessor(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <nav
                    className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t border-ga gap-3"
                    role="navigation"
                    aria-label="Table pagination"
                >
                    <div
                        className="text-xs sm:text-sm text-ga-secondary text-center sm:text-left"
                        role="status"
                        aria-live="polite"
                    >
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
                        {sortedData.length} results
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2" role="group" aria-label="Pagination controls">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`
                p-1.5 sm:p-2 rounded-md border border-ga
                transition-colors flex-shrink-0
                focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-offset-2 focus:ring-offset-ga-background
                ${currentPage === 1
                                    ? 'text-ga-secondary cursor-not-allowed opacity-50'
                                    : 'text-ga-primary hover:bg-ga-surface'
                                }
              `}
                            aria-label="Go to previous page"
                        >
                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                        </button>
                        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
                            {
                                // Show first page, last page, current page, and pages around current
                                const showPage =
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1);

                                if (!showPage)
                                {
                                    // Show ellipsis
                                    if (page === currentPage - 2 || page === currentPage + 2)
                                    {
                                        return (
                                            <span key={page} className="px-1 sm:px-2 text-xs sm:text-sm text-ga-secondary">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`
                      px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium
                      transition-colors flex-shrink-0
                      focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-offset-2 focus:ring-offset-ga-background
                      ${currentPage === page
                                                ? 'bg-ga-blue text-white'
                                                : 'text-ga-primary hover:bg-ga-surface'
                                            }
                    `}
                                        aria-label={`Go to page ${page}`}
                                        aria-current={currentPage === page ? 'page' : undefined}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`
                p-1.5 sm:p-2 rounded-md border border-ga
                transition-colors flex-shrink-0
                focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-offset-2 focus:ring-offset-ga-background
                ${currentPage === totalPages
                                    ? 'text-ga-secondary cursor-not-allowed opacity-50'
                                    : 'text-ga-primary hover:bg-ga-surface'
                                }
              `}
                            aria-label="Go to next page"
                        >
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}
