from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from src.core.dependencies import (
    get_current_dealer_staff,
    require_roles,
    verify_branch_isolation,
)
from src.core.campaigns_store import (
    list_campaigns,
    get_campaign_by_id,
    create_campaign,
    update_campaign,
    toggle_campaign_status,
    get_campaign_history,
    get_campaigns_summary,
)

router = APIRouter(prefix="/dealers/me/campaigns", tags=["Campaign and Offer Management"])

# Pydantic Schemas

class CampaignOfferDetailsSchema(BaseModel):
    discount_amount: Optional[int] = Field(None, ge=0)
    free_accessories_description: Optional[str] = None
    warranty_years: Optional[int] = Field(None, ge=0, le=10)
    exchange_bonus_amount: Optional[int] = Field(None, ge=0)
    interest_rate_pct: Optional[float] = Field(None, ge=0.0, le=30.0)
    min_group_size: Optional[int] = Field(None, ge=1)
    terms_and_conditions: Optional[str] = None


class CreateCampaignSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=150, description="Campaign promotional title")
    description: str = Field(..., min_length=10, max_length=1500, description="Detailed campaign terms and customer value proposition")
    branch_id: Optional[str] = Field(None, description="Specific dealership branch or null for all branches")
    campaign_type: str = Field("CASH_DISCOUNT", description="Campaign classification category")
    eligible_models: List[str] = Field(..., min_length=1, description="List of targeted vehicle model names")
    eligible_variants: Optional[List[str]] = Field(default_factory=list, description="Specific vehicle variants or empty for all")
    offer_details: Optional[CampaignOfferDetailsSchema] = Field(default_factory=CampaignOfferDetailsSchema)
    valid_from: str = Field(..., description="ISO start datetime string")
    valid_until: str = Field(..., description="ISO expiration datetime string")
    is_active: Optional[bool] = Field(True, description="Initial publication status")
    is_sponsored: Optional[bool] = Field(False, description="Promotional spotlight highlight badge")
    sponsored_label: Optional[str] = Field(None, description="Custom badge text (e.g. Showroom Spotlight)")
    status: Optional[str] = Field("ACTIVE", description="Initial draft or active state")


class UpdateCampaignSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, min_length=10, max_length=1500)
    branch_id: Optional[str] = None
    campaign_type: Optional[str] = None
    eligible_models: Optional[List[str]] = None
    eligible_variants: Optional[List[str]] = None
    offer_details: Optional[CampaignOfferDetailsSchema] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    is_sponsored: Optional[bool] = None
    sponsored_label: Optional[str] = None
    revision_notes: Optional[str] = Field(None, max_length=500)


class ToggleCampaignSchema(BaseModel):
    is_active: bool = Field(..., description="Target active state for the campaign")


# Endpoints

@router.get("", summary="List Dealership Campaigns")
async def get_campaigns_list(
    branch_id: Optional[str] = Query(None, description="Filter by showroom branch"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, SCHEDULED, EXPIRED, PAUSED, DRAFT)"),
    campaign_type: Optional[str] = Query(None, description="Filter by campaign offer category"),
    origin: Optional[str] = Query(None, description="Filter by origin (DEALER or GROUPDRIVE_ADMIN)"),
    search: Optional[str] = Query(None, description="Search across title, description, code or models"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns list of campaigns accessible to the authenticated dealership staff.
    Evaluates real-time auto-expiry so expired campaigns never appear active.
    """
    dealer_id = current_staff["dealer_id"]

    # If branch manager / sales exec requests a specific branch, check branch isolation
    if branch_id:
        verify_branch_isolation(branch_id, current_staff)

    # If staff has branch restrictions and no branch filter is passed, dealer owner sees all
    effective_branch = branch_id
    if current_staff.get("staff_role") not in ["DEALER_OWNER", "SALES_MANAGER"] and not effective_branch:
        effective_branch = current_staff.get("branch_id")

    items = list_campaigns(
        dealer_id=dealer_id,
        branch_id=effective_branch,
        status_filter=status,
        campaign_type=campaign_type,
        search=search,
        origin=origin,
    )
    return {
        "success": True,
        "count": len(items),
        "data": items,
    }


@router.get("/summary", summary="Campaign Performance and Status Summary")
async def get_campaigns_summary_stats(
    branch_id: Optional[str] = Query(None, description="Optional branch scope"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns aggregate KPI metrics including active campaigns, scheduled campaigns,
    expired offers, paused counts, enquiries generated, and bookings converted.
    """
    dealer_id = current_staff["dealer_id"]
    if branch_id:
        verify_branch_isolation(branch_id, current_staff)

    stats = get_campaigns_summary(dealer_id=dealer_id, branch_id=branch_id)
    return {
        "success": True,
        "data": stats,
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Dealership Campaign")
async def create_new_campaign(
    payload: CreateCampaignSchema,
    current_staff: Dict[str, Any] = Depends(
        require_roles(["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"])
    ),
):
    """
    Allows authorized dealership managers to publish or schedule a new promotional offer.
    Sales executives and inventory managers receive 403 Forbidden.
    """
    dealer_id = current_staff["dealer_id"]

    # If Branch Manager, enforce branch restriction
    if current_staff.get("staff_role") == "BRANCH_MANAGER":
        staff_branch = current_staff.get("branch_id")
        if payload.branch_id and payload.branch_id != staff_branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch managers can only create campaigns for their assigned branch.",
            )
        # Default to branch if unspecified
        if not payload.branch_id:
            payload.branch_id = staff_branch

    data = payload.model_dump()
    if data.get("offer_details") is not None:
        data["offer_details"] = {k: v for k, v in data["offer_details"].items() if v is not None}

    created = create_campaign(data, actor=current_staff, dealer_id=dealer_id)
    return {
        "success": True,
        "message": "Campaign created successfully.",
        "data": created,
    }


@router.get("/{campaign_id}", summary="Get Campaign Details and Performance")
async def get_campaign_detail(
    campaign_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns complete campaign details, performance telemetry, and offer specifications.
    Enforces cross-dealership multi-tenant isolation.
    """
    dealer_id = current_staff["dealer_id"]
    campaign = get_campaign_by_id(campaign_id, dealer_id)
    return {
        "success": True,
        "data": campaign,
    }


@router.put("/{campaign_id}", summary="Update Dealership Campaign")
async def update_campaign_detail(
    campaign_id: str,
    payload: UpdateCampaignSchema,
    current_staff: Dict[str, Any] = Depends(
        require_roles(["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"])
    ),
):
    """
    Updates campaign terms, targeted models, date range, or details.
    Platform admin campaigns are protected and return 403 Forbidden.
    """
    dealer_id = current_staff["dealer_id"]

    if payload.branch_id:
        verify_branch_isolation(payload.branch_id, current_staff)

    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "offer_details" in data and data["offer_details"] is not None:
        data["offer_details"] = {k: v for k, v in data["offer_details"].items() if v is not None}

    updated = update_campaign(campaign_id, data, actor=current_staff, dealer_id=dealer_id)
    return {
        "success": True,
        "message": "Campaign updated successfully.",
        "data": updated,
    }


@router.patch("/{campaign_id}/toggle", summary="Toggle Active or Paused Status")
async def toggle_campaign_active_state(
    campaign_id: str,
    payload: ToggleCampaignSchema,
    current_staff: Dict[str, Any] = Depends(
        require_roles(["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"])
    ),
):
    """
    Quick toggle to pause or reactivate a campaign.
    Expired campaigns cannot be activated without updating their end date.
    """
    dealer_id = current_staff["dealer_id"]
    result = toggle_campaign_status(
        campaign_id=campaign_id,
        is_active=payload.is_active,
        actor=current_staff,
        dealer_id=dealer_id,
    )
    return {
        "success": True,
        "message": f"Campaign {'activated' if payload.is_active else 'paused'} successfully.",
        "data": result,
    }


@router.get("/{campaign_id}/history", summary="Get Campaign Audit History")
async def get_campaign_audit_history(
    campaign_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Retrieves chronological audit trail of all changes made to the campaign.
    """
    dealer_id = current_staff["dealer_id"]
    history = get_campaign_history(campaign_id, dealer_id)
    return {
        "success": True,
        "count": len(history),
        "data": history,
    }
