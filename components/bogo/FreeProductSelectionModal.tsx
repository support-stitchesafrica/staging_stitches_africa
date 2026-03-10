"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { FreeProductSelectionModal } from '@/types/bogo';

interface FreeProductSelectionModalProps extends FreeProductSelectionModal {
  isOpen: boolean;
  onClose: () => void;
}

export const FreeProductSelectionModal: React.FC<FreeProductSelectionModalProps> = ({
  isOpen,
  onClose,
  mainProductId,
  mainProductName,
  freeProducts,
  onSelect,
  onCancel,
}) => {
  const handleSelect = (productId: string) => {
    onSelect(productId);
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  const truncateText = (text: string, maxLength: number = 50): string => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Choose Your Free Item
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            You've added <strong>{truncateText(mainProductName)}</strong> to your cart. 
            Choose one free item to complete your BOGO promotion:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {freeProducts.map((product) => (
            <div
              key={product.productId}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative mb-3 overflow-hidden rounded-md">
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
                <div className="absolute top-2 right-2">
                  {getAvailabilityBadge(product.availability)}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm leading-tight">
                  {truncateText(product.name)}
                </h3>
                
                {product.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {product.originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      FREE
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={() => handleSelect(product.productId)}
                  disabled={product.availability === 'out_of_stock'}
                  className="w-full"
                  size="sm"
                >
                  {product.availability === 'out_of_stock' ? 'Out of Stock' : 'Select This Item'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Don't want a free item? You can continue without selecting one.
          </p>
          <Button variant="outline" onClick={handleCancel}>
            Continue Without Free Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};