
/* =====================================
   PETAL & VINE FLOWER SHOP
   Complete JavaScript Application
===================================== */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  settings: "pv_settings",
  session: "pv_session",
  cart: "pv_cart"
};

const $ = id => document.getElementById(id);

const getData = (key, fallback = []) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const saveData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

let users = getData(STORAGE.users);
let products = getData(STORAGE.products);
let orders = getData(STORAGE.orders);
let settings = getData(STORAGE.settings, {
  shopName: "Petal & Vine",
  adminName: "Administrator",
  adminEmail: "admin@petalandvine.com"
});

let currentUser = null;
let cart = [];
let selectedReceipt = null;
let editingImage = "";

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

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.remove("hidden");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    $("toast").classList.add("hidden");
  }, 3000);
}

function saveAll() {
  saveData(STORAGE.users, users);
  saveData(STORAGE.products, products);
  saveData(STORAGE.orders, orders);
  saveData(STORAGE.settings, settings);
  saveData(STORAGE.cart, cart);
}

function defaultProducts() {
  return [
    {
      id: "P001",
      name: "Classic Red Roses",
      category: "Roses",
      description: "Beautiful red roses for special moments.",
      price: 899,
      stock: 20,
      image: "https://images.unsplash.com/photo-1548094967-e25a127d1d33?w=600"
    },
    {
      id: "P002",
      name: "Pink Tulip Bouquet",
      category: "Tulips",
      description: "Elegant pink tulips beautifully arranged.",
      price: 750,
      stock: 15,
      image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600"
    },
    {
      id: "P003",
      name: "Sunflower Delight",
      category: "Sunflowers",
      description: "Bright sunflowers to make someone's day.",
      price: 650,
      stock: 18,
      image: "https://images.unsplash.com/photo-1597848212624-e6c4f1f1f1f7?w=600"
    },
    {
      id: "P004",
      name: "White Rose Bouquet",
      category: "Bouquet",
      description: "A lovely arrangement of white roses.",
      price: 999,
      stock: 12,
      image: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600"
    },
    {
      id: "P005",
      name: "Mixed Flower Bouquet",
      category: "Arrangement",
      description: "A colorful mix of seasonal flowers.",
      price: 1200,
      stock: 10,
      image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=600"
    },
    {
      id: "P006",
      name: "Pink Rose Collection",
      category: "Roses",
      description: "Romantic pink roses for someone special.",
      price: 850,
      stock: 14,
      image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=600"
    },
    {
      id: "P007",
      name: "Purple Flower Bouquet",
      category: "Bouquet",
      description: "A graceful purple floral arrangement.",
      price: 1100,
      stock: 8,
      image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600"
    },
    {
      id: "P008",
      name: "Yellow Tulips",
      category: "Tulips",
      description: "Fresh and cheerful yellow tulips.",
      price: 700,
      stock: 16,
      image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600"
    },
    {
      id: "P009",
      name: "Luxury Rose Box",
      category: "Arrangement",
      description: "Premium roses arranged in a gift box.",
      price: 1500,
      stock: 7,
      image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600"
    },
    {
      id: "P010",
      name: "White Tulips",
      category: "Tulips",
      description: "Simple and elegant white tulips.",
      price: 780,
      stock: 10,
      image: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=600"
    },
    {
      id: "P011",
      name: "Garden Sunflowers",
      category: "Sunflowers",
      description: "A beautiful bunch of fresh sunflowers.",
      price: 800,
      stock: 9,
      image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600"
    },
    {
      id: "P012",
      name: "Pastel Bouquet",
      category: "Bouquet",
      description: "Soft pastel flowers for every occasion.",
      price: 1350,
      stock: 11,
      image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600"
    },
    {
      id: "P013",
      name: "Pink and White Roses",
      category: "Roses",
      description: "A lovely combination of pink and white roses.",
      price: 1250,
      stock: 13,
      image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=600"
    },
    {
      id: "P014",
      name: "Spring Arrangement",
      category: "Arrangement",
      description: "Fresh flowers inspired by spring.",
      price: 1450,
      stock: 6,
      image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600"
    },
    {
      id: "P015",
      name: "Mini Flower Bouquet",
      category: "Bouquet",
      description: "A small and sweet floral gift.",
      price: 450,
      stock: 25,
      image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600"
    }
  ];
}

function initialize() {
  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: "ADMIN001",
      name: "Administrator",
      email: "admin@petalandvine.com",
      phone: "",
      address: "",
      password: "admin123",
      role: "admin"
    });
  }

  if (!products.length) {
    products = defaultProducts();
  }

  saveAll();

  $("showRegister").addEventListener("click", showRegister);
  $("showLogin").addEventListener("click", showLogin);

  $("loginForm").addEventListener("submit", login);
  $("registerForm").addEventListener("submit", register);
  $("productForm").addEventListener("submit", saveProduct);
  $("checkoutForm").addEventListener("submit", placeOrder);

  $("logoutBtn").addEventListener("click", logout);

  $("navigation").addEventListener("click", navigationClick);
  $("pageContent").addEventListener("click", pageClick);
  $("pageContent").addEventListener("change", pageChange);
  $("pageContent").addEventListener("input", pageInput);

  $("productImage").addEventListener("change", previewImage);

  document.addEventListener("click", event => {
    const close = event.target.closest("[data-close]");
    if (close) closeModal(close.dataset.close);
  });

  const session = getData(STORAGE.session, null);

  if (session) {
    const user = users.find(u => u.id === session.id);
    if (user) {
      currentUser = user;
      cart = getData(STORAGE.cart, []);
      openApplication();
    }
  }
}

/* =====================================
   AUTHENTICATION
===================================== */

function showRegister() {
  $("loginPanel").classList.add("hidden");
  $("registerPanel").classList.remove("hidden");
}

function showLogin() {
  $("registerPanel").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
}

function register(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const phone = $("registerPhone").value.trim();
  const address = $("registerAddress").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("confirmPassword").value;

  if (password.length < 6) {
    return toast("Password must have at least 6 characters.");
  }

  if (password !== confirm) {
    return toast("Passwords do not match.");
  }

  if (users.some(u => u.email.toLowerCase() === email)) {
    return toast("This email is already registered.");
  }

  const user = {
    id: "USER" + Date.now(),
    name,
    email,
    phone,
    address,
    password,
    role: "customer",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveAll();

  $("registerForm").reset();
  showLogin();

  $("loginEmail").value = email;

  toast("Account created! Please login.");
}

function login(event) {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(u =>
    u.email.toLowerCase() === email &&
    u.password === password
  );

  if (!user) {
    return toast("Incorrect email or password.");
  }

  currentUser = user;

  if (user.role === "customer") {
    cart = getData(STORAGE.cart, []).filter(item =>
      item.userId === user.id
    );
  } else {
    cart = [];
  }

  saveData(STORAGE.session, { id: user.id });

  $("loginForm").reset();
  openApplication();

  toast("Welcome, " + user.name + "!");
}

function logout() {
  currentUser = null;
  cart = [];

  localStorage.removeItem(STORAGE.session);

  $("appSection").classList.add("hidden");
  $("authSection").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");

  showLogin();
  toast("You have logged out.");
}

/* =====================================
   APPLICATION NAVIGATION
===================================== */

const adminNavigation = [
  ["dashboard", "📊 Dashboard"],
  ["products", "🌷 Products"],
  ["inventory", "📦 Inventory"],
  ["users", "👥 User Management"],
  ["orders", "🧾 Customer Orders"],
  ["receipts", "🧾 Receipts"],
  ["settings", "⚙️ Settings"]
];

const customerNavigation = [
  ["home", "🏠 Home"],
  ["shop", "🌸 Shop Flowers"],
  ["cart", "🛒 My Cart"],
  ["orders", "📦 My Orders"],
  ["receipts", "🧾 My Receipts"],
  ["profile", "👤 My Profile"]
];

let currentPage = "dashboard";

function openApplication() {
  $("authSection").classList.add("hidden");
  $("appSection").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");

  $("headerUser").textContent = currentUser.name;
  $("sidebarName").textContent = currentUser.name;
  $("sidebarRole").textContent =
    currentUser.role === "admin" ? "Administrator" : "Customer";

  renderNavigation();

  currentPage = currentUser.role === "admin" ? "dashboard" : "home";
  renderPage();
}

function renderNavigation() {
  const nav = currentUser.role === "admin"
    ? adminNavigation
    : customerNavigation;

  $("navigation").innerHTML = nav.map(([id, label]) => `
    <button class="nav-link ${id === currentPage ? "active" : ""}"
      data-page="${id}">
      ${label}
      ${id === "cart" ? `<span id="cartCount">${cart.reduce((s,i)=>s+i.quantity,0)}</span>` : ""}
    </button>
  `).join("");
}

function navigationClick(event) {
  const button = event.target.closest("[data-page]");
  if (!button) return;

  currentPage = button.dataset.page;
  renderNavigation();
  renderPage();
}

function renderPage() {
  if (!currentUser) return;

  const pages = currentUser.role === "admin"
    ? {
        dashboard: adminDashboard,
        products: adminProducts,
        inventory: adminInventory,
        users: adminUsers,
        orders: adminOrders,
        receipts: adminReceipts,
        settings: adminSettings
      }
    : {
        home: customerHome,
        shop: customerShop,
        cart: customerCart,
        orders: customerOrders,
        receipts: customerReceipts,
        profile: customerProfile
      };

  if (!pages[currentPage]) {
    currentPage = currentUser.role === "admin" ? "dashboard" : "home";
  }

  $("pageContent").innerHTML = pages[currentPage]();
}

/* =====================================
   ADMIN DASHBOARD
===================================== */

function adminDashboard() {
  const revenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const pending = orders.filter(o => o.status === "Pending").length;
  const customers = users.filter(u => u.role === "customer").length;
  const stock = products.reduce((sum, p) => sum + p.stock, 0);

  return `
    <div class="hero">
      <div>
        <span class="eyebrow">ADMINISTRATION</span>
        <h2>Welcome, ${escapeHTML(settings.adminName)}!</h2>
        <p>Manage your flower shop and customer orders.</p>
      </div>
      <span class="hero-flower">🌺</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>💰</span>
        <p>Total Sales</p>
        <h2>${money(revenue)}</h2>
      </div>
      <div class="stat-card">
        <span>📦</span>
        <p>Total Products</p>
        <h2>${products.length}</h2>
      </div>
      <div class="stat-card">
        <span>👥</span>
        <p>Customers</p>
        <h2>${customers}</h2>
      </div>
      <div class="stat-card">
        <span>🧾</span>
        <p>Pending Orders</p>
        <h2>${pending}</h2>
      </div>
    </div>

    <div class="panel">
      <h3>Recent Customer Orders</h3>
      ${orders.length ? orderTable(orders.slice().reverse().slice(0,5), true) : empty("No orders yet.")}
    </div>

    <div class="panel">
      <h3>Inventory Overview</h3>
      <p>Total units in stock: <strong>${stock}</strong></p>
      <p>Low-stock products: <strong>${products.filter(p=>p.stock<=5).length}</strong></p>
    </div>
  `;
}

/* =====================================
   ADMIN PRODUCTS
===================================== */

function adminProducts() {
  return `
    <div class="page-heading">
      <div>
        <h2>Product Management</h2>
        <p>Add, edit and delete flower products.</p>
      </div>
      <button class="btn-primary" data-action="add-product">+ Add Product</button>
    </div>

    <div class="panel">
      <input id="adminProductSearch" placeholder="Search products...">
    </div>

    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Image</th><th>Product</th><th>Category</th>
            <th>Price</th><th>Stock</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="adminProductRows">
          ${productRows(products)}
        </tbody>
      </table>
    </div>
  `;
}

function productRows(list) {
  if (!list.length) {
    return `<tr><td colspan="6">No products found.</td></tr>`;
  }

  return list.map(p => `
    <tr>
      <td><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}"></td>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(p.category)}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <div class="table-actions">
          <button class="btn-outline" data-action="edit-product" data-id="${p.id}">Edit</button>
          <button class="btn-danger" data-action="delete-product" data-id="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openProductModal(id = null) {
  $("productForm").reset();
  $("productId").value = "";
  $("productPreview").classList.add("hidden");
  editingImage = "";

  if (id) {
    const p = products.find(item => item.id === id);
    if (!p) return;

    $("productModalTitle").textContent = "Edit Product";
    $("productId").value = p.id;
    $("productName").value = p.name;
    $("productCategory").value = p.category;
    $("productDescription").value = p.description;
    $("productPrice").value = p.price;
    $("productStock").value = p.stock;

    editingImage = p.image;
    $("productPreview").src = p.image;
    $("productPreview").classList.remove("hidden");
  } else {
    $("productModalTitle").textContent = "Add Product";
  }

  openModal("productModal");
}

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    return toast("Please select an image file.");
  }

  if (file.size > 2 * 1024 * 1024) {
    event.target.value = "";
    return toast("Image must be smaller than 2 MB.");
  }

  const reader = new FileReader();

  reader.onload = () => {
    editingImage = reader.result;
    $("productPreview").src = editingImage;
    $("productPreview").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}

function saveProduct(event) {
  event.preventDefault();

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (!name || !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return toast("Please enter valid product details.");
  }

  if (products.some(p =>
    p.id !== id && p.name.toLowerCase() === name.toLowerCase()
  )) {
    return toast("A product with this name already exists.");
  }

  const image = editingImage ||
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600";

  if (id) {
    const index = products.findIndex(p => p.id === id);
    if (index < 0) return;

    products[index] = {
      ...products[index],
      name, category, description, price, stock, image
    };

    toast("Product updated successfully.");
  } else {
    products.push({
      id: "P" + Date.now(),
      name, category, description, price, stock, image
    });

    toast("Product added successfully.");
  }

  saveAll();
  closeModal("productModal");
  renderPage();
}

function deleteProduct(id) {
  const p = products.find(item => item.id === id);
  if (!p) return;

  if (!confirm(`Delete ${p.name}?`)) return;

  products = products.filter(item => item.id !== id);
  cart = cart.filter(item => item.productId !== id);

  saveAll();
  renderPage();
  toast("Product deleted.");
}

/* =====================================
   ADMIN INVENTORY
===================================== */

function adminInventory() {
  return `
    <div class="page-heading">
      <div>
        <h2>Inventory Management</h2>
        <p>Monitor stock levels and product availability.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span>📦</span><p>Total Units</p>
        <h2>${products.reduce((s,p)=>s+p.stock,0)}</h2></div>
      <div class="stat-card"><span>⚠️</span><p>Low Stock</p>
        <h2>${products.filter(p=>p.stock>0 && p.stock<=5).length}</h2></div>
      <div class="stat-card"><span>❌</span><p>Out of Stock</p>
        <h2>${products.filter(p=>p.stock===0).length}</h2></div>
      <div class="stat-card"><span>🌸</span><p>Products</p>
        <h2>${products.length}</h2></div>
    </div>

    <div class="table-responsive">
      <table>
        <thead><tr>
          <th>Product</th><th>Category</th><th>Stock</th>
          <th>Status</th><th>Update Stock</th>
        </tr></thead>
        <tbody>
          ${products.map(p=>`
            <tr>
              <td>${escapeHTML(p.name)}</td>
              <td>${escapeHTML(p.category)}</td>
              <td>${p.stock}</td>
              <td>${p.stock===0?"Out of Stock":p.stock<=5?"Low Stock":"Available"}</td>
              <td>
                <div class="table-actions">
                  <input type="number" min="0" step="1"
                    value="${p.stock}" id="stock-${p.id}">
                  <button class="btn-primary" data-action="update-stock"
                    data-id="${p.id}">Save</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function updateStock(id) {
  const input = $("stock-" + id);
  const value = Number(input.value);

  if (!Number.isInteger(value) || value < 0) {
    return toast("Enter a valid stock quantity.");
  }

  const p = products.find(item=>item.id===id);
  if (!p) return;

  p.stock = value;
  saveAll();
  renderPage();
  toast("Inventory updated.");
}

/* =====================================
   ADMIN USER MANAGEMENT
===================================== */

function adminUsers() {
  const customers = users.filter(u => u.role === "customer");

  return `
    <div class="page-heading">
      <div>
        <h2>User Management</h2>
        <p>View and manage registered customers.</p>
      </div>
    </div>

    <div class="table-responsive">
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Phone</th>
          <th>Address</th><th>Action</th></tr>
        </thead>
        <tbody>
          ${customers.length ? customers.map(u=>`
            <tr>
              <td>${escapeHTML(u.name)}</td>
              <td>${escapeHTML(u.email)}</td>
              <td>${escapeHTML(u.phone)}</td>
              <td>${escapeHTML(u.address)}</td>
              <td>
                <button class="btn-danger" data-action="delete-user"
                  data-id="${u.id}">Delete</button>
              </td>
            </tr>
          `).join("") : `<tr><td colspan="5">No customers registered.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function deleteUser(id) {
  const user = users.find(u=>u.id===id);
  if (!user || user.role === "admin") return;

  if (!confirm(`Delete customer ${user.name}?`)) return;

  users = users.filter(u=>u.id!==id);
  cart = cart.filter(item=>item.userId!==id);

  saveAll();
  renderPage();
  toast("Customer deleted.");
}

/* =====================================
   CUSTOMER HOME AND SHOP
===================================== */

function customerHome() {
  return `
    <div class="hero">
      <div>
        <span class="eyebrow">WELCOME TO PETAL & VINE</span>
        <h2>Flowers make moments beautiful.</h2>
        <p>Find the perfect flowers for someone special.</p>
        <button class="btn-primary" data-action="go-shop">Shop Now</button>
      </div>
      <span class="hero-flower">💐</span>
    </div>

    <div class="page-heading">
      <div><h2>Featured Flowers</h2>
      <p>Discover our beautiful flower collections.</p></div>
    </div>

    <div class="product-grid">
      ${products.filter(p=>p.stock>0).slice(0,4).map(productCard).join("")}
    </div>
  `;
}

function customerShop() {
  return `
    <div class="page-heading">
      <div><h2>Our Flower Collection</h2>
      <p>Choose your favorite flowers.</p></div>
      <input id="shopSearch" placeholder="Search flowers...">
    </div>

    <div class="product-grid" id="shopProducts">
      ${products.map(productCard).join("")}
    </div>
  `;
}

function productCard(p) {
  return `
    <div class="product-card">
      <img class="product-image"
        src="${escapeHTML(p.image)}"
        alt="${escapeHTML(p.name)}"
        onerror="this.src='https://placehold.co/500x350/f8eaf0/7b3f5b?text=Flower'">

      <div class="product-info">
        <span class="product-category">${escapeHTML(p.category)}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <p class="product-description">${escapeHTML(p.description)}</p>
        <div class="product-price">${money(p.price)}</div>
        <p class="stock-text">
          ${p.stock > 0 ? p.stock + " available" : "Out of Stock"}
        </p>

        <div class="buy-controls">
          <input type="number" min="1" max="${p.stock}"
            value="1" id="qty-${p.id}" ${p.stock===0?"disabled":""}>
          <button class="btn-primary" data-action="add-cart"
            data-id="${p.id}" ${p.stock===0?"disabled":""}>
            Add to Cart
          </button>
        </div>

        <button class="btn-outline full-width"
          data-action="buy-now" data-id="${p.id}"
          ${p.stock===0?"disabled":""}>Buy Now</button>
      </div>
    </div>
  `;
}

/* =====================================
   CUSTOMER CART
===================================== */

function getCartItems() {
  return cart.filter(item => item.userId === currentUser.id);
}

function addToCart(id, quantity, buyImmediately = false) {
  const p = products.find(item=>item.id===id);
  quantity = Number(quantity);

  if (!p || !Number.isInteger(quantity) || quantity < 1) {
    return toast("Please enter a valid quantity.");
  }

  if (quantity > p.stock) {
    return toast("Not enough stock available.");
  }

  if (buyImmediately) {
    cart = [{
      userId: currentUser.id,
      productId: id,
      quantity
    }];
    saveAll();
    openCheckout();
    return;
  }

  const existing = cart.find(item =>
    item.userId === currentUser.id && item.productId === id
  );

  const newQuantity = (existing ? existing.quantity : 0) + quantity;

  if (newQuantity > p.stock) {
    return toast("You cannot add more than the available stock.");
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.push({
      userId: currentUser.id,
      productId: id,
      quantity
    });
  }

  saveAll();
  renderNavigation();
  toast("Added to cart!");
}

function customerCart() {
  const items = getCartItems();

  if (!items.length) {
    return `<div class="empty-state">
      <h2>🛒 Your cart is empty</h2>
      <p>Browse our flowers and add your favorites.</p>
      <button class="btn-primary" data-action="go-shop">Shop Now</button>
    </div>`;
  }

  const total = items.reduce((sum,item)=>{
    const p = products.find(x=>x.id===item.productId);
    return sum + (p ? p.price*item.quantity : 0);
  },0);

  return `
    <div class="page-heading">
      <div><h2>My Shopping Cart</h2>
      <p>Review your selected flowers.</p></div>
    </div>

    ${items.map(item=>{
      const p = products.find(x=>x.id===item.productId);
      if (!p) return "";

      return `
        <div class="cart-item">
          <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
          <div>
            <h3>${escapeHTML(p.name)}</h3>
            <p>${money(p.price)} each</p>
            <p>Subtotal: ${money(p.price*item.quantity)}</p>
          </div>
          <div>
            <div class="cart-controls">
              <input type="number" min="1" max="${p.stock}"
                value="${item.quantity}" id="cartqty-${p.id}">
              <button class="btn-outline" data-action="update-cart"
                data-id="${p.id}">Update</button>
              <button class="btn-danger" data-action="remove-cart"
                data-id="${p.id}">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join("")}

    <div class="cart-total">
      <p>Total Items: ${items.reduce((s,i)=>s+i.quantity,0)}</p>
      <h2>Total: ${money(total)}</h2>
      <button class="btn-primary" data-action="checkout-cart">Proceed to Checkout</button>
    </div>
  `;
}

function updateCart(id) {
  const input = $("cartqty-" + id);
  const quantity = Number(input.value);
  const p = products.find(x=>x.id===id);
  const item = cart.find(x=>
    x.userId===currentUser.id && x.productId===id
  );

  if (!item || !p || !Number.isInteger(quantity) ||
      quantity < 1 || quantity > p.stock) {
    return toast("Invalid quantity or insufficient stock.");
  }

  item.quantity = quantity;
  saveAll();
  renderPage();
  renderNavigation();
  toast("Cart updated.");
}

function removeCart(id) {
  cart = cart.filter(item =>
    !(item.userId===currentUser.id && item.productId===id)
  );

  saveAll();
  renderPage();
  renderNavigation();
  toast("Item removed.");
}

/* =====================================
   CHECKOUT AND COD
===================================== */

function openCheckout() {
  const items = getCartItems();

  if (!items.length) return toast("Your cart is empty.");

  const invalid = items.some(item => {
    const p = products.find(x=>x.id===item.productId);
    return !p || item.quantity > p.stock;
  });

  if (invalid) return toast("Please update your cart quantities.");

  $("checkoutName").value = currentUser.name;
  $("checkoutPhone").value = currentUser.phone || "";
  $("checkoutAddress").value = currentUser.address || "";

  const total = items.reduce((sum,item)=>{
    const p = products.find(x=>x.id===item.productId);
    return sum + p.price*item.quantity;
  },0);

  $("checkoutSummary").innerHTML = `
    <strong>Order Summary</strong>
    ${items.map(item=>{
      const p=products.find(x=>x.id===item.productId);
      return `<p>${escapeHTML(p.name)} × ${item.quantity}
        — ${money(p.price*item.quantity)}</p>`;
    }).join("")}
    <hr>
    <strong>Total: ${money(total)}</strong>
    <p>Payment: Cash on Delivery</p>
  `;

  openModal("checkoutModal");
}

function placeOrder(event) {
  event.preventDefault();

  const items = getCartItems();

  if (!items.length) return toast("Your cart is empty.");

  for (const item of items) {
    const p = products.find(x=>x.id===item.productId);
    if (!p || item.quantity > p.stock) {
      return toast("One or more products are unavailable.");
    }
  }

  const orderItems = items.map(item=>{
    const p=products.find(x=>x.id===item.productId);
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: item.quantity,
      subtotal: p.price*item.quantity
    };
  });

  const total = orderItems.reduce((s,i)=>s+i.subtotal,0);

  const order = {
    id: "ORD-" + Date.now(),
    userId: currentUser.id,
    customer: $("checkoutName").value.trim(),
    phone: $("checkoutPhone").value.trim(),
    address: $("checkoutAddress").value.trim(),
    payment: "Cash on Delivery",
    paymentStatus: "Pending",
    status: "Pending",
    items: orderItems,
    total,
    date: new Date().toISOString()
  };

  orderItems.forEach(item=>{
    const p=products.find(x=>x.id===item.productId);
    p.stock -= item.quantity;
  });

  orders.push(order);

  cart = cart.filter(item=>item.userId!==currentUser.id);

  currentUser.name = order.customer;
  currentUser.phone = order.phone;
  currentUser.address = order.address;

  users = users.map(u=>u.id===currentUser.id ? currentUser : u);

  saveAll();
  closeModal("checkoutModal");

  selectedReceipt = order;
  renderNavigation();
  currentPage = "orders";
  renderPage();
  showReceipt(order);

  toast("Order placed successfully!");
}

/* =====================================
   ORDER MANAGEMENT
===================================== */

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g,"-");
}

function orderTable(list, admin = false) {
  if (!list.length) return empty("No orders found.");

  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Order ID</th><th>Customer</th><th>Date</th>
            <th>Total</th><th>Payment</th><th>Status</th>
            ${admin ? "<th>Action</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${list.map(o=>`
            <tr>
              <td>${escapeHTML(o.id)}</td>
              <td>${escapeHTML(o.customer)}</td>
              <td>${new Date(o.date).toLocaleDateString()}</td>
              <td>${money(o.total)}</td>
              <td>${escapeHTML(o.payment)}</td>
              <td><span class="status ${statusClass(o.status)}">${escapeHTML(o.status)}</span></td>
              ${admin ? `
                <td>
                  <div class="table-actions">
                    <button class="btn-outline" data-action="view-order"
                      data-id="${o.id}">View</button>
                    <select data-action="order-status" data-id="${o.id}">
                      ${["Pending","Processing","Shipped","Delivered","Cancelled"].map(s=>
                        `<option ${o.status===s?"selected":""}>${s}</option>`
                      ).join("")}
                    </select>
                  </div>
                </td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function adminOrders() {
  return `
    <div class="page-heading">
      <div><h2>Customer Orders</h2>
      <p>Manage purchases and delivery status.</p></div>
    </div>
    <div class="panel">
      ${orderTable(orders.slice().reverse(), true)}
    </div>
  `;
}

function customerOrders() {
  const mine = orders.filter(o=>o.userId===currentUser.id).reverse();

  if (!mine.length) return empty("You have not placed any orders yet.");

  return `
    <div class="page-heading">
      <div><h2>My Orders</h2>
      <p>Track your flower purchases.</p></div>
    </div>
    ${mine.map(o=>`
      <div class="order-card">
        <h3>Order ${escapeHTML(o.id)}</h3>
        <div class="order-meta">
          <span>${new Date(o.date).toLocaleString()}</span>
          <span>Total: ${money(o.total)}</span>
          <span>Payment: ${escapeHTML(o.payment)}</span>
          <span class="status ${statusClass(o.status)}">${escapeHTML(o.status)}</span>
        </div>
        <div class="order-items">
          ${o.items.map(i=>`
            <p>${escapeHTML(i.name)} × ${i.quantity} — ${money(i.subtotal)}</p>
          `).join("")}
        </div>
        <div class="form-actions">
          <button class="btn-outline" data-action="view-order"
            data-id="${o.id}">View Receipt</button>
          ${o.status==="Pending" ? `
            <button class="btn-danger" data-action="cancel-order"
              data-id="${o.id}">Cancel Order</button>` : ""}
        </div>
      </div>
    `).join("")}
  `;
}

function updateOrderStatus(id, status) {
  const order = orders.find(o=>o.id===id);
  if (!order) return;

  const previous = order.status;

  if (previous === "Cancelled" && status !== "Cancelled") {
    return toast("Cancelled orders cannot be reopened.");
  }

  if (previous !== "Cancelled" && status === "Cancelled") {
    if (!confirm("Cancel this order and restore its stock?")) {
      renderPage();
      return;
    }

    order.items.forEach(item=>{
      const p=products.find(x=>x.id===item.productId);
      if (p) p.stock += item.quantity;
    });
  }

  order.status = status;

  if (status === "Delivered") {
    order.paymentStatus = "Paid";
  }

  saveAll();
  renderPage();
  toast("Order status updated.");
}

function cancelCustomerOrder(id) {
  const order = orders.find(o=>
    o.id===id && o.userId===currentUser.id
  );

  if (!order || order.status !== "Pending") {
    return toast("This order cannot be cancelled.");
  }

  if (!confirm("Are you sure you want to cancel this order?")) return;

  order.status = "Cancelled";

  order.items.forEach(item=>{
    const p=products.find(x=>x.id===item.productId);
    if (p) p.stock += item.quantity;
  });

  saveAll();
  renderPage();
  toast("Order cancelled.");
}

/* =====================================
   RECEIPTS
===================================== */

function receiptHTML(order) {
  return `
    <div class="receipt" id="receiptPrintable">
      <h2>🌷 ${escapeHTML(settings.shopName)}</h2>
      <h3>OFFICIAL ORDER RECEIPT</h3>
      <div class="receipt-line">
        <span>Receipt / Order No.</span>
        <strong>${escapeHTML(order.id)}</strong>
      </div>
      <div class="receipt-line">
        <span>Date</span>
        <span>${new Date(order.date).toLocaleString()}</span>
      </div>
      <div class="receipt-line">
        <span>Customer</span>
        <span>${escapeHTML(order.customer)}</span>
      </div>
      <div class="receipt-line">
        <span>Phone</span>
        <span>${escapeHTML(order.phone)}</span>
      </div>
      <div class="receipt-line">
        <span>Address</span>
        <span>${escapeHTML(order.address)}</span>
      </div>
      <div class="receipt-line">
        <span>Payment</span>
        <span>${escapeHTML(order.payment)}</span>
      </div>
      <div class="receipt-line">
        <span>Payment Status</span>
        <span>${escapeHTML(order.paymentStatus)}</span>
      </div>
      <hr>
      <strong>Purchased Items</strong>
      ${order.items.map(item=>`
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>
      `).join("")}
      <div class="receipt-total">Total: ${money(order.total)}</div>
      <p style="text-align:center;margin-top:25px">
        Thank you for shopping with us! 💐
      </p>
    </div>
  `;
}

function showReceipt(order) {
  selectedReceipt = order;
  $("receiptContent").innerHTML = receiptHTML(order);
  openModal("receiptModal");
}

function adminReceipts() {
  return `
    <div class="page-heading">
      <div><h2>Receipts</h2>
      <p>View and print customer receipts.</p></div>
    </div>
    <div class="panel">
      ${orders.length ? orderTable(orders.slice().reverse(), false) : empty("No receipts available.")}
      ${orders.map(o=>`
        <div class="form-actions">
          <span>${escapeHTML(o.id)} — ${escapeHTML(o.customer)}</span>
          <button class="btn-outline" data-action="view-order"
            data-id="${o.id}">View Receipt</button>
        </div>
      `).join("")}
    </div>
  `;
}

function customerReceipts() {
  const mine = orders.filter(o=>o.userId===currentUser.id);

  return `
    <div class="page-heading">
      <div><h2>My Receipts</h2>
      <p>Your order payment records.</p></div>
    </div>
    <div class="panel">
      ${mine.length ? mine.map(o=>`
        <div class="receipt-line">
          <span>${escapeHTML(o.id)} — ${new Date(o.date).toLocaleDateString()}</span>
          <strong>${money(o.total)}</strong>
          <button class="btn-outline" data-action="view-order"
            data-id="${o.id}">View</button>
        </div>
      `).join("") : empty("No receipts available.")}
    </div>
  `;
}

function printReceipt() {
  if (!selectedReceipt) return;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    return toast("Please allow pop-ups to print your receipt.");
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html><head><title>Receipt</title>
    <style>
      body{font-family:Arial,sans-serif;padding:25px;color:#392b32}
      .receipt{max-width:500px;margin:auto;border:1px dashed #eadde3;padding:20px}
      h2,h3{text-align:center;color:#7b3f5b}
      .receipt-line{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eadde3;font-size:13px}
      .receipt-total{text-align:right;font-size:20px;font-weight:bold;color:#7b3f5b;margin-top:15px}
      @media print{body{padding:0}}
    </style></head><body>
    ${receiptHTML(selectedReceipt)}
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>
  `);

  printWindow.document.close();
}

/* =====================================
   ADMIN SETTINGS
===================================== */

function adminSettings() {
  return `
    <div class="page-heading">
      <div><h2>Settings</h2>
      <p>Manage your shop and administrator information.</p></div>
    </div>

    <div class="panel settings-panel">
      <h3>Shop Information</h3>
      <form id="settingsForm">
        <label>Shop Name</label>
        <input id="settingShopName" value="${escapeHTML(settings.shopName)}" required>

        <label>Administrator Name</label>
        <input id="settingAdminName" value="${escapeHTML(settings.adminName)}" required>

        <label>Administrator Email</label>
        <input type="email" id="settingAdminEmail"
          value="${escapeHTML(settings.adminEmail)}" required>

        <button class="btn-primary full-width" type="submit">Save Settings</button>
      </form>

      <h3>Change Administrator Password</h3>
      <form id="passwordForm">
        <label>Current Password</label>
        <input type="password" id="oldAdminPassword" required>

        <label>New Password</label>
        <input type="password" id="newAdminPassword" minlength="6" required>

        <label>Confirm New Password</label>
        <input type="password" id="confirmAdminPassword" minlength="6" required>

        <button class="btn-primary full-width" type="submit">Change Password</button>
      </form>

      <h3>System Information</h3>
      <p>Total Products: ${products.length}</p>
      <p>Registered Users: ${users.length}</p>
      <p>Total Orders: ${orders.length}</p>
      <p>Payment Method: Cash on Delivery</p>
    </div>
  `;
}

/* =====================================
   CUSTOMER PROFILE
===================================== */

function customerProfile() {
  return `
    <div class="page-heading">
      <div><h2>My Profile</h2>
      <p>Update your personal information.</p></div>
    </div>

    <div class="panel settings-panel">
      <form id="profileForm">
        <label>Full Name</label>
        <input id="profileName" value="${escapeHTML(currentUser.name)}" required>

        <label>Email Address</label>
        <input type="email" id="profileEmail"
          value="${escapeHTML(currentUser.email)}" required>

        <label>Phone Number</label>
        <input id="profilePhone" value="${escapeHTML(currentUser.phone)}" required>

        <label>Delivery Address</label>
        <textarea id="profileAddress" rows="3" required>${escapeHTML(currentUser.address)}</textarea>

        <button class="btn-primary full-width" type="submit">Update Profile</button>
      </form>

      <h3>Change Password</h3>
      <form id="customerPasswordForm">
        <label>Current Password</label>
        <input type="password" id="profileOldPassword" required>

        <label>New Password</label>
        <input type="password" id="profileNewPassword" minlength="6" required>

        <label>Confirm Password</label>
        <input type="password" id="profileConfirmPassword" minlength="6" required>

        <button class="btn-primary full-width" type="submit">Change Password</button>
      </form>
    </div>
  `;
}

/* =====================================
   MODALS AND HELPERS
===================================== */

function openModal(id) {
  $(id).classList.remove("hidden");
}

function closeModal(id) {
  $(id).classList.add("hidden");
}

function empty(message) {
  return `<div class="empty-state">${escapeHTML(message)}</div>`;
}

function viewOrder(id) {
  const order = orders.find(o=>o.id===id);
  if (!order) return;

  if (currentUser.role !== "admin" &&
      order.userId !== currentUser.id) return;

  showReceipt(order);
}

/* =====================================
   PAGE ACTIONS
===================================== */

function pageClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  switch (action) {
    case "go-shop":
      currentPage = "shop";
      renderNavigation();
      renderPage();
      break;

    case "add-product":
      openProductModal();
      break;

    case "edit-product":
      openProductModal(id);
      break;

    case "delete-product":
      deleteProduct(id);
      break;

    case "update-stock":
      updateStock(id);
      break;

    case "delete-user":
      deleteUser(id);
      break;

    case "add-cart":
      addToCart(id, $("qty-"+id).value);
      break;

    case "buy-now":
      addToCart(id, $("qty-"+id).value, true);
      break;

    case "update-cart":
      updateCart(id);
      break;

    case "remove-cart":
      removeCart(id);
      break;

    case "checkout-cart":
      openCheckout();
      break;

    case "view-order":
      viewOrder(id);
      break;

    case "cancel-order":
      cancelCustomerOrder(id);
      break;
  }
}

function pageChange(event) {
  const target = event.target;

  if (target.matches('[data-action="order-status"]')) {
    updateOrderStatus(target.dataset.id, target.value);
  }
}

function pageInput(event) {
  const target = event.target;

  if (target.id === "adminProductSearch") {
    const query = target.value.toLowerCase();

    $("adminProductRows").innerHTML = productRows(
      products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    );
  }

  if (target.id === "shopSearch") {
    const query = target.value.toLowerCase();

    $("shopProducts").innerHTML = products
      .filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
      .map(productCard).join("");
  }
}

/* =====================================
   FORM SUBMISSIONS
===================================== */

document.addEventListener("submit", event => {
  if (event.target.id === "settingsForm") {
    event.preventDefault();

    const admin = users.find(u=>u.role==="admin");

    const email = $("settingAdminEmail").value.trim().toLowerCase();

    if (users.some(u=>u.id!==admin.id && u.email.toLowerCase()===email)) {
      return toast("That email is already used.");
    }

    settings.shopName = $("settingShopName").value.trim();
    settings.adminName = $("settingAdminName").value.trim();
    settings.adminEmail = email;

    admin.name = settings.adminName;
    admin.email = email;
    currentUser = admin;

    saveAll();
    openApplication();
    toast("Settings saved.");
  }

  if (event.target.id === "passwordForm") {
    event.preventDefault();

    const admin = users.find(u=>u.role==="admin");
    const old = $("oldAdminPassword").value;
    const next = $("newAdminPassword").value;
    const confirmPassword = $("confirmAdminPassword").value;

    if (admin.password !== old) {
      return toast("Current password is incorrect.");
    }

    if (next.length < 6 || next !== confirmPassword) {
      return toast("Check your new password.");
    }

    admin.password = next;
    saveAll();
    event.target.reset();
    toast("Admin password changed.");
  }

  if (event.target.id === "profileForm") {
    event.preventDefault();

    const email = $("profileEmail").value.trim().toLowerCase();

    if (users.some(u=>u.id!==currentUser.id &&
      u.email.toLowerCase()===email)) {
      return toast("Email is already registered.");
    }

    currentUser.name = $("profileName").value.trim();
    currentUser.email = email;
    currentUser.phone = $("profilePhone").value.trim();
    currentUser.address = $("profileAddress").value.trim();

    users = users.map(u=>u.id===currentUser.id ? currentUser : u);

    saveAll();
    openApplication();
    toast("Profile updated.");
  }

  if (event.target.id === "customerPasswordForm") {
    event.preventDefault();

    const old = $("profileOldPassword").value;
    const next = $("profileNewPassword").value;
    const confirmPassword = $("profileConfirmPassword").value;

    if (currentUser.password !== old) {
      return toast("Current password is incorrect.");
    }

    if (next.length < 6 || next !== confirmPassword) {
      return toast("New passwords do not match or are too short.");
    }

    currentUser.password = next;
    users = users.map(u=>u.id===currentUser.id ? currentUser : u);

    saveAll();
    event.target.reset();
    toast("Password changed successfully.");
  }
});

/* =====================================
   START APPLICATION
===================================== */

initialize();
