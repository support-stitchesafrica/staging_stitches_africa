'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductForm, validateProductForm } from './ProductForm';
import { ProductFormData, CollectionProduct } from '@/types/collections';
import { createProducts, uploadProductImages, updateProduct } from '@/lib/collections/product-service';
import { useToast } from '@/hooks/use-toast';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import { useEffect } from 'react';

interface CreateProductDialogProps
{
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (productIds: string[]) => void;
    editProduct?: CollectionProduct | null; // Product to edit (if in edit mode)
    mode?: 'create' | 'edit';
}

// Generate a unique temporary ID for form management
function generateTempId(): string
{
    return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Create an empty product form data object
function createEmptyProduct(): ProductFormData
{
    return {
        id: generateTempId(),
        title: '',
        description: '',
        // quantity: 0, // Removed - not used in pricing
        size: '',
        color: '',
        price: 0,
        enableMultiplePricing: false,
        individualItems: [],
        brandName: '',
        images: [],
        imagePreviewUrls: [],
        owner: {
            name: '',
            email: '',
            phoneNumber: '',
        },
    };
}

export function CreateProductDialog({
    isOpen,
    onClose,
    onSuccess,
    editProduct = null,
    mode = 'create',
}: CreateProductDialogProps)
{
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useCollectionsAuth();

    // State management
    const [products, setProducts] = useState<ProductFormData[]>([createEmptyProduct()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
    const [showErrors, setShowErrors] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set([createEmptyProduct().id]));

    // Initialize form with edit product data
    useEffect(() =>
    {
        if (isOpen && mode === 'edit' && editProduct)
        {
            const formData: ProductFormData = {
                id: editProduct.id,
                title: editProduct.title,
                description: editProduct.description,
                // quantity: editProduct.quantity, // Removed - not used in pricing
                size: editProduct.size,
                color: editProduct.color,
                price: editProduct.price,
                enableMultiplePricing: editProduct.enableMultiplePricing ?? false,
                individualItems: editProduct.individualItems ?? [],
                brandName: editProduct.brandName,
                images: [], // Existing images are URLs, not File objects
                imagePreviewUrls: editProduct.images || [],
                owner: editProduct.owner || { name: '', email: '', phoneNumber: '' },
            };
            setProducts([formData]);
            setExpandedProducts(new Set([editProduct.id]));
            setShowErrors(false); // Reset validation errors when opening
        } else if (isOpen && mode === 'create')
        {
            const initialProduct = createEmptyProduct();
            setProducts([initialProduct]);
            setExpandedProducts(new Set([initialProduct.id]));
            setShowErrors(false); // Reset validation errors when opening
        }
    }, [isOpen, mode, editProduct]);

    // Toggle product expansion
    const toggleProductExpansion = useCallback((productId: string) =>
    {
        setExpandedProducts((prev) =>
        {
            const newSet = new Set(prev);
            if (newSet.has(productId))
            {
                newSet.delete(productId);
            } else
            {
                newSet.add(productId);
            }
            return newSet;
        });
    }, []);

    // Add a new product form
    const handleAddProduct = useCallback(() =>
    {
        const newProduct = createEmptyProduct();
        setProducts((prev) => [...prev, newProduct]);
        setExpandedProducts((prev) => new Set([...prev, newProduct.id]));
        // Don't reset showErrors here - keep existing validation state for other products
    }, []);

    // Remove a product form
    const handleRemoveProduct = useCallback((productId: string) =>
    {
        setProducts((prev) =>
        {
            // Don't allow removing the last product
            if (prev.length === 1)
            {
                toast({
                    title: 'Cannot remove',
                    description: 'At least one product is required',
                    variant: 'destructive',
                });
                return prev;
            }
            return prev.filter((p) => p.id !== productId);
        });
        setExpandedProducts((prev) =>
        {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
        });
    }, [toast]);

    // Update a product form
    const handleProductChange = useCallback((updatedProduct: ProductFormData) =>
    {
        setProducts((prev) =>
            prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
    }, []);

    // Validate all products
    const validationResults = useMemo(() =>
    {
        return products.map((product) => validateProductForm(product));
    }, [products]);

    const allProductsValid = useMemo(() =>
    {
        return validationResults.every((result) => result.isValid);
    }, [validationResults]);

    // Handle form submission
    const handleSubmit = useCallback(async () =>
    {
        // Show validation errors
        setShowErrors(true);

        // Check if all products are valid
        if (!allProductsValid)
        {
            toast({
                title: 'Validation Error',
                description: 'Please fix all errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        // Check if user is authenticated
        if (!user?.uid)
        {
            toast({
                title: 'Authentication Error',
                description: 'You must be logged in to create products',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try
        {
            if (mode === 'edit' && editProduct)
            {
                // Edit mode: Update existing product
                const product = products[0];
                const updates: any = {
                    title: product.title,
                    description: product.description,
                    quantity: product.quantity ? Number(product.quantity) : 0,
                    size: product.size,
                    color: product.color,
                    price: Number(product.price),
                    enableMultiplePricing: product.enableMultiplePricing,
                    individualItems: product.individualItems,
                    brandName: product.brandName,
                    owner: product.owner,
                };

                // Upload new images if any
                if (product.images.length > 0)
                {
                    const imageUrls = await uploadProductImages(
                        product.images,
                        user.uid,
                        editProduct.id,
                        (progress) =>
                        {
                            setUploadProgress((prev) =>
                            {
                                const newMap = new Map(prev);
                                newMap.set(product.id, progress);
                                return newMap;
                            });
                        }
                    );
                    // Combine existing and new images
                    updates.images = [...product.imagePreviewUrls, ...imageUrls];
                } else
                {
                    // Keep existing images
                    updates.images = product.imagePreviewUrls;
                }

                await updateProduct(editProduct.id, updates);

                toast({
                    title: 'Success!',
                    description: 'Product updated successfully',
                });

                if (onSuccess)
                {
                    onSuccess([editProduct.id]);
                }
            } else
            {
                // Create mode: Create new products
                const productDataArray = products.map((product) => ({
                    title: product.title,
                    description: product.description,
                    quantity: product.quantity ? Number(product.quantity) : 0,
                    size: product.size,
                    color: product.color,
                    price: Number(product.price),
                    enableMultiplePricing: product.enableMultiplePricing,
                    individualItems: product.individualItems,
                    brandName: product.brandName,
                    images: [], // Will be updated after upload
                    owner: product.owner,
                }));

                const productIds = await createProducts(productDataArray, user.uid);

                // Upload images for each product and update documents
                const uploadPromises = products.map(async (product, index) =>
                {
                    const productId = productIds[index];

                    if (product.images.length > 0)
                    {
                        const imageUrls = await uploadProductImages(
                            product.images,
                            user.uid,
                            productId,
                            (progress) =>
                            {
                                setUploadProgress((prev) =>
                                {
                                    const newMap = new Map(prev);
                                    newMap.set(product.id, progress);
                                    return newMap;
                                });
                            }
                        );

                        await updateProduct(productId, { images: imageUrls });
                    }
                });

                await Promise.all(uploadPromises);

                toast({
                    title: 'Success!',
                    description: `${products.length} product${products.length > 1 ? 's' : ''} created successfully`,
                });

                if (onSuccess)
                {
                    onSuccess(productIds);
                }

                // Navigate to My Products page
                router.push('/collections/my-products');
            }

            // Close dialog
            onClose();

            // Reset form
            const initialProduct = createEmptyProduct();
            setProducts([initialProduct]);
            setExpandedProducts(new Set([initialProduct.id]));
            setShowErrors(false);
            setUploadProgress(new Map());
        } catch (error)
        {
            console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} products:`, error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : `Failed to ${mode === 'edit' ? 'update' : 'create'} products`,
                variant: 'destructive',
            });
        } finally
        {
            setIsSubmitting(false);
        }
    }, [products, allProductsValid, user, toast, onSuccess, router, onClose, mode, editProduct]);

    // Handle dialog close
    const handleClose = useCallback(() =>
    {
        if (isSubmitting)
        {
            return; // Don't allow closing while submitting
        }

        // Reset form
        const initialProduct = createEmptyProduct();
        setProducts([initialProduct]);
        setExpandedProducts(new Set([initialProduct.id]));
        setShowErrors(false);
        setUploadProgress(new Map());

        onClose();
    }, [isSubmitting, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Product' : 'Create Collection Products'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'edit'
                            ? 'Update product details. All fields are required.'
                            : 'Add one or more products to your collection. All fields are required.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 overflow-y-auto bg-white">
                    <div className="space-y-4 py-4 pb-6">
                        {products.map((product, index) =>
                        {
                            const isExpanded = expandedProducts.has(product.id);
                            const validation = validationResults[index];
                            const hasErrors = showErrors && !validation.isValid;

                            return (
                                <div
                                    key={product.id}
                                    className={`border rounded-lg transition-all ${hasErrors ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
                                        }`}
                                >
                                    {/* Product Header - Collapsible */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleProductExpansion(product.id)}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                type="button"
                                                className="text-gray-700 hover:text-gray-900"
                                                onClick={(e) =>
                                                {
                                                    e.stopPropagation();
                                                    toggleProductExpansion(product.id);
                                                }}
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-gray-900 hover:text-black">
                                                    Product {index + 1}
                                                    {product.title && (
                                                        <span className="text-sm font-normal text-gray-700 ml-2">
                                                            - {product.title}
                                                        </span>
                                                    )}
                                                </h3>
                                                {hasErrors && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        Please fix validation errors
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {products.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) =>
                                                {
                                                    e.stopPropagation();
                                                    handleRemoveProduct(product.id);
                                                }}
                                                disabled={isSubmitting}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remove
                                            </Button>
                                        )}
                                    </div>

                                    {/* Product Form - Collapsible Content */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                                            <ProductForm
                                                productData={product}
                                                onProductChange={handleProductChange}
                                                uploadProgress={uploadProgress.get(product.id)}
                                                showErrors={showErrors}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Product Button - Inside Scroll Area (only in create mode) */}
                        {mode === 'create' && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAddProduct}
                                disabled={isSubmitting}
                                className="w-full border-dashed border-2 h-12"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Another Product
                            </Button>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t flex-shrink-0 flex-col gap-2">
                    {/* Validation errors - Only show after user tries to submit */}
                    {showErrors && !allProductsValid && (
                        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                            <div className="font-semibold text-yellow-800 mb-2">Validation Errors:</div>
                            {validationResults.map((result, index) =>
                            {
                                if (result.isValid) return null;
                                const errorFields = Object.keys(result.errors).filter(key => {
                                    const errorValue = result.errors[key as keyof typeof result.errors];
                                    return typeof errorValue === 'string';
                                });
                                if (errorFields.length === 0 && !result.errors.itemErrors) return null;
                                return (
                                    <div key={index} className="mb-2 last:mb-0">
                                        <span className="font-medium text-yellow-800">Product {index + 1}:</span>
                                        <ul className="list-disc list-inside ml-2 text-yellow-700">
                                            {errorFields.map(field => (
                                                <li key={field}>
                                                    {field}: {result.errors[field as keyof typeof result.errors] as string}
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {/* Display individual item errors if they exist */}
                                        {result.errors.itemErrors && (
                                            <ul className="list-disc list-inside ml-2 text-yellow-700 mt-1">
                                                {Object.entries(result.errors.itemErrors).map(([itemId, itemError]) => (
                                                    <li key={itemId}>
                                                        Item: {
                                                            Object.entries(itemError)
                                                                .filter(([_, value]) => value)
                                                                .map(([subField, subError]) => `${subField}: ${subError}`)
                                                                .join(', ')
                                                        }
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="flex flex-row gap-2 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                                </>
                            ) : mode === 'edit' ? (
                                'Update Product'
                            ) : (
                                `Create ${products.length} Product${products.length > 1 ? 's' : ''}`
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
