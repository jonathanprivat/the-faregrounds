import { useState, useEffect, useRef, useCallback } from "react";

const B = import.meta.env.BASE_URL;
const A = {
  logo: B + "images/logo.png",
  seal: B + "images/seal.png",
  whale: B + "images/whale.png",
  maplefest: B + "images/maplefest.jpeg",
  wallpic1: B + "images/wallpic1.jpeg",
  wallpic2: B + "images/wallpic2.jpeg",
  wallpic_full1: B + "images/wallpic_full1.jpeg",
  wallpic_full2: B + "images/wallpic_full2.jpeg",
  fairCrowd: B + "images/fairCrowd.jpeg",
  nantucketMap: B + "images/nantucketMap.png",
  ticket: B + "images/ticket.jpeg",
  logoFrame: B + "images/logoFrame.svg",
  whaleHat: B + "images/whaleHat.svg",
  whaleTailSvg: B + "images/whaleTailSvg.svg",
  swashL: B + "images/swashL.png",
  swashR: B + "images/swashR.png",
  swashL2: B + "images/swashL2.png",
  swashR2: B + "images/swashR2.png",
  truck: B + "images/truck.png",
  bracketL: B + "images/bracketL.png",
  bracketR: B + "images/bracketR.png",
  logoOrange: B + "images/logoOrange.svg",
  logoArch: B + "images/logoArch.svg",
  uberEatsBrand: B + "images/uberEatsBrand.svg",
};

// ─── Brand Tokens ───────────────────────────────────────────────
const C = {
  cream:     "#efe1ab",
  parchment: "#f6edc8",
  warmWhite: "#fff7e4",
  olive:     "#4e5420",
  oliveMid:  "#7a7e2e",
  gold:      "#c79b34",
  goldLight: "#d4af5a",
  orange:    "#d96a1f",
  orangeHot: "#e8782a",
  ink:       "#161616",
  body:      "#3d3d3d",
  muted:     "#6a6a6a",
};

// ─── Scroll reveal hook ─────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, direction = "up", style: extra = {} }) {
  const [ref, visible] = useReveal(0.12);
  const t = { up: "translateY(40px)", down: "translateY(-40px)", left: "translateX(40px)", right: "translateX(-40px)", none: "none" };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : t[direction],
      transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      ...extra,
    }}>{children}</div>
  );
}

// ─── Real Asset Components ──────────────────────────────────────

function Logo({ size = 180, style = {} }) {
  return <img src={A.logo} alt="The Faregrounds" draggable={false} style={{ width: size, height: "auto", objectFit: "contain", ...style }} />;
}

function SealColor({ size = 220, style = {} }) {
  return <img src={A.seal} alt="The Faregrounds Seal" draggable={false} style={{ width: size, height: "auto", objectFit: "contain", ...style }} />;
}

function WhaleTail({ size = 48, style = {} }) {
  return <img src={A.whaleTailSvg} alt="" draggable={false} className="ink-art" style={{ width: size, height: "auto", objectFit: "contain", flexShrink: 0, ...style }} />;
}

function WhaleHat({ size = 120, style = {} }) {
  return <img src={A.whaleHat} alt="" draggable={false} className="ink-art" style={{ width: size, height: "auto", objectFit: "contain", flexShrink: 0, ...style }} />;
}

function Swash({ flip = false, style = {} }) {
  return <img src={flip ? A.swashR : A.swashL} alt="" draggable={false} className="ink-art" style={{ width: "100%", height: "auto", display: "block", ...style }} />;
}

function Swash2({ flip = false, style = {} }) {
  return <img src={flip ? A.swashR2 : A.swashL2} alt="" draggable={false} className="ink-art" style={{ width: "100%", height: "auto", display: "block", ...style }} />;
}

function Bracket({ side = "left", style = {} }) {
  return <img src={side === "left" ? A.bracketL : A.bracketR} alt="" draggable={false} className="ink-art" style={{ height: "100%", width: "auto", display: "block", ...style }} />;
}

function Truck({ style = {} }) {
  return <img src={A.truck} alt="Nantucket Truck" draggable={false} className="ink-art" style={{ width: "100%", maxWidth: 300, height: "auto", objectFit: "contain", ...style }} />;
}

function MapleLeaf({ size = 20, color = "#c0440f", style = {} }) {
  return (
    <svg style={{ flexShrink: 0, ...style }} width={size} height={size} viewBox="0 0 32 32" fill={color}>
      <path d="M16 2l2 6 4-3-1 5 6 1-4 4 5 3-6 1 1 5-4-3-3 7-3-7-4 3 1-5-6-1 5-3-4-4 6-1-1-5 4 3z" opacity="0.85"/>
    </svg>
  );
}

// ─── Hamburger Icon ─────────────────────────────────────────────
function HamburgerIcon({ open, color = C.olive }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "all 0.3s", transform: open ? "rotate(45deg) translate(4px, -2px)" : "none", transformOrigin: "center" }}/>
      <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "all 0.3s", opacity: open ? 0 : 1 }}/>
      <line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "all 0.3s", transform: open ? "rotate(-45deg) translate(4px, 2px)" : "none", transformOrigin: "center" }}/>
    </svg>
  );
}

// ─── Data ───────────────────────────────────────────────────────
const MENU_DATA = {
  appetizers: [
    { name: "Pupu Platter", price: "26.99", desc: "Skewers: beef, chicken & prawn. Chicken wings. Pork ribs. Pierogi. Lumpia." },
    { name: "Raclette Fries", price: "19.99", desc: "Hand-cut fries smothered tableside in molten cheese." },
    { name: "Mezze Platter", price: "14.99", desc: "Hummus, Green Goddess, whipped feta, veggies, pita." },
    { name: "Wings", price: "11.99 / 14.99", desc: "Buffalo, Jamaican, Garlic Parm, BBQ, or Honey Sriracha. 6pc or 10pc." },
    { name: "Wing Dings", price: "11.99", desc: "" },
    { name: "Popcorn Chicken", price: "12.99", desc: "Lemon aioli, pimentón aioli, or FG secret sauce." },
    { name: "Nachos Deluxe", price: "14.99", desc: "Cheese, lettuce, tomato, olives, salsa, sour cream. Add guac +$4.99." },
    { name: "Potato Skins", price: "12.99 / 14.99", desc: "Cheese & scallions, or bacon & cheese with scallions." },
    { name: "Soft Pretzel", price: "10.99", desc: "Pimento cheese dip." },
    { name: "Calamari", price: "15.99", desc: "Lemon aioli or pimentón aioli." },
    { name: "Mozzarella Sticks", price: "10.99", desc: "" },
  ],
  "salads & soups": [
    { name: "Caesar", price: "14.99", desc: "House dressing, sourdough croutons, parmigiano." },
    { name: "Wedge", price: "15.99", desc: "Buttermilk dressing, blue cheese, bacon, tomato." },
    { name: "House Salad", price: "12.99", desc: "Mixed greens, cherry tomato, cucumber, shredded carrot, champagne vinaigrette." },
    { name: "Add Protein", price: "+8.00", desc: "Chicken, steak, or salmon on any salad.", sub: true },
    { name: "Quahog Chowder", price: "7.99 / 10.99", desc: "Cup or bowl. A Nantucket classic." },
    { name: "French Onion Soup", price: "11.99", desc: "" },
    { name: "The Best Chili", price: "12.99", desc: "Beef long-simmered with Rancho Gordo heirloom beans. Cheese & sour cream." },
    { name: "Oxtail Pho", price: "18.99", desc: "Bone broth, rice noodles, aromatic herbs & lime." },
  ],
  handhelds: [
    { name: "Cheeseburger", price: "16.99", desc: "American or cheddar, lettuce, tomato, onion, pickle, FG secret sauce. Add bacon or avo +$2." },
    { name: "Chicken Sandwich", price: "16.99", desc: "Grilled or fried. Lettuce, tomato, onion, pickle. Fries. Choice of sauce." },
    { name: "Fish Sandwich", price: "16.99", desc: "Fried cod with tartar sauce. Fries." },
    { name: "Open Faced Turkey", price: "16.99", desc: "Turkey, stuffing, mashed potatoes, and gravy." },
    { name: "Chicken Quesadilla", price: "15.99", desc: "" },
    { name: "Sub veggie burger", price: "+2.00", desc: "", sub: true },
  ],
  fries: [
    { name: "Plain Fries", price: "7.99", desc: "" },
    { name: "Truffle Fries", price: "12.99", desc: "Parmigiano, fried parsley, truffle oil." },
    { name: "Waffle Fries", price: "7.99", desc: "" },
    { name: "Pickle Fries", price: "7.99", desc: "If a pickle were a french fry." },
  ],
  bowls: [
    { name: "Build Your Bowl", price: "21.99", desc: "Pick your protein, base, sauce & toppings." },
    { name: "Proteins", price: "", desc: "Salmon • Chicken • Steak • Tofu", sub: true },
    { name: "Bases", price: "", desc: "Rice • Quinoa • Charred Kale • Salad Greens", sub: true },
    { name: "Sauces", price: "", desc: "Tahini Lemon • Spicy Mayo • Green Goddess • Umami Soy Butter", sub: true },
    { name: "Toppings", price: "", desc: "First free, then $2 each: Crispy Onion, Pickled Veg, Roasted Veg, Crispy Capers, Ranch Pepitas.", sub: true },
  ],
  pizza: [
    { name: "Cheese Pizza", price: "14.99 / 18.99", desc: '14" or 18".' },
    { name: "Toppings", price: "+2.00 / +2.50", desc: "Pepperoni, Peppers, Onions, Mushrooms, Sausage, Ham, Pineapple.", sub: true },
  ],
};

const EVENTS = [
  { title: "Maple Fest Weekend", date: "Mar 28", badge: "Seasonal", desc: "Sugar on snow, live bluegrass, family-friendly fun, and maple treats all afternoon.", featured: true },
  { title: "Bluegrass on the Lawn", date: "Apr 12", badge: "Live Music", desc: "An easygoing early-evening set with local players and picnic-style seating." },
  { title: "Kids Craft Brunch", date: "Apr 19", badge: "Family", desc: "Weekend brunch with hands-on activities, balloons, and seasonal treats for the little ones." },
  { title: "Island Supper Club", date: "May 3", badge: "Prix Fixe", desc: "A five-course prix fixe dinner celebrating Nantucket’s spring harvest." },
];

const NAV_LINKS = [
  { label: "Menu", id: "menu" },
  { label: "Events", id: "events" },
  { label: "Story", id: "story" },
  { label: "Order", id: "order" },
  { label: "Visit", id: "visit" },
];

// ─── Sub-components ─────────────────────────────────────────────

function CornerDot({ style }) {
  return <div style={{ position: "absolute", width: 10, height: 10, borderRadius: "50%", background: C.oliveMid, opacity: 0.4, ...style }} />;
}

function PosterCard({ children, hoverable = true, style = {} }) {
  return (
    <div className={hoverable ? "poster-card poster-card-hover" : "poster-card"} style={{ position: "relative", ...style }}>
      <CornerDot style={{ top: 16, left: 16 }} />
      <CornerDot style={{ top: 16, right: 16 }} />
      <CornerDot style={{ bottom: 16, left: 16 }} />
      <CornerDot style={{ bottom: 16, right: 16 }} />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

function Divider({ compact = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: compact ? "16px 0" : "28px 0", opacity: 0.85 }}>
      <div className="divider-line" />
      <WhaleHat size={compact ? 60 : 90} />
      <div className="divider-line" />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="ff-ui" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.oliveMid, fontWeight: 600 }}>
      {children}
    </div>
  );
}

function PhotoBlock({ gradient, aspect = "4/3", label = "", style = {} }) {
  return (
    <div className="photo-placeholder" style={{ aspectRatio: aspect, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      {label && <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: C.oliveMid, opacity: 0.4 }}>{label}</span>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function TheFaregroundsHomepage() {
  const [siteData, setSiteData] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("appetizers");
  const [menuFade, setMenuFade] = useState(false);
  const [menuType, setMenuType] = useState(null); // resolved after data loads
  const [email, setEmail] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [gallerySlide, setGallerySlide] = useState(0);
  const [colorMode, setColorMode] = useState(() => localStorage.getItem("fg_color_mode") || "system");
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    fetch(B + 'data/site.json?v=' + Date.now())
      .then(r => r.json())
      .then(data => setSiteData(data))
      .catch(() => setSiteData(null));
  }, []);

  // Listen for system dark mode changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Persist color mode preference
  const cycleColorMode = useCallback(() => {
    const next = colorMode === "system" ? "light" : colorMode === "light" ? "dark" : "system";
    setColorMode(next);
    localStorage.setItem("fg_color_mode", next);
  }, [colorMode]);

  const isDark = colorMode === "dark" || (colorMode === "system" && systemDark);

  // Flexible menus system
  const allMenus = siteData?.menus || [];
  const resolveMenuType = () => {
    if (allMenus.length === 0) return "lunch";
    const hour = new Date().getHours();
    const auto = allMenus.find(m => m.autoTime && hour >= m.autoTime.start && hour < m.autoTime.end);
    return auto ? auto.id : allMenus[0].id;
  };
  const currentMenuType = menuType || resolveMenuType();
  const currentMenu = allMenus.find(m => m.id === currentMenuType) || allMenus[0];
  const menuData = currentMenu?.items || siteData?.lunchMenu || siteData?.menu || MENU_DATA;
  const menuPdfUrl = currentMenu?.pdfUrl || "";
  const eventsData = (siteData?.events || EVENTS).map(e => ({
    ...e,
    date: e.date_display || e.date,
  }));
  const content = siteData?.content || {};
  const siteSettings = siteData?.settings || {};

  // Resolve theme: check for seasonal auto-switch, then fall back to manually active preset
  const resolveActivePreset = () => {
    const presets = siteData?.themePresets || [];
    const autoEnabled = siteData?.settings?.auto_theme !== "false";
    if (autoEnabled) {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const today = mm + "-" + dd;
      for (const p of presets) {
        if (!p.dateRange) continue;
        const { start, end } = p.dateRange;
        if (!start || !end) continue;
        // Handle ranges that cross year boundary (e.g. Dec 27 - Jan 2)
        const inRange = start <= end
          ? (today >= start && today <= end)
          : (today >= start || today <= end);
        if (inRange) return p;
      }
    }
    return presets.find(p => p.active);
  };
  const activePreset = resolveActivePreset();
  const themeColors = activePreset
    ? (isDark && activePreset.darkColors ? activePreset.darkColors : activePreset.colors)
    : (siteData?.theme || null);

  const colors = themeColors ? {
    cream: themeColors.cream,
    parchment: themeColors.parchment,
    warmWhite: themeColors.warmWhite,
    olive: themeColors.primary,
    oliveMid: themeColors.primaryMid,
    gold: themeColors.accent,
    goldLight: themeColors.accentLight,
    orange: themeColors.highlight,
    orangeHot: themeColors.highlightHot,
    ink: themeColors.ink,
    body: themeColors.body,
    muted: themeColors.muted,
  } : C;

  // Compute hue-rotate for ink illustrations to match theme accent color
  const hexToHue = (hex) => {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    if (max === min) return 0;
    let h; const d = max - min;
    if (max === r) h = ((g-b)/d)%6; else if (max === g) h = (b-r)/d+2; else h = (r-g)/d+4;
    h = Math.round(h*60); return h < 0 ? h+360 : h;
  };
  const BASE_ART_HUE = 25; // baked-in orange hue of illustrations
  const SEPIA_BASE_HUE = 39; // hue produced by sepia(1) filter
  const accentHue = hexToHue(themeColors?.accent || "#d96a1f");
  const artHueShift = ((accentHue - BASE_ART_HUE + 540) % 360) - 180; // light mode
  const artHueDarkShift = ((accentHue - SEPIA_BASE_HUE + 540) % 360) - 180; // dark mode (from sepia base)

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.id);
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navSolid = scrollY > 60;
  const heroParallax = Math.min(scrollY * 0.2, 100);

  const smoothScrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: "smooth" });
    setMobileMenuOpen(false);
  }, []);

  const switchMenu = useCallback((key) => {
    if (key === activeMenu) return;
    setMenuFade(true);
    setTimeout(() => { setActiveMenu(key); setMenuFade(false); }, 200);
  }, [activeMenu]);

  const switchMenuType = useCallback((type) => {
    if (type === currentMenuType) return;
    setMenuFade(true);
    setTimeout(() => {
      setMenuType(type);
      const target = allMenus.find(m => m.id === type);
      const firstCat = target?.items ? Object.keys(target.items)[0] : "appetizers";
      setActiveMenu(firstCat || "appetizers");
      setMenuFade(false);
    }, 200);
  }, [currentMenuType, allMenus]);

  const css = `
    @font-face { font-family: 'ZebrawoodFill'; src: url('${B}fonts/ZebrawoodFill.otf') format('opentype'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BogueSlab'; src: url('${B}fonts/BogueSlab-2.otf') format('opentype'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BogueSlab'; src: url('${B}fonts/BogueSlab-3.otf') format('opentype'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BogueSlab'; src: url('${B}fonts/BogueSlab-4.otf') format('opentype'); font-weight: 300; font-style: normal; font-display: swap; }

    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    button { cursor: pointer; }
    img { user-select: none; -webkit-user-drag: none; }

    .ff-display { font-family: "ZebrawoodFill", "Playfair Display", Georgia, serif; }
    .ff-body { font-family: 'BogueSlab', Georgia, serif; }
    .ff-ui { font-family: 'Source Sans 3', 'Segoe UI', Arial, sans-serif; }
    .ff-accent { font-family: 'p22-franklin-caslon', 'P22 Franklin Caslon', Georgia, serif; font-style: italic; }

    .ink-shadow { text-shadow: 0 2px 0 rgba(78,84,32,0.08); }
    .ink-art { filter: hue-rotate(${artHueShift}deg); transition: filter 0.3s ease; }
    [data-dark="true"] .ink-art { filter: invert(1) sepia(1) saturate(3) hue-rotate(${artHueDarkShift}deg) brightness(0.85); }

    .paper-texture {
      background:
        radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.18), transparent 50%),
        radial-gradient(ellipse at 85% 20%, rgba(255,255,255,0.1), transparent 40%),
        radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.02), transparent 50%),
        ${colors.cream};
    }

    .poster-card {
      position: relative; overflow: hidden; border-radius: 24px;
      background: ${colors.parchment}; border: 3px solid ${colors.olive};
      box-shadow: inset 0 0 0 2px rgba(122,126,46,0.3), 0 4px 24px rgba(0,0,0,0.05);
      transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s;
    }
    .poster-card::after {
      content: ''; position: absolute; inset: 10px;
      border: 1.5px solid rgba(122,126,46,0.2); border-radius: 18px; pointer-events: none;
    }
    .poster-card-hover:hover {
      transform: translateY(-4px);
      box-shadow: inset 0 0 0 2px rgba(122,126,46,0.3), 0 16px 48px rgba(0,0,0,0.08);
    }

    .btn-primary, .btn-secondary, .btn-accent {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 999px;
      font-family: 'Source Sans 3', sans-serif; font-weight: 700;
      font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase;
      cursor: pointer; transition: all 0.3s ease; text-decoration: none;
    }
    .btn-primary { border: 2px solid ${colors.olive}; background: ${colors.oliveMid}; color: ${colors.warmWhite}; }
    .btn-primary:hover { background: ${colors.olive}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(78,84,32,0.2); }
    .btn-secondary { border: 2px solid ${colors.olive}; background: transparent; color: ${colors.olive}; }
    .btn-secondary:hover { background: ${colors.olive}; color: ${colors.warmWhite}; transform: translateY(-2px); }
    .btn-accent { border: 2px solid ${colors.olive}; background: ${colors.orange}; color: ${colors.warmWhite}; }
    .btn-accent:hover { background: ${colors.orangeHot}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(217,106,31,0.25); }

    .tag {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      border: 1.5px solid ${colors.olive}; background: ${colors.cream};
      color: ${colors.olive}; font-family: 'Source Sans 3', sans-serif;
      font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    }

    .menu-tab {
      padding: 10px 28px; border-radius: 999px; border: 2px solid ${colors.olive};
      font-family: 'Source Sans 3', sans-serif; font-weight: 700;
      font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
      cursor: pointer; transition: all 0.25s ease; background: transparent; color: ${colors.olive};
    }
    .menu-tab-active { background: ${colors.olive}; color: ${colors.warmWhite}; }
    .menu-tab:not(.menu-tab-active):hover { background: rgba(78,84,32,0.08); }

    .photo-placeholder {
      border-radius: 16px; border: 2px solid rgba(122,126,46,0.25); overflow: hidden;
    }

    .nav-link {
      position: relative; color: ${colors.olive};
      font-family: 'Source Sans 3', sans-serif; font-weight: 600;
      font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
      cursor: pointer; padding: 4px 0; text-decoration: none; transition: color 0.2s;
      background: none; border: none;
    }
    .nav-link::after {
      content: ''; position: absolute; bottom: 0; left: 0;
      width: 0; height: 2px; background: ${colors.orange}; transition: width 0.3s ease;
    }
    .nav-link:hover { color: ${colors.orange}; }
    .nav-link:hover::after { width: 100%; }
    .nav-link-active { color: ${colors.orange}; }
    .nav-link-active::after { width: 100%; }

    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .float { animation: float 6s ease-in-out infinite; }

    .divider-line {
      height: 2px; flex: 1;
      background: linear-gradient(90deg, transparent, rgba(122,126,46,0.3), transparent);
    }

    .menu-item-card {
      border-radius: 18px; border: 2px solid rgba(122,126,46,0.25);
      background: ${colors.cream}; padding: 24px;
      display: flex; flex-direction: column; gap: 8px;
      transition: border-color 0.25s, background 0.25s, transform 0.25s; cursor: default;
    }
    .menu-item-card:hover { border-color: ${colors.oliveMid}; background: ${colors.parchment}; transform: translateY(-2px); }

    .event-card {
      border-radius: 20px; padding: 20px;
      transition: border-color 0.25s, transform 0.3s, box-shadow 0.3s; cursor: default;
    }
    .event-card:hover { transform: translateX(6px); box-shadow: -4px 0 12px rgba(0,0,0,0.04); }

    .social-icon {
      width: 38px; height: 38px; border-radius: 999px;
      border: 2px solid rgba(122,126,46,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: ${colors.olive};
      font-family: 'Source Sans 3', sans-serif; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.25s;
    }
    .social-icon:hover { background: ${colors.olive}; color: ${colors.warmWhite}; border-color: ${colors.olive}; }

    .footer-link {
      font-size: 16px; color: ${colors.body}; cursor: pointer; transition: color 0.2s;
      text-decoration: none; background: none; border: none; padding: 0;
      font-family: 'BogueSlab', Georgia, serif; text-align: left;
    }
    .footer-link:hover { color: ${colors.orange}; }

    .mobile-overlay {
      position: fixed; inset: 0; z-index: 99;
      background: rgba(22,22,22,0.4); backdrop-filter: blur(4px); transition: opacity 0.3s;
    }
    .mobile-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 101;
      width: min(320px, 85vw); background: ${colors.parchment};
      border-left: 3px solid ${colors.olive};
      padding: 80px 32px 40px; display: flex; flex-direction: column; gap: 8px;
      transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
    }
    .mobile-drawer-link {
      padding: 14px 0; font-family: 'BogueSlab', Georgia, serif;
      font-size: 24px; font-weight: 700; color: ${colors.ink};
      border-bottom: 1px solid rgba(122,126,46,0.15);
      cursor: pointer; transition: color 0.2s; background: none;
      border-top: none; border-left: none; border-right: none; text-align: left; width: 100%;
    }
    .mobile-drawer-link:hover { color: ${colors.orange}; }

    .gallery-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto; gap: 16px;
    }

    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

    /* ── Tablet (≤1024px) ── */
    @media (max-width: 1024px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .story-grid { grid-template-columns: 1fr !important; }
      .events-grid { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
      .gallery-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; gap: 12px !important; }
      .gallery-item { grid-column: auto !important; grid-row: auto !important; min-height: 160px !important; }
      .gallery-item:last-child { grid-column: 1 / 3 !important; }

      .pillar-grid { grid-template-columns: 1fr 1fr !important; }
      .order-grid { grid-template-columns: 1fr 1fr !important; }
      .poster-card { border-radius: 18px !important; }
      .poster-card::after { inset: 7px !important; border-radius: 14px !important; }
      .menu-items-grid { grid-template-columns: 1fr 1fr !important; }
    }

    /* ── Phone (≤640px) ── */
    @media (max-width: 640px) {
      .menu-items-grid { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr !important; }
      .hero-tags { display: none !important; }
      .pillar-grid { grid-template-columns: 1fr !important; }
      .order-grid { grid-template-columns: 1fr !important; }
      .gallery-grid { grid-template-columns: 1fr !important; }
      .gallery-item { min-height: 140px !important; aspect-ratio: 16/9 !important; grid-column: auto !important; }
      .poster-card { border-radius: 14px !important; border-width: 2px !important; }
      .poster-card::after { inset: 5px !important; border-radius: 10px !important; }
      .poster-card-hover:hover { transform: none !important; }
      .btn-primary, .btn-secondary, .btn-accent { padding: 12px 24px !important; font-size: 12px !important; }
      .menu-tab { padding: 8px 16px !important; font-size: 10px !important; }
      .tag { font-size: 9px !important; padding: 3px 10px !important; }
      .event-card { padding: 16px !important; }
      .event-card:hover { transform: none !important; }
      .nav-link { font-size: 11px !important; }
      .social-icon { width: 32px !important; height: 32px !important; font-size: 10px !important; }
      .menu-item-card { padding: 14px 16px !important; }
      .menu-item-card:hover { transform: none !important; }
      .divider-line { height: 1px !important; }
      .scrollbar-hide { gap: 4px !important; }
    }

    /* ── Small phone (≤400px) ── */
    @media (max-width: 400px) {
      .btn-primary, .btn-secondary, .btn-accent { padding: 10px 20px !important; font-size: 11px !important; letter-spacing: 0.12em !important; }
      .footer-grid { gap: 24px !important; }
    }
  `;

  return (
    <div className="paper-texture" data-dark={isDark} style={{ minHeight: "100vh", color: colors.ink, overflowX: "hidden" }}>
      <style>{css}</style>

      {/* ═══════ NAV ═══════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: navSolid ? "10px 0" : "18px 0",
        background: navSolid ? (colors.cream + "ea") : "transparent",
        backdropFilter: navSolid ? "blur(16px)" : "none",
        WebkitBackdropFilter: navSolid ? "blur(16px)" : "none",
        borderBottom: navSolid ? "1px solid rgba(122,126,46,0.12)" : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <WhaleTail size={26} />
            <span className="ff-display" style={{ fontSize: 22, fontWeight: 900, color: colors.olive, letterSpacing: "-0.02em" }}>{siteSettings.site_name || "The Faregrounds"}</span>
          </button>
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} className={`nav-link ${activeSection === id ? "nav-link-active" : ""}`} onClick={() => smoothScrollTo(id)}>{label}</button>
            ))}
            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: 11 }} onClick={() => smoothScrollTo("visit")}>Reserve</button>
            <button onClick={cycleColorMode} title={colorMode === "system" ? "Theme: System" : colorMode === "light" ? "Theme: Light" : "Theme: Dark"} style={{
              background: "none", border: `1.5px solid ${colors.olive}30`, borderRadius: "50%",
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s", color: colors.olive, fontSize: 16,
            }}>
              {colorMode === "system" ? "◐" : colorMode === "light" ? "☀" : "☾"}
            </button>
          </div>
          <div className="hamburger-btn" style={{ display: "none", alignItems: "center", gap: 8 }}>
            <button onClick={cycleColorMode} title={colorMode === "system" ? "Theme: System" : colorMode === "light" ? "Theme: Light" : "Theme: Dark"} style={{
              background: "none", border: `1.5px solid ${colors.olive}30`, borderRadius: "50%",
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: colors.olive, fontSize: 15,
            }}>
              {colorMode === "system" ? "◐" : colorMode === "light" ? "☀" : "☾"}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", padding: 4 }}>
              <HamburgerIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      <div className="mobile-drawer" style={{ transform: mobileMenuOpen ? "translateX(0)" : "translateX(100%)" }}>
        <button onClick={() => setMobileMenuOpen(false)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", padding: 4 }}>
          <HamburgerIcon open={true} />
        </button>
        {NAV_LINKS.map(({ label, id }) => (
          <button key={id} className="mobile-drawer-link" onClick={() => smoothScrollTo(id)}>{label}</button>
        ))}
        <div style={{ marginTop: 16 }}>
          <button className="btn-accent" style={{ width: "100%", justifyContent: "center" }} onClick={() => smoothScrollTo("visit")}>Reserve a Table</button>
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
          <WhaleTail size={20} />
          <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.14em", color: colors.muted }}>Nantucket Island</span>
        </div>
      </div>

      {/* ═══════ HERO ═══════ */}
      <section style={{ paddingTop: 100, paddingBottom: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <Reveal>
            <PosterCard hoverable={false}>
              <div style={{ padding: "clamp(32px, 5vw, 56px) clamp(20px, 4vw, 40px)", overflow: "hidden" }}>
                {/* Parallax watermark */}
                <div style={{ position: "absolute", top: -20, left: "50%", transform: `translate(-50%, ${heroParallax}px)`, opacity: 0.04, pointerEvents: "none" }}>
                  <Logo size={500} />
                </div>

                <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
                  <SectionLabel>{content?.hero?.subtitle || "Nantucket Island • Restaurant • Events • Community"}</SectionLabel>

                  {/* Title with real swashes */}
                  <div style={{ margin: "24px auto 0", maxWidth: 820, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "clamp(60px, 12vw, 140px)", opacity: 0.85 }}>
                      <Swash />
                    </div>
                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: "clamp(60px, 12vw, 140px)", opacity: 0.85 }}>
                      <Swash flip />
                    </div>
                    <h1 style={{ margin: 0, padding: 0, lineHeight: 1 }}>
                      <img src={A.logoArch} alt="The Faregrounds - Nantucket Island Restaurant" className="ink-shadow ink-art" style={{
                        width: "clamp(280px, 55vw, 620px)", height: "auto", display: "block", margin: "0 auto",
                      }} />
                    </h1>
                  </div>

                  <p className="ff-accent" style={{
                    fontSize: "clamp(19px, 2.2vw, 24px)", lineHeight: 1.65, color: colors.body,
                    maxWidth: 560, margin: "20px auto 0",
                  }}>
                    {content?.hero?.tagline || "Seasonal food, local gatherings, and fairground energy — all wrapped in a nostalgic island experience at 27 Fairgrounds Road."}
                  </p>

                  <Divider />

                  <div className="hero-tags" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 }}>
                    {["Seasonal Menu", "Community Events", "Family Friendly", "Island Charm", "Live Music"].map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 28 }}>
                    <button className="btn-primary" onClick={() => smoothScrollTo("menu")}>View Menu</button>
                    {menuPdfUrl && <a href={menuPdfUrl} download className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex" }}>Download {currentMenu?.label || "Lunch"} Menu (PDF)</a>}
                    <button className="btn-secondary" onClick={() => smoothScrollTo("events")}>Upcoming Events</button>
                  </div>
                </div>

                {/* Truck illustration */}
                <div className="float" style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "40px auto 0" }}>
                  <Truck style={{ maxWidth: 400 }} />
                  <span className="ff-accent" style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: colors.oliveMid, textAlign: "center", marginTop: 14 }}>
                    Old-School Island Gathering Place
                  </span>
                </div>
              </div>
            </PosterCard>
          </Reveal>
        </div>
      </section>

      {/* ═══════ STORY ═══════ */}
      <section id="story" style={{ padding: "40px 0 60px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <div className="story-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 24 }}>
            <Reveal>
              <PosterCard style={{ height: "100%" }}>
                <div style={{ padding: "clamp(24px, 4vw, 40px)" }}>
                  <SectionLabel>Our Story</SectionLabel>
                  <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 0.96, marginTop: 12 }}>
                    {content?.story?.heading || "A Farmstand Poster Turned Into a Restaurant."}
                  </h2>
                  <Divider />
                  <p className="ff-accent" style={{ fontSize: "clamp(17px, 1.7vw, 21px)", lineHeight: 1.75, color: colors.body }}>
                    {content?.story?.paragraph1 || "The Faregrounds blends comfort food, seasonal traditions, and island community into one warm, old-school gathering place. Everything about the experience — from the menu to the events to the brand itself — is designed to feel welcoming, a little nostalgic, and unmistakably Nantucket."}
                  </p>
                  <p className="ff-accent" style={{ fontSize: "clamp(17px, 1.7vw, 21px)", lineHeight: 1.75, color: colors.body, marginTop: 16 }}>
                    {content?.story?.paragraph2 || "We’re bringing the sugar shack experience 30 miles out to sea — with seasonal menus, live music, community pop-ups, and the kind of energy that makes you want to stick around for one more cup of coffee."}
                  </p>
                  <div style={{ marginTop: 28 }}>
                    <button className="btn-secondary" onClick={() => smoothScrollTo("visit")}>Come Visit Us</button>
                  </div>
                </div>
              </PosterCard>
            </Reveal>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Reveal delay={0.12}>
                <div style={{ borderRadius: 24, border: "2px solid rgba(122,126,46,0.25)", background: `linear-gradient(135deg, ${colors.cream}, ${colors.parchment})`, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <img src={A.ticket} alt="1888 Nantucket Agricultural Society Exhibition Ticket" draggable={false} style={{ width: "100%", maxWidth: 500, height: "auto", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: `1.5px solid ${colors.olive}30` }} />
                  <span className="ff-accent" style={{ fontSize: 13, color: colors.oliveMid, textAlign: "center" }}>
                    33rd Annual Exhibition, 1888 — Where it all began.
                  </span>
                </div>
              </Reveal>
              {[
                { title: "Seasonal Menu", body: "Warm plates that rotate with the season — crafted from local ingredients and island traditions.", delay: 0.15, icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.olive} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6c-2 0-4 2-4 4 0 3 4 6 4 8 0-2 4-5 4-8 0-2-2-4-4-4z" fill={colors.olive} opacity="0.15"/><path d="M12 6c-2 0-4 2-4 4 0 3 4 6 4 8 0-2 4-5 4-8 0-2-2-4-4-4z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="10" y1="12" x2="12" y2="14"/><line x1="14" y1="11" x2="12" y2="13"/></svg> },
                { title: "Community Space", body: "Built for neighbors, families, and pop-ups — a gathering place that brings the island together.", delay: 0.25, icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.olive} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><rect x="9" y="13" width="6" height="8" fill={colors.olive} opacity="0.15"/><rect x="9" y="13" width="6" height="8"/><path d="M9 9h2v2H9z"/><path d="M13 9h2v2h-2z"/><path d="M1 21h22"/></svg> },
                { title: "Event-Driven", body: "Events are central, not an afterthought — from maple fests to live music nights on the field.", delay: 0.35, icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.olive} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2" fill={colors.olive} opacity="0.12"/><rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M2 9h20"/><path d="M8 3v3"/><path d="M16 3v3"/></svg> },
              ].map((p, i) => (
                <Reveal key={i} delay={p.delay}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "clamp(16px, 2vw, 24px)",
                    padding: "clamp(16px, 2vw, 22px)", marginTop: i === 0 ? 0 : 12,
                    borderRadius: 18, border: `1.5px solid ${colors.olive}18`,
                    background: `linear-gradient(135deg, ${colors.parchment}80, ${colors.cream}60)`,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.olive + "40"; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.olive + "18"; e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${colors.olive}25`,
                      background: `linear-gradient(135deg, ${colors.cream}, ${colors.parchment})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {p.icon}
                    </div>
                    <div>
                      <h3 className="ff-body" style={{ fontSize: "clamp(17px, 1.5vw, 21px)", fontWeight: 700, lineHeight: 1.15 }}>{p.title}</h3>
                      <p className="ff-accent" style={{ fontSize: "clamp(13px, 1.2vw, 15px)", lineHeight: 1.55, color: colors.body, marginTop: 4 }}>{p.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MENU ═══════ */}
      <section id="menu" style={{ padding: "56px 0 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <Reveal>
            <PosterCard hoverable={false}>
              <div style={{ padding: "clamp(28px, 4vw, 44px) clamp(20px, 3vw, 40px)" }}>
                {/* Header */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <SectionLabel>Full Menu</SectionLabel>
                    <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 0.96, marginTop: 8 }}>
                      {currentMenu?.label || content?.hero?.menu_title || "Lunch"}
                    </h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {/* Menu type toggle */}
                    <div style={{ display: "flex", background: colors.cream, borderRadius: 999, padding: 3, gap: 2, border: `1.5px solid ${colors.olive}20` }}>
                      {allMenus.map(m => (
                        <button key={m.id} onClick={() => switchMenuType(m.id)} style={{
                          padding: "6px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                          fontFamily: "'BogueSlab', serif", letterSpacing: "0.03em", textTransform: "uppercase",
                          background: currentMenuType === m.id ? colors.olive : "transparent",
                          color: currentMenuType === m.id ? colors.warmWhite : colors.body,
                          border: "none", cursor: "pointer", transition: "all 0.25s ease",
                        }}>{m.label}</button>
                      ))}
                    </div>
                    {menuPdfUrl && (
                      <a href={menuPdfUrl} download style={{ textDecoration: "none" }}>
                        <button className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, padding: "8px 16px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download PDF
                        </button>
                      </a>
                    )}
                    <WhaleTail size={28} />
                  </div>
                </div>

                {Object.keys(menuData).length > 0 ? (<>
                {/* Category tabs */}
                <div className="scrollbar-hide" style={{ display: "flex", gap: 6, marginTop: 24, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {Object.keys(menuData).map((key) => (
                    <button key={key} className={`menu-tab ${activeMenu === key ? "menu-tab-active" : ""}`}
                      onClick={() => switchMenu(key)}
                      style={{ whiteSpace: "nowrap", padding: "8px 18px", fontSize: 11 }}
                    >{key}</button>
                  ))}
                </div>

                <Divider compact />

                {/* Category heading with swashes */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: "clamp(40px, 8vw, 80px)" }}><Swash2 /></div>
                  <h3 className="ff-display" style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, textTransform: "capitalize", flexShrink: 0 }}>
                    {activeMenu}
                  </h3>
                  <div style={{ width: "clamp(40px, 8vw, 80px)" }}><Swash2 flip /></div>
                  <div style={{ flex: 1 }} />
                </div>

                {/* Menu items */}
                <div style={{ opacity: menuFade ? 0 : 1, transform: menuFade ? "translateY(8px)" : "none", transition: "opacity 0.2s, transform 0.2s" }}>
                  <div className="menu-items-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {(menuData[activeMenu] || []).map((item) => {
                      const isSub = item.sub;
                      return (
                        <div key={item.name} className={isSub ? "" : "menu-item-card"} style={{
                          padding: isSub ? "8px 16px 8px 28px" : "16px 18px",
                          background: isSub ? "transparent" : colors.cream,
                          gridColumn: isSub ? "1 / -1" : undefined,
                          borderRadius: isSub ? 12 : 18,
                          border: isSub ? `1.5px dashed ${colors.oliveMid}20` : undefined,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div className="ff-body" style={{
                                fontSize: isSub ? 14 : "clamp(16px, 1.5vw, 19px)",
                                fontWeight: isSub ? 600 : 700,
                                lineHeight: 1.15,
                                color: isSub ? colors.oliveMid : colors.ink,
                                fontStyle: isSub ? "italic" : "normal",
                              }}>{item.name}</div>
                              {item.desc && (
                                <p className="ff-body" style={{ fontSize: isSub ? 13 : 14, lineHeight: 1.5, color: colors.body, marginTop: 3 }}>{item.desc}</p>
                              )}
                            </div>
                            {item.price && !isSub && (
                              <div style={{
                                padding: "4px 10px", borderRadius: 999,
                                border: `2px solid ${colors.olive}`, background: colors.orange, color: colors.warmWhite,
                                fontFamily: "'BogueSlab', serif", fontWeight: 700, fontSize: 13,
                                whiteSpace: "nowrap", flexShrink: 0,
                              }}>{item.price.startsWith("$") ? item.price : `$${item.price}`}</div>
                            )}
                            {item.price && isSub && (
                              <span className="ff-ui" style={{ fontSize: 11, color: colors.oliveMid, fontWeight: 600, whiteSpace: "nowrap" }}>{item.price}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </>) : (
                  /* PDF-only menu (no items added yet) */
                  <div style={{ textAlign: "center", padding: "40px 20px", opacity: menuFade ? 0 : 1, transition: "opacity 0.2s" }}>
                    <Divider compact />
                    <p className="ff-accent" style={{ fontSize: 17, color: colors.body, marginBottom: 20 }}>
                      View our {currentMenu?.label} menu by downloading the PDF.
                    </p>
                    {menuPdfUrl && (
                      <a href={menuPdfUrl} download style={{ textDecoration: "none" }}>
                        <button className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download {currentMenu?.label} Menu (PDF)
                        </button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </PosterCard>
          </Reveal>
        </div>
      </section>

      {/* ═══════ EVENTS ═══════ */}
      <section id="events" style={{ padding: "56px 0 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <div className="events-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 32, alignItems: "start" }}>
            <Reveal>
              {(() => {
                const eventLink = siteSettings.event_link_url || siteSettings.event_pdf_url;
                const posterImg = <img src={siteSettings.event_poster_url || A.maplefest} alt="Featured Event" style={{ width: "100%", height: "auto", display: "block", cursor: eventLink ? "pointer" : "default" }} />;
                return <>
                  <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)", border: `3px solid ${colors.olive}30` }}>
                    {eventLink ? <a href={eventLink} target="_blank" rel="noopener noreferrer">{posterImg}</a> : posterImg}
                  </div>
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    {eventLink ? (
                      <a href={eventLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <button className="btn-accent" style={{ fontSize: 16, padding: "14px 36px" }}>{siteSettings.event_button_text || "RSVP for Maple Fest"}</button>
                      </a>
                    ) : (
                      <button className="btn-accent" style={{ fontSize: 16, padding: "14px 36px" }}>{siteSettings.event_button_text || "RSVP for Maple Fest"}</button>
                    )}
                  </div>
                </>;
              })()}
            </Reveal>

            <Reveal delay={0.12}>
              <PosterCard style={{ height: "100%" }}>
                <div style={{ padding: "clamp(24px, 3vw, 40px)" }}>
                  <SectionLabel>Upcoming Events</SectionLabel>
                  <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 0.96, marginTop: 12 }}>
                    {content?.events?.heading || "More Than a Restaurant"}
                  </h2>
                  <Divider />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {eventsData.map((event) => (
                      <div key={event.title} className="event-card" style={{
                        border: `2px solid ${event.featured ? colors.gold + "60" : colors.oliveMid + "25"}`,
                        background: event.featured ? `linear-gradient(135deg, ${colors.parchment}, ${colors.gold}25)` : colors.cream,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                          <div style={{ flexShrink: 0, width: 56, textAlign: "center" }}>
                            <div className="ff-display" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: colors.ink }}>{event.date.split(" ")[1]}</div>
                            <div className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.12em", color: colors.oliveMid, marginTop: 2 }}>{event.date.split(" ")[0]}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <h3 className="ff-body" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>{event.title}</h3>
                              <span style={{
                                padding: "3px 10px", borderRadius: 999, border: `1.5px solid ${event.featured ? colors.gold : colors.oliveMid}`,
                                background: event.featured ? colors.gold : colors.oliveMid, color: colors.warmWhite,
                                fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700,
                                fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                              }}>{event.badge}</span>
                            </div>
                            <p className="ff-body" style={{ fontSize: 15, lineHeight: 1.55, color: colors.body, marginTop: 5 }}>{event.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PosterCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ GALLERY ═══════ */}
      <section style={{ padding: "40px 0 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <SectionLabel>The Atmosphere</SectionLabel>
              <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 0.96, marginTop: 8 }}>
                Old-School Energy, Island Soul
              </h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "16px auto 0", maxWidth: 300 }}>
                <div style={{ width: 70 }}><Swash /></div>
                <WhaleTail size={28} />
                <div style={{ width: 70 }}><Swash flip /></div>
              </div>
            </div>
          </Reveal>
          {(() => {
            const slides = [
              { src: A.wallpic_full1, caption: "Horse racing at the Nantucket Agricultural Fair, circa 1890s", credit: "Nantucket Historical Association" },
              { src: A.wallpic_full2, caption: "Community gathering at the Fairgrounds with barn and carriages", credit: "Nantucket Historical Association" },
              { src: A.fairCrowd, caption: "Crowds at the Fair midway — game booths and summer sun, circa 1920s", credit: "Nantucket Historical Association" },
            ];
            const si = gallerySlide;
            const goTo = (n) => setGallerySlide((n + slides.length) % slides.length);
            return (
              <div style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", border: `2px solid rgba(122,126,46,0.2)`, position: "relative", aspectRatio: "16/9", background: colors.ink }}>
                  {slides.map((s, i) => (
                    <img key={i} src={s.src} alt={s.caption} style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                      opacity: i === si ? 1 : 0, transition: "opacity 0.6s ease",
                    }} />
                  ))}
                  {/* Prev / Next arrows */}
                  <button onClick={() => goTo(si - 1)} aria-label="Previous" style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    width: 40, height: 40, borderRadius: "50%", border: "none",
                    background: "rgba(22,22,22,0.55)", color: "#fff", fontSize: 20, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)",
                  }}>&#8249;</button>
                  <button onClick={() => goTo(si + 1)} aria-label="Next" style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    width: 40, height: 40, borderRadius: "50%", border: "none",
                    background: "rgba(22,22,22,0.55)", color: "#fff", fontSize: 20, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)",
                  }}>&#8250;</button>
                  {/* Dots */}
                  <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => setGallerySlide(i)} aria-label={`Slide ${i+1}`} style={{
                        width: i === si ? 24 : 8, height: 8, borderRadius: 4, border: "none",
                        background: i === si ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer",
                        transition: "all 0.3s ease",
                      }} />
                    ))}
                  </div>
                </div>
                {/* Caption below the image */}
                <div style={{ textAlign: "center", marginTop: 14, minHeight: 48 }}>
                  <p className="ff-accent" style={{ fontSize: "clamp(14px, 1.3vw, 17px)", color: colors.ink, lineHeight: 1.5, margin: 0, transition: "opacity 0.4s" }}>
                    {slides[si].caption}
                  </p>
                  <p className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.12em", color: colors.oliveMid, marginTop: 4, textTransform: "uppercase" }}>
                    {slides[si].credit}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════ ORDER & RESERVE ═══════ */}
      <section id="order" style={{ padding: "48px 0 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <SectionLabel>Dine With Us</SectionLabel>
              <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 0.96, marginTop: 8 }}>
                Reserve, Order & Review
              </h2>
              <p className="ff-accent" style={{ fontSize: "clamp(15px, 1.4vw, 18px)", color: colors.body, maxWidth: 420, margin: "14px auto 0" }}>
                Whether you're dining in or ordering from home — we've got you covered.
              </p>
            </div>
          </Reveal>

          {(() => {
            const o = colors.olive;
            const svc = [
              {
                name: "OpenTable", cat: "RESERVATIONS", desc: "Book your table and skip the wait.", href: "https://www.opentable.com", btn: "RESERVE NOW", btnClass: "btn-primary",
                icon: <svg width="28" height="28" viewBox="0 0 131 95" fill={o}><path d="M83.36 0a47.5 47.5 0 1047.46 47.5A47.48 47.48 0 0083.36 0zm0 59.37A11.87 11.87 0 1195.22 47.5a11.87 11.87 0 01-11.87 11.87zM0 47.5a11.87 11.87 0 1111.87 11.87A11.87 11.87 0 010 47.5"/></svg>
              },
              {
                name: "Uber Eats", cat: "DELIVERY", desc: "Get Faregrounds delivered to your door.", href: "https://www.ubereats.com", btn: "ORDER NOW", btnClass: "btn-secondary",
                icon: <img src={A.uberEatsBrand} alt="Uber Eats" width="28" height="28" style={{ objectFit: "contain" }} />
              },
              {
                name: "DoorDash", cat: "DELIVERY", desc: "Comfort food, right to your doorstep.", href: "https://www.doordash.com", btn: "ORDER NOW", btnClass: "btn-secondary",
                icon: <svg width="28" height="28" viewBox="0 0 99.5 56.5" fill={o}><path d="M95.64,13.38A25.24,25.24,0,0,0,73.27,0H2.43A2.44,2.44,0,0,0,.72,4.16L16.15,19.68a7.26,7.26,0,0,0,5.15,2.14H71.24a6.44,6.44,0,1,1,.13,12.88H36.94a2.44,2.44,0,0,0-1.72,4.16L50.66,54.39a7.25,7.25,0,0,0,5.15,2.14H71.38c20.26,0,35.58-21.66,24.26-43.16"/></svg>
              },
              {
                name: "Grubhub", cat: "PICKUP", desc: "Order for pickup or delivery.", href: "https://www.grubhub.com", btn: null, btnClass: null,
                icon: <svg width="28" height="28" viewBox="0 0 24 20" fill="none"><path d="M23.267 20H.35A.35.35 0 010 19.632V.368A.354.354 0 01.351 0h22.931a.366.366 0 01.351.521l-3.121 9.525a.353.353 0 000 .306l3.075 9.189a.369.369 0 01-.32.459z" fill={o}/><path d="M8.806 3.475a3.748 3.748 0 00-1.05-.139 3.245 3.245 0 00-2.466.99A3.86 3.86 0 004.453 7v4.887a3.892 3.892 0 00.853 2.675 3.245 3.245 0 002.465.99c.355.003.708-.043 1.05-.14a2.898 2.898 0 001.415-.85 3.829 3.829 0 00.868-2.675V9.197a.203.203 0 00-.063-.148.196.196 0 00-.15-.053H7.969a.214.214 0 00-.213.201v1.995a.214.214 0 00.213.2h.76v.45c.02.346-.077.69-.273.974a.832.832 0 01-.7.324.817.817 0 01-.685-.324 1.565 1.565 0 01-.274-.975V7.017c-.016-.342.08-.68.274-.96a.817.817 0 01.685-.324.832.832 0 01.7.325c.193.28.29.617.274.959v.463a.17.17 0 00.076.14h2.085a.18.18 0 00.134-.044.187.187 0 00.064-.126V7c.06-.972-.251-1.93-.868-2.675a3.034 3.034 0 00-1.415-.85zM18.722 3.333h-1.955a.181.181 0 00-.166.112.237.237 0 000 .097v4.564h-2.03V3.542a.203.203 0 00-.197-.209h-1.955a.203.203 0 00-.197.209v11.74c0 .115.088.208.197.208h1.955a.203.203 0 00.196-.208v-4.725h2v4.805a.237.237 0 000 .096.165.165 0 00.167.097h1.954a.176.176 0 00.145-.056.199.199 0 00.052-.153V3.542a.205.205 0 00-.166-.209z" fill="#fff"/></svg>
              },
              {
                name: "Yelp", cat: "REVIEWS", desc: "Read reviews and see photos.", href: "https://www.yelp.com", btn: null, btnClass: null,
                icon: <svg width="28" height="28" viewBox="0 0 14 19" fill={o}><g clipPath="url(#yc)"><path d="M4.606 11.38l.801-.186a.824.824 0 00.079-.02.883.883 0 00.631-1.052l-.003-.015a.88.88 0 00-.136-.297 1.116 1.116 0 00-.327-.28 3.026 3.026 0 00-.465-.215l-.878-.32a82.459 82.459 0 00-1.484-.536c-.323-.115-.596-.215-.833-.289-.045-.014-.095-.027-.135-.041-.287-.088-.489-.125-.66-.126a.786.786 0 00-.333.06.85.85 0 00-.288.206c-.04.046-.078.093-.114.143a1.685 1.685 0 00-.168.336 4.547 4.547 0 00-.24 1.494c.004.46.016 1.05.27 1.449a.853.853 0 00.24.26c.18.124.361.14.55.154.283.02.557-.05.83-.112l2.661-.614h.002zm8.935-4.25a4.55 4.55 0 00-.87-1.24 1.725 1.725 0 00-.299-.228 1.699 1.699 0 00-.164-.078.787.787 0 00-.675.034c-.153.076-.319.198-.538.402-.03.03-.069.064-.103.096-.181.17-.383.38-.623.625-.37.374-.736.751-1.098 1.132l-.65.673a3.026 3.026 0 00-.323.397c-.082.119-.14.253-.171.395a.881.881 0 00.008.327c0 .005.002.01.003.014a.883.883 0 001.029.669.836.836 0 00.08-.016l3.462-.8c.273-.062.55-.12.795-.262.165-.095.321-.19.428-.38a.853.853 0 00.102-.34c.053-.471-.194-1.006-.393-1.42zM7.344 8.586c.25-.315.25-.785.272-1.168.075-1.282.154-2.565.216-3.847.024-.486.076-.966.047-1.455-.025-.404-.028-.868-.283-1.2C7.145.333 6.184.38 5.529.472a6.307 6.307 0 00-.602.113c-.2.048-.397.1-.59.162-.629.206-1.513.584-1.662 1.308-.085.41.116.828.271 1.202.188.452.446.86.68 1.287.62 1.125 1.251 2.243 1.88 3.363.188.334.393.757.757.93a.78.78 0 00.073.028.88.88 0 00.95-.219.786.786 0 00.058-.06zm-.301 3.431a.801.801 0 00-1.16-.156 2.077 2.077 0 00-.376.385c-.028.035-.054.082-.087.113l-.557.765c-.315.429-.627.859-.935 1.295-.201.282-.375.52-.513.731-.026.04-.053.084-.078.12-.165.254-.258.44-.306.606a.791.791 0 00-.033.342.85.85 0 00.119.338c.033.052.07.102.108.15a1.694 1.694 0 00.28.257c.384.267.805.46 1.248.608.368.122.751.195 1.139.217a1.735 1.735 0 00.38-.03c.06-.014.118-.03.177-.051a.863.863 0 00.302-.192.793.793 0 00.184-.29c.064-.16.107-.363.134-.665l.013-.142c.022-.25.032-.545.048-.891.027-.533.048-1.063.064-1.595l.036-.946a2.27 2.27 0 00-.06-.675 1.01 1.01 0 00-.127-.294zm6.289 1.478c-.116-.127-.28-.254-.54-.411-.038-.02-.082-.049-.123-.073-.216-.13-.477-.267-.781-.432a87.6 87.6 0 00-1.409-.754l-.834-.442c-.044-.013-.088-.044-.128-.064a2.078 2.078 0 00-.507-.18 1.067 1.067 0 00-.304-.013.802.802 0 00-.668.662.992.992 0 00.011.317c.041.222.14.442.243.634l.446.834c.249.47.5.939.757 1.405.167.304.305.565.434.78.025.041.053.085.074.122.157.26.284.423.412.54a.81.81 0 00.292.179.864.864 0 00.357.04c.061-.008.122-.018.182-.032a1.776 1.776 0 00.354-.14c.338-.19.65-.423.928-.694.333-.328.627-.685.856-1.093.032-.058.06-.118.083-.18.021-.057.04-.116.055-.175.014-.06.024-.12.031-.182a.86.86 0 00-.04-.355.792.792 0 00-.18-.293z"/></g><defs><clipPath id="yc"><rect width="14" height="19" fill="#fff"/></clipPath></defs></svg>
              },
              {
                name: "Google Maps", cat: "REVIEWS", desc: "Reviews, directions & hours.", href: "https://maps.google.com/?q=27+Fairgrounds+Rd,+Nantucket,+MA+02554", btn: null, btnClass: null,
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill={o}><path d="M18.7 3.8C15 .1 9 .1 5.3 3.8c-3.7 3.7-3.7 9.8 0 13.5L12 24l6.7-6.8c3.7-3.6 3.7-9.7 0-13.4ZM12 12.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Z"/></svg>
              },
            ];
            const big = svc.slice(0, 3);
            const small = svc.slice(3);
            return (<>
              <div className="order-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                {big.map((s, i) => (
                  <Reveal key={s.name} delay={i * 0.08}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div className="poster-card poster-card-hover" style={{ padding: "clamp(20px, 2.5vw, 32px)", textAlign: "center", height: "100%", cursor: "pointer" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${colors.olive}25`, background: `linear-gradient(135deg, ${colors.cream}, ${colors.parchment})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                          {s.icon}
                        </div>
                        <div className="ff-ui" style={{ fontSize: 9, letterSpacing: "0.18em", color: colors.oliveMid, marginBottom: 6 }}>{s.cat}</div>
                        <h3 className="ff-body" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{s.name}</h3>
                        <p className="ff-accent" style={{ fontSize: 13, color: colors.body, marginTop: 6, lineHeight: 1.5 }}>{s.desc}</p>
                        {s.btn && <div style={{ marginTop: 14 }}><span className={s.btnClass} style={{ display: "inline-block", padding: "8px 20px", fontSize: 10, letterSpacing: "0.14em", borderRadius: 999 }}>{s.btn}</span></div>}
                      </div>
                    </a>
                  </Reveal>
                ))}
              </div>
              <div className="order-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {small.map((s, i) => (
                  <Reveal key={s.name} delay={(i + 3) * 0.06}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div className="poster-card poster-card-hover" style={{ padding: "clamp(16px, 2vw, 24px)", textAlign: "center", cursor: "pointer" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `2px solid ${colors.olive}20`, background: `linear-gradient(135deg, ${colors.cream}, ${colors.parchment})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                          {s.icon}
                        </div>
                        <h3 className="ff-body" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>{s.name}</h3>
                        <p className="ff-accent" style={{ fontSize: 12, color: colors.body, marginTop: 4 }}>{s.desc}</p>
                      </div>
                    </a>
                  </Reveal>
                ))}
              </div>
            </>);
          })()}
        </div>
      </section>

      {/* ═══════ NEWSLETTER ═══════ */}
      <section style={{ padding: "48px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <Reveal>
            <PosterCard hoverable={false}>
              <div style={{ padding: "clamp(32px, 5vw, 52px) clamp(24px, 4vw, 44px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", height: 120, opacity: 0.5 }}>
                  <Bracket side="left" />
                </div>
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", height: 120, opacity: 0.5 }}>
                  <Bracket side="right" />
                </div>
                <div style={{ position: "relative", zIndex: 2 }}>
                  <img src={A.logoOrange} alt="The Faregrounds" draggable={false} className="ink-art" style={{ width: 140, height: "auto", margin: "0 auto", display: "block", objectFit: "contain" }} />
                  <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, lineHeight: 0.96, marginTop: 16 }}>
                    Stay in the Loop
                  </h2>
                  <p className="ff-accent" style={{ fontSize: "clamp(17px, 1.6vw, 20px)", lineHeight: 1.7, color: colors.body, maxWidth: 480, margin: "14px auto 0" }}>
                    Get the inside scoop on seasonal menus, events, and community happenings. No spam — just island-good stuff.
                  </p>
                  <div style={{
                    display: "flex", maxWidth: 460, margin: "24px auto 0",
                    borderRadius: 999, border: `2px solid ${colors.olive}`, background: colors.cream, padding: 4,
                  }}>
                    <input value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" className="ff-body"
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 20px", fontSize: 16, color: colors.ink, minWidth: 0 }}
                    />
                    <button className="btn-accent" style={{ borderRadius: 999, padding: "10px 24px", fontSize: 11, border: `2px solid ${colors.olive}`, flexShrink: 0 }}>Join</button>
                  </div>
                </div>
              </div>
            </PosterCard>
          </Reveal>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer id="visit" style={{ padding: "16px 0 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)" }}>
          <Reveal>
            <PosterCard hoverable={false}>
              <div style={{ padding: "clamp(28px, 4vw, 44px) clamp(20px, 3vw, 40px)" }}>
                <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 0.8fr 0.8fr 1.1fr", gap: 40, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <WhaleTail size={30} />
                      <span className="ff-display" style={{ fontSize: "clamp(22px, 2.5vw, 28px)", fontWeight: 900, color: colors.ink, lineHeight: 1 }}>{siteSettings.site_name || "The Faregrounds"}</span>
                    </div>
                    <p className="ff-body" style={{ fontSize: 16, lineHeight: 1.7, color: colors.body, marginTop: 14, maxWidth: 300 }}>
                      Seasonal food, local gatherings, and old-school community energy — built for Nantucket Island.
                    </p>
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      {[
                        { name: "instagram", href: siteSettings.instagram_url || "#", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                        { name: "facebook", href: siteSettings.facebook_url || "#", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                        { name: "twitter", href: siteSettings.twitter_url || "#", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                        { name: "tiktok", href: siteSettings.tiktok_url || "#", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
                      ].map((icon) => (
                        <a key={icon.name} className="social-icon" href={icon.href} target="_blank" rel="noopener noreferrer" aria-label={icon.name}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={icon.path}/></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Explore</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                      {["Menu", "Events", "Our Story", "Order", "Visit Us", "Catering"].map((link) => <button key={link} className="footer-link">{link}</button>)}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Hours</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                      {[
                        siteSettings.hours_weekday || "Mon\u2013Thu: 8am \u2013 3pm",
                        siteSettings.hours_weekend || "Fri\u2013Sun: 8am \u2013 8pm",
                        siteSettings.hours_events || "Events: Seasonal evenings",
                      ].map((h) => {
                        const idx = h.indexOf(": ");
                        const day = idx >= 0 ? h.slice(0, idx) : h;
                        const time = idx >= 0 ? h.slice(idx + 2) : "";
                        return [day, time];
                      }).map(([day, time]) => (
                        <div key={day} className="ff-body" style={{ fontSize: 16, color: colors.body }}>
                          <span style={{ fontWeight: 700, color: colors.ink }}>{day}</span><br/>{time}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Find Us</SectionLabel>
                    <div style={{ marginTop: 14 }}>
                      <a
                        href={siteSettings.google_maps_url || "https://maps.google.com/?q=27+Fairgrounds+Rd,+Nantucket,+MA+02554"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ff-display"
                        style={{ fontSize: 17, fontWeight: 900, color: colors.olive, textDecoration: "none" }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                      >{siteSettings.address_line1 || "27 Fairgrounds Road"}</a>
                      <div className="ff-body" style={{ fontSize: 15, color: colors.body, marginTop: 3 }}>{siteSettings.address_line2 || "Nantucket, MA 02554"}</div>
                      <a href={`tel:${(siteSettings.phone || "(508) 555-FARE").replace(/[()\s-]/g, "")}`} className="ff-body" style={{ fontSize: 15, color: colors.body, marginTop: 2, textDecoration: "none", display: "block" }}>{siteSettings.phone || "(508) 555-FARE"}</a>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 32, paddingTop: 18, borderTop: "1px solid rgba(122,126,46,0.15)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                }}>
                  <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.14em", color: colors.muted }}>{`\u00A9 2026 ${siteSettings.site_name || "The Faregrounds"} \u2022 Nantucket Island`}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="divider-line" style={{ width: 40 }} />
                    <WhaleTail size={18} style={{ opacity: 0.4 }} />
                    <div className="divider-line" style={{ width: 40 }} />
                  </div>
                  <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.14em", color: colors.muted }}>Privacy • Terms • Accessibility</span>
                </div>
              </div>
            </PosterCard>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}
