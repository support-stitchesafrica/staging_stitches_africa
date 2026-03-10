/**
 * React hook for currency conversion
 * Provides easy-to-use currency conversion functionality for React components
 */

import { useState, useEffect, useCallback } from 'react';
import { currencyService, CurrencyConversionResult } from '@/lib/services/currencyService';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface UseCurrencyConversionResult {
  convertPrice: (price: number, fromCurrency?: string, toCurrency?: string) => Promise<CurrencyConversionResult>;
  convertAndFormatPrice: (price: number, fromCurrency?: string) => Promise<string>;
  formatPrice: (price: number, currency: string) => string;
  userCurrency: string;
  userCountry: string;
  isLoading: boolean;
}

export const useCurrencyConversion = (): UseCurrencyConversionResult => {
  const { userCurrency, userCountry, isLoading: isContextLoading, convertPrice: contextConvertPrice, formatPrice: contextFormatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(isContextLoading);
  }, [isContextLoading]);

  const convertPrice = useCallback(async (
    price: number,
    fromCurrency: string = 'USD',
    toCurrency?: string
  ): Promise<CurrencyConversionResult> => {
    return await contextConvertPrice(price, fromCurrency, toCurrency);
  }, [contextConvertPrice]);

  const convertAndFormatPrice = useCallback(async (
    price: number,
    fromCurrency: string = 'USD'
  ): Promise<string> => {
    const result = await contextConvertPrice(price, fromCurrency);
    return contextFormatPrice(result.convertedPrice, result.convertedCurrency);
  }, [contextConvertPrice, contextFormatPrice]);

  const formatPrice = useCallback((price: number, currency: string): string => {
    return contextFormatPrice(price, currency);
  }, [contextFormatPrice]);

  return {
    convertPrice,
    convertAndFormatPrice,
    formatPrice,
    userCurrency,
    userCountry,
    isLoading
  };
};

/**
 * Hook for converting a single price with caching
 */
export const useConvertedPrice = (
  price: number,
  fromCurrency: string = 'USD',
  toCurrency?: string
) => {
  const { userCurrency, convertPrice: contextConvertPrice, formatPrice } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<CurrencyConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const convertPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Pass userCurrency to ensure we convert to the selected currency
        // The service's convertPrice defaults to internal state otherwise
        // Use contextConvertPrice instead of direct service call
        const result = await contextConvertPrice(price, fromCurrency, toCurrency);
        setConvertedPrice(result);
      } catch (err) {
        console.error('Error converting price:', err);
        setError('Failed to convert price');
        // Set fallback result
        setConvertedPrice({
          originalPrice: price,
          originalCurrency: fromCurrency,
          convertedPrice: price,
          convertedCurrency: fromCurrency,
          exchangeRate: 1.0,
          lastRefreshed: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (price > 0) {
      convertPrice();
    }
  }, [price, fromCurrency, toCurrency, userCurrency, contextConvertPrice]);

  return {
    convertedPrice,
    isLoading,
    error,
    formattedPrice: convertedPrice 
      ? formatPrice(convertedPrice.convertedPrice, convertedPrice.convertedCurrency)
      : null
  };
};

/**
 * Hook for converting multiple prices
 */
export const useConvertedPrices = (
  prices: Array<{ price: number; fromCurrency?: string }>,
  dependencies: any[] = []
) => {
  const { userCurrency, convertPrice: contextConvertPrice, formatPrice } = useCurrency();
  const [convertedPrices, setConvertedPrices] = useState<CurrencyConversionResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const convertPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const results = await Promise.all(
          prices.map(({ price, fromCurrency = 'USD' }) =>
            contextConvertPrice(price, fromCurrency)
          )
        );
        
        setConvertedPrices(results);
      } catch (err) {
        console.error('Error converting prices:', err);
        setError('Failed to convert prices');
        // Set fallback results
        setConvertedPrices(
          prices.map(({ price, fromCurrency = 'USD' }) => ({
            originalPrice: price,
            originalCurrency: fromCurrency,
            convertedPrice: price,
            convertedCurrency: fromCurrency,
            exchangeRate: 1.0,
            lastRefreshed: new Date().toISOString()
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (prices.length > 0) {
      convertPrices();
    }
  }, [prices.length, userCurrency, contextConvertPrice, ...dependencies]);

  return {
    convertedPrices,
    isLoading,
    error,
    formattedPrices: convertedPrices.map(result =>
      formatPrice(result.convertedPrice, result.convertedCurrency)
    )
  };
};