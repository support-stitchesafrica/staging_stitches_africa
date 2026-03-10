import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | { base: number; currency: string }, currency: string = 'USD'): string {
  const priceValue = typeof price === 'number' ? price : price.base;
  const currencyCode = typeof price === 'object' ? price.currency : currency;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(priceValue);
}

export function calculateDiscountedPrice(basePrice: number, discount: number): number {
  return basePrice * (1 - discount / 100);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}