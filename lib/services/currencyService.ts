/**
 * Currency Service for automatic price conversion based on user location
 * Converts prices to user's local currency using real-time exchange rates
 */

import { httpsCallable, getFunctions } from 'firebase/functions';
import {
  getCountryForCurrency,
  hasManualCurrencyOverride,
  hasStoredCurrencyPreference,
  persistDetectedCurrencyPreference,
  readStoredCurrencyPreference,
  setManualCurrencyPreference,
} from '@/lib/utils/currency';

// Import Firebase functions conditionally
let functions: any = null;

// Skip Cloud Functions on localhost — they block due to CORS and cause retry loops
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (!isLocalhost) {
  try {
    if (typeof window !== 'undefined') {
      const { app, functions: firebaseFunctions } = require('@/lib/firebase');
      if (app) {
        functions = getFunctions(app, 'europe-west1');
      } else {
        functions = firebaseFunctions;
      }
    }
  } catch (error) {
    console.log('Firebase functions not available, using fallback API');
  }
}

// Circuit breaker: track consecutive Cloud Function failures
let cloudFunctionFailureCount = 0;
const CLOUD_FUNCTION_FAILURE_THRESHOLD = 2; // disable after 2 consecutive failures

export interface Price {
  baseCurrencyCode: string;
  currencyExchangeRate: number;
  lastRefreshed: string;
}

export interface CurrencyConversionResult {
  originalPrice: number;
  originalCurrency: string;
  convertedPrice: number;
  convertedCurrency: string;
  exchangeRate: number;
  lastRefreshed: string;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRateCache = new Map<string, { rate: Price; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private userCurrency: string | null = null;
  private userCountry: string | null = null;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

  private constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    void this.detectUserLocation().finally(() => {
      this.resolveReady();
    });
  }

  /** Resolves when initial location detection finishes (or was skipped). */
  public whenReady(): Promise<void> {
    return this.readyPromise;
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Detect user's location and set appropriate currency
   */
  private async detectUserLocation(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = readStoredCurrencyPreference();
        if (stored) {
          this.userCurrency = stored.currency;
          this.userCountry = stored.country;
          console.log(
            `🌍 Using stored currency preference: ${stored.country} (${stored.currency})${stored.isManual ? ' [manual]' : ''}`,
          );
          return;
        }
      }

      // Try to get location from browser geolocation API first
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`📍 Got coordinates: ${latitude}, ${longitude}`);
            await this.getCurrencyFromCoordinates(latitude, longitude);
          },
          async (error) => {
            console.log('Geolocation failed, falling back to IP detection:', error.message);
            // Fallback to IP-based detection
            await this.getCurrencyFromIP();
          },
          { 
            timeout: 10000, // 10 second timeout
            enableHighAccuracy: false, // Faster response
            maximumAge: 300000 // 5 minutes cache
          }
        );
      } else {
        // Fallback to IP-based detection
        console.log('Geolocation not available, using IP detection');
        await this.getCurrencyFromIP();
      }
    } catch (error) {
      console.error('Error detecting user location:', error);
      // Default to USD if detection fails
      this.userCurrency = 'USD';
      this.userCountry = 'US';
    }
  }

  /**
   * Get currency from coordinates using reverse geocoding
   */
  private async getCurrencyFromCoordinates(lat: number, lng: number): Promise<void> {
    try {
      console.log(`🌍 Getting currency from coordinates: ${lat}, ${lng}`);
      
      // Try multiple geocoding services for better accuracy
      const services = [
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        `https://geocode.xyz/${lat},${lng}?json=1`,
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl);
          const data = await response.json();
          
          let countryCode = null;
          
          // Handle different API response formats
          if (data.countryCode) {
            countryCode = data.countryCode;
          } else if (data.country) {
            // geocode.xyz format
            countryCode = data.country;
          }
          
          if (countryCode) {
            const country = countryCode.toUpperCase();
            const currency = this.getCurrencyForCountry(country);
            console.log(`✅ Detected location: ${country} → ${currency}`);
            this.applyDetectedLocation(country, currency);
            return;
          }
        } catch (serviceError) {
          console.log(`Geocoding service failed: ${serviceUrl}`, serviceError);
          continue;
        }
      }
      
      // If all geocoding services fail, fallback to IP detection
      console.log('All geocoding services failed, falling back to IP detection');
      await this.getCurrencyFromIP();
      
    } catch (error) {
      console.error('Error getting currency from coordinates:', error);
      await this.getCurrencyFromIP();
    }
  }

  /**
   * Get currency from IP address
   */
  private async getCurrencyFromIP(): Promise<void> {
    try {
      console.log('🌐 Getting currency from IP address...');
      
      // Try multiple IP geolocation services
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://ipinfo.io/json',
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl);
          const data = await response.json();
          
          let countryCode = null;
          
          // Handle different API response formats
          if (data.country_code) {
            countryCode = data.country_code; // ipapi.co
          } else if (data.countryCode) {
            countryCode = data.countryCode; // ip-api.com
          } else if (data.country) {
            countryCode = data.country; // ipinfo.io
          }
          
          if (countryCode) {
            const country = countryCode.toUpperCase();
            const currency = this.getCurrencyForCountry(country);
            console.log(`✅ Detected location via IP: ${country} → ${currency}`);
            this.applyDetectedLocation(country, currency);
            return;
          }
        } catch (serviceError) {
          console.log(`IP service failed: ${serviceUrl}`, serviceError);
          continue;
        }
      }
      
      // If all services fail, use default
      console.log('All IP services failed, using default USD');
      this.userCountry = 'US';
      this.userCurrency = 'USD';
      
    } catch (error) {
      console.error('Error getting currency from IP:', error);
      // Default fallback
      this.userCurrency = 'USD';
      this.userCountry = 'US';
    }
  }

  /**
   * Apply geo-detected location only when the shopper has no saved preference yet.
   */
  private applyDetectedLocation(country: string, currency: string): void {
    if (typeof window !== 'undefined') {
      if (hasManualCurrencyOverride() || hasStoredCurrencyPreference()) {
        return;
      }
    }

    this.userCountry = country;
    this.userCurrency = currency;

    if (typeof window !== 'undefined') {
      persistDetectedCurrencyPreference(currency, country);
    }
  }

  /**
   * Map country codes to currencies
   */
  private getCurrencyForCountry(countryCode: string): string {
    const currencyMap: { [key: string]: string } = {
      'US': 'USD',
      'GB': 'GBP',
      'EU': 'EUR',
      'DE': 'EUR',
      'FR': 'EUR',
      'IT': 'EUR',
      'ES': 'EUR',
      'NL': 'EUR',
      'CA': 'CAD',
      'AU': 'AUD',
      'JP': 'JPY',
      'CN': 'CNY',
      'IN': 'INR',
      'BR': 'BRL',
      'MX': 'MXN',
      'NG': 'NGN', // Nigeria
      'GH': 'GHS', // Ghana
      'KE': 'KES', // Kenya
      'ZA': 'ZAR', // South Africa
      'EG': 'EGP', // Egypt
      // Add more countries as needed
    };

    return currencyMap[countryCode] || 'USD';
  }

  /**
   * Get exchange rate from Firebase Cloud Function or fallback API
   */
  private async getExchangeRate(baseCurrency: string, quoteCurrency: string): Promise<Price> {
    const cacheKey = `${baseCurrency}-${quoteCurrency}`;
    const cached = this.exchangeRateCache.get(cacheKey);
    
    // Return cached rate if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    try {
      console.log('Getting exchange rate for', baseCurrency, 'to', quoteCurrency);
      
      // Initialize functions if not available (non-localhost only)
      if (typeof window !== 'undefined' && !functions && !isLocalhost && cloudFunctionFailureCount < CLOUD_FUNCTION_FAILURE_THRESHOLD) {
        try {
          const { getFirebaseApp } = require('@/lib/firebase');
          const app = await getFirebaseApp();
          if (app) {
            functions = getFunctions(app, 'europe-west1');
            console.log('Initialized Firebase functions for europe-west1');
          }
        } catch (initError) {
          console.error('Failed to initialize Firebase functions:', initError);
        }
      }

      // Try Firebase Cloud Function first (skip on localhost or after repeated failures)
      if (typeof window !== 'undefined' && functions && cloudFunctionFailureCount < CLOUD_FUNCTION_FAILURE_THRESHOLD) {
        try {
          console.log('Using Firebase Cloud Function to get exchange rate');
          const getForexPrice = httpsCallable(functions, 'getForexPrice');
          const result = await getForexPrice({
            baseCurrency,
            quoteCurrency
          });
          
          console.log('Firebase Cloud Function result:', result);
          const data = result.data as any;
          const price: Price = {
            baseCurrencyCode: data.data?.base || data.data?.baseCurrency || baseCurrency,
            currencyExchangeRate: this.extractExchangeRate(data.data, quoteCurrency),
            lastRefreshed: data.data?.updated?.toString() || data.data?.lastRefreshed?.toString() || new Date().toISOString()
          };

          // Cache the result
          this.exchangeRateCache.set(cacheKey, {
            rate: price,
            timestamp: Date.now()
          });

          cloudFunctionFailureCount = 0; // reset on success
          return price;
        } catch (firebaseError) {
          cloudFunctionFailureCount++;
          if (cloudFunctionFailureCount >= CLOUD_FUNCTION_FAILURE_THRESHOLD) {
            console.log('Firebase function unavailable, switching to fallback API permanently for this session');
          } else {
            console.log('Firebase function not available, using fallback API');
          }
        }
      }

      // Fallback to free exchange rate API
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
        );
        
        if (response.ok) {
          const data = await response.json();
          const rate = data.rates[quoteCurrency];
          
          if (rate) {
            const price: Price = {
              baseCurrencyCode: baseCurrency,
              currencyExchangeRate: rate,
              lastRefreshed: data.date || new Date().toISOString()
            };

            // Cache the result
            this.exchangeRateCache.set(cacheKey, {
              rate: price,
              timestamp: Date.now()
            });

            return price;
          }
        }
      } catch (apiError) {
        console.log('External API failed, using local API');
      }

      // Fallback to our local API
      try {
        const response = await fetch(
          `/api/currency/convert?from=${baseCurrency}&to=${quoteCurrency}&amount=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.rate) {
            const price: Price = {
              baseCurrencyCode: baseCurrency,
              currencyExchangeRate: data.rate,
              lastRefreshed: data.lastUpdated || new Date().toISOString()
            };

            // Cache the result
            this.exchangeRateCache.set(cacheKey, {
              rate: price,
              timestamp: Date.now()
            });

            return price;
          }
        }
      } catch (localApiError) {
        console.log('Local API failed, using hardcoded rates');
      }

      // Use hardcoded rates as final fallback for common currencies
      const fallbackRates: { [key: string]: number } = {
        // USD to other currencies
        'USD-NGN': 1350,  // 1 USD = 1350 NGN (approximate)
        'USD-GHS': 15.5,  // 1 USD = 15.5 GHS
        'USD-KES': 129,   // 1 USD = 129 KES
        'USD-ZAR': 18.5,  // 1 USD = 18.5 ZAR
        'USD-EGP': 49,    // 1 USD = 49 EGP
        'USD-EUR': 0.85,  // 1 USD = 0.85 EUR
        'USD-GBP': 0.73,  // 1 USD = 0.73 GBP
        'USD-CAD': 1.35,  // 1 USD = 1.35 CAD
        'USD-AUD': 1.55,  // 1 USD = 1.55 AUD
        'USD-JPY': 150,   // 1 USD = 150 JPY
        'USD-CNY': 7.3,   // 1 USD = 7.3 CNY
        'USD-INR': 83,    // 1 USD = 83 INR
        'USD-BRL': 5.2,   // 1 USD = 5.2 BRL
        'USD-MXN': 17.5,  // 1 USD = 17.5 MXN
        // NGN to other currencies (for products priced in Naira)
        'NGN-USD': 0.000606,  // 1 NGN = 0.000606 USD (1/1350)
        'NGN-EUR': 0.000515,  // 1 NGN = 0.000515 EUR
        'NGN-GBP': 0.000442,  // 1 NGN = 0.000442 GBP
        'NGN-CAD': 0.000818,  // 1 NGN = 0.000818 CAD
        'NGN-AUD': 0.000939,  // 1 NGN = 0.000939 AUD
        'NGN-GHS': 0.0094,    // 1 NGN = 0.0094 GHS
        'NGN-KES': 0.0782,    // 1 NGN = 0.0782 KES
        'NGN-ZAR': 0.0112,    // 1 NGN = 0.0112 ZAR
      };

      const fallbackKey = `${baseCurrency}-${quoteCurrency}`;
      const fallbackRate = fallbackRates[fallbackKey];
      
      if (fallbackRate) {
        const price: Price = {
          baseCurrencyCode: baseCurrency,
          currencyExchangeRate: fallbackRate,
          lastRefreshed: new Date().toISOString()
        };

        // Cache the fallback result for a shorter time
        this.exchangeRateCache.set(cacheKey, {
          rate: price,
          timestamp: Date.now() - (this.CACHE_DURATION * 0.8) // Cache for only 6 minutes
        });

        return price;
      }

      // Return 1:1 rate as absolute fallback
      return {
        baseCurrencyCode: baseCurrency,
        currencyExchangeRate: 1.0,
        lastRefreshed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      
      // Return 1:1 rate as absolute fallback
      return {
        baseCurrencyCode: baseCurrency,
        currencyExchangeRate: 1.0,
        lastRefreshed: new Date().toISOString()
      };
    }
  }

  /**
   * Extract exchange rate from API response
   */
  private extractExchangeRate(data: any, quoteCurrency: string): number {
    const result = data?.result || data?.results || {};
    const rate = result[quoteCurrency];
    
    if (typeof rate === 'number') {
      return rate;
    } else if (typeof rate === 'string') {
      return parseFloat(rate) || 1.0;
    }
    
    return 1.0;
  }

  /**
   * Convert price to user's local currency
   */
  public async convertPrice(
    price: number,
    fromCurrency: string = 'USD',
    toCurrency?: string,
    roundResult: boolean = true
  ): Promise<CurrencyConversionResult> {
    const targetCurrency = toCurrency || this.userCurrency;

    // Wait for user currency detection if not ready AND no specific target provided
    if (!targetCurrency) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.userCurrency) {
        this.userCurrency = 'USD';
      }
    }

    const finalTargetCurrency = toCurrency || this.userCurrency || 'USD';

    // No conversion needed if currencies are the same
    if (fromCurrency === finalTargetCurrency) {
      return {
        originalPrice: price,
        originalCurrency: fromCurrency,
        convertedPrice: price,
        convertedCurrency: finalTargetCurrency,
        exchangeRate: 1.0,
        lastRefreshed: new Date().toISOString()
      };
    }

    try {
      const exchangeRateData = await this.getExchangeRate(fromCurrency, finalTargetCurrency);
      const convertedPrice = price * exchangeRateData.currencyExchangeRate;

      return {
        originalPrice: price,
        originalCurrency: fromCurrency,
        convertedPrice: roundResult ? Math.round(convertedPrice * 100) / 100 : convertedPrice,
        convertedCurrency: finalTargetCurrency,
        exchangeRate: exchangeRateData.currencyExchangeRate,
        lastRefreshed: exchangeRateData.lastRefreshed
      };
    } catch (error) {
      console.error('Error converting price:', error);
      // Return original price if conversion fails
      return {
        originalPrice: price,
        originalCurrency: fromCurrency,
        convertedPrice: price,
        convertedCurrency: fromCurrency,
        exchangeRate: 1.0,
        lastRefreshed: new Date().toISOString()
      };
    }
  }

  /**
   * Get user's detected currency
   */
  public getUserCurrency(): string {
    return this.userCurrency || 'USD';
  }

  /**
   * Get user's detected country
   */
  public getUserCountry(): string {
    return this.userCountry || 'US';
  }

  /**
   * Apply shopper preference (header selector). Persists as manual override.
   */
  public setUserPreference(currency: string, country: string): void {
    this.userCurrency = currency.toUpperCase();
    this.userCountry = country.toUpperCase();
    if (typeof window !== 'undefined') {
      setManualCurrencyPreference(this.userCurrency, this.userCountry);
    }
  }

  /** @deprecated Use setUserPreference — kept for compatibility */
  public setUserCurrency(currency: string): void {
    this.setUserPreference(currency, getCountryForCurrency(currency));
  }

  /**
   * Format price with currency symbol
   */
  public formatPrice(price: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } catch (error) {
      // Fallback formatting
      return `${currency} ${price.toFixed(2)}`;
    }
  }

  /**
   * Convert and format price in one call
   */
  public async convertAndFormatPrice(
    price: number,
    fromCurrency: string = 'USD'
  ): Promise<string> {
    const conversion = await this.convertPrice(price, fromCurrency);
    return this.formatPrice(conversion.convertedPrice, conversion.convertedCurrency);
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();