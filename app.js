const tg = window.Telegram.WebApp;
tg.expand();

const grid = document.getElementById("grid");
const catBtn = document.getElementById("catBtn");
const brandBtn = document.getElementById("brandBtn");
const sheet = document.getElementById("sheet");
const pTitle = document.getElementById("pTitle");
const pImg = document.getElementById("pImg");
const pBrand = document.getElementById("pBrand");
const pBadges = document.getElementById("pBadges");
const pDesc = document.getElementById("pDesc");
const pPrice = document.getElementById("pPrice");
const askBtn = document.getElementById("askBtn");
const cartCount = document.getElementById("cartCount");
const closeSheet = document.getElementById("closeSheet");
const CONTACT_USERNAME = "TonCompteTelegram"; // sans le @

let ALL = [], cats = [], brands = [], current = { cat: "Toutes", brand: "Toutes" }, CART = [];

fetch("products.json")
  .then(r => r.json())
  .then(list => {
    ALL = list;
    cats = ["Toutes", ...new Set(list.map(p => p.category))];
    brands = ["Toutes", ...new Set(list.map(p => p.brand))];
    render();
  });

function render() {
  grid.innerHTML = "";
  ALL.filter(p =>
    (current.cat === "Toutes" || p.category === current.cat) &&
    (current.brand === "Toutes" || p.brand === current.brand)
  ).forEach(p => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <div class="content">
        <div class="title">${p.name}</div>
        <div class="subtitle">${p.brand}</div>
        <div class="price">${p.price}€</div>
      </div>
    `;
    card.onclick = () => openSheet(p);
    grid.appendChild(card);
  });
}

function openSheet(p) {
  pTitle.textContent = p.name;
  pImg.src = p.img;
  pBrand.textContent = p.brand;
  pBadges.innerHTML = (p.badges || []).map(b => `<span class="badge">${b}</span>`).join("");
  pDesc.textContent = p.desc || "";
  pPrice.textContent = p.price + " €";
  askBtn.onclick = () => addToCart(p);
  sheet.hidden = false;
}

closeSheet.onclick = () => sheet.hidden = true;

function addToCart(p) {
  CART.push(p);
  cartCount.textContent = CART.length;
  const message = `Bonjour 👋, je suis intéressé par le produit "${p.name}" (${p.brand})`;
  tg.openTelegramLink(`https://t.me/${CONTACT_USERNAME}?text=${encodeURIComponent(message)}`);
  sheet.hidden = true;
}
