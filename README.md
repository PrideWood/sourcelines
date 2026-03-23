# SourceLines (internal: Quotes)

Reading-first, source-aware, multilingual short-text archive MVP.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure env

```bash
cp .env.example .env
```

3. Generate Prisma client

```bash
npm run prisma:generate
```

4. Run development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Database (MVP placeholder)

- Update `DATABASE_URL` in `.env`
- Run migrations later when schema is finalized:

```bash
npm run prisma:migrate
```
