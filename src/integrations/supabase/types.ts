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
      contacts: {
        Row: {
          created_at: string
          id: string
          is_high_value: boolean | null
          last_connected_at: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_high_value?: boolean | null
          last_connected_at?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_high_value?: boolean | null
          last_connected_at?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      core_values_assessments: {
        Row: {
          assessment_date: string
          created_at: string
          id: string
          notes: string | null
          scores: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_date: string
          created_at?: string
          id?: string
          notes?: string | null
          scores?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          scores?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      core_values_shortlist: {
        Row: {
          colors: Json
          created_at: string
          custom_values: Json
          id: string
          selected_values: string[]
          updated_at: string
          user_id: string
          values_statements: Json
        }
        Insert: {
          colors?: Json
          created_at?: string
          custom_values?: Json
          id?: string
          selected_values?: string[]
          updated_at?: string
          user_id: string
          values_statements?: Json
        }
        Update: {
          colors?: Json
          created_at?: string
          custom_values?: Json
          id?: string
          selected_values?: string[]
          updated_at?: string
          user_id?: string
          values_statements?: Json
        }
        Relationships: []
      }
      daily_reviews: {
        Row: {
          created_at: string
          followed_schedule: boolean | null
          id: string
          reflection_notes: string | null
          review_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          followed_schedule?: boolean | null
          id?: string
          reflection_notes?: string | null
          review_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          followed_schedule?: boolean | null
          id?: string
          reflection_notes?: string | null
          review_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          scope: string | null
          token_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed: boolean
          completion_date: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completion_date: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completion_date?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          importance_reason: string | null
          importance_set_at: string | null
          name: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          importance_reason?: string | null
          importance_set_at?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          importance_reason?: string | null
          importance_set_at?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_goals: {
        Row: {
          category_id: string
          created_at: string
          id: string
          sort_order: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          sort_order?: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          birth_date: string | null
          categories: Json
          created_at: string
          expected_lifespan: number
          id: string
          name: string
          onboarding_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number
          birth_date?: string | null
          categories?: Json
          created_at?: string
          expected_lifespan?: number
          id?: string
          name?: string
          onboarding_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number
          birth_date?: string | null
          categories?: Json
          created_at?: string
          expected_lifespan?: number
          id?: string
          name?: string
          onboarding_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_activities: {
        Row: {
          activity_description: string
          created_at: string
          duration_minutes: number | null
          id: string
          life_area: string | null
          review_id: string
          user_id: string
          was_planned: boolean | null
        }
        Insert: {
          activity_description: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          life_area?: string | null
          review_id: string
          user_id: string
          was_planned?: boolean | null
        }
        Update: {
          activity_description?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          life_area?: string | null
          review_id?: string
          user_id?: string
          was_planned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "review_activities_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "daily_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_connections: {
        Row: {
          connection_notes: string | null
          contact_id: string | null
          contact_name: string
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          connection_notes?: string | null
          contact_id?: string | null
          contact_name: string
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          connection_notes?: string | null
          contact_id?: string | null
          contact_name?: string
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_connections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_connections_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "daily_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          google_event_id: string | null
          id: string
          is_recurring: boolean | null
          labels: string[] | null
          life_areas: string[] | null
          priority: number | null
          project: string | null
          recurrence_per_week: number | null
          scheduled_at: string | null
          skip_count: number | null
          sort_order: number | null
          time_estimate_minutes: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          google_event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          labels?: string[] | null
          life_areas?: string[] | null
          priority?: number | null
          project?: string | null
          recurrence_per_week?: number | null
          scheduled_at?: string | null
          skip_count?: number | null
          sort_order?: number | null
          time_estimate_minutes?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          google_event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          labels?: string[] | null
          life_areas?: string[] | null
          priority?: number | null
          project?: string | null
          recurrence_per_week?: number | null
          scheduled_at?: string | null
          skip_count?: number | null
          sort_order?: number | null
          time_estimate_minutes?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
