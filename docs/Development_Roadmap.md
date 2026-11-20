# GroupDrive – Product Development Roadmap

**Document Version:** 1.0.0  
**Status:** Approved Implementation Schedule  
**Classification:** Confidential & Proprietary – GroupDrive Technologies  
**Target Architecture:** Monorepo (3 Frontends + 1 Backend Modular Monolith)  
**Execution Strategy:** Shared Infrastructure First -> DealerOS Second -> Admin Panel Third -> Main Website Fourth -> Group Buying & AI Intelligence  
**Date:** November 2026  

---

## 1. Master Development Roadmap Schedule

```mermaid
gantt
    title GroupDrive Engineering Timeline (13 Phases)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %Y

    section Foundation & Core
    Phase 1: Docs & Architecture Baseline         :done, p1, 2026-11-01, 2026-11-08
    Phase 2: Monorepo & Infrastructure Setup     :active, p2, 2026-11-09, 2026-11-22
    Phase 3: Shared Backend & Unified Auth       :p3, 2026-11-23, 2026-12-07
    Phase 4: Master Catalogue & Dealer Foundation:p4, 2026-12-08, 2026-12-22

    section Enterprise Applications
    Phase 5: DealerOS MVP                        :p5, 2026-12-23, 2027-01-14
    Phase 6: Admin Panel MVP                     :p6, 2027-01-15, 2027-01-29

    section Consumer Platform
    Phase 7: Main Website MVP                    :p7, 2027-01-30, 2027-02-20
    Phase 8: Group Purchasing Engine Integration :p8, 2027-02-21, 2027-03-14

    section Commercial & Intelligence
    Phase 9: Dealer Quotes & Booking Workflow    :p9, 2027-03-15, 2027-04-04
    Phase 10: AI Recommendations & Gemini Intel  :p10, 2027-04-05, 2027-04-18
    Phase 11: 360-Degree Interactive Viewer      :p11, 2027-04-19, 2027-05-02
    Phase 12: Advanced Analytics & Demand Radar  :p12, 2027-05-03, 2027-05-16

    section Launch Hardening
    Phase 13: Security Hardening, QA & Launch   :p13, 2027-05-17, 2027-06-07
```

---

## 2. Phase-by-Phase Implementation Specifications

### PHASE 1 – Documentation and Architecture (Current)
- **Objectives:** Establish the authoritative architectural, technical, functional, and product documentation baseline.
- **Dependencies:** None.
- **Deliverables:** Complete `docs/` suite (PRD, Architecture, Database, APIs, RBAC, Design System, Roadmap, Testing, Deployment, Prompts Library, Traceability Matrix).
- **Completion Gate:** 100% cross-document consistency audit signed off.

---

### PHASE 2 – Repository and Infrastructure Foundation
- **Objectives:** Scaffold the Turborepo monorepo, Docker Compose local environment, Next.js shells, and FastAPI backend foundation.
- **Modules & Scope:**
  - Root `package.json`, `turbo.json`, `pnpm-workspace.yaml`.
  - Shared packages: `packages/ui`, `packages/types`, `packages/config`, `packages/utils`.
  - Frontend shells: `apps/web`, `apps/dealer`, `apps/admin` (Next.js 14, Tailwind, shadcn).
  - Backend shell: `apps/backend` (Python 3.11+, FastAPI, Poetry/Uv, Pydantic v2).
  - Local Docker Compose orchestrating PostgreSQL 16, Redis 7, MinIO object store.
- **Testing Requirements:** Linting checks pass; Docker Compose boots all services cleanly in $< 60\text{ seconds}$.
- **Exit Gate:** `turbo build` executes across all packages with zero TypeScript or build errors.

---

### PHASE 3 – Shared Backend and Unified Authentication
- **Objectives:** Build core PostgreSQL database models, Alembic migrations, and the shared JWT/OTP authentication engine.
- **Modules & Scope:**
  - Core SQLAlchemy models for `users`, `roles`, `permissions`, `user_sessions`.
  - SMS OTP engine (Twilio/Gupshup integration with mock provider for local development).
  - Password hashing (Argon2id) and JWT minting/verification with refresh token rotation.
  - Multi-tenant and RBAC middleware guards (`@require_roles`, `@tenant_scoped`).
- **Dependencies:** Phase 2.
- **Deliverables:** `/api/v1/auth/*` endpoints and `/api/v1/users/me`.
- **Exit Gate:** 100% test coverage for OTP issuance, token expiry, refresh token rotation, and invalid signature rejections.

---

### PHASE 4 – Central Vehicle Catalogue and Dealer Foundation
- **Objectives:** Implement the master vehicle catalogue domain and dealership legal entity hierarchy.
- **Modules & Scope:**
  - Master Catalogue models: `brands`, `vehicle_models`, `vehicle_variants`, `vehicle_specifications`, `vehicle_features`, `vehicle_colours`, `vehicle_pricing`.
  - Dealership models: `dealers`, `dealer_documents`, `dealer_branches`, `dealer_staff`.
  - Seed script generating complete Indian vehicle data for top 5 brands (Tata, Hyundai, Maruti Suzuki, Mahindra, Kia).
- **Dependencies:** Phase 3.
- **Deliverables:** Catalogue read/write APIs, dealer registration endpoints.
- **Exit Gate:** Catalogue CRUD operations succeed for Admins; dealers attempting to mutate master catalogue receive `403 Forbidden`.

---

### PHASE 5 – DealerOS MVP
- **Objectives:** Build the complete functional DealerOS application for authorized automotive dealerships.
- **Modules & Scope:**
  - Dealership onboarding wizard: Legal entity submission, GSTIN capture, document uploads.
  - Branch & Staff management: Multi-showroom setup, role assignments (`BRANCH_MANAGER`, `SALES_EXECUTIVE`).
  - Branch Inventory: VIN tracking, stock serial logging, aging days tracker, yard location tags.
  - Regional Demand Radar (Read-only view of aggregated buyer pools).
  - Itemized Quotation Generator interface.
- **Dependencies:** Phase 4.
- **Deliverables:** Functional web application at `dealer.groupdrive.in`.
- **Exit Gate:** Dealership owner can register, invite branch managers, add yard inventory, and view regional demand.

---

### PHASE 6 – Admin Panel MVP
- **Objectives:** Build the central platform governance console for GroupDrive administrators.
- **Modules & Scope:**
  - Admin MFA authentication and IP restrictions.
  - Dealer Verification Workstation: Inspect uploaded GSTIN and OEM franchise proof documents with approve/reject workflow.
  - Master Catalogue Editor: Web interface for adding/editing brands, models, trims, variants, and specs.
  - Platform audit log explorer and system health dashboards.
- **Dependencies:** Phase 5.
- **Deliverables:** Functional web application at `admin.groupdrive.in`.
- **Exit Gate:** Verification Admin can approve pending dealership KYC, automatically activating DealerOS quoting rights.

---

### PHASE 7 – Main Website MVP
- **Objectives:** Build the public-facing customer automotive marketplace.
- **Modules & Scope:**
  - Modern homepage with hero search, brand showcase, and popular carousels.
  - Dynamic Vehicle Discovery: Multi-faceted filtering (Budget, Fuel, Transmission, Body Type, Seating).
  - Vehicle Detail Page (VDP): High-res gallery, technical specifications accordion, indicative on-road price calculator.
  - Deterministic 2-to-4 car comparison matrix with "Show Differences Only" toggle.
  - Customer account management, mobile OTP login, and vehicle Wishlists.
- **Dependencies:** Phase 4, Phase 6.
- **Deliverables:** Functional consumer web application at `groupdrive.in`.
- **Exit Gate:** Customer can search cars, filter by budget, inspect full specs, and compare 3 cars in $< 150\text{ ms}$.

---

### PHASE 8 – Group Purchasing Engine Integration
- **Objectives:** Implement the core collective purchasing workflow bridging customers and dealerships.
- **Modules & Scope:**
  - Group creation wizard: Model selection, city/RTO jurisdiction, timeline, member capacity.
  - Group joining workflow: City proximity validation, variant selection, phone OTP commitment.
  - Group lifecycle state machine (`FORMING` -> `OPEN_FOR_QUOTES` -> `QUOTATION_REVIEW` -> `LOCKED` -> `COMPLETED`).
  - Atomic concurrency protection using PostgreSQL `SELECT FOR UPDATE` on group capacity.
  - Multi-channel notification alerts (SMS & WhatsApp updates on group milestones).
- **Dependencies:** Phase 5, Phase 7.
- **Exit Gate:** Group auto-transitions to `OPEN_FOR_QUOTES` when minimum member threshold (3 buyers) is met.

---

### PHASE 9 – Dealer Quotations and Customer Purchase Workflow
- **Objectives:** Enable competitive reverse bidding and binding quotation generation.
- **Modules & Scope:**
  - DealerOS Quotation Builder: Enforces mandatory line-item breakdown (Ex-showroom, RTO, Insurance, FASTag, Accessories, Net Group Discount).
  - Customer Quotation Matrix: Side-by-side comparison of dealer offers with transparency flags.
  - Deal Acceptance & Locking: Customer votes to accept quote; system generates tamper-proof `PurchaseRecord` and booking voucher.
  - Lead Unmasking: Customer contact info is unmasked to winning dealer for delivery fulfillment.
- **Dependencies:** Phase 8.
- **Exit Gate:** Dealer submits valid itemized quote; customer accepts; booking voucher is generated with unique hash.

---

### PHASE 10 – AI Recommendation and Comparison Intelligence
- **Objectives:** Deploy Google Gemini-powered purchase intelligence and quotation document OCR.
- **Modules & Scope:**
  - Gemini Comparison Explainer: Synthesizes contextual prose explaining trade-offs between compared vehicles using structured JSON data.
  - Personalized Vehicle Matchmaker: Questionnaire-driven recommendation algorithm outputting lifestyle compatibility scores.
  - AI Quotation OCR Parser: Multimodal Gemini pipeline extracting line items from uploaded physical dealer price sheets to identify hidden charges.
- **Dependencies:** Phase 7, Phase 9.
- **Exit Gate:** Gemini generates accurate comparison narratives strictly matching JSON specs with zero hallucinated features.

---

### PHASE 11 – 360-Degree Interactive Vehicle Experience
- **Objectives:** Implement orbital exterior spin and interior 360° vehicle visualization.
- **Modules & Scope:**
  - Progressive 36-frame exterior spin viewer with touch drag, mouse rotation, and zoom.
  - Colour switcher dynamically loading frame sets for different paint codes.
  - Feature hotspot overlays (ADAS sensors, LED headlamps, sunroof).
  - Three.js / React Three Fiber interior panoramic spherical viewer container.
- **Dependencies:** Phase 7.
- **Exit Gate:** 360° viewer renders 60fps on mobile Safari/Chrome with progressive low-res placeholder loading.

---

### PHASE 12 – Advanced Analytics and Demand Radar
- **Objectives:** Deliver predictive dealership demand heatmaps and executive benchmarking.
- **Modules & Scope:**
  - DealerOS Demand Heatmap: Visualizes unattached buyer searches and group volume trends by district.
  - Dealership Performance Metrics: Win rate per model, average discount vs. regional velocity, days-to-quote SLA.
  - Admin Platform Financials: Platform commission tracking, subscription billing cycles, GST tax invoicing.
- **Dependencies:** Phase 9.
- **Exit Gate:** DealerOS displays real-time active buyer demand density across authorized RTO circles.

---

### PHASE 13 – Security Hardening, QA and Production Launch
- **Objectives:** Rigorous end-to-end verification, security penetration testing, and production cloud launch.
- **Modules & Scope:**
  - OWASP Top 10 security audit, dependency CVE scans, and rate limiting validation.
  - End-to-end Playwright test suite covering complete customer and dealer journeys.
  - Load testing (Locust / k6) verifying 2,000 concurrent active users at $< 200\text{ ms}$ latency.
  - CI/CD deployment pipelines on GitHub Actions to production Kubernetes / ECS clusters.
- **Dependencies:** Phases 1 through 12.
- **Exit Gate:** Zero open P0/P1 security defects; all quality gates pass; successful launch of `groupdrive.in`, `dealer.groupdrive.in`, and `admin.groupdrive.in`.

