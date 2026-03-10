/**
 * Super Admin Service
 * Handles Super Admin detection, setup, and initialization
 */

import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from '@/firebase';
import { UserService, UserProfileValidator, type User, type CreateUserData } from './user-service';

export interface SuperAdminSetupData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  companyName: string;
}

export interface CompanyWorkspace {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdByUserId: string;
  settings: {
    allowedDomains: string[];
    maxUsers?: number;
    features: string[];
  };
}

export class SuperAdminService {
  private static readonly COMPANY_COLLECTION = 'marketing_companies';

  /**
   * Check if any Super Admin exists in the system
   */
  static async hasSuperAdmin(): Promise<boolean> {
    try {
      return await UserService.hasSuperAdmin();
    } catch (error) {
      console.error('Error checking Super Admin existence:', error);
      return false;
    }
  }

  /**
   * Detect if this is the first visit (no Super Admin exists)
   */
  static async isFirstTimeSetup(): Promise<boolean> {
    try {
      const hasSuperAdmin = await this.hasSuperAdmin();
      return !hasSuperAdmin;
    } catch (error) {
      console.error('Error detecting first time setup:', error);
      return false;
    }
  }

  /**
   * Validate Super Admin setup data
   */
  static validateSetupData(setupData: SuperAdminSetupData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate email
    const emailValidation = UserProfileValidator.validateEmail(setupData.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error!);
    }

    // Validate name
    const nameValidation = UserProfileValidator.validateName(setupData.fullName);
    if (!nameValidation.valid) {
      errors.push(nameValidation.error!);
    }

    // Validate phone number
    if (setupData.phoneNumber) {
      const phoneValidation = UserProfileValidator.validatePhoneNumber(setupData.phoneNumber);
      if (!phoneValidation.valid) {
        errors.push(phoneValidation.error!);
      }
    }

    // Validate password
    if (!setupData.password || setupData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    // Validate company name
    if (!setupData.companyName || setupData.companyName.trim().length < 2) {
      errors.push('Company name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create company workspace
   */
  static async createCompanyWorkspace(
    companyName: string, 
    createdByUserId: string
  ): Promise<CompanyWorkspace> {
    try {
      const now = Timestamp.now();
      const companyData = {
        name: companyName,
        createdAt: now,
        createdByUserId,
        settings: {
          allowedDomains: ['stitchesafrica.com', 'stitchesafrica.pro'],
          features: ['user_management', 'vendor_tracking', 'analytics', 'team_management']
        }
      };

      const docRef = await addDoc(collection(db, this.COMPANY_COLLECTION), companyData);
      
      return {
        id: docRef.id,
        ...companyData
      };
    } catch (error) {
      console.error('Error creating company workspace:', error);
      throw new Error('Failed to create company workspace');
    }
  }

  /**
   * Setup Super Admin account and initialize workspace
   */
  static async setupSuperAdmin(setupData: SuperAdminSetupData): Promise<{
    user: User;
    company: CompanyWorkspace;
    firebaseUser: FirebaseUser;
  }> {
    try {
      // Validate setup data
      const validation = this.validateSetupData(setupData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if Super Admin already exists
      const hasExistingSuperAdmin = await this.hasSuperAdmin();
      if (hasExistingSuperAdmin) {
        throw new Error('Super Admin already exists. Cannot create another one.');
      }

      // Create Firebase Authentication user
      const firebaseUserCredential = await createUserWithEmailAndPassword(
        auth,
        setupData.email,
        setupData.password
      );
      const firebaseUser = firebaseUserCredential.user;

      try {
        // Create user profile in Firestore
        const userData: CreateUserData = {
          email: setupData.email,
          name: setupData.fullName,
          phoneNumber: setupData.phoneNumber,
          role: 'super_admin'
        };

        const user = await UserService.createUser(userData);

        // Create company workspace
        const company = await this.createCompanyWorkspace(
          setupData.companyName,
          user.id
        );

        // Update user's last login
        await UserService.updateLastLogin(user.id);

        return {
          user,
          company,
          firebaseUser
        };
      } catch (firestoreError) {
        // If Firestore operations fail, clean up Firebase Auth user
        await firebaseUser.delete();
        throw firestoreError;
      }
    } catch (error) {
      console.error('Error setting up Super Admin:', error);
      throw error;
    }
  }

  /**
   * Get company workspace by ID
   */
  static async getCompanyWorkspace(companyId: string): Promise<CompanyWorkspace | null> {
    try {
      const docRef = doc(db, this.COMPANY_COLLECTION, companyId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as CompanyWorkspace;
    } catch (error) {
      console.error('Error getting company workspace:', error);
      throw new Error('Failed to retrieve company workspace');
    }
  }

  /**
   * Get company workspace by creator
   */
  static async getCompanyByCreator(createdByUserId: string): Promise<CompanyWorkspace | null> {
    try {
      const q = query(
        collection(db, this.COMPANY_COLLECTION),
        where('createdByUserId', '==', createdByUserId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as CompanyWorkspace;
    } catch (error) {
      console.error('Error getting company by creator:', error);
      throw new Error('Failed to retrieve company workspace');
    }
  }

  /**
   * Initialize Super Admin session after setup
   */
  static async initializeSuperAdminSession(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error initializing Super Admin session:', error);
      throw new Error('Failed to initialize session');
    }
  }
}

// Utility functions for Super Admin detection
export const superAdminUtils = {
  /**
   * Check if current page should show Super Admin setup
   */
  async shouldShowSetup(): Promise<boolean> {
    return await SuperAdminService.isFirstTimeSetup();
  },

  /**
   * Redirect logic for Super Admin detection
   */
  getSetupRedirectPath(): string {
    return '/marketing/setup';
  },

  /**
   * Get dashboard redirect path after setup
   */
  getDashboardRedirectPath(): string {
    return '/marketing';
  }
};