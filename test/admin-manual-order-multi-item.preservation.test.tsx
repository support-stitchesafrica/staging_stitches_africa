// EXPECTED OUTCOME: These tests PASS on unfixed code — they confirm baseline behavior to preserve

/**
 * Property 2: Preservation — Existing Fetch, Sync, and Submission Behavior
 *
 * These tests encode the PRESERVED (baseline) behavior of ManualOrderProcessor.
 * They are written to PASS against the current unfixed code.
 * Passing here confirms the baseline behavior that must not regress after the fix.
 *
 * Behaviors being preserved:
 *   1. fetchProduct with a new product_id builds a CartItem with correct price fields
 *   2. fetchProduct with an NGN product converts price to USD before building CartItem
 *   3. Manually editing the JSON textarea and submitting uses the edited JSON as payload
 *   4. Submitting with no items passes manualItems: undefined to the cloud function
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
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
// Hoisted mocks for httpsCallable capture
// ---------------------------------------------------------------------------

const { mockManualProcess, mockHttpsCallable } = vi.hoisted(() =>
{
    const mockManualProcess = vi.fn().mockResolvedValue({ data: { success: true } });
    const mockHttpsCallable = vi.fn().mockReturnValue(mockManualProcess);
    return { mockManualProcess, mockHttpsCallable };
});

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
        getFunctions: vi.fn().mockReturnValue({}),
        httpsCallable: mockHttpsCallable,
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

// Mock priceUtils with deterministic values so we can assert exact CartItem fields
vi.mock('@/lib/priceUtils', () => ({
    getPriceValue: vi.fn(() => 100),
    getDiscount: vi.fn(() => 10),
    getCurrency: vi.fn(() => 'USD'),
    calculateFinalPrice: vi.fn((base: number, _discount: number, _country?: string) => base * 0.9 * 1.2),
    calculateDutyAmount: vi.fn(() => 0),
    calculatePlatformCommission: vi.fn((base: number, _discount: number) => base * 0.9 * 0.2),
    getEffectiveDutyRate: vi.fn(() => 0),
}));

vi.mock('@/lib/services/currencyService', () => ({
    currencyService: {
        convertPrice: vi.fn().mockResolvedValue({ convertedPrice: 100 }),
    },
}));

// ---------------------------------------------------------------------------
// Mock Product (USD — no NGN conversion needed)
// ---------------------------------------------------------------------------

const MOCK_PRODUCT_USD = {
    product_id: 'prod-usd-001',
    tailor_id: 'tailor-1',
    title: 'USD Test Shirt',
    description: 'A USD test shirt',
    images: ['https://example.com/img.jpg'],
    price: { base: 100, currency: 'USD', discount: 10 },
    discount: 10,
    rtwOptions: { sizes: ['M'] },
    tailor: 'Test Tailor',
    vendor: { name: 'Test Tailor' },
};

const MOCK_PRODUCT_NGN = {
    product_id: 'prod-ngn-001',
    tailor_id: 'tailor-2',
    title: 'NGN Test Shirt',
    description: 'An NGN test shirt',
    images: ['https://example.com/img2.jpg'],
    price: { base: 100, currency: 'NGN', discount: 10 },
    discount: 10,
    rtwOptions: { sizes: ['L'] },
    tailor: 'NGN Tailor',
    vendor: { name: 'NGN Tailor' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderComponent()
{
    const { ManualOrderProcessor } = await import('@/components/admin/ManualOrderProcessor');
    return render(<ManualOrderProcessor />);
}

async function lookupProduct(productId: string)
{
    const input = screen.getByPlaceholderText('Enter Product ID to auto-fill');
    fireEvent.change(input, { target: { value: productId } });

    // Find the lookup button (Search icon button) in the same flex container
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

function getManualItemsTextarea(): HTMLTextAreaElement
{
    return document.getElementById('manualItems') as HTMLTextAreaElement;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 2: Preservation — Existing Fetch, Sync, and Submission Behavior', () =>
{

    beforeEach(async () =>
    {
        vi.clearAllMocks();

        // Re-apply default mock return values after clearAllMocks
        const { productRepository } = await import('@/lib/firestore');
        (productRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PRODUCT_USD);

        // Re-apply priceUtils mocks (clearAllMocks resets return values)
        const priceUtils = await import('@/lib/priceUtils');
        (priceUtils.getPriceValue as ReturnType<typeof vi.fn>).mockReturnValue(100);
        (priceUtils.getDiscount as ReturnType<typeof vi.fn>).mockReturnValue(10);
        (priceUtils.getCurrency as ReturnType<typeof vi.fn>).mockReturnValue('USD');
        (priceUtils.calculateFinalPrice as ReturnType<typeof vi.fn>).mockImplementation(
            (base: number, _discount: number, _country?: string) => base * 0.9 * 1.2
        );
        (priceUtils.calculateDutyAmount as ReturnType<typeof vi.fn>).mockReturnValue(0);
        (priceUtils.calculatePlatformCommission as ReturnType<typeof vi.fn>).mockImplementation(
            (base: number, _discount: number) => base * 0.9 * 0.2
        );

        // Re-apply currencyService mock
        const { currencyService } = await import('@/lib/services/currencyService');
        (currencyService.convertPrice as ReturnType<typeof vi.fn>).mockResolvedValue({ convertedPrice: 100 });

        // Re-apply httpsCallable mock
        mockManualProcess.mockResolvedValue({ data: { success: true } });
        mockHttpsCallable.mockReturnValue(mockManualProcess);
    });

    // -------------------------------------------------------------------------
    // Test 1: Price fields preservation for USD product
    // -------------------------------------------------------------------------
    it('Test 1: fetchProduct with a new product ID produces a CartItem with correct price fields', async () =>
    {
        /**
         * Validates: Requirements 3.1, 3.3
         *
         * For a USD product:
         *   - getPriceValue returns 100 (basePrice = 100)
         *   - getDiscount returns 10
         *   - getCurrency returns 'USD' (no NGN conversion)
         *   - sourceCurrency = 'USD'
         *   - sourcePlatformCommission = calculatePlatformCommission(100, 10) = 100 * 0.9 * 0.2 = 18
         *   - sourcePrice = calculateFinalPrice(100, 10, 'NG') = 100 * 0.9 * 1.2 = 108
         *   - price = calculateFinalPrice(100, 10, 'NG') = 108 (no address, defaults to 'NG')
         *   - dutyCharge = calculateDutyAmount(100, 10, 'NG') = 0
         *
         * This PASSES on unfixed code because fetchProduct correctly builds the CartItem.
         */
        await renderComponent();
        await lookupProduct('prod-usd-001');

        await waitFor(() =>
        {
            const textarea = getManualItemsTextarea();
            expect(textarea).not.toBeNull();
            expect(textarea.value.trim()).not.toBe('');
        }, { timeout: 3000 });

        const textarea = getManualItemsTextarea();
        const items = JSON.parse(textarea.value);

        expect(Array.isArray(items)).toBe(true);
        expect(items).toHaveLength(1);

        const item = items[0];

        // price = calculateFinalPrice(100, 10, 'NG') = 100 * 0.9 * 1.2 = 108
        expect(item.price).toBeCloseTo(108, 5);

        // dutyCharge = calculateDutyAmount(100, 10, 'NG') = 0
        expect(item.dutyCharge).toBe(0);

        // sourceCurrency = 'USD' (getCurrency returned 'USD')
        expect(item.sourceCurrency).toBe('USD');

        // sourcePlatformCommission = calculatePlatformCommission(100, 10) = 100 * 0.9 * 0.2 = 18
        expect(item.sourcePlatformCommission).toBeCloseTo(18, 5);

        // sourcePrice = calculateFinalPrice(100, 10, 'NG') = 108
        expect(item.sourcePrice).toBeCloseTo(108, 5);
    });

    // -------------------------------------------------------------------------
    // Test 2: NGN product price conversion
    // -------------------------------------------------------------------------
    it('Test 2: fetchProduct with an NGN product converts price to USD before building CartItem', async () =>
    {
        /**
         * Validates: Requirements 3.1, 3.3
         *
         * For an NGN product:
         *   - getCurrency returns 'NGN' → triggers currencyService.convertPrice
         *   - convertPrice returns { convertedPrice: 0.07 } (mocked below)
         *   - After conversion, basePrice = 0.07
         *   - price = calculateFinalPrice(0.07, 10, 'NG') = 0.07 * 0.9 * 1.2 = 0.0756
         *   - sourceCurrency = 'NGN' (captured before conversion)
         *
         * This PASSES on unfixed code because fetchProduct correctly converts NGN prices.
         */
        const { productRepository } = await import('@/lib/firestore');
        (productRepository.getById as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_PRODUCT_NGN);

        const priceUtils = await import('@/lib/priceUtils');
        (priceUtils.getCurrency as ReturnType<typeof vi.fn>).mockReturnValue('NGN');

        const { currencyService } = await import('@/lib/services/currencyService');
        (currencyService.convertPrice as ReturnType<typeof vi.fn>).mockResolvedValue({ convertedPrice: 0.07 });

        await renderComponent();
        await lookupProduct('prod-ngn-001');

        await waitFor(() =>
        {
            const textarea = getManualItemsTextarea();
            expect(textarea).not.toBeNull();
            expect(textarea.value.trim()).not.toBe('');
        }, { timeout: 3000 });

        const textarea = getManualItemsTextarea();
        const items = JSON.parse(textarea.value);

        expect(Array.isArray(items)).toBe(true);
        expect(items).toHaveLength(1);

        const item = items[0];

        // sourceCurrency must be 'NGN' (captured before conversion)
        expect(item.sourceCurrency).toBe('NGN');

        // After conversion, basePrice = 0.07
        // price = calculateFinalPrice(0.07, 10, 'NG') = 0.07 * 0.9 * 1.2 = 0.0756
        expect(item.price).toBeCloseTo(0.07 * 0.9 * 1.2, 5);

        // currencyService.convertPrice must have been called with (100, 'NGN', 'USD')
        expect(currencyService.convertPrice).toHaveBeenCalledWith(100, 'NGN', 'USD');
    });

    // -------------------------------------------------------------------------
    // Test 3: Manual JSON edit on submit uses edited JSON
    // -------------------------------------------------------------------------
    it('Test 3: manually editing the JSON textarea and submitting uses the edited JSON as payload', async () =>
    {
        /**
         * Validates: Requirements 3.2, 3.5
         *
         * The divergence-detection logic in handleSubmit:
         *   if (manualItemsJson.trim() && manualItemsJson !== JSON.stringify(manualItems, null, 2))
         *     items = JSON.parse(manualItemsJson)
         *
         * When the admin edits the textarea to a different JSON array, the payload
         * must use the edited JSON items, not the state array.
         *
         * This PASSES on unfixed code because the divergence-detection logic works correctly.
         */
        await renderComponent();

        // Lookup a product so manualItems has one item
        await lookupProduct('prod-usd-001');

        await waitFor(() =>
        {
            const textarea = getManualItemsTextarea();
            expect(textarea.value.trim()).not.toBe('');
        }, { timeout: 3000 });

        // Manually edit the textarea to a different JSON array
        const editedItems = [
            {
                product_id: 'manually-edited-product',
                title: 'Manually Edited Item',
                price: 999,
                quantity: 3,
            },
        ];
        const editedJson = JSON.stringify(editedItems, null, 2);

        const textarea = getManualItemsTextarea();
        fireEvent.change(textarea, { target: { value: editedJson } });

        // Fill in required fields before submitting
        const userIdInput = screen.getByPlaceholderText('User UID');
        fireEvent.change(userIdInput, { target: { value: 'test-user-123' } });

        const shippingFeeInput = document.getElementById('shippingFee') as HTMLInputElement;
        fireEvent.change(shippingFeeInput, { target: { value: '10' } });

        const deliveryDateInput = document.getElementById('deliveryDate') as HTMLInputElement;
        fireEvent.change(deliveryDateInput, { target: { value: '2025-12-31' } });

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create order/i });
        await act(async () =>
        {
            fireEvent.click(submitButton);
        });

        // Wait for the cloud function to be called
        await waitFor(() =>
        {
            expect(mockManualProcess).toHaveBeenCalled();
        }, { timeout: 3000 });

        // The payload must use the edited JSON items, not the state array
        const callArgs = mockManualProcess.mock.calls[0][0];
        expect(callArgs.manualItems).toBeDefined();
        expect(callArgs.manualItems).toHaveLength(1);
        expect(callArgs.manualItems[0].product_id).toBe('manually-edited-product');
        expect(callArgs.manualItems[0].title).toBe('Manually Edited Item');
        expect(callArgs.manualItems[0].price).toBe(999);
    });

    // -------------------------------------------------------------------------
    // Test 4: Empty items submission passes manualItems: undefined
    // -------------------------------------------------------------------------
    it('Test 4: submitting with no items passes manualItems: undefined to the cloud function', async () =>
    {
        /**
         * Validates: Requirements 3.4, 3.5
         *
         * When no products have been looked up (manualItems is empty []),
         * handleSubmit builds the payload with:
         *   manualItems: items.length > 0 ? items : undefined
         * So manualItems must be undefined (not an empty array).
         *
         * This PASSES on unfixed code because the ternary in handleSubmit is correct.
         */
        await renderComponent();

        // Do NOT look up any product — manualItems stays empty

        // Fill in required fields
        const userIdInput = screen.getByPlaceholderText('User UID');
        fireEvent.change(userIdInput, { target: { value: 'test-user-456' } });

        const shippingFeeInput = document.getElementById('shippingFee') as HTMLInputElement;
        fireEvent.change(shippingFeeInput, { target: { value: '5' } });

        const deliveryDateInput = document.getElementById('deliveryDate') as HTMLInputElement;
        fireEvent.change(deliveryDateInput, { target: { value: '2025-12-31' } });

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create order/i });
        await act(async () =>
        {
            fireEvent.click(submitButton);
        });

        // Wait for the cloud function to be called
        await waitFor(() =>
        {
            expect(mockManualProcess).toHaveBeenCalled();
        }, { timeout: 3000 });

        // manualItems must be undefined (not an empty array)
        const callArgs = mockManualProcess.mock.calls[0][0];
        expect(callArgs.manualItems).toBeUndefined();
    });
});
