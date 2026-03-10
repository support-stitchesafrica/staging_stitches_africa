"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CollectionCreationForm } from "@/components/vendor/waitlist/CollectionCreationForm";
import { CreateCollectionForm, CollectionWaitlist } from "@/types/vendor-waitlist";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCollectionPage({ params }: EditCollectionPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [collection, setCollection] = useState<CollectionWaitlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("tailorToken");
    const uid = localStorage.getItem("tailorUID");

    if (!token || !uid) {
      router.push("/vendor");
      return;
    }

    setUser({ uid });
    setAuthLoading(false);
  }, [router]);

  useEffect(() => {
    if (!authLoading && user) {
      loadCollection();
    }
  }, [user, authLoading, id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/waitlists/${id}?vendorId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data);
      } else {
        throw new Error('Failed to load collection');
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      toast.error('Failed to load collection');
      router.push('/vendor/waitlists');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: CreateCollectionForm) => {
    if (!user || !collection) {
      toast.error('Unable to update collection');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/vendor/waitlists/${collection.id}`, {
        method: 'PUT',
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
        throw new Error(error.message || 'Failed to update collection');
      }

      toast.success('Collection updated successfully!');
      router.push(`/vendor/waitlists/${collection.id}`);
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Collection Not Found</h1>
            <button onClick={() => router.push('/vendor/waitlists')}>
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Convert collection to form data
  const initialFormData: CreateCollectionForm = {
    name: collection.name,
    description: collection.description,
    imageUrl: collection.imageUrl,
    pairedProducts: collection.pairedProducts,
    featuredProducts: collection.featuredProducts || [],
    minSubscribers: collection.minSubscribers,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Collection</h1>
          <p className="text-gray-600 mt-1">
            Update your collection details and product pairs
          </p>
        </div>
        
        <CollectionCreationForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          initialData={initialFormData}
          user={user}
        />
      </div>
    </div>
  );
}