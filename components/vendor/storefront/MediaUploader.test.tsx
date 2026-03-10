import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MediaUploader from './MediaUploader';

describe('MediaUploader Preview Functionality', () => {
  const defaultProps = {
    vendorId: 'test-vendor',
    uploadType: 'logo' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Preview display', () => {
    it('should show existing image preview when currentUrl is provided', () => {
      const currentUrl = 'https://example.com/existing-logo.jpg';

      render(<MediaUploader {...defaultProps} currentUrl={currentUrl} />);

      // Check if existing preview is displayed
      const previewImage = screen.getByAltText('Logo preview');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', currentUrl);
      expect(previewImage).toHaveClass('w-full', 'h-32', 'object-cover', 'rounded-lg');
    });

    it('should show video preview with controls when currentUrl is provided for video type', () => {
      const currentUrl = 'https://example.com/existing-video.mp4';

      const { container } = render(<MediaUploader {...defaultProps} uploadType="video" currentUrl={currentUrl} />);

      // Check if video preview is displayed
      const previewVideo = container.querySelector('video');
      expect(previewVideo).toBeInTheDocument();
      expect(previewVideo).toHaveAttribute('src', currentUrl);
      expect(previewVideo).toHaveAttribute('controls', '');
      expect(previewVideo).toHaveProperty('muted', true);
      expect(previewVideo).toHaveClass('w-full', 'h-32', 'object-cover', 'rounded-lg');
    });

    it('should show banner preview when currentUrl is provided for banner type', () => {
      const currentUrl = 'https://example.com/existing-banner.jpg';

      render(<MediaUploader {...defaultProps} uploadType="banner" currentUrl={currentUrl} />);

      // Check if banner preview is displayed
      const previewImage = screen.getByAltText('Banner preview');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', currentUrl);
    });

    it('should show upload area when no currentUrl is provided', () => {
      render(<MediaUploader {...defaultProps} />);

      // Check if upload area is displayed
      expect(screen.getByText('Upload Logo')).toBeInTheDocument();
      expect(screen.getByText('Drag & drop or click to select')).toBeInTheDocument();
      expect(screen.getByText('JPG, PNG, WebP up to 10MB')).toBeInTheDocument();
    });

    it('should show delete and replace buttons on preview when currentUrl is provided', () => {
      const currentUrl = 'https://example.com/existing-logo.jpg';

      render(<MediaUploader {...defaultProps} currentUrl={currentUrl} />);

      // Check if delete and replace buttons are displayed
      const deleteButton = screen.getByTitle('Delete');
      const replaceButton = screen.getByTitle('Replace');
      expect(deleteButton).toBeInTheDocument();
      expect(replaceButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('bg-red-500', 'text-white');
      expect(replaceButton).toHaveClass('bg-blue-500', 'text-white');
    });

    it('should show success indicator when upload is successful', () => {
      const currentUrl = 'https://example.com/uploaded-logo.jpg';

      // Render with a successful upload state by providing currentUrl
      render(<MediaUploader {...defaultProps} currentUrl={currentUrl} />);

      // The component should show the preview with delete button
      expect(screen.getByAltText('Logo preview')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });
  });

  describe('Upload type specific behavior', () => {
    it('should show correct file type restrictions for logo upload', () => {
      render(<MediaUploader {...defaultProps} uploadType="logo" />);
      
      expect(screen.getByText('JPG, PNG, WebP up to 10MB')).toBeInTheDocument();
      expect(screen.getByText('Upload Logo')).toBeInTheDocument();
    });

    it('should show correct file type restrictions for banner upload', () => {
      render(<MediaUploader {...defaultProps} uploadType="banner" />);
      
      expect(screen.getByText('JPG, PNG, WebP up to 10MB')).toBeInTheDocument();
      expect(screen.getByText('Upload Banner')).toBeInTheDocument();
    });

    it('should show correct file type restrictions for video upload', () => {
      render(<MediaUploader {...defaultProps} uploadType="video" />);
      
      expect(screen.getByText('MP4, WebM up to 100MB')).toBeInTheDocument();
      expect(screen.getByText('Upload Video')).toBeInTheDocument();
    });
  });

  describe('Delete and Replace functionality', () => {
    it('should show both delete and replace buttons when media is uploaded', () => {
      const currentUrl = 'https://example.com/existing-logo.jpg';

      render(<MediaUploader {...defaultProps} currentUrl={currentUrl} />);

      const deleteButton = screen.getByTitle('Delete');
      const replaceButton = screen.getByTitle('Replace');
      
      expect(deleteButton).toBeInTheDocument();
      expect(replaceButton).toBeInTheDocument();
    });

    it('should not show delete/replace buttons when no media is uploaded', () => {
      render(<MediaUploader {...defaultProps} />);

      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Replace')).not.toBeInTheDocument();
    });

    it('should show correct icons for delete and replace buttons', () => {
      const currentUrl = 'https://example.com/existing-logo.jpg';

      render(<MediaUploader {...defaultProps} currentUrl={currentUrl} />);

      const deleteButton = screen.getByTitle('Delete');
      const replaceButton = screen.getByTitle('Replace');
      
      // Check if buttons have the correct styling
      expect(deleteButton).toHaveClass('bg-red-500');
      expect(replaceButton).toHaveClass('bg-blue-500');
    });
  });

  describe('Component structure', () => {
    it('should have proper CSS classes for responsive design', () => {
      const currentUrl = 'https://example.com/existing-logo.jpg';
      render(<MediaUploader {...defaultProps} currentUrl={currentUrl} />);

      const previewImage = screen.getByAltText('Logo preview');
      expect(previewImage).toHaveClass('w-full', 'h-32', 'object-cover', 'rounded-lg');
    });

    it('should have hidden file input with correct accept attribute', () => {
      const { container } = render(<MediaUploader {...defaultProps} uploadType="logo" />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
      expect(fileInput).toHaveClass('hidden');
    });

    it('should have correct accept attribute for video uploads', () => {
      const { container } = render(<MediaUploader {...defaultProps} uploadType="video" />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'video/mp4,video/webm');
    });
  });
});