/**
 * Edge-case orders only (requires existing tailors in Firestore).
 * Prefer the full bootstrap: npm run staging:seed
 */
import './load-env';

console.warn(
  '[staging] seed-edge-cases is deprecated. Running full seed-staging instead...\n',
);

import './seed-staging';
