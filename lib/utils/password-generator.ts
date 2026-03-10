/**
 * Password Generator Utility
 * Generates secure random passwords for guest checkout users
 */

export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed confusing characters like I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; // Removed confusing characters like i, l, o
  const numbers = '23456789'; // Removed confusing characters like 0, 1
  const special = '!@#$%^&*()_+-=[]{}';

  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else feedback.push('Password should be at least 12 characters');

  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 25;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  else feedback.push('Add special characters');

  return {
    isStrong: score >= 75,
    score,
    feedback
  };
}
