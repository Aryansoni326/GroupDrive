# GROUPDRIVE - Automotive Technology Ecosystem

> **Discover. Compare. Group. Negotiate. Drive.**

[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#system-architecture)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014%20%7C%20TypeScript%20%7C%20Tailwind-black.svg)](#technology-stack)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20SQLAlchemy%20%7C%20Pydantic-green.svg)](#technology-stack)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%7C%20Alembic-336791.svg)](#technology-stack)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini%20API-orange.svg)](#ai-capabilities)
[![Target Market](https://img.shields.io/badge/Market-India%20%F0%9F%87%AE%F0%9F%87%B3-red.svg)](#target-market)

---

## 1. Product Overview

**GroupDrive** is a production-grade automotive technology and commerce platform engineered to transform new passenger vehicle discovery, evaluation, and purchasing in India.

By bridging the structural divide between fragmented retail car buyers and authorized automobile dealerships, GroupDrive eliminates opaque pricing, dealer markups, and exhausting showroom haggling. Through **Collective Purchasing (Group Buying)**, buyers pool demand across regional RTO jurisdictions to unlock volume commercial pricing. Dealerships simultaneously leverage **DealerOS SaaS** to tap high-intent, verified buyer pools, optimize yard inventory, and submit legally binding itemized quotations without brand devaluation.

---

## 2. The Three Applications Architecture

GroupDrive operates as a cohesive **Three-Application Ecosystem** sharing a centralized backend, unified authentication, PostgreSQL database, and master vehicle catalogue:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHARED CORE INFRASTRUCTURE                      │
│      FastAPI Modular Monolith | PostgreSQL 16 | Redis 7 | Celery       │
│                  Unified JWT Auth & Role-Based Access                  │
└───────────────▲───────────────────────▲────────────────────────▲───────┘
                │                       │                        │
       ┌────────┴────────┐     ┌────────┴────────┐      ┌────────┴────────┐
       │  Main Website   │     │    DealerOS     │      │   Admin Panel   │
       │  groupdrive.in  │     │dealer.groupdrive│      │admin.groupdrive │
       ├─────────────────┤     ├─────────────────┤      ├─────────────────┤
       │ • Car Discovery │     │ • Dealer Onboard│      │ • Master Specs  │
       │ • 360 Spin View │     │ • Branch Setup  │      │ • Dealer KYC    │
       │ • 2-4 Car Diff  │     │ • Yard Inventory│      │ • Audit Trails  │
       │ • Group Buying  │     │ • Demand Radar  │      │ • Group Monitor │
       │ • Quote Compare │     │ • Quote Builder │      │ • System Health │
       └─────────────────┘     └─────────────────┘      └─────────────────┘
```

1. **Main Website (`groupdrive.in`):** Customer-facing marketplace offering multi-faceted vehicle search, deterministic comparisons, lifestyle matchmaker, 360° orbital exploration, and group purchasing.
2. **DealerOS (`dealer.groupdrive.in`):** Dealership SaaS enabling dealership principals, branch managers, and sales executives to monitor regional demand heatmaps, manage yard inventory, and submit itemized reverse bids.
3. **Admin Panel (`admin.groupdrive.in`):** Central governance workstation maintaining the immutable master vehicle catalogue, approving dealer KYC applications, auditing quotations, and monitoring platform integrity.

---

## 3. Technology Stack

| Domain | Technology / Library | Architectural Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | Server-side rendering (SSR) for vehicle SEO; dynamic client interactivity. |
| **Language** | **TypeScript 5+** | End-to-end type safety shared between frontend and backend DTOs. |
| **UI Components** | **Tailwind CSS + shadcn/ui** | Unstyled, accessible Radix UI primitives with shared design tokens. |
| **Backend Core** | **Python 3.11+ / FastAPI** | High-throughput asynchronous modular monolith with Pydantic v2 validation. |
| **ORM & Database** | **PostgreSQL 16 + SQLAlchemy 2.0** | Normalized relational data model with asyncpg driver and Alembic migrations. |
| **Caching & Queues** | **Redis 7 + Celery** | Caching master vehicle specs; asynchronous quotation and notification workers. |
| **AI Engine** | **Google Gemini 1.5 Pro / Flash** | Natural-language comparison explanations, buyer matching, and quotation OCR. |
| **Visualization** | **360° Image Sequence + Three.js** | Interactive 36-frame exterior orbital rotation and interior panoramas. |
| **Storage & CDN** | **Cloudflare R2 / AWS S3 + CDN** | High-speed edge delivery of vehicle media; secure private bucket for KYC. |
| **Testing** | **Pytest, Vitest, Playwright, k6** | Shift-left testing pyramid: unit, integration, multi-tenant isolation, and E2E. |

---

## 4. Master Product Documentation Suite

The complete engineering, product, architectural, and operational documentation is organized inside the [`docs/`](./docs/) directory:

| Document | Title | Scope & Description |
|---|---|---|
| [**01. PRD.md**](./docs/PRD.md) | **Product Requirements Document** | Complete 45-section master PRD: Personas, pain points, functional requirements for all 3 apps, group lifecycle, business model, NFRs, and acceptance criteria. |
| [**02. Architecture.md**](./docs/Architecture.md) | **System Architecture Document** | Modular Monolith design, monorepo layout, clean architecture layers, data flows, AI guardrails, security, and Mermaid diagrams. |
| [**03. Database_Design.md**](./docs/Database_Design.md) | **Database Design & Architecture** | 33 normalized PostgreSQL tables, complete data types, foreign keys, compound indexes, ERDs, multi-tenant isolation, and Alembic migrations. |
| [**04. API_Specification.md**](./docs/API_Specification.md) | **Backend REST API Specification** | Contracts across 26 modules (`/api/v1/`), Pydantic request/response schemas, query parameters, validation rules, and RFC 7807 error codes. |
| [**05. Role_Permission_Matrix.md**](./docs/Role_Permission_Matrix.md) | **Identity, Roles & Permissions** | 12 core roles, unified authentication, mobile OTP, JWT claims, cross-subdomain sessions, tenant segregation, and permissions matrix. |
| [**06. Design_System.md**](./docs/Design_System.md) | **Product Design System** | Brand identity, color tokens, typography scale, 4px spacing, shadcn primitives, automotive cards, and distinct guidelines for Web, DealerOS, and Admin. |
| [**07. Development_Roadmap.md**](./docs/Development_Roadmap.md) | **Product Development Roadmap** | 13 sequential implementation phases (Foundation -> DealerOS -> Admin -> Web -> Groups -> AI -> Launch) with dependencies and exit gates. |
| [**08. Testing_Strategy.md**](./docs/Testing_Strategy.md) | **Quality Assurance & Testing** | Unit, API integration, multi-tenant isolation, Playwright E2E flows, load testing benchmarks (k6), and Definition of Done. |
| [**09. Deployment.md**](./docs/Deployment.md) | **Infrastructure & Deployment** | Cost-conscious deployment strategy ($120/mo), Docker configurations, CI/CD GitHub Actions, environment variables, and zero-downtime migrations. |
| [**10. Requirements_Traceability_Matrix.md**](./docs/Requirements_Traceability_Matrix.md) | **Requirements Traceability Matrix** | Bidirectional mapping from source requirements to PRD, Architecture, Database, APIs, Apps, Phases, and Acceptance Criteria. |
| [**11. Open_Decisions.md**](./docs/Open_Decisions.md) | **Open Technical & Business Decisions** | Unresolved decisions, trade-offs, and items requiring founder review (Earnest deposits, RTO API integration, dealer default penalties). |

---

## 5. Implementation Sequence & Next Milestone

GroupDrive follows a strict dependency-aware engineering sequence:

```
[Phase 1: Master Documentation & Architecture]  ◄── COMPLETED
                      │
                      ▼
[Phase 2: Monorepo & Infrastructure Foundation] ◄── RECOMMENDED NEXT MILESTONE
                      │
                      ▼
[Phase 3: Shared Backend & Unified Authentication]
                      │
                      ▼
[Phase 4: Central Vehicle Catalogue & Dealer Foundation]
                      │
                      ▼
[Phase 5: DealerOS MVP] ──► [Phase 6: Admin Panel MVP] ──► [Phase 7: Main Website MVP]
```


