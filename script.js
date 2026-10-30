"use strict";

/* =========================================
   PETAL & VINE - MAIN JAVASCRIPT
   ========================================= */

const STORAGE = {
  products: "pv_products",
  users: "pv_users",
  orders: "pv_orders",
  settings: "pv_settings"
};

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Classic Red Roses", category: "Roses", price: 850, stock: 20, description: "A timeless bouquet of beautiful red roses.", emoji: "🌹" },
  { id: 2, name: "Pink Rose Bouquet", category: "Bouquet", price: 950, stock: 15, description: "Soft pink roses for someone special.", emoji: "🌸" },
  { id: 3, name: "Sunflower Delight", category: "Bouquet", price: 650, stock: 18, description: "Bright sunflowers to bring happiness.", emoji: "🌻" },
  { id: 4, name: "White Tulips", category: "Bouquet", price: 780, stock: 12, description: "Elegant white tulips with fresh greenery.", emoji: "🌷" },
  { id: 5, name: "Mixed Flower Basket", category: "Arrangement", price: 1200, stock: 10, description: "A colorful mix of seasonal flowers.", emoji: "💐" },
  { id: 6, name: "Baby's Breath Bouquet", category: "Bouquet", price: 550, stock: 22, description: "Delicate white flowers in a lovely wrap.", emoji: "🤍" },
  { id: 7, name: "Purple Orchid", category: "Plants", price: 1100, stock: 8, description: "A graceful orchid plant for your home.", emoji: "🪻" },
  { id: 8, name: "Pink Carnations", category: "Bouquet", price: 720, stock: 16, description: "Lovely carnations with a soft fragrance.", emoji: "🌺" },
  { id: 9, name: "White Lily Arrangement", category: "Arrangement", price: 1350, stock: 9, description: "Beautiful white lilies in an elegant arrangement.", emoji: "🪷" },
  { id: 10, name: "Red and White Roses", category: "Roses", price: 1050, stock: 14, description: "A romantic combination of red and white roses.", emoji: "🌹" },
  { id: 11, name: "Daisy Garden", category: "Bouquet", price: 600, stock: 20, description: "Fresh daisies for a cheerful day.", emoji: "🌼" },
  { id: 12, name: "Lavender Dreams", category: "Bouquet", price: 890, stock: 11, description: "A calming arrangement with lavender tones.", emoji: "💜" },
  { id: 13, name: "Elegant Flower Box", category: "Arrangement", price: 1500, stock: 7, description: "Premium flowers presented in a gift box.", emoji: "🎁" },
  { id: 14, name: "Mini Succulent", category: "Plants", price: 350, stock: 25, description: "A cute and easy-to-care-for plant.", emoji: "🌱" },
  { id: 15, name: "Romantic Pink Mix", category: "Arrangement", price: 1250, stock: 10, description: "A romantic mix of pink seasonal blooms.", emoji: "💐" }
];

const DEFAULT_SETTINGS = {
  adminName: "Administrator",
  shopName: "Petal & Vine",
  deliveryFee: 50
};

function loadData(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error("Could not load data:", key, error);
    return fallback;
  }
}

let products = loadData(STORAGE.products, DEFAULT_PRODUCTS);
let users = loadData(STORAGE.users, []);
let orders = loadData(STORAGE.orders, []);
let settings = loadData(STORAGE.settings, DEFAULT_SETTINGS);

let currentUser = null;
let cart = [];
let currentReceiptId = null;
let pendingProductImage = "";
let toastTimer = null;

/* =========================================
   INITIAL SETUP
   ========================================= */

function saveAll() {
  try {
    localStorage.setItem(STORAGE.products, JSON.stringify(products));
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
    localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error(error);
    showToast("Unable to save. Storage may be full.");
    return false;
  }
}

function initialize() {
  if (!Array.isArray(products) || products.length === 0) {
    products = DEFAULT_PRODUCTS.map(product => ({ ...product }));
  }

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];

  settings = { ...DEFAULT_SETTINGS, ...settings };

  // Ensure the default admin account exists.
  let admin = users.find(user => user.email === "admin@petalandvine.com");

  if (!admin) {
    users.push({
      id: "admin",
      name: settings.adminName,
      email: "admin@petalandvine.com",
      password: "admin123",
      role: "admin",
      joined: new Date().toISOString()
    });
  } else {
    admin.role = "admin";
  }

  saveAll();

  document.getElementById("loginTab").addEventListener("click", () => switchAuth("login"));
  document.getElementById("registerTab").addEventListener("click", () => switchAuth("register"));

  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("registerForm").addEventListener("submit", register);
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("profileForm").addEventListener("submit", saveProfile);
  document.getElementById("settingsForm").addEventListener("submit", saveSettings);

  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  document.getElementById("productImage").addEventListener("change", previewProductImage);

  renderShop();
}

document.addEventListener("DOMContentLoaded", initialize);

/* =========================================
   GENERAL HELPERS
   ========================================= */

function money(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function getProduct(id) {
  return products.find(product => Number(product.id) === Number(id));
}

function getCurrentAdminName() {
  return settings.adminName || "Administrator";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function productPicture(product, extraClass = "") {
  if (product.image) {
    return `<img class="product-image ${extraClass}" src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }

  return `<div class="product-image emoji ${extraClass}" role="img" aria-label="${escapeHTML(product.name)}">${product.emoji || "💐"}</div>`;
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

/* =========================================
   LOGIN AND REGISTRATION
   ========================================= */

function switchAuth(type) {
  const login = type === "login";

  document.getElementById("loginForm").classList.toggle("hidden", !login);
  document.getElementById("registerForm").classList.toggle("hidden", login);

  document.getElementById("loginTab").classList.toggle("active", login);
  document.getElementById("registerTab").classList.toggle("active", !login);

  document.getElementById("authMessage").textContent = "";
}

function login(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  const user = users.find(account =>
    account.email.toLowerCase() === email &&
    account.password === password
  );

  if (!user) {
    document.getElementById("authMessage").textContent =
      "Incorrect email or password.";
    return;
  }

  currentUser = user;
  user.lastLogin = new Date().toISOString();
  saveAll();

  cart = [];
  enterApp();
}

function register(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;

  if (name.length < 2) {
    showToast("Please enter your full name.");
    return;
  }

  if (users.some(user => user.email.toLowerCase() === email)) {
    showToast("This email is already registered.");
    return;
  }

  const newUser = {
    id: "user-" + Date.now(),
    name,
    email,
    password,
    role: "customer",
    joined: new Date().toISOString()
  };

  users.push(newUser);

  if (!saveAll()) {
    users = users.filter(user => user.id !== newUser.id);
    return;
  }

  currentUser = newUser;
  cart = [];
  enterApp();
  showToast("Welcome to Petal & Vine!");
}

function enterApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  document.getElementById("welcomeText").textContent =
    isAdmin()
      ? "Hello, " + getCurrentAdminName()
      : "Hello, " + currentUser.name;

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", !isAdmin());
  });

  document.querySelectorAll(".customer-only").forEach(element => {
    element.classList.toggle("hidden", isAdmin());
  });

  document.getElementById("dashboardTitle").textContent =
    isAdmin() ? "Admin Dashboard" : "Welcome, " + currentUser.name;

  document.getElementById("dashboardListTitle").textContent =
    isAdmin() ? "Latest Products" : "Featured Flowers";

  renderEverything();
  showPage("dashboardPage");
}

function logout() {
  currentUser = null;
  cart = [];

  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");

  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();
  switchAuth("login");
}

/* =========================================
   PAGE NAVIGATION
   ========================================= */

function showPage(pageId) {
  if (!document.getElementById(pageId)) return;

  if (pageId === "inventoryPage" && !isAdmin()) return;
  if (pageId === "customersPage" && !isAdmin()) return;
  if (pageId === "receiptsPage" && !isAdmin()) return;
  if (pageId === "reportsPage" && !isAdmin()) return;
  if (pageId === "settingsPage" && !isAdmin()) return;
  if (pageId === "shopPage" && isAdmin()) return;
  if (pageId === "cartPage" && isAdmin()) return;
  if (pageId === "profilePage" && isAdmin()) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  document.getElementById(pageId).classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  renderPage(pageId);
}

function renderPage(pageId) {
  switch (pageId) {
    case "dashboardPage":
      renderDashboard();
      break;
    case "shopPage":
      renderShop();
      break;
    case "cartPage":
      renderCart();
      break;
    case "ordersPage":
      renderOrders();
      break;
    case "profilePage":
      renderProfile();
      break;
    case "inventoryPage":
      renderInventory();
      break;
    case "customersPage":
      renderCustomers();
      break;
    case "receiptsPage":
      renderReceipts();
      break;
    case "reportsPage":
      renderReports();
      break;
    case "settingsPage":
      renderSettings();
      break;
  }
}

function renderEverything() {
  renderDashboard();
  renderShop();
  renderCart();
  renderOrders();
  renderInventory();
  renderCustomers();
  renderReceipts();
  renderReports();
  updateCartCount();
}

/* =========================================
   DASHBOARD
   ========================================= */

function renderDashboard() {
  const stats = document.getElementById("dashboardStats");
  const container = document.getElementById("dashboardProducts");

  if (isAdmin()) {
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const customerCount = users.filter(user => user.role !== "admin").length;
    const lowStock = products.filter(product => product.stock <= 5).length;

    stats.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Products</span>
        <strong>${products.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Orders</span>
        <strong>${orders.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Sales</span>
        <strong>${money(totalSales)}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Customers</span>
        <strong>${customerCount}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Low Stock Products</span>
        <strong>${lowStock}</strong>
      </div>
    `;

    container.innerHTML = products.slice(0, 6).map(productCard).join("");
  } else {
    stats.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Available Flowers</span>
        <strong>${products.filter(product => product.stock > 0).length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">My Orders</span>
        <strong>${orders.filter(order => order.userId === currentUser.id).length}</strong>
      </div>
    `;

    container.innerHTML = products
      .filter(product => product.stock > 0)
      .slice(0, 6)
      .map(productCard)
      .join("");
  }
}

function productCard(product) {
  const unavailable = product.stock <= 0;

  return `
    <article class="product-card">
      ${productPicture(product)}
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <span class="stock">${escapeHTML(product.category)}</span>
        <p>${escapeHTML(product.description || "Beautiful flowers for every occasion.")}</p>
        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="stock">${unavailable ? "Out of stock" : product.stock + " available"}</span>
        </div>
        ${!isAdmin() ? `
          <button class="btn primary" ${unavailable ? "disabled" : ""}
            onclick="addToCart(${product.id})">
            ${unavailable ? "Unavailable" : "Add to Cart"}
          </button>
        ` : ""}
      </div>
    </article>
  `;
}

/* =========================================
   SHOP
   ========================================= */

function renderShop() {
  const container = document.getElementById("shopProducts");
  if (!container) return;

  const search = (document.getElementById("shopSearch")?.value || "").toLowerCase();
  const category = document.getElementById("shopCategory")?.value || "";

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      (product.description || "").toLowerCase().includes(search);

    const matchesCategory = !category || product.category === category;

    return matchesSearch && matchesCategory;
  });

  container.innerHTML = filtered.length
    ? filtered.map(productCard).join("")
    : `<div class="empty-state">No matching flowers found.</div>`;
}

/* =========================================
   CART
   ========================================= */

// Add to cart does NOT reduce inventory.
// Inventory is reduced only after successful checkout.

function addToCart(id) {
  if (!currentUser || isAdmin()) return;

  const product = getProduct(id);

  if (!product) {
    showToast("Product not found.");
    return;
  }

  if (product.stock <= 0) {
    showToast("This product is out of stock.");
    return;
  }

  const existing = cart.find(item => Number(item.id) === Number(id));

  const currentQuantity = existing ? existing.quantity : 0;

  if (currentQuantity >= product.stock) {
    showToast("You cannot add more than the available stock.");
    return;
  }

  if (existing) {
    existing.quantity += 1;
    existing.selected = true;
  } else {
    cart.push({
      id: Number(id),
      quantity: 1,
      selected: true
    });
  }

  updateCartCount();
  renderCart();
  showToast("Added to your cart.");
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const element = document.getElementById("cartCount");

  if (element) element.textContent = count;
}

function toggleCartSelection(id, checked) {
  const item = cart.find(entry => Number(entry.id) === Number(id));
  if (!item) return;

  item.selected = checked;
  renderCart();
}

function selectAllCartItems(checked) {
  cart.forEach(item => {
    item.selected = checked;
  });

  renderCart();
}

function changeCartQuantity(id, amount) {
  const item = cart.find(entry => Number(entry.id) === Number(id));
  const product = getProduct(id);

  if (!item || !product) return;

  const newQuantity = item.quantity + amount;

  if (newQuantity <= 0) {
    removeFromCart(id);
    return;
  }

  if (newQuantity > product.stock) {
    showToast("Quantity exceeds available stock.");
    return;
  }

  item.quantity = newQuantity;
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => Number(item.id) !== Number(id));
  renderCart();
  showToast("Item removed from cart.");
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");

  if (!container || !summary) return;

  // Old cart entries are selected by default.
  cart.forEach(item => {
    if (typeof item.selected !== "boolean") {
      item.selected = true;
    }
  });

  // Remove cart entries whose products no longer exist.
  cart = cart.filter(item => getProduct(item.id));

  updateCartCount();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some beautiful flowers to get started.</p>
        <button class="btn primary" onclick="showPage('shopPage')">Browse Flowers</button>
      </div>
    `;

    summary.innerHTML = `
      <h2>Order Summary</h2>
      <p class="muted">Your selected items will appear here.</p>
    `;
    return;
  }

  const allSelected = cart.every(item => item.selected);

  container.innerHTML = `
    <div class="cart-select-all">
      <label>
        <input type="checkbox"
          ${allSelected ? "checked" : ""}
          onchange="selectAllCartItems(this.checked)">
        Select all products
      </label>
    </div>

    ${cart.map(item => {
      const product = getProduct(item.id);
      const lineTotal = product.price * item.quantity;

      return `
        <article class="cart-item">
          <label class="cart-select">
            <input type="checkbox"
              aria-label="Select ${escapeHTML(product.name)}"
              ${item.selected ? "checked" : ""}
              onchange="toggleCartSelection(${product.id}, this.checked)">
          </label>

          ${productPicture(product)}

          <div class="cart-item-details">
            <h3>${escapeHTML(product.name)}</h3>
            <p class="muted">${money(product.price)} each</p>

            <div class="quantity-control">
              <button onclick="changeCartQuantity(${product.id}, -1)">−</button>
              <strong>${item.quantity}</strong>
              <button onclick="changeCartQuantity(${product.id}, 1)">+</button>
            </div>
          </div>

          <div class="cart-item-total">
            <span>${money(lineTotal)}</span>
            <button class="remove-link" onclick="removeFromCart(${product.id})">Remove</button>
          </div>
        </article>
      `;
    }).join("")}
  `;

  const selectedItems = cart.filter(item => item.selected);

  const selectedQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const subtotal = selectedItems.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + product.price * item.quantity;
  }, 0);

  const deliveryFee = selectedItems.length > 0 ? Number(settings.deliveryFee) : 0;
  const total = subtotal + deliveryFee;

  summary.innerHTML = `
    <h2>Order Summary</h2>

    <div class="summary-line">
      <span>Selected products</span>
      <strong>${selectedQuantity}</strong>
    </div>

    <div class="summary-line">
      <span>Subtotal</span>
      <strong>${money(subtotal)}</strong>
    </div>

    <div class="summary-line">
      <span>Delivery fee</span>
      <strong>${money(deliveryFee)}</strong>
    </div>

    <div class="summary-line summary-total">
      <span>Total</span>
      <strong>${money(total)}</strong>
    </div>

    <button class="btn primary full"
      onclick="checkout()"
      ${selectedItems.length === 0 ? "disabled" : ""}>
      Checkout Selected (${selectedQuantity})
    </button>

    ${selectedItems.length === 0
      ? `<p class="muted small">Select at least one product to checkout.</p>`
      : `<p class="muted small">Only selected products will be purchased. Other products will remain in your cart.</p>`
    }
  `;
}

/* =========================================
   CHECKOUT
   ========================================= */

function checkout() {
  if (!currentUser || isAdmin()) return;

  const selectedItems = cart.filter(item => item.selected);

  if (selectedItems.length === 0) {
    showToast("Please select at least one product.");
    return;
  }

  // Check stock before changing anything.
  for (const item of selectedItems) {
    const product = getProduct(item.id);

    if (!product || item.quantity > product.stock) {
      showToast("Not enough stock for " + (product?.name || "a product") + ".");
      return;
    }
  }

  const orderItems = selectedItems.map(item => {
    const product = getProduct(item.id);

    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: Number(item.quantity),
      image: product.image || "",
      emoji: product.emoji || "💐"
    };
  });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const deliveryFee = Number(settings.deliveryFee) || 0;

  const order = {
    id: "PV-" + Date.now(),
    userId: currentUser.id,
    customerName: currentUser.name,
    customerEmail: currentUser.email,
    date: new Date().toISOString(),
    items: orderItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    status: "Completed"
  };

  // Save previous stock values in case saving fails.
  const previousStock = selectedItems.map(item => {
    const product = getProduct(item.id);
    return { id: product.id, stock: product.stock };
  });

  // Decrease stock only now, after the customer confirms checkout.
  selectedItems.forEach(item => {
    const product = getProduct(item.id);
    product.stock -= item.quantity;
  });

  orders.unshift(order);

  if (!saveAll()) {
    // Roll back if saving fails.
    previousStock.forEach(previous => {
      const product = getProduct(previous.id);
      if (product) product.stock = previous.stock;
    });

    orders = orders.filter(existing => existing.id !== order.id);
    return;
  }

  // Remove only purchased products.
  // Unselected products stay in the cart.
  cart = cart.filter(item => !item.selected);

  renderEverything();
  showPage("ordersPage");
  showReceipt(order.id);

  showToast("Checkout successful!");
}

/* =========================================
   ORDERS
   ========================================= */

function getVisibleOrders() {
  if (isAdmin()) return orders;

  return orders.filter(order => order.userId === currentUser.id);
}

function renderOrders() {
  const tbody = document.getElementById("ordersTable");
  if (!tbody) return;

  const visibleOrders = getVisibleOrders();

  if (!visibleOrders.length) {
    tbody.innerHTML = `<tr><td colspan="7">No orders yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = visibleOrders.map(order => `
    <tr>
      <td><strong>${escapeHTML(order.id)}</strong></td>
      <td>${escapeHTML(order.customerName)}</td>
      <td>${formatDate(order.date)}</td>
      <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
      <td>${money(order.total)}</td>
      <td><span class="status">${escapeHTML(order.status)}</span></td>
      <td>
        <button class="btn outline small-btn" onclick="showReceipt('${order.id}')">
          View
        </button>
      </td>
    </tr>
  `).join("");
}

/* =========================================
   RECEIPTS
   ========================================= */

function showReceipt(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) {
    showToast("Receipt not found.");
    return;
  }

  if (!isAdmin() && order.userId !== currentUser.id) {
    showToast("You cannot view this receipt.");
    return;
  }

  currentReceiptId = order.id;

  document.getElementById("receiptContent").innerHTML = receiptHTML(order);
  document.getElementById("receiptModal").classList.remove("hidden");
}

function receiptHTML(order) {
  return `
    <div class="receipt">
      <h2>${escapeHTML(settings.shopName)}</h2>
      <p>Thank you for shopping with us!</p>
      <hr>

      <div class="receipt-row">
        <span>Receipt number</span>
        <strong>${escapeHTML(order.id)}</strong>
      </div>

      <div class="receipt-row">
        <span>Date</span>
        <span>${formatDate(order.date)}</span>
      </div>

      <div class="receipt-row">
        <span>Customer</span>
        <span>${escapeHTML(order.customerName)}</span>
      </div>

      <hr>
      <strong>Purchased Items</strong>

      ${order.items.map(item => `
        <div class="receipt-row">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.price * item.quantity)}</strong>
        </div>
      `).join("")}

      <hr>

      <div class="receipt-row">
        <span>Subtotal</span>
        <span>${money(order.subtotal)}</span>
      </div>

      <div class="receipt-row">
        <span>Delivery fee</span>
        <span>${money(order.deliveryFee)}</span>
      </div>

      <div class="receipt-row" style="font-size:18px">
        <strong>Total</strong>
        <strong>${money(order.total)}</strong>
      </div>

      <hr>
      <p>We appreciate your order. Have a lovely day! 🌷</p>
    </div>
  `;
}

function printReceipt() {
  const order = orders.find(item => item.id === currentReceiptId);
  if (!order) return;

  document.getElementById("printArea").innerHTML = receiptHTML(order);
  window.print();
}

function closeReceipt() {
  document.getElementById("receiptModal").classList.add("hidden");
  currentReceiptId = null;
}

function renderReceipts() {
  const tbody = document.getElementById("receiptsTable");
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="5">No receipts available.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${escapeHTML(order.id)}</td>
      <td>${escapeHTML(order.customerName)}</td>
      <td>${formatDate(order.date)}</td>
      <td>${money(order.total)}</td>
      <td>
        <button class="btn outline small-btn" onclick="showReceipt('${order.id}')">
          View / Print
        </button>
      </td>
    </tr>
  `).join("");
}

/* =========================================
   INVENTORY MANAGEMENT
   ========================================= */

function renderInventory() {
  const tbody = document.getElementById("inventoryTable");
  if (!tbody) return;

  const search = (document.getElementById("inventorySearch")?.value || "").toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(product => `
    <tr>
      <td>
        ${product.image
          ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
          : `<span style="font-size:25px">${product.emoji || "💐"}</span>`
        }
      </td>
      <td>
        <strong>${escapeHTML(product.name)}</strong><br>
        <span class="muted small">${escapeHTML(product.description || "")}</span>
      </td>
      <td>${escapeHTML(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>${product.stock}</td>
      <td>
        <div class="table-actions">
          <button onclick="editProduct(${product.id})">Edit</button>
          <button onclick="deleteProduct(${product.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("productFormTitle").textContent = "Add Product";

  pendingProductImage = "";
  document.getElementById("productImagePreview").src = "";
  document.getElementById("productImagePreview").classList.add("hidden");

  document.getElementById("productFormPanel").classList.remove("hidden");
  document.getElementById("productFormPanel").scrollIntoView({ behavior: "smooth" });
}

function closeProductForm() {
  document.getElementById("productFormPanel").classList.add("hidden");
}

function editProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;

  pendingProductImage = product.image || "";

  const preview = document.getElementById("productImagePreview");

  if (product.image) {
    preview.src = product.image;
    preview.classList.remove("hidden");
  } else {
    preview.src = "";
    preview.classList.add("hidden");
  }

  document.getElementById("productFormTitle").textContent = "Edit Product";
  document.getElementById("productFormPanel").classList.remove("hidden");
  document.getElementById("productFormPanel").scrollIntoView({ behavior: "smooth" });
}

function previewProductImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast("Please choose an image smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    pendingProductImage = reader.result;

    const preview = document.getElementById("productImagePreview");
    preview.src = pendingProductImage;
    preview.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function saveProduct(event) {
  event.preventDefault();

  const idValue = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    showToast("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.name.toLowerCase() === name.toLowerCase() &&
    String(product.id) !== idValue
  );

  if (duplicate) {
    showToast("A product with this name already exists.");
    return;
  }

  const previousProducts = products.map(product => ({ ...product }));

  if (idValue) {
    const product = getProduct(idValue);
    if (!product) return;

    product.name = name;
    product.description = description;
    product.category = category;
    product.price = price;
    product.stock = stock;
    product.image = pendingProductImage || product.image || "";
  } else {
    const newProduct = {
      id: Date.now(),
      name,
      description,
      category,
      price,
      stock,
      image: pendingProductImage || "",
      emoji: "💐"
    };

    products.push(newProduct);
  }

  if (!saveAll()) {
    products = previousProducts;
    return;
  }

  closeProductForm();
  renderEverything();
  showToast("Product saved successfully.");
}

function deleteProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  if (!confirm(`Delete "${product.name}" from inventory?`)) return;

  const previousProducts = [...products];

  products = products.filter(item => Number(item.id) !== Number(id));

  if (!saveAll()) {
    products = previousProducts;
    return;
  }

  // Remove deleted products from carts.
  cart = cart.filter(item => Number(item.id) !== Number(id));

  renderEverything();
  showToast("Product deleted.");
}

/* =========================================
   CUSTOMER MANAGEMENT
   ========================================= */

function renderCustomers() {
  const tbody = document.getElementById("customersTable");
  if (!tbody) return;

  const search = (document.getElementById("customerSearch")?.value || "").toLowerCase();

  const customers = users.filter(user =>
    user.role !== "admin" &&
    (user.name.toLowerCase().includes(search) ||
     user.email.toLowerCase().includes(search))
  );

  if (!customers.length) {
    tbody.innerHTML = `<tr><td colspan="4">No customers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(user => {
    const orderCount = orders.filter(order => order.userId === user.id).length;

    return `
      <tr>
        <td>${escapeHTML(user.name)}</td>
        <td>${escapeHTML(user.email)}</td>
        <td>${user.joined ? new Date(user.joined).toLocaleDateString("en-PH") : "—"}</td>
        <td>${orderCount}</td>
      </tr>
    `;
  }).join("");
}

/* =========================================
   REPORTS
   ========================================= */

function renderReports() {
  const stats = document.getElementById("reportStats");
  const tbody = document.getElementById("reportsTable");

  if (!stats || !tbody) return;

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  stats.innerHTML = `
    <div class="stat-card">
      <span class="stat-label">Total Revenue</span>
      <strong>${money(totalSales)}</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">Total Orders</span>
      <strong>${orders.length}</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">Items Sold</span>
      <strong>${totalItems}</strong>
    </div>
    <div class="stat-card">
      <span class="stat-label">Customers</span>
      <strong>${users.filter(user => user.role !== "admin").length}</strong>
    </div>
  `;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="4">No sales recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${formatDate(order.date)}</td>
      <td>${escapeHTML(order.id)}</td>
      <td>${escapeHTML(order.customerName)}</td>
      <td>${money(order.total)}</td>
    </tr>
  `).join("");
}

/* =========================================
   SETTINGS
   ========================================= */

function renderSettings() {
  document.getElementById("settingAdminName").value = settings.adminName || "";
  document.getElementById("settingShopName").value = settings.shopName || "";
  document.getElementById("settingDeliveryFee").value = settings.deliveryFee ?? 0;
}

function saveSettings(event) {
  event.preventDefault();

  const adminName = document.getElementById("settingAdminName").value.trim();
  const shopName = document.getElementById("settingShopName").value.trim();
  const deliveryFee = Number(document.getElementById("settingDeliveryFee").value);

  if (!adminName || !shopName || !Number.isFinite(deliveryFee) || deliveryFee < 0) {
    showToast("Please enter valid settings.");
    return;
  }

  const oldSettings = { ...settings };

  settings = {
    ...settings,
    adminName,
    shopName,
    deliveryFee
  };

  const admin = users.find(user => user.role === "admin");
  if (admin) admin.name = adminName;

  if (!saveAll()) {
    settings = oldSettings;
    return;
  }

  document.getElementById("welcomeText").textContent = "Hello, " + adminName;

  showToast("Settings saved successfully.");
}

/* =========================================
   CUSTOMER PROFILE
   ========================================= */

function renderProfile() {
  if (!currentUser || isAdmin()) return;

  document.getElementById("profileName").value = currentUser.name;
  document.getElementById("profileEmail").value = currentUser.email;
}

function saveProfile(event) {
  event.preventDefault();

  if (!currentUser || isAdmin()) return;

  const name = document.getElementById("profileName").value.trim();

  if (name.length < 2) {
    showToast("Please enter a valid name.");
    return;
  }

  const oldName = currentUser.name;
  currentUser.name = name;

  if (!saveAll()) {
    currentUser.name = oldName;
    return;
  }

  document.getElementById("welcomeText").textContent = "Hello, " + name;
  document.getElementById("dashboardTitle").textContent = "Welcome, " + name;

  showToast("Profile updated.");
}
