"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";

const inputClass = "mt-1 w-full border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20";

export function AdminAccountSettings({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/system/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not update the account password.");
      setPassword("");
      setConfirmation("");
      setMessage("Password updated.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update the account password.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="border-t border-[var(--color-line)] pt-5" aria-labelledby="admin-account-heading">
    <h2 id="admin-account-heading" className="text-lg font-semibold text-[var(--color-ink)]">Administrator account</h2>
    <p className="mt-2 text-sm text-[var(--color-slate)]">Signed in as <strong>{email}</strong></p>
    <form className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2" onSubmit={updatePassword}>
      <label className="text-sm font-semibold text-[var(--color-ink)]">New password<input className={inputClass} type="password" autoComplete="new-password" minLength={12} maxLength={1024} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label className="text-sm font-semibold text-[var(--color-ink)]">Confirm password<input className={inputClass} type="password" autoComplete="new-password" minLength={12} maxLength={1024} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      <button className="inline-flex min-h-10 items-center justify-center gap-2 justify-self-start bg-[var(--color-ink)] px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2" type="submit" disabled={busy}><KeyRound className="size-4" aria-hidden="true" />{busy ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Updating</> : "Update password"}</button>
    </form>
    {error && <p className="mt-3 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
    {message && <p className="mt-3 text-sm text-green-800" role="status">{message}</p>}
  </section>;
}