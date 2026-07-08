-- Optional per-achievement display label for the public Results carousel.
-- When set, /api/results uses this instead of the auto-generated
-- "{category} - {member firstName}" label. Lets an admin show the name on the
-- certificate (e.g. "Teeghan") rather than the uploading account's name.
--
-- Run in the Supabase SQL editor. STAGING first, then prod.

alter table achievements
  add column if not exists display_label text;
