# SEO technical baseline — before

**Site:** https://chemicals.noksindustrial.com/
**Audited:** 2026-09-12
**Commit at audit:** `80bcec6` (`refactor: cut the homepage to eight sections, move company depth to /about`)
**Method:** source inspection + live HTTP probes against production + direct queries
against the production database (`noks-chemical-db-1`) via the running backend container.

Nothing in this document is inferred. Every claim below is backed by a command whose
output is quoted or summarised inline.

---

## 1. Stack and where things are generated

| Concern | Location |
| --- | --- |
| Frontend | Next.js **15.5.23**, App Router, React 19, Tailwind 4 (`frontend/`) |
| Backend | Django 5 + Django REST Framework (`backend/`), Postgres, Redis, Celery |
| Deployment | docker-compose: `frontend`, `backend`, `worker`, `beat`, `nginx`, `db`, `redis`; an outer nginx terminates TLS |
| Config | One root `.env` read by **both** stacks (`backend/config/settings.py` via `load_dotenv`, `frontend/next.config.mjs` via `dotenv`) |

### 1.1 Metadata generation

Per-object SEO overrides live on the Django side in the abstract
`apps.core.models.SEOModel` (`meta_title`, `meta_description`, `meta_keywords`,
`og_image`, `canonical_url`, `noindex`), mixed into `Category`, `Industry`, `Product`
and `Post`. They are exposed by `apps.catalog.serializers.SEOFieldsMixin.get_seo()` as a
nested `seo` object.

The Next.js side consumes that in each route's `generateMetadata()`:

- `frontend/src/app/(site)/products/[slug]/page.tsx`
- `frontend/src/app/(site)/categories/[slug]/page.tsx`
- `frontend/src/app/(site)/industries/[slug]/page.tsx`
- `frontend/src/app/(site)/knowledge/[slug]/page.tsx`
- static `metadata` exports on `/products`, `/quote`, `/knowledge`, `/about`, `/contact`, `/services`, `/industries`, `/compare`

There is **no shared metadata helper**. Each route assembles title/description/canonical/OG
by hand, which is why they have drifted apart (§3.4).

### 1.2 Cloudinary URL source

`USE_CLOUDINARY` (root `.env`) switches `STORAGES["default"]` to
`cloudinary_storage.storage.MediaCloudinaryStorage` for **image fields only**
(`backend/config/settings.py:176`). `ProductDocument.file` and `MediaAsset.file` pin
`FileSystemStorage()` explicitly and stay local.

So `ProductImage.image.url` returns a fully-qualified
`https://res.cloudinary.com/<cloud>/image/upload/...` URL. That value reaches the
frontend through `ProductListSerializer.get_image()`:

```python
url = img.image.url
return request.build_absolute_uri(url) if request else url
```

`build_absolute_uri()` correctly leaves an already-absolute URL alone, so the API
response carries a clean absolute Cloudinary URL. **The corruption happens on the
frontend**, not here — see §2.

### 1.3 Sitemap and robots.txt

- `frontend/src/app/sitemap.ts` — `force-dynamic`, walks the product API, then category
  tree, industries and posts.
- `frontend/src/app/robots.ts` — allows everything except `/api/` and `/admin/`.
- `django.contrib.sitemaps` is in `INSTALLED_APPS` but **no sitemap is wired into
  `config/urls.py`** — it is dead weight. The Next.js sitemap is the only one served.

### 1.4 JSON-LD generators

All in **`frontend/src/lib/schema.ts`**: `organizationSchema`, `localBusinessSchema`,
`websiteSchema`, `breadcrumbSchema`, `productSchema`, `faqSchema`, `articleSchema`,
`serviceSchema`, `itemListSchema`. Rendered through
`frontend/src/components/shared/json-ld.tsx`. `breadcrumbSchema` is invoked only from
`components/shared/page-hero.tsx` (via the `crumbs` prop), so breadcrumb markup and the
visible breadcrumb trail share one source.

### 1.5 Canonical helper

`frontend/src/lib/site.ts`:

```ts
export const absoluteUrl = (path = "/") =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
```

It assumes its argument is a **site-relative path**. It has no guard for a value that is
already absolute. That single missing guard is the root cause of §2.

### 1.6 Product data source

All from `apps.catalog.models.Product`: `availability` (enum, default `in_stock`),
`price_on_request` (default `True`) / `indicative_price` / `currency`, `manufacturer`
(FK, nullable), `specifications` (JSON dict), `packaging_options` (JSON list),
`min_order_quantity` (default `1`), `safety_information`, `storage_handling`,
`hazard_class`, `cas_number`, `chemical_formula`, `purity`, `grade`.

There is **no inventory system**. `availability` is a free-standing editable enum
defaulting to `in_stock`, so "In stock" on the site is an editorial claim, not a
stock-controlled fact. `apps/catalog/content.py` and `apps/catalog/ai.py` compose
product prose; `Product.ai_generated` flags rows whose content was ever seeded from an
AI draft.

---

## 2. CRITICAL — malformed Cloudinary URLs

`absoluteUrl()` is called with values that are already absolute:

- `frontend/src/lib/schema.ts:185` — `image: [absoluteUrl(product.image)]` (Product JSON-LD)
- `frontend/src/lib/schema.ts:228` — `image: [absoluteUrl(post.cover_image)]` (Article JSON-LD)

Live confirmation on `/products/calcium-propionate`:

```
"image":["https://chemicals.noksindustrial.com/https://res.cloudinary.com/pwnff5q7/image/upload/v1/media/products/2026/08/calcium-propionate-0_hpspfl"]
```

Two occurrences of the `noksindustrial.com/https://` pattern on that one page.

The underlying Cloudinary asset is **healthy** — fetched directly it returns
`200 image/jpeg 35627`. The image is fine; only the URL we publish is broken. Every
Product and Article JSON-LD `image` on the site is therefore unresolvable, which
disqualifies the Product markup from image-bearing rich results.

`mediaUrl()` in `frontend/src/lib/utils.ts` *does* handle the absolute case correctly and
is what the visual `<Image>` components use — which is why the pictures render for users
while the structured data is broken. There are two competing helpers and only one of them
is correct.

`next.config.mjs` builds `images.remotePatterns` from `NEXT_PUBLIC_IMAGE_DOMAINS`, which
is currently `chemicals.noksindustrial.com,res.cloudinary.com,images.unsplash.com`, and
registers **both `https` and `http`** for each host. `images.unsplash.com` is not a
first-party asset host.

---

## 3. Crawling, indexing and duplication

### 3.1 Missing pages return HTTP 200

| URL | Status | Title | Canonical |
| --- | --- | --- | --- |
| `/products/xanthan-gum-food-grade` | **200** | `Product not found \| NOKS Chemical Division` | `https://chemicals.noksindustrial.com` |
| `/products/caustic-soda-flakes-2` | **200** | `Product not found \| NOKS Chemical Division` | `https://chemicals.noksindustrial.com` |

Neither slug exists in the database (`Product.objects.filter(slug=...)` → `None`), and
there is **no Xanthan Gum product at all** (`name__icontains='xanthan'` → 0 rows).
`caustic-soda-flakes` (id 36, "Caustic Soda Flakes", published) does exist.

The 200 is not an nginx artefact — the Next container itself answers `HTTP/1.1 200 OK`.
**Cause:** `frontend/src/app/(site)/loading.tsx` puts every route in the group behind a
Suspense boundary, so Next flushes response headers with `200` before the page body
runs. `notFound()` then renders inside the already-committed stream and cannot change
the status. The served HTML contains *both* `<meta name="robots" content="index, follow">`
(from the root layout) and a later `<meta name="robots" content="noindex">` (injected by
Next's not-found path), plus a canonical pointing at the **homepage**, because the root
layout's `alternates: { canonical: "/" }` is inherited when `generateMetadata` returns
only `{ title: "Product not found" }`.

Net effect: soft-404s that are 200, self-declared indexable, and canonicalised to the
homepage. This is the single most damaging indexing defect on the site.

### 3.2 Duplicate category

```
 0  water-treatment-chemicals-2   pub=True parent=None  name='water treatment chemicals'
 0  water-treatment-chemicals     pub=True parent=None  name='Water Treatment Chemicals'
```

Both are published, both are in the sitemap, both render HTTP 200 with self-referencing
canonicals, and **both hold zero products**. The `-2` slug was minted by
`SluggedModel.save()`, which silently appends `-2/-3` on a slug collision. `Product`
defends against this with a unique `name_key`; `Category` and `Industry` do not.

Note: most other `-<digit>` slugs in the catalogue are **legitimate** (concentrations —
`sulfuric-acid-98`, `hydrochloric-acid-33`, `ammonia-solution-25`). A blanket
suffix-strip would destroy real URLs.

### 3.3 Thin / empty categories

**18 of 41 categories hold zero published products**, and all 41 are in the sitemap and
indexable:

```
rubber-and-plastics, food-grade-chemicals, alkalis-caustics, specialty-chemicals,
culture-media, antiscalants, indicators-stains, buffer-solutions,
construction-admixtures, sweeteners-additives, water-treatment-chemicals-2,
ph-adjusters, polyurethane, water-treatment-chemicals, cleaning-hygiene,
solvent-and-thinner, textile-auxiliaries, acidulants
```

A further 5 hold exactly one product. `paints-an-coatings` is a misspelling of
"paints-and-coatings" baked into a live URL.

### 3.4 Duplicated title suffix

`frontend/src/app/(site)/layout.tsx:32` sets `template: '%s | NOKS Chemical Division'`,
and 56 database rows already end their `meta_title` with the same brand string. Live:

```
Disinfectants Suppliers Kenya | NOKS Chemical Division | NOKS Chemical Division
Water Treatment Chemicals in Kenya | NOKS Chemical Division | NOKS Chemical Division
Safe Storage and Handling of Industrial Acids | NOKS Chemical Division | NOKS Chemical Division
Food Grade Chemicals Supplier in Kenya | NOKS | NOKS Chemical Division
```

Affects all 11 categories, all 12 industries and all 6 knowledge articles carrying a
`meta_title`. Product titles are unaffected (their `meta_title` values omit the brand).

### 3.5 Parameter and faceted URLs

`robots.ts` deliberately allows everything. Combined with the metadata rules:

| Pattern | Robots today | Canonical today |
| --- | --- | --- |
| `/products?category=…` | **indexable** | `/products` |
| `/products?industry=…` | **indexable** | `/products` |
| `/products?q=…` | `noindex,follow` | `/products` |
| `/products?grade=…&availability=…&ordering=…&page=…` | **indexable** | `/products` |
| `/knowledge?category=…` | **indexable** | `/knowledge` |
| `/quote?product=…` | **indexable** | `/quote` |

Every facet combination is crawlable and self-declares as indexable. With 41 categories,
12 industries, 5 grades, 4 availabilities and free ordering/pagination, the reachable
combination space is effectively unbounded — a crawl trap. The comment in `robots.ts`
correctly notes that blocking them in robots.txt was the wrong fix; the right fix
(`noindex,follow` on combination URLs) was never applied.

### 3.6 Breadcrumb pointing at a parameter URL

`frontend/src/app/(site)/knowledge/[slug]/page.tsx:66`:

```ts
{ name: post.category_name, url: `/knowledge?category=${post.category_slug}` },
```

That query URL is published as an intermediate `BreadcrumbList` item on every article and
is rendered as a visible link. There is no clean `/knowledge/category/<slug>` route.

### 3.7 Sitemap

249 URLs. Problems:

- `lastModified` is `new Date()` (build/request time) for **every** static route, product,
  category and industry — only articles use a real date (`published_at`). Every URL
  therefore appears to change on every fetch, which trains crawlers to ignore the signal.
- Includes `water-treatment-chemicals-2` (duplicate) and all 18 empty categories.
- No filtering on `noindex`, and no check that a listed URL actually resolves.

---

## 4. Structured data

- **Product** — `image` malformed on every product with a photo (§2). `brand` falls back
  to `NOKS Chemical Division` whenever `manufacturer_name` is empty, asserting NOKS as
  manufacturer of goods it distributes. No reviews or ratings are fabricated (good). No
  price is invented — `offers` is correctly omitted for `price_on_request` products
  (good). `availability` is emitted only inside `offers`, so the unbacked `in_stock`
  default is not currently published as `schema.org/InStock` for quote-only products.
- **Article** — `image` malformed (§2). `author` is always an `Organization`, never the
  named person, even where `post.author.name` exists.
- **Breadcrumb** — parameter URL as an intermediate item (§3.6).
- **Organization / LocalBusiness** — `sameAs` carries four social URLs from `.env`.
  Probed: `twitter.com/noks` → **404**, `linkedin.com/company/noks` → 999 (LinkedIn's
  bot-block, unverifiable by machine), `facebook.com/noks` → 200, `instagram.com/noks`
  → 200. The two that return 200 are generic handles that have not been confirmed as
  belonging to this business. `telephone` is emitted as `0142998027` — a local Kenyan
  format, not E.164.

---

## 5. Company claims and NAP

Current values in root `.env`:

```
NEXT_PUBLIC_CONTACT_PHONE=0142998027
NEXT_PUBLIC_CONTACT_EMAIL=info@noksindustrial.com
NEXT_PUBLIC_CONTACT_EMAIL_SUPPORT=technical@noks.co.ke     ← different domain
NEXT_PUBLIC_ADDRESS_STREET=Enterprise Road, Industrial Area
NEXT_PUBLIC_ADDRESS_CITY=Nairobi   POSTAL=00100   COUNTRY=Kenya
NEXT_PUBLIC_GEO_LAT=-1.3084  NEXT_PUBLIC_GEO_LNG=36.8515
NEXT_PUBLIC_STAT_YEARS=15  PRODUCTS=1200  COUNTRIES=8  DELIVERIES=25000  SATISFACTION=98
```

Claims rendered in the UI with no in-repo evidence:

| Claim | Where |
| --- | --- |
| "Same-day Nairobi dispatch" | `home/hero.tsx:73`, `home/trust-strip.tsx:21`, `home/cta-band.tsx:86`, `home/supply-mosaic.tsx:54` |
| "Tanker & fleet delivery" / "Bulk road tankers across the EAC corridor" | `home/supply-mosaic.tsx:36-37` |
| "In-house QC" | `home/supply-mosaic.tsx:44` |
| bulk tanker deliveries | `home/identity-band.tsx:12` |
| 1,200 product lines | `.env` → `stats-band.tsx`; **actual published catalogue is 182 products** |
| 25,000 deliveries, 98% satisfaction, 15 years, 8 countries | `.env` → `stats-band.tsx` |
| "Certificate of Analysis and Safety Data Sheet with every batch" | `products/[slug]/page.tsx:431` |
| KEBS / ISO | `Certification` model rows + outbound KEBS link on every product page |

`1200` vs the real 182 published products is a directly contradicted, machine-checkable
claim.

### Placeholder contact fallbacks still in code

```
components/layout/floating-contacts.tsx:17  contact.telHref || "tel:+254700000000"
components/layout/floating-contacts.tsx:18  contact.phone   || "+254 700 000 000"
components/layout/floating-contacts.tsx:25  https://wa.me/254700000000?text=…
components/home/cta-band.tsx:73             contact.whatsappUrl || "https://wa.me/254700000000"
components/layout/footer.tsx:153            contact.whatsappUrl || "https://wa.me/254700000000"
components/layout/header.tsx:137            contact.whatsappUrl || "https://wa.me/254700000000"
components/home/how-we-work-teaser.tsx:96   contact.whatsapp   || "254700000000"
```

Not currently rendered (the env values are populated), but one blank env var away from
publishing a fake number sitewide.

---

## 6. Test suite and build — current state

### Backend

```
$ docker exec noks-chemical-backend-1 python manage.py test
Ran 32 tests in 1.979s
FAILED (failures=19, errors=5)
```

**The entire suite is inoperative and has been for some time.** Root cause:
`backend/config/settings.py:356` sets `SECURE_SSL_REDIRECT = True` whenever
`DEBUG` is false. The Django test client issues plain-HTTP requests, so
`SecurityMiddleware` answers **301** to every single request before any view runs:

```
AssertionError: 301 != 201
ValueError: Content-Type header is "text/html; charset=utf-8", not "application/json"
```

`.github/workflows/ci.yml` runs the suite with `DJANGO_DEBUG: "False"`, so **CI has been
red (or the job never gated anything) for as long as this setting has existed.** Only the
6 `SimpleTestCase` assertions that never touch the client pass. This must be fixed before
any new regression test can be trusted.

### Frontend

```
$ npx tsc --noEmit     → clean
$ npx next lint        → ✔ No ESLint warnings or errors
```

There is **no frontend test runner at all** — no vitest, no jest, no test script in
`frontend/package.json`. Zero automated coverage of metadata, schema, sitemap or URL
handling.

---

## 7. Defect register carried into the fix phase

| # | Severity | Defect |
| --- | --- | --- |
| D1 | Critical | `absoluteUrl()` prefixes the site origin onto absolute Cloudinary URLs in Product and Article JSON-LD |
| D2 | Critical | Missing products/categories return HTTP 200 (soft 404) — caused by `(site)/loading.tsx` flushing the stream early |
| D3 | Critical | Soft-404 pages inherit the root layout's homepage canonical and `index, follow` |
| D4 | Critical | Django test suite 100% broken under `DEBUG=False` (`SECURE_SSL_REDIRECT`) — CI gates nothing |
| D5 | High | Duplicate category `water-treatment-chemicals-2`; `Category`/`Industry` have no duplicate-name guard |
| D6 | High | Title template double-appends the brand on 56 rows |
| D7 | High | Unbounded indexable facet/parameter space (`/products?…`, `/knowledge?category=…`, `/quote?product=…`) |
| D8 | High | 18 empty categories indexable and in the sitemap |
| D9 | High | Sitemap `lastmod` is request-time for all non-article URLs; includes duplicate + empty + unvalidated URLs |
| D10 | Medium | Breadcrumb uses `/knowledge?category=…` parameter URL as an intermediate item |
| D11 | Medium | Product schema asserts NOKS as `brand` for distributed goods |
| D12 | Medium | `sameAs` includes an unreachable Twitter profile and unverified generic handles |
| D13 | Medium | `1200` product-lines stat contradicted by the 182-product catalogue |
| D14 | Medium | Unsupported operational claims (same-day dispatch, tanker fleet, in-house QC) |
| D15 | Medium | Placeholder `+254 700 000 000` / `254700000000` fallbacks in 5 components |
| D16 | Medium | No frontend test runner; no SEO regression coverage |
| D17 | Low | `images.remotePatterns` allows `http` and an unused third-party host |
| D18 | Low | Article schema always attributes authorship to the Organization |
| D19 | Low | `django.contrib.sitemaps` installed but unwired |
| D20 | Low | `paints-an-coatings` misspelled slug live |
