#!/usr/bin/env node
// Toast POS → public/data/site.json sync.
// Standalone: no DB, no Express. Designed to run from GitHub Actions.
//
// Editorial-control rule (CRITICAL):
//   - Toast drives: name, price, sort_order, presence (add/remove), category
//   - Local preserves: `desc` on existing items (matched by toast_id, fallback name)
//   - Sub items (sub: true) are NEVER touched — editorial dividers
//   - Menus not present in Toast (e.g. Specials, Desserts) are left alone
//   - Categories within a synced menu that are sub-only are preserved
//
// CLI:
//   node scripts/sync-toast.js          # dry-run, log diff only
//   node scripts/sync-toast.js --apply  # write public/data/site.json
//
// Env: reads from process.env (GH Actions secrets) or
// ~/.credentials/fairgrounds/toast.env (local dev).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const SITE_JSON_PATH = path.join(REPO_ROOT, 'public/data/site.json');
const ENV_PATH = path.join(os.homedir(), '.credentials/fairgrounds/toast.env');

// ── Env loader ─────────────────────────────────────────────────────────
function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    const raw = fs.readFileSync(ENV_PATH, 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
  const required = [
    'TOAST_API_BASE',
    'TOAST_AUTH_URL',
    'TOAST_USER_ACCESS_TYPE',
    'TOAST_CLIENT_ID',
    'TOAST_CLIENT_SECRET',
    'TOAST_RESTAURANT_EXTERNAL_ID',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`missing env: ${missing.join(', ')}`);
}

// ── OAuth (24h Bearer, in-memory cache) ────────────────────────────────
let _token = null;

async function getToken() {
  const now = Date.now();
  if (_token && _token.expiresAt - now > 60_000) return _token.value;
  const res = await fetch(process.env.TOAST_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.TOAST_CLIENT_ID,
      clientSecret: process.env.TOAST_CLIENT_SECRET,
      userAccessType: process.env.TOAST_USER_ACCESS_TYPE,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Toast auth: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const t = data?.token;
  if (!t?.accessToken) throw new Error('Toast auth: missing accessToken');
  const expiresIn = Number(t.expiresIn || 3600);
  _token = { value: t.accessToken, expiresAt: now + expiresIn * 1000 };
  return _token.value;
}

async function authedGet(p) {
  const url = `${process.env.TOAST_API_BASE}${p}`;
  async function go(token) {
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Toast-Restaurant-External-ID': process.env.TOAST_RESTAURANT_EXTERNAL_ID,
        Accept: 'application/json',
      },
    });
  }
  let token = await getToken();
  let res = await go(token);
  if (res.status === 429) {
    const ra = Number(res.headers.get('retry-after')) || 2;
    await new Promise(r => setTimeout(r, Math.min(Math.max(ra * 1000, 500), 10_000)));
    res = await go(token);
  }
  if (res.status === 401) {
    _token = null;
    token = await getToken();
    res = await go(token);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Toast GET ${p}: HTTP ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ── Visibility / formatting ────────────────────────────────────────────
function isCustomerFacing(node) {
  const v = node?.visibility;
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.includes('TOAST_ONLINE_ORDERING') || v.includes('POS');
}

// Returns true only when visibility is explicitly populated AND excludes
// customer-facing channels. Empty/missing visibility is NOT treated as
// hidden — Toast groups/subgroups frequently have empty visibility arrays
// even when their items are visible.
function isExplicitlyHidden(node) {
  const v = node?.visibility;
  if (!Array.isArray(v) || v.length === 0) return false;
  return !v.includes('TOAST_ONLINE_ORDERING') && !v.includes('POS');
}

function formatPrice(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (!Number.isFinite(num)) return '';
  return num % 1 === 0 ? `$${num.toFixed(0)}` : `$${num.toFixed(2)}`;
}

function categoryKey(name) {
  return String(name || '').toLowerCase().trim();
}

// ── Toast → indexed-by-menu-label structure ────────────────────────────
//   { [menuLabelLower]: { label, items: { [categoryKey]: [item, ...] } } }
// MAJOR #4 fix: visibility filter applied at item level only — group/sub-group
// visibility arrays are often empty even when their items are visible.
function buildToastMenus(payload) {
  const out = {};
  const menus = Array.isArray(payload?.menus) ? payload.menus : [];
  for (const menu of menus) {
    if (!isCustomerFacing(menu)) continue;
    const label = String(menu.name || '').trim();
    if (!label) continue;
    const labelLower = label.toLowerCase();
    if (!out[labelLower]) out[labelLower] = { label, items: {} };
    const itemsBucket = out[labelLower].items;

    const groups = Array.isArray(menu.menuGroups) ? menu.menuGroups : [];
    for (const group of groups) {
      if (isExplicitlyHidden(group)) continue;
      const groupName = String(group.name || '').trim();
      if (!groupName) continue;
      const ck = categoryKey(groupName);
      if (!itemsBucket[ck]) itemsBucket[ck] = [];
      let order = 0;

      const direct = Array.isArray(group.menuItems) ? group.menuItems : [];
      for (const it of direct) {
        if (!isCustomerFacing(it)) continue;
        itemsBucket[ck].push({
          name: String(it.name || 'Untitled'),
          price: formatPrice(it.price),
          desc: typeof it.description === 'string' ? it.description : '',
          sub: false,
          toast_id: it.guid || it.referenceId || `${groupName}-${it.name}-${order}`,
          _sort: order++,
        });
      }
      const subGroups = Array.isArray(group.menuGroups) ? group.menuGroups : [];
      for (const sub of subGroups) {
        if (isExplicitlyHidden(sub)) continue;
        const subItems = Array.isArray(sub.menuItems) ? sub.menuItems : [];
        for (const it of subItems) {
          if (!isCustomerFacing(it)) continue;
          itemsBucket[ck].push({
            name: String(it.name || 'Untitled'),
            price: formatPrice(it.price),
            desc: typeof it.description === 'string' ? it.description : '',
            sub: false,
            toast_id: it.guid || it.referenceId || `${ck}-${sub.name}-${it.name}-${order}`,
            _sort: order++,
          });
        }
      }
    }
  }
  return out;
}

// ── Menu-wide preservation index ───────────────────────────────────────
// Built once per menu so editorial `desc` survives Toast moving an item
// to a different category. Tracks match-found separately from desc value
// so an intentionally empty local desc is not overwritten by Toast's desc.
function buildPreservationIndex(existingMenu) {
  const byToastId = new Map();
  const byName = new Map();
  const items = existingMenu?.items || {};
  for (const arr of Object.values(items)) {
    if (!Array.isArray(arr)) continue;
    for (const it of arr) {
      if (!it || it.sub === true) continue;
      if (it.toast_id && !byToastId.has(it.toast_id)) {
        byToastId.set(it.toast_id, { desc: it.desc ?? '' });
      }
      if (it.name) {
        const key = String(it.name).toLowerCase();
        if (!byName.has(key)) byName.set(key, { desc: it.desc ?? '' });
      }
    }
  }
  return { byToastId, byName };
}

// ── Per-category merge (preserves desc + sub items in-place) ───────────
// Walks existing slots: sub-item dividers stay in place, non-sub slots
// are filled from the Toast-ordered queue. Leftover Toast items append
// at the end. Empty existing categories receive Toast items in order.
function mergeCategoryItems(toastItems, existingItems, preservationIndex) {
  const existingArr = Array.isArray(existingItems) ? existingItems : [];

  const toastBuilt = toastItems.map(t => {
    let matched = false;
    let matchedDesc = '';
    if (t.toast_id && preservationIndex.byToastId.has(t.toast_id)) {
      matched = true;
      matchedDesc = preservationIndex.byToastId.get(t.toast_id).desc;
    } else if (t.name && preservationIndex.byName.has(String(t.name).toLowerCase())) {
      matched = true;
      matchedDesc = preservationIndex.byName.get(String(t.name).toLowerCase()).desc;
    }
    return {
      name: t.name,
      price: t.price,
      desc: matched ? matchedDesc : (t.desc || ''),
      sub: false,
      toast_id: t.toast_id,
    };
  });

  const queue = [...toastBuilt];
  const out = [];
  for (const e of existingArr) {
    if (e && e.sub === true) {
      out.push({ ...e });
    } else if (queue.length > 0) {
      out.push(queue.shift());
    }
    // else: existing non-sub slot with no remaining Toast item — drop it
    // (Toast is the source of truth for non-sub presence).
  }
  for (const t of queue) out.push(t);
  return out;
}

// ── Per-menu merge ─────────────────────────────────────────────────────
function mergeMenu(toastMenu, existingMenu) {
  const merged = { ...existingMenu };
  const preservationIndex = buildPreservationIndex(existingMenu);
  const newItems = {};
  // Toast-driven categories.
  for (const [ck, toastItems] of Object.entries(toastMenu.items)) {
    newItems[ck] = mergeCategoryItems(toastItems, existingMenu.items?.[ck], preservationIndex);
  }
  // Preserve sub-only categories (editorial-only) AND categories that
  // Toast removed but still hold sub-item dividers we must not drop.
  for (const [ck, existingArr] of Object.entries(existingMenu.items || {})) {
    if (newItems[ck]) continue;
    const arr = Array.isArray(existingArr) ? existingArr : [];
    const subs = arr.filter(it => it && it.sub === true);
    if (subs.length > 0) newItems[ck] = subs.map(s => ({ ...s }));
  }
  merged.items = newItems;
  return merged;
}

// ── Diff summary (logs only; not used for write decisions) ─────────────
function diffSummary(beforeSite, afterSite) {
  const summary = { menusTouched: [], added: [], removed: [], priceChanged: [], renamed: [] };
  for (const after of afterSite.menus) {
    const before = beforeSite.menus.find(m => m.id === after.id);
    if (!before) continue;
    const beforeIdx = new Map();
    for (const [ck, arr] of Object.entries(before.items || {})) {
      for (const it of (arr || [])) {
        if (it.sub) continue;
        const idKey = it.toast_id ? `tid:${it.toast_id}` : null;
        const nameKey = `nm:${ck}::${String(it.name).toLowerCase()}`;
        if (idKey) beforeIdx.set(idKey, { ck, ...it });
        beforeIdx.set(nameKey, { ck, ...it });
      }
    }
    const seen = new Set();
    let touched = false;
    for (const [ck, arr] of Object.entries(after.items || {})) {
      for (const it of (arr || [])) {
        if (it.sub) continue;
        const idKey = it.toast_id ? `tid:${it.toast_id}` : null;
        const nameKey = `nm:${ck}::${String(it.name).toLowerCase()}`;
        const e = (idKey && beforeIdx.get(idKey)) || beforeIdx.get(nameKey);
        if (idKey) seen.add(idKey);
        seen.add(nameKey);
        if (!e) {
          summary.added.push(`[${after.label}] ${ck}: ${it.name} ${it.price}`);
          touched = true;
          continue;
        }
        if ((e.price || '') !== (it.price || '')) {
          summary.priceChanged.push(`[${after.label}] ${ck}: ${it.name}: ${e.price || '(none)'} → ${it.price || '(none)'}`);
          touched = true;
        }
        if (e.name !== it.name) {
          summary.renamed.push(`[${after.label}] ${ck}: ${e.name} → ${it.name}`);
          touched = true;
        }
      }
    }
    for (const [key, e] of beforeIdx) {
      if (seen.has(key)) continue;
      // Skip mirror keys: a removed item shows up under both tid: and nm:;
      // only count once via the nm: key.
      if (!key.startsWith('nm:')) continue;
      summary.removed.push(`[${after.label}] ${e.ck}: ${e.name} ${e.price || ''}`);
      touched = true;
    }
    if (touched) summary.menusTouched.push(after.label);
  }
  return summary;
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const apply = process.argv.includes('--apply');
  console.log(`[toast-sync] start ${new Date().toISOString()} apply=${apply}`);

  const metadata = await authedGet('/menus/v2/metadata').catch(e => {
    console.warn(`[toast-sync] metadata fetch failed (advisory): ${e.message}`);
    return null;
  });
  if (metadata) {
    console.log(`[toast-sync] Toast lastUpdated: ${metadata.lastUpdated || '(unknown)'}`);
  }
  // Pace ~1.1s — Toast publishes 1 req/sec/loc on /menus/v2/menus.
  await new Promise(r => setTimeout(r, 1100));
  const payload = await authedGet('/menus/v2/menus');
  const toastMenus = buildToastMenus(payload);
  const toastLabels = Object.values(toastMenus).map(m => m.label);
  console.log(`[toast-sync] Toast menus visible: ${toastLabels.length} (${toastLabels.join(', ') || '(none)'})`);

  if (!fs.existsSync(SITE_JSON_PATH)) {
    throw new Error(`site.json not found at ${SITE_JSON_PATH}`);
  }
  const before = JSON.parse(fs.readFileSync(SITE_JSON_PATH, 'utf8'));
  const after = { ...before };
  after.menus = (before.menus || []).map(menu => {
    const tm = toastMenus[String(menu.label || '').toLowerCase()];
    if (!tm) return menu; // no Toast counterpart — leave untouched
    return mergeMenu(tm, menu);
  });
  // Strip internal _sort field before persist (and before structural diff).
  for (const m of after.menus) {
    for (const arr of Object.values(m.items || {})) {
      if (Array.isArray(arr)) for (const it of arr) delete it._sort;
    }
  }

  const summary = diffSummary(before, after);
  const total =
    summary.added.length +
    summary.removed.length +
    summary.priceChanged.length +
    summary.renamed.length;

  console.log('[toast-sync] diff:');
  console.log(`  menus touched : ${summary.menusTouched.join(', ') || '(none)'}`);
  console.log(`  + added       : ${summary.added.length}`);
  console.log(`  - removed     : ${summary.removed.length}`);
  console.log(`  $ price       : ${summary.priceChanged.length}`);
  console.log(`  ~ renamed     : ${summary.renamed.length}`);
  for (const a of summary.added) console.log(`    + ${a}`);
  for (const r of summary.removed) console.log(`    - ${r}`);
  for (const p of summary.priceChanged) console.log(`    $ ${p}`);
  for (const r of summary.renamed) console.log(`    ~ ${r}`);

  // Structural-diff write-gate.
  // The summary above is human-readable and only counts add/remove/rename/price,
  // so a first-sync that *only* seeds toast_id (names+prices already match) shows
  // total === 0 yet still needs to be persisted. Compare actual menu bodies.
  const menuBodyChanged =
    JSON.stringify(before.menus || []) !== JSON.stringify(after.menus || []);

  if (!apply) {
    console.log(`[toast-sync] DRY RUN — pass --apply to write site.json (menuBodyChanged=${menuBodyChanged})`);
    process.exit(0);
  }
  if (!menuBodyChanged) {
    console.log('[toast-sync] no structural changes — site.json untouched');
    process.exit(0);
  }
  // Stamp sync time only on the write path so an unchanged dry-run doesn't
  // pollute the structural diff with a moving timestamp.
  after.toast_last_synced = new Date().toISOString();
  // Atomic write.
  const tmp = SITE_JSON_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(after, null, 2) + '\n');
  fs.renameSync(tmp, SITE_JSON_PATH);
  console.log(`[toast-sync] wrote ${path.relative(REPO_ROOT, SITE_JSON_PATH)} (summary=${total} changes, structural=true)`);
}

main().catch(e => {
  console.error('[toast-sync] FAILED:', e.message);
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
