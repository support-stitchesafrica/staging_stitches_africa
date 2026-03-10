/**
 * Virtual Try-On Modal Component
 * 
 * Full-screen modal for virtual try-on experience
 * Features:
 * - 3D avatar viewer
 * - Size recommendations
 * - Add to cart integration
 * - Mobile optimized
 * - Rotation instructions
 */

'use client';

import { useState, useEffect } from 'react';
import { X, RotateCw, ShoppingCart, Info } from 'lucide-react';
import { Avatar3DViewer, AvatarConfig, ProductVisualization } from './Avatar3DViewer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  avatarConfig: AvatarConfig;
  onAddToCart?: (product: Product, size?: string) => void;
  userPhoto?: string; // User uploaded photo for try-on
  onPhotoUpload?: (photo: string) => void; // Callback for photo upload
}

export function VirtualTryOnModal({
  isOpen,
  onClose,
  product,
  avatarConfig,
  onAddToCart,
  userPhoto,
  onPhotoUpload,
}: VirtualTryOnModalProps) {
  const [recommendedSize, setRecommendedSize] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Determine product category for visualization
  const getProductCategory = (product: Product): string => {
    const category = product.category?.toLowerCase() || '';
    const title = product.title?.toLowerCase() || '';
    
    if (category.includes('dress') || title.includes('dress')) return 'dress';
    if (category.includes('top') || category.includes('shirt') || title.includes('top') || title.includes('shirt')) return 'top';
    if (category.includes('bottom') || category.includes('pant') || category.includes('trouser') || title.includes('pant')) return 'bottom';
    if (category.includes('jacket') || category.includes('coat') || title.includes('jacket')) return 'outerwear';
    
    return 'top'; // default
  };

  // Calculate recommended size based on avatar config
  useEffect(() => {
    if (!product || !avatarConfig) return;

    // Simple size recommendation logic based on body type and height
    const { bodyType, height } = avatarConfig;
    
    let size = 'M';
    
    if (bodyType === 'slim') {
      size = height < 165 ? 'XS' : height < 175 ? 'S' : 'M';
    } else if (bodyType === 'average') {
      size = height < 165 ? 'S' : height < 175 ? 'M' : 'L';
    } else if (bodyType === 'athletic') {
      size = height < 165 ? 'M' : height < 175 ? 'L' : 'XL';
    } else if (bodyType === 'plus-size') {
      size = height < 165 ? 'L' : height < 175 ? 'XL' : 'XXL';
    }

    setRecommendedSize(size);
    setSelectedSize(size);
  }, [product, avatarConfig]);

  // Get available sizes from product
  const availableSizes = product.rtwOptions?.sizes || [];
  const sizesArray = availableSizes.map(s => 
    typeof s === 'string' ? s : s.label
  );

  // Create product visualization
  const productVisualization: ProductVisualization = {
    productId: product.product_id,
    category: getProductCategory(product),
    color: product.rtwOptions?.colors?.[0] || '#4A5568',
    thumbnail: product.thumbnail,
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedPhoto(result);
      if (onPhotoUpload) {
        onPhotoUpload(result);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedSize);
    }
    onClose();
  };

  // Hide instructions after 3 seconds
  useEffect(() => {
    if (showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showInstructions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-full flex flex-col bg-white md:bg-gray-50 animate-in slide-in-from-bottom duration-300 md:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 safe-area-inset-top">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {product.title}
            </h2>
            <p className="text-sm text-gray-500">
              Virtual Try-On
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-2 touch-manipulation min-w-[44px] min-h-[44px]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* 3D Viewer */}
          <div className="relative flex-1 bg-gradient-to-b from-gray-100 to-gray-200">
            {uploadedPhoto ? (
              <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                <img 
                  src={uploadedPhoto} 
                  alt="Your photo for try-on" 
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img 
                    src={product.thumbnail} 
                    alt="Product overlay" 
                    className="max-w-[60%] max-h-[60%] object-contain opacity-80 mix-blend-multiply"
                  />
                </div>
              </div>
            ) : (
              <Avatar3DViewer
                avatarConfig={avatarConfig}
                product={productVisualization}
                enableRotation={true}
                autoRotate={false}
                className="w-full h-full"
              />
            )}

            {/* Rotation Instructions */}
            {showInstructions && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top duration-300">
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">Drag to rotate • Scroll to zoom</span>
                <span className="sm:hidden">Drag to rotate • Pinch to zoom</span>
              </div>
            )}

            {/* Info Button */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white active:bg-gray-100 p-3 rounded-full shadow-lg transition-all touch-manipulation active:scale-95"
            >
              <Info className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Side Panel */}
          <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
            {/* Product Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-start gap-3">
                {product.thumbnail && (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.vendor?.name || product.tailor}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {product.price?.currency || '$'}{product.price?.base?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="p-4 border-b border-gray-200">
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Try with Your Photo
                </label>
                <label className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                    disabled={isUploading}
                  />
                  <span className="text-sm text-gray-700">
                    {isUploading ? 'Uploading...' : uploadedPhoto ? 'Change Photo' : 'Upload Your Photo'}
                  </span>
                </label>
                {uploadedPhoto && (
                  <button 
                    onClick={() => setUploadedPhoto(null)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
            
            {/* Size Selection */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900">
                  Select Size
                </label>
                {recommendedSize && (
                  <span className="text-xs text-purple-600 font-medium">
                    Recommended: {recommendedSize}
                  </span>
                )}
              </div>

              {sizesArray.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {sizesArray.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-2 px-3 text-sm font-medium rounded-lg border-2 transition-all touch-manipulation active:scale-95 min-h-[44px]",
                        selectedSize === size
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:border-gray-400",
                        size === recommendedSize && selectedSize !== size && "border-purple-200"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No sizes available for this product
                </p>
              )}
            </div>

            {/* Fit Information */}
            <div className="p-4 border-b border-gray-200 flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Fit Information
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                  <p>
                    Based on your profile (Height: {avatarConfig.height}cm, Body Type: {avatarConfig.bodyType}), 
                    we recommend size <strong>{recommendedSize}</strong>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <p>
                    This visualization shows how the garment drapes on your body type
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                  <p>
                    Rotate the avatar to see the fit from all angles
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-2 pb-safe">
              <Button
                onClick={handleAddToCart}
                disabled={!selectedSize && sizesArray.length > 0}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white touch-manipulation transition-all active:scale-95 min-h-[48px]"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart {selectedSize && `(${selectedSize})`}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full touch-manipulation transition-all active:scale-95 min-h-[48px]"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
