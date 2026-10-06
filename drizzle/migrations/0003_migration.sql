CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(lower(auth.jwt() ->> 'email') LIKE '%@asu.edu', false)
$$;

DROP POLICY IF EXISTS "team all units" ON public.units;
CREATE POLICY "team all units" ON public.units FOR ALL TO authenticated
  USING (public.is_team_member()) WITH CHECK (public.is_team_member());

DROP POLICY IF EXISTS "team all buildings" ON public.buildings;
CREATE POLICY "team all buildings" ON public.buildings FOR ALL TO authenticated
  USING (public.is_team_member()) WITH CHECK (public.is_team_member());

DROP POLICY IF EXISTS "team all devices" ON public.devices;
CREATE POLICY "team all devices" ON public.devices FOR ALL TO authenticated
  USING (public.is_team_member()) WITH CHECK (public.is_team_member());

DROP POLICY IF EXISTS "team edit sites" ON public.sites;
CREATE POLICY "team edit sites" ON public.sites FOR UPDATE TO authenticated
  USING (public.is_team_member()) WITH CHECK (public.is_team_member());
DROP POLICY IF EXISTS "team read sites" ON public.sites;
CREATE POLICY "team read sites" ON public.sites FOR SELECT TO authenticated
  USING (public.is_team_member());

DROP POLICY IF EXISTS "team read models" ON storage.objects;
CREATE POLICY "team read models" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'models' AND public.is_team_member());
DROP POLICY IF EXISTS "team upload models" ON storage.objects;
CREATE POLICY "team upload models" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'models' AND public.is_team_member() AND owner_id = (select auth.uid()::text));
DROP POLICY IF EXISTS "team delete models" ON storage.objects;
CREATE POLICY "team delete models" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'models' AND owner_id = (select auth.uid()::text));