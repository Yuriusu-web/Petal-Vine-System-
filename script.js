/* PETAL & VINE - COMPLETE APPLICATION SCRIPT */
"use strict";

const $ = id => document.getElementById(id);
const KEYS = {
  users: "petal_vine_users",
  products: "petal_vine_products",
  orders: "petal_vine_orders"
};

let users = load(KEYS.users, []);
let products = load(KEYS.products, []);
let orders = load(KEYS.orders, []);
let currentUser = null;
let cart = [];
let toastTimer;

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return "₱" + Number(value || 0).toFixed(2);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}

function makeId(prefix) {
  return prefix + "-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function seedData() {
  if (!users.some(u => u.username.toLowerCase() === "admin")) {
    users.push({ id: "admin-account", fullName: "Administrator", username: "admin", password: "Admin123", role: "admin" });
    save(KEYS.users, users);
  }

  if (!products.length) {
    products = [
      {id:makeId("PRD"),name:"Classic Rose Bouquet",category:"Roses",emoji:"🌹",price:850,stock:15},
      {id:makeId("PRD"),name:"Pink Tulip Bundle",category:"Tulips",emoji:"🌷",price:720,stock:12},
      {id:makeId("PRD"),name:"Sunny Sunflowers",category:"Sunflowers",emoji:"🌻",price:650,stock:18},
      {id:makeId("PRD"),name:"Pastel Mixed Bouquet",category:"Bouquet",emoji:"💐",price:1200,stock:10},
      {id:makeId("PRD"),name:"White Lily Arrangement",category:"Bouquet",emoji:"🪷",price:950,stock:8},
      {id:makeId("PRD"),name:"Mini Potted Plant",category:"Plants",emoji:"🪴",price:450,stock:20}
    ];
    save(KEYS.products, products);
  }
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function showAuth(which) {
  $("authChoices").classList.toggle("hidden", which !== "choices");
  $("loginForm").classList.toggle("hidden", which !== "login");
  $("registerForm").classList.toggle("hidden", which !== "register");
  $("loginError").textContent = "";
  $("registerError").textContent = "";
}

function startApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("welcomeUser").textContent = "Welcome, " + currentUser.fullName;

  $("dashboardMessage").textContent = isAdmin()
    ? "Welcome to your flower shop management dashboard."
    : "Welcome! Find flowers for every beautiful moment.";

  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin());
  });

  $("cartNavBtn").classList.toggle("hidden", isAdmin());
  $("checkoutName").value = isAdmin() ? "" : currentUser.fullName;
  $("currentYear").textContent = new Date().getFullYear();

  if (isAdmin()) cart = [];

  updateCart();
  refreshAll();
  showPage("dashboard");
}

function logout() {
  currentUser = null;
  cart = [];
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("receiptModal").classList.add("hidden");
  showAuth("choices");
}

function showPage(pageName) {
  if (!currentUser) return;

  if (pageName === "cart" && isAdmin()) {
    notify("The admin account does not use the shopping cart.");
    showPage("dashboard");
    return;
  }

  const adminPages = ["inventory", "customers", "reports"];

  if (adminPages.includes(pageName) && !isAdmin()) {
    notify("This page is only available to the administrator.");
    pageName = "dashboard";
  }

  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));

  const target = $(pageName);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });

  if (pageName === "cart") renderCart();
  if (pageName === "orders") renderOrders();
  if (pageName === "inventory") renderInventory();
  if (pageName === "customers") renderCustomers();
  if (pageName === "reports") renderReports();
}

function refreshAll() {
  renderDashboard();
  renderInventory();
  renderShop();
  renderCart();
  renderOrders();
  renderCustomers();
  renderReports();
}

function productCard(product, mode) {
  const admin = isAdmin();
  const soldOut = Number(product.stock) <= 0;
  let actions = "";

  if (admin) {
    actions = `<button class="secondary-btn" data-action="edit-product" data-id="${escapeHTML(product.id)}">Edit</button>
      <button class="danger-btn" data-action="delete-product" data-id="${escapeHTML(product.id)}">Delete</button>`;
  } else if (mode !== "inventory") {
    actions = `<button class="primary-btn" data-action="add-cart" data-id="${escapeHTML(product.id)}" ${soldOut ? "disabled" : ""}>Add to Cart</button>
      <button class="buy-now-btn" data-action="buy-now" data-id="${escapeHTML(product.id)}" ${soldOut ? "disabled" : ""}>Buy Now</button>`;
  }

  return `<article class="product-card">
    <div class="product-emoji">${escapeHTML(product.emoji || "💐")}</div>
    <div class="product-info">
      <h3>${escapeHTML(product.name)}</h3>
      <p class="product-category">${escapeHTML(product.category)}</p>
      <p class="product-price">${money(product.price)}</p>
      <p class="stock-label">${soldOut ? "Out of stock" : "Stock: " + Number(product.stock)}</p>
      <div class="product-actions">${actions}</div>
    </div>
  </article>`;
}

function renderDashboard() {
  $("dashboardProducts").innerHTML = products.length
    ? products.slice(0, 4).map(p => productCard(p, "dashboard")).join("")
    : `<p class="empty-state">No products available yet.</p>`;

  $("statProducts").textContent = products.length;
  $("statOrders").textContent = orders.length;
  $("statCustomers").textContent = users.filter(u => u.role === "customer").length;

  const revenue = orders.filter(o => o.status === "Completed").reduce((sum,o) => sum + Number(o.total), 0);
  $("statRevenue").textContent = money(revenue);
}

function renderInventory() {
  if (!isAdmin()) return;

  const term = ($("inventorySearch")?.value || "").toLowerCase();
  const filtered = products.filter(p => (p.name + " " + p.category).toLowerCase().includes(term));

  $("inventoryProducts").innerHTML = filtered.length
    ? filtered.map(p => productCard(p, "inventory")).join("")
    : `<p class="empty-state">No matching products.</p>`;
}

function renderShop() {
  const term = ($("shopSearch")?.value || "").toLowerCase();
  const filtered = products.filter(p => (p.name + " " + p.category).toLowerCase().includes(term));

  $("shopProducts").innerHTML = filtered.length
    ? filtered.map(p => productCard(p, "shop")).join("")
    : `<p class="empty-state">No flowers found.</p>`;
}

function openProductEditor(product = null) {
  if (!isAdmin()) return;

  $("productEditor").classList.remove("hidden");
  $("editorTitle").textContent = product ? "Edit Product" : "Add New Product";
  $("productId").value = product?.id || "";
  $("productName").value = product?.name || "";
  $("productCategory").value = product?.category || "Bouquet";
  $("productEmoji").value = product?.emoji || "💐";
  $("productPrice").value = product?.price ?? "";
  $("productStock").value = product?.stock ?? "";

  $("productEditor").scrollIntoView({behavior:"smooth", block:"start"});
}

function saveProduct(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const id = $("productId").value;

  const data = {
    id: id || makeId("PRD"),
    name: $("productName").value.trim(),
    category: $("productCategory").value,
    emoji: $("productEmoji").value.trim() || "💐",
    price: Number($("productPrice").value),
    stock: Math.floor(Number($("productStock").value))
  };

  if (!data.name || !Number.isFinite(data.price) || data.price < 0 || !Number.isInteger(data.stock) || data.stock < 0) {
    notify("Please enter valid product details.");
    return;
  }

  if (id) products = products.map(p => p.id === id ? data : p);
  else products.push(data);

  save(KEYS.products, products);

  $("productForm").reset();
  $("productId").value = "";
  $("productEditor").classList.add("hidden");

  refreshAll();
  notify(id ? "Product updated." : "Product added.");
}

function deleteProduct(id) {
  if (!isAdmin()) return;

  const product = products.find(p => p.id === id);
  if (!product || !confirm(`Delete ${product.name}?`)) return;

  products = products.filter(p => p.id !== id);
  cart = cart.filter(item => item.productId !== id);

  save(KEYS.products, products);

  updateCart();
  refreshAll();
  notify("Product deleted.");
}

function addToCart(id, goCheckout = false) {
  if (!currentUser || isAdmin()) return;

  const product = products.find(p => p.id === id);

  if (!product || product.stock <= 0) return notify("This flower is out of stock.");

  const existing = cart.find(item => item.productId === id);

  if (existing) {
    if (existing.quantity >= product.stock) return notify("You have reached the available stock.");
    existing.quantity++;
  } else {
    cart.push({productId:id, quantity:1});
  }

  updateCart();

  if (goCheckout) showPage("cart");
  else notify(product.name + " added to cart.");
}

function updateCart() {
  $("cartCount").textContent = cart.reduce((sum,item) => sum + item.quantity, 0);
  renderCart();
}

function renderCart() {
  if (!currentUser || isAdmin()) {
    $("cartItems").innerHTML = `<p class="empty-state">Shopping cart is for customer accounts.</p>`;
    $("cartTotal").textContent = money(0);
    return;
  }

  let total = 0;

  const rows = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return "";

    const subtotal = Number(product.price) * item.quantity;
    total += subtotal;

    return `<div class="cart-row">
      <div class="cart-row-info"><strong>${escapeHTML(product.emoji)} ${escapeHTML(product.name)}</strong><p>${money(product.price)} each · Subtotal: ${money(subtotal)}</p></div>
      <div class="quantity-controls">
        <button data-action="decrease-cart" data-id="${escapeHTML(product.id)}" aria-label="Decrease quantity">−</button>
        <strong>${item.quantity}</strong>
        <button data-action="increase-cart" data-id="${escapeHTML(product.id)}" aria-label="Increase quantity">+</button>
        <button class="danger-btn" data-action="remove-cart" data-id="${escapeHTML(product.id)}">Remove</button>
      </div>
    </div>`;
  }).join("");

  $("cartItems").innerHTML = rows || `<p class="empty-state">Your cart is empty. Visit the Shop to choose flowers.</p>`;
  $("cartTotal").textContent = money(total);
}

function changeCart(id, amount) {
  const item = cart.find(x => x.productId === id);
  const product = products.find(p => p.id === id);

  if (!item || !product) return;
  if (amount > 0 && item.quantity >= product.stock) return notify("No more stock available.");

  item.quantity += amount;

  if (item.quantity <= 0) cart = cart.filter(x => x.productId !== id);

  updateCart();
}

function removeCartItem(id) {
  cart = cart.filter(x => x.productId !== id);
  updateCart();
}

function checkout(event) {
  event.preventDefault();

  if (!currentUser || isAdmin()) return notify("Only customers can place orders.");
  if (!cart.length) return notify("Your cart is empty.");

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  // Customers can pay using Cash on Delivery only.
  const payment = "Cash on Delivery";
  $("paymentMethod").value = payment;

  if (!name || !phone || !address) return notify("Please complete all checkout details.");

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);

    if (!product || product.stock < item.quantity) {
      notify("Some items no longer have enough stock. Please review your cart.");
      refreshAll();
      return;
    }
  }

  const orderItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);

    return {
      productId:product.id,
      name:product.name,
      emoji:product.emoji,
      quantity:item.quantity,
      price:Number(product.price)
    };
  });

  const total = orderItems.reduce((sum,item) => sum + item.price * item.quantity, 0);

  const order = {
    id: makeId("PV"),
    customerUsername: currentUser.username,
    customerName: name,
    phone,
    address,
    payment,
    items: orderItems,
    total,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  orderItems.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  orders.unshift(order);

  save(KEYS.orders, orders);
  save(KEYS.products, products);

  cart = [];

  $("checkoutForm").reset();
  $("checkoutName").value = currentUser.fullName;

  updateCart();
  refreshAll();
  showPage("orders");
  showReceipt(order);
  notify("Order placed successfully!");
}

function renderOrders() {
  if (!currentUser) return;

  $("ordersTitle").textContent = isAdmin() ? "All Customer Orders" : "My Orders";

  const visibleOrders = isAdmin()
    ? orders
    : orders.filter(o => o.customerUsername === currentUser.username);

  if (!visibleOrders.length) {
    $("ordersList").innerHTML = `<p class="empty-state">No orders to display yet.</p>`;
    return;
  }

  $("ordersList").innerHTML = visibleOrders.map(order => {
    const itemSummary = (order.items || []).map(item => `${escapeHTML(item.name)} × ${item.quantity}`).join(", ");

    const actions = isAdmin()
      ? `<div class="order-actions">
          ${order.status === "Pending" ? `<button class="success-btn" data-action="complete-order" data-id="${escapeHTML(order.id)}">Mark Completed</button>` : ""}
          ${order.status === "Pending" ? `<button class="danger-btn" data-action="cancel-order" data-id="${escapeHTML(order.id)}">Cancel Order</button>` : ""}
        </div>`
      : `<div class="order-actions"><button class="secondary-btn" data-action="view-receipt" data-id="${escapeHTML(order.id)}">View Receipt</button></div>`;

    return `<article class="order-card">
      <h3>Order ${escapeHTML(order.id)}</h3>
      <p class="order-meta">${escapeHTML(order.customerName)} · ${new Date(order.createdAt).toLocaleString()}</p>
      ${isAdmin() ? `<p class="order-meta">Username: ${escapeHTML(order.customerUsername)} · Phone: ${escapeHTML(order.phone)} · Address: ${escapeHTML(order.address)}</p>` : ""}
      <p>${itemSummary}</p>
      <p><strong>Total: ${money(order.total)}</strong> · Payment: ${escapeHTML(order.payment)}</p>
      <p class="order-meta">Status: <span class="status">${escapeHTML(order.status)}</span></p>
      ${actions}
    </article>`;
  }).join("");
}

function setOrderStatus(id, status) {
  if (!isAdmin()) return;

  const order = orders.find(o => o.id === id);
  if (!order || order.status !== "Pending") return;

  if (status === "Cancelled" && !confirm("Cancel this order and return its items to inventory?")) return;

  order.status = status;

  if (status === "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });

    save(KEYS.products, products);
  }

  save(KEYS.orders, orders);
  refreshAll();
  notify("Order updated: " + status + ".");
}

function renderCustomers() {
  if (!isAdmin()) return;

  const customers = users.filter(u => u.role === "customer");

  $("customersList").innerHTML = customers.length ? customers.map(user => {
    const count = orders.filter(o => o.customerUsername === user.username).length;

    return `<div class="customer-row"><strong>${escapeHTML(user.fullName)}</strong><p class="order-meta">Username: ${escapeHTML(user.username)} · Orders: ${count}</p></div>`;
  }).join("") : `<p class="empty-state">No registered customers yet.</p>`;
}

function renderReports() {
  if (!isAdmin()) return;

  const completed = orders.filter(o => o.status === "Completed");
  const pending = orders.filter(o => o.status === "Pending");
  const revenue = completed.reduce((sum,o) => sum + Number(o.total), 0);

  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;
  $("reportPending").textContent = pending.length;
}

function showReceipt(order) {
  if (!order) return;

  const items = (order.items || []).map(item => `<tr>
    <td>${escapeHTML(item.emoji || "")} ${escapeHTML(item.name)}</td>
    <td>${Number(item.quantity)}</td>
    <td>${money(item.price)}</td>
    <td>${money(Number(item.price) * Number(item.quantity))}</td>
  </tr>`).join("");

  $("receiptDetails").innerHTML = `
    <div class="receipt-info">
      <p><strong>Receipt No.:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
      <p><strong>Delivery Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment Method:</strong> ${escapeHTML(order.payment)}</p>
      <p><strong>Order Date:</strong> ${escapeHTML(new Date(order.createdAt).toLocaleString())}</p>
      <p><strong>Order Status:</strong> ${escapeHTML(order.status)}</p>
    </div>
    <table class="receipt-table"><thead><tr><th>Flower</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>${items}</tbody></table>
    <div class="receipt-total">Total: ${money(order.total)}</div>
    <div class="receipt-footer"><p>Thank you for shopping at Petal & Vine!</p><p>Every flower tells a story. 🌷</p></div>`;

  $("receiptModal").classList.remove("hidden");
}

function viewReceipt(id) {
  const order = orders.find(o => o.id === id);

  if (order && (isAdmin() || order.customerUsername === currentUser.username)) {
    showReceipt(order);
  }
}

function setupEvents() {
  $("showLogin").addEventListener("click", () => showAuth("login"));
  $("showRegister").addEventListener("click", () => showAuth("register"));
  $("backFromLogin").addEventListener("click", () => showAuth("choices"));
  $("backFromRegister").addEventListener("click", () => showAuth("choices"));

  $("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const username = $("loginUsername").value.trim().toLowerCase();
    const password = $("loginPassword").value;

    const user = users.find(u => u.username.toLowerCase() === username && u.password === password);

    if (!user) {
      $("loginError").textContent = "Incorrect username or password.";
      return;
    }

    currentUser = user;
    $("loginForm").reset();
    startApp();
  });

  $("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const fullName = $("regFullName").value.trim();
    const username = $("regUsername").value.trim();
    const password = $("regPassword").value;
    const confirmPassword = $("regConfirm").value;

    if (password !== confirmPassword) {
      $("registerError").textContent = "Passwords do not match.";
      return;
    }

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      $("registerError").textContent = "That username is already taken.";
      return;
    }

    const user = {
      id:makeId("USR"),
      fullName,
      username,
      password,
      role:"customer"
    };

    users.push(user);
    save(KEYS.users, users);

    currentUser = user;
    $("registerForm").reset();
    startApp();
    notify("Your customer account has been created.");
  });

  $("logoutBtn").addEventListener("click", logout);

  $("navigation").addEventListener("click", event => {
    const button = event.target.closest("[data-page]");
    if (button) showPage(button.dataset.page);
  });

  $("addProductBtn").addEventListener("click", () => openProductEditor());

  $("cancelProductBtn").addEventListener("click", () => {
    $("productForm").reset();
    $("productId").value = "";
    $("productEditor").classList.add("hidden");
  });

  $("productForm").addEventListener("submit", saveProduct);
  $("inventorySearch").addEventListener("input", renderInventory);
  $("shopSearch").addEventListener("input", renderShop);
  $("checkoutForm").addEventListener("submit", checkout);

  document.addEventListener("click", event => {
    const toggle = event.target.closest("[data-toggle-password]");

    if (toggle) {
      const input = $(toggle.dataset.togglePassword);

      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        toggle.setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
      }

      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.dataset.id;

    switch (button.dataset.action) {
      case "edit-product":
        if (!isAdmin()) return;
        openProductEditor(products.find(p => p.id === id));
        break;

      case "delete-product":
        deleteProduct(id);
        break;

      case "add-cart":
        addToCart(id);
        break;

      case "buy-now":
        addToCart(id, true);
        break;

      case "increase-cart":
        changeCart(id, 1);
        break;

      case "decrease-cart":
        changeCart(id, -1);
        break;

      case "remove-cart":
        removeCartItem(id);
        break;

      case "complete-order":
        setOrderStatus(id, "Completed");
        break;

      case "cancel-order":
        setOrderStatus(id, "Cancelled");
        break;

      case "view-receipt":
        viewReceipt(id);
        break;
    }
  });

  $("printReceiptBtn").addEventListener("click", () => window.print());

  $("closeReceiptBtn").addEventListener("click", () => {
    $("receiptModal").classList.add("hidden");
  });

  $("receiptModal").addEventListener("click", event => {
    if (event.target === $("receiptModal")) {
      $("receiptModal").classList.add("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  seedData();
  setupEvents();
  $("currentYear").textContent = new Date().getFullYear();
  showAuth("choices");
});
