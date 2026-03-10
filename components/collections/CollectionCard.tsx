'use client';

import React, { useState } from 'react';
import { ProductCollection } from '@/types/collections';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import
{
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import
{
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Edit, Trash2, Calendar, Package, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface CollectionCardProps
{
    collection: ProductCollection;
    onEdit: (collectionId: string) => void;
    onDelete: (collectionId: string) => void;
    onUnpublish?: (collectionId: string) => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

/**
 * CollectionCard Component
 * Displays a single collection with thumbnail, metadata, and action buttons
 */
export function CollectionCard({
    collection,
    onEdit,
    onDelete,
    onUnpublish,
    canEdit = true,
    canDelete = true
}: CollectionCardProps)
{
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

    // Format date
    const formatDate = (date: Date | any) =>
    {
        try
        {
            // Handle Firestore Timestamp
            if (date && typeof date.toDate === 'function')
            {
                return format(date.toDate(), 'MMM d, yyyy');
            }
            // Handle regular Date
            if (date instanceof Date)
            {
                return format(date, 'MMM d, yyyy');
            }
            // Handle string date
            if (typeof date === 'string')
            {
                return format(new Date(date), 'MMM d, yyyy');
            }
            return 'Unknown date';
        } catch (error)
        {
            console.error('Error formatting date:', error);
            return 'Unknown date';
        }
    };

    const handleEdit = () =>
    {
        onEdit(collection.id);
    };

    const handleDeleteClick = () =>
    {
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () =>
    {
        onDelete(collection.id);
        setShowDeleteDialog(false);
    };

    const handleUnpublishClick = () =>
    {
        setShowUnpublishDialog(true);
    };

    const handleConfirmUnpublish = () =>
    {
        if (onUnpublish)
        {
            onUnpublish(collection.id);
        }
        setShowUnpublishDialog(false);
    };

    return (
        <>
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-200 bg-white border-2 border-gray-200 hover:border-gray-300">
                {/* Thumbnail */}
                <div
                    className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer"
                    onClick={handleEdit}
                >
                    {collection.thumbnail ? (
                        <Image
                            src={collection.thumbnail}
                            alt={collection.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-gray-300" />
                        </div>
                    )}

                    {/* Published Badge */}
                    {collection.published && (
                        <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 hover:bg-green-600">
                                Published
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <CardContent className="p-4">
                    <h3
                        className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={handleEdit}
                    >
                        {collection.name}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-500">
                        {/* Product Count */}
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>
                                {collection.productIds.length}{' '}
                                {collection.productIds.length === 1 ? 'product' : 'products'}
                            </span>
                        </div>

                        {/* Creation Date */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created {formatDate(collection.createdAt)}</span>
                        </div>
                    </div>
                </CardContent>

                {/* Actions */}
                <CardFooter className="p-4 pt-0 flex gap-2 bg-gray-50">
                    <TooltipProvider>
                        {/* Edit Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex-1">
                                    <Button
                                        size="sm"
                                        className="w-full flex items-center gap-2 bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleEdit}
                                        disabled={!canEdit}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {!canEdit && (
                                <TooltipContent>
                                    <p>You don't have permission to edit collections</p>
                                </TooltipContent>
                            )}
                        </Tooltip>

                        {/* Unpublish button - only show if published and handler provided */}
                        {collection.published && onUnpublish && canEdit && (
                            <Button
                                size="sm"
                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={handleUnpublishClick}
                            >
                                <EyeOff className="h-4 w-4" />
                                Unpublish
                            </Button>
                        )}

                        {/* Delete Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <Button
                                        size="sm"
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleDeleteClick}
                                        disabled={!canDelete}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {!canDelete && (
                                <TooltipContent>
                                    <p>You don't have permission to delete collections</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </CardFooter>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{collection.name}&quot;? This action
                            cannot be undone.
                            {collection.published && (
                                <span className="block mt-2 text-orange-600 font-medium">
                                    Warning: This collection is currently published on the landing page.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unpublish Confirmation Dialog */}
            <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unpublish Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unpublish &quot;{collection.name}&quot;?
                            This will remove it from the landing page, but you can publish it again later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmUnpublish}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            Unpublish
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
