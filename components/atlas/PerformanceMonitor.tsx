'use client';

import { useEffect, useState } from 'react';

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  componentName,
  children
}) => {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const startTime = Date.now();

  useEffect(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    setLoadTime(duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${componentName} loaded in ${duration}ms`);
    }
  }, [componentName, startTime]);

  return (
    <div data-component={componentName} data-load-time={loadTime}>
      {children}
    </div>
  );
};