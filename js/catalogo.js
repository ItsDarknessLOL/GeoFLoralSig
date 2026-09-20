/**
 * catalogo.js - Catálogo con buscador fuzzy, filtros y paginación
 */

// Estado del catálogo
const CatalogoState = {
  todasLasPlantas: [],
  plantasFiltradas: [],
  paginaActual: 1,
  itemsPorPagina: 9,
  filtros: {
    busqueda: '',
    estado: '',
    familia: '',
    uso: '',
    abundancia: '',
    popular: '',
    conservacion: ''
  }
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarCatalogo();
});

async function inicializarCatalogo() {
  // Cargar plantas
  const plantas = await cargarTodasLasPlantas();
  CatalogoState.todasLasPlantas = plantas;
  CatalogoState.plantasFiltradas = [...plantas];
  
  // Llenar filtro de familias
  llenarFiltroFamilias(plantas);
  
  // Verificar parámetros URL
  verificarParametrosURL();
  
  // Renderizar
  renderizarCatalogo();
  
  // Event listeners
  inicializarEventListeners();
}

function llenarFiltroFamilias(plantas) {
  const select = document.getElementById('filtroFamilia');
  if (!select) return;
  
  const familias = [...new Set(plantas.map(p => p.familia))].sort();
  familias.forEach(familia => {
    const option = document.createElement('option');
    option.value = familia;
    option.textContent = familia;
    select.appendChild(option);
  });
}

function verificarParametrosURL() {
  const params = new URLSearchParams(window.location.search);
  const estado = params.get('estado');
  
  if (estado) {
    const selectEstado = document.getElementById('filtroEstado');
    if (selectEstado) selectEstado.value = estado;
    CatalogoState.filtros.estado = estado;
    aplicarTemaEstado(estado);
    mostrarDecoracionEstado(estado);
  }
}

function inicializarEventListeners() {
  // Buscador con debounce
  const buscador = document.getElementById('buscadorCatalogo');
  if (buscador) {
    buscador.addEventListener('input', debounce(() => {
      CatalogoState.filtros.busqueda = buscador.value;
      CatalogoState.paginaActual = 1;
      filtrarPlantas();
    }, 300));
  }
  
  // Filtros
  document.getElementById('filtroEstado')?.addEventListener('change', (e) => {
    CatalogoState.filtros.estado = e.target.value;
    CatalogoState.paginaActual = 1;
    
    if (e.target.value) {
      aplicarTemaEstado(e.target.value);
      mostrarDecoracionEstado(e.target.value);
    } else {
      resetTema();
      ocultarDecoracionEstado();
    }
    
    filtrarPlantas();
  });
  
  document.getElementById('filtroFamilia')?.addEventListener('change', (e) => {
    CatalogoState.filtros.familia = e.target.value;
    CatalogoState.paginaActual = 1;
    filtrarPlantas();
  });
  
  document.getElementById('filtroUso')?.addEventListener('change', (e) => {
    CatalogoState.filtros.uso = e.target.value;
    CatalogoState.paginaActual = 1;
    filtrarPlantas();
  });
  
  document.getElementById('filtroAbundancia')?.addEventListener('change', (e) => {
    CatalogoState.filtros.abundancia = e.target.value;
    CatalogoState.paginaActual = 1;
    filtrarPlantas();
  });
  
  document.getElementById('filtroPopular')?.addEventListener('change', (e) => {
    CatalogoState.filtros.popular = e.target.value;
    CatalogoState.paginaActual = 1;
    filtrarPlantas();
  });
  
  document.getElementById('filtroConservacion')?.addEventListener('change', (e) => {
    CatalogoState.filtros.conservacion = e.target.value;
    CatalogoState.paginaActual = 1;
    filtrarPlantas();
  });
  
  document.getElementById('ordenarPor')?.addEventListener('change', () => {
    filtrarPlantas();
  });
}

// ============================================
// BÚSQUEDA FUZZY
// ============================================
function filtrarPlantas() {
  let resultados = [...CatalogoState.todasLasPlantas];
  const f = CatalogoState.filtros;
  
  // Búsqueda fuzzy
  if (f.busqueda) {
    const query = normalizarTexto(f.busqueda);
    resultados = resultados.filter(planta => {
      const nombreComun = normalizarTexto(planta.nombre_comun);
      const nombreCientifico = normalizarTexto(planta.nombre_cientifico);
      const familia = normalizarTexto(planta.familia);
      const usos = planta.usos_medicinales.map(u => normalizarTexto(u)).join(' ');
      const genero = normalizarTexto(planta.genero);
      const especie = normalizarTexto(planta.especie);
      
      // Coincidencia exacta o substring
      if (nombreComun.includes(query)) return true;
      if (nombreCientifico.includes(query)) return true;
      if (familia.includes(query)) return true;
      if (usos.includes(query)) return true;
      if (genero.includes(query)) return true;
      if (especie.includes(query)) return true;
      
      // Búsqueda fuzzy con Levenshtein
      const palabrasQuery = query.split(/\s+/);
      const palabrasNombre = nombreComun.split(/\s+/);
      const palabrasCientifico = nombreCientifico.split(/\s+/);
      
      for (const pq of palabrasQuery) {
        if (pq.length < 2) continue;
        
        for (const pn of palabrasNombre) {
          if (distanciaLevenshtein(pq, pn.substring(0, Math.min(pn.length, pq.length + 3))) <= 2) return true;
        }
        
        for (const pc of palabrasCientifico) {
          if (distanciaLevenshtein(pq, pc.substring(0, Math.min(pc.length, pq.length + 3))) <= 2) return true;
        }
      }
      
      return false;
    });
  }
  
  // Filtro estado
  if (f.estado) {
    resultados = resultados.filter(p => p._estado === f.estado);
  }
  
  // Filtro familia
  if (f.familia) {
    resultados = resultados.filter(p => p.familia === f.familia);
  }
  
  // Filtro uso
  if (f.uso) {
    resultados = resultados.filter(p => {
      const usos = p.usos_medicinales.map(u => normalizarTexto(u)).join(' ');
      return usos.includes(f.uso);
    });
  }
  
  // Filtro abundancia
  if (f.abundancia) {
    resultados = resultados.filter(p => p.abundancia === f.abundancia);
  }
  
  // Filtro popular
  if (f.popular === 'populares') {
    resultados = resultados.filter(p => p.populares);
  } else if (f.popular === 'mas_vendidas') {
    resultados = resultados.filter(p => p.mas_vendida);
  }
  
  // Filtro conservación
  if (f.conservacion) {
    resultados = resultados.filter(p => p.estado_conservacion.includes(f.conservacion));
  }
  
  // Ordenar
  const ordenar = document.getElementById('ordenarPor')?.value || 'nombre';
  switch (ordenar) {
    case 'nombre':
      resultados.sort((a, b) => a.nombre_comun.localeCompare(b.nombre_comun));
      break;
    case 'nombre_desc':
      resultados.sort((a, b) => b.nombre_comun.localeCompare(a.nombre_comun));
      break;
    case 'estado':
      resultados.sort((a, b) => (a._estadoNombre || '').localeCompare(b._estadoNombre || ''));
      break;
    case 'fecha':
      resultados.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
      break;
  }
  
  CatalogoState.plantasFiltradas = resultados;
  renderizarCatalogo();
}

// ============================================
// RENDERIZAR CATÁLOGO
// ============================================
function renderizarCatalogo() {
  const grid = document.getElementById('catalogoGrid');
  const paginacion = document.getElementById('paginacion');
  const info = document.getElementById('resultadosInfo');
  
  if (!grid) return;
  
  const total = CatalogoState.plantasFiltradas.length;
  const totalPaginas = Math.ceil(total / CatalogoState.itemsPorPagina);
  const inicio = (CatalogoState.paginaActual - 1) * CatalogoState.itemsPorPagina;
  const fin = inicio + CatalogoState.itemsPorPagina;
  const plantasPagina = CatalogoState.plantasFiltradas.slice(inicio, fin);
  
  // Info
  if (info) {
    if (CatalogoState.filtros.busqueda) {
      info.innerHTML = `Mostrando <strong>${total}</strong> resultado(s) para "<em>${CatalogoState.filtros.busqueda}</em>" — Página ${CatalogoState.paginaActual} de ${totalPaginas || 1}`;
    } else {
      info.innerHTML = `Mostrando <strong>${total}</strong> especie(s) — Página ${CatalogoState.paginaActual} de ${totalPaginas || 1}`;
    }
  }
  
  // Grid
  if (total === 0) {
    grid.innerHTML = `
      <div class="sin-resultados" style="grid-column: 1 / -1;">
        <div class="sin-resultados-icono">🔍</div>
        <h3>No se encontraron resultados</h3>
        <p>Intenta con otros términos o ajusta los filtros.</p>
        ${CatalogoState.filtros.busqueda ? `<p style="margin-top: 8px; font-size: 0.85rem;">Buscando: "${CatalogoState.filtros.busqueda}"</p>` : ''}
      </div>
    `;
    if (paginacion) paginacion.innerHTML = '';
    return;
  }
  
  grid.innerHTML = plantasPagina.map(planta => {
  const color = planta._colorEstado || '#2E7D32';

  return `
    <a href="informacion.html?id=${planta.id}"
       class="planta-card"
       style="text-decoration:none;color:inherit;"
       role="listitem"
       aria-label="Ver ${planta.nombre_comun}">
      <div class="planta-card-imagen">
        <img
          src="${planta.imagenes.principal}"
          alt="${planta.nombre_comun}"
          loading="lazy"
          onerror="this.src='./assets/img/no-image.jpg'">

        <span class="planta-card-badge badge"
              style="background:${color}22;color:${color};">
          ${planta._estadoNombre}
        </span>
      </div>

      <div class="planta-card-body">
        <div class="planta-card-nombre">${planta.nombre_comun}</div>

        <div class="planta-card-cientifico font-display">
          ${planta.nombre_cientifico}
        </div>

        <div style="margin-top:6px;font-size:.78rem;color:var(--gris-500);margin-bottom:10px;">
          ${planta.familia} · ${planta._alturaTexto || obtenerAlturaPlanta(planta)}
        </div>

        <div class="planta-card-tags">
          ${planta.usos_medicinales.slice(0,2).map(u => `
            <span class="planta-card-tag"
                  style="background:${color}18;color:${color};">
              ${u.length > 28 ? u.substring(0,28) + '…' : u}
            </span>
          `).join('')}
        </div>

        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:.72rem;color:var(--gris-400);">
            ${planta.abundancia || ''}
          </span>

          ${planta.mas_vendida
            ? '<span style="font-size:.72rem;font-weight:700;color:#d97706;">⭐ Más vendida</span>'
            : ''}
        </div>
      </div>
    </a>
  `;
}).join('');
  
  // Paginación
  renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
  const paginacion = document.getElementById('paginacion');
  if (!paginacion || totalPaginas <= 1) {
    if (paginacion) paginacion.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Botón anterior
  html += `<button class="paginacion-btn" ${CatalogoState.paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPagina(${CatalogoState.paginaActual - 1})">← Anterior</button>`;
  
  // Primera página
  if (CatalogoState.paginaActual > 3) {
    html += `<button class="paginacion-btn" onclick="cambiarPagina(1)">1</button>`;
    if (CatalogoState.paginaActual > 4) html += `<span style="padding: 10px;">...</span>`;
  }
  
  // Páginas cercanas
  for (let i = Math.max(1, CatalogoState.paginaActual - 2); i <= Math.min(totalPaginas, CatalogoState.paginaActual + 2); i++) {
    html += `<button class="paginacion-btn ${i === CatalogoState.paginaActual ? 'activo' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
  }
  
  // Última página
  if (CatalogoState.paginaActual < totalPaginas - 2) {
    if (CatalogoState.paginaActual < totalPaginas - 3) html += `<span style="padding: 10px;">...</span>`;
    html += `<button class="paginacion-btn" onclick="cambiarPagina(${totalPaginas})">${totalPaginas}</button>`;
  }
  
  // Botón siguiente
  html += `<button class="paginacion-btn" ${CatalogoState.paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPagina(${CatalogoState.paginaActual + 1})">Siguiente →</button>`;
  
  paginacion.innerHTML = html;
}

function cambiarPagina(pagina) {
  CatalogoState.paginaActual = pagina;
  renderizarCatalogo();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// DECORACIÓN POR ESTADO
// ============================================
const emojisEstado = {
  'yucatan': '🌵',
  'qroo': '🏖️',
  'campeche': '🐊',
  'chiapas': '🌲',
  'tabasco': '🌊',
  'veracruz': '🏔️'
};

function mostrarDecoracionEstado(estado) {
  const decoracion = document.getElementById('decoracionLateral');
  if (!decoracion) return;
  
  decoracion.textContent = emojisEstado[estado] || '🌿';
  decoracion.classList.add('visible');
  document.body.classList.add('tema-activo');
}

function ocultarDecoracionEstado() {
  const decoracion = document.getElementById('decoracionLateral');
  if (!decoracion) return;
  
  decoracion.classList.remove('visible');
  document.body.classList.remove('tema-activo');
}

// Imágenes placeholder por planta
function getImagenPlanta(id) {
  const imagenes = {
    'yuc_001': '1616869294368-28538e052304',
    'qro_001': '1591955506264-3f55e3d0aade',
    'cam_001': '1600853729162-b631f2c8c1bc',
    'chi_001': '1612363229108-2aa702801c81',
    'tab_001': '1567331711402-509c12c41959',
    'ver_001': '1591955506264-3f55e3d0aade'
  };
  return imagenes[id] || '1591955506264-3f55e3d0aade';
}
