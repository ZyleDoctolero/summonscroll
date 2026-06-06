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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          class: Database["public"]["Enums"]["player_class"]
          con_stat: number
          created_at: string
          deaths: number
          display_name: string
          email: string | null
          gems: number
          gold: number
          hp: number
          id: string
          last_cron_date: string | null
          last_login_date: string | null
          level: number
          max_hp: number
          pact_seals: number
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          class?: Database["public"]["Enums"]["player_class"]
          con_stat?: number
          created_at?: string
          deaths?: number
          display_name: string
          email?: string | null
          gems?: number
          gold?: number
          hp?: number
          id: string
          last_cron_date?: string | null
          last_login_date?: string | null
          level?: number
          max_hp?: number
          pact_seals?: number
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          class?: Database["public"]["Enums"]["player_class"]
          con_stat?: number
          created_at?: string
          deaths?: number
          display_name?: string
          email?: string | null
          gems?: number
          gold?: number
          hp?: number
          id?: string
          last_cron_date?: string | null
          last_login_date?: string | null
          level?: number
          max_hp?: number
          pact_seals?: number
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      task_events: {
        Row: {
          created_at: string
          delta_value: number
          hp_change: number
          id: string
          kind: Database["public"]["Enums"]["task_event_kind"]
          note: string | null
          reward_gems: number
          reward_gold: number
          reward_xp: number
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_value?: number
          hp_change?: number
          id?: string
          kind: Database["public"]["Enums"]["task_event_kind"]
          note?: string | null
          reward_gems?: number
          reward_gold?: number
          reward_xp?: number
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta_value?: number
          hp_change?: number
          id?: string
          kind?: Database["public"]["Enums"]["task_event_kind"]
          note?: string | null
          reward_gems?: number
          reward_gold?: number
          reward_xp?: number
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          category: string | null
          completed: boolean
          created_at: string
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_date: string | null
          id: string
          last_completed_at: string | null
          last_completed_date: string | null
          negative_enabled: boolean
          notes: string | null
          positive_enabled: boolean
          schedule_days: number[]
          sort_order: number
          streak: number
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          archived?: boolean
          category?: string | null
          completed?: boolean
          created_at?: string
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          id?: string
          last_completed_at?: string | null
          last_completed_date?: string | null
          negative_enabled?: boolean
          notes?: string | null
          positive_enabled?: boolean
          schedule_days?: number[]
          sort_order?: number
          streak?: number
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          archived?: boolean
          category?: string | null
          completed?: boolean
          created_at?: string
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          id?: string
          last_completed_at?: string | null
          last_completed_date?: string | null
          negative_enabled?: boolean
          notes?: string | null
          positive_enabled?: boolean
          schedule_days?: number[]
          sort_order?: number
          streak?: number
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          user_id?: string
          value?: number
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
      player_class: "none" | "warrior" | "mage" | "rogue" | "healer"
      task_difficulty: "trivial" | "easy" | "medium" | "hard"
      task_event_kind:
        | "plus"
        | "minus"
        | "complete"
        | "uncomplete"
        | "miss"
        | "cron_drift"
      task_type: "habit" | "daily" | "todo"
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
      player_class: ["none", "warrior", "mage", "rogue", "healer"],
      task_difficulty: ["trivial", "easy", "medium", "hard"],
      task_event_kind: [
        "plus",
        "minus",
        "complete",
        "uncomplete",
        "miss",
        "cron_drift",
      ],
      task_type: ["habit", "daily", "todo"],
    },
  },
} as const
