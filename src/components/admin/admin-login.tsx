"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";

const fieldClass = "mt-1 w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20";

export function AdminLogin({ configured, returnTo }: { configured: boolean; returnTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Administrator sign-in failed.");
      setPassword("");
      router.replace(returnTo);
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Administrator sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-12 w-full max-w-md border-t-2 border-[var(--color-copper)] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex size-11 items-center justify-center border border-[var(--color-line)] bg-[var(--color-sand)] text-[var(--color-copper-deep)]"><KeyRound className="size-5" aria-hidden="true" /></div>
      <h2 className="mt-5 text-xl font-semibold text-[var(--color-ink)]">Administrator sign in</h2>
      {!configured ? <p className="mt-3 text-sm leading-6 text-[var(--color-slate)]">Admin access is not configured. Add an administrator email to the server-only <code>CHAYTHRAAR_ADMIN_EMAILS</code> allowlist and configure Supabase Auth.</p> : (
        <form onSubmit={signIn} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-[var(--color-ink)]" htmlFor="admin-email">Email
            <input id="admin-email" className={fieldClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </label>
          <label className="block text-sm font-semibold text-[var(--color-ink)]" htmlFor="admin-password">Password
            <input id="admin-password" className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={1024} />
          </label>
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--color-ink)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-slate)] disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            {busy ? "Signing in" : "Sign in"}
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-sm text-[var(--color-danger-deep)]" role="alert">{error}</p>}
    </section>
  );
}