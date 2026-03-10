import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/firebase';
import sharp from 'sharp';

const storage = getStorage(app);

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Image compression settings
const IMAGE_COMPRESSION_SETTINGS = {
  logo: { width: 400, height: 400, quality: 90 },
  banner: { width: 1200, height: 400, quality: 85 },
  general: { width: 800, height: 600, quality: 80 }
};

interface UploadResponse {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vendorId = formData.get('vendorId') as string;
    const uploadType = formData.get('uploadType') as string; // 'logo', 'banner', 'video'
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    if (!vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vendor ID is required' 
      }, { status: 400 });
    }

    // Validate file type and size
    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
    const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
    
    if (!isImage && !isVideo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unsupported file type. Please upload JPG, PNG, WebP, MP4, or WebM files.' 
      }, { status: 400 });
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image file too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ 
        success: false, 
        error: 'Video file too large. Maximum size is 100MB.' 
      }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer = fileBuffer;
    let thumbnailBuffer: Buffer | null = null;
    let dimensions: { width: number; height: number } | undefined;

    // Process images with compression
    if (isImage) {
      const compressionSettings = IMAGE_COMPRESSION_SETTINGS[uploadType as keyof typeof IMAGE_COMPRESSION_SETTINGS] || IMAGE_COMPRESSION_SETTINGS.general;
      
      const sharpInstance = sharp(fileBuffer);
      const metadata = await sharpInstance.metadata();
      dimensions = { width: metadata.width || 0, height: metadata.height || 0 };
      
      processedBuffer = await sharpInstance
        .resize(compressionSettings.width, compressionSettings.height, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: compressionSettings.quality })
        .toBuffer();
    }

    // Generate thumbnail for videos
    if (isVideo) {
      // For now, we'll skip video thumbnail generation as it requires ffmpeg
      // This can be implemented later with a video processing service
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = isImage ? 'jpg' : file.name.split('.').pop();
    const fileName = `${uploadType}_${timestamp}.${fileExtension}`;
    const filePath = `storefronts/${vendorId}/${uploadType}s/${fileName}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, processedBuffer, {
      contentType: isImage ? 'image/jpeg' : file.type,
      customMetadata: {
        originalName: file.name,
        uploadType,
        vendorId,
        uploadedAt: new Date().toISOString()
      }
    });

    const downloadURL = await getDownloadURL(storageRef);

    // Upload thumbnail if exists
    let thumbnailURL: string | undefined;
    if (thumbnailBuffer) {
      const thumbnailPath = `storefronts/${vendorId}/${uploadType}s/thumbnails/thumb_${fileName}`;
      const thumbnailRef = ref(storage, thumbnailPath);
      await uploadBytes(thumbnailRef, thumbnailBuffer, {
        contentType: 'image/jpeg',
        customMetadata: {
          originalName: file.name,
          uploadType: 'thumbnail',
          vendorId,
          uploadedAt: new Date().toISOString()
        }
      });
      thumbnailURL = await getDownloadURL(thumbnailRef);
    }

    return NextResponse.json({
      success: true,
      url: downloadURL,
      thumbnailUrl: thumbnailURL,
      metadata: {
        size: processedBuffer.length,
        type: isImage ? 'image/jpeg' : file.type,
        dimensions
      }
    });

  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload file. Please try again.' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    let filePath = searchParams.get('filePath');
    const vendorId = searchParams.get('vendorId');

    // Handle deletion by URL (from request body)
    if (!filePath) {
      try {
        const body = await request.json();
        const url = body.url;
        const bodyVendorId = body.vendorId;
        
        if (url && bodyVendorId) {
          // Extract file path from Firebase Storage URL
          const urlObj = new URL(url);
          const pathParam = urlObj.pathname.split('/o/')[1];
          if (pathParam) {
            filePath = decodeURIComponent(pathParam.split('?')[0]);
          }
        }
      } catch (e) {
        // If body parsing fails, continue with query params
      }
    }

    if (!filePath || !vendorId) {
      return NextResponse.json({ 
        success: false, 
        error: 'File path and vendor ID are required' 
      }, { status: 400 });
    }

    // Verify the file belongs to the vendor
    if (!filePath.includes(`storefronts/${vendorId}/`)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized to delete this file' 
      }, { status: 403 });
    }

    const { deleteObject } = await import('firebase/storage');
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);

    // Also try to delete thumbnail if it exists
    try {
      const thumbnailPath = filePath.replace(/\/([^/]+)$/, '/thumbnails/thumb_$1');
      const thumbnailRef = ref(storage, thumbnailPath);
      await deleteObject(thumbnailRef);
    } catch (thumbnailError) {
      // Thumbnail deletion is optional, don't fail the main operation
      console.log('Thumbnail deletion failed (this is normal if no thumbnail exists):', thumbnailError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete file' 
    }, { status: 500 });
  }
}