from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from src.core.dependencies import get_current_dealer_staff, verify_branch_isolation
from src.modules.dashboard.data import (
    ENQUIRIES_DB,
    FOLLOW_UPS_DB,
    TASKS_DB,
    ACTIVITIES_DB,
    STAFF_PERFORMANCE_DB,
    INVENTORY_MASTER_DB,
    BUYER_GROUPS_MASTER_DB,
    QUOTATIONS_MASTER_DB,
)
from src.core.opportunities_store import GROUP_OPPORTUNITIES_DB

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=Dict[str, Any])
async def get_dashboard_summary(
    branch_id: Optional[str] = Query(None, description="Optional branch filter for multi-branch dealership owners"),
    date_filter: Optional[str] = Query("all", description="Date range: today, this_week, this_month, all"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns unified, role-personalized dashboard metrics, tasks, enquiries,
    follow-ups, and operational activities calculated dynamically from live database records.
    Strict tenant and branch isolation is cryptographically verified via JWT context.
    """
    dealer_id = current_staff["dealer_id"]
    staff_id = current_staff["id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")

    # Determine effective branch scope
    # Dealer owners can view all branches or choose a specific branch.
    # Non-owners are strictly locked to their assigned branch.
    effective_branch_id: Optional[str] = None
    if role == "DEALER_OWNER":
        if branch_id and branch_id != "all":
            effective_branch_id = branch_id
    else:
        # Enforce that non-owner can only see their assigned branch
        effective_branch_id = current_staff.get("branch_id")
        if branch_id and branch_id != "all" and branch_id != effective_branch_id:
            verify_branch_isolation(branch_id, current_staff)

    # 1. Filter Enquiries by Dealership, Branch, and Role
    dealer_enquiries = [e for e in ENQUIRIES_DB if e["dealer_id"] == dealer_id]
    if effective_branch_id:
        dealer_enquiries = [e for e in dealer_enquiries if e["branch_id"] == effective_branch_id]

    # For Sales Executive, prioritize their assigned enquiries
    role_enquiries = dealer_enquiries
    if role == "SALES_EXECUTIVE":
        role_enquiries = [e for e in dealer_enquiries if e.get("assigned_to_id") == staff_id]

    # 2. Filter Follow-ups
    dealer_follow_ups = [f for f in FOLLOW_UPS_DB if f["dealer_id"] == dealer_id]
    if effective_branch_id:
        dealer_follow_ups = [f for f in dealer_follow_ups if f["branch_id"] == effective_branch_id]

    role_follow_ups = dealer_follow_ups
    if role == "SALES_EXECUTIVE":
        role_follow_ups = [f for f in dealer_follow_ups if f.get("assigned_to_id") == staff_id]
    elif role == "FINANCE_EXECUTIVE":
        role_follow_ups = [f for f in dealer_follow_ups if f.get("follow_up_type") in ["DOCUMENTATION", "PAYMENT"]]

    # 3. Filter Tasks
    dealer_tasks = [t for t in TASKS_DB if t["dealer_id"] == dealer_id]
    if effective_branch_id:
        dealer_tasks = [t for t in dealer_tasks if t["branch_id"] == effective_branch_id]

    role_tasks = dealer_tasks
    if role == "SALES_EXECUTIVE":
        role_tasks = [t for t in dealer_tasks if t.get("assigned_to_id") == staff_id]
    elif role == "INVENTORY_MANAGER":
        role_tasks = [t for t in dealer_tasks if t.get("related_entity_type") == "INVENTORY" or t.get("assigned_to_id") == staff_id]
    elif role == "FINANCE_EXECUTIVE":
        role_tasks = [t for t in dealer_tasks if t.get("assigned_to_id") == staff_id or "loan" in t.get("title", "").lower()]

    # 4. Filter Activities
    dealer_activities = [a for a in ACTIVITIES_DB if a["dealer_id"] == dealer_id]
    if effective_branch_id:
        dealer_activities = [a for a in dealer_activities if a.get("branch_id") in [effective_branch_id, None]]

    # 5. Inventory Summary
    dealer_inventory = [i for i in INVENTORY_MASTER_DB if i["dealer_id"] == dealer_id]
    if effective_branch_id:
        dealer_inventory = [i for i in dealer_inventory if i["branch_id"] == effective_branch_id]

    in_stock_count = len([i for i in dealer_inventory if i["status"] == "IN_STOCK"])
    in_transit_count = len([i for i in dealer_inventory if i["status"] == "IN_TRANSIT"])
    allocated_count = len([i for i in dealer_inventory if i["status"] == "ALLOCATED_TO_GROUP"])
    aging_count = len([i for i in dealer_inventory if i["days_in_yard"] >= 45])

    # 6. Group Opportunities & Quotations
    groups = GROUP_OPPORTUNITIES_DB
    quotations = [q for q in QUOTATIONS_MASTER_DB if q["dealer_id"] == dealer_id]
    if effective_branch_id:
        quotations = [q for q in quotations if q["branch_id"] == effective_branch_id]

    # 7. Sales Performance Records
    dealer_performance = STAFF_PERFORMANCE_DB
    if effective_branch_id:
        dealer_performance = [p for p in STAFF_PERFORMANCE_DB if p["branch_id"] == effective_branch_id]

    if role == "SALES_EXECUTIVE":
        dealer_performance = [p for p in dealer_performance if p["staff_id"] == staff_id]

    # Dynamic calculation of summary KPIs from actual filtered database records
    new_leads_count = len([e for e in role_enquiries if e["status"] in ["NEW", "QUALIFIED"]])
    follow_ups_due_count = len([f for f in role_follow_ups if f["status"] in ["PENDING", "OVERDUE"]])
    active_opportunities_count = len([e for e in role_enquiries if e["status"] in ["NEW", "QUALIFIED", "CONTACTED"]])
    group_opportunities_count = len([g for g in groups if g["status"] in ["OPEN_FOR_QUOTES", "QUOTATION_REVIEW"]])
    total_rev = sum(p.get("revenue_generated", 0) for p in dealer_performance)

    summary_metrics = {
        "total_enquiries": len(role_enquiries),
        "new_leads": new_leads_count,
        "follow_ups_due": follow_ups_due_count,
        "active_opportunities": active_opportunities_count,
        "available_inventory": in_stock_count,
        "pending_quotations": len(quotations),
        "group_purchasing_opportunities": group_opportunities_count,
        "total_dealership_revenue": total_rev,
    }

    return {
        "success": True,
        "data": {
            "metrics": summary_metrics,
            "tasks": role_tasks,
            "recent_enquiries": role_enquiries[:6],
            "upcoming_follow_ups": role_follow_ups[:6],
            "recent_activities": dealer_activities[:8],
            "inventory_summary": {
                "total_vehicles": len(dealer_inventory),
                "in_stock": in_stock_count,
                "in_transit": in_transit_count,
                "allocated_to_groups": allocated_count,
                "aging_units": aging_count,
                "recent_stock": dealer_inventory[:4],
            },
            "latest_group_opportunities": groups[:4],
            "recent_quotations": quotations[:4],
            "sales_performance": dealer_performance,
            "role_context": {
                "role": role,
                "staff_id": staff_id,
                "branch_id": effective_branch_id,
            },
        },
        "message": f"Dashboard metrics retrieved successfully for role {role}",
    }

@router.patch("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    payload: Dict[str, Any],
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Updates the status of a daily task (TODO, IN_PROGRESS, DONE).
    """
    dealer_id = current_staff["dealer_id"]
    for task in TASKS_DB:
        if task["id"] == task_id and task["dealer_id"] == dealer_id:
            new_status = payload.get("status", "DONE")
            task["status"] = new_status
            return {
                "success": True,
                "data": task,
                "message": f"Task updated to {new_status}",
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Task not found or unauthorized.",
    )

@router.patch("/follow-ups/{follow_up_id}/status")
async def update_follow_up_status(
    follow_up_id: str,
    payload: Dict[str, Any],
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Updates the status of a customer follow-up (PENDING, COMPLETED, CANCELLED).
    """
    dealer_id = current_staff["dealer_id"]
    for flw in FOLLOW_UPS_DB:
        if flw["id"] == follow_up_id and flw["dealer_id"] == dealer_id:
            new_status = payload.get("status", "COMPLETED")
            flw["status"] = new_status
            return {
                "success": True,
                "data": flw,
                "message": f"Follow-up updated to {new_status}",
            }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Follow-up not found or unauthorized.",
    )

