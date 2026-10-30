
"use strict";

/* PETAL & VINE */

const STORAGE = {
 products:"pv_products_v2",
 users:"pv_users_v2",
 orders:"pv_orders_v2",
 settings:"pv_settings_v2",
 session:"pv_session_v2"
};

const $ = id => document.getElementById(id);

const read = (key,fallback) => {
 try {
  const value = JSON.parse(localStorage.getItem(key));
  return value === null ? fallback : value;
 } catch { return fallback; }
};

const write = (key,value) => localStorage.setItem(key,JSON.stringify(value));

const makeId = prefix => prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);

const money = value => "₱"+Number(value||0).toLocaleString("en-PH",{
 minimumFractionDigits:2,maximumFractionDigits:2
});

const escapeHTML = value => String(value??"").replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

let products = read(STORAGE.products,[]);
let users = read(STORAGE.users,[]);
let orders = read(STORAGE.orders,[]);
let settings = read(STORAGE.settings,{
 storeName:"Petal & Vine",
 description:"Beautiful flowers for every moment.",
 adminName:"Administrator"
});

let currentUser = null;
let imageData = "";
let purchase = {};
let toastTimer;

function persist(){
 write(STORAGE.products,products);
 write(STORAGE.users,users);
 write(STORAGE.orders,orders);
 write(STORAGE.settings,settings);
}

function notify(message){
 const toast=$("toast");
 toast.textContent=message;
 toast.classList.add("show");
 clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);
}

function defaultProducts(){
 const data=[
 ["Pink Rose Bouquet",850,"Roses","A romantic bouquet of pink roses."],
 ["White Tulips",650,"Tulips","Elegant white tulips."],
 ["Sunflower Bliss",750,"Sunflowers","Bright sunflowers full of happiness."],
 ["Red Rose Classic",900,"Roses","Classic red roses."],
 ["Baby's Breath",500,"Flowers","Soft and delicate baby's breath."],
 ["Purple Dreams",950,"Mixed","A dreamy purple arrangement."],
 ["Pastel Garden",1200,"Mixed","A pastel bouquet."],
 ["Elegant Lilies",1100,"Lilies","Fresh fragrant lilies."],
 ["Peach Romance",850,"Mixed","Warm peach-colored flowers."],
 ["Daisy Delight",600,"Daisies","Cheerful daisies."],
 ["Lavender Love",800,"Mixed","Lavender-inspired bouquet."],
 ["Spring Garden",1300,"Mixed","Colorful spring arrangement."],
 ["Blush Peonies",1500,"Peonies","Beautiful blush peonies."],
 ["Golden Sunshine",1000,"Mixed","Golden flower arrangement."],
 ["Forever Bloom",1800,"Premium","Premium flower arrangement."]
 ];

 return data.map((p,i)=>({
 id:makeId("PROD"),name:p[0],price:p[1],
 category:p[2],description:p[3],stock:20,image:"",color:i
 }));
}

function initialize(){
 if(!products.length) products=defaultProducts();

 if(!users.some(u=>u.role==="admin")){
  users.push({
   id:makeId("USER"),name:"Administrator",
   username:"admin",password:"admin123",role:"admin"
  });
 }

 persist();

 const session=localStorage.getItem(STORAGE.session);
 currentUser=users.find(u=>u.id===session)||null;

 if(currentUser) enterApplication();
 else showAuth();

}

/* AUTH */

function showAuth(){
 document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
 $("authPage").classList.remove("hidden");
 updateNavigation();
}

function switchAuth(type){
 const loginMode=type==="login";
 $("loginForm").classList.toggle("hidden",!loginMode);
 $("registerForm").classList.toggle("hidden",loginMode);

 document.querySelectorAll(".auth-tabs button").forEach((b,i)=>{
  b.classList.toggle("active",i===(loginMode?0:1));
 });
}

function login(event){
 event.preventDefault();

 const username=$("loginIdentity").value.trim().toLowerCase();
 const password=$("loginPassword").value;

 const user=users.find(u=>
  u.username.toLowerCase()===username&&u.password===password
 );

 if(!user) return notify("Incorrect username or password.");

 currentUser=user;
 localStorage.setItem(STORAGE.session,user.id);
 $("loginForm").reset();
 enterApplication();
 notify("Welcome back, "+user.name+"!");
}

function register(event){
 event.preventDefault();

 const name=$("registerName").value.trim();
 const username=$("registerUsername").value.trim();
 const password=$("registerPassword").value;

 if(users.some(u=>u.username.toLowerCase()===username.toLowerCase())){
  return notify("Username already exists.");
 }

 const user={
  id:makeId("USER"),name,username,password,role:"customer",
  createdAt:new Date().toISOString()
 };

 users.push(user);
 currentUser=user;
 localStorage.setItem(STORAGE.session,user.id);
 persist();
 $("registerForm").reset();
 enterApplication();
 notify("Account created successfully!");
}

function logout(){
 currentUser=null;
 localStorage.removeItem(STORAGE.session);
 purchase={};
 showAuth();
 notify("Logged out successfully.");
}

function isAdmin(){
 return !!currentUser&&currentUser.role==="admin";
}

function requireLogin(){
 if(!currentUser){
  showAuth();
  notify("Please log in first.");
  return false;
 }
 return true;
}

function updateNavigation(){
 $("accountNav").classList.toggle("hidden",!currentUser||isAdmin());
 $("adminNav").classList.toggle("hidden",!isAdmin());
 $("logoutNav").classList.toggle("hidden",!currentUser);
}

function enterApplication(){
 updateNavigation();

 if(isAdmin()){
  $("adminWelcome").textContent=settings.adminName||currentUser.name;
  showPage("admin");
 }else{
  showPage("shop");
 }
}

function toggleMenu(){
 $("mainNav").classList.toggle("open");
}

function showPage(name){
 if(name==="account"&&(!requireLogin()||isAdmin())) return;
 if(name==="admin"&&!isAdmin()) return notify("Admin access only.");
 if(name==="checkout"&&(!requireLogin()||isAdmin())) return;

 document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));

 const page=$(name+"Page");
 if(!page) return;

 page.classList.remove("hidden");
 $("mainNav").classList.remove("open");

 if(name==="shop") renderProducts();
 if(name==="checkout") renderPurchase();
 if(name==="account") renderAccount();
 if(name==="admin") adminTab("overview");

 window.scrollTo({top:0,behavior:"smooth"});
}

/* PRODUCTS */

function placeholderImage(product){
 const flowers=["🌷","🌹","🌻","🌼","💐","🌸"];
 const symbol=flowers[(Number(product.color)||0)%flowers.length];

 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500">
 <rect width="100%" height="100%" fill="#f6e9ed"/>
 <text x="50%" y="48%" text-anchor="middle" font-size="120">${symbol}</text>
 <text x="50%" y="75%" text-anchor="middle" font-size="26" fill="#7b3f5b">Petal &amp; Vine</text>
 </svg>`;

 return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(svg);
}

function productImage(p){
 return p.image||placeholderImage(p);
}

function renderProducts(){
 const search=$("productSearch").value.toLowerCase();

 const visible=products.filter(p=>
  p.name.toLowerCase().includes(search)||
  p.category.toLowerCase().includes(search)
 );

 $("productGrid").innerHTML=visible.map(p=>`
  <article class="product-card">
   <img src="${productImage(p)}" alt="${escapeHTML(p.name)}">
   <div class="product-info">
    <h3>${escapeHTML(p.name)}</h3>
    <p>${escapeHTML(p.description)}</p>
    <div class="price">${money(p.price)}</div>
    <div class="stock-note">${p.stock} available</div>
    ${!isAdmin()?`
     <button class="primary-btn" onclick="buyProduct('${p.id}')" ${p.stock<=0?"disabled":""}>
      Buy Now
     </button>`:""}
   </div>
  </article>
 `).join("")||"<p>No products found.</p>";
}

function buyProduct(id){
 if(!requireLogin()||isAdmin()) return;

 const p=products.find(x=>x.id===id);
 if(!p||p.stock<=0) return notify("Product unavailable.");

 purchase={};
 purchase[id]=1;
 showPage("checkout");
}

/* MULTIPLE PRODUCT PURCHASE */

function renderPurchase(){
 if(!requireLogin()||isAdmin()) return;

 $("deliveryName").value=currentUser.name||"";

 $("purchaseItems").innerHTML=products.filter(p=>p.stock>0).map(p=>`
  <div class="purchase-item">
   <img src="${productImage(p)}" alt="">
   <div>
    <strong>${escapeHTML(p.name)}</strong>
    <p>${money(p.price)} each</p>
    <small>${p.stock} available</small>
   </div>
   <div>
    <label>Quantity</label>
    <input type="number" min="0" max="${p.stock}"
     value="${Number(purchase[p.id]||0)}"
     onchange="setPurchaseQuantity('${p.id}',this.value)">
   </div>
  </div>
 `).join("")||"<p>No products available.</p>";

 updatePurchaseTotal();
}

function setPurchaseQuantity(id,value){
 const p=products.find(x=>x.id===id);
 if(!p) return;

 let qty=Math.floor(Number(value)||0);
 qty=Math.max(0,Math.min(qty,p.stock));

 if(qty===0) delete purchase[id];
 else purchase[id]=qty;

 updatePurchaseTotal();
}

function selectedItems(){
 return Object.entries(purchase).map(([id,qty])=>{
  const p=products.find(x=>x.id===id);
  return p?{product:p,quantity:qty}:null;
 }).filter(Boolean);
}

function updatePurchaseTotal(){
 const items=selectedItems();
 const total=items.reduce((sum,i)=>sum+i.product.price*i.quantity,0);

 $("purchaseTotal").textContent=money(total);

 $("checkoutSummary").innerHTML=items.length?`
  ${items.map(i=>`
   <p>${escapeHTML(i.product.name)} × ${i.quantity}
   <strong>${money(i.product.price*i.quantity)}</strong></p>
  `).join("")}
  <hr><h3>Total: ${money(total)}</h3>
 `:"<p>Select at least one product.</p>";
}

/* ORDER CHECKOUT */

function placeOrder(event){
 event.preventDefault();

 if(!requireLogin()||isAdmin()) return;

 const items=selectedItems();

 if(!items.length) return notify("Please select at least one product.");

 for(const item of items){
  if(item.quantity>item.product.stock){
   return notify("Insufficient stock for "+item.product.name);
  }
 }

 const total=items.reduce((sum,i)=>sum+i.product.price*i.quantity,0);

 const order={
  id:makeId("ORDER"),
  receiptNo:"PV-"+Date.now().toString().slice(-8),
  customerId:currentUser.id,
  customerName:currentUser.name,
  username:currentUser.username,
  phone:$("deliveryPhone").value.trim(),
  address:$("deliveryAddress").value.trim(),
  payment:$("paymentMethod").value,
  paymentStatus:$("paymentMethod").value==="Cash on Delivery"?"Pending":"Awaiting Payment",
  items:items.map(i=>({
   productId:i.product.id,
   name:i.product.name,
   price:i.product.price,
   quantity:i.quantity
  })),
  total,
  status:"Pending",
  date:new Date().toISOString()
 };

 items.forEach(i=>i.product.stock-=i.quantity);

 orders.unshift(order);
 purchase={};
 persist();

 $("checkoutForm").reset();

 notify("Order placed! Receipt generated.");
 showPage("account");
}

/* CUSTOMER ACCOUNT */

function renderAccount(){
 if(!requireLogin()||isAdmin()) return;

 $("profileDetails").innerHTML=`
  <p><strong>Name:</strong> ${escapeHTML(currentUser.name)}</p>
  <p><strong>Username:</strong> ${escapeHTML(currentUser.username)}</p>
  <p><strong>Account:</strong> Customer</p>
  <button class="secondary-btn" onclick="logout()">Logout</button>
 `;

 const mine=orders.filter(o=>o.customerId===currentUser.id);

 $("customerOrders").innerHTML=mine.length?mine.map(o=>`
  <div class="order-card">
   <div>
    <strong>${escapeHTML(o.id)}</strong>
    <p>${new Date(o.date).toLocaleString()}</p>
    <span class="status">${escapeHTML(o.status)}</span>
    <p>${money(o.total)}</p>
   </div>
  </div>
 `).join(""):"<p>No orders yet.</p>";

 $("customerReceipts").innerHTML=mine.length?mine.map(o=>`
  <div class="receipt-card">
   <div>
    <strong>${escapeHTML(o.receiptNo)}</strong>
    <p>${money(o.total)}</p>
    <span class="status">${escapeHTML(o.paymentStatus)}</span>
   </div>
   <button class="secondary-btn" onclick="printReceipt('${o.id}')">Print Receipt</button>
  </div>
 `).join(""):"<p>No receipts yet.</p>";
}

/* ADMIN TABS */

function adminTab(tab,button){
 if(!isAdmin()) return;

 document.querySelectorAll(".admin-panel").forEach(p=>p.classList.add("hidden"));

 const target=$("admin"+tab.charAt(0).toUpperCase()+tab.slice(1));
 if(target) target.classList.remove("hidden");

 document.querySelectorAll(".admin-tabs button").forEach(b=>b.classList.remove("active"));
 if(button) button.classList.add("active");
 else{
  const index=["overview","products","orders","users","transactions","settings"].indexOf(tab);
  document.querySelectorAll(".admin-tabs button")[index]?.classList.add("active");
 }

 if(tab==="overview") renderDashboard();
 if(tab==="products") renderAdminProducts();
 if(tab==="orders") renderAdminOrders();
 if(tab==="users") renderAdminUsers();
 if(tab==="transactions") renderTransactions();
 if(tab==="settings") renderSettings();
}

function renderDashboard(){
 const revenue=orders.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+o.total,0);

 $("dashboardStats").innerHTML=`
  <div class="stat-card">Products<strong>${products.length}</strong></div>
  <div class="stat-card">Orders<strong>${orders.length}</strong></div>
  <div class="stat-card">Customers<strong>${users.filter(u=>u.role==="customer").length}</strong></div>
  <div class="stat-card">Sales<strong>${money(revenue)}</strong></div>
 `;

 $("recentOrders").innerHTML=orders.slice(0,5).map(o=>`
  <div class="order-card">
   <div><strong>${escapeHTML(o.id)}</strong><p>${escapeHTML(o.customerName)}</p></div>
   <div>${money(o.total)}<p class="status">${escapeHTML(o.status)}</p></div>
  </div>
 `).join("")||"<p>No orders yet.</p>";
}

/* ADMIN PRODUCT MANAGEMENT */

function renderAdminProducts(){
 $("adminProductList").innerHTML=products.map(p=>`
  <div class="admin-product-row">
   <img src="${productImage(p)}" alt="">
   <div class="admin-product-info">
    <strong>${escapeHTML(p.name)}</strong>
    <p>${money(p.price)} · Stock: ${p.stock}</p>
   </div>
   <button class="secondary-btn" onclick="openProductEditor('${p.id}')">Edit</button>
   <button class="danger-btn" onclick="deleteProduct('${p.id}')">Delete</button>
  </div>
 `).join("")||"<p>No products yet.</p>";
}

function openProductEditor(id=""){
 if(!isAdmin()) return;

 $("productForm").reset();
 $("productId").value="";
 imageData="";
 $("productImagePreview").classList.add("hidden");

 if(id){
  const p=products.find(x=>x.id===id);
  if(!p) return;

  $("productModalTitle").textContent="Edit Product";
  $("productId").value=p.id;
  $("productName").value=p.name;
  $("productPrice").value=p.price;
  $("productCategory").value=p.category;
  $("productStock").value=p.stock;
  $("productDescription").value=p.description;

  if(p.image){
   imageData=p.image;
   $("productImagePreview").src=p.image;
   $("productImagePreview").classList.remove("hidden");
  }
 }else{
  $("productModalTitle").textContent="Add Product";
 }

 $("productModal").classList.remove("hidden");
}

function closeProductEditor(){
 $("productModal").classList.add("hidden");
}

function previewProductImage(event){
 if(!isAdmin()) return;

 const file=event.target.files[0];
 if(!file) return;

 if(!file.type.startsWith("image/")) return notify("Select an image.");
 if(file.size>1500000){
  event.target.value="";
  return notify("Image must be smaller than 1.5 MB.");
 }

 const reader=new FileReader();

 reader.onload=()=>{
  imageData=reader.result;
  $("productImagePreview").src=imageData;
  $("productImagePreview").classList.remove("hidden");
 };

 reader.readAsDataURL(file);
}

function saveProduct(event){
 event.preventDefault();
 if(!isAdmin()) return;

 const id=$("productId").value;
 const name=$("productName").value.trim();
 const price=Number($("productPrice").value);
 const category=$("productCategory").value.trim();
 const stock=Number($("productStock").value);
 const description=$("productDescription").value.trim();

 if(!name||!category||!description||price<=0||stock<0){
  return notify("Invalid product details.");
 }

 if(products.some(p=>p.id!==id&&p.name.toLowerCase()===name.toLowerCase())){
  return notify("Product name already exists.");
 }

 if(id){
  const p=products.find(x=>x.id===id);
  if(!p) return;

  Object.assign(p,{name,price,category,stock,description});
  if(imageData) p.image=imageData;
 }else{
  products.push({
   id:makeId("PROD"),name,price,category,stock,description,
   image:imageData,color:products.length
  });
 }

 persist();
 closeProductEditor();
 renderAdminProducts();
 renderProducts();
 notify("Product saved.");
}

function deleteProduct(id){
 if(!isAdmin()) return;

 const p=products.find(x=>x.id===id);
 if(!p||!confirm("Delete "+p.name+"?")) return;

 products=products.filter(x=>x.id!==id);
 persist();
 renderAdminProducts();
 renderProducts();
 notify("Product deleted.");
}

/* ADMIN ORDERS */

function renderAdminOrders(){
 $("adminOrderList").innerHTML=orders.map(o=>`
  <div class="order-card">
   <div>
    <strong>${escapeHTML(o.id)}</strong>
    <p>${escapeHTML(o.customerName)} · ${new Date(o.date).toLocaleString()}</p>
    <p>${o.items.map(i=>escapeHTML(i.name)+" × "+i.quantity).join(", ")}</p>
    <strong>${money(o.total)}</strong>
   </div>
   <div>
    <select onchange="updateOrderStatus('${o.id}',this.value)">
     ${["Pending","Processing","Ready for Delivery","Completed","Cancelled"].map(s=>
      `<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`
     ).join("")}
    </select>
    <button class="secondary-btn" onclick="printReceipt('${o.id}')">Receipt</button>
   </div>
  </div>
 `).join("")||"<p>No orders yet.</p>";
}

function updateOrderStatus(id,status){
 if(!isAdmin()) return;

 const o=orders.find(x=>x.id===id);
 if(!o) return;

 const old=o.status;

 if(status==="Cancelled"&&old!=="Cancelled"){
  o.items.forEach(i=>{
   const p=products.find(x=>x.id===i.productId);
   if(p) p.stock+=i.quantity;
  });
 }

 if(old==="Cancelled"&&status!=="Cancelled"){
  const unavailable=o.items.some(i=>{
   const p=products.find(x=>x.id===i.productId);
   return !p||p.stock<i.quantity;
  });

  if(unavailable) return notify("Insufficient stock.");

  o.items.forEach(i=>{
   const p=products.find(x=>x.id===i.productId);
   if(p) p.stock-=i.quantity;
  });
 }

 o.status=status;
 persist();
 renderAdminOrders();
 notify("Order updated.");
}

/* USER MANAGEMENT */

function renderAdminUsers(){
 const customers=users.filter(u=>u.role==="customer");

 $("adminUserList").innerHTML=customers.map(u=>`
  <div class="order-card">
   <div>
    <strong>${escapeHTML(u.name)}</strong>
    <p>@${escapeHTML(u.username)}</p>
    <small>Registered: ${u.createdAt?new Date(u.createdAt).toLocaleDateString():"-"}</small>
   </div>
   <button class="danger-btn" onclick="deleteCustomer('${u.id}')">Delete User</button>
  </div>
 `).join("")||"<p>No customers registered.</p>";
}

function deleteCustomer(id){
 if(!isAdmin()) return;

 const u=users.find(x=>x.id===id);
 if(!u||u.role!=="customer") return;

 if(!confirm("Delete customer "+u.name+"?")) return;

 users=users.filter(x=>x.id!==id);
 persist();
 renderAdminUsers();
 notify("Customer deleted.");
}

/* TRANSACTIONS AND RECEIPTS */

function renderTransactions(){
 $("adminTransactionList").innerHTML=orders.map(o=>`
  <div class="receipt-card">
   <div>
    <strong>${escapeHTML(o.receiptNo)}</strong>
    <p>${escapeHTML(o.customerName)}</p>
    <p>${money(o.total)} · ${escapeHTML(o.payment)}</p>
    <span class="status">${escapeHTML(o.paymentStatus)}</span>
   </div>
   <button class="secondary-btn" onclick="printReceipt('${o.id}')">Print Receipt</button>
  </div>
 `).join("")||"<p>No transactions yet.</p>";
}

/* RECEIPT PRINTING */

function printReceipt(id){
 if(!currentUser) return;

 const o=orders.find(x=>x.id===id);
 if(!o) return;

 if(!isAdmin()&&o.customerId!==currentUser.id){
  return notify("You cannot view another customer's receipt.");
 }

 const popup=window.open("","_blank");
 if(!popup) return notify("Allow pop-ups to print receipts.");

 const rows=o.items.map(i=>`
  <tr>
   <td>${escapeHTML(i.name)}</td>
   <td>${i.quantity}</td>
   <td>${money(i.price)}</td>
   <td>${money(i.price*i.quantity)}</td>
  </tr>
 `).join("");

 popup.document.open();
 popup.document.write(`
  <!DOCTYPE html>
  <html>
  <head>
   <title>Receipt ${escapeHTML(o.receiptNo)}</title>
   <style>
    body{font-family:Arial,sans-serif;padding:35px;color:#382b30;max-width:750px;margin:auto}
    h1{color:#7b3f5b;text-align:center}
    .center{text-align:center}
    table{width:100%;border-collapse:collapse;margin-top:25px}
    td,th{padding:12px;border-bottom:1px solid #ddd;text-align:left}
    .total{text-align:right;font-size:24px;font-weight:bold;color:#7b3f5b}
    .footer{text-align:center;margin-top:35px}
   </style>
  </head>
  <body>
   <h1>✿ Petal & Vine</h1>
   <p class="center">OFFICIAL SALES RECEIPT</p>
   <hr>
   <p><b>Receipt No:</b> ${escapeHTML(o.receiptNo)}</p>
   <p><b>Order ID:</b> ${escapeHTML(o.id)}</p>
   <p><b>Date:</b> ${new Date(o.date).toLocaleString()}</p>
   <p><b>Customer:</b> ${escapeHTML(o.customerName)}</p>
   <p><b>Phone:</b> ${escapeHTML(o.phone)}</p>
   <p><b>Address:</b> ${escapeHTML(o.address)}</p>
   <p><b>Payment Method:</b> ${escapeHTML(o.payment)}</p>
   <table>
    <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
    <tbody>${rows}</tbody>
   </table>
   <p class="total">Total: ${money(o.total)}</p>
   <p><b>Order Status:</b> ${escapeHTML(o.status)}</p>
   <p><b>Payment Status:</b> ${escapeHTML(o.paymentStatus)}</p>
   <div class="footer">Thank you for shopping with Petal & Vine!<br>Made with love, one bloom at a time.</div>
   <script>window.onload=()=>window.print();<\/script>
  </body>
  </html>
 `);

 popup.document.close();
}

/* SETTINGS */

function renderSettings(){
 if(!isAdmin()) return;

 $("settingStoreName").value=settings.storeName||"Petal & Vine";
 $("settingStoreDescription").value=settings.description||"";
 $("settingAdminName").value=settings.adminName||currentUser.name;
 $("settingAdminUsername").value=currentUser.username;
 $("settingAdminPassword").value="";
}

function saveStoreSettings(event){
 event.preventDefault();
 if(!isAdmin()) return;

 settings.storeName=$("settingStoreName").value.trim();
 settings.description=$("settingStoreDescription").value.trim();

 persist();
 document.querySelector(".brand").textContent="✿ "+settings.storeName;
 notify("Store settings saved.");
}

function updateAdminAccount(event){
 event.preventDefault();
 if(!isAdmin()) return;

 const username=$("settingAdminUsername").value.trim();
 const name=$("settingAdminName").value.trim();
 const password=$("settingAdminPassword").value;

 if(username.length<3||name.length<2) return notify("Invalid account details.");

 if(users.some(u=>u.id!==currentUser.id&&u.username.toLowerCase()===username.toLowerCase())){
  return notify("Username already taken.");
 }

 if(password&&password.length<6) return notify("Password must be at least 6 characters.");

 currentUser.username=username;
 currentUser.name=name;
 if(password) currentUser.password=password;

 settings.adminName=name;
 persist();

 $("adminWelcome").textContent=name;
 notify("Admin account updated.");
}

/* START */

document.addEventListener("DOMContentLoaded",initialize);
