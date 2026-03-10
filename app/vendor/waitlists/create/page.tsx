"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CollectionCreationForm } from "@/components/vendor/waitlist/CollectionCreationForm";
import { CreateCollectionForm } from "@/types/vendor-waitlist";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

export default function CreateWaitlistPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("tailorToken");
    const uid = localStorage.getItem("tailorUID");

    if (!token || !uid) {
      router.push('/vendor');
      return;
    }

    setUser({ uid });
    setAuthLoading(false);
  }, [router]);

  const handleSubmit = async (data: CreateCollectionForm) => {
    if (!user) {
      toast.error('You must be logged in to create a collection');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendor/waitlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          vendorId: user.uid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create collection');
      }

      const result = await response.json();
      toast.success('Collection created successfully!');
      router.push('/vendor/waitlists');
    } catch (error) {
      console.error('Error creating collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (

		<div className="min-h-screen bg-gray-50">
        <ModernNavbar />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <CollectionCreationForm 
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        user={user}
      />
    </div>
    </div>
  );
}