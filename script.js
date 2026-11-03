
"use strict";

/* =========================================================
   PETAL & VINE FLOWER BOUTIQUE
   COMPLETE CONNECTED JAVASCRIPT
   Storage: Browser LocalStorage
   Database: Not Required
========================================================= */

/* =========================================================
   1. STORAGE AND CONFIGURATION
========================================================= */

const DB = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  carts: "pv_carts",
  session: "pv_session",
  queue: "pv_order_queue",
  counters: "pv_counters"
};

const $ = id => document.getElementById(id);

let users = [];
let products = [];
let orders = [];
let carts = {};

let currentUser = null;
let currentRole = null;
let currentPage = "";
let toastTimer = null;

/* Currently edited product */
let selectedProduct = null;

/* Products selected for checkout */
let selectedCartProducts = new Set();

let nextProductId = 1;
let nextOrderId = 1;
let orderQueue;

/* =========================================================
   2. HELPER FUNCTIONS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("en-PH");
}

function notify(message, type = "success") {
  const toast = $("toast");
  if (!toast) return;

  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.remove("hidden", "show", "error");

  if (type === "error") {
    toast.classList.add("error");
  }

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 2800);
}

function validPhone(phone) {
  return /^[0-9+\-\s()]{7,20}$/.test(phone.trim());
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error("Storage read error:", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage save error:", error);
    notify("Unable to save. Browser storage may be full.", "error");
    return false;
  }
}

function saveAll() {
  try {
    localStorage.setItem(DB.users, JSON.stringify(users));
    localStorage.setItem(DB.products, JSON.stringify(products));
    localStorage.setItem(DB.orders, JSON.stringify(orders));
    localStorage.setItem(DB.carts, JSON.stringify(carts));
    localStorage.setItem(DB.queue, JSON.stringify(orderQueue.toArray()));

    localStorage.setItem(DB.counters, JSON.stringify({
      product: nextProductId,
      order: nextOrderId
    }));

    return true;
  } catch (error) {
    console.error("Save error:", error);
    notify("Unable to save application data.", "error");
    return false;
  }
}

function getCart() {
  if (!currentUser) return [];

  if (!Array.isArray(carts[currentUser.id])) {
    carts[currentUser.id] = [];
  }

  return carts[currentUser.id];
}

function setCart(cart) {
  if (!currentUser) return false;

  const oldCart = carts[currentUser.id] || [];
  carts[currentUser.id] = cart;

  if (!save(DB.carts, carts)) {
    carts[currentUser.id] = oldCart;
    return false;
  }

  updateCartCount();
  return true;
}

/* =========================================================
   3. FIFO QUEUE DATA STRUCTURE
========================================================= */

class OrderQueue {
  constructor(items = []) {
    this.items = Array.isArray(items) ? [...items] : [];
  }

  enqueue(id) {
    if (!this.items.includes(id)) {
      this.items.push(id);
    }
  }

  dequeue() {
    return this.items.shift() ?? null;
  }

  peek() {
    return this.items[0] ?? null;
  }

  remove(id) {
    this.items = this.items.filter(item => item !== id);
  }

  toArray() {
    return [...this.items];
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

orderQueue = new OrderQueue();

/* =========================================================
   4. DEFAULT PRODUCTS AND ADMIN ACCOUNT
========================================================= */

const defaultProducts = [
  {
    name: "Classic Red Roses",
    category: "Rose",
    description: "A beautiful bouquet of romantic red roses.",
    price: 850,
    stock: 20,
    image: "🌹"
  },
  {
    name: "Pink Rose Bouquet",
    category: "Rose",
    description: "Soft pink roses for thoughtful occasions.",
    price: 950,
    stock: 15,
    image: "🌸"
  },
  {
    name: "Golden Sunflowers",
    category: "Sunflower",
    description: "Bright sunflowers to bring happiness.",
    price: 750,
    stock: 18,
    image: "🌻"
  },
  {
    name: "Purple Tulips",
    category: "Tulip",
    description: "Elegant purple tulips for special moments.",
    price: 1100,
    stock: 12,
    image: "🌷"
  },
  {
    name: "Mixed Flower Bouquet",
    category: "Mixed Bouquet",
    description: "A colorful arrangement of seasonal flowers.",
    price: 1250,
    stock: 10,
    image: "💐"
  },
  {
    name: "White Lily Arrangement",
    category: "Other",
    description: "Elegant white lilies with a graceful finish.",
    price: 980,
    stock: 14,
    image: "🪷"
  }
];

function initializeData() {
  users = read(DB.users, []);
  products = read(DB.products, []);
  orders = read(DB.orders, []);
  carts = read(DB.carts, {});
  orderQueue = new OrderQueue(read(DB.queue, []));

  const counters = read(DB.counters, {});

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];

  if (!carts || typeof carts !== "object" || Array.isArray(carts)) {
    carts = {};
  }

  if (!products.length) {
    products = defaultProducts.map((product, index) => ({
      ...product,
      id: index + 1
    }));
  }

  users = users.map(user => ({
    ...user,
    active: user.active !== false,
    role: user.role || "customer"
  }));

  orders = orders.map(order => ({
    ...order,
    items: Array.isArray(order.items) ? order.items : [],
    status: order.status || "Pending"
  }));

  /* Remove invalid cart entries and repair quantities. */
  Object.keys(carts).forEach(userId => {
    if (!Array.isArray(carts[userId])) {
      carts[userId] = [];
      return;
    }

    carts[userId] = carts[userId].filter(item => {
      const product = products.find(
        p => Number(p.id) === Number(item.productId)
      );

      return product &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0;
    }).map(item => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity)
    }));
  });

  nextProductId = Math.max(
    Number(counters.product) || 1,
    ...products.map(product => (Number(product.id) || 0) + 1),
    1
  );

  nextOrderId = Math.max(
    Number(counters.order) || 1,
    ...orders.map(order => (Number(order.id) || 0) + 1),
    1
  );

  const hasAdmin = users.some(user => user.role === "admin");

  if (!hasAdmin) {
    users.push({
      id: Math.max(0, ...users.map(user => Number(user.id) || 0)) + 1,
      fullName: "Petal & Vine Administrator",
      username: "admin",
      password: "Admin123",
      role: "admin",
      active: true,
      phone: "",
      address: "",
      createdAt: new Date().toISOString()
    });
  }

  const pendingIds = orders
    .filter(order => order.status === "Pending")
    .map(order => order.id);

  const savedQueue = orderQueue.toArray();

  orderQueue = new OrderQueue([
    ...savedQueue.filter(id => pendingIds.includes(id)),
    ...pendingIds.filter(id => !savedQueue.includes(id))
  ]);

  saveAll();
}

/* =========================================================
   5. AUTHENTICATION
========================================================= */

function showLogin() {
  if (!$("loginForm")) return;

  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");

  if ($("loginMessage")) $("loginMessage").textContent = "";
}

function showRegister() {
  if (!$("registerForm")) return;

  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");

  if ($("registerMessage")) $("registerMessage").textContent = "";
}

function showAuth() {
  if ($("authScreen")) $("authScreen").classList.remove("hidden");
  if ($("appScreen")) $("appScreen").classList.add("hidden");
  showLogin();
}

function login(username, password) {
  const user = users.find(item =>
    String(item.username).toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    $("loginMessage").textContent = "Incorrect username or password.";
    return;
  }

  if (user.active === false) {
    $("loginMessage").textContent = "Your account has been disabled.";
    return;
  }

  currentUser = user;
  currentRole = user.role;

  user.lastLogin = new Date().toISOString();

  if (!save(DB.users, users)) return;

  if (!save(DB.session, { userId: user.id })) {
    currentUser = null;
    currentRole = null;
    return;
  }

  openApplication();
}

if ($("loginForm")) {
  $("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    login(
      $("loginUsername").value.trim(),
      $("loginPassword").value
    );
  });
}

if ($("registerForm")) {
  $("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const fullName = $("registerName").value.trim();
    const username = $("registerUsername").value.trim();
    const password = $("registerPassword").value;
    const confirm = $("registerConfirm").value;

    if (fullName.length < 2 || fullName.length > 100) {
      $("registerMessage").textContent = "Enter a valid full name.";
      return;
    }

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      $("registerMessage").textContent =
        "Username must be 3–30 characters and use letters, numbers, dots, underscores or hyphens.";
      return;
    }

    if (password.length < 6) {
      $("registerMessage").textContent =
        "Password must contain at least 6 characters.";
      return;
    }

    if (password !== confirm) {
      $("registerMessage").textContent = "Passwords do not match.";
      return;
    }

    if (users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      $("registerMessage").textContent = "Username is already taken.";
      return;
    }

    const user = {
      id: Math.max(0, ...users.map(item => Number(item.id) || 0)) + 1,
      fullName,
      username,
      password,
      role: "customer",
      active: true,
      phone: "",
      address: "",
      createdAt: new Date().toISOString()
    };

    users.push(user);

    if (!save(DB.users, users)) {
      users.pop();
      return;
    }

    $("registerForm").reset();
    $("loginUsername").value = username;

    showLogin();
    $("loginMessage").textContent =
      "Account created successfully. Please log in.";
  });
}

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    if (!input) return;

    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "Show" : "Hide";
  });
});

function logout() {
  if (!confirm("Are you sure you want to log out?")) return;

  localStorage.removeItem(DB.session);

  currentUser = null;
  currentRole = null;
  selectedCartProducts.clear();

  showAuth();
  notify("You have logged out.");
}

if ($("logoutButton")) {
  $("logoutButton").addEventListener("click", logout);
}

function restoreSession() {
  const session = read(DB.session, null);

  if (!session) {
    showAuth();
    return;
  }

  const user = users.find(item =>
    Number(item.id) === Number(session.userId) &&
    item.active !== false
  );

  if (!user) {
    localStorage.removeItem(DB.session);
    showAuth();
    return;
  }

  currentUser = user;
  currentRole = user.role;

  openApplication();
}

/* =========================================================
   6. MAIN APPLICATION AND NAVIGATION
========================================================= */

function openApplication() {
  if (!currentUser) return;

  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent = currentUser.fullName;
  $("welcomeText").textContent = currentUser.fullName;

  $("roleLabel").textContent =
    currentRole === "admin" ? "Administrator" : "Customer";

  $("customerNav").classList.toggle("hidden", currentRole !== "customer");
  $("adminNav").classList.toggle("hidden", currentRole !== "admin");

  selectedCartProducts.clear();

  if (currentRole === "admin") {
    adminPage("dashboard");
  } else {
    customerPage("shop");
  }

  updateCartCount();
}

function goHome() {
  if (currentRole === "admin") {
    adminPage("dashboard");
  } else {
    customerPage("shop");
  }
}

function closeAllPages() {
  document.querySelectorAll(".main-content .page").forEach(page => {
    page.classList.add("hidden");
  });
}

function activateNav(nav, button) {
  if (!nav) return;

  nav.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (button) button.classList.add("active");
}

function setPage(id, title) {
  closeAllPages();

  const page = $(id);
  if (!page) return;

  page.classList.remove("hidden");

  if ($("pageTitle")) {
    $("pageTitle").textContent = title;
  }

  currentPage = id;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function customerPage(page, button) {
  if (currentRole !== "customer") return;

  activateNav($("customerNav"), button);

  const pages = {
    shop: ["customer-shop", "Shop Flowers"],
    cart: ["customer-cart", "My Cart"],
    orders: ["customer-orders", "My Orders"],
    receipts: ["customer-receipts", "Receipts"],
    transactions: ["customer-transactions", "Transactions"],
    profile: ["customer-profile", "My Profile"],
    about: ["customer-about", "About Us"]
  };

  if (!pages[page]) return;

  setPage(...pages[page]);

  switch (page) {
    case "shop": renderShop(); break;
    case "cart": renderCart(); break;
    case "orders": renderCustomerOrders(); break;
    case "receipts": renderCustomerReceipts(); break;
    case "transactions": renderTransactions(); break;
    case "profile": loadProfile(); break;
  }
}

function adminPage(page, button) {
  if (currentRole !== "admin") return;

  activateNav($("adminNav"), button);

  const pages = {
    dashboard: ["admin-dashboard", "Dashboard"],
    products: ["admin-products", "Products"],
    inventory: ["admin-inventory", "Inventory"],
    orders: ["admin-orders", "Orders"],
    users: ["admin-users", "Customers"],
    settings: ["admin-settings", "Settings"]
  };

  if (!pages[page]) return;

  setPage(...pages[page]);

  switch (page) {
    case "dashboard": renderDashboard(); break;
    case "products": renderAdminProducts(); break;
    case "inventory": renderInventory(); break;
    case "orders": renderAdminOrders(); break;
    case "users": renderAdminUsers(); break;
    case "settings": loadSettings(); break;
  }
}

function closeModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add("hidden");
}

window.showLogin = showLogin;
window.showRegister = showRegister;
window.goHome = goHome;
window.customerPage = customerPage;
window.adminPage = adminPage;
window.logout = logout;
window.closeModal = closeModal;

/* =========================================================
   7. PRODUCT IMAGE AND PRODUCT CARD
========================================================= */

function isImageSource(value) {
  const image = String(value || "").trim();

  return /^https?:\/\//i.test(image) ||
    /^data:image\//i.test(image);
}

function productVisual(product, className = "product-image") {
  const image = String(product.image || "").trim();

  if (isImageSource(image)) {
    return `
      <div class="${className}">
        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
          onerror="this.parentElement.textContent='🌸'"
        >
      </div>
    `;
  }

  return `
    <div class="${className}">
      ${escapeHTML(image || "🌸")}
    </div>
  `;
}

function productCard(product) {
  const outOfStock = Number(product.stock) <= 0;

  return `
    <article class="product-card">

      ${productVisual(product)}

      <div class="product-info">

        <h3>${escapeHTML(product.name)}</h3>

        <p>
          ${escapeHTML(product.description || product.category)}
        </p>

        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="stock">
            ${outOfStock ? "Out of stock" : `${product.stock} available`}
          </span>
        </div>

        <div class="quantity-row">

          <input
            type="number"
            min="1"
            max="${product.stock}"
            value="1"
            aria-label="Quantity for ${escapeHTML(product.name)}"
            data-quantity="${product.id}"
            ${outOfStock ? "disabled" : ""}
          >

          <button
            class="btn btn-primary"
            type="button"
            data-add-cart="${product.id}"
            ${outOfStock ? "disabled" : ""}
          >
            Add to Cart
          </button>

        </div>

        <button
          class="btn btn-outline full"
          type="button"
          data-buy-now="${product.id}"
          ${outOfStock ? "disabled" : ""}
        >
          Buy Now
        </button>

      </div>
    </article>
  `;
}

function bindShopActions(container) {
  if (!container) return;

  container.querySelectorAll("[data-add-cart]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.addCart);
      const input = container.querySelector(`[data-quantity="${id}"]`);

      addToCart(id, Number(input?.value || 1));
    });
  });

  container.querySelectorAll("[data-buy-now]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.buyNow);
      const input = container.querySelector(`[data-quantity="${id}"]`);

      if (addToCart(id, Number(input?.value || 1))) {
        selectedCartProducts.clear();
        selectedCartProducts.add(String(id));
        customerPage("cart");
      }
    });
  });
}

/* =========================================================
   8. CUSTOMER SHOP
========================================================= */

function renderShop() {
  if (currentRole !== "customer") return;

  const query = $("productSearch")
    ? $("productSearch").value.toLowerCase().trim()
    : "";

  const list = products.filter(product =>
    String(product.name || "").toLowerCase().includes(query) ||
    String(product.category || "").toLowerCase().includes(query) ||
    String(product.description || "").toLowerCase().includes(query)
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No flowers found.</div>';

  bindShopActions($("shopProducts"));
}

if ($("productSearch")) {
  $("productSearch").addEventListener("input", renderShop);
}

/* =========================================================
   9. SHOPPING CART WITH PRODUCT SELECTION
========================================================= */

function addToCart(productId, quantity) {
  if (currentRole !== "customer") return false;

  const product = products.find(
    item => Number(item.id) === Number(productId)
  );

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    notify("Please enter a valid quantity.", "error");
    return false;
  }

  if (quantity > product.stock) {
    notify("Not enough stock available.", "error");
    return false;
  }

  const cart = getCart();

  const existing = cart.find(
    item => Number(item.productId) === Number(productId)
  );

  const newQuantity = Number(existing?.quantity || 0) + quantity;

  if (newQuantity > product.stock) {
    notify("Cart quantity exceeds available stock.", "error");
    return false;
  }

  const updated = existing
    ? cart.map(item =>
        Number(item.productId) === Number(productId)
          ? { ...item, quantity: newQuantity }
          : { ...item }
      )
    : [...cart, { productId: product.id, quantity }];

  if (!setCart(updated)) return false;

  renderShop();
  notify("Flower added to your cart.");

  return true;
}

function updateCartCount() {
  const count = getCart().reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }
}

/* Return only valid cart products. */
function getValidCartItems() {
  return getCart().map(item => ({
    ...item,
    product: products.find(
      product => Number(product.id) === Number(item.productId)
    )
  })).filter(item => item.product);
}

/* Return selected cart products only. */
function getSelectedCartItems() {
  return getValidCartItems().filter(item =>
    selectedCartProducts.has(String(item.productId))
  );
}

function toggleCartProduct(productId, checked) {
  const key = String(productId);

  if (checked) {
    selectedCartProducts.add(key);
  } else {
    selectedCartProducts.delete(key);
  }

  renderCart();
}

function toggleSelectAllCart(checked) {
  if (checked) {
    getValidCartItems().forEach(item => {
      selectedCartProducts.add(String(item.productId));
    });
  } else {
    selectedCartProducts.clear();
  }

  renderCart();
}

function removeFromCart(productId) {
  const updated = getCart().filter(
    item => Number(item.productId) !== Number(productId)
  );

  if (setCart(updated)) {
    selectedCartProducts.delete(String(productId));
    renderCart();
    notify("Product removed from cart.");
  }
}

function changeCartQuantity(productId, quantity) {
  const product = products.find(
    item => Number(item.id) === Number(productId)
  );

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    notify("Please enter a valid quantity.", "error");
    renderCart();
    return;
  }

  if (quantity > product.stock) {
    notify("Quantity exceeds available stock.", "error");
    renderCart();
    return;
  }

  const updated = getCart().map(item =>
    Number(item.productId) === Number(productId)
      ? { ...item, quantity }
      : { ...item }
  );

  if (setCart(updated)) renderCart();
}

function renderCart() {
  if (currentRole !== "customer") return;

  const cart = getValidCartItems();

  /* Remove selections for products no longer in the cart. */
  const validIds = new Set(
    cart.map(item => String(item.productId))
  );

  selectedCartProducts.forEach(id => {
    if (!validIds.has(id)) selectedCartProducts.delete(id);
  });

  if (!cart.length) {
    $("cartContent").innerHTML = `
      <div class="empty-state">
        <strong>Your cart is empty.</strong>
        <p>Browse our flower collection and add your favorites.</p>

        <button
          class="btn btn-primary"
          type="button"
          onclick="customerPage('shop')"
        >
          Continue Shopping
        </button>
      </div>
    `;

    updateCartCount();
    return;
  }

  const selectedItems = getSelectedCartItems();

  const selectedTotal = selectedItems.reduce(
    (sum, item) =>
      sum + Number(item.product.price) * Number(item.quantity),
    0
  );

  const selectedQuantity = selectedItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const allSelected =
    cart.length > 0 && cart.every(item =>
      selectedCartProducts.has(String(item.productId))
    );

  $("cartContent").innerHTML = `
    <div class="cart-layout">

      <div class="cart-products-area">

        <div class="cart-select-all">
          <label>
            <input
              type="checkbox"
              id="selectAllCart"
              ${allSelected ? "checked" : ""}
            >
            <strong>Select All Products</strong>
          </label>
        </div>

        ${cart.map(item => {
          const product = item.product;
          const isSelected = selectedCartProducts.has(
            String(item.productId)
          );

          return `
            <div class="cart-item">

              <label class="cart-item-checkbox">
                <input
                  type="checkbox"
                  data-select-cart="${product.id}"
                  ${isSelected ? "checked" : ""}
                  aria-label="Select ${escapeHTML(product.name)}"
                >
              </label>

              <div class="cart-thumb">
                ${
                  isImageSource(product.image)
                    ? `
                      <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                      >
                    `
                    : escapeHTML(product.image || "🌸")
                }
              </div>

              <div class="cart-detail">
                <strong>${escapeHTML(product.name)}</strong>
                <small>${money(product.price)} each</small>
                <small>${product.stock} available</small>
              </div>

              <input
                class="cart-quantity"
                type="number"
                min="1"
                max="${product.stock}"
                value="${item.quantity}"
                aria-label="Quantity for ${escapeHTML(product.name)}"
                data-cart-quantity="${product.id}"
              >

              <strong>
                ${money(product.price * item.quantity)}
              </strong>

              <button
                class="btn-danger"
                type="button"
                data-remove-cart="${product.id}"
              >
                Remove
              </button>

            </div>
          `;
        }).join("")}

      </div>

      <aside class="cart-summary">

        <h2>Order Summary</h2>

        <div class="summary-line">
          <span>Products in Cart</span>
          <strong>${cart.length}</strong>
        </div>

        <div class="summary-line">
          <span>Selected Quantity</span>
          <strong>${selectedQuantity}</strong>
        </div>

        <div class="summary-line">
          <span>Selected Products</span>
          <strong>${selectedItems.length}</strong>
        </div>

        <div class="summary-line summary-total">
          <span>Selected Total</span>
          <strong>${money(selectedTotal)}</strong>
        </div>

        <button
          class="btn btn-primary full"
          id="cartCheckout"
          type="button"
          ${selectedItems.length === 0 ? "disabled" : ""}
        >
          Checkout Selected (${selectedItems.length})
        </button>

        <button
          class="btn btn-outline full"
          type="button"
          onclick="customerPage('shop')"
        >
          Continue Shopping
        </button>

        <p class="muted">
          Only selected products will be included in your order.
          Unselected products will remain in your cart.
        </p>

      </aside>

    </div>
  `;

  $("selectAllCart").addEventListener("change", event => {
    toggleSelectAllCart(event.target.checked);
  });

  $("cartContent").querySelectorAll("[data-select-cart]").forEach(input => {
    input.addEventListener("change", () => {
      toggleCartProduct(
        Number(input.dataset.selectCart),
        input.checked
      );
    });
  });

  $("cartContent").querySelectorAll("[data-cart-quantity]").forEach(input => {
    input.addEventListener("change", () => {
      changeCartQuantity(
        Number(input.dataset.cartQuantity),
        Number(input.value)
      );
    });
  });

  $("cartContent").querySelectorAll("[data-remove-cart]").forEach(button => {
    button.addEventListener("click", () => {
      removeFromCart(Number(button.dataset.removeCart));
    });
  });

  $("cartCheckout").addEventListener("click", openCheckout);
}

/* =========================================================
   10. CHECKOUT - SELECTED PRODUCTS ONLY
========================================================= */

function openCheckout() {
  if (currentRole !== "customer") return;

  const items = getSelectedCartItems();

  if (!items.length) {
    notify("Please select at least one product to checkout.", "error");
    return;
  }

  const unavailable = items.some(item =>
    !item.product ||
    !Number.isInteger(Number(item.quantity)) ||
    Number(item.quantity) < 1 ||
    Number(item.quantity) > Number(item.product.stock)
  );

  if (unavailable) {
    notify("Please update your selection. Some items are unavailable.", "error");
    renderCart();
    return;
  }

  const total = items.reduce(
    (sum, item) =>
      sum + Number(item.product.price) * Number(item.quantity),
    0
  );

  $("checkoutSummary").innerHTML = `
    <div class="cart-summary">

      <h3>Selected Products</h3>

      ${items.map(item => `
        <div class="summary-line">
          <span>
            ${escapeHTML(item.product.name)} × ${item.quantity}
          </span>

          <strong>
            ${money(item.product.price * item.quantity)}
          </strong>
        </div>
      `).join("")}

      <div class="summary-line summary-total">
        <span>Total</span>
        <strong>${money(total)}</strong>
      </div>

    </div>
  `;

  $("checkoutName").value = currentUser.fullName || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  $("checkoutModal").classList.remove("hidden");
}

if ($("checkoutForm")) {
  $("checkoutForm").addEventListener("submit", event => {
    event.preventDefault();

    if (currentRole !== "customer") return;

    const name = $("checkoutName").value.trim();
    const phone = $("checkoutPhone").value.trim();
    const address = $("checkoutAddress").value.trim();

    if (name.length < 2 || name.length > 100) {
      notify("Please enter a valid name.", "error");
      return;
    }

    if (!validPhone(phone)) {
      notify("Please enter a valid phone number.", "error");
      return;
    }

    if (address.length < 8 || address.length > 300) {
      notify("Please enter a complete delivery address.", "error");
      return;
    }

    /* Get only selected products. */
    const selectedItems = getSelectedCartItems();

    if (!selectedItems.length) {
      notify("Please select at least one product.", "error");
      closeModal("checkoutModal");
      return;
    }

    const orderItems = [];

    for (const cartItem of selectedItems) {
      const product = products.find(
        item => Number(item.id) === Number(cartItem.productId)
      );

      if (
        !product ||
        !Number.isInteger(Number(cartItem.quantity)) ||
        Number(cartItem.quantity) < 1 ||
        Number(cartItem.quantity) > Number(product.stock)
      ) {
        notify(
          "An item is unavailable or has insufficient stock.",
          "error"
        );
        return;
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: Number(product.price),
        quantity: Number(cartItem.quantity),
        subtotal: Number(product.price) * Number(cartItem.quantity)
      });
    }

    const total = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    /* Save original data for rollback if storage fails. */
    const oldProducts = products.map(product => ({ ...product }));
    const oldOrders = [...orders];
    const oldQueue = orderQueue.toArray();
    const oldId = nextOrderId;
    const oldCarts = JSON.parse(JSON.stringify(carts));

    const oldUser = {
      fullName: currentUser.fullName,
      phone: currentUser.phone,
      address: currentUser.address
    };

    const purchasedIds = new Set(
      orderItems.map(item => String(item.productId))
    );

    /* Deduct stock only for selected products. */
    orderItems.forEach(item => {
      const product = products.find(
        p => Number(p.id) === Number(item.productId)
      );

      product.stock -= item.quantity;
    });

    const order = {
      id: nextOrderId++,
      customerId: currentUser.id,
      customerName: name,
      phone,
      address,
      payment: "Cash on Delivery",
      items: orderItems,
      total,
      status: "Pending",
      date: new Date().toISOString()
    };

    orders.unshift(order);
    orderQueue.enqueue(order.id);

    currentUser.fullName = name;
    currentUser.phone = phone;
    currentUser.address = address;

    /* Keep every unselected product in the cart. */
    carts[currentUser.id] = getCart().filter(item =>
      !purchasedIds.has(String(item.productId))
    );

    if (!saveAll()) {
      products = oldProducts;
      orders = oldOrders;
      orderQueue = new OrderQueue(oldQueue);
      nextOrderId = oldId;
      carts = oldCarts;

      Object.assign(currentUser, oldUser);
      return;
    }

    /* Clear only the selected product IDs. */
    purchasedIds.forEach(id => selectedCartProducts.delete(id));

    $("checkoutForm").reset();
    closeModal("checkoutModal");

    $("headerUser").textContent = currentUser.fullName;
    $("welcomeText").textContent = currentUser.fullName;

    updateCartCount();
    customerPage("orders");

    notify(`Order PV-${order.id} placed successfully!`);
  });
}

/* =========================================================
   11. ORDER DISPLAY AND FIFO PROCESSING
========================================================= */

function statusClass(status) {
  if (status === "Completed") return "delivered";
  if (status === "Cancelled") return "cancelled";
  return "";
}

function orderItemsText(order) {
  return (order.items || []).map(item =>
    `${escapeHTML(item.name)} × ${Number(item.quantity)}`
  ).join("<br>");
}

function renderCustomerOrders() {
  if (!currentUser) return;

  const list = orders.filter(
    order => Number(order.customerId) === Number(currentUser.id)
  );

  if (!list.length) {
    $("customerOrders").innerHTML =
      '<div class="empty-state">You have no orders yet.</div>';
    return;
  }

  $("customerOrders").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>

        <tbody>
          ${list.map(order => `
            <tr>
              <td>PV-${order.id}</td>
              <td>${escapeHTML(formatDate(order.date))}</td>
              <td>${orderItemsText(order)}</td>
              <td>${money(order.total)}</td>
              <td>
                <span class="status ${statusClass(order.status)}">
                  ${escapeHTML(order.status)}
                </span>
              </td>
              <td>
                <button
                  class="btn-soft"
                  type="button"
                  data-view-receipt="${order.id}"
                >
                  View
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  bindReceiptButtons($("customerOrders"));
}

function renderAdminOrders() {
  if (currentRole !== "admin") return;

  if (!orders.length) {
    $("adminOrders").innerHTML =
      '<div class="empty-state">No orders have been placed.</div>';
    return;
  }

  $("adminOrders").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Update</th>
            <th>Receipt</th>
          </tr>
        </thead>

        <tbody>
          ${orders.map(order => `
            <tr>
              <td>
                <strong>PV-${order.id}</strong>
                <br>
                <small>${escapeHTML(formatDate(order.date))}</small>
              </td>

              <td>
                ${escapeHTML(order.customerName)}
                <br>
                <small>${escapeHTML(order.phone)}</small>
              </td>

              <td>${orderItemsText(order)}</td>
              <td>${money(order.total)}</td>

              <td>
                <span class="status ${statusClass(order.status)}">
                  ${escapeHTML(order.status)}
                </span>
              </td>

              <td>
                <select data-order-status="${order.id}" aria-label="Order status">
                  ${["Pending", "Processing", "Completed", "Cancelled"].map(status => `
                    <option
                      value="${status}"
                      ${order.status === status ? "selected" : ""}
                    >
                      ${status}
                    </option>
                  `).join("")}
                </select>
              </td>

              <td>
                <button
                  class="btn-soft"
                  type="button"
                  data-view-receipt="${order.id}"
                >
                  Receipt
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="cart-summary" style="margin-top:20px">
      <strong>FIFO Pending Order Queue</strong>

      <p class="muted">
        Oldest pending order:
        ${orderQueue.peek() === null ? "No pending orders" : "PV-" + orderQueue.peek()}
      </p>

      <p class="muted">
        Queue:
        ${orderQueue.toArray().map(id => "PV-" + id).join(" → ") || "Empty"}
      </p>
    </div>
  `;

  $("adminOrders").querySelectorAll("[data-order-status]").forEach(select => {
    select.addEventListener("change", () => {
      updateOrderStatus(
        Number(select.dataset.orderStatus),
        select.value
      );
    });
  });

  bindReceiptButtons($("adminOrders"));
}

function updateOrderStatus(id, newStatus) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => Number(item.id) === Number(id));
  if (!order) return;

  const allowed = ["Pending", "Processing", "Completed", "Cancelled"];
  if (!allowed.includes(newStatus)) return;

  const oldStatus = order.status;
  if (oldStatus === newStatus) return;

  /* Enforce FIFO when starting a pending order. */
  if (
    ["Processing", "Completed"].includes(newStatus) &&
    oldStatus === "Pending" &&
    orderQueue.peek() !== id
  ) {
    notify(
      `FIFO rule: process PV-${orderQueue.peek()} first.`,
      "error"
    );
    renderAdminOrders();
    return;
  }

  const oldProducts = products.map(product => ({ ...product }));
  const oldQueue = orderQueue.toArray();

  /* Restore stock when an order is cancelled. */
  if (newStatus === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(
        p => Number(p.id) === Number(item.productId)
      );

      if (product) product.stock += Number(item.quantity);
    });
  }

  /* Deduct stock again if a cancelled order is reactivated. */
  if (oldStatus === "Cancelled" && newStatus !== "Cancelled") {
    const available = order.items.every(item => {
      const product = products.find(
        p => Number(p.id) === Number(item.productId)
      );

      return product && product.stock >= Number(item.quantity);
    });

    if (!available) {
      notify("Not enough stock to reactivate this order.", "error");
      renderAdminOrders();
      return;
    }

    order.items.forEach(item => {
      const product = products.find(
        p => Number(p.id) === Number(item.productId)
      );

      product.stock -= Number(item.quantity);
    });
  }

  if (oldStatus === "Pending") {
    orderQueue.remove(id);
  }

  if (newStatus === "Pending") {
    orderQueue.enqueue(id);
  }

  order.status = newStatus;

  if (!saveAll()) {
    order.status = oldStatus;
    products = oldProducts;
    orderQueue = new OrderQueue(oldQueue);
    return;
  }

  renderAdminOrders();
  renderDashboard();
  renderInventory();

  notify("Order status updated.");
}

/* =========================================================
   12. RECEIPTS
========================================================= */

function bindReceiptButtons(container) {
  if (!container) return;

  container.querySelectorAll("[data-view-receipt]").forEach(button => {
    button.addEventListener("click", () => {
      showReceipt(Number(button.dataset.viewReceipt));
    });
  });
}

function showReceipt(id) {
  const order = orders.find(item => Number(item.id) === Number(id));
  if (!order) return;

  if (
    currentRole !== "admin" &&
    (!currentUser ||
      Number(order.customerId) !== Number(currentUser.id))
  ) {
    return;
  }

  $("receiptContent").innerHTML = `
    <div class="receipt">

      <div class="receipt-head">
        <h2>✿ Petal & Vine</h2>
        <p>FLOWER BOUTIQUE</p>
        <p>Thank you for choosing our flowers.</p>
      </div>

      <hr>

      <p><strong>Receipt No:</strong> PV-${order.id}</p>
      <p><strong>Date:</strong> ${escapeHTML(formatDate(order.date))}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${Number(item.quantity)}</td>
                <td>${money(item.price)}</td>
                <td>${money(item.subtotal)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="summary-line summary-total">
        <span>Total Amount</span>
        <strong>${money(order.total)}</strong>
      </div>

      <p><strong>Order Status:</strong> ${escapeHTML(order.status)}</p>

      <div class="receipt-head">
        <p>We appreciate your purchase! 🌷</p>
      </div>

    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function renderCustomerReceipts() {
  if (!currentUser) return;

  const list = orders.filter(
    order => Number(order.customerId) === Number(currentUser.id)
  );

  $("customerReceipts").innerHTML = list.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${list.map(order => `
              <tr>
                <td>PV-${order.id}</td>
                <td>${escapeHTML(formatDate(order.date))}</td>
                <td>${money(order.total)}</td>
                <td>${escapeHTML(order.status)}</td>
                <td>
                  <button
                    class="btn-soft"
                    type="button"
                    data-view-receipt="${order.id}"
                  >
                    View Receipt
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-state">No receipts available.</div>';

  bindReceiptButtons($("customerReceipts"));
}

/* =========================================================
   13. TRANSACTION HISTORY
========================================================= */

function renderTransactions() {
  if (!currentUser) return;

  const list = orders.filter(
    order => Number(order.customerId) === Number(currentUser.id)
  );

  const totalSpent = list
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  $("customerTransactions").innerHTML = `
    <div class="stats-grid">

      <div class="stat-card">
        <span>Total Orders</span>
        <strong>${list.length}</strong>
      </div>

      <div class="stat-card">
        <span>Total Purchases (excluding cancelled)</span>
        <strong>${money(totalSpent)}</strong>
      </div>

    </div>

    ${
      list.length
        ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                ${list.map(order => `
                  <tr>
                    <td>PV-${order.id}</td>
                    <td>${escapeHTML(formatDate(order.date))}</td>
                    <td>${escapeHTML(order.payment)}</td>
                    <td>${money(order.total)}</td>
                    <td>${escapeHTML(order.status)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `
        : '<div class="empty-state">No transactions yet.</div>'
    }
  `;
}

/* =========================================================
   14. CUSTOMER PROFILE
========================================================= */

function loadProfile() {
  if (!currentUser) return;

  $("profileName").value = currentUser.fullName || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";
  $("profilePassword").value = "";
}

if ($("profileForm")) {
  $("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    if (currentRole !== "customer") return;

    const name = $("profileName").value.trim();
    const username = $("profileUsername").value.trim();
    const phone = $("profilePhone").value.trim();
    const address = $("profileAddress").value.trim();
    const password = $("profilePassword").value;

    if (name.length < 2 || name.length > 100) {
      notify("Enter a valid full name.", "error");
      return;
    }

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      notify("Invalid username.", "error");
      return;
    }

    if (users.some(user =>
      Number(user.id) !== Number(currentUser.id) &&
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      notify("Username is already taken.", "error");
      return;
    }

    if (phone && !validPhone(phone)) {
      notify("Enter a valid phone number.", "error");
      return;
    }

    if (password && password.length < 6) {
      notify("Password must have at least 6 characters.", "error");
      return;
    }

    const oldUser = { ...currentUser };

    currentUser.fullName = name;
    currentUser.username = username;
    currentUser.phone = phone;
    currentUser.address = address;

    if (password) currentUser.password = password;

    if (!save(DB.users, users)) {
      Object.assign(currentUser, oldUser);
      return;
    }

    $("headerUser").textContent = name;
    $("welcomeText").textContent = name;
    $("profilePassword").value = "";

    notify("Profile updated successfully.");
  });
}

/* =========================================================
   15. ADMIN PRODUCT MANAGEMENT
========================================================= */

function openProductModal(id = null) {
  if (currentRole !== "admin") return;

  $("productForm").reset();
  $("productId").value = "";
  $("productModalTitle").textContent = "Add Product";

  $("productImagePreview").classList.add("hidden");
  $("productImagePreview").removeAttribute("src");

  selectedProduct = null;

  if (id !== null) {
    const product = products.find(
      item => Number(item.id) === Number(id)
    );

    if (!product) return;

    selectedProduct = { ...product };

    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productDescription").value = product.description || "";
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;

    $("productImage").value =
      /^https?:\/\//i.test(product.image || "")
        ? product.image
        : "";

    if (isImageSource(product.image)) {
      $("productImagePreview").src = product.image;
      $("productImagePreview").classList.remove("hidden");
    }

    $("productModalTitle").textContent = "Edit Product";
  }

  $("productModal").classList.remove("hidden");
}

window.openProductModal = openProductModal;

if ($("productImage")) {
  $("productImage").addEventListener("input", () => {
    if (selectedProduct) {
      delete selectedProduct.uploadedImage;
    }

    const imageURL = $("productImage").value.trim();

    if (/^https?:\/\/\S+$/i.test(imageURL)) {
      $("productImagePreview").src = imageURL;
      $("productImagePreview").classList.remove("hidden");
    } else if (!imageURL) {
      $("productImagePreview").classList.add("hidden");
      $("productImagePreview").removeAttribute("src");
    }
  });
}

if ($("productImageFile")) {
  $("productImageFile").addEventListener("change", () => {
    const file = $("productImageFile").files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select an image file.", "error");
      $("productImageFile").value = "";
      return;
    }

    if (file.size > 700000) {
      notify("Please select an image smaller than 700 KB.", "error");
      $("productImageFile").value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      $("productImagePreview").src = reader.result;
      $("productImagePreview").classList.remove("hidden");

      selectedProduct = {
        ...(selectedProduct || {}),
        uploadedImage: reader.result
      };
    };

    reader.onerror = () => {
      notify("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
  });
}

if ($("productForm")) {
  $("productForm").addEventListener("submit", event => {
    event.preventDefault();

    if (currentRole !== "admin") return;

    const id = Number($("productId").value);
    const name = $("productName").value.trim();
    const category = $("productCategory").value;
    const description = $("productDescription").value.trim();
    const price = Number($("productPrice").value);
    const stock = Number($("productStock").value);

    let image = $("productImage").value.trim();

    if (selectedProduct?.uploadedImage) {
      image = selectedProduct.uploadedImage;
    } else if (!image && id && selectedProduct) {
      image = selectedProduct.image || "🌸";
    }

    if (!image) image = "🌸";

    if (name.length < 2 || name.length > 100) {
      notify("Enter a valid product name.", "error");
      return;
    }

    if (!category) {
      notify("Please select a product category.", "error");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      notify("Enter a valid product price.", "error");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      notify("Enter a valid stock quantity.", "error");
      return;
    }

    if (products.some(product =>
      Number(product.id) !== id &&
      product.name.toLowerCase() === name.toLowerCase()
    )) {
      notify("Product name already exists.", "error");
      return;
    }

    if (
      /^https?:\/\//i.test(image) &&
      !/^https?:\/\/\S+$/i.test(image)
    ) {
      notify("Invalid image URL.", "error");
      return;
    }

    if (!isImageSource(image) && image.length > 20) {
      notify("Use a valid image URL or a short flower symbol.", "error");
      return;
    }

    const previous = products.map(product => ({ ...product }));
    const oldNextProductId = nextProductId;

    if (id) {
      const product = products.find(item => Number(item.id) === id);
      if (!product) return;

      Object.assign(product, {
        name,
        category,
        description,
        price,
        stock,
        image
      });
    } else {
      products.push({
        id: nextProductId++,
        name,
        category,
        description,
        price,
        stock,
        image
      });
    }

    if (!saveAll()) {
      products = previous;
      nextProductId = oldNextProductId;
      return;
    }

    selectedProduct = null;
    closeModal("productModal");

    renderAdminProducts();
    renderInventory();
    renderDashboard();

    notify(id ? "Product updated successfully." : "Product added successfully.");
  });
}

function renderAdminProducts() {
  if (currentRole !== "admin") return;

  const query = $("adminProductSearch")
    ? $("adminProductSearch").value.toLowerCase().trim()
    : "";

  const list = products.filter(product =>
    String(product.name || "").toLowerCase().includes(query) ||
    String(product.category || "").toLowerCase().includes(query)
  );

  $("adminProducts").innerHTML = list.length
    ? list.map(product => `
        <div class="admin-item">

          <div class="admin-item-main">

            <div class="cart-thumb">
              ${
                isImageSource(product.image)
                  ? `
                    <img
                      src="${escapeHTML(product.image)}"
                      alt="${escapeHTML(product.name)}"
                    >
                  `
                  : escapeHTML(product.image || "🌸")
              }
            </div>

            <div class="cart-detail">
              <strong>${escapeHTML(product.name)}</strong>
              <small>${escapeHTML(product.category)} · ${money(product.price)}</small>
              <small>Stock: ${product.stock}</small>
            </div>

          </div>

          <div class="admin-actions">
            <button
              class="btn-soft"
              type="button"
              data-edit-product="${product.id}"
            >
              Edit
            </button>

            <button
              class="btn-danger"
              type="button"
              data-delete-product="${product.id}"
            >
              Delete
            </button>
          </div>

        </div>
      `).join("")
    : '<div class="empty-state">No products found.</div>';

  $("adminProducts").querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () => {
      openProductModal(Number(button.dataset.editProduct));
    });
  });

  $("adminProducts").querySelectorAll("[data-delete-product]").forEach(button => {
    button.addEventListener("click", () => {
      deleteProduct(Number(button.dataset.deleteProduct));
    });
  });
}

if ($("adminProductSearch")) {
  $("adminProductSearch").addEventListener("input", renderAdminProducts);
}

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => Number(item.id) === Number(id));
  if (!product) return;

  if (!confirm(`Delete ${product.name}?`)) return;

  const previousProducts = products.map(item => ({ ...item }));
  const previousCarts = JSON.parse(JSON.stringify(carts));

  products = products.filter(item => Number(item.id) !== Number(id));

  Object.keys(carts).forEach(userId => {
    carts[userId] = carts[userId].filter(
      item => Number(item.productId) !== Number(id)
    );
  });

  if (!saveAll()) {
    products = previousProducts;
    carts = previousCarts;
    return;
  }

  selectedCartProducts.delete(String(id));

  renderAdminProducts();
  renderInventory();
  renderDashboard();

  notify("Product deleted.");
}

/* =========================================================
   16. INVENTORY MANAGEMENT
========================================================= */

function renderInventory() {
  if (currentRole !== "admin") return;

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const lowStock = products.filter(
    product => Number(product.stock) <= 5
  ).length;

  $("inventoryList").innerHTML = `
    <div class="stats-grid">

      <div class="stat-card">
        <span>Total Products</span>
        <strong>${products.length}</strong>
      </div>

      <div class="stat-card">
        <span>Total Stock</span>
        <strong>${totalStock}</strong>
      </div>

      <div class="stat-card">
        <span>Low Stock (5 or less)</span>
        <strong>${lowStock}</strong>
      </div>

    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Available Stock</th>
            <th>Inventory Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${products.map(product => `
            <tr>
              <td>${escapeHTML(product.name)}</td>
              <td>${escapeHTML(product.category)}</td>
              <td>${money(product.price)}</td>
              <td>${Number(product.stock)}</td>

              <td>
                <span class="status ${
                  product.stock === 0
                    ? "cancelled"
                    : product.stock <= 5
                      ? ""
                      : "delivered"
                }">
                  ${
                    product.stock === 0
                      ? "Out of Stock"
                      : product.stock <= 5
                        ? "Low Stock"
                        : "In Stock"
                  }
                </span>
              </td>

              <td>
                <button
                  class="btn-soft"
                  type="button"
                  data-inventory-edit="${product.id}"
                >
                  Update
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  $("inventoryList").querySelectorAll("[data-inventory-edit]").forEach(button => {
    button.addEventListener("click", () => {
      openProductModal(Number(button.dataset.inventoryEdit));
    });
  });
}

/* =========================================================
   17. CUSTOMER ACCOUNT MANAGEMENT
========================================================= */

function renderAdminUsers() {
  if (currentRole !== "admin") return;

  const customers = users.filter(user => user.role === "customer");

  $("adminUsers").innerHTML = customers.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Account Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${customers.map(user => `
              <tr>
                <td>${escapeHTML(user.fullName)}</td>
                <td>${escapeHTML(user.username)}</td>
                <td>${escapeHTML(user.phone || "—")}</td>
                <td>${escapeHTML(formatDate(user.createdAt))}</td>
                <td>${user.active === false ? "Disabled" : "Active"}</td>

                <td>
                  <button
                    class="btn-soft"
                    type="button"
                    data-toggle-user="${user.id}"
                  >
                    ${user.active === false ? "Enable" : "Disable"}
                  </button>

                  <button
                    class="btn-danger"
                    type="button"
                    data-delete-user="${user.id}"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-state">No customer accounts found.</div>';

  $("adminUsers").querySelectorAll("[data-toggle-user]").forEach(button => {
    button.addEventListener("click", () => {
      toggleUser(Number(button.dataset.toggleUser));
    });
  });

  $("adminUsers").querySelectorAll("[data-delete-user]").forEach(button => {
    button.addEventListener("click", () => {
      deleteUser(Number(button.dataset.deleteUser));
    });
  });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item =>
    Number(item.id) === Number(id) &&
    item.role === "customer"
  );

  if (!user) return;

  const oldStatus = user.active;
  user.active = user.active === false;

  if (!save(DB.users, users)) {
    user.active = oldStatus;
    return;
  }

  renderAdminUsers();
  notify(user.active ? "Account enabled." : "Account disabled.");
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item =>
    Number(item.id) === Number(id) &&
    item.role === "customer"
  );

  if (!user) return;

  const hasOrders = orders.some(order =>
    Number(order.customerId) === Number(id) &&
    order.status !== "Cancelled"
  );

  if (hasOrders) {
    notify(
      "Cannot delete a customer with active or completed orders.",
      "error"
    );
    return;
  }

  if (!confirm(`Delete ${user.fullName}'s account?`)) return;

  const previousUsers = [...users];
  const previousCarts = JSON.parse(JSON.stringify(carts));

  users = users.filter(item => Number(item.id) !== Number(id));
  delete carts[id];

  if (!saveAll()) {
    users = previousUsers;
    carts = previousCarts;
    return;
  }

  renderAdminUsers();
  renderDashboard();

  notify("Customer account deleted.");
}

/* =========================================================
   18. ADMIN DASHBOARD AND REPORTS
========================================================= */

function renderDashboard() {
  if (currentRole !== "admin") return;

  const revenue = orders
    .filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const pending = orders.filter(order => order.status === "Pending").length;
  const completed = orders.filter(order => order.status === "Completed").length;
  const customers = users.filter(user => user.role === "customer").length;

  $("dashboardStats").innerHTML = `
    <div class="stat-card">
      <span>Total Products</span>
      <strong>${products.length}</strong>
    </div>

    <div class="stat-card">
      <span>Total Customers</span>
      <strong>${customers}</strong>
    </div>

    <div class="stat-card">
      <span>Total Orders</span>
      <strong>${orders.length}</strong>
    </div>

    <div class="stat-card">
      <span>Pending Orders</span>
      <strong>${pending}</strong>
    </div>

    <div class="stat-card">
      <span>Completed Orders</span>
      <strong>${completed}</strong>
    </div>

    <div class="stat-card">
      <span>Completed Sales</span>
      <strong>${money(revenue)}</strong>
    </div>
  `;

  const recent = orders.slice(0, 5);

  $("recentOrders").innerHTML = recent.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${recent.map(order => `
              <tr>
                <td>PV-${order.id}</td>
                <td>${escapeHTML(order.customerName)}</td>
                <td>${escapeHTML(formatDate(order.date))}</td>
                <td>${money(order.total)}</td>
                <td>${escapeHTML(order.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-state">No recent orders.</div>';
}

/* =========================================================
   19. ADMIN ACCOUNT SETTINGS
========================================================= */

function loadSettings() {
  if (currentRole !== "admin") return;

  $("settingsUsername").value = currentUser.username;
  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  $("settingsMessage").textContent = "";
}

if ($("settingsForm")) {
  $("settingsForm").addEventListener("submit", event => {
    event.preventDefault();

    if (currentRole !== "admin") return;

    const username = $("settingsUsername").value.trim();
    const password = $("settingsPassword").value;
    const confirmPassword = $("settingsConfirm").value;

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      $("settingsMessage").textContent = "Invalid username.";
      return;
    }

    if (users.some(user =>
      Number(user.id) !== Number(currentUser.id) &&
      user.username.toLowerCase() === username.toLowerCase()
    )) {
      $("settingsMessage").textContent = "Username is already in use.";
      return;
    }

    if (password || confirmPassword) {
      if (password.length < 6) {
        $("settingsMessage").textContent =
          "Password must contain at least 6 characters.";
        return;
      }

      if (password !== confirmPassword) {
        $("settingsMessage").textContent = "Passwords do not match.";
        return;
      }
    }

    const oldUsername = currentUser.username;
    const oldPassword = currentUser.password;

    currentUser.username = username;

    if (password) currentUser.password = password;

    if (!save(DB.users, users)) {
      currentUser.username = oldUsername;
      currentUser.password = oldPassword;
      return;
    }

    $("settingsPassword").value = "";
    $("settingsConfirm").value = "";

    $("settingsMessage").textContent =
      "Administrator settings saved successfully.";

    notify("Admin settings updated.");
  });
}

/* =========================================================
   20. PRINT RECEIPT
========================================================= */

function printReceipt() {
  const content = $("receiptContent");

  if (!content || !content.innerHTML.trim()) {
    notify("No receipt is available to print.", "error");
    return;
  }

  const printWindow = window.open("", "_blank", "width=850,height=750");

  if (!printWindow) {
    notify("Allow pop-ups to print your receipt.", "error");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Petal & Vine Receipt</title>

      <style>
        body {
          padding: 25px;
          color: #382b32;
          font-family: Arial, sans-serif;
        }

        h2 {
          color: #5d2c43;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 10px;
          border-bottom: 1px solid #eee;
          text-align: left;
        }

        .receipt-head {
          text-align: center;
        }

        .summary-line {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }

        .summary-total {
          font-size: 20px;
          font-weight: bold;
        }

        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>

    <body>
      ${content.innerHTML}

      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

window.printReceipt = printReceipt;

/* =========================================================
   21. MODAL BEHAVIOR
========================================================= */

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal").forEach(modal => {
      modal.classList.add("hidden");
    });
  }
});

/* =========================================================
   22. INITIALIZATION
========================================================= */

function initializeApplication() {
  initializeData();
  restoreSession();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
  initializeApplication();
}

/* END OF PETAL & VINE JAVASCRIPT */
