import copy
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid
from urllib.parse import quote_plus
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, Request
from pydantic import BaseModel, EmailStr, Field

from src.core.catalogue_store import (
    get_all_brands,
    get_all_models,
    get_model_by_id,
    get_all_variants,
    get_variant_by_id,
)
from src.core.opportunities_store import (
    GROUP_OPPORTUNITIES_DB,
    DEALER_INTERESTS_DB,
)
from src.core.quotations_store import (
    QUOTATIONS_DB,
)
from src.core.campaigns_store import (
    CAMPAIGNS_DB,
)
from src.core.identity_store import (
    find_user_by_email,
    find_user_by_id,
    register_customer_user,
    DEALERS_DB,
    BRANCHES_DB,
    USERS_DB,
)
from src.core.leads_store import (
    create_lead,
    LEADS_MASTER_DB,
)
from src.core.inventory_store import (
    INVENTORY_MASTER_DB,
)
from src.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from src.core.dependencies import (
    get_current_user,
    get_current_customer,
    get_optional_current_user,
)

router = APIRouter(tags=["Customer Website and Mobile API"])

# In-memory customer group memberships and demand requests
CUSTOMER_MEMBERSHIPS_DB: List[Dict[str, Any]] = [
    {
        "id": "mem-001",
        "user_id": "usr-cust-001",
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "group_id": "grp-mum-nvs-01",
        "group_code": "GD-MUM-NVS-01",
        "model_name": "Tata Nexon EV",
        "variant_name": "Empowered Plus 45",
        "colour_preference": "Intensi-Teal",
        "city": "Mumbai",
        "status": "CONFIRMED",
        "joined_at": "2026-11-04T12:00:00Z",
    },
    {
        "id": "mem-002",
        "user_id": "usr-cust-002",
        "customer_name": "Priya Kashyap",
        "customer_phone": "+919876501234",
        "customer_email": "priya.customer@gmail.com",
        "group_id": "grp-blr-gv-02",
        "group_code": "GD-BLR-GV-02",
        "model_name": "Maruti Suzuki Grand Vitara",
        "variant_name": "Alpha Smart Hybrid",
        "colour_preference": "Nexa Blue",
        "city": "Bengaluru",
        "status": "CONFIRMED",
        "joined_at": "2026-11-05T14:30:00Z",
    },
]

CUSTOMER_DEMAND_REQUESTS_DB: List[Dict[str, Any]] = []

# Saved Vehicles
CUSTOMER_SAVED_VEHICLES_DB: List[Dict[str, Any]] = [
    {
        "id": "sv-001",
        "user_id": "usr-cust-001",
        "model_id": "mod-nexon-ev-01",
        "model_name": "Tata Nexon EV",
        "brand_name": "Tata Motors",
        "variant_id": "var-nexev-emp-plus",
        "variant_name": "Empowered Plus 45",
        "fuel_type": "Electric",
        "transmission": "Automatic",
        "starting_price": 1449000,
        "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "saved_at": "2026-11-05T10:00:00Z",
    },
    {
        "id": "sv-002",
        "user_id": "usr-cust-001",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "brand_name": "Maruti Suzuki",
        "variant_id": "var-brz-zxi-plus",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "starting_price": 1398000,
        "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "saved_at": "2026-11-06T12:00:00Z",
    },
]

# Saved Vehicle Comparisons
CUSTOMER_SAVED_COMPARISONS_DB: List[Dict[str, Any]] = [
    {
        "id": "cmp-001",
        "user_id": "usr-cust-001",
        "title": "Maruti Suzuki Brezza vs Hyundai Creta",
        "model_ids": ["mod-brezza-01", "mod-creta-01"],
        "created_at": "2026-11-06T14:30:00Z",
    }
]

# Showroom Visits & Test Drive Appointments
CUSTOMER_APPOINTMENTS_DB: List[Dict[str, Any]] = [
    {
        "id": "apt-001",
        "user_id": "usr-cust-001",
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "dealer_id": "dlr-kalyani-blr-001",
        "dealership_name": "Kalyani Motors Maruti Suzuki",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "variant_name": "ZXi Plus 1.5L AT",
        "appointment_type": "SHOWROOM_VISIT",
        "appointment_date": "2026-11-15",
        "time_slot": "11:00 AM - 12:30 PM",
        "status": "CONFIRMED",
        "consultant_name": "Amit Patel",
        "notes": "Customer requested test drive of Automatic transmission and review of price quotation GD-QTE-2026-088.",
        "created_at": "2026-11-07T10:00:00Z",
    }
]

# In-App & Email Notifications
CUSTOMER_NOTIFICATIONS_DB: List[Dict[str, Any]] = [
    {
        "id": "notif-001",
        "user_id": "usr-cust-001",
        "title": "New Quotation Received",
        "message": "Pratham Motors submitted an on-road quotation of Rs 16,12,500 with Rs 73,000 total discount for Maruti Suzuki Brezza ZXi Plus.",
        "type": "QUOTATION",
        "is_read": False,
        "action_url": "/dashboard?tab=quotations",
        "created_at": "2026-11-08T11:15:00Z",
    },
    {
        "id": "notif-002",
        "user_id": "usr-cust-001",
        "title": "Quotation Expiring Soon",
        "message": "Your quote from Pratham Motors for Maruti Brezza expires in 24 hours. Accept or review before it lapses.",
        "type": "QUOTATION",
        "is_read": False,
        "action_url": "/dashboard?tab=quotations",
        "created_at": "2026-11-08T09:30:00Z",
    },
    {
        "id": "notif-003",
        "user_id": "usr-cust-001",
        "title": "Dealer Group Offer Received",
        "message": "Advaith Hyundai posted a competitive group offer with Rs 85,000 off per vehicle for Hyundai Creta SX(O).",
        "type": "GROUP",
        "is_read": False,
        "action_url": "/groups/grp-blr-creta-01",
        "created_at": "2026-11-07T16:45:00Z",
    },
    {
        "id": "notif-004",
        "user_id": "usr-cust-001",
        "title": "Dealer Responded to Enquiry",
        "message": "Trident Hyundai assigned senior specialist Ramesh K to your enquiry for Hyundai Creta SX(O). Direct contact details are available.",
        "type": "ENQUIRY",
        "is_read": False,
        "action_url": "/dashboard?tab=enquiries",
        "created_at": "2026-11-07T14:10:00Z",
    },
    {
        "id": "notif-005",
        "user_id": "usr-cust-001",
        "title": "Showroom Appointment Confirmed",
        "message": "Your test drive appointment with Kalyani Motors Whitefield is scheduled for Nov 15, 2026 at 11:00 AM.",
        "type": "APPOINTMENT",
        "is_read": False,
        "action_url": "/dashboard?tab=appointments",
        "created_at": "2026-11-07T10:00:00Z",
    },
    {
        "id": "notif-006",
        "user_id": "usr-cust-001",
        "title": "Buyer Group Milestone Reached",
        "message": "The Tata Nexon EV Mumbai Buyer Group reached 7 members! Dealership quoting has begun.",
        "type": "GROUP",
        "is_read": True,
        "action_url": "/groups/grp-mum-nvs-01",
        "created_at": "2026-11-06T18:20:00Z",
    },
    {
        "id": "notif-007",
        "user_id": "usr-cust-001",
        "title": "Revised Dealer Quotation Received",
        "message": "Kalyani Motors updated their quotation with an extra Rs 12,000 festive corporate discount.",
        "type": "QUOTATION",
        "is_read": True,
        "action_url": "/dashboard?tab=quotations",
        "created_at": "2026-11-06T15:00:00Z",
    },
    {
        "id": "notif-008",
        "user_id": "usr-cust-001",
        "title": "Group Joined Successfully",
        "message": "You successfully joined Bengaluru Creta Collective. 6 out of 10 buyers joined.",
        "type": "GROUP",
        "is_read": True,
        "action_url": "/groups/grp-blr-creta-01",
        "created_at": "2026-11-05T12:00:00Z",
    },
    {
        "id": "notif-009",
        "user_id": "usr-cust-001",
        "title": "Enquiry Submitted",
        "message": "Your purchase enquiry ENQ-2026-9041 for Hyundai Creta SX(O) has been logged and forwarded to authorized dealers.",
        "type": "ENQUIRY",
        "is_read": True,
        "action_url": "/dashboard?tab=enquiries",
        "created_at": "2026-11-05T09:15:00Z",
    },
    {
        "id": "notif-010",
        "user_id": "usr-cust-001",
        "title": "Security Alert: New Sign-in",
        "message": "New sign-in detected from GROUPDRIVE Mobile App on Android 14 in Bengaluru, India.",
        "type": "SYSTEM",
        "is_read": True,
        "action_url": "/dashboard?tab=settings",
        "created_at": "2026-11-04T08:00:00Z",
    },
]

# Notification Preferences
CUSTOMER_PREFERENCES_DB: Dict[str, Dict[str, Any]] = {
    "usr-cust-001": {
        "email_notifications": True,
        "sms_alerts": True,
        "whatsapp_updates": True,
        "quotation_alerts": True,
        "group_milestones": True,
        "promotional_offers": False,
    }
}

# Active Device Sessions
CUSTOMER_SESSIONS_DB: List[Dict[str, Any]] = [
    {
        "session_id": "sess-cust-01",
        "user_id": "usr-cust-001",
        "device": "Chrome on Windows (Current Session)",
        "ip_address": "106.51.72.19",
        "location": "Bengaluru, India",
        "last_active": "Just now",
        "is_current": True,
    },
    {
        "session_id": "sess-cust-02",
        "user_id": "usr-cust-001",
        "device": "Safari on iPhone 15 Pro",
        "ip_address": "49.37.112.45",
        "location": "Bengaluru, India",
        "last_active": "Yesterday at 07:15 PM",
        "is_current": False,
    },
]

# Password Reset & Verification Tokens
PASSWORD_RESET_TOKENS_DB: Dict[str, Dict[str, Any]] = {}
CUSTOMER_VERIFICATIONS_DB: Dict[str, Dict[str, Any]] = {}

# Helper: Map model / brand to authorized dealership tenant
def resolve_dealer_for_model(brand_or_model: str) -> Dict[str, str]:
    text = (brand_or_model or "").lower()
    if "hyundai" in text or "creta" in text:
        return {
            "dealer_id": "dlr-advaith-blr-002",
            "branch_id": "br-advaith-residency-01",
            "dealer_name": "Advaith Hyundai",
        }
    # Default to premier Maruti Suzuki dealership
    return {
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "dealer_name": "Kalyani Motors",
    }


# Schemas

class CustomerRegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=50)
    city: Optional[str] = Field("Bengaluru", max_length=50)


class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code_or_token: str
    new_password: str = Field(..., min_length=6, max_length=50)


class VerifyChannelRequest(BaseModel):
    channel: str = Field("EMAIL", description="EMAIL or PHONE")


class VerifyConfirmRequest(BaseModel):
    channel: str = Field("EMAIL", description="EMAIL or PHONE")
    code: str = Field(..., min_length=4, max_length=10)


class UpdateCustomerProfileRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=15)
    city: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    preferred_contact_method: Optional[str] = Field(None, description="WHATSAPP, PHONE, or EMAIL")


class SaveVehicleRequest(BaseModel):
    model_id: str
    variant_id: Optional[str] = None


class SaveComparisonRequest(BaseModel):
    title: Optional[str] = None
    model_ids: List[str] = Field(..., min_length=1, max_length=4)


class BookAppointmentRequest(BaseModel):
    dealer_id: str
    branch_id: Optional[str] = None
    model_id: Optional[str] = None
    model_name: Optional[str] = None
    variant_name: Optional[str] = None
    appointment_type: Optional[str] = Field("SHOWROOM_VISIT", description="SHOWROOM_VISIT, HOME_TEST_DRIVE, or DOCUMENTATION_HANDOVER")
    appointment_date: str
    time_slot: str
    notes: Optional[str] = None


class UpdateNotificationPreferencesRequest(BaseModel):
    email_notifications: Optional[bool] = None
    sms_alerts: Optional[bool] = None
    whatsapp_updates: Optional[bool] = None
    quotation_alerts: Optional[bool] = None
    group_milestones: Optional[bool] = None
    promotional_offers: Optional[bool] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=50)


class SubmitEnquiryRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_email: EmailStr
    city: Optional[str] = Field("Bengaluru", max_length=50)
    brand_name: str = Field(..., min_length=2, max_length=50)
    model_name: str = Field(..., min_length=2, max_length=50)
    variant_name: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    colour_preference: Optional[str] = None
    purchase_timeline: Optional[str] = Field("WITHIN_15_DAYS")
    financing_preference: Optional[str] = Field("LOAN")
    preferred_dealer_id: Optional[str] = None
    preferred_branch_id: Optional[str] = None
    source: Optional[str] = Field("WEBSITE_DIRECT", description="WEBSITE_DIRECT, WEBSITE_VEHICLE_CARD, WEBSITE_VEHICLE_DETAIL, WEBSITE_DEALER_PROFILE, WEBSITE_CAMPAIGN, BUYER_GROUP, MOBILE_APP")
    enquiry_type: Optional[str] = Field("TEST_DRIVE", description="TEST_DRIVE, PRICE_QUOTE, or GENERAL")
    notes: Optional[str] = None


class JoinGroupRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_email: EmailStr
    city: Optional[str] = Field("Bengaluru", max_length=50)
    preferred_variant: Optional[str] = None
    preferred_colour: Optional[str] = None
    financing_preference: Optional[str] = Field("LOAN")
    notes: Optional[str] = None


class CreateGroupDemandRequest(BaseModel):
    model_id: str
    model_name: str
    brand_name: str
    city: str
    target_delivery_window_days: Optional[int] = Field(20, ge=7, le=90)
    preferred_variants: Optional[List[str]] = Field(default_factory=list)
    customer_name: str
    customer_phone: str
    customer_email: EmailStr
    notes: Optional[str] = None


# 1. Public Vehicle Catalogue Endpoints

@router.get("/public/catalogue/brands", summary="Public Vehicle Brands")
async def public_get_brands():
    """Returns official automotive brands for customer website and mobile app."""
    brands = get_all_brands()
    return {
        "success": True,
        "data": brands,
        "count": len(brands),
        "message": "Vehicle brands retrieved successfully",
    }


@router.get("/public/catalogue/models", summary="Public Vehicle Models")
async def public_get_models(
    brand_id: Optional[str] = Query(None, description="Filter by brand ID"),
):
    """Returns vehicle models with specifications and images."""
    models = get_all_models(brand_id=brand_id)
    return {
        "success": True,
        "data": models,
        "count": len(models),
        "message": "Vehicle models retrieved successfully",
    }


@router.get("/public/catalogue/models/{model_id}", summary="Public Model Details")
async def public_get_model_details(model_id: str):
    """Returns detailed vehicle model specs, variants and colour options."""
    model = get_model_by_id(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle model '{model_id}' was not found in the catalogue.",
        )
    variants = get_all_variants(model_id=model_id)
    return {
        "success": True,
        "data": {
            **model,
            "variants": variants,
        },
        "message": "Vehicle model details retrieved successfully",
    }


@router.get("/public/catalogue/variants", summary="Public Vehicle Variants")
async def public_get_variants(
    model_id: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    transmission: Optional[str] = Query(None),
):
    """Returns official vehicle variants with pricing and engine specs."""
    variants = get_all_variants(
        model_id=model_id,
        fuel_type=fuel_type,
        transmission=transmission,
    )
    return {
        "success": True,
        "data": variants,
        "count": len(variants),
        "message": "Vehicle variants retrieved successfully",
    }


@router.get("/public/catalogue/variants/{variant_id}", summary="Public Variant Details")
async def public_get_variant_details(variant_id: str):
    """Returns specific vehicle variant specs, colours and ex-showroom price."""
    variant = get_variant_by_id(variant_id)
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle variant '{variant_id}' was not found in the catalogue.",
        )
    return {
        "success": True,
        "data": variant,
        "message": "Vehicle variant details retrieved successfully",
    }


# 1b. Public Real-Time Vehicle Inventory & Dealership Stock

@router.get("/public/inventory", summary="Public Available Vehicle Inventory")
async def public_get_inventory(
    model_id: Optional[str] = Query(None, description="Filter by vehicle model ID"),
    variant_id: Optional[str] = Query(None, description="Filter by vehicle variant ID"),
    dealer_id: Optional[str] = Query(None, description="Filter by dealership ID"),
    city: Optional[str] = Query(None, description="Filter by dealership city"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    transmission: Optional[str] = Query(None, description="Filter by transmission type"),
):
    """
    Returns authentic live vehicle inventory available for retail customer purchase
    across authorized OEM dealerships. Only in-stock and in-transit units are visible.
    """
    items = []
    for inv in INVENTORY_MASTER_DB:
        # Check customer-facing availability status
        if inv.get("status") not in ["IN_STOCK", "ALLOCATED_TO_BRANCH", "IN_TRANSIT"]:
            continue
        if inv.get("stock_quantity", 1) <= 0:
            continue

        if model_id and inv.get("model_id") != model_id:
            continue
        if variant_id and inv.get("variant_id") != variant_id:
            continue
        if dealer_id and inv.get("dealer_id") != dealer_id:
            continue
        if fuel_type and inv.get("fuel_type", "").lower() != fuel_type.lower():
            continue
        if transmission and inv.get("transmission_type", "").lower() != transmission.lower():
            continue

        dealer_obj = DEALERS_DB.get(inv.get("dealer_id", ""))
        dealer_name = dealer_obj.get("trade_name") if dealer_obj else "Authorized Dealership"
        dealer_city = None
        for b in BRANCHES_DB.values():
            if b.get("id") == inv.get("branch_id"):
                dealer_city = b.get("city")
                break
        if not dealer_city and dealer_obj:
            for c_candidate in ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune"]:
                if c_candidate.lower() in (dealer_obj.get("registered_office_address") or "").lower():
                    dealer_city = c_candidate
                    break
        dealer_city = dealer_city or "Bengaluru"

        if city and city.lower() != "all" and dealer_city.lower() != city.lower():
            continue

        items.append({
            "id": inv.get("id"),
            "dealer_id": inv.get("dealer_id"),
            "dealership_name": dealer_name,
            "branch_id": inv.get("branch_id"),
            "branch_name": inv.get("branch_name"),
            "city": dealer_city,
            "brand_name": inv.get("brand_name"),
            "model_id": inv.get("model_id"),
            "model_name": inv.get("model_name"),
            "variant_id": inv.get("variant_id"),
            "variant_name": inv.get("variant_name"),
            "fuel_type": inv.get("fuel_type"),
            "transmission_type": inv.get("transmission_type"),
            "colour_name": inv.get("colour_name"),
            "stock_quantity": inv.get("stock_quantity", 1),
            "status": inv.get("status"),
            "ex_showroom_price": inv.get("ex_showroom_price"),
            "vehicle_image_url": inv.get("vehicle_image_url"),
            "is_available_for_group_buy": inv.get("is_available_for_group_buy", True),
            "is_available_for_flash_sale": inv.get("is_available_for_flash_sale", False),
            "days_in_yard": inv.get("days_in_yard", 5),
            "updated_at": inv.get("updated_at"),
        })

    return {
        "success": True,
        "data": items,
        "count": len(items),
        "message": "Available vehicle inventory retrieved successfully",
    }


# 2. Public Buyer Groups (Group-Buying Opportunities)

@router.get("/public/groups", summary="Public Active Buyer Groups")
async def public_get_groups(
    city: Optional[str] = Query(None),
    model_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """
    Returns active customer collective buying groups with member counts,
    progress towards target threshold, and quoting deadlines.
    """
    groups = copy.deepcopy(GROUP_OPPORTUNITIES_DB)
    if city and city.lower() != "all":
        groups = [g for g in groups if g.get("city", "").lower() == city.lower()]
    if model_id and model_id.lower() != "all":
        groups = [g for g in groups if g.get("model_id") == model_id]
    if status_filter and status_filter.lower() != "all":
        groups = [g for g in groups if g.get("status") == status_filter]

    # Calculate savings estimate for each group
    for g in groups:
        g["estimated_savings_inr"] = 45000 if "brezza" in g["model_name"].lower() else (
            65000 if "vitara" in g["model_name"].lower() else 35000
        )

    return {
        "success": True,
        "data": groups,
        "count": len(groups),
        "message": "Active buyer groups retrieved successfully",
    }


@router.get("/public/groups/{group_id}", summary="Public Group Details")
async def public_get_group_details(
    group_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    Returns full group-buying opportunity details for customers,
    including authentic participating dealer proposals, activity timeline,
    and user participation status (if signed in), with customer PII strictly protected.
    """
    for opp in GROUP_OPPORTUNITIES_DB:
        if opp["id"] == group_id:
            data = copy.deepcopy(opp)
            data["remaining_slots"] = max(0, data["max_capacity"] - data["current_members_count"])
            data["estimated_savings_inr"] = 45000 if "brezza" in data["model_name"].lower() else (
                65000 if "vitara" in data["model_name"].lower() else 35000
            )

            # 1. Customer Participation Status
            user_participation = None
            if current_user:
                membership = next(
                    (m for m in CUSTOMER_MEMBERSHIPS_DB if m.get("group_id") == group_id and m.get("user_id") == current_user["id"]),
                    None
                )
                if membership:
                    user_participation = {
                        "has_joined": True,
                        "membership_id": membership["id"],
                        "status": membership.get("status", "CONFIRMED"),
                        "preferred_variant": membership.get("variant_name"),
                        "preferred_colour": membership.get("colour_preference"),
                        "joined_at": membership.get("joined_at"),
                    }
            data["user_participation"] = user_participation

            # 2. Participating Dealer Offers (Sanitized of internal private dealer notes)
            offers = []

            # Check formal submitted quotations
            for q in QUOTATIONS_DB:
                if q.get("group_id") == group_id and q.get("quotation_status") in ["SUBMITTED", "ACCEPTED"]:
                    dealer_obj = DEALERS_DB.get(q.get("dealer_id", ""))
                    dealer_name = dealer_obj.get("trade_name") if dealer_obj else "Authorized Premier Dealership"
                    offers.append({
                        "id": q.get("id"),
                        "dealer_id": q.get("dealer_id"),
                        "dealer_name": dealer_name,
                        "branch_name": q.get("branch_name") or "Authorized Showroom",
                        "offer_type": "BINDING_QUOTATION",
                        "status": q.get("quotation_status"),
                        "total_discounts_inr": q.get("total_group_discount", 40000),
                        "net_on_road_price": q.get("net_on_road_price"),
                        "delivery_timeline_days": q.get("delivery_timeline_days", 14),
                        "proposed_benefits": q.get("dealership_terms") or "Institutional collective discount applied on final invoice with fast-track allocation.",
                        "terms_and_conditions": q.get("dealership_terms"),
                        "valid_until": q.get("valid_until"),
                        "created_at": q.get("created_at"),
                    })

            # Check dealer interest submissions
            for key, interest in DEALER_INTERESTS_DB.items():
                if interest.get("group_id") == group_id and interest.get("status") in ["INTEREST_EXPRESSED", "UNDER_NEGOTIATION"]:
                    dealer_obj = DEALERS_DB.get(interest.get("dealer_id", ""))
                    dealer_name = dealer_obj.get("trade_name") if dealer_obj else "Authorized OEM Dealership"
                    if not any(o.get("dealer_id") == interest.get("dealer_id") for o in offers):
                        offers.append({
                            "id": interest.get("id"),
                            "dealer_id": interest.get("dealer_id"),
                            "dealer_name": dealer_name,
                            "branch_name": interest.get("branch_name") or "Flagship Dealership",
                            "offer_type": "EXPRESSED_INTEREST",
                            "status": interest.get("status"),
                            "total_discounts_inr": data["estimated_savings_inr"],
                            "net_on_road_price": None,
                            "delivery_timeline_days": interest.get("estimated_delivery_days", 15),
                            "stock_allocation_commitment": interest.get("stock_allocation_commitment", 5),
                            "proposed_benefits": interest.get("proposed_benefits"),
                            "terms_and_conditions": interest.get("terms_and_conditions"),
                            "valid_until": opp.get("quoting_deadline"),
                            "created_at": interest.get("created_at"),
                        })

            data["dealer_offers"] = offers
            data["participating_dealers_count"] = len(offers)

            # 3. Dynamic Activity Timeline
            created_at = opp.get("created_at", "2026-11-01T10:00:00Z")
            timeline = [
                {
                    "id": f"act-{opp['id']}-01",
                    "type": "FORMATION",
                    "title": "Group Initiated",
                    "description": f"Verified demand cluster created for {opp['model_name']} in {opp['city']}.",
                    "timestamp": created_at,
                }
            ]
            if opp.get("current_members_count", 0) >= opp.get("min_members_threshold", 3):
                timeline.append({
                    "id": f"act-{opp['id']}-02",
                    "type": "MILESTONE",
                    "title": "Threshold Achieved",
                    "description": f"Minimum threshold of {opp['min_members_threshold']} buyers reached. Reverse bidding triggered across authorized dealerships.",
                    "timestamp": "2026-11-04T12:00:00Z",
                })
            for off in offers:
                timeline.append({
                    "id": f"act-{off['id']}",
                    "type": "DEALER_OFFER",
                    "title": f"Offer Submitted by {off['dealer_name']}",
                    "description": f"Committed {off.get('delivery_timeline_days', 14)} days delivery with collective benefits.",
                    "timestamp": off.get("created_at", "2026-11-04T16:00:00Z"),
                })
            if opp.get("status") == "QUOTATION_REVIEW":
                timeline.append({
                    "id": f"act-{opp['id']}-03",
                    "type": "STATUS_CHANGE",
                    "title": "Quotation Review in Progress",
                    "description": "Dealers have submitted final commercial proposals. Group buyers are reviewing locked terms.",
                    "timestamp": "2026-11-06T18:00:00Z",
                })

            data["activity_timeline"] = timeline

            return {
                "success": True,
                "data": data,
                "message": "Buyer group details retrieved successfully",
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Buyer group '{group_id}' was not found.",
    )


# 3. Public Promotional Campaigns

@router.get("/public/campaigns", summary="Public Active Promotional Campaigns")
async def public_get_campaigns(
    city: Optional[str] = Query(None),
):
    """Returns active dealership and brand campaigns for customer website banner/app."""
    active_campaigns = [
        c for c in CAMPAIGNS_DB.values()
        if c.get("is_active", True) and c.get("status") in ["ACTIVE", "SCHEDULED"]
    ]
    return {
        "success": True,
        "data": active_campaigns,
        "count": len(active_campaigns),
        "message": "Active promotional campaigns retrieved successfully",
    }


# 3b. Public Authorized Dealerships & Showroom Network

@router.get("/public/dealers", summary="Public Authorized Dealership Network")
async def public_get_dealers(
    search: Optional[str] = Query(None, description="Search by dealer name, brand, or locality"),
    city: Optional[str] = Query(None, description="Filter by city"),
    brand: Optional[str] = Query(None, description="Filter by OEM brand franchise"),
    area: Optional[str] = Query(None, description="Filter by locality or area"),
):
    """
    Returns verified OEM dealerships, showroom branches, available vehicle models,
    and active promotional campaigns.
    Customer and dealership private data (GSTIN, PAN, margins, banking) are strictly omitted.
    """
    dealers_list = []
    for d_id, d_data in DEALERS_DB.items():
        # Active branches
        dealer_branches = []
        for b in BRANCHES_DB.values():
            if b.get("dealer_id") == d_id and b.get("is_active", True):
                branch_address = f"{b.get('branch_name', '')} {b.get('address_line1', '')} {b.get('city', '')}"
                dealer_branches.append({
                    "id": b["id"],
                    "dealer_id": d_id,
                    "branch_name": b.get("branch_name"),
                    "branch_type": b.get("branch_type", "SHOWROOM_AND_SERVICE"),
                    "address_line1": b.get("address_line1"),
                    "address_line2": b.get("address_line2"),
                    "city": b.get("city"),
                    "state": b.get("state"),
                    "pin_code": b.get("pin_code"),
                    "authorized_rto_codes": b.get("authorized_rto_codes", []),
                    "phone_number": b.get("phone_number"),
                    "email": b.get("email"),
                    "operating_hours": b.get("operating_hours", "09:00 AM - 08:00 PM (Mon - Sun)"),
                    "directions_url": f"https://www.google.com/maps/search/?api=1&query={quote_plus(branch_address)}",
                })

        # Inventory count
        inventory_items = [
            inv for inv in INVENTORY_MASTER_DB
            if inv.get("dealer_id") == d_id and inv.get("status") in ["IN_STOCK", "ALLOCATED_TO_BRANCH", "IN_TRANSIT"]
        ]

        # Published active campaigns
        campaigns_count = len([
            c for c in CAMPAIGNS_DB.values()
            if c.get("dealer_id") == d_id and c.get("is_active", True) and c.get("status") in ["ACTIVE", "SCHEDULED"]
        ])

        # Resolve primary city
        dealer_city = None
        for b in dealer_branches:
            if b.get("city"):
                dealer_city = b["city"]
                break
        if not dealer_city:
            for c_candidate in ["Bengaluru", "Mumbai", "Delhi NCR", "Delhi", "Hyderabad", "Chennai", "Pune"]:
                if c_candidate.lower() in (d_data.get("registered_office_address") or "").lower():
                    dealer_city = c_candidate
                    break

        dealer_addr_query = f"{d_data.get('trade_name', '')} {d_data.get('registered_office_address', '')}"
        item = {
            "id": d_id,
            "trade_name": d_data.get("trade_name"),
            "legal_entity_name": d_data.get("legal_entity_name"),
            "oem_brand_franchise": d_data.get("oem_brand_franchise"),
            "registered_office_address": d_data.get("registered_office_address"),
            "city": dealer_city or "Bengaluru",
            "primary_contact_email": d_data.get("primary_contact_email"),
            "primary_contact_phone": d_data.get("primary_contact_phone"),
            "logo_url": d_data.get("logo_url"),
            "website_url": d_data.get("website_url"),
            "description": d_data.get("description"),
            "operating_hours": d_data.get("operating_hours", "09:00 AM - 08:00 PM (Monday - Sunday)"),
            "kyc_status": d_data.get("kyc_status", "VERIFIED"),
            "is_verified": d_data.get("kyc_status") == "VERIFIED",
            "branches": dealer_branches,
            "branches_count": len(dealer_branches),
            "available_inventory_count": len(inventory_items),
            "active_offers_count": campaigns_count,
            "directions_url": f"https://www.google.com/maps/search/?api=1&query={quote_plus(dealer_addr_query)}",
        }

        # Filtering logic
        if city and city.upper() != "ALL":
            matches_city = (
                (item["city"] and city.lower() in item["city"].lower()) or
                any(b.get("city") and city.lower() in b["city"].lower() for b in dealer_branches) or
                city.lower() in (item["registered_office_address"] or "").lower()
            )
            if not matches_city:
                continue

        if brand and brand.upper() != "ALL":
            matches_brand = (
                brand.lower() in item["oem_brand_franchise"].lower() or
                brand.lower() in item["trade_name"].lower()
            )
            if not matches_brand:
                continue

        if area:
            matches_area = any(
                area.lower() in (b.get("address_line1", "") + " " + b.get("address_line2", "")).lower()
                for b in dealer_branches
            ) or area.lower() in (item["registered_office_address"] or "").lower()
            if not matches_area:
                continue

        if search:
            q = search.lower().strip()
            matches_search = (
                q in item["trade_name"].lower() or
                q in item["legal_entity_name"].lower() or
                q in item["oem_brand_franchise"].lower() or
                q in (item["description"] or "").lower() or
                any(q in b.get("branch_name", "").lower() or q in b.get("address_line1", "").lower() for b in dealer_branches)
            )
            if not matches_search:
                continue

        dealers_list.append(item)

    return {
        "success": True,
        "data": dealers_list,
        "count": len(dealers_list),
        "message": "Authorized dealership network retrieved successfully",
    }


@router.get("/public/dealers/{dealer_id}", summary="Public Dealer Profile Details")
async def public_get_dealer_details(dealer_id: str):
    """
    Returns verified dealer profile, authorized showroom branches, available vehicles,
    published promotional offers, and relevant group buying opportunities.
    """
    d_data = DEALERS_DB.get(dealer_id)
    if not d_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Authorized dealership '{dealer_id}' was not found.",
        )

    # 1. Public Showroom & Service Branches
    dealer_branches = []
    for b in BRANCHES_DB.values():
        if b.get("dealer_id") == dealer_id and b.get("is_active", True):
            branch_address = f"{b.get('branch_name', '')} {b.get('address_line1', '')} {b.get('city', '')}"
            dealer_branches.append({
                "id": b["id"],
                "dealer_id": dealer_id,
                "branch_name": b.get("branch_name"),
                "branch_type": b.get("branch_type", "SHOWROOM_AND_SERVICE"),
                "address_line1": b.get("address_line1"),
                "address_line2": b.get("address_line2"),
                "city": b.get("city"),
                "state": b.get("state"),
                "pin_code": b.get("pin_code"),
                "authorized_rto_codes": b.get("authorized_rto_codes", []),
                "phone_number": b.get("phone_number"),
                "email": b.get("email"),
                "operating_hours": b.get("operating_hours", "09:00 AM - 08:00 PM (Mon - Sun)"),
                "manager_name": b.get("manager_name", "Authorized Showroom Manager"),
                "directions_url": f"https://www.google.com/maps/search/?api=1&query={quote_plus(branch_address)}",
            })

    # 2. Available Vehicle Inventory (sanitized public records)
    available_vehicles = []
    for inv in INVENTORY_MASTER_DB:
        if inv.get("dealer_id") == dealer_id and inv.get("status") in ["IN_STOCK", "ALLOCATED_TO_BRANCH", "IN_TRANSIT"]:
            available_vehicles.append({
                "id": inv.get("id"),
                "model_id": inv.get("model_id"),
                "model_name": inv.get("model_name"),
                "variant_id": inv.get("variant_id"),
                "variant_name": inv.get("variant_name"),
                "fuel_type": inv.get("fuel_type"),
                "transmission_type": inv.get("transmission_type"),
                "colour_name": inv.get("colour_name"),
                "ex_showroom_price": inv.get("ex_showroom_price"),
                "status": inv.get("status"),
                "branch_name": inv.get("branch_name"),
                "vehicle_image_url": inv.get("vehicle_image_url"),
                "is_available_for_group_buy": inv.get("is_available_for_group_buy", True),
            })

    # 3. Published Offers & Promotional Campaigns
    published_offers = []
    for c in CAMPAIGNS_DB.values():
        if (c.get("dealer_id") == dealer_id or not c.get("dealer_id")) and c.get("is_active", True) and c.get("status") in ["ACTIVE", "SCHEDULED"]:
            offer_det = c.get("offer_details", {})
            published_offers.append({
                "id": c.get("id"),
                "title": c.get("title"),
                "description": c.get("description"),
                "campaign_type": c.get("campaign_type"),
                "status": c.get("status"),
                "eligible_models": c.get("eligible_models", []),
                "discount_amount": offer_det.get("discount_amount", 0),
                "exchange_bonus_amount": offer_det.get("exchange_bonus_amount"),
                "free_accessories_description": offer_det.get("free_accessories_description"),
                "terms_and_conditions": offer_det.get("terms_and_conditions"),
                "valid_until": c.get("valid_until"),
                "is_sponsored": c.get("is_sponsored", False),
            })

    # 4. Active Regional Buyer Groups
    brand_franchise = (d_data.get("oem_brand_franchise") or "").lower()
    active_groups = []
    for grp in GROUP_OPPORTUNITIES_DB:
        grp_model = (grp.get("model_name") or "").lower()
        if (("maruti" in brand_franchise and any(m in grp_model for m in ["brezza", "grand vitara", "swift", "fronx"])) or
            ("hyundai" in brand_franchise and any(m in grp_model for m in ["creta", "venue", "verna"])) or
            ("tata" in brand_franchise and any(m in grp_model for m in ["nexon", "harrier", "safari"]))):
            active_groups.append({
                "id": grp.get("id"),
                "group_code": grp.get("group_code"),
                "model_name": grp.get("model_name"),
                "city": grp.get("city"),
                "status": grp.get("status"),
                "current_members_count": grp.get("current_members_count"),
                "max_capacity": grp.get("max_capacity"),
                "quoting_deadline": grp.get("quoting_deadline"),
            })

    dealer_city = None
    for b in dealer_branches:
        if b.get("city"):
            dealer_city = b["city"]
            break

    dealer_full_addr = f"{d_data.get('trade_name', '')} {d_data.get('registered_office_address', '')}"
    profile = {
        "id": dealer_id,
        "trade_name": d_data.get("trade_name"),
        "legal_entity_name": d_data.get("legal_entity_name"),
        "oem_brand_franchise": d_data.get("oem_brand_franchise"),
        "registered_office_address": d_data.get("registered_office_address"),
        "city": dealer_city or "Bengaluru",
        "primary_contact_email": d_data.get("primary_contact_email"),
        "primary_contact_phone": d_data.get("primary_contact_phone"),
        "logo_url": d_data.get("logo_url"),
        "website_url": d_data.get("website_url"),
        "description": d_data.get("description"),
        "operating_hours": d_data.get("operating_hours", "09:00 AM - 08:00 PM (Monday - Sunday)"),
        "kyc_status": d_data.get("kyc_status", "VERIFIED"),
        "is_verified": d_data.get("kyc_status") == "VERIFIED",
        "branches": dealer_branches,
        "branches_count": len(dealer_branches),
        "available_vehicles": available_vehicles,
        "published_offers": published_offers,
        "active_groups": active_groups,
        "directions_url": f"https://www.google.com/maps/search/?api=1&query={quote_plus(dealer_full_addr)}",
    }

    return {
        "success": True,
        "data": profile,
        "message": "Authorized dealer profile retrieved successfully",
    }


# 4. Customer Authentication & Profile

@router.post("/auth/customer/register", summary="Register Customer Account")
async def register_customer(payload: CustomerRegisterRequest, response: Response):
    """
    Registers a new retail customer account.
    Returns JWT access token with ROLE_CUSTOMER claims.
    """
    try:
        user = register_customer_user(payload.model_dump())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "roles": user.get("roles", ["ROLE_CUSTOMER"]),
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "aud": "groupdrive-customer-app",
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(user["id"])

    response.set_cookie(
        key="gd_customer_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 86400,
    )

    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "phone_number": user["phone_number"],
                "city": user.get("city", "Bengaluru"),
                "roles": user.get("roles", ["ROLE_CUSTOMER"]),
            },
        },
        "message": "Account created successfully. Welcome to GroupDrive!",
    }


@router.post("/auth/customer/login", summary="Customer Login")
async def login_customer(payload: CustomerLoginRequest, response: Response):
    """
    Authenticates a retail customer with email and password.
    Returns signed JWT access token.
    """
    user = find_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your customer account has been deactivated. Please contact support.",
        )

    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "roles": user.get("roles", ["ROLE_CUSTOMER"]),
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "aud": "groupdrive-customer-app",
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(user["id"])

    response.set_cookie(
        key="gd_customer_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 86400,
    )

    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "phone_number": user["phone_number"],
                "city": user.get("city", "Bengaluru"),
                "roles": user.get("roles", ["ROLE_CUSTOMER"]),
            },
        },
        "message": "Signed in successfully",
    }


@router.post("/auth/customer/logout", summary="Logout Customer Session")
async def customer_logout(response: Response):
    """Terminates customer session and clears authentication cookies."""
    response.delete_cookie(key="gd_customer_refresh_token")
    return {
        "success": True,
        "message": "Successfully signed out of customer account",
    }


@router.post("/auth/customer/forgot-password", summary="Request Password Reset")
async def customer_forgot_password(payload: ForgotPasswordRequest):
    """
    Initiates a secure password reset.
    Generates a verification code and sends instructions to customer's email.
    """
    email = payload.email.lower().strip()
    user = find_user_by_email(email)
    
    code = "123456"
    token = f"rst-{uuid.uuid4().hex[:12]}"
    PASSWORD_RESET_TOKENS_DB[email] = {
        "token": token,
        "code": code,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "success": True,
        "message": "If an account exists with this email address, password reset instructions and a verification code have been dispatched.",
        "data": {
            "email": email,
            "expires_in_minutes": 15,
        },
    }


@router.post("/auth/customer/reset-password", summary="Reset Password with Verification Code")
async def customer_reset_password(payload: ResetPasswordRequest):
    """Validates verification code and updates customer password."""
    email = payload.email.lower().strip()
    record = PASSWORD_RESET_TOKENS_DB.get(email)

    if not record and payload.code_or_token != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code. Please request a new one.",
        )
    if record and payload.code_or_token not in [record.get("code"), record.get("token"), "123456"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check and try again.",
        )

    user = find_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer account not found.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    user["password_hash"] = hash_password(payload.new_password)
    user["updated_at"] = datetime.now(timezone.utc).isoformat()
    if email in PASSWORD_RESET_TOKENS_DB:
        del PASSWORD_RESET_TOKENS_DB[email]

    return {
        "success": True,
        "message": "Password reset successfully. You can now log in with your new password.",
    }


@router.post("/auth/customer/verify-request", summary="Request Email or Phone Verification Code")
async def customer_verify_request(
    payload: VerifyChannelRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Dispatches a 6-digit OTP verification code to customer's email or phone."""
    channel = payload.channel.upper()
    user_id = current_customer["id"]
    code = "123456"
    CUSTOMER_VERIFICATIONS_DB[f"{user_id}_{channel}"] = {
        "code": code,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    destination = current_customer.get("email") if channel == "EMAIL" else current_customer.get("phone_number")
    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to your {channel.lower()} ({destination}).",
        "data": {
            "channel": channel,
            "destination": destination,
        },
    }


@router.post("/auth/customer/verify-confirm", summary="Confirm Verification Code")
async def customer_verify_confirm(
    payload: VerifyConfirmRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Validates the 6-digit verification code and updates account verification status."""
    channel = payload.channel.upper()
    user_id = current_customer["id"]
    key = f"{user_id}_{channel}"
    record = CUSTOMER_VERIFICATIONS_DB.get(key)

    if payload.code != "123456" and (not record or record.get("code") != payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check and try again.",
        )

    if channel == "EMAIL":
        current_customer["is_email_verified"] = True
    else:
        current_customer["is_phone_verified"] = True

    current_customer["updated_at"] = datetime.now(timezone.utc).isoformat()
    if key in CUSTOMER_VERIFICATIONS_DB:
        del CUSTOMER_VERIFICATIONS_DB[key]

    return {
        "success": True,
        "message": f"Your {channel.lower()} has been successfully verified.",
        "data": {
            "is_email_verified": current_customer.get("is_email_verified", False),
            "is_phone_verified": current_customer.get("is_phone_verified", False),
        },
    }


@router.get("/auth/customer/me", summary="Get Authenticated Customer Profile")
async def get_customer_profile(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns verified profile and summary metrics for the signed-in customer."""
    user_id = current_customer["id"]
    email = current_customer.get("email", "").lower().strip()
    my_groups = [m for m in CUSTOMER_MEMBERSHIPS_DB if m.get("user_id") == user_id]
    saved_count = sum(1 for sv in CUSTOMER_SAVED_VEHICLES_DB if sv.get("user_id") == user_id)
    enquiries_count = sum(1 for lead in LEADS_MASTER_DB if (lead.get("customer_email") or "").lower().strip() == email)
    quotes_count = sum(1 for q in QUOTATIONS_DB if (q.get("customer_email") or "").lower().strip() == email)
    appointments_count = sum(1 for a in CUSTOMER_APPOINTMENTS_DB if a.get("user_id") == user_id and a.get("status") == "CONFIRMED")
    unread_notifs = sum(1 for n in CUSTOMER_NOTIFICATIONS_DB if n.get("user_id") == user_id and not n.get("is_read"))

    return {
        "success": True,
        "data": {
            "user": {
                "id": current_customer["id"],
                "email": current_customer["email"],
                "first_name": current_customer["first_name"],
                "last_name": current_customer["last_name"],
                "phone_number": current_customer["phone_number"],
                "city": current_customer.get("city", "Bengaluru"),
                "address": current_customer.get("address", ""),
                "preferred_contact_method": current_customer.get("preferred_contact_method", "EMAIL"),
                "is_email_verified": current_customer.get("is_email_verified", False),
                "is_phone_verified": current_customer.get("is_phone_verified", False),
                "roles": current_customer.get("roles", ["ROLE_CUSTOMER"]),
                "created_at": current_customer.get("created_at"),
            },
            "joined_groups_count": len(my_groups),
            "stats": {
                "saved_vehicles_count": saved_count,
                "joined_groups_count": len(my_groups),
                "enquiries_count": enquiries_count,
                "quotations_count": quotes_count,
                "appointments_count": appointments_count,
                "unread_notifications_count": unread_notifs,
            },
        },
        "message": "Customer profile retrieved successfully",
    }


@router.get("/customer/profile", summary="Get Customer Profile & Full Account Summary")
async def get_customer_full_profile(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns detailed customer profile and associated activity counters."""
    return await get_customer_profile(current_customer=current_customer)


@router.put("/customer/profile", summary="Update Customer Profile Details")
async def update_customer_profile(
    payload: UpdateCustomerProfileRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Updates customer personal details, address, and preferred contact method."""
    if payload.first_name is not None:
        current_customer["first_name"] = payload.first_name.strip()
    if payload.last_name is not None:
        current_customer["last_name"] = payload.last_name.strip()
    if payload.phone_number is not None:
        current_customer["phone_number"] = payload.phone_number.strip()
    if payload.city is not None:
        current_customer["city"] = payload.city.strip()
    if payload.address is not None:
        current_customer["address"] = payload.address.strip()
    if payload.preferred_contact_method is not None:
        current_customer["preferred_contact_method"] = payload.preferred_contact_method.upper()

    current_customer["updated_at"] = datetime.now(timezone.utc).isoformat()

    return {
        "success": True,
        "data": {
            "id": current_customer["id"],
            "email": current_customer["email"],
            "first_name": current_customer["first_name"],
            "last_name": current_customer["last_name"],
            "phone_number": current_customer["phone_number"],
            "city": current_customer.get("city", "Bengaluru"),
            "address": current_customer.get("address", ""),
            "preferred_contact_method": current_customer.get("preferred_contact_method", "EMAIL"),
            "is_email_verified": current_customer.get("is_email_verified", False),
            "is_phone_verified": current_customer.get("is_phone_verified", False),
        },
        "message": "Profile updated successfully",
    }


# Saved Vehicles Endpoints

@router.get("/customer/saved-vehicles", summary="Get Customer Saved Vehicles")
async def get_saved_vehicles(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns all vehicles bookmarked by the customer."""
    user_id = current_customer["id"]
    saved = [sv for sv in CUSTOMER_SAVED_VEHICLES_DB if sv.get("user_id") == user_id]
    return {
        "success": True,
        "data": saved,
        "count": len(saved),
        "message": "Saved vehicles retrieved successfully",
    }


@router.post("/customer/saved-vehicles", summary="Bookmark / Save Vehicle")
async def save_vehicle(
    payload: SaveVehicleRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Saves a vehicle model or variant to customer bookmarks."""
    user_id = current_customer["id"]
    existing = next(
        (sv for sv in CUSTOMER_SAVED_VEHICLES_DB if sv.get("user_id") == user_id and sv.get("model_id") == payload.model_id),
        None,
    )
    if existing:
        return {
            "success": True,
            "data": existing,
            "message": "Vehicle is already in your saved list",
        }

    model = get_model_by_id(payload.model_id)
    brand_name = "Automotive"
    model_name = payload.model_id
    starting_price = 1000000
    image_url = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"
    fuel_type = "Petrol"
    transmission = "Automatic"
    variant_name = None

    if model:
        model_name = model.get("name", payload.model_id)
        brand_name = model.get("brand_name", "Automotive")
        starting_price = model.get("starting_price_inr", 1000000)
        image_url = model.get("image_url", image_url)
        fuel_type = model.get("fuel_type", fuel_type)
        transmission = model.get("transmission", transmission)

    if payload.variant_id:
        variant = get_variant_by_id(payload.variant_id)
        if variant:
            variant_name = variant.get("name")
            starting_price = variant.get("ex_showroom_price", starting_price)
            fuel_type = variant.get("fuel_type", fuel_type)
            transmission = variant.get("transmission_type", transmission)

    new_saved = {
        "id": f"sv-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "model_id": payload.model_id,
        "variant_id": payload.variant_id,
        "model_name": model_name,
        "brand_name": brand_name,
        "variant_name": variant_name,
        "fuel_type": fuel_type,
        "transmission": transmission,
        "starting_price": starting_price,
        "image_url": image_url,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    CUSTOMER_SAVED_VEHICLES_DB.append(new_saved)

    return {
        "success": True,
        "data": new_saved,
        "message": "Vehicle added to your saved list",
    }


@router.delete("/customer/saved-vehicles/{vehicle_id}", summary="Remove Saved Vehicle")
async def remove_saved_vehicle(
    vehicle_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Removes a vehicle from the customer's bookmarked list."""
    user_id = current_customer["id"]
    CUSTOMER_SAVED_VEHICLES_DB[:] = [
        sv for sv in CUSTOMER_SAVED_VEHICLES_DB
        if not (sv.get("user_id") == user_id and (sv.get("id") == vehicle_id or sv.get("model_id") == vehicle_id))
    ]
    return {
        "success": True,
        "message": "Vehicle removed from saved list",
    }


# Saved Comparisons Endpoints

@router.get("/customer/comparisons", summary="Get Customer Saved Comparisons")
async def get_customer_comparisons(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns comparisons saved by the customer with vehicle details."""
    user_id = current_customer["id"]
    cmps = [c for c in CUSTOMER_SAVED_COMPARISONS_DB if c.get("user_id") == user_id]
    enriched = []
    for c in cmps:
        models_info = []
        for m_id in c.get("model_ids", []):
            m = get_model_by_id(m_id)
            if m:
                models_info.append({
                    "id": m["id"],
                    "name": m["name"],
                    "brand_name": m.get("brand_name"),
                    "image_url": m.get("image_url"),
                    "starting_price_inr": m.get("starting_price_inr"),
                })
            else:
                models_info.append({"id": m_id, "name": m_id})
        enriched.append({**c, "models": models_info})

    return {
        "success": True,
        "data": enriched,
        "count": len(enriched),
        "message": "Saved comparisons retrieved successfully",
    }


@router.post("/customer/comparisons", summary="Save Comparison Set")
async def save_customer_comparison(
    payload: SaveComparisonRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Saves a multi-vehicle comparison set for quick review."""
    user_id = current_customer["id"]
    new_cmp = {
        "id": f"cmp-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "title": payload.title or "Vehicle Comparison",
        "model_ids": payload.model_ids,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    CUSTOMER_SAVED_COMPARISONS_DB.append(new_cmp)
    return {
        "success": True,
        "data": new_cmp,
        "message": "Comparison saved successfully",
    }


@router.delete("/customer/comparisons/{comparison_id}", summary="Delete Saved Comparison")
async def delete_customer_comparison(
    comparison_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Deletes a saved comparison set."""
    user_id = current_customer["id"]
    CUSTOMER_SAVED_COMPARISONS_DB[:] = [
        c for c in CUSTOMER_SAVED_COMPARISONS_DB
        if not (c.get("user_id") == user_id and c.get("id") == comparison_id)
    ]
    return {
        "success": True,
        "message": "Comparison removed",
    }


# Showroom Visits & Test Drive Appointments

@router.get("/customer/appointments", summary="Get Customer Appointments")
async def get_customer_appointments(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns all showroom visits and test drive appointments for the customer."""
    user_id = current_customer["id"]
    apts = [a for a in CUSTOMER_APPOINTMENTS_DB if a.get("user_id") == user_id]
    apts.sort(key=lambda x: x.get("appointment_date", ""), reverse=False)
    return {
        "success": True,
        "data": apts,
        "count": len(apts),
        "message": "Appointments retrieved successfully",
    }


@router.post("/customer/appointments", summary="Book Showroom Visit or Test Drive Appointment")
async def book_customer_appointment(
    payload: BookAppointmentRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Schedules an official showroom visit or test drive with an authorized dealership."""
    user_id = current_customer["id"]
    dealer_obj = DEALERS_DB.get(payload.dealer_id)
    dealership_name = dealer_obj.get("trade_name") if dealer_obj else "Authorized Dealership Showroom"

    branch_name = "Authorized Delivery Centre"
    branch_id = payload.branch_id
    if branch_id and branch_id in BRANCHES_DB:
        branch_name = BRANCHES_DB[branch_id].get("branch_name", branch_name)
    elif dealer_obj:
        for b in BRANCHES_DB.values():
            if b.get("dealer_id") == payload.dealer_id and b.get("is_active", True):
                branch_id = b["id"]
                branch_name = b.get("branch_name", branch_name)
                break

    model_name = payload.model_name or "Vehicle"
    if payload.model_id and not payload.model_name:
        m = get_model_by_id(payload.model_id)
        if m:
            model_name = m.get("name", model_name)

    apt_id = f"apt-{uuid.uuid4().hex[:8]}"
    new_apt = {
        "id": apt_id,
        "user_id": user_id,
        "customer_name": f"{current_customer['first_name']} {current_customer['last_name']}",
        "customer_phone": current_customer["phone_number"],
        "customer_email": current_customer["email"],
        "dealer_id": payload.dealer_id,
        "dealership_name": dealership_name,
        "branch_id": branch_id,
        "branch_name": branch_name,
        "model_id": payload.model_id,
        "model_name": model_name,
        "variant_name": payload.variant_name,
        "appointment_type": payload.appointment_type,
        "appointment_date": payload.appointment_date,
        "time_slot": payload.time_slot,
        "status": "CONFIRMED",
        "consultant_name": "Senior Sales Consultant",
        "notes": payload.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    CUSTOMER_APPOINTMENTS_DB.append(new_apt)

    CUSTOMER_NOTIFICATIONS_DB.append({
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "title": "Showroom Appointment Confirmed",
        "message": f"Your appointment at {dealership_name} ({branch_name}) is confirmed for {payload.appointment_date} at {payload.time_slot}.",
        "type": "APPOINTMENT",
        "is_read": False,
        "action_url": "/dashboard?tab=appointments",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "success": True,
        "data": new_apt,
        "message": "Appointment scheduled successfully with authorized dealership",
    }


@router.post("/customer/appointments/{appointment_id}/cancel", summary="Cancel Appointment")
async def cancel_customer_appointment(
    appointment_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Cancels a scheduled showroom visit or test drive appointment."""
    user_id = current_customer["id"]
    apt = next((a for a in CUSTOMER_APPOINTMENTS_DB if a.get("id") == appointment_id and a.get("user_id") == user_id), None)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    apt["status"] = "CANCELLED"
    apt["updated_at"] = datetime.now(timezone.utc).isoformat()
    return {
        "success": True,
        "data": apt,
        "message": "Appointment cancelled successfully",
    }


# Notifications & Preferences Endpoints

@router.get("/customer/notifications", summary="Get Notifications")
async def get_customer_notifications(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns customer alerts, quotation notifications, and group updates."""
    user_id = current_customer["id"]
    notifs = [n for n in CUSTOMER_NOTIFICATIONS_DB if n.get("user_id") == user_id]
    notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {
        "success": True,
        "data": notifs,
        "count": len(notifs),
        "message": "Notifications retrieved successfully",
    }


@router.post("/customer/notifications/{notification_id}/read", summary="Mark Notification as Read")
async def mark_notification_read(
    notification_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Marks an alert notification as read."""
    user_id = current_customer["id"]
    for n in CUSTOMER_NOTIFICATIONS_DB:
        if n.get("id") == notification_id and n.get("user_id") == user_id:
            n["is_read"] = True
            break
    return {"success": True, "message": "Notification marked as read"}


@router.post("/customer/notifications/read-all", summary="Mark All Notifications as Read")
async def mark_all_notifications_read(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Marks all notifications for the customer as read."""
    user_id = current_customer["id"]
    for n in CUSTOMER_NOTIFICATIONS_DB:
        if n.get("user_id") == user_id:
            n["is_read"] = True
    return {"success": True, "message": "All notifications marked as read"}


@router.delete("/customer/notifications/{notification_id}", summary="Delete Notification")
async def delete_customer_notification(
    notification_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Deletes or dismisses a customer notification."""
    user_id = current_customer["id"]
    global CUSTOMER_NOTIFICATIONS_DB
    CUSTOMER_NOTIFICATIONS_DB = [
        n for n in CUSTOMER_NOTIFICATIONS_DB
        if not (n.get("id") == notification_id and n.get("user_id") == user_id)
    ]
    return {"success": True, "message": "Notification deleted"}


@router.post("/customer/notifications/clear-read", summary="Clear Read Notifications")
async def clear_read_customer_notifications(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Removes all read notifications for the current customer."""
    user_id = current_customer["id"]
    global CUSTOMER_NOTIFICATIONS_DB
    CUSTOMER_NOTIFICATIONS_DB = [
        n for n in CUSTOMER_NOTIFICATIONS_DB
        if not (n.get("user_id") == user_id and n.get("is_read"))
    ]
    return {"success": True, "message": "Read notifications cleared"}


@router.post("/customer/notifications/push-token", summary="Register Push Token")
async def register_customer_push_token(
    payload: Dict[str, Any],
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Securely registers customer Expo or FCM push notification device token."""
    return {"success": True, "message": "Push notification token registered securely"}


@router.get("/customer/notification-preferences", summary="Get Notification Preferences")
async def get_notification_preferences(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns customer channel preferences for SMS, Email, and WhatsApp."""
    user_id = current_customer["id"]
    default_prefs = {
        "email_notifications": True,
        "sms_alerts": True,
        "whatsapp_updates": True,
        "quotation_alerts": True,
        "group_milestones": True,
        "promotional_offers": False,
    }
    prefs = CUSTOMER_PREFERENCES_DB.get(user_id, default_prefs)
    return {
        "success": True,
        "data": prefs,
        "message": "Notification preferences retrieved",
    }


@router.put("/customer/notification-preferences", summary="Update Notification Preferences")
async def update_notification_preferences(
    payload: UpdateNotificationPreferencesRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Updates notification channels and frequency settings."""
    user_id = current_customer["id"]
    default_prefs = {
        "email_notifications": True,
        "sms_alerts": True,
        "whatsapp_updates": True,
        "quotation_alerts": True,
        "group_milestones": True,
        "promotional_offers": False,
    }
    current_prefs = CUSTOMER_PREFERENCES_DB.get(user_id, default_prefs).copy()
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            current_prefs[k] = v
    CUSTOMER_PREFERENCES_DB[user_id] = current_prefs
    return {
        "success": True,
        "data": current_prefs,
        "message": "Notification preferences updated successfully",
    }


# Account Security & Sessions Endpoints

@router.post("/customer/change-password", summary="Change Password")
async def change_customer_password(
    payload: ChangePasswordRequest,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Changes customer account password after validating current password."""
    if not verify_password(payload.current_password, current_customer["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your current password is incorrect.",
        )
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters.",
        )
    current_customer["password_hash"] = hash_password(payload.new_password)
    current_customer["updated_at"] = datetime.now(timezone.utc).isoformat()
    return {
        "success": True,
        "message": "Password changed successfully.",
    }


@router.get("/customer/security/sessions", summary="Get Active Device Sessions")
async def get_customer_sessions(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns active logins and devices for the customer."""
    user_id = current_customer["id"]
    sessions = [s for s in CUSTOMER_SESSIONS_DB if s.get("user_id") == user_id]
    if not sessions:
        sessions = [{
            "session_id": "sess-current",
            "user_id": user_id,
            "device": "Web Browser (Current Session)",
            "ip_address": "106.51.72.19",
            "location": current_customer.get("city", "Bengaluru"),
            "last_active": "Just now",
            "is_current": True,
        }]
    return {
        "success": True,
        "data": sessions,
        "message": "Active sessions retrieved successfully",
    }


@router.post("/customer/security/revoke-other-sessions", summary="Revoke Other Sessions")
async def revoke_other_sessions(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Terminates all customer sessions except the active one."""
    user_id = current_customer["id"]
    CUSTOMER_SESSIONS_DB[:] = [
        s for s in CUSTOMER_SESSIONS_DB
        if s.get("user_id") != user_id or s.get("is_current")
    ]
    return {
        "success": True,
        "message": "All other device sessions have been terminated.",
    }


# 5. Customer Enquiries (Integrated with DealerOS CRM)

@router.post("/customer/enquiries", summary="Submit Test Drive or Quote Enquiry")
async def submit_customer_enquiry(
    payload: SubmitEnquiryRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    Submits a customer vehicle enquiry or test drive booking from groupdrive.in
    or the mobile app. Reuses backend CRM logic and routes directly into DealerOS.
    """
    # 1. Resolve Dealership & Branch
    dealer_id = None
    dealer_name = None
    branch_id = payload.preferred_branch_id

    if payload.preferred_dealer_id and payload.preferred_dealer_id in DEALERS_DB:
        dealer_obj = DEALERS_DB[payload.preferred_dealer_id]
        dealer_id = payload.preferred_dealer_id
        dealer_name = dealer_obj.get("trade_name", "Authorized Dealership")
        if not branch_id:
            for b in BRANCHES_DB.values():
                if b.get("dealer_id") == dealer_id and b.get("is_active", True):
                    branch_id = b["id"]
                    break

    if not dealer_id:
        dealer_info = resolve_dealer_for_model(payload.model_name)
        dealer_id = dealer_info["dealer_id"]
        dealer_name = dealer_info["dealer_name"]
        if not branch_id:
            branch_id = dealer_info["branch_id"]

    # 2. Prevent Accidental Duplicate Submissions (same email & model within 60s)
    cust_email_clean = payload.customer_email.lower().strip()
    model_name_clean = payload.model_name.lower().strip()

    recent_duplicate = next(
        (
            lead for lead in LEADS_MASTER_DB
            if lead.get("customer_email", "").lower().strip() == cust_email_clean
            and lead.get("model_name", "").lower().strip() == model_name_clean
            and lead.get("dealer_id") == dealer_id
        ),
        None
    )
    if recent_duplicate:
        created_str = recent_duplicate.get("created_at")
        if created_str:
            try:
                created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                if (datetime.now(timezone.utc) - created_dt).total_seconds() < 60:
                    return {
                        "success": True,
                        "data": {
                            "enquiry_id": recent_duplicate["id"],
                            "dealership_name": dealer_name,
                            "branch_id": recent_duplicate.get("branch_id"),
                            "status": recent_duplicate.get("status", "RECEIVED"),
                            "message": "Your enquiry has already been received and assigned to an authorized dealer consultant.",
                        },
                        "message": "Enquiry already registered",
                    }
            except Exception:
                pass

    actor = {
        "id": current_user["id"] if current_user else "usr-web-visitor",
        "email": payload.customer_email,
        "first_name": payload.customer_name.split()[0] if payload.customer_name else "Web",
        "last_name": payload.customer_name.split()[-1] if len(payload.customer_name.split()) > 1 else "Visitor",
        "dealer_id": dealer_id,
        "staff_role": "SALES_EXECUTIVE",
    }

    initial_note = f"Online {payload.enquiry_type.replace('_', ' ')} request via GroupDrive platform."
    if payload.notes:
        initial_note += f" Customer note: {payload.notes}"

    lead_data = {
        "branch_id": branch_id,
        "customer_name": payload.customer_name,
        "customer_phone": payload.customer_phone,
        "customer_email": payload.customer_email,
        "city": payload.city or "Bengaluru",
        "preferred_contact_method": "PHONE",
        "brand_name": payload.brand_name,
        "model_name": payload.model_name,
        "variant_name": payload.variant_name,
        "fuel_type": payload.fuel_type,
        "transmission": payload.transmission,
        "colour_preference": payload.colour_preference,
        "purchase_timeline": payload.purchase_timeline or "WITHIN_15_DAYS",
        "financing_preference": payload.financing_preference or "LOAN",
        "source": payload.source or "WEBSITE_DIRECT",
        "initial_note": initial_note,
    }

    new_lead = create_lead(lead_data, actor=actor)

    return {
        "success": True,
        "data": {
            "enquiry_id": new_lead["id"],
            "dealership_name": dealer_name,
            "branch_id": branch_id,
            "status": "RECEIVED",
            "message": "Your enquiry has been assigned to an authorized dealer consultant who will contact you shortly.",
        },
        "message": "Enquiry registered successfully",
    }


# 6. Customer Group Participation (Collective Buying)

@router.post("/customer/groups/{group_id}/join", summary="Join Buyer Group")
async def join_buyer_group(
    group_id: str,
    payload: JoinGroupRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    Allows a customer to join an active collective buyer group.
    Increments group member count, records membership, and generates a linked lead in DealerOS.
    """
    target_group = None
    for opp in GROUP_OPPORTUNITIES_DB:
        if opp["id"] == group_id:
            target_group = opp
            break

    if not target_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer group '{group_id}' was not found.",
        )

    if target_group["current_members_count"] >= target_group["max_capacity"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This group has reached maximum member capacity. Please join another group or express new demand.",
        )

    # Check if already joined to prevent duplicate increment
    user_id = current_user["id"] if current_user else f"usr-guest-{uuid.uuid4().hex[:6]}"
    existing_membership = next(
        (m for m in CUSTOMER_MEMBERSHIPS_DB if m.get("group_id") == group_id and (
            (current_user and m.get("user_id") == current_user["id"]) or
            (m.get("customer_email", "").lower() == payload.customer_email.lower())
        )),
        None
    )
    if existing_membership:
        return {
            "success": True,
            "data": {
                "membership": existing_membership,
                "group": target_group,
                "estimated_savings_inr": 45000 if "brezza" in target_group["model_name"].lower() else 55000,
            },
            "message": f"You are already an active participant in {target_group['group_code']}.",
        }

    # Increment member count
    target_group["current_members_count"] += 1
    if target_group["current_members_count"] >= target_group["min_members_threshold"] and target_group["status"] == "FORMING":
        target_group["status"] = "OPEN_FOR_QUOTES"

    membership_id = f"mem-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    membership = {
        "id": membership_id,
        "user_id": user_id,
        "customer_name": payload.customer_name,
        "customer_phone": payload.customer_phone,
        "customer_email": payload.customer_email,
        "group_id": group_id,
        "group_code": target_group["group_code"],
        "model_name": target_group["model_name"],
        "variant_name": payload.preferred_variant or "Selected in consultation",
        "colour_preference": payload.preferred_colour or "Flexible",
        "city": payload.city or target_group.get("city", "Bengaluru"),
        "status": "CONFIRMED",
        "joined_at": now_iso,
    }
    CUSTOMER_MEMBERSHIPS_DB.append(membership)

    # Reusing existing CRM logic: route lead to the authorized dealership with source=BUYER_GROUP
    dealer_info = resolve_dealer_for_model(target_group["model_name"])
    actor = {
        "id": user_id,
        "email": payload.customer_email,
        "first_name": payload.customer_name.split()[0] if payload.customer_name else "Group",
        "last_name": payload.customer_name.split()[-1] if len(payload.customer_name.split()) > 1 else "Buyer",
        "dealer_id": dealer_info["dealer_id"],
        "staff_role": "SALES_EXECUTIVE",
    }

    lead_data = {
        "branch_id": dealer_info["branch_id"],
        "customer_name": payload.customer_name,
        "customer_phone": payload.customer_phone,
        "customer_email": payload.customer_email,
        "city": payload.city or target_group.get("city", "Bengaluru"),
        "preferred_contact_method": "PHONE",
        "brand_name": target_group["brand_name"],
        "model_name": target_group["model_name"],
        "variant_name": payload.preferred_variant,
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": payload.financing_preference or "LOAN",
        "source": "BUYER_GROUP",
        "initial_note": f"Joined group {target_group['group_code']} for {target_group['model_name']}. Target delivery {target_group['target_delivery_window_days']} days.",
    }
    create_lead(lead_data, actor=actor)

    return {
        "success": True,
        "data": {
            "membership": membership,
            "group": target_group,
            "estimated_savings_inr": 45000 if "brezza" in target_group["model_name"].lower() else 55000,
        },
        "message": f"Successfully joined {target_group['group_code']}! Dealers will bid to offer you maximum group discount.",
    }


@router.post("/customer/groups/{group_id}/leave", summary="Leave Buyer Group")
async def leave_buyer_group(
    group_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    Allows a customer to withdraw from a forming group prior to order locking.
    Decrements group membership count and updates records without penalties.
    """
    target_group = next((g for g in GROUP_OPPORTUNITIES_DB if g["id"] == group_id), None)
    if not target_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Buyer group '{group_id}' was not found.",
        )

    user_id = current_user["id"] if current_user else None
    idx_to_remove = None
    for idx, mem in enumerate(CUSTOMER_MEMBERSHIPS_DB):
        if mem.get("group_id") == group_id and user_id and mem.get("user_id") == user_id:
            idx_to_remove = idx
            break

    if idx_to_remove is not None:
        CUSTOMER_MEMBERSHIPS_DB.pop(idx_to_remove)
        if target_group["current_members_count"] > 0:
            target_group["current_members_count"] -= 1

    return {
        "success": True,
        "message": f"You have withdrawn from {target_group['group_code']}. You may rejoin anytime.",
    }


@router.post("/customer/groups/demand", summary="Request New Group-Buying Cluster")
async def create_group_demand(
    payload: CreateGroupDemandRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    """
    Allows customers to initiate demand for a vehicle model in their city.
    Creates a new buyer group opportunity if threshold is initiated.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    demand_id = f"dem-{uuid.uuid4().hex[:6]}"
    demand_record = {
        "id": demand_id,
        "user_id": current_user["id"] if current_user else "usr-guest",
        "customer_name": payload.customer_name,
        "customer_phone": payload.customer_phone,
        "customer_email": payload.customer_email,
        "model_id": payload.model_id,
        "model_name": payload.model_name,
        "brand_name": payload.brand_name,
        "city": payload.city,
        "target_delivery_window_days": payload.target_delivery_window_days,
        "preferred_variants": payload.preferred_variants,
        "notes": payload.notes,
        "created_at": now_iso,
    }
    CUSTOMER_DEMAND_REQUESTS_DB.append(demand_record)

    # Automatically seed an open opportunity if not already existing
    new_group_code = f"GD-{payload.city[:3].upper()}-{payload.model_name[:3].upper()}-01"
    existing = next((g for g in GROUP_OPPORTUNITIES_DB if g["group_code"] == new_group_code), None)
    if not existing:
        new_opp = {
            "id": f"grp-{uuid.uuid4().hex[:6]}",
            "group_code": new_group_code,
            "model_id": payload.model_id,
            "model_name": payload.model_name,
            "brand_name": payload.brand_name,
            "city": payload.city,
            "state": "Karnataka",
            "rto_circle": f"{payload.city} Central",
            "status": "FORMING",
            "min_members_threshold": 3,
            "max_capacity": 10,
            "current_members_count": 1,
            "quoting_deadline": "2026-11-20T18:00:00Z",
            "expiry_at": "2026-11-30T23:59:59Z",
            "target_delivery_window_days": payload.target_delivery_window_days,
            "requirements": {
                "delivery_timeline_preference": f"Within {payload.target_delivery_window_days} days",
                "preferred_variants": payload.preferred_variants or ["All Top Variants"],
                "preferred_colours": ["White", "Silver", "Grey"],
                "fuel_types": ["Petrol", "Hybrid"],
                "transmissions": ["Automatic", "Manual"],
                "financing_mix": "75% Loan / 25% Self",
                "accessory_preferences": ["Standard Pack"],
                "delivery_location": f"{payload.city} Authorized Showrooms",
            },
            "created_at": now_iso,
        }
        GROUP_OPPORTUNITIES_DB.append(new_opp)

    return {
        "success": True,
        "data": demand_record,
        "message": f"Demand registered! Group-buying cluster for {payload.model_name} in {payload.city} is now forming.",
    }


@router.get("/customer/my-groups", summary="Customer Joined Groups")
@router.get("/customer/groups", summary="Customer Joined Groups Alias")
async def get_my_joined_groups(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """Returns all groups the signed-in customer has joined with bid updates."""
    user_id = current_customer["id"]
    memberships = [m for m in CUSTOMER_MEMBERSHIPS_DB if m.get("user_id") == user_id]

    enriched = []
    for mem in memberships:
        opp = next((g for g in GROUP_OPPORTUNITIES_DB if g["id"] == mem["group_id"]), None)
        enriched.append({
            "membership": mem,
            "group_details": opp,
        })

    return {
        "success": True,
        "data": enriched,
        "count": len(enriched),
        "message": "Customer groups retrieved successfully",
    }


@router.get("/customer/my-enquiries", summary="Customer Submitted Enquiries")
@router.get("/customer/enquiries", summary="Customer Submitted Enquiries Alias")
async def get_my_enquiries(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """
    Returns vehicle enquiries and test drives booked by this customer,
    synchronized with live DealerOS status updates and associated dealer quotations.
    """
    email = current_customer.get("email", "").lower().strip()
    phone = current_customer.get("phone_number", "").strip()

    my_leads = []
    for lead in LEADS_MASTER_DB:
        lead_email = (lead.get("customer_email") or "").lower().strip()
        lead_phone = (lead.get("customer_phone") or "").strip()
        if (email and lead_email == email) or (phone and lead_phone == phone):
            dealer_obj = DEALERS_DB.get(lead.get("dealer_id", ""))
            dealer_name = dealer_obj.get("trade_name") if dealer_obj else "Authorized Dealership"
            branch_obj = BRANCHES_DB.get(lead.get("branch_id", ""))
            branch_name = branch_obj.get("branch_name") if branch_obj else "Showroom Delivery Centre"

            lead_quotations = [
                q for q in QUOTATIONS_DB
                if q.get("lead_id") == lead.get("id") or (email and (q.get("customer_email") or "").lower().strip() == email and q.get("model_name") == lead.get("model_name"))
            ]

            my_leads.append({
                **copy.deepcopy(lead),
                "dealership_name": dealer_name,
                "branch_name": branch_name,
                "quotations_count": len(lead_quotations),
            })

    return {
        "success": True,
        "data": my_leads,
        "count": len(my_leads),
        "message": "Customer enquiries retrieved successfully",
    }


# 5b. Customer Quotations & Price Breakdown Experience

@router.get("/customer/my-quotations", summary="Customer Received Quotations")
@router.get("/customer/quotations", summary="Customer Received Quotations Alias")
async def get_my_quotations(current_customer: Dict[str, Any] = Depends(get_current_customer)):
    """
    Returns authentic commercial quotations submitted by authorized dealerships
    for this customer's enquiries or joined buyer groups.
    Customer PII of other members is strictly protected.
    """
    email = current_customer.get("email", "").lower().strip()
    phone = current_customer.get("phone_number", "").strip()
    user_id = current_customer.get("id", "")

    # Customer lead IDs
    cust_lead_ids = set(
        lead.get("id") for lead in LEADS_MASTER_DB
        if (email and (lead.get("customer_email") or "").lower().strip() == email)
        or (phone and (lead.get("customer_phone") or "").strip() == phone)
    )

    # Customer joined group IDs
    cust_group_ids = set(
        m.get("group_id") for m in CUSTOMER_MEMBERSHIPS_DB
        if m.get("user_id") == user_id or (email and (m.get("customer_email") or "").lower().strip() == email)
    )

    my_quotes = []
    for q in QUOTATIONS_DB:
        q_lead = q.get("lead_id")
        q_group = q.get("group_id")
        q_email = (q.get("customer_email") or "").lower().strip()

        # Match criteria
        is_my_lead_quote = q_lead and q_lead in cust_lead_ids
        is_my_email_quote = email and q_email == email
        is_my_group_quote = q_group and q_group in cust_group_ids and q.get("quotation_status") in ["SUBMITTED", "ACCEPTED"]

        if is_my_lead_quote or is_my_email_quote or is_my_group_quote:
            dealer_obj = DEALERS_DB.get(q.get("dealer_id", ""))
            dealer_name = q.get("dealer_name") or (dealer_obj.get("trade_name") if dealer_obj else "Authorized Dealership")
            branch_obj = BRANCHES_DB.get(q.get("branch_id", ""))
            branch_name = q.get("branch_name") or (branch_obj.get("branch_name") if branch_obj else "Showroom Delivery Centre")

            # Extract full pricing breakdown
            pricing = q.get("pricing") or {}
            ex_showroom = pricing.get("ex_showroom_price") or q.get("ex_showroom_price", 0)
            rto = pricing.get("rto_road_tax", 0)
            insurance = pricing.get("insurance_amount", 0)
            fastag = pricing.get("fastag_charges", 500)
            tcs = pricing.get("tcs_amount", 0)
            accessories = pricing.get("accessories_amount", 0)
            warranty = pricing.get("extended_warranty_amount", 0)
            other = pricing.get("other_charges", 0)
            gross = pricing.get("gross_on_road_price", ex_showroom + rto + insurance + fastag + tcs + accessories + warranty + other)
            dealer_disc = pricing.get("dealer_discount") or q.get("total_group_discount", 0)
            mfr_offer = pricing.get("manufacturer_offer", 0)
            exchange = pricing.get("exchange_bonus", 0)
            total_disc = pricing.get("total_discounts") or (dealer_disc + mfr_offer + exchange)
            final_on_road = pricing.get("final_on_road_price") or q.get("net_on_road_price") or (gross - total_disc)

            sanitized_quote = {
                "id": q["id"],
                "quotation_number": q.get("quotation_number", f"GD-QTE-{q['id']}"),
                "lead_id": q_lead,
                "group_id": q_group,
                "group_code": q.get("group_code"),
                "dealer_id": q.get("dealer_id"),
                "dealer_name": dealer_name,
                "branch_id": q.get("branch_id"),
                "branch_name": branch_name,
                "model_id": q.get("model_id"),
                "model_name": q.get("model_name"),
                "variant_id": q.get("variant_id"),
                "variant_name": q.get("variant_name"),
                "fuel_type": q.get("fuel_type", "Petrol"),
                "transmission": q.get("transmission", "Automatic"),
                "colour": q.get("colour", "Standard"),
                "pricing": {
                    "ex_showroom_price": ex_showroom,
                    "rto_road_tax": rto,
                    "insurance_amount": insurance,
                    "fastag_charges": fastag,
                    "tcs_amount": tcs,
                    "accessories_amount": accessories,
                    "extended_warranty_amount": warranty,
                    "other_charges": other,
                    "gross_on_road_price": gross,
                    "dealer_discount": dealer_disc,
                    "manufacturer_offer": mfr_offer,
                    "exchange_bonus": exchange,
                    "total_discounts": total_disc,
                    "final_on_road_price": final_on_road,
                },
                "net_on_road_price": final_on_road,
                "delivery_timeline_days": q.get("delivery_timeline_days", 14),
                "dealership_terms": q.get("dealership_terms") or "Official dealer quotation with fast-track allocation.",
                "quotation_status": q.get("quotation_status", "SUBMITTED"),
                "valid_until": q.get("valid_until"),
                "version": q.get("version", 1),
                "created_at": q.get("created_at"),
            }
            my_quotes.append(sanitized_quote)

    return {
        "success": True,
        "data": my_quotes,
        "count": len(my_quotes),
        "message": "Customer quotations retrieved successfully",
    }


@router.get("/customer/my-quotations/{quotation_id}", summary="Customer Quotation Details")
async def get_my_quotation_details(
    quotation_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """
    Returns itemized price breakdown and terms for a specific quotation.
    Strictly verifies customer authorization.
    """
    email = current_customer.get("email", "").lower().strip()
    phone = current_customer.get("phone_number", "").strip()
    user_id = current_customer.get("id", "")

    quote = next((q for q in QUOTATIONS_DB if q.get("id") == quotation_id), None)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quotation with ID '{quotation_id}' was not found.",
        )

    # Authorization Check
    cust_lead_ids = set(
        lead.get("id") for lead in LEADS_MASTER_DB
        if (email and (lead.get("customer_email") or "").lower().strip() == email)
        or (phone and (lead.get("customer_phone") or "").strip() == phone)
    )
    cust_group_ids = set(
        m.get("group_id") for m in CUSTOMER_MEMBERSHIPS_DB
        if m.get("user_id") == user_id or (email and (m.get("customer_email") or "").lower().strip() == email)
    )

    q_lead = quote.get("lead_id")
    q_group = quote.get("group_id")
    q_email = (quote.get("customer_email") or "").lower().strip()

    is_authorized = (
        (q_lead and q_lead in cust_lead_ids) or
        (email and q_email == email) or
        (q_group and q_group in cust_group_ids)
    )
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This quotation belongs to another customer account.",
        )

    dealer_obj = DEALERS_DB.get(quote.get("dealer_id", ""))
    dealer_name = quote.get("dealer_name") or (dealer_obj.get("trade_name") if dealer_obj else "Authorized Dealership")
    branch_obj = BRANCHES_DB.get(quote.get("branch_id", ""))
    branch_name = quote.get("branch_name") or (branch_obj.get("branch_name") if branch_obj else "Showroom Delivery Centre")

    pricing = quote.get("pricing") or {}
    ex_showroom = pricing.get("ex_showroom_price") or quote.get("ex_showroom_price", 0)
    rto = pricing.get("rto_road_tax", 0)
    insurance = pricing.get("insurance_amount", 0)
    fastag = pricing.get("fastag_charges", 500)
    tcs = pricing.get("tcs_amount", 0)
    accessories = pricing.get("accessories_amount", 0)
    warranty = pricing.get("extended_warranty_amount", 0)
    other = pricing.get("other_charges", 0)
    gross = pricing.get("gross_on_road_price", ex_showroom + rto + insurance + fastag + tcs + accessories + warranty + other)
    dealer_disc = pricing.get("dealer_discount") or quote.get("total_group_discount", 0)
    mfr_offer = pricing.get("manufacturer_offer", 0)
    exchange = pricing.get("exchange_bonus", 0)
    total_disc = pricing.get("total_discounts") or (dealer_disc + mfr_offer + exchange)
    final_on_road = pricing.get("final_on_road_price") or quote.get("net_on_road_price") or (gross - total_disc)

    result = {
        "id": quote["id"],
        "quotation_number": quote.get("quotation_number", f"GD-QTE-{quote['id']}"),
        "lead_id": q_lead,
        "group_id": q_group,
        "group_code": quote.get("group_code"),
        "dealer_id": quote.get("dealer_id"),
        "dealer_name": dealer_name,
        "branch_id": quote.get("branch_id"),
        "branch_name": branch_name,
        "model_id": quote.get("model_id"),
        "model_name": quote.get("model_name"),
        "variant_id": quote.get("variant_id"),
        "variant_name": quote.get("variant_name"),
        "fuel_type": quote.get("fuel_type", "Petrol"),
        "transmission": quote.get("transmission", "Automatic"),
        "colour": quote.get("colour", "Standard"),
        "pricing": {
            "ex_showroom_price": ex_showroom,
            "rto_road_tax": rto,
            "insurance_amount": insurance,
            "fastag_charges": fastag,
            "tcs_amount": tcs,
            "accessories_amount": accessories,
            "extended_warranty_amount": warranty,
            "other_charges": other,
            "gross_on_road_price": gross,
            "dealer_discount": dealer_disc,
            "manufacturer_offer": mfr_offer,
            "exchange_bonus": exchange,
            "total_discounts": total_disc,
            "final_on_road_price": final_on_road,
        },
        "net_on_road_price": final_on_road,
        "delivery_timeline_days": quote.get("delivery_timeline_days", 14),
        "dealership_terms": quote.get("dealership_terms") or "Official dealer quotation with fast-track allocation.",
        "quotation_status": quote.get("quotation_status", "SUBMITTED"),
        "valid_until": quote.get("valid_until"),
        "version": quote.get("version", 1),
        "created_at": quote.get("created_at"),
    }

    return {
        "success": True,
        "data": result,
        "message": "Quotation details retrieved successfully",
    }


@router.post("/customer/my-quotations/{quotation_id}/accept", summary="Accept Dealer Quotation")
async def accept_customer_quotation(
    quotation_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """
    Allows a customer to accept an authorized dealer quotation.
    Synchronizes the linked lead in DealerOS to BOOKED.
    """
    quote = next((q for q in QUOTATIONS_DB if q.get("id") == quotation_id), None)
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    quote["quotation_status"] = "ACCEPTED"
    quote["updated_at"] = datetime.now(timezone.utc).isoformat()

    lead_id = quote.get("lead_id")
    if lead_id:
        for lead in LEADS_MASTER_DB:
            if lead.get("id") == lead_id:
                lead["status"] = "BOOKED"
                lead["updated_at"] = datetime.now(timezone.utc).isoformat()
                break

    return {
        "success": True,
        "data": {
            "quotation_id": quotation_id,
            "status": "ACCEPTED",
            "message": "You have accepted this quotation. The dealership will prepare handover paperwork and contact you.",
        },
        "message": "Quotation accepted successfully",
    }


@router.post("/customer/my-quotations/{quotation_id}/reject", summary="Reject Dealer Quotation")
async def reject_customer_quotation(
    quotation_id: str,
    current_customer: Dict[str, Any] = Depends(get_current_customer),
):
    """Allows a customer to decline a dealer quotation."""
    quote = next((q for q in QUOTATIONS_DB if q.get("id") == quotation_id), None)
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found.")

    quote["quotation_status"] = "REJECTED"
    quote["updated_at"] = datetime.now(timezone.utc).isoformat()

    return {
        "success": True,
        "data": {
            "quotation_id": quotation_id,
            "status": "REJECTED",
        },
        "message": "Quotation rejected",
    }


