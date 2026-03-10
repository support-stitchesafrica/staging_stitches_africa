/**
 * Public Collection Waitlists Client Component
 * Displays grid of published collection waitlists
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, ArrowRight, Package } from 'lucide-react';

interface CollectionWaitlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
  minSubscribers: number;
  currentSubscribers: number;
  pairedProducts: any[];
  vendorId: string;
  status: string;
}

interface CollectionWaitlistsClientProps {
  collections: CollectionWaitlist[];
}

export function CollectionWaitlistsClient({ collections }: CollectionWaitlistsClientProps) {
  const progress = (collection: CollectionWaitlist) => {
    return Math.min((collection.currentSubscribers / collection.minSubscribers) * 100, 100);
  };

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
                Exclusive Collections
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Upcoming Collection Waitlists
              </h1>
              <p className="text-lg text-gray-600">
                Be the first to discover exclusive collections from Africa's finest designers.
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Icon with gradient background */}
            <div className="relative inline-flex mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full blur-2xl opacity-50"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                <Package className="h-12 w-12 text-gray-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No Collections Available Yet
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              We're working with talented African designers to bring you exclusive collections. 
              Check back soon or explore our current product catalog.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
              >
                <Link href="/shops">
                  Browse Products
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/vendor">
                  Join as Designer
                </Link>
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Early Access</h3>
                <p className="text-sm text-gray-600">
                  Join waitlists to be the first to shop new collections when they launch.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Exclusive Collections</h3>
                <p className="text-sm text-gray-600">
                  Discover unique pieces from Africa's most talented fashion designers.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <ArrowRight className="h-6 w-6 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Stay Updated</h3>
                <p className="text-sm text-gray-600">
                  Get notified when new collection waitlists become available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
              Exclusive Collections
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Upcoming Collection Waitlists
            </h1>
            <p className="text-lg text-gray-600">
              Be the first to discover exclusive collections from Africa's finest designers. 
              Join a waitlist to get early access when collections launch.
            </p>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Card 
              key={collection.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200"
            >
              {/* Collection Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                
                {/* Progress Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-0">
                    <Users className="h-3 w-3 mr-1" />
                    {collection.currentSubscribers} / {collection.minSubscribers}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Collection Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                    {collection.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {collection.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round(progress(collection))}%
                    </span>
                  </div>
                  <Progress value={progress(collection)} className="h-2" />
                </div>

                {/* Products Count */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    {collection.pairedProducts.length} product pairs
                  </span>
                </div>

                {/* CTA Button */}
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white"
                >
                  <Link href={`/collection-waitlists/${collection.slug}`}>
                    View Collection
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Are you a designer?
            </h2>
            <p className="text-gray-600 mb-6">
              Create your own collection waitlists and gauge demand before launch.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/vendor">
                Join as Vendor
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
