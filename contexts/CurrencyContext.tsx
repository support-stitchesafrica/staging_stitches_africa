/**
 * Currency Context Provider
 * Manages global currency settings and provides currency conversion functionality
 */

"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	ReactNode,
} from "react";
import {
	currencyService,
	CurrencyConversionResult,
} from "@/lib/services/currencyService";
import {
	getCountryForCurrency,
	readStoredCurrencyPreference,
} from "@/lib/utils/currency";

interface CurrencyContextType {
	userCurrency: string;
	userCountry: string;
	isLoading: boolean;
	setUserCurrency: (currency: string) => void;
	convertPrice: (
		price: number,
		fromCurrency?: string,
		toCurrency?: string,
	) => Promise<CurrencyConversionResult>;
	formatPrice: (price: number, currency?: string) => string;
	getSupportedCurrencies: () => string[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
	undefined,
);

function getInitialPreference(): { currency: string; country: string } {
	const stored = readStoredCurrencyPreference();
	if (stored) {
		return { currency: stored.currency, country: stored.country };
	}
	return { currency: "USD", country: "US" };
}

interface CurrencyProviderProps {
	children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
	children,
}) => {
	const initial = getInitialPreference();
	const [userCurrency, setUserCurrencyState] = useState<string>(
		initial.currency,
	);
	const [userCountry, setUserCountryState] = useState<string>(initial.country);
	const [isLoading, setIsLoading] = useState<boolean>(
		() => !readStoredCurrencyPreference(),
	);

	useEffect(() => {
		let cancelled = false;

		const initializeCurrency = async () => {
			try {
				const stored = readStoredCurrencyPreference();
				if (stored) {
					currencyService.setUserPreference(stored.currency, stored.country);
					if (!cancelled) {
						setUserCurrencyState(stored.currency);
						setUserCountryState(stored.country);
						setIsLoading(false);
					}
					return;
				}

				await currencyService.whenReady();

				if (cancelled) return;

				const currency = currencyService.getUserCurrency();
				const country = currencyService.getUserCountry();
				setUserCurrencyState(currency);
				setUserCountryState(country);
			} catch (error) {
				console.error("Error initializing currency:", error);
				const fallback = readStoredCurrencyPreference();
				if (fallback && !cancelled) {
					setUserCurrencyState(fallback.currency);
					setUserCountryState(fallback.country);
					currencyService.setUserPreference(
						fallback.currency,
						fallback.country,
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		void initializeCurrency();

		return () => {
			cancelled = true;
		};
	}, []);

	const setUserCurrency = useCallback((currency: string) => {
		const code = currency.toUpperCase();
		const country = getCountryForCurrency(code);
		setUserCurrencyState(code);
		setUserCountryState(country);
		currencyService.setUserPreference(code, country);
	}, []);

	const convertPrice = async (
		price: number,
		fromCurrency: string = "USD",
		toCurrency?: string,
	): Promise<CurrencyConversionResult> => {
		return await currencyService.convertPrice(
			price,
			fromCurrency,
			toCurrency ?? userCurrency,
		);
	};

	const formatPrice = (price: number, currency?: string): string => {
		return currencyService.formatPrice(price, currency || userCurrency);
	};

	const getSupportedCurrencies = (): string[] => {
		return [
			"USD",
			"EUR",
			"GBP",
			"CAD",
			"AUD",
			"JPY",
			"CNY",
			"INR",
			"BRL",
			"MXN",
			"NGN",
			"GHS",
			"KES",
			"ZAR",
			"EGP",
			"CHF",
			"SEK",
			"NOK",
			"DKK",
			"PLN",
		];
	};

	const value: CurrencyContextType = {
		userCurrency,
		userCountry,
		isLoading,
		setUserCurrency,
		convertPrice,
		formatPrice,
		getSupportedCurrencies,
	};

	return (
		<CurrencyContext.Provider value={value}>
			{children}
		</CurrencyContext.Provider>
	);
};

export const useCurrency = (): CurrencyContextType => {
	const context = useContext(CurrencyContext);
	if (context === undefined) {
		throw new Error("useCurrency must be used within a CurrencyProvider");
	}
	return context;
};

export default CurrencyProvider;
