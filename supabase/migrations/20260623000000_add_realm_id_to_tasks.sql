-- Migration: Add realm_id to tasks referencing realms(id)
ALTER TABLE public.tasks ADD COLUMN realm_id int REFERENCES public.realms(id) ON DELETE SET NULL;
