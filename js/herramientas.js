/**
 * herramientas.js - 8 herramientas especializadas
 */

let mapaCalc;
let drawControl;
let capasDibujo;
let todasLasPlantasHerr = [];

document.addEventListener('DOMContentLoaded', () => {
  inicializarHerramientas();
});

async function inicializarHerramientas() {
  // Cargar todas las plantas
  todasLasPlantasHerr = await cargarTodasLasPlantas();
  
  // Llenar selects
  llenarSelects();
  
  // Inicializar mapa calculadora
  inicializarMapaCalculadora();
  
  // Inicializar gráfica
  inicializarGrafica();
}

// ============================================
// 1. LLENAR SELECTS
// ============================================
function llenarSelects() {
  // Comparador
  const sel1 = document.getElementById('compEspecie1');
  const sel2 = document.getElementById('compEspecie2');
  const selFicha = document.getElementById('fichaPlanta');
  
  todasLasPlantasHerr.forEach(planta => {
    const texto = `${planta.nombre_comun} (${planta.nombre_cientifico})`;
    const val = planta.id;
    
    if (sel1) sel1.add(new Option(texto, val));
    if (sel2) sel2.add(new Option(texto, val));
    if (selFicha) selFicha.add(new Option(texto, val));
  });
}

// ============================================
// 2. BUSCADOR DE ESPECIES
// ============================================
function buscarEspecies(query) {
  const contenedor = document.getElementById('resultadosBuscador');
  if (!contenedor) return;
  
  if (!query.trim()) {
    contenedor.innerHTML = '';
    return;
  }
  
  const q = normalizarTexto(query);
  const resultados = todasLasPlantasHerr.filter(planta => {
    const nc = normalizarTexto(planta.nombre_comun);
    const nci = normalizarTexto(planta.nombre_cientifico);
    const usos = planta.usos_medicinales.map(u => normalizarTexto(u)).join(' ');
    
    if (nc.includes(q) || nci.includes(q) || usos.includes(q)) return true;
    if (distanciaLevenshtein(q, nc.substring(0, Math.min(nc.length, q.length + 3))) <= 2) return true;
    return false;
  }).slice(0, 10);
  
  if (resultados.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; color: var(--gris-medio); padding: 20px;">No se encontraron resultados</p>';
    return;
  }
  
  contenedor.innerHTML = resultados.map(p => `
    <div class="resultado-item" onclick="window.location.href='informacion.html?id=${p.id}'">
      <h4>${p.nombre_comun}</h4>
      <p style="font-style: italic;">${p.nombre_cientifico} · ${p._estadoNombre}</p>
      <p>💊 ${p.usos_medicinales.slice(0, 2).join(', ')}</p>
    </div>
  `).join('');
}

// ============================================
// 3. LOCALIZADOR DE ESPECIES
// ============================================
const municipiosPorEstado = {
  'yucatan': ['Mérida', 'Valladolid', 'Tizimín', 'Progreso', 'Izamal', 'Umán'],
  'qroo': ['Benito Juárez', 'Solidaridad', 'Othón P. Blanco', 'Cozumel', 'Felipe Carrillo Puerto'],
  'campeche': ['Campeche', 'Ciudad del Carmen', 'Champotón', 'Escárcega', 'Calakmul'],
  'chiapas': ['Tuxtla Gutiérrez', 'San Cristóbal', 'Tapachula', 'Comitán', 'Palenque'],
  'tabasco': ['Centro', 'Cárdenas', 'Comalcalco', 'Paraíso', 'Macuspana'],
  'veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Orizaba', 'Poza Rica']
};

function cargarMunicipios() {
  const estado = document.getElementById('locEstado').value;
  const select = document.getElementById('locMunicipio');
  
  select.innerHTML = '<option value="">Todos los municipios</option>';
  
  if (estado && municipiosPorEstado[estado]) {
    municipiosPorEstado[estado].forEach(m => {
      select.add(new Option(m, m));
    });
  }
}

function localizarEspecies() {
  const estado = document.getElementById('locEstado').value;
  const municipio = document.getElementById('locMunicipio').value;
  const contenedor = document.getElementById('resultadosLocalizador');
  
  if (!estado) {
    contenedor.innerHTML = '<p style="color: var(--gris-medio);">Selecciona un estado primero</p>';
    return;
  }
  
  // Filtrar plantas por estado
  let resultados = todasLasPlantasHerr.filter(p => p._estado === estado);
  
  if (resultados.length === 0) {
    contenedor.innerHTML = '<p style="color: var(--gris-medio);">No hay especies registradas para esta zona</p>';
    return;
  }
  
  contenedor.innerHTML = `
    <p style="font-size: 0.85rem; color: var(--gris-medio); margin-bottom: 8px;">
      ${resultados.length} especie(s) en ${municipio || document.getElementById('locEstado').options[document.getElementById('locEstado').selectedIndex].text}
    </p>
    ${resultados.map(p => `
      <div class="resultado-item" onclick="window.location.href='informacion.html?id=${p.id}'">
        <h4>${p.nombre_comun}</h4>
        <p style="font-style: italic;">${p.nombre_cientifico}</p>
        <p>📍 ${p.distribucion.substring(0, 60)}...</p>
      </div>
    `).join('')}
  `;
}

// ============================================
// 4. COMPARADOR DE ESPECIES
// ============================================
function compararEspecies() {
  const id1 = document.getElementById('compEspecie1').value;
  const id2 = document.getElementById('compEspecie2').value;
  const contenedor = document.getElementById('tablaComparacion');
  
  if (!id1 || !id2) {
    contenedor.innerHTML = '<p style="color: var(--gris-medio); text-align: center;">Selecciona dos especies para comparar</p>';
    return;
  }
  
  const p1 = todasLasPlantasHerr.find(p => p.id === id1);
  const p2 = todasLasPlantasHerr.find(p => p.id === id2);
  
  if (!p1 || !p2) return;
  
  contenedor.innerHTML = `
    <table class="tabla-comparativa" style="font-size: 0.85rem;">
      <thead>
        <tr>
          <th>Característica</th>
          <th>${p1.nombre_comun}</th>
          <th>${p2.nombre_comun}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Nombre científico</strong></td>
          <td style="font-style: italic;">${p1.nombre_cientifico}</td>
          <td style="font-style: italic;">${p2.nombre_cientifico}</td>
        </tr>
        <tr>
          <td><strong>Familia</strong></td>
          <td>${p1.familia}</td>
          <td>${p2.familia}</td>
        </tr>
        <tr>
          <td><strong>Altura</strong></td>
          <td>${p1._alturaTexto || obtenerAlturaPlanta(p1)}</td>
          <td>${p2._alturaTexto || obtenerAlturaPlanta(p2)}</td>
        </tr>
        <tr>
          <td><strong>Distribución</strong></td>
          <td>${p1.distribucion.substring(0, 80)}...</td>
          <td>${p2.distribucion.substring(0, 80)}...</td>
        </tr>
        <tr>
          <td><strong>Usos medicinales</strong></td>
          <td>${p1.usos_medicinales.join(', ')}</td>
          <td>${p2.usos_medicinales.join(', ')}</td>
        </tr>
        <tr>
          <td><strong>Conservación</strong></td>
          <td>${p1.estado_conservacion}</td>
          <td>${p2.estado_conservacion}</td>
        </tr>
        <tr>
          <td><strong>Abundancia</strong></td>
          <td>${p1.abundancia}</td>
          <td>${p2.abundancia}</td>
        </tr>
        <tr>
          <td><strong>Hábitat</strong></td>
          <td>${p1.habitat.substring(0, 80)}...</td>
          <td>${p2.habitat.substring(0, 80)}...</td>
        </tr>
        <tr>
          <td><strong>Estado</strong></td>
          <td>${p1._estadoNombre}</td>
          <td>${p2._estadoNombre}</td>
        </tr>
      </tbody>
    </table>
  `;
}

// ============================================
// 5. CALCULADORA SIG
// ============================================
function inicializarMapaCalculadora() {
  const contenedor = document.getElementById('mapaCalculadora');
  if (!contenedor || typeof L === 'undefined') return;
  
  mapaCalc = L.map('mapaCalculadora', {
    center: [18.5, -91.0],
    zoom: 6,
    zoomControl: false
  });
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(mapaCalc);
  
  capasDibujo = new L.FeatureGroup();
  mapaCalc.addLayer(capasDibujo);
}

function activarMedicion(tipo) {
  if (!mapaCalc) return;
  
  // Limpiar dibujos anteriores
  capasDibujo.clearLayers();
  
  if (tipo === 'distancia') {
    const control = new L.Draw.Polyline(mapaCalc, {
      shapeOptions: { color: '#2E7D32', weight: 4 }
    });
    control.enable();
    
    mapaCalc.once('draw:created', (e) => {
      capasDibujo.addLayer(e.layer);
      const distancia = (L.GeometryUtil?.length || (() => 0))(e.layer);
      // Calcular distancia manualmente si no hay GeometryUtil
      const latlngs = e.layer.getLatLngs();
      let total = 0;
      for (let i = 1; i < latlngs.length; i++) {
        total += latlngs[i-1].distanceTo(latlngs[i]);
      }
      const km = (total / 1000).toFixed(2);
      document.getElementById('resultadoMedicion').innerHTML = `📏 <strong>Distancia:</strong> ${km} km (${total.toFixed(0)} m)`;
    });
  } else if (tipo === 'area') {
    const control = new L.Draw.Polygon(mapaCalc, {
      shapeOptions: { color: '#2E7D32', weight: 2, fillOpacity: 0.2 }
    });
    control.enable();
    
    mapaCalc.once('draw:created', (e) => {
      capasDibujo.addLayer(e.layer);
      const area = calcularArea(e.layer);
      document.getElementById('resultadoMedicion').innerHTML = `⬡ <strong>Área:</strong> ${area} km²`;
    });
  }
}

function activarDibujo() {
  if (!mapaCalc) return;
  capasDibujo.clearLayers();
  
  const control = new L.Draw.Polygon(mapaCalc, {
    shapeOptions: { color: '#1565C0', weight: 2, fillColor: '#1565C0', fillOpacity: 0.15 }
  });
  control.enable();
  
  mapaCalc.once('draw:created', (e) => {
    capasDibujo.addLayer(e.layer);
    document.getElementById('resultadoMedicion').innerHTML = '✏️ Polígono dibujado. Usa "Distancia" o "Área" para medir.';
  });
}

function limpiarMediciones() {
  if (capasDibujo) {
    capasDibujo.clearLayers();
  }
  document.getElementById('resultadoMedicion').innerHTML = '';
}

function calcularArea(layer) {
  const latlngs = layer.getLatLngs()[0] || layer.getLatLngs();
  if (latlngs.length < 3) return '0';
  
  // Fórmula del shoelace simplificada (aproximación)
  let area = 0;
  const R = 6371000; // Radio de la Tierra en metros
  
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    const xi = latlngs[i].lng * Math.PI / 180;
    const yi = latlngs[i].lat * Math.PI / 180;
    const xj = latlngs[j].lng * Math.PI / 180;
    const yj = latlngs[j].lat * Math.PI / 180;
    area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
  }
  
  area = Math.abs(area) * R * R / 2;
  return (area / 1000000).toFixed(3); // km²
}

// ============================================
// 6. CONVERSOR DE COORDENADAS
// ============================================
function convertirCoordenadas() {
  const lat = parseFloat(document.getElementById('convLat').value);
  const lng = parseFloat(document.getElementById('convLng').value);
  
  if (isNaN(lat) || isNaN(lng)) {
    document.getElementById('resultadoUTM').textContent = 'UTM: Ingresa coordenadas válidas';
    return;
  }
  
  // Conversión simplificada a UTM (zona 15N/16N)
  const utm = latLngToUTM(lat, lng);
  document.getElementById('resultadoUTM').innerHTML = `
    <strong>UTM Zona ${utm.zona}N</strong><br>
    X (Este): ${utm.x.toFixed(2)} m<br>
    Y (Norte): ${utm.y.toFixed(2)} m
  `;
}

function convertirUTM() {
  const x = parseFloat(document.getElementById('utmX').value);
  const y = parseFloat(document.getElementById('utmY').value);
  
  if (isNaN(x) || isNaN(y)) {
    document.getElementById('resultadoLatLng').textContent = 'Lat/Lng: Ingresa coordenadas válidas';
    return;
  }
  
  // Conversión simplificada UTM a Lat/Lng (zona 15N)
  const latlng = utmToLatLng(x, y, 15);
  document.getElementById('resultadoLatLng').innerHTML = `
    <strong>WGS84</strong><br>
    Latitud: ${latlng.lat.toFixed(4)}°<br>
    Longitud: ${latlng.lng.toFixed(4)}°
  `;
}

function latLngToUTM(lat, lng) {
  const zona = Math.floor((lng + 180) / 6) + 1;
  const a = 6378137; // WGS84
  const e = 0.081819191;
  const k0 = 0.9996;
  
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const lng0 = ((zona - 1) * 6 - 180 + 3) * Math.PI / 180;
  
  const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = e * e * Math.cos(latRad) * Math.cos(latRad) / (1 - e * e);
  const A = Math.cos(latRad) * (lngRad - lng0);
  const M = a * ((1 - e * e / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256) * latRad
    - (3 * e * e / 8 + 3 * Math.pow(e, 4) / 32 + 45 * Math.pow(e, 6) / 1024) * Math.sin(2 * latRad)
    + (15 * Math.pow(e, 4) / 256 + 45 * Math.pow(e, 6) / 1024) * Math.sin(4 * latRad)
    - (35 * Math.pow(e, 6) / 3072) * Math.sin(6 * latRad));
  
  const x = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * 0.006739497) * Math.pow(A, 5) / 120) + 500000;
  const y = k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * 0.006739497) * Math.pow(A, 6) / 720));
  
  return { x, y: lat < 0 ? y + 10000000 : y, zona };
}

function utmToLatLng(x, y, zona) {
  const a = 6378137;
  const e = 0.081819191;
  const k0 = 0.9996;
  const e2 = 0.006739497;
  
  const xAdj = x - 500000;
  const yAdj = y; // Asumiendo hemisferio norte
  
  const M = yAdj / k0;
  const mu = M / (a * (1 - e * e / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256));
  
  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));
  const lat1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu)
    + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
    + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);
  
  const C1 = e2 * Math.cos(lat1) * Math.cos(lat1);
  const T1 = Math.tan(lat1) * Math.tan(lat1);
  const N1 = a / Math.sqrt(1 - e * e * Math.sin(lat1) * Math.sin(lat1));
  const R1 = a * (1 - e * e) / Math.pow(1 - e * e * Math.sin(lat1) * Math.sin(lat1), 1.5);
  const D = xAdj / (N1 * k0);
  
  const lat = lat1 - (N1 * Math.tan(lat1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e2) * Math.pow(D, 4) / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e2 - 3 * C1 * C1) * Math.pow(D, 6) / 720);
  
  const lng0 = (zona - 1) * 6 - 180 + 3;
  const lng = lng0 * Math.PI / 180 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e2 + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(lat1);
  
  return { lat: lat * 180 / Math.PI, lng: lng * 180 / Math.PI };
}

// ============================================
// 7. GENERADOR DE FICHAS
// ============================================
function generarVistaPreviaFicha() {
  const id = document.getElementById('fichaPlanta').value;
  const preview = document.getElementById('fichaPreview');
  const contenido = document.getElementById('fichaContenido');
  
  if (!id) {
    preview.style.display = 'none';
    return;
  }
  
  const planta = todasLasPlantasHerr.find(p => p.id === id);
  if (!planta) return;
  
  preview.style.display = 'block';
  contenido.innerHTML = `
    <h4 style="margin: 0 0 4px; color: var(--negro);">${planta.nombre_comun}</h4>
    <p style="font-style: italic; color: var(--color-estado); margin: 0 0 8px; font-size: 0.85rem;">${planta.nombre_cientifico}</p>
    <div style="font-size: 0.8rem; color: var(--gris-medio); line-height: 1.6;">
      <p><strong>Familia:</strong> ${planta.familia}</p>
      <p><strong>Altura:</strong> ${planta._alturaTexto || obtenerAlturaPlanta(planta)}</p>
      <p><strong>Estado:</strong> ${planta._estadoNombre}</p>
      <p><strong>Usos:</strong> ${planta.usos_medicinales.join(', ')}</p>
    </div>
  `;
}

function descargarFichaPDF() {
  const id = document.getElementById('fichaPlanta').value;
  if (!id) {
    mostrarToast('Selecciona una planta primero', 'warning');
    return;
  }
  
  const planta = todasLasPlantasHerr.find(p => p.id === id);
  if (!planta) return;
  
  // Crear contenido HTML para imprimir/PDF
  const ventana = window.open('', '_blank');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ficha - ${planta.nombre_comun}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #2E7D32; border-bottom: 3px solid #2E7D32; padding-bottom: 10px; }
        h2 { color: #424242; font-size: 1.1rem; margin-top: 24px; }
        .meta { color: #666; font-style: italic; margin-bottom: 16px; }
        .section { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${planta.nombre_comun}</h1>
      <p class="meta">${planta.nombre_cientifico} · ${planta.familia}</p>
      
      <div class="section">
        <h2>📝 Descripción</h2>
        <p>${planta.descripcion}</p>
      </div>
      
      <div class="section">
        <h2>💊 Usos Medicinales</h2>
        <ul>${planta.usos_medicinales.map(u => `<li>${u}</li>`).join('')}</ul>
      </div>
      
      <div class="section">
        <h2>🧪 Componentes Activos</h2>
        <ul>${planta.componentes_activos.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>
      
      <div class="section">
        <h2>📊 Datos</h2>
        <table>
          <tr><th>Atributo</th><th>Valor</th></tr>
          <tr><td>Hábitat</td><td>${planta.habitat}</td></tr>
          <tr><td>Distribución</td><td>${planta.distribucion}</td></tr>
          <tr><td>Abundancia</td><td>${planta.abundancia}</td></tr>
          <tr><td>Conservación</td><td>${planta.estado_conservacion}</td></tr>
          <tr><td>Altura</td><td>${planta._alturaTexto || obtenerAlturaPlanta(planta)}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h2>⚠️ Contraindicaciones</h2>
        <p>${planta.contraindicaciones}</p>
      </div>
      
      <p style="margin-top: 40px; font-size: 0.8rem; color: #999; text-align: center;">
        Ficha generada por Plantas Medicinales del Sureste · 2024
      </p>
      
      <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
    </body>
    </html>
  `);
  ventana.document.close();
  
  mostrarToast('Ficha generada. Usa "Guardar como PDF" en tu navegador.', 'success');
}

// ============================================
// 8. IDENTIFICADOR DE PLANTAS (DEMO)
// ============================================
function procesarImagen(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const resultado = document.getElementById('identificadorResultado');
  const preview = document.getElementById('previewImagen');
  const simulado = document.getElementById('identificadorSimulado');
  
  resultado.style.display = 'block';
  preview.style.display = 'block';
  simulado.innerHTML = '<p style="margin: 0; font-size: 0.9rem;">🔬 Analizando imagen...</p>';
  
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    
    // Simular análisis
    setTimeout(() => {
      simulado.innerHTML = `
        <p style="margin: 0 0 8px; font-size: 0.9rem;"><strong>✅ Análisis completado</strong></p>
        <p style="margin: 0; font-size: 0.85rem;">
          Interfaz preparada para integración con modelo de IA.<br>
          <em>Esta es una demostración de la interfaz de usuario.</em>
        </p>
        <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; font-size: 0.8rem;">
          📝 Resultados simulados:<br>
          • Confianza: --%<br>
          • Especie sugerida: --<br>
          • Recomendación: Conecta un servicio de IA para resultados reales
        </div>
      `;
    }, 2000);
  };
  reader.readAsDataURL(file);
}

// ============================================
// GRÁFICA DE USOS
// ============================================
function inicializarGrafica() {
  const ctx = document.getElementById('graficaUsos');
  if (!ctx || typeof Chart === 'undefined') return;
  
  // Contar usos
  const conteo = {};
  todasLasPlantasHerr.forEach(p => {
    p.usos_medicinales.forEach(u => {
      const cat = categorizarUso(u);
      conteo[cat] = (conteo[cat] || 0) + 1;
    });
  });
  
  const labels = Object.keys(conteo);
  const data = Object.values(conteo);
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#2E7D32', '#C62828', '#1565C0', '#E65100', '#6A1B9A', '#00695C', '#8BC34A', '#FF9800'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 10 } }
      }
    }
  });
}

function categorizarUso(uso) {
  const u = normalizarTexto(uso);
  if (u.includes('inflam')) return 'Antiinflamatorio';
  if (u.includes('cicatriz') || u.includes('herida') || u.includes('quemadura')) return 'Cicatrizante';
  if (u.includes('digest') || u.includes('estómago') || u.includes('cólico')) return 'Digestivo';
  if (u.includes('diabet') || u.includes('glucosa')) return 'Diabetes';
  if (u.includes('sedante') || u.includes('insomnio') || u.includes('ansio')) return 'Sedante';
  if (u.includes('dermat') || u.includes('piel') || u.includes('acne')) return 'Dermatológico';
  if (u.includes('reumat') || u.includes('dolor')) return 'Analgésico';
  return 'Otros';
}
