function openProduct(id){
  document.getElementById('productGrid').style.display = 'none';
  document.getElementById('productDetail').classList.remove('hidden');
}
function closeProduct(){
  document.getElementById('productDetail').classList.add('hidden');
  document.getElementById('productGrid').style.display = 'grid';
}

function inc(id){
  let el = document.getElementById(id);
  el.value = parseInt(el.value) + 1;
}
function dec(id){
  let el = document.getElementById(id);
  if (parseInt(el.value) > 1) el.value = parseInt(el.value) - 1;
}
function addP1(){
  alert("Produit ajouté au panier !");
}
