"use strict";

/* Petal & Vine - browser-based demonstration app.
   Data is stored in this browser's localStorage. This is not a secure
   production authentication or multi-device database system. */

const $ = (id) => document.getElementById(id);

const DB = {
  users: "petal_vine_users",
  products: "petal_vine_products",
  orders: "petal_vine_orders"
};

const ADMIN = { username: "admin", password: "Admin123" };

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
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

let users = read(DB.users, []);
let products = read(DB.products, DEFAULT_PRODUCTS);
let orders = read(DB.orders, []);
let currentUser = null;
let currentRole = null;
let selectedAuth = "";
let cart = {};
let toastTimer = null;

let nextProductId = Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1;
let nextOrderId = Math.max(1000, ...orders.map(o => Number(o.id) || 0)) + 1;

// Upgrade older installations by adding any missing starter products without overwriting edits.
const existingProductIds = new Set(products.map(product => Number(product.id)));
let addedStarterProducts = false;
DEFAULT_PRODUCTS.forEach(starter => {
  if (!existingProductIds.has(starter.id)) {
    products.push({ ...starter });
    addedStarterProducts = true;
  }
});
if (addedStarterProducts || !localStorage.getItem(DB.products)) save(DB.products, products);

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
    $("loginTitle").textContent = type === "admin" ? "👑 Admin Login" : "👤 Customer Login";
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
  button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
}

$("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const fullName = $("regFullName").value.trim();
  const username = $("regUsername").value.trim();
  const password = $("regPassword").value;
  const confirm = $("regConfirm").value;
  $("registerError").textContent = "";

  if (fullName.length < 2) return $("registerError").textContent = "Please enter your full name.";
  if (username.length < 3) return $("registerError").textContent = "Username must have at least 3 characters.";
  if (username.toLowerCase() === ADMIN.username) return $("registerError").textContent = "That username is reserved.";
  if (password.length < 6) return $("registerError").textContent = "Password must have at least 6 characters.";
  if (password !== confirm) return $("registerError").textContent = "Passwords do not match.";
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return $("registerError").textContent = "Username already exists.";
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

$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  $("loginError").textContent = "";

  if (selectedAuth === "admin") {
    if (username === ADMIN.username && password === ADMIN.password) {
      currentUser = { id: "admin", fullName: "Administrator", username: ADMIN.username };
      currentRole = "admin";
      enterApp();
    } else {
      $("loginError").textContent = "Incorrect admin username or password.";
    }
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() && item.password === password
  );

  if (!user) {
    $("loginError").textContent = "Incorrect username or password.";
    return;
  }
  if (user.active === false) {
    $("loginError").textContent = "This account is disabled. Please contact the shop administrator.";
    return;
  }

  user.lastLogin = new Date().toISOString();
  user.active = user.active !== false;
  save(DB.users, users);
  currentUser = user;
  currentRole = "customer";
  enterApp();
});

/* APPLICATION ENTRY AND NAVIGATION */

const adminPages = [
  ["dashboard", "🏠 Dashboard"], ["inventory", "🌸 Inventory"],
  ["orders", "📦 All Orders"], ["customers", "👥 User Management"],
  ["reports", "📊 Reports"], ["about", "ℹ️ About"]
];

const customerPages = [
  ["dashboard", "🏠 Home"], ["shop", "🌷 Shop Flowers"],
  ["cart", "🛒 My Cart"], ["orders", "📦 My Orders"], ["about", "ℹ️ About"]
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
  cart = {};
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

  $("dashboardMessage").textContent = currentRole === "admin"
    ? "Manage products, customers, orders, and sales."
    : "Find your favorite flowers and place an order.";

  $("ordersTitle").textContent = currentRole === "admin" ? "All Customer Orders" : "My Orders";
}

function goPage(page) {
  const allowed = (currentRole === "admin" ? adminPages : customerPages).map(item => item[0]);
  if (!allowed.includes(page)) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const renderers = {
    dashboard: renderDashboard, inventory: renderInventory, shop: renderShop,
    cart: renderCart, orders: renderOrders, customers: renderCustomers, reports: renderReports
  };
  if (renderers[page]) renderers[page]();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* DASHBOARD AND PRODUCT CARDS */

function renderDashboard() {
  $("statProducts").textContent = products.length;
  $("statOrders").textContent = orders.length;
  $("statCustomers").textContent = users.length;

  const revenue = orders.filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  $("statRevenue").textContent = money(revenue);

  const list = currentRole === "admin" ? products : products.filter(product => product.stock > 0);
  $("dashboardProducts").innerHTML = list.length
    ? list.slice(0, 6).map(productCard).join("")
    : '<div class="empty-state">No products available.</div>';
  attachProductActions($("dashboardProducts"));
}

function productCard(product) {
  const admin = currentRole === "admin";
  const stockText = product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock";
  const actions = admin
    ? `<button class="btn outline" type="button" data-edit="${product.id}">✏️ Edit</button>
       <button class="btn danger" type="button" data-delete="${product.id}">🗑️ Delete</button>`
    : `<button class="btn primary" type="button" data-now="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>
       <button class="btn outline" type="button" data-buy="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>`;

  const visual = product.image
    ? `<img class="product-photo" src="${product.image}" alt="${escapeHTML(product.name)}">`
    : `<div class="flower-emoji">${escapeHTML(product.emoji)}</div>`;
  return `<article class="product-card">
    ${visual}
    <div class="product-name">${escapeHTML(product.name)}</div>
    <p>${escapeHTML(product.category)}</p>
    <div class="price">${money(product.price)}</div>
    <div class="stock ${product.stock <= 0 ? "out" : ""}">${stockText}</div>
    ${actions}
  </article>`;
}

function attachProductActions(container) {
  container.querySelectorAll("[data-edit]").forEach(button =>
    button.addEventListener("click", () => editProduct(Number(button.dataset.edit)))
  );
  container.querySelectorAll("[data-delete]").forEach(button =>
    button.addEventListener("click", () => deleteProduct(Number(button.dataset.delete)))
  );
  container.querySelectorAll("[data-buy]").forEach(button =>
    button.addEventListener("click", () => addToCart(Number(button.dataset.buy)))
  );
  container.querySelectorAll("[data-now]").forEach(button =>
    button.addEventListener("click", () => {
      if (addToCart(Number(button.dataset.now))) goPage("cart");
    })
  );
}

/* ADMIN PRODUCT MANAGEMENT */

function openProductForm() {
  if (currentRole !== "admin") return;
  $("productEditor").classList.remove("hidden");
  $("productForm").reset();
  $("productId").value = "";
  $("productImage").value = "";
  $("productImage").dataset.current = "";
  renderImagePreview("");
  $("editorTitle").textContent = "Add New Product";
}

function closeProductForm() {
  $("productEditor").classList.add("hidden");
  $("productForm").reset();
}

function editProduct(id) {
  if (currentRole !== "admin") return;
  const product = products.find(item => item.id === id);
  if (!product) return;

  $("productEditor").classList.remove("hidden");
  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productEmoji").value = product.emoji;
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productImage").value = "";
  $("productImage").dataset.current = product.image || "";
  renderImagePreview(product.image || "");
  $("editorTitle").textContent = "Edit Product";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderImagePreview(src) {
  $("imagePreview").innerHTML = src
    ? `<img src="${src}" alt="Product image preview">`
    : "No picture selected — emoji will be used.";
}

$("productImage").addEventListener("change", () => {
  const file = $("productImage").files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    $("productImage").value = "";
    return;
  }
  if (file.size > 1_500_000) {
    alert("Please choose an image smaller than 1.5 MB to avoid filling browser storage.");
    $("productImage").value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    $("productImage").dataset.current = String(reader.result);
    renderImagePreview(String(reader.result));
  };
  reader.readAsDataURL(file);
});

$("removeProductImage").addEventListener("click", () => {
  $("productImage").value = "";
  $("productImage").dataset.current = "";
  renderImagePreview("");
});

$("productForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;

  const id = Number($("productId").value);
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const emoji = $("productEmoji").value;
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const image = $("productImage").dataset.current || "";
