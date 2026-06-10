-- Remove pity mechanic entirely. Every pull is now an independent roll.

-- Drop pity_counters table (RLS policies and trigger drop with it).
drop trigger if exists pity_set_updated_at on public.pity_counters;
drop policy if exists "pity_select_own" on public.pity_counters;
drop policy if exists "pity_insert_own" on public.pity_counters;
drop policy if exists "pity_update_own" on public.pity_counters;
drop table if exists public.pity_counters;

-- Drop is_pity column from pulls history.
alter table public.pulls drop column if exists is_pity;
