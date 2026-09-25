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
```

The values must come from the Supabase project settings. Never commit `.env.local` or expose the values in source code.

To apply the migration without installing the Supabase CLI:

1. Open the Supabase project dashboard.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of `supabase/migrations/20260924000000_initial_schema.sql` into the query editor.
4. Run the query.
5. In **Table Editor**, verify the five tables and in **Authentication > Policies**, verify that each table has RLS enabled and only the intended read policies.

No seed data is included yet. Content remains local demo data until verified ingestion and moderation flows are implemented.

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
