-- Safe, additive migration - run this once in the Supabase SQL Editor.
-- Adds a play-along "sheet" to songs: one text block where lines alternate chords / lyrics
-- (line 1 chords, line 2 lyrics, line 3 chords, ...). Existing songs keep a null sheet and
-- keep showing their separate chords + lyrics exactly as before. RLS is unchanged.

alter table songs add column if not exists sheet text;

-- Rollback, if ever needed (safe - nothing old was touched):
--   alter table songs drop column sheet;
