/**
 * Force Nigeria Currency Script
 * Run this in the browser console to force NGN currency on any page
 */

// Set localStorage flags to force Nigeria currency
localStorage.setItem('forceNigeria', 'true');
localStorage.setItem('manualCurrency', 'NGN');
localStorage.setItem('manualCountry', 'NG');

console.log('🇳🇬 Nigeria currency forced! Refresh the page to see NGN prices.');
console.log('To reset: localStorage.removeItem("forceNigeria"); localStorage.removeItem("manualCurrency"); localStorage.removeItem("manualCountry"); then refresh');

// Optionally refresh the page automatically
// window.location.reload();