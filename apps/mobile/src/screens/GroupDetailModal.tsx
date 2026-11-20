import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { formatINR, formatDate } from "@groupdrive/utils";
import { customerApi } from "@groupdrive/api-client";
import {
  PublicBuyerGroupItem,
  PublicBuyerGroupDetail,
  PublicDealerOffer,
  GroupActivityEvent,
} from "@groupdrive/types";
import { JoinGroupModal } from "./JoinGroupModal";
import { EnquiryModal } from "./EnquiryModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  onGroupUpdated?: () => void;
}

export function GroupDetailModal({
  visible,
  onClose,
  groupId,
  onGroupUpdated,
}: Props) {
  const [group, setGroup] = useState<PublicBuyerGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Enquiry modal state
  const [enquiryDealer, setEnquiryDealer] = useState<{
    brand: string;
    model: string;
    dealerName?: string;
    type: "TEST_DRIVE" | "PRICE_QUOTE";
  } | null>(null);

  const loadGroupDetails = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const res = await customerApi.groups.getGroupDetails(groupId);
      if (res.data) {
        setGroup(res.data);
      }
    } catch (err) {
      console.error("Failed to load group details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (visible && groupId) {
      loadGroupDetails();
    }
  }, [visible, groupId, loadGroupDetails]);

  const handleWithdraw = async () => {
    Alert.alert(
      "Withdraw from Group",
      "Are you sure you want to withdraw from this buyer cluster? You can rejoin at any time before the cluster locks.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            setIsWithdrawing(true);
            try {
              const res = await customerApi.groups.leaveGroup(groupId);
              if (res.success) {
                setWithdrawNotice("You have successfully withdrawn from this buyer cluster.");
                loadGroupDetails();
                if (onGroupUpdated) onGroupUpdated();
                setTimeout(() => setWithdrawNotice(null), 4000);
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to withdraw from group.");
            } finally {
              setIsWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  const currentCount = group?.current_members_count || 0;
  const maxCap = group?.max_capacity || 10;
  const minThresh = group?.min_members_threshold || 5;
  const isThresholdMet = currentCount >= minThresh;
  const progressRatio = Math.min(1, currentCount / maxCap);
  const percentFilled = Math.min(100, Math.round((currentCount / maxCap) * 100));
  const remainingSlots = Math.max(0, maxCap - currentCount);
  const hasJoined = Boolean(group?.user_participation?.has_joined);
  const dealerOffers: PublicDealerOffer[] = group?.dealer_offers || [];
  const activityTimeline: GroupActivityEvent[] = group?.activity_timeline || [];
  const savings = group?.estimated_savings_inr || 45000;

  // 5-Stage Lifecycle calculation
  let activeStageIndex = 0;
  if (group?.status === "COMPLETED") activeStageIndex = 4;
  else if (group?.status === "LOCKED") activeStageIndex = 3;
  else if (group?.status === "QUOTATION_REVIEW") activeStageIndex = 2;
  else if (group?.status === "OPEN_FOR_QUOTES" || isThresholdMet) activeStageIndex = 1;
  else activeStageIndex = 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderTitleGroup}>
            <Text style={styles.topHeaderBrand}>{group?.brand_name || "Vehicle Cluster"}</Text>
            <Text style={styles.topHeaderCode}>{group?.group_code || "GD-CLUSTER"}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Connecting to authorized dealer network...</Text>
          </View>
        ) : !group ? (
          <View style={styles.centerLoading}>
            <Text style={styles.errorTitle}>Buyer Group Not Found</Text>
            <Text style={styles.errorSubtitle}>
              This collective opportunity may have expired or is unavailable.
            </Text>
            <Button title="Close" onPress={onClose} variant="dark" style={{ marginTop: 12 }} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* ===================================================================
                1. HERO STAGE
                =================================================================== */}
            <View style={styles.heroContainer}>
              <Image
                source={{
                  uri:
                    group.model_image_url ||
                    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200",
                }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />

              <View style={styles.heroTopBadges}>
                <Badge
                  label={`${group.city} Metro • ${group.rto_circle}`}
                  variant="secondary"
                  size="sm"
                />
                <Badge
                  label={
                    group.status === "OPEN_FOR_QUOTES"
                      ? "Reverse Auction Active"
                      : group.status === "QUOTATION_REVIEW"
                      ? "Proposals Under Review"
                      : "Forming Quota"
                  }
                  variant={
                    group.status === "OPEN_FOR_QUOTES"
                      ? "emerald"
                      : group.status === "QUOTATION_REVIEW"
                      ? "velocity"
                      : "amber"
                  }
                  size="sm"
                />
              </View>

              <View style={styles.heroBottomContent}>
                <Text style={styles.heroModelName}>{group.model_name}</Text>
                <Text style={styles.heroSubText}>
                  Authorized OEM Invoicing • Fulfillment via Certified Showrooms
                </Text>
              </View>
            </View>

            {/* Withdraw Notice Banner */}
            {withdrawNotice && (
              <View style={styles.withdrawBanner}>
                <Text style={styles.withdrawBannerText}>{withdrawNotice}</Text>
              </View>
            )}

            {/* ===================================================================
                2. KEY METRICS GRID
                =================================================================== */}
            <View style={styles.metricsGrid}>
              {/* Target Savings */}
              <View style={[styles.metricCard, styles.savingsMetricCard]}>
                <Text style={styles.metricLabelEmerald}>Target Group Savings</Text>
                <Text style={styles.metricValueEmerald}>{formatINR(savings, { compact: true })}</Text>
                <Text style={styles.metricNoteEmerald}>Applied on showroom invoice</Text>
              </View>

              {/* Cluster Quota */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Cluster Quota</Text>
                <Text style={styles.metricValue}>
                  {currentCount} / {maxCap}
                </Text>
                <Text style={styles.metricNote}>
                  {isThresholdMet ? "✓ Quota Trigger Met" : `Need ${minThresh - currentCount} more`}
                </Text>
              </View>

              {/* Purchasing Jurisdiction */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Purchasing Region</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {group.city}
                </Text>
                <Text style={styles.metricNote} numberOfLines={1}>
                  RTO: {group.rto_circle}
                </Text>
              </View>

              {/* Bidding Window */}
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Bidding Window</Text>
                <Text style={styles.metricValueSmall}>
                  {group.quoting_deadline ? formatDate(group.quoting_deadline) : "Open Window"}
                </Text>
                <Text style={styles.metricNote}>
                  Handover: ~{group.target_delivery_window_days} Days
                </Text>
              </View>
            </View>

            {/* ===================================================================
                3. DEMAND PROGRESS BAR
                =================================================================== */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressTitle}>
                  Demand Aggregation Progress ({currentCount} of {maxCap} Buyers)
                </Text>
                <Text style={styles.progressPercent}>{percentFilled}%</Text>
              </View>

              <ProgressBar progress={progressRatio} />

              <View style={styles.progressFooterRow}>
                <Text style={styles.progressSubtext}>
                  {isThresholdMet
                    ? "✓ Reverse dealer bidding is currently active."
                    : `${minThresh - currentCount} more buyers required to unlock dealer bidding.`}
                </Text>
                <Text style={styles.progressRemaining}>
                  {remainingSlots} Slots Left
                </Text>
              </View>
            </View>

            {/* ===================================================================
                4. CUSTOMER PARTICIPATION STATUS / JOIN CTA
                =================================================================== */}
            <View style={styles.participationContainer}>
              {hasJoined ? (
                <View style={styles.joinedBanner}>
                  <View style={styles.joinedHeader}>
                    <View style={styles.joinedDot} />
                    <Text style={styles.joinedTitle}>Active Membership Confirmed</Text>
                  </View>
                  <Text style={styles.joinedText}>
                    You are participating in this {group.city} buyer cluster. Dealership reverse quotes will appear here automatically.
                  </Text>
                  <View style={styles.joinedMetaRow}>
                    <Text style={styles.joinedMetaItem}>
                      Variant: {group.user_participation?.preferred_variant || "Standard"}
                    </Text>
                    {group.user_participation?.preferred_colour && (
                      <Text style={styles.joinedMetaItem}>
                        Colour: {group.user_participation.preferred_colour}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.withdrawBtn}
                    onPress={handleWithdraw}
                    disabled={isWithdrawing}
                  >
                    <Text style={styles.withdrawBtnText}>
                      {isWithdrawing ? "Withdrawing..." : "Withdraw from Group"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.joinPromptBox}>
                  <View style={styles.joinPromptTexts}>
                    <Text style={styles.joinPromptTitle}>100% Free Collective Participation</Text>
                    <Text style={styles.joinPromptDesc}>
                      Zero advance payment required. Review competitive dealer bids before making a purchase decision.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.joinPrimaryBtn}
                    onPress={() => setIsJoinOpen(true)}
                  >
                    <Text style={styles.joinPrimaryBtnText}>
                      Join Group (Save {formatINR(savings, { compact: true })})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ===================================================================
                5. FIVE-STAGE LIFECYCLE ROADMAP
                =================================================================== */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Badge label="Collective Lifecycle" variant="velocity" size="sm" />
                <Text style={styles.sectionTitle}>Group Buying Roadmap</Text>
                <Text style={styles.sectionSubtitle}>
                  Transparent progression from demand clustering to dealer bidding and delivery.
                </Text>
              </View>

              <View style={styles.stagesList}>
                {[
                  {
                    stage: 1,
                    title: "Cluster Formation",
                    desc: `Buyers pool demand. Reaching ${minThresh} members triggers dealer reverse auction.`,
                  },
                  {
                    stage: 2,
                    title: "Reverse Auction (DealerOS)",
                    desc: `Authorized dealers in ${group.city} submit competitive fleet discounts.`,
                  },
                  {
                    stage: 3,
                    title: "Quotation Review",
                    desc: "Cluster members review itemized dealer discounts and delivery timelines.",
                  },
                  {
                    stage: 4,
                    title: "Allocation Lock",
                    desc: "Winning dealer commits ready stockyard units or priority factory dispatch.",
                  },
                  {
                    stage: 5,
                    title: "Showroom Delivery",
                    desc: "Members complete registration and take direct vehicle delivery at the showroom.",
                  },
                ].map((stg, sIdx) => {
                  const isCurrent = activeStageIndex === sIdx;
                  const isPast = activeStageIndex > sIdx;

                  return (
                    <View key={stg.stage} style={styles.stageItem}>
                      <View style={styles.stageNumCol}>
                        <View
                          style={[
                            styles.stageCircle,
                            isPast && styles.stageCirclePast,
                            isCurrent && styles.stageCircleCurrent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageCircleText,
                              (isPast || isCurrent) && styles.stageCircleTextActive,
                            ]}
                          >
                            {isPast ? "✓" : stg.stage}
                          </Text>
                        </View>
                        {sIdx < 4 && <View style={styles.stageLine} />}
                      </View>

                      <View style={styles.stageContentCol}>
                        <View style={styles.stageTitleRow}>
                          <Text style={styles.stageTitleText}>{stg.title}</Text>
                          <Badge
                            label={isPast ? "Achieved" : isCurrent ? "Active Now" : "Upcoming"}
                            variant={isPast ? "emerald" : isCurrent ? "velocity" : "secondary"}
                            size="sm"
                          />
                        </View>
                        <Text style={styles.stageDescText}>{stg.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ===================================================================
                6. DEALER OFFERS & REVERSE BIDDING
                =================================================================== */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <View style={styles.offerHeaderRow}>
                  <View>
                    <Badge label="DealerOS Marketplace" variant="emerald" size="sm" />
                    <Text style={styles.sectionTitle}>Participating Dealer Offers</Text>
                  </View>
                  {dealerOffers.length >= 2 && (
                    <TouchableOpacity
                      style={[
                        styles.compareOffersBtn,
                        showComparison && styles.compareOffersBtnActive,
                      ]}
                      onPress={() => setShowComparison(!showComparison)}
                    >
                      <Text
                        style={[
                          styles.compareOffersBtnText,
                          showComparison && styles.compareOffersBtnTextActive,
                        ]}
                      >
                        {showComparison ? "Hide Comparison" : "Compare Offers"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.sectionSubtitle}>
                  Real competitive proposals submitted by verified OEM showrooms for this cluster.
                </Text>
              </View>

              {dealerOffers.length === 0 ? (
                <View style={styles.emptyOffersBox}>
                  <Text style={styles.emptyOffersTitle}>
                    Dealer Bidding Activates Once Minimum Threshold is Met
                  </Text>
                  <Text style={styles.emptyOffersDesc}>
                    Currently {currentCount} of {minThresh} required buyers have clustered in {group.city}. Once {minThresh - currentCount} more buyers join, authorized regional dealerships receive priority alerts to submit binding group quotations.
                  </Text>
                  {!hasJoined && (
                    <TouchableOpacity
                      style={styles.joinHelpBtn}
                      onPress={() => setIsJoinOpen(true)}
                    >
                      <Text style={styles.joinHelpBtnText}>Join to Help Reach Quota</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : showComparison ? (
                /* Offer Comparison Table */
                <View style={styles.comparisonTableBox}>
                  <Text style={styles.comparisonTableTitle}>Side-by-Side Offer Comparison</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.comparisonTable}>
                      {/* Metric: Dealership */}
                      <View style={styles.compRow}>
                        <Text style={styles.compLabelCol}>Dealership</Text>
                        {dealerOffers.map((off) => (
                          <View key={off.id} style={styles.compValCol}>
                            <Text style={styles.compDealerName}>{off.dealer_name}</Text>
                            <Text style={styles.compBranchName}>{off.branch_name}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Metric: Offered Discount */}
                      <View style={[styles.compRow, styles.compRowAlt]}>
                        <Text style={styles.compLabelCol}>Total Discount</Text>
                        {dealerOffers.map((off) => (
                          <View key={off.id} style={styles.compValCol}>
                            <Text style={styles.compHighlightGreen}>
                              {formatINR(off.total_discounts_inr || savings)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Metric: Handover Days */}
                      <View style={styles.compRow}>
                        <Text style={styles.compLabelCol}>Delivery Timeline</Text>
                        {dealerOffers.map((off) => (
                          <View key={off.id} style={styles.compValCol}>
                            <Text style={styles.compValText}>
                              {off.delivery_timeline_days || off.estimated_delivery_days || 14} Days
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Metric: Committed Package */}
                      <View style={[styles.compRow, styles.compRowAlt]}>
                        <Text style={styles.compLabelCol}>Committed Benefits</Text>
                        {dealerOffers.map((off) => (
                          <View key={off.id} style={styles.compValCol}>
                            <Text style={styles.compBenefitsText}>{off.proposed_benefits}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              ) : (
                /* Standard Offers List */
                <View style={styles.offersList}>
                  {dealerOffers.map((offer) => (
                    <View key={offer.id} style={styles.offerCard}>
                      <View style={styles.offerCardTop}>
                        <View style={styles.offerInfoLeft}>
                          <Badge
                            label={
                              offer.offer_type === "BINDING_QUOTATION"
                                ? "Binding Quotation"
                                : "Commercial Bid"
                            }
                            variant="emerald"
                            size="sm"
                          />
                          <Text style={styles.offerDealerName}>{offer.dealer_name}</Text>
                          <Text style={styles.offerBranchName}>{offer.branch_name}</Text>
                        </View>

                        <View style={styles.offerDiscountPill}>
                          <Text style={styles.offerDiscountLabel}>Offered Discount</Text>
                          <Text style={styles.offerDiscountVal}>
                            {formatINR(offer.total_discounts_inr || savings)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.offerBenefitsBox}>
                        <Text style={styles.offerBenefitsTitle}>Committed Dealer Package</Text>
                        <Text style={styles.offerBenefitsDesc}>{offer.proposed_benefits}</Text>
                        {offer.terms_and_conditions && (
                          <Text style={styles.offerTermsText}>
                            Terms: {offer.terms_and_conditions}
                          </Text>
                        )}
                      </View>

                      <View style={styles.offerActionsRow}>
                        <TouchableOpacity
                          style={styles.offerTestDriveBtn}
                          onPress={() =>
                            setEnquiryDealer({
                              brand: group.brand_name,
                              model: group.model_name,
                              dealerName: offer.dealer_name,
                              type: "TEST_DRIVE",
                            })
                          }
                        >
                          <Text style={styles.offerTestDriveBtnText}>Book Test Drive</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.offerQuoteBtn}
                          onPress={() =>
                            setEnquiryDealer({
                              brand: group.brand_name,
                              model: group.model_name,
                              dealerName: offer.dealer_name,
                              type: "PRICE_QUOTE",
                            })
                          }
                        >
                          <Text style={styles.offerQuoteBtnText}>Request Official Quote</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ===================================================================
                7. LIVE AUDIT TRAIL & GROUP UPDATES
                =================================================================== */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Badge label="Verifiable Audit" variant="velocity" size="sm" />
                <Text style={styles.sectionTitle}>Group Activity & Live Updates</Text>
                <Text style={styles.sectionSubtitle}>
                  Event timeline tracking group milestones and authorized dealership bids.
                </Text>
              </View>

              <View style={styles.timelineList}>
                {activityTimeline.map((item, idx) => (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeftCol}>
                      <View
                        style={[
                          styles.timelineCircle,
                          item.type === "DEALER_OFFER" && styles.timelineCircleOffer,
                          item.type === "MILESTONE" && styles.timelineCircleMilestone,
                        ]}
                      >
                        <Text style={styles.timelineCircleIcon}>
                          {item.type === "DEALER_OFFER" ? "₹" : item.type === "MILESTONE" ? "★" : "•"}
                        </Text>
                      </View>
                      {idx < activityTimeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>

                    <View style={styles.timelineRightCol}>
                      <View style={styles.timelineTitleRow}>
                        <Text style={styles.timelineTitleText}>{item.title}</Text>
                        <Text style={styles.timelineTimeText}>
                          {formatDate(item.timestamp)}
                        </Text>
                      </View>
                      <Text style={styles.timelineDescText}>{item.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ===================================================================
                8. AGGREGATED REQUIREMENTS
                =================================================================== */}
            {group.requirements && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <Badge label="Buyer Preferences" variant="secondary" size="sm" />
                  <Text style={styles.sectionTitle}>Aggregated Group Parameters</Text>
                  <Text style={styles.sectionSubtitle}>
                    Collective specifications submitted by cluster members to participating dealerships.
                  </Text>
                </View>

                <View style={styles.reqGrid}>
                  <View style={styles.reqBox}>
                    <Text style={styles.reqLabel}>Preferred Variants</Text>
                    <Text style={styles.reqVal}>
                      {group.requirements.preferred_variants?.join(", ") || "All Variants"}
                    </Text>
                  </View>

                  <View style={styles.reqBox}>
                    <Text style={styles.reqLabel}>Preferred Colours</Text>
                    <Text style={styles.reqVal}>
                      {group.requirements.preferred_colours?.join(", ") || "Flexible Colours"}
                    </Text>
                  </View>

                  <View style={styles.reqBox}>
                    <Text style={styles.reqLabel}>Fuel & Transmission</Text>
                    <Text style={styles.reqVal}>
                      {group.requirements.fuel_types?.join(", ")} •{" "}
                      {group.requirements.transmissions?.join(", ")}
                    </Text>
                  </View>

                  <View style={styles.reqBox}>
                    <Text style={styles.reqLabel}>Financing Preference</Text>
                    <Text style={styles.reqVal}>{group.requirements.financing_mix}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Transparency Note */}
            <View style={styles.transparencyNoteBox}>
              <Text style={styles.transparencyTitle}>Institutional Buying Transparency</Text>
              <Text style={styles.transparencyBody}>
                GROUPDRIVE aggregates verified consumer demand to secure fleet-tier pricing from authorized OEM dealerships. Final discounts are reflected directly on the authorized dealer invoice. No advance payment is required to join a buyer cluster.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* Join Group Modal */}
        {isJoinOpen && group && (
          <JoinGroupModal
            visible={isJoinOpen}
            onClose={() => setIsJoinOpen(false)}
            group={group}
            onSuccess={() => {
              loadGroupDetails();
              if (onGroupUpdated) onGroupUpdated();
            }}
          />
        )}

        {/* Enquiry Modal */}
        {enquiryDealer && (
          <EnquiryModal
            isOpen={!!enquiryDealer}
            onClose={() => setEnquiryDealer(null)}
            brandName={enquiryDealer.brand}
            modelName={enquiryDealer.model}
            initialEnquiryType={enquiryDealer.type}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  topHeaderTitleGroup: {
    flex: 1,
  },
  topHeaderBrand: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  topHeaderCode: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "bold",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  errorSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  scrollBody: {
    paddingBottom: 60,
  },
  // Hero
  heroContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  heroTopBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroBottomContent: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
  },
  heroModelName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroSubText: {
    fontSize: 11,
    color: "#CBD5E1",
    marginTop: 2,
  },
  withdrawBanner: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#FDE68A",
  },
  withdrawBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 8,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  savingsMetricCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  metricLabelEmerald: {
    fontSize: 10,
    fontWeight: "700",
    color: "#065F46",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  metricValueEmerald: {
    fontSize: 20,
    fontWeight: "900",
    color: "#047857",
    marginTop: 2,
  },
  metricValueSmall: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4,
  },
  metricNote: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  metricNoteEmerald: {
    fontSize: 10,
    color: "#059669",
    marginTop: 2,
  },
  // Progress
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  progressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },
  progressFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressSubtext: {
    fontSize: 10,
    color: "#64748B",
    flex: 1,
  },
  progressRemaining: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    marginLeft: 6,
  },
  // Participation
  participationContainer: {
    padding: 16,
  },
  joinedBanner: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    padding: 14,
  },
  joinedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  joinedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  joinedTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E40AF",
  },
  joinedText: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 16,
  },
  joinedMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#DBEAFE",
  },
  joinedMetaItem: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  withdrawBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  withdrawBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  joinPromptBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  joinPromptTexts: {
    gap: 2,
  },
  joinPromptTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  joinPromptDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  joinPrimaryBtn: {
    backgroundColor: "#059669",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  joinPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  // Section Box
  sectionBox: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  sectionHeader: {
    marginBottom: 12,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
  },
  // Stages List
  stagesList: {
    gap: 4,
  },
  stageItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stageNumCol: {
    alignItems: "center",
    width: 32,
    marginRight: 10,
  },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  stageCirclePast: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  stageCircleCurrent: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  stageCircleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  stageCircleTextActive: {
    color: "#FFFFFF",
  },
  stageLine: {
    width: 2,
    height: 38,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  stageContentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  stageTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stageTitleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  stageDescText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  // Offers
  offerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compareOffersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  compareOffersBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  compareOffersBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  compareOffersBtnTextActive: {
    color: "#2563EB",
  },
  emptyOffersBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyOffersTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  emptyOffersDesc: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
  joinHelpBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  joinHelpBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  offersList: {
    gap: 12,
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 10,
  },
  offerCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  offerInfoLeft: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  offerDealerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4,
  },
  offerBranchName: {
    fontSize: 11,
    color: "#64748B",
  },
  offerDiscountPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  offerDiscountLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#065F46",
    textTransform: "uppercase",
  },
  offerDiscountVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#047857",
  },
  offerBenefitsBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 4,
  },
  offerBenefitsTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  offerBenefitsDesc: {
    fontSize: 11,
    color: "#1E293B",
    lineHeight: 16,
  },
  offerTermsText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  offerActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  offerTestDriveBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  offerTestDriveBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  offerQuoteBtn: {
    flex: 1.2,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  offerQuoteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Offer Comparison Table
  comparisonTableBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  comparisonTableTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  comparisonTable: {
    borderRadius: 8,
    overflow: "hidden",
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  compRowAlt: {
    backgroundColor: "#FFFFFF",
  },
  compLabelCol: {
    width: 110,
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  compValCol: {
    width: 160,
    paddingHorizontal: 6,
  },
  compDealerName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  compBranchName: {
    fontSize: 10,
    color: "#64748B",
  },
  compHighlightGreen: {
    fontSize: 13,
    fontWeight: "900",
    color: "#059669",
  },
  compValText: {
    fontSize: 11,
    color: "#0F172A",
    fontWeight: "600",
  },
  compBenefitsText: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 14,
  },
  // Timeline
  timelineList: {
    gap: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineLeftCol: {
    alignItems: "center",
    width: 30,
    marginRight: 8,
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCircleOffer: {
    backgroundColor: "#ECFDF5",
  },
  timelineCircleMilestone: {
    backgroundColor: "#EFF6FF",
  },
  timelineCircleIcon: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  timelineRightCol: {
    flex: 1,
    paddingBottom: 12,
  },
  timelineTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineTitleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  timelineTimeText: {
    fontSize: 9,
    color: "#94A3B8",
    fontFamily: "monospace",
  },
  timelineDescText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  // Requirements
  reqGrid: {
    gap: 8,
  },
  reqBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reqLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  reqVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  // Transparency Note
  transparencyNoteBox: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  transparencyTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  transparencyBody: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
});

