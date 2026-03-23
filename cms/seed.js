import { getDb } from './db.js';

function seed() {
  const db = getDb();

  // Check if data already exists
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM menu_categories').get().count;
  if (categoryCount > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');

  const insertCategory = db.prepare(
    'INSERT INTO menu_categories (name, slug, sort_order) VALUES (?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO menu_items (category_id, name, description, price, is_sub_item, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertEvent = db.prepare(
    'INSERT INTO events (title, date_display, badge, description, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertContent = db.prepare(
    'INSERT OR IGNORE INTO content (section, key, value) VALUES (?, ?, ?)'
  );
  const insertTheme = db.prepare(
    'INSERT INTO theme_presets (name, colors, is_active) VALUES (?, ?, ?)'
  );
  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  const seedAll = db.transaction(() => {
    // ── Menu Categories & Items ──

    // Appetizers
    const appetizersId = insertCategory.run('Appetizers', 'appetizers', 0).lastInsertRowid;
    const appetizers = [
      ['Pupu Platter', 'Skewers: beef, chicken & prawn. Chicken wings. Pork ribs. Pierogi. Lumpia.', '$26.99', 0, 0],
      ['Raclette Fries', 'Hand-cut fries smothered tableside in molten cheese.', '$19.99', 0, 1],
      ['Mezze Platter', 'Hummus, Green Goddess, whipped feta, veggies, pita.', '$14.99', 0, 2],
      ['Wings', 'Buffalo, Jamaican, Garlic Parm, BBQ, or Honey Sriracha. 6pc or 10pc.', '$11.99 / 14.99', 0, 3],
      ['Wing Dings', '', '$11.99', 0, 4],
      ['Popcorn Chicken', 'Lemon aioli, piment\u00f3n aioli, or FG secret sauce.', '$12.99', 0, 5],
      ['Nachos Deluxe', 'Cheese, lettuce, tomato, olives, salsa, sour cream. Add guac +$4.99.', '$14.99', 0, 6],
      ['Potato Skins', 'Cheese & scallions, or bacon & cheese with scallions.', '$12.99 / 14.99', 0, 7],
      ['Soft Pretzel', 'Pimento cheese dip.', '$10.99', 0, 8],
      ['Calamari', 'Lemon aioli or piment\u00f3n aioli.', '$15.99', 0, 9],
      ['Mozzarella Sticks', '', '$10.99', 0, 10],
    ];
    for (const [name, desc, price, sub, order] of appetizers) {
      insertItem.run(appetizersId, name, desc, price, sub, order);
    }

    // Salads & Soups
    const saladsId = insertCategory.run('Salads & Soups', 'salads-soups', 1).lastInsertRowid;
    const salads = [
      ['Caesar', 'House dressing, sourdough croutons, parmigiano.', '$14.99', 0, 0],
      ['Wedge', 'Buttermilk dressing, blue cheese, bacon, tomato.', '$15.99', 0, 1],
      ['House Salad', 'Mixed greens, cherry tomato, cucumber, shredded carrot, champagne vinaigrette.', '$12.99', 0, 2],
      ['Add Protein', 'Chicken, steak, or salmon on any salad.', '+$8.00', 1, 3],
      ['Quahog Chowder', 'Cup or bowl. A Nantucket classic.', '$7.99 / 10.99', 0, 4],
      ['French Onion Soup', '', '$11.99', 0, 5],
      ['The Best Chili', 'Beef long-simmered with Rancho Gordo heirloom beans. Cheese & sour cream.', '$12.99', 0, 6],
      ['Oxtail Pho', 'Bone broth, rice noodles, aromatic herbs & lime.', '$18.99', 0, 7],
    ];
    for (const [name, desc, price, sub, order] of salads) {
      insertItem.run(saladsId, name, desc, price, sub, order);
    }

    // Handhelds
    const handheldsId = insertCategory.run('Handhelds', 'handhelds', 2).lastInsertRowid;
    const handhelds = [
      ['Cheeseburger', 'American or cheddar, lettuce, tomato, onion, pickle, FG secret sauce. Add bacon or avo +$2.', '$16.99', 0, 0],
      ['Chicken Sandwich', 'Grilled or fried. Lettuce, tomato, onion, pickle. Fries. Choice of sauce.', '$16.99', 0, 1],
      ['Fish Sandwich', 'Fried cod with tartar sauce. Fries.', '$16.99', 0, 2],
      ['Open Faced Turkey', 'Turkey, stuffing, mashed potatoes, and gravy.', '$16.99', 0, 3],
      ['Chicken Quesadilla', '', '$15.99', 0, 4],
      ['Sub veggie burger', '', '+$2.00', 1, 5],
    ];
    for (const [name, desc, price, sub, order] of handhelds) {
      insertItem.run(handheldsId, name, desc, price, sub, order);
    }

    // Fries
    const friesId = insertCategory.run('Fries', 'fries', 3).lastInsertRowid;
    const fries = [
      ['Plain Fries', '', '$7.99', 0, 0],
      ['Truffle Fries', 'Parmigiano, fried parsley, truffle oil.', '$12.99', 0, 1],
      ['Waffle Fries', '', '$7.99', 0, 2],
      ['Pickle Fries', 'If a pickle were a french fry.', '$7.99', 0, 3],
    ];
    for (const [name, desc, price, sub, order] of fries) {
      insertItem.run(friesId, name, desc, price, sub, order);
    }

    // Bowls
    const bowlsId = insertCategory.run('Bowls', 'bowls', 4).lastInsertRowid;
    const bowls = [
      ['Build Your Bowl', 'Pick your protein, base, sauce & toppings.', '$21.99', 0, 0],
      ['Proteins', 'Salmon \u2022 Chicken \u2022 Steak \u2022 Tofu', '', 1, 1],
      ['Bases', 'Rice \u2022 Quinoa \u2022 Charred Kale \u2022 Salad Greens', '', 1, 2],
      ['Sauces', 'Tahini Lemon \u2022 Spicy Mayo \u2022 Green Goddess \u2022 Umami Soy Butter', '', 1, 3],
      ['Toppings', 'First free, then $2 each: Crispy Onion, Pickled Veg, Roasted Veg, Crispy Capers, Ranch Pepitas.', '', 1, 4],
    ];
    for (const [name, desc, price, sub, order] of bowls) {
      insertItem.run(bowlsId, name, desc, price, sub, order);
    }

    // Pizza
    const pizzaId = insertCategory.run('Pizza', 'pizza', 5).lastInsertRowid;
    const pizza = [
      ['Cheese Pizza', '14" or 18".', '$14.99 / 18.99', 0, 0],
      ['Toppings', 'Pepperoni, Peppers, Onions, Mushrooms, Sausage, Ham, Pineapple.', '+$2.00 / +2.50', 1, 1],
    ];
    for (const [name, desc, price, sub, order] of pizza) {
      insertItem.run(pizzaId, name, desc, price, sub, order);
    }

    // ── Events ──
    insertEvent.run('Maple Fest Weekend', 'Mar 28', 'Seasonal', 'Sugar on snow, live bluegrass, family-friendly fun, and maple treats all afternoon.', 1, 0);
    insertEvent.run('Bluegrass on the Lawn', 'Apr 12', 'Live Music', 'An easygoing early-evening set with local players and picnic-style seating.', 0, 1);
    insertEvent.run('Kids Craft Brunch', 'Apr 19', 'Family', 'Weekend brunch with hands-on activities, balloons, and seasonal treats for the little ones.', 0, 2);
    insertEvent.run('Island Supper Club', 'May 3', 'Prix Fixe', 'A five-course prix fixe dinner celebrating Nantucket\'s spring harvest.', 0, 3);

    // ── Content Blocks ──
    const contentBlocks = [
      ['hero', 'subtitle', 'Nantucket Island \u2022 Restaurant \u2022 Events \u2022 Community'],
      ['hero', 'tagline', 'Seasonal food, local gatherings, and fairground energy \u2014 all wrapped in a nostalgic island experience at 27 Fairgrounds Road.'],
      ['hero', 'menu_title', 'Lunch'],
      ['story', 'heading', 'A Farmstand Poster Turned Into a Restaurant.'],
      ['story', 'paragraph1', 'The Faregrounds blends comfort food, seasonal traditions, and island community into one warm, old-school gathering place. Everything about the experience \u2014 from the menu to the events to the brand itself \u2014 is designed to feel welcoming, a little nostalgic, and unmistakably Nantucket.'],
      ['story', 'paragraph2', 'We\u2019re bringing the sugar shack experience 30 miles out to sea \u2014 with seasonal menus, live music, community pop-ups, and the kind of energy that makes you want to stick around for one more cup of coffee.'],
      ['events', 'heading', 'More Than a Restaurant'],
      ['atmosphere', 'heading', 'Old-School Energy, Island Soul'],
      ['order', 'heading', 'Reserve, Order & Review'],
      ['order', 'description', 'Whether you\u2019re dining in or ordering from home \u2014 we\u2019ve got you covered.'],
      ['newsletter', 'heading', 'Stay in the Loop'],
      ['newsletter', 'description', 'Get the inside scoop on seasonal menus, events, and community happenings. No spam \u2014 just island-good stuff.'],
      ['footer', 'tagline', 'Seasonal food, local gatherings, and old-school community energy \u2014 built for Nantucket Island.'],
    ];
    for (const [section, key, value] of contentBlocks) {
      insertContent.run(section, key, value);
    }

    // ── Theme Presets ──
    insertTheme.run('Olive & Cream', JSON.stringify({
      cream: '#efe1ab',
      parchment: '#f6edc8',
      warmWhite: '#fff7e4',
      primary: '#4e5420',
      primaryMid: '#7a7e2e',
      accent: '#c79b34',
      accentLight: '#d4af5a',
      highlight: '#d96a1f',
      highlightHot: '#e8782a',
      ink: '#161616',
      body: '#3d3d3d',
      muted: '#6a6a6a',
    }), 1);

    insertTheme.run('Red Orange', JSON.stringify({
      cream: '#fde8d4',
      parchment: '#fef0e2',
      warmWhite: '#fff8f0',
      primary: '#8b2500',
      primaryMid: '#c0440f',
      accent: '#d96a1f',
      accentLight: '#e8782a',
      highlight: '#c79b34',
      highlightHot: '#d4af5a',
      ink: '#1a1008',
      body: '#3d2b1a',
      muted: '#6a5a4a',
    }), 0);

    insertTheme.run('Dark Orange', JSON.stringify({
      cream: '#f5e0c0',
      parchment: '#faecd4',
      warmWhite: '#fff5e6',
      primary: '#6e3310',
      primaryMid: '#a14b18',
      accent: '#d96a1f',
      accentLight: '#e8782a',
      highlight: '#4e5420',
      highlightHot: '#7a7e2e',
      ink: '#1a0f05',
      body: '#3d2a18',
      muted: '#6a5540',
    }), 0);

    insertTheme.run('Ocean Blue', JSON.stringify({
      cream: '#dce8f0',
      parchment: '#e8f0f6',
      warmWhite: '#f0f6fa',
      primary: '#003366',
      primaryMid: '#1a5c8a',
      accent: '#c79b34',
      accentLight: '#d4af5a',
      highlight: '#d96a1f',
      highlightHot: '#e8782a',
      ink: '#0a1520',
      body: '#2a3a4a',
      muted: '#5a6a7a',
    }), 0);

    insertTheme.run('Night Mode', JSON.stringify({
      cream: '#1a1a1a',
      parchment: '#222222',
      warmWhite: '#2a2a2a',
      primary: '#c79b34',
      primaryMid: '#d4af5a',
      accent: '#d96a1f',
      accentLight: '#e8782a',
      highlight: '#7a7e2e',
      highlightHot: '#4e5420',
      ink: '#f0e8d8',
      body: '#d8d0c0',
      muted: '#8a8070',
    }), 0);

    // ── Settings ──
    const settings = [
      ['site_name', 'The Faregrounds'],
      ['site_subtitle', 'Nantucket Island'],
      ['phone', '(508) 555-FARE'],
      ['address_line1', '27 Fairgrounds Road'],
      ['address_line2', 'Nantucket, MA 02554'],
      ['hours_weekday', 'Mon\u2013Thu: 8am \u2013 3pm'],
      ['hours_weekend', 'Fri\u2013Sun: 8am \u2013 8pm'],
      ['hours_events', 'Events: Seasonal evenings'],
      ['opentable_url', 'https://www.opentable.com'],
      ['ubereats_url', 'https://www.ubereats.com'],
      ['doordash_url', 'https://www.doordash.com'],
      ['grubhub_url', 'https://www.grubhub.com'],
      ['yelp_url', 'https://www.yelp.com'],
      ['google_maps_url', 'https://maps.google.com/?q=27+Fairgrounds+Rd,+Nantucket,+MA+02554'],
      ['instagram_url', '#'],
      ['facebook_url', '#'],
      ['twitter_url', '#'],
      ['menu_pdf_url', '/the-faregrounds/menu.pdf'],
    ];
    for (const [key, value] of settings) {
      insertSetting.run(key, value);
    }
  });

  seedAll();
  console.log('Database seeded successfully.');
}

seed();
