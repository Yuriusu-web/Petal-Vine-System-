
/* ==========================================
   PETAL & VINE FLOWER SHOP
   FIXED LOGIN VERSION
========================================== */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  session: "pv_session",
  settings: "pv_settings"
};

const $ = id => document.getElementById(id);

function load(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
  return prefix + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6);
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
    "'": "&#39;"
  })[char]);
}

let users = [];
let products = [];
let orders = [];
let currentUser = null;
let cart = [];
let checkoutItems = [];
let toastTimer;

/* ==========================================
   INITIALIZE
========================================== */

function initialize() {
  users = load(STORAGE.users, []);
  products = load(STORAGE.products, []);
  orders = load(STORAGE.orders, []);

  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];

  createDefaultAdmin();
  createDefaultProducts();

  save(STORAGE.users, users);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);

  // Always show login when opening the website.
  localStorage.removeItem(STORAGE.session);

  currentUser = null;
  cart = [];
  checkoutItems = [];

  bindEvents();
  showCorrectAuthPanel();
}

function createDefaultAdmin() {
  let admin = users.find(user =>
    user && String(user.role).toLowerCase() === "admin"
  );

  if (!admin) {
    admin = {
      id: makeId("U"),
      name: "Administrator",
      username: "admin",
      password: "Admin123",
      phone: "",
      address: "",
      role: "admin",
      createdAt: new Date().toISOString()
    };

    users.unshift(admin);
  }

  admin.username = "admin";
  admin.password = "Admin123";
  admin.name = admin.name || "Administrator";

  // Reserve admin username.
  users.forEach(user => {
    if (
      user.id !== admin.id &&
      String(user.username).toLowerCase() === "admin"
    ) {
      user.username = "customer_" + String(user.id).slice(-6);
    }
  });
}

function createDefaultProducts() {
  if (products.length > 0) return;

  products = [
    {
      id: makeId("P"),
      name: "Classic Red Roses",
      category: "Roses",
      price: 850,
      stock: 20,
      image: "🌹",
      description: "A timeless bouquet of beautiful red roses."
    },
    {
      id: makeId("P"),
      name: "Pink Tulip Bouquet",
      category: "Tulips",
      price: 950,
      stock: 15,
      image: "🌷",
      description: "Soft pink tulips for a lovely surprise."
    },
    {
      id: makeId("P"),
      name: "Sunny Sunflowers",
      category: "Sunflowers",
      price: 700,
      stock: 18,
      image: "🌻",
      description: "Bright sunflowers to make someone's day."
    },
    {
      id: makeId("P"),
      name: "White Rose Bouquet",
      category: "Roses",
      price: 900,
      stock: 12,
      image: "💐",
      description: "Elegant white roses."
    },
    {
      id: makeId("P"),
      name: "Mixed Flower Basket",
      category: "Mixed Bouquets",
      price: 1200,
      stock: 10,
      image: "💐",
      description: "A colorful mix of seasonal flowers."
    },
    {
      id: makeId("P"),
      name: "Purple Tulips",
      category: "Tulips",
      price: 980,
      stock: 14,
      image: "🪻",
      description: "Charming purple tulips."
    },
    {
      id: makeId("P"),
      name: "Pink Rose Bouquet",
      category: "Roses",
      price: 880,
      stock: 16,
      image: "🌸",
      description: "A sweet arrangement of pink roses."
    },
    {
      id: makeId("P"),
      name: "Garden Blooms",
      category: "Mixed Bouquets",
      price: 1100,
      stock: 9,
      image: "💮",
      description: "A garden-inspired flower arrangement."
    }
  ];
}

/* ==========================================
   AUTHENTICATION SCREEN
========================================== */

function showCorrectAuthPanel() {
  $("authScreen").classList.remove("hidden");
  $("app").classList.add("hidden");

  $("loginPanel").classList.remove("hidden");
  $("registerPanel").classList.add("hidden");

  $("loginMessage").textContent = "";
  $("registerMessage").textContent = "";
}

function showAuth(panel) {
  $("loginPanel").classList.toggle("hidden", panel !== "login");
  $("registerPanel").classList.toggle("hidden", panel !== "register");

  $("loginMessage").textContent = "";
  $("registerMessage").textContent = "";
}

/* ==========================================
   EVENT LISTENERS
========================================== */

function bindEvents() {
  $("loginForm").addEventListener("submit", login);
  $("registerForm").addEventListener("submit", register);
  $("productForm").addEventListener("submit", saveProduct);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("settingsForm").addEventListener("submit", saveSettings);
  $("profileForm").addEventListener("submit", updateProfile);
}

/* ==========================================
   FIXED LOGIN
========================================== */

function login(event) {
  event.preventDefault();

  // Read the latest saved accounts.
  users = load(STORAGE.users, []);

  if (!Array.isArray(users)) users = [];

  // Make sure admin exists.
  createDefaultAdmin();
  save(STORAGE.users, users);

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  let user = null;

  // ADMIN LOGIN
  if (username === "admin" && password === "Admin123") {
    user = users.find(item =>
      String(item.role).toLowerCase() === "admin"
    );
  }

  // CUSTOMER LOGIN
  else {
    user = users.find(item =>
      String(item.username).trim().toLowerCase() === username &&
      item.password === password &&
      String(item.role).toLowerCase() === "customer"
    );
  }

  if (!user) {
    $("loginMessage").textContent =
      "Incorrect username or password. Please try again.";
    return;
  }

  currentUser = user;

  save(STORAGE.session, {
    userId: user.id
  });

  $("loginForm").reset();
  $("loginMessage").textContent = "";

  openApplication();
}

/* ==========================================
   CUSTOMER REGISTRATION
========================================== */

function register(event) {
  event.preventDefault();

  users = load(STORAGE.users, []);
  if (!Array.isArray(users)) users = [];

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;
  const phone = $("registerPhone").value.trim();
  const address = $("registerAddress").value.trim();

  if (username.length < 3) {
    $("registerMessage").textContent =
      "Username must have at least 3 characters.";
    return;
  }

  if (password.length < 6) {
    $("registerMessage").textContent =
      "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    $("registerMessage").textContent =
      "Passwords do not match.";
    return;
  }

  if (users.some(user =>
    String(user.username).toLowerCase() === username.toLowerCase()
  )) {
    $("registerMessage").textContent =
      "Username is already taken.";
    return;
  }

  const newUser = {
    id: makeId("U"),
    name: name,
    username: username,
    password: password,
    phone: phone,
    address: address,
    role: "customer",
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  save(STORAGE.users, users);

  $("registerForm").reset();

  showAuth("login");
  $("loginUsername").value = username;

  $("loginMessage").textContent =
    "Account created successfully. Please login.";
}

/* ==========================================
   OPEN APPLICATION
========================================== */

function openApplication() {
  if (!currentUser) return;

  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  $("welcomeText").textContent =
    "Hello, " + currentUser.name;

  const isAdmin = currentUser.role === "admin";

  $("adminArea").classList.toggle("hidden", !isAdmin);
  $("customerArea").classList.toggle("hidden", isAdmin);

  if (isAdmin) {
    refreshAdmin();
    goPage("dashboard", document.querySelector(".nav-btn"));
  } else {
    cart = [];
    renderShop();
    updateCartCount();
    customerPage("shop", document.querySelector(".customer-nav-btn"));
  }
}

function logout() {
  localStorage.removeItem(STORAGE.session);

  currentUser = null;
  cart = [];
  checkoutItems = [];

  $("app").classList.add("hidden");
  showCorrectAuthPanel();
}

/* ==========================================
   PASSWORD VISIBILITY
========================================== */

function togglePassword(id, button) {
  const field = $(id);

  if (!field) return;

  const showing = field.type === "password";

  field.type = showing ? "text" : "password";
  button.textContent = showing ? "Hide" : "Show";
}

/* ==========================================
   ADMIN NAVIGATION
========================================== */

function goPage(page, button) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  const target = $("page-" + page);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(item => {
    item.classList.remove("active");
  });

  if (button) button.classList.add("active");

  if (page === "dashboard") renderDashboard();
  if (page === "products") renderAdminProducts();
  if (page === "inventory") renderInventory();
  if (page === "orders") renderAdminOrders();
  if (page === "users") renderUsers();
  if (page === "reports") renderReports();

  if (page === "settings") {
    const admin = users.find(user => user.role === "admin");

    $("settingsUsername").value = admin?.username || "admin";
    $("settingsPassword").value = "";
    $("settingsConfirm").value = "";
    $("settingsMessage").textContent = "";
  }
}

function refreshAdmin() {
  renderDashboard();
  renderAdminProducts();
  renderInventory();
  renderAdminOrders();
  renderUsers();
  renderReports();
}

/* ==========================================
   ADMIN DASHBOARD
========================================== */

function renderDashboard() {
  $("statProducts").textContent = products.length;

  $("statCustomers").textContent =
    users.filter(user => user.role === "customer").length;

  $("statOrders").textContent = orders.length;

  const sales = orders
    .filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total), 0);

  $("statSales").textContent = money(sales);

  const recent = [...orders].reverse().slice(0, 5);

  $("recentOrders").innerHTML = recent.length
    ? orderTable(recent, false)
    : emptyState("No orders yet", "Customer orders will appear here.");
}

/* ==========================================
   PRODUCT MANAGEMENT
========================================== */

function openProductForm(id = "") {
  $("productForm").reset();
  $("productId").value = id;

  const product = products.find(item => item.id === id);

  $("productModalTitle").textContent =
    product ? "Edit Product" : "Add Product";

  if (product) {
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;
    $("productImage").value = product.image || "";
    $("productDescription").value = product.description || "";
  }

  $("productModal").classList.remove("hidden");
}

function closeProductForm() {
  $("productModal").classList.add("hidden");
}

function saveProduct(event) {
  event.preventDefault();

  const id = $("productId").value;

  const data = {
    name: $("productName").value.trim(),
    category: $("productCategory").value,
    price: Number($("productPrice").value),
    stock: Math.floor(Number($("productStock").value)),
    image: $("productImage").value.trim() || "💐",
    description: $("productDescription").value.trim()
  };

  if (!data.name || data.price <= 0 || data.stock < 0 ||
      !Number.isFinite(data.price) || !Number.isFinite(data.stock)) {
    showToast("Please enter valid product details.");
    return;
  }

  if (id) {
    const index = products.findIndex(item => item.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...data };
    }
  } else {
    products.push({ id: makeId("P"), ...data });
  }

  save(STORAGE.products, products);
  closeProductForm();
  refreshAdmin();

  showToast(id ? "Product updated." : "Product added.");
}

function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!confirm("Delete " + product.name + "?")) return;

  products = products.filter(item => item.id !== id);
  save(STORAGE.products, products);

  refreshAdmin();
  showToast("Product deleted.");
}

function productImageHTML(image) {
  const value = String(image || "💐").trim();

  if (/^https?:\/\//i.test(value)) {
    return `<img src="${escapeHTML(value)}" alt="Product image" onerror="this.parentElement.textContent='💐'">`;
  }

  return escapeHTML(value);
}

function renderAdminProducts() {
  const search = ($("adminProductSearch")?.value || "").toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  $("adminProducts").innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card">
        <div class="product-image">${productImageHTML(product.image)}</div>
        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.category)}</p>
          <div class="price">${money(product.price)}</div>
          <div class="stock">Stock: ${product.stock}</div>
          <div class="product-actions">
            <button class="btn outline" onclick="openProductForm('${product.id}')">Edit</button>
            <button class="btn outline" onclick="deleteProduct('${product.id}')">Delete</button>
          </div>
        </div>
      </article>
    `).join("")
    : emptyState("No products found", "Add a product to get started.");
}

/* ==========================================
   INVENTORY
========================================== */

function renderInventory() {
  $("inventoryTable").innerHTML = products.length ? `
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
                ${product.stock <= 0
                  ? '<span class="badge red">Out of Stock</span>'
                  : product.stock <= 5
                    ? '<span class="badge">Low Stock</span>'
                    : '<span class="badge green">Available</span>'}
              </td>
              <td>
                <button class="btn outline small"
                  onclick="openProductForm('${product.id}')">Update</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : emptyState("No inventory", "Your products will appear here.");
}

/* ==========================================
   ADMIN ORDERS
========================================== */

function renderAdminOrders() {
  $("adminOrders").innerHTML = orders.length
    ? orderTable([...orders].reverse(), true)
    : emptyState("No customer orders", "New purchases will appear here.");
}

function orderTable(list, actions) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            ${actions ? "<th>Actions</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${new Date(order.createdAt).toLocaleDateString()}</td>
              <td>${money(order.total)}</td>
              <td>COD</td>
              <td>
                <span class="badge ${
                  order.status === "Completed" ? "green" :
                  order.status === "Cancelled" ? "red" : ""
                }">${escapeHTML(order.status)}</span>
              </td>
              ${actions ? `
                <td>
                  <button class="btn outline small"
                    onclick="viewReceipt('${order.id}')">Receipt</button>
                  <select onchange="updateOrderStatus('${order.id}',this.value)">
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
}

function updateOrderStatus(id, status) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const oldStatus = order.status;

  if (status === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(product => product.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    for (const item of order.items) {
      const product = products.find(product => product.id === item.productId);

      if (!product || product.stock < item.quantity) {
        showToast("Not enough stock to restore this order.");
        renderAdminOrders();
        return;
      }
    }

    order.items.forEach(item => {
      const product = products.find(product => product.id === item.productId);
      if (product) product.stock -= item.quantity;
    });
  }

  order.status = status;

  save(STORAGE.orders, orders);
  save(STORAGE.products, products);

  refreshAdmin();
  showToast("Order status updated.");
}

/* ==========================================
   USER MANAGEMENT
========================================== */

function renderUsers() {
  const customers = users.filter(user => user.role === "customer");

  $("usersTable").innerHTML = customers.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Joined</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(user => `
            <tr>
              <td>${escapeHTML(user.name)}</td>
              <td>${escapeHTML(user.username)}</td>
              <td>${escapeHTML(user.phone)}</td>
              <td>${escapeHTML(user.address)}</td>
              <td>${new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn outline small"
                  onclick="deleteUser('${user.id}')">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  ` : emptyState("No customers yet", "Registered customers will appear here.");
}

function deleteUser(id) {
  const user = users.find(item => item.id === id);
  if (!user || user.role !== "customer") return;

  if (!confirm("Delete customer account for " + user.name + "?")) return;

  users = users.filter(item => item.id !== id);
  save(STORAGE.users, users);

  renderUsers();
  renderDashboard();

  showToast("Customer account deleted.");
}

/* ==========================================
   REPORTS
========================================== */

function renderReports() {
  const completed = orders.filter(order => order.status === "Completed");
  const pending = orders.filter(order =>
    order.status === "Pending" || order.status === "Processing"
  );

  const sales = completed.reduce(
    (sum, order) => sum + Number(order.total), 0
  );

  $("reportOrders").textContent = orders.length;
  $("reportSales").textContent = money(sales);
  $("reportPending").textContent = pending.length;

  $("reportTable").innerHTML = orders.length
    ? orderTable([...orders].reverse(), false)
    : emptyState("No reports available", "Orders will appear here.");
}

/* ==========================================
   ADMIN SETTINGS
========================================== */

function saveSettings(event) {
  event.preventDefault();

  const admin = users.find(user => user.role === "admin");
  if (!admin) return;

  const username = $("settingsUsername").value.trim();
  const password = $("settingsPassword").value;
  const confirmPassword = $("settingsConfirm").value;

  if (username.length < 3) {
    $("settingsMessage").textContent =
      "Username must have at least 3 characters.";
    return;
  }

  if (users.some(user =>
    user.id !== admin.id &&
    String(user.username).toLowerCase() === username.toLowerCase()
  )) {
    $("settingsMessage").textContent =
      "That username is already in use.";
    return;
  }

  if (password && password.length < 6) {
    $("settingsMessage").textContent =
      "Password must have at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    $("settingsMessage").textContent =
      "Passwords do not match.";
    return;
  }

  admin.username = username;

  if (password) admin.password = password;

  save(STORAGE.users, users);

  $("settingsPassword").value = "";
  $("settingsConfirm").value = "";

  $("settingsMessage").textContent =
    "Settings saved successfully.";
}

/* ==========================================
   CUSTOMER NAVIGATION
========================================== */

function customerPage(page, button) {
  document.querySelectorAll(".customer-page").forEach(section => {
    section.classList.add("hidden");
  });

  const target = $("customer-" + page);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".customer-nav-btn").forEach(item => {
    item.classList.remove("active");
  });

  if (button) button.classList.add("active");

  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "myorders") renderCustomerOrders();
  if (page === "profile") loadProfile();
}

/* ==========================================
   CUSTOMER SHOP
========================================== */

function renderShop() {
  const search = ($("shopSearch")?.value || "").toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  $("shopProducts").innerHTML = filtered.length ? filtered.map(product => `
    <article class="product-card">
      <div class="product-image">${productImageHTML(product.image)}</div>
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || product.category)}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">
          ${product.stock > 0 ? product.stock + " available" : "Out of stock"}
        </div>
        <div class="product-actions">
          <button class="btn primary"
            ${product.stock <= 0 ? "disabled" : ""}
            onclick="addToCart('${product.id}')">Add to Cart</button>
          <button class="btn outline"
            ${product.stock <= 0 ? "disabled" : ""}
            onclick="buyNow('${product.id}')">Buy Now</button>
        </div>
      </div>
    </article>
  `).join("") : emptyState("No flowers found", "Try another search.");
}

/* ==========================================
   CUSTOMER CART
========================================== */

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product || product.stock <= 0) return;

  const item = cart.find(entry => entry.productId === id);
  const quantity = item ? item.quantity : 0;

  if (quantity >= product.stock) {
    showToast("You have reached the available stock.");
    return;
  }

  if (item) item.quantity++;
  else cart.push({ productId: id, quantity: 1 });

  updateCartCount();
  showToast("Added to cart.");
}

function buyNow(id) {
  const product = products.find(item => item.id === id);
  if (!product || product.stock <= 0) return;

  checkoutItems = [{ productId: id, quantity: 1 }];
  openCheckout();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;
}

function changeCartQuantity(id, quantity) {
  const item = cart.find(entry => entry.productId === id);
  const product = products.find(entry => entry.id === id);

  if (!item || !product) return;

  quantity = Math.floor(Number(quantity));

  if (!Number.isFinite(quantity) || quantity <= 0) {
    cart = cart.filter(entry => entry.productId !== id);
  } else if (quantity > product.stock) {
    item.quantity = product.stock;
    showToast("Quantity adjusted to available stock.");
  } else {
    item.quantity = quantity;
  }

  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.productId !== id);
  updateCartCount();
  renderCart();
}

function renderCart() {
  cart = cart.filter(item =>
    products.some(product => product.id === item.productId)
  );

  if (!cart.length) {
    $("cartContent").innerHTML =
      emptyState("Your cart is empty", "Browse our flowers and add your favorites.");
    return;
  }

  const total = cart.reduce((sum, item) => {
    const product = products.find(product => product.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  $("cartContent").innerHTML = `
    ${cart.map(item => {
      const product = products.find(product => product.id === item.productId);

      return `
        <div class="cart-row">
          <div>
            <strong>${escapeHTML(product.name)}</strong>
            <p class="muted">${money(product.price)} each</p>
          </div>
          <input class="qty-input" type="number"
            min="1" max="${product.stock}" value="${item.quantity}"
            onchange="changeCartQuantity('${product.id}',this.value)">
          <strong>${money(product.price * item.quantity)}</strong>
          <button class="btn outline small"
            onclick="removeFromCart('${product.id}')">Remove</button>
        </div>
      `;
    }).join("")}

    <div class="cart-total">
      <p>Total Amount</p>
      <strong>${money(total)}</strong>
      <p class="muted">Payment: Cash on Delivery</p>
      <button class="btn primary" onclick="checkoutCart()">
        Proceed to Checkout
      </button>
    </div>
  `;
}

function checkoutCart() {
  if (!cart.length) {
    showToast("Your cart is empty.");
    return;
  }

  checkoutItems = cart.map(item => ({ ...item }));
  openCheckout();
}

/* ==========================================
   CHECKOUT
========================================== */

function openCheckout() {
  if (!checkoutItems.length) return;

  for (const item of checkoutItems) {
    const product = products.find(product => product.id === item.productId);

    if (!product || item.quantity > product.stock || item.quantity < 1) {
      showToast("One or more items are unavailable.");
      return;
    }
  }

  $("checkoutName").value = currentUser.name || "";
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  const total = checkoutItems.reduce((sum, item) => {
    const product = products.find(product => product.id === item.productId);
    return sum + product.price * item.quantity;
  }, 0);

  $("checkoutSummary").innerHTML = `
    <strong>Order Summary</strong>
    ${checkoutItems.map(item => {
      const product = products.find(product => product.id === item.productId);

      return `
        <div class="receipt-line">
          <span>${escapeHTML(product.name)} × ${item.quantity}</span>
          <span>${money(product.price * item.quantity)}</span>
        </div>
      `;
    }).join("")}
    <div class="receipt-total">Total: ${money(total)}</div>
  `;

  $("checkoutModal").classList.remove("hidden");
}

function closeCheckout() {
  $("checkoutModal").classList.add("hidden");
}

function placeOrder(event) {
  event.preventDefault();

  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();

  if (!name || !phone || !address) {
    showToast("Please complete your delivery details.");
    return;
  }

  for (const item of checkoutItems) {
    const product = products.find(product => product.id === item.productId);

    if (!product || item.quantity > product.stock || item.quantity < 1) {
      showToast("Sorry, stock changed. Please review your order.");
      closeCheckout();
      renderCart();
      return;
    }
  }

  const orderItems = checkoutItems.map(item => {
    const product = products.find(product => product.id === item.productId);

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  });

  const total = orderItems.reduce(
    (sum, item) => sum + item.subtotal, 0
  );

  const order = {
    id: "PV-" + Date.now().toString().slice(-8),
    userId: currentUser.id,
    customerName: name,
    phone: phone,
    address: address,
    items: orderItems,
    total: total,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  orderItems.forEach(item => {
    const product = products.find(product => product.id === item.productId);
    product.stock -= item.quantity;
  });

  orders.push(order);

  save(STORAGE.orders, orders);
  save(STORAGE.products, products);

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.address = address;

  save(STORAGE.users, users);

  cart = [];
  checkoutItems = [];

  updateCartCount();
  closeCheckout();
  $("checkoutForm").reset();

  viewReceipt(order.id);
  showToast("Order placed successfully.");
}

/* ==========================================
   CUSTOMER ORDERS
========================================== */

function renderCustomerOrders() {
  const myOrders = orders.filter(
    order => order.userId === currentUser.id
  ).reverse();

  $("customerOrders").innerHTML = myOrders.length
    ? myOrders.map(order => `
      <div class="panel" style="margin-bottom:15px">
        <div class="page-heading">
          <div>
            <h3>${escapeHTML(order.id)}</h3>
            <p>${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span class="badge ${
            order.status === "Completed" ? "green" :
            order.status === "Cancelled" ? "red" : ""
          }">${escapeHTML(order.status)}</span>
        </div>

        ${order.items.map(item => `
          <div class="receipt-line">
            <span>${escapeHTML(item.name)} × ${item.quantity}</span>
            <span>${money(item.subtotal)}</span>
          </div>
        `).join("")}

        <div class="cart-total"><strong>${money(order.total)}</strong></div>
        <p class="muted">Payment: Cash on Delivery</p>

        <button class="btn outline small"
          onclick="viewReceipt('${order.id}')">View Receipt</button>
      </div>
    `).join("")
    : emptyState("No orders yet", "Your purchases will appear here.");
}

/* ==========================================
   RECEIPT
========================================== */

function viewReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  if (
    currentUser.role === "customer" &&
    order.userId !== currentUser.id
  ) {
    showToast("You cannot view this receipt.");
    return;
  }

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>✿ Petal & Vine</h2>
      <p>Flower Shop Receipt</p>
      <hr>

      <div class="receipt-line">
        <span>Order ID</span>
        <strong>${escapeHTML(order.id)}</strong>
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

      <div class="receipt-line">
        <span>Status</span>
        <span>${escapeHTML(order.status)}</span>
      </div>

      <hr>
      <strong>Purchased Items</strong>

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

      <div class="receipt-total">Total: ${money(order.total)}</div>
      <p>Thank you for shopping with us!</p>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

function closeReceipt() {
  $("receiptModal").classList.add("hidden");
}

/* ==========================================
   CUSTOMER PROFILE
========================================== */

function loadProfile() {
  $("profileName").value = currentUser.name || "";
  $("profileUsername").value = currentUser.username || "";
  $("profilePhone").value = currentUser.phone || "";
  $("profileAddress").value = currentUser.address || "";

  $("profileMessage").textContent = "";
}

function updateProfile(event) {
  event.preventDefault();

  currentUser.name = $("profileName").value.trim();
  currentUser.phone = $("profilePhone").value.trim();
  currentUser.address = $("profileAddress").value.trim();

  save(STORAGE.users, users);

  $("welcomeText").textContent = "Hello, " + currentUser.name;
  $("profileMessage").textContent =
    "Profile updated successfully.";
}

/* ==========================================
   HELPERS
========================================== */

function emptyState(title, description) {
  return `
    <div class="empty-state">
      <strong>${escapeHTML(title)}</strong>
      ${escapeHTML(description)}
    </div>
  `;
}

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* ==========================================
   START WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", initialize);
