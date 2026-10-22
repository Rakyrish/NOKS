# Google indexing verification — 17 October 2026

Search Console API now works for `sc-domain:chemicals.noksindustrial.com` with `siteFullUser` permission. This supersedes the earlier API-disabled limitation in the SEO review.

All 236 current sitemap URLs inspected through Google's URL Inspection API. Coverage: {"Submitted and indexed": 229, "Discovered - currently not indexed": 1, "URL is unknown to Google": 6}. No inspected URL reports a robots/indexing block. No Google-selected canonical conflicts among the indexed pages. Google inspection results reflect its stored index/crawl history, rather than a live crawl.

Separate live verification: all 236 current sitemap pages HTTP 200, indexable, self-canonical, unique title and one H1. Crawler-user-agent requests also return HTML for all 236 pages with no HTTP X-Robots-Tag noindex restrictions. Every sitemap page receives internal links; all exceptions below have links from other sitemap pages, not merely self-links.

## Pages awaiting Google discovery or crawl

| URL | Google coverage | Other sitemap pages linking directly |
| --- | --- | --- |
| [/catalogue](https://chemicals.noksindustrial.com/catalogue) | Discovered - currently not indexed | 235 |
| [/products/citric-acid-monohydrate](https://chemicals.noksindustrial.com/products/citric-acid-monohydrate) | URL is unknown to Google | 4 |
| [/products/durox-lrd-food-grade-chemical-solution](https://chemicals.noksindustrial.com/products/durox-lrd-food-grade-chemical-solution) | URL is unknown to Google | 9 |
| [/products/paraffin-wax-type-ii](https://chemicals.noksindustrial.com/products/paraffin-wax-type-ii) | URL is unknown to Google | 6 |
| [/products/poly-aluminium-chloride-pac](https://chemicals.noksindustrial.com/products/poly-aluminium-chloride-pac) | URL is unknown to Google | 6 |
| [/categories/textile-treatment](https://chemicals.noksindustrial.com/categories/textile-treatment) | URL is unknown to Google | 235 |
| [/industries/healthcare](https://chemicals.noksindustrial.com/industries/healthcare) | URL is unknown to Google | 36 |

These are crawl/discovery states, not confirmed website blocks. All pages above currently load and allow indexing. There is no evidence here justifying a redirect, content removal, domain move or robots change.

## Action taken

Resubmitted the verified sitemap using Google's supported Search Console API. Submission returned HTTP 204. Confirmation returned HTTP 200; Google downloaded it on 2026-10-17 at 06:38:00 UTC, with zero errors, zero warnings and 236 submitted URLs. No new website code change was needed after the preceding deployed SEO repairs.

The sitemap resource's `contents[].indexed` value is deprecated and must not be used to count indexed pages; individual URL Inspection results above provide the evidence. Documentation: https://developers.google.com/webmaster-tools/v1/sitemaps .

Individual Request Indexing is available through the Search Console web UI, not the URL Inspection API. For the seven URLs above, the owner may use URL Inspection, Test Live URL, then Request Indexing. The sitemap submission covering every URL is complete; no individual request is falsely claimed. Google decides crawl timing and inclusion; requesting does not guarantee indexing. https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl .

## Search performance

Performance API, 17 July–14 October 2026, page-filtered to this subdomain: 6,364 impressions, 96 clicks, 1.51% CTR, average position 38.72. These data establish search visibility; broad low ranking is a concern in addition to the small number of pages awaiting crawling. They do not establish a technical indexing failure. A 90-day average is not the present-day position for every query.

## Evidence

Private local evidence: `.work/2026-10-17/full-indexing-output.txt`, `indexing-summary.json`, `bot-access.json`, `gsc-report.json`, `sitemap-submission.txt`, `crawl-after.json`. No credentials stored in the output. No database or production content changes made during this API follow-up.
