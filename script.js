"use strict";

/*
  PETAL & VINE FLOWER SHOP
  Front-end demo using localStorage.
  For a real online store, use a secure backend and database.
*/

const KEYS = {
  products: "pv_products_v3",
  users: "pv_users_v3",
  orders: "pv_orders_v3",
  settings: "pv_settings_v3",
  session: "pv_session_v3"
};

const $ = id => document.getElementById(id);

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
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

function makeId(prefix = "PV") {
  return prefix + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase();
}

function getProducts() {
  return readData(KEYS.products, []);
}

function setProducts(products) {
  saveData(KEYS.products, products);
}

function getUsers() {
  return readData(KEYS.users, []);
}

function setUsers(users) {
  saveData(KEYS.users, users);
}

function getOrders() {
  return readData(KEYS.orders, []);
}

function setOrders(orders) {
  saveData(KEYS.orders, orders);
}

function getSettings() {
  return readData(KEYS.settings, {
    storeName: "Petal & Vine",
    adminName: "Administrator",
    adminUsername: "admin",
    adminPassword: "admin123",
    storeEmail: "",
    storePhone: "",
    storeAddress: ""
  });
}

function setSettings(settings) {
  saveData(KEYS.settings, settings);
}

function getSession() {
  return readData(KEYS.session, null);
}

function setSession(session) {
  saveData(KEYS.session, session);
}

function currentUser() {
  const session = getSession();
  if (!session) return null;

  if (session.role === "admin") {
    return { ...session };
  }

  return getUsers().find(user => user.id === session.id) || null;
}

function isAdmin() {
  return getSession()?.role === "admin";
}

function isCustomer() {
  return getSession()?.role === "customer";
}

function seedProducts() {
  if (localStorage.getItem(KEYS.products)) return;

  const names = [
    ["Classic Red Roses", "A timeless bouquet of beautiful red roses.", 1299, 20],
    ["Pink Romance", "Soft pink roses for a sweet and romantic surprise.", 1499, 15],
    ["Sunshine Bouquet", "Bright sunflowers to bring happiness.", 999, 18],
    ["White Elegance", "Elegant white flowers for special occasions.", 1599, 12],
    ["Pastel Dreams", "A lovely arrangement of soft pastel blooms.", 1399, 14],
    ["Purple Passion", "Beautiful purple flowers with a graceful finish.", 1699, 10],
    ["Mixed Garden", "A colorful combination of seasonal flowers.", 1199, 20],
    ["Baby's Breath", "Delicate baby's breath bouquet.", 799, 25],
    ["Tulip Love", "Fresh-looking tulips arranged with care.", 1899, 10],
    ["Pink Carnations", "Lovely pink carnations for someone special.", 1099, 16],
    ["Luxury Rose Box", "Premium roses presented in an elegant box.", 2499, 8],
    ["Birthday Blooms", "A cheerful birthday flower arrangement.", 1599, 15],
    ["Daisy Delight", "Fresh and cheerful daisies.", 899, 20],
    ["Golden Sunflowers", "A bold bouquet of golden sunflowers.", 1299, 12],
    ["Forever Yours", "A premium romantic flower arrangement.", 2999, 6]
  ];

  const products = names.map((item, index) => ({
    id: makeId("P"),
    name: item[0],
    description: item[1],
    price: item[2],
    stock: item[3],
    image: "",
    emoji: ["🌹", "🌷", "🌻", "💐", "🌸"][index % 5]
  }));

  setProducts(products);
}

function seedAdmin() {
  const settings = getSettings();
  setSettings(settings);
}

function initialize() {
  seedProducts();
  seedAdmin();

  const session = getSession();

  if (session?.role === "customer" &&
      !getUsers().some(user => user.id === session.id)) {
    setSession(null);
  }

  updateNavigation();
  renderProducts();
  showPage("shop");
}

function toggleMenu() {
  $("mainNav").classList.toggle("open");
}

function updateNavigation() {
  const session = getSession();

  $("authNav").classList.toggle("hidden", !!session);
  $("accountNav").classList.toggle("hidden", !session || session.role !== "customer");
  $("adminNav").classList.toggle("hidden", !session || session.role !== "admin");
  $("logoutNav").classList.toggle("hidden", !session);
}

function showPage(page) {
  const session = getSession();

  if (page === "account" && !isCustomer()) {
    alert("Please login with your customer account first.");
    page = "auth";
  }

  if (page === "admin" && !isAdmin()) {
    alert("Admin access only.");
    page = "auth";
  }

  if (page === "checkout" && !isCustomer()) {
    alert("Please login as a customer before ordering.");
    page = "auth";
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  const target = $(page + "Page");
  if (target) target.classList.add("active");

  $("mainNav").classList.remove("open");

  if (page === "account") renderCustomerAccount();
  if (page === "admin") {
    adminTab("overview", document.querySelector(".admin-tab"));
  }
  if (page === "checkout") renderCheckout();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToProducts() {
  $("productsSection").scrollIntoView({ behavior: "smooth" });
}

function switchAuth(mode) {
  const loginMode = mode === "login";

  $("loginForm").classList.toggle("hidden", !loginMode);
  $("registerForm").classList.toggle("hidden", loginMode);

  $("loginTab").classList.toggle("active", loginMode);
  $("registerTab").classList.toggle("active", !loginMode);
}

function login(event) {
  event.preventDefault();

  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;

  const settings = getSettings();

  if (
    username.toLowerCase() === settings.adminUsername.toLowerCase() &&
    password === settings.adminPassword
  ) {
    setSession({
      id: "ADMIN",
      username: settings.adminUsername,
      name: settings.adminName,
      role: "admin"
    });

    updateNavigation();
    alert("Welcome, administrator!");
    showPage("admin");
    return;
  }

  const user = getUsers().find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    alert("Incorrect username or password.");
    return;
  }

  setSession({
    id: user.id,
    username: user.username,
    name: user.name,
    role: "customer"
  });

  updateNavigation();
  alert("Login successful. Welcome, " + user.name + "!");
  showPage("shop");
}

function register(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (name.length < 2) {
    alert("Please enter your full name.");
    return;
  }

  if (username.length < 3) {
    alert("Username must contain at least 3 characters.");
    return;
  }

  if (password.length < 6) {
    alert("Password must contain at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  const users = getUsers();

  const duplicate = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase() ||
    user.email.toLowerCase() === email.toLowerCase()
  );

  if (duplicate) {
    alert("Username or email is already registered.");
    return;
  }

  const user = {
    id: makeId("U"),
    name,
    username,
    email,
    password,
    createdAt: new Date().toISOString(),
    active: true
  };

  users.push(user);
  setUsers(users);

  setSession({
    id: user.id,
    username: user.username,
    name: user.name,
    role: "customer"
  });

  $("registerForm").reset();
  updateNavigation();

  alert("Your account has been created successfully!");
  showPage("shop");
}

function logout() {
  setSession(null);
  updateNavigation();
  showPage("shop");
  alert("You have logged out.");
}

/* CUSTOMER SHOP */

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;

  const search = ($("productSearch")?.value || "").trim().toLowerCase();

  const products = getProducts().filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.description.toLowerCase().includes(search)
  );

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state">No matching flowers found.</div>`;
    return;
  }

  grid.innerHTML = products.map(product => {
    const image = product.image
      ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
      : `<div class="product-placeholder">${product.emoji || "💐"}</div>`;

    return `
      <article class="product-card">
        ${image}
        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description)}</p>
          <div class="price">${money(product.price)}</div>
          <div class="stock">
            ${product.stock > 0
              ? `${product.stock} available`
              : `<span class="out-of-stock">Out of stock</span>`}
          </div>

          ${product.stock > 0 ? `
            <div class="buy-row">
              <input
                id="qty-${product.id}"
                type="number"
                min="1"
                max="${product.stock}"
                value="1"
                aria-label="Quantity for ${escapeHTML(product.name)}"
              >
              <button class="btn primary" onclick="buyNow('${product.id}')">
                Buy Now
              </button>
            </div>
          ` : ""}
        </div>
      </article>
    `;
  }).join("");
}

/*
  BUY NOW:
  The customer selects the quantity and goes directly to checkout.
  There is no shopping cart page or cart system.
*/

let pendingPurchase = [];

function buyNow(productId) {
  if (!isCustomer()) {
    alert("Please login or create a customer account before buying.");
    showPage("auth");
    switchAuth("login");
    return;
  }

  const product = getProducts().find(item => item.id === productId);
  if (!product) {
    alert("Product not found.");
    return;
  }

  const quantityInput = $("qty-" + productId);
  const quantity = Number(quantityInput?.value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    alert("Please enter a valid quantity.");
    return;
  }

  if (quantity > product.stock) {
    alert("Only " + product.stock + " item(s) are available.");
    return;
  }

  pendingPurchase = [{
    productId: product.id,
    name: product.name,
    price: Number(product.price),
    quantity,
    image: product.image || ""
  }];

  showPage("checkout");
}

function renderCheckout() {
  const summary = $("checkoutSummary");

  if (!pendingPurchase.length) {
    summary.innerHTML = `
      <p class="empty-state">No product selected.
      <button class="text-button" onclick="showPage('shop')">Return to shop</button></p>
    `;
    $("checkoutForm").classList.add("hidden");
    return;
  }

  const total = pendingPurchase.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  summary.innerHTML = `
    <h3>Order summary</h3>
    ${pendingPurchase.map(item => `
      <div class="summary-line">
        <span>${escapeHTML(item.name)} × ${item.quantity}</span>
        <strong>${money(item.price * item.quantity)}</strong>
      </div>
    `).join("")}
    <div class="summary-line summary-total">
      <span>Total</span>
      <span>${money(total)}</span>
    </div>
  `;

  $("checkoutForm").classList.remove("hidden");

  const user = currentUser();

  if (user) {
    $("deliveryName").value = user.name || "";
    $("deliveryEmail").value = user.email || "";
  }
}

function placeOrder(event) {
  event.preventDefault();

  if (!isCustomer()) {
    alert("Please login first.");
    showPage("auth");
    return;
  }

  if (!pendingPurchase.length) {
    alert("Please select a product first.");
    showPage("shop");
    return;
  }

  const products = getProducts();

  // Check all stock before deducting anything.
  for (const item of pendingPurchase) {
    const product = products.find(p => p.id === item.productId);

    if (!product || product.stock < item.quantity) {
      alert("Sorry, " + item.name + " does not have enough stock.");
      renderProducts();
      showPage("shop");
      return;
    }
  }

  const user = currentUser();

  const items = pendingPurchase.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity
  }));

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: makeId("ORD"),
    customerId: user.id,
    customerName: $("deliveryName").value.trim(),
    customerEmail: $("deliveryEmail").value.trim(),
    phone: $("deliveryPhone").value.trim(),
    address: $("deliveryAddress").value.trim(),
    paymentMethod: $("paymentMethod").value,
    paymentStatus: "Pending",
    status: "Pending",
    items,
    total,
    createdAt: new Date().toISOString(),
    stockRestored: false
  };

  // Deduct stock once when the order is successfully created.
  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  setProducts(products);

  const orders = getOrders();
  orders.unshift(order);
  setOrders(orders);

  pendingPurchase = [];

  $("checkoutForm").reset();
  renderProducts();

  alert("Order placed successfully! Your order number is " + order.id);
  showPage("account");
}

/* CUSTOMER ACCOUNT */

function renderCustomerAccount() {
  const user = currentUser();

  if (!user || user.role !== "customer") return;

  $("accountWelcome").textContent = "Welcome, " + user.name + "!";

  const orders = getOrders().filter(order => order.customerId === user.id);
  const container = $("customerOrders");

  if (!orders.length) {
    container.innerHTML = `<p class="empty-state">You have no orders yet.</p>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="panel">
      <div class="summary-line">
        <strong>Order ${escapeHTML(order.id)}</strong>
        <span class="status ${statusClass(order.status)}">${escapeHTML(order.status)}</span>
      </div>
      <p class="muted">${formatDate(order.createdAt)}</p>
      ${order.items.map(item => `
        <div class="summary-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}
      <div class="summary-line">
        <strong>Total</strong>
        <strong>${money(order.total)}</strong>
      </div>
      <p class="muted">Payment: ${escapeHTML(order.paymentMethod)} · ${escapeHTML(order.paymentStatus || "Pending")}</p>
      <button class="btn secondary" onclick="showReceipt('${order.id}')">
        View / Print Receipt
      </button>
    </div>
  `).join("");
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" :
    date.toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short"
    });
}

function statusClass(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
}

/* RECEIPTS */

function showReceipt(orderId) {
  const order = getOrders().find(item => item.id === orderId);

  if (!order) {
    alert("Receipt not found.");
    return;
  }

  const session = getSession();

  if (!session) {
    alert("Please login first.");
    return;
  }

  if (session.role !== "admin" && order.customerId !== session.id) {
    alert("You are not allowed to view this receipt.");
    return;
  }

  const settings = getSettings();

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <div class="receipt-head">
        <h2>${escapeHTML(settings.storeName)}</h2>
        <p>Flower Shop Receipt</p>
        ${settings.storeAddress ? `<p>${escapeHTML(settings.storeAddress)}</p>` : ""}
        ${settings.storePhone ? `<p>${escapeHTML(settings.storePhone)}</p>` : ""}
        ${settings.storeEmail ? `<p>${escapeHTML(settings.storeEmail)}</p>` : ""}
      </div>

      <h3>Receipt Details</h3>
      <div class="receipt-line">
        <span>Receipt / Order No.</span>
        <strong>${escapeHTML(order.id)}</strong>
      </div>
      <div class="receipt-line">
        <span>Date</span>
        <strong>${formatDate(order.createdAt)}</strong>
      </div>
      <div class="receipt-line">
        <span>Customer</span>
        <strong>${escapeHTML(order.customerName)}</strong>
      </div>
      <div class="receipt-line">
        <span>Phone</span>
        <strong>${escapeHTML(order.phone)}</strong>
      </div>
      <div class="receipt-line">
        <span>Payment method</span>
        <strong>${escapeHTML(order.paymentMethod)}</strong>
      </div>
      <div class="receipt-line">
        <span>Payment status</span>
        <strong>${escapeHTML(order.paymentStatus || "Pending")}</strong>
      </div>

      <h3>Purchased Items</h3>
      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="receipt-line receipt-total">
        <span>Total Amount</span>
        <strong>${money(order.total)}</strong>
      </div>

      <p><b>Order status:</b> ${escapeHTML(order.status)}</p>
      <p style="text-align:center;margin-top:25px;">Thank you for shopping with us! 🌸</p>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function closeReceipt() {
  $("receiptModal").classList.add("hidden");
}

/* ADMIN NAVIGATION */

function adminTab(tab, button) {
  if (!isAdmin()) {
    alert("Admin access only.");
    showPage("auth");
    return;
  }

  const tabs = [
    "overview",
    "products",
    "orders",
    "users",
    "transactions",
    "settings"
  ];

  tabs.forEach(name => {
    $("admin" + name.charAt(0).toUpperCase() + name.slice(1))
      .classList.toggle("hidden", name !== tab);
  });

  document.querySelectorAll(".admin-tab").forEach(item => {
    item.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  } else {
    const index = tabs.indexOf(tab);
    document.querySelectorAll(".admin-tab")[index]?.classList.add("active");
  }

  if (tab === "overview") renderAdminOverview();
  if (tab === "products") renderAdminProducts();
  if (tab === "orders") renderAdminOrders();
  if (tab === "users") renderAdminUsers();
  if (tab === "transactions") renderAdminTransactions();
  if (tab === "settings") renderAdminSettings();
}

/* ADMIN OVERVIEW */

function renderAdminOverview() {
  const products = getProducts();
  const orders = getOrders();
  const users = getUsers();

  const revenue = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const pending = orders.filter(order => order.status === "Pending").length;
  const lowStock = products.filter(product => product.stock <= 5).length;

  $("adminOverview").innerHTML = `
    <div class="stat-grid">
      <div class="stat-card">
        <span>Total Products</span>
        <strong>${products.length}</strong>
      </div>
      <div class="stat-card">
        <span>Total Orders</span>
        <strong>${orders.length}</strong>
      </div>
      <div class="stat-card">
        <span>Registered Customers</span>
        <strong>${users.length}</strong>
      </div>
      <div class="stat-card">
        <span>Total Sales</span>
        <strong>${money(revenue)}</strong>
      </div>
      <div class="stat-card">
        <span>Pending Orders</span>
        <strong>${pending}</strong>
      </div>
      <div class="stat-card">
        <span>Low Stock Products</span>
        <strong>${lowStock}</strong>
      </div>
    </div>

    <div class="panel">
      <h3>Recent Orders</h3>
      ${orders.length ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${orders.slice(0, 5).map(order => `
                <tr>
                  <td>${escapeHTML(order.id)}</td>
                  <td>${escapeHTML(order.customerName)}</td>
                  <td>${money(order.total)}</td>
                  <td><span class="status ${statusClass(order.status)}">${escapeHTML(order.status)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `<p class="empty-state">No orders yet.</p>`}
    </div>
  `;
}

/* ADMIN PRODUCT MANAGEMENT */

function renderAdminProducts() {
  const products = getProducts();

  $("adminProducts").innerHTML = `
    <div class="section-heading">
      <div>
        <h3>Product Management</h3>
        <p class="muted">Add, edit, delete, and update product stock.</p>
      </div>
      <button class="btn primary" onclick="openProductEditor()">+ Add Product</button>
    </div>

    <div class="table-wrap panel">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td>
                <strong>${escapeHTML(product.name)}</strong><br>
                <small class="muted">${escapeHTML(product.description)}</small>
              </td>
              <td>${money(product.price)}</td>
              <td>${product.stock}</td>
              <td>
                <div class="admin-actions">
                  <button class="btn secondary" onclick="openProductEditor('${product.id}')">Edit</button>
                  <button class="btn danger" onclick="deleteProduct('${product.id}')">Delete</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openProductEditor(productId = "") {
  if (!isAdmin()) return;

  $("productForm").reset();
  $("editProductId").value = "";
  $("imagePreview").src = "";
  $("imagePreview").classList.add("hidden");
  $("productModalTitle").textContent = "Add Product";

  if (productId) {
    const product = getProducts().find(item => item.id === productId);
    if (!product) return;

    $("productModalTitle").textContent = "Edit Product";
    $("editProductId").value = product.id;
    $("productName").value = product.name;
    $("productDescription").value = product.description;
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;

    if (product.image) {
      $("imagePreview").src = product.image;
      $("imagePreview").classList.remove("hidden");
    }
  }

  $("productModal").classList.remove("hidden");
}

function closeProductEditor() {
  $("productModal").classList.add("hidden");
}

let selectedProductImage = "";

function previewProductImage(event) {
  const file = event.target.files?.[0];

  if (!file) {
    selectedProductImage = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Image must be 2 MB or smaller.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedProductImage = reader.result;
    $("imagePreview").src = reader.result;
    $("imagePreview").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function saveProduct(event) {
  event.preventDefault();

  if (!isAdmin()) return;

  const id = $("editProductId").value;
  const name = $("productName").value.trim();
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (!name || !description || !Number.isFinite(price) ||
      price <= 0 || !Number.isInteger(stock) || stock < 0) {
    alert("Please enter valid product details.");
    return;
  }

  const products = getProducts();

  const duplicate = products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    alert("A product with this name already exists.");
    return;
  }

  if (id) {
    const index = products.findIndex(product => product.id === id);
    if (index < 0) return;

    products[index] = {
      ...products[index],
      name,
      description,
      price,
      stock,
      image: selectedProductImage || products[index].image || ""
    };
  } else {
    products.push({
      id: makeId("P"),
      name,
      description,
      price,
      stock,
      image: selectedProductImage || "",
      emoji: "💐"
    });
  }

  setProducts(products);
  selectedProductImage = "";
  closeProductEditor();
  renderProducts();
  renderAdminProducts();

  alert("Product saved successfully.");
}

function deleteProduct(productId) {
  if (!isAdmin()) return;

  const products = getProducts();
  const product = products.find(item => item.id === productId);

  if (!product) return;

  const usedInOrders = getOrders().some(order =>
    order.items.some(item => item.productId === productId)
  );

  if (usedInOrders) {
    alert("This product is included in order history. You can set its stock to 0 instead of deleting it.");
    return;
  }

  if (!confirm("Delete " + product.name + "?")) return;

  setProducts(products.filter(item => item.id !== productId));
  renderProducts();
  renderAdminProducts();
}

/* ADMIN ORDERS */

function renderAdminOrders() {
  const orders = getOrders();

  $("adminOrders").innerHTML = `
    <h3>Customer Orders</h3>
    ${orders.length ? `
      <div class="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customerName)}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td>${money(order.total)}</td>
                <td><span class="status ${statusClass(order.status)}">${escapeHTML(order.status)}</span></td>
                <td>
                  <select onchange="updateOrderStatus('${order.id}', this.value)">
                    ${["Pending", "Processing", "Ready for Delivery", "Delivered", "Cancelled"].map(status => `
                      <option value="${status}" ${order.status === status ? "selected" : ""}>
                        ${status}
                      </option>
                    `).join("")}
                  </select>
                  <button class="btn secondary" onclick="showReceipt('${order.id}')">Receipt</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<p class="empty-state">No customer orders yet.</p>`}
  `;
}

function updateOrderStatus(orderId, newStatus) {
  if (!isAdmin()) return;

  const validStatuses = [
    "Pending",
    "Processing",
    "Ready for Delivery",
    "Delivered",
    "Cancelled"
  ];

  if (!validStatuses.includes(newStatus)) return;

  const orders = getOrders();
  const order = orders.find(item => item.id === orderId);

  if (!order) return;

  if (order.status === "Cancelled" && newStatus !== "Cancelled") {
    alert("A cancelled order cannot be reopened. Please create a new order.");
    renderAdminOrders();
    return;
  }

  if (newStatus === "Cancelled" && order.status !== "Cancelled") {
    if (!confirm("Cancel this order and return its items to inventory?")) {
      renderAdminOrders();
      return;
    }

    if (!order.stockRestored) {
      const products = getProducts();

      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) product.stock += item.quantity;
      });

      setProducts(products);
      order.stockRestored = true;
    }
  }

  order.status = newStatus;

  if (newStatus === "Delivered") {
    order.paymentStatus =
      order.paymentMethod === "Cash on Delivery" ? "Paid" : order.paymentStatus;
  }

  setOrders(orders);

  renderAdminOrders();
  renderProducts();
  renderAdminOverview();
  renderAdminProducts();
}

/* ADMIN USER MANAGEMENT */

function renderAdminUsers() {
  const users = getUsers();

  $("adminUsers").innerHTML = `
    <h3>User Management</h3>
    <p class="muted">View customer accounts and manage account access.</p>
    ${users.length ? `
      <div class="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Username</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Account</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.username)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                  <span class="status ${user.active === false ? "cancelled" : "delivered"}">
                    ${user.active === false ? "Disabled" : "Active"}
                  </span>
                </td>
                <td>
                  <button class="btn secondary"
                    onclick="toggleUserStatus('${user.id}')">
                    ${user.active === false ? "Enable" : "Disable"}
                  </button>
                  <button class="btn danger"
                    onclick="deleteUser('${user.id}')">
                    Delete
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<p class="empty-state">No registered customers yet.</p>`}
  `;
}

function toggleUserStatus(userId) {
  if (!isAdmin()) return;

  const users = getUsers();
  const user = users.find(item => item.id === userId);

  if (!user) return;

  user.active = user.active === false;
  setUsers(users);
  renderAdminUsers();
}

function deleteUser(userId) {
  if (!isAdmin()) return;

  const user = getUsers().find(item => item.id === userId);
  if (!user) return;

  const hasOrders = getOrders().some(order => order.customerId === userId);

  if (hasOrders) {
    alert("This customer has order history. Disable the account instead to preserve transaction records.");
    return;
  }

  if (!confirm("Permanently delete customer " + user.name + "?")) return;

  setUsers(getUsers().filter(item => item.id !== userId));
  renderAdminUsers();
  renderAdminOverview();
}

/* ADMIN TRANSACTIONS */

function renderAdminTransactions() {
  const orders = getOrders();

  const total = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const paid = orders
    .filter(order => order.paymentStatus === "Paid")
    .reduce((sum, order) => sum + Number(order.total), 0);

  $("adminTransactions").innerHTML = `
    <h3>Transactions & Receipts</h3>

    <div class="stat-grid">
      <div class="stat-card">
        <span>Total Transactions</span>
        <strong>${orders.length}</strong>
      </div>
      <div class="stat-card">
        <span>Order Value</span>
        <strong>${money(total)}</strong>
      </div>
      <div class="stat-card">
        <span>Paid Amount</span>
        <strong>${money(paid)}</strong>
      </div>
      <div class="stat-card">
        <span>Unpaid Orders</span>
        <strong>${orders.filter(order => order.paymentStatus !== "Paid" && order.status !== "Cancelled").length}</strong>
      </div>
    </div>

    ${orders.length ? `
      <div class="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>
                  <strong>${escapeHTML(order.id)}</strong><br>
                  <small class="muted">${formatDate(order.createdAt)}</small>
                </td>
                <td>${escapeHTML(order.customerName)}</td>
                <td>${escapeHTML(order.paymentMethod)}</td>
                <td>${money(order.total)}</td>
                <td><span class="status ${statusClass(order.status)}">${escapeHTML(order.status)}</span></td>
                <td>
                  <select onchange="updatePaymentStatus('${order.id}', this.value)"
                    ${order.status === "Cancelled" ? "disabled" : ""}>
                    <option value="Pending" ${order.paymentStatus === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="Paid" ${order.paymentStatus === "Paid" ? "selected" : ""}>Paid</option>
                  </select>
                </td>
                <td>
                  <button class="btn secondary" onclick="showReceipt('${order.id}')">
                    Print Receipt
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<p class="empty-state">No transactions yet.</p>`}
  `;
}

function updatePaymentStatus(orderId, paymentStatus) {
  if (!isAdmin()) return;

  if (!["Pending", "Paid"].includes(paymentStatus)) return;

  const orders = getOrders();
  const order = orders.find(item => item.id === orderId);

  if (!order || order.status === "Cancelled") return;

  order.paymentStatus = paymentStatus;
  setOrders(orders);

  renderAdminTransactions();
  renderAdminOverview();
}

/* ADMIN SETTINGS */

function renderAdminSettings() {
  const settings = getSettings();

  $("adminSettings").innerHTML = `
    <div class="panel">
      <h3>Store Settings</h3>
      <p class="muted">Update your store information displayed on receipts.</p>

      <form onsubmit="saveStoreSettings(event)">
        <label>Store name</label>
        <input id="settingStoreName" value="${escapeHTML(settings.storeName)}" required>

        <label>Store email</label>
        <input id="settingStoreEmail" type="email" value="${escapeHTML(settings.storeEmail)}">

        <label>Store phone</label>
        <input id="settingStorePhone" value="${escapeHTML(settings.storePhone)}">

        <label>Store address</label>
        <textarea id="settingStoreAddress" rows="3">${escapeHTML(settings.storeAddress)}</textarea>

        <button class="btn primary" type="submit">Save Store Settings</button>
      </form>
    </div>

    <div class="panel">
      <h3>Admin Account Settings</h3>
      <p class="muted">Change the administrator name, username, or password.</p>

      <form onsubmit="updateAdminAccount(event)">
        <label>Admin display name</label>
        <input id="settingAdminName" value="${escapeHTML(settings.adminName)}" required>

        <label>Admin username</label>
        <input id="settingAdminUsername" value="${escapeHTML(settings.adminUsername)}" required>

        <label>Current password</label>
        <input id="settingCurrentPassword" type="password" required>

        <label>New password</label>
        <input id="settingNewPassword" type="password" minlength="6" placeholder="Leave blank to keep current password">

        <label>Confirm new password</label>
        <input id="settingConfirmPassword" type="password" minlength="6">

        <button class="btn primary" type="submit">Update Admin Account</button>
      </form>
    </div>
  `;
}

function saveStoreSettings(event) {
  event.preventDefault();

  if (!isAdmin()) return;

  const settings = getSettings();

  settings.storeName = $("settingStoreName").value.trim();
  settings.storeEmail = $("settingStoreEmail").value.trim();
  settings.storePhone = $("settingStorePhone").value.trim();
  settings.storeAddress = $("settingStoreAddress").value.trim();

  if (!settings.storeName) {
    alert("Store name is required.");
    return;
  }

  setSettings(settings);
  alert("Store settings updated successfully.");
}

function updateAdminAccount(event) {
  event.preventDefault();

  if (!isAdmin()) return;

  const settings = getSettings();

  const name = $("settingAdminName").value.trim();
  const username = $("settingAdminUsername").value.trim();
  const currentPassword = $("settingCurrentPassword").value;
  const newPassword = $("settingNewPassword").value;
  const confirmPassword = $("settingConfirmPassword").value;

  if (currentPassword !== settings.adminPassword) {
    alert("Your current password is incorrect.");
    return;
  }

  if (!name || !username) {
    alert("Admin name and username are required.");
    return;
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    settings.adminPassword = newPassword;
  }

  settings.adminName = name;
  settings.adminUsername = username;

  setSettings(settings);

  setSession({
    id: "ADMIN",
    username,
    name,
    role: "admin"
  });

  alert("Admin account updated successfully.");
  renderAdminSettings();
  updateNavigation();
}

/* START WEBSITE */

document.addEventListener("DOMContentLoaded", initialize);
