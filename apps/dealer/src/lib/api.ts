import {
  ApiResponse,
  BuyerGroup,
  DealerBranch,
  DealerEntity,
  DealerQuotation,
  InventoryItem,
  InventoryDashboardMetrics,
  InventoryHistoryLog,
  CatalogueBrand,
  CatalogueModel,
  CatalogueVariant,
  CatalogueColour,
  DealerDashboardData,
  DealerStaffMember,
  StaffActivityLog,
  InviteStaffPayload,
  UpdateStaffPayload,
  DealerLead,
  LeadInternalNote,
  LeadActivityLog,
  CreateLeadPayload,
  UpdateLeadPayload,
  AssignLeadPayload,
  UpdateLeadStatusPayload,
  AddLeadNotePayload,
  DealerFollowUp,
  DealerAppointment,
  FollowUpSummaryMetrics,
  CreateFollowUpPayload,
  UpdateFollowUpPayload,
  CompleteFollowUpPayload,
  RescheduleFollowUpPayload,
  AssignFollowUpPayload,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  RescheduleAppointmentPayload,
  CancelAppointmentPayload,
  CompleteAppointmentPayload,
  GroupOpportunity,
  DealerInterestSubmission,
  OpportunityHistoryLog,
  SubmitDealerInterestPayload,
  UpdateNegotiationPayload,
  WithdrawInterestPayload,
  OpportunitySummaryStats,
  QuotationPricingBreakdown,
  QuotationHistoryEntry,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  CalculatePricingRequest,
  QuotationSummaryStats,
  DealerCampaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  CampaignSummaryStats,
  CampaignHistoryLog,
  DealerNotification,
  NotificationSummaryStats,
  NotificationPreferences,
  CreateNotificationPayload,
  UpdateNotificationPreferencesPayload,
  AnalyticsOverviewStats,
  ReportType,
  ReportFilterParams,
  ReportDataPayload,
} from "@groupdrive/types";
import {
  MOCK_BRANCHES,
  MOCK_BUYER_GROUPS,
  MOCK_DEALER,
  MOCK_INVENTORY,
  MOCK_INVENTORY_DASHBOARD,
  MOCK_INVENTORY_HISTORY,
  MOCK_CATALOGUE_BRANDS,
  MOCK_CATALOGUE_MODELS,
  MOCK_CATALOGUE_VARIANTS,
  MOCK_QUOTATIONS,
  MOCK_QUOTATIONS_SUMMARY,
  MOCK_DASHBOARD_DATA,
  MOCK_STAFF_MEMBERS,
  MOCK_STAFF_ACTIVITIES,
  MOCK_LEADS,
  MOCK_LEAD_NOTES,
  MOCK_LEAD_ACTIVITIES,
  MOCK_FOLLOW_UPS,
  MOCK_APPOINTMENTS,
  MOCK_FOLLOW_UP_SUMMARY,
  MOCK_OPPORTUNITIES,
  MOCK_OPPORTUNITY_HISTORY,
  MOCK_OPPORTUNITY_SUMMARY,
  MOCK_CAMPAIGNS,
  MOCK_CAMPAIGN_SUMMARY,
  MOCK_CAMPAIGN_HISTORY,
  MOCK_NOTIFICATIONS,
  MOCK_NOTIFICATION_SUMMARY,
  MOCK_NOTIFICATION_PREFERENCES,
  MOCK_ANALYTICS_OVERVIEW,
  MOCK_REPORTS_DATA,
} from "./mock-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiClientError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

// Token storage in memory with sessionStorage backup
let currentAccessToken: string | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("gd_access_token", token);
      document.cookie = `gd_auth_token=${token}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      sessionStorage.removeItem("gd_access_token");
      document.cookie = "gd_auth_token=; path=/; max-age=0";
    }
  }
}

export function getAccessToken(): string | null {
  if (currentAccessToken) return currentAccessToken;
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("gd_access_token");
    if (token) {
      currentAccessToken = token;
      return token;
    }
  }
  return null;
}

export function registerSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler;
}

async function request<T>(
  endpoint: string,
  mockFallback: T,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  headers.set("Content-Type", "application/json");

  const authToken = token || getAccessToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    if (res.status === 401) {
      const errorBody = await res.json().catch(() => null);
      if (sessionExpiredHandler) {
        sessionExpiredHandler();
      }
      throw new ApiClientError(
        errorBody?.detail || "Session expired. Please sign in again.",
        401,
        "SESSION_EXPIRED"
      );
    }

    const errorBody = await res.json().catch(() => null);
    const message =
      errorBody?.detail ||
      errorBody?.message ||
      `API request failed with status ${res.status}`;
    throw new ApiClientError(message, res.status, errorBody?.error_code);
  } catch (err: unknown) {
    if (err instanceof ApiClientError) {
      throw err;
    }

    // In local development when backend is offline, gracefully return mock data
    if (process.env.NODE_ENV !== "production") {
      return {
        success: true,
        data: mockFallback,
        message: "Loaded from fallback development store",
      };
    }

    throw new ApiClientError(
      "Unable to connect to centralized GroupDrive API service.",
      503,
      "SERVICE_UNAVAILABLE"
    );
  }
}

export const dealerApi = {
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    const res = await request<any>(
      "/auth/login-password",
      null,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request("/auth/logout", null, { method: "POST" });
    } finally {
      setAccessToken(null);
    }
  },

  async getMe(): Promise<ApiResponse<any>> {
    return request("/auth/me", null);
  },

  async getProfile(): Promise<ApiResponse<DealerEntity>> {
    return request<DealerEntity>("/dealers/me", MOCK_DEALER);
  },

  async updateProfile(profileData: Partial<DealerEntity>): Promise<ApiResponse<DealerEntity>> {
    return request<DealerEntity>("/dealers/me", MOCK_DEALER, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  async getBranches(): Promise<ApiResponse<DealerBranch[]>> {
    return request<DealerBranch[]>("/dealers/me/branches", MOCK_BRANCHES);
  },

  async getBranch(branchId: string): Promise<ApiResponse<DealerBranch>> {
    const fallback = MOCK_BRANCHES.find((b) => b.id === branchId) || MOCK_BRANCHES[0];
    return request<DealerBranch>(`/dealers/me/branches/${branchId}`, fallback);
  },

  async createBranch(branchData: Partial<DealerBranch>): Promise<ApiResponse<DealerBranch>> {
    return request<DealerBranch>("/dealers/me/branches", MOCK_BRANCHES[0], {
      method: "POST",
      body: JSON.stringify(branchData),
    });
  },

  async updateBranch(
    branchId: string,
    branchData: Partial<DealerBranch>
  ): Promise<ApiResponse<DealerBranch>> {
    return request<DealerBranch>(`/dealers/me/branches/${branchId}`, MOCK_BRANCHES[0], {
      method: "PUT",
      body: JSON.stringify(branchData),
    });
  },

  async toggleBranchStatus(
    branchId: string,
    isActive: boolean
  ): Promise<ApiResponse<DealerBranch>> {
    return request<DealerBranch>(`/dealers/me/branches/${branchId}/status`, MOCK_BRANCHES[0], {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  async getBuyerGroups(city?: string): Promise<ApiResponse<BuyerGroup[]>> {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    return request<BuyerGroup[]>(`/groups${query}`, MOCK_BUYER_GROUPS);
  },

  // Inventory & Catalogue API Methods
  async getInventoryDashboard(branchId?: string): Promise<ApiResponse<InventoryDashboardMetrics>> {
    const query = branchId && branchId !== "ALL" ? `?branch_id=${encodeURIComponent(branchId)}` : "";
    return request<InventoryDashboardMetrics>(`/inventory/dashboard${query}`, MOCK_INVENTORY_DASHBOARD);
  },

  async getInventory(params?: {
    branchId?: string;
    brand?: string;
    model?: string;
    variant?: string;
    fuelType?: string;
    transmission?: string;
    status?: string;
    search?: string;
  } | string): Promise<ApiResponse<InventoryItem[]>> {
    // Support legacy single string branchId argument as well as structured params
    if (typeof params === "string") {
      const query = params && params !== "all" && params !== "ALL" ? `?branch_id=${encodeURIComponent(params)}` : "";
      return request<InventoryItem[]>(`/inventory${query}`, MOCK_INVENTORY);
    }
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "ALL") query.append("branch_id", params.branchId);
    if (params?.brand && params.brand !== "ALL") query.append("brand", params.brand);
    if (params?.model && params.model !== "ALL") query.append("model", params.model);
    if (params?.variant && params.variant !== "ALL") query.append("variant", params.variant);
    if (params?.fuelType && params.fuelType !== "ALL") query.append("fuel_type", params.fuelType);
    if (params?.transmission && params.transmission !== "ALL") query.append("transmission", params.transmission);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.search && params.search.trim()) query.append("search", params.search.trim());
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<InventoryItem[]>(`/inventory${queryString}`, MOCK_INVENTORY);
  },

  async getInventoryDetail(inventoryId: string): Promise<ApiResponse<InventoryItem & { official_specifications?: any }>> {
    const fallback = MOCK_INVENTORY.find((i) => i.id === inventoryId) || MOCK_INVENTORY[0];
    return request<InventoryItem & { official_specifications?: any }>(`/inventory/${inventoryId}`, fallback);
  },

  async addInventory(payload: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    return request<InventoryItem>("/inventory", MOCK_INVENTORY[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateInventory(
    inventoryId: string,
    payload: Partial<InventoryItem>
  ): Promise<ApiResponse<InventoryItem>> {
    return request<InventoryItem>(`/inventory/${inventoryId}`, MOCK_INVENTORY[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async updateInventoryAvailability(
    inventoryId: string,
    payload: {
      status?: string;
      stock_quantity?: number;
      is_available_for_flash_sale?: boolean;
      is_available_for_group_buy?: boolean;
    }
  ): Promise<ApiResponse<InventoryItem>> {
    return request<InventoryItem>(`/inventory/${inventoryId}/availability`, MOCK_INVENTORY[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getInventoryHistory(inventoryId: string): Promise<ApiResponse<InventoryHistoryLog[]>> {
    return request<InventoryHistoryLog[]>(`/inventory/${inventoryId}/history`, MOCK_INVENTORY_HISTORY);
  },

  async getCatalogueBrands(): Promise<ApiResponse<CatalogueBrand[]>> {
    return request<CatalogueBrand[]>("/catalogue/brands", MOCK_CATALOGUE_BRANDS);
  },

  async getCatalogueModels(brandId?: string): Promise<ApiResponse<CatalogueModel[]>> {
    const query = brandId ? `?brand_id=${encodeURIComponent(brandId)}` : "";
    return request<CatalogueModel[]>(`/catalogue/models${query}`, MOCK_CATALOGUE_MODELS);
  },

  async getCatalogueVariants(params?: {
    modelId?: string;
    fuelType?: string;
    transmission?: string;
  }): Promise<ApiResponse<CatalogueVariant[]>> {
    const query = new URLSearchParams();
    if (params?.modelId && params.modelId !== "ALL") query.append("model_id", params.modelId);
    if (params?.fuelType && params.fuelType !== "ALL") query.append("fuel_type", params.fuelType);
    if (params?.transmission && params.transmission !== "ALL") query.append("transmission", params.transmission);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<CatalogueVariant[]>(`/catalogue/variants${queryString}`, MOCK_CATALOGUE_VARIANTS);
  },

  async getCatalogueVariantDetail(variantId: string): Promise<ApiResponse<CatalogueVariant>> {
    const fallback = MOCK_CATALOGUE_VARIANTS.find((v) => v.id === variantId) || MOCK_CATALOGUE_VARIANTS[0];
    return request<CatalogueVariant>(`/catalogue/variants/${variantId}`, fallback);
  },

  async calculateQuotationPricing(
    payload: CalculatePricingRequest
  ): Promise<ApiResponse<QuotationPricingBreakdown>> {
    const ex = payload.ex_showroom_price;
    const rto = payload.rto_road_tax ?? Math.round(ex * 0.14);
    const ins = payload.insurance_amount ?? Math.round(ex * 0.035 + 12000);
    const fastag = payload.fastag_charges ?? 500;
    const tcs = payload.tcs_amount ?? (ex > 1000000 ? Math.round(ex * 0.01) : 0);
    const acc = payload.accessories_amount ?? 0;
    const warr = payload.extended_warranty_amount ?? 0;
    const oth = payload.other_charges ?? 0;
    const dDisc = payload.dealer_discount ?? 0;
    const mOffer = payload.manufacturer_offer ?? 0;
    const exch = payload.exchange_bonus ?? 0;

    const gross = ex + rto + ins + fastag + tcs + acc + warr + oth;
    const totDisc = dDisc + mOffer + exch;
    const finalPrice = gross - totDisc;

    const fallback: QuotationPricingBreakdown = {
      ex_showroom_price: ex,
      rto_road_tax: rto,
      insurance_amount: ins,
      fastag_charges: fastag,
      tcs_amount: tcs,
      accessories_amount: acc,
      extended_warranty_amount: warr,
      other_charges: oth,
      gross_on_road_price: gross,
      dealer_discount: dDisc,
      manufacturer_offer: mOffer,
      exchange_bonus: exch,
      total_discounts: totDisc,
      final_on_road_price: finalPrice,
    };

    return request<QuotationPricingBreakdown>(
      "/dealers/me/quotations/calculate",
      fallback,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  async getQuotations(params?: {
    branch_id?: string;
    status?: string;
    lead_id?: string;
    group_id?: string;
    search?: string;
  }): Promise<ApiResponse<DealerQuotation[]>> {
    const query = new URLSearchParams();
    if (params?.branch_id && params.branch_id !== "all") query.append("branch_id", params.branch_id);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.lead_id) query.append("lead_id", params.lead_id);
    if (params?.group_id) query.append("group_id", params.group_id);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerQuotation[]>(`/dealers/me/quotations${queryString}`, MOCK_QUOTATIONS);
  },

  async getQuotationsSummary(branchId?: string): Promise<ApiResponse<QuotationSummaryStats>> {
    const query = branchId && branchId !== "all" ? `?branch_id=${branchId}` : "";
    return request<QuotationSummaryStats>(`/dealers/me/quotations/summary${query}`, MOCK_QUOTATIONS_SUMMARY);
  },

  async getQuotationDetail(quotationId: string): Promise<ApiResponse<DealerQuotation>> {
    const fallback =
      MOCK_QUOTATIONS.find((q) => q.id === quotationId || q.quotation_number === quotationId) ||
      MOCK_QUOTATIONS[0];
    return request<DealerQuotation>(`/dealers/me/quotations/${quotationId}`, fallback);
  },

  async createQuotation(payload: CreateQuotationPayload): Promise<ApiResponse<DealerQuotation>> {
    return request<DealerQuotation>("/dealers/me/quotations", MOCK_QUOTATIONS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateQuotation(
    quotationId: string,
    payload: UpdateQuotationPayload
  ): Promise<ApiResponse<DealerQuotation>> {
    return request<DealerQuotation>(`/dealers/me/quotations/${quotationId}`, MOCK_QUOTATIONS[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async submitDraftQuotation(quotationId: string): Promise<ApiResponse<DealerQuotation>> {
    return request<DealerQuotation>(`/dealers/me/quotations/${quotationId}/submit`, MOCK_QUOTATIONS[0], {
      method: "PATCH",
    });
  },

  async acceptQuotation(quotationId: string): Promise<ApiResponse<DealerQuotation>> {
    return request<DealerQuotation>(`/dealers/me/quotations/${quotationId}/accept`, MOCK_QUOTATIONS[0], {
      method: "PATCH",
    });
  },

  async cancelQuotation(
    quotationId: string,
    payload: { reason: string }
  ): Promise<ApiResponse<DealerQuotation>> {
    return request<DealerQuotation>(`/dealers/me/quotations/${quotationId}/cancel`, MOCK_QUOTATIONS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getQuotationHistory(quotationId: string): Promise<ApiResponse<QuotationHistoryEntry[]>> {
    const quote = MOCK_QUOTATIONS.find((q) => q.id === quotationId);
    return request<QuotationHistoryEntry[]>(
      `/dealers/me/quotations/${quotationId}/history`,
      quote?.history || []
    );
  },

  async submitQuotation(quoteData: Partial<DealerQuotation>): Promise<ApiResponse<DealerQuotation>> {
    return request<DealerQuotation>(
      `/groups/${quoteData.group_id}/quotations`,
      MOCK_QUOTATIONS[0],
      {
        method: "POST",
        body: JSON.stringify(quoteData),
      }
    );
  },

  async getCampaigns(params?: {
    branch_id?: string;
    status?: string;
    campaign_type?: string;
    origin?: string;
    search?: string;
  }): Promise<ApiResponse<DealerCampaign[]>> {
    const query = new URLSearchParams();
    if (params?.branch_id && params.branch_id !== "all") query.append("branch_id", params.branch_id);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.campaign_type && params.campaign_type !== "ALL") query.append("campaign_type", params.campaign_type);
    if (params?.origin && params.origin !== "ALL") query.append("origin", params.origin);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerCampaign[]>(`/dealers/me/campaigns${queryString}`, MOCK_CAMPAIGNS);
  },

  async getCampaignSummary(branchId?: string): Promise<ApiResponse<CampaignSummaryStats>> {
    const query = branchId && branchId !== "all" ? `?branch_id=${branchId}` : "";
    return request<CampaignSummaryStats>(`/dealers/me/campaigns/summary${query}`, MOCK_CAMPAIGN_SUMMARY);
  },

  async getCampaignDetail(campaignId: string): Promise<ApiResponse<DealerCampaign>> {
    const fallback =
      MOCK_CAMPAIGNS.find((c) => c.id === campaignId || c.campaign_code === campaignId) ||
      MOCK_CAMPAIGNS[0];
    return request<DealerCampaign>(`/dealers/me/campaigns/${campaignId}`, fallback);
  },

  async createCampaign(payload: CreateCampaignPayload): Promise<ApiResponse<DealerCampaign>> {
    return request<DealerCampaign>("/dealers/me/campaigns", MOCK_CAMPAIGNS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateCampaign(
    campaignId: string,
    payload: UpdateCampaignPayload
  ): Promise<ApiResponse<DealerCampaign>> {
    return request<DealerCampaign>(`/dealers/me/campaigns/${campaignId}`, MOCK_CAMPAIGNS[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async toggleCampaignStatus(
    campaignId: string,
    isActive: boolean
  ): Promise<ApiResponse<DealerCampaign>> {
    return request<DealerCampaign>(`/dealers/me/campaigns/${campaignId}/toggle`, MOCK_CAMPAIGNS[0], {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  async getCampaignHistory(campaignId: string): Promise<ApiResponse<CampaignHistoryLog[]>> {
    const fallback = MOCK_CAMPAIGN_HISTORY[campaignId] || [];
    return request<CampaignHistoryLog[]>(`/dealers/me/campaigns/${campaignId}/history`, fallback);
  },

  async getNotifications(params?: {
    is_read?: boolean;
    event_type?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse<DealerNotification[]>> {
    const query = new URLSearchParams();
    if (params?.is_read !== undefined) query.append("is_read", String(params.is_read));
    if (params?.event_type && params.event_type !== "ALL") query.append("event_type", params.event_type);
    if (params?.priority && params.priority !== "ALL") query.append("priority", params.priority);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerNotification[]>(`/dealers/me/notifications${queryString}`, MOCK_NOTIFICATIONS);
  },

  async getNotificationSummary(): Promise<ApiResponse<NotificationSummaryStats>> {
    return request<NotificationSummaryStats>("/dealers/me/notifications/summary", MOCK_NOTIFICATION_SUMMARY);
  },

  async markNotificationRead(
    notificationId: string,
    isRead: boolean = true
  ): Promise<ApiResponse<DealerNotification>> {
    const fallback =
      MOCK_NOTIFICATIONS.find((n) => n.id === notificationId) || MOCK_NOTIFICATIONS[0];
    return request<DealerNotification>(
      `/dealers/me/notifications/${notificationId}/read`,
      { ...fallback, is_read: isRead },
      {
        method: "PATCH",
        body: JSON.stringify({ is_read: isRead }),
      }
    );
  },

  async markAllNotificationsRead(): Promise<ApiResponse<{ updated_count: number }>> {
    return request<{ updated_count: number }>(
      "/dealers/me/notifications/mark-all-read",
      { updated_count: 4 },
      {
        method: "POST",
      }
    );
  },

  async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return request<{ message: string }>(
      `/dealers/me/notifications/${notificationId}`,
      { message: "Notification dismissed successfully." },
      {
        method: "DELETE",
      }
    );
  },

  async clearReadNotifications(): Promise<ApiResponse<{ cleared_count: number }>> {
    return request<{ cleared_count: number }>(
      "/dealers/me/notifications/clear-read",
      { cleared_count: 6 },
      {
        method: "POST",
      }
    );
  },

  async getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return request<NotificationPreferences>(
      "/dealers/me/notifications/preferences",
      MOCK_NOTIFICATION_PREFERENCES
    );
  },

  async updateNotificationPreferences(
    payload: UpdateNotificationPreferencesPayload
  ): Promise<ApiResponse<NotificationPreferences>> {
    return request<NotificationPreferences>(
      "/dealers/me/notifications/preferences",
      MOCK_NOTIFICATION_PREFERENCES,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  async triggerTestNotification(
    payload: CreateNotificationPayload
  ): Promise<ApiResponse<DealerNotification>> {
    return request<DealerNotification>(
      "/dealers/me/notifications/test-trigger",
      MOCK_NOTIFICATIONS[0],
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  async getDashboard(
    branchId?: string,
    dateFilter?: string
  ): Promise<ApiResponse<DealerDashboardData>> {
    const params = new URLSearchParams();
    if (branchId && branchId !== "all") params.append("branch_id", branchId);
    if (dateFilter && dateFilter !== "all") params.append("date_filter", dateFilter);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request<DealerDashboardData>(`/dashboard${queryString}`, MOCK_DASHBOARD_DATA);
  },

  async updateTaskStatus(taskId: string, status: string): Promise<ApiResponse<any>> {
    return request(`/dashboard/tasks/${taskId}/status`, null, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async updateFollowUpStatus(followUpId: string, status: string): Promise<ApiResponse<any>> {
    return request(`/dashboard/follow-ups/${followUpId}/status`, null, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Staff Management Methods
  async getStaff(params?: {
    branchId?: string;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<DealerStaffMember[]>> {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "ALL") query.append("branch_id", params.branchId);
    if (params?.role && params.role !== "ALL") query.append("role", params.role);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.search && params.search.trim()) query.append("search", params.search.trim());
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerStaffMember[]>(`/dealers/me/staff${queryString}`, MOCK_STAFF_MEMBERS);
  },

  async getStaffDetail(staffId: string): Promise<ApiResponse<DealerStaffMember>> {
    const fallback = MOCK_STAFF_MEMBERS.find((s) => s.id === staffId) || MOCK_STAFF_MEMBERS[0];
    return request<DealerStaffMember>(`/dealers/me/staff/${staffId}`, fallback);
  },

  async inviteStaff(payload: InviteStaffPayload): Promise<ApiResponse<DealerStaffMember>> {
    return request<DealerStaffMember>("/dealers/me/staff/invite", MOCK_STAFF_MEMBERS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateStaff(
    staffId: string,
    payload: UpdateStaffPayload
  ): Promise<ApiResponse<DealerStaffMember>> {
    return request<DealerStaffMember>(`/dealers/me/staff/${staffId}`, MOCK_STAFF_MEMBERS[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async toggleStaffStatus(
    staffId: string,
    isActive: boolean
  ): Promise<ApiResponse<DealerStaffMember>> {
    return request<DealerStaffMember>(`/dealers/me/staff/${staffId}/status`, MOCK_STAFF_MEMBERS[0], {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  async resendStaffInvite(staffId: string): Promise<ApiResponse<DealerStaffMember>> {
    return request<DealerStaffMember>(`/dealers/me/staff/${staffId}/resend-invite`, MOCK_STAFF_MEMBERS[0], {
      method: "POST",
    });
  },

  async revokeStaffInvite(staffId: string): Promise<ApiResponse<DealerStaffMember>> {
    return request<DealerStaffMember>(`/dealers/me/staff/${staffId}/revoke-invite`, MOCK_STAFF_MEMBERS[0], {
      method: "POST",
    });
  },

  async getStaffActivities(staffId?: string): Promise<ApiResponse<StaffActivityLog[]>> {
    const query = staffId ? `?staff_id=${encodeURIComponent(staffId)}` : "";
    return request<StaffActivityLog[]>(`/dealers/me/staff-activities${query}`, MOCK_STAFF_ACTIVITIES);
  },

  // Customer Enquiry & Lead Management (CRM)
  async getLeads(params?: {
    branchId?: string;
    status?: string;
    assignedToId?: string;
    timeline?: string;
    search?: string;
  }): Promise<ApiResponse<DealerLead[]>> {
    const query = new URLSearchParams();
    if (params?.branchId && params.branchId !== "ALL") query.append("branch_id", params.branchId);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.assignedToId && params.assignedToId !== "ALL") query.append("assigned_to_id", params.assignedToId);
    if (params?.timeline && params.timeline !== "ALL") query.append("timeline", params.timeline);
    if (params?.search && params.search.trim()) query.append("search", params.search.trim());
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerLead[]>(`/dealers/me/leads${queryString}`, MOCK_LEADS);
  },

  async getLeadDetail(leadId: string): Promise<ApiResponse<DealerLead>> {
    const fallback = MOCK_LEADS.find((l) => l.id === leadId) || MOCK_LEADS[0];
    return request<DealerLead>(`/dealers/me/leads/${leadId}`, fallback);
  },

  async createLead(payload: CreateLeadPayload): Promise<ApiResponse<DealerLead>> {
    return request<DealerLead>("/dealers/me/leads", MOCK_LEADS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateLead(leadId: string, payload: UpdateLeadPayload): Promise<ApiResponse<DealerLead>> {
    return request<DealerLead>(`/dealers/me/leads/${leadId}`, MOCK_LEADS[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async assignLead(leadId: string, payload: AssignLeadPayload): Promise<ApiResponse<DealerLead>> {
    return request<DealerLead>(`/dealers/me/leads/${leadId}/assign`, MOCK_LEADS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async updateLeadStatus(
    leadId: string,
    payload: UpdateLeadStatusPayload
  ): Promise<ApiResponse<DealerLead>> {
    return request<DealerLead>(`/dealers/me/leads/${leadId}/status`, MOCK_LEADS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async addLeadNote(
    leadId: string,
    payload: AddLeadNotePayload
  ): Promise<ApiResponse<LeadInternalNote>> {
    return request<LeadInternalNote>(`/dealers/me/leads/${leadId}/notes`, MOCK_LEAD_NOTES[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getLeadNotes(leadId: string): Promise<ApiResponse<LeadInternalNote[]>> {
    const fallback = MOCK_LEAD_NOTES.filter((n) => n.lead_id === leadId);
    return request<LeadInternalNote[]>(`/dealers/me/leads/${leadId}/notes`, fallback.length ? fallback : MOCK_LEAD_NOTES);
  },

  async getLeadActivities(leadId: string): Promise<ApiResponse<LeadActivityLog[]>> {
    const fallback = MOCK_LEAD_ACTIVITIES.filter((a) => a.lead_id === leadId);
    return request<LeadActivityLog[]>(`/dealers/me/leads/${leadId}/activities`, fallback.length ? fallback : MOCK_LEAD_ACTIVITIES);
  },

  // Follow-up & Appointment Management
  async getFollowUpSummary(): Promise<ApiResponse<FollowUpSummaryMetrics>> {
    return request<FollowUpSummaryMetrics>("/dealers/me/follow-ups/summary", MOCK_FOLLOW_UP_SUMMARY);
  },

  async getFollowUps(params?: {
    bucket?: string;
    branchId?: string;
    assignedToId?: string;
    followUpType?: string;
    priority?: string;
    status?: string;
    leadId?: string;
    search?: string;
    scope?: string;
  }): Promise<ApiResponse<DealerFollowUp[]>> {
    const query = new URLSearchParams();
    if (params?.bucket && params.bucket !== "all") query.append("bucket", params.bucket);
    if (params?.branchId && params.branchId !== "ALL") query.append("branch_id", params.branchId);
    if (params?.assignedToId && params.assignedToId !== "ALL") query.append("assigned_to_id", params.assignedToId);
    if (params?.followUpType && params.followUpType !== "ALL") query.append("follow_up_type", params.followUpType);
    if (params?.priority && params.priority !== "ALL") query.append("priority", params.priority);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.leadId) query.append("lead_id", params.leadId);
    if (params?.search && params.search.trim()) query.append("search", params.search.trim());
    if (params?.scope) query.append("scope", params.scope);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerFollowUp[]>(`/dealers/me/follow-ups${queryString}`, MOCK_FOLLOW_UPS);
  },

  async getFollowUpDetail(followUpId: string): Promise<ApiResponse<DealerFollowUp>> {
    const fallback = MOCK_FOLLOW_UPS.find((f) => f.id === followUpId) || MOCK_FOLLOW_UPS[0];
    return request<DealerFollowUp>(`/dealers/me/follow-ups/${followUpId}`, fallback);
  },

  async createFollowUp(payload: CreateFollowUpPayload): Promise<ApiResponse<DealerFollowUp>> {
    return request<DealerFollowUp>("/dealers/me/follow-ups", MOCK_FOLLOW_UPS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateFollowUp(followUpId: string, payload: UpdateFollowUpPayload): Promise<ApiResponse<DealerFollowUp>> {
    return request<DealerFollowUp>(`/dealers/me/follow-ups/${followUpId}`, MOCK_FOLLOW_UPS[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async rescheduleFollowUp(followUpId: string, payload: RescheduleFollowUpPayload): Promise<ApiResponse<DealerFollowUp>> {
    return request<DealerFollowUp>(`/dealers/me/follow-ups/${followUpId}/reschedule`, MOCK_FOLLOW_UPS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async completeFollowUp(followUpId: string, payload: CompleteFollowUpPayload): Promise<ApiResponse<DealerFollowUp>> {
    return request<DealerFollowUp>(`/dealers/me/follow-ups/${followUpId}/complete`, MOCK_FOLLOW_UPS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async assignFollowUp(followUpId: string, payload: AssignFollowUpPayload): Promise<ApiResponse<DealerFollowUp>> {
    return request<DealerFollowUp>(`/dealers/me/follow-ups/${followUpId}/assign`, MOCK_FOLLOW_UPS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getAppointments(params?: {
    bucket?: string;
    branchId?: string;
    assignedToId?: string;
    appointmentType?: string;
    status?: string;
    leadId?: string;
    search?: string;
    scope?: string;
  }): Promise<ApiResponse<DealerAppointment[]>> {
    const query = new URLSearchParams();
    if (params?.bucket && params.bucket !== "all") query.append("bucket", params.bucket);
    if (params?.branchId && params.branchId !== "ALL") query.append("branch_id", params.branchId);
    if (params?.assignedToId && params.assignedToId !== "ALL") query.append("assigned_to_id", params.assignedToId);
    if (params?.appointmentType && params.appointmentType !== "ALL") query.append("appointment_type", params.appointmentType);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.leadId) query.append("lead_id", params.leadId);
    if (params?.search && params.search.trim()) query.append("search", params.search.trim());
    if (params?.scope) query.append("scope", params.scope);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<DealerAppointment[]>(`/dealers/me/appointments${queryString}`, MOCK_APPOINTMENTS);
  },

  async getAppointmentDetail(appointmentId: string): Promise<ApiResponse<DealerAppointment>> {
    const fallback = MOCK_APPOINTMENTS.find((a) => a.id === appointmentId) || MOCK_APPOINTMENTS[0];
    return request<DealerAppointment>(`/dealers/me/appointments/${appointmentId}`, fallback);
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<ApiResponse<DealerAppointment>> {
    return request<DealerAppointment>("/dealers/me/appointments", MOCK_APPOINTMENTS[0], {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateAppointment(appointmentId: string, payload: UpdateAppointmentPayload): Promise<ApiResponse<DealerAppointment>> {
    return request<DealerAppointment>(`/dealers/me/appointments/${appointmentId}`, MOCK_APPOINTMENTS[0], {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async rescheduleAppointment(appointmentId: string, payload: RescheduleAppointmentPayload): Promise<ApiResponse<DealerAppointment>> {
    return request<DealerAppointment>(`/dealers/me/appointments/${appointmentId}/reschedule`, MOCK_APPOINTMENTS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async cancelAppointment(appointmentId: string, payload: CancelAppointmentPayload): Promise<ApiResponse<DealerAppointment>> {
    return request<DealerAppointment>(`/dealers/me/appointments/${appointmentId}/cancel`, MOCK_APPOINTMENTS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async completeAppointment(appointmentId: string, payload: CompleteAppointmentPayload): Promise<ApiResponse<DealerAppointment>> {
    return request<DealerAppointment>(`/dealers/me/appointments/${appointmentId}/complete`, MOCK_APPOINTMENTS[0], {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // Group Purchasing Opportunities
  async getOpportunities(params?: {
    search?: string;
    vehicle?: string;
    variant?: string;
    city?: string;
    status?: string;
    offer_status?: string;
  }): Promise<ApiResponse<GroupOpportunity[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.vehicle && params.vehicle !== "ALL") query.append("vehicle", params.vehicle);
    if (params?.variant && params.variant !== "ALL") query.append("variant", params.variant);
    if (params?.city && params.city !== "ALL") query.append("city", params.city);
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.offer_status && params.offer_status !== "ALL") query.append("offer_status", params.offer_status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<GroupOpportunity[]>(`/opportunities${queryString}`, MOCK_OPPORTUNITIES);
  },

  async getOpportunitySummary(): Promise<ApiResponse<OpportunitySummaryStats>> {
    return request<OpportunitySummaryStats>("/opportunities/summary", MOCK_OPPORTUNITY_SUMMARY);
  },

  async getOpportunityDetail(opportunityId: string): Promise<ApiResponse<GroupOpportunity>> {
    const fallback = MOCK_OPPORTUNITIES.find((o) => o.id === opportunityId) || MOCK_OPPORTUNITIES[0];
    return request<GroupOpportunity>(`/opportunities/${opportunityId}`, fallback);
  },

  async submitDealerInterest(
    opportunityId: string,
    payload: SubmitDealerInterestPayload
  ): Promise<ApiResponse<DealerInterestSubmission>> {
    const fallback: DealerInterestSubmission = {
      id: `intr-${opportunityId}`,
      group_id: opportunityId,
      group_code: "GD-OPP",
      dealer_id: "dlr-kalyani-blr-001",
      branch_id: payload.branch_id,
      branch_name: "Dealership Branch",
      submitted_by_id: "usr-current",
      submitted_by_name: "Authorized Staff",
      submitted_by_role: "SALES_MANAGER",
      status: "INTEREST_EXPRESSED",
      estimated_delivery_days: payload.estimated_delivery_days,
      stock_allocation_commitment: payload.stock_allocation_commitment,
      proposed_benefits: payload.proposed_benefits,
      terms_and_conditions: payload.terms_and_conditions,
      initial_response_notes: payload.initial_response_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return request<DealerInterestSubmission>(`/opportunities/${opportunityId}/interest`, fallback, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateOpportunityNegotiation(
    opportunityId: string,
    payload: UpdateNegotiationPayload
  ): Promise<ApiResponse<DealerInterestSubmission>> {
    const fallback: DealerInterestSubmission = {
      id: `intr-${opportunityId}`,
      group_id: opportunityId,
      group_code: "GD-OPP",
      dealer_id: "dlr-kalyani-blr-001",
      branch_id: "br-whitefield-01",
      branch_name: "Dealership Branch",
      submitted_by_id: "usr-current",
      submitted_by_name: "Authorized Staff",
      submitted_by_role: "SALES_MANAGER",
      status: payload.status || "UNDER_NEGOTIATION",
      estimated_delivery_days: payload.estimated_delivery_days || 14,
      stock_allocation_commitment: payload.stock_allocation_commitment || 5,
      proposed_benefits: payload.proposed_benefits || "",
      terms_and_conditions: payload.terms_and_conditions || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return request<DealerInterestSubmission>(`/opportunities/${opportunityId}/negotiation`, fallback, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async withdrawDealerInterest(
    opportunityId: string,
    payload: WithdrawInterestPayload
  ): Promise<ApiResponse<DealerInterestSubmission>> {
    const fallback: DealerInterestSubmission = {
      id: `intr-${opportunityId}`,
      group_id: opportunityId,
      group_code: "GD-OPP",
      dealer_id: "dlr-kalyani-blr-001",
      branch_id: "br-whitefield-01",
      branch_name: "Dealership Branch",
      submitted_by_id: "usr-current",
      submitted_by_name: "Authorized Staff",
      submitted_by_role: "SALES_MANAGER",
      status: "WITHDRAWN",
      estimated_delivery_days: 14,
      stock_allocation_commitment: 0,
      proposed_benefits: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return request<DealerInterestSubmission>(`/opportunities/${opportunityId}/withdraw`, fallback, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getOpportunityHistory(opportunityId: string): Promise<ApiResponse<OpportunityHistoryLog[]>> {
    const fallback = MOCK_OPPORTUNITY_HISTORY[opportunityId] || [];
    return request<OpportunityHistoryLog[]>(`/opportunities/${opportunityId}/history`, fallback);
  },

  // Security test endpoints to verify tenant & branch boundaries
  async testCrossTenantAccess(targetDealerId: string): Promise<ApiResponse<any>> {
    return request(`/dealers/test-cross-tenant/${targetDealerId}`, null);
  },

  async testBranchAccess(targetBranchId: string): Promise<ApiResponse<any>> {
    return request(`/dealers/test-branch-access/${targetBranchId}`, null);
  },

  // Reports and Analytics Methods
  async getAnalyticsOverview(params?: ReportFilterParams): Promise<ApiResponse<AnalyticsOverviewStats>> {
    const query = new URLSearchParams();
    if (params?.date_range && params.date_range !== "ALL") query.append("date_range", params.date_range);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.branch_id && params.branch_id !== "ALL") query.append("branch_id", params.branch_id);
    if (params?.staff_id && params.staff_id !== "ALL") query.append("staff_id", params.staff_id);
    if (params?.model_name && params.model_name !== "ALL") query.append("model_name", params.model_name);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return request<AnalyticsOverviewStats>(
      `/dealers/me/reports/overview${queryString}`,
      MOCK_ANALYTICS_OVERVIEW
    );
  },

  async getReportData(
    reportType: ReportType,
    params?: ReportFilterParams
  ): Promise<ApiResponse<ReportDataPayload<any>>> {
    const query = new URLSearchParams();
    if (params?.date_range && params.date_range !== "ALL") query.append("date_range", params.date_range);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.branch_id && params.branch_id !== "ALL") query.append("branch_id", params.branch_id);
    if (params?.staff_id && params.staff_id !== "ALL") query.append("staff_id", params.staff_id);
    if (params?.model_name && params.model_name !== "ALL") query.append("model_name", params.model_name);
    if (params?.lead_status && params.lead_status !== "ALL") query.append("lead_status", params.lead_status);
    if (params?.campaign_id && params.campaign_id !== "ALL") query.append("campaign_id", params.campaign_id);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const fallback = MOCK_REPORTS_DATA[reportType] || MOCK_REPORTS_DATA.ENQUIRY;
    return request<ReportDataPayload<any>>(
      `/dealers/me/reports/${reportType}${queryString}`,
      fallback
    );
  },

  async exportReportCSV(
    reportType: ReportType,
    params?: ReportFilterParams
  ): Promise<Blob> {
    const query = new URLSearchParams();
    if (params?.date_range && params.date_range !== "ALL") query.append("date_range", params.date_range);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.branch_id && params.branch_id !== "ALL") query.append("branch_id", params.branch_id);
    if (params?.staff_id && params.staff_id !== "ALL") query.append("staff_id", params.staff_id);
    if (params?.model_name && params.model_name !== "ALL") query.append("model_name", params.model_name);
    if (params?.lead_status && params.lead_status !== "ALL") query.append("lead_status", params.lead_status);
    if (params?.campaign_id && params.campaign_id !== "ALL") query.append("campaign_id", params.campaign_id);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const token = currentAccessToken || (typeof window !== "undefined" ? sessionStorage.getItem("gd_access_token") : null);
    const response = await fetch(`${API_BASE_URL}/dealers/me/reports/${reportType}/export${queryString}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Access denied: You are not authorized to export dealership analytics data.");
      }
      throw new Error(`Failed to export report CSV: ${response.statusText}`);
    }

    return response.blob();
  },
};
