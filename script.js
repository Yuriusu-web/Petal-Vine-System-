"use strict";

/* =========================================
   PETAL & VINE - MAIN JAVASCRIPT
   ========================================= */

const KEYS = {
  products: "pv_products_v8",
  users: "pv_users_v8",
  orders: "pv_orders_v8",
  admin: "pv_admin_v8",
  settings: "pv_settings_v8"
};

const starterProducts = [
  { id: "p1", name: "Classic Red Roses", price: 850, stock: 20, category: "Roses", description: "A timeless bouquet of beautiful red roses.", emoji: "🌹", image: "" },
  { id: "p2", name: "Pink Tulip Bouquet", price: 950, stock: 15, category: "Tulips", description: "Soft pink tulips for someone special.", emoji: "🌷", image: "" },
  { id: "p3", name: "Sunflower Sunshine", price: 750, stock: 18, category: "Sunflowers", description: "Bright sunflowers to bring happiness.", emoji: "🌻", image: "" },
  { id: "p4", name: "White Lily Elegance", price: 1100, stock: 12, category: "Lilies", description: "Elegant white lilies in a lovely arrangement.", emoji: "💮", image: "" },
  { id: "p5", name: "Purple Dream", price: 900, stock: 14, category: "Mixed Flowers", description: "A charming purple floral arrangement.", emoji: "💜", image: "" },
  { id: "p6", name: "Baby's Breath", price: 550, stock: 25, category: "Specialty", description: "Delicate little flowers for every occasion.", emoji: "🤍", image: "" },
  { id: "p7", name: "Pink Rose Garden", price: 1000, stock: 16, category: "Roses", description: "Lovely pink roses arranged with care.", emoji: "🌸", image: "" },
  { id: "p8", name: "Mixed Flower Basket", price: 1250, stock: 10, category: "Baskets", description: "A colorful basket filled with fresh flowers.", emoji: "🧺", image: "" },
  { id: "p9", name: "White Rose Bouquet", price: 950, stock: 17, category: "Roses", description: "Classic white roses for meaningful moments.", emoji: "🥀", image: "" },
  { id: "p10", name: "Peach Blossom", price: 880, stock: 13, category: "Mixed Flowers", description: "Warm peach-colored blooms in a bouquet.", emoji: "🌼", image: "" },
  { id: "p11", name: "Lavender Love", price: 780, stock: 19, category: "Specialty", description: "A gentle arrangement with lavender tones.", emoji: "🪻", image: "" },
  { id: "p12", name: "Pink Carnations", price: 680, stock: 21, category: "Carnations", description: "Pretty pink carnations for thoughtful gifts.", emoji: "🌺", image: "" },
  { id: "p13", name: "Garden Party", price: 1350, stock: 8, category: "Mixed Flowers", description: "A premium mix of colorful garden flowers.", emoji: "💐", image: "" },
  { id: "p14", name: "Yellow Rose Bouquet", price: 890, stock: 15, category: "Roses", description: "Cheerful yellow roses to brighten the day.", emoji: "🌼", image: "" },
  { id: "p15", name: "Sweet Pastel Mix", price: 1150, stock: 11, category: "Mixed Flowers", description: "A soft pastel bouquet for every celebration.", emoji: "🌷", image: "" }
];

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error("Could not read saved data:", key, error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Could not save data:", error);
    toast("Unable to save. Storage may be full.");
  }
}

let products = loadData(KEYS.products, starterProducts);
let users = loadData(KEYS.users, []);
let orders = loadData(KEYS.orders, []);
let admin = loadData(KEYS.admin, {
  username: "admin",
  password: "Admin123",
  name: "Administrator"
});
let settings = loadData(KEYS.settings, {
  adminName: "Administrator",
  storeName: "Petal & Vine",
  contact: "",
  address: ""
});

let currentUser = null;
let cart = [];
let selectedCartItems = new Set();

function persistProducts() { saveData(KEYS.products, products); }
function persistUsers() { saveData(KEYS.users, users); }
function persistOrders() { saveData(KEYS.orders, orders); }
function persistAdmin() { saveData(KEYS.admin, admin); }
function persistSettings() { saveData(KEYS.settings, settings); }

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

function makeId(prefix = "ID") {
  return prefix + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase();
}

function toast(message) {
  const element = document.getElementById("toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "Hide";
  } else {
    input.type = "password";
    button.textContent = "Show";
  }
}

/* =========================================
   INITIAL SETUP
   ========================================= */

function initialize() {
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  if (!Array.isArray(products)) products = starterProducts;
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];

  // Add missing starter products without removing existing products.
  starterProducts.forEach(starter => {
    if (!products.some(product => product.id === starter.id)) {
      products.push({ ...starter });
    }
  });

  persistProducts();

  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("registerForm").addEventListener("submit", register);
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("settingsForm").addEventListener("submit", saveSettings);
  document.getElementById("adminAccountForm").addEventListener("submit", updateAdminAccount);

  updateHeader();
  showOnly("authPage");
}

function switchAuth(type) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm.classList.toggle("hidden", type !== "login");
  registerForm.classList.toggle("hidden", type !== "register");

  document.getElementById("loginTab").classList.toggle("active", type === "login");
  document.getElementById("registerTab").classList.toggle("active", type === "register");
}

/* =========================================
   LOGIN AND REGISTRATION
   ========================================= */

function login(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (
    username === String(admin.username).toLowerCase() &&
    password === admin.password
  ) {
    currentUser = {
      id: "admin",
      username: admin.username,
      name: settings.adminName || admin.name,
      role: "admin"
    };

    updateHeader();
    showAdmin("overview");
    toast("Welcome to the admin dashboard.");
    document.getElementById("loginForm").reset();
    return;
  }

  const user = users.find(item =>
    (
      String(item.username).toLowerCase() === username ||
      String(item.email).toLowerCase() === username
    ) && item.password === password
  );

  if (!user) {
    toast("Incorrect username, email, or password.");
    return;
  }

  currentUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: "customer"
  };

  user.lastLogin = new Date().toISOString();
  persistUsers();

  updateHeader();
  showPage("shop");
  toast("Welcome, " + user.name + "!");
  document.getElementById("loginForm").reset();
}

function register(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (name.length < 2 || username.length < 3 || password.length < 6) {
    toast("Please enter valid registration details.");
    return;
  }

  const duplicate = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase() ||
    user.email.toLowerCase() === email
  );

  if (duplicate) {
    toast("That username or email is already registered.");
    return;
  }

  const user = {
    id: makeId("USER"),
    name,
    email,
    username,
    password,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(user);
  persistUsers();

  currentUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: "customer"
  };

  document.getElementById("registerForm").reset();
  updateHeader();
  showPage("shop");
  toast("Your account has been created.");
}

function logout() {
  currentUser = null;
  cart = [];
  selectedCartItems.clear();

  updateHeader();
  showOnly("authPage");
  switchAuth("login");
  toast("You have logged out.");
}

/* =========================================
   PAGE NAVIGATION
   ========================================= */

function showOnly(pageId) {
  document.querySelectorAll("main > .page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = document.getElementById(pageId);
  if (page) page.classList.remove("hidden");
}

function updateHeader() {
  const isLoggedIn = Boolean(currentUser);
  const isAdmin = isLoggedIn && currentUser.role === "admin";

  document.getElementById("customerNav").classList.toggle("hidden", !isLoggedIn || isAdmin);
  document.getElementById("adminNav").classList.toggle("hidden", !isAdmin);

  document.getElementById("cartCount").textContent = cart.reduce(
    (total, item) => total + item.quantity, 0
  );

  document.getElementById("adminWelcome").textContent =
    settings.adminName || admin.name || "Administrator";
}

function showPage(page) {
  if (!currentUser) {
    showOnly("authPage");
    return;
  }

  if (currentUser.role === "admin") {
    showAdmin("overview");
    return;
  }

  if (page === "shop") {
    showOnly("shopPage");
    renderShop();
  } else if (page === "cart") {
    showOnly("cartPage");
    renderCart();
  } else if (page === "transactions") {
    showOnly("transactionsPage");
    renderTransactions();
  } else if (page === "about") {
    showOnly("aboutPage");
  }

  updateHeader();
}

/* =========================================
   CUSTOMER PRODUCT SHOP
   ========================================= */

function productImage(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }

  return `<span class="product-emoji">${escapeHTML(product.emoji || "💐")}</span>`;
}

function renderShop() {
  const grid = document.getElementById("productGrid");
  const search = document.getElementById("productSearch").value.trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    String(product.category).toLowerCase().includes(search) ||
    String(product.description).toLowerCase().includes(search)
  );

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-image">${productImage(product)}</div>

      <div class="product-info">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-description">${escapeHTML(product.description)}</p>
        <div class="product-price">${money(product.price)}</div>
        <div class="stock-label">
          ${product.stock > 0 ? `${product.stock} available` : "Sold out"}
        </div>

        <div class="product-bottom">
          <label for="qty-${product.id}">Quantity</label>
          <input
            id="qty-${product.id}"
            type="number"
            min="1"
            max="${product.stock}"
            value="1"
            ${product.stock < 1 ? "disabled" : ""}
          >

          <div class="buy-choices">
            <button
              class="btn light"
              onclick="addToCart('${product.id}')"
              ${product.stock < 1 ? "disabled" : ""}
            >Add to Cart</button>

            <button
              class="btn primary"
              onclick="buyNow('${product.id}')"
              ${product.stock < 1 ? "disabled" : ""}
            >Buy Now</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function getProductQuantity(id) {
  const input = document.getElementById("qty-" + id);
  const quantity = Math.floor(Number(input?.value || 1));

  if (!Number.isInteger(quantity) || quantity < 1) {
    toast("Please enter a valid quantity.");
    return null;
  }

  return quantity;
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const quantity = getProductQuantity(id);
  if (quantity === null) return;

  const existing = cart.find(item => item.productId === id);
  const combinedQuantity = quantity + (existing ? existing.quantity : 0);

  if (combinedQuantity > product.stock) {
    toast("Only " + product.stock + " item(s) available.");
    return;
  }

  if (existing) {
    existing.quantity = combinedQuantity;
  } else {
    cart.push({ productId: id, quantity });
  }

  // Newly added items are selected for checkout.
  selectedCartItems.add(id);

  updateHeader();
  toast("Added to your cart.");
}

function buyNow(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const quantity = getProductQuantity(id);
  if (quantity === null) return;

  if (quantity > product.stock) {
    toast("Only " + product.stock + " item(s) available.");
    return;
  }

  // Buy Now purchases only the selected product.
  cart = [{ productId: id, quantity }];
  selectedCartItems = new Set([id]);

  updateHeader();
  showPage("cart");
  toast("Product ready for checkout.");
}

/* =========================================
   CUSTOMER CART AND SELECTED CHECKOUT
   ========================================= */

function getCartDetails() {
  return cart.map(item => {
    const product = products.find(product => product.id === item.productId);

    if (!product) return null;

    return {
      ...item,
      product,
      subtotal: product.price * item.quantity
    };
  }).filter(Boolean);
}

function renderCart() {
  const container = document.getElementById("cartContent");
  const details = getCartDetails();

  if (!details.length) {
    container.innerHTML = `
      <div class="empty">
        <h2>Your cart is empty</h2>
        <p>Browse our flowers and add something beautiful.</p>
        <button class="btn primary" onclick="showPage('shop')">Continue Shopping</button>
      </div>
    `;
    return;
  }

  const selected = details.filter(item => selectedCartItems.has(item.productId));
  const selectedTotal = selected.reduce((sum, item) => sum + item.subtotal, 0);

  container.innerHTML = `
    <div class="cart-toolbar">
      <label>
        <input
          type="checkbox"
          style="width:auto"
          ${details.every(item => selectedCartItems.has(item.productId)) ? "checked" : ""}
          onchange="selectAllCart(this.checked)"
        >
        Select all items
      </label>
    </div>

    ${details.map(item => `
      <div class="cart-item">
        <input
          type="checkbox"
          style="width:18px"
          ${selectedCartItems.has(item.productId) ? "checked" : ""}
          onchange="toggleCartItem('${item.productId}',this.checked)"
          aria-label="Select ${escapeHTML(item.product.name)}"
        >

        <div class="cart-thumb">
          ${item.product.image
            ? `<img src="${item.product.image}" alt="">`
            : escapeHTML(item.product.emoji || "💐")}
        </div>

        <div>
          <h3>${escapeHTML(item.product.name)}</h3>
          <p>${money(item.product.price)} each</p>
          <p>Available stock: ${item.product.stock}</p>

          <div class="quantity-controls">
            <button onclick="changeCartQuantity('${item.productId}',-1)">−</button>
            <strong>${item.quantity}</strong>
            <button onclick="changeCartQuantity('${item.productId}',1)">+</button>
            <button class="btn danger small" onclick="removeFromCart('${item.productId}')">Remove</button>
          </div>
        </div>

        <strong class="cart-line-total">${money(item.subtotal)}</strong>
      </div>
    `).join("")}

    <div class="cart-summary">
      <div class="summary-row">
        <span>Items in cart</span>
        <strong>${details.reduce((sum, item) => sum + item.quantity, 0)}</strong>
      </div>
      <div class="summary-row">
        <span>Selected items</span>
        <strong>${selected.reduce((sum, item) => sum + item.quantity, 0)}</strong>
      </div>
      <div class="summary-row summary-total">
        <span>Selected total</span>
        <strong>${money(selectedTotal)}</strong>
      </div>
      <button
        class="btn primary full"
        onclick="showCheckout()"
        ${selected.length ? "" : "disabled"}
      >Checkout Selected Items</button>
      <button class="btn light full" onclick="showPage('shop')">Continue Shopping</button>
    </div>

    <div id="checkoutArea"></div>
  `;
}

function selectAllCart(checked) {
  if (checked) {
    cart.forEach(item => selectedCartItems.add(item.productId));
  } else {
    selectedCartItems.clear();
  }

  renderCart();
}

function toggleCartItem(id, checked) {
  if (checked) selectedCartItems.add(id);
  else selectedCartItems.delete(id);

  renderCart();
}

function changeCartQuantity(id, amount) {
  const item = cart.find(item => item.productId === id);
  const product = products.find(product => product.id === id);

  if (!item || !product) return;

  const newQuantity = item.quantity + amount;

  if (newQuantity < 1) {
    removeFromCart(id);
    return;
  }

  if (newQuantity > product.stock) {
    toast("Only " + product.stock + " item(s) available.");
    return;
  }

  item.quantity = newQuantity;
  renderCart();
  updateHeader();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.productId !== id);
  selectedCartItems.delete(id);

  renderCart();
  updateHeader();
  toast("Item removed from cart.");
}

function showCheckout() {
  const selected = getCartDetails().filter(item =>
    selectedCartItems.has(item.productId)
  );

  if (!selected.length) {
    toast("Please select at least one item.");
    return;
  }

  const checkoutArea = document.getElementById("checkoutArea");
  const total = selected.reduce((sum, item) => sum + item.subtotal, 0);

  checkoutArea.innerHTML = `
    <div class="checkout-panel">
      <h2>Checkout</h2>
      <p>Review your selected items before placing your order.</p>

      ${selected.map(item => `
        <div class="summary-row">
          <span>${escapeHTML(item.product.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="summary-row summary-total">
        <span>Total to pay</span>
        <strong>${money(total)}</strong>
      </div>

      <form id="checkoutForm">
        <div class="checkout-grid">
          <div>
            <label>Full Name</label>
            <input id="checkoutName" required value="${escapeHTML(currentUser.name)}">
          </div>
          <div>
            <label>Contact Number</label>
            <input id="checkoutPhone" required placeholder="09XXXXXXXXX">
          </div>
        </div>

        <label>Delivery Address</label>
        <textarea id="checkoutAddress" rows="3" required placeholder="House number, street, barangay, city"></textarea>

        <label>Payment Method</label>
        <select id="checkoutPayment" required>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="GCash">GCash</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>

        <label>Order Notes (optional)</label>
        <textarea id="checkoutNotes" rows="2" placeholder="Special instructions..."></textarea>

        <button class="btn primary full" type="submit">Place Order</button>
      </form>
    </div>
  `;

  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
  checkoutArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================================
   PLACE ORDER AND STOCK MANAGEMENT
   ========================================= */

function placeOrder(event) {
  event.preventDefault();

  const selected = getCartDetails().filter(item =>
    selectedCartItems.has(item.productId)
  );

  if (!selected.length) {
    toast("Please select items to purchase.");
    return;
  }

  // Check all stock before changing anything.
  for (const item of selected) {
    const currentProduct = products.find(product => product.id === item.productId);

    if (!currentProduct || item.quantity > currentProduct.stock) {
      toast("Not enough stock for " + (currentProduct?.name || "an item") + ".");
      renderCart();
      return;
    }
  }

  const customerName = document.getElementById("checkoutName").value.trim();
  const phone = document.getElementById("checkoutPhone").value.trim();
  const address = document.getElementById("checkoutAddress").value.trim();
  const payment = document.getElementById("checkoutPayment").value;
  const notes = document.getElementById("checkoutNotes").value.trim();

  if (!customerName || !phone || !address) {
    toast("Please complete your delivery details.");
    return;
  }

  const orderItems = selected.map(item => ({
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    subtotal: item.subtotal
  }));

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: makeId("PV"),
    customerId: currentUser.id,
    customerName,
    customerEmail: users.find(user => user.id === currentUser.id)?.email || "",
    phone,
    address,
    payment,
    notes,
    items: orderItems,
    total,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  // Deduct inventory only after every item passes the stock check.
  selected.forEach(item => {
    const product = products.find(product => product.id === item.productId);
    product.stock -= item.quantity;
  });

  orders.unshift(order);

  // Remove only purchased items. Unselected cart items stay in the cart.
  cart = cart.filter(item => !selectedCartItems.has(item.productId));
  selectedCartItems.clear();

  persistProducts();
  persistOrders();

  updateHeader();
  showPage("transactions");
  toast("Order placed successfully!");
}

/* =========================================
   CUSTOMER TRANSACTIONS
   ========================================= */

function renderTransactions() {
  const container = document.getElementById("transactionsContent");

  const transactions = orders.filter(order =>
    order.customerId === currentUser.id
  );

  if (!transactions.length) {
    container.innerHTML = `
      <div class="empty">
        <h2>No transactions yet</h2>
        <p>Your purchases will appear here after checkout.</p>
        <button class="btn primary" onclick="showPage('shop')">Start Shopping</button>
      </div>
    `;
    return;
  }

  container.innerHTML = transactions.map(order => `
    <div class="transaction-card">
      <h3>Transaction ${escapeHTML(order.id)}</h3>

      <div class="transaction-details">
        <div>
          <small>Transaction Date</small>
          <strong>${new Date(order.createdAt).toLocaleString()}</strong>
        </div>
        <div>
          <small>Total Amount</small>
          <strong>${money(order.total)}</strong>
        </div>
        <div>
          <small>Payment Method</small>
          <strong>${escapeHTML(order.payment)}</strong>
        </div>
        <div>
          <small>Order Status</small>
          <strong class="badge">${escapeHTML(order.status)}</strong>
        </div>
      </div>

      <h3>Purchased Items</h3>
      ${order.items.map(item => `
        <p>${escapeHTML(item.name)} × ${item.quantity} — ${money(item.subtotal)}</p>
      `).join("")}

      <p><strong>Delivery Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Contact:</strong> ${escapeHTML(order.phone || "")}</p>
      ${order.notes ? `<p><strong>Notes:</strong> ${escapeHTML(order.notes)}</p>` : ""}

      <button class="btn light small" onclick="printReceipt('${order.id}')">
        View / Print Receipt
      </button>
    </div>
  `).join("");
}

/* =========================================
   ADMIN NAVIGATION AND DASHBOARD
   ========================================= */

function showAdmin(section) {
  if (!currentUser || currentUser.role !== "admin") {
    showOnly("authPage");
    return;
  }

  showOnly("adminPage");

  document.querySelectorAll(".admin-section").forEach(element => {
    element.classList.add("hidden");
  });

  const sectionMap = {
    overview: "adminOverview",
    products: "adminProducts",
    orders: "adminOrders",
    customers: "adminCustomers",
    receipts: "adminReceipts",
    settings: "adminSettings"
  };

  const target = document.getElementById(sectionMap[section] || "adminOverview");
  target.classList.remove("hidden");

  if (section === "overview") renderAdminOverview();
  if (section === "products") renderAdminProducts();
  if (section === "orders") renderAdminOrders();
  if (section === "customers") renderCustomers();
  if (section === "receipts") renderReceipts();
  if (section === "settings") loadSettingsForm();

  updateHeader();
}

function renderAdminOverview() {
  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statOrders").textContent = orders.length;
  document.getElementById("statCustomers").textContent = users.length;

  const sales = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  document.getElementById("statSales").textContent = money(sales);

  const recent = document.getElementById("recentOrders");

  if (!orders.length) {
    recent.innerHTML = `<p class="form-note">No orders yet.</p>`;
    return;
  }

  recent.innerHTML = `
    <div class="admin-table-wrap">
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
          ${orders.slice(0, 5).map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>${money(order.total)}</td>
              <td><span class="badge">${escapeHTML(order.status)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================================
   ADMIN PRODUCT CRUD
   CREATE, READ, UPDATE, DELETE
   ========================================= */

function renderAdminProducts() {
  const container = document.getElementById("adminProductList");
  const search = document.getElementById("adminProductSearch").value.trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    String(product.category).toLowerCase().includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(product => `
            <tr>
              <td>
                <div class="table-product">
                  ${product.image
                    ? `<img src="${product.image}" alt="">`
                    : `<span class="table-emoji">${escapeHTML(product.emoji || "💐")}</span>`}
                  <strong>${escapeHTML(product.name)}</strong>
                </div>
              </td>
              <td>${escapeHTML(product.category)}</td>
              <td>${money(product.price)}</td>
              <td>${product.stock}</td>
              <td>
                <div class="table-actions">
                  <button class="btn light small" onclick="editProduct('${product.id}')">Edit</button>
                  <button class="btn danger small" onclick="deleteProduct('${product.id}')">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function saveProduct(event) {
  event.preventDefault();

  const id = document.getElementById("editProductId").value;
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const category = document.getElementById("productCategory").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const emoji = document.getElementById("productEmoji").value.trim() || "💐";
  const imageFile = document.getElementById("productImage").files[0];

  if (
    !name ||
    !category ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    toast("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    toast("A product with this name already exists.");
    return;
  }

  const existing = products.find(product => product.id === id);
  let image = existing?.image || "";

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      toast("Please select a valid image.");
      return;
    }

    if (imageFile.size > 2 * 1024 * 1024) {
      toast("Please choose an image smaller than 2 MB.");
      return;
    }

    try {
      image = await readImageFile(imageFile);
    } catch (error) {
      toast("Could not read the selected image.");
      return;
    }
  }

  const productData = {
    id: id || makeId("PROD"),
    name,
    price,
    stock,
    category,
    description,
    emoji,
    image
  };

  if (existing) {
    products = products.map(product =>
      product.id === id ? productData : product
    );
    toast("Product updated successfully.");
  } else {
    products.unshift(productData);
    toast("New product added successfully.");
  }

  persistProducts();
  resetProductForm();
  renderAdminProducts();
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) {
    toast("Product not found.");
    return;
  }

  document.getElementById("editProductId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productEmoji").value = product.emoji || "💐";
  document.getElementById("productImage").value = "";

  document.getElementById("productFormTitle").textContent = "Edit Product";
  document.getElementById("saveProductButton").textContent = "Save Changes";
  document.getElementById("cancelEditButton").classList.remove("hidden");

  document.getElementById("productForm").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
    return;
  }

  products = products.filter(item => item.id !== id);
  cart = cart.filter(item => item.productId !== id);
  selectedCartItems.delete(id);

  persistProducts();
  updateHeader();
  renderAdminProducts();
  toast("Product deleted successfully.");
}

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("editProductId").value = "";
  document.getElementById("productFormTitle").textContent = "Add New Product";
  document.getElementById("saveProductButton").textContent = "Add Product";
  document.getElementById("cancelEditButton").classList.add("hidden");
}

/* =========================================
   ADMIN ORDER MANAGEMENT
   ========================================= */

function renderAdminOrders() {
  const container = document.getElementById("adminOrderList");

  if (!orders.length) {
    container.innerHTML = `<div class="empty">No customer orders yet.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="section-heading">
        <div>
          <h3>Order ${escapeHTML(order.id)}</h3>
          <p>${escapeHTML(order.customerName)} · ${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span class="badge">${escapeHTML(order.status)}</span>
      </div>

      <p><strong>Contact:</strong> ${escapeHTML(order.phone || "")}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>

      ${order.items.map(item => `
        <div class="summary-row">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="summary-row summary-total">
        <span>Total</span>
        <strong>${money(order.total)}</strong>
      </div>

      <label for="status-${order.id}">Update Status</label>
      <div class="form-actions">
        <select id="status-${order.id}" style="max-width:220px">
          ${["Pending", "Processing", "Ready", "Completed", "Cancelled"].map(status => `
            <option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>
          `).join("")}
        </select>

        <button class="btn primary small" onclick="updateOrderStatus('${order.id}')">Save Status</button>
        <button class="btn light small" onclick="printReceipt('${order.id}')">Print Receipt</button>
      </div>
    </div>
  `).join("");
}

function updateOrderStatus(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const newStatus = document.getElementById("status-" + id).value;
  const oldStatus = order.status;

  if (oldStatus === "Cancelled" && newStatus !== "Cancelled") {
    for (const item of order.items) {
      const product = products.find(product => product.id === item.productId);

      if (!product || product.stock < item.quantity) {
        toast("Cannot reopen this order because there is not enough stock.");
        return;
      }
    }

    order.items.forEach(item => {
      const product = products.find(product => product.id === item.productId);
      product.stock -= item.quantity;
    });
  }

  if (oldStatus !== "Cancelled" && newStatus === "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(product => product.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = newStatus;

  persistOrders();
  persistProducts();

  renderAdminOrders();
  toast("Order status updated.");
}

/* =========================================
   ADMIN CUSTOMER MANAGEMENT
   ========================================= */

function renderCustomers() {
  document.getElementById("totalUsers").textContent = users.length;

  const today = new Date();
  const newCount = users.filter(user => {
    const created = new Date(user.createdAt);
    return created.toDateString() === today.toDateString();
  }).length;

  const activeCount = users.filter(user => {
    if (!user.lastLogin) return false;

    const days = (Date.now() - new Date(user.lastLogin).getTime()) /
      (1000 * 60 * 60 * 24);

    return days <= 30;
  }).length;

  document.getElementById("newUsers").textContent = newCount;
  document.getElementById("activeUsers").textContent = activeCount;

  const container = document.getElementById("customerList");

  if (!users.length) {
    container.innerHTML = `<div class="empty">No registered customers yet.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="panel admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Registered</th>
            <th>Last Login</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${escapeHTML(user.name)}</td>
              <td>${escapeHTML(user.username)}</td>
              <td>${escapeHTML(user.email)}</td>
              <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
              <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================================
   RECEIPTS AND PRINTING
   ========================================= */

function receiptHTML(order) {
  return `
    <div class="receipt">
      <h2>${escapeHTML(settings.storeName || "Petal & Vine")}</h2>
      <p style="text-align:center">Flower Shop Receipt</p>
      <hr>

      <p><strong>Receipt No.:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Contact:</strong> ${escapeHTML(order.phone || "")}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
      <hr>

      ${order.items.map(item => `
        <div class="summary-row">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <hr>
      <div class="summary-row summary-total">
        <span>Total</span>
        <strong>${money(order.total)}</strong>
      </div>

      <p><strong>Status:</strong> ${escapeHTML(order.status)}</p>
      <p style="text-align:center;margin-top:25px">Thank you for shopping with us! 🌷</p>
    </div>
  `;
}

function printReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) {
    toast("Receipt not found.");
    return;
  }

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    toast("Please allow pop-ups to print your receipt.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${escapeHTML(order.id)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 650px;
          margin: 25px auto;
          padding: 15px;
          color: #352a30;
        }
        h2 { color: #7b3f5b; text-align: center; }
        p { line-height: 1.5; }
        hr { border: 0; border-top: 1px dashed #c9879f; margin: 15px 0; }
        .summary-row { display: flex; justify-content: space-between; gap: 10px; margin: 10px 0; }
        .summary-total { font-size: 20px; font-weight: bold; color: #7b3f5b; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      ${receiptHTML(order)}
      <button onclick="window.print()">Print Receipt</button>
    </body>
    </html>
  `);

  printWindow.document.close();
}

function renderReceipts() {
  const container = document.getElementById("receiptList");

  if (!orders.length) {
    container.innerHTML = `<div class="empty">There are no receipts yet.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="panel">
      <div class="section-heading">
        <div>
          <h3>Receipt ${escapeHTML(order.id)}</h3>
          <p>${escapeHTML(order.customerName)} · ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <strong>${money(order.total)}</strong>
      </div>
      <button class="btn primary small" onclick="printReceipt('${order.id}')">View / Print Receipt</button>
    </div>
  `).join("");
}

/* =========================================
   ADMIN SETTINGS
   ========================================= */

function loadSettingsForm() {
  document.getElementById("settingAdminName").value = settings.adminName || "Administrator";
  document.getElementById("settingStoreName").value = settings.storeName || "Petal & Vine";
  document.getElementById("settingContact").value = settings.contact || "";
  document.getElementById("settingAddress").value = settings.address || "";
  document.getElementById("newAdminUsername").value = admin.username || "admin";
}

function saveSettings(event) {
  event.preventDefault();

  settings.adminName = document.getElementById("settingAdminName").value.trim();
  settings.storeName = document.getElementById("settingStoreName").value.trim();
  settings.contact = document.getElementById("settingContact").value.trim();
  settings.address = document.getElementById("settingAddress").value.trim();

  if (!settings.adminName || !settings.storeName) {
    toast("Please complete the required settings.");
    return;
  }

  admin.name = settings.adminName;

  persistSettings();
  persistAdmin();

  if (currentUser?.role === "admin") {
    currentUser.name = settings.adminName;
  }

  updateHeader();
  toast("Store settings saved.");
}

function updateAdminAccount(event) {
  event.preventDefault();

  const username = document.getElementById("newAdminUsername").value.trim();
  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("newAdminPassword").value;

  if (currentPassword !== admin.password) {
    toast("Your current password is incorrect.");
    return;
  }

  if (username.length < 3 || newPassword.length < 6) {
    toast("Username must be at least 3 characters and password at least 6.");
    return;
  }

  admin.username = username;
  admin.password = newPassword;

  persistAdmin();

  document.getElementById("adminAccountForm").reset();
  document.getElementById("newAdminUsername").value = admin.username;

  toast("Admin login details updated.");
}

/* =========================================
   START APPLICATION
   ========================================= */

document.addEventListener("DOMContentLoaded", initialize);
