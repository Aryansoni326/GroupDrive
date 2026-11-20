import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { formatINR } from "@groupdrive/utils";
import { colors, radius, shadows } from "../theme/tokens";

export interface VehicleCardItem {
  id: string;
  brandName: string;
  name: string;
  bodyType: string;
  imageUrl: string;
  startingPrice: number;
  seatingCapacity?: number;
  mileage?: string;
  fuelType?: string;
  power?: string;
}

interface VehicleCardProps {
  vehicle: VehicleCardItem;
  isComparing?: boolean;
  onPress?: () => void;
  onToggleCompare?: () => void;
  onBookQuote?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function VehicleCard({
  vehicle,
  isComparing = false,
  onPress,
  onToggleCompare,
  onBookQuote,
  style,
}: VehicleCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <Card style={[styles.card, style]}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        {/* Media Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: imageError
                ? "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"
                : vehicle.imageUrl,
            }}
            onError={() => setImageError(true)}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.bodyTypeBadge}>
            <Badge label={vehicle.bodyType} variant="secondary" size="sm" />
          </View>

          {onToggleCompare && (
            <TouchableOpacity
              style={[
                styles.compareBadge,
                isComparing && styles.compareBadgeActive,
              ]}
              onPress={onToggleCompare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
              accessibilityLabel={isComparing ? "Remove vehicle from comparison" : "Add vehicle to comparison"}
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
          )}
        </View>

        {/* Content Details */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.brandName}>{vehicle.brandName}</Text>
              <Text style={styles.modelName}>{vehicle.name}</Text>
            </View>
            <View style={styles.priceColumn}>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.priceValue}>
                {formatINR(vehicle.startingPrice, { compact: true })}
              </Text>
            </View>
          </View>

          {/* Specs Highlights Strip */}
          <View style={styles.specsRow}>
            <Text style={styles.specText}>
              👤 {vehicle.seatingCapacity || 5} Seater
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.specText}>
              ⚡ {vehicle.mileage || "19.8 kmpl"}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.specText}>
              ⚙️ {vehicle.fuelType || "Petrol"}
            </Text>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsBtnText}>View Specs</Text>
            </TouchableOpacity>
            {onBookQuote && (
              <TouchableOpacity
                style={styles.quoteBtn}
                onPress={onBookQuote}
                activeOpacity={0.8}
              >
                <Text style={styles.quoteBtnText}>Book Test Drive</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 16,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    width: "100%",
    height: 175,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  bodyTypeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  compareBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
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
  content: {
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleColumn: {
    flex: 1,
  },
  brandName: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modelName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  priceColumn: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.velocity,
    marginTop: 2,
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  specText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  separator: {
    marginHorizontal: 6,
    color: "#CBD5E1",
    fontSize: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 10,
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
  quoteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.velocity,
    alignItems: "center",
  },
  quoteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
