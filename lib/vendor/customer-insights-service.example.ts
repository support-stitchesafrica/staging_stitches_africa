/**
 * Customer Insights Service Usage Examples
 * Demonstrates how to use the CustomerInsightsService
 */

import { CustomerInsightsService } from './customer-insights-service';

// Initialize the service
const customerInsightsService = new CustomerInsightsService();

/**
 * Example 1: Segment customers for a vendor
 */
async function segmentVendorCustomers(vendorId: string) {
  const result = await customerInsightsService.segmentCustomers(vendorId);
  
  if (result.success && result.data) {
    console.log('Customer Segments:');
    result.data.forEach(segment => {
      console.log(`\n${segment.type.toUpperCase()}:`);
      console.log(`  Count: ${segment.count}`);
      console.log(`  Percentage: ${segment.percentage}%`);
      console.log(`  Average Order Value: $${segment.averageOrderValue}`);
      console.log(`  Total Revenue: $${segment.totalRevenue}`);
      console.log(`  Purchase Frequency: ${segment.averagePurchaseFrequency}`);
    });
  } else {
    console.error('Failed to segment customers:', result.error);
  }
}

/**
 * Example 2: Get anonymized customer list
 */
async function getAnonymizedCustomerList(vendorId: string) {
  const result = await customerInsightsService.getAnonymizedCustomers(vendorId);
  
  if (result.success && result.data) {
    console.log(`\nFound ${result.data.length} customers`);
    
    // Display first 5 customers
    result.data.slice(0, 5).forEach(customer => {
      console.log(`\nCustomer ${customer.customerId}:`);
      console.log(`  Segment: ${customer.segment}`);
      console.log(`  Location: ${customer.location.city}, ${customer.location.state}`);
      console.log(`  Lifetime Value: $${customer.lifetimeValue}`);
      console.log(`  Order Count: ${customer.orderCount}`);
      console.log(`  Average Order Value: $${customer.averageOrderValue}`);
      console.log(`  Last Purchase: ${customer.lastPurchaseDate.toLocaleDateString()}`);
    });
  } else {
    console.error('Failed to get customers:', result.error);
  }
}

/**
 * Example 3: Calculate customer lifetime value
 */
async function calculateCustomerValue(customerId: string, vendorId: string) {
  const result = await customerInsightsService.calculateLifetimeValue(customerId, vendorId);
  
  if (result.success && result.data !== undefined) {
    console.log(`\nCustomer Lifetime Value: $${result.data}`);
  } else {
    console.error('Failed to calculate lifetime value:', result.error);
  }
}

/**
 * Example 4: Get location insights
 */
async function getLocationBreakdown(vendorId: string) {
  const result = await customerInsightsService.getLocationInsights(vendorId);
  
  if (result.success && result.data) {
    console.log('\nLocation Insights:');
    result.data.forEach(location => {
      console.log(`\n${location.city}, ${location.state}:`);
      console.log(`  Customers: ${location.customerCount}`);
      console.log(`  Revenue: $${location.revenue}`);
      console.log(`  Percentage: ${location.percentage}%`);
    });
  } else {
    console.error('Failed to get location insights:', result.error);
  }
}

/**
 * Example 5: Anonymize customer data manually
 */
function anonymizeCustomerExample() {
  const customerData = {
    id: 'user123',
    email: 'customer@example.com',
    phone: '+2348012345678',
    address: '123 Main Street, Apartment 4B',
    city: 'Lagos',
    state: 'Lagos State',
    orders: [
      {
        timestamp: new Date('2024-01-15'),
        price: 15000,
        products: ['product1', 'product2'],
        wear_category: 'Shirts'
      },
      {
        timestamp: new Date('2024-02-20'),
        price: 25000,
        products: ['product3'],
        wear_category: 'Trousers'
      }
    ],
    lifetimeValue: 40000,
    averageOrderValue: 20000,
    orderCount: 2,
    lastPurchaseDate: new Date('2024-02-20')
  };

  const anonymized = customerInsightsService.anonymizeCustomerData(customerData);
  
  console.log('\nAnonymized Customer Data:');
  console.log(JSON.stringify(anonymized, null, 2));
  
  // Verify PII is removed
  console.log('\nPII Removed:');
  console.log(`  Email: ${!('email' in anonymized) ? '✓' : '✗'}`);
  console.log(`  Phone: ${!('phone' in anonymized) ? '✓' : '✗'}`);
  console.log(`  Address: ${!('address' in anonymized) ? '✓' : '✗'}`);
  console.log(`  Customer ID Hashed: ${anonymized.customerId !== customerData.id ? '✓' : '✗'}`);
}

/**
 * Example 6: Segment customers with date range filter
 */
async function segmentCustomersInDateRange(vendorId: string) {
  const dateRange = {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
    preset: 'custom' as const
  };

  const result = await customerInsightsService.segmentCustomers(vendorId, dateRange);
  
  if (result.success && result.data) {
    console.log(`\nCustomer Segments for ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}:`);
    result.data.forEach(segment => {
      console.log(`  ${segment.type}: ${segment.count} customers (${segment.percentage}%)`);
    });
  }
}

// Export examples for use
export {
  segmentVendorCustomers,
  getAnonymizedCustomerList,
  calculateCustomerValue,
  getLocationBreakdown,
  anonymizeCustomerExample,
  segmentCustomersInDateRange
};

/**
 * Usage in API Route:
 * 
 * import { CustomerInsightsService } from '@/lib/vendor';
 * 
 * export async function GET(request: Request) {
 *   const { searchParams } = new URL(request.url);
 *   const vendorId = searchParams.get('vendorId');
 *   
 *   if (!vendorId) {
 *     return Response.json({ error: 'Vendor ID required' }, { status: 400 });
 *   }
 *   
 *   const service = new CustomerInsightsService();
 *   const result = await service.segmentCustomers(vendorId);
 *   
 *   if (result.success) {
 *     return Response.json(result.data);
 *   } else {
 *     return Response.json({ error: result.error }, { status: 500 });
 *   }
 * }
 */

/**
 * Usage in React Component:
 * 
 * import { useQuery } from '@tanstack/react-query';
 * import { CustomerInsightsService } from '@/lib/vendor';
 * 
 * function CustomerSegments({ vendorId }: { vendorId: string }) {
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ['customer-segments', vendorId],
 *     queryFn: async () => {
 *       const service = new CustomerInsightsService();
 *       const result = await service.segmentCustomers(vendorId);
 *       if (!result.success) throw new Error(result.error?.message);
 *       return result.data;
 *     }
 *   });
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       {data?.map(segment => (
 *         <div key={segment.type}>
 *           <h3>{segment.type}</h3>
 *           <p>Count: {segment.count}</p>
 *           <p>Revenue: ${segment.totalRevenue}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 */
