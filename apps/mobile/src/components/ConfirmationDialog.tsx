import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { colors, radius } from "../theme/tokens";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const getConfirmStyle = () => {
    switch (variant) {
      case "danger":
        return { backgroundColor: "#DC2626" };
      case "success":
        return { backgroundColor: "#059669" };
      case "primary":
      default:
        return { backgroundColor: colors.velocity };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>{cancelLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, getConfirmStyle()]}
                  onPress={onConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

