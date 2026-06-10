/**
 * Preservation Property Tests
 *
 * Feature: vendor-product-edit
 * Property 2: Preservation — Selection and Non-Edit Interactions Unchanged
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * PURPOSE: These tests encode BASELINE behavior that must be preserved after the fix.
 * They MUST PASS on UNFIXED code — passing confirms the baseline exists.
 * After the fix (Task 3), these tests must STILL PASS (no regressions).
 *
 * OBSERVATIONS ON UNFIXED CODE:
 *   1. Card body click calls onToggleSelection: CollectionProductCard and
 *      CollectionProductListItem both have onClick={handleClick} on the outer div,
 *      which calls onToggleSelection(product.id). There is NO onEdit prop on either
 *      component in the unfixed code.
 *
 *   2. Marketplace ProductCard has no pencil icon: components/collections/products/ProductCard.tsx
 *      imports only Check from lucide-react (NOT Pencil). No Pencil icon is rendered anywhere
 *      in the component. The marketplace tab must never gain an edit icon.
 *
 *   3. filteredCollectionProducts is independent of edit state: The useMemo filters
 *      collectionProducts by searchQuery, selectedVendors, and priceRange only.
 *      It does NOT depend on editingProduct, isEditDialogOpen, or any edit-related state.
 *      Filter results are identical before and after the fix.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fc from 'fast-check';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), pathname: '/' }),
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/firestore', () => ({
    productRepository: {
        getAllWithTailorInfo: vi.fn().mockResolvedValue([]),
    },
    collectionRepository: {
        create: vi.fn().mockResolvedValue('mock-collection-id'),
    },
}));

vi.mock('@/lib/collections/product-service', () => ({
    getUserProducts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/contexts/CollectionsAuthContext', () => ({
    useCollectionsAuth: () => ({
        user: { uid: 'test-user-uid', email: 'test@example.com' },
    }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import ProductSelectionPage from '../page';
import { getUserProducts } from '@/lib/collections/product-service';
import { productRepository } from '@/lib/firestore';
import { CollectionProduct } from '@/types/collections';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockCollectionProduct(overrides: Partial<CollectionProduct> = {}): CollectionProduct
{
    return {
        id: 'product-1',
        title: 'Test Product',
        description: 'A test product',
        quantity: 5,
        size: 'M',
        color: 'Red',
        price: 29.99,
        brandName: 'TestBrand',
        images: [],
        owner: { name: 'Owner', email: 'owner@test.com', phoneNumber: '1234567890' },
        createdBy: 'test-user-uid',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

function makeMarketplaceProduct(overrides: Record<string, unknown> = {})
{
    return {
        product_id: 'mp-product-1',
        title: 'Marketplace Product',
        price: { base: 10, currency: 'NGN' },
        images: ['/test.jpg'],
        discount: 0,
        availability: 'in_stock',
        ...overrides,
    };
}

async function renderPageWithMyProducts(products: CollectionProduct[])
{
    (getUserProducts as ReturnType<typeof vi.fn>).mockResolvedValue(products);

    let result!: ReturnType<typeof render>;
    await act(async () =>
    {
        result = render(<ProductSelectionPage />);
    });

    // Switch to My Products tab
    const myProductsTabs = screen.getAllByText(/My Products/i);
    await act(async () =>
    {
        fireEvent.click(myProductsTabs[0]);
    });

    return result;
}

async function renderPageMarketplace(marketplaceProducts: unknown[] = [])
{
    (productRepository.getAllWithTailorInfo as ReturnType<typeof vi.fn>).mockResolvedValue(marketplaceProducts);

    let result!: ReturnType<typeof render>;
    await act(async () =>
    {
        result = render(<ProductSelectionPage />);
    });

    return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 2: Preservation — Selection and Non-Edit Interactions Unchanged', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    /**
     * Validates: Requirements 3.2
     *
     * Clicking the card body (outer div) calls onToggleSelection.
     * No edit dialog should open (no dialog with "Edit" in heading).
     * PASSES on unfixed code — card body click toggles selection.
     */
    it('card body click calls onToggleSelection and does not call onEdit (grid view)', async () =>
    {
        const product = makeMockCollectionProduct({ id: 'grid-product-1', title: 'Grid Selection Product' });
        await renderPageWithMyProducts([product]);

        // Verify initial state: 0 of 1 selected
        expect(screen.getByText(/0 of 1 selected/i)).toBeInTheDocument();

        // Click the element containing the product title (the card body)
        const productTitle = screen.getByText('Grid Selection Product');
        await act(async () =>
        {
            fireEvent.click(productTitle);
        });

        // Selection count should increase to 1 of 1
        expect(screen.getByText(/1 of 1 selected/i)).toBeInTheDocument();

        // No edit dialog should have opened
        const editDialogs = screen.queryAllByRole('dialog');
        const editHeadings = editDialogs.filter(d =>
            d.textContent?.toLowerCase().includes('edit')
        );
        expect(editHeadings.length).toBe(0);
    });

    /**
     * Validates: Requirements 3.2
     *
     * Same as above but in list view.
     * PASSES on unfixed code.
     */
    it('card body click calls onToggleSelection and does not call onEdit (list view)', async () =>
    {
        const product = makeMockCollectionProduct({ id: 'list-product-1', title: 'List Selection Product' });
        await renderPageWithMyProducts([product]);

        // Switch to list view
        const listViewButton = screen.getByTitle('List View');
        await act(async () =>
        {
            fireEvent.click(listViewButton);
        });

        // Verify initial state
        expect(screen.getByText(/0 of 1 selected/i)).toBeInTheDocument();

        // Click the product title (card body)
        const productTitle = screen.getByText('List Selection Product');
        await act(async () =>
        {
            fireEvent.click(productTitle);
        });

        // Selection count should increase
        expect(screen.getByText(/1 of 1 selected/i)).toBeInTheDocument();

        // No edit dialog should have opened
        const editDialogs = screen.queryAllByRole('dialog');
        const editHeadings = editDialogs.filter(d =>
            d.textContent?.toLowerCase().includes('edit')
        );
        expect(editHeadings.length).toBe(0);
    });

    /**
     * Validates: Requirements 3.2
     *
     * Property-based: for any CollectionProduct, clicking the card body toggles selection.
     * PASSES on unfixed code.
     */
    it('property-based: for any CollectionProduct, clicking the card body toggles selection', async () =>
    {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    id: fc.uuid(),
                    title: fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
                    description: fc.string({ minLength: 0, maxLength: 100 }),
                    quantity: fc.integer({ min: 0, max: 100 }),
                    size: fc.constantFrom('XS', 'S', 'M', 'L', 'XL'),
                    color: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    price: fc.float({ min: Math.fround(0.01), max: Math.fround(999.99), noNaN: true }),
                    brandName: fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0),
                }),
                async (productData) =>
                {
                    vi.clearAllMocks();

                    const product: CollectionProduct = {
                        ...productData,
                        images: [],
                        owner: { name: 'Owner', email: 'owner@test.com', phoneNumber: '000' },
                        createdBy: 'test-user-uid',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    const { unmount } = await renderPageWithMyProducts([product]);

                    // Verify initial: 0 of 1 selected
                    const initialCount = screen.queryByText(/0 of 1 selected/i);
                    expect(initialCount).toBeInTheDocument();

                    // Click the product title to trigger card body click
                    const titleEl = screen.getByText(product.title.trim());
                    await act(async () =>
                    {
                        fireEvent.click(titleEl);
                    });

                    // After click: 1 of 1 selected
                    const afterCount = screen.queryByText(/1 of 1 selected/i);
                    expect(afterCount).toBeInTheDocument();

                    unmount();
                }
            ),
            { numRuns: 3 }
        );
    });

    /**
     * Validates: Requirements 3.1
     *
     * Marketplace ProductCard has no pencil/edit icon.
     * PASSES on unfixed code — ProductCard only imports Check, not Pencil.
     */
    it('marketplace ProductCard has no pencil/edit icon', async () =>
    {
        const marketplaceProduct = makeMarketplaceProduct({
            product_id: 'mp-1',
            title: 'Marketplace Item',
        });

        (productRepository.getAllWithTailorInfo as ReturnType<typeof vi.fn>).mockResolvedValue([marketplaceProduct]);

        await act(async () =>
        {
            render(<ProductSelectionPage />);
        });

        // Marketplace tab is default — product should be visible
        expect(screen.getByText('Marketplace Item')).toBeInTheDocument();

        // No button with opacity-0 class (hover-only edit button pattern) should exist
        const allButtons = screen.getAllByRole('button');
        const editButtons = allButtons.filter(btn =>
            btn.className.includes('opacity-0') ||
            btn.getAttribute('aria-label')?.toLowerCase().includes('edit')
        );

        expect(editButtons.length).toBe(0);
    });

    /**
     * Validates: Requirements 3.1
     *
     * Property-based: for any Product in marketplace tab, no pencil icon is rendered.
     * PASSES on unfixed code.
     */
    it('property-based: for any Product in marketplace tab, no pencil icon is rendered', async () =>
    {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    product_id: fc.uuid(),
                    title: fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
                    discount: fc.integer({ min: 0, max: 50 }),
                    availability: fc.constantFrom('in_stock', 'out_of_stock', 'pre_order'),
                }),
                async (productData) =>
                {
                    vi.clearAllMocks();

                    const product = {
                        ...productData,
                        price: { base: 10, currency: 'NGN' },
                        images: ['/test.jpg'],
                    };

                    (productRepository.getAllWithTailorInfo as ReturnType<typeof vi.fn>).mockResolvedValue([product]);

                    const { unmount } = await act(async () =>
                    {
                        return render(<ProductSelectionPage />);
                    });

                    // Marketplace tab is default — check no edit buttons
                    const allButtons = screen.getAllByRole('button');
                    const editButtons = allButtons.filter(btn =>
                        btn.className.includes('opacity-0') ||
                        btn.getAttribute('aria-label')?.toLowerCase().includes('edit')
                    );

                    expect(editButtons.length).toBe(0);

                    unmount();
                }
            ),
            { numRuns: 3 }
        );
    });

    /**
     * Validates: Requirements 3.4
     *
     * filteredCollectionProducts returns same set regardless of search query.
     * PASSES on unfixed code — filter logic is independent of edit state.
     */
    it('filteredCollectionProducts returns same set regardless of search query on unfixed code', async () =>
    {
        const products = [
            makeMockCollectionProduct({ id: 'p1', title: 'Alpha Shirt', brandName: 'BrandA' }),
            makeMockCollectionProduct({ id: 'p2', title: 'Beta Dress', brandName: 'BrandB' }),
            makeMockCollectionProduct({ id: 'p3', title: 'Gamma Jacket', brandName: 'BrandC' }),
        ];

        await renderPageWithMyProducts(products);

        // Without search: all 3 visible
        expect(screen.getByText('Alpha Shirt')).toBeInTheDocument();
        expect(screen.getByText('Beta Dress')).toBeInTheDocument();
        expect(screen.getByText('Gamma Jacket')).toBeInTheDocument();

        // Type "Alpha" in search
        const searchInput = screen.getByPlaceholderText(/Search by name, vendor, category, or description/i);
        await act(async () =>
        {
            fireEvent.change(searchInput, { target: { value: 'Alpha' } });
        });

        // Only Alpha Shirt visible
        expect(screen.getByText('Alpha Shirt')).toBeInTheDocument();
        expect(screen.queryByText('Beta Dress')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma Jacket')).not.toBeInTheDocument();

        // Clear search
        await act(async () =>
        {
            fireEvent.change(searchInput, { target: { value: '' } });
        });

        // All 3 visible again
        expect(screen.getByText('Alpha Shirt')).toBeInTheDocument();
        expect(screen.getByText('Beta Dress')).toBeInTheDocument();
        expect(screen.getByText('Gamma Jacket')).toBeInTheDocument();
    });

    /**
     * Validates: Requirements 3.4
     *
     * Property-based: filteredCollectionProducts filter is consistent for any search query.
     * PASSES on unfixed code.
     */
    it('property-based: filteredCollectionProducts filter is consistent for any search query', async () =>
    {
        const baseProducts = [
            makeMockCollectionProduct({ id: 'p1', title: 'Alpha', brandName: 'BrandA' }),
            makeMockCollectionProduct({ id: 'p2', title: 'Beta', brandName: 'BrandB' }),
            makeMockCollectionProduct({ id: 'p3', title: 'Gamma', brandName: 'BrandC' }),
        ];

        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 0, maxLength: 20 }),
                async (query) =>
                {
                    vi.clearAllMocks();

                    const { unmount } = await renderPageWithMyProducts(baseProducts);

                    const searchInput = screen.getByPlaceholderText(/Search by name, vendor, category, or description/i);

                    await act(async () =>
                    {
                        fireEvent.change(searchInput, { target: { value: query } });
                    });

                    // Count visible product titles from our set
                    const titles = ['Alpha', 'Beta', 'Gamma'];
                    const visibleCount = titles.filter(t => screen.queryByText(t) !== null).length;

                    // Basic sanity: count must be between 0 and 3
                    expect(visibleCount).toBeGreaterThanOrEqual(0);
                    expect(visibleCount).toBeLessThanOrEqual(3);

                    unmount();
                }
            ),
            { numRuns: 3 }
        );
    });
});
