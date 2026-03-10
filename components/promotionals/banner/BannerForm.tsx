'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface BannerFormData
{
    title: string;
    description: string;
    displayPercentage: number;
}

interface BannerFormProps
{
    initialData?: Partial<BannerFormData>;
    onDataChange: (data: BannerFormData) => void;
    disabled?: boolean;
}

export function BannerForm({ initialData, onDataChange, disabled }: BannerFormProps)
{
    const [formData, setFormData] = useState<BannerFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        displayPercentage: initialData?.displayPercentage || 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Handle input change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) =>
    {
        const { name, value } = e.target;

        let processedValue: string | number = value;

        // Handle percentage as number
        if (name === 'displayPercentage')
        {
            processedValue = value === '' ? 0 : parseInt(value, 10);

            // Validate percentage range
            if (processedValue < 0 || processedValue > 100)
            {
                setErrors(prev => ({
                    ...prev,
                    displayPercentage: 'Percentage must be between 0 and 100',
                }));
            } else
            {
                setErrors(prev =>
                {
                    const newErrors = { ...prev };
                    delete newErrors.displayPercentage;
                    return newErrors;
                });
            }
        }

        const newData = {
            ...formData,
            [name]: processedValue,
        };

        setFormData(newData);
        onDataChange(newData);
    };

    return (
        <div className="space-y-4">
            {/* Banner Title */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Title
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Summer Sale"
                    disabled={disabled}
                    maxLength={50}
                    className={cn(
                        'w-full px-3 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                        'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {formData.title.length}/50 characters
                </p>
            </div>

            {/* Banner Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Up to 50% off on selected items"
                    disabled={disabled}
                    rows={3}
                    maxLength={150}
                    className={cn(
                        'w-full px-3 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none',
                        'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/150 characters
                </p>
            </div>

            {/* Display Percentage */}
            <div>
                <label htmlFor="displayPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Discount Percentage
                </label>
                <div className="relative">
                    <input
                        type="number"
                        id="displayPercentage"
                        name="displayPercentage"
                        value={formData.displayPercentage || ''}
                        onChange={handleChange}
                        placeholder="0"
                        disabled={disabled}
                        min="0"
                        max="100"
                        className={cn(
                            'w-full px-3 py-2 text-black pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                            errors.displayPercentage
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        %
                    </span>
                </div>
                {errors.displayPercentage ? (
                    <p className="mt-1 text-xs text-red-600">{errors.displayPercentage}</p>
                ) : (
                    <p className="mt-1 text-xs text-gray-500">
                        The primary discount percentage to display on the banner (e.g., "Up to 50% OFF")
                    </p>
                )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Use a compelling title and description to attract customers. The display percentage should reflect the maximum discount available in this promotion.
                </p>
            </div>
        </div>
    );
}
