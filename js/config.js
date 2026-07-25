export const firebaseConfig = {
  apiKey: "AIzaSyDeKk6Hr-3-nDDIVwh3fi5OIPUZJo5XKPY",
  authDomain: "bici-shop-demo.firebaseapp.com",
  projectId: "bici-shop-demo",
  storageBucket: "bici-shop-demo.firebasestorage.app",
  messagingSenderId: "1033432478399",
  appId: "1:1033432478399:web:6d6223f92caac268874c0a"
};

export const WHATSAPP_NUMERO = "5213300000000";

export const NEGOCIO = {
  nombre: "Ciclo Norte",
  claim: "Bicicletas y equipo premium",
  ciudad: "Guadalajara, Jal."
};

export const usaFirebase = Object.values(firebaseConfig).every(v => v && v !== "PEGA_AQUI");
