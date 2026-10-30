"use strict";

/* =========================================
   PETAL & VINE - COMPLETE SHOP SYSTEM
   ========================================= */

const KEYS = {
  products: "pv_products_v7",
  users: "pv_users_v7",
  orders: "pv_orders_v7",
  admin: "pv_admin_v7"
};

const defaultProducts = [
  {id:1,name:"Classic Red Roses",category:"Roses",price:850,stock:20,emoji:"🌹",description:"A beautiful bouquet of classic red roses.",image:""},
  {id:2,name:"Pink Rose Bouquet",category:"Bouquet",price:950,stock:15,emoji:"🌸",description:"Soft pink roses perfect for special occasions.",image:""},
  {id:3,name:"Sunflower Delight",category:"Bouquet",price:750,stock:18,emoji:"🌻",description:"Bright sunflowers to bring happiness.",image:""},
  {id:4,name:"White Lily Elegance",category:"Arrangement",price:1100,stock:12,emoji:"🤍",description:"Elegant white lilies in a lovely arrangement.",image:""},
  {id:5,name:"Purple Tulips",category:"Bouquet",price:900,stock:14,emoji:"🌷",description:"Fresh purple tulips for someone special.",image:""},
  {id:6,name:"Mixed Flower Basket",category:"Arrangement",price:1350,stock:10,emoji:"💐",description:"A colorful mix of seasonal flowers.",image:""},
  {id:7,name:"Baby's Breath Bouquet",category:"Bouquet",price:650,stock:20,emoji:"🌼",description:"Delicate baby's breath bouquet.",image:""},
  {id:8,name:"Orchid Plant",category:"Plants",price:1200,stock:8,emoji:"🪻",description:"A graceful orchid plant for your home.",image:""},
  {id:9,name:"Daisy Sunshine",category:"Bouquet",price:700,stock:16,emoji:"🌼",description:"Cheerful daisies arranged beautifully.",image:""},
  {id:10,name:"Premium Rose Box",category:"Roses",price:1600,stock:9,emoji:"🌹",description:"Premium roses presented in an elegant box.",image:""},
  {id:11,name:"Pastel Flower Mix",category:"Arrangement",price:1250,stock:11,emoji:"💐",description:"Beautiful flowers in soft pastel colors.",image:""},
  {id:12,name:"Mini Succulent",category:"Plants",price:350,stock:25,emoji:"🪴",description:"A cute, easy-care succulent plant.",image:""},
  {id:13,name:"Romantic Red Mix",category:"Arrangement",price:1450,stock:10,emoji:"❤️",description:"A romantic arrangement of red flowers.",image:""},
  {id:14,name:"Flower Gift Set",category:"Gift",price:1750,stock:7,emoji:"🎁",description:"A flower gift set for memorable moments.",image:""},
  {id:15,name:"Spring Tulip Basket",category:"Arrangement",price:1150,stock:13,emoji:"🌷",description:"A lovely basket filled with fresh tulips.",image:""}
];

let products = [];
let users = [];
let orders = [];
let admin = {};
let currentUser = null;
let cart = [];
let selectedProductImage = "";
let toastTimer = null;

/* =========================================
   STORAGE
   ========================================= */

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error("Storage read error:", error);
    return fallback;
  }
}

function saveAll() {
  try {
    localStorage.setItem(KEYS.products, JSON.stringify(products));
    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
    localStorage.setItem(KEYS.admin, JSON.stringify(admin));
    return true;
  } catch (error) {
    showToast("Storage is full. Try using smaller product images.");
    console.error(error);
    return false;
  }
}

function initialize() {
  const savedProducts = readStorage(KEYS.products, null);

  products = Array.isArray(savedProducts)
    ? savedProducts
    : defaultProducts.map(product => ({ ...product }));

  products = products.map((product, index) => ({
    id: Number(product.id) || Date.now() + index,
    name: String(product.name || "Unnamed product"),
    category: product.category || "Bouquet",
    price: Math.max(0, Number(product.price) || 0),
    stock: Math.max(0, Math.floor(Number(product.stock) || 0)),
    emoji: product.emoji || "🌸",
    description: product.description || "",
    image: product.image || ""
  }));

  users = readStorage(KEYS.users, []);
  orders = readStorage(KEYS.orders, []);

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];

  admin = readStorage(KEYS.admin, null);

  if (!admin || typeof admin !== "object") {
    admin = {
      username: "admin",
      password: "Admin123",
      displayName: "Administrator"
    };
  }

  saveAll();

  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("settingsForm").addEventListener("submit", saveAdminSettings);

  showLogin();
}

/* =========================================
   AUTHENTICATION
   ========================================= */

function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    return showToast("Enter your username and password.");
  }

  if (username === admin.username && password === admin.password) {
    currentUser = {
      username: admin.username,
      name: admin.displayName,
      role: "admin"
    };
    startApp();
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) return showToast("Incorrect username or password.");

  currentUser = { ...user, role: "customer" };
  startApp();
}

function register() {
  const name = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!name || !username || !password) {
    return showToast("Please complete all fields.");
  }

  if (username.length < 3) {
    return showToast("Username must have at least 3 characters.");
  }

  if (password.length < 4) {
    return showToast("Password must have at least 4 characters.");
  }

  const exists = username.toLowerCase() === admin.username.toLowerCase() ||
    users.some(user => user.username.toLowerCase() === username.toLowerCase());

  if (exists) return showToast("That username is already taken.");

  users.push({
    id: Date.now(),
    name,
    username,
    password,
    createdAt: new Date().toISOString()
  });

  if (!saveAll()) {
    users.pop();
    return;
  }

  currentUser = {
    name,
    username,
    role: "customer"
  };

  startApp();
  showToast("Account created successfully!");
}

function logout() {
  currentUser = null;
  cart = [];
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("loginPassword").value = "";
  showLogin();
}

function startApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  document.getElementById("welcomeText").textContent =
    "Hello, " + (currentUser.role === "admin" ? admin.displayName : currentUser.name);

  buildNavigation();
  showPage("dashboard");
}

/* =========================================
   NAVIGATION
   ========================================= */

function buildNavigation() {
  const nav = document.getElementById("navigation");

  let links = [];

  if (currentUser.role === "admin") {
    links = [
      ["dashboard", "⌂ Dashboard"],
      ["inventory", "📦 Inventory"],
      ["orders", "🧾 Orders"],
      ["customers", "👥 Customers"],
      ["receipts", "🧾 Receipts"],
      ["reports", "📊 Reports"],
      ["settings", "⚙ Settings"]
    ];
  } else {
    links = [
      ["dashboard", "⌂ Dashboard"],
      ["shop", "🌸 Shop"],
      ["cart", "🛒 Cart"],
      ["profile", "👤 My Profile"]
    ];
  }

  nav.innerHTML = links.map(([page, label]) => `
    <button class="nav-link" data-page="${page}" onclick="showPage('${page}')">
      ${label}
      ${page === "cart" && getCartCount() ? `<span class="nav-count">${getCartCount()}</span>` : ""}
    </button>
  `).join("");
}

function showPage(page) {
  const allowed = currentUser.role === "admin"
    ? ["dashboard", "inventory", "orders", "customers", "receipts", "reports", "settings"]
    : ["dashboard", "shop", "cart", "profile"];

  if (!allowed.includes(page)) page = "dashboard";

  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(page + "Page");
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "dashboard") renderDashboard();
  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderOrders();
  if (page === "customers") renderCustomers();
  if (page === "receipts") renderReceipts();
  if (page === "reports") renderReports();
  if (page === "settings") loadAdminSettings();
  if (page === "profile") renderProfile();
}

/* =========================================
   HELPERS
   ========================================= */

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

function getProduct(id) {
  return products.find(product => Number(product.id) === Number(id));
}

function getCartCount() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function productPicture(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }

  return `<span>${escapeHTML(product.emoji || "🌸")}</span>`;
}

/* =========================================
   DASHBOARD
   ========================================= */

function renderDashboard() {
  const isAdmin = currentUser.role === "admin";

  if (isAdmin) {
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalSales = orders
      .filter(order => order.status !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    document.getElementById("dashboardStats").innerHTML = `
      <div class="stat-card"><span>Total Products</span><strong>${products.length}</strong></div>
      <div class="stat-card"><span>Total Stock</span><strong>${totalStock}</strong></div>
      <div class="stat-card"><span>Total Orders</span><strong>${orders.length}</strong></div>
      <div class="stat-card"><span>Total Sales</span><strong>${money(totalSales)}</strong></div>
    `;

    document.getElementById("dashboardProductTitle").textContent = "All Store Products";
  } else {
    document.getElementById("dashboardStats").innerHTML = `
      <div class="stat-card"><span>Available Products</span><strong>${products.length}</strong></div>
      <div class="stat-card"><span>Items in Cart</span><strong>${getCartCount()}</strong></div>
    `;

    document.getElementById("dashboardProductTitle").textContent = "Our Products";
  }

  // IMPORTANT: Show ALL products. Do not remove products when adding to cart.
  document.getElementById("dashboardProducts").innerHTML =
    products.map(product => productCard(product, isAdmin)).join("") ||
    `<div class="empty-state">No products available yet.</div>`;
}

/* =========================================
   PRODUCT CARDS
   ========================================= */

function productCard(product, isAdmin) {
  const outOfStock = product.stock <= 0;

  let actions = "";

  if (isAdmin) {
    actions = `
      <button class="btn outline" onclick="editProduct(${product.id})">Edit</button>
      <button class="btn danger" onclick="deleteProduct(${product.id})">Delete</button>
    `;
  } else {
    actions = `
      <button class="btn outline" onclick="addToCart(${product.id})" ${outOfStock ? "disabled" : ""}>
        Add to Cart
      </button>
      <button class="btn primary" onclick="buyNow(${product.id})" ${outOfStock ? "disabled" : ""}>
        Buy Now
      </button>
    `;
  }

  return `
    <article class="product-card">
      <div class="product-image">${productPicture(product)}</div>
      <div class="product-info">
        <span class="category-tag">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p class="product-description">${escapeHTML(product.description)}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">
          ${outOfStock ? "Out of stock" : `${product.stock} available`}
        </div>
        <div class="product-actions">${actions}</div>
      </div>
    </article>
  `;
}

/* =========================================
   SHOP
   ========================================= */

function renderShop() {
  const search = (document.getElementById("shopSearch")?.value || "").toLowerCase();
  const category = document.getElementById("shopCategory")?.value || "";

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    const matchesCategory = !category || product.category === category;

    return matchesSearch && matchesCategory;
  });

  document.getElementById("shopProducts").innerHTML =
    filtered.map(product => productCard(product, false)).join("") ||
    `<div class="empty-state">No matching products found.</div>`;
}

/* =========================================
   CART
   ========================================= */

// Adding to cart NEVER removes a product or changes its stock.
function addToCart(id) {
  const product = getProduct(id);

  if (!product) return showToast("Product not found.");
  if (product.stock <= 0) return showToast("This product is out of stock.");

  const existing = cart.find(item => Number(item.id) === Number(id));

  if (existing) {
    if (existing.quantity >= product.stock) {
      return showToast("You have reached the available stock limit.");
    }

    existing.quantity += 1;
  } else {
    cart.push({ id: Number(id), quantity: 1 });
  }

  buildNavigation();
  showToast("Product added to cart!");

  // Refresh displays without changing the product inventory.
  if (currentUser.role === "admin") {
    renderDashboard();
  } else {
    renderShop();
    renderDashboard();
  }

  const cartPage = document.getElementById("cartPage");
  if (!cartPage.classList.contains("hidden")) renderCart();
}

function buyNow(id) {
  addToCart(id);
  showPage("cart");
}

function changeCartQuantity(id, change) {
  const item = cart.find(entry => Number(entry.id) === Number(id));
  const product = getProduct(id);

  if (!item || !product) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    cart = cart.filter(entry => Number(entry.id) !== Number(id));
  } else if (newQuantity > product.stock) {
    showToast("Quantity cannot exceed available stock.");
    return;
  } else {
    item.quantity = newQuantity;
  }

  buildNavigation();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => Number(item.id) !== Number(id));
  buildNavigation();
  renderCart();
  showToast("Item removed from cart.");
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");

  const validItems = cart.filter(item => getProduct(item.id));

  cart = validItems;

  if (!cart.length) {
    cartItems.innerHTML = `<div class="empty-state">
      <h3>Your cart is empty</h3>
      <p>Add some beautiful flowers to get started.</p>
      <button class="btn primary" onclick="showPage('shop')">Browse Shop</button>
    </div>`;

    summary.innerHTML = "";
    return;
  }

  cartItems.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    const subtotal = product.price * item.quantity;

    return `
      <div class="cart-item">
        <div class="cart-emoji">${productPicture(product)}</div>
        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${money(product.price)} each</p>
          <div class="quantity-control">
            <button onclick="changeCartQuantity(${product.id}, -1)">−</button>
            <strong>${item.quantity}</strong>
            <button onclick="changeCartQuantity(${product.id}, 1)">+</button>
            <button class="btn danger small" onclick="removeFromCart(${product.id})">Remove</button>
          </div>
        </div>
        <div class="cart-item-total"><strong>${money(subtotal)}</strong></div>
      </div>
    `;
  }).join("");

  const total = cart.reduce((sum, item) => {
    return sum + getProduct(item.id).price * item.quantity;
  }, 0);

  summary.innerHTML = `
    <h2>Order Summary</h2>
    <div class="summary-line"><span>Items</span><strong>${getCartCount()}</strong></div>
    <div class="summary-line"><span>Subtotal</span><strong>${money(total)}</strong></div>
    <div class="summary-line"><span>Delivery</span><strong>Free</strong></div>
    <div class="summary-line summary-total"><span>Total</span><strong>${money(total)}</strong></div>
    <button class="btn primary full" onclick="checkout()">Checkout</button>
  `;

  buildNavigation();
}

/* =========================================
   CHECKOUT
   ========================================= */

function checkout() {
  if (!cart.length) return showToast("Your cart is empty.");

  // Verify every item before changing any stock.
  for (const item of cart) {
    const product = getProduct(item.id);

    if (!product) return showToast("A product in your cart no longer exists.");
    if (item.quantity > product.stock) {
      return showToast(`Not enough stock for ${product.name}.`);
    }
  }

  const total = cart.reduce((sum, item) => {
    return sum + getProduct(item.id).price * item.quantity;
  }, 0);

  const orderItems = cart.map(item => {
    const product = getProduct(item.id);

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  });

  const order = {
    id: "PV-" + Date.now(),
    customer: currentUser.name,
    username: currentUser.username,
    items: orderItems,
    total,
    status: "Pending",
    date: new Date().toISOString()
  };

  // Stock changes only after successful checkout.
  const oldStocks = products.map(product => ({
    id: product.id,
    stock: product.stock
  }));

  orderItems.forEach(item => {
    const product = getProduct(item.id);
    product.stock -= item.quantity;
  });

  orders.unshift(order);

  if (!saveAll()) {
    // Roll back stock and order if saving fails.
    oldStocks.forEach(old => {
      const product = getProduct(old.id);
      if (product) product.stock = old.stock;
    });

    orders = orders.filter(entry => entry.id !== order.id);
    return;
  }

  cart = [];
  buildNavigation();

  renderDashboard();
  renderShop();
  renderCart();

  showToast("Order placed successfully!");
  showReceipt(order);
}

function showReceipt(order) {
  const printArea = document.getElementById("printArea");

  printArea.innerHTML = `
    <div style="max-width:650px;margin:auto;font-family:Arial,sans-serif">
      <h1 style="text-align:center;color:#7b3f5b">Petal & Vine</h1>
      <p style="text-align:center">Thank you for your order!</p>
      <hr>
      <p><strong>Receipt:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customer)}</p>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <hr>
      ${order.items.map(item => `
        <p>${escapeHTML(item.name)} × ${item.quantity}
        <span style="float:right">${money(item.subtotal)}</span></p>
      `).join("")}
      <hr>
      <h2>Total: ${money(order.total)}</h2>
      <p>Status: ${escapeHTML(order.status)}</p>
      <p style="text-align:center;margin-top:40px">Petal & Vine — Flowers for every beautiful moment</p>
    </div>
  `;

  showPage(currentUser.role === "admin" ? "orders" : "profile");
  setTimeout(() => window.print(), 300);
}

/* =========================================
   ADMIN INVENTORY
   ========================================= */

function renderInventory() {
  const search = (document.getElementById("inventorySearch")?.value || "").toLowerCase();
  const category = document.getElementById("inventoryCategory")?.value || "";

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    return matchesSearch && (!category || product.category === category);
  });

  document.getElementById("inventoryCount").textContent =
    `${filtered.length} product(s) displayed — ${products.length} total products`;

  document.getElementById("inventoryProducts").innerHTML =
    filtered.map(product => productCard(product, true)).join("") ||
    `<div class="empty-state">No products found.</div>`;
}

function openProductEditor() {
  selectedProductImage = "";
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("editorTitle").textContent = "Add Product";
  resetProductImageUI();

  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({ behavior: "smooth" });
}

function closeProductEditor() {
  document.getElementById("productEditor").classList.add("hidden");
  document.getElementById("productForm").reset();
  selectedProductImage = "";
  resetProductImageUI();
}

function editProduct(id) {
  const product = getProduct(id);
  if (!product) return showToast("Product not found.");

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productEmoji").value = product.emoji || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productImage").value = "";

  selectedProductImage = product.image || "";
  resetProductImageUI();

  if (selectedProductImage) {
    const preview = document.getElementById("productImagePreview");
    preview.src = selectedProductImage;
    preview.classList.remove("hidden");
  }

  document.getElementById("editorTitle").textContent = "Edit Product";
  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({ behavior: "smooth" });
}

function resetProductImageUI() {
  const preview = document.getElementById("productImagePreview");
  preview.src = "";
  preview.classList.add("hidden");
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
    showToast("Image must be smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedProductImage = reader.result;

    const preview = document.getElementById("productImagePreview");
    preview.src = selectedProductImage;
    preview.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function removeProductImage() {
  selectedProductImage = "";
  document.getElementById("productImage").value = "";
  resetProductImageUI();
}

function saveProduct(event) {
  event.preventDefault();

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const emoji = document.getElementById("productEmoji").value.trim() || "🌸";
  const description = document.getElementById("productDescription").value.trim();

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return showToast("Please enter valid product details.");
  }

  const duplicate = products.some(product =>
    product.name.toLowerCase() === name.toLowerCase() &&
    String(product.id) !== String(id)
  );

  if (duplicate) return showToast("A product with this name already exists.");

  const previousProducts = products.map(product => ({ ...product }));

  if (id) {
    const product = getProduct(id);
    if (!product) return showToast("Product not found.");

    product.name = name;
    product.category = category;
    product.price = price;
    product.stock = stock;
    product.emoji = emoji;
    product.description = description;
    product.image = selectedProductImage;
  } else {
    products.push({
      id: Date.now(),
      name,
      category,
      price,
      stock,
      emoji,
      description,
      image: selectedProductImage
    });
  }

  if (!saveAll()) {
    products = previousProducts;
    return;
  }

  closeProductEditor();
  renderInventory();
  renderDashboard();
  renderShop();

  showToast(id ? "Product updated successfully!" : "Product added successfully!");
}

function deleteProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  if (!confirm(`Delete "${product.name}" permanently?`)) return;

  const previousProducts = products.map(item => ({ ...item }));

  products = products.filter(item => Number(item.id) !== Number(id));

  if (!saveAll()) {
    products = previousProducts;
    return;
  }

  // Remove only the deleted product from the cart.
  cart = cart.filter(item => Number(item.id) !== Number(id));

  renderInventory();
  renderDashboard();
  renderShop();
  buildNavigation();

  showToast("Product deleted.");
}

/* =========================================
   ORDERS
   ========================================= */

function renderOrders() {
  const container = document.getElementById("ordersList");

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">No orders yet.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="data-card">
      <h3>${escapeHTML(order.id)}</h3>
      <p>Customer: ${escapeHTML(order.customer)}</p>
      <p>Date: ${new Date(order.date).toLocaleString()}</p>
      <p>Items: ${order.items.map(item =>
        `${escapeHTML(item.name)} × ${item.quantity}`
      ).join(", ")}</p>
      <p><strong>Total: ${money(order.total)}</strong></p>
      <p>Status: <span class="badge ${order.status === "Completed" ? "success" : order.status === "Cancelled" ? "cancelled" : ""}">${escapeHTML(order.status)}</span></p>
      <div class="data-card-actions">
        <button class="btn outline small" onclick="printReceipt('${order.id}')">Print Receipt</button>
        <select onchange="updateOrderStatus('${order.id}', this.value)">
          <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
          <option value="Completed" ${order.status === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </div>
    </div>
  `).join("");
}

function updateOrderStatus(id, status) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const previousStatus = order.status;

  if (previousStatus === "Cancelled") {
    return showToast("Cancelled orders cannot be reopened.");
  }

  if (status === "Cancelled") {
    const restore = confirm("Cancel this order and return its items to stock?");
    if (!restore) {
      renderOrders();
      return;
    }

    order.items.forEach(item => {
      const product = getProduct(item.id);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = status;

  if (!saveAll()) {
    order.status = previousStatus;

    if (status === "Cancelled") {
      order.items.forEach(item => {
        const product = getProduct(item.id);
        if (product) product.stock -= item.quantity;
      });
    }

    renderOrders();
    return;
  }

  renderOrders();
  renderDashboard();
  renderInventory();
  renderShop();
  showToast("Order status updated.");
}

/* =========================================
   RECEIPTS
   ========================================= */

function renderReceipts() {
  const container = document.getElementById("receiptsList");

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">No receipts available.</div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="data-card">
      <h3>Receipt ${escapeHTML(order.id)}</h3>
      <p>Customer: ${escapeHTML(order.customer)}</p>
      <p>Date: ${new Date(order.date).toLocaleString()}</p>
      <p>Total: <strong>${money(order.total)}</strong></p>
      <p>Status: ${escapeHTML(order.status)}</p>
      <div class="data-card-actions">
        <button class="btn primary small" onclick="printReceipt('${order.id}')">Print Receipt</button>
      </div>
    </div>
  `).join("");
}

function printReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return showToast("Receipt not found.");

  const printArea = document.getElementById("printArea");

  printArea.innerHTML = `
    <div style="max-width:650px;margin:auto;font-family:Arial,sans-serif">
      <h1 style="text-align:center;color:#7b3f5b">Petal & Vine</h1>
      <p style="text-align:center">Official Order Receipt</p>
      <hr>
      <p><strong>Receipt:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customer)}</p>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <hr>
      ${order.items.map(item => `
        <p>${escapeHTML(item.name)} × ${item.quantity}
        <span style="float:right">${money(item.subtotal)}</span></p>
      `).join("")}
      <hr>
      <h2>Total: ${money(order.total)}</h2>
      <p>Status: ${escapeHTML(order.status)}</p>
      <p style="text-align:center;margin-top:35px">Thank you for shopping with us!</p>
    </div>
  `;

  window.print();
}

/* =========================================
   CUSTOMERS
   ========================================= */

function renderCustomers() {
  const container = document.getElementById("customersList");

  if (!users.length) {
    container.innerHTML = `<div class="empty-state">No registered customers yet.</div>`;
    return;
  }

  container.innerHTML = users.map(user => {
    const customerOrders = orders.filter(order => order.username === user.username);
    const spent = customerOrders
      .filter(order => order.status !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    return `
      <div class="data-card">
        <h3>${escapeHTML(user.name)}</h3>
        <p>Username: ${escapeHTML(user.username)}</p>
        <p>Orders: ${customerOrders.length}</p>
        <p>Total spent: ${money(spent)}</p>
      </div>
    `;
  }).join("");
}

/* =========================================
   REPORTS
   ========================================= */

function renderReports() {
  const validOrders = orders.filter(order => order.status !== "Cancelled");

  const revenue = validOrders.reduce((sum, order) => sum + order.total, 0);
  const completed = orders.filter(order => order.status === "Completed").length;
  const pending = orders.filter(order => order.status === "Pending").length;
  const unitsSold = validOrders.reduce((sum, order) => {
    return sum + order.items.reduce((total, item) => total + item.quantity, 0);
  }, 0);

  document.getElementById("reportsContent").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><span>Total Revenue</span><strong>${money(revenue)}</strong></div>
      <div class="stat-card"><span>Orders</span><strong>${orders.length}</strong></div>
      <div class="stat-card"><span>Completed Orders</span><strong>${completed}</strong></div>
      <div class="stat-card"><span>Pending Orders</span><strong>${pending}</strong></div>
      <div class="stat-card"><span>Units Sold</span><strong>${unitsSold}</strong></div>
      <div class="stat-card"><span>Products</span><strong>${products.length}</strong></div>
    </div>
  `;
}

/* =========================================
   ADMIN SETTINGS
   ========================================= */

function loadAdminSettings() {
  document.getElementById("adminDisplayName").value = admin.displayName || "";
  document.getElementById("adminUsername").value = admin.username || "";
  document.getElementById("adminPassword").value = "";
}

function saveAdminSettings(event) {
  event.preventDefault();

  const displayName = document.getElementById("adminDisplayName").value.trim();
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (!displayName || !username) {
    return showToast("Name and username are required.");
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return showToast("That username is already used by a customer.");
  }

  const oldAdmin = { ...admin };

  admin.displayName = displayName;
  admin.username = username;

  if (password.trim()) {
    if (password.length < 4) {
      admin = oldAdmin;
      return showToast("Password must have at least 4 characters.");
    }
    admin.password = password;
  }

  if (!saveAll()) {
    admin = oldAdmin;
    return;
  }

  currentUser.name = displayName;
  currentUser.username = username;

  document.getElementById("welcomeText").textContent = "Hello, " + displayName;

  showToast("Admin settings saved.");
}

/* =========================================
   CUSTOMER PROFILE
   ========================================= */

function renderProfile() {
  const customerOrders = orders.filter(order =>
    order.username === currentUser.username
  );

  document.getElementById("profileContent").innerHTML = `
    <div class="profile-details">
      <h2>Account Details</h2>
      <p><strong>Name:</strong> ${escapeHTML(currentUser.name)}</p>
      <p><strong>Username:</strong> ${escapeHTML(currentUser.username)}</p>
      <p><strong>Account type:</strong> Customer</p>
      <h2>My Orders</h2>
      ${
        customerOrders.length
          ? customerOrders.map(order => `
            <div class="data-card">
              <h3>${escapeHTML(order.id)}</h3>
              <p>Date: ${new Date(order.date).toLocaleString()}</p>
              <p>Total: ${money(order.total)}</p>
              <p>Status: ${escapeHTML(order.status)}</p>
            </div>
          `).join("")
          : `<p>You have not placed an order yet.</p>`
      }
    </div>
  `;
}

/* =========================================
   START
   ========================================= */

document.addEventListener("DOMContentLoaded", initialize);
