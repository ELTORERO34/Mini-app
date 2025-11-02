/* ====== Configuration ====== */
const CONFIG = {
  CHANNEL_URL: "https://t.me/ton_canal_telegram",
  CONTACT_USERNAME: "ton_compte_telegram", // sans @ ici
  CURRENCY: "EUR",
  LOCALE: "fr-FR",
};

/* ====== Dataset Produits ======
   - si minPrice est null => "Sur devis"
   - leadTime pour l’affichage
   - options selon le besoin (select simple)
*/
const PRODUCTS = [
  {
    id: "tableaux",
    title: "Tableaux personnalisés",
    desc: "Impression et finitions premium. Formats variés.",
    minPrice: null, // sur devis
    leadTime: "Délais selon format",
    options: [],
  },
  {
    id: "pochons",
    title: "Pochons personnalisés",
    desc: "Sérigraphie/étiquetage. Deux tailles.",
    minPrice: null,
    leadTime: "Lot & taille",
    options: [
      { key: "taille", label: "Taille", choices: ["8×11 cm", "8×13 cm"] },
    ],
  },
  {
    id: "etiquettes",
    title: "Étiquettes personnalisées",
    desc: "Bobines / planches. Découpe aux dimensions.",
    minPrice: null,
    leadTime: "Selon quantité",
    options: [],
  },
  {
    id: "cartes",
    title: "Cartes de visite / fidélité",
    desc: "Papier épais, vernis/soft touch en option.",
    minPrice: null,
    leadTime: "48–72h selon finitions",
    options: [],
  },
  {
    id: "fusees15",
    title: "Fusées 1,5 ml",
    desc: "Conditionnement échantillon (1,5 ml).",
    minPrice: null,
    leadTime: "Selon stock",
    options: [],
  },
  {
    id: "design_basic",
    title: "Design personnalisé – Basique",
    desc: "Mise en page propre, retouches légères.",
    minPrice: 40,
    leadTime: "2–3 jours",
    options: [],
  },
  {
    id: "design_premium",
    title: "Design personnalisé – Premium",
    desc: "Dessin/illustration sur mesure.",
    minPrice: 180,
    leadTime: "4–5 jours",
    options: [],
  },
];

/* ====== Helpers ====== */
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const € = (n) => new Intl.NumberFormat(CONFIG.LOCALE, { style: "currency", currency: CONFIG.CURRENCY }).format(n ?? 0);

const getLS = (k, f) => { try{ return JSON.parse(localStorage.getItem(k)) ?? f; }catch{ return f; } }
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ====== État Panier ====== */
let CART = getLS("gs_cart", []); // [{id,title,options:{...},qty,unitMinPrice}]
const saveCart = () => setLS("gs_cart", CART);

function cartCount(){ return CART.reduce((a,i)=>a+Number(i.qty||0),0); }
function cartTotal(){
  // total = somme des minPrice connus * qty
  return CART.reduce((a,i)=> a + (i.unitMinPrice ? i.unitMinPrice * i.qty : 0), 0);
}

/* ====== UI init ====== */
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  renderProducts();
  wireDock();
  wireModal();
  wireLinks();

  refreshDock();
});

/* ====== Onglets ====== */
function setupTabs(){
  document.querySelectorAll(".tab-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
      document.getElementById(tab).classList.add("active");
    });
  });
}

/* ====== Catalogue ====== */
function renderProducts(){
  const wrap = document.getElementById("products");
  const tpl = document.getElementById("productTpl");
  wrap.innerHTML = "";

  PRODUCTS.forEach(p=>{
    const node = tpl.content.cloneNode(true);
    node.querySelector(".product-title").textContent = p.title;
    node.querySelector(".product-desc").textContent = p.desc;
    node.querySelector(".min-price").textContent = p.minPrice != null ? `Min: ${€(p.minPrice)}` : "Prix: sur devis";
    node.querySelector(".lead-time").textContent = `Délai: ${p.leadTime}`;

    const optWrap = node.querySelector(".product-options");
    if (p.options?.length){
      p.options.forEach(o=>{
        const selId = `${p.id}_${o.key}`;
        const label = document.createElement("label");
        label.className = "pill";
        label.style.display = "inline-flex";
        label.style.alignItems = "center";
        label.style.gap = "6px";
        label.textContent = o.label + ": ";
        const select = document.createElement("select");
        select.id = selId;
        select.className = "opt-select";
        o.choices.forEach(c=>{
          const op = document.createElement("option");
          op.value = c; op.textContent = c;
          select.appendChild(op);
        });
        label.appendChild(select);
        optWrap.appendChild(label);
      });
    }

    const qtyInput = node.querySelector(".qty-input");
    node.querySelector(".qty-btn.dec").addEventListener("click", ()=>{ qtyInput.value = Math.max(1, (parseInt(qtyInput.value)||1)-1) });
    node.querySelector(".qty-btn.inc").addEventListener("click", ()=>{ qtyInput.value = (parseInt(qtyInput.value)||1)+1 });

    node.querySelector(".add-to-cart").addEventListener("click", ()=>{
      const qty = Math.max(1, parseInt(qtyInput.value)||1);
      const chosen = {};
      p.options?.forEach(o=>{
        const val = document.getElementById(`${p.id}_${o.key}`)?.value;
        if (val) chosen[o.key] = val;
      });
      addToCart({
        id: p.id,
        title: p.title,
        options: chosen,
        qty,
        unitMinPrice: p.minPrice ?? null
      });
    });

    wrap.appendChild(node);
  });
}

/* ====== Panier ====== */
function addToCart(item){
  // merge si même id + mêmes options
  const idx = CART.findIndex(i => i.id===item.id && JSON.stringify(i.options)===JSON.stringify(item.options));
  if (idx>=0){ CART[idx].qty += item.qty; }
  else { CART.push(item); }
  saveCart();
  refreshDock();
  toast("Ajouté au panier");
}

function refreshDock(){
  document.getElementById("cartCount").textContent = cartCount();
  document.getElementById("cartTotal").textContent = €(cartTotal());
}

/* ====== Modal Panier ====== */
function wireModal(){
  const modal = document.getElementById("cartModal");
  document.getElementById("viewCart").addEventListener("click", ()=> openModal());
  document.getElementById("closeCart").addEventListener("click", ()=> closeModal());
  document.getElementById("clearCart").addEventListener("click", ()=> { CART=[]; saveCart(); renderCart(); refreshDock(); });
  document.getElementById("askQuote").addEventListener("click", sendQuote);
  document.getElementById("askQuoteModal").addEventListener("click", sendQuote);

  function openModal(){ renderCart(); modal.classList.remove("hidden"); modal.setAttribute("aria-hidden","false"); }
  function closeModal(){ modal.classList.add("hidden"); modal.setAttribute("aria-hidden","true"); }
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape"&&!modal.classList.contains("hidden")) closeModal(); });

  function renderCart(){
    const box = document.getElementById("cartItems");
    box.innerHTML = "";
    if (CART.length===0){ box.innerHTML = `<p class="item-sub">Votre panier est vide.</p>`; }
    CART.forEach((it, idx)=>{
      const row = document.createElement("div");
      row.className = "cart-item";

      const left = document.createElement("div");
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = it.title;
      const sub = document.createElement("div");
      sub.className = "item-sub";
      const optTxt = Object.keys(it.options||{}).length ? 
        Object.entries(it.options).map(([k,v])=>`${k}: ${v}`).join(" • ") : "—";
      const priceTxt = it.unitMinPrice ? ` | min ${€(it.unitMinPrice)}/u` : " | prix sur devis";
      sub.textContent = `${optTxt}${priceTxt}`;
      left.appendChild(title); left.appendChild(sub);

      const right = document.createElement("div");
      right.className = "item-right";
      const qty = document.createElement("input");
      qty.className = "item-qty"; qty.type="number"; qty.min=1; qty.value = it.qty;
      qty.addEventListener("change", ()=>{
        const v = Math.max(1, parseInt(qty.value)||1);
        CART[idx].qty = v; saveCart(); refreshDock(); renderCart();
      });
      const rm = document.createElement("button");
      rm.className = "btn remove"; rm.textContent = "Suppr.";
      rm.addEventListener("click", ()=>{
        CART.splice(idx,1); saveCart(); refreshDock(); renderCart();
      });

      right.appendChild(qty); right.appendChild(rm);

      row.appendChild(left); row.appendChild(right);
      box.appendChild(row);
    });
    document.getElementById("cartTotalModal").textContent = €(cartTotal());
  }
}

/* ====== Demande de devis ====== */
function sendQuote(){
  if (!CART.length){ return toast("Ajoutez des articles au panier."); }
  // Construire le message
  const lines = [];
  lines.push("🧾 *Demande de devis – Gangster Street Shop*");
  lines.push("");
  CART.forEach((it,i)=>{
    const opts = Object.keys(it.options||{}).length ? Object.entries(it.options).map(([k,v])=>`${k}: ${v}`).join(" • ") : "—";
    const unit = it.unitMinPrice ? €(it.unitMinPrice) : "sur devis";
    lines.push(`${i+1}. ${it.title} × ${it.qty}  | ${unit}/u  | ${opts}`);
  });
  const total = cartTotal();
  lines.push("");
  lines.push(`Total estimé (min connus) : *${€(total)}*`);
  lines.push("_Remarque : certains articles sont sur devis. Le tarif final sera confirmé._");

  const payload = {
    type: "QUOTE_REQUEST",
    cart: CART,
    estTotal: total,
    text: lines.join("\n")
  };

  // Envoi au bot (web_app_data) + retour visuel
  try{
    if (tg){
      tg.sendData(JSON.stringify(payload)); // le bot recevra via web_app_data
      tg.HapticFeedback?.notificationOccurred("success");
      toast("Devis envoyé au bot. Nous revenons vers vous !");
      // Optionnel: fermer la webapp
      // tg.close();
    } else {
      // fallback local
      navigator.clipboard?.writeText(payload.text);
      alert("Telegram WebApp non détectée. Le texte du devis a été copié dans le presse-papiers.");
    }
  }catch(e){
    console.error(e);
    toast("Erreur d’envoi. Réessayez.");
  }
}

/* ====== Dock ====== */
function wireDock(){
  // déjà géré dans wireModal pour boutons
}

/* ====== Liens ====== */
function wireLinks(){
  document.getElementById("openChannel").addEventListener("click", ()=>{
    const url = CONFIG.CHANNEL_URL;
    if (tg) tg.openTelegramLink(url); else window.open(url,"_blank");
  });
  document.getElementById("openContact").addEventListener("click", ()=>{
    const url = `https://t.me/${CONFIG.CONTACT_USERNAME}`;
    if (tg) tg.openTelegramLink(url); else window.open(url,"_blank");
  });
}

/* ====== Toast simple ====== */
let toastTimer = null;
function toast(msg){
  let el = document.getElementById("toast");
  if (!el){
    el = document.createElement("div");
    el.id = "toast";
    el.style.position="fixed"; el.style.left="50%"; el.style.bottom="84px";
    el.style.transform="translateX(-50%)";
    el.style.padding="10px 14px"; el.style.background="#121216";
    el.style.color="#fff"; el.style.border="1px solid #333"; el.style.borderRadius="10px";
    el.style.boxShadow="0 10px 30px rgba(0,0,0,.4)";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity="1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.style.opacity="0"; }, 1800);
}