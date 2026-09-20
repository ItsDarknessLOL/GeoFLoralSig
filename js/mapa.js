/**
 * mapa.js - Mapa interactivo con Leaflet
 * Polígonos, puntos, filtros y control Ctrl para mover
 */

let mapa;
let capasBase = {};
let capaActiva;
let poligonosEstados = {};
let marcadoresPlantas = [];
let capaPoligonos;
let capaMarcadores;
let ctrlPresionado = false;
let mapaBloqueado = true;
let visualizacionActual = { puntos: true, poligonos: true, heatmap: false };

document.addEventListener('DOMContentLoaded', () => {
  inicializarMapa();
});

async function inicializarMapa() {
  // Crear mapa
  mapa = L.map('mapaPrincipal', {
    center: [18.5, -91.0],
    zoom: 7,
    zoomControl: true,
    dragging: false, // Bloqueado por defecto
    scrollWheelZoom: false,
    doubleClickZoom: true
  });
  
  // Capas base
  capasBase = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }),
    satelital: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    }),
    oscuro: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO',
      maxZoom: 18
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
      maxZoom: 17
    })
  };
  
  // Capa por defecto
  capaActiva = capasBase.osm;
  capaActiva.addTo(mapa);
  
  // Grupos de capas
  capaPoligonos = L.layerGroup().addTo(mapa);
  capaMarcadores = L.layerGroup().addTo(mapa);
  
  // Cargar datos
  await cargarPoligonosEstados();
  await cargarMarcadoresPlantas();
  llenarFiltroEspecies();
  
  // Control Ctrl para mover
  inicializarControlTeclado();
  
  // Detectar si es móvil
  if (window.innerWidth <= 768) {
    document.getElementById('btnMapaMovil').style.display = 'block';
  }
  
  // Mostrar hint en desktop
  if (window.innerWidth > 768) {
    const hint = document.getElementById('mapaHint');
    hint.style.display = 'block';
    setTimeout(() => {
      hint.style.opacity = '0';
      hint.style.transition = 'opacity 1s ease';
      setTimeout(() => hint.style.display = 'none', 1000);
    }, 4000);
  }
}

// ============================================
// CONTROL DE TECLADO (Ctrl para mover)
// ============================================
function inicializarControlTeclado() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control' && mapaBloqueado) {
      ctrlPresionado = true;
      mapa.dragging.enable();
      mapa.scrollWheelZoom.enable();
      document.getElementById('mapaPrincipal').style.cursor = 'grab';
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control' && mapaBloqueado) {
      ctrlPresionado = false;
      mapa.dragging.disable();
      mapa.scrollWheelZoom.disable();
      document.getElementById('mapaPrincipal').style.cursor = 'default';
    }
  });
  
  // También permitir click y arrastrar con Ctrl
  const mapaEl = document.getElementById('mapaPrincipal');
  mapaEl.addEventListener('mousedown', (e) => {
    if (ctrlPresionado) {
      mapaEl.style.cursor = 'grabbing';
    }
  });
  
  mapaEl.addEventListener('mouseup', () => {
    if (ctrlPresionado) {
      mapaEl.style.cursor = 'grab';
    }
  });
}

// ============================================
// BOTÓN MÓVIL
// ============================================
function toggleMapaMovil() {
  const btn = document.getElementById('btnMapaMovil');
  
  if (mapaBloqueado) {
    mapaBloqueado = false;
    mapa.dragging.enable();
    mapa.scrollWheelZoom.enable();
    btn.textContent = '🔒 Bloquear mapa';
    mostrarToast('Mapa desbloqueado. Puedes moverte libremente.', 'info');
  } else {
    mapaBloqueado = true;
    mapa.dragging.disable();
    mapa.scrollWheelZoom.disable();
    btn.textContent = '🔓 Desbloquear mapa';
  }
}

// ============================================
// CARGAR POLÍGONOS
// ============================================
async function cargarPoligonosEstados() {
  const estados = [
    { key: 'yucatan', color: '#2E7D32', nombre: 'Yucatán' },
    { key: 'qroo', color: '#C62828', nombre: 'Quintana Roo' },
    { key: 'campeche', color: '#1565C0', nombre: 'Campeche' },
    { key: 'chiapas', color: '#6A1B9A', nombre: 'Chiapas' },
    { key: 'tabasco', color: '#E65100', nombre: 'Tabasco' },
    { key: 'veracruz', color: '#00695C', nombre: 'Veracruz' }
  ];
  
  for (const estado of estados) {
    try {
      const response = await fetch(`../assets/poligonos/${estado.key}.geojson`);
      if (response.ok) {
        const geojson = await response.json();
        const layer = L.geoJSON(geojson, {
          style: {
            color: estado.color,
            weight: 3,
            fillColor: estado.color,
            fillOpacity: 0.25,
            dashArray: null
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div style="font-family: Inter, sans-serif;">
                <h4 style="margin: 0 0 4px; color: ${estado.color};">${feature.properties.estado}</h4>
                <p style="margin: 0; font-size: 0.85rem;">Capital: ${feature.properties.capital}</p>
                <a href="catalogo.html?estado=${estado.key}" style="color: ${estado.color}; font-size: 0.8rem;">Ver plantas →</a>
              </div>
            `);
            
            layer.on('mouseover', () => {
              layer.setStyle({ fillOpacity: 0.4, weight: 4 });
            });
            
            layer.on('mouseout', () => {
              layer.setStyle({ fillOpacity: 0.25, weight: 3 });
            });
          }
        });
        
        poligonosEstados[estado.key] = layer;
        layer.addTo(capaPoligonos);
      }
    } catch (e) {
      console.warn(`Error cargando polígono ${estado.key}:`, e);
    }
  }
}

// ============================================
// CARGAR MARCADORES — themed popup
// ============================================
async function cargarMarcadoresPlantas() {
  try {
    const plantas = await cargarTodasLasPlantas();

    plantas.forEach(planta => {
      const coords = planta._coordenadas || obtenerCoordenadasPlanta(planta);
      if (!coords.length) return;

      const color = planta._colorEstado || '#2E7D32';

      const iconoHtml = `
        <div style="
          width:32px;height:32px;
          background:${color};
          border-radius:50%;
          border:2.5px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;
          font-size:14px;
          transition:transform .2s ease;
        ">🌿</div>`;

      const icono = L.divIcon({
        className: 'custom-marker',
        html: iconoHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      // Themed popup HTML
      const popupHtml = `
        <div class="popup-themed">
          <div class="popup-themed-header" style="background:${color}12;">
            <div class="popup-themed-emoji" style="background:${color}22;">🌿</div>
            <div class="popup-themed-title">
              <h4>${planta.nombre_comun}</h4>
              <p class="sci">${planta.nombre_cientifico}</p>
            </div>
          </div>
          <div class="popup-themed-body">
            <p class="popup-themed-uso">
              💊 ${planta.usos_medicinales?.[0] || 'Uso medicinal registrado'}
            </p>
          </div>
          <div class="popup-themed-footer">
            <span class="popup-estado-badge" style="background:${color}18;color:${color};">
              <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;"></span>
              ${planta._estadoNombre}
            </span>
            <a href="informacion.html?id=${planta.id}"
               class="popup-ver-link"
               style="color:${color};"
               aria-label="Ver ficha de ${planta.nombre_comun}">
              Ver ficha →
            </a>
          </div>
        </div>`;

      coords.forEach(({ lat, lng }) => {
        const marker = L.marker([lat, lng], { icon: icono })
          .bindPopup(popupHtml, {
            maxWidth: 280,
            className: 'popup-sin-padding'
          });

        marcadoresPlantas.push({ marker, planta });
        marker.addTo(capaMarcadores);
      });
    });

  } catch (error) {
    console.error('Error cargando marcadores:', error);
  }
}

// ============================================
// LLENAR FILTRO DE ESPECIES
// ============================================
async function llenarFiltroEspecies() {
  const select = document.getElementById('filtroEspecieMapa');
  if (!select) return;
  
  try {
    const plantas = await cargarTodasLasPlantas();
    plantas.forEach(planta => {
      const option = document.createElement('option');
      option.value = planta.id;
      option.textContent = `${planta.nombre_comun} (${planta.nombre_cientifico})`;
      select.appendChild(option);
    });
  } catch (e) {
    console.warn('Error llenando filtro de especies:', e);
  }
}

// ============================================
// CAMBIAR CAPA BASE
// ============================================
function cambiarCapaBase(tipo) {
  if (capaActiva) {
    mapa.removeLayer(capaActiva);
  }
  
  capaActiva = capasBase[tipo];
  if (capaActiva) {
    capaActiva.addTo(mapa);
  }
  
  // Actualizar botones
  document.querySelectorAll('[data-capa]').forEach(btn => {
    btn.classList.toggle('activo', btn.dataset.capa === tipo);
  });
}

// ============================================
// TOGGLE POLÍGONOS
// ============================================
function togglePoligonos(estado) {
  // Actualizar botones
  document.querySelectorAll('[data-poligono]').forEach(btn => {
    btn.classList.remove('activo');
  });
  
  if (estado === 'todos') {
    // Mostrar todos
    Object.values(poligonosEstados).forEach(layer => {
      if (!capaPoligonos.hasLayer(layer)) {
        capaPoligonos.addLayer(layer);
      }
    });
    document.querySelector('[data-poligono="todos"]').classList.add('activo');
  } else {
    // Mostrar solo el seleccionado
    Object.entries(poligonosEstados).forEach(([key, layer]) => {
      if (key === estado) {
        if (!capaPoligonos.hasLayer(layer)) {
          capaPoligonos.addLayer(layer);
        }
      } else {
        if (capaPoligonos.hasLayer(layer)) {
          capaPoligonos.removeLayer(layer);
        }
      }
    });
    document.querySelector(`[data-poligono="${estado}"]`).classList.add('activo');
  }
}

// ============================================
// TOGGLE VISUALIZACIÓN
// ============================================
function toggleVisual(tipo) {
  const btn = document.querySelector(`[data-visual="${tipo}"]`);
  
  if (tipo === 'puntos') {
    visualizacionActual.puntos = !visualizacionActual.puntos;
    btn.classList.toggle('activo', visualizacionActual.puntos);
    
    if (visualizacionActual.puntos) {
      mapa.addLayer(capaMarcadores);
    } else {
      mapa.removeLayer(capaMarcadores);
    }
  } else if (tipo === 'poligonos') {
    visualizacionActual.poligonos = !visualizacionActual.poligonos;
    btn.classList.toggle('activo', visualizacionActual.poligonos);
    
    if (visualizacionActual.poligonos) {
      mapa.addLayer(capaPoligonos);
    } else {
      mapa.removeLayer(capaPoligonos);
    }
  } else if (tipo === 'heatmap') {
    visualizacionActual.heatmap = !visualizacionActual.heatmap;
    btn.classList.toggle('activo', visualizacionActual.heatmap);
    
    if (visualizacionActual.heatmap) {
      generarHeatmap();
    } else {
      if (window.capaHeatmap) {
        mapa.removeLayer(window.capaHeatmap);
      }
    }
  }
}

// ============================================
// HEATMAP SIMULADO
// ============================================
async function generarHeatmap() {
  if (window.capaHeatmap) {
    mapa.removeLayer(window.capaHeatmap);
  }
  
  const puntos = [];
  marcadoresPlantas.forEach(({ planta }) => {
    const base = planta._coordenadaPrincipal || obtenerCoordenadaPrincipal(planta);
    if (base) {
      // Crear multiples puntos alrededor para simular zona de abundancia
      for (let i = 0; i < 15; i++) {
        puntos.push([
          base.lat + (Math.random() - 0.5) * 0.8,
          base.lng + (Math.random() - 0.5) * 0.8
        ]);
      }
    }
  });
  
  // Usar círculos con gradiente como simulación de heatmap
  window.capaHeatmap = L.layerGroup();
  
  puntos.forEach(([lat, lng]) => {
    const circle = L.circle([lat, lng], {
      radius: 5000 + Math.random() * 10000,
      fillColor: `hsla(${120 + Math.random() * 60}, 70%, 50%, 0.3)`,
      color: 'transparent',
      fillOpacity: 0.2
    });
    circle.addTo(window.capaHeatmap);
  });
  
  window.capaHeatmap.addTo(mapa);
}

// ============================================
// FILTRAR ESPECIE EN MAPA
// ============================================
function filtrarEspecieMapa() {
  const id = document.getElementById('filtroEspecieMapa').value;
  
  if (!id) {
    // Mostrar todos
    marcadoresPlantas.forEach(({ marker }) => {
      if (!capaMarcadores.hasLayer(marker)) {
        capaMarcadores.addLayer(marker);
      }
    });
    return;
  }
  
  // Mostrar solo la especie seleccionada
  marcadoresPlantas.forEach(({ marker, planta }) => {
    if (planta.id === id) {
      if (!capaMarcadores.hasLayer(marker)) {
        capaMarcadores.addLayer(marker);
      }
      // Centrar en el marcador
      const latlng = marker.getLatLng();
      mapa.setView(latlng, 10);
    } else {
      if (capaMarcadores.hasLayer(marker)) {
        capaMarcadores.removeLayer(marker);
      }
    }
  });
}

// ============================================
// BUSCAR EN MAPA — con dropdown de resultados
// ============================================
function buscarEnMapa(query) {
  // Reset: show all markers
  marcadoresPlantas.forEach(({ marker }) => {
    if (!capaMarcadores.hasLayer(marker)) capaMarcadores.addLayer(marker);
  });
}

function buscarEnMapaConResultados(query) {
  const resultsEl = document.getElementById('mapaSearchResults');
  if (!resultsEl) return;

  const q = query.trim();

  if (!q) {
    resultsEl.classList.remove('open');
    resultsEl.innerHTML = '';
    // Restore all markers
    marcadoresPlantas.forEach(({ marker }) => {
      if (!capaMarcadores.hasLayer(marker)) capaMarcadores.addLayer(marker);
    });
    return;
  }

  const qn = normalizarTexto(q);

  // Score each plant
  const scored = marcadoresPlantas.map(({ marker, planta }) => {
    const nc  = normalizarTexto(planta.nombre_comun);
    const nci = normalizarTexto(planta.nombre_cientifico);
    let score = 0;
    if (nc.startsWith(qn))        score = 3;
    else if (nc.includes(qn))     score = 2;
    else if (nci.includes(qn))    score = 1.5;
    else if (distanciaLevenshtein(qn, nc.substring(0, Math.min(nc.length, qn.length + 3))) <= 2) score = 1;
    return { marker, planta, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // Update marker visibility
  marcadoresPlantas.forEach(({ marker }) => {
    if (!capaMarcadores.hasLayer(marker)) capaMarcadores.addLayer(marker);
  });

  if (scored.length === 0) {
    resultsEl.innerHTML = `<div class="search-no-results">Sin resultados para "<strong>${q}</strong>"</div>`;
    resultsEl.classList.add('open');
    return;
  }

  resultsEl.innerHTML = scored.map(({ planta }) => {
    const color = planta._colorEstado || '#2E7D32';
    return `
      <div class="search-result-item" 
           onclick="irAPlantaEnMapa('${planta.id}')"
           role="option"
           tabindex="0"
           aria-label="${planta.nombre_comun}, ${planta._estadoNombre}">
        <div class="search-result-dot" style="background:${color};"></div>
        <div class="search-result-info">
          <div class="search-result-nombre">${planta.nombre_comun}</div>
          <div class="search-result-sci">${planta.nombre_cientifico}</div>
        </div>
        <span class="search-result-estado" style="background:${color}18;color:${color};">
          ${planta._estadoNombre}
        </span>
      </div>`;
  }).join('');

  resultsEl.classList.add('open');
}

function irAPlantaEnMapa(id) {
  const found = marcadoresPlantas.find(({ planta }) => planta.id === id);
  if (!found) return;

  const latlng = found.marker.getLatLng();
  mapa.setView(latlng, 11, { animate: true });
  found.marker.openPopup();

  // Close dropdown & clear input
  const resultsEl = document.getElementById('mapaSearchResults');
  const inputEl   = document.getElementById('buscadorMapa');
  if (resultsEl) { resultsEl.classList.remove('open'); resultsEl.innerHTML = ''; }
  if (inputEl)   { inputEl.value = found.planta.nombre_comun; }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.mapa-search-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const r = document.getElementById('mapaSearchResults');
    if (r) { r.classList.remove('open'); }
  }
});
