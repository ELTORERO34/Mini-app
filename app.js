// ---- util ----
function formatPrice(v){
  return v!=null
    ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v)
    : "";
}
function showError(msg){
  const el = document.getElementById("error");
  el.textContent = "⚠️ " + msg;
  el.hidden = false;
}

// ---- DOM ----
const grid = document.getElementById("grid");

// ---- charge products.json et rend la grille ----
fetch("./products.json?v=1")
  .then(r => { if(!r.ok) throw new Error("products.json introuvable (404)"); return r.json(); })
  .then(list => {
    if (!Array.isArray(list) || !list.length) {
      throw new Error("products.json vide ou invalide");
    }
    render(list);
  })
  .catch(err => showError(err.message));

function render(products){
  grid.innerHTML = products.map(p => `
    <article class="card">
      <img src="${p.img}" alt="${p.name||""}">
      <div class="content">
        <div class="title">${p.name||"Sans titre"}</div>
        <div class="subtitle">${p.brand||""}</div>
        <div class="price">${formatPrice(p.price)}</div>
      </div>
    </article>
  `).join("");
}

// util si pas déjà présent
function formatPrice(v){ return v!=null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v) : ""; }

const sheet     = document.getElementById("sheet");
const pTitle    = document.getElementById("pTitle");
const pImg      = document.getElementById("pImg");
const pBrand    = document.getElementById("pBrand");
const pDesc     = document.getElementById("pDesc");
const pPrice    = document.getElementById("pPrice");
const addBtn    = document.getElementById("addBtn");
const closeSheet= document.getElementById("closeSheet");

let ALL=[]; // si tu ne l’as pas, garde une copie des produits au render()
let CURRENT=null;

function render(products){
  ALL = products;
  grid.innerHTML = products.map(p => `
    <article class="card" data-id="${p.id}">
      <img src="${p.img}" alt="${p.name||""}">
      <div class="content">
        <div class="title">${p.name||"Sans titre"}</div>
        <div class="subtitle">${p.brand||""}</div>
        <div class="price">${formatPrice(p.price)}</div>
      </div>
    </article>
  `).join("");

  [...grid.querySelectorAll('.card')].forEach(c=>{
    c.onclick = ()=>{
      const p = ALL.find(x=>x.id===c.dataset.id);
      if(!p) return;
      CURRENT = p;
      pTitle.textContent = p.name;
      pImg.src = p.img;
      pBrand.textContent = p.brand || "";
      pDesc.textContent  = p.desc  || "";
      pPrice.textContent = formatPrice(p.price);
      sheet.hidden = false;
    };
  });
}
closeSheet.onclick = ()=> sheet.hidden = true;

<footer class="tabbar">
  <button id="cartBtn" class="chip">🛒 Panier (<span id="cartCount">0</span>)</button>
</footer>

// éléments panier
const cartBtn   = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartSheet = document.getElementById("cartSheet");
const cartList  = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const clearCart = document.getElementById("clearCart");
const closeCart = document.getElementById("closeCart");
const quoteBtn  = document.getElementById("quoteBtn");

// état panier
let CART = JSON.parse(localStorage.getItem("cart") || "[]");
function saveCart(){ localStorage.setItem("cart", JSON.stringify(CART)); updateCartCount(); if(!cartSheet.hidden) renderCart(); }
function updateCartCount(){ cartCount.textContent = CART.reduce((n,l)=> n + (l.qty||1), 0); }
updateCartCount();

// liaison ajout au panier depuis la fiche
addBtn.onclick = ()=>{
  if(!CURRENT) return;
  const i = CART.findIndex(x=>x.id===CURRENT.id);
  if(i>=0) CART[i].qty = (CART[i].qty||1)+1;
  else CART.push({id:CURRENT.id,name:CURRENT.name,price:CURRENT.price||0,img:CURRENT.img,qty:1});
  saveCart();
  sheet.hidden = true;
};

// ouvrir/fermer panier
cartBtn.onclick  = ()=>{ renderCart(); cartSheet.hidden=false; };
closeCart.onclick= ()=> cartSheet.hidden=true;

// rendu panier
function cartTotalValue(){ return CART.reduce((s,l)=> s + (l.price||0)*(l.qty||1), 0); }
function renderCart(){
  if(!CART.length){
    cartList.innerHTML = `<p class="muted">Votre panier est vide.</p>`;
    cartTotal.textContent = formatPrice(0);
    return;
  }
  cartList.innerHTML = CART.map((l,i)=>`
    <div class="cart-item" data-i="${i}">
      <img src="${l.img}" alt="">
      <div class="ci-main">
        <div class="title">${l.name}</div>
        <div class="qty">
          <button class="qminus">−</button>
          <span>${l.qty||1}</span>
          <button class="qplus">+</button>
          <button class="remove">Supprimer</button>
        </div>
      </div>
      <div><strong>${formatPrice((l.price||0)*(l.qty||1))}</strong></div>
    </div>
  `).join("");

  cartTotal.textContent = formatPrice(cartTotalValue());

  cartList.querySelectorAll(".cart-item").forEach(row=>{
    const i = +row.dataset.i, qtyEl = row.querySelector(".qty span");
    row.querySelector(".qplus").onclick  = ()=>{ CART[i].qty=(CART[i].qty||1)+1; qtyEl.textContent=CART[i].qty; saveCart(); };
    row.querySelector(".qminus").onclick = ()=>{ CART[i].qty=Math.max(1,(CART[i].qty||1)-1); qtyEl.textContent=CART[i].qty; saveCart(); };
    row.querySelector(".remove").onclick = ()=>{ CART.splice(i,1); saveCart(); renderCart(); };
  });
});

// vider
clearCart.onclick = ()=>{ if(confirm("Vider le panier ?")){ CART=[]; saveCart(); cartSheet.hidden=true; } };