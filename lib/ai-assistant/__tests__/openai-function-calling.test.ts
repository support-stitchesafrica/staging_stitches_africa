/**
 * OpenAI Function Calling Tests
 * 
 * Tests for the product search function calling feature
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessage } from '../openai-service';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

// Mock ProductSearchService
vi.mock('../product-search-service', () => ({
  ProductSearchService: {
    searchProducts: vi.fn().mockResolvedValue([
      {
        id: 'prod_123',
        title: 'Beautiful Wedding Dress',
        price: 50000,
        finalPrice: 50000,
        currency: 'NGN',
        vendor: { id: 'vendor_1', name: 'Elegant Tailors' },
        category: 'dress',
        availability: 'in_stock',
        images: ['image1.jpg'],
        description: 'A stunning wedding dress',
        type: 'ready-to-wear',
        tags: ['wedding', 'formal'],
      },
      {
        id: 'prod_456',
        title: 'Elegant Evening Gown',
        price: 45000,
        finalPrice: 45000,
        currency: 'NGN',
        vendor: { id: 'vendor_2', name: 'Fashion House' },
        category: 'dress',
        availability: 'in_stock',
        images: ['image2.jpg'],
        description: 'Perfect for special occasions',
        type: 'ready-to-wear',
        tags: ['evening', 'formal'],
      },
    ]),
  },
}));

describe('OpenAI Function Calling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle function calling for product search', async () => {
    const OpenAI = (await import('openai')).default;
    const mockCreate = vi.fn()
      // First call - AI decides to use function
      .mockResolvedValueOnce({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{
              id: 'call_123',
              type: 'function',
              function: {
                name: 'search_products',
                arguments: JSON.stringify({
                  query: 'wedding dress',
                  occasion: 'wedding',
                  limit: 3,
                }),
              },
            }],
          },
        }],
      })
      // Second call - AI formats response with product info
      .mockResolvedValueOnce({
        choices: [{
          message: {
            role: 'assistant',
            content: 'I found some beautiful wedding dresses for you! Here are my top recommendations.',
          },
        }],
      });

    (OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const response = await sendChatMessage('I want to see wedding dresses', {
      messages: [],
    });

    // Should have called OpenAI twice (once for function call, once for final response)
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // Should return product IDs
    expect(response.productIds).toBeDefined();
    expect(response.productIds).toHaveLength(2);
    expect(response.productIds).toContain('prod_123');
    expect(response.productIds).toContain('prod_456');

    // Should have a message
    expect(response.message).toBeTruthy();
  });

  it('should handle normal responses without function calling', async () => {
    const OpenAI = (await import('openai')).default;
    const mockCreate = vi.fn().mockResolvedValueOnce({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you today?',
        },
      }],
    });

    (OpenAI as any).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    const response = await sendChatMessage('Hello', {
      messages: [],
    });

    // Should have called OpenAI once
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // Should not have product IDs
    expect(response.productIds).toEqual([]);

    // Should have a message
    expect(response.message).toBe('Hello! How can I help you today?');
  });
});
