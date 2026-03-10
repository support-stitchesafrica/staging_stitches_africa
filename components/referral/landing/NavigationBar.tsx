/**
 * Navigation Bar Component
 * Sticky navigation with smooth scroll and mobile menu
 * Requirements: 1.2, 7.5, 8.1
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationBarProps {
	className?: string;
}

export function NavigationBar({ className = "" }: NavigationBarProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
			setIsMobileMenuOpen(false);
		}
	};

	const navLinks = [
		{ label: "Features", href: "benefits" },
		{ label: "How It Works", href: "how-it-works" },
		{ label: "Rewards", href: "rewards" },
	];

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				isScrolled ? "bg-white shadow-sm" : "bg-white/80 backdrop-blur-md"
			} ${className} border-b border-gray-100`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-lg">
							S
						</div>
						<span className="text-gray-900 text-xl font-bold">
							Stitches Africa
						</span>
					</Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <span
                                key={link.href}
                                onClick={() => scrollToSection(link.href)}
                                className="text-black hover:text-gray-300 transition-colors font-medium"
                            >
                                {link.label}
                            </span>
                        ))}
                    </div>

					{/* Desktop Auth Buttons */}
					<div className="hidden md:flex items-center space-x-4">
						<Link href="/referral/login">
							<Button
								variant="ghost"
								className="text-gray-700 hover:text-black hover:bg-gray-100"
							>
								Login
							</Button>
						</Link>
						<Link href="/referral/signup">
							<Button className="bg-black text-white hover:bg-gray-800 shadow-sm">
								Sign Up
							</Button>
						</Link>
					</div>

                    {/* Mobile Menu Button */}
                    <span
                        className="md:hidden text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </span>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-black border-t border-gray-800">
                    <div className="px-4 py-4 space-y-4">
                        {navLinks.map((link) => (
                            <span
                                key={link.href}
                                onClick={() => scrollToSection(link.href)}
                                className="block w-full text-left text-black hover:text-gray-300 py-2 font-medium"
                            >
                                {link.label}
                            </span>
                        ))}
                        <div className="pt-4 space-y-2 border-t border-gray-800">
                            <Link href="/referral/login" className="block">
                                <Button variant="ghost" className="w-full text-white hover:bg-white/10">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/referral/signup" className="block">
                                <Button className="w-full bg-white text-black hover:bg-gray-200">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
