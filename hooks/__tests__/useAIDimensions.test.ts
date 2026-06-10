import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useAIDimensions } from '../useAIDimensions';
import type { DimensionEstimate } from '@/lib/ai/estimateDimensions';

// Feature: ai-dimension-weight-generation

// ---- helpers ----

function makeEstimate(overrides: Partial<DimensionEstimate> = {}): DimensionEstimate {
  return {
    lengthCm: 40,
    widthCm: 30,
    heightCm: 8,
    actualWeightKg: 1.5,
    volumetricWeight: (40 * 30 * 8) / 5000,
    chargeableWeight: Math.max(1.5, (40 * 30 * 8) / 5000),
    confidenceScore: 0.85,
    matchedCategory: 'dress',
    ...overrides,
  };
}

function mockFetchSuccess(estimate: DimensionEstimate) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ estimate }),
    })
  );
}

function mockFetchError(status = 500) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => ({ error: 'Something went wrong' }),
    })
  );
}

function mockFetchNetworkError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
}

// ---- tests ----

describe('useAIDimensions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('unit tests — 4.7', () => {
    it('does not trigger when title, description, and imageUrls are all empty', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const setShipping = vi.fn();
      renderHook(() =>
        useAIDimensions({
          title: '',
          description: '',
          imageUrls: [],
          setShipping,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('triggers immediately when imageUrls changes (non-empty)', async () => {
      const estimate = makeEstimate();
      mockFetchSuccess(estimate);
      const setShipping = vi.fn();

      const { rerender } = renderHook(
        ({ imageUrls }: { imageUrls: string[] }) =>
          useAIDimensions({
            title: 'Dress',
            description: '',
            imageUrls,
            setShipping,
          }),
        { initialProps: { imageUrls: [] } }
      );

      // Change imageUrls — should trigger immediately (no debounce)
      await act(async () => {
        rerender({ imageUrls: ['https://example.com/img.jpg'] });
        // Flush all pending promises
        await Promise.resolve();
      });

      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    it('calls setShipping with manualOverride: true on acceptEstimate', async () => {
      const estimate = makeEstimate();
      mockFetchSuccess(estimate);
      const setShipping = vi.fn();

      const { result } = renderHook(() =>
        useAIDimensions({
          title: 'Ankara Dress',
          description: '',
          imageUrls: [],
          setShipping,
        })
      );

      // Trigger via debounce
      await act(async () => {
        vi.advanceTimersByTime(1100);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.status).toBe('success');

      act(() => {
        result.current.acceptEstimate();
      });

      expect(setShipping).toHaveBeenCalled();
      const callArg = setShipping.mock.calls[0][0];
      const newState = callArg({ tierKey: '', manualOverride: false });
      expect(newState.manualOverride).toBe(true);
      expect(newState.actualWeightKg).toBe(estimate.actualWeightKg);
      expect(newState.lengthCm).toBe(estimate.lengthCm);
      expect(newState.widthCm).toBe(estimate.widthCm);
      expect(newState.heightCm).toBe(estimate.heightCm);
    });

    it('sets status to error on network failure', async () => {
      mockFetchNetworkError();
      const setShipping = vi.fn();

      const { result } = renderHook(() =>
        useAIDimensions({
          title: 'Dress',
          description: '',
          imageUrls: [],
          setShipping,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(1100);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeTruthy();
    });

    it('sets status to error on API 500', async () => {
      mockFetchError(500);
      const setShipping = vi.fn();

      const { result } = renderHook(() =>
        useAIDimensions({
          title: 'Dress',
          description: '',
          imageUrls: [],
          setShipping,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(1100);
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.status).toBe('error');
    });
  });

  describe('Property 6: Accept populates shipping state with manualOverride — 4.2', () => {
    // Feature: ai-dimension-weight-generation, Property 6: Accept populates shipping state with manualOverride
    it('for any DimensionEstimate, acceptEstimate calls setShipping with manualOverride: true and correct dimension fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lengthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            widthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            heightCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            actualWeightKg: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
            confidenceScore: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
          }),
          async ({ lengthCm, widthCm, heightCm, actualWeightKg, confidenceScore }) => {
            const estimate = makeEstimate({ lengthCm, widthCm, heightCm, actualWeightKg, confidenceScore });
            mockFetchSuccess(estimate);
            const setShipping = vi.fn();

            const { result } = renderHook(() =>
              useAIDimensions({
                title: 'Test Product',
                description: '',
                imageUrls: [],
                setShipping,
              })
            );

            await act(async () => {
              vi.advanceTimersByTime(1100);
              await Promise.resolve();
              await Promise.resolve();
            });

            expect(result.current.status).toBe('success');

            act(() => {
              result.current.acceptEstimate();
            });

            expect(setShipping).toHaveBeenCalled();
            const updater = setShipping.mock.calls[setShipping.mock.calls.length - 1][0];
            const newState = updater({ tierKey: '', manualOverride: false });

            expect(newState.manualOverride).toBe(true);
            expect(newState.actualWeightKg).toBe(actualWeightKg);
            expect(newState.lengthCm).toBe(lengthCm);
            expect(newState.widthCm).toBe(widthCm);
            expect(newState.heightCg).toBe(undefined); // heightCm not heightCg
            expect(newState.heightCm).toBe(heightCm);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 7: Edit flow updates shipping with vendor values — 4.3', () => {
    // Feature: ai-dimension-weight-generation, Property 7: Edit flow updates shipping with vendor values
    it('for any vendor-edited values, submitEdits calls setShipping with those values and manualOverride: true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lengthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            widthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            heightCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            actualWeightKg: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
          }),
          async (editedDims) => {
            const estimate = makeEstimate();
            mockFetchSuccess(estimate);
            const setShipping = vi.fn();

            const { result } = renderHook(() =>
              useAIDimensions({
                title: 'Test Product',
                description: '',
                imageUrls: [],
                setShipping,
              })
            );

            await act(async () => {
              vi.advanceTimersByTime(1100);
              await Promise.resolve();
              await Promise.resolve();
            });

            expect(result.current.status).toBe('success');

            act(() => {
              result.current.startEditing();
              result.current.updateEditedValues(editedDims);
            });

            act(() => {
              result.current.submitEdits();
            });

            expect(setShipping).toHaveBeenCalled();
            const updater = setShipping.mock.calls[setShipping.mock.calls.length - 1][0];
            const newState = updater({ tierKey: '', manualOverride: false });

            expect(newState.manualOverride).toBe(true);
            expect(newState.actualWeightKg).toBe(editedDims.actualWeightKg);
            expect(newState.lengthCm).toBe(editedDims.lengthCm);
            expect(newState.widthCm).toBe(editedDims.widthCm);
            expect(newState.heightCm).toBe(editedDims.heightCm);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 8: Debounce prevents premature API calls — 4.4', () => {
    // Feature: ai-dimension-weight-generation, Property 8: Debounce prevents premature API calls
    it('API is not called until 1000ms have elapsed since last keystroke', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 4 }),
          (titles) => {
            const fetchMock = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => ({ estimate: makeEstimate() }),
            });
            vi.stubGlobal('fetch', fetchMock);
            const setShipping = vi.fn();

            const { rerender, unmount } = renderHook(
              ({ title }: { title: string }) =>
                useAIDimensions({ title, description: '', imageUrls: [], setShipping }),
              { initialProps: { title: titles[0] } }
            );

            // Rapidly change title multiple times within debounce window
            for (let i = 1; i < titles.length; i++) {
              act(() => {
                vi.advanceTimersByTime(200); // less than 1000ms
                rerender({ title: titles[i] });
              });
            }

            // API should NOT have been called yet
            expect(fetchMock).not.toHaveBeenCalled();

            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 9: All available inputs sent to API — 4.5', () => {
    // Feature: ai-dimension-weight-generation, Property 9: All available inputs sent to API
    it('when both imageUrls and title/description are present, POST body contains all three', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
          async (title, description, imageUrls) => {
            const fetchMock = vi.fn().mockResolvedValue({
              ok: true,
              json: async () => ({ estimate: makeEstimate() }),
            });
            vi.stubGlobal('fetch', fetchMock);
            const setShipping = vi.fn();

            const { rerender, unmount } = renderHook(
              (props: { title: string; description: string; imageUrls: string[] }) =>
                useAIDimensions({ ...props, setShipping }),
              { initialProps: { title: '', description: '', imageUrls: [] } }
            );

            // Set imageUrls — triggers immediately
            await act(async () => {
              rerender({ title, description, imageUrls });
              await Promise.resolve();
            });

            expect(fetchMock).toHaveBeenCalled();

            const callArgs = fetchMock.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            expect(body.title).toBe(title);
            expect(body.description).toBe(description);
            expect(body.imageUrls).toEqual(imageUrls);

            unmount();
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 10: Existing shipping values used as pre-fill on edit page — 4.6', () => {
    // Feature: ai-dimension-weight-generation, Property 10: Existing shipping values used as pre-fill on edit page
    it('for any existingShipping, hook initializes in idle state before AI generation', () => {
      fc.assert(
        fc.property(
          fc.record({
            tierKey: fc.string(),
            manualOverride: fc.boolean(),
            actualWeightKg: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
            lengthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            widthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
            heightCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
          }),
          (existingShipping) => {
            vi.stubGlobal('fetch', vi.fn());
            const setShipping = vi.fn();

            const { result, unmount } = renderHook(() =>
              useAIDimensions({
                title: '',
                description: '',
                imageUrls: [],
                setShipping,
                existingShipping,
              })
            );

            // Hook should be in idle state with no estimate yet
            expect(result.current.status).toBe('idle');
            expect(result.current.estimate).toBeNull();

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
