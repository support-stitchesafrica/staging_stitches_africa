/**
 * Modern Waitlist Landing Page Component
 * Advanced public-facing waitlist signup page with modern design
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Waitlist, WaitlistProduct, CountdownTime, WaitlistSignupForm } from '@/types/waitlist';
import { 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Bell,
  Gift,
  ArrowRight,
  Play,
  Eye,
  Heart,
  Share2,
  Calendar,
  Zap
} from 'lucide-react';
import WaitlistSignupModal from './WaitlistSignupModal';
import CountdownTimer from './CountdownTimer';

interface WaitlistLandingProps {
  waitlist: Waitlist;
  products: WaitlistProduct[];
}

export default function WaitlistLanding({ waitlist, products }: WaitlistLandingProps) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [countdownTime, setCountdownTime] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // Animation and scroll effects
  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate countdown
  useEffect(() => {
    const calculateCountdown = () => {
      const now = Date.now();
      const launchTime = waitlist.countdownEndAt.toMillis ? waitlist.countdownEndAt.toMillis() : new Date(waitlist.countdownEndAt).getTime();
      const difference = launchTime - now;

      if (difference <= 0) {
        setCountdownTime({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdownTime({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [waitlist.countdownEndAt]);

  const handleSignupSuccess = () => {
    setSignupSuccess(true);
    setShowSignupModal(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Success state with confetti effect
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className={`max-w-lg w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center relative z-10 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="relative">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to the Waitlist! 🎉
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            You're now part of an exclusive group waiting for <span className="font-semibold text-gray-900">"{waitlist.title}"</span>
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl mb-6 border border-green-100">
            <div className="flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">What happens next?</span>
            </div>
            <ul className="text-sm text-green-700 space-y-2 text-left">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Email confirmation sent to your inbox
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                WhatsApp updates when collection launches
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Exclusive early access before public release
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              <Share2 className="w-4 h-4 mr-2" />
              Share with Friends
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              <Heart className="w-4 h-4 mr-2" />
              Follow Updates
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expired state
  if (countdownTime.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Waitlist Has Ended</h1>
          <p className="text-gray-600 mb-6">
            The waitlist for <span className="font-semibold">"{waitlist.title}"</span> has closed, but don't worry!
          </p>
          {waitlist.launchUrl && (
            <a
              href={waitlist.launchUrl}
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Shop Collection Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section with Parallax */}
      <div className="relative h-screen overflow-hidden">
        {/* Background with parallax effect */}
        <div 
          className="absolute inset-0 transform scale-110"
          style={{ transform: `translateY(${scrollY * 0.5}px) scale(1.1)` }}
        >
          <img
            src={waitlist.bannerImage}
            alt={waitlist.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent"></div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-blue-300/20 rounded-full blur-lg animate-float-delayed"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-300/15 rounded-full blur-2xl animate-float-slow"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className={`text-center text-white px-6 max-w-5xl transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                <Sparkles className="w-4 h-4 mr-2" />
                Exclusive Collection
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {waitlist.title}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              {waitlist.description}
            </p>
            
            {/* Enhanced Countdown */}
            <div className="mb-10">
              <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium uppercase tracking-wider">Launching In</span>
                </div>
                <CountdownTimer countdownTime={countdownTime} theme="glass" />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowSignupModal(true)}
                className="group relative px-8 py-4 bg-white text-gray-900 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl flex items-center"
              >
                <Bell className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Join the Waitlist
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="flex items-center px-6 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all border border-white/30">
                <Play className="w-5 h-5 mr-2" />
                Watch Preview
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm opacity-80">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>2,847 people waiting</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>12.3k views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Join the Waitlist?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Be part of an exclusive community and get access to benefits that regular customers don't get.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Access",
                description: "Get notified the moment the collection goes live and shop before anyone else.",
                color: "from-yellow-400 to-orange-500",
                bgColor: "from-yellow-50 to-orange-50"
              },
              {
                icon: Gift,
                title: "Exclusive Perks",
                description: "Special discounts, limited edition items, and VIP treatment for waitlist members.",
                color: "from-purple-400 to-pink-500",
                bgColor: "from-purple-50 to-pink-50"
              },
              {
                icon: Star,
                title: "Behind the Scenes",
                description: "Get exclusive content, designer insights, and sneak peeks of upcoming pieces.",
                color: "from-blue-400 to-cyan-500",
                bgColor: "from-blue-50 to-cyan-50"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`group relative bg-gradient-to-br ${feature.bgColor} p-8 rounded-3xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/50`}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products Preview */}
      {products.length > 0 && (
        <div className="py-20 px-4 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Sneak Peek Collection
              </h2>
              <p className="text-xl text-gray-600">
                Here's a glimpse of what's coming your way
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 6).map((product, index) => (
                <div 
                  key={product.id}
                  className={`group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${index % 2 === 0 ? 'animate-fade-in-up' : 'animate-fade-in-up-delayed'}`}
                >
                  {product.images && product.images.length > 0 && (
                    <div className="relative overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Heart className="w-5 h-5 text-gray-700 hover:text-red-500 transition-colors cursor-pointer" />
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.vendor_name && (
                      <p className="text-sm text-gray-500 mb-3">by {product.vendor_name}</p>
                    )}
                    {product.price && (
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {products.length > 6 && (
              <div className="text-center mt-12">
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Plus {products.length - 6} more incredible pieces waiting for you!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final CTA Section */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Don't Miss Out on Magic ✨
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of fashion enthusiasts who are already waiting for this exclusive collection. 
                Your spot is just one click away.
              </p>
              
              <div className="mb-8">
                <CountdownTimer countdownTime={countdownTime} theme="dark" size="large" />
              </div>

              <button
                onClick={() => setShowSignupModal(true)}
                className="group relative px-10 py-5 bg-white text-gray-900 rounded-2xl text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl inline-flex items-center"
              >
                <Bell className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                Secure My Spot Now
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="mt-6 text-sm opacity-75">
                Free to join • No spam • Unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Stitches Africa
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Connecting African fashion with the world, one stitch at a time. 
              Discover authentic designs that tell stories and celebrate culture.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center space-x-8 mb-8">
            {['Instagram', 'Twitter', 'Facebook', 'TikTok', 'YouTube'].map((social) => (
              <a 
                key={social}
                href="#" 
                className="text-gray-400 hover:text-white transition-colors hover:scale-110 transform duration-200 py-2"
              >
                {social}
              </a>
            ))}
          </div>
          
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 Stitches Africa. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Signup Modal */}
      {showSignupModal && (
        <WaitlistSignupModal
          waitlist={waitlist}
          onClose={() => setShowSignupModal(false)}
          onSuccess={handleSignupSuccess}
        />
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(90deg); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up-delayed {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-fade-in-up-delayed { animation: fade-in-up-delayed 0.6s ease-out 0.2s both; }
      `}</style>
    </div>
  );
}