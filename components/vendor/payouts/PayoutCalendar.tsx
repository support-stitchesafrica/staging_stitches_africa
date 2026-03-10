'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PayoutCalendarEntry } from '@/types/vendor-analytics';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { formatUSD } from '@/lib/utils/currency';

interface PayoutCalendarProps {
  calendar: PayoutCalendarEntry[];
}

export function PayoutCalendar({ calendar }: PayoutCalendarProps) {

  const getStatusIcon = (status: PayoutCalendarEntry['status'], date: Date) => {
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-emerald-600" />;
    }
    if (status === 'processing') {
      return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
    }
    if (isPast(date) && status === 'scheduled') {
      return <AlertCircle className="h-5 w-5 text-amber-600" />;
    }
    return <Calendar className="h-5 w-5 text-gray-400" />;
  };

  const getStatusColor = (status: PayoutCalendarEntry['status'], date: Date) => {
    if (status === 'completed') return 'bg-emerald-50 border-emerald-200';
    if (status === 'processing') return 'bg-blue-50 border-blue-200';
    if (isPast(date) && status === 'scheduled') return 'bg-amber-50 border-amber-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getStatusText = (status: PayoutCalendarEntry['status'], date: Date) => {
    if (status === 'completed') return 'Completed';
    if (status === 'processing') return 'Processing';
    if (isPast(date) && status === 'scheduled') return 'Delayed';
    return 'Scheduled';
  };

  const getStatusTextColor = (status: PayoutCalendarEntry['status'], date: Date) => {
    if (status === 'completed') return 'text-emerald-600';
    if (status === 'processing') return 'text-blue-600';
    if (isPast(date) && status === 'scheduled') return 'text-amber-600';
    return 'text-gray-600';
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  const getRelativeTime = (date: Date) => {
    if (isPast(date)) return 'Past due';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  };

  if (calendar.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Payout Calendar
          </CardTitle>
          <CardDescription>
            Upcoming payout schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No upcoming payouts scheduled</p>
            <p className="text-sm text-gray-500">
              Payouts are automatically scheduled when orders are delivered
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          Payout Calendar
        </CardTitle>
        <CardDescription>
          Upcoming payout schedule and amounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {calendar.map((entry, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(
                entry.status,
                entry.date
              )}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0">
                  {getStatusIcon(entry.status, entry.date)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">
                      {getDateLabel(entry.date)}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : entry.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : isPast(entry.date)
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {getStatusText(entry.status, entry.date)}
                    </span>
                  </div>
                  <p className={`text-sm ${getStatusTextColor(entry.status, entry.date)}`}>
                    {getRelativeTime(entry.date)}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xl font-bold text-gray-900">
                  {formatUSD(entry.amount)}
                </p>
                {entry.amount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Net amount
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-700">
              <p className="font-medium mb-1">Automatic Payout Schedule</p>
              <p>
                Payouts are automatically processed when DHL confirms delivery of your orders. 
                The payout calendar shows estimated dates based on current pending orders and 
                historical delivery times.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
