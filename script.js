"use strict";

/* PETAL & VINE
   GitHub Pages version.
   Data is stored in this browser using localStorage.
*/

const KEYS = {
  products: "pv_products_v6",
  users: "pv_users_v6",
  orders: "pv_orders_v6",
  admin: "pv_admin_v6",
  settings: "pv_settings_v6"
};

const starterProducts = [
  ["Classic Rose Bouquet", "A timeless bouquet of fresh red roses.", 850, 20, "🌹"],
  ["Pink Romance", "Soft pink roses wrapped with care.", 950, 18, "💐"],
  ["Sunflower Joy", "Bright sunflowers to make someone smile.", 650, 15, "🌻"],
  ["White Elegance", "Elegant white blooms for special moments.", 1100, 12, "🤍"],
  ["Tulip Dreams", "A charming bunch of colorful tulips.", 1200, 10, "🌷"],
  ["Lavender Love", "A calming lavender-inspired arrangement.", 780, 14, "🪻"],
  ["Pastel Garden", "A soft mix of pastel seasonal flowers.", 1350, 10, "🌸"],
  ["Baby's Breath", "Delicate little blooms for a sweet gift.", 550, 25, "🤍"],
  ["Golden Sunshine", "A cheerful yellow flower arrangement.", 900, 12, "🌼"],
  ["Orchid Grace", "A graceful orchid arrangement.", 1500, 8, "🌺"],
  ["Peach Perfect", "Warm peach tones in a lovely bouquet.", 1050, 10, "🧡"],
  ["Forever Love", "A romantic arrangement for anniversaries.", 1800, 7, "❤️"],
  ["Daisy Delight", "Fresh and playful daisy bouquet.", 700, 20, "🌼"],
  ["Garden Party", "A colorful garden-inspired bouquet.", 1250, 9, "💐"],
  ["Petal Surprise", "A beautiful surprise flower arrangement.", 1000, 15, "🌷"]
];

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Could not read saved data:", key, error);
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix = "PV") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

let products = readData(KEYS.products, null);
let users = readData(KEYS.users, []);
let orders = readData(KEYS.orders, []);
let admin = readData(KEYS.admin, {
  username: "admin",
  password: "Admin123",
  name: "Store Administrator"
});
let settings = readData(KEYS.settings, {
  shopName: "Petal & Vine",
  shopAddress: "",
  shopPhone: ""
});

let currentUser = null;
let cart = [];
let activeAdminPage = "overview";

if (!Array.isArray(products) || products.length === 0) {
  products = starterProducts.map((item, index) => ({
    id: "P" + (index + 1),
    name: item[0],
    description: item[1],
    price: item[2],
    stock: item[3],
    emoji: item[4],
    image: ""
  }));
  saveData(KEYS.products, products);
}

if (!Array.isArray(users)) users = [];
if (!Array.isArray(orders)) orders = [];

function persistAll() {
  saveData(KEYS.products, products);
  saveData(KEYS.users, users);
  saveData(KEYS.orders, orders);
  saveData(KEYS.admin, admin);
  saveData(KEYS.settings, settings);
}

function toast(message) {
  const element = document.getElementById("toast");
  if (!element) return;
  element.textContent = message;
  element.style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.style.display = "none";
  }, 2600);
}

function togglePassword(id, button) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  button.textContent = input.type === "password" ? "Show" : "Hide";
}

function switchAuth(mode) {
  const login = mode === "login";
  document.getElementById("loginForm").classList.toggle("hidden", !login);
  document.getElementById("registerForm").classList.toggle("hidden", login);
  document.getElementById("loginTab").classList.toggle("active", login);
  document.getElementById("registerTab").classList.toggle("active", !login);
  document.getElementById("authMessage").textContent = "";
}

function showOnly(pageId) {
  document.querySelectorAll("main > section").forEach(section => {
    section.classList.add("hidden");
  });
  const page = document.getElementById(pageId);
  if (page) page.classList.remove("hidden");
}

function updateHeader() {
  const welcome = document.getElementById("welcomeText");
  const logoutButton = document.getElementById("logoutButton");
  const cartButton = document.getElementById("cartButton");

  if (!currentUser) {
    welcome.textContent = "Welcome!";
    logoutButton.classList.add("hidden");
    cartButton.classList.add("hidden");
    return;
  }

  welcome.textContent = "Hello, " + currentUser.name;
  logoutButton.classList.remove("hidden");
  cartButton.classList.toggle("hidden", currentUser.role === "admin");
  document.getElementById("cartCount").textContent =
    cart.reduce((sum, item) => sum + item.quantity, 0);
}

function showPage(page) {
  if (!currentUser) {
    showOnly("authPage");
    return;
  }

  if (page === "cart" && currentUser.role === "admin") {
    showAdmin("overview");
    return;
  }

  if (page === "shop") {
    showOnly("shopPage");
    renderShop();
  } else if (page === "cart") {
    showOnly("cartPage");
    renderCart();
  } else if (page === "orders") {
    showOnly("myOrdersPage");
    renderMyOrders();
  }
  updateHeader();
}

function loginUser(user) {
  currentUser = user;
  user.lastLogin = new Date().toISOString();
  persistAll();
  updateHeader();

  if (user.role === "admin") {
    showOnly("adminPage");
    document.getElementById("adminWelcome").textContent =
      "Welcome, " + admin.name;
    showAdmin("overview");
  } else {
    showPage("shop");
  }
}

document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const username = document.getElementById("loginUser").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("authMessage");

  if (username === admin.username.toLowerCase() && password === admin.password) {
    loginUser({
      id: "ADMIN",
      name: admin.name,
      username: admin.username,
      role: "admin"
    });
    event.target.reset();
    return;
  }

  const user = users.find(item =>
    (item.username.toLowerCase() === username ||
     item.email.toLowerCase() === username) &&
    item.password === password
  );

  if (!user) {
    message.textContent = "Incorrect username/email or password.";
    return;
  }

  loginUser(user);
  event.target.reset();
});

document.getElementById("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;
  const message = document.getElementById("authMessage");

  if (users.some(user => user.email.toLowerCase() === email)) {
    message.textContent = "That email is already registered.";
    return;
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    message.textContent = "That username is already taken.";
    return;
  }

  const user = {
    id: makeId("USER"),
    name,
    email,
    username,
    password,
    role: "customer",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  users.push(user);
  persistAll();
  event.target.reset();
  loginUser(user);
  toast("Your account has been created!");
});

function logout() {
  currentUser = null;
  cart = [];
  updateHeader();
  showOnly("authPage");
  toast("You have logged out.");
}

function productImage(product) {
  if (product.image) {
    return `<img src="${product.image}" alt="${escapeHTML(product.name)}">`;
  }
  return `<span>${escapeHTML(product.emoji || "💐")}</span>`;
}

function renderShop() {
  const search = (document.getElementById("shopSearch").value || "").toLowerCase();
  const list = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.description.toLowerCase().includes(search)
  );

  const container = document.getElementById("products");

  if (!list.length) {
    container.innerHTML = `<div class="empty">No flowers match your search.</div>`;
    return;
  }

  container.innerHTML = list.map(product => `
    <article class="product-card">
      <div class="product-image">${productImage(product)}</div>
      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description)}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">${product.stock} available</div>
        <div class="product-bottom">
          <input aria-label="Quantity" id="qty-${product.id}" type="number"
            min="1" max="${product.stock}" value="1" ${product.stock < 1 ? "disabled" : ""}
            style="width:75px;padding:8px">
          <button class="btn primary" onclick="addToCart('${product.id}')"
            ${product.stock < 1 ? "disabled" : ""}>
            ${product.stock < 1 ? "Sold out" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

document.getElementById("shopSearch").addEventListener("input", renderShop);

function addToCart(id) {
  const product = products.find(item => item.id === id);
  const quantityInput = document.getElementById("qty-" + id);
  const quantity = Math.floor(Number(quantityInput?.value || 1));

  if (!product || quantity < 1) {
    toast("Please enter a quantity of at least 1.");
    return;
  }

  const existing = cart.find(item => item.productId === id);
  const alreadyInCart = existing ? existing.quantity : 0;

  if (alreadyInCart + quantity > product.stock) {
    toast("Only " + product.stock + " item(s) are available.");
    return;
  }

  if (existing) existing.quantity += quantity;
  else cart.push({ productId: id, quantity });

  updateHeader();
  toast("Added to your cart!");
}

function renderCart() {
  const container = document.getElementById("cartContent");

  if (!cart.length) {
    container.innerHTML = `<div class="empty">Your cart is empty.<br><br>
      <button class="btn primary" onclick="showPage('shop')">Continue shopping</button></div>`;
    return;
  }

  let total = 0;

  const rows = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return "";

    const lineTotal = product.price * item.quantity;
    total += lineTotal;

    return `
      <div class="cart-row">
        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <div class="muted">${money(product.price)} each</div>
          <strong>${money(lineTotal)}</strong>
        </div>
        <div class="cart-controls">
          <button onclick="changeQuantity('${product.id}',-1)">−</button>
          <strong>${item.quantity}</strong>
          <button onclick="changeQuantity('${product.id}',1)">+</button>
          <button class="btn danger" onclick="removeFromCart('${product.id}')">Remove</button>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = `
    ${rows}
    <div class="cart-total">Total: ${money(total)}</div>
    <div class="panel">
      <h2>Delivery details</h2>
      <form id="checkoutForm">
        <div class="form-grid">
          <div><label>Recipient name</label><input id="deliveryName" required value="${escapeHTML(currentUser.name)}"></div>
          <div><label>Phone number</label><input id="deliveryPhone" required></div>
          <div class="wide"><label>Delivery address</label><textarea id="deliveryAddress" rows="3" required></textarea></div>
          <div class="wide"><label>Payment method</label>
            <select id="paymentMethod"><option>Cash on Delivery</option><option>Pay on pickup</option></select>
          </div>
        </div>
        <button class="btn primary" type="submit">Place order</button>
      </form>
    </div>`;

  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
}

function changeQuantity(id, change) {
  const item = cart.find(entry => entry.productId === id);
  const product = products.find(entry => entry.id === id);
  if (!item || !product) return;

  const next = item.quantity + change;

  if (next < 1) {
    toast("Quantity must be at least 1. Remove the item if you don't want it.");
    return;
  }
  if (next > product.stock) {
    toast("Only " + product.stock + " item(s) are available.");
    return;
  }

  item.quantity = next;
  updateHeader();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.productId !== id);
  updateHeader();
  renderCart();
}

function placeOrder(event) {
  event.preventDefault();

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);
    if (!product || item.quantity < 1 || item.quantity > product.stock) {
      toast("One of your cart items no longer has enough stock.");
      renderCart();
      return;
    }
  }

  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: item.quantity,
      subtotal: Number(product.price) * item.quantity
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  const order = {
    id: makeId("ORDER"),
    customerId: currentUser.id,
    customerName: document.getElementById("deliveryName").value.trim(),
    phone: document.getElementById("deliveryPhone").value.trim(),
    address: document.getElementById("deliveryAddress").value.trim(),
    payment: document.getElementById("paymentMethod").value,
    items,
    total,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  cart = [];
  persistAll();
  updateHeader();
  showPage("orders");
  toast("Your order has been placed!");
}

function renderMyOrders() {
  const mine = orders.filter(order => order.customerId === currentUser.id);
  const container = document.getElementById("myOrdersContent");

  if (!mine.length) {
    container.innerHTML = `<div class="empty">You haven't placed an order yet.</div>`;
    return;
  }

  container.innerHTML = mine.map(order => `
    <div class="order-card panel">
      <div class="section-heading" style="margin:0">
        <div><h3>Order ${escapeHTML(order.id)}</h3>
          <span class="muted">${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <span class="badge">${escapeHTML(order.status)}</span>
      </div>
      <p>${order.items.map(item =>
        `${escapeHTML(item.name)} × ${item.quantity}`
      ).join("<br>")}</p>
      <strong>${money(order.total)}</strong>
    </div>
  `).join("");
}

/* ADMIN NAVIGATION */

function showAdmin(page) {
  if (!currentUser || currentUser.role !== "admin") {
    showOnly("authPage");
    return;
  }

  activeAdminPage = page;
  showOnly("adminPage");
  document.getElementById("adminWelcome").textContent = "Welcome, " + admin.name;

  const renderers = {
    overview: renderOverview,
    inventory: renderInventory,
    orders: renderAdminOrders,
    users: renderUsers,
    receipts: renderReceipts,
    reports: renderReports,
    settings: renderSettings
  };

  const render = renderers[page] || renderOverview;
  document.getElementById("adminContent").innerHTML = render();
}

function renderOverview() {
  const revenue = orders.reduce((sum, order) =>
    order.status !== "Cancelled" ? sum + order.total : sum, 0);
  const pending = orders.filter(order => order.status === "Pending").length;
  const lowStock = products.filter(product => product.stock <= 5).length;

  return `
    <div class="stats-grid">
      <div class="stat"><span>Total products</span><strong>${products.length}</strong></div>
      <div class="stat"><span>Total orders</span><strong>${orders.length}</strong></div>
      <div class="stat"><span>Pending orders</span><strong>${pending}</strong></div>
      <div class="stat"><span>Revenue (not cancelled)</span><strong>${money(revenue)}</strong></div>
    </div>
    <div class="stats-grid">
      <div class="stat"><span>Registered customers</span><strong>${users.length}</strong></div>
      <div class="stat"><span>Low-stock products</span><strong>${lowStock}</strong></div>
    </div>
    <div class="panel">
      <h2>Recent orders</h2>
      ${orders.length ? orders.slice(0, 5).map(order => `
        <p><strong>${escapeHTML(order.customerName)}</strong> —
        ${money(order.total)} — <span class="badge">${escapeHTML(order.status)}</span></p>
      `).join("") : `<p class="muted">No orders yet.</p>`}
    </div>`;
}

function renderInventory() {
  return `
    <div class="panel">
      <h2 id="productFormTitle">Add a product</h2>
      <form id="productForm">
        <input type="hidden" id="editProductId">
        <div class="form-grid">
          <div><label>Product name</label><input id="productName" required></div>
          <div><label>Price (₱)</label><input id="productPrice" type="number" min="0" step=".01" required></div>
          <div><label>Stock quantity</label><input id="productStock" type="number" min="0" step="1" required></div>
          <div><label>Emoji (optional)</label><input id="productEmoji" value="💐" maxlength="8"></div>
          <div class="wide"><label>Description</label><textarea id="productDescription" rows="2" required></textarea></div>
          <div class="wide"><label>Product photo</label><input id="productImage" type="file" accept="image/*">
            <small class="muted">Choose a small image file. It will be saved in this browser.</small>
          </div>
        </div>
        <button class="btn primary" type="submit">Save product</button>
        <button class="btn light" type="button" onclick="resetProductForm()">Clear</button>
      </form>
    </div>
    <div class="panel">
      <h2>Product inventory</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td>${escapeHTML(product.emoji || "💐")} ${escapeHTML(product.name)}</td>
              <td>${money(product.price)}</td><td>${product.stock}</td>
              <td class="actions">
                <button class="light" onclick="editProduct('${product.id}')">Edit</button>
                <button class="danger" onclick="deleteProduct('${product.id}')">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table></div>
    </div>`;
}

document.addEventListener("submit", event => {
  if (event.target.id !== "productForm") return;
  event.preventDefault();

  const id = document.getElementById("editProductId").value;
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Math.floor(Number(document.getElementById("productStock").value));
  const description = document.getElementById("productDescription").value.trim();
  const emoji = document.getElementById("productEmoji").value.trim() || "💐";
  const file = document.getElementById("productImage").files[0];

  if (!name || !description || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    toast("Please enter valid product details.");
    return;
  }

  if (products.some(product =>
    product.id !== id && product.name.toLowerCase() === name.toLowerCase()
  )) {
    toast("A product with this name already exists.");
    return;
  }

  const saveProduct = image => {
    if (id) {
      const product = products.find(item => item.id === id);
      if (!product) return;
      Object.assign(product, { name, price, stock, description, emoji });
      if (image) product.image = image;
    } else {
      products.push({
        id: makeId("P"),
        name, price, stock, description, emoji,
        image: image || ""
      });
    }

    persistAll();
    showAdmin("inventory");
    toast("Product saved successfully.");
  };

  if (file) {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      return;
    }
    if (file.size > 900 * 1024) {
      toast("Please use an image smaller than 900 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => saveProduct(reader.result);
    reader.onerror = () => toast("Could not read the selected image.");
    reader.readAsDataURL(file);
  } else {
    saveProduct("");
  }
});

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  document.getElementById("editProductId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productDescription").value = product.description;
  document.getElementById("productEmoji").value = product.emoji || "💐";
  document.getElementById("productFormTitle").textContent = "Edit product";
  document.getElementById("productForm").scrollIntoView({ behavior: "smooth" });
}

function resetProductForm() {
  const form = document.getElementById("productForm");
  if (!form) return;
  form.reset();
  document.getElementById("editProductId").value = "";
  document.getElementById("productFormTitle").textContent = "Add a product";
}

function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product || !confirm(`Delete "${product.name}"?`)) return;
  products = products.filter(item => item.id !== id);
  cart = cart.filter(item => item.productId !== id);
  persistAll();
  showAdmin("inventory");
  toast("Product deleted.");
}

function renderAdminOrders() {
  if (!orders.length) return `<div class="empty">No orders have been placed.</div>`;

  return `<div class="panel"><h2>All orders</h2><div class="table-wrap"><table>
    <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
    <tbody>${orders.map(order => `
      <tr>
        <td>${escapeHTML(order.id)}</td>
        <td>${escapeHTML(order.customerName)}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>${money(order.total)}</td>
        <td><span class="badge">${escapeHTML(order.status)}</span></td>
        <td>
          <select onchange="updateOrderStatus('${order.id}',this.value)">
            ${["Pending","Processing","Ready","Completed","Cancelled"].map(status =>
              `<option ${order.status === status ? "selected" : ""}>${status}</option>`
            ).join("")}
          </select>
        </td>
      </tr>
    `).join("")}</tbody>
  </table></div></div>`;
}

function updateOrderStatus(id, status) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  if (order.status !== "Cancelled" && status === "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  } else if (order.status === "Cancelled" && status !== "Cancelled") {
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        toast("Cannot reopen order: not enough stock.");
        showAdmin("orders");
        return;
      }
    }
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      product.stock -= item.quantity;
    });
  }

  order.status = status;
  persistAll();
  showAdmin("orders");
  toast("Order status updated.");
}

function renderUsers() {
  const newUsers = users.filter(user =>
    Date.now() - new Date(user.createdAt).getTime() <= 30 * 86400000
  ).length;
  const activeUsers = users.filter(user =>
    user.lastLogin && Date.now() - new Date(user.lastLogin).getTime() <= 30 * 86400000
  ).length;

  return `
    <div class="stats-grid">
      <div class="stat"><span>Total users</span><strong>${users.length}</strong></div>
      <div class="stat"><span>New users (30 days)</span><strong>${newUsers}</strong></div>
      <div class="stat"><span>Active users (30 days)</span><strong>${activeUsers}</strong></div>
    </div>
    <div class="panel"><h2>User management</h2>
      <input id="userSearch" placeholder="Search name, username or email..." oninput="filterUsers()">
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Registered</th><th>Last login</th></tr></thead>
        <tbody id="usersTableBody">${userRows(users)}</tbody>
      </table></div>
    </div>`;
}

function userRows(list) {
  if (!list.length) return `<tr><td colspan="5">No customers found.</td></tr>`;
  return list.map(user => `
    <tr>
      <td>${escapeHTML(user.name)}</td>
      <td>${escapeHTML(user.username)}</td>
      <td>${escapeHTML(user.email)}</td>
      <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
      <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}</td>
    </tr>
  `).join("");
}

function filterUsers() {
  const query = document.getElementById("userSearch").value.toLowerCase();
  const filtered = users.filter(user =>
    [user.name, user.username, user.email].some(value =>
      String(value).toLowerCase().includes(query)
    )
  );
  document.getElementById("usersTableBody").innerHTML = userRows(filtered);
}

function renderReceipts() {
  if (!orders.length) return `<div class="empty">No receipts yet.</div>`;

  return `<div class="panel"><h2>Receipts</h2><div class="table-wrap"><table>
    <thead><tr><th>Receipt / Order</th><th>Customer</th><th>Total</th><th>Date</th><th></th></tr></thead>
    <tbody>${orders.map(order => `
      <tr>
        <td>${escapeHTML(order.id)}</td>
        <td>${escapeHTML(order.customerName)}</td>
        <td>${money(order.total)}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td><button class="btn light" onclick="printReceipt('${order.id}')">Print receipt</button></td>
      </tr>
    `).join("")}</tbody>
  </table></div></div>`;
}

function printReceipt(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const receiptWindow = window.open("", "_blank", "width=700,height=800");
  if (!receiptWindow) {
    toast("Allow pop-ups to print receipts.");
    return;
  }

  const itemRows = order.items.map(item => `
    <tr><td>${escapeHTML(item.name)}</td><td>${item.quantity}</td>
    <td>${money(item.price)}</td><td>${money(item.subtotal)}</td></tr>
  `).join("");

  receiptWindow.document.write(`
    <!DOCTYPE html><html><head><title>Receipt ${escapeHTML(order.id)}</title>
    <style>
      body{font:14px Arial;padding:30px;color:#333}
      h1{text-align:center;color:#7b3f5b}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}
      .total{text-align:right;font-size:20px;font-weight:bold;margin-top:20px}
      .center{text-align:center}
    </style></head><body>
    <h1>${escapeHTML(settings.shopName)}</h1>
    <p class="center">${escapeHTML(settings.shopAddress)}<br>${escapeHTML(settings.shopPhone)}</p>
    <hr><h2>Official Receipt</h2>
    <p>Order: ${escapeHTML(order.id)}<br>
    Date: ${new Date(order.createdAt).toLocaleString()}<br>
    Customer: ${escapeHTML(order.customerName)}<br>
    Phone: ${escapeHTML(order.phone)}<br>
    Address: ${escapeHTML(order.address)}<br>
    Payment: ${escapeHTML(order.payment)}</p>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
    <tbody>${itemRows}</tbody></table>
    <div class="total">Total: ${money(order.total)}</div>
    <p class="center">Thank you for shopping with us! 🌸</p>
    <script>window.onload=()=>window.print();<\/script>
    </body></html>
  `);
  receiptWindow.document.close();
}

function renderReports() {
  const completed = orders.filter(order => order.status === "Completed");
  const revenue = completed.reduce((sum, order) => sum + order.total, 0);
  const units = orders.reduce((sum, order) =>
    sum + order.items.reduce((n, item) => n + item.quantity, 0), 0
  );

  return `
    <div class="stats-grid">
      <div class="stat"><span>Completed revenue</span><strong>${money(revenue)}</strong></div>
      <div class="stat"><span>Completed orders</span><strong>${completed.length}</strong></div>
      <div class="stat"><span>Units ordered</span><strong>${units}</strong></div>
      <div class="stat"><span>Registered customers</span><strong>${users.length}</strong></div>
    </div>
    <div class="panel"><h2>Sales report</h2>
      <p>Revenue is calculated from orders marked <strong>Completed</strong>.</p>
      <p>Total orders: <strong>${orders.length}</strong></p>
      <p>Cancelled orders: <strong>${orders.filter(o => o.status === "Cancelled").length}</strong></p>
      <button class="btn primary" onclick="window.print()">Print report</button>
    </div>`;
}

function renderSettings() {
  return `
    <div class="panel">
      <h2>Store settings</h2>
      <form id="settingsForm">
        <label>Shop name</label><input id="settingShopName" required value="${escapeHTML(settings.shopName)}">
        <label>Shop address</label><textarea id="settingShopAddress">${escapeHTML(settings.shopAddress)}</textarea>
        <label>Shop phone</label><input id="settingShopPhone" value="${escapeHTML(settings.shopPhone)}">
        <button class="btn primary" type="submit">Save shop settings</button>
      </form>
    </div>
    <div class="panel">
      <h2>Admin account settings</h2>
      <form id="adminForm">
        <label>Admin display name</label><input id="settingAdminName" required value="${escapeHTML(admin.name)}">
        <label>Admin username</label><input id="settingAdminUsername" required value="${escapeHTML(admin.username)}">
        <label>New admin password</label>
        <div class="password-field">
          <input id="settingAdminPassword" type="password" placeholder="Enter a new password" minlength="6">
          <button type="button" class="eye" onclick="togglePassword('settingAdminPassword',this)">Show</button>
        </div>
        <small class="muted">Leave the password blank to keep the current password.</small><br><br>
        <button class="btn primary" type="submit">Save admin settings</button>
      </form>
    </div>`;
}

document.addEventListener("submit", event => {
  if (event.target.id === "settingsForm") {
    event.preventDefault();
    settings.shopName = document.getElementById("settingShopName").value.trim();
    settings.shopAddress = document.getElementById("settingShopAddress").value.trim();
    settings.shopPhone = document.getElementById("settingShopPhone").value.trim();
    persistAll();
    toast("Shop settings saved.");
    showAdmin("settings");
  }

  if (event.target.id === "adminForm") {
    event.preventDefault();
    admin.name = document.getElementById("settingAdminName").value.trim();
    admin.username = document.getElementById("settingAdminUsername").value.trim();

    const newPassword = document.getElementById("settingAdminPassword").value;
    if (newPassword) {
      if (newPassword.length < 6) {
        toast("Password must be at least 6 characters.");
        return;
      }
      admin.password = newPassword;
    }

    currentUser.name = admin.name;
    currentUser.username = admin.username;
    persistAll();
    updateHeader();
    toast("Admin settings saved.");
    showAdmin("settings");
  }
});

/* STARTUP */
document.getElementById("year").textContent = new Date().getFullYear();
updateHeader();
showOnly("authPage");
