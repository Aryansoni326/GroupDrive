# GroupDrive – Master Antigravity Implementation Prompts Library

**Document Version:** 1.0.0  
**Status:** Approved Implementation Library  
**Classification:** Confidential & Proprietary – GroupDrive Technologies  
**Target Assistant:** Antigravity AI Pair Programmer  
**Architecture:** Monorepo (Turborepo) | 3 Next.js Frontends | 1 FastAPI Modular Monolith | PostgreSQL 16 | Redis | Celery  
**Date:** November 2026  

---

## 1. Execution Protocol & Rules for Prompts

1. **Strict Sequential Execution:** Execute prompts in exact chronological order (Group A through Group J). Do not skip ahead.
2. **One Prompt at a Time:** Each prompt is atomic, self-contained, and testable. Do not combine prompts.
3. **Verify Before Advancing:** Complete the testing instructions and acceptance criteria of each prompt before moving to the next.

```
EXECUTION SEQUENCE:
Group A: Monorepo Foundation ──────────► Group B: Shared Database Foundation
                                                      │
Group D: Central Catalogue Foundation ◄── Group C: Shared Authentication
         │
         ▼
Group E: DealerOS (Dealership SaaS) ────► Group F: Admin Panel Governance
                                                      │
Group H: Group Purchasing Engine ◄─────── Group G: Main Website Marketplace
         │
         ▼
Group I: Dealer Quotations & Deals ─────► Group J: Advanced AI, QA & Launch
```

---

## GROUP A – Repository & Monorepo Foundation

### PROMPT-A01: Turborepo Monorepo Scaffolding
- **Objective:** Initialize the root Turborepo workspace, package configurations, and empty workspace directories.
- **Prerequisites:** `docs/Architecture.md`, `docs/Deployment.md`.
- **Exact Copy-Paste Prompt:**
```markdown
You are the Lead Systems Architect for GroupDrive. Initialize the Turborepo monorepo workspace from scratch.

Tasks:
1. Initialize git if not already initialized.
2. Create root `package.json` with `pnpm` workspaces configured for `apps/*` and `packages/*`.
3. Create `turbo.json` with pipeline tasks: `build`, `test`, `lint`, `dev`, `check-types`.
4. Create empty directory scaffolding:
   - `apps/web` (Main Website)
   - `apps/dealer` (DealerOS)
   - `apps/admin` (Admin Panel)
   - `apps/backend` (FastAPI Modular Monolith)
   - `packages/ui` (Shared React components)
   - `packages/types` (Shared TypeScript DTOs)
   - `packages/config` (Shared ESLint, Tailwind, TS configs)
   - `packages/utils` (Shared formatting and math utilities)
   - `docker/` (Docker compose and container files)
5. Create `.gitignore` ignoring node_modules, .next, .turbo, __pycache__, .venv, and environment secrets.

Restrictions:
- Do not install heavyweight packages yet. Focus strictly on clean workspace orchestration.

Testing:
- Run `pnpm install` and verify root workspace resolves without errors.
```
- **Files Expected to Change:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`.
- **Acceptance Criteria:** Monorepo package layout matches Section 4 of `docs/Architecture.md`.

---

### PROMPT-A02: Shared Packages Setup (`ui`, `types`, `config`, `utils`)
- **Objective:** Configure shared configuration, TypeScript base settings, and UI component package.
- **Prerequisites:** `PROMPT-A01`, `docs/Design_System.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Configure the shared packages inside `packages/` for GroupDrive.

Tasks:
1. `packages/config`: Create shared TypeScript `tsconfig.base.json`, shared ESLint configuration, and shared Tailwind preset defining GroupDrive design tokens (Deep Navy #0F172A, Racing Red #E11D48, 4px spacing).
2. `packages/types`: Initialize TypeScript package for shared API DTOs and database models.
3. `packages/utils`: Implement currency formatters for Indian Rupees (`formatINR(paise: number)` -> `₹12.45 Lakh`), RTO tax calculator helpers, and date utilities.
4. `packages/ui`: Scaffold shadcn/ui package with Radix UI primitives and Tailwind CSS.

Restrictions:
- Adhere strictly to the color tokens and typography scale defined in `docs/Design_System.md`.

Testing:
- Run `pnpm build` inside `packages/utils` and `packages/config` to verify successful compilation.
```
- **Files Expected to Change:** `packages/config/*`, `packages/types/*`, `packages/utils/*`, `packages/ui/*`.
- **Acceptance Criteria:** Shared packages can be imported by client apps without module resolution errors.

---

### PROMPT-A03: Docker Compose Local Infrastructure Setup
- **Objective:** Create local Docker Compose orchestrating PostgreSQL 16, Redis 7, and MinIO object storage.
- **Prerequisites:** `docs/Deployment.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Create the local development Docker infrastructure for GroupDrive.

Tasks:
1. Create `docker/docker-compose.dev.yml` containing:
   - `postgres`: PostgreSQL 16 Alpine, port 5432, database `groupdrive_dev`, user `gd_admin`, password `gd_local_pass`. Include healthcheck (`pg_isready`).
   - `redis`: Redis 7 Alpine, port 6379, with password protection. Include healthcheck (`redis-cli ping`).
   - `minio`: MinIO S3-compatible storage, API port 9000, console port 9001. Automatically create default buckets: `groupdrive-media-dev` (public) and `groupdrive-docs-dev` (private).
2. Create `.env.example` in repository root documenting all local connection strings.

Restrictions:
- Ensure persistent named Docker volumes for postgres data, redis data, and minio data.

Testing:
- Run `docker compose -f docker/docker-compose.dev.yml up -d` and verify all containers reach healthy state.
```
- **Files Expected to Change:** `docker/docker-compose.dev.yml`, `.env.example`.
- **Acceptance Criteria:** PostgreSQL, Redis, and MinIO are accessible on designated local ports.

---

## GROUP B – Shared Backend & Database Foundation

### PROMPT-B01: FastAPI Modular Monolith Shell & Database Engine
- **Objective:** Scaffold the FastAPI backend application, SQLAlchemy async engine, and Alembic migration framework.
- **Prerequisites:** `PROMPT-A03`, `docs/Architecture.md`, `docs/Database_Design.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Scaffold the FastAPI modular monolith backend inside `apps/backend`.

Tasks:
1. Configure `apps/backend/pyproject.toml` with Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0, AsyncPG, Alembic, Pydantic v2, and Pydantic-Settings.
2. Create `src/core/config.py` loading environment variables via `BaseSettings`.
3. Create `src/core/database.py` with SQLAlchemy async engine, async session factory (`async_sessionmaker`), and declarative Base model with `id` (UUID), `created_at`, and `updated_at`.
4. Initialize Alembic with `src/db/migrations` and configure `env.py` for async migrations.
5. Create `src/main.py` mounting FastAPI application with CORS middleware, `/health` endpoint, and `/api/v1` router mount.

Restrictions:
- Use pure async SQLAlchemy (`asyncpg`). Do not use synchronous drivers.

Testing:
- Run `pytest` on the `/health` endpoint to verify it returns `{"status": "healthy"}`.
```
- **Files Expected to Change:** `apps/backend/pyproject.toml`, `apps/backend/src/main.py`, `apps/backend/src/core/*`, `apps/backend/alembic.ini`.
- **Acceptance Criteria:** Backend boots via `uvicorn src.main:app` and connects to local PostgreSQL.

---

### PROMPT-B02: Identity & RBAC Database Migrations
- **Objective:** Implement database models and Alembic migrations for Users, Roles, Permissions, and Sessions.
- **Prerequisites:** `PROMPT-B01`, `docs/Database_Design.md`, `docs/Role_Permission_Matrix.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the SQLAlchemy models and Alembic migration for identity and authorization tables.

Tasks:
1. Create models in `src/modules/auth/models.py`:
   - `users`: ID (UUID), phone_number (indexed, unique), email (CITEXT, unique), password_hash, is_phone_verified, is_active.
   - `user_profiles`: User profile, city, state, pin_code, kyc_status.
   - `roles`: Role code (indexed, unique), name, description.
   - `permissions`: Permission code (unique), module, description.
   - `role_permissions` and `user_roles`: Many-to-many junction tables.
   - `user_sessions`: Refresh token hashes, user_agent, ip_address, expires_at.
2. Generate and run Alembic migration: `alembic revision --autogenerate -m "create_identity_and_rbac_tables"`.
3. Create a seed script `scripts/seed_roles.py` populating the 12 core roles from `docs/Role_Permission_Matrix.md`.

Restrictions:
- Every foreign key must have an explicit B-tree index.

Testing:
- Run `alembic upgrade head` and verify tables exist in PostgreSQL. Run seed script.
```
- **Files Expected to Change:** `apps/backend/src/modules/auth/models.py`, `alembic/versions/*`, `scripts/seed_roles.py`.
- **Acceptance Criteria:** All 12 roles exist in the database with zero migration errors.

---

## GROUP C – Shared Authentication & Identity

### PROMPT-C01: Unified Authentication Endpoints (OTP & Password)
- **Objective:** Implement JWT authentication, SMS OTP verification, and refresh token rotation.
- **Prerequisites:** `PROMPT-B02`, `docs/API_Specification.md`, `docs/Role_Permission_Matrix.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the unified authentication API endpoints inside `apps/backend/src/modules/auth`.

Tasks:
1. Implement `POST /api/v1/auth/request-otp`: Validates Indian mobile number format (`^\+91[6-9]\d{9}$`), generates 6-digit OTP, caches in Redis with 5-minute TTL, and logs/sends OTP.
2. Implement `POST /api/v1/auth/verify-otp`: Validates OTP against Redis, creates or retrieves user, issues 15-minute JWT access token and sets HTTP-Only `__Host-gd_refresh` cookie.
3. Implement `POST /api/v1/auth/login-password`: Authenticates Dealer Staff and Admins using Argon2id password verification.
4. Implement `POST /api/v1/auth/refresh`: Validates refresh token, checks database revocation status, rotates refresh token, and returns new access token.
5. Create FastAPI dependency `get_current_user` and role guard `require_roles(...)`.

Restrictions:
- Refresh tokens must be stored as SHA-256 hashes in `user_sessions`.
- Access tokens must contain `sub`, `roles`, `dealer_id`, and `branch_id`.

Testing:
- Write Pytest integration tests covering OTP request, successful verification, invalid OTP guess, and token refresh.
```
- **Files Expected to Change:** `apps/backend/src/modules/auth/router.py`, `service.py`, `schemas.py`, `dependencies.py`.
- **Acceptance Criteria:** Authentication flow passes all tests matching Suite 01 of `docs/Testing_Strategy.md`.

---

## GROUP D – Central Vehicle Catalogue

### PROMPT-D01: Master Catalogue Database Models & Migration
- **Objective:** Implement the central vehicle catalogue schema (Brands, Models, Trims, Variants, Specifications, Features, Media, Colours, Pricing).
- **Prerequisites:** `PROMPT-B02`, `docs/Database_Design.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Master Vehicle Catalogue models and database migrations.

Tasks:
1. In `src/modules/catalogue/models.py`, implement:
   - `brands`: Name, slug, logo_url.
   - `vehicle_models`: Brand_id (FK), name, slug, body_type, seating_capacity, safety_rating_stars.
   - `vehicle_variants`: Model_id (FK), trim_name, variant_name, slug, fuel_type, transmission_type, displacement_cc, max_power_bhp, max_torque_nm, arai_mileage.
   - `vehicle_specifications`: Variant_id (FK), category, specification_key, specification_value, unit.
   - `vehicle_features`: Variant_id (FK), feature_group, feature_key, is_available.
   - `vehicle_media`: Model_id (FK), variant_id (FK nullable), media_type, media_url, display_order.
   - `vehicle_colours`: Model_id (FK), colour_name, hex_primary, hex_secondary, is_dual_tone.
   - `vehicle_pricing`: Variant_id (FK), state_code, ex_showroom_price, gst_rate_percent, cess_rate_percent.
2. Run Alembic migration to create tables.
3. Create `scripts/seed_catalogue_sample.py` seeding Tata Nexon, Hyundai Creta, and Maruti Brezza with authentic Indian trims and specifications.

Restrictions:
- No dealer tenant ID columns in catalogue tables. Master catalogue is strictly global.

Testing:
- Run seed script and execute SQL verification query checking variant count.
```
- **Files Expected to Change:** `apps/backend/src/modules/catalogue/models.py`, `alembic/versions/*`, `scripts/seed_catalogue_sample.py`.
- **Acceptance Criteria:** Full vehicle hierarchy is stored and queryable in PostgreSQL.

---

### PROMPT-D02: Master Catalogue Public & Admin APIs
- **Objective:** Build public search/filter catalogue endpoints and admin CRUD endpoints with Redis caching.
- **Prerequisites:** `PROMPT-D01`, `PROMPT-C01`, `docs/API_Specification.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Master Vehicle Catalogue REST API endpoints in `apps/backend/src/modules/catalogue`.

Tasks:
1. Public Endpoints:
   - `GET /api/v1/catalogue/brands`: List active brands.
   - `GET /api/v1/catalogue/models`: Multi-faceted search and filter by budget, body_type, fuel_type, transmission, seating_capacity. Implement Redis caching with 24h TTL.
   - `GET /api/v1/catalogue/models/{slug}`: Retrieve model details, variant list, and colour options.
   - `GET /api/v1/catalogue/variants/{id}`: Detailed variant specifications and features.
2. Admin-Only Endpoints:
   - `POST /api/v1/catalogue/models`, `POST /api/v1/catalogue/variants`, `PUT /api/v1/catalogue/variants/{id}`.
   - Enforce `require_roles(['ROLE_SUPER_ADMIN', 'ROLE_CATALOGUE_ADMIN'])`. Invalidate Redis cache on write.

Restrictions:
- Dealers attempting to call admin catalogue endpoints must receive `403 Forbidden`.

Testing:
- Write Pytest tests verifying filtering by budget and fuel type, and verifying 403 on dealer role write attempts.
```
- **Files Expected to Change:** `apps/backend/src/modules/catalogue/router.py`, `service.py`, `schemas.py`.
- **Acceptance Criteria:** Public search responds in $< 100\text{ ms}$; admin endpoints enforce role restriction.

---

## GROUP E – DealerOS (Dealership SaaS)

### PROMPT-E01: Dealership Entity, Branches & Staff Database Setup
- **Objective:** Implement Dealership legal entity, branch hierarchy, KYC documents, and staff assignment models.
- **Prerequisites:** `PROMPT-D01`, `docs/Database_Design.md`, `docs/Role_Permission_Matrix.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Dealership multi-tenant data architecture in `apps/backend/src/modules/dealers`.

Tasks:
1. Implement models in `models.py`:
   - `dealers`: Legal entity name, trade name, GSTIN (unique), PAN (unique), OEM franchise brand, kyc_status (`PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`).
   - `dealer_documents`: Document type (GSTIN, Trade Cert, OEM Letter), S3 URL, verification_status.
   - `dealer_branches`: Branch name, branch type, city, state, pin_code, authorized_rto_codes (array).
   - `dealer_staff`: User_id (FK), dealer_id (FK), branch_id (FK), designation, staff_role.
2. Create and execute Alembic migration.
3. Implement `POST /api/v1/dealers/register`, `GET /api/v1/dealers/me`, `POST /api/v1/dealers/me/branches`, and `POST /api/v1/dealers/me/staff`.

Restrictions:
- Enforce tenant isolation: Staff can only access records matching their authenticated `dealer_id`.

Testing:
- Write tests verifying dealership onboarding, branch creation, and cross-dealership access blocking.
```
- **Files Expected to Change:** `apps/backend/src/modules/dealers/models.py`, `router.py`, `service.py`, `schemas.py`.
- **Acceptance Criteria:** Dealership structure is operational with full multi-tenant foreign keys.

---

### PROMPT-E02: DealerOS Frontend Scaffolding & Onboarding Wizard
- **Objective:** Build the Next.js DealerOS frontend shell, authentication screens, and dealership onboarding wizard.
- **Prerequisites:** `PROMPT-E01`, `docs/Design_System.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Build the DealerOS frontend application in `apps/dealer`.

Tasks:
1. Initialize Next.js 14 App Router with Tailwind CSS and import tokens from `packages/ui`.
2. Implement Dealer Authentication: Work Email + Password login page with error toasts.
3. Build Dealership Onboarding Flow:
   - Step 1: Legal Entity Details, Trade Name, GSTIN, PAN, OEM Brand selector.
   - Step 2: Showroom & Stockyard Branch setup (Addresses, authorized RTO codes).
   - Step 3: Document Upload (Dropzone for GSTIN Certificate & OEM Franchise Letter).
   - Step 4: Verification Status Banner ("Application Under Review by GroupDrive Administration").
4. Build DealerOS Layout: Collapsible sidebar, header with active branch switcher, and user profile menu.

Restrictions:
- Adhere strictly to the enterprise SaaS guidelines in Section 6.2 of `docs/Design_System.md`.

Testing:
- Run `pnpm dev --filter dealer` and complete the onboarding form in browser.
```
- **Files Expected to Change:** `apps/dealer/src/app/*`, `apps/dealer/src/components/*`.
- **Acceptance Criteria:** Dealer can register, upload documents, and view pending verification screen.

---

### PROMPT-E03: DealerOS Yard Inventory Management
- **Objective:** Implement physical yard inventory tracking, VIN allocation, and aging stock tracker in DealerOS.
- **Prerequisites:** `PROMPT-E02`, `docs/Database_Design.md`, `docs/API_Specification.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Inventory and Yard Tracking module in backend and DealerOS frontend.

Tasks:
1. Backend (`src/modules/inventory`):
   - Model `inventory`: Dealer_id (FK), branch_id (FK), variant_id (FK), colour_id (FK), vin, manufacturing_month_year, status (`IN_STOCK`, `IN_TRANSIT`, `ALLOCATED`, `SOLD`), days_in_yard, yard_location, is_available_for_flash_sale.
   - Implement `GET /api/v1/inventory` with filters (`branch_id`, `status`, `variant_id`) and `POST /api/v1/inventory`.
2. Frontend (`apps/dealer/src/app/(dashboard)/inventory`):
   - High-density data table displaying physical stock with variant, colour, VIN, days on lot, and status badge.
   - "Add Vehicle to Yard" dialog with variant selector from master catalogue.
   - Excel/CSV bulk import button.

Restrictions:
- Backend repository must strictly enforce `WHERE dealer_id = :current_user_dealer_id`.

Testing:
- Pytest verifying Dealership B cannot view inventory added by Dealership A.
```
- **Files Expected to Change:** `apps/backend/src/modules/inventory/*`, `apps/dealer/src/app/(dashboard)/inventory/*`.
- **Acceptance Criteria:** Inventory table displays stock accurately with strict tenant segregation.

---

## GROUP F – Admin Panel (Platform Governance)

### PROMPT-F01: Admin Panel Shell & Dealer Verification Queue
- **Objective:** Build the Next.js Admin Panel with dealer KYC document verification workstation.
- **Prerequisites:** `PROMPT-E01`, `docs/Design_System.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Build the Admin Panel frontend in `apps/admin` and implement the Dealer Verification Queue.

Tasks:
1. Initialize Next.js 14 App Router in `apps/admin` with Admin design tokens and high-contrast styling.
2. Implement Admin login page requiring elevated credentials (`ROLE_SUPER_ADMIN` or `ROLE_DEALER_VERIFICATION_ADMIN`).
3. Build Verification Workstation (`/admin/dealers/verification`):
   - Split-screen layout: Document PDF/Image viewer on the left; Dealership GSTIN/Legal info on the right.
   - "Approve Dealership" button (transitions dealer to `VERIFIED` and activates DealerOS quoting permissions).
   - "Reject Application" button (mandates selection of a rejection reason code).
4. Backend integration: Connect to `GET /api/v1/admin/dealers/verification-queue` and `POST /api/v1/admin/dealers/{id}/verify`.

Restrictions:
- Every approval/rejection must create an immutable entry in the `audit_logs` table.

Testing:
- Approve a test dealer application and verify their status updates to `VERIFIED` in database.
```
- **Files Expected to Change:** `apps/admin/src/*`, `apps/backend/src/modules/admin/*`.
- **Acceptance Criteria:** Admin can inspect documents and approve dealers, enabling DealerOS quoting.

---

### PROMPT-F02: Admin Master Vehicle Catalogue Editor
- **Objective:** Build the web-based vehicle catalogue management workstation inside the Admin Panel.
- **Prerequisites:** `PROMPT-F01`, `PROMPT-D02`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Master Catalogue Management interfaces in `apps/admin/src/app/(dashboard)/catalogue`.

Tasks:
1. Brands Manager: List, create, and edit automotive brands with logo upload to S3/MinIO.
2. Models Manager: List and create vehicle models with body type, seating capacity, and Bharat NCAP star rating selector.
3. Variants & Trim Builder: Tabular interface for adding variants under a model (Fuel, Transmission, Engine CC, BHP, Torque, ARAI mileage).
4. Technical Specs Editor: Dynamic key-value specification grid (Brakes, Suspension, Boot capacity).
5. State Pricing Matrix: Configure ex-showroom base price per Indian state.

Restrictions:
- Only accessible by users holding `ROLE_SUPER_ADMIN` or `ROLE_CATALOGUE_ADMIN`.

Testing:
- Create a new vehicle model and variant from the Admin UI and verify it immediately appears in public search.
```
- **Files Expected to Change:** `apps/admin/src/app/(dashboard)/catalogue/*`.
- **Acceptance Criteria:** Admin can fully manage the automotive catalogue via web UI.

---

## GROUP G – Main Website (Customer Marketplace)

### PROMPT-G01: Main Website Shell, Homepage & Search Filters
- **Objective:** Build the consumer-facing marketplace homepage and multi-faceted vehicle discovery catalog.
- **Prerequisites:** `PROMPT-D02`, `docs/Design_System.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Build the Main Website consumer application in `apps/web`.

Tasks:
1. Initialize Next.js 14 App Router in `apps/web` with responsive consumer styling and Google Fonts (Inter / Plus Jakarta Sans).
2. Build Header: City selector dropdown, search input, "Active Groups" badge, and Login CTA.
3. Build Homepage:
   - Hero banner with natural language search bar ("Find your ideal car").
   - Brand logo carousel (Tata, Hyundai, Maruti, Mahindra, Kia).
   - Featured segments: "Top Bharat NCAP 5-Star Cars", "Best Mileage Hybrids", "Trending Buyer Groups".
4. Build Explore & Filter Page (`/cars`):
   - Multi-faceted filter sidebar: Budget slider (₹5L - ₹50L), Body Type, Fuel Type, Transmission, Safety Stars.
   - Responsive vehicle grid displaying vehicle cards with prices, specs, and "Compare" toggle.

Restrictions:
- Filter changes must update URL query parameters for shareable search states.
- Client-side navigation must be instant ($< 150\text{ ms}$).

Testing:
- Run `pnpm dev --filter web` and test filtering cars by "SUV" and "Diesel".
```
- **Files Expected to Change:** `apps/web/src/app/*`, `apps/web/src/components/*`.
- **Acceptance Criteria:** Clean, responsive car marketplace matching Section 6.1 of `docs/Design_System.md`.

---

### PROMPT-G02: Vehicle Detail Page (VDP) & Variant Switcher
- **Objective:** Implement comprehensive Vehicle Detail Pages with specifications accordion and on-road calculator.
- **Prerequisites:** `PROMPT-G01`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Vehicle Detail Page (VDP) in `apps/web/src/app/cars/[slug]/page.tsx`.

Tasks:
1. VDP Header: Brand logo, Model name, Variant selector dropdown, and dynamic Ex-Showroom / Indicative On-Road price toggle.
2. Photo Gallery: High-resolution image carousel with thumbnail navigation and fallback placeholder.
3. Quick Specs Pill Bar: Engine CC, Power (BHP), Torque (Nm), Mileage (km/l), Boot Space (Litres), NCAP Stars.
4. Active Group Banner: Highlight if an active collective purchasing group exists for this model in user's city.
5. Detailed Specifications Accordion: Categorized display of Engine, Dimensions, Safety, and Infotainment equipment.
6. Indicative On-Road Price Calculator: Interactive widget breaking down estimated RTO tax, Insurance, and FASTag by state.

Restrictions:
- Clearly display disclaimer: *"On-road price is indicative. Actual price determined by dealer quotation."*

Testing:
- Verify variant switcher dynamically updates power, torque, and price figures without full page reload.
```
- **Files Expected to Change:** `apps/web/src/app/cars/[slug]/*`, `apps/web/src/components/vdp/*`.
- **Acceptance Criteria:** VDP renders all technical specifications accurately for active variants.

---

### PROMPT-G03: Deterministic Smart Vehicle Comparison Matrix
- **Objective:** Implement side-by-side 2-to-4 car comparison with deterministic difference computation.
- **Prerequisites:** `PROMPT-G02`, `docs/PRD.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Smart Vehicle Comparison Engine in backend and Main Website frontend.

Tasks:
1. Backend (`src/modules/comparisons`):
   - Implement `POST /api/v1/comparisons/matrix`: Takes array of 2 to 4 variant UUIDs. Computes deterministic mathematical and boolean deltas across all specifications and equipment.
2. Frontend (`apps/web/src/app/compare/page.tsx`):
   - Side-by-side comparison table for up to 4 cars.
   - Sticky header showing vehicle photo, trim name, and price as user scrolls.
   - "Show Differences Only" toggle: Filters out identical attributes.
   - Highlight best-in-class metrics (highest BHP in green, lowest price in green).

Restrictions:
- Pure deterministic calculation on backend. Zero external LLM calls for this baseline comparison.

Testing:
- Compare Tata Nexon Creative vs Tata Nexon Fearless and verify features like ventilated seats are flagged as different.
```
- **Files Expected to Change:** `apps/backend/src/modules/comparisons/*`, `apps/web/src/app/compare/*`.
- **Acceptance Criteria:** Comparison table renders accurately in $< 150\text{ ms}$.

---

## GROUP H – Group Purchasing Engine

### PROMPT-H01: Group Purchasing Backend State Machine & Concurrency
- **Objective:** Implement database models, lifecycle state machine, and concurrency locks for collective buying.
- **Prerequisites:** `PROMPT-G01`, `PROMPT-E01`, `docs/Database_Design.md`, `docs/PRD.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Group Purchasing engine backend in `apps/backend/src/modules/groups`.

Tasks:
1. Implement models in `models.py`:
   - `groups`: Model_id, city, state, rto_circle, status (`FORMING`, `OPEN_FOR_QUOTES`, `QUOTATION_REVIEW`, `LOCKED`, `COMPLETED`, `EXPIRED`), min_members (3), max_capacity (15), current_members_count, quoting_deadline, expiry_at.
   - `group_members`: Group_id (FK), user_id (FK), selected_variant_id (FK), selected_colour_id (FK), membership_status. Unique constraint on `(group_id, user_id)`.
2. Implement `POST /api/v1/groups`: Customer creates group.
3. Implement `POST /api/v1/groups/{id}/join`:
   - Atomically lock group row (`SELECT FOR UPDATE`).
   - Validate customer city matches group RTO circle.
   - Validate `current_members_count < max_capacity`.
   - Increment count, insert member record.
   - If count >= min_members, transition status to `OPEN_FOR_QUOTES` and set 72h quoting deadline.
4. Implement `GET /api/v1/groups` with filtering by city and model.

Restrictions:
- Race conditions during concurrent joins must be prevented using PostgreSQL row-level locks.

Testing:
- Write Pytest concurrency test simulating parallel requests attempting to join a nearly-full group.
```
- **Files Expected to Change:** `apps/backend/src/modules/groups/*`, `alembic/versions/*`.
- **Acceptance Criteria:** Group capacity is strictly enforced under concurrent load; lifecycle transitions correctly.

---

### PROMPT-H02: Group Purchasing Frontend Portal & Joining Flow
- **Objective:** Build the public group discovery feed, group detail page, and join modal on the Main Website.
- **Prerequisites:** `PROMPT-H01`, `docs/Design_System.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Build the Group Purchasing user interfaces in `apps/web/src/app/groups`.

Tasks:
1. Group Discovery Feed (`/groups`):
   - Filter active groups by City and Brand.
   - Display Group Cards with progress meter ("7/10 Members"), potential savings banner, and countdown clock.
2. Group Detail Page (`/groups/[id]`):
   - Group status badge, target vehicle model showcase, and list of joined variants (anonymized member tags).
   - "Join This Group" prominent CTA button.
3. Group Join Flow Modal:
   - Step 1: City & Pin Code verification (must match group RTO circle).
   - Step 2: Variant & Colour selection dropdowns.
   - Step 3: Mobile OTP verification.
   - Step 4: Digital intent confirmation and success celebration screen with WhatsApp share invite link.

Restrictions:
- Customer contact info must remain private and unmasked.

Testing:
- Walk through joining an active group on local web app; verify membership is reflected in database.
```
- **Files Expected to Change:** `apps/web/src/app/groups/*`, `apps/web/src/components/groups/*`.
- **Acceptance Criteria:** Customer can discover and join an active group seamlessly in 3 clicks.

---

## GROUP I – Dealer Quotations & Purchase Intelligence

### PROMPT-I01: DealerOS Demand Radar & Itemized Quotation Builder
- **Objective:** Build the demand radar and reverse quotation builder inside DealerOS.
- **Prerequisites:** `PROMPT-H01`, `PROMPT-E02`, `docs/PRD.md`, `docs/API_Specification.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Regional Demand Radar and Quotation Engine in DealerOS.

Tasks:
1. Demand Radar (`apps/dealer/src/app/(dashboard)/demand`):
   - Table and map view of active groups in the dealership's authorized territory in `OPEN_FOR_QUOTES` status.
   - Displays aggregated volume, variant breakdown, and countdown to bidding deadline.
2. Quotation Builder Dialog:
   - Dealership inputs itemized pricing: Ex-Showroom, RTO Road Tax, Insurance, FASTag, Accessories package, Extended Warranty, and Net Group Discount.
   - Client-side auto-calculation of final on-road price.
   - Enforce mandatory validation blocking non-statutory logistics/handling fees.
3. Backend integration (`src/modules/quotations`):
   - `POST /api/v1/groups/{group_id}/quotations`: Validates line items mathematically and stores binding quote in `quotations` and `quotation_items` tables.

Restrictions:
- Dealer quotes are legally binding for 14 calendar days upon submission.

Testing:
- Submit an itemized quote from DealerOS; verify mathematical validation passes and quote is stored.
```
- **Files Expected to Change:** `apps/dealer/src/app/(dashboard)/demand/*`, `apps/backend/src/modules/quotations/*`.
- **Acceptance Criteria:** Dealer can view regional buyer pools and submit itemized quotations.

---

### PROMPT-I02: Customer Quotation Comparison & Deal Lock Workflow
- **Objective:** Build customer quotation comparison view and booking voucher generation.
- **Prerequisites:** `PROMPT-I01`, `docs/PRD.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement Customer Quotation Comparison and Deal Locking in Main Website and backend.

Tasks:
1. Customer Quotation Matrix (`apps/web/src/app/groups/[id]/quotes`):
   - Side-by-side card comparison of quotes submitted by competing authorized dealerships.
   - Highlight transparent breakdowns: Ex-showroom, RTO, Insurance, and Group Discount.
   - Highlight delivery timeline commitment and dealer customer rating.
2. Deal Acceptance Flow:
   - Group member clicks "Accept Offer & Lock Deal".
   - Backend `POST /api/v1/quotations/{id}/accept`: Updates status, generates tamper-proof `PurchaseRecord` with unique `booking_voucher_code` (e.g., "GD-BKG-2026-987654").
   - Customer Lead Unmasking: Customer contact details are unmasked strictly to the winning dealership in DealerOS.
3. Booking Voucher Screen: Downloadable / printable voucher with unique QR/code and dealership showroom address.

Restrictions:
- Customer phone number is never unmasked to losing dealerships.

Testing:
- Accept a quote as customer; verify booking record is created and dealer can now view customer contact in DealerOS.
```
- **Files Expected to Change:** `apps/web/src/app/groups/[id]/quotes/*`, `apps/backend/src/modules/quotations/*`.
- **Acceptance Criteria:** Deal locking generates a valid voucher and safely unmasks customer lead to winning dealer.

---

## GROUP J – Advanced AI, Quality & Deployment

### PROMPT-J01: Google Gemini AI Comparison Explainer & Matchmaker
- **Objective:** Integrate Google Gemini API for natural-language comparison narratives and lifestyle vehicle recommendations.
- **Prerequisites:** `PROMPT-G03`, `docs/PRD.md`, `docs/Architecture.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the Google Gemini AI integration in `apps/backend/src/modules/ai`.

Tasks:
1. Configure Google Gemini SDK using `GEMINI_API_KEY` with model `gemini-1.5-flash`.
2. Implement `POST /api/v1/ai/explain-comparison`:
   - Takes deterministic spec diff JSON payload of 2 compared cars.
   - Constructs strict prompt instructing Gemini to explain trade-offs without inventing facts.
   - Sets temperature to 0.3; returns concise, empathetic 3-paragraph verdict.
3. Implement `POST /api/v1/recommendations/matchmaker`:
   - Takes user lifestyle questionnaire (Budget, Commute, Family Size, Priorities).
   - Executes deterministic SQL query extracting top 3 matching vehicles.
   - Uses Gemini to synthesize personalized recommendation summary.
4. Implement graceful fallback: If Gemini API fails or times out, return pure deterministic data without throwing errors.

Restrictions:
- Gemini must never extrapolate specs or prices not present in the supplied JSON payload.

Testing:
- Execute test calling comparison explainer; verify narrative accurately reflects vehicle horsepower and boot capacity.
```
- **Files Expected to Change:** `apps/backend/src/modules/ai/*`, `apps/backend/src/modules/recommendations/*`.
- **Acceptance Criteria:** Gemini provides insightful summaries with zero hallucinated specifications.

---

### PROMPT-J02: Interactive 360-Degree Image Sequence Viewer
- **Objective:** Implement responsive 36-frame exterior spin viewer with touch and mouse drag controls.
- **Prerequisites:** `PROMPT-G02`, `docs/Design_System.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Implement the 360-Degree Vehicle Spin Viewer component in `packages/ui` and embed on VDP.

Tasks:
1. Build `Spin360Viewer` component:
   - Accepts array of 36 frame image URLs representing 10-degree rotation increments.
   - Supports smooth mouse drag on desktop and touch swipe gestures on mobile.
   - Progressive loading: Displays low-res blurhash or frame 0 immediately while preloading remaining frames in background.
   - Controls: Auto-spin toggle, manual scrub slider, fullscreen modal view, and zoom toggle.
   - Colour switcher: Changes frame sequence URL set when customer selects a different body paint swatch.
2. Embed component on Main Website Vehicle Detail Page (`apps/web/src/app/cars/[slug]`).

Restrictions:
- Must maintain 60fps interaction on mobile viewports. If 360 assets are missing, fall back cleanly to standard photo gallery.

Testing:
- Test 360 rotation on Chrome mobile emulation mode; verify smooth dragging and correct frame sequencing.
```
- **Files Expected to Change:** `packages/ui/src/components/spin-360-viewer.tsx`, `apps/web/src/components/vdp/*`.
- **Acceptance Criteria:** Smooth 360-degree rotation with zero layout jank or memory leaks.

---

### PROMPT-J03: End-to-End Testing & CI/CD Pipeline
- **Objective:** Configure Playwright E2E test suites and GitHub Actions CI/CD deployment pipelines.
- **Prerequisites:** All previous prompts, `docs/Testing_Strategy.md`, `docs/Deployment.md`.
- **Exact Copy-Paste Prompt:**
```markdown
Configure the automated CI/CD pipeline and Playwright E2E test suite.

Tasks:
1. Playwright Setup (`apps/e2e`):
   - Test Flow 1: Customer discovers car, filters by budget, inspects VDP, and creates a collective purchasing group.
   - Test Flow 2: Dealer logs in to DealerOS, inspects regional demand radar, and submits an itemized quotation.
   - Test Flow 3: Customer reviews competing quotations, accepts winning offer, and verifies booking voucher generation.
2. GitHub Actions (`.github/workflows/ci.yml`):
   - Job 1: Lint & Typecheck (`turbo lint check-types`).
   - Job 2: Backend Unit & Integration Tests with ephemeral PostgreSQL and Redis service containers.
   - Job 3: Frontend Vitest test suites.
   - Job 4: Build Docker images for `apps/web`, `apps/dealer`, `apps/admin`, and `apps/backend`.
   - Job 5: Run Playwright E2E tests against local test server.

Restrictions:
- PR merges blocked if any test fails or statement coverage is $< 85\%$.

Testing:
- Run `pnpm test:e2e` locally and verify complete user journey executes green.
```
- **Files Expected to Change:** `.github/workflows/ci.yml`, `apps/e2e/*`, `playwright.config.ts`.
- **Acceptance Criteria:** Full automated test suite passes; Docker images build successfully.

