"use strict";

/* =========================================
   PETAL & VINE - COMPLETE WEBSITE SCRIPT
   ========================================= */

const STORAGE_KEY = "petalVineDataV3";
const SESSION_KEY = "petalVineSessionV3";

const starterProducts = [
  { id: "P001", name: "Classic Red Roses", category: "Roses", price: 850, stock: 20, description: "A beautiful bouquet of classic red roses.", image: "🌹" },
  { id: "P002", name: "Pink Dream", category: "Bouquet", price: 950, stock: 15, description: "Soft pink flowers for a special person.", image: "🌸" },
  { id: "P003", name: "White Elegance", category: "Bouquet", price: 1100, stock: 12, description: "Elegant white blooms for every occasion.", image: "💐" },
  { id: "P004", name: "Sunshine Bouquet", category: "Sunflowers", price: 750, stock: 18, description: "Bright sunflowers to make someone smile.", image: "🌻" },
  { id: "P005", name: "Purple Romance", category: "Bouquet", price: 1200, stock: 10, description: "A romantic arrangement of purple flowers.", image: "🪻" },
  { id: "P006", name: "Baby's Breath", category: "Flowers", price: 450, stock: 25, description: "Delicate baby's breath flowers.", image: "🤍" },
  { id: "P007", name: "Tulip Love", category: "Tulips", price: 1000, stock: 14, description: "Fresh and colorful tulips.", image: "🌷" },
  { id: "P008", name: "Garden Mix", category: "Bouquet", price: 900, stock: 16, description: "A colorful mix of garden flowers.", image: "💐" },
  { id: "P009", name: "Pink Tulips", category: "Tulips", price: 1050, stock: 11, description: "Lovely pink tulips in a bouquet.", image: "🌷" },
  { id: "P010", name: "Golden Sunflowers", category: "Sunflowers", price: 800, stock: 13, description: "Golden sunflowers arranged beautifully.", image: "🌻" },
  { id: "P011", name: "Blush Roses", category: "Roses", price: 980, stock: 17, description: "Soft blush roses for a thoughtful gift.", image: "🌹" },
  { id: "P012", name: "Lavender Fields", category: "Flowers", price: 680, stock: 19, description: "A lovely lavender-inspired arrangement.", image: "💜" },
  { id: "P013", name: "Mixed Roses", category: "Roses", price: 1300, stock: 9, description: "A colorful arrangement of mixed roses.", image: "🌹" },
  { id: "P014", name: "Sweet Surprise", category: "Bouquet", price: 1150, stock: 8, description: "A sweet surprise bouquet for celebrations.", image: "🎀" },
  { id: "P015", name: "Luxury Bloom Box", category: "Flower Box", price: 1600, stock: 7, description: "Premium flowers in an elegant flower box.", image: "🌺" }
];

function initialData() {
  return {
    admin: {
      username: "admin",
      password: "Admin123",
      name: "Administrator"
    },
    products: starterProducts.map(product => ({ ...product })),
    users: [],
    orders: [],
    settings: {
      shopName: "Petal & Vine",
      currency: "₱"
    }
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return initialData();

    const parsed = JSON.parse(saved);
    const defaults = initialData();

    return {
      ...defaults,
      ...parsed,
      admin: { ...defaults.admin, ...(parsed.admin || {}) },
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      products: Array.isArray(parsed.products) ? parsed.products : defaults.products,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : []
    };
  } catch (error) {
    console.error("Could not load saved website data:", error);
    return initialData();
  }
}

let data = loadData();
let currentUser = null;
let currentPage = "dashboard";
let cart = [];
let selectedImage = "";

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(error);
    toast("Storage is full. Try using a smaller product image.");
    return false;
  }
}

function money(value) {
  return data.settings.currency + Number(value || 0).toLocaleString("en-PH", {
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

function getUserName() {
  return currentUser?.name || currentUser?.username || "Customer";
}

function isAdmin() {
  return currentUser?.role === "admin";
}

function getProduct(id) {
  return data.products.find(product => product.id === id);
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function makeId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase();
}

/* =========================================
   LOGIN AND REGISTRATION
   ========================================= */

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

document.getElementById("loginTab").addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
});

document.getElementById("registerTab").addEventListener("click", () => {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  document.getElementById("registerTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
});

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (
    username.toLowerCase() === data.admin.username.toLowerCase() &&
    password === data.admin.password
  ) {
    currentUser = {
      username: data.admin.username,
      name: data.admin.name,
      role: "admin"
    };

    startApp();
    return;
  }

  const user = data.users.find(item =>
    (item.username.toLowerCase() === username.toLowerCase() ||
     item.email.toLowerCase() === username.toLowerCase()) &&
    item.password === password
  );

  if (!user) {
    toast("Incorrect username/email or password.");
    return;
  }

  currentUser = {
    ...user,
    role: "customer"
  };

  startApp();
});

registerForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!name || !email || !username || !password) {
    toast("Please complete all fields.");
    return;
  }

  const duplicate = data.users.some(user =>
    user.email.toLowerCase() === email ||
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (
    duplicate ||
    username.toLowerCase() === data.admin.username.toLowerCase()
  ) {
    toast("That email or username is already registered.");
    return;
  }

  const user = {
    id: makeId("U"),
    name,
    email,
    username,
    password,
    createdAt: new Date().toISOString()
  };

  data.users.push(user);
  saveData();

  currentUser = { ...user, role: "customer" };
  registerForm.reset();

  startApp();
  toast("Your account has been created!");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  cart = [];
  currentPage = "dashboard";

  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  loginForm.reset();
  registerForm.reset();

  toast("You have logged out.");
});

/* =========================================
   APP STARTUP AND NAVIGATION
   ========================================= */

function startApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  document.getElementById("sideUser").innerHTML = `
    <b>${escapeHTML(getUserName())}</b>
    <small>${isAdmin() ? "Administrator" : "Customer"}</small>
  `;

  document.getElementById("topUser").textContent =
    isAdmin() ? "Admin account" : "Welcome, " + getUserName();

  buildNavigation();
  showPage("dashboard");
}

function buildNavigation() {
  const adminLinks = [
    ["dashboard", "⌂ Dashboard"],
    ["shop", "✿ Shop"],
    ["inventory", "▤ Inventory"],
    ["orders", "▣ Orders"],
    ["receipts", "▧ Receipts"],
    ["customers", "♙ Customers"],
    ["reports", "▥ Reports"],
    ["settings", "⚙ Settings"]
  ];

  const customerLinks = [
    ["dashboard", "⌂ Home"],
    ["shop", "✿ Shop"],
    ["cart", "🛒 My Cart"],
    ["myorders", "▣ My Orders"]
  ];

  const links = isAdmin() ? adminLinks : customerLinks;

  document.getElementById("navigation").innerHTML = links.map(([page, label]) => `
    <button type="button"
      class="nav-btn ${currentPage === page ? "active" : ""}"
      data-page="${page}">
      ${label}
      ${page === "cart" && cart.length ? ` (${cart.length})` : ""}
    </button>
  `).join("");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });
}

function showPage(page) {
  const allowed = isAdmin()
    ? ["dashboard", "shop", "inventory", "orders", "receipts", "customers", "reports", "settings"]
    : ["dashboard", "shop", "cart", "myorders"];

  if (!allowed.includes(page)) page = "dashboard";

  currentPage = page;

  const titles = {
    dashboard: "Dashboard",
    shop: "Flower Shop",
    inventory: "Product Inventory",
    orders: "Orders",
    receipts: "Receipts",
    customers: "Customers",
    reports: "Reports",
    settings: "Settings",
    cart: "My Shopping Cart",
    myorders: "My Orders"
  };

  document.getElementById("pageTitle").textContent = titles[page];
  buildNavigation();

  const renderers = {
    dashboard: renderDashboard,
    shop: renderShop,
    inventory: renderInventory,
    orders: renderOrders,
    receipts: renderReceipts,
    customers: renderCustomers,
    reports: renderReports,
    settings: renderSettings,
    cart: renderCart,
    myorders: renderMyOrders
  };

  renderers[page]();
}

/* =========================================
   DASHBOARD
   ========================================= */

function renderDashboard() {
  const content = document.getElementById("pageContent");

  if (isAdmin()) {
    const totalSales = data.orders
      .filter(order => order.status !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    const pending = data.orders.filter(order => order.status === "Pending").length;
    const lowStock = data.products.filter(product => product.stock <= 5).length;

    content.innerHTML = `
      <div class="welcome-panel">
        <h2>Welcome back, ${escapeHTML(getUserName())}!</h2>
        <p>Manage your flowers, customers, and orders in one place.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><small>Total Products</small><h3>${data.products.length}</h3></div>
        <div class="stat-card"><small>Total Customers</small><h3>${data.users.length}</h3></div>
        <div class="stat-card"><small>Total Orders</small><h3>${data.orders.length}</h3></div>
        <div class="stat-card"><small>Total Sales</small><h3>${money(totalSales)}</h3></div>
        <div class="stat-card"><small>Pending Orders</small><h3>${pending}</h3></div>
        <div class="stat-card"><small>Low Stock Items</small><h3>${lowStock}</h3></div>
      </div>

      <div class="panel">
        <div class="panel-heading"><h3>Recent Orders</h3></div>
        ${ordersTable(data.orders.slice().reverse().slice(0, 5))}
      </div>

      <div class="panel">
        <div class="panel-heading"><h3>Shop Products</h3><button class="secondary-btn" onclick="showPage('shop')">View shop</button></div>
        ${productCards(data.products.slice(0, 3), false)}
      </div>
    `;
  } else {
    const myOrders = data.orders.filter(order => order.userId === currentUser.id);

    content.innerHTML = `
      <div class="welcome-panel">
        <h2>Welcome, ${escapeHTML(getUserName())}!</h2>
        <p>Find the perfect flowers for every beautiful moment.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><small>Available Products</small><h3>${data.products.filter(p => p.stock > 0).length}</h3></div>
        <div class="stat-card"><small>My Orders</small><h3>${myOrders.length}</h3></div>
      </div>

      <div class="panel">
        <div class="panel-heading">
          <h3>Explore our flowers</h3>
          <button class="secondary-btn" onclick="showPage('shop')">Shop now</button>
        </div>
        ${productCards(data.products.slice(0, 6), true)}
      </div>
    `;
  }
}

/* =========================================
   PRODUCT DISPLAY AND SHOP
   ========================================= */

function productImage(product) {
  const image = product.image || "💐";

  if (String(image).startsWith("data:image/") ||
      String(image).startsWith("https://") ||
      String(image).startsWith("http://")) {
    return `<img class="product-image" src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">`;
  }

  return `<div class="product-image">${escapeHTML(image)}</div>`;
}

function productCards(products, canBuy) {
  if (!products.length) return `<div class="empty">No products found.</div>`;

  return `<div class="product-grid">
    ${products.map(product => `
      <article class="product-card">
        ${productImage(product)}
        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description || "Beautiful flowers for every occasion.")}</p>
          <div class="product-meta">
            <span class="price">${money(product.price)}</span>
            <span class="stock">${product.stock} in stock</span>
          </div>
          <div class="product-actions">
            ${canBuy ? `
              <button class="primary-btn" onclick="addToCart('${product.id}')"
                ${product.stock < 1 ? "disabled" : ""}>
                ${product.stock < 1 ? "Out of stock" : "Add to cart"}
              </button>
            ` : ""}
            ${isAdmin() ? `
              <button class="small-btn" onclick="editProduct('${product.id}')">Edit</button>
            ` : ""}
          </div>
        </div>
      </article>
    `).join("")}
  </div>`;
}

function renderShop() {
  const content = document.getElementById("pageContent");

  content.innerHTML = `
    <div class="toolbar">
      <input id="shopSearch" placeholder="Search flowers...">
      <select id="shopCategory">
        <option value="">All categories</option>
        ${[...new Set(data.products.map(p => p.category))].map(category =>
          `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
        ).join("")}
      </select>
    </div>
    <div id="shopProducts">${productCards(data.products, !isAdmin())}</div>
  `;

  const search = document.getElementById("shopSearch");
  const category = document.getElementById("shopCategory");

  function filterProducts() {
    const term = search.value.toLowerCase();
    const selected = category.value;

    const filtered = data.products.filter(product =>
      (product.name.toLowerCase().includes(term) ||
       product.description.toLowerCase().includes(term)) &&
      (!selected || product.category === selected)
    );

    document.getElementById("shopProducts").innerHTML =
      productCards(filtered, !isAdmin());
  }

  search.addEventListener("input", filterProducts);
  category.addEventListener("change", filterProducts);
}

/* =========================================
   CART AND QUANTITY
   ========================================= */

function addToCart(productId) {
  const product = getProduct(productId);

  if (!product || product.stock < 1) {
    toast("This product is out of stock.");
    return;
  }

  const existing = cart.find(item => item.productId === productId);
  const currentQuantity = existing ? existing.quantity : 0;

  if (currentQuantity >= product.stock) {
    toast("You cannot add more than the available stock.");
    return;
  }

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  buildNavigation();
  toast("Added to your cart.");
}

function changeQuantity(productId, change) {
  const item = cart.find(entry => entry.productId === productId);
  const product = getProduct(productId);

  if (!item || !product) return;

  const nextQuantity = item.quantity + change;

  if (nextQuantity < 1) {
    cart = cart.filter(entry => entry.productId !== productId);
  } else if (nextQuantity > product.stock) {
    toast("You cannot order more than the available stock.");
    return;
  } else {
    item.quantity = nextQuantity;
  }

  renderCart();
  buildNavigation();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  renderCart();
  buildNavigation();
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCart() {
  const content = document.getElementById("pageContent");

  if (!cart.length) {
    content.innerHTML = `
      <div class="panel empty">
        <h3>Your cart is empty.</h3>
        <p>Browse our flower collection and add something beautiful.</p>
        <button class="primary-btn" onclick="showPage('shop')">Browse flowers</button>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${cart.map(item => {
              const product = getProduct(item.productId);
              if (!product) return "";

              return `
                <tr>
                  <td>${escapeHTML(product.name)}</td>
                  <td>${money(product.price)}</td>
                  <td>
                    <button class="small-btn" onclick="changeQuantity('${product.id}', -1)">−</button>
                    <b>${item.quantity}</b>
                    <button class="small-btn" onclick="changeQuantity('${product.id}', 1)"
                      ${item.quantity >= product.stock ? "disabled" : ""}>+</button>
                  </td>
                  <td>${money(product.price * item.quantity)}</td>
                  <td><button class="danger-btn" onclick="removeFromCart('${product.id}')">Remove</button></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div style="text-align:right;padding-top:20px">
        <h3>Total: <span class="price">${money(cartTotal())}</span></h3>
        <button class="primary-btn" onclick="checkout()">Place order</button>
      </div>
    </div>
  `;
}

/* =========================================
   CHECKOUT AND ORDERS
   ========================================= */

function checkout() {
  if (!cart.length) {
    toast("Your cart is empty.");
    return;
  }

  for (const item of cart) {
    const product = getProduct(item.productId);

    if (!product || item.quantity < 1 || item.quantity > product.stock) {
      toast("One or more items no longer have enough stock.");
      renderCart();
      return;
    }
  }

  const total = cartTotal();

  const order = {
    id: makeId("ORD"),
    userId: currentUser.id,
    customerName: currentUser.name,
    customerEmail: currentUser.email,
    items: cart.map(item => {
      const product = getProduct(item.productId);

      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    }),
    total,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  // Reduce stock only after a valid checkout.
  cart.forEach(item => {
    const product = getProduct(item.productId);
    product.stock -= item.quantity;
  });

  data.orders.push(order);

  if (!saveData()) {
    // Restore stock and cancel checkout if storage failed.
    cart.forEach(item => {
      const product = getProduct(item.productId);
      if (product) product.stock += item.quantity;
    });

    data.orders = data.orders.filter(item => item.id !== order.id);
    return;
  }

  cart = [];
  buildNavigation();

  toast("Your order has been placed!");
  showReceipt(order.id);
}

function ordersTable(orders) {
  if (!orders.length) return `<div class="empty">No orders yet.</div>`;

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${formatDate(order.createdAt)}</td>
              <td>${money(order.total)}</td>
              <td>${escapeHTML(order.status)}</td>
              <td>
                <button class="small-btn" onclick="showReceipt('${order.id}')">Receipt</button>
                ${isAdmin() ? `
                  <select aria-label="Order status" onchange="updateOrderStatus('${order.id}', this.value)">
                    ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
                      `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                    ).join("")}
                  </select>
                ` : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderOrders() {
  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-heading"><h3>All Customer Orders</h3></div>
      ${ordersTable(data.orders.slice().reverse())}
    </div>
  `;
}

function renderMyOrders() {
  const orders = data.orders
    .filter(order => order.userId === currentUser.id)
    .reverse();

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-heading"><h3>My Orders</h3></div>
      ${ordersTable(orders)}
    </div>
  `;
}

function updateOrderStatus(orderId, status) {
  const order = data.orders.find(item => item.id === orderId);
  if (!order) return;

  const allowed = ["Pending", "Processing", "Completed", "Cancelled"];
  if (!allowed.includes(status)) return;

  if (order.status === "Cancelled" && status !== "Cancelled") {
    toast("Cancelled orders cannot be reopened automatically.");
    showPage("orders");
    return;
  }

  if (status === "Cancelled" && order.status !== "Cancelled") {
    const confirmCancel = confirm("Cancel this order and return its items to stock?");
    if (!confirmCancel) {
      showPage("orders");
      return;
    }

    order.items.forEach(item => {
      const product = getProduct(item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = status;
  saveData();
  toast("Order status updated.");
  showPage("orders");
}

/* =========================================
   RECEIPTS
   ========================================= */

function showReceipt(orderId) {
  const order = data.orders.find(item => item.id === orderId);
  if (!order) {
    toast("Receipt not found.");
    return;
  }

  const receipt = document.getElementById("receiptContent");

  receipt.innerHTML = `
    <div class="receipt">
      <h2>${escapeHTML(data.settings.shopName)}</h2>
      <p>Thank you for shopping with us!</p>
      <hr>
      <p><b>Receipt:</b> ${escapeHTML(order.id)}</p>
      <p><b>Date:</b> ${formatDate(order.createdAt)}</p>
      <p><b>Customer:</b> ${escapeHTML(order.customerName)}</p>
      <p><b>Status:</b> ${escapeHTML(order.status)}</p>
      <hr>
      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <b>${money(item.subtotal)}</b>
        </div>
      `).join("")}
      <div class="receipt-total">Total: ${money(order.total)}</div>
      <hr>
      <p>We appreciate your purchase.</p>
    </div>
  `;

  document.getElementById("receiptModal").classList.remove("hidden");
}

function closeReceipt() {
  document.getElementById("receiptModal").classList.add("hidden");
}

function renderReceipts() {
  const orders = data.orders.slice().reverse();

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-heading"><h3>Customer Receipts</h3></div>
      ${orders.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Receipt / Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Receipt</th></tr></thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${escapeHTML(order.id)}</td>
                  <td>${escapeHTML(order.customerName)}</td>
                  <td>${formatDate(order.createdAt)}</td>
                  <td>${money(order.total)}</td>
                  <td><button class="small-btn" onclick="showReceipt('${order.id}')">View / Print</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty">No receipts available yet.</div>`}
    </div>
  `;
}

/* =========================================
   PRODUCT INVENTORY
   ========================================= */

function renderInventory() {
  const content = document.getElementById("pageContent");

  content.innerHTML = `
    <div class="panel">
      <div class="panel-heading">
        <h3>Manage Products</h3>
        <button class="primary-btn" onclick="openProductModal()">+ Add Product</button>
      </div>
      <div class="toolbar">
        <input id="inventorySearch" placeholder="Search products...">
      </div>
      <div id="inventoryTable"></div>
    </div>
  `;

  function drawTable() {
    const term = document.getElementById("inventorySearch").value.toLowerCase();

    const products = data.products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );

    document.getElementById("inventoryTable").innerHTML = products.length ? `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${money(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                  <button class="small-btn" onclick="editProduct('${product.id}')">Edit</button>
                  <button class="danger-btn" onclick="deleteProduct('${product.id}')">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : `<div class="empty">No products found.</div>`;
  }

  document.getElementById("inventorySearch").addEventListener("input", drawTable);
  drawTable();
}

function openProductModal(productId = "") {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  selectedImage = "";
  document.getElementById("imagePreview").classList.add("hidden");

  const product = productId ? getProduct(productId) : null;

  document.getElementById("productModalTitle").textContent =
    product ? "Edit Product" : "Add Product";

  if (product) {
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productDescription").value = product.description;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productCategory").value = product.category;
    selectedImage = product.image;

    if (String(product.image).startsWith("data:image/") ||
        String(product.image).startsWith("http")) {
      const preview = document.getElementById("imagePreview");
      preview.src = product.image;
      preview.classList.remove("hidden");
    }
  }

  document.getElementById("productModal").classList.remove("hidden");
}

function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

function editProduct(productId) {
  openProductModal(productId);
}

function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"?`)) return;

  data.products = data.products.filter(item => item.id !== productId);
  cart = cart.filter(item => item.productId !== productId);

  saveData();
  toast("Product deleted.");
  showPage("inventory");
}

document.getElementById("productImage").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("Please select an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 700 * 1024) {
    toast("Please choose an image smaller than 700 KB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedImage = reader.result;
    const preview = document.getElementById("imagePreview");
    preview.src = selectedImage;
    preview.classList.remove("hidden");
  };

  reader.onerror = () => toast("Could not read that image.");
  reader.readAsDataURL(file);
});

document.getElementById("productForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const category = document.getElementById("productCategory").value.trim() || "Flowers";

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    toast("Please enter valid product details.");
    return;
  }

  const duplicate = data.products.some(product =>
    product.id !== id && product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    toast("A product with this name already exists.");
    return;
  }

  const productData = {
    id: id || makeId("P"),
    name,
    description,
    price,
    stock,
    category,
    image: selectedImage || "💐"
  };

  if (id) {
    const index = data.products.findIndex(product => product.id === id);
    if (index !== -1) data.products[index] = productData;
  } else {
    data.products.push(productData);
  }

  if (!saveData()) return;

  closeProductModal();
  toast(id ? "Product updated!" : "Product added!");
  showPage("inventory");
});

/* =========================================
   CUSTOMER MANAGEMENT
   ========================================= */

function renderCustomers() {
  const total = data.users.length;
  const newUsers = data.users.filter(user => {
    const created = new Date(user.createdAt);
    const days = (Date.now() - created.getTime()) / 86400000;
    return days <= 30;
  }).length;

  const activeIds = new Set(data.orders.map(order => order.userId));
  const activeUsers = data.users.filter(user => activeIds.has(user.id)).length;

  document.getElementById("pageContent").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><small>Total Users</small><h3>${total}</h3></div>
      <div class="stat-card"><small>New Users (30 days)</small><h3>${newUsers}</h3></div>
      <div class="stat-card"><small>Active Buyers</small><h3>${activeUsers}</h3></div>
    </div>

    <div class="panel">
      <div class="panel-heading"><h3>Registered Customers</h3></div>
      ${total ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Registered</th><th>Orders</th></tr></thead>
            <tbody>
              ${data.users.map(user => `
                <tr>
                  <td>${escapeHTML(user.name)}</td>
                  <td>${escapeHTML(user.username)}</td>
                  <td>${escapeHTML(user.email)}</td>
                  <td>${formatDate(user.createdAt)}</td>
                  <td>${data.orders.filter(order => order.userId === user.id).length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty">No customers have registered yet.</div>`}
    </div>
  `;
}

/* =========================================
   REPORTS
   ========================================= */

function renderReports() {
  const validOrders = data.orders.filter(order => order.status !== "Cancelled");
  const sales = validOrders.reduce((sum, order) => sum + order.total, 0);
  const units = validOrders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  const productSales = {};

  validOrders.forEach(order => {
    order.items.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
    });
  });

  const popular = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  document.getElementById("pageContent").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><small>Total Sales</small><h3>${money(sales)}</h3></div>
      <div class="stat-card"><small>Valid Orders</small><h3>${validOrders.length}</h3></div>
      <div class="stat-card"><small>Items Sold</small><h3>${units}</h3></div>
      <div class="stat-card"><small>Customers</small><h3>${data.users.length}</h3></div>
    </div>

    <div class="panel">
      <div class="panel-heading"><h3>Best-Selling Products</h3></div>
      ${popular.length ? `
        <table>
          <thead><tr><th>Product</th><th>Units Sold</th></tr></thead>
          <tbody>${popular.map(([name, quantity]) => `
            <tr><td>${escapeHTML(name)}</td><td>${quantity}</td></tr>
          `).join("")}</tbody>
        </table>
      ` : `<div class="empty">No sales data yet.</div>`}
    </div>

    <div class="panel">
      <div class="panel-heading"><h3>Sales by Order</h3></div>
      ${ordersTable(data.orders.slice().reverse())}
    </div>
  `;
}

/* =========================================
   ADMIN SETTINGS
   ========================================= */

function renderSettings() {
  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-heading"><h3>Shop Settings</h3></div>
      <form id="shopSettingsForm">
        <label>Shop name</label>
        <input id="settingShopName" value="${escapeHTML(data.settings.shopName)}" required>
        <label>Currency symbol</label>
        <input id="settingCurrency" value="${escapeHTML(data.settings.currency)}" maxlength="5" required>
        <button class="primary-btn" type="submit">Save shop settings</button>
      </form>
    </div>

    <div class="panel">
      <div class="panel-heading"><h3>Admin Account Settings</h3></div>
      <form id="adminSettingsForm">
        <label>Admin display name</label>
        <input id="settingAdminName" value="${escapeHTML(data.admin.name)}" required>
        <label>Admin username</label>
        <input id="settingAdminUsername" value="${escapeHTML(data.admin.username)}" required>
        <label>New admin password</label>
        <input id="settingAdminPassword" type="password" placeholder="Enter a new password" minlength="4">
        <button class="primary-btn" type="submit">Update admin account</button>
      </form>
    </div>

    <div class="panel">
      <h3>Website Information</h3>
      <p class="muted">This website stores its information in the browser's local storage. It is a front-end demo and does not provide shared online customer accounts or secure online payments.</p>
    </div>
  `;

  document.getElementById("shopSettingsForm").addEventListener("submit", event => {
    event.preventDefault();

    data.settings.shopName =
      document.getElementById("settingShopName").value.trim();

    data.settings.currency =
      document.getElementById("settingCurrency").value.trim() || "₱";

    saveData();
    toast("Shop settings saved.");
    startApp();
    showPage("settings");
  });

  document.getElementById("adminSettingsForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("settingAdminName").value.trim();
    const username = document.getElementById("settingAdminUsername").value.trim();
    const password = document.getElementById("settingAdminPassword").value;

    if (!name || !username) {
      toast("Please enter an admin name and username.");
      return;
    }

    const usernameTaken = data.users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    );

    if (usernameTaken) {
      toast("That username is already used by a customer.");
      return;
    }

    data.admin.name = name;
    data.admin.username = username;

    if (password) data.admin.password = password;

    if (!saveData()) return;

    currentUser.name = name;
    currentUser.username = username;

    toast("Admin account updated.");
    startApp();
    showPage("settings");
  });
}

/* =========================================
   STARTUP
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("productModal").addEventListener("click", event => {
    if (event.target.id === "productModal") closeProductModal();
  });

  document.getElementById("receiptModal").addEventListener("click", event => {
    if (event.target.id === "receiptModal") closeReceipt();
  });

  // Start at the login screen.
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("mainApp").classList.add("hidden");
});
