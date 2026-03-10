'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import
{
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface DateRange
{
    start: Date;
    end: Date;
}

export interface DateRangePreset
{
    label: string;
    getValue: () => DateRange;
}

export interface DateRangePickerProps
{
    value: DateRange;
    onChange: (range: DateRange) => void;
    presets?: DateRangePreset[];
    showComparison?: boolean;
    onComparisonToggle?: (enabled: boolean) => void;
}

const defaultPresets: DateRangePreset[] = [
    {
        label: 'Today',
        getValue: () =>
        {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return { start: today, end: today };
        },
    },
    {
        label: 'Yesterday',
        getValue: () =>
        {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            return { start: yesterday, end: yesterday };
        },
    },
    {
        label: 'Last 7 days',
        getValue: () =>
        {
            const end = new Date();
            end.setHours(0, 0, 0, 0);
            const start = new Date(end);
            start.setDate(start.getDate() - 6);
            return { start, end };
        },
    },
    {
        label: 'Last 30 days',
        getValue: () =>
        {
            const end = new Date();
            end.setHours(0, 0, 0, 0);
            const start = new Date(end);
            start.setDate(start.getDate() - 29);
            return { start, end };
        },
    },
    {
        label: 'Last 90 days',
        getValue: () =>
        {
            const end = new Date();
            end.setHours(0, 0, 0, 0);
            const start = new Date(end);
            start.setDate(start.getDate() - 89);
            return { start, end };
        },
    },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    value,
    onChange,
    presets = defaultPresets,
    showComparison = false,
    onComparisonToggle,
}) =>
{
    const [open, setOpen] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [tempStart, setTempStart] = useState<Date | undefined>(value.start);
    const [tempEnd, setTempEnd] = useState<Date | undefined>(value.end);
    const [comparisonEnabled, setComparisonEnabled] = useState(false);

    const formatDateRange = (range: DateRange): string =>
    {
        const formatDate = (date: Date) =>
        {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        if (range.start.getTime() === range.end.getTime())
        {
            return formatDate(range.start);
        }

        return `${formatDate(range.start)} - ${formatDate(range.end)}`;
    };

    const isPresetSelected = (preset: DateRangePreset): boolean =>
    {
        const presetRange = preset.getValue();
        return (
            presetRange.start.getTime() === value.start.getTime() &&
            presetRange.end.getTime() === value.end.getTime()
        );
    };

    const handlePresetClick = (preset: DateRangePreset) =>
    {
        const range = preset.getValue();
        onChange(range);
        setCustomMode(false);
        setOpen(false);
    };

    const handleCustomApply = () =>
    {
        if (tempStart && tempEnd)
        {
            // Validate date range
            if (tempStart > tempEnd)
            {
                // Swap if start is after end
                onChange({ start: tempEnd, end: tempStart });
            } else
            {
                onChange({ start: tempStart, end: tempEnd });
            }
            setCustomMode(false);
            setOpen(false);
        }
    };

    const handleComparisonToggle = (checked: boolean) =>
    {
        setComparisonEnabled(checked);
        if (onComparisonToggle)
        {
            onComparisonToggle(checked);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 border-ga text-ga-primary hover:bg-ga-surface min-w-[160px] sm:min-w-[200px] justify-start text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-offset-2"
                    aria-label={`Select date range. Current selection: ${formatDateRange(value)}`}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                >
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{formatDateRange(value)}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 shadow-ga-dropdown max-w-[calc(100vw-2rem)] theme-transition"
                align="end"
                role="dialog"
                aria-label="Date range picker"
            >
                <div className="flex flex-col sm:flex-row">
                    {/* Presets Sidebar */}
                    <div className="w-full sm:w-40 sm:border-r border-ga p-2" role="group" aria-label="Date range presets">
                        <div className="space-y-1">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => handlePresetClick(preset)}
                                    className={`
                    w-full text-left px-3 py-2 rounded text-sm
                    transition-ga-base theme-transition
                    focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-inset
                    ${isPresetSelected(preset)
                                            ? 'bg-ga-blue/10 text-ga-blue font-medium'
                                            : 'text-ga-secondary hover:bg-ga-surface hover:text-ga-primary'
                                        }
                  `}
                                    aria-pressed={isPresetSelected(preset)}
                                    aria-label={`Select ${preset.label}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{preset.label}</span>
                                        {isPresetSelected(preset) && (
                                            <Check className="w-4 h-4" aria-hidden="true" />
                                        )}
                                    </div>
                                </button>
                            ))}
                            <Separator className="my-2" />
                            <button
                                onClick={() => setCustomMode(true)}
                                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  transition-ga-base theme-transition
                  focus:outline-none focus:ring-2 focus:ring-ga-blue focus:ring-inset
                  ${customMode
                                        ? 'bg-ga-blue/10 text-ga-blue font-medium'
                                        : 'text-ga-secondary hover:bg-ga-surface hover:text-ga-primary'
                                    }
                `}
                                aria-pressed={customMode}
                                aria-label="Select custom date range"
                            >
                                Custom range
                            </button>
                        </div>
                    </div>

                    {/* Calendar Section */}
                    {customMode && (
                        <div className="p-3 sm:p-4 w-full">
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <Label className="text-sm text-ga-secondary mb-2 block">
                                        Start Date
                                    </Label>
                                    <Calendar
                                        mode="single"
                                        selected={tempStart}
                                        onSelect={setTempStart}
                                        disabled={(date) => date > new Date()}
                                        className="rounded-md border border-ga"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm text-ga-secondary mb-2 block">
                                        End Date
                                    </Label>
                                    <Calendar
                                        mode="single"
                                        selected={tempEnd}
                                        onSelect={setTempEnd}
                                        disabled={(date) => date > new Date() || (tempStart ? date < tempStart : false)}
                                        className="rounded-md border border-ga"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setCustomMode(false)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCustomApply}
                                        disabled={!tempStart || !tempEnd}
                                        className="flex-1 bg-ga-blue text-white hover:bg-ga-blue/90"
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparison Toggle */}
                    {!customMode && showComparison && (
                        <div className="p-4 border-t border-ga">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="comparison" className="text-sm text-ga-secondary">
                                    Compare to previous period
                                </Label>
                                <Switch
                                    id="comparison"
                                    checked={comparisonEnabled}
                                    onCheckedChange={handleComparisonToggle}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};
