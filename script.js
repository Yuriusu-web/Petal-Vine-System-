"use strict";

/* ==========================================
   PETAL & VINE FLOWER BOUTIQUE
   Connected front-end application
   Storage: browser localStorage
========================================== */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  cart: "pv_cart",
  session: "pv_session"
};

const $ = id => document.getElementById(id);

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = value => "₱" + Number(value || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

let users = read(STORAGE.users, []);
let products = read(STORAGE.products, []);
let orders = read(STORAGE.orders, []);
let cart = read(STORAGE.cart, []);
let currentUser = null;
let toastTimer;

/* -------------------- INITIAL DATA -------------------- */

function initializeData() {
  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: "admin-" + Date.now(),
      name: "Administrator",
      username: "admin",
      password: "Admin123",
      role: "admin",
      phone: "",
      address: ""
    });
    save(STORAGE.users, users);
  }

  if (!products.length) {
    products = [
      { id: "p1", name: "Classic Red Roses", category: "Rose", description: "A timeless bouquet of beautiful red roses.", price: 850, stock: 20, image: "🌹" },
      { id: "p2", name: "Pink Tulip Bouquet", category: "Tulip", description: "Soft pink tulips for a sweet surprise.", price: 950, stock: 15, image: "🌷" },
      { id: "p3", name: "Sunny Sunflowers", category: "Sunflower", description: "Bright sunflowers to make someone smile.", price: 700, stock: 18, image: "🌻" },
      { id: "p4", name: "Pastel Garden Mix", category: "Mixed Bouquet", description: "A lovely mix of seasonal pastel flowers.", price: 1200, stock: 12, image: "💐" },
      { id: "p5", name: "White Rose Elegance", category: "Rose", description: "Elegant white roses for meaningful moments.", price: 1000, stock: 10, image: "🤍" },
      { id: "p6", name: "Sweet Daisy Bundle", category: "Other", description: "Fresh and cheerful daisies in a bundle.", price: 650, stock: 16, image: "🌼" }
    ];
    save(STORAGE.products, products);
  }

  save(STORAGE.users, users);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);
  save(STORAGE.cart, cart);
}

/* -------------------- GENERAL HELPERS -------------------- */

function showToast(message, isError = false) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function refreshData() {
  users = read(STORAGE.users, []);
  products = read(STORAGE.products, []);
  orders = read(STORAGE.orders, []);
  cart = read(STORAGE.cart, []);
}

function persistAll() {
  save(STORAGE.users, users);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);
  save(STORAGE.cart, cart);
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function makeId(prefix = "id") {
  return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

function imageMarkup(image, className = "") {
  const value = String(image || "💐").trim();

  if (/^https?:\/\//i.test(value) || value.startsWith("data:image/")) {
    return `<img class="${className}" src="${escapeHTML(value)}" alt="Flower product" onerror="this.style.display='none';this.parentElement.textContent='💐'">`;
  }

  return `<span class="${className}">${escapeHTML(value)}</span>`;
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function findProduct(id) {
  return products.find(product => product.id === id);
}

function findUser(id) {
  return users.find(user => user.id === id);
}

function saveCart() {
  save(STORAGE.cart, cart);
  updateCartCount();
}

/* -------------------- AUTHENTICATION -------------------- */

function showRegister() {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");
  $("authTitle").textContent = "Create Account";
  $("authSubtitle").textContent = "Join Petal & Vine today.";
  $("registerMessage").textContent = "";
}

function showLogin() {
  $("registerForm").classList.add("hidden");
  $("loginForm").classList.remove("hidden");
  $("authTitle").textContent = "Welcome Back";
  $("authSubtitle").textContent = "Sign in to continue.";
  $("loginMessage").textContent = "";
}

function showApplication() {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent = currentUser.name;
  $("welcomeText").textContent = currentUser.name;
  $("roleLabel").textContent = isAdmin() ? "Administrator" : "Customer";

  $("customerNav").classList.toggle("hidden", isAdmin());
  $("adminNav").classList.toggle("hidden", !isAdmin());

  if (isAdmin()) {
    adminPage("dashboard", document.querySelector("#adminNav .nav-link"));
  } else {
    customerPage("shop", document.querySelector("#customerNav .nav-link"));
  }
}

function restoreSession() {
  refreshData();
  const sessionId = read(STORAGE.session, null);

  if (sessionId) {
    currentUser = findUser(sessionId);
    if (currentUser) {
      showApplication();
      return;
    }
  }

  currentUser = null;
  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  showLogin();
}

function registerUser(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (!name || !username || !password) {
    $("registerMessage").textContent = "Please complete all required fields.";
    return;
  }

  if (username.length < 3) {
    $("registerMessage").textContent = "Username must contain at least 3 characters.";
    return;
  }

  if (password.length < 6) {
    $("registerMessage").textContent = "Password must contain at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerMessage").textContent = "Passwords do not match.";
    return;
  }

  refreshData();

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    $("registerMessage").textContent = "That username is already taken.";
    return;
  }

  const newUser = {
    id: makeId("user"),
    name,
    username,
    password,
    role: "customer",
    phone: "",
    address: ""
  };

  users.push(newUser);
  save(STORAGE.users, users);

  $("registerForm").reset();
  showLogin();
  $("loginUsername").value = username;
  showToast("Account created successfully. Please log in.");
}

function loginUser(event) {
  event.preventDefault();
  refreshData();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(item =>
    item.username.toLowerCase() === username &&
    item.password === password
  );

  if (!user) {
    $("loginMessage").textContent = "Incorrect username or password.";
    return;
  }

  currentUser = user;
  save(STORAGE.session, user.id);
  $("loginForm").reset();
  $("loginMessage").textContent = "";
  cart = read(STORAGE.cart, []);
  showApplication();
  showToast("Welcome to Petal & Vine!");
}

function logout() {
  localStorage.removeItem(STORAGE.session);
  currentUser = null;
  cart = [];
  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("loginForm").reset();
  $("registerForm").reset();
  showLogin();
  showToast("You have logged out.");
}

/* -------------------- NAVIGATION -------------------- */

function setPage(pageId, navButton, title) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  const page = $(pageId);
  if (page) page.classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(button => button.classList.remove("active"));
  if (navButton) navButton.classList.add("active");

  $("pageTitle").textContent = title;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function customerPage(page, button) {
  if (!currentUser || isAdmin()) return;

  const titles = {
    shop: "Shop Flowers",
    cart: "My Cart",
    orders: "My Orders",
    receipts: "My Receipts",
    transactions: "Transactions",
    profile: "My Profile",
    about: "About Us"
  };

  if (!titles[page]) return;
  setPage("customer-" + page, button, titles[page]);

  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "orders") renderCustomerOrders();
  if (page === "receipts") renderCustomerReceipts();
  if (page === "transactions") renderCustomerTransactions();
  if (page === "profile") loadProfile();
}

function adminPage(page, button) {
  if (!isAdmin()) return;

  const titles = {
    dashboard: "Dashboard",
    products: "Products",
    inventory: "Inventory",
    orders: "Orders",
    users: "Customers",
    settings: "Settings"
  };

  if (!titles[page]) return;
  setPage("admin-" + page, button, titles[page]);

  if (page === "dashboard") renderDashboard();
  if (page === "products") renderAdminProducts();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderAdminOrders();
  if (page === "users") renderAdminUsers();
  if (page === "settings") loadSettings();
}

function goHome() {
  if (isAdmin()) {
    adminPage("dashboard", document.querySelector("#adminNav .nav-link"));
  } else if (currentUser) {
    customerPage("shop", document.querySelector("#customerNav .nav-link"));
  }
}

/* -------------------- SHOP PRODUCTS -------------------- */

function renderShop() {
  refreshData();

  const search = ($("productSearch").value || "").toLowerCase();
  const available = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search) ||
    (product.description || "").toLowerCase().includes(search)
  );

  if (!available.length) {
    $("shopProducts").innerHTML = `<div class="empty-state"><strong>No flowers found</strong>Try another search.</div>`;
    return;
  }

  $("shopProducts").innerHTML = available.map(product => `
    <article class="product-card">
      <div class="product-image">${imageMarkup(product.image)}</div>
      <div class="product-info">
        <span class="eyebrow">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "Beautiful flowers for every occasion.")}</p>
        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="stock">${Number(product.stock)} available</span>
        </div>
        <div class="quantity-row">
          <input id="qty-${escapeHTML(product.id)}" type="number" min="1" max="${Number(product.stock)}" value="1" aria-label="Quantity">
          <button class="btn btn-primary" ${product.stock <= 0 ? "disabled" : ""} onclick="addToCart('${escapeHTML(product.id)}')">Add to Cart</button>
        </div>
        <button class="btn btn-outline full" ${product.stock <= 0 ? "disabled" : ""} onclick="buyNow('${escapeHTML(product.id)}')">Buy Now</button>
      </div>
    </article>
  `).join("");
}

function getRequestedQuantity(id) {
  const field = $("qty-" + id);
  const quantity = Number(field?.value || 1);

  if (!Number.isInteger(quantity) || quantity < 1) {
    showToast("Please enter a valid quantity.", true);
    return 0;
  }

  return quantity;
}

function addToCart(id) {
  refreshData();
  const product = findProduct(id);
  if (!product) return showToast("Product not found.", true);

  const quantity = getRequestedQuantity(id);
  if (!quantity) return;

  const existing = cart.find(item => item.productId === id);
  const newQuantity = quantity + (existing ? existing.quantity : 0);

  if (newQuantity > product.stock) {
    return showToast("Not enough stock available.", true);
  }

  if (existing) existing.quantity = newQuantity;
  else cart.push({ productId: id, quantity });

  saveCart();
  showToast("Added to your cart.");
}

function buyNow(id) {
  refreshData();
  const product = findProduct(id);
  if (!product) return showToast("Product not found.", true);

  const quantity = getRequestedQuantity(id);
  if (!quantity) return;
  if (quantity > product.stock) return showToast("Not enough stock available.", true);

  cart = [{ productId: id, quantity }];
  saveCart();
  openCheckout();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  $("cartCount").textContent = count;
}

/* -------------------- CART -------------------- */

function cartDetails() {
  return cart.map(item => {
    const product = findProduct(item.productId);
    if (!product) return null;

    return {
      ...item,
      product,
      subtotal: product.price * item.quantity
    };
  }).filter(Boolean);
}

function renderCart() {
  refreshData();
  updateCartCount();

  const items = cartDetails();

  if (!items.length) {
    $("cartContent").innerHTML = `
      <div class="empty-state">
        <strong>Your cart is empty.</strong>
        Browse our flower collection and add something lovely.
        <br><br><button class="btn btn-primary" onclick="customerPage('shop',document.querySelector('#customerNav .nav-link'))">Continue Shopping</button>
      </div>`;
    return;
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  $("cartContent").innerHTML = `
    <div class="cart-layout">
      <div>
        ${items.map(item => `
          <div class="cart-item">
            <div class="cart-thumb">${imageMarkup(item.product.image)}</div>
            <div class="cart-detail">
              <strong>${escapeHTML(item.product.name)}</strong>
              <small>${money(item.product.price)} each</small>
              <div class="price">${money(item.subtotal)}</div>
            </div>
            <input aria-label="Quantity" type="number" min="1" max="${Number(item.product.stock)}" value="${item.quantity}" onchange="changeCartQuantity('${escapeHTML(item.productId)}',this.value)">
            <button class="btn-danger" onclick="removeFromCart('${escapeHTML(item.productId)}')">Remove</button>
          </div>
        `).join("")}
        <button class="btn-soft" onclick="clearCart()">Clear Cart</button>
      </div>
      <aside class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-line"><span>Items</span><strong>${items.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
        <div class="summary-line summary-total"><span>Total</span><strong>${money(total)}</strong></div>
        <button class="btn btn-primary full" onclick="openCheckout()">Proceed to Checkout</button>
      </aside>
    </div>`;
}

function changeCartQuantity(id, value) {
  refreshData();

  const quantity = Number(value);
  const item = cart.find(entry => entry.productId === id);
  const product = findProduct(id);

  if (!item || !product) return;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    showToast("Enter a valid quantity within available stock.", true);
    renderCart();
    return;
  }

  item.quantity = quantity;
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.productId !== id);
  saveCart();
  renderCart();
  showToast("Item removed from cart.");
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
  showToast("Your cart has been cleared.");
}

/* -------------------- CHECKOUT AND ORDERS -------------------- */

function openCheckout() {
  refreshData();
  const items = cartDetails();

  if (!items.length) return showToast("Your cart is empty.", true);

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      return showToast(`Insufficient stock for ${item.product.name}.`, true);
    }
  }

  $("checkoutName").value = currentUser.name || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  $("checkoutSummary").innerHTML = `
    <div class="payment-note">
      ${items.map(item => `<div class="summary-line"><span>${escapeHTML(item.product.name)} × ${item.quantity}</span><strong>${money(item.subtotal)}</strong></div>`).join("")}
      <div class="summary-line summary-total"><span>Total to pay</span><strong>${money(total)}</strong></div>
    </div>`;

  $("checkoutModal").classList.remove("hidden");
}

function placeOrder(event) {
  event.preventDefault();
  refreshData();

  if (!currentUser || isAdmin()) return;

  const items = cartDetails();
  if (!items.length) return showToast("Your cart is empty.", true);

  for (const item of items) {
    const product = findProduct(item.productId);
    if (!product || item.quantity > product.stock) {
      return showToast(`Not enough stock for ${item.product.name}. Please update your cart.`, true);
    }
  }

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (!name || !phone || !address) {
    return showToast("Please complete your delivery details.", true);
  }

  const orderItems = items.map(item => ({
    productId: item.productId,
    name: item.product.name,
    price: Number(item.product.price),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
    image: item.product.image
  }));

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: makeId("order"),
    userId: currentUser.id,
    customerName: name,
    username: currentUser.username,
    phone,
    address,
    items: orderItems,
    total,
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  // Deduct stock only after validating all products.
  orderItems.forEach(item => {
    const product = findProduct(item.productId);
    product.stock -= item.quantity;
  });

  orders.push(order);

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.address = address;

  users = users.map(user => user.id === currentUser.id ? currentUser : user);

  cart = [];
  persistAll();

  // Refresh the active account from saved data.
  refreshData();
  currentUser = findUser(order.userId);

  $("checkoutForm").reset();
  closeModal("checkoutModal");
  updateCartCount();

  showReceipt(order);
  showToast("Your order has been placed successfully!");
}

/* -------------------- CUSTOMER ORDER VIEWS -------------------- */

function customerOrders() {
  return orders
    .filter(order => order.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function statusMarkup(status) {
  const safe = escapeHTML(status || "Pending");
  const css = String(status || "").toLowerCase();
  return `<span class="status ${css}">${safe}</span>`;
}

function renderCustomerOrders() {
  refreshData();
  const list = customerOrders();

  if (!list.length) {
    $("customerOrders").innerHTML = `<div class="empty-state"><strong>No orders yet.</strong>Your purchases will appear here.</div>`;
    return;
  }

  $("customerOrders").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${list.map(order => `
      <tr>
        <td>${escapeHTML(order.id)}</td>
        <td>${formatDate(order.createdAt)}</td>
        <td>${money(order.total)}</td>
        <td>${statusMarkup(order.status)}</td>
        <td><button class="btn-soft" onclick="viewReceipt('${escapeHTML(order.id)}')">View Receipt</button></td>
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function renderCustomerReceipts() {
  refreshData();
  const list = customerOrders();

  if (!list.length) {
    $("customerReceipts").innerHTML = `<div class="empty-state"><strong>No receipts available.</strong>Receipts appear after you place an order.</div>`;
    return;
  }

  $("customerReceipts").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Payment</th><th></th></tr></thead>
    <tbody>${list.map(order => `
      <tr><td>${escapeHTML(order.id)}</td><td>${formatDate(order.createdAt)}</td>
      <td>${money(order.total)}</td><td>${escapeHTML(order.paymentMethod)}</td>
      <td><button class="btn-soft" onclick="viewReceipt('${escapeHTML(order.id)}')">Open</button></td></tr>`).join("")}</tbody>
  </table></div>`;
}

function renderCustomerTransactions() {
  refreshData();
  const list = customerOrders();
  const total = list.reduce((sum, order) => sum + Number(order.total), 0);

  $("customerTransactions").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><span>Total Orders</span><strong>${list.length}</strong></div>
      <div class="stat-card"><span>Total Purchase Value</span><strong>${money(total)}</strong></div>
    </div>
    ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Payment Method</th><th>Payment Status</th><th>Amount</th></tr></thead><tbody>
    ${list.map(order => `<tr><td>${escapeHTML(order.id)}</td><td>${formatDate(order.createdAt)}</td><td>${escapeHTML(order.paymentMethod)}</td><td>${escapeHTML(order.paymentStatus)}</td><td>${money(order.total)}</td></tr>`).join("")}
    </tbody></table></div>` : `<div class="empty-state">No transactions yet.</div>`}`;
}

/* -------------------- RECEIPTS -------------------- */

function receiptHTML(order) {
  return `
    <div class="receipt">
      <div class="receipt-head">
        <div class="brand-mark">✿</div>
        <h2>Petal & Vine</h2>
        <p>Flower Boutique · Order Receipt</p>
      </div>
      <hr>
      <p><strong>Order ID:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <hr>
      <h3>Order Items</h3>
      ${order.items.map(item => `
        <div class="summary-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>`).join("")}
      <hr>
      <div class="summary-line summary-total"><span>Total</span><strong>${money(order.total)}</strong></div>
      <p><strong>Payment:</strong> ${escapeHTML(order.paymentMethod)}</p>
      <p><strong>Payment status:</strong> ${escapeHTML(order.paymentStatus)}</p>
      <p><strong>Order status:</strong> ${escapeHTML(order.status)}</p>
      <p class="receipt-head">Thank you for choosing Petal & Vine!</p>
    </div>`;
}

function showReceipt(order) {
  $("receiptContent").innerHTML = receiptHTML(order);
  $("receiptModal").classList.remove("hidden");
}

function viewReceipt(orderId) {
  refreshData();
  const order = orders.find(item => item.id === orderId);

  if (!order) return showToast("Order not found.", true);
  if (!isAdmin() && order.userId !== currentUser.id) {
    return showToast("You cannot view this receipt.", true);
  }

  showReceipt(order);
}

/* -------------------- CUSTOMER PROFILE -------------------- */

function loadProfile() {
  refreshData();
  currentUser = findUser(currentUser.id);

  $("profileName").value = currentUser.name || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";
  $("profilePassword").value = "";
  $("profileMessage").textContent = "";
}

function updateProfile(event) {
  event.preventDefault();
  refreshData();

  const name = $("profileName").value.trim();
  const username = $("profileUsername").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  const password = $("profilePassword").value;

  if (!name || !username) {
    $("profileMessage").textContent = "Name and username are required.";
    return;
  }

  if (password && password.length < 6) {
    $("profileMessage").textContent = "Password must contain at least 6 characters.";
    return;
  }

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("profileMessage").textContent = "That username is already taken.";
    return;
  }

  currentUser.name = name;
  currentUser.username = username;
  currentUser.phone = phone;
  currentUser.address = address;
  if (password) currentUser.password = password;

  users = users.map(user => user.id === currentUser.id ? currentUser : user);
  save(STORAGE.users, users);

  $("headerUser").textContent = name;
  $("welcomeText").textContent = name;
  $("profilePassword").value = "";
  $("profileMessage").textContent = "Profile updated successfully.";
  showToast("Your profile has been updated.");
}

/* -------------------- ADMIN DASHBOARD -------------------- */

function renderDashboard() {
  refreshData();

  const customers = users.filter(user => user.role === "customer");
  const pending = orders.filter(order => order.status === "Pending").length;
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const stockCount = products.reduce((sum, product) => sum + Number(product.stock), 0);

  $("dashboardStats").innerHTML = `
    <div class="stat-card"><span>Total Products</span><strong>${products.length}</strong></div>
    <div class="stat-card"><span>Customers</span><strong>${customers.length}</strong></div>
    <div class="stat-card"><span>Total Orders</span><strong>${orders.length}</strong></div>
    <div class="stat-card"><span>Pending Orders</span><strong>${pending}</strong></div>
    <div class="stat-card"><span>Items in Stock</span><strong>${stockCount}</strong></div>
    <div class="stat-card"><span>Order Value</span><strong>${money(revenue)}</strong></div>`;

  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  $("recentOrders").innerHTML = recent.length
    ? `<div class="table-wrap"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>
      ${recent.map(order => `<tr><td>${escapeHTML(order.id)}</td><td>${escapeHTML(order.customerName)}</td><td>${formatDate(order.createdAt)}</td><td>${money(order.total)}</td><td>${statusMarkup(order.status)}</td></tr>`).join("")}
      </tbody></table></div>`
    : `<div class="empty-state">No orders have been placed yet.</div>`;
}

/* -------------------- ADMIN PRODUCT MANAGEMENT -------------------- */

function renderAdminProducts() {
  refreshData();
  const search = ($("adminProductSearch").value || "").toLowerCase();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  $("adminProducts").innerHTML = list.length ? list.map(product => `
    <div class="admin-item">
      <div class="admin-item-main">
        <div class="cart-thumb">${imageMarkup(product.image)}</div>
        <div class="cart-detail">
          <strong>${escapeHTML(product.name)}</strong>
          <small>${escapeHTML(product.category)} · ${money(product.price)} · Stock: ${product.stock}</small>
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn-soft" onclick="editProduct('${escapeHTML(product.id)}')">Edit</button>
        <button class="btn-danger" onclick="deleteProduct('${escapeHTML(product.id)}')">Delete</button>
      </div>
    </div>`).join("") : `<div class="empty-state">No products found.</div>`;
}

function openProductModal() {
  if (!isAdmin()) return;

  $("productForm").reset();
  $("productId").value = "";
  $("productModalTitle").textContent = "Add Product";
  $("productImagePreview").classList.add("hidden");
  $("productModal").classList.remove("hidden");
}

function editProduct(id) {
  refreshData();
  const product = findProduct(id);
  if (!product) return;

  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productDescription").value = product.description || "";
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productImage").value = product.image || "";
  $("productImageFile").value = "";

  const preview = $("productImagePreview");
  const image = product.image || "";

  if (/^https?:\/\//i.test(image) || image.startsWith("data:image/")) {
    preview.src = image;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }

  $("productModalTitle").textContent = "Edit Product";
  $("productModal").classList.remove("hidden");
}

function saveProduct(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  refreshData();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const image = $("productImage").value.trim() || "💐";

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return showToast("Please enter valid product information.", true);
  }

  const existing = id ? findProduct(id) : null;

  const product = {
    id: id || makeId("product"),
    name,
    category,
    description,
    price,
    stock,
    image: existing?.image || image
  };

  if (id) {
    products = products.map(item => item.id === id ? product : item);
  } else {
    products.push(product);
  }

  save(STORAGE.products, products);
  closeModal("productModal");
  renderAdminProducts();
  showToast(id ? "Product updated." : "Product added.");
}

function deleteProduct(id) {
  if (!isAdmin()) return;

  refreshData();
  const product = findProduct(id);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"?`)) return;

  products = products.filter(item => item.id !== id);
  cart = cart.filter(item => item.productId !== id);

  persistAll();
  renderAdminProducts();
  showToast("Product deleted.");
}

/* -------------------- ADMIN INVENTORY -------------------- */

function renderInventory() {
  refreshData();

  if (!products.length) {
    $("inventoryList").innerHTML = `<div class="empty-state">No products in inventory.</div>`;
    return;
  }

  $("inventoryList").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Available Stock</th><th>Stock Status</th></tr></thead>
    <tbody>${products.map(product => {
      const low = Number(product.stock) <= 5;
      return `<tr>
        <td>${escapeHTML(product.name)}</td>
        <td>${escapeHTML(product.category)}</td>
        <td>${money(product.price)}</td>
        <td>${product.stock}</td>
        <td>${low ? '<span class="status cancelled">Low stock</span>' : '<span class="status delivered">In stock</span>'}</td>
      </tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

/* -------------------- ADMIN ORDER MANAGEMENT -------------------- */

function renderAdminOrders() {
  refreshData();
  const list = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!list.length) {
    $("adminOrders").innerHTML = `<div class="empty-state">No customer orders yet.</div>`;
    return;
  }

  $("adminOrders").innerHTML = list.map(order => `
    <div class="admin-item">
      <div class="admin-item-main">
        <div class="cart-thumb">🛍</div>
        <div class="cart-detail">
          <strong>${escapeHTML(order.customerName)} · ${money(order.total)}</strong>
          <small>${escapeHTML(order.id)} · ${formatDate(order.createdAt)}</small>
          <small>${order.items.map(item => `${escapeHTML(item.name)} × ${item.quantity}`).join(", ")}</small>
          <small>Delivery: ${escapeHTML(order.address)} · ${escapeHTML(order.phone)}</small>
          <small>Status: ${statusMarkup(order.status)} · Payment: ${escapeHTML(order.paymentStatus)}</small>
        </div>
      </div>
      <div class="admin-actions">
        <select aria-label="Order status" onchange="updateOrderStatus('${escapeHTML(order.id)}',this.value)">
          ${["Pending", "Processing", "Ready", "Delivered", "Cancelled"].map(status =>
            `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
          ).join("")}
        </select>
        <button class="btn-soft" onclick="viewReceipt('${escapeHTML(order.id)}')">Receipt</button>
      </div>
    </div>`).join("");
}

function updateOrderStatus(id, status) {
  if (!isAdmin()) return;

  refreshData();
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const previous = order.status;

  // Restore inventory if an order is cancelled for the first time.
  if (status === "Cancelled" && previous !== "Cancelled") {
    order.items.forEach(item => {
      const product = findProduct(item.productId);
      if (product) product.stock += Number(item.quantity);
    });
  }

  // Deduct inventory again if a cancelled order is reactivated.
  if (previous === "Cancelled" && status !== "Cancelled") {
    for (const item of order.items) {
      const product = findProduct(item.productId);
      if (!product || product.stock < item.quantity) {
        renderAdminOrders();
        return showToast("Cannot reactivate: insufficient stock.", true);
      }
    }

    order.items.forEach(item => {
      const product = findProduct(item.productId);
      product.stock -= Number(item.quantity);
    });
  }

  order.status = status;
  if (status === "Delivered") order.paymentStatus = "Paid";
  if (status === "Cancelled") order.paymentStatus = "Cancelled";

  persistAll();
  renderAdminOrders();
  showToast("Order status updated.");
}

/* -------------------- ADMIN CUSTOMER MANAGEMENT -------------------- */

function renderAdminUsers() {
  refreshData();
  const customers = users.filter(user => user.role === "customer");

  if (!customers.length) {
    $("adminUsers").innerHTML = `<div class="empty-state">No registered customers yet.</div>`;
    return;
  }

  $("adminUsers").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Username</th><th>Phone</th><th>Orders</th><th>Action</th></tr></thead>
    <tbody>${customers.map(user => `
      <tr>
        <td>${escapeHTML(user.name)}</td>
        <td>${escapeHTML(user.username)}</td>
        <td>${escapeHTML(user.phone || "—")}</td>
        <td>${orders.filter(order => order.userId === user.id).length}</td>
        <td><button class="btn-danger" onclick="deleteCustomer('${escapeHTML(user.id)}')">Delete</button></td>
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function deleteCustomer(id) {
  if (!isAdmin()) return;

  refreshData();
  const customer = findUser(id);
  if (!customer || customer.role !== "customer") return;

  if (!confirm(`Delete customer account "${customer.username}"? Their existing order records will be retained.`)) return;

  users = users.filter(user => user.id !== id);
  persistAll();
  renderAdminUsers();
  showToast("Customer account deleted.");
}

/* -------------------- ADMIN SETTINGS -------------------- */

function loadSettings() {
  refreshData();
  currentUser = findUser(currentUser.id);

  $("settingsUsername").value = currentUser.username;
  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  $("settingsMessage").textContent = "";
}

function updateSettings(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  refreshData();

  const username = $("settingsUsername").value.trim();
  const password = $("settingsPassword").value;
  const confirmPassword = $("settingsConfirm").value;

  if (!username) {
    $("settingsMessage").textContent = "Username is required.";
    return;
  }

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("settingsMessage").textContent = "That username is already in use.";
    return;
  }

  if (password || confirmPassword) {
    if (password.length < 6) {
      $("settingsMessage").textContent = "Password must contain at least 6 characters.";
      return;
    }

    if (password !== confirmPassword) {
      $("settingsMessage").textContent = "Passwords do not match.";
      return;
    }
  }

  currentUser.username = username;
  if (password) currentUser.password = password;

  users = users.map(user => user.id === currentUser.id ? currentUser : user);
  save(STORAGE.users, users);

  $("headerUser").textContent = currentUser.name;
  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  $("settingsMessage").textContent = "Admin settings updated successfully.";
  showToast("Settings saved.");
}

/* -------------------- MODALS -------------------- */

function closeModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add("hidden");
}

/* -------------------- IMAGE UPLOAD -------------------- */

function previewProductImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose a valid image file.", true);
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const imageData = reader.result;
    $("productImage").value = imageData;
    $("productImagePreview").src = imageData;
    $("productImagePreview").classList.remove("hidden");
  };

  reader.onerror = () => showToast("Unable to read the selected image.", true);
  reader.readAsDataURL(file);
}

/* -------------------- PASSWORD VISIBILITY -------------------- */

function togglePassword(button) {
  const input = $(button.dataset.target);
  if (!input) return;

  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  button.textContent = showing ? "Show" : "Hide";
}

/* -------------------- EVENT LISTENERS -------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initializeData();

  $("loginForm").addEventListener("submit", loginUser);
  $("registerForm").addEventListener("submit", registerUser);
  $("profileForm").addEventListener("submit", updateProfile);
  $("productForm").addEventListener("submit", saveProduct);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("settingsForm").addEventListener("submit", updateSettings);

  $("logoutButton").addEventListener("click", logout);
  $("productSearch").addEventListener("input", renderShop);
  $("adminProductSearch").addEventListener("input", renderAdminProducts);

  $("productImageFile").addEventListener("change", previewProductImage);

  document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => togglePassword(button));
  });

  // Close a modal when clicking its dark background.
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) modal.classList.add("hidden");
    });
  });

  restoreSession();
});
