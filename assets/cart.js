const CART_KEY = "dealettCart";

function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function notifyCartUpdated() {
  window.dispatchEvent(new Event("cartUpdated"));
  window.DEALETT_updateCartCount?.();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addToCart(item) {
  const cart = getCart();
  cart.push({
    ...item,
    cartItemId: item?.cartItemId || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  });
  saveCart(cart);

  notifyCartUpdated();
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);

  notifyCartUpdated();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  notifyCartUpdated();
}

// expose globally
window.cartAPI = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart
};
function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("totalPrice");
  const summary = document.getElementById("summaryArea");

  if (!container || !totalEl) return;

  const cart = getCart();
  container.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item?.price) || 0;
    const rewards = item && typeof item.rewards === "object" && item.rewards !== null
      ? item.rewards
      : {};
    const safeLogo = escapeHtml(item?.logo || "");
    const safeTitle = escapeHtml(item?.title || "Abonnemang");
    const safeOperator = escapeHtml(item?.operator || "Dealett");
    const safePrice = Number(item?.price) || 0;

    const rewardsHTML = Object.entries(rewards)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `<div class="text-xs text-gray-500">${escapeHtml(k)}: ${Number(v) || 0} kr</div>`)
      .join("");

    const el = document.createElement("div");
    el.className = "border rounded-xl p-4 flex gap-3";

    el.innerHTML = `
      <img src="${safeLogo}" alt="${safeOperator}" class="w-12 h-12 object-contain rounded-md border">

      <div class="flex-1">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold">${safeTitle}</p>
            <p class="text-sm text-gray-500">${safeOperator}</p>
          </div>

          <button data-index="${index}" class="removeItem text-red-500 text-sm">Ta bort</button>
        </div>

        <div class="mt-2 text-sm">
          <strong>${safePrice} kr/mån</strong>
        </div>

        <div class="mt-2">
          ${rewardsHTML || "<span class='text-xs text-gray-400'>Ingen belöning</span>"}
        </div>
      </div>
    `;

    container.appendChild(el);
  });

  totalEl.textContent = total + " kr";

  summary.textContent = `Antal abonnemang: ${cart.length}`;

  // remove handlers
  document.querySelectorAll(".removeItem").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(Number(btn.dataset.index));
    });
  });
}

// INIT + LISTENER
document.addEventListener("DOMContentLoaded", renderCart);
window.addEventListener("cartUpdated", renderCart);
document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  const closeBtn = document.getElementById("closeCart");
  const goToCartPageBtn = document.getElementById("goToCartPageBtn");

  if (!drawer) return;

  window.openCart = () => {
    drawer.classList.remove("hidden");
  };

  function closeCart() {
    drawer.classList.add("hidden");
  }

  overlay?.addEventListener("click", closeCart);
  closeBtn?.addEventListener("click", closeCart);

  goToCartPageBtn?.addEventListener("click", () => {
    const cart = getCart();
    if (!cart.length) return;
    window.location.href = "varukorg.html";
  });
});
