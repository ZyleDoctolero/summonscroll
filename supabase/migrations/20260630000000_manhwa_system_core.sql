-- SummonScroll Manhwa System Core Migration (hardened)
-- Phase 1: Database Architecture and Security
--
-- Differences from the raw spec / Kiro draft (intentional, see chat):
--   • current_star DROPPED — unifies on existing star_level (1..7) to avoid a
--     split-brain star system between synthesize and the Promotion Chamber.
--   • execute_penalty_protocol uses auth.uid() internally (closes an authz hole
--     where any user could penalty-box another user).
--   • soul_fragments / ascension_tree are NOT NULL with '{}' default.
--   • Penalty Zone Lockout kept as RESTRICTIVE (recoverable: escape_penalty_zone
--     is SECURITY DEFINER and touches profiles, so it bypasses the lock).
--   • No destructive 1★→fragment conversion (none was specified).

-- 1. Profile Table Expansion
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS soul_tether_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS soul_fragments jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS regression_count int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS in_penalty_zone boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS penalty_zone_task text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS aura_concealed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS constellation_patron text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS constellation_favor int NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_soul_tether') THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT fk_profiles_soul_tether
        FOREIGN KEY (soul_tether_id) REFERENCES public.user_monsters(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. User Monsters Expansion  (current_star intentionally omitted — use star_level)
ALTER TABLE public.user_monsters
ADD COLUMN IF NOT EXISTS title text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS secondary_element text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS corruption_level int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ascension_tree jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. Void Artifacts System
CREATE TABLE IF NOT EXISTS public.monster_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    monster_id uuid REFERENCES public.user_monsters(id) ON DELETE SET NULL,
    slot text NOT NULL CHECK (slot IN ('weapon', 'armor', 'ring', 'necklace')),
    set_name text NOT NULL,
    main_stat text NOT NULL,
    main_stat_value numeric NOT NULL,
    sub_stats jsonb DEFAULT '[]'::jsonb,
    enhancement_level int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monster_artifacts_user_idx ON public.monster_artifacts(user_id);
CREATE INDEX IF NOT EXISTS monster_artifacts_monster_idx ON public.monster_artifacts(monster_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monster_artifacts TO authenticated;
GRANT ALL ON public.monster_artifacts TO service_role;
ALTER TABLE public.monster_artifacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'artifacts_own' AND tablename = 'monster_artifacts') THEN
        CREATE POLICY "artifacts_own" ON public.monster_artifacts
          FOR ALL TO authenticated
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Penalty Zone Lockout (RESTRICTIVE; recoverable via escape RPC)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Penalty Zone Lockout' AND tablename = 'user_monsters') THEN
        CREATE POLICY "Penalty Zone Lockout" ON public.user_monsters
        AS RESTRICTIVE FOR ALL USING (
          (SELECT in_penalty_zone FROM public.profiles WHERE id = auth.uid()) = false
        );
    END IF;
END $$;

-- 5. Server Authority (RPCs)

-- Enter penalty zone — ALWAYS the caller, never an arbitrary user_id.
CREATE OR REPLACE FUNCTION public.execute_penalty_protocol()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    random_task text;
    task_pool text[] := ARRAY[
        'Do 50 Pushups',
        'Hold a Plank for 2 Minutes',
        'Do 100 Squats',
        'Run 1 Mile',
        'Clean your workspace completely'
    ];
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    random_task := task_pool[floor(random() * array_length(task_pool, 1) + 1)];
    UPDATE public.profiles
    SET in_penalty_zone = true, penalty_zone_task = random_task
    WHERE id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.execute_penalty_protocol() TO authenticated;

-- Escape penalty zone — clears the flag for the caller. SECURITY DEFINER so it
-- bypasses the RESTRICTIVE lockout (it touches profiles, not user_monsters).
CREATE OR REPLACE FUNCTION public.escape_penalty_zone()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    UPDATE public.profiles
    SET in_penalty_zone = false, penalty_zone_task = NULL
    WHERE id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.escape_penalty_zone() TO authenticated;

-- Synthesize / star-up — server-authoritative, unified on star_level.
CREATE OR REPLACE FUNCTION public.synthesize_monster_v2(p_target_id uuid, p_fodder_ids uuid[])
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_target public.user_monsters%ROWTYPE;
    v_owned_unlocked int;
    v_uid uuid := auth.uid();
    v_tether uuid;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Target ownership
    SELECT * INTO v_target FROM public.user_monsters WHERE id = p_target_id AND user_id = v_uid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Target monster not found or unauthorized.'; END IF;
    IF v_target.star_level >= 7 THEN RAISE EXCEPTION 'Target is already at maximum star.'; END IF;

    -- Fodder must be provided and not include the target
    IF p_fodder_ids IS NULL OR array_length(p_fodder_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'No fodder provided.';
    END IF;
    IF p_target_id = ANY (p_fodder_ids) THEN
        RAISE EXCEPTION 'Target cannot be its own fodder.';
    END IF;

    -- Required fodder count == current star level (1->2 needs 1, etc.)
    IF array_length(p_fodder_ids, 1) <> v_target.star_level THEN
        RAISE EXCEPTION 'Incorrect number of fodder. Required: %', v_target.star_level;
    END IF;

    -- All fodder must be owned, unlocked, and not the soul-tether
    SELECT soul_tether_id INTO v_tether FROM public.profiles WHERE id = v_uid;
    SELECT count(*) INTO v_owned_unlocked
      FROM public.user_monsters
     WHERE id = ANY (p_fodder_ids)
       AND user_id = v_uid
       AND is_locked = false
       AND (v_tether IS NULL OR id <> v_tether);
    IF v_owned_unlocked <> array_length(p_fodder_ids, 1) THEN
        RAISE EXCEPTION 'Fodder must all be owned, unlocked, and not the tethered soul.';
    END IF;

    DELETE FROM public.user_monsters WHERE id = ANY (p_fodder_ids) AND user_id = v_uid;

    UPDATE public.user_monsters
       SET star_level = star_level + 1, level = 1
     WHERE id = p_target_id AND user_id = v_uid
     RETURNING * INTO v_target;

    RETURN row_to_json(v_target);
END;
$$;
GRANT EXECUTE ON FUNCTION public.synthesize_monster_v2(uuid, uuid[]) TO authenticated;
