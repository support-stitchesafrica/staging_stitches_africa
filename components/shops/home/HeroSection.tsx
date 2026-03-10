'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { productRepository } from '@/lib/firestore';
import { ArrowRight, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { generateBlurDataURL, RESPONSIVE_SIZES, IMAGE_DIMENSIONS } from '@/lib/utils/image-utils';
import { SafeImage } from '@/components/shops/ui/SafeImage';
import { Price } from '@/components/common/Price';

const backgroundColors = [
    'from-purple-600 to-blue-600',
    'from-pink-600 to-red-600',
    'from-green-600 to-teal-600',
    'from-orange-600 to-yellow-600',
    'from-indigo-600 to-purple-600'
];

export const HeroSection: React.FC = () =>
{
    const router = useRouter();
    const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        loadDiscountedProducts();
    }, []);

    useEffect(() =>
    {
        if (discountedProducts.length > 0)
        {
            const interval = setInterval(() =>
            {
                setCurrentSlide((prev) => (prev + 1) % discountedProducts.length);
            }, 5000); // Auto-slide every 5 seconds

            return () => clearInterval(interval);
        }
    }, [discountedProducts.length]);

    const loadDiscountedProducts = async () =>
    {
        try
        {
            setLoading(true);
            // Get all products and filter for discounted ones
            const allProducts = await productRepository.getAll();
            const discounted = allProducts
                .filter(product =>
                {
                    const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
                    return product.discount > 0 && basePrice > 0;
                })
                .sort(() => 0.5 - Math.random()) // Randomize
                .slice(0, 5); // Get 5 random discounted products

            setDiscountedProducts(discounted);
        } catch (error)
        {
            console.error('Error loading discounted products:', error);
        } finally
        {
            setLoading(false);
        }
    };

    const nextSlide = () =>
    {
        setCurrentSlide((prev) => (prev + 1) % discountedProducts.length);
    };

    const prevSlide = () =>
    {
        setCurrentSlide((prev) => (prev - 1 + discountedProducts.length) % discountedProducts.length);
    };

    const goToSlide = (index: number) =>
    {
        setCurrentSlide(index);
    };

    const handleProductClick = (productId: string) =>
    {
        router.push(`/products/${productId}`);
    };

    const calculateDiscountedPrice = (product: Product) =>
    {
        const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
        return basePrice * (1 - product.discount / 100);
    };

    const formatPrice = (price: number, currency: string = 'USD') =>
    {
        if (currency === 'USD')
        {
            return `$${price.toFixed(2)}`;
        }
        return `$${price.toLocaleString()}`;
    };

    if (loading)
    {
        return (
            <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
                <div className="container mx-auto px-4 py-20 lg:py-32">
                    <div className="text-center">
                        <div className="animate-pulse">
                            <div className="h-12 bg-white/20 rounded w-1/2 mx-auto mb-4"></div>
                            <div className="h-6 bg-white/20 rounded w-1/3 mx-auto mb-8"></div>
                            <div className="h-64 bg-white/20 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (discountedProducts.length === 0)
    {
        return (
            <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
                <div className="container mx-auto px-4 py-20 lg:py-32">
                    <div className="text-center">
                        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                            Discover African Fashion
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Connect with talented tailors and find unique, handcrafted pieces from across Africa
                        </p>
                        <Link href="/shops/products">
                            <button className="px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors mx-auto">
                                <span>Shop Collection</span>
                                <ArrowRight size={20} />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const currentProduct = discountedProducts[currentSlide];
    const currentBgColor = backgroundColors[currentSlide % backgroundColors.length];
    const basePrice = typeof currentProduct.price === 'number' ? currentProduct.price : currentProduct.price.base;
    const currency = typeof currentProduct.price === 'object' ? currentProduct.price.currency : 'USD';
    const discountedPrice = calculateDiscountedPrice(currentProduct);

    return (
        <section className={`relative bg-gradient-to-br ${currentBgColor} text-white overflow-hidden transition-all duration-1000`}>
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
                        <div className="space-y-4">
                            <div className="flex items-center justify-center lg:justify-start space-x-2 text-white/90">
                                <Tag size={20} />
                                <span className="text-sm font-medium uppercase tracking-wider">
                                    {currentProduct.discount}% OFF - Limited Time
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                                {currentProduct.title}
                            </h1>

                            <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                {currentProduct.description.length > 120
                                    ? `${currentProduct.description.substring(0, 120)}...`
                                    : currentProduct.description
                                }
                            </p>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-center lg:justify-start space-x-4">
                            <Price price={discountedPrice} originalCurrency="USD" size="lg" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white" />
                            <span className="text-lg sm:text-xl text-white/70 line-through">
                                <Price price={basePrice} originalCurrency="USD" size="md" className="text-white/70" showTooltip={false} />
                            </span>
                            <span className="bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-full">
                                -{currentProduct.discount}%
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => handleProductClick(currentProduct.product_id)}
                                className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors hover:bg-gray-100"
                            >
                                <span>Shop Now</span>
                                <ArrowRight size={20} />
                            </button>

                            <Link href="/shops/products">
                                <button className="border border-white/30 hover:bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold transition-colors">
                                    View All Deals
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Product Image */}
                    <div className="relative">
                        <div className="relative w-full h-64 sm:h-80 lg:h-96 xl:h-[500px] rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-2xl">
                            {currentProduct.images && currentProduct.images.length > 0 ? (
                                <SafeImage
                                    src={currentProduct.images[0]}
                                    alt={currentProduct.title}
                                    fill
                                    className="object-contain hover:object-cover transition-all duration-500 hover:scale-105"
                                    sizes={RESPONSIVE_SIZES.hero}
                                    priority
                                    placeholder="blur"
                                    blurDataURL={generateBlurDataURL(IMAGE_DIMENSIONS.heroImage.width, IMAGE_DIMENSIONS.heroImage.height)}
                                    fallbackSrc="/placeholder-product.svg"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/50">
                                    <span className="text-6xl">👗</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Slide Indicators */}
                <div className="flex justify-center space-x-2 mt-8">
                    {discountedProducts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};