/**
 * The Fairgrounds — analytics layer.
 *
 * Wraps gtag.js (GA4) with a tiny, opinionated API:
 *   - track(event, params)         — generic event
 *   - pageview(path)               — for SPA navigation
 *   - trackCTA({ id, label, ... }) — tags every button/link click with a
 *                                    stable cta_id and fires derived events
 *
 * GA Measurement ID + Clarity Project ID are loaded directly from
 * window.__FG_ANALYTICS__ (set in index.html). Empty values = no-op (safe to
 * deploy before the IDs exist; turning them on later is a one-line change).
 */

const ANALYTICS = typeof window !== "undefined" ? (window.__FG_ANALYTICS__ || {}) : {};
const GA_ID = ANALYTICS.gaId || "";
const CLARITY_ID = ANALYTICS.clarityId || "";

export const isAnalyticsEnabled = Boolean(GA_ID);

function gtagSafe(...args) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag(...args);
}

/** Generic event passthrough. */
export function track(eventName, params = {}) {
  if (!GA_ID) return;
  gtagSafe("event", eventName, params);
}

/** Send a virtual pageview. Use on SPA route changes. */
export function pageview(path) {
  if (!GA_ID) return;
  gtagSafe("config", GA_ID, {
    page_path: path || (typeof location !== "undefined" ? location.pathname + location.search : "/"),
  });
}

/**
 * Track a CTA click with a stable id + meaningful params, and fire
 * higher-level derived events for the most important CTA types.
 */
export function trackCTA({ id, label, destination, section, type } = {}) {
  if (!GA_ID) return;

  const params = {
    cta_id: id,
    cta_label: label,
    cta_destination: destination,
    cta_section: section,
    cta_type: type,
    page_path: typeof location !== "undefined" ? location.pathname : "/",
  };

  track("cta_click", params);

  // Derived high-signal events
  switch (type) {
    case "reservation":
      track("reservation_intent", {
        platform: id?.replace("reserve_", "") || "unknown",
        destination,
        label,
      });
      break;
    case "phone":
      track("phone_click", { number: destination });
      break;
    case "email":
      track("email_click", { address: destination });
      break;
    case "menu_pdf":
      track("menu_view", { menu_name: label });
      break;
    case "social":
      track("social_click", {
        platform: id?.replace("social_", "") || "unknown",
        destination,
      });
      break;
    case "directions":
      track("directions_click", { destination });
      break;
    case "order":
      track("order_intent", {
        platform: id?.replace("order_", "") || "unknown",
        destination,
        label,
      });
      break;
    default:
      break;
  }
}

/**
 * Install a single global click delegate that catches every <a> and <button>
 * with a `data-cta-id` attribute — the lazy/forgiving wiring path. Pages can
 * also call trackCTA() directly for full control.
 */
export function installGlobalClickTracker() {
  if (typeof document === "undefined") return;
  if (document.__fg_click_tracker_installed) return;
  document.__fg_click_tracker_installed = true;

  document.addEventListener(
    "click",
    (e) => {
      const el = e.target?.closest?.("[data-cta-id]");
      if (!el) return;
      trackCTA({
        id: el.dataset.ctaId,
        label: el.dataset.ctaLabel || el.textContent?.trim()?.slice(0, 80),
        destination: el.dataset.ctaDestination || el.getAttribute("href") || "",
        section: el.dataset.ctaSection || "",
        type: el.dataset.ctaType || "internal_nav",
      });
    },
    true,
  );
}

export const analyticsConfig = { GA_ID, CLARITY_ID };
