
"use strict";

/* =====================================
   PETAL & VINE
   Customer: Shop, Cart, COD, Orders
   Admin: Dashboard, Inventory, Orders,
   Customers, Receipts, Reports, Settings
===================================== */

const KEYS = {
  products: "pv_products_v6",
  users: "pv_users_v6",
  orders: "pv_orders_v6",
  admin: "pv_admin_v6"
};

const DEFAULT_ADMIN = {
  displayName: "Administrator",
  username: "admin",
  password: "Admin123"
};

const defaultProducts = [
  { id: 1, name: "Red Rose Bouquet", category: "Rose", emoji: "🌹", description: "Classic red roses for someone special.", price: 850, stock: 20, image: "" },
  { id: 2, name: "Pink Rose Bouquet", category: "Rose", emoji: "🌷", description: "Beautiful pink roses.", price: 900, stock: 18, image: "" },
  { id: 3, name: "White Roses", category: "Rose", emoji: "🤍", description: "Elegant white roses.", price: 950, stock: 15, image: "" },
  { id: 4, name: "Sunflower Bouquet", category: "Sunflower", emoji: "🌻", description: "Bright and cheerful sunflowers.", price: 750, stock: 16, image: "" },
  { id: 5, name: "Purple Tulips", category: "Tulip", emoji: "🌷", description: "Lovely purple tulips.", price: 800, stock: 12, image: "" },
  { id: 6, name: "Mixed Flower Bouquet", category: "Mixed Bouquet", emoji: "💐", description: "A colorful mix of fresh flowers.", price: 1200, stock: 14, image: "" },
  { id: 7, name: "Pink Tulips", category: "Tulip", emoji: "🌷", description: "Soft pink tulips.", price: 780, stock: 17, image: "" },
  { id: 8, name: "Baby's Breath", category: "Other", emoji: "🌼", description: "Delicate baby's breath flowers.", price: 500, stock: 25, image: "" },
  { id: 9, name: "White Lily Bouquet", category: "Other", emoji: "🌸", description: "Elegant white lilies.", price: 1100, stock: 10, image: "" },
  { id: 10, name: "Pink Carnations", category: "Other", emoji: "🌺", description: "Lovely pink carnations.", price: 650, stock: 19, image: "" },
  { id: 11, name: "Luxury Rose Box", category: "Rose", emoji: "🌹", description: "Premium roses in a gift box.", price: 1800, stock: 8, image: "" },
  { id: 12, name: "Pastel Bouquet", category: "Mixed Bouquet", emoji: "💐", description: "Soft pastel-colored flowers.", price: 1350, stock: 11, image: "" },
  { id: 13, name: "Orange Gerberas", category: "Other", emoji: "🌼", description: "Bright orange gerbera daisies.", price: 700, stock: 13, image: "" },
  { id: 14, name: "Yellow Tulips", category: "Tulip", emoji: "🌷", description: "Cheerful yellow tulips.", price: 820, stock: 9, image: "" },
  { id: 15, name: "Grand Celebration Bouquet", category: "Mixed Bouquet", emoji: "💐", description: "A grand bouquet for celebrations.", price: 2200, stock: 6, image: "" }
];

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error("Could not load data:", error);
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let products = loadData(KEYS.products, defaultProducts);
let users = loadData(KEYS.users, []);
let orders = loadData(KEYS.orders, []);
let admin = loadData(KEYS.admin, DEFAULT_ADMIN);

let currentUser = null;
let cart = [];
let selectedProductImage = "";
let toastTimer = null;

/* INITIALIZE */

function initialize() {
  if (!Array.isArray(products)) products = defaultProducts;
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];
  if (!admin || !admin.username || !admin.password) {
    admin = { ...DEFAULT_ADMIN };
  }

  saveAll();

  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("registerForm").addEventListener("submit", register);
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("adminSettingsForm").addEventListener("submit", saveAdminSettings);

  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function saveAll() {
  saveData(KEYS.products, products);
  saveData(KEYS.users, users);
  saveData(KEYS.orders, orders);
  saveData(KEYS.admin, admin);
}

/* AUTHENTICATION */

function showLogin() {
  document.getElementById("authChoices").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

function showRegister() {
  document.getElementById("authChoices").classList.add("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

function showAuthChoices() {
  document.getElementById("authChoices").classList.remove("hidden");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("loginError").textContent = "";
  document.getElementById("registerError").textContent = "";
}

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "🙈";
  } else {
    input.type = "password";
    button.textContent = "👁️";
  }
}

function login(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (
    username.toLowerCase() === admin.username.toLowerCase() &&
    password === admin.password
  ) {
    currentUser = {
      role: "admin",
      username: admin.username,
      name: admin.displayName
    };

    startApp();
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    document.getElementById("loginError").textContent =
      "Incorrect username or password.";
    return;
  }

  currentUser = {
    role: "customer",
    username: user.username,
    name: user.fullName
  };

  startApp();
}

function register(event) {
  event.preventDefault();

  const fullName = document.getElementById("regFullName").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;
  const error = document.getElementById("registerError");

  error.textContent = "";

  if (fullName.length < 2 || username.length < 3) {
    error.textContent = "Please enter a valid name and username.";
    return;
  }

  if (password.length < 4) {
    error.textContent = "Password must have at least 4 characters.";
    return;
  }

  if (password !== confirm) {
    error.textContent = "Passwords do not match.";
    return;
  }

  const usernameExists =
    username.toLowerCase() === admin.username.toLowerCase() ||
    users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    );

  if (usernameExists) {
    error.textContent = "That username is already taken.";
    return;
  }

  users.push({
    id: Date.now(),
    fullName,
    username,
    password,
    createdAt: new Date().toISOString()
  });

  saveAll();

  document.getElementById("registerForm").reset();
  showLogin();
  document.getElementById("loginUsername").value = username;

  showToast("Account created! You can now log in.");
}

function logout() {
  currentUser = null;
  cart = [];

  document.getElementById("app").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");

  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();

  showAuthChoices();
}

/* NAVIGATION */

function startApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("welcomeText").textContent =
    "Welcome, " + currentUser.name;

  buildNavigation();
  showPage("dashboard");
  renderDashboard();
}

function buildNavigation() {
  const navigation = document.getElementById("navigation");

  const adminLinks = [
    ["dashboard", "Dashboard"],
    ["inventory", "Inventory"],
    ["shop", "Shop"],
    ["orders", "Orders"],
    ["customers", "Customers"],
    ["receipts", "Receipts"],
    ["reports", "Reports"],
    ["settings", "Settings"]
  ];

  const customerLinks = [
    ["dashboard", "Home"],
    ["shop", "Shop"],
    ["cart", "🛒 Cart"],
    ["orders", "My Orders"],
    ["profile", "My Account"]
  ];

  const links = currentUser.role === "admin"
    ? adminLinks
    : customerLinks;

  navigation.innerHTML = links.map(link => `
    <button type="button" data-page="${link[0]}"
      onclick="showPage('${link[0]}')">${link[1]}</button>
  `).join("");
}

function showPage(pageName) {
  if (
    currentUser.role === "customer" &&
    ["inventory", "customers", "receipts", "reports", "settings"].includes(pageName)
  ) {
    showToast("You do not have permission to open that page.");
    return;
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = document.getElementById(pageName + "Page");
  if (!page) return;

  page.classList.remove("hidden");

  document.querySelectorAll(".navigation button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  switch (pageName) {
    case "dashboard":
      renderDashboard();
      break;
    case "shop":
      renderShop();
      break;
    case "cart":
      renderCart();
      break;
    case "inventory":
      renderInventory();
      break;
    case "orders":
      renderOrders();
      break;
    case "customers":
      renderCustomers();
      break;
    case "receipts":
      renderReceipts();
      break;
    case "reports":
      renderReports();
      break;
    case "settings":
      loadAdminSettings();
      break;
    case "profile":
      renderProfile();
      break;
  }
}

/* HELPERS */

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function getProduct(id) {
  return products.find(product => Number(product.id) === Number(id));
}

function productPicture(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }

  return `<span class="product-emoji">${escapeHTML(product.emoji || "🌸")}</span>`;
}

/* DASHBOARD */

function renderDashboard() {
  const isAdmin = currentUser.role === "admin";

  const totalOrders = isAdmin
    ? orders.length
    : orders.filter(order => order.username === currentUser.username).length;

  const totalSales = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const stats = isAdmin
    ? [
        ["Products", products.length],
        ["Orders", totalOrders],
        ["Customers", users.length],
        ["Sales", money(totalSales)]
      ]
    : [
        ["Available Products", products.length],
        ["My Orders", totalOrders],
        ["My Cart Items", cart.reduce((sum, item) => sum + item.quantity, 0)]
      ];

  document.getElementById("dashboardStats").innerHTML = stats.map(item => `
    <div class="stat-card">
      <span>${escapeHTML(item[0])}</span>
      <strong>${escapeHTML(item[1])}</strong>
    </div>
  `).join("");

  document.getElementById("featuredProducts").innerHTML =
    products.slice(0, 4).map(product => productCard(product, false)).join("");
}

/* PRODUCTS */

function productCard(product, adminMode) {
  const outOfStock = Number(product.stock) <= 0;

  return `
    <article class="product-card">
      <div class="product-picture">
        ${productPicture(product)}
      </div>

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "")}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">
          ${outOfStock ? "Out of stock" : "Stock: " + product.stock}
        </div>

        ${adminMode ? `
          <div class="button-row">
            <button class="btn primary" onclick="editProduct(${product.id})">Edit</button>
            <button class="btn danger" onclick="deleteProduct(${product.id})">Delete</button>
          </div>
        ` : `
          <button class="btn primary full"
            ${outOfStock ? "disabled" : ""}
            onclick="addToCart(${product.id})">
            ${outOfStock ? "Unavailable" : "Add to Cart"}
          </button>
          <button class="btn outline full"
            ${outOfStock ? "disabled" : ""}
            onclick="buyNow(${product.id})">
            Buy Now
          </button>
        `}
      </div>
    </article>
  `;
}

function renderShop() {
  const search = document.getElementById("shopSearch").value
    .trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  document.getElementById("shopProducts").innerHTML = filtered.length
    ? filtered.map(product => productCard(product, false)).join("")
    : "<p>No products found.</p>";
}

/* CART */

function addToCart(id) {
  const product = getProduct(id);

  if (!product || product.stock <= 0) {
    showToast("This product is unavailable.");
    return;
  }

  const existing = cart.find(item => item.id === Number(id));

  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast("You cannot add more than the available stock.");
      return;
    }
    existing.quantity++;
  } else {
    cart.push({ id: Number(id), quantity: 1 });
  }

  showToast("Added to your cart.");
  renderDashboard();
}

function buyNow(id) {
  const product = getProduct(id);

  if (!product || product.stock <= 0) {
    showToast("This product is unavailable.");
    return;
  }

  cart = [{ id: Number(id), quantity: 1 }];
  showPage("cart");
}

function changeCartQuantity(id, value) {
  const item = cart.find(entry => entry.id === Number(id));
  const product = getProduct(id);

  if (!item || !product) return;

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    cart = cart.filter(entry => entry.id !== Number(id));
  } else if (quantity > product.stock) {
    item.quantity = product.stock;
    showToast("Quantity adjusted to available stock.");
  } else {
    item.quantity = quantity;
  }

  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== Number(id));
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");

  if (!cart.length) {
    container.innerHTML = "<div class='panel'>Your cart is empty. Visit the Shop to add flowers.</div>";
    summary.innerHTML = "";
    return;
  }

  let total = 0;

  container.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    if (!product) return "";

    const subtotal = product.price * item.quantity;
    total += subtotal;

    return `
      <div class="cart-row">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p>${money(product.price)} each</p>
        </div>

        <div>
          <label>Quantity</label>
          <input type="number" min="1" max="${product.stock}"
            value="${item.quantity}"
            onchange="changeCartQuantity(${product.id},this.value)">
        </div>

        <strong>${money(subtotal)}</strong>

        <button class="btn danger"
          onclick="removeFromCart(${product.id})">Remove</button>
      </div>
    `;
  }).join("");

  summary.innerHTML = `
    <h3>Order Summary</h3>
    <p>Total: <strong>${money(total)}</strong></p>

    <label>Delivery Address</label>
    <textarea id="checkoutAddress"
      placeholder="Enter your complete delivery address"></textarea>

    <label>Contact Number</label>
    <input id="checkoutPhone" type="tel"
      placeholder="Enter your contact number">

    <label>Payment Method</label>
    <input type="text" value="Cash on Delivery (COD)" readonly>

    <button class="btn primary full" onclick="checkout()">
      Place Order
    </button>
  `;
}

/* CHECKOUT - COD ONLY */

function checkout() {
  if (!cart.length) {
    showToast("Your cart is empty.");
    return;
  }

  const address = document.getElementById("checkoutAddress").value.trim();
  const phone = document.getElementById("checkoutPhone").value.trim();

  if (!address || !phone) {
    showToast("Please enter your address and contact number.");
    return;
  }

  for (const item of cart) {
    const product = getProduct(item.id);

    if (!product || product.stock < item.quantity) {
      showToast("Some products no longer have enough stock.");
      return;
    }
  }

  const orderItems = cart.map(item => {
    const product = getProduct(item.id);

    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: Number(item.quantity),
      subtotal: Number(product.price) * Number(item.quantity)
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  orderItems.forEach(item => {
    const product = getProduct(item.id);
    product.stock -= item.quantity;
  });

  const order = {
    id: "PV-" + Date.now(),
    username: currentUser.username,
    customerName: currentUser.name,
    items: orderItems,
    total,
    address,
    phone,
    payment: "Cash on Delivery (COD)",
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.unshift(order);
  cart = [];

  saveAll();

  showToast("Order placed successfully! Payment: COD.");
  showPage("orders");
}

/* INVENTORY */

function renderInventory() {
  const search = document.getElementById("inventorySearch").value
    .trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  document.getElementById("inventoryProducts").innerHTML = filtered.length
    ? filtered.map(product => productCard(product, true)).join("")
    : "<p>No products found.</p>";
}

function openProductEditor() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("productEmoji").value = "🌸";
  document.getElementById("editorTitle").textContent = "Add Product";

  selectedProductImage = "";

  document.getElementById("imagePreview").src = "";
  document.getElementById("imagePreview").classList.add("hidden");
  document.getElementById("removeProductImage").classList.add("hidden");

  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({
    behavior: "smooth"
  });
}

function closeProductEditor() {
  document.getElementById("productEditor").classList.add("hidden");
}

function editProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productEmoji").value = product.emoji || "🌸";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;

  selectedProductImage = product.image || "";

  const preview = document.getElementById("imagePreview");
  const removeButton = document.getElementById("removeProductImage");

  if (selectedProductImage) {
    preview.src = selectedProductImage;
    preview.classList.remove("hidden");
    removeButton.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
    removeButton.classList.add("hidden");
  }

  document.getElementById("editorTitle").textContent = "Edit Product";
  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({
    behavior: "smooth"
  });
}

function previewProductImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showToast("Image must be 2 MB or smaller.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    selectedProductImage = reader.result;

    const preview = document.getElementById("imagePreview");
    preview.src = selectedProductImage;
    preview.classList.remove("hidden");

    document.getElementById("removeProductImage").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function removeProductImage() {
  selectedProductImage = "";
  document.getElementById("productImage").value = "";
  document.getElementById("imagePreview").src = "";
  document.getElementById("imagePreview").classList.add("hidden");
  document.getElementById("removeProductImage").classList.add("hidden");
}

function saveProduct(event) {
  event.preventDefault();

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const emoji = document.getElementById("productEmoji").value.trim() || "🌸";
  const description = document.getElementById("productDescription").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    showToast("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== Number(id) &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    showToast("A product with this name already exists.");
    return;
  }

  const productData = {
    id: id ? Number(id) : Date.now(),
    name,
    category,
    emoji,
    description,
    price,
    stock,
    image: selectedProductImage
  };

  if (id) {
    const index = products.findIndex(product => product.id === Number(id));
    if (index !== -1) products[index] = productData;
  } else {
    products.unshift(productData);
  }

  saveAll();
  closeProductEditor();
  renderInventory();
  renderDashboard();
  showToast(id ? "Product updated!" : "Product added!");
}

function deleteProduct(id) {
  const product = getProduct(id);
  if (!product) return;

  if (!confirm("Delete " + product.name + "?")) return;

  products = products.filter(item => item.id !== Number(id));
  cart = cart.filter(item => item.id !== Number(id));

  saveAll();
  renderInventory();
  renderDashboard();
  showToast("Product deleted.");
}

/* ORDERS */

function visibleOrders() {
  if (currentUser.role === "admin") return orders;

  return orders.filter(order =>
    order.username === currentUser.username
  );
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  const myOrders = visibleOrders();

  if (!myOrders.length) {
    list.innerHTML = "<div class='panel'>No orders yet.</div>";
    return;
  }

  list.innerHTML = myOrders.map(order => {
    const items = order.items.map(item =>
      `<li>${escapeHTML(item.name)} × ${item.quantity} — ${money(item.subtotal)}</li>`
    ).join("");

    const statusOptions = ["Pending", "Processing", "Completed", "Cancelled"];

    return `
      <div class="order-card">
        <h3>${escapeHTML(order.id)}</h3>
        <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
        <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
        <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
        <p><strong>Contact:</strong> ${escapeHTML(order.phone)}</p>
        <ul>${items}</ul>
        <h3>Total: ${money(order.total)}</h3>

        <p>
          <span class="badge ${order.status === "Completed" ? "done" : order.status === "Cancelled" ? "cancelled" : ""}">
            ${escapeHTML(order.status)}
          </span>
        </p>

        ${currentUser.role === "admin" ? `
          <label>Update Order Status</label>
          <select onchange="updateOrderStatus('${order.id}',this.value)">
            ${statusOptions.map(status => `
              <option value="${status}" ${order.status === status ? "selected" : ""}>
                ${status}
              </option>
            `).join("")}
          </select>
        ` : ""}

        <button class="btn outline" onclick="printReceipt('${order.id}')">
          View / Print Receipt
        </button>
      </div>
    `;
  }).join("");
}

function updateOrderStatus(orderId, status) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  const previousStatus = order.status;

  if (previousStatus === "Cancelled" && status !== "Cancelled") {
    const canRestore = order.items.every(item => {
      const product = getProduct(item.id);
      return product && product.stock >= item.quantity;
    });

    if (!canRestore) {
      showToast("Not enough stock to restore this order.");
      renderOrders();
      return;
    }

    order.items.forEach(item => {
      const product = getProduct(item.id);
      if (product) product.stock -= item.quantity;
    });
  }

  if (previousStatus !== "Cancelled" && status === "Cancelled") {
    order.items.forEach(item => {
      const product = getProduct(item.id);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = status;
  saveAll();
  renderOrders();
  showToast("Order status updated.");
}

/* RECEIPTS */

function renderReceipts() {
  const list = document.getElementById("receiptsList");

  if (!orders.length) {
    list.innerHTML = "<div class='panel'>No receipts available yet.</div>";
    return;
  }

  list.innerHTML = orders.map(order => `
    <div class="receipt-card">
      <h3>Receipt: ${escapeHTML(order.id)}</h3>
      <p>Customer: ${escapeHTML(order.customerName)}</p>
      <p>Date: ${new Date(order.date).toLocaleString()}</p>
      <p>Payment: Cash on Delivery (COD)</p>
      <p>Total: <strong>${money(order.total)}</strong></p>
      <p>Status: <span class="badge">${escapeHTML(order.status)}</span></p>
      <button class="btn primary" onclick="printReceipt('${order.id}')">
        Print / Save PDF
      </button>
    </div>
  `).join("");
}

function printReceipt(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  const itemRows = order.items.map(item => `
    <tr>
      <td>${escapeHTML(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  document.getElementById("printArea").innerHTML = `
    <h1>🌸 Petal & Vine</h1>
    <h2>Official Receipt</h2>
    <hr>
    <p><strong>Receipt Number:</strong> ${escapeHTML(order.id)}</p>
    <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
    <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
    <p><strong>Contact:</strong> ${escapeHTML(order.phone)}</p>
    <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
    <p><strong>Payment:</strong> Cash on Delivery (COD)</p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px">
      <thead>
        <tr>
          <th align="left">Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <hr>
    <h2 style="text-align:right">Total: ${money(order.total)}</h2>
    <p><strong>Order Status:</strong> ${escapeHTML(order.status)}</p>
    <p style="text-align:center;margin-top:40px">
      Thank you for choosing Petal & Vine!
    </p>
  `;

  window.print();
}

/* CUSTOMERS */

function renderCustomers() {
  const list = document.getElementById("customersList");

  if (!users.length) {
    list.innerHTML = "<div class='panel'>No registered customers yet.</div>";
    return;
  }

  list.innerHTML = users.map(user => {
    const customerOrders = orders.filter(order =>
      order.username === user.username
    );

    const spent = customerOrders
      .filter(order => order.status !== "Cancelled")
      .reduce((sum, order) => sum + Number(order.total), 0);

    return `
      <div class="customer-card">
        <h3>${escapeHTML(user.fullName)}</h3>
        <p>Username: ${escapeHTML(user.username)}</p>
        <p>Registered: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
        <p>Orders: ${customerOrders.length}</p>
        <p>Total Purchases: ${money(spent)}</p>
        <button class="btn danger" onclick="deleteCustomer(${user.id})">
          Delete Customer
        </button>
      </div>
    `;
  }).join("");
}

function deleteCustomer(id) {
  const user = users.find(item => item.id === Number(id));
  if (!user) return;

  if (!confirm("Delete customer account for " + user.fullName + "?")) return;

  users = users.filter(item => item.id !== Number(id));
  saveAll();
  renderCustomers();
  showToast("Customer deleted.");
}

/* REPORTS */

function renderReports() {
  const validOrders = orders.filter(order => order.status !== "Cancelled");

  const revenue = validOrders.reduce(
    (sum, order) => sum + Number(order.total), 0
  );

  const completed = orders.filter(order => order.status === "Completed").length;
  const pending = orders.filter(order => order.status === "Pending").length;

  const soldItems = {};

  validOrders.forEach(order => {
    order.items.forEach(item => {
      soldItems[item.name] = (soldItems[item.name] || 0) + item.quantity;
    });
  });

  const bestSellers = Object.entries(soldItems)
    .sort((a, b) => b[1] - a[1]);

  document.getElementById("reportsContent").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        Total Revenue
        <strong>${money(revenue)}</strong>
      </div>
      <div class="stat-card">
        Completed Orders
        <strong>${completed}</strong>
      </div>
      <div class="stat-card">
        Pending Orders
        <strong>${pending}</strong>
      </div>
      <div class="stat-card">
        Total Customers
        <strong>${users.length}</strong>
      </div>
    </div>

    <div class="panel">
      <h3>Best-Selling Products</h3>
      ${bestSellers.length
        ? `<ol>${bestSellers.map(item =>
            `<li>${escapeHTML(item[0])} — ${item[1]} sold</li>`
          ).join("")}</ol>`
        : "<p>No sales yet.</p>"}
    </div>

    <div class="panel">
      <h3>Inventory Summary</h3>
      <p>Total Products: ${products.length}</p>
      <p>Total Units in Stock: ${products.reduce((sum, item) => sum + Number(item.stock), 0)}</p>
      <p>Out of Stock Products: ${products.filter(item => item.stock <= 0).length}</p>
    </div>
  `;
}

/* ADMIN SETTINGS */

function loadAdminSettings() {
  document.getElementById("adminDisplayName").value = admin.displayName;
  document.getElementById("adminUsername").value = admin.username;

  document.getElementById("currentAdminPassword").value = "";
  document.getElementById("newAdminPassword").value = "";
  document.getElementById("confirmAdminPassword").value = "";
  document.getElementById("adminSettingsMessage").textContent = "";
}

function saveAdminSettings(event) {
  event.preventDefault();

  const displayName = document.getElementById("adminDisplayName").value.trim();
  const username = document.getElementById("adminUsername").value.trim();

  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("newAdminPassword").value;
  const confirmPassword = document.getElementById("confirmAdminPassword").value;

  const message = document.getElementById("adminSettingsMessage");
  message.textContent = "";

  if (!displayName || username.length < 3) {
    message.textContent = "Please enter a valid display name and username.";
    return;
  }

  if (currentPassword !== admin.password) {
    message.textContent = "Your current password is incorrect.";
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    message.textContent = "That username is already used by a customer.";
    return;
  }

  if (newPassword && newPassword.length < 4) {
    message.textContent = "New password must have at least 4 characters.";
    return;
  }

  if (newPassword !== confirmPassword) {
    message.textContent = "New passwords do not match.";
    return;
  }

  admin.displayName = displayName;
  admin.username = username;

  if (newPassword) {
    admin.password = newPassword;
  }

  currentUser.username = admin.username;
  currentUser.name = admin.displayName;

  saveAll();

  document.getElementById("welcomeText").textContent =
    "Welcome, " + currentUser.name;

  document.getElementById("currentAdminPassword").value = "";
  document.getElementById("newAdminPassword").value = "";
  document.getElementById("confirmAdminPassword").value = "";

  message.textContent = "Settings saved successfully!";
  showToast("Admin settings updated.");
}

/* CUSTOMER PROFILE */

function renderProfile() {
  const myOrders = orders.filter(order =>
    order.username === currentUser.username
  );

  document.getElementById("profileContent").innerHTML = `
    <h3>${escapeHTML(currentUser.name)}</h3>
    <p>Username: ${escapeHTML(currentUser.username)}</p>
    <p>Account Type: Customer</p>
    <p>Total Orders: ${myOrders.length}</p>
    <button class="btn primary" onclick="showPage('orders')">
      View My Orders
    </button>
  `;
}

/* START */

document.addEventListener("DOMContentLoaded", initialize);
