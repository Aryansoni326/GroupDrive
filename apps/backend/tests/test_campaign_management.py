import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def get_token(email: str = "owner@kalyanimotors.com") -> str:
    res = client.post(
        "/api/v1/auth/login-password",
        json={"email": email, "password": "Password@123"},
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["data"]["access_token"]


def test_list_campaigns_and_status_filtering():
    """Verifies listing dealership campaigns and filtering by status."""
    token = get_token("owner@kalyanimotors.com")

    # List all campaigns
    res = client.get(
        "/api/v1/dealers/me/campaigns",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["count"] >= 4

    # Filter by ACTIVE
    res_active = client.get(
        "/api/v1/dealers/me/campaigns?status=ACTIVE",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_active.status_code == 200
    for c in res_active.json()["data"]:
        assert c["status"] == "ACTIVE"

    # Filter by EXPIRED
    res_exp = client.get(
        "/api/v1/dealers/me/campaigns?status=EXPIRED",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_exp.status_code == 200
    expired_items = res_exp.json()["data"]
    assert len(expired_items) >= 1
    for c in expired_items:
        assert c["status"] == "EXPIRED"


def test_dynamic_auto_expiry_enforcement():
    """Verifies that expired campaigns dynamically evaluate as EXPIRED and never appear active."""
    token = get_token("owner@kalyanimotors.com")

    res = client.get(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-004",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    campaign = res.json()["data"]
    # Ended in 2025, so status must be EXPIRED
    assert campaign["status"] == "EXPIRED"


def test_campaign_summary_metrics():
    """Verifies KPI summary metrics for dealership campaigns."""
    token = get_token("owner@kalyanimotors.com")

    res = client.get(
        "/api/v1/dealers/me/campaigns/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    summary = res.json()["data"]
    assert summary["total_campaigns"] >= 4
    assert summary["active_count"] >= 1
    assert summary["expired_count"] >= 1
    assert summary["total_enquiries_generated"] > 0
    assert summary["total_bookings_converted"] > 0


def test_create_campaign_success():
    """Verifies authorized creation of a new promotional campaign."""
    token = get_token("owner@kalyanimotors.com")

    start_date = datetime.now(timezone.utc).isoformat()
    end_date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

    payload = {
        "title": "Year-End Corporate Drive 2026",
        "description": "Exclusive IT corporate park group booking scheme with zero down payment options and accessory bundles.",
        "branch_id": "br-whitefield-01",
        "campaign_type": "ACCESSORY_BUNDLE",
        "eligible_models": ["Brezza", "Swift 2026"],
        "eligible_variants": ["ZXi"],
        "offer_details": {
            "discount_amount": 20000,
            "free_accessories_description": "Wireless charger and rear spoiler",
            "warranty_years": 3,
            "exchange_bonus_amount": 15000,
            "terms_and_conditions": "Valid for corporate ID card holders only.",
        },
        "valid_from": start_date,
        "valid_until": end_date,
        "is_active": True,
        "is_sponsored": True,
        "sponsored_label": "Corporate Spotlight",
    }

    res = client.post(
        "/api/v1/dealers/me/campaigns",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["title"] == "Year-End Corporate Drive 2026"
    assert created["status"] == "ACTIVE"
    assert created["is_sponsored"] is True
    assert created["campaign_code"].startswith("GD-CMP-")
    assert created["branch_name"] == "Whitefield Showroom and Delivery Centre"


def test_create_campaign_validation_errors():
    """Verifies that invalid dates and short descriptions are rejected."""
    token = get_token("owner@kalyanimotors.com")

    # End date before start date
    res = client.post(
        "/api/v1/dealers/me/campaigns",
        json={
            "title": "Invalid Date Scheme",
            "description": "Valid description length here for test.",
            "eligible_models": ["Brezza"],
            "valid_from": "2026-10-15T00:00:00Z",
            "valid_until": "2026-10-01T00:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 422
    assert "later than start date" in res.json()["detail"].lower()

    # Short title
    res_short = client.post(
        "/api/v1/dealers/me/campaigns",
        json={
            "title": "No",
            "description": "Valid description length for test.",
            "eligible_models": ["Brezza"],
            "valid_from": "2026-10-01T00:00:00Z",
            "valid_until": "2026-10-31T00:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_short.status_code == 422


def test_role_based_permissions_enforcement():
    """Verifies that Sales Executives are blocked with 403 Forbidden on write operations."""
    exec_token = get_token("salesexec@kalyanimotors.com")

    # Sales Executive attempting to create campaign
    res = client.post(
        "/api/v1/dealers/me/campaigns",
        json={
            "title": "Unauthorized Exec Campaign",
            "description": "This should be blocked by backend RBAC guard.",
            "eligible_models": ["Brezza"],
            "valid_from": "2026-10-01T00:00:00Z",
            "valid_until": "2026-10-31T00:00:00Z",
        },
        headers={"Authorization": f"Bearer {exec_token}"},
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

    # Sales Executive CAN read campaigns
    res_read = client.get(
        "/api/v1/dealers/me/campaigns",
        headers={"Authorization": f"Bearer {exec_token}"},
    )
    assert res_read.status_code == 200


def test_update_campaign_and_audit_history():
    """Verifies updating campaign details and appending an audit history log."""
    mgr_token = get_token("branchmgr@kalyanimotors.com")

    # Update Brezza offer discount amount
    update_payload = {
        "title": "Festive Season Brezza Super Flash Offer",
        "offer_details": {
            "discount_amount": 50000,
            "terms_and_conditions": "Revised discount amount of 50,000 INR.",
        },
        "revision_notes": "Increased festive discount to match competitor movement.",
    }

    res = client.put(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-001",
        json=update_payload,
        headers={"Authorization": f"Bearer {mgr_token}"},
    )
    assert res.status_code == 200
    updated = res.json()["data"]
    assert updated["title"] == "Festive Season Brezza Super Flash Offer"
    assert updated["offer_details"]["discount_amount"] == 50000

    # Verify audit history
    hist_res = client.get(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-001/history",
        headers={"Authorization": f"Bearer {mgr_token}"},
    )
    assert hist_res.status_code == 200
    logs = hist_res.json()["data"]
    assert len(logs) >= 2
    assert any("Increased festive discount" in log["details"] for log in logs)


def test_toggle_campaign_active_state():
    """Verifies pausing and reactivating a campaign, and blocking reactivation of expired campaigns."""
    token = get_token("owner@kalyanimotors.com")

    # Pause active campaign
    pause_res = client.patch(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-001/toggle",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert pause_res.status_code == 200
    assert pause_res.json()["data"]["status"] == "PAUSED"

    # Reactivate campaign
    act_res = client.patch(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-001/toggle",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert act_res.status_code == 200
    assert act_res.json()["data"]["status"] == "ACTIVE"

    # Attempt to activate expired campaign (must fail with 400 Bad Request)
    exp_res = client.patch(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-004/toggle",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert exp_res.status_code == 400
    assert "expired campaign" in exp_res.json()["detail"].lower()


def test_cross_tenant_isolation():
    """Verifies that Dealership A (Kalyani) cannot access or modify Dealership B (Advaith) campaigns."""
    kalyani_token = get_token("owner@kalyanimotors.com")
    advaith_token = get_token("sunil@advaithhyundai.com")

    # Kalyani cannot view Advaith campaign
    res = client.get(
        "/api/v1/dealers/me/campaigns/cmp-advaith-001",
        headers={"Authorization": f"Bearer {kalyani_token}"},
    )
    assert res.status_code == 403
    assert "another dealership" in res.json()["detail"].lower()

    # Advaith cannot modify Kalyani campaign
    res_mod = client.put(
        "/api/v1/dealers/me/campaigns/cmp-kalyani-001",
        json={"title": "Hacked Title"},
        headers={"Authorization": f"Bearer {advaith_token}"},
    )
    assert res_mod.status_code == 403


def test_admin_campaign_protection():
    """Verifies that platform admin campaigns are read-only for dealerships and cannot be modified."""
    token = get_token("owner@kalyanimotors.com")

    # View admin campaign is allowed
    res = client.get(
        "/api/v1/dealers/me/campaigns/cmp-admin-national-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["origin"] == "GROUPDRIVE_ADMIN"

    # Attempt to edit admin campaign must fail with 403 Forbidden
    res_edit = client.put(
        "/api/v1/dealers/me/campaigns/cmp-admin-national-01",
        json={"title": "Dealer Modified OEM Scheme"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_edit.status_code == 403
    assert "cannot be edited" in res_edit.json()["detail"].lower()

    # Attempt to toggle admin campaign must fail with 403 Forbidden
    res_toggle = client.patch(
        "/api/v1/dealers/me/campaigns/cmp-admin-national-01/toggle",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_toggle.status_code == 403

