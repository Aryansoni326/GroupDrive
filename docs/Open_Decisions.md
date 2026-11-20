# GroupDrive – Open Technical & Business Decisions

**Document Version:** 1.0.0  
**Status:** Open for Executive & Founder Review  
**Classification:** Confidential – GroupDrive Technologies  
**Date:** November 2026  

---

## 1. Overview & Decision Framework

In accordance with Section 10 and Section 12 of the Master Architecture Directive, this document captures unresolved business decisions, statutory integrations, and commercial trade-offs. The engineering organization has documented recommended technical stances with trade-off analysis, preserving business optionality without making unauthorized assumptions.

---

## 2. Open Decisions Register

### DEC-01: Customer Earnest Commitment Deposit for Group Joining
- **Context:** In collective buying, uncommitted users might join groups casually ("ghost buyers"), inflating group count to threshold without real purchase intent. When dealers submit quotes, high drop-off damages dealership trust.
- **Option A (Pure Zero-Deposit MVP):** Joining a group requires only verified mobile OTP and digital intent checkbox. Zero financial friction.
  - *Pros:* Rapid viral growth; lower customer acquisition friction.
  - *Cons:* Dealer frustration due to 40-50% dropout rate after quotes arrive.
- **Option B (Refundable Earnest Token - ₹999 or ₹2,499):** Customer pays a 100% refundable token via UPI when group reaches `OPEN_FOR_QUOTES`. Token is credited toward vehicle down payment or refunded if no dealer submits an acceptable quote.
  - *Pros:* Filters out casual browsers; guarantees 90%+ purchase intent to bidding dealerships.
  - *Cons:* Increases customer onboarding friction; requires payment gateway escrow integration.
- **Engineering Recommendation:** Launch MVP with **Option A** (OTP verification only + algorithmic intent scoring based on profile completeness), transitioning to **Option B** in Phase 8 if drop-off exceeds 30%.
- **Status:** *Pending Founder Approval.*

---

### DEC-02: Statutory RTO Tax Calculation Architecture
- **Context:** Indian road tax (RTO) calculations vary across 28 states and 8 union territories based on fuel type (Electric 0% in Delhi vs Diesel 14% in Karnataka), ex-showroom price slabs, vehicle length (sub-4m vs >4m), and corporate vs individual ownership.
- **Option A (Static Config Matrix):** Pre-computed state-wise percentage tax slabs managed in PostgreSQL `vehicle_pricing` table by Platform Catalogue Admins.
  - *Pros:* Fast ($< 1\text{ ms}$ lookup), zero third-party API costs or downtime dependencies.
  - *Cons:* Requires manual admin update whenever a state gazette amends road tax rules.
- **Option B (MoRTH / Vahan NIC API Partnership):** Direct real-time API query to Vahan National Register portal.
  - *Pros:* 100% statutory exactness down to individual municipal jurisdictions.
  - *Cons:* NIC Vahan enterprise API requires commercial G2B clearances, high setup fees, and exhibits variable latency ($> 800\text{ ms}$).
- **Engineering Recommendation:** Adopt **Option A** for MVP (covering top 6 automotive states: Maharashtra, Delhi-NCR, Karnataka, Tamil Nadu, Telangana, Gujarat) with clear disclaimer: *"Indicative tax calculated per State Transport Gazette; exact road tax finalized on billing date."* Transition to Option B in Phase 12.
- **Status:** *Pending Founder Approval.*

---

### DEC-03: Dealership Default Penalty & Legal Enforceability
- **Context:** If a dealership submits an accepted quotation voucher but attempts to renege, alter terms, or demand non-statutory charges during customer showroom visits, what penalty enforces platform integrity?
- **Option A (Administrative Suspension):** Dealership receives 1 strike; 2 strikes trigger immediate suspension of DealerOS access and revocation of verified badge.
- **Option B (Financial Security Deposit / Bank Guarantee):** Dealerships maintain a refundable security deposit (e.g., ₹50,000) with GroupDrive from which liquidated damages can be deducted for willful contract defaults.
  - *Pros:* Strongest possible consumer trust guarantee.
  - *Cons:* Creates substantial dealer onboarding friction for small franchise outlets.
- **Engineering Recommendation:** Start with **Option A** (strict administrative suspension + public badge revocation + legal platform Terms of Service binding arbitration). Introduce escrow-backed deposits only for enterprise dealer networks.
- **Status:** *Pending Legal Counsel & Founder Review.*

---

### DEC-04: Cross-Brand Group Purchasing Feasibility
- **Context:** Can a buyer group consist of competing models within the same segment (e.g., "Bangalore Sub-4m Compact SUV Group" pooling Tata Nexon, Hyundai Venue, and Maruti Brezza buyers)?
- **Option A (Single-Model Groups Only):** Every group is strictly tied to a single model family (e.g., "Tata Nexon Bangalore Oct Batch"). Members choose variants and colours of that model only.
  - *Pros:* Clear operational focus; single OEM franchise dealership network can bid on the entire batch cleanly.
  - *Cons:* Smaller group pooling density in Tier-2 cities.
- **Option B (Cross-Segment Rival Bidding):** Buyers pool across rival models; competing dealers (e.g., Tata vs Hyundai vs Maruti) bid to convert buyers from rival brands.
  - *Pros:* Aggressive competitive price discovery.
  - *Cons:* High operational complexity; dealers reluctant to bid when customer vehicle preference is fluid.
- **Engineering Recommendation:** Enforce **Option A** (Single-Model Groups) for MVP. Revisit Option B as a dedicated "Segment Battle" feature in Phase 10 post-scale.
- **Status:** *Approved Architectural Stance.*

---

### DEC-05: Indian SMS DLT Registration & Sender ID Provider
- **Context:** TRAI mandates strict Distributed Ledger Technology (DLT) registration for all commercial and transactional SMS headers in India.
- **Action Required:** GroupDrive founders must register the legal entity on Vilpower / Jio DLT / Airtel DLT portal, register principal entity ID (PE ID), and register message templates for OTP, Group Milestones, and Quotation Alerts.
- **Status:** *Action Item for Company Incorporator / Founders.*

