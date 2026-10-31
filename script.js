/* =====================================================
   PETAL & VINE FLOWER BOUTIQUE
   Complete JavaScript
   Front-end demonstration using localStorage
===================================================== */

"use strict";

/* -------------------- STORAGE -------------------- */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  cart: "pv_cart",
  session: "pv_session"
};

const $ = id => document.getElementById(id);

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let users = read(STORAGE.users, []);
let products = read(STORAGE.products, []);
let orders = read(STORAGE.orders, []);
let carts = read(STORAGE.cart, {});
let currentUser = null;
let currentPage = "shop";
let pendingPurchase = null;
let selectedImage = "";
let toastTimer = null;

/* -------------------- HELPERS -------------------- */

function makeId(prefix = "ID") {
  return prefix + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);
}

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

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function setMessage(id, message, success = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "#477b5a" : "#b64b55";
}

function getCart() {
  if (!currentUser) return [];
  return carts[currentUser.id] || [];
}

function setCart(items) {
  if (!currentUser) return;

  carts[currentUser.id] = items;
  save(STORAGE.cart, carts);
  updateCartCount();
}

function findProduct(id) {
  return products.find(product => product.id === id);
}

function findUser(id) {
  return users.find(user => user.id === id);
}

function isAdmin() {
  return currentUser && currentUser.role === "admin";
}

function getImageMarkup(product, extraClass = "") {
  const image = product.image || "💐";

  if (/^(https?:\/\/|data:image\/)/i.test(image)) {
    return `<div class="product-image ${extraClass}">
      <img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}"
        onerror="this.style.display='none';this.parentElement.textContent='💐'">
    </div>`;
  }

  return `<div class="product-image ${extraClass}">
    ${escapeHTML(image)}
  </div>`;
}

function emptyState(title, description) {
  return `<div class="empty-state">
    <strong>${escapeHTML(title)}</strong>
    ${escapeHTML(description)}
  </div>`;
}

function persistAll() {
  save(STORAGE.users, users);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);
  save(STORAGE.cart, carts);
}

/* -------------------- DEFAULT DATA -------------------- */

function initializeData() {
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];
  if (!carts || typeof carts !== "object") carts = {};

  /*
    Initial admin account.
    Change the username and password after logging in.
  */
  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: makeId("USR"),
      name: "Shop Administrator",
      username: "admin",
      password: "admin123",
      role: "admin",
      phone: "",
      address: "",
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  const defaultProducts = [
    {
      name: "Classic Red Roses",
      category: "Roses",
      description: "A timeless bouquet of beautiful red roses.",
      price: 850,
      stock: 30,
      image: "🌹"
    },
    {
      name: "Pink Rose Bouquet",
      category: "Roses",
      description: "Soft pink roses for sweet celebrations.",
      price: 780,
      stock: 25,
      image: "🌸"
    },
    {
      name: "White Roses",
      category: "Roses",
      description: "Elegant white roses for special moments.",
      price: 900,
      stock: 20,
      image: "🤍"
    },
    {
      name: "Sunflower Bliss",
      category: "Sunflowers",
      description: "Bright sunflowers to make someone's day.",
      price: 650,
      stock: 25,
      image: "🌻"
    },
    {
      name: "Tulip Garden",
      category: "Tulips",
      description: "A colorful arrangement of fresh tulips.",
      price: 950,
      stock: 18,
      image: "🌷"
    },
    {
      name: "Purple Dreams",
      category: "Mixed Flowers",
      description: "A charming purple floral arrangement.",
      price: 880,
      stock: 16,
      image: "💜"
    },
    {
      name: "Baby's Breath",
      category: "Mixed Flowers",
      description: "Delicate little blooms for a gentle gift.",
      price: 550,
      stock: 30,
      image: "🤍"
    },
    {
      name: "Pink Carnations",
      category: "Carnations",
      description: "Lovely carnations for someone special.",
      price: 720,
      stock: 22,
      image: "🌺"
    },
    {
      name: "Orchid Elegance",
      category: "Orchids",
      description: "Beautiful orchids with a graceful finish.",
      price: 1200,
      stock: 12,
      image: "🪻"
    },
    {
      name: "Daisy Delight",
      category: "Daisies",
      description: "Cheerful daisies in a lovely arrangement.",
      price: 600,
      stock: 28,
      image: "🌼"
    },
    {
      name: "Mixed Romance",
      category: "Mixed Flowers",
      description: "A romantic mix of seasonal flowers.",
      price: 1100,
      stock: 15,
      image: "💐"
    },
    {
      name: "White Lily Bouquet",
      category: "Lilies",
      description: "Elegant lilies with a soft fragrance.",
      price: 980,
      stock: 14,
      image: "🌼"
    },
    {
      name: "Peach Roses",
      category: "Roses",
      description: "Warm peach roses for thoughtful gifts.",
      price: 820,
      stock: 20,
      image: "🌹"
    },
    {
      name: "Blue Hydrangea",
      category: "Hydrangeas",
      description: "A lovely arrangement of blue blooms.",
      price: 1350,
      stock: 10,
      image: "💠"
    },
    {
      name: "Lavender Love",
      category: "Mixed Flowers",
      description: "A calming lavender-inspired bouquet.",
      price: 890,
      stock: 17,
      image: "🪻"
    },
    {
      name: "Garden Party",
      category: "Mixed Flowers",
      description: "A cheerful mix of garden favorites.",
      price: 1050,
      stock: 13,
      image: "💐"
    },
    {
      name: "Mini Rose Bouquet",
      category: "Roses",
      description: "A smaller bouquet for simple surprises.",
      price: 450,
      stock: 35,
      image: "🌹"
    },
    {
      name: "Golden Sunflowers",
      category: "Sunflowers",
      description: "A bright golden bouquet full of joy.",
      price: 750,
      stock: 19,
      image: "🌻"
    }
  ];

  if (products.length === 0) {
    products = defaultProducts.map(product => ({
      id: makeId("PRD"),
      ...product
    }));
  }

  persistAll();
}

initializeData();

/* -------------------- AUTHENTICATION -------------------- */

function showLogin() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");

  $("authSwitch").classList.remove("hidden");
  $("loginSwitch").classList.add("hidden");

  $("authTitle").textContent = "Welcome Back";
  $("authSubtitle").textContent =
    "Sign in to continue to your flower shop.";

  setMessage("loginMessage", "");
  setMessage("registerMessage", "");
}

function showRegister() {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");

  $("authSwitch").classList.add("hidden");
  $("loginSwitch").classList.remove("hidden");

  $("authTitle").textContent = "Create Account";
  $("authSubtitle").textContent =
    "Register your customer account.";

  setMessage("loginMessage", "");
  setMessage("registerMessage", "");
}

function togglePassword(inputId, button) {
  const input = $(inputId);
  if (!input) return;

  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  button.textContent = showing ? "Show" : "Hide";
}

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (name.length < 2) {
    return setMessage("registerMessage", "Please enter your full name.");
  }

  if (username.length < 3) {
    return setMessage("registerMessage",
      "Username must have at least 3 characters.");
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return setMessage("registerMessage",
      "Username may contain letters, numbers, dots, _ or - only.");
  }

  if (password.length < 6) {
    return setMessage("registerMessage",
      "Password must have at least 6 characters.");
  }

  if (password !== confirm) {
    return setMessage("registerMessage", "Passwords do not match.");
  }

  const exists = users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (exists) {
    return setMessage("registerMessage", "Username is already taken.");
  }

  users.push({
    id: makeId("USR"),
    name,
    username,
    password,
    role: "customer",
    phone: "",
    address: "",
    active: true,
    createdAt: new Date().toISOString()
  });

  save(STORAGE.users, users);

  $("registerForm").reset();
  showLogin();
  $("loginUsername").value = username;

  setMessage("loginMessage",
    "Account created successfully. Please log in.", true);
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(account =>
    account.username.toLowerCase() === username &&
    account.password === password
  );

  if (!user) {
    return setMessage("loginMessage",
      "Incorrect username or password.");
  }

  if (user.active === false) {
    return setMessage("loginMessage",
      "This account has been disabled. Contact the administrator.");
  }

  currentUser = user;
  localStorage.setItem(STORAGE.session, user.id);

  $("loginForm").reset();
  setMessage("loginMessage", "");

  openApplication();
});

function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE.session);

  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("headerUser").textContent = "";

  showLogin();
  $("loginPassword").value = "";
  $("loginUsername").value = "";

  showToast("You have logged out.");
}

function openApplication() {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  $("headerUser").textContent =
    `${currentUser.name} · ${currentUser.role}`;

  $("roleLabel").textContent =
    isAdmin() ? "Administrator" : "Customer";

  $("welcomeText").textContent =
    `Welcome, ${currentUser.name}!`;

  $("customerNav").classList.toggle("hidden", isAdmin());
  $("adminNav").classList.toggle("hidden", !isAdmin());

  if (isAdmin()) {
    adminPage("dashboard");
  } else {
    customerPage("shop");
  }
}

function restoreSession() {
  const sessionId = localStorage.getItem(STORAGE.session);
  if (!sessionId) return;

  const user = findUser(sessionId);

  if (!user || user.active === false) {
    localStorage.removeItem(STORAGE.session);
    return;
  }

  currentUser = user;
  openApplication();
}

/* -------------------- NAVIGATION -------------------- */

function hideAllPages() {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.remove("active");
  });
}

function activatePage(pageId, button) {
  hideAllPages();

  const page = $(pageId);
  if (page) page.classList.remove("hidden");

  if (button) button.classList.add("active");
}

function customerPage(page, button) {
  if (!currentUser || isAdmin()) return;

  const pageTitles = {
    shop: "Shop Flowers",
    cart: "My Cart",
    orders: "My Orders",
    receipts: "My Receipts",
    transactions: "My Transactions",
    profile: "My Profile",
    about: "About Us"
  };

  currentPage = page;
  $("pageTitle").textContent = pageTitles[page] || "Petal & Vine";

  activatePage("customer-" + page, button);

  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "orders") renderCustomerOrders();
  if (page === "receipts") renderCustomerReceipts();
  if (page === "transactions") renderCustomerTransactions();
  if (page === "profile") renderProfile();

  updateCartCount();
}

function adminPage(page, button) {
  if (!currentUser || !isAdmin()) return;

  const pageTitles = {
    dashboard: "Admin Dashboard",
    products: "Manage Products",
    inventory: "Inventory Management",
    orders: "Customer Orders",
    users: "User Management",
    settings: "Admin Settings"
  };

  currentPage = page;
  $("pageTitle").textContent = pageTitles[page] || "Administration";

  activatePage("admin-" + page, button);

  if (page === "dashboard") renderDashboard();
  if (page === "products") renderAdminProducts();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderAdminOrders();
  if (page === "users") renderAdminUsers();
  if (page === "settings") renderSettings();
}

/* -------------------- CUSTOMER SHOP -------------------- */

function renderShop() {
  const container = $("shopProducts");
  if (!container) return;

  const search = $("productSearch").value.trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search) ||
    (product.description || "").toLowerCase().includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = emptyState(
      "No flowers found",
      "Try another search."
    );
    return;
  }

  container.innerHTML = filtered.map(product => `
    <article class="product-card">
      ${getImageMarkup(product)}
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.category)}</p>
        <p>${escapeHTML(product.description || "")}</p>

        <div class="price">${money(product.price)}</div>
        <div class="stock">
          ${product.stock > 0
            ? `${product.stock} available`
            : "Out of stock"}
        </div>

        <label class="quantity-label"
          for="quantity-${product.id}">Quantity</label>

        <input class="product-quantity"
          id="quantity-${product.id}"
          type="number" min="1" step="1"
          max="${Math.max(1, product.stock)}"
          value="1"
          ${product.stock <= 0 ? "disabled" : ""}>

        <div class="product-actions">
          <button class="btn outline"
            onclick="addToCart('${product.id}')"
            ${product.stock <= 0 ? "disabled" : ""}>
            Add to Cart
          </button>

          <button class="btn primary"
            onclick="buyNow('${product.id}')"
            ${product.stock <= 0 ? "disabled" : ""}>
            Buy Now
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

$("productSearch").addEventListener("input", renderShop);

function getChosenQuantity(productId) {
  const input = $("quantity-" + productId);
  const quantity = Number(input?.value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    showToast("Please enter a quantity of at least 1.");
    return null;
  }

  const product = findProduct(productId);

  if (!product) {
    showToast("Product not found.");
    return null;
  }

  if (quantity > product.stock) {
    showToast(`Only ${product.stock} item(s) are available.`);
    return null;
  }

  return quantity;
}

function addToCart(productId) {
  if (!currentUser || isAdmin()) return;

  const product = findProduct(productId);
  const quantity = getChosenQuantity(productId);

  if (!product || quantity === null) return;

  const cart = getCart();
  const existing = cart.find(item => item.productId === productId);
  const newQuantity = (existing?.quantity || 0) + quantity;

  if (newQuantity > product.stock) {
    return showToast(
      `Your cart cannot exceed the available stock of ${product.stock}.`
    );
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.push({ productId, quantity });
  }

  setCart(cart);
  showToast(`${product.name} added to your cart.`);
}

function buyNow(productId) {
  if (!currentUser || isAdmin()) return;

  const product = findProduct(productId);
  const quantity = getChosenQuantity(productId);

  if (!product || quantity === null) return;

  pendingPurchase = [{
    productId,
    quantity
  }];

  openCheckout(pendingPurchase);
}

/* -------------------- CART -------------------- */

function updateCartCount() {
  const count = getCart().reduce((total, item) =>
    total + Number(item.quantity || 0), 0
  );

  if ($("cartCount")) $("cartCount").textContent = count;
}

function renderCart() {
  const container = $("cartContent");
  if (!container) return;

  const cart = getCart().filter(item => findProduct(item.productId));

  if (!cart.length) {
    container.innerHTML = emptyState(
      "Your cart is empty",
      "Browse our flowers and add your favorites."
    );
    return;
  }

  let total = 0;

  const rows = cart.map(item => {
    const product = findProduct(item.productId);
    const subtotal = product.price * item.quantity;
    total += subtotal;

    return `
      <div class="cart-row">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p class="muted">${money(product.price)} each</p>
          <p class="muted">Available: ${product.stock}</p>
        </div>

        <div>
          <label for="cart-qty-${product.id}">Quantity</label>
          <input class="qty-input"
            id="cart-qty-${product.id}"
            type="number" min="1" step="1"
            max="${product.stock}"
            value="${item.quantity}"
            onchange="updateCartQuantity('${product.id}',this.value)">
        </div>

        <div>
          <strong>${money(subtotal)}</strong>
        </div>

        <div>
          <button class="btn danger small"
            onclick="removeFromCart('${product.id}')">
            Remove
          </button>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="panel">${rows}</div>

    <div class="cart-total">
      <p>Total Amount</p>
      <strong>${money(total)}</strong>
      <br><br>
      <button class="btn primary"
        onclick="checkoutCart()">
        Proceed to Checkout
      </button>
    </div>
  `;
}

function updateCartQuantity(productId, value) {
  const quantity = Number(value);
  const product = findProduct(productId);

  if (!product) return;

  if (!Number.isInteger(quantity) || quantity < 1) {
    showToast("Quantity must be at least 1.");
    renderCart();
    return;
  }

  if (quantity > product.stock) {
    showToast(`Only ${product.stock} item(s) are available.`);
    renderCart();
    return;
  }

  const cart = getCart();
  const item = cart.find(row => row.productId === productId);

  if (!item) return;

  item.quantity = quantity;
  setCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter(item =>
    item.productId !== productId
  );

  setCart(cart);
  renderCart();
  showToast("Item removed from cart.");
}

function checkoutCart() {
  const cart = getCart().filter(item => findProduct(item.productId));

  if (!cart.length) {
    return showToast("Your cart is empty.");
  }

  pendingPurchase = cart.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));

  openCheckout(pendingPurchase);
}

/* -------------------- CHECKOUT -------------------- */

function openCheckout(items) {
  if (!items || !items.length) return;

  for (const item of items) {
    const product = findProduct(item.productId);

    if (!product || item.quantity < 1 ||
        item.quantity > product.stock) {
      showToast("One or more items are no longer available.");
      closeModal("checkoutModal");
      return;
    }
  }

  pendingPurchase = items.map(item => ({ ...item }));

  const total = pendingPurchase.reduce((sum, item) => {
    const product = findProduct(item.productId);
    return sum + product.price * item.quantity;
  }, 0);

  $("checkoutSummary").innerHTML = `
    ${pendingPurchase.map(item => {
      const product = findProduct(item.productId);

      return `
        <div class="receipt-line">
          <span>${escapeHTML(product.name)} × ${item.quantity}</span>
          <strong>${money(product.price * item.quantity)}</strong>
        </div>
      `;
    }).join("")}
    <div class="receipt-total">Total: ${money(total)}</div>
    <p class="muted">Payment: Cash on Delivery (COD)</p>
  `;

  $("checkoutName").value = currentUser.name || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  $("checkoutModal").classList.remove("hidden");
}

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!currentUser || !pendingPurchase?.length) return;

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (name.length < 2) {
    return showToast("Please enter your complete name.");
  }

  if (phone.length < 7) {
    return showToast("Please enter a valid contact number.");
  }

  if (address.length < 8) {
    return showToast("Please enter your complete delivery address.");
  }

  /*
    Validate every product again before changing stock.
    Stock is reduced only when the order is placed.
  */
  for (const item of pendingPurchase) {
    const product = findProduct(item.productId);

    if (!product || !Number.isInteger(item.quantity) ||
        item.quantity < 1 || product.stock < item.quantity) {
      return showToast(
        "An item does not have enough stock. Please review your order."
      );
    }
  }

  const orderItems = pendingPurchase.map(item => {
    const product = findProduct(item.productId);

    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: Number(item.quantity),
      subtotal: Number(product.price) * Number(item.quantity)
    };
  });

  const total = orderItems.reduce((sum, item) =>
    sum + item.subtotal, 0
  );

  const order = {
    id: makeId("ORD"),
    receiptNo: "PV-" + Date.now(),
    userId: currentUser.id,
    customerName: name,
    username: currentUser.username,
    phone,
    address,
    items: orderItems,
    total,
    paymentMethod: "Cash on Delivery (COD)",
    paymentStatus: "Pending",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  /* Reduce stock after successful validation. */
  pendingPurchase.forEach(item => {
    const product = findProduct(item.productId);
    product.stock -= item.quantity;
  });

  /* Remove only the purchased quantities from the cart. */
  const cart = getCart();

  pendingPurchase.forEach(purchased => {
    const existing = cart.find(item =>
      item.productId === purchased.productId
    );

    if (existing) {
      existing.quantity -= purchased.quantity;

      if (existing.quantity <= 0) {
        const index = cart.indexOf(existing);
        cart.splice(index, 1);
      }
    }
  });

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.address = address;

  orders.unshift(order);
  pendingPurchase = null;

  persistAll();
  setCart(cart);

  $("checkoutForm").reset();
  closeModal("checkoutModal");

  renderReceipt(order);
  showToast("Your order has been placed successfully.");
});

function renderReceipt(order) {
  $("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>✿ Petal & Vine</h2>
      <p>Flower Boutique</p>
      <p class="muted">Order Receipt</p>

      <hr>

      <div class="receipt-line">
        <span>Receipt No.</span>
        <strong>${escapeHTML(order.receiptNo)}</strong>
      </div>

      <div class="receipt-line">
        <span>Order Date</span>
        <strong>${new Date(order.createdAt).toLocaleString()}</strong>
      </div>

      <div class="receipt-line">
        <span>Customer</span>
        <strong>${escapeHTML(order.customerName)}</strong>
      </div>

      <div class="receipt-line">
        <span>Contact</span>
        <strong>${escapeHTML(order.phone)}</strong>
      </div>

      <div class="receipt-line">
        <span>Address</span>
        <strong>${escapeHTML(order.address)}</strong>
      </div>

      <h3>Order Items</h3>

      ${order.items.map(item => `
        <div class="receipt-line">
          <span>
            ${escapeHTML(item.name)} × ${item.quantity}
            <br>
            <small>${money(item.price)} each</small>
          </span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="receipt-total">
        Total: ${money(order.total)}
      </div>

      <div class="receipt-line">
        <span>Payment Method</span>
        <strong>Cash on Delivery</strong>
      </div>

      <div class="receipt-line">
        <span>Payment Status</span>
        <strong>${escapeHTML(order.paymentStatus)}</strong>
      </div>

      <div class="receipt-line">
        <span>Order Status</span>
        <strong>${escapeHTML(order.status)}</strong>
      </div>

      <p>Thank you for shopping with Petal & Vine!</p>
      <p class="muted">Please keep this receipt for your records.</p>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function viewReceipt(orderId) {
  const order = orders.find(item => item.id === orderId);

  if (!order) return;

  if (!isAdmin() && order.userId !== currentUser.id) {
    return showToast("You cannot view this receipt.");
  }

  renderReceipt(order);
}

/* -------------------- CUSTOMER ORDERS -------------------- */

function renderCustomerOrders() {
  const container = $("customerOrders");
  if (!container) return;

  const myOrders = orders.filter(order =>
    order.userId === currentUser.id
  );

  if (!myOrders.length) {
    container.innerHTML = emptyState(
      "No orders yet",
      "Your placed orders will appear here."
    );
    return;
  }

  container.innerHTML = myOrders.map(order => `
    <div class="panel" style="margin-bottom:15px">
      <div class="section-heading">
        <div>
          <h3>${escapeHTML(order.receiptNo)}</h3>
          <p class="muted">
            ${new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span class="badge ${order.status === "Completed" ? "green" :
          order.status === "Cancelled" ? "red" : ""}">
          ${escapeHTML(order.status)}
        </span>
      </div>

      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="receipt-total">Total: ${money(order.total)}</div>

      <p class="muted">
        Payment: ${escapeHTML(order.paymentMethod)}
        · ${escapeHTML(order.paymentStatus)}
      </p>

      <button class="btn outline small"
        onclick="viewReceipt('${order.id}')">
        View Receipt
      </button>
    </div>
  `).join("");
}

function renderCustomerReceipts() {
  const container = $("customerReceipts");
  if (!container) return;

  const myOrders = orders.filter(order =>
    order.userId === currentUser.id
  );

  if (!myOrders.length) {
    container.innerHTML = emptyState(
      "No receipts available",
      "Your receipts will appear after placing an order."
    );
    return;
  }

  container.innerHTML = myOrders.map(order => `
    <div class="panel" style="margin-bottom:12px">
      <strong>${escapeHTML(order.receiptNo)}</strong>
      <p class="muted">
        ${new Date(order.createdAt).toLocaleString()}
      </p>
      <p>Total: <strong>${money(order.total)}</strong></p>
      <button class="btn primary small"
        onclick="viewReceipt('${order.id}')">
        View / Print Receipt
      </button>
    </div>
  `).join("");
}

function renderCustomerTransactions() {
  const container = $("customerTransactions");
  if (!container) return;

  const myOrders = orders.filter(order =>
    order.userId === currentUser.id
  );

  if (!myOrders.length) {
    container.innerHTML = emptyState(
      "No transactions yet",
      "Your COD transactions will appear here."
    );
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Receipt No.</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${myOrders.map(order => `
            <tr>
              <td>${escapeHTML(order.receiptNo)}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>${money(order.total)}</td>
              <td>COD</td>
              <td>${escapeHTML(order.paymentStatus)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* -------------------- CUSTOMER PROFILE -------------------- */

function renderProfile() {
  $("profileName").value = currentUser.name || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";
  $("profilePassword").value = "";
  setMessage("profileMessage", "");
}

$("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("profileName").value.trim();
  const username = $("profileUsername").value.trim();
  const phone = $("profilePhone").value.trim();
  const address = $("profileAddress").value.trim();
  const password = $("profilePassword").value;

  if (name.length < 2 || username.length < 3) {
    return setMessage("profileMessage",
      "Please enter a valid name and username.");
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return setMessage("profileMessage",
      "Username contains invalid characters.");
  }

  const duplicate = users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (duplicate) {
    return setMessage("profileMessage",
      "That username is already in use.");
  }

  if (password && password.length < 6) {
    return setMessage("profileMessage",
      "New password must have at least 6 characters.");
  }

  currentUser.name = name;
  currentUser.username = username;
  currentUser.phone = phone;
  currentUser.address = address;

  if (password) currentUser.password = password;

  save(STORAGE.users, users);

  $("welcomeText").textContent = `Welcome, ${currentUser.name}!`;
  $("headerUser").textContent =
    `${currentUser.name} · ${currentUser.role}`;

  setMessage("profileMessage", "Profile updated successfully.", true);
  showToast("Profile updated.");
});

/* -------------------- ADMIN DASHBOARD -------------------- */

function renderDashboard() {
  const revenue = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const completed = orders.filter(order =>
    order.status === "Completed"
  ).length;

  const pending = orders.filter(order =>
    order.status === "Pending"
  ).length;

  const customers = users.filter(user =>
    user.role === "customer"
  ).length;

  $("dashboardStats").innerHTML = `
    <div class="stat-card">
      <span>Total Products</span>
      <strong>${products.length}</strong>
    </div>

    <div class="stat-card">
      <span>Total Orders</span>
      <strong>${orders.length}</strong>
    </div>

    <div class="stat-card">
      <span>Customers</span>
      <strong>${customers}</strong>
    </div>

    <div class="stat-card">
      <span>Order Revenue</span>
      <strong>${money(revenue)}</strong>
    </div>

    <div class="stat-card">
      <span>Completed Orders</span>
      <strong>${completed}</strong>
    </div>

    <div class="stat-card">
      <span>Pending Orders</span>
      <strong>${pending}</strong>
    </div>
  `;

  const recent = orders.slice(0, 5);

  $("recentOrders").innerHTML = recent.length
    ? recent.map(order => `
        <div class="receipt-line">
          <span>
            <strong>${escapeHTML(order.receiptNo)}</strong>
            <br>
            <small>${escapeHTML(order.customerName)}</small>
          </span>
          <span>
            ${money(order.total)}
            <br>
            <small>${escapeHTML(order.status)}</small>
          </span>
        </div>
      `).join("")
    : emptyState("No orders yet", "New orders will appear here.");
}

/* -------------------- ADMIN PRODUCT MANAGEMENT -------------------- */

function renderAdminProducts() {
  const container = $("adminProducts");
  if (!container) return;

  const search = $("adminProductSearch").value.trim().toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  if (!filtered.length) {
    container.innerHTML = emptyState(
      "No products found",
      "Add a product or change your search."
    );
    return;
  }

  container.innerHTML = filtered.map(product => `
    <article class="product-card">
      ${getImageMarkup(product)}

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.category)}</p>
        <p>${escapeHTML(product.description || "")}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">Stock: ${product.stock}</div>

        <div class="product-actions">
          <button class="btn outline"
            onclick="editProduct('${product.id}')">
            Edit
          </button>

          <button class="btn danger"
            onclick="deleteProduct('${product.id}')">
            Delete
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

$("adminProductSearch").addEventListener("input", renderAdminProducts);

function openProductModal() {
  if (!isAdmin()) return;

  $("productForm").reset();
  $("productId").value = "";
  $("productModalTitle").textContent = "Add Product";
  $("productImage").value = "💐";
  $("productImageFile").value = "";
  selectedImage = "";

  $("productImagePreview").textContent = "💐";
  $("productImagePreview").innerHTML = "💐";

  $("productModal").classList.remove("hidden");
}

function editProduct(productId) {
  if (!isAdmin()) return;

  const product = findProduct(productId);
  if (!product) return;

  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productDescription").value = product.description || "";
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productImage").value = product.image || "💐";
  $("productImageFile").value = "";

  selectedImage = product.image || "💐";

  $("productModalTitle").textContent = "Edit Product";
  showProductPreview(selectedImage);

  $("productModal").classList.remove("hidden");
}

function showProductPreview(value) {
  const preview = $("productImagePreview");
  if (!preview) return;

  if (/^(https?:\/\/|data:image\/)/i.test(value || "")) {
    preview.innerHTML = `
      <img src="${escapeHTML(value)}"
        alt="Product preview"
        onerror="this.parentElement.textContent='Image unavailable'">
    `;
  } else {
    preview.textContent = value || "💐";
  }
}

$("productImage").addEventListener("input", () => {
  selectedImage = $("productImage").value.trim() || "💐";
  showProductPreview(selectedImage);
});

$("productImageFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 1.5 * 1024 * 1024) {
    showToast("Image must be 1.5 MB or smaller.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedImage = reader.result;
    showProductPreview(selectedImage);
  };

  reader.onerror = () => {
    showToast("Could not read the selected image.");
  };

  reader.readAsDataURL(file);
});

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!isAdmin()) return;

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value.trim();
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  const image = selectedImage ||
    $("productImage").value.trim() || "💐";

  if (!name || !category) {
    return showToast("Enter the product name and category.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    return showToast("Enter a valid product price.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return showToast("Stock must be a whole number of 0 or more.");
  }

  if (id) {
    const product = findProduct(id);
    if (!product) return;

    product.name = name;
    product.category = category;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.image = image;

    showToast("Product updated successfully.");
  } else {
    products.push({
      id: makeId("PRD"),
      name,
      category,
      description,
      price,
      stock,
      image
    });

    showToast("Product added successfully.");
  }

  save(STORAGE.products, products);

  closeModal("productModal");
  renderAdminProducts();
  renderInventory();
});

function deleteProduct(productId) {
  if (!isAdmin()) return;

  const product = findProduct(productId);
  if (!product) return;

  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
    return;
  }

  products = products.filter(item => item.id !== productId);

  /* Remove this product from every customer's cart. */
  Object.keys(carts).forEach(userId => {
    carts[userId] = (carts[userId] || []).filter(item =>
      item.productId !== productId
    );
  });

  persistAll();

  renderAdminProducts();
  renderInventory();

  showToast("Product deleted.");
}

/* -------------------- ADMIN INVENTORY -------------------- */

function renderInventory() {
  const container = $("inventoryList");
  if (!container) return;

  if (!products.length) {
    container.innerHTML = emptyState(
      "No inventory",
      "Add products to start managing stock."
    );
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Availability</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${products.map(product => `
            <tr>
              <td>${escapeHTML(product.name)}</td>
              <td>${escapeHTML(product.category)}</td>
              <td>${money(product.price)}</td>
              <td>${product.stock}</td>
              <td>
                <span class="badge ${
                  product.stock === 0 ? "red" :
                  product.stock <= 5 ? "" : "green"
                }">
                  ${product.stock === 0 ? "Out of Stock" :
                    product.stock <= 5 ? "Low Stock" : "Available"}
                </span>
              </td>
              <td>
                <button class="btn outline small"
                  onclick="editProduct('${product.id}')">
                  Edit
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* -------------------- ADMIN ORDER MANAGEMENT -------------------- */

function renderAdminOrders() {
  const container = $("adminOrders");
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = emptyState(
      "No customer orders",
      "Orders placed by customers will appear here."
    );
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="panel" style="margin-bottom:15px">
      <div class="section-heading">
        <div>
          <h3>${escapeHTML(order.receiptNo)}</h3>
          <p class="muted">
            ${new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <strong>${money(order.total)}</strong>
      </div>

      <p>
        <strong>Customer:</strong>
        ${escapeHTML(order.customerName)}
      </p>

      <p>
        <strong>Contact:</strong>
        ${escapeHTML(order.phone)}
      </p>

      <p>
        <strong>Address:</strong>
        ${escapeHTML(order.address)}
      </p>

      <p>
        <strong>Payment:</strong>
        Cash on Delivery · ${escapeHTML(order.paymentStatus)}
      </p>

      <h4>Items</h4>

      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}

      <div class="receipt-total">${money(order.total)}</div>

      <label for="status-${order.id}">Order Status</label>
      <select id="status-${order.id}"
        onchange="updateOrderStatus('${order.id}',this.value)"
        ${order.status === "Cancelled" ? "disabled" : ""}>

        <option value="Pending"
          ${order.status === "Pending" ? "selected" : ""}>
          Pending
        </option>

        <option value="Processing"
          ${order.status === "Processing" ? "selected" : ""}>
          Processing
        </option>

        <option value="Ready for Delivery"
          ${order.status === "Ready for Delivery" ? "selected" : ""}>
          Ready for Delivery
        </option>

        <option value="Completed"
          ${order.status === "Completed" ? "selected" : ""}>
          Completed
        </option>

        <option value="Cancelled"
          ${order.status === "Cancelled" ? "selected" : ""}>
          Cancelled
        </option>
      </select>

      <button class="btn outline small"
        onclick="viewReceipt('${order.id}')">
        View Receipt
      </button>
    </div>
  `).join("");
}

function updateOrderStatus(orderId, newStatus) {
  if (!isAdmin()) return;

  const allowed = [
    "Pending",
    "Processing",
    "Ready for Delivery",
    "Completed",
    "Cancelled"
  ];

  if (!allowed.includes(newStatus)) return;

  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  if (order.status === "Cancelled") {
    showToast("A cancelled order cannot be reopened.");
    renderAdminOrders();
    return;
  }

  if (newStatus === "Cancelled") {
    const restore = confirm(
      "Cancel this order and return its items to inventory?"
    );

    if (!restore) {
      renderAdminOrders();
      return;
    }

    order.items.forEach(item => {
      const product = findProduct(item.productId);
      if (product) product.stock += item.quantity;
    });

    order.paymentStatus = "Cancelled";
  }

  if (newStatus === "Completed") {
    order.paymentStatus = "Paid";
  }

  order.status = newStatus;
  order.updatedAt = new Date().toISOString();

  persistAll();

  renderAdminOrders();
  renderInventory();

  showToast("Order status updated.");
}

/* -------------------- ADMIN USER MANAGEMENT -------------------- */

function renderAdminUsers() {
  const container = $("adminUsers");
  if (!container) return;

  const customers = users.filter(user =>
    user.role === "customer"
  );

  if (!customers.length) {
    container.innerHTML = emptyState(
      "No customer accounts",
      "Registered customers will appear here."
    );
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Username</th>
            <th>Contact</th>
            <th>Account</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${customers.map(user => `
            <tr>
              <td>${escapeHTML(user.name)}</td>
              <td>${escapeHTML(user.username)}</td>
              <td>${escapeHTML(user.phone || "Not provided")}</td>
              <td>
                <span class="badge ${
                  user.active === false ? "red" : "green"
                }">
                  ${user.active === false ? "Disabled" : "Active"}
                </span>
              </td>
              <td>
                <button class="btn outline small"
                  onclick="toggleCustomer('${user.id}')">
                  ${user.active === false ? "Enable" : "Disable"}
                </button>

                <button class="btn danger small"
                  onclick="deleteCustomer('${user.id}')">
                  Delete
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function toggleCustomer(userId) {
  if (!isAdmin()) return;

  const user = findUser(userId);
  if (!user || user.role !== "customer") return;

  user.active = user.active === false;

  save(STORAGE.users, users);
  renderAdminUsers();

  showToast(user.active ? "Customer account enabled." :
    "Customer account disabled.");
}

function deleteCustomer(userId) {
  if (!isAdmin()) return;

  const user = findUser(userId);
  if (!user || user.role !== "customer") return;

  if (!confirm(`Delete customer account "${user.username}"?`)) {
    return;
  }

  users = users.filter(item => item.id !== userId);
  delete carts[userId];

  persistAll();
  renderAdminUsers();

  showToast("Customer account deleted.");
}

/* -------------------- ADMIN SETTINGS -------------------- */

function renderSettings() {
  $("settingsUsername").value = currentUser.username;
  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";
  setMessage("settingsMessage", "");
}

$("settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!isAdmin()) return;

  const username = $("settingsUsername").value.trim();
  const password = $("settingsPassword").value;
  const confirmPassword = $("settingsConfirm").value;

  if (username.length < 3) {
    return setMessage("settingsMessage",
      "Username must have at least 3 characters.");
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return setMessage("settingsMessage",
      "Username contains invalid characters.");
  }

  const duplicate = users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (duplicate) {
    return setMessage("settingsMessage",
      "That username is already taken.");
  }

  if (password || confirmPassword) {
    if (password.length < 6) {
      return setMessage("settingsMessage",
        "Password must have at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return setMessage("settingsMessage",
        "New passwords do not match.");
    }

    currentUser.password = password;
  }

  currentUser.username = username;

  save(STORAGE.users, users);

  $("headerUser").textContent =
    `${currentUser.name} · ${currentUser.role}`;

  setMessage("settingsMessage",
    "Admin settings updated successfully.", true);

  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";

  showToast("Admin settings saved.");
});

/* -------------------- MODALS -------------------- */

function closeModal(modalId) {
  const modal = $(modalId);
  if (modal) modal.classList.add("hidden");

  if (modalId === "checkoutModal") {
    pendingPurchase = null;
  }
}

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal").forEach(modal => {
      modal.classList.add("hidden");
    });

    pendingPurchase = null;
  }
});

/* -------------------- START APPLICATION -------------------- */

document.addEventListener("DOMContentLoaded", () => {
  showLogin();
  restoreSession();
  updateCartCount();
});
