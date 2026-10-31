/* ==========================================
   PETAL & VINE FLOWER SHOP
   Front-end demonstration using localStorage
========================================== */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  session: "pv_session",
  settings: "pv_settings"
};

const $ = id => document.getElementById(id);

let users = load(STORAGE.users, []);
let products = load(STORAGE.products, []);
let orders = load(STORAGE.orders, []);
let settings = load(STORAGE.settings, {
  shopName: "Petal & Vine",
  adminName: "Administrator"
});

let currentUser = null;
let currentPage = "dashboard";
let cart = [];
let selectedImage = "";
let toastTimer;

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveAll() {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
  localStorage.setItem(STORAGE.products, JSON.stringify(products));
  localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
  localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
}

function makeId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(amount) {
  return "₱" + Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function saveData() {
  saveAll();
}

/* ==========================================
   INITIAL PRODUCTS
========================================== */

const starterProducts = [
  {
    name: "Classic Red Roses",
    category: "Roses",
    price: 899,
    stock: 20,
    description: "A timeless arrangement of beautiful red roses.",
    image: "https://images.unsplash.com/photo-1548094967-e25a127d1b8f?w=700"
  },
  {
    name: "Pink Rose Bouquet",
    category: "Roses",
    price: 950,
    stock: 18,
    description: "Soft pink roses wrapped with elegant paper.",
    image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=700"
  },
  {
    name: "White Tulip Bundle",
    category: "Tulips",
    price: 780,
    stock: 15,
    description: "Simple and graceful white tulips.",
    image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=700"
  },
  {
    name: "Sunflower Happiness",
    category: "Bouquets",
    price: 650,
    stock: 22,
    description: "Bright sunflowers to make someone's day.",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700"
  },
  {
    name: "Pastel Dream",
    category: "Mixed Flowers",
    price: 1200,
    stock: 12,
    description: "A dreamy mix of pastel-colored blooms.",
    image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=700"
  },
  {
    name: "Purple Elegance",
    category: "Mixed Flowers",
    price: 1100,
    stock: 10,
    description: "Elegant purple flowers for special occasions.",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=700"
  },
  {
    name: "Baby's Breath Bouquet",
    category: "Bouquets",
    price: 550,
    stock: 25,
    description: "Delicate white blooms with a soft finish.",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=700"
  },
  {
    name: "Pink Tulip Bouquet",
    category: "Tulips",
    price: 850,
    stock: 14,
    description: "Fresh pink tulips arranged with care.",
    image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=700"
  },
  {
    name: "Garden Mix",
    category: "Mixed Flowers",
    price: 1350,
    stock: 9,
    description: "A colorful garden-inspired flower arrangement.",
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=700"
  },
  {
    name: "White Rose Bouquet",
    category: "Roses",
    price: 999,
    stock: 16,
    description: "Pure white roses for meaningful moments.",
    image: "https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=700"
  },
  {
    name: "Mini Succulent",
    category: "Plants",
    price: 299,
    stock: 30,
    description: "A lovely low-maintenance plant gift.",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700"
  },
  {
    name: "Orchid Charm",
    category: "Plants",
    price: 750,
    stock: 11,
    description: "A graceful orchid plant for home decoration.",
    image: "https://images.unsplash.com/photo-1566907225472-514a2f7e7b2c?w=700"
  },
  {
    name: "Romantic Red Mix",
    category: "Bouquets",
    price: 1450,
    stock: 8,
    description: "A romantic combination of red and pink blooms.",
    image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=700"
  },
  {
    name: "Yellow Tulip Bouquet",
    category: "Tulips",
    price: 820,
    stock: 13,
    description: "Cheerful yellow tulips for happy celebrations.",
    image: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=700"
  },
  {
    name: "Luxury Mixed Bouquet",
    category: "Mixed Flowers",
    price: 1850,
    stock: 7,
    description: "A premium arrangement for unforgettable occasions.",
    image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=700"
  }
];

if (!products.length) {
  products = starterProducts.map(item => ({
    id: makeId("P"),
    ...item
  }));
  saveData();
}

/* ==========================================
   AUTHENTICATION
========================================== */

function showAuth(type) {
  $("setupForm").classList.add("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  if (type === "setup") $("setupForm").classList.remove("hidden");
  if (type === "login") $("loginForm").classList.remove("hidden");
  if (type === "register") $("registerForm").classList.remove("hidden");
}

function initializeAuth() {
  const hasAdmin = users.some(user => user.role === "admin");
  showAuth(hasAdmin ? "login" : "setup");
}

function cleanUsername(value) {
  return String(value).trim().toLowerCase();
}

$("adminSetupForm").addEventListener("submit", event => {
  event.preventDefault();

  if (users.some(user => user.role === "admin")) {
    notify("An admin account has already been created.");
    showAuth("login");
    return;
  }

  const name = $("setupName").value.trim();
  const username = cleanUsername($("setupUsername").value);
  const password = $("setupPassword").value;
  const confirm = $("setupConfirm").value;

  if (username.length < 3) {
    notify("Username must have at least 3 characters.");
    return;
  }

  if (password.length < 6) {
    notify("Password must have at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    notify("Passwords do not match.");
    return;
  }

  if (users.some(user => cleanUsername(user.username) === username)) {
    notify("That username is already taken.");
    return;
  }

  users.push({
    id: makeId("U"),
    name,
    username,
    password,
    role: "admin",
    createdAt: new Date().toISOString()
  });

  settings.adminName = name;
  saveData();

  $("adminSetupForm").reset();
  notify("Admin account created. Please log in.");
  showAuth("login");
});

$("customerRegisterForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = cleanUsername($("registerUsername").value);
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if (username.length < 3) {
    notify("Username must have at least 3 characters.");
    return;
  }

  if (password.length < 6) {
    notify("Password must have at least 6 characters.");
    return;
  }

  if (password !== confirm) {
    notify("Passwords do not match.");
    return;
  }

  if (users.some(user => cleanUsername(user.username) === username)) {
    notify("Username is already registered.");
    return;
  }

  users.push({
    id: makeId("U"),
    name,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString()
  });

  saveData();
  $("customerRegisterForm").reset();
  $("loginUsername").value = username;
  notify("Account created. You can now log in.");
  showAuth("login");
});

$("userLoginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = cleanUsername($("loginUsername").value);
  const password = $("loginPassword").value;

  const user = users.find(item =>
    cleanUsername(item.username) === username &&
    item.password === password
  );

  if (!user) {
    notify("Incorrect username or password.");
    return;
  }

  currentUser = user;
  localStorage.setItem(STORAGE.session, user.id);
  $("userLoginForm").reset();
  openApplication();
});

$("showRegister").addEventListener("click", () => showAuth("register"));
$("showLogin").addEventListener("click", () => showAuth("login"));

function restoreSession() {
  const userId = localStorage.getItem(STORAGE.session);
  if (!userId) return false;

  const user = users.find(item => item.id === userId);
  if (!user) {
    localStorage.removeItem(STORAGE.session);
    return false;
  }

  currentUser = user;
  openApplication();
  return true;
}

function logout() {
  currentUser = null;
  cart = [];
  localStorage.removeItem(STORAGE.session);

  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");

  initializeAuth();
  notify("You have logged out.");
}

$("logoutButton").addEventListener("click", logout);

/* ==========================================
   APPLICATION NAVIGATION
========================================== */

const adminNavigation = [
  ["dashboard", "▦", "Dashboard"],
  ["products", "✿", "Product Management"],
  ["inventory", "▤", "Inventory"],
  ["orders", "▣", "Customer Orders"],
  ["users", "♙", "User Management"],
  ["receipts", "▧", "Receipts"],
  ["reports", "▥", "Reports"],
  ["settings", "⚙", "Settings"]
];

const customerNavigation = [
  ["shop", "✿", "Shop Flowers"],
  ["cart", "🛒", "My Cart"],
  ["myorders", "▣", "My Orders"]
];

function openApplication() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  const isAdmin = currentUser.role === "admin";

  $("sidebarRole").textContent = isAdmin ? "ADMIN PANEL" : "CUSTOMER AREA";
  $("roleChip").textContent = isAdmin ? "ADMINISTRATOR" : "CUSTOMER";
  $("profileName").textContent = currentUser.name;
  $("profileRole").textContent = isAdmin ? "Administrator" : "Customer";
  $("profileAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("year").textContent = new Date().getFullYear();

  buildNavigation();
  navigate(isAdmin ? "dashboard" : "shop");
}

function buildNavigation() {
  const navItems = currentUser.role === "admin"
    ? adminNavigation
    : customerNavigation;

  $("navigation").innerHTML = navItems.map(([id, icon, label]) => `
    <button class="nav-link ${currentPage === id ? "active" : ""}" data-page="${id}">
      <span class="nav-icon">${icon}</span>${label}
    </button>
  `).join("");
}

$("navigation").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (!button) return;
  navigate(button.dataset.page);
  $("sidebar").classList.remove("open");
});

$("menuToggle").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

function navigate(page) {
  const allowed = currentUser.role === "admin"
    ? adminNavigation.map(item => item[0])
    : customerNavigation.map(item => item[0]);

  if (!allowed.includes(page)) {
    notify("You do not have permission to open that page.");
    return;
  }

  currentPage = page;
  buildNavigation();

  const titles = {
    dashboard: "Admin Dashboard",
    products: "Product Management",
    inventory: "Inventory Management",
    orders: "Customer Orders",
    users: "User Management",
    receipts: "Receipts",
    reports: "Sales Reports",
    settings: "Admin Settings",
    shop: "Shop Flowers",
    cart: "My Cart",
    myorders: "My Orders"
  };

  $("pageTitle").textContent = titles[page] || "Petal & Vine";
  $("pageEyebrow").textContent = currentUser.role === "admin"
    ? "SHOP ADMINISTRATION"
    : "WELCOME TO PETAL & VINE";

  renderPage();
}

function renderPage() {
  const pages = {
    dashboard: renderDashboard,
    products: renderProducts,
    inventory: renderInventory,
    orders: renderAdminOrders,
    users: renderUsers,
    receipts: renderReceipts,
    reports: renderReports,
    settings: renderSettings,
    shop: renderShop,
    cart: renderCart,
    myorders: renderMyOrders
  };

  if (pages[currentPage]) pages[currentPage]();
}

/* ==========================================
   DASHBOARD
========================================== */

function renderDashboard() {
  const totalSales = orders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  const lowStock = products.filter(product => product.stock <= 5).length;
  const pendingOrders = orders.filter(order =>
    ["Pending", "Confirmed", "Processing"].includes(order.status)
  ).length;

  $("pageContent").innerHTML = `
    <div class="welcome-banner">
      <div class="welcome-symbol">✿</div>
      <p class="eyebrow">YOUR FLOWER SHOP OVERVIEW</p>
      <h2>Welcome, ${escapeHTML(currentUser.name)}!</h2>
      <p>Manage your flowers, customers, orders, inventory and sales from one place.</p>
    </div>

    <div class="stats-grid">
      ${statCard("✿", products.length, "Total Products")}
      ${statCard("♙", users.filter(user => user.role === "customer").length, "Customers")}
      ${statCard("▣", orders.length, "Total Orders")}
      ${statCard("₱", money(totalSales), "Recorded Sales")}
      ${statCard("◷", pendingOrders, "Active Orders")}
      ${statCard("!", lowStock, "Low Stock Items")}
    </div>

    <div class="section-heading">
      <h2>Recent Orders</h2>
      <button class="btn btn-secondary btn-small" data-go="orders">View All</button>
    </div>
    ${recentOrdersTable()}
  `;
}

function statCard(icon, value, label) {
  return `
    <div class="stat-card">
      <div class="stat-icon">${icon}</div>
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `;
}

function recentOrdersTable() {
  const recent = [...orders].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);

  if (!recent.length) return emptyState("No orders have been placed yet.");

  return `
    <div class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th><th>Customer</th><th>Date</th>
            <th>Total</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${formatDate(order.createdAt)}</td>
              <td>${money(order.total)}</td>
              <td>${statusBadge(order.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ==========================================
   PRODUCT MANAGEMENT
========================================== */

function productCard(product, adminMode = false) {
  const image = product.image
    ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.style.display='none'">`
    : `<div class="product-placeholder">✿</div>`;

  return `
    <article class="product-card">
      <div class="product-image">
        ${image}
        <span class="stock-tag">${product.stock > 0 ? product.stock + " available" : "Out of stock"}</span>
      </div>
      <div class="product-info">
        <div class="category-label">${escapeHTML(product.category)}</div>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "Beautiful flowers arranged with care.")}</p>
        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <span class="category-label">Stock: ${product.stock}</span>
        </div>
        ${
          adminMode
            ? `<div class="product-actions">
                <button class="btn btn-secondary" data-edit-product="${product.id}">Edit</button>
                <button class="btn btn-danger" data-delete-product="${product.id}">Delete</button>
              </div>`
            : `<div class="product-actions">
                <input class="quantity-input" type="number" min="1" max="${product.stock}" value="1" data-quantity="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>
                <button class="btn btn-primary" data-add-cart="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
              </div>
              <button class="btn btn-secondary full" style="margin-top:7px" data-buy-now="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>`
        }
      </div>
    </article>
  `;
}

function renderProducts() {
  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Manage Your Flowers</h2>
        <p class="muted">Add, edit, delete and update your flower products.</p>
      </div>
      <button class="btn btn-primary" id="addProductButton">+ Add Product</button>
    </div>
    <div class="toolbar">
      <input id="productSearch" placeholder="Search products...">
      <select id="productFilter">
        <option value="">All Categories</option>
        <option>Roses</option><option>Tulips</option>
        <option>Bouquets</option><option>Mixed Flowers</option>
        <option>Plants</option>
      </select>
    </div>
    <div id="productGrid" class="product-grid"></div>
  `;

  $("addProductButton").addEventListener("click", () => openProductModal());
  $("productSearch").addEventListener("input", filterAdminProducts);
  $("productFilter").addEventListener("change", filterAdminProducts);
  filterAdminProducts();
}

function filterAdminProducts() {
  const search = $("productSearch").value.toLowerCase();
  const category = $("productFilter").value;

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) &&
    (!category || product.category === category)
  );

  $("productGrid").innerHTML = filtered.length
    ? filtered.map(product => productCard(product, true)).join("")
    : emptyState("No matching products found.");
}

function openProductModal(productId = "") {
  const product = products.find(item => item.id === productId);

  $("productForm").reset();
  $("productId").value = product ? product.id : "";
  selectedImage = product?.image || "";

  $("productModalTitle").textContent = product ? "Edit Product" : "Add Product";

  if (product) {
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;
    $("productDescription").value = product.description || "";
  }

  if (selectedImage) {
    $("imagePreview").src = selectedImage;
    $("imagePreview").classList.remove("hidden");
  } else {
    $("imagePreview").classList.add("hidden");
  }

  $("productModal").classList.remove("hidden");
}

$("productImage").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("Please choose an image file.");
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
    $("imagePreview").src = selectedImage;
    $("imagePreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const description = $("productDescription").value.trim();

  if (!name || price <= 0 || stock < 0 || !Number.isInteger(stock)) {
    notify("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== id &&
    product.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    notify("A product with that name already exists.");
    return;
  }

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    Object.assign(product, {
      name, category, price, stock, description,
      image: selectedImage
    });

    notify("Product updated successfully.");
  } else {
    products.push({
      id: makeId("P"),
      name, category, price, stock, description,
      image: selectedImage
    });

    notify("Product added successfully.");
  }

  saveData();
  closeModal("productModal");
  renderProducts();
});

function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!confirm(`Delete "${product.name}" from your products?`)) return;

  products = products.filter(item => item.id !== id);
  saveData();
  renderProducts();
  notify("Product deleted.");
}

/* ==========================================
   INVENTORY
========================================== */

function renderInventory() {
  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Inventory Overview</h2>
        <p class="muted">Monitor available products and stock levels.</p>
      </div>
    </div>
    <div class="stats-grid">
      ${statCard("▤", products.reduce((sum, p) => sum + p.stock, 0), "Total Units in Stock")}
      ${statCard("!", products.filter(p => p.stock <= 5).length, "Low Stock Products")}
      ${statCard("×", products.filter(p => p.stock === 0).length, "Out of Stock")}
      ${statCard("✿", products.length, "Product Types")}
    </div>
    <div class="panel table-wrap">
      <table>
        <thead>
          <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Stock Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td><strong>${escapeHTML(product.name)}</strong></td>
              <td>${escapeHTML(product.category)}</td>
              <td>${money(product.price)}</td>
              <td>${product.stock}</td>
              <td>${product.stock === 0
                ? '<span class="status cancelled">Out of stock</span>'
                : product.stock <= 5
                  ? '<span class="status">Low stock</span>'
                  : '<span class="status completed">In stock</span>'}</td>
              <td><button class="btn btn-secondary btn-small" data-edit-product="${product.id}">Edit Stock</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ==========================================
   CUSTOMER SHOP
========================================== */

function renderShop() {
  $("pageContent").innerHTML = `
    <div class="welcome-banner">
      <div class="welcome-symbol">✿</div>
      <p class="eyebrow">FRESH FLOWERS, LOVINGLY ARRANGED</p>
      <h2>Find your perfect bouquet.</h2>
      <p>Make every moment special with flowers from Petal & Vine.</p>
    </div>
    <div class="section-heading">
      <h2>Our Flower Collection</h2>
    </div>
    <div class="toolbar">
      <input id="shopSearch" placeholder="Search flowers...">
      <select id="shopFilter">
        <option value="">All Categories</option>
        <option>Roses</option><option>Tulips</option>
        <option>Bouquets</option><option>Mixed Flowers</option>
        <option>Plants</option>
      </select>
    </div>
    <div id="shopGrid" class="product-grid"></div>
  `;

  $("shopSearch").addEventListener("input", filterShop);
  $("shopFilter").addEventListener("change", filterShop);
  filterShop();
}

function filterShop() {
  const search = $("shopSearch").value.toLowerCase();
  const category = $("shopFilter").value;

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) &&
    (!category || product.category === category)
  );

  $("shopGrid").innerHTML = filtered.length
    ? filtered.map(product => productCard(product, false)).join("")
    : emptyState("No flowers match your search.");
}

function addToCart(productId, quantity = 1) {
  const product = products.find(item => item.id === productId);
  quantity = Number(quantity);

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    notify("Please select a valid quantity.");
    return;
  }

  const existing = cart.find(item => item.productId === productId);
  const alreadyInCart = existing ? existing.quantity : 0;

  if (alreadyInCart + quantity > product.stock) {
    notify(`Only ${product.stock} item(s) are available.`);
    return;
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  notify("Added to your cart.");
}

function buyNow(productId) {
  const quantityInput = document.querySelector(`[data-quantity="${productId}"]`);
  const quantity = quantityInput ? Number(quantityInput.value) : 1;

  const product = products.find(item => item.id === productId);
  if (!product || quantity < 1 || quantity > product.stock) {
    notify("Please select a valid quantity.");
    return;
  }

  cart = [{ productId, quantity }];
  navigate("cart");
}

/* ==========================================
   CUSTOMER CART
========================================== */

function cartDetails() {
  return cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    return {
      ...item,
      product,
      subtotal: product.price * item.quantity
    };
  }).filter(Boolean);
}

function renderCart() {
  const items = cartDetails();
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Your Shopping Cart</h2>
        <p class="muted">Review your selected flowers before checkout.</p>
      </div>
      <button class="btn btn-secondary btn-small" data-go="shop">Continue Shopping</button>
    </div>
    ${
      items.length
        ? `<div class="panel">
            ${items.map(item => `
              <div class="cart-row">
                <div>
                  <strong>${escapeHTML(item.product.name)}</strong>
                  <div class="category-label">${money(item.product.price)} each</div>
                </div>
                <input class="quantity-input" type="number" min="1" max="${item.product.stock}" value="${item.quantity}" data-cart-quantity="${item.productId}">
                <strong>${money(item.subtotal)}</strong>
                <button class="btn btn-danger btn-small" data-remove-cart="${item.productId}">Remove</button>
              </div>
            `).join("")}
            <div class="cart-total">
              <span>Total</span><span>${money(total)}</span>
            </div>
            <button id="checkoutButton" class="btn btn-primary full">Proceed to Checkout</button>
          </div>`
        : emptyState("Your cart is empty. Find something beautiful in our shop.")
    }
  `;

  const checkoutButton = $("checkoutButton");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", openCheckout);
  }
}

/* ==========================================
   CHECKOUT AND ORDERS
========================================== */

function openCheckout() {
  const items = cartDetails();

  if (!items.length) {
    notify("Your cart is empty.");
    return;
  }

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      notify(`${item.product.name} no longer has enough stock.`);
      return;
    }
  }

  $("deliveryName").value = currentUser.name;
  $("deliveryPhone").value = "";
  $("deliveryAddress").value = "";

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  $("checkoutSummary").innerHTML = `
    ${items.map(item => `
      <div class="receipt-line">
        <span>${escapeHTML(item.product.name)} × ${item.quantity}</span>
        <strong>${money(item.subtotal)}</strong>
      </div>
    `).join("")}
    <div class="receipt-line">
      <strong>Total</strong><strong>${money(total)}</strong>
    </div>
    <p>Payment: Cash on Delivery</p>
  `;

  $("checkoutModal").classList.remove("hidden");
}

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  const items = cartDetails();
  if (!items.length) {
    notify("Your cart is empty.");
    return;
  }

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      notify(`Insufficient stock for ${item.product.name}.`);
      return;
    }
  }

  const orderItems = items.map(item => ({
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    subtotal: item.subtotal
  }));

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Deduct inventory only after successful checkout.
  orderItems.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  const order = {
    id: "PV-" + Date.now().toString().slice(-8),
    userId: currentUser.id,
    customerName: $("deliveryName").value.trim(),
    username: currentUser.username,
    phone: $("deliveryPhone").value.trim(),
    address: $("deliveryAddress").value.trim(),
    items: orderItems,
    total,
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    stockRestored: false,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  cart = [];
  saveData();

  closeModal("checkoutModal");
  showReceipt(order);
  navigate("myorders");
  notify("Your COD order has been placed.");
});

function renderMyOrders() {
  const myOrders = orders
    .filter(order => order.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Your Orders</h2>
        <p class="muted">Check your purchases and order status.</p>
      </div>
      <button class="btn btn-secondary btn-small" data-go="shop">Shop Flowers</button>
    </div>
    ${
      myOrders.length
        ? myOrders.map(order => orderCard(order, false)).join("")
        : emptyState("You have not placed an order yet.")
    }
  `;
}

function renderAdminOrders() {
  const sorted = [...orders].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Customer Orders</h2>
        <p class="muted">Review orders and update their status.</p>
      </div>
    </div>
    ${
      sorted.length
        ? sorted.map(order => orderCard(order, true)).join("")
        : emptyState("There are no customer orders yet.")
    }
  `;
}

function orderCard(order, adminMode) {
  const itemText = order.items.map(item =>
    `${escapeHTML(item.name)} × ${item.quantity} (${money(item.subtotal)})`
  ).join("<br>");

  return `
    <article class="order-card">
      <div class="order-card-head">
        <div>
          <h3>${escapeHTML(order.id)}</h3>
          <span class="category-label">${formatDate(order.createdAt)}</span>
        </div>
        ${statusBadge(order.status)}
      </div>
      <div class="order-items">
        ${adminMode
          ? `<strong>Customer:</strong> ${escapeHTML(order.customerName)} (@${escapeHTML(order.username)})<br>
             <strong>Contact:</strong> ${escapeHTML(order.phone)}<br>
             <strong>Address:</strong> ${escapeHTML(order.address)}<br>`
          : ""}
        ${itemText}
      </div>
      <div class="order-bottom">
        <div>
          <strong>${money(order.total)}</strong>
          <div class="category-label">Cash on Delivery</div>
        </div>
        <div class="table-actions">
          <button class="btn btn-secondary btn-small" data-receipt="${order.id}">Receipt</button>
          ${
            adminMode
              ? `<select data-order-status="${order.id}" aria-label="Update order status">
                  ${["Pending", "Confirmed", "Processing", "Delivered", "Cancelled"].map(status =>
                    `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                  ).join("")}
                </select>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  if (order.status === "Cancelled" && newStatus !== "Cancelled") {
    notify("A cancelled order cannot be reopened in this demo.");
    renderAdminOrders();
    return;
  }

  if (newStatus === "Cancelled" && order.status !== "Cancelled" && !order.stockRestored) {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
    order.stockRestored = true;
  }

  if (newStatus !== "Cancelled" && order.status === "Cancelled") {
    notify("Cancelled orders cannot be reopened.");
    return;
  }

  order.status = newStatus;
  saveData();
  renderPage();
  notify("Order status updated.");
}

/* ==========================================
   USER MANAGEMENT
========================================== */

function renderUsers() {
  const customers = users.filter(user => user.role === "customer");

  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Registered Customers</h2>
        <p class="muted">View and manage customer accounts.</p>
      </div>
    </div>
    <div class="panel table-wrap">
      ${
        customers.length
          ? `<table>
              <thead>
                <tr><th>Name</th><th>Username</th><th>Date Registered</th><th>Orders</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${customers.map(user => `
                  <tr>
                    <td><strong>${escapeHTML(user.name)}</strong></td>
                    <td>@${escapeHTML(user.username)}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${orders.filter(order => order.userId === user.id).length}</td>
                    <td><button class="btn btn-danger btn-small" data-delete-user="${user.id}">Delete</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`
          : emptyState("No customer accounts registered yet.")
      }
    </div>
  `;
}

function deleteUser(userId) {
  const user = users.find(item => item.id === userId);
  if (!user || user.role === "admin") return;

  if (!confirm(`Delete customer account "${user.username}"?`)) return;

  users = users.filter(item => item.id !== userId);
  saveData();
  renderUsers();
  notify("Customer account deleted.");
}

/* ==========================================
   RECEIPTS
========================================== */

function renderReceipts() {
  const sorted = [...orders].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Receipts & Transactions</h2>
        <p class="muted">View and print customer order receipts.</p>
      </div>
    </div>
    <div class="panel table-wrap">
      ${
        sorted.length
          ? `<table>
              <thead>
                <tr><th>Receipt / Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${sorted.map(order => `
                  <tr>
                    <td><strong>${escapeHTML(order.id)}</strong></td>
                    <td>${escapeHTML(order.customerName)}</td>
                    <td>${formatDate(order.createdAt)}</td>
                    <td>${money(order.total)}</td>
                    <td>COD</td>
                    <td><button class="btn btn-secondary btn-small" data-receipt="${order.id}">View Receipt</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`
          : emptyState("No receipts available yet.")
      }
    </div>
  `;
}

function showReceipt(order) {
  if (typeof order === "string") {
    order = orders.find(item => item.id === order);
  }

  if (!order) {
    notify("Receipt not found.");
    return;
  }

  $("receiptContent").innerHTML = `
    <div class="receipt">
      <div class="receipt-brand">
        <h2>Petal & Vine</h2>
        <p>Flowers that say it beautifully.</p>
        <p>ORDER RECEIPT</p>
      </div>
      <div class="receipt-line"><span>Order ID</span><strong>${escapeHTML(order.id)}</strong></div>
      <div class="receipt-line"><span>Date</span><span>${formatDate(order.createdAt)}</span></div>
      <div class="receipt-line"><span>Customer</span><span>${escapeHTML(order.customerName)}</span></div>
      <div class="receipt-line"><span>Contact</span><span>${escapeHTML(order.phone)}</span></div>
      <div class="receipt-line"><span>Address</span><span>${escapeHTML(order.address)}</span></div>
      <h3>Order Items</h3>
      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}
      <div class="receipt-line receipt-total">
        <span>Total</span><strong>${money(order.total)}</strong>
      </div>
      <div class="receipt-line"><span>Payment Method</span><strong>Cash on Delivery</strong></div>
      <div class="receipt-line"><span>Order Status</span><strong>${escapeHTML(order.status)}</strong></div>
      <p style="text-align:center;margin-top:25px;font-size:11px;color:#8b7b84">
        Thank you for choosing Petal & Vine!
      </p>
    </div>
  `;

  $("receiptModal").classList.remove("hidden");
}

$("printReceiptButton").addEventListener("click", () => window.print());

/* ==========================================
   REPORTS
========================================== */

function renderReports() {
  const validOrders = orders.filter(order => order.status !== "Cancelled");
  const totalRevenue = validOrders.reduce((sum, order) => sum + order.total, 0);
  const delivered = orders.filter(order => order.status === "Delivered").length;
  const cancelled = orders.filter(order => order.status === "Cancelled").length;

  const productSales = {};

  validOrders.forEach(order => {
    order.items.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
    });
  });

  const bestSellers = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Sales Reports</h2>
        <p class="muted">A summary of your shop's recorded transactions.</p>
      </div>
    </div>
    <div class="stats-grid">
      ${statCard("₱", money(totalRevenue), "Revenue (excluding cancelled)")}
      ${statCard("▣", orders.length, "All Orders")}
      ${statCard("✓", delivered, "Delivered Orders")}
      ${statCard("×", cancelled, "Cancelled Orders")}
    </div>
    <div class="panel">
      <h3>Best-Selling Flowers</h3>
      ${
        bestSellers.length
          ? `<div class="table-wrap"><table>
              <thead><tr><th>Product</th><th>Units Sold</th></tr></thead>
              <tbody>${bestSellers.map(([name, quantity]) => `
                <tr><td>${escapeHTML(name)}</td><td>${quantity}</td></tr>
              `).join("")}</tbody>
            </table></div>`
          : `<p class="muted">Sales information will appear after customers place orders.</p>`
      }
    </div>
  `;
}

/* ==========================================
   ADMIN SETTINGS
========================================== */

function renderSettings() {
  $("pageContent").innerHTML = `
    <div class="section-heading">
      <div>
        <h2>Admin Settings</h2>
        <p class="muted">Update your administrator account and shop information.</p>
      </div>
    </div>
    <div class="panel">
      <h3>Administrator Profile</h3>
      <form id="adminSettingsForm" class="settings-form">
        <label for="adminNameSetting">Admin display name</label>
        <input id="adminNameSetting" value="${escapeHTML(currentUser.name)}" required>
        <label for="adminUsernameSetting">Admin username</label>
        <input id="adminUsernameSetting" value="${escapeHTML(currentUser.username)}" minlength="3" required>
        <label for="adminCurrentPassword">Current password</label>
        <input id="adminCurrentPassword" type="password" required>
        <label for="adminNewPassword">New password (leave blank to keep current)</label>
        <input id="adminNewPassword" type="password" minlength="6">
        <label for="adminConfirmPassword">Confirm new password</label>
        <input id="adminConfirmPassword" type="password">
        <button class="btn btn-primary" type="submit">Save Changes</button>
      </form>
    </div>
    <div class="panel">
      <h3>Shop Information</h3>
      <form id="shopSettingsForm" class="settings-form">
        <label for="shopNameSetting">Shop name</label>
        <input id="shopNameSetting" value="${escapeHTML(settings.shopName)}" required>
        <button class="btn btn-secondary" type="submit">Save Shop Information</button>
      </form>
    </div>
    <div class="panel">
      <h3>Payment Method</h3>
      <p class="muted">Your store currently accepts Cash on Delivery (COD) only.</p>
      <span class="status completed">COD ENABLED</span>
    </div>
  `;

  $("adminSettingsForm").addEventListener("submit", saveAdminSettings);
  $("shopSettingsForm").addEventListener("submit", saveShopSettings);
}

function saveAdminSettings(event) {
  event.preventDefault();

  const name = $("adminNameSetting").value.trim();
  const username = cleanUsername($("adminUsernameSetting").value);
  const currentPassword = $("adminCurrentPassword").value;
  const newPassword = $("adminNewPassword").value;
  const confirmPassword = $("adminConfirmPassword").value;

  if (currentUser.password !== currentPassword) {
    notify("Your current password is incorrect.");
    return;
  }

  if (username.length < 3) {
    notify("Username must have at least 3 characters.");
    return;
  }

  const duplicate = users.some(user =>
    user.id !== currentUser.id &&
    cleanUsername(user.username) === username
  );

  if (duplicate) {
    notify("That username is already being used.");
    return;
  }

  if (newPassword && newPassword.length < 6) {
    notify("New password must have at least 6 characters.");
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    notify("New passwords do not match.");
    return;
  }

  currentUser.name = name;
  currentUser.username = username;

  if (newPassword) currentUser.password = newPassword;

  settings.adminName = name;
  saveData();

  $("profileName").textContent = name;
  $("profileAvatar").textContent = name.charAt(0).toUpperCase();

  notify("Admin account updated.");
  renderSettings();
}

function saveShopSettings(event) {
  event.preventDefault();

  settings.shopName = $("shopNameSetting").value.trim() || "Petal & Vine";
  saveData();

  notify("Shop information updated.");
}

/* ==========================================
   GLOBAL CLICK AND CHANGE EVENTS
========================================== */

$("pageContent").addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.go) {
    navigate(target.dataset.go);
    return;
  }

  if (target.dataset.addCart) {
    const input = document.querySelector(
      `[data-quantity="${target.dataset.addCart}"]`
    );
    addToCart(target.dataset.addCart, input ? input.value : 1);
    return;
  }

  if (target.dataset.buyNow) {
    buyNow(target.dataset.buyNow);
    return;
  }

  if (target.dataset.editProduct) {
    if (currentUser.role === "admin") {
      openProductModal(target.dataset.editProduct);
    }
    return;
  }

  if (target.dataset.deleteProduct) {
    if (currentUser.role === "admin") {
      deleteProduct(target.dataset.deleteProduct);
    }
    return;
  }

  if (target.dataset.removeCart) {
    cart = cart.filter(item => item.productId !== target.dataset.removeCart);
    renderCart();
    return;
  }

  if (target.dataset.receipt) {
    const order = orders.find(item => item.id === target.dataset.receipt);
    if (order && (currentUser.role === "admin" || order.userId === currentUser.id)) {
      showReceipt(order);
    }
    return;
  }

  if (target.dataset.deleteUser && currentUser.role === "admin") {
    deleteUser(target.dataset.deleteUser);
  }
});

$("pageContent").addEventListener("change", event => {
  const target = event.target;

  if (target.dataset.cartQuantity) {
    const item = cart.find(cartItem =>
      cartItem.productId === target.dataset.cartQuantity
    );

    const product = products.find(product =>
      product.id === target.dataset.cartQuantity
    );

    if (!item || !product) return;

    const quantity = Number(target.value);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      notify("Please enter a valid quantity.");
      renderCart();
      return;
    }

    item.quantity = quantity;
    renderCart();
    return;
  }

  if (target.dataset.orderStatus && currentUser.role === "admin") {
    updateOrderStatus(target.dataset.orderStatus, target.value);
  }
});

/* ==========================================
   MODAL HELPERS
========================================== */

function closeModal(id) {
  $(id).classList.add("hidden");
}

document.addEventListener("click", event => {
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) {
    closeModal(closeButton.dataset.close);
  }

  if (event.target.classList.contains("modal")) {
    event.target.classList.add("hidden");
  }
});

/* ==========================================
   HELPERS
========================================== */

function emptyState(message) {
  return `
    <div class="empty-state">
      <span class="flower">✿</span>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusBadge(status) {
  const className = String(status).toLowerCase();
  return `<span class="status ${escapeHTML(className)}">${escapeHTML(status)}</span>`;
}

/* ==========================================
   START APPLICATION
========================================== */

function startApp() {
  $("year").textContent = new Date().getFullYear();

  if (!restoreSession()) {
    initializeAuth();
  }
}
/* ==========================================
   PASSWORD SHOW / HIDE EYE BUTTON
========================================== */

function initializePasswordToggles() {
  const passwordFields = [
    "setupPassword",
    "setupConfirm",
    "registerPassword",
    "registerConfirm",
    "loginPassword",
    "adminCurrentPassword",
    "adminNewPassword",
    "adminConfirmPassword"
  ];

  passwordFields.forEach(id => {
    const input = $(id);

    if (!input || input.dataset.eyeAdded) return;

    input.dataset.eyeAdded = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "password-wrapper";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggle = document.createElement("button");

    toggle.type = "button";
    toggle.className = "toggle-password";
    toggle.innerHTML = "👁";
    toggle.setAttribute("aria-label", "Show password");
    toggle.title = "Show password";

    toggle.addEventListener("click", () => {
      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";
      toggle.innerHTML = isPassword ? "🙈" : "👁";
      toggle.title = isPassword ? "Hide password" : "Show password";
      toggle.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });

    wrapper.appendChild(toggle);
  });
}

// Initialize eye buttons
initializePasswordToggles();
startApp();
