# CHAYTHRAAR

CHAYTHRAAR is an AI-powered unified digital platform for Chitral, Pakistan. It brings local knowledge, discovery, language, safety, maps, weather, and current information into one thoughtful experience.

## Current MVP

The first foundation slice includes:

- A responsive application shell and global navigation
- An assistant-led home experience with a UI-only demo interaction
- Typed local demo content for knowledge, discovery, news, and safety
- Placeholder routes for Explore, Discover, News, Safety, Khowar, and Map
- A light visual system inspired by regional knowledge and exploration

All visible content is demo data. It is not a live news feed, safety service, map, weather service, or AI assistant.

## Tech Stack

- Next.js App Router 16
- React 19 and TypeScript
- Tailwind CSS 4
- Lucide React icons
- ESLint with Next.js Core Web Vitals rules

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation commands:

```bash
npm run lint
npm run build
```

## Planned Integrations

- Supabase for PostgreSQL, pgvector, and storage
- A retrieval-backed AI assistant
- OpenStreetMap and Leaflet for maps
- Open-Meteo for weather
- Verified local sources for news and safety information
- Structured Khowar language content

Integrations will be added behind typed data and service boundaries so the UI does not need to be rewritten.

## Supabase Foundation

The repository contains the initial schema at `supabase/migrations/20260924000000_initial_schema.sql`. The app currently does not query Supabase, so the local demo experience works while the database is empty.

Set these variables in an ignored local `.env.local` file:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
GROQ_API_KEY=your-groq-api-key
NEWS_AI_API_URL=https://api.groq.com/openai/v1/chat/completions
NEWS_AI_MODEL=openai/gpt-oss-20b
```

The values must come from the Supabase project settings. Never commit `.env.local` or expose the values in source code.
For news and safety summarization, use a Groq API key in `GROQ_API_KEY`; keep it server-only and never place it in browser code.

To apply the migration without installing the Supabase CLI:

1. Open the Supabase project dashboard.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of `supabase/migrations/20260924000000_initial_schema.sql` into the query editor.
4. Run the query.
5. In **Table Editor**, verify the five tables and in **Authentication > Policies**, verify that each table has RLS enabled and only the intended read policies.

No seed data is included yet. Content remains local demo data until verified ingestion and moderation flows are implemented.

## News Ingestion

The existing sources are the publicly advertised Chitral Times RSS feed at `https://chitraltimes.com/feed/` (up to five RSS pages) and ChitralToday at `https://chitraltoday.net/feed/`. Run the canonical combined ingestion manually with:

```bash
npm run news:ingest
```

In addition to the public Supabase variables above, ingestion requires `SUPABASE_SERVICE_ROLE_KEY` in the ignored local `.env.local` file. This server-only key is required because the database has no anonymous write policy; it must never be exposed to browser code or committed.

The command fetches and normalizes both feeds, then keeps candidates with `published_at >= now - 48 hours` using a single UTC timestamp for that run. The boundary is inclusive. It deduplicates exact `(source, normalized source_url)` identities, compares title, excerpt, category, language, and publication time (ignoring whitespace-only differences), and ranks eligible candidates by newest `published_at`, then ascending `source_url` and source name for deterministic ties. No source priority or external ranking score is used. At most 10 candidates are selected across the sources.

Only selected new, materially changed, or incomplete records are sent to summarization. Completed generated headlines and summaries are reused for unchanged records. Source metadata is stored even if summarization is unavailable or fails. Older rows are not deleted; the active News page reads only the inclusive 48-hour window and displays at most 10 rows. A separate History UI is not implemented.

The repository has no deployment-specific scheduler configuration. Configure the deployment scheduler to invoke `npm run news:ingest` every 12 hours, wait for each run to finish before starting another, and set scheduled-job concurrency to one. Both source adapters already run sequentially inside the canonical command. There is no database unique constraint on `(source, source_url)`, so application checks cannot guarantee idempotence against arbitrary concurrent manual runs.

Generated CHAYTHRAAR headlines and summaries are additive fields from `supabase/migrations/20260925010000_add_generated_news_fields.sql`. Apply that migration before running the updated ingestion or backfill command. Groq summarization is configured with server-only `GROQ_API_KEY`, `NEWS_AI_API_URL`, and `NEWS_AI_MODEL`; without those variables, ingestion stores original metadata and leaves generated fields null.

After applying the migration, use `npm run news:summarize` to manually backfill at most the 10 newest rows in the current 48-hour window that have missing generated fields. Complete historical rows are never resummarized by the backfill. The command is not scheduled automatically and does not copy full source articles.

## Khowar Lexical Data

The FLI [Khowar Word List](https://mozilladatacollective.com/datasets/cmlgxqdl80019mg07p0197u76) is licensed CC-BY-NC-4.0 and contains script/lexical tokens, not translation pairs. Apply `supabase/migrations/20260927000000_add_khowar_lexicon.sql` before importing. Download `khowar-word-list-3067143b.tar.gz` from Mozilla Data Collective while signed in, then run:

```bash
npm run khowar:import -- --archive /path/to/khowar-word-list-3067143b.tar.gz
npm run rag:index
```

The importer verifies the official archive size, SHA-256, text-file layout, and expected token counts before writing. Each record retains FLI attribution, source URL, and license. RAG chunks identify this as lexical/script data without definitions or translations. The Bashir Khowar-English glossary is not imported: it is CC-BY-NC-ND, and redistribution of extracted entries would require additional permission. The Khowar Literature Corpus is not used.

## Verified Encyclopedia Seeds

The file [supabase/seed/encyclopedia.template.sql](supabase/seed/encyclopedia.template.sql) is a commented template only. It contains no real records and must not be run unchanged.

Before creating a seed file from the template:

1. Verify every claim against an identifiable, trustworthy source.
2. Write an original summary rather than copying a copyrighted article verbatim.
3. Confirm that each image URL is publicly accessible and legally usable by CHAYTHRAAR.
4. Record the originating source in the `source` field.
5. Review the completed SQL before applying it to the project.

To apply a reviewed seed through Supabase SQL Editor, open the project dashboard, create a new SQL query, paste the reviewed statements, and run them. Do not insert the template placeholders or unverified content.

### Source URL Note

The current `encyclopedia` table stores source attribution in `source` but does not have a dedicated `source_url` field. A URL column would improve provenance and reviewer workflows, but it is intentionally not being added until the data and moderation requirements are settled.
