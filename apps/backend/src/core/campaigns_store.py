import copy
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from src.core.identity_store import BRANCHES_DB

# In-Memory Campaigns Database
CAMPAIGNS_DB: Dict[str, Dict[str, Any]] = {
    "cmp-kalyani-001": {
        "id": "cmp-kalyani-001",
        "campaign_code": "GD-CMP-2026-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": None,
        "title": "Festive Season Brezza Flash Offer",
        "description": "Special festive campaign for Brezza ZXi and ZXi Plus Petrol with upfront price discount, free corporate styling pack, and extended 3-year warranty.",
        "campaign_type": "CASH_DISCOUNT",
        "status": "ACTIVE",
        "eligible_models": ["Brezza"],
        "eligible_variants": ["ZXi", "ZXi Plus"],
        "offer_details": {
            "discount_amount": 45000,
            "free_accessories_description": "Chrome garnish styling kit and all-weather 3D floor mats",
            "warranty_years": 3,
            "exchange_bonus_amount": 15000,
            "interest_rate_pct": 7.99,
            "terms_and_conditions": "Valid for retail bookings delivered within campaign period. Cannot be combined with institutional fleet quotes.",
        },
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "is_active": True,
        "is_sponsored": True,
        "sponsored_label": "Showroom Spotlight",
        "origin": "DEALER",
        "performance": {
            "impressions": 1850,
            "clicks": 420,
            "enquiries_generated": 68,
            "test_drives_booked": 34,
            "bookings_converted": 12,
            "conversion_rate_pct": 17.6,
        },
        "created_by_id": "usr-ramesh-01",
        "created_by_name": "Ramesh Kalyani",
        "created_at": "2026-10-01T10:00:00Z",
        "updated_at": "2026-10-01T10:00:00Z",
    },
    "cmp-kalyani-002": {
        "id": "cmp-kalyani-002",
        "campaign_code": "GD-CMP-2026-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "title": "Swift 2026 Tech Corridor Launch Package",
        "description": "Whitefield branch exclusive bundle offering complimentary accessories and 5-year extended warranty for IT corridor customers.",
        "campaign_type": "ACCESSORY_BUNDLE",
        "status": "ACTIVE",
        "eligible_models": ["Swift 2026"],
        "eligible_variants": ["ZXi", "ZXi Plus", "VXi"],
        "offer_details": {
            "discount_amount": 25000,
            "free_accessories_description": "Complete 7-piece styling kit, Dashcam, and 3M Underbody coating",
            "warranty_years": 5,
            "exchange_bonus_amount": 10000,
            "terms_and_conditions": "Applicable exclusively for delivery at Kalyani Motors Whitefield branch.",
        },
        "valid_from": "2026-02-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "is_active": True,
        "is_sponsored": False,
        "origin": "DEALER",
        "performance": {
            "impressions": 1240,
            "clicks": 310,
            "enquiries_generated": 45,
            "test_drives_booked": 22,
            "bookings_converted": 8,
            "conversion_rate_pct": 17.8,
        },
        "created_by_id": "usr-rajesh-02",
        "created_by_name": "Rajesh Sharma",
        "created_at": "2026-10-05T14:30:00Z",
        "updated_at": "2026-10-05T14:30:00Z",
    },
    "cmp-kalyani-003": {
        "id": "cmp-kalyani-003",
        "campaign_code": "GD-CMP-2026-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "title": "Grand Vitara Hybrid Mega Upgrade Bonanza",
        "description": "High-value exchange bonus and low 6.99% finance rate for Grand Vitara Strong Hybrid variants.",
        "campaign_type": "EXCHANGE_BONUS",
        "status": "SCHEDULED",
        "eligible_models": ["Grand Vitara"],
        "eligible_variants": ["Alpha Plus Hybrid", "Zeta Plus Hybrid"],
        "offer_details": {
            "discount_amount": 35000,
            "exchange_bonus_amount": 50000,
            "interest_rate_pct": 6.99,
            "free_accessories_description": "Aerodynamic rear spoiler and illuminated sill guards",
            "terms_and_conditions": "Old vehicle exchange mandatory. Evaluated on spot at Bannerghatta branch.",
        },
        "valid_from": "2027-01-01T00:00:00Z",
        "valid_until": "2027-03-31T23:59:59Z",
        "is_active": True,
        "is_sponsored": True,
        "sponsored_label": "Featured Deal",
        "origin": "DEALER",
        "performance": {
            "impressions": 0,
            "clicks": 0,
            "enquiries_generated": 0,
            "test_drives_booked": 0,
            "bookings_converted": 0,
            "conversion_rate_pct": 0.0,
        },
        "created_by_id": "usr-deepa-06",
        "created_by_name": "Deepa Rao",
        "created_at": "2026-10-12T09:15:00Z",
        "updated_at": "2026-10-12T09:15:00Z",
    },
    "cmp-kalyani-004": {
        "id": "cmp-kalyani-004",
        "campaign_code": "GD-CMP-2026-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": None,
        "title": "Monsoon Pre-Registration Clearance",
        "description": "Inventory clearance discounts on previous quarter Fronx and Brezza inventory.",
        "campaign_type": "AGING_STOCK_CLEARANCE",
        "status": "EXPIRED",
        "eligible_models": ["Fronx", "Brezza"],
        "eligible_variants": ["Delta", "ZXi"],
        "offer_details": {
            "discount_amount": 60000,
            "exchange_bonus_amount": 20000,
            "terms_and_conditions": "Limited stock clearance only. First come first served.",
        },
        "valid_from": "2025-06-01T00:00:00Z",
        "valid_until": "2025-09-30T23:59:59Z",
        "is_active": False,
        "is_sponsored": False,
        "origin": "DEALER",
        "performance": {
            "impressions": 3400,
            "clicks": 890,
            "enquiries_generated": 112,
            "test_drives_booked": 58,
            "bookings_converted": 24,
            "conversion_rate_pct": 21.4,
        },
        "created_by_id": "usr-ramesh-01",
        "created_by_name": "Ramesh Kalyani",
        "created_at": "2025-05-20T11:00:00Z",
        "updated_at": "2025-10-01T00:00:00Z",
    },
    "cmp-kalyani-005": {
        "id": "cmp-kalyani-005",
        "campaign_code": "GD-CMP-2026-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": None,
        "title": "Group Purchasing Volume Tier Drive",
        "description": "Tiered progressive discounts for verified GroupDrive corporate pools with 5+ members.",
        "campaign_type": "VOLUME_TIER_DISCOUNT",
        "status": "PAUSED",
        "eligible_models": ["Brezza", "Swift 2026", "Grand Vitara"],
        "eligible_variants": [],
        "offer_details": {
            "min_group_size": 5,
            "discount_amount": 55000,
            "warranty_years": 2,
            "terms_and_conditions": "Minimum pool of 5 buyers required to activate tiered pricing.",
        },
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "is_active": False,
        "is_sponsored": False,
        "origin": "DEALER",
        "performance": {
            "impressions": 980,
            "clicks": 210,
            "enquiries_generated": 29,
            "test_drives_booked": 14,
            "bookings_converted": 5,
            "conversion_rate_pct": 17.2,
        },
        "created_by_id": "usr-rajesh-02",
        "created_by_name": "Rajesh Sharma",
        "created_at": "2026-08-15T16:00:00Z",
        "updated_at": "2026-09-01T10:00:00Z",
    },
    "cmp-admin-national-01": {
        "id": "cmp-admin-national-01",
        "campaign_code": "GD-NAT-2026-OEM",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": None,
        "title": "Maruti Suzuki National Festive Mahotsav",
        "description": "Official OEM subsidized manufacturer consumer scheme applicable nationwide across all authorized network touchpoints.",
        "campaign_type": "CASH_DISCOUNT",
        "status": "ACTIVE",
        "eligible_models": ["Brezza", "Swift 2026", "Grand Vitara", "Fronx"],
        "eligible_variants": [],
        "offer_details": {
            "discount_amount": 30000,
            "warranty_years": 2,
            "terms_and_conditions": "Centrally sponsored OEM national scheme. Dealers are prohibited from modifying subvention guidelines.",
        },
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "is_active": True,
        "is_sponsored": False,
        "origin": "GROUPDRIVE_ADMIN",
        "performance": {
            "impressions": 8400,
            "clicks": 2400,
            "enquiries_generated": 410,
            "test_drives_booked": 195,
            "bookings_converted": 88,
            "conversion_rate_pct": 21.5,
        },
        "created_by_id": "admin-system",
        "created_by_name": "GroupDrive Central Admin",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
    },
    "cmp-advaith-001": {
        "id": "cmp-advaith-001",
        "campaign_code": "GD-HYU-2026-001",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "title": "Hyundai Creta Festival Privilege Drive",
        "description": "Advaith Hyundai confidential promotional program.",
        "campaign_type": "CASH_DISCOUNT",
        "status": "ACTIVE",
        "eligible_models": ["Creta"],
        "eligible_variants": ["SX", "SX(O)"],
        "offer_details": {
            "discount_amount": 30000,
            "terms_and_conditions": "Exclusive to Advaith Hyundai buyers.",
        },
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "is_active": True,
        "is_sponsored": False,
        "origin": "DEALER",
        "performance": {
            "impressions": 950,
            "clicks": 280,
            "enquiries_generated": 38,
            "test_drives_booked": 19,
            "bookings_converted": 6,
            "conversion_rate_pct": 15.8,
        },
        "created_by_id": "usr-advaith-mgr",
        "created_by_name": "Suresh Gowda",
        "created_at": "2026-09-01T00:00:00Z",
        "updated_at": "2026-09-01T00:00:00Z",
    },
}

# Audit History Store
CAMPAIGN_HISTORY_DB: List[Dict[str, Any]] = [
    {
        "id": "ch-hist-001",
        "campaign_id": "cmp-kalyani-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "CAMPAIGN_CREATED",
        "details": "Campaign initialized with Brezza ZXi/ZXi Plus ₹45,000 cash discount and 3-year warranty.",
        "actor_id": "usr-ramesh-01",
        "actor_name": "Ramesh Kalyani",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-10-01T10:00:00Z",
    },
    {
        "id": "ch-hist-002",
        "campaign_id": "cmp-kalyani-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "CAMPAIGN_CREATED",
        "details": "Launched Whitefield branch launch package for Swift 2026.",
        "actor_id": "usr-rajesh-02",
        "actor_name": "Rajesh Sharma",
        "actor_role": "BRANCH_MANAGER",
        "timestamp": "2026-10-05T14:30:00Z",
    },
    {
        "id": "ch-hist-003",
        "campaign_id": "cmp-kalyani-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "STATUS_TOGGLED",
        "details": "Campaign paused pending revision of volume tier targets.",
        "actor_id": "usr-rajesh-02",
        "actor_name": "Rajesh Sharma",
        "actor_role": "BRANCH_MANAGER",
        "timestamp": "2026-09-01T10:00:00Z",
    },
]


def parse_iso(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        clean = dt_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def compute_campaign_status(campaign: Dict[str, Any], now: Optional[datetime] = None) -> str:
    """
    Evaluates dynamic campaign status based on current timestamp and active flag:
    - If status is DRAFT -> remains DRAFT
    - If now > valid_until -> EXPIRED (expired campaigns never appear active)
    - If now < valid_from -> SCHEDULED
    - If valid_from <= now <= valid_until:
        - is_active is True -> ACTIVE
        - is_active is False -> PAUSED
    """
    if now is None:
        now = datetime.now(timezone.utc)

    if campaign.get("status") == "DRAFT":
        return "DRAFT"

    valid_from = parse_iso(campaign.get("valid_from"))
    valid_until = parse_iso(campaign.get("valid_until"))

    if valid_until and now > valid_until:
        return "EXPIRED"

    if valid_from and now < valid_from:
        return "SCHEDULED"

    if not campaign.get("is_active", True):
        return "PAUSED"

    return "ACTIVE"


def format_campaign_output(campaign: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepares a campaign dict for output by attaching branch_name and dynamic status.
    """
    item = copy.deepcopy(campaign)
    item["status"] = compute_campaign_status(item)

    # Attach branch name if branch_id is present
    branch_id = item.get("branch_id")
    if branch_id and branch_id in BRANCHES_DB:
        item["branch_name"] = BRANCHES_DB[branch_id].get("branch_name")
    elif not branch_id:
        item["branch_name"] = "All Dealership Branches"

    return item


def list_campaigns(
    dealer_id: str,
    branch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    campaign_type: Optional[str] = None,
    search: Optional[str] = None,
    origin: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Lists campaigns belonging to the specified dealership (or visible platform admin campaigns).
    Filters by branch, dynamic status, campaign type, search terms, and origin.
    """
    results: List[Dict[str, Any]] = []

    for c in CAMPAIGNS_DB.values():
        # Multitenancy: belongs to this dealer or platform admin campaign
        if c.get("dealer_id") != dealer_id and c.get("origin") != "GROUPDRIVE_ADMIN":
            continue

        item = format_campaign_output(c)

        # Branch filter: include if matches branch or if campaign is dealership-wide (branch_id is None)
        if branch_id:
            if item.get("branch_id") is not None and item.get("branch_id") != branch_id:
                continue

        # Status filter
        if status_filter:
            if item.get("status") != status_filter.upper():
                continue

        # Campaign type filter
        if campaign_type:
            if item.get("campaign_type") != campaign_type:
                continue

        # Origin filter (DEALER vs GROUPDRIVE_ADMIN)
        if origin:
            if item.get("origin") != origin:
                continue

        # Text search (title, description, campaign_code, eligible_models)
        if search:
            query = search.strip().lower()
            title = (item.get("title") or "").lower()
            code = (item.get("campaign_code") or "").lower()
            desc = (item.get("description") or "").lower()
            models = " ".join(item.get("eligible_models") or []).lower()

            if not (query in title or query in code or query in desc or query in models):
                continue

        results.append(item)

    # Sort: active first, then scheduled, then newest created
    status_priority = {"ACTIVE": 1, "SCHEDULED": 2, "PAUSED": 3, "EXPIRED": 4, "DRAFT": 5}
    results.sort(
        key=lambda x: (
            status_priority.get(x.get("status", "ACTIVE"), 99),
            x.get("created_at", ""),
        ),
        reverse=False,
    )
    return results


def get_campaign_by_id(campaign_id: str, dealer_id: str) -> Dict[str, Any]:
    """
    Retrieves a single campaign by ID with strict tenant isolation.
    """
    campaign = CAMPAIGNS_DB.get(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign '{campaign_id}' was not found.",
        )

    # Multi-tenant isolation: cannot view another dealer's campaign unless admin
    if campaign.get("dealer_id") != dealer_id and campaign.get("origin") != "GROUPDRIVE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot access campaigns belonging to another dealership.",
        )

    return format_campaign_output(campaign)


def create_campaign(
    payload: Dict[str, Any],
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Creates a new dealership campaign.
    Validates required fields, date ordering, and records audit history.
    """
    title = (payload.get("title") or "").strip()
    if len(title) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Campaign title must be at least 3 characters in length.",
        )

    description = (payload.get("description") or "").strip()
    if len(description) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Campaign description must be at least 10 characters in length.",
        )

    valid_from = payload.get("valid_from")
    valid_until = payload.get("valid_until")

    if not valid_from or not valid_until:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Both campaign start date (valid_from) and end date (valid_until) are required.",
        )

    dt_from = parse_iso(valid_from)
    dt_until = parse_iso(valid_until)

    if not dt_from or not dt_until:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid ISO date format for valid_from or valid_until.",
        )

    if dt_until < dt_from:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Campaign end date (valid_until) must be equal to or later than start date (valid_from).",
        )

    branch_id = payload.get("branch_id")
    if branch_id:
        if branch_id not in BRANCHES_DB or BRANCHES_DB[branch_id].get("dealer_id") != dealer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected branch does not belong to your dealership.",
            )

    eligible_models = payload.get("eligible_models") or []
    if not eligible_models:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one eligible vehicle model must be selected for the campaign.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    ts = int(datetime.now(timezone.utc).timestamp() * 1000)
    campaign_id = f"cmp-{ts}"
    campaign_code = f"GD-CMP-{datetime.now(timezone.utc).year}-{len(CAMPAIGNS_DB) + 1:03d}"

    is_active = payload.get("is_active", True)
    initial_status = payload.get("status") or "ACTIVE"

    new_campaign: Dict[str, Any] = {
        "id": campaign_id,
        "campaign_code": campaign_code,
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "title": title,
        "description": description,
        "campaign_type": payload.get("campaign_type", "CASH_DISCOUNT"),
        "status": initial_status,
        "eligible_models": eligible_models,
        "eligible_variants": payload.get("eligible_variants") or [],
        "offer_details": payload.get("offer_details") or {},
        "valid_from": valid_from,
        "valid_until": valid_until,
        "is_active": is_active,
        "is_sponsored": bool(payload.get("is_sponsored", False)),
        "sponsored_label": payload.get("sponsored_label") or ("Showroom Spotlight" if payload.get("is_sponsored") else None),
        "origin": "DEALER",
        "performance": {
            "impressions": 0,
            "clicks": 0,
            "enquiries_generated": 0,
            "test_drives_booked": 0,
            "bookings_converted": 0,
            "conversion_rate_pct": 0.0,
        },
        "created_by_id": actor.get("id"),
        "created_by_name": actor.get("name") or actor.get("email"),
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    CAMPAIGNS_DB[campaign_id] = new_campaign

    # Record audit log
    CAMPAIGN_HISTORY_DB.insert(
        0,
        {
            "id": f"ch-hist-{ts}",
            "campaign_id": campaign_id,
            "dealer_id": dealer_id,
            "action": "CAMPAIGN_CREATED",
            "details": f"Created campaign '{title}' with code {campaign_code}.",
            "actor_id": actor.get("id", "usr-unknown"),
            "actor_name": actor.get("name") or actor.get("email", "Staff User"),
            "actor_role": actor.get("staff_role", "DEALER_OWNER"),
            "timestamp": now_iso,
        },
    )

    return format_campaign_output(new_campaign)


def update_campaign(
    campaign_id: str,
    payload: Dict[str, Any],
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Updates an existing dealership campaign.
    Prevents modifying platform/admin-controlled campaigns.
    """
    campaign = CAMPAIGNS_DB.get(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign '{campaign_id}' was not found.",
        )

    # Multi-tenant isolation
    if campaign.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot modify campaigns belonging to another dealership.",
        )

    # Admin campaign protection
    if campaign.get("origin") == "GROUPDRIVE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Centralized GroupDrive platform/OEM campaigns cannot be edited by dealerships.",
        )

    updated_fields: List[str] = []

    if "title" in payload and payload["title"] is not None:
        title = payload["title"].strip()
        if len(title) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Campaign title must be at least 3 characters in length.",
            )
        campaign["title"] = title
        updated_fields.append("title")

    if "description" in payload and payload["description"] is not None:
        desc = payload["description"].strip()
        if len(desc) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Campaign description must be at least 10 characters in length.",
            )
        campaign["description"] = desc
        updated_fields.append("description")

    if "branch_id" in payload:
        b_id = payload["branch_id"]
        if b_id:
            if b_id not in BRANCHES_DB or BRANCHES_DB[b_id].get("dealer_id") != dealer_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected branch does not belong to your dealership.",
                )
        campaign["branch_id"] = b_id
        updated_fields.append("branch_id")

    if "campaign_type" in payload and payload["campaign_type"] is not None:
        campaign["campaign_type"] = payload["campaign_type"]
        updated_fields.append("campaign_type")

    if "eligible_models" in payload and payload["eligible_models"] is not None:
        if not payload["eligible_models"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one eligible vehicle model must be selected.",
            )
        campaign["eligible_models"] = payload["eligible_models"]
        updated_fields.append("eligible_models")

    if "eligible_variants" in payload and payload["eligible_variants"] is not None:
        campaign["eligible_variants"] = payload["eligible_variants"]
        updated_fields.append("eligible_variants")

    if "offer_details" in payload and payload["offer_details"] is not None:
        campaign["offer_details"] = payload["offer_details"]
        updated_fields.append("offer_details")

    # Dates
    vf = payload.get("valid_from") or campaign.get("valid_from")
    vu = payload.get("valid_until") or campaign.get("valid_until")
    if "valid_from" in payload or "valid_until" in payload:
        dt_from = parse_iso(vf)
        dt_until = parse_iso(vu)
        if not dt_from or not dt_until:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid ISO format for valid_from or valid_until.",
            )
        if dt_until < dt_from:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Campaign end date (valid_until) must be equal to or later than start date (valid_from).",
            )
        campaign["valid_from"] = vf
        campaign["valid_until"] = vu
        updated_fields.append("validity_dates")

    if "is_active" in payload and payload["is_active"] is not None:
        campaign["is_active"] = bool(payload["is_active"])
        updated_fields.append("is_active")

    if "is_sponsored" in payload and payload["is_sponsored"] is not None:
        campaign["is_sponsored"] = bool(payload["is_sponsored"])
        if campaign["is_sponsored"] and not campaign.get("sponsored_label"):
            campaign["sponsored_label"] = "Showroom Spotlight"
        updated_fields.append("is_sponsored")

    if "sponsored_label" in payload:
        campaign["sponsored_label"] = payload["sponsored_label"]
        updated_fields.append("sponsored_label")

    now_iso = datetime.now(timezone.utc).isoformat()
    campaign["updated_at"] = now_iso
    ts = int(datetime.now(timezone.utc).timestamp() * 1000)

    revision_notes = payload.get("revision_notes") or f"Updated {', '.join(updated_fields) if updated_fields else 'details'}."

    CAMPAIGN_HISTORY_DB.insert(
        0,
        {
            "id": f"ch-hist-{ts}",
            "campaign_id": campaign_id,
            "dealer_id": dealer_id,
            "action": "CAMPAIGN_UPDATED",
            "details": revision_notes,
            "actor_id": actor.get("id", "usr-unknown"),
            "actor_name": actor.get("name") or actor.get("email", "Staff User"),
            "actor_role": actor.get("staff_role", "DEALER_OWNER"),
            "timestamp": now_iso,
        },
    )

    return format_campaign_output(campaign)


def toggle_campaign_status(
    campaign_id: str,
    is_active: bool,
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Activates or pauses a campaign.
    Prevents activating expired campaigns without extending valid_until.
    """
    campaign = CAMPAIGNS_DB.get(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign '{campaign_id}' was not found.",
        )

    if campaign.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot modify campaigns belonging to another dealership.",
        )

    if campaign.get("origin") == "GROUPDRIVE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Centralized GroupDrive platform/OEM campaigns cannot be toggled by dealerships.",
        )

    # Check if expired
    now = datetime.now(timezone.utc)
    valid_until = parse_iso(campaign.get("valid_until"))
    if is_active and valid_until and now > valid_until:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot activate an expired campaign. Please extend the validity end date first.",
        )

    campaign["is_active"] = is_active
    now_iso = now.isoformat()
    campaign["updated_at"] = now_iso
    ts = int(now.timestamp() * 1000)

    action_label = "ACTIVATED" if is_active else "PAUSED"
    CAMPAIGN_HISTORY_DB.insert(
        0,
        {
            "id": f"ch-hist-{ts}",
            "campaign_id": campaign_id,
            "dealer_id": dealer_id,
            "action": "STATUS_TOGGLED",
            "details": f"Campaign was {action_label.lower()} by {actor.get('name', 'staff')}.",
            "actor_id": actor.get("id", "usr-unknown"),
            "actor_name": actor.get("name") or actor.get("email", "Staff User"),
            "actor_role": actor.get("staff_role", "DEALER_OWNER"),
            "timestamp": now_iso,
        },
    )

    return format_campaign_output(campaign)


def get_campaign_history(campaign_id: str, dealer_id: str) -> List[Dict[str, Any]]:
    """
    Returns audit trail history logs for a specific campaign.
    """
    # Verify campaign exists and belongs to dealer
    get_campaign_by_id(campaign_id, dealer_id)

    logs = [log for log in CAMPAIGN_HISTORY_DB if log.get("campaign_id") == campaign_id]
    logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return logs


def get_campaigns_summary(dealer_id: str, branch_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes summary KPI metrics for campaigns of the dealership.
    """
    campaigns = list_campaigns(dealer_id=dealer_id, branch_id=branch_id)

    total_count = len(campaigns)
    active_count = sum(1 for c in campaigns if c.get("status") == "ACTIVE")
    scheduled_count = sum(1 for c in campaigns if c.get("status") == "SCHEDULED")
    expired_count = sum(1 for c in campaigns if c.get("status") == "EXPIRED")
    paused_count = sum(1 for c in campaigns if c.get("status") == "PAUSED")

    total_enquiries = sum(c.get("performance", {}).get("enquiries_generated", 0) for c in campaigns)
    total_bookings = sum(c.get("performance", {}).get("bookings_converted", 0) for c in campaigns)

    return {
        "total_campaigns": total_count,
        "active_count": active_count,
        "scheduled_count": scheduled_count,
        "expired_count": expired_count,
        "paused_count": paused_count,
        "total_enquiries_generated": total_enquiries,
        "total_bookings_converted": total_bookings,
    }

