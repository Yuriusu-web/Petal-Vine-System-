
"use strict";

/* =========================================
   PETAL & VINE - COMPLETE SCRIPT.JS
   Default admin:
   Username: admin
   Password: Admin123
========================================= */

const $ = id => document.getElementById(id);

const KEYS = {
  products: "pv_products_v4",
  users: "pv_users_v4",
  orders: "pv_orders_v4",
  admin: "pv_admin_v4"
};

const money = amount =>
  Number(amount || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  });

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Unable to save data:", error);
    notify("Storage is full. Try using smaller product images.");
    return false;
  }
}

const defaultProducts = [
  { id: 1, name: "Classic Red Roses", category: "Roses", emoji: "🌹", price: 850, stock: 20, description: "A beautiful bouquet of classic red roses.", image: "" },
  { id: 2, name: "Pink Tulip Bouquet", category: "Tulips", emoji: "🌷", price: 950, stock: 15, description: "Elegant pink tulips for someone special.", image: "" },
  { id: 3, name: "Sunflower Happiness", category: "Sunflowers", emoji: "🌻", price: 750, stock: 18, description: "Bright sunflowers to make someone's day.", image: "" },
  { id: 4, name: "White Lily Bouquet", category: "Lilies", emoji: "💐", price: 1100, stock: 12, description: "Fresh and elegant white lilies.", image: "" },
  { id: 5, name: "Purple Dream", category: "Mixed", emoji: "💜", price: 1250, stock: 10, description: "A dreamy purple flower arrangement.", image: "" },
  { id: 6, name: "Pink Rose Romance", category: "Roses", emoji: "🌸", price: 900, stock: 16, description: "Soft pink roses for a romantic gift.", image: "" },
  { id: 7, name: "White Daisy Charm", category: "Daisies", emoji: "🌼", price: 650, stock: 25, description: "Simple and charming white daisies.", image: "" },
  { id: 8, name: "Golden Sunflowers", category: "Sunflowers", emoji: "🌻", price: 1000, stock: 14, description: "A cheerful golden sunflower bouquet.", image: "" },
  { id: 9, name: "Pastel Garden", category: "Mixed", emoji: "💐", price: 1450, stock: 8, description: "A lovely mixture of pastel flowers.", image: "" },
  { id: 10, name: "Red Tulip Love", category: "Tulips", emoji: "🌷", price: 1050, stock: 13, description: "Beautiful red tulips for a loved one.", image: "" },
  { id: 11, name: "Baby's Breath", category: "Mixed", emoji: "🤍", price: 550, stock: 30, description: "Delicate baby's breath flowers.", image: "" },
  { id: 12, name: "Luxury Rose Box", category: "Roses", emoji: "🌹", price: 1800, stock: 7, description: "Premium roses arranged in a gift box.", image: "" },
  { id: 13, name: "Spring Blossom", category: "Mixed", emoji: "🌺", price: 1350, stock: 11, description: "A colorful spring-inspired arrangement.", image: "" },
  { id: 14, name: "Elegant Orchid", category: "Orchids", emoji: "🪷", price: 1600, stock: 9, description: "An elegant orchid arrangement.", image: "" },
  { id: 15, name: "Sweetheart Bouquet", category: "Mixed", emoji: "💗", price: 1500, stock: 10, description: "A lovely bouquet made for special moments.", image: "" }
];

let products = readData(KEYS.products, null);
let users = readData(KEYS.users, []);
let orders = readData(KEYS.orders, []);
let admin = readData(KEYS.admin, {
  displayName: "Administrator",
  username: "admin",
  password: "Admin123"
});

if (!Array.isArray(products)) products = defaultProducts;
if (!Array.isArray(users)) users = [];
if (!Array.isArray(orders)) orders = [];

if (!localStorage.getItem(KEYS.products)) {
  saveData(KEYS.products, products);
}

let currentUser = null;
let currentRole = null;
let selectedImage = "";
let activeReceipt = null;

function persist() {
  saveData(KEYS.products, products);
  saveData(KEYS.users, users);
  saveData(KEYS.orders, orders);
  saveData(KEYS.admin, admin);
}

function notify(message) {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function nextId(items) {
  return items.length
    ? Math.max(...items.map(item => Number(item.id) || 0)) + 1
    : 1;
}

/* =========================================
   AUTHENTICATION
========================================= */

function showAuth(type) {
  if ($("authChoices")) $("authChoices").classList.add("hidden");
  if ($("loginForm")) $("loginForm").classList.toggle("hidden", type !== "login");
  if ($("registerForm")) $("registerForm").classList.toggle("hidden", type !== "register");

  clearAuthErrors();
}

function backToChoices() {
  if ($("authChoices")) $("authChoices").classList.remove("hidden");
  if ($("loginForm")) $("loginForm").classList.add("hidden");
  if ($("registerForm")) $("registerForm").classList.add("hidden");

  clearAuthErrors();
}

function clearAuthErrors() {
  ["loginError", "registerError"].forEach(id => {
    if ($(id)) $(id).textContent = "";
  });
}

function togglePassword(id, button) {
  const field = $(id);
  if (!field) return;

  field.type = field.type === "password" ? "text" : "password";

  if (button) {
    button.textContent = field.type === "password" ? "Show" : "Hide";
  }
}

function login(event) {
  event.preventDefault();

  const username = ($("loginUsername")?.value || "").trim();
  const password = $("loginPassword")?.value || "";
  const error = $("loginError");

  if (error) error.textContent = "";

  if (username.toLowerCase() === admin.username.toLowerCase() &&
      password === admin.password) {
    currentUser = {
      username: admin.username,
      name: admin.displayName
    };
    currentRole = "admin";
    enterApp();
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    if (error) error.textContent = "Incorrect username or password.";
    return;
  }

  if (user.active === false) {
    if (error) error.textContent = "Your account has been disabled. Contact the administrator.";
    return;
  }

  user.lastLogin = new Date().toISOString();
  currentUser = user;
  currentRole = "customer";
  persist();
  enterApp();
}

function register(event) {
  event.preventDefault();

  const name = ($("regFullName")?.value || "").trim();
  const username = ($("regUsername")?.value || "").trim();
  const password = $("regPassword")?.value || "";
  const confirm = $("regConfirm")?.value || "";
  const error = $("registerError");

  if (error) error.textContent = "";

  if (!name || !username || !password) {
    if (error) error.textContent = "Please complete all fields.";
    return;
  }

  if (username.length < 3) {
    if (error) error.textContent = "Username must have at least 3 characters.";
    return;
  }

  if (password.length < 6) {
    if (error) error.textContent = "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    if (error) error.textContent = "Passwords do not match.";
    return;
  }

  if (username.toLowerCase() === admin.username.toLowerCase() ||
      users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    if (error) error.textContent = "That username is already taken.";
    return;
  }

  const user = {
    id: nextId(users),
    name,
    username,
    password,
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(user);
  persist();

  currentUser = user;
  currentRole = "customer";
  enterApp();
  notify("Your account has been created!");
}

function logout() {
  currentUser = null;
  currentRole = null;

  if ($("app")) $("app").classList.add("hidden");
  if ($("authScreen")) $("authScreen").classList.remove("hidden");

  backToChoices();

  if ($("loginForm")) $("loginForm").reset();
  if ($("registerForm")) $("registerForm").reset();
}

/* =========================================
   APP AND NAVIGATION
========================================= */

const adminPages = [
  ["dashboard", "Dashboard"],
  ["inventory", "Inventory"],
  ["shop", "Shop"],
  ["orders", "Orders"],
  ["customers", "Customers"],
  ["receipts", "Receipts"],
  ["settings", "Settings"],
  ["reports", "Reports"],
  ["about", "About"]
];

const customerPages = [
  ["dashboard", "Dashboard"],
  ["shop", "Shop"],
  ["orders", "My Orders"],
  ["about", "About"]
];

function buildNavigation() {
  const nav = $("navigation");
  if (!nav) return;

  const pages = currentRole === "admin" ? adminPages : customerPages;

  nav.innerHTML = pages.map(([id, label]) => `
    <button type="button"
      class="nav-btn ${id === "dashboard" ? "active" : ""}"
      data-page="${id}"
      onclick="goPage('${id}')">
      ${escapeHTML(label)}
    </button>
  `).join("");

  document.querySelectorAll(".admin-only").forEach(element => {
    if (element.id === "productEditor") {
      element.classList.add("hidden");
    } else {
      element.classList.toggle("hidden", currentRole !== "admin");
    }
  });
}

function enterApp() {
  if ($("authScreen")) $("authScreen").classList.add("hidden");
  if ($("app")) $("app").classList.remove("hidden");

  if ($("welcomeUser")) {
    $("welcomeUser").textContent =
      currentRole === "admin"
        ? admin.displayName
        : currentUser.name;
  }

  buildNavigation();
  renderAll();
  goPage("dashboard");
}

function goPage(page) {
  if (!currentUser) return;

  const allowed = currentRole === "admin"
    ? adminPages.map(item => item[0])
    : customerPages.map(item => item[0]).concat(["checkout"]);

  if (!allowed.includes(page)) page = "dashboard";

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  if ($(page)) $(page).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(button => {
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

/* =========================================
   PRODUCT DISPLAY
========================================= */

function productVisual(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }

  return `<span>${escapeHTML(product.emoji || "💐")}</span>`;
}

function productCard(product, mode = "shop") {
  const isAdmin = currentRole === "admin";

  return `
    <article class="product-card">
      <div class="product-visual">
        ${productVisual(product)}
      </div>

      <div class="product-info">
        <small>${escapeHTML(product.category)}</small>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "")}</p>
        <strong>${money(product.price)}</strong>
        <p>Stock: ${product.stock}</p>

        <div class="product-actions">
          ${
            isAdmin
              ? `
                <button type="button" onclick="openProductForm(${product.id})">Edit</button>
                <button type="button" onclick="deleteProduct(${product.id})">Delete</button>
              `
              : `
                <button type="button"
                  onclick="startCheckout(${product.id})"
                  ${product.stock <= 0 ? "disabled" : ""}>
                  ${product.stock <= 0 ? "Out of stock" : "Buy Now"}
                </button>
              `
          }
        </div>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalCustomers = users.length;

  const completedRevenue = orders
    .filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  if ($("statProducts")) $("statProducts").textContent = totalProducts;
  if ($("statOrders")) $("statOrders").textContent = totalOrders;
  if ($("statCustomers")) $("statCustomers").textContent = totalCustomers;
  if ($("statRevenue")) $("statRevenue").textContent = money(completedRevenue);

  const dashboardProducts = $("dashboardProducts");
  if (dashboardProducts) {
    dashboardProducts.innerHTML = products.slice(0, 6)
      .map(product => productCard(product, "dashboard"))
      .join("") || "<p>No products available.</p>";
  }
}

function renderInventory() {
  const container = $("inventoryProducts");
  if (!container) return;

  const search = ($("inventorySearch")?.value || "").toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  container.innerHTML = filtered.map(product =>
    productCard(product, "inventory")
  ).join("") || "<p>No products found.</p>";
}

function renderShop() {
  const container = $("shopProducts");
  if (!container) return;

  const search = ($("shopSearch")?.value || "").toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  container.innerHTML = filtered.map(product =>
    productCard(product, "shop")
  ).join("") || "<p>No products found.</p>";
}

/* =========================================
   PRODUCT EDITOR
========================================= */

function openProductForm(id = null) {
  if (currentRole !== "admin") return;

  const form = $("productForm");
  const editor = $("productEditor");

  if (!form || !editor) return;

  form.reset();
  selectedImage = "";

  if ($("productId")) $("productId").value = "";

  const product = products.find(item => item.id === Number(id));

  if (product) {
    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productEmoji").value = product.emoji || "💐";
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;

    if ($("productDescription")) {
      $("productDescription").value = product.description || "";
    }

    selectedImage = product.image || "";
    updateImagePreview();
  } else {
    updateImagePreview();
  }

  editor.classList.remove("hidden");
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeProductForm() {
  if ($("productEditor")) $("productEditor").classList.add("hidden");
  if ($("productForm")) $("productForm").reset();

  selectedImage = "";
  updateImagePreview();
}

function updateImagePreview() {
  const preview = $("imagePreview");
  if (!preview) return;

  if (selectedImage) {
    preview.innerHTML = `<img src="${selectedImage}" alt="Product preview">`;
  } else {
    preview.textContent = $("productEmoji")?.value || "💐";
  }
}

function saveProduct(event) {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const id = Number($("productId")?.value || 0);
  const name = ($("productName")?.value || "").trim();
  const category = ($("productCategory")?.value || "").trim();
  const emoji = ($("productEmoji")?.value || "💐").trim();
  const price = Number($("productPrice")?.value);
  const stock = Number($("productStock")?.value);
  const description = ($("productDescription")?.value || "").trim();

  if (!name || !category || !Number.isFinite(price) ||
      !Number.isInteger(stock) || price <= 0 || stock < 0) {
    notify("Please enter valid product information.");
    return;
  }

  const duplicate = products.find(product =>
    product.name.toLowerCase() === name.toLowerCase() &&
    product.id !== id
  );

  if (duplicate) {
    notify("A product with that name already exists.");
    return;
  }

  const existing = products.find(product => product.id === id);

  const product = {
    id: existing ? existing.id : nextId(products),
    name,
    category,
    emoji,
    price,
    stock,
    description,
    image: selectedImage || ""
  };

  if (existing) {
    product.image = selectedImage || existing.image || "";
    products = products.map(item => item.id === id ? product : item);
    notify("Product updated successfully!");
  } else {
    products.push(product);
    notify("Product added successfully!");
  }

  if (!saveData(KEYS.products, products)) return;

  closeProductForm();
  renderAll();
  goPage("inventory");
}

function deleteProduct(id) {
  if (currentRole !== "admin") return;

  const product = products.find(item => item.id === Number(id));
  if (!product) return;

  const hasOrders = orders.some(order =>
    order.productId === product.id && order.status !== "Cancelled"
  );

  if (hasOrders) {
    notify("This product has existing orders and cannot be deleted.");
    return;
  }

  if (!confirm(`Delete "${product.name}"?`)) return;

  products = products.filter(item => item.id !== product.id);
  persist();
  renderAll();
  notify("Product deleted.");
}

/* =========================================
   IMAGE UPLOAD
========================================= */

function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("Please select an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    notify("Please choose an image smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedImage = reader.result;
    updateImagePreview();
  };

  reader.onerror = () => notify("Could not read the image.");

  reader.readAsDataURL(file);
}

function removeProductImage() {
  selectedImage = "";

  if ($("productImage")) $("productImage").value = "";

  updateImagePreview();
}

/* =========================================
   CHECKOUT
========================================= */

function startCheckout(id) {
  if (currentRole !== "customer") {
    notify("Please log in as a customer to order.");
    return;
  }

  const product = products.find(item => item.id === Number(id));

  if (!product || product.stock <= 0) {
    notify("This product is currently unavailable.");
    return;
  }

  if ($("checkoutProductId")) $("checkoutProductId").value = product.id;
  if ($("checkoutQuantity")) {
    $("checkoutQuantity").value = 1;
    $("checkoutQuantity").max = product.stock;
  }

  if ($("checkoutName")) $("checkoutName").value = currentUser.name;
  if ($("checkoutPhone")) $("checkoutPhone").value = "";
  if ($("checkoutAddress")) $("checkoutAddress").value = "";

  renderCheckout();
  goPage("checkout");
}

function renderCheckout() {
  const id = Number($("checkoutProductId")?.value);
  const product = products.find(item => item.id === id);
  const summary = $("selectedProductSummary");

  if (!summary) return;

  if (!product) {
    summary.innerHTML = "<p>Please select a product first.</p>";
    return;
  }

  summary.innerHTML = `
    <div class="product-visual">${productVisual(product)}</div>
    <h3>${escapeHTML(product.name)}</h3>
    <p>${money(product.price)} each</p>
    <p>Available stock: ${product.stock}</p>
  `;
}

function submitCheckout(event) {
  event.preventDefault();

  if (currentRole !== "customer") return;

  const productId = Number($("checkoutProductId")?.value);
  const product = products.find(item => item.id === productId);
  const quantity = Number($("checkoutQuantity")?.value);
  const name = ($("checkoutName")?.value || "").trim();
  const phone = ($("checkoutPhone")?.value || "").trim();
  const address = ($("checkoutAddress")?.value || "").trim();
  const payment = $("paymentMethod")?.value || "Cash on Delivery";

  if (!product) {
    notify("Please select a valid product.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 ||
      quantity > product.stock) {
    notify("Please enter a valid quantity.");
    return;
  }

  if (!name || !phone || !address) {
    notify("Please complete your delivery details.");
    return;
  }

  product.stock -= quantity;

  const order = {
    id: nextId(orders),
    productId: product.id,
    productName: product.name,
    productEmoji: product.emoji,
    productImage: product.image || "",
    quantity,
    price: product.price,
    total: product.price * quantity,
    customerName: name,
    username: currentUser.username,
    phone,
    address,
    payment,
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.push(order);
  persist();

  if ($("checkoutForm")) $("checkoutForm").reset();

  notify("Your order has been placed!");
  renderAll();
  goPage("orders");
}

function cancelOrder(id) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === Number(id));

  if (!order || order.status === "Cancelled") return;

  if (!confirm("Cancel this order?")) return;

  const product = products.find(item => item.id === order.productId);

  if (product) product.stock += order.quantity;

  order.status = "Cancelled";
  persist();
  renderAll();
  notify("Order cancelled.");
}

function updateOrderStatus(id, status) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === Number(id));
  if (!order) return;

  const allowed = ["Pending", "Processing", "Completed", "Cancelled"];

  if (!allowed.includes(status)) return;

  if (order.status === "Cancelled" && status !== "Cancelled") {
    const product = products.find(item => item.id === order.productId);

    if (!product || product.stock < order.quantity) {
      notify("Not enough stock to reactivate this order.");
      renderOrders();
      return;
    }

    product.stock -= order.quantity;
  }

  if (order.status !== "Cancelled" && status === "Cancelled") {
    const product = products.find(item => item.id === order.productId);
    if (product) product.stock += order.quantity;
  }

  order.status = status;
  persist();
  renderAll();
  notify("Order status updated.");
}

/* =========================================
   ORDERS
========================================= */

function renderOrders() {
  const container = $("ordersList");
  if (!container) return;

  let visibleOrders = orders;

  if (currentRole === "customer") {
    visibleOrders = orders.filter(order =>
      order.username === currentUser.username
    );
  }

  visibleOrders = [...visibleOrders].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  if ($("ordersTitle")) {
    $("ordersTitle").textContent =
      currentRole === "admin" ? "All Orders" : "My Orders";
  }

  container.innerHTML = visibleOrders.map(order => `
    <article class="panel order-card">
      <h3>${escapeHTML(order.productName)}</h3>
      <p>Order #${order.id}</p>
      <p>Customer: ${escapeHTML(order.customerName)}</p>
      <p>Quantity: ${order.quantity}</p>
      <p>Total: <strong>${money(order.total)}</strong></p>
      <p>Payment: ${escapeHTML(order.payment)}</p>
      <p>Phone: ${escapeHTML(order.phone)}</p>
      <p>Address: ${escapeHTML(order.address)}</p>
      <p>Date: ${new Date(order.date).toLocaleString()}</p>
      <p>Status: <strong>${escapeHTML(order.status)}</strong></p>

      ${
        currentRole === "admin"
          ? `
            <label>Update status</label>
            <select onchange="updateOrderStatus(${order.id}, this.value)">
              ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
                `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
              ).join("")}
            </select>
            <button type="button" onclick="cancelOrder(${order.id})">Cancel Order</button>
          `
          : ""
      }

      <button type="button" onclick="printReceipt(${order.id})">
        View / Print Receipt
      </button>
    </article>
  `).join("") || "<p>No orders yet.</p>";
}

/* =========================================
   RECEIPTS
========================================= */

function renderReceipts() {
  const container = $("receiptsList");
  if (!container) return;

  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  container.innerHTML = completed.map(order => `
    <article class="receipt-list-card">
      <h3>Receipt #${order.id}</h3>
      <p>${escapeHTML(order.customerName)}</p>
      <p>${escapeHTML(order.productName)} × ${order.quantity}</p>
      <p>${money(order.total)}</p>
      <button type="button" onclick="printReceipt(${order.id})">
        Print Receipt
      </button>
    </article>
  `).join("") || "<p>No completed receipts yet.</p>";
}

function printReceipt(id) {
  const order = orders.find(item => item.id === Number(id));
  if (!order) return;

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Petal & Vine Receipt #${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 420px;
          margin: 30px auto;
          padding: 20px;
          color: #333;
        }
        h1, .center { text-align: center; }
        hr { border: 0; border-top: 1px dashed #999; }
        .line {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin: 12px 0;
        }
        button {
          width: 100%;
          padding: 12px;
          background: #7b3f5b;
          color: white;
          border: 0;
          cursor: pointer;
        }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h1>🌸 Petal & Vine</h1>
      <p class="center">Flower Shop Receipt</p>
      <hr>
      <p>Receipt #: ${order.id}</p>
      <p>Date: ${new Date(order.date).toLocaleString()}</p>
      <p>Customer: ${escapeHTML(order.customerName)}</p>
      <p>Phone: ${escapeHTML(order.phone)}</p>
      <p>Address: ${escapeHTML(order.address)}</p>
      <hr>
      <div class="line">
        <span>${escapeHTML(order.productName)} × ${order.quantity}</span>
        <span>${money(order.total)}</span>
      </div>
      <p>Payment: ${escapeHTML(order.payment)}</p>
      <p>Status: ${escapeHTML(order.status)}</p>
      <hr>
      <h2 class="line">
        <span>Total</span>
        <span>${money(order.total)}</span>
      </h2>
      <p class="center">Thank you for shopping with us!</p>
      <button onclick="window.print()">Print Receipt</button>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    notify("Please allow pop-ups to print receipts.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
}

/* =========================================
   CUSTOMER MANAGEMENT
========================================= */

function renderCustomers() {
  const container = $("customersList");
  if (!container) return;

  if ($("userTotal")) $("userTotal").textContent = users.length;
  if ($("userNew")) {
    const today = new Date().toDateString();
    $("userNew").textContent = users.filter(user =>
      new Date(user.createdAt).toDateString() === today
    ).length;
  }
  if ($("userActive")) {
    $("userActive").textContent = users.filter(user =>
      user.active !== false
    ).length;
  }

  container.innerHTML = users.map(user => `
    <article class="panel customer-card">
      <h3>${escapeHTML(user.name)}</h3>
      <p>Username: ${escapeHTML(user.username)}</p>
      <p>Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
      <p>Status: ${user.active === false ? "Disabled" : "Active"}</p>

      <button type="button" onclick="toggleCustomer(${user.id})">
        ${user.active === false ? "Enable Account" : "Disable Account"}
      </button>

      <button type="button" onclick="deleteCustomer(${user.id})">
        Delete Customer
      </button>
    </article>
  `).join("") || "<p>No registered customers yet.</p>";
}

function toggleCustomer(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === Number(id));
  if (!user) return;

  user.active = user.active === false;
  persist();
  renderCustomers();
  notify(user.active ? "Customer account enabled." : "Customer account disabled.");
}

function deleteCustomer(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === Number(id));
  if (!user) return;

  if (!confirm(`Delete customer "${user.name}"?`)) return;

  users = users.filter(item => item.id !== user.id);
  persist();
  renderCustomers();
  renderDashboard();
  notify("Customer deleted.");
}

/* =========================================
   ADMIN SETTINGS
========================================= */

function renderAdminSettings() {
  if (currentRole !== "admin") return;

  if ($("adminDisplayName")) {
    $("adminDisplayName").value = admin.displayName;
  }

  if ($("adminUsername")) {
    $("adminUsername").value = admin.username;
  }

  if ($("currentAdminPassword")) $("currentAdminPassword").value = "";
  if ($("newAdminPassword")) $("newAdminPassword").value = "";
  if ($("confirmAdminPassword")) $("confirmAdminPassword").value = "";
  if ($("adminSettingsMessage")) $("adminSettingsMessage").textContent = "";
}

function saveAdminSettings(event) {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const displayName = ($("adminDisplayName")?.value || "").trim();
  const username = ($("adminUsername")?.value || "").trim();
  const currentPassword = $("currentAdminPassword")?.value || "";
  const newPassword = $("newAdminPassword")?.value || "";
  const confirmPassword = $("confirmAdminPassword")?.value || "";
  const message = $("adminSettingsMessage");

  const showMessage = text => {
    if (message) message.textContent = text;
    else notify(text);
  };

  if (!displayName || !username) {
    showMessage("Please enter an admin name and username.");
    return;
  }

  if (currentPassword !== admin.password) {
    showMessage("Your current password is incorrect.");
    return;
  }

  if (newPassword && newPassword.length < 6) {
    showMessage("New password must have at least 6 characters.");
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    showMessage("New passwords do not match.");
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    showMessage("That username is already used by a customer.");
    return;
  }

  admin.displayName = displayName;
  admin.username = username;

  if (newPassword) admin.password = newPassword;

  currentUser.username = admin.username;
  currentUser.name = admin.displayName;

  persist();

  if ($("welcomeUser")) {
    $("welcomeUser").textContent = admin.displayName;
  }

  showMessage("Admin settings saved successfully.");
  notify("Admin settings updated.");
  renderAdminSettings();
}

/* =========================================
   REPORTS
========================================= */

function renderReports() {
  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  const pending = orders.filter(order =>
    order.status === "Pending" || order.status === "Processing"
  );

  const revenue = completed.reduce((sum, order) =>
    sum + Number(order.total || 0), 0
  );

  if ($("reportRevenue")) $("reportRevenue").textContent = money(revenue);
  if ($("reportCompleted")) $("reportCompleted").textContent = completed.length;
  if ($("reportPending")) $("reportPending").textContent = pending.length;
}

/* =========================================
   RENDER EVERYTHING
========================================= */

function renderAll() {
  renderDashboard();
  renderInventory();
  renderShop();
  renderOrders();
  renderCustomers();
  renderReceipts();
  renderReports();
}

/* =========================================
   EVENT LISTENERS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  if ($("loginForm")) {
    $("loginForm").addEventListener("submit", login);
  }

  if ($("registerForm")) {
    $("registerForm").addEventListener("submit", register);
  }

  if ($("productForm")) {
    $("productForm").addEventListener("submit", saveProduct);
  }

  if ($("checkoutForm")) {
    $("checkoutForm").addEventListener("submit", submitCheckout);
  }

  if ($("adminSettingsForm")) {
    $("adminSettingsForm").addEventListener("submit", saveAdminSettings);
  }

  if ($("inventorySearch")) {
    $("inventorySearch").addEventListener("input", renderInventory);
  }

  if ($("shopSearch")) {
    $("shopSearch").addEventListener("input", renderShop);
  }

  if ($("productImage")) {
    $("productImage").addEventListener("change", handleImageUpload);
  }

  if ($("removeProductImage")) {
    $("removeProductImage").addEventListener("click", removeProductImage);
  }

  if ($("productEmoji")) {
    $("productEmoji").addEventListener("input", () => {
      if (!selectedImage) updateImagePreview();
    });
  }

  if ($("checkoutQuantity")) {
    $("checkoutQuantity").addEventListener("input", renderCheckout);
  }

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      goPage(button.dataset.page);
    });
  });

  backToChoices();
  updateImagePreview();

  console.log("Petal & Vine script loaded successfully.");
});

/* =========================================
   GLOBAL FUNCTIONS FOR HTML BUTTONS
========================================= */

window.showAuth = showAuth;
window.backToChoices = backToChoices;
window.togglePassword = togglePassword;
window.logout = logout;
window.goPage = goPage;

window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;
window.deleteProduct = deleteProduct;
window.removeProductImage = removeProductImage;

window.startCheckout = startCheckout;
window.cancelOrder = cancelOrder;
window.updateOrderStatus = updateOrderStatus;
window.printReceipt = printReceipt;

window.toggleCustomer = toggleCustomer;
window.deleteCustomer = deleteCustomer;
