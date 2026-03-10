

import { Metadata } from 'next';
import { HeroSection } from '@/components/referral/landing/HeroSection';
import { BenefitsSection } from '@/components/referral/landing/BenefitsSection';
import { HowItWorksSection } from '@/components/referral/landing/HowItWorksSection';
import { RewardsSection } from '@/components/referral/landing/RewardsSection';
import { SocialProofSection } from '@/components/referral/landing/SocialProofSection';
import { CTASection } from '@/components/referral/landing/CTASection';
import { NavigationBar } from '@/components/referral/landing/NavigationBar';
import { Footer } from '@/components/referral/landing/Footer';

export const metadata: Metadata = {
    title: 'Stitches Africa Referral Program - Earn Rewards',
    description: 'Join the Stitches Africa referral program and earn rewards and commissions every time your community shops through your referral code. Start earning today!',
    keywords: 'referral program, earn money, affiliate, rewards, Stitches Africa, commissions',
    openGraph: {
        title: 'Earn Rewards with Stitches Africa Referral Program',
        description: 'Earn rewards and commissions every time your community shops through your referral code.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Stitches Africa Referral Program',
        description: 'Earn rewards and commissions every time your community shops through your referral code.',
    },
};

async function getReferralStats() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/referral/stats`;
        console.log('Fetching referral stats from:', url);
        
        // Fetch stats from API route instead of directly using firebase-admin
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 }, // Revalidate every 5 minutes
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        // Even if response is not OK, try to parse it to get error details
        const text = await response.text();
        console.log('Response text:', text);
        
        // Check if response is HTML (likely a 404 page)
        if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
            console.error('Received HTML response instead of JSON. This likely indicates a 404 error.');
            // Return default values instead of throwing
            return {
                totalReferrers: 0,
                totalRewards: 0,
                successRate: 0,
            };
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', text);
            // Return default values instead of throwing
            return {
                totalReferrers: 0,
                totalRewards: 0,
                successRate: 0,
            };
        }
        
        // If response is not OK, log the error but don't throw
        if (!response.ok) {
            console.error('API returned error response:', data);
            // Return default values instead of throwing
            return {
                totalReferrers: 0,
                totalRewards: 0,
                successRate: 0,
            };
        }

        console.log('Response data:', data);
        
        // Check if the response has the expected structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response structure');
        }
        
        if (data.success === false) {
            console.error('API returned business error:', data.error || data.message);
            // Return default values instead of throwing
            return {
                totalReferrers: 0,
                totalRewards: 0,
                successRate: 0,
            };
        }
        
        if (!data.stats || typeof data.stats !== 'object') {
            throw new Error('Missing or invalid stats in response');
        }
        
        return data.stats;
    } catch (error) {
        console.error('Error fetching referral stats:', error);
        // Return default values if fetch fails
        return {
            totalReferrers: 0,
            totalRewards: 0,
            successRate: 0,
        };
    }
}

export default async function ReferralLandingPage() {
    const stats = await getReferralStats();

    return (
        <div className="min-h-screen bg-white">
            <NavigationBar />

            <main className="scroll-smooth">
                <HeroSection />

                <CTASection variant="primary" className="py-12" />

                <BenefitsSection />

                <HowItWorksSection />

                <RewardsSection />

                <SocialProofSection stats={stats} />

                <CTASection variant="secondary" className="py-16" />
            </main>

            <Footer />
        </div>
    );
}