from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
import csv
import io

from src.core.identity_store import BRANCHES_DB, USERS_DB
from src.core.leads_store import LEADS_MASTER_DB
from src.core.followups_store import FOLLOW_UPS_MASTER_DB, APPOINTMENTS_MASTER_DB
from src.core.inventory_store import INVENTORY_MASTER_DB
from src.core.quotations_store import QUOTATIONS_DB
from src.core.campaigns_store import CAMPAIGNS_DB
from src.core.opportunities_store import GROUP_OPPORTUNITIES_DB, DEALER_INTERESTS_DB

# Supported Report Identifiers
REPORT_TYPES = [
    "ENQUIRY",
    "LEAD_STATUS",
    "LEAD_ASSIGNMENT",
    "FOLLOW_UP",
    "SALES_CONVERSION",
    "INVENTORY",
    "BRANCH_PERFORMANCE",
    "STAFF_PERFORMANCE",
    "QUOTATION",
    "GROUP_OPPORTUNITY",
    "CAMPAIGN_PERFORMANCE",
]


def parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string to timezone-aware UTC datetime."""
    if not dt_str:
        return None
    try:
        clean_str = dt_str.replace("Z", "+00:00")
        if "T" in clean_str:
            return datetime.fromisoformat(clean_str).astimezone(timezone.utc)
        return datetime.fromisoformat(f"{clean_str}T00:00:00+00:00").astimezone(timezone.utc)
    except Exception:
        return None


def calculate_date_bounds(
    date_range: Optional[str],
    start_date_str: Optional[str],
    end_date_str: Optional[str],
    reference_dt: Optional[datetime] = None,
) -> Tuple[Optional[datetime], Optional[datetime]]:
    """
    Computes (start_bound, end_bound) datetime in UTC.
    Uses reference_dt (defaults to 2026-11-07 if in 2026 seed scope) to ensure predictable filtering.
    """
    now = reference_dt or datetime(2026, 11, 7, 23, 59, 59, tzinfo=timezone.utc)
    range_key = (date_range or "ALL").upper()

    if range_key == "TODAY":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start, end
    elif range_key == "LAST_7_DAYS":
        start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now
    elif range_key == "LAST_30_DAYS":
        start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now
    elif range_key == "THIS_MONTH":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return start, now
    elif range_key == "LAST_90_DAYS":
        start = (now - timedelta(days=90)).replace(hour=0, minute=0, second=0, microsecond=0)
        return start, now
    elif range_key == "CUSTOM" or start_date_str or end_date_str:
        start = parse_iso_datetime(start_date_str) if start_date_str else None
        end = parse_iso_datetime(end_date_str) if end_date_str else None
        if end and "T" not in (end_date_str or ""):
            end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start, end
    return None, None


def is_record_in_date_range(
    record_date_str: Optional[str],
    start_bound: Optional[datetime],
    end_bound: Optional[datetime],
) -> bool:
    """Check if record's timestamp falls within [start_bound, end_bound]."""
    if not start_bound and not end_bound:
        return True
    rec_dt = parse_iso_datetime(record_date_str)
    if not rec_dt:
        return True
    if start_bound and rec_dt < start_bound:
        return False
    if end_bound and rec_dt > end_bound:
        return False
    return True


def apply_common_scoping(
    records: List[Dict[str, Any]],
    user: Dict[str, Any],
    dealer_id: str,
    branch_id_param: Optional[str] = None,
    staff_id_param: Optional[str] = None,
    model_name_param: Optional[str] = None,
    start_bound: Optional[datetime] = None,
    end_bound: Optional[datetime] = None,
    date_field: str = "created_at",
    branch_field: str = "branch_id",
    staff_field: str = "assigned_to_id",
    model_field: str = "model_name",
) -> List[Dict[str, Any]]:
    """Filters records by dealer tenancy, branch assignment, staff role, and date boundaries."""
    user_role = user.get("role") or user.get("staff_role") or "SALES_EXECUTIVE"
    user_id = user.get("id")
    user_branch_id = user.get("branch_id")

    filtered: List[Dict[str, Any]] = []

    for item in records:
        # 1. Tenant Check
        item_dealer = item.get("dealer_id")
        if item_dealer and item_dealer != dealer_id:
            continue

        # 2. RBAC Scoping
        if user_role == "BRANCH_MANAGER":
            if user_branch_id and item.get(branch_field) != user_branch_id:
                continue
        elif user_role == "SALES_EXECUTIVE":
            # Executive sees items assigned to them or created by them
            item_staff = item.get(staff_field) or item.get("created_by_id")
            if item_staff and item_staff != user_id:
                continue

        # 3. Explicit Query Branch Filter
        if branch_id_param and branch_id_param != "ALL":
            if item.get(branch_field) != branch_id_param:
                continue

        # 4. Explicit Query Staff Filter
        if staff_id_param and staff_id_param != "ALL":
            if item.get(staff_field) != staff_id_param and item.get("created_by_id") != staff_id_param:
                continue

        # 5. Explicit Query Vehicle Model Filter
        if model_name_param and model_name_param != "ALL":
            item_model = item.get(model_field) or item.get("interested_model")
            if item_model and item_model.lower() != model_name_param.lower():
                continue

        # 6. Date Range Check
        if not is_record_in_date_range(item.get(date_field), start_bound, end_bound):
            continue

        filtered.append(item)

    return filtered


def get_analytics_overview(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Computes high-level KPI scorecard for the dealership analytics overview."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(
        f.get("date_range"), f.get("start_date"), f.get("end_date")
    )
    branch_id = f.get("branch_id")
    staff_id = f.get("staff_id")
    model_name = f.get("model_name")

    # Scoped leads
    scoped_leads = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=branch_id,
        staff_id_param=staff_id,
        model_name_param=model_name,
        start_bound=start_bound,
        end_bound=end_bound,
    )

    total_leads = len(scoped_leads)
    won_leads = sum(1 for l in scoped_leads if l.get("status") == "WON_BOOKED")
    conversion_rate = round((won_leads / total_leads * 100), 1) if total_leads > 0 else 0.0

    # Scoped follow-ups
    scoped_followups = apply_common_scoping(
        records=FOLLOW_UPS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=branch_id,
        staff_id_param=staff_id,
        start_bound=start_bound,
        end_bound=end_bound,
        date_field="scheduled_at",
    )
    completed_fu = sum(1 for fu in scoped_followups if fu.get("status") == "COMPLETED")
    overdue_fu = sum(1 for fu in scoped_followups if fu.get("status") == "OVERDUE")
    total_eval_fu = completed_fu + overdue_fu
    followup_compliance = round((completed_fu / total_eval_fu * 100), 1) if total_eval_fu > 0 else 100.0

    # Scoped inventory
    scoped_inventory = apply_common_scoping(
        records=INVENTORY_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=branch_id,
        model_name_param=model_name,
        start_bound=start_bound,
        end_bound=end_bound,
    )
    in_stock_units = sum(
        item.get("stock_quantity", 1)
        for item in scoped_inventory
        if item.get("status") == "IN_STOCK"
    )
    inventory_asset_value = sum(
        item.get("ex_showroom_price", 0) * item.get("stock_quantity", 1)
        for item in scoped_inventory
        if item.get("status") == "IN_STOCK"
    )

    # Scoped quotations
    scoped_quotations = apply_common_scoping(
        records=QUOTATIONS_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=branch_id,
        staff_id_param=staff_id,
        model_name_param=model_name,
        start_bound=start_bound,
        end_bound=end_bound,
        staff_field="created_by_id",
    )
    active_pipeline_val = sum(
        q.get("net_on_road_price", 0)
        for q in scoped_quotations
        if q.get("quotation_status") in ["SUBMITTED", "ACCEPTED"]
    )
    accepted_quotes = sum(1 for q in scoped_quotations if q.get("quotation_status") == "ACCEPTED")
    resolved_quotes = sum(
        1 for q in scoped_quotations if q.get("quotation_status") in ["ACCEPTED", "REJECTED", "EXPIRED"]
    )
    quote_acceptance_rate = (
        round((accepted_quotes / resolved_quotes * 100), 1) if resolved_quotes > 0 else 0.0
    )

    # Campaigns
    dealer_campaigns = [
        c for c in CAMPAIGNS_DB.values()
        if c.get("dealer_id") == dealer_id and c.get("is_active") is True
    ]
    active_campaigns_count = len(dealer_campaigns)

    # Group Opportunities
    open_opps = sum(1 for opp in GROUP_OPPORTUNITIES_DB if opp.get("status") == "ACTIVE")

    return {
        "total_enquiries": total_leads,
        "total_leads": total_leads,
        "active_pipeline_value": active_pipeline_val,
        "conversion_rate_pct": conversion_rate,
        "inventory_units_in_stock": in_stock_units,
        "inventory_asset_value": inventory_asset_value,
        "followup_compliance_pct": followup_compliance,
        "quotation_acceptance_pct": quote_acceptance_rate,
        "active_campaigns_count": active_campaigns_count,
        "open_group_opportunities_count": open_opps,
        "as_of_date": datetime.now(timezone.utc).isoformat(),
    }


def generate_enquiry_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 1: Enquiry volume, channel distribution, and response breakdown."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))
    records = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    total_count = len(records)
    channel_counts: Dict[str, int] = {}
    model_counts: Dict[str, int] = {}
    branch_counts: Dict[str, int] = {}

    for r in records:
        src = r.get("source", "UNKNOWN")
        channel_counts[src] = channel_counts.get(src, 0) + 1

        mdl = r.get("model_name", "Unspecified")
        model_counts[mdl] = model_counts.get(mdl, 0) + 1

        br = r.get("branch_name", "Main Dealership")
        branch_counts[br] = branch_counts.get(br, 0) + 1

    channel_chart = [
        {
            "label": k.replace("_", " ").title(),
            "value": v,
            "percentage": round(v / total_count * 100, 1) if total_count > 0 else 0.0,
            "color": "#3B82F6",
        }
        for k, v in sorted(channel_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    model_chart = [
        {
            "label": k,
            "value": v,
            "percentage": round(v / total_count * 100, 1) if total_count > 0 else 0.0,
            "color": "#10B981",
        }
        for k, v in sorted(model_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    summary_cards = [
        {
            "title": "Total Inflow Enquiries",
            "value": total_count,
            "description": "Verified customer demand enquiries",
        },
        {
            "title": "Top Channel",
            "value": channel_chart[0]["label"] if channel_chart else "None",
            "description": f"{channel_chart[0]['value']} enquiries" if channel_chart else "No data",
        },
        {
            "title": "Highest Demand Model",
            "value": model_chart[0]["label"] if model_chart else "None",
            "description": f"{model_chart[0]['value']} enquiries" if model_chart else "No data",
        },
        {
            "title": "Active Showrooms",
            "value": len(branch_counts),
            "description": "Branches receiving demand",
        },
    ]

    metric_explanations = [
        {
            "metric_name": "Enquiry Volume",
            "formula": "Count of incoming verified customer records",
            "description": "Aggregate volume of buyer intent submitted via online portal, walk-in visits, or buyer group pools.",
        },
        {
            "metric_name": "Channel Share (%)",
            "formula": "(Channel Specific Enquiries / Total Enquiries) * 100",
            "description": "Proportional contribution of each acquisition channel to showroom inflow.",
        },
    ]

    table_columns = [
        {"key": "lead_id", "label": "Lead ID", "align": "left"},
        {"key": "customer_name", "label": "Customer", "align": "left"},
        {"key": "model_name", "label": "Vehicle Model", "align": "left"},
        {"key": "variant_name", "label": "Variant", "align": "left"},
        {"key": "source", "label": "Channel", "align": "center"},
        {"key": "branch_name", "label": "Showroom Branch", "align": "left"},
        {"key": "assigned_to_name", "label": "Sales Executive", "align": "left"},
        {"key": "created_at", "label": "Enquiry Date", "align": "center"},
    ]

    data_rows = [
        {
            "lead_id": r.get("id"),
            "customer_name": r.get("customer_name"),
            "model_name": r.get("model_name"),
            "variant_name": r.get("variant_name"),
            "source": r.get("source", "").replace("_", " ").title(),
            "branch_name": r.get("branch_name"),
            "assigned_to_name": r.get("assigned_to_name") or "Unassigned",
            "created_at": r.get("created_at", "")[:10],
        }
        for r in records
    ]

    return {
        "report_type": "ENQUIRY",
        "report_title": "Enquiry Channel and Demand Report",
        "report_description": "Comprehensive analysis of incoming customer enquiries across marketing channels, vehicle models, and branches.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Acquisition Channel Share", "type": "bar", "items": channel_chart},
            {"title": "Vehicle Model Demand", "type": "bar", "items": model_chart},
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_lead_status_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 2: Full sales pipeline stages and funnel conversion."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))
    records = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    stage_order = [
        "NEW_ENQUIRY",
        "CONTACTED",
        "TEST_DRIVE_SCHEDULED",
        "TEST_DRIVE_COMPLETED",
        "QUOTATION_SENT",
        "NEGOTIATION",
        "WON_BOOKED",
        "LOST_CLOSED",
    ]

    stage_counts = {s: 0 for s in stage_order}
    for r in records:
        st = r.get("status", "NEW_ENQUIRY")
        if st in stage_counts:
            stage_counts[st] += 1
        else:
            stage_counts["NEW_ENQUIRY"] += 1

    total_leads = len(records)
    won = stage_counts["WON_BOOKED"]
    lost = stage_counts["LOST_CLOSED"]
    concluded = won + lost
    win_rate = round(won / concluded * 100, 1) if concluded > 0 else 0.0
    active_pipeline = total_leads - won - lost

    funnel_chart = [
        {
            "label": s.replace("_", " ").title(),
            "value": stage_counts[s],
            "percentage": round(stage_counts[s] / total_leads * 100, 1) if total_leads > 0 else 0.0,
            "color": "#10B981" if s == "WON_BOOKED" else ("#EF4444" if s == "LOST_CLOSED" else "#3B82F6"),
        }
        for s in stage_order
    ]

    summary_cards = [
        {"title": "Total Tracked Leads", "value": total_leads, "description": "Scoped leads in pipeline"},
        {"title": "Active Pipeline", "value": active_pipeline, "description": "Leads in negotiation/test drive"},
        {"title": "Won Deals", "value": won, "description": "Customer bookings delivered/won"},
        {"title": "Win Rate", "value": f"{win_rate}%", "description": "Won bookings over concluded deals"},
    ]

    metric_explanations = [
        {
            "metric_name": "Win Rate (%)",
            "formula": "(Won Booked Leads / (Won Booked Leads + Lost Closed Leads)) * 100",
            "description": "Calculates closing efficiency on fully concluded customer engagements.",
        },
        {
            "metric_name": "Active Pipeline Volume",
            "formula": "Total Leads - Won Deals - Lost Deals",
            "description": "Current active work-in-progress enquiries being nurtured by sales staff.",
        },
    ]

    table_columns = [
        {"key": "status", "label": "Funnel Stage", "align": "left"},
        {"key": "count", "label": "Lead Count", "align": "center"},
        {"key": "percentage", "label": "Stage Proportion", "align": "center", "is_percentage": True},
        {"key": "status_class", "label": "Lifecycle Group", "align": "left"},
    ]

    data_rows = []
    for s in stage_order:
        cnt = stage_counts[s]
        pct = round(cnt / total_leads * 100, 1) if total_leads > 0 else 0.0
        grp = "Concluded" if s in ["WON_BOOKED", "LOST_CLOSED"] else "In-Progress"
        data_rows.append({
            "status": s.replace("_", " ").title(),
            "count": cnt,
            "percentage": pct,
            "status_class": grp,
        })

    return {
        "report_type": "LEAD_STATUS",
        "report_title": "Lead Status and Funnel Stage Report",
        "report_description": "Visibility into showroom pipeline progression from initial enquiry to final vehicle delivery.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Sales Funnel Distribution", "type": "funnel", "items": funnel_chart}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_lead_assignment_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 3: Lead allocation balance and executive assignment velocity."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))
    records = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    staff_alloc: Dict[str, Dict[str, Any]] = {}
    unassigned_count = 0

    for r in records:
        assignee_id = r.get("assigned_to_id")
        assignee_name = r.get("assigned_to_name")
        branch_name = r.get("branch_name", "Unassigned")
        status = r.get("status", "NEW_ENQUIRY")

        if not assignee_id:
            unassigned_count += 1
            continue

        if assignee_id not in staff_alloc:
            staff_alloc[assignee_id] = {
                "staff_id": assignee_id,
                "staff_name": assignee_name or "Sales Executive",
                "branch_name": branch_name,
                "total_assigned": 0,
                "active_leads": 0,
                "won_deals": 0,
                "lost_deals": 0,
            }

        entry = staff_alloc[assignee_id]
        entry["total_assigned"] += 1
        if status == "WON_BOOKED":
            entry["won_deals"] += 1
        elif status == "LOST_CLOSED":
            entry["lost_deals"] += 1
        else:
            entry["active_leads"] += 1

    total_leads = len(records)
    assigned_count = total_leads - unassigned_count
    staff_count = len(staff_alloc)
    avg_per_rep = round(assigned_count / staff_count, 1) if staff_count > 0 else 0.0

    chart_items = [
        {
            "label": data["staff_name"],
            "value": data["total_assigned"],
            "secondary_value": data["active_leads"],
            "percentage": round(data["total_assigned"] / total_leads * 100, 1) if total_leads > 0 else 0.0,
            "color": "#6366F1",
        }
        for data in staff_alloc.values()
    ]

    summary_cards = [
        {"title": "Assigned Leads", "value": assigned_count, "description": "Under active executive care"},
        {"title": "Unassigned Queue", "value": unassigned_count, "description": "Awaiting management assignment"},
        {"title": "Active Executives", "value": staff_count, "description": "Sales executives handling enquiries"},
        {"title": "Average Load", "value": f"{avg_per_rep} leads", "description": "Per executive assignment load"},
    ]

    metric_explanations = [
        {
            "metric_name": "Allocation Share (%)",
            "formula": "(Executive Assigned Leads / Total Assigned Leads) * 100",
            "description": "Workload balance indicator to prevent rep burnout or neglected leads.",
        },
        {
            "metric_name": "Unassigned Queue Ratio (%)",
            "formula": "(Unassigned Enquiries / Total Inflow Enquiries) * 100",
            "description": "Measures response readiness; high numbers indicate intake bottleneck.",
        },
    ]

    table_columns = [
        {"key": "staff_name", "label": "Sales Executive", "align": "left"},
        {"key": "branch_name", "label": "Showroom Branch", "align": "left"},
        {"key": "total_assigned", "label": "Total Assigned", "align": "center"},
        {"key": "active_leads", "label": "Active Pipeline", "align": "center"},
        {"key": "won_deals", "label": "Won Bookings", "align": "center"},
        {"key": "lost_deals", "label": "Lost Leads", "align": "center"},
    ]

    data_rows = list(staff_alloc.values())
    if unassigned_count > 0:
        data_rows.append({
            "staff_id": "unassigned",
            "staff_name": "Unassigned Pool",
            "branch_name": "Showroom Queue",
            "total_assigned": unassigned_count,
            "active_leads": unassigned_count,
            "won_deals": 0,
            "lost_deals": 0,
        })

    return {
        "report_type": "LEAD_ASSIGNMENT",
        "report_title": "Lead Assignment and Workload Distribution Report",
        "report_description": "Operational tracking of sales team workload distribution and lead assignment coverage.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Executive Workload Distribution", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_followup_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 4: Follow-up compliance, overdue tasks, and showroom appointments."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))

    scoped_followups = apply_common_scoping(
        records=FOLLOW_UPS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        start_bound=start_bound,
        end_bound=end_bound,
        date_field="scheduled_at",
    )

    scoped_appts = apply_common_scoping(
        records=APPOINTMENTS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        start_bound=start_bound,
        end_bound=end_bound,
        date_field="appointment_time",
    )

    completed_fu = sum(1 for fu in scoped_followups if fu.get("status") == "COMPLETED")
    overdue_fu = sum(1 for fu in scoped_followups if fu.get("status") == "OVERDUE")
    pending_fu = sum(1 for fu in scoped_followups if fu.get("status") in ["PENDING", "TODAY", "UPCOMING"])
    total_fu = len(scoped_followups)

    evaluated_compliance_base = completed_fu + overdue_fu
    compliance_rate = (
        round(completed_fu / evaluated_compliance_base * 100, 1)
        if evaluated_compliance_base > 0
        else 100.0
    )

    total_appts = len(scoped_appts)
    completed_appts = sum(1 for a in scoped_appts if a.get("status") == "COMPLETED")
    no_show_appts = sum(1 for a in scoped_appts if a.get("status") == "NO_SHOW")

    chart_items = [
        {"label": "Completed Tasks", "value": completed_fu, "color": "#10B981"},
        {"label": "Pending Callbacks", "value": pending_fu, "color": "#3B82F6"},
        {"label": "Overdue Callbacks", "value": overdue_fu, "color": "#EF4444"},
    ]

    summary_cards = [
        {"title": "Total Follow-up Tasks", "value": total_fu, "description": "Scheduled customer interactions"},
        {"title": "Compliance Rate", "value": f"{compliance_rate}%", "description": "Completed callbacks vs overdue"},
        {"title": "Overdue Tasks", "value": overdue_fu, "description": "Missed follow-up milestones"},
        {"title": "Showroom Appointments", "value": total_appts, "description": f"{completed_appts} completed visits"},
    ]

    metric_explanations = [
        {
            "metric_name": "Follow-up Compliance Rate (%)",
            "formula": "(Completed Callbacks / (Completed Callbacks + Overdue Callbacks)) * 100",
            "description": "Measures discipline of sales executives in reaching out to prospects on time.",
        },
        {
            "metric_name": "Appointment Show Rate (%)",
            "formula": "(Completed Showroom Visits / Total Booked Showroom Appointments) * 100",
            "description": "Assesses showroom test-drive and customer visit attendance reliability.",
        },
    ]

    table_columns = [
        {"key": "title", "label": "Task / Appointment", "align": "left"},
        {"key": "customer_name", "label": "Customer", "align": "left"},
        {"key": "assigned_to_name", "label": "Sales Executive", "align": "left"},
        {"key": "type", "label": "Category", "align": "center"},
        {"key": "scheduled_at", "label": "Scheduled Time", "align": "center"},
        {"key": "status", "label": "Execution Status", "align": "center"},
    ]

    data_rows = []
    for fu in scoped_followups:
        data_rows.append({
            "title": fu.get("title", "Customer Callback"),
            "customer_name": fu.get("customer_name", "Prospect"),
            "assigned_to_name": fu.get("assigned_to_name") or "Unassigned",
            "type": fu.get("follow_up_type", "CALL").title(),
            "scheduled_at": fu.get("scheduled_at", "")[:16].replace("T", " "),
            "status": fu.get("status", "PENDING").title(),
        })

    for a in scoped_appts:
        data_rows.append({
            "title": f"Showroom Visit ({a.get('appointment_type', 'Showroom')})",
            "customer_name": a.get("customer_name", "Prospect"),
            "assigned_to_name": a.get("assigned_to_name") or "Showroom Rep",
            "type": "Appointment",
            "scheduled_at": a.get("appointment_time", "")[:16].replace("T", " "),
            "status": a.get("status", "SCHEDULED").title(),
        })

    return {
        "report_type": "FOLLOW_UP",
        "report_title": "Follow-up Compliance and Showroom Appointment Report",
        "report_description": "Monitors customer callback punctuality, overdue alert metrics, and scheduled showroom visits.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Follow-up Execution Status", "type": "donut", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_sales_conversion_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 5: Enquiry-to-delivery conversion %, velocity days, and model conversion rates."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))
    records = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    total_leads = len(records)
    won_leads = [r for r in records if r.get("status") == "WON_BOOKED"]
    lost_leads = [r for r in records if r.get("status") == "LOST_CLOSED"]
    test_drives = [r for r in records if r.get("status") in ["TEST_DRIVE_COMPLETED", "QUOTATION_SENT", "NEGOTIATION", "WON_BOOKED"]]

    gross_conv_rate = round(len(won_leads) / total_leads * 100, 1) if total_leads > 0 else 0.0
    td_conv_rate = round(len(won_leads) / len(test_drives) * 100, 1) if test_drives else 0.0

    # Model specific conversion
    model_stats: Dict[str, Dict[str, int]] = {}
    for r in records:
        mdl = r.get("model_name", "Other")
        if mdl not in model_stats:
            model_stats[mdl] = {"inflow": 0, "won": 0, "lost": 0}
        model_stats[mdl]["inflow"] += 1
        if r.get("status") == "WON_BOOKED":
            model_stats[mdl]["won"] += 1
        elif r.get("status") == "LOST_CLOSED":
            model_stats[mdl]["lost"] += 1

    chart_items = [
        {
            "label": mdl,
            "value": round(stats["won"] / stats["inflow"] * 100, 1) if stats["inflow"] > 0 else 0.0,
            "secondary_value": stats["won"],
            "color": "#10B981",
        }
        for mdl, stats in model_stats.items()
    ]

    summary_cards = [
        {"title": "Gross Lead-to-Delivery Rate", "value": f"{gross_conv_rate}%", "description": f"{len(won_leads)} bookings from {total_leads} enquiries"},
        {"title": "Test Drive Conversion", "value": f"{td_conv_rate}%", "description": "Completed drives converted to booking"},
        {"title": "Total Delivered Deals", "value": len(won_leads), "description": "Successfully converted bookings"},
        {"title": "Lost Opportunities", "value": len(lost_leads), "description": "Dropped out of pipeline"},
    ]

    metric_explanations = [
        {
            "metric_name": "Gross Lead-to-Delivery Rate (%)",
            "formula": "(Won Bookings / Total Inflow Enquiries) * 100",
            "description": "Primary conversion benchmark measuring end-to-end demand conversion.",
        },
        {
            "metric_name": "Test Drive to Booking Rate (%)",
            "formula": "(Won Bookings / Prospects Completing Test Drive) * 100",
            "description": "Measures physical showroom test-drive effectiveness in closing customer orders.",
        },
    ]

    table_columns = [
        {"key": "model_name", "label": "Vehicle Model", "align": "left"},
        {"key": "inflow", "label": "Enquiries Received", "align": "center"},
        {"key": "won", "label": "Won Bookings", "align": "center"},
        {"key": "lost", "label": "Lost Leads", "align": "center"},
        {"key": "conversion_rate", "label": "Conversion Rate", "align": "center", "is_percentage": True},
    ]

    data_rows = [
        {
            "model_name": mdl,
            "inflow": stats["inflow"],
            "won": stats["won"],
            "lost": stats["lost"],
            "conversion_rate": round(stats["won"] / stats["inflow"] * 100, 1) if stats["inflow"] > 0 else 0.0,
        }
        for mdl, stats in model_stats.items()
    ]

    return {
        "report_type": "SALES_CONVERSION",
        "report_title": "Sales Conversion and Velocity Report",
        "report_description": "Benchmarks lead-to-booking win rates, test drive efficacy, and vehicle model closing performance.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Vehicle Model Conversion Rates (%)", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_inventory_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 6: Inventory valuation, yard aging tiers, and powertrain distribution."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))
    records = apply_common_scoping(
        records=INVENTORY_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    in_stock_items = [r for r in records if r.get("status") == "IN_STOCK"]
    total_physical_units = sum(r.get("stock_quantity", 1) for r in in_stock_items)
    total_asset_value = sum(
        r.get("ex_showroom_price", 0) * r.get("stock_quantity", 1) for r in in_stock_items
    )

    # Aging Tiers
    tier_0_30 = 0
    tier_31_60 = 0
    tier_61_90 = 0
    tier_gt_90 = 0

    for r in in_stock_items:
        days = r.get("days_in_yard", 0)
        qty = r.get("stock_quantity", 1)
        if days <= 30:
            tier_0_30 += qty
        elif days <= 60:
            tier_31_60 += qty
        elif days <= 90:
            tier_61_90 += qty
        else:
            tier_gt_90 += qty

    aging_chart = [
        {"label": "Fresh Stock (0-30 Days)", "value": tier_0_30, "color": "#10B981"},
        {"label": "Standard Stock (31-60 Days)", "value": tier_31_60, "color": "#3B82F6"},
        {"label": "Aging Stock (61-90 Days)", "value": tier_61_90, "color": "#F59E0B"},
        {"label": "Critical Yard Aging (>90 Days)", "value": tier_gt_90, "color": "#EF4444"},
    ]

    summary_cards = [
        {"title": "Total Units In Stock", "value": total_physical_units, "description": "Physical yard inventory units"},
        {"title": "Yard Asset Valuation", "value": f"INR {total_asset_value:,.0f}", "description": "Ex-showroom valuation in stock"},
        {"title": "Fresh Inventory (<=30 Days)", "value": tier_0_30, "description": "Rapid turnaround vehicles"},
        {"title": "Critical Aging (>90 Days)", "value": tier_gt_90, "description": "Requires promotional clearance"},
    ]

    metric_explanations = [
        {
            "metric_name": "Yard Asset Valuation (INR)",
            "formula": "Sum of (Ex-Showroom Price * Stock Quantity) across units in IN_STOCK state",
            "description": "Calculates exact capital invested in physical unsold dealership inventory.",
        },
        {
            "metric_name": "Yard Aging Tiers",
            "formula": "Categorization by days_in_yard (0-30, 31-60, 61-90, >90 days)",
            "description": "Identifies slow-moving capital to trigger group-buy discounts or promotional campaigns.",
        },
    ]

    table_columns = [
        {"key": "model_name", "label": "Vehicle Model", "align": "left"},
        {"key": "variant_name", "label": "Variant", "align": "left"},
        {"key": "fuel_type", "label": "Fuel", "align": "center"},
        {"key": "transmission_type", "label": "Transmission", "align": "center"},
        {"key": "stock_quantity", "label": "Units", "align": "center"},
        {"key": "ex_showroom_price", "label": "Unit Price (INR)", "align": "right", "is_currency": True},
        {"key": "days_in_yard", "label": "Yard Days", "align": "center"},
        {"key": "yard_location", "label": "Yard Bay", "align": "left"},
    ]

    data_rows = [
        {
            "model_name": r.get("model_name"),
            "variant_name": r.get("variant_name"),
            "fuel_type": r.get("fuel_type"),
            "transmission_type": r.get("transmission_type"),
            "stock_quantity": r.get("stock_quantity", 1),
            "ex_showroom_price": r.get("ex_showroom_price", 0),
            "days_in_yard": r.get("days_in_yard", 0),
            "yard_location": r.get("yard_location", "Main Yard"),
        }
        for r in in_stock_items
    ]

    return {
        "report_type": "INVENTORY",
        "report_title": "Inventory Valuation and Yard Aging Report",
        "report_description": "Tracks on-hand physical vehicle inventory, working capital allocation, and yard aging tiers.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Yard Aging Distribution (Days)", "type": "bar", "items": aging_chart}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_branch_performance_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 7: Cross-showroom KPI comparison matrix."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))

    scoped_leads = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    scoped_inv = apply_common_scoping(
        records=INVENTORY_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    scoped_quotes = apply_common_scoping(
        records=QUOTATIONS_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    # Collate per branch
    branch_stats: Dict[str, Dict[str, Any]] = {}

    for b_id, b_meta in BRANCHES_DB.items():
        if b_meta.get("dealer_id") == dealer_id:
            # If user is BRANCH_MANAGER, limit strictly to user branch
            effective_role = user.get("role") or user.get("staff_role") or "SALES_EXECUTIVE"
            if effective_role == "BRANCH_MANAGER" and user.get("branch_id") != b_id:
                continue
            branch_stats[b_id] = {
                "branch_id": b_id,
                "branch_name": b_meta.get("branch_name") or b_meta.get("name", "Branch"),
                "city": b_meta.get("city", "Bengaluru"),
                "leads_count": 0,
                "won_bookings": 0,
                "quotes_count": 0,
                "in_stock_units": 0,
                "asset_value": 0,
            }

    for l in scoped_leads:
        b_id = l.get("branch_id")
        if b_id in branch_stats:
            branch_stats[b_id]["leads_count"] += 1
            if l.get("status") == "WON_BOOKED":
                branch_stats[b_id]["won_bookings"] += 1

    for q in scoped_quotes:
        b_id = q.get("branch_id")
        if b_id in branch_stats:
            branch_stats[b_id]["quotes_count"] += 1

    for i in scoped_inv:
        b_id = i.get("branch_id")
        if b_id in branch_stats and i.get("status") == "IN_STOCK":
            qty = i.get("stock_quantity", 1)
            branch_stats[b_id]["in_stock_units"] += qty
            branch_stats[b_id]["asset_value"] += i.get("ex_showroom_price", 0) * qty

    chart_items = [
        {
            "label": data["branch_name"].split(" ")[0],
            "value": data["won_bookings"],
            "secondary_value": data["leads_count"],
            "color": "#3B82F6",
        }
        for data in branch_stats.values()
    ]

    total_dealer_won = sum(b["won_bookings"] for b in branch_stats.values())
    total_dealer_leads = sum(b["leads_count"] for b in branch_stats.values())

    summary_cards = [
        {"title": "Tracked Showrooms", "value": len(branch_stats), "description": "Active dealership facilities"},
        {"title": "Total Dealer Bookings", "value": total_dealer_won, "description": f"Across {len(branch_stats)} showrooms"},
        {"title": "Total Inflow Leads", "value": total_dealer_leads, "description": "Combined customer interest"},
        {"title": "Combined Conversion", "value": f"{round(total_dealer_won / total_dealer_leads * 100, 1) if total_dealer_leads > 0 else 0.0}%", "description": "Network average conversion"},
    ]

    metric_explanations = [
        {
            "metric_name": "Showroom Conversion Efficiency (%)",
            "formula": "(Showroom Won Bookings / Showroom Allocated Leads) * 100",
            "description": "Compares closing effectiveness across showroom locations.",
        },
    ]

    table_columns = [
        {"key": "branch_name", "label": "Showroom Branch", "align": "left"},
        {"key": "city", "label": "City", "align": "center"},
        {"key": "leads_count", "label": "Leads", "align": "center"},
        {"key": "quotes_count", "label": "Quotations", "align": "center"},
        {"key": "won_bookings", "label": "Won Bookings", "align": "center"},
        {"key": "conversion_rate", "label": "Conversion Rate", "align": "center", "is_percentage": True},
        {"key": "in_stock_units", "label": "Yard Stock", "align": "center"},
        {"key": "asset_value", "label": "Asset Value (INR)", "align": "right", "is_currency": True},
    ]

    data_rows = []
    for b in branch_stats.values():
        l_cnt = b["leads_count"]
        w_cnt = b["won_bookings"]
        data_rows.append({
            "branch_name": b["branch_name"],
            "city": b["city"],
            "leads_count": l_cnt,
            "quotes_count": b["quotes_count"],
            "won_bookings": w_cnt,
            "conversion_rate": round(w_cnt / l_cnt * 100, 1) if l_cnt > 0 else 0.0,
            "in_stock_units": b["in_stock_units"],
            "asset_value": b["asset_value"],
        })

    return {
        "report_type": "BRANCH_PERFORMANCE",
        "report_title": "Branch Performance and Showroom Matrix Report",
        "report_description": "Cross-branch comparison of lead intake, sales bookings, quotation volume, and yard capital.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Won Bookings by Showroom", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_staff_performance_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 8: Sales representative scorecard, test drives, quotes, and closed revenue."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))

    scoped_leads = apply_common_scoping(
        records=LEADS_MASTER_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
    )

    staff_matrix: Dict[str, Dict[str, Any]] = {}

    for l in scoped_leads:
        s_id = l.get("assigned_to_id")
        if not s_id:
            continue
        s_name = l.get("assigned_to_name", "Executive")
        s_role = l.get("assigned_to_role", "SALES_EXECUTIVE")
        branch_name = l.get("branch_name", "Dealership")

        if s_id not in staff_matrix:
            staff_matrix[s_id] = {
                "staff_id": s_id,
                "staff_name": s_name,
                "role": s_role.replace("_", " ").title(),
                "branch_name": branch_name,
                "leads_handled": 0,
                "test_drives": 0,
                "quotes_sent": 0,
                "deals_closed": 0,
            }

        entry = staff_matrix[s_id]
        entry["leads_handled"] += 1
        st = l.get("status")
        if st in ["TEST_DRIVE_SCHEDULED", "TEST_DRIVE_COMPLETED", "QUOTATION_SENT", "NEGOTIATION", "WON_BOOKED"]:
            entry["test_drives"] += 1
        if st in ["QUOTATION_SENT", "NEGOTIATION", "WON_BOOKED"]:
            entry["quotes_sent"] += 1
        if st == "WON_BOOKED":
            entry["deals_closed"] += 1

    chart_items = [
        {
            "label": data["staff_name"],
            "value": data["deals_closed"],
            "secondary_value": data["leads_handled"],
            "color": "#10B981",
        }
        for data in staff_matrix.values()
    ]

    total_reps = len(staff_matrix)
    total_closed = sum(s["deals_closed"] for s in staff_matrix.values())

    summary_cards = [
        {"title": "Staff Tracked", "value": total_reps, "description": "Active sales personnel in scope"},
        {"title": "Total Deals Closed", "value": total_closed, "description": "Delivered vehicle bookings"},
        {"title": "Average Deals / Rep", "value": round(total_closed / total_reps, 1) if total_reps > 0 else 0.0, "description": "Productivity per executive"},
    ]

    metric_explanations = [
        {
            "metric_name": "Executive Conversion Rate (%)",
            "formula": "(Deals Closed / Total Leads Assigned) * 100",
            "description": "Measures closing productivity and efficiency for each individual sales executive.",
        },
    ]

    table_columns = [
        {"key": "staff_name", "label": "Executive Name", "align": "left"},
        {"key": "role", "label": "Role", "align": "center"},
        {"key": "branch_name", "label": "Branch", "align": "left"},
        {"key": "leads_handled", "label": "Assigned Leads", "align": "center"},
        {"key": "test_drives", "label": "Test Drives", "align": "center"},
        {"key": "quotes_sent", "label": "Quotations", "align": "center"},
        {"key": "deals_closed", "label": "Deals Closed", "align": "center"},
        {"key": "conversion_rate", "label": "Win Rate", "align": "center", "is_percentage": True},
    ]

    data_rows = []
    for s in staff_matrix.values():
        l_cnt = s["leads_handled"]
        c_cnt = s["deals_closed"]
        data_rows.append({
            "staff_name": s["staff_name"],
            "role": s["role"],
            "branch_name": s["branch_name"],
            "leads_handled": l_cnt,
            "test_drives": s["test_drives"],
            "quotes_sent": s["quotes_sent"],
            "deals_closed": c_cnt,
            "conversion_rate": round(c_cnt / l_cnt * 100, 1) if l_cnt > 0 else 0.0,
        })

    return {
        "report_type": "STAFF_PERFORMANCE",
        "report_title": "Staff Performance Scorecard Report",
        "report_description": "Individual sales executive scorecards tracking pipeline activity, test drives, quotations, and closed deals.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Deals Closed by Executive", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_quotation_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 9: Quotation pipeline valuation, discounts, and acceptance rate."""
    f = filters or {}
    start_bound, end_bound = calculate_date_bounds(f.get("date_range"), f.get("start_date"), f.get("end_date"))

    records = apply_common_scoping(
        records=QUOTATIONS_DB,
        user=user,
        dealer_id=dealer_id,
        branch_id_param=f.get("branch_id"),
        staff_id_param=f.get("staff_id"),
        model_name_param=f.get("model_name"),
        start_bound=start_bound,
        end_bound=end_bound,
        staff_field="created_by_id",
    )

    total_quotes = len(records)
    total_pipeline_val = sum(q.get("net_on_road_price", 0) for q in records)
    total_discounts = sum(q.get("total_group_discount", 0) for q in records)
    avg_quote_val = round(total_pipeline_val / total_quotes) if total_quotes > 0 else 0

    accepted = sum(1 for q in records if q.get("quotation_status") == "ACCEPTED")
    rejected = sum(1 for q in records if q.get("quotation_status") == "REJECTED")
    expired = sum(1 for q in records if q.get("quotation_status") == "EXPIRED")
    resolved = accepted + rejected + expired
    acceptance_rate = round(accepted / resolved * 100, 1) if resolved > 0 else 0.0

    status_counts: Dict[str, int] = {}
    for q in records:
        st = q.get("quotation_status", "DRAFT")
        status_counts[st] = status_counts.get(st, 0) + 1

    chart_items = [
        {
            "label": st.title(),
            "value": cnt,
            "color": "#10B981" if st == "ACCEPTED" else ("#EF4444" if st in ["REJECTED", "EXPIRED"] else "#3B82F6"),
        }
        for st, cnt in status_counts.items()
    ]

    summary_cards = [
        {"title": "Total Quotations", "value": total_quotes, "description": "Formally generated price quotes"},
        {"title": "Quotation Pipeline Value", "value": f"INR {total_pipeline_val:,.0f}", "description": "Aggregate on-road quote value"},
        {"title": "Total Group Discounts", "value": f"INR {total_discounts:,.0f}", "description": "Collective discount value passed to buyers"},
        {"title": "Acceptance Rate", "value": f"{acceptance_rate}%", "description": "Accepted quotes over resolved offers"},
    ]

    metric_explanations = [
        {
            "metric_name": "Quotation Acceptance Rate (%)",
            "formula": "(Accepted Quotations / (Accepted + Rejected + Expired Quotations)) * 100",
            "description": "Measures pricing competitiveness and proposal success rate.",
        },
        {
            "metric_name": "Pipeline Valuation (INR)",
            "formula": "Sum of Net On-Road Price across all quotation records",
            "description": "Calculates commercial value of outstanding commercial proposals.",
        },
    ]

    table_columns = [
        {"key": "quotation_number", "label": "Quote Code", "align": "left"},
        {"key": "customer_name", "label": "Customer", "align": "left"},
        {"key": "model_name", "label": "Model", "align": "left"},
        {"key": "variant_name", "label": "Variant", "align": "left"},
        {"key": "net_on_road_price", "label": "On-Road Price (INR)", "align": "right", "is_currency": True},
        {"key": "total_group_discount", "label": "Discount (INR)", "align": "right", "is_currency": True},
        {"key": "quotation_status", "label": "Status", "align": "center"},
        {"key": "valid_until", "label": "Validity", "align": "center"},
    ]

    data_rows = [
        {
            "quotation_number": q.get("quotation_number"),
            "customer_name": q.get("customer_name"),
            "model_name": q.get("model_name"),
            "variant_name": q.get("variant_name"),
            "net_on_road_price": q.get("net_on_road_price", 0),
            "total_group_discount": q.get("total_group_discount", 0),
            "quotation_status": q.get("quotation_status", "DRAFT").title(),
            "valid_until": q.get("valid_until", "")[:10],
        }
        for q in records
    ]

    return {
        "report_type": "QUOTATION",
        "report_title": "Quotation Pipeline and Discount Report",
        "report_description": "Financial evaluation of issued quotations, net on-road revenue pipeline, and pricing discount margins.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Quotation Status Distribution", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_group_opportunity_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 10: Collective buying pool demand, quota allocation, and dealer bids."""
    f = filters or {}
    total_opps = len(GROUP_OPPORTUNITIES_DB)
    active_opps = [o for o in GROUP_OPPORTUNITIES_DB if o.get("status") == "ACTIVE"]

    total_demand_target = sum(o.get("min_members_threshold", 0) for o in active_opps)
    current_pool_members = sum(o.get("current_members_count", 0) for o in active_opps)
    demand_fulfillment = (
        round(current_pool_members / total_demand_target * 100, 1)
        if total_demand_target > 0
        else 0.0
    )

    dealer_interests = [
        intr for intr in DEALER_INTERESTS_DB.values() if intr.get("dealer_id") == dealer_id
    ]
    allocated_stock_commitments = sum(
        intr.get("stock_allocation_commitment", 0) for intr in dealer_interests
    )

    chart_items = [
        {
            "label": o.get("model_name", "Vehicle"),
            "value": o.get("current_members_count", 0),
            "secondary_value": o.get("min_members_threshold", 0),
            "color": "#6366F1",
        }
        for o in active_opps
    ]

    summary_cards = [
        {"title": "Active Group Pools", "value": len(active_opps), "description": "Open demand aggregation pools"},
        {"title": "Collective Demand", "value": f"{current_pool_members} buyers", "description": f"Target: {total_demand_target} buyers"},
        {"title": "Demand Fulfillment", "value": f"{demand_fulfillment}%", "description": "Group formation progress"},
        {"title": "Dealer Committed Units", "value": allocated_stock_commitments, "description": "Stock committed across group bids"},
    ]

    metric_explanations = [
        {
            "metric_name": "Group Demand Fulfillment Rate (%)",
            "formula": "(Current Pool Members / Target Members Threshold) * 100",
            "description": "Progress of collective buying pools reaching activation threshold.",
        },
        {
            "metric_name": "Stock Commitment Quota",
            "formula": "Sum of inventory units pledged by dealership to meet group demand",
            "description": "Guarantees vehicle allocation to win collective group contracts.",
        },
    ]

    table_columns = [
        {"key": "group_code", "label": "Pool Code", "align": "left"},
        {"key": "model_name", "label": "Vehicle Model", "align": "left"},
        {"key": "city", "label": "RTO Location", "align": "center"},
        {"key": "current_members", "label": "Joined Buyers", "align": "center"},
        {"key": "target_threshold", "label": "Target Quota", "align": "center"},
        {"key": "status", "label": "Pool Status", "align": "center"},
        {"key": "quoting_deadline", "label": "Bid Deadline", "align": "center"},
    ]

    data_rows = [
        {
            "group_code": o.get("group_code"),
            "model_name": o.get("model_name"),
            "city": o.get("city"),
            "current_members": o.get("current_members_count", 0),
            "target_threshold": o.get("min_members_threshold", 0),
            "status": o.get("status", "ACTIVE").title(),
            "quoting_deadline": o.get("quoting_deadline", "")[:10],
        }
        for o in active_opps
    ]

    return {
        "report_type": "GROUP_OPPORTUNITY",
        "report_title": "Group Purchasing Opportunities and Collective Demand Report",
        "report_description": "Monitors customer volume pooling demand, target member thresholds, and dealership quota allocations.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Collective Buying Demand by Vehicle", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


def generate_campaign_performance_report(
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Report 11: Promotional campaigns, impressions, CTR %, and converted bookings."""
    f = filters or {}
    dealer_campaigns = [
        c for c in CAMPAIGNS_DB.values() if c.get("dealer_id") == dealer_id
    ]

    total_campaigns = len(dealer_campaigns)
    active_campaigns = [c for c in dealer_campaigns if c.get("is_active") is True]

    total_impressions = sum(c.get("performance", {}).get("impressions", 0) for c in dealer_campaigns)
    total_clicks = sum(c.get("performance", {}).get("clicks", 0) for c in dealer_campaigns)
    total_enquiries = sum(c.get("performance", {}).get("enquiries_generated", 0) for c in dealer_campaigns)
    total_test_drives = sum(c.get("performance", {}).get("test_drives_booked", 0) for c in dealer_campaigns)
    total_bookings = sum(c.get("performance", {}).get("bookings_won", 0) for c in dealer_campaigns)

    ctr = round(total_clicks / total_impressions * 100, 2) if total_impressions > 0 else 0.0
    lead_to_booking = (
        round(total_bookings / total_enquiries * 100, 1) if total_enquiries > 0 else 0.0
    )

    chart_items = [
        {
            "label": c.get("title", "Campaign"),
            "value": c.get("performance", {}).get("bookings_won", 0),
            "secondary_value": c.get("performance", {}).get("enquiries_generated", 0),
            "color": "#3B82F6",
        }
        for c in dealer_campaigns
    ]

    summary_cards = [
        {"title": "Active Campaigns", "value": len(active_campaigns), "description": f"Out of {total_campaigns} total campaigns"},
        {"title": "Total Impressions", "value": f"{total_impressions:,}", "description": "Dealership ad views"},
        {"title": "Click-Through Rate (CTR)", "value": f"{ctr}%", "description": f"{total_clicks:,} buyer ad clicks"},
        {"title": "Campaign Won Bookings", "value": total_bookings, "description": f"{lead_to_booking}% conversion from enquiries"},
    ]

    metric_explanations = [
        {
            "metric_name": "Click-Through Rate (CTR %)",
            "formula": "(Total Ad Clicks / Total Ad Impressions) * 100",
            "description": "Measures creative attractiveness and banner engagement.",
        },
        {
            "metric_name": "Campaign Closing Efficiency (%)",
            "formula": "(Won Bookings / Enquiries Generated) * 100",
            "description": "Measures quality of leads generated by marketing campaigns.",
        },
    ]

    table_columns = [
        {"key": "campaign_code", "label": "Code", "align": "left"},
        {"key": "title", "label": "Campaign Name", "align": "left"},
        {"key": "status", "label": "Status", "align": "center"},
        {"key": "impressions", "label": "Impressions", "align": "right"},
        {"key": "clicks", "label": "Clicks", "align": "right"},
        {"key": "enquiries", "label": "Enquiries", "align": "center"},
        {"key": "test_drives", "label": "Test Drives", "align": "center"},
        {"key": "bookings_won", "label": "Bookings Won", "align": "center"},
    ]

    data_rows = [
        {
            "campaign_code": c.get("campaign_code"),
            "title": c.get("title"),
            "status": c.get("status", "ACTIVE").title(),
            "impressions": c.get("performance", {}).get("impressions", 0),
            "clicks": c.get("performance", {}).get("clicks", 0),
            "enquiries": c.get("performance", {}).get("enquiries_generated", 0),
            "test_drives": c.get("performance", {}).get("test_drives_booked", 0),
            "bookings_won": c.get("performance", {}).get("bookings_won", 0),
        }
        for c in dealer_campaigns
    ]

    return {
        "report_type": "CAMPAIGN_PERFORMANCE",
        "report_title": "Marketing Campaign and Offer Performance Report",
        "report_description": "Evaluates promotional marketing reaches, digital engagement, and booking attribution.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "filters_applied": f,
        "metric_explanations": metric_explanations,
        "summary_cards": summary_cards,
        "breakdown_charts": [
            {"title": "Bookings Won by Promotional Campaign", "type": "bar", "items": chart_items}
        ],
        "table_columns": table_columns,
        "data_rows": data_rows,
        "total_rows": len(data_rows),
    }


# Router dispatcher for 11 report types
REPORT_GENERATORS = {
    "ENQUIRY": generate_enquiry_report,
    "LEAD_STATUS": generate_lead_status_report,
    "LEAD_ASSIGNMENT": generate_lead_assignment_report,
    "FOLLOW_UP": generate_followup_report,
    "SALES_CONVERSION": generate_sales_conversion_report,
    "INVENTORY": generate_inventory_report,
    "BRANCH_PERFORMANCE": generate_branch_performance_report,
    "STAFF_PERFORMANCE": generate_staff_performance_report,
    "QUOTATION": generate_quotation_report,
    "GROUP_OPPORTUNITY": generate_group_opportunity_report,
    "CAMPAIGN_PERFORMANCE": generate_campaign_performance_report,
}


def get_report_data(
    report_type: str,
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Dispatches report generation to corresponding specialist calculator."""
    clean_type = report_type.upper()
    generator = REPORT_GENERATORS.get(clean_type)
    if not generator:
        raise ValueError(f"Unsupported report type '{report_type}'. Available: {list(REPORT_GENERATORS.keys())}")
    return generator(user=user, dealer_id=dealer_id, filters=filters)


def generate_report_csv(
    report_type: str,
    user: Dict[str, Any],
    dealer_id: str,
    filters: Optional[Dict[str, Any]] = None,
) -> str:
    """Renders the tabular data rows of a report as an RFC 4180 CSV string."""
    report = get_report_data(report_type, user, dealer_id, filters)
    columns = report.get("table_columns", [])
    data_rows = report.get("data_rows", [])

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # 1. Header row
    headers = [col.get("label", col.get("key")) for col in columns]
    writer.writerow(headers)

    # 2. Data rows
    keys = [col.get("key") for col in columns]
    for row in data_rows:
        row_vals = []
        for k in keys:
            val = row.get(k, "")
            row_vals.append(val)
        writer.writerow(row_vals)

    return output.getvalue()
