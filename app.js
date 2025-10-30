/* ==== DEBUG VISIBLE ==== */
const dbg = (msg) => {
  let el = document.getElementById("__debug");
  if (!el) {
    el = document.createElement("div");
    el.id = "__debug";
    el.style.cssText = "position:fixed;left:8px;bottom:80px;z-index:99999;background:rgba(0,0,0,.7);color:#0f0;padding:8px 10px;border-radius:8px;font:12px/1.3 monospace;max-width:90vw;white-space:pre-wrap";
    document.body.appendChild(el);
  }
  el.textContent = (el.textContent ? el.textContent + "\n" : "") + msg;
};
window.onerror = (m, s, l) => { alert("Erreur JS: " + m + "\n" + s + ":" + l); dbg("JS ERROR: " + m); };

/* ==== TELEGRAM ==== */
const tg = window.Telegram?.WebApp || {};
try { tg.expand?.(); } catch(e){}

/* ==== CONTACT ==== */
const CONTACT_USERNAME = "pssv2";

/* ==== DOM ==== */
const grid = document.getElementById("grid");
const catBtn = document.getElementById("catBtn");
const brandBtn = document.getElementById("brandBtn");
const picker = document.getElementById("picker");

const sheet = document.getElementById("sheet");
const pTitle = document.getElementById("pTitle");
const pImg   = document.getElementById("pImg");
const pBrand = document.getElementById("pBrand");
const pBadges= document.getElementById("pBadges");
const pDesc  = document.getElementById("pDesc");
const pPrice = document.getElementById("pPrice");
const askBtn = document.getElementById("askBtn");
const closeSheet = document.getElementById("closeSheet");

const cartBtn   = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartSheet = document.getElementById("cartSheet");
const cartList  = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const closeCart = document.getElementById("closeCart");
const quoteBtn  = document.getElementById("quoteBtn");
const clearCart = document.getElementById("clearCart");

/* Sécurité démarrage */
if (sheet) sheet.hidden = true;
if (cartSheet) cartSheet.hidden = true;
if (picker) picker.hidden = true;

dbg("app.js chargé");

/* ==== STATE & UTILS ==== */
let ALL = [], cats = [], brands = [];
let current = { cat:"Toutes", brand:"Toutes" };
let CART = JSON.parse(localStorage.getItem("cart") || "[]");

const € = v => v!=null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v) : "";
const formatPrice = €;
const cartTotalValue = () => CART.reduce((s,l)=> s + (l.price||0)*(l.qty||1), 0);
const updateCartCount = () => cartCount.textContent = CART.reduce((n,l)=> n + (l.qty||1), 0);
const saveCart = () => { localStorage.setItem("cart", JSON.stringify(CART)); updateCartCount(); if(!cartSheet.hidden) renderCart(); };
updateCartCount();

function showError(msg){
  grid.innerHTML = `<div style="padding:16px;color:#ffb3b3;background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.25);border-radius:12px">⚠️ ${msg}</div>`;
  dbg("ERR: " + msg);
}

/* ==== LOAD DATA ==== */
const url = "./products.json?v=29";
dbg("fetch " + url);
fetch(url)
  .then(r => {
    dbg("fetch status " + r.status);
    if (!r.ok) throw new Error("products.json introuvable ("+r.status+")");
    return r.text();
  })
  .then(txt => {
    dbg("len(txt) = " + txt.length);
    try { return JSON.parse(txt); }
    catch(e){ throw new Error("products.json invalide: " + e.message); }
  })
  .then(list => {
    dbg("items = " + (Array.isArray(list) ? list.length : "not array"));
    if (!Array.isArray(list) || !list.length) throw new Error("products.json vide");
    ALL = list;
    cats   = ["Toutes", ...new Set(list.map(p => p.category))];
    brands = ["Toutes", ...new Set(list.map(p => p.brand || "—"))];
    render();
  })
  .catch(err => {
    showError(err.message + "<br>URL test: /Mini-app/products.json");
    // Fallback de secours pour voir l'UI
    ALL = [
      {id:"demo1", name:"Produit démo A", brand:"Demo", category:"Préfait", price:9.9, img:"img/test1.jpg", badges:["Top"], desc:"Item de test"},
      {id:"demo2", name:"Produit démo B", brand:"Demo", category:"Personnalisable", price:19.9, img:"img/test2.jpg", badges:["Nouveau"], desc:"Item de test"}
    ];
    cats=["Toutes","Préfait","Personnalisable"]; brands=["Toutes","Demo"];
    render();
  });

/* ==== RENDER GRID ==== */
function render(){
  dbg("render() - ALL:"+ALL.length);
  catBtn.textContent   = `${current.cat   === "Toutes" ? "Toutes les catégories" : current.cat} ▾`;
  brandBtn.textContent = `${current.brand === "Toutes" ? "Toutes les marques"    : current.brand} ▾`;

  const visible = ALL.filter(p =>
    (current.cat === "Toutes"   || p.category === current.cat) &&
    (current.brand === "Toutes" || (p.brand || "—") === current.brand)
  );
  dbg("visible = " + visible.length);

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

/* ==== FILTERS ==== */
catBtn.onclick   = () => openPicker("Catégories", cats,   v => { current.cat = v; render(); });
brandBtn.onclick = () => openPicker("Marques",    brands, v => { current.brand = v; render(); });

function openPicker(title, options, onSelect){
  picker.innerHTML = `<h4 style="margin:6px 8px 8px;color:#9aa0a6">${title}</h4>` +
    options.map(v => `<button class="opt ${v === (title==="Catégories"?current.cat:current.brand) ? "active":""}">${v}</button>`).join("");
  picker.hidden = false;
  picker.querySelectorAll(".opt").forEach(btn => btn.onclick = () => { picker.hidden = true; onSelect(btn.textContent); });
}

/* ==== PRODUCT SHEET ==== */
let currentProduct = null;
function openSheet(id){
  const p = ALL.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;

  pTitle.textContent = p.name;
  pImg.src = p.img;
  pBrand.textContent = p.brand || "";
  pBadges.innerHTML  = (p.badges||[]).map(b=>`<span class="badge">${b}</span>`).join("");
  pDesc.textContent  = p.desc || "";
  pPrice.textContent = €(p.price);

  askBtn.textContent = "Ajouter au panier";
  askBtn.onclick = () => addToCart(p);

  sheet.hidden = false;
}
closeSheet.onclick = () => { sheet.hidden = true; };

/* ===== PANIER ===== */

// Ouvre le panier
cartBtn.onclick = () => openCart();

// Fonction d'ouverture
function openCart() {
  renderCart();
  cartSheet.hidden = false;
}

// Ferme le panier
closeCart.onclick = () => {
  cartSheet.hidden = true;
};

// Rendu du panier
function renderCart() {
  if (!CART.length) {
    cartList.innerHTML = `<p class="muted">Votre panier est vide.</p>`;
    cartTotal.textContent = "0,00 €";
    return;
  }

  cartList.innerHTML = CART.map((l, i) => `
    <div class="cart-item" data-i="${i}">
      <img src="${(ALL.find(p => p.id === l.id) || {}).img || ''}" alt="">
      <div class="ci-main">
        <div class="ci-title">${l.name}</div>
        <p class="ci-meta">${€(l.price)} / unité</p>
        <div class="qty">
          <button class="qminus">−</button>
          <span>${l.qty || 1}</span>
          <button class="qplus">+</button>
          <button class="remove">Supprimer</button>
        </div>
      </div>
      <div><strong>${€((l.price || 0) * (l.qty || 1))}</strong></div>
    </div>
  `).join("");

  cartTotal.textContent = €(cartTotalValue());

  // Actions + / - / supprimer
  cartList.querySelectorAll(".cart-item").forEach(row => {
    const i = Number(row.dataset.i);
    const qtyEl = row.querySelector(".qty span");

    // +
    row.querySelector(".qplus").onclick = () => {
      CART[i].qty = (CART[i].qty || 1) + 1;
      qtyEl.textContent = CART[i].qty;
      saveCart();
    };

    // -
    row.querySelector(".qminus").onclick = () => {
      CART[i].qty = Math.max(1, (CART[i].qty || 1) - 1);
      qtyEl.textContent = CART[i].qty;
      saveCart();
    };

    // Supprimer
    row.querySelector(".remove").onclick = () => {
      const name = CART[i].name;
      if (tg.showPopup) {
        tg.showPopup({
          title: "Supprimer l'article",
          message: `Retirer « ${name} » du panier ?`,
          buttons: [
            { type: "destructive", id: "yes", text: "Supprimer" },
            { type: "cancel" }
          ]
        }, (btnId) => {
          if (btnId === "yes") { CART.splice(i, 1); saveCart(); }
        });
      } else {
        if (confirm(`Retirer « ${name} » du panier ?`)) {
          CART.splice(i, 1); saveCart();
        }
      }
    };
  });
}

// Vider le panier
clearCart.onclick = () => {
  if (!CART.length) return;
  if (tg.showPopup) {
    tg.showPopup({
      title: "Vider le panier",
      message: "Supprimer tous les articles ?",
      buttons: [
        { type: "destructive", id: "yes", text: "Vider" },
        { type: "cancel" }
      ]
    }, (btnId) => {
      if (btnId === "yes") { CART = []; saveCart(); cartSheet.hidden = true; }
    });
  } else {
    if (confirm("Supprimer tous les articles ?")) {
      CART = [];
      saveCart();
      cartSheet.hidden = true;
    }
  }
};

// Demande de devis
quoteBtn.onclick = () => {
  if (!CART.length) {
    tg.showPopup?.({
      title: "Panier vide",
      message: "Ajoutez des articles avant de demander un devis."
    });
    return;
  }

  const lines = CART.map(l => {
    const qty = l.qty || 1;
    const sub = (l.price || 0) * qty;
    return `• ${l.name} ×${qty} — ${€(sub)}`;
  }).join("\n");

  const total = €(cartTotalValue());
  const user = tg.initDataUnsafe?.user?.username ? `@${tg.initDataUnsafe.user.username}` : "client Telegram";

  const msg = `🧾 *Demande de devis – PochonStore*\n\n${lines}\n\n*Total estimé :* ${total}\n*Client :* ${user}\n\nPouvez-vous me confirmer la disponibilité et le délai ?`;

  tg.openTelegramLink(`https://t.me/pssv2?text=${encodeURIComponent(msg)}`);
  tg.HapticFeedback?.impactOccurred("light");
  cartSheet.hidden = true;
};

// Sauvegarde
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartCount();
  renderCart();
}