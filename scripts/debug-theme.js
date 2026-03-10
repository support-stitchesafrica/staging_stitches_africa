/**
 * Debug Theme Script
 * Use this to test theme loading for a specific vendor or storefront handle
 * 
 * Usage:
 * node scripts/debug-theme.js --vendorId=YOUR_VENDOR_ID
 * node scripts/debug-theme.js --handle=YOUR_HANDLE
 */

const args = process.argv.slice(2);
const vendorId = args.find(arg => arg.startsWith('--vendorId='))?.split('=')[1];
const handle = args.find(arg => arg.startsWith('--handle='))?.split('=')[1];

if (!vendorId && !handle) {
  console.log('Usage: node scripts/debug-theme.js --vendorId=YOUR_VENDOR_ID or --handle=YOUR_HANDLE');
  process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const params = new URLSearchParams();
if (vendorId) params.append('vendorId', vendorId);
if (handle) params.append('handle', handle);

fetch(`${baseUrl}/api/debug/theme?${params.toString()}`)
  .then(response => response.json())
  .then(data => {
    console.log('Theme Debug Information:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Error fetching debug information:', error);
  });