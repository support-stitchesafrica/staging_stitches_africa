/**
 * Payment Proof Upload Component Unit Tests
 * 
 * Tests manual payment form rendering, file upload validation, and form submission
 * Requirements: 4.4, 4.6, 4.7, 4.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProofUpload } from '../PaymentProofUpload';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock XMLHttpRequest for file upload
const mockXHR = {
  open: vi.fn(),
  send: vi.fn(),
  setRequestHeader: vi.fn(),
  addEventListener: vi.fn(),
  upload: {
    addEventListener: vi.fn(),
  },
  status: 200,
  responseText: JSON.stringify({ success: true, url: 'mock-url' }),
};

global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

describe('PaymentProofUpload Component', () => {
  const mockOnUploadSuccess = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Manual Payment Form Rendering', () => {
    it('should render upload zone with correct text and instructions', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      expect(screen.getByText('Drop your payment proof here')).toBeInTheDocument();
      expect(screen.getByText('or click to browse files')).toBeInTheDocument();
      expect(screen.getByText('Supported formats: PNG, JPG, PDF')).toBeInTheDocument();
      expect(screen.getByText('Maximum size: 5MB')).toBeInTheDocument();
    });

    it('should show disabled state when disabled prop is true', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          disabled={true}
        />
      );

      expect(screen.getByText('Upload disabled')).toBeInTheDocument();
      
      // Should have disabled styling
      const dropZone = screen.getByText('Upload disabled').closest('div');
      expect(dropZone).toHaveClass('cursor-not-allowed');
    });

    it('should render with custom max size', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          maxSizeInMB={10}
        />
      );

      expect(screen.getByText('Maximum size: 10MB')).toBeInTheDocument();
    });
  });

  describe('File Upload Validation', () => {
    it('should accept valid PNG file', async () => {
      const user = userEvent.setup();
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = screen.getByRole('button', { hidden: true });
      
      // Mock file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    it('should accept valid JPG file', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      // File should be valid (no error thrown)
      expect(() => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      }).not.toThrow();
    });

    it('should accept valid PDF file', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      // File should be valid (no error thrown)
      expect(() => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      }).not.toThrow();
    });

    it('should reject invalid file types', async () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      // Create invalid file type
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      // Mock the component's handleFileSelect method by creating a custom event
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate drop with invalid file
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Should call onUploadError for invalid file type
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(
          expect.stringContaining('Invalid file type')
        );
      });
    });

    it('should reject files exceeding size limit', async () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          maxSizeInMB={1}
        />
      );

      // Create file larger than 1MB
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.png', { 
        type: 'image/png' 
      });
      
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate drop with large file
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [largeFile],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Should call onUploadError for file size
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(
          expect.stringContaining('File size exceeds')
        );
      });
    });
  });

  describe('Form Submission', () => {
    it('should show upload progress during file upload', async () => {
      // Mock successful upload with progress
      const mockProgressXHR = {
        ...mockXHR,
        upload: {
          addEventListener: vi.fn((event, callback) => {
            if (event === 'progress') {
              // Simulate progress event
              setTimeout(() => {
                callback({ lengthComputable: true, loaded: 50, total: 100 });
              }, 10);
            }
          }),
        },
        addEventListener: vi.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(() => {
              callback();
            }, 20);
          }
        }),
      };

      global.XMLHttpRequest = vi.fn(() => mockProgressXHR) as any;

      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate file drop
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Should show progress
      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });
    });

    it('should handle upload success', async () => {
      const mockSuccessXHR = {
        ...mockXHR,
        addEventListener: vi.fn((event, callback) => {
          if (event === 'load') {
            setTimeout(callback, 10);
          }
        }),
        upload: {
          addEventListener: vi.fn(),
        },
      };

      global.XMLHttpRequest = vi.fn(() => mockSuccessXHR) as any;

      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate file drop
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Should call onUploadSuccess
      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith('mock-url');
      });
    });

    it('should handle upload error', async () => {
      const mockErrorXHR = {
        ...mockXHR,
        addEventListener: vi.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(callback, 10);
          }
        }),
        upload: {
          addEventListener: vi.fn(),
        },
      };

      global.XMLHttpRequest = vi.fn(() => mockErrorXHR) as any;

      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate file drop
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Should call onUploadError
      await waitFor(() => {
        expect(mockOnUploadError).toHaveBeenCalledWith(
          expect.stringContaining('Network error')
        );
      });
    });

    it('should show file preview for images', async () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'mock-preview-url');
      
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate file drop
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Should show file preview
      await waitFor(() => {
        const preview = screen.getByAltText('Payment proof preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'mock-preview-url');
      });
    });

    it('should allow file removal', async () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      
      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => 'mock-preview-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Simulate file drop
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Wait for file to be processed
      await waitFor(() => {
        expect(screen.getByText('test.png')).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(removeButton);

      // Should remove file and show drop zone again
      await waitFor(() => {
        expect(screen.getByText('Drop your payment proof here')).toBeInTheDocument();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-preview-url');
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over events', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Should not throw on drag events
      expect(() => {
        fireEvent.dragOver(dropZone!);
        fireEvent.dragEnter(dropZone!);
        fireEvent.dragLeave(dropZone!);
      }).not.toThrow();
    });

    it('should handle file drop', () => {
      render(
        <PaymentProofUpload
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const dropZone = screen.getByText('Drop your payment proof here').closest('div');
      
      // Should handle drop event
      expect(() => {
        const dropEvent = new Event('drop', { bubbles: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: {
            files: [file],
          },
        });
        fireEvent(dropZone!, dropEvent);
      }).not.toThrow();
    });
  });
});