import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Linking,
  Platform,
} from "react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { CarsScreen } from "../screens/CarsScreen";
import { CompareScreen } from "../screens/CompareScreen";
import { GroupsScreen } from "../screens/GroupsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { NotificationCenterModal } from "../screens/NotificationCenterModal";
import { Header } from "../components/Header";
import { useCompare } from "../context/CompareContext";
import { NetworkStatusBanner } from "../components/NetworkStatusBanner";
import { SecureStorage } from "../services/storage";
import {
  NotificationService,
  NotificationDeepLinkTarget,
} from "../services/notificationService";
import { createCustomerApiClient } from "@groupdrive/api-client";
import { ENV } from "../config/env";
import { colors } from "../theme/tokens";

export type TabType = "home" | "explore" | "compare" | "groups" | "profile";
type AppFlow = "splash" | "onboarding" | "main";

const customerApi = createCustomerApiClient();

export function RootNavigator() {
  const [flow, setFlow] = useState<AppFlow>("splash");
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [profileInitialTab, setProfileInitialTab] = useState<any>("OVERVIEW");
  const { comparedVehicles } = useCompare();

  // Load unread count on startup
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await customerApi.notifications.getNotifications();
        if (isMounted && res.data) {
          const unread = res.data.filter((n) => !n.is_read).length;
          setUnreadNotifsCount(unread);
        }
      } catch {
        // graceful offline fallback
      }
    };

    fetchUnread();

    const unsubscribe = NotificationService.addListener((notification) => {
      if (isMounted) {
        setUnreadNotifsCount((prev) => prev + 1);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Deep linking handler: parses URLs like groupdrive://explore, groupdrive://compare
  const handleDeepLink = useCallback((url: string | null) => {
    if (!url) return;
    try {
      const parsed = url.replace(`${ENV.SCHEME}://`, "").toLowerCase();
      const path = parsed.split("?")[0].replace(/^\//, "");

      setFlow("main");
      if (path === "notifications" || path === "alerts") {
        setNotificationModalVisible(true);
      } else if (path === "home" || path === "") {
        setActiveTab("home");
      } else if (path === "explore" || path === "cars" || path.startsWith("cars/")) {
        setActiveTab("explore");
      } else if (path === "compare") {
        setActiveTab("compare");
      } else if (path === "groups" || path === "group-buying" || path.startsWith("groups/")) {
        setActiveTab("groups");
      } else if (path === "profile" || path === "account" || path === "dashboard") {
        setActiveTab("profile");
      }
    } catch (err) {
      console.warn("Failed to parse deep link URL:", url, err);
    }
  }, []);

  const handleNavigateTarget = useCallback((target: NotificationDeepLinkTarget) => {
    if (target.tab === "profile") {
      if (target.subTab) {
        setProfileInitialTab(target.subTab);
      }
      setActiveTab("profile");
    } else if (target.tab === "groups") {
      setActiveTab("groups");
    } else if (target.tab === "explore") {
      setActiveTab("explore");
    } else if (target.tab === "compare") {
      setActiveTab("compare");
    } else {
      setActiveTab("home");
    }
  }, []);

  const handleSplashFinish = async () => {
    try {
      const hasSeen = await SecureStorage.getItem("gd_has_seen_onboarding");
      if (hasSeen === "true") {
        setFlow("main");
      } else {
        setFlow("onboarding");
      }
    } catch {
      setFlow("main");
    }
  };

  useEffect(() => {
    // 1. Initial cold-start URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // 2. Runtime background/foreground URL listener
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  const handleNavigate = (tabName: string) => {
    if (tabName === "cars") {
      setActiveTab("explore");
    } else if (
      tabName === "home" ||
      tabName === "explore" ||
      tabName === "compare" ||
      tabName === "groups" ||
      tabName === "profile"
    ) {
      setActiveTab(tabName as TabType);
    }
  };

  // Render Splash Screen
  if (flow === "splash") {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Render Onboarding Screen
  if (flow === "onboarding") {
    return <OnboardingScreen onComplete={() => setFlow("main")} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={handleNavigate} />;
      case "explore":
        return (
          <CarsScreen
            onNavigateToGroups={() => setActiveTab("groups")}
            onNavigateToCompare={() => setActiveTab("compare")}
          />
        );
      case "compare":
        return (
          <CompareScreen
            onNavigateToExplore={() => setActiveTab("explore")}
            onNavigateToGroups={() => setActiveTab("groups")}
          />
        );
      case "groups":
        return <GroupsScreen />;
      case "profile":
        return <ProfileScreen initialTab={profileInitialTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Offline Status Banner */}
      <NetworkStatusBanner />

      {/* Top Header */}
      <Header
        city={selectedCity}
        subtitle="Automotive Marketplace"
        unreadNotificationsCount={unreadNotifsCount}
        onNotificationPress={() => setNotificationModalVisible(true)}
        onCityPress={() => {
          const cities = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune"];
          const nextIdx = (cities.indexOf(selectedCity) + 1) % cities.length;
          setSelectedCity(cities[nextIdx]);
        }}
      />

      {/* Main Screen Body */}
      <View style={styles.screenBody}>{renderScreen()}</View>

      {/* In-App Notification Center Modal */}
      <NotificationCenterModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        onNavigateToTarget={handleNavigateTarget}
        onUnreadCountChange={setUnreadNotifsCount}
      />

      {/* Bottom Tab Navigation Bar with 5 tabs */}
      <View style={styles.tabBar}>
        {/* 1. Home */}
        <TouchableOpacity
          onPress={() => setActiveTab("home")}
          style={[styles.tabItem, activeTab === "home" && styles.tabItemActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === "home" && styles.tabIconActive]}>
            ⌂
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "home" && styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Explore */}
        <TouchableOpacity
          onPress={() => setActiveTab("explore")}
          style={[styles.tabItem, activeTab === "explore" && styles.tabItemActive]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "explore" && styles.tabIconActive,
            ]}
          >
            ◎
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "explore" && styles.tabLabelActive,
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>

        {/* 3. Compare */}
        <TouchableOpacity
          onPress={() => setActiveTab("compare")}
          style={[styles.tabItem, activeTab === "compare" && styles.tabItemActive]}
          activeOpacity={0.7}
        >
          <View style={styles.iconWithBadge}>
            <Text
              style={[
                styles.tabIcon,
                activeTab === "compare" && styles.tabIconActive,
              ]}
            >
              ⇄
            </Text>
            {comparedVehicles.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{comparedVehicles.length}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "compare" && styles.tabLabelActive,
            ]}
          >
            Compare
          </Text>
        </TouchableOpacity>

        {/* 4. Group Buying */}
        <TouchableOpacity
          onPress={() => setActiveTab("groups")}
          style={[styles.tabItem, activeTab === "groups" && styles.tabItemActive]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "groups" && styles.tabIconActive,
            ]}
          >
            👥
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "groups" && styles.tabLabelActive,
            ]}
          >
            Groups
          </Text>
        </TouchableOpacity>

        {/* 5. Profile */}
        <TouchableOpacity
          onPress={() => setActiveTab("profile")}
          style={[styles.tabItem, activeTab === "profile" && styles.tabItemActive]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabIcon,
              activeTab === "profile" && styles.tabIconActive,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "profile" && styles.tabLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screenBody: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
    paddingBottom: Platform.OS === "ios" ? 4 : 2,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemActive: {
    // subtle active feedback
  },
  iconWithBadge: {
    position: "relative",
  },
  tabIcon: {
    fontSize: 18,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 2,
  },
  tabIconActive: {
    color: colors.velocity || "#2563EB",
    fontWeight: "bold",
  },
  countBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.velocity || "#2563EB",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  tabLabelActive: {
    color: colors.velocity || "#2563EB",
    fontWeight: "800",
  },
});
