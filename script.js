
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const KEYS = {
    products:"pv_products_v8",
    users:"pv_users_v8",
    orders:"pv_orders_v8",
    admin:"pv_admin_v8",
    settings:"pv_settings_v8",
    session:"pv_session_v8",
    cart:"pv_cart_v8"
  };

  const starterProducts = [
    ["p01","Classic Rose Bouquet",899,18,"Bouquet","A timeless arrangement of fresh red roses.","🌹"],
    ["p02","Blush Pink Roses",999,14,"Roses","Soft pink roses wrapped with care.","🌸"],
    ["p03","Sunshine Sunflowers",749,20,"Bouquet","Bright sunflowers to lift someone's day.","🌻"],
    ["p04","White Lily Elegance",1099,10,"Lilies","Elegant white lilies with delicate greenery.","🤍"],
    ["p05","Pastel Dream",1299,12,"Bouquet","A gentle mix of pastel seasonal blooms.","💐"],
    ["p06","Baby's Breath Cloud",599,22,"Bouquet","Airy baby's breath in a charming wrap.","🌼"],
    ["p07","Tulip Love",1199,9,"Tulips","A lovely bunch of colorful tulips.","🌷"],
    ["p08","Orchid Grace",1399,8,"Orchids","A graceful orchid arrangement.","🪻"],
    ["p09","Garden Mix",849,16,"Mixed flowers","A cheerful mix inspired by a garden.","🌺"],
    ["p10","Red Romance",1499,7,"Roses","Premium red roses for heartfelt moments.","🌹"],
    ["p11","Peach Perfection",949,13,"Bouquet","Warm peach-toned seasonal flowers.","🧡"],
    ["p12","Lavender Fields",899,11,"Mixed flowers","Soft lavender hues and pretty textures.","💜"],
    ["p13","Daisy Delight",699,19,"Daisies","Fresh and happy daisy arrangement.","🌼"],
    ["p14","Elegant Carnations",799,15,"Carnations","Beautiful carnations in a neat bouquet.","🌷"],
    ["p15","Grand Celebration",1999,5,"Premium","A full, celebratory premium arrangement.","💐"]
  ].map(([id,name,price,stock,category,description,emoji]) =>
    ({id,name,price,stock,category,description,emoji,image:""})
  );

  function load(key,fallback){
    try{
      const value=localStorage.getItem(key);
      return value?JSON.parse(value):fallback;
    }catch{return fallback;}
  }
  function save(key,value){localStorage.setItem(key,JSON.stringify(value));}
  let products=load(KEYS.products,null);
  if(!Array.isArray(products)||!products.length){
    products=starterProducts;
    save(KEYS.products,products);
  }
  let users=load(KEYS.users,[]);
  let orders=load(KEYS.orders,[]);
  let admin=load(KEYS.admin,null);
  let settings=load(KEYS.settings,{
    storeName:"Petal & Vine",
    adminName:"Administrator",
    contactEmail:""
  });
  let session=load(KEYS.session,null);
  let cart=load(KEYS.cart,[]);
  let pendingImage="";
  let toastTimer;

  const money=value=>"₱"+Number(value||0).toLocaleString("en-PH",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const makeId=prefix=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const dateText=value=>new Date(value).toLocaleString("en-PH",{
    dateStyle:"medium",timeStyle:"short"
  });

  function toast(message){
    const el=$("toast");
    el.textContent=message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
  }
  function persistAll(){
    save(KEYS.products,products);
    save(KEYS.users,users);
    save(KEYS.orders,orders);
    save(KEYS.admin,admin);
    save(KEYS.settings,settings);
    save(KEYS.cart,cart);
  }
  function currentUser(){
    return session?.type==="customer"
      ?users.find(u=>u.id===session.id)
      :null;
  }
  function isAdmin(){return session?.type==="admin";}

  function showPage(page){
    if((page==="orders"||page==="cart")&&!currentUser()){
      toast("Please log in to continue.");
      page="login";
    }
    document.querySelectorAll("main>.page").forEach(el=>el.classList.remove("active"));
    $(page+"Page")?.classList.add("active");
    document.querySelectorAll(".nav-link").forEach(b=>
      b.classList.toggle("active",b.dataset.page===page)
    );
    if(page==="shop")renderShop();
    if(page==="cart")renderCart();
    if(page==="orders")renderCustomerOrders();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function renderHeader(){
    const user=currentUser();
    $("welcomeUser").textContent=user?`Hi, ${user.name.split(" ")[0]}`:"";
    $("accountButton").textContent=user?"Logout":"Login";
    $("adminOpenButton").textContent=isAdmin()?"Admin panel":"Admin";
    $("cartCount").textContent=cart.reduce((n,item)=>n+item.qty,0);
  }

  function productVisual(product){
    return product.image
      ?`<img src="${product.image}" alt="${esc(product.name)}">`
      :`<span class="product-emoji">${esc(product.emoji||"💐")}</span>`;
  }

  function renderShop(){
    const query=($("productSearch").value||"").trim().toLowerCase();
    const list=products.filter(p=>
      `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(query)
    );
    $("shopProducts").innerHTML=list.map(p=>`
      <article class="product-card">
        <div class="product-photo">${productVisual(p)}</div>
        <div class="product-info">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description||"A lovely floral arrangement.")}</p>
          <div class="product-meta">
            <span class="price">${money(p.price)}</span>
            <span class="stock">${p.stock>0?`${p.stock} available`:"Out of stock"}</span>
          </div>
          <button class="button button-dark" data-add-cart="${p.id}" ${p.stock<1?"disabled":""}>Add to cart</button>
        </div>
      </article>
    `).join("");
    $("emptyProducts").classList.toggle("hidden",list.length>0);
  }

  function addToCart(pid){
    if(!currentUser()){
      toast("Please log in to add items to your cart.");
      showPage("login");
      return;
    }
    const product=products.find(p=>p.id===pid);
    if(!product||product.stock<1)return toast("This product is out of stock.");
    const line=cart.find(x=>x.productId===pid);
    if(line){
      if(line.qty>=product.stock)return toast("You have reached the available stock.");
      line.qty++;
    }else cart.push({productId:pid,qty:1});
    save(KEYS.cart,cart);
    renderHeader();
    toast("Added to cart.");
  }

  function cartTotal(){
    return cart.reduce((sum,line)=>{
      const p=products.find(x=>x.id===line.productId);
      return sum+(p?p.price*line.qty:0);
    },0);
  }

  function renderCart(){
    cart=cart.filter(line=>products.some(p=>p.id===line.productId));
    save(KEYS.cart,cart);
    $("cartItems").innerHTML=cart.length?cart.map(line=>{
      const p=products.find(x=>x.id===line.productId);
      return `
        <div class="cart-line">
          <div class="product-photo" style="width:72px;height:72px;border-radius:8px">${productVisual(p)}</div>
          <div class="row-main"><strong>${esc(p.name)}</strong><small>${money(p.price)} each</small></div>
          <div class="qty-control">
            <button data-qty="${p.id}" data-delta="-1">−</button>
            <strong>${line.qty}</strong>
            <button data-qty="${p.id}" data-delta="1">+</button>
          </div>
          <strong>${money(p.price*line.qty)}</strong>
          <button class="small-button danger" data-remove-cart="${p.id}">Remove</button>
        </div>`;
    }).join(""):`<div class="empty-state">Your cart is empty. Explore our flowers to get started.</div>`;

    $("cartSummary").classList.toggle("hidden",!cart.length);
    $("cartSummary").innerHTML=cart.length?`
      <div class="cart-total"><span>Total</span><span>${money(cartTotal())}</span></div>
      <p class="muted">Payment method: Cash on Delivery (COD)</p>
      <button class="button button-dark full-width" id="checkoutButton">Proceed to checkout</button>
    `:"";
    renderHeader();
  }

  function updateQty(pid,delta){
    const line=cart.find(x=>x.productId===pid);
    const product=products.find(x=>x.id===pid);
    if(!line||!product)return;
    const next=line.qty+delta;
    if(next<1)cart=cart.filter(x=>x.productId!==pid);
    else if(next<=product.stock)line.qty=next;
    else toast("Not enough stock available.");
    save(KEYS.cart,cart);
    renderCart();
  }

  function placeOrder(event){
    event.preventDefault();
    if(!currentUser())return toast("Please log in first.");
    for(const line of cart){
      const p=products.find(x=>x.id===line.productId);
      if(!p||p.stock<line.qty){
        return toast("A cart item no longer has enough stock. Review your cart.");
      }
    }
    if(!cart.length)return toast("Your cart is empty.");

    const customer=currentUser();
    const order={
      id:makeId("PV-"),
      userId:customer.id,
      customerName:customer.name,
      email:customer.email,
      phone:$("checkoutPhone").value.trim(),
      address:$("checkoutAddress").value.trim(),
      notes:$("checkoutNotes").value.trim(),
      items:cart.map(line=>{
        const p=products.find(x=>x.id===line.productId);
        return {productId:p.id,name:p.name,price:p.price,qty:line.qty};
      }),
      total:cartTotal(),
      payment:"Cash on Delivery (COD)",
      status:"Pending",
      createdAt:new Date().toISOString()
    };
    order.items.forEach(item=>{
      products.find(p=>p.id===item.productId).stock-=item.qty;
    });
    orders.unshift(order);
    cart=[];
    persistAll();
    $("checkoutDialog").close();
    $("checkoutForm").reset();
    renderHeader();
    renderShop();
    renderCart();
    renderCustomerOrders();
    toast("Order placed successfully.");
    showPage("orders");
  }

  function renderCustomerOrders(){
    const user=currentUser();
    const mine=orders.filter(o=>o.userId===user?.id);
    $("customerOrders").innerHTML=mine.length?mine.map(o=>`
      <article class="data-card">
        <div class="section-heading">
          <div><strong>${esc(o.id)}</strong><div class="muted">${dateText(o.createdAt)}</div></div>
          <strong>${esc(o.status)}</strong>
        </div>
        <p>${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join("<br>")}</p>
        <div class="cart-total"><span>Total · COD</span><span>${money(o.total)}</span></div>
      </article>
    `).join(""):`<div class="empty-state">You have no orders yet.</div>`;
  }

  function showAdminSection(name){
    document.querySelectorAll(".admin-section").forEach(el=>el.classList.remove("active"));
    $("admin"+name[0].toUpperCase()+name.slice(1))?.classList.add("active");
    document.querySelectorAll(".admin-nav-link").forEach(el=>
      el.classList.toggle("active",el.dataset.adminSection===name)
    );
    if(name==="overview")renderOverview();
    if(name==="products")renderAdminProducts();
    if(name==="orders")renderAdminOrders();
    if(name==="customers")renderCustomers();
    if(name==="receipts")renderReceipts();
    if(name==="settings")renderSettings();
  }

  function openAdmin(){
    if(!admin){
      $("adminSetupDialog").showModal();
      return;
    }
    if(!isAdmin()){
      const password=prompt("Enter your admin password:");
      if(password===null)return;
      if(password!==admin.password)return toast("Incorrect admin password.");
      session={type:"admin"};
      save(KEYS.session,session);
    }
    document.querySelectorAll("main>.page").forEach(el=>el.classList.remove("active"));
    $("adminPage").classList.add("active");
    renderHeader();
    showAdminSection("overview");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function renderOverview(){
    const revenue=orders.reduce((sum,o)=>sum+o.total,0);
    $("overviewStats").innerHTML=[
      ["Products",products.length],
      ["Orders",orders.length],
      ["Customers",users.length],
      ["Order total",money(revenue)]
    ].map(([label,value])=>`
      <div class="stat-card"><span>${label}</span><strong>${value}</strong></div>
    `).join("");
    $("recentOrders").innerHTML=orders.slice(0,5).map(o=>`
      <div class="order-row">
        <div class="row-main"><strong>${esc(o.id)} · ${esc(o.customerName)}</strong><small>${dateText(o.createdAt)}</small></div>
        <strong>${money(o.total)}</strong><span class="muted">${esc(o.status)}</span>
      </div>
    `).join("")||`<p class="muted">No orders yet.</p>`;
  }

  function renderAdminProducts(){
    const q=($("adminProductSearch").value||"").toLowerCase();
    const list=products.filter(p=>p.name.toLowerCase().includes(q));
    $("adminProductList").innerHTML=list.map(p=>`
      <div class="inventory-row">
        <div class="row-main"><strong>${esc(p.name)}</strong><small>${money(p.price)} · Stock: ${p.stock} · ${esc(p.category)}</small></div>
        <div class="row-actions">
          <button class="small-button" data-edit-product="${p.id}">Edit</button>
          <button class="small-button danger" data-delete-product="${p.id}">Delete</button>
        </div>
      </div>
    `).join("")||`<p class="muted">No products found.</p>`;
  }

  function clearProductForm(){
    $("productForm").reset();
    $("editProductId").value="";
    pendingImage="";
    $("imagePreview").src="";
    $("imagePreview").classList.add("hidden");
    $("productFormTitle").textContent="Add a product";
    $("saveProductButton").textContent="Add product";
  }

  function editProduct(pid){
    const p=products.find(x=>x.id===pid);
    if(!p)return;
    $("editProductId").value=p.id;
    $("productName").value=p.name;
    $("productPrice").value=p.price;
    $("productStock").value=p.stock;
    $("productCategory").value=p.category;
    $("productDescription").value=p.description||"";
    pendingImage=p.image||"";
    if(pendingImage){
      $("imagePreview").src=pendingImage;
      $("imagePreview").classList.remove("hidden");
    }else $("imagePreview").classList.add("hidden");
    $("productFormTitle").textContent="Edit product";
    $("saveProductButton").textContent="Update product";
    $("productForm").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function saveProduct(event){
    event.preventDefault();
    const pid=$("editProductId").value;
    const name=$("productName").value.trim();
    const price=Number($("productPrice").value);
    const stock=Number($("productStock").value);
    const category=$("productCategory").value.trim();

    if(!name||!category||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0)
      return toast("Please enter valid product details.");
    if(products.some(p=>p.id!==pid&&p.name.toLowerCase()===name.toLowerCase()))
      return toast("A product with this name already exists.");

    const old=products.find(p=>p.id===pid);
    const item={
      id:pid||makeId("p"),
      name,price,stock,category,
      description:$("productDescription").value.trim(),
      emoji:old?.emoji||"💐",
      image:pendingImage
    };
    if(old)products=products.map(p=>p.id===pid?item:p);
    else products.unshift(item);

    save(KEYS.products,products);
    clearProductForm();
    renderAdminProducts();
    renderShop();
    toast(old?"Product updated.":"Product added.");
  }

  function deleteProduct(pid){
    const p=products.find(x=>x.id===pid);
    if(!p||!confirm(`Delete "${p.name}"?`))return;
    products=products.filter(x=>x.id!==pid);
    cart=cart.filter(x=>x.productId!==pid);
    persistAll();
    renderAdminProducts();
    renderShop();
    toast("Product deleted.");
  }

  function renderAdminOrders(){
    $("adminOrderList").innerHTML=orders.map(o=>`
      <article class="data-card">
        <div class="order-row">
          <div class="row-main"><strong>${esc(o.id)} · ${esc(o.customerName)}</strong><small>${dateText(o.createdAt)} · ${esc(o.phone||"")}</small></div>
          <strong>${money(o.total)}</strong><span class="muted">${esc(o.status)}</span>
        </div>
        <p class="muted">${esc(o.address)}</p>
        <p>${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join("<br>")}</p>
        <div class="row-actions">
          <select aria-label="Order status" data-order-status="${o.id}">
            ${["Pending","Processing","Ready for delivery","Completed","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}
          </select>
          <button class="small-button" data-print-receipt="${o.id}">Print receipt</button>
        </div>
        <small class="muted">Payment: ${esc(o.payment)}</small>
      </article>
    `).join("")||`<div class="empty-state">No orders have been placed.</div>`;
  }

  function renderCustomers(){
    $("adminCustomerList").innerHTML=users.map(u=>`
      <div class="customer-row">
        <div class="row-main"><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></div>
        <span class="muted">${orders.filter(o=>o.userId===u.id).length} order(s)</span>
      </div>
    `).join("")||`<div class="empty-state">No registered customers yet.</div>`;
  }

  function renderReceipts(){
    $("receiptList").innerHTML=orders.map(o=>`
      <div class="receipt-row">
        <div class="row-main"><strong>${esc(o.id)}</strong><small>${esc(o.customerName)} · ${dateText(o.createdAt)}</small></div>
        <strong>${money(o.total)}</strong>
        <button class="small-button" data-print-receipt="${o.id}">Print receipt</button>
      </div>
    `).join("")||`<div class="empty-state">Receipts will appear after customers place orders.</div>`;
  }

  function receiptHtml(o){
    return `<div style="font-family:Arial,sans-serif;max-width:650px;margin:30px auto;color:#333">
      <h1>${esc(settings.storeName)}</h1><p>Order receipt</p><hr>
      <p><b>Receipt:</b> ${esc(o.id)}<br><b>Date:</b> ${dateText(o.createdAt)}<br>
      <b>Customer:</b> ${esc(o.customerName)}<br><b>Contact:</b> ${esc(o.phone)}<br>
      <b>Address:</b> ${esc(o.address)}</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><th align="left">Item</th><th>Qty</th><th align="right">Price</th></tr>
        ${o.items.map(i=>`<tr><td style="padding:8px 0">${esc(i.name)}</td><td align="center">${i.qty}</td><td align="right">${money(i.price*i.qty)}</td></tr>`).join("")}
      </table><hr><h2 style="text-align:right">Total: ${money(o.total)}</h2>
      <p>Payment method: Cash on Delivery (COD)</p><p>Thank you for shopping with us!</p>
    </div>`;
  }

  function printReceipt(orderId){
    const o=orders.find(x=>x.id===orderId);
    if(!o)return;
    const win=window.open("","_blank","width=750,height=700");
    if(!win)return toast("Please allow pop-ups to print receipts.");
    win.document.write(`<!doctype html><html><head><title>Receipt ${esc(o.id)}</title></head><body>${receiptHtml(o)}<script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  }

  function renderSettings(){
    $("settingStoreName").value=settings.storeName;
    $("settingAdminName").value=settings.adminName;
    $("settingContactEmail").value=settings.contactEmail||"";
  }

  function logout(){
    session=null;
    save(KEYS.session,null);
    renderHeader();
    showPage("shop");
    toast("You have logged out.");
  }

  function bindEvents(){
    document.addEventListener("click",event=>{
      const page=event.target.closest("[data-page]");
      if(page){event.preventDefault();showPage(page.dataset.page);}

      const add=event.target.closest("[data-add-cart]");
      if(add)addToCart(add.dataset.addCart);

      const qty=event.target.closest("[data-qty]");
      if(qty)updateQty(qty.dataset.qty,Number(qty.dataset.delta));

      const remove=event.target.closest("[data-remove-cart]");
      if(remove){
        cart=cart.filter(x=>x.productId!==remove.dataset.removeCart);
        save(KEYS.cart,cart);
        renderCart();
      }

      const adminTab=event.target.closest("[data-admin-section]");
      if(adminTab)showAdminSection(adminTab.dataset.adminSection);

      const edit=event.target.closest("[data-edit-product]");
      if(edit)editProduct(edit.dataset.editProduct);

      const del=event.target.closest("[data-delete-product]");
      if(del)deleteProduct(del.dataset.deleteProduct);

      const print=event.target.closest("[data-print-receipt]");
      if(print)printReceipt(print.dataset.printReceipt);

      const toggle=event.target.closest("[data-toggle-password]");
      if(toggle){
        const input=$(toggle.dataset.togglePassword);
        input.type=input.type==="password"?"text":"password";
      }

      const close=event.target.closest("[data-close-dialog]");
      if(close)$(close.dataset.closeDialog).close();

      if(event.target.matches("[data-scroll-products]"))
        $("productsSection").scrollIntoView({behavior:"smooth"});

      if(event.target.id==="checkoutButton"){
        const user=currentUser();
        $("checkoutName").value=user?.name||"";
        $("checkoutDialog").showModal();
      }
    });

    $("productSearch").addEventListener("input",renderShop);
    $("adminProductSearch").addEventListener("input",renderAdminProducts);

    $("accountButton").addEventListener("click",()=>{
      currentUser()?logout():showPage("login");
    });
    $("adminOpenButton").addEventListener("click",openAdmin);
    $("adminLogout").addEventListener("click",logout);

    $("showRegister").addEventListener("click",()=>{
      $("loginForm").classList.add("hidden");
      $("registerForm").classList.remove("hidden");
    });
    $("showLogin").addEventListener("click",()=>{
      $("registerForm").classList.add("hidden");
      $("loginForm").classList.remove("hidden");
    });

    $("loginForm").addEventListener("submit",event=>{
      event.preventDefault();
      const identity=$("loginIdentity").value.trim().toLowerCase();
      const password=$("loginPassword").value;
      const user=users.find(u=>u.email.toLowerCase()===identity&&u.password===password);
      if(!user)return toast("Incorrect email or password.");
      session={type:"customer",id:user.id};
      save(KEYS.session,session);
      renderHeader();
      showPage("shop");
      toast("Welcome back!");
    });

    $("registerForm").addEventListener("submit",event=>{
      event.preventDefault();
      const name=$("registerName").value.trim();
      const email=$("registerEmail").value.trim().toLowerCase();
      const password=$("registerPassword").value;
      if(users.some(u=>u.email.toLowerCase()===email))
        return toast("This email is already registered.");
      const user={id:makeId("u"),name,email,password,createdAt:new Date().toISOString()};
      users.push(user);
      session={type:"customer",id:user.id};
      persistAll();
      renderHeader();
      showPage("shop");
      toast("Account created successfully.");
    });

    $("checkoutForm").addEventListener("submit",placeOrder);
    $("productForm").addEventListener("submit",saveProduct);
    $("cancelProductEdit").addEventListener("click",clearProductForm);

    $("productImage").addEventListener("change",event=>{
      const file=event.target.files[0];
      if(!file)return;
      if(!file.type.startsWith("image/"))return toast("Please choose an image file.");
      if(file.size>1.5*1024*1024){
        event.target.value="";
        return toast("Image must be 1.5 MB or smaller.");
      }
      const reader=new FileReader();
      reader.onload=()=>{
        pendingImage=reader.result;
        $("imagePreview").src=pendingImage;
        $("imagePreview").classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });

    $("adminOrderList").addEventListener("change",event=>{
      if(event.target.matches("[data-order-status]")){
        const order=orders.find(x=>x.id===event.target.dataset.orderStatus);
        if(order){
          order.status=event.target.value;
          save(KEYS.orders,orders);
          renderAdminOrders();
          renderOverview();
          toast("Order status updated.");
        }
      }
    });

    $("settingsForm").addEventListener("submit",event=>{
      event.preventDefault();
      settings={
        ...settings,
        storeName:$("settingStoreName").value.trim(),
        adminName:$("settingAdminName").value.trim(),
        contactEmail:$("settingContactEmail").value.trim()
      };
      save(KEYS.settings,settings);
      toast("Settings saved.");
    });

    $("adminPasswordForm").addEventListener("submit",event=>{
      event.preventDefault();
      if($("currentAdminPassword").value!==admin.password)
        return toast("Current password is incorrect.");
      if($("newAdminPassword").value!==$("confirmAdminPassword").value)
        return toast("New passwords do not match.");
      admin.password=$("newAdminPassword").value;
      save(KEYS.admin,admin);
      $("adminPasswordForm").reset();
      toast("Admin password updated.");
    });

    $("adminSetupForm").addEventListener("submit",event=>{
      event.preventDefault();
      const password=$("setupAdminPassword").value;
      if(password!==$("setupAdminConfirm").value)
        return toast("Passwords do not match.");
      if(password.length<8)return toast("Use at least 8 characters.");

      admin={
        password,
        name:$("setupAdminName").value.trim()||"Administrator"
      };
      settings.adminName=admin.name;
      save(KEYS.admin,admin);
      save(KEYS.settings,settings);
      $("adminSetupDialog").close();

      session={type:"admin"};
      save(KEYS.session,session);
      renderHeader();

      document.querySelectorAll("main>.page").forEach(el=>el.classList.remove("active"));
      $("adminPage").classList.add("active");
      showAdminSection("overview");
      toast("Admin access created.");
    });
  }

  function init(){
    if(session?.type==="customer"&&!users.some(u=>u.id===session.id)){
      session=null;
      save(KEYS.session,null);
    }
    if(session?.type==="admin"&&!admin){
      session=null;
      save(KEYS.session,null);
    }

    $("adminSetupDialog").addEventListener("cancel",event=>event.preventDefault());
    bindEvents();
    renderHeader();
    renderShop();

    if(isAdmin()){
      document.querySelectorAll("main>.page").forEach(el=>el.classList.remove("active"));
      $("adminPage").classList.add("active");
      showAdminSection("overview");
    }else{
      showPage("shop");
    }
  }

  init();
})();
