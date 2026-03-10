"use client"

import type React from "react"

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { NewsService } from "@/admin-services/news-service"

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return
      if (images.length + files.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed`)
        return
      }

      setUploading(true)
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          if (!file.type.startsWith("image/")) {
            throw new Error(`${file.name} is not an image file`)
          }
          const timestamp = Date.now()
          return await NewsService.uploadImage(file, timestamp.toString())
        })

        const uploadedUrls = await Promise.all(uploadPromises)
        onChange([...images, ...uploadedUrls])
      } catch (error) {
        console.error("Error uploading images:", error)
        alert("Error uploading images. Please try again.")
      } finally {
        setUploading(false)
      }
    },
    [images, onChange, maxImages],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFileUpload(e.dataTransfer.files)
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver
            ? "border-rose-400 bg-rose-50 dark:bg-rose-900/10"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {uploading ? "Uploading images..." : "Upload images"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop images here, or click to select files
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label htmlFor="image-upload">
                <Button variant="outline" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose Images
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maximum {maxImages} images • JPG, PNG, GIF up to 10MB each
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <Card key={index} className="group relative overflow-hidden">
              <div className="relative aspect-square">
                <Image src={imageUrl || "/placeholder.svg"} alt={`Upload ${index + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="destructive" onClick={() => removeImage(index)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-rose-600 text-white text-xs px-2 py-1 rounded">Featured</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {images.length} of {maxImages} images uploaded. The first image will be used as the featured image.
        </p>
      )}
    </div>
  )
}
