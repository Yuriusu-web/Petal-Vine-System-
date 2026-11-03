
"use strict";

/* =========================================================
   PETAL & VINE FLOWER BOUTIQUE
   COMPLETE CONNECTED JAVASCRIPT
   Storage: Browser LocalStorage
   Database: Not Required
   Features: Customer, Admin, Cart, FIFO, Orders, Receipts
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
let selectedProduct = null;
let nextProductId = 1;
let nextOrderId = 1;


/* =========================================================
   2. HELPER FUNCTIONS
========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
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

  if (type === "error") toast.classList.add("error");

  requestAnimationFrame(() => toast.classList.add("show"));

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
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
    console.error(error);
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

  const oldCart = carts[currentUser.id];
  carts[currentUser.id] = cart;

  if (!save(DB.carts, carts)) {
    carts[currentUser.id] = oldCart || [];
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

let orderQueue = new OrderQueue();


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
  if (!carts || typeof carts !== "object" || Array.isArray(carts)) carts = {};

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

  nextProductId = Math.max(
    Number(counters.product) || 1,
    ...products.map(product => Number(product.id) + 1),
    1
  );

  nextOrderId = Math.max(
    Number(counters.order) || 1,
    ...orders.map(order => Number(order.id) + 1),
    1
  );

  const hasAdmin = users.some(user => user.role === "admin");

  if (!hasAdmin) {
    users.push({
      id: 1,
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

  // Rebuild queue using pending orders only.
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
   5. AUTHENTICATION - LOGIN AND REGISTRATION
========================================================= */

function showLogin() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("loginMessage").textContent = "";
}

function showRegister() {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");
  $("registerMessage").textContent = "";
}

function showAuth() {
  $("authScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
  showLogin();
}

function login(username, password) {
  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
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

  save(DB.users, users);
  save(DB.session, { userId: user.id });

  openApplication();
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  login(
    $("loginUsername").value.trim(),
    $("loginPassword").value
  );
});

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
  $("loginMessage").textContent = "Account created successfully. Please log in.";
});

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

  showAuth();
  notify("You have logged out.");
}

$("logoutButton").addEventListener("click", logout);

function restoreSession() {
  const session = read(DB.session, null);

  if (!session) {
    showAuth();
    return;
  }

  const user = users.find(item =>
    item.id === session.userId && item.active !== false
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
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent = currentUser.fullName;
  $("welcomeText").textContent = currentUser.fullName;
  $("roleLabel").textContent =
    currentRole === "admin" ? "Administrator" : "Customer";

  $("customerNav").classList.toggle("hidden", currentRole !== "customer");
  $("adminNav").classList.toggle("hidden", currentRole !== "admin");

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
  $("pageTitle").textContent = title;
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
    case "shop":
      renderShop();
      break;
    case "cart":
      renderCart();
      break;
    case "orders":
      renderCustomerOrders();
      break;
    case "receipts":
      renderCustomerReceipts();
      break;
    case "transactions":
      renderTransactions();
      break;
    case "profile":
      loadProfile();
      break;
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
    case "dashboard":
      renderDashboard();
      break;
    case "products":
      renderAdminProducts();
      break;
    case "inventory":
      renderInventory();
      break;
    case "orders":
      renderAdminOrders();
      break;
    case "users":
      renderAdminUsers();
      break;
    case "settings":
      loadSettings();
      break;
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

function productVisual(product, className = "product-image") {
  const image = String(product.image || "").trim();

  if (/^https?:\/\//i.test(image) || /^data:image\//i.test(image)) {
    return `
      <div class="${className}">
        <img src="${escapeHTML(image)}"
             alt="${escapeHTML(product.name)}"
             onerror="this.parentElement.textContent='🌸'">
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
  const outOfStock = product.stock <= 0;

  return `
    <article class="product-card">
      ${productVisual(product)}

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>

        <p>${escapeHTML(product.description || product.category)}</p>

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
            ${outOfStock ? "disabled" : ""}>
            Add to Cart
          </button>
        </div>

        <button
          class="btn btn-outline full"
          type="button"
          data-buy-now="${product.id}"
          ${outOfStock ? "disabled" : ""}>
          Buy Now
        </button>
      </div>
    </article>
  `;
}

function bindShopActions(container) {
  container.querySelectorAll("[data-add-cart]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.addCart);
      const quantityInput = container.querySelector(
        `[data-quantity="${id}"]`
      );

      addToCart(id, Number(quantityInput?.value || 1));
    });
  });

  container.querySelectorAll("[data-buy-now]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.buyNow);
      const quantityInput = container.querySelector(
        `[data-quantity="${id}"]`
      );

      addToCart(id, Number(quantityInput?.value || 1));

      if (getCart().some(item => item.productId === id)) {
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

  const query = $("productSearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    (product.description || "").toLowerCase().includes(query)
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No flowers found.</div>';

  bindShopActions($("shopProducts"));
}

$("productSearch").addEventListener("input", renderShop);


/* =========================================================
   9. SHOPPING CART
========================================================= */

function addToCart(productId, quantity) {
  if (currentRole !== "customer") return;

  const product = products.find(item => item.id === productId);

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    return notify("Please enter a valid quantity.", "error");
  }

  if (quantity > product.stock) {
    return notify("Not enough stock available.", "error");
  }

  const cart = getCart();
  const existing = cart.find(item => item.productId === productId);
  const newQuantity = (existing?.quantity || 0) + quantity;

  if (newQuantity > product.stock) {
    return notify("Cart quantity exceeds available stock.", "error");
  }

  const updated = [...cart];

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    updated.push({ productId, quantity });
  }

  if (!setCart(updated)) return;

  renderShop();
  notify("Flower added to your cart.");
}

function updateCartCount() {
  const count = getCart().reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if ($("cartCount")) $("cartCount").textContent = count;
}

function removeFromCart(productId) {
  const updated = getCart().filter(
    item => item.productId !== productId
  );

  if (setCart(updated)) {
    renderCart();
    notify("Product removed from cart.");
  }
}

function changeCartQuantity(productId, quantity) {
  const product = products.find(item => item.id === productId);

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    renderCart();
    return;
  }

  if (quantity > product.stock) {
    notify("Quantity exceeds available stock.", "error");
    renderCart();
    return;
  }

  const updated = getCart().map(item =>
    item.productId === productId
      ? { ...item, quantity }
      : item
  );

  if (setCart(updated)) renderCart();
}

function renderCart() {
  if (currentRole !== "customer") return;

  const cart = getCart();

  const validItems = cart.map(item => ({
    ...item,
    product: products.find(product => product.id === item.productId)
  })).filter(item => item.product);

  if (!validItems.length) {
    $("cartContent").innerHTML = `
      <div class="empty-state">
        <strong>Your cart is empty.</strong>
        Browse our flower collection and add your favorites.
        <button class="btn btn-primary" onclick="customerPage('shop')">
          Continue Shopping
        </button>
      </div>
    `;
    return;
  }

  const total = validItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  $("cartContent").innerHTML = `
    <div class="cart-layout">
      <div>
        ${validItems.map(item => `
          <div class="cart-item">
            <div class="cart-thumb">
              ${/^https?:\/\//i.test(item.product.image || "")
                ? `<img src="${escapeHTML(item.product.image)}" alt="">`
                : escapeHTML(item.product.image || "🌸")}
            </div>

            <div class="cart-detail">
              <strong>${escapeHTML(item.product.name)}</strong>
              <small>${money(item.product.price)} each</small>
            </div>

            <input
              type="number"
              min="1"
              max="${item.product.stock}"
              value="${item.quantity}"
              aria-label="Cart quantity"
              data-cart-quantity="${item.productId}"
            >

            <strong>${money(item.product.price * item.quantity)}</strong>

            <button
              class="btn-danger"
              type="button"
              data-remove-cart="${item.productId}">
              Remove
            </button>
          </div>
        `).join("")}
      </div>

      <aside class="cart-summary">
        <h2>Order Summary</h2>

        <div class="summary-line">
          <span>Items</span>
          <span>${validItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>

        <div class="summary-line summary-total">
          <span>Total</span>
          <span>${money(total)}</span>
        </div>

        <button class="btn btn-primary full" id="cartCheckout">
          Proceed to Checkout
        </button>

        <button class="btn btn-outline full" onclick="customerPage('shop')">
          Continue Shopping
        </button>
      </aside>
    </div>
  `;

  $("cartContent").querySelectorAll("[data-cart-quantity]").forEach(input => {
    input.addEventListener("change", () =>
      changeCartQuantity(
        Number(input.dataset.cartQuantity),
        Number(input.value)
      )
    );
  });

  $("cartContent").querySelectorAll("[data-remove-cart]").forEach(button => {
    button.addEventListener("click", () =>
      removeFromCart(Number(button.dataset.removeCart))
    );
  });

  $("cartCheckout").addEventListener("click", openCheckout);
}


/* =========================================================
   10. CHECKOUT
========================================================= */

function openCheckout() {
  if (currentRole !== "customer") return;

  const cart = getCart();

  if (!cart.length) {
    return notify("Your cart is empty.", "error");
  }

  const items = cart.map(item => ({
    ...item,
    product: products.find(product => product.id === item.productId)
  }));

  if (items.some(item =>
    !item.product || item.quantity > item.product.stock
  )) {
    return notify("Please update your cart. Some items are unavailable.", "error");
  }

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  $("checkoutSummary").innerHTML = `
    <div class="cart-summary">
      ${items.map(item => `
        <div class="summary-line">
          <span>${escapeHTML(item.product.name)} × ${item.quantity}</span>
          <strong>${money(item.product.price * item.quantity)}</strong>
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

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (name.length < 2 || name.length > 100) {
    return notify("Please enter a valid name.", "error");
  }

  if (!validPhone(phone)) {
    return notify("Please enter a valid phone number.", "error");
  }

  if (address.length < 8 || address.length > 300) {
    return notify("Please enter a complete delivery address.", "error");
  }

  const cart = getCart();

  if (!cart.length) {
    closeModal("checkoutModal");
    return notify("Your cart is empty.", "error");
  }

  const items = [];

  for (const cartItem of cart) {
    const product = products.find(
      item => item.id === cartItem.productId
    );

    if (
      !product ||
      !Number.isInteger(cartItem.quantity) ||
      cartItem.quantity < 1 ||
      cartItem.quantity > product.stock
    ) {
      return notify("An item is unavailable or has insufficient stock.", "error");
    }

    items.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: cartItem.quantity,
      subtotal: product.price * cartItem.quantity
    });
  }

  const total = items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  const oldProducts = products.map(product => ({ ...product }));
  const oldOrders = [...orders];
  const oldQueue = orderQueue.toArray();
  const oldId = nextOrderId;

  items.forEach(item => {
    const product = products.find(
      p => p.id === item.productId
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
    items,
    total,
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.unshift(order);
  orderQueue.enqueue(order.id);

  const oldName = currentUser.fullName;
  const oldPhone = currentUser.phone;
  const oldAddress = currentUser.address;

  currentUser.fullName = name;
  currentUser.phone = phone;
  currentUser.address = address;

  carts[currentUser.id] = [];

  if (!saveAll()) {
    products = oldProducts;
    orders = oldOrders;
    orderQueue = new OrderQueue(oldQueue);
    nextOrderId = oldId;

    currentUser.fullName = oldName;
    currentUser.phone = oldPhone;
    currentUser.address = oldAddress;

    carts[currentUser.id] = cart;

    saveAll();
    return;
  }

  $("checkoutForm").reset();
  closeModal("checkoutModal");

  $("headerUser").textContent = currentUser.fullName;
  $("welcomeText").textContent = currentUser.fullName;

  renderCustomerOrders();
  updateCartCount();

  customerPage("orders");

  notify(`Order PV-${order.id} placed successfully!`);
});


/* =========================================================
   11. ORDER DISPLAY AND FIFO PROCESSING
========================================================= */

function statusClass(status) {
  if (status === "Completed") return "delivered";
  if (status === "Cancelled") return "cancelled";
  return "";
}

function orderItemsText(order) {
  return order.items.map(item =>
    `${escapeHTML(item.name)} × ${item.quantity}`
  ).join("<br>");
}

function renderCustomerOrders() {
  const list = orders.filter(
    order => order.customerId === currentUser.id
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
                <button class="btn-soft" data-view-receipt="${order.id}">
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
                <select data-order-status="${order.id}"
                  aria-label="Order status">
                  ${["Pending", "Processing", "Completed", "Cancelled"].map(status => `
                    <option value="${status}"
                      ${order.status === status ? "selected" : ""}>
                      ${status}
                    </option>
                  `).join("")}
                </select>
              </td>

              <td>
                <button class="btn-soft" data-view-receipt="${order.id}">
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
        Oldest pending order: ${
          orderQueue.peek() === null
            ? "No pending orders"
            : "PV-" + orderQueue.peek()
        }
      </p>
      <p class="muted">
        Queue: ${orderQueue.toArray().map(id => "PV-" + id).join(" → ") || "Empty"}
      </p>
    </div>
  `;

  $("adminOrders").querySelectorAll("[data-order-status]").forEach(select => {
    select.addEventListener("change", () =>
      updateOrderStatus(Number(select.dataset.orderStatus), select.value)
    );
  });

  bindReceiptButtons($("adminOrders"));
}

function updateOrderStatus(id, newStatus) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === id);

  if (!order) return;

  const allowed = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
  ];

  if (!allowed.includes(newStatus)) return;

  const oldStatus = order.status;

  if (oldStatus === newStatus) return;

  if (
    newStatus === "Processing" &&
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

  // Restore stock when cancelling an order.
  if (newStatus === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(
        p => p.id === item.productId
      );

      if (product) product.stock += item.quantity;
    });
  }

  // Deduct stock again if a cancelled order is reactivated.
  if (oldStatus === "Cancelled" && newStatus !== "Cancelled") {
    const available = order.items.every(item => {
      const product = products.find(
        p => p.id === item.productId
      );

      return product && product.stock >= item.quantity;
    });

    if (!available) {
      notify("Not enough stock to reactivate this order.", "error");
      renderAdminOrders();
      return;
    }

    order.items.forEach(item => {
      products.find(
        p => p.id === item.productId
      ).stock -= item.quantity;
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
    saveAll();
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
  container.querySelectorAll("[data-view-receipt]").forEach(button => {
    button.addEventListener("click", () =>
      showReceipt(Number(button.dataset.viewReceipt))
    );
  });
}

function showReceipt(id) {
  const order = orders.find(item => item.id === id);

  if (!order) return;

  if (
    currentRole !== "admin" &&
    order.customerId !== currentUser.id
  ) return;

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
            ${order.items.map(item => `
              <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${item.quantity}</td>
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
  const list = orders.filter(
    order => order.customerId === currentUser.id
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
                  <button class="btn-soft" data-view-receipt="${order.id}">
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
  const list = orders.filter(
    order => order.customerId === currentUser.id
  );

  const totalSpent = list
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

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

    ${list.length ? `
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
    ` : '<div class="empty-state">No transactions yet.</div>'}
  `;
}


/* =========================================================
   14. CUSTOMER PROFILE
========================================================= */

function loadProfile() {
  $("profileName").value = currentUser.fullName || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";
  $("profilePassword").value = "";
}

$("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const name = $("profileName").value.trim();
  const username = $("profileUsername").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  const password = $("profilePassword").value;

  if (name.length < 2 || name.length > 100) {
    return notify("Enter a valid full name.", "error");
  }

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    return notify("Invalid username.", "error");
  }

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    return notify("Username is already taken.", "error");
  }

  if (phone && !validPhone(phone)) {
    return notify("Enter a valid phone number.", "error");
  }

  if (password && password.length < 6) {
    return notify("Password must have at least 6 characters.", "error");
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


/* =========================================================
   15. ADMIN PRODUCT MANAGEMENT
========================================================= */

function openProductModal(id = null) {
  if (currentRole !== "admin") return;

  $("productForm").reset();
  $("productId").value = "";
  $("productModalTitle").textContent = "Add Product";
  $("productImagePreview").classList.add("hidden");
  selectedProduct = null;

  if (id !== null) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    selectedProduct = product;
    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productDescription").value = product.description || "";
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;

    $("productImage").value =
      product.image && !/^data:image\//i.test(product.image)
        ? product.image
        : "";

    if (/^https?:\/\//i.test(product.image || "") ||
        /^data:image\//i.test(product.image || "")) {
      $("productImagePreview").src = product.image;
      $("productImagePreview").classList.remove("hidden");
    } else if (product.image) {
      $("productImagePreview").alt = product.image;
      $("productImagePreview").classList.add("hidden");
    }

    $("productModalTitle").textContent = "Edit Product";
  }

  $("productModal").classList.remove("hidden");
}

window.openProductModal = openProductModal;

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

  reader.readAsDataURL(file);
});

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
  }

  if (!image) image = "🌸";

  if (name.length < 2 || name.length > 100) {
    return notify("Enter a valid product name.", "error");
  }

  if (!Number.isFinite(price) || price <= 0) {
    return notify("Enter a valid product price.", "error");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return notify("Enter a valid stock quantity.", "error");
  }

  if (users.length && products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  )) {
    return notify("Product name already exists.", "error");
  }

  if (/^https?:\/\//i.test(image) && !/^https?:\/\/\S+$/i.test(image)) {
    return notify("Invalid image URL.", "error");
  }

  const previous = products.map(product => ({ ...product }));

  if (id) {
    const product = products.find(item => item.id === id);

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
    return;
  }

  selectedProduct = null;
  closeModal("productModal");

  renderAdminProducts();
  renderInventory();
  renderDashboard();

  notify(id ? "Product updated successfully." : "Product added successfully.");
});

function renderAdminProducts() {
  if (currentRole !== "admin") return;

  const query = $("adminProductSearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("adminProducts").innerHTML = list.length
    ? list.map(product => `
      <div class="admin-item">
        <div class="admin-item-main">
          <div class="cart-thumb">
            ${/^https?:\/\//i.test(product.image || "")
              ? `<img src="${escapeHTML(product.image)}" alt="">`
              : escapeHTML(product.image || "🌸")}
          </div>

          <div class="cart-detail">
            <strong>${escapeHTML(product.name)}</strong>
            <small>${escapeHTML(product.category)} · ${money(product.price)}</small>
            <small>Stock: ${product.stock}</small>
          </div>
        </div>

        <div class="admin-actions">
          <button class="btn-soft" data-edit-product="${product.id}">
            Edit
          </button>

          <button class="btn-danger" data-delete-product="${product.id}">
            Delete
          </button>
        </div>
      </div>
    `).join("")
    : '<div class="empty-state">No products found.</div>';

  $("adminProducts").querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () =>
      openProductModal(Number(button.dataset.editProduct))
    );
  });

  $("adminProducts").querySelectorAll("[data-delete-product]").forEach(button => {
    button.addEventListener("click", () =>
      deleteProduct(Number(button.dataset.deleteProduct))
    );
  });
}

$("adminProductSearch").addEventListener("input", renderAdminProducts);

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);

  if (!product) return;

  if (!confirm(`Delete ${product.name}?`)) return;

  const previous = products;
  const previousCarts = JSON.stringify(carts);

  products = products.filter(item => item.id !== id);

  // Remove deleted product from all shopping carts.
  Object.keys(carts).forEach(userId => {
    carts[userId] = carts[userId].filter(
      item => item.productId !== id
    );
  });

  if (!saveAll()) {
    products = previous;
    carts = JSON.parse(previousCarts);
    return;
  }

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

  $("inventoryList").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span>Total Products</span>
        <strong>${products.length}</strong>
      </div>

      <div class="stat-card">
        <span>Total Stock</span>
        <strong>${products.reduce((sum, p) => sum + p.stock, 0)}</strong>
      </div>

      <div class="stat-card">
        <span>Low Stock (5 or less)</span>
        <strong>${products.filter(p => p.stock <= 5).length}</strong>
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
              <td>${product.stock}</td>
              <td>
                <span class="status ${
                  product.stock === 0 ? "cancelled" :
                  product.stock <= 5 ? "" : "delivered"
                }">
                  ${product.stock === 0 ? "Out of Stock" :
                    product.stock <= 5 ? "Low Stock" : "In Stock"}
                </span>
              </td>
              <td>
                <button class="btn-soft" data-inventory-edit="${product.id}">
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
    button.addEventListener("click", () =>
      openProductModal(Number(button.dataset.inventoryEdit))
    );
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
                    data-toggle-user="${user.id}">
                    ${user.active === false ? "Enable" : "Disable"}
                  </button>

                  <button
                    class="btn-danger"
                    data-delete-user="${user.id}">
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
    button.addEventListener("click", () =>
      toggleUser(Number(button.dataset.toggleUser))
    );
  });

  $("adminUsers").querySelectorAll("[data-delete-user]").forEach(button => {
    button.addEventListener("click", () =>
      deleteUser(Number(button.dataset.deleteUser))
    );
  });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item =>
    item.id === id && item.role === "customer"
  );

  if (!user) return;

  user.active = user.active === false;

  if (!save(DB.users, users)) {
    user.active = !user.active;
    return;
  }

  renderAdminUsers();
  notify(user.active ? "Account enabled." : "Account disabled.");
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item =>
    item.id === id && item.role === "customer"
  );

  if (!user) return;

  if (orders.some(order =>
    order.customerId === id && order.status !== "Cancelled"
  )) {
    return notify(
      "Cannot delete a customer with active or completed orders.",
      "error"
    );
  }

  if (!confirm(`Delete ${user.fullName}'s account?`)) return;

  const previousUsers = users;
  const previousCarts = { ...carts };

  users = users.filter(item => item.id !== id);
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

  const pending = orders.filter(
    order => order.status === "Pending"
  ).length;

  const completed = orders.filter(
    order => order.status === "Completed"
  ).length;

  const customers = users.filter(
    user => user.role === "customer"
  ).length;

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
    user.id !== currentUser.id &&
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


/* =========================================================
   20. PRINT RECEIPT
========================================================= */

function printReceipt() {
  const content = $("receiptContent");

  if (!content.innerHTML.trim()) return;

  const printWindow = window.open(
    "",
    "_blank",
    "width=850,height=750"
  );

  if (!printWindow) {
    return notify("Allow pop-ups to print your receipt.", "error");
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

          h2 { color: #5d2c43; }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            text-align: left;
          }

          .receipt-head { text-align: center; }

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
            body { padding: 0; }
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

$("receiptModal").querySelector(".btn-primary").addEventListener(
  "click",
  printReceipt
);


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

document.addEventListener("DOMContentLoaded", initializeApplication);
