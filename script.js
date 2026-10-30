/* RECEIPTS AND PRINTING */

function printReceipt(id) {
  const order = orders.find(item => item.id === id);

  if (!order) return;

  if (
    currentRole !== "admin" &&
    order.customerId !== currentUser.id
  ) {
    return;
  }

  const rows = order.items.map(item => `
    <tr>
      <td>${escapeHTML(item.name)} × ${item.quantity}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  const receipt = `
    <div id="printReceipt" class="receipt">
      <h1>🌷 Petal &amp; Vine</h1>
      <p>Flower Shop · Binalonan, Pangasinan</p>
      <hr>

      <h2>OFFICIAL ORDER RECEIPT</h2>

      <p><strong>Receipt No:</strong> PV-${order.id}</p>
      <p><strong>Date:</strong> ${
        escapeHTML(
          order.date
            ? new Date(order.date).toLocaleString("en-PH")
            : "—"
        )
      }</p>
      <p><strong>Customer:</strong> ${escapeHTML(order.customerName || "Customer")}</p>
      <p><strong>Contact:</strong> ${escapeHTML(order.phone || "—")}</p>
      <p><strong>Delivery:</strong> ${escapeHTML(order.address || "—")}</p>
      <p><strong>Payment:</strong> ${escapeHTML(order.payment || "—")}</p>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <h2>Total: ${money(order.total)}</h2>
      <p>Status: ${escapeHTML(order.status)}</p>
      <p>Thank you for choosing Petal &amp; Vine! 🌸</p>

      <button class="btn primary" onclick="window.print()">
        Print Receipt
      </button>
    </div>
  `;

  const win = window.open("", "_blank", "width=800,height=700");

  if (!win) {
    alert("Please allow pop-ups to print the receipt.");
    return;
  }

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>Receipt PV-${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 28px;
          color: #333;
        }

        h1, h2 {
          color: #6c5b7b;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        td, th {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }

        button {
          padding: 10px 16px;
          background: #c06c84;
          color: white;
          border: 0;
          border-radius: 6px;
        }

        @media print {
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${receipt}
    </body>
    </html>
  `);

  win.document.close();
  win.focus();
}

/* UPDATE ORDER STATUS */

function updateOrder(id, status) {
  if (currentRole !== "admin") return;

  const order = orders.find(item => item.id === id);

  if (
    !order ||
    !["Pending", "Processing", "Completed", "Cancelled"].includes(status)
  ) {
    return;
  }

  const oldStatus = order.status;

  if (oldStatus === status) return;

  // Restore stock when an order is cancelled;
  // deduct it again if the cancelled order is reactivated.
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

      if (product) {
        product.stock += item.quantity;
      }
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

/* ADMIN RECEIPTS */

function renderReceipts() {
  if (currentRole !== "admin") return;

  const list = orders;

  $("receiptsList").innerHTML = list.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(order => `
              <tr>
                <td>PV-${order.id}</td>
                <td>${escapeHTML(order.customerName || "Customer")}</td>
                <td>${
                  escapeHTML(
                    order.date
                      ? new Date(order.date).toLocaleDateString("en-PH")
                      : "—"
                  )
                }</td>
                <td>${money(order.total)}</td>
                <td>${escapeHTML(order.status)}</td>
                <td>
                  <button
                    class="btn outline"
                    type="button"
                    data-print-receipt="${order.id}"
                  >
                    Print Receipt
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : `
      <div class="empty-state">
        No receipts yet. Receipts appear after customers place orders.
      </div>
    `;

  $("receiptsList")
    .querySelectorAll("[data-print-receipt]")
    .forEach(button => {
      button.addEventListener("click", () => {
        printReceipt(Number(button.dataset.printReceipt));
      });
    });
}

/* ADMIN SETTINGS */

function renderAdminSettings() {
  if (currentRole !== "admin") return;

  $("adminDisplayName").value = adminSettings.displayName;
  $("adminUsername").value = adminSettings.username;

  $("currentAdminPassword").value = "";
  $("newAdminPassword").value = "";
  $("confirmAdminPassword").value = "";

  $("adminSettingsMessage").textContent = "";
}

$("adminSettingsForm").addEventListener("submit", event => {
  event.preventDefault();

  if (currentRole !== "admin") return;

  const displayName = $("adminDisplayName").value.trim();
  const username = $("adminUsername").value.trim();
  const currentPassword = $("currentAdminPassword").value;
  const newPassword = $("newAdminPassword").value;
  const confirmPassword = $("confirmAdminPassword").value;

  const message = $("adminSettingsMessage");
  message.textContent = "";

  if (currentPassword !== adminSettings.password) {
    message.textContent = "Your current password is incorrect.";
    return;
  }

  if (displayName.length < 2 || username.length < 3) {
    message.textContent =
      "Enter a display name and username (at least 3 characters).";
    return;
  }

  if (newPassword && newPassword.length < 6) {
    message.textContent =
      "New password must have at least 6 characters.";
    return;
  }

  if (newPassword !== confirmPassword) {
    message.textContent = "New passwords do not match.";
    return;
  }

  if (users.some(user =>
    user.username.toLowerCase() === username.toLowerCase()
  )) {
    message.textContent =
      "That username is already used by a customer.";
    return;
  }

  const previous = { ...adminSettings };

  adminSettings = {
    username,
    displayName,
    password: newPassword || adminSettings.password
  };

  if (!save("petal_vine_admin_settings", adminSettings)) {
    adminSettings = previous;
    return;
  }

  currentUser.fullName = displayName;
  currentUser.username = username;

  $("welcomeUser").textContent = "👤 " + displayName;

  $("currentAdminPassword").value = "";
  $("newAdminPassword").value = "";
  $("confirmAdminPassword").value = "";

  message.textContent = "Admin settings saved successfully.";
  notify("Administrator details updated.");
});

/* CUSTOMER LIST AND REPORTS */

function renderCustomers() {
  if (currentRole !== "admin") return;

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  const newUsers = users.filter(user =>
    user.createdAt &&
    now - new Date(user.createdAt).getTime() <= sevenDays
  ).length;

  const activeUsers = users.filter(user =>
    user.lastLogin &&
    now - new Date(user.lastLogin).getTime() <= thirtyDays
  ).length;

  $("userTotal").textContent = users.length;
  $("userNew").textContent = newUsers;
  $("userActive").textContent = activeUsers;

  $("customersList").innerHTML = users.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Username</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Account</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${users.map(user => `
              <tr>
                <td>${escapeHTML(user.fullName)}</td>
                <td>${escapeHTML(user.username)}</td>

                <td>
                  ${
                    user.createdAt
                      ? escapeHTML(
                          new Date(user.createdAt).toLocaleDateString("en-PH")
                        )
                      : "Legacy account"
                  }
                </td>

                <td>
                  ${
                    user.lastLogin
                      ? escapeHTML(
                          new Date(user.lastLogin).toLocaleString("en-PH")
                        )
                      : "Never logged in"
                  }
                </td>

                <td>${user.active === false ? "Disabled" : "Active"}</td>

                <td>
                  <button
                    class="btn ${user.active === false ? "success" : "light"}"
                    type="button"
                    data-toggle-user="${user.id}"
                  >
                    ${user.active === false ? "Enable" : "Disable"}
                  </button>

                  <button
                    class="btn danger"
                    type="button"
                    data-delete-user="${user.id}"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : `
      <div class="empty-state">
        No registered customers yet.
      </div>
    `;

  $("customersList")
    .querySelectorAll("[data-toggle-user]")
    .forEach(button => {
      button.addEventListener("click", () => {
        toggleUser(Number(button.dataset.toggleUser));
      });
    });

  $("customersList")
    .querySelectorAll("[data-delete-user]")
    .forEach(button => {
      button.addEventListener("click", () => {
        deleteUser(Number(button.dataset.deleteUser));
      });
    });
}

function toggleUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);
  if (!user) return;

  user.active = user.active === false;

  if (!save(DB.users, users)) return;

  renderCustomers();

  notify(
    user.active
      ? "User account enabled."
      : "User account disabled."
  );
}

function deleteUser(id) {
  if (currentRole !== "admin") return;

  const user = users.find(item => item.id === id);

  if (
    !user ||
    !confirm(`Delete customer account ${user.username}?`)
  ) {
    return;
  }

  const previous = users;
  users = users.filter(item => item.id !== id);

  if (!save(DB.users, users)) {
    users = previous;
    return;
  }

  renderCustomers();
  renderDashboard();

  notify("Customer account deleted.");
}

function renderReports() {
  if (currentRole !== "admin") return;

  const completed = orders.filter(order =>
    order.status === "Completed"
  );

  const revenue = completed.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  $("reportRevenue").textContent = money(revenue);
  $("reportCompleted").textContent = completed.length;

  $("reportPending").textContent = orders.filter(order =>
    order.status === "Pending" ||
    order.status === "Processing"
  ).length;
}

/* REFRESH ALL DATA */

function renderAll() {
  renderDashboard();

  if (currentRole === "admin") {
    renderInventory();
    renderOrders();
    renderCustomers();
    renderReports();
    renderReceipts();
  } else {
    renderShop();
    renderOrders();
  }
}

/* NOTIFICATIONS */

function notify(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/* EXPOSE HTML BUTTON ACTIONS */

window.showAuth = showAuth;
window.backToChoices = backToChoices;
window.togglePassword = togglePassword;
window.logout = logout;
window.openProductForm = openProductForm;
window.closeProductForm = closeProductForm;
window.goPage = goPage;

/* INITIALIZATION */

backToChoices();
