import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'site.json');

export function exportSiteData() {
  const db = getDb();

  // ── Menu ──
  const categories = db.prepare(
    'SELECT * FROM menu_categories ORDER BY sort_order ASC'
  ).all();

  const itemsByCategory = db.prepare(
    'SELECT * FROM menu_items WHERE category_id = ? ORDER BY sort_order ASC'
  );

  const menu = {};
  for (const cat of categories) {
    const items = itemsByCategory.all(cat.id);
    menu[cat.name.toLowerCase()] = items.map(item => ({
      name: item.name,
      price: item.price,
      desc: item.description,
      sub: item.is_sub_item === 1,
    }));
  }

  // ── Events ──
  const events = db.prepare(
    'SELECT * FROM events ORDER BY sort_order ASC'
  ).all().map(evt => ({
    title: evt.title,
    date: evt.date_display,
    badge: evt.badge,
    desc: evt.description,
    featured: evt.featured === 1,
  }));

  // ── Content ──
  const contentRows = db.prepare('SELECT * FROM content ORDER BY section, key').all();
  const content = {};
  for (const row of contentRows) {
    if (!content[row.section]) content[row.section] = {};
    content[row.section][row.key] = row.value;
  }

  // ── All Theme Presets ──
  const themePresets = db.prepare(
    'SELECT * FROM theme_presets ORDER BY id ASC'
  ).all().map(tp => {
    const data = JSON.parse(tp.colors);
    // Support both old format (flat colors) and new format (colors + darkColors)
    const colors = data.colors || data;
    const darkColors = data.darkColors || null;
    return { id: tp.id, name: tp.name, colors, ...(darkColors ? { darkColors } : {}), active: tp.is_active === 1 };
  });

  // ── Theme (active preset) ──
  const activePreset = themePresets.find(p => p.active);
  const theme = activePreset ? activePreset.colors : {};

  // ── Settings ──
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  // ── Build output ──
  const siteData = {
    menu,
    events,
    content,
    theme,
    themePresets,
    settings,
    exportedAt: new Date().toISOString(),
  };

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(siteData, null, 2), 'utf-8');

  console.log(`Exported site data to ${OUTPUT_FILE}`);
  return OUTPUT_FILE;
}

// Run directly if called as a script
if (process.argv[1] === __filename) {
  exportSiteData();
}
