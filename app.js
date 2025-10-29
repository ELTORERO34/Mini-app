/* === Telegram === */
const tg = window.Telegram.WebApp;
tg.expand();

/* === Config === */
const CONTACT_USERNAME = "pssv2"; // <-- remplace (sans @)

/* === DOM === */
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
const customFields = document.getElementById("customFields");
const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");

/* === State === */
let ALL = [], cats = [], brands = [];
let current = { cat: "Toutes", brand: "Toutes" };
let CART = JSON.parse(localStorage.getItem("cart") || "[]");
updateCartCount();

/* === Utils === */
const € = v => v!=null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v) : "";

/* === Chargement produits (anti-cache + diagnostics) === */
function showError(msg){
  grid.innerHTML = `<div style="padding:16px;color:#ffb3b3;background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.25);border-radius:12px">
  ⚠️ ${msg}
  </div>`;
}

fetch("./products.json?v=10")
  .then(r => { if (!r.ok) throw new Error("products.json introuvable"); return r.text(); })
  .then(txt => { try { return JSON.parse(txt); } catch { throw new Error("products.json invalide"); } })
  .then(list => {
    if (!Array.isArray(list) || !list.length) throw new Error("products.json vide");
    ALL = list;

    // Catégories (force l'ordre avec Personnalisable / Préfait si présents)
    const detCats = [...new Set(list.map(p => p.category))];
    cats = ["Toutes",
      ...["Personnalisable","Préfait"].filter(c => detCats.includes(c)),
      ...detCats.filter(c => !["Personnalisable","Préfait"].includes(c))
    ];
    brands = ["Toutes", ...new Set(list.map(p => p.brand || "—"))];

    render();
  })
  .catch(err => showError(err.message));

/* === Rendu === */
function render(){
  catBtn.textContent = `${current.cat === "Toutes" ? "Toutes les catégories" : current.cat} ▾`;
  brandBtn.textContent = `${current.brand === "Toutes" ? "Toutes les marques" : current.brand} ▾`;

  const visible = ALL.filter(p =>
    (current.cat === "Toutes" || p.category === current.cat) &&
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
        <div class="price">${€(p.price)}</div>
      </div>
    </article>
  `).join("");

  [...grid.querySelectorAll(".card")].forEach(el => {
    el.onclick = () => openSheet(el.dataset.id);
  });
}

/* === Filtres === */
catBtn.onclick = () => openPicker("Catégories", cats, v => { current.cat = v; render(); });
brandBtn.onclick = () => openPicker("Marques", brands, v => { current.brand = v; render(); });

function openPicker(title, options, onSelect){
  picker.innerHTML = `
    <h4 style="margin:6px 8px 8px;color:var(--muted);font-size:14px;">${title}</h4>
    ${options.map(v => `<button class="opt ${v=== (title==="Catégories"?current.cat:current.brand) ? "active":""}">${v}</button>`).join("")}
  `;
  picker.hidden = false;
  picker.querySelectorAll(".opt").forEach(btn => {
    btn.onclick = () => { picker.hidden = true; onSelect(btn.textContent); };
  });
}

/* === Fiche produit === */
let currentProduct = null;

function openSheet(id){
  const p = ALL.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;

  pTitle.textContent = p.name;
  pImg.src = p.img;
  pBrand.textContent = p.brand || "";
  pBadges.innerHTML = (p.badges || []).map(b=>`<span class="badge">${b}</span>`).join("");
  pDesc.textContent = p.desc || "";
  pPrice.textContent = €(p.price);

  renderCustomFields(p);

  if (p.customizable){
    askBtn.textContent = "Commander (personnalisé)";
    askBtn.onclick = () => sendCustomOrder(p);
  } else {
    askBtn.textContent = "Ajouter au panier";
    askBtn.onclick = () => addToCart(p);
  }

  sheet.hidden = false;
}

closeSheet.onclick = () => { sheet.hidden = true; document.body.style.overflow = "auto"; tg.HapticFeedback?.impactOccurred("light"); };

/* Champs dynamiques pour personnalisables */
function renderCustomFields(p){
  customFields.innerHTML = "";
  if (!p.customizable) return;
  const fields = p.inputs || [];
  if (!fields.length) return;

  const wrap = document.createElement("div");
  wrap.style.marginTop = "8px";

  fields.forEach(f=>{
    const id = `cf_${p.id}_${f.name}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.style.display = "block";
    label.style.margin = "8px 0 4px";
    label.textContent = f.label + (f.required ? " *" : "");
    let input;

    if (f.type === "select"){
      input = document.createElement("select");
      (f.options||[]).forEach(opt=>{
        const o = document.createElement("option"); o.value = opt; o.textContent = opt; input.appendChild(o);
      });
    } else if (f.type === "textarea"){
      input = document.createElement("textarea");
      input.style.minHeight = "70px";
      input.placeholder = f.placeholder || "";
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = f.placeholder || "";
    }
    input.id = id;
    input.className = "chip";
    input.style.width = "100%";
    input.dataset.fieldName = f.name;
    input.dataset.required = f.required ? "1" : "0";

    wrap.appendChild(label);
    wrap.appendChild(input);
  });

  const hint = document.createElement("p");
  hint.className = "muted";
  hint.style.marginTop = "8px";
  hint.textContent = "Ajoute ton logo/photo ensuite dans le chat Telegram après avoir cliqué sur Commander.";
  wrap.appendChild(hint);

  customFields.appendChild(wrap);
}

/* Panier (préfaits) */
function addToCart(p){
  CART.push({ id:p.id, name:p.name, price:p.price||0, qty:1 });
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartCount();
  tg.HapticFeedback?.impactOccurred("light");
  tg.showPopup?.({ title:"Ajouté", message:`${p.name} ajouté au panier.` });
  sheet.hidden = true;
}
function updateCartCount(){ cartCount.textContent = CART.length; }

/* Commander (personnalisé) */
function sendCustomOrder(p){
  const inputs = customFields.querySelectorAll("input, textarea, select");
  const lines = []; const missing = [];
  inputs.forEach(el=>{
    const label = el.previousSibling?.textContent?.replace(" *","") || el.dataset.fieldName;
    const val = (el.value||"").trim();
    if (el.dataset.required === "1" && !val) missing.push(label);
    lines.push(`- ${label}: ${val || "—"}`);
  });
  if (missing.length){ tg.showPopup?.({ title:"Champs requis", message:`Merci de remplir: ${missing.join(", ")}` }); return; }

  const userTag = tg.initDataUnsafe?.user?.username ? `@${tg.initDataUnsafe.user.username}` : "client Telegram";
  const msg =
`Bonjour, demande PERSONNALISÉE :
Produit : ${p.name}
Catégorie : ${p.category}
Prix indicatif : ${€(p.price) || "À deviser"}
Client : ${userTag}

Détails :
${lines.join("\n")}

Pouvez-vous me confirmer le délai et le prix ?`;

  tg.openTelegramLink(`https://t.me/${CONTACT_USERNAME}?text=${encodeURIComponent(msg)}`);
  tg.HapticFeedback?.impactOccurred("light");
  sheet.hidden = true;
}

/* Panier → message Telegram */
cartBtn.onclick = () => {
  if (!CART.length){ tg.showPopup?.({ title:"Panier vide", message:"Ajoute des articles préfaits avant de commander." }); return; }
  const total = CART.reduce((s,l)=> s + (l.price||0)*(l.qty||1), 0);
  const lines = CART.map(l => `• ${l.name}${l.qty>1?` x${l.qty}`:""}${l.price?` — ${€(l.price)}`:""}`).join("\n");
  const msg =
`Bonjour, je souhaite commander ces articles PRÉFAITS :

${lines}

Total estimé : ${€(total)}

Merci de me confirmer la disponibilité.`;
  tg.openTelegramLink(`https://t.me/${CONTACT_USERNAME}?text=${encodeURIComponent(msg)}`);
};

