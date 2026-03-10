/**
 * Waitlist Service
 * Handles CRUD operations for waitlists and signups
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  Waitlist,
  WaitlistSignup,
  WaitlistProduct,
  CreateWaitlistForm,
  WaitlistSignupForm,
  WaitlistAnalytics,
  WaitlistDashboardData,
  WaitlistPermissions,
  MarketingRole,
  WaitlistApiResponse,
  WaitlistSignupResponse
} from '@/types/waitlist';

// Collections
const COLLECTIONS = {
  WAITLISTS: 'waitlists',
  WAITLIST_SIGNUPS: 'waitlist_signups',
  TAILOR_WORKS: 'tailor_works'
} as const;

// Validation constants
const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;
const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Waitlist Management Service
 */
export class WaitlistService {
  /**
   * Generate URL-friendly slug from title
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Validate waitlist form data
   */
  private static validateWaitlistForm(data: CreateWaitlistForm): { valid: boolean; error?: string } {
    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      return { valid: false, error: 'Title is required' };
    }
    if (data.title.trim().length < MIN_TITLE_LENGTH) {
      return { valid: false, error: `Title must be at least ${MIN_TITLE_LENGTH} characters` };
    }
    if (data.title.trim().length > MAX_TITLE_LENGTH) {
      return { valid: false, error: `Title must be less than ${MAX_TITLE_LENGTH} characters` };
    }

    // Validate description
    if (!data.description || data.description.trim().length === 0) {
      return { valid: false, error: 'Description is required' };
    }
    if (data.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      return { valid: false, error: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters` };
    }
    if (data.description.trim().length > MAX_DESCRIPTION_LENGTH) {
      return { valid: false, error: `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters` };
    }

    // Validate banner image
    if (!data.bannerImage || data.bannerImage.trim().length === 0) {
      return { valid: false, error: 'Banner image is required' };
    }

    // Validate countdown date
    if (!data.countdownEndAt) {
      return { valid: false, error: 'Countdown end date is required' };
    }
    if (data.countdownEndAt <= new Date()) {
      return { valid: false, error: 'Countdown end date must be in the future' };
    }

    // Validate product IDs
    if (!data.productIds || data.productIds.length === 0) {
      return { valid: false, error: 'At least one product must be selected' };
    }

    // Validate notification channels
    if (!data.notificationChannels || data.notificationChannels.length === 0) {
      return { valid: false, error: 'At least one notification channel must be selected' };
    }

    return { valid: true };
  }

  /**
   * Validate signup form data
   */
  private static validateSignupForm(data: WaitlistSignupForm): { valid: boolean; error?: string } {
    // Validate full name
    if (!data.fullName || data.fullName.trim().length === 0) {
      return { valid: false, error: 'Full name is required' };
    }
    if (data.fullName.trim().length < 2) {
      return { valid: false, error: 'Full name must be at least 2 characters' };
    }

    // Validate email
    if (!data.email || data.email.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Validate WhatsApp number
    if (!data.whatsapp || data.whatsapp.trim().length === 0) {
      return { valid: false, error: 'WhatsApp number is required' };
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.whatsapp.replace(/\s/g, ''))) {
      return { valid: false, error: 'Invalid WhatsApp number format' };
    }

    return { valid: true };
  }

  /**
   * Get role-based permissions
   */
  static getPermissions(role: MarketingRole): WaitlistPermissions {
    switch (role) {
      case 'super_admin':
        return {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canPublish: true,
          canViewSignups: true,
          canExportSignups: true
        };
      case 'team_lead':
        return {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canPublish: true,
          canViewSignups: true,
          canExportSignups: true
        };
      case 'bdm':
        return {
          canCreate: true,
          canEdit: false,
          canDelete: false,
          canPublish: false,
          canViewSignups: true,
          canExportSignups: false
        };
      default:
        return {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canPublish: false,
          canViewSignups: false,
          canExportSignups: false
        };
    }
  }

  /**
   * Create a new waitlist
   */
  static async createWaitlist(data: CreateWaitlistForm, createdBy: string): Promise<Waitlist> {
    // Validate form data
    const validation = this.validateWaitlistForm(data);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid waitlist data');
    }

    // Verify products exist
    const productIds = await this.verifyProducts(data.productIds);
    if (productIds.length === 0) {
      throw new Error('No valid products found');
    }

    // Generate waitlist ID and slug
    const waitlistId = adminDb.collection(COLLECTIONS.WAITLISTS).doc().id;
    const slug = this.generateSlug(data.title);
    const now = Timestamp.now();

    // Create waitlist object
    const waitlist: Waitlist = {
      id: waitlistId,
      title: data.title.trim(),
      description: data.description.trim(),
      shortDescription: data.shortDescription?.trim(),
      bannerImage: data.bannerImage.trim(),
      type: data.type,
      productIds: productIds,
      countdownEndAt: Timestamp.fromDate(data.countdownEndAt),
      status: 'DRAFT',
      notificationChannels: data.notificationChannels,
      slug,
      launchUrl: data.launchUrl?.trim(),
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    // Save to Firestore
    await adminDb.collection(COLLECTIONS.WAITLISTS).doc(waitlistId).set(waitlist);

    return waitlist;
  }

  /**
   * Update an existing waitlist
   */
  static async updateWaitlist(id: string, data: Partial<CreateWaitlistForm>, updatedBy: string): Promise<Waitlist> {
    const existingWaitlist = await this.getWaitlistById(id);
    if (!existingWaitlist) {
      throw new Error('Waitlist not found');
    }

    // Prepare update data
    const updateData: Partial<Waitlist> = {
      updatedAt: Timestamp.now()
    };

    // Update fields if provided
    if (data.title) {
      updateData.title = data.title.trim();
      updateData.slug = this.generateSlug(data.title);
    }
    if (data.description) updateData.description = data.description.trim();
    if (data.shortDescription) updateData.shortDescription = data.shortDescription.trim();
    if (data.bannerImage) updateData.bannerImage = data.bannerImage.trim();
    if (data.countdownEndAt) updateData.countdownEndAt = Timestamp.fromDate(data.countdownEndAt);
    if (data.notificationChannels) updateData.notificationChannels = data.notificationChannels;
    if (data.launchUrl) updateData.launchUrl = data.launchUrl.trim();
    if (data.productIds) {
      const verifiedIds = await this.verifyProducts(data.productIds);
      updateData.productIds = verifiedIds;
    }

    // Update in Firestore
    await adminDb.collection(COLLECTIONS.WAITLISTS).doc(id).update(updateData);

    // Return updated waitlist
    return { ...existingWaitlist, ...updateData } as Waitlist;
  }

  /**
   * Delete a waitlist
   */
  static async deleteWaitlist(id: string): Promise<void> {
    // Check if waitlist exists
    const waitlist = await this.getWaitlistById(id);
    if (!waitlist) {
      throw new Error('Waitlist not found');
    }

    // Delete all signups first
    const signupsSnapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS)
      .where('waitlistId', '==', id)
      .get();

    const batch = adminDb.batch();
    signupsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the waitlist
    batch.delete(adminDb.collection(COLLECTIONS.WAITLISTS).doc(id));

    await batch.commit();
  }

  /**
   * Publish a waitlist
   */
  static async publishWaitlist(id: string): Promise<Waitlist> {
    const waitlist = await this.getWaitlistById(id);
    if (!waitlist) {
      throw new Error('Waitlist not found');
    }

    await adminDb.collection(COLLECTIONS.WAITLISTS).doc(id).update({
      status: 'PUBLISHED',
      updatedAt: Timestamp.now()
    });

    return { ...waitlist, status: 'PUBLISHED' };
  }

  /**
   * Archive a waitlist
   */
  static async archiveWaitlist(id: string): Promise<Waitlist> {
    const waitlist = await this.getWaitlistById(id);
    if (!waitlist) {
      throw new Error('Waitlist not found');
    }

    await adminDb.collection(COLLECTIONS.WAITLISTS).doc(id).update({
      status: 'ARCHIVED',
      updatedAt: Timestamp.now()
    });

    return { ...waitlist, status: 'ARCHIVED' };
  }

  /**
   * Get waitlist by ID
   */
  static async getWaitlistById(id: string): Promise<Waitlist | null> {
    const doc = await adminDb.collection(COLLECTIONS.WAITLISTS).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() } as Waitlist;
  }

  /**
   * Get waitlist by slug
   */
  static async getWaitlistBySlug(slug: string): Promise<Waitlist | null> {
    const snapshot = await adminDb.collection(COLLECTIONS.WAITLISTS)
      .where('slug', '==', slug)
      .where('status', '==', 'PUBLISHED')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Waitlist;
  }

  /**
   * Get all waitlists
   */
  static async getAllWaitlists(): Promise<Waitlist[]> {
    const snapshot = await adminDb.collection(COLLECTIONS.WAITLISTS)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Waitlist[];
  }

  /**
   * Get published waitlists
   */
  static async getPublishedWaitlists(): Promise<Waitlist[]> {
    const snapshot = await adminDb.collection(COLLECTIONS.WAITLISTS)
      .where('status', '==', 'PUBLISHED')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Waitlist[];
  }

  /**
   * Verify products exist in tailor_works collection
   */
  private static async verifyProducts(productIds: string[]): Promise<string[]> {
    const validIds: string[] = [];
    
    // Check products in batches of 10 (Firestore limit)
    for (let i = 0; i < productIds.length; i += 10) {
      const batch = productIds.slice(i, i + 10);
      const snapshot = await adminDb.collection(COLLECTIONS.TAILOR_WORKS)
        .where('__name__', 'in', batch)
        .get();
      
      snapshot.docs.forEach(doc => {
        validIds.push(doc.id);
      });
    }

    return validIds;
  }

  /**
   * Get products for waitlist
   */
  static async getWaitlistProducts(productIds: string[]): Promise<WaitlistProduct[]> {
    const products: WaitlistProduct[] = [];
    
    // Get products in batches of 10
    for (let i = 0; i < productIds.length; i += 10) {
      const batch = productIds.slice(i, i + 10);
      const snapshot = await adminDb.collection(COLLECTIONS.TAILOR_WORKS)
        .where('__name__', 'in', batch)
        .get();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        products.push({
          id: doc.id,
          name: data.name || 'Unnamed Product',
          images: data.images || [],
          price: data.price,
          status: data.status || 'active',
          category: data.category,
          vendor_name: data.vendor_name,
          description: data.description
        });
      });
    }

    return products;
  }

  /**
   * Sign up for waitlist
   */
  static async signupForWaitlist(data: WaitlistSignupForm, source: string = 'landing_page'): Promise<WaitlistSignupResponse> {
    // Validate form data
    const validation = this.validateSignupForm(data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid signup data'
      };
    }

    // Check if waitlist exists and is published
    const waitlist = await this.getWaitlistById(data.waitlistId);
    if (!waitlist) {
      return {
        success: false,
        error: 'Waitlist not found'
      };
    }

    if (waitlist.status !== 'PUBLISHED') {
      return {
        success: false,
        error: 'This waitlist is not currently accepting signups'
      };
    }

    // Check if countdown has expired
    if (waitlist.countdownEndAt.toMillis() <= Date.now()) {
      return {
        success: false,
        error: 'This waitlist has expired'
      };
    }

    // Check for duplicate signup
    const existingSignup = await this.getSignupByEmailAndWaitlist(data.email, data.waitlistId);
    if (existingSignup) {
      return {
        success: false,
        error: 'You have already signed up for this waitlist'
      };
    }

    // Create signup
    const signupId = adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS).doc().id;
    const now = Timestamp.now();

    const signup: WaitlistSignup = {
      id: signupId,
      waitlistId: data.waitlistId,
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      whatsapp: data.whatsapp.trim(),
      source,
      createdAt: now
    };

    // Save signup
    await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS).doc(signupId).set(signup);

    return {
      success: true,
      message: 'Successfully signed up for waitlist!',
      data: {
        signupId,
        waitlist
      }
    };
  }

  /**
   * Get signup by email and waitlist
   */
  private static async getSignupByEmailAndWaitlist(email: string, waitlistId: string): Promise<WaitlistSignup | null> {
    const snapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS)
      .where('email', '==', email.toLowerCase().trim())
      .where('waitlistId', '==', waitlistId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WaitlistSignup;
  }

  /**
   * Get signups for waitlist
   */
  static async getWaitlistSignups(waitlistId: string): Promise<WaitlistSignup[]> {
    const snapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS)
      .where('waitlistId', '==', waitlistId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistSignup[];
  }

  /**
   * Get waitlist analytics
   */
  static async getWaitlistAnalytics(waitlistId: string): Promise<WaitlistAnalytics> {
    const signups = await this.getWaitlistSignups(waitlistId);
    
    // Group signups by date
    const signupsByDate: { [date: string]: number } = {};
    const signupsBySource: { [source: string]: number } = {};

    signups.forEach(signup => {
      const date = signup.createdAt.toDate().toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
      
      signupsBySource[signup.source] = (signupsBySource[signup.source] || 0) + 1;
    });

    return {
      waitlistId,
      totalSignups: signups.length,
      signupsByDate: Object.entries(signupsByDate).map(([date, count]) => ({ date, count })),
      signupsBySource: Object.entries(signupsBySource).map(([source, count]) => ({ source, count }))
    };
  }

  /**
   * Get dashboard data
   */
  static async getDashboardData(): Promise<WaitlistDashboardData> {
    const waitlists = await this.getAllWaitlists();
    
    // Get total signups across all waitlists
    const signupsSnapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS).get();
    const totalSignups = signupsSnapshot.size;

    // Count active waitlists
    const activeWaitlists = waitlists.filter(w => w.status === 'PUBLISHED').length;

    // Count upcoming launches (published waitlists with future countdown)
    const now = Date.now();
    const upcomingLaunches = waitlists.filter(w => 
      w.status === 'PUBLISHED' && w.countdownEndAt.toMillis() > now
    ).length;

    // Get recent signups (last 10)
    const recentSignupsSnapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentSignups = recentSignupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistSignup[];

    return {
      waitlists,
      totalSignups,
      activeWaitlists,
      upcomingLaunches,
      recentSignups
    };
  }

  /**
   * Export signups to CSV format
   */
  static async exportSignups(waitlistId?: string): Promise<string> {
    let signups: WaitlistSignup[];
    
    if (waitlistId) {
      signups = await this.getWaitlistSignups(waitlistId);
    } else {
      const snapshot = await adminDb.collection(COLLECTIONS.WAITLIST_SIGNUPS)
        .orderBy('createdAt', 'desc')
        .get();
      signups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistSignup[];
    }

    // CSV headers
    const headers = ['Full Name', 'Email', 'WhatsApp', 'Waitlist ID', 'Source', 'Signup Date'];
    
    // CSV rows
    const rows = signups.map(signup => [
      signup.fullName,
      signup.email,
      signup.whatsapp,
      signup.waitlistId,
      signup.source,
      signup.createdAt.toDate().toISOString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}