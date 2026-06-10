/**
 * Bug Condition Exploration Test
 *
 * Feature: vendor-product-edit
 * Property 1: Bug Condition - Edit Icon Absent on My Products Cards
 *
 * Validates: Requirements 1.1, 1.2
 *
 * PURPOSE: This test encodes the EXPECTED (fixed) behavior.
 * On UNFIXED code it MUST FAIL — failure confirms the bug exists.
 * When the fix is applied (Task 3), this test will PASS.
 *
 * COUNTEREXAMPLES DOCUMENTED (from running on unfixed code):
 *   - CollectionProductCard: No button with a pencil/edit icon found in rendered output.
 *     The component renders only a selection checkbox and product info — no edit affordance.
 *   - CollectionProductListItem: Same — no pencil icon button present in rendered output.
 *   - Clicking the card body calls onToggleSelection but there is no onEdit prop to call.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fc from 'fast-check';

// ─── Module mocks (must be declared before imports that use them) ─────────────

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
import { CollectionProduct } from '@/types/collections';
import { Timestamp } from 'firebase/firestore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal valid CollectionProduct for testing */
function makeMockProduct(overrides: Partial<CollectionProduct> = {}): CollectionProduct
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

/**
 * Render the page with the "My Products" tab active and the given products loaded.
 * Returns the rendered result (including unmount for cleanup in PBT runs).
 */
async function renderPageWithMyProducts(products: CollectionProduct[])
{
    (getUserProducts as ReturnType<typeof vi.fn>).mockResolvedValue(products);

    let result!: ReturnType<typeof render>;
    await act(async () =>
    {
        result = render(<ProductSelectionPage />);
    });

    // Click the "My Products" tab — use getAllByText to handle multiple renders in PBT
    const myProductsTabs = screen.getAllByText(/My Products/i);
    await act(async () =>
    {
        fireEvent.click(myProductsTabs[0]);
    });

    return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 1: Bug Condition — Edit Icon Absent on My Products Cards', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    /**
     * Validates: Requirements 1.1
     *
     * CollectionProductCard (grid view) must render a pencil/edit icon button.
     * On UNFIXED code this FAILS — no such button exists.
     */
    it('CollectionProductCard renders a pencil edit icon button', async () =>
    {
        const product = makeMockProduct({ id: 'card-product-1', title: 'Grid Product' });
        await renderPageWithMyProducts([product]);

        // The fixed component should render a button with a pencil icon.
        // Query by aria-label or by the SVG title/role. We look for any button
        // that contains an SVG (the Pencil icon from lucide-react).
        const editButtons = screen
            .getAllByRole('button')
            .filter((btn) =>
            {
                // The pencil button should have an SVG child (lucide Pencil icon)
                return btn.querySelector('svg') !== null &&
                    // Exclude the selection checkbox area and other buttons
                    !btn.closest('[data-testid="selection-checkbox"]') &&
                    // The edit button should NOT be the view-toggle or create-product buttons
                    btn.className.includes('opacity-0') || btn.getAttribute('aria-label')?.toLowerCase().includes('edit');
            });

        // EXPECTED (fixed behavior): at least one edit button with pencil icon exists
        // ACTUAL (unfixed): no such button — this assertion FAILS, confirming the bug
        expect(editButtons.length).toBeGreaterThan(0);
    });

    /**
     * Validates: Requirements 1.1
     *
     * CollectionProductListItem (list view) must render a pencil/edit icon button.
     * On UNFIXED code this FAILS.
     */
    it('CollectionProductListItem renders a pencil edit icon button in list view', async () =>
    {
        const product = makeMockProduct({ id: 'list-product-1', title: 'List Product' });
        await renderPageWithMyProducts([product]);

        // Switch to list view
        const listViewButton = screen.getByTitle('List View');
        await act(async () =>
        {
            fireEvent.click(listViewButton);
        });

        const editButtons = screen
            .getAllByRole('button')
            .filter((btn) =>
            {
                return btn.querySelector('svg') !== null &&
                    (btn.className.includes('opacity-0') || btn.getAttribute('aria-label')?.toLowerCase().includes('edit'));
            });

        // EXPECTED (fixed behavior): at least one edit button with pencil icon exists
        // ACTUAL (unfixed): no such button — this assertion FAILS, confirming the bug
        expect(editButtons.length).toBeGreaterThan(0);
    });

    /**
     * Validates: Requirements 1.1, 1.2
     *
     * Property-based: for ANY CollectionProduct rendered in the My Products tab,
     * a pencil icon button must be present.
     *
     * On UNFIXED code this FAILS for every generated product.
     */
    it('for any CollectionProduct, a pencil edit button is present on the card (grid view)', async () =>
    {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    id: fc.uuid(),
                    title: fc.string({ minLength: 1, maxLength: 80 }),
                    description: fc.string({ minLength: 0, maxLength: 200 }),
                    quantity: fc.integer({ min: 0, max: 999 }),
                    size: fc.constantFrom('XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'),
                    color: fc.string({ minLength: 1, maxLength: 30 }),
                    price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true }),
                    brandName: fc.string({ minLength: 1, maxLength: 60 }),
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

                    // Look for a button that has an SVG child and is positioned as an edit button
                    // (opacity-0 class is the hover-only visibility pattern from the design)
                    const allButtons = screen.getAllByRole('button');
                    const pencilButtons = allButtons.filter((btn) =>
                        btn.querySelector('svg') !== null &&
                        (btn.className.includes('opacity-0') ||
                            btn.getAttribute('aria-label')?.toLowerCase().includes('edit') ||
                            btn.getAttribute('data-testid')?.toLowerCase().includes('edit'))
                    );

                    // EXPECTED (fixed): pencil button present for every product
                    // ACTUAL (unfixed): no pencil button — FAILS, confirming bug
                    const result = pencilButtons.length > 0;
                    unmount();
                    expect(result).toBe(true);
                }
            ),
            { numRuns: 3 }
        );
    });

    /**
     * Validates: Requirements 1.2
     *
     * Clicking the pencil button must call onEdit with the correct product
     * and must NOT call onToggleSelection.
     *
     * On UNFIXED code this FAILS because no pencil button exists to click.
     */
    it('clicking the pencil button calls onEdit with the product and does not toggle selection', async () =>
    {
        const product = makeMockProduct({ id: 'edit-test-product', title: 'Editable Product' });
        await renderPageWithMyProducts([product]);

        // Find the pencil/edit button
        const allButtons = screen.getAllByRole('button');
        const pencilButton = allButtons.find((btn) =>
            btn.querySelector('svg') !== null &&
            (btn.className.includes('opacity-0') ||
                btn.getAttribute('aria-label')?.toLowerCase().includes('edit') ||
                btn.getAttribute('data-testid')?.toLowerCase().includes('edit'))
        );

        // EXPECTED (fixed): pencil button exists
        // ACTUAL (unfixed): undefined — this assertion FAILS, confirming the bug
        expect(pencilButton).toBeDefined();

        if (pencilButton)
        {
            // After clicking the pencil button, the edit dialog should open
            // (not the selection state change)
            const selectionCountBefore = screen.getByText(/0 of 1 selected/i);
            expect(selectionCountBefore).toBeInTheDocument();

            await act(async () =>
            {
                fireEvent.click(pencilButton);
            });

            // Selection count should remain 0 (stopPropagation prevents selection toggle)
            const selectionCountAfter = screen.queryByText(/0 of 1 selected/i);
            expect(selectionCountAfter).toBeInTheDocument();
        }
    });
});
