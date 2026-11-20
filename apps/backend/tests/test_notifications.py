import pytest
from datetime import datetime, timezone
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


def test_list_notifications_and_summary():
    """Verifies listing dealership notifications and calculating unread summary counters."""
    token = get_token("owner@kalyanimotors.com")

    # List all
    res = client.get(
        "/api/v1/dealers/me/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["count"] >= 8

    # Summary metrics
    s_res = client.get(
        "/api/v1/dealers/me/notifications/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert s_res.status_code == 200
    summary = s_res.json()["data"]
    assert summary["total_notifications"] >= 8
    assert summary["unread_count"] >= 1
    assert "urgent_unread_count" in summary


def test_notification_filtering():
    """Verifies filtering by read status, event type, and priority."""
    token = get_token("owner@kalyanimotors.com")

    # Filter unread
    res_unread = client.get(
        "/api/v1/dealers/me/notifications?is_read=false",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_unread.status_code == 200
    for n in res_unread.json()["data"]:
        assert n["is_read"] is False

    # Filter by event type NEW_ENQUIRY
    res_type = client.get(
        "/api/v1/dealers/me/notifications?event_type=NEW_ENQUIRY",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_type.status_code == 200
    for n in res_type.json()["data"]:
        assert n["event_type"] == "NEW_ENQUIRY"

    # Filter by priority URGENT
    res_prio = client.get(
        "/api/v1/dealers/me/notifications?priority=URGENT",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_prio.status_code == 200
    for n in res_prio.json()["data"]:
        assert n["priority"] == "URGENT"


def test_mark_single_and_all_read():
    """Verifies marking an individual notification read and marking all as read."""
    token = get_token("owner@kalyanimotors.com")

    # Mark single notification as read
    res_read = client.patch(
        "/api/v1/dealers/me/notifications/notif-001/read",
        json={"is_read": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_read.status_code == 200
    assert res_read.json()["data"]["is_read"] is True
    assert res_read.json()["data"]["read_at"] is not None

    # Toggle back to unread
    res_unread = client.patch(
        "/api/v1/dealers/me/notifications/notif-001/read",
        json={"is_read": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_unread.status_code == 200
    assert res_unread.json()["data"]["is_read"] is False

    # Mark all as read
    res_all = client.post(
        "/api/v1/dealers/me/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_all.status_code == 200
    assert res_all.json()["updated_count"] >= 0


def test_role_based_notification_scoping():
    """Verifies that Sales Executives only see notifications permitted for their role/user scope."""
    owner_token = get_token("owner@kalyanimotors.com")
    exec_token = get_token("salesexec@kalyanimotors.com")

    owner_res = client.get(
        "/api/v1/dealers/me/notifications",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    exec_res = client.get(
        "/api/v1/dealers/me/notifications",
        headers={"Authorization": f"Bearer {exec_token}"},
    )

    assert owner_res.status_code == 200
    assert exec_res.status_code == 200

    owner_count = owner_res.json()["count"]
    exec_count = exec_res.json()["count"]

    # Dealer Owner has dealership-wide visibility; Sales Executive has scoped visibility
    assert owner_count >= exec_count
    # Sales Executive should see notifications addressed to SALES_EXECUTIVE
    exec_types = [n["event_type"] for n in exec_res.json()["data"]]
    assert len(exec_types) > 0


def test_deduplication_prevention():
    """Verifies that events with duplicate keys within the cooldown window do not create duplicate notifications."""
    token = get_token("owner@kalyanimotors.com")

    unique_key = f"dedup-test-{int(datetime.now(timezone.utc).timestamp())}"
    payload = {
        "event_type": "QUOTATION_UPDATE",
        "title": "Quotation Revised Notice",
        "message": "Quotation QTE-2026-999 was updated by sales manager.",
        "priority": "NORMAL",
        "deduplication_key": unique_key,
    }

    # First emission
    res1 = client.post(
        "/api/v1/dealers/me/notifications/test-trigger",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res1.status_code == 201
    notif1_id = res1.json()["data"]["id"]

    # Second emission with identical deduplication_key
    res2 = client.post(
        "/api/v1/dealers/me/notifications/test-trigger",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res2.status_code == 201
    notif2_id = res2.json()["data"]["id"]

    # Must return the same notification ID without duplicate record creation
    assert notif1_id == notif2_id


def test_channel_delivery_failure_handling():
    """Verifies that external channels without credentials fail gracefully while preserving in-app records."""
    token = get_token("owner@kalyanimotors.com")

    payload = {
        "event_type": "ACCOUNT_ACTIVITY",
        "title": "Unconfigured WhatsApp Alert Test",
        "message": "Testing WhatsApp channel dispatch without active Meta API credentials.",
        "delivery_channel": "WHATSAPP",
    }

    res = client.post(
        "/api/v1/dealers/me/notifications/test-trigger",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["delivery_status"] == "FAILED"
    assert "credentials not configured" in data["delivery_failure_reason"].lower()


def test_cross_tenant_isolation():
    """Verifies that Dealership A (Kalyani) cannot access or modify Dealership B (Advaith) notifications."""
    kalyani_token = get_token("owner@kalyanimotors.com")
    advaith_token = get_token("sunil@advaithhyundai.com")

    # Kalyani cannot read or mark Advaith notification
    res = client.patch(
        "/api/v1/dealers/me/notifications/notif-advaith-001/read",
        json={"is_read": True},
        headers={"Authorization": f"Bearer {kalyani_token}"},
    )
    assert res.status_code == 403
    assert "another dealership" in res.json()["detail"].lower()

    # Advaith can access its own notification
    res_adv = client.patch(
        "/api/v1/dealers/me/notifications/notif-advaith-001/read",
        json={"is_read": True},
        headers={"Authorization": f"Bearer {advaith_token}"},
    )
    assert res_adv.status_code == 200
    assert res_adv.json()["data"]["is_read"] is True


def test_notification_preferences():
    """Verifies retrieving and updating user notification preferences."""
    token = get_token("owner@kalyanimotors.com")

    # Get preferences
    res = client.get(
        "/api/v1/dealers/me/notifications/preferences",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    prefs = res.json()["data"]
    assert "channels" in prefs
    assert "channel_readiness" in prefs
    assert prefs["channel_readiness"]["in_app"]["ready"] is True

    # Attempting to activate external channel without credentials must fail with 400 Bad Request
    err_res = client.put(
        "/api/v1/dealers/me/notifications/preferences",
        json={"channels": {"sms": True}},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert err_res.status_code == 400
    assert "cannot activate sms channel" in err_res.json()["detail"].lower()

    # Updating permitted in-app preferences succeeds
    ok_res = client.put(
        "/api/v1/dealers/me/notifications/preferences",
        json={"channels": {"in_app": True}},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ok_res.status_code == 200


def test_dismiss_and_clear_read_notifications():
    """Verifies dismissing a single notification and clearing all read notifications."""
    token = get_token("owner@kalyanimotors.com")

    # Create temporary notification
    t_res = client.post(
        "/api/v1/dealers/me/notifications/test-trigger",
        json={
            "event_type": "ACCOUNT_ACTIVITY",
            "title": "Dismissable Temporary Notification",
            "message": "Temporary message to be dismissed.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert t_res.status_code == 201
    nid = t_res.json()["data"]["id"]

    # Dismiss it
    del_res = client.delete(
        f"/api/v1/dealers/me/notifications/{nid}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_res.status_code == 200

    # Clear read notifications
    clear_res = client.post(
        "/api/v1/dealers/me/notifications/clear-read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert clear_res.status_code == 200
    assert clear_res.json()["cleared_count"] >= 0

