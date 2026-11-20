from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from src.core.dependencies import get_current_dealer_staff
from src.core.notifications_store import (
    list_notifications,
    get_notifications_summary,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    delete_notification,
    clear_read_notifications,
    create_notification,
    get_user_preferences,
    update_user_preferences,
)

router = APIRouter(prefix="/dealers/me/notifications", tags=["Notification Center"])

# Pydantic Schemas

class MarkNotificationReadSchema(BaseModel):
    is_read: bool = Field(True, description="Target read status")


class RelatedEntitySchema(BaseModel):
    entity_type: str = Field(..., description="Target business entity type")
    entity_id: str = Field(..., description="Target business entity ID")
    entity_code: Optional[str] = None
    link_url: str = Field(..., description="Navigation route path")

    @field_validator("link_url")
    @classmethod
    def validate_safe_link_url(cls, v: str) -> str:
        clean = v.strip().lower()
        if not (clean.startswith("/") or clean.startswith("https://") or clean.startswith("http://")):
            raise ValueError("link_url must begin with / or an absolute URL")
        return v


class CreateNotificationSchema(BaseModel):
    event_type: str = Field(..., description="Notification event type")
    title: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=3, max_length=500)
    priority: Optional[str] = Field("NORMAL", description="LOW, NORMAL, HIGH, URGENT")
    recipient_user_id: Optional[str] = None
    recipient_role: Optional[str] = None
    branch_id: Optional[str] = None
    related_entity: Optional[RelatedEntitySchema] = None
    delivery_channel: Optional[str] = Field("IN_APP", description="IN_APP, EMAIL, SMS, WHATSAPP")
    deduplication_key: Optional[str] = None


class ChannelPreferencesSchema(BaseModel):
    in_app: Optional[bool] = None
    email: Optional[bool] = None
    sms: Optional[bool] = None
    whatsapp: Optional[bool] = None


class UpdatePreferencesSchema(BaseModel):
    channels: Optional[ChannelPreferencesSchema] = None
    event_subscriptions: Optional[Dict[str, Dict[str, bool]]] = None


# Endpoints

@router.get("", summary="List User Notifications")
async def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read or unread status"),
    event_type: Optional[str] = Query(None, description="Filter by notification event category"),
    priority: Optional[str] = Query(None, description="Filter by priority level"),
    search: Optional[str] = Query(None, description="Search across title, message, or reference code"),
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns list of notifications visible to the authenticated dealer staff member.
    Enforces role-based hierarchy, branch scoping, and tenant isolation.
    """
    dealer_id = current_staff["dealer_id"]
    items = list_notifications(
        user=current_staff,
        dealer_id=dealer_id,
        is_read=is_read,
        event_type=event_type,
        priority=priority,
        search=search,
    )
    return {
        "success": True,
        "count": len(items),
        "data": items,
    }


@router.get("/summary", summary="Notification Summary & Unread Counts")
async def get_summary_stats(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Returns live unread badge counters, urgent count, and today's activity stats.
    """
    dealer_id = current_staff["dealer_id"]
    summary = get_notifications_summary(user=current_staff, dealer_id=dealer_id)
    return {
        "success": True,
        "data": summary,
    }


@router.patch("/{notification_id}/read", summary="Toggle Notification Read Status")
async def update_read_status(
    notification_id: str,
    payload: MarkNotificationReadSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Marks an individual notification as read or unread.
    """
    dealer_id = current_staff["dealer_id"]
    updated = mark_notification_as_read(
        notification_id=notification_id,
        user=current_staff,
        dealer_id=dealer_id,
        is_read=payload.is_read,
    )
    return {
        "success": True,
        "message": f"Notification marked as {'read' if payload.is_read else 'unread'}.",
        "data": updated,
    }


@router.post("/mark-all-read", summary="Mark All Notifications as Read")
async def mark_all_as_read(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Marks all visible unread notifications as read for the authenticated staff user.
    """
    dealer_id = current_staff["dealer_id"]
    count = mark_all_notifications_as_read(user=current_staff, dealer_id=dealer_id)
    return {
        "success": True,
        "message": f"Marked {count} notifications as read.",
        "updated_count": count,
    }


@router.delete("/{notification_id}", summary="Delete / Dismiss Notification")
async def dismiss_notification(
    notification_id: str,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Dismisses / removes a single notification record from the user's feed.
    """
    dealer_id = current_staff["dealer_id"]
    delete_notification(notification_id=notification_id, user=current_staff, dealer_id=dealer_id)
    return {
        "success": True,
        "message": "Notification dismissed successfully.",
    }


@router.post("/clear-read", summary="Clear All Read Notifications")
async def clear_all_read(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Deletes all read notifications from the user's feed.
    """
    dealer_id = current_staff["dealer_id"]
    count = clear_read_notifications(user=current_staff, dealer_id=dealer_id)
    return {
        "success": True,
        "message": f"Cleared {count} read notifications.",
        "cleared_count": count,
    }


@router.get("/preferences", summary="Get User Notification Preferences")
async def get_preferences(
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Retrieves user delivery channel preferences and integration readiness status.
    """
    dealer_id = current_staff["dealer_id"]
    user_id = current_staff.get("id", "usr-default")
    prefs = get_user_preferences(user_id=user_id, dealer_id=dealer_id)
    return {
        "success": True,
        "data": prefs,
    }


@router.put("/preferences", summary="Update Notification Preferences")
async def update_preferences(
    payload: UpdatePreferencesSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Updates notification delivery preferences. External channels (Email/SMS/WhatsApp)
    require valid configuration and credentials before activation.
    """
    dealer_id = current_staff["dealer_id"]
    user_id = current_staff.get("id", "usr-default")
    data = payload.model_dump()
    updated = update_user_preferences(user_id=user_id, dealer_id=dealer_id, payload=data)
    return {
        "success": True,
        "message": "Notification preferences updated successfully.",
        "data": updated,
    }


@router.post("/test-trigger", status_code=status.HTTP_201_CREATED, summary="Trigger / Simulate Notification Event")
async def trigger_test_notification(
    payload: CreateNotificationSchema,
    current_staff: Dict[str, Any] = Depends(get_current_dealer_staff),
):
    """
    Emits a notification event. Demonstrates deduplication, channel credential checks,
    and automatic delivery logging.
    """
    dealer_id = current_staff["dealer_id"]
    data = payload.model_dump()
    created = create_notification(payload=data, dealer_id=dealer_id)
    return {
        "success": True,
        "message": "Notification generated successfully.",
        "data": created,
    }

