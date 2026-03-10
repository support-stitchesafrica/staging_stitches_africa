// Simple test script to verify referral stats API
const testReferralStats = async () => {
  try {
    console.log('Testing referral stats API...');
    
    const response = await fetch('http://localhost:3000/api/referral/stats');
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testReferralStats();