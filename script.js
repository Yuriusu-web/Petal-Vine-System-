"use strict";

/* PETAL & VINE FLOWER BOUTIQUE
   Separate front-end files; data is stored in this browser only.
   Demo only: localStorage is not secure authentication or a shared database. */

const DB = {
  users: "pv_users", products: "pv_products", orders: "pv_orders",
  carts: "pv_carts", session: "pv_session", queue: "pv_order_queue",
  counters: "pv_counters"
};

const $ = id => document.getElementById(id);
const money = value => "₱" + Number(value || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[c]));
const dateText = value => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-PH");
};
const validPhone = value => /^[0-9+\-\s()]{7,20}$/.test(value.trim());

let users = [], products = [], orders = [], carts = {}, currentUser = null, currentRole = null;
let nextProductId = 1, nextOrderId = 1, selectedProduct = null, toastTimer = null;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error("Storage read error", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage save error", error);
    notify("Unable to save. Browser storage may be full.", "error");
    return false;
  }
}

function notify(message, type = "success") {
  const toast = $("toast");
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden", "show", "error");

  if (type === "error") toast.classList.add("error");

  requestAnimationFrame(() => toast.classList.add("show"));

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 250);
  }, 2600);
}

function saveAll() {
  try {
    localStorage.setItem(DB.users, JSON.stringify(users));
    localStorage.setItem(DB.products, JSON.stringify(products));
    localStorage.setItem(DB.orders, JSON.stringify(orders));
    localStorage.setItem(DB.carts, JSON.stringify(carts));
    localStorage.setItem(DB.queue, JSON.stringify(orderQueue.toArray()));
    localStorage.setItem(DB.counters, JSON.stringify({
      product: nextProductId,
      order: nextOrderId
    }));
    return true;
  } catch (error) {
    console.error(error);
    notify("Unable to save application data.", "error");
    return false;
  }
}

/* FIFO QUEUE */

class OrderQueue {
  constructor(items = []) {
    this.items = Array.isArray(items) ? [...items] : [];
  }

  enqueue(id) {
    if (!this.items.includes(id)) this.items.push(id);
  }

  dequeue() {
    return this.items.shift() ?? null;
  }

  peek() {
    return this.items[0] ?? null;
  }

  remove(id) {
    this.items = this.items.filter(value => value !== id);
  }

  toArray() {
    return [...this.items];
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

let orderQueue = new OrderQueue();

/* DEFAULT PRODUCTS */

const defaultProducts = [
  { name: "Classic Red Roses", category: "Rose", description: "A beautiful bouquet of romantic red roses.", price: 850, stock: 20, image: "🌹" },
  { name: "Pink Rose Bouquet", category: "Rose", description: "Soft pink roses for thoughtful occasions.", price: 950, stock: 15, image: "🌸" },
  { name: "Golden Sunflowers", category: "Sunflower", description: "Bright sunflowers to bring happiness.", price: 750, stock: 18, image: "🌻" },
  { name: "Purple Tulips", category: "Tulip", description: "Elegant purple tulips for special moments.", price: 1100, stock: 12, image: "🌷" },
  { name: "Mixed Flower Bouquet", category: "Mixed Bouquet", description: "A colorful arrangement of seasonal flowers.", price: 1250, stock: 10, image: "💐" },
  { name: "White Lily Arrangement", category: "Other", description: "Elegant white lilies with a graceful finish.", price: 980, stock: 14, image: "🪷" },
  { name: "Pastel Garden Bouquet", category: "Mixed Bouquet", description: "A soft blend of pastel blooms for thoughtful celebrations.", price: 1350, stock: 9, image: "💐" },
  { name: "White Rose Bouquet", category: "Rose", description: "Classic white roses for sincere and graceful gestures.", price: 1050, stock: 11, image: "🤍" },
  { name: "Peach Rose Bouquet", category: "Rose", description: "Warm peach roses for birthdays and heartfelt gifts.", price: 990, stock: 13, image: "🌹" },
  { name: "Yellow Tulip Bouquet", category: "Tulip", description: "Cheerful yellow tulips to brighten someone's day.", price: 1150, stock: 8, image: "🌷" },
  { name: "Pink Tulip Bouquet", category: "Tulip", description: "Fresh pink tulips arranged with a delicate finish.", price: 1180, stock: 10, image: "🌷" },
  { name: "Sunflower Delight", category: "Sunflower", description: "A radiant sunflower arrangement full of warmth.", price: 890, stock: 16, image: "🌻" },
  { name: "Blush Carnation Bouquet", category: "Other", description: "Soft carnations arranged for appreciation and care.", price: 780, stock: 17, image: "🌸" },
  { name: "Premium Mixed Roses", category: "Mixed Bouquet", description: "A premium mix of roses in complementary colors.", price: 1480, stock: 7, image: "💐" },
  { name: "Seasonal Floral Basket", category: "Mixed Bouquet", description: "A charming basket of seasonal flowers and greenery.", price: 1650, stock: 6, image: "🧺" }
];

/* INITIALIZATION AND STORAGE */

function initializeData() {
  users = read(DB.users, []);
  products = read(DB.products, []);
  orders = read(DB.orders, []);
  carts = read(DB.carts, {});
  orderQueue = new OrderQueue(read(DB.queue, []));

  const counters = read(DB.counters, {});

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];

  if (!carts || typeof carts !== "object" || Array.isArray(carts)) {
    carts = {};
  }

  if (!products.length) {
    products = defaultProducts.map((p, i) => ({ ...p, id: i + 1 }));
  }

  users = users.map(u => ({
    ...u,
    active: u.active !== false,
    role: u.role || "customer"
  }));

  products = products.map(p => ({
    ...p,
    id: Number(p.id),
    price: Number(p.price) || 0,
    stock: Math.max(0, Number(p.stock) || 0)
  }));

  orders = orders.map(o => ({
    ...o,
    id: Number(o.id),
    items: Array.isArray(o.items) ? o.items : [],
    status: o.status || "Pending"
  }));

  nextProductId = Math.max(
    Number(counters.product) || 1,
    ...products.map(p => Number(p.id) + 1),
    1
  );

  nextOrderId = Math.max(
    Number(counters.order) || 1,
    ...orders.map(o => Number(o.id) + 1),
    1
  );

  if (!users.some(u => u.role === "admin")) {
    const adminId = Math.max(0, ...users.map(u => Number(u.id) || 0)) + 1;

    users.push({
      id: adminId,
      fullName: "Petal & Vine Administrator",
      username: "admin",
      password: "Admin123",
      role: "admin",
      active: true,
      phone: "",
      address: "",
      createdAt: new Date().toISOString()
    });
  }

  const pending = orders
    .filter(o => o.status === "Pending")
    .map(o => o.id);

  const old = orderQueue.toArray();

  orderQueue = new OrderQueue([
    ...old.filter(id => pending.includes(id)),
    ...pending.filter(id => !old.includes(id))
  ]);

  saveAll();
}

/* CUSTOMER CART STORAGE */

function getCart() {
  if (!currentUser) return [];

  if (!Array.isArray(carts[currentUser.id])) {
    carts[currentUser.id] = [];
  }

  return carts[currentUser.id];
}

function setCart(value) {
  if (!currentUser) return false;

  const previous = JSON.stringify(carts[currentUser.id] || []);
  carts[currentUser.id] = value;

  if (!save(DB.carts, carts)) {
    carts[currentUser.id] = JSON.parse(previous);
    return false;
  }

  updateCartCount();
  return true;
}

function updateCartCount() {
  const count = getCart().reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  if ($("cartCount")) $("cartCount").textContent = count;
}

/* AUTHENTICATION */

function showLogin() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("loginMessage").textContent = "";
}

function showRegister() {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");
  $("registerMessage").textContent = "";
}

function showAuth() {
  $("authScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
  showLogin();
}

function login(username, password) {
  const user = users.find(u =>
    u.username.toLowerCase() === username.toLowerCase() &&
    u.password === password
  );

  if (!user) {
    $("loginMessage").textContent = "Incorrect username or password.";
    return;
  }

  if (user.active === false) {
    $("loginMessage").textContent = "Your account has been disabled.";
    return;
  }

  currentUser = user;
  currentRole = user.role;
  user.lastLogin = new Date().toISOString();

  if (!save(DB.users, users)) return;
  if (!save(DB.session, { userId: user.id })) return;

  openApplication();
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  login($("loginUsername").value.trim(), $("loginPassword").value);
});

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const fullName = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirmPassword = $("registerConfirm").value;

  if (fullName.length < 2 || fullName.length > 100) {
    return $("registerMessage").textContent = "Enter a valid full name.";
  }

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    return $("registerMessage").textContent =
      "Username must be 3–30 characters using letters, numbers, dots, underscores or hyphens.";
  }

  if (password.length < 6) {
    return $("registerMessage").textContent =
      "Password must contain at least 6 characters.";
  }

  if (password !== confirmPassword) {
    return $("registerMessage").textContent = "Passwords do not match.";
  }

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return $("registerMessage").textContent = "Username is already taken.";
  }

  const user = {
    id: Math.max(0, ...users.map(u => Number(u.id) || 0)) + 1,
    fullName,
    username,
    password,
    role: "customer",
    active: true,
    phone: "",
    address: "",
    createdAt: new Date().toISOString()
  };

  users.push(user);

  if (!save(DB.users, users)) {
    users.pop();
    return;
  }

  $("registerForm").reset();
  $("loginUsername").value = username;
  showLogin();
  $("loginMessage").textContent =
    "Account created successfully. Please log in.";
});

$("showRegister").addEventListener("click", showRegister);
$("showLogin").addEventListener("click", showLogin);

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "Show" : "Hide";
  });
});

function logout() {
  if (!confirm("Are you sure you want to log out?")) return;

  localStorage.removeItem(DB.session);
  currentUser = null;
  currentRole = null;
  showAuth();
  notify("You have logged out.");
}

$("logoutButton").addEventListener("click", logout);

function restoreSession() {
  const session = read(DB.session, null);
  const user = session && users.find(u =>
    u.id === session.userId && u.active !== false
  );

  if (!user) {
    localStorage.removeItem(DB.session);
    showAuth();
    return;
  }

  currentUser = user;
  currentRole = user.role;
  openApplication();
}

/* NAVIGATION */

function openApplication() {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent = currentUser.fullName;
  $("welcomeText").textContent = currentUser.fullName;
  $("roleLabel").textContent =
    currentRole === "admin" ? "Administrator" : "Customer";

  $("customerNav").classList.toggle("hidden", currentRole !== "customer");
  $("adminNav").classList.toggle("hidden", currentRole !== "admin");

  currentRole === "admin"
    ? adminPage("dashboard")
    : customerPage("shop");

  updateCartCount();
}

function goHome() {
  currentRole === "admin"
    ? adminPage("dashboard")
    : customerPage("shop");
}

function closeAllPages() {
  document.querySelectorAll(".main-content .page").forEach(page => {
    page.classList.add("hidden");
  });
}

function activateNav(nav, button) {
  nav.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (button) button.classList.add("active");
}

function setPage(id, title) {
  closeAllPages();

  const page = $(id);
  if (!page) return;

  page.classList.remove("hidden");
  $("pageTitle").textContent = title;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function customerPage(page, button) {
  if (currentRole !== "customer") return;

  activateNav($("customerNav"), button);

  const pages = {
    shop: ["customer-shop", "Shop Flowers"],
    cart: ["customer-cart", "My Cart"],
    orders: ["customer-orders", "My Orders"],
    receipts: ["customer-receipts", "Receipts"],
    transactions: ["customer-transactions", "Transactions"],
    profile: ["customer-profile", "My Profile"],
    about: ["customer-about", "About Us"]
  };

  if (!pages[page]) return;

  setPage(...pages[page]);

  ({
    shop: renderShop,
    cart: renderCart,
    orders: renderCustomerOrders,
    receipts: renderCustomerReceipts,
    transactions: renderTransactions,
    profile: loadProfile
  })[page]?.();
}

function adminPage(page, button) {
  if (currentRole !== "admin") return;

  activateNav($("adminNav"), button);

  const pages = {
    dashboard: ["admin-dashboard", "Dashboard"],
    products: ["admin-products", "Products"],
    inventory: ["admin-inventory", "Inventory"],
    orders: ["admin-orders", "Orders"],
    users: ["admin-users", "Customers"],
    settings: ["admin-settings", "Settings"]
  };

  if (!pages[page]) return;

  setPage(...pages[page]);

  ({
    dashboard: renderDashboard,
    products: renderAdminProducts,
    inventory: renderInventory,
    orders: renderAdminOrders,
    users: renderAdminUsers,
    settings: loadSettings
  })[page]?.();
}

function closeModal(id) {
  $(id)?.classList.add("hidden");
}

window.goHome = goHome;
window.customerPage = customerPage;
window.adminPage = adminPage;
window.logout = logout;
window.closeModal = closeModal;
/* PRODUCT DISPLAY AND SHOP */

function productVisual(product) {
  const image = String(product.image || "🌸").trim();

  return /^https?:\/\//i.test(image) || /^data:image\//i.test(image)
    ? `<div class="product-image"><img src="${esc(image)}" alt="${esc(product.name)}" onerror="this.parentElement.textContent='🌸'"></div>`
    : `<div class="product-image">${esc(image)}</div>`;
}

function productCard(p) {
  const unavailable = p.stock <= 0;

  return `
    <article class="product-card">
      ${productVisual(p)}
      <div class="product-info">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description || p.category)}</p>
        <div class="product-meta">
          <span class="price">${money(p.price)}</span>
          <span class="stock">${unavailable ? "Out of stock" : `${p.stock} available`}</span>
        </div>
        <div class="quantity-row">
          <input type="number" min="1" max="${p.stock}" value="1"
            data-quantity="${p.id}" aria-label="Quantity"
            ${unavailable ? "disabled" : ""}>
          <button class="btn btn-primary" data-add-cart="${p.id}"
            ${unavailable ? "disabled" : ""}>Add to Cart</button>
        </div>
        <button class="btn btn-outline full" data-buy-now="${p.id}"
          ${unavailable ? "disabled" : ""}>Buy Now</button>
      </div>
    </article>
  `;
}

function renderShop() {
  if (currentRole !== "customer") return;

  const query = $("productSearch").value.toLowerCase().trim();

  const list = products.filter(p =>
    [p.name, p.category, p.description].some(value =>
      String(value || "").toLowerCase().includes(query)
    )
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No flowers found.</div>';

  $("shopProducts").querySelectorAll("[data-add-cart],[data-buy-now]")
    .forEach(button => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.addCart || button.dataset.buyNow);
        const qty = Number(
          $("shopProducts").querySelector(`[data-quantity="${id}"]`)?.value || 1
        );

        const added = addToCart(id, qty);

        if (button.hasAttribute("data-buy-now") && added) {
          customerPage("cart");
        }
      });
    });
}

$("productSearch").addEventListener("input", renderShop);

function addToCart(id, quantity) {
  if (currentRole !== "customer") return false;

  const p = products.find(item => item.id === id);

  if (!p || !Number.isInteger(quantity) || quantity < 1) {
    notify("Please enter a valid quantity.", "error");
    return false;
  }

  const cart = getCart();
  const existing = cart.find(item => item.productId === id);
  const newQty = (existing?.quantity || 0) + quantity;

  if (newQty > p.stock) {
    notify("Cart quantity exceeds available stock.", "error");
    return false;
  }

  const updated = cart.map(item => ({ ...item }));
  const found = updated.find(item => item.productId === id);

  if (found) {
    found.quantity = newQty;
  } else {
    updated.push({ productId: id, quantity });
  }

  if (!setCart(updated)) return false;

  renderShop();
  notify("Flower added to your cart.");
  return true;
}

function removeFromCart(id) {
  if (setCart(getCart().filter(item => item.productId !== id))) {
    renderCart();
    notify("Product removed from cart.");
  }
}

function changeCartQuantity(id, qty) {
  const p = products.find(item => item.id === id);

  if (!p || !Number.isInteger(qty) || qty < 1 || qty > p.stock) {
    notify("Please enter a valid quantity within available stock.", "error");
    renderCart();
    return;
  }

  setCart(getCart().map(item =>
    item.productId === id ? { ...item, quantity: qty } : item
  ));

  renderCart();
}

function renderCart() {
  if (currentRole !== "customer") return;

  const items = getCart()
    .map(item => ({
      ...item,
      product: products.find(p => p.id === item.productId)
    }))
    .filter(item => item.product);

  if (!items.length) {
    $("cartContent").innerHTML = `
      <div class="empty-state">
        <strong>Your cart is empty.</strong>
        <span>Browse our flower collection and add your favorites.</span>
        <button class="btn btn-primary" onclick="customerPage('shop')">
          Continue Shopping
        </button>
      </div>
    `;
    return;
  }

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  $("cartContent").innerHTML = `
    <div class="cart-layout">
      <div>
        ${items.map(item => `
          <div class="cart-item">
            <div class="cart-thumb">
              ${
                /^https?:\/\//i.test(item.product.image || "") ||
                /^data:image\//i.test(item.product.image || "")
                  ? `<img src="${esc(item.product.image)}" alt="${esc(item.product.name)}">`
                  : esc(item.product.image || "🌸")
              }
            </div>
            <div class="cart-detail">
              <strong>${esc(item.product.name)}</strong>
              <small>${money(item.product.price)} each</small>
            </div>
            <input type="number" min="1" max="${item.product.stock}"
              value="${item.quantity}" data-cart-quantity="${item.productId}"
              aria-label="Cart quantity">
            <strong>${money(item.product.price * item.quantity)}</strong>
            <button class="btn-danger" data-remove-cart="${item.productId}">
              Remove
            </button>
          </div>
        `).join("")}
      </div>

      <aside class="cart-summary">
        <h2>Order Summary</h2>
        <div class="summary-line">
          <span>Items</span>
          <span>${items.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div class="summary-line summary-total">
          <span>Total</span>
          <span>${money(total)}</span>
        </div>
        <button class="btn btn-primary full" id="cartCheckout">
          Proceed to Checkout
        </button>
        <button class="btn btn-outline full" onclick="customerPage('shop')">
          Continue Shopping
        </button>
      </aside>
    </div>
  `;

  $("cartContent").querySelectorAll("[data-cart-quantity]")
    .forEach(input => {
      input.addEventListener("change", () =>
        changeCartQuantity(
          Number(input.dataset.cartQuantity),
          Number(input.value)
        )
      );
    });

  $("cartContent").querySelectorAll("[data-remove-cart]")
    .forEach(button => {
      button.addEventListener("click", () =>
        removeFromCart(Number(button.dataset.removeCart))
      );
    });

  $("cartCheckout").addEventListener("click", openCheckout);
}

/* CHECKOUT AND ORDER PLACEMENT */

function openCheckout() {
  const cart = getCart();

  const items = cart.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)
  }));

  if (!items.length) {
    return notify("Your cart is empty.", "error");
  }

  if (items.some(item =>
    !item.product || item.quantity > item.product.stock
  )) {
    return notify(
      "Some cart items are unavailable. Please update your cart.",
      "error"
    );
  }

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  $("checkoutSummary").innerHTML = `
    <div class="cart-summary">
      ${items.map(item => `
        <div class="summary-line">
          <span>${esc(item.product.name)} × ${item.quantity}</span>
          <strong>${money(item.product.price * item.quantity)}</strong>
        </div>
      `).join("")}
      <div class="summary-line summary-total">
        <span>Total</span>
        <strong>${money(total)}</strong>
      </div>
    </div>
  `;

  $("checkoutName").value = currentUser.fullName || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  $("checkoutModal").classList.remove("hidden");
}

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (name.length < 2 || name.length > 100) {
    return notify("Please enter a valid name.", "error");
  }

  if (!validPhone(phone)) {
    return notify("Please enter a valid phone number.", "error");
  }

  if (address.length < 8 || address.length > 300) {
    return notify("Please enter a complete delivery address.", "error");
  }

  const cart = getCart();

  if (!cart.length) {
    return notify("Your cart is empty.", "error");
  }

  const items = [];

  for (const ci of cart) {
    const p = products.find(x => x.id === ci.productId);

    if (
      !p ||
      !Number.isInteger(ci.quantity) ||
      ci.quantity < 1 ||
      ci.quantity > p.stock
    ) {
      return notify(
        "An item is unavailable or has insufficient stock.",
        "error"
      );
    }

    items.push({
      productId: p.id,
      name: p.name,
      image: p.image,
      price: p.price,
      quantity: ci.quantity,
      subtotal: p.price * ci.quantity
    });
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const snapshot = {
    products: products.map(p => ({ ...p })),
    orders: [...orders],
    queue: orderQueue.toArray(),
    nextOrderId,
    carts: JSON.parse(JSON.stringify(carts)),
    user: { ...currentUser }
  };

  items.forEach(item => {
    products.find(p => p.id === item.productId).stock -= item.quantity;
  });

  const order = {
    id: nextOrderId++,
    customerId: currentUser.id,
    customerName: name,
    phone,
    address,
    payment: "Cash on Delivery",
    items,
    total,
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.unshift(order);
  orderQueue.enqueue(order.id);

  currentUser.fullName = name;
  currentUser.phone = phone;
  currentUser.address = address;
  carts[currentUser.id] = [];

  if (!saveAll()) {
    products = snapshot.products;
    orders = snapshot.orders;
    orderQueue = new OrderQueue(snapshot.queue);
    nextOrderId = snapshot.nextOrderId;
    carts = snapshot.carts;
    Object.assign(currentUser, snapshot.user);
    return;
  }

  $("checkoutForm").reset();
  closeModal("checkoutModal");

  $("headerUser").textContent = name;
  $("welcomeText").textContent = name;

  updateCartCount();
  customerPage("orders");
  notify(`Order PV-${order.id} placed successfully!`);
});
/* ORDERS AND FIFO QUEUE */

function statusClass(status) {
  return status === "Completed" ? "delivered" :
    status === "Cancelled" ? "cancelled" : "";
}

function orderItemsText(order) {
  return order.items.map(i =>
    `${esc(i.name)} × ${Number(i.quantity) || 0}`
  ).join("<br>");
}

function receiptButton(id, label = "View") {
  return `<button class="btn-soft" data-view-receipt="${id}">${label}</button>`;
}

function bindReceiptButtons(container) {
  container.querySelectorAll("[data-view-receipt]").forEach(button => {
    button.addEventListener("click", () =>
      showReceipt(Number(button.dataset.viewReceipt))
    );
  });
}

function renderCustomerOrders() {
  const list = orders.filter(o => o.customerId === currentUser.id);

  if (!list.length) {
    $("customerOrders").innerHTML =
      '<div class="empty-state">You have no orders yet.</div>';
    return;
  }

  $("customerOrders").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(o => `
            <tr>
              <td>PV-${o.id}</td>
              <td>${esc(dateText(o.date))}</td>
              <td>${orderItemsText(o)}</td>
              <td>${money(o.total)}</td>
              <td>
                <span class="status ${statusClass(o.status)}">
                  ${esc(o.status)}
                </span>
              </td>
              <td>${receiptButton(o.id)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  bindReceiptButtons($("customerOrders"));
}

function renderAdminOrders() {
  if (!orders.length) {
    $("adminOrders").innerHTML =
      '<div class="empty-state">No orders have been placed.</div>';
    return;
  }

  $("adminOrders").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Update</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>
                <strong>PV-${o.id}</strong><br>
                <small>${esc(dateText(o.date))}</small>
              </td>
              <td>
                ${esc(o.customerName)}<br>
                <small>${esc(o.phone)}</small>
              </td>
              <td>${orderItemsText(o)}</td>
              <td>${money(o.total)}</td>
              <td>
                <span class="status ${statusClass(o.status)}">
                  ${esc(o.status)}
                </span>
              </td>
              <td>
                <select data-order-status="${o.id}" aria-label="Order status">
                  ${["Pending", "Processing", "Completed", "Cancelled"].map(s => `
                    <option value="${s}" ${o.status === s ? "selected" : ""}>
                      ${s}
                    </option>
                  `).join("")}
                </select>
              </td>
              <td>${receiptButton(o.id, "Receipt")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="cart-summary" style="margin-top:18px">
      <strong>FIFO Pending Order Queue</strong>
      <p class="muted">
        Next order:
        ${orderQueue.peek() === null ? "No pending orders" : "PV-" + orderQueue.peek()}
      </p>
      <p class="muted">
        Queue:
        ${orderQueue.toArray().map(id => "PV-" + id).join(" → ") || "Empty"}
      </p>
    </div>
  `;

  $("adminOrders").querySelectorAll("[data-order-status]").forEach(select => {
    select.addEventListener("change", () =>
      updateOrderStatus(Number(select.dataset.orderStatus), select.value)
    );
  });

  bindReceiptButtons($("adminOrders"));
}

function updateOrderStatus(id, newStatus) {
  if (currentRole !== "admin") return;

  const order = orders.find(o => o.id === id);
  if (!order) return;

  const allowed = ["Pending", "Processing", "Completed", "Cancelled"];

  if (!allowed.includes(newStatus)) return;

  const oldStatus = order.status;
  if (oldStatus === newStatus) return;

  // FIFO: only the first pending order can be processed or completed.
  if (
    ["Processing", "Completed"].includes(newStatus) &&
    oldStatus === "Pending" &&
    orderQueue.peek() !== id
  ) {
    notify(
      `FIFO rule: process PV-${orderQueue.peek()} first.`,
      "error"
    );
    renderAdminOrders();
    return;
  }

  const oldProducts = products.map(p => ({ ...p }));
  const oldQueue = orderQueue.toArray();

  // Return stock when an order is cancelled.
  if (newStatus === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(i => {
      const p = products.find(x => x.id === i.productId);
      if (p) p.stock += i.quantity;
    });
  }

  // Deduct stock again when a cancelled order is reactivated.
  if (oldStatus === "Cancelled" && newStatus !== "Cancelled") {
    const enough = order.items.every(i => {
      const p = products.find(x => x.id === i.productId);
      return p && p.stock >= i.quantity;
    });

    if (!enough) {
      notify("Not enough stock to reactivate this order.", "error");
      renderAdminOrders();
      return;
    }

    order.items.forEach(i => {
      products.find(x => x.id === i.productId).stock -= i.quantity;
    });
  }

  if (oldStatus === "Pending") orderQueue.remove(id);
  if (newStatus === "Pending") orderQueue.enqueue(id);

  order.status = newStatus;

  if (!saveAll()) {
    order.status = oldStatus;
    products = oldProducts;
    orderQueue = new OrderQueue(oldQueue);
    return;
  }

  renderAdminOrders();
  renderDashboard();
  renderInventory();
  notify("Order status updated.");
}

/* RECEIPTS AND TRANSACTIONS */

function showReceipt(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  if (
    currentRole !== "admin" &&
    order.customerId !== currentUser.id
  ) return;

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <div class="receipt-head">
        <h2>✿ Petal & Vine</h2>
        <p>FLOWER BOUTIQUE</p>
        <p>Thank you for choosing our flowers.</p>
      </div>

      <hr>

      <p><strong>Receipt No:</strong> PV-${order.id}</p>
      <p><strong>Date:</strong> ${esc(dateText(order.date))}</p>
      <p><strong>Customer:</strong> ${esc(order.customerName)}</p>
      <p><strong>Phone:</strong> ${esc(order.phone)}</p>
      <p><strong>Address:</strong> ${esc(order.address)}</p>
      <p><strong>Payment:</strong> ${esc(order.payment)}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(i => `
              <tr>
                <td>${esc(i.name)}</td>
                <td>${i.quantity}</td>
                <td>${money(i.price)}</td>
                <td>${money(i.subtotal)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="summary-line summary-total">
        <span>Total Amount</span>
        <strong>${money(order.total)}</strong>
      </div>

      <p><strong>Order Status:</strong> ${esc(order.status)}</p>

      <div class="receipt-head">
        <p>We appreciate your purchase! 🌷</p>
      </div>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function renderCustomerReceipts() {
  const list = orders.filter(o => o.customerId === currentUser.id);

  $("customerReceipts").innerHTML = list.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(o => `
              <tr>
                <td>PV-${o.id}</td>
                <td>${esc(dateText(o.date))}</td>
                <td>${money(o.total)}</td>
                <td>${esc(o.status)}</td>
                <td>${receiptButton(o.id, "View Receipt")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-state">No receipts available.</div>';

  bindReceiptButtons($("customerReceipts"));
}

function renderTransactions() {
  const list = orders.filter(o => o.customerId === currentUser.id);

  const spent = list
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  $("customerTransactions").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span>Total Orders</span>
        <strong>${list.length}</strong>
      </div>
      <div class="stat-card">
        <span>Total Purchases (excluding cancelled)</span>
        <strong>${money(spent)}</strong>
      </div>
    </div>

    ${list.length ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(o => `
              <tr>
                <td>PV-${o.id}</td>
                <td>${esc(dateText(o.date))}</td>
                <td>${esc(o.payment)}</td>
                <td>${money(o.total)}</td>
                <td>${esc(o.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : '<div class="empty-state">No transactions yet.</div>'}
  `;
}

/* CUSTOMER PROFILE */

function loadProfile() {
  $("profileName").value = currentUser.fullName || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";
  $("profilePassword").value = "";
}

$("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const name = $("profileName").value.trim();
  const username = $("profileUsername").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  const password = $("profilePassword").value;

  if (name.length < 2 || name.length > 100) {
    return notify("Enter a valid full name.", "error");
  }

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    return notify("Invalid username.", "error");
  }

  if (users.some(u =>
    u.id !== currentUser.id &&
    u.username.toLowerCase() === username.toLowerCase()
  )) {
    return notify("Username is already taken.", "error");
  }

  if (phone && !validPhone(phone)) {
    return notify("Enter a valid phone number.", "error");
  }

  if (password && password.length < 6) {
    return notify("Password must have at least 6 characters.", "error");
  }

  const old = { ...currentUser };

  Object.assign(currentUser, {
    fullName: name,
    username,
    phone,
    address
  });

  if (password) currentUser.password = password;

  if (!save(DB.users, users)) {
    Object.assign(currentUser, old);
    return;
  }

  $("headerUser").textContent = name;
  $("welcomeText").textContent = name;
  $("profilePassword").value = "";

  notify("Profile updated successfully.");
});

/* ADMIN PRODUCT MANAGEMENT */

function openProductModal(id = null) {
  if (currentRole !== "admin") return;

  $("productForm").reset();
  $("productId").value = "";
  $("productModalTitle").textContent = "Add Product";
  $("productImagePreview").classList.add("hidden");
  selectedProduct = null;

  if (id !== null) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    selectedProduct = { ...p };

    $("productId").value = p.id;
    $("productName").value = p.name;
    $("productCategory").value = p.category;
    $("productDescription").value = p.description || "";
    $("productPrice").value = p.price;
    $("productStock").value = p.stock;

    if (/^https?:\/\//i.test(p.image || "")) {
      $("productImage").value = p.image;
      $("productImagePreview").src = p.image;
      $("productImagePreview").classList.remove("hidden");
    } else if (/^data:image\//i.test(p.image || "")) {
      $("productImagePreview").src = p.image;
      $("productImagePreview").classList.remove("hidden");
    } else {
      $("productImage").value = p.image || "";
    }

    $("productModalTitle").textContent = "Edit Product";
  }

  $("productModal").classList.remove("hidden");
}

window.openProductModal = openProductModal;

$("productImage").addEventListener("input", () => {
  if (selectedProduct?.uploadedImage) {
    delete selectedProduct.uploadedImage;
  }
});

$("productImageFile").addEventListener("change", () => {
  const file = $("productImageFile").files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("Please select an image file.", "error");
    $("productImageFile").value = "";
    return;
  }

  if (file.size > 700000) {
    notify("Please select an image smaller than 700 KB.", "error");
    $("productImageFile").value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedProduct = {
      ...(selectedProduct || {}),
      uploadedImage: reader.result
    };

    $("productImagePreview").src = reader.result;
    $("productImagePreview").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
});

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const id = Number($("productId").value);
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  let image = $("productImage").value.trim();

  if (selectedProduct?.uploadedImage) {
    image = selectedProduct.uploadedImage;
  }

  if (!image) image = "🌸";

  if (name.length < 2 || name.length > 100) {
    return notify("Enter a valid product name.", "error");
  }

  if (!Number.isFinite(price) || price <= 0) {
    return notify("Enter a valid product price.", "error");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return notify("Enter a valid stock quantity.", "error");
  }

  if (products.some(p =>
    p.id !== id && p.name.toLowerCase() === name.toLowerCase()
  )) {
    return notify("Product name already exists.", "error");
  }

  if (
    /^https?:\/\//i.test(image) &&
    !/^https?:\/\/\S+$/i.test(image)
  ) {
    return notify("Invalid image URL.", "error");
  }

  const before = products.map(p => ({ ...p }));

  if (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    Object.assign(p, {
      name,
      category,
      description,
      price,
      stock,
      image
    });
  } else {
    products.push({
      id: nextProductId++,
      name,
      category,
      description,
      price,
      stock,
      image
    });
  }

  if (!saveAll()) {
    products = before;
    return;
  }

  selectedProduct = null;
  closeModal("productModal");
  $("productImageFile").value = "";

  renderAdminProducts();
  renderInventory();
  renderDashboard();

  notify(id
    ? "Product updated successfully."
    : "Product added successfully."
  );
});

function renderAdminProducts() {
  if (currentRole !== "admin") return;

  const query = $("adminProductSearch").value.toLowerCase().trim();

  const list = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );

  $("adminProducts").innerHTML = list.length
    ? list.map(p => `
      <div class="admin-item">
        <div class="admin-item-main">
          <div class="cart-thumb">
            ${
              /^https?:\/\//i.test(p.image || "") ||
              /^data:image\//i.test(p.image || "")
                ? `<img src="${esc(p.image)}" alt="">`
                : esc(p.image || "🌸")
            }
          </div>

          <div class="cart-detail">
            <strong>${esc(p.name)}</strong>
            <small>${esc(p.category)} · ${money(p.price)}</small>
            <small>Stock: ${p.stock}</small>
          </div>
        </div>

        <div class="admin-actions">
          <button class="btn-soft" data-edit-product="${p.id}">
            Edit
          </button>
          <button class="btn-danger" data-delete-product="${p.id}">
            Delete
          </button>
        </div>
      </div>
    `).join("")
    : '<div class="empty-state">No products found.</div>';

  $("adminProducts").querySelectorAll("[data-edit-product]")
    .forEach(button => {
      button.addEventListener("click", () =>
        openProductModal(Number(button.dataset.editProduct))
      );
    });

  $("adminProducts").querySelectorAll("[data-delete-product]")
    .forEach(button => {
      button.addEventListener("click", () =>
        deleteProduct(Number(button.dataset.deleteProduct))
      );
    });
}

$("adminProductSearch").addEventListener("input", renderAdminProducts);

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const p = products.find(x => x.id === id);

  if (!p || !confirm(`Delete ${p.name}?`)) return;

  if (orders.some(o =>
    o.status !== "Cancelled" &&
    o.items.some(i => i.productId === id)
  )) {
    return notify(
      "This product is part of an active or completed order and cannot be deleted.",
      "error"
    );
  }

  const oldProducts = products.map(x => ({ ...x }));
  const oldCarts = JSON.parse(JSON.stringify(carts));

  products = products.filter(x => x.id !== id);

  Object.keys(carts).forEach(uid => {
    carts[uid] = (carts[uid] || []).filter(i => i.productId !== id);
  });

  if (!saveAll()) {
    products = oldProducts;
    carts = oldCarts;
    return;
  }

  renderAdminProducts();
  renderInventory();
  renderDashboard();

  notify("Product deleted.");
}

/* INVENTORY */

function renderInventory() {
  if (currentRole !== "admin") return;

  $("inventoryList").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span>Total Products</span>
        <strong>${products.length}</strong>
      </div>

      <div class="stat-card">
        <span>Total Stock</span>
        <strong>${products.reduce((sum, p) => sum + p.stock, 0)}</strong>
      </div>

      <div class="stat-card">
        <span>Low Stock (5 or less)</span>
        <strong>${products.filter(p => p.stock <= 5).length}</strong>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Available Stock</th>
            <th>Inventory Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${products.map(p => `
            <tr>
              <td>${esc(p.name)}</td>
              <td>${esc(p.category)}</td>
              <td>${money(p.price)}</td>
              <td>${p.stock}</td>
              <td>
                <span class="status ${
                  p.stock === 0
                    ? "cancelled"
                    : p.stock <= 5
                      ? ""
                      : "delivered"
                }">
                  ${
                    p.stock === 0
                      ? "Out of Stock"
                      : p.stock <= 5
                        ? "Low Stock"
                        : "In Stock"
                  }
                </span>
              </td>
              <td>
                <button class="btn-soft" data-inventory-edit="${p.id}">
                  Update
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  $("inventoryList").querySelectorAll("[data-inventory-edit]")
    .forEach(button => {
      button.addEventListener("click", () =>
        openProductModal(Number(button.dataset.inventoryEdit))
      );
    });
}

/* CUSTOMER ACCOUNT MANAGEMENT */

function renderAdminUsers() {
  if (currentRole !== "admin") return;

  const customers = users.filter(u => u.role === "customer");
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);

  const isWithinLast30Days = value => {
    const time = Date.parse(value || "");
    return Number.isFinite(time) && time >= cutoff;
  };

  const newUsers = customers.filter(u =>
    isWithinLast30Days(u.createdAt)
  ).length;

  const activeUsers = customers.filter(u =>
    u.active !== false && isWithinLast30Days(u.lastLogin)
  ).length;

  $("adminUsers").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span>Total Users</span>
        <strong>${customers.length}</strong>
      </div>

      <div class="stat-card">
        <span>New Users (Last 30 Days)</span>
        <strong>${newUsers}</strong>
      </div>

      <div class="stat-card">
        <span>Active Users (Logged In, Last 30 Days)</span>
        <strong>${activeUsers}</strong>
      </div>
    </div>

    ${
      customers.length
        ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                ${customers.map(u => `
                  <tr>
                    <td>${esc(u.fullName)}</td>
                    <td>${esc(u.username)}</td>
                    <td>${esc(u.phone || "—")}</td>
                    <td>${esc(dateText(u.createdAt))}</td>
                    <td>${u.lastLogin ? esc(dateText(u.lastLogin)) : "Never"}</td>
                    <td>${u.active === false ? "Disabled" : "Active"}</td>
                    <td>
                      <button class="btn-soft" data-toggle-user="${u.id}">
                        ${u.active === false ? "Enable" : "Disable"}
                      </button>

                      <button class="btn-danger" data-delete-user="${u.id}">
                        Delete
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `
        : '<div class="empty-state">No customer accounts found.</div>'
    }
  `;

  $("adminUsers").querySelectorAll("[data-toggle-user]")
    .forEach(button => {
      button.addEventListener("click", () =>
        toggleUser(Number(button.dataset.toggleUser))
      );
    });

  $("adminUsers").querySelectorAll("[data-delete-user]")
    .forEach(button => {
      button.addEventListener("click", () =>
        deleteUser(Number(button.dataset.deleteUser))
      );
    });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const u = users.find(x => x.id === id && x.role === "customer");
  if (!u) return;

  const old = u.active;
  u.active = old === false;

  if (!save(DB.users, users)) {
    u.active = old;
    return;
  }

  renderAdminUsers();
  notify(u.active ? "Account enabled." : "Account disabled.");
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const u = users.find(x => x.id === id && x.role === "customer");
  if (!u) return;

  if (orders.some(o =>
    o.customerId === id && o.status !== "Cancelled"
  )) {
    return notify(
      "Cannot delete a customer with active or completed orders.",
      "error"
    );
  }

  if (!confirm(`Delete ${u.fullName}'s account?`)) return;

  const oldUsers = users;
  const oldCarts = JSON.parse(JSON.stringify(carts));

  users = users.filter(x => x.id !== id);
  delete carts[id];

  if (!saveAll()) {
    users = oldUsers;
    carts = oldCarts;
    return;
  }

  renderAdminUsers();
  renderDashboard();
  notify("Customer account deleted.");
}

/* DASHBOARD AND ADMIN SETTINGS */

function renderDashboard() {
  if (currentRole !== "admin") return;

  const revenue = orders
    .filter(o => o.status === "Completed")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const pending = orders.filter(o => o.status === "Pending").length;
  const completed = orders.filter(o => o.status === "Completed").length;
  const customers = users.filter(u => u.role === "customer").length;

  $("dashboardStats").innerHTML = `
    <div class="stat-card">
      <span>Total Products</span>
      <strong>${products.length}</strong>
    </div>

    <div class="stat-card">
      <span>Total Customers</span>
      <strong>${customers}</strong>
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
      <span>Completed Orders</span>
      <strong>${completed}</strong>
    </div>

    <div class="stat-card">
      <span>Completed Sales</span>
      <strong>${money(revenue)}</strong>
    </div>
  `;

  const recent = orders.slice(0, 5);

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
            ${recent.map(o => `
              <tr>
                <td>PV-${o.id}</td>
                <td>${esc(o.customerName)}</td>
                <td>${esc(dateText(o.date))}</td>
                <td>${money(o.total)}</td>
                <td>${esc(o.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-state">No recent orders.</div>';
}

function loadSettings() {
  $("settingsUsername").value = currentUser.username;
  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  $("settingsMessage").textContent = "";
}

$("settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const username = $("settingsUsername").value.trim();
  const password = $("settingsPassword").value;
  const confirmPassword = $("settingsConfirm").value;

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    return $("settingsMessage").textContent = "Invalid username.";
  }

  if (users.some(u =>
    u.id !== currentUser.id &&
    u.username.toLowerCase() === username.toLowerCase()
  )) {
    return $("settingsMessage").textContent = "Username is already in use.";
  }

  if (
    (password || confirmPassword) &&
    (password.length < 6 || password !== confirmPassword)
  ) {
    return $("settingsMessage").textContent =
      password.length < 6
        ? "Password must contain at least 6 characters."
        : "Passwords do not match.";
  }

  const old = {
    username: currentUser.username,
    password: currentUser.password
  };

  currentUser.username = username;

  if (password) currentUser.password = password;

  if (!save(DB.users, users)) {
    Object.assign(currentUser, old);
    return;
  }

  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  $("settingsMessage").textContent =
    "Administrator settings saved successfully.";

  notify("Admin settings updated.");
});

/* PRINT RECEIPT */

function printReceipt() {
  const content = $("receiptContent");

  if (!content.innerHTML.trim()) return;

  const win = window.open("", "_blank", "width=850,height=750");

  if (!win) {
    return notify("Allow pop-ups to print your receipt.", "error");
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Petal & Vine Receipt</title>

        <style>
          body {
            padding: 25px;
            color: #382b32;
            font-family: Arial, sans-serif;
          }

          h2 {
            color: #5d2c43;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            text-align: left;
          }

          .receipt-head {
            text-align: center;
          }

          .summary-line {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
          }

          .summary-total {
            font-size: 20px;
            font-weight: bold;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>

      <body>
        ${content.innerHTML}

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>
      </body>
    </html>
  `);

  win.document.close();
}

// The HTML button calls printReceipt() directly.
// Do not attach a second click handler.

/* MODAL CLOSE BEHAVIOR */

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal").forEach(modal => {
      modal.classList.add("hidden");
    });
  }
});

/* START APPLICATION */

function initializeApplication() {
  initializeData();
  restoreSession();
}

document.addEventListener("DOMContentLoaded", initializeApplication);
