import * as THREE from 'three';

export interface TrackPoint { x: number; y: number; a: number }
export interface TrackTheme {
  n: string;
  ground: string;
  sand: string;
  asph: string;
  curb: string[];
  prop: string;
  night?: number;
}
export interface RaceCar {
  x: number; y: number; a: number; col: string;
  rx?: number; ry?: number; ra?: number;
  sp?: number; brk?: boolean; dr?: boolean;
}
export interface RaceFrame {
  cars: RaceCar[];
  player: RaceCar;
  mode: number;
  weather: number;
  state: string;
  nitro: boolean;
  scale: number;
  dt: number;
}

const TAU = Math.PI * 2;
const temp = new THREE.Object3D();
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function makeCanvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeRoad(points: TrackPoint[], width: number, offset: number, height: number, material: THREE.Material, alternate = false): THREE.Mesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const red = new THREE.Color('#d83b32');
  const cream = new THREE.Color('#f5ebce');
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const start = positions.length / 3;
    for (const p of [a, b]) {
      const nx = -Math.sin(p.a), nz = Math.cos(p.a);
      for (const side of [1, -1]) {
        const d = offset + side * width / 2;
        positions.push(p.x + nx * d, height, p.y + nz * d);
        if (alternate) {
          const color = (Math.floor(i / 4) & 1) ? red : cream;
          colors.push(color.r, color.g, color.b);
        }
      }
    }
    indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (alternate) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function makeGroundTexture(color: string): THREE.CanvasTexture {
  const texture = makeCanvasTexture((ctx, size) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    let seed = 4085;
    const random = () => { seed = Math.imul(seed ^ seed >>> 15, 2246822519); return (seed >>> 0) / 4294967296; };
    for (let i = 0; i < 1500; i++) {
      const light = random() > .5;
      ctx.fillStyle = light ? 'rgba(255,255,255,.085)' : 'rgba(0,0,0,.075)';
      const x = random() * size, y = random() * size, r = 1 + random() * 4;
      ctx.beginPath(); ctx.ellipse(x, y, r * 2.4, r, random() * TAU, 0, TAU); ctx.fill();
    }
  }, 512);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  return texture;
}

function makeNumberTexture(number: string): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.font = 'italic 900 166px Arial Black, sans-serif';
    ctx.lineWidth = 24; ctx.strokeStyle = '#a92b22'; ctx.strokeText(number, size / 2, size / 2 + 10);
    ctx.lineWidth = 11; ctx.strokeStyle = '#fff3c3'; ctx.strokeText(number, size / 2, size / 2 + 10);
    ctx.fillStyle = '#ffd247'; ctx.fillText(number, size / 2, size / 2 + 10);
  });
}

function makeSideTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffcf34';
    ctx.beginPath();
    ctx.moveTo(15, 138); ctx.lineTo(135, 65); ctx.lineTo(109, 111);
    ctx.lineTo(239, 95); ctx.lineTo(92, 192); ctx.lineTo(119, 139);
    ctx.closePath(); ctx.fill();
    ctx.font = 'italic 900 86px Arial Black, sans-serif';
    ctx.lineWidth = 11; ctx.strokeStyle = '#a3181d'; ctx.strokeText('95', 107, 150);
    ctx.fillStyle = '#ffe36b'; ctx.fillText('95', 107, 150);
  });
}

function makeEyesTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#dff6ff';
    ctx.beginPath(); ctx.roundRect(10, 37, 236, 174, 39); ctx.fill();
    for (const x of [79, 176]) {
      ctx.fillStyle = '#3587a4'; ctx.beginPath(); ctx.ellipse(x, 127, 29, 42, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0c2430'; ctx.beginPath(); ctx.ellipse(x + 4, 130, 16, 28, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 4, 111, 8, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = '#801c20'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(17, 70); ctx.quadraticCurveTo(118, 0, 239, 67); ctx.stroke();
  });
}

function makeSmileTexture(): THREE.CanvasTexture {
  return makeCanvasTexture((ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#48201f';
    ctx.beginPath(); ctx.moveTo(22, 65); ctx.quadraticCurveTo(128, 190, 234, 65); ctx.quadraticCurveTo(128, 118, 22, 65); ctx.fill();
    ctx.fillStyle = '#fff8ec';
    ctx.beginPath(); ctx.moveTo(27, 68); ctx.quadraticCurveTo(128, 125, 229, 68); ctx.quadraticCurveTo(128, 92, 27, 68); ctx.fill();
  });
}

function makeCar(color: string, number: string, isPlayer: boolean): THREE.Group {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: isPlayer ? '#d92729' : color, metalness: .45, roughness: .25, clearcoat: 1, clearcoatRoughness: .15 });
  const dark = new THREE.MeshStandardMaterial({ color: '#15191d', roughness: .7 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#29495b', metalness: .2, roughness: .08, transparent: true, opacity: .94 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#b3b9bb', metalness: .8, roughness: .25 });
  const lamps = new THREE.MeshBasicMaterial({ color: '#fff1d0' });
  const tail = new THREE.MeshBasicMaterial({ color: '#f7221f' });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, bevel = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d, bevel ? 2 : 1, 1, 1), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; group.add(mesh); return mesh;
  };
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-34, -12); bodyShape.quadraticCurveTo(-38, -20, -24, -21);
  bodyShape.lineTo(17, -21); bodyShape.quadraticCurveTo(36, -19, 41, -9);
  bodyShape.quadraticCurveTo(47, 0, 41, 9); bodyShape.quadraticCurveTo(36, 19, 17, 21);
  bodyShape.lineTo(-24, 21); bodyShape.quadraticCurveTo(-38, 20, -34, 12); bodyShape.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 12, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2, curveSegments: 8 });
  bodyGeo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, paint); body.position.y = 10; body.castShadow = true; group.add(body);
  box(39, 12, 29, -7, 27, 0, paint);
  box(24, 4, 29, 22, 23, 0, paint);
  box(28, 2, 27, 23, 26, 0, glass);
  box(37, 2, 27, -7, 33, 0, glass);
  box(5, 4, 45, -34, 32, 0, paint);
  box(3, 2, 43, -34, 29, 0, dark);
  box(2, 3, 22, 43, 15, 0, chrome);
  for (const z of [-16, 16]) {
    box(2, 5, 9, 41, 17, z, lamps);
    box(2, 5, 7, -37, 16, z, tail);
  }
  const wheels: THREE.Mesh[] = [];
  for (const x of [-24, 25]) for (const z of [-21, 21]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(8.8, 8.8, 8, 14), dark);
    wheel.rotation.x = Math.PI / 2; wheel.position.set(x, 10, z);
    wheel.castShadow = true; group.add(wheel); wheels.push(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 8.4, 12), chrome);
    hub.rotation.x = Math.PI / 2; hub.position.copy(wheel.position); group.add(hub);
  }
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), new THREE.MeshBasicMaterial({ map: makeNumberTexture(number), transparent: true, depthWrite: false }));
  decal.rotation.x = -Math.PI / 2; decal.position.set(-9, 34.3, 0); group.add(decal);
  if (isPlayer) {
    const headlightColor = new THREE.Color('#fff0b1');
    for (const side of [-1, 1]) {
      const beam = new THREE.SpotLight(headlightColor, 9000, 520, .42, .7, 1.5);
      beam.position.set(42, 18, side * 16);
      beam.target.position.set(190, 2, side * 25);
      beam.castShadow = false;
      group.add(beam, beam.target);
      (group.userData.headlights ??= []).push(beam);
    }
    const brakeGlow = new THREE.PointLight('#ff2929', 1200, 105, 2);
    brakeGlow.position.set(-43, 15, 0);
    group.add(brakeGlow);
    group.userData.brakeGlow = brakeGlow;
    const sideTex = makeSideTexture();
    for (const side of [-1, 1]) {
      const bolt = new THREE.Mesh(new THREE.PlaneGeometry(37, 17), new THREE.MeshBasicMaterial({ map: sideTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      bolt.position.set(0, 20, side * 22.7); bolt.rotation.y = side > 0 ? 0 : Math.PI; group.add(bolt);
    }
    const eyes = new THREE.Mesh(new THREE.PlaneGeometry(29, 18), new THREE.MeshBasicMaterial({ map: makeEyesTexture(), transparent: true, depthWrite: false }));
    eyes.rotation.x = -Math.PI / 2; eyes.position.set(8, 28.4, 0); group.add(eyes);
    const smile = new THREE.Mesh(new THREE.PlaneGeometry(22, 8), new THREE.MeshBasicMaterial({ map: makeSmileTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    smile.rotation.y = Math.PI / 2; smile.position.set(44.2, 15, 0); group.add(smile);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(45, 28), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .24, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 2.9; shadow.scale.set(1.15, .55, 1); group.add(shadow);
  const flames = new THREE.Group();
  for (const z of [-8, 8]) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(5, 30, 8), new THREE.MeshBasicMaterial({ color: '#42bfff', transparent: true, opacity: .75 }));
    flame.rotation.z = -Math.PI / 2; flame.position.set(-49, 15, z); flames.add(flame);
  }
  flames.visible = false; group.add(flames);
  group.userData.wheels = wheels; group.userData.flames = flames;
  return group;
}

export class RacingRenderer {
  static create(before: HTMLCanvasElement): RacingRenderer | null {
    try { return new RacingRenderer(before); } catch (error) { console.warn('3D renderer unavailable; using classic view.', error); return null; }
  }

  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 5, 18000);
  private readonly world = new THREE.Group();
  private readonly carRoot = new THREE.Group();
  private readonly models: THREE.Group[] = [];
  private readonly focus = new THREE.Vector3();
  private readonly sun = new THREE.DirectionalLight('#fff3d9', 2.5);
  private readonly hemi = new THREE.HemisphereLight('#cde4ff', '#5a422a', 2.1);
  private roadMaterial: THREE.MeshStandardMaterial | null = null;
  private currentWeather = -1;
  private theme: TrackTheme | null = null;
  private elapsed = 0;
  private ready = true;
  private firstFrame = true;

  private constructor(before: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !matchMedia('(pointer: coarse)').matches, powerPreference: 'high-performance' });
    this.renderer.domElement.className = 'world-canvas';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.15 : 1.6));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.38;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !matchMedia('(pointer: coarse)').matches;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    before.parentNode!.insertBefore(this.renderer.domElement, before);
    this.renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ready = false; });
    this.scene.add(this.world, this.carRoot, this.sun, this.hemi);
    this.scene.background = new THREE.Color('#9abed0');
    this.scene.fog = new THREE.FogExp2('#9abed0', .00013);
    this.sun.position.set(700, 1000, 300);
    this.sun.castShadow = this.renderer.shadowMap.enabled;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -850;
    this.sun.shadow.camera.right = this.sun.shadow.camera.top = 850;
    this.sun.shadow.camera.near = 10; this.sun.shadow.camera.far = 2200;
    this.sun.shadow.bias = -.0002;
    this.scene.add(this.sun.target);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  get available(): boolean { return this.ready; }

  resize(): void {
    const width = Math.max(1, innerWidth), height = Math.max(1, innerHeight);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  rebuild(points: TrackPoint[], width: number, theme: TrackTheme, trees: number[][]): void {
    this.theme = theme;
    this.clearWorld();
    this.currentWeather = -1;
    this.firstFrame = true;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(21000, 21000), new THREE.MeshStandardMaterial({ map: makeGroundTexture(theme.ground), roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2; ground.receiveShadow = true; this.world.add(ground);
    const shoulder = new THREE.MeshStandardMaterial({ color: theme.sand, roughness: 1 });
    this.world.add(makeRoad(points, width + 100, 0, .2, shoulder));
    this.roadMaterial = new THREE.MeshStandardMaterial({ color: theme.asph, roughness: .78, metalness: .02 });
    this.world.add(makeRoad(points, width, 0, 1.4, this.roadMaterial));
    const edgePaint = new THREE.MeshStandardMaterial({ color: '#e9dfc6', roughness: .82 });
    const curbPaint = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75 });
    for (const side of [-1, 1]) {
      this.world.add(makeRoad(points, 13, side * (width / 2 - 8), 2.2, curbPaint, true));
      this.world.add(makeRoad(points, 2.6, side * (width / 2 - 28), 2.3, edgePaint));
    }
    const count = Math.floor(points.length / 9);
    const lines = new THREE.InstancedMesh(new THREE.BoxGeometry(34, .45, 2.7), new THREE.MeshBasicMaterial({ color: '#e8dcc5', transparent: true, opacity: .68 }), count);
    for (let i = 0; i < count; i++) {
      const p = points[(i * 9) % points.length]; temp.position.set(p.x, 2.4, p.y); temp.rotation.set(0, -p.a, 0); temp.scale.set(1, 1, 1); temp.updateMatrix(); lines.setMatrixAt(i, temp.matrix);
    }
    lines.instanceMatrix.needsUpdate = true; this.world.add(lines);
    const start = points[0];
    const stripeTex = makeCanvasTexture((ctx, size) => {
      ctx.fillStyle = '#f1e9d2'; ctx.fillRect(0, 0, size, size);
      for (let row = 0; row < 8; row++) for (let col = 0; col < 2; col++) if ((row + col) % 2) { ctx.fillStyle = '#1f2527'; ctx.fillRect(col * size / 2, row * size / 8, size / 2, size / 8); }
    });
    const finish = new THREE.Mesh(new THREE.PlaneGeometry(20, width - 18), new THREE.MeshBasicMaterial({ map: stripeTex, side: THREE.DoubleSide }));
    finish.rotation.x = -Math.PI / 2; finish.rotation.z = -start.a; finish.position.set(start.x, 2.6, start.y); this.world.add(finish);
    this.addScenery(trees, theme.prop);
    this.setWeather(0);
  }

  private addScenery(trees: number[][], kind: string): void {
    const count = trees.length;
    if (!count) return;
    const setup = (geometry: THREE.BufferGeometry, material: THREE.Material, transform: (t: number[], i: number) => void) => {
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      trees.forEach((t, i) => { transform(t, i); temp.updateMatrix(); mesh.setMatrixAt(i, temp.matrix); });
      mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = false; mesh.receiveShadow = true; this.world.add(mesh);
    };
    if (kind === 'building') {
      setup(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#3b4559', metalness: .3, roughness: .7 }), ([x, z, r], i) => {
        temp.position.set(x, r * .65, z); temp.rotation.set(0, (i % 4) * Math.PI / 2, 0); temp.scale.set(r * 1.3, r * 1.3, r * 1.1);
      });
      setup(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#58d9e5' }), ([x, z, r], i) => {
        temp.position.set(x, r * .55, z + r * .57); temp.rotation.set(0, (i % 4) * Math.PI / 2, 0); temp.scale.set(r * 1.05, r * .15, 1.4);
      });
    } else if (kind === 'rock') {
      setup(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#74665c', roughness: 1 }), ([x, z, r], i) => {
        temp.position.set(x, r * .36, z); temp.rotation.set(i * .37, i * .9, 0); temp.scale.set(r * 1.2, r * .7, r);
      });
    } else if (kind === 'cactus') {
      setup(new THREE.CylinderGeometry(.65, .9, 1, 6), new THREE.MeshStandardMaterial({ color: '#527859', roughness: 1 }), ([x, z, r], i) => {
        temp.position.set(x, r * .7, z); temp.rotation.set(0, i, 0); temp.scale.set(r * .24, r * 1.4, r * .24);
      });
      setup(new THREE.CylinderGeometry(.7, .8, 1, 6), new THREE.MeshStandardMaterial({ color: '#527859', roughness: 1 }), ([x, z, r], i) => {
        temp.position.set(x + r * .28, r * .63, z); temp.rotation.set(0, i, Math.PI / 2); temp.scale.set(r * .16, r * .55, r * .16);
      });
    } else {
      setup(new THREE.CylinderGeometry(.65, .9, 1, 6), new THREE.MeshStandardMaterial({ color: '#624d37', roughness: 1 }), ([x, z, r]) => {
        temp.position.set(x, r * .45, z); temp.rotation.set(0, 0, 0); temp.scale.set(r * .17, r * .9, r * .17);
      });
      const pine = kind === 'pine';
      setup(pine ? new THREE.ConeGeometry(1, 1, 7) : new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: pine ? '#315d50' : '#487c55', roughness: 1 }), ([x, z, r], i) => {
        temp.position.set(x, r * 1.55, z); temp.rotation.set(0, i * 1.3, 0); temp.scale.set(r * .85, r * (pine ? 1.3 : .8), r * .85);
      });
    }
  }

  private clearWorld(): void {
    this.world.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial && material.map) material.map.dispose();
        if (material instanceof THREE.MeshBasicMaterial && material.map) material.map.dispose();
        material.dispose();
      }
    });
    this.world.clear();
  }

  private setWeather(weather: number): void {
    if (weather === this.currentWeather || !this.theme) return;
    this.currentWeather = weather;
    const night = weather === 2 || !!this.theme.night;
    const sky = new THREE.Color(night ? '#101829' : weather === 1 ? '#6e8592' : '#a5c6d4');
    this.scene.background = sky;
    this.scene.fog = new THREE.FogExp2(sky, night ? .00017 : weather === 1 ? .00018 : .00011);
    this.sun.color.set(night ? '#a7bdff' : weather === 1 ? '#cedbe2' : '#fff3d5');
    this.sun.intensity = night ? .55 : weather === 1 ? 1.5 : 2.6;
    this.hemi.intensity = night ? .38 : weather === 1 ? 1.35 : 2;
    if (this.roadMaterial) { this.roadMaterial.roughness = weather === 1 ? .2 : .78; this.roadMaterial.metalness = weather === 1 ? .2 : .02; }
    this.renderer.toneMappingExposure = night ? 1.25 : weather === 1 ? 1.35 : 1.45;
  }

  render(frame: RaceFrame): void {
    if (!this.ready || !frame.player) return;
    this.elapsed += frame.dt;
    this.setWeather(frame.weather);
    if (!this.models.length) {
      for (let i = 0; i < frame.cars.length; i++) {
        const model = makeCar(frame.cars[i].col, i === 4 ? '95' : String([51, 62, 20, 37, 95, 76][i]), i === 4);
        this.models.push(model); this.carRoot.add(model);
      }
    }
    frame.cars.forEach((car, i) => {
      const model = this.models[i]; if (!model) return;
      model.position.set(car.rx ?? car.x, 0, car.ry ?? car.y);
      model.rotation.y = -(car.ra ?? car.a);
      model.scale.setScalar(i === 4 ? frame.scale : 1);
      (model.userData.flames as THREE.Group).visible = i === 4 && frame.nitro && frame.state === 'race';
       if (i === 4) {
         const night = frame.weather === 2 || !!this.theme?.night;
         for (const headlight of model.userData.headlights as THREE.SpotLight[]) headlight.visible = night;
         (model.userData.brakeGlow as THREE.PointLight).visible = night && !!car.brk;
       }
      const wheels = model.userData.wheels as THREE.Mesh[];
      for (const wheel of wheels) wheel.rotation.y += (car.sp ?? 0) * frame.dt * .024;
      model.visible = true;
    });
    const player = frame.player;
    const x = player.rx ?? player.x, z = player.ry ?? player.y, angle = player.ra ?? player.a;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const speed = player.sp ?? 0;
    const target = new THREE.Vector3();
    const look = new THREE.Vector3();
    if (frame.state === 'menu') {
      const orbit = this.elapsed * .22;
      target.set(x + Math.cos(orbit) * 430, 220, z + Math.sin(orbit) * 430);
      look.set(x, 18, z);
    } else if (frame.mode) {
      target.set(x, 1000 + speed * .1, z);
      look.set(x, 0, z);
    } else {
      const distance = 250 + clamp(speed * .14, 0, 100);
      target.set(x - dx * distance, 190 + clamp(speed * .08, 0, 80), z - dz * distance);
      look.set(x + dx * 170, 12, z + dz * 170);
    }
    if (this.firstFrame) { this.camera.position.copy(target); this.focus.copy(look); this.firstFrame = false; }
    const blend = 1 - Math.exp(-frame.dt * (frame.state === 'menu' ? 1.7 : 4.5));
    this.camera.position.lerp(target, blend);
    this.focus.lerp(look, blend);
    this.camera.lookAt(this.focus);
    this.sun.position.set(x + 650, 950, z + 350);
    this.sun.target.position.set(x, 0, z);
    this.sun.target.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.clearWorld();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.ready = false;
  }
}
