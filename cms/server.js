import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, DB_PATH } from './db.js';
import { exportSiteData } from './export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3333;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ─── Helper: slugify ───
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Auto-seed on first start ───
function autoSeed() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM menu_categories').get().count;
  if (count === 0) {
    console.log('Empty database detected. Running seed...');
    // Dynamically import and run seed
    import('./seed.js').then(() => {
      console.log('Auto-seed complete.');
    }).catch(err => {
      console.error('Auto-seed failed:', err.message);
    });
  }
}

// ═══════════════════════════════════════════
//  MENU ROUTES
// ═══════════════════════════════════════════

// GET /api/menu - All categories with items
app.get('/api/menu', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(
      'SELECT * FROM menu_categories ORDER BY sort_order ASC'
    ).all();

    const itemsByCategory = db.prepare(
      'SELECT * FROM menu_items WHERE category_id = ? ORDER BY sort_order ASC'
    );

    const menu = categories.map(cat => ({
      ...cat,
      items: itemsByCategory.all(cat.id),
    }));

    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/menu/categories - Create category
app.post('/api/menu/categories', (req, res) => {
  try {
    const db = getDb();
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const slug = slugify(name);
    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM menu_categories'
    ).get().next;

    const result = db.prepare(
      'INSERT INTO menu_categories (name, slug, sort_order) VALUES (?, ?, ?)'
    ).run(name, slug, maxOrder);

    const category = db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/menu/categories/reorder - Reorder categories
app.put('/api/menu/categories/reorder', (req, res) => {
  try {
    const db = getDb();
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array is required' });

    const update = db.prepare('UPDATE menu_categories SET sort_order = ? WHERE id = ?');
    const reorder = db.transaction(() => {
      ids.forEach((id, index) => update.run(index, id));
    });
    reorder();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/menu/categories/:id - Update category
app.put('/api/menu/categories/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, sort_order } = req.body;

    const existing = db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const newName = name !== undefined ? name : existing.name;
    const newSlug = name !== undefined ? slugify(name) : existing.slug;
    const newOrder = sort_order !== undefined ? sort_order : existing.sort_order;

    db.prepare(
      'UPDATE menu_categories SET name = ?, slug = ?, sort_order = ? WHERE id = ?'
    ).run(newName, newSlug, newOrder, id);

    const updated = db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/menu/categories/:id - Delete category and its items
app.delete('/api/menu/categories/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM menu_categories WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    db.prepare('DELETE FROM menu_items WHERE category_id = ?').run(id);
    db.prepare('DELETE FROM menu_categories WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/menu/items/reorder - Reorder items within a category
app.put('/api/menu/items/reorder', (req, res) => {
  try {
    const db = getDb();
    const { category_id, ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array is required' });

    const update = db.prepare('UPDATE menu_items SET sort_order = ? WHERE id = ?');
    const reorder = db.transaction(() => {
      ids.forEach((id, index) => update.run(index, id));
    });
    reorder();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/menu/items - Create item
app.post('/api/menu/items', (req, res) => {
  try {
    const db = getDb();
    const { category_id, name, description, price, is_sub_item } = req.body;
    if (!category_id || !name) return res.status(400).json({ error: 'category_id and name are required' });

    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM menu_items WHERE category_id = ?'
    ).get(category_id).next;

    const result = db.prepare(
      'INSERT INTO menu_items (category_id, name, description, price, is_sub_item, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(category_id, name, description || '', price || '', is_sub_item ? 1 : 0, maxOrder);

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/menu/items/:id - Update item
app.put('/api/menu/items/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const fields = {
      category_id: req.body.category_id !== undefined ? req.body.category_id : existing.category_id,
      name: req.body.name !== undefined ? req.body.name : existing.name,
      description: req.body.description !== undefined ? req.body.description : existing.description,
      price: req.body.price !== undefined ? req.body.price : existing.price,
      is_sub_item: req.body.is_sub_item !== undefined ? (req.body.is_sub_item ? 1 : 0) : existing.is_sub_item,
      sort_order: req.body.sort_order !== undefined ? req.body.sort_order : existing.sort_order,
    };

    db.prepare(
      'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, is_sub_item = ?, sort_order = ? WHERE id = ?'
    ).run(fields.category_id, fields.name, fields.description, fields.price, fields.is_sub_item, fields.sort_order, id);

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/menu/items/:id - Delete item
app.delete('/api/menu/items/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
//  EVENTS ROUTES
// ═══════════════════════════════════════════

// GET /api/events
app.get('/api/events', (req, res) => {
  try {
    const db = getDb();
    const events = db.prepare('SELECT * FROM events ORDER BY sort_order ASC').all();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
app.post('/api/events', (req, res) => {
  try {
    const db = getDb();
    const { title, date_display, badge, description, featured } = req.body;
    if (!title || !date_display) return res.status(400).json({ error: 'title and date_display are required' });

    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM events'
    ).get().next;

    const result = db.prepare(
      'INSERT INTO events (title, date_display, badge, description, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title, date_display, badge || '', description || '', featured ? 1 : 0, maxOrder);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/events/:id
app.put('/api/events/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    const fields = {
      title: req.body.title !== undefined ? req.body.title : existing.title,
      date_display: req.body.date_display !== undefined ? req.body.date_display : existing.date_display,
      badge: req.body.badge !== undefined ? req.body.badge : existing.badge,
      description: req.body.description !== undefined ? req.body.description : existing.description,
      featured: req.body.featured !== undefined ? (req.body.featured ? 1 : 0) : existing.featured,
      sort_order: req.body.sort_order !== undefined ? req.body.sort_order : existing.sort_order,
    };

    db.prepare(
      'UPDATE events SET title = ?, date_display = ?, badge = ?, description = ?, featured = ?, sort_order = ? WHERE id = ?'
    ).run(fields.title, fields.date_display, fields.badge, fields.description, fields.featured, fields.sort_order, id);

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
app.delete('/api/events/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
//  CONTENT ROUTES
// ═══════════════════════════════════════════

// GET /api/content
app.get('/api/content', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM content ORDER BY section, key').all();

    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key] = row.value;
    }

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content
app.put('/api/content', (req, res) => {
  try {
    const db = getDb();
    const { section, key, value } = req.body;
    if (!section || !key) return res.status(400).json({ error: 'section and key are required' });

    db.prepare(
      'INSERT INTO content (section, key, value) VALUES (?, ?, ?) ON CONFLICT(section, key) DO UPDATE SET value = excluded.value'
    ).run(section, key, value || '');

    res.json({ success: true, section, key, value: value || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
//  THEME ROUTES
// ═══════════════════════════════════════════

// GET /api/themes
app.get('/api/themes', (req, res) => {
  try {
    const db = getDb();
    const themes = db.prepare('SELECT * FROM theme_presets ORDER BY id ASC').all();

    const parsed = themes.map(t => ({
      ...t,
      colors: JSON.parse(t.colors),
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/themes/:id/activate
app.put('/api/themes/:id/activate', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM theme_presets WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Theme not found' });

    const activate = db.transaction(() => {
      db.prepare('UPDATE theme_presets SET is_active = 0').run();
      db.prepare('UPDATE theme_presets SET is_active = 1 WHERE id = ?').run(id);
    });
    activate();

    const updated = db.prepare('SELECT * FROM theme_presets WHERE id = ?').get(id);
    res.json({ ...updated, colors: JSON.parse(updated.colors) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/themes - Create theme preset
app.post('/api/themes', (req, res) => {
  try {
    const db = getDb();
    const { name, colors } = req.body;
    if (!name || !colors) return res.status(400).json({ error: 'name and colors are required' });

    const colorsStr = typeof colors === 'string' ? colors : JSON.stringify(colors);
    const result = db.prepare(
      'INSERT INTO theme_presets (name, colors, is_active) VALUES (?, ?, 0)'
    ).run(name, colorsStr);

    const theme = db.prepare('SELECT * FROM theme_presets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...theme, colors: JSON.parse(theme.colors) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/themes/:id - Update theme preset
app.put('/api/themes/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM theme_presets WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Theme not found' });

    const { name, colors } = req.body;
    const newName = name !== undefined ? name : existing.name;
    const newColors = colors !== undefined
      ? (typeof colors === 'string' ? colors : JSON.stringify(colors))
      : existing.colors;

    db.prepare(
      'UPDATE theme_presets SET name = ?, colors = ? WHERE id = ?'
    ).run(newName, newColors, id);

    const updated = db.prepare('SELECT * FROM theme_presets WHERE id = ?').get(id);
    res.json({ ...updated, colors: JSON.parse(updated.colors) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/themes/:id
app.delete('/api/themes/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM theme_presets WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Theme not found' });
    if (existing.is_active) return res.status(400).json({ error: 'Cannot delete the active theme' });

    db.prepare('DELETE FROM theme_presets WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
//  SETTINGS ROUTES
// ═══════════════════════════════════════════

// GET /api/settings
app.get('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM settings').all();

    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
app.put('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const { key, value, settings } = req.body;

    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    if (settings && typeof settings === 'object') {
      // Bulk update
      const bulkUpdate = db.transaction(() => {
        for (const [k, v] of Object.entries(settings)) {
          upsert.run(k, v || '');
        }
      });
      bulkUpdate();
      res.json({ success: true, updated: Object.keys(settings).length });
    } else if (key) {
      // Single update
      upsert.run(key, value || '');
      res.json({ success: true, key, value: value || '' });
    } else {
      res.status(400).json({ error: 'Provide {key, value} or {settings: {...}}' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
//  EXPORT ROUTE
// ═══════════════════════════════════════════

// POST /api/export
app.post('/api/export', (req, res) => {
  try {
    const outputPath = exportSiteData();
    res.json({ success: true, path: outputPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/deploy - Export, build, commit, and push to GitHub
app.post('/api/deploy', async (req, res) => {
  const { execSync } = await import('child_process');
  const projectRoot = path.join(__dirname, '..');

  const steps = [];
  try {
    // Step 1: Export site data
    const outputPath = exportSiteData();
    steps.push({ step: 'export', success: true, message: 'Site data exported' });

    // Step 2: Build frontend
    try {
      execSync('npm run build', { cwd: projectRoot, timeout: 60000, stdio: 'pipe' });
      steps.push({ step: 'build', success: true, message: 'Frontend built successfully' });
    } catch (buildErr) {
      steps.push({ step: 'build', success: false, message: buildErr.stderr?.toString() || buildErr.message });
      return res.json({ success: false, steps, error: 'Build failed' });
    }

    // Step 3: Git add, commit, push
    try {
      execSync('git add public/data/site.json dist/', { cwd: projectRoot, stdio: 'pipe' });

      // Check if there are changes to commit
      try {
        execSync('git diff --cached --quiet', { cwd: projectRoot, stdio: 'pipe' });
        steps.push({ step: 'git', success: true, message: 'No changes to commit (already up to date)' });
      } catch {
        // There are staged changes, commit them
        execSync('git commit -m "Update site content via CMS"', { cwd: projectRoot, stdio: 'pipe' });
        steps.push({ step: 'commit', success: true, message: 'Changes committed' });

        execSync('git push', { cwd: projectRoot, timeout: 30000, stdio: 'pipe' });
        steps.push({ step: 'push', success: true, message: 'Pushed to GitHub' });
      }
    } catch (gitErr) {
      steps.push({ step: 'git', success: false, message: gitErr.stderr?.toString() || gitErr.message });
      return res.json({ success: false, steps, error: 'Git operation failed' });
    }

    res.json({ success: true, steps, message: 'Deployed successfully! GitHub Actions will rebuild the site.' });
  } catch (err) {
    res.status(500).json({ success: false, steps, error: err.message });
  }
});

// ═══════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n  Faregrounds CMS Server`);
  console.log(`  ──────────────────────`);
  console.log(`  Port:     ${PORT}`);
  console.log(`  Database: ${DB_PATH}`);
  console.log(`  Admin:    http://localhost:${PORT}/admin`);
  console.log(`  API:      http://localhost:${PORT}/api\n`);

  autoSeed();
});
