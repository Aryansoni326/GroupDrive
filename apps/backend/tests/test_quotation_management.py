import pytest
from datetime import datetime, timezone, timedelta
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


def test_calculate_quote_pricing_formula():
    """Verifies backend pricing calculation precision and automatic TCS computation."""
    token = get_token("owner@kalyanimotors.com")

    # Vehicle with ex-showroom > 10L (triggers 1% TCS)
    payload = {
        "ex_showroom_price": 1200000,
        "rto_road_tax": 168000,
        "insurance_amount": 42000,
        "fastag_charges": 500,
        "accessories_amount": 15000,
        "extended_warranty_amount": 18000,
        "other_charges": 2500,
        "dealer_discount": 30000,
        "manufacturer_offer": 20000,
        "exchange_bonus": 10000,
    }

    res = client.post(
        "/api/v1/dealers/me/quotations/calculate",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]

    # TCS should be 1% of 12,00,000 = 12,000
    assert data["tcs_amount"] == 12000

    # Gross: 1200000 + 168000 + 42000 + 500 + 12000 + 15000 + 18000 + 2500 = 1458000
    expected_gross = 1200000 + 168000 + 42000 + 500 + 12000 + 15000 + 18000 + 2500
    assert data["gross_on_road_price"] == expected_gross

    # Discounts: 30000 + 20000 + 10000 = 60000
    expected_discounts = 30000 + 20000 + 10000
    assert data["total_discounts"] == expected_discounts

    # Final on-road: Gross - Discounts = 1398000
    expected_final = expected_gross - expected_discounts
    assert data["final_on_road_price"] == expected_final


def test_calculate_pricing_validation_errors():
    """Verifies monetary validation rules: non-negative amounts, discount caps."""
    token = get_token("owner@kalyanimotors.com")

    # Ex-showroom <= 0
    res_zero = client.post(
        "/api/v1/dealers/me/quotations/calculate",
        json={"ex_showroom_price": 0},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_zero.status_code == 422

    # Negative accessory amount
    res_neg = client.post(
        "/api/v1/dealers/me/quotations/calculate",
        json={"ex_showroom_price": 800000, "accessories_amount": -5000},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_neg.status_code == 422

    # Total discounts exceeding ex-showroom price
    res_excess = client.post(
        "/api/v1/dealers/me/quotations/calculate",
        json={"ex_showroom_price": 500000, "dealer_discount": 600000},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_excess.status_code == 422
    assert "cannot exceed" in res_excess.json()["detail"].lower()


def test_list_quotations_and_filters():
    """Verifies listing quotations, branch filtering, status filtering, and search."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/dealers/me/quotations", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 3

    # All returned quotations belong to Kalyani Motors
    for q in data:
        assert q["dealer_id"] == "dlr-kalyani-blr-001"
        assert "pricing" in q
        assert "final_on_road_price" in q["pricing"]

    # Filter by status = DRAFT
    res_draft = client.get(
        "/api/v1/dealers/me/quotations?status=DRAFT",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_draft.status_code == 200
    for q in res_draft.json()["data"]:
        assert q["quotation_status"] == "DRAFT"

    # Search by model
    res_search = client.get(
        "/api/v1/dealers/me/quotations?search=Swift",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_search.status_code == 200
    assert len(res_search.json()["data"]) >= 1
    assert "Swift" in res_search.json()["data"][0]["model_name"]


def test_create_quotation_linked_to_enquiry():
    """Verifies creating a quotation linked to a customer enquiry (lead)."""
    token = get_token("salesmgr@kalyanimotors.com")

    payload = {
        "branch_id": "br-whitefield-01",
        "lead_id": "lead-002",
        "customer_name": "Ananya Deshmukh",
        "customer_phone": "+919845223344",
        "customer_email": "ananya.d@outlook.com",
        "customer_city": "Bengaluru",
        "model_id": "mod-swift-01",
        "model_name": "Maruti Suzuki Swift 2026",
        "variant_id": "var-swf-zxi-mt",
        "variant_name": "ZXi 1.2L 5MT",
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "colour": "Sizzling Red",
        "ex_showroom_price": 829000,
        "rto_road_tax": 116060,
        "insurance_amount": 32500,
        "fastag_charges": 500,
        "accessories_amount": 10000,
        "extended_warranty_amount": 12000,
        "dealer_discount": 15000,
        "manufacturer_offer": 10000,
        "delivery_timeline_days": 12,
        "dealership_terms": "Standard showroom offer. Includes free floor mats.",
        "status": "SUBMITTED",
    }

    res = client.post(
        "/api/v1/dealers/me/quotations",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    quote = res.json()["data"]

    assert quote["quotation_number"].startswith("GD-QTE-2026-")
    assert quote["lead_id"] == "lead-002"
    assert quote["customer_name"] == "Ananya Deshmukh"
    assert quote["quotation_status"] == "SUBMITTED"
    assert quote["version"] == 1
    assert quote["pricing"]["final_on_road_price"] > 0
    assert quote["dealer_id"] == "dlr-kalyani-blr-001"
    assert len(quote["history"]) >= 1


def test_create_and_update_quotation_revision():
    """Verifies creating a quotation, revising pricing, and incrementing version."""
    token = get_token("owner@kalyanimotors.com")

    # 1. Create Draft
    create_payload = {
        "branch_id": "br-whitefield-01",
        "customer_name": "Kiran Kumar",
        "model_id": "mod-brezza-01",
        "model_name": "Maruti Suzuki Brezza",
        "variant_id": "var-brz-zxi",
        "variant_name": "ZXi 1.5L 5MT",
        "ex_showroom_price": 1114000,
        "dealer_discount": 20000,
        "delivery_timeline_days": 14,
        "status": "DRAFT",
    }
    res_create = client.post(
        "/api/v1/dealers/me/quotations",
        json=create_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_create.status_code == 201
    created_quote = res_create.json()["data"]
    quote_id = created_quote["id"]
    assert created_quote["quotation_status"] == "DRAFT"
    assert created_quote["version"] == 1

    # 2. Submit Draft
    res_submit = client.patch(
        f"/api/v1/dealers/me/quotations/{quote_id}/submit",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_submit.status_code == 200
    assert res_submit.json()["data"]["quotation_status"] == "SUBMITTED"

    # 3. Revise Quotation with additional discount
    update_payload = {
        "dealer_discount": 35000,
        "accessories_amount": 8000,
        "revision_notes": "Upgraded discount to match competitor deal."
    }
    res_update = client.put(
        f"/api/v1/dealers/me/quotations/{quote_id}",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_update.status_code == 200
    updated_quote = res_update.json()["data"]

    # Status transitions to REVISED and version increments to 2
    assert updated_quote["version"] == 2
    assert updated_quote["quotation_status"] == "REVISED"
    assert updated_quote["pricing"]["dealer_discount"] == 35000


def test_locked_quotation_prevents_modification():
    """BUSINESS RULE: Accepted quotations are locked for fulfillment and cannot be altered."""
    token = get_token("owner@kalyanimotors.com")

    # Target quote qte-blr-gv-003 is ACCEPTED
    payload = {
        "dealer_discount": 99000,
        "revision_notes": "Attempting unauthorized alteration of accepted quote"
    }

    res = client.put(
        "/api/v1/dealers/me/quotations/qte-blr-gv-003",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "cannot be modified" in res.json()["detail"].lower()


def test_cancel_quotation_and_authorization():
    """Verifies cancelling quotation with reason and role restrictions."""
    token_owner = get_token("owner@kalyanimotors.com")
    token_se = get_token("salesexec@kalyanimotors.com")

    # 1. Sales Executive cannot cancel quotation (403 Forbidden)
    res_se = client.patch(
        "/api/v1/dealers/me/quotations/qte-blr-swf-001/cancel",
        json={"reason": "Customer changed mind"},
        headers={"Authorization": f"Bearer {token_se}"}
    )
    assert res_se.status_code == 403

    # 2. Dealer Owner can cancel
    res_owner = client.patch(
        "/api/v1/dealers/me/quotations/qte-blr-swf-001/cancel",
        json={"reason": "Customer opted for different vehicle class"},
        headers={"Authorization": f"Bearer {token_owner}"}
    )
    assert res_owner.status_code == 200
    assert res_owner.json()["data"]["quotation_status"] == "CANCELLED_BY_DEALER"


def test_cross_tenant_quotation_isolation():
    """CRITICAL SECURITY: Dealers must never access or modify rival quotations."""
    token_kalyani = get_token("owner@kalyanimotors.com")
    token_advaith = get_token("sunil@advaithhyundai.com")

    # Kalyani cannot view Advaith's quotation qte-mum-crt-rival -> 403 Forbidden
    res = client.get(
        "/api/v1/dealers/me/quotations/qte-mum-crt-rival",
        headers={"Authorization": f"Bearer {token_kalyani}"}
    )
    assert res.status_code == 403

    # Advaith can view own quotation
    res_advaith = client.get(
        "/api/v1/dealers/me/quotations/qte-mum-crt-rival",
        headers={"Authorization": f"Bearer {token_advaith}"}
    )
    assert res_advaith.status_code == 200
    assert res_advaith.json()["data"]["dealer_id"] == "dlr-advaith-blr-002"


def test_quotation_history_audit_trail():
    """Verifies chronological audit trail of all quotation revisions and status updates."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/quotations/qte-blr-gv-003/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    history = res.json()["data"]
    assert len(history) >= 1
    assert "timestamp" in history[0]
    assert "action" in history[0]
    assert "actor_name" in history[0]


def test_quotations_summary_statistics():
    """Verifies KPI pipeline summary statistics."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/quotations/summary",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    stats = res.json()["data"]
    assert "total_quotations" in stats
    assert "draft_count" in stats
    assert "submitted_count" in stats
    assert "accepted_count" in stats
    assert "total_pipeline_value" in stats
    assert stats["total_quotations"] >= 3

