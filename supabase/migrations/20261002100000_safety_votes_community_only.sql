drop policy if exists "Users can vote once on approved reports" on public.safety_report_votes;
create policy "Users can vote once on approved community reports"
  on public.safety_report_votes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazards
      where hazards.id = report_id
        and hazards.source_type = 'community'
        and hazards.moderation_status = 'approved'
    )
  );

drop policy if exists "Users can change their vote on approved reports" on public.safety_report_votes;
create policy "Users can change their vote on approved community reports"
  on public.safety_report_votes for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazards
      where hazards.id = report_id
        and hazards.source_type = 'community'
        and hazards.moderation_status = 'approved'
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.hazards
      where hazards.id = report_id
        and hazards.source_type = 'community'
        and hazards.moderation_status = 'approved'
    )
  );
