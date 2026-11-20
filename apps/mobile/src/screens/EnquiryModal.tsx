import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { customerApi } from "@groupdrive/api-client";
import { useMobileAuth } from "../context/AuthContext";

interface EnquiryModalProps {
  visible?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  brandName: string;
  modelName: string;
  variantName?: string;
  initialEnquiryType?: "TEST_DRIVE" | "PRICE_QUOTE";
}

export function EnquiryModal({
  visible,
  isOpen,
  onClose,
  brandName,
  modelName,
  variantName,
  initialEnquiryType = "TEST_DRIVE",
}: EnquiryModalProps) {
  const isModalVisible = visible ?? isOpen ?? false;
  const { user } = useMobileAuth();
  const [customerName, setCustomerName] = useState(
    user ? `${user.first_name} ${user.last_name}` : ""
  );
  const [customerPhone, setCustomerPhone] = useState(user?.phone_number || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [enquiryType, setEnquiryType] = useState<"TEST_DRIVE" | "PRICE_QUOTE">(
    initialEnquiryType
  );
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    if (!customerName || !customerPhone || !customerEmail) {
      setErrorMessage("Please complete all required fields.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!customerEmail.includes("@") || !customerEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await customerApi.enquiries.submitEnquiry({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        city: "Bengaluru",
        brand_name: brandName,
        model_name: modelName,
        variant_name: variantName,
        enquiry_type: enquiryType,
        purchase_timeline: "WITHIN_15_DAYS",
        financing_preference: "LOAN",
        notes,
      });

      if (res.success) {
        setSuccessResult(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to submit enquiry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSuccessResult(null);
    setErrorMessage("");
    onClose();
  }

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="slide"
      onRequestClose={handleReset}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Badge label="Authorized Dealer Direct" variant="rose" />
              <Text style={styles.title}>
                {enquiryType === "TEST_DRIVE"
                  ? "Book Showroom Test Drive"
                  : "Request Price Quotation"}
              </Text>
              <Text style={styles.subtitle}>
                {brandName} {modelName} {variantName ? `- ${variantName}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={handleReset} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {successResult ? (
              <View style={styles.successBox}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Enquiry Confirmed!</Text>
                <Text style={styles.successDesc}>
                  Assigned to {successResult.dealership_name}. A sales consultant
                  will contact you shortly.
                </Text>
                <View style={styles.refBox}>
                  <Text style={styles.refText}>
                    Booking ID: {successResult.enquiry_id}
                  </Text>
                </View>
                <Button title="Done" onPress={handleReset} variant="dark" />
              </View>
            ) : (
              <View style={styles.form}>
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Switcher */}
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    onPress={() => setEnquiryType("TEST_DRIVE")}
                    style={[
                      styles.toggleBtn,
                      enquiryType === "TEST_DRIVE" && styles.toggleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        enquiryType === "TEST_DRIVE" && styles.toggleTextActive,
                      ]}
                    >
                      Book Test Drive
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEnquiryType("PRICE_QUOTE")}
                    style={[
                      styles.toggleBtn,
                      enquiryType === "PRICE_QUOTE" && styles.toggleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        enquiryType === "PRICE_QUOTE" && styles.toggleTextActive,
                      ]}
                    >
                      Price Quote
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Your Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Ramesh Kumar"
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Preferred Time / Notes</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Weekend doorstep visit"
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                <Button
                  title={
                    enquiryType === "TEST_DRIVE"
                      ? "Confirm Test Drive Booking"
                      : "Request Price Breakdown"
                  }
                  onPress={handleSubmit}
                  isLoading={isLoading}
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
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: "#94A3B8",
  },
  body: {
    padding: 20,
  },
  form: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 4,
    marginBottom: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  submitBtn: {
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 11,
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 24,
    color: "#059669",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  successDesc: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  refBox: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  refText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#475569",
  },
});

