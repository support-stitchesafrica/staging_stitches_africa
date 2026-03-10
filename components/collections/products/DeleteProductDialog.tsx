'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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
import { CollectionProduct } from '@/types/collections';

interface DeleteProductDialogProps
{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    product: CollectionProduct | null;
}

export function DeleteProductDialog({
    isOpen,
    onClose,
    onConfirm,
    product,
}: DeleteProductDialogProps)
{
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () =>
    {
        setIsDeleting(true);
        try
        {
            await onConfirm();
            onClose();
        } catch (error)
        {
            console.error('Error deleting product:', error);
        } finally
        {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <DialogTitle>Delete Product</DialogTitle>
                    </div>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{product?.title}</strong>?
                        This action cannot be undone and will permanently delete the product and all its images.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex-1"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Product'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
