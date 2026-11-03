"use strict";

/* PETAL & VINE FLOWER BOUTIQUE
   Data Structures Final Project
   Storage: localStorage
   Data Structures: Array and Queue (FIFO)
*/

const $ = id => document.getElementById(id);

const DB = {
  users: "petal_vine_users",
  products: "petal_vine_products",
  orders: "petal_vine_orders",
  queue: "petal_vine_order_queue"
};

const ADMIN = {
  username: "admin",
  password: "Admin123"
};

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

/* STORAGE FUNCTIONS */

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

function validPhone(value) {
  return /^[0-9+()\-\s]{7,20}$/.test(String(value || "").trim());
}

/* DATA STRUCTURE 1: ARRAY */

let users = read(DB.users, []);
let products = read(DB.products, DEFAULT_PRODUCTS);
let orders = read(DB.orders, []);

let currentUser = null;
let currentRole = null;
let selectedAuth = "";
let toastTimer = null;

let failedLoginAttempts = 0;
let loginLockedUntil = 0;

/* DATA STRUCTURE 2: QUEUE (FIFO) */

class OrderQueue {
  constructor(items = []) {
    this.items = Array.isArray(items) ? [...items] : [];
  }

  enqueue(orderId) {
    if (orderId != null && !this.items.includes(orderId)) {
      this.items.push(orderId);
    }
  }

  dequeue() {
    return this.items.length ? this.items.shift() : null;
  }

  peek() {
    return this.items.length ? this.items[0] : null;
  }

  remove(orderId) {
    this.items = this.items.filter(id => id !== orderId);
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  toArray() {
    return [...this.items];
  }
}

let orderQueue = new OrderQueue();

function rebuildOrderQueue() {
  const saved = read(DB.queue, []);

  orderQueue = new OrderQueue(
    Array.isArray(saved) ? saved : []
  );

  orderQueue.items = orderQueue.items.filter((id, index, list) =>
    list.indexOf(id) === index &&
    orders.some(order =>
      order.id === id && order.status === "Pending"
    )
  );

  [...orders]
    .filter(order =>
      order.status === "Pending" &&
      !orderQueue.items.includes(order.id)
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(order => orderQueue.enqueue(order.id));

  save(DB.queue, orderQueue.toArray());
}

function persistQueue() {
  return save(DB.queue, orderQueue.toArray());
}

let nextProductId =
  Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1;

let nextOrderId =
  Math.max(1000, ...orders.map(o => Number(o.id) || 0)) + 1;

/* UPGRADE EXISTING PRODUCT DATA */

const existingProductIds = new Set(
  products.map(product => Number(product.id))
);

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

rebuildOrderQueue();

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
      type === "admin"
        ? "👑 Admin Login"
        : "👤 Customer Login";

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

  if (fullName.length < 2 || fullName.length > 100) {
    $("registerError").textContent =
      "Full name must contain 2–100 characters.";
    return;
  }

  if (!/^[\p{L}][\p{L} .'-]{1,99}$/u.test(fullName)) {
    $("registerError").textContent =
      "Please enter a valid full name.";
    return;
  }

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    $("registerError").textContent =
      "Username must be 3–30 characters using letters, numbers, dots, _ or -.";
    return;
  }

  if (username.toLowerCase() === ADMIN.username) {
    $("registerError").textContent =
      "That username is reserved.";
    return;
  }

  if (password.length < 8 || password.length > 72) {
    $("registerError").textContent =
      "Password must contain 8–72 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerError").textContent =
      "Passwords do not match.";
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("registerError").textContent =
      "Username already exists.";
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

/* LOGIN SECURITY VALIDATION */

function recordFailedLogin() {
  failedLoginAttempts++;

  if (failedLoginAttempts >= 5) {
    loginLockedUntil = Date.now() + 30000;
    failedLoginAttempts = 0;
  }
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  if (Date.now() < loginLockedUntil) {
    const seconds = Math.ceil(
      (loginLockedUntil - Date.now()) / 1000
    );

    $("loginError").textContent =
      `Too many failed attempts. Try again in ${seconds} seconds.`;

    return;
  }

  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;

  $("loginError").textContent = "";

  if (selectedAuth === "admin") {
    if (
      username === ADMIN.username &&
      password === ADMIN.password
    ) {
      currentUser = {
        id: "admin",
        fullName: "Administrator",
        username: ADMIN.username
      };

      failedLoginAttempts = 0;
      loginLockedUntil = 0;
      currentRole = "admin";

      enterApp();
    } else {
      recordFailedLogin();

      $("loginError").textContent =
        "Incorrect admin username or password.";
    }

    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    recordFailedLogin();

    $("loginError").textContent =
      "Incorrect username or password.";

    return;
  }

  if (user.active === false) {
    $("loginError").textContent =
      "This account is disabled. Please contact the shop administrator.";

    return;
  }

  failedLoginAttempts = 0;
  loginLockedUntil = 0;

  user.lastLogin = new Date().toISOString();
  user.active = user.active !== false;

  save(DB.users, users);

  currentUser = user;
  currentRole = "customer";

  enterApp();
});

/* APPLICATION ENTRY AND NAVIGATION */

const adminPages = [
  ["dashboard", "🏠 Dashboard"],
  ["inventory", "🌸 Inventory"],
  ["orders", "📦 All Orders"],
  ["customers", "👥 User Management"],
  ["reports", "📊 Reports"],
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

  $("welcomeUser").textContent =
    "👤 " + currentUser.fullName;

  $("checkoutName").value =
    currentUser.fullName || "";

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
  const pages =
    currentRole === "admin" ? adminPages : customerPages;

  $("navigation").innerHTML = pages.map(([id, label]) =>
    `<button class="nav-btn" type="button" data-page="${id}">${label}</button>`
  ).join("");

  $("navigation")
    .querySelectorAll("[data-page]")
    .forEach(button => {
      button.addEventListener("click", () =>
        goPage(button.dataset.page)
      );
    });

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle(
      "hidden",
      currentRole !== "admin"
    );
  });

  $("dashboardMessage").textContent =
    currentRole === "admin"
      ? "Manage products, customers, orders, and sales."
      : "Find your favorite flowers and place an order.";

  $("ordersTitle").textContent =
    currentRole === "admin"
      ? "All Customer Orders"
      : "My Orders";
}

function goPage(page) {
  const allowed =
    (currentRole === "admin" ? adminPages : customerPages)
      .map(item => item[0]);

  if (!allowed.includes(page)) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === page
    );
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const renderers = {
    dashboard: renderDashboard,
    inventory: renderInventory,
    shop: renderShop,
    checkout: renderCheckout,
    orders: renderOrders,
    customers: renderCustomers,
    reports: renderReports
  };

  if (renderers[page]) renderers[page]();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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
    dashboard: renderDashboard,
    inventory: renderInventory,
    shop: renderShop,
    checkout: renderCheckout,
    orders: renderOrders,
    customers: renderCustomers,
    reports: renderReports
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
  const admin = currentRole === "admin";

  const stockText = product.stock > 0
    ? `In Stock: ${product.stock}`
    : "Out of Stock";

  const actions = admin
    ? `<button class="btn outline" type="button" data-edit="${product.id}">✏️ Edit</button>
       <button class="btn danger" type="button" data-delete="${product.id}">🗑️ Delete</button>`
    : `<button class="btn primary" type="button" data-now="${product.id}"
         ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>`;

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
  container.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () =>
      editProduct(Number(button.dataset.edit))
    );
  });

  container.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () =>
      deleteProduct(Number(button.dataset.delete))
    );
  });

  container.querySelectorAll("[data-now]").forEach(button => {
    button.addEventListener("click", () =>
      startCheckout(Number(button.dataset.now))
    );
  });
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

  if (
    name.length < 2 ||
    name.length > 100 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    alert("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    alert("A product with this name already exists.");
    return;
  }

  const previous = products.map(product => ({ ...product }));

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    Object.assign(product, {
      name,
      category,
      emoji,
      price,
      stock,
      image
    });
  } else {
    products.push({
      id: nextProductId++,
      name,
      category,
      emoji,
      price,
      stock,
      image
    });
  }

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  closeProductForm();
  renderAll();
  goPage("inventory");

  notify(id ? "Product updated!" : "Product added!");
});

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);
  if (!product) return;

  if (orders.some(order =>
    order.status !== "Cancelled" &&
    order.items.some(item => item.productId === id)
  )) {
    alert("This product is connected to an active order and cannot be deleted.");
    return;
  }

  if (!confirm(`Delete ${product.name}?`)) return;

  const previous = products;

  products = products.filter(item => item.id !== id);

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  renderAll();
  notify("Product deleted.");
}

/* INVENTORY AND CUSTOMER SHOP */

function renderInventory() {
  if (currentRole !== "admin") return;

  const query = $("inventorySearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("inventoryProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No matching products.</div>';

  attachProductActions($("inventoryProducts"));
}

$("inventorySearch").addEventListener("input", renderInventory);

function renderShop() {
  if (currentRole !== "customer") return;

  const query = $("shopSearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.stock > 0 &&
    (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No available flowers found.</div>';

  attachProductActions($("shopProducts"));
}

$("shopSearch").addEventListener("input", renderShop);

/* DIRECT ORDER - NO SHOPPING CART */

function startCheckout(id) {
  if (currentRole !== "customer") return;

  const product = products.find(item => item.id === id);

  if (!product || product.stock < 1) {
    return notify("This product is out of stock.");
  }

  $("checkoutProductId").value = String(product.id);
  $("checkoutQuantity").value = "1";
  $("checkoutQuantity").max = String(product.stock);

  $("selectedProductSummary").textContent =
    `${product.emoji} ${product.name} — ${money(product.price)} each · ${product.stock} available`;

  $("checkoutName").value = currentUser.fullName || "";

  goPage("checkout");
}

function renderCheckout() {
  if (currentRole !== "customer") return;
}

$("checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const productId = Number($("checkoutProductId").value);
  const quantity = Number($("checkoutQuantity").value);
  const product = products.find(item => item.id === productId);

  const customerName = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (
    !customerName ||
    customerName.length > 100 ||
    !validPhone(phone) ||
    address.length < 8 ||
    address.length > 300
  ) {
    alert("Enter a valid name, contact number (7–20 characters), and delivery address (8–300 characters).");
    return;
  }

  if (
    !product ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > product.stock
  ) {
    alert("Please choose a valid quantity within available stock.");
    return;
  }

  const item = {
    productId: product.id,
    name: product.name,
    emoji: product.emoji,
    price: product.price,
    quantity,
    subtotal: product.price * quantity
  };

  const newOrder = {
    id: nextOrderId,
    customerId: currentUser.id,
    customerName,
    phone,
    address,
    payment: $("paymentMethod").value,
    items: [item],
    total: item.subtotal,
    status: "Pending",
    date: new Date().toISOString()
  };

  const oldStock = product.stock;

  product.stock -= quantity;
  orders.unshift(newOrder);
  orderQueue.enqueue(newOrder.id);

  if (
    !save(DB.products, products) ||
    !save(DB.orders, orders) ||
    !persistQueue()
  ) {
    product.stock = oldStock;
    orders = orders.filter(order => order.id !== newOrder.id);
    orderQueue.remove(newOrder.id);

    save(DB.products, products);
    save(DB.orders, orders);
    persistQueue();

    return;
  }

  nextOrderId++;

  $("checkoutForm").reset();
  $("checkoutName").value = currentUser.fullName || "";
  $("checkoutProductId").value = "";
  $("selectedProductSummary").textContent =
    "Choose a flower from the Shop to begin your order.";

  renderAll();
  goPage("orders");

  alert("Order placed successfully! Your order number is PV-" + newOrder.id);
});
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
  const admin = currentRole === "admin";

  const stockText = product.stock > 0
    ? `In Stock: ${product.stock}`
    : "Out of Stock";

  const actions = admin
    ? `<button class="btn outline" type="button" data-edit="${product.id}">✏️ Edit</button>
       <button class="btn danger" type="button" data-delete="${product.id}">🗑️ Delete</button>`
    : `<button class="btn primary" type="button" data-now="${product.id}"
         ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>`;

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
  container.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () =>
      editProduct(Number(button.dataset.edit))
    );
  });

  container.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () =>
      deleteProduct(Number(button.dataset.delete))
    );
  });

  container.querySelectorAll("[data-now]").forEach(button => {
    button.addEventListener("click", () =>
      startCheckout(Number(button.dataset.now))
    );
  });
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

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const id = Number($("productId").value);
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const emoji = $("productEmoji").value;
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const image = $("productImage").dataset.current || "";

  if (
    name.length < 2 ||
    name.length > 100 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    alert("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    alert("A product with this name already exists.");
    return;
  }

  const previous = products.map(product => ({ ...product }));

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    Object.assign(product, {
      name,
      category,
      emoji,
      price,
      stock,
      image
    });
  } else {
    products.push({
      id: nextProductId++,
      name,
      category,
      emoji,
      price,
      stock,
      image
    });
  }

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  closeProductForm();
  renderAll();
  goPage("inventory");

  notify(id ? "Product updated!" : "Product added!");
});

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);
  if (!product) return;

  if (orders.some(order =>
    order.status !== "Cancelled" &&
    order.items.some(item => item.productId === id)
  )) {
    alert("This product is connected to an active order and cannot be deleted.");
    return;
  }

  if (!confirm(`Delete ${product.name}?`)) return;

  const previous = products;

  products = products.filter(item => item.id !== id);

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  renderAll();
  notify("Product deleted.");
}

/* INVENTORY AND CUSTOMER SHOP */

function renderInventory() {
  if (currentRole !== "admin") return;

  const query = $("inventorySearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("inventoryProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No matching products.</div>';

  attachProductActions($("inventoryProducts"));
}

$("inventorySearch").addEventListener("input", renderInventory);

function renderShop() {
  if (currentRole !== "customer") return;

  const query = $("shopSearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.stock > 0 &&
    (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No available flowers found.</div>';

  attachProductActions($("shopProducts"));
}

$("shopSearch").addEventListener("input", renderShop);

/* DIRECT ORDER - NO SHOPPING CART */

function startCheckout(id) {
  if (currentRole !== "customer") return;

  const product = products.find(item => item.id === id);

  if (!product || product.stock < 1) {
    return notify("This product is out of stock.");
  }

  $("checkoutProductId").value = String(product.id);
  $("checkoutQuantity").value = "1";
  $("checkoutQuantity").max = String(product.stock);

  $("selectedProductSummary").textContent =
    `${product.emoji} ${product.name} — ${money(product.price)} each · ${product.stock} available`;

  $("checkoutName").value = currentUser.fullName || "";

  goPage("checkout");
}

function renderCheckout() {
  if (currentRole !== "customer") return;
}

/* CHECKOUT AND ORDER CREATION */

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const productId = Number($("checkoutProductId").value);
  const quantity = Number($("checkoutQuantity").value);
  const product = products.find(item => item.id === productId);

  const customerName = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (
    !customerName ||
    customerName.length > 100 ||
    !validPhone(phone) ||
    address.length < 8 ||
    address.length > 300
  ) {
    alert("Enter a valid name, contact number (7–20 characters), and delivery address (8–300 characters).");
    return;
  }

  if (
    !product ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > product.stock
  ) {
    alert("Please choose a valid quantity within available stock.");
    return;
  }

  const item = {
    productId: product.id,
    name: product.name,
    emoji: product.emoji,
    price: product.price,
    quantity,
    subtotal: product.price * quantity
  };

  const newOrder = {
    id: nextOrderId,
    customerId: currentUser.id,
    customerName,
    phone,
    address,
    payment: $("paymentMethod").value,
    items: [item],
    total: item.subtotal,
    status: "Pending",
    date: new Date().toISOString()
  };

  const oldStock = product.stock;

  product.stock -= quantity;
  orders.unshift(newOrder);
  orderQueue.enqueue(newOrder.id);

  if (
    !save(DB.products, products) ||
    !save(DB.orders, orders) ||
    !persistQueue()
  ) {
    product.stock = oldStock;
    orders = orders.filter(order => order.id !== newOrder.id);
    orderQueue.remove(newOrder.id);

    save(DB.products, products);
    save(DB.orders, orders);
    persistQueue();

    return;
  }

  nextOrderId++;

  $("checkoutForm").reset();
  $("checkoutName").value = currentUser.fullName || "";
  $("checkoutProductId").value = "";

  $("selectedProductSummary").textContent =
    "Choose a flower from the Shop to begin your order.";

  renderAll();
  goPage("orders");

  alert("Order placed successfully! Your order number is PV-" + newOrder.id);
});
/* ORDER MANAGEMENT */

function renderOrders() {
  const list = currentRole === "admin"
    ? orders
    : orders.filter(order => order.customerId === currentUser.id);

  if (!list.length) {
    $("ordersList").innerHTML =
      '<div class="empty-state">No orders found.</div>';
    return;
  }

  const adminColumn = currentRole === "admin"
    ? "<th>Update Status</th>"
    : "";

  $("ordersList").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer / Items</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Status</th>
            <th>Receipt</th>
            ${adminColumn}
          </tr>
        </thead>

        <tbody>
          ${list.map(order => {
            const itemText = order.items.map(item =>
              `${escapeHTML(item.name)} × ${item.quantity}`
            ).join("<br>");

            const customerText =
              escapeHTML(order.customerName || "Customer");

            const dateText = order.date
              ? new Date(order.date).toLocaleString("en-PH")
              : "";

            const statusControl = currentRole === "admin"
              ? `<td>
                  <select data-order="${order.id}"
                    aria-label="Update order ${order.id}">
                    ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
                      `<option value="${status}"
                        ${order.status === status ? "selected" : ""}>
                        ${status}
                      </option>`
                    ).join("")}
                  </select>
                </td>`
              : "";

            return `
              <tr>
                <td>
                  <strong>PV-${order.id}</strong>
                  <br>
                  <small>${escapeHTML(dateText)}</small>
                </td>

                <td>
                  ${customerText}
                  <br>
                  <small>${itemText}</small>
                </td>

                <td>${escapeHTML(order.payment || "—")}</td>
                <td>${money(order.total)}</td>

                <td>
                  <span class="badge ${escapeHTML(order.status)}">
                    ${escapeHTML(order.status)}
                  </span>
                </td>

                <td>
                  <button class="btn outline receipt-btn"
                    type="button"
                    data-receipt="${order.id}">
                    🧾 Receipt
                  </button>
                </td>

                ${statusControl}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  $("ordersList")
    .querySelectorAll("[data-receipt]")
    .forEach(button => {
      button.addEventListener("click", () =>
        printReceipt(Number(button.dataset.receipt))
      );
    });

  $("ordersList")
    .querySelectorAll("[data-order]")
    .forEach(select => {
      select.addEventListener("change", () =>
        updateOrder(
          Number(select.dataset.order),
          select.value
        )
      );
    });
}

/* RECEIPT MANAGEMENT */

function printReceipt(id) {
  const order = orders.find(item => item.id === id);

  if (!order) return;

  if (
    currentRole !== "admin" &&
    order.customerId !== currentUser.id
  ) {
    return;
  }

  const rows = order.items.map(item => `
    <tr>
      <td>${escapeHTML(item.name)} × ${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  const receipt = `
    <div id="printReceipt" class="receipt">
      <h1>🌷 Petal &amp; Vine</h1>

      <p>Flower Shop · Binalonan, Pangasinan</p>

      <hr>

      <h2>OFFICIAL ORDER RECEIPT</h2>

      <p>
        <strong>Receipt No:</strong>
        PV-${order.id}
      </p>

      <p>
        <strong>Date:</strong>
        ${escapeHTML(
          order.date
            ? new Date(order.date).toLocaleString("en-PH")
            : "—"
        )}
      </p>

      <p>
        <strong>Customer:</strong>
        ${escapeHTML(order.customerName || "Customer")}
      </p>

      <p>
        <strong>Contact:</strong>
        ${escapeHTML(order.phone || "—")}
      </p>

      <p>
        <strong>Delivery:</strong>
        ${escapeHTML(order.address || "—")}
      </p>

      <p>
        <strong>Payment:</strong>
        ${escapeHTML(order.payment || "—")}
      </p>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>

        <tbody>${rows}</tbody>
      </table>

      <h2>Total: ${money(order.total)}</h2>

      <p>Status: ${escapeHTML(order.status)}</p>

      <p>Thank you for choosing Petal &amp; Vine! 🌸</p>

      <button class="btn primary" onclick="window.print()">
        Print Receipt
      </button>
    </div>
  `;

  const win = window.open(
    "",
    "_blank",
    "width=800,height=700"
  );

  if (!win) {
    alert("Please allow pop-ups to print the receipt.");
    return;
  }

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Receipt PV-${order.id}</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 28px;
            color: #333;
          }

          h1, h2 {
            color: #6c5b7b;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }

          td, th {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
          }

          button {
            padding: 10px 16px;
            background: #c06c84;
            color: white;
            border: 0;
            border-radius: 6px;
          }

          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        ${receipt}
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
}

/* FIFO ORDER PROCESSING */

function updateOrder(id, status) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === id);

  const allowedStatuses = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
  ];

  if (!order || !allowedStatuses.includes(status)) {
    return;
  }

  const oldStatus = order.status;

  if (oldStatus === status) return;

  // FIFO VALIDATION:
  // The oldest pending order must be processed first.

  if (status === "Processing" && oldStatus === "Pending") {
    const firstPendingId = orderQueue.peek();

    if (firstPendingId !== order.id) {
      const firstOrder = orders.find(
        item => item.id === firstPendingId
      );

      alert(
        `FIFO rule: process the oldest pending order first${
          firstOrder ? ` (PV-${firstOrder.id})` : ""
        }.`
      );

      renderOrders();
      return;
    }
  }

  const previousProducts = products.map(
    product => ({ ...product })
  );

  const previousQueue = orderQueue.toArray();

  // Restore stock if a cancelled order is reactivated.

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    const canRestore = order.items.every(item => {
      const product = products.find(
        p => p.id === item.productId
      );

      return product && product.stock >= item.quantity;
    });

    if (!canRestore) {
      alert("Insufficient stock to reactivate this order.");
      renderOrders();
      return;
    }

    order.items.forEach(item => {
      products.find(
        p => p.id === item.productId
      ).stock -= item.quantity;
    });

  } else if (
    status === "Cancelled" &&
    oldStatus !== "Cancelled"
  ) {
    order.items.forEach(item => {
      const product = products.find(
        p => p.id === item.productId
      );

      if (product) {
        product.stock += item.quantity;
      }
    });
  }

  order.status = status;

  if (oldStatus === "Pending" && status !== "Pending") {
    orderQueue.remove(order.id);
  }

  if (oldStatus !== "Pending" && status === "Pending") {
    orderQueue.enqueue(order.id);
  }

  if (
    !save(DB.products, products) ||
    !save(DB.orders, orders) ||
    !persistQueue()
  ) {
    order.status = oldStatus;
    products = previousProducts;
    orderQueue = new OrderQueue(previousQueue);

    save(DB.products, products);
    save(DB.orders, orders);
    persistQueue();

    renderAll();
    return;
  }

  renderAll();
  notify("Order status updated.");
}

/* CUSTOMER MANAGEMENT */

function renderCustomers() {
  if (currentRole !== "admin") return;

  const now = Date.now();

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const newUsers = users.filter(user =>
    user.createdAt &&
    now - new Date(user.createdAt).getTime() <= sevenDays
  ).length;

  const activeUsers = users.filter(user =>
    user.lastLogin &&
    now - new Date(user.lastLogin).getTime() <= thirtyDays
  ).length;

  $("userTotal").textContent = users.length;
  $("userNew").textContent = newUsers;
  $("userActive").textContent = activeUsers;

  $("customersList").innerHTML = users.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Username</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Account</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${users.map(user => `
              <tr>
                <td>${escapeHTML(user.fullName)}</td>

                <td>${escapeHTML(user.username)}</td>

                <td>
                  ${user.createdAt
                    ? escapeHTML(
                        new Date(user.createdAt).toLocaleDateString("en-PH")
                      )
                    : "Legacy account"}
                </td>

                <td>
                  ${user.lastLogin
                    ? escapeHTML(
                        new Date(user.lastLogin).toLocaleString("en-PH")
                      )
                    : "Never logged in"}
                </td>

                <td>
                  ${user.active === false ? "Disabled" : "Active"}
                </td>

                <td>
                  <button
                    class="btn ${user.active === false ? "success" : "light"}"
                    type="button"
                    data-toggle-user="${user.id}">
                    ${user.active === false ? "Enable" : "Disable"}
                  </button>

                  <button
                    class="btn danger"
                    type="button"
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
    : '<div class="empty-state">No registered customers yet.</div>';

  $("customersList")
    .querySelectorAll("[data-toggle-user]")
    .forEach(button => {
      button.addEventListener("click", () =>
        toggleUser(Number(button.dataset.toggleUser))
      );
    });

  $("customersList")
    .querySelectorAll("[data-delete-user]")
    .forEach(button => {
      button.addEventListener("click", () =>
        deleteUser(Number(button.dataset.deleteUser))
      );
    });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);

  if (!user) return;

  user.active = user.active === false;

  if (!save(DB.users, users)) return;

  renderCustomers();

  notify(
    user.active
      ? "User account enabled."
      : "User account disabled."
  );
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);

  if (!user || user.role === "admin") return;

  if (orders.some(order =>
    order.customerId === id &&
    order.status !== "Cancelled"
  )) {
    alert(
      "This customer has active orders. Cancel or complete those orders before deleting the account."
    );
    return;
  }

  if (!confirm(`Delete customer account ${user.username}?`)) {
    return;
  }

  const previous = users;

  users = users.filter(item => item.id !== id);

  if (!save(DB.users, users)) {
    users = previous;
    return;
  }

  renderCustomers();
  renderDashboard();

  notify("Customer account deleted.");
}

/* SALES REPORTS */

function renderReports() {
  if (currentRole !== "admin") return;

  const completed = orders.filter(
    order => order.status === "Completed"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;

  $("reportPending").textContent = orders.filter(order =>
    order.status === "Pending" ||
    order.status === "Processing"
  ).length;
}

/* REFRESH ALL APPLICATION SECTIONS */

function renderAll() {
  renderDashboard();

  if (currentRole === "admin") {
    renderInventory();
    renderOrders();
    renderCustomers();
    renderReports();
  } else {
    renderShop();
    renderOrders();
  }
}

/* NOTIFICATIONS */

function notify(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/* EXPOSE HTML BUTTON ACTIONS */

window.showAuth = showAuth;
window.backToChoices = backToChoices;
window.togglePassword = togglePassword;
window.logout = logout;

Object.defineProperty(window, "orderQueue", {
  get: () => orderQueue
});

window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;

/* INITIALIZATION */

backToChoices();
