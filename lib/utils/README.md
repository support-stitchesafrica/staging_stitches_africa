# User Profile Management System

This module provides a comprehensive user profile management system for tracking user onboarding status and determining user flow paths.

## Features

### Core Functionality
- **User Profile Creation**: Automatically create user profiles for new users
- **Onboarding Status Tracking**: Track whether users have completed measurements and onboarding
- **First-Time User Detection**: Determine if a user is accessing the app for the first time
- **Redirect Logic**: Intelligent routing based on user status

### Key Components

#### UserProfile Interface
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  onboardingStatus: {
    measurementsCompleted: boolean;
    profileCompleted: boolean;
    firstLoginCompleted: boolean;
  };
  preferences: {
    skipMeasurements?: boolean;
    // ... other preferences
  };
  metadata: {
    isFirstTimeUser: boolean;
    hasCompletedOnboarding: boolean;
    onboardingStep: 'pending' | 'measurements' | 'completed';
    loginCount: number;
  };
}
```

#### UserStatus Interface
```typescript
interface UserStatus {
  isFirstTime: boolean;
  hasCompletedMeasurements: boolean;
  lastLoginDate: Date;
  onboardingStep: 'pending' | 'measurements' | 'completed';
}
```

### Utility Functions

#### User Status Functions
- `isFirstTimeUser(uid)` - Check if user is first-time
- `hasCompletedOnboarding(uid)` - Check if onboarding is complete
- `getUserStatus(uid)` - Get comprehensive user status
- `getCurrentOnboardingStep(uid)` - Get current onboarding step

#### Profile Management Functions
- `createUserProfile(uid, email, displayName?, photoURL?)` - Create new user profile
- `getOrCreateUserProfile(uid, email, displayName?, photoURL?)` - Get existing or create new profile
- `updateUserProfile(uid, updates)` - Update user profile

#### Onboarding Functions
- `markMeasurementsCompleted(uid)` - Mark measurements as completed
- `markOnboardingCompleted(uid)` - Mark entire onboarding as completed
- `skipMeasurements(uid)` - Allow user to skip measurements

#### Navigation Functions
- `getRedirectPath(uid)` - Get appropriate redirect path based on user status
- `shouldShowMeasurements(uid)` - Determine if measurements screen should be shown

## Usage Examples

### Creating a User Profile
```typescript
import { createUserProfile } from '@/lib/utils';

const profile = await createUserProfile(
  user.uid,
  user.email,
  user.displayName,
  user.photoURL
);
```

### Checking User Status
```typescript
import { isFirstTimeUser, hasCompletedOnboarding } from '@/lib/utils';

const isFirstTime = await isFirstTimeUser(user.uid);
const hasCompleted = await hasCompletedOnboarding(user.uid);

if (isFirstTime && !hasCompleted) {
  // Redirect to measurements
} else {
  // Redirect to landing page
}
```

### Handling Onboarding Completion
```typescript
import { markMeasurementsCompleted, skipMeasurements } from '@/lib/utils';

// When user completes measurements
await markMeasurementsCompleted(user.uid);

// When user skips measurements
await skipMeasurements(user.uid);
```

## Firestore Collections

The system uses the following Firestore collection structure:

```
user_profiles/{uid}
├── uid: string
├── email: string
├── displayName?: string
├── photoURL?: string
├── createdAt: Date
├── lastLoginAt: Date
├── onboardingStatus: object
├── preferences: object
└── metadata: object
```

## Error Handling

All functions include comprehensive error handling with:
- Detailed error logging
- Graceful fallbacks for safety
- Meaningful error messages
- Default values that prioritize user experience

## Requirements Addressed

This implementation addresses the following requirements:
- **2.3**: Redirect flow distinguishes between new and returning users
- **3.3**: Redirect flow marks users as having completed onboarding
- **3.4**: Redirect flow doesn't show measurements to users who have completed it