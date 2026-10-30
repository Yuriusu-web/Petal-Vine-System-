
"use strict";

/* ================================
   PETAL & VINE - MAIN APPLICATION
================================ */

const STORAGE = {
  products: "pv_products",
  users: "pv_users",
  orders: "pv_orders",
  settings: "pv_settings",
  session: "pv_session",
  carts: "pv_carts"
};

const $ = id => document.getElementById(id);

const money = amount => "₱" + Number(amount || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[char]));

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Storage read error:", error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage write error:", error);
    alert("Unable to save. Your browser storage may be full. Try using a smaller product image.");
    return false;
  }
}

function createId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const defaultProducts = [
  { id: "p1", name: "Classic Red Roses", category: "Roses", price: 850, stock: 20, description: "A beautiful bouquet of classic red roses.", image: "" },
  { id: "p2", name: "Pink Romance", category: "Bouquet", price: 950, stock: 15, description: "Soft pink flowers for a romantic surprise.", image: "" },
  { id: "p3", name: "Sunshine Bouquet", category: "Sunflowers", price: 780, stock: 18, description: "Bright sunflowers to make someone smile.", image: "" },
  { id: "p4", name: "White Elegance", category: "Bouquet", price: 1100, stock: 12, description: "Elegant white blooms for special moments.", image: "" },
  { id: "p5", name: "Mixed Garden", category: "Mixed Flowers", price: 1250, stock: 10, description: "A colorful mix of seasonal flowers.", image: "" },
  { id: "p6", name: "Purple Dream", category: "Bouquet", price: 990, stock: 14, description: "Lovely purple flowers arranged with care.", image: "" },
  { id: "p7", name: "Yellow Tulips", category: "Bouquet", price: 880, stock: 16, description: "Fresh yellow tulips for cheerful days.", image: "" },
  { id: "p8", name: "Baby's Breath", category: "Bouquet", price: 650, stock: 25, description: "Delicate baby's breath bouquet.", image: "" },
  { id: "p9", name: "Pink Tulips", category: "Bouquet", price: 920, stock: 13, description: "Beautiful pink tulips for a thoughtful gift.", image: "" },
  { id: "p10", name: "Sunflower Bliss", category: "Sunflowers", price: 1050, stock: 11, description: "A cheerful sunflower arrangement.", image: "" },
  { id: "p11", name: "White Roses", category: "Roses", price: 1150, stock: 10, description: "Pure white roses in a lovely arrangement.", image: "" },
  { id: "p12", name: "Red and Pink Mix", category: "Mixed Flowers", price: 1350, stock: 9, description: "A romantic combination of red and pink blooms.", image: "" },
  { id: "p13", name: "Mini Succulent", category: "Plants", price: 350, stock: 30, description: "A cute low-maintenance plant.", image: "" },
  { id: "p14", name: "Orchid Plant", category: "Plants", price: 1450, stock: 8, description: "An elegant orchid plant for your home.", image: "" },
  { id: "p15", name: "Grand Celebration", category: "Mixed Flowers", price: 1850, stock: 6, description: "A grand flower arrangement for celebrations.", image: "" }
];

let products = loadData(STORAGE.products, null);
if (!Array.isArray(products)) {
  products = defaultProducts.map(product => ({ ...product }));
  saveData(STORAGE.products, products);
}

let users = loadData(STORAGE.users, []);
if (!Array.isArray(users)) users = [];

let orders = loadData(STORAGE.orders, []);
if (!Array.isArray(orders)) orders = [];

let settings = loadData(STORAGE.settings, {
  shopName: "Petal & Vine",
  adminName: "Administrator",
  adminUsername: "admin",
  adminPassword: "admin123"
});

let session = loadData(STORAGE.session, null);
let carts = loadData(STORAGE.carts, {});
if (!carts || typeof carts !== "object") carts = {};

let selectedReceiptId = null;
let selectedProductImage = "";
let toastTimer = null;

function currentUser() {
  if (!session) return null;
  if (session.role === "admin") {
    return {
      role: "admin",
      name: settings.adminName,
      username: settings.adminUsername
    };
  }
  return users.find(user =>
    user.username === session.username && user.active !== false
  ) || null;
}

function currentCart() {
  const user = currentUser();
  if (!user || user.role !== "customer") return [];
  return carts[user.username] || [];
}

function saveCart(cart) {
  const user = currentUser();
  if (!user || user.role !== "customer") return;
  carts[user.username] = cart;
  saveData(STORAGE.carts, carts);
  updateCartCount();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2800);
}

function openModal(id) {
  $(id).classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

function setShopName() {
  $("shopNameHeader").textContent = settings.shopName || "Petal & Vine";
  document.title = (settings.shopName || "Petal & Vine") + " | Flower Shop";
}

function showAuth(mode = "login") {
  $("authPage").classList.remove("hidden");
  $("appPage").classList.add("hidden");
  $("logoutBtn").classList.add("hidden");

  const registering = mode === "register";
  $("loginFormWrap").classList.toggle("hidden", registering);
  $("registerFormWrap").classList.toggle("hidden", !registering);
  $("authTitle").textContent = registering ? "Create Your Account" : "Welcome to " + settings.shopName;
  $("authSubtitle").textContent = registering ? "Join us and discover beautiful flowers" : "Sign in to continue";
}

function showApp() {
  const user = currentUser();

  if (!user) {
    session = null;
    saveData(STORAGE.session, null);
    showAuth();
    return;
  }

  $("authPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("headerUser").textContent = user.name;
  $("sidebarUserName").textContent = user.name;
  $("sidebarUserRole").textContent = user.role === "admin" ? "Administrator" : "Customer";

  const isAdmin = user.role === "admin";
  $("adminNav").classList.toggle("hidden", !isAdmin);
  $("customerNav").classList.toggle("hidden", isAdmin);

  setShopName();
  navigateTo(isAdmin ? "dashboardPage" : "shopPage");
  renderAll();
}

function navigateTo(pageId) {
  const user = currentUser();
  if (!user) return;

  const adminPages = [
    "dashboardPage", "productsPage", "inventoryPage",
    "ordersPage", "usersPage", "transactionsPage", "settingsPage"
  ];
  const customerPages = ["shopPage", "cartPage", "myOrdersPage"];

  if (user.role === "admin" && !adminPages.includes(pageId)) return;
  if (user.role !== "admin" && !customerPages.includes(pageId)) return;

  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  $(pageId).classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  renderPage(pageId);
}

function renderPage(pageId) {
  switch (pageId) {
    case "shopPage": renderShop(); break;
    case "cartPage": renderCart(); break;
    case "myOrdersPage": renderCustomerOrders(); break;
    case "dashboardPage": renderDashboard(); break;
    case "productsPage": renderAdminProducts(); break;
    case "inventoryPage": renderInventory(); break;
    case "ordersPage": renderAdminOrders(); break;
    case "usersPage": renderUsers(); break;
    case "transactionsPage": renderTransactions(); break;
    case "settingsPage": renderSettings(); break;
  }
}

function renderAll() {
  updateCartCount();
  const user = currentUser();
  if (!user) return;
  if (user.role === "admin") {
    renderDashboard();
  } else {
    renderShop();
  }
}

function updateCartCount() {
  const count = currentCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  $("cartCount").textContent = count;
}

/* ================================
   ACCOUNT REGISTRATION AND LOGIN
================================ */

$("showRegisterBtn").addEventListener("click", () => showAuth("register"));
$("showLoginBtn").addEventListener("click", () => showAuth("login"));

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim().toLowerCase();
  const password = $("registerPassword").value;
  const confirmPassword = $("registerConfirmPassword").value;

  if (name.length < 2) return alert("Please enter your full name.");
  if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
    return alert("Username must be 3–20 characters and contain only letters, numbers, or underscores.");
  }
  if (password.length < 4) return alert("Password must contain at least 4 characters.");
  if (password !== confirmPassword) return alert("Passwords do not match.");
  if (username === settings.adminUsername.toLowerCase()) {
    return alert("This username is reserved.");
  }
  if (users.some(user => user.username.toLowerCase() === username)) {
    return alert("Username already exists. Please choose another.");
  }

  users.push({
    id: createId("user_"),
    name,
    username,
    password,
    role: "customer",
    active: true,
    createdAt: new Date().toISOString()
  });

  if (!saveData(STORAGE.users, users)) {
    users.pop();
    return;
  }

  $("registerForm").reset();
  $("loginUsername").value = username;
  showAuth("login");
  showToast("Account created! Please log in.");
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  if (
    username === settings.adminUsername.toLowerCase() &&
    password === settings.adminPassword
  ) {
    session = { role: "admin", username: settings.adminUsername };
    saveData(STORAGE.session, session);
    showApp();
    showToast("Welcome, Administrator!");
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username && item.password === password
  );

  if (!user) return alert("Incorrect username or password.");
  if (user.active === false) return alert("This account has been disabled. Contact the administrator.");

  session = { role: "customer", username: user.username };
  saveData(STORAGE.session, session);
  $("loginForm").reset();
  showApp();
  showToast("Welcome, " + user.name + "!");
});

$("logoutBtn").addEventListener("click", () => {
  session = null;
  saveData(STORAGE.session, null);
  $("headerUser").textContent = "";
  showAuth();
  showToast("You have logged out.");
});

/* ================================
   NAVIGATION
================================ */

document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => navigateTo(button.dataset.page));
});

/* ================================
   CUSTOMER SHOP
================================ */

function placeholderImage() {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="350"><rect width="100%" height="100%" fill="#f8eaf0"/><text x="50%" y="48%" font-size="65" text-anchor="middle">🌸</text><text x="50%" y="72%" font-size="20" fill="#7b3f5b" text-anchor="middle">Petal &amp; Vine</text></svg>'
  );
}

function productImage(product) {
  return product.image || placeholderImage();
}

function renderShop() {
  const search = ($("shopSearch").value || "").trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search) ||
    (product.description || "").toLowerCase().includes(search)
  );

  if (!filtered.length) {
    $("shopProducts").innerHTML = '<div class="empty-state">No flowers found.</div>';
    return;
  }

  $("shopProducts").innerHTML = filtered.map(product => `
    <article class="product-card">
      <img class="product-image" src="${productImage(product)}" alt="${escapeHTML(product.name)}">
      <div class="product-info">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-description">${escapeHTML(product.description || "")}</p>
        <div class="product-price">${money(product.price)}</div>
        <div class="stock-text">${product.stock > 0 ? `${product.stock} available` : "Out of stock"}</div>
        <div class="buy-controls">
          <input type="number" min="1" max="${Math.max(1, product.stock)}" value="1" id="quantity-${escapeHTML(product.id)}" ${product.stock <= 0 ? "disabled" : ""}>
          <button class="btn-primary" type="button" onclick="addToCart('${escapeHTML(product.id)}')" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("");
}

$("shopSearch").addEventListener("input", renderShop);

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return alert("Product not found.");
  if (product.stock <= 0) return alert("This product is out of stock.");

  const quantityInput = $("quantity-" + productId);
  const quantity = Number(quantityInput?.value || 1);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return alert("Please enter a valid quantity.");
  }

  const cart = currentCart();
  const existing = cart.find(item => item.productId === productId);
  const newQuantity = (existing ? existing.quantity : 0) + quantity;

  if (newQuantity > product.stock) {
    return alert("You cannot add more than the available stock.");
  }

  if (existing) existing.quantity = newQuantity;
  else cart.push({ productId, quantity });

  saveCart(cart);
  showToast("Added to cart!");
}

window.addToCart = addToCart;

/* ================================
   CUSTOMER CART
================================ */

function renderCart() {
  const cart = currentCart();

  if (!cart.length) {
    $("cartContent").innerHTML = '<div class="empty-state"><h3>Your cart is empty 🌷</h3><p>Visit the shop to add flowers to your cart.</p><button class="btn-primary" onclick="navigateTo(\'shopPage\')">Browse Flowers</button></div>';
    return;
  }

  let total = 0;
  let html = "";

  cart.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return;

    const subtotal = product.price * item.quantity;
    total += subtotal;

    html += `
      <div class="cart-item">
        <img src="${productImage(product)}" alt="${escapeHTML(product.name)}">
        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${money(product.price)} each</p>
          <p>Subtotal: <strong>${money(subtotal)}</strong></p>
        </div>
        <div class="cart-controls">
          <input type="number" min="1" max="${product.stock}" value="${item.quantity}" id="cartqty-${escapeHTML(product.id)}" aria-label="Quantity">
          <button class="btn-outline" onclick="updateCartQuantity('${escapeHTML(product.id)}')">Update</button>
          <button class="btn-danger" onclick="removeFromCart('${escapeHTML(product.id)}')">Remove</button>
        </div>
      </div>
    `;
  });

  html += `
    <div class="cart-total">
      <p>Payment method: Cash on Delivery</p>
      <h2>Total: ${money(total)}</h2>
      <button class="btn-primary" onclick="startCheckout()">Proceed to Checkout</button>
    </div>
  `;

  $("cartContent").innerHTML = html;
}

function updateCartQuantity(productId) {
  const product = products.find(item => item.id === productId);
  const input = $("cartqty-" + productId);
  const quantity = Number(input?.value);

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    return alert("Enter a valid quantity.");
  }

  if (quantity > product.stock) return alert("Quantity exceeds available stock.");

  const cart = currentCart();
  const item = cart.find(row => row.productId === productId);
  if (!item) return;

  item.quantity = quantity;
  saveCart(cart);
  renderCart();
  showToast("Cart updated.");
}

function removeFromCart(productId) {
  saveCart(currentCart().filter(item => item.productId !== productId));
  renderCart();
  showToast("Product removed from cart.");
}

window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.navigateTo = navigateTo;

/* ================================
   CHECKOUT AND ORDER CREATION
================================ */

function startCheckout() {
  const cart = currentCart();
  if (!cart.length) return alert("Your cart is empty.");

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity > product.stock) {
      return alert("Some products no longer have enough stock. Please update your cart.");
    }
  }

  const user = currentUser();
  $("checkoutName").value = user.name || "";
  $("checkoutPhone").value = "";
  $("checkoutAddress").value = "";

  const total = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  $("checkoutSummary").innerHTML = `
    ${cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return product ? `<div class="receipt-line"><span>${escapeHTML(product.name)} × ${item.quantity}</span><strong>${money(product.price * item.quantity)}</strong></div>` : "";
    }).join("")}
    <div class="receipt-total">Total: ${money(total)}</div>
  `;

  openModal("checkoutModal");
}

window.startCheckout = startCheckout;

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  const user = currentUser();
  if (!user || user.role !== "customer") return alert("Please log in as a customer.");

  const cart = currentCart();
  if (!cart.length) return alert("Your cart is empty.");

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity > product.stock) {
      return alert("Insufficient stock for one or more products. Please review your cart.");
    }
  }

  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: Number(item.quantity),
      subtotal: Number(product.price) * Number(item.quantity)
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: createId("ORD-"),
    customerUsername: user.username,
    customerName: $("checkoutName").value.trim(),
    phone: $("checkoutPhone").value.trim(),
    address: $("checkoutAddress").value.trim(),
    paymentMethod: "COD",
    paymentStatus: "Pending",
    status: "Pending",
    items,
    total,
    createdAt: new Date().toISOString(),
    stockRestored: false
  };

  if (!order.customerName || !order.phone || !order.address) {
    return alert("Please complete all delivery details.");
  }

  // Deduct inventory once the order is ready.
  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  orders.unshift(order);

  const productsSaved = saveData(STORAGE.products, products);
  const ordersSaved = saveData(STORAGE.orders, orders);

  if (!productsSaved || !ordersSaved) {
    // Best-effort rollback if local storage fails.
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
    orders = orders.filter(item => item.id !== order.id);
    saveData(STORAGE.products, products);
    saveData(STORAGE.orders, orders);
    return;
  }

  saveCart([]);
  closeModal("checkoutModal");
  $("checkoutForm").reset();

  showToast("Order placed successfully!");
  showReceipt(order.id);
  renderAll();
});

/* ================================
   CUSTOMER ORDERS
================================ */

function renderCustomerOrders() {
  const user = currentUser();
  if (!user) return;

  const ownOrders = orders.filter(order => order.customerUsername === user.username);

  if (!ownOrders.length) {
    $("customerOrders").innerHTML = '<div class="empty-state"><h3>No orders yet.</h3><p>Your orders will appear here after checkout.</p></div>';
    return;
  }

  $("customerOrders").innerHTML = ownOrders.map(order => `
    <article class="order-card">
      <h3>Order ${escapeHTML(order.id)}</h3>
      <div class="order-meta">
        <span>${new Date(order.createdAt).toLocaleString()}</span>
        <span class="status ${order.status.toLowerCase()}">${escapeHTML(order.status)}</span>
        <span>Payment: COD (${escapeHTML(order.paymentStatus)})</span>
      </div>
      <div class="order-items">
        ${order.items.map(item => `<div class="receipt-line"><span>${escapeHTML(item.name)} × ${item.quantity}</span><strong>${money(item.subtotal)}</strong></div>`).join("")}
        <div class="receipt-total">Total: ${money(order.total)}</div>
      </div>
      <button class="btn-outline" onclick="showReceipt('${escapeHTML(order.id)}')">View Receipt</button>
    </article>
  `).join("");
}

/* ================================
   RECEIPTS
================================ */

function showReceipt(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return alert("Receipt not found.");

  const user = currentUser();
  if (!user) return;

  if (user.role !== "admin" && order.customerUsername !== user.username) {
    return alert("You are not allowed to view this receipt.");
  }

  selectedReceiptId = order.id;

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>${escapeHTML(settings.shopName)}</h2>
      <h3>OFFICIAL RECEIPT</h3>
      <p style="text-align:center;font-size:12px;">Thank you for shopping with us!</p>
      <hr>
      <div class="receipt-line"><span>Receipt No.</span><strong>${escapeHTML(order.id)}</strong></div>
      <div class="receipt-line"><span>Date</span><strong>${new Date(order.createdAt).toLocaleString()}</strong></div>
      <div class="receipt-line"><span>Customer</span><strong>${escapeHTML(order.customerName)}</strong></div>
      <div class="receipt-line"><span>Phone</span><strong>${escapeHTML(order.phone)}</strong></div>
      <div class="receipt-line"><span>Address</span><strong>${escapeHTML(order.address)}</strong></div>
      <div class="receipt-line"><span>Payment</span><strong>Cash on Delivery</strong></div>
      <div class="receipt-line"><span>Payment Status</span><strong>${escapeHTML(order.paymentStatus)}</strong></div>
      <hr>
      <h3>Order Items</h3>
      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}
      <div class="receipt-total">TOTAL: ${money(order.total)}</div>
      <p style="text-align:center;font-size:11px;margin-top:25px;">Thank you for choosing ${escapeHTML(settings.shopName)} 🌸</p>
    </div>
  `;

  openModal("receiptModal");
}

window.showReceipt = showReceipt;

$("printReceiptBtn").addEventListener("click", () => {
  if (!selectedReceiptId) return;
  window.print();
});

/* ================================
   ADMIN DASHBOARD
================================ */

function renderDashboard() {
  $("dashboardDate").textContent = new Date().toLocaleDateString();

  $("statProducts").textContent = products.length;
  $("statOrders").textContent = orders.length;
  $("statCustomers").textContent = users.filter(user => user.role === "customer").length;

  const sales = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  $("statSales").textContent = money(sales);

  const recent = orders.slice(0, 5);

  $("recentOrders").innerHTML = recent.length
    ? recent.map(order => `
      <div class="receipt-line">
        <span>${escapeHTML(order.customerName)} — ${escapeHTML(order.id)}</span>
        <strong>${money(order.total)}</strong>
        <span class="status ${order.status.toLowerCase()}">${escapeHTML(order.status)}</span>
      </div>
    `).join("")
    : '<div class="empty-state">No orders available yet.</div>';
}

/* ================================
   ADMIN PRODUCT MANAGEMENT
================================ */

function renderAdminProducts() {
  $("adminProductsTable").innerHTML = products.map(product => `
    <tr>
      <td><img src="${productImage(product)}" alt="${escapeHTML(product.name)}"></td>
      <td>${escapeHTML(product.name)}</td>
      <td>${escapeHTML(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>${product.stock}</td>
      <td>
        <div class="table-actions">
          <button class="btn-outline" onclick="editProduct('${escapeHTML(product.id)}')">Edit</button>
          <button class="btn-danger" onclick="deleteProduct('${escapeHTML(product.id)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function resetProductForm() {
  $("productForm").reset();
  $("productId").value = "";
  $("productFormTitle").textContent = "Add New Product";
  $("productImagePreview").classList.add("hidden");
  $("productImagePreview").src = "";
  selectedProductImage = "";
  $("productFormPanel").classList.add("hidden");
}

$("showProductFormBtn").addEventListener("click", () => {
  resetProductForm();
  $("productFormPanel").classList.remove("hidden");
  $("productFormTitle").textContent = "Add New Product";
});

$("cancelProductFormBtn").addEventListener("click", resetProductForm);

$("productImage").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image.");
    event.target.value = "";
    return;
  }

  if (file.size > 1024 * 1024) {
    alert("Image is too large. Please select an image under 1 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedProductImage = reader.result;
    $("productImagePreview").src = selectedProductImage;
    $("productImagePreview").classList.remove("hidden");
  };
  reader.onerror = () => alert("Unable to read image.");
  reader.readAsDataURL(file);
});

function editProduct(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productDescription").value = product.description || "";
  $("productImage").value = "";

  selectedProductImage = product.image || "";

  if (selectedProductImage) {
    $("productImagePreview").src = selectedProductImage;
    $("productImagePreview").classList.remove("hidden");
  } else {
    $("productImagePreview").classList.add("hidden");
  }

  $("productFormTitle").textContent = "Edit Product";
  $("productFormPanel").classList.remove("hidden");
  $("productFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProduct(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  const inActiveOrder = orders.some(order =>
    order.status !== "Cancelled" &&
    order.items.some(item => item.productId === productId)
  );

  if (inActiveOrder) {
    return alert("This product is included in an active order and cannot be deleted yet.");
  }

  if (!confirm("Are you sure you want to delete " + product.name + "?")) return;

  products = products.filter(item => item.id !== productId);
  saveData(STORAGE.products, products);

  // Remove deleted products from all carts.
  Object.keys(carts).forEach(username => {
    carts[username] = carts[username].filter(item => item.productId !== productId);
  });
  saveData(STORAGE.carts, carts);

  renderAdminProducts();
  showToast("Product deleted.");
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const description = $("productDescription").value.trim();

  if (!name || !category) return alert("Please complete the product details.");
  if (!Number.isFinite(price) || price <= 0) return alert("Enter a valid price.");
  if (!Number.isInteger(stock) || stock < 0) return alert("Enter a valid stock quantity.");

  const duplicate = products.some(product =>
    product.id !== id && product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) return alert("A product with this name already exists.");

  const oldProducts = products.map(product => ({ ...product }));
  const existing = products.find(product => product.id === id);

  if (existing) {
    existing.name = name;
    existing.category = category;
    existing.price = price;
    existing.stock = stock;
    existing.description = description;
    if (selectedProductImage) existing.image = selectedProductImage;
  } else {
    products.push({
      id: createId("p_"),
      name,
      category,
      price,
      stock,
      description,
      image: selectedProductImage || ""
    });
  }

  if (!saveData(STORAGE.products, products)) {
    products = oldProducts;
    return;
  }

  resetProductForm();
  renderAdminProducts();
  showToast("Product saved successfully.");
});

/* ================================
   INVENTORY
================================ */

function renderInventory() {
  $("inventoryTable").innerHTML = products.map(product => {
    const status = product.stock <= 0
      ? "Out of Stock"
      : product.stock <= 5
        ? "Low Stock"
        : "Available";

    return `
      <tr>
        <td>${escapeHTML(product.name)}</td>
        <td>${escapeHTML(product.category)}</td>
        <td>${product.stock}</td>
        <td><span class="status ${product.stock <= 0 ? "cancelled" : product.stock <= 5 ? "pending" : "delivered"}">${status}</span></td>
      </tr>
    `;
  }).join("");
}

/* ================================
   ADMIN ORDER MANAGEMENT
================================ */

function renderAdminOrders() {
  if (!orders.length) {
    $("adminOrders").innerHTML = '<div class="empty-state">No customer orders yet.</div>';
    return;
  }

  $("adminOrders").innerHTML = orders.map(order => `
    <article class="order-card">
      <h3>Order ${escapeHTML(order.id)}</h3>
      <div class="order-meta">
        <span>Customer: ${escapeHTML(order.customerName)}</span>
        <span>Phone: ${escapeHTML(order.phone)}</span>
        <span>Date: ${new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment:</strong> Cash on Delivery — ${escapeHTML(order.paymentStatus)}</p>
      <div class="order-items">
        ${order.items.map(item => `<div class="receipt-line"><span>${escapeHTML(item.name)} × ${item.quantity}</span><strong>${money(item.subtotal)}</strong></div>`).join("")}
        <div class="receipt-total">Total: ${money(order.total)}</div>
      </div>
      <div class="form-actions">
        <label for="status-${escapeHTML(order.id)}">Order Status</label>
        <select id="status-${escapeHTML(order.id)}">
          ${["Pending", "Processing", "Ready for Delivery", "Delivered", "Cancelled"].map(status =>
            `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
          ).join("")}
        </select>
        <button class="btn-primary" onclick="updateOrderStatus('${escapeHTML(order.id)}')">Update Status</button>
        <button class="btn-outline" onclick="showReceipt('${escapeHTML(order.id)}')">Receipt</button>
        ${order.status !== "Cancelled" ? `<button class="btn-success" onclick="markOrderPaid('${escapeHTML(order.id)}')">Mark COD Paid</button>` : ""}
      </div>
    </article>
  `).join("");
}

function updateOrderStatus(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  const newStatus = $("status-" + orderId).value;

  if (newStatus === "Cancelled" && order.status !== "Cancelled") {
    if (!confirm("Cancel this order? Its quantities will be returned to inventory.")) {
      renderAdminOrders();
      return;
    }

    if (!order.stockRestored) {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) product.stock += item.quantity;
      });
      order.stockRestored = true;
      saveData(STORAGE.products, products);
    }
  }

  if (order.status === "Cancelled" && newStatus !== "Cancelled") {
    return alert("A cancelled order cannot be reopened. Please create a new order instead.");
  }

  order.status = newStatus;

  if (!saveData(STORAGE.orders, orders)) return;

  renderAdminOrders();
  renderDashboard();
  showToast("Order status updated.");
}

function markOrderPaid(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order || order.status === "Cancelled") return;

  if (order.paymentStatus === "Paid") {
    return alert("This order is already marked as paid.");
  }

  if (!confirm("Confirm that the customer has paid the COD amount?")) return;

  order.paymentStatus = "Paid";
  if (!saveData(STORAGE.orders, orders)) return;

  renderAdminOrders();
  renderTransactions();
  showToast("COD payment marked as paid.");
}

window.updateOrderStatus = updateOrderStatus;
window.markOrderPaid = markOrderPaid;

/* ================================
   USER MANAGEMENT
================================ */

function renderUsers() {
  const customers = users.filter(user => user.role === "customer");

  $("usersTable").innerHTML = customers.length
    ? customers.map(user => `
      <tr>
        <td>${escapeHTML(user.name)}</td>
        <td>${escapeHTML(user.username)}</td>
        <td><span class="status ${user.active === false ? "cancelled" : "delivered"}">${user.active === false ? "Disabled" : "Active"}</span></td>
        <td>
          <button class="${user.active === false ? "btn-success" : "btn-danger"}" onclick="toggleUser('${escapeHTML(user.id)}')">
            ${user.active === false ? "Enable" : "Disable"}
          </button>
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="4">No customer accounts yet.</td></tr>';
}

function toggleUser(userId) {
  const user = users.find(item => item.id === userId);
  if (!user) return;

  user.active = user.active === false;
  if (!saveData(STORAGE.users, users)) return;

  renderUsers();
  renderDashboard();
  showToast(user.active ? "Customer account enabled." : "Customer account disabled.");
}

window.toggleUser = toggleUser;

/* ================================
   TRANSACTIONS
================================ */

function renderTransactions() {
  if (!orders.length) {
    $("transactionsContent").innerHTML = '<div class="empty-state">No transactions yet.</div>';
    return;
  }

  $("transactionsContent").innerHTML = `
    <div class="panel">
      <div class="table-responsive">
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Payment</th><th>Order Status</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customerName)}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${money(order.total)}</td>
                <td><span class="status ${order.paymentStatus.toLowerCase()}">${escapeHTML(order.paymentStatus)}</span></td>
                <td>${escapeHTML(order.status)}</td>
                <td><button class="btn-outline" onclick="showReceipt('${escapeHTML(order.id)}')">View</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ================================
   ADMIN SETTINGS
================================ */

function renderSettings() {
  $("settingsShopName").value = settings.shopName;
  $("settingsAdminName").value = settings.adminName;
  $("settingsAdminUsername").value = settings.adminUsername;
  $("settingsAdminPassword").value = "";
}

$("settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  const shopName = $("settingsShopName").value.trim();
  const adminName = $("settingsAdminName").value.trim();
  const adminUsername = $("settingsAdminUsername").value.trim().toLowerCase();
  const newPassword = $("settingsAdminPassword").value;

  if (!shopName || !adminName || !adminUsername) {
    return alert("Please complete all required settings.");
  }

  if (!/^[a-z0-9_]{3,20}$/i.test(adminUsername)) {
    return alert("Admin username must be 3–20 letters, numbers, or underscores.");
  }

  if (users.some(user => user.username.toLowerCase() === adminUsername)) {
    return alert("This username is already used by a customer.");
  }

  if (newPassword && newPassword.length < 4) {
    return alert("New password must contain at least 4 characters.");
  }

  const previousSettings = { ...settings };

  settings.shopName = shopName;
  settings.adminName = adminName;
  settings.adminUsername = adminUsername;
  if (newPassword) settings.adminPassword = newPassword;

  if (!saveData(STORAGE.settings, settings)) {
    settings = previousSettings;
    return;
  }

  if (session?.role === "admin") {
    session.username = settings.adminUsername;
    saveData(STORAGE.session, session);
  }

  setShopName();
  $("headerUser").textContent = settings.adminName;
  $("sidebarUserName").textContent = settings.adminName;
  $("settingsAdminPassword").value = "";

  showToast("Settings saved successfully.");
});

/* ================================
   MODAL CLOSE BUTTONS
================================ */

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal.id);
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal("checkoutModal");
    closeModal("receiptModal");
  }
});

/* ================================
   INITIALIZATION
================================ */

function initializeApp() {
  setShopName();

  // Recover a valid session; otherwise show the login screen.
  if (session?.role === "admin") {
    showApp();
  } else if (session?.role === "customer" && currentUser()) {
    showApp();
  } else {
    session = null;
    saveData(STORAGE.session, null);
    showAuth("login");
  }
}

initializeApp();
