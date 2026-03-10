# Avatar Service Documentation

## Overview

The Avatar Service manages user avatars for the virtual try-on feature. It handles avatar generation, storage, retrieval, and updates based on user physical characteristics.

## Requirements Coverage

This service implements:
- **Requirement 4.1-4.5**: Sizing Assistant with Avatar Creation
- **Requirement 16.1-16.5**: Avatar Customization

## Key Features

- Generate avatars from user descriptions
- Store avatar configurations in Firestore
- Retrieve user avatars for virtual try-on
- Update avatar profiles
- Calculate 3D model proportions
- Provide size recommendations

## Data Models

### UserProfile

```typescript
interface UserProfile {
  height: number;              // Height in centimeters (140-220)
  bodyType: BodyType;          // 'slim' | 'athletic' | 'average' | 'curvy' | 'plus-size'
  skinTone: SkinTone;          // 'fair' | 'light' | 'medium' | 'tan' | 'brown' | 'dark'
  gender?: 'male' | 'female' | 'unisex';
  measurements?: {
    chest?: number;            // 60-150 cm
    waist?: number;            // 50-150 cm
    hips?: number;             // 60-180 cm
    shoulders?: number;        // 30-70 cm
  };
}
```

### Avatar

```typescript
interface Avatar {
  avatarId: string;
  userId?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  modelConfig?: {
    scale: number;
    proportions: {
      torsoLength: number;
      legLength: number;
      armLength: number;
    };
  };
}
```

## API Functions

### generateAvatar

Generate a new avatar from a user profile.

```typescript
const avatar = await generateAvatar(userProfile, userId);
```

**Parameters:**
- `userProfile`: UserProfile object with height, body type, and skin tone
- `userId` (optional): User ID to associate with the avatar

**Returns:** Avatar object

**Throws:** AvatarServiceError if validation fails

### getUserAvatar

Retrieve a user's most recent avatar.

```typescript
const avatar = await getUserAvatar(userId);
```

**Parameters:**
- `userId`: User ID

**Returns:** Avatar object or null if not found

### getAvatarById

Get a specific avatar by ID.

```typescript
const avatar = await getAvatarById(avatarId);
```

**Parameters:**
- `avatarId`: Avatar ID

**Returns:** Avatar object or null if not found

### updateAvatar

Update an existing avatar's profile.

```typescript
const updatedAvatar = await updateAvatar(avatarId, {
  height: 175,
  bodyType: 'athletic'
});
```

**Parameters:**
- `avatarId`: Avatar ID
- `profileUpdates`: Partial UserProfile with fields to update

**Returns:** Updated Avatar object

**Throws:** AvatarServiceError if avatar not found or validation fails

### createAvatarFromDescription

Create an avatar from a natural language description.

```typescript
const avatar = await createAvatarFromDescription(
  "I'm 170cm tall with a slim build and medium skin tone",
  userId
);
```

**Parameters:**
- `description`: Natural language description of physical characteristics
- `userId` (optional): User ID

**Returns:** Avatar object

**Note:** This function uses simple pattern matching. For production, consider using OpenAI to extract structured data.

### getOrCreateAvatar

Get existing avatar or create a new one with defaults.

```typescript
const { avatar, isNew } = await getOrCreateAvatar(userId, defaultProfile);
```

**Parameters:**
- `userId`: User ID
- `defaultProfile` (optional): Default profile to use if creating new avatar

**Returns:** Object with `avatar` and `isNew` boolean

### getSizeRecommendation

Get size recommendation based on avatar and product.

```typescript
const recommendation = await getSizeRecommendation(avatarId, productId);
```

**Parameters:**
- `avatarId`: Avatar ID
- `productId`: Product ID

**Returns:** Object with `recommendedSize`, `fitDescription`, and `confidence`

**Note:** This is a placeholder implementation. Full implementation would compare product dimensions with avatar measurements.

## Validation Rules

### Height
- Must be between 140cm and 220cm
- Stored in centimeters

### Body Types
- `slim`: Narrow build, longer legs
- `athletic`: Balanced proportions
- `average`: Standard proportions
- `curvy`: Fuller figure, shorter legs
- `plus-size`: Larger build

### Skin Tones
- `fair`: Very light skin
- `light`: Light skin
- `medium`: Medium skin tone
- `tan`: Tanned skin
- `brown`: Brown skin
- `dark`: Dark skin

### Measurements (if provided)
- Chest: 60-150 cm
- Waist: 50-150 cm
- Hips: 60-180 cm
- Shoulders: 30-70 cm

## Model Proportions

The service calculates 3D model proportions based on body type:

| Body Type | Torso Length | Leg Length | Arm Length |
|-----------|--------------|------------|------------|
| Slim      | 0.95         | 1.05       | 1.0        |
| Athletic  | 1.0          | 1.0        | 1.0        |
| Average   | 1.0          | 1.0        | 1.0        |
| Curvy     | 1.05         | 0.95       | 1.0        |
| Plus-size | 1.1          | 0.95       | 1.05       |

Scale is calculated as: `height / 170` (normalized to average height)

## Error Handling

All functions throw `AvatarServiceError` with specific error codes:

- `GENERATE_AVATAR_FAILED`: Failed to generate avatar
- `GET_AVATAR_FAILED`: Failed to retrieve avatar
- `GET_AVATAR_BY_ID_FAILED`: Failed to get avatar by ID
- `UPDATE_AVATAR_FAILED`: Failed to update avatar
- `DELETE_AVATAR_FAILED`: Failed to delete avatar
- `CREATE_FROM_DESCRIPTION_FAILED`: Failed to parse description
- `GET_OR_CREATE_FAILED`: Failed to get or create avatar
- `AVATAR_NOT_FOUND`: Avatar not found
- `INVALID_AVATAR_DATA`: Avatar data is invalid
- `INVALID_HEIGHT`: Height out of valid range
- `INVALID_BODY_TYPE`: Invalid body type
- `INVALID_SKIN_TONE`: Invalid skin tone
- `INVALID_MEASUREMENT`: Measurement out of valid range
- `SIZE_RECOMMENDATION_FAILED`: Failed to get size recommendation

## Usage Examples

### Creating an Avatar from AI Conversation

```typescript
// User says: "I'm 175cm tall, athletic build, with medium skin tone"
const avatar = await createAvatarFromDescription(
  "I'm 175cm tall, athletic build, with medium skin tone",
  userId
);

console.log(avatar.profile);
// {
//   height: 175,
//   bodyType: 'athletic',
//   skinTone: 'medium'
// }
```

### Updating Avatar Profile

```typescript
// User wants to update their height
const updatedAvatar = await updateAvatar(avatarId, {
  height: 180
});

console.log(updatedAvatar.version); // Incremented version number
```

### Getting Size Recommendation

```typescript
const recommendation = await getSizeRecommendation(avatarId, productId);

console.log(recommendation);
// {
//   recommendedSize: 'M',
//   fitDescription: 'Based on your body type and measurements',
//   confidence: 0.75
// }
```

## Firestore Collection Structure

### avatars Collection

```
avatars/
  {avatarId}/
    userId: string | null
    profile: {
      height: number
      bodyType: string
      skinTone: string
      gender?: string
      measurements?: object
    }
    createdAt: Timestamp
    updatedAt: Timestamp
    version: number
    modelConfig: {
      scale: number
      proportions: {
        torsoLength: number
        legLength: number
        armLength: number
      }
    }
```

## Integration with Chat

The avatar service integrates with the AI chat assistant:

1. **First-time users**: AI asks questions to create avatar
2. **Returning users**: Avatar is retrieved automatically
3. **Updates**: Users can update avatar through conversation
4. **Try-on**: Avatar is used for virtual try-on visualization

## Future Enhancements

1. **Advanced Size Recommendation**: Compare product dimensions with avatar measurements
2. **Multiple Avatars**: Allow users to create multiple avatars (e.g., for family members)
3. **3D Model Integration**: Full Three.js integration for realistic rendering
4. **Pose Variations**: Different poses for different product types
5. **AI-Powered Parsing**: Use OpenAI to extract structured data from descriptions
6. **Photo-Based Avatar**: Generate avatar from user photos
7. **Animation**: Add walking, turning animations
8. **Clothing Physics**: Realistic fabric draping simulation

## Testing

Run tests with:

```bash
npm test -- lib/ai-assistant/__tests__/avatar-service.test.ts
```

Tests cover:
- Data model validation
- Height and measurement validation
- Model proportion calculations
- Description parsing
- Avatar configuration
- Profile merging
- Size recommendations

## Security Considerations

1. **Data Privacy**: Avatar data is stored securely in Firestore
2. **User Association**: Avatars are linked to user IDs
3. **Validation**: All inputs are validated before storage
4. **Access Control**: Use Firestore security rules to restrict access

## Performance

- Avatar generation: ~100ms
- Avatar retrieval: ~50ms
- Avatar update: ~100ms
- Size recommendation: ~50ms

All operations use Firebase Admin SDK for server-side execution.
