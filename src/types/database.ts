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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          division_id: string | null
          email: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          division_id?: string | null
          email: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          division_id?: string | null
          email?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_profiles_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      aspirasi: {
        Row: {
          admin_reply: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          sender: string | null
          sort_order: number | null
          status: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          admin_reply?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          is_public?: boolean | null
          sender?: string | null
          sort_order?: number | null
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_reply?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          sender?: string | null
          sort_order?: number | null
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          badge: string | null
          category: string
          created_at: string | null
          description: string | null
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          preview_url: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id: string
          preview_url?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          preview_url?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      divisions: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          focus_areas: Json | null
          id: string
          is_recruiting: boolean | null
          motto: string | null
          name: string
          sort_order: number | null
          tenure_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          focus_areas?: Json | null
          id: string
          is_recruiting?: boolean | null
          motto?: string | null
          name: string
          sort_order?: number | null
          tenure_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          focus_areas?: Json | null
          id?: string
          is_recruiting?: boolean | null
          motto?: string | null
          name?: string
          sort_order?: number | null
          tenure_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_divisions_tenure"
            columns: ["tenure_id"]
            isOneToOne: false
            referencedRelation: "tenures"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          attendance_mode: string
          attendee_name: string
          created_at: string | null
          department_id: string | null
          event_id: string
          id: string
          notes: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          attendance_mode?: string
          attendee_name: string
          created_at?: string | null
          department_id?: string | null
          event_id: string
          id: string
          notes?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          attendance_mode?: string
          attendee_name?: string
          created_at?: string | null
          department_id?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_rsvps_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          division_id: string | null
          end_date: string | null
          id: string
          is_limited: boolean | null
          is_public: boolean | null
          location: string | null
          max_quota: number | null
          peserta: string | null
          sort_order: number | null
          start_date: string | null
          status: string | null
          tenure_id: string | null
          title: string
          total_rab: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          division_id?: string | null
          end_date?: string | null
          id: string
          is_limited?: boolean | null
          is_public?: boolean | null
          location?: string | null
          max_quota?: number | null
          peserta?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          tenure_id?: string | null
          title: string
          total_rab?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          division_id?: string | null
          end_date?: string | null
          id?: string
          is_limited?: boolean | null
          is_public?: boolean | null
          location?: string | null
          max_quota?: number | null
          peserta?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          tenure_id?: string | null
          title?: string
          total_rab?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_division"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_tenure"
            columns: ["tenure_id"]
            isOneToOne: false
            referencedRelation: "tenures"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          asked_by: string | null
          category: string | null
          created_at: string
          id: string
          is_published: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          asked_by?: string | null
          category?: string | null
          created_at?: string
          id: string
          is_published?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          asked_by?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      forms: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          event_id: string | null
          fields: Json | null
          id: string
          is_event_connected: boolean | null
          is_limited: boolean | null
          is_lucky_draw: boolean | null
          is_open: boolean | null
          is_show_accepted: boolean | null
          max_quota: number | null
          notes: string | null
          requires_tracking: boolean | null
          sort_order: number | null
          subtitle: string | null
          tenure_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          event_id?: string | null
          fields?: Json | null
          id: string
          is_event_connected?: boolean | null
          is_limited?: boolean | null
          is_lucky_draw?: boolean | null
          is_open?: boolean | null
          is_show_accepted?: boolean | null
          max_quota?: number | null
          notes?: string | null
          requires_tracking?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          tenure_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          event_id?: string | null
          fields?: Json | null
          id?: string
          is_event_connected?: boolean | null
          is_limited?: boolean | null
          is_lucky_draw?: boolean | null
          is_open?: boolean | null
          is_show_accepted?: boolean | null
          max_quota?: number | null
          notes?: string | null
          requires_tracking?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          tenure_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_tenure_id_fkey"
            columns: ["tenure_id"]
            isOneToOne: false
            referencedRelation: "tenures"
            referencedColumns: ["id"]
          },
        ]
      }
      galleries: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          division_id: string | null
          doc_links: Json | null
          event_id: string | null
          id: string
          photos: Json | null
          sort_order: number | null
          tenure_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          division_id?: string | null
          doc_links?: Json | null
          event_id?: string | null
          id: string
          photos?: Json | null
          sort_order?: number | null
          tenure_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          division_id?: string | null
          doc_links?: Json | null
          event_id?: string | null
          id?: string
          photos?: Json | null
          sort_order?: number | null
          tenure_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_galleries_division"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_galleries_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_galleries_tenure"
            columns: ["tenure_id"]
            isOneToOne: false
            referencedRelation: "tenures"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          likes: number | null
          message: string
          recipient: string
          sender: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id: string
          likes?: number | null
          message: string
          recipient: string
          sender: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          message?: string
          recipient?: string
          sender?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kudos_likes: {
        Row: {
          created_at: string | null
          device_id: string
          kudos_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          kudos_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          kudos_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kudos_likes_kudos_id_fkey"
            columns: ["kudos_id"]
            isOneToOne: false
            referencedRelation: "kudos"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_draws: {
        Row: {
          created_at: string | null
          details: Json | null
          drawn_at: string | null
          event_id: string
          form_id: string | null
          id: string
          prize_name: string
          sort_order: number | null
          submission_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          drawn_at?: string | null
          event_id: string
          form_id?: string | null
          id: string
          prize_name?: string
          sort_order?: number | null
          submission_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          drawn_at?: string | null
          event_id?: string
          form_id?: string | null
          id?: string
          prize_name?: string
          sort_order?: number | null
          submission_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lucky_draws_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lucky_draws_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lucky_draws_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          color: string | null
          created_at: string | null
          division_id: string | null
          id: string
          image: string | null
          motto: string | null
          name: string
          responsibilities: Json | null
          role_id: string | null
          sort_order: number | null
          tenure_id: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          division_id?: string | null
          id: string
          image?: string | null
          motto?: string | null
          name: string
          responsibilities?: Json | null
          role_id?: string | null
          sort_order?: number | null
          tenure_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          division_id?: string | null
          id?: string
          image?: string | null
          motto?: string | null
          name?: string
          responsibilities?: Json | null
          role_id?: string | null
          sort_order?: number | null
          tenure_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_members_division"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_members_tenure"
            columns: ["tenure_id"]
            isOneToOne: false
            referencedRelation: "tenures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "tenure_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          data: Json | null
          files: Json | null
          form_id: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          data?: Json | null
          files?: Json | null
          form_id?: string | null
          id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          data?: Json | null
          files?: Json | null
          form_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_submissions_form"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      tenure_roles: {
        Row: {
          created_at: string | null
          id: string
          level: number
          max_quota: number
          name: string
          requires_division: boolean
          sort_order: number | null
          tenure_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          level?: number
          max_quota?: number
          name: string
          requires_division?: boolean
          sort_order?: number | null
          tenure_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          max_quota?: number
          name?: string
          requires_division?: boolean
          sort_order?: number | null
          tenure_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenure_roles_tenure_id_fkey"
            columns: ["tenure_id"]
            isOneToOne: false
            referencedRelation: "tenures"
            referencedColumns: ["id"]
          },
        ]
      }
      tenures: {
        Row: {
          code: string
          created_at: string | null
          hero_headline: string | null
          hero_highlight: string | null
          id: string
          is_active: boolean | null
          misi: Json | null
          sort_order: number | null
          theme_tagline: string | null
          title: string
          updated_at: string | null
          visi: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          hero_headline?: string | null
          hero_highlight?: string | null
          id: string
          is_active?: boolean | null
          misi?: Json | null
          sort_order?: number | null
          theme_tagline?: string | null
          title: string
          updated_at?: string | null
          visi?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          hero_headline?: string | null
          hero_highlight?: string | null
          id?: string
          is_active?: boolean | null
          misi?: Json | null
          sort_order?: number | null
          theme_tagline?: string | null
          title?: string
          updated_at?: string | null
          visi?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: {
        Args: {
          p_display_name?: string
          p_division_id?: string
          p_email: string
          p_role: string
        }
        Returns: string
      }
      can_manage_division: { Args: { p_division_id: string }; Returns: boolean }
      can_manage_event: { Args: { p_event_id: string }; Returns: boolean }
      can_manage_form: { Args: { p_form_id: string }; Returns: boolean }
      form_deadline_wib: { Args: { p_deadline: string }; Returns: string }
      get_accepted_submissions: {
        Args: { p_form_id: string }
        Returns: {
          admin_notes: string
          created_at: string
          form_id: string
          id: string
          participant_detail: string
          participant_name: string
        }[]
      }
      get_event_attendees: {
        Args: { p_event_id: string }
        Returns: {
          attendance_mode: string
          attendee_name: string
          created_at: string
          department_id: string
          id: string
        }[]
      }
      get_public_aspirasi: {
        Args: never
        Returns: {
          admin_reply: string
          category: string
          created_at: string
          description: string
          id: string
          sender: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      get_registration_counts: {
        Args: never
        Returns: {
          kind: string
          ref_id: string
          total: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_submission_value_taken: {
        Args: { p_field_id: string; p_form_id: string; p_value: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      parse_wib_deadline: { Args: { p_deadline: string }; Returns: string }
      revoke_admin_role: { Args: { p_user_id: string }; Returns: undefined }
      submit_aspirasi: {
        Args: {
          p_category: string
          p_description: string
          p_is_public?: boolean
          p_sender: string
          p_title: string
        }
        Returns: string
      }
      submit_form: {
        Args: { p_data: Json; p_files?: Json; p_form_id: string }
        Returns: string
      }
      submit_kudos: {
        Args: {
          p_category: string
          p_message: string
          p_recipient: string
          p_sender: string
        }
        Returns: string
      }
      submit_rsvp: {
        Args: {
          p_attendance_mode: string
          p_attendee_name: string
          p_department_id?: string
          p_event_id: string
          p_notes?: string
        }
        Returns: string
      }
      toggle_kudos_like: {
        Args: { p_device_id: string; p_kudos_id: string }
        Returns: {
          liked: boolean
          likes: number
        }[]
      }
      track_submissions: {
        Args: { p_query: string }
        Returns: {
          admin_notes: string
          created_at: string
          data: Json
          form_id: string
          id: string
          status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
