# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js 16 + Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture Overview

**M.hub** is an internal AI-output marketplace built with Next.js 16 (App Router), Supabase, and OpenAI.

### Key Patterns

**Authentication**
- Google OAuth only, restricted to `@motiv-i.com`, `@madcorp.co.kr`, or `vibeyangjm@gmail.com`
- Auth flow: `app/login/actions.ts` → Google → `app/auth/callback/route.ts` (domain check) → home
- Session managed via cookies using `@supabase/ssr`

**Middleware**
- `proxy.ts` (NOT `middleware.ts`) — Next.js 16 uses this naming. Exporting `proxy` function refreshes Supabase sessions on every request. Both `proxy.ts` and `middleware.ts` cannot coexist.
- API routes and static files are excluded from the matcher.

**Supabase Clients — three distinct clients:**
- `utils/supabase/client.ts` — Browser client (anon key, RLS enforced) — use in Client Components
- `utils/supabase/server.ts` — Server client (anon key + cookie session) — use in Server Components and API routes
- `utils/supabase/admin.ts` — Admin client (service role key, bypasses RLS) — use only server-side for privileged writes (e.g. quiz question creation)

**Data Fetching**
- Home and profile pages use SSR (`force-dynamic`) to fetch data server-side
- Client components handle interactive state (filters, bookmarks, modals)
- All pages with user data use `supabase.auth.getUser()` — never trust client-side session alone

**AI Features (all in `app/api/`)**
| Route | Model | Purpose |
|-------|-------|---------|
| `/api/chat` | gpt-4o | Streaming chatbot with app catalog context |
| `/api/quiz` | gpt-4o-mini | Daily 4-choice quiz generation + submission |
| `/api/classify` | gpt-4o-mini | Auto-categorize new projects |
| `/api/analyze` | gpt-4o | Generate strength/improvement feedback for a project |

Quiz uses `createAdminClient()` to bypass RLS when inserting new questions (only admins can write via RLS).

**Categories** (used across AppGrid, register pages, classify API):
`전체, 기획, 영업, 마케팅, 디자인, 운영, 경영, 개발, 기타`

### Database Tables
`profiles`, `projects`, `reviews`, `bookmarks`, `quiz_questions`, `quiz_submissions` — schema + RLS policies in `supabase/schema.sql`.

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
OPENAI_API_KEY
SUPABASE_SERVICE_ROLE_KEY   # server-only, never expose to client
```

### Turbopack Config
`next.config.ts` includes a `turbopack.resolveAlias` for `tailwindcss` to prevent a resolve loop when running from a parent directory.

### Deployment
- Hosted on Vercel, GitHub repo: `survivor0323/t9` (local folder name differs)
- Production domain: `t9-ten.vercel.app`
- Supabase project: `wxkvjmywfxgxhywvdqoc.supabase.co`
- `.npmrc` sets `legacy-peer-deps=true` to resolve openai/zod peer conflict
