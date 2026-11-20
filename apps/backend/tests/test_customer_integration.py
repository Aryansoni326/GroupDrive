import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_public_catalogue_brands():
    res = client.get("/api/v1/public/catalogue/brands")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 3
    brand_names = [b["name"] for b in body["data"]]
    assert "Maruti Suzuki" in brand_names
    assert "Hyundai" in brand_names


def test_public_catalogue_models():
    res = client.get("/api/v1/public/catalogue/models")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 5
    model_names = [m["name"] for m in body["data"]]
    assert "Brezza" in model_names
    assert "Grand Vitara" in model_names

    # Test brand filter
    res_filtered = client.get("/api/v1/public/catalogue/models?brand_id=brd-maruti")
    assert res_filtered.status_code == 200
    for m in res_filtered.json()["data"]:
        assert m["brand_id"] == "brd-maruti"


def test_public_catalogue_model_details():
    res = client.get("/api/v1/public/catalogue/models/mod-brezza-01")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["name"] == "Brezza"
    assert "variants" in body["data"]
    assert len(body["data"]["variants"]) >= 1

    # 404 for invalid model
    res_404 = client.get("/api/v1/public/catalogue/models/non-existent-model")
    assert res_404.status_code == 404


def test_public_catalogue_variants():
    res = client.get("/api/v1/public/catalogue/variants?model_id=mod-brezza-01")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    variant = body["data"][0]
    assert variant["model_id"] == "mod-brezza-01"
    assert "official_ex_showroom_price" in variant


def test_public_buyer_groups():
    res = client.get("/api/v1/public/groups")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 2
    group = body["data"][0]
    assert "group_code" in group
    assert "current_members_count" in group
    assert "min_members_threshold" in group
    assert "estimated_savings_inr" in group

    # Test group details
    group_id = group["id"]
    res_detail = client.get(f"/api/v1/public/groups/{group_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["data"]["id"] == group_id

    # 404 for unknown group
    res_404 = client.get("/api/v1/public/groups/unknown-grp")
    assert res_404.status_code == 404


def test_public_campaigns():
    res = client.get("/api/v1/public/campaigns")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    assert "title" in body["data"][0]


def test_customer_registration_and_login():
    import uuid
    email = f"test.cust.{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "first_name": "Test",
        "last_name": "Customer",
        "email": email,
        "phone_number": "+919876599999",
        "password": "CustomerPassword@123",
        "city": "Bengaluru",
    }

    # Register
    res_reg = client.post("/api/v1/auth/customer/register", json=reg_payload)
    assert res_reg.status_code == 200
    reg_data = res_reg.json()["data"]
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    assert reg_data["user"]["email"] == email

    # Duplicate registration fails
    res_dup = client.post("/api/v1/auth/customer/register", json=reg_payload)
    assert res_dup.status_code == 400

    # Login
    res_login = client.post("/api/v1/auth/customer/login", json={
        "email": email,
        "password": "CustomerPassword@123",
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()["data"]

    # Wrong password fails
    res_bad = client.post("/api/v1/auth/customer/login", json={
        "email": email,
        "password": "WrongPassword",
    })
    assert res_bad.status_code == 401

    # Profile me
    res_me = client.get("/api/v1/auth/customer/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["data"]["user"]["email"] == email


def test_customer_submit_enquiry_integrates_with_dealer_crm():
    import uuid
    cust_email = f"web.lead.{uuid.uuid4().hex[:6]}@example.com"
    enquiry_payload = {
        "customer_name": "Deepak Verma",
        "customer_phone": "+919845199888",
        "customer_email": cust_email,
        "city": "Bengaluru",
        "brand_name": "Maruti Suzuki",
        "model_name": "Brezza",
        "variant_name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "colour_preference": "Pearl Arctic White",
        "purchase_timeline": "WITHIN_15_DAYS",
        "financing_preference": "LOAN",
        "enquiry_type": "TEST_DRIVE",
        "notes": "Interested in weekend home test drive.",
    }

    res = client.post("/api/v1/customer/enquiries", json=enquiry_payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "enquiry_id" in body["data"]

    # Verify that DealerOS can see this lead via CRM
    dealer_token_res = client.post(
        "/api/v1/auth/login-password",
        json={"email": "owner@kalyanimotors.com", "password": "Password@123"}
    )
    assert dealer_token_res.status_code == 200
    dealer_token = dealer_token_res.json()["data"]["access_token"]

    leads_res = client.get(
        f"/api/v1/dealers/me/leads?search={cust_email}",
        headers={"Authorization": f"Bearer {dealer_token}"}
    )
    assert leads_res.status_code == 200
    found_leads = leads_res.json()["data"]
    assert len(found_leads) >= 1
    matched = next((l for l in found_leads if l["customer_email"] == cust_email), None)
    assert matched is not None
    assert matched["customer_name"] == "Deepak Verma"
    assert matched["source"] == "WEBSITE_DIRECT"


def test_customer_join_buyer_group():
    # Login customer
    res_login = client.post("/api/v1/auth/customer/login", json={
        "email": "customer@groupdrive.in",
        "password": "Password@123",
    })
    assert res_login.status_code == 200
    token = res_login.json()["data"]["access_token"]

    # Get Brezza group initial count
    group_res = client.get("/api/v1/public/groups/grp-blr-brz-04")
    assert group_res.status_code == 200
    initial_count = group_res.json()["data"]["current_members_count"]

    # Join group
    join_payload = {
        "customer_name": "Rahul Menon",
        "customer_phone": "+919876543210",
        "customer_email": "customer@groupdrive.in",
        "city": "Bengaluru",
        "preferred_variant": "ZXi Plus",
        "preferred_colour": "Pearl Arctic White",
        "financing_preference": "LOAN",
    }
    res_join = client.post(
        "/api/v1/customer/groups/grp-blr-brz-04/join",
        json=join_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_join.status_code == 200
    assert res_join.json()["success"] is True

    # Verify count incremented
    group_res_after = client.get("/api/v1/public/groups/grp-blr-brz-04")
    assert group_res_after.json()["data"]["current_members_count"] == initial_count + 1

    # Check my-groups
    my_groups_res = client.get("/api/v1/customer/my-groups", headers={"Authorization": f"Bearer {token}"})
    assert my_groups_res.status_code == 200
    assert len(my_groups_res.json()["data"]) >= 1

    # Restore in-memory count so other test suites remain independent
    from src.core.opportunities_store import GROUP_OPPORTUNITIES_DB
    for g in GROUP_OPPORTUNITIES_DB:
        if g["id"] == "grp-blr-brz-04":
            g["current_members_count"] = initial_count
            break


def test_public_dealers_listing_and_filtering():
    # 1. Basic listing
    res = client.get("/api/v1/public/dealers")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 2
    dealers = body["data"]

    # Verify no private data exposed (e.g. pan, gstin)
    for d in dealers:
        assert "pan" not in d
        assert "gstin" not in d
        assert "is_verified" in d
        assert d["is_verified"] is True
        assert "branches" in d
        assert len(d["branches"]) >= 1

    # 2. Filter by brand
    res_maruti = client.get("/api/v1/public/dealers?brand=Maruti")
    assert res_maruti.status_code == 200
    for d in res_maruti.json()["data"]:
        assert "maruti" in d["oem_brand_franchise"].lower() or "maruti" in d["trade_name"].lower()

    # 3. Filter by city
    res_blr = client.get("/api/v1/public/dealers?city=Bengaluru")
    assert res_blr.status_code == 200
    assert len(res_blr.json()["data"]) >= 1

    # 4. Search query
    res_search = client.get("/api/v1/public/dealers?search=Kalyani")
    assert res_search.status_code == 200
    assert any("kalyani" in d["trade_name"].lower() for d in res_search.json()["data"])


def test_public_dealer_details():
    res = client.get("/api/v1/public/dealers/dlr-kalyani-blr-001")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    dealer = body["data"]
    assert dealer["id"] == "dlr-kalyani-blr-001"
    assert dealer["trade_name"] == "Kalyani Motors Maruti Suzuki"
    assert dealer["is_verified"] is True
    assert "pan" not in dealer
    assert "gstin" not in dealer
    assert len(dealer["branches"]) >= 1
    assert "directions_url" in dealer["branches"][0]
    assert "available_vehicles" in dealer
    assert "published_offers" in dealer

    # 404 for non-existent dealer
    res_404 = client.get("/api/v1/public/dealers/non-existent-dealer")
    assert res_404.status_code == 404


def test_customer_enquiries_and_quotations_workflow():
    # 1. Login Customer
    res_login = client.post("/api/v1/auth/customer/login", json={
        "email": "customer@groupdrive.in",
        "password": "Password@123",
    })
    assert res_login.status_code == 200
    token = res_login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get customer enquiries
    res_enq = client.get("/api/v1/customer/my-enquiries", headers=headers)
    assert res_enq.status_code == 200
    enquiries = res_enq.json()["data"]
    assert len(enquiries) >= 1
    assert any(e["model_name"] == "Brezza" for e in enquiries)

    # 3. Get customer quotations
    res_quotes = client.get("/api/v1/customer/my-quotations", headers=headers)
    assert res_quotes.status_code == 200
    quotes = res_quotes.json()["data"]
    assert len(quotes) >= 1

    first_quote = quotes[0]
    assert "pricing" in first_quote
    pricing = first_quote["pricing"]
    assert pricing["ex_showroom_price"] > 0
    assert pricing["final_on_road_price"] > 0
    assert "dealer_discount" in pricing
    assert "delivery_timeline_days" in first_quote
    assert "dealership_terms" in first_quote

    # 4. Get specific quotation details
    res_detail = client.get(f"/api/v1/customer/my-quotations/{first_quote['id']}", headers=headers)
    assert res_detail.status_code == 200
    assert res_detail.json()["data"]["id"] == first_quote["id"]

    # 5. Accept quotation
    res_accept = client.post(f"/api/v1/customer/my-quotations/{first_quote['id']}/accept", headers=headers)
    assert res_accept.status_code == 200
    assert res_accept.json()["data"]["status"] == "ACCEPTED"


def test_customer_profile_and_account_management():
    # Login as Rahul Menon
    res_login = client.post("/api/v1/auth/customer/login", json={
        "email": "customer@groupdrive.in",
        "password": "Password@123",
    })
    assert res_login.status_code == 200
    token = res_login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get full customer profile
    res_profile = client.get("/api/v1/customer/profile", headers=headers)
    assert res_profile.status_code == 200
    data = res_profile.json()["data"]
    assert data["user"]["email"] == "customer@groupdrive.in"
    assert "stats" in data
    assert data["stats"]["saved_vehicles_count"] >= 1

    # 2. Update profile
    res_update = client.put("/api/v1/customer/profile", headers=headers, json={
        "first_name": "Rahul",
        "last_name": "Menon",
        "city": "Bengaluru",
        "address": "No. 42, 14th Main, Indiranagar, Bengaluru, Karnataka 560038",
        "preferred_contact_method": "WHATSAPP",
    })
    assert res_update.status_code == 200
    assert res_update.json()["data"]["preferred_contact_method"] == "WHATSAPP"

    # 3. Verification flow
    res_v_req = client.post("/api/v1/auth/customer/verify-request", headers=headers, json={"channel": "EMAIL"})
    assert res_v_req.status_code == 200
    res_v_cnf = client.post("/api/v1/auth/customer/verify-confirm", headers=headers, json={"channel": "EMAIL", "code": "123456"})
    assert res_v_cnf.status_code == 200
    assert res_v_cnf.json()["data"]["is_email_verified"] is True

    # 4. Saved vehicles CRUD
    res_saved = client.get("/api/v1/customer/saved-vehicles", headers=headers)
    assert res_saved.status_code == 200
    assert len(res_saved.json()["data"]) >= 1

    res_add_saved = client.post("/api/v1/customer/saved-vehicles", headers=headers, json={
        "model_id": "mod-creta-01",
    })
    assert res_add_saved.status_code == 200
    assert res_add_saved.json()["data"]["model_name"] == "Creta"

    res_del_saved = client.delete("/api/v1/customer/saved-vehicles/mod-creta-01", headers=headers)
    assert res_del_saved.status_code == 200

    # 5. Saved comparisons CRUD
    res_cmps = client.get("/api/v1/customer/comparisons", headers=headers)
    assert res_cmps.status_code == 200

    res_save_cmp = client.post("/api/v1/customer/comparisons", headers=headers, json={
        "title": "Brezza vs Grand Vitara",
        "model_ids": ["mod-brezza-01", "mod-gvitara-01"],
    })
    assert res_save_cmp.status_code == 200
    cmp_id = res_save_cmp.json()["data"]["id"]

    res_del_cmp = client.delete(f"/api/v1/customer/comparisons/{cmp_id}", headers=headers)
    assert res_del_cmp.status_code == 200

    # 6. Appointments workflow
    res_apts = client.get("/api/v1/customer/appointments", headers=headers)
    assert res_apts.status_code == 200

    res_book = client.post("/api/v1/customer/appointments", headers=headers, json={
        "dealer_id": "dlr-kalyani-blr-001",
        "model_id": "mod-brezza-01",
        "appointment_type": "SHOWROOM_VISIT",
        "appointment_date": "2026-11-20",
        "time_slot": "02:00 PM - 03:30 PM",
        "notes": "Test drive requested",
    })
    assert res_book.status_code == 200
    apt_id = res_book.json()["data"]["id"]

    res_cancel_apt = client.post(f"/api/v1/customer/appointments/{apt_id}/cancel", headers=headers)
    assert res_cancel_apt.status_code == 200
    assert res_cancel_apt.json()["data"]["status"] == "CANCELLED"

    # 7. Notifications & Preferences
    res_notifs = client.get("/api/v1/customer/notifications", headers=headers)
    assert res_notifs.status_code == 200

    res_prefs = client.get("/api/v1/customer/notification-preferences", headers=headers)
    assert res_prefs.status_code == 200

    res_up_prefs = client.put("/api/v1/customer/notification-preferences", headers=headers, json={
        "whatsapp_updates": True,
        "promotional_offers": False,
    })
    assert res_up_prefs.status_code == 200

    # 8. Security Sessions & Password change
    res_sessions = client.get("/api/v1/customer/security/sessions", headers=headers)
    assert res_sessions.status_code == 200
    assert len(res_sessions.json()["data"]) >= 1

    res_revoke = client.post("/api/v1/customer/security/revoke-other-sessions", headers=headers)
    assert res_revoke.status_code == 200

    res_change_pwd = client.post("/api/v1/customer/change-password", headers=headers, json={
        "current_password": "Password@123",
        "new_password": "Password@12345",
    })
    assert res_change_pwd.status_code == 200

    # Revert password back for idempotence
    res_revert = client.post("/api/v1/customer/change-password", headers=headers, json={
        "current_password": "Password@12345",
        "new_password": "Password@123",
    })
    assert res_revert.status_code == 200

    # 9. Password reset flow (unauthenticated)
    res_forgot = client.post("/api/v1/auth/customer/forgot-password", json={
        "email": "customer@groupdrive.in",
    })
    assert res_forgot.status_code == 200

    res_reset = client.post("/api/v1/auth/customer/reset-password", json={
        "email": "customer@groupdrive.in",
        "code_or_token": "123456",
        "new_password": "Password@123",
    })
    assert res_reset.status_code == 200

    # 10. Logout
    res_logout = client.post("/api/v1/auth/customer/logout")
    assert res_logout.status_code == 200


