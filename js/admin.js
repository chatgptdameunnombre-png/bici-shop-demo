import { db, MODO, CREDS_DEMO } from "./db.js";

const $ = s => document.querySelector(s);
const money = n => "$" + Number(n).toLocaleString("es-MX");
let productos = [];

/* ---------- hint de login segun modo ---------- */
$("#loginHint").innerHTML = MODO === "nube"
  ? "🔒 Conectado a Firebase. Entra con el correo que diste de alta en Authentication."
  : `🧪 <b>Modo demo</b> — entra con:<br>Correo: <b>${CREDS_DEMO.email}</b><br>Contraseña: <b>${CREDS_DEMO.pass}</b>`;

/* ---------- auth ---------- */
db.onAuth(user => {
  const auth = !!user;
  $("#loginScreen").hidden = auth;
  $("#dash").hidden = !auth;
  if (auth) { $("#who").textContent = user.email; window.scrollTo(0, 0); arrancarDash(); }
});

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#loginBtn");
  btn.disabled = true; btn.textContent = "Entrando…"; $("#loginErr").textContent = "";
  try {
    await db.login($("#email").value, $("#pass").value);
  } catch (err) {
    $("#loginErr").textContent = traducirError(err);
  } finally {
    btn.disabled = false; btn.textContent = "Entrar";
  }
});
$("#logout").onclick = () => db.logout();

function traducirError(err) {
  const c = err?.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found"))
    return "Correo o contraseña incorrectos.";
  if (c.includes("invalid-email")) return "El correo no es válido.";
  if (c.includes("too-many-requests")) return "Demasiados intentos. Espera un momento.";
  if (c.includes("unauthorized-domain"))
    return "Este dominio no está autorizado en Firebase. Agrégalo en Authentication → Settings → Authorized domains.";
  if (c.includes("network-request-failed")) return "Sin conexión. Revisa tu internet.";
  return (err?.message || "No se pudo entrar.") + (c ? ` (${c})` : "");
}

/* ---------- dashboard ---------- */
let inicializado = false;
async function arrancarDash() {
  if (inicializado) return;
  inicializado = true;
  await db.seedIfEmpty();
  db.onProducts(list => { productos = list; render(); });
}

function stockPill(s) {
  if (s <= 0) return `<span class="stock-pill" style="color:var(--danger)">Agotado</span>`;
  if (s <= 3) return `<span class="stock-pill" style="color:var(--warn)">${s} · bajo</span>`;
  return `<span class="stock-pill" style="color:var(--ok)">${s}</span>`;
}

function render() {
  $("#stTotal").textContent = productos.length;
  $("#stStock").textContent = productos.reduce((a, p) => a + Number(p.stock || 0), 0);
  $("#stOut").textContent = productos.filter(p => p.stock <= 0).length;

  $("#pList").innerHTML = productos.map(p => `
    <div class="p-row">
      <img class="p-thumb" src="${p.imagen || ''}" alt="" onerror="this.style.visibility='hidden'">
      <div class="p-name"><b>${p.nombre}</b><span>${p.marca}</span></div>
      <span class="hide-sm">${p.categoria}</span>
      <span class="hide-sm">${money(p.precio)}</span>
      <span>${stockPill(p.stock)}</span>
      <div class="p-actions">
        <button class="edit-a" data-edit="${p.id}">Editar</button>
        <button class="del-a" data-del="${p.id}">Borrar</button>
      </div>
    </div>`).join("") || `<div style="padding:40px;text-align:center;color:var(--muted)">Sin productos. Agrega el primero.</div>`;
}

/* ---------- modal ---------- */
const ov = $("#modalOv");
const abrir = () => ov.classList.add("open");
const cerrar = () => ov.classList.remove("open");

function nuevo() {
  $("#modalTitle").textContent = "Nuevo producto";
  $("#prodForm").reset();
  $("#pId").value = "";
  $("#pImgPrev").hidden = true;
  abrir();
}
function editar(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  $("#modalTitle").textContent = "Editar producto";
  $("#pId").value = p.id;
  $("#pNombre").value = p.nombre;
  $("#pMarca").value = p.marca;
  $("#pCategoria").value = p.categoria;
  $("#pPrecio").value = p.precio;
  $("#pStock").value = p.stock;
  $("#pDesc").value = p.descripcion || "";
  $("#pImagen").value = p.imagen || "";
  mostrarPreview(p.imagen);
  abrir();
}

function mostrarPreview(url) {
  const img = $("#pImgPrev");
  if (url) { img.src = url; img.hidden = false; img.onerror = () => img.hidden = true; }
  else img.hidden = true;
}
$("#pImagen").addEventListener("input", e => mostrarPreview(e.target.value.trim()));

$("#prodForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("#pId").value;
  const data = {
    nombre: $("#pNombre").value.trim(),
    marca: $("#pMarca").value.trim(),
    categoria: $("#pCategoria").value.trim(),
    precio: Number($("#pPrecio").value),
    stock: Number($("#pStock").value),
    descripcion: $("#pDesc").value.trim(),
    imagen: $("#pImagen").value.trim(),
    specs: []
  };
  try {
    if (id) await db.updateProduct(id, data);
    else await db.addProduct(data);
    cerrar();
    toast(id ? "Producto actualizado" : "Producto agregado");
  } catch (err) { toast("Error: " + (err.message || "no se pudo guardar")); }
});

async function borrar(id) {
  const p = productos.find(x => x.id === id);
  if (!confirm(`¿Borrar "${p?.nombre}"? Esta acción no se puede deshacer.`)) return;
  try { await db.deleteProduct(id); toast("Producto borrado"); }
  catch (err) { toast("Error al borrar"); }
}

/* ---------- eventos ---------- */
$("#addBtn").onclick = nuevo;
$("#modalClose").onclick = cerrar;
$("#modalCancel").onclick = cerrar;
ov.addEventListener("click", e => { if (e.target === ov) cerrar(); });
document.addEventListener("click", e => {
  const t = e.target.closest("[data-edit],[data-del]");
  if (!t) return;
  if (t.dataset.edit) editar(t.dataset.edit);
  else if (t.dataset.del) borrar(t.dataset.del);
});

function toast(html) {
  const t = document.createElement("div");
  t.className = "toast"; t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
