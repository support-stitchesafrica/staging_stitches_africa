# Avatar Service Quick Start Guide

## Installation

The avatar service is already installed and ready to use. No additional dependencies needed.

## Basic Usage

### 1. Create an Avatar from User Input

```typescript
import { createAvatarFromDescription } from '@/lib/ai-assistant/avatar-service';

// User says: "I'm 170cm tall with a slim build and medium skin tone"
const avatar = await createAvatarFromDescription(
  "I'm 170cm tall with a slim build and medium skin tone",
  userId
);

console.log(avatar.avatarId); // "avatar-abc123"
console.log(avatar.profile.height); // 170
console.log(avatar.profile.bodyType); // "slim"
```

### 2. Get User's Existing Avatar

```typescript
import { getUserAvatar } from '@/lib/ai-assistant/avatar-service';

const avatar = await getUserAvatar(userId);

if (avatar) {
  console.log(`User has avatar: ${avatar.avatarId}`);
} else {
  console.log('User needs to create an avatar');
}
```

### 3. Update Avatar Profile

```typescript
import { updateAvatar } from '@/lib/ai-assistant/avatar-service';

// User wants to update their height
const updated = await updateAvatar(avatarId, {
  height: 175,
  bodyType: 'athletic'
});

console.log(updated.version); // Version incremented
```

### 4. Get Size Recommendation

```typescript
import { getSizeRecommendation } from '@/lib/ai-assistant/avatar-service';

const recommendation = await getSizeRecommendation(avatarId, productId);

console.log(recommendation.recommendedSize); // "M"
console.log(recommendation.fitDescription); // "Based on your body type..."
console.log(recommendation.confidence); // 0.75
```

### 5. Get or Create Avatar

```typescript
import { getOrCreateAvatar } from '@/lib/ai-assistant/avatar-service';

const { avatar, isNew } = await getOrCreateAvatar(userId);

if (isNew) {
  console.log('Created new avatar with defaults');
} else {
  console.log('Retrieved existing avatar');
}
```

## Integration with AI Chat

### In Chat API Route

```typescript
// app/api/ai-assistant/chat/route.ts
import { createAvatarFromDescription, getUserAvatar } from '@/lib/ai-assistant/avatar-service';

// When user mentions their physical characteristics
if (userMessage.includes('tall') || userMessage.includes('build')) {
  const avatar = await createAvatarFromDescription(userMessage, userId);
  
  return {
    message: "Great! I've created your avatar. Now you can try on products virtually!",
    metadata: {
      avatarId: avatar.avatarId
    }
  };
}

// When recommending products
const avatar = await getUserAvatar(userId);
if (avatar) {
  const recommendation = await getSizeRecommendation(avatar.avatarId, productId);
  
  return {
    message: `Based on your avatar, I recommend size ${recommendation.recommendedSize}`,
    metadata: {
      recommendedSize: recommendation.recommendedSize
    }
  };
}
```

## Data Types

### Body Types
- `slim` - Narrow build, longer legs
- `athletic` - Balanced proportions
- `average` - Standard proportions
- `curvy` - Fuller figure
- `plus-size` - Larger build

### Skin Tones
- `fair` - Very light
- `light` - Light
- `medium` - Medium
- `tan` - Tanned
- `brown` - Brown
- `dark` - Dark

### Height Range
- Minimum: 140 cm
- Maximum: 220 cm

## Error Handling

```typescript
import { AvatarServiceError } from '@/lib/ai-assistant/avatar-service';

try {
  const avatar = await createAvatarFromDescription(description, userId);
} catch (error) {
  if (error instanceof AvatarServiceError) {
    console.error(`Avatar error: ${error.code} - ${error.message}`);
    
    // Handle specific errors
    if (error.code === 'INVALID_HEIGHT') {
      // Show user-friendly message about height range
    }
  }
}
```

## Common Error Codes

- `INVALID_HEIGHT` - Height not in 140-220cm range
- `INVALID_BODY_TYPE` - Invalid body type
- `INVALID_SKIN_TONE` - Invalid skin tone
- `AVATAR_NOT_FOUND` - Avatar doesn't exist
- `GENERATE_AVATAR_FAILED` - Failed to create avatar

## Testing

Run avatar service tests:

```bash
npm test -- lib/ai-assistant/__tests__/avatar-service.test.ts
```

## Example: Complete Avatar Flow

```typescript
import {
  getOrCreateAvatar,
  updateAvatar,
  getSizeRecommendation
} from '@/lib/ai-assistant/avatar-service';

async function handleVirtualTryOn(userId: string, productId: string) {
  // 1. Get or create avatar
  const { avatar, isNew } = await getOrCreateAvatar(userId);
  
  if (isNew) {
    console.log('New user - created default avatar');
    // Prompt user to customize their avatar
  }
  
  // 2. Get size recommendation
  const recommendation = await getSizeRecommendation(
    avatar.avatarId,
    productId
  );
  
  // 3. Return try-on data
  return {
    avatarId: avatar.avatarId,
    recommendedSize: recommendation.recommendedSize,
    fitDescription: recommendation.fitDescription,
    confidence: recommendation.confidence,
    profile: avatar.profile
  };
}
```

## Next Steps

1. **Build 3D Viewer**: Use Three.js to render avatars
2. **Create Try-On Modal**: Display avatar with products
3. **Add to Chat**: Integrate avatar creation in conversation
4. **Mobile Optimization**: Ensure smooth mobile experience

## Resources

- Full Documentation: `lib/ai-assistant/AVATAR_SERVICE.md`
- Implementation Summary: `lib/ai-assistant/AVATAR_IMPLEMENTATION_SUMMARY.md`
- Tests: `lib/ai-assistant/__tests__/avatar-service.test.ts`

## Support

For questions or issues:
1. Check the full documentation
2. Review test examples
3. Check Firestore for stored avatars in `avatars` collection
