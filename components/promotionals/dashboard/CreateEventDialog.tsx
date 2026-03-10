'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import { Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateEventDialogProps
{
    isOpen: boolean;
    onClose: () => void;
}

export function CreateEventDialog({ isOpen, onClose }: CreateEventDialogProps)
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

            // Close dialog
            onClose();
        } catch (error: any)
        {
            console.error('Error creating event:', error);
            toast.error(error.message || 'Failed to create event');
        } finally
        {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () =>
    {
        if (!loading)
        {
            setFormData({ name: '', startDate: '', endDate: '' });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        Create Promotional Event
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Event Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Event Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Summer Sale 2024"
                            disabled={loading}
                            className={cn(
                                'w-full px-3 py-2 border text-black rounded-lg focus:outline-none focus:ring-2 transition-colors',
                                errors.name
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                                loading && 'opacity-50 cursor-not-allowed'
                            )}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Start Date */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
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
                                    'w-full px-3 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                                    errors.startDate
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                                    loading && 'opacity-50 cursor-not-allowed'
                                )}
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.startDate && (
                            <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
                        )}
                    </div>

                    {/* End Date */}
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
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
                                    'w-full px-3 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                                    errors.endDate
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-purple-500 focus:border-transparent',
                                    loading && 'opacity-50 cursor-not-allowed'
                                )}
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.endDate && (
                            <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            After creating the event, you'll be able to add products with discounts and create a promotional banner.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </span>
                            ) : (
                                'Create Event'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
