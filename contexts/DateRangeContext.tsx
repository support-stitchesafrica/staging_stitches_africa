'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface DateRange
{
    from: Date;
    to: Date;
    start: Date;
    end: Date;
}

export interface ComparisonPeriod
{
    start: Date;
    end: Date;
}

interface DateRangeContextType
{
    dateRange: DateRange;
    comparisonPeriod: ComparisonPeriod | null;
    isComparisonEnabled: boolean;
    setDateRange: (range: DateRange) => void;
    setComparisonEnabled: (enabled: boolean) => void;
    calculateComparisonPeriod: (range: DateRange) => ComparisonPeriod;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

// Default to last 30 days
const getDefaultDateRange = (): DateRange =>
{
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return { 
        start, 
        end, 
        from: start, 
        to: end 
    };
};

// Calculate comparison period (previous period of same length)
const calculateComparisonPeriod = (range: DateRange): ComparisonPeriod =>
{
    const daysDiff = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));

    const comparisonEnd = new Date(range.start);
    comparisonEnd.setDate(comparisonEnd.getDate() - 1);

    const comparisonStart = new Date(comparisonEnd);
    comparisonStart.setDate(comparisonStart.getDate() - daysDiff);

    return { start: comparisonStart, end: comparisonEnd };
};

interface DateRangeProviderProps
{
    children: ReactNode;
}

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ children }) =>
{
    const [dateRange, setDateRangeState] = useState<DateRange>(() => getDefaultDateRange());
    const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
    const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod | null>(null);

    const setDateRange = useCallback((range: DateRange) =>
    {
        setDateRangeState(range);

        // Automatically update comparison period if comparison is enabled
        if (isComparisonEnabled)
        {
            const comparison = calculateComparisonPeriod(range);
            setComparisonPeriod(comparison);
        }
    }, [isComparisonEnabled]);

    const setComparisonEnabled = useCallback((enabled: boolean) =>
    {
        setIsComparisonEnabled(enabled);

        if (enabled)
        {
            const comparison = calculateComparisonPeriod(dateRange);
            setComparisonPeriod(comparison);
        } else
        {
            setComparisonPeriod(null);
        }
    }, [dateRange]);

    // Memoize the context value to prevent unnecessary re-renders
    const value: DateRangeContextType = useMemo(() => ({
        dateRange,
        comparisonPeriod,
        isComparisonEnabled,
        setDateRange,
        setComparisonEnabled,
        calculateComparisonPeriod,
    }), [dateRange, comparisonPeriod, isComparisonEnabled, setDateRange, setComparisonEnabled]);

    return (
        <DateRangeContext.Provider value={value}>
            {children}
        </DateRangeContext.Provider>
    );
};

export const useDateRange = (): DateRangeContextType =>
{
    const context = useContext(DateRangeContext);
    if (context === undefined)
    {
        throw new Error('useDateRange must be used within a DateRangeProvider');
    }
    return context;
};
