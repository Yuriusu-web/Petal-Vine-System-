
/* ==========================================
   PETAL & VINE FLOWER BOUTIQUE
   COMPLETE CONNECTED JAVASCRIPT
========================================== */

"use strict";

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  session: "pv_session"
};

const $ = id => document.getElementById(id);

let users = [];
let products = [];
let orders = [];
let currentUser = null;
let cart = [];
let checkoutItems = [];
let toastTimer = null;
let selectedProductImage = "";

/* ==========================================
   STORAGE
========================================== */

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage error:", error);
    showToast("Unable to save. Storage may be full.");
    return false;
  }
}

function refreshData() {
  users = load(STORAGE.users, []);
  products = load(STORAGE.products, []);
  orders = load(STORAGE.orders, []);

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];
}

function makeId(prefix) {
  return prefix + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);
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

function dateText(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString();
}

/* ==========================================
   INITIALIZATION
========================================== */

function initialize() {
  refreshData();

  createDefaultAdmin();
  createDefaultProducts();

  save(STORAGE.users, users);
  save(STORAGE.products, products);

  // Require login whenever the application is opened.
  localStorage.removeItem(STORAGE.session);

  currentUser = null;
  cart = [];
  checkoutItems = [];

  bindEvents();
  showCorrectAuthPanel();
}

function createDefaultAdmin() {
  let admin = users.find(user =>
    user && user.role === "admin"
  );

  if (!admin) {
    admin = {
      id: makeId("U"),
      name: "Administrator",
      username: "admin",
      password: "Admin123",
      phone: "",
      address: "",
      role: "admin",
      createdAt: new Date().toISOString()
    };

    users.unshift(admin);
  }

  admin.name = admin.name || "Administrator";

  users.forEach(user => {
    if (
      user.id !== admin.id &&
      String(user.username).toLowerCase() ===
      String(admin.username).toLowerCase()
    ) {
      user.username = "customer_" + String(user.id).slice(-6);
    }
  });
}

function createDefaultProducts() {
  if (products.length) return;

  products = [
    {
      id: makeId("P"),
      name: "Classic Red Roses",
      category: "Roses",
      price: 850,
      stock: 20,
      image: "🌹",
      description: "A timeless bouquet of beautiful red roses."
    },
    {
      id: makeId("P"),
      name: "Pink Tulip Bouquet",
      category: "Tulips",
      price: 950,
      stock: 15,
      image: "🌷",
      description: "Soft pink tulips for a lovely surprise."
    },
    {
      id: makeId("P"),
      name: "Sunny Sunflowers",
      category: "Sunflowers",
      price: 700,
      stock: 18,
      image: "🌻",
      description: "Bright sunflowers to make someone's day."
    },
    {
      id: makeId("P"),
      name: "White Rose Bouquet",
      category: "Roses",
      price: 900,
      stock: 12,
      image: "💐",
      description: "Elegant white roses for special occasions."
    },
    {
      id: makeId("P"),
      name: "Mixed Flower Basket",
      category: "Mixed Bouquets",
      price: 1200,
      stock: 10,
      image: "💐",
      description: "A colorful mix of seasonal flowers."
    },
    {
      id: makeId("P"),
      name: "Purple Tulips",
      category: "Tulips",
      price: 980,
      stock: 14,
      image: "🪻",
      description: "Charming purple tulips."
    },
    {
      id: makeId("P"),
      name: "Pink Rose Bouquet",
      category: "Roses",
      price: 880,
      stock: 16,
      image: "🌸",
      description: "A sweet arrangement of pink roses."
    },
    {
      id: makeId("P"),
      name: "Garden Blooms",
      category: "Mixed Bouquets",
      price: 1100,
      stock: 9,
      image: "💮",
      description: "A garden-inspired flower arrangement."
    },
    {
      id: makeId("P"),
      name: "White Lily Bouquet",
      category: "Lilies",
      price: 1350,
      stock: 12,
      image: "🤍",
      description: "Elegant white lilies for meaningful occasions."
    },
    {
      id: makeId("P"),
      name: "Blue Hydrangea Bouquet",
      category: "Hydrangeas",
      price: 1450,
      stock: 8,
      image: "💠",
      description: "Beautiful blue blooms for a thoughtful gift."
    },
    {
      id: makeId("P"),
      name: "Purple Orchid Arrangement",
      category: "Orchids",
      price: 1550,
      stock: 10,
      image: "🪻",
      description: "Graceful purple orchids for elegant celebrations."
    },
    {
      id: makeId("P"),
      name: "White Daisy Bouquet",
      category: "Daisies",
      price: 650,
      stock: 20,
      image: "🌼",
      description: "Fresh and cheerful white daisies."
    },
    {
      id: makeId("P"),
      name: "Carnation Love Bouquet",
      category: "Carnations",
      price: 780,
      stock: 15,
      image: "🌺",
      description: "Lovely carnations perfect for showing appreciation."
    },
    {
      id: makeId("P"),
      name: "Peach Rose Bouquet",
      category: "Roses",
      price: 1050,
      stock: 12,
      image: "🌹",
      description: "Warm peach roses for sweet and thoughtful gifts."
    },
    {
      id: makeId("P"),
      name: "Lavender Dream Bouquet",
      category: "Lavender",
      price: 1150,
      stock: 10,
      image: "💜",
      description: "A dreamy lavender-inspired floral arrangement."
    },
    {
      id: makeId("P"),
      name: "Pink Peony Bouquet",
      category: "Peonies",
      price: 1650,
      stock: 7,
      image: "🌸",
      description: "Romantic pink peonies with soft, full blooms."
    },
    {
      id: makeId("P"),
      name: "Orange Gerbera Bouquet",
      category: "Gerberas",
      price: 890,
      stock: 14,
      image: "🌼",
      description: "Bright orange gerberas for happy celebrations."
    },
    {
      id: makeId("P"),
      name: "Luxury Mixed Roses",
      category: "Mixed Bouquets",
      price: 1850,
      stock: 6,
      image: "💐",
      description: "A luxurious arrangement of assorted colorful roses."
    }
  ];
}
/* ==========================================
   AUTHENTICATION
========================================== */

function showCorrectAuthPanel() {
  $("authScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");

  showLogin();
  $("headerUser").textContent = "";
}

function showLogin() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");

  $("authSwitch").classList.remove("hidden");
  $("loginSwitch").classList.add("hidden");

  $("authTitle").textContent = "Welcome Back";
  $("authSubtitle").textContent =
    "Sign in to continue to your flower shop.";

  $("loginMessage").textContent = "";
  $("registerMessage").textContent = "";
}

function showRegister() {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");

  $("authSwitch").classList.add("hidden");
  $("loginSwitch").classList.remove("hidden");

  $("authTitle").textContent = "Create Account";
  $("authSubtitle").textContent =
    "Join Petal & Vine and discover beautiful flowers.";

  $("loginMessage").textContent = "";
  $("registerMessage").textContent = "";
}

/* ==========================================
   EVENT LISTENERS
========================================== */

function bindEvents() {
  $("loginForm").addEventListener("submit", login);
  $("registerForm").addEventListener("submit", register);
  $("productForm").addEventListener("submit", saveProduct);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("profileForm").addEventListener("submit", updateProfile);
  $("settingsForm").addEventListener("submit", saveSettings);

  $("productSearch").addEventListener("input", renderShop);
  $("adminProductSearch").addEventListener("input", renderAdminProducts);

  $("productImage").addEventListener("input", () => {
    if (!$("productImageFile").files[0]) {
      updateProductImagePreview(
        $("productImage").value.trim() || "💐"
      );
    }
  });

  $("productImageFile").addEventListener(
    "change",
    previewProductImage
  );

  ["productModal", "checkoutModal", "receiptModal"].forEach(id => {
    $(id).addEventListener("click", event => {
      if (event.target.id === id) {
        closeModal(id);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });
}

/* ==========================================
   LOGIN
========================================== */

function login(event) {
  event.preventDefault();

  refreshData();
  createDefaultAdmin();
  save(STORAGE.users, users);

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(item =>
    String(item.username).trim().toLowerCase() === username &&
    item.password === password
  );

  if (!user) {
    $("loginMessage").textContent =
      "Incorrect username or password.";
    return;
  }

  currentUser = user;
  cart = [];
  checkoutItems = [];

  save(STORAGE.session, {
    userId: user.id
  });

  $("loginForm").reset();
  $("loginMessage").textContent = "";

  openApplication();
}

/* ==========================================
   REGISTRATION
   NO PHONE OR ADDRESS REQUIRED
========================================== */

function register(event) {
  event.preventDefault();

  refreshData();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (name.length < 2) {
    $("registerMessage").textContent =
      "Please enter your full name.";
    return;
  }

  if (username.length < 3) {
    $("registerMessage").textContent =
      "Username must have at least 3 characters.";
    return;
  }

  if (username.toLowerCase() === "admin") {
    $("registerMessage").textContent =
      "This username is reserved.";
    return;
  }

  if (password.length < 6) {
    $("registerMessage").textContent =
      "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerMessage").textContent =
      "Passwords do not match.";
    return;
  }

  if (users.some(user =>
    String(user.username).toLowerCase() === username.toLowerCase()
  )) {
    $("registerMessage").textContent =
      "Username is already taken.";
    return;
  }

  const newUser = {
    id: makeId("U"),
    name,
    username,
    password,
    phone: "",
    address: "",
    role: "customer",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  if (!save(STORAGE.users, users)) {
    users.pop();
    return;
  }

  $("registerForm").reset();

  showLogin();

  $("loginUsername").value = username;

  $("loginMessage").textContent =
    "Account created successfully! Please log in.";
}

/* ==========================================
   OPEN APPLICATION
========================================== */

function openApplication() {
  if (!currentUser) return;

  refreshData();

  currentUser = users.find(user =>
    user.id === currentUser.id
  );

  if (!currentUser) {
    logout();
    return;
  }

  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("welcomeText").textContent =
    "Hello, " + currentUser.name;

  $("headerUser").textContent =
    currentUser.name + " (" + currentUser.role + ")";

  const isAdmin = currentUser.role === "admin";

  $("roleLabel").textContent =
    isAdmin ? "Administrator" : "Customer";

  $("adminNav").classList.toggle("hidden", !isAdmin);
  $("customerNav").classList.toggle("hidden", isAdmin);

  if (isAdmin) {
    adminPage(
      "dashboard",
      $("adminNav").querySelector(".nav-link")
    );
  } else {
    cart = [];
    updateCartCount();

    $("productSearch").value = "";

    customerPage(
      "shop",
      $("customerNav").querySelector(".nav-link")
    );
  }
}

/* ==========================================
   LOGOUT
========================================== */

function logout() {
  localStorage.removeItem(STORAGE.session);

  currentUser = null;
  cart = [];
  checkoutItems = [];

  closeAllModals();
  showCorrectAuthPanel();

  showToast("You have logged out.");
}

/* ==========================================
   PASSWORD VISIBILITY
========================================== */

function togglePassword(id, button) {
  const field = $(id);
  if (!field) return;

  const showing = field.type === "password";

  field.type = showing ? "text" : "password";
  button.textContent = showing ? "Hide" : "Show";
}

/* ==========================================
   NAVIGATION
========================================== */

function setPage(pageId, nav, title) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const target = $(pageId);

  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.remove("active");
  });

  if (nav) nav.classList.add("active");

  $("pageTitle").textContent = title;
}

function customerPage(page, button) {
  if (!currentUser || currentUser.role !== "customer") return;

  const titles = {
    shop: "Shop Flowers",
    cart: "My Shopping Cart",
    orders: "My Orders",
    receipts: "My Receipts",
    transactions: "My Transactions",
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
  if (!currentUser || currentUser.role !== "admin") return;

  const titles = {
    dashboard: "Admin Dashboard",
    products: "Manage Products",
    inventory: "Inventory Management",
    orders: "Customer Orders",
    users: "User Management",
    settings: "Admin Settings"
  };

  if (!titles[page]) return;

  setPage("admin-" + page, button, titles[page]);

  if (page === "dashboard") renderDashboard();
  if (page === "products") renderAdminProducts();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderAdminOrders();
  if (page === "users") renderUsers();
  if (page === "settings") loadSettings();
}

function refreshAdmin() {
  renderDashboard();
  renderAdminProducts();
  renderInventory();
  renderAdminOrders();
  renderUsers();
}

/* ==========================================
   ADMIN DASHBOARD
========================================== */

function renderDashboard() {
  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  const customers = users.filter(user =>
    user.role === "customer"
  );

  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  const sales = completed.reduce(
    (sum, order) => sum + Number(order.total || 0), 0
  );

  const pending = orders.filter(order =>
    order.status === "Pending" ||
    order.status === "Processing"
  );

  $("dashboardStats").innerHTML = `
    <div class="stat-card">
      <span>Total Products</span>
      <strong>${products.length}</strong>
    </div>

    <div class="stat-card">
      <span>Total Customers</span>
      <strong>${customers.length}</strong>
    </div>

    <div class="stat-card">
      <span>Total Orders</span>
      <strong>${orders.length}</strong>
    </div>

    <div class="stat-card">
      <span>Completed Sales</span>
      <strong>${money(sales)}</strong>
    </div>

    <div class="stat-card">
      <span>Pending Orders</span>
      <strong>${pending.length}</strong>
    </div>

    <div class="stat-card">
      <span>Completed Orders</span>
      <strong>${completed.length}</strong>
    </div>
  `;

  const recent = [...orders]
    .sort((a,b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0,5);

  $("recentOrders").innerHTML = recent.length
    ? orderTable(recent, false)
    : emptyState("No orders yet", "Customer purchases will appear here.");
}

/* ==========================================
   PRODUCT IMAGE DISPLAY
========================================== */

function productImageHTML(image) {
  const value = String(image || "💐").trim();

  if (/^(https?:\/\/|data:image\/)/i.test(value)) {
    return `
      <img src="${escapeHTML(value)}"
        alt="Flower product"
        onerror="this.style.display='none';
        this.parentElement.textContent='💐'">
    `;
  }

  return escapeHTML(value);
}

/* ==========================================
   PRODUCT IMAGE UPLOAD
========================================== */

function previewProductImage() {
  const file = $("productImageFile").files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image.");
    $("productImageFile").value = "";
    return;
  }

  if (file.size > 1.5 * 1024 * 1024) {
    showToast("Image must be 1.5MB or smaller.");
    $("productImageFile").value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    $("productImagePreview").innerHTML = `
      <img src="${event.target.result}"
        alt="Product preview">
    `;
  };

  reader.onerror = () => {
    showToast("Unable to read the selected image.");
  };

  reader.readAsDataURL(file);
}

function readProductImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(
      new Error("Unable to read image.")
    );

    reader.readAsDataURL(file);
  });
}

function updateProductImagePreview(value) {
  const preview = $("productImagePreview");

  if (/^(https?:\/\/|data:image\/)/i.test(value)) {
    preview.innerHTML = `
      <img src="${escapeHTML(value)}"
        alt="Product preview"
        onerror="this.parentElement.textContent='💐'">
    `;
  } else {
    preview.textContent = value || "💐";
  }
}

/* ==========================================
   ADD / EDIT PRODUCT
========================================== */

function openProductModal(id = "") {
  if (!currentUser || currentUser.role !== "admin") return;

  $("productForm").reset();
  $("productId").value = id;
  $("productImageFile").value = "";

  const product = products.find(item => item.id === id);

  selectedProductImage = product ? product.image : "";

  $("productModalTitle").textContent =
    product ? "Edit Product" : "Add Product";

  if (product) {
    $("productName").value = product.name;
    $("productCategory").value = product.category || "";
    $("productDescription").value = product.description || "";
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;

    $("productImage").value =
      product.image && !product.image.startsWith("data:image/")
        ? product.image
        : "";

    updateProductImagePreview(product.image || "💐");
  } else {
    $("productImage").value = "💐";
    updateProductImagePreview("💐");
  }

  $("productModal").classList.remove("hidden");
}

async function saveProduct(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "admin") return;

  const id = $("productId").value;

  const data = {
    name: $("productName").value.trim(),
    category: $("productCategory").value.trim(),
    description: $("productDescription").value.trim(),
    price: Number($("productPrice").value),
    stock: Number($("productStock").value)
  };

  if (
    !data.name ||
    !data.category ||
    !Number.isFinite(data.price) ||
    data.price <= 0 ||
    !Number.isInteger(data.stock) ||
    data.stock < 0
  ) {
    showToast("Please enter valid product details.");
    return;
  }

  const existing = products.find(item => item.id === id);
  const file = $("productImageFile").files[0];

  let image = $("productImage").value.trim();

  try {
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image.");
        return;
      }

      if (file.size > 1.5 * 1024 * 1024) {
        showToast("Image must be 1.5MB or smaller.");
        return;
      }

      image = await readProductImage(file);

    } else if (!image) {
      image = selectedProductImage || "💐";
    }

  } catch (error) {
    showToast("Unable to upload picture.");
    return;
  }

  data.image = image || "💐";

  if (id) {
    const index = products.findIndex(item => item.id === id);

    if (index === -1) {
      showToast("Product no longer exists.");
      return;
    }

    const previous = products[index];

    products[index] = {
      ...previous,
      ...data
    };

  } else {
    products.push({
      id: makeId("P"),
      ...data
    });
  }

  if (!save(STORAGE.products, products)) {
    if (existing) {
      const index = products.findIndex(item => item.id === id);
      products[index] = existing;
    } else {
      products.pop();
    }
    return;
  }

  closeModal("productModal");
  refreshAdmin();

  showToast(id
    ? "Product updated successfully."
    : "Product added successfully.");
}

/* ==========================================
   DELETE PRODUCT
========================================== */

function deleteProduct(id) {
  if (!currentUser || currentUser.role !== "admin") return;

  const product = products.find(item => item.id === id);

  if (!product) return;

  if (!confirm("Delete " + product.name + "?")) return;

  const oldProducts = [...products];

  products = products.filter(item => item.id !== id);
  cart = cart.filter(item => item.productId !== id);

  if (!save(STORAGE.products, products)) {
    products = oldProducts;
    return;
  }

  updateCartCount();
  refreshAdmin();

  showToast("Product deleted.");
}

/* ==========================================
   ADMIN PRODUCT DISPLAY
========================================== */

function renderAdminProducts() {
  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  const search = (
    $("adminProductSearch").value || ""
  ).toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    String(product.category).toLowerCase().includes(search)
  );

  $("adminProducts").innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card">

        <div class="product-image">
          ${productImageHTML(product.image)}
        </div>

        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>

          <p>${escapeHTML(product.category)}</p>

          <div class="price">${money(product.price)}</div>

          <div class="stock">
            Stock: ${product.stock}
          </div>

          <div class="product-actions">
            <button class="btn outline"
              onclick="openProductModal('${product.id}')">
              Edit
            </button>

            <button class="btn danger"
              onclick="deleteProduct('${product.id}')">
              Delete
            </button>
          </div>
        </div>
      </article>
    `).join("")
    : emptyState("No products found", "Add a product to get started.");
}

/* ==========================================
   INVENTORY
========================================== */

function renderInventory() {
  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  $("inventoryList").innerHTML = products.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Availability</th>
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
                ${product.stock <= 0
                  ? '<span class="badge red">Out of Stock</span>'
                  : product.stock <= 5
                    ? '<span class="badge">Low Stock</span>'
                    : '<span class="badge green">Available</span>'
                }
              </td>

              <td>
                <button class="btn outline small"
                  onclick="openProductModal('${product.id}')">
                  Edit Stock
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : emptyState("No inventory", "Add products to manage stock.");
}

/* ==========================================
   ADMIN ORDER MANAGEMENT
========================================== */

function renderAdminOrders() {
  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  const sorted = [...orders].sort((a,b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  $("adminOrders").innerHTML = sorted.length
    ? orderTable(sorted, true)
    : emptyState("No customer orders", "New purchases will appear here.");
}

function orderTable(list, actions = false) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            ${actions ? "<th>Actions</th>" : ""}
          </tr>
        </thead>

        <tbody>
          ${list.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${dateText(order.createdAt)}</td>
              <td>${money(order.total)}</td>
              <td>COD</td>

              <td>
                <span class="badge ${
                  order.status === "Completed" ? "green" :
                  order.status === "Cancelled" ? "red" : ""
                }">
                  ${escapeHTML(order.status)}
                </span>
              </td>

              ${actions ? `
                <td>
                  <button class="btn outline small"
                    onclick="viewReceipt('${order.id}')">
                    Receipt
                  </button>

                  <select
                    aria-label="Order status"
                    onchange="updateOrderStatus('${order.id}',this.value)">
                    ${[
                      "Pending",
                      "Processing",
                      "Completed",
                      "Cancelled"
                    ].map(status => `
                      <option value="${status}"
                        ${order.status === status ? "selected" : ""}>
                        ${status}
                      </option>
                    `).join("")}
                  </select>
                </td>
              ` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ==========================================
   UPDATE ORDER STATUS
========================================== */

function updateOrderStatus(id, status) {
  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  const order = orders.find(item => item.id === id);

  if (!order) return;

  const allowed = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
  ];

  if (!allowed.includes(status)) return;

  const oldStatus = order.status;

  if (oldStatus === status) return;

  const oldProducts = products.map(product => ({...product}));

  if (status === "Cancelled" && oldStatus !== "Cancelled") {
    (order.items || []).forEach(item => {
      const product = products.find(
        product => product.id === item.productId
      );

      if (product) {
        product.stock += Number(item.quantity);
      }
    });
  }

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    for (const item of order.items || []) {
      const product = products.find(
        product => product.id === item.productId
      );

      if (!product || product.stock < item.quantity) {
        showToast("Not enough stock to restore this order.");
        renderAdminOrders();
        return;
      }
    }

    order.items.forEach(item => {
      const product = products.find(
        product => product.id === item.productId
      );

      product.stock -= item.quantity;
    });
  }

  const oldOrderStatus = oldStatus;
  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (
    !save(STORAGE.orders, orders) ||
    !save(STORAGE.products, products)
  ) {
    order.status = oldOrderStatus;
    products = oldProducts;

    save(STORAGE.orders, orders);
    save(STORAGE.products, products);

    renderAdminOrders();
    return;
  }

  refreshAdmin();
  showToast("Order status updated.");
}

/* ==========================================
   USER MANAGEMENT
========================================== */

function renderUsers() {
  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  const customers = users.filter(user =>
    user.role === "customer"
  );

  $("adminUsers").innerHTML = customers.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Joined</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${customers.map(user => `
            <tr>
              <td>${escapeHTML(user.name)}</td>
              <td>${escapeHTML(user.username)}</td>
              <td>${escapeHTML(user.phone || "Not provided")}</td>
              <td>${escapeHTML(user.address || "Not provided")}</td>
              <td>${dateText(user.createdAt)}</td>
              <td>
                <button class="btn danger small"
                  onclick="deleteUser('${user.id}')">
                  Delete
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : emptyState("No customers yet", "Registered accounts will appear here.");
}

function deleteUser(id) {
  if (!currentUser || currentUser.role !== "admin") return;

  const user = users.find(item => item.id === id);

  if (!user || user.role !== "customer") return;

  if (!confirm("Delete customer account for " + user.name + "?")) return;

  const oldUsers = [...users];

  users = users.filter(item => item.id !== id);

  if (!save(STORAGE.users, users)) {
    users = oldUsers;
    return;
  }

  renderUsers();
  renderDashboard();

  showToast("Customer account deleted.");
}

/* ==========================================
   ADMIN SETTINGS
========================================== */

function loadSettings() {
  if (!currentUser || currentUser.role !== "admin") return;

  const admin = users.find(user =>
    user.id === currentUser.id
  );

  if (!admin) return;

  $("settingsUsername").value = admin.username;
  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  $("settingsMessage").textContent = "";
}

function saveSettings(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "admin") return;

  refreshData();

  const admin = users.find(user =>
    user.id === currentUser.id
  );

  if (!admin) return;

  const username = $("settingsUsername").value.trim();
  const password = $("settingsPassword").value;
  const confirm = $("settingsConfirm").value;

  if (username.length < 3) {
    $("settingsMessage").textContent =
      "Username must have at least 3 characters.";
    return;
  }

  if (users.some(user =>
    user.id !== admin.id &&
    String(user.username).toLowerCase() === username.toLowerCase()
  )) {
    $("settingsMessage").textContent =
      "Username is already in use.";
    return;
  }

  if (password && password.length < 6) {
    $("settingsMessage").textContent =
      "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("settingsMessage").textContent =
      "Passwords do not match.";
    return;
  }

  const oldUsername = admin.username;
  const oldPassword = admin.password;

  admin.username = username;

  if (password) admin.password = password;

  if (!save(STORAGE.users, users)) {
    admin.username = oldUsername;
    admin.password = oldPassword;
    return;
  }

  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";

  $("headerUser").textContent = admin.name + " (admin)";

  $("settingsMessage").textContent =
    "Admin settings saved successfully.";
}

/* ==========================================
   CUSTOMER SHOP
========================================== */

function renderShop() {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const search = (
    $("productSearch").value || ""
  ).toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    String(product.category).toLowerCase().includes(search)
  );

  $("shopProducts").innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card">

        <div class="product-image">
          ${productImageHTML(product.image)}
        </div>

        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>

          <p>${escapeHTML(product.description || product.category)}</p>

          <div class="price">${money(product.price)}</div>

          <div class="stock">
            ${product.stock > 0
              ? product.stock + " available"
              : "Out of stock"}
          </div>

          <label class="quantity-label"
            for="qty-${product.id}">Quantity</label>

          <input
            id="qty-${product.id}"
            class="product-quantity"
            type="number"
            min="1"
            max="${product.stock}"
            value="1"
            ${product.stock <= 0 ? "disabled" : ""}
          >

          <div class="product-actions">
            <button class="btn primary"
              ${product.stock <= 0 ? "disabled" : ""}
              onclick="addToCart('${product.id}')">
              Add to Cart
            </button>

            <button class="btn outline"
              ${product.stock <= 0 ? "disabled" : ""}
              onclick="buyNow('${product.id}')">
              Buy Now
            </button>
          </div>
        </div>

      </article>
    `).join("")
    : emptyState("No flowers found", "Try another search.");
}

/* ==========================================
   QUANTITY VALIDATION
========================================== */

function getSelectedQuantity(id, stock) {
  const field = $("qty-" + id);

  if (!field) return null;

  const quantity = Number(field.value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    showToast("Quantity must be at least 1.");
    field.value = 1;
    return null;
  }

  if (quantity > stock) {
    showToast("Only " + stock + " available in stock.");
    field.value = stock;
    return null;
  }

  return quantity;
}

/* ==========================================
   ADD TO CART
========================================== */

function addToCart(id) {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const product = products.find(item => item.id === id);

  if (!product || product.stock <= 0) {
    showToast("Product is unavailable.");
    return;
  }

  const quantity = getSelectedQuantity(id, product.stock);

  if (quantity === null) return;

  const item = cart.find(entry => entry.productId === id);
  const existingQuantity = item ? item.quantity : 0;

  if (existingQuantity + quantity > product.stock) {
    showToast("Not enough stock for this quantity.");
    return;
  }

  if (item) {
    item.quantity += quantity;
  } else {
    cart.push({
      productId: id,
      quantity
    });
  }

  updateCartCount();
  showToast(quantity + " item(s) added to your cart.");
}

/* ==========================================
   BUY NOW
========================================== */

function buyNow(id) {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const product = products.find(item => item.id === id);

  if (!product || product.stock <= 0) return;

  const quantity = getSelectedQuantity(id, product.stock);

  if (quantity === null) return;

  checkoutItems = [{
    productId: id,
    quantity
  }];

  openCheckout();
}

/* ==========================================
   CART COUNT
========================================== */

function updateCartCount() {
  const count = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  $("cartCount").textContent = count;
}

/* ==========================================
   CHANGE CART QUANTITY
========================================== */

function changeCartQuantity(id, quantity) {
  const item = cart.find(entry => entry.productId === id);
  const product = products.find(entry => entry.id === id);

  if (!item || !product) return;

  quantity = Number(quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    showToast("Minimum quantity is 1.");
    renderCart();
    return;
  }

  if (quantity > product.stock) {
    showToast("Only " + product.stock + " available.");
    renderCart();
    return;
  }

  item.quantity = quantity;

  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.productId !== id);

  updateCartCount();
  renderCart();

  showToast("Item removed from cart.");
}

/* ==========================================
   RENDER CART
========================================== */

function renderCart() {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  cart = cart.filter(item =>
    products.some(product => product.id === item.productId)
  );

  if (!cart.length) {
    $("cartContent").innerHTML = emptyState(
      "Your cart is empty",
      "Browse our flowers and add your favorites."
    );

    updateCartCount();
    return;
  }

  const total = cart.reduce((sum, item) => {
    const product = products.find(product =>
      product.id === item.productId
    );

    return sum + product.price * item.quantity;
  }, 0);

  $("cartContent").innerHTML = `
    ${cart.map(item => {
      const product = products.find(product =>
        product.id === item.productId
      );

      return `
        <div class="cart-row">
          <div>
            <strong>${escapeHTML(product.name)}</strong>
            <p class="muted">${money(product.price)} each</p>
            <span class="stock">${product.stock} available</span>
          </div>

          <input
            class="qty-input"
            type="number"
            min="1"
            max="${product.stock}"
            value="${item.quantity}"
            onchange="changeCartQuantity('${product.id}',this.value)"
          >

          <strong>${money(product.price * item.quantity)}</strong>

          <button class="btn danger small"
            onclick="removeFromCart('${product.id}')">
            Remove
          </button>
        </div>
      `;
    }).join("")}

    <div class="cart-total">
      <p>Total Amount</p>
      <strong>${money(total)}</strong>
      <p class="muted">Payment: Cash on Delivery</p>

      <button class="btn primary"
        onclick="checkoutCart()">
        Proceed to Checkout
      </button>
    </div>
  `;

  updateCartCount();
}

/* ==========================================
   CHECKOUT CART
========================================== */

function checkoutCart() {
  if (!cart.length) {
    showToast("Your cart is empty.");
    return;
  }

  checkoutItems = cart.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));

  openCheckout();
}

/* ==========================================
   OPEN CHECKOUT
========================================== */

function openCheckout() {
  if (!currentUser || !checkoutItems.length) return;

  refreshData();

  for (const item of checkoutItems) {
    const product = products.find(product =>
      product.id === item.productId
    );

    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > product.stock
    ) {
      showToast("One or more items are unavailable.");
      return;
    }
  }

  $("checkoutName").value = currentUser.name || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  const total = checkoutItems.reduce((sum, item) => {
    const product = products.find(product =>
      product.id === item.productId
    );

    return sum + product.price * item.quantity;
  }, 0);

  $("checkoutSummary").innerHTML = `
    <strong>Order Summary</strong>

    ${checkoutItems.map(item => {
      const product = products.find(product =>
        product.id === item.productId
      );

      return `
        <div class="receipt-line">
          <span>
            ${escapeHTML(product.name)} × ${item.quantity}
          </span>
          <strong>
            ${money(product.price * item.quantity)}
          </strong>
        </div>
      `;
    }).join("")}

    <div class="receipt-total">
      Total: ${money(total)}
    </div>
  `;

  $("checkoutModal").classList.remove("hidden");
}

/* ==========================================
   PLACE ORDER
========================================== */

function placeOrder(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const account = users.find(user =>
    user.id === currentUser.id
  );

  if (!account) {
    logout();
    return;
  }

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (!name || !phone || !address) {
    showToast("Please complete your delivery details.");
    return;
  }

  if (!checkoutItems.length) {
    showToast("Your order is empty.");
    return;
  }

  // Validate every item before deducting stock.
  for (const item of checkoutItems) {
    const product = products.find(product =>
      product.id === item.productId
    );

    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > product.stock
    ) {
      showToast("Stock changed. Please review your order.");
      return;
    }
  }

  const orderItems = checkoutItems.map(item => {
    const product = products.find(product =>
      product.id === item.productId
    );

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  });

  const total = orderItems.reduce(
    (sum, item) => sum + item.subtotal, 0
  );

  const order = {
    id: "PV-" + Date.now().toString().slice(-8),
    userId: currentUser.id,
    customerName: name,
    phone,
    address,
    items: orderItems,
    total,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  const oldProducts = products.map(product => ({...product}));

  orderItems.forEach(item => {
    const product = products.find(product =>
      product.id === item.productId
    );

    product.stock -= item.quantity;
  });

  orders.push(order);

  account.name = name;
  account.phone = phone;
  account.address = address;

  // Save all data and roll back if storage fails.
  const usersSaved = save(STORAGE.users, users);
  const ordersSaved = usersSaved && save(STORAGE.orders, orders);
  const productsSaved = ordersSaved && save(STORAGE.products, products);

  if (!productsSaved) {
    products = oldProducts;
    orders = orders.filter(item => item.id !== order.id);

    save(STORAGE.products, products);
    save(STORAGE.orders, orders);

    showToast("Order could not be saved. Please try again.");
    return;
  }

  currentUser = account;

  cart = [];
  checkoutItems = [];

  updateCartCount();

  $("checkoutForm").reset();
  closeModal("checkoutModal");

  viewReceipt(order.id);

  showToast("Order placed successfully!");
}

/* ==========================================
   CUSTOMER ORDERS
========================================== */

function renderCustomerOrders() {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const myOrders = orders
    .filter(order => order.userId === currentUser.id)
    .sort((a,b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

  $("customerOrders").innerHTML = myOrders.length
    ? myOrders.map(order => `
      <div class="panel" style="margin-bottom:15px">

        <div class="page-heading">
          <div>
            <h3>${escapeHTML(order.id)}</h3>
            <p class="muted">${dateText(order.createdAt)}</p>
          </div>

          <span class="badge ${
            order.status === "Completed" ? "green" :
            order.status === "Cancelled" ? "red" : ""
          }">
            ${escapeHTML(order.status)}
          </span>
        </div>

        ${(order.items || []).map(item => `
          <div class="receipt-line">
            <span>
              ${escapeHTML(item.name)} × ${item.quantity}
            </span>
            <strong>${money(item.subtotal)}</strong>
          </div>
        `).join("")}

        <div class="cart-total">
          <strong>${money(order.total)}</strong>
        </div>

        <p class="muted">Payment: Cash on Delivery</p>

        <button class="btn outline small"
          onclick="viewReceipt('${order.id}')">
          View Receipt
        </button>

      </div>
    `).join("")
    : emptyState("No orders yet", "Your purchases will appear here.");
}

/* ==========================================
   CUSTOMER RECEIPTS
========================================== */

function renderCustomerReceipts() {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const myOrders = orders
    .filter(order => order.userId === currentUser.id)
    .sort((a,b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

  $("customerReceipts").innerHTML = myOrders.length
    ? myOrders.map(order => `
      <div class="panel" style="margin-bottom:15px">
        <h3>Receipt: ${escapeHTML(order.id)}</h3>

        <p class="muted">${dateText(order.createdAt)}</p>

        <div class="receipt-line">
          <span>Total Amount</span>
          <strong>${money(order.total)}</strong>
        </div>

        <p>
          <span class="badge ${
            order.status === "Completed" ? "green" :
            order.status === "Cancelled" ? "red" : ""
          }">
            ${escapeHTML(order.status)}
          </span>
        </p>

        <button class="btn primary small"
          onclick="viewReceipt('${order.id}')">
          View / Print Receipt
        </button>
      </div>
    `).join("")
    : emptyState("No receipts yet", "Receipts appear after placing an order.");
}

/* ==========================================
   CUSTOMER TRANSACTIONS
========================================== */

function renderCustomerTransactions() {
  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const myOrders = orders
    .filter(order => order.userId === currentUser.id)
    .sort((a,b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

  $("customerTransactions").innerHTML = myOrders.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>

          <tbody>
            ${myOrders.map(order => `
              <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${dateText(order.createdAt)}</td>
                <td>COD</td>
                <td>${money(order.total)}</td>
                <td>
                  <span class="badge ${
                    order.status === "Completed" ? "green" :
                    order.status === "Cancelled" ? "red" : ""
                  }">
                    ${escapeHTML(order.status)}
                  </span>
                </td>
                <td>
                  <button class="btn outline small"
                    onclick="viewReceipt('${order.id}')">
                    View
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : emptyState("No transactions yet", "Your transactions will appear here.");
}

/* ==========================================
   VIEW RECEIPT
========================================== */

function viewReceipt(id) {
  if (!currentUser) return;

  refreshData();

  const order = orders.find(item => item.id === id);

  if (!order) return;

  if (
    currentUser.role === "customer" &&
    order.userId !== currentUser.id
  ) {
    showToast("You cannot view this receipt.");
    return;
  }

  $("receiptContent").innerHTML = `
    <div class="receipt">

      <h2>✿ Petal & Vine</h2>
      <p>Flower Boutique Receipt</p>

      <hr>

      <div class="receipt-line">
        <span>Order ID</span>
        <strong>${escapeHTML(order.id)}</strong>
      </div>

      <div class="receipt-line">
        <span>Date</span>
        <span>${dateText(order.createdAt)}</span>
      </div>

      <div class="receipt-line">
        <span>Customer</span>
        <span>${escapeHTML(order.customerName)}</span>
      </div>

      <div class="receipt-line">
        <span>Contact</span>
        <span>${escapeHTML(order.phone)}</span>
      </div>

      <div class="receipt-line">
        <span>Address</span>
        <span>${escapeHTML(order.address)}</span>
      </div>

      <div class="receipt-line">
        <span>Payment</span>
        <span>Cash on Delivery</span>
      </div>

      <div class="receipt-line">
        <span>Status</span>
        <strong>${escapeHTML(order.status)}</strong>
      </div>

      <hr>

      <h3>Purchased Items</h3>

      ${(order.items || []).map(item => `
        <div class="receipt-line">
          <span>
            ${escapeHTML(item.name)} × ${item.quantity}
            <br>
            <small>${money(item.price)} each</small>
          </span>

          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="receipt-total">
        Total: ${money(order.total)}
      </div>

      <hr>

      <p>Thank you for shopping with us!</p>
      <p class="muted">Petal & Vine Flower Boutique</p>

    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

/* ==========================================
   CUSTOMER PROFILE
========================================== */

function loadProfile() {
  if (!currentUser || currentUser.role !== "customer") return;

  $("profileName").value = currentUser.name || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";
  $("profilePassword").value = "";

  $("profileMessage").textContent = "";
}

function updateProfile(event) {
  event.preventDefault();

  if (!currentUser || currentUser.role !== "customer") return;

  refreshData();

  const user = users.find(item => item.id === currentUser.id);

  if (!user) return;

  const name = $("profileName").value.trim();
  const username = $("profileUsername").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  const password = $("profilePassword").value;

  if (name.length < 2 || username.length < 3) {
    $("profileMessage").textContent =
      "Please enter a valid name and username.";
    return;
  }

  if (!phone || !address) {
    $("profileMessage").textContent =
      "Please complete your contact details.";
    return;
  }

  if (username.toLowerCase() === "admin") {
    $("profileMessage").textContent =
      "That username is reserved.";
    return;
  }

  if (users.some(item =>
    item.id !== user.id &&
    String(item.username).toLowerCase() === username.toLowerCase()
  )) {
    $("profileMessage").textContent =
      "Username is already taken.";
    return;
  }

  if (password && password.length < 6) {
    $("profileMessage").textContent =
      "Password must have at least 6 characters.";
    return;
  }

  const previous = {...user};

  user.name = name;
  user.username = username;
  user.phone = phone;
  user.address = address;

  if (password) user.password = password;

  if (!save(STORAGE.users, users)) {
    Object.assign(user, previous);
    return;
  }

  currentUser = user;

  $("welcomeText").textContent = "Hello, " + name;
  $("headerUser").textContent = name + " (customer)";

  $("profilePassword").value = "";

  $("profileMessage").textContent =
    "Profile updated successfully.";
}

/* ==========================================
   MODALS
========================================== */

function closeModal(id) {
  const modal = $(id);

  if (modal) modal.classList.add("hidden");

  if (id === "checkoutModal") {
    checkoutItems = [];
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.add("hidden");
  });

  checkoutItems = [];
}

/* ==========================================
   EMPTY STATE
========================================== */

function emptyState(title, description) {
  return `
    <div class="empty-state">
      <strong>${escapeHTML(title)}</strong>
      ${escapeHTML(description)}
    </div>
  `;
}

/* ==========================================
   TOAST
========================================== */

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* ==========================================
   START WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", initialize);
