from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from src.core.dependencies import get_current_dealer_staff, verify_tenant_isolation, verify_branch_isolation
from src.core.catalogue_store import (
    get_all_brands,
    get_all_models,
    get_all_variants,
    get_variant_by_id,
    get_model_by_id,
)
from src.core.inventory_store import (
    get_inventory_item_by_id,
    get_inventory_dashboard_metrics,
    query_inventory,
    add_inventory_item,
    update_inventory_item,
    get_inventory_history,
)
from src.core.identity_store import get_branch_by_id

router = APIRouter(tags=["Vehicle Inventory Management"])

ALLOWED_MANAGE_ROLES = {"DEALER_OWNER", "BRANCH_MANAGER", "INVENTORY_MANAGER"}

class AddInventoryRequest(BaseModel):
    variant_id: str = Field(..., description="Official vehicle variant ID from centralized catalogue")
    branch_id: str = Field(..., description="Target dealership showroom or yard branch ID")
    colour_id: Optional[str] = Field(None, description="Official OEM colour ID")
    colour_name: Optional[str] = Field(None, description="Official OEM colour name")
    vin: Optional[str] = Field(None, description="17-character vehicle identification number")
    stock_serial_number: Optional[str] = Field(None, description="Internal dealership stock tag")
    manufacturing_month_year: Optional[str] = Field(None, description="MM-YYYY of vehicle manufacture")
    status: Optional[str] = Field("IN_STOCK", description="Initial inventory status")
    stock_quantity: Optional[int] = Field(1, ge=1, description="Quantity of units")
    yard_location: Optional[str] = Field(None, description="Specific yard bay or lot position")
    ex_showroom_price: Optional[int] = Field(None, ge=100000, description="Dealer commercial offer price")
    is_available_for_flash_sale: Optional[bool] = Field(False)
    is_available_for_group_buy: Optional[bool] = Field(True)
    notes: Optional[str] = None

class UpdateInventoryRequest(BaseModel):
    branch_id: Optional[str] = None
    yard_location: Optional[str] = None
    ex_showroom_price: Optional[int] = Field(None, ge=100000)
    status: Optional[str] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_available_for_flash_sale: Optional[bool] = None
    is_available_for_group_buy: Optional[bool] = None
    vin: Optional[str] = None
    notes: Optional[str] = None

class UpdateAvailabilityRequest(BaseModel):
    status: Optional[str] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_available_for_flash_sale: Optional[bool] = None
    is_available_for_group_buy: Optional[bool] = None

def check_can_manage_inventory(current_staff: Dict[str, Any], target_branch_id: Optional[str] = None):
    role = current_staff.get("staff_role") or ""
    if role not in ALLOWED_MANAGE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage vehicle inventory",
        )
    if role in ["BRANCH_MANAGER", "INVENTORY_MANAGER"]:
        caller_branch = current_staff.get("branch_id")
        if target_branch_id and caller_branch and target_branch_id != caller_branch:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage inventory within your assigned branch or stockyard",
            )

# --- Official Centralized Vehicle Catalogue Endpoints ---

@router.get("/catalogue/brands", summary="List official vehicle brands")
async def list_catalogue_brands(current_staff: Dict[str, Any] = Depends(get_current_dealer_staff)):
    brands = get_all_brands()
    return {
        "success": True,
        "data": brands,
        "count": len(brands),
        "message": "Official vehicle brands retrieved successfully",
    }

@router.get("/catalogue/models", summary="List official vehicle models")
async def list_catalogue_models(
    brand_id: Optional[str] = Query(None, description="Optional brand filter"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    models = get_all_models(brand_id=brand_id)
    return {
        "success": True,
        "data": models,
        "count": len(models),
        "message": "Official vehicle models retrieved successfully",
    }

@router.get("/catalogue/variants", summary="List official vehicle variants with specifications")
async def list_catalogue_variants(
    model_id: Optional[str] = Query(None, description="Filter by model ID"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    transmission: Optional[str] = Query(None, description="Filter by transmission"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    variants = get_all_variants(model_id=model_id, fuel_type=fuel_type, transmission=transmission)
    return {
        "success": True,
        "data": variants,
        "count": len(variants),
        "message": "Official vehicle variants retrieved successfully",
    }

@router.get("/catalogue/variants/{variant_id}", summary="Get official vehicle variant specifications")
async def get_catalogue_variant_details(
    variant_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    variant = get_variant_by_id(variant_id)
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Official variant with ID '{variant_id}' does not exist in the catalogue",
        )
    return {
        "success": True,
        "data": variant,
        "message": "Official vehicle specifications retrieved successfully",
    }

# --- Dealer Inventory Endpoints ---

@router.get("/inventory/dashboard", summary="Get inventory KPI dashboard summary")
async def get_inventory_dashboard(
    branch_id: Optional[str] = Query(None, description="Optional branch scoping"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    effective_branch = branch_id

    # If caller is branch manager or inventory manager, enforce their branch
    if current_staff.get("staff_role") in ["BRANCH_MANAGER", "INVENTORY_MANAGER"]:
        if current_staff.get("branch_id"):
            effective_branch = current_staff.get("branch_id")

    metrics = get_inventory_dashboard_metrics(dealer_id=dealer_id, branch_id=effective_branch)
    return {
        "success": True,
        "data": metrics,
        "message": "Inventory dashboard metrics retrieved successfully",
    }

@router.get("/inventory", summary="List and filter dealership inventory")
async def list_inventory(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    brand: Optional[str] = Query(None, description="Filter by brand name"),
    model: Optional[str] = Query(None, description="Filter by model name or ID"),
    variant: Optional[str] = Query(None, description="Filter by variant name or ID"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    transmission: Optional[str] = Query(None, description="Filter by transmission"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (IN_STOCK, IN_TRANSIT, ALLOCATED_TO_GROUP, SOLD, DELIVERED)"),
    search: Optional[str] = Query(None, description="Search by VIN, Model, Variant, Colour, Stock Tag"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    caller_role = current_staff.get("staff_role") or ""
    caller_branch = current_staff.get("branch_id")

    effective_branch = branch_id
    if caller_role in ["BRANCH_MANAGER", "INVENTORY_MANAGER"] and caller_branch:
        if branch_id and branch_id != "ALL" and branch_id != caller_branch:
            verify_branch_isolation(branch_id, current_staff)
        effective_branch = caller_branch
    elif branch_id and branch_id != "ALL":
        verify_branch_isolation(branch_id, current_staff)

    items = query_inventory(
        dealer_id=dealer_id,
        branch_id=effective_branch,
        brand=brand,
        model=model,
        variant=variant,
        fuel_type=fuel_type,
        transmission=transmission,
        status=status_filter,
        search=search,
    )

    return {
        "success": True,
        "data": items,
        "count": len(items),
        "message": f"Retrieved {len(items)} inventory records",
    }

@router.post("/inventory", status_code=status.HTTP_201_CREATED, summary="Add vehicle to yard inventory from catalogue")
async def add_vehicle_to_inventory(
    payload: AddInventoryRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    check_can_manage_inventory(current_staff, target_branch_id=payload.branch_id)

    # Verify target branch belongs to caller's dealership
    branch = get_branch_by_id(payload.branch_id)
    if not branch or branch.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The specified branch does not exist or does not belong to your dealership",
        )

    # Verify variant exists in official catalogue
    variant = get_variant_by_id(payload.variant_id)
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle variant '{payload.variant_id}' does not exist in the official vehicle catalogue",
        )

    item_data = payload.model_dump()
    item_data["dealer_id"] = dealer_id

    try:
        new_item = add_inventory_item(item_data, actor=current_staff)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {
        "success": True,
        "data": new_item,
        "message": f"Vehicle '{new_item['model_name']} {new_item['variant_name']}' added to inventory successfully",
    }

@router.get("/inventory/{inventory_id}", summary="View vehicle details and specifications")
async def get_inventory_details(
    inventory_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    item = get_inventory_item_by_id(inventory_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record with ID '{inventory_id}' was not found",
        )

    # Enforce multi-tenant isolation
    if item["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Inventory record belongs to a different dealership.",
        )

    # Resolve official specifications from catalogue
    variant = get_variant_by_id(item["variant_id"])

    response_data = dict(item)
    response_data["official_specifications"] = {
        "engine_description": variant.get("engine_description") if variant else "Standard OEM Powertrain",
        "power_ps": variant.get("power_ps") if variant else "OEM Calibrated Output",
        "torque_nm": variant.get("torque_nm") if variant else "OEM Rated Torque",
        "arai_mileage": variant.get("arai_mileage") if variant else "Certified Mileage",
        "emission_standard": variant.get("emission_standard") if variant else "BS6 Phase 2",
        "seating_capacity": variant.get("seating_capacity", 5) if variant else 5,
        "official_ex_showroom_price": variant.get("official_ex_showroom_price") if variant else item["ex_showroom_price"],
    }

    return {
        "success": True,
        "data": response_data,
        "message": "Vehicle details and specifications retrieved successfully",
    }

@router.put("/inventory/{inventory_id}", summary="Edit dealer-managed commercial inventory information")
async def edit_inventory_details(
    inventory_id: str,
    payload: UpdateInventoryRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    item = get_inventory_item_by_id(inventory_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record with ID '{inventory_id}' was not found",
        )

    # Multi-tenant isolation
    if item["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Inventory record belongs to a different dealership.",
        )

    check_can_manage_inventory(current_staff, target_branch_id=item["branch_id"])

    # If updating branch, check target branch ownership
    if payload.branch_id and payload.branch_id != item["branch_id"]:
        check_can_manage_inventory(current_staff, target_branch_id=payload.branch_id)
        target_branch = get_branch_by_id(payload.branch_id)
        if not target_branch or target_branch.get("dealer_id") != dealer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target branch does not belong to your dealership",
            )

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_inventory_item(inventory_id, updates, actor=current_staff)

    return {
        "success": True,
        "data": updated,
        "message": "Inventory details updated successfully",
    }

@router.patch("/inventory/{inventory_id}/availability", summary="Update vehicle availability and status")
async def update_vehicle_availability(
    inventory_id: str,
    payload: UpdateAvailabilityRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    item = get_inventory_item_by_id(inventory_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record with ID '{inventory_id}' was not found",
        )

    # Multi-tenant isolation
    if item["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Inventory record belongs to a different dealership.",
        )

    check_can_manage_inventory(current_staff, target_branch_id=item["branch_id"])

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_inventory_item(inventory_id, updates, actor=current_staff)

    return {
        "success": True,
        "data": updated,
        "message": "Vehicle availability and status updated successfully",
    }

@router.get("/inventory/{inventory_id}/history", summary="View vehicle inventory audit history")
async def get_vehicle_history(
    inventory_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    dealer_id = current_staff["dealer_id"]
    item = get_inventory_item_by_id(inventory_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory record with ID '{inventory_id}' was not found",
        )

    if item["dealer_id"] != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Inventory record belongs to a different dealership.",
        )

    history = get_inventory_history(inventory_id, dealer_id)
    return {
        "success": True,
        "data": history,
        "count": len(history),
        "message": "Inventory history records retrieved successfully",
    }

