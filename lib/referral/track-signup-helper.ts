/**
 * Helper function to track referral sign-ups
 * Can be called after successful user registration
 */

export interface TrackReferralSignupParams {
  referralCode: string;
  userId: string;
  email: string;
  name: string;
}

export async function trackReferralSignup(params: TrackReferralSignupParams): Promise<boolean> {
  const { referralCode, userId, email, name } = params;

  if (!referralCode) {
    return false;
  }

  try {
    const response = await fetch('/api/referral/track-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: referralCode.trim().toUpperCase(),
        refereeData: {
          userId,
          email: email.trim().toLowerCase(),
          name: name.trim(),
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('Referral tracked successfully:', data);
      return true;
    } else {
      console.error('Failed to track referral:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error tracking referral:', error);
    return false;
  }
}

/**
 * Validate a referral code
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrer?: { name: string; code: string };
  error?: string;
}> {
  if (!code) {
    return { valid: false, error: 'No code provided' };
  }

  try {
    const response = await fetch('/api/referral/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });

    const data = await response.json();

    if (data.valid && data.referrer) {
      return {
        valid: true,
        referrer: data.referrer,
      };
    } else {
      return {
        valid: false,
        error: data.error?.message || 'Invalid referral code',
      };
    }
  } catch (error) {
    console.error('Error validating referral code:', error);
    return {
      valid: false,
      error: 'Failed to validate referral code',
    };
  }
}
