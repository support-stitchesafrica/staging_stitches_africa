
import { Timestamp } from 'firebase/firestore';

export interface TailorStoryboard {
  id: string;
  title: string;
  tailorId: string;
  tailorName: string;
  tailorDescription: string; // From tailor's bio/brand description
  tailorLogo?: string;
  productIds: string[];
  active: boolean;
  createdBy: string; // Marketing user ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Metadata for display
  productsCount?: number;
  thumbnailUrl?: string; // First product image
  previewImage?: string; // Main front-facing image
  bannerImage?: string; // Secondary/Banner image
}

export interface CreateTailorStoryboardData {
  title: string;
  tailorId: string;
  tailorName: string;
  tailorDescription: string;
  tailorLogo?: string;
  productIds: string[];
  active?: boolean;
  previewImage?: string;
  bannerImage?: string;
}
