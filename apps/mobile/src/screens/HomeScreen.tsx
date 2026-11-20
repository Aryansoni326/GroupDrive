import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { ProgressBar } from "../components/ProgressBar";
import { Skeleton, VehicleCardSkeleton } from "../components/LoadingSkeleton";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { useMobileAuth } from "../context/AuthContext";
import { useCompare } from "../context/CompareContext";
import { customerApi } from "@groupdrive/api-client";
import {
  PublicBuyerGroupItem,
  CatalogueModel,
  CatalogueVariant,
  DealerCampaign,
  PublicDealerSummary,
} from "@groupdrive/types";
import { formatINR } from "@groupdrive/utils";
import { SecureStorage } from "../services/storage";
import { colors, radius, shadows } from "../theme/tokens";
import { JoinGroupModal } from "./JoinGroupModal";
import { EnquiryModal } from "./EnquiryModal";
import { VehicleDetailModal } from "./VehicleDetailModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HomeScreenProps {
  onNavigate: (tab: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user, isAuthenticated } = useMobileAuth();
  const { isVehicleComparing, toggleVehicle, comparedVehicles } = useCompare();

  // Centralized Catalogue and Marketplace state
  const [groups, setGroups] = useState<PublicBuyerGroupItem[]>([]);
  const [models, setModels] = useState<CatalogueModel[]>([]);
  const [variants, setVariants] = useState<CatalogueVariant[]>([]);
  const [campaigns, setCampaigns] = useState<DealerCampaign[]>([]);
  const [dealers, setDealers] = useState<PublicDealerSummary[]>([]);
  const [recentVehicleIds, setRecentVehicleIds] = useState<string[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Modals state
  const [selectedGroup, setSelectedGroup] = useState<PublicBuyerGroupItem | null>(null);
  const [selectedCar, setSelectedCar] = useState<CatalogueModel | null>(null);
  const [enquiryCar, setEnquiryCar] = useState<{
    brand: string;
    model: string;
    variant?: string;
  } | null>(null);

  // Load centralized backend data
  const loadHomeData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [groupsRes, modelsRes, variantsRes, campaignsRes, dealersRes] =
        await Promise.all([
          customerApi.groups.listGroups(),
          customerApi.catalogue.getModels(),
          customerApi.catalogue.getVariants(),
          customerApi.campaigns.listCampaigns(),
          customerApi.dealers.listDealers(),
        ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (modelsRes.data) setModels(modelsRes.data);
      if (variantsRes.data) setVariants(variantsRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
      if (dealersRes.data) setDealers(dealersRes.data);

      // Load recently viewed vehicles from storage
      const storedRecents = await SecureStorage.getItem("gd_recent_vehicles");
      if (storedRecents) {
        try {
          const parsed = JSON.parse(storedRecents);
          if (Array.isArray(parsed)) {
            setRecentVehicleIds(parsed);
          }
        } catch {
          // ignore corrupted JSON
        }
      }
    } catch (err) {
      console.error("Failed to load mobile home data:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Record viewed vehicle into storage
  const handleViewVehicle = async (car: CatalogueModel) => {
    setSelectedCar(car);
    try {
      const updated = [car.id, ...recentVehicleIds.filter((id) => id !== car.id)].slice(0, 6);
      setRecentVehicleIds(updated);
      await SecureStorage.setItem("gd_recent_vehicles", JSON.stringify(updated));
    } catch {
      // storage fallback
    }
  };

  // Helper to get vehicle starting price
  const getVehiclePrice = (modelId: string) => {
    const vars = variants.filter((v) => v.model_id === modelId);
    if (vars.length === 0) return 850000;
    return Math.min(...vars.map((v) => v.official_ex_showroom_price));
  };

  // Recently viewed vehicle objects
  const recentVehicles = useMemo(() => {
    return recentVehicleIds
      .map((id) => models.find((m) => m.id === id))
      .filter((m): m is CatalogueModel => !!m);
  }, [recentVehicleIds, models]);

  // Recommended vehicles (tailored to user city or top active groups)
  const recommendedVehicles = useMemo(() => {
    const activeGroupModelIds = new Set(groups.map((g) => g.model_id));
    return models.filter((m) => activeGroupModelIds.has(m.id)).slice(0, 4);
  }, [models, groups]);

  // Category navigation shortcuts
  const popularCategories = [
    { id: "cat-suv", label: "SUVs", icon: "🚙", tag: "High Demand" },
    { id: "cat-ev", label: "Electric", icon: "⚡", tag: "Zero Emission" },
    { id: "cat-hatch", label: "Hatchback", icon: "🚗", tag: "City Friendly" },
    { id: "cat-mid", label: "Mid-Size", icon: "✨", tag: "Executive" },
  ];

  const handleSearchSubmit = () => {
    onNavigate("explore");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingHeader}>
          <Skeleton width="60%" height={26} />
          <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
        </View>
        <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <Skeleton width="100%" height={180} borderRadius={20} style={{ marginBottom: 20 }} />
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
          title="Failed to Load Marketplace Data"
          message="Could not reach the centralized GROUPDRIVE vehicle servers. Please ensure your backend is active."
          onRetry={loadHomeData}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 1. Personalized Greeting & Brand Welcome */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSubtext}>
              {isAuthenticated && user
                ? `Welcome back, ${user.first_name} 👋`
                : "India's Premier Automotive Marketplace"}
            </Text>
            <Text style={styles.greetingTitle}>
              {isAuthenticated && user
                ? `Exploring cars in ${user.city || "Bengaluru"}`
                : "Buy Your Next Car Together"}
            </Text>
          </View>

          {isAuthenticated && user ? (
            <TouchableOpacity
              style={styles.profileBadge}
              onPress={() => onNavigate("profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.profileBadgeText}>
                {user.first_name?.[0] || "U"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInPill}
              onPress={() => onNavigate("profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.signInPillText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Prominent Vehicle Search Box */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Brezza, Creta, Nexon EV, Grand Vitara..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearSearchBtn}
              accessibilityLabel="Clear search text"
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.searchActionBtn}
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
            accessibilityLabel="Search vehicles"
          >
            <Text style={styles.searchActionBtnText}>Go</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Search Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickChipsScroll}
          contentContainerStyle={styles.quickChipsContainer}
        >
          {["Maruti Suzuki Brezza", "Hyundai Creta", "Tata Nexon EV", "Grand Vitara"].map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.quickChip}
              onPress={() => {
                setSearchQuery(tag);
                onNavigate("explore");
              }}
            >
              <Text style={styles.quickChipText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Premium Automotive Hero Visual Stage */}
      <View style={styles.heroSection}>
        <View style={styles.heroCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroGradientOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <Badge label="Collective Commerce" variant="emerald" size="sm" />
              <View style={styles.livePulseContainer}>
                <View style={styles.livePulseDot} />
                <Text style={styles.livePulseText}>Reverse Bidding Active</Text>
              </View>
            </View>

            <Text style={styles.heroHeadline}>Never Negotiate Alone.</Text>
            <Text style={styles.heroDescription}>
              Join forces with verified buyers. Authorized OEM dealerships submit competitive bids directly to your group.
            </Text>

            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                onPress={() => onNavigate("groups")}
                activeOpacity={0.85}
              >
                <Text style={styles.heroPrimaryBtnText}>Explore Buyer Groups</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                onPress={() => onNavigate("compare")}
                activeOpacity={0.85}
              >
                <Text style={styles.heroSecondaryBtnText}>
                  Compare Cars ({comparedVehicles.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* 4. Popular Vehicle Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <TouchableOpacity onPress={() => onNavigate("explore")}>
            <Text style={styles.seeAllLink}>View All Categories →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {popularCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => onNavigate("explore")}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={styles.categoryTag}>{cat.tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. Active Group Buying Opportunities (Horizontal Carousel) */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Live Buyer Groups</Text>
            <Text style={styles.sectionSubtitle}>
              Demand pools active in your metro jurisdiction
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate("groups")}>
            <Text style={styles.seeAllLink}>See All ({groups.length}) →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {groups.map((grp) => {
            const progress = grp.current_members_count / grp.max_capacity;
            const isMet = grp.current_members_count >= grp.min_members_threshold;
            return (
              <Card key={grp.id} style={styles.groupCard}>
                <Image
                  source={{
                    uri:
                      grp.model_image_url ||
                      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
                  }}
                  style={styles.groupCardImage}
                  resizeMode="cover"
                />
                <View style={styles.groupCardOverlay}>
                  <Badge label={grp.city} variant="secondary" size="sm" />
                  <View style={styles.savingsTag}>
                    <Text style={styles.savingsTagText}>
                      Save {formatINR(grp.estimated_savings_inr || 45000, { compact: true })}
                    </Text>
                  </View>
                </View>

                <View style={styles.groupCardBody}>
                  <Text style={styles.groupCode}>{grp.group_code}</Text>
                  <Text style={styles.groupTitle} numberOfLines={1}>
                    {grp.model_name}
                  </Text>
                  <Text style={styles.groupLocation}>{grp.rto_circle}</Text>

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTextRow}>
                      <Text style={styles.progressCount}>
                        {grp.current_members_count}/{grp.max_capacity} buyers
                      </Text>
                      <Text
                        style={[
                          styles.progressStatus,
                          { color: isMet ? "#059669" : "#D97706" },
                        ]}
                      >
                        {isMet ? "Quota Met" : "Gathering"}
                      </Text>
                    </View>
                    <ProgressBar progress={progress} />
                  </View>

                  <TouchableOpacity
                    style={styles.joinGroupBtn}
                    onPress={() => setSelectedGroup(grp)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.joinGroupBtnText}>Join Group</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      </View>

      {/* 6. Popular Vehicles in Centralized Catalogue */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Popular Vehicles</Text>
            <Text style={styles.sectionSubtitle}>
              Highest group discount volume & inventory availability
            </Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate("explore")}>
            <Text style={styles.seeAllLink}>Catalogue →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {models.slice(0, 5).map((m) => {
            const minPrice = getVehiclePrice(m.id);
            const isComparing = isVehicleComparing(m.id);
            const primaryVar = variants.find((v) => v.model_id === m.id);

            return (
              <Card key={m.id} style={styles.vehicleCard}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleViewVehicle(m)}
                >
                  <View style={styles.vehicleImageContainer}>
                    <Image
                      source={{ uri: m.image_url }}
                      style={styles.vehicleImage}
                      resizeMode="cover"
                    />
                    <View style={styles.vehicleTypeTag}>
                      <Badge label={m.body_type} variant="secondary" size="sm" />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.compareMiniBtn,
                        isComparing && styles.compareMiniBtnActive,
                      ]}
                      onPress={() => {
                        toggleVehicle({
                          id: m.id,
                          brandName: m.brand_name,
                          name: m.name,
                          bodyType: m.body_type,
                          imageUrl: m.image_url,
                          startingPrice: minPrice,
                          engine: primaryVar?.engine_description,
                          power: primaryVar?.power_ps,
                          torque: primaryVar?.torque_nm,
                          mileage: primaryVar?.arai_mileage,
                          fuelType: primaryVar?.fuel_type,
                          transmission: primaryVar?.transmission_type,
                          seatingCapacity: m.seating_capacity,
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.compareMiniBtnText,
                          isComparing && styles.compareMiniBtnTextActive,
                        ]}
                      >
                        {isComparing ? "✓" : "+ Compare"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.vehicleCardBody}>
                    <Text style={styles.vehicleBrand}>{m.brand_name}</Text>
                    <Text style={styles.vehicleName} numberOfLines={1}>
                      {m.name}
                    </Text>

                    <Text style={styles.vehiclePrice}>
                      From {formatINR(minPrice, { compact: true })}
                    </Text>

                    <View style={styles.vehicleSpecsRow}>
                      <Text style={styles.specPill}>👤 {m.seating_capacity} Seats</Text>
                      <Text style={styles.specPill}>⚡ {primaryVar?.arai_mileage || "19.8 kmpl"}</Text>
                    </View>

                    <View style={styles.vehicleBtnRow}>
                      <TouchableOpacity
                        style={styles.specsBtn}
                        onPress={() => handleViewVehicle(m)}
                      >
                        <Text style={styles.specsBtnText}>Specs</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.testDriveBtn}
                        onPress={() =>
                          setEnquiryCar({
                            brand: m.brand_name,
                            model: m.name,
                            variant: primaryVar?.name,
                          })
                        }
                      >
                        <Text style={styles.testDriveBtnText}>Test Drive</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })}
        </ScrollView>
      </View>

      {/* 7. Recommended Vehicles for You */}
      {recommendedVehicles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Recommended For You</Text>
              <Text style={styles.sectionSubtitle}>
                Matched by active demand clusters and verified dealership allocations
              </Text>
            </View>
            <Badge label="Demand Match" variant="velocity" size="sm" />
          </View>

          <View style={styles.recommendedGrid}>
            {recommendedVehicles.map((m) => {
              const price = getVehiclePrice(m.id);
              return (
                <TouchableOpacity
                  key={`rec-${m.id}`}
                  style={styles.recommendedCard}
                  onPress={() => handleViewVehicle(m)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: m.image_url }} style={styles.recImage} />
                  <View style={styles.recInfo}>
                    <Text style={styles.recBrand}>{m.brand_name}</Text>
                    <Text style={styles.recName}>{m.name}</Text>
                    <Text style={styles.recPrice}>
                      {formatINR(price, { compact: true })}
                    </Text>
                    <Text style={styles.recBadge}>Cluster Active</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 8. Recently Viewed Vehicles (if customer browsed any) */}
      {recentVehicles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <TouchableOpacity onPress={() => setRecentVehicleIds([])}>
              <Text style={styles.clearRecentsLink}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentVehicles.map((m) => (
              <TouchableOpacity
                key={`recent-${m.id}`}
                style={styles.recentMiniCard}
                onPress={() => handleViewVehicle(m)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: m.image_url }} style={styles.recentImage} />
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.recentPrice}>
                    {formatINR(getVehiclePrice(m.id), { compact: true })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 9. Featured Verified Dealership Network */}
      {dealers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Authorized Dealer Network</Text>
              <Text style={styles.sectionSubtitle}>
                100% verified OEM dealer showrooms with direct delivery
              </Text>
            </View>
            <Badge label="Verified Partners" variant="emerald" size="sm" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {dealers.map((dealer) => (
              <Card key={dealer.id} style={styles.dealerCard}>
                <View style={styles.dealerHeader}>
                  <View style={styles.dealerLogo}>
                    <Text style={styles.dealerLogoText}>
                      {dealer.trade_name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dealerTradeName} numberOfLines={1}>
                      {dealer.trade_name}
                    </Text>
                    <Text style={styles.dealerFranchise} numberOfLines={1}>
                      {dealer.oem_brand_franchise}
                    </Text>
                  </View>
                </View>

                <View style={styles.dealerMetaRow}>
                  <Text style={styles.dealerLocation}>📍 {dealer.city}</Text>
                  <Badge label="Verified Showroom" variant="emerald" size="sm" />
                </View>

                <TouchableOpacity
                  style={styles.dealerActionBtn}
                  onPress={() =>
                    setEnquiryCar({
                      brand: dealer.oem_brand_franchise,
                      model: "Official Quotation",
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dealerActionBtnText}>Request Dealer Quote</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 10. Relevant Promotional Campaigns */}
      {campaigns.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Dealership Flash Offers</Text>
            <Badge label="Limited Window" variant="rose" size="sm" />
          </View>

          {campaigns.slice(0, 2).map((cmp) => (
            <Card key={cmp.id} style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <Badge label="Promotional Bonus" variant="rose" size="sm" />
                {cmp.offer_details?.discount_amount && (
                  <Text style={styles.campaignDiscount}>
                    {formatINR(cmp.offer_details.discount_amount)} Off
                  </Text>
                )}
              </View>

              <Text style={styles.campaignTitle}>{cmp.title}</Text>
              <Text style={styles.campaignDesc} numberOfLines={2}>
                {cmp.description}
              </Text>

              <TouchableOpacity
                style={styles.claimOfferBtn}
                onPress={() => onNavigate("groups")}
                activeOpacity={0.85}
              >
                <Text style={styles.claimOfferBtnText}>
                  Unlock with Buyer Groups →
                </Text>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}

      {/* 11. Quick Navigation Hub Bar */}
      <View style={styles.quickNavSection}>
        <Text style={styles.quickNavTitle}>Quick Navigation</Text>
        <View style={styles.quickNavGrid}>
          <TouchableOpacity
            style={styles.quickNavCard}
            onPress={() => onNavigate("explore")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>🚗</Text>
            <Text style={styles.quickNavLabel}>Explore All Cars</Text>
            <Text style={styles.quickNavHint}>{models.length} Models</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavCard}
            onPress={() => onNavigate("compare")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>⇄</Text>
            <Text style={styles.quickNavLabel}>Compare Vehicles</Text>
            <Text style={styles.quickNavHint}>
              {comparedVehicles.length} Selected
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavCard}
            onPress={() => onNavigate("groups")}
            activeOpacity={0.8}
          >
            <Text style={styles.quickNavIcon}>👥</Text>
            <Text style={styles.quickNavLabel}>Group Buying</Text>
            <Text style={styles.quickNavHint}>{groups.length} Pools Active</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {selectedGroup && (
        <JoinGroupModal
          visible={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          group={selectedGroup}
        />
      )}

      {selectedCar && (
        <VehicleDetailModal
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          car={selectedCar}
          variants={variants}
          onJoinGroup={() => onNavigate("groups")}
        />
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  greetingSubtext: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  profileBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBadgeText: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.velocity,
  },
  signInPill: {
    backgroundColor: colors.velocity,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  signInPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },
  searchActionBtn: {
    backgroundColor: colors.velocity,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchActionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  quickChipsScroll: {
    marginTop: 10,
  },
  quickChipsContainer: {
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  heroSection: {
    padding: 16,
  },
  heroCard: {
    width: "100%",
    height: 230,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#090D16",
    ...shadows.elevated,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    opacity: 0.85,
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 13, 22, 0.55)",
  },
  heroContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    justifyContent: "space-between",
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  livePulseContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  livePulseText: {
    color: "#E2E8F0",
    fontSize: 10,
    fontWeight: "600",
  },
  heroHeadline: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroDescription: {
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 16,
    maxWidth: "92%",
  },
  heroActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  heroPrimaryBtn: {
    flex: 1,
    backgroundColor: colors.velocity,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  heroPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  heroSecondaryBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.velocity,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 110,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    alignItems: "center",
    ...shadows.subtle,
  },
  categoryIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  categoryTag: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  groupCard: {
    width: 250,
    padding: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  groupCardImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#0F172A",
  },
  groupCardOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savingsTag: {
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  groupCardBody: {
    padding: 12,
    gap: 4,
  },
  groupCode: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    fontFamily: "monospace",
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  groupLocation: {
    fontSize: 11,
    color: "#64748B",
  },
  progressContainer: {
    marginTop: 6,
    marginBottom: 6,
    gap: 4,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressCount: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  progressStatus: {
    fontSize: 10,
    fontWeight: "700",
  },
  joinGroupBtn: {
    backgroundColor: colors.velocity,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  joinGroupBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  vehicleCard: {
    width: 230,
    padding: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  vehicleImageContainer: {
    width: "100%",
    height: 130,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  vehicleTypeTag: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  compareMiniBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compareMiniBtnActive: {
    backgroundColor: colors.velocity,
  },
  compareMiniBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F172A",
  },
  compareMiniBtnTextActive: {
    color: "#FFFFFF",
  },
  vehicleCardBody: {
    padding: 12,
  },
  vehicleBrand: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 1,
  },
  vehiclePrice: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.velocity,
    marginTop: 2,
  },
  vehicleSpecsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  specPill: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vehicleBtnRow: {
    flexDirection: "row",
    gap: 6,
  },
  specsBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  specsBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  testDriveBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.velocity,
    alignItems: "center",
  },
  testDriveBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recommendedGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recommendedCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    padding: 8,
  },
  recImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  recInfo: {
    marginTop: 6,
  },
  recBrand: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  recName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 1,
  },
  recPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.velocity,
    marginTop: 2,
  },
  recBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  clearRecentsLink: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  recentMiniCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 8,
  },
  recentImage: {
    width: "100%",
    height: 70,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  recentInfo: {
    marginTop: 6,
  },
  recentName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  recentPrice: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.velocity,
    marginTop: 1,
  },
  dealerCard: {
    width: 240,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  dealerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dealerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  dealerLogoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  dealerTradeName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  dealerFranchise: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  dealerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dealerLocation: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  dealerActionBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  dealerActionBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  campaignCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    gap: 6,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignDiscount: {
    fontSize: 13,
    fontWeight: "900",
    color: "#E11D48",
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  campaignDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  claimOfferBtn: {
    backgroundColor: "#E11D48",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  claimOfferBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  quickNavSection: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  quickNavTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  quickNavGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    alignItems: "center",
  },
  quickNavIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickNavLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  quickNavHint: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 2,
  },
});
