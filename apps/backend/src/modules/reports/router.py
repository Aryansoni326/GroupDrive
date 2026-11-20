from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from typing import Optional, Dict, Any, List
from datetime import datetime

from src.core.dependencies import get_current_dealer_staff, require_roles
from src.core.reports_store import (
    REPORT_TYPES,
    get_analytics_overview,
    get_report_data,
    generate_report_csv,
)

router = APIRouter(prefix="/dealers/me/reports", tags=["Reports & Analytics"])


@router.get("/overview", summary="Dealership Executive Overview & KPIs")
async def get_overview_kpis(
    date_range: Optional[str] = Query("ALL", description="ALL, TODAY, LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, LAST_90_DAYS, CUSTOM"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format or YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format or YYYY-MM-DD)"),
    branch_id: Optional[str] = Query(None, description="Filter by branch ID or ALL"),
    staff_id: Optional[str] = Query(None, description="Filter by sales executive ID or ALL"),
    model_name: Optional[str] = Query(None, description="Filter by vehicle model name or ALL"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Computes real-time KPI overview metrics across leads, pipeline valuation, inventory asset valuation,
    follow-up compliance, and quotation acceptance rates.
    """
    dealer_id = current_staff["dealer_id"]
    filters = {
        "date_range": date_range,
        "start_date": start_date,
        "end_date": end_date,
        "branch_id": branch_id,
        "staff_id": staff_id,
        "model_name": model_name,
    }
    stats = get_analytics_overview(user=current_staff, dealer_id=dealer_id, filters=filters)
    return {
        "success": True,
        "data": stats,
    }


@router.get("/types", summary="List Available Report Types")
async def get_available_report_types(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Lists the 11 supported dealership operational and financial report modules.
    """
    return {
        "success": True,
        "report_types": REPORT_TYPES,
    }


@router.get("/{report_type}/export", summary="Export Report Tabular Data to CSV")
async def export_report_to_csv(
    report_type: str,
    date_range: Optional[str] = Query("ALL"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    staff_id: Optional[str] = Query(None),
    model_name: Optional[str] = Query(None),
    lead_status: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    current_staff: Dict[str, Any] = Depends(
        require_roles(["DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"])
    ),
):
    """
    Exports report dataset to RFC 4180 CSV format.
    Restricted to management roles (DEALER_OWNER, BRANCH_MANAGER, SALES_MANAGER).
    Sales executives are restricted from exporting dealership-wide reports.
    """
    clean_type = report_type.upper()
    if clean_type not in REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type '{report_type}'. Supported types: {', '.join(REPORT_TYPES)}",
        )

    dealer_id = current_staff["dealer_id"]
    filters = {
        "date_range": date_range,
        "start_date": start_date,
        "end_date": end_date,
        "branch_id": branch_id,
        "staff_id": staff_id,
        "model_name": model_name,
        "lead_status": lead_status,
        "campaign_id": campaign_id,
    }

    csv_data = generate_report_csv(
        report_type=clean_type,
        user=current_staff,
        dealer_id=dealer_id,
        filters=filters,
    )

    filename = f"report_{clean_type.lower()}_{datetime.now().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


@router.get("/{report_type}", summary="Generate Dealership Operational & Analytical Report")
async def get_report_detail(
    report_type: str,
    date_range: Optional[str] = Query("ALL"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    branch_id: Optional[str] = Query(None),
    staff_id: Optional[str] = Query(None),
    model_name: Optional[str] = Query(None),
    lead_status: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Generates a full operational report with summary cards, breakdown charts,
    tabular dataset, and explicit mathematical formulas for transparency.
    """
    clean_type = report_type.upper()
    if clean_type not in REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type '{report_type}'. Supported types: {', '.join(REPORT_TYPES)}",
        )

    dealer_id = current_staff["dealer_id"]
    filters = {
        "date_range": date_range,
        "start_date": start_date,
        "end_date": end_date,
        "branch_id": branch_id,
        "staff_id": staff_id,
        "model_name": model_name,
        "lead_status": lead_status,
        "campaign_id": campaign_id,
    }

    report_payload = get_report_data(
        report_type=clean_type,
        user=current_staff,
        dealer_id=dealer_id,
        filters=filters,
    )

    return {
        "success": True,
        "data": report_payload,
    }

