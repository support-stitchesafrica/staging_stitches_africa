import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mediaUploadService } from './media-service';

// Mock fetch
global.fetch = vi.fn();

describe('MediaUploadService - Image Compression Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockImageFile = (name: string, size: number = 1024 * 1024) => {
    const buffer = Buffer.alloc(size);
    const file = new File([buffer], name, { type: 'image/jpeg' });
    // Mock the arrayBuffer method
    (file as any).arrayBuffer = vi.fn(() => Promise.resolve(buffer.buffer));
    return file;
  };

  it('should validate file types correctly', () => {
    const validJpeg = createMockImageFile('test.jpg');
    const validPng = new File([Buffer.alloc(1024)], 'test.png', { type: 'image/png' });
    const validWebp = new File([Buffer.alloc(1024)], 'test.webp', { type: 'image/webp' });
    const invalidGif = new File([Buffer.alloc(1024)], 'test.gif', { type: 'image/gif' });

    expect(mediaUploadService.validateFile(validJpeg, 'logo')).toEqual({ valid: true });
    expect(mediaUploadService.validateFile(validPng, 'logo')).toEqual({ valid: true });
    expect(mediaUploadService.validateFile(validWebp, 'logo')).toEqual({ valid: true });
    expect(mediaUploadService.validateFile(invalidGif, 'logo')).toEqual({
      valid: false,
      error: 'Unsupported file type. Please upload JPG, PNG, WebP, MP4, or WebM files.'
    });
  });

  it('should validate file sizes correctly', () => {
    const smallImage = createMockImageFile('small.jpg', 1024 * 1024); // 1MB
    const largeImage = createMockImageFile('large.jpg', 15 * 1024 * 1024); // 15MB
    const smallVideo = new File([Buffer.alloc(50 * 1024 * 1024)], 'small.mp4', { type: 'video/mp4' }); // 50MB
    const largeVideo = new File([Buffer.alloc(150 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' }); // 150MB

    expect(mediaUploadService.validateFile(smallImage, 'logo')).toEqual({ valid: true });
    expect(mediaUploadService.validateFile(largeImage, 'logo')).toEqual({
      valid: false,
      error: 'Image file too large. Maximum size is 10MB.'
    });
    expect(mediaUploadService.validateFile(smallVideo, 'video')).toEqual({ valid: true });
    expect(mediaUploadService.validateFile(largeVideo, 'video')).toEqual({
      valid: false,
      error: 'Video file too large. Maximum size is 100MB.'
    });
  });

  it('should format file sizes correctly', () => {
    expect(mediaUploadService.formatFileSize(0)).toBe('0 Bytes');
    expect(mediaUploadService.formatFileSize(1024)).toBe('1 KB');
    expect(mediaUploadService.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(mediaUploadService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    expect(mediaUploadService.formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should generate preview URLs for files', async () => {
    const mockFile = createMockImageFile('test.jpg');
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
      result: 'data:image/jpeg;base64,mockdata'
    };

    global.FileReader = vi.fn(() => mockFileReader) as any;

    const previewPromise = mediaUploadService.generatePreviewUrl(mockFile);
    
    // Simulate FileReader onload
    mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,mockdata' } } as any);
    
    const preview = await previewPromise;
    expect(preview).toBe('data:image/jpeg;base64,mockdata');
  });

  it('should call upload API with correct parameters', async () => {
    const mockFile = createMockImageFile('test.jpg');
    const mockResponse = {
      success: true,
      url: 'https://example.com/uploaded-image.jpg',
      metadata: {
        size: 1024,
        type: 'image/jpeg',
        dimensions: { width: 400, height: 400 }
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    const result = await mediaUploadService.uploadFile(mockFile, {
      vendorId: 'vendor123',
      uploadType: 'logo'
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/media/upload', {
      method: 'POST',
      body: expect.any(FormData)
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle upload errors gracefully', async () => {
    const mockFile = createMockImageFile('test.jpg');
    const mockErrorResponse = {
      success: false,
      error: 'Upload failed'
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve(mockErrorResponse)
    });

    const result = await mediaUploadService.uploadFile(mockFile, {
      vendorId: 'vendor123',
      uploadType: 'logo'
    });

    expect(result).toEqual(mockErrorResponse);
  });

  it('should handle network errors', async () => {
    const mockFile = createMockImageFile('test.jpg');

    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await mediaUploadService.uploadFile(mockFile, {
      vendorId: 'vendor123',
      uploadType: 'logo'
    });

    expect(result).toEqual({
      success: false,
      error: 'Network error'
    });
  });
});