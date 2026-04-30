const DEALett_SHARED_STYLES = [
  "assets/header.css",
  "assets/footer.css"
];

const DEALETT_CART_KEY = "dealettCart";

window.DEALETT_SHARED_LAYOUT_ACTIVE = true;

document.addEventListener("DOMContentLoaded", () => {
  void initSharedLayout().catch(error => {
    console.error("Kunde inte starta delad layout:", error);
  });
});

async function initSharedLayout() {
  ensureSharedStyles();
  await Promise.all([
    loadPartialInto("#header-placeholder", "partials/header.html"),
    loadPartialInto("#footer-placeholder", "partials/footer.html")
  ]);
  dedupeSharedFooters();
  initSharedHeader();
  initSharedCartCount();
  ensureChatScript();
}

function dedupeSharedFooters() {
  const footers = Array.from(document.querySelectorAll("footer.site-footer"));
  if (footers.length <= 1) {
    return;
  }

  footers.slice(1).forEach(footer => footer.remove());
}

async function loadPartialInto(selector, url) {
  const target = document.querySelector(selector);
  if (!target || target.dataset.sharedLoaded === "true") {
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kunde inte ladda ${url}`);
  }

  target.innerHTML = await response.text();
  target.dataset.sharedLoaded = "true";
}

function ensureSharedStyles() {
  for (const href of DEALett_SHARED_STYLES) {
    const existing = document.querySelector(`link[data-shared-style="${href}"]`);
    if (existing) {
      continue;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.sharedStyle = href;
    document.head.appendChild(link);
  }
}

function ensureChatScript() {
  const existingScript = Array.from(document.scripts).some(script => {
    try {
      return script.src.endsWith("/assets/chat.js") || script.src.endsWith("assets/chat.js");
    } catch {
      return false;
    }
  });

  if (existingScript) {
    window.initChat?.();
    return;
  }

  if (typeof window.initChat === "function") {
    window.initChat();
    return;
  }

  const chatScript = document.createElement("script");
  chatScript.src = "assets/chat.js";
  chatScript.defer = true;
  chatScript.dataset.chatScript = "true";
  document.body.appendChild(chatScript);
}

function initSharedHeader() {
  const header = document.getElementById("mainHeader");
  if (!header || header.dataset.ready === "true") {
    syncHeaderState();
    markActiveHeaderLinks();
    return;
  }

  const toggle = document.getElementById("headerMenuToggle");
  const close = document.getElementById("headerMenuClose");
  const panel = document.getElementById("headerMobilePanel");
  const backdrop = document.getElementById("headerMenuBackdrop");
  const mobileLinks = header.querySelectorAll(".site-header__mobile-link, .site-header__mobile-button, .site-header__mobile-switch");

  const closeMenu = () => {
    if (!panel || !backdrop || !toggle) {
      return;
    }

    panel.hidden = true;
    backdrop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("header-menu-open");
  };

  const openMenu = () => {
    if (!panel || !backdrop || !toggle) {
      return;
    }

    panel.hidden = false;
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("header-menu-open");
  };

  toggle?.addEventListener("click", () => {
    if (panel?.hidden === false) {
      closeMenu();
      return;
    }

    openMenu();
  });

  close?.addEventListener("click", closeMenu);
  backdrop?.addEventListener("click", closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1180) {
      closeMenu();
    }

    syncHeaderState();
  });

  window.addEventListener("scroll", syncHeaderState, { passive: true });
  window.addEventListener("load", syncHeaderState, { once: true });
  syncHeaderState();
  markActiveHeaderLinks();
  header.dataset.ready = "true";
}

function getSharedCartCount() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DEALETT_CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function syncSharedCartCount() {
  const count = getSharedCartCount();

  document.querySelectorAll("[data-cart-count]").forEach(element => {
    element.textContent = String(count);
    element.hidden = count <= 0;
    element.setAttribute("aria-label", `${count} varor i varukorgen`);
  });
}

function initSharedCartCount() {
  syncSharedCartCount();
  window.DEALETT_updateCartCount = syncSharedCartCount;

  if (window.DEALETT_CART_COUNT_BOUND === true) {
    return;
  }

  window.DEALETT_CART_COUNT_BOUND = true;
  window.addEventListener("cartUpdated", syncSharedCartCount);
  window.addEventListener("storage", event => {
    if (event.key === DEALETT_CART_KEY) {
      syncSharedCartCount();
    }
  });
}

function syncHeaderState() {
  const header = document.getElementById("mainHeader");
  if (!header) {
    return;
  }

  const overlayMode = document.body.dataset.headerMode === "overlay";
  const forceSolid = document.body.dataset.headerSolid === "true";
  const isScrolled = window.scrollY > 24;
  const overlayTheme = resolveHeaderTheme();
  const isSolid = forceSolid || !overlayMode || hasHeaderPassedOverlayTarget(header);

  header.dataset.theme = overlayTheme;
  header.classList.toggle("is-solid", isSolid);
  header.classList.toggle("is-scrolled", isScrolled);
  header.dataset.overlay = overlayMode && !isSolid ? "true" : "false";
}

function markActiveHeaderLinks() {
  const currentPath = decodeURIComponent(window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const links = document.querySelectorAll("[data-route]");

  links.forEach(link => {
    const route = (link.getAttribute("data-route") || "").toLowerCase();
    link.classList.toggle("is-current", route === currentPath);
  });
}

function resolveHeaderTheme() {
  const theme = (document.body.dataset.headerTheme || "").toLowerCase();
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return document.body.dataset.headerSolid === "true" ? "dark" : "light";
}

function hasHeaderPassedOverlayTarget(header) {
  const target = getHeaderOverlayTarget();
  if (!target) {
    return window.scrollY > Math.max(24, header.offsetHeight);
  }

  const rect = target.getBoundingClientRect();
  return rect.bottom <= header.offsetHeight + 12;
}

function getHeaderOverlayTarget() {
  const selector = document.body.dataset.headerAnchor;
  if (selector) {
    try {
      const target = document.querySelector(selector);
      if (target) {
        return target;
      }
    } catch (error) {
      console.warn("Ogiltig selector i data-header-anchor:", error);
    }
  }

  return document.querySelector("[data-header-anchor-target]");
}
