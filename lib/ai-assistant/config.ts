/**
 * AI Shopping Assistant Configuration
 * 
 * Centralizes all OpenAI and AI assistant related configuration
 * from environment variables.
 */

export const aiAssistantConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    // Use GPT-4o-mini for faster responses (10x faster than GPT-4)
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    // Reduce max tokens for faster responses
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
    // Lower temperature for more consistent, faster responses
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.5'),
    // Add timeout for API calls
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '10000', 10), // 10 seconds
  },
  
  // Session configuration
  session: {
    expiryHours: 24,
    maxMessages: 50,
    // Reduce context tokens for faster processing
    maxContextTokens: 2000,
    // Keep fewer messages in context
    maxContextMessages: 6,
  },
  
  // Rate limiting
  rateLimit: {
    maxMessagesPerMinute: 20,
  },
  
  // Cache configuration
  cache: {
    // Cache product searches for 5 minutes
    productSearchTTL: 5 * 60 * 1000,
    // Cache vendor searches for 10 minutes
    vendorSearchTTL: 10 * 60 * 1000,
    // Cache AI responses for 1 minute (for identical queries)
    aiResponseTTL: 60 * 1000,
  },
  
  // Feature flags
  features: {
    virtualTryOn: true,
    vendorRecommendations: true,
    productRecommendations: true,
    sizingAssistant: true,
    // Enable response caching
    caching: true,
    // Enable parallel queries
    parallelQueries: true,
  },
} as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if required variables are missing
 */
export function validateAIConfig(): void {
  if (!aiAssistantConfig.openai.apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Please add it to your .env file. ' +
      'Get your API key from: https://platform.openai.com/api-keys'
    );
  }
  
  if (aiAssistantConfig.openai.maxTokens < 100 || aiAssistantConfig.openai.maxTokens > 4000) {
    console.warn(
      `OPENAI_MAX_TOKENS is set to ${aiAssistantConfig.openai.maxTokens}. ` +
      'Recommended range is 100-4000.'
    );
  }
  
  if (aiAssistantConfig.openai.temperature < 0 || aiAssistantConfig.openai.temperature > 1) {
    console.warn(
      `OPENAI_TEMPERATURE is set to ${aiAssistantConfig.openai.temperature}. ` +
      'Valid range is 0.0-1.0.'
    );
  }
}

/**
 * Gets the OpenAI configuration
 * @returns OpenAI configuration object
 */
export function getOpenAIConfig() {
  return aiAssistantConfig.openai;
}

/**
 * Gets the session configuration
 * @returns Session configuration object
 */
export function getSessionConfig() {
  return aiAssistantConfig.session;
}

/**
 * Gets the rate limit configuration
 * @returns Rate limit configuration object
 */
export function getRateLimitConfig() {
  return aiAssistantConfig.rateLimit;
}

/**
 * Checks if a feature is enabled
 * @param feature - Feature name to check
 * @returns true if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof aiAssistantConfig.features): boolean {
  return aiAssistantConfig.features[feature];
}
