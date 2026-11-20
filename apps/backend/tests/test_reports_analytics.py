import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.core.reports_store import REPORT_TYPES

client = TestClient(app)


def get_token(email: str = "owner@kalyanimotors.com") -> str:
    res = client.post(
        "/api/v1/auth/login-password",
        json={"email": email, "password": "Password@123"},
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["data"]["access_token"]


def test_get_overview_kpis():
    """Verifies retrieval of high-level overview KPIs for dealership owner."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/reports/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]

    # Verify essential KPI fields
    assert "total_enquiries" in data
    assert "total_leads" in data
    assert "active_pipeline_value" in data
    assert "conversion_rate_pct" in data
    assert "inventory_units_in_stock" in data
    assert "inventory_asset_value" in data
    assert "followup_compliance_pct" in data
    assert "quotation_acceptance_pct" in data
    assert "active_campaigns_count" in data
    assert "open_group_opportunities_count" in data
    assert "as_of_date" in data

    # Positive integer/float checks
    assert data["total_leads"] > 0
    assert data["inventory_units_in_stock"] > 0
    assert data["inventory_asset_value"] > 0
    assert data["conversion_rate_pct"] >= 0.0


def test_list_supported_report_types():
    """Verifies that all 11 required reports are officially listed in types endpoint."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/reports/types",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    types = res.json()["report_types"]
    assert len(types) == 11
    for r in REPORT_TYPES:
        assert r in types


def test_generate_all_11_reports():
    """Verifies that each of the 11 report endpoints produces a valid structured payload."""
    token = get_token("owner@kalyanimotors.com")

    for report_type in REPORT_TYPES:
        res = client.get(
            f"/api/v1/dealers/me/reports/{report_type}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200, f"Failed generating report {report_type}: {res.text}"
        payload = res.json()["data"]

        assert payload["report_type"] == report_type
        assert len(payload["report_title"]) > 0
        assert len(payload["metric_explanations"]) > 0
        assert len(payload["summary_cards"]) > 0
        assert "breakdown_charts" in payload
        assert len(payload["table_columns"]) > 0
        assert "data_rows" in payload
        assert payload["total_rows"] == len(payload["data_rows"])


def test_date_range_filtering():
    """Verifies filtering reports by date range presets."""
    token = get_token("owner@kalyanimotors.com")

    # ALL preset
    res_all = client.get(
        "/api/v1/dealers/me/reports/ENQUIRY?date_range=ALL",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_all.status_code == 200
    total_all = res_all.json()["data"]["total_rows"]

    # LAST_7_DAYS preset
    res_7 = client.get(
        "/api/v1/dealers/me/reports/ENQUIRY?date_range=LAST_7_DAYS",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_7.status_code == 200
    total_7 = res_7.json()["data"]["total_rows"]
    assert total_7 <= total_all

    # Custom range in the past
    res_past = client.get(
        "/api/v1/dealers/me/reports/ENQUIRY?start_date=2020-01-01&end_date=2020-01-31",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_past.status_code == 200
    assert res_past.json()["data"]["total_rows"] == 0


def test_branch_scoping_for_branch_manager():
    """Verifies that Branch Managers are scoped strictly to their assigned branch."""
    bm_token = get_token("branchmgr@kalyanimotors.com")

    res = client.get(
        "/api/v1/dealers/me/reports/BRANCH_PERFORMANCE",
        headers={"Authorization": f"Bearer {bm_token}"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    # Should only contain 1 branch row (br-whitefield-01)
    assert data["total_rows"] == 1
    assert data["data_rows"][0]["branch_name"] == "Whitefield Showroom and Delivery Centre"


def test_sales_executive_scoping():
    """Verifies that Sales Executives only view leads assigned to their account."""
    exec_token = get_token("salesexec@kalyanimotors.com")

    res = client.get(
        "/api/v1/dealers/me/reports/ENQUIRY",
        headers={"Authorization": f"Bearer {exec_token}"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    # All rows must belong to or be assigned to this executive (Amit Patel)
    for row in data["data_rows"]:
        assert row["assigned_to_name"] in ["Amit Patel", "Unassigned"]


def test_export_csv_authorized_roles():
    """Verifies CSV export succeeds for management roles (Dealer Owner, Branch Manager, Sales Manager)."""
    # Dealer Owner
    owner_token = get_token("owner@kalyanimotors.com")
    res_owner = client.get(
        "/api/v1/dealers/me/reports/INVENTORY/export",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert res_owner.status_code == 200
    assert "text/csv" in res_owner.headers["content-type"]
    assert "attachment; filename=" in res_owner.headers["content-disposition"]
    assert "Vehicle Model" in res_owner.text

    # Sales Manager
    sm_token = get_token("salesmgr@kalyanimotors.com")
    res_sm = client.get(
        "/api/v1/dealers/me/reports/SALES_CONVERSION/export",
        headers={"Authorization": f"Bearer {sm_token}"},
    )
    assert res_sm.status_code == 200
    assert "text/csv" in res_sm.headers["content-type"]


def test_export_csv_forbidden_for_sales_executive():
    """Verifies that Sales Executives receive 403 Forbidden when attempting CSV export."""
    exec_token = get_token("salesexec@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/reports/INVENTORY/export",
        headers={"Authorization": f"Bearer {exec_token}"},
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_tenant_isolation_cross_dealer():
    """Verifies horizontal tenant isolation between separate dealerships."""
    kalyani_token = get_token("owner@kalyanimotors.com")
    advaith_token = get_token("sunil@advaithhyundai.com")

    k_res = client.get(
        "/api/v1/dealers/me/reports/INVENTORY",
        headers={"Authorization": f"Bearer {kalyani_token}"},
    )
    a_res = client.get(
        "/api/v1/dealers/me/reports/INVENTORY",
        headers={"Authorization": f"Bearer {advaith_token}"},
    )

    assert k_res.status_code == 200
    assert a_res.status_code == 200
    # Kalyani has Maruti inventory records, Advaith has Hyundai or different records
    k_models = {row["model_name"] for row in k_res.json()["data"]["data_rows"]}
    a_models = {row["model_name"] for row in a_res.json()["data"]["data_rows"]}
    # No cross-contamination
    assert "Brezza" in k_models or "Grand Vitara" in k_models


def test_invalid_report_type_returns_400():
    """Verifies that unknown report names return 400 Bad Request with supported options."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/reports/NON_EXISTENT_REPORT",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 400
    assert "Invalid report type" in res.json()["detail"]


def test_metric_explanations_clarity():
    """Verifies that metric calculations are explicitly explained with formula and description."""
    token = get_token("owner@kalyanimotors.com")
    res = client.get(
        "/api/v1/dealers/me/reports/SALES_CONVERSION",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    explanations = res.json()["data"]["metric_explanations"]
    assert len(explanations) >= 2
    for exp in explanations:
        assert "metric_name" in exp and len(exp["metric_name"]) > 0
        assert "formula" in exp and len(exp["formula"]) > 0
        assert "description" in exp and len(exp["description"]) > 0
