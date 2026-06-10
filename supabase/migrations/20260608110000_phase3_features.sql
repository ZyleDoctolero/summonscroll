-- Phase 3 Features Migration

-- Ascension
ALTER TABLE public.user_monsters ADD COLUMN ascension_level INT NOT NULL DEFAULT 0;

-- Talents, Combos
ALTER TABLE public.profiles ADD COLUMN talents JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN combo_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN last_task_time TIMESTAMP WITH TIME ZONE;

-- Tags
ALTER TABLE public.tasks ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}'::text[];
