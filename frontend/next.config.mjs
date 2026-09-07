import path from "node:path";

import dotenv from "dotenv";

// The whole stack reads ONE .env, at the repo root — never a local copy.
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

/** Forward every NEXT_PUBLIC_* key so it is inlined into the client bundle. */
const publicEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key, value]) => key.startsWith("NEXT_PUBLIC_") && value !== undefined)
    .map(([key, value]) => [key, value]),
);

const imageDomains = (process.env.NEXT_PUBLIC_IMAGE_DOMAINS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").origin;
  } catch {
    return "http://localhost:8000";
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `env` lets Next replace `process.env.SOME_LITERAL` in the browser bundle,
  // but only where the key is written out statically. src/lib/site.ts looks
  // keys up dynamically (`process.env[key]`), which the compiler cannot
  // rewrite — client-side every value came back undefined. Shipping the whole
  // map as one JSON string gives that helper a single static key to read, so
  // the values survive into the browser. Same data, already public by virtue
  // of the NEXT_PUBLIC_ prefix.
  env: { ...publicEnv, NEXT_PUBLIC_ENV_JSON: JSON.stringify(publicEnv) },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Prerendering is I/O-bound here (every page hits the catalog API), not
  // memory-bound: the build peaks around 660MB, well inside the 2GB heap cap.
  // The wider per-page ceiling stays as headroom for a cold backend; worker
  // counts are left at Next's defaults deliberately — see git history.
  staticPageGenerationTimeout: 300,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageDomains.flatMap((hostname) => [
      { protocol: "https", hostname },
      { protocol: "http", hostname },
    ]),
  },

  async rewrites() {
    // Same-origin media so <Image> and downloads work without CORS headaches.
    return [
      { source: "/media/:path*", destination: `${apiOrigin}/media/:path*` },
      { source: "/django-static/:path*", destination: `${apiOrigin}/django-static/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
