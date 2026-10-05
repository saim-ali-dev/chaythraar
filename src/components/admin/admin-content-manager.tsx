"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, Plus, Save, Search, Trash2 } from "lucide-react";
import type { AdminContentEntity } from "@/lib/admin-content";

type ContentRow = { id: string; created_at: string; [key: string]: unknown };
type Field = { key: string; label: string; type?: "text" | "textarea" | "url" | "number" | "time" | "checkbox"; required?: boolean; placeholder?: string };

const fields: Record<AdminContentEntity, Field[]> = {
  encyclopedia: [
    { key: "title", label: "Title", required: true },
    { key: "category", label: "Category", required: true },
    { key: "content", label: "Content", type: "textarea", required: true },
    { key: "source", label: "Source" },
    { key: "source_url", label: "Source URL", type: "url" },
    { key: "image_url", label: "Image URL", type: "url" },
    { key: "media_url", label: "Media URL", type: "url" },
    { key: "image_source", label: "Image source" },
    { key: "image_credit", label: "Image credit" },
    { key: "image_license", label: "Image license" },
  ],
  places: [
    { key: "name", label: "Name", required: true },
    { key: "category", label: "Category", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "latitude", label: "Latitude", type: "number", placeholder: "-90 to 90" },
    { key: "longitude", label: "Longitude", type: "number", placeholder: "-180 to 180" },
    { key: "opening_time", label: "Opening time", type: "time" },
    { key: "closing_time", label: "Closing time", type: "time" },
    { key: "source", label: "Source" },
    { key: "source_url", label: "Source URL", type: "url" },
    { key: "image_url", label: "Image URL", type: "url" },
  ],
  translations: [
    { key: "khowar", label: "Khowar", required: true },
    { key: "urdu", label: "Urdu", type: "textarea", required: true },
    { key: "english", label: "English", type: "textarea", required: true },
    { key: "example", label: "Example", type: "textarea" },
    { key: "source", label: "Source" },
    { key: "verified", label: "Verified", type: "checkbox" },
  ],
};

const emptyDraft = (entity: AdminContentEntity) => Object.fromEntries(fields[entity].map((field) => [field.key, field.type === "checkbox" ? false : ""]));
const inputClass = "mt-1 w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--color-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mist)] disabled:cursor-not-allowed disabled:opacity-50";

export function AdminContentManager({ entity }: { entity: AdminContentEntity }) {
  const [records, setRecords] = useState<ContentRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown>>(() => emptyDraft(entity));
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);

  async function loadRecords(keepId = selectedId, pageToLoad = page, searchTerm = query) {
    setError("");
    const params = new URLSearchParams({ entity, page: String(pageToLoad), search: searchTerm.trim() });
    const response = await fetch(`/api/admin/content?${params}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load records.");
    const loaded = body.records as ContentRow[];
    setRecords(loaded);
    setCount(Number(body.count) || loaded.length);
    setPage(pageToLoad);
    if (keepId && loaded.some((record) => record.id === keepId)) {
      setSelectedId(keepId);
      setDraft(toDraft(loaded.find((record) => record.id === keepId)!, entity));
    } else if (loaded[0]) {
      setSelectedId(loaded[0].id);
      setDraft(toDraft(loaded[0], entity));
    } else {
      setSelectedId("");
      setDraft(emptyDraft(entity));
    }
    setIsNew(false);
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/content?entity=${entity}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load records.");
        return body;
      })
      .then((body) => {
        if (!active) return;
        const loaded = body.records as ContentRow[];
        setRecords(loaded);
        setCount(Number(body.count) || loaded.length);
        if (loaded[0]) {
          setSelectedId(loaded[0].id);
          setDraft(toDraft(loaded[0], entity));
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load records.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [entity]);

  const filteredRecords = records;
  const selected = records.find((record) => record.id === selectedId) ?? null;

  function selectRecord(record: ContentRow) {
    setSelectedId(record.id);
    setDraft(toDraft(record, entity));
    setIsNew(false);
    setMessage("");
    setError("");
  }

  function startNew() {
    setSelectedId("");
    setDraft(emptyDraft(entity));
    setIsNew(true);
    setMessage("");
    setError("");
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadRecords("", 0, query);
  }

  async function saveRecord() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, ...(isNew ? {} : { id: selectedId }), record: draft }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not save the record.");
      await loadRecords(isNew ? body.id : selectedId);
      setMessage(isNew ? "Record created." : "Changes saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the record.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord() {
    if (!selected || !window.confirm(`Delete ${getTitle(selected, entity)}? This cannot be undone.`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id: selected.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not delete the record.");
      await loadRecords("");
      setMessage("Record deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the record.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3">
        <p className="text-sm text-[var(--color-slate)]">{count} records · showing {records.length}</p>
        <button className={buttonClass} type="button" onClick={startNew}><Plus className="size-4" aria-hidden="true" />New record</button>
      </div>
      {error && <p className="border-l-2 border-[var(--color-danger-deep)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
      {message && <p className="border-l-2 border-[var(--color-copper)] bg-[var(--color-sand)] px-4 py-3 text-sm" role="status">{message}</p>}
      {loading ? <p className="flex items-center gap-2 py-8 text-sm text-[var(--color-muted)]"><LoaderCircle className="size-4 animate-spin" />Loading records</p> : (
        <div className="grid gap-5 xl:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.28fr)]">
          <section className="min-w-0 border border-[var(--color-line)] bg-white" aria-label="Content records">
            <form className="relative flex gap-2 border-b border-[var(--color-line)] p-3" onSubmit={submitSearch}><label className="min-w-0 flex-1"><Search className="pointer-events-none absolute left-6 top-6 size-4 text-[var(--color-muted)]" /><span className="sr-only">Search records by name or title</span><input className={`${inputClass} mt-0 pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" /></label><button className={buttonClass} type="submit">Search</button></form>
            <ul className="max-h-[42rem] divide-y divide-[var(--color-line)] overflow-y-auto">
              {filteredRecords.map((record) => <li key={record.id}><button type="button" onClick={() => selectRecord(record)} aria-current={selectedId === record.id && !isNew ? "true" : undefined} className={`w-full px-4 py-3 text-left hover:bg-[var(--color-mist)] ${selectedId === record.id && !isNew ? "bg-[var(--color-sand)]" : "bg-white"}`}><span className="block truncate text-sm font-semibold text-[var(--color-ink)]">{getTitle(record, entity)}</span><span className="mt-1 block truncate text-xs text-[var(--color-muted)]">{getSubtitle(record, entity)}</span></button></li>)}
              {filteredRecords.length === 0 && <li className="p-5 text-sm text-[var(--color-muted)]">No matching records.</li>}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--color-line)] p-3"><button className={buttonClass} type="button" onClick={() => void loadRecords("", page - 1)} disabled={page === 0 || busy}>Previous</button><span className="text-xs text-[var(--color-muted)]">Page {page + 1} of {Math.max(1, Math.ceil(count / 100))}</span><button className={buttonClass} type="button" onClick={() => void loadRecords("", page + 1)} disabled={(page + 1) * 100 >= count || busy}>Next</button></div>
          </section>
          <section className="min-w-0 border border-[var(--color-line)] bg-white p-4 sm:p-6" aria-label={isNew ? "New record" : "Edit record"}>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields[entity].map((field) => <label key={field.key} className={`block text-sm font-semibold text-[var(--color-ink)] ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                {field.type === "checkbox" ? <span className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.checked }))} />{field.label}</span> : <>{field.label}{field.required && <span aria-hidden="true"> *</span>}{field.type === "textarea" ? <textarea className={`${inputClass} min-h-32 resize-y`} value={String(draft[field.key] ?? "")} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} required={field.required} /> : <input className={inputClass} type={field.type ?? "text"} step={field.type === "number" ? "any" : undefined} value={draft[field.key] === null ? "" : String(draft[field.key] ?? "")} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: field.type === "number" ? event.target.value === "" ? null : Number(event.target.value) : event.target.value }))} required={field.required} placeholder={field.placeholder} />}</>}
              </label>)}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4">
              {!isNew && selected && <p className="text-xs text-[var(--color-muted)]">Added {formatDate(selected.created_at)}</p>}
              <div className="ml-auto flex flex-wrap gap-2">
                {!isNew && selected && <button className={buttonClass} type="button" onClick={() => void deleteRecord()} disabled={busy}><Trash2 className="size-4" aria-hidden="true" />Delete</button>}
                <button className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-slate)] disabled:opacity-50" type="button" onClick={() => void saveRecord()} disabled={busy}><Save className="size-4" aria-hidden="true" />{busy ? "Saving" : isNew ? "Create record" : "Save changes"}</button>
              </div>
            </div>
            {busy && <p className="mt-3 flex items-center gap-2 text-xs text-[var(--color-muted)]" role="status"><LoaderCircle className="size-3.5 animate-spin" />Saving record</p>}
            {!busy && message && <p className="sr-only"><Check aria-hidden="true" />{message}</p>}
          </section>
        </div>
      )}
    </section>
  );
}

function toDraft(record: ContentRow, entity: AdminContentEntity) {
  return Object.fromEntries(fields[entity].map((field) => [field.key, record[field.key] ?? (field.type === "checkbox" ? false : "")]));
}

function getTitle(record: ContentRow, entity: AdminContentEntity) {
  const key = entity === "encyclopedia" ? "title" : entity === "places" ? "name" : "khowar";
  return String(record[key] ?? "Untitled");
}

function getSubtitle(record: ContentRow, entity: AdminContentEntity) {
  if (entity === "encyclopedia") return `${String(record.category ?? "")} · ${String(record.source ?? "No source listed")}`;
  if (entity === "places") return `${String(record.category ?? "")} · ${record.latitude ?? "No coordinates"}`;
  return `${String(record.english ?? "")} · ${record.verified ? "Verified" : "Unverified"}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}