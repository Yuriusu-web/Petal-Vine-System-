"use strict";

/* =====================================
   STORAGE SETTINGS
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

/* =====================================
   DEFAULT FLOWER PRODUCTS
===================================== */

const defaultProducts = [
  {id:1,name:"Red Rose Bouquet",category:"Rose",emoji:"🌹",description:"Classic red roses for someone special.",price:850,stock:20,image:""},
  {id:2,name:"Pink Rose Bouquet",category:"Rose",emoji:"🌷",description:"Beautiful pink roses.",price:900,stock:18,image:""},
  {id:3,name:"White Roses",category:"Rose",emoji:"🤍",description:"Elegant white roses.",price:950,stock:15,image:""},
  {id:4,name:"Sunflower Bouquet",category:"Sunflower",emoji:"🌻",description:"Bright and cheerful sunflowers.",price:750,stock:16,image:""},
  {id:5,name:"Purple Tulips",category:"Tulip",emoji:"🌷",description:"Lovely purple tulips.",price:800,stock:12,image:""},
  {id:6,name:"Mixed Flower Bouquet",category:"Mixed Bouquet",emoji:"💐",description:"A colorful mix of fresh flowers.",price:1200,stock:14,image:""},
  {id:7,name:"Pink Tulips",category:"Tulip",emoji:"🌷",description:"Soft pink tulips.",price:780,stock:17,image:""},
  {id:8,name:"Baby's Breath",category:"Other",emoji:"🌼",description:"Delicate baby's breath flowers.",price:500,stock:25,image:""},
  {id:9,name:"White Lily Bouquet",category:"Other",emoji:"🌸",description:"Elegant white lilies.",price:1100,stock:10,image:""},
  {id:10,name:"Pink Carnations",category:"Other",emoji:"🌺",description:"Lovely pink carnations.",price:650,stock:19,image:""},
  {id:11,name:"Luxury Rose Box",category:"Rose",emoji:"🌹",description:"Premium roses in a gift box.",price:1800,stock:8,image:""},
  {id:12,name:"Pastel Bouquet",category:"Mixed Bouquet",emoji:"💐",description:"Soft pastel-colored flowers.",price:1350,stock:11,image:""},
  {id:13,name:"Orange Gerberas",category:"Other",emoji:"🌼",description:"Bright orange gerbera daisies.",price:700,stock:13,image:""},
  {id:14,name:"Yellow Tulips",category:"Tulip",emoji:"🌷",description:"Cheerful yellow tulips.",price:820,stock:9,image:""},
  {id:15,name:"Grand Celebration Bouquet",category:"Mixed Bouquet",emoji:"💐",description:"A grand bouquet for celebrations.",price:2200,stock:6,image:""}
];

/* =====================================
   LOAD AND SAVE DATA
===================================== */

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch (error) {
    console.error("Could not read saved data:", error);
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    showToast("Storage is full. Use smaller product pictures.");
    return false;
  }
}

let products = loadData(KEYS.products, null);
let users = loadData(KEYS.users, []);
let orders = loadData(KEYS.orders, []);
let admin = loadData(KEYS.admin, {...DEFAULT_ADMIN});

let currentUser = null;
let cart = [];
let selectedProductImage = "";
let toastTimer = null;

function saveAll() {
  saveData(KEYS.products, products);
  saveData(KEYS.users, users);
  saveData(KEYS.orders, orders);
  saveData(KEYS.admin, admin);
}

/* =====================================
   INITIALIZE WEBSITE
===================================== */

function initialize() {
  if (!Array.isArray(products)) {
    products = defaultProducts.map(p => ({...p}));
  }

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];

  if (!admin || !admin.username || !admin.password) {
    admin = {...DEFAULT_ADMIN};
  }

  saveAll();

  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("registerForm").addEventListener("submit", register);
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("adminSettingsForm").addEventListener("submit", saveAdminSettings);
}

/* =====================================
   LOGIN AND REGISTER SCREEN
===================================== */

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

  input.type = input.type === "password" ? "text" : "password";

  button.textContent = input.type === "password" ? "👁️" : "🙈";
}

/* =====================================
   LOGIN
===================================== */

function login(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  const error = document.getElementById("loginError");
  error.textContent = "";

  // ADMIN LOGIN
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

  // CUSTOMER LOGIN
  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    error.textContent = "Incorrect username or password.";
    return;
  }

  currentUser = {
    role: "customer",
    username: user.username,
    name: user.fullName
  };

  startApp();
}

/* =====================================
   CUSTOMER REGISTRATION
===================================== */

function register(event) {
  event.preventDefault();

  const fullName = document.getElementById("regFullName").value.trim();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirm").value;

  const error = document.getElementById("registerError");
  error.textContent = "";

  if (fullName.length < 2 || username.length < 3) {
    error.textContent = "Enter a valid name and username (at least 3 characters).";
    return;
  }

  if (password.length < 4) {
    error.textContent = "Password must have at least 4 characters.";
    return;
  }

  if (password !== confirmPassword) {
    error.textContent = "Passwords do not match.";
    return;
  }

  if (
    username.toLowerCase() === admin.username.toLowerCase() ||
    users.some(u => u.username.toLowerCase() === username.toLowerCase())
  ) {
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

/* =====================================
   LOGOUT
===================================== */

function logout() {
  currentUser = null;
  cart = [];

  document.getElementById("app").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");

  document.getElementById("loginForm").reset();
  document.getElementById("registerForm").reset();

  showAuthChoices();
}

/* =====================================
   START APPLICATION
===================================== */

function startApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("welcomeText").textContent =
    "Welcome, " + currentUser.name;

  buildNavigation();
  showPage("dashboard");
}

/* =====================================
   NAVIGATION
===================================== */

function buildNavigation() {

  const adminLinks = [
    ["dashboard", "Dashboard"],
    ["inventory", "Inventory"],
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

  document.getElementById("navigation").innerHTML =
    links.map(([page, label]) =>
      `<button type="button" data-page="${page}"
      onclick="showPage('${page}')">${label}</button>`
    ).join("");
}

function showPage(pageName) {
  if (!currentUser) return;

  const adminOnly = [
    "inventory",
    "customers",
    "receipts",
    "reports",
    "settings"
  ];

  const customerOnly = [
    "shop",
    "cart",
    "profile"
  ];

  if (
    currentUser.role === "admin" &&
    customerOnly.includes(pageName)
  ) {
    showToast("This page is only available to customers.");
    return;
  }

  if (
    currentUser.role === "customer" &&
    adminOnly.includes(pageName)
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
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  const renderers = {
    dashboard: renderDashboard,
    shop: renderShop,
    cart: renderCart,
    inventory: renderInventory,
    orders: renderOrders,
    customers: renderCustomers,
    receipts: renderReceipts,
    reports: renderReports,
    settings: loadAdminSettings,
    profile: renderProfile
  };

  if (renderers[pageName]) {
    renderers[pageName]();
  }
}

/* =====================================
   GENERAL HELPERS
===================================== */

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
    "'": "&#39;"
  })[char]);
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
  return products.find(product =>
    Number(product.id) === Number(id)
  );
}

/* =====================================
   PRODUCT PICTURES
===================================== */

function productPicture(product) {
  return product.image
    ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
    : `<span class="product-emoji">${escapeHTML(product.emoji || "🌸")}</span>`;
}

/* =====================================
   PRODUCT CARDS
===================================== */

function productCard(product, adminMode) {

  const out = Number(product.stock) <= 0;

  const actions = adminMode

    ? `
      <div class="button-row">
        <button class="btn primary"
          onclick="editProduct(${Number(product.id)})">
          Edit
        </button>

        <button class="btn danger"
          onclick="deleteProduct(${Number(product.id)})">
          Delete
        </button>
      </div>
    `

    : `
      <div class="button-row">
        <button class="btn primary"
          ${out ? "disabled" : ""}
          onclick="addToCart(${Number(product.id)})">
          Add to Cart
        </button>

        <button class="btn outline"
          ${out ? "disabled" : ""}
          onclick="buyNow(${Number(product.id)})">
          Buy Now
        </button>
      </div>
    `;

  return `
    <article class="product-card">

      <div class="product-picture">
        ${productPicture(product)}
      </div>

      <div class="product-info">

        <h3>${escapeHTML(product.name)}</h3>

        <p>${escapeHTML(product.description || "")}</p>

        <div class="price">
          ${money(product.price)}
        </div>

        <div class="stock">
          ${out ? "Out of stock" : `Stock: ${Number(product.stock)}`}
        </div>

        ${actions}

      </div>
    </article>
  `;
}

/* =====================================
   DASHBOARD
===================================== */

function renderDashboard() {

  const isAdmin = currentUser.role === "admin";

  const myOrders = isAdmin
    ? orders
    : orders.filter(o => o.username === currentUser.username);

  const sales = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const stats = isAdmin

    ? [
        ["Products", products.length],
        ["Orders", orders.length],
        ["Customers", users.length],
        ["Sales", money(sales)]
      ]

    : [
        ["Available Products", products.filter(p => p.stock > 0).length],
        ["My Orders", myOrders.length],
        ["Cart Items", cart.reduce((sum, item) => sum + item.quantity, 0)]
      ];

  document.getElementById("dashboardStats").innerHTML =
    stats.map(([label, value]) => `
      <div class="stat-card">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
      </div>
    `).join("");

  document.getElementById("featuredProducts").innerHTML =
    products.slice(0, 4)
      .map(p => productCard(p, isAdmin))
      .join("") ||
    `<p class="empty-state">No products available.</p>`;
}

/* =====================================
   CUSTOMER SHOP
===================================== */

function renderShop() {

  const search = document.getElementById("shopSearch")
    .value.trim().toLowerCase();

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  );

  document.getElementById("shopProducts").innerHTML =
    filtered.length
      ? filtered.map(p => productCard(p, false)).join("")
      : `<p class="empty-state">No products found.</p>`;
}

/* =====================================
   ADD TO CART
===================================== */

function addToCart(id) {

  const product = getProduct(id);

  if (!product || product.stock <= 0) {
    return showToast("Product unavailable.");
  }

  const existing = cart.find(item => item.id === Number(id));

  if (existing) {

    if (existing.quantity >= product.stock) {
      return showToast("Maximum available stock reached.");
    }

    existing.quantity += 1;

  } else {

    cart.push({
      id: Number(id),
      quantity: 1
    });

  }

  showToast("Added to cart.");

  renderDashboard();
}

/* =====================================
   BUY NOW
===================================== */

function buyNow(id) {

  const product = getProduct(id);

  if (!product || product.stock <= 0) {
    return showToast("Product unavailable.");
  }

  cart = [
    {
      id: Number(id),
      quantity: 1
    }
  ];

  showPage("cart");
}

/* =====================================
   CHANGE CART QUANTITY
===================================== */

function changeCartQuantity(id, value) {

  const item = cart.find(entry => entry.id === Number(id));
  const product = getProduct(id);

  if (!item || !product) return;

  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {

    item.quantity = 1;

    showToast("Minimum order quantity is 1.");

  } else if (quantity > product.stock) {

    item.quantity = product.stock;

    showToast("Quantity adjusted to available stock.");

  } else {

    item.quantity = quantity;

  }

  renderCart();
}

/* =====================================
   REMOVE CART ITEM
===================================== */

function removeFromCart(id) {

  cart = cart.filter(item => item.id !== Number(id));

  renderCart();
}

/* =====================================
   DISPLAY SHOPPING CART
===================================== */

function renderCart() {

  const container = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");

  cart = cart.filter(item => getProduct(item.id));

  if (!cart.length) {

    container.innerHTML = `
      <div class="empty-state">
        Your cart is empty. Visit the Shop to add flowers.
      </div>
    `;

    summary.innerHTML = "";

    return;
  }

  let total = 0;

  container.innerHTML = cart.map(item => {

    const product = getProduct(item.id);

    item.quantity = Math.min(
      Math.max(1, item.quantity),
      product.stock || 1
    );

    const subtotal = Number(product.price) * item.quantity;

    total += subtotal;

    return `
      <div class="cart-row">

        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p>${money(product.price)} each</p>
        </div>

        <div>
          <label for="qty-${product.id}">Quantity</label>

          <input
            id="qty-${product.id}"
            type="number"
            min="1"
            max="${Number(product.stock)}"
            value="${item.quantity}"
            onchange="changeCartQuantity(${product.id},this.value)"
          >
        </div>

        <strong>${money(subtotal)}</strong>

        <button
          class="btn danger"
          onclick="removeFromCart(${product.id})"
        >
          Remove
        </button>

      </div>
    `;

  }).join("");

  summary.innerHTML = `

    <h3>Order Summary</h3>

    <p>
      Total items:
      <strong>${cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
    </p>

    <p>
      Total:
      <strong>${money(total)}</strong>
    </p>

    <label for="checkoutAddress">Delivery Address</label>

    <textarea
      id="checkoutAddress"
      placeholder="Enter your complete delivery address"
      required
    ></textarea>

    <label for="checkoutPhone">Contact Number</label>

    <input
      id="checkoutPhone"
      type="tel"
      placeholder="Enter your contact number"
      required
    >

    <label>Payment Method</label>

    <input
      value="Cash on Delivery (COD)"
      readonly
    >

    <button
      class="btn primary full"
      onclick="checkout()"
    >
      Place Order
    </button>

  `;
}

/* =====================================
   CHECKOUT
===================================== */

function checkout() {

  if (!cart.length) {
    return showToast("Your cart is empty.");
  }

  const address = document.getElementById("checkoutAddress")
    .value.trim();

  const phone = document.getElementById("checkoutPhone")
    .value.trim();

  if (!address || !phone) {
    return showToast("Enter your delivery address and contact number.");
  }

  /*
    Customers can buy one item or multiple products.
    Every product must have a quantity of at least one.
  */

  for (const item of cart) {

    const product = getProduct(item.id);

    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      product.stock < item.quantity
    ) {
      return showToast(
        "Please check product quantities and available stock."
      );
    }

  }

  const items = cart.map(item => {

    const product = getProduct(item.id);

    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: Number(item.quantity),
      subtotal: Number(product.price) * Number(item.quantity)
    };

  });

  const total = items.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  // Reduce inventory after successful validation.
  items.forEach(item => {

    const product = getProduct(item.id);

    product.stock -= item.quantity;

  });

  // Create order.
  orders.unshift({

    id: "PV-" + Date.now(),

    username: currentUser.username,

    customerName: currentUser.name,

    items,

    total,

    address,

    phone,

    payment: "Cash on Delivery (COD)",

    status: "Pending",

    date: new Date().toISOString()

  });

  cart = [];

  saveAll();

  showToast("Order placed successfully!");

  showPage("orders");
}

/* =====================================
   INVENTORY
===================================== */

function renderInventory() {

  const search = document.getElementById("inventorySearch")
    .value.trim().toLowerCase();

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  );

  document.getElementById("inventoryProducts").innerHTML =
    filtered.length
      ? filtered.map(p => productCard(p, true)).join("")
      : `<p class="empty-state">No products found.</p>`;
}

/* =====================================
   ADD PRODUCT
===================================== */

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

  document.getElementById("productEditor")
    .scrollIntoView({behavior:"smooth"});
}

function closeProductEditor() {

  document.getElementById("productEditor")
    .classList.add("hidden");

}

/* =====================================
   EDIT PRODUCT
===================================== */

function editProduct(id) {

  if (!currentUser || currentUser.role !== "admin") return;

  const p = getProduct(id);

  if (!p) return;

  document.getElementById("productId").value = p.id;

  document.getElementById("productName").value = p.name;

  document.getElementById("productCategory").value = p.category;

  document.getElementById("productEmoji").value = p.emoji || "🌸";

  document.getElementById("productDescription").value = p.description || "";

  document.getElementById("productPrice").value = p.price;

  document.getElementById("productStock").value = p.stock;

  selectedProductImage = p.image || "";

  const preview = document.getElementById("imagePreview");

  preview.src = selectedProductImage;

  preview.classList.toggle("hidden", !selectedProductImage);

  document.getElementById("removeProductImage")
    .classList.toggle("hidden", !selectedProductImage);

  document.getElementById("productImage").value = "";

  document.getElementById("editorTitle").textContent = "Edit Product";

  document.getElementById("productEditor").classList.remove("hidden");

  document.getElementById("productEditor")
    .scrollIntoView({behavior:"smooth"});
}

/* =====================================
   PRODUCT IMAGE PREVIEW
===================================== */

function previewProductImage(event) {

  const file = event.target.files && event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {

    showToast("Choose an image file.");

    event.target.value = "";

    return;
  }

  if (file.size > 1024 * 1024) {

    showToast("Image must be 1 MB or smaller to help prevent storage errors.");

    event.target.value = "";

    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    selectedProductImage = reader.result;

    const preview = document.getElementById("imagePreview");

    preview.src = selectedProductImage;

    preview.classList.remove("hidden");

    document.getElementById("removeProductImage")
      .classList.remove("hidden");

  };

  reader.readAsDataURL(file);
}

/* =====================================
   REMOVE PRODUCT IMAGE
===================================== */

function removeProductImage() {

  selectedProductImage = "";

  document.getElementById("productImage").value = "";

  document.getElementById("imagePreview").src = "";

  document.getElementById("imagePreview")
    .classList.add("hidden");

  document.getElementById("removeProductImage")
    .classList.add("hidden");
}

/* =====================================
   SAVE PRODUCT
===================================== */

function saveProduct(event) {

  event.preventDefault();

  if (!currentUser || currentUser.role !== "admin") return;

  const id = document.getElementById("productId").value;

  const name = document.getElementById("productName")
    .value.trim();

  const category = document.getElementById("productCategory").value;

  const emoji = document.getElementById("productEmoji")
    .value.trim() || "🌸";

  const description = document.getElementById("productDescription")
    .value.trim();

  const price = Number(document.getElementById("productPrice").value);

  const stock = Number(document.getElementById("productStock").value);

  if (
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return showToast("Enter valid product details.");
  }

  if (
    products.some(p =>
      Number(p.id) !== Number(id) &&
      p.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return showToast("A product with this name already exists.");
  }

  const data = {
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

    const index = products.findIndex(
      p => Number(p.id) === Number(id)
    );

    if (index !== -1) {
      products[index] = data;
    }

  } else {

    products.unshift(data);

  }

  saveAll();

  closeProductEditor();

  renderInventory();

  renderDashboard();

  showToast(id ? "Product updated!" : "Product added!");
}

/* =====================================
   DELETE PRODUCT
===================================== */

function deleteProduct(id) {

  if (!currentUser || currentUser.role !== "admin") return;

  const p = getProduct(id);

  if (!p || !confirm("Delete " + p.name + "?")) return;

  products = products.filter(
    item => Number(item.id) !== Number(id)
  );

  cart = cart.filter(
    item => Number(item.id) !== Number(id)
  );

  saveAll();

  renderInventory();

  renderDashboard();

  showToast("Product deleted.");
}

/* =====================================
   ORDER VISIBILITY
===================================== */

function visibleOrders() {

  return currentUser.role === "admin"
    ? orders
    : orders.filter(o => o.username === currentUser.username);

}

/* =====================================
   DISPLAY ORDERS
===================================== */

function renderOrders() {

  const list = document.getElementById("ordersList");

  const mine = visibleOrders();

  if (!mine.length) {

    list.innerHTML = `
      <div class="empty-state">
        No orders yet.
      </div>
    `;

    return;
  }

  list.innerHTML = mine.map(order => {

    const itemRows = (order.items || [])
      .map(item => `
        <li>
          ${escapeHTML(item.name)}
          × ${Number(item.quantity)}
          — ${money(item.subtotal)}
        </li>
      `).join("");

    const statusClass =
      order.status === "Completed"
        ? "done"
        : order.status === "Cancelled"
          ? "cancelled"
          : "";

    const statusControl =
      currentUser.role === "admin"
        ? `
          <label for="status-${escapeHTML(order.id)}">
            Update Order Status
          </label>

          <select
            id="status-${escapeHTML(order.id)}"
            onchange="updateOrderStatus('${escapeHTML(order.id)}',this.value)"
          >
            ${["Pending","Processing","Completed","Cancelled"]
              .map(s => `
                <option value="${s}" ${order.status === s ? "selected" : ""}>
                  ${s}
                </option>
              `).join("")}
          </select>
        `
        : "";

    return `
      <div class="order-card">

        <h3>${escapeHTML(order.id)}</h3>

        <p>
          <strong>Customer:</strong>
          ${escapeHTML(order.customerName)}
        </p>

        <p>
          <strong>Date:</strong>
          ${new Date(order.date).toLocaleString()}
        </p>

        <p>
          <strong>Payment:</strong>
          ${escapeHTML(order.payment)}
        </p>

        <p>
          <strong>Address:</strong>
          ${escapeHTML(order.address)}
        </p>

        <p>
          <strong>Contact:</strong>
          ${escapeHTML(order.phone)}
        </p>

        <ul>${itemRows}</ul>

        <h3>Total: ${money(order.total)}</h3>

        <p>
          <span class="badge ${statusClass}">
            ${escapeHTML(order.status)}
          </span>
        </p>

        ${statusControl}

        <button
          class="btn outline"
          onclick="printReceipt('${escapeHTML(order.id)}')"
        >
          View / Print Receipt
        </button>

      </div>
    `;

  }).join("");
}

/* =====================================
   UPDATE ORDER STATUS
===================================== */

function updateOrderStatus(orderId, status) {

  if (!currentUser || currentUser.role !== "admin") return;

  const order = orders.find(o => o.id === orderId);

  if (!order) return;

  const allowed = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
  ];

  if (!allowed.includes(status)) return;

  const previous = order.status;

  // Restore stock if cancelled order becomes active again.
  if (previous === "Cancelled" && status !== "Cancelled") {

    if (!order.items.every(item => {

      const p = getProduct(item.id);

      return p && p.stock >= item.quantity;

    })) {

      showToast("Not enough stock to restore this order.");

      renderOrders();

      return;
    }

    order.items.forEach(item => {

      getProduct(item.id).stock -= item.quantity;

    });
  }

  // Return stock when an order is cancelled.
  if (previous !== "Cancelled" && status === "Cancelled") {

    order.items.forEach(item => {

      const p = getProduct(item.id);

      if (p) {
        p.stock += item.quantity;
      }

    });
  }

  order.status = status;

  saveAll();

  renderOrders();

  showToast("Order status updated.");
}

/* =====================================
   RECEIPTS
===================================== */

function renderReceipts() {

  const list = document.getElementById("receiptsList");

  list.innerHTML = orders.length

    ? orders.map(order => `

      <div class="receipt-card">

        <h3>Receipt: ${escapeHTML(order.id)}</h3>

        <p>
          Customer:
          ${escapeHTML(order.customerName)}
        </p>

        <p>
          Date:
          ${new Date(order.date).toLocaleString()}
        </p>

        <p>
          Payment:
          ${escapeHTML(order.payment)}
        </p>

        <p>
          Total:
          <strong>${money(order.total)}</strong>
        </p>

        <p>
          Status:
          ${escapeHTML(order.status)}
        </p>

        <button
          class="btn primary"
          onclick="printReceipt('${escapeHTML(order.id)}')"
        >
          Print / Save PDF
        </button>

      </div>

    `).join("")

    : `
      <div class="empty-state">
        No receipts available yet.
      </div>
    `;
}

/* =====================================
   PRINT RECEIPT
===================================== */

function printReceipt(orderId) {

  const order = orders.find(o => o.id === orderId);

  if (!order) return;

  const rows = (order.items || [])
    .map(item => `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td>${Number(item.quantity)}</td>
        <td>${money(item.price)}</td>
        <td>${money(item.subtotal)}</td>
      </tr>
    `).join("");

  document.getElementById("printArea").innerHTML = `

    <h1>🌸 Petal &amp; Vine</h1>

    <h2>Official Receipt</h2>

    <hr>

    <p>
      <strong>Receipt Number:</strong>
      ${escapeHTML(order.id)}
    </p>

    <p>
      <strong>Date:</strong>
      ${new Date(order.date).toLocaleString()}
    </p>

    <p>
      <strong>Customer:</strong>
      ${escapeHTML(order.customerName)}
    </p>

    <p>
      <strong>Address:</strong>
      ${escapeHTML(order.address)}
    </p>

    <p>
      <strong>Contact:</strong>
      ${escapeHTML(order.phone)}
    </p>

    <p>
      <strong>Payment:</strong>
      ${escapeHTML(order.payment)}
    </p>

    <table>

      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>

    </table>

    <p class="receipt-total">
      Total: ${money(order.total)}
    </p>

    <p>
      Status: ${escapeHTML(order.status)}
    </p>

    <p style="text-align:center;margin-top:40px">
      Thank you for choosing Petal &amp; Vine!
    </p>

  `;

  window.print();
}

/* =====================================
   CUSTOMERS
===================================== */

function renderCustomers() {

  const list = document.getElementById("customersList");

  list.innerHTML = users.length

    ? users.map(user => {

      const customerOrders = orders.filter(
        o => o.username === user.username
      );

      const spent = customerOrders
        .filter(o => o.status !== "Cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0);

      return `

        <div class="customer-card">

          <h3>${escapeHTML(user.fullName)}</h3>

          <p>
            Username:
            ${escapeHTML(user.username)}
          </p>

          <p>
            Registered:
            ${user.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "N/A"}
          </p>

          <p>
            Orders:
            ${customerOrders.length}
          </p>

          <p>
            Total Purchases:
            ${money(spent)}
          </p>

          <button
            class="btn danger"
            onclick="deleteCustomer(${Number(user.id)})"
          >
            Delete Customer
          </button>

        </div>

      `;

    }).join("")

    : `
      <div class="empty-state">
        No registered customers yet.
      </div>
    `;
}

/* =====================================
   DELETE CUSTOMER
===================================== */

function deleteCustomer(id) {

  if (!currentUser || currentUser.role !== "admin") return;

  const user = users.find(
    u => Number(u.id) === Number(id)
  );

  if (
    !user ||
    !confirm("Delete customer account for " + user.fullName + "?")
  ) {
    return;
  }

  users = users.filter(
    u => Number(u.id) !== Number(id)
  );

  saveAll();

  renderCustomers();

  showToast("Customer deleted.");
}

/* =====================================
   SALES REPORTS
===================================== */

function renderReports() {

  const valid = orders.filter(
    o => o.status !== "Cancelled"
  );

  const revenue = valid.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  const completed = orders.filter(
    o => o.status === "Completed"
  ).length;

  const pending = orders.filter(
    o => o.status === "Pending"
  ).length;

  const sold = {};

  valid.forEach(order => {

    (order.items || []).forEach(item => {

      sold[item.name] =
        (sold[item.name] || 0) + Number(item.quantity);

    });

  });

  const best = Object.entries(sold)
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

      ${
        best.length

          ? `
            <ol>
              ${best.map(([name, qty]) => `
                <li>
                  ${escapeHTML(name)} — ${qty} sold
                </li>
              `).join("")}
            </ol>
          `

          : `<p>No sales yet.</p>`
      }

    </div>

    <div class="panel">

      <h3>Inventory Summary</h3>

      <p>
        Total Products:
        ${products.length}
      </p>

      <p>
        Total Units in Stock:
        ${products.reduce((sum, p) => sum + Number(p.stock), 0)}
      </p>

      <p>
        Out of Stock Products:
        ${products.filter(p => p.stock <= 0).length}
      </p>

    </div>

  `;
}

/* =====================================
   ADMIN SETTINGS
===================================== */

function loadAdminSettings() {

  document.getElementById("adminDisplayName").value =
    admin.displayName;

  document.getElementById("adminUsername").value =
    admin.username;

  document.getElementById("currentAdminPassword").value = "";

  document.getElementById("newAdminPassword").value = "";

  document.getElementById("confirmAdminPassword").value = "";

  document.getElementById("adminSettingsMessage").textContent = "";
}

/* =====================================
   SAVE ADMIN SETTINGS
===================================== */

function saveAdminSettings(event) {

  event.preventDefault();

  const displayName = document.getElementById("adminDisplayName")
    .value.trim();

  const username = document.getElementById("adminUsername")
    .value.trim();

  const currentPassword = document.getElementById("currentAdminPassword")
    .value;

  const newPassword = document.getElementById("newAdminPassword")
    .value;

  const confirmPassword = document.getElementById("confirmAdminPassword")
    .value;

  const message = document.getElementById("adminSettingsMessage");

  message.textContent = "";

  if (!displayName || username.length < 3) {

    message.textContent =
      "Enter a valid display name and username.";

    return;
  }

  if (currentPassword !== admin.password) {

    message.textContent =
      "Your current password is incorrect.";

    return;
  }

  if (
    users.some(user =>
      user.username.toLowerCase() === username.toLowerCase()
    )
  ) {

    message.textContent =
      "That username is already used by a customer.";

    return;
  }

  if (newPassword && newPassword.length < 4) {

    message.textContent =
      "New password must have at least 4 characters.";

    return;
  }

  if (newPassword !== confirmPassword) {

    message.textContent =
      "New passwords do not match.";

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

/* =====================================
   CUSTOMER PROFILE
===================================== */

function renderProfile() {

  const myOrders = orders.filter(
    o => o.username === currentUser.username
  );

  document.getElementById("profileContent").innerHTML = `

    <h3>${escapeHTML(currentUser.name)}</h3>

    <p>
      Username:
      ${escapeHTML(currentUser.username)}
    </p>

    <p>
      Total Orders:
      ${myOrders.length}
    </p>

    <button
      class="btn primary"
      onclick="showPage('orders')"
    >
      View My Orders
    </button>

  `;
}

/* =====================================
   START WEBSITE
===================================== */

document.addEventListener("DOMContentLoaded", initialize);
