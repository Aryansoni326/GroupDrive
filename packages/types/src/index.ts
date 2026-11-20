export type RoleCode =
  | "ROLE_CUSTOMER"
  | "ROLE_DEALER_OWNER"
  | "ROLE_BRANCH_MANAGER"
  | "ROLE_SALES_MANAGER"
  | "ROLE_SALES_EXECUTIVE"
  | "ROLE_INVENTORY_MANAGER"
  | "ROLE_FINANCE_EXECUTIVE"
  | "ROLE_SUPER_ADMIN"
  | "ROLE_PLATFORM_ADMIN"
  | "ROLE_DEALER_VERIFICATION_ADMIN"
  | "ROLE_CATALOGUE_ADMIN"
  | "ROLE_SUPPORT_ADMIN";

export type DealerStaffRole =
  | "DEALER_OWNER"
  | "BRANCH_MANAGER"
  | "SALES_MANAGER"
  | "SALES_EXECUTIVE"
  | "INVENTORY_MANAGER"
  | "FINANCE_EXECUTIVE";

export type DealerKycStatus =
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export interface User {
  id: string;
  phone_number: string | null;
  email: string | null;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  roles: RoleCode[];
  dealer_id?: string | null;
  branch_id?: string | null;
  created_at: string;
}

export interface DealerBranch {
  id: string;
  dealer_id: string;
  branch_name: string;
  branch_type: "SHOWROOM_AND_SERVICE" | "SHOWROOM_ONLY" | "STOCKYARD_ONLY";
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pin_code: string;
  authorized_rto_codes: string[];
  phone_number: string;
  email?: string | null;
  operating_hours?: string | null;
  manager_id?: string | null;
  manager_name?: string | null;
  is_active: boolean;
}

export interface DealerEntity {
  id: string;
  legal_entity_name: string;
  trade_name: string;
  gstin: string;
  pan: string;
  oem_brand_franchise: string;
  registered_office_address: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  logo_url?: string | null;
  website_url?: string | null;
  description?: string | null;
  operating_hours?: string | null;
  kyc_status: DealerKycStatus;
  branches?: DealerBranch[];
  created_at: string;
}

export type StaffInvitationStatus =
  | "ACTIVE"
  | "INVITED"
  | "PENDING_ACCEPTANCE"
  | "INVITATION_REVOKED"
  | "INACTIVE";

export interface DealerStaffMember {
  id: string;
  user_id: string;
  dealer_id: string;
  branch_id?: string | null;
  designation: string;
  staff_role: DealerStaffRole;
  is_active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  branch_name?: string;
  invitation_status?: StaffInvitationStatus;
  invited_at?: string;
  invited_by?: string;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffActivityLog {
  id: string;
  dealer_id: string;
  staff_id: string;
  target_name: string;
  action:
    | "STAFF_INVITED"
    | "ROLE_CHANGED"
    | "BRANCH_REASSIGNED"
    | "STAFF_ACTIVATED"
    | "STAFF_DEACTIVATED"
    | "INVITATION_RESENT"
    | "INVITATION_REVOKED"
    | "PROFILE_UPDATED";
  details: string;
  actor_id: string;
  actor_name: string;
  actor_role: DealerStaffRole;
  timestamp: string;
}

export interface InviteStaffPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  staff_role: DealerStaffRole;
  branch_id?: string | null;
  designation: string;
}

export interface UpdateStaffPayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  staff_role?: DealerStaffRole;
  branch_id?: string | null;
  designation?: string;
}

export type InventoryStatus =
  | "IN_STOCK"
  | "IN_TRANSIT"
  | "ALLOCATED_TO_GROUP"
  | "SOLD"
  | "DELIVERED";

export interface InventoryItem {
  id: string;
  dealer_id: string;
  branch_id: string;
  branch_name?: string;
  brand_name?: string;
  variant_id: string;
  model_id?: string;
  model_name: string;
  variant_name: string;
  fuel_type: string;
  transmission_type: string;
  colour_id: string;
  colour_name: string;
  vin?: string | null;
  stock_serial_number?: string | null;
  manufacturing_month_year: string;
  status: InventoryStatus;
  stock_quantity?: number;
  days_in_yard: number;
  yard_location?: string | null;
  is_available_for_flash_sale: boolean;
  is_available_for_group_buy?: boolean;
  ex_showroom_price: number;
  vehicle_image_url?: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface InventoryHistoryLog {
  id: string;
  inventory_id: string;
  dealer_id: string;
  action:
    | "STOCK_ADDED"
    | "STATUS_CHANGED"
    | "AVAILABILITY_UPDATED"
    | "QUANTITY_UPDATED"
    | "PRICE_ADJUSTED"
    | "YARD_RELOCATED"
    | "BRANCH_TRANSFERRED"
    | "ALLOCATED_TO_GROUP";
  details: string;
  previous_state?: string | null;
  new_state?: string | null;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
}

export interface InventoryDashboardMetrics {
  total_units: number;
  in_stock: number;
  in_transit: number;
  allocated_to_group: number;
  sold_or_delivered: number;
  aging_units: number;
  total_valuation_inr: number;
  models_breakdown: Record<string, number>;
  fuel_breakdown: Record<string, number>;
}

export interface CatalogueBrand {
  id: string;
  name: string;
  country: string;
  logo_url?: string;
}

export interface CatalogueModel {
  id: string;
  brand_id: string;
  brand_name: string;
  name: string;
  body_type: string;
  seating_capacity: number;
  image_url: string;
  is_newly_launched?: boolean;
  dealer_name?: string;
}

export interface CatalogueColour {
  id: string;
  name: string;
  hex_code: string;
  is_dual_tone: boolean;
}

export interface CatalogueVariant {
  id: string;
  model_id: string;
  model_name: string;
  brand_name: string;
  name: string;
  fuel_type: string;
  transmission_type: string;
  engine_capacity_cc: number;
  engine_description: string;
  power_ps: string;
  torque_nm: string;
  arai_mileage: string;
  seating_capacity: number;
  emission_standard: string;
  official_ex_showroom_price: number;
  colours: CatalogueColour[];
}

export type GroupStatus =
  | "FORMING"
  | "OPEN_FOR_QUOTES"
  | "QUOTATION_REVIEW"
  | "LOCKED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export interface BuyerGroup {
  id: string;
  group_code: string;
  model_id: string;
  model_name: string;
  brand_name: string;
  model_image_url?: string;
  city: string;
  state: string;
  rto_circle: string;
  status: GroupStatus;
  min_members_threshold: number;
  max_capacity: number;
  current_members_count: number;
  quoting_deadline: string | null;
  expiry_at: string;
  target_delivery_window_days: number;
  created_at: string;
}

export type DealerOfferStatus =
  | "NO_OFFER"
  | "INTEREST_EXPRESSED"
  | "PROPOSAL_SUBMITTED"
  | "UNDER_NEGOTIATION"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface GroupRequirements {
  delivery_timeline_preference: string;
  preferred_variants: string[];
  preferred_colours: string[];
  fuel_types: string[];
  transmissions: string[];
  financing_mix: string;
  accessory_preferences: string[];
  delivery_location: string;
}

export interface DealerInterestSubmission {
  id: string;
  group_id: string;
  group_code: string;
  dealer_id: string;
  branch_id: string;
  branch_name: string;
  submitted_by_id: string;
  submitted_by_name: string;
  submitted_by_role: DealerStaffRole;
  status: DealerOfferStatus;
  estimated_delivery_days: number;
  stock_allocation_commitment: number;
  proposed_benefits: string;
  terms_and_conditions?: string;
  initial_response_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityHistoryLog {
  id: string;
  opportunity_id: string;
  dealer_id: string;
  action: string;
  details: string;
  actor_id: string;
  actor_name: string;
  actor_role: DealerStaffRole;
  timestamp: string;
}

export interface GroupOpportunity {
  id: string;
  group_code: string;
  model_id: string;
  model_name: string;
  brand_name: string;
  model_image_url?: string;
  city: string;
  state: string;
  rto_circle: string;
  status: GroupStatus;
  min_members_threshold: number;
  max_capacity: number;
  current_members_count: number;
  remaining_slots: number;
  quoting_deadline: string | null;
  expiry_at: string;
  target_delivery_window_days: number;
  requirements: GroupRequirements;
  my_interest?: DealerInterestSubmission | null;
  created_at: string;
}

export interface SubmitDealerInterestPayload {
  branch_id: string;
  estimated_delivery_days: number;
  stock_allocation_commitment: number;
  proposed_benefits: string;
  terms_and_conditions?: string;
  initial_response_notes?: string;
}

export interface UpdateNegotiationPayload {
  status?: DealerOfferStatus;
  estimated_delivery_days?: number;
  stock_allocation_commitment?: number;
  proposed_benefits?: string;
  terms_and_conditions?: string;
  negotiation_notes?: string;
}

export interface WithdrawInterestPayload {
  reason: string;
}

export interface OpportunitySummaryStats {
  total_opportunities: number;
  open_for_response: number;
  target_threshold_reached: number;
  my_active_responses: number;
  proposals_under_negotiation: number;
}

export type QuotationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "REVISED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED_BY_DEALER";

export interface QuotationItem {
  id?: string;
  variant_id: string;
  variant_name?: string;
  ex_showroom_price: number;
  rto_road_tax: number;
  insurance_amount: number;
  fastag_charges: number;
  tcs_amount: number;
  accessories_package_cost: number;
  extended_warranty_cost: number;
  oem_consumer_scheme_discount: number;
  dealer_exclusive_group_discount: number;
  net_payable_amount: number;
}

export interface QuotationPricingBreakdown {
  ex_showroom_price: number;
  rto_road_tax: number;
  insurance_amount: number;
  fastag_charges: number;
  tcs_amount: number;
  accessories_amount: number;
  extended_warranty_amount: number;
  other_charges: number;
  gross_on_road_price: number;
  dealer_discount: number;
  manufacturer_offer: number;
  exchange_bonus: number;
  total_discounts: number;
  final_on_road_price: number;
}

export interface QuotationHistoryEntry {
  id: string;
  quotation_id: string;
  action: string;
  details: string;
  actor_id: string;
  actor_name: string;
  actor_role: DealerStaffRole;
  timestamp: string;
}

export interface DealerQuotation {
  id: string;
  quotation_number?: string;
  group_id?: string | null;
  group_code?: string | null;
  lead_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_city?: string | null;
  model_id?: string;
  model_name?: string;
  variant_id?: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour?: string;
  city?: string;
  dealer_id: string;
  branch_id: string;
  branch_name?: string;
  total_group_discount: number;
  net_on_road_price: number;
  pricing?: QuotationPricingBreakdown;
  delivery_timeline_days: number;
  dealership_terms?: string | null;
  quotation_status: QuotationStatus;
  valid_until: string;
  version?: number;
  items?: QuotationItem[];
  history?: QuotationHistoryEntry[];
  created_by_id?: string;
  created_by_name?: string;
  created_by_role?: DealerStaffRole;
  created_at: string;
  updated_at?: string;
}

export interface CreateQuotationPayload {
  branch_id: string;
  lead_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_city?: string | null;
  group_id?: string | null;
  group_code?: string | null;
  model_id: string;
  model_name: string;
  variant_id: string;
  variant_name: string;
  fuel_type?: string;
  transmission?: string;
  colour?: string;
  ex_showroom_price: number;
  rto_road_tax?: number;
  insurance_amount?: number;
  fastag_charges?: number;
  tcs_amount?: number;
  accessories_amount?: number;
  extended_warranty_amount?: number;
  other_charges?: number;
  dealer_discount?: number;
  manufacturer_offer?: number;
  exchange_bonus?: number;
  delivery_timeline_days: number;
  valid_until: string;
  dealership_terms?: string;
  status?: QuotationStatus;
}

export interface UpdateQuotationPayload {
  branch_id?: string;
  lead_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_city?: string | null;
  group_id?: string | null;
  group_code?: string | null;
  model_id?: string;
  model_name?: string;
  variant_id?: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour?: string;
  ex_showroom_price?: number;
  rto_road_tax?: number;
  insurance_amount?: number;
  fastag_charges?: number;
  tcs_amount?: number;
  accessories_amount?: number;
  extended_warranty_amount?: number;
  other_charges?: number;
  dealer_discount?: number;
  manufacturer_offer?: number;
  exchange_bonus?: number;
  delivery_timeline_days?: number;
  valid_until?: string;
  dealership_terms?: string;
  status?: QuotationStatus;
  revision_notes?: string;
}

export interface CalculatePricingRequest {
  ex_showroom_price: number;
  rto_road_tax?: number;
  insurance_amount?: number;
  fastag_charges?: number;
  tcs_amount?: number;
  accessories_amount?: number;
  extended_warranty_amount?: number;
  other_charges?: number;
  dealer_discount?: number;
  manufacturer_offer?: number;
  exchange_bonus?: number;
}

export interface QuotationSummaryStats {
  total_quotations: number;
  draft_count: number;
  submitted_count: number;
  accepted_count: number;
  rejected_count: number;
  expired_count: number;
  total_pipeline_value: number;
}

export type CampaignType =
  | "CASH_DISCOUNT"
  | "ACCESSORY_BUNDLE"
  | "EXTENDED_WARRANTY"
  | "EXCHANGE_BONUS"
  | "LOW_INTEREST_FINANCE"
  | "VOLUME_TIER_DISCOUNT"
  | "AGING_STOCK_CLEARANCE"
  | "ACCESSORY_BUNDLE_OFFER";

export type CampaignStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "PAUSED" | "DRAFT";

export type CampaignOrigin = "DEALER" | "GROUPDRIVE_ADMIN";

export interface CampaignOfferDetails {
  discount_amount?: number;
  free_accessories_description?: string;
  warranty_years?: number;
  exchange_bonus_amount?: number;
  interest_rate_pct?: number;
  min_group_size?: number;
  terms_and_conditions?: string;
}

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  enquiries_generated: number;
  test_drives_booked: number;
  bookings_converted: number;
  conversion_rate_pct: number;
}

export interface CampaignHistoryLog {
  id: string;
  campaign_id: string;
  dealer_id: string;
  action: string;
  details: string;
  actor_id: string;
  actor_name: string;
  actor_role: DealerStaffRole;
  timestamp: string;
}

export interface DealerCampaign {
  id: string;
  campaign_code: string;
  dealer_id: string;
  branch_id: string | null; // null = all dealership branches
  branch_name?: string;
  title: string;
  description: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  eligible_models: string[];
  eligible_variants: string[];
  offer_details: CampaignOfferDetails;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_sponsored: boolean;
  sponsored_label?: string;
  origin: CampaignOrigin;
  performance?: CampaignPerformance;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  min_group_size?: number;
  flat_discount_amount?: number;
  extended_warranty_years?: number;
  models_targeted?: string[];
}

export interface CreateCampaignPayload {
  title: string;
  description: string;
  branch_id?: string | null;
  campaign_type: CampaignType;
  eligible_models: string[];
  eligible_variants?: string[];
  offer_details: CampaignOfferDetails;
  valid_from: string;
  valid_until: string;
  is_sponsored?: boolean;
  sponsored_label?: string;
  status?: CampaignStatus;
}

export interface UpdateCampaignPayload {
  title?: string;
  description?: string;
  branch_id?: string | null;
  campaign_type?: CampaignType;
  eligible_models?: string[];
  eligible_variants?: string[];
  offer_details?: CampaignOfferDetails;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  is_sponsored?: boolean;
  sponsored_label?: string;
  status?: CampaignStatus;
  revision_notes?: string;
}

export interface CampaignSummaryStats {
  total_campaigns: number;
  active_count: number;
  scheduled_count: number;
  expired_count: number;
  paused_count: number;
  total_enquiries_generated: number;
  total_bookings_converted: number;
}

export type LeadFulfillmentStatus =
  | "VOUCHER_ISSUED"
  | "DEALERSHIP_CONTACTED"
  | "TEST_DRIVE_SCHEDULED"
  | "FINANCE_SUBMITTED"
  | "INVOICED"
  | "DELIVERED"
  | "CANCELLED";

export interface CustomerLead {
  id: string;
  booking_voucher_code: string;
  group_id: string;
  group_code: string;
  model_name: string;
  variant_name: string;
  colour_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  rto_code: string;
  final_locked_on_road_price: number;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  fulfillment_status: LeadFulfillmentStatus;
  created_at: string;
}

// DealerOS Dashboard Domain Models
export type EnquiryStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "CONVERTED";
export type EnquirySource = "WEBSITE" | "GROUP_PURCHASE" | "WALK_IN" | "PHONE_IN";

export interface DealerEnquiry {
  id: string;
  dealer_id: string;
  branch_id: string;
  branch_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  interested_model: string;
  interested_variant?: string;
  source: EnquirySource;
  status: EnquiryStatus;
  assigned_to_id?: string;
  assigned_to_name?: string;
  notes?: string;
  created_at: string;
}

export type FollowUpPriority = "HIGH" | "MEDIUM" | "LOW";
export type FollowUpStatus = "PENDING" | "COMPLETED" | "OVERDUE" | "CANCELLED";
export type FollowUpType =
  | "CALL"
  | "TEST_DRIVE"
  | "HOME_VISIT"
  | "DOCUMENTATION"
  | "PAYMENT"
  | "SHOWROOM_VISIT";

export interface DealerFollowUp {
  id: string;
  dealer_id: string;
  branch_id: string;
  branch_name?: string;
  enquiry_id?: string;
  lead_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  interested_model?: string;
  scheduled_at: string;
  follow_up_type: FollowUpType;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  assigned_to_id: string;
  assigned_to_name: string;
  notes: string;
  reminder_at?: string;
  reminder_minutes_before?: number;
  completion_notes?: string;
  completed_at?: string;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "NO_SHOW";

export type AppointmentType =
  | "SHOWROOM_VISIT"
  | "TEST_DRIVE"
  | "PRICE_NEGOTIATION"
  | "VEHICLE_DELIVERY"
  | "DOCUMENT_SIGNING";

export type AppointmentVisitOutcome =
  | "TEST_DRIVE_TAKEN"
  | "BOOKING_CONFIRMED"
  | "QUOTATION_ISSUED"
  | "FOLLOW_UP_REQUIRED"
  | "NOT_INTERESTED"
  | "NO_SHOW";

export interface DealerAppointment {
  id: string;
  dealer_id: string;
  branch_id: string;
  branch_name?: string;
  lead_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  interested_model?: string;
  appointment_type: AppointmentType;
  appointment_time: string;
  duration_minutes: number;
  assigned_to_id: string;
  assigned_to_name: string;
  assigned_to_role?: string;
  status: AppointmentStatus;
  notes?: string;
  reschedule_reason?: string;
  cancel_reason?: string;
  visit_outcome?: AppointmentVisitOutcome;
  outcome_notes?: string;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpSummaryMetrics {
  today_count: number;
  overdue_count: number;
  upcoming_count: number;
  completed_count: number;
  my_tasks_count: number;
  team_tasks_count: number;
}

export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface DealerTask {
  id: string;
  dealer_id: string;
  branch_id: string;
  assigned_to_id: string;
  assigned_to_name?: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  related_entity_type?: "LEAD" | "INVENTORY" | "QUOTATION" | "BRANCH";
  related_entity_id?: string;
  created_at: string;
}

export interface DealerActivity {
  id: string;
  dealer_id: string;
  branch_id?: string;
  branch_name?: string;
  actor_id: string;
  actor_name: string;
  actor_role: DealerStaffRole;
  action: string;
  description: string;
  entity_type: "ENQUIRY" | "LEAD" | "INVENTORY" | "QUOTATION" | "CAMPAIGN" | "TASK";
  entity_id: string;
  created_at: string;
}

export interface StaffSalesPerformance {
  staff_id: string;
  staff_name: string;
  role: DealerStaffRole;
  branch_id: string;
  branch_name: string;
  enquiries_assigned: number;
  leads_converted: number;
  conversion_rate: number;
  revenue_generated: number;
  target_units: number;
  achieved_units: number;
}

export interface DashboardSummaryMetrics {
  total_enquiries: number;
  new_leads: number;
  follow_ups_due: number;
  active_opportunities: number;
  available_inventory: number;
  pending_quotations: number;
  group_purchasing_opportunities: number;
  total_dealership_revenue: number;
}

export interface InventorySummary {
  total_vehicles: number;
  in_stock: number;
  in_transit: number;
  allocated_to_groups: number;
  aging_units: number;
  recent_stock: InventoryItem[];
}

export interface DealerDashboardData {
  metrics: DashboardSummaryMetrics;
  tasks: DealerTask[];
  recent_enquiries: DealerEnquiry[];
  upcoming_follow_ups: DealerFollowUp[];
  recent_activities: DealerActivity[];
  inventory_summary: InventorySummary;
  latest_group_opportunities: BuyerGroup[];
  recent_quotations: DealerQuotation[];
  sales_performance: StaffSalesPerformance[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total_records?: number;
    total_pages?: number;
  };
}

export interface ApiError {
  type?: string;
  title?: string;
  status: number;
  detail: string;
  error_code?: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}

// DealerOS CRM & Lead Management Domain Models
export type LeadStatus =
  | "NEW_ENQUIRY"
  | "CONTACTED"
  | "TEST_DRIVE_SCHEDULED"
  | "TEST_DRIVE_COMPLETED"
  | "QUOTATION_SENT"
  | "NEGOTIATION"
  | "WON_BOOKED"
  | "LOST_CLOSED";

export type PurchaseTimeline =
  | "IMMEDIATE"
  | "WITHIN_15_DAYS"
  | "WITHIN_30_DAYS"
  | "EXPLORING_2_3_MONTHS";

export type FinancingPreference = "CASH" | "LOAN" | "LEASE" | "UNDECIDED";

export type LeadSource =
  | "WEBSITE_DIRECT"
  | "BUYER_GROUP"
  | "SHOWROOM_WALK_IN"
  | "PHONE_INQUIRY"
  | "REFERRAL";

export interface LeadInternalNote {
  id: string;
  lead_id: string;
  dealer_id: string;
  author_id: string;
  author_name: string;
  author_role: DealerStaffRole;
  content: string;
  created_at: string;
}

export interface LeadActivityLog {
  id: string;
  lead_id: string;
  dealer_id: string;
  action: string;
  details: string;
  actor_id: string;
  actor_name: string;
  actor_role: DealerStaffRole;
  timestamp: string;
}

export interface DealerLead {
  id: string;
  dealer_id: string;
  branch_id: string;
  branch_name?: string;

  // Customer information
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city?: string;
  preferred_contact_method?: "PHONE" | "WHATSAPP" | "EMAIL";

  // Interested vehicle & variant
  brand_name: string;
  model_name: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour_preference?: string;

  // Budget & purchase plan
  budget_min?: number;
  budget_max?: number;
  purchase_timeline: PurchaseTimeline;
  financing_preference: FinancingPreference;

  // Lead status & source
  source: LeadSource;
  status: LeadStatus;

  // Ownership & assignment tracking
  assigned_to_id?: string;
  assigned_to_name?: string;
  assigned_to_role?: DealerStaffRole;
  assigned_by_id?: string;
  assigned_by_name?: string;
  assigned_at?: string;
  created_by_id?: string;
  created_by_name?: string;

  // Summary metadata
  notes_count?: number;
  last_contacted_at?: string;
  lost_reason?: string;
  booked_voucher_code?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadPayload {
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city?: string;
  preferred_contact_method?: "PHONE" | "WHATSAPP" | "EMAIL";
  brand_name: string;
  model_name: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour_preference?: string;
  budget_min?: number;
  budget_max?: number;
  purchase_timeline: PurchaseTimeline;
  financing_preference: FinancingPreference;
  source: LeadSource;
  assigned_to_id?: string;
  initial_note?: string;
}

export interface UpdateLeadPayload {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  city?: string;
  preferred_contact_method?: "PHONE" | "WHATSAPP" | "EMAIL";
  brand_name?: string;
  model_name?: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour_preference?: string;
  budget_min?: number;
  budget_max?: number;
  purchase_timeline?: PurchaseTimeline;
  financing_preference?: FinancingPreference;
  branch_id?: string;
}

export interface AssignLeadPayload {
  assigned_to_id: string;
  notes?: string;
}

export interface UpdateLeadStatusPayload {
  status: LeadStatus;
  reason_or_notes?: string;
  booked_voucher_code?: string;
}

export interface AddLeadNotePayload {
  content: string;
}

// Follow-up and Appointment Request Payloads
export interface CreateFollowUpPayload {
  branch_id: string;
  lead_id?: string;
  enquiry_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  interested_model?: string;
  scheduled_at: string;
  follow_up_type: FollowUpType;
  priority: FollowUpPriority;
  assigned_to_id?: string;
  notes: string;
  reminder_minutes_before?: number;
}

export interface UpdateFollowUpPayload {
  scheduled_at?: string;
  follow_up_type?: FollowUpType;
  priority?: FollowUpPriority;
  assigned_to_id?: string;
  notes?: string;
  reminder_minutes_before?: number;
  status?: FollowUpStatus;
  completion_notes?: string;
}

export interface CompleteFollowUpPayload {
  completion_notes: string;
}

export interface RescheduleFollowUpPayload {
  scheduled_at: string;
  notes?: string;
}

export interface AssignFollowUpPayload {
  assigned_to_id: string;
  notes?: string;
}

export interface CreateAppointmentPayload {
  branch_id: string;
  lead_id?: string;
  enquiry_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  interested_model?: string;
  appointment_type: AppointmentType;
  appointment_time: string;
  duration_minutes?: number;
  assigned_to_id?: string;
  notes?: string;
}

export interface UpdateAppointmentPayload {
  appointment_time?: string;
  duration_minutes?: number;
  assigned_to_id?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface RescheduleAppointmentPayload {
  appointment_time: string;
  reschedule_reason: string;
}

export interface CancelAppointmentPayload {
  cancel_reason: string;
}

export interface CompleteAppointmentPayload {
  visit_outcome: AppointmentVisitOutcome;
  outcome_notes: string;
}

// Notification Center Domain Types

export type NotificationEventType =
  | "NEW_ENQUIRY"
  | "LEAD_ASSIGNED"
  | "FOLLOW_UP_REMINDER"
  | "OVERDUE_TASK"
  | "NEW_GROUP_OPPORTUNITY"
  | "NEGOTIATION_UPDATE"
  | "QUOTATION_UPDATE"
  | "CAMPAIGN_UPDATE"
  | "STAFF_INVITATION"
  | "ACCOUNT_ACTIVITY";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";

export type NotificationDeliveryStatus = "DELIVERED" | "PENDING" | "FAILED";

export interface NotificationRelatedEntity {
  entity_type: "LEAD" | "FOLLOW_UP" | "APPOINTMENT" | "OPPORTUNITY" | "QUOTATION" | "CAMPAIGN" | "STAFF" | "ACCOUNT";
  entity_id: string;
  entity_code?: string;
  link_url: string;
}

export interface DealerNotification {
  id: string;
  dealer_id: string;
  recipient_user_id?: string | null;
  recipient_role?: DealerStaffRole | null;
  branch_id?: string | null;
  event_type: NotificationEventType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string | null;
  related_entity?: NotificationRelatedEntity;
  delivery_channel: NotificationChannel;
  delivery_status: NotificationDeliveryStatus;
  delivery_failure_reason?: string | null;
  deduplication_key?: string;
  created_at: string;
}

export interface ChannelSubscriptionMap {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export interface NotificationPreferences {
  user_id: string;
  dealer_id: string;
  channels: ChannelSubscriptionMap;
  event_subscriptions: Record<NotificationEventType, ChannelSubscriptionMap>;
  channel_readiness: {
    in_app: { ready: boolean; detail: string };
    email: { ready: boolean; detail: string };
    sms: { ready: boolean; detail: string };
    whatsapp: { ready: boolean; detail: string };
  };
}

export interface NotificationSummaryStats {
  total_notifications: number;
  unread_count: number;
  urgent_unread_count: number;
  today_count: number;
}

export interface CreateNotificationPayload {
  recipient_user_id?: string | null;
  recipient_role?: DealerStaffRole | null;
  branch_id?: string | null;
  event_type: NotificationEventType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  related_entity?: NotificationRelatedEntity;
  delivery_channel?: NotificationChannel;
  deduplication_key?: string;
}

export interface UpdateNotificationPreferencesPayload {
  channels?: Partial<ChannelSubscriptionMap>;
  event_subscriptions?: Partial<Record<NotificationEventType, Partial<ChannelSubscriptionMap>>>;
}

// Reports and BI Analytics Types

export type ReportType =
  | "ENQUIRY"
  | "LEAD_STATUS"
  | "LEAD_ASSIGNMENT"
  | "FOLLOW_UP"
  | "SALES_CONVERSION"
  | "INVENTORY"
  | "BRANCH_PERFORMANCE"
  | "STAFF_PERFORMANCE"
  | "QUOTATION"
  | "GROUP_OPPORTUNITY"
  | "CAMPAIGN_PERFORMANCE";

export type ReportDatePreset =
  | "ALL"
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "THIS_MONTH"
  | "LAST_90_DAYS"
  | "CUSTOM";

export interface ReportFilterParams {
  date_range?: ReportDatePreset | string;
  start_date?: string;
  end_date?: string;
  branch_id?: string;
  model_name?: string;
  staff_id?: string;
  lead_status?: string;
  campaign_id?: string;
}

export interface AnalyticsOverviewStats {
  total_enquiries: number;
  total_leads: number;
  active_pipeline_value: number;
  conversion_rate_pct: number;
  inventory_units_in_stock: number;
  inventory_asset_value: number;
  followup_compliance_pct: number;
  quotation_acceptance_pct: number;
  active_campaigns_count: number;
  open_group_opportunities_count: number;
  as_of_date: string;
}

export interface ReportMetricExplanation {
  metric_name: string;
  formula: string;
  description: string;
}

export interface ReportSummaryCard {
  title: string;
  value: string | number;
  change?: string;
  change_type?: "positive" | "negative" | "neutral";
  description?: string;
}

export interface ReportChartItem {
  label: string;
  value: number;
  secondary_value?: number;
  percentage?: number;
  color?: string;
  description?: string;
}

export interface ReportTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  is_currency?: boolean;
  is_percentage?: boolean;
}

export interface ReportDataPayload<T = Record<string, any>> {
  report_type: ReportType;
  report_title: string;
  report_description: string;
  generated_at: string;
  filters_applied: ReportFilterParams;
  metric_explanations: ReportMetricExplanation[];
  summary_cards: ReportSummaryCard[];
  breakdown_charts: {
    title: string;
    type: "bar" | "funnel" | "donut" | "progress";
    items: ReportChartItem[];
  }[];
  table_columns: ReportTableColumn[];
  data_rows: T[];
  total_rows: number;
}

// Customer Portal and Mobile Application Types

export interface CustomerUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  city?: string;
  address?: string;
  preferred_contact_method?: "WHATSAPP" | "PHONE" | "EMAIL" | string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  roles: RoleCode[];
  dealer_id?: null;
  branch_id?: null;
  created_at?: string;
}

export interface CustomerProfileStats {
  saved_vehicles_count: number;
  joined_groups_count: number;
  enquiries_count: number;
  quotations_count: number;
  appointments_count: number;
  unread_notifications_count: number;
}

export interface CustomerSavedVehicle {
  id: string;
  user_id: string;
  model_id: string;
  variant_id?: string | null;
  model_name: string;
  brand_name: string;
  variant_name?: string | null;
  fuel_type?: string;
  transmission?: string;
  starting_price?: number;
  image_url?: string;
  saved_at: string;
}

export interface CustomerSavedComparisonModel {
  id: string;
  name: string;
  brand_name?: string;
  image_url?: string;
  starting_price_inr?: number;
}

export interface CustomerSavedComparison {
  id: string;
  user_id: string;
  title: string;
  model_ids: string[];
  models?: CustomerSavedComparisonModel[];
  created_at: string;
}

export interface CustomerAppointment {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  dealer_id: string;
  dealership_name: string;
  branch_id?: string | null;
  branch_name?: string | null;
  model_id?: string | null;
  model_name: string;
  variant_name?: string | null;
  appointment_type: "SHOWROOM_VISIT" | "HOME_TEST_DRIVE" | "DOCUMENTATION_HANDOVER" | string;
  appointment_date: string;
  time_slot: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | string;
  consultant_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface CustomerNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "QUOTATION" | "APPOINTMENT" | "GROUP" | "SYSTEM" | string;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

export interface CustomerNotificationPreferences {
  email_notifications: boolean;
  sms_alerts: boolean;
  whatsapp_updates: boolean;
  quotation_alerts: boolean;
  group_milestones: boolean;
  promotional_offers: boolean;
}

export interface CustomerSession {
  session_id: string;
  user_id: string;
  device: string;
  ip_address: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

export interface UpdateCustomerProfilePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  city?: string;
  address?: string;
  preferred_contact_method?: string;
}

export interface BookAppointmentPayload {
  dealer_id: string;
  branch_id?: string;
  model_id?: string;
  model_name?: string;
  variant_name?: string;
  appointment_type?: string;
  appointment_date: string;
  time_slot: string;
  notes?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code_or_token: string;
  new_password: string;
}

export interface CustomerRegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  city?: string;
}

export interface CustomerLoginPayload {
  email: string;
  password: string;
}

export interface CustomerAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: CustomerUser;
}

export interface CustomerProfileData {
  user: CustomerUser;
  joined_groups_count: number;
}

export interface CustomerEnquiryPayload {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city?: string;
  brand_name: string;
  model_name: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour_preference?: string;
  purchase_timeline?: string;
  financing_preference?: string;
  preferred_dealer_id?: string;
  preferred_branch_id?: string;
  source?: string;
  enquiry_type?: "TEST_DRIVE" | "PRICE_QUOTE" | "GENERAL";
  notes?: string;
}

export interface CustomerEnquiryRecord {
  id: string;
  dealer_id: string;
  dealership_name?: string;
  branch_id: string;
  branch_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city: string;
  preferred_contact_method?: string;
  brand_name: string;
  model_name: string;
  variant_name?: string;
  fuel_type?: string;
  transmission?: string;
  colour_preference?: string;
  purchase_timeline?: string;
  financing_preference?: string;
  source: string;
  status: string;
  quotations_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerQuotationPricing {
  ex_showroom_price: number;
  rto_road_tax: number;
  insurance_amount: number;
  fastag_charges: number;
  tcs_amount: number;
  accessories_amount: number;
  extended_warranty_amount: number;
  other_charges: number;
  gross_on_road_price: number;
  dealer_discount: number;
  manufacturer_offer: number;
  exchange_bonus: number;
  total_discounts: number;
  final_on_road_price: number;
}

export interface CustomerQuotationRecord {
  id: string;
  quotation_number: string;
  lead_id?: string | null;
  group_id?: string | null;
  group_code?: string | null;
  dealer_id: string;
  dealer_name: string;
  branch_id?: string | null;
  branch_name?: string | null;
  model_id?: string;
  model_name: string;
  variant_id?: string;
  variant_name: string;
  fuel_type: string;
  transmission: string;
  colour: string;
  pricing: CustomerQuotationPricing;
  net_on_road_price: number;
  delivery_timeline_days: number;
  dealership_terms: string;
  quotation_status: "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED_BY_DEALER";
  valid_until?: string | null;
  version: number;
  created_at: string;
}

export interface CustomerEnquiryResult {
  enquiry_id: string;
  dealership_name: string;
  branch_id: string;
  status: string;
  message: string;
}

export interface JoinBuyerGroupPayload {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  city?: string;
  preferred_variant?: string;
  preferred_colour?: string;
  financing_preference?: string;
  notes?: string;
}

export interface CustomerGroupMembership {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  group_id: string;
  group_code: string;
  model_name: string;
  variant_name: string;
  colour_preference: string;
  city: string;
  status: "CONFIRMED" | "CANCELLED" | "ALLOCATED";
  joined_at: string;
}

export interface JoinedGroupDetail {
  membership: CustomerGroupMembership;
  group_details?: BuyerGroup & {
    requirements?: GroupRequirements;
    estimated_savings_inr?: number;
  };
}

export interface CreateGroupDemandPayload {
  model_id: string;
  model_name: string;
  brand_name: string;
  city: string;
  target_delivery_window_days?: number;
  preferred_variants?: string[];
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes?: string;
}

export interface PublicBuyerGroupItem extends BuyerGroup {
  estimated_savings_inr?: number;
  requirements?: GroupRequirements;
}

export interface PublicDealerOffer {
  id: string;
  dealer_id: string;
  dealer_name: string;
  branch_name: string;
  offer_type?: string;
  status: string;
  estimated_delivery_days: number;
  delivery_timeline_days?: number;
  stock_allocation_commitment?: number;
  proposed_benefits: string;
  total_discounts_inr?: number;
  net_on_road_price?: number;
  terms_and_conditions?: string;
  valid_until?: string;
  created_at: string;
}

export interface GroupActivityEvent {
  id: string;
  type: "FORMATION" | "MILESTONE" | "DEALER_OFFER" | "STATUS_CHANGE";
  title: string;
  description: string;
  timestamp: string;
}

export interface CustomerParticipationStatus {
  has_joined: boolean;
  membership_id?: string;
  status?: "CONFIRMED" | "CANCELLED" | "ALLOCATED";
  preferred_variant?: string;
  preferred_colour?: string;
  joined_at?: string;
}

export interface PublicBuyerGroupDetail extends PublicBuyerGroupItem {
  participating_dealers_count?: number;
  dealer_offers?: PublicDealerOffer[];
  activity_timeline?: GroupActivityEvent[];
  user_participation?: CustomerParticipationStatus | null;
}

export interface PublicModelDetail extends CatalogueModel {
  variants: CatalogueVariant[];
}

export interface PublicDealerBranch {
  id: string;
  dealer_id?: string;
  branch_name: string;
  branch_type: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  pin_code: string;
  authorized_rto_codes: string[];
  phone_number: string;
  email: string;
  operating_hours: string;
  manager_name?: string;
  directions_url: string;
}

export interface PublicDealerSummary {
  id: string;
  trade_name: string;
  legal_entity_name: string;
  oem_brand_franchise: string;
  registered_office_address: string;
  city: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  logo_url?: string | null;
  website_url?: string | null;
  description?: string | null;
  operating_hours: string;
  kyc_status: string;
  is_verified: boolean;
  branches: PublicDealerBranch[];
  branches_count: number;
  available_inventory_count: number;
  active_offers_count: number;
  directions_url: string;
}

export interface PublicDealerInventoryVehicle {
  id: string;
  model_id: string;
  model_name: string;
  variant_id: string;
  variant_name: string;
  fuel_type: string;
  transmission_type: string;
  colour_name: string;
  ex_showroom_price: number;
  status: string;
  branch_name: string;
  vehicle_image_url: string;
  is_available_for_group_buy: boolean;
}

export interface PublicDealerCampaignOffer {
  id: string;
  title: string;
  description: string;
  campaign_type: string;
  status: string;
  eligible_models: string[];
  discount_amount: number;
  exchange_bonus_amount?: number | null;
  free_accessories_description?: string | null;
  terms_and_conditions?: string | null;
  valid_until?: string | null;
  is_sponsored?: boolean;
}

export interface PublicDealerBuyerGroup {
  id: string;
  group_code: string;
  model_name: string;
  city: string;
  status: string;
  current_members_count: number;
  max_capacity: number;
  quoting_deadline: string;
}

export interface PublicDealerDetail extends PublicDealerSummary {
  available_vehicles: PublicDealerInventoryVehicle[];
  published_offers: PublicDealerCampaignOffer[];
  active_groups: PublicDealerBuyerGroup[];
}

