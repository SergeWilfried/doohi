export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string;
          country: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_default: boolean | null;
          line1: string;
          line2: string | null;
          name: string;
          phone: string | null;
          postal_code: string;
          state: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city: string;
          country: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          line1: string;
          line2?: string | null;
          name: string;
          phone?: string | null;
          postal_code: string;
          state?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string;
          country?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          line1?: string;
          line2?: string | null;
          name?: string;
          phone?: string | null;
          postal_code?: string;
          state?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_users_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          project_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          project_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          project_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_events_user_id_users_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      backers: {
        Row: {
          bio: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          preferences: Json | null;
          projects_backed: number;
          total_amount_pledged: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          preferences?: Json | null;
          projects_backed?: number;
          total_amount_pledged?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          preferences?: Json | null;
          projects_backed?: number;
          total_amount_pledged?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'backers_user_id_users_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          display_order: number | null;
          icon_url: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_url?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          comment_text: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          moderation_status: Database['public']['Enums']['moderation_status'];
          parent_comment_id: string | null;
          project_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment_text: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          moderation_status?: Database['public']['Enums']['moderation_status'];
          parent_comment_id?: string | null;
          project_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment_text?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          moderation_status?: Database['public']['Enums']['moderation_status'];
          parent_comment_id?: string | null;
          project_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_parent_comment_id_comments_id_fk';
            columns: ['parent_comment_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_user_id_users_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      contributions: {
        Row: {
          address_id: string | null;
          amount: number;
          anonymous: boolean | null;
          backer_id: string;
          created_at: string;
          currency: Database['public']['Enums']['currency'] | null;
          deleted_at: string | null;
          id: string;
          message: string | null;
          payment_status: string;
          project_id: string;
          refunded: boolean | null;
          reward_id: string | null;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          address_id?: string | null;
          amount: number;
          anonymous?: boolean | null;
          backer_id: string;
          created_at?: string;
          currency?: Database['public']['Enums']['currency'] | null;
          deleted_at?: string | null;
          id?: string;
          message?: string | null;
          payment_status?: string;
          project_id: string;
          refunded?: boolean | null;
          reward_id?: string | null;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          address_id?: string | null;
          amount?: number;
          anonymous?: boolean | null;
          backer_id?: string;
          created_at?: string;
          currency?: Database['public']['Enums']['currency'] | null;
          deleted_at?: string | null;
          id?: string;
          message?: string | null;
          payment_status?: string;
          project_id?: string;
          refunded?: boolean | null;
          reward_id?: string | null;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contributions_address_id_addresses_id_fk';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contributions_backer_id_backers_id_fk';
            columns: ['backer_id'];
            isOneToOne: false;
            referencedRelation: 'backers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contributions_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contributions_reward_id_rewards_id_fk';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'rewards';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          deleted_at: string | null;
          id: string;
          message: string;
          read: boolean | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          deleted_at?: string | null;
          id?: string;
          message: string;
          read?: boolean | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          deleted_at?: string | null;
          id?: string;
          message?: string;
          read?: boolean | null;
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_users_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          stripe_customer_id: string | null;
          stripe_subscription_current_period_end: number | null;
          stripe_subscription_id: string | null;
          stripe_subscription_price_id: string | null;
          stripe_subscription_status: string | null;
          updated_at: string;
          verified: boolean | null;
          website_url: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id: string;
          logo_url?: string | null;
          name: string;
          stripe_customer_id?: string | null;
          stripe_subscription_current_period_end?: number | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_price_id?: string | null;
          stripe_subscription_status?: string | null;
          updated_at?: string;
          verified?: boolean | null;
          website_url?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_current_period_end?: number | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_price_id?: string | null;
          stripe_subscription_status?: string | null;
          updated_at?: string;
          verified?: boolean | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      project_media: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          media_type: Database['public']['Enums']['media_type'];
          project_id: string;
          title: string | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          media_type: Database['public']['Enums']['media_type'];
          project_id: string;
          title?: string | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          media_type?: Database['public']['Enums']['media_type'];
          project_id?: string;
          title?: string | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_media_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      project_tags: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          project_id: string;
          tag_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          project_id: string;
          tag_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          project_id?: string;
          tag_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_tags_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_tags_tag_id_tags_id_fk';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          category_id: string | null;
          conversion_rate: number | null;
          created_at: string;
          currency: Database['public']['Enums']['currency'] | null;
          days_left: number | null;
          deleted_at: string | null;
          description: string;
          end_date: string;
          faq: Json | null;
          featured: boolean | null;
          featured_image: string | null;
          goal: number;
          id: string;
          minimum_pledge: number;
          publisher_id: string | null;
          publisher_type: Database['public']['Enums']['publisher_type'];
          raised: number;
          risks: string | null;
          status: Database['public']['Enums']['project_status'];
          subtitle: string | null;
          title: string;
          updated_at: string;
          view_count: number | null;
        };
        Insert: {
          category_id?: string | null;
          conversion_rate?: number | null;
          created_at?: string;
          currency?: Database['public']['Enums']['currency'] | null;
          days_left?: number | null;
          deleted_at?: string | null;
          description: string;
          end_date: string;
          faq?: Json | null;
          featured?: boolean | null;
          featured_image?: string | null;
          goal: number;
          id?: string;
          minimum_pledge?: number;
          publisher_id?: string | null;
          publisher_type?: Database['public']['Enums']['publisher_type'];
          raised?: number;
          risks?: string | null;
          status?: Database['public']['Enums']['project_status'];
          subtitle?: string | null;
          title: string;
          updated_at?: string;
          view_count?: number | null;
        };
        Update: {
          category_id?: string | null;
          conversion_rate?: number | null;
          created_at?: string;
          currency?: Database['public']['Enums']['currency'] | null;
          days_left?: number | null;
          deleted_at?: string | null;
          description?: string;
          end_date?: string;
          faq?: Json | null;
          featured?: boolean | null;
          featured_image?: string | null;
          goal?: number;
          id?: string;
          minimum_pledge?: number;
          publisher_id?: string | null;
          publisher_type?: Database['public']['Enums']['publisher_type'];
          raised?: number;
          risks?: string | null;
          status?: Database['public']['Enums']['project_status'];
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_category_id_categories_id_fk';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_publisher_id_publishers_id_fk';
            columns: ['publisher_id'];
            isOneToOne: false;
            referencedRelation: 'publishers';
            referencedColumns: ['id'];
          },
        ];
      };
      publishers: {
        Row: {
          created_at: string;
          default_currency: Database['public']['Enums']['currency'] | null;
          deleted_at: string | null;
          description: string;
          id: string;
          name: string;
          social_links: Json | null;
          total_funds_raised: number;
          total_projects: number;
          trust_score: number;
          updated_at: string;
          verified: boolean | null;
          year_founded: number;
        };
        Insert: {
          created_at?: string;
          default_currency?: Database['public']['Enums']['currency'] | null;
          deleted_at?: string | null;
          description: string;
          id?: string;
          name: string;
          social_links?: Json | null;
          total_funds_raised?: number;
          total_projects?: number;
          trust_score?: number;
          updated_at?: string;
          verified?: boolean | null;
          year_founded: number;
        };
        Update: {
          created_at?: string;
          default_currency?: Database['public']['Enums']['currency'] | null;
          deleted_at?: string | null;
          description?: string;
          id?: string;
          name?: string;
          social_links?: Json | null;
          total_funds_raised?: number;
          total_projects?: number;
          trust_score?: number;
          updated_at?: string;
          verified?: boolean | null;
          year_founded?: number;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          amount_required: number;
          created_at: string;
          currency: Database['public']['Enums']['currency'] | null;
          deleted_at: string | null;
          description: string;
          estimated_delivery_date: string | null;
          fulfillment_status: Database['public']['Enums']['fulfillment_status'];
          id: string;
          project_id: string;
          quantity_available: number;
          quantity_claimed: number | null;
          shipping_required: boolean | null;
          shipping_restrictions: Json | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          amount_required: number;
          created_at?: string;
          currency?: Database['public']['Enums']['currency'] | null;
          deleted_at?: string | null;
          description: string;
          estimated_delivery_date?: string | null;
          fulfillment_status?: Database['public']['Enums']['fulfillment_status'];
          id?: string;
          project_id: string;
          quantity_available: number;
          quantity_claimed?: number | null;
          shipping_required?: boolean | null;
          shipping_restrictions?: Json | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          amount_required?: number;
          created_at?: string;
          currency?: Database['public']['Enums']['currency'] | null;
          deleted_at?: string | null;
          description?: string;
          estimated_delivery_date?: string | null;
          fulfillment_status?: Database['public']['Enums']['fulfillment_status'];
          id?: string;
          project_id?: string;
          quantity_available?: number;
          quantity_claimed?: number | null;
          shipping_required?: boolean | null;
          shipping_restrictions?: Json | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rewards_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      updates: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_public: boolean | null;
          project_id: string;
          title: string;
          update_text: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          project_id: string;
          title: string;
          update_text: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_public?: boolean | null;
          project_id?: string;
          title?: string;
          update_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'updates_project_id_projects_id_fk';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      user_follows: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          follower_id: string;
          following_id: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_follows_follower_id_users_id_fk';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_follows_following_id_users_id_fk';
            columns: ['following_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          bio: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          email_verification_token: string | null;
          email_verified: boolean | null;
          id: string;
          last_login_at: string | null;
          mfa_enabled: boolean | null;
          mfa_secret: string | null;
          name: string;
          organization_id: string | null;
          password_hash: string;
          password_reset_expires: string | null;
          password_reset_token: string | null;
          preferences: Json | null;
          profile_image_url: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          email_verification_token?: string | null;
          email_verified?: boolean | null;
          id?: string;
          last_login_at?: string | null;
          mfa_enabled?: boolean | null;
          mfa_secret?: string | null;
          name: string;
          organization_id?: string | null;
          password_hash: string;
          password_reset_expires?: string | null;
          password_reset_token?: string | null;
          preferences?: Json | null;
          profile_image_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          email_verification_token?: string | null;
          email_verified?: boolean | null;
          id?: string;
          last_login_at?: string | null;
          mfa_enabled?: boolean | null;
          mfa_secret?: string | null;
          name?: string;
          organization_id?: string | null;
          password_hash?: string;
          password_reset_expires?: string | null;
          password_reset_token?: string | null;
          preferences?: Json | null;
          profile_image_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      binary_quantize:
        | {
          Args: {
            '': string;
          };
          Returns: unknown;
        }
        | {
          Args: {
            '': unknown;
          };
          Returns: unknown;
        };
      halfvec_avg: {
        Args: {
          '': number[];
        };
        Returns: unknown;
      };
      halfvec_out: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      halfvec_send: {
        Args: {
          '': unknown;
        };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      hnswhandler: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      ivfflat_bit_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      l2_norm:
        | {
          Args: {
            '': unknown;
          };
          Returns: number;
        }
        | {
          Args: {
            '': unknown;
          };
          Returns: number;
        };
      l2_normalize:
        | {
          Args: {
            '': string;
          };
          Returns: string;
        }
        | {
          Args: {
            '': unknown;
          };
          Returns: unknown;
        }
        | {
          Args: {
            '': unknown;
          };
          Returns: unknown;
        };
      sparsevec_out: {
        Args: {
          '': unknown;
        };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: {
          '': unknown;
        };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
      vector_avg: {
        Args: {
          '': number[];
        };
        Returns: string;
      };
      vector_dims:
        | {
          Args: {
            '': string;
          };
          Returns: number;
        }
        | {
          Args: {
            '': unknown;
          };
          Returns: number;
        };
      vector_norm: {
        Args: {
          '': string;
        };
        Returns: number;
      };
      vector_out: {
        Args: {
          '': string;
        };
        Returns: unknown;
      };
      vector_send: {
        Args: {
          '': string;
        };
        Returns: string;
      };
      vector_typmod_in: {
        Args: {
          '': unknown[];
        };
        Returns: number;
      };
    };
    Enums: {
      currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
      fulfillment_status: 'pending' | 'fulfilled' | 'canceled';
      media_type: 'image' | 'video' | 'document';
      moderation_status: 'pending' | 'approved' | 'rejected';
      notification_type:
        | 'project_update'
        | 'comment'
        | 'funding_goal'
        | 'reward_fulfillment'
        | 'system';
      project_status: 'draft' | 'active' | 'funded' | 'expired' | 'canceled';
      publisher_type: 'user' | 'organization';
      user_role: 'backer' | 'publisher' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
    Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
      ? R
      : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
    PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
        ? R
        : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema['Tables']
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I;
  }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema['Tables']
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U;
  }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema['Enums']
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema['CompositeTypes']
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
