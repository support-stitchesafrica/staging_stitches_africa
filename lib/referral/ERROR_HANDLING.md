# Error Handling and Logging

## Overview

This document describes the comprehensive error handling and logging implementation for the referral program. The system provides detailed error logging for debugging while presenting user-friendly error messages to end users.

## Requirements Fulfilled

- **Requirement 7.1:** Auto-provisioning failures are logged with user ID and error details
- **Requirement 7.2:** Referral code generation failures log the number of attempts and final error
- **Requirement 7.3:** Unauthenticated access redirects to login page
- **Requirement 7.4:** Firestore operations return descriptive error messages
- **Requirement 7.5:** Unexpected errors log full stack traces for debugging

## Error Logging Strategy

### 1. Auto-Provisioning Errors

**Location:** `lib/referral/auto-provision-service.ts`

**Logging:**
- All auto-provisioning attempts are logged to `autoProvisionLogs` collection
- Successful provisions log: userId, email, referralCode, attempts, source
- Failed provisions log: userId, email, error message, attempts, source
- Console logs include full error details and stack traces

**Example Log Entry:**
```typescript
{
  id: "auto-generated",
  userId: "firebase-uid",
  email: "user@example.com",
  success: false,
  error: "Failed to generate unique referral code",
  attempts: 10,
  timestamp: Timestamp,
  source: "login"
}
```

### 2. Referral Code Generation Errors

**Location:** `lib/referral/referral-service.ts`

**Logging:**
- Tracks all code generation attempts
- Logs collision warnings for each failed attempt
- Final error logs: number of attempts, max attempts, attempted codes (first 5)
- Includes timestamp for debugging

**Console Output:**
```
Referral code collision detected: ABC12345 (attempt 1/10)
Referral code collision detected: XYZ67890 (attempt 2/10)
...
Failed to generate unique referral code after 10 attempts {
  attempts: 10,
  maxAttempts: 10,
  attemptedCodes: ['ABC12345', 'XYZ67890', ...],
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

### 3. Firestore Operation Errors

**Location:** `lib/referral/reward-service.ts`

**Logging:**
- All Firestore operations log success/failure
- Failed operations log: error message, stack trace, operation context
- Includes referrer ID, referral ID, and other relevant data
- Timestamps for all log entries

**Example:**
```javascript
console.error('Error awarding sign-up points:', {
  error: 'Document not found',
  stack: '...',
  referrerId: 'referrer-uid',
  referralId: 'referral-id',
  timestamp: '2024-01-15T10:30:00.000Z'
});
```

### 4. API Endpoint Errors

**Locations:**
- `app/api/referral/login/route.ts`
- `app/api/referral/track-signup/route.ts`
- `app/api/referral/track-purchase/route.ts`

**Logging:**
- All API errors log: error message, stack trace, error code
- Request context: referral code, user IDs, amounts
- Timestamps for correlation
- Development mode includes additional details

**Example:**
```javascript
console.error('Error in track-signup endpoint:', {
  error: 'Referrer not found',
  stack: '...',
  code: 'USER_NOT_FOUND',
  referralCode: 'ABC12345',
  refereeId: 'referee-uid',
  timestamp: '2024-01-15T10:30:00.000Z'
});
```

## User-Friendly Error Messages

### Principle

- **Internal Errors:** Detailed logging for developers
- **User Messages:** Clear, actionable messages without technical details
- **Development Mode:** Additional details in development environment

### Error Message Examples

#### 1. Auto-Provisioning Failure
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Failed to create referral account. Please try again or contact support."
  }
}
```

#### 2. Invalid Referral Code
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CODE",
    "message": "Invalid referral code"
  }
}
```

#### 3. Inactive Account
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Your referral account is inactive. Please contact support."
  }
}
```

#### 4. Firestore Operation Failure
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while tracking the sign-up. Please try again or contact support."
  }
}
```

## Error Codes

### Standard Error Codes

```typescript
enum ReferralErrorCode {
  INVALID_CODE = 'INVALID_CODE',
  CODE_ALREADY_EXISTS = 'CODE_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_INPUT = 'INVALID_INPUT',
  REFERRAL_EXISTS = 'REFERRAL_EXISTS',
  PURCHASE_NOT_FOUND = 'PURCHASE_NOT_FOUND'
}
```

### Error Code Usage

| Code | HTTP Status | Description | User Message |
|------|-------------|-------------|--------------|
| INVALID_CODE | 400 | Referral code doesn't exist or is inactive | "Invalid referral code" |
| CODE_ALREADY_EXISTS | 500 | Failed to generate unique code after max attempts | "Failed to create referral account. Please try again." |
| USER_NOT_FOUND | 404 | Referrer not found in database | "Referrer not found" |
| UNAUTHORIZED | 401/403 | Invalid token or inactive account | "Your referral account is inactive. Please contact support." |
| INVALID_INPUT | 400 | Missing or invalid request parameters | "Invalid input provided" |
| REFERRAL_EXISTS | 400 | User already has a referrer | "This user has already been referred" |
| PURCHASE_NOT_FOUND | 404 | Purchase record not found | "Purchase not found" |

## Logging Best Practices

### 1. Structured Logging

Always use structured logging with objects:

```typescript
// Good
console.error('Error awarding points:', {
  error: error.message,
  stack: error.stack,
  referrerId,
  referralId,
  timestamp: new Date().toISOString()
});

// Avoid
console.error('Error awarding points', error);
```

### 2. Include Context

Always include relevant context:
- User IDs
- Referral codes
- Operation type
- Timestamps
- Request parameters

### 3. Log Levels

- **console.log:** Successful operations, informational messages
- **console.warn:** Recoverable issues (e.g., code collisions)
- **console.error:** Failures that require attention

### 4. Sensitive Data

Never log sensitive information:
- ❌ Passwords
- ❌ Full credit card numbers
- ❌ Personal identification numbers
- ✅ User IDs (Firebase UIDs)
- ✅ Email addresses (for debugging)
- ✅ Referral codes

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Auto-Provisioning Success Rate**
   - Query `autoProvisionLogs` collection
   - Alert if success rate < 95%

2. **Code Generation Attempts**
   - Monitor average attempts per code
   - Alert if average > 3 attempts

3. **API Error Rates**
   - Track 4xx and 5xx responses
   - Alert if error rate > 5%

4. **Firestore Operation Failures**
   - Monitor batch write failures
   - Alert on any failures

### Log Queries

#### Failed Auto-Provisioning Attempts
```javascript
db.collection('autoProvisionLogs')
  .where('success', '==', false)
  .where('timestamp', '>=', last24Hours)
  .get();
```

#### Recent Errors by Type
```javascript
// Parse console logs or use logging service
// Filter by error code and timestamp
```

## Error Recovery

### Automatic Recovery

1. **Code Generation:** Retries up to 10 times automatically
2. **Firestore Operations:** Uses batch writes for atomicity
3. **Auto-Provisioning:** Logs failure but doesn't block user flow

### Manual Recovery

1. **Failed Auto-Provisioning:**
   - Check `autoProvisionLogs` for details
   - Manually create referral user document if needed
   - Verify Firebase Auth user exists

2. **Code Generation Failures:**
   - Investigate collision rate
   - Consider increasing code length if collisions are frequent
   - Check for database issues

3. **Firestore Failures:**
   - Check Firestore status
   - Verify security rules
   - Check for quota limits

## Testing Error Handling

### Unit Tests

Test error scenarios:
- Invalid input
- Missing data
- Firestore failures
- Code generation failures

### Integration Tests

Test end-to-end error flows:
- Failed auto-provisioning
- Invalid referral codes
- Inactive accounts
- Network failures

### Example Test

```typescript
describe('Error Handling', () => {
  it('should log and return user-friendly error on auto-provision failure', async () => {
    // Mock Firestore to throw error
    mockFirestore.collection().doc().set.mockRejectedValue(
      new Error('Firestore unavailable')
    );

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Please try again or contact support');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Auto-provisioning failed'),
      expect.objectContaining({
        error: expect.any(String),
        stack: expect.any(String)
      })
    );
  });
});
```

## Debugging Guide

### Common Issues

#### 1. Auto-Provisioning Failures

**Symptoms:** Users can't access referral dashboard

**Debug Steps:**
1. Check `autoProvisionLogs` collection for user
2. Verify Firebase Auth user exists
3. Check console logs for error details
4. Verify Firestore security rules

#### 2. Code Generation Failures

**Symptoms:** High collision rate, slow provisioning

**Debug Steps:**
1. Check console logs for collision warnings
2. Query `referralUsers` collection size
3. Calculate collision probability
4. Consider increasing code length

#### 3. Points Not Awarded

**Symptoms:** Referrers not receiving points

**Debug Steps:**
1. Check `referralTransactions` collection
2. Verify referral relationship exists
3. Check console logs for Firestore errors
4. Verify reward service was called

## Future Enhancements

1. **Centralized Logging Service**
   - Integrate with logging platform (e.g., Datadog, Sentry)
   - Real-time error monitoring
   - Automated alerting

2. **Error Analytics Dashboard**
   - Visualize error rates over time
   - Track error types and frequencies
   - Identify patterns and trends

3. **Automated Recovery**
   - Retry failed operations automatically
   - Queue failed operations for later processing
   - Self-healing mechanisms

4. **Enhanced Monitoring**
   - Real-time dashboards
   - Anomaly detection
   - Predictive alerting
