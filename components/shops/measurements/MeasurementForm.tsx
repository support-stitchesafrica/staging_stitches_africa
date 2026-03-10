'use client';

import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileRepository } from '@/lib/firestore';
import { useMeasurements } from '@/hooks/useMeasurements';
import { measurementFields, measurementCategories, UserMeasurements } from '@/types/measurements';
import { Ruler, Save, Info, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface MeasurementFormProps
{
    onComplete?: () => void;
    onSkip?: () => void;
    showSkipOption?: boolean;
}

const MeasurementFormComponent: React.FC<MeasurementFormProps> = ({
    onComplete,
    onSkip,
    showSkipOption = false
}) =>
{
    const { user } = useAuth();
    const { measurements: existingMeasurements, loading: measurementsLoading, saveMeasurements } = useMeasurements();
    const [measurements, setMeasurements] = useState<Partial<UserMeasurements['volume_params']>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['chest', 'waist', 'hips']));
    const [hasExistingMeasurements, setHasExistingMeasurements] = useState(false);

    useEffect(() =>
    {
        if (existingMeasurements?.volume_params)
        {
            setMeasurements(existingMeasurements.volume_params);
            setHasExistingMeasurements(true);
        }
    }, [existingMeasurements]);

    const handleInputChange = (field: string, value: string) =>
    {
        const numValue = parseFloat(value);

        setMeasurements(prev => ({
            ...prev,
            [field]: isNaN(numValue) ? 0 : numValue
        }));

        // Clear error when user starts typing
        if (errors[field])
        {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const toggleCategory = (category: string) =>
    {
        setExpandedCategories(prev =>
        {
            const newSet = new Set(prev);
            if (newSet.has(category))
            {
                newSet.delete(category);
            } else
            {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const validateMeasurements = (): boolean =>
    {
        const newErrors: Record<string, string> = {};

        measurementFields.forEach(field =>
        {
            const value = measurements[field.key];
            if (value !== undefined && value > 0)
            {
                if (value < field.min || value > field.max)
                {
                    newErrors[field.key] = `${field.label} must be between ${field.min} and ${field.max} ${field.unit}`;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () =>
    {
        if (!user) return;

        if (!validateMeasurements())
        {
            return;
        }

        setSaving(true);
        try
        {
            // Save measurements using the hook
            await saveMeasurements(measurements);

            // Mark measurements as completed in user profile
            await userProfileRepository.markMeasurementsCompleted(user.uid);

            onComplete?.();
        } catch (error)
        {
            console.error('Error saving measurements:', error);
            alert('Failed to save measurements. Please try again.');
        } finally
        {
            setSaving(false);
        }
    };

    const handleSkip = async () =>
    {
        if (!user) return;

        setSaving(true);
        try
        {
            // Use dedicated skip measurements method which sets skipMeasurements preference
            // and marks onboarding as completed (Requirement 3.3)
            await userProfileRepository.skipMeasurements(user.uid);

            // Call the onSkip handler if provided, otherwise fall back to onComplete
            if (onSkip)
            {
                onSkip();
            } else
            {
                onComplete?.();
            }
        } catch (error)
        {
            console.error('Error skipping measurements:', error);
            alert('Failed to skip measurements. Please try again.');
        } finally
        {
            setSaving(false);
        }
    };

    if (loading || measurementsLoading)
    {
        return (
            <div className="container-responsive max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="animate-pulse space-y-4 sm:space-y-6">
                    <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3 mx-auto"></div>
                    <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div key={index} className="space-y-2 sm:space-y-3">
                                <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-12 sm:h-14 bg-gray-200 rounded"></div>
                                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-responsive max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="mb-6 sm:mb-8 text-center">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <Ruler size={28} className="text-primary-600 sm:w-8 sm:h-8" />
                </div>
                <h1 className="heading-responsive font-bold text-gray-900 mb-2 sm:mb-3">
                    {hasExistingMeasurements ? 'Update Your Measurements' : 'Your Measurements'}
                </h1>
                <p className="text-responsive text-gray-600 max-w-2xl mx-auto px-2">
                    {hasExistingMeasurements
                        ? 'Update your body measurements to ensure the perfect fit for bespoke items.'
                        : 'Add your body measurements to get the perfect fit for bespoke items. All measurements are optional and can be updated anytime.'
                    }
                </p>
                {showSkipOption && (
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg mx-2 sm:mx-0">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0 sm:w-5 sm:h-5" />
                            <div className="text-left">
                                <p className="text-sm sm:text-base font-medium text-blue-900 mb-1">Optional Step</p>
                                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                                    You can skip this step and add measurements later from your account page.
                                    Skipping will complete your account setup and take you directly to the main application.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
                <div className="space-y-6">
                    {Object.entries(measurementCategories).map(([categoryKey, category]) =>
                    {
                        const categoryFields = measurementFields.filter(field => field.category === categoryKey);
                        const isExpanded = expandedCategories.has(categoryKey);

                        return (
                            <div key={categoryKey} className="border border-gray-200 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(categoryKey)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{category.icon}</span>
                                        <h3 className="text-lg font-semibold text-gray-300">{category.label}</h3>
                                        <span className="text-sm text-gray-500">({categoryFields.length} measurements)</span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>

                                {isExpanded && (
                                    <div className="p-4 pt-0 border-t border-gray-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            {categoryFields.map((field) => (
                                                <div key={field.key} className="space-y-2 sm:space-y-3">
                                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                                        <label
                                                            htmlFor={field.key}
                                                            className="block text-sm sm:text-base font-medium text-gray-700 flex-1"
                                                        >
                                                            {field.label}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onMouseEnter={() => setShowTooltip(field.key)}
                                                            onMouseLeave={() => setShowTooltip(null)}
                                                            onTouchStart={() => setShowTooltip(field.key)}
                                                            onTouchEnd={() => setTimeout(() => setShowTooltip(null), 2000)}
                                                            className="relative text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                                                            aria-label={`Information about ${field.label} measurement`}
                                                        >
                                                            <Info size={16} className="sm:w-5 sm:h-5" />
                                                            {showTooltip === field.key && (
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-lg whitespace-nowrap z-10 max-w-xs sm:max-w-none">
                                                                    {field.description}
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            id={field.key}
                                                            min={field.min}
                                                            max={field.max}
                                                            step="0.5"
                                                            value={measurements[field.key] || ''}
                                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                            className={`w-full px-3 sm:px-4 py-3 sm:py-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-16 sm:pr-20 text-base sm:text-lg min-h-[44px] touch-manipulation ${errors[field.key] ? 'border-red-300' : 'border-gray-300'
                                                                }`}
                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                        />
                                                        <span className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-sm sm:text-base text-gray-500 pointer-events-none">
                                                            {field.unit}
                                                        </span>
                                                    </div>

                                                    {errors[field.key] && (
                                                        <p className="text-sm sm:text-base text-red-600 px-1">{errors[field.key]}</p>
                                                    )}

                                                    <p className="text-xs sm:text-sm text-gray-500 px-1">
                                                        Range: {field.min}-{field.max} {field.unit}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-0">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center space-x-2 sm:space-x-3 bg-primary-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] text-base sm:text-lg touch-manipulation w-full sm:w-auto"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} className="sm:w-5 sm:h-5" />
                                <span>{hasExistingMeasurements ? 'Update Measurements' : 'Save Measurements'}</span>
                            </>
                        )}
                    </button>

                    {showSkipOption && (
                        <button
                            onClick={handleSkip}
                            disabled={saving}
                            className="flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary-200 text-primary-700 bg-primary-50 rounded-lg font-semibold hover:bg-primary-100 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] text-base sm:text-lg touch-manipulation w-full sm:w-auto"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary-700"></div>
                                    <span>Completing Onboarding...</span>
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                                    <span>Skip & Complete Setup</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-blue-50 rounded-lg mx-2 sm:mx-0">
                    <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2 sm:mb-3">Measurement Tips:</h3>
                    <ul className="text-sm sm:text-base text-blue-800 space-y-1 sm:space-y-2 leading-relaxed">
                        <li>• Use a flexible measuring tape for accurate results</li>
                        <li>• Measure over light clothing or undergarments</li>
                        <li>• Stand straight and relax your muscles</li>
                        <li>• Ask someone to help you measure for better accuracy</li>
                        <li>• All measurements should be in inches</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

// Memoize MeasurementForm to prevent unnecessary re-renders
export const MeasurementForm = memo(MeasurementFormComponent);