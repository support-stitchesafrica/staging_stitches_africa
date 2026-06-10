'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DimensionEstimate } from '@/lib/ai/estimateDimensions';

export interface AIDimensionCardProps
{
    status: 'idle' | 'loading' | 'success' | 'error' | 'accepted' | 'editing';
    estimate: DimensionEstimate | null;
    error: string | null;
    onAccept: () => void;
    onEdit: () => void;
    onEditChange: (values: Partial<DimensionEstimate>) => void;
    onEditSubmit: () => void;
    onEditCancel?: () => void;
    editedValues?: Partial<DimensionEstimate>;
}

function ConfidenceBadge({ score }: { score: number })
{
    const isGreen = score >= 0.8;
    const label = `${Math.round(score * 100)}% confidence`;
    return (
        <Badge
            className={
                isGreen
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
            }
            variant="outline"
        >
            {label}
        </Badge>
    );
}

function DimensionRow({ label, value }: { label: string; value: string })
{
    return (
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

/** e.g. 4.8 kg instead of 4.800 kg */
function formatWeightKg(kg: number): string
{
    if (!Number.isFinite(kg)) return '—';
    return new Intl.NumberFormat('en', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(kg);
}

export function AIDimensionCard({
    status,
    estimate,
    error,
    onAccept,
    onEdit,
    onEditChange,
    onEditSubmit,
    onEditCancel,
    editedValues = {},
}: AIDimensionCardProps)
{
    if (status === 'idle')
    {
        return (
            <p className="text-xs text-muted-foreground italic">
                AI will estimate dimensions once you add a title, description, or images.
            </p>
        );
    }

    return (
        <Card className="border border-dashed">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Dimension Estimate</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Loading */}
                {status === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg
                            className="animate-spin h-4 w-4 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Generating shipping dimensions...
                    </div>
                )}

                {/* Success */}
                {status === 'success' && estimate && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground capitalize">
                                Category: {estimate.matchedCategory}
                            </span>
                            <ConfidenceBadge score={estimate.confidenceScore} />
                        </div>

                        {estimate.confidenceScore < 0.5 && (
                            <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
                                Low confidence estimate — please review and confirm or edit these values before accepting.
                            </div>
                        )}

                        <div className="space-y-1">
                            <DimensionRow label="Length" value={`${estimate.lengthCm} cm`} />
                            <DimensionRow label="Width" value={`${estimate.widthCm} cm`} />
                            <DimensionRow label="Height" value={`${estimate.heightCm} cm`} />
                            <DimensionRow label="Actual weight" value={`${formatWeightKg(estimate.actualWeightKg)} kg`} />
                            <DimensionRow label="Volumetric weight" value={`${formatWeightKg(estimate.volumetricWeight)} kg`} />
                            <DimensionRow label="Chargeable weight" value={`${formatWeightKg(estimate.chargeableWeight)} kg`} />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={onAccept}>
                                Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={onEdit}>
                                Edit
                            </Button>
                        </div>
                    </>
                )}

                {/* Accepted */}
                {status === 'accepted' && (
                    <p className="text-sm text-green-700 font-medium">Dimensions applied ✓</p>
                )}

                {/* Editing */}
                {status === 'editing' && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Length (cm)</label>
                                <Input
                                    type="number"
                                    value={editedValues.lengthCm ?? ''}
                                    onChange={(e) => onEditChange({ lengthCm: parseFloat(e.target.value) })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Width (cm)</label>
                                <Input
                                    type="number"
                                    value={editedValues.widthCm ?? ''}
                                    onChange={(e) => onEditChange({ widthCm: parseFloat(e.target.value) })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Height (cm)</label>
                                <Input
                                    type="number"
                                    value={editedValues.heightCm ?? ''}
                                    onChange={(e) => onEditChange({ heightCm: parseFloat(e.target.value) })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Weight (kg)</label>
                                <Input
                                    type="number"
                                    value={editedValues.actualWeightKg ?? ''}
                                    onChange={(e) => onEditChange({ actualWeightKg: parseFloat(e.target.value) })}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={onEditSubmit}>
                                Save
                            </Button>
                            {onEditCancel && (
                                <Button size="sm" variant="outline" onClick={onEditCancel}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div className="space-y-1">
                        <p className="text-sm text-destructive">
                            {error ?? 'Failed to generate dimensions.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Please fill in the shipping dimensions manually below.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
