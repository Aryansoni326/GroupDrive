import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { EmptyState } from "../components/EmptyState";
import { formatINR, formatDate } from "@groupdrive/utils";
import { customerApi } from "@groupdrive/api-client";
import {
  PublicBuyerGroupItem,
  JoinedGroupDetail,
} from "@groupdrive/types";
import { JoinGroupModal } from "./JoinGroupModal";
import { GroupDetailModal } from "./GroupDetailModal";
import { colors } from "../theme/tokens";

type ScreenTab = "MARKETPLACE" | "MY_GROUPS";

export function GroupsScreen() {
  const [activeTab, setActiveTab] = useState<ScreenTab>("MARKETPLACE");
  const [groups, setGroups] = useState<PublicBuyerGroupItem[]>([]);
  const [myGroups, setMyGroups] = useState<JoinedGroupDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "FORMING">("ALL");

  // Modals state
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);
  const [joinGroupItem, setJoinGroupItem] = useState<PublicBuyerGroupItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupsRes, myGroupsRes] = await Promise.all([
        customerApi.groups.listGroups(),
        customerApi.groups.getMyGroups(),
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (myGroupsRes.data) setMyGroups(myGroupsRes.data);
    } catch (err) {
      console.error("Failed to load group buying data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract cities present in clusters
  const cities = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.city) set.add(g.city);
    });
    return ["ALL", ...Array.from(set)];
  }, [groups]);

  // Filtered Marketplace groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Status filter
      if (filterStatus === "ACTIVE" && g.status !== "OPEN_FOR_QUOTES") return false;
      if (filterStatus === "FORMING" && g.status === "OPEN_FOR_QUOTES") return false;

      // City filter
      if (selectedCity !== "ALL" && g.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesModel = g.model_name.toLowerCase().includes(query);
        const matchesBrand = g.brand_name.toLowerCase().includes(query);
        const matchesCode = g.group_code.toLowerCase().includes(query);
        if (!matchesModel && !matchesBrand && !matchesCode) return false;
      }

      return true;
    });
  }, [groups, filterStatus, selectedCity, searchQuery]);

  // Handle withdrawing from a group
  const handleWithdrawMyGroup = (groupId: string, modelName: string) => {
    Alert.alert(
      "Withdraw from Group",
      `Are you sure you want to withdraw from the ${modelName} buyer cluster?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await customerApi.groups.leaveGroup(groupId);
              if (res.success) {
                loadData();
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to withdraw.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading collective buyer pools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* =========================================================================
          TOP SEGMENT SWITCH: MARKETPLACE vs MY GROUPS
          ========================================================================= */}
      <View style={styles.topSegmentBar}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "MARKETPLACE" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("MARKETPLACE")}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === "MARKETPLACE" && styles.segmentBtnTextActive,
            ]}
          >
            Marketplace Clusters ({groups.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === "MY_GROUPS" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("MY_GROUPS")}
        >
          <View style={styles.myGroupsLabelRow}>
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === "MY_GROUPS" && styles.segmentBtnTextActive,
              ]}
            >
              My Joined Groups
            </Text>
            {myGroups.length > 0 && (
              <View style={styles.myGroupsBadge}>
                <Text style={styles.myGroupsBadgeText}>{myGroups.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* =========================================================================
          MARKETPLACE TAB CONTENT
          ========================================================================= */}
      {activeTab === "MARKETPLACE" ? (
        <ScrollView
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Subtitle */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Collective Buying Marketplace</Text>
            <Text style={styles.pageSubtitle}>
              Aggregate demand with other verified buyers to unlock institutional OEM dealership discounts.
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by vehicle model or cluster code..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills: Bidding Status */}
          <View style={styles.statusFilterRow}>
            <TouchableOpacity
              style={[styles.statusPill, filterStatus === "ALL" && styles.statusPillActive]}
              onPress={() => setFilterStatus("ALL")}
            >
              <Text style={[styles.statusPillText, filterStatus === "ALL" && styles.statusPillTextActive]}>
                All Clusters ({groups.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusPill, filterStatus === "ACTIVE" && styles.statusPillActive]}
              onPress={() => setFilterStatus("ACTIVE")}
            >
              <Text style={[styles.statusPillText, filterStatus === "ACTIVE" && styles.statusPillTextActive]}>
                Reverse Bidding Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusPill, filterStatus === "FORMING" && styles.statusPillActive]}
              onPress={() => setFilterStatus("FORMING")}
            >
              <Text style={[styles.statusPillText, filterStatus === "FORMING" && styles.statusPillTextActive]}>
                Forming Quota
              </Text>
            </TouchableOpacity>
          </View>

          {/* City Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.citiesScroll}
          >
            {cities.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[styles.cityPill, isSelected && styles.cityPillActive]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text style={[styles.cityPillText, isSelected && styles.cityPillTextActive]}>
                    {city === "ALL" ? "All Cities" : city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Group Cards List */}
          {filteredGroups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No Matching Buyer Pools"
              description="No active buyer groups found for the selected filters. Try switching filters or view all clusters."
              actionLabel="Reset Filters"
              onAction={() => {
                setFilterStatus("ALL");
                setSelectedCity("ALL");
                setSearchQuery("");
              }}
            />
          ) : (
            filteredGroups.map((grp) => {
              const progressRatio = Math.min(1, grp.current_members_count / grp.max_capacity);
              const isThresholdMet = grp.current_members_count >= grp.min_members_threshold;
              const isBiddingActive = grp.status === "OPEN_FOR_QUOTES";
              const remainingSlots = Math.max(0, grp.max_capacity - grp.current_members_count);

              return (
                <Card key={grp.id} style={styles.groupCard}>
                  {/* Hero Vehicle Image */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setDetailGroupId(grp.id)}
                    style={styles.cardImageContainer}
                  >
                    <Image
                      source={{
                        uri:
                          grp.model_image_url ||
                          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
                      }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.cardOverlayGradient} />

                    {/* Top Badges */}
                    <View style={styles.cardTopBadges}>
                      <Badge
                        label={`${grp.city} • ${grp.rto_circle}`}
                        variant="secondary"
                        size="sm"
                      />
                      <Badge
                        label={isBiddingActive ? "Dealers Bidding Now" : "Forming Cluster"}
                        variant={isBiddingActive ? "emerald" : "velocity"}
                        size="sm"
                      />
                    </View>

                    {/* Deadline Pill */}
                    {grp.quoting_deadline && (
                      <View style={styles.deadlineBadge}>
                        <Text style={styles.deadlineBadgeText}>
                          Deadline: {formatDate(grp.quoting_deadline)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Card Content Body */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardBrandText}>{grp.brand_name}</Text>
                        <Text style={styles.cardModelTitle}>{grp.model_name}</Text>
                        <Text style={styles.cardCodeText}>Code: {grp.group_code}</Text>
                      </View>

                      {/* Target Savings Pill */}
                      <View style={styles.savingsPill}>
                        <Text style={styles.savingsLabelText}>Target Savings</Text>
                        <Text style={styles.savingsAmountText}>
                          {formatINR(grp.estimated_savings_inr || 45000, { compact: true })}
                        </Text>
                      </View>
                    </View>

                    {/* Member Progress Bar */}
                    <View style={styles.cardProgressBox}>
                      <View style={styles.cardProgressLabelRow}>
                        <Text style={styles.cardMembersText}>
                          Capacity: {grp.current_members_count}/{grp.max_capacity} Buyers
                        </Text>
                        <Text
                          style={[
                            styles.cardStatusText,
                            { color: isThresholdMet ? "#059669" : "#D97706" },
                          ]}
                        >
                          {isThresholdMet
                            ? "✓ Minimum Quota Met"
                            : `Need ${grp.min_members_threshold - grp.current_members_count} more`}
                        </Text>
                      </View>
                      <ProgressBar progress={progressRatio} />
                      <Text style={styles.remainingText}>
                        {remainingSlots} spots remaining in this batch
                      </Text>
                    </View>

                    {/* Card Actions */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => setDetailGroupId(grp.id)}
                      >
                        <Text style={styles.detailsBtnText}>View Details & Bids</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.joinBtn}
                        onPress={() => setJoinGroupItem(grp)}
                      >
                        <Text style={styles.joinBtnText}>Join Group</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* =========================================================================
            MY GROUPS TAB CONTENT
            ========================================================================= */
        <ScrollView
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>My Joined Buyer Groups</Text>
            <Text style={styles.pageSubtitle}>
              Track reverse-bidding updates, dealership proposals, and allocation status for your demand clusters.
            </Text>
          </View>

          {myGroups.length === 0 ? (
            <EmptyState
              icon="🚗"
              title="No Groups Joined Yet"
              description="You have not joined any collective buying clusters. Join a group to unlock institutional fleet discounts with zero advance deposit."
              actionLabel="Explore Active Clusters"
              onAction={() => setActiveTab("MARKETPLACE")}
            />
          ) : (
            myGroups.map((item) => {
              const grpDetails = item.group_details;
              const modelName = grpDetails?.model_name || item.membership.model_name;
              const groupCode = grpDetails?.group_code || item.membership.group_code;
              const city = grpDetails?.city || item.membership.city;
              const savings = grpDetails?.estimated_savings_inr || 45000;

              return (
                <Card key={item.membership.id} style={styles.myGroupCard}>
                  {/* Status Strip */}
                  <View style={styles.myGroupStatusRow}>
                    <View style={styles.myGroupStatusBadge}>
                      <View style={styles.greenPulse} />
                      <Text style={styles.myGroupStatusText}>
                        {item.membership.status || "CONFIRMED MEMBERSHIP"}
                      </Text>
                    </View>
                    <Text style={styles.myGroupDateText}>
                      Joined: {formatDate(item.membership.joined_at)}
                    </Text>
                  </View>

                  {/* Main Details */}
                  <View style={styles.myGroupBody}>
                    <Text style={styles.myGroupModelTitle}>{modelName}</Text>
                    <Text style={styles.myGroupCodeText}>
                      Cluster: {groupCode} • {city} Jurisdiction
                    </Text>

                    <View style={styles.myGroupPrefsRow}>
                      <View style={styles.prefItem}>
                        <Text style={styles.prefLabel}>Selected Variant</Text>
                        <Text style={styles.prefVal}>
                          {item.membership.variant_name || "Standard Variant"}
                        </Text>
                      </View>
                      <View style={styles.prefItem}>
                        <Text style={styles.prefLabel}>Colour Choice</Text>
                        <Text style={styles.prefVal}>
                          {item.membership.colour_preference || "Flexible"}
                        </Text>
                      </View>
                    </View>

                    {/* Best Offer Callout */}
                    <View style={styles.myGroupOfferBox}>
                      <View>
                        <Text style={styles.myGroupOfferLabel}>Target Group Savings</Text>
                        <Text style={styles.myGroupOfferNote}>
                          Reverse bidding active via participating OEM showrooms
                        </Text>
                      </View>
                      <Text style={styles.myGroupOfferVal}>
                        {formatINR(savings, { compact: true })}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.myGroupActionsRow}>
                      <TouchableOpacity
                        style={styles.myGroupTrackBtn}
                        onPress={() => setDetailGroupId(grpDetails?.id || item.membership.group_id)}
                      >
                        <Text style={styles.myGroupTrackBtnText}>Track Bids & Progress</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.myGroupWithdrawBtn}
                        onPress={() =>
                          handleWithdrawMyGroup(
                            grpDetails?.id || item.membership.group_id,
                            modelName
                          )
                        }
                      >
                        <Text style={styles.myGroupWithdrawBtnText}>Withdraw</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* =========================================================================
          GROUP DETAIL MODAL
          ========================================================================= */}
      {detailGroupId && (
        <GroupDetailModal
          visible={!!detailGroupId}
          onClose={() => setDetailGroupId(null)}
          groupId={detailGroupId}
          onGroupUpdated={loadData}
        />
      )}

      {/* =========================================================================
          JOIN GROUP MODAL
          ========================================================================= */}
      {joinGroupItem && (
        <JoinGroupModal
          visible={!!joinGroupItem}
          onClose={() => setJoinGroupItem(null)}
          group={joinGroupItem}
          onSuccess={() => {
            loadData();
          }}
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
  },
  // Top Segment Switch
  topSegmentBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#0F172A",
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  segmentBtnTextActive: {
    color: "#FFFFFF",
  },
  myGroupsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  myGroupsBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  myGroupsBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollList: {
    padding: 16,
    paddingBottom: 60,
    gap: 14,
  },
  pageHeader: {
    gap: 3,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  pageSubtitle: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    padding: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "bold",
    paddingHorizontal: 4,
  },
  // Status Filter Pills
  statusFilterRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusPillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  statusPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Cities
  citiesScroll: {
    flexDirection: "row",
  },
  cityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 6,
  },
  cityPillActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  cityPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  cityPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Group Card
  groupCard: {
    overflow: "hidden",
    padding: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  cardImageContainer: {
    width: "100%",
    height: 160,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlayGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  cardTopBadges: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deadlineBadge: {
    position: "absolute",
    bottom: 8,
    left: 10,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deadlineBadgeText: {
    fontSize: 10,
    color: "#E2E8F0",
    fontWeight: "600",
  },
  cardContent: {
    padding: 14,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  cardModelTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 1,
  },
  cardCodeText: {
    fontSize: 10,
    color: "#94A3B8",
    fontFamily: "monospace",
    marginTop: 2,
  },
  savingsPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  savingsLabelText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#065F46",
    textTransform: "uppercase",
  },
  savingsAmountText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#047857",
  },
  cardProgressBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  cardProgressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardMembersText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  remainingText: {
    fontSize: 10,
    color: "#64748B",
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  joinBtn: {
    flex: 1.2,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // My Groups Card
  myGroupCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  myGroupStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  myGroupStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  myGroupStatusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
    textTransform: "uppercase",
  },
  myGroupDateText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  myGroupBody: {
    gap: 8,
  },
  myGroupModelTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  myGroupCodeText: {
    fontSize: 11,
    color: "#64748B",
  },
  myGroupPrefsRow: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 8,
    borderRadius: 8,
  },
  prefItem: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  prefVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  myGroupOfferBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  myGroupOfferLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065F46",
  },
  myGroupOfferNote: {
    fontSize: 9,
    color: "#059669",
  },
  myGroupOfferVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#047857",
  },
  myGroupActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  myGroupTrackBtn: {
    flex: 2,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  myGroupTrackBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  myGroupWithdrawBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  myGroupWithdrawBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
});
