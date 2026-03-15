# Implementation Plan: Staging Data Seeder

## Overview

Implement `scripts/seed-staging-data.ts` — a one-time Firebase Admin SDK script that seeds mock tailors and products into Firestore staging collections for the Stitches Africa platform.

## Tasks

- [x] 1. Set up script scaffold and Firebase Admin connection
  - Create `scripts/seed-staging-data.ts` with a `main()` async function and top-level `require.main === module` guard
  - Import `adminDb` from `lib/firebase-admin.ts` and `dotenv/config` for env loading
  - Add a startup banner log showing target project (`stitches-africa`) and collections to be seeded
  - Add error boundary in `main()` that catches unhandled errors, logs them, and calls `process.exit(1)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 2. Implement idempotency sentinel check
  - [x] 2.1 Implement `checkSentinel()` and `writeSentinel()` functions
    - `checkSentinel()` reads `_seed_meta/staging-data-seeder` and returns `true` if it exists
    - `writeSentinel(counts)` writes `{ seededAt, version: "1.0.0", tailorsSeeded, productsSeeded }` to the same doc
    - Call `checkSentinel()` at the top of `main()` — if true, log warning and return early
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test for idempotency guard
    - Mock `adminDb.doc().get()` to return `{ exists: true }` and assert no batch/set/add calls are made
    - **Property 6: idempotency guard**
    - **Validates: Requirements 6.2**

- [x] 3. Implement tailor fixture builder and write to Firestore
  - [x] 3.1 Implement `buildTailorFixtures()` pure function
    - Returns an array of 5 `TailorFixture` objects (3 main tailors, 2 sub-tailors) using pre-generated UUIDs via `uuid`
    - Populate all fields per `StagingUser` interface: `first_name`, `last_name`, `email`, `is_tailor`, `is_sub_tailor`, `role`, `tailorId`, `createdAt`, `phone`, `address`, `shop_name`, `status: "active"`
    - Use realistic African fashion data: shop names like "Adire Couture Lagos", "Kente Kings Accra", "Sahel Stitch Abuja"
    - Sub-tailors reference their parent's UUID in `tailorId`; assign `role` of `"initiator"` or `"approver"`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 3.2 Write property test for tailor document schema invariant
    - Use `fast-check` to generate arbitrary tailor fixture arrays and assert all required fields are present, `status === "active"`, main tailor flags are correct, sub-tailor flags and `role` values are valid
    - **Property 1: tailor document schema invariant**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.7, 2.8**

  - [x] 3.3 Write tailors to `staging_users` and `staging_tailors`
    - Use a Firestore batch to write all 5 tailor documents to `staging_users` using their pre-generated UUIDs as doc IDs
    - In the same batch, write main tailor documents (3) to `staging_tailors` using the same doc IDs
    - Log each tailor name, doc ID, and collection as it is added to the batch
    - Commit the batch and log success
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 7.1_

  - [ ]* 3.4 Write unit test for staging_tailors correspondence
    - Mock `adminDb.batch()` and assert that for every main tailor written to `staging_users`, an identical document is written to `staging_tailors` with the same doc ID
    - **Property 2: staging_tailors correspondence invariant**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [-] 4. Implement product fixture builder
  - [x] 4.1 Implement `buildProductFixtures(tailorFixtures)` pure function
    - Returns an array of 10 `ProductFixture` objects distributed across the 3 main tailor IDs
    - Include at least 4 bespoke products and at least 4 ready-to-wear products
    - Cover all four categories: `"men"`, `"women"`, `"kids"`, `"unisex"`
    - Use African fashion wear categories: `"Agbada"`, `"Ankara"`, `"Kente"`, `"Dashiki"`, `"Kaftan"`, `"Aso-Oke"`, `"Boubou"`, `"Adire"`
    - Set `approvalStatus: "pending"`, `price.currency: "NGN"`, `status: "verified"` for main tailor products
    - Populate `bespokeOptions` for bespoke products and `rtwOptions` for RTW products; set the other to `null`
    - Set `product_id: ""` as placeholder (will be updated after Firestore write)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.12_

  - [ ]* 4.2 Write property test for product document schema invariant
    - Use `fast-check` to generate arbitrary product fixture objects and assert all required fields are present, `approvalStatus === "pending"`, `price.currency === "NGN"`, bespoke/RTW option exclusivity holds
    - **Property 3: product document schema invariant**
    - **Validates: Requirements 4.5, 4.6, 4.7, 4.9, 4.12**

  - [ ]* 4.3 Write property test for product status conditional invariant
    - Generate arbitrary (product fixture, tailor type) pairs and assert `status === "verified"` for main tailors and `status === "initiated"` for sub-tailors
    - **Property 4: product status conditional invariant**
    - **Validates: Requirements 4.10**

- [x] 5. Write products to Firestore and duplicate to local collection
  - [x] 5.1 Write products to `staging_tailor_works` and set `product_id`
    - For each product fixture, call `adminDb.collection("staging_tailor_works").add(data)` to get the auto-generated doc ID
    - Call `adminDb.doc(...).update({ product_id: docRef.id })` to set the `product_id` field
    - Log each product title, doc ID, tailor ID, and collection
    - _Requirements: 4.11, 7.2_

  - [x] 5.2 Duplicate each product to `staging_tailor_works_local`
    - After each successful write to `staging_tailor_works`, write the same data (with `product_id` set) to `staging_tailor_works_local` using `adminDb.collection("staging_tailor_works_local").doc(docRef.id).set(...)`
    - Wrap each local write in a try/catch — on failure, log a warning and continue to the next product
    - Log the duplication result for each product
    - _Requirements: 5.1, 5.2, 5.3, 7.3_

  - [ ]* 5.3 Write unit test for product duplication correspondence
    - Mock Firestore add/set calls and assert that for every product written to `staging_tailor_works`, a matching document with the same ID and `product_id` is written to `staging_tailor_works_local`
    - Also assert that a failure on the local write does not prevent the next product from being written
    - **Property 5: product duplication correspondence**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Wire up summary logging and sentinel write
  - After all writes complete, call `writeSentinel({ tailorsSeeded: 5, productsSeeded: 10 })`
  - Log a final summary: total tailors seeded, total products seeded, total documents written across all 4 collections
  - _Requirements: 1.5, 6.3, 7.4_

- [ ]* 8. Write property test for seeded collection coverage invariants
  - Run `main()` against a mocked Firestore and assert post-conditions on mock call arguments:
    - >= 3 calls with `is_tailor: true` to `staging_users`
    - >= 2 calls with `is_sub_tailor: true` to `staging_users`
    - >= 10 add calls to `staging_tailor_works`
    - >= 3 distinct `tailor_id` values across product writes
    - Both `"bespoke"` and `"ready-to-wear"` types present with count >= 4 each
    - All four category values present
  - **Property 7: seeded collection coverage invariants**
  - **Validates: Requirements 2.1, 2.2, 4.1, 4.2, 4.3, 4.4**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Run the script with: `npx ts-node scripts/seed-staging-data.ts`
- To re-run after seeding, delete the `_seed_meta/staging-data-seeder` document in Firestore Console
- Property tests use `fast-check` (already in `devDependencies`) with minimum 100 iterations each
- The script uses `lib/firebase-admin.ts` which auto-loads credentials from the local service account JSON file or env vars
