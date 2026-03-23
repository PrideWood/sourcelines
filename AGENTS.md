# AGENTS.md

## Project identity
- User-facing brand name: **SourceLines**
- Internal working name: **Quotes**
- Keep internal names stable during MVP unless explicitly told to rename them

## Product scope
SourceLines is a **reading-first, source-aware, multilingual short-text archive**.

MVP focuses on:
- browse
- search
- submit
- review
- favorite

It is **not**:
- a social feed
- a short-video style product
- a comment-first community
- a generic motivational quote app

## Core rules
- Original text first
- Source awareness first
- Structured metadata first
- Review before publish
- Calm, text-centered UX
- Simple, extensible implementation

## Tech defaults
Use these unless explicitly changed:
- Next.js 15
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL

## Data model rules
- `submissions` and `quotes` must stay separate
- user submissions never become public directly
- approved submissions create normalized `quotes`
- keep `moderation_status` and `verification_status` separate
- tags support hierarchy with `parent_id`
- favorites must be unique per `user_id + quote_id`

## UX rules
- Design should feel like a digital library, not a feed app
- Prioritize desktop and tablet experience
- Original text is visually primary
- Translation is secondary
- Keep spacing, typography, and components consistent
- Avoid flashy motion or unnecessary visual effects

## Coding rules
- Read the repo before editing
- Explain the plan briefly before major changes
- Make the smallest reasonable change
- Do not refactor unrelated modules
- Prefer simple server-side solutions over unnecessary client complexity
- Reuse components whenever possible
- Avoid adding heavy dependencies without a clear reason

## Workflow rules
Before coding, state:
1. what you will change
2. which files you will touch
3. how you plan to implement it

After coding, report:
1. what was completed
2. files changed
3. how to test locally
4. assumptions made
5. next recommended step