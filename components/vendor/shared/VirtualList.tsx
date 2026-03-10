/**
 * Virtual List Component for Large Datasets
 * Implements virtual scrolling for performance
 * Validates: Requirements 10.1, 10.2, 10.3
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

/**
 * Virtual scrolling list component
 * Only renders visible items + overscan for smooth scrolling
 * Dramatically improves performance for large lists (1000+ items)
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = ''
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for virtual scrolling with dynamic item heights
 * More complex but handles variable-height items
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  estimatedItemHeight: number = 50
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  const measureItem = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const next = new Map(prev);
      next.set(index, height);
      return next;
    });
  }, []);

  // Calculate positions
  const positions = items.map((_, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeights.get(i) || estimatedItemHeight;
    }
    return offset;
  });

  const totalHeight = positions[positions.length - 1] + 
    (itemHeights.get(items.length - 1) || estimatedItemHeight);

  // Find visible range
  const startIndex = positions.findIndex(pos => pos + estimatedItemHeight >= scrollTop);
  const endIndex = positions.findIndex(pos => pos > scrollTop + containerHeight);

  return {
    scrollTop,
    setScrollTop,
    measureItem,
    totalHeight,
    startIndex: Math.max(0, startIndex),
    endIndex: endIndex === -1 ? items.length - 1 : endIndex,
    getItemOffset: (index: number) => positions[index] || 0
  };
}
