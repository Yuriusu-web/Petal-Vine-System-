
"use strict";

/* PETAL & VINE - STORE APPLICATION */

const STORAGE = {
  products: "pv_products_v1",
  users: "pv_users_v1",
  orders: "pv_orders_v1",
  cart: "pv_cart_v1",
  settings: "pv_settings_v1",
  session: "pv_session_v1"
};

const $ = id => document.getElementById(id);
const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const makeId = prefix => prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const money = value => "₱" + Number(value || 0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));

let products = read(STORAGE.products, []);
let users = read(STORAGE.users, []);
let orders = read(STORAGE.orders, []);
let cart = read(STORAGE.cart, {});
let settings = read(STORAGE.settings, {
  storeName: "Petal & Vine",
  description: "Beautiful flowers for every moment.",
  adminName: "Administrator"
});

let currentUser = null;
let imageData = "";
let toastTimer = null;

function persist() {
  write(STORAGE.products, products);
  write(STORAGE.users, users);
  write(STORAGE.orders, orders);
  write(STORAGE.cart, cart);
  write(STORAGE.settings, settings);
}

function notify(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function defaultProducts() {
  const names = [
    ["Pink Rose Bouquet",850,"Roses","A romantic bouquet of pink roses."],
    ["White Tulips",650,"Tulips","Elegant white tulips for every occasion."],
    ["Sunflower Bliss",750,"Sunflowers","Bright sunflowers full of happiness."],
    ["Red Rose Classic",900,"Roses","Classic red roses wrapped beautifully."],
    ["Baby's Breath",500,"Flowers","Soft and delicate baby's breath."],
    ["Purple Dreams",950,"Mixed","A dreamy purple flower arrangement."],
    ["Pastel Garden",1200,"Mixed","A garden-inspired pastel bouquet."],
    ["Elegant Lilies",1100,"Lilies","Fresh lilies with a lovely fragrance."],
    ["Peach Romance",850,"Mixed","Warm peach-colored floral arrangement."],
    ["Daisy Delight",600,"Daisies","Cheerful daisies for someone special."],
    ["Lavender Love",800,"Mixed","A soothing lavender-inspired bouquet."],
    ["Spring Garden",1300,"Mixed","A colorful spring flower arrangement."],
    ["Blush Peonies",1500,"Peonies","Beautiful blush peonies."],
    ["Golden Sunshine",1000,"Mixed","A bright golden flower arrangement."],
    ["Forever Bloom",1800,"Premium","A premium flower gift arrangement."]
  ];

  return names.map((item,index) => ({
    id: makeId("PROD"),
    name: item[0],
    price: item[1],
    category: item[2],
    description: item[3],
    stock: 20,
    image: "",
    createdAt: new Date().toISOString(),
    color: index
  }));
}

function initialize() {
  if (!products.length) products = defaultProducts();

  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: makeId("USER"),
      name: "Administrator",
      username: "admin",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString()
    });
  }

  persist();

  const sessionId = localStorage.getItem(STORAGE.session);
  currentUser = users.find(user => user.id === sessionId) || null;

  if (currentUser) enterApplication();
  else showAuth();

  renderCartCount();
}

function toggleMenu() {
  $("mainNav").classList.toggle("open");
}

function showAuth() {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  $("authPage").classList.remove("hidden");
  updateNavigation();
}

function switchAuth(type) {
  const loginMode = type === "login";
  $("loginForm").classList.toggle("hidden",!loginMode);
  $("registerForm").classList.toggle("hidden",loginMode);
  document.querySelectorAll(".auth-tabs button").forEach((button,index) => {
    button.classList.toggle("active",index === (loginMode ? 0 : 1));
  });
}

function login(event) {
  event.preventDefault();

  const username = $("loginIdentity").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  const user = users.find(item =>
    String(item.username || "").toLowerCase() === username &&
    item.password === password
  );

  if (!user) {
    notify("Incorrect username or password.");
    return;
  }

  currentUser = user;
  localStorage.setItem(STORAGE.session,user.id);
  $("loginForm").reset();
  enterApplication();
  notify("Welcome back, " + user.name + "!");
}

function register(event) {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const username = $("registerUsername").value.trim();
  const password = $("registerPassword").value;

  if (name.length < 2 || username.length < 3 || password.length < 6) {
    notify("Please enter valid registration details.");
    return;
  }

  if (users.some(user =>
    String(user.username || "").toLowerCase() === username.toLowerCase()
  )) {
    notify("This username is already taken.");
    return;
  }

  const user = {
    id: makeId("USER"),
    name,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  currentUser = user;
  cart[user.id] = {};
  localStorage.setItem(STORAGE.session,user.id);
  $("registerForm").reset();
  persist();
  enterApplication();
  notify("Your account has been created!");
}

function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE.session);
  showAuth();
  notify("You have logged out.");
}

function requireLogin() {
  if (!currentUser) {
    showAuth();
    notify("Please log in first.");
    return false;
  }
  return true;
}

function isAdmin() {
  return !!currentUser && currentUser.role === "admin";
}

function enterApplication() {
  updateNavigation();

  if (isAdmin()) {
    $("adminWelcome").textContent = settings.adminName || currentUser.name;
    showPage("admin");
    adminTab("overview");
  } else {
    showPage("shop");
  }
}

function updateNavigation() {
  const loggedIn = !!currentUser;
  $("accountNav").classList.toggle("hidden",!loggedIn || isAdmin());
  $("adminNav").classList.toggle("hidden",!isAdmin());
  $("logoutNav").classList.toggle("hidden",!loggedIn);
}

function showPage(name) {
  if (name === "account" && !requireLogin()) return;
  if (name === "admin" && !isAdmin()) {
    notify("Admin access only.");
    return;
  }
  if (["cart","checkout"].includes(name) && !requireLogin()) return;

  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));

  const page = $(name + "Page");
  if (!page) return;
  page.classList.remove("hidden");
  $("mainNav").classList.remove("open");

  if (name === "shop") renderProducts();
  if (name === "cart") renderCart();
  if (name === "checkout") renderCheckout();
  if (name === "account") renderAccount();
  if (name === "admin") {
    if (!isAdmin()) return showPage("shop");
    adminTab("overview");
  }

  window.scrollTo({top:0,behavior:"smooth"});
}

/* PRODUCTS */

function placeholderImage(product) {
  const flowers = ["🌷","🌹","🌻","🌼","💐","🌸"];
  const symbol = flowers[(Number(product.color) || 0) % flowers.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500"><rect width="100%" height="100%" fill="#f6e9ed"/><text x="50%" y="48%" text-anchor="middle" font-size="120">${symbol}</text><text x="50%" y="75%" text-anchor="middle" font-family="Arial" font-size="26" fill="#7b3f5b">Petal &amp; Vine</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function productImage(product) {
  return product.image || placeholderImage(product);
}

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;

  const search = ($("productSearch")?.value || "").toLowerCase();
  const visible = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search)
  );

  if (!visible.length) {
    grid.innerHTML = "<p>No products found.</p>";
    return;
  }

  grid.innerHTML = visible.map(product => `
    <article class="product-card">
      <img src="${productImage(product)}" alt="${escapeHTML(product.name)}">
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description)}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock-note">${product.stock > 0 ? product.stock + " available" : "Out of stock"}</div>
        ${!isAdmin() ? `<button class="primary-btn" onclick="addToCart('${product.id}')" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>` : ""}
      </div>
    </article>
  `).join("");
}

function addToCart(productId) {
  if (!requireLogin() || isAdmin()) return;
  const product = products.find(item => item.id === productId);
  if (!product || product.stock <= 0) return notify("This product is unavailable.");

  const customerCart = cart[currentUser.id] || {};
  const currentQty = Number(customerCart[productId] || 0);

  if (currentQty >= product.stock) return notify("You have reached the available stock.");

  customerCart[productId] = currentQty + 1;
  cart[currentUser.id] = customerCart;
  persist();
  renderCartCount();
  notify("Added to cart!");
}

function renderCartCount() {
  const count = currentUser && !isAdmin()
    ? Object.values(cart[currentUser.id] || {}).reduce((sum,qty) => sum + Number(qty),0)
    : 0;
  if ($("cartCount")) $("cartCount").textContent = count;
}

function getCartItems() {
  if (!currentUser) return [];
  return Object.entries(cart[currentUser.id] || {})
    .map(([id,qty]) => ({
      product: products.find(item => item.id === id),
      quantity: Number(qty)
    }))
    .filter(item => item.product && item.quantity > 0);
}

function cartTotal() {
  return getCartItems().reduce((sum,item) => sum + item.product.price * item.quantity,0);
}

function renderCart() {
  if (!requireLogin() || isAdmin()) return;
  const items = getCartItems();

  if (!items.length) {
    $("cartItems").innerHTML = '<div class="panel"><p>Your cart is empty.</p><button class="primary-btn" onclick="showPage(\'shop\')">Continue Shopping</button></div>';
    $("cartSummary").innerHTML = "";
    return;
  }

  $("cartItems").innerHTML = items.map(({product,quantity}) => `
    <div class="cart-row">
      <img src="${productImage(product)}" alt="">
      <div class="cart-product">
        <strong>${escapeHTML(product.name)}</strong>
        <p>${money(product.price)} each</p>
        <strong>${money(product.price * quantity)}</strong>
      </div>
      <div class="quantity-control">
        <button onclick="changeQuantity('${product.id}',-1)">−</button>
        <strong>${quantity}</strong>
        <button onclick="changeQuantity('${product.id}',1)">+</button>
      </div>
      <button class="danger-btn" onclick="removeFromCart('${product.id}')">Remove</button>
    </div>
  `).join("");

  $("cartSummary").innerHTML = `
    <p>Items: <strong>${items.reduce((sum,item) => sum + item.quantity,0)}</strong></p>
    <p class="cart-total">Total: ${money(cartTotal())}</p>
    <button class="primary-btn full-btn" onclick="showPage('checkout')">Proceed to Checkout</button>
  `;
}

function changeQuantity(productId,amount) {
  if (!requireLogin() || isAdmin()) return;
  const customerCart = cart[currentUser.id] || {};
  const product = products.find(item => item.id === productId);
  const next = Number(customerCart[productId] || 0) + amount;

  if (!product) return;
  if (next <= 0) delete customerCart[productId];
  else if (next > product.stock) return notify("Not enough stock available.");
  else customerCart[productId] = next;

  cart[currentUser.id] = customerCart;
  persist();
  renderCart();
  renderCartCount();
}

function removeFromCart(productId) {
  if (!requireLogin()) return;
  const customerCart = cart[currentUser.id] || {};
  delete customerCart[productId];
  cart[currentUser.id] = customerCart;
  persist();
  renderCart();
  renderCartCount();
}

/* CHECKOUT AND ORDERS */

function renderCheckout() {
  if (!requireLogin() || isAdmin()) return;
  const items = getCartItems();

  if (!items.length) {
    notify("Your cart is empty.");
    return showPage("shop");
  }

  $("deliveryName").value = currentUser.name || "";
  $("checkoutSummary").innerHTML = items.map(item => `
    <p>${escapeHTML(item.product.name)} × ${item.quantity} <strong>${money(item.product.price * item.quantity)}</strong></p>
  `).join("") + `<hr><h3>Total: ${money(cartTotal())}</h3>`;
}

function placeOrder(event) {
  event.preventDefault();
  if (!requireLogin() || isAdmin()) return;

  const items = getCartItems();
  if (!items.length) return notify("Your cart is empty.");

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      return notify("Some products no longer have enough stock.");
    }
  }

  const order = {
    id: makeId("ORDER"),
    customerId: currentUser.id,
    customerName: currentUser.name,
    username: currentUser.username,
    phone: $("deliveryPhone").value.trim(),
    address: $("deliveryAddress").value.trim(),
    payment: $("paymentMethod").value,
    items: items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image || ""
    })),
    total: cartTotal(),
    status: "Pending",
    date: new Date().toISOString()
  };

  items.forEach(item => {
    item.product.stock -= item.quantity;
  });

  orders.unshift(order);
  cart[currentUser.id] = {};
  persist();
  $("checkoutForm").reset();
  renderCartCount();
  notify("Your order has been placed!");
  showPage("account");
}

function renderAccount() {
  if (!requireLogin() || isAdmin()) return;

  $("profileDetails").innerHTML = `
    <p><strong>Name:</strong> ${escapeHTML(currentUser.name)}</p>
    <p><strong>Username:</strong> ${escapeHTML(currentUser.username)}</p>
    <p><strong>Account:</strong> Customer</p>
    <button class="secondary-btn" onclick="logout()">Logout</button>
  `;

  const mine = orders.filter(order => order.customerId === currentUser.id);

  $("customerOrders").innerHTML = mine.length ? mine.map(order => `
    <div class="order-card">
      <div>
        <strong>${escapeHTML(order.id)}</strong>
        <p>${new Date(order.date).toLocaleDateString()}</p>
        <span class="status">${escapeHTML(order.status)}</span>
        <p>${money(order.total)}</p>
      </div>
    </div>
  `).join("") : "<p>You have no orders yet.</p>";

  $("customerReceipts").innerHTML = mine.length ? mine.map(order => `
    <div class="receipt-card">
      <div><strong>${escapeHTML(order.id)}</strong><p>${money(order.total)}</p></div>
      <button class="secondary-btn" onclick="printReceipt('${order.id}')">Print</button>
    </div>
  `).join("") : "<p>Your receipts will appear here.</p>";
}

/* ADMIN SECURITY AND TABS */

function adminTab(tab,button) {
  if (!isAdmin()) return notify("Admin access only.");

  document.querySelectorAll(".admin-panel").forEach(panel => panel.classList.add("hidden"));
  const target = $("admin" + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".admin-tabs button").forEach(item => item.classList.remove("active"));
  if (button) button.classList.add("active");
  else {
    const buttons = [...document.querySelectorAll(".admin-tabs button")];
    const index = ["overview","products","orders","customers","receipts","settings"].indexOf(tab);
    if (buttons[index]) buttons[index].classList.add("active");
  }

  if (tab === "overview") renderDashboard();
  if (tab === "products") renderAdminProducts();
  if (tab === "orders") renderAdminOrders();
  if (tab === "customers") renderAdminCustomers();
  if (tab === "receipts") renderAdminReceipts();
  if (tab === "settings") renderSettings();
}

function renderDashboard() {
  const revenue = orders.reduce((sum,order) => sum + order.total,0);
  $("dashboardStats").innerHTML = `
    <div class="stat-card"><span>Products</span><strong>${products.length}</strong></div>
    <div class="stat-card"><span>Orders</span><strong>${orders.length}</strong></div>
    <div class="stat-card"><span>Customers</span><strong>${users.filter(user => user.role === "customer").length}</strong></div>
    <div class="stat-card"><span>Sales</span><strong>${money(revenue)}</strong></div>
  `;
  $("recentOrders").innerHTML = orders.slice(0,5).map(order => `
    <div class="order-card"><div><strong>${escapeHTML(order.id)}</strong><p>${escapeHTML(order.customerName)}</p></div><div>${money(order.total)}<p class="status">${escapeHTML(order.status)}</p></div></div>
  `).join("") || "<p>No orders yet.</p>";
}

/* ADMIN PRODUCT MANAGEMENT */

function renderAdminProducts() {
  if (!isAdmin()) return;
  $("adminProductList").innerHTML = products.map(product => `
    <div class="admin-product-row">
      <img src="${productImage(product)}" alt="">
      <div class="admin-product-info">
        <strong>${escapeHTML(product.name)}</strong>
        <p>${money(product.price)} · Stock: ${product.stock}</p>
      </div>
      <button class="secondary-btn" onclick="openProductEditor('${product.id}')">Edit</button>
      <button class="danger-btn" onclick="deleteProduct('${product.id}')">Delete</button>
    </div>
  `).join("") || "<p>No products yet.</p>";
}

function openProductEditor(productId = "") {
  if (!isAdmin()) return notify("Admin access only.");

  $("productForm").reset();
  $("productId").value = "";
  imageData = "";
  $("productImagePreview").classList.add("hidden");

  if (productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    $("productModalTitle").textContent = "Edit Product";
    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productPrice").value = product.price;
    $("productCategory").value = product.category;
    $("productStock").value = product.stock;
    $("productDescription").value = product.description;
    if (product.image) {
      imageData = product.image;
      $("productImagePreview").src = product.image;
      $("productImagePreview").classList.remove("hidden");
    }
  } else {
    $("productModalTitle").textContent = "Add Product";
  }

  $("productModal").classList.remove("hidden");
}

function closeProductEditor() {
  $("productModal").classList.add("hidden");
}

function previewProductImage(event) {
  if (!isAdmin()) return;
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) return notify("Please select an image.");
  if (file.size > 1.5 * 1024 * 1024) {
    event.target.value = "";
    return notify("Please use an image smaller than 1.5 MB.");
  }

  const reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result;
    $("productImagePreview").src = imageData;
    $("productImagePreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function saveProduct(event) {
  event.preventDefault();
  if (!isAdmin()) return notify("Admin access only.");

  const id = $("productId").value;
  const name = $("productName").value.trim();
  const price = Number($("productPrice").value);
  const category = $("productCategory").value.trim();
  const stock = Number($("productStock").value);
  const description = $("productDescription").value.trim();

  if (!name || !category || !description || price <= 0 || stock < 0) {
    return notify("Please enter valid product details.");
  }

  const duplicate = products.some(product =>
    product.id !== id && product.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) return notify("A product with this name already exists.");

  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;
    Object.assign(product,{name,price,category,stock,description});
    if (imageData) product.image = imageData;
  } else {
    products.push({
      id: makeId("PROD"),name,price,category,stock,description,
      image: imageData,createdAt: new Date().toISOString()
    });
  }

  persist();
  closeProductEditor();
  renderAdminProducts();
  renderProducts();
  notify("Product saved successfully.");
}

function deleteProduct(productId) {
  if (!isAdmin()) return notify("Admin access only.");
  const product = products.find(item => item.id === productId);
  if (!product || !confirm("Delete " + product.name + "?")) return;

  products = products.filter(item => item.id !== productId);

  Object.keys(cart).forEach(userId => {
    if (cart[userId]) delete cart[userId][productId];
  });

  persist();
  renderAdminProducts();
  renderProducts();
  notify("Product deleted.");
}

/* ADMIN ORDERS, CUSTOMERS, RECEIPTS */

function renderAdminOrders() {
  if (!isAdmin()) return;
  $("adminOrderList").innerHTML = orders.map(order => `
    <div class="order-card">
      <div>
        <strong>${escapeHTML(order.id)}</strong>
        <p>${escapeHTML(order.customerName)} · ${new Date(order.date).toLocaleString()}</p>
        <p>${order.items.map(item => escapeHTML(item.name) + " × " + item.quantity).join(", ")}</p>
        <strong>${money(order.total)}</strong>
      </div>
      <div>
        <select onchange="updateOrderStatus('${order.id}',this.value)">
          ${["Pending","Processing","Ready for Delivery","Completed","Cancelled"].map(status =>
            `<option ${order.status === status ? "selected" : ""}>${status}</option>`
          ).join("")}
        </select>
        <button class="secondary-btn" onclick="printReceipt('${order.id}')">Receipt</button>
      </div>
    </div>
  `).join("") || "<p>No orders yet.</p>";
}

function updateOrderStatus(orderId,status) {
  if (!isAdmin()) return;
  const order = orders.find(item => item.id === orderId);
  if (!order) return;
  const oldStatus = order.status;
  order.status = status;

  if (status === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    const unavailable = order.items.some(item => {
      const product = products.find(p => p.id === item.productId);
      return !product || product.stock < item.quantity;
    });
    if (unavailable) {
      order.status = "Cancelled";
      return notify("Not enough stock to reactivate this order.");
    }
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock -= item.quantity;
    });
  }

  persist();
  renderAdminOrders();
  notify("Order status updated.");
}

function renderAdminCustomers() {
  if (!isAdmin()) return;
  const customers = users.filter(user => user.role === "customer");
  $("adminCustomerList").innerHTML = customers.map(user => `
    <div class="order-card">
      <div><strong>${escapeHTML(user.name)}</strong><p>@${escapeHTML(user.username)}</p></div>
      <span class="status">Customer</span>
    </div>
  `).join("") || "<p>No customers registered.</p>";
}

function renderAdminReceipts() {
  if (!isAdmin()) return;
  $("adminReceiptList").innerHTML = orders.map(order => `
    <div class="receipt-card">
      <div><strong>${escapeHTML(order.id)}</strong><p>${escapeHTML(order.customerName)} · ${money(order.total)}</p></div>
      <button class="secondary-btn" onclick="printReceipt('${order.id}')">Print Receipt</button>
    </div>
  `).join("") || "<p>No receipts yet.</p>";
}

function printReceipt(orderId) {
  if (!currentUser) return;
  const order = orders.find(item => item.id === orderId);
  if (!order) return;

  if (!isAdmin() && order.customerId !== currentUser.id) {
    return notify("You cannot view another customer's receipt.");
  }

  const receipt = `
    <html><head><title>Receipt ${escapeHTML(order.id)}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:35px;color:#382b30}
      h1{color:#7b3f5b}table{width:100%;border-collapse:collapse}
      td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}
      .total{text-align:right;font-size:22px;font-weight:bold}
    </style></head><body>
    <h1>✿ Petal & Vine</h1><h2>Official Order Receipt</h2>
    <p><b>Order:</b> ${escapeHTML(order.id)}</p>
    <p><b>Date:</b> ${new Date(order.date).toLocaleString()}</p>
    <p><b>Customer:</b> ${escapeHTML(order.customerName)}</p>
    <p><b>Phone:</b> ${escapeHTML(order.phone)}</p>
    <p><b>Address:</b> ${escapeHTML(order.address)}</p>
    <p><b>Payment:</b> ${escapeHTML(order.payment)}</p>
    <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
    <tbody>${order.items.map(item => `<tr><td>${escapeHTML(item.name)}</td><td>${item.quantity}</td><td>${money(item.price * item.quantity)}</td></tr>`).join("")}</tbody></table>
    <p class="total">Total: ${money(order.total)}</p>
    <p>Status: ${escapeHTML(order.status)}</p>
    <p>Thank you for shopping with Petal & Vine!</p>
    <script>window.onload=()=>window.print();<\/script>
    </body></html>
  `;

  const popup = window.open("","_blank");
  if (!popup) return notify("Please allow pop-ups to print receipts.");
  popup.document.open();
  popup.document.write(receipt);
  popup.document.close();
}

/* SETTINGS */

function renderSettings() {
  if (!isAdmin()) return;
  $("settingStoreName").value = settings.storeName || "Petal & Vine";
  $("settingStoreDescription").value = settings.description || "";
  $("settingAdminName").value = settings.adminName || currentUser.name;
  $("settingAdminUsername").value = currentUser.username;
  $("settingAdminPassword").value = "";
}

function saveStoreSettings(event) {
  event.preventDefault();
  if (!isAdmin()) return;
  settings.storeName = $("settingStoreName").value.trim();
  settings.description = $("settingStoreDescription").value.trim();
  persist();
  document.querySelector(".brand").innerHTML = "✿ " + escapeHTML(settings.storeName);
  notify("Store settings saved.");
}

function updateAdminAccount(event) {
  event.preventDefault();
  if (!isAdmin()) return;

  const username = $("settingAdminUsername").value.trim();
  const name = $("settingAdminName").value.trim();
  const password = $("settingAdminPassword").value;

  if (username.length < 3 || name.length < 2) {
    return notify("Enter a valid admin name and username.");
  }

  const duplicate = users.some(user =>
    user.id !== currentUser.id &&
    user.username.toLowerCase() === username.toLowerCase()
  );
  if (duplicate) return notify("That username is already taken.");

  currentUser.username = username;
  currentUser.name = name;
  if (password) {
    if (password.length < 6) return notify("Password must have at least 6 characters.");
    currentUser.password = password;
  }

  settings.adminName = name;
  persist();
  $("adminWelcome").textContent = name;
  notify("Admin account updated.");
}

/* START APPLICATION */

document.addEventListener("DOMContentLoaded", initialize);
