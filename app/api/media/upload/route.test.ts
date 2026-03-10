import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import sharp from 'sharp';

// Mock Firebase
vi.mock('@/firebase', () => ({
  app: {}
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/test-image.jpg'))
}));

// Mock Sharp
vi.mock('sharp', () => {
  const mockJpeg = vi.fn(() => ({
    toBuffer: vi.fn(() => Promise.resolve(Buffer.from('compressed-image-data')))
  }));
  
  const mockResize = vi.fn(() => ({
    jpeg: mockJpeg
  }));
  
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn(() => Promise.resolve({ width: 1000, height: 800 })),
    resize: mockResize
  }));
  
  return { default: mockSharp };
});

describe('Media Upload API - Image Compression and Resizing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (file: File, vendorId: string, uploadType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vendorId', vendorId);
    formData.append('uploadType', uploadType);

    return {
      formData: vi.fn(() => Promise.resolve(formData))
    } as unknown as NextRequest;
  };

  const createMockImageFile = (name: string, size: number = 1024 * 1024) => {
    const buffer = Buffer.alloc(size);
    const file = new File([buffer], name, { type: 'image/jpeg' });
    // Mock the arrayBuffer method
    (file as any).arrayBuffer = vi.fn(() => Promise.resolve(buffer.buffer));
    return file;
  };

  it('should compress and resize logo images to 400x400', async () => {
    const mockFile = createMockImageFile('logo.jpg');
    const request = createMockRequest(mockFile, 'vendor123', 'logo');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(sharp).toHaveBeenCalledWith(expect.any(Buffer));
    
    const sharpInstance = (sharp as any).mock.results[0].value;
    expect(sharpInstance.resize).toHaveBeenCalledWith(400, 400, {
      fit: 'inside',
      withoutEnlargement: true
    });
    expect(sharpInstance.resize().jpeg).toHaveBeenCalledWith({ quality: 90 });
  });

  it('should compress and resize banner images to 1200x400', async () => {
    const mockFile = createMockImageFile('banner.jpg');
    const request = createMockRequest(mockFile, 'vendor123', 'banner');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(sharp).toHaveBeenCalledWith(expect.any(Buffer));
    
    const sharpInstance = (sharp as any).mock.results[0].value;
    expect(sharpInstance.resize).toHaveBeenCalledWith(1200, 400, {
      fit: 'inside',
      withoutEnlargement: true
    });
    expect(sharpInstance.resize().jpeg).toHaveBeenCalledWith({ quality: 85 });
  });

  it('should compress and resize general images to 800x600', async () => {
    const mockFile = createMockImageFile('general.jpg');
    const request = createMockRequest(mockFile, 'vendor123', 'general');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(sharp).toHaveBeenCalledWith(expect.any(Buffer));
    
    const sharpInstance = (sharp as any).mock.results[0].value;
    expect(sharpInstance.resize).toHaveBeenCalledWith(800, 600, {
      fit: 'inside',
      withoutEnlargement: true
    });
    expect(sharpInstance.resize().jpeg).toHaveBeenCalledWith({ quality: 80 });
  });

  it('should return image dimensions in metadata', async () => {
    const mockFile = createMockImageFile('test.jpg');
    const request = createMockRequest(mockFile, 'vendor123', 'logo');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.dimensions).toEqual({ width: 1000, height: 800 });
    expect(result.metadata.type).toBe('image/jpeg');
    expect(result.metadata.size).toBeGreaterThan(0);
  });

  it('should reject files that are too large', async () => {
    const largeFile = createMockImageFile('large.jpg', 15 * 1024 * 1024); // 15MB
    const request = createMockRequest(largeFile, 'vendor123', 'logo');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Image file too large. Maximum size is 10MB.');
  });

  it('should reject unsupported file types', async () => {
    const buffer = Buffer.alloc(1024);
    const unsupportedFile = new File([buffer], 'test.gif', { type: 'image/gif' });
    // Mock the arrayBuffer method
    (unsupportedFile as any).arrayBuffer = vi.fn(() => Promise.resolve(buffer.buffer));
    const request = createMockRequest(unsupportedFile, 'vendor123', 'logo');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unsupported file type. Please upload JPG, PNG, WebP, MP4, or WebM files.');
  });

  it('should handle missing file', async () => {
    const formData = new FormData();
    formData.append('vendorId', 'vendor123');
    formData.append('uploadType', 'logo');

    const request = {
      formData: vi.fn(() => Promise.resolve(formData))
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error).toBe('No file provided');
  });

  it('should handle missing vendor ID', async () => {
    const mockFile = createMockImageFile('test.jpg');
    const formData = new FormData();
    formData.append('file', mockFile);
    formData.append('uploadType', 'logo');

    const request = {
      formData: vi.fn(() => Promise.resolve(formData))
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Vendor ID is required');
  });

  it('should preserve aspect ratio when resizing', async () => {
    const mockFile = createMockImageFile('test.jpg');
    const request = createMockRequest(mockFile, 'vendor123', 'logo');

    await POST(request);

    const sharpInstance = (sharp as any).mock.results[0].value;
    expect(sharpInstance.resize).toHaveBeenCalledWith(400, 400, {
      fit: 'inside',
      withoutEnlargement: true
    });
  });

  it('should convert all images to JPEG format', async () => {
    const buffer = Buffer.alloc(1024);
    const pngFile = new File([buffer], 'test.png', { type: 'image/png' });
    // Mock the arrayBuffer method
    (pngFile as any).arrayBuffer = vi.fn(() => Promise.resolve(buffer.buffer));
    const request = createMockRequest(pngFile, 'vendor123', 'logo');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    const sharpInstance = (sharp as any).mock.results[0].value;
    expect(sharpInstance.resize().jpeg).toHaveBeenCalledWith({ quality: 90 });
  });

  it('should handle Sharp processing errors gracefully', async () => {
    // Mock Sharp to throw an error
    vi.mocked(sharp).mockImplementationOnce(() => {
      throw new Error('Sharp processing failed');
    });

    const mockFile = createMockImageFile('test.jpg');
    const request = createMockRequest(mockFile, 'vendor123', 'logo');

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to upload file. Please try again.');
  });
});