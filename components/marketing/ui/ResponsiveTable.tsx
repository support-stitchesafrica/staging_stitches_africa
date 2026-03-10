/**
 * Marketing Responsive Table Component
 * Mobile-optimized table that converts to cards on small screens
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveTableColumn<T>
{
    key: string;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    mobileLabel?: string;
    hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T>
{
    data: T[];
    columns: ResponsiveTableColumn<T>[];
    keyExtractor: (row: T) => string;
    emptyMessage?: string;
    className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
    data,
    columns,
    keyExtractor,
    emptyMessage = 'No data available',
    className,
}: ResponsiveTableProps<T>)
{
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (key: string) =>
    {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(key))
        {
            newExpanded.delete(key);
        } else
        {
            newExpanded.add(key);
        }
        setExpandedRows(newExpanded);
    };

    if (data.length === 0)
    {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className={cn('hidden md:block overflow-x-auto', className)}>
                <table className="w-full">
                    <thead className="border-b">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.map((row) => (
                            <tr key={keyExtractor(row)} className="hover:bg-muted/50">
                                {columns.map((column) => (
                                    <td key={column.key} className="px-4 py-3 text-sm">
                                        {column.render
                                            ? column.render(row[column.key], row)
                                            : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className={cn('md:hidden space-y-4', className)}>
                {data.map((row) =>
                {
                    const rowKey = keyExtractor(row);
                    const isExpanded = expandedRows.has(rowKey);
                    const visibleColumns = columns.filter((col) => !col.hideOnMobile);
                    const primaryColumn = visibleColumns[0];
                    const secondaryColumns = visibleColumns.slice(1);

                    return (
                        <Card key={rowKey}>
                            <CardContent className="p-4">
                                {/* Primary Info */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {primaryColumn.render
                                                ? primaryColumn.render(row[primaryColumn.key], row)
                                                : row[primaryColumn.key]}
                                        </div>
                                    </div>
                                    {secondaryColumns.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRow(rowKey)}
                                        >
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && secondaryColumns.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t">
                                        {secondaryColumns.map((column) => (
                                            <div key={column.key} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {column.mobileLabel || column.label}:
                                                </span>
                                                <span className="font-medium">
                                                    {column.render
                                                        ? column.render(row[column.key], row)
                                                        : row[column.key]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </>
    );
}
