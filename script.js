"use strict";

/* =========================================================
   PETAL & VINE FLOWER BOUTIQUE
   DATA STRUCTURES FINAL PROJECT
   Data Structures: ARRAY + QUEUE (FIFO)
   Storage: Browser localStorage
   No database required.
   Default Admin: admin / Admin123
========================================================= */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  cart: "pv_cart",
  session: "pv_session",
  orderQueue: "pv_order_queue"
};

const $ = id => document.getElementById(id);

const money = value => "₱" + Number(value || 0).toLocaleString("en-PH", {
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

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.warn("Unable to read storage:", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Unable to save:", error);
    showToast("Storage is full or unavailable. Try using a smaller image.", true);
    return false;
  }
}

function makeId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short"
      });
}

function validText(value, min = 1, max = 100) {
  const text = String(value ?? "").trim();
  return text.length >= min && text.length <= max;
}

function validPhone(value) {
  return /^[0-9+()\-\s]{7,20}$/.test(String(value || "").trim());
}

/* =========================================================
   DATA STRUCTURE 1: ARRAY
   Used for users, products, carts and orders.
========================================================= */

let users = [];
let products = [];
let orders = [];
let cart = [];
let currentUser = null;
let toastTimer = null;

/* =========================================================
   DATA STRUCTURE 2: QUEUE (FIFO)
   FIRST IN, FIRST OUT

   enqueue() = Add an order to the rear.
   dequeue() = Remove the oldest order.
   peek()    = View the first order.
   remove()  = Remove a specific order.
========================================================= */

class Queue {
  constructor(items = []) {
    this.items = Array.isArray(items) ? [...items] : [];
  }

  enqueue(orderId) {
    if (orderId && !this.items.includes(orderId)) {
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

  getAll() {
    return [...this.items];
  }
}

let orderQueue = new Queue();

/* =========================================================
   STORAGE MANAGEMENT
========================================================= */

function refreshData() {
  users = read(STORAGE.users, []);
  products = read(STORAGE.products, []);
  orders = read(STORAGE.orders, []);
  cart = read(STORAGE.cart, []);

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];
  if (!Array.isArray(cart)) cart = [];

  if (currentUser) {
    currentUser = users.find(user => user.id === currentUser.id) || null;
  }
}

function persistAll() {
  save(STORAGE.users, users);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);
  save(STORAGE.cart, cart);
  save(STORAGE.orderQueue, orderQueue.getAll());
}

function rebuildOrderQueue() {
  const saved = read(STORAGE.orderQueue, []);

  orderQueue = new Queue(
    Array.isArray(saved) ? saved : []
  );

  // Remove duplicate, invalid and already processed orders.
  orderQueue.items = orderQueue.items.filter((id, index, array) =>
    array.indexOf(id) === index &&
    orders.some(order =>
      order.id === id && order.status === "Pending"
    )
  );

  // Add any pending orders missing from the queue.
  [...orders]
    .filter(order =>
      order.status === "Pending" &&
      !orderQueue.items.includes(order.id)
    )
    .sort((a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt)
    )
    .forEach(order => orderQueue.enqueue(order.id));

  save(STORAGE.orderQueue, orderQueue.getAll());
}

function findProduct(id) {
  return products.find(product => product.id === id);
}

function findUser(id) {
  return users.find(user => user.id === id);
}

function isAdmin() {
  return Boolean(currentUser && currentUser.role === "admin");
}

function saveCart() {
  save(STORAGE.cart, cart);
  updateCartCount();
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function showToast(message, isError = false) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =========================================================
   INITIAL DATA
========================================================= */

function initializeData() {
  refreshData();

  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: makeId("admin"),
      name: "Administrator",
      username: "admin",
      password: "Admin123",
      role: "admin",
      phone: "",
      address: ""
    });
  }

  if (!products.length) {
    products = [
      {
        id: "p1",
        name: "Classic Red Roses",
        category: "Rose",
        description: "A timeless bouquet of beautiful red roses.",
        price: 850,
        stock: 20,
        image: "🌹"
      },
      {
        id: "p2",
        name: "Pink Tulip Bouquet",
        category: "Tulip",
        description: "Soft pink tulips for a sweet surprise.",
        price: 950,
        stock: 15,
        image: "🌷"
      },
      {
        id: "p3",
        name: "Sunny Sunflowers",
        category: "Sunflower",
        description: "Bright sunflowers to make someone smile.",
        price: 700,
        stock: 18,
        image: "🌻"
      },
      {
        id: "p4",
        name: "Pastel Garden Mix",
        category: "Mixed Bouquet",
        description: "A lovely mix of seasonal pastel flowers.",
        price: 1200,
        stock: 12,
        image: "💐"
      },
      {
        id: "p5",
        name: "White Rose Elegance",
        category: "Rose",
        description: "Elegant white roses for meaningful moments.",
        price: 1000,
        stock: 10,
        image: "🤍"
      },
      {
        id: "p6",
        name: "Sweet Daisy Bundle",
        category: "Other",
        description: "Fresh and cheerful daisies in a bundle.",
        price: 650,
        stock: 16,
        image: "🌼"
      }
    ];
  }

  persistAll();
  rebuildOrderQueue();
}

/* =========================================================
   AUTHENTICATION
========================================================= */

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
  if (!currentUser) return restoreSession();

  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent = currentUser.name;
  $("welcomeText").textContent = currentUser.name;

  $("roleLabel").textContent = isAdmin()
    ? "Administrator"
    : "Customer";

  $("customerNav").classList.toggle("hidden", isAdmin());
  $("adminNav").classList.toggle("hidden", !isAdmin());

  updateCartCount();

  if (isAdmin()) {
    adminPage(
      "dashboard",
      document.querySelector("#adminNav .nav-link")
    );
  } else {
    customerPage(
      "shop",
      document.querySelector("#customerNav .nav-link")
    );
  }
}

function restoreSession() {
  refreshData();

  const sessionId = read(STORAGE.session, null);

  currentUser = sessionId
    ? findUser(sessionId)
    : null;

  if (currentUser) {
    showApplication();
  } else {
    localStorage.removeItem(STORAGE.session);

    $("appScreen").classList.add("hidden");
    $("authScreen").classList.remove("hidden");

    showLogin();
  }
}

function registerUser(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  const message = $("registerMessage");

  if (
    !validText(name, 2, 80) ||
    !validText(username, 3, 24) ||
    !/^[a-zA-Z0-9_.-]+$/.test(username)
  ) {
    message.textContent =
      "Enter a valid name and username (3–24 letters, numbers, dots, _ or -).";
    return;
  }

  if (password.length < 6 || password.length > 72) {
    message.textContent = "Password must contain 6–72 characters.";
    return;
  }

  if (password !== confirm) {
    message.textContent = "Passwords do not match.";
    return;
  }

  refreshData();

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    message.textContent = "That username is already taken.";
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

  if (!save(STORAGE.users, users)) return;

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
    $("loginMessage").textContent =
      "Incorrect username or password.";
    return;
  }

  currentUser = user;

  save(STORAGE.session, user.id);

  $("loginForm").reset();
  $("loginMessage").textContent = "";

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

/* =========================================================
   NAVIGATION
   Repeating menu until the user logs out.
========================================================= */

function setPage(pageId, navButton, title) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = $(pageId);

  if (page) {
    page.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.remove("active");
  });

  if (navButton) {
    navButton.classList.add("active");
  }

  $("pageTitle").textContent = title;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
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

  const renderers = {
    shop: renderShop,
    cart: renderCart,
    orders: renderCustomerOrders,
    receipts: renderCustomerReceipts,
    transactions: renderCustomerTransactions,
    profile: loadProfile
  };

  if (renderers[page]) {
    renderers[page]();
  }
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

  const renderers = {
    dashboard: renderDashboard,
    products: renderAdminProducts,
    inventory: renderInventory,
    orders: renderAdminOrders,
    users: renderAdminUsers,
    settings: loadSettings
  };

  renderers[page]();
}

function goHome() {
  if (isAdmin()) {
    adminPage(
      "dashboard",
      document.querySelector("#adminNav .nav-link")
    );
  } else if (currentUser) {
    customerPage(
      "shop",
      document.querySelector("#customerNav .nav-link")
    );
  }
}
/* =========================================================
   PRODUCTS / SHOP
========================================================= */

function imageMarkup(image, className = "") {
  const value = String(image || "💐").trim();

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:image/")
  ) {
    return `
      <img
        class="${className}"
        src="${escapeHTML(value)}"
        alt="Flower product"
        onerror="this.style.display='none';this.parentElement.textContent='💐'"
      >
    `;
  }

  return `<span class="${className}">${escapeHTML(value)}</span>`;
}

function renderShop() {
  refreshData();

  const search = ($("productSearch").value || "")
    .trim()
    .toLowerCase();

  const list = products.filter(product =>
    [
      product.name,
      product.category,
      product.description
    ].some(value =>
      String(value || "").toLowerCase().includes(search)
    )
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(product => `
      <article class="product-card">
        <div class="product-image">
          ${imageMarkup(product.image)}
        </div>

        <div class="product-info">
          <span class="eyebrow">
            ${escapeHTML(product.category)}
          </span>

          <h3>${escapeHTML(product.name)}</h3>

          <p>
            ${escapeHTML(
              product.description ||
              "Beautiful flowers for every occasion."
            )}
          </p>

          <div class="product-meta">
            <span class="price">${money(product.price)}</span>
            <span class="stock">
              ${Number(product.stock)} available
            </span>
          </div>

          <div class="quantity-row">
            <input
              id="qty-${escapeHTML(product.id)}"
              type="number"
              min="1"
              max="${Number(product.stock)}"
              value="1"
              aria-label="Quantity"
            >

            <button
              class="btn btn-primary"
              ${product.stock <= 0 ? "disabled" : ""}
              onclick="addToCart('${escapeHTML(product.id)}')"
            >
              Add to Cart
            </button>
          </div>

          <button
            class="btn btn-outline full"
            ${product.stock <= 0 ? "disabled" : ""}
            onclick="buyNow('${escapeHTML(product.id)}')"
          >
            Buy Now
          </button>
        </div>
      </article>
    `).join("")
    : `
      <div class="empty-state">
        <strong>No flowers found</strong>
        Try another search.
      </div>
    `;
}

function getRequestedQuantity(id) {
  const field = $("qty-" + id);

  const quantity = Number(field?.value || 1);

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    showToast(
      "Please enter a valid whole-number quantity.",
      true
    );

    return 0;
  }

  return quantity;
}

function addToCart(id) {
  if (!currentUser || isAdmin()) return;

  refreshData();

  const product = findProduct(id);

  if (!product) {
    return showToast("Product not found.", true);
  }

  const quantity = getRequestedQuantity(id);

  if (!quantity) return;

  const existing = cart.find(item =>
    item.productId === id
  );

  if (
    quantity + (existing?.quantity || 0) >
    product.stock
  ) {
    return showToast(
      "Not enough stock available.",
      true
    );
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: id,
      quantity
    });
  }

  saveCart();

  showToast("Added to your cart.");
}

function buyNow(id) {
  if (!currentUser || isAdmin()) return;

  refreshData();

  const product = findProduct(id);

  if (!product) {
    return showToast("Product not found.", true);
  }

  const quantity = getRequestedQuantity(id);

  if (!quantity) return;

  if (quantity > product.stock) {
    return showToast(
      "Not enough stock available.",
      true
    );
  }

  cart = [{
    productId: id,
    quantity
  }];

  saveCart();

  openCheckout();
}

function updateCartCount() {
  const count = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }
}

/* =========================================================
   SHOPPING CART
========================================================= */

function cartDetails() {
  return cart.map(item => {
    const product = findProduct(item.productId);

    if (!product) return null;

    return {
      ...item,
      product,
      subtotal:
        Number(product.price) *
        Number(item.quantity)
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

        <br><br>

        <button
          class="btn btn-primary"
          onclick="customerPage(
            'shop',
            document.querySelector('#customerNav .nav-link')
          )"
        >
          Continue Shopping
        </button>
      </div>
    `;

    return;
  }

  const total = items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  $("cartContent").innerHTML = `
    <div class="cart-layout">

      <div>
        ${items.map(item => `
          <div class="cart-item">

            <div class="cart-thumb">
              ${imageMarkup(item.product.image)}
            </div>

            <div class="cart-detail">
              <strong>
                ${escapeHTML(item.product.name)}
              </strong>

              <small>
                ${money(item.product.price)} each
              </small>

              <div class="price">
                ${money(item.subtotal)}
              </div>
            </div>

            <input
              aria-label="Quantity"
              type="number"
              min="1"
              max="${Number(item.product.stock)}"
              value="${Number(item.quantity)}"
              onchange="changeCartQuantity(
                '${escapeHTML(item.productId)}',
                this.value
              )"
            >

            <button
              class="btn-danger"
              onclick="removeFromCart(
                '${escapeHTML(item.productId)}'
              )"
            >
              Remove
            </button>

          </div>
        `).join("")}

        <button
          class="btn-soft"
          onclick="clearCart()"
        >
          Clear Cart
        </button>
      </div>

      <aside class="cart-summary">
        <h3>Order Summary</h3>

        <div class="summary-line">
          <span>Items</span>
          <strong>
            ${items.reduce(
              (sum, item) => sum + item.quantity,
              0
            )}
          </strong>
        </div>

        <div class="summary-line summary-total">
          <span>Total</span>
          <strong>${money(total)}</strong>
        </div>

        <button
          class="btn btn-primary full"
          onclick="openCheckout()"
        >
          Proceed to Checkout
        </button>
      </aside>

    </div>
  `;
}

function changeCartQuantity(id, value) {
  refreshData();

  const quantity = Number(value);

  const item = cart.find(entry =>
    entry.productId === id
  );

  const product = findProduct(id);

  if (!item || !product) return;

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > product.stock
  ) {
    showToast(
      "Enter a valid quantity within available stock.",
      true
    );

    renderCart();

    return;
  }

  item.quantity = quantity;

  saveCart();

  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item =>
    item.productId !== id
  );

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

/* =========================================================
   CHECKOUT
========================================================= */

function openCheckout() {
  if (!currentUser || isAdmin()) return;

  refreshData();

  const items = cartDetails();

  if (!items.length) {
    return showToast("Your cart is empty.", true);
  }

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      return showToast(
        `Insufficient stock for ${item.product.name}.`,
        true
      );
    }
  }

  $("checkoutName").value = currentUser.name || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  const total = items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  $("checkoutSummary").innerHTML = `
    <div class="payment-note">

      ${items.map(item => `
        <div class="summary-line">
          <span>
            ${escapeHTML(item.product.name)}
            × ${item.quantity}
          </span>

          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="summary-line summary-total">
        <span>Total to pay</span>
        <strong>${money(total)}</strong>
      </div>

    </div>
  `;

  $("checkoutModal").classList.remove("hidden");
}

/* =========================================================
   PLACE ORDER
   ARRAY: Save the order.
   QUEUE: Enqueue the order using FIFO.
========================================================= */

function placeOrder(event) {
  event.preventDefault();

  refreshData();

  if (!currentUser || isAdmin()) {
    return showToast(
      "Customer login is required.",
      true
    );
  }

  const items = cartDetails();

  if (!items.length) {
    return showToast("Your cart is empty.", true);
  }

  // Validate all items before changing inventory.
  for (const item of items) {
    const product = findProduct(item.productId);

    if (
      !product ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > product.stock
    ) {
      return showToast(
        `Not enough stock for ${item.product.name}. Please update your cart.`,
        true
      );
    }
  }

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (
    !validText(name, 2, 80) ||
    !validPhone(phone) ||
    !validText(address, 8, 300)
  ) {
    return showToast(
      "Enter a valid name, phone number, and delivery address.",
      true
    );
  }

  const orderItems = items.map(item => ({
    productId: item.productId,
    name: item.product.name,
    price: Number(item.product.price),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
    image: item.product.image
  }));

  const total = orderItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

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

  // Deduct inventory after validation.
  orderItems.forEach(item => {
    findProduct(item.productId).stock -= item.quantity;
  });

  // ARRAY: Add order record.
  orders.push(order);

  // QUEUE: Add order to the rear.
  orderQueue.enqueue(order.id);

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.address = address;

  users = users.map(user =>
    user.id === currentUser.id
      ? currentUser
      : user
  );

  cart = [];

  persistAll();

  refreshData();

  currentUser = findUser(order.userId);

  $("checkoutForm").reset();

  closeModal("checkoutModal");

  updateCartCount();

  showReceipt(order);

  showToast(
    "Order placed and added to the FIFO queue!"
  );
}

/* =========================================================
   CUSTOMER ORDER VIEWS
========================================================= */

function customerOrders() {
  return orders
    .filter(order =>
      order.userId === currentUser?.id
    )
    .sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
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
    $("customerOrders").innerHTML = `
      <div class="empty-state">
        <strong>No orders yet.</strong>
        Your purchases will appear here.
      </div>
    `;

    return;
  }

  $("customerOrders").innerHTML = `
    <div class="table-wrap">
      <table>

        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${list.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${formatDate(order.createdAt)}</td>
              <td>${money(order.total)}</td>
              <td>${statusMarkup(order.status)}</td>
              <td>
                <button
                  class="btn-soft"
                  onclick="viewReceipt('${escapeHTML(order.id)}')"
                >
                  View Receipt
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>

      </table>
    </div>
  `;
}

function renderCustomerReceipts() {
  refreshData();

  const list = customerOrders();

  if (!list.length) {
    $("customerReceipts").innerHTML = `
      <div class="empty-state">
        <strong>No receipts available.</strong>
        Receipts appear after you place an order.
      </div>
    `;

    return;
  }

  $("customerReceipts").innerHTML = `
    <div class="table-wrap">
      <table>

        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Payment</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          ${list.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${formatDate(order.createdAt)}</td>
              <td>${money(order.total)}</td>
              <td>${escapeHTML(order.paymentMethod)}</td>
              <td>
                <button
                  class="btn-soft"
                  onclick="viewReceipt('${escapeHTML(order.id)}')"
                >
                  Open
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>

      </table>
    </div>
  `;
}

function renderCustomerTransactions() {
  refreshData();

  const list = customerOrders();

  const total = list.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  $("customerTransactions").innerHTML = `
    <div class="stats-grid">

      <div class="stat-card">
        <span>Total Orders</span>
        <strong>${list.length}</strong>
      </div>

      <div class="stat-card">
        <span>Total Purchase Value</span>
        <strong>${money(total)}</strong>
      </div>

    </div>

    ${
      list.length
        ? `
          <div class="table-wrap">
            <table>

              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                ${list.map(order => `
                  <tr>
                    <td>${escapeHTML(order.id)}</td>
                    <td>${formatDate(order.createdAt)}</td>
                    <td>${escapeHTML(order.paymentMethod)}</td>
                    <td>${escapeHTML(order.paymentStatus)}</td>
                    <td>${money(order.total)}</td>
                  </tr>
                `).join("")}
              </tbody>

            </table>
          </div>
        `
        : `<div class="empty-state">No transactions yet.</div>`
    }
  `;
}

/* =========================================================
   RECEIPTS
========================================================= */

function receiptHTML(order) {
  return `
    <div class="receipt">

      <div class="receipt-head">
        <div class="brand-mark">✿</div>
        <h2>Petal & Vine</h2>
        <p>Flower Boutique · Order Receipt</p>
      </div>

      <hr>

      <p>
        <strong>Order ID:</strong>
        ${escapeHTML(order.id)}
      </p>

      <p>
        <strong>Date:</strong>
        ${formatDate(order.createdAt)}
      </p>

      <p>
        <strong>Customer:</strong>
        ${escapeHTML(order.customerName)}
      </p>

      <p>
        <strong>Phone:</strong>
        ${escapeHTML(order.phone)}
      </p>

      <p>
        <strong>Address:</strong>
        ${escapeHTML(order.address)}
      </p>

      <hr>

      <h3>Order Items</h3>

      ${order.items.map(item => `
        <div class="summary-line">
          <span>
            ${escapeHTML(item.name)}
            × ${Number(item.quantity)}
          </span>

          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <hr>

      <div class="summary-line summary-total">
        <span>Total</span>
        <strong>${money(order.total)}</strong>
      </div>

      <p>
        <strong>Payment:</strong>
        ${escapeHTML(order.paymentMethod)}
      </p>

      <p>
        <strong>Payment status:</strong>
        ${escapeHTML(order.paymentStatus)}
      </p>

      <p>
        <strong>Order status:</strong>
        ${escapeHTML(order.status)}
      </p>

      <p class="receipt-head">
        Thank you for choosing Petal & Vine!
      </p>

    </div>
  `;
}

function showReceipt(order) {
  $("receiptContent").innerHTML = receiptHTML(order);
  $("receiptModal").classList.remove("hidden");
}

function viewReceipt(orderId) {
  refreshData();

  const order = orders.find(item =>
    item.id === orderId
  );

  if (!order) {
    return showToast("Order not found.", true);
  }

  if (
    !isAdmin() &&
    order.userId !== currentUser?.id
  ) {
    return showToast(
      "You cannot view this receipt.",
      true
    );
  }

  showReceipt(order);
       }
/* =========================================================
   CUSTOMER PROFILE
========================================================= */

function loadProfile() {
  refreshData();

  if (!currentUser) return;

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

  if (
    !validText(name, 2, 80) ||
    !validText(username, 3, 24) ||
    !/^[a-zA-Z0-9_.-]+$/.test(username)
  ) {
    $("profileMessage").textContent =
      "Enter a valid name and username.";
    return;
  }

  if (phone && !validPhone(phone)) {
    $("profileMessage").textContent =
      "Enter a valid phone number.";
    return;
  }

  if (address.length > 300) {
    $("profileMessage").textContent =
      "Address must be 300 characters or fewer.";
    return;
  }

  if (
    password &&
    (password.length < 6 || password.length > 72)
  ) {
    $("profileMessage").textContent =
      "Password must contain 6–72 characters.";
    return;
  }

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("profileMessage").textContent =
      "That username is already taken.";
    return;
  }

  currentUser.name = name;
  currentUser.username = username;
  currentUser.phone = phone;
  currentUser.address = address;

  if (password) {
    currentUser.password = password;
  }

  users = users.map(user =>
    user.id === currentUser.id
      ? currentUser
      : user
  );

  save(STORAGE.users, users);

  $("headerUser").textContent = name;
  $("welcomeText").textContent = name;

  $("profilePassword").value = "";

  $("profileMessage").textContent =
    "Profile updated successfully.";

  showToast("Your profile has been updated.");
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function renderDashboard() {
  if (!isAdmin()) return;

  refreshData();

  const customers = users.filter(
    user => user.role === "customer"
  );

  const pending = orders.filter(
    order => order.status === "Pending"
  ).length;

  const revenue = orders
    .filter(order => order.status !== "Cancelled")
    .reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

  const stockCount = products.reduce(
    (sum, product) => sum + Number(product.stock),
    0
  );

  $("dashboardStats").innerHTML = `
    <div class="stat-card">
      <span>Total Products</span>
      <strong>${products.length}</strong>
    </div>

    <div class="stat-card">
      <span>Customers</span>
      <strong>${customers.length}</strong>
    </div>

    <div class="stat-card">
      <span>Total Orders</span>
      <strong>${orders.length}</strong>
    </div>

    <div class="stat-card">
      <span>Pending Orders</span>
      <strong>${pending}</strong>
    </div>

    <div class="stat-card">
      <span>Items in Stock</span>
      <strong>${stockCount}</strong>
    </div>

    <div class="stat-card">
      <span>Order Value</span>
      <strong>${money(revenue)}</strong>
    </div>
  `;

  const recent = [...orders]
    .sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    .slice(0, 5);

  $("recentOrders").innerHTML = recent.length
    ? `
      <div class="table-wrap">
        <table>

          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${recent.map(order => `
              <tr>
                <td>${escapeHTML(order.id)}</td>
                <td>${escapeHTML(order.customerName)}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td>${money(order.total)}</td>
                <td>${statusMarkup(order.status)}</td>
              </tr>
            `).join("")}
          </tbody>

        </table>
      </div>
    `
    : `
      <div class="empty-state">
        No orders have been placed yet.
      </div>
    `;
}

/* =========================================================
   ADMIN PRODUCT MANAGEMENT
   ARRAY OPERATIONS:
   PUSH    = Add product
   FIND    = Search product
   MAP     = Update product
   FILTER  = Delete product
========================================================= */

function renderAdminProducts() {
  if (!isAdmin()) return;

  refreshData();

  const search = ($("adminProductSearch").value || "")
    .trim()
    .toLowerCase();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  $("adminProducts").innerHTML = list.length
    ? list.map(product => `
      <div class="admin-item">

        <div class="admin-item-main">

          <div class="cart-thumb">
            ${imageMarkup(product.image)}
          </div>

          <div class="cart-detail">
            <strong>${escapeHTML(product.name)}</strong>

            <small>
              ${escapeHTML(product.category)}
              · ${money(product.price)}
              · Stock: ${Number(product.stock)}
            </small>
          </div>

        </div>

        <div class="admin-actions">

          <button
            class="btn-soft"
            onclick="editProduct('${escapeHTML(product.id)}')"
          >
            Edit
          </button>

          <button
            class="btn-danger"
            onclick="deleteProduct('${escapeHTML(product.id)}')"
          >
            Delete
          </button>

        </div>

      </div>
    `).join("")
    : `
      <div class="empty-state">
        No products found.
      </div>
    `;
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
  if (!isAdmin()) return;

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

  if (
    /^https?:\/\//i.test(product.image || "") ||
    String(product.image || "").startsWith("data:image/")
  ) {
    preview.src = product.image;
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

  if (
    !validText(name, 2, 80) ||
    description.length > 300 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 10000000 ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    stock > 100000
  ) {
    return showToast(
      "Enter a valid product name, description, price, and whole-number stock.",
      true
    );
  }

  if (
    image.length > 2000000 ||
    (
      !/^https?:\/\//i.test(image) &&
      !image.startsWith("data:image/") &&
      image.length > 12
    )
  ) {
    return showToast(
      "Use a valid image URL or a short emoji.",
      true
    );
  }

  const product = {
    id: id || makeId("product"),
    name,
    category,
    description,
    price,
    stock,
    image
  };

  // UPDATE using Array.map().
  if (id) {
    products = products.map(item =>
      item.id === id ? product : item
    );
  } else {
    // ADD using Array.push().
    products.push(product);
  }

  if (!save(STORAGE.products, products)) return;

  closeModal("productModal");

  renderAdminProducts();

  showToast(
    id ? "Product updated." : "Product added."
  );
}

function deleteProduct(id) {
  if (!isAdmin()) return;

  refreshData();

  const product = findProduct(id);

  if (!product) return;

  if (
    orders.some(order =>
      order.status !== "Cancelled" &&
      order.items.some(item => item.productId === id)
    )
  ) {
    return showToast(
      "This product is linked to an active order and cannot be deleted.",
      true
    );
  }

  if (!confirm(`Delete "${product.name}"?`)) return;

  // DELETE using Array.filter().
  products = products.filter(item =>
    item.id !== id
  );

  cart = cart.filter(item =>
    item.productId !== id
  );

  persistAll();

  renderAdminProducts();

  showToast("Product deleted.");
}

/* =========================================================
   ADMIN INVENTORY MANAGEMENT
========================================================= */

function renderInventory() {
  if (!isAdmin()) return;

  refreshData();

  if (!products.length) {
    $("inventoryList").innerHTML = `
      <div class="empty-state">
        No products in inventory.
      </div>
    `;

    return;
  }

  $("inventoryList").innerHTML = `
    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Available Stock</th>
            <th>Stock Status</th>
          </tr>
        </thead>

        <tbody>
          ${products.map(product => {
            const low = Number(product.stock) <= 5;

            return `
              <tr>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>${money(product.price)}</td>
                <td>${Number(product.stock)}</td>
                <td>
                  ${
                    low
                      ? '<span class="status cancelled">Low stock</span>'
                      : '<span class="status delivered">In stock</span>'
                  }
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>

      </table>

    </div>
  `;
}

/* =========================================================
   ADMIN ORDER PROCESSING QUEUE
   FIFO = FIRST IN, FIRST OUT
========================================================= */

function getQueuedOrders() {
  return orderQueue.getAll()
    .map(id =>
      orders.find(order => order.id === id)
    )
    .filter(order =>
      order && order.status === "Pending"
    );
}

/* PROCESS NEXT ORDER */

function processNextOrder() {
  if (!isAdmin()) {
    return showToast(
      "Administrator access required.",
      true
    );
  }

  refreshData();

  rebuildOrderQueue();

  // PEEK: View the oldest order.
  const nextId = orderQueue.peek();

  if (!nextId) {
    renderAdminOrders();

    return showToast(
      "There are no pending orders.",
      true
    );
  }

  const order = orders.find(item =>
    item.id === nextId &&
    item.status === "Pending"
  );

  if (!order) {
    orderQueue.dequeue();

    persistAll();

    renderAdminOrders();

    return showToast(
      "Invalid queue entry removed.",
      true
    );
  }

  // DEQUEUE: Remove the oldest order.
  orderQueue.dequeue();

  order.status = "Processing";

  persistAll();

  renderAdminOrders();

  showToast(
    `Order ${order.id} is now processing.`
  );
}

/* =========================================================
   ADMIN ORDER DISPLAY
========================================================= */

function renderAdminOrders() {
  if (!isAdmin()) return;

  refreshData();

  rebuildOrderQueue();

  const list = [...orders].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const queued = getQueuedOrders();

  const queueHTML = `
    <div class="cart-summary" style="margin-bottom:20px">

      <h3>Order Processing Queue</h3>

      <p class="muted">
        First In, First Out (FIFO) —
        the oldest pending order is processed first.
      </p>

      <div class="summary-line">
        <span>Pending orders in queue</span>
        <strong>${queued.length}</strong>
      </div>

      <div class="summary-line">
        <span>Next order</span>

        <strong>
          ${
            queued.length
              ? escapeHTML(queued[0].customerName)
              : "None"
          }
        </strong>
      </div>

      <button
        class="btn btn-primary full"
        onclick="processNextOrder()"
        ${queued.length ? "" : "disabled"}
      >
        Process Next Order
      </button>

      <h3>Queue Sequence</h3>

      ${
        queued.length
          ? queued.map((order, index) => `
            <div class="summary-line">
              <span>
                ${index + 1}.
                ${escapeHTML(order.customerName)}
              </span>

              <small>
                ${escapeHTML(order.id)}
              </small>
            </div>
          `).join("")
          : `
            <div class="empty-state">
              No pending orders in the queue.
            </div>
          `
      }

    </div>
  `;

  if (!list.length) {
    $("adminOrders").innerHTML =
      queueHTML +
      `
        <div class="empty-state">
          No customer orders yet.
        </div>
      `;

    return;
  }

  $("adminOrders").innerHTML =
    queueHTML +
    list.map(order => `
      <div class="admin-item">

        <div class="admin-item-main">

          <div class="cart-thumb">
            🛍
          </div>

          <div class="cart-detail">

            <strong>
              ${escapeHTML(order.customerName)}
              · ${money(order.total)}
            </strong>

            <small>
              ${escapeHTML(order.id)}
              · ${formatDate(order.createdAt)}
            </small>

            <small>
              ${order.items.map(item =>
                `${escapeHTML(item.name)} × ${Number(item.quantity)}`
              ).join(", ")}
            </small>

            <small>
              Delivery:
              ${escapeHTML(order.address)}
              · ${escapeHTML(order.phone)}
            </small>

            <small>
              Status:
              ${statusMarkup(order.status)}
              · Payment:
              ${escapeHTML(order.paymentStatus)}
            </small>

          </div>

        </div>

        <div class="admin-actions">

          <select
            aria-label="Order status"
            onchange="updateOrderStatus(
              '${escapeHTML(order.id)}',
              this.value
            )"
          >

            ${
              ["Pending", "Processing", "Ready", "Delivered", "Cancelled"]
                .map(status => `
                  <option
                    value="${status}"
                    ${order.status === status ? "selected" : ""}
                  >
                    ${status}
                  </option>
                `).join("")
            }

          </select>

          <button
            class="btn-soft"
            onclick="viewReceipt('${escapeHTML(order.id)}')"
          >
            Receipt
          </button>

        </div>

      </div>
    `).join("");
}

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

function updateOrderStatus(id, status) {
  if (!isAdmin()) {
    return showToast(
      "Administrator access required.",
      true
    );
  }

  const allowed = [
    "Pending",
    "Processing",
    "Ready",
    "Delivered",
    "Cancelled"
  ];

  if (!allowed.includes(status)) {
    return showToast("Invalid order status.", true);
  }

  refreshData();

  const order = orders.find(item =>
    item.id === id
  );

  if (!order) return;

  const previous = order.status;

  // Restore inventory when cancelling.
  if (
    status === "Cancelled" &&
    previous !== "Cancelled"
  ) {
    order.items.forEach(item => {
      const product = findProduct(item.productId);

      if (product) {
        product.stock += Number(item.quantity);
      }
    });
  }

  // Re-deduct inventory when reactivating.
  if (
    previous === "Cancelled" &&
    status !== "Cancelled"
  ) {
    for (const item of order.items) {
      const product = findProduct(item.productId);

      if (
        !product ||
        product.stock < Number(item.quantity)
      ) {
        renderAdminOrders();

        return showToast(
          "Cannot reactivate: insufficient stock.",
          true
        );
      }
    }

    order.items.forEach(item => {
      findProduct(item.productId).stock -=
        Number(item.quantity);
    });
  }

  order.status = status;

  if (status === "Delivered") {
    order.paymentStatus = "Paid";
  } else if (status === "Cancelled") {
    order.paymentStatus = "Cancelled";
  } else if (
    previous === "Cancelled" &&
    status !== "Cancelled"
  ) {
    order.paymentStatus = "Pending";
  }

  // Synchronize order status with the FIFO queue.
  if (status === "Pending") {
    orderQueue.enqueue(order.id);
  } else {
    orderQueue.remove(order.id);
  }

  persistAll();

  renderAdminOrders();

  showToast("Order status updated.");
}

/* =========================================================
   ADMIN CUSTOMER MANAGEMENT
========================================================= */

function renderAdminUsers() {
  if (!isAdmin()) return;

  refreshData();

  const customers = users.filter(
    user => user.role === "customer"
  );

  if (!customers.length) {
    $("adminUsers").innerHTML = `
      <div class="empty-state">
        No registered customers yet.
      </div>
    `;

    return;
  }

  $("adminUsers").innerHTML = `
    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Phone</th>
            <th>Orders</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${customers.map(user => `
            <tr>

              <td>${escapeHTML(user.name)}</td>

              <td>${escapeHTML(user.username)}</td>

              <td>${escapeHTML(user.phone || "—")}</td>

              <td>
                ${orders.filter(order =>
                  order.userId === user.id
                ).length}
              </td>

              <td>
                <button
                  class="btn-danger"
                  onclick="deleteCustomer('${escapeHTML(user.id)}')"
                >
                  Delete
                </button>
              </td>

            </tr>
          `).join("")}
        </tbody>

      </table>

    </div>
  `;
}

function deleteCustomer(id) {
  if (!isAdmin()) return;

  refreshData();

  const customer = findUser(id);

  if (
    !customer ||
    customer.role !== "customer"
  ) {
    return;
  }

  if (!confirm(
    `Delete customer account "${customer.username}"? Existing order records will be retained.`
  )) {
    return;
  }

  users = users.filter(user =>
    user.id !== id
  );

  persistAll();

  renderAdminUsers();

  showToast("Customer account deleted.");
}

/* =========================================================
   ADMIN SETTINGS
========================================================= */

function loadSettings() {
  refreshData();

  if (!isAdmin()) return;

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

  if (
    !validText(username, 3, 24) ||
    !/^[a-zA-Z0-9_.-]+$/.test(username)
  ) {
    $("settingsMessage").textContent =
      "Enter a valid username.";

    return;
  }

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    $("settingsMessage").textContent =
      "That username is already in use.";

    return;
  }

  if (password || confirmPassword) {
    if (password.length < 6 || password.length > 72) {
      $("settingsMessage").textContent =
        "Password must contain 6–72 characters.";

      return;
    }

    if (password !== confirmPassword) {
      $("settingsMessage").textContent =
        "Passwords do not match.";

      return;
    }
  }

  currentUser.username = username;

  if (password) {
    currentUser.password = password;
  }

  users = users.map(user =>
    user.id === currentUser.id
      ? currentUser
      : user
  );

  save(STORAGE.users, users);

  $("headerUser").textContent = currentUser.name;

  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";

  $("settingsMessage").textContent =
    "Admin settings updated successfully.";

  showToast("Settings saved.");
}

/* =========================================================
   MODALS
========================================================= */

function closeModal(id) {
  const modal = $(id);

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* =========================================================
   PRODUCT IMAGE UPLOAD
========================================================= */

function previewProductImage(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  if (
    !file.type.startsWith("image/") ||
    file.size > 1200000
  ) {
    showToast(
      "Choose an image file smaller than 1.2 MB.",
      true
    );

    event.target.value = "";

    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    $("productImage").value = reader.result;

    $("productImagePreview").src = reader.result;

    $("productImagePreview").classList.remove("hidden");
  };

  reader.onerror = () => {
    showToast(
      "Unable to read the selected image.",
      true
    );
  };

  reader.readAsDataURL(file);
}

/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function togglePassword(button) {
  const input = $(button.dataset.target);

  if (!input) return;

  const showing = input.type === "text";

  input.type = showing ? "password" : "text";

  button.textContent = showing ? "Show" : "Hide";
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // Initialize the application.
  initializeData();

  // Authentication.
  $("loginForm").addEventListener(
    "submit",
    loginUser
  );

  $("registerForm").addEventListener(
    "submit",
    registerUser
  );

  // Customer forms.
  $("profileForm").addEventListener(
    "submit",
    updateProfile
  );

  $("checkoutForm").addEventListener(
    "submit",
    placeOrder
  );

  // Admin forms.
  $("productForm").addEventListener(
    "submit",
    saveProduct
  );

  $("settingsForm").addEventListener(
    "submit",
    updateSettings
  );

  // Logout.
  $("logoutButton").addEventListener(
    "click",
    logout
  );

  // Search.
  $("productSearch").addEventListener(
    "input",
    renderShop
  );

  $("adminProductSearch").addEventListener(
    "input",
    renderAdminProducts
  );

  // Image upload.
  $("productImageFile").addEventListener(
    "change",
    previewProductImage
  );

  // Password visibility.
  document.querySelectorAll(".toggle-password")
    .forEach(button => {
      button.addEventListener("click", () => {
        togglePassword(button);
      });
    });

  // Close modals when clicking outside.
  document.querySelectorAll(".modal")
    .forEach(modal => {
      modal.addEventListener("click", event => {
        if (event.target === modal) {
          modal.classList.add("hidden");
        }
      });
    });

  // Restore saved login session.
  restoreSession();

});

/* =========================================================
   EXPOSE HTML INLINE FUNCTIONS
========================================================= */

Object.assign(window, {
  showRegister,
  showLogin,
  customerPage,
  adminPage,
  goHome,

  addToCart,
  buyNow,

  changeCartQuantity,
  removeFromCart,
  clearCart,

  openCheckout,
  viewReceipt,

  openProductModal,
  closeModal,
  editProduct,
  deleteProduct,

  updateOrderStatus,
  deleteCustomer,

  processNextOrder
});
