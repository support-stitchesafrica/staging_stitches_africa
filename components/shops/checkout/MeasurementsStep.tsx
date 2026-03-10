'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMeasurements } from '@/hooks/useMeasurements';
import { UserMeasurements, measurementFields } from '@/types/measurements';
import { Product, CartItem } from '@/types';
import { Ruler, AlertCircle, CheckCircle, Edit, Plus, Clock, ExternalLink } from 'lucide-react';

interface MeasurementsStepProps
{
    cartItems: CartItem[];
    onComplete: (measurements: UserMeasurements | null) => void;
    onBack: () => void;
}

export const MeasurementsStep: React.FC<MeasurementsStepProps> = ({
    cartItems,
    onComplete,
    onBack
}) =>
{
    const router = useRouter();
    const { user } = useAuth();
    const { measurements, loading, getRecentMeasurements } = useMeasurements();
    const [selectedMeasurements, setSelectedMeasurements] = useState<UserMeasurements | null>(null);
    const [showMeasurementForm, setShowMeasurementForm] = useState(false);

    // Check if any items in cart are bespoke
    const bespokeItems = cartItems.filter(item =>
        item.type === 'bespoke' || item.product?.type === 'bespoke'
    );

    const hasBespokeItems = bespokeItems.length > 0;

    // Get all required measurements from bespoke items
    const requiredMeasurements = React.useMemo(() =>
    {
        const allRequired = new Set<string>();
        bespokeItems.forEach(item =>
        {
            if (item.product?.bespokeOptions?.measurementsRequired)
            {
                item.product.bespokeOptions.measurementsRequired.forEach(measurement =>
                {
                    allRequired.add(measurement.toLowerCase().replace(/\s+/g, '_'));
                });
            }
        });
        return Array.from(allRequired);
    }, [bespokeItems]);

    useEffect(() =>
    {
        if (measurements)
        {
            setSelectedMeasurements(measurements);
        }
    }, [measurements]);

    // If no bespoke items, skip this step
    useEffect(() =>
    {
        if (!hasBespokeItems)
        {
            onComplete(null);
        }
    }, [hasBespokeItems, onComplete]);

    const handleUseMeasurements = async () =>
    {
        if (measurements)
        {
            setSelectedMeasurements(measurements);
            onComplete(measurements);
        }
    };

    const handleAddMeasurements = () =>
    {
        setShowMeasurementForm(true);
    };

    const handleMeasurementComplete = async () =>
    {
        // Reload measurements after form completion
        const recentMeasurements = await getRecentMeasurements();
        if (recentMeasurements)
        {
            setSelectedMeasurements(recentMeasurements);
            onComplete(recentMeasurements);
        }
        setShowMeasurementForm(false);
    };

    const checkMeasurementCoverage = () =>
    {
        if (!measurements?.volume_params) return { covered: 0, total: requiredMeasurements.length };

        let covered = 0;
        requiredMeasurements.forEach(required =>
        {
            const measurementKey = required as keyof UserMeasurements['volume_params'];
            if (measurements.volume_params[measurementKey] && measurements.volume_params[measurementKey] > 0)
            {
                covered++;
            }
        });

        return { covered, total: requiredMeasurements.length };
    };

    const coverage = checkMeasurementCoverage();
    const isComplete = coverage.covered === coverage.total && coverage.total > 0;

    /**
     * Format measurement age for display
     */
    const formatMeasurementAge = (updatedAt: Date): string =>
    {
        const now = new Date();
        const diffMs = now.getTime() - updatedAt.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Updated today';
        if (diffDays === 1) return 'Updated yesterday';
        if (diffDays < 7) return `Updated ${diffDays} days ago`;
        if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)} months ago`;
        return `Updated ${Math.floor(diffDays / 365)} years ago`;
    };

    /**
     * Navigate to measurements page with return URL
     */
    const handleUpdateMeasurements = () =>
    {
        const returnUrl = encodeURIComponent('/shops/checkout');
        router.push(`/shops/measurements?redirect=${returnUrl}&from=checkout`);
    };

    if (loading)
    {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!hasBespokeItems)
    {
        return null; // Component will auto-complete via useEffect
    }

    if (showMeasurementForm)
    {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => setShowMeasurementForm(false)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                        ← Back to measurements selection
                    </button>
                </div>
                {/* Here you would render the MeasurementForm component */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-center text-gray-600">
                        Measurement form would be rendered here.
                        <br />
                        <button
                            onClick={handleMeasurementComplete}
                            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                        >
                            Complete Measurements (Demo)
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="text-center mb-8">
                <Ruler size={48} className="mx-auto text-primary-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Measurements Required
                </h2>
                <p className="text-gray-600">
                    Your cart contains bespoke (custom-made) items that require your body measurements for accurate fitting.
                </p>
            </div>

            {/* Informational Message about Bespoke Items */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-1">Why are measurements needed?</h4>
                        <p className="text-sm text-amber-800">
                            Bespoke items are custom-made specifically for you. Accurate measurements ensure your items fit perfectly and meet your expectations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bespoke Items Summary */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Bespoke Items in Your Order:</h3>
                <div className="space-y-2">
                    {bespokeItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-blue-800">{item.product?.title}</span>
                            <span className="text-sm text-blue-600">
                                (Qty: {item.quantity})
                            </span>
                        </div>
                    ))}
                </div>
                {requiredMeasurements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-sm text-blue-700">
                            <strong>Required measurements:</strong> {requiredMeasurements.join(', ')}
                        </p>
                    </div>
                )}
            </div>

            {/* Measurements Status */}
            {measurements ? (
                <div className="space-y-6">
                    {/* Existing Measurements */}
                    <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">Your Measurements</h3>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                        <Clock size={14} className="flex-shrink-0" />
                                        <span>{formatMeasurementAge(measurements.updatedAt)}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(measurements.updatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateMeasurements}
                                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
                                title="Update measurements"
                            >
                                <Edit size={16} />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        </div>

                        {/* Coverage Status */}
                        <div className="mb-4">
                            {isComplete ? (
                                <div className="flex items-center space-x-2 text-green-600">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">
                                        All required measurements available ({coverage.covered}/{coverage.total})
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2 text-amber-600">
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-medium">
                                        {coverage.covered}/{coverage.total} required measurements available
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Measurement Summary Section */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Measurement Summary</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {measurementFields.slice(0, 6).map(field =>
                                {
                                    const value = measurements.volume_params[field.key];
                                    return (
                                        <div key={field.key} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="text-xs font-medium text-gray-600 mb-1">{field.label}</div>
                                            <div className="text-lg font-semibold text-gray-900">
                                                {value && value > 0 ? `${value}"` : '—'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3 text-center">
                                <button
                                    onClick={handleUpdateMeasurements}
                                    className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                                >
                                    <span>View all measurements</span>
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Link to Update Measurements from Checkout */}
                        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Need to update your measurements?</h4>
                                    <p className="text-xs text-gray-600">
                                        You can update your measurements and return to checkout to continue your order.
                                    </p>
                                </div>
                                <button
                                    onClick={handleUpdateMeasurements}
                                    className="ml-3 flex items-center space-x-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
                                >
                                    <span>Update</span>
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleUseMeasurements}
                                disabled={!isComplete}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${isComplete
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isComplete ? 'Use These Measurements' : 'Complete Missing Measurements'}
                            </button>
                            {!isComplete && (
                                <button
                                    onClick={handleUpdateMeasurements}
                                    className="flex-1 py-3 px-4 border-2 border-primary-200 text-primary-700 bg-primary-50 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                                >
                                    Complete Measurements
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* No Measurements */
                <div className="border border-amber-300 bg-amber-50 rounded-lg p-6 text-center">
                    <AlertCircle size={48} className="mx-auto text-amber-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Measurements Found
                    </h3>
                    <p className="text-gray-700 mb-4">
                        You need to add your measurements to proceed with bespoke items in your cart.
                    </p>
                    <div className="mb-6 p-4 bg-white border border-amber-200 rounded-lg text-left">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">What happens next?</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li className="flex items-start">
                                <span className="mr-2">1.</span>
                                <span>You'll be taken to the measurements page</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">2.</span>
                                <span>Enter your body measurements</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">3.</span>
                                <span>Return to checkout to complete your order</span>
                            </li>
                        </ul>
                    </div>
                    <button
                        onClick={handleUpdateMeasurements}
                        className="flex items-center space-x-2 mx-auto bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Add Measurements Now</span>
                    </button>
                </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    Back
                </button>
                {measurements && isComplete && (
                    <button
                        onClick={handleUseMeasurements}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        Continue to Payment
                    </button>
                )}
            </div>
        </div>
    );
};