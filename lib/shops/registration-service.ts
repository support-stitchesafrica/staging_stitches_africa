/**
 * ShopRegistrationService
 * Handles complete user registration for shop users including referral enrollment
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class ShopRegistrationService {
  /**
   * Create referral user document for a new shop user
   * This is called after Firebase Auth user creation and user profile creation
   * Requirements: 2.1, 2.2, 2.3, 2.4
   * 
   * @param userId - Firebase Auth UID
   * @param email - User's email address
   * @param displayName - User's display name
   * @param referralCode - Optional referral code used during signup
   * @returns Success status and referral user data if created
   */
  static async createReferralUser(
    userId: string,
    email: string,
    displayName: string | null,
    referralCode?: string | null
  ): Promise<{
    success: boolean;
    referralUser?: any;
    error?: string;
  }> {
    try {
      console.log(`Creating referral user for shop registration: ${userId}`);

      // Make API call to create referral user document
      const response = await fetch("/api/shops/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
          displayName,
          referralCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create referral user");
      }

      console.log(`Successfully created referral user for shop user: ${userId} with code: ${result.referralUser?.referralCode}`);

      return {
        success: true,
        referralUser: result.referralUser,
      };

    } catch (error: any) {
      // Requirement 2.5: Log error but don't throw - registration should continue
      console.error('Failed to create referral user during shop registration:', error);
      console.error('User ID:', userId);
      console.error('Error details:', error.message || error);

      return {
        success: false,
        error: error.message || 'Failed to create referral user',
      };
    }
  }

  /**
   * Complete user registration including referral enrollment
   * This is a convenience method that can be called after user creation
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   * 
   * @param userId - Firebase Auth UID
   * @param email - User's email
   * @param displayName - User's display name
   * @param referralCode - Optional referral code used during signup
   * @returns Registration result with referral user data
   */
  static async completeRegistration(
    userId: string,
    email: string,
    displayName: string | null,
    referralCode?: string | null
  ): Promise<{
    success: boolean;
    referralUser?: any;
    error?: string;
  }> {
    // Create referral user document
    const result = await this.createReferralUser(
      userId,
      email,
      displayName,
      referralCode
    );

    if (!result.success) {
      // Log warning but don't fail registration
      console.warn(
        `Referral user creation failed for ${userId}, but registration will continue`,
        result.error
      );
    }

    return result;
  }

  /**
   * Check if a user already has a referral document
   * Useful for preventing duplicate creation attempts
   * 
   * @param userId - Firebase Auth UID
   * @returns true if referral user exists
   */
  static async hasReferralUser(userId: string): Promise<boolean> {
    try {
      // For now, we'll just return false since we're moving the check to the server
      // In a production environment, you might want to create another API endpoint for this
      return false;
    } catch (error) {
      console.error('Error checking referral user existence:', error);
      return false;
    }
  }
}