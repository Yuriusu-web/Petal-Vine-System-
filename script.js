"use strict";

/* Petal & Vine - browser-based demonstration app.
   Data is stored in this browser's localStorage. This is not a secure
   production authentication or multi-device database system. */

const $ = (id) => document.getElementById(id);

const DB = {
  users: "petal_vine_users",
  products: "petal_vine_products",
  orders: "petal_vine_orders"
};

const ADMIN = { username: "admin", password: "Admin123" };

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Red Rose", category: "Roses", emoji: "🌹", price: 80, stock: 50 },
  { id: 2, name: "Sunflower", category: "Sunflowers", emoji: "🌻", price: 120, stock: 30 },
  { id: 3, name: "Pink Tulip", category: "Tulips", emoji: "🌷", price: 150, stock: 25 },
  { id: 4, name: "Mixed Flower Bouquet", category: "Bouquets", emoji: "💐", price: 550, stock: 15 },
  { id: 5, name: "White Lily", category: "Lilies", emoji: "💮", price: 180, stock: 20 },
  { id: 6, name: "Flower Gift Box", category: "Gifts", emoji: "🎁", price: 350, stock: 12 },
  { id: 7, name: "Mini Rose Bouquet", category: "Bouquets", emoji: "🌸", price: 250, stock: 20 },
  { id: 8, name: "Indoor Potted Plant", category: "Other", emoji: "🪴", price: 299, stock: 10 },
  { id: 9, name: "Purple Orchid", category: "Other", emoji: "🪻", price: 420, stock: 8 },
  { id: 10, name: "Pink Carnation Bundle", category: "Bouquets", emoji: "🌺", price: 320, stock: 18 }
];

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn("Could not read saved data:", error);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Could not save data:", error);
    alert("Unable to save data. Check your browser storage.");
    return false;
  }
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

let users = read(DB.users, []);
let products = read(DB.products, DEFAULT_PRODUCTS);
let orders = read(DB.orders, []);
let currentUser = null;
let currentRole = null;
let selectedAuth = "";
let cart = {};
let toastTimer = null;

let nextProductId = Math.max(0, ...products.map(p => Number(p.id) || 0)) + 1;
let nextOrderId = Math.max(1000, ...orders.map(o => Number(o.id) || 0)) + 1;

// Upgrade older installations by adding any missing starter products without overwriting edits.
const existingProductIds = new Set(products.map(product => Number(product.id)));
let addedStarterProducts = false;
DEFAULT_PRODUCTS.forEach(starter => {
  if (!existingProductIds.has(starter.id)) {
    products.push({ ...starter });
    addedStarterProducts = true;
  }
});
if (addedStarterProducts || !localStorage.getItem(DB.products)) save(DB.products, products);

/* AUTHENTICATION */

function showAuth(type) {
  selectedAuth = type;
  $("authChoices").classList.add("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");

  if (type === "register") {
    $("registerForm").classList.remove("hidden");
  } else {
    $("loginForm").classList.remove("hidden");
    $("loginTitle").textContent = type === "admin" ? "👑 Admin Login" : "👤 Customer Login";
    $("loginError").textContent = "";
  }
}

function backToChoices() {
  $("authChoices").classList.remove("hidden");
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.add("hidden");
  $("loginForm").reset();
  $("registerForm").reset();
  $("loginError").textContent = "";
  $("registerError").textContent = "";
  selectedAuth = "";
}

function togglePassword(id, button) {
  const input = $(id);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  button.textContent = isPassword ? "🙈" : "👁️";
  button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
}

$("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const fullName = $("regFullName").value.trim();
  const username = $("regUsername").value.trim();
  const password = $("regPassword").value;
  const confirm = $("regConfirm").value;
  $("registerError").textContent = "";

  if (fullName.length < 2) return $("registerError").textContent = "Please enter your full name.";
  if (username.length < 3) return $("registerError").textContent = "Username must have at least 3 characters.";
  if (username.toLowerCase() === ADMIN.username) return $("registerError").textContent = "That username is reserved.";
  if (password.length < 6) return $("registerError").textContent = "Password must have at least 6 characters.";
  if (password !== confirm) return $("registerError").textContent = "Passwords do not match.";
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return $("registerError").textContent = "Username already exists.";
  }

  const newUser = {
    id: Date.now(),
    fullName,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString(),
    lastLogin: null,
    active: true
  };

  users.push(newUser);
  if (!save(DB.users, users)) {
    users.pop();
    return;
  }

  alert("Account created successfully! You can now log in.");
  $("registerForm").reset();
  backToChoices();
  showAuth("customer");
});

$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  $("loginError").textContent = "";

  if (selectedAuth === "admin") {
    if (username === ADMIN.username && password === ADMIN.password) {
      currentUser = { id: "admin", fullName: "Administrator", username: ADMIN.username };
      currentRole = "admin";
      enterApp();
    } else {
      $("loginError").textContent = "Incorrect admin username or password.";
    }
    return;
  }

  const user = users.find(item =>
    item.username.toLowerCase() === username.toLowerCase() && item.password === password
  );

  if (!user) {
    $("loginError").textContent = "Incorrect username or password.";
    return;
  }
  if (user.active === false) {
    $("loginError").textContent = "This account is disabled. Please contact the shop administrator.";
    return;
  }

  user.lastLogin = new Date().toISOString();
  user.active = user.active !== false;
  save(DB.users, users);
  currentUser = user;
  currentRole = "customer";
  enterApp();
});

/* APPLICATION ENTRY AND NAVIGATION */

const adminPages = [
  ["dashboard", "🏠 Dashboard"], ["inventory", "🌸 Inventory"],
  ["orders", "📦 All Orders"], ["customers", "👥 User Management"],
  ["reports", "📊 Reports"], ["about", "ℹ️ About"]
];

const customerPages = [
  ["dashboard", "🏠 Home"], ["shop", "🌷 Shop Flowers"],
  ["cart", "🛒 My Cart"], ["orders", "📦 My Orders"], ["about", "ℹ️ About"]
];

function enterApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("welcomeUser").textContent = "👤 " + currentUser.fullName;
  $("checkoutName").value = currentUser.fullName || "";
  buildNavigation();
  renderAll();
  goPage("dashboard");
}

function logout() {
  currentUser = null;
  currentRole = null;
  cart = {};
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
  backToChoices();
}

function buildNavigation() {
  const pages = currentRole === "admin" ? adminPages : customerPages;
  $("navigation").innerHTML = pages.map(([id, label]) =>
    `<button class="nav-btn" type="button" data-page="${id}">${label}</button>`
  ).join("");

  $("navigation").querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => goPage(button.dataset.page));
  });

  document.querySelectorAll(".admin-only").forEach(element => {
    element.classList.toggle("hidden", currentRole !== "admin");
  });

  $("dashboardMessage").textContent = currentRole === "admin"
    ? "Manage products, customers, orders, and sales."
    : "Find your favorite flowers and place an order.";

  $("ordersTitle").textContent = currentRole === "admin" ? "All Customer Orders" : "My Orders";
}

function goPage(page) {
  const allowed = (currentRole === "admin" ? adminPages : customerPages).map(item => item[0]);
  if (!allowed.includes(page)) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const renderers = {
    dashboard: renderDashboard, inventory: renderInventory, shop: renderShop,
    cart: renderCart, orders: renderOrders, customers: renderCustomers, reports: renderReports
  };
  if (renderers[page]) renderers[page]();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* DASHBOARD AND PRODUCT CARDS */

function renderDashboard() {
  $("statProducts").textContent = products.length;
  $("statOrders").textContent = orders.length;
  $("statCustomers").textContent = users.length;

  const revenue = orders.filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  $("statRevenue").textContent = money(revenue);

  const list = currentRole === "admin" ? products : products.filter(product => product.stock > 0);
  $("dashboardProducts").innerHTML = list.length
    ? list.slice(0, 6).map(productCard).join("")
    : '<div class="empty-state">No products available.</div>';
  attachProductActions($("dashboardProducts"));
}

function productCard(product) {
  const admin = currentRole === "admin";
  const stockText = product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock";
  const actions = admin
    ? `<button class="btn light" type="button" data-edit="${product.id}">✏️ Edit</button>`
    : `<button class="btn primary" type="button" data-add="${product.id}" ${product.stock < 1 ? "disabled" : ""}>Add to Cart</button>`;
  const image = product.image
    ? `<img src="${product.image}" alt="${escapeHTML(product.name)}" class="product-image">`
    : `<div class="product-emoji">${escapeHTML(product.emoji || "🌸")}</div>`;

  return `<article class="product-card">
    <div class="product-picture">${image}</div>
    <div class="product-info">
      <span class="product-category">${escapeHTML(product.category)}</span>
      <h3>${escapeHTML(product.name)}</h3>
      <p class="product-price">${money(product.price)}</p>
      <p class="stock-text">${stockText}</p>
      <div class="product-actions">${actions}</div>
    </div>
  </article>`;
}

function attachProductActions(container) {
  container.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
  container.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => openProductForm(Number(button.dataset.edit)));
  });
}
function productCard(product) {
  const admin = currentRole === "admin";
  const stockText = product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock";
  const actions = admin
    ? `<button class="btn outline" type="button" data-edit="${product.id}">✏️ Edit</button>
       <button class="btn danger" type="button" data-delete="${product.id}">🗑️ Delete</button>`
    : `<button class="btn primary" type="button" data-now="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Buy Now</button>
       <button class="btn outline" type="button" data-buy="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>`;

  const visual = product.image
    ? `<img class="product-photo" src="${product.image}" alt="${escapeHTML(product.name)}">`
    : `<div class="flower-emoji">${escapeHTML(product.emoji)}</div>`;
  return `<article class="product-card">
    ${visual}
    <div class="product-name">${escapeHTML(product.name)}</div>
    <p>${escapeHTML(product.category)}</p>
    <div class="price">${money(product.price)}</div>
    <div class="stock ${product.stock <= 0 ? "out" : ""}">${stockText}</div>
    ${actions}
  </article>`;
}

function attachProductActions(container) {
  container.querySelectorAll("[data-edit]").forEach(button =>
    button.addEventListener("click", () => editProduct(Number(button.dataset.edit)))
  );
  container.querySelectorAll("[data-delete]").forEach(button =>
    button.addEventListener("click", () => deleteProduct(Number(button.dataset.delete)))
  );
  container.querySelectorAll("[data-buy]").forEach(button =>
    button.addEventListener("click", () => addToCart(Number(button.dataset.buy)))
  );
  container.querySelectorAll("[data-now]").forEach(button =>
    button.addEventListener("click", () => {
      if (addToCart(Number(button.dataset.now))) goPage("cart");
    })
  );
}

/* ADMIN PRODUCT MANAGEMENT */

function openProductForm() {
  if (currentRole !== "admin") return;
  $("productEditor").classList.remove("hidden");
  $("productForm").reset();
  $("productId").value = "";
  $("productImage").value = "";
  $("productImage").dataset.current = "";
  renderImagePreview("");
  $("editorTitle").textContent = "Add New Product";
}

function closeProductForm() {
  $("productEditor").classList.add("hidden");
  $("productForm").reset();
}

function editProduct(id) {
  if (currentRole !== "admin") return;
  const product = products.find(item => item.id === id);
  if (!product) return;

  $("productEditor").classList.remove("hidden");
  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productCategory").value = product.category;
  $("productEmoji").value = product.emoji;
  $("productPrice").value = product.price;
  $("productStock").value = product.stock;
  $("productImage").value = "";
  $("productImage").dataset.current = product.image || "";
  renderImagePreview(product.image || "");
  $("editorTitle").textContent = "Edit Product";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderImagePreview(src) {
  $("imagePreview").innerHTML = src
    ? `<img src="${src}" alt="Product image preview">`
    : "No picture selected — emoji will be used.";
}

$("productImage").addEventListener("change", () => {
  const file = $("productImage").files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    $("productImage").value = "";
    return;
  }
  if (file.size > 1_500_000) {
    alert("Please choose an image smaller than 1.5 MB to avoid filling browser storage.");
    $("productImage").value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    $("productImage").dataset.current = String(reader.result);
    renderImagePreview(String(reader.result));
  };
  reader.readAsDataURL(file);
});

$("removeProductImage").addEventListener("click", () => {
  $("productImage").value = "";
  $("productImage").dataset.current = "";
  renderImagePreview("");
});

$("productForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentRole !== "admin") return;

  const id = Number($("productId").value);
  const name = $("productName").value.trim();
  const category = $("productCategory").value;
  const emoji = $("productEmoji").value;
  const price = Number($("productPrice").value);
  const stock = Number($("productStock").value);
  const image = $("productImage").dataset.current || "";

  if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
    alert("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.id !== id && product.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) return alert("A product with this name already exists.");

  const previous = products.map(product => ({ ...product }));
  if (id) {
    const product = products.find(item => item.id === id);
    if (!product) return;
    Object.assign(product, { name, category, emoji, price, stock, image });
  } else {
    products.push({ id: nextProductId++, name, category, emoji, price, stock, image });
  }

  if (!save(DB.products, products)) {
    products = previous;
    return;
  }

  closeProductForm();
  renderAll();
  goPage("inventory");
  notify(id ? "Product updated!" : "Product added!");
});

function deleteProduct(id) {
  if (currentRole !== "admin") return;
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (orders.some(order => order.status !== "Cancelled" &&
    order.items.some(item => item.productId === id))) {
    alert("This product is connected to an active order and cannot be deleted.");
    return;
  }
  if (!confirm(`Delete ${product.name}?`)) return;

  const previous = products;
  products = products.filter(item => item.id !== id);
  if (!save(DB.products, products)) {
    products = previous;
    return;
  }
  renderAll();
  notify("Product deleted.");
}

/* INVENTORY AND CUSTOMER SHOP */

function renderInventory() {
  if (currentRole !== "admin") return;
  const query = $("inventorySearch").value.toLowerCase().trim();
  const list = products.filter(product =>
    product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query)
  );
  $("inventoryProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No matching products.</div>';
  attachProductActions($("inventoryProducts"));
}

$("inventorySearch").addEventListener("input", renderInventory);

function renderShop() {
  if (currentRole !== "customer") return;
  const query = $("shopSearch").value.toLowerCase().trim();
  const list = products.filter(product => product.stock > 0 &&
    (product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query))
  );
  $("shopProducts").innerHTML = list.length
    ? list.map(productCard).join("")
    : '<div class="empty-state">No available flowers found.</div>';
  attachProductActions($("shopProducts"));
}

$("shopSearch").addEventListener("input", renderShop);

/* SHOPPING CART */

function addToCart(id) {
  if (currentRole !== "customer") return false;
  const product = products.find(item => item.id === id);
  if (!product || product.stock <= 0) return false;

  const quantity = cart[id] || 0;
  if (quantity >= product.stock) {
    notify("You have reached the available stock.");
    return false;
  }

  cart[id] = quantity + 1;
  notify("Added to cart!");
  renderCart();
  return true;
}

function changeCart(id, amount) {
  const product = products.find(item => item.id === id);
  const newQuantity = (cart[id] || 0) + amount;
  if (!product || newQuantity > product.stock) {
    notify("Not enough stock.");
    return;
  }
  if (newQuantity <= 0) delete cart[id];
  else cart[id] = newQuantity;
  renderCart();
}

function renderCart() {
  if (currentRole !== "customer") return;
  const entries = Object.entries(cart).filter(([id, quantity]) =>
    products.some(product => product.id === Number(id)) && quantity > 0
  );
  let total = 0;

  $("cartItems").innerHTML = entries.length ? entries.map(([id, quantity]) => {
    const product = products.find(item => item.id === Number(id));
    const subtotal = product.price * quantity;
    total += subtotal;
    return `<div class="cart-line">
      <div><strong>${escapeHTML(product.emoji)} ${escapeHTML(product.name)}</strong>
        <p>${money(product.price)} each</p></div>
      <div class="cart-controls">
        <button class="btn light" type="button" data-minus="${id}" aria-label="Decrease quantity">−</button>
        <strong>${quantity}</strong>
        <button class="btn light" type="button" data-plus="${id}" aria-label="Increase quantity">+</button>
        <strong>${money(subtotal)}</strong>
      </div>
    </div>`;
  }).join("") : '<p class="empty-state">Your cart is empty. Visit the shop to choose flowers.</p>';

  $("cartTotal").textContent = "Total: " + money(total);
  $("cartItems").querySelectorAll("[data-minus]").forEach(button =>
    button.addEventListener("click", () => changeCart(Number(button.dataset.minus), -1))
  );
  $("cartItems").querySelectorAll("[data-plus]").forEach(button =>
    button.addEventListener("click", () => changeCart(Number(button.dataset.plus), 1))
  );
}

/* CHECKOUT AND ORDERS */

$("checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (currentRole !== "customer") return;

  const entries = Object.entries(cart).filter(([, quantity]) => quantity > 0);
  if (!entries.length) return alert("Your cart is empty.");

  for (const [id, quantity] of entries) {
    const product = products.find(item => item.id === Number(id));
    if (!product || quantity > product.stock) {
      alert("Some products no longer have enough stock. Please check your cart.");
      renderCart();
      return;
    }
  }

  const customerName = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  const address = $("checkoutAddress").value.trim();
  if (!customerName || !phone || !address) {
    alert("Please complete your delivery details.");
    return;
  }

  const items = entries.map(([id, quantity]) => {
    const product = products.find(item => item.id === Number(id));
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      subtotal: product.price * quantity
    };
  });
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const newOrder = {
    id: nextOrderId,
    customerId: currentUser.id,
    customerName,
    phone,
    address,
    payment: $("paymentMethod").value,
    items,
    total,
    status: "Pending",
    date: new Date().toISOString()
  };

  const oldProducts = products.map(product => ({ ...product }));
  const oldOrders = [...orders];
  entries.forEach(([id, quantity]) => {
    products.find(product => product.id === Number(id)).stock -= quantity;
  });
  orders.unshift(newOrder);

  if (!save(DB.products, products) || !save(DB.orders, orders)) {
    products = oldProducts;
    orders = oldOrders;
    save(DB.products, products);
    save(DB.orders, orders);
    return;
  }

  nextOrderId++;
  cart = {};
  $("checkoutForm").reset();
  $("checkoutName").value = currentUser.fullName || "";
  renderAll();
  goPage("orders");
  alert("Purchase successful! Your order number is PV-" + newOrder.id);
});

function renderOrders() {
  const list = currentRole === "admin"
    ? orders
    : orders.filter(order => order.customerId === currentUser.id);

  if (!list.length) {
    $("ordersList").innerHTML = '<div class="empty-state">No orders found.</div>';
    return;
  }

  const adminColumn = currentRole === "admin" ? "<th>Update Status</th>" : "";
  $("ordersList").innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Order</th><th>Customer / Items</th><th>Payment</th><th>Total</th><th>Status</th><th>Receipt</th>${adminColumn}</tr></thead>
    <tbody>${list.map(order => {
      const itemText = order.items.map(item =>
        `${escapeHTML(item.name)} × ${item.quantity}`
      ).join("<br>");
      const customerText = escapeHTML(order.customerName || "Customer");
      const dateText = order.date ? new Date(order.date).toLocaleString("en-PH") : "";
      const statusControl = currentRole === "admin"
        ? `<td><select data-order="${order.id}" aria-label="Update order ${order.id}">
             ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
               `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
             ).join("")}
           </select></td>` : "";
      return `<tr>
        <td><strong>PV-${order.id}</strong><br><small>${escapeHTML(dateText)}</small></td>
        <td>${customerText}<br><small>${itemText}</small></td>
        <td>${escapeHTML(order.payment || "—")}</td>
        <td>${money(order.total)}</td>
        <td><span class="badge ${escapeHTML(order.status)}">${escapeHTML(order.status)}</span></td>
        <td><button class="btn outline receipt-btn" type="button" data-receipt="${order.id}">🧾 Receipt</button></td>
        ${statusControl}
      </tr>`;
    }).join("")}</tbody></table></div>`;

  $("ordersList").querySelectorAll("[data-receipt]").forEach(button => {
    button.addEventListener("click", () => printReceipt(Number(button.dataset.receipt)));
  });
  $("ordersList").querySelectorAll("[data-order]").forEach(select => {
    select.addEventListener("change", () => updateOrder(Number(select.dataset.order), select.value));
  });
}
function printReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;
  if (currentRole !== "admin" && order.customerId !== currentUser.id) return;
  const rows = order.items.map(item => `<tr><td>${escapeHTML(item.name)} × ${item.quantity}</td><td>${money(item.price)}</td><td>${money(item.subtotal)}</td></tr>`).join("");
  const receipt = `<div id="printReceipt" class="receipt">
    <h1>🌷 Petal &amp; Vine</h1><p>Flower Shop · Binalonan, Pangasinan</p><hr>
    <h2>OFFICIAL ORDER RECEIPT</h2><p><strong>Receipt No:</strong> PV-${order.id}</p>
    <p><strong>Date:</strong> ${escapeHTML(order.date ? new Date(order.date).toLocaleString("en-PH") : "—")}</p>
    <p><strong>Customer:</strong> ${escapeHTML(order.customerName || "Customer")}</p>
    <p><strong>Contact:</strong> ${escapeHTML(order.phone || "—")}</p>
    <p><strong>Delivery:</strong> ${escapeHTML(order.address || "—")}</p>
    <p><strong>Payment:</strong> ${escapeHTML(order.payment || "—")}</p>
    <table><thead><tr><th>Item</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
    <h2>Total: ${money(order.total)}</h2><p>Status: ${escapeHTML(order.status)}</p>
    <p>Thank you for choosing Petal &amp; Vine! 🌸</p>
    <button class="btn primary" onclick="window.print()">Print Receipt</button>
  </div>`;
  const win = window.open("", "_blank", "width=800,height=700");
  if (!win) { alert("Please allow pop-ups to print the receipt."); return; }
  win.document.write(`<!doctype html><html><head><title>Receipt PV-${order.id}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#333}h1,h2{color:#6c5b7b}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}button{padding:10px 16px;background:#c06c84;color:white;border:0;border-radius:6px}@media print{button{display:none}}</style></head><body>${receipt}</body></html>`);
  win.document.close();
  win.focus();
}

function updateOrder(id, status) {
  if (currentRole !== "admin") return;
  const order = orders.find(item => item.id === id);
  if (!order || !["Pending", "Processing", "Completed", "Cancelled"].includes(status)) return;

  const oldStatus = order.status;
  if (oldStatus === status) return;

  // Restore stock when an order is cancelled; deduct it again if reactivated.
  if (oldStatus === "Cancelled" && status !== "Cancelled") {
    const canRestore = order.items.every(item => {
      const product = products.find(p => p.id === item.productId);
      return product && product.stock >= item.quantity;
    });
    if (!canRestore) {
      alert("Insufficient stock to reactivate this order.");
      renderOrders();
      return;
    }
    order.items.forEach(item => {
      products.find(p => p.id === item.productId).stock -= item.quantity;
    });
  } else if (status === "Cancelled" && oldStatus !== "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  order.status = status;
  if (!save(DB.products, products) || !save(DB.orders, orders)) {
    order.status = oldStatus;
    renderAll();
    return;
  }
  renderAll();
  notify("Order status updated.");
}

/* CUSTOMER LIST AND REPORTS */

function renderCustomers() {
  if (currentRole !== "admin") return;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const newUsers = users.filter(user => user.createdAt && now - new Date(user.createdAt).getTime() <= sevenDays).length;
  const activeUsers = users.filter(user => user.lastLogin && now - new Date(user.lastLogin).getTime() <= thirtyDays).length;
  $("userTotal").textContent = users.length;
  $("userNew").textContent = newUsers;
  $("userActive").textContent = activeUsers;
  $("customersList").innerHTML = users.length
    ? `<div class="table-wrap"><table><thead><tr><th>Full Name</th><th>Username</th><th>Joined</th><th>Last Login</th><th>Account</th><th>Action</th></tr></thead>
       <tbody>${users.map(user => `<tr>
         <td>${escapeHTML(user.fullName)}</td><td>${escapeHTML(user.username)}</td>
         <td>${user.createdAt ? escapeHTML(new Date(user.createdAt).toLocaleDateString("en-PH")) : "Legacy account"}</td>
         <td>${user.lastLogin ? escapeHTML(new Date(user.lastLogin).toLocaleString("en-PH")) : "Never logged in"}</td>
         <td>${user.active === false ? "Disabled" : "Active"}</td>
         <td><button class="btn ${user.active === false ? "success" : "light"}" type="button" data-toggle-user="${user.id}">${user.active === false ? "Enable" : "Disable"}</button>
         <button class="btn danger" type="button" data-delete-user="${user.id}">Delete</button></td>
       </tr>`).join("")}</tbody></table></div>`
    : '<div class="empty-state">No registered customers yet.</div>';

  $("customersList").querySelectorAll("[data-toggle-user]").forEach(button => {
    button.addEventListener("click", () => toggleUser(Number(button.dataset.toggleUser)));
  });
  $("customersList").querySelectorAll("[data-delete-user]").forEach(button => {
    button.addEventListener("click", () => deleteUser(Number(button.dataset.deleteUser)));
  });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;
  const user = users.find(item => item.id === id);
  if (!user) return;
  user.active = user.active === false;
  if (!save(DB.users, users)) return;
  renderCustomers();
  notify(user.active ? "User account enabled." : "User account disabled.");
}

function deleteUser(id) {
  if (currentRole !== "admin") return;
  const user = users.find(item => item.id === id);
  if (!user || !confirm(`Delete customer account ${user.username}?`)) return;
  const previous = users;
  users = users.filter(item => item.id !== id);
  if (!save(DB.users, users)) { users = previous; return; }
  renderCustomers();
  renderDashboard();
  notify("Customer account deleted.");
}

function renderReports() {
  if (currentRole !== "admin") return;
  const completed = orders.filter(order => order.status === "Completed");
  const revenue = completed.reduce((sum, order) => sum + Number(order.total || 0), 0);
  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;
  $("reportPending").textContent = orders.filter(order =>
    order.status === "Pending" || order.status === "Processing"
  ).length;
}

function renderAll() {
  renderDashboard();
  if (currentRole === "admin") {
    renderInventory();
    renderOrders();
    renderCustomers();
    renderReports();
  } else {
    renderShop();
    renderCart();
    renderOrders();
  }
}

/* NOTIFICATIONS */

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}

/* INITIALIZATION */

backToChoices();
