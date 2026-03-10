/**
 * ProductCard Image, Name, Price Display Test
 * Specific test to verify the task requirement: "Product cards show image, name, price"
 *
 * **Feature: merchant-storefront-upgrade, Property 7: Product Showcase and Cart Integration**
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProductCard from "../ProductCard";
import { Product } from "@/types";

// Mock Next.js Image component
vi.mock("next/image", () => ({
	default: ({ src, alt, ...props }: any) => (
		<img src={src} alt={alt} {...props} />
	),
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
	default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
	usePathname: () => "/store/test-storefront",
}));

// Mock contexts
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: () => ({ user: null }),
}));

vi.mock("@/contexts/CurrencyContext", () => ({
	useCurrency: () => ({
		userCountry: "US",
		userCurrency: "USD",
		isLoading: false,
		formatPrice: (p: number, currency?: string) => {
			const c = currency || "USD";
			try {
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: c,
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				}).format(p);
			} catch {
				return `${c} ${p}`;
			}
		},
		convertPrice: async (
			price: number,
			fromCurrency: string = "USD",
			toCurrency?: string,
		) => ({
			originalPrice: price,
			originalCurrency: fromCurrency,
			convertedPrice: price,
			convertedCurrency: toCurrency || "USD",
			exchangeRate: 1.0,
			lastRefreshed: new Date().toISOString(),
		}),
	}),
}));

// Mock pixel tracking
vi.mock("../PixelTracker", () => ({
	usePixelTracking: () => ({
		trackProductView: vi.fn(),
		trackAddToCart: vi.fn(),
	}),
}));

// Mock activity tracker
vi.mock("@/lib/analytics/activity-tracker", () => ({
	getActivityTracker: () => ({
		trackProductView: vi.fn(() => Promise.resolve()),
		trackAddToCart: vi.fn(() => Promise.resolve()),
	}),
}));

// Mock the currency conversion hook so Price renders synchronously
vi.mock("@/hooks/useCurrencyConversion", () => ({
	useConvertedPrice: (price: number, fromCurrency: string = "USD") => {
		const formatted = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: fromCurrency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(price);
		return {
			convertedPrice: {
				originalPrice: price,
				originalCurrency: fromCurrency,
				convertedPrice: price,
				convertedCurrency: fromCurrency,
				exchangeRate: 1.0,
				lastRefreshed: new Date().toISOString(),
			},
			isLoading: false,
			error: null,
			formattedPrice: formatted,
		};
	},
	useCurrencyConversion: () => ({
		convertPrice: vi.fn(),
		convertAndFormatPrice: vi.fn(),
		formatPrice: (p: number, c: string) => `${c} ${p}`,
		userCurrency: "USD",
		userCountry: "US",
		isLoading: false,
	}),
}));

const mockProduct: Product = {
	product_id: "test-product-1",
	title: "Beautiful Summer Dress",
	description: "A lovely summer dress perfect for any occasion",
	type: "ready-to-wear",
	category: "dresses",
	availability: "in_stock",
	status: "verified",
	price: {
		base: 15000,
		currency: "NGN",
	},
	discount: 0,
	deliveryTimeline: "3-5 days",
	returnPolicy: "30 days",
	images: ["/test-image.jpg"],
	thumbnail: "/test-thumbnail.jpg",
	tailor_id: "test-tailor",
	tailor: "Test Tailor",
	tags: ["summer", "dress"],
	isPublished: true,
};

describe("ProductCard - Image, Name, Price Display Verification", () => {
	it("should display product image from images array", () => {
		render(<ProductCard product={mockProduct} />);

		const image = screen.getByAltText("Beautiful Summer Dress");
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute("src", "/test-image.jpg");
	});

	it("should display product name/title prominently", () => {
		render(<ProductCard product={mockProduct} />);

		const title = screen.getByText("Beautiful Summer Dress");
		expect(title).toBeInTheDocument();
		expect(title.tagName).toBe("H3"); // Should be in a heading tag
	});

	it("should display formatted product price with currency", async () => {
		render(<ProductCard product={mockProduct} />);

		// Base price 15,000 NGN + 20% commission = 18,000 NGN
		await waitFor(() => {
			expect(screen.getByText(/NGN.*18,000/)).toBeInTheDocument();
		});
	});

	it("should display all three required elements together in grid layout", async () => {
		render(<ProductCard product={mockProduct} layout="grid" />);

		// Verify all three key elements are present
		expect(screen.getByAltText("Beautiful Summer Dress")).toBeInTheDocument(); // Image
		expect(screen.getByText("Beautiful Summer Dress")).toBeInTheDocument(); // Name
		await waitFor(() => {
			expect(screen.getByText(/NGN.*18,000/)).toBeInTheDocument(); // Price (15000 * 1.2)
		});
	});

	it("should display all three required elements together in list layout", async () => {
		render(<ProductCard product={mockProduct} layout="list" />);

		// Verify all three key elements are present in list layout
		expect(screen.getByAltText("Beautiful Summer Dress")).toBeInTheDocument(); // Image
		expect(screen.getByText("Beautiful Summer Dress")).toBeInTheDocument(); // Name
		await waitFor(() => {
			expect(screen.getByText(/NGN.*18,000/)).toBeInTheDocument(); // Price (15000 * 1.2)
		});
	});

	it("should use thumbnail as fallback image when images array is empty", () => {
		const productWithoutImages = {
			...mockProduct,
			images: [],
		};

		render(<ProductCard product={productWithoutImages} />);

		const image = screen.getByAltText("Beautiful Summer Dress");
		expect(image).toHaveAttribute("src", "/test-thumbnail.jpg");
	});

	it("should use placeholder when no images or thumbnail available", () => {
		const productWithoutMedia = {
			...mockProduct,
			images: [],
			thumbnail: undefined,
		};

		render(<ProductCard product={productWithoutMedia} />);

		const image = screen.getByAltText("Beautiful Summer Dress");
		expect(image).toHaveAttribute("src", "/placeholder-product.svg");
	});

	it("should display discounted price when product has discount", async () => {
		const discountedProduct = {
			...mockProduct,
			discount: 20, // 20% discount
		};

		render(<ProductCard product={discountedProduct} />);

		// Base 15,000 * 0.8 (discount) * 1.2 (commission) = 14,400 discounted
		// Base 15,000 * 1.2 (commission) = 18,000 original (strikethrough)
		await waitFor(() => {
			expect(screen.getByText(/NGN.*14,400/)).toBeInTheDocument(); // Discounted price
			expect(screen.getByText(/NGN.*18,000/)).toBeInTheDocument(); // Original price (crossed out)
		});
	});

	it("should display price from price object with discount field", async () => {
		const productWithPriceDiscount = {
			...mockProduct,
			price: {
				base: 20000,
				currency: "NGN",
				discount: 25, // 25% discount in price object
			},
		};

		render(<ProductCard product={productWithPriceDiscount} />);

		// Base 20,000 * 0.75 (discount) * 1.2 (commission) = 18,000 discounted
		// Base 20,000 * 1.2 (commission) = 24,000 original (strikethrough)
		await waitFor(() => {
			expect(screen.getByText(/NGN.*18,000/)).toBeInTheDocument(); // Discounted price
			expect(screen.getByText(/NGN.*24,000/)).toBeInTheDocument(); // Original price
		});
	});

	it("should handle different currencies correctly", async () => {
		const usdProduct = {
			...mockProduct,
			price: {
				base: 100,
				currency: "USD",
			},
		};

		render(<ProductCard product={usdProduct} />);

		// Base 100 * 1.2 (commission) = 120
		await waitFor(() => {
			expect(screen.getByText(/\$120/)).toBeInTheDocument();
		});
	});
});
