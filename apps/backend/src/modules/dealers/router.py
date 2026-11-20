from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any, List
from src.core.dependencies import (
    get_current_dealer_staff,
    require_roles,
    verify_tenant_isolation,
    verify_branch_isolation,
)
from src.core.identity_store import (
    get_dealer_by_id,
    get_branches_by_dealer_id,
    get_branch_by_id,
    update_dealer_profile,
    create_dealer_branch,
    update_dealer_branch,
    toggle_branch_status,
)

router = APIRouter(prefix="/dealers", tags=["Dealers & Branches"])

class DealerProfileUpdateRequest(BaseModel):
    trade_name: Optional[str] = Field(None, min_length=2, max_length=150)
    registered_office_address: Optional[str] = Field(None, min_length=5, max_length=300)
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = Field(None, min_length=10, max_length=15)
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    operating_hours: Optional[str] = None
    # Explicitly catch attempt to pass kyc_status
    kyc_status: Optional[str] = None

    @field_validator("logo_url", "website_url")
    @classmethod
    def validate_safe_urls(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = v.strip().lower()
            if not (clean.startswith("https://") or clean.startswith("http://") or clean.startswith("/")):
                raise ValueError("URL must begin with https://, http://, or /")
        return v

class BranchCreateRequest(BaseModel):
    branch_name: str = Field(..., min_length=3, max_length=150)
    branch_type: str = Field("SHOWROOM_AND_SERVICE", pattern="^(SHOWROOM_AND_SERVICE|SHOWROOM_ONLY|STOCKYARD_ONLY)$")
    address_line1: str = Field(..., min_length=3, max_length=200)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2, max_length=80)
    state: str = Field("Karnataka", min_length=2, max_length=80)
    pin_code: str = Field(..., min_length=6, max_length=6)
    authorized_rto_codes: List[str] = Field(default_factory=list)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    operating_hours: Optional[str] = "09:30 AM - 07:30 PM (Mon - Sun)"
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: bool = True

class BranchUpdateRequest(BaseModel):
    branch_name: Optional[str] = Field(None, min_length=3, max_length=150)
    branch_type: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pin_code: Optional[str] = None
    authorized_rto_codes: Optional[List[str]] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    operating_hours: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: Optional[bool] = None

class BranchStatusRequest(BaseModel):
    is_active: bool

@router.get("/me")
async def get_my_dealer_profile(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Returns the authenticated staff member's dealership profile.
    """
    dealer_id = current_staff["dealer_id"]
    dealer = get_dealer_by_id(dealer_id)
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dealership entity not found.",
        )
    return {
        "success": True,
        "data": dealer,
        "message": "Dealership profile retrieved successfully",
    }

@router.put("/me")
async def update_my_dealer_profile(
    payload: DealerProfileUpdateRequest,
    current_staff: Dict[str, Any] = Depends(
        require_roles(["ROLE_DEALER_OWNER"])
    )
):
    """
    Updates the dealership profile information.
    Restricted strictly to Dealer Owners.
    Security: Verification status (kyc_status) cannot be altered by dealer staff.
    """
    # Security requirement: check if caller attempted to tamper with kyc_status
    if payload.kyc_status is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized modification: Dealership KYC verification status can only be updated by Platform Administration.",
        )

    dealer_id = current_staff["dealer_id"]
    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("kyc_status", None)

    updated_dealer = update_dealer_profile(dealer_id, update_data)
    if not updated_dealer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dealership record not found.",
        )

    return {
        "success": True,
        "data": updated_dealer,
        "message": "Dealership profile updated successfully",
    }

@router.get("/me/branches")
async def get_my_dealer_branches(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Returns all showroom, service, and yard branches belonging to the authenticated dealership.
    """
    dealer_id = current_staff["dealer_id"]
    branches = get_branches_by_dealer_id(dealer_id)
    return {
        "success": True,
        "data": branches,
        "message": "Dealership branches retrieved successfully",
    }

@router.post("/me/branches", status_code=status.HTTP_201_CREATED)
async def create_branch(
    payload: BranchCreateRequest,
    current_staff: Dict[str, Any] = Depends(
        require_roles(["ROLE_DEALER_OWNER"])
    )
):
    """
    Creates a new showroom or stockyard branch under the authenticated dealership.
    Restricted to Dealer Owners.
    """
    dealer_id = current_staff["dealer_id"]
    branch_dict = payload.model_dump()
    branch_dict["dealer_id"] = dealer_id

    created = create_dealer_branch(branch_dict)
    return {
        "success": True,
        "data": created,
        "message": f"Branch '{created['branch_name']}' created successfully",
    }

@router.get("/me/branches/{branch_id}")
async def get_branch_details(
    branch_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Retrieves full details for a single branch.
    Enforces tenant isolation.
    """
    dealer_id = current_staff["dealer_id"]
    branch = get_branch_by_id(branch_id)
    if not branch or branch["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found or belongs to another dealership.",
        )

    return {
        "success": True,
        "data": branch,
        "message": "Branch details retrieved successfully",
    }

@router.put("/me/branches/{branch_id}")
async def update_branch(
    branch_id: str,
    payload: BranchUpdateRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Updates branch configuration and contact information.
    Authorization rules:
    - Dealer Owners can edit any branch belonging to their dealership.
    - Branch Managers can edit ONLY their assigned branch.
    - Other staff roles receive 403 Forbidden.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role")

    branch = get_branch_by_id(branch_id)
    if not branch or branch["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found or access denied.",
        )

    # Enforce role and branch-level jurisdiction
    if role == "DEALER_OWNER":
        pass # Dealer Owner has full branch update authority
    elif role == "BRANCH_MANAGER":
        if current_staff.get("branch_id") != branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch Manager access restricted: You can only manage your assigned showroom branch.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Branch configuration management requires Dealer Owner or Branch Manager role.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    updated = update_dealer_branch(branch_id, update_data)

    return {
        "success": True,
        "data": updated,
        "message": f"Branch '{updated['branch_name']}' updated successfully",
    }

@router.patch("/me/branches/{branch_id}/status")
async def toggle_branch_active_status(
    branch_id: str,
    payload: BranchStatusRequest,
    current_staff: Dict[str, Any] = Depends(
        require_roles(["ROLE_DEALER_OWNER"])
    )
):
    """
    Activates or deactivates a branch.
    Requires Dealer Owner authorization.
    """
    dealer_id = current_staff["dealer_id"]
    branch = get_branch_by_id(branch_id)
    if not branch or branch["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found or unauthorized.",
        )

    updated = toggle_branch_status(branch_id, payload.is_active)
    state_str = "activated" if payload.is_active else "deactivated"
    return {
        "success": True,
        "data": updated,
        "message": f"Branch '{branch['branch_name']}' has been {state_str}",
    }

