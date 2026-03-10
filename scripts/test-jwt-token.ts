/**
 * JWT Token Test Script
 * 
 * This script tests JWT token generation and validation to ensure
 * the JWT_SECRET is properly configured and working correctly.
 * 
 * Run with: node --env-file=.env -r tsx/cjs scripts/test-jwt-token.ts
 * Or: npx tsx --env-file=.env scripts/test-jwt-token.ts
 */

import * as jwt from 'jsonwebtoken';
import { JWT_CONFIG, validateJWTConfig, getJWTSecret } from '../lib/config/jwt-config';

interface TestInvitationPayload {
  inviteId: string;
  email: string;
  role: string;
  system: 'atlas' | 'collections' | 'marketing';
  jti: string;
}

console.log('='.repeat(60));
console.log('JWT Token Generation and Validation Test');
console.log('='.repeat(60));
console.log();

// Test 1: Validate JWT Configuration
console.log('Test 1: Validating JWT Configuration');
console.log('-'.repeat(60));
try {
  validateJWTConfig();
  console.log('✓ JWT configuration is valid');
  console.log(`  - Secret length: ${JWT_CONFIG.secret?.length} characters`);
  console.log(`  - Algorithm: ${JWT_CONFIG.algorithm}`);
  console.log(`  - Expiration: ${JWT_CONFIG.expirationDays} days`);
} catch (error) {
  console.error('✗ JWT configuration validation failed:', error);
  process.exit(1);
}
console.log();

// Test 2: Generate Test Token
console.log('Test 2: Generating Test Invitation Token');
console.log('-'.repeat(60));
const testPayload: TestInvitationPayload = {
  inviteId: 'test-invite-123',
  email: 'test@stitchesafrica.com',
  role: 'admin',
  system: 'atlas',
  jti: `test-${Date.now()}`
};

let testToken: string;
try {
  const secret = getJWTSecret();
  testToken = jwt.sign(
    testPayload,
    secret,
    {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: `${JWT_CONFIG.expirationDays}d`
    }
  );
  console.log('✓ Test token generated successfully');
  console.log(`  - Token length: ${testToken.length} characters`);
  console.log(`  - Token preview: ${testToken.substring(0, 50)}...`);
} catch (error) {
  console.error('✗ Token generation failed:', error);
  process.exit(1);
}
console.log();

// Test 3: Validate Test Token
console.log('Test 3: Validating Test Token');
console.log('-'.repeat(60));
try {
  const secret = getJWTSecret();
  const decoded = jwt.verify(testToken, secret, {
    algorithms: [JWT_CONFIG.algorithm]
  }) as jwt.JwtPayload & TestInvitationPayload;
  
  console.log('✓ Token validation successful');
  console.log('  - Decoded payload:');
  console.log(`    • Invite ID: ${decoded.inviteId}`);
  console.log(`    • Email: ${decoded.email}`);
  console.log(`    • Role: ${decoded.role}`);
  console.log(`    • System: ${decoded.system}`);
  console.log(`    • JTI: ${decoded.jti}`);
  console.log(`    • Issued At: ${new Date((decoded.iat || 0) * 1000).toISOString()}`);
  console.log(`    • Expires At: ${new Date((decoded.exp || 0) * 1000).toISOString()}`);
  
  // Verify payload matches
  if (decoded.inviteId !== testPayload.inviteId ||
      decoded.email !== testPayload.email ||
      decoded.role !== testPayload.role ||
      decoded.system !== testPayload.system) {
    throw new Error('Decoded payload does not match original payload');
  }
  console.log('✓ Payload verification successful');
} catch (error) {
  console.error('✗ Token validation failed:', error);
  process.exit(1);
}
console.log();

// Test 4: Test Invalid Token
console.log('Test 4: Testing Invalid Token Detection');
console.log('-'.repeat(60));
const invalidToken = testToken.substring(0, testToken.length - 5) + 'XXXXX';
try {
  const secret = getJWTSecret();
  jwt.verify(invalidToken, secret, {
    algorithms: [JWT_CONFIG.algorithm]
  });
  console.error('✗ Invalid token was accepted (should have been rejected)');
  process.exit(1);
} catch (error) {
  if (error instanceof jwt.JsonWebTokenError) {
    console.log('✓ Invalid token correctly rejected');
    console.log(`  - Error: ${error.message}`);
  } else {
    console.error('✗ Unexpected error:', error);
    process.exit(1);
  }
}
console.log();

// Test 5: Test Expired Token
console.log('Test 5: Testing Expired Token Detection');
console.log('-'.repeat(60));
try {
  const secret = getJWTSecret();
  const expiredToken = jwt.sign(
    testPayload,
    secret,
    {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: '-1s' // Already expired
    }
  );
  
  try {
    jwt.verify(expiredToken, secret, {
      algorithms: [JWT_CONFIG.algorithm]
    });
    console.error('✗ Expired token was accepted (should have been rejected)');
    process.exit(1);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('✓ Expired token correctly rejected');
      console.log(`  - Error: ${error.message}`);
    } else {
      throw error;
    }
  }
} catch (error) {
  console.error('✗ Unexpected error:', error);
  process.exit(1);
}
console.log();

// Test 6: Test Token with Wrong Secret
console.log('Test 6: Testing Token with Wrong Secret');
console.log('-'.repeat(60));
try {
  const wrongSecret = 'wrong-secret-key-that-should-not-work';
  const tokenWithWrongSecret = jwt.sign(
    testPayload,
    wrongSecret,
    {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: `${JWT_CONFIG.expirationDays}d`
    }
  );
  
  try {
    const correctSecret = getJWTSecret();
    jwt.verify(tokenWithWrongSecret, correctSecret, {
      algorithms: [JWT_CONFIG.algorithm]
    });
    console.error('✗ Token with wrong secret was accepted (should have been rejected)');
    process.exit(1);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('✓ Token with wrong secret correctly rejected');
      console.log(`  - Error: ${error.message}`);
    } else {
      throw error;
    }
  }
} catch (error) {
  console.error('✗ Unexpected error:', error);
  process.exit(1);
}
console.log();

// Summary
console.log('='.repeat(60));
console.log('All Tests Passed! ✓');
console.log('='.repeat(60));
console.log();
console.log('Summary:');
console.log('  ✓ JWT configuration is valid');
console.log('  ✓ Token generation works correctly');
console.log('  ✓ Token validation works correctly');
console.log('  ✓ Invalid tokens are rejected');
console.log('  ✓ Expired tokens are rejected');
console.log('  ✓ Tokens with wrong secret are rejected');
console.log();
console.log('The JWT_SECRET is properly configured and working correctly.');
console.log();
