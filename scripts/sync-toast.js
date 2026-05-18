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
// Menu mapping (Toast → site.json):
//   - Direct label match (case-insensitive): "DESSERTS" ↔ "Desserts"
//   - Alias map (see MENU_ALIASES below): "All Day Menu" → both "Lunch" and
//     "Dinner" with per-target category filters (Lunch gets handhelds, Dinner
//     gets mains; appetizers/salads/fries/bowls/pizza appear on both).
//     "Mothers Day Specials" → "Specials".
//
// Hours sync (Toast → settings.hours):
//   - Fetches /restaurants/v1/restaurants/{TOAST_RESTAURANT_EXTERNAL_ID}
//   - Maps daySchedules / weekSchedule to structured per-day hours
//   - Writes settings.hours = { monday: { sessions: [{open,close}, ...], closed }, ... }
//   - Also regenerates legacy settings.hours_weekday/hours_weekend free-text
//     strings so App.jsx footer continues to render without changes (back-compat).
//   - Hours fetch is best-effort: on failure, existing settings.hours is left
//     untouched and sync continues with menus.
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

// ── Menu aliases ───────────────────────────────────────────────────────
// Maps a Toast menu label (lowercased) to one or more site.json target
// menus, with optional per-target category whitelists.
//
// `includeCategories: null` = take every Toast category as-is.
// `includeCategories: [...]` = only merge those category keys (lowercased,
// trimmed). All other Toast categories for that source are dropped for
// that target. Site-side categories not mentioned (e.g. sub-only editorial
// dividers in existing site.json) are still preserved by mergeMenu.
//
// Direct label match (e.g. "DESSERTS" ↔ "Desserts") still works without
// an alias entry — aliases are only needed when names diverge or a single
// Toast menu must fan out to multiple site menus.
// Category allowlists include common spelling variants so a Toast rename
// from "Salads" to "Salads & Soups" (or vice versa) doesn't blank the
// target menu. ALL listed keys are simultaneously accepted; missing keys
// are tolerated as long as at least one matches (see fail-safe below).
const MENU_ALIASES = {
  'all day menu': [
    {
      siteMenuId: 'lunch',
      includeCategories: [
        'appetizers', 'appetizer', 'starters',
        // Toast splits salads + soups into separate categories. The legacy
        // 'salads & soups' combined category was removed 2026-05-18 to match
        // Toast's structure; don't include its variants here or the partial
        // merger will recreate it from any stale site.json entries.
        'salads', 'soups', 'salad', 'soup',
        'handhelds', 'handheld', 'sandwiches', 'burgers',
        'fries',
        'bowls', 'bowl',
        'pizza', 'pizzas',
      ],
    },
    {
      siteMenuId: 'dinner',
      includeCategories: [
        'appetizers', 'appetizer', 'starters',
        'salads', 'soups', 'salad', 'soup',
        'mains', 'main', 'entrees', 'entrée', 'entrées',
        'fries',
        'bowls', 'bowl',
        'pizza', 'pizzas',
      ],
    },
  ],
  'mothers day specials': [
    { siteMenuId: 'specials', includeCategories: null },
  ],
};

// Filter a Toast-built menu to a subset of category keys.
// Returns { menu, matchedKeys, missingKeys } so callers can decide whether
// to apply the merge or fail-safe to "leave site menu untouched".
//   - matchedKeys: category keys from Toast that survived the allowlist
//   - missingKeys: allowlist keys that didn't appear in Toast (informational)
// Never mutates inputs. If allowedCategoryKeys is null, all categories pass.
function filterToastMenuByCategories(toastMenu, allowedCategoryKeys) {
  if (!allowedCategoryKeys) {
    return {
      menu: toastMenu,
      matchedKeys: Object.keys(toastMenu.items || {}),
      missingKeys: [],
    };
  }
  const allow = new Set(allowedCategoryKeys.map(c => categoryKey(c)));
  const items = {};
  const matchedKeys = [];
  for (const [ck, arr] of Object.entries(toastMenu.items || {})) {
    if (allow.has(ck)) {
      items[ck] = arr;
      matchedKeys.push(ck);
    }
  }
  const matchedSet = new Set(matchedKeys);
  const missingKeys = [...allow].filter(k => !matchedSet.has(k));
  return {
    menu: { label: toastMenu.label, items },
    matchedKeys,
    missingKeys,
  };
}

// Find the Toast menu (and optional category filter) that should drive a
// given site menu. Tries direct label match first, then walks MENU_ALIASES.
// Returns { toastMenu, includeCategories } or null.
function resolveToastForSiteMenu(siteMenu, toastMenusByLabelLower) {
  const directLabel = String(siteMenu.label || '').toLowerCase();
  const direct = toastMenusByLabelLower[directLabel];
  if (direct) return { toastMenu: direct, includeCategories: null };
  for (const [toastLabelLower, targets] of Object.entries(MENU_ALIASES)) {
    const tm = toastMenusByLabelLower[toastLabelLower];
    if (!tm) continue;
    const t = targets.find(x => x.siteMenuId === siteMenu.id);
    if (t) return { toastMenu: tm, includeCategories: t.includeCategories };
  }
  return null;
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
// Built once per menu so editorial `desc` and admin-set `disabled` flag
// survive Toast moving an item to a different category. Tracks match-found
// separately from values so intentionally empty/false values aren't lost.
function buildPreservationIndex(existingMenu) {
  const byToastId = new Map();
  const byName = new Map();
  const items = existingMenu?.items || {};
  for (const arr of Object.values(items)) {
    if (!Array.isArray(arr)) continue;
    for (const it of arr) {
      if (!it || it.sub === true) continue;
      const preserved = { desc: it.desc ?? '', disabled: it.disabled === true };
      if (it.toast_id && !byToastId.has(it.toast_id)) {
        byToastId.set(it.toast_id, preserved);
      }
      if (it.name) {
        const key = String(it.name).toLowerCase();
        if (!byName.has(key)) byName.set(key, preserved);
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
    let matchedDisabled = false;
    if (t.toast_id && preservationIndex.byToastId.has(t.toast_id)) {
      const p = preservationIndex.byToastId.get(t.toast_id);
      matched = true;
      matchedDesc = p.desc;
      matchedDisabled = p.disabled;
    } else if (t.name && preservationIndex.byName.has(String(t.name).toLowerCase())) {
      const p = preservationIndex.byName.get(String(t.name).toLowerCase());
      matched = true;
      matchedDesc = p.desc;
      matchedDisabled = p.disabled;
    }
    const out = {
      name: t.name,
      price: t.price,
      desc: matched ? matchedDesc : (t.desc || ''),
      sub: false,
      toast_id: t.toast_id,
    };
    // Only emit `disabled` if it's true — keeps site.json clean for the
    // common case (item is visible). Admin sets/clears the flag manually.
    if (matchedDisabled) out.disabled = true;
    return out;
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

// ── Per-menu merge (alias mode: preserves existing items for allowlisted
// categories that Toast didn't return — protects against partial fetches).
// Differs from mergeMenu (direct match): for allowed-but-missing categories,
// existing items are kept rather than dropped. For categories outside the
// allowlist, existing items are preserved as-is (editorial-only).
function mergeMenuAliasPartial(toastFilteredMenu, existingMenu, allowedCategoryKeys) {
  const merged = { ...existingMenu };
  const preservationIndex = buildPreservationIndex(existingMenu);
  const allowSet = new Set((allowedCategoryKeys || []).map(c => categoryKey(c)));
  const newItems = {};
  // 1. Toast-returned matched categories: normal Toast-authoritative merge.
  for (const [ck, toastItems] of Object.entries(toastFilteredMenu.items || {})) {
    newItems[ck] = mergeCategoryItems(toastItems, existingMenu.items?.[ck], preservationIndex);
  }
  // 2. Allowlist categories Toast didn't return: preserve existing items.
  for (const allowedCk of allowSet) {
    if (newItems[allowedCk]) continue;
    const existingArr = existingMenu.items?.[allowedCk];
    if (Array.isArray(existingArr) && existingArr.length > 0) {
      newItems[allowedCk] = existingArr.map(it => ({ ...it }));
    }
  }
  // 3. Existing categories outside the allowlist (editorial-only): preserve.
  for (const [ck, existingArr] of Object.entries(existingMenu.items || {})) {
    if (newItems[ck]) continue;
    if (allowSet.has(ck)) continue; // covered above
    const arr = Array.isArray(existingArr) ? existingArr : [];
    if (arr.length > 0) newItems[ck] = arr.map(it => ({ ...it }));
  }
  merged.items = newItems;
  return merged;
}

// ── Per-menu merge (direct mode: Toast fully authoritative on category presence)
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

// ── Hours sync ─────────────────────────────────────────────────────────
// Toast's "configuration" surface for restaurant hours is queried via:
//   GET /restaurants/v1/restaurants/{restaurantExternalId}
// which returns (relevant subset):
//   {
//     schedules: {
//       daySchedules: {
//         "<guid>": {
//           scheduleName, services: [{ name, hours: { startTime, endTime } }, ...]
//         }, ...
//       },
//       weekSchedule: {
//         monday: "<dayScheduleGuid>", tuesday: "...", ...
//       }
//     }
//   }
// `startTime`/`endTime` come as "HH:MM:SS.SSS" strings in restaurant-local time.
// Empty `services` for a day = closed. A day with N services = N open windows
// (e.g. lunch + dinner split shifts).
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function toClockHHMM(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const m = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const mm = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function fmtClockHuman(hhmm) {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const mm = parseInt(mStr, 10);
  const suffix = h >= 12 ? 'pm' : 'am';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return mm === 0 ? `${h}${suffix}` : `${h}:${String(mm).padStart(2, '0')}${suffix}`;
}

// Map Toast restaurant config → structured per-day sessions.
// Returns { monday: { sessions: [{open,close}], closed: bool }, ... } only
// when the payload looks valid AND at least one day has real sessions.
// Returns null otherwise (best-effort, never throws on shape) — null tells
// the caller to PRESERVE existing settings.hours rather than overwrite with
// "all closed" derived from a malformed payload.
function mapToastRestaurantToHours(payload) {
  try {
    const schedules = payload?.schedules;
    if (!schedules || typeof schedules !== 'object') return null;
    const daySchedules = schedules.daySchedules || {};
    const weekly = schedules.weekSchedule || {};
    // Build a case-insensitive lookup over the weekly schedule so 'MONDAY',
    // 'Monday', 'monday' all resolve. Toast has used both casings historically.
    const weeklyLowered = {};
    for (const [k, v] of Object.entries(weekly)) {
      weeklyLowered[String(k).toLowerCase()] = v;
    }
    // Must have at least one recognized day key — otherwise the shape is wrong.
    const recognizedDays = DAY_ORDER.filter(d => weeklyLowered[d]);
    if (recognizedDays.length === 0) return null;
    const out = {};
    let resolvedAny = false;
    // actionableAny = true if ANY day produced a definitive answer (open
    // sessions OR explicit-closed via empty services array). All-closed
    // schedules are valid (seasonal off-period — accept it). Only reject
    // when every day is unresolved (= payload shape is garbage).
    let actionableAny = false;
    for (const day of DAY_ORDER) {
      const guid = weeklyLowered[day];
      const sched = guid ? daySchedules[guid] : null;
      const hasGuid = !!guid;
      const guidResolves = !!sched;
      const servicesIsArray = Array.isArray(sched?.services);
      if (guidResolves) resolvedAny = true;
      let day_out;
      if (hasGuid && guidResolves && servicesIsArray) {
        const sessions = [];
        let hadAnyServiceEntry = false;
        for (const svc of sched.services) {
          hadAnyServiceEntry = true;
          const h = svc?.hours || {};
          const open = toClockHHMM(h.startTime);
          const close = toClockHHMM(h.endTime);
          if (open && close) sessions.push({ open, close });
        }
        if (sessions.length > 0) {
          // At least one valid window → trust this day as authoritative.
          // Sort by open time so split shifts display naturally
          // (11am – 4pm and 4pm – 11pm, not the reverse).
          sessions.sort((a, b) => a.open.localeCompare(b.open));
          day_out = { sessions, closed: false };
          actionableAny = true;
        } else if (hadAnyServiceEntry) {
          // Services array had entries but NONE produced valid open/close.
          // Treat as unresolved so existing hours are preserved (this is the
          // "garbage data on this specific day" case, not a deliberate close).
          day_out = { sessions: [], closed: false, unresolved: true };
          console.warn(`[toast-sync] hours: ${day} had ${sched.services.length} service entries but none parsed — preserving existing`);
        } else {
          // Explicit empty services array = genuine closed day. Actionable.
          day_out = { sessions: [], closed: true };
          actionableAny = true;
        }
      } else {
        day_out = { sessions: [], closed: false, unresolved: true };
      }
      out[day] = day_out;
    }
    // Reject only when nothing is actionable AND nothing was resolved —
    // both being false implies the payload shape was malformed enough that
    // we can't trust any of it. An all-closed-but-resolved schedule (valid
    // seasonal off-period) IS accepted because actionableAny will be true.
    if (!resolvedAny || !actionableAny) {
      console.warn(`[toast-sync] hours payload had no actionable data — preserving existing hours (resolvedAny=${resolvedAny}, actionableAny=${actionableAny})`);
      return null;
    }
    return out;
  } catch (e) {
    console.warn(`[toast-sync] hours mapping failed: ${e.message}`);
    return null;
  }
}

// Render a single day's sessions to "11:30am – 3pm and 5pm – 9:30pm" style.
function renderDayHours(sessions) {
  if (!sessions || sessions.length === 0) return '';
  return sessions
    .map(s => `${fmtClockHuman(s.open)} – ${fmtClockHuman(s.close)}`)
    .join(' and ');
}

// Collapse per-day hours into Mon-grouped human strings for back-compat with
// existing settings.hours_weekday / hours_weekend display. Groups runs of
// consecutive days with identical sessions.
function renderHoursLegacy(hoursByDay) {
  if (!hoursByDay) return null;
  const dayLabel = {
    monday: 'Mon', tuesday: 'Tues', wednesday: 'Wed',
    thursday: 'Thurs', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  };
  // Find runs of consecutive days with identical session signatures.
  const runs = [];
  let cur = null;
  for (const day of DAY_ORDER) {
    const d = hoursByDay[day];
    if (!d || d.closed || !d.sessions || d.sessions.length === 0) {
      if (cur) { runs.push(cur); cur = null; }
      runs.push({ days: [day], sessions: [], closed: true });
      continue;
    }
    const sig = JSON.stringify(d.sessions);
    if (cur && cur.sig === sig) {
      cur.days.push(day);
    } else {
      if (cur) runs.push(cur);
      cur = { days: [day], sessions: d.sessions, sig, closed: false };
    }
  }
  if (cur) runs.push(cur);
  const openRuns = runs.filter(r => !r.closed);
  if (openRuns.length === 0) return null;
  const labelRun = r => {
    const first = dayLabel[r.days[0]];
    const last = dayLabel[r.days[r.days.length - 1]];
    return r.days.length === 1 ? first : `${first}–${last}`;
  };
  // First open run → hours_weekday slot, rest concatenated → hours_weekend slot.
  return {
    hours_weekday: `${labelRun(openRuns[0])}: ${renderDayHours(openRuns[0].sessions)}`,
    hours_weekend: openRuns.length > 1
      ? openRuns.slice(1).map(r => `${labelRun(r)}: ${renderDayHours(r.sessions)}`).join(' • ')
      : '',
  };
}

async function fetchRestaurantConfig() {
  const extId = process.env.TOAST_RESTAURANT_EXTERNAL_ID;
  return authedGet(`/restaurants/v1/restaurants/${encodeURIComponent(extId)}`);
}

// ── Verification mode ──────────────────────────────────────────────────
// Read-only cross-check between live Toast data and current site.json.
// Produces a comprehensive report covering:
//   1. Toast inventory: every menu, every category, every item with name/price/GUID
//   2. Site inventory: counts per menu, linked vs local vs disabled
//   3. Cross-checks:
//      - Site items with toast_id that no longer exist in Toast (stale GUIDs)
//      - Toast customer-facing items that map to a site menu via aliases but
//        aren't present in site.json (missing-from-site)
//      - Price drift between Toast and the linked site item
//      - Name drift between Toast and the linked site item
//      - Toast menus that have no representation on the site at all (orphan menus)
//   4. Hours cross-check (raw Toast hours vs current site.json settings.hours)
//   5. Final verdict: IN SYNC / OUT OF SYNC (with itemized issues)
// Never writes site.json. Safe to dispatch any time.
function runVerification(siteData, toastMenusByLabelLower, hoursByDay) {
  console.log('\n[verify] ═══════════════════════════════════════════════════════════');
  console.log('[verify] TOAST ↔ SITE.JSON FULL SYNC VERIFICATION');
  console.log('[verify] ═══════════════════════════════════════════════════════════');

  // ─── Toast inventory ───
  console.log('\n[verify] ── 1. TOAST INVENTORY ──');
  const toastByGuid = new Map(); // guid → { menuLabel, category, name, price }
  let toastTotal = 0;
  for (const tm of Object.values(toastMenusByLabelLower)) {
    let menuCount = 0;
    const catLines = [];
    for (const [cat, items] of Object.entries(tm.items || {})) {
      let visible = 0;
      for (const it of items) {
        if (!it.toast_id) continue;
        toastByGuid.set(it.toast_id, { menuLabel: tm.label, category: cat, name: it.name, price: it.price });
        menuCount++;
        visible++;
      }
      catLines.push(`${cat}=${visible}`);
    }
    toastTotal += menuCount;
    console.log(`[verify]   ${tm.label}: ${menuCount} items (${catLines.join(', ') || 'empty'})`);
  }
  console.log(`[verify]   → ${toastTotal} total Toast items visible to TOAST_ONLINE_ORDERING / POS`);

  // ─── Site inventory ───
  console.log('\n[verify] ── 2. SITE.JSON INVENTORY ──');
  const siteItemsByGuid = new Map(); // guid → { menuLabel, category, name, price, desc, disabled }
  const siteItemsNoGuid = []; // { menuLabel, category, name, price, disabled }
  let siteTotal = 0, siteLinked = 0, siteDisabled = 0;
  for (const m of (siteData.menus || [])) {
    let menuItems = 0, menuLinked = 0, menuDisabled = 0;
    const catLines = [];
    for (const [cat, items] of Object.entries(m.items || {})) {
      let catTotal = 0;
      for (const it of (items || [])) {
        if (!it || it.sub === true) continue;
        catTotal++;
        menuItems++;
        siteTotal++;
        const entry = { menuLabel: m.label, category: cat, name: it.name, price: it.price || '', desc: it.desc || '', disabled: it.disabled === true };
        if (it.toast_id) {
          siteItemsByGuid.set(it.toast_id, entry);
          menuLinked++;
          siteLinked++;
        } else {
          siteItemsNoGuid.push(entry);
        }
        if (it.disabled === true) {
          menuDisabled++;
          siteDisabled++;
        }
      }
      catLines.push(`${cat}=${catTotal}`);
    }
    console.log(`[verify]   ${m.label}: ${menuItems} items (${menuLinked} linked, ${menuDisabled} disabled) — ${catLines.join(', ')}`);
  }
  console.log(`[verify]   → ${siteTotal} total site items, ${siteLinked} linked, ${siteDisabled} disabled, ${siteTotal - siteDisabled} visible on public site`);

  // ─── Cross-check 1: stale GUIDs (site says it's Toast-linked but Toast doesn't have that GUID) ───
  console.log('\n[verify] ── 3. CROSS-CHECK: STALE GUIDS (site → Toast) ──');
  const staleGuids = [];
  for (const [guid, siteEntry] of siteItemsByGuid) {
    if (!toastByGuid.has(guid)) {
      staleGuids.push({ guid, ...siteEntry });
    }
  }
  if (staleGuids.length === 0) {
    console.log('[verify]   ✓ All site GUIDs resolve to live Toast items.');
  } else {
    console.log(`[verify]   ✗ ${staleGuids.length} stale GUID(s) — Toast no longer publishes these items:`);
    for (const s of staleGuids) {
      console.log(`[verify]     - [${s.menuLabel}/${s.category}] ${s.name} (guid ${s.guid.slice(0,8)}…)`);
    }
  }

  // ─── Cross-check 2: price + name drift on linked items ───
  console.log('\n[verify] ── 4. CROSS-CHECK: PRICE + NAME DRIFT (linked items) ──');
  const priceDrift = [];
  const nameDrift = [];
  for (const [guid, siteEntry] of siteItemsByGuid) {
    const toastEntry = toastByGuid.get(guid);
    if (!toastEntry) continue;
    if ((toastEntry.price || '') !== (siteEntry.price || '')) {
      priceDrift.push({ guid, siteEntry, toastEntry });
    }
    if (String(toastEntry.name) !== String(siteEntry.name)) {
      nameDrift.push({ guid, siteEntry, toastEntry });
    }
  }
  if (priceDrift.length === 0) console.log('[verify]   ✓ No price drift on linked items.');
  else {
    console.log(`[verify]   ✗ ${priceDrift.length} price drift(s):`);
    for (const p of priceDrift) {
      console.log(`[verify]     - [${p.siteEntry.menuLabel}/${p.siteEntry.category}] ${p.siteEntry.name}: site=${p.siteEntry.price || '(none)'} vs Toast=${p.toastEntry.price || '(none)'}`);
    }
  }
  if (nameDrift.length === 0) console.log('[verify]   ✓ No name drift on linked items.');
  else {
    console.log(`[verify]   ✗ ${nameDrift.length} name drift(s):`);
    for (const n of nameDrift) {
      console.log(`[verify]     - [${n.siteEntry.menuLabel}/${n.siteEntry.category}] site=${n.siteEntry.name} vs Toast=${n.toastEntry.name}`);
    }
  }

  // ─── Cross-check 3: missing-from-site (Toast items that should be on the site but aren't) ───
  console.log('\n[verify] ── 5. CROSS-CHECK: MISSING FROM SITE (Toast → site) ──');
  // Build site-menu-to-allowed-toast-menus map from MENU_ALIASES + direct labels
  const expectedTargetMenusByToastLabel = {}; // toastLabelLower → [siteMenuIds]
  for (const [toastLabel, targets] of Object.entries(MENU_ALIASES)) {
    expectedTargetMenusByToastLabel[toastLabel] = targets.map(t => ({ siteMenuId: t.siteMenuId, includeCategories: t.includeCategories }));
  }
  // Add direct-label matches (e.g. DESSERTS ↔ Desserts)
  const siteMenusById = new Map();
  for (const m of (siteData.menus || [])) siteMenusById.set(m.id, m);
  for (const [toastLabelLower, tm] of Object.entries(toastMenusByLabelLower)) {
    if (expectedTargetMenusByToastLabel[toastLabelLower]) continue;
    // Direct label match: site menu whose label.toLowerCase() === toastLabelLower
    for (const m of (siteData.menus || [])) {
      if (String(m.label || '').toLowerCase() === toastLabelLower) {
        expectedTargetMenusByToastLabel[toastLabelLower] = [{ siteMenuId: m.id, includeCategories: null }];
        break;
      }
    }
  }

  const missingFromSite = [];
  const orphanToastMenus = []; // Toast menus with NO mapping at all
  for (const [toastLabelLower, tm] of Object.entries(toastMenusByLabelLower)) {
    const targets = expectedTargetMenusByToastLabel[toastLabelLower];
    if (!targets) {
      const itemCount = Object.values(tm.items || {}).reduce((n, arr) => n + arr.length, 0);
      orphanToastMenus.push({ label: tm.label, itemCount });
      continue;
    }
    for (const target of targets) {
      const allowCk = target.includeCategories ? new Set(target.includeCategories.map(c => categoryKey(c))) : null;
      for (const [cat, items] of Object.entries(tm.items || {})) {
        if (allowCk && !allowCk.has(cat)) continue;
        for (const it of items) {
          if (!it.toast_id) continue;
          if (!siteItemsByGuid.has(it.toast_id)) {
            missingFromSite.push({ guid: it.toast_id, name: it.name, price: it.price, toastLabel: tm.label, toastCat: cat, siteMenuId: target.siteMenuId });
          }
        }
      }
    }
  }
  if (missingFromSite.length === 0) console.log('[verify]   ✓ Every expected Toast item is present in site.json.');
  else {
    console.log(`[verify]   ✗ ${missingFromSite.length} Toast item(s) missing from site (should appear after next sync):`);
    for (const m of missingFromSite) {
      console.log(`[verify]     - Toast [${m.toastLabel}/${m.toastCat}] ${m.name} ${m.price} → site menu "${m.siteMenuId}" (guid ${m.guid.slice(0,8)}…)`);
    }
  }

  // ─── Cross-check 4: orphan Toast menus (no site representation by design) ───
  console.log('\n[verify] ── 6. ORPHAN TOAST MENUS (no site mapping by design) ──');
  if (orphanToastMenus.length === 0) console.log('[verify]   (none — every Toast menu has at least an alias)');
  else {
    for (const o of orphanToastMenus) {
      console.log(`[verify]   - ${o.label} (${o.itemCount} items) — not surfaced on public site`);
    }
  }

  // ─── Hours cross-check ───
  console.log('\n[verify] ── 7. HOURS CROSS-CHECK ──');
  const sh = (siteData.settings && siteData.settings.hours) || null;
  if (!hoursByDay) {
    console.log('[verify]   ✗ Toast did not return parseable hours this run.');
  } else if (!sh) {
    console.log('[verify]   ⚠ site.json has no structured settings.hours yet (will be populated on next --apply run).');
    for (const d of DAY_ORDER) {
      const h = hoursByDay[d];
      const desc = h.closed ? 'closed' : (h.unresolved ? 'unresolved' : renderDayHours(h.sessions));
      console.log(`[verify]   Toast ${d}: ${desc}`);
    }
  } else {
    let drift = 0;
    for (const d of DAY_ORDER) {
      const t = hoursByDay[d];
      const s = sh[d];
      const tDesc = !t ? '(missing)' : t.closed ? 'closed' : t.unresolved ? 'unresolved' : renderDayHours(t.sessions);
      const sDesc = !s ? '(missing)' : s.closed ? 'closed' : renderDayHours(s.sessions);
      const match = tDesc === sDesc || (t?.unresolved && (!s || s.sessions?.length === 0 || s.closed)) || (!t && !s);
      const mark = match ? '✓' : '✗';
      if (!match) drift++;
      console.log(`[verify]   ${mark} ${d}: site=${sDesc} | Toast=${tDesc}`);
    }
    console.log(`[verify]   → ${drift === 0 ? '✓ hours fully in sync' : `✗ ${drift} day(s) drift`}`);
  }

  // ─── Verdict ───
  console.log('\n[verify] ── VERDICT ──');
  const issues = [];
  if (staleGuids.length > 0) issues.push(`${staleGuids.length} stale GUID(s)`);
  if (priceDrift.length > 0) issues.push(`${priceDrift.length} price drift(s)`);
  if (nameDrift.length > 0) issues.push(`${nameDrift.length} name drift(s)`);
  if (missingFromSite.length > 0) issues.push(`${missingFromSite.length} missing-from-site item(s)`);
  if (issues.length === 0) {
    console.log('[verify]   ✅ IN SYNC — every linked item matches Toast, no stale GUIDs, no missing items.');
  } else {
    console.log(`[verify]   ⚠ OUT OF SYNC: ${issues.join(', ')}`);
  }
  console.log('[verify] ═══════════════════════════════════════════════════════════\n');
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');
  if (verify && apply) {
    throw new Error('--verify and --apply are mutually exclusive');
  }
  console.log(`[toast-sync] start ${new Date().toISOString()} apply=${apply} verify=${verify}`);

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
  // Verbose group-level dump — helps verify alias category filters match
  // Toast's actual group structure. Cheap, never errors.
  for (const tm of Object.values(toastMenus)) {
    const cats = Object.keys(tm.items || {});
    const counts = cats.map(c => `${c}=${(tm.items[c] || []).length}`).join(', ');
    console.log(`[toast-sync]   ${tm.label}: ${cats.length} categories (${counts || '(none)'})`);
  }

  if (!fs.existsSync(SITE_JSON_PATH)) {
    throw new Error(`site.json not found at ${SITE_JSON_PATH}`);
  }
  const before = JSON.parse(fs.readFileSync(SITE_JSON_PATH, 'utf8'));
  const after = { ...before };
  // Helpers for fail-safe item counting.
  const countMenuItems = (menuObj) => {
    let n = 0;
    for (const arr of Object.values(menuObj?.items || {})) {
      if (Array.isArray(arr)) for (const it of arr) if (it && it.sub !== true) n++;
    }
    return n;
  };
  after.menus = (before.menus || []).map(menu => {
    const resolved = resolveToastForSiteMenu(menu, toastMenus);
    if (!resolved) return menu; // no Toast counterpart — leave untouched
    const { menu: tm, matchedKeys, missingKeys } =
      filterToastMenuByCategories(resolved.toastMenu, resolved.includeCategories);
    const availableToastKeys = Object.keys(resolved.toastMenu.items || {});
    const matchKind = resolved.includeCategories ? 'alias' : 'direct';
    // FAIL-SAFE 1 (alias only): if no allowlist categories matched, skip merge.
    if (resolved.includeCategories && matchedKeys.length === 0) {
      console.warn(`[toast-sync]   SKIP merge (fail-safe: 0 matching categories): Toast "${resolved.toastMenu.label}" → site "${menu.label}". Allowlist=[${resolved.includeCategories.join(', ')}], Toast offers=[${availableToastKeys.join(', ') || '(none)'}]. Leaving site menu untouched.`);
      return menu;
    }
    // FAIL-SAFE 2 (alias AND direct): if the incoming Toast menu has zero
    // non-sub items but the existing site menu has items, treat that as
    // "Toast returned empty / partial fetch" and preserve. Without this,
    // mergeMenu would clear every existing non-sub slot for matched
    // categories because Toast is authoritative on presence.
    const incomingCount = countMenuItems(tm);
    const existingCount = countMenuItems(menu);
    if (incomingCount === 0 && existingCount > 0) {
      console.warn(`[toast-sync]   SKIP merge (fail-safe: ${matchKind} 0-item payload): Toast "${resolved.toastMenu.label}" → site "${menu.label}" had ${existingCount} existing items but Toast returned 0 items across matched categories (matched=[${matchedKeys.join(', ') || '(none)'}], Toast offers=[${availableToastKeys.join(', ') || '(none)'}]). Leaving site menu untouched.`);
      return menu;
    }
    console.log(`[toast-sync]   merging ${matchKind}: Toast "${resolved.toastMenu.label}" → site "${menu.label}" (matched: ${matchedKeys.join(', ') || '(none)'}; incoming=${incomingCount} items${missingKeys.length ? `; allowlist-not-in-Toast (preserved): ${missingKeys.join(', ')}` : ''})`);
    // Alias-mode merges use the partial merger so missing-from-Toast allowlist
    // categories preserve existing items (treat as transient absence, not deletion).
    if (resolved.includeCategories) {
      return mergeMenuAliasPartial(tm, menu, resolved.includeCategories);
    }
    return mergeMenu(tm, menu);
  });
  // Strip internal _sort field before persist (and before structural diff).
  for (const m of after.menus) {
    for (const arr of Object.values(m.items || {})) {
      if (Array.isArray(arr)) for (const it of arr) delete it._sort;
    }
  }

  // ── Hours sync (best-effort) ───────────────────────────────────────
  // Manual override: if site.json has settings.hours_manual_override === true,
  // skip the entire hours fetch + write block. This is the escape hatch for
  // when Toast's General Schedule (`/restaurants/v1/.../schedules`) disagrees
  // with what the admin wants on the public site — e.g. when the operational
  // hours live in Toast's "Online Ordering Hours" page (which isn't exposed
  // by the public API) and the admin would rather manage the public site
  // hours by hand than mirror them into the General Schedule.
  if (before?.settings?.hours_manual_override === true) {
    console.log('[toast-sync] hours_manual_override is true — skipping hours fetch + write entirely');
  } else {
  // Pace another ~1.1s — separate Toast API surface, same rate-limit class.
  await new Promise(r => setTimeout(r, 1100));
  let hoursByDay = null;
  try {
    const cfg = await fetchRestaurantConfig();
    // Diagnostic: log the top-level shape of the restaurant config payload so
    // we can verify which schedule format Toast returns for this restaurant.
    // Toast's /restaurants/v1 surface has historically returned several shapes
    // (schedules.daySchedules+weekSchedule, schedules.openingHours, top-level
    // hoursSchedule, etc) — log once so we know which one we got.
    const topKeys = cfg && typeof cfg === 'object' ? Object.keys(cfg) : [];
    const schedKeys = cfg?.schedules && typeof cfg.schedules === 'object' ? Object.keys(cfg.schedules) : [];
    const locKeys = cfg?.location && typeof cfg.location === 'object' ? Object.keys(cfg.location) : [];
    console.log(`[toast-sync] hours config keys: top=[${topKeys.join(', ')}], schedules=[${schedKeys.join(', ')}], location=[${locKeys.join(', ')}]`);
    // Deep diagnostic — dump the three candidate hours surfaces so we can
    // identify which one carries the takeout/online-ordering hours that
    // Jony edits via Toast Web → "Online ordering hours". Each is bounded
    // (a few KB) so safe to dump.
    if (verify) {
      console.log('[toast-sync] RAW schedules JSON:\n' + JSON.stringify(cfg?.schedules || null, null, 2));
      console.log('[toast-sync] RAW onlineOrdering JSON:\n' + JSON.stringify(cfg?.onlineOrdering || null, null, 2));
      console.log('[toast-sync] RAW delivery JSON:\n' + JSON.stringify(cfg?.delivery || null, null, 2));
      // Probe candidate Toast API surfaces that may host the takeout /
      // online-ordering hours. Each request is bounded with try/catch so
      // 404s/403s don't abort the verification run.
      const extId = process.env.TOAST_RESTAURANT_EXTERNAL_ID;
      const candidates = [
        `/restaurants/v1/restaurants/${extId}/onlineOrderingSchedule`,
        `/restaurants/v1/restaurants/${extId}/onlineOrderingHours`,
        `/restaurants/v1/restaurants/${extId}/services`,
        `/restaurants/v1/restaurants/${extId}/availability`,
        `/restaurants/v1/restaurants/${extId}/hours`,
        `/configuration/v2/restaurants/${extId}/onlineOrderingService`,
        `/configuration/v2/restaurants/${extId}/onlineOrderingHours`,
        `/configuration/v2/restaurants/${extId}/services`,
        `/configuration/v2/restaurants/${extId}/hoursOfOperation`,
        `/configuration/v2/restaurants/${extId}/businessHours`,
        `/configuration/v2/restaurants/${extId}/hours`,
        `/configuration/v2/restaurants/${extId}/onlineOrderingConfig`,
        `/config/v2/restaurants/${extId}/onlineOrderingHours`,
        `/digitalSchedule/v1/restaurants/${extId}`,
        `/digitalSchedule/v1/restaurants/${extId}/hours`,
        `/digitalSchedule/v1/restaurants/${extId}/schedules`,
        `/digitalSchedule/v1/restaurants/${extId}/onlineOrderingHours`,
        `/onlineOrdering/v1/restaurants/${extId}/hours`,
        `/onlineOrdering/v1/restaurants/${extId}/schedules`,
        `/onlineOrdering/v2/restaurants/${extId}/hours`,
        `/onlineOrdering/v2/restaurants/${extId}/schedules`,
        `/scheduling/v1/restaurants/${extId}/hours`,
        `/hours/v1/restaurants/${extId}`,
        `/availability/v1/restaurants/${extId}`,
      ];
      console.log('\n[toast-sync] ── PROBING CANDIDATE HOURS ENDPOINTS ──');
      for (const url of candidates) {
        try {
          await new Promise(r => setTimeout(r, 400));
          const data = await authedGet(url);
          const shape = typeof data === 'object' && data
            ? `keys=[${Object.keys(data).slice(0, 12).join(', ')}]`
            : `value=${JSON.stringify(data).slice(0, 80)}`;
          console.log(`[toast-sync]   ✓ ${url} → ${shape}`);
          console.log(`[toast-sync]     BODY:\n${JSON.stringify(data, null, 2).slice(0, 2500)}`);
        } catch (e) {
          console.log(`[toast-sync]   ✗ ${url} → ${e.message.slice(0, 120)}`);
        }
      }
      console.log('[toast-sync] ── END PROBE ──\n');
    }
    hoursByDay = mapToastRestaurantToHours(cfg);
    if (hoursByDay) {
      const summary = DAY_ORDER.map(d => {
        const h = hoursByDay[d];
        if (h.closed) return `${d}=closed`;
        return `${d}=${renderDayHours(h.sessions) || '?'}`;
      }).join(' | ');
      console.log(`[toast-sync] Toast hours: ${summary}`);
    } else {
      console.log('[toast-sync] hours: payload shape not recognized, skipping hours update');
    }
  } catch (e) {
    console.warn(`[toast-sync] hours fetch failed (skipping hours update): ${e.message}`);
  }
  if (hoursByDay) {
    after.settings = { ...(before.settings || {}) };
    // Merge per-day: any day Toast couldn't resolve (unresolved:true) keeps
    // its existing entry rather than being blanked. New fully-resolved days
    // (open or explicitly closed) come from Toast.
    const existingHours = (before.settings && before.settings.hours) || {};
    const mergedHours = {};
    for (const day of DAY_ORDER) {
      const fresh = hoursByDay[day];
      if (fresh && !fresh.unresolved) {
        mergedHours[day] = { sessions: fresh.sessions, closed: !!fresh.closed };
      } else if (existingHours[day]) {
        mergedHours[day] = existingHours[day];
      } else {
        // No Toast data, no existing data — fall through with "unknown" =
        // omit entry rather than fabricate a closed day.
      }
    }
    after.settings.hours = mergedHours;
    // Legacy strings — when Toast hours are accepted, ALWAYS regenerate both
    // legacy fields from the merged data. This prevents stale strings from
    // saying "Mon-Tues: 11:30am-3pm" while structured hours say "Mon: closed".
    // renderHoursLegacy returns null only when ALL days are closed/empty —
    // in that case clear both legacy fields too.
    const legacy = renderHoursLegacy(mergedHours);
    if (legacy) {
      after.settings.hours_weekday = legacy.hours_weekday || '';
      after.settings.hours_weekend = legacy.hours_weekend || '';
    } else {
      after.settings.hours_weekday = '';
      after.settings.hours_weekend = '';
    }
  }
  } // close `else` of hours_manual_override gate

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
  // Hours sync writes settings.{hours, hours_weekday, hours_weekend}. Compare
  // only those keys, not the whole settings blob — other settings keys may be
  // user-edited via the CMS and we don't want to false-positive on them.
  const hoursKeys = ['hours', 'hours_weekday', 'hours_weekend'];
  const beforeHoursSlice = JSON.stringify(hoursKeys.map(k => (before.settings || {})[k]));
  const afterHoursSlice = JSON.stringify(hoursKeys.map(k => (after.settings || {})[k]));
  const hoursChanged = beforeHoursSlice !== afterHoursSlice;
  const structuralChanged = menuBodyChanged || hoursChanged;

  if (verify) {
    runVerification(before, toastMenus, hoursByDay);
    console.log(`[toast-sync] VERIFY DONE — site.json untouched (menuBodyChanged=${menuBodyChanged} hoursChanged=${hoursChanged})`);
    process.exit(0);
  }

  if (!apply) {
    console.log(`[toast-sync] DRY RUN — pass --apply to write site.json (menuBodyChanged=${menuBodyChanged} hoursChanged=${hoursChanged})`);
    process.exit(0);
  }
  if (!structuralChanged) {
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
