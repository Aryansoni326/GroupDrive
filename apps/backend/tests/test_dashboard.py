import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def get_auth_token(email: str = "owner@kalyanimotors.com") -> str:
    res = client.post(
        "/api/v1/auth/login-password",
        json={"email": email, "password": "Password@123"}
    )
    assert res.status_code == 200
    return res.json()["data"]["access_token"]

def test_dashboard_summary_dealer_owner():
    token = get_auth_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True

    data = body["data"]
    metrics = data["metrics"]
    # Check all 7 required summary metrics
    assert "total_enquiries" in metrics
    assert "new_leads" in metrics
    assert "follow_ups_due" in metrics
    assert "active_opportunities" in metrics
    assert "available_inventory" in metrics
    assert "pending_quotations" in metrics
    assert "group_purchasing_opportunities" in metrics

    # Check sections data presence
    assert len(data["tasks"]) > 0
    assert len(data["recent_enquiries"]) > 0
    assert len(data["upcoming_follow_ups"]) > 0
    assert len(data["recent_activities"]) > 0
    assert data["inventory_summary"]["total_vehicles"] > 0
    assert len(data["latest_group_opportunities"]) > 0
    assert len(data["recent_quotations"]) > 0
    assert len(data["sales_performance"]) > 0

def test_dashboard_branch_manager_scope():
    token = get_auth_token("branchmgr@kalyanimotors.com")
    res = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]

    # Branch manager's assigned branch is Whitefield
    assert data["role_context"]["branch_id"] == "br-whitefield-01"
    # All returned enquiries should belong strictly to Whitefield branch
    for enq in data["recent_enquiries"]:
        assert enq["branch_id"] == "br-whitefield-01"

def test_dashboard_sales_executive_personal_view():
    token = get_auth_token("salesexec@kalyanimotors.com")
    res = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]

    # Sales executive is Amit Patel (usr-amit-04)
    staff_id = data["role_context"]["staff_id"]
    assert staff_id == "usr-amit-04"

    # Enquiries returned should be assigned to Amit Patel
    for enq in data["recent_enquiries"]:
        assert enq["assigned_to_id"] == staff_id

    # Follow-ups returned should be assigned to Amit Patel
    for flw in data["upcoming_follow_ups"]:
        assert flw["assigned_to_id"] == staff_id

def test_dashboard_inventory_manager_view():
    token = get_auth_token("inventorymgr@kalyanimotors.com")
    res = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]

    # Inventory manager should receive inventory metrics and Hosur stockyard context
    inv = data["inventory_summary"]
    assert inv["total_vehicles"] > 0
    assert "in_stock" in inv
    assert "aging_units" in inv

def test_dashboard_finance_executive_view():
    token = get_auth_token("financemgr@kalyanimotors.com")
    res = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]

    # Finance executive is Deepa Rao
    assert data["role_context"]["staff_id"] == "usr-deepa-06"
    assert len(data["recent_quotations"]) >= 0

def test_dashboard_multi_tenant_isolation():
    # Authenticate as Sunil Reddy (Advaith Hyundai)
    token_advaith = get_auth_token("sunil@advaithhyundai.com")
    res_advaith = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token_advaith}"})
    assert res_advaith.status_code == 200
    data_advaith = res_advaith.json()["data"]

    # Advaith enquiries must strictly belong to Advaith Hyundai
    for enq in data_advaith["recent_enquiries"]:
        assert enq["dealer_id"] == "dlr-advaith-blr-002"

    # Authenticate as Kalyani Motors Dealer Owner
    token_kalyani = get_auth_token("owner@kalyanimotors.com")
    res_kalyani = client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token_kalyani}"})
    assert res_kalyani.status_code == 200
    data_kalyani = res_kalyani.json()["data"]

    # Kalyani dashboard must never contain Advaith records
    for enq in data_kalyani["recent_enquiries"]:
        assert enq["dealer_id"] == "dlr-kalyani-blr-001"
        assert enq["dealer_id"] != "dlr-advaith-blr-002"

def test_dashboard_update_task_status():
    token = get_auth_token("owner@kalyanimotors.com")
    res = client.patch(
        "/api/v1/dashboard/tasks/tsk-001/status",
        json={"status": "DONE"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "DONE"

def test_dashboard_update_follow_up_status():
    token = get_auth_token("owner@kalyanimotors.com")
    res = client.patch(
        "/api/v1/dashboard/follow-ups/flw-001/status",
        json={"status": "COMPLETED"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "COMPLETED"

