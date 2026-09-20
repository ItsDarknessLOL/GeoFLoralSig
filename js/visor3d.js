/**
 * visor3d.js - Visor 3D de plantas usando Three.js con carga de modelos GLB/GLTF
 */

let scene, camera, renderer;
let plantaMesh;
let autoRotate = false;
let planta3dActual = null;
let mixer = null; // Para animaciones del modelo GLB
let animaciones = []; // Animaciones disponibles

document.addEventListener('DOMContentLoaded', () => {
  cargarPlanta3D();
});

async function cargarPlanta3D() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (id) {
    try {
      const plantas = await cargarTodasLasPlantas();
      planta3dActual = plantas.find(p => p.id === id);

      if (planta3dActual) {
        document.getElementById('planta3dNombre').textContent = planta3dActual.nombre_comun;
        document.getElementById('planta3dCientifico').textContent = planta3dActual.nombre_cientifico;
      }
    } catch (e) {
      console.warn('Error cargando datos:', e);
    }
  }

  // Inicializar Three.js
  inicializarThreeJS();
}

function inicializarThreeJS() {
  const canvas = document.getElementById('canvas3d');

  // Escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

  // Cámara
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 1, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  const spotLight = new THREE.SpotLight(0x8BC34A, 0.8);
  spotLight.position.set(-5, 8, 0);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.3;
  scene.add(spotLight);

  // Suelo
  const sueloGeometry = new THREE.CircleGeometry(8, 64);
  const sueloMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, 
    roughness: 0.9,
    metalness: 0.1
  });
  const suelo = new THREE.Mesh(sueloGeometry, sueloMaterial);
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  scene.add(suelo);

  // Cargar modelo GLB en lugar de generarlo proceduralmente
  cargarModeloGLB();

  // Controles de órbita
  setupOrbitControls();

  // Resize
  window.addEventListener('resize', onWindowResize);

  // Animación
  animate();
}

function cargarModeloGLB() {
  const loadingEl = document.getElementById('loading3d');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
    loadingEl.innerHTML = '<p>Cargando modelo 3D...</p><div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>';
  }

  // URL del modelo: usa el campo modelo_3d de la planta, o una ruta por defecto
  const modeloUrl = planta3dActual?.modelo_3d || '../assets/modelos/chaya.glb';

  // Verificar si GLTFLoader está disponible
  if (typeof THREE.GLTFLoader === 'undefined') {
    console.error('GLTFLoader no está disponible. Asegúrate de cargar el script de GLTFLoader.');
    if (loadingEl) {
      loadingEl.innerHTML = '<p>Error: GLTFLoader no cargado. Verifica la consola.</p>';
    }
    // Fallback al modelo procedural como respaldo
    crearModeloPlantaProcedural();
    return;
  }

  const loader = new THREE.GLTFLoader();

  loader.load(
    modeloUrl,
    function(gltf) {
      // Éxito al cargar
      plantaMesh = gltf.scene;

      // Configurar sombras en todos los meshes del modelo
      plantaMesh.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Mejorar materiales si es necesario
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
        }
      });

      // Centrar y escalar el modelo
      const box = new THREE.Box3().setFromObject(plantaMesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Mover al centro
      plantaMesh.position.x = -center.x;
      plantaMesh.position.z = -center.z;

      // Escalar para que quepa en la vista (altura máxima ~3 unidades)
      const maxDim = Math.max(size.x, size.y, size.z);
      const escalaDeseada = 3 / maxDim;
      plantaMesh.scale.setScalar(escalaDeseada);

      // Ajustar altura para que esté sobre el suelo
      plantaMesh.position.y = -box.min.y * escalaDeseada;

      scene.add(plantaMesh);

      // Configurar animaciones si existen
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(plantaMesh);
        animaciones = gltf.animations;

        // Reproducir primera animación por defecto
        const action = mixer.clipAction(animaciones[0]);
        action.play();
      }

      // Ocultar loading
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }

      mostrarToast('Modelo 3D cargado correctamente', 'success');
    },
    function(xhr) {
      // Progreso de carga
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
          progressFill.style.width = percentComplete + '%';
        }
        console.log('Cargando modelo: ' + Math.round(percentComplete) + '%');
      }
    },
    function(error) {
      // Error al cargar
      console.error('Error cargando modelo GLB:', error);
      if (loadingEl) {
        loadingEl.innerHTML = '<p>Error al cargar el modelo 3D. Usando modelo de respaldo...</p>';
      }

      // Fallback al modelo procedural
      crearModeloPlantaProcedural();

      setTimeout(() => {
        if (loadingEl) loadingEl.style.display = 'none';
      }, 1500);
    }
  );
}

/**
 * Modelo procedural de respaldo en caso de fallo al cargar GLB
 */
function crearModeloPlantaProcedural() {
  // Eliminar modelo anterior si existe
  if (plantaMesh) {
    scene.remove(plantaMesh);
  }

  const grupo = new THREE.Group();

  // Color según estado
  const colorHoja = planta3dActual?._colorEstado ? 
    new THREE.Color(planta3dActual._colorEstado) : 
    new THREE.Color(0x2E7D32);

  const colorTallo = new THREE.Color(0x4a3728);

  // Tallo principal
  const talloGeometry = new THREE.CylinderGeometry(0.08, 0.12, 3, 8);
  const talloMaterial = new THREE.MeshStandardMaterial({ 
    color: colorTallo, 
    roughness: 0.8 
  });
  const tallo = new THREE.Mesh(talloGeometry, talloMaterial);
  tallo.position.y = 1.5;
  tallo.castShadow = true;
  grupo.add(tallo);

  // Hojas
  const numHojas = 12;
  for (let i = 0; i < numHojas; i++) {
    const angulo = (i / numHojas) * Math.PI * 2;
    const altura = 0.5 + (i / numHojas) * 2;
    const escala = 0.3 + Math.random() * 0.4;

    const hojaShape = new THREE.Shape();
    hojaShape.moveTo(0, 0);
    hojaShape.quadraticCurveTo(0.3, 0.5, 0, 1);
    hojaShape.quadraticCurveTo(-0.3, 0.5, 0, 0);

    const hojaGeometry = new THREE.ExtrudeGeometry(hojaShape, {
      depth: 0.02,
      bevelEnabled: false
    });

    const hojaMaterial = new THREE.MeshStandardMaterial({ 
      color: colorHoja.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.1),
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    const hoja = new THREE.Mesh(hojaGeometry, hojaMaterial);
    hoja.position.set(
      Math.cos(angulo) * 0.1,
      altura,
      Math.sin(angulo) * 0.1
    );
    hoja.rotation.set(
      -0.3 + Math.random() * 0.3,
      angulo,
      0.2 + Math.random() * 0.3
    );
    hoja.scale.set(escala, escala, escala);
    hoja.castShadow = true;
    grupo.add(hoja);
  }

  // Flor/fruto en la parte superior
  const florGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const florMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff6b6b, 
    roughness: 0.5 
  });
  const flor = new THREE.Mesh(florGeometry, florMaterial);
  flor.position.y = 3.1;
  flor.castShadow = true;
  grupo.add(flor);

  // Pétalos de la flor
  for (let i = 0; i < 5; i++) {
    const angulo = (i / 5) * Math.PI * 2;
    const petaloGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const petaloMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff8585, 
      roughness: 0.5 
    });
    const petalo = new THREE.Mesh(petaloGeometry, petaloMaterial);
    petalo.position.set(
      Math.cos(angulo) * 0.25,
      3.1,
      Math.sin(angulo) * 0.25
    );
    grupo.add(petalo);
  }

  // Maceta
  const macetaGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1, 16);
  const macetaMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8d6e63, 
    roughness: 0.9 
  });
  const maceta = new THREE.Mesh(macetaGeometry, macetaMaterial);
  maceta.position.y = 0.5;
  maceta.castShadow = true;
  grupo.add(maceta);

  // Tierra en la maceta
  const tierraGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.1, 16);
  const tierraMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
  const tierra = new THREE.Mesh(tierraGeometry, tierraMaterial);
  tierra.position.y = 0.95;
  grupo.add(tierra);

  plantaMesh = grupo;
  scene.add(grupo);

  mostrarToast('Modelo de respaldo generado', 'warning');
}

// Controles de órbita personalizados
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationSpeed = 0.005;
let cameraDistance = 8;
let cameraTheta = 0;
let cameraPhi = Math.PI / 3;

function setupOrbitControls() {
  const canvas = document.getElementById('canvas3d');

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    cameraTheta -= deltaX * rotationSpeed;
    cameraPhi += deltaY * rotationSpeed;
    cameraPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraPhi));

    updateCameraPosition();

    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(3, Math.min(15, cameraDistance));
    updateCameraPosition();
  });

  canvas.addEventListener('dblclick', resetVista);

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;

    cameraTheta -= deltaX * rotationSpeed;
    cameraPhi += deltaY * rotationSpeed;
    cameraPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraPhi));

    updateCameraPosition();

    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  canvas.addEventListener('touchend', () => {
    isDragging = false;
  });
}

function updateCameraPosition() {
  camera.position.x = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
  camera.position.y = cameraDistance * Math.cos(cameraPhi);
  camera.position.z = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
  camera.lookAt(0, 1.5, 0);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = 0.016; // Aproximadamente 60fps

  // Actualizar animaciones del mixer si existe
  if (mixer) {
    mixer.update(delta);
  }

  if (autoRotate && plantaMesh) {
    plantaMesh.rotation.y += 0.005;
  }

  // Animación suave de las hojas (solo para modelo procedural)
  if (plantaMesh && !mixer) {
    const time = Date.now() * 0.001;
    plantaMesh.children.forEach((child, i) => {
      if (child.geometry && child.geometry.type === 'ExtrudeGeometry') {
        child.rotation.z += Math.sin(time + i) * 0.0005;
      }
    });
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function rotarAuto() {
  autoRotate = !autoRotate;
  mostrarToast(autoRotate ? 'Rotación automática activada' : 'Rotación automática desactivada', 'info');
}

function resetVista() {
  cameraTheta = 0;
  cameraPhi = Math.PI / 3;
  cameraDistance = 8;
  autoRotate = false;
  updateCameraPosition();
  if (plantaMesh) plantaMesh.rotation.y = 0;
}

function cambiarVista() {
  const vistas = [
    { theta: 0, phi: Math.PI / 3 },
    { theta: Math.PI / 2, phi: Math.PI / 4 },
    { theta: Math.PI, phi: Math.PI / 3 },
    { theta: -Math.PI / 2, phi: Math.PI / 4 },
    { theta: 0, phi: 0.2 }
  ];

  const vistaActual = Math.floor(Math.random() * vistas.length);
  cameraTheta = vistas[vistaActual].theta;
  cameraPhi = vistas[vistaActual].phi;
  updateCameraPosition();
}

// Cargar Three.js y GLTFLoader
Promise.all([
  cargarScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'),
  cargarScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js')
])
  .then(() => {
    console.log('Three.js y GLTFLoader cargados correctamente');
  })
  .catch(err => {
    console.error('Error cargando librerías 3D:', err);
    const loadingEl = document.getElementById('loading3d');
    if (loadingEl) {
      loadingEl.innerHTML = '<p>Error cargando el visor 3D. Verifica tu conexión.</p>';
    }
  });

function cargarScript(src) {
  return new Promise((resolve, reject) => {
    // Verificar si ya está cargado
    if (src.includes('three.min.js') && typeof THREE !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Cambiar animación del modelo (si tiene animaciones)
 */
function cambiarAnimacion(index) {
  if (!mixer || animaciones.length === 0) {
    mostrarToast('Este modelo no tiene animaciones', 'warning');
    return;
  }

  const animIndex = index % animaciones.length;
  mixer.stopAllAction();
  const action = mixer.clipAction(animaciones[animIndex]);
  action.fadeIn(0.5);
  action.play();

  mostrarToast('Animación: ' + (animaciones[animIndex].name || 'Animación ' + (animIndex + 1)), 'info');
}
