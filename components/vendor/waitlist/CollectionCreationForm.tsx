"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  X,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Search,
  Package,
} from "lucide-react";
import { CreateCollectionForm, ProductPair, ProductReference } from "@/types/vendor-waitlist";
import { toast } from "sonner";

interface CollectionCreationFormProps {
  onSubmit: (data: CreateCollectionForm) => Promise<void>;
  isLoading?: boolean;
  initialData?: CreateCollectionForm;
  user?: { uid: string } | null; // Add user prop
}

export function CollectionCreationForm({ onSubmit, isLoading = false, initialData, user }: CollectionCreationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateCollectionForm>(
    initialData || {
      name: "",
      description: "",
      imageUrl: "",
      pairedProducts: [],
      featuredProducts: [],
      minSubscribers: 10,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [availableProducts, setAvailableProducts] = useState<ProductReference[]>([]);
  const [searchResults, setSearchResults] = useState<ProductReference[]>([]);
  const [selectedPrimaryProduct, setSelectedPrimaryProduct] = useState<ProductReference | null>(null);
  const [selectedSecondaryProduct, setSelectedSecondaryProduct] = useState<ProductReference | null>(null);
  const [selectionStep, setSelectionStep] = useState<'primary' | 'secondary'>('primary');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  // Load vendor's products
  useEffect(() => {
    loadVendorProducts();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (productSearch.trim()) {
      const filtered = availableProducts.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.category?.toLowerCase().includes(productSearch.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults(availableProducts);
    }
  }, [productSearch, availableProducts]);

  const loadVendorProducts = async () => {
    try {
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      setProductsLoading(true);
      console.log('Loading products for vendor:', user.uid);
      
      const response = await fetch(`/api/vendor/products?vendorId=${user.uid}`);
      console.log('Products API response status:', response.status);
      
      if (response.ok) {
        const products = await response.json();
        console.log('Loaded products:', products);
        setAvailableProducts(products);
        setSearchResults(products);
        
        if (products.length === 0) {
          toast.info('No products found. Create some products first to add them to collections.');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to load products:', response.statusText, errorData);
        toast.error('Failed to load your products');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load your products');
    } finally {
      setProductsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Collection name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Collection name must be at least 3 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Collection name must be less than 100 characters";
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Validate image
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = "Collection image is required";
    }

    // Validate minimum subscribers
    if (formData.minSubscribers < 1) {
      newErrors.minSubscribers = "Minimum subscribers must be at least 1";
    } else if (formData.minSubscribers > 10000) {
      newErrors.minSubscribers = "Minimum subscribers cannot exceed 10,000";
    }

    // Product pairs are now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'collection');

      const response = await fetch('/api/vendor/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setFormData(prev => ({ ...prev, imageUrl: url }));
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleProductSelect = (product: ProductReference) => {
    if (selectionStep === 'primary') {
      setSelectedPrimaryProduct(product);
      setSelectionStep('secondary');
      setProductSearch('');
    } else {
      setSelectedSecondaryProduct(product);
      // Create the pair
      if (selectedPrimaryProduct) {
        addProductPair(selectedPrimaryProduct, product);
      }
      // Reset selection
      resetProductSelection();
    }
  };

  const addFeaturedProduct = (product: ProductReference) => {
    if (!formData.featuredProducts.includes(product.id)) {
      setFormData(prev => ({
        ...prev,
        featuredProducts: [...prev.featuredProducts, product.id],
      }));
      toast.success('Product added to collection');
    } else {
      toast.info('Product is already in the collection');
    }
  };

  const removeFeaturedProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      featuredProducts: prev.featuredProducts.filter(id => id !== productId),
    }));
  };

  const resetProductSelection = () => {
    setSelectedPrimaryProduct(null);
    setSelectedSecondaryProduct(null);
    setSelectionStep('primary');
    setProductSearch('');
    setIsProductDialogOpen(false);
  };

  const addProductPair = (primaryProduct: ProductReference, secondaryProduct: ProductReference) => {
    const newPair: ProductPair = {
      primaryProductId: primaryProduct.id,
      secondaryProductId: secondaryProduct.id,
      relationship: 'buy_with',
      displayOrder: formData.pairedProducts.length,
    };

    setFormData(prev => ({
      ...prev,
      pairedProducts: [...prev.pairedProducts, newPair],
    }));

    toast.success('Product pair added successfully');
  };

  const removeProductPair = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pairedProducts: prev.pairedProducts.filter((_, i) => i !== index),
    }));
  };

  const updateProductRelationship = (index: number, relationship: ProductPair['relationship']) => {
    setFormData(prev => ({
      ...prev,
      pairedProducts: prev.pairedProducts.map((pair, i) =>
        i === index ? { ...pair, relationship } : pair
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      await onSubmit(formData);
      toast.success('Collection created successfully');
      router.push('/vendor/waitlists');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to create collection');
    }
  };

  const getProductById = (id: string): ProductReference | undefined => {
    return availableProducts.find(p => p.id === id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Collection Waitlist</h1>
          <p className="text-gray-600 mt-1">
            Create a curated collection to gauge customer interest before launch
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Collection Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter collection name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your collection and what makes it special"
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Minimum Subscribers */}
            <div className="space-y-2">
              <Label htmlFor="minSubscribers">Minimum Subscribers *</Label>
              <Input
                id="minSubscribers"
                type="number"
                min="1"
                max="10000"
                value={formData.minSubscribers}
                onChange={(e) => setFormData(prev => ({ ...prev, minSubscribers: parseInt(e.target.value) || 1 }))}
                className={errors.minSubscribers ? "border-red-500" : ""}
              />
              <p className="text-sm text-gray-500">
                Number of subscribers needed before launching this collection
              </p>
              {errors.minSubscribers && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.minSubscribers}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Collection Image */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Image *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {formData.imageUrl ? (
                  <div className="relative">
                    <img
                      src={formData.imageUrl}
                      alt="Collection preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Click to upload collection image
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
              {imageUploading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading image...
                </div>
              )}
              {errors.imageUrl && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.imageUrl}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Featured Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Featured Products (Optional)</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Select individual products to showcase in this collection
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Select Products for Collection</DialogTitle>
                    <p className="text-sm text-gray-600">
                      Choose products to feature in this collection
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {productsLoading ? (
                        <div className="col-span-2 flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-gray-600">Loading products...</span>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="font-medium">No products found</p>
                          <p className="text-sm">Create some products first to add them to collections</p>
                        </div>
                      ) : (
                        searchResults.map((product) => {
                          const isSelected = formData.featuredProducts.includes(product.id);
                          return (
                            <div
                              key={product.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  removeFeaturedProduct(product.id);
                                } else {
                                  addFeaturedProduct(product);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {product.images[0] && (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{product.name}</p>
                                  <p className="text-sm text-gray-500">${product.price}</p>
                                  {product.category && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {product.category}
                                    </Badge>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-blue-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.featuredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="font-medium">No featured products added yet</p>
                <p className="text-sm">Add individual products to showcase in this collection</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.featuredProducts.map((productId) => {
                  const product = getProductById(productId);
                  if (!product) return null;
                  
                  return (
                    <div key={productId} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">${product.price}</p>
                          {product.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeaturedProduct(productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Pairs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Pairs (Optional)</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Select products that work well together in this collection. This helps customers discover complementary items.
                </p>
              </div>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product Pair
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectionStep === 'primary' ? 'Select Primary Product' : 'Select Secondary Product'}
                    </DialogTitle>
                    <p className="text-sm text-gray-600">
                      {selectionStep === 'primary' 
                        ? 'Choose the main product for this pair'
                        : `Choose a product that pairs well with "${selectedPrimaryProduct?.name}"`
                      }
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Selection Progress */}
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          selectionStep === 'primary' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          1
                        </div>
                        <span className="text-sm">Primary Product</span>
                        {selectedPrimaryProduct && (
                          <Badge variant="outline" className="text-xs">
                            {selectedPrimaryProduct.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          selectionStep === 'secondary' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                        }`}>
                          2
                        </div>
                        <span className="text-sm">Secondary Product</span>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {productsLoading ? (
                        <div className="col-span-2 flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-gray-600">Loading products...</span>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p className="font-medium">No products found</p>
                          <p className="text-sm">Create some products first to add them to collections</p>
                        </div>
                      ) : (
                        searchResults
                          .filter(product => selectionStep === 'primary' || product.id !== selectedPrimaryProduct?.id)
                          .map((product) => (
                          <div
                            key={product.id}
                            className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleProductSelect(product)}
                          >
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{product.name}</p>
                                <p className="text-sm text-gray-500">${product.price}</p>
                                {product.category && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {product.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetProductSelection}
                      >
                        Cancel
                      </Button>
                      {selectionStep === 'secondary' && selectedPrimaryProduct && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectionStep('primary');
                            setSelectedPrimaryProduct(null);
                            setProductSearch('');
                          }}
                        >
                          Back to Primary
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.pairedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="font-medium">No product pairs added yet</p>
                <p className="text-sm">Product pairs are optional but help customers discover complementary items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.pairedProducts.map((pair, index) => {
                  const primaryProduct = getProductById(pair.primaryProductId);
                  const secondaryProduct = getProductById(pair.secondaryProductId);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Product Pair {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductPair(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {primaryProduct && (
                          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            {primaryProduct.images[0] && (
                              <img
                                src={primaryProduct.images[0]}
                                alt={primaryProduct.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{primaryProduct.name}</p>
                              <p className="text-xs text-gray-500">${primaryProduct.price}</p>
                              <Badge variant="secondary" className="text-xs mt-1">Primary</Badge>
                            </div>
                          </div>
                        )}
                        
                        {secondaryProduct && (
                          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            {secondaryProduct.images[0] && (
                              <img
                                src={secondaryProduct.images[0]}
                                alt={secondaryProduct.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{secondaryProduct.name}</p>
                              <p className="text-xs text-gray-500">${secondaryProduct.price}</p>
                              <Badge variant="outline" className="text-xs mt-1">Secondary</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Relationship</Label>
                        <Select
                          value={pair.relationship}
                          onValueChange={(value) => updateProductRelationship(index, value as ProductPair['relationship'])}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy_with">Frequently Bought Together</SelectItem>
                            <SelectItem value="complete_look">Complete the Look</SelectItem>
                            <SelectItem value="accessory">Perfect Accessory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {errors.pairedProducts && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.pairedProducts}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || imageUploading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Collection...
              </>
            ) : (
              'Create Collection'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}