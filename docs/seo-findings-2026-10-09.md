# Live repair findings — 9 October 2026

Scope: chemicals.noksindustrial.com only. Repository `/root/noks`, branch
`seo/deploy-fixes-2026-10-05`. Next.js 15.5.23 / React 19, Django 5.1.5,
PostgreSQL 16, Redis 7, Celery 5.4; independent `noks-chemical` Compose stack
behind the shared kivi TLS proxy. No applicable AGENTS.md found. Original
modified `frontend/tsconfig.tsbuildinfo` copied aside and preserved.

## Verified findings

- Baseline sitemap: 232 URLs / 180 products; catalogue: 182 products. Both
  excluded products had a different canonical. Their packaging differs from
  the target records, and no supplier documents establish equivalence. Preserve
  all variants and URLs; restore self-canonicals rather than forcing redirects.
- `acetone` is recorded as laboratory grade but assigned to agricultural
  chemicals. Explicit laboratory/analytical reagent records and several
  industrial acid/alkali records have mismatched primary categories.
- Water treatment originally listed five products. Existing industry mappings
  are excessively broad (even acetone and an industrial drum), so do not use
  that entire industry as a category. Add seven explicit secondary application
  relationships and correct primary categories; rehearsal yields 13 products.
- Server-side `safe()` swallowed API failures into empty successful listings;
  sitemap errors returned only static routes. Builds intentionally prerendered
  against a closed API port. Fail closed in production; render CMS pages at
  request time, while caching successful API reads with explicit TTL/tags.
- Pagination used buttons/router navigation, with noindex and canonical to
  page one. Provide real anchors, self-canonicals and indexable unfiltered
  pagination; keep search/filter combinations separate.
- Email backend is console, SMTP credentials absent. Notification functions
  used `fail_silently=True`, never actually retried, and broker errors could
  return 500 after saving a lead. Add atomic receipts, UUID retry protection,
  persistent delivery state and scheduler recovery. Console output is never
  counted as delivery. Historical leads are not re-emailed automatically.
- Quote references were based on the last row ID, allowing concurrent collisions.
  Use unique random references without changing historical references.
- New quotes need durable grade and URL snapshots; admin list omitted packaging,
  notes and delivery requirements. Expose these and notification state.
- Proxy upstreams held static container addresses. Nginx 1.27.5 supports dynamic
  DNS upstream resolution; enable it only in NOKS's own proxy.
- Frontend CMS changes had no explicit invalidation. Add authenticated tag/path
  revalidation after saves, deletes and relationship changes; retain TTL fallback.
- Product schema correctly omitted offers on quotation-only products. No reviews
  exist; no fabricated offer or rating was added. Prevent zero/invalid offers,
  publish price when explicitly configured as public, and gate unverified stock.
- Google Indexing API was enabled for chemical products. Official guidance limits
  it to JobPosting and BroadcastEvent; disable these ineligible submissions.
- Mobile Lighthouse baseline: home 88 (LCP 2.9 s / TBT 290 ms), category 92
  (2.6 s / 250 ms), acetone 93 (2.8 s / 180 ms); CLS zero on acetone. Hidden
  carousel preload fetched a 45 KB image into a 1 px box; remove it. Reduce
  oversized decorative mosaic image quality. These are lab measurements, not
  field Core Web Vitals.
- Last seven days of inner proxy logs: six 502 and 22 500 responses. Many errors
  targeted unrelated WordPress exploit URLs; no evidence attributes the single
  reported food-category 502 to a specific database query. Database had 12 active
  connections and zero recorded deadlocks. A 96-product serialization required
  three queries before, four with secondary categories; no demonstrated need
  for speculative indexes or worker increases.
- Inner logs record the edge IP. Edge IPs 66.249.68.200 and 66.249.75.196 verify
  by reverse DNS to googlebot.com and matching forward DNS. 78.159.126.28 does
  not verify and must not be counted as Googlebot. Shared edge logs do not
  consistently identify the requested host, so no per-site crawling claims are
  inferred merely from those aggregates.
- Parent homepage currently links to this subdomain three times, with two
  matching public contact links. Five sampled overlapping product URLs return
  200. Parent-site changes remain outside authorisation; no domain migration.
- Search Console property API returns 403 with the existing service account.
  No impressions, indexing, manual-action or Google-selected canonical claims
  are made without access. No analytics installation/measurement ID exists.

## Product and application evidence

Public manufacturer documentation supports general chemical identity and
applications; it does **not** establish NOKS supplier relationships, batch
specifications or specialised approvals:

- Merck acetone: https://www.merckmillipore.com/JP/en/product/sigald/179124
- Kemira inorganic coagulants: https://www.kemira.com/products/inorganic-coagulants-for-water-treatment/
- Hawkins treatment chemicals: https://www.hawkinsinc.com/groups/water-treatment/
- Hawkins caustic pH control: https://productcatalog.hawkinsinc.com/viewproduct/17429/caustic-soda-sodium-hydroxide
- Solvay soda applications: https://www.solvay.com/en/brands/soda-solvay/applications

Six provisional commercial content priorities: laboratory acetone, technical
acetone, caustic flakes, PAC, alum and hydrogen peroxide 50%. Selected for
breadth of buying intent and recorded catalogue interest; view counters include
crawlers and are not reliable demand data. No Search Console prioritisation.
Rewrite around grade distinctions, recorded packaging (subject to quotation
confirmation), application selection and documentation requests. Preserve
specifications, prices, stock flags, accounts, images and existing enquiries.
Unverified specialised-use and supplier claims elsewhere require company review.

Google references:

- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests
- https://developers.google.com/search/apis/indexing-api/v3/using-api

## Dependencies

SMTP service, verified sending identity and designated company-controlled test
address remain absent. Published domain MX uses Cloudflare routing; SPF includes
Cloudflare, DMARC is quarantine with strict SPF alignment. Routing MX does not
establish outbound sending support. DKIM selector cannot be verified until the
actual sending service is designated; no DNS changes made.

Search Console access: grant readonly access or supply exports for the subdomain.
Obtain last 90 days vs previous 90, query/page/country/device breakdowns, Page
Indexing, sitemap processing, crawl statistics, manual actions/security, and URL
Inspection for the six commercial products plus preserved variants. Filter
`page` to `https://chemicals.noksindustrial.com/` in a parent-domain property.

Analytics is absent, so no unsolicited tracking or consent assumptions were
introduced. With a company-approved measurement ID and consent policy, implement
`generate_lead` only after a saved receipt and click events for phone/email/
WhatsApp/quote actions, with product IDs and page paths only. Clicks do not prove
completed calls or delivered messages.

## Final validation and release outcome

| Check | Before | Final |
| --- | --- | --- |
| Sitemap URLs / products | 232 / 180 | 236 / 182 |
| Full canonical crawl | Audit leads only | 236/236: HTTP 200, indexable, self-canonical, one H1, unique title |
| Unfiltered product page 2 | noindex; canonical page 1; buttons | indexable; self-canonical; real links |
| Invalid/out-of-range product pagination | HTTP 500 after failure-handling repair | HTTP 404 |
| Laboratory acetone category | Agricultural | Analytical reagents |
| Water-treatment discovery | 5 products | 13 products |
| Product/API or sitemap unavailable | empty/core-only HTTP 200 possible | isolated outage test HTTP 500 |
| Notification failures | swallowed; console counted as success | persistent pending state, retry/recovery; console never counted as sent |
| Homepage transferred bytes, lab | 588 KiB | 490 KiB (about 17% less) |

- Production builds, lint/typecheck and 116 frontend tests passed.
- All 47 backend tests passed on PostgreSQL; additive migration/model drift check
  passed. SQLite tests also passed but did not expose PostgreSQL nullable-join
  locking, which was subsequently corrected and tested on PostgreSQL.
- Production controlled test: quote/inquiry persistence, grade/URL/quantity/
  packaging/location/notes, duplicate replay, authenticated admin visibility and
  mocked notification/acknowledgement delivery passed. All controlled records
  rolled back. The original one quote and zero inquiries remained untouched.
- Mobile and desktop browser checks passed; external submissions were intercepted.
  Product WhatsApp/email context, call URLs, quote prefill, truthful error/success
  display and UUID reuse on retry were verified.
- Existing artifact redirects remain one-hop permanent 308; missing URLs and
  invalid pagination return 404. HTTP redirects to HTTPS with 301. No unsupported
  alternate hostname was introduced. Cache invalidation: unauthenticated 401,
  authenticated 200. Representative existing product image responses: 200 JPEG;
  no missing photograph was invented for products without one.
- Product/Breadcrumb JSON-LD was checked in every canonical crawl response using
  current Google field guidance. Every Product has a name and matching URL;
  quotation-only products intentionally lack offers/reviews/ratings and therefore
  do not meet Google's Product snippet eligibility. No automated Rich Results
  Test service or Search Console validation claim is made.
- Mobile Lighthouse after runs: homepage 82–89, LCP 2.9–3.0 s, TBT 260–460 ms;
  water category 84–89, LCP 2.7 s, TBT 310–470 ms; acetone 90, LCP 2.7 s,
  TBT 250 ms. Scores varied; do not claim a proven overall CWV improvement.
  The water page now contains more useful products. Homepage responsive-image
  waste dropped from approximately 82 KiB to 14 KiB. No field CWV data available.
- Seven NOKS services are running; recent release logs show notification recovery
  and no application errors/5xx/timeouts. Existing deployment-check warnings:
  34 OpenAPI documentation warnings and intentional SAMEORIGIN rather than DENY;
  these are not evidence of blocked crawling or broken enquiry permissions.
- Only this website's affected services were deployed. Rollback was exercised
  for backend services, corrected code redeployed, and standalone rollback images
  plus protected backups retained. Temporary task containers were removed.
- The latest business-data audit is retained privately. Supplier-grade,
  specialised-use, formula/CAS, packaging/unit and certification claims lacking
  documents still require company verification. No grades or certifications were
  fabricated. See [rollback and 28-day monitoring](rollback-2026-10-09.md).

## Subsequent SEO-only release

See [SEO follow-up release](seo-followup-2026-10-09.md) for the additional
Knowledge Centre 404 repair, canonical industry pagination, truthful landing
copy, 122-test validation, repeated 236-URL live crawl and frontend rollback.
Analytics remains disabled in the SEO release.
