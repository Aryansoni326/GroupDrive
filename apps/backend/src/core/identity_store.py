from typing import Dict, Any, Optional, List
from src.core.security import hash_password

# Default demo password for all accounts
DEFAULT_HASHED_PWD = hash_password("Password@123", salt="fixeddemogroupdrivesalt2026")

DEALERS_DB: Dict[str, Dict[str, Any]] = {
    "dlr-kalyani-blr-001": {
        "id": "dlr-kalyani-blr-001",
        "legal_entity_name": "Kalyani Motors Private Limited",
        "trade_name": "Kalyani Motors Maruti Suzuki",
        "gstin": "29AABCK1234F1Z5",
        "pan": "AABCK1234F",
        "oem_brand_franchise": "Maruti Suzuki Arena",
        "registered_office_address": "No. 15, Bannerghatta Road, Bengaluru, Karnataka 560076",
        "primary_contact_email": "dealer.principal@kalyanimotors.com",
        "primary_contact_phone": "+919845012345",
        "logo_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80",
        "website_url": "https://www.kalyanimotors.com",
        "description": "Premier authorized Maruti Suzuki dealer network in Karnataka with 3 showrooms, state-of-the-art service centres, and automated central stockyards.",
        "operating_hours": "09:00 AM - 08:00 PM (Monday - Sunday)",
        "kyc_status": "VERIFIED",
        "created_at": "2026-01-15T10:00:00Z",
    },
    "dlr-advaith-blr-002": {
        "id": "dlr-advaith-blr-002",
        "legal_entity_name": "Advaith Motors India Private Limited",
        "trade_name": "Advaith Hyundai Bengaluru",
        "gstin": "29AABCA9876E1Z2",
        "pan": "AABCA9876E",
        "oem_brand_franchise": "Hyundai Motor India",
        "registered_office_address": "No. 56, Residency Road, Bengaluru, Karnataka 560025",
        "primary_contact_email": "principal@advaithhyundai.com",
        "primary_contact_phone": "+919845099887",
        "logo_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=120&auto=format&fit=crop&q=80",
        "website_url": "https://www.advaithhyundai.com",
        "description": "Authorized Hyundai dealership network in Bengaluru.",
        "operating_hours": "09:30 AM - 07:30 PM (Monday - Sunday)",
        "kyc_status": "VERIFIED",
        "created_at": "2026-02-10T11:00:00Z",
    },
    "dlr-concorde-mum-003": {
        "id": "dlr-concorde-mum-003",
        "legal_entity_name": "Concorde Motors India Private Limited",
        "trade_name": "Concorde Motors Tata Dealership",
        "gstin": "27AABCC5544D1Z9",
        "pan": "AABCC5544D",
        "oem_brand_franchise": "Tata Motors Passenger Vehicles",
        "registered_office_address": "Ground Floor, Peninsula Business Park, Lower Parel, Mumbai, Maharashtra 400013",
        "primary_contact_email": "principal@concordemotors.com",
        "primary_contact_phone": "+919820011223",
        "logo_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80",
        "website_url": "https://www.tatamotors.com",
        "description": "Leading authorized Tata Motors passenger and electric vehicle dealership in Mumbai metropolitan region.",
        "operating_hours": "09:30 AM - 08:00 PM (Monday - Sunday)",
        "kyc_status": "VERIFIED",
        "created_at": "2026-02-15T10:00:00Z",
    },
    "dlr-apex-del-004": {
        "id": "dlr-apex-del-004",
        "legal_entity_name": "Apex Auto World Private Limited",
        "trade_name": "Apex Hyundai Capital",
        "gstin": "07AABCA3322B1Z8",
        "pan": "AABCA3322B",
        "oem_brand_franchise": "Hyundai Motor India",
        "registered_office_address": "Plot 12, Barakhamba Road, Connaught Place, New Delhi 110001",
        "primary_contact_email": "dealer@apexhyundai.com",
        "primary_contact_phone": "+919811099887",
        "logo_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=120&auto=format&fit=crop&q=80",
        "website_url": "https://www.apexhyundai.in",
        "description": "Authorized premier Hyundai retail partner in Delhi NCR with state-of-the-art automated diagnostic bays.",
        "operating_hours": "09:30 AM - 08:00 PM (Monday - Sunday)",
        "kyc_status": "VERIFIED",
        "created_at": "2026-03-01T10:00:00Z",
    },
    "dlr-varun-hyd-005": {
        "id": "dlr-varun-hyd-005",
        "legal_entity_name": "Varun Motors Private Limited",
        "trade_name": "Varun Motors Maruti Suzuki",
        "gstin": "36AABCV7788A1Z1",
        "pan": "AABCV7788A",
        "oem_brand_franchise": "Maruti Suzuki Arena & Nexa",
        "registered_office_address": "Plot 88, Financial District, Gachibowli, Hyderabad, Telangana 500032",
        "primary_contact_email": "hyderabad@varunmotors.com",
        "primary_contact_phone": "+919848011223",
        "logo_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80",
        "website_url": "https://www.varunmotors.com",
        "description": "Telangana's award-winning authorized Maruti Suzuki and Nexa network with express delivery centres.",
        "operating_hours": "09:00 AM - 08:00 PM (Monday - Sunday)",
        "kyc_status": "VERIFIED",
        "created_at": "2026-03-10T10:00:00Z",
    },
    "dlr-pratham-blr-006": {
        "id": "dlr-pratham-blr-006",
        "legal_entity_name": "Pratham Motors Private Limited",
        "trade_name": "Pratham Motors Maruti Suzuki Nexa",
        "gstin": "29AABCP4411C1Z4",
        "pan": "AABCP4411C",
        "oem_brand_franchise": "Maruti Suzuki Nexa",
        "registered_office_address": "Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103",
        "primary_contact_email": "nexa.bellandur@prathammotors.com",
        "primary_contact_phone": "+919845033445",
        "logo_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&auto=format&fit=crop&q=80",
        "website_url": "https://www.prathammotors.com",
        "description": "Authorized Nexa dealership serving Bengaluru tech corridor with dedicated test drive lounges.",
        "operating_hours": "09:00 AM - 08:00 PM (Monday - Sunday)",
        "kyc_status": "VERIFIED",
        "created_at": "2026-03-15T10:00:00Z",
    },
}

BRANCHES_DB: Dict[str, Dict[str, Any]] = {
    "br-whitefield-01": {
        "id": "br-whitefield-01",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_name": "Whitefield Showroom and Delivery Centre",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "ITPL Main Road, Near Hope Farm",
        "address_line2": "Whitefield Industrial Area",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560066",
        "authorized_rto_codes": ["KA-03", "KA-53"],
        "phone_number": "+918028451122",
        "email": "whitefield@kalyanimotors.com",
        "operating_hours": "09:30 AM - 07:30 PM (Mon - Sun)",
        "manager_id": "usr-rajesh-02",
        "manager_name": "Rajesh Sharma",
        "is_active": True,
    },
    "br-bannerghatta-02": {
        "id": "br-bannerghatta-02",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_name": "Bannerghatta Flagship Showroom",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "15, Bannerghatta Main Road, Bilekahalli",
        "address_line2": "Opposite IIM Bangalore",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560076",
        "authorized_rto_codes": ["KA-01", "KA-05"],
        "phone_number": "+918026583344",
        "email": "bannerghatta@kalyanimotors.com",
        "operating_hours": "09:00 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-deepa-06",
        "manager_name": "Deepa Rao",
        "is_active": True,
    },
    "br-hosur-yard-03": {
        "id": "br-hosur-yard-03",
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_name": "Hosur Road Central Stockyard",
        "branch_type": "STOCKYARD_ONLY",
        "address_line1": "Plot 42, Electronic City Phase 2",
        "address_line2": "Hosur Main Highway",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560100",
        "authorized_rto_codes": ["KA-01", "KA-03", "KA-05", "KA-51", "KA-53"],
        "phone_number": "+918027839900",
        "email": "hosur.yard@kalyanimotors.com",
        "operating_hours": "08:00 AM - 06:00 PM (Mon - Sat)",
        "manager_id": "usr-suresh-05",
        "manager_name": "Suresh Kumar",
        "is_active": True,
    },
    "br-advaith-residency-01": {
        "id": "br-advaith-residency-01",
        "dealer_id": "dlr-advaith-blr-002",
        "branch_name": "Advaith Hyundai Residency Road",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "No. 56, Residency Road",
        "address_line2": "CBD Bangalore",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560025",
        "authorized_rto_codes": ["KA-01"],
        "phone_number": "+918022211444",
        "email": "residency@advaithhyundai.com",
        "operating_hours": "09:30 AM - 07:30 PM (Mon - Sun)",
        "manager_id": "usr-sunil-07",
        "manager_name": "Sunil Reddy",
        "is_active": True,
    },
    "br-concorde-andheri-01": {
        "id": "br-concorde-andheri-01",
        "dealer_id": "dlr-concorde-mum-003",
        "branch_name": "Concorde Tata Andheri Flagship Showroom",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "New Link Road, Opposite Infinity Mall, Andheri West",
        "address_line2": "Andheri West Commercial Hub",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pin_code": "400053",
        "authorized_rto_codes": ["MH-02", "MH-47"],
        "phone_number": "+912226748899",
        "email": "andheri@concordemotors.com",
        "operating_hours": "09:30 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-amit-mumbai",
        "manager_name": "Amit Deshmukh",
        "is_active": True,
    },
    "br-concorde-worli-02": {
        "id": "br-concorde-worli-02",
        "dealer_id": "dlr-concorde-mum-003",
        "branch_name": "Concorde Tata Worli EV Experience Hub",
        "branch_type": "SHOWROOM_ONLY",
        "address_line1": "Dr. Annie Besant Road, Near Nehru Planetarium, Worli",
        "address_line2": "South Mumbai Waterfront",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pin_code": "400018",
        "authorized_rto_codes": ["MH-01"],
        "phone_number": "+912224981122",
        "email": "worli.ev@concordemotors.com",
        "operating_hours": "10:00 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-neha-mumbai",
        "manager_name": "Neha Kulkarni",
        "is_active": True,
    },
    "br-apex-connaught-01": {
        "id": "br-apex-connaught-01",
        "dealer_id": "dlr-apex-del-004",
        "branch_name": "Apex Hyundai Connaught Place",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "Plot 12, Barakhamba Road, Connaught Place",
        "address_line2": "Central Delhi Commercial District",
        "city": "Delhi NCR",
        "state": "Delhi",
        "pin_code": "110001",
        "authorized_rto_codes": ["DL-01", "DL-02"],
        "phone_number": "+911143556677",
        "email": "connaught@apexhyundai.com",
        "operating_hours": "09:30 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-rohit-delhi",
        "manager_name": "Rohit Verma",
        "is_active": True,
    },
    "br-apex-gurugram-02": {
        "id": "br-apex-gurugram-02",
        "dealer_id": "dlr-apex-del-004",
        "branch_name": "Apex Hyundai Golf Course Road Showroom",
        "branch_type": "SHOWROOM_ONLY",
        "address_line1": "Sector 54, Golf Course Road",
        "address_line2": "Near Sector 54 Rapid Metro",
        "city": "Delhi NCR",
        "state": "Haryana",
        "pin_code": "122002",
        "authorized_rto_codes": ["HR-26", "HR-72"],
        "phone_number": "+911244889900",
        "email": "gurugram@apexhyundai.com",
        "operating_hours": "09:30 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-manish-delhi",
        "manager_name": "Manish Gupta",
        "is_active": True,
    },
    "br-varun-gachibowli-01": {
        "id": "br-varun-gachibowli-01",
        "dealer_id": "dlr-varun-hyd-005",
        "branch_name": "Varun Motors Gachibowli Nexa Flagship",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "Plot 88, Financial District, Gachibowli",
        "address_line2": "Opposite Wipro Campus",
        "city": "Hyderabad",
        "state": "Telangana",
        "pin_code": "500032",
        "authorized_rto_codes": ["TS-07", "TS-09"],
        "phone_number": "+914067112233",
        "email": "gachibowli@varunmotors.com",
        "operating_hours": "09:00 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-kiran-hyd",
        "manager_name": "Kiran Reddy",
        "is_active": True,
    },
    "br-pratham-bellandur-01": {
        "id": "br-pratham-bellandur-01",
        "dealer_id": "dlr-pratham-blr-006",
        "branch_name": "Pratham Nexa Bellandur Experience Lounge",
        "branch_type": "SHOWROOM_AND_SERVICE",
        "address_line1": "Outer Ring Road, Near Ecospace, Bellandur",
        "address_line2": "Marathahalli-Sarjapur Outer Ring Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pin_code": "560103",
        "authorized_rto_codes": ["KA-03", "KA-51"],
        "phone_number": "+918049112244",
        "email": "bellandur@prathammotors.com",
        "operating_hours": "09:00 AM - 08:00 PM (Mon - Sun)",
        "manager_id": "usr-arun-blr",
        "manager_name": "Arun Prasad",
        "is_active": True,
    },
}

# Master list of users spanning the 6 supported dealer roles plus multi-tenant rival
USERS_DB: Dict[str, Dict[str, Any]] = {
    # 1. Dealer Owner (Full dealership scope across all branches)
    "owner@kalyanimotors.com": {
        "id": "usr-vikram-01",
        "email": "owner@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Vikram",
        "last_name": "Kalyani",
        "phone_number": "+919845012345",
        "roles": ["ROLE_DEALER_OWNER"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": None, # Null branch allows access to all branches under dealer
        "designation": "Dealer Principal",
        "staff_role": "DEALER_OWNER",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-01-15T10:00:00Z",
        "last_active_at": "2026-11-06T18:00:00Z",
    },
    # 2. Branch Manager (Scoped to Whitefield branch)
    "branchmgr@kalyanimotors.com": {
        "id": "usr-rajesh-02",
        "email": "branchmgr@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Rajesh",
        "last_name": "Sharma",
        "phone_number": "+919845022334",
        "roles": ["ROLE_BRANCH_MANAGER"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "designation": "Branch General Manager",
        "staff_role": "BRANCH_MANAGER",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-01-18T10:00:00Z",
        "last_active_at": "2026-11-06T17:30:00Z",
    },
    # 3. Sales Manager (Scoped to Whitefield branch)
    "salesmgr@kalyanimotors.com": {
        "id": "usr-priya-03",
        "email": "salesmgr@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Priya",
        "last_name": "Nair",
        "phone_number": "+919845033445",
        "roles": ["ROLE_SALES_MANAGER"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "designation": "Sales Operations Head",
        "staff_role": "SALES_MANAGER",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-02-01T10:00:00Z",
        "last_active_at": "2026-11-06T16:45:00Z",
    },
    # 4. Sales Executive (Scoped to Whitefield branch)
    "salesexec@kalyanimotors.com": {
        "id": "usr-amit-04",
        "email": "salesexec@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Amit",
        "last_name": "Patel",
        "phone_number": "+919845044556",
        "roles": ["ROLE_SALES_EXECUTIVE"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "designation": "Senior Sales Consultant",
        "staff_role": "SALES_EXECUTIVE",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-02-05T11:00:00Z",
        "last_active_at": "2026-11-06T16:15:00Z",
    },
    # 5. Inventory Manager (Scoped to Hosur Stockyard)
    "inventorymgr@kalyanimotors.com": {
        "id": "usr-suresh-05",
        "email": "inventorymgr@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Suresh",
        "last_name": "Kumar",
        "phone_number": "+919845055667",
        "roles": ["ROLE_INVENTORY_MANAGER"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-hosur-yard-03",
        "designation": "Yard Logistics Lead",
        "staff_role": "INVENTORY_MANAGER",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-02-10T12:00:00Z",
        "last_active_at": "2026-11-06T15:20:00Z",
    },
    # 6. Finance Executive (Scoped to Bannerghatta branch)
    "financemgr@kalyanimotors.com": {
        "id": "usr-deepa-06",
        "email": "financemgr@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Deepa",
        "last_name": "Rao",
        "phone_number": "+919845066778",
        "roles": ["ROLE_FINANCE_EXECUTIVE"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "designation": "Finance Consultant",
        "staff_role": "FINANCE_EXECUTIVE",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-02-12T14:00:00Z",
        "last_active_at": "2026-11-06T14:40:00Z",
    },
    # 7. Additional Sales Consultant (Pending Invitation)
    "rahul.verma@kalyanimotors.com": {
        "id": "usr-rahul-08",
        "email": "rahul.verma@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Rahul",
        "last_name": "Verma",
        "phone_number": "+919845088990",
        "roles": ["ROLE_SALES_EXECUTIVE"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-whitefield-01",
        "designation": "Sales Consultant",
        "staff_role": "SALES_EXECUTIVE",
        "is_active": False,
        "invitation_status": "INVITED",
        "invited_at": "2026-10-28T14:20:00Z",
        "invited_by": "usr-rajesh-02",
        "created_at": "2026-10-28T14:20:00Z",
        "last_active_at": None,
    },
    # 8. Additional Junior Sales Consultant (Active)
    "ananya.sen@kalyanimotors.com": {
        "id": "usr-ananya-09",
        "email": "ananya.sen@kalyanimotors.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Ananya",
        "last_name": "Sen",
        "phone_number": "+919845099001",
        "roles": ["ROLE_SALES_EXECUTIVE"],
        "dealer_id": "dlr-kalyani-blr-001",
        "branch_id": "br-bannerghatta-02",
        "designation": "Junior Sales Executive",
        "staff_role": "SALES_EXECUTIVE",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-03-01T09:30:00Z",
        "last_active_at": "2026-11-06T11:00:00Z",
    },
    # Rival Dealership User 1 (for cross-tenant testing)
    "sunil@advaithhyundai.com": {
        "id": "usr-sunil-07",
        "email": "sunil@advaithhyundai.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Sunil",
        "last_name": "Gowda",
        "phone_number": "+919845077889",
        "roles": ["ROLE_DEALER_OWNER"],
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "designation": "Dealer Principal",
        "staff_role": "DEALER_OWNER",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-02-10T11:00:00Z",
        "last_active_at": "2026-11-06T12:00:00Z",
    },
    # Rival Dealership User 2 (for cross-tenant testing)
    "kavita.sharma@advaithhyundai.com": {
        "id": "usr-kavita-10",
        "email": "kavita.sharma@advaithhyundai.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Kavita",
        "last_name": "Sharma",
        "phone_number": "+919845011223",
        "roles": ["ROLE_SALES_EXECUTIVE"],
        "dealer_id": "dlr-advaith-blr-002",
        "branch_id": "br-advaith-residency-01",
        "designation": "Sales Consultant",
        "staff_role": "SALES_EXECUTIVE",
        "is_active": True,
        "invitation_status": "ACTIVE",
        "created_at": "2026-02-15T10:00:00Z",
        "last_active_at": "2026-11-06T10:30:00Z",
    },
    # 11. Customer Account 1 (Demo retail customer for website/app)
    "customer@groupdrive.in": {
        "id": "usr-cust-001",
        "email": "customer@groupdrive.in",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Rahul",
        "last_name": "Menon",
        "phone_number": "+919876543210",
        "roles": ["ROLE_CUSTOMER"],
        "dealer_id": None,
        "branch_id": None,
        "designation": "Customer Member",
        "staff_role": None,
        "is_active": True,
        "is_email_verified": True,
        "is_phone_verified": True,
        "city": "Bengaluru",
        "address": "No. 42, 14th Main, Indiranagar, Bengaluru, Karnataka 560038",
        "preferred_contact_method": "WHATSAPP",
        "invitation_status": "ACTIVE",
        "created_at": "2026-03-01T10:00:00Z",
        "last_active_at": "2026-11-06T19:00:00Z",
    },
    # 12. Customer Account 2 (Demo retail customer for website/app)
    "priya.customer@gmail.com": {
        "id": "usr-cust-002",
        "email": "priya.customer@gmail.com",
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": "Priya",
        "last_name": "Kashyap",
        "phone_number": "+919876501234",
        "roles": ["ROLE_CUSTOMER"],
        "dealer_id": None,
        "branch_id": None,
        "designation": "Customer Member",
        "staff_role": None,
        "is_active": True,
        "is_email_verified": True,
        "is_phone_verified": True,
        "city": "Bengaluru",
        "address": "Flat 304, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103",
        "preferred_contact_method": "PHONE",
        "invitation_status": "ACTIVE",
        "created_at": "2026-03-05T11:00:00Z",
        "last_active_at": "2026-11-06T18:30:00Z",
    },
}

def register_customer_user(payload: Dict[str, Any]) -> Dict[str, Any]:
    import uuid
    from datetime import datetime, timezone
    email = payload["email"].lower().strip()
    if email in USERS_DB:
        raise ValueError("An account with this email address already exists.")

    user_id = f"usr-cust-{uuid.uuid4().hex[:8]}"
    now_str = datetime.now(timezone.utc).isoformat()
    new_user = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload["password"]),
        "first_name": payload.get("first_name", "").strip(),
        "last_name": payload.get("last_name", "").strip(),
        "phone_number": payload.get("phone_number", "").strip(),
        "city": payload.get("city", "Bengaluru"),
        "address": payload.get("address", "").strip(),
        "preferred_contact_method": payload.get("preferred_contact_method", "EMAIL"),
        "roles": ["ROLE_CUSTOMER"],
        "dealer_id": None,
        "branch_id": None,
        "designation": "Customer Member",
        "staff_role": None,
        "is_active": True,
        "is_email_verified": False,
        "is_phone_verified": False,
        "invitation_status": "ACTIVE",
        "created_at": now_str,
        "last_active_at": now_str,
    }
    USERS_DB[email] = new_user
    return new_user

def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return USERS_DB.get(email.lower().strip())

def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    for u in USERS_DB.values():
        if u["id"] == user_id:
            return u
    return None

def get_dealer_by_id(dealer_id: str) -> Optional[Dict[str, Any]]:
    return DEALERS_DB.get(dealer_id)

def get_branches_by_dealer_id(dealer_id: str) -> List[Dict[str, Any]]:
    return [b for b in BRANCHES_DB.values() if b["dealer_id"] == dealer_id]

def get_branch_by_id(branch_id: str) -> Optional[Dict[str, Any]]:
    return BRANCHES_DB.get(branch_id)

def update_dealer_profile(dealer_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    dealer = DEALERS_DB.get(dealer_id)
    if not dealer:
        return None
    # Security requirement: Prevent unauthorized modification of verification status and legal tax identifiers
    forbidden_keys = {"id", "kyc_status", "gstin", "pan", "created_at"}
    for key, value in updates.items():
        if key not in forbidden_keys and value is not None:
            dealer[key] = value
    return dealer

def create_dealer_branch(branch_data: Dict[str, Any]) -> Dict[str, Any]:
    branch_id = branch_data.get("id") or f"br-{len(BRANCHES_DB) + 1:03d}"
    branch = {
        "id": branch_id,
        "dealer_id": branch_data["dealer_id"],
        "branch_name": branch_data["branch_name"],
        "branch_type": branch_data.get("branch_type", "SHOWROOM_AND_SERVICE"),
        "address_line1": branch_data.get("address_line1", ""),
        "address_line2": branch_data.get("address_line2"),
        "city": branch_data.get("city", "Bengaluru"),
        "state": branch_data.get("state", "Karnataka"),
        "pin_code": branch_data.get("pin_code", "560001"),
        "authorized_rto_codes": branch_data.get("authorized_rto_codes", []),
        "phone_number": branch_data.get("phone_number", ""),
        "email": branch_data.get("email"),
        "operating_hours": branch_data.get("operating_hours", "09:30 AM - 07:30 PM (Mon - Sun)"),
        "manager_id": branch_data.get("manager_id"),
        "manager_name": branch_data.get("manager_name"),
        "is_active": branch_data.get("is_active", True),
    }
    BRANCHES_DB[branch_id] = branch
    return branch

def update_dealer_branch(branch_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    branch = BRANCHES_DB.get(branch_id)
    if not branch:
        return None
    forbidden_keys = {"id", "dealer_id"}
    for key, value in updates.items():
        if key not in forbidden_keys and value is not None:
            branch[key] = value
    return branch

def toggle_branch_status(branch_id: str, is_active: bool) -> Optional[Dict[str, Any]]:
    branch = BRANCHES_DB.get(branch_id)
    if not branch:
        return None
    branch["is_active"] = is_active
    return branch

# Staff Management Activity Logs (Audit Trail)
STAFF_ACTIVITY_LOGS: List[Dict[str, Any]] = [
    {
        "id": "act-001",
        "dealer_id": "dlr-kalyani-blr-001",
        "staff_id": "usr-amit-04",
        "target_name": "Amit Patel",
        "action": "STAFF_INVITED",
        "details": "Invited as Senior Sales Consultant assigned to Whitefield Showroom",
        "actor_id": "usr-vikram-01",
        "actor_name": "Vikram Kalyani",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-02-05T11:00:00Z",
    },
    {
        "id": "act-002",
        "dealer_id": "dlr-kalyani-blr-001",
        "staff_id": "usr-priya-03",
        "target_name": "Priya Nair",
        "action": "ROLE_CHANGED",
        "details": "Promoted to Sales Operations Head for Whitefield Showroom",
        "actor_id": "usr-vikram-01",
        "actor_name": "Vikram Kalyani",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-02-15T11:45:00Z",
    },
    {
        "id": "act-003",
        "dealer_id": "dlr-kalyani-blr-001",
        "staff_id": "usr-suresh-05",
        "target_name": "Suresh Kumar",
        "action": "BRANCH_REASSIGNED",
        "details": "Assigned to Hosur Road Central Stockyard as Yard Logistics Lead",
        "actor_id": "usr-vikram-01",
        "actor_name": "Vikram Kalyani",
        "actor_role": "DEALER_OWNER",
        "timestamp": "2026-03-01T09:15:00Z",
    },
    {
        "id": "act-004",
        "dealer_id": "dlr-kalyani-blr-001",
        "staff_id": "usr-rahul-08",
        "target_name": "Rahul Verma",
        "action": "STAFF_INVITED",
        "details": "Invitation sent for Sales Consultant role at Whitefield Showroom",
        "actor_id": "usr-rajesh-02",
        "actor_name": "Rajesh Sharma",
        "actor_role": "BRANCH_MANAGER",
        "timestamp": "2026-10-28T14:20:00Z",
    },
]

def format_staff_record(u: Dict[str, Any]) -> Dict[str, Any]:
    branch = BRANCHES_DB.get(u.get("branch_id") or "")
    branch_name = branch["branch_name"] if branch else ("All Branches" if not u.get("branch_id") else "Unknown Branch")
    return {
        "id": u["id"],
        "user_id": u["id"],
        "dealer_id": u["dealer_id"],
        "branch_id": u.get("branch_id"),
        "branch_name": branch_name,
        "designation": u.get("designation", ""),
        "staff_role": u.get("staff_role", "SALES_EXECUTIVE"),
        "is_active": u.get("is_active", True),
        "first_name": u.get("first_name", ""),
        "last_name": u.get("last_name", ""),
        "email": u["email"],
        "phone_number": u.get("phone_number", ""),
        "invitation_status": u.get("invitation_status", "ACTIVE"),
        "invited_at": u.get("invited_at"),
        "invited_by": u.get("invited_by"),
        "last_active_at": u.get("last_active_at"),
        "created_at": u.get("created_at", "2026-01-01T00:00:00Z"),
    }

def get_staff_by_dealer_id(dealer_id: str) -> List[Dict[str, Any]]:
    staff_list = []
    for u in USERS_DB.values():
        if u.get("dealer_id") == dealer_id:
            staff_list.append(format_staff_record(u))
    return staff_list

def get_staff_member_by_id(staff_id: str, dealer_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    for u in USERS_DB.values():
        if u["id"] == staff_id:
            if dealer_id and u.get("dealer_id") != dealer_id:
                return None
            return format_staff_record(u)
    return None

def record_staff_activity(
    dealer_id: str,
    staff_id: str,
    target_name: str,
    action: str,
    details: str,
    actor: Dict[str, Any]
) -> Dict[str, Any]:
    import datetime
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    log_entry = {
        "id": f"act-{len(STAFF_ACTIVITY_LOGS) + 1:04d}",
        "dealer_id": dealer_id,
        "staff_id": staff_id,
        "target_name": target_name,
        "action": action,
        "details": details,
        "actor_id": actor.get("id", "sys"),
        "actor_name": f"{actor.get('first_name', '')} {actor.get('last_name', '')}".strip() or "System",
        "actor_role": actor.get("staff_role", "DEALER_OWNER"),
        "timestamp": now_str,
    }
    STAFF_ACTIVITY_LOGS.insert(0, log_entry)
    return log_entry

def invite_staff_member(payload: Dict[str, Any], actor: Dict[str, Any]) -> Dict[str, Any]:
    import datetime
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    email = payload["email"].lower().strip()
    
    # Check if user already exists
    if email in USERS_DB:
        raise ValueError(f"User with email {email} already exists")

    staff_id = f"usr-{len(USERS_DB) + 1:02d}"
    staff_role = payload.get("staff_role", "SALES_EXECUTIVE")
    new_user = {
        "id": staff_id,
        "email": email,
        "password_hash": DEFAULT_HASHED_PWD,
        "first_name": payload.get("first_name", ""),
        "last_name": payload.get("last_name", ""),
        "phone_number": payload.get("phone_number", ""),
        "roles": [f"ROLE_{staff_role}"],
        "dealer_id": payload["dealer_id"],
        "branch_id": payload.get("branch_id"),
        "designation": payload.get("designation", "Staff Consultant"),
        "staff_role": staff_role,
        "is_active": True,
        "invitation_status": "INVITED",
        "invited_at": now_str,
        "invited_by": actor.get("id"),
        "created_at": now_str,
        "last_active_at": None,
    }
    USERS_DB[email] = new_user

    # Record activity log
    target_name = f"{new_user['first_name']} {new_user['last_name']}".strip() or email
    branch = BRANCHES_DB.get(new_user.get("branch_id") or "")
    branch_name = branch["branch_name"] if branch else "All Branches"
    record_staff_activity(
        dealer_id=payload["dealer_id"],
        staff_id=staff_id,
        target_name=target_name,
        action="STAFF_INVITED",
        details=f"Invited as {new_user['designation']} ({staff_role.replace('_', ' ')}) at {branch_name}",
        actor=actor,
    )

    return format_staff_record(new_user)

def update_staff_member(
    staff_id: str,
    updates: Dict[str, Any],
    actor: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    target_user = None
    target_email = None
    for em, u in USERS_DB.items():
        if u["id"] == staff_id:
            target_user = u
            target_email = em
            break

    if not target_user:
        return None

    old_role = target_user.get("staff_role")
    old_branch_id = target_user.get("branch_id")
    target_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()

    # Allowed fields
    if "first_name" in updates and updates["first_name"]:
        target_user["first_name"] = updates["first_name"]
    if "last_name" in updates and updates["last_name"]:
        target_user["last_name"] = updates["last_name"]
    if "phone_number" in updates and updates["phone_number"]:
        target_user["phone_number"] = updates["phone_number"]
    if "designation" in updates and updates["designation"]:
        target_user["designation"] = updates["designation"]

    # Role reassignment
    new_role = updates.get("staff_role")
    if new_role and new_role != old_role:
        target_user["staff_role"] = new_role
        target_user["roles"] = [f"ROLE_{new_role}"]
        record_staff_activity(
            dealer_id=target_user["dealer_id"],
            staff_id=staff_id,
            target_name=target_name,
            action="ROLE_CHANGED",
            details=f"Role changed from {old_role.replace('_', ' ')} to {new_role.replace('_', ' ')}",
            actor=actor,
        )

    # Branch reassignment
    if "branch_id" in updates:
        new_branch_id = updates["branch_id"]
        if new_branch_id != old_branch_id:
            target_user["branch_id"] = new_branch_id
            old_b_name = BRANCHES_DB.get(old_branch_id, {}).get("branch_name", "All Branches") if old_branch_id else "All Branches"
            new_b_name = BRANCHES_DB.get(new_branch_id, {}).get("branch_name", "All Branches") if new_branch_id else "All Branches"
            record_staff_activity(
                dealer_id=target_user["dealer_id"],
                staff_id=staff_id,
                target_name=target_name,
                action="BRANCH_REASSIGNED",
                details=f"Reassigned from {old_b_name} to {new_b_name}",
                actor=actor,
            )

    record_staff_activity(
        dealer_id=target_user["dealer_id"],
        staff_id=staff_id,
        target_name=target_name,
        action="PROFILE_UPDATED",
        details=f"Updated profile information for {target_name}",
        actor=actor,
    )

    return format_staff_record(target_user)

def toggle_staff_status(
    staff_id: str,
    is_active: bool,
    actor: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    target_user = None
    for u in USERS_DB.values():
        if u["id"] == staff_id:
            target_user = u
            break

    if not target_user:
        return None

    target_user["is_active"] = is_active
    if not is_active:
        target_user["invitation_status"] = "INACTIVE"
    else:
        if target_user.get("invitation_status") == "INACTIVE":
            target_user["invitation_status"] = "ACTIVE"

    target_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()
    action = "STAFF_ACTIVATED" if is_active else "STAFF_DEACTIVATED"
    record_staff_activity(
        dealer_id=target_user["dealer_id"],
        staff_id=staff_id,
        target_name=target_name,
        action=action,
        details=f"Staff member account {'activated' if is_active else 'deactivated'} by {actor.get('first_name', '')} {actor.get('last_name', '')}".strip(),
        actor=actor,
    )

    return format_staff_record(target_user)

def resend_staff_invitation(
    staff_id: str,
    actor: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    import datetime
    now_str = datetime.datetime.utcnow().isoformat() + "Z"
    target_user = None
    for u in USERS_DB.values():
        if u["id"] == staff_id:
            target_user = u
            break

    if not target_user:
        return None

    target_user["invitation_status"] = "INVITED"
    target_user["invited_at"] = now_str
    target_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()

    record_staff_activity(
        dealer_id=target_user["dealer_id"],
        staff_id=staff_id,
        target_name=target_name,
        action="INVITATION_RESENT",
        details=f"Invitation link resent to {target_user['email']}",
        actor=actor,
    )

    return format_staff_record(target_user)

def revoke_staff_invitation(
    staff_id: str,
    actor: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    target_user = None
    for u in USERS_DB.values():
        if u["id"] == staff_id:
            target_user = u
            break

    if not target_user:
        return None

    target_user["invitation_status"] = "INVITATION_REVOKED"
    target_user["is_active"] = False
    target_name = f"{target_user.get('first_name', '')} {target_user.get('last_name', '')}".strip()

    record_staff_activity(
        dealer_id=target_user["dealer_id"],
        staff_id=staff_id,
        target_name=target_name,
        action="INVITATION_REVOKED",
        details=f"Pending invitation revoked for {target_user['email']}",
        actor=actor,
    )

    return format_staff_record(target_user)

def get_staff_activity_logs(
    dealer_id: str,
    staff_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    logs = [log for log in STAFF_ACTIVITY_LOGS if log["dealer_id"] == dealer_id]
    if staff_id:
        logs = [log for log in logs if log["staff_id"] == staff_id]
    return logs



