const grid = document.getElementById("grid");
const errorBox = document.getElementById("error");

// Essaie de charger le fichier products.json
fetch("products.json")
  .then(r => {
    if (!r.ok) throw new Error("Fichier products.json introuvable");
    return r.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error("Format JSON invalide");
    displayProducts(data);
  })
  .catch(err => {
    errorBox.textContent = "⚠️ " + err.message;
    errorBox.hidden = false;
  });

function displayProducts(list) {
  grid.innerHTML = list.map(p => `
    <div class="card">
      <img src="${p.img}" alt="${p.name}">
      <div class="info">
        <h3>${p.name}</h3>
        <p>${p.brand || ""}</p>
        <p><strong>${p.price.toFixed(2)} €</strong></p>
      </div>
    </div>
  `).join("");
}