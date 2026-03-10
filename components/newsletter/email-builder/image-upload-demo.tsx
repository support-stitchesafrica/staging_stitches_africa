import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ImageUploadButton } from "./image-upload-button"
import { ImageUploadZone } from "./image-upload-zone"

/**
 * Demo component showing how to integrate the image upload components
 * with the existing email builder image block editing
 */
export function ImageUploadDemo()
{
    const [imageUrl, setImageUrl] = useState("")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const handleImageUploaded = (url: string) =>
    {
        setImageUrl(url)
        setUploadError(null)
        console.log("Image uploaded:", url)
    }

    const handleUploadProgress = (progress: number) =>
    {
        setUploadProgress(progress)
        console.log("Upload progress:", progress)
    }

    const handleUploadError = (error: string) =>
    {
        setUploadError(error)
        console.error("Upload error:", error)
    }

    return (
        <div className="space-y-6 p-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Image Upload Components Demo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Traditional URL input */}
                    <div className="space-y-2">
                        <Label>Image URL (Traditional Method)</Label>
                        <Input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <Separator />

                    {/* Upload button */}
                    <div className="space-y-2">
                        <Label>Upload Button Component</Label>
                        <ImageUploadButton
                            onImageUploaded={handleImageUploaded}
                            onUploadProgress={handleUploadProgress}
                            onUploadError={handleUploadError}
                            currentImageUrl={imageUrl}
                        />
                    </div>

                    <Separator />

                    {/* Drag and drop zone */}
                    <div className="space-y-2">
                        <Label>Drag & Drop Zone Component</Label>
                        <ImageUploadZone
                            onImageUploaded={handleImageUploaded}
                            onUploadProgress={handleUploadProgress}
                            onUploadError={handleUploadError}
                            className="min-h-[200px] border-2 border-dashed border-border rounded-lg p-8"
                        >
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <div className="text-muted-foreground">
                                    <p className="text-lg font-medium">Drop an image here</p>
                                    <p className="text-sm">or use the upload button above</p>
                                </div>
                            </div>
                        </ImageUploadZone>
                    </div>

                    {/* Preview */}
                    {imageUrl && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Preview</Label>
                                <div className="border rounded-lg p-4">
                                    <img
                                        src={imageUrl}
                                        alt="Uploaded preview"
                                        className="max-w-full h-auto rounded"
                                        onError={() => setUploadError("Failed to load image")}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Status */}
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>Upload Progress: {uploadProgress}%</p>
                        {uploadError && (
                            <p className="text-destructive">Error: {uploadError}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}