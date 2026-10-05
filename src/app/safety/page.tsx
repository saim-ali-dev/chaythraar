import { SafetyEventCard } from "@/components/safety/safety-event-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getSafetyEvents } from "@/lib/supabase/safety";
import { getSafetyStatus, isSafetyEventExpired } from "@/types/safety";
import { SafetyReportForm } from "@/components/safety/safety-report-form";

export const dynamic = "force-dynamic";

export default async function SafetyPage() {
  const { events, error } = await getSafetyEvents();
  const orderedEvents = [...events].sort((left, right) => Number(isSafetyEventExpired(left)) - Number(isSafetyEventExpired(right)) || Number(getSafetyStatus(right) === "active") - Number(getSafetyStatus(left) === "active"));
  const activeEvents = orderedEvents.filter((event) => getSafetyStatus(event) === "active" && !isSafetyEventExpired(event));
  const historicalEvents = orderedEvents.filter((event) => !activeEvents.includes(event));

  return (
    <AppShell>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-14">
        <PageHeader
          variant="operational"
          eyebrow="Safety · Advisories and events"
          title="Safety information"
          description="Review available event records with severity, status, source, timing, and location shown separately."
          actions={!error && events.length > 0 ? <div className="min-w-40 border-l-2 border-[var(--color-copper)] pl-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Current status</p><p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{activeEvents.length === 0 ? "No active events" : `${activeEvents.length} active ${activeEvents.length === 1 ? "event" : "events"}`}</p></div> : undefined}
        />
        <section className="mt-8 border-t border-[var(--color-line-strong)] pt-6" aria-labelledby="report-hazard-heading">
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Community report</p><h2 id="report-hazard-heading" className="mt-2 text-xl font-semibold text-[var(--color-ink)]">Report a Hazard</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">Reports remain private while pending. An administrator must approve a report before it appears here or on the map.</p></div>
          <SafetyReportForm />
        </section>
        {error ? <SafetyErrorState message={error} /> : events.length === 0 ? <EmptySafetyState /> : <>
          <section className="mt-10" aria-labelledby="active-safety-heading">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--color-line-strong)] pb-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-copper-deep)]">Current view</p><h2 id="active-safety-heading" className="mt-2 text-xl font-semibold text-[var(--color-ink)]">Active events</h2></div>
              <span className="text-sm text-[var(--color-muted)]">{activeEvents.length} {activeEvents.length === 1 ? "event" : "events"}</span>
            </div>
            {activeEvents.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activeEvents.map((event) => <SafetyEventCard key={event.id} event={event} />)}</div> : <p className="mt-4 border-l-2 border-[var(--color-line-strong)] py-2 pl-4 text-sm leading-6 text-[var(--color-slate)]">No active events are currently listed. Other records remain available below.</p>}
          </section>
          {historicalEvents.length > 0 && <section className="mt-12" aria-labelledby="historical-safety-heading">
            <div className="border-b border-[var(--color-line-strong)] pb-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Other records</p><h2 id="historical-safety-heading" className="mt-2 text-xl font-semibold text-[var(--color-ink)]">Past, resolved, or unverified events</h2></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{historicalEvents.map((event) => <SafetyEventCard key={event.id} event={event} />)}</div>
          </section>}
        </>}
      </main>
    </AppShell>
  );
}

function EmptySafetyState() {
  return <section className="mt-8 border-y border-[var(--color-line-strong)] py-7" role="status"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Current records</p><h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">No safety events are available.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">No placeholder or unverified reports are shown while the event list is empty.</p></section>;
}

function SafetyErrorState({ message }: { message: string }) {
  return <section className="mt-8 border-y border-[var(--color-danger-deep)]/30 py-7" role="alert"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-danger-deep)]">Unable to load</p><h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">Safety events are temporarily unavailable.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-slate)]">{message}</p></section>;
}