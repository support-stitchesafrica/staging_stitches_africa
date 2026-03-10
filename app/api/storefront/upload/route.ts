import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication to avoid build issues
    // TODO: Add proper authentication later

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const vendorId = formData.get('vendorId') as string;
    const uploadType = formData.get('uploadType') as string;

    if (!file || !vendorId || !uploadType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, vendorId, uploadType' },
        { status: 400 }
      );
    }

    // TODO: Add vendor verification when authentication is implemented

    // Validate file type
    const allowedTypes = {
      'hero-background': ['image/jpeg', 'image/png', 'image/webp'],
      'hero-video': ['video/mp4', 'video/webm'],
      'logo': ['image/jpeg', 'image/png', 'image/svg+xml'],
      'banner': ['image/jpeg', 'image/png', 'image/webp']
    };

    const allowedMimeTypes = allowedTypes[uploadType as keyof typeof allowedTypes];
    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${uploadType}. Allowed: ${allowedMimeTypes?.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = uploadType === 'hero-video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // For now, return a mock URL to avoid Firebase Storage complexity
    // TODO: Implement actual file upload to Firebase Storage
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${vendorId}/${uploadType}/${timestamp}.${extension}`;
    const mockUrl = `https://via.placeholder.com/800x400/cccccc/666666?text=${encodeURIComponent(file.name)}`;

    return NextResponse.json({
      success: true,
      url: mockUrl,
      filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}