# CHAYTHRAAR

CHAYTHRAAR is an AI-powered digital knowledge and information platform focused on preserving Chitral’s history, culture, heritage, language, local knowledge, and related information while making that knowledge accessible through a unified AI interface. Preservation is the primary purpose; the AI layer is the enabling system for discovery, retrieval, and explanation.

## Why CHAYTHRAAR?

Chitral has a rich body of historical, cultural, and community knowledge, but much of it remains difficult to access in a consistent digital form. Local knowledge, language, traditions, music, food, heritage, and historical information are often fragmented across different sources, websites, reports, and community records. Tourists, students, researchers, residents, and community members need a more accessible and better organized way to discover reliable regional knowledge.

This project is designed to gather and structure that material in one place, with clear source attribution and a retrieval layer that helps people ask questions in plain language without losing the provenance of the knowledge behind the answer.

## What We Built

### 1. Central AI Assistant

Implemented: CHAYTHRAAR includes a central assistant that can answer questions using project knowledge sources. The assistant retrieves relevant records from indexed knowledge chunks, filters them for relevance, and returns grounded answers with source attribution when available.

The application is not a generic open-web AI assistant; it is designed to answer from the project’s own Chitral-focused knowledge evidence base.

### 2. Encyclopedia / Chitral Knowledge

Implemented: The project includes a Chitral encyclopedia and knowledge browser backed by the `encyclopedia` table and a corresponding retrieval pipeline. Content is stored with titles, categories, source text, media URLs, and source attribution.

The knowledge layer covers areas including history, heritage, culture, communities, places, language context, and local knowledge as represented in reviewed records. The repository does not claim universal coverage of all Chitral knowledge; it supports a structured and expandable archive rather than a complete encyclopedia.

### 3. Khowar

Implemented: The project supports Khowar-facing language features with a lexical word-list import path and an AI assistant pathway that can query Khowar glossary context. The `khowar_lexicon` and `khowar_glossary` data models are present, and the UI explicitly states that the lexical data should not be treated as a complete dictionary or translation engine.

This is a developing and carefully constrained feature. It is not presented as full language understanding or automated translation quality.

### 4. Discover / Tourism

Implemented: The project has a Discover page for places, backed by the `places` table and map markers. Place records include descriptions, categories, optional coordinates, imagery, opening times, and source metadata.

Partial: The platform supports discovery and map-based browsing, but tourism data remains expandable rather than exhaustive. The repository does not claim a fully populated tourism dataset or advanced AI tourist recommendation features beyond the existing place directory and retrieval-enabled assistant.

### 5. Safety Intelligence

Implemented: CHAYTHRAAR includes a safety ingestion pipeline for official, news, and community safety sources. The project ingests risk data from NDMA Pakistan, PMD Pakistan Meteorological Department, PDMA Khyber Pakhtunkhwa, and selected Chitral Times / ChitralToday safety items when those sources produce relevant material.

The system filters for Chitral relevance, checks freshness, removes duplicates, applies expiration rules, preserves source attribution, and stores historical and active states in the `hazards` table. Briefs are generated from the source text and are intended to be concise and grounded, not full article copies.

The system does not copy entire source articles into the public-facing safety interface. The safety UI shows approved records, source names, dates, severity, location, and a concise summary or fallback wording.

### 6. News

Implemented: The news system ingests Chitral Times and ChitralToday RSS feeds, normalizes them, filters active items to a recent 48-hour window, deduplicates them, and stores the resulting records in the `news` table.

The ingestion pipeline optionally summarizes entries using a Groq-compatible OpenAI-format API when the required environment variables are configured. Generated fields are stored separately and reused so unchanged records do not require repeated summarization.

### 7. Map

Implemented: The map uses Leaflet and OpenStreetMap tiles to display a Chitral-centered map with place markers and approved safety markers. Place and hazard records are loaded from Supabase, filters are available for map layers, and the UI includes a legend and Chitral weather panel.

Partial: Some map layers and data coverage remain dependent on the availability of curated place and safety records, and the project does not claim that all Chitral geography or risk layers are complete.

### 8. Weather

Implemented: The project fetches live weather data from Open-Meteo for a Chitral coordinate set and renders current conditions plus a five-day forecast on the map page. This is a client-side live fetch with no API key required.

## AI Architecture

The application uses a retrieval-backed assistant pattern built around local, project-specific data.

```text
User
  ↓
Central AI Assistant
  ↓
Retrieval / Knowledge Layer
  ↓
Knowledge Sources
  ├── Encyclopedia
  ├── Khowar lexicon / glossary
  ├── News
  ├── Safety
  ├── Places
  └── Other Chitral knowledge records
  ↓
Grounded answer + source attribution
```

Implemented details:

- `knowledge_chunks` stores embedded content for retrieval.
- Gemini Embedding 2 is used for the main knowledge embedding model.
- Voyage AI `voyage-3.5-lite` is used for Khowar glossary retrieval queries.
- `match_knowledge_chunks` and `match_khowar_glossary_chunks` are invoked through Supabase/Postgres vector search.
- The assistant fetches relevant records, constrains context size, and requests a JSON response that cites source IDs.
- Source attribution is preserved in the answer path for grounded results.

This is a practical RAG pattern, not a fully autonomous research engine. It depends on the quality and freshness of the indexed content and on the configured AI providers.

## Safety Architecture

The safety ingestion flow is implemented as follows:

Source
→ Adapter
→ Normalization
→ Chitral relevance filter
→ Freshness filter
→ Deduplication
→ Expiration and policy handling
→ AI brief generation when available
→ Supabase storage
→ Safety UI

The project keeps source facts, source names, URLs, and timestamps. AI summarization is used to create concise grounded briefs, not to invent severity, impacts, or dates.

## Technology Stack

Implemented technologies and libraries in the repository:

- Next.js App Router 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase JS and Supabase SSR
- PostgreSQL via Supabase
- pgvector / vector similarity search in the migration schema
- Leaflet
- OpenStreetMap tiles
- Open-Meteo weather API
- Google Gemini embeddings
- Voyage AI embeddings
- Groq OpenAI-compatible chat completion API
- Lucide React icons
- Node.js scripts for ingestion and indexing

## Data Sources

Actual source categories represented in the project:

- Cultural and encyclopedic content: reviewed Chitral records inserted via manual content import or database review
- Government and public safety: NDMA Pakistan, PMD Pakistan Meteorological Department, PDMA Khyber Pakhtunkhwa
- News: Chitral Times and ChitralToday
- Khowar lexical and glossary material: FLI Khowar word list and structured Bashir glossary records when present in the database
- Weather: Open-Meteo
- Map tiles: OpenStreetMap

The project does not claim official endorsement or formal institutional partnership with any source.

## Data Integrity & Safety

The project’s operational approach emphasizes traceability and grounded results:

- Source URLs are retained on records where present.
- Source names and provenance fields are preserved.
- AI output is bounded by retrieved source context instead of broad external knowledge.
- Safety severity is not invented; the system applies policy and source-based contextualization.
- Coordinates are only shown when supplied in a valid record.
- Chitral relevance filtering is applied before safety records are admitted to the public interface.
- Freshness and expiration windows are enforced.
- Duplicate entries are removed within a run and across existing rows when appropriate.
- Historical and active records remain distinct in the database and UI logic.

## Project Structure

```text
├── src/
│   ├── app/                  # Next.js App Router pages and API routes
│   ├── components/          # UI components for map, assistant, news, safety, admin
│   ├── lib/                 # data access, AI, embeddings, safety, news, Supabase helpers
│   ├── types/               # shared TypeScript types
│   └── data/                # content and demo data support
├── supabase/
│   ├── migrations/         # schema versioning and database changes
│   └── seed/               # SQL seed templates and review files
├── scripts/                 # ingestion, indexing, and import scripts
├── public/                  # static assets
├── tests/                   # project tests for the TypeScript runtime
├── package.json             # scripts and dependencies
├── next.config.ts
├── eslint.config.mjs
├── tsconfig.json
├── .env.local               # local environment file, not committed
└── README.md
```

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Available project commands:

```bash
npm run lint
npm run build
npm run test
npm run content:import
npm run khowar:import
npm run khowar:bashir
npm run rag:index
npm run safety:ingest
npm run news:ingest
npm run news:summarize
```

## Environment Variables

Public/client variables:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Server-only variables:

- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY
- VOYAGE_API_KEY
- GROQ_API_KEY
- NEWS_AI_API_URL
- NEWS_AI_MODEL
- CHAYTHRAAR_ADMIN_EMAILS

Important: `.env.local` is a local-only file and must not be committed. It should contain server-only secrets and keys, never public browser values outside the app’s configured client scope.

## Database

The current Supabase schema includes these core tables and purposes:

- `places`: curated place records with optional coordinates and source metadata
- `encyclopedia`: verified topic records and local knowledge entries
- `news`: RSS-derived and normalized news items with source and generated summaries
- `hazards`: safety/advisory records with source type, status, expiration, and moderation metadata
- `safety_report_votes`: user voting for approved community hazard reports
- `translations`: verified Khowar/Urdu/English translation pairs
- `khowar_lexicon`: imported FLI lexical word-list data with source attribution and licensing
- `khowar_glossary`: structured glossary data with source provenance
- `khowar_glossary_chunks`: chunked glossary embeddings for retrieval
- `knowledge_chunks`: embedded source chunks for the assistant and retrieval engine
- `site_media`: image and profile media metadata

## Current Limitations

The project is functional but still has genuine limits:

- Some place and tourism data still needs expansion.
- Map coverage is only as complete as the underlying data rows.
- Khowar support is still a developing feature and should not be treated as a complete translation system.
- AI functionality depends on provider availability, rate limits, and configured environment variables.
- Some external data sources may time out or provide inconsistent availability.
- The repository does not contain a complete national-scale knowledge base or a universal cultural archive.

## Future Roadmap

Planned improvements, not current implementation:

- Expand verified Chitral knowledge coverage
- Improve place and tourism records
- Improve Khowar language capability and glossary coverage
- Add stronger specialized AI workflows for safety, language, and cultural retrieval
- Expand safety source coverage and verification
- Improve emergency contact and community safety support
- Add richer media and archival workflows
- Expand map layers and environmental monitoring
- Improve offline and low-connectivity support

## Hackathon Context

This project was developed for the HindukushSoft Technology & AI Day 2026 and the Chitral AI Challenge, with a social-impact orientation focused on preserving and making accessible local Chitral knowledge through AI-assisted retrieval and discovery.

## Team

The project team listed in the application is:

- Saim Ali — Developer
- Faizan Ali Haidar — R/D
- Hidayat Ali — R/D
- Suhaib Nazir — R/D

## License

No project license has currently been specified in the repository. The code and project assets are therefore not covered by a declared license unless one is added later.

---

## Status Summary

Implemented:

- Next.js app shell and routed experience
- Retrieval-backed assistant with source attribution
- Encyclopedia browsing and detail pages
- News ingestion and partial summarization pipeline
- Safety ingestion and moderation flow
- Khowar lexical/glossary data and assistant support
- Map and weather integration
- Supabase-backed storage and vector search logic

Partial:

- Tourism/place data coverage
- Khowar language depth
- Safety source breadth and historical continuity
- AI provider availability and rate-limit resilience

Planned:

- Larger verified culture and heritage archive
- More extensive tourism data and guidance features
- Additional environmental and media resources
- Stronger offline and field-access workflows
