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

def test_list_staff_members_by_owner_success():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/dealers/me/staff", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 7
    # All staff must belong to Kalyani Motors
    for staff in data:
        assert staff["dealer_id"] == "dlr-kalyani-blr-001"

def test_staff_filtering_and_search():
    token = get_token("owner@kalyanimotors.com")

    # Filter by role
    res_role = client.get(
        "/api/v1/dealers/me/staff?role=SALES_EXECUTIVE",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_role.status_code == 200
    for staff in res_role.json()["data"]:
        assert staff["staff_role"] == "SALES_EXECUTIVE"

    # Filter by branch
    res_branch = client.get(
        "/api/v1/dealers/me/staff?branch_id=br-whitefield-01",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_branch.status_code == 200
    for staff in res_branch.json()["data"]:
        assert staff["branch_id"] == "br-whitefield-01"

    # Search filter
    res_search = client.get(
        "/api/v1/dealers/me/staff?search=Amit",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_search.status_code == 200
    names = [s["first_name"] for s in res_search.json()["data"]]
    assert "Amit" in names

def test_owner_can_invite_staff():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "first_name": "Rohan",
        "last_name": "Gupta",
        "email": "rohan.gupta@kalyanimotors.com",
        "phone_number": "+919845099881",
        "staff_role": "SALES_EXECUTIVE",
        "branch_id": "br-bannerghatta-02",
        "designation": "Sales Consultant",
    }
    res = client.post(
        "/api/v1/dealers/me/staff/invite",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["email"] == "rohan.gupta@kalyanimotors.com"
    assert data["invitation_status"] == "INVITED"
    assert data["branch_name"] == "Bannerghatta Flagship Showroom"

def test_branch_manager_can_invite_staff_to_own_branch():
    token = get_token("branchmgr@kalyanimotors.com") # Rajesh Sharma (Whitefield branch)
    payload = {
        "first_name": "Kiran",
        "last_name": "Desai",
        "email": "kiran.desai@kalyanimotors.com",
        "phone_number": "+919845099882",
        "staff_role": "SALES_EXECUTIVE",
        "branch_id": "br-whitefield-01",
        "designation": "Junior Consultant",
    }
    res = client.post(
        "/api/v1/dealers/me/staff/invite",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["email"] == "kiran.desai@kalyanimotors.com"
    assert data["branch_id"] == "br-whitefield-01"

def test_prevent_branch_manager_escalating_to_dealer_owner_or_bm():
    token = get_token("branchmgr@kalyanimotors.com")
    payload = {
        "first_name": "Malicious",
        "last_name": "Actor",
        "email": "malicious.owner@kalyanimotors.com",
        "phone_number": "+919845099883",
        "staff_role": "DEALER_OWNER",
        "branch_id": "br-whitefield-01",
        "designation": "Co-Owner",
    }
    res = client.post(
        "/api/v1/dealers/me/staff/invite",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403
    assert "Branch Managers cannot invite dealer owners" in res.json()["detail"]

def test_prevent_branch_manager_inviting_to_other_branch():
    token = get_token("branchmgr@kalyanimotors.com")
    payload = {
        "first_name": "Other",
        "last_name": "BranchStaff",
        "email": "other.branch@kalyanimotors.com",
        "phone_number": "+919845099884",
        "staff_role": "SALES_EXECUTIVE",
        "branch_id": "br-bannerghatta-02", # Not Whitefield
        "designation": "Sales Consultant",
    }
    res = client.post(
        "/api/v1/dealers/me/staff/invite",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403
    assert "Branch Managers can only invite staff to their assigned branch" in res.json()["detail"]

def test_non_management_cannot_invite_staff():
    token = get_token("salesexec@kalyanimotors.com")
    payload = {
        "first_name": "Unauthorized",
        "last_name": "User",
        "email": "unauth@kalyanimotors.com",
        "phone_number": "+919845099885",
        "staff_role": "SALES_EXECUTIVE",
        "branch_id": "br-whitefield-01",
        "designation": "Consultant",
    }
    res = client.post(
        "/api/v1/dealers/me/staff/invite",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

def test_update_staff_profile_and_role():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "designation": "Lead Operations Specialist",
        "phone_number": "+919845044999",
    }
    res = client.put(
        "/api/v1/dealers/me/staff/usr-amit-04",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["designation"] == "Lead Operations Specialist"
    assert data["phone_number"] == "+919845044999"

def test_branch_manager_cannot_modify_other_branch_staff():
    token = get_token("branchmgr@kalyanimotors.com") # Scoped to Whitefield
    payload = {
        "designation": "Hacked Title",
    }
    # usr-deepa-06 is assigned to Bannerghatta branch
    res = client.put(
        "/api/v1/dealers/me/staff/usr-deepa-06",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403
    assert "Branch Managers can only manage staff within their assigned branch" in res.json()["detail"]

def test_branch_manager_cannot_modify_dealer_owner():
    token = get_token("branchmgr@kalyanimotors.com")
    payload = {
        "designation": "Demoted",
    }
    # usr-vikram-01 is Dealer Owner
    res = client.put(
        "/api/v1/dealers/me/staff/usr-vikram-01",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

def test_activate_and_deactivate_staff():
    token = get_token("owner@kalyanimotors.com")

    # Deactivate staff
    res_deact = client.patch(
        "/api/v1/dealers/me/staff/usr-amit-04/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_deact.status_code == 200
    assert res_deact.json()["data"]["is_active"] is False

    # Reactivate staff
    res_act = client.patch(
        "/api/v1/dealers/me/staff/usr-amit-04/status",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_act.status_code == 200
    assert res_act.json()["data"]["is_active"] is True

def test_dealer_owner_cannot_deactivate_self():
    token = get_token("owner@kalyanimotors.com")
    res = client.patch(
        "/api/v1/dealers/me/staff/usr-vikram-01/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "cannot deactivate your own primary" in res.json()["detail"]

def test_resend_and_revoke_staff_invitation():
    token = get_token("owner@kalyanimotors.com")

    # Resend invite to usr-rahul-08
    res_resend = client.post(
        "/api/v1/dealers/me/staff/usr-rahul-08/resend-invite",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_resend.status_code == 200
    assert res_resend.json()["data"]["invitation_status"] == "INVITED"

    # Revoke invite for usr-rahul-08
    res_revoke = client.post(
        "/api/v1/dealers/me/staff/usr-rahul-08/revoke-invite",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_revoke.status_code == 200
    assert res_revoke.json()["data"]["invitation_status"] == "INVITATION_REVOKED"
    assert res_revoke.json()["data"]["is_active"] is False

def test_cross_dealer_staff_access_isolation():
    # Kalyani Motors Owner attempting to access Advaith Hyundai staff
    token = get_token("owner@kalyanimotors.com")
    # usr-sunil-07 belongs to Advaith Hyundai
    res_get = client.get(
        "/api/v1/dealers/me/staff/usr-sunil-07",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_get.status_code == 403
    assert "belongs to a different dealership" in res_get.json()["detail"]

    # Attempt to modify rival dealer staff
    res_mod = client.put(
        "/api/v1/dealers/me/staff/usr-sunil-07",
        json={"designation": "Hacked"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_mod.status_code == 403

def test_get_staff_activity_logs():
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/staff-activities",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 4
    for log in data:
        assert log["dealer_id"] == "dlr-kalyani-blr-001"
        assert "actor_name" in log
        assert "action" in log
        assert "timestamp" in log

