# SEO review — 17 October 2026

Scope: https://chemicals.noksindustrial.com, /root/noks. Existing working-tree changes preserved. Only frontend released; database and backend unchanged.

Live evidence before and after: 236 sitemap URLs, 182 products; every URL HTTP 200, indexable, self-canonical, one H1, nonempty unique title, parsed JSON-LD. Before crawl median response 0.083 seconds, maximum 0.167 seconds; these are server fetch timings, not browser speed or Core Web Vitals. All seven Compose services running. robots.txt allows public crawling; clean catalogue page two indexable/self-canonical, missing routes and invalid pagination HTTP 404.

Remaining defects fixed and deployed:
- Knowledge topic links previously ignored tag selection. Forward tag/search to the already-supported API filters, preserve them in pagination, and suppress the unfiltered featured-article treatment when filtering.
- Mark tag/search views noindex/follow, canonical to the clean route; pagination with these filters cannot become an indexable duplicate.
- Replace unsupported shared certification, same-day dispatch, guaranteed COA and quotation-response promises with concrete requests for specification, availability, documentation and delivery confirmation. No business credentials or availability fabricated.

Validation: 124 frontend tests, lint, typecheck and Docker production build pass. Full live crawl repeated after release. Additional eight live checks pass. Mobile/desktop Chromium checks pass: quotation retry/idempotency, contextual contacts, quote prefill, crawlable pagination, no horizontal overflow. All browser submissions mocked; no test leads or external messages sent. Build reports metadataBase warnings for generated surfaces; this review does not claim all social previews have been audited.

Search Console read-only API still returns HTTP 403 PERMISSION_DENIED / API disabled for project 918933062318. Analytics Admin responds HTTP 200 with no accessible property summaries. Consequently no verified impressions, clicks, CTR, rankings, Google-selected canonicals, index coverage or manual-action conclusions can be made. Enable Search Console API, then inspect property access, query/page performance, sitemap processing and representative URL Inspection. Technical indexability does not establish Google indexing or ranking.

Content concern: live homepage contains generic descriptions such as acrylic homopolymer 'used in various industrial applications' and ammonium chloride 'used in various industrial applications'. These give limited buying guidance. This is a content weakness, not a proven cause of low impressions. Improve priority products using actual company/supplier specifications, grade distinctions, packaging, documentation availability and commercial delivery details. Do not mass-generate specialised approvals or certifications. Prioritise using Search Console query/page data once available. Google guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content and https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops .

Separate conversion limitation: current Django EMAIL_BACKEND is django.core.mail.backends.console.EmailBackend. SMTP host/username are populated, but that does not establish verified sending configuration or delivery. Console backend logs email instead of sending. No email configuration changed or messages sent in this review; saved inquiries should be monitored through admin. Previous persistence validation is documented in the 9 October report, not repeated here.

Evidence: .work/2026-10-17/crawl-before.json, crawl-after.json, release-check.json, mobile-product.png, desktop-product.png. Recent bounded logs contain malformed server-action errors and scanner requests; no blanket error-free or verified-Googlebot claim made.

Rollback frontend image: noks-pre-seo-frontend:20261017. To restore, tag that image noks-chemical-frontend then run docker compose up -d --no-deps --no-build frontend. No database restoration required.
