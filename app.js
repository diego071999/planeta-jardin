/* ============================================================
   PLANETA JARDÍN — Primera Persona
   Three.js r160 · ES Modules
   ============================================================ */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */
const CFG = {
  planetRadius:     6.5,
  eyeHeight:        1.55,
  walkSpeed:        3.2,
  runSpeed:         5.5,
  lookSensDesktop:  0.0022,
  lookSensMobile:   0.0055,
  sunflowersCount:  420,
  rosesCount:       780,
  grassCount:       380,
  starsCount:       3500,
  signTheta:        0,          // longitud (radianes) sobre el ecuador
  signBoardHeight:  1.65,       // altura del centro del cartel sobre el suelo
  startTheta:       0.42,       // posición inicial del jugador
};

/* ============================================================
   ESCENA / CÁMARA / RENDERER
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a18);
scene.fog = new THREE.FogExp2(0x0a0a18, 0.008);

const camera = new THREE.PerspectiveCamera(
  72, window.innerWidth / window.innerHeight, 0.05, 3000
);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

/* ============================================================
   LUCES
   ============================================================ */
const sunLight = new THREE.DirectionalLight(0xfff3d6, 2.6);
sunLight.position.set(30, 40, 20);
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0xaaccff, 0x2a3a10, 0.85);
scene.add(hemiLight);

const ambient = new THREE.AmbientLight(0x506070, 0.45);
scene.add(ambient);

const warmFill = new THREE.DirectionalLight(0xffaa66, 0.5);
warmFill.position.set(-20, 5, -15);
scene.add(warmFill);

/* ============================================================
   TEXTURA DE CÉSPED PROCEDURAL
   ============================================================ */
function makeGrassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');

  // Base verde
  ctx.fillStyle = '#4d7a2d';
  ctx.fillRect(0, 0, 1024, 1024);

  // Manchas grandes de tono variable
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 15 + Math.random() * 80;
    const g = 60 + Math.random() * 80;
    ctx.fillStyle = `rgba(${(g * 0.5) | 0}, ${g | 0}, ${(g * 0.3) | 0}, 0.16)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Manchas oscuras
  for (let i = 0; i < 250; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 8 + Math.random() * 45;
    ctx.fillStyle = `rgba(20, 45, 10, 0.15)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Césped fino (puntitos)
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const g = 80 + Math.random() * 100;
    ctx.fillStyle = `rgba(${(g * 0.45) | 0}, ${g | 0}, ${(g * 0.25) | 0}, 0.55)`;
    ctx.fillRect(x, y, 2, 2);
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ============================================================
   PLANETA
   ============================================================ */
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(CFG.planetRadius, 96, 96),
  new THREE.MeshStandardMaterial({
    map: makeGrassTexture(),
    roughness: 0.95,
    metalness: 0.0,
  })
);
scene.add(planet);

/* ============================================================
   UTILIDADES DE GEOMETRÍA
   ============================================================ */
function setVertexColor(geo, hex) {
  const color = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3]     = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/* ============================================================
   GIRASOL (altura ~1.0 u = cintura del personaje)
   ============================================================ */
function buildSunflower(s = 1) {
  const parts = [];
  const stemH = 0.95 * s;

  // Tallo
  const stem = new THREE.CylinderGeometry(0.012 * s, 0.024 * s, stemH, 5, 1);
  stem.translate(0, stemH / 2, 0);
  parts.push(setVertexColor(stem, 0x2a5a18));

  // Dos hojas
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.PlaneGeometry(0.16 * s, 0.1 * s);
    leaf.rotateX(-Math.PI / 2 - 0.35);
    leaf.translate(0.09 * s, stemH * (0.4 + i * 0.28), 0);
    leaf.rotateY(i * Math.PI + Math.random() * 0.4);
    parts.push(setVertexColor(leaf, 0x3a7a28));
  }

  // Respaldo verde (detrás de pétalos)
  const back = new THREE.CircleGeometry(0.16 * s, 14);
  back.rotateX(-Math.PI / 2);
  back.translate(0, stemH + 0.008, 0);
  parts.push(setVertexColor(back, 0x2a4a18));

  // Pétalos amarillos (12)
  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const petal = new THREE.PlaneGeometry(0.075 * s, 0.22 * s);
    petal.rotateX(-Math.PI / 2);
    petal.translate(0, 0, 0.13 * s);
    petal.rotateY((i / petalCount) * Math.PI * 2);
    petal.translate(0, stemH + 0.02, 0);
    parts.push(setVertexColor(petal, 0xffcc22));
  }

  // Centro oscuro
  const center = new THREE.CircleGeometry(0.095 * s, 14);
  center.rotateX(-Math.PI / 2);
  center.translate(0, stemH + 0.026, 0);
  parts.push(setVertexColor(center, 0x4a2810));

  return mergeGeometries(parts);
}

/* ============================================================
   ROSA (altura ~0.6 u = rodilla del personaje)
   ============================================================ */
function buildRose(s = 1) {
  const parts = [];
  const stemH = 0.55 * s;

  // Tallo
  const stem = new THREE.CylinderGeometry(0.01 * s, 0.018 * s, stemH, 5, 1);
  stem.translate(0, stemH / 2, 0);
  parts.push(setVertexColor(stem, 0x2a5a18));

  // Dos hojas
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.PlaneGeometry(0.1 * s, 0.06 * s);
    leaf.rotateX(-Math.PI / 2 - 0.3);
    leaf.translate(0.055 * s, stemH * (0.35 + i * 0.3), 0);
    leaf.rotateY(i * Math.PI + Math.random() * 0.5);
    parts.push(setVertexColor(leaf, 0x357022));
  }

  const headY = stemH;

  // Capa exterior (5 pétalos grandes, muy abiertos)
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.PlaneGeometry(0.1 * s, 0.16 * s);
    petal.rotateX(-Math.PI / 2 + 0.9);
    petal.translate(0, 0, 0.09 * s);
    petal.rotateY((i / 5) * Math.PI * 2);
    petal.translate(0, headY + 0.04 * s, 0);
    parts.push(setVertexColor(petal, 0xa8152e));
  }

  // Capa media (5 pétalos, más cerrados)
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.PlaneGeometry(0.085 * s, 0.13 * s);
    petal.rotateX(-Math.PI / 2 + 0.5);
    petal.translate(0, 0, 0.07 * s);
    petal.rotateY((i / 5) * Math.PI * 2 + 0.4);
    petal.translate(0, headY + 0.09 * s, 0);
    parts.push(setVertexColor(petal, 0xc0183a));
  }

  // Capa interior (4 pétalos, formando el capullo)
  for (let i = 0; i < 4; i++) {
    const petal = new THREE.PlaneGeometry(0.07 * s, 0.1 * s);
    petal.rotateX(-Math.PI / 2 + 0.2);
    petal.translate(0, 0, 0.05 * s);
    petal.rotateY((i / 4) * Math.PI * 2 + 0.9);
    petal.translate(0, headY + 0.145 * s, 0);
    parts.push(setVertexColor(petal, 0xd61e44));
  }

  // Yema central
  const bud = new THREE.SphereGeometry(0.035 * s, 8, 8);
  bud.translate(0, headY + 0.15 * s, 0);
  parts.push(setVertexColor(bud, 0x8a0a20));

  return mergeGeometries(parts);
}

/* ============================================================
   MATITA DE PASTO
   ============================================================ */
function buildGrassTuft(s = 1) {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.PlaneGeometry(0.03 * s, 0.24 * s);
    blade.translate(0, 0.12 * s, 0);
    blade.rotateZ((Math.random() - 0.5) * 0.7);
    blade.rotateY(Math.random() * Math.PI * 2);
    blade.translate(
      (Math.random() - 0.5) * 0.06 * s,
      0,
      (Math.random() - 0.5) * 0.06 * s
    );
    parts.push(setVertexColor(blade, 0x4a8a2a));
  }
  return mergeGeometries(parts);
}

/* ============================================================
   DISTRIBUCIÓN DE INSTANCIAS
   ============================================================ */
const _up0 = new THREE.Vector3(0, 1, 0);
const _dummy = new THREE.Object3D();
const _goldenAngle = Math.PI * (3 - Math.sqrt(5));

function distributeInstances(geometry, count, baseScale, avoidPoints = [], avoidRadius = 1.8) {
  // 1. Generar posiciones con Fibonacci + jitter y filtrar
  const positions = [];
  for (let i = 0; i < count; i++) {
    const idx = i + 0.5;
    const y = 1 - (idx / count) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * _goldenAngle;

    const up = new THREE.Vector3(
      Math.cos(theta) * r + (Math.random() - 0.5) * 0.06,
      y + (Math.random() - 0.5) * 0.06,
      Math.sin(theta) * r + (Math.random() - 0.5) * 0.06
    ).normalize();

    const pos = up.clone().multiplyScalar(CFG.planetRadius);

    let skip = false;
    for (const ap of avoidPoints) {
      if (pos.distanceTo(ap) < avoidRadius) { skip = true; break; }
    }
    if (!skip) positions.push({ up, pos });
  }

  // 2. Material único compartido por todas las instancias
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.78,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  // 3. InstancedMesh
  const mesh = new THREE.InstancedMesh(geometry, material, positions.length);

  positions.forEach((p, i) => {
    _dummy.position.copy(p.pos);
    const q = new THREE.Quaternion().setFromUnitVectors(_up0, p.up);
    _dummy.quaternion.copy(q);
    _dummy.rotateY(Math.random() * Math.PI * 2);
    _dummy.rotateX((Math.random() - 0.5) * 0.22);
    _dummy.rotateZ((Math.random() - 0.5) * 0.22);
    const sc = baseScale * (0.85 + Math.random() * 0.4);
    _dummy.scale.setScalar(sc);
    _dummy.updateMatrix();
    mesh.setMatrixAt(i, _dummy.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

/* ============================================================
   CARTEL DE MADERA — a la altura de los ojos
   ============================================================ */
const signPos = new THREE.Vector3(
  CFG.planetRadius * Math.cos(CFG.signTheta),
  0,
  CFG.planetRadius * Math.sin(CFG.signTheta)
);

function buildSign() {
  const group = new THREE.Group();

  const woodDark  = new THREE.MeshStandardMaterial({ color: 0x4a2410, roughness: 0.9 });
  const woodLight = new THREE.MeshStandardMaterial({ color: 0x7a4520, roughness: 0.85 });

  // Postes laterales
  for (const dx of [-0.8, 0.8]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.075, 2.15, 10),
      woodLight
    );
    post.position.set(dx, 1.075, 0);
    group.add(post);
  }

  // Tabla principal
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.15, 0.1),
    woodDark
  );
  board.position.set(0, CFG.signBoardHeight, 0);
  group.add(board);

  // === Canvas con el texto ===
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 560;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 560);
  g.addColorStop(0, '#f8ecd0');
  g.addColorStop(1, '#e6caa0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 560);

  ctx.strokeStyle = '#6b3a1f';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, 1024 - 36, 560 - 36);

  const lines = ['Te amo mucho,', 'esmeraldita,', 'eres mi mundo entero,', 'te amo.'];
  ctx.fillStyle = '#3a1a08';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lh = 115;
  const startY = 260 - ((lines.length - 1) * lh) / 2;
  lines.forEach((line, i) => {
    ctx.font = i === lines.length - 1
      ? 'italic bold 84px Georgia, serif'
      : 'italic bold 68px Georgia, serif';
    ctx.fillText(line, 512, startY + i * lh);
  });

  ctx.fillStyle = '#c13a56';
  ctx.font = '52px Georgia, serif';
  ctx.fillText('❤', 512, 505);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.98, 1.03),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
  );
  face.position.set(0, CFG.signBoardHeight, 0.055);
  group.add(face);

  return group;
}

function placeSign(sign) {
  const up = signPos.clone().normalize();
  // Dirección de "cara" del cartel: tangente en +theta (hacia donde viene el jugador)
  const face = new THREE.Vector3(
    -Math.sin(CFG.signTheta), 0, Math.cos(CFG.signTheta)
  ).normalize();
  const right = new THREE.Vector3().crossVectors(up, face).normalize();
  const face2 = new THREE.Vector3().crossVectors(right, up).normalize();

  const m = new THREE.Matrix4().makeBasis(right, up, face2);
  sign.quaternion.setFromRotationMatrix(m);
  sign.position.copy(signPos);
}

const sign = buildSign();
placeSign(sign);
scene.add(sign);

/* ============================================================
   POBLAR EL PLANETA (evitando zona del cartel)
   ============================================================ */
const avoidPoints = [signPos.clone()];

scene.add(distributeInstances(buildSunflower(1), CFG.sunflowersCount, 0.95, avoidPoints, 1.8));
scene.add(distributeInstances(buildRose(1),      CFG.rosesCount,      1.05, avoidPoints, 1.8));
scene.add(distributeInstances(buildGrassTuft(1), CFG.grassCount,      1.0,  avoidPoints, 1.8));

/* ============================================================
   CAMPO DE ESTRELLAS
   ============================================================ */
function buildStars() {
  const positions = new Float32Array(CFG.starsCount * 3);
  const colors    = new Float32Array(CFG.starsCount * 3);
  const sizes     = new Float32Array(CFG.starsCount);

  for (let i = 0; i < CFG.starsCount; i++) {
    const r = 60 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Temperatura de color
    const t = Math.random();
    let cr, cg, cb;
    if (t < 0.60)      { cr = 1.00; cg = 1.00; cb = 1.00; }
    else if (t < 0.78) { cr = 0.75; cg = 0.85; cb = 1.00; }
    else if (t < 0.92) { cr = 1.00; cg = 0.85; cb = 0.65; }
    else               { cr = 1.00; cg = 0.70; cb = 0.55; }

    const b = 0.5 + Math.random() * 0.5;
    colors[i * 3]     = cr * b;
    colors[i * 3 + 1] = cg * b;
    colors[i * 3 + 2] = cb * b;

    sizes[i] = 0.8 + Math.random() * 1.7;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */`
      attribute float size;
      varying vec3 vColor;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixelRatio * 1.5;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d);
        a = pow(a, 1.7);
        gl_FragColor = vec4(vColor, a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geo, mat);
}
scene.add(buildStars());

/* ============================================================
   ESTADO DEL JUGADOR
   ============================================================ */
const player = {
  position: new THREE.Vector3(),
  forward:  new THREE.Vector3(),
  pitch:    0,
  keys:     { w: false, a: false, s: false, d: false, shift: false },
  moveTouch: { active: false, id: null, x: 0, y: 0, startX: 0, startY: 0 },
  lookTouch: { active: false, id: null, lastX: 0, lastY: 0 },
};

// Posición inicial (sobre el ecuador, cerca del cartel)
const _R0 = CFG.planetRadius + CFG.eyeHeight;
player.position.set(
  _R0 * Math.cos(CFG.startTheta), 0, _R0 * Math.sin(CFG.startTheta)
);
player.forward.set(
  Math.sin(CFG.startTheta), 0, -Math.cos(CFG.startTheta)
).normalize();
player.pitch = -0.06;

/* ============================================================
   CONTROLES — TECLADO
   ============================================================ */
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup')    player.keys.w = true;
  if (k === 's' || k === 'arrowdown')  player.keys.s = true;
  if (k === 'a' || k === 'arrowleft')  player.keys.a = true;
  if (k === 'd' || k === 'arrowright') player.keys.d = true;
  if (k === 'shift')                   player.keys.shift = true;
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup')    player.keys.w = false;
  if (k === 's' || k === 'arrowdown')  player.keys.s = false;
  if (k === 'a' || k === 'arrowleft')  player.keys.a = false;
  if (k === 'd' || k === 'arrowright') player.keys.d = false;
  if (k === 'shift')                   player.keys.shift = false;
});

/* ============================================================
   CONTROLES — MOUSE (pointer lock)
   ============================================================ */
let pointerLocked = false;

renderer.domElement.addEventListener('click', () => {
  if (!pointerLocked && !isTouchDevice()) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
  if (!pointerLocked) return;
  rotateView(-e.movementX * CFG.lookSensDesktop, -e.movementY * CFG.lookSensDesktop);
});

/* ============================================================
   CONTROLES — TÁCTIL (doble zona: joystick + mirar)
   ============================================================ */
function isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

const joyBase = document.getElementById('joystick-base');
const joyKnob = document.getElementById('joystick-knob');

if (isTouchDevice()) {
  renderer.domElement.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      const x = t.clientX;
      const y = t.clientY;
      if (x < window.innerWidth / 2 && !player.moveTouch.active) {
        player.moveTouch.active = true;
        player.moveTouch.id = t.identifier;
        player.moveTouch.startX = x;
        player.moveTouch.startY = y;
        player.moveTouch.x = 0;
        player.moveTouch.y = 0;
        joyBase.classList.add('active');
      } else if (x >= window.innerWidth / 2 && !player.lookTouch.active) {
        player.lookTouch.active = true;
        player.lookTouch.id = t.identifier;
        player.lookTouch.lastX = x;
        player.lookTouch.lastY = y;
      }
    }
    e.preventDefault();
  }, { passive: false });

  renderer.domElement.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === player.moveTouch.id) {
        const dx = t.clientX - player.moveTouch.startX;
        const dy = t.clientY - player.moveTouch.startY;
        const maxR = 60;
        const len = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(len, maxR);
        const nx = len > 0 ? dx / len : 0;
        const ny = len > 0 ? dy / len : 0;
        player.moveTouch.x = nx * (clamped / maxR);
        player.moveTouch.y = ny * (clamped / maxR);
        // Visual
        joyKnob.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;
      } else if (t.identifier === player.lookTouch.id) {
        const dx = t.clientX - player.lookTouch.lastX;
        const dy = t.clientY - player.lookTouch.lastY;
        player.lookTouch.lastX = t.clientX;
        player.lookTouch.lastY = t.clientY;
        rotateView(-dx * CFG.lookSensMobile, -dy * CFG.lookSensMobile);
      }
    }
    e.preventDefault();
  }, { passive: false });

  const endTouch = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === player.moveTouch.id) {
        player.moveTouch.active = false;
        player.moveTouch.id = null;
        player.moveTouch.x = 0;
        player.moveTouch.y = 0;
        joyBase.classList.remove('active');
        joyKnob.style.transform = '';
      }
      if (t.identifier === player.lookTouch.id) {
        player.lookTouch.active = false;
        player.lookTouch.id = null;
      }
    }
    e.preventDefault();
  };
  renderer.domElement.addEventListener('touchend', endTouch, { passive: false });
  renderer.domElement.addEventListener('touchcancel', endTouch, { passive: false });
}

/* ============================================================
   ROTAR LA VISTA
   ============================================================ */
function rotateView(dYaw, dPitch) {
  const up = player.position.clone().normalize();
  const q  = new THREE.Quaternion().setFromAxisAngle(up, dYaw);
  player.forward.applyQuaternion(q).normalize();
  player.pitch += dPitch;
  player.pitch = Math.max(
    -Math.PI / 2 + 0.05,
    Math.min(Math.PI / 2 - 0.05, player.pitch)
  );
}

/* ============================================================
   ACTUALIZAR JUGADOR (movimiento sobre la esfera)
   ============================================================ */
function updatePlayer(dt) {
  // 1. "Arriba" local = radial
  const up = player.position.clone().normalize();

  // 2. Re-proyectar forward al plano tangente
  player.forward.sub(up.clone().multiplyScalar(player.forward.dot(up)));
  if (player.forward.lengthSq() < 1e-6) {
    player.forward.set(1, 0, 0).sub(up.clone().multiplyScalar(up.x)).normalize();
  }
  player.forward.normalize();

  // 3. Right = up × forward
  const right = new THREE.Vector3().crossVectors(up, player.forward).normalize();

  // 4. Input
  let moveX = 0, moveZ = 0;
  if (player.keys.w) moveZ += 1;
  if (player.keys.s) moveZ -= 1;
  if (player.keys.a) moveX -= 1;
  if (player.keys.d) moveX += 1;

  if (player.moveTouch.active) {
    moveX += player.moveTouch.x;
    moveZ -= player.moveTouch.y;
  }

  // 5. Dirección de movimiento
  const move = new THREE.Vector3();
  move.addScaledVector(player.forward, moveZ);
  move.addScaledVector(right, moveX);

  if (move.lengthSq() > 0) {
    move.normalize();
    const speed = player.keys.shift ? CFG.runSpeed : CFG.walkSpeed;
    player.position.addScaledVector(move, speed * dt);
  }

  // 6. Re-proyectar a la superficie + altura de ojos
  player.position.normalize().multiplyScalar(CFG.planetRadius + CFG.eyeHeight);
}

/* ============================================================
   ACTUALIZAR CÁMARA
   ============================================================ */
function updateCamera() {
  const up = player.position.clone().normalize();
  const forward = player.forward.clone();
  const lookDir = new THREE.Vector3()
    .addScaledVector(forward, Math.cos(player.pitch))
    .addScaledVector(up, Math.sin(player.pitch));

  camera.position.copy(player.position);
  camera.up.copy(up);
  camera.lookAt(player.position.clone().add(lookDir));
}

/* ============================================================
   LOOP
   ============================================================ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  updatePlayer(dt);
  updateCamera();

  renderer.render(scene, camera);
}

/* ============================================================
   RESIZE
   ============================================================ */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* ============================================================
   ARRANQUE
   ============================================================ */
setTimeout(() => {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
}, 500);

animate();