"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, LoaderCircle, RefreshCw, X } from "lucide-react";

type ModerationState = "pending" | "approved" | "rejected";
type SafetyReport = {
  id: string;
  type: string;
  title: string | null;
  description: string;
  additional_details: string | null;
  latitude: number | null;
  longitude: number | null;
  severity: string;
  status: string;
  location_name: string | null;
  reported_at: string;
  submitted_at: string;
  photo_url: string | null;
  moderation_status: ModerationState;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  votes: { correct: number; incorrect: number };
};
type ReportEdit = { title: string; description: string; additional_details: string; location_name: string; type: string; status: string };

const fieldClass = "mt-1 w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-mist)] disabled:cursor-not-allowed disabled:opacity-50";
const HAZARD_STATES = ["active", "resolved", "closed", "expired", "unverified"];

function reportEdit(report: SafetyReport): ReportEdit {
  return {
    title: report.title ?? report.type,
    description: report.description,
    additional_details: report.additional_details ?? "",
    location_name: report.location_name ?? "",
    type: report.type,
    status: report.status === "unverified" ? "active" : report.status,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AdminSafetyModeration() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [edits, setEdits] = useState<Record<string, ReportEdit>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => response.json())
      .then((body) => {
        if (!active) return;
        setAuthorized(Boolean(body.authorized));
      })
      .catch(() => { if (active) setError("Unable to check administrator access."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function loadReports() {
    setError("");
    try {
      const response = await fetch("/api/admin/safety", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load reports.");
      setReports(body.reports as SafetyReport[]);
      setEdits(Object.fromEntries((body.reports as SafetyReport[]).map((report) => [report.id, reportEdit(report)])));
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reports.");
    }
  }

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    fetch("/api/admin/safety", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load reports.");
        return body.reports as SafetyReport[];
      })
      .then((loadedReports) => {
        if (!active) return;
        setReports(loadedReports);
        setEdits(Object.fromEntries(loadedReports.map((report) => [report.id, reportEdit(report)])));
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load reports.");
      });
    return () => { active = false; };
  }, [authorized]);

  async function moderate(report: SafetyReport, action: "approve" | "reject" | "edit") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/safety", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, action, ...(action === "edit" ? edits[report.id] : { hazard_status: edits[report.id]?.status ?? "active" }) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The report could not be updated.");
      setMessage(action === "approve" ? "Report approved and made public." : action === "reject" ? "Report rejected and kept private." : "Report details saved.");
      await loadReports();
    } catch (moderationError: unknown) {
      setError(moderationError instanceof Error ? moderationError.message : "The report could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <p className="flex items-center gap-2 py-8 text-sm text-[var(--color-muted)]"><LoaderCircle className="size-4 animate-spin" />Checking administrator access</p>;
  if (!authorized) return <p className="py-8 text-sm text-[var(--color-slate)]" role="alert">Your admin session is unavailable. <Link href="/admin" className="font-semibold text-[var(--color-copper-deep)]">Sign in at the control center.</Link></p>;

  const visibleReports = reports.filter((report) => filter === "all" || report.moderation_status === filter);
  const pendingCount = reports.filter((report) => report.moderation_status === "pending").length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <p className="text-sm text-[var(--color-slate)]">{pendingCount} pending {pendingCount === 1 ? "report" : "reports"}</p>
        <button className={buttonClass} type="button" onClick={() => void loadReports()} disabled={busy}><RefreshCw className="size-4" />Refresh</button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter moderation reports">
        {(["pending", "approved", "rejected", "all"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} className={`min-h-10 rounded-md border px-3 text-sm font-semibold capitalize ${filter === value ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line-strong)] bg-white text-[var(--color-slate)]"}`} onClick={() => setFilter(value)}>{value}</button>)}
      </div>
      {message && <p className="border-l-2 border-[var(--color-copper)] bg-[var(--color-sand)] px-4 py-3 text-sm" role="status">{message}</p>}
      {error && <p className="border-l-2 border-[var(--color-danger-deep)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
      {visibleReports.length === 0 ? <p className="border-y border-[var(--color-line-strong)] py-6 text-sm text-[var(--color-muted)]">No {filter === "all" ? "community" : filter} reports.</p> : <div className="space-y-4">
        {visibleReports.map((report) => {
          const edit = edits[report.id] ?? reportEdit(report);
          return <article key={report.id} className="border border-[var(--color-line)] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase text-[var(--color-copper-deep)]">{report.type} · {report.severity}</p><h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{report.title ?? report.type}</h2></div>
              <span className={`rounded-sm border px-2.5 py-1 text-xs font-semibold capitalize ${report.moderation_status === "pending" ? "border-[var(--color-caution-deep)]/40 text-[var(--color-caution-deep)]" : report.moderation_status === "approved" ? "border-green-800/30 text-green-900" : "border-[var(--color-danger-deep)]/30 text-[var(--color-danger-deep)]"}`}>{report.moderation_status === "approved" ? "Admin-approved" : report.moderation_status}</span>
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-[var(--color-slate)] sm:grid-cols-2">
              <div><dt className="text-[var(--color-muted)]">Submitted</dt><dd><time dateTime={report.submitted_at}>{formatDate(report.submitted_at)}</time></dd></div>
              <div><dt className="text-[var(--color-muted)]">Observed</dt><dd><time dateTime={report.reported_at}>{formatDate(report.reported_at)}</time></dd></div>
              <div><dt className="text-[var(--color-muted)]">Location</dt><dd>{report.location_name || "Not listed"}</dd></div>
              <div><dt className="text-[var(--color-muted)]">Coordinates</dt><dd>{report.latitude === null || report.longitude === null ? "Not provided" : `${report.latitude}, ${report.longitude}`}</dd></div>
              <div><dt className="text-[var(--color-muted)]">Hazard status</dt><dd className="capitalize">{report.status}</dd></div>
              {report.approved_at && <div><dt className="text-[var(--color-muted)]">Moderated</dt><dd>{report.approved_by ?? "Admin"} · {formatDate(report.approved_at)}</dd></div>}
              {report.rejected_at && <div><dt className="text-[var(--color-muted)]">Rejected</dt><dd>{report.rejected_by ?? "Admin"} · {formatDate(report.rejected_at)}</dd></div>}
            </dl>
            {report.photo_url && <div className="mt-4 overflow-hidden border border-[var(--color-line)] bg-[var(--color-sand)]"><Image src={report.photo_url} alt={`Submitted photo for ${report.title ?? report.type}`} width={1200} height={800} unoptimized className="max-h-[28rem] w-full object-contain" /></div>}
            <label className="mt-4 block text-xs font-semibold text-[var(--color-muted)]">Title
              <input className={fieldClass} value={edit.title} maxLength={160} onChange={(event) => setEdits((current) => ({ ...current, [report.id]: { ...edit, title: event.target.value } }))} />
            </label>
            <label className="mt-3 block text-xs font-semibold text-[var(--color-muted)]">Description
              <textarea className={`${fieldClass} min-h-24 resize-y`} value={edit.description} maxLength={5000} onChange={(event) => setEdits((current) => ({ ...current, [report.id]: { ...edit, description: event.target.value } }))} />
            </label>
            {report.additional_details && <p className="mt-3 text-sm leading-6 text-[var(--color-slate)]"><span className="font-semibold">Additional details: </span>{report.additional_details}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[var(--color-muted)]">Location
                <input className={fieldClass} value={edit.location_name} maxLength={240} onChange={(event) => setEdits((current) => ({ ...current, [report.id]: { ...edit, location_name: event.target.value } }))} />
              </label>
              <label className="block text-xs font-semibold text-[var(--color-muted)]">Hazard lifecycle status
                <select className={fieldClass} value={edit.status} onChange={(event) => setEdits((current) => ({ ...current, [report.id]: { ...edit, status: event.target.value } }))}>{HAZARD_STATES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
              </label>
            </div>
            <p className="mt-4 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-slate)]">Community feedback · {report.votes.correct} Correct · {report.votes.incorrect} Incorrect</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={buttonClass} type="button" disabled={busy} onClick={() => void moderate(report, "edit")}>Save details</button>
              {report.moderation_status !== "approved" ? <button className={`${buttonClass} border-green-800 bg-green-800 text-white hover:bg-green-900`} type="button" disabled={busy} onClick={() => void moderate(report, "approve")}><Check className="size-4" />Approve</button> : null}
              {report.moderation_status !== "rejected" ? <button className={`${buttonClass} border-[var(--color-danger-deep)] text-[var(--color-danger-deep)]`} type="button" disabled={busy} onClick={() => void moderate(report, "reject")}><X className="size-4" />{report.moderation_status === "approved" ? "Remove from public" : "Reject"}</button> : null}
              {busy && <LoaderCircle className="mt-3 size-4 animate-spin text-[var(--color-muted)]" aria-label="Saving moderation action" />}
            </div>
          </article>;
        })}
      </div>}
    </section>
  );
}
