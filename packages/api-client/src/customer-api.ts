import {
  ApiResponse,
  CatalogueBrand,
  CatalogueModel,
  CatalogueVariant,
  CustomerAuthResponse,
  CustomerEnquiryPayload,
  CustomerEnquiryResult,
  CustomerLoginPayload,
  CustomerProfileData,
  CustomerRegisterPayload,
  DealerCampaign,
  JoinBuyerGroupPayload,
  JoinedGroupDetail,
  PublicBuyerGroupItem,
  PublicBuyerGroupDetail,
  PublicModelDetail,
  CreateGroupDemandPayload,
  CustomerGroupMembership,
  PublicDealerSummary,
  PublicDealerDetail,
  CustomerEnquiryRecord,
  CustomerQuotationRecord,
  CustomerSavedVehicle,
  CustomerSavedComparison,
  CustomerAppointment,
  CustomerNotification,
  CustomerNotificationPreferences,
  CustomerSession,
  CustomerProfileStats,
  UpdateCustomerProfilePayload,
  BookAppointmentPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@groupdrive/types";
import {
  createApiClient,
  ApiClientConfig,
} from "./client";
import {
  MOCK_CATALOGUE_BRANDS,
  MOCK_CATALOGUE_MODELS,
  MOCK_CATALOGUE_VARIANTS,
  MOCK_CUSTOMER_USER,
  MOCK_PUBLIC_BUYER_GROUPS,
  MOCK_PUBLIC_CAMPAIGNS,
  MOCK_AUTHORIZED_DEALERS,
  MockDealerItem,
} from "./mock-customer-data";

export function createCustomerApiClient(config?: ApiClientConfig) {
  const client = createApiClient(config);

  return {
    client,

    // Authentication methods
    auth: {
      async register(payload: CustomerRegisterPayload): Promise<ApiResponse<CustomerAuthResponse>> {
        const res = await client.request<CustomerAuthResponse>(
          "/auth/customer/register",
          {
            access_token: "mock-customer-jwt-token-2026",
            token_type: "bearer",
            expires_in: 3600,
            user: {
              id: "usr-cust-mock-01",
              email: payload.email,
              first_name: payload.first_name,
              last_name: payload.last_name,
              phone_number: payload.phone_number,
              city: payload.city || "Bengaluru",
              roles: ["ROLE_CUSTOMER"],
              dealer_id: null,
              branch_id: null,
            },
          },
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        if (res.data?.access_token) {
          await client.setAccessToken(res.data.access_token);
        }
        return res;
      },

      async login(payload: CustomerLoginPayload): Promise<ApiResponse<CustomerAuthResponse>> {
        const res = await client.request<CustomerAuthResponse>(
          "/auth/customer/login",
          {
            access_token: "mock-customer-jwt-token-2026",
            token_type: "bearer",
            expires_in: 3600,
            user: MOCK_CUSTOMER_USER,
          },
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        if (res.data?.access_token) {
          await client.setAccessToken(res.data.access_token);
        }
        return res;
      },

      async getMe(): Promise<ApiResponse<CustomerProfileData>> {
        return client.request<CustomerProfileData>(
          "/auth/customer/me",
          {
            user: MOCK_CUSTOMER_USER,
            joined_groups_count: 2,
          }
        );
      },

      async logout(): Promise<ApiResponse<{ success: boolean; message: string }>> {
        const res = await client.request<{ success: boolean; message: string }>(
          "/auth/customer/logout",
          { success: true, message: "Logged out" },
          { method: "POST" }
        );
        await client.setAccessToken(null);
        return res;
      },

      async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<{ email: string; expires_in_minutes: number }>> {
        return client.request(
          "/auth/customer/forgot-password",
          { email: payload.email, expires_in_minutes: 15 },
          { method: "POST", body: JSON.stringify(payload) }
        );
      },

      async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          "/auth/customer/reset-password",
          { success: true, message: "Password reset successfully" },
          { method: "POST", body: JSON.stringify(payload) }
        );
      },

      async verifyRequest(channel: "EMAIL" | "PHONE"): Promise<ApiResponse<{ channel: string; destination: string }>> {
        return client.request(
          "/auth/customer/verify-request",
          { channel, destination: channel === "EMAIL" ? MOCK_CUSTOMER_USER.email : MOCK_CUSTOMER_USER.phone_number },
          { method: "POST", body: JSON.stringify({ channel }) }
        );
      },

      async verifyConfirm(channel: "EMAIL" | "PHONE", code: string): Promise<ApiResponse<{ is_email_verified: boolean; is_phone_verified: boolean }>> {
        return client.request(
          "/auth/customer/verify-confirm",
          { is_email_verified: true, is_phone_verified: true },
          { method: "POST", body: JSON.stringify({ channel, code }) }
        );
      },
    },

    // Customer Profile & Personal Account
    profile: {
      async getProfile(): Promise<ApiResponse<{ user: typeof MOCK_CUSTOMER_USER; stats: CustomerProfileStats }>> {
        return client.request(
          "/customer/profile",
          {
            user: MOCK_CUSTOMER_USER,
            stats: {
              saved_vehicles_count: 2,
              joined_groups_count: 1,
              enquiries_count: 1,
              quotations_count: 2,
              appointments_count: 1,
              unread_notifications_count: 2,
            },
          }
        );
      },

      async updateProfile(payload: UpdateCustomerProfilePayload): Promise<ApiResponse<typeof MOCK_CUSTOMER_USER>> {
        return client.request(
          "/customer/profile",
          { ...MOCK_CUSTOMER_USER, ...payload },
          { method: "PUT", body: JSON.stringify(payload) }
        );
      },
    },

    // Saved Vehicles Bookmarks
    savedVehicles: {
      async getSavedVehicles(): Promise<ApiResponse<CustomerSavedVehicle[]>> {
        return client.request<CustomerSavedVehicle[]>(
          "/customer/saved-vehicles",
          [
            {
              id: "sv-001",
              user_id: "usr-cust-001",
              model_id: "mod-nexon-ev-01",
              model_name: "Tata Nexon EV",
              brand_name: "Tata Motors",
              variant_id: "var-nexev-emp-plus",
              variant_name: "Empowered Plus 45",
              fuel_type: "Electric",
              transmission: "Automatic",
              starting_price: 1449000,
              image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
              saved_at: "2026-11-05T10:00:00Z",
            },
            {
              id: "sv-002",
              user_id: "usr-cust-001",
              model_id: "mod-brezza-01",
              model_name: "Maruti Suzuki Brezza",
              brand_name: "Maruti Suzuki",
              variant_id: "var-brz-zxi-plus",
              variant_name: "ZXi Plus 1.5L AT",
              fuel_type: "Petrol",
              transmission: "Automatic",
              starting_price: 1398000,
              image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
              saved_at: "2026-11-06T12:00:00Z",
            },
          ]
        );
      },

      async saveVehicle(payload: { model_id: string; variant_id?: string }): Promise<ApiResponse<CustomerSavedVehicle>> {
        return client.request(
          "/customer/saved-vehicles",
          {
            id: `sv-${Date.now()}`,
            user_id: "usr-cust-001",
            model_id: payload.model_id,
            variant_id: payload.variant_id,
            model_name: "Vehicle",
            brand_name: "Automotive",
            starting_price: 1200000,
            image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
            saved_at: new Date().toISOString(),
          },
          { method: "POST", body: JSON.stringify(payload) }
        );
      },

      async removeSavedVehicle(vehicleId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          `/customer/saved-vehicles/${encodeURIComponent(vehicleId)}`,
          { success: true, message: "Vehicle removed from saved list" },
          { method: "DELETE" }
        );
      },
    },

    // Vehicle Comparison Sets
    comparisons: {
      async getComparisons(): Promise<ApiResponse<CustomerSavedComparison[]>> {
        return client.request<CustomerSavedComparison[]>(
          "/customer/comparisons",
          [
            {
              id: "cmp-001",
              user_id: "usr-cust-001",
              title: "Maruti Suzuki Brezza vs Hyundai Creta",
              model_ids: ["mod-brezza-01", "mod-creta-01"],
              models: [
                {
                  id: "mod-brezza-01",
                  name: "Brezza",
                  brand_name: "Maruti Suzuki",
                  image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
                  starting_price_inr: 834000,
                },
                {
                  id: "mod-creta-01",
                  name: "Creta",
                  brand_name: "Hyundai",
                  image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
                  starting_price_inr: 1099900,
                },
              ],
              created_at: "2026-11-06T14:30:00Z",
            },
          ]
        );
      },

      async saveComparison(payload: { title?: string; model_ids: string[] }): Promise<ApiResponse<CustomerSavedComparison>> {
        return client.request(
          "/customer/comparisons",
          {
            id: `cmp-${Date.now()}`,
            user_id: "usr-cust-001",
            title: payload.title || "Vehicle Comparison",
            model_ids: payload.model_ids,
            created_at: new Date().toISOString(),
          },
          { method: "POST", body: JSON.stringify(payload) }
        );
      },

      async deleteComparison(comparisonId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          `/customer/comparisons/${encodeURIComponent(comparisonId)}`,
          { success: true, message: "Comparison deleted" },
          { method: "DELETE" }
        );
      },
    },

    // Showroom Visits and Test Drive Appointments
    appointments: {
      async getAppointments(): Promise<ApiResponse<CustomerAppointment[]>> {
        return client.request<CustomerAppointment[]>(
          "/customer/appointments",
          [
            {
              id: "apt-001",
              user_id: "usr-cust-001",
              customer_name: "Rahul Menon",
              customer_phone: "+919876543210",
              customer_email: "customer@groupdrive.in",
              dealer_id: "dlr-kalyani-blr-001",
              dealership_name: "Kalyani Motors Maruti Suzuki",
              branch_id: "br-whitefield-01",
              branch_name: "Whitefield Showroom and Delivery Centre",
              model_id: "mod-brezza-01",
              model_name: "Maruti Suzuki Brezza",
              variant_name: "ZXi Plus 1.5L AT",
              appointment_type: "SHOWROOM_VISIT",
              appointment_date: "2026-11-15",
              time_slot: "11:00 AM - 12:30 PM",
              status: "CONFIRMED",
              consultant_name: "Amit Patel",
              notes: "Test drive of Automatic transmission requested.",
              created_at: "2026-11-07T10:00:00Z",
            },
          ]
        );
      },

      async bookAppointment(payload: BookAppointmentPayload): Promise<ApiResponse<CustomerAppointment>> {
        return client.request(
          "/customer/appointments",
          {
            id: `apt-${Date.now()}`,
            user_id: "usr-cust-001",
            customer_name: "Rahul Menon",
            customer_phone: "+919876543210",
            customer_email: "customer@groupdrive.in",
            dealer_id: payload.dealer_id,
            dealership_name: "Authorized Dealership Showroom",
            branch_id: payload.branch_id || "br-01",
            branch_name: "Authorized Delivery Centre",
            model_id: payload.model_id,
            model_name: payload.model_name || "Vehicle",
            variant_name: payload.variant_name,
            appointment_type: payload.appointment_type || "SHOWROOM_VISIT",
            appointment_date: payload.appointment_date,
            time_slot: payload.time_slot,
            status: "CONFIRMED",
            consultant_name: "Senior Sales Consultant",
            notes: payload.notes,
            created_at: new Date().toISOString(),
          },
          { method: "POST", body: JSON.stringify(payload) }
        );
      },

      async cancelAppointment(appointmentId: string): Promise<ApiResponse<{ status: string; message: string }>> {
        return client.request(
          `/customer/appointments/${encodeURIComponent(appointmentId)}/cancel`,
          { status: "CANCELLED", message: "Appointment cancelled" },
          { method: "POST" }
        );
      },
    },

    // Notifications & Preferences
    notifications: {
      async getNotifications(): Promise<ApiResponse<CustomerNotification[]>> {
        return client.request<CustomerNotification[]>(
          "/customer/notifications",
          [
            {
              id: "notif-001",
              user_id: "usr-cust-001",
              title: "New Quotation Received",
              message: "Pratham Motors submitted an on-road quotation of Rs 16,12,500 with Rs 73,000 total discount for Maruti Suzuki Brezza ZXi Plus.",
              type: "QUOTATION",
              is_read: false,
              action_url: "/dashboard?tab=quotations",
              created_at: "2026-11-08T11:15:00Z",
            },
            {
              id: "notif-002",
              user_id: "usr-cust-001",
              title: "Quotation Expiring Soon",
              message: "Your quote from Pratham Motors for Maruti Brezza expires in 24 hours. Accept or review before it lapses.",
              type: "QUOTATION",
              is_read: false,
              action_url: "/dashboard?tab=quotations",
              created_at: "2026-11-08T09:30:00Z",
            },
            {
              id: "notif-003",
              user_id: "usr-cust-001",
              title: "Dealer Group Offer Received",
              message: "Advaith Hyundai posted a competitive group offer with Rs 85,000 off per vehicle for Hyundai Creta SX(O).",
              type: "GROUP",
              is_read: false,
              action_url: "/groups/grp-blr-creta-01",
              created_at: "2026-11-07T16:45:00Z",
            },
            {
              id: "notif-004",
              user_id: "usr-cust-001",
              title: "Dealer Responded to Enquiry",
              message: "Trident Hyundai assigned senior specialist Ramesh K to your enquiry for Hyundai Creta SX(O). Direct contact details are available.",
              type: "ENQUIRY",
              is_read: false,
              action_url: "/dashboard?tab=enquiries",
              created_at: "2026-11-07T14:10:00Z",
            },
            {
              id: "notif-005",
              user_id: "usr-cust-001",
              title: "Showroom Appointment Confirmed",
              message: "Your test drive appointment with Kalyani Motors Whitefield is scheduled for Nov 15, 2026 at 11:00 AM.",
              type: "APPOINTMENT",
              is_read: false,
              action_url: "/dashboard?tab=appointments",
              created_at: "2026-11-07T10:00:00Z",
            },
            {
              id: "notif-006",
              user_id: "usr-cust-001",
              title: "Buyer Group Milestone Reached",
              message: "The Tata Nexon EV Mumbai Buyer Group reached 7 members! Dealership quoting has begun.",
              type: "GROUP",
              is_read: true,
              action_url: "/groups/grp-mum-nvs-01",
              created_at: "2026-11-06T18:20:00Z",
            },
            {
              id: "notif-007",
              user_id: "usr-cust-001",
              title: "Revised Dealer Quotation Received",
              message: "Kalyani Motors updated their quotation with an extra Rs 12,000 festive corporate discount.",
              type: "QUOTATION",
              is_read: true,
              action_url: "/dashboard?tab=quotations",
              created_at: "2026-11-06T15:00:00Z",
            },
            {
              id: "notif-008",
              user_id: "usr-cust-001",
              title: "Group Joined Successfully",
              message: "You successfully joined Bengaluru Creta Collective. 6 out of 10 buyers joined.",
              type: "GROUP",
              is_read: true,
              action_url: "/groups/grp-blr-creta-01",
              created_at: "2026-11-05T12:00:00Z",
            },
            {
              id: "notif-009",
              user_id: "usr-cust-001",
              title: "Enquiry Submitted",
              message: "Your purchase enquiry ENQ-2026-9041 for Hyundai Creta SX(O) has been logged and forwarded to authorized dealers.",
              type: "ENQUIRY",
              is_read: true,
              action_url: "/dashboard?tab=enquiries",
              created_at: "2026-11-05T09:15:00Z",
            },
            {
              id: "notif-010",
              user_id: "usr-cust-001",
              title: "Security Alert: New Sign-in",
              message: "New sign-in detected from GROUPDRIVE Mobile App on Android 14 in Bengaluru, India.",
              type: "SYSTEM",
              is_read: true,
              action_url: "/dashboard?tab=settings",
              created_at: "2026-11-04T08:00:00Z",
            },
          ]
        );
      },

      async markAsRead(notificationId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          `/customer/notifications/${encodeURIComponent(notificationId)}/read`,
          { success: true, message: "Notification marked as read" },
          { method: "POST" }
        );
      },

      async markAllAsRead(): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          "/customer/notifications/read-all",
          { success: true, message: "All notifications marked as read" },
          { method: "POST" }
        );
      },

      async deleteNotification(notificationId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          `/customer/notifications/${encodeURIComponent(notificationId)}`,
          { success: true, message: "Notification deleted" },
          { method: "DELETE" }
        );
      },

      async clearReadNotifications(): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          "/customer/notifications/clear-read",
          { success: true, message: "Read notifications cleared" },
          { method: "POST" }
        );
      },

      async registerPushToken(token: string, platform?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          "/customer/notifications/push-token",
          { success: true, message: "Push notification token registered securely" },
          {
            method: "POST",
            body: JSON.stringify({ token, platform: platform || "unknown" }),
          }
        );
      },

      async getPreferences(): Promise<ApiResponse<CustomerNotificationPreferences>> {
        return client.request<CustomerNotificationPreferences>(
          "/customer/notification-preferences",
          {
            email_notifications: true,
            sms_alerts: true,
            whatsapp_updates: true,
            quotation_alerts: true,
            group_milestones: true,
            promotional_offers: false,
          }
        );
      },

      async updatePreferences(payload: Partial<CustomerNotificationPreferences>): Promise<ApiResponse<CustomerNotificationPreferences>> {
        return client.request<CustomerNotificationPreferences>(
          "/customer/notification-preferences",
          {
            email_notifications: true,
            sms_alerts: true,
            whatsapp_updates: true,
            quotation_alerts: true,
            group_milestones: true,
            promotional_offers: false,
            ...payload,
          },
          { method: "PUT", body: JSON.stringify(payload) }
        );
      },
    },

    // Security & Sessions
    security: {
      async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          "/customer/change-password",
          { success: true, message: "Password updated successfully" },
          { method: "POST", body: JSON.stringify(payload) }
        );
      },

      async getSessions(): Promise<ApiResponse<CustomerSession[]>> {
        return client.request<CustomerSession[]>(
          "/customer/security/sessions",
          [
            {
              session_id: "sess-cust-01",
              user_id: "usr-cust-001",
              device: "Chrome on Windows (Current Session)",
              ip_address: "106.51.72.19",
              location: "Bengaluru, India",
              last_active: "Just now",
              is_current: true,
            },
            {
              session_id: "sess-cust-02",
              user_id: "usr-cust-001",
              device: "Safari on iPhone 15 Pro",
              ip_address: "49.37.112.45",
              location: "Bengaluru, India",
              last_active: "Yesterday at 07:15 PM",
              is_current: false,
            },
          ]
        );
      },

      async revokeOtherSessions(): Promise<ApiResponse<{ success: boolean; message: string }>> {
        return client.request(
          "/customer/security/revoke-other-sessions",
          { success: true, message: "All other device sessions terminated" },
          { method: "POST" }
        );
      },
    },

    // Vehicle Catalogue methods
    catalogue: {
      async getBrands(): Promise<ApiResponse<CatalogueBrand[]>> {
        return client.request<CatalogueBrand[]>(
          "/public/catalogue/brands",
          MOCK_CATALOGUE_BRANDS
        );
      },

      async getModels(brandId?: string): Promise<ApiResponse<CatalogueModel[]>> {
        const endpoint = brandId
          ? `/public/catalogue/models?brand_id=${encodeURIComponent(brandId)}`
          : "/public/catalogue/models";
        const fallback = brandId
          ? MOCK_CATALOGUE_MODELS.filter((m) => m.brand_id === brandId)
          : MOCK_CATALOGUE_MODELS;
        return client.request<CatalogueModel[]>(endpoint, fallback);
      },

      async getModelDetails(modelId: string): Promise<ApiResponse<PublicModelDetail>> {
        const baseModel = MOCK_CATALOGUE_MODELS.find((m) => m.id === modelId) || MOCK_CATALOGUE_MODELS[0];
        const variants = MOCK_CATALOGUE_VARIANTS.filter((v) => v.model_id === modelId);
        const fallback: PublicModelDetail = {
          ...baseModel,
          variants: variants.length > 0 ? variants : MOCK_CATALOGUE_VARIANTS.slice(0, 2),
        };
        return client.request<PublicModelDetail>(
          `/public/catalogue/models/${encodeURIComponent(modelId)}`,
          fallback
        );
      },

      async getVariants(
        modelId?: string,
        fuelType?: string,
        transmission?: string
      ): Promise<ApiResponse<CatalogueVariant[]>> {
        const params = new URLSearchParams();
        if (modelId) params.set("model_id", modelId);
        if (fuelType) params.set("fuel_type", fuelType);
        if (transmission) params.set("transmission", transmission);
        const query = params.toString() ? `?${params.toString()}` : "";

        let fallback = MOCK_CATALOGUE_VARIANTS;
        if (modelId) fallback = fallback.filter((v) => v.model_id === modelId);
        if (fuelType) fallback = fallback.filter((v) => v.fuel_type.toLowerCase() === fuelType.toLowerCase());
        if (transmission) fallback = fallback.filter((v) => v.transmission_type.toLowerCase() === transmission.toLowerCase());

        return client.request<CatalogueVariant[]>(
          `/public/catalogue/variants${query}`,
          fallback
        );
      },

      async getVariantDetails(variantId: string): Promise<ApiResponse<CatalogueVariant>> {
        const fallback =
          MOCK_CATALOGUE_VARIANTS.find((v) => v.id === variantId) ||
          MOCK_CATALOGUE_VARIANTS[0];
        return client.request<CatalogueVariant>(
          `/public/catalogue/variants/${encodeURIComponent(variantId)}`,
          fallback
        );
      },
    },

    // Buyer Groups methods
    groups: {
      async listGroups(
        city?: string,
        modelId?: string,
        status?: string
      ): Promise<ApiResponse<PublicBuyerGroupItem[]>> {
        const params = new URLSearchParams();
        if (city && city.toLowerCase() !== "all") params.set("city", city);
        if (modelId && modelId.toLowerCase() !== "all") params.set("model_id", modelId);
        if (status && status.toLowerCase() !== "all") params.set("status", status);
        const query = params.toString() ? `?${params.toString()}` : "";

        let fallback = MOCK_PUBLIC_BUYER_GROUPS;
        if (city && city.toLowerCase() !== "all") {
          fallback = fallback.filter((g) => g.city.toLowerCase() === city.toLowerCase());
        }
        if (modelId && modelId.toLowerCase() !== "all") {
          fallback = fallback.filter((g) => g.model_id === modelId);
        }
        if (status && status.toLowerCase() !== "all") {
          fallback = fallback.filter((g) => g.status === status);
        }

        return client.request<PublicBuyerGroupItem[]>(
          `/public/groups${query}`,
          fallback
        );
      },

      async getGroupDetails(groupId: string): Promise<ApiResponse<PublicBuyerGroupDetail>> {
        const baseGroup =
          MOCK_PUBLIC_BUYER_GROUPS.find((g) => g.id === groupId) ||
          MOCK_PUBLIC_BUYER_GROUPS[0];

        const enrichedFallback: PublicBuyerGroupDetail = {
          ...baseGroup,
          participating_dealers_count: baseGroup.status === "OPEN_FOR_QUOTES" ? 2 : 0,
          dealer_offers:
            baseGroup.status === "OPEN_FOR_QUOTES"
              ? [
                  {
                    id: "off-001",
                    dealer_id: "dlr-kalyani-blr-001",
                    dealer_name: "Kalyani Motors Maruti Suzuki",
                    branch_name: "Whitefield Showroom and Delivery Centre",
                    offer_type: "BINDING_QUOTATION",
                    status: "SUBMITTED",
                    estimated_delivery_days: 12,
                    delivery_timeline_days: 12,
                    stock_allocation_commitment: 5,
                    proposed_benefits:
                      "Priority vehicle allotment from ready Bangalore stockyard. Free 3-year mechanical warranty extension and complimentary Teflon paint protection coating.",
                    total_discounts_inr: (baseGroup.estimated_savings_inr || 45000) + 5000,
                    net_on_road_price: 1395000,
                    terms_and_conditions:
                      "Valid for group delivery within 14 calendar days of cluster closure. Delivery at Whitefield showroom.",
                    valid_until: "2026-11-25T23:59:59Z",
                    created_at: "2026-11-06T10:45:00Z",
                  },
                  {
                    id: "off-002",
                    dealer_id: "dlr-pratham-blr-006",
                    dealer_name: "Pratham Motors Maruti Suzuki Nexa",
                    branch_name: "Bellandur Experience Lounge",
                    offer_type: "BINDING_QUOTATION",
                    status: "SUBMITTED",
                    estimated_delivery_days: 10,
                    delivery_timeline_days: 10,
                    stock_allocation_commitment: 6,
                    proposed_benefits:
                      "10-day expedited delivery with free genuine Nexa 7-piece styling package, ceramic exterior finish, and zero documentation handling fees.",
                    total_discounts_inr: (baseGroup.estimated_savings_inr || 45000) + 8000,
                    net_on_road_price: 1392000,
                    terms_and_conditions:
                      "Priority allotment from central stockyard. Applicable on retail delivery in Bangalore RTO.",
                    valid_until: "2026-11-24T23:59:59Z",
                    created_at: "2026-11-06T11:15:00Z",
                  },
                ]
              : [],
          activity_timeline: [
            {
              id: "act-01",
              type: "FORMATION",
              title: "Demand Cluster Initialized",
              description: `${baseGroup.city} collective buyer cluster registered for ${baseGroup.model_name}.`,
              timestamp: "2026-11-02T09:30:00Z",
            },
            {
              id: "act-02",
              type: "MILESTONE",
              title: "Minimum Bidding Threshold Reached",
              description: `Reached ${baseGroup.min_members_threshold} verified buyers. Reverse auction automatically opened for authorized OEM dealerships.`,
              timestamp: "2026-11-04T12:00:00Z",
            },
            ...(baseGroup.status === "OPEN_FOR_QUOTES"
              ? [
                  {
                    id: "act-03",
                    type: "DEALER_OFFER" as const,
                    title: "Kalyani Motors Submitted Competitive Quotation",
                    description: `Offered institutional group discount of Rs ${(baseGroup.estimated_savings_inr || 45000) + 5000} with 12-day delivery commitment.`,
                    timestamp: "2026-11-06T10:45:00Z",
                  },
                  {
                    id: "act-04",
                    type: "DEALER_OFFER" as const,
                    title: "Pratham Motors Submitted Competitive Quotation",
                    description: `Offered institutional group discount of Rs ${(baseGroup.estimated_savings_inr || 45000) + 8000} with 10-day priority delivery.`,
                    timestamp: "2026-11-06T11:15:00Z",
                  },
                ]
              : []),
          ],
          user_participation:
            baseGroup.id === "grp-blr-brz-04"
              ? {
                  has_joined: true,
                  membership_id: "mem-001",
                  status: "CONFIRMED",
                  preferred_variant: "ZXi Plus 1.5L AT",
                  preferred_colour: "Pearl Arctic White",
                  joined_at: "2026-11-04T12:00:00Z",
                }
              : {
                  has_joined: false,
                },
        };

        return client.request<PublicBuyerGroupDetail>(
          `/public/groups/${encodeURIComponent(groupId)}`,
          enrichedFallback
        );
      },

      async leaveGroup(groupId: string): Promise<ApiResponse<{ message: string }>> {
        return client.request<{ message: string }>(
          `/customer/groups/${encodeURIComponent(groupId)}/leave`,
          { message: "Successfully withdrawn from buyer group." },
          {
            method: "POST",
          }
        );
      },

      async joinGroup(
        groupId: string,
        payload: JoinBuyerGroupPayload
      ): Promise<
        ApiResponse<{
          membership: CustomerGroupMembership;
          group: PublicBuyerGroupItem;
          estimated_savings_inr: number;
        }>
      > {
        const targetGroup =
          MOCK_PUBLIC_BUYER_GROUPS.find((g) => g.id === groupId) ||
          MOCK_PUBLIC_BUYER_GROUPS[0];
        const fallbackMembership: CustomerGroupMembership = {
          id: `mem-${Date.now().toString(36)}`,
          user_id: "usr-cust-001",
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          customer_email: payload.customer_email,
          group_id: groupId,
          group_code: targetGroup.group_code,
          model_name: targetGroup.model_name,
          variant_name: payload.preferred_variant || "Standard Option",
          colour_preference: payload.preferred_colour || "Flexible",
          city: payload.city || targetGroup.city,
          status: "CONFIRMED",
          joined_at: new Date().toISOString(),
        };

        return client.request(
          `/customer/groups/${encodeURIComponent(groupId)}/join`,
          {
            membership: fallbackMembership,
            group: targetGroup,
            estimated_savings_inr: targetGroup.estimated_savings_inr || 45000,
          },
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      },

      async createGroupDemand(payload: CreateGroupDemandPayload): Promise<ApiResponse<any>> {
        return client.request(
          "/customer/groups/demand",
          {
            id: `dem-${Date.now().toString(36)}`,
            model_name: payload.model_name,
            city: payload.city,
            status: "REGISTERED",
          },
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      },

      async getMyGroups(): Promise<ApiResponse<JoinedGroupDetail[]>> {
        const fallback: JoinedGroupDetail[] = [
          {
            membership: {
              id: "mem-001",
              user_id: "usr-cust-001",
              customer_name: "Rahul Menon",
              customer_phone: "+919876543210",
              customer_email: "customer@groupdrive.in",
              group_id: "grp-blr-brz-04",
              group_code: "GD-BLR-BRZ-04",
              model_name: "Maruti Suzuki Brezza",
              variant_name: "ZXi Plus 1.5L AT",
              colour_preference: "Pearl Arctic White",
              city: "Bengaluru",
              status: "CONFIRMED",
              joined_at: "2026-11-04T12:00:00Z",
            },
            group_details: MOCK_PUBLIC_BUYER_GROUPS[0],
          },
        ];
        return client.request<JoinedGroupDetail[]>("/customer/my-groups", fallback);
      },
    },

    // Enquiries and Test Drive bookings
    enquiries: {
      async submitEnquiry(payload: CustomerEnquiryPayload): Promise<ApiResponse<CustomerEnquiryResult>> {
        return client.request<CustomerEnquiryResult>(
          "/customer/enquiries",
          {
            enquiry_id: `lead-mock-${Date.now().toString(36)}`,
            dealership_name: "Kalyani Motors Maruti Suzuki",
            branch_id: "br-whitefield-01",
            status: "RECEIVED",
            message: "Your enquiry has been assigned to an authorized dealer consultant who will contact you shortly.",
          },
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      },

      async getMyEnquiries(): Promise<ApiResponse<CustomerEnquiryRecord[]>> {
        const fallback: CustomerEnquiryRecord[] = [
          {
            id: "lead-cust-001",
            dealer_id: "dlr-kalyani-blr-001",
            dealership_name: "Kalyani Motors Maruti Suzuki",
            branch_id: "br-whitefield-01",
            branch_name: "Whitefield Showroom and Delivery Centre",
            customer_name: "Rahul Menon",
            customer_phone: "+919876543210",
            customer_email: "customer@groupdrive.in",
            city: "Bengaluru",
            preferred_contact_method: "PHONE",
            brand_name: "Maruti Suzuki",
            model_name: "Brezza",
            variant_name: "ZXi Plus 1.5L AT",
            fuel_type: "Petrol",
            transmission: "Automatic",
            colour_preference: "Pearl Arctic White",
            purchase_timeline: "WITHIN_15_DAYS",
            financing_preference: "LOAN",
            source: "WEBSITE_DIRECT",
            status: "QUOTATION_SENT",
            quotations_count: 2,
            created_at: "2026-11-06T09:00:00Z",
            updated_at: "2026-11-06T10:30:00Z",
          },
        ];
        return client.request<CustomerEnquiryRecord[]>("/customer/my-enquiries", fallback);
      },
    },

    // Customer received dealer quotations
    quotations: {
      async getMyQuotations(): Promise<ApiResponse<CustomerQuotationRecord[]>> {
        const fallback: CustomerQuotationRecord[] = [
          {
            id: "qte-cust-001",
            quotation_number: "GD-QTE-2026-088",
            lead_id: "lead-cust-001",
            group_id: null,
            group_code: null,
            dealer_id: "dlr-kalyani-blr-001",
            dealer_name: "Kalyani Motors Maruti Suzuki",
            branch_id: "br-whitefield-01",
            branch_name: "Whitefield Showroom and Delivery Centre",
            model_id: "mod-brezza-01",
            model_name: "Maruti Suzuki Brezza",
            variant_id: "var-brz-zxi-plus",
            variant_name: "ZXi Plus 1.5L AT",
            fuel_type: "Petrol",
            transmission: "Automatic",
            colour: "Pearl Arctic White",
            pricing: {
              ex_showroom_price: 1398000,
              rto_road_tax: 195720,
              insurance_amount: 48500,
              fastag_charges: 500,
              tcs_amount: 13980,
              accessories_amount: 15000,
              extended_warranty_amount: 18500,
              other_charges: 1500,
              gross_on_road_price: 1691700,
              dealer_discount: 42000,
              manufacturer_offer: 25000,
              exchange_bonus: 0,
              total_discounts: 67000,
              final_on_road_price: 1624700,
            },
            net_on_road_price: 1624700,
            delivery_timeline_days: 12,
            dealership_terms: "Valid for retail delivery within 12 calendar days. Includes complimentary 3-year mechanical warranty extension, FASTag RFID activation, and ceramic exterior protection coating.",
            quotation_status: "SUBMITTED",
            valid_until: "2026-11-25T23:59:59Z",
            version: 1,
            created_at: "2026-11-06T10:45:00Z",
          },
          {
            id: "qte-cust-002",
            quotation_number: "GD-QTE-2026-089",
            lead_id: "lead-cust-001",
            group_id: null,
            group_code: null,
            dealer_id: "dlr-pratham-blr-006",
            dealer_name: "Pratham Motors Maruti Suzuki Nexa",
            branch_id: "br-pratham-bellandur-01",
            branch_name: "Pratham Nexa Bellandur Experience Lounge",
            model_id: "mod-brezza-01",
            model_name: "Maruti Suzuki Brezza",
            variant_id: "var-brz-zxi-plus",
            variant_name: "ZXi Plus 1.5L AT",
            fuel_type: "Petrol",
            transmission: "Automatic",
            colour: "Pearl Arctic White",
            pricing: {
              ex_showroom_price: 1398000,
              rto_road_tax: 195720,
              insurance_amount: 46800,
              fastag_charges: 500,
              tcs_amount: 13980,
              accessories_amount: 12000,
              extended_warranty_amount: 18500,
              other_charges: 0,
              gross_on_road_price: 1685500,
              dealer_discount: 48000,
              manufacturer_offer: 25000,
              exchange_bonus: 0,
              total_discounts: 73000,
              final_on_road_price: 1612500,
            },
            net_on_road_price: 1612500,
            delivery_timeline_days: 10,
            dealership_terms: "Priority yard dispatch with free genuine Nexa 7-piece styling package and zero documentation charges.",
            quotation_status: "SUBMITTED",
            valid_until: "2026-11-24T23:59:59Z",
            version: 1,
            created_at: "2026-11-06T11:15:00Z",
          },
        ];
        return client.request<CustomerQuotationRecord[]>("/customer/my-quotations", fallback);
      },

      async getQuotationDetails(quotationId: string): Promise<ApiResponse<CustomerQuotationRecord>> {
        const myQuotes = await this.getMyQuotations();
        const found = myQuotes.data?.find((q) => q.id === quotationId) || myQuotes.data?.[0];
        return client.request<CustomerQuotationRecord>(
          `/customer/my-quotations/${encodeURIComponent(quotationId)}`,
          found
        );
      },

      async acceptQuotation(quotationId: string): Promise<ApiResponse<{ quotation_id: string; status: string; message: string }>> {
        return client.request(
          `/customer/my-quotations/${encodeURIComponent(quotationId)}/accept`,
          {
            quotation_id: quotationId,
            status: "ACCEPTED",
            message: "You have accepted this quotation. The dealership will prepare handover paperwork and contact you.",
          },
          { method: "POST" }
        );
      },

      async rejectQuotation(quotationId: string): Promise<ApiResponse<{ quotation_id: string; status: string }>> {
        return client.request(
          `/customer/my-quotations/${encodeURIComponent(quotationId)}/reject`,
          {
            quotation_id: quotationId,
            status: "REJECTED",
          },
          { method: "POST" }
        );
      },
    },

    // Promotional campaigns
    campaigns: {
      async listCampaigns(city?: string): Promise<ApiResponse<DealerCampaign[]>> {
        const endpoint = city
          ? `/public/campaigns?city=${encodeURIComponent(city)}`
          : "/public/campaigns";
        return client.request<DealerCampaign[]>(endpoint, MOCK_PUBLIC_CAMPAIGNS);
      },
    },

    // Authorized dealership network
    dealers: {
      async listDealers(params?: {
        search?: string;
        city?: string;
        brand?: string;
        area?: string;
      }): Promise<ApiResponse<PublicDealerSummary[]>> {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append("search", params.search);
        if (params?.city && params.city !== "ALL") queryParams.append("city", params.city);
        if (params?.brand && params.brand !== "ALL") queryParams.append("brand", params.brand);
        if (params?.area) queryParams.append("area", params.area);
        const qs = queryParams.toString();
        const endpoint = qs ? `/public/dealers?${qs}` : "/public/dealers";
        return client.request<PublicDealerSummary[]>(
          endpoint,
          MOCK_AUTHORIZED_DEALERS as unknown as PublicDealerSummary[]
        );
      },

      async getDealerDetails(dealerId: string): Promise<ApiResponse<PublicDealerDetail>> {
        const found = MOCK_AUTHORIZED_DEALERS.find((d) => d.id === dealerId) || MOCK_AUTHORIZED_DEALERS[0];
        const fallbackDetail: PublicDealerDetail = {
          ...found,
          is_verified: found.kyc_status === "VERIFIED",
          available_inventory_count: 5,
          active_offers_count: 2,
          city: found.branches?.[0]?.city || "Bengaluru",
          directions_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(found.trade_name + " " + found.registered_office_address)}`,
          branches: (found.branches || []).map((b) => ({
            id: b.id,
            branch_name: b.branch_name,
            branch_type: "SHOWROOM_AND_SERVICE",
            address_line1: b.address_line1,
            city: b.city,
            state: "Karnataka",
            pin_code: "560001",
            authorized_rto_codes: ["KA-01", "KA-03"],
            phone_number: b.phone_number,
            email: found.primary_contact_email,
            operating_hours: found.operating_hours,
            directions_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.branch_name + " " + b.address_line1 + " " + b.city)}`,
          })),
          available_vehicles: [
            {
              id: "inv-demo-01",
              model_id: "mod-brezza-01",
              model_name: "Brezza",
              variant_id: "var-brz-zxi-plus",
              variant_name: "ZXi Plus 1.5L AT",
              fuel_type: "Petrol",
              transmission_type: "Automatic",
              colour_name: "Pearl Arctic White",
              ex_showroom_price: 1398000,
              status: "IN_STOCK",
              branch_name: found.branches?.[0]?.branch_name || "Authorized Showroom",
              vehicle_image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
              is_available_for_group_buy: true,
            },
          ],
          published_offers: [
            {
              id: "cmp-demo-01",
              title: "Festive Season Flash Offer",
              description: "Upfront price discount with free corporate styling pack and 3-year warranty.",
              campaign_type: "CASH_DISCOUNT",
              status: "ACTIVE",
              eligible_models: ["Brezza", "Creta"],
              discount_amount: 45000,
              free_accessories_description: "Chrome styling kit and 3D mats",
              terms_and_conditions: "Valid for retail deliveries within campaign window.",
              valid_until: "2026-12-31T23:59:59Z",
              is_sponsored: true,
            },
          ],
          active_groups: [
            {
              id: "grp-blr-brz-04",
              group_code: "GD-BLR-BRZ-04",
              model_name: "Maruti Suzuki Brezza",
              city: "Bengaluru",
              status: "OPEN_FOR_QUOTES",
              current_members_count: 7,
              max_capacity: 10,
              quoting_deadline: "2026-11-15T18:00:00Z",
            },
          ],
        };
        return client.request<PublicDealerDetail>(
          `/public/dealers/${encodeURIComponent(dealerId)}`,
          fallbackDetail
        );
      },
    },

    // Public real-time vehicle inventory
    inventory: {
      async listAvailableVehicles(params?: {
        model_id?: string;
        variant_id?: string;
        dealer_id?: string;
        city?: string;
        fuel_type?: string;
        transmission?: string;
      }): Promise<ApiResponse<Array<{
        id: string;
        dealer_id: string;
        dealership_name: string;
        branch_id: string;
        branch_name: string;
        city: string;
        brand_name: string;
        model_id: string;
        model_name: string;
        variant_id: string;
        variant_name: string;
        fuel_type: string;
        transmission_type: string;
        colour_name: string;
        stock_quantity: number;
        status: string;
        ex_showroom_price: number;
        vehicle_image_url?: string;
        is_available_for_group_buy: boolean;
        is_available_for_flash_sale: boolean;
        days_in_yard: number;
        updated_at?: string;
      }>>> {
        const queryParams = new URLSearchParams();
        if (params?.model_id) queryParams.append("model_id", params.model_id);
        if (params?.variant_id) queryParams.append("variant_id", params.variant_id);
        if (params?.dealer_id) queryParams.append("dealer_id", params.dealer_id);
        if (params?.city && params.city !== "ALL") queryParams.append("city", params.city);
        if (params?.fuel_type && params.fuel_type !== "ALL") queryParams.append("fuel_type", params.fuel_type);
        if (params?.transmission && params.transmission !== "ALL") queryParams.append("transmission", params.transmission);
        const qs = queryParams.toString();
        const endpoint = qs ? `/public/inventory?${qs}` : "/public/inventory";
        return client.request(endpoint, []);
      },
    },
  };
}

// Default pre-instantiated singleton for customer applications
export const customerApi = createCustomerApiClient();

