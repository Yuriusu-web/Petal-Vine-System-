
"use strict";

/* PETAL & VINE - STORE DATA */

const KEYS = {
  products:"pv_products_v8",
  users:"pv_users_v8",
  orders:"pv_orders_v8",
  admin:"pv_admin_v8",
  settings:"pv_settings_v8"
};

const starterProducts = [
  ["Classic Rose Bouquet","Fresh red roses for a timeless gift.",850,20,"🌹"],
  ["Pink Romance","Soft pink roses wrapped with care.",950,18,"💐"],
  ["Sunflower Joy","Bright sunflowers to make someone smile.",650,15,"🌻"],
  ["White Elegance","Elegant white blooms for special moments.",1100,12,"🤍"],
  ["Tulip Dreams","A charming bunch of colorful tulips.",1200,10,"🌷"],
  ["Lavender Love","A calming lavender-inspired arrangement.",780,14,"🪻"],
  ["Pastel Garden","A soft mix of pastel seasonal flowers.",1350,10,"🌸"],
  ["Baby's Breath","Delicate blooms for a sweet gift.",550,25,"🤍"],
  ["Golden Sunshine","A cheerful yellow flower arrangement.",900,12,"🌼"],
  ["Orchid Grace","A graceful orchid arrangement.",1500,8,"🌺"],
  ["Peach Perfect","Warm peach tones in a lovely bouquet.",1050,10,"🧡"],
  ["Forever Love","A romantic arrangement for anniversaries.",1800,7,"❤️"],
  ["Daisy Delight","Fresh and playful daisy bouquet.",700,20,"🌼"],
  ["Garden Party","A colorful garden-inspired bouquet.",1250,9,"💐"],
  ["Petal Surprise","A beautiful surprise flower arrangement.",1000,15,"🌷"]
];

function load(key,fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch(error) {
    console.error(error);
    return fallback;
  }
}

function save(key,value) {
  try {
    localStorage.setItem(key,JSON.stringify(value));
    return true;
  } catch(error) {
    console.error(error);
    toast("Unable to save. Try using a smaller image.");
    return false;
  }
}

function id(prefix="PV") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function money(value) {
  return "₱" + Number(value || 0).toLocaleString("en-PH",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g,char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

let products = load(KEYS.products,null);
let users = load(KEYS.users,[]);
let orders = load(KEYS.orders,[]);
let admin = load(KEYS.admin,{
  username:"admin",
  password:"Admin123",
  name:"Store Administrator"
});
let settings = load(KEYS.settings,{
  shopName:"Petal & Vine",
  shopAddress:"",
  shopPhone:"",
  about:"We believe flowers make every moment more meaningful. Our goal is to provide beautiful bouquets and thoughtful arrangements for every occasion."
});

if (!Array.isArray(products) || !products.length) {
  products = starterProducts.map((p,index) => ({
    id:"P"+(index+1),
    name:p[0],
    description:p[1],
    price:p[2],
    stock:p[3],
    emoji:p[4],
    image:""
  }));
}

if (!Array.isArray(users)) users = [];
if (!Array.isArray(orders)) orders = [];

save(KEYS.products,products);
save(KEYS.users,users);
save(KEYS.orders,orders);

let currentUser = null;
let cart = [];
let activeAdminPage = "overview";

function persist() {
  save(KEYS.products,products);
  save(KEYS.users,users);
  save(KEYS.orders,orders);
  save(KEYS.admin,admin);
  save(KEYS.settings,settings);
}

function toast(message) {
  const element = document.getElementById("toast");
  if (!element) return;
  element.textContent = message;
  element.style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.style.display = "none";
  },2600);
}

/* AUTHENTICATION */

function switchAuth(mode) {
  const login = mode === "login";

  document.getElementById("loginForm").classList.toggle("hidden",!login);
  document.getElementById("registerForm").classList.toggle("hidden",login);
  document.getElementById("loginTab").classList.toggle("active",login);
  document.getElementById("registerTab").classList.toggle("active",!login);
  document.getElementById("authMessage").textContent = "";
}

function updateHeader() {
  const loggedIn = Boolean(currentUser);
  const isAdmin = currentUser?.role === "admin";

  document.getElementById("welcomeText").textContent =
    loggedIn ? "Hello, " + currentUser.name : "Welcome!";

  ["shopButton","cartButton","transactionsButton","aboutButton"].forEach(buttonId => {
    document.getElementById(buttonId).classList.toggle("hidden",!loggedIn || isAdmin);
  });

  document.getElementById("logoutButton").classList.toggle("hidden",!loggedIn);

  document.getElementById("cartCount").textContent =
    cart.reduce((total,item) => total + item.quantity,0);
}

function showOnly(id) {
  document.querySelectorAll("main > section").forEach(section => {
    section.classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}

function login(user) {
  currentUser = user;
  updateHeader();

  if (user.role === "admin") {
    showOnly("adminPage");
    showAdmin("overview");
  } else {
    showPage("shop");
  }
}

document.getElementById("loginForm").addEventListener("submit",event => {
  event.preventDefault();

  const username = document.getElementById("loginUser").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("authMessage");

  if (
    username === admin.username.toLowerCase() &&
    password === admin.password
  ) {
    event.target.reset();
    login({
      id:"ADMIN",
      name:admin.name,
      username:admin.username,
      role:"admin"
    });
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

  user.lastLogin = new Date().toISOString();
  save(KEYS.users,users);
  event.target.reset();
  login(user);
});

document.getElementById("registerForm").addEventListener("submit",event => {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;
  const message = document.getElementById("authMessage");

  if (password.length < 6) {
    message.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (users.some(user => user.email.toLowerCase() === email)) {
    message.textContent = "This email is already registered.";
    return;
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    message.textContent = "This username is already taken.";
    return;
  }

  const user = {
    id:id("USER"),
    name,email,username,password,
    role:"customer",
    createdAt:new Date().toISOString(),
    lastLogin:new Date().toISOString()
  };

  users.push(user);

  if (!save(KEYS.users,users)) {
    users.pop();
    return;
  }

  event.target.reset();
  login(user);
  toast("Account created successfully!");
});

function logout() {
  currentUser = null;
  cart = [];
  updateHeader();
  showOnly("authPage");
  toast("Logged out.");
}

function showPage(page) {
  if (!currentUser) {
    showOnly("authPage");
    return;
  }

  if (currentUser.role === "admin") {
    showAdmin("overview");
    return;
  }

  const pages = {
    shop:"shopPage",
    cart:"cartPage",
    transactions:"transactionsPage",
    about:"aboutPage"
  };

  showOnly(pages[page] || "shopPage");

  if (page === "shop") renderShop();
  if (page === "cart") renderCart();
  if (page === "transactions") renderTransactions();
  if (page === "about") renderAbout();

  updateHeader();
}

/* CUSTOMER SHOP */

function scrollToProducts() {
  document.getElementById("productsSection").scrollIntoView({behavior:"smooth"});
}

function imageHTML(product) {
  return product.image
    ? `<img src="${product.image}" alt="${safe(product.name)}">`
    : `<span>${safe(product.emoji || "💐")}</span>`;
}

function renderShop() {
  const search = document.getElementById("shopSearch").value.toLowerCase();

  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(search) ||
    product.description.toLowerCase().includes(search)
  );

  const container = document.getElementById("products");

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-image">${imageHTML(product)}</div>
      <div class="product-info">
        <h3>${safe(product.name)}</h3>
        <p>${safe(product.description)}</p>
        <div class="price">${money(product.price)}</div>
        <div class="stock">
          ${product.stock > 0 ? product.stock + " available" : "Out of stock"}
        </div>
        <div class="product-bottom">
          <input
            id="quantity-${product.id}"
            type="number"
            min="1"
            max="${product.stock}"
            value="1"
            aria-label="Quantity"
            ${product.stock < 1 ? "disabled" : ""}
            style="width:75px"
          >
          <button class="btn light"
            onclick="addToCart('${product.id}')"
            ${product.stock < 1 ? "disabled" : ""}>
            Add to cart
          </button>
          <button class="btn primary"
            onclick="buyNow('${product.id}')"
            ${product.stock < 1 ? "disabled" : ""}>
            Buy now
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

document.getElementById("shopSearch").addEventListener("input",renderShop);

function selectedQuantity(id) {
  const field = document.getElementById("quantity-"+id);
  const quantity = Number(field?.value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    toast("Please select at least 1 item.");
    return 0;
  }

  return quantity;
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const quantity = selectedQuantity(productId);
  if (!quantity) return;

  const existing = cart.find(item => item.productId === productId);
  const currentQuantity = existing ? existing.quantity : 0;

  if (currentQuantity + quantity > product.stock) {
    toast("Only " + product.stock + " item(s) are available.");
    return;
  }

  if (existing) existing.quantity += quantity;
  else cart.push({productId,quantity});

  updateHeader();
  toast("Added to cart!");
}

function buyNow(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const quantity = selectedQuantity(productId);
  if (!quantity) return;

  const existing = cart.find(item => item.productId === productId);
  const currentQuantity = existing ? existing.quantity : 0;

  if (currentQuantity + quantity > product.stock) {
    toast("Not enough stock available.");
    return;
  }

  cart = [{productId,quantity}];
  updateHeader();
  showPage("cart");
}

/* CART AND CHECKOUT */

function renderCart() {
  const container = document.getElementById("cartContent");

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty">
        Your cart is empty.<br><br>
        <button class="btn primary" onclick="showPage('shop')">Continue shopping</button>
      </div>`;
    return;
  }

  let total = 0;

  const rows = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return "";

    const subtotal = product.price * item.quantity;
    total += subtotal;

    return `
      <div class="cart-row">
        <div>
          <h3>${safe(product.name)}</h3>
          <p>${money(product.price)} each</p>
          <strong>${money(subtotal)}</strong>
        </div>
        <div class="cart-controls">
          <button onclick="changeQuantity('${product.id}',-1)">−</button>
          <strong>${item.quantity}</strong>
          <button onclick="changeQuantity('${product.id}',1)">+</button>
          <button class="btn danger" onclick="removeCartItem('${product.id}')">Remove</button>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = `
    ${rows}
    <div class="cart-total">Total: ${money(total)}</div>
    <button class="btn light" onclick="showPage('shop')">Continue shopping</button>

    <div class="panel">
      <h2>Checkout</h2>
      <form id="checkoutForm">
        <div class="form-grid">
          <div>
            <label>Recipient name</label>
            <input id="deliveryName" required value="${safe(currentUser.name)}">
          </div>
          <div>
            <label>Phone number</label>
            <input id="deliveryPhone" required>
          </div>
          <div class="wide">
            <label>Delivery address</label>
            <textarea id="deliveryAddress" required rows="3"></textarea>
          </div>
          <div class="wide">
            <label>Payment method</label>
            <select id="paymentMethod">
              <option>Cash on Delivery</option>
              <option>Pay on pickup</option>
            </select>
          </div>
        </div>
        <button class="btn primary" type="submit">Confirm order — ${money(total)}</button>
      </form>
    </div>`;

  document.getElementById("checkoutForm").addEventListener("submit",checkout);
}

function changeQuantity(productId,change) {
  const item = cart.find(i => i.productId === productId);
  const product = products.find(p => p.id === productId);
  if (!item || !product) return;

  const next = item.quantity + change;

  if (next < 1) {
    toast("Quantity must be at least 1. Use Remove to delete it.");
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

function removeCartItem(productId) {
  cart = cart.filter(item => item.productId !== productId);
  updateHeader();
  renderCart();
}

function checkout(event) {
  event.preventDefault();

  for (const item of cart) {
    const product = products.find(p => p.id === item.productId);

    if (!product || item.quantity < 1 || item.quantity > product.stock) {
      toast("An item no longer has enough stock.");
      renderCart();
      return;
    }
  }

  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);

    return {
      productId:product.id,
      name:product.name,
      price:Number(product.price),
      quantity:item.quantity,
      subtotal:Number(product.price) * item.quantity
    };
  });

  const total = items.reduce((sum,item) => sum + item.subtotal,0);

  const order = {
    id:id("ORDER"),
    customerId:currentUser.id,
    customerName:document.getElementById("deliveryName").value.trim(),
    phone:document.getElementById("deliveryPhone").value.trim(),
    address:document.getElementById("deliveryAddress").value.trim(),
    payment:document.getElementById("paymentMethod").value,
    items,
    total,
    status:"Pending",
    createdAt:new Date().toISOString()
  };

  const oldProducts = products.map(p => ({...p}));

  items.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  });

  orders.unshift(order);

  if (!save(KEYS.products,products) || !save(KEYS.orders,orders)) {
    products = oldProducts;
    orders = orders.filter(o => o.id !== order.id);
    save(KEYS.products,products);
    save(KEYS.orders,orders);
    toast("Could not save your order.");
    return;
  }

  cart = [];
  updateHeader();
  showPage("transactions");
  toast("Order placed successfully!");
}

/* CUSTOMER TRANSACTIONS */

function renderTransactions() {
  const mine = orders.filter(order => order.customerId === currentUser.id);
  const container = document.getElementById("transactionsContent");

  if (!mine.length) {
    container.innerHTML = `
      <div class="empty">
        You have no transactions yet.<br><br>
        <button class="btn primary" onclick="showPage('shop')">Start shopping</button>
      </div>`;
    return;
  }

  container.innerHTML = mine.map(order => `
    <div class="order-card panel">
      <div class="section-heading" style="margin:0">
        <div>
          <h3>Transaction ${safe(order.id)}</h3>
          <small>${new Date(order.createdAt).toLocaleString()}</small>
        </div>
        <span class="badge">${safe(order.status)}</span>
      </div>
      <p>
        ${order.items.map(item =>
          `${safe(item.name)} × ${item.quantity} — ${money(item.subtotal)}`
        ).join("<br>")}
      </p>
      <p>Payment: ${safe(order.payment)}</p>
      <p>Delivery: ${safe(order.address)}</p>
      <strong>Total: ${money(order.total)}</strong>
    </div>
  `).join("");
}

/* ABOUT */

function renderAbout() {
  document.getElementById("aboutShopName").textContent = "About " + settings.shopName;
  document.getElementById("aboutDescription").textContent = settings.about;
  document.getElementById("aboutContact").textContent =
    [settings.shopAddress,settings.shopPhone].filter(Boolean).join(" • ") ||
    "Contact our shop for more information.";
}

/* ADMIN NAVIGATION */

function showAdmin(page) {
  if (!currentUser || currentUser.role !== "admin") {
    showOnly("authPage");
    return;
  }

  activeAdminPage = page;
  showOnly("adminPage");

  document.getElementById("adminWelcome").textContent =
    "Welcome, " + admin.name;

  const pages = {
    overview:adminOverview,
    inventory:adminInventory,
    orders:adminOrders,
    customers:adminCustomers,
    transactions:adminTransactions,
    settings:adminSettings
  };

  document.getElementById("adminContent").innerHTML =
    (pages[page] || adminOverview)();
}

/* ADMIN DASHBOARD */

function adminOverview() {
  const revenue = orders
    .filter(order => order.status === "Completed")
    .reduce((sum,order) => sum + order.total,0);

  return `
    <div class="stats-grid">
      <div class="stat"><span>Products</span><strong>${products.length}</strong></div>
      <div class="stat"><span>Customers</span><strong>${users.length}</strong></div>
      <div class="stat"><span>Orders</span><strong>${orders.length}</strong></div>
      <div class="stat"><span>Completed revenue</span><strong>${money(revenue)}</strong></div>
    </div>
    <div class="panel">
      <h2>Recent orders</h2>
      ${orders.length ? orders.slice(0,5).map(order => `
        <p>${safe(order.customerName)} — ${money(order.total)}
        <span class="badge">${safe(order.status)}</span></p>
      `).join("") : `<p>No orders yet.</p>`}
    </div>`;
}

/* FULL PRODUCT CRUD */

function adminInventory() {
  return `
    <div class="panel">
      <h2 id="productFormTitle">Create product</h2>

      <form id="productForm">
        <input type="hidden" id="editProductId">

        <div class="form-grid">
          <div>
            <label>Product name</label>
            <input id="productName" required>
          </div>

          <div>
            <label>Price (₱)</label>
            <input id="productPrice" type="number" min="0" step=".01" required>
          </div>

          <div>
            <label>Stock</label>
            <input id="productStock" type="number" min="0" step="1" required>
          </div>

          <div>
            <label>Emoji</label>
            <input id="productEmoji" value="💐">
          </div>

          <div class="wide">
            <label>Description</label>
            <textarea id="productDescription" required></textarea>
          </div>

          <div class="wide">
            <label>Product picture</label>
            <input id="productImage" type="file" accept="image/*">
            <small>Maximum image size: 900 KB.</small>
          </div>
        </div>

        <button class="btn primary" type="submit">Save product</button>
        <button class="btn light" type="button" onclick="resetProductForm()">Clear form</button>
      </form>
    </div>

    <div class="panel">
      <h2>Product inventory — Read / Update / Delete</h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td>${safe(product.emoji)} ${safe(product.name)}</td>
                <td>${money(product.price)}</td>
                <td>${product.stock}</td>
                <td class="actions">
                  <button class="light" onclick="editProduct('${product.id}')">Edit</button>
                  <button class="danger" onclick="deleteProduct('${product.id}')">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

document.addEventListener("submit",event => {
  if (event.target.id !== "productForm") return;

  event.preventDefault();

  const productId = document.getElementById("editProductId").value;
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const description = document.getElementById("productDescription").value.trim();
  const emoji = document.getElementById("productEmoji").value.trim() || "💐";
  const file = document.getElementById("productImage").files[0];

  if (!name || !description || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(stock) || stock < 0) {
    toast("Please enter valid product details.");
    return;
  }

  if (products.some(p =>
    p.id !== productId && p.name.toLowerCase() === name.toLowerCase()
  )) {
    toast("A product with this name already exists.");
    return;
  }

  function saveProduct(image) {
    const previous = products.map(p => ({...p}));

    if (productId) {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      Object.assign(product,{name,price,stock,description,emoji});
      if (image) product.image = image;
    } else {
      products.push({
        id:id("P"),
        name,price,stock,description,emoji,
        image:image || ""
      });
    }

    if (!save(KEYS.products,products)) {
      products = previous;
      return;
    }

    showAdmin("inventory");
    toast("Product saved successfully.");
  }

  if (file) {
    if (!file.type.startsWith("image/")) {
      toast("Please select an image.");
      return;
    }

    if (file.size > 900 * 1024) {
      toast("Image must be smaller than 900 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => saveProduct(reader.result);
    reader.onerror = () => toast("Could not read image.");
    reader.readAsDataURL(file);
  } else {
    saveProduct("");
  }
});

function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById("editProductId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productDescription").value = product.description;
  document.getElementById("productEmoji").value = product.emoji || "💐";
  document.getElementById("productFormTitle").textContent = "Update product";

  document.getElementById("productForm").scrollIntoView({behavior:"smooth"});
}

function resetProductForm() {
  const form = document.getElementById("productForm");
  if (!form) return;

  form.reset();
  document.getElementById("editProductId").value = "";
  document.getElementById("productFormTitle").textContent = "Create product";
}

function deleteProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!confirm("Delete " + product.name + "?")) return;

  products = products.filter(p => p.id !== productId);
  cart = cart.filter(item => item.productId !== productId);

  save(KEYS.products,products);
  updateHeader();
  showAdmin("inventory");
  toast("Product deleted.");
}

/* ADMIN ORDERS */

function adminOrders() {
  if (!orders.length) return `<div class="empty">No orders yet.</div>`;

  return `
    <div class="panel">
      <h2>Manage orders</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Update</th></tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${safe(order.id)}</td>
                <td>${safe(order.customerName)}</td>
                <td>${money(order.total)}</td>
                <td><span class="badge">${safe(order.status)}</span></td>
                <td>
                  <select onchange="updateOrder('${order.id}',this.value)">
                    ${["Pending","Processing","Ready","Completed","Cancelled"].map(status =>
                      `<option ${order.status === status ? "selected" : ""}>${status}</option>`
                    ).join("")}
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function updateOrder(orderId,newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const oldStatus = order.status;

  if (oldStatus === newStatus) return;

  if (oldStatus !== "Cancelled" && newStatus === "Cancelled") {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) product.stock += item.quantity;
    });
  }

  if (oldStatus === "Cancelled" && newStatus !== "Cancelled") {
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        toast("Not enough stock to reopen this order.");
        showAdmin("orders");
        return;
      }
    }

    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      product.stock -= item.quantity;
    });
  }

  order.status = newStatus;
  persist();
  showAdmin("orders");
  toast("Order updated.");
}

/* CUSTOMERS */

function adminCustomers() {
  return `
    <div class="panel">
      <h2>Registered customers</h2>
      <input id="customerSearch" placeholder="Search customers..." oninput="filterCustomers()">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Registered</th></tr></thead>
          <tbody id="customerRows">${customerRows(users)}</tbody>
        </table>
      </div>
    </div>`;
}

function customerRows(list) {
  if (!list.length) return `<tr><td colspan="4">No customers found.</td></tr>`;

  return list.map(user => `
    <tr>
      <td>${safe(user.name)}</td>
      <td>${safe(user.username)}</td>
      <td>${safe(user.email)}</td>
      <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
    </tr>
  `).join("");
}

function filterCustomers() {
  const query = document.getElementById("customerSearch").value.toLowerCase();

  const filtered = users.filter(user =>
    [user.name,user.username,user.email].some(value =>
      String(value).toLowerCase().includes(query)
    )
  );

  document.getElementById("customerRows").innerHTML = customerRows(filtered);
}

/* ADMIN TRANSACTIONS */

function adminTransactions() {
  if (!orders.length) return `<div class="empty">No transactions yet.</div>`;

  return `
    <div class="panel">
      <h2>All transactions</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Transaction</th><th>Customer</th><th>Date</th><th>Payment</th><th>Total</th><th>Receipt</th></tr></thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${safe(order.id)}</td>
                <td>${safe(order.customerName)}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${safe(order.payment)}</td>
                <td>${money(order.total)}</td>
                <td><button class="btn light" onclick="printReceipt('${order.id}')">Print</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function printReceipt(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const win = window.open("","_blank","width=700,height=800");

  if (!win) {
    toast("Please allow pop-ups to print receipts.");
    return;
  }

  const rows = order.items.map(item => `
    <tr>
      <td>${safe(item.name)}</td>
      <td>${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${safe(order.id)}</title>
      <style>
        body{font:14px Arial;padding:30px;color:#333}
        h1{text-align:center;color:#7b3f5b}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}
        .total{text-align:right;font-size:20px;font-weight:bold}
      </style>
    </head>
    <body>
      <h1>${safe(settings.shopName)}</h1>
      <p style="text-align:center">${safe(settings.shopAddress)}<br>${safe(settings.shopPhone)}</p>
      <hr>
      <h2>Official Receipt</h2>
      <p>Order: ${safe(order.id)}</p>
      <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
      <p>Customer: ${safe(order.customerName)}</p>
      <p>Phone: ${safe(order.phone)}</p>
      <p>Address: ${safe(order.address)}</p>
      <p>Payment: ${safe(order.payment)}</p>
      <table>
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="total">Total: ${money(order.total)}</p>
      <p style="text-align:center">Thank you for shopping with us!</p>
      <script>window.onload=function(){window.print();};<\/script>
    </body>
    </html>
  `);

  win.document.close();
}

/* ADMIN SETTINGS */

function adminSettings() {
  return `
    <div class="panel">
      <h2>Store information</h2>
      <form id="storeSettingsForm">
        <label>Shop name</label>
        <input id="settingShopName" value="${safe(settings.shopName)}" required>
        <label>Shop address</label>
        <textarea id="settingShopAddress">${safe(settings.shopAddress)}</textarea>
        <label>Shop phone</label>
        <input id="settingShopPhone" value="${safe(settings.shopPhone)}">
        <label>About the shop</label>
        <textarea id="settingAbout" rows="4">${safe(settings.about)}</textarea>
        <button class="btn primary">Save store information</button>
      </form>
    </div>

    <div class="panel">
      <h2>Admin account</h2>
      <form id="adminSettingsForm">
        <label>Admin display name</label>
        <input id="settingAdminName" value="${safe(admin.name)}" required>
        <label>Admin username</label>
        <input id="settingAdminUsername" value="${safe(admin.username)}" required>
        <label>New password</label>
        <input id="settingAdminPassword" type="password" minlength="6" placeholder="Leave blank to keep current password">
        <button class="btn primary">Save admin account</button>
      </form>
    </div>`;
}

document.addEventListener("submit",event => {
  if (event.target.id === "storeSettingsForm") {
    event.preventDefault();

    settings.shopName = document.getElementById("settingShopName").value.trim();
    settings.shopAddress = document.getElementById("settingShopAddress").value.trim();
    settings.shopPhone = document.getElementById("settingShopPhone").value.trim();
    settings.about = document.getElementById("settingAbout").value.trim();

    save(KEYS.settings,settings);
    showAdmin("settings");
    toast("Store information saved.");
  }

  if (event.target.id === "adminSettingsForm") {
    event.preventDefault();

    const name = document.getElementById("settingAdminName").value.trim();
    const username = document.getElementById("settingAdminUsername").value.trim();
    const password = document.getElementById("settingAdminPassword").value;

    if (!name || !username || (password && password.length < 6)) {
      toast("Please check your admin details.");
      return;
    }

    admin.name = name;
    admin.username = username;
    if (password) admin.password = password;

    currentUser.name = name;
    currentUser.username = username;

    save(KEYS.admin,admin);
    updateHeader();
    showAdmin("settings");
    toast("Admin account updated.");
  }
});

/* START APPLICATION */

document.getElementById("year").textContent = new Date().getFullYear();
updateHeader();
showOnly("authPage");
