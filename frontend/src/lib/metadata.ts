/**
 * One builder for every page's `<head>`.
 *
 * Before this existed each route assembled title / description / canonical /
 * OG / Twitter by hand and they drifted:
 *
 *   • The root layout set `title.template = "%s | NOKS Chemical Division"`
 *     while 56 CMS rows already ended their `meta_title` with the same string,
 *     so live pages served
 *     "Disinfectants Suppliers Kenya | NOKS Chemical Division | NOKS Chemical Division".
 *   • Routes that returned only `{ title: "Product not found" }` inherited the
 *     root layout's `alternates: { canonical: "/" }`, putting a *homepage*
 *     canonical on soft-404s.
 *   • Open Graph was set on some routes, Twitter on none below the root.
 *
 * Every indexable route now goes through `pageMetadata()`, and the two
 * non-indexable shapes go through `notFoundMetadata()` / `noindexMetadata()`.
 */

import type { Metadata } from "next";

import { absoluteImageUrl } from "./images";
import { cleanPath, indexingFor, type SearchParamsInput } from "./indexing";
import { absoluteUrl, brand, seo } from "./site";

/** Longest title Google will usually render before truncating. Advisory. */
export const TITLE_SOFT_LIMIT = 60;
const DESCRIPTION_SOFT_LIMIT = 165;

/**
 * Title builders, shaped by what Kenyan buyers actually type.
 *
 * Google's Kenya autocomplete (gl=ke, sampled 2026-10-05) is consistent across
 * products: "<product> price in kenya" first, then "<product> suppliers in
 * kenya", "where to buy <product> in kenya"; for groups, "<group> suppliers in
 * kenya" and "chemical suppliers in nairobi". The old titles matched none of
 * it — 168 of 182 product titles were spec lines ("Caustic Soda Flakes NaOH
 * 1310-73-2 Industrial Grade") with no place in them, and category titles
 * rendered lower-case CMS names ("cleaning and disinfectants Suppliers in
 * Kenya").
 *
 * Products are quote-only, so titles say "Get Price" (true: the page is where
 * you get one) rather than "Price in Kenya" (which would promise a figure the
 * page does not show).
 */

/** Longest title we aim for, *including* the brand suffix. */
const TITLE_TARGET = TITLE_SOFT_LIMIT;

/** "… in Kenya", "… across East Africa": an authored title already aimed at a market. */
const MARKET_PHRASE = /\b(in|across)\s+(kenya|nairobi|mombasa|east africa|uganda|tanzania)\b/i;

const market = (country?: string | null) => country || "Kenya";

/** Room left for the page's own words once the shortest brand suffix is added. */
const fits = (title: string) => title.length + ` | ${brand.name}`.length <= TITLE_TARGET;

/** First candidate that fits the SERP width, or the last (shortest) one. */
const firstThatFits = (candidates: string[]) =>
  candidates.find(fits) ?? candidates[candidates.length - 1];

/** A CMS title is honoured only when an editor has already aimed it at a market. */
const authoredForMarket = (cmsTitle?: string | null) => {
  // Drop any brand the editor typed so `withBrand` can re-add the length that
  // fits — CMS rows ending "| NOKS Chemical Division" ran to 76 characters.
  const authored = (cmsTitle ?? "")
    .trim()
    .replace(new RegExp(`\\s*[|·—–-]\\s*(${escapeRegExp(brand.fullName)}|${escapeRegExp(brand.name)})\\s*$`, "i"), "")
    .trim();
  return authored && MARKET_PHRASE.test(authored) ? authored : null;
};

/** Product page: "Caustic Soda Flakes Supplier in Kenya — Get Price". */
export function productTitle(name: string, cmsTitle?: string | null, country?: string | null): string {
  const authored = authoredForMarket(cmsTitle);
  if (authored) return authored;
  const clean = name.trim();
  const where = market(country);
  return firstThatFits([
    `${clean} Supplier in ${where} — Get Price`,
    `${clean} Supplier in ${where}`,
    `${clean} in ${where}`,
  ]);
}

/** Category page: "Water Treatment Chemicals Suppliers in Kenya". */
export function categoryTitle(name: string, cmsTitle?: string | null, country?: string | null): string {
  const authored = authoredForMarket(cmsTitle);
  if (authored) return authored;
  const clean = name.trim();
  const where = market(country);
  return firstThatFits([`${clean} Suppliers in ${where}`, `${clean} in ${where}`]);
}

/**
 * Industry page: "Chemicals for Water Treatment in Kenya".
 *
 * Deliberately a different shape from the category title. /industries/water-
 * treatment and /categories/water-treatment-chemicals would otherwise both be
 * "Water Treatment Chemicals … in Kenya" and compete for one query. The CMS
 * titles on industries were all the same seeded template
 * ("<Industry> Chemicals in Kenya | NOKS Chemical Division"), so they are not
 * honoured here.
 */
export function industryTitle(name: string, country?: string | null): string {
  const clean = name.trim();
  const where = market(country);
  return firstThatFits([`Chemicals for ${clean} in ${where}`, `${clean} Chemicals in ${where}`]);
}

/**
 * Append the brand exactly once, as long as the SERP has room for.
 *
 * Accepts a title that already carries the brand (CMS-authored `meta_title`
 * values commonly do) and leaves it alone. Matching is done on the brand name
 * rather than the full "NOKS Chemical Division" string so that
 * "… | NOKS" — which is what a few category rows use — also counts as already
 * branded and is not doubled up.
 *
 * The full "| NOKS Chemical Division" is 25 characters: on a 60-character
 * title it pushed most of the page's own words past Google's cut-off. It is
 * used when it fits; otherwise the short "| NOKS". Google shows the site name
 * separately (from the WebSite schema) either way.
 */
export function withBrand(title: string): string {
  const clean = title.trim().replace(/\s*[|·—–-]\s*$/, "");
  if (!clean) return brand.fullName;

  const brandNames = [brand.fullName, brand.name].filter(Boolean);
  const alreadyBranded = brandNames.some((name) =>
    new RegExp(`(^|[|·—–])\\s*${escapeRegExp(name)}\\s*$`, "i").test(clean),
  );
  if (alreadyBranded) return clean;
  const full = `${clean} | ${brand.fullName}`;
  return full.length <= TITLE_TARGET ? full : `${clean} | ${brand.name}`;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Collapse whitespace and trim to a length a SERP snippet can actually use. */
export function normalizeDescription(value: string | null | undefined): string | undefined {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  if (clean.length <= DESCRIPTION_SOFT_LIMIT) return clean;
  const cut = clean.slice(0, DESCRIPTION_SOFT_LIMIT);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\s]+$/, "")}…`;
}

export type PageMetadataInput = {
  /** Page title WITHOUT the brand — `withBrand` adds it if it is missing. */
  title: string;
  description?: string | null;
  /** Site-relative canonical path, e.g. `/products/caustic-soda-flakes`. */
  path: string;
  /**
   * A CMS `canonical_url` override. Only honoured when it is a real URL on this
   * site; a stale or cross-origin value falls back to the self-referencing
   * canonical rather than pointing search engines somewhere else.
   */
  canonicalOverride?: string | null;
  keywords?: string[] | string | null;
  /** Raw image value from the API (absolute Cloudinary URL or local path). */
  image?: string | null;
  imageAlt?: string;
  ogType?: "website" | "article";
  /**
   * The request's query string. Passing it lets `pageMetadata` apply the
   * site's indexing policy (lib/indexing.ts) rather than each route
   * re-deciding what counts as a filtered view — which is how
   * `/products?category=…` ended up declaring itself indexable while
   * `/products?q=…` did not.
   */
  searchParams?: SearchParamsInput;
  /** Force `noindex,follow` regardless of URL shape (e.g. a CMS flag). */
  noindex?: boolean;
  article?: { publishedTime?: string; modifiedTime?: string; authors?: string[] };
};

/**
 * The site-wide default social image: the generated OG card at
 * `app/opengraph-image.tsx`. Used whenever a page has no image of its own, so
 * every share surface has something rather than falling back to nothing.
 */
const DEFAULT_OG_IMAGE = "/opengraph-image";

export function pageMetadata(input: PageMetadataInput): Metadata {
  const title = withBrand(input.title);
  const description = normalizeDescription(input.description) ?? normalizeDescription(seo.description);

  const decision = indexingFor(input.path, input.searchParams, input.noindex);
  const canonicalPath = decision.canonicalPath;
  const canonical = resolveCanonical(input.canonicalOverride, canonicalPath);

  const socialImage = absoluteImageUrl(input.image) ?? absoluteUrl(DEFAULT_OG_IMAGE);
  const images = [{ url: socialImage, alt: input.imageAlt || title }];

  return {
    title: {
      // `absolute` bypasses the root layout's `%s | <brand>` template. The
      // template is what double-appended the brand; `withBrand` above is now
      // the single place the brand is added.
      absolute: title,
    },
    description,
    keywords: normalizeKeywords(input.keywords),
    alternates: { canonical },
    robots: decision.noindex
      ? // follow, always: a crawler must be able to read this page's links and
        // its noindex. Blocking it in robots.txt instead would leave the URL
        // indexable-by-reference and the directive unread.
        { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true },
    openGraph: {
      type: input.ogType ?? "website",
      locale: seo.locale,
      siteName: brand.fullName,
      title,
      description,
      url: absoluteUrl(canonicalPath),
      images,
      ...(input.article ?? {}),
    },
    twitter: {
      card: "summary_large_image",
      site: seo.twitterHandle || undefined,
      title,
      description,
      images: [socialImage],
    },
  };
}

/**
 * Metadata for a route whose entity does not exist.
 *
 * Belt and braces with `app/(site)/not-found.tsx`. When the page body calls
 * `notFound()`, Next renders the not-found boundary and that file's metadata
 * export is what ships — but `generateMetadata` has already run, and a route
 * that returned a bare `{ title }` inherited the root layout's homepage
 * canonical and its `index, follow`. Whichever of the two Next resolves, the
 * answer is the same: no canonical, `noindex, follow`.
 *
 * `canonical: null` rather than a self-reference — a page that does not exist
 * is not the canonical version of anything, and pointing one at the homepage
 * (the previous behaviour) tells Google the two URLs are the same document.
 *
 * `path` is unused in the output and kept for the call site's readability and
 * for the regression tests, which assert every dynamic route passes the
 * requested path here rather than guessing.
 */
export function notFoundMetadata(path: string, label = "Page"): Metadata {
  void normalizeCanonicalPath(path);
  return {
    title: { absolute: `${label} not found | ${brand.fullName}` },
    description: undefined,
    alternates: { canonical: null },
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: null,
    twitter: null,
  };
}

/** Shorthand for a real page that must simply stay out of the index. */
export const noindexMetadata = (input: Omit<PageMetadataInput, "noindex">): Metadata =>
  pageMetadata({ ...input, noindex: true });

/**
 * Strip query strings, fragments and trailing slashes so a canonical is always
 * the one clean form of the URL. `/products/x/?a=1` and `/products/x` must not
 * canonicalise differently.
 */
export const normalizeCanonicalPath = cleanPath;

/**
 * Honour a CMS canonical override only when it is same-origin and parseable.
 *
 * A cross-origin or malformed `canonical_url` in the database would otherwise
 * hand ranking signals to another site, or emit an invalid tag, with no
 * validation anywhere in the pipeline.
 */
function resolveCanonical(override: string | null | undefined, fallbackPath: string): string {
  const raw = (override ?? "").trim();
  if (raw) {
    if (raw.startsWith("/")) return normalizeCanonicalPath(raw);
    try {
      const url = new URL(raw);
      if (url.origin === new URL(absoluteUrl("/")).origin) {
        return normalizeCanonicalPath(url.pathname);
      }
    } catch {
      /* fall through to the self-referencing canonical */
    }
  }
  return fallbackPath;
}

function normalizeKeywords(value: string[] | string | null | undefined): string[] | undefined {
  const list = Array.isArray(value) ? value : (value ?? "").split(",");
  const clean = list.map((item) => item.trim()).filter(Boolean);
  return clean.length ? [...new Set(clean)] : undefined;
}
