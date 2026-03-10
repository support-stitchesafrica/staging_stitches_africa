# Referral Dashboard API Endpoints

This directory contains protected API routes for the referrer dashboard. All endpoints require Firebase authentication via Bearer token.

## Authentication

All endpoints require an `Authorization` header with a Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

The token is verified using Firebase Admin SDK, and the user must:
1. Be a registered referral user (exist in `referralUsers` collection)
2. Have an active account (`isActive: true`)

## Endpoints

### 1. GET /api/referral/dashboard/stats

Get referrer dashboard statistics.

**Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalReferrals": 25,
    "totalPoints": 5000,
    "totalRevenue": 2500.00,
    "conversionRate": 45.5,
    "activeReferrals": 20,
    "pendingReferrals": 5
  }
}
```

### 2. GET /api/referral/dashboard/referrals

Get list of referrals with pagination and search.

**Requirements:** 6.1, 6.2, 6.3, 6.4, 6.5

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 10, max: 100): Items per page
- `search` (string): Search by referee name or email
- `sortBy` (string, default: 'date'): Sort field (date, points, purchases)
- `sortOrder` (string, default: 'desc'): Sort order (asc, desc)

**Example:**
```
GET /api/referral/dashboard/referrals?page=1&limit=10&search=john&sortBy=points&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "referrals": [
    {
      "id": "ref123",
      "refereeName": "John Doe",
      "refereeEmail": "john@example.com",
      "status": "converted",
      "signUpDate": "2024-01-15T10:30:00.000Z",
      "firstPurchaseDate": "2024-01-20T14:20:00.000Z",
      "totalPurchases": 3,
      "totalSpent": 450.00,
      "pointsEarned": 122.50
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. GET /api/referral/dashboard/transactions

Get points transaction history.

**Requirements:** 7.5

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page
- `type` (string, default: 'all'): Filter by type (signup, purchase, all)

**Example:**
```
GET /api/referral/dashboard/transactions?page=1&limit=20&type=purchase
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn123",
      "type": "purchase",
      "points": 22.50,
      "amount": 450.00,
      "description": "Purchase commission from John Doe",
      "refereeName": "John Doe",
      "refereeEmail": "john@example.com",
      "orderId": "order789",
      "createdAt": "2024-01-20T14:20:00.000Z"
    },
    {
      "id": "txn124",
      "type": "signup",
      "points": 1,
      "amount": null,
      "description": "Sign-up bonus for Jane Smith",
      "refereeName": "Jane Smith",
      "refereeEmail": "jane@example.com",
      "orderId": null,
      "createdAt": "2024-01-18T09:15:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 35,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "summary": {
    "totalPoints": 3500,
    "signupPoints": 2000,
    "purchasePoints": 1500,
    "totalTransactions": 35
  }
}
```

### 4. GET /api/referral/dashboard/charts

Get chart data for visualization.

**Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5

**Query Parameters:**
- `range` (string, default: '30days'): Date range (7days, 30days, 90days, all)

**Example:**
```
GET /api/referral/dashboard/charts?range=30days
```

**Response:**
```json
{
  "success": true,
  "charts": {
    "signups": {
      "labels": ["2024-01-01", "2024-01-02", "2024-01-03"],
      "data": [2, 5, 3],
      "title": "Daily Sign-ups",
      "type": "line"
    },
    "revenue": {
      "labels": ["2024-01", "2024-02"],
      "data": [1250.50, 2340.75],
      "title": "Monthly Revenue",
      "type": "bar"
    }
  },
  "dateRange": {
    "range": "30days",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  },
  "summary": {
    "totalSignups": 10,
    "totalRevenue": 3591.25
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes:
- `UNAUTHORIZED` (401): Missing or invalid authentication token
- `USER_NOT_FOUND` (404): Referrer not found in database
- `INVALID_INPUT` (400): Invalid request parameters
- `INTERNAL_ERROR` (500): Server error

### HTTP Status Codes:
- `200`: Success
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (inactive account)
- `404`: Not found (user doesn't exist)
- `500`: Internal server error

## Testing

To test these endpoints, you'll need:

1. A Firebase ID token from an authenticated referral user
2. The user must exist in the `referralUsers` collection
3. The user's `isActive` field must be `true`

Example using curl:

```bash
# Get stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/referral/dashboard/stats

# Get referrals with search
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/referral/dashboard/referrals?page=1&limit=10&search=john"

# Get transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/referral/dashboard/transactions?page=1&type=purchase"

# Get charts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/referral/dashboard/charts?range=30days"
```

## Implementation Notes

- All endpoints use Firebase Admin SDK for authentication
- Timestamps are converted to ISO 8601 strings in responses
- Pagination is implemented for list endpoints
- Search is case-insensitive and matches both name and email
- Chart data fills in missing dates with 0 values for better visualization
- All monetary values are rounded to 2 decimal places
