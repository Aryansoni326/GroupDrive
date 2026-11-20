import pytest
from fastapi.testclient import TestClient
import time
from src.main import app
from src.core.security import create_access_token

client = TestClient(app)

def test_login_success_dealer_owner():
    response = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "access_token" in data
    assert data["user"]["email"] == "owner@kalyanimotors.com"
    assert data["user"]["staff_role"] == "DEALER_OWNER"
    assert data["dealer"]["id"] == "dlr-kalyani-blr-001"
    assert "gd_refresh_token" in response.cookies

def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "WrongPassword999"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_unknown_user():
    response = client.post(
        "/api/v1/auth/login-password",
        json={"email": "hacker@random.com", "password": "Password@123"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_protected_dealers_me_without_token():
    response = client.get("/api/v1/dealers/me")
    assert response.status_code == 401
    assert "Authentication token is missing" in response.json()["detail"]

def test_protected_dealers_me_tampered_token():
    response = client.get(
        "/api/v1/dealers/me",
        headers={"Authorization": "Bearer invalid.fake.token"}
    )
    assert response.status_code == 401
    assert "Invalid or tampered" in response.json()["detail"]

def test_protected_dealers_me_expired_token():
    expired_token = create_access_token(
        {"sub": "usr-vikram-01", "email": "owner@kalyanimotors.com", "dealer_id": "dlr-kalyani-blr-001"},
        expires_delta_minutes=-10 # Expired 10 minutes ago
    )
    response = client.get(
        "/api/v1/dealers/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
    assert "has expired" in response.json()["detail"]

def test_multi_tenant_isolation_enforcement():
    # Authenticate as Kalyani Motors staff
    login_res = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Access own dealership records -> 200 OK
    res_own = client.get("/api/v1/dealers/test-cross-tenant/dlr-kalyani-blr-001", headers=headers)
    assert res_own.status_code == 200

    # Cross-tenant violation: Try to access rival dealership Advaith Hyundai -> 403 Forbidden!
    res_rival = client.get("/api/v1/dealers/test-cross-tenant/dlr-advaith-blr-002", headers=headers)
    assert res_rival.status_code == 403
    assert "Cross-dealership access violation" in res_rival.json()["detail"]

def test_branch_level_access_restrictions():
    # 1. Branch Manager of Whitefield (br-whitefield-01)
    login_bm = client.post(
        "/api/v1/auth/login-password",
        json={"email": "branchmgr@kalyanimotors.com", "password": "Password@123"}
    )
    token_bm = login_bm.json()["data"]["access_token"]
    headers_bm = {"Authorization": f"Bearer {token_bm}"}

    # Can access own branch Whitefield -> 200 OK
    res_own_branch = client.get("/api/v1/dealers/test-branch-access/br-whitefield-01", headers=headers_bm)
    assert res_own_branch.status_code == 200

    # Branch-level violation: Try to access Bannerghatta branch -> 403 Forbidden!
    res_other_branch = client.get("/api/v1/dealers/test-branch-access/br-bannerghatta-02", headers=headers_bm)
    assert res_other_branch.status_code == 403
    assert "Branch-level access violation" in res_other_branch.json()["detail"]

    # 2. Dealer Owner has cross-branch privileges within own dealership
    login_owner = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    token_owner = login_owner.json()["data"]["access_token"]
    headers_owner = {"Authorization": f"Bearer {token_owner}"}

    res_owner_branch = client.get("/api/v1/dealers/test-branch-access/br-bannerghatta-02", headers=headers_owner)
    assert res_owner_branch.status_code == 200

def test_role_based_quotation_submission_permissions():
    # Sales Manager CAN submit quotations
    login_sm = client.post(
        "/api/v1/auth/login-password",
        json={"email": "salesmgr@kalyanimotors.com", "password": "Password@123"}
    )
    token_sm = login_sm.json()["data"]["access_token"]
    res_sm = client.post(
        "/api/v1/groups/grp-blr-brz-04/quotations",
        headers={"Authorization": f"Bearer {token_sm}"},
        json={"group_code": "GD-BLR-BRZ-04", "model_name": "Maruti Brezza", "total_group_discount": 45000}
    )
    assert res_sm.status_code == 200

    # Sales Executive CANNOT submit binding quotations -> 403 Forbidden!
    login_se = client.post(
        "/api/v1/auth/login-password",
        json={"email": "salesexec@kalyanimotors.com", "password": "Password@123"}
    )
    token_se = login_se.json()["data"]["access_token"]
    res_se = client.post(
        "/api/v1/groups/grp-blr-brz-04/quotations",
        headers={"Authorization": f"Bearer {token_se}"},
        json={"group_code": "GD-BLR-BRZ-04", "model_name": "Maruti Brezza", "total_group_discount": 45000}
    )
    assert res_se.status_code == 403
    assert "Access denied. Requires one of roles" in res_se.json()["detail"]

def test_all_six_dealer_roles_authentication():
    roles_test_matrix = [
        ("owner@kalyanimotors.com", "DEALER_OWNER", "ROLE_DEALER_OWNER"),
        ("branchmgr@kalyanimotors.com", "BRANCH_MANAGER", "ROLE_BRANCH_MANAGER"),
        ("salesmgr@kalyanimotors.com", "SALES_MANAGER", "ROLE_SALES_MANAGER"),
        ("salesexec@kalyanimotors.com", "SALES_EXECUTIVE", "ROLE_SALES_EXECUTIVE"),
        ("inventorymgr@kalyanimotors.com", "INVENTORY_MANAGER", "ROLE_INVENTORY_MANAGER"),
        ("financemgr@kalyanimotors.com", "FINANCE_EXECUTIVE", "ROLE_FINANCE_EXECUTIVE"),
    ]

    for email, expected_staff_role, expected_role_code in roles_test_matrix:
        res = client.post(
            "/api/v1/auth/login-password",
            json={"email": email, "password": "Password@123"}
        )
        assert res.status_code == 200
        user = res.json()["data"]["user"]
        assert user["staff_role"] == expected_staff_role
        assert expected_role_code in user["roles"]

def test_refresh_token_rotation():
    """Verifies that session refresh token succeeds and issues a new access token."""
    login_res = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    assert login_res.status_code == 200
    refresh_cookie = login_res.cookies.get("gd_refresh_token")
    assert refresh_cookie is not None

    refresh_res = client.post(
        "/api/v1/auth/refresh",
        cookies={"gd_refresh_token": refresh_cookie}
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()["data"]

def test_security_headers_injected():
    """Verifies that OWASP security defense-in-depth headers are present on responses."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("x-xss-protection") == "1; mode=block"
    assert "strict-transport-security" in res.headers

def test_reject_malicious_logo_url():
    """Verifies that XSS / javascript: protocol URLs are rejected by validation."""
    login_res = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    token = login_res.json()["data"]["access_token"]
    res = client.put(
        "/api/v1/dealers/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"logo_url": "javascript:alert(1)"}
    )
    assert res.status_code == 422

def test_rate_limiter_brute_force_protection():
    """Verifies that excessive login attempts trigger HTTP 429 Too Many Requests."""
    from src.core.security_middleware import login_rate_limiter
    login_rate_limiter.reset()

    # Send 20 attempts
    for _ in range(20):
        client.post(
            "/api/v1/auth/login-password",
            json={"email": "owner@kalyanimotors.com", "password": "WrongPassword"}
        )

    # 21st attempt should be rate limited
    blocked_res = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    assert blocked_res.status_code == 429
    assert "Rate limit exceeded" in blocked_res.json()["detail"]
    assert "retry-after" in blocked_res.headers

    # Reset limiter after test
    login_rate_limiter.reset()


