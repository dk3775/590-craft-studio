/* ==========================================================================
   590 Craft Studio — procedural Three.js building (desktop only)
   --------------------------------------------------------------------------
   Loaded with a dynamic import() ONLY when data-mode="3d" (see js/mode.js),
   so phones never download Three.js.
   - Building is made from simple boxes/planes (no model files).
   - Repeated parts (frames, glass, lit windows, ACP panels) use InstancedMesh.
   - Static scene: shadows are rendered once, then frozen.
   - Render loop runs only while the journey is on screen and the tab is visible.
   CUSTOMIZE: SIGN_TEXT / SOCIETY_TEXT below (text drawn on the 3D building).
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const SIGN_TEXT = '590 CRAFT STUDIO';      // shop signboard on the east facade
const SOCIETY_TEXT = 'LETTER SIGNS';      // letter-sign board over the gate (illustrative)

/* ---------- building dimensions (world units ≈ metres) ---------- */
const HX = 5.8, HZ = 4.3;     // half width / half depth of the core
const GF = 4.2;               // ground floor height (lobby + shop)
const FH = 3.2;               // typical floor height
const NF = 7;                 // upper floors
const TOP = GF + NF * FH;     // 26.6

/* ---------- camera views per journey step (order matches the HTML steps) ----------
   t* = point the camera orbits, theta = azimuth (0 = front, +PI/2 = east side),
   radius = horizontal distance, lift = camera height above the target. */
export const VIEWS = {
  intro:     { tx: 0,    ty: 13,   tz: 0,    theta: -0.6,  radius: 74, lift: 7 },
  windows:   { tx: -3,   ty: 15,   tz: 4.3,  theta: -0.32, radius: 22, lift: 1.5 },
  doors:     { tx: -2,   ty: 2.2,  tz: 4.5,  theta: -0.12, radius: 13, lift: 0.9 },
  partition: { tx: 2.6,  ty: 2.2,  tz: 3,    theta: 0.28,  radius: 13, lift: 1.2 },
  elevation: { tx: 5.8,  ty: 15.5, tz: -0.5, theta: 1.18,  radius: 34, lift: 2.5 },
  signboard: { tx: 6.1,  ty: 3.2,  tz: -1.6, theta: 1.75,   radius: 15, lift: 0.8 },
  nameplate: { tx: 11.2, ty: 2.6,  tz: 3.2,  theta: 1.2,   radius: 12, lift: 0.6 },
  railings:  { tx: -7,   ty: 11,   tz: 0,    theta: -1.25 + Math.PI * 2, radius: 26, lift: 3 },
};

/* hotspot anchor points (world) + outward normal used to hide back-facing labels */
const HOTSPOTS = {
  windows:   { p: [-3.8, 15.35, 4.5],  n: [0, 0, 1] },
  doors:     { p: [-2.2, 1.9, 4.5],    n: [0, 0, 1] },
  partition: { p: [2.6, 2.0, 2.4],     n: [0, 0, 1] },
  elevation: { p: [6.4, 16, -1.05],    n: [1, 0, 0] },
  signboard: { p: [6.25, 3.6, -1.65],  n: [1, 0, 0] },
  nameplate: { p: [11.3, 3.78, 4.9],    n: [1, 0, 0] },
  railings:  { p: [-7.35, 11.6, 0],    n: [-1, 0, 0] },
};

/* deterministic pseudo-random so the lit-window pattern is stable */
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export async function createBuildingScene(container, { hotspotEls = {} } = {}) {
  /* ---------- renderer ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;      // static scene → render shadows once
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1d1a19, 70, 190);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 600);

  const disposables = [];
  const track = (o) => (disposables.push(o), o);

  /* ---------- environment (built in code, no HDR download) ---------- */
  scene.environment = makeEnvironment(renderer, track);

  /* ---------- materials ---------- */
  const M = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xd8d2c8, roughness: 0.88 }),
    stone:    new THREE.MeshStandardMaterial({ color: 0x45433f, roughness: 0.8 }),
    paving:   new THREE.MeshStandardMaterial({ color: 0x2b2a29, roughness: 0.9 }),
    ground:   new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 1 }),
    slab:     new THREE.MeshStandardMaterial({ color: 0xcfc9bf, roughness: 0.8 }),
    alu:      new THREE.MeshStandardMaterial({ color: 0xd3d8de, metalness: 0.8, roughness: 0.34, envMapIntensity: 0.9 }),
    aluDark:  new THREE.MeshStandardMaterial({ color: 0x34373c, metalness: 0.85, roughness: 0.4 }),
    acpGold:  new THREE.MeshStandardMaterial({ color: 0xb09a74, metalness: 0.6, roughness: 0.38, envMapIntensity: 0.8 }),
    acpDark:  new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.6, roughness: 0.45 }),
    glass:    new THREE.MeshStandardMaterial({ color: 0x9cb9c9, metalness: 0.2, roughness: 0.04, transparent: true, opacity: 0.32, envMapIntensity: 1.6, depthWrite: false }),
    railGlass:new THREE.MeshStandardMaterial({ color: 0xbfe0ee, metalness: 0.1, roughness: 0.03, transparent: true, opacity: 0.26, envMapIntensity: 2, depthWrite: false, side: THREE.DoubleSide }),
    partGlass:new THREE.MeshStandardMaterial({ color: 0xd5ecf2, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.22, envMapIntensity: 1.5, depthWrite: false, side: THREE.DoubleSide }),
    glow:     new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    foliage:  new THREE.MeshStandardMaterial({ color: 0x24332a, roughness: 0.9, flatShading: true }),
    trunk:    new THREE.MeshStandardMaterial({ color: 0x3a2f26, roughness: 1 }),
  };
  Object.values(M).forEach(track);

  /* ---------- instancing helper ---------- */
  const batches = new Map();   // key -> [{ m: Matrix4, c: Color|null }]
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const frame = (x, z, rotY) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(UP, rotY), new THREE.Vector3(1, 1, 1));
  const WORLD = new THREE.Matrix4();
  function put(key, base, x, y, z, sx, sy, sz, color = null, rotY = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromAxisAngle(UP, rotY), _s.set(sx, sy, sz)).premultiply(base);
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push({ m: _m.clone(), c: color });
  }

  // facade frames: local x along the wall, y up, z outward (z=0 at the wall surface)
  const F = frame(0, HZ, 0);                 // front  (+z)
  const E = frame(HX, 0, Math.PI / 2);       // east   (+x)
  const B = frame(0, -HZ, Math.PI);          // back   (-z)
  const Wf = frame(-HX, 0, -Math.PI / 2);    // west   (-x)

  const WARM = ['#ffc07a', '#ffd49c', '#f6a95e', '#ffe2b5', '#ffb76a'].map((c) => new THREE.Color(c).multiplyScalar(1.15));
  const DARK = new THREE.Color('#1c2027');
  const litColor = (p = 0.55) => (rand() < p ? WARM[Math.floor(rand() * WARM.length)] : DARK);

  function windowUnit(base, cx, cy, w, h, type = 'domal', glow = litColor()) {
    const t = 0.09, d = 0.14;
    put('glow', base, cx, cy, 0.02, w - 0.1, h - 0.1, 0.01, glow);
    put('glass', base, cx, cy, 0.08, w - 0.1, h - 0.1, 0.02);
    put('alu', base, cx, cy + h / 2 - t / 2, 0.09, w, t, d);
    put('alu', base, cx, cy - h / 2 + t / 2, 0.09, w, t, d);
    put('alu', base, cx - w / 2 + t / 2, cy, 0.09, t, h, d);
    put('alu', base, cx + w / 2 - t / 2, cy, 0.09, t, h, d);
    if (type === 'domal') {             // 3 shutters, slim mullions
      put('alu', base, cx - w / 6, cy, 0.1, 0.06, h - 0.1, 0.1);
      put('alu', base, cx + w / 6, cy, 0.1, 0.06, h - 0.1, 0.1);
    } else {                            // sliding: overlapping interlock
      put('alu', base, cx, cy, 0.12, 0.12, h - 0.1, 0.14);
      put('alu', base, cx + w / 4, cy + h / 2 - 0.15, 0.13, w / 2 - 0.1, 0.05, 0.05);
    }
    put('slab', base, cx, cy - h / 2 - 0.07, 0.16, w + 0.3, 0.12, 0.32);   // sill
  }

  const group = new THREE.Group();
  scene.add(group);
  const solid = (geo, mat, x, y, z, { cast = true, receive = true } = {}) => {
    const mesh = new THREE.Mesh(track(geo), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast; mesh.receiveShadow = receive;
    group.add(mesh);
    return mesh;
  };
  const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  /* ---------- ground & site ---------- */
  const ground = solid(new THREE.PlaneGeometry(400, 400), M.ground, 0, 0, 0, { cast: false });
  ground.rotation.x = -Math.PI / 2;
  const plaza = solid(new THREE.PlaneGeometry(23, 18), M.paving, -0.5, 0.01, 0.5, { cast: false });
  plaza.rotation.x = -Math.PI / 2;
  const drive = solid(new THREE.PlaneGeometry(30, 4.8), M.paving, 25, 0.01, 3.2, { cast: false });
  drive.rotation.x = -Math.PI / 2;
  solid(boxGeo(13.4, 0.3, 10.2), M.stone, 0, 0.15, 0);          // plinth

  // boundary wall + gate pillars
  const wall = (x, z, w, d) => solid(boxGeo(w, 1.1, d), M.stone, x, 0.55, z);
  wall(-0.75, 9.5, 22.5, 0.3);           // front
  wall(-12, 0.75, 0.3, 17.5);            // west
  wall(-0.75, -8, 22.5, 0.3);            // back
  wall(10.5, 7.8, 0.3, 3.4);             // east (north of gate)
  wall(10.5, -3.6, 0.3, 8.8);            // east (south of gate)
  for (const z of [5.75, 0.65]) {
    solid(boxGeo(0.9, 3.6, 0.9), M.stone, 10.5, 1.8, z);
    solid(boxGeo(1.1, 0.16, 1.1), M.acpDark, 10.5, 3.68, z);
  }
  // letter-sign board spanning the gate (letter signs hotspot)
  solid(boxGeo(0.3, 0.95, 5.9), M.acpDark, 11.1, 3.1, 3.2);
  const boardTex = track(makeSocietyTexture(SOCIETY_TEXT));
  const board = new THREE.Mesh(track(new THREE.PlaneGeometry(5.5, 0.82)), track(new THREE.MeshBasicMaterial({ map: boardTex, toneMapped: false })));
  board.position.set(11.26, 3.1, 3.2); board.rotation.y = Math.PI / 2;
  group.add(board);
  // small letter plate on the pillar
  const plateTex = track(makePlateTexture());
  const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(0.62, 0.4)), track(new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.7, roughness: 0.3 })));
  plate.position.set(10.96, 1.7, 5.75); plate.rotation.y = Math.PI / 2;
  group.add(plate);

  /* ---------- core volumes ---------- */
  solid(boxGeo(HX * 2, TOP - GF, HZ * 2), M.concrete, 0, (GF + TOP) / 2, 0);            // upper floors
  solid(boxGeo(5.2, GF - 0.3, HZ * 2), M.concrete, -3.2, 0.3 + (GF - 0.3) / 2, 0);        // west ground block
  solid(boxGeo(6.4, GF - 0.3, 5.3), M.aluDark, 2.6, 0.3 + (GF - 0.3) / 2, -1.65);         // shop / services block
  // floor bands (ACP-clad slab edges) + parapet crown
  for (let f = 0; f <= NF; f++) put('acpDark', WORLD, 0, GF + f * FH, 0, HX * 2 + 0.3, 0.32, HZ * 2 + 0.3);
  solid(boxGeo(HX * 2 + 0.4, 1.0, HZ * 2 + 0.4), M.acpDark, 0, TOP + 0.5, 0);
  put('acpGold', WORLD, 0, TOP + 1.03, 0, HX * 2 + 0.44, 0.08, HZ * 2 + 0.44);
  solid(boxGeo(4, 2.6, 3.4), M.concrete, -2, TOP + 1.3, -1.2);                            // lift room

  /* ---------- FRONT: windows (Domal on even floors, 2.5 sliding on odd) ---------- */
  for (let f = 0; f < NF; f++) {
    const cy = GF + f * FH + 1.6;
    for (const cx of [-3.8, 0, 3.8]) windowUnit(F, cx, cy, 3.0, 1.9, f % 2 ? 'sliding' : 'domal');
  }
  /* ---------- BACK: plain windows ---------- */
  for (let f = 0; f < NF; f++) {
    const cy = GF + f * FH + 1.6;
    for (const cx of [-3.8, 0, 3.8]) windowUnit(B, cx, cy, 2.6, 1.7, 'sliding', litColor(0.4));
  }

  /* ---------- EAST: ACP elevation with vertical fins + glazing strips ---------- */
  put('acpDark', E, 0, (GF + TOP) / 2, 0.02, HZ * 2, TOP - GF, 0.04);
  const cols = [-3.22, -1.07, 1.07, 3.22];
  for (let f = 0; f < NF; f++) {
    const y0 = GF + f * FH;
    cols.forEach((cx, i) => {
      if (i % 2 === 0) put('acpGold', E, cx, y0 + FH / 2, 0.07, 2.05, FH - 0.1, 0.06);
      else windowUnit(E, cx, y0 + FH / 2 + 0.05, 1.9, FH - 0.6, 'domal', litColor(0.6));
    });
  }
  for (const cx of [-4.3, -2.15, 0, 2.15, 4.3]) put('acpGold', E, cx, (GF + TOP + 0.6) / 2, 0.28, 0.16, TOP - GF + 0.6, 0.56);

  /* ---------- EAST ground: shop front + SS backlit SIGNBOARD ---------- */
  put('glow', E, 1.65, 1.65, 0.02, 4.9, 2.6, 0.01, new THREE.Color('#ffd9a8').multiplyScalar(1.1));
  put('glass', E, 1.65, 1.65, 0.07, 5.0, 2.7, 0.02);
  for (const dx of [-2.5, -0.85, 0.85, 2.5]) put('alu', E, 1.65 + dx, 1.65, 0.09, 0.08, 2.7, 0.12);
  put('alu', E, 1.65, 3.0, 0.09, 5.1, 0.08, 0.12);
  put('alu', E, 1.65, 0.33, 0.09, 5.1, 0.08, 0.12);
  put('acpDark', E, 1.65, 3.62, 0.16, 5.5, 1.0, 0.32);       // MS/aluminium framed fascia
  const signTex = track(makeSignTexture(SIGN_TEXT));
  const sign = new THREE.Mesh(track(new THREE.PlaneGeometry(5.1, 0.8)), track(new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false })));
  sign.position.set(HX + 0.34, 3.62, -1.65); sign.rotation.y = Math.PI / 2;
  group.add(sign);

  /* ---------- FRONT ground: entrance door, canopy, lobby with glass partitions ---------- */
  // door (x = -2.2), double leaf
  put('glow', F, -2.2, 1.65, 0.02, 2.2, 2.7, 0.01, new THREE.Color('#ffcf94'));
  for (const s of [-1, 1]) {
    const cx = -2.2 + s * 0.55;
    put('glass', F, cx, 1.65, 0.08, 1.05, 2.66, 0.02);
    put('alu', F, cx - 0.52, 1.65, 0.1, 0.07, 2.7, 0.12);
    put('alu', F, cx + 0.52, 1.65, 0.1, 0.07, 2.7, 0.12);
    put('alu', F, cx, 0.34, 0.1, 1.1, 0.1, 0.12);
    put('alu', F, cx, 2.97, 0.1, 1.1, 0.07, 0.12);
    put('alu', F, -2.2 + s * 0.16, 1.4, 0.2, 0.04, 1.0, 0.04);   // pull handles
  }
  put('acpDark', F, -2.2, 3.35, 1.1, 3.8, 0.2, 2.2);              // canopy
  for (const dx of [-1.2, 0, 1.2]) put('glow', F, -2.2 + dx, 3.24, 1.4, 0.18, 0.02, 0.18, new THREE.Color('#fff0d0').multiplyScalar(2));

  // lobby void x∈[-0.6, 5.8], z∈[1.0, 4.3]
  const lobbyFloor = solid(new THREE.PlaneGeometry(6.4, 3.3), M.slab, 2.6, 0.31, 2.65, { cast: false });
  lobbyFloor.rotation.x = -Math.PI / 2;
  put('acpGold', WORLD, 2.6, 2.2, 1.04, 6.3, 3.8, 0.06);                         // feature back wall
  for (const x of [0.6, 2.6, 4.6]) put('glow', WORLD, x, GF - 0.06, 2.65, 1.4, 0.03, 0.1, new THREE.Color('#fff1d6').multiplyScalar(1.6));
  // glass partitions (cabin) in 12mm toughened glass, aluminium channels
  const pg = (x, z, w, rotY) => {
    put('partGlass', WORLD, x, 1.75, z, w, 2.9, 0.03, null, rotY);
    put('alu', WORLD, x, 0.34, z, w, 0.06, 0.08, null, rotY);
    put('alu', WORLD, x, 3.2, z, w, 0.06, 0.08, null, rotY);
  };
  pg(1.4, 2.1, 2.1, Math.PI / 2);
  pg(3.8, 2.1, 2.1, Math.PI / 2);
  pg(2.15, 3.15, 1.5, 0);            // front panel (door gap to the right)
  put('alu', WORLD, 2.9, 1.75, 3.15, 0.05, 2.9, 0.08);
  put('aluDark', WORLD, 2.6, 1.0, 1.7, 1.6, 0.08, 0.7);                          // desk
  put('aluDark', WORLD, 2.6, 0.65, 1.7, 0.08, 0.7, 0.5);
  // lobby curtain wall: front + east return
  put('glass', F, 2.6, 2.2, 0.0, 6.4, 3.8, 0.03);
  for (let i = 0; i <= 4; i++) put('alu', F, -0.6 + i * 1.6, 2.2, 0.02, 0.08, 3.8, 0.14);
  put('alu', F, 2.6, 0.34, 0.02, 6.4, 0.08, 0.14);
  put('alu', F, 2.6, GF - 0.12, 0.02, 6.4, 0.08, 0.14);
  put('glass', E, -2.65, 2.2, 0.0, 3.3, 3.8, 0.03);
  put('alu', E, -1.0, 2.2, 0.02, 0.08, 3.8, 0.14);
  put('alu', E, -2.65, 2.2, 0.02, 0.08, 3.8, 0.14);

  /* ---------- WEST: balconies with glass railings + sliding doors ---------- */
  for (let f = 0; f < NF; f++) {
    const y0 = GF + f * FH;
    put('slab', Wf, 0, y0 + 0.12, 0.8, 7.4, 0.24, 1.6);
    windowUnit(Wf, 0, y0 + 1.5, 3.8, 2.5, 'sliding', litColor(0.6));
    for (let i = 0; i < 4; i++) put('railGlass', Wf, -2.7 + i * 1.8, y0 + 0.82, 1.55, 1.74, 1.05, 0.03);
    for (const sx of [-1, 1]) put('railGlass', Wf, sx * 3.62, y0 + 0.82, 0.8, 1.55, 1.05, 0.03, null, Math.PI / 2);
    put('alu', Wf, 0, y0 + 1.38, 1.55, 7.3, 0.06, 0.08);
    for (const sx of [-1, 1]) put('alu', Wf, sx * 3.64, y0 + 1.38, 0.8, 0.06, 0.06, 1.6);
  }
  for (const cx of [-2.4, 0, 2.4]) windowUnit(Wf, cx, 2.3, 0.7, 2.6, 'domal', litColor(0.5));

  /* ---------- trees & lamps ---------- */
  const treeGeo = track(new THREE.IcosahedronGeometry(1.6, 0));
  const trunkGeo = track(new THREE.CylinderGeometry(0.12, 0.16, 2.2, 6));
  for (const [x, z, s] of [[-9.5, 7.2, 1.1], [-10.2, -3.5, 1.3], [-8.5, -6.4, 0.9], [8.3, 8.2, 1], [17, -9.5, 1.4], [16.5, 13, 1.2], [-15, 10, 1.5], [5, -10.5, 1.3]]) {
    const t = new THREE.Mesh(trunkGeo, M.trunk); t.position.set(x, 1.1 * s, z); t.scale.setScalar(s); t.castShadow = true; group.add(t);
    const l = new THREE.Mesh(treeGeo, M.foliage); l.position.set(x, 2.9 * s, z); l.scale.set(s, s * 1.15, s); l.rotation.y = x; l.castShadow = true; group.add(l);
  }
  for (const [x, z] of [[-6.5, 8.6], [-1, 8.6], [5.5, 8.6], [13, 7.5], [13, -6.5]]) {
    put('aluDark', WORLD, x, 1.6, z, 0.08, 3.2, 0.08);
    put('glow', WORLD, x, 3.25, z, 0.22, 0.1, 0.22, new THREE.Color('#ffe2b0').multiplyScalar(2));
  }

  /* ---------- build instanced meshes ---------- */
  const CAST = new Set(['slab', 'acpDark', 'acpGold', 'aluDark']);
  for (const [key, list] of batches) {
    const geo = track(new THREE.BoxGeometry(1, 1, 1));
    const mesh = new THREE.InstancedMesh(geo, M[key], list.length);
    list.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      if (key === 'glow') mesh.setColorAt(i, it.c || WARM[0]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = CAST.has(key);
    mesh.receiveShadow = key !== 'glow' && !key.toLowerCase().includes('glass');
    if (key.toLowerCase().includes('glass')) mesh.renderOrder = 2;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xaab8d8, 0x2a2420, 0.75));
  const sun = new THREE.DirectionalLight(0xffcf9a, 2.6);
  sun.position.set(-34, 38, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 34, bottom: -10, near: 1, far: 140 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x8fa6d6, 0.7);
  fill.position.set(40, 20, -10);
  scene.add(fill);
  const lobbyLight = new THREE.PointLight(0xffc98c, 30, 12, 2);
  lobbyLight.position.set(2.6, 3.4, 2.8);
  scene.add(lobbyLight);
  const signLight = new THREE.PointLight(0xffb15e, 22, 9, 2);
  signLight.position.set(7.4, 3.2, -1.65);
  scene.add(signLight);
  const gateLight = new THREE.PointLight(0xffd29a, 10, 6, 2);
  gateLight.position.set(12.4, 3.6, 3.2);
  scene.add(gateLight);

  /* ---------- camera state (tweened by GSAP from main.js) ---------- */
  const cam = { ...VIEWS.intro };
  const intro = { k: 1 };   // intro dolly-in, tweened 1 → 0 on load
  let time = 0;

  /* ---------- hotspots ---------- */
  const hs = Object.entries(HOTSPOTS).map(([id, h]) => ({
    id,
    el: hotspotEls[id] || null,
    pos: new THREE.Vector3(...h.p),
    normal: new THREE.Vector3(...h.n),
    vis: null, active: false,
  }));
  let activeId = 'intro';
  const setActive = (id) => {
    activeId = id;
    for (const h of hs) {
      const a = h.id === id;
      if (a !== h.active && h.el) { h.el.classList.toggle('is-active', a); h.active = a; }
    }
  };

  /* ---------- sizing (cached; no layout reads in the render loop) ---------- */
  let W = 1, H = 1;
  const resize = () => {
    W = Math.max(1, container.clientWidth); H = Math.max(1, container.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderOnce();
  };
  const ro = new ResizeObserver(resize);

  const look = new THREE.Vector3(), tmp = new THREE.Vector3(), ndc = new THREE.Vector3();
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  function updateCamera() {
    const k = intro.k;
    const theta = cam.theta - 0.45 * k + Math.sin(time * 0.22) * 0.012;
    const radius = cam.radius * (1 + 0.45 * k);
    const lift = cam.lift + 4 * k + Math.sin(time * 0.3) * 0.12;
    const st = Math.sin(theta), ct = Math.cos(theta);
    // shift the look-at point left so the subject sits right of centre (text panel is on the left)
    const shift = 0.34 * radius * halfTan * camera.aspect;
    look.set(cam.tx - ct * shift, cam.ty, cam.tz + st * shift);
    camera.position.set(look.x + st * radius, look.y + lift, look.z + ct * radius);
    camera.lookAt(look);
  }

  function updateHotspots() {
    for (const h of hs) {
      if (!h.el) continue;
      ndc.copy(h.pos).project(camera);
      const facing = h.normal.dot(tmp.copy(camera.position).sub(h.pos)) > 0;
      const onScreen = ndc.z < 1 && ndc.x > -0.98 && ndc.x < 0.98 && ndc.y > -0.95 && ndc.y < 0.9;
      const vis = facing && onScreen && activeId !== 'intro';
      if (vis !== h.vis) { h.el.classList.toggle('is-visible', vis); h.el.tabIndex = vis ? 0 : -1; h.vis = vis; }
      if (vis) {
        const x = (ndc.x * 0.5 + 0.5) * W, y = (-ndc.y * 0.5 + 0.5) * H;
        h.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    }
  }

  function renderOnce() {
    updateCamera();
    renderer.render(scene, camera);
    updateHotspots();
  }

  /* ---------- loop: only while visible ---------- */
  let raf = 0, running = false, last = performance.now();
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    time += Math.min(0.05, (now - last) / 1000); last = now;
    renderOnce();
  };
  const start = () => { if (running || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  // first frame: render shadows once, then freeze the shadow map
  ro.observe(container);
  W = Math.max(1, container.clientWidth); H = Math.max(1, container.clientHeight);
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderer.shadowMap.needsUpdate = true;
  renderOnce();
  renderer.compile(scene, camera);

  function dispose() {
    stop();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    scene.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
    disposables.forEach((d) => d && d.dispose && d.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return { cam, intro, setActive, start, stop, dispose, renderOnce, hotspotIds: Object.keys(HOTSPOTS) };
}

/* ======================================================================== */
/* helpers                                                                   */
/* ======================================================================== */

function makeEnvironment(renderer, track) {
  const env = new THREE.Scene();
  const geo = new THREE.SphereGeometry(50, 32, 16);
  const pos = geo.attributes.position;
  const cols = [];
  const top = new THREE.Color('#7a8aa8'), hor = new THREE.Color('#b08a6a'), bot = new THREE.Color('#141414'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 50;
    if (y > 0) c.copy(hor).lerp(top, Math.pow(y, 0.6)); else c.copy(hor).lerp(bot, Math.min(1, -y * 4));
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  env.add(sky);
  const box = (w, h, color, x, y, z, ry = 0, rx = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m);
  };
  box(40, 14, new THREE.Color(3, 2.6, 2.2), 0, 40, 0, 0, Math.PI / 2);     // overhead softbox
  box(30, 6, new THREE.Color(4, 2.2, 1.0), -40, 6, 20, Math.PI / 2);        // warm sunset strip
  box(20, 8, new THREE.Color(1.2, 1.5, 2.2), 40, 12, -10, -Math.PI / 2);    // cool fill
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.03);
  pmrem.dispose();
  env.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  track(rt);
  return rt.texture;
}

function canvasTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function drawSpaced(ctx, text, cx, cy, spacing) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, i) => { ctx.fillText(ch, x, cy); x += widths[i] + spacing; });
}

/* SS backlit letters: brushed-steel faces with a warm LED halo behind */
function makeSignTexture(text) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 320;
  const ctx = c.getContext('2d');
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let size = 170;
  ctx.font = `700 ${size}px Manrope, "Segoe UI", sans-serif`;
  const spacing = size * 0.12;
  const fit = () => [...text].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacing * (text.length - 1);
  while (fit() > c.width * 0.9 && size > 40) { size -= 6; ctx.font = `700 ${size}px Manrope, "Segoe UI", sans-serif`; }
  ctx.shadowColor = 'rgba(255,170,70,1)'; ctx.shadowBlur = 60; ctx.fillStyle = '#ffb35a';
  drawSpaced(ctx, text, c.width / 2, c.height / 2, spacing); drawSpaced(ctx, text, c.width / 2, c.height / 2, spacing);
  ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, c.height * 0.25, 0, c.height * 0.75);
  g.addColorStop(0, '#f4f5f6'); g.addColorStop(0.5, '#8f969c'); g.addColorStop(1, '#dfe2e5');
  ctx.fillStyle = g;
  drawSpaced(ctx, text, c.width / 2, c.height / 2, spacing);
  return canvasTex(c);
}

function makeSocietyTexture(text) {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 300;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#141519'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#c9a15f'; ctx.lineWidth = 6; ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'italic 400 140px Fraunces, Georgia, serif';
  ctx.shadowColor = 'rgba(255,190,110,.9)'; ctx.shadowBlur = 30; ctx.fillStyle = '#ffe1ad';
  ctx.fillText(text, c.width / 2, c.height / 2 + 6);
  return canvasTex(c);
}

function makePlateTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 330;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, '#eef0f2'); g.addColorStop(0.5, '#a1a8ae'); g.addColorStop(1, '#e1e4e7');
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
  for (let y = 0; y < c.height; y += 3) ctx.fillRect(0, y, c.width, 1);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1f2125';
  ctx.font = 'italic 400 70px Fraunces, Georgia, serif'; ctx.fillText('A-Wing', c.width / 2, 140);
  ctx.font = '600 34px "IBM Plex Mono", monospace'; ctx.fillText('FLATS 101–704', c.width / 2, 230);
  return canvasTex(c);
}
