const tg = window.Telegram.WebApp; tg.expand();
const CONTACT_USERNAME = "pssv2"; // <-- remplace
const tg = window.Telegram.WebApp; tg.expand();

/* DOM */
const grid = document.getElementById("grid");
const catBtn = document.getElementById("catBtn");
const brandBtn = document.getElementById("brandBtn");
const picker = document.getElementById("picker");
const sheet = document.getElementById("sheet");
const pTitle = document.getElementById("pTitle");
const pImg = document.getElementById("pImg");
const pBrand = document.getElementById("pBrand");
const pBadges = document.getElementById("pBadges");
const pDesc = document.getElementById("pDesc");
const pPrice = document.getElementById("pPrice");
const askBtn = document.getElementById("askBtn");
const closeSheet = document.getElementById("closeSheet");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartSheet = document.getElementById("cartSheet");
const cartList  = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const closeCart = document.getElementById("closeCart");
const quoteBtn  = document.getElementById("quoteBtn");

/* State */
let ALL = [], cats = [], brands = [];
let current = { cat:"Toutes", brand:"Toutes" };
let CART = JSON.parse(localStorage.getItem("cart") || "[]");
function updateCartCount(){ cartCount.textContent = CART.length; }
updateCartCount();

function showError(msg){
  grid.innerHTML = `<div style="padding:16px;color:#ffb3b3;background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.25);border-radius:12px">⚠️ ${msg}</div>`;
}

/* Charge les produits (anti-cache) */
fetch("./products.json?v=13")
  .then(r => { if(!r.ok) throw new Error("products.json introuvable"); return r.text(); })
  .then(txt => { try { return JSON.parse(txt); } catch(e){ throw new Error("products.json invalide"); } })
  .then(list => {
    if (!Array.isArray(list) || !list.length) throw new Error("products.json vide");
    ALL = list;

    const detectedCats = [...new Set(list.map(p => p.category))];
    cats = ["Toutes", ...detectedCats];
    brands = ["Toutes", ...new Set(list.map(p => p.brand || "—"))];

    render();
  })
  .catch(err => showError(err.message));

/* Rendu */
function render(){
  catBtn.textContent   = `${current.cat   === "Toutes" ? "Toutes les catégories" : current.cat} ▾`;
  brandBtn.textContent = `${current.brand === "Toutes" ? "Toutes les marques"    : current.brand} ▾`;

  const visible = ALL.filter(p =>
    (current.cat === "Toutes"   || p.category === current.cat) &&
    (current.brand === "Toutes" || (p.brand || "—") === current.brand)
  );

  if (!visible.length){
    grid.innerHTML = `<p class="muted" style="text-align:center;padding:24px">Aucun produit pour ce filtre.</p>`;
    return;
  }

  grid.innerHTML = visible.map(p => `
    <article class="card" data-id="${p.id}">
      <img src="${p.img}" alt="${p.name}">
      <div class="content">
        ${(p.badges||[]).slice(0,1).map(b=>`<span class="badge">${b}</span>`).join("")}
        <div class="title">${p.name}</div>
        <div class="subtitle">${p.brand || ""}</div>
        <div class="price">${formatPrice(p.price)}</div>
      </div>
    </article>
  `).join("");

  [...grid.querySelectorAll(".card")].forEach(el => el.onclick = () => openSheet(el.dataset.id));
}

function formatPrice(v){ return v!=null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v) : ""; }

/* Filtres */
catBtn.onclick = () => openPicker("Catégories", cats, v => { current.cat = v; render(); });
brandBtn.onclick = () => openPicker("Marques", brands, v => { current.brand = v; render(); });

function openPicker(title, options, onSelect){
  picker.innerHTML = `<h4 style="margin:6px 8px 8px;color:#9aa0a6">${title}</h4>` +
    options.map(v => `<button class="opt ${v === (title==="Catégories"?current.cat:current.brand) ? "active":""}">${v}</button>`).join("");
  picker.hidden = false;
  picker.querySelectorAll(".opt").forEach(btn => btn.onclick = () => { picker.hidden = true; onSelect(btn.textContent); });
}
function €(v){ return v!=null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v) : ""; }

function cartTotalValue(){
  return CART.reduce((s,l)=> s + (l.price||0)*(l.qty||1), 0);
}

function openCart(){
  renderCart();
  cartSheet.hidden = false;
}

closeCart.onclick = () => { cartSheet.hidden = true; };

function renderCart(){
  if (!CART.length){
    cartList.innerHTML = `<p class="muted">Votre panier est vide.</p>`;
    cartTotal.textContent = "0,00 €";
    return;
  }

  cartList.innerHTML = CART.map((l,i)=>`
    <div class="cart-item" data-i="${i}">
      <img src="${(ALL.find(p=>p.id===l.id)||{}).img || ''}" alt="">
      <div class="ci-main">
        <div class="ci-title">${l.name}</div>
        <p class="ci-meta">${€(l.price)} / unité</p>
        <div class="qty">
          <button class="qminus">−</button>
          <span>${l.qty||1}</span>
          <button class="qplus">+</button>
          <button class="remove">Supprimer</button>
        </div>
      </div>
      <div><strong>${€((l.price||0)*(l.qty||1))}</strong></div>
    </div>
  `).join("");

  cartTotal.textContent = €(cartTotalValue());

  // actions +/−/supprimer
  cartList.querySelectorAll(".cart-item").forEach(row=>{
    const i = Number(row.dataset.i);
    row.querySelector(".qplus").onclick  = ()=>{ CART[i].qty=(CART[i].qty||1)+1; saveCart(); };
    row.querySelector(".qminus").onclick = ()=>{ CART[i].qty=Math.max(1,(CART[i].qty||1)-1); saveCart(); };
    row.querySelector(".remove").onclick = ()=>{ CART.splice(i,1); saveCart(); };
  });
}

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartCount();
  renderCart();
}

// bouton "Demander un devis"
quoteBtn.onclick = () => {
  if (!CART.length){ tg.showPopup?.({title:"Panier vide", message:"Ajoutez des articles avant de demander un devis."}); return; }

  const lines = CART.map(l=>{
    const qty = l.qty||1;
    const sub = (l.price||0)*qty;
    return `• ${l.name} ×${qty} — ${€(sub)}`;
  }).join("\n");

  const total = €(cartTotalValue());
  const user  = tg.initDataUnsafe?.user?.username ? `@${tg.initDataUnsafe.user.username}` : "client Telegram";

  const msg = `Demande de devis – Pssapp\n\n${lines}\n\nTotal estimé : ${total}\nClient : ${user}\n\nPouvez-vous me confirmer la disponibilité et le délai ?`;

  tg.openTelegramLink(`https://t.me/${CONTACT_USERNAME}?text=${encodeURIComponent(msg)}`);
  tg.HapticFeedback?.impactOccurred("light");
  cartSheet.hidden = true;
};
/* Fiche produit */
let currentProduct=null;
function openSheet(id){
  const p = ALL.find(x => x.id === id);
  if(!p) return;
  currentProduct = p;

  pTitle.textContent = p.name;
  pImg.src = p.img;
  pBrand.textContent = p.brand || "";
  pBadges.innerHTML = (p.badges||[]).map(b=>`<span class="badge">${b}</span>`).join("");
  pDesc.textContent = p.desc || "";
  pPrice.textContent = formatPrice(p.price);

  askBtn.onclick = () => { addToCart(p); sheet.hidden = true; };
  sheet.hidden = false;
}
closeSheet.onclick = () => { sheet.hidden = true; document.body.style.overflow="auto"; };

/* Panier */
function addToCart(p){
  CART.push({ id:p.id, name:p.name, price:p.price||0, qty:1 });
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartCount();
}
cartBtn.onclick = () => openCart();
  if(!CART.length){ tg.showPopup?.({title:"Panier vide", message:"Ajoute des produits avant de commander."}); return; }
  const total = CART.reduce((s,l)=> s + (l.price||0)*(l.qty||1), 0);
  tg.showPopup?.({ title:"Panier", message:`Articles: ${CART.length}\nTotal: ${formatPrice(total)}` });
};

