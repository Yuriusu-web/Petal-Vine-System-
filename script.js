
"use strict";

/* =========================================================
   PETAL & VINE - COMPLETE FLOWER SHOP JAVASCRIPT
   Works with the supplied index.html and style.css
   ========================================================= */

const STORAGE = {
  products: "pv_products",
  users: "pv_users",
  orders: "pv_orders",
  cart: "pv_cart",
  settings: "pv_settings",
  session: "pv_session",
  setup: "pv_admin_setup"
};

const DEFAULT_PRODUCTS = [
  {
    id: "p001",
    name: "Blush Rose Bouquet",
    price: 1250,
    stock: 20,
    category: "Roses",
    description: "Beautiful soft pink roses arranged with care.",
    image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=700"
  },
  {
    id: "p002",
    name: "Classic Red Roses",
    price: 1500,
    stock: 18,
    category: "Roses",
    description: "A timeless bouquet of romantic red roses.",
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=700"
  },
  {
    id: "p003",
    name: "Sunflower Delight",
    price: 950,
    stock: 15,
    category: "Sunflowers",
    description: "Bright sunflowers to bring happiness to anyone.",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700"
  },
  {
    id: "p004",
    name: "White Lily Elegance",
    price: 1350,
    stock: 12,
    category: "Lilies",
    description: "Elegant white lilies for special occasions.",
    image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=700"
  },
  {
    id: "p005",
    name: "Pastel Garden Bouquet",
    price: 1800,
    stock: 10,
    category: "Mixed Flowers",
    description: "A dreamy combination of pastel-colored flowers.",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=700"
  },
  {
    id: "p006",
    name: "Pink Tulip Bunch",
    price: 1100,
    stock: 16,
    category: "Tulips",
    description: "Fresh pink tulips with a lovely natural finish.",
    image: "https://images.unsplash.com/photo-1528913775512-624d24b27b96?w=700"
  },
  {
    id: "p007",
    name: "Purple Orchid Charm",
    price: 1650,
    stock: 8,
    category: "Orchids",
    description: "Sophisticated purple orchids for elegant gifting.",
    image: "https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=700"
  },
  {
    id: "p008",
    name: "Baby's Breath Dream",
    price: 850,
    stock: 25,
    category: "Mixed Flowers",
    description: "Delicate white blooms with a soft romantic look.",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=700"
  },
  {
    id: "p009",
    name: "Peach Rose Romance",
    price: 1400,
    stock: 14,
    category: "Roses",
    description: "Warm peach roses perfect for heartfelt gifts.",
    image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=700"
  },
  {
    id: "p010",
    name: "Spring Mix Bouquet",
    price: 1550,
    stock: 11,
    category: "Mixed Flowers",
    description: "A cheerful mix of seasonal spring flowers.",
    image: "https://images.unsplash.com/photo-1494625927555-6ec4433b1571?w=700"
  },
  {
    id: "p011",
    name: "Golden Sunflower Box",
    price: 1750,
    stock: 9,
    category: "Sunflowers",
    description: "A radiant sunflower arrangement in a gift box.",
    image: "https://images.unsplash.com/photo-1597848212624-e6c1e7c1f9f5?w=700"
  },
  {
    id: "p012",
    name: "Elegant Carnations",
    price: 1050,
    stock: 17,
    category: "Carnations",
    description: "Lovely carnations arranged in a charming bouquet.",
    image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=700"
  },
  {
    id: "p013",
    name: "Lavender Fields",
    price: 1200,
    stock: 13,
    category: "Lavender",
    description: "A calming arrangement inspired by lavender fields.",
    image: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=700"
  },
  {
    id: "p014",
    name: "Luxury Flower Basket",
    price: 2500,
    stock: 6,
    category: "Flower Baskets",
    description: "A premium flower basket for unforgettable moments.",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=700"
  },
  {
    id: "p015",
    name: "Sweet Daisy Bouquet",
    price: 900,
    stock: 22,
    category: "Daisies",
    description: "Fresh daisies for simple and happy occasions.",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=700"
  }
];

const DEFAULT_SETTINGS = {
  storeName: "Petal & Vine",
  adminName: "Store Administrator",
  adminUsername: "admin"
};

let products = [];
let users = [];
let orders = [];
let cart = [];
let settings = {};
let currentUser = null;
let currentAdminTab = "overview";
let toastTimer = null;
let pendingProductImage = "";

/* =========================
   BASIC HELPERS
   ========================= */

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Could not load:", key, error);
    return fallback;
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE.products, JSON.stringify(products));
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
    localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
    localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  } catch (error) {
    console.error(error);
    notify("Storage is full. Try using smaller product images.");
  }
}

function createId(prefix = "ID") {
  return prefix + "-" + Date.now().toString(36).toUpperCase() +
    "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

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

function notify(message) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function getProduct(id) {
  return products.find(product => product.id === id);
}

function getCustomerName(userId) {
  const user = users.find(item => item.id === userId);
  return user ? user.name : "Unknown customer";
}

function getCurrentDate() {
  return new Date().toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function getOrderTotal(order) {
  return Number(order.total || 0);
}

function imageHTML(image, alt, className = "") {
  if (!image) {
    return `<div class="${className}">💐</div>`;
  }

  return `
    <div class="${className}">
      <img src="${escapeHTML(image)}"
           alt="${escapeHTML(alt)}"
           onerror="this.style.display='none';this.parentElement.textContent='💐'">
    </div>`;
}

/* =========================
   INITIALIZE
   ========================= */

function initialize() {
  products = loadData(STORAGE.products, null);
  users = loadData(STORAGE.users, []);
  orders = loadData(STORAGE.orders, []);
  cart = loadData(STORAGE.cart, []);
  settings = loadData(STORAGE.settings, null);

  if (!Array.isArray(products)) products = null;
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];
  if (!Array.isArray(cart)) cart = [];
  if (!settings || typeof settings !== "object") settings = null;

  if (!products) products = DEFAULT_PRODUCTS.map(item => ({ ...item }));
  if (!settings) settings = { ...DEFAULT_SETTINGS };

  products.forEach(product => {
    if (product.stock == null) product.stock = 0;
    if (!product.category) product.category = "Flowers";
    if (!product.description) product.description = "";
    if (!product.image) product.image = "";
  });

  updateStoreName();
  bindEvents();
  saveData();

  const sessionId = localStorage.getItem(STORAGE.session);
  const savedUser = users.find(user => user.id === sessionId);

  if (savedUser) {
    currentUser = savedUser;
    enterApplication();
  } else {
    currentUser = null;
    showAuthentication();
  }

  if (!localStorage.getItem(STORAGE.setup)) {
    showFirstTimeSetup();
  }
}

function updateStoreName() {
  const name = settings.storeName || "Petal & Vine";

  document.querySelectorAll("#storeName, footer span:first-child").forEach(element => {
    element.textContent = element.id === "storeName" ? name : "✿ " + name;
  });

  document.title = name + " | Flower Shop";
}

/* =========================
   FIRST-TIME ADMIN SETUP
   ========================= */

function showFirstTimeSetup() {
  if (localStorage.getItem(STORAGE.setup)) return;

  const overlay = document.createElement("div");
  overlay.className = "setup-overlay";
  overlay.id = "firstSetupOverlay";

  overlay.innerHTML = `
    <div class="setup-box">
      <p class="eyebrow">WELCOME TO YOUR STORE</p>
      <h2>Create your admin account</h2>
      <p>Set up your administrator username and password to manage your flower shop.</p>

      <form id="firstSetupForm">
        <label>
          Admin name
          <input id="firstAdminName" required maxlength="70"
                 placeholder="Your name">
        </label>

        <label>
          Admin username
          <input id="firstAdminUsername" required maxlength="40"
                 value="admin" autocomplete="username">
        </label>

        <label>
          Admin password
          <div class="password-wrap">
            <input id="firstAdminPassword" type="password"
                   required minlength="6" autocomplete="new-password"
                   placeholder="At least 6 characters">
            <button type="button" class="eye-btn"
                    data-toggle-password="firstAdminPassword">👁</button>
          </div>
        </label>

        <label>
          Confirm password
          <input id="firstAdminConfirm" type="password"
                 required minlength="6" placeholder="Repeat password">
        </label>

        <button class="btn primary full" type="submit">
          Create administrator
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("firstSetupForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("firstAdminName").value.trim();
    const username = document.getElementById("firstAdminUsername").value.trim();
    const password = document.getElementById("firstAdminPassword").value;
    const confirm = document.getElementById("firstAdminConfirm").value;

    if (!name || !username || password.length < 6) {
      return notify("Please complete all fields correctly.");
    }

    if (password !== confirm) {
      return notify("Passwords do not match.");
    }

    const admin = {
      id: createId("ADMIN"),
      name,
      email: "",
      username,
      password,
      role: "admin",
      createdAt: new Date().toISOString()
    };

    users = users.filter(user => user.role !== "admin");
    users.push(admin);

    settings.adminName = name;
    settings.adminUsername = username;

    localStorage.setItem(STORAGE.setup, "true");
    saveData();

    overlay.remove();
    notify("Admin account created! You can now log in.");
  });
}

/* =========================
   EVENT LISTENERS
   ========================= */

function bindEvents() {
  document.getElementById("loginForm")?.addEventListener("submit", login);
  document.getElementById("registerForm")?.addEventListener("submit", register);
  document.getElementById("productForm")?.addEventListener("submit", saveProduct);
  document.getElementById("storeSettingsForm")?.addEventListener("submit", saveStoreSettings);
  document.getElementById("adminAccountForm")?.addEventListener("submit", updateAdminAccount);

  document.getElementById("productSearch")?.addEventListener("input", renderProducts);

  document.getElementById("productImage")?.addEventListener("change", handleImageUpload);

  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
  });

  document.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.addEventListener("click", () => showAdminTab(button.dataset.adminTab));
  });

  document.addEventListener("click", event => {
    const toggle = event.target.closest("[data-toggle-password]");
    if (toggle) {
      const input = document.getElementById(toggle.dataset.togglePassword);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
        toggle.setAttribute(
          "aria-label",
          input.type === "password" ? "Show password" : "Hide password"
        );
      }
    }
  });
}

/* =========================
   AUTHENTICATION
   ========================= */

function showAuthentication() {
  document.getElementById("authPage")?.classList.remove("hidden");
  document.getElementById("app")?.classList.add("hidden");
  document.getElementById("customerNav")?.classList.add("hidden");
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm?.classList.toggle("hidden", tab !== "login");
  registerForm?.classList.toggle("hidden", tab !== "register");

  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
}

function login(event) {
  event.preventDefault();

  const identity = document.getElementById("loginIdentity").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  const user = users.find(item => {
    const username = String(item.username || "").toLowerCase();
    const email = String(item.email || "").toLowerCase();

    return (username === identity || email === identity) &&
      item.password === password;
  });

  if (!user) {
    return notify("Incorrect username, email, or password.");
  }

  currentUser = user;
  localStorage.setItem(STORAGE.session, user.id);

  document.getElementById("loginForm").reset();

  enterApplication();
  notify("Welcome, " + user.name + "!");
}

function register(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;

  if (name.length < 2 || password.length < 6) {
    return notify("Please enter a valid name and password.");
  }

  if (users.some(user => String(user.email || "").toLowerCase() === email)) {
    return notify("An account with this email already exists.");
  }

  const user = {
    id: createId("USER"),
    name,
    email,
    username: "",
    password,
    role: "customer",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  currentUser = user;

  localStorage.setItem(STORAGE.session, user.id);
  saveData();

  document.getElementById("registerForm").reset();

  enterApplication();
  notify("Your account has been created!");
}

function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE.session);

  cart = [];
  saveData();

  showAuthentication();
  switchAuthTab("login");
  notify("You have logged out.");
}

function enterApplication() {
  document.getElementById("authPage")?.classList.add("hidden");
  document.getElementById("app")?.classList.remove("hidden");
  document.getElementById("customerNav")?.classList.remove("hidden");

  const adminButton = document.getElementById("adminNavButton");
  adminButton?.classList.toggle("hidden", !isAdmin());

  renderProducts();
  updateCartCount();
  updateStoreName();

  showPage("shopPage");

  if (isAdmin()) {
    renderAdmin();
  }
}

/* =========================
   PAGE NAVIGATION
   ========================= */

function showPage(pageId) {
  if (!currentUser) {
    showAuthentication();
    return;
  }

  if (pageId === "adminPage" && !isAdmin()) {
    notify("Administrator access only.");
    return;
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  document.getElementById(pageId)?.classList.remove("hidden");

  if (pageId === "shopPage") renderProducts();
  if (pageId === "cartPage") renderCart();
  if (pageId === "transactionsPage") renderMyOrders();

  if (pageId === "adminPage") {
    renderAdmin();
    showAdminTab(currentAdminTab);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================
   SHOP PRODUCTS
   ========================= */

function renderProducts() {
  const container = document.getElementById("shopProducts");
  if (!container) return;

  const search = (
    document.getElementById("productSearch")?.value || ""
  ).toLowerCase().trim();

  const filtered = products.filter(product => {
    return [
      product.name,
      product.category,
      product.description
    ].join(" ").toLowerCase().includes(search);
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        No flowers found. Try another search.
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(product => `
    <article class="product-card">
      ${product.image
        ? `<div class="product-photo">
             <img src="${escapeHTML(product.image)}"
                  alt="${escapeHTML(product.name)}"
                  onerror="this.style.display='none';this.parentElement.textContent='💐'">
           </div>`
        : `<div class="product-photo">💐</div>`
      }

      <div class="product-info">
        <span class="eyebrow">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description)}</p>

        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="stock">
            ${product.stock > 0 ? product.stock + " available" : "Out of stock"}
          </span>
        </div>

        <div class="product-actions">
          <button class="btn primary"
            onclick="addToCart('${product.id}')"
            ${product.stock <= 0 ? "disabled" : ""}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

/* =========================
   SHOPPING CART
   ========================= */

function addToCart(productId) {
  const product = getProduct(productId);

  if (!product) return notify("Product not found.");
  if (product.stock <= 0) return notify("This product is out of stock.");

  const existing = cart.find(item => item.productId === productId);
  const quantity = existing ? existing.quantity : 0;

  if (quantity >= product.stock) {
    return notify("You cannot add more than the available stock.");
  }

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      productId,
      quantity: 1
    });
  }

  saveData();
  updateCartCount();
  notify(product.name + " added to cart.");
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const element = document.getElementById("cartCount");

  if (element) element.textContent = count;
}

function changeQuantity(productId, change) {
  const item = cart.find(entry => entry.productId === productId);
  const product = getProduct(productId);

  if (!item || !product) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    cart = cart.filter(entry => entry.productId !== productId);
  } else if (newQuantity > product.stock) {
    notify("You have reached the available stock.");
    return;
  } else {
    item.quantity = newQuantity;
  }

  saveData();
  updateCartCount();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);

  saveData();
  updateCartCount();
  renderCart();

  notify("Item removed from cart.");
}

function calculateCartTotal() {
  return cart.reduce((total, item) => {
    const product = getProduct(item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");

  if (!container || !summary) return;

  cart = cart.filter(item => getProduct(item.productId));

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:45px">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Explore our collection and add some beautiful flowers.</p>
        <button class="btn primary" onclick="showPage('shopPage')">
          Continue shopping
        </button>
      </div>`;

    summary.innerHTML = "";
    saveData();
    updateCartCount();
    return;
  }

  container.innerHTML = cart.map(item => {
    const product = getProduct(item.productId);

    return `
      <div class="cart-row">
        ${product.image
          ? `<div class="product-photo">
               <img src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}">
             </div>`
          : `<div class="product-photo">💐</div>`
        }

        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p class="price">${money(product.price)}</p>
          <small>Subtotal: ${money(product.price * item.quantity)}</small>
        </div>

        <div class="qty-controls">
          <button onclick="changeQuantity('${product.id}',-1)">−</button>
          <strong>${item.quantity}</strong>
          <button onclick="changeQuantity('${product.id}',1)">+</button>
          <button onclick="removeFromCart('${product.id}')"
                  title="Remove item">✕</button>
        </div>
      </div>`;
  }).join("");

  const total = calculateCartTotal();

  summary.innerHTML = `
    <h2>Order summary</h2>
    <div class="summary-line">
      <span>Items</span>
      <span>${cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
    </div>
    <div class="summary-line">
      <span>Subtotal</span>
      <strong>${money(total)}</strong>
    </div>
    <div class="summary-line summary-total">
      <span>Total</span>
      <span>${money(total)}</span>
    </div>
    <button class="btn primary full" onclick="checkout()">
      Proceed to checkout
    </button>
    <button class="btn secondary full" onclick="showPage('shopPage')">
      Continue shopping
    </button>
  `;

  updateCartCount();
}

/* =========================
   CHECKOUT
   ========================= */

function checkout() {
  if (!currentUser || isAdmin()) {
    return notify("Please log in with a customer account to order.");
  }

  if (!cart.length) {
    return notify("Your cart is empty.");
  }

  const invalid = cart.find(item => {
    const product = getProduct(item.productId);
    return !product || item.quantity > product.stock;
  });

  if (invalid) {
    return notify("Some items no longer have enough stock. Please update your cart.");
  }

  const name = prompt("Enter your full name:", currentUser.name);
  if (name === null) return;

  if (name.trim().length < 2) {
    return notify("Please enter your full name.");
  }

  const phone = prompt("Enter your contact number:");
  if (phone === null) return;

  if (phone.trim().length < 7) {
    return notify("Please enter a valid contact number.");
  }

  const address = prompt("Enter your complete delivery address:");
  if (address === null) return;

  if (address.trim().length < 8) {
    return notify("Please enter a complete delivery address.");
  }

  const payment = prompt(
    "Choose payment method:\n1 - Cash on Delivery\n2 - GCash\n3 - Bank Transfer",
    "1"
  );

  if (payment === null) return;

  const paymentMethods = {
    "1": "Cash on Delivery",
    "2": "GCash",
    "3": "Bank Transfer"
  };

  if (!paymentMethods[payment.trim()]) {
    return notify("Please select 1, 2, or 3.");
  }

  const total = calculateCartTotal();

  const confirmed = confirm(
    "Confirm your order?\n\n" +
    "Customer: " + name.trim() + "\n" +
    "Address: " + address.trim() + "\n" +
    "Payment: " + paymentMethods[payment.trim()] + "\n" +
    "Total: " + money(total)
  );

  if (!confirmed) return;

  const orderItems = cart.map(item => {
    const product = getProduct(item.productId);

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image,
      subtotal: product.price * item.quantity
    };
  });

  orderItems.forEach(item => {
    const product = getProduct(item.productId);
    product.stock -= item.quantity;
  });

  const order = {
    id: createId("ORDER"),
    userId: currentUser.id,
    customerName: name.trim(),
    email: currentUser.email || "",
    phone: phone.trim(),
    address: address.trim(),
    payment: paymentMethods[payment.trim()],
    items: orderItems,
    total,
    status: "Pending",
    date: new Date().toISOString(),
    receiptNumber: createId("REC")
  };

  orders.unshift(order);
  cart = [];

  saveData();
  updateCartCount();
  renderProducts();

  notify("Your order has been placed successfully!");
  showPage("transactionsPage");
}

/* =========================
   CUSTOMER ORDER HISTORY
   ========================= */

function renderMyOrders() {
  const container = document.getElementById("myOrders");
  if (!container || !currentUser) return;

  const myOrders = orders.filter(order => order.userId === currentUser.id);

  if (!myOrders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:45px">🌷</div>
        <h3>No orders yet</h3>
        <p>Your orders will appear here after checkout.</p>
        <button class="btn primary" onclick="showPage('shopPage')">
          Shop flowers
        </button>
      </div>`;
    return;
  }

  container.innerHTML = myOrders.map(order => `
    <div class="order-card">
      <div class="order-top">
        <div>
          <h3>${escapeHTML(order.id)}</h3>
          <small>${new Date(order.date).toLocaleString("en-PH")}</small>
        </div>
        <strong>${escapeHTML(order.status)}</strong>
      </div>

      <p>
        ${order.items.map(item =>
          `${escapeHTML(item.name)} × ${item.quantity}`
        ).join("<br>")}
      </p>

      <div class="summary-line">
        <span>Payment</span>
        <span>${escapeHTML(order.payment)}</span>
      </div>

      <div class="summary-line summary-total">
        <span>Total</span>
        <span>${money(order.total)}</span>
      </div>

      <button class="btn secondary"
              onclick="printReceipt('${order.id}')">
        Print receipt
      </button>
    </div>
  `).join("");
}

/* =========================
   ADMIN NAVIGATION
   ========================= */

function showAdminTab(tab) {
  if (!isAdmin()) return;

  currentAdminTab = tab;

  document.querySelectorAll(".admin-panel").forEach(panel => {
    panel.classList.add("hidden");
  });

  document.getElementById("admin" + capitalize(tab))?.classList.remove("hidden");

  document.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.adminTab === tab);
  });

  renderAdminTab(tab);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderAdmin() {
  if (!isAdmin()) return;
  renderAdminTab(currentAdminTab);
}

function renderAdminTab(tab) {
  switch (tab) {
    case "overview":
      renderOverview();
      break;
    case "products":
      renderInventory();
      break;
    case "orders":
      renderAllOrders();
      break;
    case "customers":
      renderCustomers();
      break;
    case "receipts":
      renderReceipts();
      break;
    case "settings":
      loadSettingsForm();
      break;
  }
}

/* =========================
   ADMIN OVERVIEW
   ========================= */

function renderOverview() {
  const stats = document.getElementById("statsGrid");
  const recent = document.getElementById("recentOrders");

  if (!stats || !recent) return;

  const totalSales = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + getOrderTotal(order), 0);

  const pending = orders.filter(order => order.status === "Pending").length;
  const customerCount = users.filter(user => user.role === "customer").length;

  const statItems = [
    ["Total sales", money(totalSales)],
    ["Total orders", orders.length],
    ["Customers", customerCount],
    ["Pending orders", pending]
  ];

  stats.innerHTML = statItems.map(item => `
    <div class="stat-card">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
    </div>
  `).join("");

  if (!orders.length) {
    recent.innerHTML = `<div class="empty-state">No orders have been placed yet.</div>`;
    return;
  }

  recent.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.slice(0, 5).map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${money(order.total)}</td>
              <td>${escapeHTML(order.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

/* =========================
   PRODUCT INVENTORY
   ========================= */

function renderInventory() {
  const container = document.getElementById("inventoryProducts");
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `<div class="empty-state">No products available.</div>`;
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="inventory-item">
      <div class="inventory-thumb">
        ${product.image
          ? `<img src="${escapeHTML(product.image)}"
                 alt="${escapeHTML(product.name)}"
                 onerror="this.style.display='none';this.parentElement.textContent='💐'">`
          : "💐"
        }
      </div>

      <div>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${money(product.price)} · Stock: ${product.stock}</p>
        <p>${escapeHTML(product.category)}</p>
      </div>

      <div class="inventory-actions">
        <button onclick="editProduct('${product.id}')">Edit</button>
        <button class="delete" onclick="deleteProduct('${product.id}')">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

function resetProductForm(scrollToForm = false) {
  const form = document.getElementById("productForm");
  if (!form) return;

  form.reset();

  document.getElementById("productId").value = "";
  document.getElementById("productFormTitle").textContent = "Add a product";
  document.getElementById("saveProductButton").textContent = "Save product";

  pendingProductImage = "";

  const preview = document.getElementById("productImagePreview");
  const noImage = document.getElementById("noImageText");

  preview.src = "";
  preview.classList.add("hidden");
  noImage.classList.remove("hidden");

  if (scrollToForm) {
    document.getElementById("productEditor").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function editProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productDescription").value = product.description;

  pendingProductImage = product.image || "";

  const preview = document.getElementById("productImagePreview");
  const noImage = document.getElementById("noImageText");

  if (pendingProductImage) {
    preview.src = pendingProductImage;
    preview.classList.remove("hidden");
    noImage.classList.add("hidden");
  } else {
    preview.classList.add("hidden");
    noImage.classList.remove("hidden");
  }

  document.getElementById("productFormTitle").textContent = "Edit product";
  document.getElementById("saveProductButton").textContent = "Update product";

  document.getElementById("productEditor").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    return notify("Please choose a valid image.");
  }

  if (file.size > 1024 * 1024) {
    event.target.value = "";
    return notify("Image is too large. Please choose an image under 1 MB.");
  }

  const reader = new FileReader();

  reader.onload = () => {
    pendingProductImage = reader.result;

    const preview = document.getElementById("productImagePreview");
    const noImage = document.getElementById("noImageText");

    preview.src = pendingProductImage;
    preview.classList.remove("hidden");
    noImage.classList.add("hidden");
  };

  reader.onerror = () => notify("Unable to read the selected image.");
  reader.readAsDataURL(file);
}

function saveProduct(event) {
  event.preventDefault();

  if (!isAdmin()) return notify("Administrator access only.");

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const category = document.getElementById("productCategory").value.trim() || "Flowers";
  const description = document.getElementById("productDescription").value.trim();

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return notify("Please enter valid product details.");
  }

  const duplicate = products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    return notify("A product with this name already exists.");
  }

  if (id) {
    const product = getProduct(id);
    if (!product) return notify("Product not found.");

    product.name = name;
    product.price = price;
    product.stock = stock;
    product.category = category;
    product.description = description;

    if (pendingProductImage) {
      product.image = pendingProductImage;
    }

    notify("Product updated successfully.");
  } else {
    products.push({
      id: createId("PROD"),
      name,
      price,
      stock,
      category,
      description,
      image: pendingProductImage || ""
    });

    notify("New product added successfully.");
  }

  saveData();
  resetProductForm();
  renderInventory();
  renderProducts();
}

function deleteProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

  products = products.filter(item => item.id !== productId);
  cart = cart.filter(item => item.productId !== productId);

  saveData();
  updateCartCount();
  renderInventory();
  renderProducts();

  notify("Product deleted.");
}

/* =========================
   ADMIN ORDER MANAGEMENT
   ========================= */

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Completed",
  "Cancelled"
];

function renderAllOrders() {
  const container = document.getElementById("allOrders");
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">No customer orders yet.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Contact</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>
                ${escapeHTML(order.id)}
                <br><small>${new Date(order.date).toLocaleDateString("en-PH")}</small>
              </td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${escapeHTML(order.phone)}</td>
              <td>${money(order.total)}</td>
              <td>${escapeHTML(order.payment)}</td>
              <td>
                <select class="status-select"
                        onchange="updateOrderStatus('${order.id}',this.value)">
                  ${ORDER_STATUSES.map(status => `
                    <option value="${status}"
                      ${order.status === status ? "selected" : ""}>
                      ${status}
                    </option>
                  `).join("")}
                </select>
              </td>
              <td>
                <button class="btn secondary"
                        onclick="printReceipt('${order.id}')">
                  Print
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function updateOrderStatus(orderId, status) {
  if (!isAdmin()) return;

  const order = orders.find(item => item.id === orderId);
  if (!order || !ORDER_STATUSES.includes(status)) return;

  if (order.status === "Cancelled" && status !== "Cancelled") {
    return notify("Cancelled orders cannot be reopened in this demo.");
  }

  if (status === "Cancelled" && order.status !== "Cancelled") {
    const confirmed = confirm("Cancel this order and return its items to stock?");
    if (!confirmed) {
      renderAllOrders();
      return;
    }

    order.items.forEach(item => {
      const product = getProduct(item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  saveData();
  renderAllOrders();
  renderOverview();
  renderInventory();
  renderProducts();

  notify("Order status updated.");
}

/* =========================
   CUSTOMER MANAGEMENT
   ========================= */

function renderCustomers() {
  const container = document.getElementById("customerList");
  if (!container) return;

  const customers = users.filter(user => user.role === "customer");

  if (!customers.length) {
    container.innerHTML = `<div class="empty-state">No registered customers yet.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date Joined</th>
            <th>Orders</th>
            <th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(user => {
            const customerOrders = orders.filter(order => order.userId === user.id);
            const spent = customerOrders
              .filter(order => order.status !== "Cancelled")
              .reduce((sum, order) => sum + getOrderTotal(order), 0);

            return `
              <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>${new Date(user.createdAt).toLocaleDateString("en-PH")}</td>
                <td>${customerOrders.length}</td>
                <td>${money(spent)}</td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

/* =========================
   RECEIPTS
   ========================= */

function renderReceipts() {
  const container = document.getElementById("receiptList");
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = `<div class="empty-state">No receipts available yet.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Receipt number</th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>${escapeHTML(order.receiptNumber || order.id)}</td>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${new Date(order.date).toLocaleDateString("en-PH")}</td>
              <td>${money(order.total)}</td>
              <td>
                <button class="btn primary"
                        onclick="printReceipt('${order.id}')">
                  View / Print
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function printReceipt(orderId) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return notify("Receipt not found.");

  const receiptWindow = window.open("", "_blank");

  if (!receiptWindow) {
    return notify("Please allow pop-ups to print receipts.");
  }

  const rows = order.items.map(item => `
    <tr>
      <td>${escapeHTML(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${escapeHTML(order.id)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 750px;
          margin: 30px auto;
          padding: 20px;
          color: #342b30;
        }
        h1 { color: #7b3f5b; text-align: center; }
        h2 { text-align: center; font-size: 16px; }
        .muted { color: #81747b; font-size: 13px; }
        .details { line-height: 1.8; margin: 25px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px 8px; border-bottom: 1px solid #eadfe3; text-align: left; }
        th { background: #f6e8ed; }
        .total { text-align: right; font-size: 21px; font-weight: bold; margin-top: 20px; }
        .center { text-align: center; }
        .print-btn { padding: 12px 20px; background: #7b3f5b; color: white; border: 0; cursor: pointer; }
        @media print { .print-btn { display: none; } body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>✿ ${escapeHTML(settings.storeName)}</h1>
      <h2>OFFICIAL ORDER RECEIPT</h2>
      <p class="center muted">Thank you for shopping with us!</p>

      <div class="details">
        <strong>Receipt:</strong> ${escapeHTML(order.receiptNumber || order.id)}<br>
        <strong>Order ID:</strong> ${escapeHTML(order.id)}<br>
        <strong>Date:</strong> ${new Date(order.date).toLocaleString("en-PH")}<br>
        <strong>Customer:</strong> ${escapeHTML(order.customerName)}<br>
        <strong>Email:</strong> ${escapeHTML(order.email)}<br>
        <strong>Phone:</strong> ${escapeHTML(order.phone)}<br>
        <strong>Address:</strong> ${escapeHTML(order.address)}<br>
        <strong>Payment:</strong> ${escapeHTML(order.payment)}<br>
        <strong>Status:</strong> ${escapeHTML(order.status)}
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="total">Total: ${money(order.total)}</div>

      <p class="center muted" style="margin-top:40px">
        Made with care, one bloom at a time. 🌷
      </p>

      <div class="center">
        <button class="print-btn" onclick="window.print()">Print receipt</button>
      </div>
    </body>
    </html>
  `);

  receiptWindow.document.close();
}

/* =========================
   STORE SETTINGS
   ========================= */

function loadSettingsForm() {
  const storeName = document.getElementById("settingStoreName");
  const adminName = document.getElementById("settingAdminName");
  const username = document.getElementById("settingAdminUsername");

  if (storeName) storeName.value = settings.storeName || "";
  if (adminName) adminName.value = settings.adminName || "";
  if (username) username.value = settings.adminUsername || "";
}

function saveStoreSettings(event) {
  event.preventDefault();

  if (!isAdmin()) return notify("Administrator access only.");

  const storeName = document.getElementById("settingStoreName").value.trim();
  const adminName = document.getElementById("settingAdminName").value.trim();

  if (!storeName || !adminName) {
    return notify("Please fill in all store settings.");
  }

  settings.storeName = storeName;
  settings.adminName = adminName;

  const admin = users.find(user => user.role === "admin");
  if (admin) {
    admin.name = adminName;
    currentUser = admin;
  }

  saveData();
  updateStoreName();
  loadSettingsForm();

  notify("Store settings saved successfully.");
}

function updateAdminAccount(event) {
  event.preventDefault();

  if (!isAdmin()) return notify("Administrator access only.");

  const username = document.getElementById("settingAdminUsername").value.trim();
  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("newAdminPassword").value;

  const admin = users.find(user => user.id === currentUser.id);

  if (!admin) return notify("Admin account not found.");

  if (admin.password !== currentPassword) {
    return notify("Your current password is incorrect.");
  }

  if (username.length < 3) {
    return notify("Username must contain at least 3 characters.");
  }

  if (newPassword.length < 6) {
    return notify("New password must contain at least 6 characters.");
  }

  const duplicate = users.some(user =>
    user.id !== admin.id &&
    String(user.username || "").toLowerCase() === username.toLowerCase()
  );

  if (duplicate) {
    return notify("That username is already in use.");
  }

  admin.username = username;
  admin.password = newPassword;

  settings.adminUsername = username;
  currentUser = admin;

  saveData();

  document.getElementById("adminAccountForm").reset();
  loadSettingsForm();

  notify("Admin account updated successfully.");
}

/* =========================
   START WEBSITE
   ========================= */

document.addEventListener("DOMContentLoaded", initialize);
