from fastapi import APIRouter, HTTPException, status, Response, Request, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from src.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from src.core.identity_store import (
    find_user_by_email,
    find_user_by_id,
    get_dealer_by_id,
    get_branch_by_id,
    DEALERS_DB,
    BRANCHES_DB,
)
from src.core.dependencies import get_current_dealer_staff

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str

class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None

@router.post("/login-password", response_model=TokenResponse)
async def login_password(credentials: LoginRequest, response: Response):
    """
    Authenticate dealer staff using work email and secure password.
    Returns signed JWT access token and sets secure HTTP-Only refresh cookie.
    """
    user = find_user_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dealership account is inactive or suspended.",
        )

    dealer_id = user.get("dealer_id")
    dealer = get_dealer_by_id(dealer_id) if dealer_id else None
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not linked to an active authorized dealership.",
        )

    branch = get_branch_by_id(user["branch_id"]) if user.get("branch_id") else None

    # Mint JWT access token with full security claims
    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "roles": user.get("roles", []),
        "dealer_id": user["dealer_id"],
        "branch_id": user.get("branch_id"),
        "staff_role": user.get("staff_role"),
        "designation": user.get("designation"),
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(user["id"])

    # Set secure HTTP-Only refresh cookie
    response.set_cookie(
        key="gd_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # Set True in production with TLS
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
                "roles": user.get("roles", []),
                "staff_role": user.get("staff_role"),
                "designation": user.get("designation"),
                "dealer_id": user["dealer_id"],
                "branch_id": user.get("branch_id"),
                "branch_name": branch["branch_name"] if branch else "All Branches",
            },
            "dealer": dealer,
            "branch": branch,
        },
        "message": "Authentication successful",
    }

@router.post("/refresh")
async def refresh_session(request: Request, response: Response, payload: Optional[RefreshRequest] = None):
    """
    Rotates session tokens using the secure HTTP-Only refresh cookie or payload.
    """
    token = None
    if payload and payload.refresh_token:
        token = payload.refresh_token
    else:
        token = request.cookies.get("gd_refresh_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing. Please sign in again.",
        )

    try:
        claims = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again.",
        )

    if claims.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for session refresh.",
        )

    user_id = claims.get("sub")
    user = find_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active.",
        )

    new_access_token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "roles": user.get("roles", []),
        "dealer_id": user["dealer_id"],
        "branch_id": user.get("branch_id"),
        "staff_role": user.get("staff_role"),
        "designation": user.get("designation"),
    })

    return {
        "success": True,
        "data": {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": 3600,
        },
        "message": "Session refreshed successfully",
    }

@router.post("/logout")
async def logout(response: Response):
    """
    Terminates dealership session and clears refresh cookies.
    """
    response.delete_cookie(key="gd_refresh_token")
    return {
        "success": True,
        "message": "Successfully signed out of dealership workspace",
    }

@router.get("/me")
async def get_my_profile(current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)):
    """
    Returns verified profile, role capabilities, and dealership identity.
    """
    return {
        "success": True,
        "data": {
            "user": {
                "id": current_staff["id"],
                "email": current_staff["email"],
                "first_name": current_staff["first_name"],
                "last_name": current_staff["last_name"],
                "phone_number": current_staff["phone_number"],
                "roles": current_staff.get("roles", []),
                "staff_role": current_staff.get("staff_role"),
                "designation": current_staff.get("designation"),
                "dealer_id": current_staff["dealer_id"],
                "branch_id": current_staff.get("branch_id"),
            },
            "dealer": current_staff.get("dealer"),
            "branch": current_staff.get("branch"),
        },
        "message": "Profile retrieved successfully",
    }

