/**
 * Currency utility functions for USD formatting
 * All monetary values in the vendor analytics system use USD format
 *
 * Validates: Requirements 23.1, 23.2, 23.3, 23.4, 23.5
 */

/**
 * Fallback USD→foreign rates (aligned with `currencyService` fallbacks) for
 * synchronous UI (e.g. sliders) where async `convertPrice` is awkward.
 */
export const USD_TO_CURRENCY_FALLBACK_RATE: Readonly<Record<string, number>> =
{
	USD: 1,
	NGN: 1350,
	GHS: 15.5,
	KES: 129,
	ZAR: 18.5,
	EGP: 49,
	EUR: 0.85,
	GBP: 0.73,
	CAD: 1.35,
	AUD: 1.55,
	JPY: 150,
	CNY: 7.3,
	INR: 83,
	BRL: 5.2,
	MXN: 17.5,
	CHF: 0.79,
	SEK: 11,
	NOK: 11,
	DKK: 7.2,
	PLN: 4,
};

/** Convert an amount in USD to `toCurrency` using fallback rates (sync). */
export function convertUsdToCurrencySync(
	amountUsd: number,
	toCurrency: string,
): number
{
	const rate =
		USD_TO_CURRENCY_FALLBACK_RATE[toCurrency.toUpperCase()] ?? 1;
	return amountUsd * rate;
}

/** Convert an amount from `fromCurrency` to USD using fallback rates (sync). */
export function convertCurrencyToUsdSync(
	amount: number,
	fromCurrency: string,
): number
{
	const code = fromCurrency.toUpperCase();
	if (code === "USD") return amount;
	const rate = USD_TO_CURRENCY_FALLBACK_RATE[code] ?? 1;
	if (rate === 1) return amount;
	return amount / rate;
}

/**
 * Formats amount in USD currency with full precision
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted string in USD format (e.g., "$12,345.67")
 * 
 * Validates: Requirements 23.1, 23.2, 23.4
 * 
 * @example
 * formatUSD(12345.67) // "$12,345.67"
 * formatUSD(0) // "$0.00"
 * formatUSD(-500.5) // "-$500.50"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats amount for charts with compact notation (shorter format)
 * Used for chart axes where space is limited
 * 
 * @param amount - The numeric amount to format
 * @returns Compact formatted string (e.g., "$1.2K", "$5.5M")
 * 
 * Validates: Requirements 23.2, 23.4
 * 
 * @example
 * formatUSDCompact(1234) // "$1.2K"
 * formatUSDCompact(1234567) // "$1.2M"
 * formatUSDCompact(500) // "$500"
 */
export function formatUSDCompact(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${sign}$${absAmount.toFixed(0)}`;
}

/**
 * Parses USD formatted string to number
 * Removes currency symbols and commas to extract numeric value
 * 
 * @param usdString - USD formatted string (e.g., "$12,345.67")
 * @returns Numeric value
 * 
 * Validates: Requirements 23.4
 * 
 * @example
 * parseUSD("$12,345.67") // 12345.67
 * parseUSD("$1,000") // 1000
 * parseUSD("-$500.50") // -500.50
 */
export function parseUSD(usdString: string): number {
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = usdString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}

/** localStorage keys for shopper display currency (shops). */
export const CURRENCY_STORAGE_KEYS = {
	userCurrency: "userCurrency",
	userCountry: "userCountry",
	manualCurrency: "manualCurrency",
	manualCountry: "manualCountry",
	detectedCurrency: "detectedCurrency",
	detectedCountry: "detectedCountry",
} as const;

export interface StoredCurrencyPreference {
	currency: string;
	country: string;
	/** True when the user chose currency via the header selector. */
	isManual: boolean;
}

/** Default country for a currency code (for flags / duty helpers). */
const CURRENCY_TO_COUNTRY: Readonly<Record<string, string>> = {
	USD: "US",
	NGN: "NG",
	EUR: "DE",
	GBP: "GB",
	CAD: "CA",
	AUD: "AU",
	JPY: "JP",
	CNY: "CN",
	INR: "IN",
	BRL: "BR",
	MXN: "MX",
	GHS: "GH",
	KES: "KE",
	ZAR: "ZA",
	EGP: "EG",
	CHF: "CH",
	SEK: "SE",
	NOK: "NO",
	DKK: "DK",
	PLN: "PL",
};

export function getCountryForCurrency(currency: string): string {
	return CURRENCY_TO_COUNTRY[currency.toUpperCase()] ?? "US";
}

function isBrowser(): boolean {
	return typeof window !== "undefined";
}

/** User explicitly picked currency in the header (must not be overwritten by geo). */
export function hasManualCurrencyOverride(): boolean {
	if (!isBrowser()) return false;
	return Boolean(
		localStorage.getItem(CURRENCY_STORAGE_KEYS.manualCurrency) &&
			localStorage.getItem(CURRENCY_STORAGE_KEYS.manualCountry),
	);
}

/** Any saved shopper preference (manual, session, or legacy detected). */
export function hasStoredCurrencyPreference(): boolean {
	return readStoredCurrencyPreference() !== null;
}

/**
 * Read persisted currency/country. Priority: manual override → userCurrency → detected*.
 */
export function readStoredCurrencyPreference(): StoredCurrencyPreference | null {
	if (!isBrowser()) return null;

	const manualCurrency = localStorage.getItem(
		CURRENCY_STORAGE_KEYS.manualCurrency,
	);
	const manualCountry = localStorage.getItem(CURRENCY_STORAGE_KEYS.manualCountry);
	if (manualCurrency && manualCountry) {
		return {
			currency: manualCurrency.toUpperCase(),
			country: manualCountry.toUpperCase(),
			isManual: true,
		};
	}

	const userCurrency = localStorage.getItem(CURRENCY_STORAGE_KEYS.userCurrency);
	if (userCurrency) {
		const storedCountry = localStorage.getItem(CURRENCY_STORAGE_KEYS.userCountry);
		return {
			currency: userCurrency.toUpperCase(),
			country: (storedCountry || getCountryForCurrency(userCurrency)).toUpperCase(),
			isManual: false,
		};
	}

	const detectedCurrency = localStorage.getItem(
		CURRENCY_STORAGE_KEYS.detectedCurrency,
	);
	const detectedCountry = localStorage.getItem(CURRENCY_STORAGE_KEYS.detectedCountry);
	if (detectedCurrency && detectedCountry) {
		return {
			currency: detectedCurrency.toUpperCase(),
			country: detectedCountry.toUpperCase(),
			isManual: false,
		};
	}

	return null;
}

/** Persist currency/country for all shop pages. */
export function writeStoredCurrencyPreference(
	currency: string,
	country: string,
	options?: { manual?: boolean },
): void {
	if (!isBrowser()) return;

	const code = currency.toUpperCase();
	const countryCode = country.toUpperCase();

	localStorage.setItem(CURRENCY_STORAGE_KEYS.userCurrency, code);
	localStorage.setItem(CURRENCY_STORAGE_KEYS.userCountry, countryCode);

	if (options?.manual) {
		localStorage.setItem(CURRENCY_STORAGE_KEYS.manualCurrency, code);
		localStorage.setItem(CURRENCY_STORAGE_KEYS.manualCountry, countryCode);
	}
}

/** Header currency selector — locks preference until user changes it again. */
export function setManualCurrencyPreference(
	currency: string,
	country?: string,
): void {
	const code = currency.toUpperCase();
	writeStoredCurrencyPreference(code, country ?? getCountryForCurrency(code), {
		manual: true,
	});
}

/**
 * First-visit geo detection — only writes when user has not chosen a currency yet.
 */
export function persistDetectedCurrencyPreference(
	currency: string,
	country: string,
): void {
	if (!isBrowser()) return;
	if (hasManualCurrencyOverride()) return;
	if (localStorage.getItem(CURRENCY_STORAGE_KEYS.userCurrency)) return;

	const code = currency.toUpperCase();
	const countryCode = country.toUpperCase();
	localStorage.setItem(CURRENCY_STORAGE_KEYS.userCurrency, code);
	localStorage.setItem(CURRENCY_STORAGE_KEYS.userCountry, countryCode);
	localStorage.setItem(CURRENCY_STORAGE_KEYS.detectedCurrency, code);
	localStorage.setItem(CURRENCY_STORAGE_KEYS.detectedCountry, countryCode);
}
