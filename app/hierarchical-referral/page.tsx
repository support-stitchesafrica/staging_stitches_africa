import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, Network, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hierarchical Referral Program - Stitches Africa',
  description: 'Join our hierarchical referral program as a Mother Influencer and build your own network of Mini Influencers. Earn from direct referrals and your network.',
  keywords: 'hierarchical referral, mother influencer, mini influencer, network marketing, affiliate program',
};

export default function HierarchicalReferralLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Stitches Africa
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/hierarchical-referral/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/hierarchical-referral/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Build Your Own
            <span className="text-blue-600 block">Influencer Network</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join our hierarchical referral program as a Mother Influencer. 
            Recruit Mini Influencers, earn from their success, and build a sustainable income stream.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/hierarchical-referral/register">
              <Button size="lg" className="w-full sm:w-auto">
                Become a Mother Influencer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/hierarchical-referral/mini-influencer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Join as Mini Influencer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Hierarchical Program?
            </h2>
            <p className="text-lg text-gray-600">
              Maximize your earning potential with our two-tier referral system
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Build Your Network</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Recruit and manage Mini Influencers under your network. 
                  Generate sub-referral codes and track their performance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Dual Income Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Earn from your direct referrals AND from the success of 
                  your Mini Influencers. Double your earning potential.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Automated Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receive automated payouts when you reach the minimum threshold. 
                  No manual processing required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Network className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your network performance with real-time dashboards. 
                  Monitor earnings, conversions, and growth metrics.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple steps to start building your influencer network
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Apply as Mother Influencer</h3>
              <p className="text-gray-600">
                Submit your application with business information and social media handles. 
                Get verified within 24-48 hours.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Recruit Mini Influencers</h3>
              <p className="text-gray-600">
                Generate sub-referral codes and invite Mini Influencers to join your network. 
                They get instant access upon signup.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn & Grow</h3>
              <p className="text-gray-600">
                Earn from your direct referrals and your Mini Influencers' success. 
                Track everything in your real-time dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Your Network?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of successful Mother Influencers who are earning through our program
          </p>
          <Link href="/hierarchical-referral/register">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Your Application Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Stitches Africa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}