'use client';

import { AgentAuthProvider } from '@/contexts/AgentAuthContext';
import dynamic from 'next/dynamic';

// Dynamically import toaster to reduce initial bundle size
const Toaster = dynamic(() => import('sonner').then(mod => ({ default: mod.Toaster })), {
  ssr: false
});

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {children}
        <Toaster position="top-right" richColors />
      </div>
    </AgentAuthProvider>
  );
}