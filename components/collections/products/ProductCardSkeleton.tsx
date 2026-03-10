'use client';

/**
 * Loading skeleton for product cards
 * Provides visual feedback while products are loading
 */
export function ProductCardSkeleton()
{
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-gray-200 animate-pulse">
            {/* Image Skeleton */}
            <div className="relative aspect-square bg-gray-200" />

            {/* Product Info Skeleton */}
            <div className="p-2 space-y-2">
                {/* Title */}
                <div className="h-3 bg-gray-200 rounded w-3/4" />

                {/* Vendor */}
                <div className="h-2 bg-gray-200 rounded w-1/2" />

                {/* Price */}
                <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
        </div>
    );
}

/**
 * Grid of loading skeletons
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number })
{
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    );
}

/**
 * List view loading skeleton
 */
export function ProductListSkeleton({ count = 5 }: { count?: number })
{
    return (
        <div className="flex flex-col gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden flex animate-pulse">
                    {/* Image */}
                    <div className="w-48 h-48 bg-gray-200" />

                    {/* Content */}
                    <div className="flex-1 p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                        <div className="flex gap-4 mt-4">
                            <div className="h-3 bg-gray-200 rounded w-20" />
                            <div className="h-3 bg-gray-200 rounded w-20" />
                            <div className="h-3 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="flex gap-2 pt-3">
                            <div className="h-9 bg-gray-200 rounded flex-1" />
                            <div className="h-9 bg-gray-200 rounded flex-1" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
