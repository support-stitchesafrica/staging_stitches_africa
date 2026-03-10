/**
 * Footer Component
 * Landing page footer with links and copyright
 * Requirements: 1.5, 8.1, 8.2, 8.3
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer()
{
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        product: [
            { label: 'Features', href: '#benefits' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Rewards', href: '#rewards' },
            { label: 'Pricing', href: '#' },
        ],
        company: [
            { label: 'About Us', href: '/' },
            { label: 'Contact', href: '/' },
            { label: 'Blog', href: '/' },
            { label: 'Careers', href: '/' },
        ],
        legal: [
            { label: 'Terms of Service', href: '/' },
            { label: 'Privacy Policy', href: '/' },
            { label: 'Cookie Policy', href: '/' },
            { label: 'Disclaimer', href: '/' },
        ],
    };

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
    ];

    return (
        <footer className="bg-black text-white pt-12 sm:pt-16 pb-6 sm:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-block mb-3 sm:mb-4">
                            <span className="text-xl text-gray-700 sm:text-2xl font-bold">Stitches Africa</span>
                        </Link>
                        <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-sm">
                            Earn rewards by sharing Stitches Africa with your friends and family. Join our referral program today!
                        </p>
                        <div className="flex gap-3 sm:gap-4">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                                >
                                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Product</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                            {footerLinks.product.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Company</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                            {footerLinks.company.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Legal</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                            {footerLinks.legal.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 sm:pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
                        <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
                            © {currentYear} Stitches Africa. All rights reserved.
                        </p>
                        <div className="flex gap-4 sm:gap-6">
                            <Link href="/referral/login" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                                Login
                            </Link>
                            <Link href="/referral/signup" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                                Sign Up
                            </Link>
                            <Link href="/referral/dashboard" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
