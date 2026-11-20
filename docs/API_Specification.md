# GroupDrive – Backend REST API Specification

**Document Version:** 1.0.0  
**Status:** Approved Architectural Baseline  
**Base URL:** `https://api.groupdrive.in/api/v1` (Production) / `http://localhost:8000/api/v1` (Development)  
**Protocol:** HTTPS | OpenAPI 3.1.0 | JSON:API Principles  
**Target Market:** India  
**Date:** November 2026  

---

## 1. Global API Standards & Conventions

### 1.1 Standardized Response Envelope
All successful API responses return a structured JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 184,
    "total_pages": 10
  }
}
```

### 1.2 RFC 7807 Error Response Envelope
All error responses adhere to standard HTTP status codes and the RFC 7807 problem details format:

```json
{
  "type": "https://groupdrive.in/errors/resource-not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Vehicle variant with ID '550e8400-e29b-41d4-a716-446655440000' does not exist.",
  "instance": "/api/v1/catalogue/variants/550e8400-e29b-41d4-a716-446655440000",
  "error_code": "ERR_VARIANT_NOT_FOUND",
  "invalid_params": [],
  "timestamp": "2026-11-06T15:45:00Z"
}
```

### 1.3 Pagination, Sorting & Filtering Query Parameters
- `page` (`integer`, default: 1): Page index (1-based).
- `limit` (`integer`, default: 20, max: 100): Number of items per page.
- `sort_by` (`string`, default: "created_at"): Field name to sort by.
- `sort_order` (`string`, enum: `asc`, `desc`, default: "desc"): Sort direction.
- `search` (`string`, optional): Case-insensitive text query for full-text search.

### 1.4 Rate Limiting Headers
- `X-RateLimit-Limit`: Maximum allowable requests per time window.
- `X-RateLimit-Remaining`: Remaining requests in current window.
- `X-RateLimit-Reset`: Unix timestamp when quota resets.

---

## 2. API Endpoints by Domain Module

```
Summary of 26 Core API Modules:
01. Authentication               10. Vehicle Variants             19. Vehicle Comparisons
02. Users & Profiles             11. Vehicle Specifications       20. Recommendations & Matchmaker
03. Customer Accounts            12. Vehicle Media & 360 Spin     21. AI Services & OCR
04. Dealerships                  13. Inventory & Yard             22. Finance & EMI Calculators
05. Dealer KYC & Verification    14. Dealer Campaigns             23. Notifications & Subscriptions
06. Dealership Branches          15. Groups (Collective Buying)   24. Analytics & Demand Heatmaps
07. Dealer Staff & Access        16. Group Memberships            25. Admin Governance & Audits
08. Vehicle Brands (OEMs)        17. Buyer Enquiries              26. Wishlists & User Shortlists
09. Vehicle Models               18. Dealer Quotations
```

---

### Module 01: Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Roles Allowed | Rate Limit |
|---|---|---|---|---|
| `POST` | `/auth/request-otp` | Sends SMS OTP to Indian mobile number. | Public | 3 req/min |
| `POST` | `/auth/verify-otp` | Verifies OTP; issues JWT & HTTP-Only refresh cookie. | Public | 5 req/min |
| `POST` | `/auth/login-password` | Email/password login for Dealer Staff & Admins. | Public | 5 req/min |
| `POST` | `/auth/refresh` | Rotates refresh token; returns new 15m access token. | Public (with Cookie) | 30 req/min |
| `POST` | `/auth/logout` | Revokes current session refresh token. | Authenticated | 10 req/min |

#### `POST /auth/request-otp`
- **Request Body:**
```json
{
  "phone_number": "+919876543210",
  "purpose": "LOGIN"
}
```
- **Validation:** Must match regex `^\+91[6-9]\d{9}$`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": { "reference_id": "otp_ref_7f8a9b", "expires_in_seconds": 300 },
  "message": "OTP sent successfully via SMS"
}
```

---

### Module 02 & 03: Users, Customers & Profiles (`/api/v1/users`, `/api/v1/customers`)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/users/me` | Fetch active user profile and authorized roles. | Authenticated |
| `PATCH` | `/users/me/profile` | Update personal details (Name, City, Pin Code). | Authenticated |
| `GET` | `/customers/me/groups` | Fetch groups created or joined by customer. | `ROLE_CUSTOMER` |
| `GET` | `/customers/me/bookings` | Fetch accepted quotation booking vouchers. | `ROLE_CUSTOMER` |

---

### Module 04, 05, 06, 07: Dealerships, KYC, Branches & Staff (`/api/v1/dealers`)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `POST` | `/dealers/register` | Register new dealership legal entity. | Authenticated |
| `GET` | `/dealers/me` | Get current dealership profile & KYC status. | Dealer Staff |
| `POST` | `/dealers/me/documents` | Upload GSTIN, Trade Certificate, OEM Franchise Letter. | `ROLE_DEALER_OWNER` |
| `GET` | `/dealers/me/branches` | List all branches under dealership. | Dealer Staff |
| `POST` | `/dealers/me/branches` | Create new showroom or stockyard branch. | `ROLE_DEALER_OWNER` |
| `GET` | `/dealers/me/staff` | List staff members assigned to branches. | `ROLE_DEALER_OWNER`, `ROLE_BRANCH_MANAGER` |
| `POST` | `/dealers/me/staff` | Invite staff member with designated role. | `ROLE_DEALER_OWNER`, `ROLE_BRANCH_MANAGER` |

#### `POST /dealers/register`
- **Request Body:**
```json
{
  "legal_entity_name": "Kalyani Motors Private Limited",
  "trade_name": "Kalyani Motors Maruti Suzuki",
  "gstin": "29AABCK1234F1Z5",
  "pan": "AABCK1234F",
  "oem_brand_franchise": "Maruti Suzuki Arena",
  "registered_office_address": "No. 15, Bannerghatta Road, Bengaluru, KA 560076",
  "primary_contact_email": "director@kalyanimotors.com",
  "primary_contact_phone": "+919845012345"
}
```

---

### Module 08, 09, 10, 11, 12: Master Vehicle Catalogue (`/api/v1/catalogue`)

*Security Rule:* All `GET` endpoints are public and cached in Redis. All `POST`, `PUT`, `DELETE` endpoints strictly require `ROLE_SUPER_ADMIN` or `ROLE_CATALOGUE_ADMIN`.

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/catalogue/brands` | List active automotive brands with logos. | Public |
| `GET` | `/catalogue/models` | Filter models by budget, body type, fuel, seats. | Public |
| `GET` | `/catalogue/models/{slug}` | Detailed model info with variant lineup & colours. | Public |
| `GET` | `/catalogue/variants/{id}` | Complete variant specs (Engine, safety, comfort). | Public |
| `GET` | `/catalogue/variants/{id}/pricing` | State-level ex-showroom and indicative on-road. | Public |
| `GET` | `/catalogue/models/{id}/360-spin` | Fetch 360° frame sequence URLs and metadata. | Public |
| `POST` | `/catalogue/models` | Create new vehicle model entry. | Admin Only |
| `POST` | `/catalogue/variants` | Create new vehicle variant entry. | Admin Only |

#### `GET /catalogue/models`
- **Query Parameters:** `body_type`, `fuel_type`, `transmission`, `min_price`, `max_price`, `min_safety_stars`, `seating_capacity`, `page`, `limit`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "7f8a9b2c-0001-4000-8000-000000000001",
      "brand": { "name": "Tata Motors", "slug": "tata-motors" },
      "name": "Nexon",
      "slug": "tata-nexon",
      "body_type": "COMPACT_SUV",
      "starting_ex_showroom_price": 799900.00,
      "safety_rating_stars": 5,
      "fuel_types": ["PETROL", "DIESEL", "CNG", "ELECTRIC"],
      "hero_image_url": "https://cdn.groupdrive.in/media/models/nexon/hero.webp"
    }
  ]
}
```

---

### Module 13: Inventory & Yard Tracking (`/api/v1/inventory`)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/inventory` | List branch yard inventory with VIN status. | Dealer Staff (Scoped) |
| `POST` | `/inventory` | Add vehicle VIN to yard stock. | Branch/Inventory Mgr |
| `PATCH` | `/inventory/{id}/status` | Update status (`IN_STOCK`, `ALLOCATED`, `SOLD`). | Branch/Inventory Mgr |
| `POST` | `/inventory/bulk-upload` | Import inventory batch via CSV/Excel. | Branch/Inventory Mgr |

---

### Module 14: Dealer Campaigns (`/api/v1/campaigns`)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/campaigns/active` | Public listing of active dealer promotional offers. | Public |
| `GET` | `/dealers/me/campaigns` | Dealership's internal campaign manager. | Dealer Staff |
| `POST` | `/dealers/me/campaigns` | Launch volume discount / aging stock campaign. | `ROLE_DEALER_OWNER`, `ROLE_BRANCH_MANAGER` |

---

### Module 15 & 16: Group Purchasing Engine (`/api/v1/groups`)

| Method | Endpoint | Description | Roles Allowed | Rate Limit |
|---|---|---|---|---|
| `GET` | `/groups` | Search active buyer groups by city, model, status. | Public | 60 req/min |
| `GET` | `/groups/{id}` | Group details, capacity meter, time remaining. | Public | 60 req/min |
| `POST` | `/groups` | Create new collective purchasing group. | `ROLE_CUSTOMER` | 5 req/hour |
| `POST` | `/groups/{id}/join` | Join an existing group with selected variant. | `ROLE_CUSTOMER` | 10 req/hour |
| `POST` | `/groups/{id}/leave` | Leave group before quoting window locks. | Group Member | 5 req/hour |
| `GET` | `/groups/{id}/members` | Anonymized view of group members. | Authenticated | 30 req/min |

#### `POST /groups/{id}/join`
- **Request Body:**
```json
{
  "selected_variant_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "selected_colour_id": "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  "customer_city": "Bengaluru",
  "customer_pin_code": "560037",
  "finance_preference": "BANK_LOAN"
}
```
- **Validation Rules:**
  1. Customer phone number must be verified.
  2. Customer city must belong to the group's authorized RTO jurisdiction.
  3. Group status must be `FORMING` or `OPEN_FOR_QUOTES`.
  4. Current member count must be `< max_capacity`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "membership_id": "e4f5a6b7-c8d9-4000-8000-112233445566",
    "group_id": "7f8a9b2c-0001-4000-8000-000000000001",
    "current_members_count": 6,
    "remaining_slots": 4,
    "group_status": "OPEN_FOR_QUOTES"
  },
  "message": "Successfully joined group"
}
```

---

### Module 18: Dealer Quotation Engine (`/api/v1/quotations`)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/groups/{group_id}/quotations` | List binding quotes submitted for group. | Group Members, Admins |
| `POST` | `/groups/{group_id}/quotations` | Dealership submits binding itemized quotation. | Authorized Dealers |
| `POST` | `/quotations/{id}/accept` | Group member votes to accept winning quote. | Group Members |
| `POST` | `/quotations/{id}/lock` | System locks winning deal & issues vouchers. | System / Admin |

#### `POST /groups/{group_id}/quotations`
- **Request Body:**
```json
{
  "branch_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "delivery_timeline_days": 21,
  "dealership_terms": "Price valid for delivery within 30 days. Includes complimentary 3M underbody anti-rust coating.",
  "items": [
    {
      "variant_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "ex_showroom_price": 1150000.00,
      "rto_road_tax": 184000.00,
      "insurance_amount": 42000.00,
      "fastag_charges": 500.00,
      "tcs_amount": 11500.00,
      "accessories_package_cost": 15000.00,
      "extended_warranty_cost": 22000.00,
      "oem_consumer_scheme_discount": 25000.00,
      "dealer_exclusive_group_discount": 55000.00
    }
  ]
}
```
- **Validation Engine:** Automatically recalculates `net_payable_amount` ($₹13,45,000.00$). Rejects submission if math diverges or if non-statutory "handling fees" are detected.

---

### Module 19 & 20: Smart Comparisons & Matchmaker (`/api/v1/comparisons`, `/api/v1/recommendations`)

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `POST` | `/comparisons/matrix` | Deterministic side-by-side comparison (2-4 cars). | Public |
| `POST` | `/comparisons/scored` | Weighted priority comparison score calculation. | Public |
| `POST` | `/recommendations/matchmaker` | Questionnaire-based vehicle recommendation. | Public |

#### `POST /comparisons/matrix`
- **Request Body:**
```json
{
  "variant_ids": [
    "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "8a2ceb3c-2c6c-4cad-8acc-1a0c6a2cba5c"
  ]
}
```
- **Response Structure (200 OK):** Returns structured trees for `differences` and `identical_features` across Engine, Dimensions, Safety, and Infotainment.

---

### Module 21: AI Services (`/api/v1/ai`)

| Method | Endpoint | Description | Roles Allowed | Rate Limit |
|---|---|---|---|---|
| `POST` | `/ai/explain-comparison` | Generates Gemini narrative on compared vehicles. | Public | 10 req/min |
| `POST` | `/ai/extract-quotation-doc` | OCR extraction of physical dealer price sheet. | Authenticated | 5 req/hour |
| `GET` | `/ai/demand-radar` | Regional vehicle demand intelligence heatmap. | Dealer Staff | 30 req/min |

---

### Module 22, 23, 24, 25, 26: Finance, Notifications, Analytics, Admin & Wishlists

| Method | Endpoint | Description | Roles Allowed |
|---|---|---|---|
| `POST` | `/finance/calculate-emi` | Dynamic loan EMI calculation. | Public |
| `GET` | `/notifications` | List user in-app notifications. | Authenticated |
| `GET` | `/analytics/dealer-performance` | Dealership conversion, SLA, and win rates. | Dealer Staff |
| `GET` | `/admin/dealers/verification-queue` | List pending dealership KYC applications. | Admin Only |
| `POST` | `/admin/dealers/{id}/verify` | Approve or reject dealer application. | `ROLE_DEALER_VERIFICATION_ADMIN`, `ROLE_SUPER_ADMIN` |
| `GET` | `/admin/audit-logs` | Filter immutable system audit trail logs. | Admin Only |
| `GET` | `/wishlists` | List bookmarked vehicles. | Authenticated |
| `POST` | `/wishlists/{variant_id}` | Add vehicle to customer wishlist. | Authenticated |
| `DELETE` | `/wishlists/{variant_id}` | Remove vehicle from wishlist. | Authenticated |

