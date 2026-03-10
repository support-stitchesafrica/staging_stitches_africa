/**
 * Demo Page for Collections Analytics
 * 
 * This page demonstrates the comprehensive collections analytics system with:
 * - Real-time tracking of collection views
 * - Product interaction tracking within collections
 * - Add to cart and purchase analytics
 * - User behavior and location insights
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollectionsAnalyticsSection } from '@/components/atlas/unified-analytics/CollectionsAnalyticsSection';
import { CollectionsTrackingProvider, useCollectionsTracking } from '@/hooks/useCollectionsTracking';
import { 
  Layers, 
  Users, 
  Eye, 
  ShoppingCart,
  TrendingUp,
  Package,
  Globe,
  Smartphone
} from 'lucide-react';

// Mock collections data for demo
const mockCollections = [
  {
    id: 'summer-fashion-2024',
    name: 'Summer Fashion 2024',
    description: 'Trendy summer outfits and accessories',
    productCount: 24,
    image: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Summer+Fashion'
  },
  {
    id: 'african-prints-collection',
    name: 'African Prints Collection',
    description: 'Traditional and modern African print designs',
    productCount: 18,
    image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=African+Prints'
  },
  {
    id: 'wedding-essentials',
    name: 'Wedding Essentials',
    description: 'Everything you need for your special day',
    productCount: 32,
    image: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Wedding+Essentials'
  }
];

const mockProducts = [
  {
    id: 'product-1',
    name: 'Elegant Summer Dress',
    price: 89.99,
    image: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Dress'
  },
  {
    id: 'product-2',
    name: 'African Print Shirt',
    price: 65.99,
    image: 'https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=Shirt'
  },
  {
    id: 'product-3',
    name: 'Wedding Accessories Set',
    price: 129.99,
    image: 'https://via.placeholder.com/200x200/45B7D1/FFFFFF?text=Accessories'
  }
];

const mockUser = {
  id: 'demo-user-collections',
  email: 'demo@example.com',
  name: 'Collections Demo User',
  location: 'Lagos, Nigeria'
};

// Collection Card Component with Tracking
const CollectionCard = ({ collection }: { collection: any }) => {
  const { trackCollectionView, trackProductView } = useCollectionsTracking();
  const [viewed, setViewed] = useState(false);

  const handleCollectionView = async () => {
    if (!viewed) {
      setViewed(true);
      await trackCollectionView(
        collection.id,
        collection.name,
        {
          productCount: collection.productCount,
          viewSource: 'demo_page'
        }
      );
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCollectionView}
    >
      <div className="relative">
        <img
          src={collection.image}
          alt={collection.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {viewed && (
          <Badge className="absolute top-2 right-2 bg-green-500">
            Viewed
          </Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{collection.name}</CardTitle>
        <CardDescription>{collection.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {collection.productCount} products
          </span>
          <Button size="sm" variant="outline">
            View Collection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Product Card Component with Tracking
const ProductCard = ({ product, collectionId, collectionName }: { 
  product: any; 
  collectionId: string; 
  collectionName: string; 
}) => {
  const { trackProductView, trackAddToCart } = useCollectionsTracking();
  const [viewed, setViewed] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleProductView = async () => {
    if (!viewed) {
      setViewed(true);
      await trackProductView(
        collectionId,
        collectionName,
        product.id,
        product.name,
        {
          price: product.price,
          viewSource: 'demo_page'
        }
      );
    }
  };

  const handleAddToCart = async () => {
    await trackAddToCart(
      collectionId,
      collectionName,
      product.id,
      product.name,
      product.price,
      1,
      {
        addToCartSource: 'demo_page'
      }
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-40 object-cover rounded-t-lg cursor-pointer"
          onClick={handleProductView}
        />
        {viewed && (
          <Badge className="absolute top-2 right-2 bg-blue-500 text-xs">
            Viewed
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h4 className="font-medium mb-2">{product.name}</h4>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${product.price}</span>
          <Button
            size="sm"
            onClick={handleAddToCart}
            className={addedToCart ? 'bg-green-500' : ''}
          >
            {addedToCart ? 'Added!' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CollectionsAnalyticsDemoPage() {
  const [activeTab, setActiveTab] = useState('collections');
  const [analyticsDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  return (
    <CollectionsTrackingProvider 
      options={{
        userId: mockUser.id,
        userInfo: {
          email: mockUser.email,
          name: mockUser.name
        },
        autoTrackPageViews: true,
        sessionTimeout: 30
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Collections Analytics Demo
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience comprehensive real-time analytics for product collections. 
              This demo showcases collection views, product interactions, and user behavior tracking.
            </p>
            
            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Collection Views</span>
                </div>
                <p className="text-xl font-bold text-purple-600">12,847</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Product Views</span>
                </div>
                <p className="text-xl font-bold text-blue-600">34,892</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Add to Cart</span>
                </div>
                <p className="text-xl font-bold text-green-600">8,456</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Purchases</span>
                </div>
                <p className="text-xl font-bold text-orange-600">3,234</p>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Demo User Session
              </CardTitle>
              <CardDescription>
                You're browsing as a demo user. All collection interactions are being tracked for analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User ID</p>
                  <p className="font-mono text-sm">{mockUser.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-sm">{mockUser.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Session Status</p>
                  <p className="text-sm text-green-600">Active Tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="collections" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Collections Demo
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Live Analytics
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Tracking Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collections" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Interactive Collections</h2>
                <p className="text-gray-600 mb-6">
                  Click on collections and products to see real-time tracking in action. 
                  Each interaction is automatically recorded for analytics.
                </p>
              </div>

              {/* Collections Grid */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Featured Collections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {mockCollections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Products from Collections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      collectionId={mockCollections[index % mockCollections.length].id}
                      collectionName={mockCollections[index % mockCollections.length].name}
                    />
                  ))}
                </div>
              </div>

              {/* Tracking Instructions */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Real-Time Tracking Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-purple-800">
                    <p>• <strong>Collection Views:</strong> Click on any collection card to track views</p>
                    <p>• <strong>Product Views:</strong> Click on product images to track product interactions</p>
                    <p>• <strong>Add to Cart:</strong> Click "Add to Cart" buttons to track conversions</p>
                    <p>• <strong>Location Data:</strong> Your location is automatically detected and tracked</p>
                    <p>• <strong>Session Management:</strong> 30-minute session timeout with activity tracking</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Live Analytics Dashboard</h2>
                <p className="text-gray-600 mb-6">
                  Real-time analytics data with automatic refresh. 
                  Includes collection performance, user behavior, and conversion tracking.
                </p>
              </div>

              <CollectionsAnalyticsSection 
                dateRange={analyticsDateRange} 
                userRole="superadmin"
              />
            </TabsContent>

            <TabsContent value="tracking" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Tracking Implementation</h2>
                <p className="text-gray-600 mb-6">
                  See how the collections tracking system works with code examples and real-time data.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tracking Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Tracking Events</CardTitle>
                    <CardDescription>Live events from your session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Eye className="w-4 h-4 text-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Collection View</p>
                          <p className="text-xs text-gray-600">Summer Fashion 2024</p>
                        </div>
                        <Badge variant="secondary">Just now</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Package className="w-4 h-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Product View</p>
                          <p className="text-xs text-gray-600">Elegant Summer Dress</p>
                        </div>
                        <Badge variant="secondary">1 min ago</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <ShoppingCart className="w-4 h-4 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Add to Cart</p>
                          <p className="text-xs text-gray-600">African Print Shirt - $65.99</p>
                        </div>
                        <Badge variant="secondary">3 min ago</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Implementation Example */}
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Example</CardTitle>
                    <CardDescription>How to integrate collections tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`// Using the useCollectionsTracking hook
import { useCollectionsTracking } from '@/hooks/useCollectionsTracking';

const MyComponent = () => {
  const { 
    trackCollectionView, 
    trackProductView,
    trackAddToCart 
  } = useCollectionsTracking({
    userId: 'user-123',
    userInfo: { email: 'user@example.com' },
    autoTrackPageViews: true
  });

  // Track collection view
  await trackCollectionView(
    'collection-id', 
    'Collection Name',
    { productCount: 24 }
  );

  // Track product view
  await trackProductView(
    'collection-id',
    'Collection Name', 
    'product-id',
    'Product Name',
    { price: 89.99 }
  );

  // Track add to cart
  await trackAddToCart(
    'collection-id',
    'Collection Name',
    'product-id', 
    'Product Name',
    89.99, // price
    1      // quantity
  );
};`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CollectionsTrackingProvider>
  );
}