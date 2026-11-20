from typing import Dict, Any, Optional, List

CATALOGUE_BRANDS: Dict[str, Dict[str, Any]] = {
    "brd-maruti": {
        "id": "brd-maruti",
        "name": "Maruti Suzuki",
        "country": "India",
        "logo_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=80",
    },
    "brd-hyundai": {
        "id": "brd-hyundai",
        "name": "Hyundai",
        "country": "South Korea",
        "logo_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=100&auto=format&fit=crop&q=80",
    },
    "brd-tata": {
        "id": "brd-tata",
        "name": "Tata Motors",
        "country": "India",
        "logo_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=100&auto=format&fit=crop&q=80",
    },
}

CATALOGUE_MODELS: Dict[str, Dict[str, Any]] = {
    "mod-brezza-01": {
        "id": "mod-brezza-01",
        "brand_id": "brd-maruti",
        "brand_name": "Maruti Suzuki",
        "name": "Brezza",
        "body_type": "Compact SUV",
        "seating_capacity": 5,
        "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
    },
    "mod-gvitara-01": {
        "id": "mod-gvitara-01",
        "brand_id": "brd-maruti",
        "brand_name": "Maruti Suzuki",
        "name": "Grand Vitara",
        "body_type": "Mid-Size SUV",
        "seating_capacity": 5,
        "image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80",
    },
    "mod-swift-01": {
        "id": "mod-swift-01",
        "brand_id": "brd-maruti",
        "brand_name": "Maruti Suzuki",
        "name": "Swift 2026",
        "body_type": "Hatchback",
        "seating_capacity": 5,
        "image_url": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80",
    },
    "mod-fronx-01": {
        "id": "mod-fronx-01",
        "brand_id": "brd-maruti",
        "brand_name": "Maruti Suzuki",
        "name": "Fronx",
        "body_type": "Crossover SUV",
        "seating_capacity": 5,
        "image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80",
    },
    "mod-creta-01": {
        "id": "mod-creta-01",
        "brand_id": "brd-hyundai",
        "brand_name": "Hyundai",
        "name": "Creta",
        "body_type": "Mid-Size SUV",
        "seating_capacity": 5,
        "image_url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
    },
    "mod-nexon-01": {
        "id": "mod-nexon-01",
        "brand_id": "brd-tata",
        "brand_name": "Tata Motors",
        "name": "Nexon EV",
        "body_type": "Compact Electric SUV",
        "seating_capacity": 5,
        "image_url": "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80",
    },
}

CATALOGUE_VARIANTS: Dict[str, Dict[str, Any]] = {
    "var-brz-zxi-plus": {
        "id": "var-brz-zxi-plus",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "brand_name": "Maruti Suzuki",
        "name": "ZXi Plus 1.5L AT",
        "fuel_type": "Petrol",
        "transmission_type": "Automatic",
        "engine_capacity_cc": 1462,
        "engine_description": "1.5L K15C Smart Hybrid 4-Cylinder Petrol",
        "power_ps": "103 PS @ 6000 rpm",
        "torque_nm": "136.8 Nm @ 4400 rpm",
        "arai_mileage": "19.8 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1398000,
        "colours": [
            {"id": "col-red-blk", "name": "Sizzling Red with Midnight Black", "hex_code": "#C62828", "is_dual_tone": True},
            {"id": "col-pearl-white", "name": "Pearl Arctic White", "hex_code": "#F5F5F5", "is_dual_tone": False},
            {"id": "col-magma-grey", "name": "Magma Grey", "hex_code": "#616161", "is_dual_tone": False},
        ],
    },
    "var-brz-zxi": {
        "id": "var-brz-zxi",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "brand_name": "Maruti Suzuki",
        "name": "ZXi 1.5L 5MT",
        "fuel_type": "Petrol",
        "transmission_type": "Manual",
        "engine_capacity_cc": 1462,
        "engine_description": "1.5L K15C Smart Hybrid Petrol",
        "power_ps": "103 PS @ 6000 rpm",
        "torque_nm": "136.8 Nm @ 4400 rpm",
        "arai_mileage": "20.1 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1114000,
        "colours": [
            {"id": "col-pearl-white", "name": "Pearl Arctic White", "hex_code": "#F5F5F5", "is_dual_tone": False},
            {"id": "col-splendid-silver", "name": "Splendid Silver", "hex_code": "#B0BEC5", "is_dual_tone": False},
        ],
    },
    "var-brz-vxi-cng": {
        "id": "var-brz-vxi-cng",
        "model_id": "mod-brezza-01",
        "model_name": "Brezza",
        "brand_name": "Maruti Suzuki",
        "name": "VXi 1.5L S-CNG 5MT",
        "fuel_type": "CNG",
        "transmission_type": "Manual",
        "engine_capacity_cc": 1462,
        "engine_description": "1.5L K15C DualJet S-CNG",
        "power_ps": "87.8 PS @ 5500 rpm",
        "torque_nm": "121.5 Nm @ 4200 rpm",
        "arai_mileage": "25.51 km/kg",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1065000,
        "colours": [
            {"id": "col-pearl-white", "name": "Pearl Arctic White", "hex_code": "#F5F5F5", "is_dual_tone": False},
            {"id": "col-magma-grey", "name": "Magma Grey", "hex_code": "#616161", "is_dual_tone": False},
        ],
    },
    "var-gv-alpha-at": {
        "id": "var-gv-alpha-at",
        "model_id": "mod-gvitara-01",
        "model_name": "Grand Vitara",
        "brand_name": "Maruti Suzuki",
        "name": "Alpha 1.5L Intelligent Electric Hybrid e-CVT",
        "fuel_type": "Strong Hybrid",
        "transmission_type": "e-CVT",
        "engine_capacity_cc": 1490,
        "engine_description": "1.5L Intelligent Electric Strong Hybrid + Self-Charging Battery",
        "power_ps": "116 PS Combined Output",
        "torque_nm": "141 Nm (Engine) + 141 Nm (Motor)",
        "arai_mileage": "27.97 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1983000,
        "colours": [
            {"id": "col-opulent-red", "name": "Opulent Red with Black Roof", "hex_code": "#880E4F", "is_dual_tone": True},
            {"id": "col-grandeur-grey", "name": "Grandeur Grey", "hex_code": "#455A64", "is_dual_tone": False},
        ],
    },
    "var-swf-zxi-mt": {
        "id": "var-swf-zxi-mt",
        "model_id": "mod-swift-01",
        "model_name": "Swift 2026",
        "brand_name": "Maruti Suzuki",
        "name": "ZXi 1.2L DualJet 5MT",
        "fuel_type": "Petrol",
        "transmission_type": "Manual",
        "engine_capacity_cc": 1197,
        "engine_description": "1.2L Z12E 3-Cylinder DualJet Petrol",
        "power_ps": "81.6 PS @ 5700 rpm",
        "torque_nm": "111.7 Nm @ 4300 rpm",
        "arai_mileage": "24.8 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 829000,
        "colours": [
            {"id": "col-luster-blue", "name": "Luster Blue", "hex_code": "#1565C0", "is_dual_tone": False},
            {"id": "col-sizzling-red", "name": "Sizzling Red", "hex_code": "#D32F2F", "is_dual_tone": False},
        ],
    },
    "var-frx-zeta-turbo": {
        "id": "var-frx-zeta-turbo",
        "model_id": "mod-fronx-01",
        "model_name": "Fronx",
        "brand_name": "Maruti Suzuki",
        "name": "Zeta 1.0L BoosterJet 6AT",
        "fuel_type": "Petrol",
        "transmission_type": "Automatic",
        "engine_capacity_cc": 998,
        "engine_description": "1.0L Turbo BoosterJet Direct Injection",
        "power_ps": "100.06 PS @ 5500 rpm",
        "torque_nm": "147.6 Nm @ 2000-4500 rpm",
        "arai_mileage": "20.01 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1205000,
        "colours": [
            {"id": "col-grandeur-grey", "name": "Grandeur Grey", "hex_code": "#455A64", "is_dual_tone": False},
            {"id": "col-arctic-white", "name": "Arctic White", "hex_code": "#FFFFFF", "is_dual_tone": False},
        ],
    },
    "var-creta-sx": {
        "id": "var-creta-sx",
        "model_id": "mod-creta-01",
        "model_name": "Creta",
        "brand_name": "Hyundai",
        "name": "SX(O) 1.5L IVT",
        "fuel_type": "Petrol",
        "transmission_type": "IVT",
        "engine_capacity_cc": 1497,
        "engine_description": "1.5L MPi Smartstream Petrol",
        "power_ps": "115 PS @ 6300 rpm",
        "torque_nm": "143.8 Nm @ 4500 rpm",
        "arai_mileage": "17.7 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1870000,
        "colours": [
            {"id": "col-abyss-black", "name": "Abyss Black Pearl", "hex_code": "#212121", "is_dual_tone": False},
            {"id": "col-atlas-white", "name": "Atlas White", "hex_code": "#FAFAFA", "is_dual_tone": False},
        ],
    },
    "var-creta-diesel-at": {
        "id": "var-creta-diesel-at",
        "model_id": "mod-creta-01",
        "model_name": "Creta",
        "brand_name": "Hyundai",
        "name": "SX(O) 1.5L CRDi Diesel 6AT",
        "fuel_type": "Diesel",
        "transmission_type": "Automatic",
        "engine_capacity_cc": 1493,
        "engine_description": "1.5L U2 CRDi Diesel with Variable Geometry Turbocharger",
        "power_ps": "116 PS @ 4000 rpm",
        "torque_nm": "250 Nm @ 1500-2750 rpm",
        "arai_mileage": "19.1 kmpl",
        "seating_capacity": 5,
        "emission_standard": "BS6 Phase 2",
        "official_ex_showroom_price": 1999000,
        "colours": [
            {"id": "col-titan-grey", "name": "Titan Grey Matte", "hex_code": "#424242", "is_dual_tone": False},
            {"id": "col-abyss-black", "name": "Abyss Black Pearl", "hex_code": "#212121", "is_dual_tone": False},
        ],
    },
    "var-nexon-ev-empowered": {
        "id": "var-nexon-ev-empowered",
        "model_id": "mod-nexon-01",
        "model_name": "Nexon EV",
        "brand_name": "Tata Motors",
        "name": "Empowered Plus Long Range 40.5kWh",
        "fuel_type": "Electric",
        "transmission_type": "Automatic",
        "engine_capacity_cc": 0,
        "engine_description": "Permanent Magnet Synchronous AC Motor with 40.5 kWh High Energy Density Battery",
        "power_ps": "145 PS",
        "torque_nm": "215 Nm Instant Torque",
        "arai_mileage": "465 km per full charge",
        "seating_capacity": 5,
        "emission_standard": "Zero Emission Electric",
        "official_ex_showroom_price": 1949000,
        "colours": [
            {"id": "col-empowered-oxide", "name": "Empowered Oxide Dual Tone", "hex_code": "#37474F", "is_dual_tone": True},
            {"id": "col-pristine-white", "name": "Pristine White", "hex_code": "#ECEFF1", "is_dual_tone": False},
        ],
    },
}

def get_all_brands() -> List[Dict[str, Any]]:
    return list(CATALOGUE_BRANDS.values())

def get_all_models(brand_id: Optional[str] = None) -> List[Dict[str, Any]]:
    models = list(CATALOGUE_MODELS.values())
    if brand_id:
        models = [m for m in models if m["brand_id"] == brand_id]
    return models

def get_model_by_id(model_id: str) -> Optional[Dict[str, Any]]:
    return CATALOGUE_MODELS.get(model_id)

def get_all_variants(
    model_id: Optional[str] = None,
    fuel_type: Optional[str] = None,
    transmission: Optional[str] = None
) -> List[Dict[str, Any]]:
    variants = list(CATALOGUE_VARIANTS.values())
    if model_id:
        variants = [v for v in variants if v["model_id"] == model_id]
    if fuel_type and fuel_type != "ALL":
        variants = [v for v in variants if v["fuel_type"].lower() == fuel_type.lower()]
    if transmission and transmission != "ALL":
        variants = [v for v in variants if v["transmission_type"].lower() == transmission.lower()]
    return variants

def get_variant_by_id(variant_id: str) -> Optional[Dict[str, Any]]:
    return CATALOGUE_VARIANTS.get(variant_id)

