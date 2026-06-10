'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { TrackingEvent } from '@/types/track-order';

// Ordered journey steps for the public tracker
export const JOURNEY_STEPS = [
  { key: 'ordered',   label: 'Order Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'pickedup',  label: 'Picked Up' },
  { key: 'transit',   label: 'In Transit' },
  { key: 'customs',   label: 'Customs Clearance' },
  { key: 'outfordelivery', label: 'Out For Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed',    label: 'Failed Delivery' },
  { key: 'returned',  label: 'Returned' },
];

// Maps order_status strings and DHL type codes to a step index
export function getProgressStep(status: string): number {
  const s = (status ?? '').toLowerCase().trim();

  // Terminal failure states
  if (s === 'returned' || s === 'rt') return 8;
  if (s === 'failed' || s === 'failed_delivery' || s === 'nd' || s === 'nh') return 7;

  // Delivered
  if (s === 'delivered' || s === 'ok') return 6;

  // Out for delivery
  if (s === 'out_for_delivery' || s === 'out for delivery' || s === 'wc') return 5;

  // Customs clearance
  if (s === 'customs' || s === 'customs_clearance' || s === 'in clearance' || s === 'ic') return 4;

  // In transit (various DHL facility codes)
  if (
    s === 'in_transit' || s === 'in transit' ||
    s === 'pl' || s === 'af' || s === 'df' || s === 'ar'
  ) return 3;

  // Picked up / accepted
  if (s === 'picked_up' || s === 'picked up' || s === 'pu' || s === 'sa') return 2;

  // Processing
  if (s === 'processing') return 1;

  // Default: order placed
  return 0;
}

// Status-specific colour for the active step dot
function getStepColour(status: string, stepIndex: number, currentStep: number): string {
  if (stepIndex > currentStep) return 'bg-white border-gray-300';

  const s = (status ?? '').toLowerCase();

  if (stepIndex === currentStep) {
    if (s === 'delivered' || s === 'ok') return 'bg-emerald-500 border-emerald-500';
    if (s === 'failed' || s === 'failed_delivery' || s === 'nd' || s === 'nh' ||
        s === 'returned' || s === 'rt') return 'bg-red-500 border-red-500';
    if (s === 'processing') return 'bg-yellow-500 border-yellow-500';
    // in transit / customs / out for delivery / picked up
    return 'bg-blue-500 border-blue-500';
  }

  // Completed steps
  return 'bg-black border-black';
}

interface ProgressIndicatorProps {
  status: string;
  events: TrackingEvent[];
}

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  const currentStep = getProgressStep(status);

  return (
    <div className="w-full px-2 py-4">
      <div className="flex items-start justify-between relative">
        {/* Background connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />
        {/* Filled progress line */}
        <div
          className="absolute top-4 left-4 h-0.5 bg-black z-0 transition-all duration-700"
          style={{
            width: `${(currentStep / (JOURNEY_STEPS.length - 1)) * (100 - 8)}%`,
          }}
        />

        {JOURNEY_STEPS.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          const dotClass = getStepColour(status, i, currentStep);

          return (
            <div key={step.key} className="flex flex-col items-center z-10 gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${dotClass} ${active ? 'shadow-lg scale-110' : ''}`}
              >
                {done ? (
                  <CheckCircle2 size={14} className="text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium text-center leading-tight max-w-[52px] ${done ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
