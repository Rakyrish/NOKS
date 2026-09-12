/**
 * Permanent redirects for URLs that used to resolve and no longer do.
 *
 * `.mjs` so `next.config.mjs` and the vitest suite can both read the same
 * array — a redirect that exists in the config but not in the test, or the
 * other way round, is how redirect chains and forgotten 404s start.
 *
 * Rules this file is held to (enforced in tests/redirects.test.ts):
 *
 *   1. **Single hop.** No `destination` may itself be a `source`.
 *   2. **A real replacement, or nothing.** A missing product is only redirected
 *      when the *same* product exists at another URL. A near-miss is not a
 *      replacement, and sending it to the homepage is a soft 404 with extra
 *      steps — Google treats a mass redirect to the homepage exactly like the
 *      404 it is hiding, and the visitor loses the "this page is gone" signal.
 *      Anything without a verified target is left to return a genuine 404.
 *   3. **Verified against the database**, not guessed from the slug.
 */

/**
 * @typedef {{ source: string, destination: string, permanent: boolean, note: string }} Redirect
 */

/** @type {Redirect[]} */
export const REDIRECTS = [
  {
    // Verified 2026-09-12: `caustic-soda-flakes` (id 36, published) is the only
    // Caustic Soda Flakes listing in the catalogue. The `-2` slug was never a
    // product — it is the shape SluggedModel.save() mints on a name collision,
    // so it is an old URL for this same product.
    source: "/products/caustic-soda-flakes-2",
    destination: "/products/caustic-soda-flakes",
    permanent: true,
    note: "Duplicate-slug artefact; sole Caustic Soda Flakes listing.",
  },
  {
    // Verified 2026-09-12: catalog.Category rows 'Water Treatment Chemicals'
    // and 'water treatment chemicals' both existed; migration 0006 merged them
    // onto `water-treatment-chemicals`, which holds 5 published products across
    // 4 subcategories. The `-2` row held none and is gone.
    source: "/categories/water-treatment-chemicals-2",
    destination: "/categories/water-treatment-chemicals",
    permanent: true,
    note: "Empty duplicate category merged by catalog migration 0006.",
  },
];

/**
 * Slugs that 404 and deliberately have no redirect, with the reason.
 *
 * Kept in code rather than in a comment so `tests/redirects.test.ts` can assert
 * we never quietly add one of them to REDIRECTS pointing at an unrelated
 * product, and so the "why is this still a 404?" question has an answer.
 *
 * @type {Record<string, string>}
 */
export const INTENTIONAL_404 = {
  "/products/xanthan-gum-food-grade":
    "No Xanthan Gum product exists in the catalogue (0 rows match 'xanthan', " +
    "verified 2026-09-12). There is no replacement to redirect to; sending it " +
    "to a different thickener or to the homepage would mislead the visitor. " +
    "If Xanthan Gum is stocked again, add the product and a redirect here.",
};

/** Next.js `redirects()` entries. */
export const nextRedirects = () =>
  REDIRECTS.map(({ source, destination, permanent }) => ({ source, destination, permanent }));
