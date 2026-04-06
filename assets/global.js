
    document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedPartials();
  initCartPage();
});

async function loadSharedPartials() {
  try {
    const header = document.getElementById("header-placeholder");
    if (header) {
      const res = await fetch("./partials/header.html");
      if (res.ok) header.innerHTML = await res.text();
    }

    if (!document.querySelector('script[data-chat-script="true"]')) {
      const chatScript = document.createElement("script");
      chatScript.src = "./assets/chat.js";
      chatScript.defer = true;
      chatScript.dataset.chatScript = "true";
      document.body.appendChild(chatScript);
    } else {
      window.initChat?.();
    }

    const footer = document.getElementById("footer-placeholder");
    if (footer) {
      const res = await fetch("./partials/footer.html");
      if (res.ok) footer.innerHTML = await res.text();
    }
  } catch (error) {
    console.error("Kunde inte ladda header/footer:", error);
  }
}

function initCartPage() {
  const cartItemsEl = document.getElementById("cartItems");
  const summaryAreaEl = document.getElementById("summaryArea");
  const totalPriceEl = document.getElementById("totalPrice");
  const summaryCountEl = document.getElementById("summaryCount");
  const summaryRewardEl = document.getElementById("summaryReward");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const continueShoppingBtn = document.getElementById("continueShoppingBtn");

  if (
    !cartItemsEl ||
    !summaryAreaEl ||
    !totalPriceEl ||
    !summaryCountEl ||
    !summaryRewardEl ||
    !checkoutBtn
  ) {
    return;
  }

  let cart = readCart();

  renderAll();

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      cart = [];
      saveCart(cart);
      renderAll();
    });
  }

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "abonnemang.html";
    });
  }

  checkoutBtn.addEventListener("click", () => {
    if (!cart.length) return;
    window.location.href = "signera.html";
  });

  function renderAll() {
    renderCartItems();
    renderSummary();
    updateCheckoutState();
  }

  function renderCartItems() {
    if (!cart.length) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty">
          <h2 class="cart-empty__title">Din varukorg är tom</h2>
          <p class="cart-empty__text">
            Lägg till ett eller flera abonnemang från dina erbjudandesidor så visas de här.
          </p>
          <a href="abonnemang.html" class="cart-empty__btn">Se erbjudanden</a>
        </div>
      `;
      return;
    }

    cartItemsEl.innerHTML = cart
      .map((item, index) => {
        const title = escapeHtml(item.title || item.name || "Mobilabonnemang");
        const operator = escapeHtml(item.operator || item.company || "Okänd operatör");
        const offerId = escapeHtml(item.offerId || "-");
        const monthlyPrice = formatPrice(item.monthlyPrice || item.price || 0);
        const rewardTotal = formatPrice(item.rewardTotal || 0);
        const dataAmount = escapeHtml(item.dataLabel || item.data || item.surf || "Ej angivet");
        const binding = escapeHtml(item.bindingLabel || item.binding || "Ej angivet");
        const rewardRows = buildRewardRows(item.rewards);

        return `
          <article class="cart-item" data-index="${index}">
            <div class="cart-item__top">
              <div>
                <h3 class="cart-item__title">${title}</h3>
                <p class="cart-item__meta">
                  ${operator}<br>
                  ID: ${offerId}
                </p>
              </div>

              <button class="cart-remove-btn" data-remove-index="${index}" type="button">
                Ta bort
              </button>
            </div>

            <div class="cart-item__grid">
              <div class="cart-info-box">
                <p class="cart-info-box__label">Pris per månad</p>
                <p class="cart-info-box__value">${monthlyPrice}</p>
              </div>

              <div class="cart-info-box">
                <p class="cart-info-box__label">Surf</p>
                <p class="cart-info-box__value">${dataAmount}</p>
              </div>

              <div class="cart-info-box">
                <p class="cart-info-box__label">Bindningstid</p>
                <p class="cart-info-box__value">${binding}</p>
              </div>

              <div class="cart-info-box">
                <p class="cart-info-box__label">Belöningar</p>
                <div class="cart-reward-list">
                  ${rewardRows}
                </div>
              </div>

              <div class="cart-info-box">
                <p class="cart-info-box__label">Totalt belöningsvärde</p>
                <p class="cart-info-box__value">${rewardTotal}</p>
              </div>

              <div class="cart-info-box">
                <p class="cart-info-box__label">Status</p>
                <p class="cart-info-box__value">Klar för signering</p>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    cartItemsEl.querySelectorAll("[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.removeIndex);
        if (Number.isNaN(index)) return;

        cart.splice(index, 1);
        saveCart(cart);
        renderAll();
      });
    });
  }

  function renderSummary() {
    const totalMonthly = cart.reduce((sum, item) => {
      return sum + normalizeNumber(item.monthlyPrice || item.price || 0);
    }, 0);

    const totalReward = cart.reduce((sum, item) => {
      return sum + normalizeNumber(item.rewardTotal || 0);
    }, 0);

    summaryAreaEl.innerHTML = cart.length
      ? cart
          .map((item, index) => {
            const title = escapeHtml(item.title || item.name || `Abonnemang ${index + 1}`);
            const operator = escapeHtml(item.operator || item.company || "Okänd operatör");
            const monthlyPrice = formatPrice(item.monthlyPrice || item.price || 0);

            return `
              <div class="cart-summary-row">
                <span>${title}<br><small style="color:#64748b">${operator}</small></span>
                <span>${monthlyPrice}</span>
              </div>
            `;
          })
          .join("")
      : `
        <div class="cart-summary-row">
          <span>Inga abonnemang valda</span>
          <span>0 kr</span>
        </div>
      `;

    summaryCountEl.textContent = String(cart.length);
    summaryRewardEl.textContent = formatPrice(totalReward);
    totalPriceEl.textContent = formatPrice(totalMonthly);
  }

  function updateCheckoutState() {
    const hasItems = cart.length > 0;
    checkoutBtn.disabled = !hasItems;
    checkoutBtn.style.opacity = hasItems ? "1" : "0.55";
    checkoutBtn.style.cursor = hasItems ? "pointer" : "not-allowed";
  }
}

/*
  This is the data format this page can receive from other pages:

  {
    offerId: "tele2-25gb-001",
    title: "Tele2 25 GB",
    operator: "Tele2",
    monthlyPrice: 349,
    data: "25 GB",
    dataLabel: "25 GB",
    binding: "Utan bindningstid",
    bindingLabel: "Utan bindningstid",
    rewardTotal: 300,
    rewards: {
      "Amazon": 100,
      "H&M": 200
    }
  }

  Save one item or multiple items into localStorage key: dealettCart
*/

function readCart() {
  try {
    const raw = localStorage.getItem("dealettCart");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("dealettCart", JSON.stringify(cart));
}

function formatPrice(value) {
  const number = normalizeNumber(value);
  return `${number.toLocaleString("sv-SE")} kr`;
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildRewardRows(rewards) {
  if (!rewards || typeof rewards !== "object") {
    return `<div class="cart-reward-row"><span>Inga</span><span>0 kr</span></div>`;
  }

  const rows = Object.entries(rewards)
    .filter(([, value]) => normalizeNumber(value) > 0)
    .map(([company, value]) => {
      return `
        <div class="cart-reward-row">
          <span>${escapeHtml(company)}</span>
          <span>${formatPrice(value)}</span>
        </div>
      `;
    });

  return rows.length
    ? rows.join("")
    : `<div class="cart-reward-row"><span>Inga</span><span>0 kr</span></div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
  Optional helper for other pages:
  You can call this from any page later.
*/
window.addToDealettCart = function (item) {
  const cart = readCart();
  cart.push(item);
  saveCart(cart);
};

window.replaceDealettCart = function (items) {
  const safeItems = Array.isArray(items) ? items : [];
  saveCart(safeItems);
};

const cartDrawer = document.getElementById("cartDrawer");
const closeCartButton = document.getElementById("closeCart");
const cartOverlay = document.getElementById("cartOverlay");

function openCart() {
  cartDrawer?.classList.remove("hidden");
}

function closeCart() {
  cartDrawer?.classList.add("hidden");
}

window.openCart = openCart;
closeCartButton?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);
async function initApp() {
  if (typeof window.initChat === "function") {
    await window.initChat();
    return;
  }

  const chatScript = document.querySelector(
    'script[data-chat-script="true"], script[src="./assets/chat.js"], script[src="assets/chat.js"], script[src$="/assets/chat.js"]'
  );
  if (!chatScript) return;

  chatScript.addEventListener(
    "load",
    () => {
      window.initChat?.();
    },
    { once: true }
  );
}

initApp().catch((error) => {
  console.error("Main app init failed:", error);
});

    window.addEventListener("scroll", () => {
      const header = document.getElementById("mainHeader");
      if (!header) return;

      const row = header.querySelector(".relative.w-full");

      if (window.scrollY > 20) {
        header.classList.remove("header-overlay");
        header.classList.add("header-solid");
        header.classList.add("shadow-md");

        if (row) {
          row.classList.remove("h-16");
          row.classList.add("h-14");
        }
      } else {
        header.classList.remove("header-solid");
        header.classList.add("header-overlay");
        header.classList.remove("shadow-md");

        if (row) {
          row.classList.remove("h-14");
          row.classList.add("h-16");
        }
      }
    });
