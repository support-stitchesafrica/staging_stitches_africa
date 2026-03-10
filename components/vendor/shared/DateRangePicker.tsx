'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

type PresetValue = 'today' | '7days' | '30days' | '90days' | 'custom';

interface Preset {
  label: string;
  value: PresetValue;
  getRange: () => DateRange;
}

const presets: Preset[] = [
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { from: today, to: today };
    }
  },
  {
    label: 'Last 7 days',
    value: '7days',
    getRange: () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return { from: sevenDaysAgo, to: today };
    }
  },
  {
    label: 'Last 30 days',
    value: '30days',
    getRange: () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return { from: thirtyDaysAgo, to: today };
    }
  },
  {
    label: 'Last 90 days',
    value: '90days',
    getRange: () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
      ninetyDaysAgo.setHours(0, 0, 0, 0);
      return { from: ninetyDaysAgo, to: today };
    }
  }
];

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Select date range'
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const [selectedPreset, setSelectedPreset] = React.useState<PresetValue>('30days');
  const [isOpen, setIsOpen] = React.useState(false);

  // Initialize with default preset
  React.useEffect(() => {
    if (!value) {
      const defaultRange = presets.find(p => p.value === '30days')?.getRange();
      if (defaultRange) {
        setDate(defaultRange);
        onChange?.(defaultRange);
      }
    }
  }, []);

  const handlePresetChange = (presetValue: string) => {
    const preset = presets.find(p => p.value === presetValue);
    if (preset) {
      const range = preset.getRange();
      setDate(range);
      setSelectedPreset(preset.value);
      onChange?.(range);
      if (preset.value !== 'custom') {
        setIsOpen(false);
      }
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    setSelectedPreset('custom');
    onChange?.(range);
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      return placeholder;
    }

    if (!range.to) {
      return format(range.from, 'MMM dd, yyyy');
    }

    return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
