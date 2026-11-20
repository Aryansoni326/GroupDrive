import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { customerApi } from "@groupdrive/api-client";
import { useMobileAuth } from "../context/AuthContext";
import { formatINR } from "@groupdrive/utils";
import { PublicBuyerGroupItem } from "@groupdrive/types";

interface JoinGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: PublicBuyerGroupItem;
  onSuccess?: () => void;
}

export function JoinGroupModal({
  visible,
  onClose,
  group,
  onSuccess,
}: JoinGroupModalProps) {
  const { user } = useMobileAuth();
  const [customerName, setCustomerName] = useState(
    user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Rahul Menon" : "Rahul Menon"
  );
  const [customerPhone, setCustomerPhone] = useState(
    user?.phone_number || "+919876543210"
  );
  const [customerEmail, setCustomerEmail] = useState(
    user?.email || "customer@groupdrive.in"
  );

  const availableVariants = group.requirements?.preferred_variants || [
    "Top Variant",
    "Mid Variant",
    "Base Variant",
  ];
  const [selectedVariant, setSelectedVariant] = useState(availableVariants[0] || "Top Variant");

  const availableColours = group.requirements?.preferred_colours || [
    "Pearl Arctic White",
    "Magma Grey",
    "Nexa Blue",
    "Flexible Colour",
  ];
  const [selectedColour, setSelectedColour] = useState(availableColours[0] || "Flexible Colour");

  const [financing, setFinancing] = useState<"LOAN" | "SELF_FUNDED">("LOAN");
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleJoin() {
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await customerApi.groups.joinGroup(group.id, {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        city: group.city,
        preferred_variant: selectedVariant,
        preferred_colour: selectedColour,
        financing_preference: financing,
      });

      if (res.success) {
        setSuccessData(res.data);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to join group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSuccessData(null);
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleReset}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Badge label="Collective Group Buy" variant="emerald" size="sm" />
              <Text style={styles.title}>Join {group.model_name}</Text>
              <Text style={styles.subtitle}>
                Cluster: {group.group_code} • {group.city} Jurisdiction
              </Text>
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {successData ? (
              <View style={styles.successBox}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Membership Confirmed!</Text>
                <Text style={styles.successDesc}>
                  You are now Member #{group.current_members_count + 1} of {group.max_capacity} in the {group.city} {group.model_name} demand cluster.
                </Text>

                <View style={styles.confirmedDetailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Group Code:</Text>
                    <Text style={styles.detailValBold}>{group.group_code}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Selected Variant:</Text>
                    <Text style={styles.detailVal}>{selectedVariant}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Colour Preference:</Text>
                    <Text style={styles.detailVal}>{selectedColour}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Target Group Savings:</Text>
                    <Text style={styles.detailValEmerald}>
                      {formatINR(group.estimated_savings_inr || 45000)}
                    </Text>
                  </View>
                </View>

                <View style={styles.nextStepsBox}>
                  <Text style={styles.nextStepsTitle}>What Happens Next:</Text>
                  <Text style={styles.nextStepsText}>
                    1. Authorized dealerships receive your demand parameters via DealerOS.
                  </Text>
                  <Text style={styles.nextStepsText}>
                    2. Certified dealerships submit competitive reverse-auction proposals.
                  </Text>
                  <Text style={styles.nextStepsText}>
                    3. You review itemized quotations with zero purchase obligation.
                  </Text>
                </View>

                <Button title="Done" onPress={handleReset} variant="dark" style={{ marginTop: 8 }} />
              </View>
            ) : (
              <View style={styles.form}>
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Savings Pill */}
                <View style={styles.savingsCard}>
                  <View>
                    <Text style={styles.savingsLabel}>Target Group Savings:</Text>
                    <Text style={styles.savingsNote}>Deducted directly on showroom invoice</Text>
                  </View>
                  <Text style={styles.savingsValue}>
                    {formatINR(group.estimated_savings_inr || 45000)}
                  </Text>
                </View>

                {/* Customer Details */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Rahul Menon"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile"
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                  />
                </View>

                {/* Preferred Variant Chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Preferred Variant</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {availableVariants.map((varName) => {
                      const isSel = selectedVariant === varName;
                      return (
                        <TouchableOpacity
                          key={varName}
                          style={[styles.chipPill, isSel && styles.chipPillActive]}
                          onPress={() => setSelectedVariant(varName)}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                            {varName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Colour Preference Chips */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Colour Preference</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {availableColours.map((colName) => {
                      const isSel = selectedColour === colName;
                      return (
                        <TouchableOpacity
                          key={colName}
                          style={[styles.chipPill, isSel && styles.chipPillActive]}
                          onPress={() => setSelectedColour(colName)}
                        >
                          <Text style={[styles.chipText, isSel && styles.chipTextActive]}>
                            {colName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Financing Preference */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Financing Method</Text>
                  <View style={styles.financingRow}>
                    <TouchableOpacity
                      style={[
                        styles.financingBtn,
                        financing === "LOAN" && styles.financingBtnActive,
                      ]}
                      onPress={() => setFinancing("LOAN")}
                    >
                      <Text
                        style={[
                          styles.financingBtnText,
                          financing === "LOAN" && styles.financingBtnTextActive,
                        ]}
                      >
                        Bank Loan / EMI
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.financingBtn,
                        financing === "SELF_FUNDED" && styles.financingBtnActive,
                      ]}
                      onPress={() => setFinancing("SELF_FUNDED")}
                    >
                      <Text
                        style={[
                          styles.financingBtnText,
                          financing === "SELF_FUNDED" && styles.financingBtnTextActive,
                        ]}
                      >
                        Self-Funded / Upfront
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Safe & Risk Free Notice */}
                <View style={styles.freeNoticeBox}>
                  <Text style={styles.freeNoticeText}>
                    100% Free Participation. Zero advance payment or binding purchase obligation. You decide whether to proceed after reviewing competitive dealership quotes.
                  </Text>
                </View>

                <Button
                  title="Confirm Cluster Membership"
                  onPress={handleJoin}
                  isLoading={isLoading}
                  variant="emerald"
                  style={styles.submitBtn}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "bold",
  },
  body: {
    padding: 18,
  },
  form: {
    gap: 14,
    paddingBottom: 20,
  },
  savingsCard: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  savingsLabel: {
    fontSize: 12,
    color: "#065F46",
    fontWeight: "800",
  },
  savingsNote: {
    fontSize: 10,
    color: "#059669",
    marginTop: 1,
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#047857",
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  chipsScroll: {
    flexDirection: "row",
  },
  chipPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  chipPillActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  chipTextActive: {
    color: "#1E40AF",
    fontWeight: "700",
  },
  financingRow: {
    flexDirection: "row",
    gap: 8,
  },
  financingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  financingBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  financingBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  financingBtnTextActive: {
    color: "#1E40AF",
    fontWeight: "700",
  },
  freeNoticeBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  freeNoticeText: {
    fontSize: 10,
    color: "#64748B",
    lineHeight: 14,
  },
  submitBtn: {
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "600",
  },
  // Success
  successBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 26,
    color: "#059669",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  successDesc: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  confirmedDetailsCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  detailVal: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  detailValBold: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F172A",
    fontFamily: "monospace",
  },
  detailValEmerald: {
    fontSize: 12,
    fontWeight: "900",
    color: "#059669",
  },
  nextStepsBox: {
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 12,
    gap: 4,
  },
  nextStepsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E40AF",
    textTransform: "uppercase",
  },
  nextStepsText: {
    fontSize: 10,
    color: "#1E3A8A",
    lineHeight: 14,
  },
});
