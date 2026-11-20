import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { colors, radius } from "../theme/tokens";
import { SecureStorage } from "../services/storage";

interface Props {
  onComplete: () => void;
}

const ONBOARDING_SLIDES = [
  {
    id: "slide-1",
    tag: "COLLECTIVE COMMERCE",
    title: "Never Negotiate Alone.",
    description:
      "Join forces with fellow verified car buyers in your metro city. Pool purchasing power to negotiate as an institutional fleet buyer.",
    icon: "👥",
    highlight: "Save up to Rs 80,000",
  },
  {
    id: "slide-2",
    tag: "DEALEROS BIDDING",
    title: "Reverse Dealer Bidding.",
    description:
      "Authorized OEM dealerships compete for your collective group demand with transparent, itemized on-road price quotes.",
    icon: "⚡",
    highlight: "100% Authorized OEM Dealers",
  },
  {
    id: "slide-3",
    tag: "DIRECT SHOWROOM DELIVERY",
    title: "Official Showroom Billing.",
    description:
      "Direct vehicle invoicing and delivery from authorized dealer showrooms. Full OEM manufacturer warranty with zero broker fees.",
    icon: "🛡️",
    highlight: "Zero Brokerage Policy",
  },
];

export function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFinish = async () => {
    await SecureStorage.setItem("gd_has_seen_onboarding", "true");
    onComplete();
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const currentSlide = ONBOARDING_SLIDES[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Skip Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>GD</Text>
        </View>
        <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip Intro</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Card */}
      <View style={styles.slideContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>{currentSlide.icon}</Text>
        </View>

        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{currentSlide.tag}</Text>
        </View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>

        <View style={styles.highlightPill}>
          <View style={styles.greenDot} />
          <Text style={styles.highlightText}>{currentSlide.highlight}</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.footer}>
        {/* Step Indicator Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started Action */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex === ONBOARDING_SLIDES.length - 1
              ? "Start Exploring Cars"
              : "Continue →"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  iconEmoji: {
    fontSize: 42,
  },
  tagBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#059669",
  },
  highlightText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 20,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#2563EB",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

