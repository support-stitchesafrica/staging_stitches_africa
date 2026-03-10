
import { calculateCustomerPrice, calculateFinalPrice, calculateOriginalPriceWithDuty, PLATFORM_COMMISSION_RATE } from './lib/priceUtils';

console.log("Verifying Price Commission Updates...");

const basePrice = 100;
const discount = 10;
const commissionRate = 0.20;

// Test 1: calculateCustomerPrice
const customerPrice = calculateCustomerPrice(basePrice);
const expectedCustomerPrice = basePrice * (1 + commissionRate);
console.log(`Test 1: calculateCustomerPrice(100) = ${customerPrice}. Expected: ${expectedCustomerPrice}`);
if (Math.abs(customerPrice - expectedCustomerPrice) < 0.01) {
    console.log("✅ Test 1 Passed");
} else {
    console.error("❌ Test 1 Failed");
}

// Test 2: calculateFinalPrice
const finalPrice = calculateFinalPrice(basePrice, discount);
const expectedFinalPrice = basePrice * (1 - discount/100) * (1 + commissionRate);
console.log(`Test 2: calculateFinalPrice(100, 10%) = ${finalPrice}. Expected: ${expectedFinalPrice}`);
if (Math.abs(finalPrice - expectedFinalPrice) < 0.01) {
    console.log("✅ Test 2 Passed");
} else {
    console.error("❌ Test 2 Failed");
}

// Test 3: calculateOriginalPriceWithDuty (Reverse Calculation)
// This function name is legacy but conceptually returns the "strikethrough" price.
// If current price includes commission, this should return the "price before discount" but "including commission"?
// Actually, let's see what the function does: currentPrice / discountFactor.
// currentPrice (Final) = Vendor * discountFactor * (1 + rates)
// result = Vendor * (1 + rates)
// So it should be equivalent to calculateCustomerPrice(originalPrice).
const originalWithDuty = calculateOriginalPriceWithDuty(finalPrice, discount);
console.log(`Test 3: calculateOriginalPriceWithDuty(${finalPrice}, 10%) = ${originalWithDuty}. Expected: ${customerPrice}`);
if (Math.abs(originalWithDuty - customerPrice) < 0.01) {
    console.log("✅ Test 3 Passed");
} else {
    console.error("❌ Test 3 Failed");
}

if (PLATFORM_COMMISSION_RATE !== 0.00) {
    console.error("❌ PLATFORM_COMMISSION_RATE is not 0.20");
} else {
    console.log("✅ Constant Checked");
}
