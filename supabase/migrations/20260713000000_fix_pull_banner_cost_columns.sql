-- Fix: pull_banner still read pull_cost_gems / pull_cost_10_gems, but
-- migration 20260610 renamed those banner columns to pull_cost_crystals /
-- pull_cost_10_crystals. Every crystal pull crashed with 42703
-- ('record v_banner has no field pull_cost_gems'). Same function,
-- corrected column names only.

CREATE OR REPLACE FUNCTION public.pull_banner(p_banner_id uuid, p_count int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_banner public.banners%ROWTYPE;
    v_profile public.profiles%ROWTYPE;
    v_is_pact_seal boolean;
    v_cost_1 int;
    v_cost_10 int;
    v_total_cost int;
    v_pull_count int;
    v_is_first_pull boolean;
    v_balance int;
    
    v_i int;
    v_roll numeric;
    v_rolled_rarity public.monster_rarity;
    v_monster public.monsters%ROWTYPE;
    v_is_new boolean;
    v_transcendence boolean;
    v_existing_um_id uuid;
    v_existing_bond numeric;
    v_existing_stars int;
    
    v_results jsonb := '[]'::jsonb;
    v_new_balance jsonb;
    
    -- weights
    w_common numeric; w_uncommon numeric; w_rare numeric; w_elite numeric;
    w_epic numeric; w_legendary numeric; w_mythic numeric; w_ex numeric;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_banner FROM public.banners WHERE id = p_banner_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Banner not found'; END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

    v_is_pact_seal := (v_banner.banner_type = 'pact_seal');
    v_cost_1 := COALESCE(v_banner.pull_cost_seals, v_banner.pull_cost_crystals);
    v_cost_10 := COALESCE(v_banner.pull_cost_seals * 10, v_banner.pull_cost_10_crystals);

    SELECT COUNT(*) INTO v_pull_count FROM public.pulls WHERE user_id = v_user_id;
    v_is_first_pull := (v_pull_count = 0);

    IF v_is_first_pull THEN
        v_total_cost := 0;
    ELSIF p_count = 1 THEN
        v_total_cost := v_cost_1;
    ELSIF p_count = 10 THEN
        v_total_cost := v_cost_10;
    ELSE
        RAISE EXCEPTION 'Invalid pull count';
    END IF;

    v_balance := CASE WHEN v_is_pact_seal THEN v_profile.pact_seals ELSE v_profile.crystals END;

    IF v_balance < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient currency';
    END IF;

    -- Load weights based on banner type
    IF v_banner.banner_type = 'standard' THEN
        w_common := 0.45; w_uncommon := 0.25; w_rare := 0.17; w_elite := 0.08;
        w_epic := 0.04; w_legendary := 0.008; w_mythic := 0.0015; w_ex := 0.0005;
    ELSIF v_banner.banner_type = 'featured' THEN
        w_common := 0.35; w_uncommon := 0.22; w_rare := 0.25; w_elite := 0.12;
        w_epic := 0.05; w_legendary := 0.009; w_mythic := 0.0008; w_ex := 0;
    ELSIF v_banner.banner_type = 'streak' THEN
        w_common := 0.25; w_uncommon := 0.20; w_rare := 0.30; w_elite := 0.16;
        w_epic := 0.07; w_legendary := 0.015; w_mythic := 0.004; w_ex := 0.001;
    ELSIF v_banner.banner_type = 'pact_seal' THEN
        w_common := 0.10; w_uncommon := 0.15; w_rare := 0.25; w_elite := 0.22;
        w_epic := 0.15; w_legendary := 0.08; w_mythic := 0.04; w_ex := 0.01;
    ELSE
        w_common := 0.40; w_uncommon := 0.23; w_rare := 0.20; w_elite := 0.10;
        w_epic := 0.05; w_legendary := 0.015; w_mythic := 0.004; w_ex := 0.001;
    END IF;

    FOR v_i IN 1..p_count LOOP
        v_roll := random();
        
        -- Determine rarity
        IF v_is_first_pull AND v_i = 1 AND p_count = 10 THEN
            v_rolled_rarity := 'rare';
        ELSIF v_roll < w_common THEN v_rolled_rarity := 'common';
        ELSIF v_roll < w_common + w_uncommon THEN v_rolled_rarity := 'uncommon';
        ELSIF v_roll < w_common + w_uncommon + w_rare THEN v_rolled_rarity := 'rare';
        ELSIF v_roll < w_common + w_uncommon + w_rare + w_elite THEN v_rolled_rarity := 'elite';
        ELSIF v_roll < w_common + w_uncommon + w_rare + w_elite + w_epic THEN v_rolled_rarity := 'epic';
        ELSIF v_roll < w_common + w_uncommon + w_rare + w_elite + w_epic + w_legendary THEN v_rolled_rarity := 'legendary';
        ELSIF v_roll < w_common + w_uncommon + w_rare + w_elite + w_epic + w_legendary + w_mythic THEN v_rolled_rarity := 'mythic';
        ELSE v_rolled_rarity := 'ex';
        END IF;

        IF v_rolled_rarity = 'ex' AND v_banner.banner_type NOT IN ('pact_seal', 'streak') THEN
            v_rolled_rarity := 'mythic';
        END IF;

        -- Select a random monster of that rarity (and realm if applicable)
        IF v_banner.realm_id IS NOT NULL THEN
            SELECT * INTO v_monster FROM public.monsters 
            WHERE rarity = v_rolled_rarity AND realm_id = v_banner.realm_id 
            ORDER BY random() LIMIT 1;
        ELSE
            SELECT * INTO v_monster FROM public.monsters 
            WHERE rarity = v_rolled_rarity 
            ORDER BY random() LIMIT 1;
        END IF;
        
        -- Fallback if no monster found of that rarity
        IF v_monster IS NULL THEN
            SELECT * INTO v_monster FROM public.monsters ORDER BY random() LIMIT 1;
        END IF;

        -- Check if user owns it
        SELECT id, bond_percent, awakening_stars INTO v_existing_um_id, v_existing_bond, v_existing_stars
        FROM public.user_monsters WHERE user_id = v_user_id AND monster_id = v_monster.id LIMIT 1;

        v_is_new := (v_existing_um_id IS NULL);
        v_transcendence := (v_monster.is_ex AND NOT v_is_new);

        IF v_is_new THEN
            INSERT INTO public.user_monsters (user_id, monster_id) VALUES (v_user_id, v_monster.id);
        ELSIF NOT v_transcendence THEN
            UPDATE public.user_monsters SET bond_percent = LEAST(100, v_existing_bond + 10) WHERE id = v_existing_um_id;
        END IF;

        INSERT INTO public.pulls (user_id, banner_id, monster_id, rarity, is_new, transcendence_stone, currency_spent, amount_spent)
        VALUES (v_user_id, p_banner_id, v_monster.id, v_monster.rarity, v_is_new, v_transcendence, CASE WHEN v_is_pact_seal THEN 'pact_seals'::public.pull_currency ELSE 'gems'::public.pull_currency END, ROUND(v_total_cost / p_count));

        v_results := v_results || jsonb_build_object(
            'monster', jsonb_build_object(
                'id', v_monster.id,
                'name', v_monster.name,
                'rarity', v_monster.rarity,
                'role', v_monster.role,
                'element', v_monster.element,
                'artUrl', v_monster.art_url,
                'realmSkill', v_monster.realm_skill
            ),
            'isNew', v_is_new,
            'transcendenceStone', v_transcendence
        );
    END LOOP;

    IF v_is_pact_seal THEN
        UPDATE public.profiles SET pact_seals = pact_seals - v_total_cost WHERE id = v_user_id;
        v_new_balance := jsonb_build_object('pactSeals', v_profile.pact_seals - v_total_cost);
    ELSE
        UPDATE public.profiles SET crystals = crystals - v_total_cost WHERE id = v_user_id;
        v_new_balance := jsonb_build_object('crystals', v_profile.crystals - v_total_cost);
    END IF;

    RETURN json_build_object('results', v_results, 'newBalance', v_new_balance);
END;
$$;
