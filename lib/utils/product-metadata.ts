/**
 * Product Metadata Generator for Social Media Sharing
 * 
 * Generates optimized Open Graph and Twitter Card metadata
 */

import { Product } from "@/types";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";

export interface ProductMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  price: string;
  availability: string;
  brand: string;
  category: string;
}

/**
 * Generate comprehensive metadata for a product
 */
export function generateProductMetadata(
  product: Product,
  productId: string
): ProductMetadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://staging-stitches-africa.vercel.app';
  const productUrl = `${baseUrl}/shops/products/${productId}`;
  
  // Get price information
  const basePrice = typeof product.price === "number" ? product.price : product.price.base;
  const currency = typeof product.price === "object" ? product.price.currency : "USD";
  const discountedPrice = product.discount > 0
    ? calculateDiscountedPrice(basePrice, product.discount)
    : basePrice;
  
  // Format title for social media (max 60 chars for optimal display)
  const title = product.title.length > 60
    ? `${product.title.substring(0, 57)}...`
    : product.title;
  
  // Format description (max 155 chars for optimal display)
  let description = product.description || `${product.title} by ${product.vendor?.name || 'Stitches Africa'}`;
  if (description.length > 155) {
    description = `${description.substring(0, 152)}...`;
  }
  
  // Add discount info to description if applicable
  if (product.discount > 0) {
    description = `${product.discount}% OFF! ${description}`;
  }
  
  // Get the best image (first image or fallback)
  const image = product.images && product.images.length > 0
    ? product.images[0]
    : `${baseUrl}/placeholder-product.svg`;
  
  // Determine availability
  const availability = product.availability === 'out_of_stock' || 
    (product as any).in_stock === 'out_of_stock'
    ? 'out of stock'
    : 'in stock';
  
  return {
    title: `${title} - Stitches Africa`,
    description,
    image,
    url: productUrl,
    price: formatPrice(discountedPrice, currency),
    availability,
    brand: product.vendor?.name || 'Stitches Africa',
    category: product.category || 'Fashion',
  };
}

/**
 * Generate structured data (JSON-LD) for SEO
 */
export function generateProductStructuredData(
  product: Product,
  productId: string
): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://staging-stitches-africa.vercel.app';
  const productUrl = `${baseUrl}/shops/products/${productId}`;
  
  const basePrice = typeof product.price === "number" ? product.price : product.price.base;
  const currency = typeof product.price === "object" ? product.price.currency : "USD";
  const discountedPrice = product.discount > 0
    ? calculateDiscountedPrice(basePrice, product.discount)
    : basePrice;
  
  const availability = product.availability === 'out_of_stock' || 
    (product as any).in_stock === 'out_of_stock'
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": product.images || [],
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.vendor?.name || "Stitches Africa"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": currency,
      "price": discountedPrice,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": availability,
      "seller": {
        "@type": "Organization",
        "name": product.vendor?.name || "Stitches Africa"
      }
    },
    "category": product.category,
    "sku": productId,
    "aggregateRating": product.ratings ? {
      "@type": "AggregateRating",
      "ratingValue": product.ratings,
      "reviewCount": 1
    } : undefined
  };
}
