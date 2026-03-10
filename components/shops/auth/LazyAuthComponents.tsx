'use client';

import React from 'react';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';
import { createLazyComponent } from '@/components/shops/wrappers/LazyComponentWrapper';

// Lazy load the MeasurementForm component with enhanced runtime protection
const MeasurementForm = createLazyComponent(
    () => import('@/components/shops/measurements/MeasurementForm').then(module => ({ default: module.MeasurementForm })),
    {
        fallback: <LoadingSkeleton />,
        enableHMRBoundary: true,
        moduleKey: 'measurement_form'
    }
);

interface MeasurementFormLazyProps
{
    [key: string]: any;
}

// Note: Error boundary and module loading protection is now handled by createLazyComponent wrapper

export const MeasurementFormLazy: React.FC<MeasurementFormLazyProps> = (props) =>
{
    return <MeasurementForm {...props} />;
};

// Add other lazy auth components with enhanced runtime protection
export const AuthFormLazy = createLazyComponent(
    () => import('@/components/shops/auth/AuthFlowManager').then(module => ({ default: module.AuthFlowManager })),
    {
        fallback: <LoadingSkeleton />,
        enableHMRBoundary: true,
        moduleKey: 'auth_flow_manager'
    }
);

export const AuthFormsLazy = createLazyComponent(
    () => import('@/components/shops/auth/AuthForms').then(module => ({ default: module.AuthForms })),
    {
        fallback: <LoadingSkeleton />,
        enableHMRBoundary: true,
        moduleKey: 'auth_forms'
    }
);