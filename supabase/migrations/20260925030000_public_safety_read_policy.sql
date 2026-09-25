drop policy if exists "Public can read current hazards" on public.hazards;

create policy "Public can read safety hazards"
  on public.hazards for select
  to anon, authenticated
  using (true);
