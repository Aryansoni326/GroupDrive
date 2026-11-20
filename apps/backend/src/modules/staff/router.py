from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field, EmailStr
from typing import Dict, Any, Optional, List
import re

from src.core.dependencies import get_current_dealer_staff, verify_tenant_isolation
from src.core.identity_store import (
    get_staff_by_dealer_id,
    get_staff_member_by_id,
    invite_staff_member,
    update_staff_member,
    toggle_staff_status,
    resend_staff_invitation,
    revoke_staff_invitation,
    get_staff_activity_logs,
    get_branches_by_dealer_id,
    get_branch_by_id,
    USERS_DB,
)

router = APIRouter(prefix="/dealers/me", tags=["Staff Management"])

SUPPORTED_DEALER_ROLES = {
    "DEALER_OWNER",
    "BRANCH_MANAGER",
    "SALES_MANAGER",
    "SALES_EXECUTIVE",
    "INVENTORY_MANAGER",
    "FINANCE_EXECUTIVE",
}

class InviteStaffRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone_number: str = Field(..., min_length=10, max_length=15)
    staff_role: str = Field(..., description="Role code within the dealership")
    branch_id: Optional[str] = Field(None, description="Assigned branch identifier")
    designation: str = Field(..., min_length=2, max_length=100)

class UpdateStaffRequest(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=15)
    staff_role: Optional[str] = None
    branch_id: Optional[str] = None
    designation: Optional[str] = Field(None, min_length=2, max_length=100)

class ToggleStatusRequest(BaseModel):
    is_active: bool

def validate_phone(phone: str):
    clean = re.sub(r"[\s\-\+]", "", phone)
    if not clean.isdigit() or len(clean) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Contact phone number must contain at least 10 valid digits",
        )

def check_can_manage_staff(current_staff: Dict[str, Any]):
    caller_role = current_staff.get("staff_role") or ""
    if caller_role not in ["DEALER_OWNER", "BRANCH_MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage dealership staff",
        )

@router.get("/staff", summary="List dealership staff with filtering and search")
async def list_dealership_staff(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    role: Optional[str] = Query(None, description="Filter by role code"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ACTIVE, INACTIVE, INVITED)"),
    search: Optional[str] = Query(None, description="Search by name, email, phone, or designation"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    staff_members = get_staff_by_dealer_id(dealer_id)

    # Filter by branch
    if branch_id and branch_id != "ALL":
        staff_members = [s for s in staff_members if s.get("branch_id") == branch_id]

    # Filter by role
    if role and role != "ALL":
        staff_members = [s for s in staff_members if s.get("staff_role") == role]

    # Filter by status
    if status_filter and status_filter != "ALL":
        if status_filter == "ACTIVE":
            staff_members = [s for s in staff_members if s.get("is_active") and s.get("invitation_status") == "ACTIVE"]
        elif status_filter == "INACTIVE":
            staff_members = [s for s in staff_members if not s.get("is_active")]
        elif status_filter == "INVITED":
            staff_members = [s for s in staff_members if s.get("invitation_status") in ["INVITED", "PENDING_ACCEPTANCE"]]

    # Search filter
    if search and search.strip():
        term = search.lower().strip()
        staff_members = [
            s for s in staff_members
            if term in s.get("first_name", "").lower()
            or term in s.get("last_name", "").lower()
            or term in s.get("email", "").lower()
            or term in s.get("phone_number", "").lower()
            or term in s.get("designation", "").lower()
            or term in s.get("staff_role", "").lower().replace("_", " ")
        ]

    return {
        "success": True,
        "data": staff_members,
        "count": len(staff_members),
        "message": f"Retrieved {len(staff_members)} staff members",
    }

@router.post("/staff/invite", status_code=status.HTTP_201_CREATED, summary="Invite new staff member")
async def invite_staff(
    payload: InviteStaffRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    check_can_manage_staff(current_staff)
    caller_role = current_staff.get("staff_role") or ""
    dealer_id = current_staff["dealer_id"]

    validate_phone(payload.phone_number)

    # Validate staff role is supported
    if payload.staff_role not in SUPPORTED_DEALER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{payload.staff_role}' is not a valid dealership staff role",
        )

    # Role escalation check for Branch Managers
    if caller_role == "BRANCH_MANAGER":
        if payload.staff_role in ["DEALER_OWNER", "BRANCH_MANAGER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers cannot invite dealer owners or other branch managers",
            )
        # Branch Managers must invite to their own assigned branch
        caller_branch_id = current_staff.get("branch_id")
        if payload.branch_id != caller_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers can only invite staff to their assigned branch",
            )

    # Validate branch belongs to dealership
    if payload.branch_id:
        branch = get_branch_by_id(payload.branch_id)
        if not branch or branch.get("dealer_id") != dealer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified branch does not exist or does not belong to your dealership",
            )

    # Check for existing email in USERS_DB
    clean_email = payload.email.lower().strip()
    if clean_email in USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email {payload.email} already exists",
        )

    staff_data = payload.model_dump()
    staff_data["dealer_id"] = dealer_id

    try:
        new_staff = invite_staff_member(staff_data, actor=current_staff)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return {
        "success": True,
        "data": new_staff,
        "message": f"Invitation sent successfully to {payload.email}",
    }

@router.get("/staff/{staff_id}", summary="Get staff member profile")
async def get_staff_detail(
    staff_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    staff_member = get_staff_member_by_id(staff_id)
    if not staff_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member with ID {staff_id} was not found",
        )

    # Enforce multi-tenant isolation
    if staff_member["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Staff member belongs to a different dealership.",
        )

    return {
        "success": True,
        "data": staff_member,
        "message": "Staff member profile retrieved successfully",
    }

@router.put("/staff/{staff_id}", summary="Update permitted staff member information, role, or branch")
async def update_staff(
    staff_id: str,
    payload: UpdateStaffRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    check_can_manage_staff(current_staff)
    caller_role = current_staff.get("staff_role") or ""
    dealer_id = current_staff["dealer_id"]

    staff_member = get_staff_member_by_id(staff_id)
    if not staff_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member with ID {staff_id} was not found",
        )

    # Enforce multi-tenant isolation
    if staff_member["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Staff member belongs to a different dealership.",
        )

    if payload.phone_number:
        validate_phone(payload.phone_number)

    # Branch Manager restrictions
    if caller_role == "BRANCH_MANAGER":
        caller_branch_id = current_staff.get("branch_id")
        # Can only modify staff in their assigned branch
        if staff_member.get("branch_id") != caller_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers can only manage staff within their assigned branch",
            )
        # Cannot modify Dealer Owner or other Branch Managers
        if staff_member.get("staff_role") in ["DEALER_OWNER", "BRANCH_MANAGER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers cannot modify management accounts",
            )
        # Cannot reassign branch to another branch
        if payload.branch_id and payload.branch_id != caller_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers cannot reassign staff to other branches",
            )
        # Cannot escalate role to Dealer Owner or Branch Manager
        if payload.staff_role in ["DEALER_OWNER", "BRANCH_MANAGER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers cannot assign executive management roles",
            )

    # Validate assigned branch belongs to dealership
    if payload.branch_id:
        branch = get_branch_by_id(payload.branch_id)
        if not branch or branch.get("dealer_id") != dealer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified branch does not exist or does not belong to your dealership",
            )

    # Validate role if provided
    if payload.staff_role and payload.staff_role not in SUPPORTED_DEALER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{payload.staff_role}' is not a valid dealership staff role",
        )

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_staff_member(staff_id, update_dict, actor=current_staff)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member update failed")

    return {
        "success": True,
        "data": updated,
        "message": f"Staff profile updated successfully for {updated['first_name']} {updated['last_name']}",
    }

@router.patch("/staff/{staff_id}/status", summary="Activate or deactivate staff member")
async def change_staff_status(
    staff_id: str,
    payload: ToggleStatusRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    check_can_manage_staff(current_staff)
    caller_role = current_staff.get("staff_role") or ""
    dealer_id = current_staff["dealer_id"]

    staff_member = get_staff_member_by_id(staff_id)
    if not staff_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member with ID {staff_id} was not found",
        )

    # Enforce multi-tenant isolation
    if staff_member["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Staff member belongs to a different dealership.",
        )

    # Dealer Owner cannot deactivate themselves
    if staff_id == current_staff["id"] and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own primary Dealer Owner account",
        )

    # Branch Manager restrictions
    if caller_role == "BRANCH_MANAGER":
        caller_branch_id = current_staff.get("branch_id")
        if staff_member.get("branch_id") != caller_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers can only manage staff within their assigned branch",
            )
        if staff_member.get("staff_role") in ["DEALER_OWNER", "BRANCH_MANAGER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Managers cannot deactivate management accounts",
            )

    updated = toggle_staff_status(staff_id, payload.is_active, actor=current_staff)
    status_label = "activated" if payload.is_active else "deactivated"
    return {
        "success": True,
        "data": updated,
        "message": f"Staff member account {status_label} successfully",
    }

@router.post("/staff/{staff_id}/resend-invite", summary="Resend invitation to staff member")
async def resend_invite(
    staff_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    check_can_manage_staff(current_staff)
    caller_role = current_staff.get("staff_role") or ""
    dealer_id = current_staff["dealer_id"]

    staff_member = get_staff_member_by_id(staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    if staff_member["dealer_id"] != dealer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if caller_role == "BRANCH_MANAGER":
        if staff_member.get("branch_id") != current_staff.get("branch_id"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    updated = resend_staff_invitation(staff_id, actor=current_staff)
    return {
        "success": True,
        "data": updated,
        "message": f"Invitation link resent to {updated['email']}",
    }

@router.post("/staff/{staff_id}/revoke-invite", summary="Revoke pending staff invitation")
async def revoke_invite(
    staff_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    check_can_manage_staff(current_staff)
    caller_role = current_staff.get("staff_role") or ""
    dealer_id = current_staff["dealer_id"]

    staff_member = get_staff_member_by_id(staff_id)
    if not staff_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    if staff_member["dealer_id"] != dealer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if caller_role == "BRANCH_MANAGER":
        if staff_member.get("branch_id") != current_staff.get("branch_id"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    updated = revoke_staff_invitation(staff_id, actor=current_staff)
    return {
        "success": True,
        "data": updated,
        "message": f"Pending invitation revoked for {updated['email']}",
    }

@router.get("/staff-activities", summary="Get staff management activity logs")
async def get_staff_activities(
    staff_id: Optional[str] = Query(None, description="Optional target staff ID"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    activities = get_staff_activity_logs(dealer_id=dealer_id, staff_id=staff_id)
    return {
        "success": True,
        "data": activities,
        "count": len(activities),
        "message": f"Retrieved {len(activities)} staff activity logs",
    }
