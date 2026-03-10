'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Oops! Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8">
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={reset} 
              className="flex items-center justify-center gap-2 px-6"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh page
            </Button>
            
            <Link href="/">
              <Button 
                variant="ghost"
                className="flex items-center justify-center gap-2 px-6"
              >
                <Home className="h-4 w-4" />
                Go home
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Error ID: {error.digest || 'unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}