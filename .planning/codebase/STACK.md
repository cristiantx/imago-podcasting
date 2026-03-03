# Stack

## Snapshot
- Monorepo shape: single Next.js app with source in `src/` and tests in `test/`.
- Language/runtime: TypeScript on Node.js, ESM package mode (`package.json`, `tsconfig.json`).
- Deployment style: server-rendered Next.js App Router + route handlers + background jobs.

## Core Application Stack
| Layer | Technology | Evidence |
| --- | --- | --- |
| Web framework | Next.js 15 App Router | `package.json`, `src/app/layout.tsx`, `src/app/api/**/route.ts` |
| UI runtime | React 19 | `package.json`, `src/components/*.tsx` |
| Server API | Next route handlers (`Request`/`Response`) | `src/app/api/search/route.ts`, `src/app/api/podcasts/import/route.ts` |
| Auth | Clerk (`@clerk/nextjs`) | `src/app/layout.tsx`, `src/lib/auth/session.ts`, `src/middleware.ts` |
| Validation | Zod | `src/lib/config.ts`, `src/lib/validation/common.ts`, `src/app/api/**/route.ts` |

## Data Stack
| Concern | Technology | Evidence |
| --- | --- | --- |
| Primary DB | Postgres | `package.json`, `drizzle.config.ts`, `src/lib/db/client.ts` |
| ORM | Drizzle ORM + postgres-js driver | `src/lib/db/client.ts`, `src/lib/db/schema.ts` |
| Schema migrations | drizzle-kit SQL migrations | `drizzle/*.sql`, `drizzle/meta/_journal.json` |
| Domain model | plans/entitlements/podcasts/episodes/transcripts/search logs | `src/lib/db/schema.ts` |

## Async and Pipeline Stack
| Concern | Technology | Evidence |
| --- | --- | --- |
| Event/workflow engine | Inngest | `src/inngest/client.ts`, `src/inngest/functions.ts`, `src/app/api/inngest/route.ts` |
| Import orchestration | Inngest events from service layer | `src/lib/services/import-service.ts` |
| Episode processing pipeline | DB + Blob + Deepgram + embeddings + Pinecone | `src/lib/pipeline/process-episode.ts` |

## AI, Search, and Media Stack
| Concern | Technology | Evidence |
| --- | --- | --- |
| Embeddings | Vercel AI Gateway (`openai/text-embedding-3-small`) | `src/lib/vector/embeddings.ts` |
| Vector DB | Pinecone namespaces per user | `src/lib/vector/pinecone.ts`, `src/app/api/search/route.ts` |
| Speech-to-text | Deepgram `nova-3` with diarization/utterances | `src/lib/transcription/deepgram.ts` |
| Feed ingestion | `rss-parser` | `src/lib/rss/parse-feed.ts` |
| Object storage | Vercel Blob for audio/VTT artifacts | `src/lib/storage/audio.ts`, `src/lib/storage/transcript.ts` |

## Frontend and Styling Stack
| Concern | Technology | Evidence |
| --- | --- | --- |
| Styling | Tailwind CSS + PostCSS | `tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css` |
| Component primitives | shadcn-style setup + Radix UI + CVA | `components.json`, `src/components/ui/*.tsx`, `package.json` |
| Icons | lucide-react | `package.json`, `src/components/*.tsx` |

## Tooling and Quality
| Concern | Tooling | Evidence |
| --- | --- | --- |
| Type checking | TypeScript strict mode | `tsconfig.json`, `package.json` (`typecheck`) |
| Linting | Next lint | `package.json` (`lint`) |
| Testing | Vitest (node env) | `vitest.config.ts`, `test/*.test.ts` |
| DB workflow | drizzle-kit generate/push scripts | `package.json`, `drizzle.config.ts` |

## Environment Contract
- Env variables are centrally defined/validated in `src/lib/config.ts`.
- Expected keys are documented in `.env.example` and consumed across auth/DB/vector/transcription/workflow/storage integrations.
