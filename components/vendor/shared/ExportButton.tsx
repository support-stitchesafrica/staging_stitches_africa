'use client';

import * as React from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ExportFormat = 'csv' | 'pdf';
export type ExportDataType = 'sales' | 'orders' | 'products' | 'customers' | 'payouts';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<void> | void;
  dataType?: ExportDataType;
  formats?: ExportFormat[];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const formatLabels: Record<ExportFormat, string> = {
  csv: 'Export as CSV',
  pdf: 'Export as PDF'
};

const formatIcons: Record<ExportFormat, React.ComponentType<{ className?: string }>> = {
  csv: FileSpreadsheet,
  pdf: FileText
};

export function ExportButton({
  onExport,
  dataType,
  formats = ['csv', 'pdf'],
  loading = false,
  disabled = false,
  className,
  variant = 'outline',
  size = 'default'
}: ExportButtonProps) {
  const [exportingFormat, setExportingFormat] = React.useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (loading || disabled) return;

    try {
      setExportingFormat(format);
      await onExport(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportingFormat(null);
    }
  };

  const isExporting = loading || exportingFormat !== null;

  // Single format - render as simple button
  if (formats.length === 1) {
    const format = formats[0];
    const Icon = formatIcons[format];

    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(format)}
        disabled={disabled || isExporting}
        className={cn('gap-2', className)}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {isExporting ? 'Exporting...' : formatLabels[format]}
      </Button>
    );
  }

  // Multiple formats - render as dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
          className={cn('gap-2', className)}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          Export {dataType ? dataType : 'data'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => {
          const Icon = formatIcons[format];
          const isCurrentlyExporting = exportingFormat === format;

          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              className="gap-2"
            >
              {isCurrentlyExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span>{formatLabels[format]}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
