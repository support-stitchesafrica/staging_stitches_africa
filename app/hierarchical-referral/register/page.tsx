import { Metadata } from 'next';
import Link from 'next/link';
import { MotherInfluencerRegistrationWrapper } from '@/components/hierarchical-referral/MotherInfluencerRegistrationWrapper';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mother Influencer Registration - Stitches Africa',
  description: 'Apply to become a Mother Influencer and start building your own network of Mini Influencers.',
  keywords: 'mother influencer registration, hierarchical referral, network marketing, affiliate signup',
};

export default function MotherInfluencerRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/hierarchical-referral" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hierarchical Referral
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mother Influencer Application
            </h1>
            <p className="text-lg text-gray-600">
              Join our exclusive network and start earning from your influence
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <MotherInfluencerRegistrationWrapper />

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/hierarchical-referral/login" className="text-blue-600 hover:text-blue-800">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}