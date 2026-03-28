const CART_KEY = "dealettCart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  cart.push(item);
  saveCart(cart);

  window.dispatchEvent(new Event("cartUpdated"));
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);

  window.dispatchEvent(new Event("cartUpdated"));
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
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
    total += item.price || 0;

    const rewardsHTML = Object.entries(item.rewards || {})
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `<div class="text-xs text-gray-500">${k}: ${v} kr</div>`)
      .join("");

    const el = document.createElement("div");
    el.className = "border rounded-xl p-4 flex gap-3";

    el.innerHTML = `
      <img src="${item.logo}" class="w-12 h-12 object-contain rounded-md border">

      <div class="flex-1">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold">${item.title}</p>
            <p class="text-sm text-gray-500">${item.operator}</p>
          </div>

          <button data-index="${index}" class="removeItem text-red-500 text-sm">Ta bort</button>
        </div>

        <div class="mt-2 text-sm">
          <strong>${item.price} kr/mån</strong>
        </div>

        <div class="mt-2">
          ${rewardsHTML || "<span class='text-xs text-gray-400'>Ingen belöning</span>"}
        </div>
      </div>
    `;

    container.appendChild(el);
  });

  totalEl.textContent = total + " kr";

  summary.innerHTML = `
    <div>Antal abonnemang: ${cart.length}</div>
  `;

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

  if (!drawer) return;

  window.openCart = () => {
    drawer.classList.remove("hidden");
  };

  function closeCart() {
    drawer.classList.add("hidden");
  }

  overlay?.addEventListener("click", closeCart);
  closeBtn?.addEventListener("click", closeCart);
});