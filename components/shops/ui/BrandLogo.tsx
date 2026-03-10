"use client";

import * as React from "react";
import { SafeImage } from "@/components/shops/ui/SafeImage";

interface BrandLogoProps {
  src?: string;
  alt: string;
  brandName: string;
  size?: number;
  className?: string;
}

export default function BrandLogo({
  src,
  alt,
  brandName,
  size = 60,
  className = "",
}: BrandLogoProps) {
  const [imageError, setImageError] = React.useState(false);

  // fallback to first letter
  const fallbackLetter = brandName?.charAt(0)?.toUpperCase() || "?";

  // Reset imageError when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  // If no image or error loading, show letter fallback
  if (!src || imageError) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="text-gray-700 font-bold"
          style={{ fontSize: size * 0.4 }}
        >
          {fallbackLetter}
        </span>
      </div>
    );
  }

  // Otherwise, render the logo image
  return (
    <SafeImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={() => setImageError(true)}
      className={`rounded-lg object-cover ${className}`}
      priority
      fallbackSrc="/placeholder-product.svg"
    />
  );
}
