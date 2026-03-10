"use client"

import type React from "react"
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Upload, X, ImageIcon, Plus, Check, Package, Info, Tags, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { addTailorWork, TailorWorkPayload } from "@/agent-services/tailorWorks"
import { toast } from "sonner"
import { useTailorsList } from "@/agent-services/useTailorsList"
import { uploadImages } from "@/agent-services/uploadImages"
import { auth } from "../../../../../firebase"

const steps = [
  { id: 1, title: "Basic Info", icon: Info, description: "Product details" },
  { id: 2, title: "Categories", icon: Tags, description: "Classification" },
  { id: 3, title: "Images", icon: ImageIcon, description: "Product photos" },
  { id: 4, title: "Inventory", icon: Package, description: "Stock & pricing" },
  { id: 5, title: "Settings", icon: Settings, description: "Final settings" },
]

type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
};

type FormData = Partial<TailorWorkPayload> & {
  newSizeLabel?: string;
  newSizeQuantity?: string;
};

export default function CreateProductPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const router = useRouter()
  const { tailors } = useTailorsList()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    // Identity
    product_id: "",
    tailor_id: "",
    tailor: "",

    // Basic Info
    title: "",
    description: "",
    category: "men",
    type: "bespoke",
    availability: "in_stock",
    status: "pending",

    // Pricing
    price: { base: 0, currency: "USD" },
    discount: 0,

    // Customisation
    bespokeOptions: {},
    rtwOptions: {},
    customization: {},
    fabricChoices: [],
    styleOptions: [],
    finishingOptions: [],

    // Sizes
    sizes: [],
    measurementsRequired: [],
    customSizes: false,
    userCustomSizes: false,
    userSizes: [],

    // Attributes
    colors: [],
    season: "",
    wear_category: "",
    wear_quantity: 0,
    is_disabled: false,

    // Shipping
    shipping: {
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
      actualWeightKg: 0,
      tierKey: "",
      manualOverride: false,
    },

    // Media
    images: [],

    // Meta
    keywords: [],
    tags: [],
    returnPolicy: "",
    careInstructions: "",
    notesEnabled: false,
    depositAllowed: false,

    // Timelines
    productionTime: "",
    deliveryTimeline: "",
  })

  // Generic input handler
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      if (field.startsWith("price.")) {
        const key = field.split(".")[1] as keyof typeof prev.price
        return { 
          ...prev, 
          price: { 
            ...prev.price, 
            base: prev.price?.base || 0,
            currency: prev.price?.currency || "USD",
            [key]: value 
          } 
        }
      }
      if (field.startsWith("shipping.")) {
        const key = field.split(".")[1] as keyof typeof prev.shipping
        return { 
          ...prev, 
          shipping: { 
            ...prev.shipping, 
            lengthCm: prev.shipping?.lengthCm || 0,
            widthCm: prev.shipping?.widthCm || 0,
            heightCm: prev.shipping?.heightCm || 0,
            actualWeightKg: prev.shipping?.actualWeightKg || 0,
            tierKey: prev.shipping?.tierKey || "",
            manualOverride: prev.shipping?.manualOverride || false,
            [key]: value 
          } 
        }
      }
      return { ...prev, [field]: value }
    })
  }

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        const id = Math.random().toString(36).substr(2, 9)
        const preview = URL.createObjectURL(file)
        setImages(prev => [...prev, { id, file, preview, isPrimary: prev.length === 0 }])
      }
    })
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) filtered[0].isPrimary = true
      return filtered
    })
  }

  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })))
  }

  // Navigation
  const nextStep = () => currentStep < steps.length && setCurrentStep(currentStep + 1)
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1)
  const progress = (currentStep / steps.length) * 100

  // Submit handler
  const handleSubmit = async () => {
    setIsLoading(true)
    const agentId = localStorage.getItem("agentUID") || ""
    const agentName = localStorage.getItem("agentName") || ""
    
    if (!agentId || !formData.tailor_id) {
      toast.error("Missing agent or tailor info")
      setIsLoading(false)
      return
    }
    
    if (images.length === 0) {
      toast.error("Upload at least one image")
      setIsLoading(false)
      return
    }

    try {
      toast.loading("Uploading images...")
      const uploadedUrls = await uploadImages(images.map(i => i.file), formData.tailor_id!)
      toast.dismiss()

      const payload: TailorWorkPayload = {
        // Required fields
        product_id: formData.product_id || Math.random().toString(36).substring(2, 9),
        tailor_id: formData.tailor_id!,
        tailor: tailors.find(t => t.id.toString() === formData.tailor_id)?.name || "",
        title: formData.title || "",
        description: formData.description || "",
        category: formData.category || "men",
        type: formData.type || "bespoke",
        availability: formData.availability || "in_stock",
        status: formData.status || "pending",
        
        // Images
        images: uploadedUrls,
        
        // Pricing
        price: {
          base: Number(formData.price?.base) || 0,
          currency: formData.price?.currency || "USD"
        },
        discount: Number(formData.discount) || 0,
        wear_quantity: Number(formData.wear_quantity) || 0,
        
        // Booleans
        customSizes: Boolean(formData.customSizes),
        userCustomSizes: Boolean(formData.userCustomSizes),
        notesEnabled: Boolean(formData.notesEnabled),
        depositAllowed: Boolean(formData.depositAllowed),
        is_disabled: Boolean(formData.is_disabled),
        
        // Shipping
        shipping: {
          lengthCm: Number(formData.shipping?.lengthCm) || 0,
          widthCm: Number(formData.shipping?.widthCm) || 0,
          heightCm: Number(formData.shipping?.heightCm) || 0,
          actualWeightKg: Number(formData.shipping?.actualWeightKg) || 0,
          tierKey: formData.shipping?.tierKey || "",
          manualOverride: Boolean(formData.shipping?.manualOverride),
        },
        
        // Arrays
        sizes: formData.sizes || [],
        measurementsRequired: formData.measurementsRequired || [],
        userSizes: formData.userSizes || [],
        colors: formData.colors || [],
        fabricChoices: formData.fabricChoices || [],
        styleOptions: formData.styleOptions || [],
        finishingOptions: formData.finishingOptions || [],
        keywords: formData.keywords || [],
        tags: formData.tags || [],
        
        // Objects
        bespokeOptions: formData.bespokeOptions || {},
        rtwOptions: formData.rtwOptions || {},
        customization: formData.customization || {},
        
        // Optional strings
        season: formData.season || "",
        wear_category: formData.wear_category || "",
        returnPolicy: formData.returnPolicy || "",
        careInstructions: formData.careInstructions || "",
        productionTime: formData.productionTime || "",
        deliveryTimeline: formData.deliveryTimeline || "",
      }

      const res = await addTailorWork(payload)
      if (res.success) {
        toast.success("Tailor work added successfully!")
        router.push("/agent/dashboard/products")
      } else {
        toast.error(res.message || "Failed to add tailor work")
      }
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  // Render form per step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Label>Title *</Label>
            <Input value={formData.title} onChange={e => handleInputChange("title", e.target.value)} />
            <Label>Tailor *</Label>
            <Select value={formData.tailor_id} onValueChange={v => handleInputChange("tailor_id", v)}>
              <SelectTrigger><SelectValue placeholder="Choose a tailor" /></SelectTrigger>
              <SelectContent>
                {tailors.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.tailor_registered_info?.["first-name"]} {t.tailor_registered_info?.["last-name"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Type *</Label>
            <Select value={formData.type} onValueChange={v => handleInputChange("type", v)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bespoke">Bespoke</SelectItem>
                <SelectItem value="rtw">Ready to Wear</SelectItem>
              </SelectContent>
            </Select>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={e => handleInputChange("description", e.target.value)} />
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <Label>Category *</Label>
            <Select value={formData.category} onValueChange={v => handleInputChange("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Label>Wear Category</Label>
            <Input value={formData.wear_category} onChange={e => handleInputChange("wear_category", e.target.value)} />
            <Label>Keywords</Label>
            <Input value={formData.keywords?.join(", ")} onChange={e => handleInputChange("keywords", e.target.value.split(",").map(k => k.trim()))} />
            <Label>Tags</Label>
            <Input value={formData.tags?.join(", ")} onChange={e => handleInputChange("tags", e.target.value.split(",").map(t => t.trim()))} />
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed p-8 text-center">
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="images" />
              <label htmlFor="images" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-2" />
                <p>Click to upload images</p>
              </label>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {images.map(img => (
                  <div key={img.id} className="relative group">
                    <Image src={img.preview} alt="preview" width={200} height={200} className="rounded" />
                    {img.isPrimary && <Badge className="absolute top-1 left-1 bg-blue-600">Primary</Badge>}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex justify-center items-center gap-2">
                      {!img.isPrimary && <Button size="sm" onClick={() => setPrimaryImage(img.id)}>Set Primary</Button>}
                      <Button size="sm" variant="destructive" onClick={() => removeImage(img.id)}><X /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <Label>Price ($)</Label>
            <Input type="number" value={formData.price?.base} onChange={e => handleInputChange("price.base", e.target.value)} />
            <Label>Discount (%)</Label>
            <Input type="number" value={formData.discount} onChange={e => handleInputChange("discount", e.target.value)} />
            <Label>Quantity</Label>
            <Input type="number" value={formData.wear_quantity} onChange={e => handleInputChange("wear_quantity", e.target.value)} />
            <Label>Sizes</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Label" 
                value={formData.newSizeLabel || ""} 
                onChange={e => handleInputChange("newSizeLabel", e.target.value)} 
              />
              <Input 
                placeholder="Qty" 
                type="number" 
                value={formData.newSizeQuantity || ""} 
                onChange={e => handleInputChange("newSizeQuantity", e.target.value)} 
              />
              <Button onClick={() => {
                if (formData.newSizeLabel && formData.newSizeQuantity) {
                  const size = { label: formData.newSizeLabel, quantity: Number(formData.newSizeQuantity) }
                  setFormData(prev => ({
                    ...prev,
                    sizes: [...(prev.sizes || []), size],
                    newSizeLabel: "",
                    newSizeQuantity: ""
                  }))
                }
              }}><Plus /> Add</Button>
            </div>
            {formData.sizes && formData.sizes.length > 0 && (
              <div className="space-y-2">
                <Label>Added Sizes:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size, index) => (
                    <Badge key={index} variant="secondary">
                      {size.label} (Qty: {size.quantity})
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            sizes: prev.sizes?.filter((_, i) => i !== index) || []
                          }))
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="notesEnabled"
                checked={formData.notesEnabled} 
                onCheckedChange={v => handleInputChange("notesEnabled", v)} 
              />
              <Label htmlFor="notesEnabled">Enable Notes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="depositAllowed"
                checked={formData.depositAllowed} 
                onCheckedChange={v => handleInputChange("depositAllowed", v)} 
              />
              <Label htmlFor="depositAllowed">Allow Deposit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="customSizes"
                checked={formData.customSizes} 
                onCheckedChange={v => handleInputChange("customSizes", v)} 
              />
              <Label htmlFor="customSizes">Has Custom Sizes</Label>
            </div>
            <div>
              <Label>Production Time</Label>
              <Input 
                value={formData.productionTime || ""} 
                onChange={e => handleInputChange("productionTime", e.target.value)}
                placeholder="e.g., 2-3 weeks"
              />
            </div>
            <div>
              <Label>Delivery Timeline</Label>
              <Input 
                value={formData.deliveryTimeline || ""} 
                onChange={e => handleInputChange("deliveryTimeline", e.target.value)}
                placeholder="e.g., 1-2 weeks after production"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/agent/dashboard/products"><ArrowLeft /> Back</Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Product</h1>
      </div>

      <Card>
        <CardContent>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <Card><CardContent>{renderStepContent()}</CardContent></Card>

      <div className="flex justify-between">
        <Button onClick={prevStep} disabled={currentStep === 1}><ArrowLeft /> Previous</Button>
        {currentStep === steps.length ?
          <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? "Submitting..." : "Create Product"}</Button>
          : <Button onClick={nextStep}>Next <ArrowRight /></Button>
        }
      </div>
    </div>
  )
}
