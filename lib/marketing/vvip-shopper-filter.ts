/**
 * VVIP Shopper Filtering Utilities
 * 
 * Shared filtering logic to ensure consistency between
 * statistics and shoppers list APIs.
 */

/**
 * Determines if a VVIP shopper document represents an admin user
 * who should be filtered out from customer-facing lists
 */
export function isAdminUser(shopperData: any): boolean {
  // Check if user has an admin role
  const hasAdminRole = shopperData.createdByRole && 
    ['super_admin', 'bdm', 'team_lead', 'team_member'].includes(shopperData.createdByRole);
  
  // Check if user email is a system/admin email
  const email = shopperData.email || shopperData.user_email || '';
  const isSystemEmail = email.includes('@stitchesafrica.com');
  
  // Check if the user themselves is an admin (additional safety check)
  const userRole = shopperData.role || shopperData.userRole;
  const isUserAdmin = userRole && ['super_admin', 'bdm', 'team_lead', 'team_member'].includes(userRole);
  
  return hasAdminRole || isSystemEmail || isUserAdmin;
}

/**
 * Filters VVIP shoppers to exclude admin users
 */
export function filterNonAdminShoppers(shopperDocs: any[]): any[] {
  return shopperDocs.filter(doc => {
    const data = typeof doc.data === 'function' ? doc.data() : doc;
    return !isAdminUser(data);
  });
}

/**
 * Transforms Firestore document to standardized shopper object
 */
export function transformShopperDocument(doc: any): any {
  const data = typeof doc.data === 'function' ? doc.data() : doc;
  const docId = doc.id || data.userId;
  
  return {
    userId: docId,
    user_email: data.email || data.user_email,
    user_name: data.name || data.user_name || 'Unknown',
    status: data.status || 'active',
    created_by: data.createdBy || data.created_by,
    created_at: data.createdAt?.toDate?.()?.toISOString() || data.created_at?.toDate?.()?.toISOString(),
    notes: data.notes,
    country: data.country || 'Unknown',
    createdByRole: data.createdByRole,
    createdByEmail: data.createdByEmail,
    metadata: data.metadata
  };
}

/**
 * Gets filtered and transformed VVIP shoppers
 */
export function getFilteredVvipShoppers(shopperDocs: any[]): any[] {
  const nonAdminDocs = filterNonAdminShoppers(shopperDocs);
  return nonAdminDocs.map(transformShopperDocument);
}