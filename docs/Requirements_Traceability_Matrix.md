# GroupDrive – Requirements Traceability Matrix (RTM)

**Document Version:** 1.0.0  
**Status:** Approved Traceability Baseline  
**Classification:** Confidential & Proprietary – GroupDrive Technologies  
**Target Market:** India  
**Date:** November 2026  

---

## 1. Traceability Architecture & Coverage Summary

The Requirements Traceability Matrix (RTM) establishes bidirectional traceability between high-level business goals, functional PRD specifications, system architecture modules, relational database entities, REST API contracts, presentation applications, development phases, and quality assurance acceptance criteria.

```
[Business Requirement] ◄──► [PRD Feature] ◄──► [Architecture Module]
          ▲                                            │
          │                                            ▼
[QA Test / Acceptance] ◄──► [Application] ◄──► [Database & API Contract]
```

---

## 2. Master Requirements Traceability Table

| Req ID | Requirement Name & Scope | PRD Section | Architecture Module | Database Entities | API Endpoints | Application | Dev Phase | Acceptance Criteria ID |
|---|---|---|---|---|---|---|---|---|
| **REQ-01** | **Unified Multi-App Authentication & Sessions** | Sec 32, 33 | `modules/auth`, Identity Svc | `users`, `user_profiles`, `roles`, `user_sessions` | `POST /auth/request-otp`<br>`POST /auth/verify-otp`<br>`POST /auth/refresh` | Web, Dealer, Admin | Phase 3 | `AC-AUTH-01`<br>`TC-AUTH-01` |
| **REQ-02** | **Central Master Vehicle Catalogue** | Sec 16, 34 | `modules/catalogue`, Admin Core | `brands`, `vehicle_models`, `vehicle_variants`, `vehicle_specifications`, `vehicle_pricing` | `GET /catalogue/models`<br>`GET /catalogue/variants/{id}`<br>`POST /catalogue/variants` | Admin Panel (Write)<br>Web (Read) | Phase 4 | `AC-CAT-01`<br>`AC-CAT-02` |
| **REQ-03** | **Dealership Onboarding & KYC Verification** | Sec 13, 34 | `modules/dealers`, Admin Core | `dealers`, `dealer_documents`, `dealer_branches`, `dealer_staff` | `POST /dealers/register`<br>`POST /dealers/me/documents`<br>`POST /admin/dealers/{id}/verify` | DealerOS, Admin Panel | Phase 5, 6 | `AC-DLR-01`<br>`TC-TENANT-01` |
| **REQ-04** | **Branch Yard Inventory Management** | Sec 13 | `modules/inventory` | `inventory`, `vehicle_variants`, `vehicle_colours` | `GET /inventory`<br>`POST /inventory`<br>`PATCH /inventory/{id}/status` | DealerOS | Phase 5 | `AC-INV-01`<br>`TC-TENANT-01` |
| **REQ-05** | **Multi-Faceted Vehicle Discovery & Filtering** | Sec 17, 18 | `modules/catalogue`, Redis | `vehicle_models`, `vehicle_variants`, `vehicle_pricing` | `GET /catalogue/models?body_type=&fuel_type=` | Main Website | Phase 7 | `AC-DISC-01` |
| **REQ-06** | **Vehicle Detail Page (VDP) & Indicative On-Road** | Sec 19, 30 | `modules/catalogue`, Finance | `vehicle_variants`, `vehicle_specifications`, `vehicle_media` | `GET /catalogue/models/{slug}`<br>`POST /finance/calculate-emi` | Main Website | Phase 7 | `AC-VDP-01` |
| **REQ-07** | **Deterministic Multi-Car Comparison** | Sec 21, 22 | `modules/comparisons` | `vehicle_variants`, `vehicle_specifications`, `vehicle_features` | `POST /comparisons/matrix`<br>`POST /comparisons/scored` | Main Website | Phase 7 | `AC-COMP-01`<br>`TC-COMP-01` |
| **REQ-08** | **Interactive 360-Degree Orbital Spin** | Sec 20 | `modules/catalogue`, S3/CDN | `vehicle_media` (type: `SPIN_360_FRAME_SEQUENCE`) | `GET /catalogue/models/{id}/360-spin` | Main Website | Phase 11 | `AC-360-01` |
| **REQ-09** | **Collective Purchasing Group Creation & Joining** | Sec 24, 25 | `modules/groups`, State Machine | `groups`, `group_members`, `vehicle_models` | `POST /groups`<br>`POST /groups/{id}/join`<br>`GET /groups` | Main Website | Phase 8 | `AC-GRP-01`<br>`TC-GRP-03` |
| **REQ-10** | **Regional Buyer Demand Radar for Dealers** | Sec 27 | `modules/groups`, Analytics | `groups`, `group_members`, `dealer_branches` | `GET /ai/demand-radar`<br>`GET /groups?rto_circle=` | DealerOS | Phase 9 | `AC-DMD-01` |
| **REQ-11** | **Itemized Dealer Reverse Quotation Engine** | Sec 28 | `modules/quotations` | `quotations`, `quotation_items`, `groups` | `POST /groups/{group_id}/quotations`<br>`GET /groups/{id}/quotations` | DealerOS (Submit)<br>Web (Compare) | Phase 9 | `AC-QTE-01`<br>`AC-QTE-02` |
| **REQ-12** | **Deal Acceptance & Booking Voucher Lock** | Sec 28, 29 | `modules/quotations`, Lead Svc | `purchase_records`, `quotations`, `group_members` | `POST /quotations/{id}/accept`<br>`GET /customers/me/bookings` | Main Website, DealerOS | Phase 9 | `AC-LCK-01`<br>`TC-TENANT-03` |
| **REQ-13** | **Google Gemini Comparison Explainer & Matchmaker**| Sec 15, 23 | `modules/ai`, Gemini SDK | `ai_recommendations`, `vehicle_variants` | `POST /ai/explain-comparison`<br>`POST /recommendations/matchmaker` | Main Website | Phase 10 | `AC-AI-01`<br>`TC-AI-01` |
| **REQ-14** | **Automated Predatory Fee Detection (OCR)** | Sec 15, 28 | `modules/ai`, Multimodal OCR | `quotations`, `quotation_items` | `POST /ai/extract-quotation-doc` | Main Website, DealerOS | Phase 10 | `AC-OCR-01`<br>`TC-QTE-02` |
| **REQ-15** | **Platform Governance, Auditing & Compliance** | Sec 34, 37 | `modules/admin`, Audit Engine | `audit_logs`, `subscriptions`, `dealers` | `GET /admin/audit-logs`<br>`GET /admin/dealers/verification-queue`| Admin Panel | Phase 6 | `AC-ADM-01` |

---

## 3. Compliance & Coverage Verification

- **100% Core Pillar Coverage:** All 10 product pillars outlined in Section 5 of the Master Product Brief are fully mapped to implementing applications and API modules.
- **Zero Orphaned Features:** Every database entity corresponds to at least one active API endpoint and PRD functional requirement.
- **Strict Tenant Verification:** All dealership endpoints are verified against multi-tenant isolation acceptance criteria.

