(() => {
  "use strict";

  // STORAGE KEYS
  const KEYS = {
    products: "pv_products_v8",
    users: "pv_users_v8",
    orders: "pv_orders_v8",
    admin: "pv_admin_v8",
    settings: "pv_settings_v8",
    session: "pv_session_v8"
  };

  // 15 STARTER PRODUCTS
  const starterProducts = [
    ["p01","Classic Red Roses","A timeless bouquet of fresh red roses.",1299,"Roses",18,"🌹"],
    ["p02","Blush Pink Bouquet","Soft pink blooms wrapped with care.",1099,"Bouquets",14,"🌸"],
    ["p03","Sunshine Sunflowers","Bright sunflowers to make their day.",899,"Sunflowers",16,"🌻"],
    ["p04","White Elegance","Elegant white flowers for every occasion.",1199,"Bouquets",12,"🤍"],
    ["p05","Pastel Garden","A dreamy mix of pastel seasonal flowers.",1499,"Mixed flowers",10,"💐"],
    ["p06","Tulip Love","Beautiful tulips in a cheerful arrangement.",1399,"Tulips",11,"🌷"],
    ["p07","Purple Passion","Purple blooms with a graceful finish.",1250,"Mixed flowers",9,"💜"],
    ["p08","Daisy Delight","Fresh daisies with a light, happy feel.",799,"Daisies",20,"🌼"],
    ["p09","Peach Romance","Warm peach roses and delicate fillers.",1350,"Roses",8,"🧡"],
    ["p10","Lavender Dreams","Soft lavender tones in a lovely bouquet.",1150,"Bouquets",13,"🪻"],
    ["p11","Garden Mix","A colorful mix inspired by a garden.",999,"Mixed flowers",17,"🌺"],
    ["p12","Baby's Breath Bundle","Cloud-like baby's breath, simply wrapped.",750,"Dried & fillers",22,"🤍"],
    ["p13","Premium Rose Box","Premium roses presented in a gift box.",1899,"Gift boxes",6,"🌹"],
    ["p14","Orchid Grace","A refined orchid arrangement.",1699,"Orchids",7,"🪷"],
    ["p15","Sweet Surprise","A sweet seasonal bouquet for someone special.",950,"Bouquets",15,"💐"]
  ].map(p => ({
    id: p[0],
    name: p[1],
    description: p[2],
    price: p[3],
    category: p[4],
    stock: p[5],
    emoji: p[6],
    image: ""
  }));

  // LOAD AND SAVE DATA
  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.warn("Could not read saved data:", key, error);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      toast("Storage is full. Try using a smaller product image.");
      return false;
    }
  }

  const legacyProducts = load("pv_products_v4", null);

  let products = load(
    KEYS.products,
    Array.isArray(legacyProducts) ? legacyProducts : starterProducts
  );

  let users = load(KEYS.users, load("pv_users_v4", []));
  let orders = load(KEYS.orders, load("pv_orders_v4", []));

  let admin = load(
    KEYS.admin,
    load("pv_admin_v4", null) || {
      username: "admin",
      password: "",
      name: "Administrator"
    }
  );

  let settings = load(KEYS.settings, {
    storeName: "Petal & Vine"
  });

  let currentUser = null;
  let cart = {};
  let editingImage = "";
  let toastTimer;

  const $ = id => document.getElementById(id);

  const money = value =>
    "₱" + Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));

  const makeId = prefix =>
    prefix + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);

  function persist() {
    save(KEYS.products, products);
    save(KEYS.users, users);
    save(KEYS.orders, orders);
    save(KEYS.admin, admin);
    save(KEYS.settings, settings);
  }

  // NOTIFICATION
  function toast(message) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove("show");
    }, 2600);
  }

  // LOGIN AND REGISTRATION TABS
  function setAuthTab(tab) {
    $("loginForm").classList.toggle("hidden", tab !== "login");
    $("registerForm").classList.toggle("hidden", tab !== "register");

    document.querySelectorAll("[data-auth-tab]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.authTab === tab
      );
    });
  }

  // SHOW OR HIDE PASSWORD
  function togglePassword(id, button) {
    const input = $(id);
    if (!input) return;

    const show = input.type === "password";

    input.type = show ? "text" : "password";
    button.textContent = show ? "🙈" : "👁";

    button.setAttribute(
      "aria-label",
      show ? "Hide password" : "Show password"
    );
  }

  // PAGE NAVIGATION
  function showPage(pageId) {
    if (!currentUser && pageId !== "authPage") {
      $("authPage").classList.remove("hidden");
      $("app").classList.add("hidden");
      return;
    }

    $("authPage").classList.add("hidden");
    $("app").classList.remove("hidden");

    document.querySelectorAll("#app .page").forEach(page => {
      page.classList.toggle("hidden", page.id !== pageId);
    });

    if (pageId === "shopPage") renderShop();
    if (pageId === "cartPage") renderCart();
    if (pageId === "transactionsPage") renderMyOrders();

    if (pageId === "adminPage") {
      if (!currentUser.isAdmin) {
        toast("Admin access only.");
        showPage("shopPage");
        return;
      }

      showAdminTab("overview");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // ADMIN TABS
  function showAdminTab(tab) {
    const map = {
      overview: "adminOverview",
      products: "adminProducts",
      orders: "adminOrders",
      customers: "adminCustomers",
      receipts: "adminReceipts",
      settings: "adminSettings"
    };

    Object.entries(map).forEach(([key, id]) => {
      $(id).classList.toggle("hidden", key !== tab);
    });

    document.querySelectorAll("[data-admin-tab]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.adminTab === tab
      );
    });

    if (tab === "overview") renderOverview();
    if (tab === "products") renderAdminProducts();
    if (tab === "orders") renderOrders();
    if (tab === "customers") renderCustomers();
    if (tab === "receipts") renderReceipts();
    if (tab === "settings") renderSettings();
  }

  // LOGIN
  function login(identity, password) {
    const normalized = identity.trim().toLowerCase();

    if (
      normalized === String(admin.username).toLowerCase() &&
      admin.password &&
      password === admin.password
    ) {
      currentUser = {
        id: "admin",
        name: admin.name || "Administrator",
        email: admin.username,
        isAdmin: true
      };
    } else {
      const user = users.find(u =>
        (
          String(u.email).toLowerCase() === normalized ||
          String(u.username || "").toLowerCase() === normalized
        ) &&
        u.password === password
      );

      if (!user) {
        toast("Incorrect login details.");
        return;
      }

      currentUser = {
        ...user,
        isAdmin: false
      };
    }

    sessionStorage.setItem(
      KEYS.session,
      JSON.stringify({
        id: currentUser.id,
        isAdmin: currentUser.isAdmin
      })
    );

    $("customerNav").classList.remove("hidden");

    $("adminNavButton").classList.toggle(
      "hidden",
      !currentUser.isAdmin
    );

    toast("Welcome, " + currentUser.name + "!");

    showPage("shopPage");
  }

  // LOGOUT
  function logout() {
    currentUser = null;
    cart = {};

    sessionStorage.removeItem(KEYS.session);

    $("app").classList.add("hidden");
    $("customerNav").classList.add("hidden");
    $("authPage").classList.remove("hidden");

    setAuthTab("login");

    toast("You have logged out.");
  }

  // CUSTOMER SHOP
  function renderShop() {
    const query = ($("productSearch").value || "")
      .trim()
      .toLowerCase();

    const list = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      String(product.category || "").toLowerCase().includes(query)
    );

    $("shopProducts").innerHTML = list.length
      ? list.map(product => `
        <article class="product-card">
          <div class="product-photo">
            ${
              product.image
                ? `<img src="${product.image}" alt="${escapeHTML(product.name)}">`
                : escapeHTML(product.emoji || "💐")
            }
          </div>

          <div class="product-info">
            <h3>${escapeHTML(product.name)}</h3>
            <p>${escapeHTML(product.description || "A lovely floral arrangement.")}</p>

            <div class="product-meta">
              <span class="price">${money(product.price)}</span>
              <span class="stock">
                ${
                  Number(product.stock) > 0
                    ? `${product.stock} in stock`
                    : "Sold out"
                }
              </span>
            </div>

            <div class="product-actions">
              <button
                class="btn primary"
                ${Number(product.stock) <= 0 ? "disabled" : ""}
                onclick="addToCart('${product.id}')">
                Add to cart
              </button>

              <button
                class="btn secondary"
                ${Number(product.stock) <= 0 ? "disabled" : ""}
                onclick="buyNow('${product.id}')">
                Buy now
              </button>
            </div>
          </div>
        </article>
      `).join("")
      : `<div class="empty-state">No matching flowers found.</div>`;
  }

  // CART FUNCTIONS
  function addToCart(id) {
    const product = products.find(p => p.id === id);

    if (!product || product.stock <= 0) {
      return toast("This product is out of stock.");
    }

    if ((cart[id] || 0) >= product.stock) {
      return toast("You have reached the available stock.");
    }

    cart[id] = (cart[id] || 0) + 1;

    updateCartCount();
    toast("Added to your cart.");
  }

  function buyNow(id) {
    addToCart(id);
    showPage("cartPage");
  }

  function updateCartCount() {
    $("cartCount").textContent = Object.values(cart)
      .reduce((total, quantity) => total + quantity, 0);
  }

  function changeQty(id, delta) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const next = (cart[id] || 0) + delta;

    if (next <= 0) {
      delete cart[id];
    } else if (next <= product.stock) {
      cart[id] = next;
    } else {
      toast("Only " + product.stock + " available.");
    }

    renderCart();
    updateCartCount();
  }

  function renderCart() {
    const entries = Object.entries(cart).filter(([id, quantity]) =>
      quantity > 0 && products.some(p => p.id === id)
    );

    $("cartItems").innerHTML = entries.length
      ? entries.map(([id, quantity]) => {
          const product = products.find(p => p.id === id);

          return `
            <div class="cart-row">
              <div class="product-photo">
                ${
                  product.image
                    ? `<img src="${product.image}" alt="">`
                    : escapeHTML(product.emoji || "💐")
                }
              </div>

              <div>
                <strong>${escapeHTML(product.name)}</strong>
                <p class="price">${money(product.price)}</p>
              </div>

              <div class="qty-controls">
                <button onclick="changeQty('${id}',-1)">−</button>
                <b>${quantity}</b>
                <button onclick="changeQty('${id}',1)">＋</button>
                <button onclick="changeQty('${id}',-${quantity})">Remove</button>
              </div>
            </div>
          `;
        }).join("")
      : `<div class="empty-state">Your cart is empty. Find a bouquet you love in the shop.</div>`;

    const total = entries.reduce((sum, [id, quantity]) => {
      const product = products.find(p => p.id === id);
      return sum + product.price * quantity;
    }, 0);

    $("cartSummary").innerHTML = entries.length
      ? `
        <div class="summary-line">
          <span>Subtotal</span>
          <b>${money(total)}</b>
        </div>

        <div class="summary-line">
          <span>Delivery</span>
          <b>Free</b>
        </div>

        <div class="summary-line summary-total">
          <span>Total</span>
          <b>${money(total)}</b>
        </div>

        <button class="btn primary full" onclick="placeOrder()">
          Place order
        </button>
      `
      : "";
  }

  // CHECKOUT
  function placeOrder() {
    const entries = Object.entries(cart);

    if (!entries.length) {
      return toast("Your cart is empty.");
    }

    // Check stock again before checkout.
    for (const [id, quantity] of entries) {
      const product = products.find(p => p.id === id);

      if (!product || product.stock < quantity) {
        return toast(
          "Stock changed for " +
          (product ? product.name : "a product") +
          ". Please review your cart."
        );
      }
    }

    const items = entries.map(([id, quantity]) => {
      const product = products.find(p => p.id === id);

      product.stock -= quantity;

      return {
        productId: id,
        name: product.name,
        price: product.price,
        quantity
      };
    });

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = {
      id: makeId("PV-"),
      userId: currentUser.id,
      customerName: currentUser.name,
      email: currentUser.email,
      items,
      total,
      status: "Pending",
      date: new Date().toISOString()
    };

    orders.unshift(order);
    cart = {};

    persist();
    updateCartCount();

    toast("Order placed successfully!");

    showPage("transactionsPage");
  }

  // CUSTOMER ORDER HISTORY
  function renderMyOrders() {
    const mine = orders.filter(
      order => order.userId === currentUser.id
    );

    $("myOrders").innerHTML = mine.length
      ? mine.map(orderCard).join("")
      : `<div class="empty-state">You have not placed any orders yet.</div>`;
  }

  function orderCard(order) {
    return `
      <div class="order-card">
        <div class="order-top">
          <strong>Order ${escapeHTML(order.id)}</strong>
          <b>${money(order.total)}</b>
        </div>

        <p>
          ${new Date(order.date).toLocaleString()}
          · Status:
          <strong>${escapeHTML(order.status)}</strong>
        </p>

        <p>
          ${order.items.map(item =>
            `${escapeHTML(item.name)} × ${item.quantity}`
          ).join("<br>")}
        </p>

        <button
          class="btn secondary"
          onclick="printReceipt('${order.id}')">
          View / print receipt
        </button>
      </div>
    `;
  }

  // ADMIN OVERVIEW
  function renderOverview() {
    const sales = orders
      .filter(order => order.status !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    $("statsGrid").innerHTML = [
      ["Products", products.length],
      ["Orders", orders.length],
      ["Customers", users.length],
      ["Sales", money(sales)]
    ].map(item => `
      <div class="stat-card">
        <span>${item[0]}</span>
        <strong>${item[1]}</strong>
      </div>
    `).join("");

    $("recentOrders").innerHTML = orders.length
      ? orders.slice(0, 5).map(orderCard).join("")
      : `<div class="empty-state">No orders yet.</div>`;
  }

  // ADMIN PRODUCT INVENTORY
  function renderAdminProducts() {
    $("inventoryProducts").innerHTML = products.length
      ? products.map(product => `
        <div class="inventory-item">
          <div class="inventory-thumb">
            ${
              product.image
                ? `<img src="${product.image}" alt="">`
                : escapeHTML(product.emoji || "💐")
            }
          </div>

          <div>
            <h3>${escapeHTML(product.name)}</h3>
            <p>
              ${money(product.price)}
              · Stock: ${product.stock}
              · ${escapeHTML(product.category || "Uncategorized")}
            </p>
          </div>

          <div class="inventory-actions">
            <button onclick="editProduct('${product.id}')">Edit</button>
            <button class="delete" onclick="deleteProduct('${product.id}')">Delete</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty-state">No products yet. Add your first product below.</div>`;
  }

  // CLEAR PRODUCT FORM
  function resetProductForm(scroll = false) {
    $("productForm").reset();

    $("productId").value = "";
    editingImage = "";

    $("productImagePreview").src = "";
    $("productImagePreview").classList.add("hidden");
    $("noImageText").classList.remove("hidden");

    $("productFormTitle").textContent = "Add a product";
    $("saveProductButton").textContent = "Save product";

    if (scroll) {
      $("productEditor").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  // EDIT PRODUCT
  function editProduct(id) {
    const product = products.find(
      p => String(p.id) === String(id)
    );

    if (!product) {
      return toast("Product not found.");
    }

    $("productId").value = product.id;
    $("productName").value = product.name;
    $("productPrice").value = product.price;
    $("productStock").value = product.stock;
    $("productCategory").value = product.category || "";
    $("productDescription").value = product.description || "";

    editingImage = product.image || "";

    if (editingImage) {
      $("productImagePreview").src = editingImage;
      $("productImagePreview").classList.remove("hidden");
      $("noImageText").classList.add("hidden");
    } else {
      $("productImagePreview").classList.add("hidden");
      $("noImageText").classList.remove("hidden");
    }

    $("productFormTitle").textContent = "Edit product";
    $("saveProductButton").textContent = "Update product";

    // Scroll to the editor below the inventory.
    $("productEditor").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // DELETE PRODUCT
  function deleteProduct(id) {
    const product = products.find(
      p => String(p.id) === String(id)
    );

    if (!product) {
      return toast("Product not found.");
    }

    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    products = products.filter(
      p => String(p.id) !== String(id)
    );

    delete cart[id];

    if (String($("productId").value) === String(id)) {
      resetProductForm();
    }

    persist();

    renderAdminProducts();
    renderShop();
    updateCartCount();

    toast("Product deleted.");
  }

  // ADD OR UPDATE PRODUCT
  function saveProduct(event) {
    event.preventDefault();

    const id = $("productId").value;
    const name = $("productName").value.trim();
    const price = Number($("productPrice").value);
    const stock = Number($("productStock").value);

    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return toast("Please enter valid product details.");
    }

    const duplicate = products.some(product =>
      product.id !== id &&
      product.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return toast("A product with this name already exists.");
    }

    const existing = products.find(product => product.id === id);

    const item = {
      id: id || makeId("P"),
      name,
      price,
      stock,
      category: $("productCategory").value.trim(),
      description: $("productDescription").value.trim(),
      emoji: existing?.emoji || "💐",
      image: editingImage
    };

    if (existing) {
      products = products.map(product =>
        product.id === id ? item : product
      );
    } else {
      products.unshift(item);
    }

    persist();

    resetProductForm();
    renderAdminProducts();
    renderShop();

    toast(
      existing
        ? "Product updated successfully."
        : "Product added successfully."
    );
  }

  // ADMIN ORDERS
  function renderOrders() {
    $("allOrders").innerHTML = orders.length
      ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>

            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${escapeHTML(order.id)}</td>
                  <td>${escapeHTML(order.customerName)}</td>
                  <td>${new Date(order.date).toLocaleDateString()}</td>
                  <td>${money(order.total)}</td>

                  <td>
                    <select
                      class="status-select"
                      onchange="updateOrderStatus('${order.id}',this.value)">
                      ${
                        ["Pending","Processing","Completed","Cancelled"]
                          .map(status => `
                            <option ${order.status === status ? "selected" : ""}>
                              ${status}
                            </option>
                          `).join("")
                      }
                    </select>
                  </td>

                  <td>
                    <button
                      class="btn secondary"
                      onclick="printReceipt('${order.id}')">
                      Print
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `
      : `<div class="empty-state">No customer orders yet.</div>`;
  }

  function updateOrderStatus(id, status) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    order.status = status;

    persist();
    renderOrders();

    toast("Order status updated.");
  }

  // CUSTOMER LIST
  function renderCustomers() {
    $("customerList").innerHTML = users.length
      ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Orders</th>
              </tr>
            </thead>

            <tbody>
              ${users.map(user => `
                <tr>
                  <td>${escapeHTML(user.name)}</td>
                  <td>${escapeHTML(user.email)}</td>
                  <td>${orders.filter(order => order.userId === user.id).length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `
      : `<div class="empty-state">No registered customers yet.</div>`;
  }

  // RECEIPTS
  function renderReceipts() {
    $("receiptList").innerHTML = orders.length
      ? orders.map(order => `
        <div class="order-card">
          <div class="order-top">
            <strong>Receipt · ${escapeHTML(order.id)}</strong>
            <b>${money(order.total)}</b>
          </div>

          <p>
            ${escapeHTML(order.customerName)}
            · ${new Date(order.date).toLocaleString()}
          </p>

          <button
            class="btn secondary"
            onclick="printReceipt('${order.id}')">
            Print receipt
          </button>
        </div>
      `).join("")
      : `<div class="empty-state">Receipts will appear after customers place orders.</div>`;
  }

  // PRINT RECEIPT
  function printReceipt(id) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    const printWindow = window.open(
      "",
      "_blank",
      "width=700,height=800"
    );

    if (!printWindow) {
      return toast("Please allow pop-ups to print receipts.");
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Receipt ${escapeHTML(order.id)}</title>

        <style>
          body {
            font: 14px Arial;
            padding: 35px;
            color: #342b30;
          }

          h1 {
            color: #7b3f5b;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
          }

          td, th {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
          }

          .total {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <h1>${escapeHTML(settings.storeName)}</h1>
        <h2>Order receipt</h2>

        <p>
          Receipt: ${escapeHTML(order.id)}<br>
          Customer: ${escapeHTML(order.customerName)}<br>
          Email: ${escapeHTML(order.email || "")}<br>
          Date: ${new Date(order.date).toLocaleString()}<br>
          Status: ${escapeHTML(order.status)}
        </p>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${item.quantity}</td>
                <td>${money(item.price)}</td>
                <td>${money(item.price * item.quantity)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <p class="total">Total: ${money(order.total)}</p>
        <p>Thank you for shopping with us!</p>

        <script>
          window.onload = () => window.print();
        <\/script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  // ADMIN SETTINGS
  function renderSettings() {
    $("settingStoreName").value =
      settings.storeName || "Petal & Vine";

    $("settingAdminName").value =
      admin.name || "Administrator";

    $("settingAdminUsername").value =
      admin.username || "admin";

    $("currentAdminPassword").value = "";
    $("newAdminPassword").value = "";
  }

  // LOGIN FORM
  $("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    login(
      $("loginIdentity").value,
      $("loginPassword").value
    );
  });

  // REGISTER FORM
  $("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("registerName").value.trim();
    const email = $("registerEmail").value.trim().toLowerCase();
    const password = $("registerPassword").value;

    if (password.length < 6) {
      return toast("Password must be at least 6 characters.");
    }

    if (users.some(user => user.email.toLowerCase() === email)) {
      return toast("An account with this email already exists.");
    }

    const user = {
      id: makeId("U"),
      name,
      email,
      password
    };

    users.push(user);
    persist();

    $("registerForm").reset();

    setAuthTab("login");
    $("loginIdentity").value = email;

    toast("Account created. Please log in.");
  });

  // AUTH TABS
  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    button.addEventListener("click", () => {
      setAuthTab(button.dataset.authTab);
    });
  });

  // PASSWORD EYE BUTTONS
  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      togglePassword(button.dataset.togglePassword, button);
    });
  });

  // ADMIN TABS
  document.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.addEventListener("click", () => {
      showAdminTab(button.dataset.adminTab);
    });
  });

  // PRODUCT FORM
  $("productForm").addEventListener("submit", saveProduct);

  // SEARCH PRODUCTS
  $("productSearch").addEventListener("input", renderShop);

  // PRODUCT IMAGE UPLOAD
  $("productImage").addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      toast("Please choose an image smaller than 1.5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      editingImage = reader.result;

      $("productImagePreview").src = editingImage;
      $("productImagePreview").classList.remove("hidden");
      $("noImageText").classList.add("hidden");
    };

    reader.onerror = () => {
      toast("Could not read that image.");
    };

    reader.readAsDataURL(file);
  });

  // SAVE STORE SETTINGS
  $("storeSettingsForm").addEventListener("submit", event => {
    event.preventDefault();

    settings.storeName = $("settingStoreName").value.trim();
    admin.name = $("settingAdminName").value.trim();

    persist();

    $("storeName").textContent = settings.storeName;

    toast("Store settings saved.");
  });

  // UPDATE ADMIN ACCOUNT
  $("adminAccountForm").addEventListener("submit", event => {
    event.preventDefault();

    if ($("currentAdminPassword").value !== admin.password) {
      return toast("Current admin password is incorrect.");
    }

    const username = $("settingAdminUsername").value.trim();
    const password = $("newAdminPassword").value;

    if (!username || password.length < 6) {
      return toast("Enter a username and a password of at least 6 characters.");
    }

    admin.username = username;
    admin.password = password;

    persist();

    $("adminAccountForm").reset();

    toast("Admin account updated. Use your new login details next time.");
  });

  // FIRST-TIME ADMIN PASSWORD SETUP
  // No demo password is shipped.
  if (!admin.password) {
    const setup = document.createElement("div");

    setup.className = "setup-overlay";

    setup.innerHTML = `
      <div class="setup-box">
        <p class="eyebrow">FIRST-TIME SETUP</p>
        <h2>Set your admin password</h2>

        <p>
          Create a password for the store administrator account.
          Your username will be <b>admin</b> and can be changed later
          in Admin Settings.
        </p>

        <form id="firstAdminSetup">
          <label>
            New admin password

            <div class="password-wrap">
              <input
                id="firstAdminPassword"
                type="password"
                minlength="6"
                required
                placeholder="At least 6 characters">

              <button
                type="button"
                class="eye-btn"
                data-setup-eye>
                👁
              </button>
            </div>
          </label>

          <label>
            Confirm password
            <input
              id="confirmAdminPassword"
              type="password"
              minlength="6"
              required>
          </label>

          <button class="btn primary full" type="submit">
            Save admin password
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(setup);

    setup.querySelector("[data-setup-eye]").addEventListener("click", event => {
      togglePassword("firstAdminPassword", event.currentTarget);
    });

    $("firstAdminSetup").addEventListener("submit", event => {
      event.preventDefault();

      const password = $("firstAdminPassword").value;
      const confirmation = $("confirmAdminPassword").value;

      if (password.length < 6) {
        return toast("Use at least 6 characters.");
      }

      if (password !== confirmation) {
        return toast("Passwords do not match.");
      }

      admin.username = "admin";
      admin.password = password;
      admin.name = "Administrator";

      persist();

      setup.remove();

      toast("Admin password created. Log in with username admin.");
    });
  }

  // RESTORE SESSION FOR THIS BROWSER TAB
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(KEYS.session) || "null"
    );

    if (saved?.isAdmin && admin.password) {
      currentUser = {
        id: "admin",
        name: admin.name || "Administrator",
        email: admin.username,
        isAdmin: true
      };
    } else if (saved?.id) {
      const user = users.find(item => item.id === saved.id);

      if (user) {
        currentUser = {
          ...user,
          isAdmin: false
        };
      }
    }
  } catch (error) {
    console.warn("Could not restore session.", error);
  }

  if (currentUser) {
    $("customerNav").classList.remove("hidden");

    $("adminNavButton").classList.toggle(
      "hidden",
      !currentUser.isAdmin
    );

    showPage("shopPage");
  } else {
    $("authPage").classList.remove("hidden");
    $("app").classList.add("hidden");
  }

  $("storeName").textContent =
    settings.storeName || "Petal & Vine";

  updateCartCount();

  // MAKE FUNCTIONS AVAILABLE TO HTML BUTTONS
  window.showPage = showPage;
  window.logout = logout;
  window.addToCart = addToCart;
  window.buyNow = buyNow;
  window.changeQty = changeQty;
  window.resetProductForm = resetProductForm;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.updateOrderStatus = updateOrderStatus;
  window.printReceipt = printReceipt;

})();
