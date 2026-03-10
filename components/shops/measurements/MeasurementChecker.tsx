'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { userRepository } from '@/lib/firestore';
import { Product } from '@/types';
import { AlertTriangle, CheckCircle, Ruler } from 'lucide-react';

interface MeasurementCheckerProps
{
    product: Product;
    onMeasurementsConfirmed?: (hasRequiredMeasurements: boolean) => void;
}

export const MeasurementChecker: React.FC<MeasurementCheckerProps> = ({
    product,
    onMeasurementsConfirmed
}) =>
{
    const { user } = useAuth();
    const [userMeasurements, setUserMeasurements] = useState<Record<string, number> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        if (user && product.type === 'bespoke')
        {
            loadUserMeasurements();
        } else
        {
            setLoading(false);
        }
    }, [user, product]);

    const loadUserMeasurements = async () =>
    {
        if (!user) return;

        setLoading(true);
        try
        {
            const userData = await userRepository.getById(user.uid);
            setUserMeasurements(userData?.measurements || null);
        } catch (error)
        {
            console.error('Error loading user measurements:', error);
            setUserMeasurements(null);
        } finally
        {
            setLoading(false);
        }
    };

    // Calculate measurements status (always do this to avoid conditional hooks)
    const requiredMeasurements = product.bespokeOptions?.measurementsRequired || [];
    const missingMeasurements = requiredMeasurements.filter(
        measurement => !userMeasurements || !userMeasurements[measurement]
    );
    const hasAllMeasurements = missingMeasurements.length === 0;

    // Notify parent component (always call this hook)
    useEffect(() =>
    {
        if (product.type === 'bespoke' && product.bespokeOptions?.measurementsRequired)
        {
            onMeasurementsConfirmed?.(hasAllMeasurements);
        }
    }, [hasAllMeasurements, onMeasurementsConfirmed, product.type, product.bespokeOptions]);

    // Only show for bespoke items
    if (product.type !== 'bespoke' || !product.bespokeOptions?.measurementsRequired)
    {
        return null;
    }

    if (loading)
    {
        return (
            <div className="bg-purple-50 p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-purple-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-purple-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!user)
    {
        return (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-yellow-800 font-medium mb-1">Measurements Required</h4>
                        <p className="text-yellow-700 text-sm mb-3">
                            This bespoke item requires body measurements. Please sign in to add your measurements.
                        </p>
                        <Link href="/shops/auth">
                            <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                                Sign In
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (hasAllMeasurements)
    {
        return (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-green-800 font-medium mb-1">Measurements Complete</h4>
                        <p className="text-green-700 text-sm">
                            You have all required measurements for this bespoke item.
                        </p>
                        <div className="mt-2">
                            <Link href="/shops/measurements">
                                <button className="text-green-700 text-sm font-medium hover:text-green-600 underline">
                                    Update measurements
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                    <h4 className="text-red-800 font-medium mb-1">Missing Measurements</h4>
                    <p className="text-red-700 text-sm mb-2">
                        This bespoke item requires the following measurements:
                    </p>
                    <ul className="text-red-700 text-sm mb-3 list-disc list-inside">
                        {missingMeasurements.map(measurement => (
                            <li key={measurement} className="capitalize">
                                {measurement.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </li>
                        ))}
                    </ul>
                    <Link href="/shops/measurements">
                        <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center space-x-2">
                            <Ruler size={16} />
                            <span>Add Measurements</span>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};