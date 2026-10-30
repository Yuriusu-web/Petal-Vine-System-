/* =========================================
   PETAL & VINE - FLOWER SHOP SYSTEM
   Admin and Customer System
   Payment: COD only
========================================= */

const STORAGE = {
  users: "pv_users",
  products: "pv_products",
  orders: "pv_orders",
  receipts: "pv_receipts",
  settings: "pv_settings",
  session: "pv_session",
  carts: "pv_carts"
};

const defaultProducts = [
  {id:1,name:"Red Rose Bouquet",category:"Roses",price:850,stock:20,description:"Beautiful red roses for special moments.",image:"https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=600"},
  {id:2,name:"Pink Rose Bouquet",category:"Roses",price:900,stock:18,description:"Elegant pink roses.",image:"https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600"},
  {id:3,name:"White Roses",category:"Roses",price:950,stock:15,description:"Classic white roses.",image:"https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600"},
  {id:4,name:"Yellow Tulips",category:"Tulips",price:750,stock:14,description:"Bright and cheerful tulips.",image:"https://images.unsplash.com/photo-1528913775512-624d24b27b96?w=600"},
  {id:5,name:"Pink Tulips",category:"Tulips",price:780,stock:16,description:"Soft pink tulips.",image:"https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600"},
  {id:6,name:"Sunflower Bouquet",category:"Sunflowers",price:700,stock:12,description:"Sunny and beautiful sunflowers.",image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600"},
  {id:7,name:"Classic Sunflowers",category:"Sunflowers",price:650,stock:10,description:"A cheerful sunflower arrangement.",image:"https://images.unsplash.com/photo-1597848212624-e6e6e5c5f2a6?w=600"},
  {id:8,name:"Mixed Flower Bouquet",category:"Mixed Flowers",price:1100,stock:9,description:"A colorful mix of fresh flowers.",image:"https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=600"},
  {id:9,name:"Pastel Flower Bouquet",category:"Bouquets",price:1200,stock:8,description:"Soft pastel floral arrangement.",image:"https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600"},
  {id:10,name:"Luxury Rose Box",category:"Roses",price:1500,stock:7,description:"Premium roses in a gift box.",image:"https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600"},
  {id:11,name:"Birthday Bouquet",category:"Bouquets",price:1300,stock:11,description:"A lovely birthday flower gift.",image:"https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600"},
  {id:12,name:"Love and Romance",category:"Bouquets",price:1400,stock:6,description:"A romantic flower arrangement.",image:"https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600"},
  {id:13,name:"Garden Fresh Mix",category:"Mixed Flowers",price:1000,stock:13,description:"Fresh flowers inspired by the garden.",image:"https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=600"},
  {id:14,name:"Elegant White Bouquet",category:"Bouquets",price:1250,stock:5,description:"Elegant white floral arrangement.",image:"https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600"},
  {id:15,name:"Premium Flower Set",category:"Mixed Flowers",price:1800,stock:4,description:"A premium collection of fresh flowers.",image:"https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600"}
];

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
let products = read(STORAGE.products, null) || defaultProducts;
let orders = read(STORAGE.orders, []);
let receipts = read(STORAGE.receipts, []);
let settings = read(STORAGE.settings, {
  adminName: "Administrator",
  adminUsername: "admin",
  adminPassword: "admin123",
  shopName: "Petal & Vine"
});
let carts = read(STORAGE.carts, {});

let currentUser = null;

/* KEEP EXISTING ADMIN ACCOUNT.
   The demo indicator is not displayed anywhere.
*/
function initialize() {
  if (!users.some(user => user.role === "admin")) {
    users.push({
      id: "admin-account",
      name: settings.adminName || "Administrator",
      username: settings.adminUsername || "admin",
      email: "admin@petalandvine.local",
      password: settings.adminPassword || "admin123",
      role: "admin"
    });
    save(STORAGE.users, users);
  }

  save(STORAGE.products, products);
  save(STORAGE.settings, settings);

  document.getElementById("shopTitle").textContent = settings.shopName;
  showAuth("login");
}

initialize();

/* AUTHENTICATION */

function showAuth(mode) {
  document.getElementById("loginForm").classList.toggle("hidden", mode !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", mode !== "register");
  document.getElementById("loginTab").classList.toggle("active", mode === "login");
  document.getElementById("registerTab").classList.toggle("active", mode === "register");
  document.getElementById("loginMessage").textContent = "";
  document.getElementById("registerMessage").textContent = "";
}

document.getElementById("registerForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;

  const message = document.getElementById("registerMessage");

  if (password !== confirm) {
    message.textContent = "Passwords do not match.";
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase() ||
    user.email.toLowerCase() === email
  )) {
    message.textContent = "Username or email is already registered.";
    return;
  }

  users.push({
    id: "user-" + Date.now(),
    name,
    username,
    email,
    password,
    role: "customer"
  });

  save(STORAGE.users, users);

  this.reset();
  showAuth("login");
  document.getElementById("loginMessage").style.color = "#278653";
  document.getElementById("loginMessage").textContent =
    "Account created successfully. Please log in.";
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const username = document.getElementById("loginUsername").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("loginMessage");

  const user = users.find(item =>
    (item.username.toLowerCase() === username ||
     item.email.toLowerCase() === username) &&
    item.password === password
  );

  if (!user) {
    message.style.color = "#c54b5c";
    message.textContent = "Incorrect username or password.";
    return;
  }

  currentUser = user;
  save(STORAGE.session, {id:user.id});
  openApplication();
});

function openApplication() {
  document.getElementById("authPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  document.getElementById("welcomeUser").textContent = currentUser.name;
  document.getElementById("roleLabel").textContent =
    currentUser.role === "admin" ? "Administrator" : "Customer";

  const isAdmin = currentUser.role === "admin";

  document.getElementById("adminNavigation").classList.toggle("hidden", !isAdmin);
  document.getElementById("customerNavigation").classList.toggle("hidden", isAdmin);

  refreshAll();
  navigate(isAdmin ? "dashboard" : "shop");
}

function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE.session);
  document.getElementById("app").classList.add("hidden");
  document.getElementById("authPage").classList.remove("hidden");
  document.getElementById("loginForm").reset();
  showAuth("login");
}

/* RESTORE SESSION */

const savedSession = read(STORAGE.session, null);
if (savedSession) {
  const savedUser = users.find(user => user.id === savedSession.id);
  if (savedUser) {
    currentUser = savedUser;
    openApplication();
  }
}

/* NAVIGATION */

function navigate(page, button) {
  if (!currentUser) return;

  const adminPages = [
    "dashboard", "products", "inventory", "adminOrders",
    "users", "transactions", "receipts", "settings"
  ];

  const customerPages = [
    "shop", "cart", "myOrders", "myReceipts", "profile"
  ];

  if (currentUser.role === "admin" && !adminPages.includes(page)) return;
  if (currentUser.role === "customer" && !customerPages.includes(page)) return;

  document.querySelectorAll(".page").forEach(section =>
    section.classList.add("hidden")
  );

  const target = document.getElementById(page);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  if (button) button.classList.add("active");

  if (page === "dashboard") renderDashboard();
  if (page === "products") renderAdminProducts();
  if (page === "inventory") renderInventory();
  if (page === "adminOrders") renderAdminOrders();
  if (page === "users") renderUsers();
  if (page === "transactions") renderTransactions();
  if (page === "receipts") renderAdminReceipts();
  if (page === "settings") renderSettings();
  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "myOrders") renderMyOrders();
  if (page === "myReceipts") renderMyReceipts();
  if (page === "profile") renderProfile();
}

function refreshAll() {
  updateCartCount();
  if (currentUser?.role === "admin") renderDashboard();
}

/* UTILITIES */

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  })[character]);
}

function dateText(value) {
  return new Date(value).toLocaleString("en-PH");
}

function emptyRow(columns, text) {
  return `<tr><td colspan="${columns}" style="text-align:center;padding:25px;color:#887780">${text}</td></tr>`;
}

function updateCartCount() {
  if (!currentUser || currentUser.role !== "customer") return;

  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

function getCart() {
  return carts[currentUser.id] || [];
}

function setCart(cart) {
  carts[currentUser.id] = cart;
  save(STORAGE.carts, carts);
  updateCartCount();
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

/* ADMIN DASHBOARD */

function renderDashboard() {
  if (currentUser?.role !== "admin") return;

  const customers = users.filter(user => user.role === "customer");
  const sales = orders
    .filter(order => order.status === "Completed")
    .reduce((sum, order) => sum + order.total, 0);

  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statUsers").textContent = customers.length;
  document.getElementById("statOrders").textContent = orders.length;
  document.getElementById("statSales").textContent = money(sales);
  document.getElementById("statPending").textContent =
    orders.filter(order => order.status === "Pending").length;
  document.getElementById("statLowStock").textContent =
    products.filter(product => product.stock <= 5).length;

  const recent = [...orders].reverse().slice(0, 5);

  document.getElementById("recentOrders").innerHTML = recent.length
    ? `<div class="table-responsive"><table>
      <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>${recent.map(order => `
        <tr>
          <td>${safe(order.id)}</td>
          <td>${safe(order.customerName)}</td>
          <td>${money(order.total)}</td>
          <td><span class="status ${safe(order.status)}">${safe(order.status)}</span></td>
        </tr>`).join("")}
      </tbody></table></div>`
    : "<p>No orders yet.</p>";
}

/* ADMIN PRODUCT MANAGEMENT */

function openProductForm(id = null) {
  document.getElementById("productForm").classList.remove("hidden");
  document.getElementById("saveProductForm").reset();
  document.getElementById("productId").value = "";

  if (id !== null) {
    const product = products.find(item => item.id === Number(id));
    if (!product) return;

    document.getElementById("productFormTitle").textContent = "Edit Product";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productDescription").value = product.description || "";
  } else {
    document.getElementById("productFormTitle").textContent = "Add New Product";
  }

  document.getElementById("productForm").scrollIntoView({behavior:"smooth"});
}

function closeProductForm() {
  document.getElementById("productForm").classList.add("hidden");
}

document.getElementById("saveProductForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  if (currentUser?.role !== "admin") return;

  const id = document.getElementById("productId").value;
  const name = document.getElementById("productName").value.trim();
  const category = document.getElementById("productCategory").value;
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const description = document.getElementById("productDescription").value.trim();
  const file = document.getElementById("productImage").files[0];

  if (!name || price <= 0 || stock < 0 || !Number.isFinite(price) || !Number.isFinite(stock)) {
    alert("Please enter valid product details.");
    return;
  }

  const duplicate = products.some(product =>
    product.name.toLowerCase() === name.toLowerCase() &&
    product.id !== Number(id)
  );

  if (duplicate) {
    alert("A product with this name already exists.");
    return;
  }

  let image = "";

  if (file) {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image smaller than 2 MB.");
      return;
    }

    image = await fileToDataURL(file);
  }

  if (id) {
    const index = products.findIndex(product => product.id === Number(id));
    if (index < 0) return;

    products[index] = {
      ...products[index],
      name, category, price, stock, description,
      image: image || products[index].image
    };
  } else {
    products.push({
      id: Date.now(),
      name, category, price, stock, description,
      image: image || ""
    });
  }

  save(STORAGE.products, products);
  closeProductForm();
  renderAdminProducts();
  renderInventory();
  renderDashboard();
  alert("Product saved successfully.");
});

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAdminProducts() {
  const tbody = document.getElementById("adminProductList");

  tbody.innerHTML = products.length ? products.map(product => `
    <tr>
      <td><img src="${safe(product.image || "https://placehold.co/100x100?text=Flower")}" alt=""></td>
      <td>${safe(product.name)}</td>
      <td>${safe(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>${product.stock}</td>
      <td>
        <button class="action-btn edit-btn" onclick="openProductForm(${product.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
      </td>
    </tr>
  `).join("") : emptyRow(6, "No products available.");
}

function deleteProduct(id) {
  if (currentUser?.role !== "admin") return;

  const product = products.find(item => item.id === Number(id));
  if (!product) return;

  if (!confirm(`Delete ${product.name}?`)) return;

  products = products.filter(item => item.id !== Number(id));
  save(STORAGE.products, products);
  renderAdminProducts();
  renderInventory();
  renderDashboard();
}

/* INVENTORY */

function renderInventory() {
  document.getElementById("inventoryList").innerHTML = products.length
    ? products.map(product => {
      const status = product.stock <= 0
        ? "Out of stock"
        : product.stock <= 5
          ? "Low stock"
          : "In stock";

      return `<tr>
        <td>${safe(product.name)}</td>
        <td>${safe(product.category)}</td>
        <td>${product.stock}</td>
        <td>${status}</td>
      </tr>`;
    }).join("")
    : emptyRow(4, "No inventory available.");
}

/* CUSTOMER SHOP */

function renderShop() {
  const search = (document.getElementById("shopSearch")?.value || "").toLowerCase();
  const category = document.getElementById("shopCategory")?.value || "";

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) &&
    (!category || product.category === category)
  );

  document.getElementById("shopProducts").innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card">
        <img src="${safe(product.image || "https://placehold.co/600x400?text=Flower")}" alt="${safe(product.name)}">
        <div class="product-info">
          <h3>${safe(product.name)}</h3>
          <p>${safe(product.description || "")}</p>
          <div class="product-price">${money(product.price)}</div>
          <div class="stock-label">${product.stock > 0 ? product.stock + " available" : "Out of stock"}</div>
          <div class="product-buy">
            <input id="quantity-${product.id}" type="number" min="1" max="${product.stock}" value="1" ${product.stock <= 0 ? "disabled" : ""}>
            <button class="primary-btn" onclick="addToCart(${product.id})" ${product.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
          </div>
        </div>
      </article>
    `).join("")
    : "<p>No matching products found.</p>";
}

function addToCart(id) {
  if (currentUser?.role !== "customer") return;

  const product = products.find(item => item.id === Number(id));
  const quantity = Number(document.getElementById(`quantity-${id}`).value);

  if (!product || !Number.isInteger(quantity) || quantity < 1) {
    alert("Please enter a valid quantity.");
    return;
  }

  if (quantity > product.stock) {
    alert("The requested quantity is greater than the available stock.");
    return;
  }

  const cart = getCart();
  const existing = cart.find(item => item.productId === product.id);
  const newQuantity = (existing?.quantity || 0) + quantity;

  if (newQuantity > product.stock) {
    alert("Your cart quantity exceeds available stock.");
    return;
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.push({productId:product.id, quantity});
  }

  setCart(cart);
  alert("Product added to cart.");
}

/* CART */

function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cartContent");

  if (!cart.length) {
    container.innerHTML = "<p>Your cart is empty. Visit the shop to choose flowers.</p>";
    return;
  }

  let total = 0;

  const rows = cart.map(item => {
    const product = products.find(product => product.id === item.productId);
    if (!product) return "";

    const subtotal = product.price * item.quantity;
    total += subtotal;

    return `
      <div class="cart-row">
        <img src="${safe(product.image || "https://placehold.co/100x100?text=Flower")}" alt="">
        <div><strong>${safe(product.name)}</strong><br><small>${money(product.price)} each</small></div>
        <input type="number" min="1" max="${product.stock}" value="${item.quantity}" onchange="changeCartQuantity(${product.id},this.value)">
        <strong>${money(subtotal)}</strong>
        <button class="action-btn delete-btn" onclick="removeFromCart(${product.id})">Remove</button>
      </div>`;
  }).join("");

  container.innerHTML = `
    ${rows}
    <div class="cart-total">
      <h2>Total: ${money(total)}</h2>
      <p>Payment: Cash on Delivery (COD)</p>
      <button class="primary-btn" onclick="openCheckout()">Proceed to Checkout</button>
    </div>`;
}

function changeCartQuantity(id, value) {
  const quantity = Number(value);
  const product = products.find(item => item.id === Number(id));

  if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    alert("Please enter a valid quantity within available stock.");
    renderCart();
    return;
  }

  const cart = getCart();
  const item = cart.find(item => item.productId === Number(id));
  if (item) item.quantity = quantity;

  setCart(cart);
  renderCart();
}

function removeFromCart(id) {
  setCart(getCart().filter(item => item.productId !== Number(id)));
  renderCart();
}

/* CHECKOUT */

function openCheckout() {
  if (currentUser?.role !== "customer") return;

  const cart = getCart();
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  let total = 0;

  const summary = cart.map(item => {
    const product = products.find(product => product.id === item.productId);
    if (!product) return "";

    total += product.price * item.quantity;
    return `<p>${safe(product.name)} × ${item.quantity} — ${money(product.price * item.quantity)}</p>`;
  }).join("");

  document.getElementById("checkoutSummary").innerHTML =
    `${summary}<hr><h3>Total: ${money(total)}</h3>`;

  document.getElementById("checkoutModal").classList.remove("hidden");
}

document.getElementById("checkoutForm").addEventListener("submit", function(event) {
  event.preventDefault();
  if (currentUser?.role !== "customer") return;

  const address = document.getElementById("deliveryAddress").value.trim();
  const phone = document.getElementById("deliveryPhone").value.trim();
  const cart = getCart();

  if (!address || !phone || !cart.length) {
    alert("Please complete your delivery details.");
    return;
  }

  for (const item of cart) {
    const product = products.find(product => product.id === item.productId);
    if (!product || product.stock < item.quantity) {
      alert("One or more products no longer have enough stock. Please review your cart.");
      renderCart();
      closeModal("checkoutModal");
      return;
    }
  }

  const orderItems = cart.map(item => {
    const product = products.find(product => product.id === item.productId);
    product.stock -= item.quantity;

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderId = "ORD-" + Date.now();

  const order = {
    id: orderId,
    userId: currentUser.id,
    customerName: currentUser.name,
    customerEmail: currentUser.email,
    phone,
    address,
    items: orderItems,
    total,
    payment: "Cash on Delivery (COD)",
    status: "Pending",
    date: new Date().toISOString()
  };

  orders.push(order);

  const receipt = {
    id: "REC-" + Date.now(),
    orderId,
    userId: currentUser.id,
    customerName: currentUser.name,
    items: orderItems,
    total,
    payment: "Cash on Delivery (COD)",
    date: order.date
  };

  receipts.push(receipt);

  setCart([]);
  save(STORAGE.products, products);
  save(STORAGE.orders, orders);
  save(STORAGE.receipts, receipts);

  closeModal("checkoutModal");
  this.reset();

  alert("Your order has been placed successfully!");

  renderMyOrders();
  renderMyReceipts();
  renderInventory();
  renderDashboard();
  navigate("myOrders");
});

/* ADMIN ORDER MANAGEMENT */

function renderAdminOrders() {
  document.getElementById("adminOrderList").innerHTML = orders.length
    ? [...orders].reverse().map(order => `
      <tr>
        <td>${safe(order.id)}</td>
        <td>${safe(order.customerName)}</td>
        <td>${dateText(order.date)}</td>
        <td>${money(order.total)}</td>
        <td>${safe(order.payment)}</td>
        <td><span class="status ${safe(order.status)}">${safe(order.status)}</span></td>
        <td>
          <button class="action-btn view-btn" onclick="viewOrder('${order.id}')">View</button>
          <select onchange="updateOrderStatus('${order.id}',this.value)">
            ${["Pending","Processing","Completed","Cancelled"].map(status =>
              `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
            ).join("")}
          </select>
        </td>
      </tr>
    `).join("")
    : emptyRow(7, "No customer orders yet.");
}

function updateOrderStatus(id, status) {
  if (currentUser?.role !== "admin") return;

  const order = orders.find(item => item.id === id);
  if (!order) return;

  order.status = status;
  save(STORAGE.orders, orders);

  renderAdminOrders();
  renderDashboard();
  renderTransactions();
  alert("Order status updated.");
}

function viewOrder(id) {
  const order = orders.find(item => item.id === id);
  if (!order) return;

  const items = order.items.map(item =>
    `<tr><td>${safe(item.name)}</td><td>${item.quantity}</td><td>${money(item.price)}</td><td>${money(item.subtotal)}</td></tr>`
  ).join("");

  document.getElementById("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>${safe(settings.shopName)}</h2>
      <h3>Order Details</h3>
      <p><strong>Order:</strong> ${safe(order.id)}</p>
      <p><strong>Customer:</strong> ${safe(order.customerName)}</p>
      <p><strong>Address:</strong> ${safe(order.address)}</p>
      <p><strong>Phone:</strong> ${safe(order.phone)}</p>
      <p><strong>Date:</strong> ${dateText(order.date)}</p>
      <p><strong>Status:</strong> ${safe(order.status)}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
      <tbody>${items}</tbody></table>
      <h3>Total: ${money(order.total)}</h3>
      <p><strong>Payment:</strong> ${safe(order.payment)}</p>
    </div>`;

  document.getElementById("receiptModal").classList.remove("hidden");
}

/* USER MANAGEMENT */

function renderUsers() {
  const customers = users.filter(user => user.role === "customer");

  document.getElementById("userList").innerHTML = customers.length
    ? customers.map(user => `
      <tr>
        <td>${safe(user.name)}</td>
        <td>${safe(user.username)}</td>
        <td>${safe(user.email)}</td>
        <td>Customer</td>
        <td><button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">Delete</button></td>
      </tr>
    `).join("")
    : emptyRow(5, "No registered customers.");
}

function deleteUser(id) {
  if (currentUser?.role !== "admin") return;

  const user = users.find(item => item.id === id);
  if (!user || user.role === "admin") return;

  if (orders.some(order => order.userId === id)) {
    alert("This customer has order records. The account cannot be deleted while order history is attached.");
    return;
  }

  if (!confirm(`Delete customer ${user.name}?`)) return;

  users = users.filter(item => item.id !== id);
  delete carts[id];

  save(STORAGE.users, users);
  save(STORAGE.carts, carts);
  renderUsers();
  renderDashboard();
}

/* TRANSACTIONS */

function renderTransactions() {
  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  document.getElementById("transactionList").innerHTML = completed.length
    ? completed.map(order => `
      <tr>
        <td>TR-${safe(order.id)}</td>
        <td>${safe(order.id)}</td>
        <td>${safe(order.customerName)}</td>
        <td>${dateText(order.date)}</td>
        <td>${money(order.total)}</td>
        <td>${safe(order.payment)}</td>
      </tr>
    `).join("")
    : emptyRow(6, "No completed transactions yet.");
}

/* RECEIPTS */

function renderAdminReceipts() {
  document.getElementById("adminReceiptList").innerHTML = receipts.length
    ? [...receipts].reverse().map(receipt => `
      <tr>
        <td>${safe(receipt.id)}</td>
        <td>${safe(receipt.orderId)}</td>
        <td>${safe(receipt.customerName)}</td>
        <td>${money(receipt.total)}</td>
        <td>${dateText(receipt.date)}</td>
        <td><button class="action-btn view-btn" onclick="showReceipt('${receipt.id}')">View / Print</button></td>
      </tr>
    `).join("")
    : emptyRow(6, "No receipts available.");
}

function renderMyReceipts() {
  const mine = receipts.filter(receipt => receipt.userId === currentUser.id);

  document.getElementById("myReceiptList").innerHTML = mine.length
    ? [...mine].reverse().map(receipt => `
      <tr>
        <td>${safe(receipt.id)}</td>
        <td>${safe(receipt.orderId)}</td>
        <td>${money(receipt.total)}</td>
        <td>${dateText(receipt.date)}</td>
        <td><button class="action-btn view-btn" onclick="showReceipt('${receipt.id}')">View / Print</button></td>
      </tr>
    `).join("")
    : emptyRow(5, "You do not have any receipts yet.");
}

function showReceipt(id) {
  const receipt = receipts.find(item => item.id === id);
  if (!receipt) return;

  if (currentUser.role === "customer" && receipt.userId !== currentUser.id) {
    alert("You cannot view another customer's receipt.");
    return;
  }

  const rows = receipt.items.map(item => `
    <tr>
      <td>${safe(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  document.getElementById("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>${safe(settings.shopName)}</h2>
      <h3>Purchase Receipt</h3>
      <p style="text-align:center">Thank you for shopping with us!</p>
      <hr>
      <p><strong>Receipt ID:</strong> ${safe(receipt.id)}</p>
      <p><strong>Order ID:</strong> ${safe(receipt.orderId)}</p>
      <p><strong>Customer:</strong> ${safe(receipt.customerName)}</p>
      <p><strong>Date:</strong> ${dateText(receipt.date)}</p>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h3>Total: ${money(receipt.total)}</h3>
      <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
      <p style="text-align:center;margin-top:25px">Thank you for choosing ${safe(settings.shopName)}!</p>
    </div>
  `;

  document.getElementById("receiptModal").classList.remove("hidden");
}

/* CUSTOMER ORDERS */

function renderMyOrders() {
  const mine = orders.filter(order => order.userId === currentUser.id);

  document.getElementById("myOrderList").innerHTML = mine.length
    ? [...mine].reverse().map(order => `
      <tr>
        <td>${safe(order.id)}</td>
        <td>${dateText(order.date)}</td>
        <td>${order.items.reduce((sum,item) => sum + item.quantity,0)} item(s)</td>
        <td>${money(order.total)}</td>
        <td><span class="status ${safe(order.status)}">${safe(order.status)}</span></td>
        <td><button class="action-btn view-btn" onclick="viewCustomerOrder('${order.id}')">View</button></td>
      </tr>
    `).join("")
    : emptyRow(6, "You have not placed any orders yet.");
}

function viewCustomerOrder(id) {
  const order = orders.find(item =>
    item.id === id && item.userId === currentUser.id
  );

  if (!order) return;

  const rows = order.items.map(item => `
    <tr>
      <td>${safe(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  document.getElementById("receiptContent").innerHTML = `
    <div class="receipt">
      <h2>${safe(settings.shopName)}</h2>
      <h3>My Order</h3>
      <p><strong>Order ID:</strong> ${safe(order.id)}</p>
      <p><strong>Date:</strong> ${dateText(order.date)}</p>
      <p><strong>Status:</strong> ${safe(order.status)}</p>
      <p><strong>Delivery Address:</strong> ${safe(order.address)}</p>
      <p><strong>Contact:</strong> ${safe(order.phone)}</p>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h3>Total: ${money(order.total)}</h3>
      <p>Payment: Cash on Delivery (COD)</p>
    </div>
  `;

  document.getElementById("receiptModal").classList.remove("hidden");
}

/* ADMIN SETTINGS */

function renderSettings() {
  document.getElementById("settingAdminName").value = settings.adminName;
  document.getElementById("settingAdminUsername").value = settings.adminUsername;
  document.getElementById("settingShopName").value = settings.shopName;
  document.getElementById("settingAdminPassword").value = "";
}

document.getElementById("settingsForm").addEventListener("submit", function(event) {
  event.preventDefault();
  if (currentUser?.role !== "admin") return;

  const name = document.getElementById("settingAdminName").value.trim();
  const username = document.getElementById("settingAdminUsername").value.trim();
  const password = document.getElementById("settingAdminPassword").value;
  const shopName = document.getElementById("settingShopName").value.trim();

  if (!name || !username || !shopName) {
    alert("Please complete the required fields.");
    return;
  }

  const duplicate = users.some(user =>
    user.role !== "admin" &&
    user.username.toLowerCase() === username.toLowerCase()
  );

  if (duplicate) {
    alert("That username is already used by another account.");
    return;
  }

  settings.adminName = name;
  settings.adminUsername = username;
  settings.shopName = shopName;

  if (password) settings.adminPassword = password;

  const admin = users.find(user => user.role === "admin");
  if (admin) {
    admin.name = name;
    admin.username = username;
    admin.password = settings.adminPassword;
  }

  currentUser = admin;

  save(STORAGE.settings, settings);
  save(STORAGE.users, users);

  document.getElementById("shopTitle").textContent = shopName;
  document.getElementById("welcomeUser").textContent = name;
  document.getElementById("settingsMessage").textContent = "Settings updated successfully.";

  alert("Admin settings saved.");
});

/* CUSTOMER PROFILE */

function renderProfile() {
  document.getElementById("profileName").value = currentUser.name;
  document.getElementById("profileUsername").value = currentUser.username;
  document.getElementById("profileEmail").value = currentUser.email;
  document.getElementById("profilePassword").value = "";
}

document.getElementById("profileForm").addEventListener("submit", function(event) {
  event.preventDefault();
  if (currentUser?.role !== "customer") return;

  const name = document.getElementById("profileName").value.trim();
  const username = document.getElementById("profileUsername").value.trim();
  const email = document.getElementById("profileEmail").value.trim().toLowerCase();
  const password = document.getElementById("profilePassword").value;

  if (!name || !username || !email) {
    alert("Please complete all required fields.");
    return;
  }

  const duplicate = users.some(user =>
    user.id !== currentUser.id &&
    (user.username.toLowerCase() === username.toLowerCase() ||
     user.email.toLowerCase() === email)
  );

  if (duplicate) {
    alert("That username or email is already being used.");
    return;
  }

  const user = users.find(item => item.id === currentUser.id);
  if (!user) return;

  user.name = name;
  user.username = username;
  user.email = email;

  if (password) user.password = password;

  currentUser = user;

  save(STORAGE.users, users);

  document.getElementById("welcomeUser").textContent = name;
  document.getElementById("profileMessage").textContent =
    "Your profile has been updated successfully.";
});

/* END OF PETAL & VINE SYSTEM */
