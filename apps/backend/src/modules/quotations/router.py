from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, EmailStr
from src.core.dependencies import get_current_dealer_staff, verify_branch_isolation
from src.core.quotations_store import (
    calculate_pricing,
    list_quotations,
    get_quotation_by_id,
    create_quotation,
    update_quotation,
    submit_quotation,
    accept_quotation,
    cancel_quotation,
    get_quotation_history,
    get_quotations_summary,
)

router = APIRouter(prefix="/dealers/me/quotations", tags=["Quotation Management"])

# Pydantic Schemas

class CalculatePricingSchema(BaseModel):
    ex_showroom_price: int = Field(..., gt=0, description="Base official ex-showroom price in INR")
    rto_road_tax: Optional[int] = Field(None, ge=0)
    insurance_amount: Optional[int] = Field(None, ge=0)
    fastag_charges: Optional[int] = Field(None, ge=0)
    tcs_amount: Optional[int] = Field(None, ge=0)
    accessories_amount: Optional[int] = Field(0, ge=0)
    extended_warranty_amount: Optional[int] = Field(0, ge=0)
    other_charges: Optional[int] = Field(0, ge=0)
    dealer_discount: Optional[int] = Field(0, ge=0)
    manufacturer_offer: Optional[int] = Field(0, ge=0)
    exchange_bonus: Optional[int] = Field(0, ge=0)


class CreateQuotationSchema(BaseModel):
    branch_id: str = Field(..., description="Target showroom branch ID")
    lead_id: Optional[str] = Field(None, description="Optional linked customer enquiry ID")
    customer_name: Optional[str] = Field(None, max_length=120)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[EmailStr] = None
    customer_city: Optional[str] = Field("Bengaluru", max_length=60)
    group_id: Optional[str] = Field(None, description="Optional linked collective purchasing group ID")
    group_code: Optional[str] = Field(None, max_length=50)
    model_id: str = Field(..., description="Vehicle catalogue model ID")
    model_name: str = Field(..., min_length=2, max_length=100)
    variant_id: str = Field(..., description="Vehicle catalogue variant ID")
    variant_name: str = Field(..., min_length=2, max_length=100)
    fuel_type: Optional[str] = Field("Petrol", max_length=30)
    transmission: Optional[str] = Field("Manual", max_length=30)
    colour: Optional[str] = Field("Standard", max_length=60)

    # Pricing components
    ex_showroom_price: int = Field(..., gt=0)
    rto_road_tax: Optional[int] = Field(None, ge=0)
    insurance_amount: Optional[int] = Field(None, ge=0)
    fastag_charges: Optional[int] = Field(None, ge=0)
    tcs_amount: Optional[int] = Field(None, ge=0)
    accessories_amount: Optional[int] = Field(0, ge=0)
    extended_warranty_amount: Optional[int] = Field(0, ge=0)
    other_charges: Optional[int] = Field(0, ge=0)
    dealer_discount: Optional[int] = Field(0, ge=0)
    manufacturer_offer: Optional[int] = Field(0, ge=0)
    exchange_bonus: Optional[int] = Field(0, ge=0)

    delivery_timeline_days: int = Field(14, ge=1, le=180)
    valid_until: Optional[str] = Field(None, description="ISO valid until date string")
    dealership_terms: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field("SUBMITTED", description="Initial status: DRAFT or SUBMITTED")


class UpdateQuotationSchema(BaseModel):
    branch_id: Optional[str] = None
    lead_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_city: Optional[str] = None
    group_id: Optional[str] = None
    group_code: Optional[str] = None
    colour: Optional[str] = None

    # Pricing components
    ex_showroom_price: Optional[int] = Field(None, gt=0)
    rto_road_tax: Optional[int] = Field(None, ge=0)
    insurance_amount: Optional[int] = Field(None, ge=0)
    fastag_charges: Optional[int] = Field(None, ge=0)
    tcs_amount: Optional[int] = Field(None, ge=0)
    accessories_amount: Optional[int] = Field(None, ge=0)
    extended_warranty_amount: Optional[int] = Field(None, ge=0)
    other_charges: Optional[int] = Field(None, ge=0)
    dealer_discount: Optional[int] = Field(None, ge=0)
    manufacturer_offer: Optional[int] = Field(None, ge=0)
    exchange_bonus: Optional[int] = Field(None, ge=0)

    delivery_timeline_days: Optional[int] = Field(None, ge=1, le=180)
    valid_until: Optional[str] = None
    dealership_terms: Optional[str] = None
    revision_notes: Optional[str] = None


class CancelQuotationSchema(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Reason for cancelling quotation")


@router.post("/calculate", summary="Calculate Itemized Quotation Pricing")
async def calculate_quote_pricing(
    payload: CalculatePricingSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Real-time price calculation engine.
    Calculates gross on-road, mandatory RTO/insurance/TCS/FASTag, optional accessories/warranty,
    approved discounts, and net final on-road price with monetary precision.
    """
    pricing = calculate_pricing(payload.model_dump())
    return {
        "success": True,
        "data": pricing,
        "message": "Quotation pricing calculated successfully",
    }


@router.get("", summary="List Dealership Quotations")
async def get_quotations_list(
    branch_id: Optional[str] = Query(None, description="Filter by showroom branch"),
    status: Optional[str] = Query(None, description="Filter by status (DRAFT, SUBMITTED, ACCEPTED, etc.)"),
    lead_id: Optional[str] = Query(None, description="Filter by linked customer enquiry ID"),
    group_id: Optional[str] = Query(None, description="Filter by linked collective purchasing group ID"),
    search: Optional[str] = Query(None, description="Search query across quotation number, model, customer name"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Retrieves itemized quotations created by the authenticated dealership.
    Supports multi-filtering by branch, status, enquiry linkage, and group opportunities.
    """
    dealer_id = current_staff["dealer_id"]

    # Non-owners are restricted to their assigned branch if applicable
    effective_branch = branch_id
    if current_staff.get("staff_role") not in ["DEALER_OWNER"] and current_staff.get("branch_id"):
        effective_branch = current_staff.get("branch_id")

    results = list_quotations(
        dealer_id=dealer_id,
        branch_id=effective_branch,
        status=status,
        lead_id=lead_id,
        group_id=group_id,
        search=search,
    )
    return {
        "success": True,
        "data": results,
        "count": len(results),
        "message": "Quotations retrieved successfully",
    }


@router.get("/summary", summary="Get Quotations Summary Statistics")
async def get_summary_stats(
    branch_id: Optional[str] = Query(None, description="Optional branch filter"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns summary counters for quotation pipeline: total, drafts, active submitted, accepted, and expired.
    """
    dealer_id = current_staff["dealer_id"]
    stats = get_quotations_summary(dealer_id=dealer_id, branch_id=branch_id)
    return {
        "success": True,
        "data": stats,
        "message": "Quotations summary statistics retrieved successfully",
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create New Quotation")
async def create_new_quotation(
    payload: CreateQuotationSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Creates a new vehicle quotation with itemized pricing components.
    Can be saved as DRAFT or SUBMITTED as an active binding offer.
    """
    dealer_id = current_staff["dealer_id"]
    verify_branch_isolation(payload.branch_id, current_staff)

    quote = create_quotation(
        payload=payload.model_dump(),
        actor=current_staff,
        dealer_id=dealer_id,
    )
    return {
        "success": True,
        "data": quote,
        "message": "Quotation created and recorded successfully",
    }


@router.get("/{quotation_id}", summary="Get Quotation Details")
async def get_quotation_details(
    quotation_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns comprehensive quotation details, itemized pricing, customer/group links, and audit history.
    """
    dealer_id = current_staff["dealer_id"]
    quote = get_quotation_by_id(quotation_id, dealer_id)

    # Branch access check for non-owners
    if current_staff.get("staff_role") not in ["DEALER_OWNER"] and current_staff.get("branch_id"):
        if quote.get("branch_id") != current_staff.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch access violation. This quotation is assigned to another branch."
            )

    return {
        "success": True,
        "data": quote,
        "message": "Quotation details retrieved successfully",
    }


@router.put("/{quotation_id}", summary="Update / Revise Quotation")
async def update_existing_quotation(
    quotation_id: str,
    payload: UpdateQuotationSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Updates or revises an existing quotation.
    Increments quotation revision version and records audit history.
    Enforces that finalized (ACCEPTED, EXPIRED, CANCELLED) quotations cannot be modified.
    """
    dealer_id = current_staff["dealer_id"]
    if payload.branch_id:
        verify_branch_isolation(payload.branch_id, current_staff)

    updated = update_quotation(
        quotation_id=quotation_id,
        payload=payload.model_dump(exclude_unset=True),
        actor=current_staff,
        dealer_id=dealer_id,
    )
    return {
        "success": True,
        "data": updated,
        "message": "Quotation revised successfully",
    }


@router.patch("/{quotation_id}/submit", summary="Submit Draft Quotation")
async def submit_draft_quotation(
    quotation_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Submits a draft quotation as an active binding offer.
    Requires Dealer Owner, Branch Manager, or Sales Manager authorization.
    """
    dealer_id = current_staff["dealer_id"]
    submitted = submit_quotation(quotation_id, current_staff, dealer_id)
    return {
        "success": True,
        "data": submitted,
        "message": "Quotation submitted successfully as active offer",
    }


@router.patch("/{quotation_id}/accept", summary="Mark Quotation Accepted")
async def mark_quotation_accepted(
    quotation_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Marks quotation as accepted by buyer or collective pool.
    """
    dealer_id = current_staff["dealer_id"]
    accepted = accept_quotation(quotation_id, current_staff, dealer_id)
    return {
        "success": True,
        "data": accepted,
        "message": "Quotation marked as accepted",
    }


@router.patch("/{quotation_id}/cancel", summary="Cancel Quotation")
async def cancel_existing_quotation(
    quotation_id: str,
    payload: CancelQuotationSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Cancels quotation with mandatory audit reason.
    Requires Dealer Owner, Branch Manager, or Sales Manager authorization.
    """
    dealer_id = current_staff["dealer_id"]
    cancelled = cancel_quotation(quotation_id, payload.reason, current_staff, dealer_id)
    return {
        "success": True,
        "data": cancelled,
        "message": "Quotation cancelled successfully",
    }


@router.get("/{quotation_id}/history", summary="Get Quotation History Logs")
async def get_history_logs(
    quotation_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns immutable chronological audit logs for this quotation.
    """
    dealer_id = current_staff["dealer_id"]
    history = get_quotation_history(quotation_id, dealer_id)
    return {
        "success": True,
        "data": history,
        "count": len(history),
        "message": "Quotation history retrieved successfully",
    }

