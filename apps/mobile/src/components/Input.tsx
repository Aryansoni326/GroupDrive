import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors, radius, typography } from "../theme/tokens";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor="#94A3B8"
          style={[styles.input, leftIcon ? { paddingLeft: 6 } : undefined]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: colors.velocity,
    backgroundColor: "#FFFFFF",
  },
  inputWrapperError: {
    borderColor: colors.rose,
    backgroundColor: "#FFF1F2",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  leftIconContainer: {
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  rightIconContainer: {
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.velocity,
  },
  errorText: {
    fontSize: 11,
    color: colors.rose,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 2,
  },
});

