import { beforeAll, describe, expect, it } from "vitest";

const BASE = (process.env.LIVE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** The origin the built app believes it is, used for canonical comparisons. */
const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chemicals.noksindustrial.com"
).replace(/\/$/, "");

const toLocal = (url: string) => url.replace(SITE, BASE);

type Page = { status: number; html: string; url: string; redirected: boolean };

async function fetchPage(pathOrUrl: string, redirect: RequestRedirect = "follow"): Promise<Page> {
  const url = pathOrUrl.startsWith("http") ? toLocal(pathOrUrl) : `${BASE}${pathOrUrl}`;
  const response = await fetch(url, { redirect });
  return {
    status: response.status,
    html: redirect === "manual" ? "" : await response.text(),
    url: response.url,
    redirected: response.redirected,
  };
}

const meta = (html: string, name: string) =>
  html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, "i"))?.[1] ?? null;

const canonicalOf = (html: string) =>
  html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)?.[1] ?? null;

const titleOf = (html: string) => html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;

const h1sOf = (html: string) => html.match(/<h1[\s>]/gi)?.length ?? 0;

/** Parse <loc> values out of the XML sitemap. */
function locsFrom(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

let sitemapUrls: string[] = [];

beforeAll(async () => {
  const response = await fetch(`${BASE}/sitemap.xml`);
  expect(response.status, "sitemap.xml must be served").toBe(200);
  sitemapUrls = locsFrom(await response.text());
  expect(sitemapUrls.length, "sitemap must not be empty").toBeGreaterThan(20);
}, 120_000);

describe("every sitemap URL is one Google can index", () => {
  it("is absolute, https and on our own origin", () => {
    for (const url of sitemapUrls) {
      expect(url.startsWith(`${SITE}/`) || url === SITE, url).toBe(true);
      // The malformed-URL regression, at the sitemap level.
      expect(url, url).not.toContain(`${SITE}/https://`);
      expect(url.match(/https?:\/\//g)?.length, url).toBe(1);
    }
  });

  it("carries no query strings or duplicates", () => {
    for (const url of sitemapUrls) expect(url, url).not.toContain("?");
    expect(new Set(sitemapUrls).size, "duplicate <loc> entries").toBe(sitemapUrls.length);
  });

  it("returns 200, does not redirect, is indexable and self-canonical", async () => {
    const failures: string[] = [];

    for (const url of sitemapUrls) {
      const page = await fetchPage(url, "manual");
      if (page.status !== 200) {
        failures.push(`${url} → HTTP ${page.status}`);
        continue;
      }
      const full = await fetchPage(url);
      const robots = meta(full.html, "robots") ?? "";
      if (/noindex/i.test(robots)) failures.push(`${url} → noindex ("${robots}")`);

      const canonical = canonicalOf(full.html);
      if (!canonical) {
        failures.push(`${url} → no canonical tag`);
      } else if (canonical.replace(/\/$/, "") !== url.replace(/\/$/, "")) {
        failures.push(`${url} → canonicalises to ${canonical}`);
      }
    }

    expect(failures.join("\n")).toBe("");
  });
});

describe("missing pages return a genuine 404", () => {
  // Both were live soft-404s: HTTP 200, "Product not found" in the title, and
  // a canonical pointing at the homepage.
  const missing = [
    "/products/xanthan-gum-food-grade",
    "/products/this-product-does-not-exist",
    "/categories/no-such-category",
    "/industries/no-such-industry",
    "/knowledge/no-such-article",
  ];

  it.each(missing)("%s is HTTP 404", async (path) => {
    const page = await fetchPage(path);
    expect(page.status).toBe(404);
  });

  it.each(missing)("%s is noindex and does not canonicalise to the homepage", async (path) => {
    const page = await fetchPage(path);
    expect(meta(page.html, "robots") ?? "").toMatch(/noindex/i);
    const canonical = canonicalOf(page.html);
    expect(canonical, `${path} canonicalises to ${canonical}`).not.toBe(`${SITE}/`);
    expect(canonical).not.toBe(SITE);
  });
});

describe("redirects are single-hop and permanent", () => {
  const rules = [
    ["/products/caustic-soda-flakes-2", "/products/caustic-soda-flakes"],
    ["/categories/water-treatment-chemicals-2", "/categories/water-treatment-chemicals"],
  ];

  it.each(rules)("%s → %s in one hop", async (from, to) => {
    const first = await fetch(`${BASE}${from}`, { redirect: "manual" });
    expect([301, 308]).toContain(first.status);

    const location = first.headers.get("location")!;
    expect(location.replace(SITE, "")).toBe(to);

    // The destination must itself be a 200, not another redirect.
    const second = await fetch(`${BASE}${to}`, { redirect: "manual" });
    expect(second.status, `${to} is not a terminal 200`).toBe(200);
  });
});

describe("filtered and prefilled URLs follow the indexing policy", () => {
  const filtered = [
    "/products?category=water-treatment-chemicals",
    "/products?q=caustic",
    "/products?grade=food&availability=in_stock",
    "/products?page=2",
    "/knowledge?category=water-treatment",
    "/quote?product=calcium-propionate",
    "/compare?slugs=acetone,acetone-technical-grade",
  ];

  it.each(filtered)("%s is noindex, follow and canonicalises to the clean route", async (path) => {
    const page = await fetchPage(path);
    expect(page.status).toBe(200);

    const robots = meta(page.html, "robots") ?? "";
    expect(robots).toMatch(/noindex/i);
    // `follow`, so a crawler still reaches the products behind the facet — and
    // so it can read this very directive.
    expect(robots).not.toMatch(/nofollow/i);

    expect(canonicalOf(page.html)).toBe(`${SITE}${path.split("?")[0]}`);
  });

  it("robots.txt does not block the pages carrying those directives", async () => {
    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    for (const path of filtered) {
      const route = path.split("?")[0];
      expect(robots, `${route} is Disallowed, so its noindex can never be read`).not.toMatch(
        new RegExp(`Disallow:\\s*${route}\\s*$`, "m"),
      );
    }
  });
});

describe("rendered HTML hygiene", () => {
  const routes = [
    "/",
    "/products",
    "/products/caustic-soda-flakes",
    "/products/calcium-propionate",
    "/products/soda-ash-dense-sodium-carbonate",
    "/categories/water-treatment-chemicals",
    "/industries/water-treatment",
    "/knowledge",
    "/knowledge/safe-storage-and-handling-of-industrial-acids",
    "/knowledge/food-grade-vs-industrial-grade-chemicals-what-actually-differs",
    "/about",
    "/contact",
    "/quote",
  ];

  it.each(routes)("%s has exactly one H1", async (path) => {
    const page = await fetchPage(path);
    expect(page.status).toBe(200);
    expect(h1sOf(page.html)).toBe(1);
  });

  it.each(routes)("%s has a non-empty title with the brand once", async (path) => {
    const title = titleOf((await fetchPage(path)).html) ?? "";
    expect(title.trim().length).toBeGreaterThan(10);
    expect(title).not.toContain("NOKS Chemical Division | NOKS Chemical Division");
  });

  it.each(routes)("%s has a meta description", async (path) => {
    const description = meta((await fetchPage(path)).html, "description") ?? "";
    expect(description.trim().length).toBeGreaterThan(20);
  });

  it.each(routes)("%s emits no malformed /https:// URL", async (path) => {
    const { html } = await fetchPage(path);
    expect(html).not.toContain(`${SITE}/https://`);
    expect(html).not.toContain("/https%3A%2F%2F");
  });

  it("titles are unique across indexable routes", async () => {
    const seen = new Map<string, string>();
    for (const path of routes) {
      const title = titleOf((await fetchPage(path)).html) ?? "";
      const clash = seen.get(title);
      expect(clash, `${path} and ${clash} share the title "${title}"`).toBeUndefined();
      seen.set(title, path);
    }
  });
});

describe("every image URL the site publishes actually resolves", () => {
  const routes = [
    "/products/calcium-propionate",
    "/products/caustic-soda-flakes",
    "/categories/water-treatment-chemicals",
    "/",
  ];

  it.each(routes)("%s: JSON-LD images are fetchable", async (path) => {
    const { html } = await fetchPage(path);
    const blocks = [...html.matchAll(
      /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    )].map((match) => match[1]);

    const urls = new Set<string>();
    for (const block of blocks) {
      for (const match of block.matchAll(/"(https?:\/\/[^"]+?\.(?:jpe?g|png|webp|avif|svg)[^"]*)"/g)) {
        urls.add(match[1]);
      }
      // Cloudinary delivery URLs frequently carry no file extension.
      for (const match of block.matchAll(/"(https:\/\/res\.cloudinary\.com\/[^"]+)"/g)) {
        urls.add(match[1]);
      }
    }

    for (const url of urls) {
      expect(url, `${url} is malformed`).not.toContain(`${SITE}/https://`);
      const response = await fetch(toLocal(url), { method: "GET" });
      expect(response.status, `${url} → HTTP ${response.status}`).toBe(200);
    }
  });
});
