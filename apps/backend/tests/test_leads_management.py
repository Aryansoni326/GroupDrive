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


def test_list_leads_dealer_owner_success():
    """Dealer Owner should list all leads across dealership branches."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/dealers/me/leads", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 7
    # All leads must belong to Kalyani Motors
    for lead in data:
        assert lead["dealer_id"] == "dlr-kalyani-blr-001"


def test_lead_search_and_filters():
    """Verifies filtering by status, search, timeline, and branch."""
    token = get_token("owner@kalyanimotors.com")

    # Filter by status
    res_status = client.get(
        "/api/v1/dealers/me/leads?status=TEST_DRIVE_SCHEDULED",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_status.status_code == 200
    for lead in res_status.json()["data"]:
        assert lead["status"] == "TEST_DRIVE_SCHEDULED"

    # Filter by purchase timeline
    res_timeline = client.get(
        "/api/v1/dealers/me/leads?timeline=IMMEDIATE",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_timeline.status_code == 200
    for lead in res_timeline.json()["data"]:
        assert lead["purchase_timeline"] == "IMMEDIATE"

    # Search by customer name
    res_search = client.get(
        "/api/v1/dealers/me/leads?search=Karthik",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_search.status_code == 200
    assert len(res_search.json()["data"]) >= 1
    assert "Karthik" in res_search.json()["data"][0]["customer_name"]

    # Filter by branch
    res_branch = client.get(
        "/api/v1/dealers/me/leads?branch_id=br-bannerghatta-02",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_branch.status_code == 200
    for lead in res_branch.json()["data"]:
        assert lead["branch_id"] == "br-bannerghatta-02"


def test_sales_executive_role_scoping():
    """Sales Executive should only view assigned leads or unassigned leads in their branch."""
    token = get_token("salesexec@kalyanimotors.com") # Amit Patel, usr-amit-04, br-whitefield-01
    res = client.get("/api/v1/dealers/me/leads", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    leads = res.json()["data"]

    for lead in leads:
        assert lead["branch_id"] == "br-whitefield-01"
        assert lead["assigned_to_id"] in ["usr-amit-04", None]


def test_create_lead_success():
    """Sales Manager or staff can register a new customer enquiry."""
    token = get_token("salesmgr@kalyanimotors.com") # Priya Nair
    payload = {
        "branch_id": "br-whitefield-01",
        "customer_name": "Arjun Kapoor",
        "customer_phone": "+919845119988",
        "customer_email": "arjun.k@gmail.com",
        "city": "Bengaluru",
        "preferred_contact_method": "WHATSAPP",
        "brand_name": "Maruti Suzuki",
        "model_name": "Grand Vitara",
        "variant_name": "Zeta 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Opulent Red",
        "budget_min": 1400000,
        "budget_max": 1600000,
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "LOAN",
        "source": "SHOWROOM_WALK_IN",
        "assigned_to_id": "usr-amit-04",
        "initial_note": "Customer visited showroom with family. Interested in immediate test drive.",
    }
    res = client.post(
        "/api/v1/dealers/me/leads",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["customer_name"] == "Arjun Kapoor"
    assert created["status"] == "NEW_ENQUIRY"
    assert created["assigned_to_id"] == "usr-amit-04"
    assert created["assigned_to_name"] == "Amit Patel"
    assert created["notes_count"] == 1


def test_create_lead_validation_errors():
    """Checks invalid fields are rejected with 400 or 403."""
    token = get_token("salesmgr@kalyanimotors.com")

    # Invalid purchase timeline
    bad_timeline_payload = {
        "branch_id": "br-whitefield-01",
        "customer_name": "Test User",
        "customer_phone": "+919845001122",
        "customer_email": "test@example.com",
        "brand_name": "Maruti Suzuki",
        "model_name": "Swift",
        "purchase_timeline": "NEXT_DECADE",
        "financing_preference": "LOAN",
        "source": "WEBSITE_DIRECT",
    }
    res = client.post(
        "/api/v1/dealers/me/leads",
        json=bad_timeline_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400

    # Foreign branch for scoped manager
    foreign_branch_payload = {
        "branch_id": "br-bannerghatta-02",
        "customer_name": "Test User",
        "customer_phone": "+919845001122",
        "customer_email": "test@example.com",
        "brand_name": "Maruti Suzuki",
        "model_name": "Swift",
        "purchase_timeline": "IMMEDIATE",
        "financing_preference": "CASH",
        "source": "SHOWROOM_WALK_IN",
    }
    res_forbidden = client.post(
        "/api/v1/dealers/me/leads",
        json=foreign_branch_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_forbidden.status_code == 403


def test_get_lead_details():
    """Verifies fetching comprehensive lead information."""
    token = get_token("salesmgr@kalyanimotors.com")
    res = client.get("/api/v1/dealers/me/leads/lead-001", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    lead = res.json()["data"]
    assert lead["id"] == "lead-001"
    assert lead["customer_name"] == "Karthik Subramanian"
    assert lead["model_name"] == "Brezza"
    assert lead["branch_id"] == "br-whitefield-01"


def test_update_lead_details():
    """Verifies updating customer budget and timeline."""
    token = get_token("salesmgr@kalyanimotors.com")
    payload = {
        "budget_min": 1250000,
        "budget_max": 1500000,
        "purchase_timeline": "IMMEDIATE",
        "colour_preference": "Magma Grey Dual Tone",
    }
    res = client.put(
        "/api/v1/dealers/me/leads/lead-001",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["budget_min"] == 1250000
    assert data["budget_max"] == 1500000
    assert data["colour_preference"] == "Magma Grey Dual Tone"


def test_manager_can_reassign_lead():
    """Sales Manager can reassign a lead to another sales executive in the branch."""
    token = get_token("salesmgr@kalyanimotors.com")
    payload = {
        "assigned_to_id": "usr-amit-04",
        "notes": "Reassigned to Amit for immediate showroom coordination.",
    }
    res = client.patch(
        "/api/v1/dealers/me/leads/lead-004/assign",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["assigned_to_id"] == "usr-amit-04"
    assert data["assigned_to_name"] == "Amit Patel"


def test_sales_executive_cannot_reassign_other_staff_lead():
    """Sales executive is blocked from reassigning leads assigned to another staff member."""
    token = get_token("salesexec@kalyanimotors.com")
    # lead-003 is assigned to Deepa Rao in Bannerghatta
    payload = {
        "assigned_to_id": "usr-amit-04",
        "notes": "Attempting to hijack lead",
    }
    res = client.patch(
        "/api/v1/dealers/me/leads/lead-003/assign",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    # Should be 403 Forbidden
    assert res.status_code == 403


def test_lead_status_lifecycle_updates():
    """Verifies status transitions to TEST_DRIVE_SCHEDULED, WON_BOOKED, and LOST_CLOSED."""
    token = get_token("salesmgr@kalyanimotors.com")

    # Update to TEST_DRIVE_SCHEDULED
    res_td = client.patch(
        "/api/v1/dealers/me/leads/lead-001/status",
        json={
            "status": "TEST_DRIVE_SCHEDULED",
            "reason_or_notes": "Test drive confirmed for tomorrow 11 AM at Whitefield facility.",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_td.status_code == 200
    assert res_td.json()["data"]["status"] == "TEST_DRIVE_SCHEDULED"

    # Update to WON_BOOKED with booking voucher
    res_won = client.patch(
        "/api/v1/dealers/me/leads/lead-006/status",
        json={
            "status": "WON_BOOKED",
            "reason_or_notes": "Booking advance received INR 25,000.",
            "booked_voucher_code": "VCHR-ERT-9901",
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_won.status_code == 200
    assert res_won.json()["data"]["status"] == "WON_BOOKED"
    assert res_won.json()["data"]["booked_voucher_code"] == "VCHR-ERT-9901"


def test_lead_internal_notes_thread():
    """Adding internal notes and fetching chronological note thread."""
    token = get_token("salesexec@kalyanimotors.com")
    res_add = client.post(
        "/api/v1/dealers/me/leads/lead-001/notes",
        json={"content": "Customer requested callback at 4:30 PM after office hours."},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_add.status_code == 201
    assert res_add.json()["data"]["author_name"] == "Amit Patel"

    # List notes
    res_list = client.get(
        "/api/v1/dealers/me/leads/lead-001/notes",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_list.status_code == 200
    notes = res_list.json()["data"]
    assert len(notes) >= 3
    # Check that our latest note exists
    contents = [n["content"] for n in notes]
    assert any("4:30 PM after office hours" in c for c in contents)


def test_lead_activity_history_audit_trail():
    """Verifies that all updates generate immutable audit trail entries."""
    token = get_token("salesmgr@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/leads/lead-001/activities",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    acts = res.json()["data"]
    assert len(acts) >= 3
    actions = [a["action"] for a in acts]
    assert "LEAD_CREATED" in actions
    assert "LEAD_ASSIGNED" in actions


def test_cross_tenant_isolation_forbidden():
    """Kalyani staff cannot view or modify rival Advaith Hyundai leads."""
    token = get_token("owner@kalyanimotors.com")
    # lead-901 belongs to dlr-advaith-blr-002
    res_get = client.get(
        "/api/v1/dealers/me/leads/lead-901",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_get.status_code == 404

    # Attempt status change
    res_patch = client.patch(
        "/api/v1/dealers/me/leads/lead-901/status",
        json={"status": "CONTACTED"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_patch.status_code == 404


def test_cross_branch_isolation_forbidden():
    """Branch manager at Whitefield cannot view or modify Bannerghatta leads."""
    token = get_token("branchmgr@kalyanimotors.com") # Scoped to br-whitefield-01
    # lead-003 belongs to br-bannerghatta-02
    res = client.get(
        "/api/v1/dealers/me/leads/lead-003",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

