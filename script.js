"use strict";

/* ==========================================
   PETAL & VINE FLOWER BOUTIQUE
   Front-end application using localStorage
========================================== */

const DB = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  carts: "pv_carts",
  session: "pv_session"
};

const $ = id => document.getElementById(id);

let users = [];
let products = [];
let orders = [];
let carts = {};
let currentUser = null;
let currentRole = null;
let selectedProduct = null;
let selectedReceipt = null;
let nextProductId = 1;
let nextOrderId = 1;

const money = value => "₱" + Number(value || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const dateText = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error("Storage read error:", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage save error:", error);
    notify("Unable to save data. Browser storage may be full.", "error");
    return false;
  }
}

function saveAll() {
  try {
    localStorage.setItem(DB.users, JSON.stringify(users));
    localStorage.setItem(DB.products, JSON.stringify(products));
    localStorage.setItem(DB.orders, JSON.stringify(orders));
    localStorage.setItem(DB.carts, JSON.stringify(carts));
    return true;
  } catch (error) {
    console.error("Storage save error:", error);
    notify("Unable to save data. Please check browser storage.", "error");
    return false;
  }
}

function notify(message, type = "success") {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast" + (type === "error" ? " error" : "");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

function initializeData() {
  users = read(DB.users, []);
  products = read(DB.products, []);
  orders = read(DB.orders, []);
  carts = read(DB.carts, {});

  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: 1,
      fullName: "Administrator",
      username: "admin",
      password: "Admin123",
      role: "admin",
      phone: "",
      address: "",
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  if (!products.length) {
    products = [
      {
        id: 1,
        name: "Classic Red Roses",
        category: "Rose",
        description: "A timeless bouquet of beautiful red roses.",
        price: 850,
        stock: 25,
        image: "🌹"
      },
      {
        id: 2,
        name: "Pink Tulip Bouquet",
        category: "Tulip",
        description: "Elegant pink tulips for a thoughtful surprise.",
        price: 950,
        stock: 18,
        image: "🌷"
      },
      {
        id: 3,
        name: "Sunny Sunflowers",
        category: "Sunflower",
        description: "Bright sunflowers to make someone's day.",
        price: 750,
        stock: 20,
        image: "🌻"
      },
      {
        id: 4,
        name: "Pastel Dream Bouquet",
        category: "Mixed Bouquet",
        description: "A soft mix of seasonal pastel blooms.",
        price: 1200,
        stock: 12,
        image: "💐"
      },
      {
        id: 5,
        name: "White Rose Elegance",
        category: "Rose",
        description: "Graceful white roses for meaningful occasions.",
        price: 900,
        stock: 15,
        image: "🤍"
      },
      {
        id: 6,
        name: "Garden Romance",
        category: "Mixed Bouquet",
        description: "A romantic arrangement of assorted flowers.",
        price: 1450,
        stock: 10,
        image: "💐"
      }
    ];
  }

  nextProductId = Math.max(0, ...products.map(product => Number(product.id) || 0)) + 1;
  nextOrderId = Math.max(0, ...orders.map(order => Number(order.id) || 0)) + 1;

  saveAll();
}

function restoreSession() {
  const session = read(DB.session, null);
  if (!session) return;

  const user = users.find(item => item.id === session.userId);
  if (user && user.active !== false) {
    currentUser = user;
    currentRole = user.role;
    showApplication();
  } else {
    localStorage.removeItem(DB.session);
  }
}

/* Authentication */

function showLoginForm() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");
  $("loginMessage").textContent = "";
}

function showRegisterForm() {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");
  $("registerMessage").textContent = "";
}

$("showRegister").addEventListener("click", showRegisterForm);
$("showLogin").addEventListener("click", showLoginForm);

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password" ? "Show" : "Hide";
  });
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(item =>
    item.username.toLowerCase() === username &&
    item.password === password
  );

  if (!user || user.active === false) {
    $("loginMessage").textContent = "Invalid login details or account disabled.";
    return;
  }

  currentUser = user;
  currentRole = user.role;
  save(DB.session, { userId: user.id });

  $("loginForm").reset();
  $("loginMessage").textContent = "";
  showApplication();
  notify("Welcome to Petal & Vine!");
});

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const fullName = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirmPassword = $("registerConfirm").value;

  if (!fullName || !username) {
    $("registerMessage").textContent = "Please complete all required fields.";
    return;
  }

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    $("registerMessage").textContent = "Username must be 3–30 characters and use letters, numbers, dots, underscores, or hyphens.";
    return;
  }

  if (password.length < 6) {
    $("registerMessage").textContent = "Password must contain at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    $("registerMessage").textContent = "Passwords do not match.";
    return;
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    $("registerMessage").textContent = "Username is already taken.";
    return;
  }

  const newUser = {
    id: Math.max(0, ...users.map(user => Number(user.id) || 0)) + 1,
    fullName,
    username,
    password,
    role: "customer",
    phone: "",
    address: "",
    active: true,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  if (!save(DB.users, users)) {
    users = users.filter(user => user.id !== newUser.id);
    return;
  }

  $("registerForm").reset();
  $("registerMessage").textContent = "";
  showLoginForm();
  $("loginUsername").value = username;
  notify("Account created. You can now log in.");
});

/* Application navigation */

function showApplication() {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent = currentUser.fullName;
  $("welcomeText").textContent = currentUser.fullName;
  $("roleLabel").textContent = currentRole === "admin" ? "ADMINISTRATOR" : "CUSTOMER";

  $("customerNav").classList.toggle("hidden", currentRole === "admin");
  $("adminNav").classList.toggle("hidden", currentRole !== "admin");

  if (currentRole === "admin") {
    adminPage("dashboard", $("adminNav").querySelector(".nav-link"));
  } else {
    customerPage("shop", $("customerNav").querySelector(".nav-link"));
  }

  updateCartCount();
}

function logout() {
  localStorage.removeItem(DB.session);
  currentUser = null;
  currentRole = null;
  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  showLoginForm();
  notify("You have logged out.");
}

$("logoutButton").addEventListener("click", logout);

function goHome() {
  if (currentRole === "admin") {
    adminPage("dashboard", $("adminNav").querySelector(".nav-link"));
  } else {
    customerPage("shop", $("customerNav").querySelector(".nav-link"));
  }
}

function hideAllPages() {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
}

function setActiveNav(nav, button) {
  nav.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  if (button) button.classList.add("active");
}

function customerPage(page, button) {
  if (currentRole !== "customer") return;

  hideAllPages();
  setActiveNav($("customerNav"), button);

  const target = $("customer-" + page);
  if (target) target.classList.remove("hidden");

  const titles = {
    shop: "Shop Flowers",
    cart: "My Cart",
    orders: "My Orders",
    receipts: "Receipts",
    transactions: "Transactions",
    profile: "My Profile",
    about: "About Us"
  };

  $("pageTitle").textContent = titles[page] || "Petal & Vine";

  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "orders") renderCustomerOrders();
  if (page === "receipts") renderCustomerReceipts();
  if (page === "transactions") renderTransactions();
  if (page === "profile") loadProfile();
}

function adminPage(page, button) {
  if (currentRole !== "admin") return;

  hideAllPages();
  setActiveNav($("adminNav"), button);

  const target = $("admin-" + page);
  if (target) target.classList.remove("hidden");

  const titles = {
    dashboard: "Admin Dashboard",
    products: "Product Management",
    inventory: "Inventory",
    orders: "Manage Orders",
    users: "Customer Accounts",
    settings: "Admin Settings"
  };

  $("pageTitle").textContent = titles[page] || "Administration";

  if (page === "dashboard") renderDashboard();
  if (page === "products") renderAdminProducts();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderAdminOrders();
  if (page === "users") renderAdminUsers();
  if (page === "settings") loadSettings();
}

/* Customer shopping */

function imageMarkup(image, className = "") {
  const value = String(image || "🌸");
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) {
    return `<img class="${className}" src="${esc(value)}" alt="Flower product">`;
  }
  return esc(value);
}

function renderShop() {
  if (currentRole !== "customer") return;

  const query = $("productSearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.description.toLowerCase().includes(query)
  );

  $("shopProducts").innerHTML = list.length ? list.map(product => `
    <article class="product-card">
      <div class="product-image">${imageMarkup(product.image)}</div>
      <div class="product-info">
        <h3>${esc(product.name)}</h3>
        <p>${esc(product.description)}</p>
        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="stock">${product.stock > 0 ? product.stock + " available" : "Out of stock"}</span>
        </div>
        <div class="quantity-row">
          <input type="number" min="1" max="${product.stock}" value="1" id="qty-${product.id}" aria-label="Quantity">
          <button class="btn btn-primary" data-add-cart="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("") : '<div class="empty-state">No flowers match your search.</div>';

  $("shopProducts").querySelectorAll("[data-add-cart]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.addCart);
      const quantity = Number($("qty-" + id).value);
      addToCart(id, quantity);
    });
  });
}

$("productSearch").addEventListener("input", renderShop);

function userCart() {
  if (!currentUser) return [];
  if (!Array.isArray(carts[currentUser.id])) carts[currentUser.id] = [];
  return carts[currentUser.id];
}

function addToCart(productId, quantity) {
  if (currentRole !== "customer") return;

  const product = products.find(item => item.id === productId);
  if (!product) return;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return notify("Enter a valid quantity.", "error");
  }

  const cart = userCart();
  const existing = cart.find(item => item.productId === productId);
  const newQuantity = (existing ? existing.quantity : 0) + quantity;

  if (newQuantity > product.stock) {
    return notify("Requested quantity exceeds available stock.", "error");
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.push({ productId, quantity });
  }

  if (!save(DB.carts, carts)) return;

  updateCartCount();
  notify("Flower added to your cart.");
}

function updateCartCount() {
  if (!currentUser) return;
  const count = userCart().reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;
}

function cartTotal() {
  return userCart().reduce((sum, item) => {
    const product = products.find(product => product.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCart() {
  if (currentRole !== "customer") return;

  const cart = userCart().filter(item =>
    products.some(product => product.id === item.productId)
  );

  if (!cart.length) {
    $("cartContent").innerHTML = `
      <div class="empty-state">
        <strong>Your cart is empty.</strong>
        <p>Browse our flower collection and add something beautiful.</p>
        <button class="btn btn-primary" onclick="customerPage('shop',document.querySelector('[data-page=shop]'))">Browse Flowers</button>
      </div>`;
    return;
  }

  const total = cartTotal();

  $("cartContent").innerHTML = `
    <div class="cart-layout">
      <div>
        ${cart.map(item => {
          const product = products.find(p => p.id === item.productId);
          return `
            <div class="cart-item">
              <div class="cart-thumb">${imageMarkup(product.image)}</div>
              <div class="cart-detail">
                <strong>${esc(product.name)}</strong>
                <small>${money(product.price)} each</small>
              </div>
              <input type="number" min="1" max="${product.stock}" value="${item.quantity}" data-cart-quantity="${product.id}" aria-label="Quantity">
              <strong class="item-total">${money(product.price * item.quantity)}</strong>
              <button class="btn-danger" data-remove-cart="${product.id}">Remove</button>
            </div>`;
        }).join("")}
      </div>
      <aside class="cart-summary">
        <h2>Order Summary</h2>
        <div class="summary-line"><span>Items</span><strong>${cart.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
        <div class="summary-line summary-total"><span>Total</span><strong>${money(total)}</strong></div>
        <p class="muted">Payment: Cash on Delivery</p>
        <button class="btn btn-primary full" id="cartCheckout">Proceed to Checkout</button>
      </aside>
    </div>`;

  $("cartContent").querySelectorAll("[data-cart-quantity]").forEach(input => {
    input.addEventListener("change", () => {
      updateCartQuantity(Number(input.dataset.cartQuantity), Number(input.value));
    });
  });

  $("cartContent").querySelectorAll("[data-remove-cart]").forEach(button => {
    button.addEventListener("click", () => removeFromCart(Number(button.dataset.removeCart)));
  });

  $("cartCheckout").addEventListener("click", openCheckout);
}

function updateCartQuantity(productId, quantity) {
  const product = products.find(item => item.id === productId);
  const item = userCart().find(entry => entry.productId === productId);
  if (!product || !item) return;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    notify("Please enter a quantity within available stock.", "error");
    renderCart();
    return;
  }

  const oldQuantity = item.quantity;
  item.quantity = quantity;

  if (!save(DB.carts, carts)) {
    item.quantity = oldQuantity;
    return;
  }

  updateCartCount();
  renderCart();
}

function removeFromCart(productId) {
  const cart = userCart();
  carts[currentUser.id] = cart.filter(item => item.productId !== productId);

  if (!save(DB.carts, carts)) return;

  updateCartCount();
  renderCart();
  notify("Item removed from cart.");
}

/* Checkout and order placement */

function openCheckout() {
  const cart = userCart();
  if (!cart.length) return notify("Your cart is empty.", "error");

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity > product.stock) {
      return notify("One or more items are no longer available in the requested quantity.", "error");
    }
  }

  $("checkoutSummary").innerHTML = `
    <div class="summary-line">
      <span>Order total</span>
      <strong>${money(cartTotal())}</strong>
    </div>`;

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

  const cart = userCart();

  if (!cart.length) return notify("Your cart is empty.", "error");

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity > product.stock) {
      return notify("Stock changed. Please review your cart.", "error");
    }
  }

  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const oldProducts = products.map(p => ({ ...p }));
  const oldOrders = [...orders];
  const oldCarts = JSON.parse(JSON.stringify(carts));
  const oldUser = { ...currentUser };

  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  const order = {
    id: nextOrderId++,
    customerId: currentUser.id,
    customerName: name,
    username: currentUser.username,
    phone,
    address,
    items,
    total,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.unshift(order);
  carts[currentUser.id] = [];

  currentUser.fullName = name;
  currentUser.phone = phone;
  currentUser.address = address;

  if (!saveAll()) {
    products = oldProducts;
    orders = oldOrders;
    carts = oldCarts;
    Object.assign(currentUser, oldUser);
    nextOrderId--;
    return;
  }

  closeModal("checkoutModal");
  $("checkoutForm").reset();
  updateCartCount();
  renderCart();
  showReceipt(order.id);
  notify("Your order has been placed successfully.");
});

/* Customer orders */

function renderCustomerOrders() {
  const list = orders.filter(order => order.customerId === currentUser.id);

  $("customerOrders").innerHTML = list.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>PV-${order.id}</td>
              <td>${esc(dateText(order.date))}</td>
              <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td>${money(order.total)}</td>
              <td>${esc(order.paymentMethod)}</td>
              <td><span class="status ${order.status === "Completed" ? "delivered" : order.status === "Cancelled" ? "cancelled" : ""}">${esc(order.status)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : '<div class="empty-state">You have not placed any orders yet.</div>';
}

function renderCustomerReceipts() {
  const list = orders.filter(order => order.customerId === currentUser.id);

  $("customerReceipts").innerHTML = list.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Receipt</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>PV-${order.id}</td>
              <td>${esc(dateText(order.date))}</td>
              <td>${money(order.total)}</td>
              <td>${esc(order.status)}</td>
              <td><button class="btn-soft" data-view-receipt="${order.id}">View Receipt</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : '<div class="empty-state">No receipts available.</div>';

  $("customerReceipts").querySelectorAll("[data-view-receipt]").forEach(button => {
    button.addEventListener("click", () => showReceipt(Number(button.dataset.viewReceipt)));
  });
}

function renderTransactions() {
  const list = orders.filter(order => order.customerId === currentUser.id);

  $("customerTransactions").innerHTML = list.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Transaction ID</th><th>Date</th><th>Payment Method</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>TXN-PV-${order.id}</td>
              <td>${esc(dateText(order.date))}</td>
              <td>${esc(order.paymentMethod)}</td>
              <td>${money(order.total)}</td>
              <td>${esc(order.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : '<div class="empty-state">No transactions to display.</div>';
}

/* Receipt display */

function showReceipt(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  if (currentRole !== "admin" && order.customerId !== currentUser.id) return;

  selectedReceipt = order.id;

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <div class="receipt-head">
        <p class="eyebrow">FLOWER BOUTIQUE</p>
        <h2>Petal & Vine</h2>
        <p>Order Receipt</p>
        <p><strong>Receipt No:</strong> PV-${order.id}</p>
        <p><strong>Date:</strong> ${esc(dateText(order.date))}</p>
      </div>
      <p><strong>Customer:</strong> ${esc(order.customerName)}</p>
      <p><strong>Phone:</strong> ${esc(order.phone)}</p>
      <p><strong>Delivery Address:</strong> ${esc(order.address)}</p>
      <table class="receipt-items">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${esc(item.name)}</td>
              <td>${item.quantity}</td>
              <td>${money(item.price)}</td>
              <td>${money(item.subtotal)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p><strong>Payment Method:</strong> ${esc(order.paymentMethod)}</p>
      <p><strong>Order Status:</strong> ${esc(order.status)}</p>
      <p class="receipt-total">Total: ${money(order.total)}</p>
      <p class="muted" style="text-align:center">Thank you for choosing Petal & Vine!</p>
    </div>`;

  $("receiptModal").classList.remove("hidden");
}

function closeModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add("hidden");
}

/* Customer profile */

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

  const fullName = $("profileName").value.trim();
  const username = $("profileUsername").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  const password = $("profilePassword").value;

  if (!fullName || !username) return notify("Name and username are required.", "error");

  if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
    return notify("Please enter a valid username.", "error");
  }

  if (users.some(user => user.id !== currentUser.id && user.username.toLowerCase() === username.toLowerCase())) {
    return notify("Username is already in use.", "error");
  }

  if (password && password.length < 6) {
    return notify("Password must contain at least 6 characters.", "error");
  }

  const oldUser = { ...currentUser };

  currentUser.fullName = fullName;
  currentUser.username = username;
  currentUser.phone = phone;
  currentUser.address = address;
  if (password) currentUser.password = password;

  if (!save(DB.users, users)) {
    Object.assign(currentUser, oldUser);
    return;
  }

  $("headerUser").textContent = currentUser.fullName;
  $("welcomeText").textContent = currentUser.fullName;
  $("profilePassword").value = "";
  notify("Profile updated successfully.");
});

/* Product management */

function openProductModal(productId = null) {
  if (currentRole !== "admin") return;

  selectedProduct = productId ? products.find(p => p.id === productId) : null;

  $("productForm").reset();
  $("productId").value = selectedProduct ? selectedProduct.id : "";
  $("productModalTitle").textContent = selectedProduct ? "Edit Product" : "Add Product";
  $("productName").value = selectedProduct?.name || "";
  $("productCategory").value = selectedProduct?.category || "Rose";
  $("productDescription").value = selectedProduct?.description || "";
  $("productPrice").value = selectedProduct?.price ?? "";
  $("productStock").value = selectedProduct?.stock ?? "";
  $("productImage").value = selectedProduct?.image || "";

  const preview = $("productImagePreview");
  if (selectedProduct && /^https?:\/\//i.test(selectedProduct.image || "")) {
    preview.src = selectedProduct.image;
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
    preview.removeAttribute("src");
  }

  $("productModal").classList.remove("hidden");
}

$("productImageFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    return notify("Please select a valid image file.", "error");
  }

  if (file.size > 700 * 1024) {
    event.target.value = "";
    return notify("Image must be 700 KB or smaller.", "error");
  }

  const reader = new FileReader();
  reader.onload = () => {
    $("productImage").value = reader.result;
    $("productImagePreview").src = reader.result;
    $("productImagePreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const id = $("productId").value ? Number($("productId").value) : null;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const image = $("productImage").value.trim() || "🌸";

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
    return notify("Please enter valid product details.", "error");
  }

  if (products.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) {
    return notify("A product with this name already exists.", "error");
  }

  if (/^https?:\/\//i.test(image) && !/^https?:\/\/\S+$/i.test(image)) {
    return notify("Invalid image URL.", "error");
  }

  const before = products.map(p => ({ ...p }));

  if (id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    Object.assign(product, { name, category, description, price, stock, image });
  } else {
    products.push({ id: nextProductId++, name, category, description, price, stock, image });
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
  notify(id ? "Product updated successfully." : "Product added successfully.");
});

function renderAdminProducts() {
  if (currentRole !== "admin") return;

  const query = $("adminProductSearch").value.toLowerCase().trim();
  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("adminProducts").innerHTML = list.length ? list.map(product => `
    <div class="admin-item">
      <div class="admin-item-main">
        <div class="cart-thumb">${imageMarkup(product.image)}</div>
        <div class="cart-detail">
          <strong>${esc(product.name)}</strong>
          <small>${esc(product.category)} · ${money(product.price)}</small>
          <small>Stock: ${product.stock}</small>
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn-soft" data-edit-product="${product.id}">Edit</button>
        <button class="btn-danger" data-delete-product="${product.id}">Delete</button>
      </div>
    </div>
  `).join("") : '<div class="empty-state">No products found.</div>';

  $("adminProducts").querySelectorAll("[data-edit-product]").forEach(button => {
    button.addEventListener("click", () => openProductModal(Number(button.dataset.editProduct)));
  });

  $("adminProducts").querySelectorAll("[data-delete-product]").forEach(button => {
    button.addEventListener("click", () => deleteProduct(Number(button.dataset.deleteProduct)));
  });
}

$("adminProductSearch").addEventListener("input", renderAdminProducts);

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);
  if (!product || !confirm(`Delete ${product.name}?`)) return;

  if (orders.some(order =>
    order.status !== "Cancelled" &&
    order.items.some(item => item.productId === id)
  )) {
    return notify("This product is part of an active or completed order and cannot be deleted.", "error");
  }

  const oldProducts = products.map(item => ({ ...item }));
  const oldCarts = JSON.parse(JSON.stringify(carts));

  products = products.filter(item => item.id !== id);

  Object.keys(carts).forEach(userId => {
    carts[userId] = (carts[userId] || []).filter(item => item.productId !== id);
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

/* Inventory */

function renderInventory() {
  if (currentRole !== "admin") return;

  $("inventoryList").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><span>Total Products</span><strong>${products.length}</strong></div>
      <div class="stat-card"><span>Total Stock</span><strong>${products.reduce((sum, product) => sum + product.stock, 0)}</strong></div>
      <div class="stat-card"><span>Low Stock (5 or less)</span><strong>${products.filter(product => product.stock <= 5).length}</strong></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Available Stock</th><th>Inventory Status</th><th>Action</th></tr></thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td>${esc(product.name)}</td>
              <td>${esc(product.category)}</td>
              <td>${money(product.price)}</td>
              <td>${product.stock}</td>
              <td><span class="status ${product.stock === 0 ? "cancelled" : product.stock <= 5 ? "" : "delivered"}">${product.stock === 0 ? "Out of Stock" : product.stock <= 5 ? "Low Stock" : "In Stock"}</span></td>
              <td><button class="btn-soft" data-inventory-edit="${product.id}">Update</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;

  $("inventoryList").querySelectorAll("[data-inventory-edit]").forEach(button => {
    button.addEventListener("click", () => openProductModal(Number(button.dataset.inventoryEdit)));
  });
}

/* Admin order management */

function renderAdminOrders() {
  if (currentRole !== "admin") return;

  $("adminOrders").innerHTML = orders.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>PV-${order.id}</td>
              <td>${esc(order.customerName)}</td>
              <td>${esc(dateText(order.date))}</td>
              <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td>${money(order.total)}</td>
              <td><span class="status ${order.status === "Completed" ? "delivered" : order.status === "Cancelled" ? "cancelled" : ""}">${esc(order.status)}</span></td>
              <td>
                <select data-order-status="${order.id}" aria-label="Update order status">
                  <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                  <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
                  <option value="Completed" ${order.status === "Completed" ? "selected" : ""}>Completed</option>
                  <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                </select>
                <button class="btn-soft" data-admin-receipt="${order.id}">Receipt</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : '<div class="empty-state">No customer orders have been placed.</div>';

  $("adminOrders").querySelectorAll("[data-order-status]").forEach(select => {
    select.addEventListener("change", () => {
      updateOrderStatus(Number(select.dataset.orderStatus), select.value);
    });
  });

  $("adminOrders").querySelectorAll("[data-admin-receipt]").forEach(button => {
    button.addEventListener("click", () => showReceipt(Number(button.dataset.adminReceipt)));
  });
}

function updateOrderStatus(orderId, status) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  const allowed = ["Pending", "Processing", "Completed", "Cancelled"];
  if (!allowed.includes(status)) return;

  const oldStatus = order.status;

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    return notify("Cancelled orders cannot be reopened.", "error");
  }

  if (status === "Cancelled" && oldStatus !== "Cancelled") {
    const oldProducts = products.map(product => ({ ...product }));

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });

    order.status = status;

    if (!saveAll()) {
      products = oldProducts;
      order.status = oldStatus;
      return;
    }
  } else {
    order.status = status;
    if (!save(DB.orders, orders)) {
      order.status = oldStatus;
      return;
    }
  }

  renderAdminOrders();
  renderDashboard();
  renderInventory();
  notify("Order status updated.");
}

/* Customer account management */

function renderAdminUsers() {
  if (currentRole !== "admin") return;

  const customers = users.filter(user => user.role === "customer");

  $("adminUsers").innerHTML = customers.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Username</th><th>Phone</th><th>Joined</th><th>Account Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${customers.map(user => `
            <tr>
              <td>${esc(user.fullName)}</td>
              <td>${esc(user.username)}</td>
              <td>${esc(user.phone || "—")}</td>
              <td>${esc(dateText(user.createdAt))}</td>
              <td>${user.active === false ? "Disabled" : "Active"}</td>
              <td>
                <button class="btn-soft" data-toggle-user="${user.id}">${user.active === false ? "Enable" : "Disable"}</button>
                <button class="btn-danger" data-delete-user="${user.id}">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : '<div class="empty-state">No customer accounts found.</div>';

  $("adminUsers").querySelectorAll("[data-toggle-user]").forEach(button => {
    button.addEventListener("click", () => toggleUser(Number(button.dataset.toggleUser)));
  });

  $("adminUsers").querySelectorAll("[data-delete-user]").forEach(button => {
    button.addEventListener("click", () => deleteUser(Number(button.dataset.deleteUser)));
  });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id && item.role === "customer");
  if (!user) return;

  const old = user.active;
  user.active = old === false;

  if (!save(DB.users, users)) {
    user.active = old;
    return;
  }

  renderAdminUsers();
  notify(user.active ? "Account enabled." : "Account disabled.");
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id && item.role === "customer");
  if (!user) return;

  if (orders.some(order => order.customerId === id && order.status !== "Cancelled")) {
    return notify("Cannot delete a customer with active or completed orders.", "error");
  }

  if (!confirm(`Delete ${user.fullName}'s account?`)) return;

  const oldUsers = users;
  const oldCarts = JSON.parse(JSON.stringify(carts));

  users = users.filter(item => item.id !== id);
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

/* Dashboard and admin settings */

function renderDashboard() {
  if (currentRole !== "admin") return;

  const revenue = orders
    .filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const pending = orders.filter(order => order.status === "Pending").length;
  const completed = orders.filter(order => order.status === "Completed").length;
  const customers = users.filter(user => user.role === "customer").length;

  $("dashboardStats").innerHTML = `
    <div class="stat-card"><span>Total Products</span><strong>${products.length}</strong></div>
    <div class="stat-card"><span>Total Customers</span><strong>${customers}</strong></div>
    <div class="stat-card"><span>Total Orders</span><strong>${orders.length}</strong></div>
    <div class="stat-card"><span>Pending Orders</span><strong>${pending}</strong></div>
    <div class="stat-card"><span>Completed Orders</span><strong>${completed}</strong></div>
    <div class="stat-card"><span>Completed Sales</span><strong>${money(revenue)}</strong></div>`;

  const recent = orders.slice(0, 5);

  $("recentOrders").innerHTML = recent.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${recent.map(order => `
            <tr>
              <td>PV-${order.id}</td>
              <td>${esc(order.customerName)}</td>
              <td>${esc(dateText(order.date))}</td>
              <td>${money(order.total)}</td>
              <td>${esc(order.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>` : '<div class="empty-state">No recent orders.</div>';
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

  if (users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    return $("settingsMessage").textContent = "Username is already in use.";
  }

  if ((password || confirmPassword) && (password.length < 6 || password !== confirmPassword)) {
    return $("settingsMessage").textContent = password.length < 6
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
  $("settingsMessage").textContent = "Administrator settings saved successfully.";
  notify("Admin settings updated.");
});

/* Print receipt */

function printReceipt() {
  const content = $("receiptContent");
  if (!content.innerHTML.trim()) return;

  const win = window.open("", "_blank", "width=850,height=750");
  if (!win) return notify("Allow pop-ups to print your receipt.", "error");

  win.document.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Petal & Vine Receipt</title>
    <style>
      body{padding:25px;color:#382b32;font-family:Arial,sans-serif}
      h2{color:#5d2c43}
      table{width:100%;border-collapse:collapse}
      th,td{padding:10px;border-bottom:1px solid #eee;text-align:left}
      .receipt-head{text-align:center}
      .summary-line{display:flex;justify-content:space-between;margin-top:15px}
      .summary-total{font-size:20px;font-weight:bold}
      @media print{body{padding:0}}
    </style>
  </head>
  <body>
    ${content.innerHTML}
    <script>window.onload=function(){window.print();};<\/script>
  </body>
  </html>`);

  win.document.close();
}

$("printReceiptButton").addEventListener("click", printReceipt);

/* Modal close behavior */

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) modal.classList.add("hidden");
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal").forEach(modal => modal.classList.add("hidden"));
  }
});

/* Start application */

function initializeApplication() {
  initializeData();
  restoreSession();
}

document.addEventListener("DOMContentLoaded", initializeApplication);
