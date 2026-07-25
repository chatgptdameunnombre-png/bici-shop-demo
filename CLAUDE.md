# CLAUDE.md — Bici Shop (demo tienda con carrito + panel del dueño)

Tienda web para negocio de bicicletas (marca ancla Norco). Demo para cerrar cliente 2 (tienda que recién abre). Diseño y motor hechos por Claude Code.

## Qué es

Tienda estática (GitHub Pages) con:
- **Tienda pública** (`index.html`) — catálogo, carrito funcional, botón "Comprar por WhatsApp".
- **Panel del dueño** (`admin.html`) — login + alta/edición/borrado de productos, precio y stock. El dueño administra solo; los cambios se reflejan en la tienda.

Sin backend propio. El catálogo/stock vive en la nube (Firebase Firestore) para que lo que el dueño guarda lo vean todos los clientes.

## Estado: EN LA NUBE ✅ (verificado)

Proyecto Firebase `bici-shop-demo` (Spark, gratis) ya conectado y probado end-to-end:
- Firestore creado (nam5), reglas publicadas (lectura pública / escritura solo con login).
- Authentication Email/Password habilitado.
- Usuario dueño demo: `dueno@ciclonorte.com` / `bici2026` (cambiar/agregar el real del cliente en Authentication → Users).
- Verificado: login, seed de 3 productos, lectura en tienda y **tiempo real** (editar stock en el panel → la tienda se actualiza sola en otra pestaña).

## Los dos modos (clave)

`js/config.js` decide el modo automáticamente:
- **Modo nube (Firebase):** claves reales puestas → Firestore (multiusuario, tiempo real) + Auth. **(modo activo)**
- **Modo demo (local):** si las claves fueran `PEGA_AQUI` → `localStorage` (no multiusuario). Un badge abajo-izquierda indica el modo.

El seed de productos corre solo desde el panel (autenticado); la tienda pública solo lee.

## Arquitectura

```
bici-shop-demo/
├── index.html        tienda pública
├── admin.html        panel del dueño
├── css/styles.css    estilos (tienda + panel)
└── js/
    ├── config.js     firebaseConfig + WHATSAPP_NUMERO + datos negocio
    ├── seed.js       3 productos iniciales
    ├── db.js         adaptador: Firestore o localStorage (misma interfaz)
    ├── store.js      tienda + carrito
    └── admin.js      panel + login + CRUD
```

`db.js` expone una sola interfaz (`onProducts`, `addProduct`, `updateProduct`, `deleteProduct`, `login`, `logout`, `onAuth`, `seedIfEmpty`) para que store.js y admin.js no sepan si es nube o local.

## Correr en local

Servidor ya configurado en `~/.claude/launch.json` (name `bici-shop`, puerto 5599):
```bash
/opt/homebrew/bin/python3 -m http.server 5599 --directory ~/Proyectos/bici-shop-demo
```
Tienda: http://localhost:5599/index.html · Panel: http://localhost:5599/admin.html

Los módulos ES exigen servidor HTTP (no abrir con `file://`).

## Credenciales demo (solo modo local)

- Correo: `dueno@demo.com` · Contraseña: `demo1234`

## Productos y fotos

| Producto | Categoría | Foto |
|---|---|---|
| Oakley Sutro | Lentes | CDN Amazon (real) |
| Norco Storm 4 | Bicicletas | **pendiente** — Norco descontinuó el modelo y su sitio no expone la imagen |
| Fox Speedframe | Cascos | CDN Amazon (real) |

Norco NO fabrica cascos; por eso el casco es Fox (marca real de MTB). Precios en MXN son estimados, Kiki los ajusta.

## Pendientes para producción

1. **Firebase** (para que sea real/multiusuario):
   - Crear proyecto en console.firebase.google.com → Firestore + Authentication (Email/Password).
   - Pegar `firebaseConfig` en `js/config.js`.
   - Crear el usuario dueño en Authentication → Users → Add user.
   - Aplicar reglas de seguridad de Firestore (lectura pública, escritura solo con login):
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /productos/{doc} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
2. **Foto de la bici Norco** — subirla por el panel o poner la URL en `seed.js`.
3. **Método de pago** — hoy el botón arma el pedido y abre WhatsApp (`WHATSAPP_NUMERO` en config.js). Se puede cambiar a link de pago (Mercado Pago). Fase avanzada: webhook de pago → n8n descuenta stock en la nube.
4. **Deploy** — GitHub Pages (skill `github-deploy`). Repo aparte o subcarpeta de dominio.

## Notas de diseño

- Paleta: negro/blanco + acento lima `#c6f032`. Tipografía Space Grotesk + Inter (Google Fonts).
- Cards con hover `translateY(-8px) + scale`, glow; reveal on scroll con IntersectionObserver (sin GSAP). Si se quiere nivel "lujo", Claude Design lo pule sobre esta base.
- Sin comentarios en el código (regla de Kiki).
