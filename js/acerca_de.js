/**
 * acerca_de.js - Sistema de correos y mapa de contacto
 */

document.addEventListener('DOMContentLoaded', () => {
  inicializarMapaContacto();
});

// ============================================
// MAPA DE CONTACTO
// ============================================
function inicializarMapaContacto() {
  const contenedor = document.getElementById('mapaContacto');
  if (!contenedor || typeof L === 'undefined') return;
  
  const mapa = L.map('mapaContacto', {
    center: [20.967, -89.623],
    zoom: 12,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false
  });
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(mapa);
  
  const icono = L.divIcon({
    className: 'custom-marker',
    html: '<div style="width: 40px; height: 40px; background: #2E7D32; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;">🌿</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
  
  L.marker([20.967, -89.623], { icon })
    .addTo(mapa)
    .bindPopup('<b>Plantas Medicinales del Sureste</b><br>Mérida, Yucatán');
}

// ============================================
// SISTEMA DE CORREOS
// ============================================
function enviarCorreo(event) {
  event.preventDefault();
  
  const btn = document.getElementById('btnEnviar');
  const btnTexto = document.getElementById('btnTexto');
  const form = document.getElementById('formContacto');
  
  // Obtener datos
  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const asunto = document.getElementById('asunto').value;
  const mensaje = document.getElementById('mensaje').value.trim();
  
  // Validación
  if (!nombre || !email || !asunto || !mensaje) {
    mostrarToast('Por favor completa todos los campos', 'warning');
    return;
  }
  
  if (!validarEmail(email)) {
    mostrarToast('Por favor ingresa un correo válido', 'warning');
    return;
  }
  
  // Simular envío
  btn.disabled = true;
  btnTexto.textContent = '⏳ Enviando...';
  
  setTimeout(() => {
    // Guardar en localStorage (simulación de base de datos)
    guardarMensaje({ nombre, email, asunto, mensaje, fecha: new Date().toISOString() });
    
    // Éxito
    btnTexto.textContent = '✅ ¡Enviado!';
    btn.style.background = '#2E7D32';
    
    mostrarToast('Mensaje enviado correctamente. Te responderemos pronto.', 'success');
    
    // Reset form
    form.reset();
    
    // Restaurar botón
    setTimeout(() => {
      btn.disabled = false;
      btnTexto.textContent = '📨 Enviar Mensaje';
      btn.style.background = '';
    }, 3000);
    
  }, 1500);
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function guardarMensaje(datos) {
  // Obtener mensajes existentes
  const mensajes = JSON.parse(localStorage.getItem('mensajesContacto') || '[]');
  mensajes.push(datos);
  localStorage.setItem('mensajesContacto', JSON.stringify(mensajes));
  
  // También simular envío a correo con mailto
  const asuntoMail = encodeURIComponent(`[Plantas Medicinales] ${datos.asunto} - ${datos.nombre}`);
  const cuerpoMail = encodeURIComponent(
    `Nombre: ${datos.nombre}\n` +
    `Email: ${datos.email}\n` +
    `Asunto: ${datos.asunto}\n\n` +
    `Mensaje:\n${datos.mensaje}`
  );
  
  // Abrir cliente de correo (opcional)
  window.open(`mailto:info@plantasmx.com?subject=${asuntoMail}&body=${cuerpoMail}`, '_blank');
}

// ============================================
// ADMIN: VER MENSAJES (para desarrollo)
// ============================================
function verMensajes() {
  const mensajes = JSON.parse(localStorage.getItem('mensajesContacto') || '[]');
  console.table(mensajes);
  return mensajes;
}

// Exponer globalmente para debugging
window.verMensajesContacto = verMensajes;
