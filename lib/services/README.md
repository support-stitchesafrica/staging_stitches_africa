# Email Image Upload Service

This service provides image upload functionality specifically designed for the email builder component. It handles file validation, image processing, and Firebase Storage integration.

## Features

- **File Validation**: Supports JPEG, PNG, GIF, and WebP formats with size limits
- **Image Processing**: Optimizes images for email delivery (max 800px width, JPEG compression)
- **Progress Tracking**: Real-time upload progress with callbacks
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Firebase Integration**: Seamless integration with existing Firebase Storage
- **Organized Storage**: Proper folder structure for email images

## Usage

### Basic Upload

```typescript
import { uploadEmailImage } from '@/lib/services/emailImageUpload';

const handleUpload = async (file: File, userId?: string) => {
  try {
    const imageUrl = await uploadEmailImage(
      file,
      userId,
      (progress) => console.log(`Progress: ${progress}%`),
      (error) => console.error('Error:', error),
      (url) => console.log('Success:', url)
    );
    return imageUrl;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Service Instance

```typescript
import { emailImageUploadService } from '@/lib/services/emailImageUpload';

// Validate file before upload
const validation = emailImageUploadService.validateImageFile(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Upload with progress tracking
const imageUrl = await emailImageUploadService.uploadImage(
  file,
  userId,
  onProgress,
  onError,
  onSuccess
);

// Cancel upload if needed
emailImageUploadService.cancelUpload();
```

## Integration with Email Builder

The service is designed to integrate seamlessly with the existing email builder component. See `emailImageUpload.example.ts` for detailed integration examples including:

- Block state management
- Drag and drop support
- File input handling
- Progress indicators
- Error handling

## File Structure

Uploaded images are organized in Firebase Storage as:
```
email-images/
├── {userId}/
│   ├── {timestamp}_{filename}.jpg
│   └── ...
└── anonymous/
    ├── {timestamp}_{filename}.jpg
    └── ...
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **1.2**: File validation for image types and size limits
- **1.5**: Image processing pipeline integration
- **4.1**: Proper folder structure organization
- **4.2**: Unique filename generation
- **4.3**: Image processing pipeline application
- **4.4**: File validation before upload