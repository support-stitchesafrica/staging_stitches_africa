import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Upload, X } from "lucide-react";
import { uploadImages } from "@/vendor-services/uploadImages";

interface ImageBasedSizeGuideInputProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  tailorId: string;
}

export function ImageBasedSizeGuideInput({
  value = [],
  onChange,
  tailorId,
}: ImageBasedSizeGuideInputProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !tailorId) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 5;
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const urls = await uploadImages(Array.from(files), tailorId);

      clearInterval(interval);
      setUploadProgress(100);

      // Add new images to existing ones
      onChange([...value, ...urls]);

      // Reset progress after successful upload
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (error) {
      console.error("Error uploading size guide images:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Unified Size Guide </h3>
          <p className="text-sm text-gray-500">
            Upload images of your size guide charts. These will be displayed on your product pages.
          </p>
        </div>
        <Button 
          onClick={triggerFileInput} 
          variant="outline" 
          size="sm"
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Add Images"}
        </Button>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Uploaded Images Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <Card key={index} className="relative group">
              <CardHeader className="p-0">
                <img 
                  src={url} 
                  alt={`Size guide ${index + 1}`} 
                  className="w-full h-40 object-contain rounded-t-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-image.jpg"; // fallback placeholder
                  }}
                />
              </CardHeader>
              <CardContent className="p-2">
                <p className="text-xs text-gray-500 truncate">Size Guide #{index + 1}</p>
              </CardContent>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No size guide images</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload images of your size guide charts to help customers choose the right size.
          </p>
          <Button 
            onClick={triggerFileInput} 
            variant="outline" 
            size="sm"
            className="mt-4"
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Add Size Guide Images"}
          </Button>
        </div>
      )}
    </div>
  );
}