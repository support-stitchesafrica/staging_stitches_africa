import type { Firestore } from 'firebase-admin/firestore';

/** Latest approval doc for a guide (no composite index required). */
export async function getLatestApprovalDocForGuide(
  db: Firestore,
  guideId: string,
) {
  const snap = await db
    .collection('size_guide_approvals')
    .where('guide_id', '==', guideId)
    .get();

  if (snap.empty) return null;

  const sorted = [...snap.docs].sort((a, b) => {
    const aMs = a.data().submitted_at?.toMillis?.() ?? 0;
    const bMs = b.data().submitted_at?.toMillis?.() ?? 0;
    return bMs - aMs;
  });

  return sorted[0];
}
