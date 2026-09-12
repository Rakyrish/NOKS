/**
 * The one place a raw image value from the API becomes a URL we are willing to
 * publish.
 *
 * Two helpers existed before this file and they disagreed:
 *
 *   • `mediaUrl()` (lib/utils.ts) returned absolute values untouched — correct,
 *     and why the pictures rendered for humans.
 *   • `absoluteUrl()` (lib/site.ts) assumed a site-relative path and blindly
 *     prefixed the origin — which is how Product and Article JSON-LD ended up
 *     publishing
 *     `https://chemicals.noksindustrial.com/https://res.cloudinary.com/...`
 *     on every product with a photo.
 *
 * Product images ride Cloudinary (`MediaCloudinaryStorage`, see backend
 * settings), so `ProductImage.image.url` is already a fully-qualified
 * `https://res.cloudinary.com/...`. Anything that resolves an image must
 * therefore be prepared for a value that is *already* absolute. That is the
 * single rule the old code was missing, and it is enforced here rather than
 * left to each caller to remember.
 */

import { siteUrl } from "./site";

/**
 * Remote hosts we will emit an image URL for.
 *
 * Mirrors `images.remotePatterns` in next.config.mjs, which is built from the
 * same env var — an <Image> pointing at a host Next has not been told about
 * throws at render time, so the two lists must not drift. Anything else is
 * dropped rather than rendered: an unknown remote host in our own markup is
 * either a data error or an injection, and neither should reach a crawler.
 */
const ALLOWED_REMOTE_HOSTS: readonly string[] = (
  process.env.NEXT_PUBLIC_IMAGE_DOMAINS ??
  (() => {
    try {
      return (
        (JSON.parse(process.env.NEXT_PUBLIC_ENV_JSON || "{}") as Record<string, string>)
          .NEXT_PUBLIC_IMAGE_DOMAINS ?? ""
      );
    } catch {
      return "";
    }
  })()
)
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

/**
 * Local illustration shown when a product genuinely has no photograph.
 *
 * Display only. It is deliberately NOT fed to `productImageUrls()` — putting a
 * generic placeholder in Product JSON-LD tells Google "this is a photo of the
 * product", which it is not.
 */
export const IMAGE_PLACEHOLDER = "/images/placeholder-chemical.svg";

const isSafeAbsolute = (url: URL) => url.protocol === "https:" || url.protocol === "http:";

/**
 * Parse a raw API image value into a URL object, or null if it is not something
 * we are prepared to publish.
 *
 * Rejects: empty/whitespace, `data:`, `javascript:`, `mailto:` and every other
 * non-HTTP scheme, malformed values, and remote hosts outside the allowlist.
 * Accepts: absolute http(s) on an allowed host, protocol-relative `//host/…`
 * (read as https), and site-relative paths.
 */
function parseImageValue(value: string | null | undefined): URL | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  // A bare "//host/path" is a valid protocol-relative URL but `new URL` needs a
  // scheme to work with. Treat it as https rather than inheriting the base.
  const candidate = raw.startsWith("//") ? `https:${raw}` : raw;

  // Absolute? Parse standalone so the base can never be prepended to it. This
  // is the guard whose absence produced the `/https://` URLs.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      return null;
    }
    if (!isSafeAbsolute(url)) return null;
    if (!ALLOWED_REMOTE_HOSTS.includes(url.hostname.toLowerCase())) return null;
    return url;
  }

  // Relative. Resolve against the site origin so `new URL` does the percent
  // encoding for us; callers that want a path back read `pathname + search`.
  try {
    return new URL(candidate.startsWith("/") ? candidate : `/${candidate}`, `${siteUrl}/`);
  } catch {
    return null;
  }
}

/**
 * Source for `next/image` and plain `<img>`.
 *
 * Same-origin values come back as a path (so Next's optimiser treats them as
 * local); everything else comes back absolute. Percent-encoding is applied by
 * `URL`, which is what `next/image` needs — an unencoded space in a src is a
 * runtime error there, not a silent 404.
 *
 * Returns null when there is no usable image, so callers can decide between a
 * placeholder and rendering nothing.
 */
export function imageSrc(value: string | null | undefined): string | null {
  const url = parseImageValue(value);
  if (!url) return null;
  const origin = (() => {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return null;
    }
  })();
  return url.origin === origin ? `${url.pathname}${url.search}` : url.href;
}

/** `imageSrc()`, falling back to the local illustration. Display use only. */
export function imageSrcOrPlaceholder(value: string | null | undefined): string {
  return imageSrc(value) ?? IMAGE_PLACEHOLDER;
}

/**
 * Fully-qualified URL for structured data, Open Graph, Twitter cards and
 * sitemap image entries — the contexts where a relative path is meaningless.
 *
 * Never prefixes the origin onto a value that already carries one.
 */
export function absoluteImageUrl(value: string | null | undefined): string | null {
  return parseImageValue(value)?.href ?? null;
}

/**
 * Image list for Product / Article JSON-LD.
 *
 * Deduplicated, order preserved, unusable values dropped, and **no placeholder
 * substitution** — a product with no photograph must omit `image` entirely
 * rather than claim the generic illustration is product photography.
 * Returns undefined so it can be spread straight into a schema object.
 */
export function schemaImages(
  ...values: (string | null | undefined)[]
): string[] | undefined {
  const urls = values
    .map(absoluteImageUrl)
    .filter((url): url is string => url !== null);
  const unique = [...new Set(urls)];
  return unique.length ? unique : undefined;
}

/** True when the value would survive normalisation. Used by the audit tooling. */
export const isPublishableImage = (value: string | null | undefined): boolean =>
  parseImageValue(value) !== null;
