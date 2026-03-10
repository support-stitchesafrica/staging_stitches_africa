'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Scissors, Package, Check } from 'lucide-react';

export type GenderPreference = 'men' | 'women';
export type TypePreference = 'bespoke' | 'ready-to-wear';

export interface RegistrationData {
    shoppingPreference: (GenderPreference | TypePreference)[];
    email: string;
    password: string;
}

interface MultiStepRegistrationProps {
    onComplete: (data: RegistrationData) => void;
    onBack: () => void;
    loading?: boolean;
    error?: string | null;
}

export const MultiStepRegistration: React.FC<MultiStepRegistrationProps> = ({
    onComplete,
    onBack,
    loading = false,
    error = null
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [registrationData, setRegistrationData] = useState<RegistrationData>({
        shoppingPreference: [],
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const totalSteps = 3;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            onBack();
        }
    };

    const handleGenderSelect = (gender: GenderPreference) => {
        setRegistrationData(prev => ({
            ...prev,
            shoppingPreference: [...prev.shoppingPreference.filter(p => p !== 'men' && p !== 'women'), gender]
        }));
        setTimeout(handleNext, 300); // Small delay for visual feedback
    };

    const handleTypeSelect = (type: TypePreference) => {
        setRegistrationData(prev => ({
            ...prev,
            shoppingPreference: [...prev.shoppingPreference.filter(p => p !== 'bespoke' && p !== 'ready-to-wear'), type]
        }));
        setTimeout(handleNext, 300); // Small delay for visual feedback
    };

    const handleEmailPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (registrationData.email && registrationData.password) {
            onComplete(registrationData);
        }
    };

    const canProceedToNext = () => {
        switch (currentStep) {
            case 1:
                return registrationData.shoppingPreference.some(p => p === 'men' || p === 'women');
            case 2:
                return registrationData.shoppingPreference.some(p => p === 'bespoke' || p === 'ready-to-wear');
            case 3:
                return registrationData.email && registrationData.password.length >= 6;
            default:
                return false;
        }
    };

    const renderProgressBar = () => (
        <div className="mb-8 sm:mb-10 lg:mb-12">
            {/* Step indicators */}
            <div className="flex flex-col">
                {/* Line and circles row */}
                <div className="flex items-center mb-3 sm:mb-4 lg:mb-5">
                    {[1, 2, 3].map((step) => (
                        <React.Fragment key={step}>
                            {/* Step circle - centered in its own container */}
                            <div className="flex justify-center flex-shrink-0">
                                <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${step < currentStep
                                        ? 'bg-black border-black text-white'
                                        : step === currentStep
                                            ? 'bg-[#E2725B] border-[#E2725B] text-white shadow-lg shadow-[#E2725B]/30'
                                            : 'bg-white border-gray-200 text-gray-400'
                                        }`}
                                >
                                    {step < currentStep ? (
                                        <Check size={18} className="animate-in fade-in zoom-in duration-300 sm:w-5 sm:h-5 lg:w-6 lg:h-6" strokeWidth={3} />
                                    ) : (
                                        <span className="font-bold text-base sm:text-lg lg:text-xl">{step}</span>
                                    )}
                                </div>
                            </div>
                            {/* Connecting line */}
                            {step < 3 && (
                                <div className={`h-[2px] flex-1 mx-1 sm:mx-3 lg:mx-4 transition-all duration-500 ${step < currentStep ? 'bg-black' : 'bg-gray-200'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Labels row - mirror the structure of circles row */}
                <div className="flex items-center">
                    {[1, 2, 3].map((step) => (
                        <React.Fragment key={`label-${step}`}>
                            {/* Label - centered under circle */}
                            <div className="flex justify-center flex-shrink-0">
                                <span className={`text-[10px] sm:text-xs lg:text-sm font-medium tracking-wide uppercase ${step <= currentStep ? 'text-black' : 'text-gray-400'
                                    }`}>
                                    {step === 1 ? 'Preference' : step === 2 ? 'Style' : 'Account'}
                                </span>
                            </div>
                            {/* Empty space for line alignment */}
                            {step < 3 && (
                                <div className={`flex-1 mx-1 sm:mx-3 lg:mx-4`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black mb-3 sm:mb-4 tracking-tight">
                    What's your preference?
                </h2>
                <p className="text-gray-500 text-sm sm:text-base">
                    Let's personalize your shopping experience
                </p>
            </div>

            <div className="space-y-3 sm:space-y-4 ">
                <button
                    onClick={() => handleGenderSelect('men')}
                    className={`group w-full p-5 sm:p-6 rounded-xl  lg:p-8 transition-all duration-300 border-2 ${registrationData.shoppingPreference.includes('men')
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-200 hover:border-[#E2725B]'
                        }`}
                >
                    <div className="flex items-center  justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl lg:w-16 lg:h-16 flex items-center justify-center transition-all border-2 ${registrationData.shoppingPreference.includes('men')
                                ? 'bg-[#E2725B] border-[#E2725B]'
                                : 'bg-white border-gray-200 group-hover:border-[#E2725B]'
                                }`}>
                                <User size={24} className={`sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${registrationData.shoppingPreference.includes('men') ? 'text-white' : 'text-black'}`} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <h3 className={`font-medium text-base sm:text-lg lg:text-xl mb-0.5 sm:mb-1 ${registrationData.shoppingPreference.includes('men') ? 'text-white' : 'text-whitw'
                                    }`}>
                                    Men's Collection
                                </h3>
                                <p className={`text-xs sm:text-sm ${registrationData.shoppingPreference.includes('men') ? 'text-gray-300' : 'text-gray-500'
                                    }`}>
                                    Tailored for men's fashion
                                </p>
                            </div>
                        </div>
                        {registrationData.shoppingPreference.includes('men') && (
                            <Check size={24} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#E2725B] animate-in zoom-in duration-300" strokeWidth={3} />
                        )}
                    </div>
                </button>

                <button
                    onClick={() => handleGenderSelect('women')}
                    className={`group w-full p-5 sm:p-6 lg:p-8 rounded-xl transition-all duration-300 border-2 ${registrationData.shoppingPreference.includes('women')
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-200 hover:border-[#E2725B]'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center transition-all border-2 ${registrationData.shoppingPreference.includes('women')
                                ? 'bg-[#E2725B] border-[#E2725B]'
                                : 'bg-orange-100 border-gray-200 group-hover:border-[#E2725B]'
                                }`}>
                                <User size={24} className={`sm:w-7 sm:h-7 rounded-xl lg:w-8 lg:h-8 ${registrationData.shoppingPreference.includes('women') ? 'text-white' : 'text-orange-700'}`} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <h3 className={`font-medium text-base sm:text-lg lg:text-xl mb-0.5 sm:mb-1 ${registrationData.shoppingPreference.includes('women') ? 'text-white' : 'text-white'
                                    }`}>
                                    Women's Collection
                                </h3>
                                <p className={`text-xs sm:text-sm ${registrationData.shoppingPreference.includes('women') ? 'text-gray-300' : 'text-gray-500'
                                    }`}>
                                    Tailored for women's fashion
                                </p>
                            </div>
                        </div>
                        {registrationData.shoppingPreference.includes('women') && (
                            <Check size={24} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#E2725B] animate-in zoom-in duration-300" strokeWidth={3} />
                        )}
                    </div>
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black mb-3 sm:mb-4 tracking-tight">
                    Choose your style
                </h2>
                <p className="text-gray-500 text-sm sm:text-base">
                    Select the type that matches your preference
                </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <button
                    onClick={() => handleTypeSelect('bespoke')}
                    className={`group w-full p-5 sm:p-6 lg:p-8 rounded-xl  transition-all duration-300 border-2 ${registrationData.shoppingPreference.includes('bespoke')
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-200 hover:border-[#E2725B]'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14  rounded-xl lg:w-16 lg:h-16 flex items-center justify-center transition-all border-2 ${registrationData.shoppingPreference.includes('bespoke')
                                ? 'bg-[#E2725B] border-[#E2725B]'
                                : 'bg-orange-100 border-gray-200 group-hover:border-[#E2725B]'
                                }`}>
                                <Scissors size={24} className={`sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${registrationData.shoppingPreference.includes('bespoke') ? 'text-white' : 'text-orange-700'}`} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <h3 className={`font-medium text-base sm:text-lg lg:text-xl mb-0.5 sm:mb-1 ${registrationData.shoppingPreference.includes('bespoke') ? 'text-white' : 'text-white'
                                    }`}>
                                    Bespoke
                                </h3>
                                <p className={`text-xs sm:text-sm ${registrationData.shoppingPreference.includes('bespoke') ? 'text-gray-300' : 'text-gray-500'
                                    }`}>
                                    Custom-made to your exact measurements
                                </p>
                            </div>
                        </div>
                        {registrationData.shoppingPreference.includes('bespoke') && (
                            <Check size={24} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#E2725B] animate-in zoom-in duration-300" strokeWidth={3} />
                        )}
                    </div>
                </button>

                <button
                    onClick={() => handleTypeSelect('ready-to-wear')}
                    className={`group w-full p-5 sm:p-6 lg:p-8 rounded-xl  transition-all duration-300 border-2 ${registrationData.shoppingPreference.includes('ready-to-wear')
                        ? 'bg-black border-black'
                        : 'bg-white border-gray-200 hover:border-[#E2725B]'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 rounded-xl  lg:h-16 flex items-center justify-center transition-all border-2 ${registrationData.shoppingPreference.includes('ready-to-wear')
                                ? 'bg-[#E2725B] border-[#E2725B]'
                                : 'bg-white border-gray-200 group-hover:border-[#E2725B]'
                                }`}>
                                <Package size={24} className={`sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${registrationData.shoppingPreference.includes('ready-to-wear') ? 'text-white' : 'text-black'}`} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <h3 className={`font-medium text-base sm:text-lg lg:text-xl mb-0.5 sm:mb-1 ${registrationData.shoppingPreference.includes('ready-to-wear') ? 'text-white' : 'text-white'
                                    }`}>
                                    Ready-to-Wear
                                </h3>
                                <p className={`text-xs sm:text-sm ${registrationData.shoppingPreference.includes('ready-to-wear') ? 'text-gray-300' : 'text-gray-500'
                                    }`}>
                                    Pre-made in standard sizes
                                </p>
                            </div>
                        </div>
                        {registrationData.shoppingPreference.includes('ready-to-wear') && (
                            <Check size={24} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#E2725B] animate-in zoom-in duration-300" strokeWidth={3} />
                        )}
                    </div>
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black mb-3 sm:mb-4 tracking-tight">
                    Almost there!
                </h2>
                <p className="text-gray-500 text-sm sm:text-base">
                    Create your account to get started
                </p>
            </div>

            {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-[#E2725B] animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4 sm:space-y-6">
                <div className="text-left">
                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-black mb-2 uppercase tracking-wide">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={registrationData.email}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-3 sm:px-4 sm:py-4 border-2 border-gray-200 focus:outline-none focus:border-[#E2725B] transition-all text-sm sm:text-base"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="text-left">
                    <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-black mb-2 uppercase tracking-wide">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={registrationData.password}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-3 sm:px-4 sm:py-4 border-2 border-gray-200 focus:outline-none focus:border-[#E2725B] transition-all text-sm sm:text-base"
                            placeholder="Minimum 6 characters"
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                        >
                            {showPassword ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </span>
                    </div>
                    <p className="mt-2 text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Must be at least 6 characters</p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !canProceedToNext()}
                    className="w-full flex justify-center items-center py-4 sm:py-5 px-4 sm:px-6 border-2 border-black bg-black text-white text-sm sm:text-base font-medium uppercase tracking-wider hover:bg-[#E2725B] hover:border-[#E2725B] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {loading ? (
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Creating Account...</span>
                        </div>
                    ) : (
                        <>
                            <span>Create Account</span>
                            <ArrowRight size={18} className="ml-2 sm:ml-3 sm:w-5 sm:h-5" strokeWidth={2} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderProgressBar()}

            <div className="mb-4 sm:mb-6 lg:mb-8">
                <span
                    onClick={handlePrevious}
                    className="group cursor-pointer flex items-center text-xs sm:text-sm font-medium text-gray-600 hover:text-black transition-all uppercase tracking-wider"
                >
                    <ArrowLeft size={14} className="mr-2 transition-transform group-hover:-translate-x-1 sm:w-4 sm:h-4" strokeWidth={2} />
                    {currentStep === 1 ? 'Back to Sign In' : 'Previous'}
                </span>
            </div>

            <div className="bg-white border border-gray-100 sm:border-2 p-4 sm:p-6 lg:p-12">
                {renderCurrentStep()}
            </div>

            {/* Summary of selections */}
            {currentStep > 1 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 lg:p-6 bg-gray-50 border border-gray-200 sm:border-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h4 className="text-[10px] sm:text-xs font-bold text-black mb-2 sm:mb-3 lg:mb-4 uppercase tracking-widest flex items-center">
                        <div className="w-1 h-3 sm:h-4 bg-[#E2725B] mr-2 sm:mr-3"></div>
                        Your Selections
                    </h4>
                    <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                        {(registrationData.shoppingPreference.includes('men') || registrationData.shoppingPreference.includes('women')) && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-700">
                                <span className="font-medium text-black uppercase tracking-wide text-[10px] sm:text-xs">Preference:</span>
                                <span className="ml-2 sm:ml-3">
                                    {registrationData.shoppingPreference.includes('men') ? "Men's Collection" : ""}
                                    {registrationData.shoppingPreference.includes('women') && registrationData.shoppingPreference.includes('men') ? ", " : ""}
                                    {registrationData.shoppingPreference.includes('women') ? "Women's Collection" : ""}
                                </span>
                            </div>
                        )}
                        {(registrationData.shoppingPreference.includes('bespoke') || registrationData.shoppingPreference.includes('ready-to-wear')) && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-700">
                                <span className="font-medium text-black uppercase tracking-wide text-[10px] sm:text-xs">Style:</span>
                                <span className="ml-2 sm:ml-3">
                                    {registrationData.shoppingPreference.includes('bespoke') ? 'Bespoke' : ""}
                                    {registrationData.shoppingPreference.includes('bespoke') && registrationData.shoppingPreference.includes('ready-to-wear') ? ", " : ""}
                                    {registrationData.shoppingPreference.includes('ready-to-wear') ? 'Ready-to-Wear' : ""}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};