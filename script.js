
"use strict";

/* PETAL & VINE - FLOWER SHOP MANAGEMENT SYSTEM
   No shopping cart. Direct ordering and user management.
*/

const $ = id => document.getElementById(id);

const DB = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders"
};

const ADMIN = {
  username: "admin",
  password: "Admin123"
};

function read(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
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
    alert("Unable to save data. Your browser storage may be full.");
    console.error(error);
    return false;
  }
}

let users = read(DB.users, []);
let products = read(DB.products, []);
let orders = read(DB.orders, []);
let currentUser = null;
let currentRole = "";
let selectedAuth = "customer";
let selectedProduct = null;

/* INITIAL SAMPLE PRODUCTS */

if (products.length === 0) {
  products = [
    {
      id: 1,
      name: "Classic Red Roses",
      category: "Roses",
      emoji: "🌹",
      price: 450,
      stock: 20
    },
    {
      id: 2,
      name: "Golden Sunflowers",
      category: "Sunflowers",
      emoji: "🌻",
      price: 350,
      stock: 15
    },
    {
      id: 3,
      name: "Pink Tulip Bouquet",
      category: "Tulips",
      emoji: "🌷",
      price: 550,
      stock: 12
    },
    {
      id: 4,
      name: "Mixed Flower Bouquet",
      category: "Bouquets",
      emoji: "💐",
      price: 750,
      stock: 10
    }
  ];

  save(DB.products, products);
}

/* BASIC HELPERS */

function money(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(window.pvToastTimer);
  window.pvToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/* AUTHENTICATION */

function showAuth(type) {
  selectedAuth = type;

  $("authChoices").classList.add("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  $("loginError").textContent = "";
  $("registerError").textContent = "";

  if (type === "register") {
    $("registerForm").classList.remove("hidden");
  } else {
    $("loginForm").classList.remove("hidden");
    $("loginTitle").textContent =
      type === "admin" ? "👑 Admin Login" : "👤 Customer Login";
  }
}

function backToChoices() {
  $("authChoices").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  $("loginForm").reset();
  $("registerForm").reset();

  $("loginError").textContent = "";
  $("registerError").textContent = "";
}

$("adminChoice").addEventListener("click", () => showAuth("admin"));
$("customerChoice").addEventListener("click", () => showAuth("customer"));
$("registerChoice").addEventListener("click", () => showAuth("register"));
$("loginBack").addEventListener("click", backToChoices);
$("registerBack").addEventListener("click", backToChoices);

/* REGISTER CUSTOMER */

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const fullName = $("regName").value.trim();
  const username = $("regUsername").value.trim();
  const password = $("regPassword").value;
  const confirm = $("regConfirm").value;

  $("registerError").textContent = "";

  if (fullName.length < 2) {
    $("registerError").textContent = "Enter your full name.";
    return;
  }

  if (username.length < 3) {
    $("registerError").textContent = "Username must have at least 3 characters.";
    return;
  }

  if (password.length < 6) {
    $("registerError").textContent = "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerError").textContent = "Passwords do not match.";
    return;
  }

  const exists = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (username.toLowerCase() === ADMIN.username ||
      exists) {
    $("registerError").textContent = "Username already exists.";
    return;
  }

  const newUser = {
    id: makeId(),
    fullName,
    username,
    password,
    role: "customer",
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };

  users.push(newUser);

  if (!save(DB.users, users)) {
    users.pop();
    return;
  }

  alert("Account created successfully! You can now log in.");

  $("registerForm").reset();
  showAuth("customer");
});

/* LOGIN */

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;

  $("loginError").textContent = "";

  if (selectedAuth === "admin") {
    if (
      username === ADMIN.username &&
      password === ADMIN.password
    ) {
      currentUser = {
        id: "admin",
        fullName: "Administrator",
        username: "admin"
      };

      currentRole = "admin";
      enterApp();
    } else {
      $("loginError").textContent =
        "Incorrect admin username or password.";
    }

    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    $("loginError").textContent =
      "Incorrect username or password.";
    return;
  }

  if (user.active === false) {
    $("loginError").textContent =
      "Your account has been disabled. Contact the administrator.";
    return;
  }

  user.lastLogin = new Date().toISOString();
  save(DB.users, users);

  currentUser = user;
  currentRole = "customer";

  enterApp();
});

/* ENTER APP */

function enterApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("welcomeUser").textContent =
    "Welcome, " + currentUser.fullName;

  buildNavigation();
  renderAll();
  goPage("dashboard");
}

function logout() {
  currentUser = null;
  currentRole = "";
  selectedProduct = null;

  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");

  backToChoices();
}

$("logoutBtn").addEventListener("click", logout);

/* NAVIGATION */

const adminPages = [
  ["dashboard", "🏠 Dashboard"],
  ["inventory", "🌸 Inventory"],
  ["orders", "📦 Orders"],
  ["customers", "👥 User Management"],
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
  const pages = currentRole === "admin"
    ? adminPages
    : customerPages;

  $("navigation").innerHTML = pages.map(([id, label]) =>
    `<button type="button" data-page="${id}">${label}</button>`
  ).join("");

  $("navigation").querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      goPage(button.dataset.page);
    });
  });

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", currentRole !== "admin");
  });
}

function goPage(page) {
  if (currentRole === "customer" &&
      ["inventory", "customers", "reports"].includes(page)) {
    page = "dashboard";
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  const target = $(page);
  if (!target) return;

  target.classList.add("active");

  document.querySelectorAll("#navigation button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  if (page === "shop") renderShop();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderOrders();
  if (page === "customers") renderCustomers();
  if (page === "reports") renderReports();
}

/* DASHBOARD */

function renderDashboard() {
  $("statProducts").textContent = products.length;
  $("statOrders").textContent = currentRole === "admin"
    ? orders.length
    : orders.filter(order => order.customerId === currentUser.id).length;

  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total || 0), 0
  );

  if (currentRole === "admin") {
    $("statCustomers").textContent = users.length;
    $("statRevenue").textContent = money(revenue);
  }

  const featured = products.slice(0, 4);

  $("dashboardProducts").innerHTML = featured.length
    ? featured.map(product => productCard(product, false)).join("")
    : '<div class="empty-state">No flowers available.</div>';

  attachBuyActions($("dashboardProducts"));
}

/* PRODUCT CARDS */

function productCard(product, adminMode) {
  return `
    <div class="product-card">
      <div class="product-emoji">${escapeHTML(product.emoji)}</div>
      <h3>${escapeHTML(product.name)}</h3>
      <p>${escapeHTML(product.category)}</p>
      <p class="price">${money(product.price)}</p>
      <p class="stock">Stock: ${product.stock}</p>

      ${!adminMode ? `
        <button class="btn primary"
          type="button"
          data-buy="${product.id}"
          ${product.stock < 1 ? "disabled" : ""}>
          ${product.stock < 1 ? "Out of Stock" : "Buy Now"}
        </button>
      ` : `
        <button class="btn light" data-edit="${product.id}" type="button">Edit</button>
        <button class="btn danger" data-delete-product="${product.id}" type="button">Delete</button>
      `}
    </div>
  `;
}

function attachBuyActions(container) {
  container.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => {
      buyProduct(Number(button.dataset.buy));
    });
  });
}

/* SHOP */

$("shopSearch").addEventListener("input", renderShop);

function renderShop() {
  const query = $("shopSearch").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("shopProducts").innerHTML = filtered.length
    ? filtered.map(product => productCard(product, false)).join("")
    : '<div class="empty-state">No matching flowers found.</div>';

  attachBuyActions($("shopProducts"));
}

/* BUY NOW */

function buyProduct(id) {
  if (currentRole !== "customer") {
    alert("Please log in as a customer to order.");
    return;
  }

  const product = products.find(item => item.id === id);

  if (!product || product.stock < 1) {
    alert("This product is currently unavailable.");
    return;
  }

  selectedProduct = product;

  $("checkoutProductId").value = product.id;
  $("checkoutQuantity").value = 1;
  $("checkoutQuantity").max = product.stock;

  $("selectedProductSummary").textContent =
    `${product.emoji} ${product.name} — ${money(product.price)} each`;

  $("checkoutName").value = currentUser.fullName || "";

  goPage("checkout");
}

$("backShop").addEventListener("click", () => goPage("shop"));

/* CHECKOUT AND ORDERS */

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const productId = Number($("checkoutProductId").value);
  const product = products.find(item => item.id === productId);
  const quantity = Number($("checkoutQuantity").value);

  if (!product) {
    alert("Please select a valid product.");
    return;
  }

  if (!Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > product.stock) {
    alert("Please enter a valid quantity within available stock.");
    return;
  }

  const customerName = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (!customerName || !phone || !address) {
    alert("Please complete all delivery information.");
    return;
  }

  const oldStock = product.stock;
  product.stock -= quantity;

  const order = {
    id: makeId(),
    customerId: currentUser.id,
    customerName,
    phone,
    address,
    payment: $("paymentMethod").value,
    items: [{
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      subtotal: Number(product.price) * quantity
    }],
    total: Number(product.price) * quantity,
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.push(order);

  if (!save(DB.products, products) ||
      !save(DB.orders, orders)) {
    product.stock = oldStock;
    orders = orders.filter(item => item.id !== order.id);
    save(DB.products, products);
    save(DB.orders, orders);
    return;
  }

  $("checkoutForm").reset();
  $("checkoutProductId").value = "";
  selectedProduct = null;

  alert("Order placed successfully! Order number: PV-" + order.id);

  renderAll();
  goPage("orders");
});

function renderOrders() {
  const list = currentRole === "admin"
    ? orders
    : orders.filter(order => order.customerId === currentUser.id);

  if (!list.length) {
    $("ordersList").innerHTML =
      '<div class="empty-state">No orders found.</div>';
    return;
  }

  $("ordersList").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer / Items</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Status</th>
            ${currentRole === "admin" ? "<th>Update Status</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>PV-${order.id}<br>
                <small>${new Date(order.date).toLocaleDateString()}</small>
              </td>
              <td>
                ${escapeHTML(order.customerName)}
                <br>
                ${order.items.map(item =>
                  `${escapeHTML(item.name)} × ${item.quantity}`
                ).join("<br>")}
              </td>
              <td>${escapeHTML(order.payment)}</td>
              <td>${money(order.total)}</td>
              <td>${escapeHTML(order.status)}</td>
              ${currentRole === "admin" ? `
                <td>
                  <select data-status="${order.id}">
                    ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
                      `<option ${order.status === status ? "selected" : ""}>${status}</option>`
                    ).join("")}
                  </select>
                </td>
              ` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  $("ordersList").querySelectorAll("[data-status]").forEach(select => {
    select.addEventListener("change", () => {
      updateOrder(Number(select.dataset.status), select.value);
    });
  });
}

/* ORDER STATUS */

function updateOrder(id, status) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === id);
  if (!order) return;

  const oldStatus = order.status;
  if (oldStatus === status) return;

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    const available = order.items.every(item => {
      const product = products.find(p => p.id === item.productId);
      return product && product.stock >= item.quantity;
    });

    if (!available) {
      alert("Not enough stock to reactivate this order.");
      renderOrders();
      return;
    }

    order.items.forEach(item => {
      products.find(p => p.id === item.productId).stock -= item.quantity;
    });
  }

  if (status === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = status;

  if (!save(DB.products, products) ||
      !save(DB.orders, orders)) {
    order.status = oldStatus;
    renderAll();
    return;
  }

  renderAll();
  notify("Order status updated.");
}

/* INVENTORY */

$("addProductBtn").addEventListener("click", openProductForm);
$("cancelProduct").addEventListener("click", closeProductForm);
$("inventorySearch").addEventListener("input", renderInventory);

function openProductForm() {
  if (currentRole !== "admin") return;

  $("productForm").reset();
  $("productId").value = "";
  $("productFormTitle").textContent = "Add Product";
  $("productForm").classList.remove("hidden");
}

function closeProductForm() {
  $("productForm").classList.add("hidden");
  $("productForm").reset();
}

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const id = Number($("productId").value);
  const name = $("productName").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (!name || !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0) {
    alert("Please enter valid product information.");
    return;
  }

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    Object.assign(product, {
      name,
      category: $("productCategory").value,
      emoji: $("productEmoji").value,
      price,
      stock
    });
  } else {
    products.push({
      id: makeId(),
      name,
      category: $("productCategory").value,
      emoji: $("productEmoji").value,
      price,
      stock
    });
  }

  if (!save(DB.products, products)) return;

  closeProductForm();
  renderAll();
  notify("Product saved successfully.");
});

function renderInventory() {
  if (currentRole !== "admin") return;

  const query = $("inventorySearch").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );

  $("inventoryProducts").innerHTML = filtered.length
    ? filtered.map(product => productCard(product, true)).join("")
    : '<div class="empty-state">No products found.</div>';

  $("inventoryProducts").querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      editProduct(Number(button.dataset.edit));
    });
  });

  $("inventoryProducts").querySelectorAll("[data-delete-product]").forEach(button => {
    button.addEventListener("click", () => {
      deleteProduct(Number(button.dataset.deleteProduct));
    });
  });
}

function editProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);
  if (!product) return;

  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productEmoji").value = product.emoji;
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productFormTitle").textContent = "Edit Product";

  $("productForm").classList.remove("hidden");
  $("productForm").scrollIntoView({ behavior: "smooth" });
}

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!confirm(`Delete ${product.name}?`)) return;

  products = products.filter(item => item.id !== id);

  if (!save(DB.products, products)) return;

  renderAll();
  notify("Product deleted.");
}

/* USER MANAGEMENT */

function renderCustomers() {
  if (currentRole !== "admin") return;

  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const month = 30 * 24 * 60 * 60 * 1000;

  $("userTotal").textContent = users.length;

  $("userNew").textContent = users.filter(user =>
    user.createdAt &&
    now - new Date(user.createdAt).getTime() <= week
  ).length;

  $("userActive").textContent = users.filter(user =>
    user.lastLogin &&
    now - new Date(user.lastLogin).getTime() <= month
  ).length;

  if (!users.length) {
    $("customersList").innerHTML =
      '<div class="empty-state">No registered customers yet.</div>';
    return;
  }

  $("customersList").innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Username</th>
            <th>Joined</th>
            <th>Last Login</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td>${escapeHTML(user.fullName)}</td>
              <td>${escapeHTML(user.username)}</td>
              <td>${user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}</td>
              <td>${user.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : "Never"}</td>
              <td>${user.active === false ? "Disabled" : "Active"}</td>
              <td>
                <button class="btn light"
                  data-toggle-user="${user.id}" type="button">
                  ${user.active === false ? "Enable" : "Disable"}
                </button>
                <button class="btn danger"
                  data-delete-user="${user.id}" type="button">
                  Delete
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  $("customersList").querySelectorAll("[data-toggle-user]").forEach(button => {
    button.addEventListener("click", () => {
      toggleUser(Number(button.dataset.toggleUser));
    });
  });

  $("customersList").querySelectorAll("[data-delete-user]").forEach(button => {
    button.addEventListener("click", () => {
      deleteUser(Number(button.dataset.deleteUser));
    });
  });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);
  if (!user) return;

  user.active = user.active === false;

  if (!save(DB.users, users)) return;

  renderCustomers();
  notify(user.active ? "Account enabled." : "Account disabled.");
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);
  if (!user) return;

  if (!confirm(`Delete customer ${user.username}?`)) return;

  const previous = users;
  users = users.filter(item => item.id !== id);

  if (!save(DB.users, users)) {
    users = previous;
    return;
  }

  renderCustomers();
  renderDashboard();
  notify("Customer deleted.");
}

/* SALES REPORTS */

function renderReports() {
  if (currentRole !== "admin") return;

  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total || 0), 0
  );

  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;

  $("reportPending").textContent = orders.filter(order =>
    order.status === "Pending" ||
    order.status === "Processing"
  ).length;
}

/* REFRESH ALL DATA */

function renderAll() {
  renderDashboard();

  if (currentRole === "admin") {
    renderInventory();
    renderOrders();
    renderCustomers();
    renderReports();
  } else {
    renderShop();
    renderOrders();
  }
}

/* STARTUP CHECK */

function initialize() {
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];

  backToChoices();
}

initialize();
