import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useCompare, MobileComparedVehicle } from "../context/CompareContext";
import { formatINR } from "@groupdrive/utils";
import { EnquiryModal } from "./EnquiryModal";

interface Props {
  onNavigateToExplore?: () => void;
  onNavigateToGroups?: (modelId?: string) => void;
}

type SpecCategoryKey =
  | "ALL"
  | "PRICING"
  | "PERFORMANCE"
  | "EFFICIENCY"
  | "DIMENSIONS"
  | "SAFETY"
  | "COMFORT";

interface SpecDefinition {
  category: SpecCategoryKey;
  label: string;
  getValue: (v: MobileComparedVehicle) => string;
  isHighlight?: boolean;
}

export function CompareScreen({ onNavigateToExplore, onNavigateToGroups }: Props) {
  const {
    comparedVehicles,
    removeVehicle,
    clearVehicles,
    limitAlert,
    dismissAlert,
  } = useCompare();

  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SpecCategoryKey>("ALL");
  const [enquiryCar, setEnquiryCar] = useState<{
    brand: string;
    model: string;
    type: "TEST_DRIVE" | "PRICE_QUOTE";
  } | null>(null);

  // Native share sheet
  const handleShareComparison = async () => {
    if (comparedVehicles.length === 0) return;

    try {
      const summaryList = comparedVehicles
        .map(
          (car, idx) =>
            `${idx + 1}. ${car.brandName} ${car.name} - Ex-Showroom from ${formatINR(car.startingPrice, { compact: true })} (Est. On-Road ${formatINR(car.onRoadEstimate || car.startingPrice * 1.16, { compact: true })})`
        )
        .join("\n");

      const carIds = comparedVehicles.map((c) => c.id).join(",");
      const shareMessage = `GROUPDRIVE Technical Vehicle Comparison:\n\n${summaryList}\n\nView complete side-by-side technical evaluation and collective group buying discounts on GROUPDRIVE:\ngroupdrive://compare?cars=${carIds}`;

      await Share.share({
        title: "GROUPDRIVE Vehicle Comparison",
        message: shareMessage,
      });
    } catch (err) {
      // User cancelled or share dismissed
    }
  };

  if (comparedVehicles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIconText}>⇄</Text>
        </View>
        <Text style={styles.emptyTitle}>No Vehicles in Comparison</Text>
        <Text style={styles.emptySubtitle}>
          Select up to 3 cars from the Vehicle Catalogue to evaluate real-world specifications, fuel economy, and group discounts side-by-side.
        </Text>
        {onNavigateToExplore && (
          <TouchableOpacity
            style={styles.browseButton}
            onPress={onNavigateToExplore}
          >
            <Text style={styles.browseButtonText}>Explore Vehicle Catalogue</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // All comparison specifications organized by category
  const specDefinitions: SpecDefinition[] = [
    // 1. Pricing & Economics
    {
      category: "PRICING",
      label: "Ex-Showroom Price",
      getValue: (v) => formatINR(v.startingPrice, { compact: true }),
      isHighlight: true,
    },
    {
      category: "PRICING",
      label: "Estimated On-Road",
      getValue: (v) =>
        formatINR(v.onRoadEstimate || Math.round(v.startingPrice * 1.16), {
          compact: true,
        }),
      isHighlight: true,
    },
    {
      category: "PRICING",
      label: "Group Discount",
      getValue: (v) =>
        formatINR(v.groupDiscount || 45000, { compact: true }) + " Off",
      isHighlight: true,
    },
    {
      category: "PRICING",
      label: "Est. Monthly EMI",
      getValue: (v) => {
        const principal = (v.onRoadEstimate || v.startingPrice * 1.16) * 0.8;
        // ~Rs 2050 per lakh for 5 years @ 8.5%
        const emi = Math.round((principal / 100000) * 2050);
        return `${formatINR(emi)} /mo*`;
      },
    },

    // 2. Powertrain & Performance
    {
      category: "PERFORMANCE",
      label: "Engine & Displacement",
      getValue: (v) => v.engine || "1.5L Petrol / Hybrid",
    },
    {
      category: "PERFORMANCE",
      label: "Max Power Output",
      getValue: (v) => v.power || "103 - 115 PS",
      isHighlight: true,
    },
    {
      category: "PERFORMANCE",
      label: "Peak Torque Output",
      getValue: (v) => v.torque || "136.8 - 143.8 Nm",
    },
    {
      category: "PERFORMANCE",
      label: "Transmission",
      getValue: (v) => v.transmission || "Manual / Automatic",
    },
    {
      category: "PERFORMANCE",
      label: "Drive Configuration",
      getValue: () => "Front Wheel Drive (2WD)",
    },

    // 3. Fuel & Efficiency
    {
      category: "EFFICIENCY",
      label: "Fuel Type",
      getValue: (v) => v.fuelType || "Petrol",
    },
    {
      category: "EFFICIENCY",
      label: "ARAI Mileage",
      getValue: (v) => v.mileage || "19.8 kmpl",
      isHighlight: true,
    },
    {
      category: "EFFICIENCY",
      label: "Fuel Tank Capacity",
      getValue: (v) => v.fuelTank || "48 Litres",
    },
    {
      category: "EFFICIENCY",
      label: "Emission Compliance",
      getValue: () => "BS6 Phase 2 / OBD-2",
    },

    // 4. Dimensions & Space
    {
      category: "DIMENSIONS",
      label: "Exterior Dimensions",
      getValue: (v) => v.dimensions || "3,995 x 1,790 x 1,685 mm",
    },
    {
      category: "DIMENSIONS",
      label: "Ground Clearance",
      getValue: (v) => v.groundClearance || "198 mm",
      isHighlight: true,
    },
    {
      category: "DIMENSIONS",
      label: "Boot Space Volume",
      getValue: (v) => v.bootSpace || "328 Litres",
    },
    {
      category: "DIMENSIONS",
      label: "Seating Capacity",
      getValue: (v) => `${v.seatingCapacity || 5} Passengers`,
    },

    // 5. Safety & Security
    {
      category: "SAFETY",
      label: "Safety Crash Rating",
      getValue: (v) => v.safety || "4 Stars Global NCAP",
      isHighlight: true,
    },
    {
      category: "SAFETY",
      label: "Airbags Count",
      getValue: (v) => v.airbags || "6 Airbags Standard",
    },
    {
      category: "SAFETY",
      label: "Electronic Stability",
      getValue: () => "ESP with Hill Hold Assist",
    },
    {
      category: "SAFETY",
      label: "Braking System",
      getValue: () => "ABS + EBD + Brake Assist",
    },

    // 6. Comfort & Technology
    {
      category: "COMFORT",
      label: "Touchscreen System",
      getValue: (v) => v.infotainment || "9-inch Touchscreen",
    },
    {
      category: "COMFORT",
      label: "Smartphone Pairing",
      getValue: () => "Wireless Apple CarPlay / Android Auto",
    },
    {
      category: "COMFORT",
      label: "Sunroof Feature",
      getValue: (v) => v.sunroof || "Electric Sunroof",
    },
    {
      category: "COMFORT",
      label: "Climate Control",
      getValue: (v) => v.climateControl || "Automatic Climate Control",
    },
  ];

  // Filter rows by category and difference mode
  const filteredSpecs = specDefinitions.filter((row) => {
    // Category filter
    if (activeCategory !== "ALL" && row.category !== activeCategory) {
      return false;
    }

    // Difference filter
    if (onlyDifferences) {
      const vals = comparedVehicles.map((v) => row.getValue(v));
      const allEqual = vals.every((v) => v === vals[0]);
      if (allEqual) return false;
    }

    return true;
  });

  // Calculate total differences across all specs
  const totalDifferencesCount = specDefinitions.filter((row) => {
    const vals = comparedVehicles.map((v) => row.getValue(v));
    return !vals.every((v) => v === vals[0]);
  }).length;

  return (
    <View style={styles.container}>
      {/* Alert banner if limit hit */}
      {limitAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>{limitAlert}</Text>
          <TouchableOpacity onPress={dismissAlert}>
            <Text style={styles.alertDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Header Controls Bar */}
      <View style={styles.topControlBar}>
        <View style={styles.topTitles}>
          <View style={styles.titleWithCount}>
            <Text style={styles.topTitle}>Vehicle Comparison</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{comparedVehicles.length}/3</Text>
            </View>
          </View>
          <Text style={styles.topSubtitle}>
            Side-by-side technical evaluation
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareComparison}
          >
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.diffBtn, onlyDifferences && styles.diffBtnActive]}
            onPress={() => setOnlyDifferences(!onlyDifferences)}
          >
            <Text
              style={[
                styles.diffBtnText,
                onlyDifferences && styles.diffBtnTextActive,
              ]}
            >
              {onlyDifferences
                ? `Diffs (${totalDifferencesCount})`
                : "Highlight Diffs"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={clearVehicles}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills Strip */}
      <View style={styles.categoryPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {[
            { id: "ALL", label: "All Specs" },
            { id: "PRICING", label: "Pricing & On-Road" },
            { id: "PERFORMANCE", label: "Engine & Power" },
            { id: "EFFICIENCY", label: "Fuel Economy" },
            { id: "DIMENSIONS", label: "Dimensions & Boot" },
            { id: "SAFETY", label: "Safety & Ratings" },
            { id: "COMFORT", label: "Comfort & Tech" },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                activeCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(cat.id as SpecCategoryKey)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  activeCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Comparison Matrix */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.matrixContainer}>
          {/* Header Row: Vehicle Cards */}
          <View style={styles.vehicleHeaderRow}>
            {/* Label Column Header */}
            <View style={styles.labelColumnHeader}>
              <Text style={styles.columnHeaderTitle}>Specifications</Text>
              <Text style={styles.columnHeaderSub}>
                {filteredSpecs.length} Attributes
              </Text>
            </View>

            {/* Vehicle Columns */}
            {comparedVehicles.map((car, idx) => (
              <View key={car.id} style={styles.vehicleCardColumn}>
                <View style={styles.cardBox}>
                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.cardRemoveBtn}
                    onPress={() => removeVehicle(car.id)}
                  >
                    <Text style={styles.cardRemoveBtnText}>✕</Text>
                  </TouchableOpacity>

                  {/* Slot Indicator */}
                  <View style={styles.slotIndicator}>
                    <Text style={styles.slotIndicatorText}>Slot {idx + 1}</Text>
                  </View>

                  <Image source={{ uri: car.imageUrl }} style={styles.cardImage} />

                  <Badge label={car.brandName} variant="secondary" size="sm" />
                  <Text style={styles.cardCarName} numberOfLines={1}>
                    {car.name}
                  </Text>
                  <Text style={styles.cardCarBodyType}>
                    {car.bodyType}
                  </Text>

                  <Text style={styles.cardPrice}>
                    From {formatINR(car.startingPrice, { compact: true })}
                  </Text>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.quoteBtn}
                      onPress={() =>
                        setEnquiryCar({
                          brand: car.brandName,
                          model: car.name,
                          type: "PRICE_QUOTE",
                        })
                      }
                    >
                      <Text style={styles.quoteBtnText}>Request Quote</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.testDriveBtn}
                      onPress={() =>
                        setEnquiryCar({
                          brand: car.brandName,
                          model: car.name,
                          type: "TEST_DRIVE",
                        })
                      }
                    >
                      <Text style={styles.testDriveBtnText}>Test Drive</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Empty Slots if < 3 */}
            {comparedVehicles.length < 3 && onNavigateToExplore && (
              <View style={styles.vehicleCardColumn}>
                <TouchableOpacity
                  style={styles.emptySlotCard}
                  onPress={onNavigateToExplore}
                >
                  <View style={styles.emptyPlusCircle}>
                    <Text style={styles.emptyPlusIcon}>+</Text>
                  </View>
                  <Text style={styles.emptySlotTitle}>Add Vehicle</Text>
                  <Text style={styles.emptySlotSub}>
                    Slot {comparedVehicles.length + 1} of 3
                  </Text>
                  <Text style={styles.emptySlotBrowse}>Tap to browse catalogue</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Specifications Table Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.specRowsContainer}
          >
            {filteredSpecs.map((row, rIdx) => {
              const values = comparedVehicles.map((v) => row.getValue(v));
              const allEqual = values.every((val) => val === values[0]);
              const isDifferent = !allEqual && comparedVehicles.length > 1;

              return (
                <View
                  key={rIdx}
                  style={[
                    styles.specRow,
                    rIdx % 2 === 1 && styles.specRowAlt,
                    isDifferent && styles.specRowDiff,
                  ]}
                >
                  {/* Parameter Label */}
                  <View style={styles.labelColumn}>
                    <Text
                      style={[
                        styles.specLabelText,
                        row.isHighlight && styles.specLabelTextHighlight,
                      ]}
                    >
                      {row.label}
                    </Text>
                    {isDifferent && (
                      <View style={styles.diffTag}>
                        <Text style={styles.diffTagText}>differs</Text>
                      </View>
                    )}
                  </View>

                  {/* Value for each compared car */}
                  {comparedVehicles.map((car) => {
                    const val = row.getValue(car);
                    return (
                      <View key={car.id} style={styles.vehicleValueColumn}>
                        <Text
                          style={[
                            styles.specValueText,
                            row.isHighlight && styles.specValueTextHighlight,
                            isDifferent && styles.specValueTextDiff,
                          ]}
                        >
                          {val}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Empty Slot column placeholder for table alignment */}
                  {comparedVehicles.length < 3 && (
                    <View style={styles.vehicleValueColumn} />
                  )}
                </View>
              );
            })}

            {filteredSpecs.length === 0 && (
              <View style={styles.noDiffsNotice}>
                <Text style={styles.noDiffsText}>
                  No differences found in this category.
                </Text>
                <TouchableOpacity onPress={() => setOnlyDifferences(false)}>
                  <Text style={styles.noDiffsAction}>Show all specifications</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Enquiry Modal */}
      {enquiryCar && (
        <EnquiryModal
          isOpen={!!enquiryCar}
          onClose={() => setEnquiryCar(null)}
          brandName={enquiryCar.brand}
          modelName={enquiryCar.model}
          initialEnquiryType={enquiryCar.type}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
    color: "#2563EB",
    fontWeight: "bold",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // Alert
  alertBanner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#FDE68A",
  },
  alertText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
  alertDismiss: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "bold",
  },
  // Top Controls Bar
  topControlBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitles: {
    flex: 1,
  },
  titleWithCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  topTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
  },
  topSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  diffBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  diffBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  diffBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  diffBtnTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  // Category Pills
  categoryPillsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryPillsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  categoryPillActive: {
    backgroundColor: "#0F172A",
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Matrix Table
  matrixContainer: {
    paddingVertical: 8,
  },
  vehicleHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  labelColumnHeader: {
    width: 120,
    paddingRight: 10,
    justifyContent: "flex-end",
    paddingBottom: 12,
  },
  columnHeaderTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  columnHeaderSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  vehicleCardColumn: {
    width: 175,
    paddingHorizontal: 6,
  },
  cardBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    position: "relative",
  },
  cardRemoveBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  cardRemoveBtnText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "bold",
  },
  slotIndicator: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  slotIndicatorText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  cardImage: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    marginBottom: 8,
  },
  cardCarName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4,
  },
  cardCarBodyType: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
    marginTop: 4,
    marginBottom: 8,
  },
  cardActions: {
    gap: 6,
  },
  quoteBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  quoteBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  testDriveBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  testDriveBtnText: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "600",
  },
  // Empty Slot Card
  emptySlotCard: {
    height: 230,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
  },
  emptyPlusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyPlusIcon: {
    fontSize: 20,
    color: "#2563EB",
    fontWeight: "bold",
  },
  emptySlotTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  emptySlotSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  emptySlotBrowse: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 8,
  },
  // Table Rows
  specRowsContainer: {
    paddingBottom: 40,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  specRowAlt: {
    backgroundColor: "#FFFFFF",
  },
  specRowDiff: {
    backgroundColor: "#EFF6FF",
  },
  labelColumn: {
    width: 120,
    paddingRight: 10,
  },
  specLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  specLabelTextHighlight: {
    fontWeight: "800",
    color: "#0F172A",
  },
  diffTag: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  diffTagText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  vehicleValueColumn: {
    width: 175,
    paddingHorizontal: 6,
  },
  specValueText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "500",
  },
  specValueTextHighlight: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  specValueTextDiff: {
    color: "#1D4ED8",
    fontWeight: "700",
  },
  noDiffsNotice: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noDiffsText: {
    fontSize: 12,
    color: "#64748B",
  },
  noDiffsAction: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 6,
  },
});
