import copy
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status

def calculate_pricing(payload: Dict[str, Any]) -> Dict[str, int]:
    """
    Automotive On-Road Pricing Engine.
    Performs exact arithmetic validation and itemized price breakdown calculation.
    """
    ex_showroom = int(payload.get("ex_showroom_price") or 0)
    if ex_showroom <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ex-showroom price must be a positive integer greater than zero."
        )

    # Defaults and validation for base components
    rto = int(payload.get("rto_road_tax") if payload.get("rto_road_tax") is not None else round(ex_showroom * 0.14))
    insurance = int(payload.get("insurance_amount") if payload.get("insurance_amount") is not None else round(ex_showroom * 0.035 + 12000))
    fastag = int(payload.get("fastag_charges") if payload.get("fastag_charges") is not None else 500)

    # TCS Rule: 1% if ex-showroom > 10,00,000 INR
    if payload.get("tcs_amount") is not None:
        tcs = int(payload.get("tcs_amount"))
    else:
        tcs = round(ex_showroom * 0.01) if ex_showroom > 1000000 else 0

    # Add-on accessories, warranty, and documentation/other
    accessories = int(payload.get("accessories_amount") or 0)
    warranty = int(payload.get("extended_warranty_amount") or 0)
    other = int(payload.get("other_charges") or 0)

    # Deductions / Benefits
    dealer_disc = int(payload.get("dealer_discount") or 0)
    mfr_offer = int(payload.get("manufacturer_offer") or 0)
    exchange_bonus = int(payload.get("exchange_bonus") or 0)

    # Validate non-negative numbers
    for name, val in [
        ("RTO Road Tax", rto),
        ("Insurance", insurance),
        ("FASTag", fastag),
        ("TCS", tcs),
        ("Accessories", accessories),
        ("Extended Warranty", warranty),
        ("Other Charges", other),
        ("Dealer Discount", dealer_disc),
        ("Manufacturer Offer", mfr_offer),
        ("Exchange Bonus", exchange_bonus),
    ]:
        if val < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{name} cannot be a negative amount."
            )

    total_discounts = dealer_disc + mfr_offer + exchange_bonus
    if total_discounts > ex_showroom:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Total combined discounts (INR {total_discounts:,}) cannot exceed the ex-showroom vehicle price (INR {ex_showroom:,})."
        )

    gross_on_road = ex_showroom + rto + insurance + fastag + tcs + accessories + warranty + other
    final_on_road = gross_on_road - total_discounts

    if final_on_road <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Final calculated net on-road price must be greater than zero."
        )

    return {
        "ex_showroom_price": ex_showroom,
        "rto_road_tax": rto,
        "insurance_amount": insurance,
        "fastag_charges": fastag,
        "tcs_amount": tcs,
        "accessories_amount": accessories,
        "extended_warranty_amount": warranty,
        "other_charges": other,
        "gross_on_road_price": gross_on_road,
        "dealer_discount": dealer_disc,
        "manufacturer_offer": mfr_offer,
        "exchange_bonus": exchange_bonus,
        "total_discounts": total_discounts,
        "final_on_road_price": final_on_road,
    }


INITIAL_QUOTATIONS: List[Dict[str, Any]] = [
    {
        "id": "qte-cust-001",
        "quotation_number": "GD-QTE-2026-088",
        "group_id": None,
        "group_code": None,
        "lead_id": "lead-cust-001",
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "customer_city": "Bengaluru",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "variant_id": "var-brz-zxi-plus",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour": "Pearl Arctic White",
        "city": "Bengaluru",
        "dealer_id": "dlr-kalyani-blr-001",
        "dealer_name": "Kalyani Motors Maruti Suzuki",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "total_group_discount": 42000,
        "net_on_road_price": 1624700,
        "pricing": {
            "ex_showroom_price": 1398000,
            "rto_road_tax": 195720,
            "insurance_amount": 48500,
            "fastag_charges": 500,
            "tcs_amount": 13980,
            "accessories_amount": 15000,
            "extended_warranty_amount": 18500,
            "other_charges": 1500,
            "gross_on_road_price": 1691700,
            "dealer_discount": 42000,
            "manufacturer_offer": 25000,
            "exchange_bonus": 0,
            "total_discounts": 67000,
            "final_on_road_price": 1624700,
        },
        "delivery_timeline_days": 12,
        "dealership_terms": "Valid for retail delivery within 12 calendar days. Includes complimentary 3-year mechanical warranty extension, FASTag RFID activation, and ceramic exterior protection coating.",
        "quotation_status": "SUBMITTED",
        "valid_until": "2026-11-25T23:59:59Z",
        "version": 1,
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "created_by_role": "SALES_EXECUTIVE",
        "created_at": "2026-11-06T10:45:00Z",
        "updated_at": "2026-11-06T10:45:00Z",
    },
    {
        "id": "qte-cust-002",
        "quotation_number": "GD-QTE-2026-089",
        "group_id": None,
        "group_code": None,
        "lead_id": "lead-cust-001",
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "customer_city": "Bengaluru",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "variant_id": "var-brz-zxi-plus",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour": "Pearl Arctic White",
        "city": "Bengaluru",
        "dealer_id": "dlr-pratham-blr-006",
        "dealer_name": "Pratham Motors Maruti Suzuki Nexa",
        "branch_id": "br-pratham-bellandur-01",
        "branch_name": "Pratham Nexa Bellandur Experience Lounge",
        "total_group_discount": 48000,
        "net_on_road_price": 1612500,
        "pricing": {
            "ex_showroom_price": 1398000,
            "rto_road_tax": 195720,
            "insurance_amount": 46800,
            "fastag_charges": 500,
            "tcs_amount": 13980,
            "accessories_amount": 12000,
            "extended_warranty_amount": 18500,
            "other_charges": 0,
            "gross_on_road_price": 1685500,
            "dealer_discount": 48000,
            "manufacturer_offer": 25000,
            "exchange_bonus": 0,
            "total_discounts": 73000,
            "final_on_road_price": 1612500,
        },
        "delivery_timeline_days": 10,
        "dealership_terms": "Priority yard dispatch with free genuine Nexa 7-piece styling package and zero documentation charges.",
        "quotation_status": "SUBMITTED",
        "valid_until": "2026-11-24T23:59:59Z",
        "version": 1,
        "created_by_id": "usr-arun-blr",
        "created_by_name": "Arun Prasad",
        "created_by_role": "SALES_EXECUTIVE",
        "created_at": "2026-11-06T11:15:00Z",
        "updated_at": "2026-11-06T11:15:00Z",
    },
    {
        "id": "qte-blr-swf-001",
        "quotation_number": "GD-QTE-2026-001",
        "group_id": "grp-blr-swf-09",
        "group_code": "GD-BLR-SWF-09",
        "lead_id": None,
        "customer_name": "Group GD-BLR-SWF-09 Pooled Buyers",
        "customer_phone": None,
        "customer_email": None,
        "customer_city": "Bengaluru",
        "model_id": "mod-swift-01",
        "model_name": "Maruti Suzuki Swift 2026",
        "variant_id": "var-swf-zxi-mt",
        "variant_name": "ZXi 1.2L 5MT",
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "colour": "Luster Blue",
        "city": "Bengaluru",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "total_group_discount": 40000,
        "net_on_road_price": 942500,
        "pricing": {
            "ex_showroom_price": 829000,
            "rto_road_tax": 116060,
            "insurance_amount": 32500,
            "fastag_charges": 500,
            "tcs_amount": 0,
            "accessories_amount": 12000,
            "extended_warranty_amount": 14500,
            "other_charges": 0,
            "gross_on_road_price": 1004560,
            "dealer_discount": 40000,
            "manufacturer_offer": 22000,
            "exchange_bonus": 0,
            "total_discounts": 62000,
            "final_on_road_price": 942560,
        },
        "delivery_timeline_days": 14,
        "dealership_terms": "Valid for delivery within 14 days of group locking. Includes complimentary 3M underbody anti-rust protection.",
        "quotation_status": "SUBMITTED",
        "valid_until": "2026-11-20T23:59:59Z",
        "version": 1,
        "items": [
            {
                "variant_id": "var-swf-zxi-mt",
                "variant_name": "ZXi 1.2L 5MT",
                "ex_showroom_price": 829000,
                "rto_road_tax": 116060,
                "insurance_amount": 32500,
                "fastag_charges": 500,
                "tcs_amount": 0,
                "accessories_package_cost": 12000,
                "extended_warranty_cost": 14500,
                "oem_consumer_scheme_discount": 22000,
                "dealer_exclusive_group_discount": 40000,
                "net_payable_amount": 942560,
            }
        ],
        "created_by_id": "usr-priya-03",
        "created_by_name": "Priya Nair",
        "created_by_role": "SALES_MANAGER",
        "created_at": "2026-11-04T16:20:00Z",
        "updated_at": "2026-11-04T16:20:00Z",
    },
    {
        "id": "qte-blr-brz-002",
        "quotation_number": "GD-QTE-2026-002",
        "group_id": None,
        "group_code": None,
        "lead_id": "lead-001",
        "customer_name": "Amit Sharma",
        "customer_phone": "+919845112233",
        "customer_email": "amit.sharma@gmail.com",
        "customer_city": "Bengaluru",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "variant_id": "var-brz-zxi",
        "variant_name": "ZXi 1.5L 5MT",
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "colour": "Pearl Arctic White",
        "city": "Bengaluru",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "total_group_discount": 25000,
        "net_on_road_price": 1285000,
        "pricing": {
            "ex_showroom_price": 1114000,
            "rto_road_tax": 155960,
            "insurance_amount": 42500,
            "fastag_charges": 500,
            "tcs_amount": 11140,
            "accessories_amount": 15000,
            "extended_warranty_amount": 16500,
            "other_charges": 2000,
            "gross_on_road_price": 1357600,
            "dealer_discount": 25000,
            "manufacturer_offer": 20000,
            "exchange_bonus": 15000,
            "total_discounts": 60000,
            "final_on_road_price": 1297600,
        },
        "delivery_timeline_days": 10,
        "dealership_terms": "Standard retail quotation valid for 10 calendar days. Free basic accessory kit.",
        "quotation_status": "DRAFT",
        "valid_until": "2026-11-18T23:59:59Z",
        "version": 1,
        "created_by_id": "usr-amit-04",
        "created_by_name": "Amit Patel",
        "created_by_role": "SALES_EXECUTIVE",
        "created_at": "2026-11-06T11:00:00Z",
        "updated_at": "2026-11-06T11:00:00Z",
    },
    {
        "id": "qte-blr-gv-003",
        "quotation_number": "GD-QTE-2026-003",
        "group_id": "grp-blr-gv-02",
        "group_code": "GD-BLR-GV-02",
        "lead_id": None,
        "customer_name": "Group GD-BLR-GV-02 Cluster Buyers",
        "customer_phone": None,
        "customer_email": None,
        "customer_city": "Bengaluru",
        "model_id": "mod-gvitara-01",
        "model_name": "Maruti Suzuki Grand Vitara",
        "variant_id": "var-gv-alpha-hybrid",
        "variant_name": "Alpha Smart Hybrid 1.5L AT",
        "fuel_type": "Hybrid",
        "transmission": "Automatic",
        "colour": "Nexa Blue",
        "city": "Bengaluru",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "total_group_discount": 45000,
        "net_on_road_price": 1850000,
        "pricing": {
            "ex_showroom_price": 1599000,
            "rto_road_tax": 223860,
            "insurance_amount": 54000,
            "fastag_charges": 500,
            "tcs_amount": 15990,
            "accessories_amount": 20000,
            "extended_warranty_amount": 22500,
            "other_charges": 0,
            "gross_on_road_price": 1935850,
            "dealer_discount": 45000,
            "manufacturer_offer": 30000,
            "exchange_bonus": 10000,
            "total_discounts": 85000,
            "final_on_road_price": 1850850,
        },
        "delivery_timeline_days": 21,
        "dealership_terms": "Special collective booking terms. Price locked for group batch fulfillment.",
        "quotation_status": "ACCEPTED",
        "valid_until": "2026-11-25T23:59:59Z",
        "version": 2,
        "created_by_id": "usr-vikram-01",
        "created_by_name": "Vikram Kalyani",
        "created_by_role": "DEALER_OWNER",
        "created_at": "2026-11-03T14:30:00Z",
        "updated_at": "2026-11-05T18:00:00Z",
    },
    {
        "id": "qte-mum-crt-rival",
        "quotation_number": "GD-QTE-2026-901",
        "group_id": "grp-mum-crt-01",
        "group_code": "GD-MUM-CRT-01",
        "lead_id": None,
        "customer_name": "Rival Dealer Pool",
        "customer_phone": None,
        "customer_email": None,
        "customer_city": "Mumbai",
        "model_id": "mod-creta-01",
        "model_name": "Hyundai Creta",
        "variant_id": "var-crt-sx-ivt",
        "variant_name": "SX (O) Petrol IVT",
        "fuel_type": "Petrol",
        "transmission": "IVT",
        "colour": "Atlas White",
        "city": "Mumbai",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "total_group_discount": 50000,
        "net_on_road_price": 1920000,
        "pricing": {
            "ex_showroom_price": 1720000,
            "rto_road_tax": 240800,
            "insurance_amount": 58000,
            "fastag_charges": 500,
            "tcs_amount": 17200,
            "accessories_amount": 15000,
            "extended_warranty_amount": 19000,
            "other_charges": 0,
            "gross_on_road_price": 2070500,
            "dealer_discount": 50000,
            "manufacturer_offer": 25000,
            "exchange_bonus": 0,
            "total_discounts": 75000,
            "final_on_road_price": 1995500,
        },
        "delivery_timeline_days": 25,
        "dealership_terms": "Confidential rival quotation.",
        "quotation_status": "SUBMITTED",
        "valid_until": "2026-11-22T23:59:59Z",
        "version": 1,
        "created_by_id": "usr-sunil-07",
        "created_by_name": "Sunil Gowda",
        "created_by_role": "DEALER_OWNER",
        "created_at": "2026-11-04T12:00:00Z",
        "updated_at": "2026-11-04T12:00:00Z",
    },
]

INITIAL_QUOTATION_HISTORY: List[Dict[str, Any]] = [
    {
        "id": "hist-qte-001",
        "quotation_id": "qte-blr-swf-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "QUOTATION_SUBMITTED",
        "details": "Binding quotation submitted for group GD-BLR-SWF-09 with INR 40,000 group discount.",
        "actor_id": "usr-priya-03",
        "actor_name": "Priya Nair",
        "actor_role": "SALES_MANAGER",
        "timestamp": "2026-11-04T16:20:00Z",
    },
    {
        "id": "hist-qte-002",
        "quotation_id": "qte-blr-brz-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "QUOTATION_DRAFTED",
        "details": "Quotation draft created for customer enquiry Amit Sharma (Lead lead-001).",
        "actor_id": "usr-amit-04",
        "actor_name": "Amit Patel",
        "actor_role": "SALES_EXECUTIVE",
        "timestamp": "2026-11-06T11:00:00Z",
    },
    {
        "id": "hist-qte-003",
        "quotation_id": "qte-blr-gv-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "QUOTATION_ACCEPTED",
        "details": "Quotation accepted by buyer cluster. Vehicle allocation confirmed.",
        "actor_id": "usr-vikram-01",
        "actor_name": "Vikram Kalyani",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-11-05T18:00:00Z",
    },
]

QUOTATIONS_DB: List[Dict[str, Any]] = copy.deepcopy(INITIAL_QUOTATIONS)
QUOTATION_HISTORY_DB: List[Dict[str, Any]] = copy.deepcopy(INITIAL_QUOTATION_HISTORY)

def _check_validity_expiration(quote: Dict[str, Any]):
    """
    Auto-expires quotations whose validity date has passed and are not locked/accepted.
    """
    valid_until_str = quote.get("valid_until")
    if not valid_until_str:
        return

    try:
        valid_until = datetime.fromisoformat(valid_until_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if now > valid_until and quote.get("quotation_status") in ["DRAFT", "SUBMITTED", "REVISED"]:
            quote["quotation_status"] = "EXPIRED"
            quote["updated_at"] = now.isoformat()
    except Exception:
        pass

def list_quotations(
    dealer_id: str,
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    group_id: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Lists dealership quotations with filtering and tenant isolation.
    """
    results: List[Dict[str, Any]] = []

    for quote in QUOTATIONS_DB:
        # Multi-tenant isolation
        if quote["dealer_id"] != dealer_id:
            continue

        # Check and update expiry dynamically
        _check_validity_expiration(quote)

        # Branch filtering
        if branch_id and branch_id != "all":
            if quote.get("branch_id") != branch_id:
                continue

        # Status filtering
        if status and status.upper() != "ALL":
            if quote.get("quotation_status") != status.upper():
                continue

        # Lead filtering
        if lead_id:
            if quote.get("lead_id") != lead_id:
                continue

        # Group filtering
        if group_id:
            if quote.get("group_id") != group_id:
                continue

        # Search query (number, model, customer name, group code)
        if search:
            q = search.lower().strip()
            match = (
                q in quote.get("quotation_number", "").lower()
                or q in quote.get("model_name", "").lower()
                or q in (quote.get("customer_name") or "").lower()
                or q in (quote.get("group_code") or "").lower()
                or q in (quote.get("variant_name") or "").lower()
            )
            if not match:
                continue

        results.append(copy.deepcopy(quote))

    # Sort newest first
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results

def get_quotation_by_id(quotation_id: str, dealer_id: str) -> Dict[str, Any]:
    """
    Fetches quotation by ID or quotation_number with strict tenant protection.
    """
    for quote in QUOTATIONS_DB:
        if quote["id"] == quotation_id or quote.get("quotation_number") == quotation_id:
            if quote["dealer_id"] != dealer_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cross-dealership access forbidden."
                )
            _check_validity_expiration(quote)
            result = copy.deepcopy(quote)
            result["history"] = get_quotation_history(quote["id"], dealer_id)
            return result

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Quotation '{quotation_id}' not found."
    )

def create_quotation(
    payload: Dict[str, Any],
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Creates a new itemized vehicle quotation (DRAFT or SUBMITTED).
    """
    actor_role = actor.get("staff_role") or actor.get("role")

    # If submitting directly as binding offer to a group, require manager role
    requested_status = payload.get("status", "SUBMITTED").upper()
    if requested_status == "SUBMITTED" and payload.get("group_id"):
        allowed_roles = ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]
        if actor_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Staff role '{actor_role}' is not authorized to submit binding group quotations. You may save as DRAFT."
            )

    # Validate branch
    branch_id = payload.get("branch_id")
    if not branch_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Branch ID is required for vehicle delivery allocation."
        )

    from src.core.identity_store import BRANCHES_DB
    branch_obj = BRANCHES_DB.get(branch_id)
    branch_name = branch_obj["branch_name"] if branch_obj else "Authorized Showroom"

    # Calculate itemized pricing on backend
    pricing = calculate_pricing(payload)

    # Calculate validity (default 14 days if not specified)
    valid_until = payload.get("valid_until")
    if not valid_until:
        valid_until = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()

    now_iso = datetime.now(timezone.utc).isoformat()
    quotation_seq = len(QUOTATIONS_DB) + 1
    quote_id = f"qte-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    quote_number = f"GD-QTE-2026-{quotation_seq:03d}"

    quotation_record = {
        "id": quote_id,
        "quotation_number": quote_number,
        "group_id": payload.get("group_id"),
        "group_code": payload.get("group_code"),
        "lead_id": payload.get("lead_id"),
        "customer_name": payload.get("customer_name") or ("Group Cluster Buyers" if payload.get("group_id") else "Retail Customer"),
        "customer_phone": payload.get("customer_phone"),
        "customer_email": payload.get("customer_email"),
        "customer_city": payload.get("customer_city", "Bengaluru"),
        "model_id": payload.get("model_id", "mod-default"),
        "model_name": payload.get("model_name", "Vehicle Model"),
        "variant_id": payload.get("variant_id", "var-default"),
        "variant_name": payload.get("variant_name", "Standard Variant"),
        "fuel_type": payload.get("fuel_type", "Petrol"),
        "transmission": payload.get("transmission", "Manual"),
        "colour": payload.get("colour", "Standard Colour"),
        "city": payload.get("customer_city", "Bengaluru"),
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "total_group_discount": pricing["dealer_discount"],
        "net_on_road_price": pricing["final_on_road_price"],
        "pricing": pricing,
        "delivery_timeline_days": payload.get("delivery_timeline_days", 14),
        "dealership_terms": payload.get("dealership_terms", "Standard dealership terms. Deliveries subject to RTO clearance."),
        "quotation_status": requested_status,
        "valid_until": valid_until,
        "version": 1,
        "items": [
            {
                "variant_id": payload.get("variant_id", "var-default"),
                "variant_name": payload.get("variant_name", "Standard Variant"),
                "ex_showroom_price": pricing["ex_showroom_price"],
                "rto_road_tax": pricing["rto_road_tax"],
                "insurance_amount": pricing["insurance_amount"],
                "fastag_charges": pricing["fastag_charges"],
                "tcs_amount": pricing["tcs_amount"],
                "accessories_package_cost": pricing["accessories_amount"],
                "extended_warranty_cost": pricing["extended_warranty_amount"],
                "oem_consumer_scheme_discount": pricing["manufacturer_offer"],
                "dealer_exclusive_group_discount": pricing["dealer_discount"],
                "net_payable_amount": pricing["final_on_road_price"],
            }
        ],
        "created_by_id": actor.get("id", "usr-unknown"),
        "created_by_name": actor.get("full_name", "Dealer Staff"),
        "created_by_role": actor_role,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    QUOTATIONS_DB.append(quotation_record)

    # Append audit trail
    action_type = "QUOTATION_SUBMITTED" if requested_status == "SUBMITTED" else "QUOTATION_DRAFTED"
    history_entry = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "quotation_id": quote_id,
        "dealer_id": dealer_id,
        "action": action_type,
        "details": f"Quotation {quote_number} created with net on-road price of INR {pricing['final_on_road_price']:,} (Status: {requested_status}).",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    QUOTATION_HISTORY_DB.append(history_entry)

    quotation_record["history"] = [history_entry]
    return quotation_record

def update_quotation(
    quotation_id: str,
    payload: Dict[str, Any],
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Updates or revises an existing quotation.
    Enforces business rules preventing modification of finalized (ACCEPTED, EXPIRED, CANCELLED) quotations.
    """
    quote = get_quotation_by_id(quotation_id, dealer_id)
    actor_role = actor.get("staff_role") or actor.get("role")

    # Immutability Check: Locked quotations cannot be modified
    locked_statuses = ["ACCEPTED", "EXPIRED", "CANCELLED_BY_DEALER"]
    if quote["quotation_status"] in locked_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation cannot be modified because it is currently {quote['quotation_status']}."
        )

    # Re-calculate pricing if pricing fields provided
    merged_pricing_payload = {
        "ex_showroom_price": payload.get("ex_showroom_price", quote["pricing"]["ex_showroom_price"]),
        "rto_road_tax": payload.get("rto_road_tax", quote["pricing"]["rto_road_tax"]),
        "insurance_amount": payload.get("insurance_amount", quote["pricing"]["insurance_amount"]),
        "fastag_charges": payload.get("fastag_charges", quote["pricing"]["fastag_charges"]),
        "tcs_amount": payload.get("tcs_amount", quote["pricing"]["tcs_amount"]),
        "accessories_amount": payload.get("accessories_amount", quote["pricing"]["accessories_amount"]),
        "extended_warranty_amount": payload.get("extended_warranty_amount", quote["pricing"]["extended_warranty_amount"]),
        "other_charges": payload.get("other_charges", quote["pricing"]["other_charges"]),
        "dealer_discount": payload.get("dealer_discount", quote["pricing"]["dealer_discount"]),
        "manufacturer_offer": payload.get("manufacturer_offer", quote["pricing"]["manufacturer_offer"]),
        "exchange_bonus": payload.get("exchange_bonus", quote["pricing"]["exchange_bonus"]),
    }
    pricing = calculate_pricing(merged_pricing_payload)

    # Find quotation in DB
    target_quote = None
    for q in QUOTATIONS_DB:
        if q["id"] == quote["id"]:
            target_quote = q
            break

    if not target_quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    now_iso = datetime.now(timezone.utc).isoformat()
    old_version = target_quote.get("version", 1)
    new_version = old_version + 1

    target_quote["version"] = new_version
    target_quote["pricing"] = pricing
    target_quote["total_group_discount"] = pricing["dealer_discount"]
    target_quote["net_on_road_price"] = pricing["final_on_road_price"]

    if "delivery_timeline_days" in payload and payload["delivery_timeline_days"] is not None:
        target_quote["delivery_timeline_days"] = payload["delivery_timeline_days"]

    if "valid_until" in payload and payload["valid_until"]:
        target_quote["valid_until"] = payload["valid_until"]

    if "dealership_terms" in payload and payload["dealership_terms"]:
        target_quote["dealership_terms"] = payload["dealership_terms"]

    if "colour" in payload and payload["colour"]:
        target_quote["colour"] = payload["colour"]

    # If quotation was SUBMITTED, mark as REVISED
    if target_quote["quotation_status"] == "SUBMITTED":
        target_quote["quotation_status"] = "REVISED"

    target_quote["updated_at"] = now_iso

    # Append revision audit history
    notes = payload.get("revision_notes") or f"Quotation revised to Version {new_version}. Net on-road price: INR {pricing['final_on_road_price']:,}."
    history_entry = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "quotation_id": target_quote["id"],
        "dealer_id": dealer_id,
        "action": "QUOTATION_REVISED",
        "details": notes,
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    QUOTATION_HISTORY_DB.append(history_entry)

    return get_quotation_by_id(target_quote["id"], dealer_id)

def submit_quotation(
    quotation_id: str,
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Submits a draft quotation to become active/binding.
    Authorized roles: DEALER_OWNER, BRANCH_MANAGER, SALES_MANAGER.
    """
    quote = get_quotation_by_id(quotation_id, dealer_id)
    actor_role = actor.get("staff_role") or actor.get("role")

    allowed_roles = ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]
    if actor_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff role '{actor_role}' is not authorized to submit binding quotations."
        )

    if quote["quotation_status"] not in ["DRAFT", "REVISED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation cannot be submitted from status '{quote['quotation_status']}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    for q in QUOTATIONS_DB:
        if q["id"] == quote["id"]:
            q["quotation_status"] = "SUBMITTED"
            q["updated_at"] = now_iso
            break

    history_entry = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "quotation_id": quote["id"],
        "dealer_id": dealer_id,
        "action": "QUOTATION_SUBMITTED",
        "details": f"Quotation submitted by {actor.get('full_name')} as binding offer.",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    QUOTATION_HISTORY_DB.append(history_entry)

    return get_quotation_by_id(quote["id"], dealer_id)

def accept_quotation(
    quotation_id: str,
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Marks quotation as accepted by buyer or pool.
    """
    quote = get_quotation_by_id(quotation_id, dealer_id)
    actor_role = actor.get("staff_role") or actor.get("role")

    if quote["quotation_status"] not in ["SUBMITTED", "REVISED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quotation cannot be marked accepted from status '{quote['quotation_status']}'."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    for q in QUOTATIONS_DB:
        if q["id"] == quote["id"]:
            q["quotation_status"] = "ACCEPTED"
            q["updated_at"] = now_iso
            break

    history_entry = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "quotation_id": quote["id"],
        "dealer_id": dealer_id,
        "action": "QUOTATION_ACCEPTED",
        "details": f"Quotation confirmed and accepted for fulfillment.",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    QUOTATION_HISTORY_DB.append(history_entry)

    return get_quotation_by_id(quote["id"], dealer_id)

def cancel_quotation(
    quotation_id: str,
    reason: str,
    actor: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Cancels quotation by dealership.
    """
    quote = get_quotation_by_id(quotation_id, dealer_id)
    actor_role = actor.get("staff_role") or actor.get("role")

    allowed_roles = ["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]
    if actor_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Staff role '{actor_role}' is not authorized to cancel quotations."
        )

    if quote["quotation_status"] == "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a quotation that has already been accepted and locked for fulfillment."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    for q in QUOTATIONS_DB:
        if q["id"] == quote["id"]:
            q["quotation_status"] = "CANCELLED_BY_DEALER"
            q["updated_at"] = now_iso
            break

    history_entry = {
        "id": f"hist-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "quotation_id": quote["id"],
        "dealer_id": dealer_id,
        "action": "QUOTATION_CANCELLED",
        "details": f"Quotation cancelled by dealership. Reason: {reason or 'No reason provided'}",
        "actor_id": actor.get("id", "usr-unknown"),
        "actor_name": actor.get("full_name", "Dealer Staff"),
        "actor_role": actor_role,
        "timestamp": now_iso,
    }
    QUOTATION_HISTORY_DB.append(history_entry)

    return get_quotation_by_id(quote["id"], dealer_id)

def get_quotation_history(quotation_id: str, dealer_id: str) -> List[Dict[str, Any]]:
    """
    Returns audit trail scoped to caller's dealership.
    """
    logs = [
        copy.deepcopy(e)
        for e in QUOTATION_HISTORY_DB
        if e["quotation_id"] == quotation_id and e["dealer_id"] == dealer_id
    ]
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs

def get_quotations_summary(dealer_id: str, branch_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns KPI counters for quotations module.
    """
    quotes = list_quotations(dealer_id=dealer_id, branch_id=branch_id)
    total = len(quotes)
    drafts = sum(1 for q in quotes if q.get("quotation_status") == "DRAFT")
    submitted = sum(1 for q in quotes if q.get("quotation_status") in ["SUBMITTED", "REVISED"])
    accepted = sum(1 for q in quotes if q.get("quotation_status") == "ACCEPTED")
    rejected = sum(1 for q in quotes if q.get("quotation_status") == "REJECTED")
    expired = sum(1 for q in quotes if q.get("quotation_status") == "EXPIRED")
    pipeline_val = sum(q.get("pricing", {}).get("final_on_road_price", 0) for q in quotes if q.get("quotation_status") in ["SUBMITTED", "REVISED", "ACCEPTED"])

    return {
        "total_quotations": total,
        "draft_count": drafts,
        "submitted_count": submitted,
        "accepted_count": accepted,
        "rejected_count": rejected,
        "expired_count": expired,
        "total_pipeline_value": pipeline_val,
    }

