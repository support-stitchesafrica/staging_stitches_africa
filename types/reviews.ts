import { Timestamp } from 'firebase/firestore';

export interface ProductReview {
  id: string;              // {product_id}_{user_id}
  product_id: string;
  user_id: string;
  display_name: string;   // resolved at read time via resolveDisplayName
  rating: number;          // integer 1–5
  comment: string;         // may be empty string
  verified_purchase: true;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
