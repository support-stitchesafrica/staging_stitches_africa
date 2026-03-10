/**
 * Configuration Verification Script
 * 
 * Run this script to verify that all AI Shopping Assistant
 * environment variables are properly configured.
 * 
 * Usage:
 *   npx tsx lib/ai-assistant/verify-config.ts
 * 
 * Note: This script is primarily for documentation purposes.
 * In Next.js, environment variables are automatically loaded at runtime.
 */

import { aiAssistantConfig, validateAIConfig } from './config';

function verifyConfiguration() {
  console.log('\n🔍 Verifying AI Shopping Assistant Configuration...\n');
  
  // Check OpenAI API Key
  console.log('📋 OpenAI Configuration:');
  console.log('  API Key:', aiAssistantConfig.openai.apiKey ? '✅ Set' : '❌ Missing');
  console.log('  Model:', aiAssistantConfig.openai.model);
  console.log('  Max Tokens:', aiAssistantConfig.openai.maxTokens);
  console.log('  Temperature:', aiAssistantConfig.openai.temperature);
  
  // Check Session Configuration
  console.log('\n📋 Session Configuration:');
  console.log('  Expiry Hours:', aiAssistantConfig.session.expiryHours);
  console.log('  Max Messages:', aiAssistantConfig.session.maxMessages);
  console.log('  Max Context Tokens:', aiAssistantConfig.session.maxContextTokens);
  
  // Check Rate Limiting
  console.log('\n📋 Rate Limiting:');
  console.log('  Max Messages/Minute:', aiAssistantConfig.rateLimit.maxMessagesPerMinute);
  
  // Check Features
  console.log('\n📋 Feature Flags:');
  console.log('  Virtual Try-On:', aiAssistantConfig.features.virtualTryOn ? '✅' : '❌');
  console.log('  Vendor Recommendations:', aiAssistantConfig.features.vendorRecommendations ? '✅' : '❌');
  console.log('  Product Recommendations:', aiAssistantConfig.features.productRecommendations ? '✅' : '❌');
  console.log('  Sizing Assistant:', aiAssistantConfig.features.sizingAssistant ? '✅' : '❌');
  
  // Validate configuration
  console.log('\n🔐 Validating Configuration...');
  try {
    validateAIConfig();
    console.log('✅ Configuration is valid!\n');
    return true;
  } catch (error) {
    console.error('❌ Configuration error:', (error as Error).message);
    console.log('\n💡 Please check your .env file and ensure all required variables are set.\n');
    return false;
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const isValid = verifyConfiguration();
  process.exit(isValid ? 0 : 1);
}

export { verifyConfiguration };
