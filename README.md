# Imago Podcasting

Billing-ready semantic search MVP for podcasters.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui component primitives
- Clerk authentication
- Neon Postgres + Drizzle ORM
- Inngest workflows
- Deepgram transcription with diarization
- Vercel AI Gateway embeddings (`openai/text-embedding-3-small`)
- Pinecone vector search
- Vercel Blob temporary audio storage

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill values.
3. Run `npm run db:generate` then `npm run db:push`.
4. Start app: `npm run dev`

## Key Endpoints

- `POST /api/podcasts/import`
- `GET /api/podcasts/:podcastId/status`
- `POST /api/podcasts/:podcastId/resync`
- `POST /api/search`
- `GET /api/account/entitlements`
- `POST /api/admin/entitlements/adjust`

## Docs

- [How the app works](./docs/how-the-app-works.md)
- [Technical decisions log](./docs/technical-decisions.md)
