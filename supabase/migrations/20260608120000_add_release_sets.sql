ALTER TABLE public.monsters 
ADD COLUMN bestiary_id int not null default 0,
ADD COLUMN release_set int not null default 1;
