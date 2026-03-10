'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardContextType
{
    isAuthenticated: boolean;
    isLoading: boolean;
    requireAuth: boolean;
    shouldShowHeaderFooter: boolean;
}

const AuthGuardContext = createContext<AuthGuardContextType>({
    isAuthenticated: false,
    isLoading: true,
    requireAuth: false,
    shouldShowHeaderFooter: true,
});

export const useAuthGuard = () =>
{
    const context = useContext(AuthGuardContext);
    if (!context)
    {
        throw new Error('useAuthGuard must be used within a GlobalAuthGuard');
    }
    return context;
};

interface GlobalAuthGuardProps
{
    children: React.ReactNode;
    requireAuth?: boolean;
}

export const GlobalAuthGuard: React.FC<GlobalAuthGuardProps> = ({
    children,
    requireAuth = false
}) =>
{
    const { user, loading } = useAuth();

    const contextValue: AuthGuardContextType = {
        isAuthenticated: !!user,
        isLoading: loading,
        requireAuth,
        shouldShowHeaderFooter: true, // Default to showing header/footer
    };

    return (
        <AuthGuardContext.Provider value={contextValue}>
            {children}
        </AuthGuardContext.Provider>
    );
};