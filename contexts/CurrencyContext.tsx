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
	ReactNode,
} from "react";
import {
	currencyService,
	CurrencyConversionResult,
} from "@/lib/services/currencyService";

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

interface CurrencyProviderProps {
	children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
	children,
}) => {
	const [userCurrency, setUserCurrencyState] = useState<string>("USD");
	const [userCountry, setUserCountry] = useState<string>("US");
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const initializeCurrency = async () => {
			try {
				// Wait for currency service to detect location
				await new Promise((resolve) => setTimeout(resolve, 2000));

				const currency = currencyService.getUserCurrency();
				const country = currencyService.getUserCountry();

				setUserCurrencyState(currency);
				setUserCountry(country);

				// Store in localStorage for persistence
				localStorage.setItem("userCurrency", currency);
				localStorage.setItem("userCountry", country);
			} catch (error) {
				console.error("Error initializing currency:", error);
				// Try to get from localStorage as fallback
				const storedCurrency = localStorage.getItem("userCurrency");
				const storedCountry = localStorage.getItem("userCountry");

				if (storedCurrency) {
					setUserCurrencyState(storedCurrency);
					currencyService.setUserCurrency(storedCurrency);
				}
				if (storedCountry) {
					setUserCountry(storedCountry);
				}
			} finally {
				setIsLoading(false);
			}
		};

		initializeCurrency();
	}, []);

	const setUserCurrency = (currency: string) => {
		setUserCurrencyState(currency);
		currencyService.setUserCurrency(currency);
		localStorage.setItem("userCurrency", currency);
	};

	const convertPrice = async (
		price: number,
		fromCurrency: string = "USD",
		toCurrency?: string,
	): Promise<CurrencyConversionResult> => {
		return await currencyService.convertPrice(price, fromCurrency, toCurrency);
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
