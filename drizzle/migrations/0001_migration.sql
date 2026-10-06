create policy "team read models" on storage.objects for select to authenticated using (bucket_id = 'models');
create policy "team upload models" on storage.objects for insert to authenticated with check (bucket_id = 'models');
create policy "team delete models" on storage.objects for delete to authenticated using (bucket_id = 'models');