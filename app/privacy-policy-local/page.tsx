'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Users, MapPin, FileText, Mail, AlertCircle } from 'lucide-react';

export default function PrivacyPolicyLocalPage()
{
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black transition-colors">
                        <span className="mr-2">←</span>
                        <span>Back to Home</span>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-black to-gray-800 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
                        <Shield className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-xl text-gray-300 mb-2">Stitches Africa Local</p>
                    <p className="text-sm text-gray-400">Last Updated: 2025</p>
                </div>
            </section>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Introduction */}
                <Section
                    icon={<FileText className="w-6 h-6" />}
                    title="1. Introduction"
                    id="introduction"
                >
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Stitches Africa Local ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        By using Stitches Africa Local, you consent to the data practices described in this policy. If you do not agree with this Privacy Policy, please do not use our Platform.
                    </p>
                </Section>

                {/* Information We Collect */}
                <Section
                    icon={<Users className="w-6 h-6" />}
                    title="2. Information We Collect"
                    id="information-collect"
                >
                    <SubSection title="2.1 Personal Information">
                        <p className="text-gray-700 mb-3">We collect information you provide directly to us, including:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Gender</li>
                            <li>Date of birth (for verification purposes)</li>
                            <li>Profile pictures and business logos</li>
                            <li>Bank Verification Number (BVN) for vendor verification</li>
                            <li>Business registration documents (for vendors)</li>
                            <li>Identity verification documents</li>
                        </ul>
                    </SubSection>

                    <SubSection title="2.2 Location Information">
                        <p className="text-gray-700 mb-3">With your permission, we collect and process information about your location, including:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-3">
                            <li>Precise GPS coordinates (latitude and longitude)</li>
                            <li>Address information</li>
                            <li>City, state, and country</li>
                        </ul>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Location data is essential for connecting customers with nearby tailors. You can manage location permissions through your device settings, but some features may not work properly without access.
                            </p>
                        </div>
                    </SubSection>

                    <SubSection title="2.3 Product and Service Information">
                        <p className="text-gray-700 mb-3">For vendors, we collect:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Product listings, descriptions, and images</li>
                            <li>Pricing information</li>
                            <li>Service categories and specializations</li>
                            <li>Business hours and availability</li>
                            <li>Portfolio images and work samples</li>
                        </ul>
                    </SubSection>

                    <SubSection title="2.4 Usage and Analytics Data">
                        <p className="text-gray-700 mb-3">We automatically collect certain information about your device and interactions, such as:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Device type and operating system</li>
                            <li>App usage statistics and feature interactions</li>
                            <li>Search queries and browsing behavior</li>
                            <li>Crash reports and error logs</li>
                            <li>IP address and network information</li>
                        </ul>
                    </SubSection>

                    <SubSection title="2.5 Communication Data">
                        <p className="text-gray-700 mb-3">We may collect records of:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Customer support interactions</li>
                            <li>Feedback and survey responses</li>
                            <li>Reviews and ratings</li>
                            <li>Messages sent through the Platform (if applicable)</li>
                        </ul>
                    </SubSection>
                </Section>

                {/* How We Use Your Information */}
                <Section
                    icon={<Eye className="w-6 h-6" />}
                    title="3. How We Use Your Information"
                    id="how-we-use"
                >
                    <SubSection title="3.1 Core Services">
                        <p className="text-gray-700 mb-3">We use the collected information to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Connect customers with nearby tailors and vendors</li>
                            <li>Display product listings and tailor profiles</li>
                            <li>Enable location-based search and filtering</li>
                            <li>Facilitate communication between users</li>
                            <li>Process vendor verification and KYC</li>
                        </ul>
                    </SubSection>

                    <SubSection title="3.2 Account Management">
                        <p className="text-gray-700 mb-3">We use your data to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Create and maintain your account</li>
                            <li>Authenticate your identity</li>
                            <li>Verify business credentials</li>
                            <li>Manage user preferences and settings</li>
                        </ul>
                    </SubSection>

                    <SubSection title="3.3 Platform Improvement">
                        <p className="text-gray-700 mb-3">We analyze data to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Improve app performance and usability</li>
                            <li>Develop new features and functionality</li>
                            <li>Fix bugs and technical issues</li>
                            <li>Conduct research and analytics</li>
                        </ul>
                    </SubSection>

                    <SubSection title="3.4 Communication">
                        <p className="text-gray-700 mb-3">We may use your information to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Send account-related updates</li>
                            <li>Respond to support inquiries</li>
                            <li>Notify you about service changes</li>
                            <li>Send promotional messages (with consent)</li>
                        </ul>
                    </SubSection>

                    <SubSection title="3.5 Safety and Security">
                        <p className="text-gray-700 mb-3">We use your information to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Detect and prevent fraud or abuse</li>
                            <li>Enforce our Terms and Conditions</li>
                            <li>Protect user safety and platform integrity</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </SubSection>
                </Section>

                {/* How We Share Your Information */}
                <Section
                    icon={<Users className="w-6 h-6" />}
                    title="4. How We Share Your Information"
                    id="how-we-share"
                >
                    <SubSection title="4.1 Public Profile Information">
                        <p className="text-gray-700 mb-3">Certain data is made public to facilitate connections:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Vendor business names and logos</li>
                            <li>Product listings and images</li>
                            <li>General business location (not exact address)</li>
                            <li>Contact information you choose to share</li>
                            <li>Ratings and reviews</li>
                        </ul>
                    </SubSection>

                    <SubSection title="4.2 Service Providers">
                        <p className="text-gray-700 mb-3">We work with third-party providers who help operate our platform, including:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-3">
                            <li>Firebase (Google) for authentication and data storage</li>
                            <li>Cloud storage services for media files</li>
                            <li>Analytics providers for performance insights</li>
                            <li>Customer support and communication tools</li>
                        </ul>
                        <p className="text-sm text-gray-600 italic">These providers are contractually required to protect your data.</p>
                    </SubSection>

                    <SubSection title="4.3 Verification Services">
                        <p className="text-gray-700 mb-3">For vendor verification, we may share limited information with:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>BVN verification services</li>
                            <li>Business registration verification partners</li>
                        </ul>
                    </SubSection>

                    <SubSection title="4.4 Legal Requirements">
                        <p className="text-gray-700 mb-3">We may disclose information to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Comply with applicable laws or government requests</li>
                            <li>Enforce our Terms and Conditions</li>
                            <li>Protect the rights, property, or safety of Stitches Africa or others</li>
                            <li>Investigate fraud or security issues</li>
                        </ul>
                    </SubSection>

                    <SubSection title="4.5 Business Transfers">
                        <p className="text-gray-700 mb-3">
                            If Stitches Africa Local is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that process.
                        </p>
                    </SubSection>

                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-6">
                        <p className="text-sm text-green-800 font-semibold">
                            Important Notice: We never sell your personal information to third parties for marketing purposes.
                        </p>
                    </div>
                </Section>

                {/* Data Storage and Security */}
                <Section
                    icon={<Lock className="w-6 h-6" />}
                    title="5. Data Storage and Security"
                    id="data-security"
                >
                    <SubSection title="5.1 Data Storage">
                        <p className="text-gray-700 mb-3">Your data is stored securely using:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Firebase Cloud Firestore (database)</li>
                            <li>Firebase Storage (images and documents)</li>
                            <li>Local device storage (preferences and cached data)</li>
                        </ul>
                    </SubSection>

                    <SubSection title="5.2 Security Measures">
                        <p className="text-gray-700 mb-3">We use multiple safeguards, including:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-3">
                            <li>Data encryption (in transit and at rest)</li>
                            <li>Secure authentication protocols</li>
                            <li>Regular security audits and updates</li>
                            <li>Access control measures</li>
                            <li>Monitoring for suspicious activity</li>
                        </ul>
                        <p className="text-sm text-gray-600 italic">While we strive to protect your data, no system is completely secure.</p>
                    </SubSection>

                    <SubSection title="5.3 Data Retention">
                        <p className="text-gray-700 mb-3">We retain data for as long as:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-3">
                            <li>Your account is active</li>
                            <li>It's needed to provide our services</li>
                            <li>It's required by law or for business purposes</li>
                        </ul>
                        <p className="text-gray-700">
                            When you delete your account, your data is deleted or anonymized, except where retention is legally required.
                        </p>
                    </SubSection>
                </Section>

                {/* Your Privacy Rights */}
                <Section
                    icon={<Shield className="w-6 h-6" />}
                    title="6. Your Privacy Rights"
                    id="privacy-rights"
                >
                    <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <RightCard title="Access and Portability" items={['Request a copy of your data', 'Export information in a portable format']} />
                        <RightCard title="Correction and Update" items={['Update or correct inaccurate data at any time']} />
                        <RightCard title="Deletion" items={['Delete your account and associated data', 'Request removal of specific information', 'Some data may be retained for legal obligations']} />
                        <RightCard title="Opt-Out Rights" items={['Unsubscribe from marketing emails', 'Disable location services', 'Opt out of analytics tracking']} />
                        <RightCard title="Object and Restrict" items={['Object to certain processing activities', 'Request restriction of data usage']} />
                    </div>

                    <p className="text-gray-700 mt-6 text-center">
                        To exercise these rights, contact us using the details below.
                    </p>
                </Section>

                {/* Location Data and Permissions */}
                <Section
                    icon={<MapPin className="w-6 h-6" />}
                    title="7. Location Data and Permissions"
                    id="location-data"
                >
                    <SubSection title="7.1 Why We Need Location">
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Show nearby tailors and vendors</li>
                            <li>Enable distance-based filtering</li>
                            <li>Help vendors display their business area</li>
                            <li>Improve search relevance</li>
                        </ul>
                    </SubSection>

                    <SubSection title="7.2 Location Control">
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Enable or disable via device settings</li>
                            <li>Manually enter location if preferred</li>
                            <li>Location is only accessed during active use</li>
                            <li>You may clear location history anytime</li>
                        </ul>
                    </SubSection>

                    <SubSection title="7.3 Location Privacy">
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                            <li>Exact coordinates are never made public</li>
                            <li>Only general area or city is displayed</li>
                            <li>Vendors control visibility of their location</li>
                        </ul>
                    </SubSection>
                </Section>

                {/* Children's Privacy */}
                <Section
                    icon={<AlertCircle className="w-6 h-6" />}
                    title="8. Children's Privacy"
                    id="children-privacy"
                >
                    <p className="text-gray-700">
                        Stitches Africa Local is not intended for users under 18 years old. We do not knowingly collect data from minors. If such data is identified, we will promptly delete it.
                    </p>
                </Section>

                {/* Third-Party Services */}
                <Section
                    icon={<Users className="w-6 h-6" />}
                    title="9. Third-Party Services and Links"
                    id="third-party"
                >
                    <SubSection title="9.1 Firebase (Google)">
                        <p className="text-gray-700 mb-2">Used for:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-3">
                            <li>Authentication</li>
                            <li>Cloud database and storage</li>
                            <li>Analytics and crash reporting</li>
                        </ul>
                        <p className="text-sm text-gray-600 italic">Governed by Google's Privacy Policy.</p>
                    </SubSection>

                    <SubSection title="9.2 External Links">
                        <p className="text-gray-700">
                            Our platform may contain links to third-party sites or services. We are not responsible for their privacy practices. Please review their privacy policies before using them.
                        </p>
                    </SubSection>

                    <SubSection title="9.3 Communication Platforms">
                        <p className="text-gray-700">
                            When you contact vendors via WhatsApp, calls, or SMS, those communications are governed by the respective providers' privacy policies, not by Stitches Africa.
                        </p>
                    </SubSection>
                </Section>

                {/* International Data Transfers */}
                <Section
                    icon={<MapPin className="w-6 h-6" />}
                    title="10. International Data Transfers"
                    id="international-transfers"
                >
                    <p className="text-gray-700">
                        While Stitches Africa Local primarily operates in Nigeria, some service providers may store data in other countries. When data is transferred internationally, we ensure proper safeguards are in place to protect it.
                    </p>
                </Section>

                {/* Changes to Privacy Policy */}
                <Section
                    icon={<FileText className="w-6 h-6" />}
                    title="11. Changes to This Privacy Policy"
                    id="policy-changes"
                >
                    <p className="text-gray-700 mb-4">We may update this Privacy Policy periodically. You will be notified of significant changes by:</p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-4">
                        <li>Posting the updated policy in-app</li>
                        <li>Sending email notifications</li>
                        <li>Displaying in-app notices</li>
                    </ul>
                    <p className="text-gray-700">
                        Your continued use of the Platform constitutes acceptance of the updated policy.
                    </p>
                </Section>

                {/* Contact Us */}
                <Section
                    icon={<Mail className="w-6 h-6" />}
                    title="12. Contact Us"
                    id="contact"
                >
                    <p className="text-gray-700 mb-6">
                        If you have questions or requests regarding this Privacy Policy or your data, contact:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <ContactCard
                            icon={<Mail className="w-5 h-5" />}
                            title="Email"
                            content="info@stitchesafrica.com"
                            link="mailto:info@stitchesafrica.com"
                        />
                        <ContactCard
                            icon={<Mail className="w-5 h-5" />}
                            title="Support"
                            content="support@stitchesafrica.com"
                            link="mailto:support@stitchesafrica.com"
                        />
                        <ContactCard
                            icon={<MapPin className="w-5 h-5" />}
                            title="Location"
                            content="Nigeria"
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">
                            Website: <a href="https://https://staging-stitches-africa.vercel.app" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://staging-stitches-africa.vercel.app</a>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">We typically respond within 30 days.</p>
                    </div>
                </Section>

                {/* Your Consent */}
                <Section
                    icon={<Shield className="w-6 h-6" />}
                    title="13. Your Consent"
                    id="consent"
                >
                    <p className="text-gray-700 mb-4">By using Stitches Africa Local, you consent to:</p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>The collection and use of your information as described</li>
                        <li>The storage of your data on our systems and partners' servers</li>
                        <li>The sharing of data as outlined in this policy</li>
                        <li>Our use of cookies and similar technologies</li>
                    </ul>
                </Section>

                {/* Data Breach Notification */}
                <Section
                    icon={<AlertCircle className="w-6 h-6" />}
                    title="14. Data Breach Notification"
                    id="data-breach"
                >
                    <p className="text-gray-700 mb-4">If a data breach occurs, we will notify affected users promptly with details about:</p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>The nature of the compromised data</li>
                        <li>Steps taken to resolve the issue</li>
                        <li>Actions you should take to protect yourself</li>
                        <li>Contact information for assistance</li>
                    </ul>
                </Section>

                {/* Final Message */}
                <div className="bg-gradient-to-r from-black to-gray-800 text-white rounded-xl p-8 text-center mt-12">
                    <Shield className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-3">Your Privacy Matters</h3>
                    <p className="text-gray-300 mb-4">
                        We are committed to protecting your personal information and maintaining transparency.
                    </p>
                    <p className="text-sm text-gray-400">
                        By using Stitches Africa Local, you acknowledge that you have read and understood this Privacy Policy.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        If you have any questions or concerns, please contact us directly.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8 mt-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-gray-400">
                        © 2025 Stitches Africa Local. All rights reserved.
                    </p>
                    <div className="mt-4 flex justify-center gap-6">
                        <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Terms & Conditions
                        </Link>
                        <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Privacy Policy (Web)
                        </Link>
                        <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Component Definitions
interface SectionProps
{
    icon: React.ReactNode;
    title: string;
    id: string;
    children: React.ReactNode;
}

function Section({ icon, title, id, children }: SectionProps)
{
    return (
        <section id={id} className="mb-12 scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-lg">
                    {icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            </div>
            <div className="pl-0 md:pl-15">
                {children}
            </div>
        </section>
    );
}

interface SubSectionProps
{
    title: string;
    children: React.ReactNode;
}

function SubSection({ title, children }: SubSectionProps)
{
    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
            {children}
        </div>
    );
}

interface RightCardProps
{
    title: string;
    items: string[];
}

function RightCard({ title, items }: RightCardProps)
{
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface ContactCardProps
{
    icon: React.ReactNode;
    title: string;
    content: string;
    link?: string;
}

function ContactCard({ icon, title, content, link }: ContactCardProps)
{
    const CardContent = () => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow h-full">
            <div className="flex items-center gap-2 mb-2 text-gray-600">
                {icon}
                <span className="text-sm font-medium">{title}</span>
            </div>
            <p className="text-sm text-gray-900 break-words">{content}</p>
        </div>
    );

    if (link)
    {
        return (
            <a href={link} className="block">
                <CardContent />
            </a>
        );
    }

    return <CardContent />;
}
