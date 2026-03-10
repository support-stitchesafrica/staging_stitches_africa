# Specific Collections Duplication Summary

## Overview
Successfully duplicated 8 specific collections to create staging versions with the "staging_" prefix. This ensures these collections have staging data available while preserving production data.

## Collections Duplicated

### 1. **storefrontConfigurations** → **staging_storefrontConfigurations**
- **Documents**: 1
- **Status**: ✅ Success
- **Purpose**: Storefront configuration settings

### 2. **storefront_analytics** → **staging_storefront_analytics**
- **Documents**: 142
- **Status**: ✅ Success
- **Purpose**: Analytics data for storefronts

### 3. **storefront_themes** → **staging_storefront_themes**
- **Documents**: 7
- **Status**: ✅ Success
- **Purpose**: Theme configurations for storefronts

### 4. **storefronts** → **staging_storefronts**
- **Documents**: 13
- **Status**: ✅ Success
- **Purpose**: Main storefront data

### 5. **sub_collect** → **staging_sub_collect**
- **Documents**: 3
- **Status**: ✅ Success
- **Subcollections**: Found and duplicated subcollection "subscribers" (3 documents)
- **Purpose**: Sub-collection management

### 6. **subscribers** → **staging_subscribers**
- **Documents**: 154
- **Status**: ✅ Success
- **Purpose**: Subscriber data

### 7. **tailor_works** → **staging_tailor_works**
- **Documents**: 734
- **Status**: ✅ Success
- **Batches**: 2 (500 + 234 documents)
- **Purpose**: Tailor work/product data

### 8. **tailor_works_local** → **staging_tailor_works_local**
- **Documents**: 824
- **Status**: ✅ Success
- **Batches**: 2 (500 + 324 documents)
- **Purpose**: Local copy of tailor work data

## Summary Statistics
- **Total Collections Processed**: 8
- **Successful Duplications**: 8 (100%)
- **Failed Duplications**: 0
- **Total Documents Duplicated**: 1,878
- **Subcollections Found**: 1 (in sub_collect)
- **Subcollection Documents**: 3

## Technical Details

### Batch Processing
- Used Firebase batch writes for optimal performance
- Maximum batch size: 500 documents per batch
- Large collections (tailor_works, tailor_works_local) processed in multiple batches
- Automatic batch management to avoid Firebase limits

### Subcollection Handling
- Automatically detected and duplicated subcollections
- Found subcollection "subscribers" within sub_collect documents
- Preserved document structure and relationships

### Error Handling
- Robust error handling for each collection
- Detailed logging of progress and issues
- Graceful handling of empty collections

## Created Scripts

### 1. **scripts/duplicate-specific-collections.js**
- JavaScript version for easy execution
- No TypeScript compilation required
- Direct Firebase Admin SDK usage

### 2. **scripts/duplicate-specific-collections.ts**
- TypeScript version with type safety
- Integrates with existing Firebase setup
- Better IDE support and error checking

### 3. **Package.json Scripts Added**
- `npm run duplicate:specific` - Run JavaScript version
- `npm run duplicate:specific:ts` - Run TypeScript version

## Usage

### Quick Execution
```bash
npm run duplicate:specific
```

### Direct Execution
```bash
node scripts/duplicate-specific-collections.js
```

### TypeScript Version
```bash
npm run duplicate:specific:ts
```

## Data Verification

All staging collections are now available:
- ✅ staging_storefrontConfigurations (1 document)
- ✅ staging_storefront_analytics (142 documents)
- ✅ staging_storefront_themes (7 documents)
- ✅ staging_storefronts (13 documents)
- ✅ staging_sub_collect (3 documents + subcollections)
- ✅ staging_subscribers (154 documents)
- ✅ staging_tailor_works (734 documents)
- ✅ staging_tailor_works_local (824 documents)

## Next Steps

1. **Verify Data Integrity**: Check that all documents were copied correctly
2. **Update Application Code**: Ensure all references to these collections use staging_ prefix
3. **Test Functionality**: Verify that features using these collections work with staging data
4. **Monitor Performance**: Check that staging collections perform adequately

## Environment Configuration

These collections will be used when:
- `NEXT_PUBLIC_USE_STAGING_COLLECTIONS=true`
- `USE_STAGING_COLLECTIONS=true`

The duplication is complete and all specified collections now have staging versions available for development and testing purposes.