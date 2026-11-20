import copy
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status

# Seed Buyer Group Opportunities
# Privacy Rule: Aggregate demand only. No individual customer PII is stored or exposed here.
INITIAL_OPPORTUNITIES: List[Dict[str, Any]] = [
    {
        "id": "grp-blr-brz-04",
        "group_code": "GD-BLR-BRZ-04",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "brand_name": "Maruti Suzuki",
        "model_image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
        "city": "Bengaluru",
        "state": "Karnataka",
        "rto_circle": "KA-03 (Indiranagar / East)",
        "status": "OPEN_FOR_QUOTES",
        "min_members_threshold": 3,
        "max_capacity": 10,
        "current_members_count": 7,
        "quoting_deadline": "2026-11-12T18:00:00Z",
        "expiry_at": "2026-11-20T23:59:59Z",
        "target_delivery_window_days": 20,
        "requirements": {
            "delivery_timeline_preference": "Immediate to 25 days",
            "preferred_variants": ["ZXi", "ZXi Plus", "VXi"],
            "preferred_colours": ["Pearl Arctic White", "Brave Khaki", "Magma Grey"],
            "fuel_types": ["Petrol", "CNG"],
            "transmissions": ["Manual", "Automatic"],
            "financing_mix": "70% Bank Loan / 30% Self Funded",
            "accessory_preferences": ["Reverse Camera", "All Weather Mats", "Mud Flaps"],
            "delivery_location": "Bengaluru East Dealership Showrooms",
        },
        "created_at": "2026-11-02T09:30:00Z",
    },
    {
        "id": "grp-blr-gv-02",
        "group_code": "GD-BLR-GV-02",
        "model_id": "mod-gvitara-01",
        "model_name": "Maruti Suzuki Grand Vitara",
        "brand_name": "Maruti Suzuki",
        "model_image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600",
        "city": "Bengaluru",
        "state": "Karnataka",
        "rto_circle": "KA-05 (Jayanagar / South)",
        "status": "OPEN_FOR_QUOTES",
        "min_members_threshold": 3,
        "max_capacity": 8,
        "current_members_count": 5,
        "quoting_deadline": "2026-11-10T15:00:00Z",
        "expiry_at": "2026-11-16T23:59:59Z",
        "target_delivery_window_days": 30,
        "requirements": {
            "delivery_timeline_preference": "Within 30 days",
            "preferred_variants": ["Alpha Smart Hybrid", "Zeta Strong Hybrid"],
            "preferred_colours": ["Nexa Blue", "Arctic White", "Splendid Silver"],
            "fuel_types": ["Hybrid", "Petrol"],
            "transmissions": ["e-CVT", "Automatic"],
            "financing_mix": "85% Bank Loan / 15% Self Funded",
            "accessory_preferences": ["Side Step", "3M Underbody Coating", "Wireless Charger"],
            "delivery_location": "Bengaluru South Dealership Showrooms",
        },
        "created_at": "2026-11-03T11:20:00Z",
    },
    {
        "id": "grp-blr-swf-09",
        "group_code": "GD-BLR-SWF-09",
        "model_id": "mod-swift-01",
        "model_name": "Maruti Suzuki Swift 2026",
        "brand_name": "Maruti Suzuki",
        "model_image_url": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600",
        "city": "Bengaluru",
        "state": "Karnataka",
        "rto_circle": "KA-04 (Yeshwanthpur / North)",
        "status": "FORMING",
        "min_members_threshold": 5,
        "max_capacity": 12,
        "current_members_count": 4,
        "quoting_deadline": "2026-11-15T18:00:00Z",
        "expiry_at": "2026-11-25T23:59:59Z",
        "target_delivery_window_days": 15,
        "requirements": {
            "delivery_timeline_preference": "Within 15 days of group locking",
            "preferred_variants": ["ZXi", "VXi AMT"],
            "preferred_colours": ["Luster Blue", "Sizzling Red", "Pearl Arctic White"],
            "fuel_types": ["Petrol"],
            "transmissions": ["Manual", "AMT"],
            "financing_mix": "60% Bank Loan / 40% Self Funded",
            "accessory_preferences": ["Door Visors", "Seat Covers", "Body Side Moulding"],
            "delivery_location": "Bengaluru North Showrooms",
        },
        "created_at": "2026-11-04T14:10:00Z",
    },
    {
        "id": "grp-blr-fnx-03",
        "group_code": "GD-BLR-FNX-03",
        "model_id": "mod-fronx-01",
        "model_name": "Maruti Suzuki Fronx",
        "brand_name": "Maruti Suzuki",
        "model_image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800",
        "city": "Bengaluru",
        "state": "Karnataka",
        "rto_circle": "KA-51 (Electronic City / South)",
        "status": "QUOTATION_REVIEW",
        "min_members_threshold": 4,
        "max_capacity": 8,
        "current_members_count": 8,
        "quoting_deadline": "2026-11-06T18:00:00Z",
        "expiry_at": "2026-11-18T23:59:59Z",
        "target_delivery_window_days": 20,
        "requirements": {
            "delivery_timeline_preference": "Priority 14 to 20 days",
            "preferred_variants": ["Alpha 1.0L Turbo 6AT", "Zeta 1.0L Turbo 5MT"],
            "preferred_colours": ["Nexa Blue", "Bluish Black", "Splendid Silver"],
            "fuel_types": ["Turbo Petrol"],
            "transmissions": ["6AT", "Manual"],
            "financing_mix": "90% Bank Loan / 10% Self Funded",
            "accessory_preferences": ["Illuminated Door Sill Guards", "Carbon Styling Kit"],
            "delivery_location": "Bengaluru South / Electronic City",
        },
        "created_at": "2026-11-01T10:00:00Z",
    },
    {
        "id": "grp-mum-crt-01",
        "group_code": "GD-MUM-CRT-01",
        "model_id": "mod-creta-01",
        "model_name": "Hyundai Creta",
        "brand_name": "Hyundai",
        "model_image_url": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600",
        "city": "Mumbai",
        "state": "Maharashtra",
        "rto_circle": "MH-02 (Andheri / West)",
        "status": "OPEN_FOR_QUOTES",
        "min_members_threshold": 5,
        "max_capacity": 15,
        "current_members_count": 9,
        "quoting_deadline": "2026-11-14T18:00:00Z",
        "expiry_at": "2026-11-22T23:59:59Z",
        "target_delivery_window_days": 25,
        "requirements": {
            "delivery_timeline_preference": "Immediate to 25 days",
            "preferred_variants": ["SX (O) Petrol IVT", "SX Diesel AT"],
            "preferred_colours": ["Atlas White", "Abyss Black", "Ranger Khaki"],
            "fuel_types": ["Petrol", "Diesel"],
            "transmissions": ["IVT", "Automatic"],
            "financing_mix": "80% Bank Loan / 20% Self Funded",
            "accessory_preferences": ["Dashcam", "Window Sunshades"],
            "delivery_location": "Mumbai Suburbs Showrooms",
        },
        "created_at": "2026-11-03T16:00:00Z",
    },
]

# In-memory stores
GROUP_OPPORTUNITIES_DB: List[Dict[str, Any]] = copy.deepcopy(INITIAL_OPPORTUNITIES)

# Dealer-scoped interest submissions
# Keyed by (group_id, dealer_id) to ensure strict isolation
DEALER_INTERESTS_DB: Dict[str, Dict[str, Any]] = {
    "grp-blr-brz-04:dlr-kalyani-blr-001": {
        "id": "intr-blr-brz-01",
        "group_id": "grp-blr-brz-04",
        "group_code": "GD-BLR-BRZ-04",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Prime Showroom",
        "submitted_by_id": "usr-vikram-01",
        "submitted_by_name": "Vikram Kalyani",
        "submitted_by_role": "DEALER_OWNER",
        "status": "INTEREST_EXPRESSED",
        "estimated_delivery_days": 14,
        "stock_allocation_commitment": 7,
        "proposed_benefits": "Priority batch allocation from regional depot. Complimentary 3M Underbody Anti-Rust Treatment and Extended 3rd Year OEM Warranty.",
        "terms_and_conditions": "Deliveries subject to RTO registration clearance within 7 business days.",
        "initial_response_notes": "We have ready allocation of 7 units across White and Khaki variants at regional stockyard.",
        "created_at": "2026-11-04T10:15:00Z",
        "updated_at": "2026-11-04T10:15:00Z",
    },
    "grp-blr-brz-04:dlr-advaith-blr-002": {
        "id": "intr-blr-brz-rival",
        "group_id": "grp-blr-brz-04",
        "group_code": "GD-BLR-BRZ-04",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "submitted_by_id": "usr-sunil-07",
        "submitted_by_name": "Sunil Gowda",
        "submitted_by_role": "DEALER_OWNER",
        "status": "UNDER_NEGOTIATION",
        "estimated_delivery_days": 10,
        "stock_allocation_commitment": 8,
        "proposed_benefits": "Confidential rival terms.",
        "terms_and_conditions": "Private competitor conditions.",
        "initial_response_notes": "Competitor private notes.",
        "created_at": "2026-11-04T11:00:00Z",
        "updated_at": "2026-11-05T09:00:00Z",
    },
}

# Immutable Opportunity Audit History
# Strictly filtered by dealer_id to prevent competitor eavesdropping
OPPORTUNITY_HISTORY_DB: List[Dict[str, Any]] = [
    {
        "id": "hist-opp-001",
        "opportunity_id": "grp-blr-brz-04",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "INTEREST_SUBMITTED",
        "details": "Dealer interest submitted for 7 units with 14 days delivery timeline.",
        "actor_id": "usr-vikram-01",
        "actor_name": "Vikram Kalyani",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-11-04T10:15:00Z",
    },
    {
        "id": "hist-opp-002",
        "opportunity_id": "grp-blr-brz-04",
        "dealer_id": "dlr-advaith-blr-002",
        "action": "INTEREST_SUBMITTED",
        "details": "Rival dealer submitted initial interest.",
        "actor_id": "usr-sunil-07",
        "actor_name": "Sunil Gowda",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-11-04T11:00:00Z",
    },
]

# Helper to enrich opportunity with remaining slots and dealer-scoped interest
def _enrich_opportunity(opp: Dict[str, Any], dealer_id: str) -> Dict[str, Any]:
    opp_copy = copy.deepcopy(opp)
    opp_copy["remaining_slots"] = max(0, opp_copy["max_capacity"] - opp_copy["current_members_count"])
    interest_key = f"{opp_copy['id']}:{dealer_id}"
    opp_copy["my_interest"] = copy.deepcopy(DEALER_INTERESTS_DB.get(interest_key))
    return opp_copy

def list_opportunities(
    dealer_id: str,
    search: Optional[str] = None,
    vehicle: Optional[str] = None,
    variant: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    offer_status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List opportunities with filtering, enriched with dealer-specific interest and privacy preservation.
    """
    results: List[Dict[str, Any]] = []
    
    for opp in GROUP_OPPORTUNITIES_DB:
        # Search filter across model, group code, city, RTO circle
        if search:
            q = search.lower().strip()
            match = (
                q in opp["model_name"].lower()
                or q in opp["group_code"].lower()
                or q in opp["city"].lower()
                or q in opp["rto_circle"].lower()
            )
            if not match:
                continue

        # Vehicle filter (brand or model)
        if vehicle and vehicle.lower() != "all":
            v_q = vehicle.lower()
            if v_q not in opp["model_name"].lower() and v_q not in opp["brand_name"].lower():
                continue

        # Variant filter
        if variant and variant.lower() != "all":
            req_variants = [v.lower() for v in opp.get("requirements", {}).get("preferred_variants", [])]
            if not any(variant.lower() in v for v in req_variants):
                continue

        # City filter
        if city and city.lower() != "all":
            if opp["city"].lower() != city.lower():
                continue

        # Group lifecycle status filter
        if status and status.upper() != "ALL":
            if opp["status"].upper() != status.upper():
                continue

        # Enrich with dealer-scoped interest
        enriched = _enrich_opportunity(opp, dealer_id)

        # Offer status filter
        if offer_status and offer_status.upper() != "ALL":
            current_offer_status = enriched["my_interest"]["status"] if enriched.get("my_interest") else "NO_OFFER"
            if current_offer_status != offer_status.upper():
                continue

        results.append(enriched)

    return results

def get_opportunity_by_id(opportunity_id: str, dealer_id: str) -> Dict[str, Any]:
    """
    Get detailed opportunity by ID, enriched with caller's dealer interest.
    Strict privacy rule: No individual customer PII is ever returned.
    """
    for opp in GROUP_OPPORTUNITIES_DB:
        if opp["id"] == opportunity_id or opp["group_code"] == opportunity_id:
            return _enrich_opportunity(opp, dealer_id)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Group opportunity '{opportunity_id}' not found."
    )

def submit_dealer_interest(
    opportunity_id: str,
    payload: Dict[str, Any],
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Submit or revise dealer interest for a group opportunity.
    Authorized roles: DEALER_OWNER, BRANCH_MANAGER, SALES_MANAGER.
    """
    actor_role = actor.get("staff_role") or actor.get("role")
    allowed_roles = ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]
    if actor_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff role '{actor_role}' is not authorized to submit dealer interest or negotiate group offers."
        )

    opp = get_opportunity_by_id(opportunity_id, dealer_id)

    # Validate group lifecycle
    open_statuses = ["FORMING", "OPEN_FOR_QUOTES", "QUOTATION_REVIEW"]
    if opp["status"] not in open_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Opportunity is currently {opp['status']} and is not accepting dealer interest."
        )

    # Target branch resolution
    branch_id = payload.get("branch_id")
    if not branch_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Branch ID is required for vehicle stock allocation."
        )

    branch_name = payload.get("branch_name", "Dealership Branch")
    from src.core.identity_store import BRANCHES_DB
    branch_obj = BRANCHES_DB.get(branch_id)
    if branch_obj:
        branch_name = branch_obj["branch_name"]

    interest_key = f"{opp['id']}:{dealer_id}"
    now_iso = datetime.now(timezone.utc).isoformat()

    interest_id = f"intr-{opp['id']}-{int(datetime.now(timezone.utc).timestamp())}"
    if interest_key in DEALER_INTERESTS_DB:
        interest_id = DEALER_INTERESTS_DB[interest_key]["id"]

    interest_record = {
        "id": interest_id,
        "group_id": opp["id"],
        "group_code": opp["group_code"],
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "submitted_by_id": actor.get("id", "usr-unknown"),
        "submitted_by_name": actor.get("full_name", "Dealer Staff"),
        "submitted_by_role": actor_role,
        "status": "INTEREST_EXPRESSED",
        "estimated_delivery_days": payload.get("estimated_delivery_days", 14),
        "stock_allocation_commitment": payload.get("stock_allocation_commitment", 1),
        "proposed_benefits": payload.get("proposed_benefits", ""),
        "terms_and_conditions": payload.get("terms_and_conditions", ""),
        "initial_response_notes": payload.get("initial_response_notes", ""),
        "created_at": DEALER_INTERESTS_DB.get(interest_key, {}).get("created_at", now_iso),
        "updated_at": now_iso,
    }

    DEALER_INTERESTS_DB[interest_key] = interest_record

    # Append to immutable audit log
    history_record = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "opportunity_id": opp["id"],
        "dealer_id": dealer_id,
        "action": "INTEREST_EXPRESSED",
        "details": f"Committed allocation of {interest_record['stock_allocation_commitment']} units with {interest_record['estimated_delivery_days']} days delivery window.",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    OPPORTUNITY_HISTORY_DB.append(history_record)

    return interest_record

def update_negotiation_activity(
    opportunity_id: str,
    payload: Dict[str, Any],
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Manage negotiation terms and updates for an expressed interest.
    Authorized roles: DEALER_OWNER, BRANCH_MANAGER, SALES_MANAGER.
    """
    actor_role = actor.get("staff_role") or actor.get("role")
    allowed_roles = ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]
    if actor_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff role '{actor_role}' is not authorized to manage negotiation activity."
        )

    opp = get_opportunity_by_id(opportunity_id, dealer_id)
    interest_key = f"{opp['id']}:{dealer_id}"

    if interest_key not in DEALER_INTERESTS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No previous interest submission exists for this group opportunity. Submit interest first."
        )

    interest = DEALER_INTERESTS_DB[interest_key]
    now_iso = datetime.now(timezone.utc).isoformat()

    if "status" in payload and payload["status"]:
        interest["status"] = payload["status"]
    else:
        interest["status"] = "UNDER_NEGOTIATION"

    if "estimated_delivery_days" in payload and payload["estimated_delivery_days"] is not None:
        interest["estimated_delivery_days"] = payload["estimated_delivery_days"]

    if "stock_allocation_commitment" in payload and payload["stock_allocation_commitment"] is not None:
        interest["stock_allocation_commitment"] = payload["stock_allocation_commitment"]

    if "proposed_benefits" in payload and payload["proposed_benefits"] is not None:
        interest["proposed_benefits"] = payload["proposed_benefits"]

    if "terms_and_conditions" in payload and payload["terms_and_conditions"] is not None:
        interest["terms_and_conditions"] = payload["terms_and_conditions"]

    interest["updated_at"] = now_iso

    # Append negotiation history log
    notes = payload.get("negotiation_notes") or payload.get("notes") or "Negotiation terms updated by dealership."
    history_record = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "opportunity_id": opp["id"],
        "dealer_id": dealer_id,
        "action": f"NEGOTIATION_{interest['status']}",
        "details": f"{notes} (Status: {interest['status']}, Allocation: {interest['stock_allocation_commitment']} units)",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    OPPORTUNITY_HISTORY_DB.append(history_record)

    return interest

def withdraw_dealer_interest(
    opportunity_id: str,
    reason: str,
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Withdraw interest or proposal from a group opportunity.
    Authorized roles: DEALER_OWNER, BRANCH_MANAGER, SALES_MANAGER.
    """
    actor_role = actor.get("staff_role") or actor.get("role")
    allowed_roles = ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]
    if actor_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff role '{actor_role}' is not authorized to withdraw offers."
        )

    opp = get_opportunity_by_id(opportunity_id, dealer_id)
    interest_key = f"{opp['id']}:{dealer_id}"

    if interest_key not in DEALER_INTERESTS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No interest submission exists to withdraw."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    interest = DEALER_INTERESTS_DB[interest_key]
    interest["status"] = "WITHDRAWN"
    interest["updated_at"] = now_iso

    # Append audit log
    history_record = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "opportunity_id": opp["id"],
        "dealer_id": dealer_id,
        "action": "INTEREST_WITHDRAWN",
        "details": f"Offer withdrawn. Reason: {reason or 'No reason provided'}",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    OPPORTUNITY_HISTORY_DB.append(history_record)

    return interest

def get_opportunity_history(opportunity_id: str, dealer_id: str) -> List[Dict[str, Any]]:
    """
    Returns audit trail strictly scoped to caller's dealer_id.
    Competitor isolation: Rival dealers cannot see another dealer's history.
    """
    logs = [
        copy.deepcopy(entry)
        for entry in OPPORTUNITY_HISTORY_DB
        if entry["opportunity_id"] == opportunity_id and entry["dealer_id"] == dealer_id
    ]
    # Sort descending by timestamp
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs

def get_opportunities_summary(dealer_id: str) -> Dict[str, int]:
    """
    Returns summary counters for group opportunities module.
    """
    total = len(GROUP_OPPORTUNITIES_DB)
    open_for_response = 0
    target_threshold_reached = 0

    for opp in GROUP_OPPORTUNITIES_DB:
        if opp["status"] in ["FORMING", "OPEN_FOR_QUOTES"]:
            open_for_response += 1
        if opp["current_members_count"] >= opp["min_members_threshold"]:
            target_threshold_reached += 1

    my_active_responses = 0
    proposals_under_negotiation = 0

    for key, interest in DEALER_INTERESTS_DB.items():
        if interest["dealer_id"] == dealer_id:
            if interest["status"] not in ["WITHDRAWN", "NO_OFFER"]:
                my_active_responses += 1
            if interest["status"] in ["UNDER_NEGOTIATION", "PROPOSAL_SUBMITTED"]:
                proposals_under_negotiation += 1

    return {
        "total_opportunities": total,
        "open_for_response": open_for_response,
        "target_threshold_reached": target_threshold_reached,
        "my_active_responses": my_active_responses,
        "proposals_under_negotiation": proposals_under_negotiation,
    }
