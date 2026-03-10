# Product Search Service

The Product Search Service provides AI-driven product search and filtering capabilities for the AI Shopping Assistant.

## Overview

This service queries Firestore products from the `tailor_works` collection and applies intelligent filters based on AI criteria. It returns formatted product data optimized for AI responses and chat display.

## Features

- **Text Search**: Search products by title, description, category, vendor, tags, and keywords
- **Advanced Filtering**: Filter by category, price range, type, vendor, availability, and more
- **Product Formatting**: Returns clean, formatted product data for AI responses
- **Caching**: Leverages existing product repository caching for performance
- **Vendor Enrichment**: Automatically includes vendor information with products

## Usage

### Basic Search

```typescript
import { ProductSearchService } from '@/lib/ai-assistant/product-search-service';

// Search with query
const products = await ProductSearchService.searchProducts('ankara dress');

// Search with filters
const products = await ProductSearchService.searchProducts('traditional', {
  minPrice: 10000,
  maxPrice: 50000,
  type: 'ready-to-wear',
  availability: 'in_stock'
});

// Limit results
const products = await ProductSearchService.searchProducts('dress', {}, 5);
```

### Category Search

```typescript
// Get products by category
const products = await ProductSearchService.getByCategory('Traditional Wear', 10);
```

### Vendor Search

```typescript
// Get products by vendor ID
const products = await ProductSearchService.getByVendor('vendor-123', 10);
```

### Special Collections

```typescript
// Get discounted products
const discounted = await ProductSearchService.getDiscountedProducts(10);

// Get new arrivals (last 30 days)
const newArrivals = await ProductSearchService.getNewArrivals(30, 10);
```

### Get by ID

```typescript
// Get single product
const product = await ProductSearchService.getById('product-123');

// Get multiple products
const products = await ProductSearchService.getByIds(['prod-1', 'prod-2', 'prod-3']);
```

### Helper Methods

```typescript
// Get all available categories
const categories = await ProductSearchService.getCategories();

// Get price range
const priceRange = await ProductSearchService.getPriceRange();
// Returns: { min: 5000, max: 150000 }
```

## Data Models

### ProductSearchFilters

```typescript
interface ProductSearchFilters {
  category?: string;              // Filter by category
  minPrice?: number;              // Minimum price in NGN
  maxPrice?: number;              // Maximum price in NGN
  type?: 'ready-to-wear' | 'bespoke';  // Product type
  vendorId?: string;              // Filter by vendor ID
  vendorName?: string;            // Filter by vendor name (partial match)
  tags?: string[];                // Filter by tags (any match)
  availability?: 'in_stock' | 'pre_order' | 'out_of_stock';
  featured?: boolean;             // Filter featured products
  isNewArrival?: boolean;         // Filter new arrivals
  isBestSeller?: boolean;         // Filter best sellers
}
```

### FormattedProduct

```typescript
interface FormattedProduct {
  id: string;                     // Product ID
  title: string;                  // Product title
  description: string;            // Product description
  price: number;                  // Base price
  currency: string;               // Currency (NGN)
  discount?: number;              // Discount percentage (if any)
  finalPrice: number;             // Price after discount
  images: string[];               // Product images
  category: string;               // Product category
  type: 'ready-to-wear' | 'bespoke';
  availability: string;           // Availability status
  vendor: {
    id: string;                   // Vendor ID
    name: string;                 // Vendor name
    logo?: string;                // Vendor logo URL
  };
  tags: string[];                 // Product tags
  deliveryTimeline?: string;      // Delivery timeline
}
```

## Filter Behavior

### Text Search
- Searches across: title, description, category, vendor name, tags, keywords
- Case-insensitive
- Matches any search term (OR logic)

### Price Range
- `minPrice`: Filters products >= minPrice
- `maxPrice`: Filters products <= maxPrice
- Both can be used together

### Category
- Case-insensitive partial match
- Example: "traditional" matches "Traditional Wear"

### Vendor
- Can filter by exact vendor ID or partial vendor name
- Case-insensitive for name matching

### Tags
- Matches if product has ANY of the specified tags
- Case-insensitive partial match

### Availability
- Exact match: 'in_stock', 'pre_order', or 'out_of_stock'

## Performance

- Uses existing product repository with caching
- Category queries cached for 5 minutes
- Discounted products cached for 10 minutes
- Individual products cached for 10 minutes
- Filters applied in-memory for flexibility

## Error Handling

All methods throw descriptive errors:

```typescript
try {
  const products = await ProductSearchService.searchProducts('dress');
} catch (error) {
  console.error('Search failed:', error.message);
  // Handle error appropriately
}
```

## Integration with AI Assistant

The service is designed to work seamlessly with the OpenAI service:

```typescript
// In OpenAI service
const products = await ProductSearchService.searchProducts(
  userQuery,
  extractedFilters,
  10
);

// Format for AI response
const productCards = products.map(p => ({
  type: 'product',
  data: p
}));
```

## Requirements Coverage

This service implements the following requirements:

- **Requirement 2.1**: Query product database and return relevant matches
- **Requirement 2.2**: Display products as visual cards with details
- **Requirement 2.4**: Filter products by styles and occasions
- **Requirement 8.1**: Extract key search terms from user descriptions
- **Requirement 8.2**: Query Firestore with relevant filters
- **Requirement 8.3**: Present results conversationally

## Testing

Run tests with:

```bash
npm test -- lib/ai-assistant/__tests__/product-search-service.test.ts
```

Tests cover:
- Data model validation
- Price calculations
- Filter logic
- Search query processing
- Result limiting
- Tag and vendor filtering
- Helper methods

## Future Enhancements

- Full-text search integration (Algolia/Meilisearch)
- Relevance scoring
- Personalized recommendations
- Search analytics
- A/B testing support
