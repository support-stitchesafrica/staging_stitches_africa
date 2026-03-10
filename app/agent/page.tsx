'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AgentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to agent dashboard
    router.replace('/agent/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Redirecting to Agent Dashboard...</p>
      </div>
    </div>
  );
}