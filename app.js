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
