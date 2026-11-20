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


def test_list_opportunities_success():
    """Authenticated dealer should list buyer group opportunities in territory."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/opportunities", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 5

    # Check structure and calculation of remaining slots
    for opp in data:
        assert "id" in opp
        assert "group_code" in opp
        assert "model_name" in opp
        assert "brand_name" in opp
        assert "city" in opp
        assert "status" in opp
        assert "min_members_threshold" in opp
        assert "max_capacity" in opp
        assert "current_members_count" in opp
        assert "remaining_slots" in opp
        assert opp["remaining_slots"] == max(0, opp["max_capacity"] - opp["current_members_count"])
        assert "requirements" in opp
        assert "preferred_variants" in opp["requirements"]
        assert "preferred_colours" in opp["requirements"]
        assert "fuel_types" in opp["requirements"]
        assert "transmissions" in opp["requirements"]


def test_search_opportunities():
    """Verifies search across vehicle model, group code, and RTO circle."""
    token = get_token("owner@kalyanimotors.com")

    # Search by model
    res = client.get("/api/v1/opportunities?search=Brezza", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    for opp in res.json()["data"]:
        assert "brezza" in opp["model_name"].lower()

    # Search by group code
    res_code = client.get("/api/v1/opportunities?search=GD-BLR-GV-02", headers={"Authorization": f"Bearer {token}"})
    assert res_code.status_code == 200
    assert len(res_code.json()["data"]) == 1
    assert res_code.json()["data"][0]["group_code"] == "GD-BLR-GV-02"

    # Search by RTO circle
    res_rto = client.get("/api/v1/opportunities?search=KA-03", headers={"Authorization": f"Bearer {token}"})
    assert res_rto.status_code == 200
    for opp in res_rto.json()["data"]:
        assert "KA-03" in opp["rto_circle"]


def test_filter_opportunities():
    """Verifies multi-dimensional filters: vehicle, variant, city, status, offer_status."""
    token = get_token("owner@kalyanimotors.com")

    # Filter by vehicle
    res_v = client.get("/api/v1/opportunities?vehicle=Grand+Vitara", headers={"Authorization": f"Bearer {token}"})
    assert res_v.status_code == 200
    for opp in res_v.json()["data"]:
        assert "Grand Vitara" in opp["model_name"]

    # Filter by variant
    res_var = client.get("/api/v1/opportunities?variant=ZXi", headers={"Authorization": f"Bearer {token}"})
    assert res_var.status_code == 200
    for opp in res_var.json()["data"]:
        assert any("ZXi" in v for v in opp["requirements"]["preferred_variants"])

    # Filter by city
    res_city = client.get("/api/v1/opportunities?city=Bengaluru", headers={"Authorization": f"Bearer {token}"})
    assert res_city.status_code == 200
    for opp in res_city.json()["data"]:
        assert opp["city"] == "Bengaluru"

    # Filter by group lifecycle status
    res_status = client.get("/api/v1/opportunities?status=OPEN_FOR_QUOTES", headers={"Authorization": f"Bearer {token}"})
    assert res_status.status_code == 200
    for opp in res_status.json()["data"]:
        assert opp["status"] == "OPEN_FOR_QUOTES"

    # Filter by offer status
    res_offer = client.get("/api/v1/opportunities?offer_status=INTEREST_EXPRESSED", headers={"Authorization": f"Bearer {token}"})
    assert res_offer.status_code == 200
    for opp in res_offer.json()["data"]:
        assert opp["my_interest"] is not None
        assert opp["my_interest"]["status"] == "INTEREST_EXPRESSED"


def test_get_opportunity_detail():
    """Verifies detailed view of an opportunity with purchasing timeline and requirements."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/opportunities/grp-blr-brz-04", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    opp = res.json()["data"]

    assert opp["id"] == "grp-blr-brz-04"
    assert opp["group_code"] == "GD-BLR-BRZ-04"
    assert opp["min_members_threshold"] == 3
    assert opp["max_capacity"] == 10
    assert opp["current_members_count"] == 7
    assert opp["remaining_slots"] == 3
    assert opp["target_delivery_window_days"] == 20
    assert "quoting_deadline" in opp
    assert "expiry_at" in opp

    reqs = opp["requirements"]
    assert "delivery_timeline_preference" in reqs
    assert "preferred_variants" in reqs
    assert "preferred_colours" in reqs
    assert "fuel_types" in reqs
    assert "transmissions" in reqs
    assert "financing_mix" in reqs
    assert "accessory_preferences" in reqs
    assert "delivery_location" in reqs

    # Non-existent opportunity returns 404
    res_404 = client.get("/api/v1/opportunities/grp-invalid-999", headers={"Authorization": f"Bearer {token}"})
    assert res_404.status_code == 404


def test_privacy_rule_no_customer_pii():
    """
    CRITICAL PRIVACY TEST:
    Verifies that group opportunities expose ONLY aggregated collective demand.
    No customer names, phone numbers, email addresses, or personal accounts may be leaked.
    """
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/opportunities", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    pii_forbidden_keys = [
        "customer_name", "customer_phone", "customer_email", "phone", "email",
        "user_id", "passwords", "aadhaar", "pan_number", "customer_address"
    ]

    for opp in res.json()["data"]:
        for key in pii_forbidden_keys:
            assert key not in opp, f"Leaked PII key '{key}' found in opportunity {opp.get('id')}"


def test_submit_dealer_interest_by_sales_manager():
    """Sales Manager is authorized to submit dealership interest."""
    token = get_token("salesmgr@kalyanimotors.com")

    payload = {
        "branch_id": "br-whitefield-01",
        "estimated_delivery_days": 18,
        "stock_allocation_commitment": 5,
        "proposed_benefits": "Complimentary ceramic coating and OEM accessories package worth INR 15,000.",
        "terms_and_conditions": "Valid for delivery within 18 days of group lock.",
        "initial_response_notes": "5 units reserved at Whitefield stockyard."
    }

    res = client.post(
        "/api/v1/opportunities/grp-blr-gv-02/interest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["group_id"] == "grp-blr-gv-02"
    assert data["status"] == "INTEREST_EXPRESSED"
    assert data["stock_allocation_commitment"] == 5
    assert data["estimated_delivery_days"] == 18
    assert data["dealer_id"] == "dlr-kalyani-blr-001"

    # Verify opportunity now reflects my_interest
    res_detail = client.get(
        "/api/v1/opportunities/grp-blr-gv-02",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_detail.status_code == 200
    my_interest = res_detail.json()["data"]["my_interest"]
    assert my_interest is not None
    assert my_interest["status"] == "INTEREST_EXPRESSED"


def test_submit_dealer_interest_sales_executive_forbidden():
    """Sales Executive must be blocked from submitting interest with 403 Forbidden."""
    token = get_token("salesexec@kalyanimotors.com")

    payload = {
        "branch_id": "br-whitefield-01",
        "estimated_delivery_days": 15,
        "stock_allocation_commitment": 3,
        "proposed_benefits": "Standard offer",
    }

    res = client.post(
        "/api/v1/opportunities/grp-blr-swf-09/interest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()


def test_update_negotiation_activity():
    """Authorized dealer staff can update negotiation terms and commitments."""
    token = get_token("owner@kalyanimotors.com")

    # Update negotiation on grp-blr-brz-04
    payload = {
        "status": "UNDER_NEGOTIATION",
        "estimated_delivery_days": 12,
        "stock_allocation_commitment": 8,
        "proposed_benefits": "Upgraded package: Priority depot delivery within 12 days + INR 20,000 accessory kit.",
        "negotiation_notes": "Customer demand revised: agreeing to expedite allocation."
    }

    res = client.put(
        "/api/v1/opportunities/grp-blr-brz-04/negotiation",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "UNDER_NEGOTIATION"
    assert data["estimated_delivery_days"] == 12
    assert data["stock_allocation_commitment"] == 8


def test_withdraw_dealer_interest():
    """Authorized dealer staff can withdraw an offer."""
    token = get_token("owner@kalyanimotors.com")

    payload = {
        "reason": "Depot inventory reallocated to commercial fleet client."
    }

    res = client.patch(
        "/api/v1/opportunities/grp-blr-gv-02/withdraw",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "WITHDRAWN"


def test_competitor_isolation_private_terms():
    """
    CRITICAL COMPETITOR ISOLATION TEST:
    Dealer A (Kalyani Motors) must NEVER see Dealer B's (Advaith Hyundai) private offers or notes.
    """
    # 1. Kalyani Motors checks grp-blr-brz-04
    token_kalyani = get_token("owner@kalyanimotors.com")
    res_kalyani = client.get(
        "/api/v1/opportunities/grp-blr-brz-04",
        headers={"Authorization": f"Bearer {token_kalyani}"}
    )
    assert res_kalyani.status_code == 200
    my_interest_kalyani = res_kalyani.json()["data"]["my_interest"]
    assert my_interest_kalyani is not None
    assert my_interest_kalyani["dealer_id"] == "dlr-kalyani-blr-001"
    assert "Confidential rival terms" not in str(my_interest_kalyani)

    # 2. Check audit history as Kalyani Motors
    res_hist = client.get(
        "/api/v1/opportunities/grp-blr-brz-04/history",
        headers={"Authorization": f"Bearer {token_kalyani}"}
    )
    assert res_hist.status_code == 200
    for entry in res_hist.json()["data"]:
        assert entry["dealer_id"] == "dlr-kalyani-blr-001"
        assert "Advaith" not in entry["details"]
        assert "Rival dealer" not in entry["details"]

    # 3. Advaith Hyundai checks same opportunity
    token_advaith = get_token("sunil@advaithhyundai.com")
    res_advaith = client.get(
        "/api/v1/opportunities/grp-blr-brz-04",
        headers={"Authorization": f"Bearer {token_advaith}"}
    )
    assert res_advaith.status_code == 200
    my_interest_advaith = res_advaith.json()["data"]["my_interest"]
    assert my_interest_advaith is not None
    assert my_interest_advaith["dealer_id"] == "dlr-advaith-blr-002"
    assert "Prerana" not in str(my_interest_advaith)
    assert "Kalyani" not in str(my_interest_advaith)


def test_opportunities_summary_stats():
    """Tests summary KPI statistics endpoint."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/opportunities/summary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    stats = res.json()["data"]
    assert "total_opportunities" in stats
    assert "open_for_response" in stats
    assert "target_threshold_reached" in stats
    assert "my_active_responses" in stats
    assert "proposals_under_negotiation" in stats
    assert stats["total_opportunities"] >= 5

