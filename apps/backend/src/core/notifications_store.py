import os
import copy
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status

# In-Memory Notifications Database
NOTIFICATIONS_DB: Dict[str, Dict[str, Any]] = {
    "notif-001": {
        "id": "notif-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "SALES_MANAGER",
        "branch_id": "br-whitefield-01",
        "event_type": "NEW_ENQUIRY",
        "title": "New Customer Enquiry: Brezza ZXi Plus",
        "message": "Rahul Sharma submitted an enquiry for Brezza ZXi Plus Petrol (Pearl Arctic White) at Whitefield Showroom.",
        "priority": "HIGH",
        "is_read": False,
        "read_at": None,
        "related_entity": {
            "entity_type": "LEAD",
            "entity_id": "lead-blr-001",
            "entity_code": "GD-LD-2026-001",
            "link_url": "/leads?lead_id=lead-blr-001",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "enquiry:lead-blr-001:created",
        "created_at": "2026-11-07T11:45:00Z",
    },
    "notif-002": {
        "id": "notif-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": "usr-salesexec-01",
        "recipient_role": "SALES_EXECUTIVE",
        "branch_id": "br-whitefield-01",
        "event_type": "LEAD_ASSIGNED",
        "title": "Lead Assigned: Priya Patel (Swift 2026)",
        "message": "Sales Manager assigned Priya Patel (Swift 2026 ZXi, Budget ₹8.5L) to you for consultation and test drive booking.",
        "priority": "HIGH",
        "is_read": False,
        "read_at": None,
        "related_entity": {
            "entity_type": "LEAD",
            "entity_id": "lead-blr-002",
            "entity_code": "GD-LD-2026-002",
            "link_url": "/leads?lead_id=lead-blr-002",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "lead_assigned:lead-blr-002:usr-salesexec-01",
        "created_at": "2026-11-07T10:30:00Z",
    },
    "notif-003": {
        "id": "notif-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": "usr-salesexec-01",
        "recipient_role": "SALES_EXECUTIVE",
        "branch_id": "br-whitefield-01",
        "event_type": "FOLLOW_UP_REMINDER",
        "title": "Follow-up Reminder: Ankit Verma Test Drive",
        "message": "Showroom visit scheduled for Ankit Verma at 3:30 PM today for Grand Vitara Hybrid test drive.",
        "priority": "URGENT",
        "is_read": False,
        "read_at": None,
        "related_entity": {
            "entity_type": "FOLLOW_UP",
            "entity_id": "flw-001",
            "entity_code": "FLW-001",
            "link_url": "/follow-ups",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "reminder:flw-001:2026-11-07",
        "created_at": "2026-11-07T09:00:00Z",
    },
    "notif-004": {
        "id": "notif-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "SALES_MANAGER",
        "branch_id": "br-whitefield-01",
        "event_type": "OVERDUE_TASK",
        "title": "Overdue Task: Lead Callback Required",
        "message": "Callback for Suresh K (Booking Voucher GD-VCH-8821) is 24 hours overdue. Please reassign or update status.",
        "priority": "URGENT",
        "is_read": False,
        "read_at": None,
        "related_entity": {
            "entity_type": "FOLLOW_UP",
            "entity_id": "flw-004",
            "entity_code": "FLW-004",
            "link_url": "/follow-ups",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "overdue:flw-004:callback",
        "created_at": "2026-11-06T17:00:00Z",
    },
    "notif-005": {
        "id": "notif-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "DEALER_OWNER",
        "branch_id": None,
        "event_type": "NEW_GROUP_OPPORTUNITY",
        "title": "New Collective Buying Pool: Brezza KA-03",
        "message": "Group GD-BLR-BRZ-04 reached 7 verified buyers in Whitefield IT Corridor. 48 hours remaining for quotation submission.",
        "priority": "HIGH",
        "is_read": True,
        "read_at": "2026-11-06T15:00:00Z",
        "related_entity": {
            "entity_type": "OPPORTUNITY",
            "entity_id": "grp-blr-brz-04",
            "entity_code": "GD-BLR-BRZ-04",
            "link_url": "/demand",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "opportunity:grp-blr-brz-04:threshold",
        "created_at": "2026-11-06T14:15:00Z",
    },
    "notif-006": {
        "id": "notif-006",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "SALES_MANAGER",
        "branch_id": None,
        "event_type": "NEGOTIATION_UPDATE",
        "title": "Negotiation Update: Fronx Corporate Group",
        "message": "Buyer group coordinator requested ₹10,000 additional accessory credit for 8 units batch order.",
        "priority": "NORMAL",
        "is_read": True,
        "read_at": "2026-11-06T12:00:00Z",
        "related_entity": {
            "entity_type": "OPPORTUNITY",
            "entity_id": "grp-blr-fnx-03",
            "entity_code": "GD-BLR-FNX-03",
            "link_url": "/demand",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "negotiation:grp-blr-fnx-03:counter",
        "created_at": "2026-11-06T11:30:00Z",
    },
    "notif-007": {
        "id": "notif-007",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "BRANCH_MANAGER",
        "branch_id": "br-whitefield-01",
        "event_type": "QUOTATION_UPDATE",
        "title": "Quotation Accepted: QTE-2026-001",
        "message": "Customer accepted official on-road quotation of ₹13,98,000 for Brezza ZXi Plus. Delivery scheduled.",
        "priority": "HIGH",
        "is_read": True,
        "read_at": "2026-11-05T16:00:00Z",
        "related_entity": {
            "entity_type": "QUOTATION",
            "entity_id": "qte-001",
            "entity_code": "QTE-2026-001",
            "link_url": "/quotations",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "quotation:qte-001:accepted",
        "created_at": "2026-11-05T15:45:00Z",
    },
    "notif-008": {
        "id": "notif-008",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": None,
        "branch_id": None,
        "event_type": "CAMPAIGN_UPDATE",
        "title": "Campaign Milestone: Festive Flash Offer",
        "message": "Festive Season Brezza Flash Offer reached 68 customer enquiries with a 17.6% conversion efficiency rate.",
        "priority": "LOW",
        "is_read": True,
        "read_at": "2026-11-05T10:00:00Z",
        "related_entity": {
            "entity_type": "CAMPAIGN",
            "entity_id": "cmp-kalyani-001",
            "entity_code": "GD-CMP-2026-001",
            "link_url": "/campaigns",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "campaign:cmp-kalyani-001:milestone_68",
        "created_at": "2026-11-05T09:30:00Z",
    },
    "notif-009": {
        "id": "notif-009",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "DEALER_OWNER",
        "branch_id": None,
        "event_type": "STAFF_INVITATION",
        "title": "Staff Invitation Accepted: Pooja Sharma",
        "message": "Pooja Sharma activated her account and signed in as Sales Executive for Whitefield Showroom.",
        "priority": "NORMAL",
        "is_read": True,
        "read_at": "2026-11-04T18:00:00Z",
        "related_entity": {
            "entity_type": "STAFF",
            "entity_id": "usr-pooja-04",
            "link_url": "/staff",
        },
        "delivery_channel": "EMAIL",
        "delivery_status": "FAILED",
        "delivery_failure_reason": "SMTP credentials not configured on dealership account. In-app record maintained.",
        "deduplication_key": "staff_invite:usr-pooja-04:accepted",
        "created_at": "2026-11-04T17:20:00Z",
    },
    "notif-010": {
        "id": "notif-010",
        "dealer_id": "dlr-kalyani-blr-001",
        "recipient_user_id": None,
        "recipient_role": "DEALER_OWNER",
        "branch_id": None,
        "event_type": "ACCOUNT_ACTIVITY",
        "title": "Security Notice: Dealership Profile Verified",
        "message": "Kalyani Motors corporate profile and GSTIN credentials verified by GroupDrive compliance administration.",
        "priority": "NORMAL",
        "is_read": True,
        "read_at": "2026-11-03T12:00:00Z",
        "related_entity": {
            "entity_type": "ACCOUNT",
            "entity_id": "dlr-kalyani-blr-001",
            "link_url": "/settings",
        },
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "delivery_failure_reason": None,
        "deduplication_key": "account:kyc:verified",
        "created_at": "2026-11-03T11:00:00Z",
    },
    # Rival dealer notification for cross-tenant testing
    "notif-advaith-001": {
        "id": "notif-advaith-001",
        "dealer_id": "dlr-advaith-blr-002",
        "recipient_user_id": None,
        "recipient_role": "DEALER_OWNER",
        "branch_id": "br-advaith-residency-01",
        "event_type": "NEW_ENQUIRY",
        "title": "Advaith Confidential: Creta Lead",
        "message": "Confidential customer enquiry for Advaith Hyundai showroom.",
        "priority": "HIGH",
        "is_read": False,
        "read_at": None,
        "delivery_channel": "IN_APP",
        "delivery_status": "DELIVERED",
        "created_at": "2026-11-07T08:00:00Z",
    },
}

# User Notification Preferences Store
NOTIFICATION_PREFERENCES_DB: Dict[str, Dict[str, Any]] = {}


def check_channel_credentials(channel: str) -> Dict[str, Any]:
    """
    Verifies whether the required configuration and credentials are available
    before activating external delivery channels (Email, SMS, WhatsApp).
    """
    if channel == "IN_APP":
        return {"ready": True, "detail": "Active - real-time web notification center enabled"}

    if channel == "EMAIL":
        smtp_host = os.getenv("SMTP_HOST")
        smtp_user = os.getenv("SMTP_USER")
        if smtp_host and smtp_user:
            return {"ready": True, "detail": f"Active - SMTP host {smtp_host} connected"}
        return {
            "ready": False,
            "detail": "Disabled - configure SMTP host & credentials in Dealership Settings to activate email alerts",
        }

    if channel == "SMS":
        sms_api_key = os.getenv("SMS_API_KEY")
        sms_sender = os.getenv("SMS_SENDER_ID")
        if sms_api_key and sms_sender:
            return {"ready": True, "detail": f"Active - SMS sender {sms_sender} verified"}
        return {
            "ready": False,
            "detail": "Disabled - register TRAI DLT template and configure SMS API credentials to enable SMS dispatch",
        }

    if channel == "WHATSAPP":
        wa_token = os.getenv("WHATSAPP_API_TOKEN")
        wa_phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        if wa_token and wa_phone_id:
            return {"ready": True, "detail": "Active - WhatsApp Business Cloud API connected"}
        return {
            "ready": False,
            "detail": "Disabled - connect Meta WhatsApp Business API token to enable WhatsApp buyer alerts",
        }

    return {"ready": False, "detail": "Unknown channel"}


def get_default_preferences(user_id: str, dealer_id: str) -> Dict[str, Any]:
    """
    Constructs default notification preferences for a dealer staff member.
    """
    events = [
        "NEW_ENQUIRY",
        "LEAD_ASSIGNED",
        "FOLLOW_UP_REMINDER",
        "OVERDUE_TASK",
        "NEW_GROUP_OPPORTUNITY",
        "NEGOTIATION_UPDATE",
        "QUOTATION_UPDATE",
        "CAMPAIGN_UPDATE",
        "STAFF_INVITATION",
        "ACCOUNT_ACTIVITY",
    ]

    event_subscriptions = {}
    for evt in events:
        event_subscriptions[evt] = {
            "in_app": True,
            "email": evt in ["NEW_ENQUIRY", "LEAD_ASSIGNED", "OVERDUE_TASK", "NEW_GROUP_OPPORTUNITY", "QUOTATION_UPDATE", "STAFF_INVITATION", "ACCOUNT_ACTIVITY"],
            "sms": False,
            "whatsapp": False,
        }

    return {
        "user_id": user_id,
        "dealer_id": dealer_id,
        "channels": {
            "in_app": True,
            "email": False,
            "sms": False,
            "whatsapp": False,
        },
        "event_subscriptions": event_subscriptions,
        "channel_readiness": {
            "in_app": check_channel_credentials("IN_APP"),
            "email": check_channel_credentials("EMAIL"),
            "sms": check_channel_credentials("SMS"),
            "whatsapp": check_channel_credentials("WHATSAPP"),
        },
    }


def is_notification_visible_to_user(notif: Dict[str, Any], user: Dict[str, Any]) -> bool:
    """
    Evaluates whether a notification is visible to the given staff user based on
    dealership role hierarchy, assigned branch, and direct recipient assignments.
    """
    role = user.get("staff_role") or "SALES_EXECUTIVE"
    user_id = user.get("id")
    user_branch = user.get("branch_id")

    # If specifically assigned to a single user, only that user (or Dealer Owner) sees it
    if notif.get("recipient_user_id"):
        if notif["recipient_user_id"] == user_id:
            return True
        if role == "DEALER_OWNER":
            return True
        return False

    # Role-based notification
    target_role = notif.get("recipient_role")
    target_branch = notif.get("branch_id")

    # Dealer Owner sees all dealership notifications
    if role == "DEALER_OWNER":
        return True

    # Branch Manager sees branch notifications and general management notifications
    if role == "BRANCH_MANAGER":
        if target_branch and user_branch and target_branch != user_branch:
            return False
        if target_role in [None, "DEALER_OWNER", "BRANCH_MANAGER", "SALES_MANAGER"]:
            return True
        return False

    # Sales Manager sees leads, quotations, enquiries, followups across authorized branches
    if role == "SALES_MANAGER":
        if target_branch and user_branch and target_branch != user_branch:
            return False
        if target_role in [None, "SALES_MANAGER", "BRANCH_MANAGER", "SALES_EXECUTIVE"]:
            return True
        return False

    # Sales Executive only sees relevant showroom floor events
    if role == "SALES_EXECUTIVE":
        if target_branch and user_branch and target_branch != user_branch:
            return False
        if target_role in [None, "SALES_EXECUTIVE"]:
            return True
        return False

    # Other roles (Inventory Manager, Finance Executive)
    if target_role == role:
        return True
    if target_role is None:
        return True

    return False


def list_notifications(
    user: Dict[str, Any],
    dealer_id: str,
    is_read: Optional[bool] = None,
    event_type: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Lists notifications filtered by user permissions, read state, event type, priority, and search.
    """
    results: List[Dict[str, Any]] = []

    for n in NOTIFICATIONS_DB.values():
        # Tenant isolation
        if n.get("dealer_id") != dealer_id:
            continue

        # Permission visibility check
        if not is_notification_visible_to_user(n, user):
            continue

        # Read filter
        if is_read is not None:
            if n.get("is_read") != is_read:
                continue

        # Event type filter
        if event_type and event_type != "ALL":
            if n.get("event_type") != event_type:
                continue

        # Priority filter
        if priority and priority != "ALL":
            if n.get("priority") != priority:
                continue

        # Search query
        if search:
            q = search.strip().lower()
            title = (n.get("title") or "").lower()
            msg = (n.get("message") or "").lower()
            code = (n.get("related_entity", {}).get("entity_code") or "").lower()
            if not (q in title or q in msg or q in code):
                continue

        results.append(copy.deepcopy(n))

    # Sort descending by creation timestamp
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


def get_notifications_summary(user: Dict[str, Any], dealer_id: str) -> Dict[str, Any]:
    """
    Computes summary metrics for visible notifications (total, unread, urgent unread, today).
    """
    items = list_notifications(user=user, dealer_id=dealer_id)
    total_count = len(items)
    unread_count = sum(1 for n in items if not n.get("is_read"))
    urgent_unread = sum(1 for n in items if not n.get("is_read") and n.get("priority") == "URGENT")

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    today_count = sum(1 for n in items if (n.get("created_at") or "").startswith(today_str))

    return {
        "total_notifications": total_count,
        "unread_count": unread_count,
        "urgent_unread_count": urgent_unread,
        "today_count": today_count,
    }


def mark_notification_as_read(
    notification_id: str,
    user: Dict[str, Any],
    dealer_id: str,
    is_read: bool = True,
) -> Dict[str, Any]:
    """
    Marks a single notification as read or unread.
    """
    notif = NOTIFICATIONS_DB.get(notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{notification_id}' was not found.",
        )

    if notif.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot modify notifications belonging to another dealership.",
        )

    if not is_notification_visible_to_user(notif, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view this notification.",
        )

    notif["is_read"] = is_read
    notif["read_at"] = datetime.now(timezone.utc).isoformat() if is_read else None
    return copy.deepcopy(notif)


def mark_all_notifications_as_read(user: Dict[str, Any], dealer_id: str) -> int:
    """
    Marks all unread notifications visible to the caller as read.
    Returns the count of updated records.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    updated_count = 0

    for notif in NOTIFICATIONS_DB.values():
        if notif.get("dealer_id") != dealer_id:
            continue
        if not notif.get("is_read") and is_notification_visible_to_user(notif, user):
            notif["is_read"] = True
            notif["read_at"] = now_iso
            updated_count += 1

    return updated_count


def delete_notification(notification_id: str, user: Dict[str, Any], dealer_id: str) -> bool:
    """
    Deletes / dismisses a single notification.
    """
    notif = NOTIFICATIONS_DB.get(notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{notification_id}' was not found.",
        )

    if notif.get("dealer_id") != dealer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You cannot delete notifications belonging to another dealership.",
        )

    if not is_notification_visible_to_user(notif, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to delete this notification.",
        )

    del NOTIFICATIONS_DB[notification_id]
    return True


def clear_read_notifications(user: Dict[str, Any], dealer_id: str) -> int:
    """
    Deletes all read notifications visible to the caller.
    """
    to_delete = []
    for nid, notif in NOTIFICATIONS_DB.items():
        if notif.get("dealer_id") == dealer_id and notif.get("is_read"):
            if is_notification_visible_to_user(notif, user):
                to_delete.append(nid)

    for nid in to_delete:
        if nid in NOTIFICATIONS_DB:
            del NOTIFICATIONS_DB[nid]

    return len(to_delete)


def create_notification(
    payload: Dict[str, Any],
    dealer_id: str,
) -> Dict[str, Any]:
    """
    Creates and records a notification event.
    Applies deduplication: if deduplication_key matches an existing notification
    within the last 3600 seconds, returns the existing record to prevent duplicates.
    Verifies external channel credentials before dispatching.
    """
    dedup_key = payload.get("deduplication_key")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Deduplication check
    if dedup_key:
        for existing in NOTIFICATIONS_DB.values():
            if existing.get("dealer_id") == dealer_id and existing.get("deduplication_key") == dedup_key:
                try:
                    c_time = datetime.fromisoformat(existing["created_at"].replace("Z", "+00:00"))
                    if (now - c_time).total_seconds() < 3600:
                        # Existing notification found within cooldown window
                        return copy.deepcopy(existing)
                except Exception:
                    pass

    ts = int(now.timestamp() * 1000)
    notif_id = f"notif-{ts}"

    channel = payload.get("delivery_channel") or "IN_APP"
    cred_check = check_channel_credentials(channel)

    delivery_status = "DELIVERED"
    failure_reason = None

    if not cred_check["ready"]:
        delivery_status = "FAILED"
        failure_reason = f"{channel} credentials not configured on dealership account. In-app record maintained."

    new_notif: Dict[str, Any] = {
        "id": notif_id,
        "dealer_id": dealer_id,
        "recipient_user_id": payload.get("recipient_user_id"),
        "recipient_role": payload.get("recipient_role"),
        "branch_id": payload.get("branch_id"),
        "event_type": payload.get("event_type", "ACCOUNT_ACTIVITY"),
        "title": payload.get("title", "New Notification"),
        "message": payload.get("message", ""),
        "priority": payload.get("priority", "NORMAL"),
        "is_read": False,
        "read_at": None,
        "related_entity": payload.get("related_entity"),
        "delivery_channel": channel,
        "delivery_status": delivery_status,
        "delivery_failure_reason": failure_reason,
        "deduplication_key": dedup_key,
        "created_at": now_iso,
    }

    NOTIFICATIONS_DB[notif_id] = new_notif
    return copy.deepcopy(new_notif)


def get_user_preferences(user_id: str, dealer_id: str) -> Dict[str, Any]:
    """
    Retrieves or initializes user notification delivery channel preferences.
    """
    key = f"{dealer_id}:{user_id}"
    if key not in NOTIFICATION_PREFERENCES_DB:
        NOTIFICATION_PREFERENCES_DB[key] = get_default_preferences(user_id, dealer_id)

    prefs = copy.deepcopy(NOTIFICATION_PREFERENCES_DB[key])
    # Dynamically refresh readiness status
    prefs["channel_readiness"] = {
        "in_app": check_channel_credentials("IN_APP"),
        "email": check_channel_credentials("EMAIL"),
        "sms": check_channel_credentials("SMS"),
        "whatsapp": check_channel_credentials("WHATSAPP"),
    }
    return prefs


def update_user_preferences(
    user_id: str,
    dealer_id: str,
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Updates user notification preferences and event channel subscriptions.
    """
    key = f"{dealer_id}:{user_id}"
    current = get_user_preferences(user_id, dealer_id)

    if "channels" in payload and payload["channels"] is not None:
        for ch, val in payload["channels"].items():
            if ch in current["channels"]:
                # If activating an external channel, warn/enforce readiness check
                if val:
                    readiness = check_channel_credentials(ch.upper())
                    if not readiness["ready"]:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot activate {ch.upper()} channel: {readiness['detail']}",
                        )
                current["channels"][ch] = bool(val)

    if "event_subscriptions" in payload and payload["event_subscriptions"] is not None:
        for evt, ch_map in payload["event_subscriptions"].items():
            if evt in current["event_subscriptions"]:
                for ch, val in ch_map.items():
                    current["event_subscriptions"][evt][ch] = bool(val)

    NOTIFICATION_PREFERENCES_DB[key] = current
    return copy.deepcopy(current)

