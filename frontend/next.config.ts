import path from "node:path";

import dotenv from "dotenv";
import type { NextConfig } from "next";

// The whole stack reads ONE .env, at the repo root — never a local copy.
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

/** Forward every NEXT_PUBLIC_* key so it is inlined into the client bundle. */
const publicEnv = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key, value]) => key.startsWith("NEXT_PUBLIC_") && value !== undefined)
    .map(([key, value]) => [key, value as string]),
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

const nextConfig: NextConfig = {
  env: publicEnv,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: imageDomains.flatMap((hostname) => [
      { protocol: "https" as const, hostname },
      { protocol: "http" as const, hostname },
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
