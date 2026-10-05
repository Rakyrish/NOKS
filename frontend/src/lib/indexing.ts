/**
 * The single place that decides whether a URL may be indexed, and what it
 * canonicalises to.
 *
 * The rules, and why they are these rules, are written up for humans in
 * `docs/url-indexing-policy.md`. This module is the executable copy — every
 * route's `generateMetadata` and the XML sitemap both read it, so the two can
 * never disagree about a URL the way they used to:
 *
 *   • `/products?category=…`, `/products?grade=…&availability=…&page=…` and
 *     `/quote?product=…` all declared themselves `index, follow` while
 *     canonicalising to `/products` — an unbounded facet space asking to be
 *     indexed.
 *   • `/products?q=…` was the only shape anyone had thought to exclude.
 *
 * The shape of the fix matters. Filter URLs are `noindex, follow` rather than
 * `Disallow:` in robots.txt, because a crawler has to be able to *fetch* a page
 * to read its noindex — blocking it instead leaves the URL indexable by
 * reference and the directive unread. They stay crawlable so link equity keeps
 * flowing through to the product pages behind them.
 */

/** Routes that carry their own content and are always indexable when clean. */
const INDEXABLE_ROOTS = [
  "/",
  "/products",
  "/catalogue",
  "/categories",
  "/industries",
  "/knowledge",
  "/services",
  "/about",
  "/contact",
  "/quote",
] as const;

/**
 * Paths that never belong in the index, whatever their query string.
 *
 * `/compare` is a scratchpad keyed entirely off whatever slugs the visitor
 * ticked; `/admin` is login-walled. Neither has a stable, linkable meaning.
 */
const NEVER_INDEXABLE = ["/compare", "/admin"] as const;

/**
 * Query keys that change *which* products are shown, i.e. produce a filtered
 * view of a page that already exists in its own right.
 *
 * `page` is here deliberately. Every product has its own URL in the sitemap and
 * is linked from its category, so paginated slices add no discovery value —
 * they only add near-duplicate URLs. `follow` still applies, so crawling
 * through them costs nothing.
 */
const FILTER_KEYS = new Set([
  "q",
  "category",
  "industry",
  "manufacturer",
  "grade",
  "availability",
  "cas_number",
  "package_size",
  "application",
  "ordering",
  "sort",
  "page",
  "product",
  "products",
  "slugs",
]);

export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

const keysOf = (params: SearchParamsInput): string[] => {
  if (!params) return [];
  if (params instanceof URLSearchParams) return [...params.keys()];
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key]) => key);
};

/** Strip the query, the fragment and any trailing slash. */
export function cleanPath(path: string): string {
  const withoutQuery = (path || "/").split(/[?#]/)[0] || "/";
  const rooted = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return rooted.replace(/\/+$/, "") || "/";
}

/** True when any recognised filter/sort/search/pagination key is present. */
export function isFilteredUrl(params: SearchParamsInput): boolean {
  return keysOf(params).some((key) => FILTER_KEYS.has(key));
}

export type IndexingDecision = {
  /** Site-relative canonical path — always the clean form of the route. */
  canonicalPath: string;
  /** `true` when the page must render `noindex, follow`. */
  noindex: boolean;
  /** Human-readable reason, surfaced by the regression tests on failure. */
  reason: string;
};

/**
 * Decide the robots directive and canonical for a request.
 *
 * `entityNoindex` carries the CMS `noindex` flag for the product/category/
 * article being rendered, so an editor's decision always wins over the
 * URL-shape rules.
 */
export function indexingFor(
  path: string,
  params?: SearchParamsInput,
  entityNoindex = false,
): IndexingDecision {
  const canonicalPath = cleanPath(path);

  if (entityNoindex) {
    return { canonicalPath, noindex: true, reason: "marked noindex in the CMS" };
  }
  if (NEVER_INDEXABLE.some((prefix) => canonicalPath === prefix || canonicalPath.startsWith(`${prefix}/`))) {
    return { canonicalPath, noindex: true, reason: "route is never indexable" };
  }
  if (isFilteredUrl(params)) {
    // Canonical points at the clean route, not at a "best guess" clean
    // equivalent: /products?category=x and /categories/x show the same
    // products, but pointing the canonical at a category slug we have not
    // verified exists would canonicalise a live page onto a 404. Internal
    // links go straight to /categories/x instead (see the internal-link
    // report), so these URLs stop being linked at all.
    return {
      canonicalPath,
      noindex: true,
      reason: "filtered, sorted, searched or paginated view of a canonical route",
    };
  }
  return { canonicalPath, noindex: false, reason: "clean canonical route" };
}

/** Whether a clean path is one of the route families we publish at all. */
export function isKnownRoute(path: string): boolean {
  const clean = cleanPath(path);
  return INDEXABLE_ROOTS.some(
    (root) => clean === root || (root !== "/" && clean.startsWith(`${root}/`)),
  );
}
