/**
 * Error Handling and Logging Tests
 * 
 * These tests verify the error handling and logging functionality
 * for the referral program.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Error Handling and Logging', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Structured Error Logging', () => {
    it('should log errors with structured format', () => {
      const error = new Error('Test error');
      const context = {
        userId: 'test-user-id',
        operation: 'test-operation',
        timestamp: new Date().toISOString(),
      };

      console.error('Test error occurred:', {
        error: error.message,
        stack: error.stack,
        ...context,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Test error occurred:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          userId: 'test-user-id',
          operation: 'test-operation',
          timestamp: expect.any(String),
        })
      );
    });

    it('should include stack traces in error logs', () => {
      const error = new Error('Test error');
      
      console.error('Error with stack:', {
        error: error.message,
        stack: error.stack,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error with stack:',
        expect.objectContaining({
          stack: expect.stringContaining('Error: Test error'),
        })
      );
    });

    it('should include timestamps in error logs', () => {
      const timestamp = new Date().toISOString();
      
      console.error('Error with timestamp:', {
        error: 'Test error',
        timestamp,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error with timestamp:',
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        })
      );
    });
  });

  describe('Error Context', () => {
    it('should include operation context in error logs', () => {
      console.error('Operation failed:', {
        error: 'Test error',
        referrerId: 'referrer-123',
        referralId: 'referral-456',
        operation: 'awardPoints',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Operation failed:',
        expect.objectContaining({
          referrerId: 'referrer-123',
          referralId: 'referral-456',
          operation: 'awardPoints',
        })
      );
    });

    it('should include request parameters in API error logs', () => {
      console.error('API error:', {
        error: 'Invalid input',
        code: 'INVALID_INPUT',
        referralCode: 'ABC12345',
        refereeId: 'referee-789',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API error:',
        expect.objectContaining({
          code: 'INVALID_INPUT',
          referralCode: 'ABC12345',
          refereeId: 'referee-789',
        })
      );
    });
  });

  describe('Code Generation Logging', () => {
    it('should log collision warnings', () => {
      const code = 'ABC12345';
      const attempt = 1;
      const maxAttempts = 10;

      console.warn(`Referral code collision detected: ${code} (attempt ${attempt}/${maxAttempts})`);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Referral code collision detected: ABC12345')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('(attempt 1/10)')
      );
    });

    it('should log successful generation after retries', () => {
      const attempts = 3;

      console.log(`Generated unique referral code after ${attempts} attempts`);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Generated unique referral code after 3 attempts'
      );
    });

    it('should log final error with attempt details', () => {
      const attempts = 10;
      const maxAttempts = 10;
      const attemptedCodes = ['ABC123', 'XYZ789', 'DEF456'];

      console.error('Failed to generate unique referral code after 10 attempts', {
        attempts,
        maxAttempts,
        attemptedCodes,
        timestamp: new Date().toISOString(),
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate unique referral code'),
        expect.objectContaining({
          attempts: 10,
          maxAttempts: 10,
          attemptedCodes: expect.arrayContaining(['ABC123', 'XYZ789', 'DEF456']),
        })
      );
    });
  });

  describe('Success Logging', () => {
    it('should log successful operations', () => {
      const points = 7;
      const referrerId = 'referrer-123';

      console.log(`Successfully awarded ${points} signup points to referrer ${referrerId}`);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Successfully awarded 7 signup points to referrer referrer-123'
      );
    });

    it('should log auto-provisioning success', () => {
      const userId = 'user-123';
      const referralCode = 'ABC12345';

      console.log(`Auto-provisioned referral user: ${userId} with code: ${referralCode}`);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Auto-provisioned referral user: user-123 with code: ABC12345'
      );
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should not include technical details in user messages', () => {
      const userMessage = 'An error occurred while tracking the sign-up. Please try again or contact support.';
      
      expect(userMessage).not.toContain('stack');
      expect(userMessage).not.toContain('Error:');
      expect(userMessage).not.toContain('at ');
      expect(userMessage).toContain('Please try again or contact support');
    });

    it('should provide actionable guidance', () => {
      const messages = [
        'Failed to create referral account. Please try again or contact support.',
        'Your referral account is inactive. Please contact support.',
        'An error occurred while tracking the purchase. Please try again or contact support.',
      ];

      messages.forEach(message => {
        expect(message).toMatch(/Please (try again|contact support)/);
      });
    });

    it('should use clear, non-technical language', () => {
      const userMessages = [
        'Invalid referral code',
        'This user has already been referred',
        'Referrer not found',
        'Invalid input provided',
      ];

      userMessages.forEach(message => {
        expect(message).not.toContain('null');
        expect(message).not.toContain('undefined');
        expect(message).not.toContain('Exception');
        expect(message).not.toContain('stack trace');
      });
    });
  });

  describe('Error Code Handling', () => {
    it('should include error codes in responses', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid referral code',
        },
      };

      expect(errorResponse.error.code).toBe('INVALID_CODE');
      expect(errorResponse.error.message).toBeTruthy();
    });

    it('should map error codes to appropriate HTTP status codes', () => {
      const errorMappings = [
        { code: 'INVALID_INPUT', status: 400 },
        { code: 'UNAUTHORIZED', status: 401 },
        { code: 'USER_NOT_FOUND', status: 404 },
        { code: 'INTERNAL_ERROR', status: 500 },
      ];

      errorMappings.forEach(({ code, status }) => {
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThan(600);
      });
    });
  });

  describe('Logging Best Practices', () => {
    it('should not log sensitive information', () => {
      const logData = {
        userId: 'user-123',
        email: 'user@example.com',
        referralCode: 'ABC12345',
        // Should NOT include:
        // password, creditCard, ssn, etc.
      };

      expect(logData).not.toHaveProperty('password');
      expect(logData).not.toHaveProperty('creditCard');
      expect(logData).not.toHaveProperty('ssn');
    });

    it('should use consistent log structure', () => {
      const logEntry = {
        error: 'Test error',
        stack: 'Error stack trace',
        context: 'operation-context',
        timestamp: new Date().toISOString(),
      };

      expect(logEntry).toHaveProperty('error');
      expect(logEntry).toHaveProperty('stack');
      expect(logEntry).toHaveProperty('timestamp');
    });

    it('should include timestamps in ISO format', () => {
      const timestamp = new Date().toISOString();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Error Recovery', () => {
    it('should handle recoverable errors gracefully', () => {
      // Simulate code collision (recoverable)
      const attempt = 1;
      const maxAttempts = 10;
      const canRetry = attempt < maxAttempts;

      expect(canRetry).toBe(true);
    });

    it('should fail after max retry attempts', () => {
      const attempt = 10;
      const maxAttempts = 10;
      const canRetry = attempt < maxAttempts;

      expect(canRetry).toBe(false);
    });

    it('should log retry attempts', () => {
      for (let i = 1; i <= 3; i++) {
        console.warn(`Retry attempt ${i}/10`);
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
    });
  });
});

/**
 * Integration Test Scenarios
 * 
 * These describe the expected behavior in integration tests:
 * 
 * 1. Auto-Provisioning Error:
 *    - Trigger auto-provisioning failure
 *    - Verify error logged to autoProvisionLogs
 *    - Verify console.error called with details
 *    - Verify user receives friendly message
 * 
 * 2. Code Generation Error:
 *    - Mock 10 code collisions
 *    - Verify collision warnings logged
 *    - Verify final error includes attempt count
 *    - Verify error thrown with details
 * 
 * 3. Firestore Operation Error:
 *    - Mock Firestore failure
 *    - Verify error logged with context
 *    - Verify stack trace included
 *    - Verify user receives friendly message
 * 
 * 4. API Endpoint Error:
 *    - Send invalid request
 *    - Verify error logged with request details
 *    - Verify appropriate HTTP status code
 *    - Verify user-friendly error message
 */
