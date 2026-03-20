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