/* Petal & Vine - connected flower shop system */

const DB = {
  users: "pv_users_v1",
  products: "pv_products_v1",
  orders: "pv_orders_v1",
  settings: "pv_settings_v1",
  session: "pv_session_v1",
  cart: "pv_cart_v1"
};

const $ = id => document.getElementById(id);

const money = value =>
  "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const makeId = prefix =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const defaultProducts = [
  ["Classic Red Roses", "Roses", 1299, 20, "A timeless bouquet of beautiful red roses.", "🌹"],
  ["Pink Blush Bouquet", "Bouquets", 999, 18, "Soft pink blooms wrapped with care.", "🌸"],
  ["Sunshine Sunflowers", "Sunflowers", 899, 15, "Bright sunflowers to make their day.", "🌻"],
  ["White Lily Elegance", "Lilies", 1499, 12, "Elegant white lilies for special moments.", "💐"],
  ["Pastel Dream", "Bouquets", 1199, 16, "A gentle mix of pastel seasonal flowers.", "🌷"],
  ["Purple Romance", "Mixed Flowers", 1399, 10, "Purple and lavender blooms in a lovely wrap.", "🪻"],
  ["Baby's Breath Bundle", "Dried Flowers", 499, 25, "Delicate baby's breath for a simple gift.", "🤍"],
  ["Golden Sunflower Mix", "Mixed Flowers", 1099, 14, "A cheerful mix with golden sunflowers.", "🌻"],
  ["Sweet Carnations", "Carnations", 799, 20, "Fresh carnations in sweet colors.", "🌺"],
  ["Orchid Grace", "Orchids", 1599, 8, "Graceful orchids arranged beautifully.", "🪷"],
  ["Garden Party", "Bouquets", 1699, 9, "A colorful garden-inspired arrangement.", "💐"],
  ["Red Tulip Charm", "Tulips", 1299, 11, "A charming bunch of red tulips.", "🌷"],
  ["White Rose Purity", "Roses", 1199, 13, "Classic white roses with a clean finish.", "🤍"],
  ["Peachy Love", "Mixed Flowers", 1099, 17, "Warm peach tones and delicate blooms.", "🌼"],
  ["Mini Bloom Box", "Flower Boxes", 699, 22, "A petite flower box for little surprises.", "🌸"]
].map((p, i) => ({
  id: "seed" + (i + 1),
  name: p[0],
  category: p[1],
  price: p[2],
  stock: p[3],
  description: p[4],
  image: "",
  emoji: p[5]
}));

/* Keep the existing admin account and credentials. */
let users = read(DB.users, null);

if (!users) {
  users = [{
    id: "admin1",
    name: "Administrator",
    username: "admin",
    password: "admin123",
    role: "admin",
    active: true,
    phone: ""
  }];
  write(DB.users, users);
}

let products = read(DB.products, null);

if (!products) {
  products = defaultProducts;
  write(DB.products, products);
}

let orders = read(DB.orders, []);
let settings = read(DB.settings, {
  shopName: "Petal & Vine",
  adminName: "Administrator"
});
let session = read(DB.session, null);
let cart = read(DB.cart, {});
let pendingPurchase = null;
let toastTimer;

/* GENERAL FUNCTIONS */

function saveAll() {
  write(DB.users, users);
  write(DB.products, products);
  write(DB.orders, orders);
  write(DB.settings, settings);
  write(DB.cart, cart);
}

function notify(message, error = false) {
  const el = $("toast");
  el.textContent = message;
  el.classList.remove("hidden", "error");

  if (error) el.classList.add("error");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add("hidden");
  }, 2800);
}

function currentUser() {
  return session
    ? users.find(u => u.id === session.userId && u.active !== false)
    : null;
}

/* LOGIN AND REGISTRATION */

function showAuthForm(mode) {
  $("loginForm").classList.toggle("hidden", mode !== "login");
  $("registerForm").classList.toggle("hidden", mode !== "register");

  $("authTitle").textContent =
    mode === "login" ? "Welcome back" : "Create your account";

  $("authSubtitle").textContent =
    mode === "login"
      ? "Log in to continue to Petal & Vine."
      : "Join Petal & Vine and discover beautiful blooms.";

  $("authSwitch").innerHTML = mode === "login"
    ? `Don't have an account? <button type="button" class="text-btn" onclick="showAuthForm('register')">Create one</button>`
    : `Already have an account? <button type="button" class="text-btn" onclick="showAuthForm('login')">Log in</button>`;
}

$("loginForm").addEventListener("submit", e => {
  e.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(u =>
    u.username.toLowerCase() === username &&
    u.password === password
  );

  if (!user) {
    notify("Incorrect username or password.", true);
    return;
  }

  if (user.active === false) {
    notify("This account has been disabled. Contact the admin.", true);
    return;
  }

  session = { userId: user.id };
  write(DB.session, session);
  enterSystem();
});

$("registerForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (!name) {
    notify("Please enter your full name.", true);
    return;
  }

  if (username.length < 3) {
    notify("Username must have at least 3 characters.", true);
    return;
  }

  if (password.length < 4) {
    notify("Password must have at least 4 characters.", true);
    return;
  }

  if (password !== confirm) {
    notify("Passwords do not match.", true);
    return;
  }

  if (users.some(u =>
    u.username.toLowerCase() === username.toLowerCase()
  )) {
    notify("That username is already taken.", true);
    return;
  }

  users.push({
    id: makeId("user"),
    name,
    username,
    password,
    role: "customer",
    active: true,
    phone: "",
    address: ""
  });

  write(DB.users, users);

  $("registerForm").reset();
  $("loginUsername").value = username;
  $("loginPassword").value = "";

  showAuthForm("login");
  notify("Account created. Please log in using your new account.");
});

/* ENTER SYSTEM */

function enterSystem() {
  const user = currentUser();

  if (!user) {
    session = null;
    localStorage.removeItem(DB.session);
    showAuth();
    return;
  }

  $("authPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");

  $("sessionLabel").textContent = `${user.name} · ${user.role}`;
  $("brandName").textContent = settings.shopName;

  $("customerNav").classList.toggle("hidden", user.role === "admin");
  $("adminNav").classList.toggle("hidden", user.role !== "admin");

  renderAll();

  showPage(user.role === "admin" ? "dashboardPage" : "shopPage");
}

function showAuth() {
  $("authPage").classList.remove("hidden");
  $("appPage").classList.add("hidden");
  $("logoutBtn").classList.add("hidden");
  $("sessionLabel").textContent = "";

  showAuthForm("login");
}

function logout() {
  session = null;
  localStorage.removeItem(DB.session);
  showAuth();
  notify("You have logged out.");
}

/* PAGE NAVIGATION */

function showPage(pageId) {
  const user = currentUser();

  if (!user) return showAuth();

  const adminPages = [
    "dashboardPage",
    "productsPage",
    "inventoryPage",
    "ordersPage",
    "usersPage",
    "transactionsPage",
    "settingsPage"
  ];

  if (adminPages.includes(pageId) && user.role !== "admin") {
    notify("Admin access only.", true);
    return;
  }

  if (
    ["shopPage", "cartPage", "myOrdersPage"].includes(pageId) &&
    user.role === "admin"
  ) {
    pageId = "dashboardPage";
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  $(pageId)?.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  if (pageId === "shopPage") renderProducts();
  if (pageId === "cartPage") renderCart();
  if (pageId === "myOrdersPage") renderCustomerOrders();
  if (pageId === "dashboardPage") renderDashboard();
  if (pageId === "productsPage") renderAdminProducts();
  if (pageId === "inventoryPage") renderInventory();
  if (pageId === "ordersPage") renderAdminOrders();
  if (pageId === "usersPage") renderUsers();
  if (pageId === "transactionsPage") renderTransactions();
  if (pageId === "settingsPage") renderSettings();
}

function renderAll() {
  renderProducts();
  renderCartCount();

  if (currentUser()?.role === "admin") {
    renderDashboard();
    renderAdminProducts();
    renderInventory();
    renderAdminOrders();
    renderUsers();
    renderTransactions();
    renderSettings();
  }
}

/* CUSTOMER SHOP */

function productImage(p) {
  return p.image
    ? `<img src="${p.image}" alt="${escapeHTML(p.name)}">`
    : `<div class="product-placeholder">${escapeHTML(p.emoji || "🌸")}</div>`;
}

function renderProducts() {
  if (!$("shopProducts")) return;

  const term = ($("productSearch")?.value || "").trim().toLowerCase();

  const list = products.filter(p =>
    `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term)
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(p => `
      <article class="product-card">
        ${productImage(p)}
        <div class="product-info">
          <div class="product-meta">
            <span class="eyebrow">${escapeHTML(p.category)}</span>
            <span class="stock">${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
          </div>

          <h3>${escapeHTML(p.name)}</h3>
          <p>${escapeHTML(p.description || "Beautiful fresh flowers, arranged with care.")}</p>

          <div class="product-meta">
            <span class="price">${money(p.price)}</span>
            <span class="tiny muted">Petal & Vine</span>
          </div>

          <div class="product-actions">
            <input
              class="qty-input"
              id="qty-${p.id}"
              type="number"
              min="1"
              max="${Math.max(1, p.stock)}"
              value="1"
              aria-label="Quantity"
              ${p.stock <= 0 ? "disabled" : ""}
            >

            <button
              class="btn btn-outline"
              onclick="addToCart('${p.id}')"
              ${p.stock <= 0 ? "disabled" : ""}
            >Add to cart</button>

            <button
              class="btn btn-primary"
              onclick="buyNow('${p.id}')"
              ${p.stock <= 0 ? "disabled" : ""}
            >Buy now</button>
          </div>
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">No flowers found.</div>`;
}

function getQty(productId) {
  const field = $("qty-" + productId);
  const qty = Number(field?.value || 1);

  if (!Number.isInteger(qty) || qty < 1) {
    notify("Enter a valid quantity.", true);
    return 0;
  }

  const p = products.find(x => x.id === productId);

  if (!p || qty > p.stock) {
    notify("Quantity exceeds available stock.", true);
    return 0;
  }

  return qty;
}

/* CUSTOMER CART */

function addToCart(productId) {
  const user = currentUser();

  if (!user || user.role !== "customer") return;

  const qty = getQty(productId);
  if (!qty) return;

  const key = user.id;
  cart[key] = cart[key] || [];

  const line = cart[key].find(x => x.productId === productId);
  const product = products.find(p => p.id === productId);

  if (line) {
    if (line.quantity + qty > product.stock) {
      notify("Not enough stock for that quantity.", true);
      return;
    }

    line.quantity += qty;
  } else {
    cart[key].push({
      productId,
      quantity: qty
    });
  }

  write(DB.cart, cart);
  renderCartCount();
  notify("Added to your cart.");
}

function getUserCart() {
  const user = currentUser();
  return user ? (cart[user.id] || []) : [];
}

function renderCartCount() {
  const count = getUserCart().reduce((sum, x) => sum + x.quantity, 0);

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }
}

function renderCart() {
  const lines = getUserCart();
  const host = $("cartContent");

  if (!host) return;

  const valid = lines.filter(line =>
    products.some(p => p.id === line.productId)
  );

  if (!valid.length) {
    host.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add flowers from the shop to get started.</p>
        <button class="btn btn-primary" onclick="showPage('shopPage')">Browse flowers</button>
      </div>
    `;

    renderCartCount();
    return;
  }

  let total = 0;

  host.innerHTML = `
    <div class="panel">
      ${valid.map(line => {
        const p = products.find(x => x.id === line.productId);
        const subtotal = p.price * line.quantity;
        total += subtotal;

        return `
          <div class="cart-row">
            ${p.image
              ? `<img src="${p.image}" alt="">`
              : `<div class="cart-thumb">${escapeHTML(p.emoji || "🌸")}</div>`
            }

            <div>
              <h3>${escapeHTML(p.name)}</h3>
              <span class="tiny muted">${money(p.price)} each</span>
            </div>

            <div>
              <input
                class="qty-input"
                type="number"
                min="1"
                max="${p.stock}"
                value="${line.quantity}"
                onchange="changeCartQuantity('${p.id}',this.value)"
              >
              <div class="tiny muted">${money(subtotal)}</div>
            </div>

            <button class="btn btn-danger cart-remove" onclick="removeFromCart('${p.id}')">
              Remove
            </button>
          </div>
        `;
      }).join("")}

      <div class="cart-summary">
        <span>Total</span>
        <strong class="price">${money(total)}</strong>
      </div>

      <button class="btn btn-primary full" onclick="checkoutCart()">
        Proceed to checkout
      </button>
    </div>
  `;

  renderCartCount();
}

function changeCartQuantity(productId, value) {
  const qty = Number(value);
  const p = products.find(x => x.id === productId);
  const line = getUserCart().find(x => x.productId === productId);

  if (!line) return;

  if (
    !Number.isInteger(qty) ||
    qty < 1 ||
    !p ||
    qty > p.stock
  ) {
    notify("Invalid quantity or insufficient stock.", true);
    renderCart();
    return;
  }

  line.quantity = qty;
  write(DB.cart, cart);
  renderCart();
}

function removeFromCart(productId) {
  const user = currentUser();
  if (!user) return;

  cart[user.id] = getUserCart().filter(x => x.productId !== productId);

  write(DB.cart, cart);
  renderCart();
  notify("Item removed.");
}

/* BUY NOW AND CHECKOUT */

function buyNow(productId) {
  const qty = getQty(productId);
  if (!qty) return;

  const p = products.find(x => x.id === productId);

  pendingPurchase = [{
    productId,
    quantity: qty
  }];

  openCheckout([{
    product: p,
    quantity: qty
  }]);
}

function checkoutCart() {
  const lines = getUserCart();

  if (!lines.length) {
    return notify("Your cart is empty.", true);
  }

  const items = [];

  for (const line of lines) {
    const p = products.find(x => x.id === line.productId);

    if (!p || line.quantity > p.stock) {
      notify(`Please update the quantity for ${p?.name || "an item"}.`, true);
      return;
    }

    items.push({
      product: p,
      quantity: line.quantity
    });
  }

  pendingPurchase = lines.map(x => ({ ...x }));
  openCheckout(items);
}

function openCheckout(items) {
  const user = currentUser();
  if (!user || user.role !== "customer") return;

  const total = items.reduce(
    (sum, x) => sum + x.product.price * x.quantity,
    0
  );

  $("checkoutSummary").innerHTML =
    items.map(x =>
      `${escapeHTML(x.product.name)} × ${x.quantity} — ${money(x.product.price * x.quantity)}`
    ).join("<br>") +
    `<hr><b>Total: ${money(total)}</b>`;

  $("checkoutName").value = user.name || "";
  $("checkoutPhone").value = user.phone || "";
  $("checkoutAddress").value = user.address || "";
  $("paymentMethod").value = "Cash on Delivery";

  $("checkoutModal").classList.remove("hidden");
}

function closeCheckout() {
  $("checkoutModal").classList.add("hidden");
  pendingPurchase = null;
}

$("checkoutForm").addEventListener("submit", e => {
  e.preventDefault();

  if (!pendingPurchase?.length) return;

  const user = currentUser();

  if (!user || user.role !== "customer") return;

  const items = [];

  for (const line of pendingPurchase) {
    const p = products.find(x => x.id === line.productId);

    if (!p || line.quantity < 1 || line.quantity > p.stock) {
      notify("Stock changed. Please review your cart.", true);
      closeCheckout();
      renderCart();
      return;
    }

    items.push({
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      quantity: line.quantity,
      subtotal: Number(p.price) * line.quantity
    });
  }

  const total = items.reduce((sum, x) => sum + x.subtotal, 0);

  const order = {
    id: makeId("PV-").toUpperCase(),
    userId: user.id,
    customerName: $("checkoutName").value.trim(),
    phone: $("checkoutPhone").value.trim(),
    address: $("checkoutAddress").value.trim(),
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pay on delivery",
    status: "Pending",
    items,
    total,
    createdAt: new Date().toISOString()
  };

  if (!order.customerName || !order.phone || !order.address) {
    notify("Please complete your delivery details.", true);
    return;
  }

  items.forEach(item => {
    const p = products.find(x => x.id === item.productId);
    p.stock -= item.quantity;
  });

  orders.unshift(order);

  user.phone = order.phone;
  user.address = order.address;

  const remaining = getUserCart().map(line => {
    const bought = pendingPurchase.find(
      x => x.productId === line.productId
    );

    return bought
      ? { ...line, quantity: line.quantity - bought.quantity }
      : line;
  }).filter(line => line.quantity > 0);

  cart[user.id] = remaining;

  write(DB.products, products);
  write(DB.orders, orders);
  write(DB.users, users);
  write(DB.cart, cart);

  pendingPurchase = null;
  $("checkoutForm").reset();
  $("checkoutModal").classList.add("hidden");

  renderCartCount();
  notify("Your order has been placed successfully.");
  showReceipt(order);
  renderAll();
});

/* RECEIPTS */

function showReceipt(order) {
  const receipt = $("receiptContent");

  receipt.innerHTML = `
    <div class="receipt">
      <div class="receipt-center">
        <h2>${escapeHTML(settings.shopName)}</h2>
        <p>Thank you for choosing our flowers!</p>
        <p>ORDER RECEIPT</p>
      </div>

      <div class="receipt-line">
        <span>Order ID</span>
        <b>${escapeHTML(order.id)}</b>
      </div>

      <div class="receipt-line">
        <span>Date</span>
        <span>${new Date(order.createdAt).toLocaleString()}</span>
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

      <h3>Items</h3>

      ${order.items.map(x => `
        <div class="receipt-line">
          <span>${escapeHTML(x.name)} × ${x.quantity}</span>
          <span>${money(x.subtotal)}</span>
        </div>
      `).join("")}

      <div class="receipt-line receipt-total">
        <span>TOTAL</span>
        <span>${money(order.total)}</span>
      </div>

      <p class="receipt-center">
        Order status: ${escapeHTML(order.status)}<br>
        Payment: ${escapeHTML(order.paymentStatus)}
      </p>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function closeReceipt() {
  $("receiptModal").classList.add("hidden");
}

function renderCustomerOrders() {
  const user = currentUser();

  const list = orders.filter(o => o.userId === user?.id);

  $("customerOrders").innerHTML = list.length
    ? list.map(orderCard).join("")
    : `
      <div class="empty-state">
        <div class="emoji">📦</div>
        <h2>No orders yet</h2>
        <p>Your purchases will appear here.</p>
      </div>
    `;
}

function orderCard(o) {
  return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <h3>Order ${escapeHTML(o.id)}</h3>
          <span class="tiny muted">${new Date(o.createdAt).toLocaleString()}</span>
        </div>

        <span class="status ${
          o.status === "Completed"
            ? "success"
            : o.status === "Cancelled"
              ? "danger"
              : "warning"
        }">${escapeHTML(o.status)}</span>
      </div>

      <div class="order-items">
        ${o.items.map(i =>
          `${escapeHTML(i.name)} × ${i.quantity} — ${money(i.subtotal)}`
        ).join("<br>")}
      </div>

      <div class="order-bottom">
        <div>
          <span class="tiny muted">Total</span><br>
          <b class="price">${money(o.total)}</b>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" onclick="viewReceipt('${o.id}')">
            Receipt
          </button>
        </div>
      </div>
    </article>
  `;
}

function viewReceipt(id) {
  const order = orders.find(x => x.id === id);
  const user = currentUser();

  if (!order || !user) return;

  if (user.role !== "admin" && order.userId !== user.id) {
    notify("You cannot view this receipt.", true);
    return;
  }

  showReceipt(order);
}

/* ADMIN DASHBOARD */

function renderDashboard() {
  if (!$("dashboardStats")) return;

  const revenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const low = products.filter(p => p.stock <= 5).length;

  $("dashboardStats").innerHTML = [
    ["Products", products.length],
    ["Customer accounts", users.filter(u => u.role === "customer").length],
    ["Total orders", orders.length],
    ["Sales total", money(revenue)]
  ].map(x => `
    <div class="stat-card">
      <span>${x[0]}</span>
      <strong>${x[1]}</strong>
    </div>
  `).join("");

  $("recentOrders").innerHTML = orders.length
    ? orders.slice(0, 5).map(orderCard).join("")
    : `<div class="empty-state">No customer orders yet.</div>`;

  if (low) {
    $("recentOrders").insertAdjacentHTML(
      "afterbegin",
      `<p class="tiny" style="color:#966819">⚠ ${low} product(s) have 5 or fewer items in stock.</p>`
    );
  }
}

/* ADMIN PRODUCT MANAGEMENT */

function renderAdminProducts() {
  $("adminProductsTable").innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="table-product">
          ${p.image
            ? `<img src="${p.image}" alt="">`
            : `<span>${escapeHTML(p.emoji || "🌸")}</span>`
          }
          <span>${escapeHTML(p.name)}</span>
        </div>
      </td>

      <td>${escapeHTML(p.category)}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock}</td>

      <td>
        <span class="status ${
          p.stock === 0 ? "danger" : p.stock <= 5 ? "warning" : "success"
        }">
          ${
            p.stock === 0
              ? "Out of stock"
              : p.stock <= 5
                ? "Low stock"
                : "Available"
          }
        </span>
      </td>

      <td>
        <button class="btn btn-outline" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function openProductForm() {
  $("productForm").reset();
  $("productId").value = "";
  $("productFormTitle").textContent = "Add product";
  $("productFormPanel").classList.remove("hidden");
  $("productName").focus();
}

function closeProductForm() {
  $("productFormPanel").classList.add("hidden");
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  $("productId").value = p.id;
  $("productName").value = p.name;
  $("productCategory").value = p.category;
  $("productPrice").value = p.price;
  $("productStock").value = p.stock;
  $("productDescription").value = p.description || "";
  $("productImage").value = "";
  $("productFormTitle").textContent = "Edit product";

  $("productFormPanel").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("productForm").addEventListener("submit", async e => {
  e.preventDefault();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (
    !name ||
    !category ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    notify("Please enter valid product details.", true);
    return;
  }

  if (products.some(p =>
    p.id !== id && p.name.toLowerCase() === name.toLowerCase()
  )) {
    notify("A product with that name already exists.", true);
    return;
  }

  let image = products.find(p => p.id === id)?.image || "";
  const file = $("productImage").files[0];

  if (file) {
    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file.", true);
      return;
    }

    try {
      image = await fileToDataURL(file);
    } catch {
      notify("Unable to load the selected picture.", true);
      return;
    }
  }

  if (id) {
    const p = products.find(x => x.id === id);

    if (!p) return;

    Object.assign(p, {
      name,
      category,
      price,
      stock,
      description: $("productDescription").value.trim(),
      image
    });
  } else {
    products.push({
      id: makeId("prod"),
      name,
      category,
      price,
      stock,
      description: $("productDescription").value.trim(),
      image,
      emoji: "🌸"
    });
  }

  write(DB.products, products);
  closeProductForm();
  renderAll();
  notify("Product saved.");
});

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  if (!confirm(`Delete "${p.name}"?`)) return;

  products = products.filter(x => x.id !== id);

  Object.keys(cart).forEach(userId => {
    cart[userId] = (cart[userId] || []).filter(
      item => item.productId !== id
    );
  });

  write(DB.products, products);
  write(DB.cart, cart);

  renderAll();
  notify("Product deleted.");
}

/* ADMIN INVENTORY */

function renderInventory() {
  $("inventoryTable").innerHTML = products.map(p => `
    <tr>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(p.category)}</td>
      <td><b>${p.stock}</b></td>

      <td>
        <span class="status ${
          p.stock === 0 ? "danger" : p.stock <= 5 ? "warning" : "success"
        }">
          ${
            p.stock === 0
              ? "Out of stock"
              : p.stock <= 5
                ? "Low stock"
                : "In stock"
          }
        </span>
      </td>

      <td>
        <form onsubmit="updateStock(event,'${p.id}')" class="form-actions">
          <input
            class="qty-input"
            type="number"
            min="0"
            value="${p.stock}"
            id="stock-${p.id}"
          >
          <button class="btn btn-outline">Update</button>
        </form>
      </td>
    </tr>
  `).join("");
}

function updateStock(e, id) {
  e.preventDefault();

  const value = Number($("stock-" + id).value);
  const p = products.find(x => x.id === id);

  if (!p || !Number.isInteger(value) || value < 0) {
    return notify("Enter a valid stock amount.", true);
  }

  p.stock = value;

  write(DB.products, products);
  renderAll();
  notify("Inventory updated.");
}

/* ADMIN CUSTOMER ORDERS */

function renderAdminOrders() {
  $("adminOrders").innerHTML = orders.length
    ? orders.map(o => `
      ${orderCard(o)}

      <div class="panel">
        <div class="form-actions">
          <label class="tiny">
            Order status
            <select onchange="updateOrderStatus('${o.id}',this.value)">
              ${[
                "Pending",
                "Processing",
                "Ready for delivery",
                "Completed",
                "Cancelled"
              ].map(s => `
                <option value="${s}" ${o.status === s ? "selected" : ""}>
                  ${s}
                </option>
              `).join("")}
            </select>
          </label>

          <label class="tiny">
            Payment status
            <select onchange="updatePaymentStatus('${o.id}',this.value)">
              ${[
                "Pay on delivery",
                "Paid",
                "Refunded"
              ].map(s => `
                <option value="${s}" ${o.paymentStatus === s ? "selected" : ""}>
                  ${s}
                </option>
              `).join("")}
            </select>
          </label>
        </div>
      </div>
    `).join("")
    : `<div class="empty-state">No orders have been placed yet.</div>`;
}

function updateOrderStatus(id, status) {
  const o = orders.find(x => x.id === id);
  if (!o) return;

  const previous = o.status;

  if (status === "Cancelled" && previous !== "Cancelled") {
    o.items.forEach(item => {
      const p = products.find(x => x.id === item.productId);
      if (p) p.stock += item.quantity;
    });
  }

  if (previous === "Cancelled" && status !== "Cancelled") {
    notify("A cancelled order cannot be reopened automatically. Please create a new order.", true);
    renderAdminOrders();
    return;
  }

  o.status = status;

  write(DB.orders, orders);
  write(DB.products, products);

  renderAll();
  notify("Order status updated.");
}

function updatePaymentStatus(id, status) {
  const o = orders.find(x => x.id === id);
  if (!o) return;

  o.paymentStatus = status;

  write(DB.orders, orders);
  renderAdminOrders();
  renderTransactions();

  notify("Payment status updated.");
}

/* ADMIN USER MANAGEMENT */

function renderUsers() {
  $("usersTable").innerHTML = users.map(u => `
    <tr>
      <td>${escapeHTML(u.name)}</td>
      <td>${escapeHTML(u.username)}</td>
      <td>${escapeHTML(u.role)}</td>

      <td>
        <span class="status ${u.active === false ? "danger" : "success"}">
          ${u.active === false ? "Disabled" : "Active"}
        </span>
      </td>

      <td>
        ${
          u.role === "admin"
            ? "—"
            : `
              <button
                class="btn ${u.active === false ? "btn-primary" : "btn-danger"}"
                onclick="toggleUser('${u.id}')"
              >
                ${u.active === false ? "Enable" : "Disable"}
              </button>

              <button class="btn btn-outline" onclick="deleteUser('${u.id}')">
                Delete
              </button>
            `
        }
      </td>
    </tr>
  `).join("");
}

function toggleUser(id) {
  const u = users.find(x => x.id === id);
  if (!u) return;

  u.active = u.active === false ? true : false;

  write(DB.users, users);
  renderUsers();

  notify(`Account ${u.active ? "enabled" : "disabled"}.`);
}

function deleteUser(id) {
  const u = users.find(x => x.id === id);

  if (!u || u.role === "admin") return;

  if (!confirm(`Delete customer account ${u.username}?`)) return;

  users = users.filter(x => x.id !== id);

  delete cart[id];

  write(DB.users, users);
  write(DB.cart, cart);

  renderUsers();
  renderDashboard();

  notify("Customer account deleted.");
}

/* ADMIN TRANSACTIONS */

function renderTransactions() {
  $("transactionsContent").innerHTML = orders.length
    ? `
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Payment status</th>
                <th>Receipt</th>
              </tr>
            </thead>

            <tbody>
              ${orders.map(o => `
                <tr>
                  <td>${escapeHTML(o.id)}</td>
                  <td>${escapeHTML(o.customerName)}</td>
                  <td>Cash on Delivery</td>
                  <td>${money(o.total)}</td>

                  <td>
                    <span class="status ${
                      o.paymentStatus === "Paid" ? "success" : "warning"
                    }">
                      ${escapeHTML(o.paymentStatus)}
                    </span>
                  </td>

                  <td>
                    <button class="btn btn-outline" onclick="viewReceipt('${o.id}')">
                      View
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
    : `<div class="empty-state">No transactions available.</div>`;
}

/* ADMIN SETTINGS */

function renderSettings() {
  $("settingShopName").value = settings.shopName;
  $("settingAdminName").value = settings.adminName;
}

$("settingsForm").addEventListener("submit", e => {
  e.preventDefault();

  const shopName = $("settingShopName").value.trim();
  const adminName = $("settingAdminName").value.trim();
  const password = $("settingAdminPassword").value;

  if (!shopName || !adminName) {
    return notify("Please complete the settings.", true);
  }

  if (password && password.length < 4) {
    return notify("Password must have at least 4 characters.", true);
  }

  settings.shopName = shopName;
  settings.adminName = adminName;

  const admin = users.find(u => u.role === "admin");

  if (admin) {
    admin.name = adminName;

    if (password) {
      admin.password = password;
    }
  }

  write(DB.settings, settings);
  write(DB.users, users);

  $("settingAdminPassword").value = "";
  $("brandName").textContent = shopName;

  if (currentUser()?.role === "admin") {
    $("sessionLabel").textContent = `${adminName} · admin`;
  }

  notify("Settings saved.");
});

/* START SYSTEM */

function initialize() {
  if (session && currentUser()) {
    enterSystem();
  } else {
    session = null;
    localStorage.removeItem(DB.session);
    showAuth();
  }

  renderCartCount();
}

initialize();
