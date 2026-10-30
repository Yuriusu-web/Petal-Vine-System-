
"use strict";

/* =========================================
   PETAL & VINE - FLOWER SHOP SYSTEM
   PART 1: DATABASE, LOGIN, NAVIGATION,
   DASHBOARD, PRODUCTS AND INVENTORY
========================================= */

const $ = id => document.getElementById(id);

const DB = {
  products: "petal_vine_products",
  users: "petal_vine_users",
  orders: "petal_vine_orders",
  admin: "petal_vine_admin_settings"
};

const DEFAULT_ADMIN = {
  username: "admin",
  password: "Admin123",
  displayName: "Administrator"
};

const DEFAULT_PRODUCTS = [
  { name: "Red Rose", category: "Roses", emoji: "🌹", price: 85, stock: 30 },
  { name: "Pink Rose", category: "Roses", emoji: "🌹", price: 90, stock: 25 },
  { name: "White Rose", category: "Roses", emoji: "🌹", price: 95, stock: 20 },
  { name: "Sunflower", category: "Sunflowers", emoji: "🌻", price: 120, stock: 25 },
  { name: "Pink Tulip", category: "Tulips", emoji: "🌷", price: 110, stock: 20 },
  { name: "White Tulip", category: "Tulips", emoji: "🌷", price: 115, stock: 20 },
  { name: "White Lily", category: "Lilies", emoji: "💮", price: 150, stock: 15 },
  { name: "Pink Lily", category: "Lilies", emoji: "🌸", price: 155, stock: 15 },
  { name: "Mixed Bouquet", category: "Bouquets", emoji: "💐", price: 550, stock: 12 },
  { name: "Romantic Bouquet", category: "Bouquets", emoji: "💐", price: 750, stock: 10 },
  { name: "Birthday Bouquet", category: "Bouquets", emoji: "🌺", price: 650, stock: 10 },
  { name: "Baby's Breath", category: "Other", emoji: "🌼", price: 180, stock: 20 },
  { name: "Orchid Plant", category: "Other", emoji: "🪻", price: 350, stock: 10 },
  { name: "Flower Gift Box", category: "Gifts", emoji: "🎁", price: 850, stock: 8 },
  { name: "Mini Flower Basket", category: "Gifts", emoji: "🌸", price: 450, stock: 12 }
];

function load(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    console.error("Database loading error:", key, error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Database saving error:", error);
    alert("Unable to save data. Your browser storage may be full. Try using smaller product pictures.");
    return false;
  }
}

function money(amount) {
  return Number(amount || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function validImage(image) {
  return typeof image === "string" &&
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(image);
}

/* DATABASE INITIALIZATION */

let products = load(DB.products, null);

if (!Array.isArray(products)) {
  products = DEFAULT_PRODUCTS.map((product, index) => ({
    ...product,
    id: index + 1,
    image: ""
  }));
  save(DB.products, products);
}

products = products.map((product, index) => ({
  ...product,
  id: Number(product.id) || index + 1,
  name: String(product.name || "Flower"),
  category: String(product.category || "Other"),
  emoji: String(product.emoji || "🌸"),
  price: Number(product.price) || 0,
  stock: Math.max(0, Number(product.stock) || 0),
  image: validImage(product.image) ? product.image : ""
}));

let users = load(DB.users, []);
if (!Array.isArray(users)) users = [];

let orders = load(DB.orders, []);
if (!Array.isArray(orders)) orders = [];

orders = orders.map(order => ({
  ...order,
  items: Array.isArray(order.items) ? order.items : [],
  status: order.status || "Pending"
}));

let adminSettings = load(DB.admin, DEFAULT_ADMIN);
if (!adminSettings || typeof adminSettings !== "object") {
  adminSettings = { ...DEFAULT_ADMIN };
}

adminSettings = {
  ...DEFAULT_ADMIN,
  ...adminSettings
};

let nextProductId = Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1;
let nextOrderId = Math.max(0, ...orders.map(o => Number(o.id) || 0)) + 1;
let nextUserId = Math.max(0, ...users.map(u => Number(u.id) || 0)) + 1;

let currentUser = null;
let currentRole = null;
let toastTimer = null;
let selectedProductImage = "";
let originalProductImage = "";

/* AUTHENTICATION */

function showAuth(type) {
  $("authChoices").classList.add("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  if (type === "customer" || type === "admin") {
    $("loginForm").classList.remove("hidden");
    $("loginTitle").textContent =
      type === "admin" ? "Administrator Login" : "Customer Login";
    $("loginForm").dataset.role = type;
    $("loginError").textContent = "";
    $("loginUsername").value = "";
    $("loginPassword").value = "";
  }

  if (type === "register") {
    $("registerForm").classList.remove("hidden");
    $("registerError").textContent = "";
  }
}

function backToChoices() {
  $("authChoices").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
}

function togglePassword(id, button) {
  const field = $(id);
  field.type = field.type === "password" ? "text" : "password";
  button.textContent = field.type === "password" ? "👁️" : "🙈";
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  const role = $("loginForm").dataset.role;

  $("loginError").textContent = "";

  if (role === "admin") {
    if (
      username.toLowerCase() === adminSettings.username.toLowerCase() &&
      password === adminSettings.password
    ) {
      currentUser = {
        id: 0,
        username: adminSettings.username,
        fullName: adminSettings.displayName
      };
      currentRole = "admin";
      enterApp();
      return;
    }

    $("loginError").textContent = "Incorrect administrator username or password.";
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    $("loginError").textContent = "Incorrect username or password.";
    return;
  }

  if (user.active === false) {
    $("loginError").textContent = "Your account has been disabled. Contact the administrator.";
    return;
  }

  user.lastLogin = new Date().toISOString();

  if (!save(DB.users, users)) return;

  currentUser = user;
  currentRole = "customer";
  enterApp();
});

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const fullName = $("regFullName").value.trim();
  const username = $("regUsername").value.trim();
  const password = $("regPassword").value;
  const confirmPassword = $("regConfirm").value;

  $("registerError").textContent = "";

  if (fullName.length < 2 || username.length < 3) {
    $("registerError").textContent = "Please enter valid account details.";
    return;
  }

  if (username.toLowerCase() === adminSettings.username.toLowerCase()) {
    $("registerError").textContent = "This username is reserved.";
    return;
  }

  if (password.length < 6) {
    $("registerError").textContent = "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    $("registerError").textContent = "Passwords do not match.";
    return;
  }

  const duplicate = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (duplicate) {
    $("registerError").textContent = "Username is already taken.";
    return;
  }

  const user = {
    id: nextUserId,
    fullName,
    username,
    password,
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(user);

  if (!save(DB.users, users)) {
    users.pop();
    return;
  }

  nextUserId++;
  currentUser = user;
  currentRole = "customer";

  $("registerForm").reset();
  enterApp();
  notify("Welcome to Petal & Vine! Your account is ready.");
});

function enterApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("welcomeUser").textContent = "👤 " + currentUser.fullName;

  buildNavigation();
  renderAll();
  goPage("dashboard");
}

function logout() {
  currentUser = null;
  currentRole = null;
  backToChoices();
  notify("You have logged out.");
}

/* NAVIGATION */

const adminPages = [
  ["dashboard", "🏠 Dashboard"],
  ["inventory", "🌸 Inventory"],
  ["orders", "📦 Orders"],
  ["customers", "👥 Customers"],
  ["receipts", "🧾 Receipts"],
  ["settings", "⚙️ Settings"],
  ["reports", "📊 Reports"],
  ["about", "ℹ️ About"]
];

const customerPages = [
  ["dashboard", "🏠 Home"],
  ["shop", "🌷 Shop"],
  ["orders", "📦 My Orders"],
  ["about", "ℹ️ About"]
];

function buildNavigation() {
  const pages = currentRole === "admin" ? adminPages : customerPages;

  $("navigation").innerHTML = pages.map(([page, label]) =>
    `<button class="nav-btn" type="button" data-page="${page}">${label}</button>`
  ).join("");

  $("navigation").querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => goPage(button.dataset.page));
  });

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", currentRole !== "admin");
  });
}

function goPage(page) {
  if (!currentUser) return;

  const allowed = currentRole === "admin"
    ? adminPages.map(item => item[0])
    : customerPages.map(item => item[0]);

  if (!allowed.includes(page)) {
    page = "dashboard";
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  $(page).classList.add("active");

  $("navigation").querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  if (page === "dashboard") renderDashboard();
  if (page === "inventory") renderInventory();
  if (page === "shop") renderShop();
  if (page === "checkout") renderCheckout();
  if (page === "orders") renderOrders();
  if (page === "customers") renderCustomers();
  if (page === "receipts") renderReceipts();
  if (page === "settings") renderAdminSettings();
  if (page === "reports") renderReports();
}

/* PRODUCT DISPLAY */

function productCard(product) {
  const image = validImage(product.image)
    ? `<img class="product-photo" src="${product.image}" alt="${escapeHTML(product.name)}">`
    : `<div class="flower-emoji">${escapeHTML(product.emoji)}</div>`;

  let actions = "";

  if (currentRole === "admin") {
    actions = `
      <button class="btn outline" type="button" data-edit="${product.id}">✏️ Edit</button>
      <button class="btn danger" type="button" data-delete="${product.id}">🗑️ Delete</button>
    `;
  } else if (currentRole === "customer") {
    actions = product.stock > 0
      ? `<button class="btn primary" type="button" data-buy="${product.id}">🛍️ Order Now</button>`
      : `<button class="btn light" disabled>Out of Stock</button>`;
  }

  return `
    <article class="product-card">
      ${image}
      <div class="product-name">${escapeHTML(product.name)}</div>
      <p>${escapeHTML(product.category)}</p>
      <div class="price">${money(product.price)}</div>
      <p class="stock ${product.stock < 1 ? "out" : ""}">
        ${product.stock > 0 ? product.stock + " available" : "Out of stock"}
      </p>
      <div class="actions">${actions}</div>
    </article>
  `;
}

function attachProductActions(container) {
  container.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () =>
      startCheckout(Number(button.dataset.buy))
    );
  });

  container.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () =>
      openProductForm(Number(button.dataset.edit))
    );
  });

  container.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () =>
      deleteProduct(Number(button.dataset.delete))
    );
  });
}

/* DASHBOARD */

function renderDashboard() {
  if (!currentUser) return;

  const completed = orders.filter(order => order.status === "Completed");
  const revenue = completed.reduce((sum, order) =>
    sum + Number(order.total || 0), 0
  );

  $("statProducts").textContent = products.length;
  $("statOrders").textContent = currentRole === "admin"
    ? orders.length
    : orders.filter(order => order.customerId === currentUser.id).length;

  $("statCustomers").textContent = users.length;
  $("statRevenue").textContent = money(revenue);

  $("dashboardMessage").textContent = currentRole === "admin"
    ? "Manage your flowers, customers, inventory, and sales."
    : "Discover beautiful flowers and place your orders today!";

  const featured = products.slice(0, 6);

  $("dashboardProducts").innerHTML = featured.length
    ? featured.map(productCard).join("")
    : '<div class="empty-state">No products available.</div>';

  attachProductActions($("dashboardProducts"));
}

/* INVENTORY */

function renderInventory() {
  if (currentRole !== "admin") return;

  const query = $("inventorySearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("inventoryProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No matching products.</div>';

  attachProductActions($("inventoryProducts"));
}

$("inventorySearch").addEventListener("input", renderInventory);

/* CUSTOMER SHOP */

function renderShop() {
  if (currentRole !== "customer") return;

  const query = $("shopSearch").value.toLowerCase().trim();

  const list = products.filter(product =>
    product.stock > 0 &&
    (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  );

  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No available flowers found.</div>';

  attachProductActions($("shopProducts"));
}

$("shopSearch").addEventListener("input", renderShop);

/* ADD AND EDIT PRODUCTS */

function openProductForm(id = null) {
  if (currentRole !== "admin") return;

  $("productForm").reset();
  $("productId").value = "";
  selectedProductImage = "";
  originalProductImage = "";

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productEmoji").value = product.emoji;
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;

    selectedProductImage = validImage(product.image) ? product.image : "";
    originalProductImage = selectedProductImage;

    $("editorTitle").textContent = "Edit Product";
  } else {
    $("editorTitle").textContent = "Add New Product";
  }

  updateImagePreview();

  $("productEditor").classList.remove("hidden");
  $("productEditor").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeProductForm() {
  $("productEditor").classList.add("hidden");
  $("productForm").reset();
  selectedProductImage = "";
  originalProductImage = "";
  updateImagePreview();
}

function updateImagePreview() {
  if (selectedProductImage && validImage(selectedProductImage)) {
    $("imagePreview").innerHTML =
      `<img src="${selectedProductImage}" alt="Product preview">`;
  } else {
    $("imagePreview").textContent =
      "No picture selected — emoji will be used.";
  }
}

/* IMAGE UPLOAD */

$("productImage").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Please select a picture smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedProductImage = reader.result;
    updateImagePreview();
  };

  reader.onerror = () => {
    alert("Unable to read the selected picture.");
  };

  reader.readAsDataURL(file);
});

$("removeProductImage").addEventListener("click", () => {
  selectedProductImage = "";
  originalProductImage = "";
  $("productImage").value = "";
  updateImagePreview();
});

/* SAVE PRODUCT */

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const id = Number($("productId").value) || null;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const emoji = $("productEmoji").value;
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  const image = selectedProductImage || "";

  if (
    name.length < 2 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    alert("Please enter valid product details.");
    return;
  }

  if (products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  )) {
    alert("A product with this name already exists.");
    return;
  }

  const previous = products.map(product => ({ ...product }));

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    Object.assign(product, {
      name, category, emoji, price, stock, image
    });
  } else {
    products.push({
      id: nextProductId++,
      name, category, emoji, price, stock, image
    });
  }

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  closeProductForm();
  renderAll();
  goPage("inventory");
  notify(id ? "Product updated!" : "Product added!");
});

/* DELETE PRODUCT */

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);
  if (!product) return;

  if (orders.some(order =>
    order.status !== "Cancelled" &&
    order.items.some(item => item.productId === id)
  )) {
    alert("This product is connected to an active order and cannot be deleted.");
    return;
  }

  if (!confirm(`Delete ${product.name}?`)) return;

  const previous = products;
  products = products.filter(item => item.id !== id);

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  renderAll();
  notify("Product deleted.");
}

/* =========================================
   PART 2: CHECKOUT, ORDERS, RECEIPTS,
   ADMIN SETTINGS, CUSTOMERS AND REPORTS
========================================= */

/* CORRECT ADMIN NAVIGATION AND VISIBILITY */

function buildNavigation() {
  const pages = currentRole === "admin" ? adminPages : customerPages;

  $("navigation").innerHTML = pages.map(([page, label]) =>
    `<button class="nav-btn" type="button" data-page="${page}">${label}</button>`
  ).join("");

  $("navigation").querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => goPage(button.dataset.page));
  });

  document.querySelectorAll(".admin-only").forEach(element => {
    if (currentRole !== "admin") {
      element.classList.add("hidden");
    } else if (element.id === "productEditor") {
      element.classList.add("hidden");
    } else {
      element.classList.remove("hidden");
    }
  });
}

/* DIRECT CHECKOUT */

function startCheckout(id) {
  if (currentRole !== "customer") return;

  const product = products.find(item => item.id === id);

  if (!product || product.stock < 1) {
    notify("This product is out of stock.");
    return;
  }

  $("checkoutProductId").value = String(product.id);
  $("checkoutQuantity").value = "1";
  $("checkoutQuantity").max = String(product.stock);

  $("selectedProductSummary").textContent =
    `${product.emoji} ${product.name} — ${money(product.price)} each · ${product.stock} available`;

  $("checkoutName").value = currentUser.fullName || "";

  goPage("checkout");
}

function renderCheckout() {
  if (currentRole !== "customer") return;

  if (!$("checkoutProductId").value) {
    $("selectedProductSummary").textContent =
      "Choose a flower from the Shop to begin your order.";
  }
}

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer" || !currentUser) return;

  const productId = Number($("checkoutProductId").value);
  const quantity = Number($("checkoutQuantity").value);

  const product = products.find(item => item.id === productId);

  if (
    !product ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > product.stock
  ) {
    alert("Please choose a valid quantity within available stock.");
    return;
  }

  const customerName = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (!customerName || !phone || !address) {
    alert("Please complete all delivery information.");
    return;
  }

  const item = {
    productId: product.id,
    name: product.name,
    emoji: product.emoji,
    price: product.price,
    quantity,
    subtotal: product.price * quantity
  };

  const newOrder = {
    id: nextOrderId,
    customerId: currentUser.id,
    customerName,
    phone,
    address,
    payment: $("paymentMethod").value,
    items: [item],
    total: item.subtotal,
    status: "Pending",
    date: new Date().toISOString()
  };

  const oldStock = product.stock;
  product.stock -= quantity;
  orders.unshift(newOrder);

  if (!save(DB.products, products)) {
    product.stock = oldStock;
    orders.shift();
    return;
  }

  if (!save(DB.orders, orders)) {
    product.stock = oldStock;
    orders.shift();
    save(DB.products, products);
    return;
  }

  nextOrderId++;

  $("checkoutForm").reset();
  $("checkoutName").value = currentUser.fullName || "";
  $("checkoutProductId").value = "";
  $("selectedProductSummary").textContent =
    "Choose a flower from the Shop to begin your order.";

  renderAll();
  goPage("orders");

  alert("Order placed successfully! Your order number is PV-" + newOrder.id);
});

/* ORDER MANAGEMENT */

function renderOrders() {
  if (!currentUser) return;

  const list = currentRole === "admin"
    ? orders
    : orders.filter(order => order.customerId === currentUser.id);

  $("ordersTitle").textContent =
    currentRole === "admin" ? "All Customer Orders" : "My Orders";

  if (!list.length) {
    $("ordersList").innerHTML =
      '<div class="empty-state">No orders found.</div>';
    return;
  }

  const adminColumn = currentRole === "admin"
    ? "<th>Update Status</th>"
    : "";

  $("ordersList").innerHTML = `<div class="table-wrap"><table>
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer / Items</th>
        <th>Payment</th>
        <th>Total</th>
        <th>Status</th>
        <th>Receipt</th>
        ${adminColumn}
      </tr>
    </thead>
    <tbody>
      ${list.map(order => {
        const itemText = order.items.map(item =>
          `${escapeHTML(item.name)} × ${item.quantity}`
        ).join("<br>");

        const customerText =
          escapeHTML(order.customerName || "Customer");

        const dateText = order.date
          ? new Date(order.date).toLocaleString("en-PH")
          : "";

        const statusControl = currentRole === "admin"
          ? `<td>
              <select data-order="${order.id}" aria-label="Update order ${order.id}">
                ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
                  `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                ).join("")}
              </select>
            </td>`
          : "";

        return `<tr>
          <td>
            <strong>PV-${order.id}</strong><br>
            <small>${escapeHTML(dateText)}</small>
          </td>
          <td>${customerText}<br><small>${itemText}</small></td>
          <td>${escapeHTML(order.payment || "—")}</td>
          <td>${money(order.total)}</td>
          <td>
            <span class="badge ${escapeHTML(order.status)}">
              ${escapeHTML(order.status)}
            </span>
          </td>
          <td>
            <button class="btn outline receipt-btn" type="button"
              data-receipt="${order.id}">
              🧾 Receipt
            </button>
          </td>
          ${statusControl}
        </tr>`;
      }).join("")}
    </tbody>
  </table></div>`;

  $("ordersList").querySelectorAll("[data-receipt]").forEach(button => {
    button.addEventListener("click", () =>
      printReceipt(Number(button.dataset.receipt))
    );
  });

  $("ordersList").querySelectorAll("[data-order]").forEach(select => {
    select.addEventListener("change", () =>
      updateOrder(Number(select.dataset.order), select.value)
    );
  });
}

/* PRINT RECEIPTS */

function printReceipt(id) {
  const order = orders.find(item => item.id === id);

  if (!order) return;

  if (
    currentRole !== "admin" &&
    order.customerId !== currentUser.id
  ) {
    return;
  }

  const rows = order.items.map(item =>
    `<tr>
      <td>${escapeHTML(item.name)} × ${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>`
  ).join("");

  const receipt = `<div id="printReceipt" class="receipt">
    <h1>🌷 Petal &amp; Vine</h1>
    <p>Flower Shop · Binalonan, Pangasinan</p>
    <hr>

    <h2>OFFICIAL ORDER RECEIPT</h2>

    <p><strong>Receipt No:</strong> PV-${order.id}</p>

    <p><strong>Date:</strong>
      ${escapeHTML(order.date
        ? new Date(order.date).toLocaleString("en-PH")
        : "—")}
    </p>

    <p><strong>Customer:</strong>
      ${escapeHTML(order.customerName || "Customer")}
    </p>

    <p><strong>Contact:</strong>
      ${escapeHTML(order.phone || "—")}
    </p>

    <p><strong>Delivery:</strong>
      ${escapeHTML(order.address || "—")}
    </p>

    <p><strong>Payment:</strong>
      ${escapeHTML(order.payment || "—")}
    </p>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <h2>Total: ${money(order.total)}</h2>

    <p>Status: ${escapeHTML(order.status)}</p>

    <p>Thank you for choosing Petal &amp; Vine! 🌸</p>

    <button onclick="window.print()">Print Receipt</button>
  </div>`;

  const win = window.open("", "_blank", "width=800,height=700");

  if (!win) {
    alert("Please allow pop-ups to print the receipt.");
    return;
  }

  win.document.write(`<!doctype html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt PV-${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 28px;
          color: #333;
        }
        h1, h2 {
          color: #6c5b7b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        td, th {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        button {
          padding: 10px 16px;
          background: #c06c84;
          color: white;
          border: 0;
          border-radius: 6px;
          cursor: pointer;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>${receipt}</body>
    </html>`);

  win.document.close();
  win.focus();
}

/* UPDATE ORDER STATUS AND STOCK */

function updateOrder(id, status) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === id);

  const allowedStatuses = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
  ];

  if (!order || !allowedStatuses.includes(status)) return;

  const oldStatus = order.status;

  if (oldStatus === status) return;

  const previousProducts = products.map(product => ({ ...product }));

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    const canReactivate = order.items.every(item => {
      const product = products.find(p => p.id === item.productId);
      return product && product.stock >= item.quantity;
    });

    if (!canReactivate) {
      alert("Insufficient stock to reactivate this order.");
      renderOrders();
      return;
    }

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      product.stock -= item.quantity;
    });

  } else if (status === "Cancelled" && oldStatus !== "Cancelled") {

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
      }
    });
  }

  order.status = status;

  if (!save(DB.products, products)) {
    products = previousProducts;
    order.status = oldStatus;
    renderAll();
    return;
  }

  if (!save(DB.orders, orders)) {
    products = previousProducts;
    order.status = oldStatus;
    save(DB.products, products);
    renderAll();
    return;
  }

  renderAll();
  notify("Order status updated.");
}

/* RECEIPTS MANAGEMENT */

function renderReceipts() {
  if (currentRole !== "admin") return;

  $("receiptsList").innerHTML = orders.length
    ? `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `<tr>
              <td>PV-${order.id}</td>
              <td>${escapeHTML(order.customerName || "Customer")}</td>
              <td>
                ${escapeHTML(order.date
                  ? new Date(order.date).toLocaleDateString("en-PH")
                  : "—")}
              </td>
              <td>${money(order.total)}</td>
              <td>${escapeHTML(order.status)}</td>
              <td>
                <button class="btn outline" type="button"
                  data-print-receipt="${order.id}">
                  Print Receipt
                </button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`
    : '<div class="empty-state">No receipts yet. Receipts appear after customers place orders.</div>';

  $("receiptsList").querySelectorAll("[data-print-receipt]").forEach(button => {
    button.addEventListener("click", () =>
      printReceipt(Number(button.dataset.printReceipt))
    );
  });
}

/* ADMIN SETTINGS */

function renderAdminSettings() {
  if (currentRole !== "admin") return;

  $("adminDisplayName").value = adminSettings.displayName;
  $("adminUsername").value = adminSettings.username;

  $("currentAdminPassword").value = "";
  $("newAdminPassword").value = "";
  $("confirmAdminPassword").value = "";

  $("adminSettingsMessage").textContent = "";
}

$("adminSettingsForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const displayName = $("adminDisplayName").value.trim();
  const username = $("adminUsername").value.trim();

  const currentPassword = $("currentAdminPassword").value;
  const newPassword = $("newAdminPassword").value;
  const confirmPassword = $("confirmAdminPassword").value;

  const message = $("adminSettingsMessage");
  message.textContent = "";

  if (currentPassword !== adminSettings.password) {
    message.textContent = "Your current password is incorrect.";
    return;
  }

  if (displayName.length < 2 || username.length < 3) {
    message.textContent =
      "Enter a display name and username (at least 3 characters).";
    return;
  }

  if (newPassword && newPassword.length < 6) {
    message.textContent =
      "New password must have at least 6 characters.";
    return;
  }

  if (newPassword !== confirmPassword) {
    message.textContent = "New passwords do not match.";
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    message.textContent =
      "That username is already used by a customer.";
    return;
  }

  const previous = { ...adminSettings };

  adminSettings = {
    username,
    displayName,
    password: newPassword || adminSettings.password
  };

  if (!save(DB.admin, adminSettings)) {
    adminSettings = previous;
    return;
  }

  currentUser.fullName = displayName;
  currentUser.username = username;

  $("welcomeUser").textContent = "👤 " + displayName;

  $("currentAdminPassword").value = "";
  $("newAdminPassword").value = "";
  $("confirmAdminPassword").value = "";

  message.textContent = "Admin settings saved successfully.";

  notify("Administrator details updated.");
});

/* CUSTOMER MANAGEMENT */

function renderCustomers() {
  if (currentRole !== "admin") return;

  const now = Date.now();

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const newUsers = users.filter(user =>
    user.createdAt &&
    now - new Date(user.createdAt).getTime() <= sevenDays &&
    now - new Date(user.createdAt).getTime() >= 0
  ).length;

  const activeUsers = users.filter(user =>
    user.lastLogin &&
    now - new Date(user.lastLogin).getTime() <= thirtyDays &&
    now - new Date(user.lastLogin).getTime() >= 0
  ).length;

  $("userTotal").textContent = users.length;
  $("userNew").textContent = newUsers;
  $("userActive").textContent = activeUsers;

  $("customersList").innerHTML = users.length
    ? `<div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Username</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Account</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `<tr>
              <td>${escapeHTML(user.fullName)}</td>
              <td>${escapeHTML(user.username)}</td>
              <td>
                ${user.createdAt
                  ? escapeHTML(new Date(user.createdAt).toLocaleDateString("en-PH"))
                  : "Legacy account"}
              </td>
              <td>
                ${user.lastLogin
                  ? escapeHTML(new Date(user.lastLogin).toLocaleString("en-PH"))
                  : "Never logged in"}
              </td>
              <td>${user.active === false ? "Disabled" : "Active"}</td>
              <td>
                <button class="btn ${user.active === false ? "success" : "light"}"
                  type="button" data-toggle-user="${user.id}">
                  ${user.active === false ? "Enable" : "Disable"}
                </button>

                <button class="btn danger" type="button"
                  data-delete-user="${user.id}">
                  Delete
                </button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>`
    : '<div class="empty-state">No registered customers yet.</div>';

  $("customersList").querySelectorAll("[data-toggle-user]").forEach(button => {
    button.addEventListener("click", () =>
      toggleUser(Number(button.dataset.toggleUser))
    );
  });

  $("customersList").querySelectorAll("[data-delete-user]").forEach(button => {
    button.addEventListener("click", () =>
      deleteUser(Number(button.dataset.deleteUser))
    );
  });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);
  if (!user) return;

  const previous = user.active;
  user.active = user.active === false;

  if (!save(DB.users, users)) {
    user.active = previous;
    return;
  }

  renderCustomers();

  notify(user.active
    ? "User account enabled."
    : "User account disabled."
  );
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);
  if (!user) return;

  if (!confirm(`Delete customer account ${user.username}?`)) return;

  const previous = users;
  users = users.filter(item => item.id !== id);

  if (!save(DB.users, users)) {
    users = previous;
    return;
  }

  renderCustomers();
  renderDashboard();

  notify("Customer account deleted.");
}

/* SALES REPORTS */

function renderReports() {
  if (currentRole !== "admin") return;

  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  const revenue = completed.reduce((sum, order) =>
    sum + Number(order.total || 0), 0
  );

  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;

  $("reportPending").textContent = orders.filter(order =>
    order.status === "Pending" ||
    order.status === "Processing"
  ).length;
}

/* REFRESH ALL SECTIONS */

function renderAll() {
  if (!currentUser) return;

  renderDashboard();

  if (currentRole === "admin") {
    renderInventory();
    renderOrders();
    renderCustomers();
    renderReports();
    renderReceipts();
  } else {
    renderShop();
    renderOrders();
  }
}

/* NOTIFICATIONS */

function notify(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/* EXPOSE HTML BUTTON FUNCTIONS */

window.showAuth = showAuth;
window.backToChoices = backToChoices;
window.togglePassword = togglePassword;
window.logout = logout;
window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;
window.goPage = goPage;

/* START WEBSITE */

backToChoices();

console.log("Petal & Vine successfully initialized!");
console.log("Products loaded:", products.length);
