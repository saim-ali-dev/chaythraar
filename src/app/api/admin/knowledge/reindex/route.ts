import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { hasSameOrigin } from "@/lib/http-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const runFile = promisify(execFile);
const sourceTypes = new Set([
  "encyclopedia", "place", "news", "safety", "translation", "khowar_lexicon", "khowar_glossary",
]);

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  if (!await getAdminUser()) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { sourceType?: unknown } | null;
  if (typeof body?.sourceType !== "string" || !sourceTypes.has(body.sourceType)) {
    return NextResponse.json({ error: "Select a supported source type." }, { status: 400 });
  }

  const runner = resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
  const indexer = resolve(process.cwd(), "scripts/rag-index.ts");
  try {
    const { stdout, stderr } = await runFile(process.execPath, [runner, indexer, "--source-type", body.sourceType], {
      cwd: process.cwd(),
      env: process.env,
      encoding: "utf8",
      timeout: 290_000,
      maxBuffer: 2_000_000,
      windowsHide: true,
    });
    return NextResponse.json({ output: [stdout, stderr].filter(Boolean).join("\n").slice(-12000) });
  } catch (error) {
    const details = error && typeof error === "object" && "stdout" in error && typeof error.stdout === "string"
      ? error.stdout.slice(-6000)
      : "";
    const timedOut = Boolean(error && typeof error === "object" && "killed" in error && error.killed);
    return NextResponse.json({
      error: timedOut ? "Indexing timed out. Retry a smaller source type." : "The indexer could not complete.",
      output: details,
    }, { status: timedOut ? 504 : 502 });
  }
}