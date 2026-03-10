/**
 * Base Service Class
 * Provides common functionality and error handling for all vendor services
 */

import { ServiceResponse, ServiceError } from '@/types/vendor-analytics';

export class BaseVendorService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Wraps service calls with error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await operation();
      return {
        success: true,
        data,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError(error, operationName);
    }
  }

  /**
   * Handles errors and returns standardized error response
   */
  protected handleError(error: unknown, operationName: string): ServiceResponse<never> {
    console.error(`[${this.serviceName}] Error in ${operationName}:`, error);

    const serviceError: ServiceError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: this.getErrorDetails(error)
    };

    return {
      success: false,
      error: serviceError,
      timestamp: new Date()
    };
  }

  /**
   * Extracts error code from error object
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      // Firebase errors
      if ('code' in error) {
        return (error as any).code;
      }
      return 'UNKNOWN_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Extracts error message from error object
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }

  /**
   * Extracts additional error details
   */
  private getErrorDetails(error: unknown): Record<string, any> | undefined {
    if (error instanceof Error && 'details' in error) {
      return (error as any).details;
    }
    return undefined;
  }

  /**
   * Validates vendor ID
   */
  protected validateVendorId(vendorId: string): void {
    if (!vendorId || typeof vendorId !== 'string' || vendorId.trim() === '') {
      throw new Error('Invalid vendor ID');
    }
  }

  /**
   * Validates date range
   */
  protected validateDateRange(start: Date, end: Date): void {
    if (!(start instanceof Date) || !(end instanceof Date)) {
      throw new Error('Invalid date range: dates must be Date objects');
    }
    if (start > end) {
      throw new Error('Invalid date range: start date must be before end date');
    }
  }

  /**
   * Validates required fields
   */
  protected validateRequired(fields: Record<string, any>): void {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) {
        throw new Error(`Required field missing: ${key}`);
      }
    }
  }

  /**
   * Safely parses number with fallback
   */
  protected parseNumber(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Calculates percentage change
   */
  protected calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Rounds number to specified decimal places
   */
  protected roundToDecimal(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Safely divides two numbers
   */
  protected safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
    if (denominator === 0) {
      return fallback;
    }
    return numerator / denominator;
  }

  /**
   * Clamps value between min and max
   */
  protected clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Formats date to ISO string
   */
  protected formatDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Parses date from various formats
   */
  protected parseDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return date;
    }
    // Firestore Timestamp
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    throw new Error('Invalid date format');
  }

  /**
   * Retries an operation with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batches array into chunks
   */
  protected batchArray<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Aggregates array of numbers
   */
  protected aggregate(values: number[], operation: 'sum' | 'avg' | 'min' | 'max'): number {
    if (values.length === 0) {
      return 0;
    }

    switch (operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  }

  /**
   * Groups array by key
   */
  protected groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Sorts array by key
   */
  protected sortBy<T>(array: T[], keyFn: (item: T) => number, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = keyFn(a);
      const bVal = keyFn(b);
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  /**
   * Filters out null and undefined values
   */
  protected compact<T>(array: (T | null | undefined)[]): T[] {
    return array.filter((item): item is T => item !== null && item !== undefined);
  }

  /**
   * Creates a date range from preset
   */
  protected createDateRangeFromPreset(preset: 'today' | '7days' | '30days' | '90days'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
    }

    return { start, end };
  }

  /**
   * Logs service activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }
}
