"use strict";

/* Petal & Vine - browser-based demonstration app.
   Data is stored in this browser's localStorage. */

const $ = (id) => document.getElementById(id);

const DB = {
  users: "petal_vine_users",
  products: "petal_vine_products",
  orders: "petal_vine_orders"
};

const ADMIN_DEFAULT = {
  username: "admin",
  password: "Admin123",
  displayName: "Administrator"
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn("Could not read saved data:", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    alert("Unable to save data. Check your browser storage.");
    return false;
  }
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

let adminSettings = read("petal_vine_admin_settings", ADMIN_DEFAULT);

if (!adminSettings || !adminSettings.username || !adminSettings.password) {
  adminSettings = { ...ADMIN_DEFAULT };
  save("petal_vine_admin_settings", adminSettings);
}

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Red Rose", category: "Roses", emoji: "🌹", price: 80, stock: 50 },
  { id: 2, name: "Sunflower", category: "Sunflowers", emoji: "🌻", price: 120, stock: 30 },
  { id: 3, name: "Pink Tulip", category: "Tulips", emoji: "🌷", price: 150, stock: 25 },
  { id: 4, name: "Mixed Flower Bouquet", category: "Bouquets", emoji: "💐", price: 550, stock: 15 },
  { id: 5, name: "White Lily", category: "Lilies", emoji: "💮", price: 180, stock: 20 },
  { id: 6, name: "Flower Gift Box", category: "Gifts", emoji: "🎁", price: 350, stock: 12 },
  { id: 7, name: "Mini Rose Bouquet", category: "Bouquets", emoji: "🌸", price: 250, stock: 20 },
  { id: 8, name: "Indoor Potted Plant", category: "Other", emoji: "🪴", price: 299, stock: 10 },
  { id: 9, name: "Purple Orchid", category: "Other", emoji: "🪻", price: 420, stock: 8 },
  { id: 10, name: "Pink Carnation Bundle", category: "Bouquets", emoji: "🌺", price: 320, stock: 18 }
];

let users = read(DB.users, []);
let products = read(DB.products, DEFAULT_PRODUCTS);
let orders = read(DB.orders, []);
let currentUser = null;
let currentRole = null;
let selectedAuth = "";
let toastTimer = null;

let nextProductId = Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1;
let nextOrderId = Math.max(1000, ...orders.map(o => Number(o.id) || 0)) + 1;

const existingProductIds = new Set(products.map(product => Number(product.id)));
let addedStarterProducts = false;

DEFAULT_PRODUCTS.forEach(starter => {
  if (!existingProductIds.has(starter.id)) {
    products.push({ ...starter });
    addedStarterProducts = true;
  }
});

if (addedStarterProducts || read(DB.products, null) === null) {
  save(DB.products, products);
}

/* AUTHENTICATION */

function showAuth(type) {
  selectedAuth = type;

  $("authChoices").classList.add("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  if (type === "register") {
    $("registerForm").classList.remove("hidden");
  } else {
    $("loginForm").classList.remove("hidden");
    $("loginTitle").textContent =
      type === "admin" ? "👑 Admin Login" : "👤 Customer Login";
    $("loginError").textContent = "";
  }
}

function backToChoices() {
  $("authChoices").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  $("loginForm").reset();
  $("registerForm").reset();

  $("loginError").textContent = "";
  $("registerError").textContent = "";

  selectedAuth = "";
}

function togglePassword(id, button) {
  const input = $(id);
  const isPassword = input.type === "password";

  input.type = isPassword ? "text" : "password";
  button.textContent = isPassword ? "🙈" : "👁️";
  button.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password"
  );
}

/* CUSTOMER REGISTRATION */

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const fullName = $("regFullName").value.trim();
  const username = $("regUsername").value.trim();
  const password = $("regPassword").value;
  const confirm = $("regConfirm").value;

  $("registerError").textContent = "";

  if (fullName.length < 2) {
    $("registerError").textContent = "Please enter your full name.";
    return;
  }

  if (username.length < 3) {
    $("registerError").textContent =
      "Username must have at least 3 characters.";
    return;
  }

  if (username.toLowerCase() === adminSettings.username.toLowerCase()) {
    $("registerError").textContent = "That username is reserved.";
    return;
  }

  if (password.length < 6) {
    $("registerError").textContent =
      "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerError").textContent = "Passwords do not match.";
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("registerError").textContent = "Username already exists.";
    return;
  }

  const newUser = {
    id: Date.now(),
    fullName,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString(),
    lastLogin: null,
    active: true
  };

  users.push(newUser);

  if (!save(DB.users, users)) {
    users.pop();
    return;
  }

  alert("Account created successfully! You can now log in.");

  $("registerForm").reset();
  backToChoices();
  showAuth("customer");
});

/* CUSTOMER AND ADMIN LOGIN */

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;

  $("loginError").textContent = "";

  if (
    username.toLowerCase() === adminSettings.username.toLowerCase() &&
    password === adminSettings.password
  ) {
    currentUser = {
      id: "admin",
      fullName: adminSettings.displayName,
      username: adminSettings.username
    };

    currentRole = "admin";
    enterApp();
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    $("loginError").textContent = "Incorrect username or password.";
    return;
  }

  if (user.active === false) {
    $("loginError").textContent =
      "This account is disabled. Please contact the shop administrator.";
    return;
  }

  user.lastLogin = new Date().toISOString();
  user.active = user.active !== false;

  save(DB.users, users);

  currentUser = user;
  currentRole = "customer";

  enterApp();
});

/* APPLICATION NAVIGATION */

const adminPages = [
  ["dashboard", "🏠 Dashboard"],
  ["inventory", "🌸 Inventory"],
  ["orders", "📦 All Orders"],
  ["customers", "👥 User Management"],
  ["reports", "📊 Reports"],
  ["receipts", "🧾 Receipts"],
  ["settings", "⚙️ Settings"],
  ["about", "ℹ️ About"]
];

const customerPages = [
  ["dashboard", "🏠 Home"],
  ["shop", "🌷 Shop Flowers"],
  ["orders", "📦 My Orders"],
  ["about", "ℹ️ About"]
];

function enterApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("welcomeUser").textContent = "👤 " + currentUser.fullName;
  $("checkoutName").value = currentUser.fullName || "";

  buildNavigation();
  renderAll();
  goPage("dashboard");
}

function logout() {
  currentUser = null;
  currentRole = null;

  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");

  backToChoices();
}

function buildNavigation() {
  const pages = currentRole === "admin" ? adminPages : customerPages;

  $("navigation").innerHTML = pages.map(([id, label]) =>
    `<button class="nav-btn" type="button" data-page="${id}">${label}</button>`
  ).join("");

  $("navigation").querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => goPage(button.dataset.page));
  });

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", currentRole !== "admin");
  });

  $("dashboardMessage").textContent =
    currentRole === "admin"
      ? "Manage products, customers, orders, and sales."
      : "Find your favorite flowers and place an order.";

  $("ordersTitle").textContent =
    currentRole === "admin" ? "All Customer Orders" : "My Orders";
}

function goPage(page) {
  const allowed = (
    currentRole === "admin" ? adminPages : customerPages
  ).map(item => item[0]);

  if (!allowed.includes(page)) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const renderers = {
    dashboard: renderDashboard,
    inventory: renderInventory,
    shop: renderShop,
    checkout: renderCheckout,
    orders: renderOrders,
    customers: renderCustomers,
    reports: renderReports,
    receipts: renderReceipts,
    settings: renderAdminSettings
  };

  if (renderers[page]) renderers[page]();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* DASHBOARD AND PRODUCT CARDS */

function renderDashboard() {
  $("statProducts").textContent = products.length;
  $("statOrders").textContent = orders.length;
  $("statCustomers").textContent = users.length;

  const revenue = orders
    .filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  $("statRevenue").textContent = money(revenue);

  const list = currentRole === "admin"
    ? products
    : products.filter(product => product.stock > 0);

  $("dashboardProducts").innerHTML = list.length
    ? list.slice(0, 6).map(productCard).join("")
    : '<div class="empty-state">No products available.</div>';

  attachProductActions($("dashboardProducts"));
}

function productCard(product) {
  const image = product.image
    ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
    : `<span class="product-emoji">${product.emoji || "💐"}</span>`;

  const adminActions = currentRole === "admin"
    ? `<button class="btn light" type="button" data-edit="${product.id}">Edit</button>
       <button class="btn danger" type="button" data-delete="${product.id}">Delete</button>`
    : "";

  const buyAction = currentRole === "customer"
    ? `<button class="btn primary" type="button" data-buy="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>`
    : "";

  return `
    <article class="product-card">
      <div class="product-photo">${image}</div>
      <div class="product-info">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-price">${money(product.price)}</p>
        <p class="product-stock">Stock: ${Number(product.stock)}</p>
        <div class="product-actions">${buyAction}${adminActions}</div>
      </div>
    </article>`;
}

function attachProductActions(container) {
  if (!container) return;

  container.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => startOrder(Number(button.dataset.buy)));
  });

  container.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => editProduct(Number(button.dataset.edit)));
  });

  container.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => deleteProduct(Number(button.dataset.delete)));
  });
}
