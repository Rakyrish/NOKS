# Search ranking content release — 17 October 2026

Released to https://chemicals.noksindustrial.com following the owner's instruction to address the verified content and buying-intent weaknesses. Google URL Inspection previously confirmed 229/236 sitemap URLs indexed; this release targets usefulness and commercial relevance, rather than claiming to repair a site-wide indexing failure.

## Changes deployed

- All 182 product pages now include a visible buying section for Kenya: recorded grade and assay, listed pack sizes, quantity and impurity requirements, quotation price basis, tax/transport questions, lead-time confirmation and document requests. Product-specific quotation links preserve prefill, with links to the relevant category and the specification-comparison guide. No prices or delivery commitments invented.
- Cleaned repeated generated marketing paragraphs from 159 product descriptions. Preserved the original chemical overviews outside the seven targeted rewrites. Removed recognised unsupported commercial benefit claims and replaced repeated stock, dispatch, documentation and minimum-order FAQ promises with quotation-confirmation guidance. Existing safety fields and technical specifications remain untouched.
- Replaced 36 weak short descriptions and corresponding search descriptions, including the caustic soda listing. Seven detailed rewrites address acrylic homopolymer, ammonium chloride, MEK, calcium propionate, cocamide DEA, n-hexane and ammonium bicarbonate. Their application lists now distinguish the relevant grade and purchasing requirement. Generic benefits on these seven records were removed. Primary-source links appear on their pages; they establish general chemical/application context, not NOKS supplier relationships or batch approvals.
- Added topic-specific purchasing links to all six guides. The highest-impression food-grade and acid-storage articles have clearer titles, descriptions and substantially revised content, with matching updates to six FAQ records. Food ingredient requirements are framed as specification/document checks; the acid guide no longer presents a generic storage-compatibility or spill-neutralisation procedure. References to USP and HSE are visible; HSE material is general safety guidance, not a statement of Kenyan legal requirements.
- Corrected the CAS guide's contradictory hydrate statement and replaced its unsupported categorical physical-form comparison with a request to specify the required form and test properties. Expanded the three revised articles' product relationships to appropriate existing listings; removed the acid article's irrelevant soda-ash suggestion.
- Rewrote four relevant category introductions: food/beverages, preservatives, solvents, soaps/detergents.
- Replaced the repeated county list and unsupported regional route/weekly-shipment claims with concise Nairobi collection, delivery and regional enquiry instructions using configured company contact details.

Database release: 160 products, three posts, four categories and six article FAQs (173 records), plus three revised post-product relationship sets. All updates were previewed against a saved snapshot, checked for concurrent edits, and applied in a database transaction. Product identity, category, grade, assay/specification, pricing, stock and safety fields were explicitly checked unchanged. No products or URLs removed. Content timestamps reflect real edits. Cache invalidation returned HTTP 200.

## Verification

- Frontend: all 124 tests pass; lint, typecheck and production build pass.
- Live full crawl: all 236 sitemap URLs, including 182 products, return HTTP 200, permit indexing, self-canonicalise, have one H1 and nonempty unique titles. Parsed JSON-LD passes the crawler checks.
- Fifteen targeted live checks verify revised visible content, buying sections, metadata, and exact agreement between the six revised FAQ answers and JSON-LD.
- Mobile/desktop browser checks pass for contextual article links, product contacts, quote prefill, retry/idempotency and crawlable pagination; no horizontal overflow on checked layouts. Submissions were mocked; no external messages or test leads created. An initial browser test clicked before scrolling settled; a second assertion incorrectly looked for links inside the section heading. The test interactions/selectors were corrected, diagnostics inspected, and the complete browser check passed. No production form change was required.
- All seven services remain running. Only frontend was recreated; backend services were not rebuilt or restarted and no migrations were required.
- Sitemap submission returned HTTP 204 at 06:55:14 UTC. Confirmation returned HTTP 200 and showed the new submission pending processing. This is submission evidence, not a claim that Google has recrawled the updated content or changed rankings.

The build still reports pre-existing metadataBase warnings for generated surfaces. This release does not claim to resolve all social-preview warnings or measure field Core Web Vitals.

## Primary references used

- MEK: [INEOS ketones](https://www.ineos.com/businesses/ineos-enterprises/businesses/ineos-solvents/products/ketones/).
- Ammonium salts: [BASF technical salts](https://chemicals.basf.com/global/en/Monomers/technical-salts).
- Calcium propionate: [Kerry mould-control ingredients](https://www.kerry.com/products/food-protection-and-preservation/mould-control).
- Cocamide DEA function: [Health Canada ingredient record](https://webprod.hc-sc.gc.ca/nhpid-bdipsn/ingredReq?id=3341).
- Commercial hexane: [Shell product document](https://www.shell.com/content/dam/shell/assets/en/business-functions/product/chemical/documents/hexane-extraction-q1252.pdf).
- Polymer selection: [Lubrizol dispersant paper](https://www.lubrizol.com/-/media/1639E300BD9F4230A46790D1F8EEDD7A.pdf).
- Food specification: [USP ingredient standards](https://qualitymatters.usp.org/whats-usps-role-helping-ensure-food-ingredients-safety).
- SDS and assessment: [HSE safety data sheets](https://www.hse.gov.uk/coshh/basics/datasheets.htm), [HSE assessment guidance](https://www.hse.gov.uk/coshh/basics/assessment.htm).
- Identity: [CAS Registry](https://www.cas.org/cas-data/cas-registry).

## Measurement and remaining limits

Search Console baseline: 17 July–14 October, 6,364 impressions, 96 clicks, 1.51% CTR, average position 38.72. Retained affected-page and query reports for comparison. Evaluate impressions, position and CTR for the same pages and queries after recrawling, using equal windows and separating Kenyan commercial searches from broad international informational traffic. A 28-day comparison ending 14 November can use 18 October–14 November versus 20 September–17 October once data is complete. Do not attribute a change to this release from a single daily observation.

The identified on-site content issues have been addressed; the effect on rankings is not yet measurable. Backlinks, competitor authority and Google Business Profile access were not established as causes in this audit. No external outreach, link purchases, reviews, certifications or business credentials were fabricated. Existing manufacturer-grade claims, product specifications and non-targeted technical copy still need actual supplier/company documentation for independent verification. Saved enquiry notifications still use the console email backend, as previously reported; this content release does not activate outbound email or analytics.

## Evidence and rollback

Evidence is under `.work/2026-10-17/ranking/`: `content-patch.json`, `rollback-content.json`, `apply-results.txt`, `crawl-after.json`, `content-check.json`, `browser-result.txt`, screenshots, `sitemap-submission.txt`, and `search-baseline.json`. The original content snapshot is `.work/2026-10-17/content-before.json`.

Frontend rollback image: `noks-pre-ranking-frontend:20261017`. The initial tag attempt failed because the preceding untagged image was unavailable after building. The rollback image was rebuilt successfully from the saved pre-release source, retaining the earlier 17 October SEO repairs. Current production image tag was not overwritten by the rollback build.

To roll back the frontend, tag `noks-pre-ranking-frontend:20261017` as `noks-chemical-frontend`, then run `docker compose up -d --no-deps --no-build frontend`.

Content rollback script: `.work/2026-10-17/ranking/rollback-content.py`; it reads `/tmp/noks-ranking-rollback-20261017.json` in the backend container (also retained locally as `ranking/rollback-content.json`). Default execution only checks preconditions; this dry run passed after release. Set `NOKS_ROLLBACK_RANKING=1` only when restoration is intended. It refuses to overwrite any newer content, restores only edited fields and relationships in a transaction, records real restoration timestamps, and invalidates the frontend cache. No full database restore is needed.
