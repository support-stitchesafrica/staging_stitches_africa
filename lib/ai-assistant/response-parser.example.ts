/**
 * Response Parser - Usage Examples
 * 
 * This file demonstrates how to use the response parser utilities
 * to extract structured data from AI responses.
 */

import {
  parseAIResponse,
  extractProductIds,
  extractVendorIds,
  extractActions,
  cleanMessageMarkers,
  hasStructuredData,
  countStructuredData,
} from './response-parser';

// Example 1: Basic product recommendation
function example1() {
  const aiMessage = `
    I found this beautiful traditional dress for you! [PRODUCT:dress_001]
    It's perfect for special occasions.
  `;

  const parsed = parseAIResponse(aiMessage);
  
  console.log('Product IDs:', parsed.productIds); // ['dress_001']
  console.log('Clean message:', parsed.cleanMessage); // Message without markers
}

// Example 2: Multiple products with vendor
function example2() {
  const aiMessage = `
    Here are some great options from [VENDOR:tailor_lagos_01]:
    - Traditional dress [PRODUCT:dress_001]
    - Ankara outfit [PRODUCT:outfit_002]
    - Custom suit [PRODUCT:suit_003]
  `;

  const parsed = parseAIResponse(aiMessage);
  
  console.log('Products:', parsed.productIds); // ['dress_001', 'outfit_002', 'suit_003']
  console.log('Vendors:', parsed.vendorIds); // ['tailor_lagos_01']
}

// Example 3: Actions with structured data
function example3() {
  const aiMessage = `
    Would you like to add this to your cart?
    [ACTION:add_to_cart:productId=dress_001:size=M:color=blue]
  `;

  const parsed = parseAIResponse(aiMessage);
  
  console.log('Actions:', parsed.actions);
  // [{
  //   type: 'add_to_cart',
  //   data: {
  //     productId: 'dress_001',
  //     size: 'M',
  //     color: 'blue'
  //   }
  // }]
}

// Example 4: Multiple actions
function example4() {
  const aiMessage = `
    You can either:
    - Add it to cart [ACTION:add_to_cart:productId=dress_001:size=M]
    - View more details [ACTION:view_product:productId=dress_001]
    - Visit the vendor [ACTION:visit_vendor:vendorId=tailor_01]
  `;

  const parsed = parseAIResponse(aiMessage);
  
  console.log('Number of actions:', parsed.actions.length); // 3
  console.log('Action types:', parsed.actions.map(a => a.type));
  // ['add_to_cart', 'view_product', 'visit_vendor']
}

// Example 5: Complex real-world scenario
function example5() {
  const aiMessage = `
    Great choice! I recommend this beautiful traditional dress [PRODUCT:dress_001].
    It's from a highly-rated vendor [VENDOR:tailor_lagos_01] in Lagos.
    
    The dress is available in sizes S, M, L, and XL.
    Based on your measurements, I recommend size M.
    
    Would you like to:
    - Try it on virtually [ACTION:try_on:productId=dress_001:size=M]
    - Add to cart [ACTION:add_to_cart:productId=dress_001:size=M]
    - View more from this vendor [ACTION:visit_vendor:vendorId=tailor_lagos_01]
  `;

  const parsed = parseAIResponse(aiMessage);
  
  console.log('Summary:');
  console.log('- Products:', parsed.productIds.length);
  console.log('- Vendors:', parsed.vendorIds.length);
  console.log('- Actions:', parsed.actions.length);
  console.log('- Clean message length:', parsed.cleanMessage.length);
}

// Example 6: Using individual extraction functions
function example6() {
  const aiMessage = `
    Check out [PRODUCT:p1] and [PRODUCT:p2] from [VENDOR:v1]
    [ACTION:add_to_cart:productId=p1:size=M]
  `;

  // Extract only what you need
  const products = extractProductIds(aiMessage);
  const vendors = extractVendorIds(aiMessage);
  const actions = extractActions(aiMessage);
  const cleanMessage = cleanMessageMarkers(aiMessage);

  console.log({ products, vendors, actions, cleanMessage });
}

// Example 7: Checking for structured data
function example7() {
  const message1 = 'Just a regular message';
  const message2 = 'Message with [PRODUCT:p1]';

  console.log('Has structured data?');
  console.log('Message 1:', hasStructuredData(message1)); // false
  console.log('Message 2:', hasStructuredData(message2)); // true

  const counts = countStructuredData(message2);
  console.log('Counts:', counts);
  // { products: 1, vendors: 0, actions: 0, total: 1 }
}

// Example 8: Handling edge cases
function example8() {
  // Empty message
  const empty = parseAIResponse('');
  console.log('Empty:', empty);

  // Only markers
  const onlyMarkers = parseAIResponse('[PRODUCT:p1][VENDOR:v1]');
  console.log('Only markers:', onlyMarkers);

  // Malformed action
  const malformed = parseAIResponse('[ACTION:add_to_cart:productId=:size=M]');
  console.log('Malformed action data:', malformed.actions[0].data);
  // { size: 'M' } - empty values are filtered out
}

// Example 9: Using in API route
async function example9_apiRoute(userMessage: string) {
  // Simulate getting response from OpenAI
  const aiResponse = `
    I found this dress [PRODUCT:dress_001] for you!
    [ACTION:add_to_cart:productId=dress_001:size=M]
  `;

  // Parse the response
  const parsed = parseAIResponse(aiResponse);

  // Return structured data to frontend
  return {
    message: parsed.cleanMessage,
    products: parsed.productIds,
    vendors: parsed.vendorIds,
    quickActions: parsed.actions.map(action => ({
      type: action.type,
      label: getActionLabel(action.type),
      data: action.data,
    })),
  };
}

function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    add_to_cart: 'Add to Cart',
    view_product: 'View Details',
    visit_vendor: 'Visit Shop',
    try_on: 'Try It On',
  };
  return labels[actionType] || actionType;
}

// Example 10: Using in React component
function example10_reactComponent() {
  // In a React component, you might use it like this:
  /*
  const ChatMessage = ({ message }: { message: string }) => {
    const parsed = parseAIResponse(message);
    
    return (
      <div>
        <p>{parsed.cleanMessage}</p>
        
        {parsed.productIds.length > 0 && (
          <ProductCards productIds={parsed.productIds} />
        )}
        
        {parsed.vendorIds.length > 0 && (
          <VendorCards vendorIds={parsed.vendorIds} />
        )}
        
        {parsed.actions.length > 0 && (
          <QuickActions actions={parsed.actions} />
        )}
      </div>
    );
  };
  */
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9_apiRoute,
  example10_reactComponent,
};
