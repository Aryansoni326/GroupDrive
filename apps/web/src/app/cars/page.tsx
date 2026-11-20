"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { customerApi } from "@groupdrive/api-client";
import {
  CatalogueBrand,
  CatalogueModel,
  CatalogueVariant,
  PublicBuyerGroupItem,
} from "@groupdrive/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle-card";
import { EnquiryModal } from "@/components/enquiry-modal";
import { BuyerGroupCard } from "@/components/buyer-group-card";
import { JoinGroupModal } from "@/components/join-group-modal";
import { formatINR } from "@groupdrive/utils";
import { useCompare } from "@/lib/compare-context";

interface EnrichedModel {
  car: CatalogueModel;
  primaryVariant?: CatalogueVariant;
  allVariants: CatalogueVariant[];
  fuelTypes: string[];
  transmissions: string[];
  minPrice: number;
  maxPrice: number;
  power: string;
  mileage: string;
  numericMileage: number;
  activeGroupCount: number;
  maxGroupSavings: number;
}

function CarsCatalogueInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL initial query parameters
  const queryParam = searchParams.get("q") || "";
  const brandParam = searchParams.get("brand") || "ALL";
  const bodyTypeParam = searchParams.get("bodyType") || "ALL";
  const fuelParam = searchParams.get("fuel") || "ALL";
  const budgetParam = searchParams.get("budget") || "ALL";
  const viewParam = searchParams.get("view") || "grid";

  // Raw API state
  const [brands, setBrands] = React.useState<CatalogueBrand[]>([]);
  const [models, setModels] = React.useState<CatalogueModel[]>([]);
  const [variants, setVariants] = React.useState<CatalogueVariant[]>([]);
  const [groups, setGroups] = React.useState<PublicBuyerGroupItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);

  // Active filter states
  const [searchQuery, setSearchQuery] = React.useState<string>(queryParam);
  const [selectedBrand, setSelectedBrand] = React.useState<string>(brandParam);
  const [selectedModel, setSelectedModel] = React.useState<string>("ALL");
  const [selectedBodyType, setSelectedBodyType] = React.useState<string>(bodyTypeParam);
  const [selectedFuel, setSelectedFuel] = React.useState<string>(fuelParam);
  const [selectedTransmission, setSelectedTransmission] = React.useState<string>("ALL");
  const [selectedBudget, setSelectedBudget] = React.useState<string>(budgetParam);
  const [selectedLaunch, setSelectedLaunch] = React.useState<string>("ALL");
  const [selectedSeating, setSelectedSeating] = React.useState<string>("ALL");

  // Hero carousel state
  const [activeSlide, setActiveSlide] = React.useState<number>(0);
  const [isSlidePaused, setIsSlidePaused] = React.useState<boolean>(false);

  // Presentation & Sorting states
  const [sortBy, setSortBy] = React.useState<string>("featured");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">(
    viewParam === "list" ? "list" : "grid"
  );
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const pageSize = 12;

  // Search suggestions autocomplete popover
  const [isSearchFocused, setIsSearchFocused] = React.useState<boolean>(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Mobile filters drawer open/close
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState<boolean>(false);

  // Global comparison & enquiry modals
  const { comparedVehicles, isVehicleComparing, toggleVehicle, removeVehicle, clearVehicles } = useCompare();
  const [testDriveCar, setTestDriveCar] = React.useState<{ brand: string; model: string } | null>(null);

  // Tab Navigation state: 'catalogue' | 'compare' | 'groups'
  const tabParam = (searchParams.get("tab") as "catalogue" | "compare" | "groups") || "catalogue";
  const [activeTab, setActiveTab] = React.useState<"catalogue" | "compare" | "groups">(tabParam);

  React.useEffect(() => {
    if (tabParam && ["catalogue", "compare", "groups"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Group Buying filtering state inside Explore Cars
  const [groupCity, setGroupCity] = React.useState<string>("ALL");
  const [groupStatus, setGroupStatus] = React.useState<string>("ALL");
  const [selectedGroupToJoin, setSelectedGroupToJoin] = React.useState<PublicBuyerGroupItem | null>(null);

  const filteredBuyerGroups = React.useMemo(() => {
    return groups.filter((g) => {
      if (groupCity !== "ALL" && g.city !== groupCity) return false;
      if (groupStatus !== "ALL" && g.status !== groupStatus) return false;
      return true;
    });
  }, [groups, groupCity, groupStatus]);

  // Sync state if URL query params change externally
  React.useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
    if (brandParam) setSelectedBrand(brandParam);
    if (bodyTypeParam) setSelectedBodyType(bodyTypeParam);
    if (fuelParam) setSelectedFuel(fuelParam);
    if (budgetParam) setSelectedBudget(budgetParam);
  }, [queryParam, brandParam, bodyTypeParam, fuelParam, budgetParam]);

  // Click outside listener for search suggestions popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hero Carousel Slides Definition
  const heroSlides = React.useMemo(() => [
    {
      id: 0,
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&auto=format&fit=crop&q=85",
      badge: "⚡ Collective Volume Fleet Pricing",
      title: "Save Up To ₹85,000+ On Your Next New Car",
      description: "Join verified buyer groups in your metro RTO territory. Authorized OEM dealerships submit legally binding reverse bids to win your group allocation.",
      highlights: ["100% Authorized OEM Network", "Zero Brokerage or Upfront Fees", "Direct Showroom Billing"],
      ctaText: "Explore Vehicle Catalogue",
      action: () => {
        const el = document.getElementById("filter-engine-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&auto=format&fit=crop&q=85",
      badge: "🛡️ Official Showroom Handover",
      title: "100% Factory Warranty & Direct Showroom Delivery",
      description: "Skip pushy salesperson negotiations. Get transparent line-item pricing with explicit ex-showroom, RTO, and official manufacturer warranty.",
      highlights: ["Direct Showroom Handover", "Complete On-Road Transparency", "Bank-Grade Buyer Isolation"],
      ctaText: "Compare Vehicles Side-by-Side",
      action: () => {
        setActiveTab("compare");
        router.replace("/cars?tab=compare", { scroll: false });
      },
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1600&auto=format&fit=crop&q=85",
      badge: "⭐ DealerOS 2026 Launches",
      title: "Newly Launched Models & Ready Stockyard Inventory",
      description: "Explore the latest 2026 SUV, EV, and Hybrid launches submitted directly by authorized dealership principals on DealerOS with real-time stock allocation.",
      highlights: ["Verified Real-Time Inventory", "Instant VIN Stock Allocation", "Active Buyer Demand Groups"],
      ctaText: "View 2026 New Launches",
      action: () => {
        setSelectedLaunch("NEW_LAUNCH");
        const el = document.getElementById("filter-engine-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
  ], [router]);

  // Auto-rotate Hero Carousel every 3 seconds (paused on hover)
  React.useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isSlidePaused, heroSlides.length]);

  // Fetch centralized catalogue data
  const loadCatalogue = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [brandsRes, modelsRes, variantsRes, groupsRes] = await Promise.all([
        customerApi.catalogue.getBrands(),
        customerApi.catalogue.getModels(),
        customerApi.catalogue.getVariants(),
        customerApi.groups.listGroups(),
      ]);

      if (brandsRes.data) setBrands(brandsRes.data);
      if (modelsRes.data) setModels(modelsRes.data);
      if (variantsRes.data) setVariants(variantsRes.data);
      if (groupsRes.data) setGroups(groupsRes.data);
    } catch (err) {
      console.error("Failed to load vehicle catalogue:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  // Enrich models with variants, price bounds, specifications and live group info
  const enrichedModels: EnrichedModel[] = React.useMemo(() => {
    return models.map((car) => {
      const carVariants = variants.filter((v) => v.model_id === car.id);
      const primaryVariant = carVariants[0];

      const fuelTypes = carVariants.length > 0
        ? Array.from(new Set(carVariants.map((v) => v.fuel_type)))
        : car.body_type.toLowerCase().includes("electric")
        ? ["Electric"]
        : ["Petrol"];

      const transmissions = carVariants.length > 0
        ? Array.from(new Set(carVariants.map((v) => v.transmission_type)))
        : ["Manual", "Automatic"];

      const minPrice = carVariants.length > 0
        ? Math.min(...carVariants.map((v) => v.official_ex_showroom_price))
        : car.body_type.includes("SUV")
        ? 1050000
        : 750000;

      const maxPrice = carVariants.length > 0
        ? Math.max(...carVariants.map((v) => v.official_ex_showroom_price))
        : Math.round(minPrice * 1.35);

      const power = primaryVariant?.power_ps || (car.body_type.includes("Electric") ? "145 PS" : "103 PS");
      const mileage = primaryVariant?.arai_mileage || "19.8 kmpl";

      // Parse numeric mileage for sorting
      const matchNum = mileage.match(/[\d.]+/);
      const numericMileage = matchNum ? parseFloat(matchNum[0]) : 18;

      const modelGroups = groups.filter(
        (g) => g.model_id === car.id || g.model_name.toLowerCase().includes(car.name.toLowerCase())
      );

      return {
        car,
        primaryVariant,
        allVariants: carVariants,
        fuelTypes,
        transmissions,
        minPrice,
        maxPrice,
        power,
        mileage,
        numericMileage,
        activeGroupCount: modelGroups.length,
        maxGroupSavings: modelGroups[0]?.estimated_savings_inr || 45000,
      };
    });
  }, [models, variants, groups]);

  // Search Suggestions (Autocomplete matching query)
  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const suggestions: Array<{
      type: "model" | "brand" | "variant";
      title: string;
      subtitle: string;
      action: () => void;
    }> = [];

    // Match Models
    models.forEach((m) => {
      if (
        m.name.toLowerCase().includes(q) ||
        (m.brand_name && m.brand_name.toLowerCase().includes(q))
      ) {
        suggestions.push({
          type: "model",
          title: `${m.brand_name || "Maruti"} ${m.name}`,
          subtitle: `${m.body_type} • ${m.seating_capacity || 5} Seater`,
          action: () => {
            setSearchQuery(m.name);
            setIsSearchFocused(false);
          },
        });
      }
    });

    // Match Variants
    variants.forEach((v) => {
      if (v.name.toLowerCase().includes(q)) {
        suggestions.push({
          type: "variant",
          title: `${v.brand_name} ${v.model_name} ${v.name}`,
          subtitle: `${v.fuel_type} • ${v.transmission_type}`,
          action: () => {
            setSearchQuery(v.model_name);
            setIsSearchFocused(false);
          },
        });
      }
    });

    return suggestions.slice(0, 5);
  }, [searchQuery, models, variants]);

  // Derived filter options for dropdowns & count badges
  const availableBodyTypes = React.useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.body_type) set.add(m.body_type);
    });
    return Array.from(set);
  }, [models]);

  const availableFuels = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
  const availableTransmissions = ["Manual", "Automatic", "IVT", "e-CVT"];

  // Comparison toggle handler using global context
  const handleToggleCompare = (modelId: string) => {
    const item = enrichedModels.find((m) => m.car.id === modelId);
    if (item) {
      toggleVehicle({
        id: item.car.id,
        brandName: item.car.brand_name || "Maruti Suzuki",
        name: item.car.name,
        bodyType: item.car.body_type,
        imageUrl:
          item.car.image_url ||
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
        startingPrice: item.minPrice,
        engine: item.primaryVariant?.engine_description,
        power: item.power,
        mileage: item.mileage,
        fuelType: item.fuelTypes[0],
        transmission: item.transmissions[0],
      });
    }
  };

  // Reset all active filters
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrand("ALL");
    setSelectedModel("ALL");
    setSelectedBodyType("ALL");
    setSelectedFuel("ALL");
    setSelectedTransmission("ALL");
    setSelectedBudget("ALL");
    setSelectedLaunch("ALL");
    setSelectedSeating("ALL");
    setCurrentPage(1);
    router.replace("/cars");
  };

  // Commit and apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    if (typeof window !== "undefined") {
      const el = document.getElementById("catalogue-workspace");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Check if any filter is currently applied
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedBrand !== "ALL" ||
    selectedModel !== "ALL" ||
    selectedBodyType !== "ALL" ||
    selectedFuel !== "ALL" ||
    selectedTransmission !== "ALL" ||
    selectedBudget !== "ALL" ||
    selectedLaunch !== "ALL" ||
    selectedSeating !== "ALL";

  // Filter and sort models
  const filteredAndSortedModels = React.useMemo(() => {
    const filtered = enrichedModels.filter((item) => {
      const { car, fuelTypes, transmissions, minPrice, maxPrice, allVariants } = item;

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCar =
          car.name.toLowerCase().includes(q) ||
          (car.brand_name && car.brand_name.toLowerCase().includes(q)) ||
          car.body_type.toLowerCase().includes(q) ||
          (car.dealer_name && car.dealer_name.toLowerCase().includes(q));
        const matchesVariant = allVariants.some(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.fuel_type.toLowerCase().includes(q) ||
            v.transmission_type.toLowerCase().includes(q)
        );
        if (!matchesCar && !matchesVariant) return false;
      }

      // 2. Manufacturer / Brand
      if (selectedBrand !== "ALL") {
        const brandKey = selectedBrand.toLowerCase().trim();
        const carBrand = (car.brand_name || "").toLowerCase().trim();
        const matchBrand =
          car.brand_id === selectedBrand ||
          carBrand === brandKey ||
          (carBrand.length > 2 && brandKey.includes(carBrand)) ||
          (brandKey.length > 2 && carBrand.includes(brandKey));
        if (!matchBrand) return false;
      }

      // 3. Model
      if (selectedModel !== "ALL") {
        if (car.id !== selectedModel && car.name !== selectedModel) return false;
      }

      // 4. Body Type / Category
      if (selectedBodyType !== "ALL") {
        const matchBody =
          car.body_type.toLowerCase().includes(selectedBodyType.toLowerCase()) ||
          selectedBodyType.toLowerCase().includes(car.body_type.toLowerCase());
        if (!matchBody) return false;
      }

      // 5. Fuel Type (Petrol, Diesel, CNG, Electric EV, Hybrid)
      if (selectedFuel !== "ALL") {
        const fuelKey = selectedFuel.toLowerCase();
        const matchFuel = fuelTypes.some(
          (f) => f.toLowerCase().includes(fuelKey) || fuelKey.includes(f.toLowerCase())
        );
        if (!matchFuel) return false;
      }

      // 6. Transmission (Manual, Automatic, DCT, IVT)
      if (selectedTransmission !== "ALL") {
        const transKey = selectedTransmission.toLowerCase();
        const matchTrans = transmissions.some(
          (t) => t.toLowerCase().includes(transKey) || transKey.includes(t.toLowerCase())
        );
        if (!matchTrans) return false;
      }

      // 7. Budget Range
      if (selectedBudget !== "ALL") {
        if (selectedBudget === "UNDER_10L" && minPrice >= 1000000) return false;
        if (selectedBudget === "10L_15L" && (minPrice > 1500000 || maxPrice < 1000000)) return false;
        if (selectedBudget === "15L_20L" && (minPrice > 2000000 || maxPrice < 1500000)) return false;
        if (selectedBudget === "20L_30L" && (minPrice > 3000000 || maxPrice < 2000000)) return false;
        if (selectedBudget === "ABOVE_30L" && maxPrice < 3000000) return false;
      }

      // 8. Newly Launched Cars (DealerOS Launches)
      if (selectedLaunch === "NEW_LAUNCH") {
        if (!car.is_newly_launched) return false;
      }

      // 9. Seating Capacity
      if (selectedSeating !== "ALL") {
        const targetSeating = Number(selectedSeating);
        if (car.seating_capacity !== targetSeating) return false;
      }

      return true;
    });

    // Apply Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "price_asc") return a.minPrice - b.minPrice;
      if (sortBy === "price_desc") return b.minPrice - a.minPrice;
      if (sortBy === "name_asc") return a.car.name.localeCompare(b.car.name);
      if (sortBy === "mileage_desc") return b.numericMileage - a.numericMileage;
      return 0; // featured default
    });
  }, [
    enrichedModels,
    searchQuery,
    selectedBrand,
    selectedModel,
    selectedBodyType,
    selectedFuel,
    selectedTransmission,
    selectedBudget,
    selectedLaunch,
    selectedSeating,
    sortBy,
  ]);

  // Pagination calculation
  const totalItems = filteredAndSortedModels.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedModels = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedModels.slice(start, start + pageSize);
  }, [filteredAndSortedModels, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 280, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* =========================================================================
          AUTO-ROTATING HERO SECTION: DYNAMIC VEHICLE CAROUSEL
          ========================================================================= */}
      <div
        className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-900 select-none"
        onMouseEnter={() => setIsSlidePaused(true)}
        onMouseLeave={() => setIsSlidePaused(false)}
      >
        {/* Background Rotating Images with Smooth Fade Transition */}
        {heroSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeSlide === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            }`}
            style={{ transitionProperty: "opacity, transform" }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Dark Gradient Overlay for Maximum Text Contrast and Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          </div>
        ))}

        {/* Content Layer (Dynamic per active slide) */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="text-white font-semibold">Explore Cars</span>
                <span>/</span>
                <span className="text-blue-400 font-medium">OEM Fleet Catalogue</span>
              </div>

              {/* Dynamic Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold tracking-wide backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>{heroSlides[activeSlide].badge}</span>
              </div>

              {/* Dynamic Heading with Slide Key Animation */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight min-h-[70px] sm:min-h-[85px] lg:min-h-[96px] flex items-center">
                {heroSlides[activeSlide].title}
              </h1>

              {/* Dynamic Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal min-h-[40px] sm:min-h-[48px]">
                {heroSlides[activeSlide].description}
              </p>

              {/* Dynamic Highlights / Trust Signals */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                {heroSlides[activeSlide].highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="default"
                  size="default"
                  onClick={heroSlides[activeSlide].action}
                  className="font-bold px-6 shadow-card bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {heroSlides[activeSlide].ctaText} →
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("compare");
                    router.replace("/cars?tab=compare", { scroll: false });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all backdrop-blur-md"
                >
                  <span>⚖️</span>
                  <span>Compare Models ({comparedVehicles.length}/3)</span>
                </button>
              </div>
            </div>

            {/* Right Side Controls & Live Badges */}
            <div className="flex flex-col items-start lg:items-end justify-between gap-6 shrink-0">
              {/* Quick Tab Switcher Buttons */}
              <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2.5">
                <button
                  onClick={() => {
                    setActiveTab("groups");
                    router.replace("/cars?tab=groups", { scroll: false });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-card border border-emerald-500/50 bg-emerald-600/90 hover:bg-emerald-600 text-white backdrop-blur-md"
                >
                  <span>👥</span>
                  <span>Group Buying Hub ({groups.length} Live)</span>
                  <span className="text-xs">→</span>
                </button>
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-300 backdrop-blur-md">
                  <span>🏢 Authorized Showrooms: <strong className="text-white">10 OEM Brands</strong></span>
                </div>
              </div>

              {/* Carousel Indicators & Next/Prev Navigation */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                  className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-xs font-bold transition-colors"
                  aria-label="Previous Slide"
                >
                  ‹
                </button>
                <div className="flex items-center gap-1.5">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveSlide(i)}
                      className={`h-2 transition-all rounded-full ${
                        activeSlide === i ? "w-7 bg-blue-500" : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
                  className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white text-xs font-bold transition-colors"
                  aria-label="Next Slide"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Nav Bar: Integrated In-Page Tab Switcher */}
      <div className="bg-white border-b border-slate-200/90 shadow-subtle sticky top-20 z-30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab("catalogue");
                router.replace("/cars?tab=catalogue", { scroll: false });
              }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === "catalogue"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>🚗</span>
              <span>All Vehicles Catalogue ({models.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("compare");
                router.replace("/cars?tab=compare", { scroll: false });
              }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === "compare"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>⚖️</span>
              <span>Compare Vehicles Matrix</span>
              {comparedVehicles.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    activeTab === "compare"
                      ? "bg-white text-blue-600 font-bold"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {comparedVehicles.length}/3
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("groups");
                router.replace("/cars?tab=groups", { scroll: false });
              }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                activeTab === "groups"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>👥</span>
              <span>Group Buying Demand Clusters</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  activeTab === "groups"
                    ? "bg-white text-blue-600 font-bold"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {groups.length} Live Bids
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: VEHICLE CATALOGUE DISCOVERY WORKSPACE
          ========================================================================= */}
      {activeTab === "catalogue" && (
        <>
          <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* =========================================================================
            DEDICATED VEHICLE FILTER SECTION (Directly Below Hero Carousel)
            ========================================================================= */}
        <div
          id="filter-engine-section"
          className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 sm:p-6 mb-8 space-y-5"
        >
          {/* Header: Title + Apply Filters / Clear Filters Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                🔍
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Vehicle Filter Engine</span>
                  <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    100% Authorized OEM Network
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Filter cars by budget, fuel type, brand, DealerOS new launches, body category, and transmission.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 shadow-sm text-xs h-9"
              >
                Apply Filters ({filteredAndSortedModels.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 h-9"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* 6 Responsive Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Budget Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                💰 Budget
              </label>
              <select
                value={selectedBudget}
                onChange={(e) => {
                  setSelectedBudget(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  selectedBudget !== "ALL"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="ALL">All Budgets</option>
                <option value="UNDER_10L">Under ₹10 Lakh</option>
                <option value="10L_15L">₹10 Lakh - ₹15 Lakh</option>
                <option value="15L_20L">₹15 Lakh - ₹20 Lakh</option>
                <option value="20L_30L">₹20 Lakh - ₹30 Lakh</option>
                <option value="ABOVE_30L">Above ₹30 Lakh</option>
              </select>
            </div>

            {/* 2. Car Type (Fuel) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                ⚡ Fuel Type
              </label>
              <select
                value={selectedFuel}
                onChange={(e) => {
                  setSelectedFuel(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  selectedFuel !== "ALL"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="ALL">All Fuel Types</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* 3. Car Brand */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                🏢 OEM Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedModel("ALL");
                  setCurrentPage(1);
                }}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  selectedBrand !== "ALL"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="ALL">All Brands (10 OEMs)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Newly Launched Cars (DealerOS) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                ⭐ Launch Status
              </label>
              <select
                value={selectedLaunch}
                onChange={(e) => {
                  setSelectedLaunch(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  selectedLaunch !== "ALL"
                    ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="ALL">All Vehicles</option>
                <option value="NEW_LAUNCH">⭐ Newly Launched (DealerOS)</option>
              </select>
            </div>

            {/* 5. Body Type and Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                🚙 Body Type
              </label>
              <select
                value={selectedBodyType}
                onChange={(e) => {
                  setSelectedBodyType(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  selectedBodyType !== "ALL"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="ALL">All Categories</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="MPV">MPV / 7-Seater</option>
                <option value="Crossover">Crossover</option>
              </select>
            </div>

            {/* 6. Transmission */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                ⚙️ Transmission
              </label>
              <select
                value={selectedTransmission}
                onChange={(e) => {
                  setSelectedTransmission(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                  selectedTransmission !== "ALL"
                    ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                <option value="ALL">All Transmissions</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="DCT">DCT / DSG</option>
                <option value="IVT">e-CVT / IVT</option>
              </select>
            </div>
          </div>

          {/* Keyword Search & Quick Filter Pills */}
          <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div ref={searchContainerRef} className="relative flex-1 max-w-xl">
              <div className="relative">
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search model, variant, or dealer (e.g. Creta, Mandovi Motors, Brezza, Nexon EV)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-subtle"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions Popover */}
              {isSearchFocused && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Search Suggestions
                  </div>
                  {searchSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        item.action();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                      </div>
                      <Badge variant="secondary" size="sm">
                        {item.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Filter Shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 hidden lg:inline">Quick Filters:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedLaunch(selectedLaunch === "NEW_LAUNCH" ? "ALL" : "NEW_LAUNCH");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all border ${
                  selectedLaunch === "NEW_LAUNCH"
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                ⭐ 2026 Launches
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFuel(selectedFuel === "Electric" ? "ALL" : "Electric");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all border ${
                  selectedFuel === "Electric"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                ⚡ Electric (EV)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBodyType(selectedBodyType === "SUV" ? "ALL" : "SUV");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all border ${
                  selectedBodyType === "SUV"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                🚙 SUVs
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBudget(selectedBudget === "UNDER_10L" ? "ALL" : "UNDER_10L");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all border ${
                  selectedBudget === "UNDER_10L"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                💰 Under ₹10L
              </button>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                Active Filters:
              </span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-blue-900">✕</button>
                </span>
              )}

              {selectedBrand !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  Brand: {brands.find((b) => b.id === selectedBrand)?.name || selectedBrand}
                  <button onClick={() => setSelectedBrand("ALL")} className="hover:text-blue-900">✕</button>
                </span>
              )}

              {selectedBodyType !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  Body: {selectedBodyType}
                  <button onClick={() => setSelectedBodyType("ALL")} className="hover:text-blue-900">✕</button>
                </span>
              )}

              {selectedFuel !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  Fuel: {selectedFuel}
                  <button onClick={() => setSelectedFuel("ALL")} className="hover:text-blue-900">✕</button>
                </span>
              )}

              {selectedTransmission !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  Trans: {selectedTransmission}
                  <button onClick={() => setSelectedTransmission("ALL")} className="hover:text-blue-900">✕</button>
                </span>
              )}

              {selectedBudget !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  Budget: {selectedBudget === "UNDER_10L" ? "< ₹10 Lakh" : selectedBudget === "10L_15L" ? "₹10L - ₹15L" : selectedBudget === "15L_20L" ? "₹15L - ₹20L" : selectedBudget === "20L_30L" ? "₹20L - ₹30L" : "> ₹30 Lakh"}
                  <button onClick={() => setSelectedBudget("ALL")} className="hover:text-blue-900">✕</button>
                </span>
              )}

              {selectedLaunch !== "ALL" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 font-semibold">
                  ⭐ 2026 Launches (DealerOS)
                  <button onClick={() => setSelectedLaunch("ALL")} className="hover:text-amber-950">✕</button>
                </span>
              )}

              <button
                onClick={handleClearAllFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline ml-auto"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* =========================================================================
            VEHICLE RESULTS STAGE & CONTROLS
            ========================================================================= */}
        <div id="vehicle-results-stage" className="space-y-6">
          {/* Status Header: Counts, Dealership Notice, Sort & View Mode */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-slate-600">
                Showing <span className="font-bold text-slate-900">{totalItems}</span> of {enrichedModels.length} vehicles
              </p>
              {!hasActiveFilters ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>🏢 Showing All Vehicles with Verified Authorized Dealership Names</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Filtered Vehicles with Verified Authorized Dealerships</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-600 shadow-subtle"
                >
                  <option value="featured">Featured / Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Model Name: A to Z</option>
                  <option value="mileage_desc">ARAI Fuel Economy</option>
                </select>
              </div>

              {/* View Switcher (Grid vs List) */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    viewMode === "list"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>

            {/* Loading Skeletons */}
            {isLoading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                    <div className="aspect-[16/10] bg-slate-100 rounded-xl" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-6 bg-slate-200 rounded w-2/3" />
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : hasError ? (
              /* Error State */
              <div className="bg-white rounded-2xl border border-red-200 p-12 text-center space-y-3 shadow-card">
                <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto font-bold text-xl">
                  !
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Failed to Load Vehicle Catalogue
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We encountered an issue communicating with the centralized vehicle repository.
                </p>
                <Button variant="default" size="sm" onClick={loadCatalogue}>
                  Retry Connection
                </Button>
              </div>
            ) : totalItems === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-card">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    No Vehicles Match Your Selected Filters
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Try broadening your search query, clearing manufacturer constraints, or adjusting budget limits.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <Button variant="default" size="sm" onClick={handleClearAllFilters}>
                    Clear All Filters
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                    Clear Search Query
                  </Button>
                </div>
              </div>
            ) : (
              /* Vehicle Results Presentation (Grid or List) */
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {paginatedModels.map(({ car, primaryVariant, fuelTypes, transmissions, minPrice, maxPrice, power, mileage, activeGroupCount, maxGroupSavings }) => {
                  const isComparing = isVehicleComparing(car.id);
                  return (
                    <VehicleCard
                      key={car.id}
                      id={car.id}
                      brandName={car.brand_name || "Maruti Suzuki"}
                      modelName={car.name}
                      variantName={primaryVariant ? primaryVariant.name : undefined}
                      bodyType={car.body_type}
                      imageUrl={car.image_url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                      seatingCapacity={car.seating_capacity || 5}
                      startingPrice={minPrice}
                      maxPrice={maxPrice}
                      fuelTypes={fuelTypes}
                      transmissionTypes={transmissions}
                      power={power}
                      mileage={mileage}
                      activeGroupCount={activeGroupCount}
                      maxGroupSavings={maxGroupSavings}
                      viewMode={viewMode}
                      isComparing={isComparing}
                      dealerName={car.dealer_name || `${car.brand_name || "Authorized"} Dealership Network`}
                      isNewlyLaunched={car.is_newly_launched || false}
                      onToggleCompare={handleToggleCompare}
                      onEnquire={(id, name) => setTestDriveCar({ brand: car.brand_name || "Authorized Dealership", model: car.name })}
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} vehicles
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ← Previous
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition-colors ${
                        currentPage === page
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* =========================================================================
          MOBILE FILTER DRAWER MODAL
          ========================================================================= */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-elevated flex flex-col justify-between overflow-y-auto p-6 z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Filter Vehicles
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {/* Manufacturer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Manufacturer
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Manufacturers</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Body Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Body Type
                </label>
                <select
                  value={selectedBodyType}
                  onChange={(e) => {
                    setSelectedBodyType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Body Types</option>
                  {availableBodyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Fuel Type
                </label>
                <select
                  value={selectedFuel}
                  onChange={(e) => {
                    setSelectedFuel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Fuels</option>
                  {availableFuels.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transmission */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Transmission
                </label>
                <select
                  value={selectedTransmission}
                  onChange={(e) => {
                    setSelectedTransmission(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Transmissions</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                  <option value="DCT">DCT / DSG</option>
                  <option value="IVT">e-CVT / IVT</option>
                </select>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Budget
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => {
                    setSelectedBudget(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Budgets</option>
                  <option value="UNDER_10L">Under ₹10 Lakh</option>
                  <option value="10L_15L">₹10 Lakh - ₹15 Lakh</option>
                  <option value="15L_20L">₹15 Lakh - ₹20 Lakh</option>
                  <option value="20L_30L">₹20 Lakh - ₹30 Lakh</option>
                  <option value="ABOVE_30L">Above ₹30 Lakh</option>
                </select>
              </div>

              {/* Launch Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Launch Status
                </label>
                <select
                  value={selectedLaunch}
                  onChange={(e) => {
                    setSelectedLaunch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="ALL">All Vehicles</option>
                  <option value="NEW_LAUNCH">⭐ Newly Launched (DealerOS)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-2">
              <Button
                variant="default"
                size="default"
                className="w-full font-bold"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters ({totalItems} Vehicles)
              </Button>
              <Button
                variant="outline"
                size="default"
                className="w-full"
                onClick={() => {
                  handleClearAllFilters();
                  setIsMobileFilterOpen(false);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* =========================================================================
          TAB 2: INTEGRATED SIDE-BY-SIDE VEHICLE COMPARISON MATRIX
          ========================================================================= */}
      {activeTab === "compare" && (
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card">
            <div>
              <h2 className="text-xl font-black text-slate-950">Side-by-Side Comparison Matrix</h2>
              <p className="text-xs text-slate-500">
                Comparing {comparedVehicles.length} of 3 maximum vehicles simultaneously.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {comparedVehicles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearVehicles}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Clear Comparison
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setActiveTab("catalogue");
                  router.replace("/cars?tab=catalogue", { scroll: false });
                }}
                className="text-xs font-bold"
              >
                + Add More Cars From Catalogue
              </Button>
            </div>
          </div>

          {comparedVehicles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto">
                ⚖️
              </div>
              <h3 className="text-lg font-black text-slate-900">No Vehicles Selected For Comparison</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select up to 3 cars from the catalogue using the "Compare" checkbox on each vehicle card to evaluate specs, pricing, and mileage side-by-side.
              </p>
              <Button
                variant="default"
                size="default"
                onClick={() => {
                  setActiveTab("catalogue");
                  router.replace("/cars?tab=catalogue", { scroll: false });
                }}
                className="font-bold px-6"
              >
                Browse Catalogue to Select Cars →
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="p-4 w-48 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Specification</th>
                    {comparedVehicles.map((car) => (
                      <th key={car.id} className="p-4 min-w-[260px] align-top border-l border-slate-200">
                        <div className="space-y-3">
                          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={car.imageUrl} alt={car.name} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeVehicle(car.id)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-xs font-bold transition-colors"
                              title="Remove vehicle"
                            >
                              ✕
                            </button>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{car.brandName}</span>
                            <h4 className="text-sm font-black text-slate-900 leading-tight">{car.name}</h4>
                            <p className="text-xs font-mono font-bold text-blue-600 mt-1">
                              Starting at {formatINR(car.startingPrice)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full text-[11px] font-bold"
                              onClick={() => setTestDriveCar({ brand: car.brandName, model: car.name })}
                            >
                              Enquire Test Drive
                            </Button>
                          </div>
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - comparedVehicles.length) }).map((_, i) => (
                      <th key={`empty-${i}`} className="p-4 min-w-[260px] align-middle text-center border-l border-slate-200 bg-slate-50/30">
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
                          <span className="text-2xl text-slate-400">+</span>
                          <span className="text-xs font-semibold text-slate-500">Slot {comparedVehicles.length + i + 1} Available</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setActiveTab("catalogue");
                              router.replace("/cars?tab=catalogue", { scroll: false });
                            }}
                          >
                            Add Vehicle
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Body Style</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 font-semibold text-slate-900 border-l border-slate-100">{car.bodyType}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Engine & Powertrain</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 text-slate-800 border-l border-slate-100">{car.engine || "1.5L Smart Hybrid / Multi-Point"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Power Output</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 font-semibold text-slate-900 border-l border-slate-100">{car.power || "103 PS @ 6,000 RPM"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">ARAI Certified Mileage</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 font-mono font-bold text-emerald-600 border-l border-slate-100">{car.mileage || "19.89 kmpl"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Fuel Types Available</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 text-slate-800 border-l border-slate-100">{car.fuelType || "Petrol / CNG / Electric"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Transmission Options</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 text-slate-800 border-l border-slate-100">{car.transmission || "5-Speed MT / 6-Speed AT"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/50">Global NCAP Crash Rating</td>
                    {comparedVehicles.map((car) => (
                      <td key={car.id} className="p-4 font-bold text-amber-600 border-l border-slate-100">
                        {car.safety || "⭐⭐⭐⭐ (4 Stars Adult Safety)"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: INTEGRATED GROUP BUYING HUB & DEMAND CLUSTERS
          ========================================================================= */}
      {activeTab === "groups" && (
        <div className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Group Buying Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Active Buyer Groups & Reverse Bidding</h2>
                <p className="text-xs text-slate-500">
                  Verified customer demand clusters eligible for volume dealership discounts.
                </p>
              </div>

              {/* Group City Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {["ALL", "Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"].map((city) => (
                  <button
                    key={city}
                    onClick={() => setGroupCity(city)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors border ${
                      groupCity === city
                        ? "bg-slate-950 text-white border-slate-950"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {city === "ALL" ? "All Cities" : city}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Status:</span>
              {[
                { value: "ALL", label: "All Groups" },
                { value: "FORMING", label: "Forming Clusters" },
                { value: "OPEN_FOR_QUOTES", label: "Dealers Bidding Live" },
                { value: "QUOTATION_REVIEW", label: "Quotations Ready" },
              ].map((st) => (
                <button
                  key={st.value}
                  onClick={() => setGroupStatus(st.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    groupStatus === st.value
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Groups Grid */}
          {filteredBuyerGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3 shadow-card">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto">
                👥
              </div>
              <h3 className="text-lg font-black text-slate-900">No Active Groups Found For This Filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try switching city or status filters to discover active buyer groups in other metro areas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGroupCity("ALL");
                  setGroupStatus("ALL");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuyerGroups.map((group) => (
                <BuyerGroupCard
                  key={group.id}
                  id={group.id}
                  groupCode={group.group_code}
                  brandName={group.brand_name}
                  modelName={group.model_name}
                  city={group.city}
                  currentMembers={group.current_members_count}
                  maxMembers={group.max_capacity || 10}
                  status={group.status}
                  estimatedDiscount={group.estimated_savings_inr || 45000}
                  imageUrl={group.model_image_url}
                  onJoin={() => setSelectedGroupToJoin(group)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct Test Drive / Showroom Enquiry Modal */}
      {testDriveCar && (
        <EnquiryModal
          isOpen={!!testDriveCar}
          onClose={() => setTestDriveCar(null)}
          brandName={testDriveCar.brand}
          modelName={testDriveCar.model}
        />
      )}

      {/* Group Buying Participation Modal */}
      {selectedGroupToJoin && (
        <JoinGroupModal
          isOpen={!!selectedGroupToJoin}
          onClose={() => setSelectedGroupToJoin(null)}
          group={selectedGroupToJoin}
          onSuccess={() => {
            setSelectedGroupToJoin(null);
            loadCatalogue();
          }}
        />
      )}
    </div>
  );
}

export default function CarsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CarsCatalogueInner />
    </React.Suspense>
  );
}
