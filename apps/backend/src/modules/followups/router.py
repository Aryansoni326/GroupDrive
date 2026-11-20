from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from src.core.dependencies import get_current_dealer_staff, verify_branch_isolation
from src.core.identity_store import BRANCHES_DB, USERS_DB
from src.core.followups_store import (
    FOLLOW_UP_TYPES,
    FOLLOW_UP_PRIORITIES,
    FOLLOW_UP_STATUSES,
    APPOINTMENT_TYPES,
    APPOINTMENT_STATUSES,
    APPOINTMENT_OUTCOMES,
    query_follow_ups,
    get_follow_up_by_id,
    create_follow_up,
    update_follow_up,
    complete_follow_up,
    reschedule_follow_up,
    query_appointments,
    get_appointment_by_id,
    create_appointment,
    reschedule_appointment,
    cancel_appointment,
    complete_appointment,
    get_follow_up_summary,
)

router = APIRouter(prefix="/dealers/me", tags=["Follow-ups & Appointments"])

# Pydantic Schemas

class CreateFollowUpRequest(BaseModel):
    branch_id: str = Field(..., description="Showroom branch ID")
    lead_id: Optional[str] = None
    enquiry_id: Optional[str] = None
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_email: Optional[EmailStr] = None
    interested_model: Optional[str] = None
    scheduled_at: str = Field(..., description="ISO 8601 datetime for due date")
    follow_up_type: str = Field("CALL", description="CALL, TEST_DRIVE, HOME_VISIT, DOCUMENTATION, PAYMENT, SHOWROOM_VISIT")
    priority: str = Field("MEDIUM", description="HIGH, MEDIUM, LOW")
    assigned_to_id: Optional[str] = None
    notes: str = Field(..., min_length=2, max_length=1000)
    reminder_minutes_before: Optional[int] = Field(None, ge=5, le=1440)


class UpdateFollowUpRequest(BaseModel):
    scheduled_at: Optional[str] = None
    follow_up_type: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[str] = None
    notes: Optional[str] = None
    reminder_minutes_before: Optional[int] = None
    status: Optional[str] = None
    completion_notes: Optional[str] = None


class RescheduleFollowUpRequest(BaseModel):
    scheduled_at: str = Field(..., description="New ISO 8601 datetime")
    notes: Optional[str] = None


class CompleteFollowUpRequest(BaseModel):
    completion_notes: str = Field(..., min_length=2, max_length=1000)


class AssignFollowUpRequest(BaseModel):
    assigned_to_id: str = Field(..., min_length=3)
    notes: Optional[str] = None


class CreateAppointmentRequest(BaseModel):
    branch_id: str = Field(..., description="Showroom branch ID")
    lead_id: Optional[str] = None
    enquiry_id: Optional[str] = None
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    customer_email: Optional[EmailStr] = None
    interested_model: Optional[str] = None
    appointment_type: str = Field("SHOWROOM_VISIT")
    appointment_time: str = Field(..., description="ISO 8601 datetime for appointment")
    duration_minutes: Optional[int] = Field(45, ge=15, le=240)
    assigned_to_id: Optional[str] = None
    notes: Optional[str] = None


class RescheduleAppointmentRequest(BaseModel):
    appointment_time: str = Field(..., description="New ISO 8601 datetime")
    reschedule_reason: str = Field(..., min_length=2, max_length=500)


class CancelAppointmentRequest(BaseModel):
    cancel_reason: str = Field(..., min_length=2, max_length=500)


class CompleteAppointmentRequest(BaseModel):
    visit_outcome: str = Field(..., description="TEST_DRIVE_TAKEN, BOOKING_CONFIRMED, QUOTATION_ISSUED, FOLLOW_UP_REQUIRED, NOT_INTERESTED, NO_SHOW")
    outcome_notes: str = Field(..., min_length=2, max_length=1000)


# Summary Metrics Endpoint
@router.get("/follow-ups/summary", response_model=Dict[str, Any])
async def get_summary_metrics(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Returns aggregated summary metrics for follow-ups and tasks."""
    dealer_id = current_staff["dealer_id"]
    user_id = current_staff["id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    branch_id = current_staff.get("branch_id")

    summary = get_follow_up_summary(dealer_id, user_id, role, branch_id)
    return {
        "success": True,
        "data": summary,
    }


# Follow-up Endpoints

@router.get("/follow-ups", response_model=Dict[str, Any])
async def list_follow_ups(
    bucket: Optional[str] = Query(None, description="today, overdue, upcoming, completed, all"),
    branch_id: Optional[str] = Query(None, description="Filter by showroom branch"),
    assigned_to_id: Optional[str] = Query(None, description="Filter by assigned staff or 'unassigned'"),
    follow_up_type: Optional[str] = Query(None, description="CALL, TEST_DRIVE, HOME_VISIT, DOCUMENTATION, PAYMENT, SHOWROOM_VISIT"),
    priority: Optional[str] = Query(None, description="HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="PENDING, COMPLETED, OVERDUE, CANCELLED"),
    lead_id: Optional[str] = Query(None, description="Filter by linked lead"),
    search: Optional[str] = Query(None, description="Search customer name, phone, notes"),
    scope: str = Query("my", description="'my' for assigned to self, 'team' for dealership/branch"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Lists customer follow-ups categorized by today, overdue, upcoming, or completed,
    with personal vs team task separation.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_id = current_staff["id"]
    user_branch_id = current_staff.get("branch_id")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if branch_id and branch_id != "all" and branch_id != user_branch_id:
            verify_branch_isolation(branch_id, current_staff)

    follow_ups = query_follow_ups(
        dealer_id=dealer_id,
        branch_id=branch_id,
        bucket=bucket,
        assigned_to_id=assigned_to_id,
        follow_up_type=follow_up_type,
        priority=priority,
        status=status,
        lead_id=lead_id,
        search=search,
        user_role=role,
        user_id=user_id,
        user_branch_id=user_branch_id,
        scope=scope,
    )

    return {
        "success": True,
        "data": follow_ups,
        "meta": {
            "total_records": len(follow_ups),
            "bucket": bucket or "all",
            "scope": scope,
        },
    }


@router.post("/follow-ups", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_new_follow_up(
    payload: CreateFollowUpRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Creates a new customer follow-up. Enforces duplicate check and branch boundaries.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    # Validate branch
    target_branch = BRANCHES_DB.get(payload.branch_id)
    if not target_branch or target_branch.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branch '{payload.branch_id}' does not belong to authorized dealership.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if payload.branch_id != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot schedule follow-ups for branches outside your assigned showroom.",
            )

    if payload.follow_up_type not in FOLLOW_UP_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid follow-up type '{payload.follow_up_type}'. Allowed: {', '.join(FOLLOW_UP_TYPES)}",
        )

    if payload.priority not in FOLLOW_UP_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority '{payload.priority}'. Allowed: {', '.join(FOLLOW_UP_PRIORITIES)}",
        )

    # Sales executive can only assign to self
    if role == "SALES_EXECUTIVE" and payload.assigned_to_id and payload.assigned_to_id != current_staff["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sales executives can only assign follow-ups to themselves.",
        )

    try:
        new_flw = create_follow_up(payload.model_dump(), current_staff)
        return {
            "success": True,
            "data": new_flw,
            "message": "Follow-up scheduled successfully.",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/follow-ups/{follow_up_id}", response_model=Dict[str, Any])
async def get_follow_up_details(
    follow_up_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Retrieves full details of a follow-up."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    flw = get_follow_up_by_id(follow_up_id, dealer_id)
    if not flw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found or unauthorized.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if flw.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to follow-up from another branch.",
            )

    return {
        "success": True,
        "data": flw,
    }


@router.put("/follow-ups/{follow_up_id}", response_model=Dict[str, Any])
async def update_follow_up_item(
    follow_up_id: str,
    payload: UpdateFollowUpRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Updates attributes of a follow-up."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    flw = get_follow_up_by_id(follow_up_id, dealer_id)
    if not flw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found or unauthorized.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if flw.get("branch_id") != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify follow-up from another branch.",
            )

    if role == "SALES_EXECUTIVE":
        if flw.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        if flw.get("assigned_to_id") and flw.get("assigned_to_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit follow-ups assigned to you.",
            )

    updated = update_follow_up(follow_up_id, payload.model_dump(exclude_unset=True), current_staff)
    return {
        "success": True,
        "data": updated,
        "message": "Follow-up updated successfully.",
    }


@router.patch("/follow-ups/{follow_up_id}/reschedule", response_model=Dict[str, Any])
async def reschedule_follow_up_item(
    follow_up_id: str,
    payload: RescheduleFollowUpRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Reschedules a follow-up due date."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    flw = get_follow_up_by_id(follow_up_id, dealer_id)
    if not flw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found.")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if flw.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Branch mismatch.")

    if role == "SALES_EXECUTIVE":
        if flw.get("assigned_to_id") and flw.get("assigned_to_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot reschedule other staff tasks.")

    rescheduled = reschedule_follow_up(follow_up_id, payload.scheduled_at, payload.notes, current_staff)
    return {
        "success": True,
        "data": rescheduled,
        "message": "Follow-up rescheduled successfully.",
    }


@router.patch("/follow-ups/{follow_up_id}/complete", response_model=Dict[str, Any])
async def complete_follow_up_item(
    follow_up_id: str,
    payload: CompleteFollowUpRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Marks a follow-up as completed with customer outcome notes."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    flw = get_follow_up_by_id(follow_up_id, dealer_id)
    if not flw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found.")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if flw.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Branch mismatch.")

    if role == "SALES_EXECUTIVE":
        if flw.get("assigned_to_id") and flw.get("assigned_to_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot complete other staff tasks.")

    completed = complete_follow_up(follow_up_id, payload.completion_notes, current_staff)
    return {
        "success": True,
        "data": completed,
        "message": "Follow-up marked as completed.",
    }


@router.patch("/follow-ups/{follow_up_id}/assign", response_model=Dict[str, Any])
async def assign_follow_up_item(
    follow_up_id: str,
    payload: AssignFollowUpRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Assigns or reassigns a follow-up task. Enforces manager authorization."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    flw = get_follow_up_by_id(follow_up_id, dealer_id)
    if not flw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found.")

    if role == "SALES_EXECUTIVE":
        if flw.get("assigned_to_id") is not None and flw.get("assigned_to_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sales executives cannot reassign follow-ups assigned to other staff.",
            )
        if payload.assigned_to_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sales executives can only claim follow-ups for themselves.",
            )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if flw.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign outside branch.")

    # Target user verification
    target_user = None
    for u in USERS_DB.values():
        if u.get("id") == payload.assigned_to_id and u.get("dealer_id") == dealer_id:
            target_user = u
            break

    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target staff member not found.")

    flw["assigned_to_id"] = payload.assigned_to_id
    flw["assigned_to_name"] = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()
    if payload.notes:
        flw["notes"] = f"{flw.get('notes', '')}\n[Assignment]: {payload.notes.strip()}".strip()

    return {
        "success": True,
        "data": flw,
        "message": f"Follow-up assigned to {flw['assigned_to_name']}.",
    }


# Appointment Endpoints

@router.get("/appointments", response_model=Dict[str, Any])
async def list_appointments(
    bucket: Optional[str] = Query(None, description="today, upcoming, past, all"),
    branch_id: Optional[str] = Query(None, description="Filter by showroom branch"),
    assigned_to_id: Optional[str] = Query(None, description="Filter by assigned staff"),
    appointment_type: Optional[str] = Query(None, description="SHOWROOM_VISIT, TEST_DRIVE, etc."),
    status: Optional[str] = Query(None, description="SCHEDULED, CONFIRMED, COMPLETED, RESCHEDULED, CANCELLED, NO_SHOW"),
    lead_id: Optional[str] = Query(None, description="Filter by linked lead"),
    search: Optional[str] = Query(None, description="Search customer name, phone, notes"),
    scope: str = Query("my", description="'my' for self, 'team' for branch/dealership"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Lists showroom visit and test drive appointments with date filtering and role scoping.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_id = current_staff["id"]
    user_branch_id = current_staff.get("branch_id")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if branch_id and branch_id != "all" and branch_id != user_branch_id:
            verify_branch_isolation(branch_id, current_staff)

    appointments = query_appointments(
        dealer_id=dealer_id,
        branch_id=branch_id,
        bucket=bucket,
        assigned_to_id=assigned_to_id,
        appointment_type=appointment_type,
        status=status,
        lead_id=lead_id,
        search=search,
        user_role=role,
        user_id=user_id,
        user_branch_id=user_branch_id,
        scope=scope,
    )

    return {
        "success": True,
        "data": appointments,
        "meta": {
            "total_records": len(appointments),
            "bucket": bucket or "all",
            "scope": scope,
        },
    }


@router.post("/appointments", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_new_appointment(
    payload: CreateAppointmentRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Schedules a showroom visit or test drive appointment.
    """
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    target_branch = BRANCHES_DB.get(payload.branch_id)
    if not target_branch or target_branch.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Branch '{payload.branch_id}' does not belong to authorized dealership.",
        )

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if payload.branch_id != user_branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot schedule appointments for branches outside your showroom.",
            )

    if payload.appointment_type not in APPOINTMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid appointment type '{payload.appointment_type}'. Allowed: {', '.join(APPOINTMENT_TYPES)}",
        )

    try:
        new_app = create_appointment(payload.model_dump(), current_staff)
        return {
            "success": True,
            "data": new_app,
            "message": "Appointment scheduled successfully.",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/appointments/{appointment_id}", response_model=Dict[str, Any])
async def get_appointment_details(
    appointment_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Fetches details of an appointment."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")

    app = get_appointment_by_id(appointment_id, dealer_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER", "SALES_EXECUTIVE"] and user_branch_id:
        if app.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return {
        "success": True,
        "data": app,
    }


@router.patch("/appointments/{appointment_id}/reschedule", response_model=Dict[str, Any])
async def reschedule_appointment_item(
    appointment_id: str,
    payload: RescheduleAppointmentRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Reschedules an appointment time with reason."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    app = get_appointment_by_id(appointment_id, dealer_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if app.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Branch mismatch.")

    if role == "SALES_EXECUTIVE":
        if app.get("assigned_to_id") and app.get("assigned_to_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot reschedule other staff appointments.")

    rescheduled = reschedule_appointment(appointment_id, payload.appointment_time, payload.reschedule_reason, current_staff)
    return {
        "success": True,
        "data": rescheduled,
        "message": "Appointment rescheduled successfully.",
    }


@router.patch("/appointments/{appointment_id}/cancel", response_model=Dict[str, Any])
async def cancel_appointment_item(
    appointment_id: str,
    payload: CancelAppointmentRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Cancels an appointment with reason."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    app = get_appointment_by_id(appointment_id, dealer_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if app.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Branch mismatch.")

    if role == "SALES_EXECUTIVE":
        if app.get("assigned_to_id") and app.get("assigned_to_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel other staff appointments.")

    cancelled = cancel_appointment(appointment_id, payload.cancel_reason, current_staff)
    return {
        "success": True,
        "data": cancelled,
        "message": "Appointment cancelled.",
    }


@router.patch("/appointments/{appointment_id}/complete", response_model=Dict[str, Any])
async def complete_appointment_item(
    appointment_id: str,
    payload: CompleteAppointmentRequest,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """Records the visit outcome and completes appointment."""
    dealer_id = current_staff["dealer_id"]
    role = current_staff.get("staff_role", "SALES_EXECUTIVE")
    user_branch_id = current_staff.get("branch_id")
    user_id = current_staff["id"]

    app = get_appointment_by_id(appointment_id, dealer_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if role in ["BRANCH_MANAGER", "SALES_MANAGER"] and user_branch_id:
        if app.get("branch_id") != user_branch_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Branch mismatch.")

    if role == "SALES_EXECUTIVE":
        if app.get("assigned_to_id") and app.get("assigned_to_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot complete other staff appointments.")

    if payload.visit_outcome not in APPOINTMENT_OUTCOMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid visit outcome '{payload.visit_outcome}'. Allowed: {', '.join(APPOINTMENT_OUTCOMES)}",
        )

    completed = complete_appointment(appointment_id, payload.visit_outcome, payload.outcome_notes, current_staff)
    return {
        "success": True,
        "data": completed,
        "message": "Appointment completed with visit outcome recorded.",
    }

