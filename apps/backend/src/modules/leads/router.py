from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from src.core.dependencies import get_current_dealer_staff, verify_branch_isolation
from src.core.identity_store import BRANCHES_DB, USERS_DB
from src.core.leads_store import (
    LEAD_STATUSES,
    PURCHASE_TIMELINES,
    FINANCING_PREFERENCES,
    LEAD_SOURCES,
    query_leads,
    get_lead_by_id,
    create_lead,
    update_lead,
    assign_lead,
    update_lead_status,
    add_lead_note,
    get_lead_notes,
    get_lead_activities,
)

router = APIRouter(prefix="/dealers/me/leads", tags=["CRM & Leads"])

# Pydantic Schemas

class CreateLeadRequest(BaseModel):
    branch_id: str = Field(..., description="Target showroom branch ID")
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_email: EmailStr
    city: Optional[str] = Field("Bengaluru", max_length=50)
    preferred_contact_method: Optional[str] = Field("PHONE", pattern="^(PHONE|WHATSAPP|EMAIL)$")
    brand_name: str = Field(..., min_length=2, max_length=50)
    model_name: str = Field(..., min_length=2, max_length=50)
    variant_name: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    colour_preference: Optional[str] = None
    budget_min: Optional[int] = Field(None, ge=0)
    budget_max: Optional[int] = Field(None, ge=0)
    purchase_timeline: str = Field("WITHIN_15_DAYS")
    financing_preference: str = Field("UNDECIDED")
    source: str = Field("SHOWROOM_WALK_IN")
    assigned_to_id: Optional[str] = None
    initial_note: Optional[str] = None


class UpdateLeadRequest(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=2, max_length=100)
    customer_phone: Optional[str] = Field(None, min_length=10, max_length=15)
    customer_email: Optional[EmailStr] = None
    city: Optional[str] = None
    preferred_contact_method: Optional[str] = Field(None, pattern="^(PHONE|WHATSAPP|EMAIL)$")
    brand_name: Optional[str] = None
    model_name: Optional[str] = None
    variant_name: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    colour_preference: Optional[str] = None
    budget_min: Optional[int] = Field(None, ge=0)
    budget_max: Optional[int] = Field(None, ge=0)
    purchase_timeline: Optional[str] = None
    financing_preference: Optional[str] = None
    branch_id: Optional[str] = None


class AssignLeadRequest(BaseModel):
    assigned_to_id: str = Field(..., min_length=3, description="User ID of staff to assign")
    notes: Optional[str] = None


class UpdateLeadStatusRequest(BaseModel):
    status: str = Field(..., description="Target lead status")
    reason_or_notes: Optional[str] = None
    booked_voucher_code: Optional[str] = None


class AddLeadNoteRequest(BaseModel):
    content: str = Field(..., min_length=2, max_length=2000, description="Internal sales note text")


# Endpoints

@router.get("", response_model=Dict[str, Any])
async def list_leads(
    branch_id: Optional[str] = Query(None, description="Filter by showroom branch"),
    status: Optional[str] = Query(None, description="Filter by lead status"),
    assigned_to_id: Optional[str] = Query(None, description="Filter by assigned staff ID or 'unassigned'"),
    timeline: Optional[str] = Query(None, description="Filter by purchase timeline"),
    search: Optional[str] = Query(None, description="Keyword search across customer, phone, model"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Lists customer leads and enquiries scoped to the dealership tenant and role permissions.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_id = current_staff["id"]
    user_branch_id = current_staff.get("branch_id")

    # Branch managers, sales managers, and executives are locked to their branch
    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if branch_id and branch_id != "all" and branch_id != user_branch_id:
            verify_branch_isolation(branch_id, current_staff)

    leads = query_leads(
        dealer_id=dealer_id,
        branch_id=branch_id,
        status=status,
        assigned_to_id=assigned_to_id,
        timeline=timeline,
        search=search,
        user_role=role,
        user_id=user_id,
        user_branch_id=user_branch_id,
    )

    return {
        "success": True,
        "data": leads,
        "meta": {
            "total_records": len(leads),
            "dealer_id": dealer_id,
            "branch_id": branch_id or user_branch_id or "all",
        },
    }


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_new_lead(
    payload: CreateLeadRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Creates a new customer enquiry/lead in the dealership.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    # Validate branch belongs to dealer
    target_branch = BRANCHES_DB.get(payload.branch_id)
    if not target_branch or target_branch.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branch '{payload.branch_id}' does not belong to authorized dealership.",
        )

    # Scoped roles cannot create leads in branches other than their own
    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if payload.branch_id != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create leads for branches outside your assigned showroom.",
            )

    # Validate timeline and financing values
    if payload.purchase_timeline not in PURCHASE_TIMELINES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid purchase timeline. Allowed: {', '.join(PURCHASE_TIMELINES)}",
        )

    if payload.financing_preference not in FINANCING_PREFERENCES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid financing preference. Allowed: {', '.join(FINANCING_PREFERENCES)}",
        )

    if payload.source not in LEAD_SOURCES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid lead source. Allowed: {', '.join(LEAD_SOURCES)}",
        )

    # If assigning, verify permission
    if payload.assigned_to_id:
        if role == "SALES_EXECUTIVE" and payload.assigned_to_id != current_staff["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sales executives can only assign leads to themselves.",
            )

    new_lead = create_lead(payload.model_dump(), current_staff)
    return {
        "success": True,
        "data": new_lead,
        "message": "Enquiry registered successfully.",
    }


@router.get("/{lead_id}", response_model=Dict[str, Any])
async def get_lead_details(
    lead_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Fetches full lead dossier including customer details, vehicle interest, budget, and ownership.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    # Branch-level isolation
    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to leads belonging to another showroom branch.",
            )

    return {
        "success": True,
        "data": lead,
    }


@router.put("/{lead_id}", response_model=Dict[str, Any])
async def update_lead_details(
    lead_id: str,
    payload: UpdateLeadRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Updates lead information such as customer contact info, vehicle preferences, and budget.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update leads from other branches.",
            )

    # Sales Executive can only edit leads assigned to them or unassigned
    if role == "SALES_EXECUTIVE":
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update leads outside assigned branch.",
            )
        if lead.get("assigned_to_id") and lead.get("assigned_to_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update leads assigned to you.",
            )

    # If updating branch_id, ensure valid
    if payload.branch_id:
        target_branch = BRANCHES_DB.get(payload.branch_id)
        if not target_branch or target_branch.get("dealer_id") != dealer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid branch assignment.",
            )

    updated = update_lead(lead_id, payload.model_dump(exclude_unset=True), current_staff)
    return {
        "success": True,
        "data": updated,
        "message": "Lead details updated successfully.",
    }


@router.patch("/{lead_id}/assign", response_model=Dict[str, Any])
async def assign_or_reassign_lead(
    lead_id: str,
    payload: AssignLeadRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Assigns or reassigns a lead.
    Managers (Owner, Branch Manager, Sales Manager) can assign to any executive in their scope.
    Sales Executives can only self-claim unassigned branch leads; reassigning other staff is forbidden.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    # Role enforcement for assignment & reassignment
    if role == "SALES_EXECUTIVE":
        # Sales Executive can only claim an unassigned lead for themselves
        if lead.get("assigned_to_id") is not None and lead.get("assigned_to_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sales executives cannot reassign leads assigned to other staff. Contact your sales manager.",
            )
        if payload.assigned_to_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sales executives can only claim leads for themselves.",
            )
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot claim leads from another showroom branch.",
            )
    elif role in ["BRANCH_MANAGER", "SALES_MANAGER"]:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot assign leads outside your assigned branch.",
            )

    # Verify target staff member exists in dealer and branch
    target_user = None
    for u in USERS_DB.values():
        if u.get("id") == payload.assigned_to_id and u.get("dealer_id") == dealer_id:
            target_user = u
            break

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member '{payload.assigned_to_id}' not found in this dealership.",
        )

    # If manager has branch scope, ensure target user belongs to same branch or has branch access
    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and target_user.get("branch_id"):
        if target_user.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target staff member does not belong to your showroom branch.",
            )

    result = assign_lead(lead_id, payload.assigned_to_id, current_staff, payload.notes)
    return {
        "success": True,
        "data": result,
        "message": f"Lead successfully assigned to {result.get('assigned_to_name')}.",
    }


@router.patch("/{lead_id}/status", response_model=Dict[str, Any])
async def change_lead_status(
    lead_id: str,
    payload: UpdateLeadStatusRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Transitions a lead status with audit trails, optional notes, and voucher codes.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    # Branch and assignment checks
    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update status for leads from another showroom branch.",
            )

    if role == "SALES_EXECUTIVE":
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update status for leads outside assigned branch.",
            )
        if lead.get("assigned_to_id") and lead.get("assigned_to_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update the status of leads assigned to you.",
            )

    if payload.status not in LEAD_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid lead status '{payload.status}'. Allowed: {', '.join(LEAD_STATUSES)}",
        )

    result = update_lead_status(
        lead_id=lead_id,
        new_status=payload.status,
        actor=current_staff,
        reason_or_notes=payload.reason_or_notes,
        booked_voucher_code=payload.booked_voucher_code,
    )

    return {
        "success": True,
        "data": result,
        "message": f"Lead status updated to {payload.status}.",
    }


@router.post("/{lead_id}/notes", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_internal_note(
    lead_id: str,
    payload: AddLeadNoteRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Appends an internal note to the lead's collaboration thread.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot add notes to leads from another showroom branch.",
            )

    note = add_lead_note(lead_id, payload.content, current_staff)
    return {
        "success": True,
        "data": note,
        "message": "Note added successfully.",
    }


@router.get("/{lead_id}/notes", response_model=Dict[str, Any])
async def list_internal_notes(
    lead_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns all internal notes for a lead in chronological order.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access notes for leads from another branch.",
            )

    notes = get_lead_notes(lead_id, dealer_id)
    return {
        "success": True,
        "data": notes,
    }


@router.get("/{lead_id}/activities", response_model=Dict[str, Any])
async def list_activity_history(
    lead_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns the immutable audit log for a lead in reverse chronological order.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    lead = get_lead_by_id(lead_id, dealer_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found or access denied for this dealership.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if lead.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access activity log for leads from another branch.",
            )

    activities = get_lead_activities(lead_id, dealer_id)
    return {
        "success": True,
        "data": activities,
    }

