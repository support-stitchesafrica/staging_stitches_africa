/**
 * Product Card Component Tests
 * Tests for the ProductCard component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

const mockProduct: Product = {
	product_id: "test-product-1",
	title: "Test Product",
	description: "This is a test product description",
	type: "ready-to-wear",
	category: "shirts",
	availability: "in_stock",
	status: "verified",
	price: {
		base: 5000,
		currency: "NGN",
	},
	discount: 0,
	deliveryTimeline: "3-5 days",
	returnPolicy: "30 days",
	images: ["/test-image.jpg"],
	tailor_id: "test-tailor",
	tailor: "Test Tailor",
	tags: ["casual", "cotton"],
	isPublished: true,
};

describe("ProductCard", () => {
	it("renders product information correctly", () => {
		render(<ProductCard product={mockProduct} />);

		expect(screen.getByText("Test Product")).toBeInTheDocument();
		expect(
			screen.getByText("This is a test product description"),
		).toBeInTheDocument();
		expect(screen.getByText("shirts")).toBeInTheDocument();
		expect(screen.getByText("in stock")).toBeInTheDocument();
	});

	it("shows discount badge when product has discount", () => {
		const discountedProduct = {
			...mockProduct,
			discount: 20,
		};

		render(<ProductCard product={discountedProduct} />);

		expect(screen.getByText("-20%")).toBeInTheDocument();
	});

	it("shows featured badge when product is featured", () => {
		const featuredProduct = {
			...mockProduct,
			featured: true,
		};

		render(<ProductCard product={featuredProduct} />);

		expect(screen.getByText("Featured")).toBeInTheDocument();
	});

	it("disables add to cart button when out of stock", () => {
		const outOfStockProduct = {
			...mockProduct,
			availability: "out_of_stock" as const,
		};

		render(<ProductCard product={outOfStockProduct} />);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
		expect(button).toHaveTextContent("Out of Stock");
	});

	it("calls onAddToCart when add to cart button is clicked", () => {
		const mockOnAddToCart = vi.fn();

		render(<ProductCard product={mockProduct} onAddToCart={mockOnAddToCart} />);

		const button = screen.getByRole("button", { name: /add to cart/i });
		button.click();

		expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
	});

	it("renders in list layout correctly", () => {
		const { container } = render(
			<ProductCard product={mockProduct} layout="list" />,
		);

		// List layout should have flex class
		expect(container.firstChild).toHaveClass("flex");
	});
});
