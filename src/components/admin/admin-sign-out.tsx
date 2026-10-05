"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminSignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin");
    router.refresh();
  }

  return <button className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-line-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-mist)] disabled:opacity-60" type="button" onClick={signOut} disabled={busy}><LogOut className="size-4" aria-hidden="true" />{busy ? "Signing out" : "Sign out"}</button>;
}