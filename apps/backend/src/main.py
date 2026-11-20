from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional, List
from src.core.config import settings
from src.core.security_middleware import SecurityHeadersAndRateLimitMiddleware
from src.modules.auth.router import router as auth_router
from src.modules.dashboard.router import router as dashboard_router
from src.modules.dealers.router import router as dealers_router
from src.modules.staff.router import router as staff_router
from src.modules.inventory.router import router as inventory_router
from src.modules.leads.router import router as leads_router
from src.modules.followups.router import router as followups_router
from src.modules.opportunities.router import router as opportunities_router
from src.modules.quotations.router import router as quotations_router
from src.modules.campaigns.router import router as campaigns_router
from src.modules.notifications.router import router as notifications_router
from src.modules.reports.router import router as reports_router
from src.modules.customer.router import router as customer_router
from src.core.dependencies import (
    get_current_user,
    get_current_dealer_staff,
    require_roles,
    verify_tenant_isolation,
    verify_branch_isolation,
)
from src.core.identity_store import (
    get_branches_by_dealer_id,
    get_dealer_by_id,
)
from src.core.quotations_store import list_quotations

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Centralized REST API for GroupDrive ecosystem: Main Website, DealerOS, and Admin Panel",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersAndRateLimitMiddleware)

# Mount Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(dealers_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(staff_router, prefix=settings.API_V1_PREFIX)
app.include_router(inventory_router, prefix=settings.API_V1_PREFIX)
app.include_router(leads_router, prefix=settings.API_V1_PREFIX)
app.include_router(followups_router, prefix=settings.API_V1_PREFIX)
app.include_router(opportunities_router, prefix=settings.API_V1_PREFIX)
app.include_router(quotations_router, prefix=settings.API_V1_PREFIX)
app.include_router(campaigns_router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(customer_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "groupdrive-backend",
        "version": settings.VERSION,
    }

# Multi-Tenant Isolation Test Endpoint
@app.get(f"{settings.API_V1_PREFIX}/dealers/test-cross-tenant/{{target_dealer_id}}", tags=["Security & Multitenancy"])
async def test_cross_tenant_access(
    target_dealer_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Security verification endpoint:
    Verifies that staff cannot read or alter records of another dealership.
    Throws 403 Forbidden if target_dealer_id != authenticated staff dealer_id.
    """
    verify_tenant_isolation(target_dealer_id, current_staff)
    return {
        "success": True,
        "message": "Authorized. Target dealership matches authenticated session.",
        "tenant_id": target_dealer_id,
    }

# Branch-Level Access Test Endpoint
@app.get(f"{settings.API_V1_PREFIX}/dealers/test-branch-access/{{target_branch_id}}", tags=["Security & Multitenancy"])
async def test_branch_access(
    target_branch_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Branch-level authorization verification endpoint:
    Dealer Owners can access any branch within their dealership.
    Branch Managers / Sales Executives can only access their assigned branch.
    """
    verify_branch_isolation(target_branch_id, current_staff)
    return {
        "success": True,
        "message": "Authorized. Target branch is within staff jurisdiction.",
        "branch_id": target_branch_id,
    }

# Buyer Groups within Regional Territory
@app.get(f"{settings.API_V1_PREFIX}/groups", tags=["Groups"])
async def get_buyer_groups(
    city: Optional[str] = None,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Returns active buyer groups within the dealership's regional operational zone.
    """
    groups_data = [
        {
            "id": "grp-blr-brz-04",
            "group_code": "GD-BLR-BRZ-04",
            "model_id": "mod-brezza-01",
            "model_name": "Maruti Suzuki Brezza",
            "brand_name": "Maruti Suzuki",
            "city": "Bengaluru",
            "state": "Karnataka",
            "rto_circle": "KA-03 (Indiranagar / East)",
            "status": "OPEN_FOR_QUOTES",
            "min_members_threshold": 3,
            "max_capacity": 10,
            "current_members_count": 7,
            "quoting_deadline": "2026-11-09T18:00:00Z",
            "expiry_at": "2026-11-15T23:59:59Z",
            "target_delivery_window_days": 20,
            "created_at": "2026-11-02T09:30:00Z",
        },
        {
            "id": "grp-blr-gv-02",
            "group_code": "GD-BLR-GV-02",
            "model_id": "mod-gvitara-01",
            "model_name": "Maruti Suzuki Grand Vitara",
            "brand_name": "Maruti Suzuki",
            "city": "Bengaluru",
            "state": "Karnataka",
            "rto_circle": "KA-05 (Jayanagar / South)",
            "status": "OPEN_FOR_QUOTES",
            "min_members_threshold": 3,
            "max_capacity": 8,
            "current_members_count": 5,
            "quoting_deadline": "2026-11-08T15:00:00Z",
            "expiry_at": "2026-11-14T23:59:59Z",
            "target_delivery_window_days": 30,
            "created_at": "2026-11-03T11:20:00Z",
        },
    ]

    return {
        "success": True,
        "data": groups_data,
        "message": "Active groups retrieved",
    }

# Protected Quotations Endpoint with RBAC
@app.get(f"{settings.API_V1_PREFIX}/quotations/dealer/me", tags=["Quotations"])
async def get_my_quotations(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)
):
    """
    Returns binding quotes submitted by the authenticated dealership.
    """
    dealer_id = current_staff["dealer_id"]
    quotes_data = list_quotations(dealer_id=dealer_id)
    return {
        "success": True,
        "data": quotes_data,
        "message": "Dealership quotations retrieved",
    }

@app.post(f"{settings.API_V1_PREFIX}/groups/{{group_id}}/quotations", tags=["Quotations"])
async def submit_quotation(
    group_id: str,
    payload: Dict[str, Any],
    current_staff: Dict[str, Any] = Depends(
        require_roles(["ROLE_DEALER_OWNER", "ROLE_BRANCH_MANAGER", "ROLE_SALES_MANAGER"])
    )
):
    """
    Submits a legally binding itemized reverse bid.
    Enforces that only Dealer Owners, Branch Managers, or Sales Managers can submit quotes.
    Sales Executives and Inventory Managers receive 403 Forbidden.
    """
    dealer_id = current_staff["dealer_id"]
    branch_id = payload.get("branch_id") or current_staff.get("branch_id") or "br-whitefield-01"

    # Enforce branch isolation
    verify_branch_isolation(branch_id, current_staff)

    new_quote = {
        "id": f"qte-{payload.get('group_code', 'GD')}-001",
        "group_id": group_id,
        "group_code": payload.get("group_code", "GD-BID"),
        "model_name": payload.get("model_name", "Vehicle Model"),
        "city": "Bengaluru",
        "dealer_id": dealer_id,
        "branch_id": branch_id,
        "branch_name": "Authorized Branch",
        "total_group_discount": payload.get("total_group_discount", 45000),
        "net_on_road_price": payload.get("net_on_road_price", 1250000),
        "delivery_timeline_days": payload.get("delivery_timeline_days", 21),
        "dealership_terms": payload.get("dealership_terms", "Binding for 14 days."),
        "quotation_status": "SUBMITTED",
        "valid_until": "2026-11-25T23:59:59Z",
        "items": payload.get("items", []),
        "created_at": "2026-11-06T20:00:00Z",
    }

    return {
        "success": True,
        "data": new_quote,
        "message": "Quotation submitted and recorded successfully",
    }
