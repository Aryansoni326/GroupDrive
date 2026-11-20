from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
from src.core.identity_store import BRANCHES_DB, USERS_DB

FOLLOW_UP_TYPES = [
    "CALL",
    "TEST_DRIVE",
    "HOME_VISIT",
    "DOCUMENTATION",
    "PAYMENT",
    "SHOWROOM_VISIT",
]

FOLLOW_UP_PRIORITIES = ["HIGH", "MEDIUM", "LOW"]
FOLLOW_UP_STATUSES = ["PENDING", "COMPLETED", "OVERDUE", "CANCELLED"]

APPOINTMENT_TYPES = [
    "SHOWROOM_VISIT",
    "TEST_DRIVE",
    "PRICE_NEGOTIATION",
    "VEHICLE_DELIVERY",
    "DOCUMENT_SIGNING",
]

APPOINTMENT_STATUSES = [
    "SCHEDULED",
    "CONFIRMED",
    "COMPLETED",
    "RESCHEDULED",
    "CANCELLED",
    "NO_SHOW",
]

APPOINTMENT_OUTCOMES = [
    "TEST_DRIVE_TAKEN",
    "BOOKING_CONFIRMED",
    "QUOTATION_ISSUED",
    "FOLLOW_UP_REQUIRED",
    "NOT_INTERESTED",
    "NO_SHOW",
]

# Master Database for Follow-ups
FOLLOW_UPS_MASTER_DB: List[Dict[str, Any]] = [
    # Today's follow-ups (2026-11-07)
    {
        "id": "flw-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "enquiry_id": "enq-001",
        "lead_id": "lead-001",
        "customer_name": "Karthik Subramanian",
        "customer_phone": "+919845112233",
        "customer_email": "karthik.s@gmail.com",
        "interested_model": "Maruti Suzuki Brezza",
        "scheduled_at": "2026-11-07T11:00:00Z",
        "follow_up_type": "CALL",
        "priority": "HIGH",
        "status": "PENDING",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "notes": "Confirm booking deposit after Brezza group reverse quote submission.",
        "reminder_at": "2026-11-07T10:45:00Z",
        "reminder_minutes_before": 15,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "created_at": "2026-11-06T10:35:00Z",
        "updated_at": "2026-11-06T10:35:00Z",
    },
    {
        "id": "flw-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "enquiry_id": "enq-002",
        "lead_id": "lead-002",
        "customer_name": "Ananya Deshmukh",
        "customer_phone": "+919845223344",
        "customer_email": "ananya.d@outlook.com",
        "interested_model": "Maruti Suzuki Swift 2026",
        "scheduled_at": "2026-11-07T15:30:00Z",
        "follow_up_type": "TEST_DRIVE",
        "priority": "HIGH",
        "status": "PENDING",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "notes": "Bring Swift ZXi test drive vehicle to Prestige Shantiniketan gate 2.",
        "reminder_at": "2026-11-07T15:00:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "created_at": "2026-11-06T09:30:00Z",
        "updated_at": "2026-11-06T09:30:00Z",
    },
    {
        "id": "flw-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "enquiry_id": "enq-003",
        "lead_id": "lead-003",
        "customer_name": "Rohan Mehra",
        "customer_phone": "+919845334455",
        "customer_email": "rohan.m@yahoo.com",
        "interested_model": "Maruti Suzuki Grand Vitara",
        "scheduled_at": "2026-11-07T14:00:00Z",
        "follow_up_type": "DOCUMENTATION",
        "priority": "MEDIUM",
        "status": "PENDING",
        "assigned_to_id": "usr-deepa-06",
        "assigned_to_name": "Deepa Rao",
        "notes": "Collect HDFC Bank loan sanction letter and sign delivery mandate.",
        "reminder_at": "2026-11-07T13:30:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "created_at": "2026-11-05T17:00:00Z",
        "updated_at": "2026-11-05T17:00:00Z",
    },
    # Overdue follow-ups
    {
        "id": "flw-010",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "enquiry_id": None,
        "lead_id": "lead-007",
        "customer_name": "Sunita Rao",
        "customer_phone": "+919845778899",
        "customer_email": "sunita.rao@wipro.com",
        "interested_model": "Maruti Suzuki Baleno",
        "scheduled_at": "2026-11-05T10:00:00Z",
        "follow_up_type": "CALL",
        "priority": "HIGH",
        "status": "PENDING",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "notes": "Check on color preference and delivery timeline for Celestial Blue.",
        "reminder_at": "2026-11-05T09:30:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "created_at": "2026-11-04T10:00:00Z",
        "updated_at": "2026-11-04T10:00:00Z",
    },
    {
        "id": "flw-011",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "enquiry_id": None,
        "lead_id": None,
        "customer_name": "Deepak Joshi",
        "customer_phone": "+919845114477",
        "customer_email": "deepak.j@gmail.com",
        "interested_model": "Maruti Suzuki Ertiga",
        "scheduled_at": "2026-11-06T16:00:00Z",
        "follow_up_type": "CALL",
        "priority": "MEDIUM",
        "status": "PENDING",
        "assigned_to_id": "usr-priya-03",
        "assigned_to_name": "Priya Nair",
        "notes": "Verify stock allocation for commercial registration permit KA-03.",
        "reminder_at": "2026-11-06T15:30:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "created_at": "2026-11-05T12:00:00Z",
        "updated_at": "2026-11-05T12:00:00Z",
    },
    # Upcoming follow-ups
    {
        "id": "flw-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "enquiry_id": "enq-004",
        "lead_id": "lead-004",
        "customer_name": "Siddharth Verma",
        "customer_phone": "+919845445566",
        "customer_email": "siddharth.v@tcs.com",
        "interested_model": "Maruti Suzuki Fronx",
        "scheduled_at": "2026-11-08T10:00:00Z",
        "follow_up_type": "CALL",
        "priority": "MEDIUM",
        "status": "PENDING",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "notes": "Provide valuation quote on used 2018 Baleno for Fronx upgrade.",
        "reminder_at": "2026-11-08T09:30:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "created_at": "2026-11-06T11:15:00Z",
        "updated_at": "2026-11-06T11:15:00Z",
    },
    {
        "id": "flw-012",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "enquiry_id": "enq-005",
        "lead_id": "lead-005",
        "customer_name": "Meera Krishnan",
        "customer_phone": "+919845556677",
        "customer_email": "meera.k@gmail.com",
        "interested_model": "Maruti Suzuki Brezza",
        "scheduled_at": "2026-11-09T11:30:00Z",
        "follow_up_type": "SHOWROOM_VISIT",
        "priority": "HIGH",
        "status": "PENDING",
        "assigned_to_id": "usr-deepa-06",
        "assigned_to_name": "Deepa Rao",
        "notes": "Pre-delivery inspection verification with customer before registration.",
        "reminder_at": "2026-11-09T10:30:00Z",
        "reminder_minutes_before": 60,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "created_at": "2026-11-05T16:00:00Z",
        "updated_at": "2026-11-05T16:00:00Z",
    },
    # Completed follow-ups
    {
        "id": "flw-020",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "enquiry_id": None,
        "lead_id": "lead-006",
        "customer_name": "Rajesh Nair",
        "customer_phone": "+919845667788",
        "customer_email": "rajesh.nair@infosys.com",
        "interested_model": "Maruti Suzuki Ertiga",
        "scheduled_at": "2026-11-06T15:30:00Z",
        "follow_up_type": "CALL",
        "priority": "HIGH",
        "status": "COMPLETED",
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "notes": "Final price negotiation call regarding accessories package.",
        "reminder_at": "2026-11-06T15:00:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": "Agreed on corporate scheme discount. Customer ready for token advance.",
        "completed_at": "2026-11-06T16:00:00Z",
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "created_at": "2026-11-05T10:00:00Z",
        "updated_at": "2026-11-06T16:00:00Z",
    },
    # Rival Dealership Follow-up (Multi-tenant security testing)
    {
        "id": "flw-901",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "enquiry_id": "enq-901",
        "lead_id": "lead-901",
        "customer_name": "Vikram Seth",
        "customer_phone": "+919845998877",
        "customer_email": "vikram.s@advaith.com",
        "interested_model": "Hyundai Creta",
        "scheduled_at": "2026-11-07T12:00:00Z",
        "follow_up_type": "CALL",
        "priority": "HIGH",
        "status": "PENDING",
        "assigned_to_id": "usr-sunil-07",
        "assigned_to_name": "Sunil Reddy",
        "notes": "Creta waiting period update strictly inside Advaith Hyundai.",
        "reminder_at": "2026-11-07T11:30:00Z",
        "reminder_minutes_before": 30,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": "usr-sunil-07",
        "created_by_name": "Sunil Reddy",
        "created_at": "2026-11-06T11:00:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
]

# Master Database for Appointments & Showroom Visits
APPOINTMENTS_MASTER_DB: List[Dict[str, Any]] = [
    {
        "id": "app-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "lead_id": "lead-002",
        "customer_name": "Ananya Deshmukh",
        "customer_phone": "+919845223344",
        "customer_email": "ananya.d@outlook.com",
        "interested_model": "Maruti Suzuki Swift 2026",
        "appointment_type": "TEST_DRIVE",
        "appointment_time": "2026-11-07T15:30:00Z",
        "duration_minutes": 45,
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "status": "CONFIRMED",
        "notes": "Home test drive booked at Prestige Shantiniketan gate 2.",
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": None,
        "outcome_notes": None,
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "created_at": "2026-11-06T09:30:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
    {
        "id": "app-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "lead_id": "lead-001",
        "customer_name": "Karthik Subramanian",
        "customer_phone": "+919845112233",
        "customer_email": "karthik.s@gmail.com",
        "interested_model": "Maruti Suzuki Brezza",
        "appointment_type": "SHOWROOM_VISIT",
        "appointment_time": "2026-11-08T11:00:00Z",
        "duration_minutes": 60,
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "status": "SCHEDULED",
        "notes": "Showroom visit with family to inspect Brezza ZXi Plus Pearl White.",
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": None,
        "outcome_notes": None,
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "created_at": "2026-11-06T10:45:00Z",
        "updated_at": "2026-11-06T10:45:00Z",
    },
    {
        "id": "app-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "lead_id": "lead-003",
        "customer_name": "Rohan Mehra",
        "customer_phone": "+919845334455",
        "customer_email": "rohan.m@yahoo.com",
        "interested_model": "Maruti Suzuki Grand Vitara",
        "appointment_type": "DOCUMENT_SIGNING",
        "appointment_time": "2026-11-07T14:00:00Z",
        "duration_minutes": 30,
        "assigned_to_id": "usr-deepa-06",
        "assigned_to_name": "Deepa Rao",
        "assigned_to_role": "FINANCE_EXECUTIVE",
        "status": "CONFIRMED",
        "notes": "Signing SBI auto loan agreement and verification of address documents.",
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": None,
        "outcome_notes": None,
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "created_at": "2026-11-05T17:00:00Z",
        "updated_at": "2026-11-06T14:15:00Z",
    },
    {
        "id": "app-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "lead_id": "lead-005",
        "customer_name": "Meera Krishnan",
        "customer_phone": "+919845556677",
        "customer_email": "meera.k@gmail.com",
        "interested_model": "Maruti Suzuki Brezza",
        "appointment_type": "SHOWROOM_VISIT",
        "appointment_time": "2026-11-05T15:00:00Z",
        "duration_minutes": 60,
        "assigned_to_id": "usr-deepa-06",
        "assigned_to_name": "Deepa Rao",
        "assigned_to_role": "FINANCE_EXECUTIVE",
        "status": "COMPLETED",
        "notes": "Discussion on group purchase token and vehicle allocation.",
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": "BOOKING_CONFIRMED",
        "outcome_notes": "Booking voucher VCHR-BRZ-7821 verified and token advance collected.",
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "created_at": "2026-11-04T15:00:00Z",
        "updated_at": "2026-11-05T16:00:00Z",
    },
    {
        "id": "app-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "lead_id": "lead-006",
        "customer_name": "Rajesh Nair",
        "customer_phone": "+919845667788",
        "customer_email": "rajesh.nair@infosys.com",
        "interested_model": "Maruti Suzuki Ertiga",
        "appointment_type": "PRICE_NEGOTIATION",
        "appointment_time": "2026-11-09T10:30:00Z",
        "duration_minutes": 45,
        "assigned_to_id": "usr-amit-04",
        "assigned_to_name": "Amit Patel",
        "assigned_to_role": "SALES_EXECUTIVE",
        "status": "SCHEDULED",
        "notes": "Review Ertiga ZXi AT corporate discount and insurance renewal terms.",
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": None,
        "outcome_notes": None,
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "created_at": "2026-11-06T15:30:00Z",
        "updated_at": "2026-11-06T15:30:00Z",
    },
    # Rival Dealership Appointment (For tenant isolation testing)
    {
        "id": "app-901",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "lead_id": "lead-901",
        "customer_name": "Vikram Seth",
        "customer_phone": "+919845998877",
        "customer_email": "vikram.s@advaith.com",
        "interested_model": "Hyundai Creta",
        "appointment_type": "SHOWROOM_VISIT",
        "appointment_time": "2026-11-07T16:00:00Z",
        "duration_minutes": 45,
        "assigned_to_id": "usr-sunil-07",
        "assigned_to_name": "Sunil Reddy",
        "assigned_to_role": "BRANCH_MANAGER",
        "status": "CONFIRMED",
        "notes": "Creta test drive and finance eligibility review.",
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": None,
        "outcome_notes": None,
        "created_by_id": "usr-sunil-07",
        "created_by_name": "Sunil Reddy",
        "created_at": "2026-11-06T11:00:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
]

# Helper function to compute overdue status dynamically
def update_dynamic_overdue_statuses(items: List[Dict[str, Any]]) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    for item in items:
        if item.get("status") == "PENDING" and item.get("scheduled_at"):
            if item["scheduled_at"] < now_iso:
                # Still consider it pending in database or display overdue
                pass


def is_today(iso_string: str) -> bool:
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        # Fixed simulation date or dynamic date
        now = datetime.now(timezone.utc)
        # Check against simulation anchor 2026-11-07 or current day
        return dt.strftime("%Y-%m-%d") in ["2026-11-07", now.strftime("%Y-%m-%d")]
    except Exception:
        return False


def is_overdue(iso_string: str) -> bool:
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        # Simulation anchor: 2026-11-07T14:30:00Z
        anchor = datetime(2026, 11, 7, 14, 30, 0, tzinfo=timezone.utc)
        return dt < anchor
    except Exception:
        return False


def query_follow_ups(
    dealer_id: str,
    branch_id: Optional[str] = None,
    bucket: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
    follow_up_type: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    search: Optional[str] = None,
    user_role: Optional[str] = None,
    user_id: Optional[str] = None,
    user_branch_id: Optional[str] = None,
    scope: str = "my",
) -> List[Dict[str, Any]]:
    """
    Queries follow-ups scoped strictly to the dealer tenant and role.
    Bucket values: "today", "overdue", "upcoming", "completed", "all".
    Scope values: "my" (personal assigned), "team" (branch/dealership).
    """
    results = [f for f in FOLLOW_UPS_MASTER_DB if f["dealer_id"] == dealer_id]

    # Branch-level isolation for non-owners
    if user_role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE", "FINANCE_EXECUTIVE", "INVENTORY_MANAGER"]:
        if user_branch_id:
            results = [f for f in results if f.get("branch_id") == user_branch_id]
    elif branch_id and branch_id != "all":
        results = [f for f in results if f.get("branch_id") == branch_id]

    # Scope filtering: "my" filters by assigned_to_id == user_id
    if scope == "my" and user_id:
        results = [f for f in results if f.get("assigned_to_id") == user_id]
    elif scope == "team" and user_role == "SALES_EXECUTIVE" and user_id:
        # Sales executives can only view their own + unassigned items in their branch
        results = [f for f in results if f.get("assigned_to_id") in [user_id, None]]

    # Bucket filtering
    if bucket == "today":
        results = [f for f in results if is_today(f.get("scheduled_at", "")) and f.get("status") != "CANCELLED"]
    elif bucket == "overdue":
        results = [f for f in results if is_overdue(f.get("scheduled_at", "")) and f.get("status") == "PENDING"]
    elif bucket == "upcoming":
        results = [f for f in results if not is_today(f.get("scheduled_at", "")) and not is_overdue(f.get("scheduled_at", "")) and f.get("status") == "PENDING"]
    elif bucket == "completed":
        results = [f for f in results if f.get("status") == "COMPLETED"]

    # Other query filters
    if assigned_to_id and assigned_to_id != "all":
        if assigned_to_id == "unassigned":
            results = [f for f in results if f.get("assigned_to_id") is None]
        else:
            results = [f for f in results if f.get("assigned_to_id") == assigned_to_id]

    if follow_up_type and follow_up_type != "all":
        results = [f for f in results if f.get("follow_up_type") == follow_up_type]

    if priority and priority != "all":
        results = [f for f in results if f.get("priority") == priority]

    if status and status != "all":
        results = [f for f in results if f.get("status") == status]

    if lead_id:
        results = [f for f in results if f.get("lead_id") == lead_id]

    if search:
        s = search.lower().strip()
        results = [
            f for f in results
            if s in f.get("customer_name", "").lower()
            or s in f.get("customer_phone", "").lower()
            or s in (f.get("customer_email") or "").lower()
            or s in (f.get("interested_model") or "").lower()
            or s in f.get("notes", "").lower()
            or s in f.get("id", "").lower()
        ]

    # Sort chronological by scheduled_at
    results.sort(key=lambda x: x.get("scheduled_at", ""))
    return results


def get_follow_up_by_id(follow_up_id: str, dealer_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a specific follow-up ensuring tenant isolation."""
    for f in FOLLOW_UPS_MASTER_DB:
        if f["id"] == follow_up_id and f["dealer_id"] == dealer_id:
            return f
    return None


def create_follow_up(payload: Dict[str, Any], actor: Dict[str, Any]) -> Dict[str, Any]:
    """
    Creates a new customer follow-up. Prevents duplicate follow-ups at the same timestamp.
    """
    dealer_id = actor["dealer_id"]
    branch_id = payload.get("branch_id")
    customer_phone = payload.get("customer_phone")
    scheduled_at = payload.get("scheduled_at")
    follow_up_type = payload.get("follow_up_type", "CALL")

    # Duplicate check: check if an identical follow-up exists for same customer at same time
    for existing in FOLLOW_UPS_MASTER_DB:
        if (
            existing["dealer_id"] == dealer_id
            and existing["customer_phone"] == customer_phone
            and existing["scheduled_at"] == scheduled_at
            and existing["follow_up_type"] == follow_up_type
            and existing["status"] == "PENDING"
        ):
            raise ValueError(f"A pending {follow_up_type} follow-up for {customer_phone} is already scheduled at {scheduled_at}.")

    branch = BRANCHES_DB.get(branch_id, {})
    branch_name = branch.get("branch_name", "Primary Showroom")
    actor_name = f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or actor.get("email", "Staff User")
    now_iso = datetime.now(timezone.utc).isoformat()

    assigned_to_id = payload.get("assigned_to_id")
    assigned_to_name = None
    if assigned_to_id:
        target_user = None
        for u in USERS_DB.values():
            if u.get("id") == assigned_to_id and u.get("dealer_id") == dealer_id:
                target_user = u
                break
        if target_user:
            assigned_to_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()

    # Calculate reminder_at
    reminder_minutes = payload.get("reminder_minutes_before")
    reminder_at = None
    if reminder_minutes and scheduled_at:
        try:
            dt = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
            rem_dt = dt - timedelta(minutes=int(reminder_minutes))
            reminder_at = rem_dt.isoformat()
        except Exception:
            pass

    follow_up_id = f"flw-{uuid.uuid4().hex[:6]}"
    new_follow_up = {
        "id": follow_up_id,
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "enquiry_id": payload.get("enquiry_id"),
        "lead_id": payload.get("lead_id"),
        "customer_name": payload.get("customer_name"),
        "customer_phone": payload.get("customer_phone"),
        "customer_email": payload.get("customer_email"),
        "interested_model": payload.get("interested_model"),
        "scheduled_at": scheduled_at,
        "follow_up_type": follow_up_type,
        "priority": payload.get("priority", "MEDIUM"),
        "status": "PENDING",
        "assigned_to_id": assigned_to_id,
        "assigned_to_name": assigned_to_name,
        "notes": payload.get("notes", ""),
        "reminder_at": reminder_at,
        "reminder_minutes_before": reminder_minutes,
        "completion_notes": None,
        "completed_at": None,
        "created_by_id": actor.get("id"),
        "created_by_name": actor_name,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    FOLLOW_UPS_MASTER_DB.insert(0, new_follow_up)
    return new_follow_up


def update_follow_up(follow_up_id: str, updates: Dict[str, Any], actor: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates attributes of a follow-up."""
    flw = get_follow_up_by_id(follow_up_id, actor["dealer_id"])
    if not flw:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    fields = ["scheduled_at", "follow_up_type", "priority", "notes", "status", "completion_notes"]
    for f in fields:
        if f in updates and updates[f] is not None:
            flw[f] = updates[f]

    if "assigned_to_id" in updates and updates["assigned_to_id"]:
        target_id = updates["assigned_to_id"]
        for u in USERS_DB.values():
            if u.get("id") == target_id and u.get("dealer_id") == actor["dealer_id"]:
                flw["assigned_to_id"] = target_id
                flw["assigned_to_name"] = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
                break

    if "reminder_minutes_before" in updates and updates["reminder_minutes_before"] is not None:
        rem_min = int(updates["reminder_minutes_before"])
        flw["reminder_minutes_before"] = rem_min
        try:
            dt = datetime.fromisoformat(flw["scheduled_at"].replace("Z", "+00:00"))
            flw["reminder_at"] = (dt - timedelta(minutes=rem_min)).isoformat()
        except Exception:
            pass

    flw["updated_at"] = now_iso
    return flw


def complete_follow_up(follow_up_id: str, completion_notes: str, actor: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Marks a follow-up as completed with outcome notes."""
    flw = get_follow_up_by_id(follow_up_id, actor["dealer_id"])
    if not flw:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    flw["status"] = "COMPLETED"
    flw["completion_notes"] = completion_notes.strip()
    flw["completed_at"] = now_iso
    flw["updated_at"] = now_iso
    return flw


def reschedule_follow_up(follow_up_id: str, new_scheduled_at: str, notes: Optional[str], actor: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Reschedules a follow-up to a new due date and time."""
    flw = get_follow_up_by_id(follow_up_id, actor["dealer_id"])
    if not flw:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    flw["scheduled_at"] = new_scheduled_at
    flw["status"] = "PENDING"
    if notes and notes.strip():
        flw["notes"] = f"{flw.get('notes', '')}\n[Rescheduled on {now_iso[:10]}]: {notes.strip()}".strip()

    # Recalculate reminder if present
    if flw.get("reminder_minutes_before"):
        try:
            dt = datetime.fromisoformat(new_scheduled_at.replace("Z", "+00:00"))
            flw["reminder_at"] = (dt - timedelta(minutes=flw["reminder_minutes_before"])).isoformat()
        except Exception:
            pass

    flw["updated_at"] = now_iso
    return flw


# Appointment Operations

def query_appointments(
    dealer_id: str,
    branch_id: Optional[str] = None,
    bucket: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
    appointment_type: Optional[str] = None,
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    search: Optional[str] = None,
    user_role: Optional[str] = None,
    user_id: Optional[str] = None,
    user_branch_id: Optional[str] = None,
    scope: str = "my",
) -> List[Dict[str, Any]]:
    """
    Queries showroom appointments scoped to dealership and role permissions.
    """
    results = [a for a in APPOINTMENTS_MASTER_DB if a["dealer_id"] == dealer_id]

    if user_role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE", "FINANCE_EXECUTIVE", "INVENTORY_MANAGER"]:
        if user_branch_id:
            results = [a for a in results if a.get("branch_id") == user_branch_id]
    elif branch_id and branch_id != "all":
        results = [a for a in results if a.get("branch_id") == branch_id]

    if scope == "my" and user_id:
        results = [a for a in results if a.get("assigned_to_id") == user_id]
    elif scope == "team" and user_role == "SALES_EXECUTIVE" and user_id:
        results = [a for a in results if a.get("assigned_to_id") in [user_id, None]]

    if bucket == "today":
        results = [a for a in results if is_today(a.get("appointment_time", "")) and a.get("status") not in ["CANCELLED", "NO_SHOW"]]
    elif bucket == "upcoming":
        results = [a for a in results if not is_today(a.get("appointment_time", "")) and not is_overdue(a.get("appointment_time", "")) and a.get("status") in ["SCHEDULED", "CONFIRMED", "RESCHEDULED"]]
    elif bucket == "past":
        results = [a for a in results if is_overdue(a.get("appointment_time", "")) or a.get("status") in ["COMPLETED", "CANCELLED", "NO_SHOW"]]

    if assigned_to_id and assigned_to_id != "all":
        results = [a for a in results if a.get("assigned_to_id") == assigned_to_id]

    if appointment_type and appointment_type != "all":
        results = [a for a in results if a.get("appointment_type") == appointment_type]

    if status and status != "all":
        results = [a for a in results if a.get("status") == status]

    if lead_id:
        results = [a for a in results if a.get("lead_id") == lead_id]

    if search:
        s = search.lower().strip()
        results = [
            a for a in results
            if s in a.get("customer_name", "").lower()
            or s in a.get("customer_phone", "").lower()
            or s in (a.get("customer_email") or "").lower()
            or s in (a.get("interested_model") or "").lower()
            or s in (a.get("notes") or "").lower()
            or s in a.get("id", "").lower()
        ]

    results.sort(key=lambda x: x.get("appointment_time", ""))
    return results


def get_appointment_by_id(appointment_id: str, dealer_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves an appointment by ID ensuring tenant isolation."""
    for a in APPOINTMENTS_MASTER_DB:
        if a["id"] == appointment_id and a["dealer_id"] == dealer_id:
            return a
    return None


def create_appointment(payload: Dict[str, Any], actor: Dict[str, Any]) -> Dict[str, Any]:
    """
    Schedules a new showroom visit or test drive appointment.
    Prevents duplicate booking for the same customer phone and exact appointment time.
    """
    dealer_id = actor["dealer_id"]
    branch_id = payload.get("branch_id")
    customer_phone = payload.get("customer_phone")
    appointment_time = payload.get("appointment_time")

    for existing in APPOINTMENTS_MASTER_DB:
        if (
            existing["dealer_id"] == dealer_id
            and existing["customer_phone"] == customer_phone
            and existing["appointment_time"] == appointment_time
            and existing["status"] not in ["CANCELLED", "NO_SHOW"]
        ):
            raise ValueError(f"An active appointment for {customer_phone} is already scheduled at {appointment_time}.")

    branch = BRANCHES_DB.get(branch_id, {})
    branch_name = branch.get("branch_name", "Primary Showroom")
    actor_name = f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or actor.get("email", "Staff User")
    now_iso = datetime.now(timezone.utc).isoformat()

    assigned_to_id = payload.get("assigned_to_id") or actor.get("id")
    assigned_to_name = None
    assigned_to_role = None

    if assigned_to_id:
        for u in USERS_DB.values():
            if u.get("id") == assigned_to_id and u.get("dealer_id") == dealer_id:
                assigned_to_name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
                assigned_to_role = u.get("staff_role")
                break

    app_id = f"app-{uuid.uuid4().hex[:6]}"
    new_app = {
        "id": app_id,
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "lead_id": payload.get("lead_id"),
        "customer_name": payload.get("customer_name"),
        "customer_phone": payload.get("customer_phone"),
        "customer_email": payload.get("customer_email"),
        "interested_model": payload.get("interested_model"),
        "appointment_type": payload.get("appointment_type", "SHOWROOM_VISIT"),
        "appointment_time": appointment_time,
        "duration_minutes": payload.get("duration_minutes", 45),
        "assigned_to_id": assigned_to_id,
        "assigned_to_name": assigned_to_name,
        "assigned_to_role": assigned_to_role,
        "status": "SCHEDULED",
        "notes": payload.get("notes", ""),
        "reschedule_reason": None,
        "cancel_reason": None,
        "visit_outcome": None,
        "outcome_notes": None,
        "created_by_id": actor.get("id"),
        "created_by_name": actor_name,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    APPOINTMENTS_MASTER_DB.insert(0, new_app)
    return new_app


def reschedule_appointment(
    appointment_id: str,
    new_time: str,
    reschedule_reason: str,
    actor: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Reschedules an appointment with audit reason."""
    app = get_appointment_by_id(appointment_id, actor["dealer_id"])
    if not app:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    app["appointment_time"] = new_time
    app["status"] = "RESCHEDULED"
    app["reschedule_reason"] = reschedule_reason.strip()
    app["updated_at"] = now_iso
    return app


def cancel_appointment(
    appointment_id: str,
    cancel_reason: str,
    actor: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Cancels an appointment with audit reason."""
    app = get_appointment_by_id(appointment_id, actor["dealer_id"])
    if not app:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    app["status"] = "CANCELLED"
    app["cancel_reason"] = cancel_reason.strip()
    app["updated_at"] = now_iso
    return app


def complete_appointment(
    appointment_id: str,
    visit_outcome: str,
    outcome_notes: str,
    actor: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Records the visit outcome and marks appointment complete."""
    app = get_appointment_by_id(appointment_id, actor["dealer_id"])
    if not app:
        return None

    now_iso = datetime.now(timezone.utc).isoformat()
    app["status"] = "COMPLETED"
    app["visit_outcome"] = visit_outcome
    app["outcome_notes"] = outcome_notes.strip()
    app["updated_at"] = now_iso
    return app


def get_follow_up_summary(
    dealer_id: str,
    user_id: str,
    user_role: str,
    user_branch_id: Optional[str] = None,
) -> Dict[str, int]:
    """Computes quick summary metrics for follow-ups and tasks."""
    user_follow_ups = [f for f in FOLLOW_UPS_MASTER_DB if f["dealer_id"] == dealer_id]
    if user_role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        user_follow_ups = [f for f in user_follow_ups if f.get("branch_id") == user_branch_id]

    today_count = len([f for f in user_follow_ups if is_today(f.get("scheduled_at", "")) and f.get("status") != "CANCELLED"])
    overdue_count = len([f for f in user_follow_ups if is_overdue(f.get("scheduled_at", "")) and f.get("status") == "PENDING"])
    upcoming_count = len([f for f in user_follow_ups if not is_today(f.get("scheduled_at", "")) and not is_overdue(f.get("scheduled_at", "")) and f.get("status") == "PENDING"])
    completed_count = len([f for f in user_follow_ups if f.get("status") == "COMPLETED"])

    my_tasks_count = len([f for f in user_follow_ups if f.get("assigned_to_id") == user_id and f.get("status") == "PENDING"])
    team_tasks_count = len([f for f in user_follow_ups if f.get("status") == "PENDING"])

    return {
        "today_count": today_count,
        "overdue_count": overdue_count,
        "upcoming_count": upcoming_count,
        "completed_count": completed_count,
        "my_tasks_count": my_tasks_count,
        "team_tasks_count": team_tasks_count,
    }

