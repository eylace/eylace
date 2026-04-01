export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          ip_address: string | null
          landing_page: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          order_id: string | null
          order_total: number
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          order_total?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          admin_notes: string | null
          commission_rate: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          referral_code: string
          status: string
          total_clicks: number | null
          total_conversions: number | null
          total_earnings: number | null
          total_paid: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          referral_code: string
          status?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings?: number | null
          total_paid?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          referral_code?: string
          status?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings?: number | null
          total_paid?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      bulk_sms_campaigns: {
        Row: {
          audience: string
          created_at: string
          id: string
          message: string | null
          recipients: number
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          message?: string | null
          recipients?: number
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          message?: string | null
          recipients?: number
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_discounts: {
        Row: {
          category_id: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_discounts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      colors: {
        Row: {
          created_at: string
          hex_code: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          hex_code?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          hex_code?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      couriers: {
        Row: {
          base_cost: number | null
          code: string
          created_at: string
          delivery_zones: Json | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          tracking_url_template: string | null
          updated_at: string
        }
        Insert: {
          base_cost?: number | null
          code: string
          created_at?: string
          delivery_zones?: Json | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          tracking_url_template?: string | null
          updated_at?: string
        }
        Update: {
          base_cost?: number | null
          code?: string
          created_at?: string
          delivery_zones?: Json | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          tracking_url_template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_active: boolean
          message: string | null
          placement: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string | null
          placement?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string | null
          placement?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_sell_alerts: {
        Row: {
          created_at: string
          discount_code: string | null
          id: string
          is_active: boolean
          message: string | null
          min_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_code?: string | null
          id?: string
          is_active?: boolean
          message?: string | null
          min_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_code?: string | null
          id?: string
          is_active?: boolean
          message?: string | null
          min_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dynamic_popups: {
        Row: {
          content: string | null
          created_at: string
          delay_seconds: number
          id: string
          is_active: boolean
          title: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          delay_seconds?: number
          id?: string
          is_active?: boolean
          title: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          delay_seconds?: number
          id?: string
          is_active?: boolean
          title?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      flash_deal_products: {
        Row: {
          created_at: string
          deal_discount: number | null
          deal_price: number | null
          flash_deal_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          deal_discount?: number | null
          deal_price?: number | null
          flash_deal_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          deal_discount?: number | null
          deal_price?: number | null
          flash_deal_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_deal_products_flash_deal_id_fkey"
            columns: ["flash_deal_id"]
            isOneToOne: false
            referencedRelation: "flash_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_deals: {
        Row: {
          created_at: string
          discount: number
          end_date: string | null
          id: string
          is_active: boolean
          products: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          products?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number
          end_date?: string | null
          id?: string
          is_active?: boolean
          products?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      incomplete_orders: {
        Row: {
          address: string | null
          cart_items: Json | null
          cart_total: number | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          session_id: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          session_id?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          session_id?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      marketing_email_templates: {
        Row: {
          body: string | null
          created_at: string
          id: string
          name: string
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          name: string
          subject: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          name: string | null
          source: string | null
          status: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          content: string | null
          created_at: string
          id: string
          recipients: number
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          recipients?: number
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          recipients?: number
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          variations: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          product_image?: string | null
          product_name: string
          quantity: number
          variations?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          variations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking_events: {
        Row: {
          created_at: string
          description: string
          id: string
          location: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          location?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          discount: number
          estimated_delivery: string | null
          id: string
          order_number: string
          payment_method: string
          shipped_at: string | null
          shipping: number
          shipping_address: Json | null
          status: string
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          discount?: number
          estimated_delivery?: string | null
          id?: string
          order_number: string
          payment_method: string
          shipped_at?: string | null
          shipping?: number
          shipping_address?: Json | null
          status?: string
          subtotal: number
          tax?: number
          total: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          discount?: number
          estimated_delivery?: string | null
          id?: string
          order_number?: string
          payment_method?: string
          shipped_at?: string | null
          shipping?: number
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          max_attempts: number
          phone: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
          max_attempts?: number
          phone: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          max_attempts?: number
          phone?: string
        }
        Relationships: []
      }
      otp_sms_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          name: string
          template_key: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          name: string
          template_key: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          name?: string
          template_key?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          module: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          module: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          module?: string
        }
        Relationships: []
      }
      preorder_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          paid_at: string | null
          preorder_order_id: string
          seller_id: string
          status: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          preorder_order_id: string
          seller_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          preorder_order_id?: string
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_commissions_preorder_order_id_fkey"
            columns: ["preorder_order_id"]
            isOneToOne: false
            referencedRelation: "preorder_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorder_commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorder_commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_conversations: {
        Row: {
          created_at: string
          id: string
          message: string
          preorder_product_id: string
          seller_id: string
          sender_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          preorder_product_id: string
          seller_id: string
          sender_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          preorder_product_id?: string
          seller_id?: string
          sender_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_conversations_preorder_product_id_fkey"
            columns: ["preorder_product_id"]
            isOneToOne: false
            referencedRelation: "preorder_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorder_conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorder_conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      preorder_notification_types: {
        Row: {
          created_at: string
          description: string | null
          email_enabled: boolean
          id: string
          is_active: boolean
          name: string
          push_enabled: boolean
          slug: string
          sms_enabled: boolean
          template: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email_enabled?: boolean
          id?: string
          is_active?: boolean
          name: string
          push_enabled?: boolean
          slug: string
          sms_enabled?: boolean
          template?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email_enabled?: boolean
          id?: string
          is_active?: boolean
          name?: string
          push_enabled?: boolean
          slug?: string
          sms_enabled?: boolean
          template?: string | null
        }
        Relationships: []
      }
      preorder_orders: {
        Row: {
          advance_paid: number
          created_at: string
          id: string
          order_number: string
          payment_method: string
          preorder_product_id: string
          quantity: number
          remaining_amount: number
          shipping_address: Json | null
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_paid?: number
          created_at?: string
          id?: string
          order_number: string
          payment_method?: string
          preorder_product_id: string
          quantity?: number
          remaining_amount?: number
          shipping_address?: Json | null
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_paid?: number
          created_at?: string
          id?: string
          order_number?: string
          payment_method?: string
          preorder_product_id?: string
          quantity?: number
          remaining_amount?: number
          shipping_address?: Json | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_orders_preorder_product_id_fkey"
            columns: ["preorder_product_id"]
            isOneToOne: false
            referencedRelation: "preorder_products"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_products: {
        Row: {
          advance_amount: number
          advance_type: string
          created_at: string
          estimated_delivery: string | null
          id: string
          max_quantity: number
          preorder_price: number
          product_id: string
          status: string
          updated_at: string
        }
        Insert: {
          advance_amount?: number
          advance_type?: string
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          max_quantity?: number
          preorder_price?: number
          product_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          advance_amount?: number
          advance_type?: string
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          max_quantity?: number
          preorder_price?: number
          product_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorder_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_queries: {
        Row: {
          answer: string | null
          answered_at: string | null
          created_at: string
          id: string
          preorder_product_id: string
          question: string
          status: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          preorder_product_id: string
          question: string
          status?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          id?: string
          preorder_product_id?: string
          question?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_queries_preorder_product_id_fkey"
            columns: ["preorder_product_id"]
            isOneToOne: false
            referencedRelation: "preorder_products"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          images: string[] | null
          preorder_product_id: string
          rating: number
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          preorder_product_id: string
          rating?: number
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          preorder_product_id?: string
          rating?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_reviews_preorder_product_id_fkey"
            columns: ["preorder_product_id"]
            isOneToOne: false
            referencedRelation: "preorder_products"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          values: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          values?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          values?: string[]
        }
        Relationships: []
      }
      product_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          content: string
          created_at: string
          helpful_count: number | null
          id: string
          images: string[] | null
          product_id: string
          rating: number
          title: string
          updated_at: string
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          product_id: string
          rating: number
          title: string
          updated_at?: string
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          product_id?: string
          rating?: number
          title?: string
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          attributes: Json | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          digital_file_url: string | null
          discount: number | null
          flash_sale_ends: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_digital: boolean | null
          is_flash_sale: boolean | null
          is_free_shipping: boolean | null
          is_prime: boolean | null
          label_id: string | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          seller_id: string | null
          slug: string
          stock: number | null
          updated_at: string
          variations: Json | null
          warranty_id: string | null
        }
        Insert: {
          attributes?: Json | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          discount?: number | null
          flash_sale_ends?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_flash_sale?: boolean | null
          is_free_shipping?: boolean | null
          is_prime?: boolean | null
          label_id?: string | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          review_count?: number | null
          seller_id?: string | null
          slug: string
          stock?: number | null
          updated_at?: string
          variations?: Json | null
          warranty_id?: string | null
        }
        Update: {
          attributes?: Json | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          digital_file_url?: string | null
          discount?: number | null
          flash_sale_ends?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_flash_sale?: boolean | null
          is_free_shipping?: boolean | null
          is_prime?: boolean | null
          label_id?: string | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          seller_id?: string | null
          slug?: string
          stock?: number | null
          updated_at?: string
          variations?: Json | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "product_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          apartment: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          apartment?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          apartment?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          audience: string
          created_at: string
          id: string
          message: string | null
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      return_requests: {
        Row: {
          acknowledgement_data: Json | null
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          order_id: string
          order_item_id: string | null
          reason: string
          refund_amount: number | null
          refund_method: string | null
          resolved_at: string | null
          return_tracking_number: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledgement_data?: Json | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          order_id: string
          order_item_id?: string | null
          reason: string
          refund_amount?: number | null
          refund_method?: string | null
          resolved_at?: string | null
          return_tracking_number?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledgement_data?: Json | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          order_id?: string
          order_item_id?: string | null
          reason?: string
          refund_amount?: number | null
          refund_method?: string | null
          resolved_at?: string | null
          return_tracking_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      saved_cart: {
        Row: {
          id: string
          items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_applications: {
        Row: {
          admin_notes: string | null
          business_type: string | null
          created_at: string
          fulfillment_type: string
          id: string
          phone: string | null
          status: string
          store_description: string | null
          store_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_type?: string | null
          created_at?: string
          fulfillment_type?: string
          id?: string
          phone?: string | null
          status?: string
          store_description?: string | null
          store_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_type?: string | null
          created_at?: string
          fulfillment_type?: string
          id?: string
          phone?: string | null
          status?: string
          store_description?: string | null
          store_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_commission_config: {
        Row: {
          category_id: string | null
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          is_active: boolean
          seller_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          seller_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_commission_config_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_commission_config_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_commission_config_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_packages: {
        Row: {
          commission_rate: number
          created_at: string
          description: string | null
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string
          price: number
          product_limit: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price?: number
          product_limit?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          product_limit?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      seller_payout_requests: {
        Row: {
          account_details: Json | null
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          account_details?: Json | null
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_details?: Json | null
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_payout_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_payout_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          payment_method: string
          reference_number: string | null
          seller_id: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          reference_number?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          reference_number?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_verification_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          options: Json | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          sort_order?: number
        }
        Relationships: []
      }
      sellers: {
        Row: {
          created_at: string
          fulfillment_type: string
          id: string
          is_verified: boolean | null
          logo: string | null
          name: string
          rating: number | null
          slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fulfillment_type?: string
          id?: string
          is_verified?: boolean | null
          logo?: string | null
          name: string
          rating?: number | null
          slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fulfillment_type?: string
          id?: string
          is_verified?: boolean | null
          logo?: string | null
          name?: string
          rating?: number | null
          slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      size_guides: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          measurements: Json
          name: string
          sizes: Json
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          measurements?: Json
          name: string
          sizes?: Json
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          measurements?: Json
          name?: string
          sizes?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_guides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warranties: {
        Row: {
          created_at: string
          description: string | null
          duration: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_data: Json
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_data: Json
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_data?: Json
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      preorder_reviews_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          images: string[] | null
          preorder_product_id: string | null
          rating: number | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          images?: string[] | null
          preorder_product_id?: string | null
          rating?: number | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          images?: string[] | null
          preorder_product_id?: string | null
          rating?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preorder_reviews_preorder_product_id_fkey"
            columns: ["preorder_product_id"]
            isOneToOne: false
            referencedRelation: "preorder_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews_public: {
        Row: {
          content: string | null
          created_at: string | null
          helpful_count: number | null
          id: string | null
          images: string[] | null
          product_id: string | null
          rating: number | null
          title: string | null
          updated_at: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string | null
          images?: string[] | null
          product_id?: string | null
          rating?: number | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string | null
          images?: string[] | null
          product_id?: string | null
          rating?: number | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: []
      }
      products_public: {
        Row: {
          attributes: Json | null
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          discount: number | null
          flash_sale_ends: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          is_digital: boolean | null
          is_flash_sale: boolean | null
          is_free_shipping: boolean | null
          is_prime: boolean | null
          label_id: string | null
          name: string | null
          original_price: number | null
          price: number | null
          rating: number | null
          review_count: number | null
          seller_id: string | null
          slug: string | null
          stock: number | null
          updated_at: string | null
          variations: Json | null
          warranty_id: string | null
        }
        Insert: {
          attributes?: Json | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          discount?: number | null
          flash_sale_ends?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_flash_sale?: boolean | null
          is_free_shipping?: boolean | null
          is_prime?: boolean | null
          label_id?: string | null
          name?: string | null
          original_price?: number | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          seller_id?: string | null
          slug?: string | null
          stock?: number | null
          updated_at?: string | null
          variations?: Json | null
          warranty_id?: string | null
        }
        Update: {
          attributes?: Json | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          discount?: number | null
          flash_sale_ends?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_digital?: boolean | null
          is_flash_sale?: boolean | null
          is_free_shipping?: boolean | null
          is_prime?: boolean | null
          label_id?: string | null
          name?: string | null
          original_price?: number | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          seller_id?: string | null
          slug?: string | null
          stock?: number | null
          updated_at?: string | null
          variations?: Json | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "product_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_applications_safe: {
        Row: {
          business_type: string | null
          created_at: string | null
          id: string | null
          phone: string | null
          status: string | null
          store_description: string | null
          store_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string | null
          id?: string | null
          phone?: string | null
          status?: string | null
          store_description?: string | null
          store_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string | null
          id?: string | null
          phone?: string | null
          status?: string | null
          store_description?: string | null
          store_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sellers_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          logo: string | null
          name: string | null
          rating: number | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo?: string | null
          name?: string | null
          rating?: number | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          logo?: string | null
          name?: string | null
          rating?: number | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_of_order: { Args: { order_id: string }; Returns: boolean }
      is_owner_of_order_tracking: {
        Args: { tracking_order_id: string }
        Returns: boolean
      }
      lookup_coupon: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          max_discount: number
          min_order_amount: number
          usage_limit: number
          used_count: number
        }[]
      }
      lookup_return_by_tracking: {
        Args: { tracking_number: string }
        Returns: {
          created_at: string
          reason: string
          refund_amount: number
          refund_method: string
          resolved_at: string
          return_tracking_number: string
          status: string
          updated_at: string
        }[]
      }
      record_coupon_usage: {
        Args: {
          _coupon_id: string
          _discount_amount: number
          _order_id: string
        }
        Returns: undefined
      }
      seller_safe_update: {
        Args: { _logo?: string; _name?: string; _slug?: string }
        Returns: undefined
      }
      user_cancel_order: { Args: { _order_id: string }; Returns: boolean }
      user_update_review: {
        Args: {
          _content?: string
          _images?: string[]
          _rating?: number
          _review_id: string
          _title?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "product_manager"
        | "order_manager"
        | "vendor_manager"
        | "customer_manager"
        | "content_manager"
        | "marketing_manager"
        | "finance_manager"
        | "support_manager"
        | "vendor_admin"
        | "vendor_product_manager"
        | "vendor_inventory_manager"
        | "vendor_order_manager"
        | "vendor_staff"
        | "registered_customer"
        | "premium_customer"
        | "guest_user"
        | "delivery_partner"
        | "delivery_agent"
        | "warehouse_manager"
        | "affiliate_marketer"
        | "influencer"
        | "campaign_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "product_manager",
        "order_manager",
        "vendor_manager",
        "customer_manager",
        "content_manager",
        "marketing_manager",
        "finance_manager",
        "support_manager",
        "vendor_admin",
        "vendor_product_manager",
        "vendor_inventory_manager",
        "vendor_order_manager",
        "vendor_staff",
        "registered_customer",
        "premium_customer",
        "guest_user",
        "delivery_partner",
        "delivery_agent",
        "warehouse_manager",
        "affiliate_marketer",
        "influencer",
        "campaign_manager",
      ],
    },
  },
} as const
