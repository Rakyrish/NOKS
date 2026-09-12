import { describe, expect, it } from "vitest";

import { cleanPath } from "@/lib/indexing";
import { INTENTIONAL_404, REDIRECTS, nextRedirects } from "@/lib/redirects.mjs";

describe("redirect hygiene", () => {
  const sources = new Set(REDIRECTS.map((rule) => cleanPath(rule.source)));

  it("never chains: no destination is itself a source", () => {
    // Google follows the first hop reliably and later hops grudgingly; a chain
    // leaks the link equity the redirect exists to preserve.
    for (const rule of REDIRECTS) {
      expect(sources.has(cleanPath(rule.destination))).toBe(false);
    }
  });

  it("never redirects to the homepage", () => {
    // A missing product sent to "/" is a soft 404 with extra steps: Google
    // treats it as the 404 it is hiding, and the visitor loses the signal that
    // the thing they wanted is gone.
    for (const rule of REDIRECTS) {
      expect(cleanPath(rule.destination)).not.toBe("/");
    }
  });

  it("is permanent, so the equity actually moves", () => {
    for (const rule of REDIRECTS) {
      expect(rule.permanent).toBe(true);
    }
  });

  it("has no self-redirects", () => {
    for (const rule of REDIRECTS) {
      expect(cleanPath(rule.source)).not.toBe(cleanPath(rule.destination));
    }
  });

  it("has no duplicate sources", () => {
    expect(sources.size).toBe(REDIRECTS.length);
  });

  it("documents why every rule exists", () => {
    for (const rule of REDIRECTS) {
      expect(rule.note.length).toBeGreaterThan(20);
    }
  });

  it("uses rooted, query-free paths on both sides", () => {
    for (const rule of REDIRECTS) {
      for (const path of [rule.source, rule.destination]) {
        expect(path.startsWith("/")).toBe(true);
        expect(path).not.toContain("?");
      }
    }
  });
});

describe("the specific URLs the audit found", () => {
  it("sends caustic-soda-flakes-2 to the one real listing", () => {
    const rule = REDIRECTS.find((r) => r.source === "/products/caustic-soda-flakes-2");
    expect(rule?.destination).toBe("/products/caustic-soda-flakes");
  });

  it("sends the duplicate category to the merged one", () => {
    const rule = REDIRECTS.find(
      (r) => r.source === "/categories/water-treatment-chemicals-2",
    );
    expect(rule?.destination).toBe("/categories/water-treatment-chemicals");
  });

  it("leaves xanthan-gum-food-grade as a genuine 404, with a reason", () => {
    // There is no Xanthan Gum product to redirect to. Pointing it at a
    // different thickener would be worse than the 404.
    expect(sourcesInclude("/products/xanthan-gum-food-grade")).toBe(false);
    expect(INTENTIONAL_404["/products/xanthan-gum-food-grade"]).toMatch(/no replacement|No Xanthan/i);
  });

  function sourcesInclude(path: string) {
    return REDIRECTS.some((rule) => cleanPath(rule.source) === cleanPath(path));
  }
});

describe("the Next.js adapter", () => {
  it("emits exactly the rules, minus the human note", () => {
    const emitted = nextRedirects();
    expect(emitted).toHaveLength(REDIRECTS.length);
    for (const rule of emitted) {
      expect(Object.keys(rule).sort()).toEqual(["destination", "permanent", "source"]);
    }
  });
});
