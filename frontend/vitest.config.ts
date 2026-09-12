import path from "node:path";

import { defineConfig } from "vitest/config";

// The app reads every environment value through src/lib/site.ts, which resolves
// at module load. Tests therefore need these set *before* any src/ module is
// imported, which is what `env` here guarantees.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NEXT_PUBLIC_SITE_URL: "https://chemicals.noksindustrial.com",
      NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1",
      NEXT_PUBLIC_IMAGE_DOMAINS: "chemicals.noksindustrial.com,res.cloudinary.com",
      NEXT_PUBLIC_BRAND_NAME: "NOKS",
      NEXT_PUBLIC_BRAND_DIVISION: "Chemical Division",
    },
    // The live-site crawl suite (tests/live/) hits a running deployment and is
    // opt-in: `npm run test:live`. Keeping it out of the default run means
    // `npm test` stays hermetic and usable in CI without a deployed backend.
    exclude: ["node_modules/**", "tests/live/**"],
  },
});
