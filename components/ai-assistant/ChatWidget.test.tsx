/**
 * ChatWidget Mobile Optimization Tests
 * 
 * Tests for mobile-specific features:
 * - Touch gestures
 * - Full-screen behavior
 * - Performance optimizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWidget } from './ChatWidget';

// Mock the hooks and components
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => true), // Default to mobile
}));

vi.mock('./ProductCard', () => ({
  ProductCard: ({ product }: any) => <div data-testid="product-card">{product.title}</div>,
}));

vi.mock('./VendorCard', () => ({
  VendorCard: ({ vendor }: any) => <div data-testid="vendor-card">{vendor.name}</div>,
}));

vi.mock('./VirtualTryOnModal', () => ({
  VirtualTryOnModal: () => <div data-testid="try-on-modal">Try On Modal</div>,
}));

vi.mock('./Avatar3DViewer', () => ({
  Avatar3DViewer: () => <div>3D Viewer</div>,
}));

describe('ChatWidget Mobile Optimizations', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Touch Gestures', () => {
    it('should have touch-manipulation class on buttons', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check close button has touch-manipulation
      const closeButton = screen.getByLabelText('Close chat');
      expect(closeButton.className).toContain('touch-manipulation');
    });

    it('should show swipe indicator on mobile', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check for swipe indicator (white bar at top)
      const header = screen.getByText('Shopping Assistant').closest('div');
      expect(header?.querySelector('.absolute.top-2')).toBeTruthy();
    });

    it('should handle touch start event', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Get chat container
      const chatContainer = screen.getByText('Shopping Assistant').closest('div')?.parentElement;
      
      // Simulate touch start
      fireEvent.touchStart(chatContainer!, {
        touches: [{ clientX: 100, clientY: 50 }],
      });
      
      // Should not throw error
      expect(chatContainer).toBeTruthy();
    });
  });

  describe('Full-Screen Experience', () => {
    it('should apply full-screen classes on mobile', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check for full-screen classes
      const chatContainer = screen.getByText('Shopping Assistant').closest('div')?.parentElement;
      expect(chatContainer?.className).toContain('inset-0');
      expect(chatContainer?.className).toContain('w-full');
      expect(chatContainer?.className).toContain('h-full');
    });

    it('should prevent body scroll when open on mobile', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check body has chat-open class
      expect(document.body.classList.contains('chat-open')).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      render(<ChatWidget />);
      
      // Open chat
      const openButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(openButton);
      
      // Close chat
      const closeButton = screen.getByLabelText('Close chat');
      fireEvent.click(closeButton);
      
      // Check body styles are restored
      expect(document.body.classList.contains('chat-open')).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });

    it('should have safe area padding on input', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check input area has pb-safe class
      const inputArea = screen.getByLabelText('Chat message input').closest('div')?.parentElement;
      expect(inputArea?.className).toContain('pb-safe');
    });
  });

  describe('Performance Optimizations', () => {
    it('should render without errors', () => {
      const { container } = render(<ChatWidget />);
      expect(container).toBeTruthy();
    });

    it('should have GPU-accelerated classes on message bubbles', async () => {
      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: { sessionId: 'test-session' },
          history: [],
        }),
      });

      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Wait for welcome message
      await waitFor(() => {
        expect(screen.getByText(/Hi! I'm your AI shopping assistant/)).toBeTruthy();
      });
      
      // Check for GPU acceleration class
      const messageBubble = screen.getByText(/Hi! I'm your AI shopping assistant/).closest('div');
      expect(messageBubble?.className).toContain('gpu-accelerated');
    });

    it('should have smooth scroll classes on message area', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check scroll area has optimization classes
      const scrollArea = screen.getByText('Shopping Assistant')
        .closest('div')?.parentElement?.querySelector('[class*="chat-scroll-area"]');
      
      expect(scrollArea).toBeTruthy();
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should use 16px font size on mobile input to prevent zoom', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check input has text-[16px] class
      const input = screen.getByLabelText('Chat message input');
      expect(input.className).toContain('text-[16px]');
    });

    it('should have larger touch targets on mobile', () => {
      render(<ChatWidget />);
      
      // Open chat
      const chatButton = screen.getByLabelText('Open shopping assistant');
      fireEvent.click(chatButton);
      
      // Check send button has larger size on mobile
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton.className).toContain('min-w-[56px]');
      expect(sendButton.className).toContain('min-h-[56px]');
    });
  });
});
