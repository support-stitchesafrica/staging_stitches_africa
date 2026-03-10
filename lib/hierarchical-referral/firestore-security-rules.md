# Hierarchical Referral System - Firestore Security Rules

Add these rules to your firestore.rules file to secure the hierarchical referral system collections:

```javascript
// ============================================
// HIERARCHICAL REFERRAL SYSTEM COLLECTIONS
// Multi-level influencer referral program with Mother and Mini Influencers
// ============================================

// Helper functions for hierarchical referral authentication
function isHierarchicalInfluencer() {
  return request.auth != null &&
    exists(/databases/$(database)/documents/hierarchical_influencers/$(request.auth.uid));
}

function isMotherInfluencer() {
  return isHierarchicalInfluencer() &&
    get(/databases/$(database)/documents/hierarchical_influencers/$(request.auth.uid)).data.type == 'mother';
}

function isMiniInfluencer() {
  return isHierarchicalInfluencer() &&
    get(/databases/$(database)/documents/hierarchical_influencers/$(request.auth.uid)).data.type == 'mini';
}

function isMotherInfluencerOf(miniInfluencerId) {
  return isMotherInfluencer() &&
    exists(/databases/$(database)/documents/hierarchical_influencers/$(miniInfluencerId)) &&
    get(/databases/$(database)/documents/hierarchical_influencers/$(miniInfluencerId)).data.parentInfluencerId == request.auth.uid;
}

function hasHierarchicalAdminAccess() {
  return request.auth != null &&
    (exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
     exists(/databases/$(database)/documents/atlasUsers/$(request.auth.uid)) ||
     exists(/databases/$(database)/documents/backoffice_users/$(request.auth.uid)));
}

// Hierarchical Influencers Collection
match /hierarchical_influencers/{influencerId} {
  // Read permissions:
  // 1. Influencers can read their own data
  // 2. Mother Influencers can read their Mini Influencers' data
  // 3. Admins can read all influencer data
  allow read: if (request.auth != null && request.auth.uid == influencerId) ||
                 isMotherInfluencerOf(influencerId) ||
                 hasHierarchicalAdminAccess();

  // Create permissions:
  // 1. Users can create their own influencer profile
  // 2. Admins can create any influencer profile
  allow create: if (request.auth != null && 
                   request.auth.uid == influencerId &&
                   request.resource.data.id == request.auth.uid) ||
                  hasHierarchicalAdminAccess();

  // Update permissions:
  // 1. Influencers can update their own data (except type and parentInfluencerId)
  // 2. Admins can update any influencer data
  allow update: if (request.auth != null && 
                   request.auth.uid == influencerId &&
                   request.resource.data.type == resource.data.type &&
                   request.resource.data.parentInfluencerId == resource.data.parentInfluencerId) ||
                  hasHierarchicalAdminAccess();

  // Delete permissions:
  // Only admins can delete influencer profiles (soft delete preferred)
  allow delete: if hasHierarchicalAdminAccess();
}

// Hierarchical Referral Codes Collection
match /hierarchical_referral_codes/{codeId} {
  // Read permissions:
  // 1. Code creators can read their own codes
  // 2. Mother Influencers can read codes they created
  // 3. Admins can read all codes
  allow read: if (request.auth != null && resource.data.createdBy == request.auth.uid) ||
                 hasHierarchicalAdminAccess();

  // Create permissions:
  // 1. Mother Influencers can create master and sub codes
  // 2. System can create codes (for automated processes)
  // 3. Admins can create any codes
  allow create: if (isMotherInfluencer() && 
                   request.resource.data.createdBy == request.auth.uid) ||
                  hasHierarchicalAdminAccess();

  // Update permissions:
  // 1. Code creators can update their codes (limited fields)
  // 2. Admins can update any codes
  allow update: if (request.auth != null && 
                   resource.data.createdBy == request.auth.uid &&
                   request.resource.data.createdBy == resource.data.createdBy &&
                   request.resource.data.type == resource.data.type) ||
                  hasHierarchicalAdminAccess();

  // Delete permissions:
  // Only admins can delete codes (deactivation preferred)
  allow delete: if hasHierarchicalAdminAccess();
}

// Hierarchical Activities Collection
match /hierarchical_activities/{activityId} {
  // Read permissions:
  // 1. Activity owners can read their own activities
  // 2. Mother Influencers can read activities from their Mini Influencers
  // 3. Admins can read all activities
  allow read: if (request.auth != null && resource.data.influencerId == request.auth.uid) ||
                 isMotherInfluencerOf(resource.data.influencerId) ||
                 hasHierarchicalAdminAccess();

  // Create permissions:
  // 1. Anyone can create activities (for tracking)
  // 2. System can create activities
  allow create: if true;

  // Update permissions:
  // 1. Only system can update activities (mark as processed)
  // 2. Admins can update any activities
  allow update: if hasHierarchicalAdminAccess();

  // Delete permissions:
  // Only admins can delete activities (for cleanup)
  allow delete: if hasHierarchicalAdminAccess();
}

// Hierarchical Activity Summaries Collection
match /hierarchical_activity_summaries/{summaryId} {
  // Read permissions:
  // 1. Influencers can read their own summaries
  // 2. Mother Influencers can read summaries from their Mini Influencers
  // 3. Admins can read all summaries
  allow read: if (request.auth != null && resource.data.influencerId == request.auth.uid) ||
                 isMotherInfluencerOf(resource.data.influencerId) ||
                 hasHierarchicalAdminAccess();

  // Create/Update permissions:
  // Only system can write summaries
  allow create, update: if hasHierarchicalAdminAccess();

  // Delete permissions:
  // Only admins can delete summaries
  allow delete: if hasHierarchicalAdminAccess();
}

// Hierarchical Commissions Collection
match /hierarchical_commissions/{commissionId} {
  // Read permissions:
  // 1. Mother Influencers can read their own commissions
  // 2. Mini Influencers can read commissions they generated
  // 3. Admins can read all commissions
  allow read: if (request.auth != null && 
                 (resource.data.motherInfluencerId == request.auth.uid ||
                  resource.data.miniInfluencerId == request.auth.uid)) ||
                 hasHierarchicalAdminAccess();

  // Create permissions:
  // Only system can create commissions
  allow create: if hasHierarchicalAdminAccess();

  // Update permissions:
  // Only system and admins can update commissions (status changes)
  allow update: if hasHierarchicalAdminAccess();

  // Delete permissions:
  // Commissions are immutable (no deletion allowed)
  allow delete: if false;
}

// Hierarchical Commission Rates Collection
match /hierarchical_commission_rates/{rateId} {
  // Read permissions:
  // 1. All influencers can read active rates
  // 2. Admins can read all rates
  allow read: if isHierarchicalInfluencer() || hasHierarchicalAdminAccess();

  // Create/Update permissions:
  // Only admins can manage commission rates
  allow create, update: if hasHierarchicalAdminAccess();

  // Delete permissions:
  // Only admins can delete rates (deactivation preferred)
  allow delete: if hasHierarchicalAdminAccess();
}

// Hierarchical Payouts Collection
match /hierarchical_payouts/{payoutId} {
  // Read permissions:
  // 1. Influencers can read their own payouts
  // 2. Admins can read all payouts
  allow read: if (request.auth != null && resource.data.influencerId == request.auth.uid) ||
                 hasHierarchicalAdminAccess();

  // Create permissions:
  // Only system can create payouts
  allow create: if hasHierarchicalAdminAccess();

  // Update permissions:
  // Only system and admins can update payouts
  allow update: if hasHierarchicalAdminAccess();

  // Delete permissions:
  // Payouts are immutable records (no deletion)
  allow delete: if false;
}

// Hierarchical Notifications Collection
match /hierarchical_notifications/{notificationId} {
  // Read permissions:
  // 1. Influencers can read their own notifications
  // 2. Admins can read all notifications
  allow read: if (request.auth != null && resource.data.influencerId == request.auth.uid) ||
                 hasHierarchicalAdminAccess();

  // Create permissions:
  // 1. System can create notifications
  // 2. Admins can create notifications
  allow create: if hasHierarchicalAdminAccess();

  // Update permissions:
  // 1. Influencers can update their own notifications (mark as read)
  // 2. Admins can update any notifications
  allow update: if (request.auth != null && resource.data.influencerId == request.auth.uid) ||
                   hasHierarchicalAdminAccess();

  // Delete permissions:
  // 1. Influencers can delete their own notifications
  // 2. Admins can delete any notifications
  allow delete: if (request.auth != null && resource.data.influencerId == request.auth.uid) ||
                   hasHierarchicalAdminAccess();
}
```

## Integration Instructions

1. Add the above rules to your existing `firestore.rules` file
2. Deploy the rules using: `firebase deploy --only firestore:rules`
3. Test the rules with the Firebase Rules Playground
4. Ensure all existing functionality continues to work after deployment

## Security Features

- **Role-based Access**: Different permissions for Mother and Mini Influencers
- **Hierarchical Permissions**: Mother Influencers can access their Mini Influencers' data
- **Admin Override**: Admins have full access for support and management
- **Data Integrity**: Prevents unauthorized modifications to critical fields
- **Audit Trail**: Immutable records for commissions and payouts
- **Public Tracking**: Allows anonymous activity tracking for analytics