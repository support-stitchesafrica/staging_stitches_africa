'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CustomerPromotionalService } from '@/lib/promotionals/customer-service';
import { PromotionalEvent } from '@/types/promotionals';
import { CountdownTimer } from '@/components/promotions/CountdownTimer';
import { Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { toDate } from '@/lib/utils/timestamp-helpers';

export function PromotionalEventsBanner()
{
    const [events, setEvents] = useState<PromotionalEvent[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() =>
    {
        loadActiveEvents();
    }, []);

    const loadActiveEvents = async () =>
    {
        try
        {
            setLoading(true);
            const activeEvents = await CustomerPromotionalService.getActivePromotionalEvents();

            // Filter events with banners
            const eventsWithBanners = activeEvents.filter(e => e.banner?.imageUrl);
            setEvents(eventsWithBanners);
        } catch (error)
        {
            console.error('Error loading promotional events:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const handlePrevious = () =>
    {
        setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
    };

    const handleNext = () =>
    {
        setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
    };

    if (loading || events.length === 0)
    {
        return null;
    }

    const currentEvent = events[currentIndex];

    return (
        <section className="py-8 md:py-12 bg-gradient-to-r from-red-50 to-orange-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Special Promotions
                    </h2>
                    <p className="text-sm md:text-base text-gray-600">
                        Limited time offers on selected products
                    </p>
                </div>

                <div className="relative">
                    <div className="relative rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
                        <div className="relative w-full aspect-[21/9]">
                            <Image
                                src={currentEvent.banner!.imageUrl}
                                alt={currentEvent.banner?.title || currentEvent.name}
                                fill
                                className="object-cover"
                                priority
                            />

                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

                            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
                                <div className="max-w-2xl space-y-4">
                                    {currentEvent.banner?.displayPercentage && (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full font-bold text-sm md:text-base shadow-lg">
                                            <Tag className="w-4 h-4" />
                                            Up to {currentEvent.banner.displayPercentage}% OFF
                                        </div>
                                    )}

                                    <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
                                        {currentEvent.banner?.title || currentEvent.name}
                                    </h2>

                                    {currentEvent.banner?.description && (
                                        <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                                            {currentEvent.banner.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 pt-2">
                                        <button
                                            onClick={() => router.push(`/promotions/${currentEvent.id}`)}
                                            className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors shadow-lg"
                                        >
                                            Shop Now
                                        </button>

                                        <CountdownTimer
                                            endDate={toDate(currentEvent.endDate)}
                                            size="md"
                                            className="bg-white/20 backdrop-blur-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {events.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevious}
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </>
                    )}
                </div>

                {events.length > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {events.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-red-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
