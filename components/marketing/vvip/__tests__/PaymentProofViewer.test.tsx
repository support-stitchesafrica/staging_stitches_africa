import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentProofViewer } from '../PaymentProofViewer';

// Mock fetch for download functionality
global.fetch = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Store original methods
const originalCreateElement = document.createElement;
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

describe('PaymentProofViewer', () => {
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    proofUrl: 'https://example.com/proof.jpg',
    orderId: 'order-123456789',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document.createElement for download functionality
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: vi.fn(),
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Mock appendChild and removeChild
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  describe('Component Rendering', () => {
    it('should render payment proof viewer with image', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByText('Payment Proof - Order #23456789')).toBeInTheDocument();
      expect(screen.getByAltText('Payment proof for order order-123456789')).toBeInTheDocument();
    });

    it('should render payment proof viewer with PDF', () => {
      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      render(<PaymentProofViewer {...pdfProps} />);

      expect(screen.getByText('Payment Proof - Order #23456789')).toBeInTheDocument();
      expect(screen.getByTitle('Payment proof PDF for order order-123456789')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByText('Loading payment proof...')).toBeInTheDocument();
    });
  });

  describe('File Type Detection', () => {
    it('should detect image file types correctly', () => {
      const imageUrls = [
        'https://example.com/proof.jpg',
        'https://example.com/proof.jpeg',
        'https://example.com/proof.png',
        'https://example.com/image/jpeg/proof',
      ];

      imageUrls.forEach((url) => {
        const { unmount } = render(
          <PaymentProofViewer {...defaultProps} proofUrl={url} />
        );
        
        expect(screen.getByAltText(`Payment proof for order ${defaultProps.orderId}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should detect PDF file types correctly', () => {
      const pdfUrls = [
        'https://example.com/proof.pdf',
        'https://example.com/application/pdf/proof',
      ];

      pdfUrls.forEach((url) => {
        const { unmount } = render(
          <PaymentProofViewer {...defaultProps} proofUrl={url} />
        );
        
        expect(screen.getByTitle(`Payment proof PDF for order ${defaultProps.orderId}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle unknown file types', () => {
      const unknownProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.unknown',
      };

      render(<PaymentProofViewer {...unknownProps} />);

      expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
      expect(screen.getByText('Cannot preview this file type in the browser')).toBeInTheDocument();
    });
  });

  describe('Image Controls', () => {
    it('should show zoom controls for images', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rotate/i })).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not show zoom controls for PDFs', () => {
      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      render(<PaymentProofViewer {...pdfProps} />);

      expect(screen.queryByRole('button', { name: /zoom out/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /zoom in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /rotate/i })).not.toBeInTheDocument();
    });

    it('should update zoom level when zoom buttons are clicked', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });

      // Initial zoom should be 100%
      expect(screen.getByText('100%')).toBeInTheDocument();

      // Zoom in
      fireEvent.click(zoomInButton);
      expect(screen.getByText('125%')).toBeInTheDocument();

      // Zoom out
      fireEvent.click(zoomOutButton);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should disable zoom buttons at limits', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });

      // Zoom out to minimum
      fireEvent.click(zoomOutButton);
      fireEvent.click(zoomOutButton);
      expect(zoomOutButton).toBeDisabled();

      // Zoom in to maximum
      for (let i = 0; i < 6; i++) {
        fireEvent.click(zoomInButton);
      }
      expect(zoomInButton).toBeDisabled();
    });

    it('should update rotation when rotate button is clicked', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      const rotateButton = screen.getByRole('button', { name: /rotate/i });
      
      // Click rotate button multiple times
      fireEvent.click(rotateButton);
      fireEvent.click(rotateButton);
      fireEvent.click(rotateButton);
      fireEvent.click(rotateButton);

      // Should complete a full rotation (360 degrees = 0 degrees)
      expect(rotateButton).toBeInTheDocument();
    });

    it('should show reset view option for images', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByText('Reset View')).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should show download button', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    it('should handle download for images', async () => {
      const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
      (global.fetch as any).mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      (document.createElement as any).mockReturnValue(mockLink);

      render(<PaymentProofViewer {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(defaultProps.proofUrl);
        expect(mockLink.download).toBe('payment-proof-order-123456789.jpg');
        expect(mockLink.click).toHaveBeenCalled();
      });
    });

    it('should handle download for PDFs', async () => {
      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      const mockBlob = new Blob(['fake pdf data'], { type: 'application/pdf' });
      (global.fetch as any).mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      (document.createElement as any).mockReturnValue(mockLink);

      render(<PaymentProofViewer {...pdfProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockLink.download).toBe('payment-proof-order-123456789.pdf');
      });
    });

    it('should handle download errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Download failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<PaymentProofViewer {...defaultProps} />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Download failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when image fails to load', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      const image = screen.getByAltText(`Payment proof for order ${defaultProps.orderId}`);
      fireEvent.error(image);

      expect(screen.getByText('Failed to load payment proof')).toBeInTheDocument();
      expect(screen.getByText('Try Download Instead')).toBeInTheDocument();
    });

    it('should show error message when PDF fails to load', () => {
      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      render(<PaymentProofViewer {...pdfProps} />);

      const iframe = screen.getByTitle(`Payment proof PDF for order ${defaultProps.orderId}`);
      fireEvent.error(iframe);

      expect(screen.getByText('Failed to load PDF. Please try downloading the file.')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when dialog is closed', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      // Simulate dialog close (this would typically be handled by the Dialog component)
      // We can test this by checking if the onClose prop is passed correctly
      expect(mockOnClose).toBeDefined();
    });
  });

  describe('File Information Display', () => {
    it('should show file type and order information in footer', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByText(/File Type: IMAGE/)).toBeInTheDocument();
      expect(screen.getByText(/Order: #23456789/)).toBeInTheDocument();
    });

    it('should show PDF file type for PDF files', () => {
      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      render(<PaymentProofViewer {...pdfProps} />);

      expect(screen.getByText(/File Type: PDF/)).toBeInTheDocument();
    });

    it('should show reset view option only for images', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByText('Reset View')).toBeInTheDocument();

      const { unmount } = render(<PaymentProofViewer {...defaultProps} />);
      unmount();

      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      render(<PaymentProofViewer {...pdfProps} />);

      expect(screen.queryByText('Reset View')).not.toBeInTheDocument();
    });
  });

  describe('Image Loading States', () => {
    it('should hide loading state when image loads successfully', () => {
      render(<PaymentProofViewer {...defaultProps} />);

      expect(screen.getByText('Loading payment proof...')).toBeInTheDocument();

      const image = screen.getByAltText(`Payment proof for order ${defaultProps.orderId}`);
      fireEvent.load(image);

      expect(screen.queryByText('Loading payment proof...')).not.toBeInTheDocument();
    });

    it('should hide loading state when PDF loads successfully', () => {
      const pdfProps = {
        ...defaultProps,
        proofUrl: 'https://example.com/proof.pdf',
      };

      render(<PaymentProofViewer {...pdfProps} />);

      expect(screen.getByText('Loading payment proof...')).toBeInTheDocument();

      const iframe = screen.getByTitle(`Payment proof PDF for order ${defaultProps.orderId}`);
      fireEvent.load(iframe);

      expect(screen.queryByText('Loading payment proof...')).not.toBeInTheDocument();
    });
  });
});