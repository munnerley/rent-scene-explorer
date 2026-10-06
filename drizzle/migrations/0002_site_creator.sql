ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS created_by_name text;
ALTER TABLE public.sites ALTER COLUMN created_by SET DEFAULT auth.uid();
DROP POLICY IF EXISTS "team all sites" ON public.sites;
CREATE POLICY "team read sites" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "team add sites" ON public.sites FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "team edit sites" ON public.sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "creator deletes own site" ON public.sites FOR DELETE TO authenticated USING (created_by = auth.uid());