(function(){
  // ===== DIAG =====
  function showDiag(msg){
    var d = document.getElementById('diag');
    if(!d) return;
    d.style.display = 'block';
    d.textContent = '⚠️ ' + msg;
  }
  function safe(fn){ try{ fn(); } catch(e){ console.error(e); showDiag(e.message||'Erreur JS'); } }

  // ===== Telegram safe =====
  var tg = null;
  try{
    if (window.Telegram && window.Telegram.WebApp){
      tg = window.Telegram.WebApp;
      tg.expand && tg.expand();
    }
  }catch(e){ /* ignore */ }

  // ===== Config (à adapter) =====
  var CONFIG = {
    CHANNEL_URL: "https://t.me/+BQ5eqgaiZG80MTY0", // <- remplace
    CONTACT_USERNAME: "pssv2",         // <- remplace (sans @)
    CURRENCY: "EUR", LOCALE: "fr-FR"
  };

  // ===== 1 seul produit (exemple) =====
  var PRODUCTS = [
    {
      id: "pochon_8x11",
      title: "Pochon personnalisé 8×11 cm",
      desc: "Sérigraphie 1 face. Couleurs au choix.",
      minPrice: 0.35,               // prix unitaire minimal indicatif (ex.)
      leadTime: "2–3 jours",
      options: [
        { key:"couleur", label:"Couleur", choices:["Noir","Blanc","Rouge","Vert"] },
        { key:"impression", label:"Impression", choices:["1 couleur","2 couleurs"] }
      ]
    }
  ];

  // ===== Utils =====
  function €(n){
    try { return new Intl.NumberFormat(CONFIG.LOCALE,{style:'currency',currency:CONFIG.CURRENCY}).format(n||0); }
    catch(e){ return (n||0).toFixed(2)+' €'; }
  }
  function getLS(k,f){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):f; }catch(e){return f;} }
  function setLS(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  // ===== Panier =====
  var CART = getLS('ps_cart', []); // {id,title,options,qty,unitMinPrice}

  function cartTotal(){
    var t=0; for (var i=0;i<CART.length;i++){ var it=CART[i]; if(it.unitMinPrice){ t+= it.unitMinPrice*it.qty; } }
    return t;
  }

  // ===== Init =====
  document.addEventListener('DOMContentLoaded', function(){
    safe(setupTabs);
    safe(renderProducts);
    safe(wireCartUi);
    safe(wireLinks);
  });

  // ===== Tabs =====
  function setupTabs(){
    var btns = document.querySelectorAll('.tab-btn');
    for (var i=0;i<btns.length;i++){
      (function(btn){
        btn.addEventListener('click', function(){
          var all = document.querySelectorAll('.tab-btn'); for (var j=0;j<all.length;j++) all[j].classList.remove('active');
          btn.classList.add('active');
          var panels = document.querySelectorAll('.tab-panel'); for (var k=0;k<panels.length;k++) panels[k].classList.remove('active');
          var p = document.getElementById(btn.getAttribute('data-tab')); if(p) p.classList.add('active');
        });
      })(btns[i]);
    }
  }

  // ===== Catalogue =====
  function renderProducts(){
    var wrap = document.getElementById('products');
    var tpl = document.getElementById('productTpl');
    if(!wrap || !tpl){ showDiag('Template/zone produits manquants'); return; }
    wrap.innerHTML = '';

    for (var i=0;i<PRODUCTS.length;i++){
      var p = PRODUCTS[i];
      var node = document.importNode(tpl.content, true);
      node.querySelector('.product-title').textContent = p.title;
      node.querySelector('.product-desc').textContent  = p.desc;
      node.querySelector('.min-price').textContent     = (p.minPrice!=null)? ('Min: '+€(p.minPrice)) : 'Prix: sur devis';
      node.querySelector('.lead-time').textContent     = 'Délai: ' + p.leadTime;

      // options
      var optWrap = node.querySelector('.product-options');
      if (p.options && p.options.length){
        for (var oi=0; oi<p.options.length; oi++){
          var o = p.options[oi];
          var selId = p.id + '_' + o.key;

          var label = document.createElement('label');
          label.className = 'pill';
          label.style.display = 'inline-flex'; label.style.alignItems='center'; label.style.gap='6px';
          label.appendChild(document.createTextNode(o.label + ': '));

          var select = document.createElement('select');
          select.id = selId; select.className = 'opt-select';
          for (var ci=0; ci<o.choices.length; ci++){
            var op = document.createElement('option'); op.value=o.choices[ci]; op.textContent=o.choices[ci]; select.appendChild(op);
          }
          label.appendChild(select);
          optWrap.appendChild(label);
        }
      }

      // quantité + ajout
      (function(p, node){
        var qtyInput = node.querySelector('.qty-input');
        node.querySelector('.qty-btn.dec').addEventListener('click', function(){
          var v=parseInt(qtyInput.value||'1',10); if(isNaN(v)) v=1; qtyInput.value=Math.max(1,v-1);
        });
        node.querySelector('.qty-btn.inc').addEventListener('click', function(){
          var v=parseInt(qtyInput.value||'1',10); if(isNaN(v)) v=1; qtyInput.value=v+1;
        });
        node.querySelector('.add-to-cart').addEventListener('click', function(){
          var qty = parseInt(qtyInput.value||'1',10); if(isNaN(qty)||qty<1) qty=1;
          var chosen = {};
          if (p.options){
            for (var oi=0; oi<p.options.length; oi++){
              var o=p.options[oi]; var el=document.getElementById(p.id+'_'+o.key);
              if (el && el.value) chosen[o.key]=el.value;
            }
          }
          addToCart({ id:p.id, title:p.title, options:chosen, qty:qty, unitMinPrice:(p.minPrice!=null? p.minPrice:null) });
        });
      })(p, node);

      wrap.appendChild(node);
    }
  }

  function addToCart(item){
    for (var i=0;i<CART.length;i++){
      var same = (CART[i].id===item.id) && (JSON.stringify(CART[i].options)===JSON.stringify(item.options));
      if (same){ CART[i].qty += item.qty; setLS('ps_cart', CART); toast('Ajouté au panier'); renderCart(); return; }
    }
    CART.push(item); setLS('ps_cart', CART); toast('Ajouté au panier'); renderCart();
  }

  // ===== Modal Panier + FAB =====
  function wireCartUi(){
    var modal = document.getElementById('cartModal');
    var fab   = document.getElementById('cartFab');
    var closeBtn = document.getElementById('closeCart');
    var clearBtn = document.getElementById('clearCart');
    var askBtn   = document.getElementById('askQuoteModal');

    function open(){ renderCart(); modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); }
    function close(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

    if (fab) fab.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (clearBtn) clearBtn.addEventListener('click', function(){ CART=[]; setLS('ps_cart', CART); renderCart(); });
    if (askBtn) askBtn.addEventListener('click', sendQuote);
    window.addEventListener('keydown', function(e){ if(e.key==='Escape' && !modal.classList.contains('hidden')) close(); });
  }

  function renderCart(){
    var box = document.getElementById('cartItems');
    var totalEl = document.getElementById('cartTotalModal');
    if (!box || !totalEl) return;

    box.innerHTML = '';
    if (!CART.length){
      box.innerHTML = '<p class="item-sub">Votre panier est vide.</p>';
    } else {
      for (var i=0;i<CART.length;i++){
        (function(it, idx){
          var row=document.createElement('div'); row.className='cart-item';

          var left=document.createElement('div');
          var title=document.createElement('div'); title.className='item-title'; title.textContent=it.title;
          var sub=document.createElement('div'); sub.className='item-sub';
          var optTxt=(it.options && Object.keys(it.options).length)? Object.keys(it.options).map(function(k){return k+': '+it.options[k]}).join(' • ') : '—';
          var priceTxt= it.unitMinPrice? (' | min '+€(it.unitMinPrice)+'/u') : ' | prix sur devis';
          sub.textContent = optTxt + priceTxt;
          left.appendChild(title); left.appendChild(sub);

          var right=document.createElement('div'); right.className='item-right';
          var qty=document.createElement('input'); qty.className='item-qty'; qty.type='number'; qty.min='1'; qty.value=it.qty;
          qty.addEventListener('change', function(){
            var v=parseInt(qty.value||'1',10); if(isNaN(v)||v<1) v=1; CART[idx].qty=v; setLS('ps_cart', CART); renderCart();
          });
          var rm=document.createElement('button'); rm.className='btn remove'; rm.textContent='Suppr.';
          rm.addEventListener('click', function(){ CART.splice(idx,1); setLS('ps_cart', CART); renderCart(); });

          right.appendChild(qty); right.appendChild(rm);
          row.appendChild(left); row.appendChild(right);
          box.appendChild(row);
        })(CART[i], i);
      }
    }
    totalEl.textContent = €(cartTotal());
  }

  // ===== Devis =====
  function sendQuote(){
    if (!CART.length){ toast('Ajoutez des articles au panier.'); return; }
    var lines = [];
    lines.push('🧾 *Demande de devis – PochonStore*','');
    for (var i=0;i<CART.length;i++){
      var it=CART[i];
      var opts=(it.options && Object.keys(it.options).length)? Object.keys(it.options).map(function(k){return k+': '+it.options[k]}).join(' • ') : '—';
      var unit= it.unitMinPrice? €(it.unitMinPrice) : 'sur devis';
      lines.push((i+1)+'. '+it.title+' × '+it.qty+'  | '+unit+'/u  | '+opts);
    }
    lines.push('', 'Total estimé (min connus) : *'+€(cartTotal())+'*', '_Certains articles sont sur devis. Le tarif final sera confirmé._');
    var payload = { type:'QUOTE_REQUEST', cart:CART, estTotal:cartTotal(), text: lines.join('\n') };

    try{
      if (tg && tg.sendData){
        tg.sendData(JSON.stringify(payload));
        if (tg.HapticFeedback && tg.HapticFeedback.notificationOccurred) tg.HapticFeedback.notificationOccurred('success');
        toast('Devis envoyé au bot. Merci !');
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(payload.text);
        alert('Ouvert hors Telegram : devis copié dans le presse-papiers.');
      }
    }catch(e){ console.error(e); showDiag('Envoi devis: '+(e.message||'erreur')); }
  }

  // ===== Liens =====
  function wireLinks(){
    var ch=document.getElementById('openChannel');
    var ct=document.getElementById('openContact');
    if (ch) ch.addEventListener('click', function(){
      var url=CONFIG.CHANNEL_URL;
      if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url,'_blank');
    });
    if (ct) ct.addEventListener('click', function(){
      var url='https://t.me/'+CONFIG.CONTACT_USERNAME;
      if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url,'_blank');
    });
  }

  // ===== Toast =====
  var toastTimer=null;
  function toast(msg){
    var el=document.getElementById('toast');
    if (!el){
      el=document.createElement('div'); el.id='toast';
      el.style.position='fixed'; el.style.left='50%'; el.style.bottom='84px';
      el.style.transform='translateX(-50%)'; el.style.padding='10px 14px';
      el.style.background='#121216'; el.style.color='#fff';
      el.style.border='1px solid #333'; el.style.borderRadius='10px';
      el.style.boxShadow='0 10px 30px rgba(0,0,0,.4)'; el.style.zIndex='9999';
      document.body.appendChild(el);
    }
    el.textContent=msg; el.style.opacity='1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){ el.style.opacity='0'; }, 1800);
  }
})();