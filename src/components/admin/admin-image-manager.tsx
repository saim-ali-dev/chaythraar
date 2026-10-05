"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Eye, ImagePlus, LoaderCircle, Search, Trash2 } from "lucide-react";

type RecordType = "encyclopedia" | "places" | "news" | "site_media";
type ImageRecord = {
  id: string;
  type: RecordType;
  title: string;
  category: string;
  image_url: string | null;
  media_url: string | null;
  image_source: string;
  image_credit: string;
  image_license: string;
};
type Draft = Pick<ImageRecord, "image_url" | "media_url" | "image_source" | "image_credit" | "image_license">;
type PreviewStatus = "idle" | "loaded" | "invalid";

const fieldClass = "mt-1 w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-mist)] disabled:cursor-not-allowed disabled:opacity-50";

function isHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function toDraft(record: ImageRecord): Draft {
  return {
    image_url: record.image_url ?? "",
    media_url: record.media_url ?? "",
    image_source: record.image_source,
    image_credit: record.image_credit,
    image_license: record.image_license,
  };
}

export function AdminImageManager() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [records, setRecords] = useState<ImageRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draftState, setDraftState] = useState<{ recordId: string; values: Draft } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [imageFilter, setImageFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("idle");
  const [previewRequested, setPreviewRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => ({ response, body: await response.json() }))
      .then(({ body }) => {
        if (!active) return;
        setAuthorized(Boolean(body.authorized));
      })
      .catch(() => {
        if (active) setError("Unable to check administrator access.");
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    fetch("/api/admin/images", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load image records.");
        return body.records as ImageRecord[];
      })
      .then((loadedRecords) => {
        if (!active) return;
        setRecords(loadedRecords);
        setSelectedId((current) => current || loadedRecords[0]?.id || "");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load image records.");
      });
    return () => { active = false; };
  }, [authorized]);

  const categories = Array.from(new Set(records.map((record) => record.category))).sort((left, right) => left.localeCompare(right));
  const filteredRecords = records
    .filter((record) => `${record.title} ${record.category}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((record) => category === "All categories" || record.category === category)
    .filter((record) => imageFilter === "all" || (imageFilter === "with" ? Boolean(record.image_url) : !record.image_url))
    .sort((left, right) => {
      const comparison = sortBy === "category"
        ? left.category.localeCompare(right.category) || left.title.localeCompare(right.title)
        : left.title.localeCompare(right.title);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  const selectedRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null;
  const draft = selectedRecord && draftState?.recordId === selectedRecord.id
    ? draftState.values
    : selectedRecord
      ? toDraft(selectedRecord)
      : { image_url: "", media_url: "", image_source: "", image_credit: "", image_license: "" };
  const setDraft = (next: Draft | ((current: Draft) => Draft)) => {
    if (!selectedRecord) return;
    setDraftState((current) => {
      const currentDraft = current?.recordId === selectedRecord.id ? current.values : toDraft(selectedRecord);
      return { recordId: selectedRecord.id, values: typeof next === "function" ? next(currentDraft) : next };
    });
  };

  async function saveImage(remove = false) {
    if (!selectedRecord) return;
    setBusy(true);
    setError("");
    setMessage("");
    const values = remove
      ? { image_url: null, image_source: null, image_credit: null, image_license: null, media_url: draft.media_url || null }
      : { ...draft, image_url: draft.image_url || null, media_url: draft.media_url || null };
    try {
      const response = await fetch("/api/admin/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRecord.id, type: selectedRecord.type, ...values }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save image details.");
      const updated = { ...selectedRecord, ...values } as ImageRecord;
      setRecords((current) => current.map((record) => record.id === updated.id ? updated : record));
      setDraft(toDraft(updated));
      setPreviewStatus("idle");
      setPreviewRequested(false);
      setMessage(remove ? "Image removed." : "Image details saved.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save image details.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <p className="flex items-center gap-2 py-8 text-sm text-[var(--color-muted)]"><LoaderCircle className="size-4 animate-spin" />Checking administrator access</p>;

  if (!authorized) {
    return (
      <p className="py-8 text-sm text-[var(--color-slate)]" role="alert">Your admin session is unavailable. <Link href="/admin" className="font-semibold text-[var(--color-copper-deep)]">Sign in at the control center.</Link></p>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <p className="text-sm text-[var(--color-slate)]">{records.length} image-bearing records</p>
      </div>

      {error && <p className="border-l-2 border-[var(--color-danger-deep)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
      {message && <p className="border-l-2 border-[var(--color-copper)] bg-[var(--color-sand)] px-4 py-3 text-sm text-[var(--color-ink)]" role="status">{message}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <section className="min-w-0 border border-[var(--color-line)] bg-white" aria-label="Image library records">
          <div className="space-y-3 border-b border-[var(--color-line)] p-4">
            <label className="relative block">
              <span className="sr-only">Search records</span>
              <Search className="absolute left-3 top-3 size-4 text-[var(--color-muted)]" />
              <input className={`${fieldClass} mt-0 pl-9`} type="search" placeholder="Search title or category" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-[var(--color-slate)]">Category
                <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>All categories</option>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--color-slate)]">Image
                <select className={fieldClass} value={imageFilter} onChange={(event) => setImageFilter(event.target.value)}>
                  <option value="all">All records</option>
                  <option value="with">With image</option>
                  <option value="without">Without image</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--color-slate)]">Sort by
                <select className={fieldClass} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="title">Title</option>
                  <option value="category">Category</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--color-slate)]">Order
                <select className={fieldClass} value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
                  <option value="asc">A to Z</option>
                  <option value="desc">Z to A</option>
                </select>
              </label>
            </div>
            <p className="text-xs text-[var(--color-muted)]">{filteredRecords.length} records shown</p>
          </div>
          <ul className="max-h-[42rem] divide-y divide-[var(--color-line)] overflow-y-auto">
            {filteredRecords.map((record) => (
              <li key={`${record.type}:${record.id}`}>
                <button type="button" onClick={() => setSelectedId(record.id)} aria-current={selectedRecord?.id === record.id ? "true" : undefined} className={`flex min-h-[4.5rem] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-mist)] ${selectedRecord?.id === record.id ? "bg-[var(--color-sand)]" : "bg-white"}`}>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[var(--color-ink)]">{record.title}</span><span className="mt-1 block truncate text-xs text-[var(--color-muted)]">{record.category} · {record.type === "site_media" ? "Site media" : record.type}</span></span>
                  <span className={`shrink-0 text-xs font-semibold ${record.image_url ? "text-[var(--color-copper-deep)]" : "text-[var(--color-muted)]"}`}>{record.image_url ? "Assigned" : "No image"}</span>
                </button>
              </li>
            ))}
            {filteredRecords.length === 0 && <li className="p-5 text-sm text-[var(--color-muted)]">No matching records.</li>}
          </ul>
        </section>

        {selectedRecord ? (
          <section className="min-w-0 border border-[var(--color-line)] bg-white p-5 sm:p-7" aria-label="Selected image record">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs font-semibold uppercase text-[var(--color-copper-deep)]">{selectedRecord.category} · {selectedRecord.type === "site_media" ? "Site media" : selectedRecord.type}</p><h2 className="mt-1 break-words text-xl font-semibold text-[var(--color-ink)]">{selectedRecord.title}</h2></div>
              <p className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs font-semibold ${!draft.image_url ? "border-[var(--color-line)] text-[var(--color-muted)]" : !isHttpUrl(draft.image_url) || previewStatus === "invalid" ? "border-[var(--color-danger-deep)]/40 text-[var(--color-danger-deep)]" : previewStatus === "loaded" ? "border-green-700/30 text-green-800" : "border-[var(--color-copper)]/40 text-[var(--color-copper-deep)]"}`} role="status">
                {!draft.image_url ? "No image" : !isHttpUrl(draft.image_url) || previewStatus === "invalid" ? "Image URL invalid" : previewStatus === "loaded" ? "Image loaded" : "Image assigned"}
              </p>
            </div>

            <div className="mt-5 aspect-[16/9] overflow-hidden border border-[var(--color-line)] bg-[var(--color-sand)]">
              {draft.image_url && isHttpUrl(draft.image_url) && (previewRequested || draft.image_url === selectedRecord.image_url) ? (
                <Image key={draft.image_url} src={draft.image_url} alt={`${selectedRecord.title} image preview`} width={960} height={540} unoptimized className="h-full w-full object-contain" onLoad={() => setPreviewStatus("loaded")} onError={() => setPreviewStatus("invalid")} />
              ) : <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--color-muted)]"><ImagePlus className="size-6" aria-hidden="true" />{draft.image_url ? "Preview the entered URL" : "No image assigned"}</div>}
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold text-[var(--color-ink)]">Image URL
                <input className={fieldClass} type="url" inputMode="url" value={draft.image_url ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, image_url: event.target.value })); setPreviewStatus("idle"); setPreviewRequested(false); }} placeholder="https://…" />
              </label>
              {selectedRecord.type === "encyclopedia" && <label className="block text-sm font-semibold text-[var(--color-ink)]">Media URL
                <input className={fieldClass} type="url" inputMode="url" value={draft.media_url ?? ""} onChange={(event) => setDraft((current) => ({ ...current, media_url: event.target.value }))} placeholder="https://…" />
              </label>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[var(--color-ink)]">Image source
                  <input className={fieldClass} value={draft.image_source} onChange={(event) => setDraft((current) => ({ ...current, image_source: event.target.value }))} placeholder="Wikimedia Commons" maxLength={500} />
                </label>
                <label className="block text-sm font-semibold text-[var(--color-ink)]">Image credit / author
                  <input className={fieldClass} value={draft.image_credit} onChange={(event) => setDraft((current) => ({ ...current, image_credit: event.target.value }))} placeholder="Photographer name" maxLength={500} />
                </label>
              </div>
              <label className="block text-sm font-semibold text-[var(--color-ink)]">License
                <input className={fieldClass} value={draft.image_license} onChange={(event) => setDraft((current) => ({ ...current, image_license: event.target.value }))} placeholder="CC BY-SA 4.0" maxLength={500} />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-4">
              <button className={buttonClass} type="button" disabled={!draft.image_url || !isHttpUrl(draft.image_url)} onClick={() => { setPreviewRequested(true); setPreviewStatus("idle"); }}><Eye className="size-4" />Preview</button>
              <button className={`${buttonClass} border-[var(--color-ink)] bg-[var(--color-ink)] text-white hover:bg-[var(--color-slate)]`} type="button" disabled={busy || (!draft.image_url && !draft.media_url && !draft.image_source && !draft.image_credit && !draft.image_license)} onClick={() => saveImage()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}Save image</button>
              <button className={buttonClass} type="button" disabled={busy || (!selectedRecord.image_url && !draft.image_url)} onClick={() => saveImage(true)}><Trash2 className="size-4" />Remove image</button>
            </div>
          </section>
        ) : <section className="grid min-h-64 place-items-center border border-[var(--color-line)] bg-white p-6 text-sm text-[var(--color-muted)]">No records are available to edit.</section>}
      </div>
    </section>
  );
}
