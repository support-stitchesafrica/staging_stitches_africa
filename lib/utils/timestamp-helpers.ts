/**
 * Timestamp Helper Utilities
 * 
 * Safely handles Firestore Timestamps and Date conversions
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Safely convert a value to a Date object
 * Handles Firestore Timestamps, Date objects, and ISO strings
 */
export function toDate(value: any): Date {
  if (!value) {
    return new Date();
  }

  // Already a Date object
  if (value instanceof Date) {
    return value;
  }

  // Firestore Timestamp
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  // Firestore Timestamp-like object (has seconds and nanoseconds)
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
  }

  // ISO string or timestamp number
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Fallback to current date
  console.warn('Could not convert value to Date:', value);
  return new Date();
}

/**
 * Safely convert a value to a Firestore Timestamp
 */
export function toTimestamp(value: any): Timestamp {
  if (!value) {
    return Timestamp.now();
  }

  // Already a Timestamp
  if (value instanceof Timestamp) {
    return value;
  }

  // Timestamp-like object
  if (value && typeof value === 'object' && 'seconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds || 0);
  }

  // Date object
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  // ISO string or timestamp number
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }
  }

  // Fallback to current timestamp
  console.warn('Could not convert value to Timestamp:', value);
  return Timestamp.now();
}

/**
 * Check if a value is a valid Firestore Timestamp
 */
export function isTimestamp(value: any): value is Timestamp {
  return value instanceof Timestamp || 
         (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function');
}

/**
 * Check if a value is a valid Date
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Format a timestamp/date for display
 */
export function formatDate(value: any, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Format a timestamp/date with time for display
 */
export function formatDateTime(value: any, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  return date.toLocaleString(undefined, options);
}

/**
 * Get time remaining until a date
 */
export function getTimeRemaining(endDate: any): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const end = toDate(endDate);
  const now = new Date();
  const total = end.getTime() - now.getTime();

  if (total <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
    expired: false,
  };
}
