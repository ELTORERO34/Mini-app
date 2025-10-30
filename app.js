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
