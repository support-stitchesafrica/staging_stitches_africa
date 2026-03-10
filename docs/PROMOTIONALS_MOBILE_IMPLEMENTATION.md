# Promotional Events System - Mobile Implementation Guide

## Overview

The Promotional Events system allows authenticated users to create, manage, and publish promotional campaigns with discounts on products. The system is designed with a clear separation between admin dashboard functionality and customer-facing features, making it ideal for mobile app implementation.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Structures](#data-structures)
3. [Firestore Collections](#firestore-collections)
4. [Authentication & Authorization](#authentication--authorization)
5. [Admin Features (Dashboard)](#admin-features-dashboard)
6. [Customer Features (Public)](#customer-features-public)
7. [API & Service Layer](#api--service-layer)
8. [Mobile Implementation Guide](#mobile-implementation-guide)
9. [Error Handling](#error-handling)
10. [Security Considerations](#security-considerations)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Promotional Events System               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │  Admin Dashboard │         │  Customer Pages  │    │
│  │  (Authenticated) │         │    (Public)      │    │
│  └────────┬─────────┘         └────────┬─────────┘    │
│           │                             │              │
│           └─────────────┬───────────────┘              │
│                         │                              │
│  ┌──────────────────────────────────────────┐         │
│  │      Service Layer (Client-Side)         │         │
│  │  - EventService                          │         │
│  │  - ProductService                        │         │
│  │  - DiscountService                       │         │
│  │  - BannerService                         │         │
│  │  - CustomerService                       │         │
│  └────────────────────┬─────────────────────┘         │
│                       │                                │
│  ┌──────────────────────────────────────────┐         │
│  │          Firebase Backend                │         │
│  │  - Firestore (Collections)               │         │
│  │  - Firebase Auth                         │         │
│  │  - Firebase Storage (Banners)            │         │
│  └──────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### Key Components

1. **Admin Dashboard** (`/promotionals/*`)
   - Create, edit, delete promotional events
   - Manage products and discounts
   - Upload banners
   - Publish/unpublish events
   - Team management

2. **Customer Pages** (`/promotions/*`)
   - View active promotions
   - Browse promotional products
   - See discount information
   - Purchase discounted products

---

## Data Structures

### Core Types

#### PromotionalEvent

```typescript
interface PromotionalEvent {
  id: string;                          // Document ID in Firestore
  name: string;                        // Event name (e.g., "Summer Sale 2024")
  startDate: Timestamp;                // When promotion starts
  endDate: Timestamp;                  // When promotion ends
  status: PromotionalEventStatus;      // "draft" | "scheduled" | "active" | "expired"
  isPublished: boolean;                // Whether event is visible to customers
  products: ProductDiscount[];         // Array of products with discounts
  banner?: PromotionalBanner;          // Optional banner image and metadata
  createdBy: string;                   // UID of creator
  createdAt: Timestamp;                // Creation timestamp
  updatedAt: Timestamp;                // Last update timestamp
}
```

#### ProductDiscount

```typescript
interface ProductDiscount {
  productId: string;                   // Product ID from tailor_works collection
  discountPercentage: number;          // Discount percentage (1-100)
  originalPrice: number;               // Original product price
  discountedPrice: number;             // Calculated discounted price
  addedAt: Timestamp;                  // When product was added to event
}
```

#### PromotionalBanner

```typescript
interface PromotionalBanner {
  imageUrl: string;                    // Firebase Storage URL
  title?: string;                      // Optional banner title
  description?: string;                // Optional banner description
  displayPercentage?: number;          // "Up to X% off" display value
  uploadedAt: Timestamp;               // Upload timestamp
}
```

#### PromotionalUser

```typescript
interface PromotionalUser {
  uid: string;                         // Firebase Auth UID
  email: string;                       // User email
  fullName: string;                    // User's full name
  role: PromotionalRole;               // "superadmin" | "admin" | "editor"
  isPromotionalUser: boolean;          // Access flag
  createdAt: Timestamp;
  updatedAt: Timestamp;
  invitedBy?: string;                  // UID of user who invited them
}
```

#### Customer-Facing Types

```typescript
// For displaying to customers
interface ProductWithDiscount {
  productId: string;
  title: string;
  description: string;
  images: string[];
  originalPrice: number;               // Base price from product
  discountPercentage: number;          // Total discount percentage (from base price, accounts for existing + promotional)
  promotionalDiscountPercentage: number; // Promotional discount only (from event.products[].discountPercentage, e.g., 2%)
  discountedPrice: number;             // Final price after all discounts
  savings: number;                     // originalPrice - discountedPrice
  vendor: {
    id: string;
    name: string;                      // Fetched from tailor_works collection via productRepository.getByIdWithTailorInfo()
  };
  category?: string;
  availability?: string;
}

interface CustomerPromotionalEvent {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  banner?: {
    imageUrl: string;
    title?: string;
    description?: string;
  };
  productsCount: number;
  maxDiscount: number;                 // Highest discount in the event
}
```

---

## Firestore Collections

### Collections Used

1. **`promotionalEvents`** (Main collection)
   ```
   promotionalEvents/{eventId}
   ├── id: string
   ├── name: string
   ├── startDate: Timestamp
   ├── endDate: Timestamp
   ├── status: string
   ├── isPublished: boolean
   ├── products: ProductDiscount[]
   ├── banner: PromotionalBanner
   ├── createdBy: string
   ├── createdAt: Timestamp
   └── updatedAt: Timestamp
   ```

2. **`promotionalUsers`** (Access control)
   ```
   promotionalUsers/{uid}
   ├── uid: string
   ├── email: string
   ├── fullName: string
   ├── role: string
   ├── isPromotionalUser: boolean
   ├── createdAt: Timestamp
   ├── updatedAt: Timestamp
   └── invitedBy?: string
   ```

3. **`promotionalInvitations`** (Team management)
   ```
   promotionalInvitations/{inviteId}
   ├── id: string
   ├── email: string
   ├── role: string
   ├── token: string
   ├── status: string
   ├── invitedBy: string
   ├── invitedByName: string
   ├── createdAt: Timestamp
   ├── expiresAt: Timestamp
   └── acceptedAt?: Timestamp
   ```

4. **`tailor_works`** (Products collection - read-only for promotionals)
   ```
   tailor_works/{productId}
   └── (Existing product data)
   ```

### Firebase Storage

- **Path**: `promotionalBanners/{eventId}/banner.{ext}`
- **Allowed formats**: JPEG, PNG, WebP
- **Max size**: 5MB

---

## Authentication & Authorization

### User Roles & Permissions

| Permission | Superadmin | Admin | Editor |
|------------|-----------|-------|--------|
| Create Events | ✅ | ✅ | ✅ |
| Edit Events | ✅ | ✅ | ✅ |
| Delete Events | ✅ | ✅ | ❌ |
| Publish Events | ✅ | ✅ | ❌ |
| Manage Team | ✅ | ❌ | ❌ |

### Authentication Flow

#### For Admin Users (Dashboard Access)

1. **Login**
   ```typescript
   // Use PromotionalsAuthService
   const result = await PromotionalsAuthService.loginPromotionalUser(email, password);
   ```

2. **Validation**
   - Authenticate with Firebase Auth
   - Check `promotionalUsers/{uid}` collection
   - Verify `isPromotionalUser === true`
   - Load user role and permissions

3. **Session Management**
   - Firebase Auth handles session
   - Context provides user data via `usePromotionalsAuth()`

#### For Invited Users

1. User receives invitation link: `/promotionals/invite/{token}`
2. System validates invitation token
3. If user exists in Firebase Auth → redirect to login with token
4. If user doesn't exist → show signup form
5. After authentication → accept invitation and create `promotionalUsers` document

---

## Admin Features (Dashboard)

### Event Management

#### 1. Create Event

**Service**: `PromotionalEventService.createEvent()`

```typescript
const event = await PromotionalEventService.createEvent({
  name: "Summer Sale 2024",
  startDate: new Date("2024-06-01"),
  endDate: new Date("2024-06-30"),
  createdBy: currentUser.uid
});
```

**Status Calculation**: Automatically calculated based on dates
- `scheduled`: Current date < startDate
- `active`: startDate <= current date <= endDate
- `expired`: current date > endDate

#### 2. Add Products to Event

**Service**: `PromotionalEventService.addProductsToEvent()`

```typescript
const products: ProductDiscount[] = [
  {
    productId: "prod123",
    discountPercentage: 25,
    originalPrice: 100,
    discountedPrice: 75,
    addedAt: Timestamp.now()
  }
];

await PromotionalEventService.addProductsToEvent(eventId, products);
```

**Discount Calculation**:
```typescript
discountedPrice = originalPrice * (1 - discountPercentage / 100)
```

#### 3. Update Product Discount

**Service**: `PromotionalEventService.updateProductDiscount()`

```typescript
await PromotionalEventService.updateProductDiscount(
  eventId,
  productId,
  30  // New discount percentage (1-100)
);
```

#### 4. Upload Banner

**Service**: `BannerService.uploadAndUpdateBanner()`

```typescript
const imageUrl = await BannerService.uploadAndUpdateBanner(
  eventId,
  imageFile,
  {
    title: "Summer Sale",
    description: "Up to 50% off",
    displayPercentage: 50
  }
);
```

**Storage Path**: `promotionalBanners/{eventId}/banner.{ext}`

#### 5. Publish Event

**Service**: `PromotionalEventService.publishEvent()`

**Requirements**:
- Event must have at least one product
- Event must have a banner with imageUrl

```typescript
await PromotionalEventService.publishEvent(eventId);
```

#### 6. Get User's Events

**Service**: `PromotionalEventService.getUserEvents()`

```typescript
const events = await PromotionalEventService.getUserEvents(userId);
```

Returns all events created by the user, ordered by creation date (newest first).

---

## Customer Features (Public)

### Public API (No Authentication Required)

#### 1. Get Active Promotions

**Service**: `CustomerPromotionalService.getActivePromotionalEvents()`

```typescript
const activeEvents = await CustomerPromotionalService.getActivePromotionalEvents();
```

**Filters**:
- `isPublished === true`
- Current date is between `startDate` and `endDate`
- Status is `"active"`

#### 2. Get Promotion Details

**Service**: `CustomerPromotionalService.getPromotionalEvent()`

```typescript
const event = await CustomerPromotionalService.getPromotionalEvent(eventId);
```

Returns `null` if:
- Event doesn't exist
- Event is not published
- Event is not active (outside date range)

#### 3. Get Promotional Products

**Service**: `CustomerPromotionalService.getPromotionalProducts()`

```typescript
const products = await CustomerPromotionalService.getPromotionalProducts(eventId);
```

**Process**:
1. Fetch event (must be published and active)
2. Get product IDs from `event.products[]`
3. Fetch product details from `tailor_works` collection using `productRepository.getByIdWithTailorInfo()`
4. Calculate stacked discounts:
   - Apply existing product discount first (if any)
   - Then apply promotional discount from event
   - Calculate total discount percentage from base price
5. Include both `discountPercentage` (total) and `promotionalDiscountPercentage` (promotional only)
6. Return `ProductWithDiscount[]` with vendor names from tailor_works

#### 4. Get Single Promotional Product

**Service**: `CustomerPromotionalService.getPromotionalProduct()`

```typescript
const product = await CustomerPromotionalService.getPromotionalProduct(eventId, productId);
```

#### 5. Check Product Discount

**Service**: `CustomerPromotionalService.getProductDiscount()`

```typescript
const discount = await CustomerPromotionalService.getProductDiscount(productId);
// Returns total discount percentage (rounded to nearest integer) or null if not in active promotion
// Accounts for existing product discounts + promotional discount
// Example: Product with 10% existing + 2% promotional = 11.8% → returns 12 (rounded)
// 
// Note: To get promotional discount only, use ProductWithDiscount.promotionalDiscountPercentage
// For badge display:
// - Left badge: product.promotionalDiscountPercentage (e.g., 2%)
// - Right badge: Math.round(product.discountPercentage) (e.g., 12%)
```

#### 6. Countdown Timer

**Service**: `CustomerPromotionalService.calculateTimeRemaining()`

```typescript
const countdown = CustomerPromotionalService.calculateTimeRemaining(endDate);
// Returns { days, hours, minutes, seconds, isExpired }
```

---

## API & Service Layer

### Services Overview

All services are **client-side** and use Firebase SDK directly. There are no REST API endpoints.

#### EventService (`lib/promotionals/event-service.ts`)

**Methods**:
- `createEvent(data)` - Create new promotional event
- `getEventById(id)` - Get event by ID
- `getUserEvents(userId)` - Get all events for a user
- `getActiveEvents()` - Get all active published events
- `updateEvent(id, updates)` - Update event
- `deleteEvent(id)` - Delete event
- `publishEvent(id)` - Publish event
- `unpublishEvent(id)` - Unpublish event
- `updateEventStatus(id)` - Update status based on dates
- `addProductsToEvent(id, products)` - Add products with discounts
- `removeProductFromEvent(id, productId)` - Remove product
- `updateProductDiscount(id, productId, percentage)` - Update discount
- `getEventProducts(id)` - Get all products in event

#### ProductService (`lib/promotionals/product-service.ts`)

**Methods**:
- `getAllProducts()` - Get all marketplace products from `tailor_works`
- `searchProducts(query)` - Search products by name/description
- `filterProducts(filters)` - Filter by vendor, category, price, availability
- `getProductById(id)` - Get single product
- `getProductsByIds(ids)` - Get multiple products
- `getVendors()` - Get unique vendor names
- `getCategories()` - Get unique category names
- `convertToProductDiscounts(products, percentage)` - Convert to discount format
- `calculateDiscountedPrice(price, percentage)` - Calculate discount
- `validateDiscountPercentage(percentage)` - Validate discount

#### DiscountService (`lib/promotionals/discount-service.ts`)

**Methods**:
- `calculateDiscountedPrice(price, percentage)` - Calculate discounted price
- `validateDiscountPercentage(percentage)` - Validate discount (1-100)
- `applyDiscount(product, percentage)` - Apply discount to product
- `getActiveDiscountForProduct(productId)` - Get active discount for product
- `getActivePromotionalEvent()` - Get currently active event
- `isProductInActivePromotion(productId)` - Check if product is in promotion
- `calculateTotalSavings(products)` - Calculate total savings
- `getMaxDiscount(products)` - Get highest discount percentage
- `formatPrice(price, currency)` - Format price string
- `calculateSavingsPercentage(original, discounted)` - Calculate savings %

#### BannerService (`lib/promotionals/banner-service.ts`)

**Methods**:
- `uploadBannerImage(eventId, file)` - Upload banner to Firebase Storage
- `deleteBannerImage(eventId)` - Delete banner from storage
- `updateBanner(eventId, data)` - Update banner metadata in Firestore
- `getBanner(eventId)` - Get banner data
- `uploadAndUpdateBanner(eventId, file, data)` - Upload and update in one call
- `removeBanner(eventId)` - Remove banner completely

#### CustomerService (`lib/promotionals/customer-service.ts`)

**Methods**:
- `getPromotionalEvent(eventId)` - Get published active event
- `getPromotionalProducts(eventId)` - Get all products for event
- `getPromotionalProduct(eventId, productId)` - Get single product with discount
- `isPromotionActive(event)` - Check if promotion is currently active
- `calculateTimeRemaining(endDate)` - Calculate countdown
- `getActivePromotionalEvents()` - Get all active events
- `getActivePromotionForProduct(productId)` - Get event containing product
- `getProductDiscount(productId)` - Get discount percentage for product

#### AuthService (`lib/promotionals/auth-service.ts`)

**Methods**:
- `loginPromotionalUser(email, password)` - Login
- `registerPromotionalUser(email, password, fullName)` - Register
- `logoutPromotionalUser()` - Logout
- `getPromotionalUser(uid)` - Get user data
- `validatePromotionalAccess(uid)` - Check if user has access
- `checkIfAnyUsersExist()` - Check if system has users

#### InvitationService (`lib/promotionals/invitation-service.ts`)

**Methods**:
- `createInvitation(data)` - Create invitation
- `validateInvitation(token)` - Validate invitation token
- `acceptInvitation(token, acceptedByUid)` - Accept invitation
- `getInvitationByEmail(email)` - Get invitation by email
- `getInvitationById(id)` - Get invitation by ID
- `revokeInvitation(id)` - Revoke invitation
- `deleteInvitation(id)` - Delete invitation
- `getAllInvitations()` - Get all invitations
- `getInvitationsByStatus(status)` - Get invitations by status
- `checkEmailExists(email)` - Check if email exists in Firebase Auth
- `generateInvitationLink(token)` - Generate invitation URL

---

## Mobile Implementation Guide

### 1. Setup & Configuration

#### Firebase Configuration

```typescript
// Use the same Firebase config as web app
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
```

#### Collections Reference

```typescript
const COLLECTIONS = {
  EVENTS: 'promotionalEvents',
  USERS: 'promotionalUsers',
  INVITATIONS: 'promotionalInvitations',
  PRODUCTS: 'tailor_works'
};
```

### 2. Customer-Facing Features (Public API)

#### Fetch Active Promotions

```typescript
// Mobile: Fetch active promotional events
async function getActivePromotions(): Promise<PromotionalEvent[]> {
  const now = Timestamp.now();
  const eventsRef = collection(db, COLLECTIONS.EVENTS);
  
  const q = query(
    eventsRef,
    where('isPublished', '==', true),
    where('startDate', '<=', now),
    where('endDate', '>=', now),
    orderBy('startDate', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const events: PromotionalEvent[] = [];
  
  snapshot.forEach((doc) => {
    const event = { id: doc.id, ...doc.data() } as PromotionalEvent;
    // Validate status
    const start = event.startDate.toDate();
    const end = event.endDate.toDate();
    const current = new Date();
    
    if (current >= start && current <= end) {
      events.push(event);
    }
  });
  
  return events;
}
```

#### Fetch Promotional Products

```typescript
// Mobile: Get products for a promotional event
async function getPromotionalProducts(eventId: string): Promise<ProductWithDiscount[]> {
  // 1. Get event
  const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) return [];
  
  const event = { id: eventDoc.id, ...eventDoc.data() } as PromotionalEvent;
  
  // 2. Validate event is published and active
  const now = new Date();
  const start = event.startDate.toDate();
  const end = event.endDate.toDate();
  
  if (!event.isPublished || now < start || now > end) {
    return [];
  }
  
  // 3. Fetch products
  const productIds = event.products.map(p => p.productId);
  const products: ProductWithDiscount[] = [];
  
  for (const productId of productIds) {
    // Get product from tailor_works
    const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) continue;
    
    const product = productDoc.data() as Product;
    const discount = event.products.find(p => p.productId === productId);
    
    if (!discount) continue;
    
    // Calculate discounted price accounting for existing product discounts
    const basePrice = product.price?.base || 0;
    
    // Get current price after applying existing product discount (if any)
    const existingDiscount = product.discount || product.price?.discount || 0;
    const currentPrice = existingDiscount > 0
      ? basePrice * (1 - existingDiscount / 100)
      : basePrice;
    
    // Apply promotional discount on top of current price
    const promotionalDiscount = discount.discountPercentage;
    const finalDiscountedPrice = currentPrice * (1 - promotionalDiscount / 100);
    
    // Calculate savings from base price
    const savings = basePrice - finalDiscountedPrice;
    
    // Calculate total effective discount percentage from base price
    // Example: $100 with 10% existing discount = $90, then 2% promotional = $88.20
    // Total discount = (100 - 88.20) / 100 * 100 = 11.8%
    const totalDiscountPercentageRaw = basePrice > 0 
      ? ((basePrice - finalDiscountedPrice) / basePrice) * 100 
      : 0;
    
    // Get vendor name from enriched product data (use productRepository.getByIdWithTailorInfo)
    const vendorName = product.vendor?.name || product.tailor || 'Unknown Vendor';
    const vendorId = product.vendor?.id || product.tailor_id || '';
    
    products.push({
      productId: product.product_id,
      title: product.title,
      description: product.description,
      images: product.images || [],
      originalPrice: basePrice, // Always show base price as original
      discountPercentage: totalDiscountPercentageRaw, // Total discount percentage (not rounded here, e.g., 11.8)
      promotionalDiscountPercentage: promotionalDiscount, // Promotional discount only (e.g., 2%)
      discountedPrice: Math.round(finalDiscountedPrice * 100) / 100, // Round to 2 decimals (USD)
      savings: Math.round(savings * 100) / 100, // Round to 2 decimals
      vendor: {
        id: vendorId,
        name: vendorName, // Fetched from tailor_works collection via productRepository.getByIdWithTailorInfo()
      },
      category: product.category,
      availability: product.availability
    });
  }
  
  return products;
}
```

#### Check Product Discount

```typescript
// Mobile: Check if a product has an active discount
async function checkProductDiscount(productId: string): Promise<number | null> {
  // Get all active events
  const activeEvents = await getActivePromotions();
  
  for (const event of activeEvents) {
    const productDiscount = event.products.find(p => p.productId === productId);
    if (productDiscount) {
      // Get product to calculate total discount including existing discounts
      const product = await productRepository.getByIdWithTailorInfo(productId);
      if (!product) return null;
      
      const basePrice = product.price?.base || 0;
      const existingDiscount = product.discount || product.price?.discount || 0;
      const currentPrice = existingDiscount > 0
        ? basePrice * (1 - existingDiscount / 100)
        : basePrice;
      
      const promotionalDiscount = productDiscount.discountPercentage; // e.g., 2%
      const finalPrice = currentPrice * (1 - promotionalDiscount / 100);
      const totalDiscountPercentage = basePrice > 0 
        ? ((basePrice - finalPrice) / basePrice) * 100 
        : 0;
      
      // Round to nearest integer for display (11.8% → 12%, 11.2% → 11%, 11.5% → 12%)
      return Math.round(totalDiscountPercentage);
    }
  }
  
  return null;
}
```

#### Display Countdown Timer

```typescript
// Mobile: Calculate countdown values
function calculateCountdown(endDate: Date): CountdownValues {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false
  };
}
```

### 3. Admin Features (Requires Authentication)

#### Authentication Flow

```typescript
// Mobile: Login
async function loginPromotionalUser(email: string, password: string) {
  // 1. Authenticate with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // 2. Check if user has promotional access
  const userRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error('Access denied');
  }
  
  const userData = userDoc.data() as PromotionalUser;
  
  if (!userData.isPromotionalUser) {
    await signOut(auth);
    throw new Error('Access denied');
  }
  
  return userData;
}
```

#### Create Event

```typescript
// Mobile: Create promotional event
async function createEvent(
  name: string,
  startDate: Date,
  endDate: Date,
  createdBy: string
): Promise<string> {
  // Validate dates
  if (endDate <= startDate) {
    throw new Error('End date must be after start date');
  }
  
  // Calculate status
  const now = new Date();
  let status: PromotionalEventStatus;
  if (now < startDate) {
    status = 'scheduled';
  } else if (now >= startDate && now <= endDate) {
    status = 'active';
  } else {
    status = 'expired';
  }
  
  // Create event document
  const eventRef = doc(collection(db, COLLECTIONS.EVENTS));
  const eventData: PromotionalEvent = {
    id: eventRef.id,
    name: name.trim(),
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    status,
    isPublished: false,
    products: [],
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await setDoc(eventRef, eventData);
  
  return eventRef.id;
}
```

#### Add Products to Event

```typescript
// Mobile: Add products with discounts to event
async function addProductsToEvent(
  eventId: string,
  products: Array<{
    productId: string;
    discountPercentage: number;
    originalPrice: number;
  }>
) {
  // Validate discounts
  for (const product of products) {
    if (product.discountPercentage < 1 || product.discountPercentage > 100) {
      throw new Error(`Invalid discount for product ${product.productId}`);
    }
  }
  
  // Get existing event
  const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }
  
  const event = eventDoc.data() as PromotionalEvent;
  const existingProducts = event.products || [];
  
  // Merge products (replace if exists)
  const productMap = new Map<string, ProductDiscount>();
  
  existingProducts.forEach(p => {
    productMap.set(p.productId, p);
  });
  
  products.forEach(p => {
    const discountedPrice = p.originalPrice * (1 - p.discountPercentage / 100);
    productMap.set(p.productId, {
      productId: p.productId,
      discountPercentage: p.discountPercentage,
      originalPrice: p.originalPrice,
      discountedPrice,
      addedAt: Timestamp.now()
    });
  });
  
  const updatedProducts = Array.from(productMap.values());
  
  await updateDoc(eventRef, {
    products: updatedProducts,
    updatedAt: Timestamp.now()
  });
}
```

#### Upload Banner

```typescript
// Mobile: Upload banner image
async function uploadBanner(
  eventId: string,
  imageFile: File
): Promise<string> {
  // Validate file
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Invalid file type');
  }
  
  if (imageFile.size > 5 * 1024 * 1024) {
    throw new Error('File too large (max 5MB)');
  }
  
  // Upload to Firebase Storage
  const ext = imageFile.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `promotionalBanners/${eventId}/banner.${ext}`);
  
  await uploadBytes(storageRef, imageFile, {
    contentType: imageFile.type
  });
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  // Update event with banner
  const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
  await updateDoc(eventRef, {
    banner: {
      imageUrl: downloadURL,
      uploadedAt: Timestamp.now()
    },
    updatedAt: Timestamp.now()
  });
  
  return downloadURL;
}
```

#### Publish Event

```typescript
// Mobile: Publish promotional event
async function publishEvent(eventId: string) {
  const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    throw new Error('Event not found');
  }
  
  const event = eventDoc.data() as PromotionalEvent;
  
  // Validate requirements
  if (!event.products || event.products.length === 0) {
    throw new Error('Cannot publish event without products');
  }
  
  if (!event.banner || !event.banner.imageUrl) {
    throw new Error('Cannot publish event without banner');
  }
  
  await updateDoc(eventRef, {
    isPublished: true,
    updatedAt: Timestamp.now()
  });
}
```

### 4. Real-Time Updates (Optional for Mobile)

```typescript
// Mobile: Listen to event changes
function subscribeToEvent(eventId: string, callback: (event: PromotionalEvent) => void) {
  const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
  
  return onSnapshot(eventRef, (snapshot) => {
    if (snapshot.exists()) {
      const event = {
        id: snapshot.id,
        ...snapshot.data()
      } as PromotionalEvent;
      callback(event);
    }
  });
}

// Usage
const unsubscribe = subscribeToEvent(eventId, (event) => {
  // Update UI with latest event data
  setEvent(event);
});
```

---

## Error Handling

### Common Errors

#### Permission Errors

```typescript
// Firebase Firestore permission errors
if (error.code === 'permission-denied') {
  // User doesn't have access
  // Could be:
  // - Not authenticated
  // - Not a promotional user
  // - Insufficient permissions
}
```

#### Validation Errors

```typescript
// Invalid discount percentage
if (discountPercentage < 1 || discountPercentage > 100) {
  throw new Error('Discount must be between 1 and 100');
}

// Invalid dates
if (endDate <= startDate) {
  throw new Error('End date must be after start date');
}

// Missing required data
if (!event.products || event.products.length === 0) {
  throw new Error('Event must have at least one product');
}
```

#### File Upload Errors

```typescript
// File too large
if (file.size > 5 * 1024 * 1024) {
  throw new Error('File size exceeds 5MB limit');
}

// Invalid file type
if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
  throw new Error('Invalid file type. Only JPEG, PNG, and WebP allowed');
}
```

---

## Security Considerations

### Firestore Security Rules

```javascript
// Example Firestore rules (needs to be implemented)
match /promotionalEvents/{eventId} {
  // Admin users can read/write their own events
  allow read, write: if request.auth != null && 
    exists(/databases/$(database)/documents/promotionalUsers/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/promotionalUsers/$(request.auth.uid)).data.isPromotionalUser == true;
  
  // Public can read published active events
  allow read: if resource.data.isPublished == true &&
    now >= resource.data.startDate.toMillis() &&
    now <= resource.data.endDate.toMillis();
}

match /promotionalUsers/{uid} {
  // Users can read their own document
  allow read: if request.auth != null && request.auth.uid == uid;
  
  // Only admins can create/update
  allow write: if request.auth != null && 
    exists(/databases/$(database)/documents/promotionalUsers/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/promotionalUsers/$(request.auth.uid)).data.role == 'superadmin';
}
```

### Best Practices for Mobile

1. **Validate on Client AND Server**
   - Always validate discount percentages (1-100)
   - Validate dates (end > start)
   - Validate file sizes and types

2. **Handle Network Errors**
   ```typescript
   try {
     await someOperation();
   } catch (error) {
     if (error.code === 'unavailable') {
       // Network error - show retry option
     } else if (error.code === 'permission-denied') {
       // Permission error - show access denied message
     }
   }
   ```

3. **Cache Active Events**
   - Cache active promotions for offline viewing
   - Implement cache invalidation on event updates

4. **Secure Authentication**
   - Store Firebase Auth tokens securely
   - Implement token refresh
   - Handle session expiry

---

## Mobile App Implementation Checklist

### Customer Features (Public)

- [ ] Fetch and display active promotional events
- [ ] Display promotional banners on home screen
- [ ] Show countdown timer for active promotions
- [ ] Browse promotional products with discounts
- [ ] Display original vs discounted prices (in USD)
- [ ] Show savings amount
- [ ] Display discount percentages (integer or 1 decimal place max)
- [ ] Add to cart button on product cards
- [ ] Navigate to product detail with discount
- [ ] Check if product has active discount (for product listings)
- [ ] Handle expired promotions gracefully
- [ ] Fetch vendor names from tailor_works collection

### Admin Features (Authenticated)

- [ ] Authentication (login/register)
- [ ] Invitation acceptance flow
- [ ] Create promotional events
- [ ] Edit event details (name, dates)
- [ ] Add/remove products from events
- [ ] Set/update discount percentages
- [ ] Upload banner images
- [ ] Publish/unpublish events
- [ ] View list of events
- [ ] Filter events by status
- [ ] Delete events (superadmin/admin only)

### Technical Implementation

- [ ] Firebase SDK setup (Firestore, Auth, Storage)
- [ ] Error handling and user feedback
- [ ] Loading states
- [ ] Offline support (cache active events)
- [ ] Image caching for banners
- [ ] Real-time updates (optional)
- [ ] Security rules implementation

---

## Example Mobile Implementation (React Native / Flutter)

### React Native Example

```typescript
// services/promotionalService.ts
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

export class PromotionalService {
  // Get active promotions
  static async getActivePromotions() {
    const now = firestore.Timestamp.now();
    const snapshot = await firestore()
      .collection('promotionalEvents')
      .where('isPublished', '==', true)
      .where('startDate', '<=', now)
      .where('endDate', '>=', now)
      .orderBy('startDate', 'desc')
      .get();
    
    const events = [];
    snapshot.forEach(doc => {
      const event = { id: doc.id, ...doc.data() };
      const start = event.startDate.toDate();
      const end = event.endDate.toDate();
      const current = new Date();
      
      if (current >= start && current <= end) {
        events.push(event);
      }
    });
    
    return events;
  }
  
  // Get promotional products
  static async getPromotionalProducts(eventId: string) {
    const eventDoc = await firestore()
      .collection('promotionalEvents')
      .doc(eventId)
      .get();
    
    if (!eventDoc.exists) return [];
    
    const event = eventDoc.data();
    if (!event.isPublished) return [];
    
    const products = [];
    for (const productDiscount of event.products || []) {
      const productDoc = await firestore()
        .collection('tailor_works')
        .doc(productDiscount.productId)
        .get();
      
      if (productDoc.exists) {
        const product = productDoc.data();
        
        // Calculate stacked discounts (existing + promotional)
        const basePrice = product.price?.base || productDiscount.originalPrice;
        const existingDiscount = product.discount || product.price?.discount || 0;
        const currentPrice = existingDiscount > 0
          ? basePrice * (1 - existingDiscount / 100)
          : basePrice;
        
        const promotionalDiscount = productDiscount.discountPercentage; // e.g., 2%
        const finalPrice = currentPrice * (1 - promotionalDiscount / 100);
        const totalDiscountPercentage = basePrice > 0 
          ? ((basePrice - finalPrice) / basePrice) * 100 
          : 0;
        
        products.push({
          ...product,
          originalPrice: basePrice,
          discountPercentage: totalDiscountPercentage, // Total discount (e.g., 11.8%)
          promotionalDiscountPercentage: promotionalDiscount, // Promotional only (e.g., 2%)
          discountedPrice: Math.round(finalPrice * 100) / 100,
          savings: basePrice - finalPrice
        });
      }
    }
    
    return products;
  }
}
```

### Flutter Example

```dart
// services/promotional_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

class PromotionalService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Get active promotions
  Future<List<PromotionalEvent>> getActivePromotions() async {
    final now = Timestamp.now();
    final snapshot = await _firestore
        .collection('promotionalEvents')
        .where('isPublished', isEqualTo: true)
        .where('startDate', isLessThanOrEqualTo: now)
        .where('endDate', isGreaterThanOrEqualTo: now)
        .orderBy('startDate', descending: true)
        .get();
    
    final events = <PromotionalEvent>[];
    for (var doc in snapshot.docs) {
      final event = PromotionalEvent.fromMap(doc.data(), doc.id);
      final start = event.startDate.toDate();
      final end = event.endDate.toDate();
      final current = DateTime.now();
      
      if (current.isAfter(start) && current.isBefore(end)) {
        events.add(event);
      }
    }
    
    return events;
  }
  
  // Get promotional products
  Future<List<ProductWithDiscount>> getPromotionalProducts(String eventId) async {
    final eventDoc = await _firestore
        .collection('promotionalEvents')
        .doc(eventId)
        .get();
    
    if (!eventDoc.exists) return [];
    
    final event = PromotionalEvent.fromMap(eventDoc.data()!, eventId);
    if (!event.isPublished) return [];
    
    final products = <ProductWithDiscount>[];
    for (var productDiscount in event.products) {
      final productDoc = await _firestore
          .collection('tailor_works')
          .doc(productDiscount.productId)
          .get();
      
      if (productDoc.exists) {
        final product = Product.fromMap(productDoc.data()!, productDiscount.productId);
        products.add(ProductWithDiscount(
          product: product,
          originalPrice: productDiscount.originalPrice,
          discountPercentage: productDiscount.discountPercentage,
          discountedPrice: productDiscount.discountedPrice,
          savings: productDiscount.originalPrice - productDiscount.discountedPrice,
        ));
      }
    }
    
    return products;
  }
}
```

---

## Key Points for Mobile Implementation

1. **No REST API Required**: All operations use Firebase SDK directly
2. **Real-time Capable**: Can use Firestore real-time listeners
3. **Offline Support**: Firestore supports offline persistence
4. **Image Handling**: Use Firebase Storage for banner images
5. **Authentication**: Use Firebase Auth (same as web)
6. **Security**: Implement Firestore security rules on backend
7. **Error Handling**: Handle permission errors, network errors, validation errors
8. **Status Calculation**: Always calculate event status based on current date
9. **Discount Calculation**: 
   - Account for existing product discounts first: `currentPrice = basePrice * (1 - existingDiscount / 100)`
   - Then apply promotional discount: `finalPrice = currentPrice * (1 - promotionalDiscount / 100)`
   - Example: $100 with 10% discount = $90, then 2% promotional = $88.20
   - Total discount from base: `((basePrice - finalPrice) / basePrice) * 100` = 11.8%
10. **Discount Badge Display**:
   - **Left Badge (Event Badge)**: Shows `promotionalDiscountPercentage` only (e.g., 2% for Black Friday)
   - **Right Badge (Total Discount)**: Shows total discount rounded to nearest integer using `Math.round()`
     - 11.8% → 12% (rounds up)
     - 11.2% → 11% (rounds down)
     - 11.5% → 12% (rounds up)
11. **Currency**: All prices displayed in USD with 2 decimal places (e.g., $99.99)
12. **Vendor Names**: Always fetch from `tailor_works` collection using `productRepository.getByIdWithTailorInfo()` to get enriched product data with vendor information
13. **Add to Cart**: Product cards include "Add to Cart" button that handles authentication and uses `addPromotionalProduct()` method

---

## Testing Checklist

### Customer Features
- [ ] Can fetch active promotions
- [ ] Can view promotional products
- [ ] Discounts are calculated correctly (stacked: existing + promotional)
- [ ] Badge display correct:
  - [ ] Left badge shows promotional discount only (e.g., "Black Friday -2%")
  - [ ] Right badge shows total discount rounded to nearest integer (e.g., "12% OFF")
- [ ] Prices displayed in USD with 2 decimal places
- [ ] Vendor names fetched correctly from tailor_works collection
- [ ] Add to cart button works on product cards
- [ ] Expired promotions are hidden
- [ ] Unpublished promotions are hidden
- [ ] Countdown timer works correctly
- [ ] Product discount check works

### Admin Features
- [ ] Can create events
- [ ] Can add products with discounts
- [ ] Can update discounts
- [ ] Can upload banners
- [ ] Can publish events
- [ ] Permission checks work correctly
- [ ] Validation errors are handled

---

## Support & Documentation

For implementation questions or issues, refer to:
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Queries: https://firebase.google.com/docs/firestore/query-data/queries
- Firebase Storage: https://firebase.google.com/docs/storage

---

## Recent Updates (December 2024)

### Currency & Formatting
- All prices now displayed in **USD** (not NGN)
- Prices formatted with 2 decimal places: `$99.99`

### Discount Calculation & Display

#### Stacked Discount Calculation
- Now accounts for **existing product discounts** before applying promotional discount
- **Example**: 
  - Product base price: `$100.00`
  - Existing product discount: `10%` → Current price: `$90.00`
  - Promotional discount: `2%` → Final price: `$88.20` (2% off $90)
  - Total discount from base: `11.8%` = `((100 - 88.20) / 100) * 100`

#### Badge Display Logic

**Two Badge System**:

1. **Left Badge (Event Badge - Black Friday tag)**
   - Shows: `promotionalDiscountPercentage` only (e.g., `2%`)
   - Source: `event.products[].discountPercentage` (from event data)
   - Display: `"Black Friday -2%"` or `"Event Name -2%"`
   - Component: `PromotionalEventBadge`

2. **Right Badge (Red discount badge)**
   - Shows: Total discount rounded to **nearest integer**
   - Source: `Math.round(product.discountPercentage)`
   - Rounding rules:
     - `11.8%` → `12%` (rounds up, .8 >= .5)
     - `11.2%` → `11%` (rounds down, .2 < .5)
     - `11.5%` → `12%` (rounds up, .5 >= .5)
   - Display: `"12% OFF"`
   - Component: `PromotionalBadge`

**Code Example**:
```typescript
// Left badge - promotional discount only
<PromotionalEventBadge
  eventName="Black Friday"
  discount={product.promotionalDiscountPercentage} // 2%
  showDiscount={true}
/>

// Right badge - total discount rounded
<PromotionalBadge
  discountPercentage={Math.round(product.discountPercentage)} // 11.8 → 12
  variant="compact"
/>
```

### ProductWithDiscount Interface Updates
- **Added**: `promotionalDiscountPercentage: number` - Promotional discount only (e.g., 2%)
- **Field**: `discountPercentage: number` - Total effective discount from base price (e.g., 11.8%)
- Both fields are included in all `ProductWithDiscount` objects

### Vendor Information
- Vendor names fetched from `tailor_works` collection using `productRepository.getByIdWithTailorInfo()`
- Ensures accurate vendor/tailor information is displayed
- No more "Unknown Vendor" when `tailor_id` exists
- Uses enriched product data that includes vendor/tailor details

### Add to Cart
- "Add to Cart" button added to promotional product cards
- Handles authentication (redirects to login if needed)
- Correctly applies stacked discounts when adding to cart
- Uses `promotionalDiscountPercentage` when storing in cart (not total discount)
- Cart stores promotional metadata: `isPromotional`, `promotionalEventId`, `promotionalEventName`, `discountPercentage`, etc.

---

**Last Updated**: December 2024
**Version**: 1.2

