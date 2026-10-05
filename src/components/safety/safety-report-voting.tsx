"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type VoteChoice = "correct" | "incorrect";
type VoteCounts = { correct: number; incorrect: number };

export function SafetyReportVoting({ reportId }: { reportId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentVote, setCurrentVote] = useState<VoteChoice | null>(null);
  const [counts, setCounts] = useState<VoteCounts>({ correct: 0, incorrect: 0 });
  const [email, setEmail] = useState("");
  const [signInMessage, setSignInMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUserId(session?.user.id ?? null);
        setCurrentVote(null);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/safety/votes?reportId=${encodeURIComponent(reportId)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load community feedback.");
        return body.counts as VoteCounts;
      })
      .then((value) => { if (active) setCounts(value); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load community feedback.");
      });
    return () => { active = false; };
  }, [reportId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const supabase = createBrowserSupabaseClient();
    void supabase.from("safety_report_votes").select("vote").eq("report_id", reportId).eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (active) setCurrentVote(data?.vote ?? null); });
    return () => { active = false; };
  }, [reportId, userId]);

  async function requestSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSignInMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/safety` },
    });
    if (signInError) setError(signInError.message);
    else setSignInMessage("Check your email for a secure sign-in link. You can vote after returning to Safety.");
    setBusy(false);
  }

  async function castVote(vote: VoteChoice) {
    if (!userId) return;
    setBusy(true);
    setError("");
    const supabase = createBrowserSupabaseClient();
    const { error: voteError } = await supabase.from("safety_report_votes").upsert({
      report_id: reportId,
      user_id: userId,
      vote,
      updated_at: new Date().toISOString(),
    }, { onConflict: "report_id,user_id" });
    if (voteError) {
      setError(voteError.message);
    } else {
      setCurrentVote(vote);
      try {
        const response = await fetch(`/api/safety/votes?reportId=${encodeURIComponent(reportId)}`, { cache: "no-store" });
        const body = await response.json();
        if (response.ok) setCounts(body.counts as VoteCounts);
      } catch {
        setError("Your vote was saved, but feedback counts could not be refreshed.");
      }
    }
    setBusy(false);
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setCurrentVote(null);
  }

  return (
    <section className="mt-5 border-t border-[var(--color-line)] pt-4" aria-label="Community feedback">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">Community feedback</h3>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--color-slate)]">
        <span className="inline-flex items-center gap-1.5"><Check className="size-4 text-green-800" />{counts.correct} Correct</span>
        <span className="inline-flex items-center gap-1.5"><X className="size-4 text-[var(--color-danger-deep)]" />{counts.incorrect} Incorrect</span>
      </div>
      {userId ? <>
        <p className="mt-3 text-xs text-[var(--color-muted)]">{currentVote ? `Your vote: ${currentVote}. You can change it.` : "Is this report accurate?"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${currentVote === "correct" ? "border-green-800 bg-green-50 text-green-900" : "border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-mist)]"}`} aria-pressed={currentVote === "correct"} disabled={busy} onClick={() => void castVote("correct")}><Check className="size-4" />Correct</button>
          <button type="button" className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${currentVote === "incorrect" ? "border-[var(--color-danger-deep)] bg-red-50 text-[var(--color-danger-deep)]" : "border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-mist)]"}`} aria-pressed={currentVote === "incorrect"} disabled={busy} onClick={() => void castVote("incorrect")}><X className="size-4" />Incorrect</button>
          {busy && <LoaderCircle className="mt-3 size-4 animate-spin text-[var(--color-muted)]" aria-label="Saving vote" />}
        </div>
        <button type="button" className="mt-2 min-h-9 text-xs font-semibold text-[var(--color-muted)] underline" onClick={() => void signOut()}>Sign out</button>
      </> : <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={requestSignIn}>
        <label className="min-w-0 flex-1"><span className="sr-only">Email for secure sign-in</span><input className="h-10 w-full rounded-md border border-[var(--color-line-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--color-copper)] focus:ring-2 focus:ring-[var(--color-copper)]/20" type="email" autoComplete="email" required placeholder="Email to sign in and vote" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <button type="submit" className="min-h-10 rounded-md bg-[var(--color-ink)] px-3 text-sm font-semibold text-white hover:bg-[var(--color-slate)] disabled:opacity-50" disabled={busy}>{busy ? "Sending…" : "Email sign-in link"}</button>
      </form>}
      {signInMessage && <p className="mt-2 text-xs text-[var(--color-slate)]" role="status">{signInMessage}</p>}
      {error && <p className="mt-2 text-xs text-[var(--color-danger-deep)]" role="alert">{error}</p>}
    </section>
  );
}
