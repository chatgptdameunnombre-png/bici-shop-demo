import { db, MODO } from "./db.js";
import { WHATSAPP_NUMERO, NEGOCIO } from "./config.js";

const CART_KEY = "bici_cart";
const $ = s => document.querySelector(s);
const money = n => "$" + Number(n).toLocaleString("es-MX");

let productos = [];
let cart = cargarCart();
let io;

function cargarCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}
function guardarCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

/* ---------- badge de modo ---------- */
const badge = document.createElement("div");
badge.className = "mode-badge mode-badge--" + (MODO === "nube" ? "nube" : "demo");
badge.textContent = MODO === "nube" ? "● En la nube (Firebase)" : "● Modo demo (local)";
document.body.appendChild(badge);

/* ---------- productos ---------- */
if (MODO === "demo") await db.seedIfEmpty();
db.onProducts(list => { productos = list; renderGrid(); renderCart(); });

function stockInfo(s) {
  if (s <= 0) return { cls: "out", txt: "Agotado" };
  if (s <= 3) return { cls: "low", txt: `Últimas ${s}` };
  return { cls: "ok", txt: "Disponible" };
}

function renderGrid() {
  const grid = $("#grid");
  if (!productos.length) { grid.innerHTML = `<p style="color:var(--muted)">Cargando catálogo…</p>`; return; }
  grid.innerHTML = productos.map(p => {
    const st = stockInfo(p.stock);
    const enCarrito = cart[p.id]?.qty || 0;
    const sinStock = p.stock <= 0;
    const tope = enCarrito >= p.stock;
    const media = p.imagen
      ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none';this.parentElement.querySelector('.card__ph').style.display='block'">
         <span class="card__ph" style="display:none">📷 Sin foto aún</span>`
      : `<span class="card__ph">📷 Foto pendiente<br><small>(el dueño la sube en el panel)</small></span>`;
    return `
    <article class="card reveal" id="cat-${p.categoria.toLowerCase()}">
      <div class="card__media">
        <span class="card__cat">${p.categoria}</span>
        ${media}
      </div>
      <div class="card__body">
        <span class="card__brand">${p.marca}</span>
        <h3 class="card__name">${p.nombre}</h3>
        <p class="card__desc">${p.descripcion || ""}</p>
        <div class="card__foot">
          <div class="price">${money(p.precio)} <span>MXN</span></div>
          <span class="stock stock--${st.cls}">${st.txt}</span>
        </div>
        <button class="add-btn" data-add="${p.id}" ${sinStock || tope ? "disabled" : ""}>
          ${sinStock ? "Agotado" : tope ? "Máximo en carrito" : "Agregar al carrito"}
        </button>
      </div>
    </article>`;
  }).join("");
  observarReveal();
}

/* ---------- carrito ---------- */
function renderCart() {
  const items = Object.values(cart).map(c => {
    const p = productos.find(x => x.id === c.id);
    return p ? { ...p, qty: Math.min(c.qty, p.stock) } : null;
  }).filter(Boolean).filter(i => i.qty > 0);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = items.reduce((a, i) => a + i.qty * i.precio, 0);
  $("#cartCount").textContent = count;

  const body = $("#cartBody");
  if (!items.length) {
    body.innerHTML = `<div class="drawer__empty">🚲<br>Tu carrito está vacío.<br><small>Agrega productos del catálogo.</small></div>`;
    $("#cartFoot").hidden = true;
    return;
  }
  body.innerHTML = items.map(i => `
    <div class="line">
      <img class="line__img" src="${i.imagen || ''}" alt="" onerror="this.style.visibility='hidden'">
      <div class="line__info">
        <div class="line__name">${i.nombre}</div>
        <div class="line__price">${money(i.precio)}</div>
        <div class="qty">
          <button data-dec="${i.id}">−</button>
          <span>${i.qty}</span>
          <button data-inc="${i.id}" ${i.qty >= i.stock ? "disabled" : ""}>+</button>
        </div>
      </div>
      <button class="line__rm" data-rm="${i.id}">Quitar</button>
    </div>`).join("");
  $("#cartTotal").textContent = money(total);
  $("#cartFoot").hidden = false;
}

function addCart(id) {
  const p = productos.find(x => x.id === id);
  if (!p || p.stock <= 0) return;
  const q = cart[id]?.qty || 0;
  if (q >= p.stock) return;
  cart[id] = { id, qty: q + 1 };
  guardarCart();
  toast(`<b>${p.nombre}</b> agregado`);
  openDrawer();
}

/* ---------- checkout → WhatsApp ---------- */
function checkout() {
  const items = Object.values(cart).map(c => {
    const p = productos.find(x => x.id === c.id);
    return p ? { ...p, qty: Math.min(c.qty, p.stock) } : null;
  }).filter(Boolean).filter(i => i.qty > 0);
  if (!items.length) return;
  const total = items.reduce((a, i) => a + i.qty * i.precio, 0);
  let msg = `¡Hola ${NEGOCIO.nombre}! Quiero comprar:\n\n`;
  items.forEach(i => { msg += `• ${i.qty}× ${i.nombre} — ${money(i.precio * i.qty)}\n`; });
  msg += `\nTotal: ${money(total)}\n\n¿Cómo continúo con el pago?`;
  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ---------- drawer ---------- */
const openDrawer = () => { $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); };
const closeDrawer = () => { $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open"); };

/* ---------- toast ---------- */
function toast(html) {
  const t = document.createElement("div");
  t.className = "toast"; t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* ---------- reveal ---------- */
function observarReveal() {
  io?.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
}

/* ---------- eventos ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-rm]");
  if (!t) return;
  if (t.dataset.add) addCart(t.dataset.add);
  else if (t.dataset.inc) { cart[t.dataset.inc].qty++; guardarCart(); }
  else if (t.dataset.dec) { const id = t.dataset.dec; cart[id].qty--; if (cart[id].qty <= 0) delete cart[id]; guardarCart(); }
  else if (t.dataset.rm) { delete cart[t.dataset.rm]; guardarCart(); }
});
$("#openCart").onclick = openDrawer;
$("#closeCart").onclick = closeDrawer;
$("#overlay").onclick = closeDrawer;
$("#checkout").onclick = checkout;

renderCart();
observarReveal();
