'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BannerUpload } from '@/components/promotionals/banner/BannerUpload';
import { BannerForm, BannerFormData } from '@/components/promotionals/banner/BannerForm';
import { BannerPreview } from '@/components/promotionals/banner/BannerPreview';
import { BannerService } from '@/lib/promotionals/banner-service';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import { PromotionalEvent } from '@/types/promotionals';

export default function BannerPage()
{
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const { promotionalUser } = usePromotionalsAuth();

    const [event, setEvent] = useState<PromotionalEvent | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [bannerData, setBannerData] = useState<BannerFormData>({
        title: '',
        description: '',
        displayPercentage: 0,
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load event data
    useEffect(() =>
    {
        const loadEvent = async () =>
        {
            try
            {
                setLoading(true);
                const eventData = await PromotionalEventService.getEventById(eventId);
                setEvent(eventData);

                // Load existing banner data if available
                if (eventData.banner)
                {
                    setBannerData({
                        title: eventData.banner.title || '',
                        description: eventData.banner.description || '',
                        displayPercentage: eventData.banner.displayPercentage || 0,
                    });
                    setPreviewUrl(eventData.banner.imageUrl);
                }
            } catch (error: any)
            {
                console.error('Error loading event:', error);
                toast.error(error.message || 'Failed to load event');
                router.push('/promotionals');
            } finally
            {
                setLoading(false);
            }
        };

        if (eventId)
        {
            loadEvent();
        }
    }, [eventId, router]);

    // Handle file selection
    const handleFileSelect = (file: File) =>
    {
        setSelectedFile(file);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () =>
        {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Handle form data change
    const handleDataChange = (data: BannerFormData) =>
    {
        setBannerData(data);
    };

    // Validate form
    const validateForm = (): boolean =>
    {
        if (!previewUrl)
        {
            toast.error('Please upload a banner image');
            return false;
        }

        if (bannerData.displayPercentage < 0 || bannerData.displayPercentage > 100)
        {
            toast.error('Display percentage must be between 0 and 100');
            return false;
        }

        return true;
    };

    // Handle save
    const handleSave = async () =>
    {
        if (!validateForm()) return;

        try
        {
            setSaving(true);

            if (selectedFile)
            {
                // Upload new image and update banner
                await BannerService.uploadAndUpdateBanner(eventId, selectedFile, bannerData);
                toast.success('Banner uploaded successfully!');
            } else if (event?.banner)
            {
                // Update existing banner metadata only
                await BannerService.updateBanner(eventId, {
                    ...bannerData,
                    imageUrl: event.banner.imageUrl,
                });
                toast.success('Banner updated successfully!');
            }

            // Reload event data
            const updatedEvent = await PromotionalEventService.getEventById(eventId);
            setEvent(updatedEvent);
            setSelectedFile(null);
        } catch (error: any)
        {
            console.error('Error saving banner:', error);
            toast.error(error.message || 'Failed to save banner');
        } finally
        {
            setSaving(false);
        }
    };

    // Handle save and publish
    const handleSaveAndPublish = async () =>
    {
        if (!validateForm()) return;

        try
        {
            setSaving(true);

            // Save banner first
            if (selectedFile)
            {
                await BannerService.uploadAndUpdateBanner(eventId, selectedFile, bannerData);
            } else if (event?.banner)
            {
                await BannerService.updateBanner(eventId, {
                    ...bannerData,
                    imageUrl: event.banner.imageUrl,
                });
            }

            // Publish event
            await PromotionalEventService.publishEvent(eventId);

            toast.success('Banner saved and event published successfully!');
            router.push(`/promotionals/${eventId}`);
        } catch (error: any)
        {
            console.error('Error saving and publishing:', error);
            toast.error(error.message || 'Failed to save and publish');
        } finally
        {
            setSaving(false);
        }
    };

    if (loading)
    {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!event)
    {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/promotionals/${eventId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Event
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create Banner</h1>
                            <p className="text-gray-600 mt-1">
                                Upload a promotional banner for <span className="font-medium">{event.name}</span>
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            {showPreview ? 'Hide' : 'Show'} Preview
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Upload & Form */}
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <BannerUpload
                                onFileSelect={handleFileSelect}
                                currentImageUrl={event.banner?.imageUrl}
                                disabled={saving}
                            />
                        </div>

                        {/* Form Section */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Banner Details
                            </h2>
                            <BannerForm
                                initialData={bannerData}
                                onDataChange={handleDataChange}
                                disabled={saving}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving || !previewUrl}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Banner
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleSaveAndPublish}
                                disabled={saving || !previewUrl}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    'Save & Publish Event'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Preview */}
                    {showPreview && previewUrl && (
                        <div className="lg:sticky lg:top-8 h-fit">
                            <BannerPreview
                                imageUrl={previewUrl}
                                title={bannerData.title}
                                description={bannerData.description}
                                displayPercentage={bannerData.displayPercentage}
                                eventName={event.name}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
