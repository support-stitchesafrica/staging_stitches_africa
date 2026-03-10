/**
 * Demo Page for Enhanced BOGO Analytics
 * 
 * This page demonstrates the comprehensive BOGO analytics system with:
 * - Real-time tracking
 * - Location and user data
 * - Interactive product cards with tracking
 * - Live analytics dashboard
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedBogoAnalytics } from '@/components/atlas/unified-analytics/EnhancedBogoAnalytics';
import { BogoProductCard } from '@/components/bogo/BogoProductCard';
import { BogoTrackingProvider } from '@/hooks/useBogoTracking';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  TrendingUp, 
  Eye, 
  ShoppingCart,
  Gift,
  Globe,
  Smartphone
} from 'lucide-react';

// Mock data for demo
const mockBogoPromotions = [
  {
    mappingId: 'bogo-headphones-2024',
    mainProduct: {
      id: 'prod-headphones-001',
      name: 'Premium Wireless Headphones',
      price: 199.99,
      image: 'https://via.placeholder.com/200x200/0088FE/FFFFFF?text=Headphones',
      rating: 4.5,
      reviewCount: 1247
    },
    freeProduct: {
      id: 'prod-case-001',
      name: 'Premium Carrying Case',
      originalPrice: 49.99,
      image: 'https://via.placeholder.com/200x200/00C49F/FFFFFF?text=Case'
    }
  },
  {
    mappingId: 'bogo-smartwatch-2024',
    mainProduct: {
      id: 'prod-watch-001',
      name: 'Smart Fitness Watch',
      price: 299.99,
      image: 'https://via.placeholder.com/200x200/FFBB28/FFFFFF?text=Watch',
      rating: 4.7,
      reviewCount: 892
    },
    freeProduct: {
      id: 'prod-band-001',
      name: 'Sport Band Set',
      originalPrice: 39.99,
      image: 'https://via.placeholder.com/200x200/FF8042/FFFFFF?text=Bands'
    }
  },
  {
    mappingId: 'bogo-earbuds-2024',
    mainProduct: {
      id: 'prod-earbuds-001',
      name: 'True Wireless Earbuds',
      price: 149.99,
      image: 'https://via.placeholder.com/200x200/8884D8/FFFFFF?text=Earbuds',
      rating: 4.3,
      reviewCount: 2156
    },
    freeProduct: {
      id: 'prod-charger-001',
      name: 'Wireless Charging Pad',
      originalPrice: 29.99,
      image: 'https://via.placeholder.com/200x200/82CA9D/FFFFFF?text=Charger'
    }
  }
];

const mockUser = {
  id: 'demo-user-12345',
  email: 'demo@example.com',
  name: 'Demo User',
  location: 'San Francisco, CA'
};

export default function BogoAnalyticsDemoPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });

  const handleAddToCart = (mainProductId: string, freeProductId: string) => {
    setCartItems(prev => [...prev, `${mainProductId}+${freeProductId}`]);
  };

  return (
    <BogoTrackingProvider 
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Enhanced BOGO Analytics Demo
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience comprehensive real-time analytics for Buy One Get One Free promotions. 
              This demo showcases location tracking, user behavior analysis, and conversion insights.
            </p>
            
            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Live Views</span>
                </div>
                <p className="text-xl font-bold text-blue-600">2,847</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Cart Adds</span>
                </div>
                <p className="text-xl font-bold text-green-600">892</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <p className="text-xl font-bold text-purple-600">456</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Countries</span>
                </div>
                <p className="text-xl font-bold text-orange-600">23</p>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Demo User Session
              </CardTitle>
              <CardDescription>
                You're browsing as a demo user. All interactions are being tracked for analytics.
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
                  <p className="text-sm text-gray-600">Cart Items</p>
                  <p className="text-sm">{cartItems.length} BOGO deals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                BOGO Products
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Live Analytics
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Tracking Demo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Interactive BOGO Products</h2>
                <p className="text-gray-600 mb-6">
                  Each product card automatically tracks views, add-to-cart events, and user interactions. 
                  Scroll down to see the intersection observer in action!
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockBogoPromotions.map((promo) => (
                  <BogoProductCard
                    key={promo.mappingId}
                    mappingId={promo.mappingId}
                    mainProduct={promo.mainProduct}
                    freeProduct={promo.freeProduct}
                    userId={mockUser.id}
                    userInfo={{
                      email: mockUser.email,
                      name: mockUser.name
                    }}
                    onAddToCart={handleAddToCart}
                    className="transform transition-all duration-300 hover:scale-105"
                  />
                ))}
              </div>

              {/* Tracking Instructions */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Real-Time Tracking Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• <strong>View Tracking:</strong> Automatically triggered when 50% of a product card is visible</p>
                    <p>• <strong>Add to Cart:</strong> Click any "Add BOGO Deal to Cart" button to track conversions</p>
                    <p>• <strong>Location Data:</strong> Your approximate location is being tracked (with permission)</p>
                    <p>• <strong>Device Info:</strong> Browser, OS, and device type are automatically detected</p>
                    <p>• <strong>Session Management:</strong> 30-minute session timeout with activity tracking</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Live Analytics Dashboard</h2>
                <p className="text-gray-600 mb-6">
                  Real-time analytics data with automatic refresh every 30 seconds. 
                  Includes location insights, customer behavior, and conversion tracking.
                </p>
              </div>

              <EnhancedBogoAnalytics dateRange={analyticsDateRange} />
            </TabsContent>

            <TabsContent value="tracking" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Tracking Implementation Demo</h2>
                <p className="text-gray-600 mb-6">
                  See how the tracking system works behind the scenes with code examples and real-time data.
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
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Product View</p>
                          <p className="text-xs text-gray-600">Premium Wireless Headphones</p>
                        </div>
                        <Badge variant="secondary">Just now</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <ShoppingCart className="w-4 h-4 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Add to Cart</p>
                          <p className="text-xs text-gray-600">Smart Fitness Watch + Sport Band Set</p>
                        </div>
                        <Badge variant="secondary">2 min ago</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Location Update</p>
                          <p className="text-xs text-gray-600">San Francisco, CA, USA</p>
                        </div>
                        <Badge variant="secondary">5 min ago</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Information</CardTitle>
                    <CardDescription>Current tracking session details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Session ID</p>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                          bogo_session_{Date.now()}_abc123
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Device Type</p>
                        <p className="text-sm">Desktop (Chrome on macOS)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-sm">San Francisco, California, USA</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Session Duration</p>
                        <p className="text-sm">12 minutes 34 seconds</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Events Tracked</p>
                        <p className="text-sm">15 events (8 views, 4 cart adds, 3 other)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Code Example */}
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Example</CardTitle>
                  <CardDescription>How to integrate BOGO tracking in your components</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`// Using the useBogoTracking hook
import { useBogoTracking } from '@/hooks/useBogoTracking';

const MyComponent = () => {
  const { trackView, trackAddToCart } = useBogoTracking({
    userId: 'user-123',
    userInfo: { email: 'user@example.com' },
    autoTrackPageViews: true
  });

  // Track product view
  await trackView('bogo-mapping-id', 'main-product-id', {
    productName: 'Premium Headphones',
    productPrice: 199.99
  });

  // Track add to cart
  await trackAddToCart(
    'bogo-mapping-id',
    'main-product-id', 
    'free-product-id',
    199.99, // cart total
    { savings: 49.99 }
  );
};`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </BogoTrackingProvider>
  );
}