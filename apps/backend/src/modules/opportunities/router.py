from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from src.core.dependencies import get_current_dealer_staff, verify_branch_isolation
from src.core.identity_store import BRANCHES_DB
from src.core.opportunities_store import (
    list_opportunities,
    get_opportunity_by_id,
    submit_dealer_interest,
    update_negotiation_activity,
    withdraw_dealer_interest,
    get_opportunity_history,
    get_opportunities_summary,
)

router = APIRouter(prefix="/opportunities", tags=["Group Purchasing Opportunities"])

# Pydantic Schemas

class SubmitInterestRequest(BaseModel):
    branch_id: str = Field(..., description="Target showroom branch ID")
    estimated_delivery_days: int = Field(14, ge=1, le=180, description="Estimated delivery turnaround in days")
    stock_allocation_commitment: int = Field(1, ge=1, le=100, description="Number of allocated vehicle units")
    proposed_benefits: str = Field(..., min_length=5, max_length=1000, description="Proposed customer benefits or terms")
    terms_and_conditions: Optional[str] = Field(None, max_length=2000)
    initial_response_notes: Optional[str] = Field(None, max_length=2000)


class UpdateNegotiationRequest(BaseModel):
    status: Optional[str] = Field(None, description="Updated offer status")
    estimated_delivery_days: Optional[int] = Field(None, ge=1, le=180)
    stock_allocation_commitment: Optional[int] = Field(None, ge=1, le=100)
    proposed_benefits: Optional[str] = Field(None, max_length=1000)
    terms_and_conditions: Optional[str] = Field(None, max_length=2000)
    negotiation_notes: Optional[str] = Field(None, max_length=2000)


class WithdrawInterestRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Reason for withdrawing dealer interest")


@router.get("", summary="List Group Purchasing Opportunities")
async def get_opportunities(
    search: Optional[str] = Query(None, description="Search across model, code, city, RTO circle"),
    vehicle: Optional[str] = Query(None, description="Filter by vehicle brand or model"),
    variant: Optional[str] = Query(None, description="Filter by vehicle variant"),
    city: Optional[str] = Query(None, description="Filter by location city"),
    status: Optional[str] = Query(None, description="Filter by group status (FORMING, OPEN_FOR_QUOTES, etc.)"),
    offer_status: Optional[str] = Query(None, description="Filter by dealership offer status"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    List collective vehicle purchasing demand opportunities from GROUPDRIVE customer clusters.
    Enriched with caller dealership's offer status and privacy preservation.
    """
    dealer_id = current_staff["dealer_id"]
    results = list_opportunities(
        dealer_id=dealer_id,
        search=search,
        vehicle=vehicle,
        variant=variant,
        city=city,
        status=status,
        offer_status=offer_status,
    )
    return {
        "success": True,
        "data": results,
        "count": len(results),
        "message": "Group purchasing opportunities retrieved successfully",
    }


@router.get("/summary", summary="Get Opportunities Summary Statistics")
async def get_summary(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns summary counters for active opportunities, threshold achievements, and dealership responses.
    """
    dealer_id = current_staff["dealer_id"]
    stats = get_opportunities_summary(dealer_id)
    return {
        "success": True,
        "data": stats,
        "message": "Opportunities summary retrieved successfully",
    }


@router.get("/{opportunity_id}", summary="Get Group Opportunity Details")
async def get_opportunity_detail(
    opportunity_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns comprehensive details of a group purchasing opportunity.
    Includes cluster requirements, participant counts, target threshold, and dealer-scoped interest.
    Strictly shields individual customer personal information.
    """
    dealer_id = current_staff["dealer_id"]
    opp = get_opportunity_by_id(opportunity_id, dealer_id)
    return {
        "success": True,
        "data": opp,
        "message": "Opportunity details retrieved successfully",
    }


@router.post("/{opportunity_id}/interest", status_code=status.HTTP_201_CREATED, summary="Submit Dealer Interest")
async def submit_interest(
    opportunity_id: str,
    payload: SubmitInterestRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Submit dealership interest or proposal for a collective purchasing opportunity.
    Authorized roles: Dealer Owner, Branch Manager, Sales Manager.
    """
    dealer_id = current_staff["dealer_id"]

    # Verify branch belongs to dealer
    verify_branch_isolation(payload.branch_id, current_staff)

    interest = submit_dealer_interest(
        opportunity_id=opportunity_id,
        payload=payload.model_dump(),
        actor=current_staff,
        dealer_id=dealer_id,
    )
    return {
        "success": True,
        "data": interest,
        "message": "Dealer interest recorded successfully",
    }


@router.put("/{opportunity_id}/negotiation", summary="Update Negotiation Activity")
async def update_negotiation(
    opportunity_id: str,
    payload: UpdateNegotiationRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Update negotiation terms, stock commitments, delivery timelines, or offer status.
    Authorized roles: Dealer Owner, Branch Manager, Sales Manager.
    """
    dealer_id = current_staff["dealer_id"]
    updated = update_negotiation_activity(
        opportunity_id=opportunity_id,
        payload=payload.model_dump(exclude_unset=True),
        actor=current_staff,
        dealer_id=dealer_id,
    )
    return {
        "success": True,
        "data": updated,
        "message": "Negotiation activity updated successfully",
    }


@router.patch("/{opportunity_id}/withdraw", summary="Withdraw Dealer Interest")
async def withdraw_interest(
    opportunity_id: str,
    payload: WithdrawInterestRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Withdraw interest from a group opportunity with reason.
    Authorized roles: Dealer Owner, Branch Manager, Sales Manager.
    """
    dealer_id = current_staff["dealer_id"]
    result = withdraw_dealer_interest(
        opportunity_id=opportunity_id,
        reason=payload.reason,
        actor=current_staff,
        dealer_id=dealer_id,
    )
    return {
        "success": True,
        "data": result,
        "message": "Dealer interest withdrawn successfully",
    }


@router.get("/{opportunity_id}/history", summary="Get Opportunity Audit History")
async def get_history(
    opportunity_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns immutable audit logs for this opportunity scoped to the caller dealership.
    Competitor isolation: private negotiations of other dealerships are never exposed.
    """
    dealer_id = current_staff["dealer_id"]
    history = get_opportunity_history(opportunity_id, dealer_id)
    return {
        "success": True,
        "data": history,
        "count": len(history),
        "message": "Opportunity history retrieved successfully",
    }

