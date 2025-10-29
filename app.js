const tg = window.Telegram.WebApp;
tg.expand();

const CONTACT_USERNAME = "pssv2"; // <-- remplace ça (sans @)

// Éléments
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

let ALL = [], cats = [], brands = [];
let current = { cat: "Toutes", brand: "Toutes" };
let CART = JSON.parse(localStorage.getItem("cart") || "[]");
updateCartCount();

// Charge les produits
fetch("products.json")
  .then(r => r.json())
  .then(list => {
    ALL = list;
    // On force l'ordre et l'existence des 2 catégories principales
    const detectedCats = [...new Set(list.map(p => p.category))];
    cats = ["Toutes", "Personnalisable", "Préfait", ...detectedCats.filter(c => !["Personnalisable","Préfait"].includes(c))];
    brands = ["Toutes", ...new Set(list.map(p => p.brand || "—"))];
    render();
  });

// Rendu grille
function render() {
  catBtn.textContent = `${current.cat === "Toutes" ? "Toutes les catégories" : current.cat} ▾`;
  brandBtn.textContent = `${current.brand === "Toutes" ? "Toutes les marques" : current.brand} ▾`;

  const items = ALL.filter(p =>
    (current.cat === "Toutes" || p.category === current.cat) &&
    (current.brand === "Toutes" || (p.brand || "—") === current.brand)
  );

  grid.innerHTML = items.map(cardHTML).join("");
  document.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => openSheet(el.dataset.id));
  });
}

function cardHTML(p) {
  const price = p.price != null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(p.price) : "";
  return `
    <article class="card" data-id="${p.id}">
      <img src="${p.img}" alt="${p.name}" />
      <div class="content">
        ${(p.badges || []).slice(0,1).map(b => `<span class="badge">${b}</span>`).join("")}
        <div class="title">${p.name}</div>
        <div class="subtitle">${p.brand || ""}</div>
        <div class="price">${price}</div>
      </div>
    </article>
  `;
}

// Filtres
catBtn.onclick = () => openPicker("Catégories", cats, v => { current.cat = v; render(); });
brandBtn.onclick = () => openPicker("Marques", brands, v => { current.brand = v; render(); });

function openPicker(title, options, onSelect) {
  const currentVal = title === "Catégories" ? current.cat : current.brand;
  picker.innerHTML = `
    <h4 style="margin:6px 8px 8px;color:var(--muted);font-size:14px;">${title}</h4>
    ${options.map(v => `<button class="opt ${v===currentVal?"active":""}">${v}</button>`).join("")}
  `;
  picker.hidden = false;
  picker.querySelectorAll(".opt").forEach(btn => {
    btn.onclick = () => { picker.hidden = true; onSelect(btn.textContent); };
  });
}

// Fiche produit
let currentProduct = null;

function openSheet(id) {
  const p = ALL.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;

  pTitle.textContent = p.name;
  pImg.src = p.img;
  pBrand.textContent = p.brand || "";
  pBadges.innerHTML = (p.badges || []).map(b => `<span class="badge">${b}</span>`).join("");
  pDesc.textContent = p.desc || "";
  pPrice.textContent = p.price != null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(p.price) : "";

  // Champs dynamiques si personnalisable
  renderCustomFields(p);

  // Bouton d’action
  if (p.customizable) {
    askBtn.textContent = "Commander (personnalisé)";
    askBtn.onclick = () => sendCustomOrder(p);
  } else {
    askBtn.textContent = "Ajouter au panier";
    askBtn.onclick = () => addToCart(p);
  }

  sheet.hidden = false;
}
closeSheet.onclick = () => sheet.hidden = true;

function renderCustomFields(p) {
  customFields.innerHTML = "";
  if (!p.customizable) return;

  // Définition des champs à afficher (depuis products.json)
  const fields = p.inputs || [];
  if (!fields.length) return;

  const wrap = document.createElement("div");
  wrap.style.marginTop = "8px";

  fields.forEach(f => {
    const id = `cf_${p.id}_${f.name}`;
    const label = document.createElement("label");
    label.for = id;
    label.style.display = "block";
    label.style.margin = "8px 0 4px";
    label.textContent = f.label + (f.required ? " *" : "");

    let input;
    if (f.type === "select") {
      input = document.createElement("select");
      input.id = id;
      input.className = "chip";
      input.style.width = "100%";
      (f.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.id = id;
      input.placeholder = f.placeholder || "";
      input.style.width = "100%";
      input.style.minHeight = "70px";
      input.className = "chip";
    } else {
      input = document.createElement("input");
      input.id = id;
      input.type = "text";
      input.placeholder = f.placeholder || "";
      input.className = "chip";
      input.style.width = "100%";
    }

    input.dataset.fieldName = f.name;
    input.dataset.required = f.required ? "1" : "0";

    wrap.appendChild(label);
    wrap.appendChild(input);
  });

  // Aide pour les photos
  const hint = document.createElement("p");
  hint.className = "muted";
  hint.style.marginTop = "8px";
  hint.textContent = "Besoin d’ajouter un logo ou une photo ? Joins-la ensuite directement dans le chat Telegram après avoir cliqué sur Commander.";
  wrap.appendChild(hint);

  customFields.appendChild(wrap);
}

// Ajout panier (pour Préfait)
function addToCart(p) {
  const line = { id: p.id, name: p.name, qty: 1, price: p.price || 0 };
  CART.push(line);
  localStorage.setItem("cart", JSON.stringify(CART));
  updateCartCount();
  tg.HapticFeedback?.impactOccurred("light");
  tg.showPopup?.({ title: "Ajouté", message: `${p.name} ajouté au panier.` });
  sheet.hidden = true;
}

function updateCartCount() {
  cartCount.textContent = CART.length;
}

// Commander (personnalisé) → ouvre le chat avec message pré-rempli
function sendCustomOrder(p) {
  // Récupère les champs saisis
  const inputs = customFields.querySelectorAll("input, textarea, select");
  const lines = [];
  let missing = [];

  inputs.forEach(el => {
    const name = el.dataset.fieldName || el.id;
    const label = el.previousSibling?.textContent?.replace(" *","") || name;
    const val = (el.value || "").trim();
    if (el.dataset.required === "1" && !val) missing.push(label);
    lines.push(`- ${label}: ${val || "—"}`);
  });

  if (missing.length) {
    tg.showPopup?.({ title: "Champs requis", message: `Merci de remplir: ${missing.join(", ")}` });
    return;
  }

  const price = p.price != null ? new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(p.price) : "À deviser";
  const userTag = tg.initDataUnsafe?.user?.username ? `@${tg.initDataUnsafe.user.username}` : "client Telegram";

  const msg =
`Bonjour, demande PERSONNALISÉE :
Produit : ${p.name}
Catégorie : ${p.category}
Prix indicatif : ${price}
Client : ${userTag}

Détails :
${lines.join("\n")}

Pouvez-vous me confirmer le délai et le prix ?`;

  tg.openTelegramLink(`https://t.me/${CONTACT_USERNAME}?text=${encodeURIComponent(msg)}`);
  tg.HapticFeedback?.impactOccurred("light");
  sheet.hidden = true;
}

// Panier → ouvre le chat avec récap (pour Préfait)
cartBtn.onclick = () => {
  if (!CART.length) {
    tg.showPopup?.({ title: "Panier vide", message: "Ajoute des articles préfaits avant de commander." });
    return;
  }
  const total = CART.reduce((s,l) => s + (l.price || 0) * (l.qty || 1), 0);
  const lines = CART.map(l => `• ${l.name}${l.qty>1?` x${l.qty}`:""}${l.price?` — ${new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(l.price)}`:""}`).join("\n");
  const msg =
`Bonjour, je souhaite commander ces articles PRÉFAITS :

${lines}

Total estimé : ${new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(total)}

Merci de me confirmer la disponibilité.`;

  tg.openTelegramLink(`https://t.me/${CONTACT_USERNAME}?text=${encodeURIComponent(msg)}`);
};
