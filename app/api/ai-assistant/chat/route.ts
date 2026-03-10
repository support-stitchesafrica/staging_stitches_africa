/**
 * AI Assistant Chat API
 * 
 * Handles chat messages and returns AI responses
 * Integrates with session management for persistence
 * Processes cart actions from AI responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage } from '@/lib/ai-assistant/openai-service';
import {
  getOrCreateSession,
  saveMessage,
  getSessionHistory,
  updateSessionContext,
} from '@/lib/ai-assistant/session-service';
import { CartActionService } from '@/lib/ai-assistant/cart-action-service';
import { ProductSearchService } from '@/lib/ai-assistant/product-search-service';
import { VendorSearchService } from '@/lib/ai-assistant/vendor-search-service';
import {
  trackConversation,
  trackInteraction,
} from '@/services/aiAssistantAnalytics';
import { ErrorHandler, AIAssistantError, getFallbackResponse } from '@/lib/ai-assistant/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create session
    let currentSessionId = sessionId;
    let isNewSession = false;

    if (!currentSessionId) {
      const { session, isNew } = await getOrCreateSession(userId);
      currentSessionId = session.sessionId;
      isNewSession = isNew;
    } else {
      // Validate existing session - if it expired, create a new one
      const { getSession } = await import('@/lib/ai-assistant/session-service');
      const existingSession = await getSession(currentSessionId);
      if (!existingSession) {
        // Session expired or doesn't exist, create a new one
        const { session, isNew } = await getOrCreateSession(userId);
        currentSessionId = session.sessionId;
        isNewSession = isNew;
      }
    }

    // Get session history for context
    const history = await getSessionHistory(currentSessionId, 10);

    // Build context from session history
    const context = {
      messages: history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    // Track conversation (user message)
    await trackConversation(currentSessionId, userId, 1, true);

    // Save user message (with retry if session expired)
    try {
      await saveMessage(currentSessionId, 'user', message);
    } catch (error: any) {
      // If session expired between validation and save, create new session and retry
      if (error?.code === 'SESSION_NOT_FOUND') {
        const { session, isNew } = await getOrCreateSession(userId);
        currentSessionId = session.sessionId;
        isNewSession = isNew;
        // Retry saving the message with the new session
        await saveMessage(currentSessionId, 'user', message);
      } else {
        throw error;
      }
    }

    // Get AI response with retry logic
    let response: Awaited<ReturnType<typeof sendChatMessage>> | undefined;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        response = await sendChatMessage(message, context);
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        
        // Check if error is retryable
        if (!ErrorHandler.isRetryable(error) || retryCount > maxRetries) {
          // Not retryable or max retries reached, use fallback
          const errorContext = ErrorHandler.createContext(error);
          ErrorHandler.logError(errorContext, { 
            sessionId: currentSessionId, 
            userId,
            retryCount 
          });
          
          response = {
            message: ErrorHandler.getUserMessage(errorContext),
            suggestedQuestions: ErrorHandler.getSuggestedQuestions(errorContext),
          };
          break;
        }
        
        // Wait before retrying
        const delay = ErrorHandler.getRetryDelay(retryCount, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Ensure response is defined
    if (!response) {
      const errorContext = ErrorHandler.handleUnknownError(new Error('No response from AI'));
      response = {
        message: ErrorHandler.getUserMessage(errorContext),
        suggestedQuestions: ErrorHandler.getSuggestedQuestions(errorContext),
      };
    }

    // Track conversation (assistant message)
    await trackConversation(currentSessionId, userId, 1, false);

    // Process product IDs to get product cards
    let productCards: Array<{
      id: string;
      title: string;
      price: number;
      discount?: number;
      finalPrice: number;
      image: string;
      vendor: string;
      availability: string;
      quickActions: Array<{ type: string; label: string; action: string }>;
    }> = [];
    
    if (response.productIds && response.productIds.length > 0) {
      const products = await ProductSearchService.getByIds(response.productIds);
      productCards = products.map(product => {
        // Convert FormattedProduct to full Product for CartActionService
        return {
          product_id: product.id,
          title: product.title,
          description: product.description,
          type: product.type,
          price: { base: product.price, currency: product.currency, discount: product.discount },
          discount: product.discount || 0,
          images: product.images,
          tailor_id: product.vendor.id,
          tailor: product.vendor.name,
          vendor: product.vendor,
          availability: product.availability,
          tags: product.tags,
          deliveryTimeline: product.deliveryTimeline,
          category: product.category,
        };
      }).map(product => CartActionService.formatProductCard(product as any));
    }

    // Process vendor IDs to get vendor cards
    let vendorCards: Array<{
      id: string;
      name: string;
      logo?: string;
      rating: number;
      location: string;
      specialties: string[];
      yearsOfExperience: number;
      shopUrl: string;
      quickActions: Array<{ type: string; label: string; action: string }>;
    }> = [];

    if (response.vendorIds && response.vendorIds.length > 0) {
      const vendors = await VendorSearchService.getByIds(response.vendorIds);
      vendorCards = vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        logo: vendor.logo,
        rating: vendor.rating,
        location: vendor.location,
        specialties: vendor.specialties,
        yearsOfExperience: vendor.yearsOfExperience,
        shopUrl: vendor.shopUrl,
        quickActions: [
          {
            type: 'visit_shop',
            label: 'Visit Shop',
            action: vendor.shopUrl,
          },
          {
            type: 'view_products',
            label: 'View Products',
            action: `/shops?vendor=${vendor.id}`,
          },
        ],
      }));
    }

    // Save assistant message with metadata (with retry if session expired)
    try {
      await saveMessage(
        currentSessionId,
        'assistant',
        response.message,
        {
          productIds: response.productIds,
          vendorIds: response.vendorIds,
          actions: response.actions?.map(a => `${a.type}:${JSON.stringify(a.data || {})}`),
        }
      );
    } catch (error: any) {
      // If session expired between user message and assistant message, create new session and retry
      if (error?.code === 'SESSION_NOT_FOUND') {
        const { session, isNew } = await getOrCreateSession(userId);
        currentSessionId = session.sessionId;
        isNewSession = isNew;
        // Retry saving the assistant message with the new session
        await saveMessage(
          currentSessionId,
          'assistant',
          response.message,
          {
            productIds: response.productIds,
            vendorIds: response.vendorIds,
            actions: response.actions?.map(a => `${a.type}:${JSON.stringify(a.data || {})}`),
          }
        );
      } else {
        // Log error but don't fail the request - user already got the response
        console.error('[AI Chat API] Error saving assistant message:', error);
      }
    }

    // Track interaction with products/vendors shown
    await trackInteraction(currentSessionId, 'message', {
      userId,
      userMessage: message,
      assistantResponse: response.message,
      productIds: response.productIds,
      vendorIds: response.vendorIds,
      metadata: {
        isNewSession,
        messageCount: history.length + 2, // +2 for user and assistant messages
      },
    });

    // Store AI-recommended products for homepage display
    if (response.productIds && response.productIds.length > 0) {
      try {
        // Use absolute URL for server-side fetch
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        await fetch(`${baseUrl}/api/ai-assistant/recommended-products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: response.productIds,
            userId,
            sessionId: currentSessionId
          }),
        });
      } catch (storeError) {
        console.warn('Could not store recommended products:', storeError);
      }
    }

    // Get cart item count for the user (only if userId is provided)
    let cartItemCount = 0;
    if (userId && userId !== 'undefined' && userId !== 'null' && userId.trim() !== '') {
      try {
        // Use absolute URL for server-side fetch
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        const cartResponse = await fetch(`${baseUrl}/api/ai-assistant/cart?userId=${encodeURIComponent(userId)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          cartItemCount = cartData.itemCount || 0;
        }
      } catch (cartError) {
        console.warn('Could not fetch cart count:', cartError);
      }
    }

    return NextResponse.json({
      ...response,
      sessionId: currentSessionId,
      isNewSession,
      productCards, // Include formatted product cards with quick actions
      vendorCards, // Include formatted vendor cards with quick actions
      cartItemCount, // Include cart item count
    });
  } catch (error) {
    console.error('[AI Chat API] Error:', error);
    
    // Create error context
    const errorContext = ErrorHandler.createContext(error);
    ErrorHandler.logError(errorContext, { endpoint: '/api/ai-assistant/chat' });
    
    // Return user-friendly error response
    return NextResponse.json(
      {
        message: ErrorHandler.getUserMessage(errorContext),
        suggestedQuestions: ErrorHandler.getSuggestedQuestions(errorContext),
        error: errorContext.code,
        retryable: errorContext.retryable,
      },
      { status: errorContext.retryable ? 503 : 500 }
    );
  }
}