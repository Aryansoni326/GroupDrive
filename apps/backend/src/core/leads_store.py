from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from src.core.identity_store import BRANCHES_DB, USERS_DB

# Lead Status Lifecycle
LEAD_STATUSES = [
    "NEW_ENQUIRY",
    "CONTACTED",
    "TEST_DRIVE_SCHEDULED",
    "TEST_DRIVE_COMPLETED",
    "QUOTATION_SENT",
    "NEGOTIATION",
    "WON_BOOKED",
    "LOST_CLOSED",
]

# Purchase Timelines
PURCHASE_TIMELINES = [
    "IMMEDIATE",
    "WITHIN_15_DAYS",
    "WITHIN_30_DAYS",
    "EXPLORING_2_3_MONTHS",
]

# Financing Preferences
FINANCING_PREFERENCES = [
    "CASH",
    "LOAN",
    "LEASE",
    "UNDECIDED",
]

# Lead Sources
LEAD_SOURCES = [
    "WEBSITE_DIRECT",
    "BUYER_GROUP",
    "SHOWROOM_WALK_IN",
    "PHONE_INQUIRY",
    "REFERRAL",
]

# In-memory Master Leads Database
LEADS_MASTER_DB: List[Dict[str, Any]] = [
    {
        "id": "lead-cust-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Maruti Suzuki",
        "model_name": "Brezza",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Pearl Arctic White",
        "budget_min": 1300000,
        "budget_max": 1650000,
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "LOAN",
        "source": "WEBSITE_DIRECT",
        "status": "QUOTATION_SENT",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "assigned_by_id": "usr-priya-03",
        "assigned_by_name": "Priya Nair",
        "assigned_at": "2026-11-06T10:00:00Z",
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "notes_count": 2,
        "last_contacted_at": "2026-11-06T10:30:00Z",
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-06T09:00:00Z",
        "updated_at": "2026-11-06T10:30:00Z",
    },
    {
        "id": "lead-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "customer_name": "Karthik Subramanian",
        "customer_phone": "+919845112233",
        "customer_email": "karthik.s@gmail.com",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Maruti Suzuki",
        "model_name": "Brezza",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Pearl Arctic White",
        "budget_min": 1200000,
        "budget_max": 1450000,
        "purchase_timeline": "IMMEDIATE",
        "financing_preference": "LOAN",
        "source": "BUYER_GROUP",
        "status": "NEW_ENQUIRY",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "assigned_by_id": "usr-priya-03",
        "assigned_by_name": "Priya Nair",
        "assigned_at": "2026-11-06T10:35:00Z",
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "notes_count": 2,
        "last_contacted_at": "2026-11-06T10:45:00Z",
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-06T10:30:00Z",
        "updated_at": "2026-11-06T10:45:00Z",
    },
    {
        "id": "lead-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "customer_name": "Ananya Deshmukh",
        "customer_phone": "+919845223344",
        "customer_email": "ananya.d@outlook.com",
        "city": "Bengaluru",
        "preferred_contact_method": "WHATSAPP",
        "brand_name": "Maruti Suzuki",
        "model_name": "Swift 2026",
        "variant_name": "ZXi 1.2L 5MT",
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "colour_preference": "Luster Blue",
        "budget_min": 800000,
        "budget_max": 950000,
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "CASH",
        "source": "WEBSITE_DIRECT",
        "status": "TEST_DRIVE_SCHEDULED",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "assigned_by_id": "usr-priya-03",
        "assigned_by_name": "Priya Nair",
        "assigned_at": "2026-11-06T09:20:00Z",
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "notes_count": 1,
        "last_contacted_at": "2026-11-06T09:30:00Z",
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-06T09:15:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
    {
        "id": "lead-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "customer_name": "Rohan Mehra",
        "customer_phone": "+919845334455",
        "customer_email": "rohan.m@yahoo.com",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Maruti Suzuki",
        "model_name": "Grand Vitara",
        "variant_name": "Alpha Intelligent Electric Hybrid e-CVT",
        "fuel_type": "Strong Hybrid",
        "transmission": "Automatic",
        "colour_preference": "Nexa Blue",
        "budget_min": 1900000,
        "budget_max": 2200000,
        "purchase_timeline": "WITHIN_30_DAYS",
        "financing_preference": "LOAN",
        "source": "SHOWROOM_WALK_IN",
        "status": "QUOTATION_SENT",
        "assigned_to_id": "usr-deepa-06",
        "assigned_to_name": "Deepa Rao",
        "assigned_to_role": "FINANCE_EXECUTIVE",
        "assigned_by_id": "usr-vikram-01",
        "assigned_by_name": "Vikram Kalyani",
        "assigned_at": "2026-11-05T17:00:00Z",
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "notes_count": 2,
        "last_contacted_at": "2026-11-06T14:15:00Z",
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-05T16:45:00Z",
        "updated_at": "2026-11-06T14:15:00Z",
    },
    {
        "id": "lead-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "customer_name": "Siddharth Verma",
        "customer_phone": "+919845445566",
        "customer_email": "siddharth.v@tcs.com",
        "city": "Bengaluru",
        "preferred_contact_method": "EMAIL",
        "brand_name": "Maruti Suzuki",
        "model_name": "Fronx",
        "variant_name": "Zeta 1.0L Turbo 6AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Grandeur Grey",
        "budget_min": 1100000,
        "budget_max": 1300000,
        "purchase_timeline": "EXPLORING_2_3_MONTHS",
        "financing_preference": "UNDECIDED",
        "source": "PHONE_INQUIRY",
        "status": "NEW_ENQUIRY",
        "assigned_to_id": None,
        "assigned_to_name": None,
        "assigned_to_role": None,
        "assigned_by_id": None,
        "assigned_by_name": None,
        "assigned_at": None,
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "notes_count": 1,
        "last_contacted_at": None,
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-06T11:00:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
    {
        "id": "lead-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "customer_name": "Meera Krishnan",
        "customer_phone": "+919845556677",
        "customer_email": "meera.k@gmail.com",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Maruti Suzuki",
        "model_name": "Brezza",
        "variant_name": "ZXi 1.5L 5MT",
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "colour_preference": "Magma Grey",
        "budget_min": 1100000,
        "budget_max": 1250000,
        "purchase_timeline": "IMMEDIATE",
        "financing_preference": "LOAN",
        "source": "BUYER_GROUP",
        "status": "WON_BOOKED",
        "assigned_to_id": "usr-deepa-06",
        "assigned_to_name": "Deepa Rao",
        "assigned_to_role": "FINANCE_EXECUTIVE",
        "assigned_by_id": "usr-vikram-01",
        "assigned_by_name": "Vikram Kalyani",
        "assigned_at": "2026-11-04T15:00:00Z",
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "notes_count": 2,
        "last_contacted_at": "2026-11-05T12:00:00Z",
        "lost_reason": None,
        "booked_voucher_code": "VCHR-BRZ-7821",
        "created_at": "2026-11-04T14:20:00Z",
        "updated_at": "2026-11-05T16:00:00Z",
    },
    {
        "id": "lead-006",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "customer_name": "Rajesh Nair",
        "customer_phone": "+919845667788",
        "customer_email": "rajesh.nair@infosys.com",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Maruti Suzuki",
        "model_name": "Ertiga",
        "variant_name": "ZXi 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Splendid Silver",
        "budget_min": 1200000,
        "budget_max": 1350000,
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "LOAN",
        "source": "REFERRAL",
        "status": "NEGOTIATION",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "assigned_by_id": "usr-priya-03",
        "assigned_by_name": "Priya Nair",
        "assigned_at": "2026-11-03T11:00:00Z",
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "notes_count": 3,
        "last_contacted_at": "2026-11-06T15:30:00Z",
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-03T10:00:00Z",
        "updated_at": "2026-11-06T15:30:00Z",
    },
    {
        "id": "lead-007",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "customer_name": "Sunita Rao",
        "customer_phone": "+919845778899",
        "customer_email": "sunita.rao@wipro.com",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Maruti Suzuki",
        "model_name": "Baleno",
        "variant_name": "Alpha 1.2L AMT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Celestial Blue",
        "budget_min": 950000,
        "budget_max": 1050000,
        "purchase_timeline": "EXPLORING_2_3_MONTHS",
        "financing_preference": "CASH",
        "source": "SHOWROOM_WALK_IN",
        "status": "LOST_CLOSED",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "assigned_by_id": "usr-rajesh-02",
        "assigned_by_name": "Rajesh Sharma",
        "assigned_at": "2026-11-01T10:00:00Z",
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "notes_count": 1,
        "last_contacted_at": "2026-11-04T12:00:00Z",
        "lost_reason": "Purchased alternate vehicle from competitor dealership due to ready stock delivery.",
        "booked_voucher_code": None,
        "created_at": "2026-11-01T09:30:00Z",
        "updated_at": "2026-11-04T12:00:00Z",
    },
    # Multi-tenant rival dealership leads (for cross-tenant security verification)
    {
        "id": "lead-901",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "customer_name": "Vikram Seth",
        "customer_phone": "+919845998877",
        "customer_email": "vikram.s@advaith.com",
        "city": "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": "Hyundai",
        "model_name": "Creta",
        "variant_name": "SX(O) 1.5L Petrol IVT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Abyss Black",
        "budget_min": 1700000,
        "budget_max": 1950000,
        "purchase_timeline": "IMMEDIATE",
        "financing_preference": "LOAN",
        "source": "SHOWROOM_WALK_IN",
        "status": "NEW_ENQUIRY",
        "assigned_to_id": "usr-sunil-07",
        "assigned_to_name": "Sunil Reddy",
        "assigned_to_role": "BRANCH_MANAGER",
        "assigned_by_id": "usr-sunil-07",
        "assigned_by_name": "Sunil Reddy",
        "assigned_at": "2026-11-06T11:00:00Z",
        "created_by_id": "usr-sunil-07",
        "created_by_name": "Sunil Reddy",
        "notes_count": 1,
        "last_contacted_at": None,
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-06T10:45:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
    {
        "id": "lead-902",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "customer_name": "Kavita Menon",
        "customer_phone": "+919845887766",
        "customer_email": "kavita.menon@gmail.com",
        "city": "Bengaluru",
        "preferred_contact_method": "WHATSAPP",
        "brand_name": "Hyundai",
        "model_name": "Venue",
        "variant_name": "SX 1.0 Turbo DCT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Titan Grey",
        "budget_min": 1200000,
        "budget_max": 1350000,
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "CASH",
        "source": "WEBSITE_DIRECT",
        "status": "TEST_DRIVE_SCHEDULED",
        "assigned_to_id": "usr-sunil-07",
        "assigned_to_name": "Sunil Reddy",
        "assigned_to_role": "BRANCH_MANAGER",
        "assigned_by_id": "usr-sunil-07",
        "assigned_by_name": "Sunil Reddy",
        "assigned_at": "2026-11-05T14:00:00Z",
        "created_by_id": "usr-sunil-07",
        "created_by_name": "Sunil Reddy",
        "notes_count": 1,
        "last_contacted_at": "2026-11-05T15:30:00Z",
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": "2026-11-05T13:30:00Z",
        "updated_at": "2026-11-05T15:30:00Z",
    },
]

# Internal Notes Database
LEAD_NOTES_DB: List[Dict[str, Any]] = [
    {
        "id": "note-001",
        "lead_id": "lead-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-priya-03",
        "author_name": "Priya Nair",
        "author_role": "SALES_MANAGER",
        "content": "Customer joined Group GD-BLR-BRZ-04. Requires delivery within 14 days. Assigned to Amit for immediate phone follow-up.",
        "created_at": "2026-11-06T10:35:00Z",
    },
    {
        "id": "note-002",
        "lead_id": "lead-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-amit-04",
        "author_name": "Amit Patel",
        "author_role": "SALES_EXECUTIVE",
        "content": "Called customer. Confirmed requirement for Pearl Arctic White ZXi Plus AT. Will visit Whitefield showroom on Saturday at 11 AM.",
        "created_at": "2026-11-06T10:45:00Z",
    },
    {
        "id": "note-003",
        "lead_id": "lead-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-amit-04",
        "author_name": "Amit Patel",
        "author_role": "SALES_EXECUTIVE",
        "content": "Customer requested home test drive of Swift ZXi at ITPL campus on Saturday 2 PM. Test drive vehicle blocked.",
        "created_at": "2026-11-06T09:30:00Z",
    },
    {
        "id": "note-004",
        "lead_id": "lead-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-deepa-06",
        "author_name": "Deepa Rao",
        "author_role": "FINANCE_EXECUTIVE",
        "content": "Detailed quotation shared for Grand Vitara Alpha Hybrid. Customer evaluating 85% LTV loan through SBI Auto Loan.",
        "created_at": "2026-11-06T14:15:00Z",
    },
    {
        "id": "note-005",
        "lead_id": "lead-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-priya-03",
        "author_name": "Priya Nair",
        "author_role": "SALES_MANAGER",
        "content": "Inquired on corporate scheme for TCS employees and year-end exchange bonus. Needs executive assignment.",
        "created_at": "2026-11-06T11:00:00Z",
    },
    {
        "id": "note-006",
        "lead_id": "lead-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-deepa-06",
        "author_name": "Deepa Rao",
        "author_role": "FINANCE_EXECUTIVE",
        "content": "Booking advance received INR 25,000. Voucher VCHR-BRZ-7821 verified against group tier pricing.",
        "created_at": "2026-11-05T16:00:00Z",
    },
    {
        "id": "note-007",
        "lead_id": "lead-006",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-amit-04",
        "author_name": "Amit Patel",
        "author_role": "SALES_EXECUTIVE",
        "content": "Final pricing negotiation in progress. Customer requested complimentary rubber mats and Teflon coating.",
        "created_at": "2026-11-06T15:30:00Z",
    },
    {
        "id": "note-008",
        "lead_id": "lead-007",
        "dealer_id": "dlr-kalyani-blr-001",
        "author_id": "usr-amit-04",
        "author_name": "Amit Patel",
        "author_role": "SALES_EXECUTIVE",
        "content": "Customer opted for Hyundai i20 due to ready stock delivery in 2 days. Lead closed as lost.",
        "created_at": "2026-11-04T12:00:00Z",
    },
    {
        "id": "note-901",
        "lead_id": "lead-901",
        "dealer_id": "dlr-advaith-blr-002",
        "author_id": "usr-sunil-07",
        "author_name": "Sunil Reddy",
        "author_role": "BRANCH_MANAGER",
        "content": "Walk-in customer at Residency Road. Enquired on Creta SX(O) waiting period.",
        "created_at": "2026-11-06T11:00:00Z",
    },
]

# Activity History Log Database
LEAD_ACTIVITIES_DB: List[Dict[str, Any]] = [
    {
        "id": "act-001",
        "lead_id": "lead-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "LEAD_CREATED",
        "details": "Customer enquiry created from Buyer Group GD-BLR-BRZ-04.",
        "actor_id": "usr-priya-03",
        "actor_name": "Priya Nair",
        "actor_role": "SALES_MANAGER",
        "timestamp": "2026-11-06T10:30:00Z",
    },
    {
        "id": "act-002",
        "lead_id": "lead-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "LEAD_ASSIGNED",
        "details": "Assigned lead to Sales Executive Amit Patel.",
        "actor_id": "usr-priya-03",
        "actor_name": "Priya Nair",
        "actor_role": "SALES_MANAGER",
        "timestamp": "2026-11-06T10:35:00Z",
    },
    {
        "id": "act-003",
        "lead_id": "lead-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "NOTE_ADDED",
        "details": "Added call notes regarding showroom visit on Saturday.",
        "actor_id": "usr-amit-04",
        "actor_name": "Amit Patel",
        "actor_role": "SALES_EXECUTIVE",
        "timestamp": "2026-11-06T10:45:00Z",
    },
    {
        "id": "act-004",
        "lead_id": "lead-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "LEAD_CREATED",
        "details": "Customer web enquiry registered for Swift 2026.",
        "actor_id": "usr-amit-04",
        "actor_name": "Amit Patel",
        "actor_role": "SALES_EXECUTIVE",
        "timestamp": "2026-11-06T09:15:00Z",
    },
    {
        "id": "act-005",
        "lead_id": "lead-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "STATUS_UPDATED",
        "details": "Status transitioned from NEW_ENQUIRY to TEST_DRIVE_SCHEDULED.",
        "actor_id": "usr-amit-04",
        "actor_name": "Amit Patel",
        "actor_role": "SALES_EXECUTIVE",
        "timestamp": "2026-11-06T11:00:00Z",
    },
    {
        "id": "act-006",
        "lead_id": "lead-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "STATUS_UPDATED",
        "details": "Lead converted to WON_BOOKED with booking voucher VCHR-BRZ-7821.",
        "actor_id": "usr-deepa-06",
        "actor_name": "Deepa Rao",
        "actor_role": "FINANCE_EXECUTIVE",
        "timestamp": "2026-11-05T16:00:00Z",
    },
    {
        "id": "act-007",
        "lead_id": "lead-007",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "STATUS_UPDATED",
        "details": "Status changed to LOST_CLOSED. Reason: Purchased alternate vehicle from competitor.",
        "actor_id": "usr-amit-04",
        "actor_name": "Amit Patel",
        "actor_role": "SALES_EXECUTIVE",
        "timestamp": "2026-11-04T12:00:00Z",
    },
]

# Database Operations & Helper Functions

def query_leads(
    dealer_id: str,
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
    timeline: Optional[str] = None,
    search: Optional[str] = None,
    user_role: Optional[str] = None,
    user_id: Optional[str] = None,
    user_branch_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Queries and filters leads scoped strictly to the dealer tenant.
    Enforces role-based visibility:
    - DEALER_OWNER: All leads across dealership, with optional branch filtering.
    - BRANCH_MANAGER / SALES_MANAGER: Scoped to their assigned branch.
    - SALES_EXECUTIVE: Scoped to their assigned branch, prioritizing leads assigned to them or unassigned.
    - INVENTORY_MANAGER / FINANCE_EXECUTIVE: Scoped to branch/dealership for operational review.
    """
    results = [lead for lead in LEADS_MASTER_DB if lead["dealer_id"] == dealer_id]

    # Role-based branch enforcement
    if user_role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"]:
        if user_branch_id:
            results = [lead for lead in results if lead.get("branch_id") == user_branch_id]
    elif branch_id and branch_id != "all":
        results = [lead for lead in results if lead.get("branch_id") == branch_id]

    # Role-based assignment visibility for Sales Executives
    if user_role == "SALES_EXECUTIVE" and user_id:
        # Sales executives see their own assigned leads plus unassigned leads in their branch
        results = [
            lead for lead in results
            if lead.get("assigned_to_id") == user_id or lead.get("assigned_to_id") is None
        ]

    # Additional query filters
    if status and status != "all":
        results = [lead for lead in results if lead.get("status") == status]

    if assigned_to_id and assigned_to_id != "all":
        if assigned_to_id == "unassigned":
            results = [lead for lead in results if lead.get("assigned_to_id") is None]
        else:
            results = [lead for lead in results if lead.get("assigned_to_id") == assigned_to_id]

    if timeline and timeline != "all":
        results = [lead for lead in results if lead.get("purchase_timeline") == timeline]

    if search:
        s = search.lower().strip()
        results = [
            lead for lead in results
            if s in lead.get("customer_name", "").lower()
            or s in lead.get("customer_phone", "").lower()
            or s in lead.get("customer_email", "").lower()
            or s in lead.get("model_name", "").lower()
            or s in (lead.get("variant_name") or "").lower()
            or s in lead.get("id", "").lower()
        ]

    # Sort descending by updated_at or created_at
    results.sort(key=lambda x: x.get("updated_at") or x.get("created_at"), reverse=True)
    return results


def get_lead_by_id(lead_id: str, dealer_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a specific lead ensuring dealer tenant isolation."""
    for lead in LEADS_MASTER_DB:
        if lead["id"] == lead_id and lead["dealer_id"] == dealer_id:
            return lead
    return None


def record_lead_activity(
    lead_id: str,
    dealer_id: str,
    action: str,
    details: str,
    actor: Dict[str, Any],
) -> Dict[str, Any]:
    """Records an immutable activity log entry for a lead."""
    actor_name = f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or actor.get("email", "Staff User")
    now_iso = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": f"act-{uuid.uuid4().hex[:8]}",
        "lead_id": lead_id,
        "dealer_id": dealer_id,
        "action": action,
        "details": details,
        "actor_id": actor.get("id", ""),
        "actor_name": actor_name,
        "actor_role": actor.get("staff_role", "SALES_EXECUTIVE"),
        "timestamp": now_iso,
    }
    LEAD_ACTIVITIES_DB.insert(0, entry)
    return entry


def create_lead(payload: Dict[str, Any], actor: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a new customer lead/enquiry with audit logging and optional initial assignment/note.
    """
    dealer_id = actor["dealer_id"]
    branch_id = payload.get("branch_id")
    branch = BRANCHES_DB.get(branch_id, {})
    branch_name = branch.get("branch_name", "Primary Showroom")
    actor_name = f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or actor.get("email", "Staff User")
    now_iso = datetime.now(timezone.utc).isoformat()

    lead_id = f"lead-{uuid.uuid4().hex[:6]}"
    
    assigned_to_id = payload.get("assigned_to_id")
    assigned_to_name = None
    assigned_to_role = None
    assigned_by_id = None
    assigned_by_name = None
    assigned_at = None

    if assigned_to_id:
        target_user = None
        for u in USERS_DB.values():
            if u.get("id") == assigned_to_id and u.get("dealer_id") == dealer_id:
                target_user = u
                break
        if target_user:
            assigned_to_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()
            assigned_to_role = target_user.get("staff_role")
            assigned_by_id = actor.get("id")
            assigned_by_name = actor_name
            assigned_at = now_iso

    new_lead = {
        "id": lead_id,
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "customer_name": payload.get("customer_name"),
        "customer_phone": payload.get("customer_phone"),
        "customer_email": payload.get("customer_email"),
        "city": payload.get("city", "Bengaluru"),
        "preferred_contact_method": payload.get("preferred_contact_method", "PHONE"),
        "brand_name": payload.get("brand_name", "Maruti Suzuki"),
        "model_name": payload.get("model_name"),
        "variant_name": payload.get("variant_name"),
        "fuel_type": payload.get("fuel_type"),
        "transmission": payload.get("transmission"),
        "colour_preference": payload.get("colour_preference"),
        "budget_min": payload.get("budget_min"),
        "budget_max": payload.get("budget_max"),
        "purchase_timeline": payload.get("purchase_timeline", "WITHIN_15_DAYS"),
        "financing_preference": payload.get("financing_preference", "UNDECIDED"),
        "source": payload.get("source", "SHOWROOM_WALK_IN"),
        "status": "NEW_ENQUIRY",
        "assigned_to_id": assigned_to_id,
        "assigned_to_name": assigned_to_name,
        "assigned_to_role": assigned_to_role,
        "assigned_by_id": assigned_by_id,
        "assigned_by_name": assigned_by_name,
        "assigned_at": assigned_at,
        "created_by_id": actor.get("id"),
        "created_by_name": actor_name,
        "notes_count": 0,
        "last_contacted_at": None,
        "lost_reason": None,
        "booked_voucher_code": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    LEADS_MASTER_DB.insert(0, new_lead)

    record_lead_activity(
        lead_id=lead_id,
        dealer_id=dealer_id,
        action="LEAD_CREATED",
        details=f"Customer enquiry created for {new_lead['customer_name']} ({new_lead['model_name']}).",
        actor=actor,
    )

    if assigned_to_name:
        record_lead_activity(
            lead_id=lead_id,
            dealer_id=dealer_id,
            action="LEAD_ASSIGNED",
            details=f"Assigned lead to {assigned_to_name} ({assigned_to_role}).",
            actor=actor,
        )

    initial_note = payload.get("initial_note")
    if initial_note and initial_note.strip():
        add_lead_note(lead_id, initial_note.strip(), actor)

    return new_lead


def update_lead(lead_id: str, updates: Dict[str, Any], actor: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates customer preferences, budget, or vehicle interest on a lead."""
    lead = get_lead_by_id(lead_id, actor["dealer_id"])
    if not lead:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    editable_fields = [
        "customer_name",
        "customer_phone",
        "customer_email",
        "city",
        "preferred_contact_method",
        "brand_name",
        "model_name",
        "variant_name",
        "fuel_type",
        "transmission",
        "colour_preference",
        "budget_min",
        "budget_max",
        "purchase_timeline",
        "financing_preference",
        "branch_id",
    ]

    modified_fields = []
    for f in editable_fields:
        if f in updates and updates[f] is not None:
            lead[f] = updates[f]
            modified_fields.append(f)

    if "branch_id" in updates and updates["branch_id"]:
        b = BRANCHES_DB.get(updates["branch_id"], {})
        lead["branch_name"] = b.get("branch_name", lead.get("branch_name"))

    lead["updated_at"] = now_iso

    record_lead_activity(
        lead_id=lead_id,
        dealer_id=actor["dealer_id"],
        action="LEAD_UPDATED",
        details=f"Updated lead attributes: {', '.join(modified_fields)}.",
        actor=actor,
    )

    return lead


def assign_lead(
    lead_id: str,
    target_staff_id: str,
    actor: Dict[str, Any],
    notes: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Assigns or reassigns a lead to an authorized showroom staff member.
    """
    dealer_id = actor["dealer_id"]
    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        return None

    target_user = None
    for u in USERS_DB.values():
        if u.get("id") == target_staff_id and u.get("dealer_id") == dealer_id:
            target_user = u
            break

    if not target_user:
        return None

    target_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()
    target_role = target_user.get("staff_role", "SALES_EXECUTIVE")
    actor_name = f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or actor.get("email", "Staff User")
    now_iso = datetime.now(timezone.utc).isoformat()

    prev_assigned = lead.get("assigned_to_name")
    action_type = "LEAD_REASSIGNED" if prev_assigned else "LEAD_ASSIGNED"
    details = f"Assigned to {target_name} ({target_role})." if not prev_assigned else f"Reassigned from {prev_assigned} to {target_name} ({target_role})."

    lead["assigned_to_id"] = target_staff_id
    lead["assigned_to_name"] = target_name
    lead["assigned_to_role"] = target_role
    lead["assigned_by_id"] = actor.get("id")
    lead["assigned_by_name"] = actor_name
    lead["assigned_at"] = now_iso
    lead["updated_at"] = now_iso

    record_lead_activity(
        lead_id=lead_id,
        dealer_id=dealer_id,
        action=action_type,
        details=details,
        actor=actor,
    )

    if notes and notes.strip():
        add_lead_note(lead_id, f"Assignment Note: {notes.strip()}", actor)

    return lead


def update_lead_status(
    lead_id: str,
    new_status: str,
    actor: Dict[str, Any],
    reason_or_notes: Optional[str] = None,
    booked_voucher_code: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Updates the lifecycle status of a lead with audit entry and optional reason/voucher.
    """
    dealer_id = actor["dealer_id"]
    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        return None

    old_status = lead.get("status", "NEW_ENQUIRY")
    now_iso = datetime.now(timezone.utc).isoformat()

    lead["status"] = new_status
    lead["updated_at"] = now_iso

    if new_status == "LOST_CLOSED" and reason_or_notes:
        lead["lost_reason"] = reason_or_notes.strip()

    if new_status == "WON_BOOKED" and booked_voucher_code:
        lead["booked_voucher_code"] = booked_voucher_code.strip()

    if new_status in ["CONTACTED", "TEST_DRIVE_SCHEDULED", "TEST_DRIVE_COMPLETED", "QUOTATION_SENT", "NEGOTIATION"]:
        lead["last_contacted_at"] = now_iso

    details = f"Lead status updated from {old_status} to {new_status}."
    if reason_or_notes:
        details += f" Remarks: {reason_or_notes.strip()}"

    record_lead_activity(
        lead_id=lead_id,
        dealer_id=dealer_id,
        action="STATUS_UPDATED",
        details=details,
        actor=actor,
    )

    if reason_or_notes and reason_or_notes.strip():
        add_lead_note(lead_id, f"Status Update ({new_status}): {reason_or_notes.strip()}", actor)

    return lead


def add_lead_note(lead_id: str, content: str, actor: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Adds a chronological internal note to the lead record."""
    dealer_id = actor["dealer_id"]
    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        return None

    actor_name = f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or actor.get("email", "Staff User")
    now_iso = datetime.now(timezone.utc).isoformat()

    note = {
        "id": f"note-{uuid.uuid4().hex[:8]}",
        "lead_id": lead_id,
        "dealer_id": dealer_id,
        "author_id": actor.get("id"),
        "author_name": actor_name,
        "author_role": actor.get("staff_role", "SALES_EXECUTIVE"),
        "content": content.strip(),
        "created_at": now_iso,
    }

    LEAD_NOTES_DB.append(note)
    lead["notes_count"] = lead.get("notes_count", 0) + 1
    lead["updated_at"] = now_iso

    record_lead_activity(
        lead_id=lead_id,
        dealer_id=dealer_id,
        action="NOTE_ADDED",
        details=f"Internal note added: {content[:60]}{'...' if len(content) > 60 else ''}",
        actor=actor,
    )

    return note


def get_lead_notes(lead_id: str, dealer_id: str) -> List[Dict[str, Any]]:
    """Retrieves all internal notes for a lead in chronological order."""
    notes = [
        n for n in LEAD_NOTES_DB
        if n.get("lead_id") == lead_id and n.get("dealer_id") == dealer_id
    ]
    notes.sort(key=lambda x: x["created_at"])
    return notes


def get_lead_activities(lead_id: str, dealer_id: str) -> List[Dict[str, Any]]:
    """Retrieves the immutable audit history for a lead in reverse chronological order."""
    acts = [
        a for a in LEAD_ACTIVITIES_DB
        if a.get("lead_id") == lead_id and a.get("dealer_id") == dealer_id
    ]
    acts.sort(key=lambda x: x["timestamp"], reverse=True)
    return acts

