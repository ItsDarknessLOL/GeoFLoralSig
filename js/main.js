
// Estado global
const AppState = {
  plantasCache: null,
  estadoSeleccionado: null,
  temaActual: 'verde',
  mapaMovilActivo: false,
  ctrlPresionado: false
};

// Colores por estado
const COLORES_ESTADO = {
  'yucatan': { primario: '#2E7D32', secundario: '#A5D6A7', muyClaro: '#E8F5E9', nombre: 'Yucatán' },
  'qroo': { primario: '#C62828', secundario: '#FFCDD2', muyClaro: '#FFEBEE', nombre: 'Quintana Roo' },
  'campeche': { primario: '#1565C0', secundario: '#BBDEFB', muyClaro: '#E3F2FD', nombre: 'Campeche' },
  'chiapas': { primario: '#6A1B9A', secundario: '#CE93D8', muyClaro: '#F3E5F5', nombre: 'Chiapas' },
  'tabasco': { primario: '#E65100', secundario: '#FFCC80', muyClaro: '#FFF3E0', nombre: 'Tabasco' },
  'veracruz': { primario: '#00695C', secundario: '#80CBC4', muyClaro: '#E0F2F1', nombre: 'Veracruz' }
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  inicializarNavegacion();
  inicializarScrollAnimations();
  inicializarHeader();
  inicializarMobileMenu();
  inicializarTema();
  inicializarParallax();
});

// ============================================
// NAVEGACIÓN
// ============================================
function inicializarNavegacion() {
  // Marcar enlace activo según página actual
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === paginaActual || href === `.${paginaActual}` || 
        (paginaActual === '' && href === 'index.html') ||
        (paginaActual === 'index.html' && href === './index.html')) {
      link.classList.add('activo');
    }
  });
}

// ============================================
// HEADER — Adaptive navbar
// Detects scroll AND background brightness
// ============================================
function inicializarHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  // Pages that always start over a light/white background
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
  const paginasConFondoClaro = ['mapa.html'];
  
  if (paginasConFondoClaro.includes(paginaActual)) {
    header.classList.add('header-light');
  }

  const actualizarHeader = () => {
    const scroll = window.scrollY;

    if (paginasConFondoClaro.includes(paginaActual)) {
      // Always light on these pages
      header.classList.add('header-light');
      header.classList.remove('header-scrolled');
      return;
    }

    if (scroll > 60) {
      header.classList.add('header-scrolled');
      header.classList.remove('header-light');
    } else {
      header.classList.remove('header-scrolled');
      header.classList.remove('header-light');
    }
  };

  window.addEventListener('scroll', actualizarHeader, { passive: true });
  actualizarHeader();
}

function inicializarParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
  const parallaxScrollTargets = [...document.querySelectorAll('[data-parallax], [data-parallax-section]')];
  const root = document.documentElement;
  const pointerFino = window.matchMedia('(pointer: fine)').matches;
  const permitirCursor = pointerFino && !['mapa.html', 'visor3d.html'].includes(paginaActual);
  let scrollRaf = null;
  let cursorRaf = null;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  const aplicarTransformParallax = (el, y) => {
    el.style.setProperty('--scroll-parallax-y', `${y.toFixed(2)}px`);
    el.style.transform = 'translate3d(0, var(--scroll-parallax-y, 0px), 0)';
  };

  const actualizarScroll = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    parallaxScrollTargets.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -300 || rect.top > vh + 300) return;

      if (el.hasAttribute('data-parallax-section')) {
        const speed = parseFloat(el.dataset.parallaxSection) || 0.12;
        const center = rect.top + rect.height / 2 - vh / 2;
        aplicarTransformParallax(el, center * speed);
      } else {
        const speed = parseFloat(el.dataset.parallax) || 0.2;
        aplicarTransformParallax(el, scrollY * speed);
      }
    });

    scrollRaf = null;
  };

  const solicitarScroll = () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(actualizarScroll);
  };

  const actualizarCursor = () => {
    const centroX = window.innerWidth / 2;
    const centroY = window.innerHeight / 2;
    const normalX = (mouseX - centroX) / centroX;
    const normalY = (mouseY - centroY) / centroY;

    root.style.setProperty('--cursor-nx', normalX.toFixed(3));
    root.style.setProperty('--cursor-ny', normalY.toFixed(3));
    root.style.setProperty('--cursor-soft-x', `${(normalX * 18).toFixed(2)}px`);
    root.style.setProperty('--cursor-soft-y', `${(normalY * 14).toFixed(2)}px`);
    root.style.setProperty('--cursor-tilt-x', `${(normalX * 2.8).toFixed(2)}deg`);
    root.style.setProperty('--cursor-tilt-y', `${(normalY * -2.2).toFixed(2)}deg`);
    root.style.setProperty('--cursor-light-x', `${((mouseX / window.innerWidth) * 100).toFixed(2)}%`);
    root.style.setProperty('--cursor-light-y', `${((mouseY / window.innerHeight) * 100).toFixed(2)}%`);
    cursorRaf = null;
  };

  window.addEventListener('scroll', solicitarScroll, { passive: true });
  window.addEventListener('resize', solicitarScroll, { passive: true });
  solicitarScroll();

  if (!permitirCursor) return;

  root.classList.add('cursor-parallax-activo');
  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (!cursorRaf) cursorRaf = requestAnimationFrame(actualizarCursor);
  }, { passive: true });
  actualizarCursor();
}


// ============================================
// MENÚ MÓVIL - PANEL LATERAL DERECHO CON OVERLAY
// ============================================
function inicializarMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  if (!toggle || !nav) return;

  // Crear el overlay si no existe
  let overlay = document.querySelector('.menu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
  }

  // Función para abrir el menú
  function abrirMenu() {
    nav.classList.add('activo');
    overlay.classList.add('activo');
    toggle.textContent = '✕';
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Evitar scroll del body
  }

  // Función para cerrar el menú
  function cerrarMenu() {
    nav.classList.remove('activo');
    overlay.classList.remove('activo');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // Restaurar scroll
  }

  // Toggle del menú
  toggle.addEventListener('click', () => {
    if (nav.classList.contains('activo')) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  });

  // Cerrar al hacer click en el overlay
  overlay.addEventListener('click', () => {
    cerrarMenu();
  });

  // Cerrar al hacer click en un enlace
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      cerrarMenu();
    });
  });

  // Cerrar con la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('activo')) {
      cerrarMenu();
    }
  });
}

// ============================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================
function inicializarScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// TEMA / COLORES
// ============================================
function inicializarTema() {
  const root = document.documentElement;
  const colorEstado = localStorage.getItem('colorEstado');
  const colorSecundario = localStorage.getItem('colorSecundario');
  const colorMuyClaro = localStorage.getItem('colorMuyClaro');
  
  if (colorEstado) {
    root.style.setProperty('--color-estado', colorEstado);
    if (colorSecundario) root.style.setProperty('--color-estado-claro', colorSecundario);
    if (colorMuyClaro) root.style.setProperty('--color-estado-muy-claro', colorMuyClaro);
  }
}

function aplicarTemaEstado(estadoKey) {
  const root = document.documentElement;
  const colores = COLORES_ESTADO[estadoKey];
  
  if (colores) {
    root.style.setProperty('--color-estado', colores.primario);
    root.style.setProperty('--color-estado-claro', colores.secundario);
    root.style.setProperty('--color-estado-muy-claro', colores.muyClaro);
    
    localStorage.setItem('colorEstado', colores.primario);
    localStorage.setItem('colorSecundario', colores.secundario);
    localStorage.setItem('colorMuyClaro', colores.muyClaro);
    
    AppState.temaActual = estadoKey;
    AppState.estadoSeleccionado = estadoKey;
  }
}

function resetTema() {
  const root = document.documentElement;
  root.style.setProperty('--color-estado', 'var(--verde-principal)');
  root.style.setProperty('--color-estado-claro', 'var(--verde-claro)');
  root.style.setProperty('--color-estado-muy-claro', 'var(--verde-muy-claro)');
  
  localStorage.removeItem('colorEstado');
  localStorage.removeItem('colorSecundario');
  localStorage.removeItem('colorMuyClaro');
  
  AppState.temaActual = 'verde';
  AppState.estadoSeleccionado = null;
}

// ============================================
// CARGAR PLANTAS
// ============================================
async function cargarTodasLasPlantas() {
  if (AppState.plantasCache) return AppState.plantasCache;
  
  const estados = ['yucatan', 'qroo', 'campeche', 'chiapas', 'tabasco', 'veracruz'];
  const todasLasPlantas = [];
  
  try {
    for (const estado of estados) {
      const response = await fetch(`../json/${estado}.json`);
      if (response.ok) {
        const data = await response.json();
        data.plantas.forEach(planta => {
          planta._estado = estado;
          planta._estadoNombre = data.estado;
          planta._colorEstado = data.color_tema;
          planta._alturaTexto = obtenerAlturaPlanta(planta);
          planta._coordenadaPrincipal = obtenerCoordenadaPrincipal(planta);
          planta._coordenadas = obtenerCoordenadasPlanta(planta);
          todasLasPlantas.push(planta);
        });
      }
    }
    
    AppState.plantasCache = todasLasPlantas;
    return todasLasPlantas;
  } catch (error) {
    console.error('Error cargando plantas:', error);
    return [];
  }
}

// ============================================
// UTILIDADES
// ============================================

// Búsqueda fuzzy simple (distancia de Levenshtein)
function distanciaLevenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1] 
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function busquedaFuzzy(query, texto) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  const t = texto.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  
  // Coincidencia exacta o substring
  if (t.includes(q)) return 1.0;
  
  // Distancia Levenshtein
  const dist = distanciaLevenshtein(q, t.substring(0, Math.min(t.length, q.length + 3)));
  if (dist <= 2) return 0.7 - (dist * 0.1);
  
  return 0;
}

function normalizarTexto(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
}

function obtenerAlturaPlanta(planta) {
  return planta?.altura || planta?.sig?.altitud || 'No registrada';
}

function obtenerCoordenadasPlanta(planta) {
  const coordenadas = planta?.sig?.coordenadas;
  if (!coordenadas) return [];
  const lista = Array.isArray(coordenadas) ? coordenadas : [coordenadas];

  return lista.filter(coord =>
    coord &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    Number.isFinite(coord.lat) &&
    Number.isFinite(coord.lng)
  );
}

function obtenerCoordenadaPrincipal(planta) {
  return obtenerCoordenadasPlanta(planta)[0] || null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatearNumero(num) {
  return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
}

// ============================================
// MAPA UTILIDADES
// ============================================
function inicializarControlMapa(map) {
  // Ctrl para mover en desktop
  let ctrlPresionado = false;
  let mapaBloqueado = true;
  
  map.dragging.disable();
  map.scrollWheelZoom.disable();
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
      ctrlPresionado = true;
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      document.querySelector('.mapa-wrapper')?.classList.remove('mapa-ctrl-bloqueado');
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
      ctrlPresionado = false;
      if (mapaBloqueado) {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
      }
    }
  });
  
  // Botón móvil
  const btnMovil = document.getElementById('btnMapaMovil');
  if (btnMovil) {
    btnMovil.addEventListener('click', () => {
      AppState.mapaMovilActivo = !AppState.mapaMovilActivo;
      
      if (AppState.mapaMovilActivo) {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        btnMovil.textContent = '🔒 Bloquear mapa';
      } else {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        btnMovil.textContent = '🔓 Mover mapa';
      }
    });
  }
  
  // Mostrar hint inicial
  const mapWrapper = document.querySelector('.mapa-wrapper');
  if (mapWrapper && window.innerWidth > 768) {
    mapWrapper.classList.add('mapa-ctrl-bloqueado');
  }
  
  return { ctrlPresionado, mapaBloqueado };
}

// ============================================
// GENERAR ESTRELLAS (para hero)
// ============================================
function generarEstrellas(contenedor, cantidad = 50) {
  for (let i = 0; i < cantidad; i++) {
    const estrella = document.createElement('div');
    estrella.style.cssText = `
      position: absolute;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      background: rgba(255,255,255,${Math.random() * 0.8 + 0.2});
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite alternate;
      animation-delay: ${Math.random() * 3}s;
    `;
    contenedor.appendChild(estrella);
  }
}

// ============================================
// NOTIFICACIONES (Toast)
// ============================================
function mostrarToast(mensaje, tipo = 'info') {
  const colores = {
    info: '#2E7D32',
    error: '#C62828',
    warning: '#E65100',
    success: '#00695C'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    padding: 14px 24px;
    background: ${colores[tipo] || colores.info};
    color: white;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: fadeInRight 0.3s ease forwards;
  `;
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeInRight 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// LENIS — Smooth scroll (skip on overflow:hidden pages)
// ============================================
(function inicializarLenis() {
  if (typeof Lenis === 'undefined') return;

  // Skip smooth scroll on pages where body is overflow:hidden
  const bodyOverflow = window.getComputedStyle(document.body).overflow;
  const esMapaOVisor = ['mapa.html', 'visor3d.html'].some(p =>
    window.location.pathname.includes(p)
  );
  if (esMapaOVisor || bodyOverflow === 'hidden') return;

  const lenis = new Lenis({
    duration: 1.6,
    smoothWheel: true,
    touchMultiplier: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Expose for external use
  window.lenisInstance = lenis;
})();

// Exportar funciones globales
window.AppState = AppState;
window.COLORES_ESTADO = COLORES_ESTADO;
window.aplicarTemaEstado = aplicarTemaEstado;
window.resetTema = resetTema;
window.cargarTodasLasPlantas = cargarTodasLasPlantas;
window.busquedaFuzzy = busquedaFuzzy;
window.normalizarTexto = normalizarTexto;
window.obtenerAlturaPlanta = obtenerAlturaPlanta;
window.obtenerCoordenadasPlanta = obtenerCoordenadasPlanta;
window.obtenerCoordenadaPrincipal = obtenerCoordenadaPrincipal;
window.distanciaLevenshtein = distanciaLevenshtein;
window.debounce = debounce;
window.formatearNumero = formatearNumero;
window.inicializarControlMapa = inicializarControlMapa;
window.generarEstrellas = generarEstrellas;
window.mostrarToast = mostrarToast;
