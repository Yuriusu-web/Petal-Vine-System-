
"use strict";

/* PETAL & VINE - FLOWER SHOP SYSTEM */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  current: "pv_current",
  settings: "pv_settings"
};

const $ = id => document.getElementById(id);

function read(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return data === null ? fallback : data;
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
let currentUser = read(STORAGE.current, null);
let settings = read(STORAGE.settings, { adminName: "Administrator", shopName: "Petal & Vine" });
let cart = [];

const defaultProducts = [
  { id: 1, name: "Classic Rose Bouquet", category: "Roses", description: "Beautiful red roses for special moments.", price: 850, stock: 20, image: "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=600" },
  { id: 2, name: "Pink Tulip Bouquet", category: "Tulips", description: "Soft pink tulips with elegant wrapping.", price: 950, stock: 15, image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600" },
  { id: 3, name: "Sunflower Bundle", category: "Sunflowers", description: "Bright sunflowers to make someone smile.", price: 650, stock: 18, image: "https://images.unsplash.com/photo-1597848212624-e6e7a8f3f2f1?w=600" },
  { id: 4, name: "White Lily Bouquet", category: "Lilies", description: "Elegant white lilies for any occasion.", price: 1100, stock: 12, image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600" },
  { id: 5, name: "Mixed Flower Bouquet", category: "Mixed", description: "A colorful selection of fresh flowers.", price: 1200, stock: 10, image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600" },
  { id: 6, name: "Baby's Breath", category: "Specialty", description: "Delicate flowers with a lovely appearance.", price: 550, stock: 25, image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600" },
  { id: 7, name: "Purple Orchid", category: "Orchids", description: "A graceful orchid arrangement.", price: 1350, stock: 8, image: "https://images.unsplash.com/photo-1566943009142-2a8f9a2c5e4b?w=600" },
  { id: 8, name: "White Rose Bouquet", category: "Roses", description: "Pure white roses with elegant wrapping.", price: 900, stock: 16, image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600" },
  { id: 9, name: "Pink Carnations", category: "Carnations", description: "Sweet carnations for a thoughtful gift.", price: 700, stock: 14, image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=600" },
  { id: 10, name: "Garden Bouquet", category: "Mixed", description: "A fresh garden-inspired arrangement.", price: 1000, stock: 9, image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600" },
  { id: 11, name: "Peony Bouquet", category: "Peonies", description: "Full and beautiful seasonal peonies.", price: 1500, stock: 7, image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600" },
  { id: 12, name: "Daisy Bouquet", category: "Daisies", description: "Cheerful daisies for everyday happiness.", price: 600, stock: 22, image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600" },
  { id: 13, name: "Red Tulip Bouquet", category: "Tulips", description: "A lovely red tulip arrangement.", price: 980, stock: 11, image: "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=600" },
  { id: 14, name: "Lavender Bouquet", category: "Lavender", description: "A calming lavender-inspired bouquet.", price: 750, stock: 13, image: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=600" },
  { id: 15, name: "Luxury Flower Box", category: "Luxury", description: "A premium flower box for special occasions.", price: 1800, stock: 5, image: "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600" }
];

function initialize() {
  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: 1,
      name: settings.adminName || "Administrator",
      username: "admin",
      password: "admin123",
      role: "admin"
    });
  }

  if (!products.length) products = defaultProducts;

  save(STORAGE.users, users);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);
  save(STORAGE.settings, settings);

  $("loginForm").addEventListener("submit", handleLogin);
  $("registerForm").addEventListener("submit", handleRegister);
  $("productForm").addEventListener("submit", saveProduct);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("productImage").addEventListener("change", previewImage);

  if (currentUser) {
    const valid = users.find(user => user.id === currentUser.id);
    if (valid) {
      currentUser = valid;
      openApp();
      return;
    }
    currentUser = null;
    localStorage.removeItem(STORAGE.current);
  }

  showLogin();
}

function showRegister() {
  $("loginPanel").classList.add("hidden");
  $("registerPanel").classList.remove("hidden");
}

function showLogin() {
  $("registerPanel").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
}

function handleRegister(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("confirmPassword").value;

  if (!name || !username || !password) {
    return toast("Please complete all fields.");
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return toast("Username must be 3–20 characters (letters, numbers or _).");
  }

  if (password.length < 4) {
    return toast("Password must contain at least 4 characters.");
  }

  if (password !== confirm) {
    return toast("Passwords do not match.");
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return toast("Username is already taken.");
  }

  users.push({
    id: Date.now(),
    name,
    username,
    password,
    role: "customer"
  });

  save(STORAGE.users, users);
  $("registerForm").reset();
  showLogin();
  $("loginUsername").value = username;
  toast("Account created! Please login.");
}

function handleLogin(event) {
  event.preventDefault();

  const username = $("loginUsername").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(account =>
    account.username.toLowerCase() === username &&
    account.password === password
  );

  if (!user) return toast("Invalid username or password.");

  currentUser = user;
  save(STORAGE.current, currentUser);
  $("loginForm").reset();
  openApp();
  toast("Welcome, " + currentUser.name + "!");
}

function logout() {
  currentUser = null;
  cart = [];
  localStorage.removeItem(STORAGE.current);
  $("appScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");
  $("headerUser").textContent = "Welcome";
  showLogin();
}

function openApp() {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("headerUser").textContent = currentUser.name;
  $("sidebarName").textContent = currentUser.role === "admin" ? settings.adminName : currentUser.name;
  $("sidebarRole").textContent = currentUser.role === "admin" ? "Administrator" : "Customer";

  renderNavigation();
  showPage(currentUser.role === "admin" ? "dashboard" : "shop");
}

function renderNavigation() {
  const adminLinks = [
    ["dashboard", "▦ Dashboard"],
    ["products", "✿ Products"],
    ["inventory", "▤ Inventory"],
    ["users", "♙ User Management"],
    ["orders", "▣ Customer Orders"],
    ["receipts", "▧ Receipts"],
    ["settings", "⚙ Settings"]
  ];

  const customerLinks = [
    ["shop", "✿ Shop Flowers"],
    ["cart", "🛒 My Cart"],
    ["myorders", "▣ My Orders"],
    ["myreceipts", "▧ My Receipts"]
  ];

  const links = currentUser.role === "admin" ? adminLinks : customerLinks;

  $("navigation").innerHTML = links.map(([page, label]) =>
    `<button class="nav-link" data-page="${page}" onclick="showPage('${page}')">${label}</button>`
  ).join("");
}

function showPage(page) {
  if (currentUser.role !== "admin" &&
      !["shop", "cart", "myorders", "myreceipts"].includes(page)) return;

  if (currentUser.role === "admin" &&
      !["dashboard", "products", "inventory", "users", "orders", "receipts", "settings"].includes(page)) return;

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  const pages = {
    dashboard: renderDashboard,
    products: renderProducts,
    inventory: renderInventory,
    users: renderUsers,
    orders: renderOrders,
    receipts: renderAdminReceipts,
    settings: renderSettings,
    shop: renderShop,
    cart: renderCart,
    myorders: renderMyOrders,
    myreceipts: renderMyReceipts
  };

  pages[page]();
}

function heading(title, subtitle) {
  return `<div class="page-heading"><h1>${title}</h1><p>${subtitle}</p></div>`;
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderDashboard() {
  const revenue = orders
    .filter(order => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  $("pageContent").innerHTML = `
    ${heading("Admin Dashboard", "Welcome to your flower shop management system.")}
    <section class="hero">
      <div>
        <span class="eyebrow">Petal & Vine</span>
        <h2>Manage your beautiful blooms.</h2>
        <p>Manage products, customers, stock, and orders in one place.</p>
      </div>
      <div class="hero-flower">💐</div>
    </section>
    <div class="stats-grid">
      <div class="stat-card"><p>Total Products</p><h2>${products.length}</h2></div>
      <div class="stat-card"><p>Registered Customers</p><h2>${users.filter(u => u.role === "customer").length}</h2></div>
      <div class="stat-card"><p>Total Orders</p><h2>${orders.length}</h2></div>
      <div class="stat-card"><p>Order Value</p><h2>${money(revenue)}</h2></div>
    </div>
    <section class="panel">
      <h2>Recent Orders</h2>
      ${orders.length ? orderTable(orders.slice().reverse().slice(0, 5), true) : empty("No orders yet.")}
    </section>`;
}

function renderShop() {
  $("pageContent").innerHTML = `
    ${heading("Flower Collection", "Choose your favorite flowers and add them to your cart.")}
    <section class="hero">
      <div>
        <span class="eyebrow">Made with love</span>
        <h2>Flowers that speak from the heart.</h2>
        <p>Find the perfect flowers for every occasion.</p>
      </div>
      <div class="hero-flower">🌷</div>
    </section>
    <div class="product-grid">
      ${products.map(product => `
        <article class="product-card">
          <img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.src='https://placehold.co/500x350/f8eaf0/7b3f5b?text=Flower'">
          <div class="product-info">
            <span class="product-category">${escapeHTML(product.category)}</span>
            <h3>${escapeHTML(product.name)}</h3>
            <p class="product-description">${escapeHTML(product.description)}</p>
            <div class="product-price">${money(product.price)}</div>
            <p class="stock-text">${product.stock > 0 ? product.stock + " available" : "Out of stock"}</p>
            <div class="buy-controls">
              <input type="number" id="qty-${product.id}" min="1" max="${product.stock}" value="1" ${product.stock < 1 ? "disabled" : ""}>
              <button class="btn-primary" onclick="addToCart(${product.id})" ${product.stock < 1 ? "disabled" : ""}>Add to Cart</button>
            </div>
          </div>
        </article>
      `).join("")}
    </div>`;
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const quantity = Number($("qty-" + id).value);

  if (!Number.isInteger(quantity) || quantity < 1) return toast("Enter a valid quantity.");
  if (quantity > product.stock) return toast("Not enough stock available.");

  const existing = cart.find(item => item.id === id);
  const totalQuantity = (existing?.quantity || 0) + quantity;

  if (totalQuantity > product.stock) return toast("Your cart quantity exceeds available stock.");

  if (existing) existing.quantity = totalQuantity;
  else cart.push({ id, quantity });

  toast("Added to cart!");
}

function renderCart() {
  const items = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  $("pageContent").innerHTML = `
    ${heading("My Cart", "Review your selected flowers before checkout.")}
    <section class="panel">
      ${items.length ? items.map(item => `
        <div class="cart-item">
          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <p>${money(item.price)} × ${item.quantity}</p>
            <strong>${money(item.price * item.quantity)}</strong>
          </div>
          <div class="cart-controls">
            <input type="number" min="1" max="${item.stock}" value="${item.quantity}" onchange="updateCart(${item.id}, this.value)">
            <button class="btn-danger" onclick="removeFromCart(${item.id})">Remove</button>
          </div>
        </div>
      `).join("") : empty("Your cart is empty. Visit the flower shop to add products.")}
      ${items.length ? `
        <div class="cart-total">Total: ${money(total)}</div>
        <button class="btn-primary" onclick="openCheckout()">Proceed to Checkout</button>
        <button class="btn-outline" onclick="cart=[];renderCart()">Clear Cart</button>
      ` : ""}
    </section>`;
}

function updateCart(id, value) {
  const quantity = Number(value);
  const item = cart.find(i => i.id === id);
  const product = products.find(p => p.id === id);

  if (!item || !product) return;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    toast("Invalid quantity.");
    renderCart();
    return;
  }

  item.quantity = quantity;
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  renderCart();
  toast("Item removed.");
}

function openCheckout() {
  if (!cart.length) return toast("Your cart is empty.");

  const items = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return product ? { ...product, quantity: item.quantity } : null;
  }).filter(Boolean);

  if (items.length !== cart.length) return toast("Some products are no longer available.");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  $("checkoutSummary").innerHTML = `
    <div class="checkout-summary">
      ${items.map(item => `
        <p>${escapeHTML(item.name)} × ${item.quantity} — ${money(item.price * item.quantity)}</p>
      `).join("")}
      <hr>
      <strong>Total: ${money(total)}</strong>
    </div>`;

  $("checkoutName").value = currentUser.name;
  $("checkoutModal").classList.remove("hidden");
}

function closeCheckout() {
  $("checkoutModal").classList.add("hidden");
}

function placeOrder(event) {
  event.preventDefault();

  if (!cart.length) return toast("Your cart is empty.");

  const items = [];

  for (const item of cart) {
    const product = products.find(p => p.id === item.id);
    if (!product || item.quantity > product.stock) {
      return toast("Stock changed. Please review your cart.");
    }
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    });
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const order = {
    id: "PV-" + Date.now(),
    userId: currentUser.id,
    customerName: $("checkoutName").value.trim(),
    phone: $("checkoutPhone").value.trim(),
    address: $("checkoutAddress").value.trim(),
    payment: "Cash on Delivery (COD)",
    items,
    total,
    status: "pending",
    date: new Date().toLocaleString()
  };

  if (!order.customerName || !order.phone || !order.address) {
    return toast("Please complete your delivery information.");
  }

  items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    product.stock -= item.quantity;
  });

  orders.push(order);
  save(STORAGE.orders, orders);
  save(STORAGE.products, products);

  cart = [];
  $("checkoutForm").reset();
  closeCheckout();

  showReceipt(order);
  toast("Order placed successfully!");
}

function renderMyOrders() {
  const mine = orders.filter(order => order.userId === currentUser.id).slice().reverse();

  $("pageContent").innerHTML = `
    ${heading("My Orders", "Track the status of your flower orders.")}
    ${mine.length ? mine.map(order => `
      <div class="order-card">
        <strong>${escapeHTML(order.id)}</strong>
        <span class="status ${order.status}">${escapeHTML(order.status.toUpperCase())}</span>
        <p class="order-meta">${escapeHTML(order.date)} · ${escapeHTML(order.payment)}</p>
        <p class="order-items">${order.items.map(item => `${escapeHTML(item.name)} × ${item.quantity}`).join(", ")}</p>
        <h3>${money(order.total)}</h3>
        <button class="btn-outline" onclick="viewReceipt('${order.id}')">View Receipt</button>
      </div>
    `).join("") : empty("You haven't placed any orders yet.")}
  `;
}

function renderProducts() {
  $("pageContent").innerHTML = `
    ${heading("Product Management", "Add, edit, and delete flower products.")}
    <section class="panel">
      <button class="btn-primary" onclick="openProductModal()">+ Add Product</button>
      ${productTable(products)}
    </section>`;
}

function productTable(list) {
  if (!list.length) return empty("No products found.");

  return `
    <div class="table-responsive">
      <table>
        <thead><tr>
          <th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${list.map(p => `
            <tr>
              <td><img src="${escapeHTML(p.image)}" alt="" onerror="this.src='https://placehold.co/80x80/f8eaf0/7b3f5b?text=Flower'"></td>
              <td>${escapeHTML(p.name)}</td>
              <td>${escapeHTML(p.category)}</td>
              <td>${money(p.price)}</td>
              <td>${p.stock}</td>
              <td><div class="table-actions">
                <button class="btn-outline" onclick="editProduct(${p.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
              </div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function openProductModal() {
  $("productForm").reset();
  $("productId").value = "";
  $("productModalTitle").textContent = "Add Product";
  $("imagePreview").classList.add("hidden");
  $("imagePreview").src = "";
  $("productModal").classList.remove("hidden");
}

function closeProductModal() {
  $("productModal").classList.add("hidden");
}

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    return toast("Please select an image.");
  }

  const reader = new FileReader();
  reader.onload = () => {
    $("imagePreview").src = reader.result;
    $("imagePreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productDescription").value = product.description;
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productImage").value = "";
  $("imagePreview").src = product.image;
  $("imagePreview").classList.remove("hidden");
  $("productModalTitle").textContent = "Edit Product";
  $("productModal").classList.remove("hidden");
}

function saveProduct(event) {
  event.preventDefault();

  const id = Number($("productId").value);
  const name = $("productName").value.trim();
  const category = $("productCategory").value.trim();
  const description = $("productDescription").value.trim();
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);

  if (!name || !category || price < 0 || !Number.isFinite(price) ||
      !Number.isInteger(stock) || stock < 0) {
    return toast("Please enter valid product details.");
  }

  const duplicate = products.some(p =>
    p.id !== id && p.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) return toast("Product name already exists.");

  const existing = products.find(p => p.id === id);
  const image = $("imagePreview").src || "";

  const product = {
    id: existing ? existing.id : Date.now(),
    name,
    category,
    description,
    price,
    stock,
    image: image.startsWith("data:image/") || image.startsWith("http") ? image : ""
  };

  if (existing) {
    if (!image) product.image = existing.image;
    Object.assign(existing, product);
  } else {
    if (!product.image) product.image = "https://placehold.co/500x350/f8eaf0/7b3f5b?text=Flower";
    products.push(product);
  }

  save(STORAGE.products, products);
  closeProductModal();
  renderProducts();
  toast(existing ? "Product updated." : "Product added.");
}

function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  products = products.filter(p => p.id !== id);
  cart = cart.filter(item => item.id !== id);
  save(STORAGE.products, products);
  renderProducts();
  toast("Product deleted.");
}

function renderInventory() {
  $("pageContent").innerHTML = `
    ${heading("Inventory", "Monitor available flower stock.")}
    <section class="panel">
      <div class="table-responsive">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Available Stock</th><th>Stock Status</th></tr></thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.category)}</td>
                <td>${p.stock}</td>
                <td>${p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Low Stock" : "Available"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderUsers() {
  const customers = users.filter(user => user.role === "customer");

  $("pageContent").innerHTML = `
    ${heading("User Management", "View registered customer accounts.")}
    <section class="panel">
      <div class="table-responsive">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Account ID</th></tr></thead>
          <tbody>
            ${customers.map(user => `
              <tr>
                <td>${escapeHTML(user.name)}</td>
                <td>${escapeHTML(user.username)}</td>
                <td>Customer</td>
                <td>${user.id}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ${customers.length ? "" : empty("No registered customers yet.")}
    </section>`;
}

function orderTable(list, compact = false) {
  if (!list.length) return empty("No orders found.");

  return `
    <div class="table-responsive">
      <table>
        <thead><tr>
          <th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th>${compact ? "" : "<th>Actions</th>"}
        </tr></thead>
        <tbody>
          ${list.map(order => `
            <tr>
              <td>${escapeHTML(order.id)}</td>
              <td>${escapeHTML(order.customerName)}</td>
              <td>${escapeHTML(order.date)}</td>
              <td>${money(order.total)}</td>
              <td><span class="status ${order.status}">${escapeHTML(order.status)}</span></td>
              ${compact ? "" : `<td><div class="table-actions">
                <button class="btn-outline" onclick="viewReceipt('${order.id}')">Receipt</button>
                <select onchange="updateOrderStatus('${order.id}',this.value)">
                  ${["pending","processing","shipped","delivered","cancelled"].map(s =>
                    `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`
                  ).join("")}
                </select>
              </div></td>`}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function renderOrders() {
  $("pageContent").innerHTML = `
    ${heading("Customer Orders", "Manage incoming flower orders and their status.")}
    <section class="panel">
      ${orderTable(orders.slice().reverse())}
    </section>`;
}

function updateOrderStatus(id, status) {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  if (order.status === "cancelled" && status !== "cancelled") {
    return toast("Cancelled orders cannot be reopened in this demo.");
  }

  if (status === "cancelled" && order.status !== "cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) product.stock += item.quantity;
    });
    save(STORAGE.products, products);
  }

  order.status = status;
  save(STORAGE.orders, orders);
  renderOrders();
  toast("Order status updated.");
}

function renderAdminReceipts() {
  $("pageContent").innerHTML = `
    ${heading("Receipts", "View receipts from all customer orders.")}
    <section class="panel">
      ${orders.length ? orders.slice().reverse().map(order => `
        <div class="order-card">
          <strong>${escapeHTML(order.id)}</strong>
          <p>${escapeHTML(order.customerName)} · ${money(order.total)}</p>
          <button class="btn-outline" onclick="viewReceipt('${order.id}')">View Receipt</button>
        </div>
      `).join("") : empty("No receipts available.")}
    </section>`;
}

function renderMyReceipts() {
  const mine = orders.filter(o => o.userId === currentUser.id).slice().reverse();

  $("pageContent").innerHTML = `
    ${heading("My Receipts", "Your purchase receipts are available here.")}
    <section class="panel">
      ${mine.length ? mine.map(order => `
        <div class="order-card">
          <strong>${escapeHTML(order.id)}</strong>
          <p>${escapeHTML(order.date)} · ${money(order.total)}</p>
          <button class="btn-outline" onclick="viewReceipt('${order.id}')">View Receipt</button>
        </div>
      `).join("") : empty("No receipts available yet.")}
    </section>`;
}

function showReceipt(order) {
  $("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>${escapeHTML(settings.shopName)}</h2>
      <h3>Official Receipt</h3>
      <p><strong>Receipt:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>Date:</strong> ${escapeHTML(order.date)}</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
      <p><strong>Contact:</strong> ${escapeHTML(order.phone)}</p>
      <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
      <hr>
      ${order.items.map(item => `
        <div class="receipt-line">
          <span>${escapeHTML(item.name)} × ${item.quantity}</span>
          <span>${money(item.subtotal)}</span>
        </div>
      `).join("")}
      <div class="receipt-total">Total: ${money(order.total)}</div>
      <p style="text-align:center;margin-top:25px">Thank you for choosing Petal & Vine!</p>
    </div>`;

  $("receiptModal").classList.remove("hidden");
}

function viewReceipt(id) {
  const order = orders.find(o => o.id === id);
  if (!order) return;

  if (currentUser.role !== "admin" && order.userId !== currentUser.id) {
    return toast("You cannot view this receipt.");
  }

  showReceipt(order);
}

function closeReceipt() {
  $("receiptModal").classList.add("hidden");
}

function renderSettings() {
  $("pageContent").innerHTML = `
    ${heading("Admin Settings", "Update your shop and administrator display name.")}
    <section class="settings-panel">
      <h2>Shop Settings</h2>
      <form id="settingsForm">
        <label>Shop Name</label>
        <input id="settingsShopName" value="${escapeHTML(settings.shopName)}" required>
        <label>Admin Display Name</label>
        <input id="settingsAdminName" value="${escapeHTML(settings.adminName)}" required>
        <button class="btn-primary" type="submit">Save Settings</button>
      </form>
      <p class="muted" style="margin-top:20px">Demo admin username: admin</p>
    </section>`;

  $("settingsForm").addEventListener("submit", event => {
    event.preventDefault();

    settings.shopName = $("settingsShopName").value.trim();
    settings.adminName = $("settingsAdminName").value.trim();

    if (!settings.shopName || !settings.adminName) {
      return toast("Please complete both fields.");
    }

    const admin = users.find(user => user.role === "admin");
    if (admin) admin.name = settings.adminName;

    currentUser = admin;
    save(STORAGE.settings, settings);
    save(STORAGE.users, users);
    save(STORAGE.current, currentUser);

    $("sidebarName").textContent = settings.adminName;
    $("headerUser").textContent = settings.adminName;
    toast("Settings saved.");
  });
}

function empty(message) {
  return `<div class="empty-state">${escapeHTML(message)}</div>`;
}

let toastTimer;

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 2800);
}

document.addEventListener("DOMContentLoaded", initialize);
