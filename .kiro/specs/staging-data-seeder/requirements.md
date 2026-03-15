# Requirements Document

## Introduction

The Staging Data Seeder is a standalone Node.js/TypeScript script for the Stitches Africa platform that populates Firebase Firestore staging collections with realistic mock data. It seeds mock tailors into `staging_users` and `staging_tailors`, and mock products into `staging_tailor_works` and `staging_tailor_works_local`. The script uses the Firebase Admin SDK and is intended for development and QA environments to enable testing without touching production data.

## Glossary

- **Seeder**: The standalone TypeScript script (`scripts/seed-staging-data.ts`) that writes mock data to Firestore staging collections.
- **Admin_SDK**: Firebase Admin SDK initialized via `lib/firebase-admin.ts`, using service account credentials from environment variables or a local key file.
- **Staging_Collection**: A Firestore collection prefixed with `staging_` (e.g., `staging_users`, `staging_tailors`, `staging_tailor_works`, `staging_tailor_works_local`).
- **Main_Tailor**: A user document where `is_tailor: true` and `is_sub_tailor: false`, representing the primary tailor account.
- **Sub_Tailor**: A user document where `is_tailor: false` and `is_sub_tailor: true`, linked to a Main_Tailor via `tailorId`.
- **Tailor_Document**: A Firestore document in `staging_users` and `staging_tailors` representing a tailor or sub-tailor.
- **Product_Document**: A Firestore document in `staging_tailor_works` representing a catalog item (bespoke or ready-to-wear).
- **Bespoke_Product**: A product of `type: "bespoke"` with `bespokeOptions` populated and `rtwOptions: null`.
- **Ready_To_Wear_Product**: A product of `type: "ready-to-wear"` with `rtwOptions` populated and `bespokeOptions: null`.
- **Idempotency_Guard**: A mechanism that checks for existing seed documents before writing, preventing duplicate data on repeated runs.

---

## Requirements

### Requirement 1: Script Entry Point and Execution

**User Story:** As a developer, I want to run the seed script with a single command, so that I can quickly populate staging collections without manual setup.

#### Acceptance Criteria

1. THE Seeder SHALL be executable via `npx ts-node scripts/seed-staging-data.ts` from the project root.
2. THE Seeder SHALL use the `scripts/tsconfig.json` TypeScript configuration for compilation.
3. THE Seeder SHALL import and use the `adminDb` instance from `lib/firebase-admin.ts` to connect to Firestore.
4. WHEN the script starts, THE Seeder SHALL log a startup banner indicating the target project and collections.
5. WHEN the script completes successfully, THE Seeder SHALL log a summary of how many tailors and products were written.
6. IF an unrecoverable error occurs during execution, THEN THE Seeder SHALL log the error with a descriptive message and exit with a non-zero exit code.

---

### Requirement 2: Tailor Seeding into staging_users

**User Story:** As a developer, I want mock tailor accounts in `staging_users`, so that I can test vendor authentication and sub-tailor management flows.

#### Acceptance Criteria

1. THE Seeder SHALL write at least 3 Main_Tailor documents to the `staging_users` collection.
2. THE Seeder SHALL write at least 2 Sub_Tailor documents to the `staging_users` collection, each linked to a Main_Tailor via the `tailorId` field.
3. WHEN writing a Main_Tailor document, THE Seeder SHALL set `is_tailor: true`, `is_sub_tailor: false`, and `tailorId` to an empty string or the document's own ID.
4. WHEN writing a Sub_Tailor document, THE Seeder SHALL set `is_tailor: false`, `is_sub_tailor: true`, and `tailorId` to the document ID of the parent Main_Tailor.
5. THE Seeder SHALL populate each Tailor_Document with `first_name`, `last_name`, `email`, `role`, `phone`, `address`, `shop_name`, `status`, and `createdAt` fields matching the schema defined in `vendor-services/userAuth.ts`.
6. THE Seeder SHALL use realistic African fashion data for `shop_name` values (e.g., "Adire Couture Lagos", "Kente Kings Accra").
7. THE Seeder SHALL assign `role` values of `"initiator"` or `"approver"` to Sub_Tailor documents.
8. THE Seeder SHALL set `status` to `"active"` for all seeded Tailor_Documents.

---

### Requirement 3: Tailor Seeding into staging_tailors

**User Story:** As a developer, I want tailor-specific documents in `staging_tailors` mirroring `staging_users`, so that I can test tailor profile and storefront features.

#### Acceptance Criteria

1. THE Seeder SHALL write one document to `staging_tailors` for each Main_Tailor written to `staging_users`, using the same document ID.
2. WHEN writing to `staging_tailors`, THE Seeder SHALL include all fields from the corresponding `staging_users` document plus any tailor-specific fields (e.g., `shop_name`, `address`).
3. THE Seeder SHALL ensure the document ID in `staging_tailors` matches the document ID used in `staging_users` for the same tailor.

---

### Requirement 4: Product Seeding into staging_tailor_works

**User Story:** As a developer, I want mock product catalog items in `staging_tailor_works`, so that I can test product listing, filtering, and approval flows.

#### Acceptance Criteria

1. THE Seeder SHALL write at least 10 Product_Documents to the `staging_tailor_works` collection.
2. THE Seeder SHALL distribute products across at least 3 different Main_Tailor IDs.
3. THE Seeder SHALL include a mix of at least 4 Bespoke_Products and at least 4 Ready_To_Wear_Products.
4. THE Seeder SHALL include products across all four `category` values: `"men"`, `"women"`, `"kids"`, and `"unisex"`.
5. WHEN writing a Bespoke_Product, THE Seeder SHALL set `rtwOptions: null` and populate `bespokeOptions` with `customization.fabricChoices`, `customization.styleOptions`, `customization.finishingOptions`, `measurementsRequired`, and `productionTime`.
6. WHEN writing a Ready_To_Wear_Product, THE Seeder SHALL set `bespokeOptions: null` and populate `rtwOptions` with `colors`, `fabric`, `season`, and `sizes`.
7. THE Seeder SHALL populate each Product_Document with all required fields from the `ProductFormData` interface in `vendor-services/addTailorWork.ts`, including `tailor_id`, `type`, `title`, `price`, `discount`, `description`, `category`, `wear_category`, `wear_quantity`, `tags`, `keywords`, `images`, `sizes`, `customSizes`, `userCustomSizes`, `userSizes`, `tailor`, `status`, `availability`, `deliveryTimeline`, `createdAt`, `approvalStatus`, `metric_size_guide`, `shipping`, and `product_id`.
8. THE Seeder SHALL use realistic African fashion wear categories such as `"Agbada"`, `"Ankara"`, `"Kente"`, `"Dashiki"`, `"Kaftan"`, `"Aso-Oke"`, and `"Boubou"`.
9. THE Seeder SHALL set `approvalStatus` to `"pending"` for all seeded products.
10. THE Seeder SHALL set `status` to `"verified"` for products belonging to Main_Tailors and `"initiated"` for products belonging to Sub_Tailors.
11. WHEN writing a Product_Document, THE Seeder SHALL set `product_id` to the Firestore document ID assigned after creation.
12. THE Seeder SHALL set `price.currency` to `"NGN"` for all seeded products.

---

### Requirement 5: Product Duplication into staging_tailor_works_local

**User Story:** As a developer, I want products duplicated to `staging_tailor_works_local`, so that I can test local catalog features that mirror the main catalog.

#### Acceptance Criteria

1. THE Seeder SHALL write a copy of every Product_Document to `staging_tailor_works_local` using the same document ID as in `staging_tailor_works`.
2. WHEN duplicating a product, THE Seeder SHALL include the `product_id` field set to the shared document ID.
3. IF writing to `staging_tailor_works_local` fails for a document, THEN THE Seeder SHALL log a warning and continue seeding remaining documents without aborting the entire run.

---

### Requirement 6: Idempotency and Safety

**User Story:** As a developer, I want the seed script to be safe to reason about on repeated runs, so that I don't accidentally create duplicate data in staging.

#### Acceptance Criteria

1. WHEN the Seeder starts, THE Seeder SHALL check whether a sentinel document (e.g., `_seed_meta/staging-data-seeder`) exists in Firestore.
2. IF the sentinel document exists, THEN THE Seeder SHALL log a warning that staging data has already been seeded and exit without writing any documents.
3. WHEN all seeding operations complete successfully, THE Seeder SHALL write the sentinel document with a `seededAt` timestamp and a `version` field.
4. THE Seeder SHALL document in its header comment that it is a one-time seed script and must be manually cleared (e.g., by deleting the sentinel document) before re-running.

---

### Requirement 7: Progress Logging

**User Story:** As a developer, I want clear progress output during seeding, so that I can monitor the script and diagnose failures.

#### Acceptance Criteria

1. WHEN each Tailor_Document is written, THE Seeder SHALL log the tailor's name, document ID, and target collection.
2. WHEN each Product_Document is written, THE Seeder SHALL log the product title, document ID, tailor ID, and target collection.
3. WHEN a document is duplicated to `staging_tailor_works_local`, THE Seeder SHALL log the duplication result.
4. WHEN the script finishes, THE Seeder SHALL log a final summary including total tailors seeded, total products seeded, and total documents written across all collections.
