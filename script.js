
"use strict";

const KEYS = {
  products: "pv_products_v5",
  users: "pv_users_v5",
  orders: "pv_orders_v5",
  admin: "pv_admin_v5"
};

const DEFAULT_ADMIN = {
  displayName: "Administrator",
  username: "admin",
  password: "Admin123"
};

const DEFAULT_PRODUCTS = [
  {id:1,name:"Classic Red Roses",category:"Roses",emoji:"🌹",description:"A beautiful bouquet of classic red roses.",price:1200,stock:20},
  {id:2,name:"Pink Tulip Bouquet",category:"Tulips",emoji:"🌷",description:"Lovely pink tulips for someone special.",price:950,stock:15},
  {id:3,name:"Sunflower Happiness",category:"Sunflowers",emoji:"🌻",description:"Bright sunflowers to bring happiness.",price:850,stock:18},
  {id:4,name:"White Lily Bouquet",category:"Bouquet",emoji:"💐",description:"Elegant white lilies for special occasions.",price:1400,stock:12},
  {id:5,name:"Purple Dream",category:"Bouquet",emoji:"🪻",description:"A dreamy purple flower arrangement.",price:1100,stock:10},
  {id:6,name:"Pink Rose Romance",category:"Roses",emoji:"🌹",description:"Sweet pink roses arranged with care.",price:1350,stock:16},
  {id:7,name:"White Daisy Charm",category:"Other",emoji:"🌼",description:"Simple and charming white daisies.",price:700,stock:25},
  {id:8,name:"Golden Sunflowers",category:"Sunflowers",emoji:"🌻",description:"A cheerful bunch of golden sunflowers.",price:1000,stock:14},
  {id:9,name:"Pastel Garden",category:"Bouquet",emoji:"💐",description:"A soft pastel mix of seasonal flowers.",price:1600,stock:9},
  {id:10,name:"Red Tulip Love",category:"Tulips",emoji:"🌷",description:"Romantic red tulips for your loved one.",price:1050,stock:13},
  {id:11,name:"Baby's Breath",category:"Other",emoji:"🌸",description:"Delicate baby's breath flowers.",price:650,stock:22},
  {id:12,name:"Luxury Rose Box",category:"Roses",emoji:"🌹",description:"Premium roses in an elegant gift box.",price:2200,stock:8},
  {id:13,name:"Spring Blossom",category:"Bouquet",emoji:"🌺",description:"A colorful arrangement inspired by spring.",price:1250,stock:11},
  {id:14,name:"Elegant Orchid",category:"Other",emoji:"🌸",description:"A graceful orchid arrangement.",price:1800,stock:7},
  {id:15,name:"Sweetheart Bouquet",category:"Bouquet",emoji:"💐",description:"A romantic bouquet made with love.",price:1500,stock:10}
];

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(fallback));
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

let products = loadData(KEYS.products, DEFAULT_PRODUCTS);
let users = loadData(KEYS.users, []);
let orders = loadData(KEYS.orders, []);
let admin = loadData(KEYS.admin, DEFAULT_ADMIN);

let currentUser = null;
let selectedImage = "";
let imageChanged = false;
let toastTimer = null;

function saveData() {
  try {
    localStorage.setItem(KEYS.products, JSON.stringify(products));
    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
    localStorage.setItem(KEYS.admin, JSON.stringify(admin));
    return true;
  } catch (error) {
    console.error(error);
    notify("Storage is full. Try using smaller product pictures.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function notify(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2800);
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function getCustomerOrders() {
  return orders.filter(order => order.username === currentUser.username);
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

/* PASSWORD EYE BUTTON */

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const showing = input.type === "password";
  input.type = showing ? "text" : "password";
  button.textContent = showing ? "🙈" : "👁️";
  button.setAttribute("aria-label", showing ? "Hide password" : "Show password");
}

/* AUTHENTICATION */

function showAuthChoices() {
  document.getElementById("authChoices").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");
}

function showLogin() {
  showAuthChoices();
  document.getElementById("authChoices").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

function showRegister() {
  showAuthChoices();
  document.getElementById("authChoices").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

function login(username, password) {
  if (
    username.toLowerCase() === admin.username.toLowerCase() &&
    password === admin.password
  ) {
    currentUser = {
      username: admin.username,
      name: admin.displayName,
      role: "admin"
    };
    openApplication();
    return true;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) return false;
  if (user.disabled) return "disabled";

  user.lastLogin = new Date().toISOString();
  saveData();

  currentUser = {
    username: user.username,
    name: user.name,
    role: "customer"
  };

  openApplication();
  return true;
}

function openApplication() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("welcomeUser").textContent = `Welcome, ${currentUser.name}!`;
  buildNavigation();
  renderAll();
  showPage("dashboard");
}

function logout() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();
  document.getElementById("loginError").textContent = "";
  document.getElementById("registerError").textContent = "";
  showAuthChoices();
}

/* NAVIGATION */

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
  ["dashboard", "Home"],
  ["shop", "Shop"],
  ["orders", "My Orders"],
  ["about", "About"]
];

function buildNavigation() {
  const navigation = document.getElementById("navigation");
  const pages = isAdmin() ? adminPages : customerPages;

  navigation.innerHTML = pages.map(([id, label]) =>
    `<button class="nav-btn" data-page="${id}" onclick="showPage('${id}')">${label}</button>`
  ).join("");

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", !isAdmin());
  });
}

function showPage(pageId) {
  const pages = isAdmin() ? adminPages : customerPages;

  if (!pages.some(page => page[0] === pageId)) {
    pageId = "dashboard";
  }

  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  if (pageId === "inventory") renderInventory();
  if (pageId === "shop") renderShop();
  if (pageId === "orders") renderOrders();
  if (pageId === "customers") renderCustomers();
  if (pageId === "receipts") renderReceipts();
  if (pageId === "settings") renderAdminSettings();
  if (pageId === "reports") renderReports();
}

/* PRODUCT DISPLAY */

function productVisual(product) {
  if (product.image) {
    return `<img class="product-photo" src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }
  return `<div class="product-visual">${escapeHTML(product.emoji || "💐")}</div>`;
}

/* DASHBOARD */

function renderDashboard() {
  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statOrders").textContent =
    isAdmin() ? orders.length : getCustomerOrders().length;
  document.getElementById("statCustomers").textContent = users.length;

  const completed = isAdmin()
    ? orders.filter(order => order.status === "Completed")
    : getCustomerOrders().filter(order => order.status === "Completed");

  const revenue = completed.reduce((sum, order) => sum + Number(order.total), 0);
  document.getElementById("statRevenue").textContent = money(revenue);

  document.getElementById("dashboardMessage").textContent = isAdmin()
    ? "Manage your flowers, customers, and orders."
    : "Discover beautiful flowers for every occasion.";

  document.getElementById("dashboardProducts").innerHTML = products.length
    ? products.slice(0, 6).map(product => `
      <article class="product-card">
        ${productVisual(product)}
        <div class="product-name">${escapeHTML(product.name)}</div>
        <div class="price">${money(product.price)}</div>
        <p class="stock">${product.stock > 0 ? product.stock + " available" : "Out of stock"}</p>
        <button class="btn primary" onclick="buyProduct(${product.id})" ${product.stock <= 0 ? "disabled" : ""}>Order Now</button>
      </article>
    `).join("")
    : `<div class="empty-state">No products available.</div>`;
}

/* INVENTORY */

function openProductEditor(id = null) {
  if (!isAdmin()) return;

  document.getElementById("productForm").reset();
  selectedImage = "";
  imageChanged = false;
  document.getElementById("productId").value = "";
  document.getElementById("editorTitle").textContent = "Add Product";
  document.getElementById("imagePreview").textContent = "No picture selected";
  document.getElementById("productEditor").classList.remove("hidden");

  if (id !== null) {
    const product = products.find(item => item.id === Number(id));
    if (!product) return;

    document.getElementById("editorTitle").textContent = "Edit Product";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productEmoji").value = product.emoji;
    document.getElementById("productDescription").value = product.description || "";
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;

    selectedImage = product.image || "";
    updateImagePreview();
  }

  document.getElementById("productEditor").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeProductEditor() {
  document.getElementById("productEditor").classList.add("hidden");
  document.getElementById("productForm").reset();
  selectedImage = "";
  imageChanged = false;
  document.getElementById("imagePreview").textContent = "No picture selected";
}

function updateImagePreview() {
  const preview = document.getElementById("imagePreview");
  preview.innerHTML = selectedImage
    ? `<img src="${selectedImage}" alt="Product preview">`
    : "No picture selected";
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("Please select a valid image.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    notify("Image must be smaller than 2MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedImage = reader.result;
    imageChanged = true;
    updateImagePreview();
  };

  reader.onerror = () => notify("Could not read the selected image.");
  reader.readAsDataURL(file);
}

function removeProductImage() {
  selectedImage = "";
  imageChanged = true;
  document.getElementById("productImage").value = "";
  updateImagePreview();
}

function saveProduct(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const id = Number(document.getElementById("productId").value);
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const emoji = document.getElementById("productEmoji").value;
  const description = document.getElementById("productDescription").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    notify("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== id && product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    notify("A product with this name already exists.");
    return;
  }

  const existing = products.find(product => product.id === id);

  const product = {
    id: existing ? existing.id : makeId(),
    name,
    category,
    emoji,
    description,
    price,
    stock,
    image: imageChanged ? selectedImage : (existing ? existing.image || "" : "")
  };

  if (existing) {
    products = products.map(item => item.id === id ? product : item);
  } else {
    products.push(product);
  }

  if (!saveData()) return;

  closeProductEditor();
  renderAll();
  notify(existing ? "Product updated!" : "Product added!");
}

function editProduct(id) {
  openProductEditor(id);
}

function deleteProduct(id) {
  if (!isAdmin()) return;

  const product = products.find(item => item.id === Number(id));
  if (!product || !confirm(`Delete "${product.name}"?`)) return;

  products = products.filter(item => item.id !== Number(id));
  saveData();
  renderAll();
  notify("Product deleted.");
}

function renderInventory() {
  const container = document.getElementById("inventoryProducts");
  const search = document.getElementById("inventorySearch").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  container.innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card">
        ${productVisual(product)}
        <div class="product-name">${escapeHTML(product.name)}</div>
        <p>${escapeHTML(product.category)}</p>
        <p>${escapeHTML(product.description || "")}</p>
        <div class="price">${money(product.price)}</div>
        <p class="stock ${product.stock <= 0 ? "out" : ""}">Stock: ${product.stock}</p>
        <div class="product-actions">
          <button class="btn primary" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn danger" onclick="deleteProduct(${product.id})">Delete</button>
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">No matching products found.</div>`;
}

/* SHOP AND CHECKOUT */

function renderShop() {
  const container = document.getElementById("shopProducts");
  const search = document.getElementById("shopSearch").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  container.innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card">
        ${productVisual(product)}
        <div class="product-name">${escapeHTML(product.name)}</div>
        <p>${escapeHTML(product.description || "")}</p>
        <div class="price">${money(product.price)}</div>
        <p class="stock ${product.stock <= 0 ? "out" : ""}">
          ${product.stock > 0 ? product.stock + " available" : "Out of stock"}
        </p>
        <button class="btn primary" onclick="buyProduct(${product.id})" ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>
      </article>
    `).join("")
    : `<div class="empty-state">No flowers found.</div>`;
}

function buyProduct(id) {
  const product = products.find(item => item.id === Number(id));

  if (!product || product.stock <= 0) {
    notify("This product is unavailable.");
    return;
  }

  if (!currentUser) return;

  if (isAdmin()) {
    notify("Log in as a customer to place an order.");
    return;
  }

  document.getElementById("checkoutProductId").value = product.id;
  document.getElementById("checkoutQuantity").value = 1;
  document.getElementById("checkoutQuantity").max = product.stock;
  document.getElementById("checkoutName").value = currentUser.name;
  document.getElementById("selectedProductSummary").innerHTML = `
    <h3>${escapeHTML(product.name)}</h3>
    <p>${money(product.price)} each</p>
    <p>Available stock: ${product.stock}</p>
  `;

  showPage("checkout");
}

function placeOrder(event) {
  event.preventDefault();
  if (!currentUser || isAdmin()) return;

  const productId = Number(document.getElementById("checkoutProductId").value);
  const quantity = Number(document.getElementById("checkoutQuantity").value);
  const name = document.getElementById("checkoutName").value.trim();
  const phone = document.getElementById("checkoutPhone").value.trim();
  const address = document.getElementById("checkoutAddress").value.trim();
  const payment = document.getElementById("paymentMethod").value;

  const product = products.find(item => item.id === productId);

  if (!product || !Number.isInteger(quantity) || quantity < 1 ||
      quantity > product.stock || !name || !phone || !address) {
    notify("Please check your order details and available stock.");
    return;
  }

  const order = {
    id: makeId(),
    username: currentUser.username,
    customerName: name,
    phone,
    address,
    productId: product.id,
    productName: product.name,
    quantity,
    price: product.price,
    total: product.price * quantity,
    payment,
    status: "Pending",
    date: new Date().toISOString()
  };

  product.stock -= quantity;
  orders.unshift(order);

  if (!saveData()) {
    product.stock += quantity;
    orders.shift();
    return;
  }

  document.getElementById("checkoutForm").reset();
  document.getElementById("checkoutProductId").value = "";
  document.getElementById("selectedProductSummary").textContent =
    "Your order has been placed successfully.";

  renderAll();
  notify("Order placed successfully!");
  showPage("orders");
}

/* ORDERS */

function renderOrders() {
  const container = document.getElementById("ordersList");
  const visibleOrders = isAdmin() ? orders : getCustomerOrders();

  document.getElementById("ordersTitle").textContent =
    isAdmin() ? "All Customer Orders" : "My Orders";

  container.innerHTML = visibleOrders.length
    ? visibleOrders.map(order => `
      <article class="order-card">
        <h3>Order #${order.id}</h3>
        <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
        <p><strong>Product:</strong> ${escapeHTML(order.productName)}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Total:</strong> ${money(order.total)}</p>
        <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
        <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
        <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
        <p><strong>Date:</strong> ${formatDate(order.date)}</p>
        <p><strong>Status:</strong> <span class="badge ${escapeHTML(order.status)}">${escapeHTML(order.status)}</span></p>
        <div class="order-actions">
          <button class="btn light" onclick="printReceipt(${order.id})">Print Receipt</button>
          ${isAdmin() ? `
            <button class="btn secondary" onclick="updateOrderStatus(${order.id}, 'Processing')">Processing</button>
            <button class="btn success" onclick="updateOrderStatus(${order.id}, 'Completed')">Complete</button>
            <button class="btn danger" onclick="cancelOrder(${order.id})">Cancel</button>
          ` : ""}
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">No orders yet.</div>`;
}

function updateOrderStatus(id, status) {
  if (!isAdmin()) return;

  const order = orders.find(item => item.id === Number(id));
  if (!order || order.status === "Cancelled") return;

  if (order.status === "Completed" && status !== "Completed") {
    notify("Completed orders cannot be changed.");
    return;
  }

  order.status = status;
  saveData();
  renderAll();
  notify("Order status updated.");
}

function cancelOrder(id) {
  if (!isAdmin()) return;

  const order = orders.find(item => item.id === Number(id));
  if (!order || order.status === "Cancelled") return;

  if (order.status === "Completed") {
    notify("Completed orders cannot be cancelled.");
    return;
  }

  if (!confirm("Cancel this order? Product stock will be returned.")) return;

  order.status = "Cancelled";
  const product = products.find(item => item.id === order.productId);
  if (product) product.stock += Number(order.quantity);

  saveData();
  renderAll();
  notify("Order cancelled.");
}

/* CUSTOMERS */

function renderCustomers() {
  if (!isAdmin()) return;

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  document.getElementById("userTotal").textContent = users.length;

  document.getElementById("userNew").textContent =
    users.filter(user => now - new Date(user.createdAt).getTime() <= sevenDays).length;

  document.getElementById("userActive").textContent =
    users.filter(user => user.lastLogin &&
      now - new Date(user.lastLogin).getTime() <= thirtyDays).length;

  const container = document.getElementById("customersList");

  container.innerHTML = users.length
    ? users.map(user => `
      <article class="customer-card">
        <h3>${escapeHTML(user.name)}</h3>
        <p><strong>Username:</strong> ${escapeHTML(user.username)}</p>
        <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
        <p><strong>Last Login:</strong> ${user.lastLogin ? formatDate(user.lastLogin) : "Never"}</p>
        <p><strong>Account:</strong> ${user.disabled ? "Disabled" : "Active"}</p>
        <p><strong>Orders:</strong> ${orders.filter(order => order.username === user.username).length}</p>
        <div class="actions">
          <button class="btn primary" onclick="editCustomer('${encodeURIComponent(user.username)}')">Edit</button>
          <button class="btn secondary" onclick="toggleCustomer('${encodeURIComponent(user.username)}')">${user.disabled ? "Enable" : "Disable"}</button>
          <button class="btn danger" onclick="deleteCustomer('${encodeURIComponent(user.username)}')">Delete</button>
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">No registered customers yet.</div>`;
}

function editCustomer(encodedUsername) {
  if (!isAdmin()) return;

  const username = decodeURIComponent(encodedUsername);
  const user = users.find(item => item.username === username);
  if (!user) return;

  const name = prompt("Enter customer's new full name:", user.name);
  if (name === null) return;

  const newUsername = prompt("Enter customer's new username:", user.username);
  if (newUsername === null) return;

  const cleanName = name.trim();
  const cleanUsername = newUsername.trim();

  if (!cleanName || !cleanUsername) {
    notify("Name and username cannot be empty.");
    return;
  }

  const duplicate = users.some(item =>
    item.username.toLowerCase() === cleanUsername.toLowerCase() &&
    item.username !== username
  );

  if (duplicate || cleanUsername.toLowerCase() === admin.username.toLowerCase()) {
    notify("That username is already taken.");
    return;
  }

  user.name = cleanName;
  user.username = cleanUsername;

  orders.forEach(order => {
    if (order.username === username) {
      order.username = cleanUsername;
      order.customerName = cleanName;
    }
  });

  saveData();
  renderAll();
  notify("Customer updated.");
}

function toggleCustomer(encodedUsername) {
  if (!isAdmin()) return;

  const username = decodeURIComponent(encodedUsername);
  const user = users.find(item => item.username === username);
  if (!user) return;

  user.disabled = !user.disabled;
  saveData();
  renderCustomers();
  notify(user.disabled ? "Customer disabled." : "Customer enabled.");
}

function deleteCustomer(encodedUsername) {
  if (!isAdmin()) return;

  const username = decodeURIComponent(encodedUsername);
  if (!confirm("Delete this customer account? Their order history will remain.")) return;

  users = users.filter(user => user.username !== username);
  saveData();
  renderAll();
  notify("Customer account deleted.");
}

/* RECEIPTS */

function renderReceipts() {
  if (!isAdmin()) return;

  const container = document.getElementById("receiptsList");

  container.innerHTML = orders.length
    ? orders.map(order => `
      <article class="receipt-list-card">
        <h3>Receipt #${order.id}</h3>
        <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
        <p><strong>Product:</strong> ${escapeHTML(order.productName)}</p>
        <p><strong>Total:</strong> ${money(order.total)}</p>
        <p><strong>Status:</strong> ${escapeHTML(order.status)}</p>
        <p><strong>Date:</strong> ${formatDate(order.date)}</p>
        <button class="btn primary receipt-btn" onclick="printReceipt(${order.id})">Print Receipt</button>
      </article>
    `).join("")
    : `<div class="empty-state">No receipts available yet.</div>`;
}

function printReceipt(id) {
  const order = orders.find(item => item.id === Number(id));
  if (!order) return;

  const receipt = document.getElementById("printReceipt");

  receipt.innerHTML = `
    <div style="max-width:650px;margin:auto;font-family:Arial,sans-serif;">
      <div style="text-align:center;margin-bottom:25px;">
        <h1 style="color:#c06c84;">🌷 Petal & Vine</h1>
        <p>Flower Shop Receipt</p>
        <p>Thank you for your order!</p>
      </div>
      <hr>
      <h2 style="margin:18px 0;">Receipt #${order.id}</h2>
      <p><strong>Date:</strong> ${escapeHTML(formatDate(order.date))}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Phone:</strong> ${escapeHTML(order.phone)}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <hr style="margin:18px 0;">
      <h3>Order Details</h3>
      <p><strong>Product:</strong> ${escapeHTML(order.productName)}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Unit Price:</strong> ${money(order.price)}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
      <p><strong>Status:</strong> ${escapeHTML(order.status)}</p>
      <hr style="margin:18px 0;">
      <h2 style="text-align:right;">TOTAL: ${money(order.total)}</h2>
      <p style="text-align:center;margin-top:35px;">Thank you for choosing Petal & Vine! 🌸</p>
    </div>
  `;

  window.print();
}

/* ADMIN SETTINGS */

function renderAdminSettings() {
  if (!isAdmin()) return;

  document.getElementById("settingsAdminName").textContent = admin.displayName;
  document.getElementById("settingsAdminUsername").textContent = admin.username;
  document.getElementById("adminDisplayName").value = admin.displayName;
  document.getElementById("adminUsername").value = admin.username;

  ["currentAdminPassword", "newAdminPassword", "confirmAdminPassword"].forEach(id => {
    document.getElementById(id).value = "";
    document.getElementById(id).type = "password";
  });

  document.getElementById("adminSettingsMessage").textContent = "";
}

function saveAdminSettings(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const displayName = document.getElementById("adminDisplayName").value.trim();
  const username = document.getElementById("adminUsername").value.trim();
  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("newAdminPassword").value;
  const confirmPassword = document.getElementById("confirmAdminPassword").value;
  const message = document.getElementById("adminSettingsMessage");

  message.textContent = "";

  if (!displayName || !username) {
    message.textContent = "Please enter an admin name and username.";
    return;
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    message.textContent = "That username is already used by a customer.";
    return;
  }

  let updatedPassword = admin.password;

  if (currentPassword || newPassword || confirmPassword) {
    if (currentPassword !== admin.password) {
      message.textContent = "Your current password is incorrect.";
      return;
    }

    if (newPassword.length < 4) {
      message.textContent = "Your new password must be at least 4 characters.";
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent = "New passwords do not match.";
      return;
    }

    updatedPassword = newPassword;
  }

  admin = { displayName, username, password: updatedPassword };
  currentUser.name = displayName;
  currentUser.username = username;

  if (!saveData()) return;

  document.getElementById("welcomeUser").textContent = `Welcome, ${displayName}!`;
  document.getElementById("settingsAdminName").textContent = displayName;
  document.getElementById("settingsAdminUsername").textContent = username;

  ["currentAdminPassword", "newAdminPassword", "confirmAdminPassword"].forEach(id => {
    document.getElementById(id).value = "";
    document.getElementById(id).type = "password";
  });

  message.textContent = "Admin settings saved successfully!";
  notify("Admin settings updated.");
}

function resetAdminSettings() {
  if (!isAdmin()) return;

  if (!confirm("Restore the default admin account? This will reset the admin name, username, and password.")) {
    return;
  }

  admin = { ...DEFAULT_ADMIN };
  currentUser.name = admin.displayName;
  currentUser.username = admin.username;

  saveData();

  document.getElementById("welcomeUser").textContent =
    `Welcome, ${admin.displayName}!`;

  renderAdminSettings();
  notify("Default admin account restored.");
}

/* REPORTS */

function renderReports() {
  if (!isAdmin()) return;

  const completed = orders.filter(order => order.status === "Completed");
  const pending = orders.filter(order =>
    order.status === "Pending" || order.status === "Processing"
  );

  const revenue = completed.reduce((sum, order) => sum + Number(order.total), 0);

  document.getElementById("reportRevenue").textContent = money(revenue);
  document.getElementById("reportCompleted").textContent = completed.length;
  document.getElementById("reportPending").textContent = pending.length;
}

/* RENDER ALL */

function renderAll() {
  renderDashboard();
  renderInventory();
  renderShop();

  if (isAdmin()) {
    renderOrders();
    renderCustomers();
    renderReceipts();
    renderReports();
  } else if (currentUser) {
    renderOrders();
  }
}

/* STARTUP AND EVENTS */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  document.getElementById("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const result = login(username, password);

    if (result === false) {
      document.getElementById("loginError").textContent =
        "Incorrect username or password.";
    } else if (result === "disabled") {
      document.getElementById("loginError").textContent =
        "Your account has been disabled. Contact the administrator.";
    }
  });

  document.getElementById("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("regFullName").value.trim();
    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirm").value;
    const error = document.getElementById("registerError");

    error.textContent = "";

    if (!name || !username || password.length < 4) {
      error.textContent = "Complete all fields. Password must have at least 4 characters.";
      return;
    }

    if (password !== confirmPassword) {
      error.textContent = "Passwords do not match.";
      return;
    }

    const duplicate = users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    );

    if (duplicate || username.toLowerCase() === admin.username.toLowerCase()) {
      error.textContent = "That username is already taken.";
      return;
    }

    users.push({
      name,
      username,
      password,
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLogin: null
    });

    if (!saveData()) {
      users.pop();
      error.textContent = "Could not save account. Browser storage may be full.";
      return;
    }

    document.getElementById("registerForm").reset();
    document.getElementById("loginUsername").value = username;
    notify("Account created! Please log in.");
    showLogin();
  });

  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("productImage").addEventListener("change", handleImageUpload);
  document.getElementById("removeProductImage").addEventListener("click", removeProductImage);
  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
  document.getElementById("adminSettingsForm").addEventListener("submit", saveAdminSettings);

  saveData();
  showAuthChoices();
});

/* GLOBAL BUTTON FUNCTIONS */

window.showAuthChoices = showAuthChoices;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.logout = logout;
window.showPage = showPage;
window.togglePassword = togglePassword;
window.openProductEditor = openProductEditor;
window.closeProductEditor = closeProductEditor;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.renderInventory = renderInventory;
window.renderShop = renderShop;
window.buyProduct = buyProduct;
window.printReceipt = printReceipt;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;
window.editCustomer = editCustomer;
window.toggleCustomer = toggleCustomer;
window.deleteCustomer = deleteCustomer;
window.resetAdminSettings = resetAdminSettings;
