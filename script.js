
"use strict";

/* ==========================================
   PETAL & VINE - MAIN APPLICATION
   ========================================== */

const KEYS = {
  products: "pv_products_v7",
  users: "pv_users_v7",
  orders: "pv_orders_v7",
  admin: "pv_admin_v7"
};

const DEFAULT_ADMIN = {
  name: "Administrator",
  username: "admin",
  password: "Admin123"
};

const STARTER_PRODUCTS = [
  {id:1,name:"Classic Rose Bouquet",category:"Roses",price:850,stock:20,description:"A beautiful arrangement of fresh red roses.",emoji:"🌹"},
  {id:2,name:"Pink Dream Bouquet",category:"Bouquet",price:950,stock:15,description:"Soft pink flowers for someone special.",emoji:"🌸"},
  {id:3,name:"Sunshine Bouquet",category:"Bouquet",price:780,stock:18,description:"Bright flowers to make someone's day.",emoji:"🌻"},
  {id:4,name:"White Elegance",category:"Arrangement",price:1200,stock:10,description:"Elegant white flowers for every occasion.",emoji:"💐"},
  {id:5,name:"Tulip Love",category:"Bouquet",price:1100,stock:12,description:"Lovely tulips in a beautiful wrap.",emoji:"🌷"},
  {id:6,name:"Red Rose Dozen",category:"Roses",price:1500,stock:15,description:"Twelve classic red roses.",emoji:"🌹"},
  {id:7,name:"Pastel Garden",category:"Arrangement",price:1350,stock:8,description:"A soft pastel flower arrangement.",emoji:"💐"},
  {id:8,name:"Sunflower Charm",category:"Bouquet",price:700,stock:20,description:"A cheerful sunflower bouquet.",emoji:"🌻"},
  {id:9,name:"Orchid Plant",category:"Plants",price:980,stock:9,description:"A graceful orchid plant for your home.",emoji:"🪴"},
  {id:10,name:"Mini Succulent",category:"Plants",price:350,stock:25,description:"A cute and easy-care succulent.",emoji:"🌵"},
  {id:11,name:"Lavender Bundle",category:"Bouquet",price:650,stock:14,description:"A fragrant lavender bundle.",emoji:"💜"},
  {id:12,name:"Baby's Breath",category:"Arrangement",price:550,stock:16,description:"Delicate white baby's breath flowers.",emoji:"🤍"},
  {id:13,name:"Birthday Blooms",category:"Gift",price:1450,stock:10,description:"A colorful birthday flower gift.",emoji:"🎁"},
  {id:14,name:"Forever Love",category:"Roses",price:1800,stock:7,description:"Premium roses for unforgettable moments.",emoji:"❤️"},
  {id:15,name:"Flower Gift Box",category:"Gift",price:1250,stock:11,description:"A lovely flower gift box.",emoji:"🌺"}
];

let products = load(KEYS.products, null);
let users = load(KEYS.users, []);
let orders = load(KEYS.orders, []);
let admin = load(KEYS.admin, DEFAULT_ADMIN);
let currentUser = null;
let cart = [];
let currentReceiptId = null;
let selectedImageData = "";

/* ==========================================
   STORAGE AND UTILITIES
   ========================================== */

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.error("Storage error:", error);
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initialize() {
  if (!Array.isArray(products)) products = STARTER_PRODUCTS.map(p => ({...p}));
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];
  if (!admin || typeof admin !== "object") admin = {...DEFAULT_ADMIN};

  saveAll();

  const savedCart = load("pv_cart_v7", []);
  cart = Array.isArray(savedCart) ? savedCart : [];
  normalizeCart();
}

function saveAll() {
  save(KEYS.products, products);
  save(KEYS.users, users);
  save(KEYS.orders, orders);
  save(KEYS.admin, admin);
  save("pv_cart_v7", cart);
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
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
    "'": "&#039;"
  })[char]);
}

function toast(message) {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getProduct(id) {
  return products.find(product => Number(product.id) === Number(id));
}

function getCurrentCart() {
  return cart.filter(item => getProduct(item.id));
}

function saveCart() {
  save("pv_cart_v7", cart);
  updateCartCount();
}

function normalizeCart() {
  cart = getCurrentCart().map(item => ({
    id: Number(item.id),
    quantity: Math.max(1, Number(item.quantity) || 1),
    selected: item.selected !== false
  }));
  saveCart();
}

function imageMarkup(product, className = "product-picture") {
  const image = product.image || "";
  if (image) {
    return `<div class="${className}"><img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}"></div>`;
  }
  return `<div class="${className}">${escapeHTML(product.emoji || "🌸")}</div>`;
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

/* ==========================================
   AUTHENTICATION
   ========================================== */

function showAuthTab(tab) {
  document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", tab !== "register");
  document.getElementById("loginTab").classList.toggle("active", tab === "login");
  document.getElementById("registerTab").classList.toggle("active", tab === "register");
}

document.getElementById("loginTab").addEventListener("click", () => showAuthTab("login"));
document.getElementById("registerTab").addEventListener("click", () => showAuthTab("register"));

document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (username === admin.username && password === admin.password) {
    currentUser = {
      id: "admin",
      name: admin.name,
      username: admin.username,
      role: "admin"
    };
    enterApp();
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    toast("Incorrect username or password.");
    return;
  }

  user.lastLogin = new Date().toISOString();
  save(KEYS.users, users);

  currentUser = {...user};
  enterApp();
});

document.getElementById("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!name || !username || password.length < 4) {
    toast("Please complete all fields. Password must be at least 4 characters.");
    return;
  }

  const exists = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (exists || username.toLowerCase() === admin.username.toLowerCase()) {
    toast("That username is already taken.");
    return;
  }

  const user = {
    id: makeId(),
    name,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(user);
  save(KEYS.users, users);

  currentUser = {...user};
  enterApp();
  toast("Account created successfully!");
});

function enterApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  document.getElementById("adminNav").classList.toggle("hidden", !isAdmin());
  document.getElementById("customerNav").classList.toggle("hidden", isAdmin());

  document.getElementById("welcomeText").textContent =
    "Hello, " + (isAdmin() ? admin.name : currentUser.name);

  document.getElementById("adminStats").classList.toggle("hidden", !isAdmin());
  document.getElementById("customerStats").classList.toggle("hidden", isAdmin());

  document.getElementById("dashboardProductsTitle").textContent =
    isAdmin() ? "All Products" : "Featured Flowers";

  document.getElementById("dashboardShopBtn").classList.toggle("hidden", isAdmin());

  renderEverything();
  showPage("dashboardPage");
}

function logout() {
  currentUser = null;
  document.getElementById("mainApp").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();
  showAuthTab("login");
}

document.getElementById("logoutBtn").addEventListener("click", logout);

/* ==========================================
   NAVIGATION
   ========================================== */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  const page = document.getElementById(pageId);
  if (page) page.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  if (pageId === "cartPage") renderCart();
  if (pageId === "inventoryPage") renderInventory();
  if (pageId === "ordersPage") renderOrders();
  if (pageId === "receiptsPage") renderReceipts();
  if (pageId === "customersPage") renderCustomers();
  if (pageId === "reportsPage") renderReports();
  if (pageId === "myOrdersPage") renderMyOrders();
  if (pageId === "settingsPage") loadSettings();
  if (pageId === "profilePage") loadProfile();
}

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.getElementById("dashboardShopBtn").addEventListener("click", () => showPage("shopPage"));

/* ==========================================
   DASHBOARD AND PRODUCT DISPLAY
   ========================================== */

function renderEverything() {
  renderDashboard();
  renderShop();
  renderCart();
  updateCartCount();
  if (isAdmin()) renderAdminStats();
}

function renderDashboard() {
  const container = document.getElementById("dashboardProducts");

  if (!products.length) {
    container.innerHTML = `<div class="empty-state">No products available yet.</div>`;
    return;
  }

  container.innerHTML = products.slice(0, 8).map(product =>
    productCard(product)
  ).join("");
}

function productCard(product) {
  const outOfStock = Number(product.stock) <= 0;

  return `
    <article class="product-card">
      ${imageMarkup(product)}
      <div class="product-info">
        <span class="eyebrow">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "Beautiful flowers for every occasion.")}</p>
        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="stock">${outOfStock ? "Out of stock" : `${product.stock} available`}</span>
        </div>
        ${isAdmin()
          ? `<button class="outline" type="button" onclick="showPage('inventoryPage')">Manage product</button>`
          : `<button class="primary" type="button" onclick="addToCart(${Number(product.id)})" ${outOfStock ? "disabled" : ""}>Add to Cart</button>`
        }
      </div>
    </article>
  `;
}

function renderShop() {
  const container = document.getElementById("shopProducts");
  const search = (document.getElementById("shopSearch").value || "").toLowerCase();
  const category = document.getElementById("shopCategory").value;

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      (product.description || "").toLowerCase().includes(search);
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  container.innerHTML = filtered.length
    ? filtered.map(product => productCard(product)).join("")
    : `<div class="empty-state">No matching products found.</div>`;
}

document.getElementById("shopSearch").addEventListener("input", renderShop);
document.getElementById("shopCategory").addEventListener("change", renderShop);

/* ==========================================
   CART
   Adding to cart NEVER reduces inventory.
   ========================================== */

function addToCart(id) {
  const product = getProduct(id);
  if (!product) return toast("Product not found.");
  if (Number(product.stock) <= 0) return toast("This product is out of stock.");

  const existing = cart.find(item => Number(item.id) === Number(id));

  if (existing) {
    if (existing.quantity >= product.stock) {
      return toast("You cannot add more than the available stock.");
    }
    existing.quantity += 1;
    existing.selected = true;
  } else {
    cart.push({
      id: Number(id),
      quantity: 1,
      selected: true
    });
  }

  saveCart();
  renderCart();
  toast("Product added to your cart!");
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("customerCartCount").textContent = count;
}

function renderCart() {
  const container = document.getElementById("cartItems");
  if (!container) return;

  normalizeCart();

  if (!cart.length) {
    container.innerHTML = `<div class="empty-state">🛍️<h3>Your cart is empty</h3><p>Add some beautiful flowers to get started.</p></div>`;
    document.getElementById("selectAllCart").checked = false;
    renderCartSummary();
    return;
  }

  container.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    if (!product) return "";

    return `
      <article class="cart-item">
        <input type="checkbox"
          aria-label="Select ${escapeHTML(product.name)}"
          ${item.selected !== false ? "checked" : ""}
          onchange="toggleCartSelection(${Number(item.id)}, this.checked)">

        <div class="cart-thumb">
          ${product.image
            ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}">`
            : escapeHTML(product.emoji || "🌸")}
        </div>

        <div>
          <h4>${escapeHTML(product.name)}</h4>
          <p>${money(product.price)} each</p>
          <div class="quantity-controls">
            <button type="button" onclick="changeCartQuantity(${Number(item.id)}, -1)">−</button>
            <strong>${item.quantity}</strong>
            <button type="button" onclick="changeCartQuantity(${Number(item.id)}, 1)">+</button>
          </div>
        </div>

        <div>
          <strong>${money(product.price * item.quantity)}</strong>
          <button class="text-btn danger" type="button" onclick="removeFromCart(${Number(item.id)})">Remove</button>
        </div>
      </article>
    `;
  }).join("");

  const allSelected = cart.length > 0 && cart.every(item => item.selected !== false);
  document.getElementById("selectAllCart").checked = allSelected;

  renderCartSummary();
}

function toggleCartSelection(id, checked) {
  const item = cart.find(entry => Number(entry.id) === Number(id));
  if (!item) return;

  item.selected = checked;
  saveCart();
  renderCart();
}

function selectAllCartItems(checked) {
  cart.forEach(item => item.selected = checked);
  saveCart();
  renderCart();
}

document.getElementById("selectAllCart").addEventListener("change", event => {
  selectAllCartItems(event.target.checked);
});

function changeCartQuantity(id, amount) {
  const item = cart.find(entry => Number(entry.id) === Number(id));
  const product = getProduct(id);
  if (!item || !product) return;

  const next = item.quantity + amount;

  if (next <= 0) {
    removeFromCart(id);
    return;
  }

  if (next > Number(product.stock)) {
    toast("Quantity cannot exceed available stock.");
    return;
  }

  item.quantity = next;
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => Number(item.id) !== Number(id));
  saveCart();
  renderCart();
  toast("Product removed from cart.");
}

function renderCartSummary() {
  const selected = cart.filter(item => item.selected !== false);
  const quantity = selected.reduce((sum, item) => sum + item.quantity, 0);
  const total = selected.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  document.getElementById("summaryQuantity").textContent = quantity;
  document.getElementById("selectedCartCount").textContent =
    `${selected.length} product${selected.length === 1 ? "" : "s"} selected`;
  document.getElementById("cartTotal").textContent = money(total);
  document.getElementById("checkoutBtn").disabled = selected.length === 0;
}

/* ==========================================
   CHECKOUT
   Only selected items are purchased.
   Unselected items stay in the cart.
   ========================================== */

function checkout() {
  if (!currentUser || isAdmin()) return;

  const selectedItems = cart.filter(item => item.selected !== false);

  if (!selectedItems.length) {
    toast("Please select at least one product.");
    return;
  }

  for (const item of selectedItems) {
    const product = getProduct(item.id);

    if (!product) {
      toast("A product in your cart is no longer available.");
      return;
    }

    if (item.quantity > Number(product.stock)) {
      toast(`${product.name} does not have enough stock.`);
      return;
    }
  }

  const purchasedItems = selectedItems.map(item => {
    const product = getProduct(item.id);
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: Number(item.quantity),
      subtotal: Number(product.price) * Number(item.quantity)
    };
  });

  const total = purchasedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: "PV-" + Date.now(),
    userId: currentUser.id,
    customerName: currentUser.name,
    customerUsername: currentUser.username,
    items: purchasedItems,
    total,
    status: "Completed",
    createdAt: new Date().toISOString()
  };

  // Reduce stock only after validation and successful order creation.
  purchasedItems.forEach(item => {
    const product = getProduct(item.productId);
    product.stock -= item.quantity;
  });

  orders.push(order);

  // Keep every unselected product in the cart.
  cart = cart.filter(item => item.selected === false);

  saveAll();
  renderEverything();
  showPage("myOrdersPage");
  openReceipt(order.id);
  toast("Checkout successful!");
}

document.getElementById("checkoutBtn").addEventListener("click", checkout);

/* ==========================================
   ADMIN DASHBOARD
   ========================================== */

function renderAdminStats() {
  const completed = orders.filter(order => order.status === "Completed");
  const sales = completed.reduce((sum, order) => sum + Number(order.total), 0);

  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statOrders").textContent = orders.length;
  document.getElementById("statCustomers").textContent = users.length;
  document.getElementById("statSales").textContent = money(sales);
}

/* ==========================================
   INVENTORY CRUD
   ========================================== */

document.getElementById("addProductBtn").addEventListener("click", () => {
  resetProductForm();
  document.getElementById("productEditor").classList.remove("hidden");
});

document.getElementById("cancelProductBtn").addEventListener("click", () => {
  document.getElementById("productEditor").classList.add("hidden");
  resetProductForm();
});

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  selectedImageData = "";
  document.getElementById("productImagePreview").innerHTML = "🌷";
  document.getElementById("editorTitle").textContent = "Add Product";
}

document.getElementById("productImage").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("Please choose a valid image.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toast("Image must be smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedImageData = reader.result;
    document.getElementById("productImagePreview").innerHTML =
      `<img src="${selectedImageData}" alt="Product preview">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("productForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const description = document.getElementById("productDescription").value.trim();

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    toast("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== Number(id) &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    toast("A product with this name already exists.");
    return;
  }

  if (id) {
    const product = getProduct(id);
    if (!product) return toast("Product not found.");

    product.name = name;
    product.category = category;
    product.price = price;
    product.stock = stock;
    product.description = description;

    if (selectedImageData) product.image = selectedImageData;
  } else {
    products.push({
      id: makeId(),
      name,
      category,
      price,
      stock,
      description,
      emoji: "🌸",
      image: selectedImageData || ""
    });
  }

  save(KEYS.products, products);
  resetProductForm();
  document.getElementById("productEditor").classList.add("hidden");
  renderEverything();
  renderInventory();
  toast("Product saved successfully.");
});

function editProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productDescription").value = product.description || "";

  selectedImageData = "";
  document.getElementById("productImage").value = "";

  document.getElementById("productImagePreview").innerHTML = product.image
    ? `<img src="${escapeHTML(product.image)}" alt="Product preview">`
    : escapeHTML(product.emoji || "🌷");

  document.getElementById("editorTitle").textContent = "Edit Product";
  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({behavior:"smooth"});
}

function deleteProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

  products = products.filter(item => Number(item.id) !== Number(id));
  cart = cart.filter(item => Number(item.id) !== Number(id));

  saveAll();
  renderEverything();
  renderInventory();
  toast("Product deleted.");
}

function renderInventory() {
  const container = document.getElementById("inventoryList");
  const search = (document.getElementById("inventorySearch").value || "").toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">No products found.</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead><tr>
        <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${filtered.map(product => `
          <tr>
            <td>
              ${product.image
                ? `<img class="table-thumb" src="${escapeHTML(product.image)}" alt="">`
                : `${escapeHTML(product.emoji || "🌸")}`}
              ${escapeHTML(product.name)}
            </td>
            <td>${escapeHTML(product.category)}</td>
            <td>${money(product.price)}</td>
            <td>${product.stock}</td>
            <td>
              <button class="outline" onclick="editProduct(${Number(product.id)})" type="button">Edit</button>
              <button class="outline danger" onclick="deleteProduct(${Number(product.id)})" type="button">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

document.getElementById("inventorySearch").addEventListener("input", renderInventory);

/* ==========================================
   ORDERS AND RECEIPTS
   ========================================== */

function statusBadge(status) {
  const css = status.toLowerCase();
  return `<span class="status ${escapeHTML(css)}">${escapeHTML(status)}</span>`;
}

function renderOrders() {
  const container = document.getElementById("ordersList");

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">No orders yet.</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead><tr>
        <th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${orders.slice().reverse().map(order => `
          <tr>
            <td>${escapeHTML(order.id)}</td>
            <td>${escapeHTML(order.customerName)}</td>
            <td>${new Date(order.createdAt).toLocaleString()}</td>
            <td>${money(order.total)}</td>
            <td>${statusBadge(order.status)}</td>
            <td>
              <button class="outline" type="button" onclick="openReceipt('${escapeHTML(order.id)}')">Receipt</button>
              ${order.status === "Completed"
                ? `<button class="outline danger" type="button" onclick="cancelOrder('${escapeHTML(order.id)}')">Cancel</button>`
                : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderMyOrders() {
  const mine = orders.filter(order => String(order.userId) === String(currentUser.id));
  const container = document.getElementById("myOrdersList");

  if (!mine.length) {
    container.innerHTML = `<div class="empty-state">You have not placed any orders yet.</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Receipt</th></tr></thead>
      <tbody>
        ${mine.slice().reverse().map(order => `
          <tr>
            <td>${escapeHTML(order.id)}</td>
            <td>${new Date(order.createdAt).toLocaleString()}</td>
            <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            <td>${money(order.total)}</td>
            <td>${statusBadge(order.status)}</td>
            <td><button class="outline" onclick="openReceipt('${escapeHTML(order.id)}')" type="button">View</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function cancelOrder(id) {
  const order = orders.find(item => item.id === id);
  if (!order || order.status !== "Completed") return;

  if (!confirm("Cancel this order and return the items to inventory?")) return;

  order.status = "Cancelled";

  order.items.forEach(item => {
    const product = getProduct(item.productId);
    if (product) product.stock += Number(item.quantity);
  });

  saveAll();
  renderEverything();
  renderOrders();
  toast("Order cancelled and stock restored.");
}

function renderReceipts() {
  const container = document.getElementById("receiptsList");
  const completed = orders.filter(order => order.status === "Completed");

  if (!completed.length) {
    container.innerHTML = `<div class="empty-state">No completed receipts yet.</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead><tr><th>Receipt</th><th>Customer</th><th>Date</th><th>Total</th><th>Action</th></tr></thead>
      <tbody>
        ${completed.slice().reverse().map(order => `
          <tr>
            <td>${escapeHTML(order.id)}</td>
            <td>${escapeHTML(order.customerName)}</td>
            <td>${new Date(order.createdAt).toLocaleString()}</td>
            <td>${money(order.total)}</td>
            <td><button class="outline" onclick="openReceipt('${escapeHTML(order.id)}')" type="button">View / Print</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function openReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return toast("Receipt not found.");

  currentReceiptId = id;

  document.getElementById("receiptContent").innerHTML = `
    <div class="receipt-header">
      <h2>🌸 Petal & Vine</h2>
      <p>Flower Shop</p>
      <p>Order Receipt</p>
    </div>
    <p><strong>Receipt:</strong> ${escapeHTML(order.id)}</p>
    <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <p><strong>Status:</strong> ${escapeHTML(order.status)}</p>
    <hr>
    ${order.items.map(item => `
      <div class="receipt-row">
        <span>${escapeHTML(item.name)} × ${item.quantity}</span>
        <strong>${money(item.subtotal)}</strong>
      </div>
    `).join("")}
    <div class="receipt-row receipt-total">
      <span>TOTAL</span><span>${money(order.total)}</span>
    </div>
    <p style="text-align:center;margin-top:25px">Thank you for shopping with us! 🌷</p>
  `;

  document.getElementById("receiptModal").classList.remove("hidden");
}

document.getElementById("closeReceiptBtn").addEventListener("click", () => {
  document.getElementById("receiptModal").classList.add("hidden");
});

document.getElementById("printReceiptBtn").addEventListener("click", () => {
  window.print();
});

/* ==========================================
   CUSTOMER MANAGEMENT
   ========================================== */

function renderCustomers() {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const newCount = users.filter(user =>
    user.createdAt && now - new Date(user.createdAt).getTime() <= thirtyDays
  ).length;

  const activeCount = users.filter(user =>
    user.lastLogin && now - new Date(user.lastLogin).getTime() <= thirtyDays
  ).length;

  document.getElementById("totalUsers").textContent = users.length;
  document.getElementById("newUsers").textContent = newCount;
  document.getElementById("activeUsers").textContent = activeCount;

  const search = (document.getElementById("userSearch").value || "").toLowerCase();
  const filtered = users.filter(user =>
    user.name.toLowerCase().includes(search) ||
    user.username.toLowerCase().includes(search)
  );

  const container = document.getElementById("customersList");

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">No customers found.</div>`;
    return;
  }

  container.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Username</th><th>Registered</th><th>Last Login</th></tr></thead>
      <tbody>
        ${filtered.map(user => `
          <tr>
            <td>${escapeHTML(user.name)}</td>
            <td>${escapeHTML(user.username)}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

document.getElementById("userSearch").addEventListener("input", renderCustomers);

/* ==========================================
   SALES REPORTS
   ========================================== */

function renderReports() {
  const completed = orders.filter(order => order.status === "Completed");
  const sales = completed.reduce((sum, order) => sum + Number(order.total), 0);
  const sold = completed.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity), 0), 0
  );

  document.getElementById("reportSales").textContent = money(sales);
  document.getElementById("reportOrders").textContent = completed.length;
  document.getElementById("reportItems").textContent = sold;

  document.getElementById("reportDetails").innerHTML = completed.length
    ? `<table>
        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th></tr></thead>
        <tbody>${completed.map(order => `
          <tr>
            <td>${escapeHTML(order.id)}</td>
            <td>${escapeHTML(order.customerName)}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>${money(order.total)}</td>
          </tr>
        `).join("")}</tbody>
      </table>`
    : `<div class="empty-state">No completed sales yet.</div>`;
}

/* ==========================================
   ADMIN SETTINGS
   ========================================== */

function loadSettings() {
  document.getElementById("adminDisplayName").value = admin.name;
  document.getElementById("adminUsername").value = admin.username;
  document.getElementById("adminPassword").value = "";
}

document.getElementById("settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("adminDisplayName").value.trim();
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (!name || !username) {
    toast("Please enter the admin name and username.");
    return;
  }

  const usernameUsedByCustomer = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (usernameUsedByCustomer) {
    toast("That username is already used by a customer.");
    return;
  }

  admin.name = name;
  admin.username = username;
  if (password.trim()) admin.password = password;

  save(KEYS.admin, admin);

  if (isAdmin()) {
    currentUser.name = admin.name;
    currentUser.username = admin.username;
    document.getElementById("welcomeText").textContent = "Hello, " + admin.name;
  }

  toast("Admin settings updated.");
});

/* ==========================================
   CUSTOMER PROFILE
   ========================================== */

function loadProfile() {
  if (!currentUser || isAdmin()) return;
  document.getElementById("profileName").value = currentUser.name;
  document.getElementById("profileUsername").value = currentUser.username;
}

document.getElementById("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!currentUser || isAdmin()) return;

  const name = document.getElementById("profileName").value.trim();
  if (!name) return toast("Please enter your name.");

  const user = users.find(item => String(item.id) === String(currentUser.id));
  if (!user) return;

  user.name = name;
  currentUser.name = name;
  save(KEYS.users, users);

  document.getElementById("welcomeText").textContent = "Hello, " + name;
  toast("Profile updated.");
});

/* ==========================================
   INITIAL STARTUP
   ========================================== */

document.addEventListener("DOMContentLoaded", initialize);
