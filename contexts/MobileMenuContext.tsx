'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MobileMenuContextType
{
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    toggleMobileMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const useMobileMenu = () =>
{
    const context = useContext(MobileMenuContext);
    if (!context)
    {
        throw new Error('useMobileMenu must be used within a MobileMenuProvider');
    }
    return context;
};

interface MobileMenuProviderProps
{
    children: ReactNode;
}

export const MobileMenuProvider: React.FC<MobileMenuProviderProps> = ({ children }) =>
{
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () =>
    {
        setIsMobileMenuOpen(prev => !prev);
    };

    return (
        <MobileMenuContext.Provider
            value={{
                isMobileMenuOpen,
                setIsMobileMenuOpen,
                toggleMobileMenu,
            }}
        >
            {children}
        </MobileMenuContext.Provider>
    );
};