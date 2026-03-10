'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { ReactNode } from 'react';

interface ResponsiveChartContainerProps {
  children: ReactNode;
  mobileHeight?: number;
  desktopHeight?: number;
}

/**
 * Wrapper component that adjusts chart dimensions based on device size
 * Optimizes charts for touch interaction on mobile devices
 */
export function ResponsiveChartContainer({
  children,
  mobileHeight = 250,
  desktopHeight = 350
}: ResponsiveChartContainerProps) {
  const isMobile = useIsMobile();
  
  return (
    <div 
      style={{ height: isMobile ? mobileHeight : desktopHeight }}
      className="touch-pan-y"
    >
      {children}
    </div>
  );
}
