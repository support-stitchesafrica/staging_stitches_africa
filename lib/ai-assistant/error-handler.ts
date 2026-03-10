/**
 * AI Assistant Error Handler
 * 
 * Centralized error handling for the AI shopping assistant
 * Provides:
 * - User-friendly error messages
 * - Error classification and recovery strategies
 * - Fallback responses
 * - Error logging and tracking
 * 
 * Requirements: 14.1-14.5
 */

export type ErrorCode =
  | 'OPENAI_API_ERROR'
  | 'OPENAI_RATE_LIMIT'
  | 'OPENAI_TIMEOUT'
  | 'OPENAI_INVALID_KEY'
  | 'NETWORK_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'VENDOR_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'CART_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedActions: string[];
  fallbackResponse?: string;
  metadata?: Record<string, any>;
}

/**
 * AI Assistant Error class with enhanced context
 */
export class AIAssistantError extends Error {
  constructor(
    public readonly context: ErrorContext
  ) {
    super(context.message);
    this.name = 'AIAssistantError';
  }
}

/**
 * Error Handler Service
 */
export class ErrorHandler {
  /**
   * Handle OpenAI API errors
   */
  static handleOpenAIError(error: any): ErrorContext {
    // Rate limit errors
    if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
      return {
        code: 'OPENAI_RATE_LIMIT',
        message: 'OpenAI rate limit exceeded',
        userMessage: 'I\'m getting a lot of requests right now. Please try again in a moment.',
        retryable: true,
        suggestedActions: [
          'Wait a few seconds and try again',
          'Browse products manually',
          'Contact support if this persists'
        ],
        fallbackResponse: 'While I catch my breath, you can browse our products directly or search for what you need.',
      };
    }

    // Authentication errors
    if (error?.status === 401 || error?.status === 403) {
      return {
        code: 'OPENAI_INVALID_KEY',
        message: 'OpenAI API authentication failed',
        userMessage: 'I\'m having trouble connecting to my AI service. Our team has been notified.',
        retryable: false,
        suggestedActions: [
          'Browse products manually',
          'Contact support',
          'Try again later'
        ],
        fallbackResponse: 'In the meantime, you can browse our products, search by category, or contact our support team for help.',
      };
    }

    // Timeout errors
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') {
      return {
        code: 'OPENAI_TIMEOUT',
        message: 'OpenAI API request timed out',
        userMessage: 'That took longer than expected. Let\'s try again.',
        retryable: true,
        suggestedActions: [
          'Try your request again',
          'Simplify your question',
          'Browse products manually'
        ],
        fallbackResponse: 'You can also browse our products directly while I get back up to speed.',
      };
    }

    // Server errors
    if (error?.status >= 500) {
      return {
        code: 'OPENAI_API_ERROR',
        message: 'OpenAI service unavailable',
        userMessage: 'My AI service is temporarily unavailable. Please try again in a moment.',
        retryable: true,
        suggestedActions: [
          'Try again in a few minutes',
          'Browse products manually',
          'Search by category'
        ],
        fallbackResponse: 'While I\'m offline, you can browse our products, use the search bar, or filter by category.',
      };
    }

    // Default OpenAI error
    return {
      code: 'OPENAI_API_ERROR',
      message: error?.message || 'OpenAI API error',
      userMessage: 'I had trouble processing that. Could you try rephrasing?',
      retryable: true,
      suggestedActions: [
        'Rephrase your question',
        'Try a simpler request',
        'Browse products manually'
      ],
      fallbackResponse: 'You can also browse our products directly or use the search feature.',
    };
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error: any): ErrorContext {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection error',
      userMessage: 'I\'m having trouble connecting. Please check your internet connection.',
      retryable: true,
      suggestedActions: [
        'Check your internet connection',
        'Try again in a moment',
        'Refresh the page'
      ],
      fallbackResponse: 'Once you\'re back online, I\'ll be here to help you shop!',
      metadata: {
        originalError: error?.message,
      },
    };
  }

  /**
   * Handle product not found errors
   */
  static handleProductNotFound(productId?: string): ErrorContext {
    return {
      code: 'PRODUCT_NOT_FOUND',
      message: `Product not found: ${productId}`,
      userMessage: 'I couldn\'t find that product. It might be out of stock or no longer available.',
      retryable: false,
      suggestedActions: [
        'Browse similar products',
        'Search for alternatives',
        'Ask me for recommendations'
        ],
      fallbackResponse: 'Would you like me to show you similar products or help you find something else?',
      metadata: {
        productId,
      },
    };
  }

  /**
   * Handle vendor not found errors
   */
  static handleVendorNotFound(vendorId?: string): ErrorContext {
    return {
      code: 'VENDOR_NOT_FOUND',
      message: `Vendor not found: ${vendorId}`,
      userMessage: 'I couldn\'t find that vendor. They might not be active anymore.',
      retryable: false,
      suggestedActions: [
        'Browse other vendors',
        'Ask me for vendor recommendations',
        'Search by product type'
      ],
      fallbackResponse: 'Would you like me to recommend other vendors or help you find specific products?',
      metadata: {
        vendorId,
      },
    };
  }

  /**
   * Handle session expired errors
   */
  static handleSessionExpired(): ErrorContext {
    return {
      code: 'SESSION_EXPIRED',
      message: 'Chat session expired',
      userMessage: 'Our conversation has expired. Let\'s start fresh!',
      retryable: false,
      suggestedActions: [
        'Start a new conversation',
        'Continue shopping'
      ],
      fallbackResponse: 'Hi! I\'m your AI shopping assistant. What can I help you find today?',
    };
  }

  /**
   * Handle cart errors
   */
  static handleCartError(error: any): ErrorContext {
    return {
      code: 'CART_ERROR',
      message: error?.message || 'Cart operation failed',
      userMessage: 'I had trouble adding that to your cart. Please try again.',
      retryable: true,
      suggestedActions: [
        'Try adding to cart again',
        'Add the product manually',
        'Check your cart'
      ],
      fallbackResponse: 'You can also add products to your cart by visiting the product page directly.',
      metadata: {
        originalError: error?.message,
      },
    };
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(message: string): ErrorContext {
    return {
      code: 'VALIDATION_ERROR',
      message: `Validation error: ${message}`,
      userMessage: message,
      retryable: false,
      suggestedActions: [
        'Check your input',
        'Try again with valid data'
      ],
    };
  }

  /**
   * Handle unknown errors
   */
  static handleUnknownError(error: any): ErrorContext {
    console.error('[Error Handler] Unknown error:', error);
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'Unknown error occurred',
      userMessage: 'Something unexpected happened. Please try again.',
      retryable: true,
      suggestedActions: [
        'Try again',
        'Refresh the page',
        'Contact support if this persists'
      ],
      fallbackResponse: 'I\'m here to help! Try asking me something else or browse our products.',
      metadata: {
        originalError: error?.message,
        stack: error?.stack,
      },
    };
  }

  /**
   * Get user-friendly error message with suggested actions
   */
  static getUserMessage(context: ErrorContext): string {
    let message = context.userMessage;

    if (context.fallbackResponse) {
      message += `\n\n${context.fallbackResponse}`;
    }

    return message;
  }

  /**
   * Get suggested questions based on error context
   */
  static getSuggestedQuestions(context: ErrorContext): string[] {
    const baseQuestions = [
      'Show me popular products',
      'Help me find something',
      'Browse categories'
    ];

    switch (context.code) {
      case 'PRODUCT_NOT_FOUND':
        return [
          'Show me similar products',
          'What\'s trending now?',
          'Browse by category'
        ];
      
      case 'VENDOR_NOT_FOUND':
        return [
          'Recommend top vendors',
          'Show me featured sellers',
          'Find products by category'
        ];
      
      case 'CART_ERROR':
        return [
          'View my cart',
          'Continue shopping',
          'Show me more products'
        ];
      
      case 'SESSION_EXPIRED':
        return [
          'Show me new arrivals',
          'What\'s on sale?',
          'Help me find something'
        ];
      
      default:
        return baseQuestions;
    }
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: any): boolean {
    if (error instanceof AIAssistantError) {
      return error.context.retryable;
    }

    // Network errors are retryable
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      return true;
    }

    // Rate limit errors are retryable
    if (error?.status === 429) {
      return true;
    }

    // Server errors are retryable
    if (error?.status >= 500) {
      return true;
    }

    // Client errors are not retryable
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }

    // Unknown errors are retryable
    return true;
  }

  /**
   * Get retry delay based on error type (exponential backoff)
   */
  static getRetryDelay(attempt: number, error: any): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds

    // Rate limit errors need longer delays
    if (error?.status === 429) {
      return Math.min(baseDelay * Math.pow(2, attempt) * 2, maxDelay * 2);
    }

    // Standard exponential backoff
    return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  }

  /**
   * Create error context from any error
   */
  static createContext(error: any): ErrorContext {
    // Already an AIAssistantError
    if (error instanceof AIAssistantError) {
      return error.context;
    }

    // Network errors
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      return this.handleNetworkError(error);
    }

    // OpenAI errors
    if (error?.status || error?.code === 'rate_limit_exceeded') {
      return this.handleOpenAIError(error);
    }

    // Unknown errors
    return this.handleUnknownError(error);
  }

  /**
   * Log error for monitoring
   */
  static logError(context: ErrorContext, additionalData?: Record<string, any>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      code: context.code,
      message: context.message,
      retryable: context.retryable,
      metadata: context.metadata,
      ...additionalData,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[AI Assistant Error]', logData);
    }

    // In production, you would send this to your error tracking service
    // e.g., Sentry, LogRocket, etc.
  }
}

/**
 * Fallback responses when AI is unavailable
 */
export const FALLBACK_RESPONSES = {
  welcome: 'Hi! I\'m your AI shopping assistant. While I\'m having some technical difficulties, you can browse our products, search by category, or contact our support team for help.',
  
  productSearch: 'I\'m having trouble searching right now, but you can use the search bar at the top of the page or browse our categories to find what you need.',
  
  vendorSearch: 'I can\'t access vendor information at the moment, but you can browse all our vendors in the Vendors section or search for specific products.',
  
  addToCart: 'I\'m having trouble with cart operations right now. You can add products to your cart by visiting the product page directly.',
  
  general: 'I\'m experiencing some technical difficulties. You can browse our products, use the search feature, or contact our support team for assistance.',
};

/**
 * Get fallback response based on user intent
 */
export function getFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('product') || lowerMessage.includes('show') || lowerMessage.includes('find')) {
    return FALLBACK_RESPONSES.productSearch;
  }

  if (lowerMessage.includes('vendor') || lowerMessage.includes('tailor') || lowerMessage.includes('seller')) {
    return FALLBACK_RESPONSES.vendorSearch;
  }

  if (lowerMessage.includes('cart') || lowerMessage.includes('add') || lowerMessage.includes('buy')) {
    return FALLBACK_RESPONSES.addToCart;
  }

  return FALLBACK_RESPONSES.general;
}
