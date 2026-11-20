from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header
import jwt
from src.core.security import decode_token
from src.core.identity_store import find_user_by_id, get_dealer_by_id, get_branch_by_id

async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Extracts Bearer token from Authorization header and verifies JWT signature and expiry.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer", "X-Token-Expired": "true"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tampered authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = find_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact platform administration.",
        )

    return user

async def get_current_dealer_staff(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Validates that the authenticated user belongs to an authorized dealership.
    """
    dealer_id = current_user.get("dealer_id")
    if not dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not associated with an authorized automotive dealership.",
        )

    dealer = get_dealer_by_id(dealer_id)
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dealership entity not found or registration revoked.",
        )

    if dealer.get("kyc_status") == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dealership operations are suspended pending compliance review.",
        )

    # Attach dealer entity and branch info to request context
    context = current_user.copy()
    context["dealer"] = dealer
    if current_user.get("branch_id"):
        context["branch"] = get_branch_by_id(current_user["branch_id"])

    return context

async def get_current_customer(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Validates that the authenticated user is a registered customer.
    """
    if "ROLE_CUSTOMER" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to customer accounts.",
        )
    return current_user

async def get_optional_current_user(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """
    Returns user if valid bearer token is provided, otherwise None.
    """
    if not authorization:
        return None
    try:
        return await get_current_user(authorization=authorization)
    except Exception:
        return None

def require_roles(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Verifies that the caller possesses at least one of the allowed roles.
    """
    async def role_checker(
        current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
    ) -> Dict[str, Any]:
        user_roles = set(current_staff.get("roles", []))
        staff_role = current_staff.get("staff_role")
        if staff_role:
            user_roles.add(staff_role)
            user_roles.add(f"ROLE_{staff_role}")
        has_role = any(r in user_roles or f"ROLE_{r}" in user_roles for r in allowed_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}.",
            )
        return current_staff

    return role_checker

def verify_tenant_isolation(resource_dealer_id: str, current_staff: Dict[str, Any]):
    """
    Guarantees horizontal tenant isolation between independent dealerships.
    Raises 403 Forbidden if a dealer staff member attempts to read or modify
    records belonging to another dealership.
    """
    if resource_dealer_id != current_staff.get("dealer_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-dealership access violation. You can only access your own dealership records.",
        )

def verify_branch_isolation(resource_branch_id: str, current_staff: Dict[str, Any]):
    """
    Enforces vertical branch-level access restrictions.
    Dealer Owners can access all branches; other roles (Branch Manager,
    Sales Executive, etc.) are restricted strictly to their assigned branch.
    """
    if current_staff.get("staff_role") == "DEALER_OWNER":
        return # Dealer Owner has cross-branch privileges within their own dealership

    user_branch_id = current_staff.get("branch_id")
    if not user_branch_id or user_branch_id != resource_branch_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branch-level access violation. You cannot access or modify records of another branch.",
        )

