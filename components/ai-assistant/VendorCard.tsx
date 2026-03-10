/**
 * AI Shopping Assistant Vendor Card
 * 
 * Displays vendor/tailor information in chat with quick action buttons
 * Features:
 * - Vendor logo with fallback
 * - Vendor name and rating
 * - Location and specialties
 * - Years of experience
 * - Quick action buttons (Visit Shop, View Products)
 * - Mobile responsive (350px width as per design spec)
 * - Smooth hover effects
 * - Performance optimized with React.memo
 */

'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { Store, Package, Star, MapPin, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VendorCardProps {
  vendor: {
    id: string;
    name: string;
    logo?: string;
    rating: number;
    location: string;
    specialties: string[];
    yearsOfExperience: number;
    shopUrl: string;
  };
  onVisitShop?: (vendorId: string, shopUrl: string) => void;
  onViewProducts?: (vendorId: string) => void;
  className?: string;
}

const VendorCardComponent = ({
  vendor,
  onVisitShop,
  onViewProducts,
  className,
}: VendorCardProps) => {
  const [imageError, setImageError] = useState(false);

  // Get vendor logo or use placeholder
  const vendorLogo = vendor.logo || '/placeholder-logo.png';

  // Format rating to 1 decimal place
  const formattedRating = vendor.rating.toFixed(1);

  // Get top 3 specialties
  const displaySpecialties = vendor.specialties.slice(0, 3);

  return (
    <div
      className={cn(
        "w-full max-w-[350px] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Vendor Header with Logo */}
      <div className="relative w-full h-[120px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full bg-white shadow-md overflow-hidden border-2 border-white">
          <Image
            src={imageError ? '/placeholder-logo.png' : vendorLogo}
            alt={vendor.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="80px"
          />
        </div>
      </div>

      {/* Vendor Details */}
      <div className="p-4 space-y-3">
        {/* Vendor Name */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 text-base line-clamp-2 leading-tight">
            {vendor.name}
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">
            {formattedRating}
          </span>
          <span className="text-xs text-gray-500">
            rating
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center justify-center gap-1.5 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {vendor.location}
          </span>
        </div>

        {/* Specialties */}
        {displaySpecialties.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-gray-700">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Specialties:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {displaySpecialties.map((specialty, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Years of Experience */}
        {vendor.yearsOfExperience > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-gray-600">
            <Award className="w-4 h-4" />
            <span className="text-sm">
              {vendor.yearsOfExperience} {vendor.yearsOfExperience === 1 ? 'year' : 'years'} of experience
            </span>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Visit Shop Button - Primary Action */}
          {onVisitShop && (
            <Button
              onClick={() => onVisitShop(vendor.id, vendor.shopUrl)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white touch-manipulation transition-all active:scale-95"
              size="sm"
            >
              <Store className="w-4 h-4 mr-2" />
              Visit Shop
            </Button>
          )}

          {/* View Products Button - Secondary Action */}
          {onViewProducts && (
            <Button
              onClick={() => onViewProducts(vendor.id)}
              variant="outline"
              className="w-full touch-manipulation transition-all active:scale-95"
              size="sm"
            >
              <Package className="w-4 h-4 mr-2" />
              View Products
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const VendorCard = memo(VendorCardComponent, (prevProps, nextProps) => {
  // Only re-render if vendor ID changes or handlers change
  return prevProps.vendor.id === nextProps.vendor.id &&
         prevProps.onVisitShop === nextProps.onVisitShop &&
         prevProps.onViewProducts === nextProps.onViewProducts;
});

VendorCard.displayName = 'VendorCard';
