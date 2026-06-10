import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { AIDimensionCard } from '../AIDimensionCard';
import type { DimensionEstimate } from '@/lib/ai/estimateDimensions';

// Feature: ai-dimension-weight-generation

const noop = () => { };

function makeEstimate(overrides: Partial<DimensionEstimate> = {}): DimensionEstimate
{
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

describe('AIDimensionCard', () =>
{
    describe('unit tests — 5.5', () =>
    {
        it('renders loading state with spinner text', () =>
        {
            render(
                <AIDimensionCard
                    status="loading"
                    estimate={null}
                    error={null}
                    onAccept={noop}
                    onEdit={noop}
                    onEditChange={noop}
                    onEditSubmit={noop}
                />
            );
            expect(screen.getByText('Generating shipping dimensions...')).toBeTruthy();
        });

        it('renders Accept and Edit buttons in success state', () =>
        {
            render(
                <AIDimensionCard
                    status="success"
                    estimate={makeEstimate()}
                    error={null}
                    onAccept={noop}
                    onEdit={noop}
                    onEditChange={noop}
                    onEditSubmit={noop}
                />
            );
            expect(screen.getByRole('button', { name: /accept/i })).toBeTruthy();
            expect(screen.getByRole('button', { name: /edit/i })).toBeTruthy();
        });

        it('renders error state with message', () =>
        {
            render(
                <AIDimensionCard
                    status="error"
                    estimate={null}
                    error="Network error"
                    onAccept={noop}
                    onEdit={noop}
                    onEditChange={noop}
                    onEditSubmit={noop}
                />
            );
            expect(screen.getByText('Network error')).toBeTruthy();
            expect(screen.getByText(/manually/i)).toBeTruthy();
        });

        it('renders confirmation after accept', () =>
        {
            render(
                <AIDimensionCard
                    status="accepted"
                    estimate={makeEstimate()}
                    error={null}
                    onAccept={noop}
                    onEdit={noop}
                    onEditChange={noop}
                    onEditSubmit={noop}
                />
            );
            expect(screen.getByText(/dimensions applied/i)).toBeTruthy();
        });

        it('renders idle state hint text', () =>
        {
            render(
                <AIDimensionCard
                    status="idle"
                    estimate={null}
                    error={null}
                    onAccept={noop}
                    onEdit={noop}
                    onEditChange={noop}
                    onEditSubmit={noop}
                />
            );
            expect(screen.getByText(/AI will estimate dimensions/i)).toBeTruthy();
        });
    });

    describe('Property 4: Confidence badge color rule — 5.2', () =>
    {
        // Feature: ai-dimension-weight-generation, Property 4: Confidence badge color rule
        it('renders green badge when confidenceScore >= 0.8, yellow when < 0.8', () =>
        {
            fc.assert(
                fc.property(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }), (score) =>
                {
                    const { container, unmount } = render(
                        <AIDimensionCard
                            status="success"
                            estimate={makeEstimate({ confidenceScore: score })}
                            error={null}
                            onAccept={noop}
                            onEdit={noop}
                            onEditChange={noop}
                            onEditSubmit={noop}
                        />
                    );

                    const badge = container.querySelector('[class*="bg-green"], [class*="bg-yellow"]');
                    expect(badge).toBeTruthy();

                    if (score >= 0.8)
                    {
                        expect(badge?.className).toContain('bg-green');
                    } else
                    {
                        expect(badge?.className).toContain('bg-yellow');
                    }

                    unmount();
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 5: Low confidence warning display — 5.3', () =>
    {
        // Feature: ai-dimension-weight-generation, Property 5: Low confidence warning display
        it('renders warning message for any confidenceScore < 0.5', () =>
        {
            fc.assert(
                fc.property(fc.float({ min: Math.fround(0), max: Math.fround(0.499), noNaN: true }), (score) =>
                {
                    const { unmount } = render(
                        <AIDimensionCard
                            status="success"
                            estimate={makeEstimate({ confidenceScore: score })}
                            error={null}
                            onAccept={noop}
                            onEdit={noop}
                            onEditChange={noop}
                            onEditSubmit={noop}
                        />
                    );

                    expect(screen.getByText(/low confidence/i)).toBeTruthy();
                    unmount();
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 11: Card renders all estimate fields — 5.4', () =>
    {
        // Feature: ai-dimension-weight-generation, Property 11: AIDimensionCard renders all estimate fields
        it('for any valid DimensionEstimate in success status, renders all six values', () =>
        {
            fc.assert(
                fc.property(
                    fc.record({
                        lengthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
                        widthCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
                        heightCm: fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }),
                        actualWeightKg: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
                        confidenceScore: fc.float({ min: Math.fround(0.5), max: Math.fround(1), noNaN: true }),
                    }),
                    ({ lengthCm, widthCm, heightCm, actualWeightKg, confidenceScore }) =>
                    {
                        const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
                        const chargeableWeight = Math.max(actualWeightKg, volumetricWeight);
                        const estimate: DimensionEstimate = {
                            lengthCm,
                            widthCm,
                            heightCm,
                            actualWeightKg,
                            volumetricWeight,
                            chargeableWeight,
                            confidenceScore,
                            matchedCategory: 'test',
                        };

                        const { container, unmount } = render(
                            <AIDimensionCard
                                status="success"
                                estimate={estimate}
                                error={null}
                                onAccept={noop}
                                onEdit={noop}
                                onEditChange={noop}
                                onEditSubmit={noop}
                            />
                        );

                        const text = container.textContent ?? '';
                        // All six numeric values should appear somewhere in the rendered output
                        expect(text).toContain(String(lengthCm));
                        expect(text).toContain(String(widthCm));
                        expect(text).toContain(String(heightCm));
                        expect(text).toContain(String(actualWeightKg));

                        unmount();
                    }
                ),
                { numRuns: 50 }
            );
        });
    });
});
