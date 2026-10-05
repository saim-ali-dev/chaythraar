"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AlertTriangle, ImagePlus, LoaderCircle } from "lucide-react";

const fieldClass = "mt-1 w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20";
const HAZARD_TYPES = ["Road blockage", "Flooding", "Landslide", "Severe weather", "Wildlife", "Infrastructure damage", "Other"];

export function SafetyReportForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectPhoto(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhoto(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
    setError("");
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const observedAt = form.get("reported_at");
    if (typeof observedAt === "string" && observedAt) {
      form.set("reported_at", new Date(observedAt).toISOString());
    }
    if (photo) form.set("photo", photo);
    try {
      const response = await fetch("/api/safety/reports", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to submit this report.");
      setSubmitted(true);
      setPhoto(null);
      setPreviewUrl("");
      formElement.reset();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit this report.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <section className="border-l-2 border-[var(--color-copper)] bg-[var(--color-sand)] p-5" role="status">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Report received for review</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-slate)]">This report is pending administrator moderation. It is not public and will not appear in the safety feed unless an administrator approves it.</p>
        <button type="button" className="mt-4 min-h-10 text-sm font-semibold text-[var(--color-copper-deep)] underline" onClick={() => setSubmitted(false)}>Submit another report</button>
      </section>
    );
  }

  return (
    <form onSubmit={submitReport} className="grid gap-4" encType="multipart/form-data">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--color-ink)]">Hazard title
          <input className={fieldClass} name="title" maxLength={160} required />
        </label>
        <label className="block text-sm font-semibold text-[var(--color-ink)]">Hazard category
          <select className={fieldClass} name="type" required defaultValue="">
            <option value="" disabled>Select a category</option>
            {HAZARD_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold text-[var(--color-ink)]">Description
        <textarea className={`${fieldClass} min-h-28 resize-y`} name="description" maxLength={5000} required />
      </label>
      <label className="block text-sm font-semibold text-[var(--color-ink)]">Location
        <input className={fieldClass} name="location_name" maxLength={240} placeholder="Village, road, or nearby landmark" required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--color-ink)]">Latitude <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          <input className={fieldClass} name="latitude" type="number" min={-90} max={90} step="any" inputMode="decimal" />
        </label>
        <label className="block text-sm font-semibold text-[var(--color-ink)]">Longitude <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          <input className={fieldClass} name="longitude" type="number" min={-180} max={180} step="any" inputMode="decimal" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--color-ink)]">Observed at <span className="font-normal text-[var(--color-muted)]">(optional)</span>
          <input className={fieldClass} name="reported_at" type="datetime-local" />
        </label>
        <label className="block text-sm font-semibold text-[var(--color-ink)]">Severity
          <select className={fieldClass} name="severity" defaultValue="medium">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold text-[var(--color-ink)]">Additional details <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        <textarea className={`${fieldClass} min-h-20 resize-y`} name="additional_details" maxLength={3000} />
      </label>
      <div>
        <label className="block text-sm font-semibold text-[var(--color-ink)]" htmlFor="safety-report-photo">Photo <span className="font-normal text-[var(--color-muted)]">(optional, JPEG/PNG/WebP, up to 8 MB)</span></label>
        <input id="safety-report-photo" className={`${fieldClass} file:mr-3 file:rounded-sm file:border-0 file:bg-[var(--color-mist)] file:px-3 file:py-2 file:text-xs file:font-semibold`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />
        {previewUrl ? <div className="mt-3 flex items-start gap-3 border border-[var(--color-line)] bg-[var(--color-sand)] p-3"><Image src={previewUrl} alt="Selected safety report photo preview" width={240} height={160} unoptimized className="aspect-[3/2] w-40 object-cover" /><p className="min-w-0 break-all self-center text-xs text-[var(--color-muted)]">{photo?.name}</p></div> : <p className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]"><ImagePlus className="size-4" />No photo selected</p>}
      </div>
      {error && <p className="text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
      <p className="flex items-start gap-2 border-l-2 border-[var(--color-caution-deep)]/50 py-1 pl-3 text-xs leading-5 text-[var(--color-slate)]"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-caution-deep)]" />Reports are private while pending. Public visibility requires administrator approval.</p>
      <button className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md bg-[var(--color-ink)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-slate)] disabled:opacity-50" type="submit" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{busy ? "Submitting…" : "Submit report"}</button>
    </form>
  );
}
