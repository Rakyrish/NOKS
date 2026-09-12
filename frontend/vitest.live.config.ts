import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * The crawl suite. Opt-in, because it needs a running deployment.
 *
 *   npm run build && npm start
 *   LIVE_BASE_URL=http://localhost:3000 npm run test:live
 *
 * Kept out of `npm test` so the default run stays hermetic and usable in CI
 * without a backend. These are the checks that cannot be made against modules
 * alone: an HTTP status, a redirect chain, a `<link rel=canonical>` in served
 * HTML, whether a Cloudinary URL actually resolves.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/live/**/*.test.ts"],
    // A full sitemap crawl is a few hundred sequential requests.
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
});
