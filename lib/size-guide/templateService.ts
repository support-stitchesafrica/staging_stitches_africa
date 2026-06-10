/**
 * Template service for the Vendor Size Guide System.
 * Reads predefined marketplace templates from the `size_guide_templates` Firestore collection.
 * Requirements: 11.1, 11.4
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { getDbInstance } from '@/firebase';
import type { SizeGuideTemplate } from '@/types/size-guide';

const COLLECTION = 'size_guide_templates';

/**
 * Returns all marketplace templates.
 * Readable by all authenticated vendors.
 * Requirement 11.1, 11.4
 */
export async function getTemplates(): Promise<SizeGuideTemplate[]> {
  const db = getDbInstance();
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SizeGuideTemplate));
}

/**
 * Returns a single template by ID, or null if not found.
 * Requirement 11.4
 */
export async function getTemplateById(id: string): Promise<SizeGuideTemplate | null> {
  const db = getDbInstance();
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SizeGuideTemplate;
}
