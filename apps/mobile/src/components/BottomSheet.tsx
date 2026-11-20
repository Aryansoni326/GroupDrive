import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { colors, radius } from "../theme/tokens";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <SafeAreaView style={styles.safeArea}>
                {/* Drag Handle Bar */}
                <View style={styles.handleBar} />

                {/* Header */}
                {(title || subtitle) && (
                  <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                      {title && <Text style={styles.title}>{title}</Text>}
                      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Body Content */}
                <View style={styles.body}>{children}</View>
              </SafeAreaView>
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
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  safeArea: {
    width: "100%",
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "bold",
  },
  body: {
    padding: 20,
  },
});

