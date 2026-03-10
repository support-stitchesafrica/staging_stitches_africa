# Image Compression and Resizing Guide

## Overview

The Merchant Storefront Upgrade system includes automatic image compression and resizing functionality to optimize media assets for web delivery. This ensures fast loading times and consistent image dimensions across all storefronts.

## Features

### Automatic Image Processing
- **Format Conversion**: All uploaded images are converted to JPEG format for optimal web delivery
- **Compression**: Images are compressed using Sharp library with quality settings optimized for each use case
- **Resizing**: Images are automatically resized to predefined dimensions while preserving aspect ratio
- **Metadata Extraction**: Original image dimensions and file information are preserved

### Compression Settings

| Upload Type | Dimensions | Quality | Use Case |
|-------------|------------|---------|----------|
| Logo        | 400x400    | 90%     | Store logos, profile images |
| Banner      | 1200x400   | 85%     | Header banners, promotional images |
| General     | 800x600    | 80%     | General purpose images |

### Supported Formats

**Input Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Output Format:**
- JPEG (all images are converted to JPEG for consistency)

### File Size Limits
- **Images**: Maximum 10MB
- **Videos**: Maximum 100MB

## Technical Implementation

### Sharp Library Configuration

```typescript
const IMAGE_COMPRESSION_SETTINGS = {
  logo: { width: 400, height: 400, quality: 90 },
  banner: { width: 1200, height: 400, quality: 85 },
  general: { width: 800, height: 600, quality: 80 }
};
```

### Processing Pipeline

1. **File Validation**: Check file type and size limits
2. **Buffer Conversion**: Convert File to Buffer for processing
3. **Metadata Extraction**: Get original image dimensions
4. **Resizing**: Resize image using Sharp with aspect ratio preservation
5. **Compression**: Apply JPEG compression with quality settings
6. **Upload**: Store processed image in Firebase Storage
7. **URL Generation**: Generate public download URL

### Aspect Ratio Preservation

Images are resized using Sharp's `fit: 'inside'` option with `withoutEnlargement: true`:

```typescript
.resize(compressionSettings.width, compressionSettings.height, { 
  fit: 'inside',
  withoutEnlargement: true 
})
```

This ensures:
- Images are never enlarged beyond their original size
- Aspect ratio is always preserved
- Images fit within the specified dimensions
- No cropping or distortion occurs

## API Usage

### Upload Endpoint

```
POST /api/media/upload
```

**Form Data Parameters:**
- `file`: The image file to upload
- `vendorId`: Unique identifier for the vendor
- `uploadType`: Type of upload ('logo', 'banner', 'video')

**Response:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/...",
  "metadata": {
    "size": 45678,
    "type": "image/jpeg",
    "dimensions": { "width": 400, "height": 300 }
  }
}
```

### Using MediaUploadService

```typescript
import { mediaUploadService } from '@/lib/storefront/media-service';

const result = await mediaUploadService.uploadFile(file, {
  vendorId: 'vendor123',
  uploadType: 'logo',
  onProgress: (progress) => console.log(`${progress}%`),
  onComplete: (url, metadata) => console.log('Upload complete:', url),
  onError: (error) => console.error('Upload failed:', error)
});
```

## Performance Benefits

### File Size Reduction
- **Logo images**: Typically 60-80% size reduction
- **Banner images**: Typically 70-85% size reduction
- **General images**: Typically 65-80% size reduction

### Loading Speed Improvements
- Faster page load times due to smaller file sizes
- Consistent image dimensions reduce layout shifts
- Optimized JPEG format provides best compression-to-quality ratio

### Storage Optimization
- Reduced Firebase Storage costs
- Consistent file formats simplify management
- Automatic cleanup of original files

## Error Handling

### Validation Errors
- Unsupported file types are rejected with clear error messages
- File size limits are enforced before processing
- Missing required parameters return appropriate error responses

### Processing Errors
- Sharp processing errors are caught and handled gracefully
- Firebase upload failures are retried automatically
- Network errors provide user-friendly feedback

### Fallback Mechanisms
- Failed uploads can be retried
- Original files are preserved until processing completes
- Error states are clearly communicated to users

## Testing

### Unit Tests
- File validation logic
- Compression settings application
- Error handling scenarios
- API response formats

### Integration Tests
- End-to-end upload flow
- Firebase Storage integration
- Sharp processing pipeline
- MediaUploader component functionality

### Demo Page
Visit `/demo/media-upload` to test the upload functionality with real files.

## Monitoring and Analytics

### Upload Metrics
- File size before/after compression
- Processing time per upload
- Success/failure rates
- Popular upload types

### Performance Monitoring
- Average compression ratios
- Storage usage trends
- Error frequency analysis
- User experience metrics

## Future Enhancements

### Planned Features
- **Progressive JPEG**: Enable progressive loading for better UX
- **WebP Support**: Add WebP output format for modern browsers
- **Thumbnail Generation**: Automatic thumbnail creation for galleries
- **Batch Processing**: Support for multiple file uploads
- **Advanced Compression**: AI-powered compression optimization

### Optimization Opportunities
- **CDN Integration**: Serve images through CDN for global performance
- **Lazy Loading**: Implement lazy loading for image galleries
- **Responsive Images**: Generate multiple sizes for responsive design
- **Format Detection**: Serve optimal format based on browser support