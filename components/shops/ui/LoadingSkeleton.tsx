'use client';

import React, { memo } from 'react';

interface LoadingSkeletonProps {
    variant?: 'auth' | 'measurement' | 'page' | 'button' | 'modal' | 'orders';
    className?: string;
}

const LoadingSkeletonComponent: React.FC<LoadingSkeletonProps> = ({ 
    variant = 'page', 
    className = '' 
}) => {
    const baseClasses = 'animate-pulse bg-gray-200 rounded';

    switch (variant) {
        case 'auth':
            return (
                <div className={`w-full ${className}`}>
                    <div className={`${baseClasses} h-8 w-1/3 mx-auto mb-6`}></div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className={`${baseClasses} h-4 w-1/4`}></div>
                            <div className={`${baseClasses} h-10`}></div>
                        </div>
                        <div className="space-y-2">
                            <div className={`${baseClasses} h-4 w-1/4`}></div>
                            <div className={`${baseClasses} h-10`}></div>
                        </div>
                        <div className={`${baseClasses} h-12`}></div>
                        <div className="relative my-6">
                            <div className={`${baseClasses} h-px`}></div>
                        </div>
                        <div className={`${baseClasses} h-12`}></div>
                    </div>
                </div>
            );

        case 'measurement':
            return (
                <div className={`max-w-4xl mx-auto p-6 ${className}`}>
                    <div className="mb-8 text-center">
                        <div className={`${baseClasses} w-8 h-8 mx-auto mb-4`}></div>
                        <div className={`${baseClasses} h-8 w-1/3 mx-auto mb-2`}></div>
                        <div className={`${baseClasses} h-4 w-2/3 mx-auto`}></div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Array.from({ length: 10 }).map((_, index) => (
                                <div key={index} className="space-y-2">
                                    <div className={`${baseClasses} h-4 w-1/2`}></div>
                                    <div className={`${baseClasses} h-10`}></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-center gap-4">
                            <div className={`${baseClasses} h-12 w-32`}></div>
                            <div className={`${baseClasses} h-12 w-32`}></div>
                        </div>
                    </div>
                </div>
            );

        case 'button':
            return (
                <div className={`${baseClasses} h-10 w-24 ${className}`}></div>
            );

        case 'modal':
            return (
                <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className={`${baseClasses} h-6 w-1/2 mb-4`}></div>
                        <div className="space-y-4">
                            <div className={`${baseClasses} h-4 w-full`}></div>
                            <div className={`${baseClasses} h-4 w-3/4`}></div>
                            <div className={`${baseClasses} h-10 w-full`}></div>
                            <div className="flex justify-end space-x-2">
                                <div className={`${baseClasses} h-10 w-20`}></div>
                                <div className={`${baseClasses} h-10 w-24`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'orders':
            return (
                <div className={`space-y-6 ${className}`}>
                    {/* Order Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 text-center shadow">
                                <div className={`${baseClasses} h-8 w-12 mx-auto mb-2`}></div>
                                <div className={`${baseClasses} h-4 w-16 mx-auto`}></div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className={`${baseClasses} h-10 w-64`}></div>
                            <div className={`${baseClasses} h-10 w-48`}></div>
                            <div className={`${baseClasses} h-6 w-24`}></div>
                        </div>
                    </div>
                    
                    {/* Order Cards */}
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className={`${baseClasses} h-6 w-48 mb-2`}></div>
                                    <div className={`${baseClasses} h-4 w-32`}></div>
                                </div>
                                <div className={`${baseClasses} h-6 w-20`}></div>
                            </div>
                            <div className="flex items-start space-x-4 mb-4">
                                <div className={`${baseClasses} w-16 h-16 rounded-lg`}></div>
                                <div className="flex-1">
                                    <div className={`${baseClasses} h-4 w-full mb-2`}></div>
                                    <div className={`${baseClasses} h-4 w-3/4`}></div>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4 border-t border-gray-100">
                                <div className={`${baseClasses} h-4 w-32`}></div>
                                <div className={`${baseClasses} h-4 w-24`}></div>
                                <div className={`${baseClasses} h-4 w-28`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            );

        case 'page':
        default:
            return (
                <div className={`min-h-screen flex items-center justify-center ${className}`}>
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                </div>
            );
    }
};

// Memoize LoadingSkeleton to prevent unnecessary re-renders
export const LoadingSkeleton = memo(LoadingSkeletonComponent);