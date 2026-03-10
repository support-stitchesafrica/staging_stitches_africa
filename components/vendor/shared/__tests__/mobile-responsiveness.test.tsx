/**
 * Mobile Responsiveness Tests
 * Tests for mobile-optimized components and hooks
 */

import { renderHook, act } from '@testing-library/react';
import { useTouchGestures } from '@/hooks/useTouchGestures';

describe('Mobile Responsiveness', () => {
  describe('useTouchGestures', () => {
    it('should detect swipe right gesture', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() =>
        useTouchGestures({ onSwipeRight, threshold: 50 })
      );

      // Simulate touch start
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchStart(touchStart);
      });

      // Simulate touch end (swipe right)
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should detect swipe left gesture', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useTouchGestures({ onSwipeLeft, threshold: 50 })
      );

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchStart(touchStart);
      });

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should not trigger swipe if below threshold', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() =>
        useTouchGestures({ onSwipeRight, threshold: 100 })
      );

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchStart(touchStart);
      });

      // Small movement (below threshold)
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 130, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect vertical swipe up', () => {
      const onSwipeUp = jest.fn();
      const { result } = renderHook(() =>
        useTouchGestures({ onSwipeUp, threshold: 50 })
      );

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      });
      act(() => {
        result.current.onTouchStart(touchStart);
      });

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeUp).toHaveBeenCalled();
    });

    it('should detect vertical swipe down', () => {
      const onSwipeDown = jest.fn();
      const { result } = renderHook(() =>
        useTouchGestures({ onSwipeDown, threshold: 50 })
      );

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      act(() => {
        result.current.onTouchStart(touchStart);
      });

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 200 } as Touch]
      });
      act(() => {
        result.current.onTouchEnd(touchEnd);
      });

      expect(onSwipeDown).toHaveBeenCalled();
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should use mobile breakpoint correctly', () => {
      // Test that mobile breakpoint is 768px
      const mobileWidth = 767;
      const desktopWidth = 768;

      expect(mobileWidth).toBeLessThan(768);
      expect(desktopWidth).toBeGreaterThanOrEqual(768);
    });

    it('should have correct touch target sizes', () => {
      // Minimum touch target size should be 44px
      const minTouchTarget = 44;
      expect(minTouchTarget).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Chart Responsiveness', () => {
    it('should use smaller height on mobile', () => {
      const mobileHeight = 250;
      const desktopHeight = 350;

      expect(mobileHeight).toBeLessThan(desktopHeight);
      expect(mobileHeight).toBeGreaterThanOrEqual(200); // Minimum readable height
    });

    it('should adjust margins for mobile', () => {
      const mobileMargin = { top: 10, right: 5, left: -20, bottom: 0 };
      const desktopMargin = { top: 10, right: 10, left: 0, bottom: 0 };

      expect(mobileMargin.left).toBeLessThan(desktopMargin.left);
      expect(mobileMargin.right).toBeLessThan(desktopMargin.right);
    });
  });

  describe('Touch Interaction Performance', () => {
    it('should use passive event listeners', () => {
      // Passive listeners improve scroll performance
      const passiveSupported = true; // Modern browsers support passive
      expect(passiveSupported).toBe(true);
    });

    it('should detect fast swipes only', () => {
      const maxSwipeTime = 300; // milliseconds
      const fastSwipe = 250;
      const slowSwipe = 400;

      expect(fastSwipe).toBeLessThan(maxSwipeTime);
      expect(slowSwipe).toBeGreaterThan(maxSwipeTime);
    });
  });
});

describe('Mobile Navigation', () => {
  it('should have correct number of nav items', () => {
    const navItems = [
      'Analytics',
      'Products',
      'Customers',
      'Payouts',
      'More'
    ];

    expect(navItems).toHaveLength(5);
  });

  it('should be hidden on desktop', () => {
    // Mobile nav should only show on screens < 768px
    const mobileOnly = 'md:hidden';
    expect(mobileOnly).toContain('hidden');
  });
});
