# NOKS Chemical Division — Next.js image.
#
# The build context is the REPO ROOT, not frontend/. That is deliberate: both
# next.config.mjs and scripts/next-with-env.mjs read the single root-level `.env`
# via a relative "../.env" path, so the image has to reproduce the repo layout
# (/app/.env + /app/frontend/...) for the NEXT_PUBLIC_* values to be inlined
# into the client bundle at build time.

# ── deps ──────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# ── builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY --from=deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./
# The root .env — required here so `next build` can inline NEXT_PUBLIC_* into
# the static bundle. It is NOT carried into the runner stage below, so no
# secrets (DB password, Django key) end up in the shipped image.
COPY .env /app/.env
ENV NEXT_TELEMETRY_DISABLED=1

# Prerendering runs with NO backend: the `backend` service does not exist during
# an image build. src/lib/api.ts already has a `safe()` fallback so "read
# endpoints tolerate a cold/absent backend so pages still render" — but that
# only catches *errors*, and an unresolvable host makes fetch hang instead,
# tripping Next's 60s per-page static-generation timeout and failing the build.
#
# Pointing the server-side base at a closed local port turns that hang into an
# instant ECONNREFUSED, so `safe()` fires as designed and every page prerenders
# with its empty-state fallback. This value is confined to the builder stage —
# at runtime docker-compose supplies the real INTERNAL_API_URL
# (http://backend:8000/api/v1), and the fetches carry `revalidate: 300`, so each
# page regenerates with live catalog data on first request.
#
# Keeping this here (rather than reaching into a running container) is what lets
# the image build reproducibly, on CI or a clean machine, with nothing else up.
ENV INTERNAL_API_URL=http://127.0.0.1:1/api/v1

# Bounded heap so V8 collects instead of growing into this host's swap; see the
# matching staticPageGenerationTimeout / cpus notes in next.config.mjs.
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN npm run build

# ── prod deps ─────────────────────────────────────────────────────
# `next start` needs only the runtime dependencies; dropping typescript,
# tailwind and eslint keeps the final image substantially smaller.
FROM node:20-alpine AS proddeps
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev

# ── runner ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app/frontend
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=proddeps /app/frontend/node_modules ./node_modules
COPY --from=builder  /app/frontend/.next        ./.next
COPY --from=builder  /app/frontend/public       ./public
COPY frontend/package.json frontend/next.config.mjs frontend/tsconfig.json ./
COPY frontend/scripts ./scripts

EXPOSE 3000

# Goes through the same shim used in development so the port always comes from
# FRONTEND_PORT (supplied by env_file) instead of being hardcoded twice.
CMD ["npm", "start"]
