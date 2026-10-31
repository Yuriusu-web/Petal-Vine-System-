
/* ==========================================
   PETAL & VINE FLOWER SHOP
   Front-end demonstration using localStorage
   COD payment only
========================================== */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  session: "pv_session",
  settings: "pv_settings"
};

const $ = id => document.getElementById(id);

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[char]);
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function makeId(prefix) {
  return prefix + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);
}

let users = load(STORAGE.users, []);
let products = load(STORAGE.products, []);
let orders = load(STORAGE.orders, []);
let settings = load(STORAGE.settings, { shopName: "Petal & Vine" });
let currentUser = null;
let currentPage = "";
let cart = [];
let checkoutItems = [];
let toastTimer;

const starterProducts = [
  { name: "Classic Red Roses", category: "Roses", description: "A timeless bouquet of beautiful red roses.", price: 850, stock: 20, image: "" },
  { name: "Pink Rose Bouquet", category: "Bouquet", description: "Soft pink roses for special moments.", price: 950, stock: 15, image: "" },
  { name: "Sunflower Bundle", category: "Bouquet", description: "Bright sunflowers to make someone smile.", price: 650, stock: 18, image: "" },
  { name: "White Lily Arrangement", category: "Arrangement", description: "Elegant white lilies in a lovely arrangement.", price: 1200, stock: 10, image: "" },
  { name: "Baby's Breath Bouquet", category: "Bouquet", description: "A delicate and charming bouquet.", price: 550, stock: 25, image: "" },
  { name: "Mixed Flower Bouquet", category: "Bouquet", description: "A colorful combination of seasonal flowers.", price: 1100, stock: 12, image: "" },
  { name: "Tulip Garden", category: "Arrangement", description: "A beautiful arrangement of fresh tulips.", price: 1350, stock: 8, image: "" },
  { name: "Orchid Plant", category: "Plants", description: "A graceful flowering orchid plant.", price: 1500, stock: 7, image: "" },
  { name: "Daisy Delight", category: "Bouquet", description: "Fresh daisies arranged with care.", price: 700, stock: 16, image: "" },
  { name: "Pink Carnations", category: "Bouquet", description: "Lovely carnations for thoughtful gifts.", price: 750, stock: 14, image: "" },
  { name: "Anniversary Blooms", category: "Occasion", description: "A romantic arrangement for anniversaries.", price: 1800, stock: 6, image: "" },
  { name: "Graduation Bouquet", category: "Occasion", description: "Celebrate achievements with fresh flowers.", price: 900, stock: 10, image: "" }
];

function initialize() {
  if (!products.length) {
    products = starterProducts.map(product => ({
      ...product, id: makeId("P")
    }));
    save(STORAGE.products, products);
  }

  users = load(STORAGE.users, []);
  products = load(STORAGE.products, []);
  orders = load(STORAGE.orders, []);
  settings = load(STORAGE.settings, { shopName: "Petal & Vine" });

  bindEvents();
  showCorrectAuthPanel();
  restoreSession();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function showMessage(message, type = "error") {
  const element = $("authMessage");
  element.textContent = message;
  element.style.color = type === "success" ? "var(--green)" : "var(--red)";
}

function showCorrectAuthPanel() {
  users = load(STORAGE.users, []);
  const hasAdmin = users.some(user => user.role === "admin");

  $("setupPanel").classList.toggle("hidden", hasAdmin);
  $("loginPanel").classList.toggle("hidden", !hasAdmin);
  $("registerPanel").classList.add("hidden");
  showMessage("");

  if (!hasAdmin) {
    $("setupPanel").classList.remove("hidden");
    $("loginPanel").classList.add("hidden");
  }
}

function showLoginPanel() {
  $("loginPanel").classList.remove("hidden");
  $("registerPanel").classList.add("hidden");
  $("setupPanel").classList.add("hidden");
  showMessage("");
}

function showRegisterPanel() {
  $("registerPanel").classList.remove("hidden");
  $("loginPanel").classList.add("hidden");
  $("setupPanel").classList.add("hidden");
  showMessage("");
}

function bindEvents() {
  $("setupForm").addEventListener("submit", createAdmin);
  $("registerForm").addEventListener("submit", registerCustomer);
  $("loginForm").addEventListener("submit", login);
  $("showRegister").addEventListener("click", showRegisterPanel);
  $("showLogin").addEventListener("click", showLoginPanel);
  $("logoutBtn").addEventListener("click", logout);
  $("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

  $("productForm").addEventListener("submit", saveProduct);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("printReceipt").addEventListener("click", () => window.print());

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => closeModal(button.dataset.close));
  });

  document.addEventListener("click", event => {
    const toggle = event.target.closest(".toggle-password");
    if (toggle) {
      const field = $(toggle.dataset.target);
      if (field) {
        field.type = field.type === "password" ? "text" : "password";
        toggle.textContent = field.type === "password" ? "Show" : "Hide";
      }
    }
  });

  $("navigation").addEventListener("click", event => {
    const button = event.target.closest("[data-page]");
    if (!button) return;
    navigate(button.dataset.page);
    $("sidebar").classList.remove("open");
  });

  $("pageContent").addEventListener("click", handlePageAction);
  $("pageContent").addEventListener("change", handlePageChange);
  $("pageContent").addEventListener("input", handlePageInput);
}

function createAdmin(event) {
  event.preventDefault();

  const username = $("setupUsername").value.trim();
  const password = $("setupPassword").value;
  const confirm = $("setupConfirm").value;

  if (username.length < 3) return showMessage("Username must have at least 3 characters.");
  if (password.length < 6) return showMessage("Password must have at least 6 characters.");
  if (password !== confirm) return showMessage("Passwords do not match.");

  users = load(STORAGE.users, []);
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return showMessage("Username is already taken.");
  }

  users.push({
    id: makeId("U"),
    name: "Administrator",
    username,
    password,
    role: "admin",
    createdAt: new Date().toISOString()
  });

  save(STORAGE.users, users);
  $("setupForm").reset();
  showLoginPanel();
  $("loginUsername").value = username;
  showMessage("Administrator account created. Please log in.", "success");
}

function registerCustomer(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (name.length < 2) return showMessage("Please enter your full name.");
  if (username.length < 3) return showMessage("Username must have at least 3 characters.");
  if (password.length < 6) return showMessage("Password must have at least 6 characters.");
  if (password !== confirm) return showMessage("Passwords do not match.");

  users = load(STORAGE.users, []);
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return showMessage("That username is already registered.");
  }

  users.push({
    id: makeId("U"),
    name,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString()
  });

  save(STORAGE.users, users);
  $("registerForm").reset();
  showLoginPanel();
  $("loginUsername").value = username;
  showMessage("Account created successfully. Please log in.", "success");
}

function login(event) {
  event.preventDefault();

  users = load(STORAGE.users, []);
  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(item =>
    item.username.toLowerCase() === username &&
    item.password === password
  );

  if (!user) return showMessage("Incorrect username or password.");

  currentUser = user;
  save(STORAGE.session, user.id);
  $("loginForm").reset();
  openApplication();
}

function restoreSession() {
  const sessionId = load(STORAGE.session, null);
  if (!sessionId) return;

  users = load(STORAGE.users, []);
  const user = users.find(item => item.id === sessionId);

  if (user) {
    currentUser = user;
    openApplication();
  } else {
    localStorage.removeItem(STORAGE.session);
  }
}

function openApplication() {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("sidebarName").textContent = currentUser.name;
  $("sidebarRole").textContent = currentUser.role === "admin" ? "Administrator" : "Customer";
  $("userAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("topUser").textContent = currentUser.username;

  buildNavigation();
  navigate(currentUser.role === "admin" ? "dashboard" : "shop");
}

function logout() {
  if (!confirm("Are you sure you want to log out?")) return;

  localStorage.removeItem(STORAGE.session);
  currentUser = null;
  cart = [];
  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("loginForm").reset();
  showCorrectAuthPanel();
}

function buildNavigation() {
  const adminLinks = [
    ["dashboard", "▦ Dashboard"],
    ["products", "✿ Products"],
    ["inventory", "▤ Inventory"],
    ["orders", "▣ Customer Orders"],
    ["users", "♙ User Management"],
    ["receipts", "▧ Receipts"],
    ["reports", "▥ Reports"],
    ["settings", "⚙ Settings"]
  ];

  const customerLinks = [
    ["shop", "✿ Shop Flowers"],
    ["cart", "🛒 My Cart"],
    ["myorders", "▣ My Orders"]
  ];

  const links = currentUser.role === "admin" ? adminLinks : customerLinks;

  $("navigation").innerHTML = links.map(([page, label]) =>
    `<button class="nav-btn" data-page="${page}">${label}</button>`
  ).join("");
}

const pageTitles = {
  dashboard: ["Dashboard", "Your shop overview"],
  products: ["Product Management", "Add, edit, and delete flower products"],
  inventory: ["Inventory", "Monitor your available stock"],
  orders: ["Customer Orders", "Manage customer purchases"],
  users: ["User Management", "Manage registered accounts"],
  receipts: ["Receipts", "View customer payment receipts"],
  reports: ["Reports", "Review shop performance"],
  settings: ["Settings", "Manage shop information"],
  shop: ["Flower Shop", "Find flowers for every occasion"],
  cart: ["My Cart", "Review your selected flowers"],
  myorders: ["My Orders", "Track your purchases"]
};

function navigate(page) {
  const adminPages = ["dashboard", "products", "inventory", "orders", "users", "receipts", "reports", "settings"];
  const customerPages = ["shop", "cart", "myorders"];

  if (!currentUser) return;
  if (currentUser.role === "admin" && !adminPages.includes(page)) return;
  if (currentUser.role === "customer" && !customerPages.includes(page)) return;

  currentPage = page;
  const title = pageTitles[page];

  $("pageHeading").textContent = title[0];
  $("pageSubheading").textContent = title[1];

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  renderPage();
}

function renderPage() {
  const renderers = {
    dashboard: renderDashboard,
    products: renderProducts,
    inventory: renderInventory,
    orders: renderOrders,
    users: renderUsers,
    receipts: renderReceipts,
    reports: renderReports,
    settings: renderSettings,
    shop: renderShop,
    cart: renderCart,
    myorders: renderMyOrders
  };

  if (renderers[currentPage]) renderers[currentPage]();
}

/* DASHBOARD */

function renderDashboard() {
  const revenue = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  const pending = orders.filter(order =>
    ["Pending", "Processing"].includes(order.status)
  ).length;

  const customers = users.filter(user => user.role === "customer").length;
  const lowStock = products.filter(product => product.stock <= 5).length;

  $("pageContent").innerHTML = `
    <div class="welcome-banner">
      <h2>Welcome to Petal & Vine ✿</h2>
      <p>Manage your flowers, customers, inventory, and orders in one place.</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><small>Total Products</small><h3>${products.length}</h3></div>
      <div class="stat-card"><small>Total Customers</small><h3>${customers}</h3></div>
      <div class="stat-card"><small>Active Orders</small><h3>${pending}</h3></div>
      <div class="stat-card"><small>Total Sales</small><h3>${money(revenue)}</h3></div>
    </div>
    <div class="content-card">
      <div class="section-heading"><h3>Recent Orders</h3><button class="small-btn" data-page-link="orders">View Orders</button></div>
      ${orders.length ? orderTable(orders.slice().reverse().slice(0, 5), true) : emptyState("No orders yet.")}
      <p class="muted" style="margin-top:18px">Products with low stock: <strong>${lowStock}</strong></p>
    </div>
  `;
}

/* PRODUCT MANAGEMENT */

function renderProducts() {
  $("pageContent").innerHTML = `
    <div class="toolbar">
      <input id="adminProductSearch" placeholder="Search products...">
      <select id="adminCategoryFilter">
        <option value="">All categories</option>
        ${categoryOptions()}
      </select>
      <button class="primary-btn" data-action="add-product">+ Add Product</button>
    </div>
    <div id="adminProductGrid" class="product-grid">${adminProductCards(products)}</div>
  `;
}

function adminProductCards(list) {
  if (!list.length) return emptyState("No products found.");

  return list.map(product => `
    <article class="product-card">
      <div class="product-image">${product.image
        ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.style.display='none'">`
        : "✿"}</div>
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.category)} · ${escapeHTML(product.description)}</p>
        <div class="product-price">${money(product.price)}</div>
        <p>Stock: ${product.stock}</p>
        <div class="product-actions">
          <button class="small-btn" data-action="edit-product" data-id="${product.id}">Edit</button>
          <button class="small-btn danger-btn" data-action="delete-product" data-id="${product.id}">Delete</button>
        </div>
      </div>
    </article>
  `).join("");
}

function categoryOptions() {
  return ["Bouquet", "Roses", "Arrangement", "Plants", "Occasion"]
    .map(category => `<option value="${category}">${category}</option>`).join("");
}

function openProductModal(id = "") {
  $("productForm").reset();
  $("productId").value = id;

  const product = products.find(item => item.id === id);

  $("productModalTitle").textContent = product ? "Edit Product" : "Add Product";

  if (product) {
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productDescription").value = product.description;
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;
    $("productImage").value = product.image || "";
  }

  openModal("productModal");
}

function saveProduct(event) {
  event.preventDefault();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (!name || !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return showToast("Please enter valid product details.");
  }

  const productData = {
    name,
    category: $("productCategory").value,
    description: $("productDescription").value.trim(),
    price,
    stock,
    image: $("productImage").value.trim()
  };

  if (id) {
    const index = products.findIndex(item => item.id === id);
    if (index === -1) return showToast("Product not found.");
    products[index] = { ...products[index], ...productData };
  } else {
    products.push({ id: makeId("P"), ...productData });
  }

  save(STORAGE.products, products);
  closeModal("productModal");
  renderPage();
  showToast(id ? "Product updated." : "Product added.");
}

/* INVENTORY */

function renderInventory() {
  $("pageContent").innerHTML = `
    <div class="content-card">
      <div class="section-heading"><h3>Stock Overview</h3><span class="muted">${products.length} products</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Stock Status</th><th>Action</th></tr></thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${product.stock}</td>
                <td>${product.stock === 0
                  ? '<span class="status cancelled">Out of Stock</span>'
                  : product.stock <= 5
                    ? '<span class="status processing">Low Stock</span>'
                    : '<span class="status delivered">In Stock</span>'}</td>
                <td><button class="small-btn" data-action="edit-product" data-id="${product.id}">Update</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* SHOP */

function renderShop() {
  $("pageContent").innerHTML = `
    <div class="welcome-banner">
      <h2>Say it with flowers ✿</h2>
      <p>Beautiful blooms, thoughtfully arranged for every occasion.</p>
    </div>
    <div class="toolbar">
      <input id="shopSearch" placeholder="Search flowers...">
      <select id="shopCategory">
        <option value="">All categories</option>
        ${categoryOptions()}
      </select>
    </div>
    <div id="shopProductGrid" class="product-grid">${customerProductCards(products)}</div>
  `;
}

function customerProductCards(list) {
  if (!list.length) return emptyState("No flowers available.");

  return list.map(product => `
    <article class="product-card">
      <div class="product-image">${product.image
        ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.style.display='none'">`
        : "✿"}</div>
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || product.category)}</p>
        <div class="product-price">${money(product.price)}</div>
        <p>${product.stock > 0 ? `${product.stock} available` : "Out of stock"}</p>
        <div class="product-actions">
          <button class="small-btn" data-action="add-cart" data-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
          <button class="primary-btn" data-action="buy-now" data-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>
        </div>
      </div>
    </article>
  `).join("");
}

/* CART */

function addToCart(id, quantity = 1) {
  const product = products.find(item => item.id === id);
  if (!product || product.stock <= 0) return showToast("Product is unavailable.");

  const existing = cart.find(item => item.productId === id);
  const newQuantity = (existing?.quantity || 0) + quantity;

  if (newQuantity > product.stock) return showToast("Not enough stock available.");

  if (existing) existing.quantity = newQuantity;
  else cart.push({ productId: id, quantity });

  showToast("Added to cart.");
}

function renderCart() {
  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean);

  if (!items.length) {
    $("pageContent").innerHTML = `<div class="content-card">${emptyState("Your cart is empty.")}<button class="primary-btn" data-page-link="shop">Continue Shopping</button></div>`;
    return;
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  $("pageContent").innerHTML = `
    <div class="content-card">
      <div class="section-heading"><h3>Shopping Cart</h3><span class="muted">${items.length} item types</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th>Action</th></tr></thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${escapeHTML(item.product.name)}</td>
                <td>${money(item.product.price)}</td>
                <td>
                  <div class="quantity-control">
                    <button data-action="cart-decrease" data-id="${item.productId}">−</button>
                    <strong>${item.quantity}</strong>
                    <button data-action="cart-increase" data-id="${item.productId}">+</button>
                  </div>
                </td>
                <td>${money(item.product.price * item.quantity)}</td>
                <td><button class="small-btn danger-btn" data-action="remove-cart" data-id="${item.productId}">Remove</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="cart-total">Total: ${money(total)}</div>
      <div class="toolbar" style="justify-content:flex-end">
        <button class="small-btn" data-page-link="shop">Continue Shopping</button>
        <button class="primary-btn" data-action="checkout-cart">Proceed to Checkout</button>
      </div>
    </div>
  `;
}

function updateCartQuantity(id, change) {
  const item = cart.find(entry => entry.productId === id);
  const product = products.find(entry => entry.id === id);
  if (!item || !product) return;

  const next = item.quantity + change;
  if (next <= 0) {
    cart = cart.filter(entry => entry.productId !== id);
  } else if (next > product.stock) {
    showToast("Quantity exceeds available stock.");
    return;
  } else {
    item.quantity = next;
  }

  renderCart();
}

/* CHECKOUT AND ORDERS */

function startCheckout(items) {
  if (!items.length) return showToast("There are no items to checkout.");

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity < 1 || item.quantity > product.stock) {
      return showToast("One or more items have insufficient stock.");
    }
  }

  checkoutItems = items.map(item => ({ ...item }));
  const total = checkoutItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + product.price * item.quantity;
  }, 0);

  $("checkoutSummary").innerHTML = `
    <strong>Order summary</strong>
    ${checkoutItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return `<div class="receipt-line"><span>${escapeHTML(product.name)} × ${item.quantity}</span><strong>${money(product.price * item.quantity)}</strong></div>`;
    }).join("")}
    <div class="receipt-total">Total: ${money(total)}</div>
  `;

  $("recipientName").value = currentUser.name;
  $("recipientPhone").value = "";
  $("deliveryAddress").value = "";
  $("orderNotes").value = "";
  openModal("checkoutModal");
}

function placeOrder(event) {
  event.preventDefault();

  const recipient = $("recipientName").value.trim();
  const phone = $("recipientPhone").value.trim();
  const address = $("deliveryAddress").value.trim();

  if (!recipient || !phone || !address) {
    return showToast("Please complete the delivery details.");
  }

  if (checkoutItems.length === 0) return showToast("No items to order.");

  for (const item of checkoutItems) {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.stock < item.quantity) {
      return showToast("Stock changed. Please review your cart.");
    }
  }

  const orderItems = checkoutItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  orderItems.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  const order = {
    id: makeId("ORD"),
    userId: currentUser.id,
    customerName: currentUser.name,
    username: currentUser.username,
    recipient,
    phone,
    address,
    notes: $("orderNotes").value.trim(),
    items: orderItems,
    total,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  save(STORAGE.orders, orders);
  save(STORAGE.products, products);

  const purchasedIds = checkoutItems.map(item => item.productId);
  cart = cart.filter(item => !purchasedIds.includes(item.productId));
  checkoutItems = [];

  closeModal("checkoutModal");
  showToast("Order placed successfully!");
  showReceipt(order.id);
  renderPage();
}

function updateOrderStatus(id, newStatus) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  if (order.status === "Cancelled" && newStatus !== "Cancelled") {
    return showToast("Cancelled orders cannot be reopened.");
  }

  if (!["Pending", "Processing", "Delivered", "Cancelled"].includes(newStatus)) return;

  if (newStatus === "Cancelled" && order.status !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
    save(STORAGE.products, products);
  }

  order.status = newStatus;
  save(STORAGE.orders, orders);
  renderPage();
  showToast("Order status updated.");
}

/* ORDER TABLE */

function orderTable(list, compact = false) {
  if (!list.length) return emptyState("No orders found.");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>
          ${compact ? "" : "<th>Actions</th>"}
        </tr></thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>${escapeHTML(order.id.slice(-9))}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>${money(order.total)}</td>
              <td><span class="status ${order.status.toLowerCase()}">${escapeHTML(order.status)}</span></td>
              ${compact ? "" : `
                <td>
                  <button class="small-btn" data-action="view-receipt" data-id="${order.id}">Receipt</button>
                  ${currentUser.role === "admin" ? `
                    <select data-order-status="${order.id}" aria-label="Update order status">
                      ${["Pending", "Processing", "Delivered", "Cancelled"].map(status =>
                        `<option value="${status}" ${order.status === status ? "selected" : ""} ${order.status === "Cancelled" && status !== "Cancelled" ? "disabled" : ""}>${status}</option>`
                      ).join("")}
                    </select>
                  ` : order.status === "Pending" ? `
                    <button class="small-btn danger-btn" data-action="cancel-order" data-id="${order.id}">Cancel</button>
                  ` : ""}
                </td>
              `}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderOrders() {
  $("pageContent").innerHTML = `
    <div class="content-card">
      <div class="section-heading"><h3>All Customer Orders</h3><span class="muted">${orders.length} orders</span></div>
      ${orderTable(orders.slice().reverse())}
    </div>
  `;
}

function renderMyOrders() {
  const mine = orders.filter(order => order.userId === currentUser.id).reverse();

  $("pageContent").innerHTML = `
    <div class="content-card">
      <div class="section-heading"><h3>My Purchases</h3><span class="muted">${mine.length} orders</span></div>
      ${orderTable(mine)}
    </div>
  `;
}

/* USER MANAGEMENT */

function renderUsers() {
  const customers = users.filter(user => user.role === "customer");

  $("pageContent").innerHTML = `
    <div class="content-card">
      <div class="section-heading"><h3>Registered Customers</h3><span class="muted">${customers.length} accounts</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Registered</th><th>Orders</th><th>Action</th></tr></thead>
          <tbody>
            ${customers.length ? customers.map(user => `
              <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.username)}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>${orders.filter(order => order.userId === user.id).length}</td>
                <td><button class="small-btn danger-btn" data-action="delete-user" data-id="${user.id}">Delete</button></td>
              </tr>
            `).join("") : `<tr><td colspan="5">No customer accounts yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* RECEIPTS */

function renderReceipts() {
  const list = currentUser.role === "admin"
    ? orders
    : orders.filter(order => order.userId === currentUser.id);

  $("pageContent").innerHTML = `
    <div class="content-card">
      <div class="section-heading"><h3>Order Receipts</h3></div>
      ${list.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Receipt</th></tr></thead>
          <tbody>${list.slice().reverse().map(order => `
            <tr>
              <td>${escapeHTML(order.id.slice(-9))}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>${money(order.total)}</td>
              <td><button class="small-btn" data-action="view-receipt" data-id="${order.id}">View Receipt</button></td>
            </tr>
          `).join("")}</tbody>
        </table></div>
      ` : emptyState("No receipts available.")}
    </div>
  `;
}

function showReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return showToast("Receipt not found.");

  if (currentUser.role !== "admin" && order.userId !== currentUser.id) {
    return showToast("You cannot view this receipt.");
  }

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>✿ Petal & Vine</h2>
      <p class="receipt-subtitle">Flower Boutique · Order Receipt</p>
      <div class="receipt-line"><span>Order ID</span><strong>${escapeHTML(order.id)}</strong></div>
      <div class="receipt-line"><span>Date</span><strong>${new Date(order.createdAt).toLocaleString()}</strong></div>
      <div class="receipt-line"><span>Customer</span><strong>${escapeHTML(order.customerName)}</strong></div>
      <div class="receipt-line"><span>Recipient</span><strong>${escapeHTML(order.recipient)}</strong></div>
      <div class="receipt-line"><span>Contact</span><strong>${escapeHTML(order.phone)}</strong></div>
      <div class="receipt-line"><span>Address</span><strong>${escapeHTML(order.address)}</strong></div>
      <div class="receipt-line"><span>Payment</span><strong>Cash on Delivery</strong></div>
      <div class="receipt-line"><span>Status</span><strong>${escapeHTML(order.status)}</strong></div>
      <h3 style="margin-top:20px;color:var(--wine)">Purchased Items</h3>
      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}
      <div class="receipt-total">TOTAL: ${money(order.total)}</div>
      ${order.notes ? `<p style="font-size:12px;margin-top:12px">Notes: ${escapeHTML(order.notes)}</p>` : ""}
      <p class="receipt-footer">Thank you for choosing Petal & Vine!<br>We appreciate your purchase.</p>
    </div>
  `;

  openModal("receiptModal");
}

/* REPORTS */

function renderReports() {
  const validOrders = orders.filter(order => order.status !== "Cancelled");
  const revenue = validOrders.reduce((sum, order) => sum + order.total, 0);
  const sold = validOrders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  const bestSellers = {};
  validOrders.forEach(order => order.items.forEach(item => {
    bestSellers[item.name] = (bestSellers[item.name] || 0) + item.quantity;
  }));

  const best = Object.entries(bestSellers).sort((a, b) => b[1] - a[1]);

  $("pageContent").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><small>Sales Revenue</small><h3>${money(revenue)}</h3></div>
      <div class="stat-card"><small>Orders</small><h3>${validOrders.length}</h3></div>
      <div class="stat-card"><small>Items Sold</small><h3>${sold}</h3></div>
      <div class="stat-card"><small>Products</small><h3>${products.length}</h3></div>
    </div>
    <div class="content-card">
      <div class="section-heading"><h3>Best-Selling Flowers</h3></div>
      ${best.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Product</th><th>Quantity Sold</th></tr></thead>
          <tbody>${best.map(([name, quantity]) => `
            <tr><td>${escapeHTML(name)}</td><td>${quantity}</td></tr>
          `).join("")}</tbody>
        </table></div>
      ` : emptyState("No sales data yet.")}
    </div>
  `;
}

/* SETTINGS */

function renderSettings() {
  $("pageContent").innerHTML = `
    <div class="content-card">
      <h3 style="color:var(--wine);font-family:'Playfair Display',serif">Shop Settings</h3>
      <form id="settingsForm">
        <label>Shop name</label>
        <input id="shopName" value="${escapeHTML(settings.shopName || "Petal & Vine")}" required>
        <label>Administrator username</label>
        <input id="adminUsername" value="${escapeHTML(currentUser.username)}" required minlength="3">
        <label>New password (leave blank to keep current password)</label>
        <div class="password-field">
          <input id="adminNewPassword" type="password" minlength="6">
          <button type="button" class="toggle-password" data-target="adminNewPassword">Show</button>
        </div>
        <label>Confirm new password</label>
        <div class="password-field">
          <input id="adminConfirmPassword" type="password" minlength="6">
          <button type="button" class="toggle-password" data-target="adminConfirmPassword">Show</button>
        </div>
        <button class="primary-btn">Save Settings</button>
      </form>
      <p class="muted" style="margin-top:20px">This demonstration stores data in this browser only.</p>
    </div>
  `;

  $("settingsForm").addEventListener("submit", saveSettings);
}

function saveSettings(event) {
  event.preventDefault();

  const username = $("adminUsername").value.trim();
  const newPassword = $("adminNewPassword").value;
  const confirm = $("adminConfirmPassword").value;

  if (username.length < 3) return showToast("Username must have at least 3 characters.");

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) return showToast("Username is already taken.");

  if (newPassword && newPassword.length < 6) {
    return showToast("Password must have at least 6 characters.");
  }

  if (newPassword !== confirm) {
    return showToast("Passwords do not match.");
  }

  currentUser.username = username;
  if (newPassword) currentUser.password = newPassword;

  settings.shopName = $("shopName").value.trim() || "Petal & Vine";

  save(STORAGE.users, users);
  save(STORAGE.settings, settings);

  $("topUser").textContent = currentUser.username;
  showToast("Settings saved.");
  renderSettings();
}

/* EVENT HANDLERS */

function handlePageAction(event) {
  const pageLink = event.target.closest("[data-page-link]");
  if (pageLink) {
    navigate(pageLink.dataset.pageLink);
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  switch (action) {
    case "add-product":
      openProductModal();
      break;

    case "edit-product":
      openProductModal(id);
      break;

    case "delete-product": {
      const hasOrder = orders.some(order =>
        order.items.some(item => item.productId === id) &&
        order.status !== "Cancelled"
      );

      if (hasOrder) return showToast("This product belongs to an active or completed order.");

      if (confirm("Delete this product?")) {
        products = products.filter(product => product.id !== id);
        cart = cart.filter(item => item.productId !== id);
        save(STORAGE.products, products);
        renderPage();
        showToast("Product deleted.");
      }
      break;
    }

    case "add-cart":
      addToCart(id);
      break;

    case "buy-now":
      startCheckout([{ productId: id, quantity: 1 }]);
      break;

    case "cart-increase":
      updateCartQuantity(id, 1);
      break;

    case "cart-decrease":
      updateCartQuantity(id, -1);
      break;

    case "remove-cart":
      cart = cart.filter(item => item.productId !== id);
      renderCart();
      break;

    case "checkout-cart":
      startCheckout(cart);
      break;

    case "view-receipt":
      showReceipt(id);
      break;

    case "cancel-order": {
      const order = orders.find(item => item.id === id);
      if (!order || order.status !== "Pending") {
        return showToast("Only pending orders can be cancelled by customers.");
      }

      if (confirm("Cancel this order?")) {
        updateOrderStatus(id, "Cancelled");
      }
      break;
    }

    case "delete-user": {
      if (!confirm("Delete this customer account? Their existing orders will remain in the records.")) return;

      users = users.filter(user => user.id !== id);
      save(STORAGE.users, users);
      renderUsers();
      showToast("Customer account deleted.");
      break;
    }
  }
}

function handlePageChange(event) {
  if (event.target.id === "adminCategoryFilter" || event.target.id === "adminProductSearch") {
    filterAdminProducts();
  }

  if (event.target.id === "shopCategory" || event.target.id === "shopSearch") {
    filterShopProducts();
  }

  if (event.target.matches("[data-order-status]")) {
    updateOrderStatus(event.target.dataset.orderStatus, event.target.value);
  }
}

function handlePageInput(event) {
  if (event.target.id === "adminProductSearch") filterAdminProducts();
  if (event.target.id === "shopSearch") filterShopProducts();
}

function filterAdminProducts() {
  const search = ($("adminProductSearch")?.value || "").toLowerCase();
  const category = $("adminCategoryFilter")?.value || "";

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) &&
    (!category || product.category === category)
  );

  $("adminProductGrid").innerHTML = adminProductCards(filtered);
}

function filterShopProducts() {
  const search = ($("shopSearch")?.value || "").toLowerCase();
  const category = $("shopCategory")?.value || "";

  const filtered = products.filter(product =>
    product.stock > 0 &&
    product.name.toLowerCase().includes(search) &&
    (!category || product.category === category)
  );

  $("shopProductGrid").innerHTML = customerProductCards(filtered);
}

/* MODAL HELPERS */

function openModal(id) {
  $(id).classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

function emptyState(message) {
  return `<div class="empty-state"><span>✿</span>${escapeHTML(message)}</div>`;
}

initialize();
