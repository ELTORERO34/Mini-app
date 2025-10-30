/* ===== Utils ===== */
const € = (v) =>
  v != null
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v)
    : "";

/* ===== DOM ===== */
const grid = document.getElementById("grid");
const errorBox = document.getElementById("error");

const cartBtn   = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartSheet = document.getElementById("cartSheet");
const cartList  = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const clearCart = document.getElementById("clearCart");
const closeCart = document.getElementById("closeCart");
const checkout  = document.getElementById("checkout");

/* ===== State ===== */
let ALL = [];
let CART = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartCount();
  if (!cartSheet.hidden) renderCart();
}
function updateCartCount(){
  const count = CART.reduce((n, l) => n + (l.qty || 1), 0);
  cartCount.textContent = String(count);
}
updateCartCount();

/* ===== Charge produits ===== */
fetch("products.json")
  .then(r => { if (!r.ok) throw new Error("Fichier products.json introuvable"); return r.json(); })
  .then(list => {
    if (!Array.isArray(list) || !list.length) throw new Error("Aucun produit");
    ALL = list;
    renderProducts(list);
  })
  .catch(err => {
    errorBox.textContent = "⚠️ " + err.message;
    errorBox.hidden = false;
  });

/* ===== Rendu grille ===== */
function renderProducts(list){
  grid.innerHTML = list.map(p => `
    <div class="card" data-id="${p.id}">
      <img src="${p.img}" alt="${p.name}">
      <div class="info">
        <h3>${p.name}</h3>
        <p>${p.brand || ""}</p>
        <p class="price">${€(p.price)}</p>
        <button class="add-btn">Ajouter</button>
      </div>
    </div>
  `).join("");

  // bind "Ajouter"
  [...grid.querySelectorAll(".card")].forEach(card=>{
    const id = card.dataset.id;
    const p  = ALL.find(x=>x.id===id);
    const btn = card.querySelector(".add-btn");
    btn.onclick = ()=>{
      const i = CART.findIndex(x=>x.id===p.id);
      if (i >= 0) CART[i].qty = (CART[i].qty||1) + 1;
      else CART.push({ id:p.id, name:p.name, price:p.price||0, img:p.img, qty:1 });
      saveCart();
    };
  });
}

/* ===== Panneau panier ===== */
cartBtn.onclick  = () => { renderCart(); cartSheet.hidden = false; };
closeCart.onclick= () => { cartSheet.hidden = true; };

function cartTotalValue(){
  return CART.reduce((s, l) => s + (l.price||0) * (l.qty||1), 0);
}

function renderCart(){
  if (!CART.length){
    cartList.innerHTML = `<p style="opacity:.7">Votre panier est vide.</p>`;
    cartTotal.textContent = €(0);
    return;
  }

  cartList.innerHTML = CART.map((l,i)=>`
    <div class="cart-item" data-i="${i}">
      <img src="${l.img}" alt="">
      <div class="ci-main">
        <div class="ci-title">${l.name}</div>
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

  cartList.querySelectorAll(".cart-item").forEach(row=>{
    const i = +row.dataset.i;
    const qtyEl = row.querySelector(".qty span");

    row.querySelector(".qplus").onclick  = ()=>{
      CART[i].qty = (CART[i].qty||1) + 1;
      qtyEl.textContent = CART[i].qty;
      saveCart();
    };
    row.querySelector(".qminus").onclick = ()=>{
      CART[i].qty = Math.max(1, (CART[i].qty||1) - 1);
      qtyEl.textContent = CART[i].qty;
      saveCart();
    };
    row.querySelector(".remove").onclick = ()=>{
      CART.splice(i,1);
      saveCart();
      renderCart();
    };
  });
}

/* Vider */
clearCart.onclick = ()=>{
  if (!CART.length) return;
  if (confirm("Vider le panier ?")){
    CART = [];
    saveCart();
    cartSheet.hidden = true;
  }
};

/* Continuer (placeholder) */
checkout.onclick = ()=>{
  alert("Prochaine étape : devis Telegram.");
};