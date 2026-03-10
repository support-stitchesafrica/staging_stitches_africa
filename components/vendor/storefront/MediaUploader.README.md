# MediaUploader Component

A comprehensive drag & drop file upload component for the Stitches Africa storefront system.

## Features

### ✅ Drag & Drop Interface
- **Visual feedback** during drag operations
- **Drop zone highlighting** when files are dragged over
- **Multiple file type support** (images and videos)
- **Intuitive user experience** with clear visual cues

### ✅ File Upload & Processing
- **Image compression** using Sharp library
- **Automatic resizing** based on upload type (logo, banner, general)
- **Progress tracking** with real-time progress bars
- **Firebase Storage integration** for secure file storage

### ✅ File Validation
- **File type validation** (JPG, PNG, WebP for images; MP4, WebM for videos)
- **File size limits** (10MB for images, 100MB for videos)
- **Real-time error feedback** with clear error messages
- **Client-side validation** before upload starts

### ✅ Preview & Management
- **Image/video previews** after upload
- **Delete functionality** with confirmation
- **Upload status indicators** (success, error, uploading)
- **File metadata display** (size, dimensions, type)

## Usage

```tsx
import MediaUploader from '@/components/vendor/storefront/MediaUploader';

function MyComponent() {
  return (
    <MediaUploader
      vendorId="vendor-123"
      uploadType="logo"
      currentUrl={currentLogoUrl}
      onUploadComplete={(url, metadata) => {
        console.log('Upload complete:', url, metadata);
        // Update your state with the new URL
      }}
      onUploadError={(error) => {
        console.error('Upload failed:', error);
        // Handle error (show notification, etc.)
      }}
      onDelete={() => {
        console.log('File deleted');
        // Update your state to remove the URL
      }}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `vendorId` | `string` | ✅ | Unique identifier for the vendor |
| `uploadType` | `'logo' \| 'banner' \| 'video'` | ✅ | Type of media being uploaded |
| `currentUrl` | `string` | ❌ | URL of currently uploaded file |
| `onUploadComplete` | `(url: string, metadata?: any) => void` | ❌ | Callback when upload succeeds |
| `onUploadError` | `(error: string) => void` | ❌ | Callback when upload fails |
| `onDelete` | `() => void` | ❌ | Callback when file is deleted |
| `className` | `string` | ❌ | Additional CSS classes |
| `maxFiles` | `number` | ❌ | Maximum number of files (default: 1) |

## Upload Types & Specifications

### Logo Upload
- **Dimensions:** Optimized to 400x400px
- **Quality:** 90% JPEG compression
- **Use case:** Store branding, navigation headers

### Banner Upload  
- **Dimensions:** Optimized to 1200x400px
- **Quality:** 85% JPEG compression
- **Use case:** Hero sections, promotional banners

### Video Upload
- **Formats:** MP4, WebM
- **Size limit:** 100MB
- **Use case:** Video backgrounds, promotional content

## API Integration

The component integrates with the `/api/media/upload` endpoint which:

1. **Validates** file type and size
2. **Processes** images with Sharp (compression, resizing)
3. **Uploads** to Firebase Storage with organized folder structure
4. **Returns** download URLs and metadata

### Storage Structure
```
storefronts/
  {vendorId}/
    logos/
      logo_1234567890.jpg
    banners/
      banner_1234567890.jpg
    videos/
      video_1234567890.mp4
```

## Error Handling

The component provides comprehensive error handling for:

- **Invalid file types** - Clear messaging about supported formats
- **File size limits** - Specific limits for images vs videos  
- **Upload failures** - Network issues, server errors
- **Validation errors** - Client-side validation before upload

## Testing

Comprehensive test suite covers:

- ✅ **Component rendering** with different props
- ✅ **Drag & drop interactions** 
- ✅ **File validation** logic
- ✅ **Upload state management**
- ✅ **Error handling** scenarios
- ✅ **Delete functionality**

Run tests with:
```bash
npm test MediaUploader.test.tsx
```

## Demo

A live demo is available at `/demo/media-upload` showing:

- All three upload types (logo, banner, video)
- Drag & drop functionality
- File validation in action
- Upload progress tracking
- Preview and delete capabilities

## Dependencies

- **Sharp** - Image processing and compression
- **Firebase Storage** - File storage and management
- **Lucide React** - Icons for UI elements
- **React** - Component framework

## Browser Support

- ✅ **Modern browsers** with File API support
- ✅ **Drag & drop** API support
- ✅ **FileReader** API for previews
- ✅ **FormData** for file uploads

## Security

- **File type validation** prevents malicious uploads
- **Size limits** prevent abuse
- **Vendor isolation** in storage paths
- **Firebase Security Rules** control access
- **Server-side validation** as backup to client-side checks