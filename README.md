# NOKS — Chemical Division

Full-stack website for **NOKS Chemical Division** — industrial chemicals, laboratory
reagents, water treatment solutions and food grade ingredients for Kenya and East Africa.

- **Frontend** — Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, React Query
- **Backend** — Django 5, Django REST Framework, PostgreSQL, Redis, Celery
- **Infrastructure** — Docker Compose, Nginx, GitHub Actions

---

## The one rule: everything comes from `.env`

There is a **single `.env` at the repository root**, read by both stacks. Nothing —
colours, contact details, stats, SEO copy, API URLs, model names — is hardcoded in
either codebase.

| Stack | How it reads the root `.env` |
| --- | --- |
| Django | `python-dotenv` loads `<root>/.env` in `config/settings.py`, then `django-environ` provides typed accessors |
| Next.js | `next.config.ts` loads `../.env` with `dotenv` and forwards every `NEXT_PUBLIC_*` key into the bundle |

Change `NEXT_PUBLIC_COLOR_PRIMARY` and the entire site **and** the Django admin reskin.

> **Hex colours must stay quoted** (`NEXT_PUBLIC_COLOR_PRIMARY="#0C48E6"`).
> `django-environ` treats a bare `#` as a comment — quoting is what keeps the value intact.

### Brand palette (sampled from the logo)

The logo `assets/noks-logo.jpeg` is a bold royal blue, sampled at **`#0C48E6`**. The
palette is built around it:

| Token | Value | Use |
| --- | --- | --- |
| `COLOR_PRIMARY` | `#0C48E6` | Primary actions, links, accents |
| `COLOR_PRIMARY_DARK` | `#0A38C2` | Hover / pressed states |
| `COLOR_NAVY` | `#071233` | Dark sections, footer, hero |
| `COLOR_EMERALD` | `#059669` | Success, certification, "in stock" |
| `COLOR_ACCENT` | `#2F5EFA` | Gradient mid-tone |

---

## Quick start (local)

### 1. Environment

```bash
cp .env.example .env      # then edit as needed
```

### 2. Database

The stack targets **PostgreSQL**. The fastest local option:

```bash
docker run -d --name noks-postgres \
  -e POSTGRES_DB=noks -e POSTGRES_USER=noks -e POSTGRES_PASSWORD=noks \
  -p 5440:5432 -v noks_pgdata:/var/lib/postgresql/data postgres:16-alpine
```

Then point `.env` at it:

```
DATABASE_URL=postgres://noks:noks@localhost:5440/noks
```

If `DATABASE_URL` is left **blank**, Django falls back to SQLite so the project still
runs with zero setup.

### 3. Backend

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed          # 18 products, 12 industries, 6 articles, + superuser
.venv/bin/python manage.py runserver 8001
```

- API — <http://localhost:8001/api/v1/>
- API docs (Swagger) — <http://localhost:8001/api/v1/docs/>
- Admin — <http://localhost:8001/admin/> (credentials from `DJANGO_SUPERUSER_*`)

### 4. Frontend

```bash
cd frontend
npm install
npm run dev        # honours FRONTEND_PORT from .env
```

Site — <http://localhost:3001>

### 5. Docker (everything at once)

```bash
docker compose up --build
```

Nginx serves the whole stack on port 80, proxying `/api` and `/admin` to Django and
everything else to Next.js.

---

## Project layout

```
NOKS/
├── .env                     ← single source of truth for both stacks
├── .env.example
├── docker-compose.yml
├── nginx/nginx.conf
├── assets/noks-logo.jpeg
├── backend/
│   ├── config/              settings, urls, celery, wsgi/asgi
│   ├── apps/
│   │   ├── core/            site content, branded AdminSite, seed command
│   │   ├── catalog/         categories, industries, manufacturers, products
│   │   ├── blog/            Knowledge Centre (posts, FAQs, authors)
│   │   ├── leads/           quotations, inquiries, newsletter
│   │   └── assistant/       AI Chemical Assistant
│   ├── templates/admin/     branded dashboard
│   └── static/admin/css/    admin skin driven by .env tokens
└── frontend/
    └── src/
        ├── app/             App Router pages, sitemap, robots, OG image
        ├── components/      ui / layout / home / catalog / blog / assistant
        ├── lib/             site config, API client, JSON-LD schema, hooks
        └── types/           shared API types
```

---

## Pages

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | Static (ISR 5 min) | Cinematic homepage — hero, stats, industries, featured products, process, testimonials, FAQ |
| `/products` | Dynamic | Catalog: search, faceted filters, sort, grid/list, pagination |
| `/products/[slug]` | Dynamic (ISR 10 min) | Specs, applications, safety, downloads, sticky quote form, related products |
| `/industries` · `/industries/[slug]` | ISR | Twelve sectors with tailored product sets |
| `/services` | ISR | Eight services plus the six-step process timeline |
| `/knowledge` · `/knowledge/[slug]` | ISR | Knowledge Centre with per-article FAQ + suggested products |
| `/about` · `/contact` · `/quote` | Static / dynamic | Story, timeline, team, contact form, multi-product quote builder |
| `/compare` | Dynamic, `noindex` | Side-by-side comparison of up to four products |

---

## SEO

Implemented end to end:

- Semantic HTML, one `<h1>` per page, breadcrumb navigation
- **JSON-LD**: Organization, LocalBusiness, WebSite + SearchAction, BreadcrumbList,
  Product + Offer, FAQPage, Article, Service, ItemList
- Dynamic per-page metadata from CMS-editable SEO fields (title, description,
  keywords, canonical, `noindex`, OG image)
- Open Graph + Twitter cards, with a generated `/opengraph-image`
- `sitemap.xml` built from live catalog data; `robots.txt` disallowing faceted URLs
- Filtered catalog permutations set `noindex, follow` so they never compete with the
  canonical page
- `next/image` with AVIF/WebP, lazy loading, immutable caching via Nginx

---

## AI Chemical Assistant

A chat widget backed by `POST /api/v1/assistant/chat/`.

- **Grounded on the live catalog** — the system prompt receives a snapshot of matching
  products, and the model is instructed never to invent a product, SKU, CAS number
  or price
- Recommends alternatives, explains applications, and qualifies leads toward a quotation
- Every conversation is logged in the admin under **Assistant → Conversations**
- Set `ANTHROPIC_API_KEY` in `.env` to enable. **Without a key it degrades gracefully**:
  it replies with your real contact details instead of erroring

---

## Admin

`/admin/` is a branded control centre, styled from the same `.env` colour tokens.

- Operations dashboard: product/quotation/inquiry/article/AI KPIs, latest quotes,
  most-requested products, and a "needs attention" queue
- Products with image + document inlines, availability badges, bulk publish/feature actions
- **Bulk CSV/Excel import & export** for products, categories, industries and manufacturers
- Quotation pipeline (new → reviewing → quoted → won/lost) with CSV export
- Media library, SEO fields on every content model, role-based access via Django groups

---

## Testing

```bash
cd backend && .venv/bin/python manage.py test      # 18 tests
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs Django checks, a migration-drift check and the
test suite against PostgreSQL, plus lint, typecheck and build for Next.js.

---

## Notes & next steps

- **Product images** are not shipped — the catalog renders a branded chemical-formula
  placeholder until photography is uploaded through the admin.
- **Email** defaults to the console backend; set `EMAIL_HOST_*` for real delivery.
- **Celery** runs inline when `REDIS_URL` is unset (and always under test), so nothing
  silently queues without a worker.
- Set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED` to show the map on `/contact`, and
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` for analytics.
