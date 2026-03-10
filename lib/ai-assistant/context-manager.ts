/**
 * AI Assistant Context Manager
 * 
 * Manages conversation context intelligently:
 * - Detects when user is asking for something new
 * - Clears irrelevant context when topic changes
 * - Maintains relevant context for follow-up questions
 * - Optimizes context window for better AI responses
 * 
 * Requirements: 7.2, 7.3, 7.5
 */

import { ChatMessage } from './openai-service';

export interface ContextAnalysis {
  isNewTopic: boolean;
  shouldClearContext: boolean;
  relevantMessages: ChatMessage[];
  topicKeywords: string[];
  confidence: number;
}

/**
 * Keywords that indicate a new search or topic
 */
const NEW_TOPIC_INDICATORS = [
  'show me',
  'find',
  'looking for',
  'search for',
  'i want',
  'i need',
  'can you show',
  'recommend',
  'suggest',
  'what about',
  'how about',
  'instead',
  'different',
  'other',
  'another',
  'new',
  'fresh',
  'change',
  'switch',
  'forget',
  'never mind',
  'actually',
  'wait',
  'no',
  'not that',
];

/**
 * Keywords that indicate follow-up questions
 */
const FOLLOW_UP_INDICATORS = [
  'this',
  'that',
  'it',
  'them',
  'these',
  'those',
  'more',
  'details',
  'tell me more',
  'what else',
  'also',
  'and',
  'size',
  'color',
  'price',
  'available',
  'in stock',
];

/**
 * Product/shopping related keywords
 */
const PRODUCT_KEYWORDS = [
  'dress', 'shirt', 'pants', 'skirt', 'jacket', 'shoes', 'accessories',
  'traditional', 'modern', 'casual', 'formal', 'wedding', 'party',
  'ankara', 'agbada', 'kaftan', 'dashiki', 'kente', 'adire',
  'product', 'item', 'clothing', 'wear', 'outfit', 'attire',
];

/**
 * Vendor related keywords
 */
const VENDOR_KEYWORDS = [
  'vendor', 'tailor', 'seller', 'shop', 'store', 'designer',
  'maker', 'craftsman', 'artisan',
];

/**
 * Analyze user message to determine if it's a new topic
 */
export function analyzeContext(
  userMessage: string,
  previousMessages: ChatMessage[]
): ContextAnalysis {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Check if this is the first message
  if (previousMessages.length === 0) {
    return {
      isNewTopic: true,
      shouldClearContext: false,
      relevantMessages: [],
      topicKeywords: extractKeywords(lowerMessage),
      confidence: 1.0,
    };
  }

  // Check for explicit new topic indicators
  const hasNewTopicIndicator = NEW_TOPIC_INDICATORS.some(indicator =>
    lowerMessage.includes(indicator)
  );

  // Check for follow-up indicators
  const hasFollowUpIndicator = FOLLOW_UP_INDICATORS.some(indicator =>
    lowerMessage.includes(indicator)
  );

  // Extract keywords from current and previous messages
  const currentKeywords = extractKeywords(lowerMessage);
  const previousKeywords = extractPreviousKeywords(previousMessages);

  // Calculate topic similarity
  const similarity = calculateTopicSimilarity(currentKeywords, previousKeywords);

  // Determine if this is a new topic
  const isNewTopic = hasNewTopicIndicator && !hasFollowUpIndicator && similarity < 0.3;

  // Determine if we should clear context
  const shouldClearContext = isNewTopic && similarity < 0.2;

  // Get relevant messages based on topic
  const relevantMessages = shouldClearContext
    ? []
    : filterRelevantMessages(previousMessages, currentKeywords);

  // Calculate confidence
  const confidence = calculateConfidence(
    hasNewTopicIndicator,
    hasFollowUpIndicator,
    similarity
  );

  return {
    isNewTopic,
    shouldClearContext,
    relevantMessages,
    topicKeywords: currentKeywords,
    confidence,
  };
}

/**
 * Extract keywords from a message
 */
function extractKeywords(message: string): string[] {
  const words = message.toLowerCase().split(/\s+/);
  const keywords: string[] = [];

  // Extract product keywords
  PRODUCT_KEYWORDS.forEach(keyword => {
    if (message.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  // Extract vendor keywords
  VENDOR_KEYWORDS.forEach(keyword => {
    if (message.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  // Extract other significant words (nouns, adjectives)
  words.forEach(word => {
    if (word.length > 4 && !isCommonWord(word)) {
      keywords.push(word);
    }
  });

  return [...new Set(keywords)];
}

/**
 * Extract keywords from previous messages
 */
function extractPreviousKeywords(messages: ChatMessage[]): string[] {
  const keywords: string[] = [];
  
  // Look at last 3 messages for context
  const recentMessages = messages.slice(-3);
  
  recentMessages.forEach(msg => {
    if (msg.role === 'user') {
      keywords.push(...extractKeywords(msg.content));
    }
  });

  return [...new Set(keywords)];
}

/**
 * Calculate topic similarity between current and previous keywords
 */
function calculateTopicSimilarity(
  currentKeywords: string[],
  previousKeywords: string[]
): number {
  if (previousKeywords.length === 0) return 0;
  if (currentKeywords.length === 0) return 0;

  const commonKeywords = currentKeywords.filter(keyword =>
    previousKeywords.includes(keyword)
  );

  const similarity = commonKeywords.length / Math.max(currentKeywords.length, previousKeywords.length);
  return similarity;
}

/**
 * Filter messages that are relevant to current topic
 */
function filterRelevantMessages(
  messages: ChatMessage[],
  currentKeywords: string[]
): ChatMessage[] {
  if (currentKeywords.length === 0) {
    // Keep last 5 messages if no keywords
    return messages.slice(-5);
  }

  const relevantMessages: ChatMessage[] = [];
  
  // Always keep the last message for immediate context
  if (messages.length > 0) {
    relevantMessages.push(messages[messages.length - 1]);
  }

  // Find other relevant messages
  for (let i = messages.length - 2; i >= 0 && relevantMessages.length < 5; i--) {
    const message = messages[i];
    const messageKeywords = extractKeywords(message.content.toLowerCase());
    
    const hasCommonKeywords = currentKeywords.some(keyword =>
      messageKeywords.includes(keyword)
    );

    if (hasCommonKeywords) {
      relevantMessages.unshift(message);
    }
  }

  return relevantMessages;
}

/**
 * Calculate confidence in the analysis
 */
function calculateConfidence(
  hasNewTopicIndicator: boolean,
  hasFollowUpIndicator: boolean,
  similarity: number
): number {
  let confidence = 0.5;

  if (hasNewTopicIndicator) confidence += 0.3;
  if (hasFollowUpIndicator) confidence -= 0.2;
  if (similarity < 0.2) confidence += 0.2;
  if (similarity > 0.5) confidence -= 0.2;

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Check if a word is a common word (articles, prepositions, etc.)
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'only', 'own', 'same', 'than', 'too', 'very', 'can', 'will',
    'just', 'should', 'now', 'have', 'has', 'had', 'do', 'does', 'did',
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  ];

  return commonWords.includes(word);
}

/**
 * Create optimized context for OpenAI
 */
export function createOptimizedContext(
  analysis: ContextAnalysis,
  systemPrompt: string
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add relevant messages
  messages.push(...analysis.relevantMessages);

  return messages;
}

/**
 * Detect if user wants to clear/restart conversation
 */
export function shouldRestartConversation(userMessage: string): boolean {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  const restartPhrases = [
    'start over',
    'restart',
    'clear chat',
    'new conversation',
    'forget everything',
    'reset',
    'begin again',
    'fresh start',
  ];

  return restartPhrases.some(phrase => lowerMessage.includes(phrase));
}

/**
 * Generate context summary for long conversations
 */
export function summarizeContext(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';

  const userMessages = messages.filter(m => m.role === 'user');
  const keywords = extractPreviousKeywords(messages);

  const summary = `Previous conversation context: User has been asking about ${keywords.slice(0, 5).join(', ')}. ${userMessages.length} messages exchanged.`;

  return summary;
}
