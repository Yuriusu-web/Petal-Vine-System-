"use strict";

/* =====================================
   PETAL & VINE
   FLOWER SHOP MANAGEMENT SYSTEM
===================================== */

const $ = (id) => document.getElementById(id);

const KEYS = {
  users: "petal_vine_users",
  products: "petal_vine_products",
  orders: "petal_vine_orders"
};

const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Red Rose Bouquet", category: "Roses", emoji: "🌹", price: 850, stock: 15 },
  { id: "p2", name: "Pink Tulip Bouquet", category: "Tulips", emoji: "🌷", price: 950, stock: 12 },
  { id: "p3", name: "Sunflower Bundle", category: "Sunflowers", emoji: "🌻", price: 650, stock: 20 },
  { id: "p4", name: "Mixed Flower Bouquet", category: "Bouquet", emoji: "💐", price: 1200, stock: 10 },
  { id: "p5", name: "White Lily Arrangement", category: "Other", emoji: "🤍", price: 1100, stock: 8 },
  { id: "p6", name: "Potted Plant", category: "Plants", emoji: "🪴", price: 450, stock: 14 }
];

let currentUser = null;
let cart = [];
let toastTimer = null;
let activeReceiptOrder = null;

/* =====================================
   STORAGE
===================================== */

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
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
    console.error("Storage save error:", error);
    showToast("Unable to save data. Check your browser storage.");
    return false;
  }
}

function getUsers() {
  return readData(KEYS.users, []);
}

function getProducts() {
  return readData(KEYS.products, DEFAULT_PRODUCTS);
}

function getOrders() {
  return readData(KEYS.orders, []);
}

function initializeStorage() {
  if (localStorage.getItem(KEYS.products) === null) {
    saveData(KEYS.products, DEFAULT_PRODUCTS);
  }

  if (localStorage.getItem(KEYS.users) === null) {
    saveData(KEYS.users, []);
  }

  if (localStorage.getItem(KEYS.orders) === null) {
    saveData(KEYS.orders, []);
  }
}

/* =====================================
   GENERAL HELPERS
===================================== */

function money(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function makeId(prefix) {
  return prefix + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =====================================
   LOGIN AND REGISTRATION
===================================== */

function showAuthView(view) {
  $("authChoices").classList.toggle("hidden", view !== "choices");
  $("loginForm").classList.toggle("hidden", view !== "login");
  $("registerForm").classList.toggle("hidden", view !== "register");

  $("loginError").textContent = "";
  $("registerError").textContent = "";
}

function login(username, password) {
  const cleanUsername = username.trim().toLowerCase();

  if (cleanUsername === "admin" && password === "Admin123") {
    currentUser = {
      username: "admin",
      fullName: "Administrator",
      role: "admin"
    };

    startApp();
    return;
  }

  const user = getUsers().find((item) =>
    item.username.toLowerCase() === cleanUsername &&
    item.password === password
  );

  if (!user) {
    $("loginError").textContent = "Incorrect username or password.";
    return;
  }

  currentUser = {
    username: user.username,
    fullName: user.fullName,
    role: "customer"
  };

  startApp();
}

function registerCustomer() {
  const fullName = $("regFullName").value.trim();
  const username = $("regUsername").value.trim();
  const password = $("regPassword").value;
  const confirm = $("regConfirm").value;

  if (!fullName || !username || !password || !confirm) {
    $("registerError").textContent = "Please complete all fields.";
    return;
  }

  if (username.length < 3) {
    $("registerError").textContent =
      "Username must be at least 3 characters.";
    return;
  }

  if (username.toLowerCase() === "admin") {
    $("registerError").textContent = "This username is reserved.";
    return;
  }

  if (password.length < 6) {
    $("registerError").textContent =
      "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerError").textContent = "Passwords do not match.";
    return;
  }

  const users = getUsers();

  if (users.some((user) =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("registerError").textContent =
      "This username is already registered.";
    return;
  }

  users.push({
    id: makeId("user"),
    fullName,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString()
  });

  if (!saveData(KEYS.users, users)) return;

  $("registerForm").reset();
  showAuthView("login");
  $("loginUsername").value = username;

  showToast("Account created! Please log in.");
}

function startApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("welcomeUser").textContent = `Hello, ${currentUser.fullName}`;

  $("dashboardMessage").textContent =
    currentUser.role === "admin"
      ? "Welcome to your flower shop management dashboard."
      : "Welcome! Find beautiful flowers for your special moments.";

  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle(
      "hidden",
      currentUser.role !== "admin"
    );
  });

  document.querySelectorAll(".customer-only").forEach((element) => {
    element.classList.toggle(
      "hidden",
      currentUser.role !== "customer"
    );
  });

  $("checkoutName").value =
    currentUser.role === "customer"
      ? currentUser.fullName
      : "";

  $("currentYear").textContent = new Date().getFullYear();

  cart = [];
  updateCart();
  refreshAll();
  showPage("dashboard");
}

function logout() {
  currentUser = null;
  cart = [];
  activeReceiptOrder = null;

  $("receiptModal").classList.add("hidden");
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");

  $("loginForm").reset();
  $("registerForm").reset();

  showAuthView("choices");
}

/* =====================================
   NAVIGATION
===================================== */

function showPage(pageName) {
  if (!currentUser) return;

  const page = $(pageName);

  if (!page) return;

  const adminPages = [
    "inventory",
    "customers",
    "reports",
    "receipts"
  ];

  if (
    adminPages.includes(pageName) &&
    currentUser.role !== "admin"
  ) {
    showToast("Administrator access required.");
    return;
  }

  if (
    pageName === "cart" &&
    currentUser.role !== "customer"
  ) {
    showToast("Shopping Cart is only available to customers.");
    return;
  }

  document.querySelectorAll(".page").forEach((section) => {
    section.classList.add("hidden");
  });

  page.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "dashboard") renderDashboard();
  if (pageName === "inventory") renderInventory();
  if (pageName === "shop") renderShop();
  if (pageName === "cart") renderCart();
  if (pageName === "orders") renderOrders();
  if (pageName === "receipts") renderReceipts();
  if (pageName === "customers") renderCustomers();
  if (pageName === "reports") renderReports();
}

/* =====================================
   PRODUCT DISPLAY
===================================== */

function productCard(product, mode) {
  const stock = Number(product.stock);
  const outOfStock = stock <= 0;

  let actions = "";

  if (currentUser.role === "admin") {
    actions = `
      <button class="secondary-btn"
        data-action="edit-product"
        data-id="${escapeHTML(product.id)}">
        Edit
      </button>

      <button class="danger-btn"
        data-action="delete-product"
        data-id="${escapeHTML(product.id)}">
        Delete
      </button>
    `;
  } else {
    actions = `
      <button class="primary-btn"
        data-action="add-cart"
        data-id="${escapeHTML(product.id)}"
        ${outOfStock ? "disabled" : ""}>
        Add to Cart
      </button>

      <button class="buy-now-btn"
        data-action="buy-now"
        data-id="${escapeHTML(product.id)}"
        ${outOfStock ? "disabled" : ""}>
        Buy Now
      </button>
    `;
  }

  return `
    <article class="product-card">
      <div class="product-emoji">
        ${escapeHTML(product.emoji || "💐")}
      </div>

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>

        <p class="product-category">
          ${escapeHTML(product.category)}
        </p>

        <p class="product-price">
          ${money(product.price)}
        </p>

        <p class="stock-label">
          ${outOfStock ? "Out of stock" : `${stock} available`}
        </p>

        <div class="product-actions">
          ${actions}
        </div>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const products = getProducts();
  const orders = getOrders();
  const users = getUsers();

  $("dashboardProducts").innerHTML = products.length
    ? products.slice(0, 4).map((product) =>
        productCard(product, "dashboard")
      ).join("")
    : '<p class="empty-state">No products available yet.</p>';

  if (currentUser.role === "admin") {
    $("statProducts").textContent = products.length;
    $("statOrders").textContent = orders.length;
    $("statCustomers").textContent = users.length;

    const revenue = orders
      .filter((order) => order.status === "Completed")
      .reduce((sum, order) => sum + Number(order.total), 0);

    $("statRevenue").textContent = money(revenue);
  }
}

function renderInventory() {
  if (currentUser.role !== "admin") return;

  const search = $("inventorySearch").value.toLowerCase();

  const products = getProducts().filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search)
  );

  $("inventoryProducts").innerHTML = products.length
    ? products.map((product) =>
        productCard(product, "inventory")
      ).join("")
    : '<p class="empty-state">No matching products found.</p>';
}

function renderShop() {
  const search = $("shopSearch").value.toLowerCase();

  const products = getProducts().filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search)
  );

  $("shopProducts").innerHTML = products.length
    ? products.map((product) =>
        productCard(product, "shop")
      ).join("")
    : '<p class="empty-state">No flowers found.</p>';
}

function refreshAll() {
  renderDashboard();
  renderInventory();
  renderShop();
  renderOrders();
  renderReceipts();
  renderCustomers();
  renderReports();
}

/* =====================================
   INVENTORY MANAGEMENT
===================================== */

function openProductEditor(product = null) {
  if (currentUser.role !== "admin") {
    showToast("Administrator access required.");
    return;
  }

  $("productEditor").classList.remove("hidden");

  $("editorTitle").textContent =
    product ? "Edit Product" : "Add New Product";

  $("productId").value = product ? product.id : "";
  $("productName").value = product ? product.name : "";
  $("productCategory").value = product ? product.category : "Bouquet";
  $("productEmoji").value = product ? product.emoji : "💐";
  $("productPrice").value = product ? product.price : "";
  $("productStock").value = product ? product.stock : "";

  $("productEditor").scrollIntoView({ behavior: "smooth" });
}

function closeProductEditor() {
  $("productEditor").classList.add("hidden");
  $("productForm").reset();
  $("productId").value = "";
}

function saveProduct(event) {
  event.preventDefault();

  if (currentUser.role !== "admin") {
    showToast("Administrator access required.");
    return;
  }

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const emoji = $("productEmoji").value.trim() || "💐";
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    showToast("Please enter valid product details.");
    return;
  }

  const products = getProducts();

  if (id) {
    const index = products.findIndex((item) => item.id === id);

    if (index === -1) {
      showToast("Product not found.");
      return;
    }

    products[index] = {
      ...products[index],
      name,
      category,
      emoji,
      price,
      stock
    };
  } else {
    products.push({
      id: makeId("product"),
      name,
      category,
      emoji,
      price,
      stock
    });
  }

  if (!saveData(KEYS.products, products)) return;

  closeProductEditor();
  refreshAll();

  showToast(id ? "Product updated!" : "Product added!");
}

function editProduct(id) {
  if (currentUser.role !== "admin") return;

  const product = getProducts().find((item) => item.id === id);

  if (product) openProductEditor(product);
}

function deleteProduct(id) {
  if (currentUser.role !== "admin") return;

  const product = getProducts().find((item) => item.id === id);

  if (!product) return;

  if (!confirm(`Delete "${product.name}"?`)) return;

  const products = getProducts().filter((item) => item.id !== id);

  if (!saveData(KEYS.products, products)) return;

  cart = cart.filter((item) => item.productId !== id);

  updateCart();
  refreshAll();
  showToast("Product deleted.");
}

/* =====================================
   CUSTOMER SHOPPING CART
===================================== */

function addToCart(id) {
  if (currentUser.role !== "customer") {
    showToast("Only customers can add products to cart.");
    return;
  }

  const product = getProducts().find((item) => item.id === id);

  if (!product) return;

  const existing = cart.find((item) => item.productId === id);
  const quantity = existing ? existing.quantity : 0;

  if (quantity >= Number(product.stock)) {
    showToast("You cannot add more than the available stock.");
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: id, quantity: 1 });
  }

  updateCart();
  showToast("Added to cart!");
}

function buyNow(id) {
  if (currentUser.role !== "customer") {
    showToast("Only customers can purchase products.");
    return;
  }

  const product = getProducts().find((item) => item.id === id);

  if (!product || Number(product.stock) <= 0) {
    showToast("This product is out of stock.");
    return;
  }

  const existing = cart.find((item) => item.productId === id);

  if (existing) {
    if (existing.quantity >= Number(product.stock)) {
      showToast("Not enough stock available.");
      return;
    }

    existing.quantity += 1;
  } else {
    cart.push({ productId: id, quantity: 1 });
  }

  updateCart();
  showPage("cart");
  showToast("Flower added! Complete your checkout.");
}

function changeCartQuantity(id, change) {
  if (currentUser.role !== "customer") return;

  const item = cart.find((entry) => entry.productId === id);
  const product = getProducts().find((entry) => entry.id === id);

  if (!item || !product) return;

  const nextQuantity = item.quantity + change;

  if (nextQuantity <= 0) {
    cart = cart.filter((entry) => entry.productId !== id);
  } else if (nextQuantity <= Number(product.stock)) {
    item.quantity = nextQuantity;
  } else {
    showToast("Not enough stock available.");
  }

  updateCart();
}

function updateCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  $("cartCount").textContent = count;

  if (currentUser && currentUser.role === "customer") {
    renderCart();
  }
}

function renderCart() {
  if (!currentUser || currentUser.role !== "customer") return;

  const products = getProducts();
  let total = 0;

  const rows = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) return "";

    const subtotal = Number(product.price) * item.quantity;
    total += subtotal;

    return `
      <div class="cart-row">
        <div class="cart-row-info">
          <strong>
            ${escapeHTML(product.emoji)}
            ${escapeHTML(product.name)}
          </strong>
          <p>${money(product.price)} each</p>
          <p>Subtotal: ${money(subtotal)}</p>
        </div>

        <div class="quantity-controls">
          <button data-action="cart-minus"
            data-id="${escapeHTML(product.id)}">−</button>

          <strong>${item.quantity}</strong>

          <button data-action="cart-plus"
            data-id="${escapeHTML(product.id)}">+</button>

          <button class="danger-btn"
            data-action="remove-cart"
            data-id="${escapeHTML(product.id)}">
            Remove
          </button>
        </div>
      </div>
    `;
  }).join("");

  $("cartItems").innerHTML = rows ||
    '<p class="empty-state">Your cart is empty. Visit the Shop to choose flowers.</p>';

  $("cartTotal").textContent = money(total);
}

/* =====================================
   CHECKOUT
===================================== */

function checkout(event) {
  event.preventDefault();

  if (currentUser.role !== "customer") {
    showToast("Only customers can place orders.");
    return;
  }

  if (cart.length === 0) {
    showToast("Your cart is empty.");
    return;
  }

  const customerName = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();
  const payment = $("paymentMethod").value;

  if (!customerName || !phone || !address) {
    showToast("Please complete your checkout details.");
    return;
  }

  const products = getProducts();
  const orderItems = [];
  let total = 0;

  for (const cartItem of cart) {
    const product = products.find((item) =>
      item.id === cartItem.productId
    );

    if (!product || Number(product.stock) < cartItem.quantity) {
      showToast("Insufficient stock. Please review your cart.");
      refreshAll();
      return;
    }

    const subtotal = Number(product.price) * cartItem.quantity;

    orderItems.push({
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      price: Number(product.price),
      quantity: cartItem.quantity,
      subtotal
    });

    total += subtotal;
  }

  const updatedProducts = products.map((product) => {
    const cartItem = cart.find((item) => item.productId === product.id);

    return cartItem
      ? {
          ...product,
          stock: Number(product.stock) - cartItem.quantity
        }
      : product;
  });

  const orders = getOrders();

  const order = {
    id: makeId("order"),
    customerUsername: currentUser.username,
    customerName,
    phone,
    address,
    payment,
    items: orderItems,
    total,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  if (!saveData(KEYS.orders, [...orders, order])) return;

  if (!saveData(KEYS.products, updatedProducts)) {
    saveData(KEYS.orders, orders);
    return;
  }

  cart = [];
  $("checkoutForm").reset();
  $("checkoutName").value = currentUser.fullName;

  updateCart();
  refreshAll();

  showPage("orders");

  // Automatically display the customer's receipt.
  showReceipt(order);

  showToast("Your order has been placed successfully!");
}

/* =====================================
   RECEIPTS
===================================== */

function showReceipt(order) {
  if (!order || !currentUser) return;

  // Admin can view all receipts.
  // Customers can only view their own receipts.
  if (
    currentUser.role !== "admin" &&
    order.customerUsername !== currentUser.username
  ) {
    showToast("You cannot view this receipt.");
    return;
  }

  activeReceiptOrder = order;

  const details = $("receiptDetails");

  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "Unknown";

  const items = (order.items || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const subtotal = Number(item.subtotal ?? price * quantity);

    return `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td>${quantity}</td>
        <td>${money(price)}</td>
        <td>${money(subtotal)}</td>
      </tr>
    `;
  }).join("");

  details.innerHTML = `
    <div class="receipt-info">
      <p><strong>Receipt No.:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
      <p><strong>Order Status:</strong> ${escapeHTML(order.status)}</p>
      <p><strong>Date:</strong> ${escapeHTML(date)}</p>
    </div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>Flower</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items}
      </tbody>
    </table>

    <div class="receipt-total">
      Total: ${money(order.total)}
    </div>

    <div class="receipt-footer">
      <p>Thank you for shopping at Petal & Vine!</p>
      <p>Every flower tells a story. 🌷</p>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function closeReceipt() {
  $("receiptModal").classList.add("hidden");
  activeReceiptOrder = null;
}

function printReceipt() {
  if (!activeReceiptOrder) {
    showToast("Please select a receipt first.");
    return;
  }

  window.print();
}

function renderReceipts() {
  if (!currentUser || currentUser.role !== "admin") return;

  const orders = getOrders();

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (!sortedOrders.length) {
    $("receiptsList").innerHTML =
      '<p class="empty-state">No customer receipts yet. Receipts will appear here after customers place orders.</p>';
    return;
  }

  $("receiptsList").innerHTML = sortedOrders.map((order) => {
    const date = order.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "Unknown date";

    const itemCount = (order.items || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    return `
      <div class="receipt-list-card">
        <h3>Receipt #${escapeHTML(order.id)}</h3>

        <p class="receipt-list-meta">
          <strong>Customer:</strong>
          ${escapeHTML(order.customerName)}
        </p>

        <p class="receipt-list-meta">
          <strong>Date:</strong> ${escapeHTML(date)}
        </p>

        <p class="receipt-list-meta">
          <strong>Items:</strong> ${itemCount}
        </p>

        <p class="receipt-list-meta">
          <strong>Payment:</strong> ${escapeHTML(order.payment)}
        </p>

        <p class="receipt-list-meta">
          <strong>Status:</strong> ${escapeHTML(order.status)}
        </p>

        <p>
          <strong>Total: ${money(order.total)}</strong>
        </p>

        <div class="receipt-list-actions">
          <button class="primary-btn"
            data-action="view-receipt"
            data-id="${escapeHTML(order.id)}">
            View Receipt
          </button>

          <button class="secondary-btn"
            data-action="print-saved-receipt"
            data-id="${escapeHTML(order.id)}">
            Print Receipt
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function findAndShowReceipt(id) {
  const order = getOrders().find((item) => item.id === id);

  if (!order) {
    showToast("Receipt not found.");
    return;
  }

  showReceipt(order);
}

/* =====================================
   ORDER MANAGEMENT
===================================== */

function renderOrders() {
  if (!currentUser) return;

  const orders = getOrders();

  const visibleOrders = currentUser.role === "admin"
    ? orders
    : orders.filter((order) =>
        order.customerUsername === currentUser.username
      );

  $("ordersTitle").textContent =
    currentUser.role === "admin" ? "All Customer Orders" : "My Orders";

  if (!visibleOrders.length) {
    $("ordersList").innerHTML =
      '<p class="empty-state">No orders yet.</p>';
    return;
  }

  $("ordersList").innerHTML = [...visibleOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((order) => {
      const date = new Date(order.createdAt).toLocaleString();

      const items = (order.items || []).map((item) => `
        <li>
          ${escapeHTML(item.emoji || "💐")}
          ${escapeHTML(item.name)}
          × ${Number(item.quantity)}
          — ${money(item.subtotal ?? item.price * item.quantity)}
        </li>
      `).join("");

      let actions = "";

      if (currentUser.role === "admin") {
        actions = order.status === "Pending" ? `
          <div class="order-actions">
            <button class="success-btn"
              data-action="complete-order"
              data-id="${escapeHTML(order.id)}">
              Mark Completed
            </button>

            <button class="danger-btn"
              data-action="cancel-order"
              data-id="${escapeHTML(order.id)}">
              Cancel Order
            </button>
          </div>
        ` : "";
      } else if (order.status === "Pending") {
        actions = `
          <div class="order-actions">
            <button class="danger-btn"
              data-action="cancel-order"
              data-id="${escapeHTML(order.id)}">
              Cancel Order
            </button>
          </div>
        `;
      }

      return `
        <article class="order-card">
          <h3>Order #${escapeHTML(order.id)}</h3>

          <span class="status">${escapeHTML(order.status)}</span>

          <p class="order-meta">Date: ${escapeHTML(date)}</p>
          <p class="order-meta">Customer: ${escapeHTML(order.customerName)}</p>
          <p class="order-meta">Phone: ${escapeHTML(order.phone)}</p>
          <p class="order-meta">Address: ${escapeHTML(order.address)}</p>
          <p class="order-meta">Payment: ${escapeHTML(order.payment)}</p>

          <ul>${items}</ul>

          <p><strong>Total: ${money(order.total)}</strong></p>

          <div class="order-actions">
            <button class="primary-btn"
              data-action="view-receipt"
              data-id="${escapeHTML(order.id)}">
              View Receipt
            </button>
          </div>

          ${actions}
        </article>
      `;
    }).join("");
}

function updateOrderStatus(id, newStatus) {
  if (!currentUser || currentUser.role !== "admin") {
    showToast("Administrator access required.");
    return;
  }

  const orders = getOrders();
  const order = orders.find((item) => item.id === id);

  if (!order || order.status !== "Pending") return;

  let updatedProducts = null;

  if (newStatus === "Cancelled") {
    if (!confirm("Cancel this order and return its items to inventory?")) {
      return;
    }

    const products = getProducts();

    updatedProducts = products.map((product) => {
      const orderedItem = order.items.find((item) =>
        item.productId === product.id
      );

      return orderedItem
        ? {
            ...product,
            stock: Number(product.stock) + orderedItem.quantity
          }
        : product;
    });

    if (!saveData(KEYS.products, updatedProducts)) return;
  }

  order.status = newStatus;

  if (!saveData(KEYS.orders, orders)) {
    if (updatedProducts) {
      const restoredProducts = updatedProducts.map((product) => {
        const orderedItem = order.items.find((item) =>
          item.productId === product.id
        );

        return orderedItem
          ? {
              ...product,
              stock: Number(product.stock) - orderedItem.quantity
            }
          : product;
      });

      saveData(KEYS.products, restoredProducts);
    }

    showToast("Could not update order status.");
    return;
  }

  refreshAll();
  showToast(`Order ${newStatus.toLowerCase()}.`);
}

/* =====================================
   CUSTOMERS AND REPORTS
===================================== */

function renderCustomers() {
  if (!currentUser || currentUser.role !== "admin") return;

  const users = getUsers();

  $("customersList").innerHTML = users.length
    ? users.map((user) => `
        <div class="customer-row">
          <strong>${escapeHTML(user.fullName)}</strong>
          <p class="order-meta">
            Username: ${escapeHTML(user.username)}
          </p>
          <p class="order-meta">
            Registered:
            ${escapeHTML(
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "Unknown"
            )}
          </p>
        </div>
      `).join("")
    : '<p class="empty-state">No registered customers yet.</p>';
}

function renderReports() {
  if (!currentUser || currentUser.role !== "admin") return;

  const orders = getOrders();

  const completed = orders.filter(
    (order) => order.status === "Completed"
  );

  const pending = orders.filter(
    (order) => order.status === "Pending"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;
  $("reportPending").textContent = pending.length;
}

/* =====================================
   EVENT LISTENERS
===================================== */

function setupEvents() {
  $("showLogin").addEventListener("click", () =>
    showAuthView("login")
  );

  $("showRegister").addEventListener("click", () =>
    showAuthView("register")
  );

  $("backFromLogin").addEventListener("click", () =>
    showAuthView("choices")
  );

  $("backFromRegister").addEventListener("click", () =>
    showAuthView("choices")
  );

  $("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    login(
      $("loginUsername").value,
      $("loginPassword").value
    );
  });

  $("registerForm").addEventListener("submit", (event) => {
    event.preventDefault();
    registerCustomer();
  });

  $("logoutBtn").addEventListener("click", logout);

  $("navigation").addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");

    if (button) {
      showPage(button.dataset.page);
    }
  });

  $("addProductBtn").addEventListener("click", () =>
    openProductEditor()
  );

  $("cancelProductBtn").addEventListener("click", closeProductEditor);

  $("productForm").addEventListener("submit", saveProduct);

  $("inventorySearch").addEventListener("input", renderInventory);
  $("shopSearch").addEventListener("input", renderShop);

  $("checkoutForm").addEventListener("submit", checkout);

  $("printReceiptBtn").addEventListener("click", printReceipt);

  $("closeReceiptBtn").addEventListener("click", closeReceipt);

  // Close receipt when clicking outside the receipt card.
  $("receiptModal").addEventListener("click", (event) => {
    if (event.target === $("receiptModal")) {
      closeReceipt();
    }
  });

  // PASSWORD EYE BUTTONS
  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $(button.dataset.togglePassword);

      if (!input) return;

      const isHidden = input.type === "password";

      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "🙈" : "👁";

      button.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
      );
    });
  });

  // PRODUCT, CART, ORDER, AND RECEIPT BUTTONS
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    switch (action) {
      case "edit-product":
        editProduct(id);
        break;

      case "delete-product":
        deleteProduct(id);
        break;

      case "add-cart":
        addToCart(id);
        break;

      case "buy-now":
        buyNow(id);
        break;

      case "cart-minus":
        changeCartQuantity(id, -1);
        break;

      case "cart-plus":
        changeCartQuantity(id, 1);
        break;

      case "remove-cart":
        if (currentUser.role === "customer") {
          cart = cart.filter((item) => item.productId !== id);
          updateCart();
        }
        break;

      case "complete-order":
        if (currentUser.role === "admin") {
          updateOrderStatus(id, "Completed");
        }
        break;

      case "cancel-order":
        if (
          currentUser.role === "admin" ||
          currentUser.role === "customer"
        ) {
          const order = getOrders().find((item) => item.id === id);

          if (
            currentUser.role === "customer" &&
            (!order || order.customerUsername !== currentUser.username)
          ) {
            showToast("You cannot cancel this order.");
            return;
          }

          updateOrderStatus(id, "Cancelled");
        }
        break;

      case "view-receipt":
        findAndShowReceipt(id);
        break;

      case "print-saved-receipt":
        findAndShowReceipt(id);
        break;
    }
  });
}

/* =====================================
   START APPLICATION
===================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeStorage();
  setupEvents();

  $("currentYear").textContent = new Date().getFullYear();

  showAuthView("choices");
});
