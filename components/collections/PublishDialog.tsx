'use client';

import React, { useState } from 'react';
import
{
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface PublishDialogProps
{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    previewImageUrl?: string;
    hasExistingPublished?: boolean;
    existingPublishedName?: string;
}

/**
 * PublishDialog Component
 * 
 * Displays a confirmation dialog before publishing a collection.
 * Shows canvas preview and warns if another collection is already published.
 * 
 * Requirements: 6.1
 */
export function PublishDialog({
    open,
    onOpenChange,
    onConfirm,
    previewImageUrl,
    hasExistingPublished = false,
    existingPublishedName,
}: PublishDialogProps)
{
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () =>
    {
        try
        {
            setIsPublishing(true);
            setError(null);
            await onConfirm();
            onOpenChange(false);
        } catch (err)
        {
            console.error('Error publishing collection:', err);
            setError(err instanceof Error ? err.message : 'Failed to publish collection');
        } finally
        {
            setIsPublishing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Publish Collection</DialogTitle>
                    <DialogDescription>
                        This will make your collection visible on the landing page as a promotional banner.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Canvas Preview */}
                    {previewImageUrl && (
                        <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center" style={{ maxHeight: '400px' }}>
                            <img
                                src={previewImageUrl}
                                alt="Collection preview"
                                className="w-full h-auto object-contain"
                                style={{ maxHeight: '400px' }}
                            />
                        </div>
                    )}

                    {/* Warning if another collection is published */}
                    {hasExistingPublished && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Warning:</strong> Another collection
                                {existingPublishedName && ` "${existingPublishedName}"`} is currently published.
                                Publishing this collection will automatically unpublish the existing one.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Success message */}
                    {!hasExistingPublished && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Your collection will be displayed prominently on the landing page.
                                Visitors can add all products to their cart with one click.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPublishing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPublishing}
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            'Publish Collection'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
