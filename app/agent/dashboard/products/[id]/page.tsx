"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  getTailorWorkById,
  updateTailorWork 
} from "@/agent-services/tailorWorks";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface SizeOption {
  label: string;
  quantity: number;
}

interface TailorWork {
  id: string;
  title: string;
  description: string;
  price: string;
  discount: string;
  category: string;
  wearCategory: string;
  sizes: SizeOption[];
  tags: string;
  keywords: string;
  isNew: boolean;
  wearQuantity: string;
  type: string;
  images: string[];
  customSizes: string;
  agentName: string;
  is_disabled?: boolean;
}

export default function TailorWorkDetailPage() {
  const params = useParams();
  const workId = params.id as string;
  
  const [work, setWork] = useState<TailorWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<any>({});

  // Fetch tailor work by ID
  const fetchWork = async () => {
    if (!workId) return;
    
    setLoading(true);
    const res = await getTailorWorkById(workId);
    if (res.success) {
      setWork(res?.data as TailorWork);
      setFormState(res?.data as TailorWork);
    } else {
      toast.error(res.message || "Failed to fetch work");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWork();
  }, [workId]);

  // Open edit dialog
  const openEdit = () => {
    if (work) {
      setFormState({ ...work });
      setIsEditing(true);
    }
  };

  // Disable/Enable work
  const handleToggleDisable = async () => {
    if (!work) return;
    const res = await updateTailorWork(work.id, { is_disabled: !work.is_disabled });
    if (res.success) {
      toast.success(
        work.is_disabled ? "Tailor work enabled" : "Tailor work disabled"
      );
      fetchWork();
    } else {
      toast.error(res.message || "Failed to update status");
    }
  };

  // Handle form changes
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  // Handle sizes
  const handleSizeChange = (index: number, field: "label" | "quantity", value: string) => {
    const updatedSizes = [...formState.sizes];
    if (field === "quantity") {
      updatedSizes[index][field] = parseInt(value) || 0;
    } else {
      updatedSizes[index][field] = value;
    }
    setFormState((prev: any) => ({ ...prev, sizes: updatedSizes }));
  };

  const addSize = () => {
    setFormState((prev: any) => ({
      ...prev,
      sizes: [...(prev.sizes || []), { label: "", quantity: 0 }],
    }));
  };

  const removeSize = (index: number) => {
    const updatedSizes = [...(formState.sizes || [])];
    updatedSizes.splice(index, 1);
    setFormState((prev: any) => ({ ...prev, sizes: updatedSizes }));
  };

  // Save changes
  const handleUpdate = async () => {
    if (!work) return;
    const res = await updateTailorWork(work.id, formState);
    if (res.success) {
      toast.success("Tailor work updated");
      setIsEditing(false);
      fetchWork();
    } else {
      toast.error(res.message || "Failed to update work");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader className="animate-spin h-6 w-6 text-gray-600" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No tailor work found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tailor Work Details</h1>
        <Badge variant="outline" className="text-sm py-1 px-3">
          ID: {workId}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="aspect-square relative bg-gray-100">
              <Image
                src={work.images?.[0] || "/placeholder.svg"}
                alt={work.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Status Badges */}
            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-2">
                <Badge variant={work.type === "bespoke" ? "default" : "secondary"} className="text-xs">
                  {work.type}
                </Badge>
                {work.isNew && <Badge className="bg-blue-600 text-white text-xs">New</Badge>}
                {work.is_disabled && <Badge className="bg-red-600 text-white text-xs">Disabled</Badge>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Details Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{work.title}</h2>
              <p className="text-gray-600">by <span className="font-medium">{work.agentName}</span></p>
            </div>
            
            {/* Price and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof work.price === 'object' && work.price !== null 
                    ? (() => {
                        const priceObj = work.price as any;
                        const currency = priceObj.currency || 'USD';
                        const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
                        return `${symbol}${priceObj.base || '0'}`;
                      })()
                    : `$${work.price || '0'}`}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Available Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{work.wearQuantity}</p>
              </div>
            </div>
            
            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="font-medium text-gray-900">{work.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Wear Category</p>
                <p className="font-medium text-gray-900">{work.wearCategory}</p>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Description</h3>
              <p className="text-gray-800 leading-relaxed">{work.description}</p>
            </div>
            
            {/* Sizes */}
            {work.sizes && work.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Available Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {work.sizes.map((size, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {size.label}: {size.quantity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                onClick={openEdit}
                className="flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Product
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleDisable}
                className="flex-1 sm:flex-none"
              >
                {work.is_disabled ? "Enable Product" : "Disable Product"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tailor Work</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(formState).map(([key, val]) => {
              if (key === "sizes" || key === "id" || key === "images" || key === "agentName") return null;
              return (
                <div key={key} className={key === "description" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-medium capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  {key === "description" || key === "customSizes" || key === "tags" || key === "keywords" ? (
                    <Textarea name={key} value={val as string} onChange={handleFormChange} />
                  ) : key === "price" ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        name={key} 
                        value={
                          typeof val === 'object' && val !== null 
                            ? (val as any).base || '' 
                            : val as string
                        } 
                        onChange={handleFormChange} 
                        className="flex-1"
                      />
                      <select 
                        value={
                          typeof val === 'object' && val !== null 
                            ? (val as any).currency || 'USD'
                            : 'USD'
                        }
                        onChange={(e) => {
                          const newPrice = typeof val === 'object' && val !== null 
                            ? { ...val, currency: e.target.value }
                            : { base: val, currency: e.target.value };
                          setFormState((prev: any) => ({ ...prev, [key]: newPrice }));
                        }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                      </select>
                    </div>
                  ) : (
                    <Input name={key} value={val as string} onChange={handleFormChange} />
                  )}
                </div>
              );
            })}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Sizes</label>
              {Array.isArray(formState.sizes) &&
                formState.sizes.map((s: any, i: any) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <Input
                      placeholder="Label"
                      value={s.label}
                      onChange={(e) => handleSizeChange(i, "label", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={s.quantity}
                      onChange={(e) => handleSizeChange(i, "quantity", e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSize(i)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              <Button variant="outline" size="sm" onClick={addSize} className="mt-2">
                <Plus className="w-4 h-4 mr-1" /> Add Size
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
