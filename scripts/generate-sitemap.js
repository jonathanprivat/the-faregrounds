#!/usr/bin/env node
/**
 * Build-time sitemap + robots.txt generator for The Fairgrounds.
 *
 * Reads public/data/site.json to discover canonical content and emits:
 *   dist/sitemap.xml   — XML sitemap with <loc>, <lastmod>, <changefreq>, <priority>
 *   dist/robots.txt    — references the sitemap, allows everything
 *
 * Hooked into npm via the "postbuild" script so it runs on every `npm run build`.
 */

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const distDir = resolve(root, "dist");
const sitemapPath = resolve(distDir, "sitemap.xml");
const robotsPath = resolve(distDir, "robots.txt");
const sitePath = resolve(root, "public/data/site.json");

const SITE_URL = "https://nantucketfairgrounds.com";

// Use site.json mtime as lastmod for the homepage (it's the source of truth for content)
const siteMtime = existsSync(sitePath)
  ? statSync(sitePath).mtime.toISOString().split("T")[0]
  : new Date().toISOString().split("T")[0];

// Read site.json for menu PDFs we want indexed
let site = {};
try {
  site = JSON.parse(readFileSync(sitePath, "utf8"));
} catch {
  console.warn("[sitemap] could not read site.json — emitting minimal sitemap");
}

// Build URL list
const urls = [];

// 1. Homepage
urls.push({
  loc: `${SITE_URL}/`,
  lastmod: siteMtime,
  changefreq: "weekly",
  priority: "1.0",
});

// 2. Anchor sections — single-page nav targets that Google indexes as fragments
// Listed here so they appear in coverage and can pick up section-specific queries
const sections = [
  { hash: "menu", priority: "0.9", changefreq: "weekly" },
  { hash: "events", priority: "0.9", changefreq: "weekly" },
  { hash: "story", priority: "0.7", changefreq: "monthly" },
  { hash: "visit", priority: "0.8", changefreq: "monthly" },
  { hash: "order", priority: "0.8", changefreq: "monthly" },
];
for (const s of sections) {
  urls.push({
    loc: `${SITE_URL}/#${s.hash}`,
    lastmod: siteMtime,
    changefreq: s.changefreq,
    priority: s.priority,
  });
}

// 3. PDF menu downloads — surfaced so they're indexable and can show up in SERP
const menuPdfs = ["dinner-menu.pdf", "desserts-menu.pdf", "specials-menu.pdf"];
for (const pdf of menuPdfs) {
  const pdfPath = resolve(root, "public/data", pdf);
  if (!existsSync(pdfPath)) continue;
  const mtime = statSync(pdfPath).mtime.toISOString().split("T")[0];
  urls.push({
    loc: `${SITE_URL}/data/${pdf}`,
    lastmod: mtime,
    changefreq: "monthly",
    priority: "0.6",
  });
}

// Emit XML
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  ),
  "</urlset>",
  "",
].join("\n");

if (!existsSync(distDir)) {
  console.error(`[sitemap] dist/ not found — run vite build first`);
  process.exit(1);
}

writeFileSync(sitemapPath, xml);
console.log(`[sitemap] wrote ${urls.length} URLs to ${sitemapPath}`);

// Emit robots.txt
const robots = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin/",
  "",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  "",
].join("\n");

writeFileSync(robotsPath, robots);
console.log(`[sitemap] wrote robots.txt to ${robotsPath}`);
