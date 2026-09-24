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
