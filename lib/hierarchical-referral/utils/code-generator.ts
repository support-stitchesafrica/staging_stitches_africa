/**
 * Code generation utilities for hierarchical referral system
 */

/**
 * Generate a unique master referral code for Mother Influencer
 * Format: MOTHER_[8-character-alphanumeric]
 */
export function generateMasterCode(): string {
  const prefix = 'MOTHER';
  const randomPart = generateRandomString(8);
  return `${prefix}_${randomPart}`;
}

/**
 * Generate a unique sub referral code linked to master code
 * Format: SUB_[first-4-chars-of-master]_[6-character-alphanumeric]
 */
export function generateSubCode(masterCode: string): string {
  const prefix = 'SUB';
  const masterPrefix = masterCode.replace('MOTHER_', '').substring(0, 4);
  const randomPart = generateRandomString(6);
  return `${prefix}_${masterPrefix}_${randomPart}`;
}

/**
 * Validate code format
 */
export function isValidCodeFormat(code: string): boolean {
  // Master code format: MOTHER_[8-chars]
  const masterPattern = /^MOTHER_[A-Z0-9]{8}$/;
  
  // Sub code format: SUB_[4-chars]_[6-chars]
  const subPattern = /^SUB_[A-Z0-9]{4}_[A-Z0-9]{6}$/;
  
  return masterPattern.test(code) || subPattern.test(code);
}

/**
 * Get code type from code string
 */
export function getCodeType(code: string): 'master' | 'sub' | 'invalid' {
  if (code.startsWith('MOTHER_')) {
    return 'master';
  } else if (code.startsWith('SUB_')) {
    return 'sub';
  } else {
    return 'invalid';
  }
}

/**
 * Extract master code reference from sub code
 */
export function getMasterCodeFromSubCode(subCode: string): string | null {
  if (!subCode.startsWith('SUB_')) {
    return null;
  }
  
  const parts = subCode.split('_');
  if (parts.length !== 3) {
    return null;
  }
  
  // This is a simplified approach - in a real system you'd need to look up
  // the actual master code from the database
  return `MOTHER_${parts[1]}????`; // Placeholder - would need database lookup
}

/**
 * Generate random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate batch of unique codes
 */
export function generateCodeBatch(type: 'master' | 'sub', count: number, masterCode?: string): string[] {
  const codes: string[] = [];
  const usedCodes = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      if (type === 'master') {
        code = generateMasterCode();
      } else {
        if (!masterCode) {
          throw new Error('Master code required for sub code generation');
        }
        code = generateSubCode(masterCode);
      }
      attempts++;
    } while (usedCodes.has(code) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error(`Failed to generate unique code after ${maxAttempts} attempts`);
    }
    
    usedCodes.add(code);
    codes.push(code);
  }
  
  return codes;
}

/**
 * Validate code uniqueness pattern
 */
export function validateCodeUniqueness(codes: string[]): boolean {
  const codeSet = new Set(codes);
  return codeSet.size === codes.length;
}