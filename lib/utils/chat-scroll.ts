/**
 * Chat scroll utilities for auto-scrolling to bottom
 * Handles different scroll area implementations (Radix UI, native, etc.)
 */

export const scrollToBottom = (delay: number = 100) => {
  setTimeout(() => {
    // Try multiple selectors for different scroll area implementations
    const selectors = [
      '[data-radix-scroll-area-viewport]',
      '[data-slot="scroll-area-viewport"]', 
      '.chat-scroll-area',
      '.scroll-area-viewport'
    ];
    
    let scrollArea: Element | null = null;
    
    // Find the first matching scroll area
    for (const selector of selectors) {
      scrollArea = document.querySelector(selector);
      if (scrollArea) break;
    }
    
    if (scrollArea) {
      // Smooth scroll to bottom
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, delay);
};

export const scrollToBottomInstant = () => {
  const selectors = [
    '[data-radix-scroll-area-viewport]',
    '[data-slot="scroll-area-viewport"]', 
    '.chat-scroll-area',
    '.scroll-area-viewport'
  ];
  
  let scrollArea: Element | null = null;
  
  // Find the first matching scroll area
  for (const selector of selectors) {
    scrollArea = document.querySelector(selector);
    if (scrollArea) break;
  }
  
  if (scrollArea) {
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }
};

export const scrollToBottomMultiple = (delays: number[] = [10, 50, 100, 200]) => {
  delays.forEach(delay => scrollToBottom(delay));
};

// Enhanced scroll function that waits for DOM updates
export const scrollToBottomAfterUpdate = () => {
  // Use requestAnimationFrame to wait for DOM updates
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollToBottomInstant();
      // Also try smooth scroll as backup
      setTimeout(() => scrollToBottom(0), 10);
    });
  });
};