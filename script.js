"use strict";

const KEYS = {
  products: "pv_products_v7",
  users: "pv_users_v7",
  orders: "pv_orders_v7",
  admin: "pv_admin_v7"
};

const DEFAULT_ADMIN = {
  displayName: "Administrator",
  username: "admin",
  password: "Admin123"
};

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

let products = loadData(KEYS.products, null);
let users = loadData(KEYS.users, []);
let orders = loadData(KEYS.orders, []);
let admin = loadData(KEYS.admin, {...DEFAULT_ADMIN});
let currentUser = null;
let cart = [];
let selectedProductImage = "";
let toastTimer = null;

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
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
    showToast("Browser storage is full. Use a smaller picture or remove old data.");
    return false;
  }
}

function saveAll() {
  const results = [
    saveData(KEYS.products, products),
    saveData(KEYS.users, users),
    saveData(KEYS.orders, orders),
    saveData(KEYS.admin, admin)
  ];
  return results.every(Boolean);
}

function initialize() {
  if (!Array.isArray(products)) products = defaultProducts.map(p => ({...p}));
  if (!Array.isArray(users)) users = [];
  if (!Array.isArray(orders)) orders = [];
  if (!admin || !admin.username || !admin.password) admin = {...DEFAULT_ADMIN};

  products = products.map((p, i) => ({
    id: Number(p.id) || Date.now() + i,
    name: String(p.name || "Unnamed Product"),
    category: p.category || "Other",
    emoji: p.emoji || "🌸",
    description: p.description || "",
    price: Number(p.price) || 0,
    stock: Math.max(0, Number(p.stock) || 0),
    image: typeof p.image === "string" ? p.image : ""
  }));

  document.getElementById("loginForm").addEventListener("submit", login);
  document.getElementById("registerForm").addEventListener("submit", register);
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("adminSettingsForm").addEventListener("submit", saveAdminSettings);

  saveAll();
}

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

function login(event) {
  event.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");
  error.textContent = "";

  if (username.toLowerCase() === admin.username.toLowerCase() && password === admin.password) {
    currentUser = {role:"admin", username:admin.username, name:admin.displayName};
    startApp();
    return;
  }

  const user = users.find(item =>
    String(item.username).toLowerCase() === username.toLowerCase() &&
    item.password === password
  );

  if (!user) {
    error.textContent = "Incorrect username or password.";
    return;
  }

  currentUser = {role:"customer", username:user.username, name:user.fullName};
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
    error.textContent = "Enter a valid name and a username with at least 3 characters.";
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
  if (username.toLowerCase() === admin.username.toLowerCase() ||
      users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
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

  if (!saveAll()) {
    users.pop();
    return;
  }

  document.getElementById("registerForm").reset();
  showLogin();
  document.getElementById("loginUsername").value = username;
  showToast("Account created. You can now log in.");
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

function startApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("welcomeText").textContent = "Welcome, " + currentUser.name;
  buildNavigation();
  showPage("dashboard");
}

function buildNavigation() {
  if (!currentUser) return;
  const adminLinks = [
    ["dashboard", "Dashboard & Inventory"],
    ["orders", "Orders"],
    ["customers", "Customers"],
    ["receipts", "Receipts"],
    ["reports", "Reports"],
    ["settings", "Settings"]
  ];
  const customerLinks = [
    ["dashboard", "Home"],
    ["shop", "Shop"],
    ["cart", "🛒 Cart (" + getCartCount() + ")"],
    ["orders", "My Orders"],
    ["profile", "My Account"]
  ];
  const links = currentUser.role === "admin" ? adminLinks : customerLinks;
  document.getElementById("navigation").innerHTML = links.map(link => `
    <button type="button" data-page="${link[0]}" onclick="showPage('${link[0]}')">${escapeHTML(link[1])}</button>
  `).join("");
}

function showPage(pageName) {
  if (!currentUser) return;

  const adminOnly = ["customers", "receipts", "reports", "settings"];
  const customerOnly = ["shop", "cart", "profile"];

  if (currentUser.role === "admin" && customerOnly.includes(pageName)) {
    showToast("This page is only available to customers.");
    return;
  }
  if (currentUser.role === "customer" && adminOnly.includes(pageName)) {
    showToast("You do not have permission to open that page.");
    return;
  }

  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  const page = document.getElementById(pageName + "Page");
  if (!page) return;
  page.classList.remove("hidden");

  document.querySelectorAll(".navigation button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  const renderers = {
    dashboard: renderDashboard,
    shop: renderShop,
    cart: renderCart,
    orders: renderOrders,
    customers: renderCustomers,
    receipts: renderReceipts,
    reports: renderReports,
    settings: loadAdminSettings,
    profile: renderProfile
  };
  if (renderers[pageName]) renderers[pageName]();
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits:2, maximumFractionDigits:2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[char]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function getProduct(id) {
  return products.find(product => Number(product.id) === Number(id));
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + Number(item.quantity), 0);
}

function productPicture(product) {
  return product.image
    ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
    : `<span class="product-emoji">${escapeHTML(product.emoji || "🌸")}</span>`;
}

function renderDashboard() {
  const isAdmin = currentUser.role === "admin";
  const myOrders = isAdmin ? orders : orders.filter(o => o.username === currentUser.username);
  const sales = orders.filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const stats = isAdmin
    ? [["Products", products.length], ["Orders", orders.length], ["Customers", users.length], ["Sales", money(sales)]]
    : [["Available Products", products.filter(p => p.stock > 0).length],
       ["My Orders", myOrders.length], ["Cart Items", getCartCount()]];

  document.getElementById("dashboardTitle").textContent = isAdmin ? "Dashboard & Inventory" : "Welcome to Petal & Vine";
  document.getElementById("dashboardSubtitle").textContent = isAdmin
    ? "View your shop performance and manage all products."
    : "Discover beautiful flowers for every occasion.";

  document.getElementById("dashboardStats").innerHTML = stats.map(item => `
    <div class="stat-card"><span>${escapeHTML(item[0])}</span><strong>${escapeHTML(item[1])}</strong></div>
  `).join("");

  const adminSection = document.getElementById("adminInventorySection");
  const customerSection = document.getElementById("customerFeatured");

  if (isAdmin) {
    adminSection.classList.remove("hidden");
    customerSection.classList.add("hidden");
    renderInventory();
  } else {
    adminSection.classList.add("hidden");
    customerSection.classList.remove("hidden");
    document.getElementById("featuredProducts").innerHTML =
      products.slice(0, 4).map(product => productCard(product, false)).join("");
  }
}

function productCard(product, adminMode) {
  const out = Number(product.stock) <= 0;
  return `
    <article class="product-card">
      <div class="product-picture">${productPicture(product)}</div>
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "")}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">${out ? "Out of stock" : "Stock: " + Number(product.stock)}</div>
        ${adminMode ? `
          <div class="button-row">
            <button class="btn primary" type="button" onclick="editProduct(${Number(product.id)})">Edit</button>
            <button class="btn danger" type="button" onclick="deleteProduct(${Number(product.id)})">Delete</button>
          </div>
        ` : `
          <button class="btn primary full" type="button" ${out ? "disabled" : ""} onclick="addToCart(${Number(product.id)})">Add to Cart</button>
          <button class="btn outline full" type="button" ${out ? "disabled" : ""} onclick="buyNow(${Number(product.id)})">Buy Now</button>
        `}
      </div>
    </article>
  `;
}

function renderShop() {
  const search = document.getElementById("shopSearch").value.trim().toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search) ||
    (p.description || "").toLowerCase().includes(search)
  );
  document.getElementById("shopProducts").innerHTML = filtered.length
    ? filtered.map(p => productCard(p, false)).join("")
    : `<div class="empty-state">No products found.</div>`;
}

function addToCart(id) {
  if (!currentUser || currentUser.role !== "customer") return;
  const product = getProduct(id);
  if (!product || product.stock <= 0) return showToast("Product unavailable.");

  const existing = cart.find(item => item.id === Number(id));
  if (existing) {
    if (existing.quantity >= product.stock) return showToast("Maximum available stock reached.");
    existing.quantity += 1;
  } else {
    cart.push({id:Number(id), quantity:1});
  }

  buildNavigation();
  showToast("Added to cart.");
  if (document.getElementById("cartPage").classList.contains("hidden") === false) renderCart();
}

function buyNow(id) {
  if (!currentUser || currentUser.role !== "customer") return;
  const product = getProduct(id);
  if (!product || product.stock <= 0) return showToast("Product unavailable.");

  const existing = cart.find(item => item.id === Number(id));
  if (existing) {
    if (existing.quantity >= product.stock) return showToast("Maximum available stock reached.");
    existing.quantity += 1;
  } else {
    cart.push({id:Number(id), quantity:1});
  }
  buildNavigation();
  showPage("cart");
}

function changeCartQuantity(id, value) {
  const item = cart.find(entry => entry.id === Number(id));
  const product = getProduct(id);
  if (!item || !product) return;

  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    cart = cart.filter(entry => entry.id !== Number(id));
    showToast("Product removed from cart.");
  } else if (quantity > product.stock) {
    item.quantity = product.stock;
    showToast("Quantity adjusted to available stock.");
  } else {
    item.quantity = quantity;
  }
  buildNavigation();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== Number(id));
  buildNavigation();
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  const summary = document.getElementById("cartSummary");

  cart = cart.filter(item => getProduct(item.id));
  buildNavigation();

  if (!cart.length) {
    container.innerHTML = `<div class="empty-state">Your cart is empty. Visit the Shop to add flowers.</div>`;
    summary.innerHTML = "";
    return;
  }

  let total = 0;
  let totalItems = 0;

  container.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    const subtotal = Number(product.price) * Number(item.quantity);
    total += subtotal;
    totalItems += Number(item.quantity);

    return `
      <div class="cart-row">
        <div>
          <strong>${escapeHTML(product.name)}</strong>
          <p>${money(product.price)} each</p>
          <span class="stock">Available stock: ${product.stock}</span>
        </div>
        <div>
          <label for="qty-${product.id}">Quantity</label>
          <input id="qty-${product.id}" type="number" min="1" max="${product.stock}" value="${item.quantity}"
            onchange="changeCartQuantity(${product.id},this.value)">
        </div>
        <strong>${money(subtotal)}</strong>
        <button class="btn danger" type="button" onclick="removeFromCart(${product.id})">Remove</button>
      </div>
    `;
  }).join("");

  summary.innerHTML = `
    <h3>Order Summary</h3>
    <p>Total items: <strong>${totalItems}</strong></p>
    <p>Grand total: <strong class="price">${money(total)}</strong></p>
    <label for="checkoutAddress">Delivery Address</label>
    <textarea id="checkoutAddress" placeholder="Enter your complete delivery address" required></textarea>
    <label for="checkoutPhone">Contact Number</label>
    <input id="checkoutPhone" type="tel" placeholder="Enter your contact number" required>
    <label>Payment Method</label>
    <input value="Cash on Delivery (COD)" readonly>
    <button class="btn primary full" type="button" onclick="checkout()">Place Order</button>
  `;
}

function checkout() {
  if (!currentUser || currentUser.role !== "customer") return;
  if (!cart.length) return showToast("Your cart is empty.");

  const address = document.getElementById("checkoutAddress").value.trim();
  const phone = document.getElementById("checkoutPhone").value.trim();
  if (address.length < 8 || phone.length < 7) {
    return showToast("Enter a complete delivery address and valid contact number.");
  }

  for (const item of cart) {
    const product = getProduct(item.id);
    if (!product || !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 || product.stock < item.quantity) {
      return showToast("One or more products no longer have enough stock. Please review your cart.");
    }
  }

  const items = cart.map(item => {
    const product = getProduct(item.id);
    return {
      id:product.id,
      name:product.name,
      price:Number(product.price),
      quantity:Number(item.quantity),
      subtotal:Number(product.price) * Number(item.quantity)
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const oldProducts = products.map(p => ({...p}));

  items.forEach(item => {
    const product = getProduct(item.id);
    product.stock -= item.quantity;
  });

  const order = {
    id:"PV-" + Date.now(),
    username:currentUser.username,
    customerName:currentUser.name,
    phone,
    address,
    payment:"Cash on Delivery (COD)",
    items,
    total,
    status:"Pending",
    date:new Date().toISOString()
  };

  orders.unshift(order);
  if (!saveAll()) {
    products = oldProducts;
    orders.shift();
    return;
  }

  cart = [];
  buildNavigation();
  showToast("Your order has been placed successfully!");
  showPage("orders");
}
function renderInventory() {
  const searchInput = document.getElementById("inventorySearch");
  if (!searchInput) return;
  const search = searchInput.value.trim().toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search)
  );
  document.getElementById("inventoryProducts").innerHTML = filtered.length
    ? filtered.map(p => productCard(p, true)).join("")
    : `<div class="empty-state">No products found.</div>`;
}

function resetProductImageUI() {
  document.getElementById("productImage").value = "";
  document.getElementById("imagePreview").src = "";
  document.getElementById("imagePreview").classList.add("hidden");
  document.getElementById("removeProductImage").classList.add("hidden");
}

function openProductEditor() {
  if (!currentUser || currentUser.role !== "admin") return;
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("productEmoji").value = "🌸";
  document.getElementById("editorTitle").textContent = "Add Product";
  selectedProductImage = "";
  resetProductImageUI();
  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({behavior:"smooth",block:"start"});
}

function closeProductEditor() {
  document.getElementById("productEditor").classList.add("hidden");
}

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
  document.getElementById("removeProductImage").classList.toggle("hidden", !selectedProductImage);
  document.getElementById("productImage").value = "";

  document.getElementById("editorTitle").textContent = "Edit Product";
  document.getElementById("productEditor").classList.remove("hidden");
  document.getElementById("productEditor").scrollIntoView({behavior:"smooth",block:"start"});
}

function previewProductImage(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Choose a valid image file.");
    event.target.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast("Image must be 2 MB or smaller.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    selectedProductImage = reader.result;
    const preview = document.getElementById("imagePreview");
    preview.src = selectedProductImage;
    preview.classList.remove("hidden");
    document.getElementById("removeProductImage").classList.remove("hidden");
  };
  reader.onerror = () => showToast("Could not read that image. Try another file.");
  reader.readAsDataURL(file);
}

function removeProductImage() {
  selectedProductImage = "";
  resetProductImageUI();
}

function saveProduct(event) {
  event.preventDefault();
  if (!currentUser || currentUser.role !== "admin") return;

  const idValue = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const emoji = document.getElementById("productEmoji").value.trim() || "🌸";
  const description = document.getElementById("productDescription").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return showToast("Enter valid product details.");
  }
  if (products.some(p => Number(p.id) !== Number(idValue) &&
      p.name.toLowerCase() === name.toLowerCase())) {
    return showToast("A product with this name already exists.");
  }

  const oldProduct = idValue ? getProduct(idValue) : null;
  const data = {
    id:idValue ? Number(idValue) : Date.now(),
    name, category, emoji, description, price, stock,
    image:selectedProductImage
  };

  if (idValue) {
    const index = products.findIndex(p => Number(p.id) === Number(idValue));
    if (index < 0) return showToast("Product could not be found.");
    products[index] = data;
  } else {
    products.unshift(data);
  }

  if (!saveAll()) {
    if (idValue && oldProduct) {
      const index = products.findIndex(p => Number(p.id) === Number(idValue));
      if (index >= 0) products[index] = oldProduct;
    } else {
      products = products.filter(p => Number(p.id) !== data.id);
    }
    return;
  }

  closeProductEditor();
  renderInventory();
  renderDashboard();
  showToast(idValue ? "Product updated successfully." : "Product added successfully.");
}

function deleteProduct(id) {
  if (!currentUser || currentUser.role !== "admin") return;
  const p = getProduct(id);
  if (!p || !confirm("Delete " + p.name + "?")) return;

  const oldProducts = products;
  products = products.filter(item => Number(item.id) !== Number(id));
  cart = cart.filter(item => Number(item.id) !== Number(id));

  if (!saveAll()) {
    products = oldProducts;
    return;
  }

  buildNavigation();
  renderInventory();
  renderDashboard();
  showToast("Product deleted.");
}

function visibleOrders() {
  return currentUser.role === "admin"
    ? orders
    : orders.filter(o => o.username === currentUser.username);
}

function renderOrders() {
  const list = document.getElementById("ordersList");
  const mine = visibleOrders();
  document.getElementById("ordersTitle").textContent =
    currentUser.role === "admin" ? "All Orders" : "My Orders";

  if (!mine.length) {
    list.innerHTML = `<div class="empty-state">No orders yet.</div>`;
    return;
  }

  list.innerHTML = mine.map(order => {
    const safeId = escapeHTML(order.id);
    const items = Array.isArray(order.items) ? order.items : [];
    return `
      <div class="order-card">
        <h3>${safeId}</h3>
        <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
        <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
        <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
        <p><strong>Contact:</strong> ${escapeHTML(order.phone)}</p>
        <ul>${items.map(item => `
          <li>${escapeHTML(item.name)} × ${Number(item.quantity)} — ${money(item.subtotal)}</li>
        `).join("")}</ul>
        <h3>Total: ${money(order.total)}</h3>
        <p><span class="badge ${order.status === "Completed" ? "done" : order.status === "Cancelled" ? "cancelled" : ""}">${escapeHTML(order.status)}</span></p>
        ${currentUser.role === "admin" ? `
          <label for="status-${escapeHTML(order.id)}">Update Order Status</label>
          <select id="status-${escapeHTML(order.id)}" onchange="updateOrderStatus('${escapeHTML(order.id)}',this.value)">
            ${["Pending","Processing","Completed","Cancelled"].map(s =>
              `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        ` : ""}
        <button class="btn outline" type="button" onclick="printReceipt('${escapeHTML(order.id)}')">View / Print Receipt</button>
      </div>
    `;
  }).join("");
}

function updateOrderStatus(orderId, status) {
  if (!currentUser || currentUser.role !== "admin") return;
  const allowed = ["Pending","Processing","Completed","Cancelled"];
  if (!allowed.includes(status)) return;

  const order = orders.find(o => o.id === orderId);
  if (!order || order.status === status) return;

  const previous = order.status;
  const items = Array.isArray(order.items) ? order.items : [];

  if (previous === "Cancelled" && status !== "Cancelled") {
    const canRestore = items.every(item => {
      const p = getProduct(item.id);
      return p && p.stock >= Number(item.quantity);
    });
    if (!canRestore) {
      showToast("Not enough stock to restore this order.");
      renderOrders();
      return;
    }
    items.forEach(item => { getProduct(item.id).stock -= Number(item.quantity); });
  }

  if (previous !== "Cancelled" && status === "Cancelled") {
    items.forEach(item => {
      const p = getProduct(item.id);
      if (p) p.stock += Number(item.quantity);
    });
  }

  order.status = status;
  if (!saveAll()) {
    if (previous === "Cancelled" && status !== "Cancelled") {
      items.forEach(item => { const p = getProduct(item.id); if (p) p.stock += Number(item.quantity); });
    } else if (previous !== "Cancelled" && status === "Cancelled") {
      items.forEach(item => { const p = getProduct(item.id); if (p) p.stock -= Number(item.quantity); });
    }
    order.status = previous;
    return;
  }

  renderOrders();
  renderInventory();
  renderDashboard();
  showToast("Order status updated.");
}
function renderReceipts() {
  const list = document.getElementById("receiptsList");
  list.innerHTML = orders.length ? orders.map(order => `
    <div class="receipt-card">
      <h3>Receipt: ${escapeHTML(order.id)}</h3>
      <p>Customer: ${escapeHTML(order.customerName)}</p>
      <p>Date: ${new Date(order.date).toLocaleString()}</p>
      <p>Payment: ${escapeHTML(order.payment)}</p>
      <p>Total: <strong>${money(order.total)}</strong></p>
      <p>Status: ${escapeHTML(order.status)}</p>
      <button class="btn primary" type="button" onclick="printReceipt('${escapeHTML(order.id)}')">Print / Save PDF</button>
    </div>
  `).join("") : `<div class="empty-state">No receipts available yet.</div>`;
}

function printReceipt(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const rows = (order.items || []).map(item => `
    <tr>
      <td>${escapeHTML(item.name)}</td>
      <td style="text-align:center">${Number(item.quantity)}</td>
      <td style="text-align:right">${money(item.price)}</td>
      <td style="text-align:right">${money(item.subtotal)}</td>
    </tr>
  `).join("");

  document.getElementById("printArea").innerHTML = `
    <h1>🌸 Petal & Vine</h1>
    <h2>Official Receipt</h2><hr>
    <p><strong>Receipt Number:</strong> ${escapeHTML(order.id)}</p>
    <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
    <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
    <p><strong>Contact:</strong> ${escapeHTML(order.phone)}</p>
    <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
    <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:20px" border="1" cellpadding="8">
      <thead>
        <tr>
          <th align="left">Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <hr>
    <h2 style="text-align:right">Total: ${money(order.total)}</h2>
    <p>Status: ${escapeHTML(order.status)}</p>
    <p style="text-align:center;margin-top:40px">Thank you for choosing Petal & Vine!</p>
  `;
  window.print();
}

function renderCustomers() {
  const list = document.getElementById("customersList");
  list.innerHTML = users.length ? users.map(user => {
    const customerOrders = orders.filter(o => o.username === user.username);
    const spent = customerOrders.filter(o => o.status !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return `
      <div class="customer-card">
        <h3>${escapeHTML(user.fullName)}</h3>
        <p>Username: ${escapeHTML(user.username)}</p>
        <p>Registered: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
        <p>Orders: ${customerOrders.length}</p>
        <p>Total Purchases: ${money(spent)}</p>
        <button class="btn danger" type="button" onclick="deleteCustomer(${Number(user.id)})">Delete Customer</button>
      </div>
    `;
  }).join("") : `<div class="empty-state">No registered customers yet.</div>`;
}

function deleteCustomer(id) {
  if (!currentUser || currentUser.role !== "admin") return;

  const user = users.find(u => Number(u.id) === Number(id));
  if (!user || !confirm("Delete customer account for " + user.fullName + "?")) return;

  const oldUsers = users;
  users = users.filter(u => Number(u.id) !== Number(id));

  if (!saveAll()) {
    users = oldUsers;
    return;
  }

  renderCustomers();
  renderDashboard();
  showToast("Customer deleted.");
}

function renderReports() {
  const valid = orders.filter(o => o.status !== "Cancelled");
  const revenue = valid.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const completed = orders.filter(o => o.status === "Completed").length;
  const pending = orders.filter(o => o.status === "Pending").length;
  const sold = {};

  valid.forEach(order => (order.items || []).forEach(item => {
    sold[item.name] = (sold[item.name] || 0) + Number(item.quantity || 0);
  }));

  const best = Object.entries(sold).sort((a,b) => b[1] - a[1]);

  document.getElementById("reportsContent").innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <span>Total Revenue</span>
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
      <div class="stat-card">
        <span>Total Customers</span>
        <strong>${users.length}</strong>
      </div>
    </div>

    <div class="panel">
      <h3>Best-Selling Products</h3>
      ${best.length
        ? `<ol>${best.map(item => `<li>${escapeHTML(item[0])} — ${item[1]} sold</li>`).join("")}</ol>`
        : "<p>No sales yet.</p>"}
    </div>

    <div class="panel">
      <h3>Inventory Summary</h3>
      <p>Total Products: ${products.length}</p>
      <p>Total Units in Stock: ${products.reduce((sum,p) => sum + Number(p.stock),0)}</p>
      <p>Out of Stock Products: ${products.filter(p => p.stock <= 0).length}</p>
    </div>
  `;
}

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
  if (!currentUser || currentUser.role !== "admin") return;

  const displayName = document.getElementById("adminDisplayName").value.trim();
  const username = document.getElementById("adminUsername").value.trim();
  const currentPassword = document.getElementById("currentAdminPassword").value;
  const newPassword = document.getElementById("newAdminPassword").value;
  const confirmPassword = document.getElementById("confirmAdminPassword").value;
  const message = document.getElementById("adminSettingsMessage");

  message.textContent = "";

  if (!displayName || username.length < 3) {
    message.textContent = "Enter a valid display name and username.";
    return;
  }

  if (currentPassword !== admin.password) {
    message.textContent = "Your current password is incorrect.";
    return;
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
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

  const oldAdmin = {...admin};

  admin = {
    displayName,
    username,
    password:newPassword || admin.password
  };

  if (!saveAll()) {
    admin = oldAdmin;
    return;
  }

  currentUser.username = admin.username;
  currentUser.name = admin.displayName;

  document.getElementById("welcomeText").textContent = "Welcome, " + currentUser.name;
  document.getElementById("currentAdminPassword").value = "";
  document.getElementById("newAdminPassword").value = "";
  document.getElementById("confirmAdminPassword").value = "";

  message.textContent = "Settings saved successfully!";
  showToast("Admin settings updated.");
}

function renderProfile() {
  const myOrders = orders.filter(o => o.username === currentUser.username);

  document.getElementById("profileContent").innerHTML = `
    <h3>${escapeHTML(currentUser.name)}</h3>
    <p>Username: ${escapeHTML(currentUser.username)}</p>
    <p>Account Type: Customer</p>
    <p>Total Orders: ${myOrders.length}</p>
    <button class="btn primary" type="button" onclick="showPage('orders')">View My Orders</button>
  `;
}

document.addEventListener("DOMContentLoaded", initialize);
