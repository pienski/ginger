# Recipe Book — Project Specification

## Project Overview

A personal recipe manager and meal planner for two users (a couple). Built as a web app, optimised for desktop use and comfortable mobile browsing. The app replaces a Notion-based recipe store and adds interactive cooking features and LLM-powered recipe import.

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **UI:** React + Tailwind CSS
- **Database:** Postgres via [Neon](https://neon.tech/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Hosting:** Vercel (free tier)
- **LLM:** DeepSeek (`deepseek-v4-flash`) via Vercel AI SDK
- **Auth:** NextAuth.js with credentials provider (email/password with bcrypt)

## Repository Structure

```
/
├── app/                        # Next.js App Router
│   ├── (auth)/login/page.tsx   # Login page
│   ├── recipes/                # Recipe management
│   │   ├── page.tsx            # Recipe list view
│   │   ├── new/page.tsx        # New recipe (manual or LLM import)
│   │   └── [id]/               # Detail and edit views
│   ├── history/page.tsx        # Meal history
│   ├── grocery/page.tsx        # Grocery list builder
│   └── api/                    # API routes
│       ├── recipes/            # CRUD for recipes
│       ├── parse/              # LLM recipe parsing
│       ├── upload/             # Photo upload
│       ├── history/            # Meal history
│       └── grocery/            # Grocery list generation
├── components/
│   ├── recipes/                # Recipe-specific components
│   └── ui/                     # Shared UI primitives
├── lib/
│   ├── db/                     # Drizzle schema and client
│   ├── llm/                    # DeepSeek integration
│   ├── auth.ts                 # NextAuth configuration
│   └── utils.ts                # Shared utilities
└── CLAUDE.md
```

## Database Schema
@./agent_docs/database-schema.md

## Key Feature Specs
@./agent_docs/key-feature-specs.md

## Environment Variables
@./agent_docs/env-variables.md

## UI / UX Principles

- Clean, minimal design — no sidebars, no dashboards, just the content
- Mobile view: recipe detail must be readable one-handed (large text, tappable check-offs)
- Desktop view: wider layout with photo alongside ingredients/directions
- Neutral colour palette — food photos should be the visual focus
- No dark mode required for v1

## Deployment

- Vercel + Neon Postgres.
- `drizzle-kit push` for schema updates.
- Vercel-hosted images or Cloudinary.

## Notes for LLM

- Prefer server components for data fetching.
- Logic in `lib/`, thin API routes.
- JSON fields (`ingredients`, `tags`, `directions`) handled natively by Drizzle.
- Auth uses hardcoded users in env vars for simplicity.
