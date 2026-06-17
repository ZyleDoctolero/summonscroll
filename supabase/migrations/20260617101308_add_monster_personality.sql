ALTER TABLE user_monsters
ADD COLUMN personal_name TEXT,
ADD COLUMN personality_traits TEXT[],
ADD COLUMN summon_context TEXT;


CREATE OR REPLACE FUNCTION public.assign_monster_personality()
RETURNS trigger AS $$
DECLARE
    v_element text;
    v_fire_names text[] := ARRAY['Ember', 'Ashfang', 'Cin', 'Scorch', 'Pyra', 'Flint'];
    v_water_names text[] := ARRAY['Splash', 'Tide', 'Ripple', 'Coral', 'Azure'];
    v_nature_names text[] := ARRAY['Thorn', 'Bramble', 'Oak', 'Moss', 'Leaf'];
    v_light_names text[] := ARRAY['Lux', 'Dawn', 'Aura', 'Glimmer', 'Sol'];
    v_dark_names text[] := ARRAY['Umbra', 'Shade', 'Grim', 'Dusk', 'Void'];
    v_all_traits text[] := ARRAY['fierce', 'protective', 'stoic', 'playful', 'proud', 'loyal', 'curious', 'lazy', 'brave', 'cautious'];
BEGIN
    SELECT element INTO v_element FROM public.monsters WHERE id = NEW.monster_id;

    IF NEW.personal_name IS NULL THEN
        IF v_element = 'fire' THEN
            NEW.personal_name := v_fire_names[ceil(random() * array_length(v_fire_names, 1))];
        ELSIF v_element = 'water' THEN
            NEW.personal_name := v_water_names[ceil(random() * array_length(v_water_names, 1))];
        ELSIF v_element = 'nature' THEN
            NEW.personal_name := v_nature_names[ceil(random() * array_length(v_nature_names, 1))];
        ELSIF v_element = 'light' THEN
            NEW.personal_name := v_light_names[ceil(random() * array_length(v_light_names, 1))];
        ELSE
            NEW.personal_name := v_dark_names[ceil(random() * array_length(v_dark_names, 1))];
        END IF;
    END IF;

    IF NEW.personality_traits IS NULL THEN
        SELECT array_agg(t) INTO NEW.personality_traits FROM (
            SELECT unnest(v_all_traits) as t ORDER BY random() LIMIT 2
        ) sub;
    END IF;

    IF NEW.summon_context IS NULL THEN
        NEW.summon_context := 'Summoned from the mysterious void.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_monster_personality ON public.user_monsters;
CREATE TRIGGER trg_assign_monster_personality
BEFORE INSERT ON public.user_monsters
FOR EACH ROW
EXECUTE FUNCTION public.assign_monster_personality();

