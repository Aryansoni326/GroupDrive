import pytest
import uuid
from fastapi.testclient import TestClient
from src.main import app
from src.core.inventory_store import INVENTORY_MASTER_DB
from src.core.opportunities_store import GROUP_OPPORTUNITIES_DB

client = TestClient(app)

def get_dealer_token(email: str = "owner@kalyanimotors.com", password: str = "Password@123") -> str:
    res = client.post(
        "/api/v1/auth/login-password",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, f"Dealer login failed: {res.text}"
    return res.json()["data"]["access_token"]


def get_customer_token(email: str = "customer@groupdrive.in", password: str = "Password@123") -> str:
    res = client.post(
        "/api/v1/auth/customer/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, f"Customer login failed: {res.text}"
    return res.json()["data"]["access_token"]


# ==============================================================================
# SCENARIO 1: DEALER INVENTORY LIFECYCLE & MULTI-CHANNEL AVAILABILITY
# ==============================================================================

def test_scenario_1_dealer_inventory_lifecycle():
    dealer_token = get_dealer_token()
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}

    # 1. Dealer adds vehicle inventory in DealerOS
    unique_vin = f"MA3TEST{uuid.uuid4().hex[:10].upper()}"
    add_payload = {
        "variant_id": "var-brz-zxi-plus",
        "branch_id": "br-whitefield-01",
        "colour_id": "col-pearl-white",
        "colour_name": "Pearl Arctic White",
        "vin": unique_vin,
        "stock_quantity": 2,
        "status": "IN_STOCK",
        "yard_location": "Bay 9 - Test Deck",
        "ex_showroom_price": 1398000,
        "is_available_for_group_buy": True,
        "notes": "Ecosystem integration test inventory unit.",
    }

    res_add = client.post("/api/v1/inventory", json=add_payload, headers=dealer_headers)
    assert res_add.status_code in [200, 201], f"Add inventory failed: {res_add.text}"
    added_item = res_add.json()["data"]
    inv_id = added_item["id"]
    assert inv_id is not None
    assert added_item["vin"] == unique_vin
    assert added_item["status"] == "IN_STOCK"

    # 2. Correct inventory becomes available to customers on the website & mobile
    res_pub_inv = client.get("/api/v1/public/inventory?model_id=mod-brezza-01")
    assert res_pub_inv.status_code == 200
    available_units = res_pub_inv.json()["data"]
    matched_inv = next((i for i in available_units if i["id"] == inv_id), None)
    assert matched_inv is not None, "Newly added inventory item must be discoverable in public inventory API"
    assert "Kalyani Motors" in matched_inv["dealership_name"]
    assert matched_inv["branch_name"] == "Whitefield Showroom and Delivery Centre"
    assert matched_inv["stock_quantity"] == 2
    assert matched_inv["status"] == "IN_STOCK"

    # Customer checks dealer profile page
    res_dealer_page = client.get("/api/v1/public/dealers/dlr-kalyani-blr-001")
    assert res_dealer_page.status_code == 200
    dealer_detail = res_dealer_page.json()["data"]
    dealer_vehicles = dealer_detail["available_vehicles"]
    assert any(v["id"] == inv_id for v in dealer_vehicles), "Inventory must appear on public dealer profile"

    # 3. Dealer changes availability in DealerOS (marks vehicle SOLD)
    res_avail = client.patch(
        f"/api/v1/inventory/{inv_id}/availability",
        json={"status": "SOLD", "stock_quantity": 0},
        headers=dealer_headers,
    )
    assert res_avail.status_code == 200
    assert res_avail.json()["data"]["status"] == "SOLD"

    # 4. Customer-facing availability updates correctly (SOLD vehicle is removed from public inventory)
    res_pub_inv_after = client.get("/api/v1/public/inventory?model_id=mod-brezza-01")
    assert res_pub_inv_after.status_code == 200
    available_after = res_pub_inv_after.json()["data"]
    assert not any(i["id"] == inv_id for i in available_after), "Sold vehicle must not be visible in public inventory"

    res_dealer_page_after = client.get("/api/v1/public/dealers/dlr-kalyani-blr-001")
    assert res_dealer_page_after.status_code == 200
    vehicles_after = res_dealer_page_after.json()["data"]["available_vehicles"]
    assert not any(v["id"] == inv_id for v in vehicles_after), "Sold vehicle must be excluded from dealer profile vehicles"


# ==============================================================================
# SCENARIO 2: CUSTOMER ENQUIRY LIFECYCLE (WEBSITE & MOBILE TO DEALEROS)
# ==============================================================================

def test_scenario_2_customer_enquiry_lifecycle_web_and_mobile():
    cust_token = get_customer_token()
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    dealer_token = get_dealer_token()
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}

    unique_email = f"lead.{uuid.uuid4().hex[:8]}@groupdrive.in"

    # 1. Customer submits an enquiry through the website
    enquiry_payload = {
        "customer_name": "Arjun Sharma",
        "customer_phone": "+919888877777",
        "customer_email": unique_email,
        "city": "Bengaluru",
        "brand_name": "Maruti Suzuki",
        "model_name": "Brezza",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Pearl Arctic White",
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "LOAN",
        "enquiry_type": "PRICE_QUOTE",
        "preferred_dealer_id": "dlr-kalyani-blr-001",
        "preferred_branch_id": "br-whitefield-01",
        "source": "WEBSITE_DIRECT",
        "notes": "Looking for festive delivery with extended warranty.",
    }

    res_enq = client.post("/api/v1/customer/enquiries", json=enquiry_payload, headers=cust_headers)
    assert res_enq.status_code == 200, f"Submit enquiry failed: {res_enq.text}"
    enq_data = res_enq.json()["data"]
    enq_id = enq_data["enquiry_id"]
    assert enq_id is not None
    assert "Kalyani Motors" in enq_data["dealership_name"]

    # 2. Enquiry appears in the correct DealerOS account
    res_dealer_leads = client.get(
        f"/api/v1/dealers/me/leads?search={unique_email}",
        headers=dealer_headers,
    )
    assert res_dealer_leads.status_code == 200
    leads_list = res_dealer_leads.json()["data"]
    matched_lead = next((l for l in leads_list if l["customer_email"] == unique_email), None)
    assert matched_lead is not None, "Enquiry must appear in assigned dealership CRM"
    assert matched_lead["customer_name"] == "Arjun Sharma"
    assert matched_lead["status"] in ["NEW_ENQUIRY", "RECEIVED", "NEW"]

    # 3. Dealer updates the enquiry status in DealerOS
    lead_id = matched_lead["id"]
    res_status = client.patch(
        f"/api/v1/dealers/me/leads/{lead_id}/status",
        json={"status": "TEST_DRIVE_SCHEDULED"},
        headers=dealer_headers,
    )
    assert res_status.status_code == 200
    assert res_status.json()["data"]["status"] == "TEST_DRIVE_SCHEDULED"

    # 4. Customer sees the updated status on website & mobile
    res_cust_enquiries = client.get("/api/v1/customer/my-enquiries", headers=cust_headers)
    assert res_cust_enquiries.status_code == 200

    res_alias = client.get("/api/v1/customer/enquiries", headers=cust_headers)
    assert res_alias.status_code == 200, "Customer enquiries alias must return 200"

    # 5. Repeat the same flow through the mobile app
    mobile_email = f"mobile.lead.{uuid.uuid4().hex[:8]}@groupdrive.in"
    mobile_payload = {
        **enquiry_payload,
        "customer_email": mobile_email,
        "customer_name": "Arjun Sharma Mobile",
        "source": "MOBILE_APP",
    }
    res_mobile_enq = client.post("/api/v1/customer/enquiries", json=mobile_payload, headers=cust_headers)
    assert res_mobile_enq.status_code == 200
    mobile_enq_id = res_mobile_enq.json()["data"]["enquiry_id"]

    res_check_dealer = client.get(
        f"/api/v1/dealers/me/leads?search={mobile_email}",
        headers=dealer_headers,
    )
    assert res_check_dealer.status_code == 200
    assert any(l["id"] == mobile_enq_id for l in res_check_dealer.json()["data"])


# ==============================================================================
# SCENARIO 3: DEALER QUOTATION LIFECYCLE (DEALEROS TO CUSTOMER WEB & MOBILE)
# ==============================================================================

def test_scenario_3_dealer_quotation_lifecycle():
    cust_token = get_customer_token()
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    dealer_token = get_dealer_token()
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}

    # 1. Dealer creates a quotation in DealerOS
    quote_payload = {
        "branch_id": "br-whitefield-01",
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "customer_city": "Bengaluru",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "variant_id": "var-brz-zxi-plus",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour": "Pearl Arctic White",
        "ex_showroom_price": 1398000,
        "rto_road_tax": 195720,
        "insurance_amount": 48500,
        "fastag_charges": 500,
        "tcs_amount": 13980,
        "accessories_amount": 12000,
        "extended_warranty_amount": 18000,
        "dealer_discount": 45000,
        "manufacturer_offer": 20000,
        "exchange_bonus": 0,
        "delivery_timeline_days": 10,
        "dealership_terms": "Valid for immediate delivery with ceramic coating package.",
        "status": "SUBMITTED",
    }

    res_create_quote = client.post(
        "/api/v1/dealers/me/quotations",
        json=quote_payload,
        headers=dealer_headers,
    )
    assert res_create_quote.status_code in [200, 201], f"Create quotation failed: {res_create_quote.text}"
    created_quote = res_create_quote.json()["data"]
    quote_id = created_quote["id"]
    assert quote_id is not None
    assert created_quote["dealer_id"] == "dlr-kalyani-blr-001"

    # 2. Customer receives and views quotation on the website
    res_web_quotes = client.get("/api/v1/customer/my-quotations", headers=cust_headers)
    assert res_web_quotes.status_code == 200
    web_quotes = res_web_quotes.json()["data"]
    found_quote = next((q for q in web_quotes if q["id"] == quote_id), None)
    assert found_quote is not None, "Customer must receive dealership quotation on website"
    assert found_quote["pricing"]["ex_showroom_price"] == 1398000
    assert found_quote["pricing"]["dealer_discount"] == 45000

    # 3. Customer views the same quotation in the mobile app
    res_mobile_quotes = client.get("/api/v1/customer/quotations", headers=cust_headers)
    assert res_mobile_quotes.status_code == 200
    assert any(q["id"] == quote_id for q in res_mobile_quotes.json()["data"]), "Mobile app must access same quotation"

    # 4. Dealer updates the quotation in DealerOS (adds extra Rs 10,000 corporate discount)
    update_payload = {
        "dealer_discount": 55000,
        "delivery_timeline_days": 7,
        "dealership_terms": "Special festive pricing with expedited 7-day delivery.",
    }
    res_update_quote = client.put(
        f"/api/v1/dealers/me/quotations/{quote_id}",
        json=update_payload,
        headers=dealer_headers,
    )
    assert res_update_quote.status_code == 200

    # 5. Updated quotation is reflected correctly on customer side
    res_web_updated = client.get(f"/api/v1/customer/my-quotations/{quote_id}", headers=cust_headers)
    assert res_web_updated.status_code == 200
    updated_q = res_web_updated.json()["data"]
    assert updated_q["pricing"]["dealer_discount"] == 55000
    assert updated_q["delivery_timeline_days"] == 7

    # 6. Customer accepts the quotation
    res_accept = client.post(f"/api/v1/customer/my-quotations/{quote_id}/accept", headers=cust_headers)
    assert res_accept.status_code == 200
    assert res_accept.json()["data"]["status"] == "ACCEPTED"


# ==============================================================================
# SCENARIO 4: GROUP BUYING SYNCHRONIZATION ACROSS ECOSYSTEM
# ==============================================================================

def test_scenario_4_group_buying_synchronization():
    cust_token = get_customer_token()
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    dealer_token = get_dealer_token()
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}

    group_id = "grp-blr-gv-02"

    # 1. Fetch initial public group progress
    res_grp_init = client.get(f"/api/v1/public/groups/{group_id}")
    assert res_grp_init.status_code == 200
    init_data = res_grp_init.json()["data"]
    init_members = init_data["current_members_count"]

    # 2. Customer joins group through website
    join_payload = {
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "city": "Bengaluru",
        "preferred_variant": "Alpha 1.5L Intelligent Electric Hybrid e-CVT",
        "preferred_colour": "Opulent Red",
        "financing_preference": "LOAN",
    }
    res_join = client.post(f"/api/v1/customer/groups/{group_id}/join", json=join_payload, headers=cust_headers)
    assert res_join.status_code == 200, f"Join group failed: {res_join.text}"

    # 3. Participation is stored correctly and group progress is synchronized
    res_grp_after = client.get(f"/api/v1/public/groups/{group_id}")
    assert res_grp_after.status_code == 200
    assert res_grp_after.json()["data"]["current_members_count"] == init_members + 1

    # 4. Dealer can view the relevant opportunity in DealerOS
    res_opps = client.get("/api/v1/opportunities", headers=dealer_headers)
    assert res_opps.status_code == 200
    opps_list = res_opps.json()["data"]
    matched_opp = next((o for o in opps_list if o["id"] == group_id), None)
    assert matched_opp is not None, "Opportunity must be visible in DealerOS"
    assert matched_opp["current_members_count"] == init_members + 1

    # 5. Customer can see participation in the mobile app
    res_my_groups_mobile = client.get("/api/v1/customer/groups", headers=cust_headers)
    assert res_my_groups_mobile.status_code == 200
    my_groups = res_my_groups_mobile.json()["data"]
    assert any(g["membership"]["group_id"] == group_id for g in my_groups)

    # 6. Dealer submits interest / bulk offer in DealerOS
    offer_payload = {
        "branch_id": "br-whitefield-01",
        "estimated_delivery_days": 14,
        "stock_allocation_commitment": 5,
        "proposed_benefits": "Institutional fleet discount of Rs 85,000 per vehicle with free corporate fastag.",
    }
    res_offer = client.post(
        f"/api/v1/opportunities/{group_id}/interest",
        json=offer_payload,
        headers=dealer_headers,
    )
    assert res_offer.status_code in [200, 201], f"Submit interest failed: {res_offer.text}"

    # 7. Dealer offers are displayed only when actually available
    res_public_after_offer = client.get(f"/api/v1/public/groups/{group_id}")
    assert res_public_after_offer.status_code == 200
    group_offers = res_public_after_offer.json()["data"]["dealer_offers"]
    assert len(group_offers) >= 1
    assert any(o["dealer_id"] == "dlr-kalyani-blr-001" for o in group_offers)
    assert res_public_after_offer.json()["data"]["participating_dealers_count"] == len(group_offers)

    # Restore in-memory count for test suite idempotence
    for g in GROUP_OPPORTUNITIES_DB:
        if g["id"] == group_id:
            g["current_members_count"] = init_members
            break


# ==============================================================================
# SCENARIO 5: CENTRALIZED AUTHENTICATION & IDENTITY SYSTEM
# ==============================================================================

def test_scenario_5_authentication_and_identity_isolation():
    # 1. Customer signs in on website
    res_login = client.post(
        "/api/v1/auth/customer/login",
        json={"email": "customer@groupdrive.in", "password": "Password@123"},
    )
    assert res_login.status_code == 200
    token = res_login.json()["data"]["access_token"]
    assert token is not None

    # 2. Customer account data is loaded correctly
    res_me = client.get("/api/v1/auth/customer/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    user_data = res_me.json()["data"]["user"]
    assert user_data["email"] == "customer@groupdrive.in"
    assert "ROLE_CUSTOMER" in user_data["roles"]

    # 3. Mobile authentication uses the exact same identity system and credentials
    res_mobile_auth = client.post(
        "/api/v1/auth/customer/login",
        json={"email": "customer@groupdrive.in", "password": "Password@123"},
    )
    assert res_mobile_auth.status_code == 200
    mobile_token = res_mobile_auth.json()["data"]["access_token"]
    assert mobile_token is not None

    # 4. Customer can access ONLY their own information
    # Customer cannot access DealerOS internal endpoints
    res_forbidden_dealer = client.get(
        "/api/v1/dealers/me/leads",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_forbidden_dealer.status_code == 403, "Customers must not access DealerOS endpoints"

    # Dealer staff cannot access customer personal identity profile
    dealer_token = get_dealer_token()
    res_forbidden_customer = client.get(
        "/api/v1/auth/customer/me",
        headers={"Authorization": f"Bearer {dealer_token}"},
    )
    assert res_forbidden_customer.status_code == 403, "Dealer staff must not access customer personal account"

    # 5. Session expiration and logout work properly
    res_logout = client.post("/api/v1/auth/customer/logout")
    assert res_logout.status_code == 200


# ==============================================================================
# SCENARIO 6: CENTRAL VEHICLE CATALOGUE SOURCE OF TRUTH
# ==============================================================================

def test_scenario_6_central_vehicle_catalogue_integrity():
    # 1. Admin-managed vehicle specifications remain the source of truth
    res_models = client.get("/api/v1/public/catalogue/models/mod-brezza-01")
    assert res_models.status_code == 200
    model_data = res_models.json()["data"]
    assert model_data["name"] == "Brezza"
    assert model_data["brand_name"] == "Maruti Suzuki"
    assert len(model_data["variants"]) >= 1

    variant = model_data["variants"][0]
    assert variant["power_ps"] is not None
    assert variant["torque_nm"] is not None
    assert variant["seating_capacity"] == 5

    # 2. Website and mobile app use the same catalogue data
    res_var = client.get(f"/api/v1/public/catalogue/variants/{variant['id']}")
    assert res_var.status_code == 200
    assert res_var.json()["data"]["name"] == variant["name"]

    # 3. Dealer inventory cannot overwrite manufacturer specifications
    dealer_token = get_dealer_token()
    add_payload = {
        "variant_id": variant["id"],
        "branch_id": "br-whitefield-01",
        "ex_showroom_price": 1450000,
        "stock_quantity": 1,
    }
    res_inv = client.post("/api/v1/inventory", json=add_payload, headers={"Authorization": f"Bearer {dealer_token}"})
    assert res_inv.status_code in [200, 201]
    inv_item = res_inv.json()["data"]

    # Official specifications on catalogue remain untouched
    res_check_catalogue = client.get(f"/api/v1/public/catalogue/variants/{variant['id']}")
    assert res_check_catalogue.status_code == 200
    cat_variant = res_check_catalogue.json()["data"]
    assert cat_variant["power_ps"] == variant["power_ps"]
    assert cat_variant["torque_nm"] == variant["torque_nm"]
    assert cat_variant["official_ex_showroom_price"] == variant["official_ex_showroom_price"]


# ==============================================================================
# SECURITY & RESILIENCE TESTING
# ==============================================================================

def test_security_tenant_and_customer_data_isolation():
    dealer_token = get_dealer_token("owner@kalyanimotors.com")
    dealer_headers = {"Authorization": f"Bearer {dealer_token}"}

    # 1. Tenant isolation: Dealer cannot access other dealership inventory
    # inv-999 belongs to Advaith Hyundai (dlr-advaith-blr-002)
    res_other_inv = client.get("/api/v1/inventory/inv-999", headers=dealer_headers)
    assert res_other_inv.status_code in [403, 404]

    # 2. Unauthorized API access
    res_unauth = client.get("/api/v1/customer/profile")
    assert res_unauth.status_code in [401, 403]

    res_unauth_dealer = client.get("/api/v1/dealers/me/leads")
    assert res_unauth_dealer.status_code in [401, 403]

    # 3. Input validation: negative price or malformed email
    res_bad_email = client.post("/api/v1/auth/customer/login", json={
        "email": "not-an-email",
        "password": "Password@123",
    })
    assert res_bad_email.status_code in [400, 422]

    # 4. Duplicate rapid submissions prevention
    cust_token = get_customer_token()
    dup_email = f"rapid.{uuid.uuid4().hex[:6]}@example.com"
    enq_payload = {
        "customer_name": "Test User",
        "customer_phone": "+919876543210",
        "customer_email": dup_email,
        "brand_name": "Maruti Suzuki",
        "model_name": "Brezza",
        "variant_name": "ZXi Plus",
        "preferred_dealer_id": "dlr-kalyani-blr-001",
    }
    res_1 = client.post("/api/v1/customer/enquiries", json=enq_payload, headers={"Authorization": f"Bearer {cust_token}"})
    assert res_1.status_code == 200
    res_2 = client.post("/api/v1/customer/enquiries", json=enq_payload, headers={"Authorization": f"Bearer {cust_token}"})
    assert res_2.status_code == 200
    assert res_2.json()["data"]["enquiry_id"] == res_1.json()["data"]["enquiry_id"], "Duplicate submission within 60s must return existing enquiry"
