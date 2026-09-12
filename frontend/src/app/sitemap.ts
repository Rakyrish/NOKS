import type { MetadataRoute } from "next";

import { api } from "@/lib/api";
import { cleanPath, indexingFor } from "@/lib/indexing";
import { REDIRECTS } from "@/lib/redirects.mjs";
import { absoluteUrl } from "@/lib/site";
import type { SitemapEntry } from "@/types";

// Generated per request, never prerendered. Two reasons:
//  1. Correctness — a sitemap baked at build time freezes the catalogue as it
//     was the moment the image was built, so every product and article added
//     afterwards stays invisible to crawlers until the next deploy.
//  2. Buildability — the call below is not wrapped in the api `safe()`
//     fallback, so during `next build` (where the backend container does not
//     exist yet) it would hang until Next's static-generation timeout and fail
//     the build outright.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Every URL in here must be publicly reachable, HTTP 200, canonical,
 * indexable, un-redirected and not a parameter variation.
 *
 * The previous sitemap met almost none of that. It listed 249 URLs assembled
 * by walking the browse API, which cannot see `noindex` or `canonical_url`,
 * and stamped `lastModified: new Date()` on all but the articles — telling
 * crawlers the entire catalogue changes on every fetch, which is a signal
 * Google learns to discard. It carried the duplicate
 * `water-treatment-chemicals-2` and all eighteen empty categories.
 *
 * Each exclusion below is enforced once, here, and asserted by
 * `tests/sitemap.test.ts`; the live crawl in `tests/live/` then fetches every
 * URL this produces and fails on a redirect, a non-200, a `noindex` or a
 * canonical pointing elsewhere.
 */

/** Sources that must never appear: anything we 301 away from. */
const REDIRECTED_PATHS = new Set(REDIRECTS.map((rule) => cleanPath(rule.source)));

type Rule = { changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number };

/**
 * Shared gate for a CMS-backed URL.
 *
 * Returns null — i.e. "leave it out" — when the entity declares itself
 * noindex, canonicalises somewhere else, is the source of a redirect, or the
 * site's own indexing policy says the path is not indexable.
 */
function entryFor(path: string, entry: SitemapEntry, rule: Rule, fallback: Date) {
  if (entry.noindex) return null;
  // A row that names a different canonical is a duplicate by the owner's own
  // declaration. Listing it asks Google to index a page we have told it to
  // ignore, which is the contradiction Search Console reports as
  // "Duplicate, Google chose different canonical than user".
  if (entry.canonical && cleanPath(entry.canonical.replace(/^https?:\/\/[^/]+/, "")) !== cleanPath(path)) {
    return null;
  }
  if (REDIRECTED_PATHS.has(cleanPath(path))) return null;
  if (indexingFor(path).noindex) return null;

  return {
    url: absoluteUrl(cleanPath(path)),
    // Real content timestamps, from `content_updated_at` — which only moves
    // when a field a reader would notice changes. Never the request time.
    lastModified: entry.lastmod ? new Date(entry.lastmod) : fallback,
    changeFrequency: rule.changeFrequency,
    priority: rule.priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Core business pages. `lastModified` is omitted rather than faked: these are
  // code-owned templates with no content timestamp to report, and an honest
  // absence beats a fabricated "today".
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      ["/", "weekly", 1],
      ["/products", "daily", 0.9],
      ["/quote", "monthly", 0.9],
      ["/industries", "monthly", 0.8],
      ["/services", "monthly", 0.8],
      ["/knowledge", "weekly", 0.8],
      ["/about", "monthly", 0.7],
      ["/contact", "monthly", 0.7],
    ] as const
  ).map(([path, changeFrequency, priority]) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));

  try {
    const inventory = await api.sitemapInventory();
    // Only used when a row somehow has no timestamp at all; every row gets one
    // from the 0009 backfill, so in practice this is unreachable.
    const fallback = new Date();

    const products = inventory.products.flatMap((entry) => {
      const row = entryFor(`/products/${entry.slug}`, entry, { changeFrequency: "weekly", priority: 0.8 }, fallback);
      return row ? [row] : [];
    });

    const categories = inventory.categories.flatMap((entry) => {
      // A category with nothing in it is a thin page competing with the
      // categories that do have stock. It stays crawlable and keeps its
      // `noindex, follow`; it just stops being advertised.
      if (entry.product_count === 0) return [];
      const row = entryFor(`/categories/${entry.slug}`, entry, { changeFrequency: "weekly", priority: 0.75 }, fallback);
      return row ? [row] : [];
    });

    const industries = inventory.industries.flatMap((entry) => {
      if (entry.product_count === 0) return [];
      const row = entryFor(`/industries/${entry.slug}`, entry, { changeFrequency: "monthly", priority: 0.75 }, fallback);
      return row ? [row] : [];
    });

    const posts = inventory.posts.flatMap((entry) => {
      const row = entryFor(`/knowledge/${entry.slug}`, entry, { changeFrequency: "monthly", priority: 0.7 }, fallback);
      return row ? [row] : [];
    });

    return [...staticRoutes, ...products, ...categories, ...industries, ...posts];
  } catch (error) {
    // A crawler hitting /sitemap.xml while the backend is briefly unreachable
    // should still get the core pages, not a 500 — the same "degrade, don't
    // fail" principle api.ts applies through `safe()`.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[sitemap] inventory unreachable, serving core routes only:", (error as Error).message);
    }
    return staticRoutes;
  }
}
