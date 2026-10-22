# SEO follow-up release — 9 October 2026

The owner redirected work to website SEO. Google/Analytics account setup is no
longer a prerequisite for site fixes. This release preserves the preceding
catalogue, canonical, sitemap, category, cache, enquiry and performance repairs.
Only NOKS's frontend was recreated. No database changes, backend restarts, parent
website changes or shared-proxy changes were needed.

## Verified remaining faults and repairs

- Knowledge Centre invalid/out-of-range pagination returned 500; `page=0` and
  nonnumeric values silently repeated page one as HTTP 200. Shared strict page
  validation and explicit API-404 handling now return HTTP 404. Genuine article
  pages remain self-canonical and receive distinct page titles when they exist;
  the current six published articles fit on one page, so page two is correctly 404.
- Industry landing pages showed only twelve products. Their overflow links led
  to a noindex catalogue filter rather than canonical industry pagination.
  Added crawlable numbered links, self-canonicals, distinct titles/H1s and page
  breadcrumbs. Page one retains its existing URL. Search/filter views stay
  noindex; invalid/out-of-range industry pages return 404.
- Manufacturing has 149 catalogue associations. All 149 unique product URLs are
  now reachable across thirteen industry pages, without duplicates. Ten other
  industry page-two URLs were also verified. Existing associations are preserved;
  these associations do not establish specialised-use approvals.
- Landing templates asserted applications-chemist credentials, a verified
  manufacturer network, guaranteed document delivery and a one-business-day
  quotation promise without supporting company records. Replaced these with
  concrete buying prompts for grade, quantity, packaging, documentation and
  delivery confirmation. No technical suitability or service commitment invented.
- Pending Analytics code is explicitly gated by NEXT_PUBLIC_ANALYTICS_ENABLED,
  which is absent/false. No consent banner or Google tag loads in this SEO release.
  Any future Analytics activation must use a new build of the current source;
  do not deploy the older staged Analytics image over these SEO repairs.

## Validation

- Production Docker build, lint and type check pass; all 122 frontend tests pass.
- Before and after full crawls: 236 sitemap URLs, including 182 products; all
  successful, indexable, self-canonical, one H1 and unique titles.
- Thirty-three additional live checks pass: Manufacturing pages one–thirteen,
  ten other industry page-two URLs, malformed/out-of-range knowledge/industry/
  product pagination. All thirteen Manufacturing titles are unique, all page
  links crawlable, and product coverage is exactly 149 unique URLs.
- Live mobile/desktop browser checks pass for quotation retry protection,
  product prefill, contextual WhatsApp/email/call links, pagination, mobile
  industry layout and current-page semantics. Form submissions were mocked;
  no external messages or production enquiry records were created.
- Browser observed zero Google Analytics/tag requests. Seven NOKS services remain
  running. Recent five-minute application logs: 38 lines checked, zero ERROR
  lines, tracebacks or observed HTTP 500/502 entries.
- The agent daemon interrupted final checks after deployment. The completed
  full-crawl artifact was verified; additional status/browser checks were then
  repeated successfully. No duplicate deployment was performed.
- Temporary local preview removed; existing backups and original dirty
  build-info retained. Git diff whitespace check passes.

Evidence is restricted to `.work/2026-10-09/seo-followup-*`.

## Rollback

Previous release retained as `noks-pre-seo-followup-frontend:20261009`.
Rollback changes only this site's frontend and preserves all database content:

```sh
cd /root/noks
docker image tag noks-pre-seo-followup-frontend:20261009 noks-chemical-frontend
docker compose up -d --no-deps --no-build frontend
```

The website's own nginx dynamically resolves the frontend container address.
Validate live health after rollback. No database restore/migration reversal is
needed. Original full-repair rollback remains documented separately.

## Remaining measurement and business verification

Supplier specifications, specialised grade/approval claims, packaging and
availability need company documentation; they were not guessed. SMTP remains
unconfigured for outbound delivery, while saved enquiries remain in admin.
Search Console results cannot be claimed without verified access. These
external dependencies did not prevent this SEO release. Monitor organic
visibility and qualified enquiries using the existing 28-day monitoring guide;
technical fixes do not guarantee ranking changes or a Google recrawl date.
