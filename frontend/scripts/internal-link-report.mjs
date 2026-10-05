#!/usr/bin/env node
/**
 * Crawl the running site and report on its internal link graph.
 *
 *   node scripts/internal-link-report.mjs --base http://localhost:3000 \
 *        --out ../docs/internal-link-report.md
 *
 * Answers the questions §13 of the SEO brief asks and that nothing in the
 * codebase could answer before:
 *
 *   * which pages are orphaned — in the sitemap, but reachable from no link;
 *   * how many clicks each commercial page is from the homepage;
 *   * which internal links point at a redirect or a 404, so equity is lost or
 *     spent on a hop;
 *   * which anchor texts are non-descriptive ("click here", "read more");
 *   * which products and categories nothing links to.
 *
 * Crawls only same-origin HTML, follows nothing off-site, and writes no state.
 */

import fs from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[index + 1]]);
    return pairs;
  }, []),
);

const BASE = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = args.out ?? null;
const SITE_ORIGIN = args["site-origin"] ?? "https://chemicals.noksindustrial.com";

/** Normalise any href into a site-relative path, or null if it is off-site. */
function toPath(href, from) {
  if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, `${BASE}${from}`);
  } catch {
    return null;
  }
  if (url.origin !== BASE && url.origin !== SITE_ORIGIN) return null;
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return `${path}${url.search}`;
}

const NON_DESCRIPTIVE = /^(click here|here|read more|more|learn more|link|this|view)$/i;

async function crawl() {
  const pages = new Map(); // path -> { status, depth, outbound:Set, anchors:[] }
  const inbound = new Map(); // path -> Set<path>
  const queue = [["/", 0]];
  const seen = new Set(["/"]);

  while (queue.length) {
    const [path, depth] = queue.shift();
    const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const status = response.status;

    if (status >= 300 && status < 400) {
      pages.set(path, { status, depth, outbound: new Set(), anchors: [],
                        redirectTo: response.headers.get("location") });
      continue;
    }
    if (status !== 200 || !(response.headers.get("content-type") ?? "").includes("text/html")) {
      pages.set(path, { status, depth, outbound: new Set(), anchors: [] });
      continue;
    }

    const html = await response.text();
    const outbound = new Set();
    const anchors = [];

    for (const match of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const target = toPath(match[1], path);
      if (!target) continue;
      const text = match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      outbound.add(target);
      anchors.push({ target, text });

      const bare = target.split("?")[0];
      if (!inbound.has(bare)) inbound.set(bare, new Set());
      inbound.get(bare).add(path);

      if (!seen.has(target) && !target.includes("?") && !target.startsWith("/admin")) {
        seen.add(target);
        queue.push([target, depth + 1]);
      }
    }

    pages.set(path, { status, depth, outbound, anchors });
    process.stderr.write(`\r  crawled ${pages.size} pages, ${queue.length} queued   `);
  }
  process.stderr.write("\n");
  return { pages, inbound };
}

async function sitemapPaths() {
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const path = new URL(m[1]).pathname.replace(/\/+$/, "");
    return path || "/";
  });
}

const { pages, inbound } = await crawl();
const inSitemap = await sitemapPaths();

const reachable = new Set([...pages.keys()].map((p) => p.split("?")[0]));
const orphans = inSitemap.filter((path) => !reachable.has(path));

const brokenLinks = [];
const redirectLinks = [];
for (const [path, page] of pages) {
  for (const { target, text } of page.anchors ?? []) {
    const targetPage = pages.get(target);
    if (!targetPage) continue;
    if (targetPage.status === 404) brokenLinks.push({ path, target, text });
    else if (targetPage.status >= 300 && targetPage.status < 400) {
      redirectLinks.push({ path, target, text, to: targetPage.redirectTo });
    }
  }
}

const vagueAnchors = [];
for (const [path, page] of pages) {
  for (const { target, text } of page.anchors ?? []) {
    if (NON_DESCRIPTIVE.test(text)) vagueAnchors.push({ path, target, text });
  }
}

const depthOf = (path) => pages.get(path)?.depth ?? Infinity;
const commercial = inSitemap.filter(
  (p) => p.startsWith("/products/") || p.startsWith("/categories/") || p.startsWith("/industries/"),
);
const tooDeep = commercial.filter((p) => depthOf(p) > 3);

const inboundCount = (path) => inbound.get(path)?.size ?? 0;
const weak = commercial
  .map((path) => ({ path, links: inboundCount(path) }))
  .filter((row) => row.links <= 1)
  .sort((a, b) => a.links - b.links);

const byDepth = new Map();
for (const path of inSitemap) {
  const depth = depthOf(path);
  byDepth.set(depth, (byDepth.get(depth) ?? 0) + 1);
}

const lines = [
  "# Internal link report",
  "",
  `Generated by \`node frontend/scripts/internal-link-report.mjs\` against a`,
  "production build. Every figure is measured from the rendered HTML, not",
  "inferred from the routes.",
  "",
  `- Pages crawled: **${pages.size}**`,
  `- URLs in the sitemap: **${inSitemap.length}**`,
  `- Orphaned (in the sitemap, reachable from no internal link): **${orphans.length}**`,
  `- Internal links to a 404: **${brokenLinks.length}**`,
  `- Internal links to a redirect: **${redirectLinks.length}**`,
  `- Non-descriptive anchor texts: **${vagueAnchors.length}**`,
  "",
  "## Clicks from the homepage",
  "",
  "Commercial pages should sit within three clicks of the homepage.",
  "",
  "| Clicks | URLs in sitemap |",
  "| --- | --- |",
  ...[...byDepth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([depth, count]) =>
      `| ${Number.isFinite(depth) ? depth : "unreachable"} | ${count} |`,
    ),
  "",
  `Commercial pages deeper than three clicks: **${tooDeep.length}**`,
  ...(tooDeep.length ? ["", ...tooDeep.slice(0, 25).map((p) => `- \`${p}\` (${depthOf(p)})`)] : []),
  "",
  "## Orphans",
  "",
  orphans.length
    ? "These are advertised in the sitemap but nothing links to them, so a crawler\nfinds them only via the sitemap and they accumulate no internal equity.\n"
    : "None. Every sitemap URL is reachable by following links from the homepage.\n",
  ...orphans.slice(0, 50).map((p) => `- \`${p}\``),
  "",
  "## Links pointing at a redirect",
  "",
  redirectLinks.length
    ? "Each of these spends a hop and leaks equity. Point them at the destination.\n"
    : "None. Every internal link goes straight to a canonical URL.\n",
  ...redirectLinks.slice(0, 50).map((r) => `- \`${r.path}\` → \`${r.target}\` → \`${r.to}\``),
  "",
  "## Links pointing at a 404",
  "",
  brokenLinks.length ? "" : "None.\n",
  ...brokenLinks.slice(0, 50).map((r) => `- \`${r.path}\` → \`${r.target}\` (“${r.text}”)`),
  "",
  "## Non-descriptive anchor text",
  "",
  vagueAnchors.length
    ? "“Click here” and “read more” tell a crawler nothing about the destination.\n"
    : "None. Every internal anchor names its destination.\n",
  ...vagueAnchors.slice(0, 30).map((r) => `- \`${r.path}\` → \`${r.target}\` (“${r.text}”)`),
  "",
  "## Thinly linked commercial pages",
  "",
  "One inbound link or fewer. These depend almost entirely on the sitemap.",
  "",
  "| URL | Inbound internal links |",
  "| --- | --- |",
  ...weak.slice(0, 40).map((row) => `| \`${row.path}\` | ${row.links} |`),
  "",
];

const report = lines.join("\n");
if (OUT) {
  await fs.writeFile(OUT, `${report}\n`, "utf8");
  process.stderr.write(`Wrote ${OUT}\n`);
} else {
  process.stdout.write(report);
}
