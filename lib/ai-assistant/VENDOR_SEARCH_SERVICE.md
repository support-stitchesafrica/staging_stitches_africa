# Vendor Search Service

The Vendor Search Service handles vendor/tailor search and filtering for the AI shopping assistant.

## Features

- Search vendors by name, location, specialties
- Filter by rating, experience, location
- Get featured vendors
- Get top-rated vendors
- Format vendor data for AI responses

## Usage

```typescript
import { VendorSearchService } from '@/lib/ai-assistant/vendor-search-service';

// Search vendors with query and filters
const vendors = await VendorSearchService.searchVendors(
  'traditional wear',
  {
    location: 'Lagos',
    minRating: 4.0,
    specialties: ['Bespoke'],
  },
  10
);

// Get vendor by ID
const vendor = await VendorSearchService.getById('vendor_123');

// Get multiple vendors by IDs
const vendors = await VendorSearchService.getByIds(['vendor_1', 'vendor_2']);

// Get featured vendors
const featured = await VendorSearchService.getFeaturedVendors(5);

// Get top-rated vendors
const topRated = await VendorSearchService.getTopRated(10);

// Get vendors by location
const lagosVendors = await VendorSearchService.getByLocation('Lagos', 'Lagos State', 10);
```

## Filters

```typescript
interface VendorSearchFilters {
  location?: string;        // Search in city, state, or address
  city?: string;           // Filter by specific city
  state?: string;          // Filter by specific state
  country?: string;        // Filter by country
  minRating?: number;      // Minimum rating (0-5)
  type?: string[];         // Vendor types/specialties
  featured?: boolean;      // Only featured vendors
  minExperience?: number;  // Minimum years of experience
  status?: string;         // Vendor status (default: 'approved')
  specialties?: string[];  // Filter by specialties
}
```

## Formatted Vendor Response

```typescript
interface FormattedVendor {
  id: string;
  name: string;
  logo?: string;
  rating: number;
  location: string;        // "City, State"
  city: string;
  state: string;
  country: string;
  specialties: string[];   // Vendor types/specialties
  yearsOfExperience: number;
  status: string;
  shopUrl: string;         // URL to vendor's shop page
}
```

## Integration with AI Assistant

The service is integrated with the AI assistant chat API:

1. AI generates vendor IDs using `[VENDOR:vendor_id]` markers
2. Chat API extracts vendor IDs from AI response
3. Service fetches vendor details by IDs
4. API returns formatted vendor cards to frontend
5. Frontend displays vendor cards with quick actions

## Vendor Card Actions

- **Visit Shop**: Navigate to vendor's shop page
- **View Products**: Show products filtered by vendor

## Requirements Covered

- Requirement 3.1: Vendor recommendations based on ratings, location, and specialties
- Requirement 3.2: Display vendor cards with name, rating, location, and specialties
- Requirement 3.3: Navigate to vendor's shop page
- Requirement 3.4: Filter by vendor categories
- Requirement 3.5: Prioritize highly-rated and verified vendors
- Requirement 13.3: Provide accurate vendor information

## API Endpoints

### POST /api/ai-assistant/vendors
Get vendors by IDs

```typescript
// Request
{
  "vendorIds": ["vendor_1", "vendor_2"]
}

// Response
{
  "vendors": [...],
  "count": 2
}
```

### GET /api/ai-assistant/vendors
Search vendors with filters

```typescript
// Query params
?query=traditional&location=Lagos&minRating=4.0&limit=10

// Response
{
  "vendors": [...],
  "count": 5
}
```

## Testing

The service can be tested by:

1. Asking the AI assistant about vendors
2. Requesting vendor recommendations
3. Searching for vendors by location
4. Filtering by specialties

Example queries:
- "Show me tailors in Lagos"
- "I need a vendor for traditional wear"
- "Find me highly-rated tailors"
- "Who are the best vendors for bespoke clothing?"
