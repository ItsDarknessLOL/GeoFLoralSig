/**
 * informacion.js - Página de detalle de planta
 * Hero animado, tabs con información completa, galería de 3 imágenes del JSON
 */

let plantaActual = null;

// Funciones auxiliares globales (compatibilidad con main.js)
function obtenerAlturaPlanta(p) {
  // Extraer altura de la descripción o devolver un valor por defecto
  const match = p.descripcion && p.descripcion.match(/(\d+\s*a?\s*\d*\s*m)/i);
  return match ? match[0] : 'No especificada';
}

function obtenerCoordenadaPrincipal(p) {
  if (p.sig && p.sig.coordenadas && p.sig.coordenadas.length > 0) {
    return p.sig.coordenadas[0];
  }
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  cargarPlanta();
});

// ============================================
// CARGAR PLANTA
// ============================================
async function cargarPlanta() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    mostrarError('No se especificó una planta');
    return;
  }

  try {
    // Intentar cargar desde el JSON de Campeche primero
    let plantas = [];
    try {
      const resp = await fetch('../data/campeche.json');
      if (resp.ok) {
        const data = await resp.json();
        plantas = data.plantas || [];
      }
    } catch (e) {
      console.warn('No se pudo cargar campeche.json, intentando otras fuentes...');
    }

    // Si no hay datos, intentar con la función global de main.js
    if (plantas.length === 0 && typeof cargarTodasLasPlantas === 'function') {
      plantas = await cargarTodasLasPlantas();
    }

    // Buscar la planta (id puede venir como "CAM-001" o "cam_001")
    plantaActual = plantas.find(p => 
      p.id === id || 
      p.id.toLowerCase() === id.toLowerCase() ||
      p.id.replace(/-/g, '_').toLowerCase() === id.toLowerCase()
    );

    if (!plantaActual) {
      mostrarError('Planta no encontrada');
      return;
    }

    // Aplicar tema del estado si existe la función
    if (typeof aplicarTemaEstado === 'function' && plantaActual._estado) {
      aplicarTemaEstado(plantaActual._estado);
    }

    // Renderizar todo
    renderizarHero();
    renderizarGeneral();
    renderizarBiologia();
    renderizarMedicina();
    renderizarHistoria();
    renderizarEconomia();
    renderizarSIG();
    renderizarHumanidades();

  } catch (error) {
    console.error('Error cargando planta:', error);
    mostrarError('Error al cargar la información');
  }
}

function mostrarError(msg) {
  document.getElementById('plantaNombre').textContent = msg;
  document.getElementById('plantaCientifico').textContent = '';
}

// ============================================
// HERO — usa imagen PRINCIPAL del JSON
// ============================================
function renderizarHero() {
  const p = plantaActual;

  // Nombre
  document.getElementById('plantaNombre').textContent = p.nombre_comun;

  // Científico con animación letra por letra
  const cientifico = document.getElementById('plantaCientifico');
  cientifico.textContent = '';
  const texto = p.nombre_cientifico;
  let i = 0;
  const interval = setInterval(() => {
    cientifico.textContent += texto[i];
    i++;
    if (i >= texto.length) clearInterval(interval);
  }, 50);

  // Meta badges
  const meta = document.getElementById('plantaMeta');
  meta.innerHTML = `
    <span class="hero-planta-badge">🗺️ ${p.estado || 'Campeche'}</span>
    <span class="hero-planta-badge">🌱 ${p.familia}</span>
    <span class="hero-planta-badge">📏 ${obtenerAlturaPlanta(p)}</span>
    <span class="hero-planta-badge">${p.abundancia}</span>
    ${p.populares ? '<span class="hero-planta-badge">⭐ Popular</span>' : ''}
    ${p.mas_vendida ? '<span class="hero-planta-badge">💰 Más vendida</span>' : ''}
  `;

  // Background — usa imagen PRINCIPAL del JSON
  const bg = document.getElementById('heroBg');
  const imgPrincipal = p.imagenes && p.imagenes.principal ? p.imagenes.principal : '';

  if (imgPrincipal) {
    bg.style.backgroundImage = `url(${imgPrincipal})`;
  } else {
    // Fallback a imagen por defecto
    bg.style.backgroundImage = `url(https://images.unsplash.com/photo-${getImagenId(p.id)}?w=1200&h=800&fit=crop)`;
  }
}

function getImagenId(id) {
  const ids = {
    'yuc_001': '1616869294368-28538e052304',
    'qro_001': '1591955506264-3f55e3d0aade',
    'cam_001': '1600853729162-b631f2c8c1bc',
    'chi_001': '1612363229108-2aa702801c81',
    'tab_001': '1567331711402-509c12c41959',
    'ver_001': '1591955506264-3f55e3d0aade'
  };
  return ids[id] || '1591955506264-3f55e3d0aade';
}

// ============================================
// LIGHTBOX
// ============================================
function abrirLightbox(src, titulo) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const lbl = document.getElementById('lightbox-titulo');

  img.src = src;
  lbl.textContent = titulo || '';
  lb.classList.add('activo');
  document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('activo');
  document.body.style.overflow = '';
}

// Cerrar al hacer clic fuera de la imagen
document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.addEventListener('click', function(e) {
      if (e.target === this) cerrarLightbox();
    });
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarLightbox();
    });
  }
});

// ============================================
// TABS
// ============================================
function cambiarTab(tab) {
  // Botones
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('activo'));
  event.target.classList.add('activo');

  // Paneles
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('activo'));
  document.getElementById(`tab-${tab}`).classList.add('activo');

  // Inicializar mapa si es SIG
  if (tab === 'sig') {
    setTimeout(inicializarMapaPlanta, 100);
  }
}

// ============================================
// TAB: GENERAL — incluye GALERÍA de 3 imágenes
// ============================================
function renderizarGeneral() {
  const p = plantaActual;

  // Generar HTML para las 3 imágenes del JSON
  const imgs = p.imagenes || {};
  const tienePrincipal = imgs.principal && imgs.principal.trim() !== '';
  const tieneHabitat = imgs.habitat && imgs.habitat.trim() !== '';
  const tieneDetalle = imgs.detalle && imgs.detalle.trim() !== '';

  const galeriaHTML = `
    <div class="info-card" style="grid-column: 1 / -1;">
      <h4>📷 Galería</h4>
      <div class="galeria-imagenes">
        ${tienePrincipal ? `
          <div class="galeria-item" onclick="abrirLightbox('${imgs.principal}', '${p.nombre_comun} — Imagen principal')">
            <img src="${imgs.principal}" alt="Imagen principal de ${p.nombre_comun}" loading="lazy">
            <span class="galeria-label">📷 Principal</span>
          </div>
        ` : `
          <div class="galeria-item sin-imagen">
            <span>📷 Sin imagen principal</span>
          </div>
        `}
        ${tieneHabitat ? `
          <div class="galeria-item" onclick="abrirLightbox('${imgs.habitat}', '${p.nombre_comun} — Hábitat')">
            <img src="${imgs.habitat}" alt="Hábitat de ${p.nombre_comun}" loading="lazy">
            <span class="galeria-label">🌿 Hábitat</span>
          </div>
        ` : `
          <div class="galeria-item sin-imagen">
            <span>🌿 Sin imagen de hábitat</span>
          </div>
        `}
        ${tieneDetalle ? `
          <div class="galeria-item" onclick="abrirLightbox('${imgs.detalle}', '${p.nombre_comun} — Detalle')">
            <img src="${imgs.detalle}" alt="Detalle de ${p.nombre_comun}" loading="lazy">
            <span class="galeria-label">🔍 Detalle</span>
          </div>
        ` : `
          <div class="galeria-item sin-imagen">
            <span>🔍 Sin imagen de detalle</span>
          </div>
        `}
      </div>
    </div>
  `;

  document.getElementById('contenidoGeneral').innerHTML = `
    <div class="info-card">
      <h4>📝 Descripción</h4>
      <p>${p.descripcion}</p>
    </div>
    <div class="info-card">
      <h4>🗺️ Distribución</h4>
      <p>${p.distribucion}</p>
      <p style="margin-top: 8px;"><strong>Hábitat:</strong> ${p.habitat}</p>
    </div>
    <div class="info-card">
      <h4>📊 Datos Generales</h4>
      <table class="datos-tabla">
        <tr><td>Nombre común</td><td>${p.nombre_comun}</td></tr>
        <tr><td>Nombre científico</td><td style="font-style: italic;">${p.nombre_cientifico}</td></tr>
        <tr><td>Familia</td><td>${p.familia}</td></tr>
        <tr><td>Género</td><td>${p.genero}</td></tr>
        <tr><td>Especie</td><td>${p.especie}</td></tr>
        <tr><td>Altura</td><td>${obtenerAlturaPlanta(p)}</td></tr>
        <tr><td>Abundancia</td><td>${p.abundancia}</td></tr>
        <tr><td>Conservación</td><td>${p.estado_conservacion}</td></tr>
      </table>
    </div>
    <div class="info-card">
      <h4>⚠️ Contraindicaciones</h4>
      <p style="color: #C62828;">${p.contraindicaciones}</p>
    </div>
    ${galeriaHTML}
  `;
}

// ============================================
// TAB: BIOLOGÍA
// ============================================
function renderizarBiologia() {
  const bio = plantaActual.biologia;
  if (!bio) {
    document.getElementById('contenidoBiologia').innerHTML = `
      <div class="info-card" style="grid-column: 1 / -1;">
        <p style="color: var(--gris-500); text-align: center;">No hay información biológica disponible.</p>
      </div>
    `;
    return;
  }
  document.getElementById('contenidoBiologia').innerHTML = `
    <div class="info-card">
      <h4>🔄 Ciclo de Vida</h4>
      <p>${bio.ciclo_vida || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🌸 Reproducción</h4>
      <p>${bio.reproduccion || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🐝 Polinizadores</h4>
      <p>${bio.polinizadores || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🌺 Época de Floración</h4>
      <p>${bio.epoca_floracion || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🔧 Adaptaciones</h4>
      <p>${bio.adaptaciones || 'No disponible'}</p>
    </div>
  `;
}

// ============================================
// TAB: MEDICINA
// ============================================
function renderizarMedicina() {
  const p = plantaActual;
  document.getElementById('contenidoMedicina').innerHTML = `
    <div class="info-card">
      <h4>💊 Usos Medicinales</h4>
      <ul>
        ${(p.usos_medicinales || []).map(u => `<li>${u}</li>`).join('')}
      </ul>
    </div>
    <div class="info-card">
      <h4>🍵 Preparados</h4>
      <ul>
        ${(p.preparados || []).map(prep => `<li>${prep}</li>`).join('')}
      </ul>
    </div>
    <div class="info-card">
      <h4>🧪 Componentes Activos</h4>
      <div class="componentes-tags">
        ${(p.componentes_activos || []).map(c => `<span class="componente-tag">${c}</span>`).join('')}
      </div>
    </div>
    <div class="info-card">
      <h4>⚠️ Contraindicaciones</h4>
      <p style="color: #C62828;">${p.contraindicaciones || 'No especificadas'}</p>
    </div>
  `;
}

// ============================================
// TAB: HISTORIA
// ============================================
function renderizarHistoria() {
  const hist = plantaActual.historia;
  if (!hist) {
    document.getElementById('contenidoHistoria').innerHTML = `
      <div class="info-card" style="grid-column: 1 / -1;">
        <p style="color: var(--gris-500); text-align: center;">No hay información histórica disponible.</p>
      </div>
    `;
    return;
  }
  document.getElementById('contenidoHistoria').innerHTML = `
    <div class="info-card">
      <h4>📜 Origen</h4>
      <p>${hist.origen || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🏺 Usos Tradicionales</h4>
      <p>${hist.usos_tradicionales || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>📚 Menciones Históricas</h4>
      <p>${hist.menciones_historicas || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🏛️ Evidencia Arqueológica</h4>
      <p>${hist.evidencia_arqueologica || 'No disponible'}</p>
    </div>
  `;
}

// ============================================
// TAB: ECONOMÍA
// ============================================
function renderizarEconomia() {
  const eco = plantaActual.economia;
  if (!eco) {
    document.getElementById('contenidoEconomia').innerHTML = `
      <div class="info-card" style="grid-column: 1 / -1;">
        <p style="color: var(--gris-500); text-align: center;">No hay información económica disponible.</p>
      </div>
    `;
    return;
  }
  document.getElementById('contenidoEconomia').innerHTML = `
    <div class="eco-stats">
      <div class="eco-stat">
        <div class="eco-stat-valor">${eco.precio_mercado_kg || 'N/D'}</div>
        <div class="eco-stat-label">Precio/kg</div>
      </div>
      <div class="eco-stat">
        <div class="eco-stat-valor">${eco.produccion_anual_ton || 'N/D'}</div>
        <div class="eco-stat-label">Ton/año</div>
      </div>
      <div class="eco-stat">
        <div class="eco-stat-valor">${eco.valor_exportacion || 'N/D'}</div>
        <div class="eco-stat-label">Exportación</div>
      </div>
      <div class="eco-stat">
        <div class="eco-stat-valor">${eco.empleos_generados || 'N/D'}</div>
        <div class="eco-stat-label">Empleos</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h4>📈 Producción y Mercado</h4>
        <table class="datos-tabla">
          <tr><td>Precio de mercado</td><td>${eco.precio_mercado_kg || 'N/D'}</td></tr>
          <tr><td>Producción anual</td><td>${eco.produccion_anual_ton || 'N/D'} toneladas</td></tr>
          <tr><td>Valor de exportación</td><td>${eco.valor_exportacion || 'N/D'} USD/año</td></tr>
          <tr><td>Empleos generados</td><td>${eco.empleos_generados || 'N/D'}</td></tr>
        </table>
      </div>
      <div class="info-card">
        <h4>🏪 Mercados de Destino</h4>
        <p>${eco.mercados_destino || 'No disponible'}</p>
      </div>
      <div class="info-card" style="grid-column: 1 / -1;">
        <h4>📦 Productos Derivados</h4>
        <div class="componentes-tags">
          ${(eco.productos_derivados || []).map(prod => `<span class="componente-tag">${prod}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// TAB: SIG
// ============================================
function renderizarSIG() {
  const sig = plantaActual.sig;
  const coord = obtenerCoordenadaPrincipal(plantaActual);

  if (!sig) {
    document.getElementById('contenidoSIG').innerHTML = `
      <div class="info-card" style="grid-column: 1 / -1;">
        <p style="color: var(--gris-500); text-align: center;">No hay datos SIG disponibles.</p>
      </div>
    `;
    return;
  }

  document.getElementById('contenidoSIG').innerHTML = `
    <div class="info-grid">
      <div class="info-card">
        <h4>📍 Coordenadas</h4>
        <table class="datos-tabla">
          <tr><td>Latitud</td><td>${coord ? coord.lat.toFixed(4) + '°' : 'No registrada'}</td></tr>
          <tr><td>Longitud</td><td>${coord ? coord.lng.toFixed(4) + '°' : 'No registrada'}</td></tr>
        </table>
      </div>
      <div class="info-card">
        <h4>🗺️ Datos SIG</h4>
        <table class="datos-tabla">
          <tr><td>Zona de distribución</td><td>${sig.zona_distribucion || 'N/D'}</td></tr>
          <tr><td>Tipo de suelo</td><td>${sig.tipo_suelo || 'N/D'}</td></tr>
          <tr><td>Clima</td><td>${sig.clima || 'N/D'}</td></tr>
          <tr><td>Precipitación anual</td><td>${sig.precipitacion_anual || 'N/D'}</td></tr>
          <tr><td>Altitud</td><td>${sig.altitud || 'N/D'}</td></tr>
        </table>
      </div>
    </div>
    <div class="info-card" style="margin-top: 24px;">
      <h4>🗺️ Mapa de Localización</h4>
      <div class="mapa-planta" id="mapaPlantaDetalle"></div>
    </div>
  `;
}

let mapaPlanta;

function inicializarMapaPlanta() {
  const contenedor = document.getElementById('mapaPlantaDetalle');
  const coord = obtenerCoordenadaPrincipal(plantaActual);
  if (!contenedor || !coord) return;
  if (mapaPlanta) {
    mapaPlanta.remove();
  }

  const { lat, lng } = coord;

  mapaPlanta = L.map('mapaPlantaDetalle', {
    center: [lat, lng],
    zoom: 8,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(mapaPlanta);

  // Color del estado
  const colorEstado = plantaActual.color_tema || '#1565C0';

  // Marcador
  const icono = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width: 36px; height: 36px; background: ${colorEstado}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">🌿</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

  L.marker([lat, lng], { icon: icono })
    .addTo(mapaPlanta)
    .bindPopup(`<b>${plantaActual.nombre_comun}</b><br>${plantaActual.estado || 'Campeche'}`);

  // Cargar polígono del estado
  cargarPoligonoEstado(plantaActual.estado || 'campeche');
}

async function cargarPoligonoEstado(estado) {
  try {
    const estadoKey = (estado || 'campeche').toLowerCase().replace(/\s+/g, '_');
    const response = await fetch(`../assets/poligonos/${estadoKey}.geojson`);
    if (response.ok && mapaPlanta) {
      const geojson = await response.json();
      const colorEstado = plantaActual.color_tema || '#1565C0';
      L.geoJSON(geojson, {
        style: {
          color: colorEstado,
          weight: 2,
          fillColor: colorEstado,
          fillOpacity: 0.15
        }
      }).addTo(mapaPlanta);
    }
  } catch (e) {
    console.warn('Error cargando polígono:', e);
  }
}

// ============================================
// TAB: HUMANIDADES
// ============================================
function renderizarHumanidades() {
  const hum = plantaActual.humanidades;
  if (!hum) {
    document.getElementById('contenidoHumanidades').innerHTML = `
      <div class="info-card" style="grid-column: 1 / -1;">
        <p style="color: var(--gris-500); text-align: center;">No hay información de humanidades disponible.</p>
      </div>
    `;
    return;
  }
  document.getElementById('contenidoHumanidades').innerHTML = `
    <div class="info-card">
      <h4>🎭 Significado Cultural</h4>
      <p>${hum.significado_cultural || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>👥 Relevancia Social</h4>
      <p>${hum.relevancia_social || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>🙏 Prácticas Tradicionales</h4>
      <p>${hum.practicas_tradicionales || 'No disponible'}</p>
    </div>
    <div class="info-card">
      <h4>📚 Saberes Indígenas</h4>
      <p>${hum.saberes_indigenas || 'No disponible'}</p>
    </div>
  `;
}

// ============================================
// VER EN 3D
// ============================================
function verEn3D() {
  if (plantaActual) {
    window.location.href = `visor3d.html?id=${plantaActual.id}`;
  }
}
