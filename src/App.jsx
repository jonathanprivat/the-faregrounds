import { useState, useEffect, useRef, useCallback } from "react";

// ─── Embedded Brand Assets (base64) ────────────────────────────

const A = {
  logo: "/images/logo.png",
  seal: "/images/seal.png",
  whale: "/images/whale.png",
  maplefest: "/images/maplefest.jpeg",
  wallpic1: "/images/wallpic1.jpeg",
  wallpic2: "/images/wallpic2.jpeg",
  wallpic_full1: "/images/wallpic_full1.jpeg",
  wallpic_full2: "/images/wallpic_full2.jpeg",
  fairCrowd: "/images/fairCrowd.jpeg",
  nantucketMap: "/images/nantucketMap.svg",
  ticket: "/images/ticket.jpeg",
  logoFrame: "/images/logoFrame.svg",
  whaleHat: "/images/whaleHat.svg",
  whaleTailSvg: "/images/whaleTailSvg.svg",
  swashL: "/images/swashL.png",
  swashR: "/images/swashR.png",
  swashL2: "/images/swashL2.png",
  swashR2: "/images/swashR2.png",
  truck: "/images/truck.png",
  bracketL: "/images/bracketL.png",
  bracketR: "/images/bracketR.png",
  logoOrange: "/images/logoOrange.svg",
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
  return <img src={A.whaleTailSvg} alt="" draggable={false} style={{ width: size, height: "auto", objectFit: "contain", flexShrink: 0, ...style }} />;
}

function WhaleHat({ size = 120, style = {} }) {
  return <img src={A.whaleHat} alt="" draggable={false} style={{ width: size, height: "auto", objectFit: "contain", flexShrink: 0, ...style }} />;
}

function Swash({ flip = false, style = {} }) {
  return <img src={flip ? A.swashR : A.swashL} alt="" draggable={false} style={{ width: "100%", height: "auto", display: "block", ...style }} />;
}

function Swash2({ flip = false, style = {} }) {
  return <img src={flip ? A.swashR2 : A.swashL2} alt="" draggable={false} style={{ width: "100%", height: "auto", display: "block", ...style }} />;
}

function Bracket({ side = "left", style = {} }) {
  return <img src={side === "left" ? A.bracketL : A.bracketR} alt="" draggable={false} style={{ height: "100%", width: "auto", display: "block", ...style }} />;
}

function Truck({ style = {} }) {
  return <img src={A.truck} alt="Nantucket Truck" draggable={false} style={{ width: "100%", maxWidth: 300, height: "auto", objectFit: "contain", ...style }} />;
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
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("appetizers");
  const [menuFade, setMenuFade] = useState(false);
  const [email, setEmail] = useState("");
  const [activeSection, setActiveSection] = useState("");

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

  const css = `
    @font-face { font-family: 'ZebrawoodFill'; src: url('/fonts/ZebrawoodFill.otf') format('opentype'); font-weight: 400; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BogueSlab'; src: url('/fonts/BogueSlab-2.otf') format('opentype'); font-weight: 700; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BogueSlab'; src: url('/fonts/BogueSlab-3.otf') format('opentype'); font-weight: 600; font-style: normal; font-display: swap; }
    @font-face { font-family: 'BogueSlab'; src: url('/fonts/BogueSlab-4.otf') format('opentype'); font-weight: 300; font-style: normal; font-display: swap; }

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

    .paper-texture {
      background:
        radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.18), transparent 50%),
        radial-gradient(ellipse at 85% 20%, rgba(255,255,255,0.1), transparent 40%),
        radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.02), transparent 50%),
        ${C.cream};
    }

    .poster-card {
      position: relative; overflow: hidden; border-radius: 24px;
      background: ${C.parchment}; border: 3px solid ${C.olive};
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
    .btn-primary { border: 2px solid ${C.olive}; background: ${C.oliveMid}; color: ${C.warmWhite}; }
    .btn-primary:hover { background: ${C.olive}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(78,84,32,0.2); }
    .btn-secondary { border: 2px solid ${C.olive}; background: transparent; color: ${C.olive}; }
    .btn-secondary:hover { background: ${C.olive}; color: ${C.warmWhite}; transform: translateY(-2px); }
    .btn-accent { border: 2px solid ${C.olive}; background: ${C.orange}; color: ${C.warmWhite}; }
    .btn-accent:hover { background: ${C.orangeHot}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(217,106,31,0.25); }

    .tag {
      display: inline-block; padding: 4px 12px; border-radius: 999px;
      border: 1.5px solid ${C.olive}; background: ${C.cream};
      color: ${C.olive}; font-family: 'Source Sans 3', sans-serif;
      font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    }

    .menu-tab {
      padding: 10px 28px; border-radius: 999px; border: 2px solid ${C.olive};
      font-family: 'Source Sans 3', sans-serif; font-weight: 700;
      font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
      cursor: pointer; transition: all 0.25s ease; background: transparent; color: ${C.olive};
    }
    .menu-tab-active { background: ${C.olive}; color: ${C.warmWhite}; }
    .menu-tab:not(.menu-tab-active):hover { background: rgba(78,84,32,0.08); }

    .photo-placeholder {
      border-radius: 16px; border: 2px solid rgba(122,126,46,0.25); overflow: hidden;
    }

    .nav-link {
      position: relative; color: ${C.olive};
      font-family: 'Source Sans 3', sans-serif; font-weight: 600;
      font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;
      cursor: pointer; padding: 4px 0; text-decoration: none; transition: color 0.2s;
      background: none; border: none;
    }
    .nav-link::after {
      content: ''; position: absolute; bottom: 0; left: 0;
      width: 0; height: 2px; background: ${C.orange}; transition: width 0.3s ease;
    }
    .nav-link:hover { color: ${C.orange}; }
    .nav-link:hover::after { width: 100%; }
    .nav-link-active { color: ${C.orange}; }
    .nav-link-active::after { width: 100%; }

    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    .float { animation: float 6s ease-in-out infinite; }

    .divider-line {
      height: 2px; flex: 1;
      background: linear-gradient(90deg, transparent, rgba(122,126,46,0.3), transparent);
    }

    .menu-item-card {
      border-radius: 18px; border: 2px solid rgba(122,126,46,0.25);
      background: ${C.cream}; padding: 24px;
      display: flex; flex-direction: column; gap: 8px;
      transition: border-color 0.25s, background 0.25s, transform 0.25s; cursor: default;
    }
    .menu-item-card:hover { border-color: ${C.oliveMid}; background: ${C.parchment}; transform: translateY(-2px); }

    .event-card {
      border-radius: 20px; padding: 20px;
      transition: border-color 0.25s, transform 0.3s, box-shadow 0.3s; cursor: default;
    }
    .event-card:hover { transform: translateX(6px); box-shadow: -4px 0 12px rgba(0,0,0,0.04); }

    .social-icon {
      width: 38px; height: 38px; border-radius: 999px;
      border: 2px solid rgba(122,126,46,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: ${C.olive};
      font-family: 'Source Sans 3', sans-serif; letter-spacing: 0.08em;
      cursor: pointer; transition: all 0.25s;
    }
    .social-icon:hover { background: ${C.olive}; color: ${C.warmWhite}; border-color: ${C.olive}; }

    .footer-link {
      font-size: 16px; color: ${C.body}; cursor: pointer; transition: color 0.2s;
      text-decoration: none; background: none; border: none; padding: 0;
      font-family: 'BogueSlab', Georgia, serif; text-align: left;
    }
    .footer-link:hover { color: ${C.orange}; }

    .mobile-overlay {
      position: fixed; inset: 0; z-index: 99;
      background: rgba(22,22,22,0.4); backdrop-filter: blur(4px); transition: opacity 0.3s;
    }
    .mobile-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; z-index: 101;
      width: min(320px, 85vw); background: ${C.parchment};
      border-left: 3px solid ${C.olive};
      padding: 80px 32px 40px; display: flex; flex-direction: column; gap: 8px;
      transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
    }
    .mobile-drawer-link {
      padding: 14px 0; font-family: 'BogueSlab', Georgia, serif;
      font-size: 24px; font-weight: 700; color: ${C.ink};
      border-bottom: 1px solid rgba(122,126,46,0.15);
      cursor: pointer; transition: color 0.2s; background: none;
      border-top: none; border-left: none; border-right: none; text-align: left; width: 100%;
    }
    .mobile-drawer-link:hover { color: ${C.orange}; }

    .gallery-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      grid-template-rows: auto auto; gap: 16px;
    }
    .gallery-item {
      border-radius: 20px; border: 2px solid rgba(122,126,46,0.2);
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s;
    }
    .gallery-item:hover { transform: scale(1.02); box-shadow: 0 8px 32px rgba(0,0,0,0.08); }

    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

    /* ── Tablet (≤1024px) ── */
    @media (max-width: 1024px) {
      .desktop-nav { display: none !important; }
      .hamburger-btn { display: flex !important; }
      .story-grid { grid-template-columns: 1fr !important; }
      .events-grid { grid-template-columns: 1fr !important; }
      .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
      .gallery-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto !important; }
      .gallery-item { grid-column: auto !important; grid-row: auto !important; min-height: 160px !important; }

      .pillar-grid { grid-template-columns: 1fr 1fr !important; }
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
      .gallery-grid { grid-template-columns: 1fr !important; }
      .gallery-item { min-height: 140px !important; aspect-ratio: 16/9 !important; }
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
    <div className="paper-texture" style={{ minHeight: "100vh", color: C.ink, overflowX: "hidden" }}>
      <style>{css}</style>

      {/* ═══════ NAV ═══════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: navSolid ? "10px 0" : "18px 0",
        background: navSolid ? "rgba(239,225,171,0.92)" : "transparent",
        backdropFilter: navSolid ? "blur(16px)" : "none",
        WebkitBackdropFilter: navSolid ? "blur(16px)" : "none",
        borderBottom: navSolid ? "1px solid rgba(122,126,46,0.12)" : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 4vw, 24px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <WhaleTail size={26} />
            <span className="ff-display" style={{ fontSize: 22, fontWeight: 900, color: C.olive, letterSpacing: "-0.02em" }}>The Faregrounds</span>
          </button>
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} className={`nav-link ${activeSection === id ? "nav-link-active" : ""}`} onClick={() => smoothScrollTo(id)}>{label}</button>
            ))}
            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: 11 }} onClick={() => smoothScrollTo("visit")}>Reserve</button>
          </div>
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: "none", background: "none", border: "none", padding: 4 }}>
            <HamburgerIcon open={mobileMenuOpen} />
          </button>
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
          <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.14em", color: C.muted }}>Nantucket Island</span>
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
                  <SectionLabel>Nantucket Island • Restaurant • Events • Community</SectionLabel>

                  {/* Title with real swashes */}
                  <div style={{ margin: "24px auto 0", maxWidth: 820, position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "clamp(60px, 12vw, 140px)", opacity: 0.85 }}>
                      <Swash />
                    </div>
                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: "clamp(60px, 12vw, 140px)", opacity: 0.85 }}>
                      <Swash flip />
                    </div>
                    <h1 className="ff-display ink-shadow" style={{
                      fontSize: "clamp(42px, 8vw, 96px)", fontWeight: 900, lineHeight: 0.92,
                      color: C.ink, letterSpacing: "-0.015em",
                    }}>
                      The Faregrounds
                    </h1>
                  </div>

                  <p className="ff-accent" style={{
                    fontSize: "clamp(19px, 2.2vw, 24px)", lineHeight: 1.65, color: C.body,
                    maxWidth: 560, margin: "20px auto 0",
                  }}>
                    Seasonal food, local gatherings, and fairground energy — all wrapped in a nostalgic island experience at 27 Fairgrounds Road.
                  </p>

                  <Divider />

                  <div className="hero-tags" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 }}>
                    {["Seasonal Menu", "Community Events", "Family Friendly", "Island Charm", "Live Music"].map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 28 }}>
                    <button className="btn-primary" onClick={() => smoothScrollTo("menu")}>View Menu</button>
                    <a href="MENU_11x17_LUNCH.pdf" download className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex" }}>Download Menu (PDF)</a>
                    <button className="btn-secondary" onClick={() => smoothScrollTo("events")}>Upcoming Events</button>
                  </div>
                </div>

                {/* Truck illustration */}
                <div className="float" style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "40px auto 0" }}>
                  <Truck style={{ maxWidth: 400 }} />
                  <span className="ff-accent" style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: C.oliveMid, textAlign: "center", marginTop: 14 }}>
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
                    A Farmstand Poster Turned Into a Restaurant.
                  </h2>
                  <Divider />
                  <p className="ff-accent" style={{ fontSize: "clamp(17px, 1.7vw, 21px)", lineHeight: 1.75, color: C.body }}>
                    The Faregrounds blends comfort food, seasonal traditions, and island community into one warm, old-school gathering place. Everything about the experience — from the menu to the events to the brand itself — is designed to feel welcoming, a little nostalgic, and unmistakably Nantucket.
                  </p>
                  <p className="ff-accent" style={{ fontSize: "clamp(17px, 1.7vw, 21px)", lineHeight: 1.75, color: C.body, marginTop: 16 }}>
                    We’re bringing the sugar shack experience 30 miles out to sea — with seasonal menus, live music, community pop-ups, and the kind of energy that makes you want to stick around for one more cup of coffee.
                  </p>
                  <div style={{ marginTop: 28 }}>
                    <button className="btn-secondary" onClick={() => smoothScrollTo("visit")}>Come Visit Us</button>
                  </div>
                </div>
              </PosterCard>
            </Reveal>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Reveal delay={0.12}>
                <div style={{ borderRadius: 24, border: "2px solid rgba(122,126,46,0.25)", background: `linear-gradient(135deg, ${C.cream}, ${C.parchment})`, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <img src={A.ticket} alt="1888 Nantucket Agricultural Society Exhibition Ticket" draggable={false} style={{ width: "100%", maxWidth: 500, height: "auto", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: `1.5px solid ${C.olive}30` }} />
                  <span className="ff-accent" style={{ fontSize: 13, color: C.oliveMid, textAlign: "center" }}>
                    33rd Annual Exhibition, 1888 — Where it all began.
                  </span>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="pillar-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    ["Seasonal Menu", "Warm plates that rotate with the season.", <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.olive} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6c-2 0-4 2-4 4 0 3 4 6 4 8 0-2 4-5 4-8 0-2-2-4-4-4z" fill={C.olive} opacity="0.15"/><path d="M12 6c-2 0-4 2-4 4 0 3 4 6 4 8 0-2 4-5 4-8 0-2-2-4-4-4z"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="10" y1="12" x2="12" y2="14"/><line x1="14" y1="11" x2="12" y2="13"/></svg>],
                    ["Community Space", "Built for neighbors, families & pop-ups.", <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.olive} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><rect x="9" y="13" width="6" height="8" fill={C.olive} opacity="0.15"/><rect x="9" y="13" width="6" height="8"/><path d="M9 9h2v2H9z"/><path d="M13 9h2v2h-2z"/><path d="M1 21h22"/><line x1="12" y1="3" x2="12" y2="5"/></svg>],
                    ["Event-Driven", "Events are central, not an afterthought.", <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.olive} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2" fill={C.olive} opacity="0.15"/><rect x="2" y="6" width="20" height="13" rx="2"/><line x1="7" y1="6" x2="7" y2="19"/><line x1="17" y1="6" x2="17" y2="19"/><circle cx="12" cy="12.5" r="2.5"/><path d="M2 9h20"/><path d="M2 16h20"/><path d="M8 3v3"/><path d="M16 3v3"/></svg>],
                  ].map(([title, body, icon], i) => (
                    <PosterCard key={i}>
                      <div style={{ padding: "clamp(14px, 2vw, 20px)" }}>
                        {icon}
                        <h3 className="ff-body" style={{ fontSize: "clamp(16px, 1.5vw, 20px)", fontWeight: 700, lineHeight: 1.15, marginTop: 10 }}>{title}</h3>
                        <p className="ff-accent" style={{ fontSize: 14, lineHeight: 1.55, color: C.body, marginTop: 6 }}>{body}</p>
                      </div>
                    </PosterCard>
                  ))}
                </div>
              </Reveal>
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
                      Lunch
                    </h2>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <a href="MENU_11x17_LUNCH.pdf" download style={{ textDecoration: "none" }}>
                      <button className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, padding: "8px 16px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download PDF
                      </button>
                    </a>
                    <WhaleTail size={28} />
                  </div>
                </div>

                {/* Category tabs */}
                <div className="scrollbar-hide" style={{ display: "flex", gap: 6, marginTop: 24, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {Object.keys(MENU_DATA).map((key) => (
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
                    {MENU_DATA[activeMenu].map((item) => {
                      const isSub = item.sub;
                      return (
                        <div key={item.name} className={isSub ? "" : "menu-item-card"} style={{
                          padding: isSub ? "8px 16px 8px 28px" : "16px 18px",
                          background: isSub ? "transparent" : C.cream,
                          borderRadius: isSub ? 12 : 18,
                          border: isSub ? `1.5px dashed ${C.oliveMid}20` : undefined,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div className="ff-body" style={{
                                fontSize: isSub ? 14 : "clamp(16px, 1.5vw, 19px)",
                                fontWeight: isSub ? 600 : 700,
                                lineHeight: 1.15,
                                color: isSub ? C.oliveMid : C.ink,
                                fontStyle: isSub ? "italic" : "normal",
                              }}>{item.name}</div>
                              {item.desc && (
                                <p className="ff-body" style={{ fontSize: isSub ? 13 : 14, lineHeight: 1.5, color: C.body, marginTop: 3 }}>{item.desc}</p>
                              )}
                            </div>
                            {item.price && !isSub && (
                              <div style={{
                                padding: "4px 10px", borderRadius: 999,
                                border: `2px solid ${C.olive}`, background: C.orange, color: C.warmWhite,
                                fontFamily: "'BogueSlab', serif", fontWeight: 700, fontSize: 13,
                                whiteSpace: "nowrap", flexShrink: 0,
                              }}>${item.price}</div>
                            )}
                            {item.price && isSub && (
                              <span className="ff-ui" style={{ fontSize: 11, color: C.oliveMid, fontWeight: 600, whiteSpace: "nowrap" }}>{item.price}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
              <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)", border: `3px solid ${C.olive}30` }}>
                <img src={A.maplefest} alt="Maple Fest 2026 — Saturday, March 28th at 27 Fairgrounds Road" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <button className="btn-accent" style={{ fontSize: 16, padding: "14px 36px" }}>RSVP for Maple Fest</button>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <PosterCard style={{ height: "100%" }}>
                <div style={{ padding: "clamp(24px, 3vw, 40px)" }}>
                  <SectionLabel>Upcoming Events</SectionLabel>
                  <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 0.96, marginTop: 12 }}>
                    More Than a Restaurant
                  </h2>
                  <Divider />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {EVENTS.map((event) => (
                      <div key={event.title} className="event-card" style={{
                        border: `2px solid ${event.featured ? C.orange + "50" : C.oliveMid + "25"}`,
                        background: event.featured ? `linear-gradient(135deg, ${C.cream}, #f0dca0)` : C.cream,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                          <div style={{ flexShrink: 0, width: 56, textAlign: "center" }}>
                            <div className="ff-display" style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: C.ink }}>{event.date.split(" ")[1]}</div>
                            <div className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.12em", color: C.oliveMid, marginTop: 2 }}>{event.date.split(" ")[0]}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <h3 className="ff-body" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.1 }}>{event.title}</h3>
                              <span style={{
                                padding: "3px 10px", borderRadius: 999, border: `1.5px solid ${C.olive}`,
                                background: event.featured ? C.orange : C.oliveMid, color: C.warmWhite,
                                fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700,
                                fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                              }}>{event.badge}</span>
                            </div>
                            <p className="ff-body" style={{ fontSize: 15, lineHeight: 1.55, color: C.body, marginTop: 5 }}>{event.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <button className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>View All Events →</button>
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
          <div className="gallery-grid">
            <div className="gallery-item" style={{ gridColumn: "1 / 3", gridRow: "1", overflow: "hidden" }}>
              <img src={A.wallpic_full1} alt="Nantucket Agricultural Fair — Horse racing and crowds, circa 1890s" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div className="gallery-item" style={{ gridColumn: "3 / 5", gridRow: "1", overflow: "hidden" }}>
              <img src={A.wallpic_full2} alt="Nantucket Fairgrounds — Community gathering with barn and carriages" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div className="gallery-item" style={{ gridColumn: "1 / 2", gridRow: "2", overflow: "hidden" }}>
              <img src={A.fairCrowd} alt="Nantucket Fair midway — crowds and game booths, circa 1920s" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div className="gallery-item" style={{ gridColumn: "2 / 5", gridRow: "2", overflow: "hidden" }}>
              <img src={A.wallpic1} alt="Historic horse race at the Nantucket Fair" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            </div>
          </div>
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
                  <img src={A.logoOrange} alt="The Faregrounds" draggable={false} style={{ width: 140, height: "auto", margin: "0 auto", display: "block", objectFit: "contain" }} />
                  <h2 className="ff-display ink-shadow" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, lineHeight: 0.96, marginTop: 16 }}>
                    Stay in the Loop
                  </h2>
                  <p className="ff-accent" style={{ fontSize: "clamp(17px, 1.6vw, 20px)", lineHeight: 1.7, color: C.body, maxWidth: 480, margin: "14px auto 0" }}>
                    Get the inside scoop on seasonal menus, events, and community happenings. No spam — just island-good stuff.
                  </p>
                  <div style={{
                    display: "flex", maxWidth: 460, margin: "24px auto 0",
                    borderRadius: 999, border: `2px solid ${C.olive}`, background: C.cream, padding: 4,
                  }}>
                    <input value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" className="ff-body"
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "12px 20px", fontSize: 16, color: C.ink, minWidth: 0 }}
                    />
                    <button className="btn-accent" style={{ borderRadius: 999, padding: "10px 24px", fontSize: 11, border: `2px solid ${C.olive}`, flexShrink: 0 }}>Join</button>
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
                      <span className="ff-display" style={{ fontSize: "clamp(22px, 2.5vw, 28px)", fontWeight: 900, color: C.ink, lineHeight: 1 }}>The Faregrounds</span>
                    </div>
                    <p className="ff-body" style={{ fontSize: 16, lineHeight: 1.7, color: C.body, marginTop: 14, maxWidth: 300 }}>
                      Seasonal food, local gatherings, and old-school community energy — built for Nantucket Island.
                    </p>
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      {[
                        { name: "instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                        { name: "facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                        { name: "twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                      ].map((icon) => (
                        <a key={icon.name} className="social-icon" href="#" aria-label={icon.name}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={icon.path}/></svg>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Explore</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                      {["Menu", "Events", "Our Story", "Visit Us", "Catering"].map((link) => <button key={link} className="footer-link">{link}</button>)}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Hours</SectionLabel>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                      {[["Mon–Thu", "8am – 3pm"], ["Fri–Sun", "8am – 8pm"], ["Events", "Seasonal evenings"]].map(([day, time]) => (
                        <div key={day} className="ff-body" style={{ fontSize: 16, color: C.body }}>
                          <span style={{ fontWeight: 700, color: C.ink }}>{day}</span><br/>{time}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Find Us</SectionLabel>
                    <div style={{ marginTop: 14 }}>
                      <a href="https://maps.google.com/?q=27+Fairgrounds+Rd,+Nantucket,+MA+02554" target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none" }}>
                        <div style={{
                          borderRadius: 16, border: "2px solid rgba(122,126,46,0.25)",
                          overflow: "hidden", marginBottom: 12,
                          cursor: "pointer", transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.olive; e.currentTarget.style.transform = "scale(1.02)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(122,126,46,0.25)"; e.currentTarget.style.transform = "scale(1)"; }}
                        >
                          <img src={A.nantucketMap} alt="Hand-drawn map of Nantucket Island showing The Faregrounds at 27 Fairgrounds Rd" style={{ width: "100%", height: "auto", display: "block" }} />
                        </div>
                      </a>
                      <div className="ff-display" style={{ fontSize: 17, fontWeight: 900, color: C.olive }}>27 Fairgrounds Road</div>
                      <div className="ff-body" style={{ fontSize: 15, color: C.body, marginTop: 3 }}>Nantucket, MA 02554</div>
                      <div className="ff-body" style={{ fontSize: 15, color: C.body, marginTop: 2 }}>(508) 555-FARE</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 32, paddingTop: 18, borderTop: "1px solid rgba(122,126,46,0.15)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                }}>
                  <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.14em", color: C.muted }}>© 2026 The Faregrounds • Nantucket Island</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="divider-line" style={{ width: 40 }} />
                    <WhaleTail size={18} style={{ opacity: 0.4 }} />
                    <div className="divider-line" style={{ width: 40 }} />
                  </div>
                  <span className="ff-ui" style={{ fontSize: 10, letterSpacing: "0.14em", color: C.muted }}>Privacy • Terms • Accessibility</span>
                </div>
              </div>
            </PosterCard>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}
