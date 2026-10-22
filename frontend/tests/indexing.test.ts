import { describe, expect, it } from "vitest";

import { cleanPath, indexingFor, isFilteredUrl } from "@/lib/indexing";

/**
 * The rules in docs/url-indexing-policy.md, asserted.
 *
 * Every case below was live and wrong before: each of these URLs served
 * `<meta name="robots" content="index, follow">` while canonicalising
 * somewhere else, which asks Google to index a page and then tells it the page
 * is a duplicate.
 */
describe("filtered, sorted and paginated URLs stay out of the index", () => {
  it("indexes industry pagination separately from search and filters", () => {
    expect(indexingFor("/industries/manufacturing", { page: "2" })).toMatchObject({ canonicalPath: "/industries/manufacturing?page=2", noindex: false });
    expect(indexingFor("/industries/manufacturing", { page: "2", q: "acetone" }).noindex).toBe(true);
  });
  const cases: [string, Record<string, string>][] = [
    ["/products", { category: "water-treatment-chemicals" }],
    ["/products", { industry: "mining" }],
    ["/products", { q: "caustic soda" }],
    ["/products", { grade: "food", availability: "in_stock", ordering: "name" }],
    ["/knowledge", { category: "water-treatment" }],
    ["/knowledge", { tag: "water", page: "2" }],
    ["/knowledge", { search: "acetone" }],
    ["/quote", { product: "calcium-propionate" }],
  ];

  it.each(cases)("%s with %o is noindex, follow", (path, params) => {
    const decision = indexingFor(path, params);
    expect(decision.noindex).toBe(true);
    // `follow` is implied by the policy and applied in lib/metadata.ts; what
    // matters here is that the canonical is the clean route, never the
    // parameterised one.
    expect(decision.canonicalPath).toBe(path);
  });

  it("leaves the clean route indexable", () => {
    for (const [path] of cases) {
      expect(indexingFor(path).noindex).toBe(false);
    }
  });

  it("ignores empty parameter values", () => {
    // `?category=` with no value is the clean page, not a filtered view.
    expect(indexingFor("/products", { category: "" }).noindex).toBe(false);
  });

  it("recognises a URLSearchParams as well as a plain object", () => {
    expect(isFilteredUrl(new URLSearchParams("category=acids"))).toBe(true);
    expect(isFilteredUrl(new URLSearchParams(""))).toBe(false);
  });
});

describe("routes that are never indexable", () => {
  it("excludes /compare whatever the query", () => {
    expect(indexingFor("/compare").noindex).toBe(true);
    expect(indexingFor("/compare", { slugs: "a,b" }).noindex).toBe(true);
  });

  it("excludes the staff panel", () => {
    expect(indexingFor("/admin").noindex).toBe(true);
    expect(indexingFor("/admin/products").noindex).toBe(true);
  });
});

describe("a CMS noindex flag always wins", () => {
  it("overrides an otherwise-clean route", () => {
    const decision = indexingFor("/products/calcium-propionate", undefined, true);
    expect(decision.noindex).toBe(true);
    expect(decision.reason).toContain("CMS");
  });
});

describe("canonical paths are one canonical form", () => {
  it("strips query, fragment and trailing slash", () => {
    // The trailing-slash variant of a product URL must not canonicalise
    // differently from the bare one.
    for (const input of [
      "/products/caustic-soda-flakes/",
      "/products/caustic-soda-flakes?utm_source=x",
      "/products/caustic-soda-flakes#specs",
      "/products/caustic-soda-flakes///",
    ]) {
      expect(cleanPath(input)).toBe("/products/caustic-soda-flakes");
    }
  });

  it("keeps the root as /", () => {
    expect(cleanPath("/")).toBe("/");
    expect(cleanPath("")).toBe("/");
    expect(cleanPath("//")).toBe("/");
  });

  it("roots a path that arrives without a leading slash", () => {
    expect(cleanPath("products/x")).toBe("/products/x");
  });
});

describe("genuine pagination", () => {
  it("self-canonicalises page two and leaves it indexable", () => {
    expect(indexingFor("/products", { page: "2" })).toMatchObject({ canonicalPath: "/products?page=2", noindex: false });
    expect(indexingFor("/products", { page: "1" }).canonicalPath).toBe("/products");
  });
  it("keeps search and filter pagination separate", () => {
    expect(indexingFor("/products", { page: "2", q: "acetone" }).noindex).toBe(true);
    expect(indexingFor("/products", { page: "0" }).noindex).toBe(true);
  });
});
