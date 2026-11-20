import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def get_token(email: str = "owner@kalyanimotors.com") -> str:
    res = client.post(
        "/api/v1/auth/login-password",
        json={"email": email, "password": "Password@123"}
    )
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_list_follow_ups_by_bucket():
    """Tests filtering follow-ups by today, overdue, upcoming, and completed."""
    token = get_token("owner@kalyanimotors.com")

    # Today's follow-ups
    res_today = client.get(
        "/api/v1/dealers/me/follow-ups?bucket=today&scope=team",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_today.status_code == 200
    today_items = res_today.json()["data"]
    assert len(today_items) >= 2

    # Overdue follow-ups
    res_overdue = client.get(
        "/api/v1/dealers/me/follow-ups?bucket=overdue&scope=team",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_overdue.status_code == 200
    overdue_items = res_overdue.json()["data"]
    assert len(overdue_items) >= 1

    # Completed follow-ups
    res_completed = client.get(
        "/api/v1/dealers/me/follow-ups?bucket=completed&scope=team",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_completed.status_code == 200
    for item in res_completed.json()["data"]:
        assert item["status"] == "COMPLETED"


def test_follow_ups_my_vs_team_scope():
    """Sales executive only sees personal tasks with scope=my."""
    exec_token = get_token("salesexec@kalyanimotors.com") # usr-amit-04

    # My scope
    res_my = client.get(
        "/api/v1/dealers/me/follow-ups?scope=my",
        headers={"Authorization": f"Bearer {exec_token}"}
    )
    assert res_my.status_code == 200
    for flw in res_my.json()["data"]:
        assert flw["assigned_to_id"] == "usr-amit-04"


def test_create_follow_up_with_reminder():
    """Tests follow-up creation with reminder and lead linkage."""
    token = get_token("salesmgr@kalyanimotors.com")
    payload = {
        "branch_id": "br-whitefield-01",
        "lead_id": "lead-001",
        "customer_name": "Karthik Subramanian",
        "customer_phone": "+919845112233",
        "customer_email": "karthik.s@gmail.com",
        "interested_model": "Maruti Suzuki Brezza",
        "scheduled_at": "2026-11-10T11:00:00Z",
        "follow_up_type": "CALL",
        "priority": "HIGH",
        "assigned_to_id": "usr-amit-04",
        "notes": "Follow up on accessory package pricing and extended warranty.",
        "reminder_minutes_before": 30,
    }
    res = client.post(
        "/api/v1/dealers/me/follow-ups",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["customer_name"] == "Karthik Subramanian"
    assert data["priority"] == "HIGH"
    assert data["reminder_minutes_before"] == 30
    assert data["reminder_at"] == "2026-11-10T10:30:00+00:00"


def test_duplicate_follow_up_prevention():
    """Attempting to schedule duplicate follow-up for same customer at exact time is rejected."""
    token = get_token("salesmgr@kalyanimotors.com")
    # Same payload twice
    payload = {
        "branch_id": "br-whitefield-01",
        "customer_name": "Duplicate Test Customer",
        "customer_phone": "+919845999111",
        "scheduled_at": "2026-11-12T10:00:00Z",
        "follow_up_type": "CALL",
        "priority": "MEDIUM",
        "notes": "First attempt",
    }
    res1 = client.post(
        "/api/v1/dealers/me/follow-ups",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res1.status_code == 201

    # Second identical attempt
    res2 = client.post(
        "/api/v1/dealers/me/follow-ups",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res2.status_code == 400
    assert "already scheduled" in res2.json()["detail"]


def test_reschedule_follow_up():
    """Tests rescheduling follow-up to new datetime."""
    token = get_token("salesmgr@kalyanimotors.com")
    res = client.patch(
        "/api/v1/dealers/me/follow-ups/flw-001/reschedule",
        json={
            "scheduled_at": "2026-11-07T16:00:00Z",
            "notes": "Customer busy in meeting until 4 PM.",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["scheduled_at"] == "2026-11-07T16:00:00Z"
    assert "busy in meeting" in data["notes"]


def test_complete_follow_up_with_notes():
    """Tests completing follow-up with customer conversation notes."""
    token = get_token("salesexec@kalyanimotors.com")
    res = client.patch(
        "/api/v1/dealers/me/follow-ups/flw-002/complete",
        json={"completion_notes": "Test drive successful. Customer loved Swift automatic steering."},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "COMPLETED"
    assert "Test drive successful" in data["completion_notes"]


def test_sales_executive_cannot_reassign_other_staff_follow_up():
    """Sales executive cannot reassign someone else's follow-up."""
    exec_token = get_token("salesexec@kalyanimotors.com")
    # flw-003 is assigned to Deepa Rao
    res = client.patch(
        "/api/v1/dealers/me/follow-ups/flw-003/assign",
        json={"assigned_to_id": "usr-amit-04"},
        headers={"Authorization": f"Bearer {exec_token}"}
    )
    assert res.status_code == 403


def test_schedule_and_list_appointment():
    """Tests scheduling a showroom visit appointment and retrieving by bucket."""
    token = get_token("salesmgr@kalyanimotors.com")
    payload = {
        "branch_id": "br-whitefield-01",
        "lead_id": "lead-001",
        "customer_name": "Sunil Varma",
        "customer_phone": "+919845123987",
        "customer_email": "sunil.v@gmail.com",
        "interested_model": "Maruti Suzuki Grand Vitara",
        "appointment_type": "SHOWROOM_VISIT",
        "appointment_time": "2026-11-10T14:30:00Z",
        "duration_minutes": 60,
        "assigned_to_id": "usr-amit-04",
        "notes": "Wants to test drive strong hybrid variant on highway.",
    }
    res = client.post(
        "/api/v1/dealers/me/appointments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["status"] == "SCHEDULED"
    assert created["assigned_to_name"] == "Amit Patel"

    # List appointments for team
    res_list = client.get(
        "/api/v1/dealers/me/appointments?scope=team",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_list.status_code == 200
    assert len(res_list.json()["data"]) >= 4


def test_reschedule_and_cancel_appointment():
    """Tests rescheduling and cancelling showroom appointment."""
    token = get_token("salesmgr@kalyanimotors.com")

    # Reschedule
    res_resched = client.patch(
        "/api/v1/dealers/me/appointments/app-002/reschedule",
        json={
            "appointment_time": "2026-11-08T15:00:00Z",
            "reschedule_reason": "Customer requested afternoon slot due to personal travel.",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_resched.status_code == 200
    assert res_resched.json()["data"]["status"] == "RESCHEDULED"
    assert "afternoon slot" in res_resched.json()["data"]["reschedule_reason"]

    # Cancel
    res_cancel = client.patch(
        "/api/v1/dealers/me/appointments/app-005/cancel",
        json={"cancel_reason": "Customer cancelled visit due to medical emergency."},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_cancel.status_code == 200
    assert res_cancel.json()["data"]["status"] == "CANCELLED"


def test_complete_appointment_with_outcome():
    """Tests completing appointment and recording visit outcome."""
    token = get_token("salesexec@kalyanimotors.com")
    res = client.patch(
        "/api/v1/dealers/me/appointments/app-001/complete",
        json={
            "visit_outcome": "TEST_DRIVE_TAKEN",
            "outcome_notes": "Completed 15 km test drive. Customer satisfied, proceeding to loan sanction.",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "COMPLETED"
    assert data["visit_outcome"] == "TEST_DRIVE_TAKEN"


def test_follow_up_summary_metrics():
    """Tests aggregated dashboard counters for follow-ups and tasks."""
    token = get_token("salesmgr@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/follow-ups/summary",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert "today_count" in data
    assert "overdue_count" in data
    assert "upcoming_count" in data
    assert "completed_count" in data
    assert "my_tasks_count" in data
    assert "team_tasks_count" in data


def test_cross_tenant_isolation_forbidden():
    """Kalyani Motors staff cannot access rival Advaith Hyundai follow-ups or appointments."""
    token = get_token("owner@kalyanimotors.com")

    # Follow-up flw-901 belongs to dlr-advaith-blr-002
    res_flw = client.get(
        "/api/v1/dealers/me/follow-ups/flw-901",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_flw.status_code == 404

    # Appointment app-901 belongs to dlr-advaith-blr-002
    res_app = client.get(
        "/api/v1/dealers/me/appointments/app-901",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_app.status_code == 404

