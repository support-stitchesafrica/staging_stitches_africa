// EXPECTED OUTCOME: These tests FAIL on unfixed code — failure confirms the bug exists

/**
 * Property 1: Bug Condition — Unique Product Entries and Visual Representation
 *
 * These tests encode the EXPECTED (fixed) behavior of ManualOrderProcessor.
 * They are intentionally written to FAIL against the current unfixed code.
 * Failure here is the SUCCESS condition — it proves the bugs exist.
 *
 * Bugs being confirmed:
 *   1. After fetchProduct resolves, no visual item row is rendered (only JSON textarea updates)
 *   2. No per-item quantity (<input type="number">) or remove button controls exist in the JSX
 *   3. Calling fetchProduct twice with the same product_id creates a duplicate entry
 *      instead of incrementing quantity
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Polyfill ResizeObserver for jsdom (required by Radix UI Checkbox)
if (typeof window !== 'undefined' && !window.ResizeObserver)
{
    window.ResizeObserver = class ResizeObserver
    {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}

// ---------------------------------------------------------------------------
// Module Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/firestore', () => ({
    productRepository: {
        getById: vi.fn(),
    },
    AddressRepository: vi.fn().mockImplementation(() => ({
        getByUserId: vi.fn().mockResolvedValue([]),
    })),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: null })),
}));

vi.mock('@/lib/utils/module-helpers', () => ({
    loadFirebaseModule: vi.fn().mockResolvedValue({
        getFunctions: vi.fn(),
        httpsCallable: vi.fn(),
    }),
}));

vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('@/lib/firebase', () => ({
    getFirebaseApp: vi.fn().mockResolvedValue({}),
    getFirebaseDb: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/app/actions/admin-address-actions', () => ({
    fetchUserAddressesAdmin: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/priceUtils', () => ({
    getPriceValue: vi.fn(() => 50),
    getDiscount: vi.fn(() => 0),
    getCurrency: vi.fn(() => 'USD'),
    calculateFinalPrice: vi.fn(() => 50),
    calculateDutyAmount: vi.fn(() => 0),
    calculatePlatformCommission: vi.fn(() => 5),
    getEffectiveDutyRate: vi.fn(() => 0),
}));

vi.mock('@/lib/services/currencyService', () => ({
    currencyService: {
        convertPrice: vi.fn().mockResolvedValue({ convertedPrice: 50 }),
    },
}));

vi.mock('@/lib/shipping/dhl-service', () => ({
    DHLShippingService: {
        getShippingRate: vi.fn().mockResolvedValue(null),
    },
    ShippingTierUtility: {
        determineTier: vi.fn(() => ({ length: 20, width: 20, height: 10 })),
        getShippingTierByWeight: vi.fn(() => ({ length: 20, width: 20, height: 10 })),
    },
}));

vi.mock('@/lib/shipping/terminal-africa-service', () => ({
    TerminalAfricaService: {},
}));

// ---------------------------------------------------------------------------
// Mock Product
// ---------------------------------------------------------------------------

const MOCK_PRODUCT = {
    product_id: 'prod-abc',
    tailor_id: 'tailor-1',
    title: 'Test Shirt',
    description: 'A test shirt',
    images: ['https://example.com/img.jpg'],
    price: { amount: 50, currency: 'USD' },
    discount: 0,
    rtwOptions: { sizes: ['M'] },
    tailor: 'Test Tailor',
    vendor: { name: 'Test Tailor' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderComponent()
{
    const { ManualOrderProcessor } = await import('@/components/admin/ManualOrderProcessor');
    return render(<ManualOrderProcessor />);
}

async function lookupProduct(productId: string = 'prod-abc')
{
    const input = screen.getByPlaceholderText('Enter Product ID to auto-fill');
    fireEvent.change(input, { target: { value: productId } });

    // The lookup button is the sibling button in the same flex container as the input.
    // It has no text label — only a Search icon.
    // Walk up the DOM from the input to find the nearest ancestor that also contains a button.
    let lookupButton: HTMLButtonElement | null = null;
    let node: HTMLElement | null = input.parentElement;
    while (node)
    {
        const btn = node.querySelector('button');
        if (btn)
        {
            lookupButton = btn as HTMLButtonElement;
            break;
        }
        node = node.parentElement;
    }

    if (!lookupButton) throw new Error('Could not find lookup button');
    await act(async () =>
    {
        fireEvent.click(lookupButton!);
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 1: Bug Condition — Unique Product Entries and Visual Representation', () =>
{
    beforeEach(async () =>
    {
        vi.clearAllMocks();

        // Re-apply the mock product for each test
        const { productRepository } = await import('@/lib/firestore');
        (productRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PRODUCT);
    });

    // -------------------------------------------------------------------------
    // Test 1: No visual row after single lookup
    // -------------------------------------------------------------------------
    it('Test 1: renders a visible item row with the product title after a single lookup', async () =>
    {
        // EXPECTED (fixed) behavior: a row with "Test Shirt" appears in the DOM
        // ACTUAL (unfixed) behavior: no row is rendered — only the JSON textarea updates
        // This test WILL FAIL on unfixed code

        await renderComponent();
        await lookupProduct('prod-abc');

        await waitFor(
            () =>
            {
                expect(screen.getByText('Test Shirt')).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // -------------------------------------------------------------------------
    // Test 2: Deduplication — same product looked up twice
    // -------------------------------------------------------------------------
    it('Test 2: looking up the same product twice renders exactly 1 item row (not 2)', async () =>
    {
        // EXPECTED (fixed) behavior: one row with quantity=2
        // ACTUAL (unfixed) behavior: two duplicate rows (or two entries in manualItems)
        // This test WILL FAIL on unfixed code

        await renderComponent();

        await lookupProduct('prod-abc');
        await lookupProduct('prod-abc');

        await waitFor(
            () =>
            {
                // There should be exactly one row showing the product title
                const rows = screen.getAllByText('Test Shirt');
                expect(rows).toHaveLength(1);
            },
            { timeout: 3000 },
        );
    });

    // -------------------------------------------------------------------------
    // Test 3: Quantity input exists per row
    // -------------------------------------------------------------------------
    it('Test 3: a numeric quantity input control exists after a product is looked up', async () =>
    {
        // EXPECTED (fixed) behavior: an <input type="number"> quantity stepper is rendered per item
        // ACTUAL (unfixed) behavior: no such input exists in the DOM
        // This test WILL FAIL on unfixed code

        await renderComponent();
        await lookupProduct('prod-abc');

        await waitFor(
            () =>
            {
                const quantityInputs = document.querySelectorAll('input[type="number"]');
                // There should be at least one quantity input for the item row
                // (shippingFee and tax inputs are type="number" too, but they exist before lookup;
                //  the item row quantity input is added only after lookup)
                const itemQuantityInput = Array.from(quantityInputs).find((el) =>
                {
                    const val = (el as HTMLInputElement).value;
                    // Item quantity starts at 1; shippingFee starts at 0, tax starts at 0
                    return val === '1';
                });
                expect(itemQuantityInput).toBeDefined();
            },
            { timeout: 3000 },
        );
    });

    // -------------------------------------------------------------------------
    // Test 4: Remove button exists per row
    // -------------------------------------------------------------------------
    it('Test 4: a remove button exists for the item row after a product is looked up', async () =>
    {
        // EXPECTED (fixed) behavior: a remove/delete button is rendered per item row
        // ACTUAL (unfixed) behavior: no remove button exists in the DOM
        // This test WILL FAIL on unfixed code

        await renderComponent();
        await lookupProduct('prod-abc');

        await waitFor(
            () =>
            {
                // Look for a button with aria-label containing "remove" (case-insensitive),
                // or any button that appears inside the item row area.
                const removeButton =
                    screen.queryByRole('button', { name: /remove/i }) ||
                    screen.queryByLabelText(/remove/i) ||
                    screen.queryByTitle(/remove/i);

                expect(removeButton).not.toBeNull();
            },
            { timeout: 3000 },
        );
    });
});

/*
 * ---------------------------------------------------------------------------
 * FAILURE OUTPUT (documented after running on unfixed code)
 * ---------------------------------------------------------------------------
 *
 * Test 1 FAILED (TestingLibraryElementError):
 *   Unable to find an element with the text: Test Shirt
 *   The component only updates the JSON textarea — no visual item row is rendered.
 *   Counterexample: After fetchProduct('prod-abc') resolves, manualItems = [{ product_id: 'prod-abc', title: 'Test Shirt', ... }]
 *   but the DOM contains no element displaying "Test Shirt" outside the JSON textarea.
 *
 * Test 2 FAILED (TestingLibraryElementError):
 *   Unable to find an element with the text: Test Shirt
 *   No rows rendered at all — deduplication is irrelevant because the item list JSX doesn't exist.
 *   Counterexample: manualItems after two lookups of 'prod-abc' = [
 *     { product_id: 'prod-abc', quantity: 1, ... },
 *     { product_id: 'prod-abc', quantity: 1, ... }   <-- duplicate entry instead of quantity: 2
 *   ]
 *
 * Test 3 FAILED (AssertionError: expected undefined not to be undefined):
 *   No <input type="number"> with value "1" found — only shippingFee (value "0") and tax (value "0")
 *   inputs exist in the DOM. No item row JSX is rendered, so no quantity stepper exists.
 *
 * Test 4 FAILED (AssertionError: expected null not to be null):
 *   No button with aria-label/title/name matching "remove" found in the DOM.
 *   No item row JSX is rendered, so no remove button exists.
 *
 * All 4 failures confirm the bugs exist in the unfixed code. This is the expected outcome.
 * ---------------------------------------------------------------------------
 */
