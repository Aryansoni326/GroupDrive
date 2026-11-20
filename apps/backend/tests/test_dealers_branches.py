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

def test_get_dealer_profile_success():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/dealers/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["id"] == "dlr-kalyani-blr-001"
    assert data["legal_entity_name"] == "Kalyani Motors Private Limited"
    assert data["kyc_status"] == "VERIFIED"

def test_update_dealer_profile_by_owner_success():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "trade_name": "Kalyani Motors Maruti Suzuki Updated",
        "primary_contact_phone": "+919845019999",
        "website_url": "https://www.kalyanimotors-updated.com",
    }
    res = client.put("/api/v1/dealers/me", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["trade_name"] == "Kalyani Motors Maruti Suzuki Updated"
    assert data["primary_contact_phone"] == "+919845019999"

def test_prevent_unauthorized_modification_of_kyc_status():
    token = get_token("owner@kalyanimotors.com")
    # Even Dealer Owner cannot modify their own KYC verification status
    payload = {
        "kyc_status": "SUPER_VERIFIED_HACK",
    }
    res = client.put("/api/v1/dealers/me", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "KYC verification status can only be updated by Platform Administration" in res.json()["detail"]

def test_non_owner_cannot_update_dealer_profile():
    # Sales Executive attempting to update dealership profile
    token = get_token("salesexec@kalyanimotors.com")
    payload = {
        "trade_name": "Unauthorized Name Change",
    }
    res = client.put("/api/v1/dealers/me", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_get_branches_listing():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/dealers/me/branches", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    branches = res.json()["data"]
    assert len(branches) >= 3
    for b in branches:
        assert b["dealer_id"] == "dlr-kalyani-blr-001"

def test_owner_can_create_new_branch():
    token = get_token("owner@kalyanimotors.com")
    new_branch_payload = {
        "branch_name": "Koramangala Delivery Hub",
        "branch_type": "SHOWROOM_ONLY",
        "address_line1": "100 Feet Road, 4th Block",
        "address_line2": "Koramangala",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560034",
        "authorized_rto_codes": ["KA-01"],
        "phone_number": "+918025531122",
        "email": "koramangala@kalyanimotors.com",
        "operating_hours": "09:30 AM - 08:00 PM (Mon - Sun)",
        "is_active": True,
    }
    res = client.post("/api/v1/dealers/me/branches", json=new_branch_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["branch_name"] == "Koramangala Delivery Hub"
    assert created["dealer_id"] == "dlr-kalyani-blr-001"
    assert "KA-01" in created["authorized_rto_codes"]

def test_non_owner_cannot_create_branch():
    token = get_token("branchmgr@kalyanimotors.com")
    payload = {
        "branch_name": "Illegal Branch",
        "branch_type": "SHOWROOM_ONLY",
        "address_line1": "Street 1",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560001",
        "authorized_rto_codes": ["KA-01"],
        "phone_number": "+918022223333",
    }
    res = client.post("/api/v1/dealers/me/branches", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_branch_manager_can_update_own_branch():
    # Branch manager of Whitefield (usr-rajesh-02, br-whitefield-01)
    token = get_token("branchmgr@kalyanimotors.com")
    payload = {
        "operating_hours": "10:00 AM - 07:00 PM (Special Timing)",
    }
    res = client.put("/api/v1/dealers/me/branches/br-whitefield-01", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["operating_hours"] == "10:00 AM - 07:00 PM (Special Timing)"

def test_branch_manager_cannot_update_other_branch():
    # Branch manager of Whitefield attempts to modify Bannerghatta branch
    token = get_token("branchmgr@kalyanimotors.com")
    payload = {
        "operating_hours": "Hacked Hours",
    }
    res = client.put("/api/v1/dealers/me/branches/br-bannerghatta-02", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "You can only manage your assigned showroom branch" in res.json()["detail"]

def test_owner_can_toggle_branch_status():
    token = get_token("owner@kalyanimotors.com")
    # Deactivate
    res_deactivate = client.patch(
        "/api/v1/dealers/me/branches/br-whitefield-01/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_deactivate.status_code == 200
    assert res_deactivate.json()["data"]["is_active"] is False

    # Reactivate
    res_activate = client.patch(
        "/api/v1/dealers/me/branches/br-whitefield-01/status",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_activate.status_code == 200
    assert res_activate.json()["data"]["is_active"] is True

def test_cross_tenant_branch_access_isolation():
    # Advaith Hyundai staff attempts to access Kalyani Motors branch
    token_advaith = get_token("sunil@advaithhyundai.com")
    res = client.get("/api/v1/dealers/me/branches/br-whitefield-01", headers={"Authorization": f"Bearer {token_advaith}"})
    assert res.status_code == 404 # Not found within their dealership

