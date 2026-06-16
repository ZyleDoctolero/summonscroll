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
      achievements: {
        Row: {
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          reward_crystals: number
          reward_title: string | null
        }
        Insert: {
          condition_type: string
          condition_value: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          reward_crystals?: number
          reward_title?: string | null
        }
        Update: {
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          reward_crystals?: number
          reward_title?: string | null
        }
        Relationships: []
      }
      arena_battles: {
        Row: {
          battle_log: Json | null
          created_at: string
          enemy_hp: number
          enemy_name: string
          floor: number
          id: string
          mode: Database["public"]["Enums"]["battle_mode"]
          player_won: boolean | null
          reward_crystals: number
          reward_shards: number
          reward_xp: number
          rounds: number
          team_ids: string[]
          team_power: number
          user_id: string
        }
        Insert: {
          battle_log?: Json | null
          created_at?: string
          enemy_hp: number
          enemy_name: string
          floor?: number
          id?: string
          mode: Database["public"]["Enums"]["battle_mode"]
          player_won?: boolean | null
          reward_crystals?: number
          reward_shards?: number
          reward_xp?: number
          rounds?: number
          team_ids: string[]
          team_power?: number
          user_id: string
        }
        Update: {
          battle_log?: Json | null
          created_at?: string
          enemy_hp?: number
          enemy_name?: string
          floor?: number
          id?: string
          mode?: Database["public"]["Enums"]["battle_mode"]
          player_won?: boolean | null
          reward_crystals?: number
          reward_shards?: number
          reward_xp?: number
          rounds?: number
          team_ids?: string[]
          team_power?: number
          user_id?: string
        }
        Relationships: []
      }
      awakening_events: {
        Row: {
          created_at: string
          id: string
          skill_name: string
          trigger_text: string
          user_id: string
          user_monster_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_name: string
          trigger_text: string
          user_id: string
          user_monster_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_name?: string
          trigger_text?: string
          user_id?: string
          user_monster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "awakening_events_user_monster_id_fkey"
            columns: ["user_monster_id"]
            isOneToOne: false
            referencedRelation: "user_monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          art_url: string | null
          banner_type: Database["public"]["Enums"]["banner_type"]
          created_at: string
          ends_at: string | null
          featured_monster_id: string | null
          id: string
          is_active: boolean
          name: string
          pull_cost_10_crystals: number
          pull_cost_crystals: number
          pull_cost_seals: number | null
          realm_id: number | null
          starts_at: string
        }
        Insert: {
          art_url?: string | null
          banner_type: Database["public"]["Enums"]["banner_type"]
          created_at?: string
          ends_at?: string | null
          featured_monster_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          pull_cost_10_crystals?: number
          pull_cost_crystals?: number
          pull_cost_seals?: number | null
          realm_id?: number | null
          starts_at?: string
        }
        Update: {
          art_url?: string | null
          banner_type?: Database["public"]["Enums"]["banner_type"]
          created_at?: string
          ends_at?: string | null
          featured_monster_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pull_cost_10_crystals?: number
          pull_cost_crystals?: number
          pull_cost_seals?: number | null
          realm_id?: number | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_featured_monster_id_fkey"
            columns: ["featured_monster_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banners_realm_id_fkey"
            columns: ["realm_id"]
            isOneToOne: false
            referencedRelation: "realms"
            referencedColumns: ["id"]
          },
        ]
      }
      crafts: {
        Row: {
          affix: Json | null
          created_at: string
          id: string
          quality: string
          recipe_id: string
          user_equipment_id: string | null
          user_id: string
        }
        Insert: {
          affix?: Json | null
          created_at?: string
          id?: string
          quality?: string
          recipe_id: string
          user_equipment_id?: string | null
          user_id: string
        }
        Update: {
          affix?: Json | null
          created_at?: string
          id?: string
          quality?: string
          recipe_id?: string
          user_equipment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crafts_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crafts_user_equipment_id_fkey"
            columns: ["user_equipment_id"]
            isOneToOne: false
            referencedRelation: "user_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          am_completed_at: string | null
          am_intent_task_ids: string[]
          created_at: string
          id: string
          log_date: string
          pm_completed_at: string | null
          pm_didnt_go: string | null
          pm_energy: number | null
          pm_mood: number | null
          pm_tomorrow_anchor_task_id: string | null
          pm_went_well: string | null
          reflection_pull_granted: boolean
          reflection_pull_used: boolean
          tome_shard_granted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          am_completed_at?: string | null
          am_intent_task_ids?: string[]
          created_at?: string
          id?: string
          log_date: string
          pm_completed_at?: string | null
          pm_didnt_go?: string | null
          pm_energy?: number | null
          pm_mood?: number | null
          pm_tomorrow_anchor_task_id?: string | null
          pm_went_well?: string | null
          reflection_pull_granted?: boolean
          reflection_pull_used?: boolean
          tome_shard_granted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          am_completed_at?: string | null
          am_intent_task_ids?: string[]
          created_at?: string
          id?: string
          log_date?: string
          pm_completed_at?: string | null
          pm_didnt_go?: string | null
          pm_energy?: number | null
          pm_mood?: number | null
          pm_tomorrow_anchor_task_id?: string | null
          pm_went_well?: string | null
          reflection_pull_granted?: boolean
          reflection_pull_used?: boolean
          tome_shard_granted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          art_url: string | null
          class_affinity: Database["public"]["Enums"]["player_class"] | null
          con_bonus: number
          created_at: string
          description: string | null
          id: string
          int_bonus: number
          is_armoire_exclusive: boolean
          is_seasonal: boolean
          name: string
          per_bonus: number
          price: number
          rarity: string
          season: string | null
          slot: Database["public"]["Enums"]["equipment_slot"]
          str_bonus: number
        }
        Insert: {
          art_url?: string | null
          class_affinity?: Database["public"]["Enums"]["player_class"] | null
          con_bonus?: number
          created_at?: string
          description?: string | null
          id?: string
          int_bonus?: number
          is_armoire_exclusive?: boolean
          is_seasonal?: boolean
          name: string
          per_bonus?: number
          price?: number
          rarity?: string
          season?: string | null
          slot: Database["public"]["Enums"]["equipment_slot"]
          str_bonus?: number
        }
        Update: {
          art_url?: string | null
          class_affinity?: Database["public"]["Enums"]["player_class"] | null
          con_bonus?: number
          created_at?: string
          description?: string | null
          id?: string
          int_bonus?: number
          is_armoire_exclusive?: boolean
          is_seasonal?: boolean
          name?: string
          per_bonus?: number
          price?: number
          rarity?: string
          season?: string | null
          slot?: Database["public"]["Enums"]["equipment_slot"]
          str_bonus?: number
        }
        Relationships: []
      }
      expeditions: {
        Row: {
          created_at: string
          day_of_week: number
          drops: Json
          elite_encounter: boolean
          enemies_defeated: number
          expedition_type: string
          id: string
          stamina_spent: number
          team_power: number
          team_size: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          drops?: Json
          elite_encounter?: boolean
          enemies_defeated: number
          expedition_type: string
          id?: string
          stamina_spent?: number
          team_power: number
          team_size: number
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          drops?: Json
          elite_encounter?: boolean
          enemies_defeated?: number
          expedition_type?: string
          id?: string
          stamina_spent?: number
          team_power?: number
          team_size?: number
          user_id?: string
        }
        Relationships: []
      }
      fusion_recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_1_id: string
          ingredient_2_id: string
          ingredient_3_id: string | null
          is_cross_realm: boolean
          result_id: string
          success_rate: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_1_id: string
          ingredient_2_id: string
          ingredient_3_id?: string | null
          is_cross_realm?: boolean
          result_id: string
          success_rate?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_1_id?: string
          ingredient_2_id?: string
          ingredient_3_id?: string | null
          is_cross_realm?: boolean
          result_id?: string
          success_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "fusion_recipes_ingredient_1_id_fkey"
            columns: ["ingredient_1_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fusion_recipes_ingredient_2_id_fkey"
            columns: ["ingredient_2_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fusion_recipes_ingredient_3_id_fkey"
            columns: ["ingredient_3_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fusion_recipes_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          deadline: string
          hp_remaining: number
          hp_total: number
          id: string
          identity: string | null
          slain_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["goal_status"]
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline: string
          hp_remaining: number
          hp_total: number
          id?: string
          identity?: string | null
          slain_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["goal_status"]
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string
          hp_remaining?: number
          hp_total?: number
          id?: string
          identity?: string | null
          slain_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["goal_status"]
          title?: string
          type?: Database["public"]["Enums"]["goal_type"]
          user_id?: string
        }
        Relationships: []
      }
      guild_members: {
        Row: {
          guild_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["guild_role"]
          user_id: string
        }
        Insert: {
          guild_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
          user_id: string
        }
        Update: {
          guild_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["guild_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_quests: {
        Row: {
          boss_hp_remaining: number | null
          boss_rage: number
          collection_progress: Json | null
          completed_at: string | null
          guild_id: string
          id: string
          quest_template_id: string
          started_at: string
          started_by: string
          status: Database["public"]["Enums"]["quest_status"]
          total_damage_dealt: number
        }
        Insert: {
          boss_hp_remaining?: number | null
          boss_rage?: number
          collection_progress?: Json | null
          completed_at?: string | null
          guild_id: string
          id?: string
          quest_template_id: string
          started_at?: string
          started_by: string
          status?: Database["public"]["Enums"]["quest_status"]
          total_damage_dealt?: number
        }
        Update: {
          boss_hp_remaining?: number | null
          boss_rage?: number
          collection_progress?: Json | null
          completed_at?: string | null
          guild_id?: string
          id?: string
          quest_template_id?: string
          started_at?: string
          started_by?: string
          status?: Database["public"]["Enums"]["quest_status"]
          total_damage_dealt?: number
        }
        Relationships: [
          {
            foreignKeyName: "guild_quests_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guild_quests_quest_template_id_fkey"
            columns: ["quest_template_id"]
            isOneToOne: false
            referencedRelation: "quest_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string
          level: number
          max_members: number
          name: string
          privacy: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id: string
          level?: number
          max_members?: number
          name: string
          privacy?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string
          level?: number
          max_members?: number
          name?: string
          privacy?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          item_meta: string | null
          item_name: string
          item_type: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_meta?: string | null
          item_name: string
          item_type: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_meta?: string | null
          item_name?: string
          item_type?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      monster_artifacts: {
        Row: {
          created_at: string | null
          enhancement_level: number | null
          id: string
          main_stat: string
          main_stat_value: number
          monster_id: string | null
          set_name: string
          slot: string
          sub_stats: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          enhancement_level?: number | null
          id?: string
          main_stat: string
          main_stat_value: number
          monster_id?: string | null
          set_name: string
          slot: string
          sub_stats?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          enhancement_level?: number | null
          id?: string
          main_stat?: string
          main_stat_value?: number
          monster_id?: string | null
          set_name?: string
          slot?: string
          sub_stats?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monster_artifacts_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "user_monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monster_artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monsters: {
        Row: {
          art_url: string | null
          base_atk: number
          base_def: number
          base_hp: number
          base_spd: number
          bestiary_id: number
          created_at: string
          element: string
          id: string
          is_ex: boolean
          lore: string | null
          name: string
          origin: string | null
          rarity: Database["public"]["Enums"]["monster_rarity"]
          realm_id: number
          realm_skill: string | null
          release_set: number
          role: Database["public"]["Enums"]["monster_role"]
          skill_1: string | null
          skill_2: string | null
          skill_3: string | null
        }
        Insert: {
          art_url?: string | null
          base_atk?: number
          base_def?: number
          base_hp?: number
          base_spd?: number
          bestiary_id?: number
          created_at?: string
          element: string
          id?: string
          is_ex?: boolean
          lore?: string | null
          name: string
          origin?: string | null
          rarity: Database["public"]["Enums"]["monster_rarity"]
          realm_id: number
          realm_skill?: string | null
          release_set?: number
          role?: Database["public"]["Enums"]["monster_role"]
          skill_1?: string | null
          skill_2?: string | null
          skill_3?: string | null
        }
        Update: {
          art_url?: string | null
          base_atk?: number
          base_def?: number
          base_hp?: number
          base_spd?: number
          bestiary_id?: number
          created_at?: string
          element?: string
          id?: string
          is_ex?: boolean
          lore?: string | null
          name?: string
          origin?: string | null
          rarity?: Database["public"]["Enums"]["monster_rarity"]
          realm_id?: number
          realm_skill?: string | null
          release_set?: number
          role?: Database["public"]["Enums"]["monster_role"]
          skill_1?: string | null
          skill_2?: string | null
          skill_3?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monsters_realm_id_fkey"
            columns: ["realm_id"]
            isOneToOne: false
            referencedRelation: "realms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aura_concealed: boolean
          class: Database["public"]["Enums"]["player_class"]
          combo_count: number
          con_stat: number
          constellation_favor: number
          constellation_patron: string | null
          created_at: string
          crystals: number
          deaths: number
          display_name: string
          echo_touched: boolean
          email: string | null
          equipped_accessory: string | null
          equipped_armor: string | null
          equipped_helm: string | null
          equipped_weapon: string | null
          gold: number
          hp: number
          id: string
          in_penalty_zone: boolean
          int_stat: number
          irl_discipline_score: number | null
          last_class_change: string | null
          last_cron_date: string | null
          last_login_date: string | null
          last_task_time: string | null
          last_trial_at: string | null
          level: number
          max_hp: number
          max_mp: number
          mp: number
          onboarding_completed_at: string | null
          pact_seals: number
          penalty_zone_task: string | null
          per_stat: number
          pvp_rank: string | null
          regression_count: number
          ritual_streak: number
          soul_fragments: Json
          soul_tether_id: string | null
          stamina: number
          stamina_last_tick: string
          stamina_max: number
          str_stat: number
          streak: number
          streak_freeze_charges: number
          talents: Json
          tutorial_directive_id: string | null
          updated_at: string
          wind_down_hour: number
          xp: number
        }
        Insert: {
          aura_concealed?: boolean
          class?: Database["public"]["Enums"]["player_class"]
          combo_count?: number
          con_stat?: number
          constellation_favor?: number
          constellation_patron?: string | null
          created_at?: string
          crystals?: number
          deaths?: number
          display_name: string
          echo_touched?: boolean
          email?: string | null
          equipped_accessory?: string | null
          equipped_armor?: string | null
          equipped_helm?: string | null
          equipped_weapon?: string | null
          gold?: number
          hp?: number
          id: string
          in_penalty_zone?: boolean
          int_stat?: number
          irl_discipline_score?: number | null
          last_class_change?: string | null
          last_cron_date?: string | null
          last_login_date?: string | null
          last_task_time?: string | null
          last_trial_at?: string | null
          level?: number
          max_hp?: number
          max_mp?: number
          mp?: number
          onboarding_completed_at?: string | null
          pact_seals?: number
          penalty_zone_task?: string | null
          per_stat?: number
          pvp_rank?: string | null
          regression_count?: number
          ritual_streak?: number
          soul_fragments?: Json
          soul_tether_id?: string | null
          stamina?: number
          stamina_last_tick?: string
          stamina_max?: number
          str_stat?: number
          streak?: number
          streak_freeze_charges?: number
          talents?: Json
          tutorial_directive_id?: string | null
          updated_at?: string
          wind_down_hour?: number
          xp?: number
        }
        Update: {
          aura_concealed?: boolean
          class?: Database["public"]["Enums"]["player_class"]
          combo_count?: number
          con_stat?: number
          constellation_favor?: number
          constellation_patron?: string | null
          created_at?: string
          crystals?: number
          deaths?: number
          display_name?: string
          echo_touched?: boolean
          email?: string | null
          equipped_accessory?: string | null
          equipped_armor?: string | null
          equipped_helm?: string | null
          equipped_weapon?: string | null
          gold?: number
          hp?: number
          id?: string
          in_penalty_zone?: boolean
          int_stat?: number
          irl_discipline_score?: number | null
          last_class_change?: string | null
          last_cron_date?: string | null
          last_login_date?: string | null
          last_task_time?: string | null
          last_trial_at?: string | null
          level?: number
          max_hp?: number
          max_mp?: number
          mp?: number
          onboarding_completed_at?: string | null
          pact_seals?: number
          penalty_zone_task?: string | null
          per_stat?: number
          pvp_rank?: string | null
          regression_count?: number
          ritual_streak?: number
          soul_fragments?: Json
          soul_tether_id?: string | null
          stamina?: number
          stamina_last_tick?: string
          stamina_max?: number
          str_stat?: number
          streak?: number
          streak_freeze_charges?: number
          talents?: Json
          tutorial_directive_id?: string | null
          updated_at?: string
          wind_down_hour?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_soul_tether"
            columns: ["soul_tether_id"]
            isOneToOne: false
            referencedRelation: "user_monsters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tutorial_directive_id_fkey"
            columns: ["tutorial_directive_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_attempts: {
        Row: {
          created_at: string
          from_star: number
          id: string
          materials_spent: Json
          stones_spent: Json
          to_star: number
          user_id: string
          user_monster_id: string
        }
        Insert: {
          created_at?: string
          from_star: number
          id?: string
          materials_spent?: Json
          stones_spent?: Json
          to_star: number
          user_id: string
          user_monster_id: string
        }
        Update: {
          created_at?: string
          from_star?: number
          id?: string
          materials_spent?: Json
          stones_spent?: Json
          to_star?: number
          user_id?: string
          user_monster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_attempts_user_monster_id_fkey"
            columns: ["user_monster_id"]
            isOneToOne: false
            referencedRelation: "user_monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      pulls: {
        Row: {
          amount_spent: number
          banner_id: string
          created_at: string
          currency_spent: Database["public"]["Enums"]["pull_currency"]
          id: string
          is_new: boolean
          monster_id: string
          rarity: Database["public"]["Enums"]["monster_rarity"]
          transcendence_stone: boolean
          user_id: string
        }
        Insert: {
          amount_spent?: number
          banner_id: string
          created_at?: string
          currency_spent?: Database["public"]["Enums"]["pull_currency"]
          id?: string
          is_new?: boolean
          monster_id: string
          rarity: Database["public"]["Enums"]["monster_rarity"]
          transcendence_stone?: boolean
          user_id: string
        }
        Update: {
          amount_spent?: number
          banner_id?: string
          created_at?: string
          currency_spent?: Database["public"]["Enums"]["pull_currency"]
          id?: string
          is_new?: boolean
          monster_id?: string
          rarity?: Database["public"]["Enums"]["monster_rarity"]
          transcendence_stone?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulls_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulls_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          quantity: number
          shop_item_id: string
          total_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          shop_item_id: string
          total_cost: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          shop_item_id?: string
          total_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_participants: {
        Row: {
          damage_dealt: number
          damage_taken: number
          guild_quest_id: string
          id: string
          items_found: number
          joined_at: string
          user_id: string
        }
        Insert: {
          damage_dealt?: number
          damage_taken?: number
          guild_quest_id: string
          id?: string
          items_found?: number
          joined_at?: string
          user_id: string
        }
        Update: {
          damage_dealt?: number
          damage_taken?: number
          guild_quest_id?: string
          id?: string
          items_found?: number
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_participants_guild_quest_id_fkey"
            columns: ["guild_quest_id"]
            isOneToOne: false
            referencedRelation: "guild_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_templates: {
        Row: {
          art_url: string | null
          boss_hp: number | null
          boss_name: string | null
          boss_rage_max: number | null
          boss_str: number | null
          collection_items: Json | null
          created_at: string
          description: string | null
          difficulty: string
          id: string
          name: string
          quest_type: Database["public"]["Enums"]["quest_type"]
          reward_drops: Json | null
          reward_gems: number
          reward_xp: number
        }
        Insert: {
          art_url?: string | null
          boss_hp?: number | null
          boss_name?: string | null
          boss_rage_max?: number | null
          boss_str?: number | null
          collection_items?: Json | null
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          name: string
          quest_type: Database["public"]["Enums"]["quest_type"]
          reward_drops?: Json | null
          reward_gems?: number
          reward_xp?: number
        }
        Update: {
          art_url?: string | null
          boss_hp?: number | null
          boss_name?: string | null
          boss_rage_max?: number | null
          boss_str?: number | null
          collection_items?: Json | null
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          name?: string
          quest_type?: Database["public"]["Enums"]["quest_type"]
          reward_drops?: Json | null
          reward_gems?: number
          reward_xp?: number
        }
        Relationships: []
      }
      realms: {
        Row: {
          created_at: string
          description: string | null
          element: string
          habit_affinity: string
          icon: string | null
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          element: string
          habit_affinity: string
          icon?: string | null
          id?: number
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          element?: string
          habit_affinity?: string
          icon?: string | null
          id?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      recipes: {
        Row: {
          base_gold_cost: number
          created_at: string
          equipment_id: string
          id: string
          ingredients: Json
          name: string
          sort_order: number
          unlock_condition: Json
        }
        Insert: {
          base_gold_cost?: number
          created_at?: string
          equipment_id: string
          id?: string
          ingredients: Json
          name: string
          sort_order?: number
          unlock_condition?: Json
        }
        Update: {
          base_gold_cost?: number
          created_at?: string
          equipment_id?: string
          id?: string
          ingredients?: Json
          name?: string
          sort_order?: number
          unlock_condition?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recipes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          category: Database["public"]["Enums"]["shop_category"]
          created_at: string
          currency: string
          daily_reset: boolean
          description: string | null
          effect_meta: string | null
          effect_type: string | null
          effect_value: number | null
          equipment_id: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          stock: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["shop_category"]
          created_at?: string
          currency?: string
          daily_reset?: boolean
          description?: string | null
          effect_meta?: string | null
          effect_type?: string | null
          effect_value?: number | null
          equipment_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          stock?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["shop_category"]
          created_at?: string
          currency?: string
          daily_reset?: boolean
          description?: string | null
          effect_meta?: string | null
          effect_type?: string | null
          effect_value?: number | null
          equipment_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          created_at: string
          delta_value: number
          hp_change: number
          id: string
          kind: Database["public"]["Enums"]["task_event_kind"]
          note: string | null
          reward_crystals: number
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
          reward_crystals?: number
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
          reward_crystals?: number
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
          goal_id: string | null
          id: string
          is_starred: boolean
          last_completed_at: string | null
          last_completed_date: string | null
          negative_enabled: boolean
          notes: string | null
          positive_enabled: boolean
          schedule_days: number[]
          sort_order: number
          streak: number
          tags: string[]
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
          goal_id?: string | null
          id?: string
          is_starred?: boolean
          last_completed_at?: string | null
          last_completed_date?: string | null
          negative_enabled?: boolean
          notes?: string | null
          positive_enabled?: boolean
          schedule_days?: number[]
          sort_order?: number
          streak?: number
          tags?: string[]
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
          goal_id?: string | null
          id?: string
          is_starred?: boolean
          last_completed_at?: string | null
          last_completed_date?: string | null
          negative_enabled?: boolean
          notes?: string | null
          positive_enabled?: boolean
          schedule_days?: number[]
          sort_order?: number
          streak?: number
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      tower_progress: {
        Row: {
          apex_cleared_at: string | null
          highest_floor: number
          last_defeat_at: string | null
          updated_at: string
          user_id: string
          wailing_wall_cleared_at: string | null
        }
        Insert: {
          apex_cleared_at?: string | null
          highest_floor?: number
          last_defeat_at?: string | null
          updated_at?: string
          user_id: string
          wailing_wall_cleared_at?: string | null
        }
        Update: {
          apex_cleared_at?: string | null
          highest_floor?: number
          last_defeat_at?: string | null
          updated_at?: string
          user_id?: string
          wailing_wall_cleared_at?: string | null
        }
        Relationships: []
      }
      trial_runs: {
        Row: {
          created_at: string
          fallen: Json
          floors_cleared: number
          full_clear: boolean
          id: string
          rewards: Json
          team_user_monster_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          fallen?: Json
          floors_cleared?: number
          full_clear?: boolean
          id?: string
          rewards?: Json
          team_user_monster_ids: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          fallen?: Json
          floors_cleared?: number
          full_clear?: boolean
          id?: string
          rewards?: Json
          team_user_monster_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_equipment: {
        Row: {
          affix: Json | null
          equipment_id: string
          id: string
          is_equipped: boolean
          obtained_at: string
          quality: string
          user_id: string
        }
        Insert: {
          affix?: Json | null
          equipment_id: string
          id?: string
          is_equipped?: boolean
          obtained_at?: string
          quality?: string
          user_id: string
        }
        Update: {
          affix?: Json | null
          equipment_id?: string
          id?: string
          is_equipped?: boolean
          obtained_at?: string
          quality?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      user_monsters: {
        Row: {
          ascension_level: number
          ascension_tree: Json
          awakened_skills: string[]
          bond_percent: number
          corruption_level: number
          created_at: string
          current_class: string | null
          current_star: number | null
          growth_xp: number
          id: string
          is_locked: boolean
          is_on_team: boolean
          last_active_at: string
          level: number
          monster_id: string
          obtained_at: string
          secondary_element: string | null
          star_level: number
          team_slot: number | null
          title: string | null
          user_id: string
          xp: number
        }
        Insert: {
          ascension_level?: number
          ascension_tree?: Json
          awakened_skills?: string[]
          bond_percent?: number
          corruption_level?: number
          created_at?: string
          current_class?: string | null
          current_star?: number | null
          growth_xp?: number
          id?: string
          is_locked?: boolean
          is_on_team?: boolean
          last_active_at?: string
          level?: number
          monster_id: string
          obtained_at?: string
          secondary_element?: string | null
          star_level?: number
          team_slot?: number | null
          title?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          ascension_level?: number
          ascension_tree?: Json
          awakened_skills?: string[]
          bond_percent?: number
          corruption_level?: number
          created_at?: string
          current_class?: string | null
          current_star?: number | null
          growth_xp?: number
          id?: string
          is_locked?: boolean
          is_on_team?: boolean
          last_active_at?: string
          level?: number
          monster_id?: string
          obtained_at?: string
          secondary_element?: string | null
          star_level?: number
          team_slot?: number | null
          title?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_monsters_monster_id_fkey"
            columns: ["monster_id"]
            isOneToOne: false
            referencedRelation: "monsters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pets: {
        Row: {
          created_at: string
          egg_type: string
          food_fed: number
          id: string
          is_active: boolean
          is_mount: boolean
          pet_name: string
          potion_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          egg_type: string
          food_fed?: number
          id?: string
          is_active?: boolean
          is_mount?: boolean
          pet_name: string
          potion_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          egg_type?: string
          food_fed?: number
          id?: string
          is_active?: boolean
          is_mount?: boolean
          pet_name?: string
          potion_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      escape_penalty_zone: { Args: never; Returns: undefined }
      execute_penalty_protocol: { Args: never; Returns: undefined }
      role_to_stat: { Args: { r: string }; Returns: string }
      score_task: {
        Args: { p_direction: string; p_task_id: string }
        Returns: Json
      }
      synthesize_monster: {
        Args: {
          p_fodder_ids: string[]
          p_target_id: string
          p_use_fragments?: boolean
        }
        Returns: Json
      }
      synthesize_monster_v2: {
        Args: { p_fodder_ids: string[]; p_target_id: string }
        Returns: Json
      }
    }
    Enums: {
      banner_type: "standard" | "featured" | "streak" | "pact_seal" | "event"
      battle_mode: "chaos_tower" | "event" | "boss_rush"
      equipment_slot: "weapon" | "armor" | "helm" | "accessory"
      goal_status: "active" | "slain" | "expired"
      goal_type: "quarterly" | "monthly" | "weekly"
      guild_role: "leader" | "officer" | "member"
      monster_rarity:
        | "common"
        | "uncommon"
        | "rare"
        | "elite"
        | "epic"
        | "legendary"
        | "mythic"
        | "ex"
      monster_role: "attacker" | "tank" | "healer" | "support" | "debuffer"
      player_class: "none" | "warrior" | "mage" | "rogue" | "healer"
      pull_currency: "gems" | "pact_seals"
      quest_status: "pending" | "active" | "completed" | "failed"
      quest_type: "boss" | "collection"
      shop_category: "equipment" | "potion" | "scroll" | "seasonal" | "armoire"
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
      banner_type: ["standard", "featured", "streak", "pact_seal", "event"],
      battle_mode: ["chaos_tower", "event", "boss_rush"],
      equipment_slot: ["weapon", "armor", "helm", "accessory"],
      goal_status: ["active", "slain", "expired"],
      goal_type: ["quarterly", "monthly", "weekly"],
      guild_role: ["leader", "officer", "member"],
      monster_rarity: [
        "common",
        "uncommon",
        "rare",
        "elite",
        "epic",
        "legendary",
        "mythic",
        "ex",
      ],
      monster_role: ["attacker", "tank", "healer", "support", "debuffer"],
      player_class: ["none", "warrior", "mage", "rogue", "healer"],
      pull_currency: ["gems", "pact_seals"],
      quest_status: ["pending", "active", "completed", "failed"],
      quest_type: ["boss", "collection"],
      shop_category: ["equipment", "potion", "scroll", "seasonal", "armoire"],
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
