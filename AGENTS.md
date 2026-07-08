<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Qraft — AI-Powered SQL Script Generator

## Product Overview

**Qraft** is an AI-powered SQL script generator that helps engineering teams produce production-ready SQL queries instantly. Users describe what they need in natural language, and Qraft generates accurate, optimized SQL scripts that can be directly implemented — no manual adjustments required.

### Core Value Proposition

- **Productivity Boost**: Eliminate the time-consuming process of writing complex SQL queries manually.
- **Context-Aware Generation**: The system uses uploaded database schemas (table designs, relationships, constraints) as a knowledge base, so the AI understands the exact structure it's working with.
- **Production-Ready Output**: Generated SQL scripts are intended to be directly implementable — not pseudo-code or approximations.

### How It Works

1. **Schema Upload**: Users upload their database design (DDL, ERD exports, or structured table definitions) as the knowledge base.
2. **System Prompt Engineering**: Behind the scenes, a carefully crafted system prompt instructs the AI model on how to interpret schemas and generate SQL.
3. **Natural Language Request**: Users describe what SQL they need in plain language (e.g., "Get all active users who signed up in the last 30 days with their order count").
4. **SQL Generation**: The AI generates a complete, executable SQL script tailored to the uploaded schema.

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 16 (App Router)            |
| Language       | TypeScript (strict mode)            |
| Runtime        | React 19                            |
| Styling        | Tailwind CSS v4                     |
| UI Components  | shadcn/ui                           |
| ORM            | Drizzle ORM                         |
| Database       | Supabase (PostgreSQL)               |
| AI Integration | TBD (e.g., OpenAI API / Gemini API) |

---

## Skills Reference

All agents MUST consult the following skills from `C:\Users\nural\.agents\skills` before writing code. These skills contain rules, patterns, and constraints that override general knowledge.

### Mandatory Skills (always apply)

| Skill | Path | When to Load |
| --- | --- | --- |
| **shadcn** | `skills/shadcn/SKILL.md` | ALL UI work. Components, forms, styling, icons, CLI usage. This is the component library — read the full skill including `rules/` subdirectory before writing any component code. |
| **brandkit** | `skills/brandkit/SKILL.md` | When generating brand assets, logos, identity images, or visual design direction. |
| **design-taste-frontend** | `skills/design-taste-frontend/SKILL.md` | ALL frontend/UI work. Anti-slop rules, layout discipline, typography, color, motion. Read Sections 0–9 before generating any page or component. |
| **next-best-practices** | `skills/next-best-practices/SKILL.md` | ALL Next.js code. RSC boundaries, async patterns, data patterns, route handlers, metadata. Load sub-references as needed. |
| **typescript-pro** | `skills/typescript-pro/SKILL.md` | ALL TypeScript code. Strict mode, branded types, discriminated unions, type guards. |
| **api-design-principles** | `skills/api-design-principles/SKILL.md` | When designing or implementing API routes. REST patterns, error handling, pagination. |
| **api-designer** | `skills/api-designer/SKILL.md` | When designing API contracts. OpenAPI specs, RFC 7807 errors, resource modeling. |
| **supabase-postgres-best-practices** | `skills/supabase-postgres-best-practices/SKILL.md` | When writing SQL, designing schemas, or working with Supabase/Postgres. Load `references/` for specific rules. |
| **postgres-pro** | `skills/postgres-pro/SKILL.md` | When writing raw SQL or Drizzle schema definitions. Advanced Postgres patterns. |

### Situational Skills (load when relevant)

| Skill | Path | When to Load |
| --- | --- | --- |
| **high-end-visual-design** | `skills/high-end-visual-design/SKILL.md` | When building premium visual layouts or landing pages. |
| **minimalist-ui** | `skills/minimalist-ui/SKILL.md` | When the design direction leans minimal/clean. |
| **vercel-react-best-practices** | `skills/vercel-react-best-practices/SKILL.md` | When optimizing React patterns or Vercel deployment. |
| **full-output-enforcement** | `skills/full-output-enforcement/SKILL.md` | When output must be complete and untruncated. |

---

## Architecture Rules

### API-First Architecture (MANDATORY)

**All data access MUST go through API routes.** Never query Supabase directly from client components or server components.

```
Client Component → fetch("/api/...") → API Route → Drizzle ORM → Supabase (PostgreSQL)
Server Component → fetch("/api/...") or internal service call → Drizzle ORM → Supabase (PostgreSQL)
```

**Why**: Separation of concerns, testability, security (API keys stay server-side), and ability to add middleware (auth, rate-limiting, logging) at the API boundary.

**Specifically BANNED**:
- Importing `@supabase/supabase-js` client in any component (client or server).
- Calling Supabase directly from `page.tsx`, `layout.tsx`, or any component file.
- Using Supabase client SDK for data mutations from the frontend.

**The ONLY place Supabase is accessed** is through Drizzle ORM inside `lib/db/` or `src/app/api/` route handlers.

### Drizzle ORM

- All database schema definitions go in `lib/db/schema/`.
- Use Drizzle's `drizzle-orm/pg-core` for PostgreSQL table definitions.
- Use `drizzle-kit` for migrations (`npx drizzle-kit generate`, `npx drizzle-kit migrate`).
- Drizzle client initialization goes in `lib/db/index.ts`.
- Connection string comes from `DATABASE_URL` environment variable (Supabase connection pooler URL).

```
lib/db/
├── index.ts              # Drizzle client initialization
├── schema/
│   ├── index.ts          # Re-export all schemas
│   ├── schemas.ts        # Schema/knowledge-base table definitions
│   ├── generations.ts    # SQL generation history table
│   └── users.ts          # User table (if auth is added)
└── migrations/           # Generated by drizzle-kit
```

### API Route Structure

All API routes go under `src/app/api/`. Each route follows REST conventions:

```
src/app/api/
├── schemas/
│   ├── route.ts              # GET (list) / POST (create)
│   └── [id]/
│       └── route.ts          # GET (by id) / PUT / DELETE
├── generate/
│   └── route.ts              # POST (generate SQL from prompt)
└── generations/
    ├── route.ts              # GET (list history)
    └── [id]/
        └── route.ts          # GET (by id) / DELETE
```

**API Response Format** (consistent across all routes):

```typescript
// Success
{ data: T, meta?: { page, pageSize, total } }

// Error (RFC 7807 inspired)
{ error: string, code: string, details?: unknown }
```

---

## Project Structure

```
qraft/
├── src/
│   └── app/                    # Next.js App Router
│       ├── layout.tsx          # Root layout
│       ├── page.tsx            # Landing / main page
│       ├── globals.css         # Global styles (Tailwind + shadcn theme)
│       ├── api/                # API Routes (ALL data access goes here)
│       │   ├── schemas/        # Schema/knowledge-base CRUD
│       │   ├── generate/       # SQL generation endpoint
│       │   └── generations/    # Generation history
│       ├── (auth)/             # Auth-related routes (future)
│       ├── dashboard/          # Main app dashboard
│       └── components/         # Shared UI components (shadcn-based)
├── lib/                        # Shared utilities & helpers
│   ├── ai/                     # AI prompt engineering & API calls
│   │   ├── system-prompt.ts    # System prompt template
│   │   ├── schema-parser.ts   # Parse uploaded schemas into context
│   │   └── generate-sql.ts    # SQL generation orchestration
│   ├── db/                     # Drizzle ORM setup & schemas
│   │   ├── index.ts            # Drizzle client
│   │   ├── schema/             # Table definitions
│   │   └── migrations/         # Drizzle-kit generated
│   └── utils/                  # General utility functions
├── types/                      # TypeScript type definitions
├── public/                     # Static assets
├── AGENTS.md                   # This file — AI development context
└── README.md                   # Project documentation
```

---

## Key Domain Concepts

### Knowledge Base (Schema Context)

The "knowledge base" is the collection of database schemas/designs that users upload. This is **the most critical input** to the system — it provides the AI with the structural context needed to generate accurate SQL.

Supported schema formats (planned):
- **Raw DDL** (CREATE TABLE statements)
- **JSON/YAML schema definitions**
- **CSV/Markdown table descriptions**

### System Prompt

The system prompt is the hidden instruction set that guides the AI model. It MUST:
- Instruct the AI to generate ONLY valid SQL for the given database engine (MySQL, PostgreSQL, etc.).
- Include the parsed schema context from the uploaded knowledge base.
- Enforce output formatting rules (e.g., use aliases, add comments, proper indentation).
- Prohibit hallucinated table/column names — only reference what exists in the schema.

### SQL Generation Request

A user request is a natural language description of what SQL they need. Examples:
- "Tampilkan semua user yang statusnya active beserta total order mereka"
- "Buat query untuk report penjualan bulanan tahun 2025"
- "Generate INSERT script untuk seed data 10 dummy users"

---

## UI/UX Rules

### Anti-Slop Design Mandate

The UI MUST NOT look like generic AI-generated output. The following patterns are **BANNED**:

- Emoji icons as section markers or feature indicators
- Giant rounded card components (`rounded-2xl`, `rounded-3xl`) with colored gradients as feature cards
- Purple/blue AI glow gradients as default accent
- Centered hero with dark mesh background
- Three equal feature cards in a row as the default layout
- Generic glassmorphism on everything
- `Inter` as default font — use `Geist` or project-specific font
- Random floating decorative elements
- Fake screenshot divs built from styled `<div>` elements

### Use shadcn/ui Components

All UI components MUST use shadcn/ui. Read the `shadcn` skill (`C:\Users\nural\.agents\skills\shadcn\SKILL.md`) before writing any component.

Key rules from shadcn skill:
- **Use semantic colors**: `bg-primary`, `text-muted-foreground` — never raw values like `bg-blue-500`.
- **Use `gap-*` not `space-x-*`/`space-y-*`** for spacing.
- **Use `size-*`** when width and height are equal.
- **Use `cn()`** for conditional classes.
- **Forms use `FieldGroup` + `Field`**, not raw `div` wrappers.
- **Icons use `data-icon`** attribute, no manual sizing.
- **No manual `dark:` overrides** — use shadcn's semantic token system.
- **Always run `npx shadcn@latest docs <component>`** before using a component to get correct API and patterns.
- **Check installed components** before adding new ones.

### Brandkit for Visual Identity

When generating brand assets or visual direction, follow the `brandkit` skill (`C:\Users\nural\.agents\skills\brandkit\SKILL.md`). The design should feel:
- Intentional, not decorative
- Premium, not flashy
- Minimal, not empty
- Coherent across all surfaces

### Design Taste (design-taste-frontend skill)

Before ANY frontend work, read the design read from Section 0 of the `design-taste-frontend` skill. Key rules:
- **Anti-Default Discipline**: Do not default to AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism.
- **Typography**: Use `Geist` or `Satoshi` as default sans. Serif is discouraged unless explicitly justified.
- **Color**: Max 1 accent color. No "AI Purple / Blue glow" as default. Use neutral bases (Zinc/Slate/Stone) with singular high-contrast accents.
- **Layout**: Anti-center bias when variance > 4. Force split-screen, asymmetric, or scroll-pinned layouts.
- **Cards**: Use only when elevation communicates real hierarchy. Otherwise use `border-t`, `divide-y`, or negative space.
- **Shape Consistency**: Pick ONE corner-radius scale and stick to it across the entire page.

---

## Coding Conventions

### General Rules

- Use **TypeScript** for all code. No `any` types unless absolutely unavoidable (document why).
- Use **functional components** with hooks. No class components.
- Prefer **named exports** over default exports for non-page/layout files.
- All API routes go under `src/app/api/`.
- Use **server components** by default. Add `"use client"` only when client interactivity is required.
- Keep components small and focused — one responsibility per component.

### Naming Conventions

| Element       | Convention                  | Example                       |
| ------------- | --------------------------- | ----------------------------- |
| Files         | kebab-case                  | `schema-parser.ts`            |
| Components    | PascalCase                  | `SqlEditor.tsx`               |
| Functions     | camelCase                   | `generateSqlFromPrompt()`     |
| Types/Interfaces | PascalCase with prefix   | `SqlGenerationRequest`        |
| Constants     | UPPER_SNAKE_CASE            | `MAX_SCHEMA_SIZE_MB`          |
| API Routes    | kebab-case folders          | `api/generate/route.ts`       |
| DB Schema     | snake_case (Drizzle/PG)     | `sql_generations`             |

### File Organization

- **Components**: Place shared/reusable components in `src/app/components/`. Page-specific components can live alongside their page. All components are shadcn-based.
- **Lib**: All non-UI logic (AI calls, DB queries via Drizzle, utils) goes in `lib/`.
- **Types**: Shared TypeScript types go in `types/`. Co-locate component-specific types with the component.

### Styling

- Use **Tailwind CSS v4** for all styling.
- Use **shadcn/ui semantic tokens** (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.).
- **No raw color values** (`bg-blue-500`, `text-red-600`). Use shadcn theme variables.
- Dark mode support via shadcn's built-in theming system.
- Follow `design-taste-frontend` skill for all aesthetic decisions.

### AI / Prompt Engineering

- System prompts are stored as **template strings** in `lib/ai/system-prompt.ts`.
- Schema context is dynamically injected into the system prompt at request time.
- Always validate AI responses — check for SQL syntax validity before presenting to the user.
- Log AI interactions (prompt + response) for debugging and quality improvement.

### Error Handling

- Use structured error responses for API routes: `{ error: string, code: string, details?: unknown }`.
- Never expose internal errors to the client. Log them server-side, return user-friendly messages.
- Validate all user inputs at the API boundary (request body, file uploads, etc.).
- Use `try/catch` in all API route handlers with consistent error formatting.

---

## Security Considerations

- **Never execute generated SQL** on any real database from the app. Qraft is a generator, not an executor.
- Sanitize all uploaded schema files — prevent XSS and injection via malicious uploads.
- Rate-limit AI generation endpoints to prevent abuse.
- API keys for AI services must be stored in environment variables, never committed to code.
- Database access is exclusively through Drizzle ORM behind API routes — no client-side DB access.

---

## Environment Variables

```env
# AI Service
AI_API_KEY=                     # API key for AI provider (OpenAI / Gemini / etc.)
AI_MODEL=                       # Model identifier (e.g., gpt-4o, gemini-pro)
AI_BASE_URL=                    # Optional: custom API base URL

# Database (Supabase)
DATABASE_URL=                   # Supabase connection pooler URL (for Drizzle)

# App
NEXT_PUBLIC_APP_NAME=Qraft      # Public app name
NEXT_PUBLIC_APP_URL=            # Public app URL
```

---

## Development Workflow

1. Run `npm run dev` to start the development server.
2. Access at `http://localhost:3000`.
3. Check `node_modules/next/dist/docs/` for Next.js 16 specific API documentation before implementing features.
4. Run `npx shadcn@latest info` to check shadcn project context before adding components.
5. Run `npx drizzle-kit generate` after schema changes, then `npx drizzle-kit migrate` to apply.
6. Run `npm run lint` before committing.
7. Run `npm run build` to verify production build passes.
8. **Agent Auto-Correction Rule**: ALWAYS run `npx tsc --noEmit` after executing code edits. Catch and fix any TypeScript errors proactively before concluding your turn.
