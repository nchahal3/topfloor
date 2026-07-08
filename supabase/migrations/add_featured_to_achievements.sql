-- Adds a `featured` flag to achievements so an admin can promote an APPROVED
-- submission onto the public Results carousel (components/FundedWins.tsx).
--
-- Two-step curation on purpose: approving verifies the win (member sees "Approved"),
-- featuring is a separate admin action that controls what is shown publicly.
--
-- Run in the Supabase SQL editor. STAGING project first, then prod after verifying.

alter table achievements
  add column if not exists featured boolean not null default false;

-- Optional ordering control for the public carousel (lower = shown earlier).
-- Nullable so existing rows are unaffected; falls back to created_at ordering.
alter table achievements
  add column if not exists featured_order integer;

-- Speeds up the public /api/results query (only featured rows, newest first).
create index if not exists achievements_featured_idx
  on achievements (featured, featured_order, created_at desc)
  where featured = true;
