'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import { collectionRepository } from '@/lib/firestore';
import { ProductCollection } from '@/types/collections';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { unpublishCollection } from '@/lib/collections/publish-service';

/**
 * Collections List Page
 * Displays all collections created by the authenticated user
 * Allows navigation to create new collections or edit existing ones
 */
export default function CollectionsPage()
{
    const router = useRouter();
    const { user, collectionsUser, loading: authLoading, hasPermission } = useCollectionsAuth();
    const [collections, setCollections] = useState<ProductCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check permissions
    const canCreate = hasPermission('canCreateCollections');
    const canEdit = hasPermission('canEditCollections');
    const canDelete = hasPermission('canDeleteCollections');

    // Fetch user's collections
    useEffect(() =>
    {
        const fetchCollections = async () =>
        {
            if (!user)
            {
                setLoading(false);
                return;
            }

            try
            {
                setLoading(true);
                setError(null);
                const userCollections = await collectionRepository.getByUserId(user.uid);
                setCollections(userCollections);
            } catch (err)
            {
                console.error('Error fetching collections:', err);
                setError('Failed to load collections. Please try again.');
                toast.error('Failed to load collections', {
                    description: 'Please refresh the page to try again.',
                });
            } finally
            {
                setLoading(false);
            }
        };

        if (!authLoading)
        {
            fetchCollections();
        }
    }, [user, authLoading]);

    // Handle delete collection
    const handleDelete = async (collectionId: string) =>
    {
        // Check permission
        if (!canDelete)
        {
            toast.error('Permission denied', {
                description: 'You do not have permission to delete collections.',
            });
            return;
        }

        try
        {
            await collectionRepository.delete(collectionId);

            // Update local state
            setCollections(prev => prev.filter(c => c.id !== collectionId));

            toast.success('Collection deleted', {
                description: 'The collection has been removed successfully.',
            });
        } catch (err)
        {
            console.error('Error deleting collection:', err);
            toast.error('Failed to delete collection', {
                description: 'Please try again.',
            });
        }
    };

    // Handle unpublish collection
    const handleUnpublish = async (collectionId: string) =>
    {
        try
        {
            await unpublishCollection(collectionId);

            // Update local state
            setCollections(prev =>
                prev.map(c =>
                    c.id === collectionId
                        ? { ...c, published: false, publishedAt: null }
                        : c
                )
            );

            toast.success('Collection unpublished', {
                description: 'The collection has been removed from the landing page.',
            });
        } catch (err)
        {
            console.error('Error unpublishing collection:', err);
            toast.error('Failed to unpublish collection', {
                description: 'Please try again.',
            });
        }
    };

    // Handle navigate to editor
    const handleEdit = (collectionId: string) =>
    {
        // Check permission
        if (!canEdit)
        {
            toast.error('Permission denied', {
                description: 'You do not have permission to edit collections.',
            });
            return;
        }

        router.push(`/collections/${collectionId}/banner`);
    };

    // Handle create new collection
    const handleCreateNew = () =>
    {
        // Check permission
        if (!canCreate)
        {
            toast.error('Permission denied', {
                description: 'You do not have permission to create collections.',
            });
            return;
        }

        router.push('/collections/products');
    };

    // Note: Authentication redirect is handled by the layout
    // No need to redirect here as the layout will show appropriate content

    // Show loading state
    if (authLoading || loading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600" />
                    <p className="mt-4 text-gray-600">Loading collections...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Dashboard
                        </h1>
                        <p className="text-gray-600">
                            Welcome back, {collectionsUser?.fullName || 'User'}! Manage your product collections and promotional designs.
                        </p>
                    </div>
                    {canCreate && (
                        <Button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            Create New Collection
                        </Button>
                    )}
                </div>
            </div>

            {/* Collections Grid */}
            {collections.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <Plus className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No collections yet
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {canCreate
                            ? 'Get started by creating your first product collection. Design beautiful promotional materials for your products.'
                            : 'No collections are available to view at this time.'}
                    </p>
                    {canCreate && (
                        <Button
                            onClick={handleCreateNew}
                            className="bg-black hover:bg-gray-800 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Collection
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onUnpublish={handleUnpublish}
                            canEdit={canEdit}
                            canDelete={canDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
