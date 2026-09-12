import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CLAIMS, toE164, unverifiedClaims } from "@/lib/business";

const REPO = path.resolve(__dirname, "../..");

/**
 * Repo-wide greps for the exact strings the audit found in production output.
 *
 * These are the cheapest possible regression guard: they cannot tell you the
 * site is right, but they fail the moment a specific known defect is
 * reintroduced anywhere — including in a component nobody thought to test.
 *
 * Comments are excluded, because several of these strings are quoted in the
 * comments that explain why they must not be emitted.
 */
function grep(pattern: string): string[] {
  try {
    const out = execFileSync(
      "grep",
      [
        "-rn",
        "--binary-files=without-match",
        "--exclude-dir=node_modules",
        "--exclude-dir=.next",
        "--exclude-dir=.git",
        "--exclude-dir=__pycache__",
        "--exclude-dir=docs",
        "--exclude-dir=tests",
        "--exclude=*.log",
        "--exclude=package-lock.json",
        "--exclude=tsconfig.tsbuildinfo",
        "-e",
        pattern,
        REPO,
      ],
      { encoding: "utf8" },
    );
    return out
      .split("\n")
      .filter(Boolean)
      // Drop comment lines — //, #, * and JSX {/* */}.
      .filter((line) => {
        const code = line.slice(line.indexOf(":", line.indexOf(":") + 1) + 1).trim();
        return !/^(\/\/|#|\*|\/\*|\{\/\*)/.test(code);
      });
  } catch (error) {
    // grep exits 1 when nothing matched, which is the passing case.
    if ((error as { status?: number }).status === 1) return [];
    throw error;
  }
}

describe("defects that must never reappear anywhere in the repository", () => {
  it("has no placeholder phone number", () => {
    expect(grep("254 ?700 ?000 ?000")).toEqual([]);
  });

  it("has no malformed /https:// URL construction", () => {
    // `https://chemicals.noksindustrial.com/https://res.cloudinary.com/...`
    expect(grep("noksindustrial\\.com/https://")).toEqual([]);
  });

  it("has no doubled brand suffix", () => {
    expect(grep("NOKS Chemical Division | NOKS Chemical Division")).toEqual([]);
  });

  it("does not use the retired duplicate slugs as a value outside the redirect table", () => {
    for (const slug of ["caustic-soda-flakes-2", "water-treatment-chemicals-2"]) {
      const hits = grep(slug)
        .filter((line) => !line.includes("redirects.mjs"))
        // Both slugs are named in prose that explains why they are gone. A
        // slug inside backticks is documentation; a slug inside a string
        // literal is a URL we might still emit, which is the thing to catch.
        .filter((line) => new RegExp(`["']([^"']*/)?${slug}`).test(line));
      expect(hits, `${slug} is still used as a value`).toEqual([]);
    }
  });

  it("never links to a parameter URL where a clean route exists", () => {
    // Internal links must point at the canonical URL, not at a noindex facet.
    const hits = grep("/products\\?category=").concat(grep("/knowledge\\?category="));
    // The knowledge index's own filter rail is the one legitimate case: it is
    // the control that produces the filtered view.
    const unexpected = hits.filter((line) => !line.includes("knowledge/page.tsx"));
    expect(unexpected).toEqual([]);
  });
});

describe("the claims gate", () => {
  it("ships with nothing verified, so an unreviewed claim cannot slip out", () => {
    expect(unverifiedClaims().sort()).toEqual(Object.keys(CLAIMS).sort());
  });

  it("says what each claim asserts and what would unlock it", () => {
    for (const [id, claim] of Object.entries(CLAIMS)) {
      expect(claim.asserts.length, `${id}.asserts`).toBeGreaterThan(10);
      expect(claim.needs.length, `${id}.needs`).toBeGreaterThan(10);
    }
  });
});

describe("phone normalisation", () => {
  it("converts the configured Kenyan local format to E.164", () => {
    expect(toE164("0142998027")).toBe("+254142998027");
    expect(toE164("0142 998 027")).toBe("+254142998027");
  });

  it("passes an already-E.164 number through", () => {
    expect(toE164("+254142998027")).toBe("+254142998027");
  });

  it("returns null rather than guessing at something unparseable", () => {
    for (const bad of ["", "   ", "call us", "0", "0123", "+", "+12"]) {
      expect(toE164(bad), bad).toBeNull();
    }
  });

  it("never invents digits", () => {
    expect(toE164("0142998027")).toContain("142998027");
  });
});
