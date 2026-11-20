import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Skeleton, VehicleCardSkeleton } from "../components/LoadingSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { BottomSheet } from "../components/BottomSheet";
import { customerApi } from "@groupdrive/api-client";
import {
  CatalogueBrand,
  CatalogueModel,
  CatalogueVariant,
  PublicBuyerGroupItem,
} from "@groupdrive/types";
import { formatINR } from "@groupdrive/utils";
import { useCompare } from "../context/CompareContext";
import { VehicleDetailModal } from "./VehicleDetailModal";
import { EnquiryModal } from "./EnquiryModal";
import { colors, radius, shadows } from "../theme/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  onNavigateToGroups?: (modelId?: string) => void;
  onNavigateToCompare?: () => void;
}

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

type SortOption =
  | "featured"
  | "price_asc"
  | "price_desc"
  | "mileage_desc"
  | "savings_desc";

export function CarsScreen({ onNavigateToGroups, onNavigateToCompare }: Props = {}) {
  // Raw API data
  const [brands, setBrands] = useState<CatalogueBrand[]>([]);
  const [models, setModels] = useState<CatalogueModel[]>([]);
  const [variants, setVariants] = useState<CatalogueVariant[]>([]);
  const [groups, setGroups] = useState<PublicBuyerGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedModel, setSelectedModel] = useState("ALL");
  const [selectedBodyType, setSelectedBodyType] = useState("ALL");
  const [selectedFuel, setSelectedFuel] = useState("ALL");
  const [selectedTransmission, setSelectedTransmission] = useState("ALL");
  const [selectedBudget, setSelectedBudget] = useState("ALL");
  const [selectedSeating, setSelectedSeating] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Sheet modals state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);

  // Pagination state
  const [displayCount, setDisplayCount] = useState(6);
  const PAGE_SIZE = 6;

  // Detail & Enquiry Modals
  const [selectedCar, setSelectedCar] = useState<CatalogueModel | null>(null);
  const [enquiryCar, setEnquiryCar] = useState<{
    brand: string;
    model: string;
    variant?: string;
  } | null>(null);

  const { isVehicleComparing, toggleVehicle, comparedVehicles } = useCompare();

  // Load centralized catalogue data
  const loadCatalogue = useCallback(async () => {
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
      console.error("Failed to load vehicle catalogue on mobile:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  // Enrich models with variant technical data and group pricing
  const enrichedModels: EnrichedModel[] = useMemo(() => {
    return models.map((car) => {
      const carVariants = variants.filter((v) => v.model_id === car.id);
      const primaryVariant = carVariants[0];

      const fuelTypes =
        carVariants.length > 0
          ? Array.from(new Set(carVariants.map((v) => v.fuel_type)))
          : car.body_type.toLowerCase().includes("electric")
          ? ["Electric"]
          : ["Petrol"];

      const transmissions =
        carVariants.length > 0
          ? Array.from(new Set(carVariants.map((v) => v.transmission_type)))
          : ["Manual", "Automatic"];

      const minPrice =
        carVariants.length > 0
          ? Math.min(...carVariants.map((v) => v.official_ex_showroom_price))
          : car.body_type.includes("SUV")
          ? 1050000
          : 750000;

      const maxPrice =
        carVariants.length > 0
          ? Math.max(...carVariants.map((v) => v.official_ex_showroom_price))
          : Math.round(minPrice * 1.35);

      const power =
        primaryVariant?.power_ps ||
        (car.body_type.includes("Electric") ? "145 PS" : "103 PS");
      const mileage = primaryVariant?.arai_mileage || "19.8 kmpl";

      const matchNum = mileage.match(/[\d.]+/);
      const numericMileage = matchNum ? parseFloat(matchNum[0]) : 18;

      const modelGroups = groups.filter(
        (g) =>
          g.model_id === car.id ||
          g.model_name.toLowerCase().includes(car.name.toLowerCase())
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

  // Search Suggestions (autocomplete dropdown)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const suggestions: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: "model" | "brand";
      queryToSet: string;
    }> = [];

    // Match Models
    models.forEach((m) => {
      if (
        m.name.toLowerCase().includes(q) ||
        (m.brand_name && m.brand_name.toLowerCase().includes(q))
      ) {
        suggestions.push({
          id: `mod-${m.id}`,
          title: `${m.brand_name || "Maruti"} ${m.name}`,
          subtitle: `${m.body_type} • ${m.seating_capacity || 5} Seater`,
          type: "model",
          queryToSet: m.name,
        });
      }
    });

    // Match Brands
    brands.forEach((b) => {
      if (b.name.toLowerCase().includes(q)) {
        suggestions.push({
          id: `brd-${b.id}`,
          title: b.name,
          subtitle: "Automobile Manufacturer",
          type: "brand",
          queryToSet: b.name,
        });
      }
    });

    return suggestions.slice(0, 4);
  }, [searchQuery, models, brands]);

  // Filter & Sort logic
  const filteredAndSortedModels = useMemo(() => {
    const filtered = enrichedModels.filter((item) => {
      const { car, fuelTypes, transmissions, minPrice, maxPrice, allVariants } = item;

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = car.name.toLowerCase().includes(q);
        const matchBrand = car.brand_name && car.brand_name.toLowerCase().includes(q);
        const matchBody = car.body_type && car.body_type.toLowerCase().includes(q);
        const matchVariant = allVariants.some((v) => v.name.toLowerCase().includes(q));
        if (!matchName && !matchBrand && !matchBody && !matchVariant) {
          return false;
        }
      }

      // 2. Manufacturer Filter
      if (selectedBrand !== "ALL") {
        const brandMatch =
          car.brand_id === selectedBrand ||
          (car.brand_name && car.brand_name.toLowerCase() === selectedBrand.toLowerCase());
        if (!brandMatch) return false;
      }

      // 3. Model Filter
      if (selectedModel !== "ALL") {
        if (car.id !== selectedModel && car.name !== selectedModel) return false;
      }

      // 4. Vehicle Category / Body Type
      if (selectedBodyType !== "ALL") {
        if (selectedBodyType === "SUV") {
          if (!car.body_type.toLowerCase().includes("suv")) return false;
        } else if (selectedBodyType === "Electric") {
          if (!car.body_type.toLowerCase().includes("electric") && !car.name.toLowerCase().includes("ev")) {
            return false;
          }
        } else if (!car.body_type.toLowerCase().includes(selectedBodyType.toLowerCase())) {
          return false;
        }
      }

      // 5. Fuel Type
      if (selectedFuel !== "ALL") {
        const hasFuel = fuelTypes.some(
          (f) => f.toLowerCase() === selectedFuel.toLowerCase()
        );
        if (!hasFuel) return false;
      }

      // 6. Transmission
      if (selectedTransmission !== "ALL") {
        const hasTrans = transmissions.some(
          (t) => t.toLowerCase() === selectedTransmission.toLowerCase()
        );
        if (!hasTrans) return false;
      }

      // 7. Budget Range
      if (selectedBudget !== "ALL") {
        if (selectedBudget === "under-10l" && minPrice > 1000000) return false;
        if (selectedBudget === "10l-15l" && (maxPrice < 1000000 || minPrice > 1500000)) return false;
        if (selectedBudget === "15l-20l" && (maxPrice < 1500000 || minPrice > 2000000)) return false;
        if (selectedBudget === "above-20l" && maxPrice < 2000000) return false;
      }

      // 8. Seating Capacity
      if (selectedSeating !== "ALL") {
        const targetSeating = parseInt(selectedSeating, 10);
        if (car.seating_capacity !== targetSeating) return false;
      }

      return true;
    });

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return a.minPrice - b.minPrice;
      if (sortBy === "price_desc") return b.minPrice - a.minPrice;
      if (sortBy === "mileage_desc") return b.numericMileage - a.numericMileage;
      if (sortBy === "savings_desc") return b.maxGroupSavings - a.maxGroupSavings;
      // Default: featured
      return b.activeGroupCount - a.activeGroupCount;
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
    selectedSeating,
    sortBy,
  ]);

  // Paginated slice
  const displayedModels = useMemo(() => {
    return filteredAndSortedModels.slice(0, displayCount);
  }, [filteredAndSortedModels, displayCount]);

  const hasMore = displayCount < filteredAndSortedModels.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedBrand !== "ALL" ||
    selectedModel !== "ALL" ||
    selectedBodyType !== "ALL" ||
    selectedFuel !== "ALL" ||
    selectedTransmission !== "ALL" ||
    selectedBudget !== "ALL" ||
    selectedSeating !== "ALL";

  // Count active filter criteria
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== "ALL") count++;
    if (selectedModel !== "ALL") count++;
    if (selectedBodyType !== "ALL") count++;
    if (selectedFuel !== "ALL") count++;
    if (selectedTransmission !== "ALL") count++;
    if (selectedBudget !== "ALL") count++;
    if (selectedSeating !== "ALL") count++;
    return count;
  }, [
    selectedBrand,
    selectedModel,
    selectedBodyType,
    selectedFuel,
    selectedTransmission,
    selectedBudget,
    selectedSeating,
  ]);

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedBrand("ALL");
    setSelectedModel("ALL");
    setSelectedBodyType("ALL");
    setSelectedFuel("ALL");
    setSelectedTransmission("ALL");
    setSelectedBudget("ALL");
    setSelectedSeating("ALL");
    setSortBy("featured");
    setDisplayCount(PAGE_SIZE);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "price_asc":
        return "Price: Low to High";
      case "price_desc":
        return "Price: High to Low";
      case "mileage_desc":
        return "Fuel Efficiency";
      case "savings_desc":
        return "Group Savings";
      case "featured":
      default:
        return "Featured";
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.searchBarSkeleton}>
          <Skeleton width="100%" height={46} borderRadius={12} />
        </View>
        <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <VehicleCardSkeleton />
          <VehicleCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.centerContainer}>
        <ErrorState
          title="Catalogue Offline"
          message="Could not connect to the vehicle catalogue. Please check your network and retry."
          onRetry={loadCatalogue}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Dedicated Search & Quick Filter Top Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search make, model (e.g. Brezza, Creta)..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Sheet Trigger Button */}
          <TouchableOpacity
            style={[
              styles.filterTriggerBtn,
              activeFilterCount > 0 && styles.filterTriggerBtnActive,
            ]}
            onPress={() => setIsFilterSheetOpen(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTriggerIcon,
                activeFilterCount > 0 && styles.filterTriggerIconActive,
              ]}
            >
              ⚙
            </Text>
            <Text
              style={[
                styles.filterTriggerText,
                activeFilterCount > 0 && styles.filterTriggerTextActive,
              ]}
            >
              Filters
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Suggestions Popover */}
        {isSearchFocused && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsHeader}>Suggested Matches</Text>
            {searchSuggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                onPress={() => {
                  setSearchQuery(item.queryToSet);
                  setIsSearchFocused(false);
                }}
              >
                <Text style={styles.suggestionIcon}>
                  {item.type === "model" ? "🚗" : "🏢"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.suggestionArrow}>↗</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Horizontal Manufacturer Filter Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.brandsScroll}
          contentContainerStyle={styles.brandsContainer}
        >
          <TouchableOpacity
            style={[
              styles.brandChip,
              selectedBrand === "ALL" && styles.brandChipActive,
            ]}
            onPress={() => {
              setSelectedBrand("ALL");
              setSelectedModel("ALL");
            }}
          >
            <Text
              style={[
                styles.brandChipText,
                selectedBrand === "ALL" && styles.brandChipTextActive,
              ]}
            >
              All Makes
            </Text>
          </TouchableOpacity>

          {brands.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.brandChip,
                selectedBrand === b.name && styles.brandChipActive,
              ]}
              onPress={() => {
                setSelectedBrand(selectedBrand === b.name ? "ALL" : b.name);
                setSelectedModel("ALL");
              }}
            >
              <Text
                style={[
                  styles.brandChipText,
                  selectedBrand === b.name && styles.brandChipTextActive,
                ]}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Filters Pill Strip */}
        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersScroll}
            contentContainerStyle={styles.activeFiltersContainer}
          >
            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={handleClearAllFilters}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>

            {selectedBrand !== "ALL" && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedBrand("ALL")}
              >
                <Text style={styles.activeTagText}>Make: {selectedBrand} ✕</Text>
              </TouchableOpacity>
            )}

            {selectedBodyType !== "ALL" && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedBodyType("ALL")}
              >
                <Text style={styles.activeTagText}>Body: {selectedBodyType} ✕</Text>
              </TouchableOpacity>
            )}

            {selectedFuel !== "ALL" && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedFuel("ALL")}
              >
                <Text style={styles.activeTagText}>Fuel: {selectedFuel} ✕</Text>
              </TouchableOpacity>
            )}

            {selectedTransmission !== "ALL" && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedTransmission("ALL")}
              >
                <Text style={styles.activeTagText}>
                  Gear: {selectedTransmission} ✕
                </Text>
              </TouchableOpacity>
            )}

            {selectedBudget !== "ALL" && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedBudget("ALL")}
              >
                <Text style={styles.activeTagText}>Budget Filter ✕</Text>
              </TouchableOpacity>
            )}

            {selectedSeating !== "ALL" && (
              <TouchableOpacity
                style={styles.activeTag}
                onPress={() => setSelectedSeating("ALL")}
              >
                <Text style={styles.activeTagText}>
                  {selectedSeating} Seater ✕
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Sort & Results Bar */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {filteredAndSortedModels.length}{" "}
            {filteredAndSortedModels.length === 1 ? "Vehicle" : "Vehicles"} Found
          </Text>

          <TouchableOpacity
            style={styles.sortSelectorBtn}
            onPress={() => setIsSortSheetOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.sortLabel}>Sort: </Text>
            <Text style={styles.sortValue}>{getSortLabel()} ▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Compare Notification Bar */}
      {comparedVehicles.length > 0 && onNavigateToCompare && (
        <TouchableOpacity
          style={styles.compareNotificationBar}
          onPress={onNavigateToCompare}
          activeOpacity={0.9}
        >
          <View style={styles.compareNotificationLeft}>
            <View style={styles.comparePulseDot} />
            <Text style={styles.compareNotificationText}>
              {comparedVehicles.length}/3 Vehicles in Side-by-Side Comparison
            </Text>
          </View>
          <Text style={styles.compareNotificationAction}>Compare Now →</Text>
        </TouchableOpacity>
      )}

      {/* 2. Vehicles List with Batch Loading */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredAndSortedModels.length === 0 ? (
          <EmptyState
            icon="🚗"
            title="No Matching Vehicles"
            description="We could not find any vehicles matching your current search criteria. Try loosening your filters or clear all."
            actionLabel="Reset All Filters"
            onAction={handleClearAllFilters}
          />
        ) : (
          displayedModels.map((item) => {
            const {
              car,
              primaryVariant,
              fuelTypes,
              transmissions,
              minPrice,
              maxPrice,
              activeGroupCount,
              maxGroupSavings,
            } = item;

            const isComparing = isVehicleComparing(car.id);

            return (
              <Card key={car.id} style={styles.carCard}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setSelectedCar(car)}
                >
                  {/* Vehicle Media Stage */}
                  <View style={styles.mediaContainer}>
                    <Image
                      source={{ uri: car.image_url }}
                      style={styles.carImage}
                      resizeMode="cover"
                    />

                    {/* Body Type Overlay Badge */}
                    <View style={styles.bodyTypeBadge}>
                      <Badge label={car.body_type} variant="secondary" size="sm" />
                    </View>

                    {/* Active Buyer Group Savings Pill */}
                    {activeGroupCount > 0 && (
                      <View style={styles.savingsOverlayBadge}>
                        <View style={styles.savingsDot} />
                        <Text style={styles.savingsText}>
                          Save up to {formatINR(maxGroupSavings, { compact: true })}
                        </Text>
                      </View>
                    )}

                    {/* Compare Button */}
                    <TouchableOpacity
                      style={[
                        styles.compareBadge,
                        isComparing && styles.compareBadgeActive,
                      ]}
                      onPress={() => {
                        toggleVehicle({
                          id: car.id,
                          brandName: car.brand_name,
                          name: car.name,
                          bodyType: car.body_type,
                          imageUrl: car.image_url,
                          startingPrice: minPrice,
                          engine: primaryVariant?.engine_description,
                          power: item.power,
                          torque: primaryVariant?.torque_nm,
                          mileage: item.mileage,
                          fuelType: fuelTypes[0],
                          transmission: transmissions[0],
                          seatingCapacity: car.seating_capacity,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.compareBadgeText,
                          isComparing && styles.compareBadgeTextActive,
                        ]}
                      >
                        {isComparing ? "✓ Comparing" : "+ Compare"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Vehicle Content Body */}
                  <View style={styles.carContent}>
                    <View style={styles.topInfoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.brandName}>{car.brand_name}</Text>
                        <Text style={styles.modelName}>{car.name}</Text>
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Starting Price</Text>
                        <Text style={styles.priceValue}>
                          {formatINR(minPrice, { compact: true })}
                        </Text>
                      </View>
                    </View>

                    {/* Specifications Summary Strip */}
                    <View style={styles.specsStrip}>
                      <View style={styles.specItem}>
                        <Text style={styles.specIcon}>👤</Text>
                        <Text style={styles.specText}>
                          {car.seating_capacity} Seater
                        </Text>
                      </View>
                      <Text style={styles.specDivider}>•</Text>
                      <View style={styles.specItem}>
                        <Text style={styles.specIcon}>⚡</Text>
                        <Text style={styles.specText}>{item.mileage}</Text>
                      </View>
                      <Text style={styles.specDivider}>•</Text>
                      <View style={styles.specItem}>
                        <Text style={styles.specIcon}>⚙️</Text>
                        <Text style={styles.specText}>{fuelTypes.slice(0, 2).join("/")}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => setSelectedCar(car)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailsBtnText}>View Full Specs</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.testDriveBtn}
                        onPress={() =>
                          setEnquiryCar({
                            brand: car.brand_name,
                            model: car.name,
                            variant: primaryVariant?.name,
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Text style={styles.testDriveBtnText}>Book Test Drive</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })
        )}

        {/* Incremental Batch Loading */}
        {hasMore && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={handleLoadMore}
            activeOpacity={0.8}
          >
            <Text style={styles.loadMoreBtnText}>
              Load More Vehicles ({filteredAndSortedModels.length - displayCount} remaining)
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 3. Filter Bottom Sheet */}
      <BottomSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Vehicle Discovery Filters"
        subtitle={`Showing ${filteredAndSortedModels.length} matching vehicles`}
      >
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* Budget Filter */}
          <Text style={styles.sheetSectionTitle}>Budget Range</Text>
          <View style={styles.sheetPillsRow}>
            {[
              { id: "ALL", label: "Any Budget" },
              { id: "under-10l", label: "Under 10 Lakh" },
              { id: "10l-15l", label: "10 - 15 Lakh" },
              { id: "15l-20l", label: "15 - 20 Lakh" },
              { id: "above-20l", label: "Above 20 Lakh" },
            ].map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.sheetPill,
                  selectedBudget === b.id && styles.sheetPillActive,
                ]}
                onPress={() => setSelectedBudget(b.id)}
              >
                <Text
                  style={[
                    styles.sheetPillText,
                    selectedBudget === b.id && styles.sheetPillTextActive,
                  ]}
                >
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Body Type / Category Filter */}
          <Text style={styles.sheetSectionTitle}>Body Category</Text>
          <View style={styles.sheetPillsRow}>
            {["ALL", "SUV", "Compact SUV", "Mid-Size SUV", "Hatchback", "Electric"].map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.sheetPill,
                    selectedBodyType === cat && styles.sheetPillActive,
                  ]}
                  onPress={() => setSelectedBodyType(cat)}
                >
                  <Text
                    style={[
                      styles.sheetPillText,
                      selectedBodyType === cat && styles.sheetPillTextActive,
                    ]}
                  >
                    {cat === "ALL" ? "All Categories" : cat}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Fuel Type Filter */}
          <Text style={styles.sheetSectionTitle}>Fuel Type</Text>
          <View style={styles.sheetPillsRow}>
            {["ALL", "Petrol", "Diesel", "Electric", "CNG"].map((fuel) => (
              <TouchableOpacity
                key={fuel}
                style={[
                  styles.sheetPill,
                  selectedFuel === fuel && styles.sheetPillActive,
                ]}
                onPress={() => setSelectedFuel(fuel)}
              >
                <Text
                  style={[
                    styles.sheetPillText,
                    selectedFuel === fuel && styles.sheetPillTextActive,
                  ]}
                >
                  {fuel === "ALL" ? "All Fuels" : fuel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transmission Filter */}
          <Text style={styles.sheetSectionTitle}>Transmission</Text>
          <View style={styles.sheetPillsRow}>
            {["ALL", "Manual", "Automatic", "IVT"].map((trans) => (
              <TouchableOpacity
                key={trans}
                style={[
                  styles.sheetPill,
                  selectedTransmission === trans && styles.sheetPillActive,
                ]}
                onPress={() => setSelectedTransmission(trans)}
              >
                <Text
                  style={[
                    styles.sheetPillText,
                    selectedTransmission === trans && styles.sheetPillTextActive,
                  ]}
                >
                  {trans === "ALL" ? "All Transmissions" : trans}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seating Capacity */}
          <Text style={styles.sheetSectionTitle}>Seating Capacity</Text>
          <View style={styles.sheetPillsRow}>
            {[
              { id: "ALL", label: "Any Seating" },
              { id: "5", label: "5 Seater" },
              { id: "7", label: "7+ Seater" },
            ].map((seat) => (
              <TouchableOpacity
                key={seat.id}
                style={[
                  styles.sheetPill,
                  selectedSeating === seat.id && styles.sheetPillActive,
                ]}
                onPress={() => setSelectedSeating(seat.id)}
              >
                <Text
                  style={[
                    styles.sheetPillText,
                    selectedSeating === seat.id && styles.sheetPillTextActive,
                  ]}
                >
                  {seat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sheet Actions */}
          <View style={styles.sheetActionsRow}>
            <TouchableOpacity
              style={styles.sheetResetBtn}
              onPress={handleClearAllFilters}
            >
              <Text style={styles.sheetResetText}>Reset All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetApplyBtn}
              onPress={() => setIsFilterSheetOpen(false)}
            >
              <Text style={styles.sheetApplyText}>
                Apply ({filteredAndSortedModels.length} Cars)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>

      {/* 4. Sort Options Bottom Sheet */}
      <BottomSheet
        visible={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        title="Sort Vehicles"
        subtitle="Rank models according to your primary buying criteria"
      >
        <View style={styles.sortOptionsList}>
          {[
            { id: "featured", label: "Featured & Popular", desc: "Top demand participation" },
            { id: "price_asc", label: "Price: Low to High", desc: "Starting ex-showroom" },
            { id: "price_desc", label: "Price: High to Low", desc: "Premium flagship trims" },
            { id: "mileage_desc", label: "Fuel Efficiency", desc: "Highest ARAI mileage / range" },
            { id: "savings_desc", label: "Group Buying Savings", desc: "Maximum dealer bulk discount" },
          ].map((opt) => {
            const isSelected = sortBy === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.sortOptionItem,
                  isSelected && styles.sortOptionItemActive,
                ]}
                onPress={() => {
                  setSortBy(opt.id as SortOption);
                  setIsSortSheetOpen(false);
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.sortOptionLabel,
                      isSelected && styles.sortOptionLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.sortOptionDesc}>{opt.desc}</Text>
                </View>
                {isSelected && <Text style={styles.sortOptionCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* 5. Vehicle Detail Full Specifications Modal */}
      {selectedCar && (
        <VehicleDetailModal
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          car={selectedCar}
          variants={variants}
          onJoinGroup={onNavigateToGroups}
        />
      )}

      {/* 6. Lead Quotation / Test Drive Booking Modal */}
      {enquiryCar && (
        <EnquiryModal
          visible={!!enquiryCar}
          onClose={() => setEnquiryCar(null)}
          brandName={enquiryCar.brand}
          modelName={enquiryCar.model}
          variantName={enquiryCar.variant}
          initialEnquiryType="TEST_DRIVE"
        />
      )}
    </View>
  );
}

export const ExploreScreen = CarsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchBarSkeleton: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
    zIndex: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "bold",
  },
  filterTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  filterTriggerBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  filterTriggerIcon: {
    fontSize: 14,
    color: "#475569",
  },
  filterTriggerIconActive: {
    color: colors.velocity,
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  filterTriggerTextActive: {
    color: colors.velocity,
  },
  filterBadge: {
    backgroundColor: colors.velocity,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 10,
    zIndex: 50,
    ...shadows.elevated,
  },
  suggestionsHeader: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  suggestionIcon: {
    fontSize: 16,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  suggestionArrow: {
    fontSize: 14,
    color: "#94A3B8",
  },
  brandsScroll: {
    marginTop: 10,
  },
  brandsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  brandChipActive: {
    backgroundColor: colors.velocity,
    borderColor: colors.velocity,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  brandChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  activeFiltersScroll: {
    marginTop: 8,
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  clearAllChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  clearAllText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
  },
  activeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  activeTagText: {
    color: colors.velocity,
    fontSize: 11,
    fontWeight: "600",
  },
  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 8,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  sortSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  sortValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.velocity,
  },
  compareNotificationBar: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compareNotificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  comparePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  compareNotificationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  compareNotificationAction: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  carCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  mediaContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  carImage: {
    width: "100%",
    height: "100%",
  },
  bodyTypeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  savingsOverlayBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(5, 150, 105, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  savingsText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  compareBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  compareBadgeActive: {
    backgroundColor: colors.velocity,
  },
  compareBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  compareBadgeTextActive: {
    color: "#FFFFFF",
  },
  carContent: {
    padding: 16,
    gap: 6,
  },
  topInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  modelName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  priceValue: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.velocity,
    marginTop: 2,
  },
  specsStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  specIcon: {
    fontSize: 12,
  },
  specText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  specDivider: {
    color: "#CBD5E1",
    fontSize: 10,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  testDriveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.velocity,
    alignItems: "center",
  },
  testDriveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadMoreBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.velocity,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  loadMoreBtnText: {
    color: colors.velocity,
    fontSize: 13,
    fontWeight: "800",
  },
  sheetScroll: {
    maxHeight: 460,
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  sheetPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sheetPillActive: {
    backgroundColor: colors.velocity,
    borderColor: colors.velocity,
  },
  sheetPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  sheetPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sheetActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  sheetResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  sheetResetText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  sheetApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.velocity,
    alignItems: "center",
  },
  sheetApplyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sortOptionsList: {
    paddingVertical: 6,
    gap: 6,
  },
  sortOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  sortOptionItemActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  sortOptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  sortOptionLabelActive: {
    color: colors.velocity,
    fontWeight: "800",
  },
  sortOptionDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  sortOptionCheck: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.velocity,
  },
});
