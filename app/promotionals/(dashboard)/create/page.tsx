'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import { Calendar, ArrowLeft, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CreateEventPage()
{
    const router = useRouter();
    const { promotionalUser } = usePromotionalsAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name])
        {
            setErrors(prev =>
            {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Validate form
    const validateForm = (): boolean =>
    {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim())
        {
            newErrors.name = 'Event name is required';
        }

        if (!formData.startDate)
        {
            newErrors.startDate = 'Start date is required';
        }

        if (!formData.endDate)
        {
            newErrors.endDate = 'End date is required';
        }

        if (formData.startDate && formData.endDate)
        {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            if (end <= start)
            {
                newErrors.endDate = 'End date must be after start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (!validateForm())
        {
            toast.error('Please fix the errors in the form');
            return;
        }

        if (!promotionalUser?.uid)
        {
            toast.error('You must be logged in to create an event');
            return;
        }

        try
        {
            setLoading(true);

            const event = await PromotionalEventService.createEvent({
                name: formData.name.trim(),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                createdBy: promotionalUser.uid,
            });

            toast.success('Event created successfully!');

            // Navigate to product selection page
            router.push(`/promotionals/${event.id}/products`);
        } catch (error: any)
        {
            console.error('Error creating event:', error);
            toast.error(error.message || 'Failed to create event');
        } finally
        {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/promotionals"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <Tag className="w-6 h-6 text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Create Promotional Event
                    </h1>
                </div>
                <p className="text-gray-600">
                    Set up a new promotional campaign with discounted products and custom banners
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Event Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Event Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Summer Sale 2024, Black Friday Deals"
                            disabled={loading}
                            className={cn(
                                'w-full px-4 py-3 border text-black rounded-lg focus:outline-none focus:ring-2 transition-colors text-base',
                                errors.name
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                                loading && 'opacity-50 cursor-not-allowed'
                            )}
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                            Choose a descriptive name for your promotional event
                        </p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className={cn(
                                        'w-full px-4 py-3 text-black border rounded-lg focus:outline-none focus:ring-2 transition-colors text-base',
                                        errors.startDate
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                                        loading && 'opacity-50 cursor-not-allowed'
                                    )}
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            {errors.startDate && (
                                <p className="mt-2 text-sm text-red-600">{errors.startDate}</p>
                            )}
                        </div>

                        {/* End Date */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                    min={formData.startDate || undefined}
                                    className={cn(
                                        'w-full px-4 py-3 text-black border rounded-lg focus:outline-none focus:ring-2 transition-colors text-base',
                                        errors.endDate
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                                        loading && 'opacity-50 cursor-not-allowed'
                                    )}
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                            {errors.endDate && (
                                <p className="mt-2 text-sm text-red-600">{errors.endDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                            What happens next?
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Select products and set discount percentages</li>
                            <li>• Create an eye-catching promotional banner</li>
                            <li>• Publish your event to make it live</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Link
                            href="/promotionals"
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Event...
                                </span>
                            ) : (
                                'Create Event & Add Products'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
