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

def test_catalogue_endpoints():
    token = get_token("owner@kalyanimotors.com")

    # List Brands
    res_brands = client.get("/api/v1/catalogue/brands", headers={"Authorization": f"Bearer {token}"})
    assert res_brands.status_code == 200
    brands = res_brands.json()["data"]
    brand_names = [b["name"] for b in brands]
    assert "Maruti Suzuki" in brand_names
    assert "Hyundai" in brand_names

    # List Models
    res_models = client.get("/api/v1/catalogue/models", headers={"Authorization": f"Bearer {token}"})
    assert res_models.status_code == 200
    models = res_models.json()["data"]
    model_names = [m["name"] for m in models]
    assert "Brezza" in model_names
    assert "Grand Vitara" in model_names

    # List Variants with filters
    res_variants = client.get("/api/v1/catalogue/variants?fuel_type=Petrol", headers={"Authorization": f"Bearer {token}"})
    assert res_variants.status_code == 200
    for v in res_variants.json()["data"]:
        assert v["fuel_type"] == "Petrol"

    # Get Single Variant Details
    res_var = client.get("/api/v1/catalogue/variants/var-brz-zxi-plus", headers={"Authorization": f"Bearer {token}"})
    assert res_var.status_code == 200
    var_data = res_var.json()["data"]
    assert var_data["name"] == "ZXi Plus 1.5L AT"
    assert var_data["engine_capacity_cc"] == 1462
    assert len(var_data["colours"]) >= 2

def test_get_inventory_dashboard_metrics():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/inventory/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_units"] >= 6
    assert data["in_stock"] >= 3
    assert data["total_valuation_inr"] > 1000000
    assert "Brezza" in data["models_breakdown"]
    assert "Petrol" in data["fuel_breakdown"]

def test_list_inventory_scoped_to_dealer():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/inventory", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    items = res.json()["data"]
    assert len(items) >= 5
    for item in items:
        assert item["dealer_id"] == "dlr-kalyani-blr-001"

def test_inventory_search_and_filtering():
    token = get_token("owner@kalyanimotors.com")

    # Filter by model
    res_model = client.get("/api/v1/inventory?model=Brezza", headers={"Authorization": f"Bearer {token}"})
    assert res_model.status_code == 200
    for item in res_model.json()["data"]:
        assert item["model_name"] == "Brezza"

    # Filter by fuel type
    res_fuel = client.get("/api/v1/inventory?fuel_type=Strong Hybrid", headers={"Authorization": f"Bearer {token}"})
    assert res_fuel.status_code == 200
    for item in res_fuel.json()["data"]:
        assert item["fuel_type"] == "Strong Hybrid"

    # Filter by transmission
    res_trans = client.get("/api/v1/inventory?transmission=Automatic", headers={"Authorization": f"Bearer {token}"})
    assert res_trans.status_code == 200
    for item in res_trans.json()["data"]:
        assert item["transmission_type"] == "Automatic"

    # Filter by status
    res_status = client.get("/api/v1/inventory?status=IN_STOCK", headers={"Authorization": f"Bearer {token}"})
    assert res_status.status_code == 200
    for item in res_status.json()["data"]:
        assert item["status"] == "IN_STOCK"

    # Search keyword
    res_search = client.get("/api/v1/inventory?search=Grand Vitara", headers={"Authorization": f"Bearer {token}"})
    assert res_search.status_code == 200
    assert len(res_search.json()["data"]) >= 1

def test_add_inventory_item_from_catalogue_success():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "variant_id": "var-brz-zxi",
        "branch_id": "br-whitefield-01",
        "colour_id": "col-pearl-white",
        "vin": "MA3EYD21SNG999001",
        "stock_serial_number": "KY-2026-9001",
        "manufacturing_month_year": "11-2026",
        "status": "IN_STOCK",
        "stock_quantity": 2,
        "yard_location": "Bay 12 - Inbound Lot",
        "ex_showroom_price": 1115000,
        "is_available_for_flash_sale": True,
        "is_available_for_group_buy": True,
        "notes": "Fresh lot received from factory.",
    }
    res = client.post("/api/v1/inventory", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["model_name"] == "Brezza"
    assert data["variant_name"] == "ZXi 1.5L 5MT"
    assert data["fuel_type"] == "Petrol"
    assert data["branch_id"] == "br-whitefield-01"
    assert data["stock_quantity"] == 2

def test_branch_manager_can_add_to_own_branch():
    token = get_token("branchmgr@kalyanimotors.com") # Whitefield branch
    payload = {
        "variant_id": "var-swf-zxi-mt",
        "branch_id": "br-whitefield-01",
        "colour_id": "col-luster-blue",
        "vin": "MA3SWF01SNG999002",
        "stock_serial_number": "KY-2026-9002",
        "status": "IN_STOCK",
        "stock_quantity": 1,
        "yard_location": "Whitefield Customer Delivery Bay",
        "ex_showroom_price": 830000,
    }
    res = client.post("/api/v1/inventory", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    assert res.json()["data"]["branch_id"] == "br-whitefield-01"

def test_branch_manager_cannot_add_to_other_branch():
    token = get_token("branchmgr@kalyanimotors.com") # Whitefield branch
    payload = {
        "variant_id": "var-swf-zxi-mt",
        "branch_id": "br-bannerghatta-02", # Not Whitefield
        "status": "IN_STOCK",
    }
    res = client.post("/api/v1/inventory", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert "within your assigned branch" in res.json()["detail"]

def test_non_management_cannot_add_inventory():
    token = get_token("salesexec@kalyanimotors.com")
    payload = {
        "variant_id": "var-brz-zxi",
        "branch_id": "br-whitefield-01",
    }
    res = client.post("/api/v1/inventory", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_add_inventory_invalid_variant_rejected():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "variant_id": "non-existent-variant",
        "branch_id": "br-whitefield-01",
    }
    res = client.post("/api/v1/inventory", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "does not exist" in res.json()["detail"]

def test_view_vehicle_details_with_official_specs():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/inventory/inv-001", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["id"] == "inv-001"
    assert "official_specifications" in data
    specs = data["official_specifications"]
    assert "1.5L K15C" in specs["engine_description"]
    assert specs["seating_capacity"] == 5

def test_edit_inventory_commercial_details():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "yard_location": "Bay 3A - Relocated for Delivery Inspection",
        "ex_showroom_price": 1400000,
        "stock_quantity": 3,
    }
    res = client.put("/api/v1/inventory/inv-001", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["yard_location"] == "Bay 3A - Relocated for Delivery Inspection"
    assert data["ex_showroom_price"] == 1400000
    assert data["stock_quantity"] == 3

def test_update_availability_and_status():
    token = get_token("owner@kalyanimotors.com")
    payload = {
        "status": "ALLOCATED_TO_GROUP",
        "is_available_for_flash_sale": False,
    }
    res = client.patch("/api/v1/inventory/inv-002/availability", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "ALLOCATED_TO_GROUP"
    assert data["is_available_for_flash_sale"] is False

def test_get_inventory_history_logs():
    token = get_token("owner@kalyanimotors.com")
    res = client.get("/api/v1/inventory/inv-001/history", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    history = res.json()["data"]
    assert len(history) >= 1
    actions = [h["action"] for h in history]
    assert "STOCK_ADDED" in actions or "PRICE_ADJUSTED" in actions or "YARD_RELOCATED" in actions

def test_cross_dealer_inventory_isolation():
    # Kalyani Motors Owner attempting to access Advaith Hyundai's inventory
    token = get_token("owner@kalyanimotors.com")
    res_get = client.get("/api/v1/inventory/inv-999", headers={"Authorization": f"Bearer {token}"})
    assert res_get.status_code == 403
    assert "belongs to a different dealership" in res_get.json()["detail"]

    # Attempting to edit rival dealer inventory
    res_put = client.put(
        "/api/v1/inventory/inv-999",
        json={"yard_location": "Hacked Bay"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_put.status_code == 403

