/**
 * Currency Selector Component
 * Allows users to manually select their preferred currency
 */

'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Globe, Check } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  variant?: 'select' | 'popover' | 'inline';
  className?: string;
  showFlag?: boolean;
  showLabel?: boolean;
}

const currencyInfo: Record<string, { name: string; symbol: string; flag: string }> = {
  'USD': { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  'EUR': { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  'GBP': { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  'CAD': { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  'AUD': { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  'JPY': { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  'CNY': { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  'INR': { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  'BRL': { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  'MXN': { name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  'NGN': { name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  'GHS': { name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭' },
  'KES': { name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  'ZAR': { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  'EGP': { name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬' },
  'CHF': { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  'SEK': { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  'NOK': { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  'DKK': { name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  'PLN': { name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱' }
};

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  variant = 'select',
  className = '',
  showFlag = true,
  showLabel = false
}) => {
  const { userCurrency, setUserCurrency, getSupportedCurrencies, isLoading } = useCurrency();
  const supportedCurrencies = getSupportedCurrencies();

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-gray-200 rounded h-8 w-20', className)} />
    );
  }

  const currentCurrencyInfo = currencyInfo[userCurrency] || currencyInfo['USD'];

  if (variant === 'select') {
    return (
      <Select value={userCurrency} onValueChange={setUserCurrency}>
        <SelectTrigger className={cn('w-auto min-w-[120px]', className)}>
          <SelectValue>
            <div className="flex items-center gap-2">
              {showFlag && <span>{currentCurrencyInfo.flag}</span>}
              <span>{userCurrency}</span>
              {showLabel && <span className="text-sm text-muted-foreground">({currentCurrencyInfo.symbol})</span>}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedCurrencies.map((currency) => {
            const info = currencyInfo[currency];
            return (
              <SelectItem key={currency} value={currency}>
                <div className="flex items-center gap-2">
                  <span>{info.flag}</span>
                  <span>{currency}</span>
                  <span className="text-sm text-muted-foreground">- {info.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Globe className="h-4 w-4" />
            {showFlag && <span>{currentCurrencyInfo.flag}</span>}
            <span>{userCurrency}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4">
            <h4 className="font-medium text-sm mb-3">Select Currency</h4>
            <div className="grid gap-1">
              {supportedCurrencies.map((currency) => {
                const info = currencyInfo[currency];
                const isSelected = currency === userCurrency;
                return (
                  <button
                    key={currency}
                    onClick={() => setUserCurrency(currency)}
                    className={cn(
                      'flex items-center gap-3 w-full p-2 text-left rounded-md hover:bg-gray-100 transition-colors',
                      isSelected && 'bg-blue-50 text-blue-700'
                    )}
                  >
                    <span className="text-lg">{info.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium">{currency}</div>
                      <div className="text-sm text-muted-foreground">{info.name}</div>
                    </div>
                    <span className="text-sm text-muted-foreground">{info.symbol}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Inline variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showFlag && <span>{currentCurrencyInfo.flag}</span>}
      <span className="font-medium">{userCurrency}</span>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          ({currentCurrencyInfo.name})
        </span>
      )}
    </div>
  );
};

export default CurrencySelector;