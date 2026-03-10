/**
 * OpenAI Service
 * 
 * Handles all interactions with OpenAI API for the shopping assistant
 * Includes:
 * - API integration with OpenAI
 * - Message handling and parsing
 * - Context management
 * - Error handling and retry logic
 */

import OpenAI from 'openai';
import { aiAssistantConfig } from './config';
import { buildSystemPrompt } from './prompts';
import { parseAIResponse as parseResponse, type ParsedAction } from './response-parser';
import { ErrorHandler, AIAssistantError, getFallbackResponse } from './error-handler';
import { analyzeContext, createOptimizedContext, shouldRestartConversation } from './context-manager';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new AIAssistantError(
        ErrorHandler.handleOpenAIError({ status: 401 })
      );
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  messages: ChatMessage[];
  userId?: string;
  preferences?: Record<string, any>;
  viewedProducts?: string[];
  addedToCart?: string[];
  budget?: number;
}

// Re-export ParsedAction from response-parser
export type { ParsedAction } from './response-parser';

export interface AIResponse {
  message: string;
  productIds?: string[];
  vendorIds?: string[];
  actions?: ParsedAction[];
  suggestedQuestions?: string[];
}

export class OpenAIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

// System prompt is now imported from prompts.ts
// This provides comprehensive prompts for:
// - Shopping assistant persona
// - Product recommendation logic
// - Sizing advice
// - Avatar creation
// - Vendor recommendations

/**
 * Send a message to OpenAI and get a response
 * Includes retry logic for transient failures and smart context management
 */
export async function sendChatMessage(
  userMessage: string,
  context: ChatContext
): Promise<AIResponse> {
  // Validate input
  if (!userMessage || userMessage.trim().length === 0) {
    throw new OpenAIServiceError(
      'Message cannot be empty',
      'INVALID_INPUT',
      false
    );
  }

  // Check if user wants to restart conversation
  if (shouldRestartConversation(userMessage)) {
    return {
      message: 'Sure! Let\'s start fresh. What can I help you find today?',
      suggestedQuestions: [
        'Show me new arrivals',
        'Find traditional wear',
        'Recommend popular items',
      ],
    };
  }

  // Analyze context to detect new topics
  const contextAnalysis = analyzeContext(userMessage, context.messages);

  // Build context-aware system prompt
  const contextualPrompt = buildContextualPrompt(context);

  // Use smart context management - keep only last 4 messages for speed
  let relevantMessages: ChatMessage[];
  if (contextAnalysis.shouldClearContext) {
    // Clear context for new topic
    relevantMessages = [];
  } else if (contextAnalysis.isNewTopic) {
    // Keep minimal context for new topic (last 2 messages)
    relevantMessages = contextAnalysis.relevantMessages.slice(-2);
  } else {
    // Keep limited context for follow-up (last 4 messages for speed)
    relevantMessages = contextAnalysis.relevantMessages.slice(-4);
  }

  // Build messages array with system prompt and optimized context
  const messages: ChatMessage[] = [
    { role: 'system', content: contextualPrompt },
    ...relevantMessages,
    { role: 'user', content: enhanceUserMessage(userMessage, context) },
  ];

  // Call OpenAI with retry logic
  try {
    let completion = await callOpenAIWithRetry(messages);
    let assistantMessage = completion.choices[0]?.message;

    // Handle function calls if AI wants to search for products
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.type === 'function' && toolCall.function.name === 'search_products') {
        // Parse function arguments
        const args = JSON.parse(toolCall.function.arguments);
        
        // Import ProductSearchService dynamically to avoid circular dependencies
        const { ProductSearchService } = await import('./product-search-service');
        
        // Search for products
        const products = await ProductSearchService.searchProducts(
          args.query,
          {
            category: args.category,
            occasion: args.occasion,
            style: args.style,
            minPrice: args.minPrice,
            maxPrice: args.maxPrice,
            color: args.color,
          },
          args.limit || 20
        );

        // Build function result message
        const functionResult = {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            products: products.map(p => ({
              id: p.id,
              title: p.title,
              price: p.finalPrice,
              currency: p.currency,
              vendor: p.vendor.name,
              category: p.category,
              availability: p.availability,
            })),
          }),
        };

        // Add assistant message with tool call and function result to messages
        const updatedMessages: ChatMessage[] = [
          ...messages,
          {
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls,
          } as any,
          functionResult as any,
        ];

        // Call OpenAI again with function result
        completion = await callOpenAIWithRetry(updatedMessages);
        assistantMessage = completion.choices[0]?.message;

        // Extract product IDs from the search results
        const productIds = products.map(p => p.id);

        // Get the final message content
        const finalMessage = assistantMessage?.content || 
          'I found some great products for you!';

        // Inject product markers into the message
        const messageWithMarkers = injectProductMarkers(finalMessage, productIds);

        // Parse the response
        const parsed = parseResponse(messageWithMarkers);

        return {
          message: parsed.cleanMessage,
          productIds: parsed.productIds,
          vendorIds: parsed.vendorIds,
          actions: parsed.actions,
          suggestedQuestions: generateSuggestedQuestions(finalMessage, context),
        };
      }
    }

    // No function calls - process normally
    const content = assistantMessage?.content || 
      'I apologize, I had trouble understanding that. Could you rephrase?';

    // Parse the response for structured data using the response-parser module
    const parsed = parseResponse(content);

    return {
      message: parsed.cleanMessage,
      productIds: parsed.productIds,
      vendorIds: parsed.vendorIds,
      actions: parsed.actions,
      suggestedQuestions: generateSuggestedQuestions(content, context),
    };
  } catch (error) {
    console.error('[OpenAI Service] Error:', error);
    
    // Create error context
    const errorContext = ErrorHandler.createContext(error);
    ErrorHandler.logError(errorContext, { userMessage });
    
    // If error is not retryable, provide fallback response
    if (!errorContext.retryable) {
      const fallbackMessage = getFallbackResponse(userMessage);
      return {
        message: fallbackMessage,
        suggestedQuestions: ErrorHandler.getSuggestedQuestions(errorContext),
      };
    }
    
    // Throw error for retryable cases
    throw handleOpenAIError(error);
  }
}

/**
 * Inject product markers into AI message
 * This ensures product IDs are properly formatted for the frontend
 */
function injectProductMarkers(message: string, productIds: string[]): string {
  if (productIds.length === 0) return message;

  // Add product markers at the end of the message
  const markers = productIds.map(id => `[PRODUCT:${id}]`).join(' ');
  return `${message}\n\n${markers}`;
}

/**
 * Enhance user message with context clues to trigger product recommendations
 */
function enhanceUserMessage(message: string, context: ChatContext): string {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate user wants to see products
  const productKeywords = [
    'show me', 'recommend', 'suggest', 'find', 'looking for', 
    'need', 'want', 'what should i', 'help me', 'browse', 
    'products', 'items', 'clothes', 'dresses', 'shirts',
    'pants', 'skirts', 'jackets', 'accessories', 'shoes',
    'wedding', 'party', 'casual', 'work', 'formal',
    'traditional', 'modern', 'ankara', 'agbada', 'kaftan'
  ];
  
  // If message contains product-related keywords, encourage product recommendations
  const hasProductKeywords = productKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (hasProductKeywords) {
    // Add a subtle hint to encourage product recommendations
    return `${message}\n\n[Hint: Recommend relevant products using [PRODUCT:product_id] markers when appropriate]`;
  }
  
  return message;
}

/**
 * Define function tools for OpenAI to call
 */
const FUNCTION_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the catalog based on customer criteria. Use this when customers ask about products, want recommendations, or describe what they\'re looking for.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query describing what the customer is looking for (e.g., "wedding dress", "casual shirt", "traditional wear")',
          },
          category: {
            type: 'string',
            description: 'Product category (e.g., "dress", "shirt", "pants", "traditional")',
          },
          occasion: {
            type: 'string',
            description: 'Occasion for the product (e.g., "wedding", "party", "work", "casual")',
          },
          style: {
            type: 'string',
            description: 'Style preference (e.g., "traditional", "modern", "formal", "casual")',
          },
          minPrice: {
            type: 'number',
            description: 'Minimum price in NGN',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price in NGN',
          },
          color: {
            type: 'string',
            description: 'Preferred color',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of products to return (default: 20, max: 50)',
            default: 20,
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Call OpenAI API with retry logic, timeout, and function calling support
 */
async function callOpenAIWithRetry(
  messages: ChatMessage[],
  maxRetries: number = 1
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const openai = getOpenAIClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('OpenAI API timeout'));
        }, aiAssistantConfig.openai.timeout);
      });

      // Race between API call and timeout
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: aiAssistantConfig.openai.model,
          messages: messages as any,
          temperature: aiAssistantConfig.openai.temperature,
          max_tokens: aiAssistantConfig.openai.maxTokens,
          tools: FUNCTION_TOOLS,
          tool_choice: 'auto', // Let AI decide when to use functions
          // Use streaming for faster perceived response time
          stream: false,
        }),
        timeoutPromise,
      ]);

      return completion;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on non-retryable errors
      if (error?.status === 401 || error?.status === 403) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (shorter delays for speed)
      const delay = Math.min(500 * Math.pow(2, attempt), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Failed to call OpenAI API');
}

/**
 * Build contextual system prompt based on user context
 * Now uses the comprehensive prompt system from prompts.ts
 */
function buildContextualPrompt(context: ChatContext): string {
  return buildSystemPrompt(context);
}

/**
 * Manage context window to stay within token limits
 * Keeps most recent messages and ensures we don't exceed limits
 */
function manageContextWindow(messages: ChatMessage[]): ChatMessage[] {
  const maxMessages = 10; // Keep last 10 messages for context
  
  if (messages.length <= maxMessages) {
    return messages;
  }

  // Keep the most recent messages
  return messages.slice(-maxMessages);
}

/**
 * Handle OpenAI errors and convert to user-friendly messages
 */
function handleOpenAIError(error: any): OpenAIServiceError {
  const context = ErrorHandler.createContext(error);
  ErrorHandler.logError(context);
  
  return new OpenAIServiceError(
    context.userMessage,
    context.code,
    context.retryable
  );
}

/**
 * Generate suggested follow-up questions based on the conversation
 */
function generateSuggestedQuestions(message: string, context: ChatContext): string[] {
  const lowerMessage = message.toLowerCase();
  const suggestions: string[] = [];

  // Product-related suggestions
  if (lowerMessage.includes('dress') || lowerMessage.includes('outfit') || lowerMessage.includes('clothes')) {
    suggestions.push('Show me similar styles');
    suggestions.push('What accessories match this?');
    suggestions.push('Can I try it on virtually?');
  }

  // Occasion-based suggestions
  if (lowerMessage.includes('wedding') || lowerMessage.includes('party') || lowerMessage.includes('event')) {
    suggestions.push('Show me more options for this occasion');
    suggestions.push('What shoes would match?');
    suggestions.push('Any matching jewelry?');
  }

  // Vendor-related suggestions
  if (lowerMessage.includes('vendor') || lowerMessage.includes('tailor') || lowerMessage.includes('seller')) {
    suggestions.push('Show me their products');
    suggestions.push('What are their ratings?');
    suggestions.push('Find similar vendors');
  }

  // Size and fit suggestions
  if (lowerMessage.includes('size') || lowerMessage.includes('fit')) {
    suggestions.push('Can I try it on virtually?');
    suggestions.push('What if it doesn\'t fit?');
    suggestions.push('Show me size guide');
  }

  // Price and budget suggestions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
    suggestions.push('Show me cheaper options');
    suggestions.push('Any discounts available?');
    suggestions.push('Compare prices');
  }

  // Cart-related suggestions
  if (context.addedToCart && context.addedToCart.length > 0) {
    suggestions.push('View my cart');
    suggestions.push('Continue shopping');
    suggestions.push('Proceed to checkout');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('Show me popular items');
    suggestions.push('Help me find something');
    suggestions.push('Browse categories');
  }

  // Return up to 3 unique suggestions
  return [...new Set(suggestions)].slice(0, 3);
}