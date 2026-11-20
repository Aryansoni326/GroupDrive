from typing import Dict, Any, Optional, List
import datetime
from src.core.catalogue_store import get_variant_by_id, get_model_by_id
from src.core.identity_store import BRANCHES_DB

INVENTORY_MASTER_DB: List[Dict[str, Any]] = [
    {
        "id": "inv-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "variant_id": "var-brz-zxi-plus",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission_type": "Automatic",
        "colour_id": "col-red-blk",
        "colour_name": "Sizzling Red with Midnight Black",
        "vin": "MA3EYD21SNG104821",
        "stock_serial_number": "KY-2026-0842",
        "manufacturing_month_year": "09-2026",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "days_in_yard": 12,
        "yard_location": "Bay 3A - Whitefield Yard",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1398000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "notes": "PDI inspected. Front display unit.",
        "created_at": "2026-10-25T08:00:00Z",
        "updated_at": "2026-11-01T09:00:00Z",
    },
    {
        "id": "inv-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "variant_id": "var-brz-zxi",
        "variant_name": "ZXi 1.5L 5MT",
        "fuel_type": "Petrol",
        "transmission_type": "Manual",
        "colour_id": "col-pearl-white",
        "colour_name": "Pearl Arctic White",
        "vin": "MA3EYD21SNG104899",
        "stock_serial_number": "KY-2026-0855",
        "manufacturing_month_year": "09-2026",
        "status": "IN_STOCK",
        "stock_quantity": 2,
        "days_in_yard": 18,
        "yard_location": "Bay 4C - Whitefield Yard",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1114000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "notes": "Fast-moving inventory. Popular white trim.",
        "created_at": "2026-10-19T08:00:00Z",
        "updated_at": "2026-10-28T10:00:00Z",
    },
    {
        "id": "inv-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "branch_name": "Bannerghatta Flagship Showroom",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-gvitara-01",
        "model_name": "Grand Vitara",
        "variant_id": "var-gv-alpha-at",
        "variant_name": "Alpha 1.5L Intelligent Electric Hybrid e-CVT",
        "fuel_type": "Strong Hybrid",
        "transmission_type": "e-CVT",
        "colour_id": "col-opulent-red",
        "colour_name": "Opulent Red with Black Roof",
        "vin": "MA3GVB11SNG209110",
        "stock_serial_number": "KY-2026-0711",
        "manufacturing_month_year": "08-2026",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "days_in_yard": 54,
        "yard_location": "Showroom Display - Bay 1",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1983000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80",
        "notes": "Aging stock alert. Targeted for corporate buyer group campaign.",
        "created_at": "2026-09-13T09:30:00Z",
        "updated_at": "2026-10-15T11:00:00Z",
    },
    {
        "id": "inv-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-hosur-yard-03",
        "branch_name": "Hosur Road Central Stockyard",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-swift-01",
        "model_name": "Swift 2026",
        "variant_id": "var-swf-zxi-mt",
        "variant_name": "ZXi 1.2L DualJet 5MT",
        "fuel_type": "Petrol",
        "transmission_type": "Manual",
        "colour_id": "col-luster-blue",
        "colour_name": "Luster Blue",
        "vin": "MA3SWF01SNG304122",
        "stock_serial_number": "KY-2026-0912",
        "manufacturing_month_year": "10-2026",
        "status": "ALLOCATED_TO_GROUP",
        "stock_quantity": 1,
        "days_in_yard": 8,
        "yard_location": "Hosur Yard - Transit Row 2",
        "is_available_for_flash_sale": False,
        "is_available_for_group_buy": False,
        "ex_showroom_price": 829000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80",
        "notes": "Reserved for Buyer Group GD-BLR-SWF-01.",
        "created_at": "2026-10-29T10:00:00Z",
        "updated_at": "2026-11-02T14:30:00Z",
    },
    {
        "id": "inv-005",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-hosur-yard-03",
        "branch_name": "Hosur Road Central Stockyard",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-fronx-01",
        "model_name": "Fronx",
        "variant_id": "var-frx-zeta-turbo",
        "variant_name": "Zeta 1.0L BoosterJet 6AT",
        "fuel_type": "Petrol",
        "transmission_type": "Automatic",
        "colour_id": "col-grandeur-grey",
        "colour_name": "Grandeur Grey",
        "vin": "MA3FRX11SNG401988",
        "stock_serial_number": "KY-2026-0640",
        "manufacturing_month_year": "07-2026",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "days_in_yard": 85,
        "yard_location": "Hosur Yard - Clearance Bay 9",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1205000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80",
        "notes": "Critical aging threshold. Immediate flash campaign requested.",
        "created_at": "2026-08-13T11:00:00Z",
        "updated_at": "2026-10-30T16:00:00Z",
    },
    {
        "id": "inv-006",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "variant_id": "var-brz-vxi-cng",
        "variant_name": "VXi 1.5L S-CNG 5MT",
        "fuel_type": "CNG",
        "transmission_type": "Manual",
        "colour_id": "col-magma-grey",
        "colour_name": "Magma Grey",
        "vin": "MA3EYD21SNG109844",
        "stock_serial_number": "KY-2026-0955",
        "manufacturing_month_year": "10-2026",
        "status": "IN_TRANSIT",
        "stock_quantity": 3,
        "days_in_yard": 2,
        "yard_location": "Dispatched from Plant - Carrier KA-01-E-9090",
        "is_available_for_flash_sale": False,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1065000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "notes": "Expected yard arrival within 48 hours.",
        "created_at": "2026-11-04T08:00:00Z",
        "updated_at": "2026-11-04T08:00:00Z",
    },
    # Rival Dealership Inventory (for multi-tenant isolation verification)
    {
        "id": "inv-999",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "branch_name": "Advaith Hyundai Residency Road",
        "brand_name": "Hyundai",
        "model_id": "mod-creta-01",
        "model_name": "Creta",
        "variant_id": "var-creta-sx",
        "variant_name": "SX(O) 1.5L IVT",
        "fuel_type": "Petrol",
        "transmission_type": "IVT",
        "colour_id": "col-abyss-black",
        "colour_name": "Abyss Black Pearl",
        "vin": "MALC2811SNG998877",
        "stock_serial_number": "AD-2026-0112",
        "manufacturing_month_year": "09-2026",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "days_in_yard": 10,
        "yard_location": "Residency Yard",
        "is_available_for_flash_sale": False,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1870000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
        "notes": "Advaith Hyundai internal stock.",
        "created_at": "2026-10-01T10:00:00Z",
        "updated_at": "2026-10-01T10:00:00Z",
    },
    {
        "id": "inv-concorde-01",
        "dealer_id": "dlr-concorde-mum-003",
        "branch_id": "br-concorde-andheri-01",
        "branch_name": "Concorde Tata Andheri Flagship Showroom",
        "brand_name": "Tata",
        "model_id": "mod-nexon-ev-01",
        "model_name": "Nexon EV",
        "variant_id": "var-nexon-emp-plus",
        "variant_name": "Empowered Plus 45",
        "fuel_type": "Electric",
        "transmission_type": "Automatic",
        "colour_id": "col-teal",
        "colour_name": "Intensi-Teal with White Roof",
        "vin": "MATNEX26SNG554433",
        "stock_serial_number": "CC-2026-0301",
        "manufacturing_month_year": "10-2026",
        "status": "IN_STOCK",
        "stock_quantity": 2,
        "days_in_yard": 7,
        "yard_location": "Andheri Display Bay 1",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1699000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "notes": "EV ready for customer test drive and delivery.",
        "created_at": "2026-10-28T09:00:00Z",
        "updated_at": "2026-11-02T10:00:00Z",
    },
    {
        "id": "inv-apex-01",
        "dealer_id": "dlr-apex-del-004",
        "branch_id": "br-apex-connaught-01",
        "branch_name": "Apex Hyundai Connaught Place",
        "brand_name": "Hyundai",
        "model_id": "mod-creta-01",
        "model_name": "Creta",
        "variant_id": "var-creta-sx",
        "variant_name": "SX(O) 1.5L IVT",
        "fuel_type": "Petrol",
        "transmission_type": "IVT",
        "colour_id": "col-atlas-white",
        "colour_name": "Atlas White",
        "vin": "MALC2811SNG776655",
        "stock_serial_number": "AP-2026-0512",
        "manufacturing_month_year": "09-2026",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "days_in_yard": 5,
        "yard_location": "CP Front Bay",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1870000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
        "notes": "Fast moving Creta IVT trim.",
        "created_at": "2026-10-25T11:00:00Z",
        "updated_at": "2026-11-01T12:00:00Z",
    },
    {
        "id": "inv-varun-01",
        "dealer_id": "dlr-varun-hyd-005",
        "branch_id": "br-varun-gachibowli-01",
        "branch_name": "Varun Motors Gachibowli Nexa Flagship",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-gvitara-01",
        "model_name": "Grand Vitara",
        "variant_id": "var-gv-alpha-at",
        "variant_name": "Alpha 1.5L Intelligent Electric Hybrid e-CVT",
        "fuel_type": "Strong Hybrid",
        "transmission_type": "e-CVT",
        "colour_id": "col-nexa-blue",
        "colour_name": "Nexa Blue",
        "vin": "MA3GVB11SNG332211",
        "stock_serial_number": "VM-2026-0819",
        "manufacturing_month_year": "10-2026",
        "status": "IN_STOCK",
        "stock_quantity": 2,
        "days_in_yard": 9,
        "yard_location": "Gachibowli Delivery Bay",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1999000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "notes": "Strong hybrid in high demand.",
        "created_at": "2026-10-29T10:00:00Z",
        "updated_at": "2026-11-03T11:00:00Z",
    },
    {
        "id": "inv-pratham-01",
        "dealer_id": "dlr-pratham-blr-006",
        "branch_id": "br-pratham-bellandur-01",
        "branch_name": "Pratham Nexa Bellandur Experience Lounge",
        "brand_name": "Maruti Suzuki",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "variant_id": "var-brz-zxi-plus",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission_type": "Automatic",
        "colour_id": "col-magma-grey",
        "colour_name": "Magma Grey",
        "vin": "MA3EYD21SNG990011",
        "stock_serial_number": "PM-2026-0145",
        "manufacturing_month_year": "10-2026",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "days_in_yard": 6,
        "yard_location": "Bellandur Showroom",
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "ex_showroom_price": 1398000,
        "vehicle_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        "notes": "Customer inspection approved.",
        "created_at": "2026-10-30T10:00:00Z",
        "updated_at": "2026-11-04T10:00:00Z",
    },
]

INVENTORY_HISTORY_LOGS: List[Dict[str, Any]] = [
    {
        "id": "hist-001",
        "inventory_id": "inv-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "STOCK_ADDED",
        "details": "Vehicle checked in to Whitefield Yard. Assigned tag KY-2026-0842.",
        "previous_state": None,
        "new_state": "IN_STOCK",
        "actor_id": "usr-suresh-05",
        "actor_name": "Suresh Kumar",
        "actor_role": "INVENTORY_MANAGER",
        "timestamp": "2026-10-25T08:00:00Z",
    },
    {
        "id": "hist-002",
        "inventory_id": "inv-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "AVAILABILITY_UPDATED",
        "details": "Enabled for Flash Sales and collective purchase campaigns.",
        "previous_state": "Standard Yard Stock",
        "new_state": "Flash Sale Active",
        "actor_id": "usr-rajesh-02",
        "actor_name": "Rajesh Sharma",
        "actor_role": "BRANCH_MANAGER",
        "timestamp": "2026-11-01T09:00:00Z",
    },
    {
        "id": "hist-003",
        "inventory_id": "inv-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "action": "ALLOCATED_TO_GROUP",
        "details": "Allocated to Buyer Group GD-BLR-SWF-01.",
        "previous_state": "IN_STOCK",
        "new_state": "ALLOCATED_TO_GROUP",
        "actor_id": "usr-priya-03",
        "actor_name": "Priya Nair",
        "actor_role": "SALES_MANAGER",
        "timestamp": "2026-11-02T14:30:00Z",
    },
]

def get_inventory_item_by_id(inv_id: str, dealer_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    for item in INVENTORY_MASTER_DB:
        if item["id"] == inv_id:
            if dealer_id and item["dealer_id"] != dealer_id:
                return None
            return item
    return None

def record_inventory_history(
    inv_id: str,
    dealer_id: str,
    action: str,
    details: str,
    actor: Dict[str, Any],
    prev_state: Optional[str] = None,
    new_state: Optional[str] = None
) -> Dict[str, Any]:
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    log_entry = {
        "id": f"hist-{len(INVENTORY_HISTORY_LOGS) + 1:04d}",
        "inventory_id": inv_id,
        "dealer_id": dealer_id,
        "action": action,
        "details": details,
        "previous_state": prev_state,
        "new_state": new_state,
        "actor_id": actor.get("id", "sys"),
        "actor_name": f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or "System",
        "actor_role": actor.get("staff_role", "DEALER_OWNER"),
        "timestamp": now_str,
    }
    INVENTORY_HISTORY_LOGS.insert(0, log_entry)
    return log_entry

def get_inventory_dashboard_metrics(dealer_id: str, branch_id: Optional[str] = None) -> Dict[str, Any]:
    items = [i for i in INVENTORY_MASTER_DB if i["dealer_id"] == dealer_id]
    if branch_id and branch_id != "ALL":
        items = [i for i in items if i["branch_id"] == branch_id]

    total_units = sum(i.get("stock_quantity", 1) for i in items)
    in_stock = sum(i.get("stock_quantity", 1) for i in items if i["status"] == "IN_STOCK")
    in_transit = sum(i.get("stock_quantity", 1) for i in items if i["status"] == "IN_TRANSIT")
    allocated = sum(i.get("stock_quantity", 1) for i in items if i["status"] == "ALLOCATED_TO_GROUP")
    sold_delivered = sum(i.get("stock_quantity", 1) for i in items if i["status"] in ["SOLD", "DELIVERED"])
    aging = len([i for i in items if i["days_in_yard"] >= 45 and i["status"] == "IN_STOCK"])
    total_val = sum(i["ex_showroom_price"] * i.get("stock_quantity", 1) for i in items if i["status"] == "IN_STOCK")

    models_breakdown: Dict[str, int] = {}
    fuel_breakdown: Dict[str, int] = {}

    for i in items:
        m = i.get("model_name", "Other")
        f = i.get("fuel_type", "Other")
        q = i.get("stock_quantity", 1)
        models_breakdown[m] = models_breakdown.get(m, 0) + q
        fuel_breakdown[f] = fuel_breakdown.get(f, 0) + q

    return {
        "total_units": total_units,
        "in_stock": in_stock,
        "in_transit": in_transit,
        "allocated_to_group": allocated,
        "sold_or_delivered": sold_delivered,
        "aging_units": aging,
        "total_valuation_inr": total_val,
        "models_breakdown": models_breakdown,
        "fuel_breakdown": fuel_breakdown,
    }

def query_inventory(
    dealer_id: str,
    branch_id: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    variant: Optional[str] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    items = [i for i in INVENTORY_MASTER_DB if i["dealer_id"] == dealer_id]

    if branch_id and branch_id != "ALL":
        items = [i for i in items if i["branch_id"] == branch_id]

    if brand and brand != "ALL":
        items = [i for i in items if i.get("brand_name", "").lower() == brand.lower()]

    if model and model != "ALL":
        items = [i for i in items if i.get("model_name", "").lower() == model.lower() or i.get("model_id") == model]

    if variant and variant != "ALL":
        items = [i for i in items if i.get("variant_id") == variant or i.get("variant_name", "").lower() == variant.lower()]

    if fuel_type and fuel_type != "ALL":
        items = [i for i in items if i.get("fuel_type", "").lower() == fuel_type.lower()]

    if transmission and transmission != "ALL":
        items = [i for i in items if i.get("transmission_type", "").lower() == transmission.lower()]

    if status and status != "ALL":
        items = [i for i in items if i.get("status") == status]

    if search and search.strip():
        term = search.lower().strip()
        items = [
            i for i in items
            if term in i.get("model_name", "").lower()
            or term in i.get("variant_name", "").lower()
            or term in (i.get("vin") or "").lower()
            or term in (i.get("stock_serial_number") or "").lower()
            or term in i.get("colour_name", "").lower()
            or term in i.get("branch_name", "").lower()
            or term in (i.get("yard_location") or "").lower()
        ]

    return items

def add_inventory_item(payload: Dict[str, Any], actor: Dict[str, Any]) -> Dict[str, Any]:
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    variant_id = payload["variant_id"]
    variant = get_variant_by_id(variant_id)
    if not variant:
        raise ValueError(f"Official catalogue variant with ID '{variant_id}' does not exist.")

    model = get_model_by_id(variant["model_id"])
    model_image = model["image_url"] if model else "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"

    colour_id = payload.get("colour_id")
    colour_name = payload.get("colour_name")
    if colour_id and not colour_name:
        for c in variant.get("colours", []):
            if c["id"] == colour_id:
                colour_name = c["name"]
                break
    if not colour_name:
        colour_name = variant.get("colours", [{}])[0].get("name", "Standard Monotone")

    branch_id = payload["branch_id"]
    branch = BRANCHES_DB.get(branch_id)
    branch_name = branch["branch_name"] if branch else "Main Yard"

    new_id = f"inv-{len(INVENTORY_MASTER_DB) + 1:03d}"
    ex_price = payload.get("ex_showroom_price") or variant["official_ex_showroom_price"]

    item = {
        "id": new_id,
        "dealer_id": payload["dealer_id"],
        "branch_id": branch_id,
        "branch_name": branch_name,
        "brand_name": variant["brand_name"],
        "model_id": variant["model_id"],
        "model_name": variant["model_name"],
        "variant_id": variant["id"],
        "variant_name": variant["name"],
        "fuel_type": variant["fuel_type"], # Official catalogue specification (immutable)
        "transmission_type": variant["transmission_type"], # Official catalogue specification (immutable)
        "colour_id": colour_id or "col-std",
        "colour_name": colour_name,
        "vin": payload.get("vin"),
        "stock_serial_number": payload.get("stock_serial_number") or f"KY-{datetime.date.today().year}-{len(INVENTORY_MASTER_DB) + 1:04d}",
        "manufacturing_month_year": payload.get("manufacturing_month_year") or datetime.date.today().strftime("%m-%Y"),
        "status": payload.get("status", "IN_STOCK"),
        "stock_quantity": max(1, int(payload.get("stock_quantity", 1))),
        "days_in_yard": 0,
        "yard_location": payload.get("yard_location") or "Arrival Bay",
        "is_available_for_flash_sale": bool(payload.get("is_available_for_flash_sale", False)),
        "is_available_for_group_buy": bool(payload.get("is_available_for_group_buy", True)),
        "ex_showroom_price": ex_price,
        "vehicle_image_url": model_image,
        "notes": payload.get("notes"),
        "created_at": now_str,
        "updated_at": now_str,
    }

    INVENTORY_MASTER_DB.insert(0, item)

    record_inventory_history(
        inv_id=new_id,
        dealer_id=payload["dealer_id"],
        action="STOCK_ADDED",
        details=f"Added {item['model_name']} {item['variant_name']} ({item['colour_name']}) to {branch_name}.",
        actor=actor,
        new_state=item["status"],
    )

    return item

def update_inventory_item(inv_id: str, updates: Dict[str, Any], actor: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    target = None
    for item in INVENTORY_MASTER_DB:
        if item["id"] == inv_id:
            target = item
            break

    if not target:
        return None

    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    target["updated_at"] = now_str

    # Dealer-managed commercial updates only (Official vehicle specifications remain strictly immutable)
    if "branch_id" in updates and updates["branch_id"]:
        new_b_id = updates["branch_id"]
        if new_b_id != target["branch_id"]:
            old_b_name = target["branch_name"]
            new_b = BRANCHES_DB.get(new_b_id)
            new_b_name = new_b["branch_name"] if new_b else "Unknown Facility"
            target["branch_id"] = new_b_id
            target["branch_name"] = new_b_name
            record_inventory_history(
                inv_id=inv_id,
                dealer_id=target["dealer_id"],
                action="BRANCH_TRANSFERRED",
                details=f"Transferred from {old_b_name} to {new_b_name}.",
                actor=actor,
                prev_state=old_b_name,
                new_state=new_b_name,
            )

    if "yard_location" in updates and updates["yard_location"] is not None:
        if updates["yard_location"] != target["yard_location"]:
            prev_loc = target["yard_location"]
            target["yard_location"] = updates["yard_location"]
            record_inventory_history(
                inv_id=inv_id,
                dealer_id=target["dealer_id"],
                action="YARD_RELOCATED",
                details=f"Relocated to {target['yard_location']}.",
                actor=actor,
                prev_state=prev_loc,
                new_state=target["yard_location"],
            )

    if "ex_showroom_price" in updates and updates["ex_showroom_price"] is not None:
        if updates["ex_showroom_price"] != target["ex_showroom_price"]:
            prev_p = target["ex_showroom_price"]
            target["ex_showroom_price"] = updates["ex_showroom_price"]
            record_inventory_history(
                inv_id=inv_id,
                dealer_id=target["dealer_id"],
                action="PRICE_ADJUSTED",
                details=f"Commercial price updated from INR {prev_p:,} to INR {target['ex_showroom_price']:,}.",
                actor=actor,
                prev_state=str(prev_p),
                new_state=str(target["ex_showroom_price"]),
            )

    if "stock_quantity" in updates and updates["stock_quantity"] is not None:
        qty = max(0, int(updates["stock_quantity"]))
        if qty != target.get("stock_quantity", 1):
            prev_q = target.get("stock_quantity", 1)
            target["stock_quantity"] = qty
            record_inventory_history(
                inv_id=inv_id,
                dealer_id=target["dealer_id"],
                action="QUANTITY_UPDATED",
                details=f"Stock quantity adjusted from {prev_q} to {qty}.",
                actor=actor,
                prev_state=str(prev_q),
                new_state=str(qty),
            )

    if "status" in updates and updates["status"]:
        if updates["status"] != target["status"]:
            prev_s = target["status"]
            target["status"] = updates["status"]
            record_inventory_history(
                inv_id=inv_id,
                dealer_id=target["dealer_id"],
                action="STATUS_CHANGED",
                details=f"Inventory status changed from {prev_s.replace('_', ' ')} to {target['status'].replace('_', ' ')}.",
                actor=actor,
                prev_state=prev_s,
                new_state=target["status"],
            )

    if "is_available_for_flash_sale" in updates:
        target["is_available_for_flash_sale"] = bool(updates["is_available_for_flash_sale"])

    if "is_available_for_group_buy" in updates:
        target["is_available_for_group_buy"] = bool(updates["is_available_for_group_buy"])

    if "vin" in updates and updates["vin"]:
        target["vin"] = updates["vin"]

    if "notes" in updates:
        target["notes"] = updates["notes"]

    return target

def get_inventory_history(inv_id: str, dealer_id: str) -> List[Dict[str, Any]]:
    return [h for h in INVENTORY_HISTORY_LOGS if h["inventory_id"] == inv_id and h["dealer_id"] == dealer_id]

