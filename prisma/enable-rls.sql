-- Enable Row-Level Security (RLS) on all public tables.
--
-- Why: Supabase exposes the `public` schema over its auto-generated REST API
-- (PostgREST) using the roles behind your public anon key
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY). Without RLS, anyone with the project URL +
-- anon key can read/edit/delete every row. This is the "rls_disabled_in_public"
-- Critical advisor warning.
--
-- Safe for this app: all table access goes through Prisma, which connects as the
-- `postgres` table-owner role (DIRECT_URL / DATABASE_URL). Table owners BYPASS
-- RLS, so Prisma queries are unaffected. The Supabase JS client here is only used
-- for Storage buckets, never for table reads/writes — so no policies are needed.
-- With RLS enabled and no policies, the anon/authenticated roles are denied by
-- default, which is exactly what we want.
--
-- Idempotent: safe to run multiple times.

ALTER TABLE public.users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_shares         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_buildings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_floors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watched_listings        ENABLE ROW LEVEL SECURITY;
