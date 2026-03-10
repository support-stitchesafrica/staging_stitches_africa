/**
 * Collection Details Client Component
 * Public-facing collection details and subscription interface
 */

"use client";

import React, { useState } from 'react';
import { CollectionWaitlist, ProductReference } from '@/types/vendor-waitlist';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  Package,
  Heart,
  Share2,
  ArrowRight,
  Target
} from 'lucide-react';
import { CollectionSubscriptionModal } from './CollectionSubscriptionModal';
import { toast } from 'sonner';

interface CollectionDetailsClientProps {
  collection: CollectionWaitlist;
  products: ProductReference[];
  slug: string;
}

export function CollectionDetailsClient({ 
  collection, 
  products, 
  slug 
}: CollectionDetailsClientProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  const progressPercentage = Math.min(
    (collection.currentSubscribers / collection.minSubscribers) * 100,
    100
  );

  const handleSubscriptionSuccess = () => {
    setSubscriptionSuccess(true);
    setShowSubscriptionModal(false);
    toast.success('Successfully joined the waitlist!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.name,
          text: collection.description,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getRelationshipLabel = (relationship: string) => {
    switch (relationship) {
      case 'buy_with':
        return 'Frequently Bought Together';
      case 'complete_look':
        return 'Complete the Look';
      case 'accessory':
        return 'Perfect Accessory';
      default:
        return 'Related Products';
    }
  };

  if (subscriptionSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
          <p className="text-gray-600 mb-6">
            Thanks for joining the waitlist for "{collection.name}". We'll notify you when it launches!
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              Check your email for confirmation details and exclusive updates.
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
        <img
          src={collection.imageUrl}
          alt={collection.name}
          className="w-full h-96 md:h-[500px] object-cover"
        />
        
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {collection.name}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {collection.description}
            </p>
            
            {/* Progress Indicator */}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">
                  {collection.currentSubscribers} / {collection.minSubscribers}
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-white bg-opacity-30"
              />
              <p className="text-xs text-white opacity-80 mt-2">
                {progressPercentage.toFixed(1)}% to launch goal
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowSubscriptionModal(true)}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Join the Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Early Access</h3>
            <p className="text-gray-600">
              Be the first to shop when this collection launches and get exclusive early access.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Curated Collection</h3>
            <p className="text-gray-600">
              Carefully selected pieces that work perfectly together for a complete look.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Community Driven</h3>
            <p className="text-gray-600">
              Join other fashion enthusiasts who are excited about this collection.
            </p>
          </div>
        </div>

        {/* Product Pairs */}
        {products.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Featured Products</h2>
            
            {/* Group products by pairs */}
            <div className="space-y-12">
              {collection.pairedProducts.map((pair, index) => {
                const primaryProduct = products.find(p => p.id === pair.primaryProductId);
                const secondaryProduct = products.find(p => p.id === pair.secondaryProductId);
                
                if (!primaryProduct || !secondaryProduct) return null;
                
                return (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 text-center">
                        <Badge variant="outline" className="mb-2">
                          {getRelationshipLabel(pair.relationship)}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Perfect Pairing #{index + 1}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* Primary Product */}
                        <div className="p-6 border-r border-gray-200">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                            {primaryProduct.images[0] && (
                              <img
                                src={primaryProduct.images[0]}
                                alt={primaryProduct.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {primaryProduct.name}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            by {primaryProduct.vendorName}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(primaryProduct.price)}
                          </p>
                          {primaryProduct.category && (
                            <Badge variant="outline" className="mt-2">
                              {primaryProduct.category}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Secondary Product */}
                        <div className="p-6">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                            {secondaryProduct.images[0] && (
                              <img
                                src={secondaryProduct.images[0]}
                                alt={secondaryProduct.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {secondaryProduct.name}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            by {secondaryProduct.vendorName}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(secondaryProduct.price)}
                          </p>
                          {secondaryProduct.category && (
                            <Badge variant="outline" className="mt-2">
                              {secondaryProduct.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {collection.currentSubscribers}
              </div>
              <p className="text-gray-600">People Waiting</p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {collection.pairedProducts.length}
              </div>
              <p className="text-gray-600">Product Pairs</p>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {progressPercentage.toFixed(0)}%
              </div>
              <p className="text-gray-600">Progress to Launch</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't Miss Out
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join {collection.currentSubscribers} others waiting for this exclusive collection.
          </p>
          
          <div className="mb-8">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="text-sm font-medium">Launch Progress</span>
                <span className="text-sm font-medium">
                  {collection.currentSubscribers} / {collection.minSubscribers}
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-white bg-opacity-30"
              />
            </div>
          </div>

          <Button
            onClick={() => setShowSubscriptionModal(true)}
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            Join the Waitlist Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Stitches Africa</h3>
          <p className="text-gray-400 mb-6">
            Connecting African fashion with the world
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Facebook
            </a>
          </div>
        </div>
      </footer>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <CollectionSubscriptionModal
          collection={collection}
          slug={slug}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </div>
  );
}