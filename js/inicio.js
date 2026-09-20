/**
 * inicio.js - Script específico para la página principal
 * Maneja el hero carrusel, estadísticas animadas y previews
 */

document.addEventListener('DOMContentLoaded', () => {
  inicializarHeroCarrusel();
  inicializarEstadisticas();
  cargarCatalogoPreview();
  inicializarMapaPreview();
});

// ============================================
// HERO CARRUSEL
// ============================================
const plantasHero = [
  {
    nombre: 'Hierba Santa',
    estado: 'Chiapas',
    imagen: './assets/imagenes/Plantas_Chiapas/Hierba_Santa.jpg',
    color: '#8800d6'
  },
  {
    nombre: 'Palma camedor',
    estado: 'Quintana Roo',
    imagen: './assets/imagenes/imagenes_yuc/qro-001_principal.png',
    color: '#C62828'
  },
  {
    nombre: 'Passionflower Veracruzana',
    estado: 'Veracruz',
    imagen: 'https://images.unsplash.com/photo-1567331711402-509c12c41959?w=600&h=700&fit=crop',
    color: '#00695C'
  },
  {
    nombre: 'Macuilí',
    estado: 'Tabasco',
    imagen: './assets/imagenes/imagenes_tab/2macuilis_tab/macuilis_tab_principal.jpeg',
    color: '#E65100'
  },
  {
    nombre: 'Achiote',
    estado: 'Campeche',
    imagen: './assets/imagenes/imagenes_yuc/Achiote.jpg',
    color: '#066cf1'
  },
  {
    nombre: 'Nim',
    estado: 'Yucatán',
    imagen: './assets/imagenes/imagenes_yuc/yuc_001_principal.png',
    color: '#359e35'
  }
];

let carruselActual = 0;
let carruselInterval;

function inicializarHeroCarrusel() {
  const contenedor = document.getElementById('heroCarrusel');
  const indicadores = document.getElementById('heroIndicadores');
  
  if (!contenedor || !indicadores) return;
  
  // Crear slides
  plantasHero.forEach((planta, index) => {
    const slide = document.createElement('div');
    slide.className = `hero-imagen ${index === 0 ? 'activa' : ''}`;
    slide.innerHTML = `
      <img src="${planta.imagen}" alt="${planta.nombre}" loading="lazy"
           onerror="this.style.display='none'; this.parentElement.style.background='${planta.color}33';">
      <div class="hero-imagen-overlay"></div>
      <div class="hero-imagen-nombre">
        ${planta.nombre} <br>
        <small style="opacity: 0.8; font-weight: 400;">${planta.estado}</small>
      </div>
    `;
    contenedor.appendChild(slide);
    
    // Crear indicador
    const indicador = document.createElement('div');
    indicador.className = `hero-indicador ${index === 0 ? 'activo' : ''}`;
    indicador.addEventListener('click', () => irASlide(index));
    indicadores.appendChild(indicador);
  });
  
  // Auto-play
  iniciarCarruselAuto();
}

function irASlide(index) {
  const slides = document.querySelectorAll('.hero-imagen');
  const indicadores = document.querySelectorAll('.hero-indicador');
  
  slides.forEach((slide, i) => {
    slide.classList.toggle('activa', i === index);
  });
  
  indicadores.forEach((ind, i) => {
    ind.classList.toggle('activo', i === index);
  });
  
  carruselActual = index;
  reiniciarCarruselAuto();
}

function iniciarCarruselAuto() {
  clearInterval(carruselInterval);
  carruselInterval = setInterval(() => {
    const siguiente = (carruselActual + 1) % plantasHero.length;
    irASlide(siguiente);
  }, 4000);
}

function reiniciarCarruselAuto() {
  clearInterval(carruselInterval);
  iniciarCarruselAuto();
}

// ============================================
// ESTADÍSTICAS ANIMADAS (Contadores)
// ============================================
function inicializarEstadisticas() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animarContador(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  document.querySelectorAll('[data-contar]').forEach(el => {
    observer.observe(el);
  });
}

function animarContador(el) {
  const fin = parseInt(el.dataset.contar);
  const prefijo = el.dataset.prefix || '';
  const sufijo = el.dataset.suffix || '';
  const duracion = 2000;
  const inicio = 0;
  const inicioTiempo = performance.now();
  
  function actualizar(tiempoActual) {
    const transcurrido = tiempoActual - inicioTiempo;
    const progreso = Math.min(transcurrido / duracion, 1);
    
    // Easing ease-out
    const easeOut = 1 - Math.pow(1 - progreso, 3);
    const valorActual = Math.floor(inicio + (fin - inicio) * easeOut);
    
    el.textContent = prefijo + formatearNumero(valorActual) + sufijo;
    
    if (progreso < 1) {
      requestAnimationFrame(actualizar);
    }
  }
  
  requestAnimationFrame(actualizar);
}

// ============================================
// CATÁLOGO PREVIEW — usa imágenes reales del JSON
// ============================================
async function cargarCatalogoPreview() {
  const contenedor = document.getElementById('catalogoPreview');
  if (!contenedor) return;
  
  try {
    const plantas = await cargarTodasLasPlantas();
    const populares = plantas.filter(p => p.populares).slice(0, 10);
    
    // Fallback: show first 10 if no populares flagged
    const lista = populares.length ? populares : plantas.slice(0, 10);

    // Fallback de Unsplash solo si no hay imagen local (para plantas sin foto aún)
    const unsplashFallback = {
      'yuc_001': '1616869294368-28538e052304',
      'yuc_002': '1591955506264-3f55e3d0aade',
      'yuc_003': '1600853729162-b631f2c8c1bc',
      'yuc_004': '1612363229108-2aa702801c81',
      'yuc_005': '1567331711402-509c12c41959',
      'yuc_006': '1591955506264-3f55e3d0aade',
      'yuc_007': '1616869294368-28538e052304',
      'yuc_008': '1600853729162-b631f2c8c1bc',
      'yuc_009': '1612363229108-2aa702801c81',
      'yuc_010': '1567331711402-509c12c41959',
      'qro-001': '1591955506264-3f55e3d0aade',
      'qro-002': '1616869294368-28538e052304',
      'qro-003': '1600853729162-b631f2c8c1bc',
      'qro-004': '1612363229108-2aa702801c81',
      'qro-005': '1567331711402-509c12c41959',
      'qro-006': '1591955506264-3f55e3d0aade',
      'qro-007': '1616869294368-28538e052304',
      'qro-008': '1600853729162-b631f2c8c1bc',
      'qro-009': '1612363229108-2aa702801c81',
      'qro-010': '1567331711402-509c12c41959'
    };
    const fallbackUnsplashId = '1591955506264-3f55e3d0aade';

    contenedor.innerHTML = lista.map(planta => {
      // ✅ USA LA IMAGEN REAL DEL JSON
      const imgLocal = planta.imagenes?.principal;
      const imgUnsplash = unsplashFallback[planta.id] 
        ? `https://images.unsplash.com/photo-${unsplashFallback[planta.id]}?w=400&h=280&fit=crop&auto=format`
        : `https://images.unsplash.com/photo-${fallbackUnsplashId}?w=400&h=280&fit=crop&auto=format`;
      
      // Prioridad: imagen local > Unsplash fallback
      const imgSrc = imgLocal || imgUnsplash;
      const imgFallback = imgUnsplash; // por si la local falla
      
      const color = planta._colorEstado || '#2E7D32';
      
      return `
        <a href="./pages/informacion.html?id=${planta.id}"
           class="planta-card"
           style="text-decoration:none;color:inherit;"
           aria-label="Ver ${planta.nombre_comun}">
          <div class="planta-card-imagen">
            <img src="${imgSrc}"
                 alt="${planta.nombre_comun}"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${imgFallback}';">
            <span class="planta-card-badge badge"
                  style="background:${color}22;color:${color};">
              ${planta._estadoNombre}
            </span>
          </div>
          <div class="planta-card-body">
            <div class="planta-card-nombre">${planta.nombre_comun}</div>
            <div class="planta-card-cientifico font-display">${planta.nombre_cientifico}</div>
            <div style="font-size:.78rem;color:var(--gris-500);margin-bottom:10px;">
              ${planta.familia} · ${planta._alturaTexto || obtenerAlturaPlanta(planta)}
            </div>
            <div class="planta-card-tags">
              ${planta.usos_medicinales.slice(0,2).map(u =>
                `<span class="planta-card-tag" style="background:${color}18;color:${color};">
                  ${u.length > 28 ? u.substring(0,28)+'…' : u}
                </span>`
              ).join('')}
            </div>
            <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:.73rem;color:var(--gris-400);">${planta.abundancia || ''}</span>
              ${planta.mas_vendida ? '<span style="font-size:.72rem;font-weight:600;color:#f59e0b;">⭐ Más vendida</span>' : ''}
            </div>
          </div>
        </a>`;
    }).join('');

  } catch (error) {
    console.error('Error cargando preview:', error);
    contenedor.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--gris-400);">
        <p>No se pudieron cargar las plantas.</p>
      </div>`;
  }
}

// ============================================
// MAPA PREVIEW (Leaflet)
// ============================================
let mapaPreview;

async function inicializarMapaPreview() {
  const contenedor = document.getElementById('mapaPreview');
  if (!contenedor || typeof L === 'undefined') return;
  
  try {
    // Crear mapa
    mapaPreview = L.map('mapaPreview', {
      center: [18.5, -91.0],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true
    });
    
    // Capa base
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(mapaPreview);
    
    // Cargar polígonos de estados
    const estados = ['yucatan', 'qroo', 'campeche', 'tabasco', 'chiapas', 'veracruz'];
    const colores = ['#2E7D32', '#C62828', '#1565C0', '#E65100', '#6A1B9A', '#00695C'];
    
    for (let i = 0; i < estados.length; i++) {
      try {
        const response = await fetch(`../assets/poligonos/${estados[i]}.geojson`);
        if (response.ok) {
          const geojson = await response.json();
          L.geoJSON(geojson, {
            style: {
              color: colores[i],
              weight: 2,
              fillColor: colores[i],
              fillOpacity: 0.3
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`<b>${feature.properties.estado}</b><br>${feature.properties.capital}`);
            }
          }).addTo(mapaPreview);
        }
      } catch (e) {
        console.warn(`No se pudo cargar ${estados[i]}.geojson`);
      }
    }
    
    // Agregar marcadores de plantas
    const plantas = await cargarTodasLasPlantas();
    plantas.forEach(planta => {
      (planta._coordenadas || obtenerCoordenadasPlanta(planta)).forEach(coord => {
        L.marker([coord.lat, coord.lng])
          .addTo(mapaPreview)
          .bindPopup(`<b>${planta.nombre_comun}</b><br><i>${planta.nombre_cientifico}</i><br><a href="./pages/informacion.html?id=${planta.id}">Ver mas</a>`);
      });
    });
    
  } catch (error) {
    console.error('Error inicializando mapa preview:', error);
    contenedor.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#999;">Error cargando el mapa</div>';
  }
}