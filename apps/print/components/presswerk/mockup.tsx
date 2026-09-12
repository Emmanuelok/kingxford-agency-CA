'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { products, type Design, type Product } from '@/lib/presswerk/catalog';
import { renderArtworkCanvas } from '@/lib/next/artwork';

/** Shared rendering keeps the editor, exported artwork and mockup in agreement. */
export async function designCanvas(design: Design, max = 1600) {
  return renderArtworkCanvas(design, max);
}

type CameraView = 'front' | 'isometric' | 'back';
type SceneRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  product: THREE.Group | null;
  printMaterial: THREE.MeshStandardMaterial;
  texture: THREE.CanvasTexture;
  invalidate: () => void;
  disposed: boolean;
};

const PAPER = '#faf8f1';
const FOREST = '#173d32';
const measuredOnly = new Set([
  'fabric', 'sport', 'tissue', 'tape', 'mailer', 'pouch', 'wrap', 'booth',
  'roll', 'wall', 'floor', 'model', 'parts', 'braille', 'electronics', 'edible', 'award',
]);

function material(color: THREE.ColorRepresentation, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

function mesh(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  surface: THREE.Material | THREE.Material[],
  position: [number, number, number] = [0, 0, 0],
) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function sizedPanel(product: Product, longest = 3.15) {
  const ratio = longest / Math.max(product.width, product.height);
  return { width: product.width * ratio, height: product.height * ratio };
}

function cover(
  parent: THREE.Group,
  width: number,
  height: number,
  depth: number,
  print: THREE.Material,
  body: THREE.Material,
) {
  return mesh(parent, new THREE.BoxGeometry(width, height, depth), [body, body, body, body, print, body]);
}

function tube(parent: THREE.Group, points: THREE.Vector3[], radius: number, surface: THREE.Material) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, radius, 8, false), surface);
}

function garment(product: Product, group: THREE.Group, print: THREE.Material) {
  const hoodie = product.id === 'hoodie';
  const cotton = material('#ece9df', 0.96);
  const seam = material('#d8d6cb', 0.99);
  const shape = new THREE.Shape();
  shape.moveTo(-0.48, 1.16);
  shape.lineTo(-1.0, 0.99);
  if (hoodie) {
    shape.lineTo(-1.46, -0.86);
    shape.lineTo(-1.02, -0.98);
    shape.lineTo(-0.79, 0.05);
  } else {
    shape.lineTo(-1.43, 0.42);
    shape.lineTo(-0.98, 0.13);
    shape.lineTo(-0.79, 0.42);
  }
  shape.lineTo(-0.78, -1.32);
  shape.lineTo(0.78, -1.32);
  shape.lineTo(0.79, hoodie ? 0.05 : 0.42);
  if (hoodie) {
    shape.lineTo(1.02, -0.98);
    shape.lineTo(1.46, -0.86);
  } else {
    shape.lineTo(0.98, 0.13);
    shape.lineTo(1.43, 0.42);
  }
  shape.lineTo(1.0, 0.99);
  shape.lineTo(0.48, 1.16);
  shape.quadraticCurveTo(0, hoodie ? 0.72 : 0.58, -0.48, 1.16);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.085, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.045, bevelThickness: 0.035, steps: 1,
  });
  mesh(group, geometry, cotton);
  const printWidth = hoodie ? 0.96 : 1.15;
  const printHeight = printWidth * product.height / product.width;
  mesh(group, new THREE.PlaneGeometry(printWidth, printHeight), print, [0, hoodie ? 0.15 : -0.04, 0.125]);
  if (hoodie) {
    const hood = mesh(group, new THREE.SphereGeometry(0.53, 32, 24), cotton, [0, 0.99, -0.22]);
    hood.scale.set(1, 1.23, 0.6);
    const opening = mesh(group, new THREE.SphereGeometry(0.38, 32, 20), seam, [0, 1.01, 0.04]);
    opening.scale.set(0.91, 1.2, 0.2);
    const pocket = new THREE.Shape();
    pocket.moveTo(-0.47, -0.75);
    pocket.lineTo(-0.34, -0.46);
    pocket.lineTo(0.34, -0.46);
    pocket.lineTo(0.47, -0.75);
    pocket.lineTo(0.47, -1.04);
    pocket.lineTo(-0.47, -1.04);
    pocket.closePath();
    mesh(group, new THREE.ShapeGeometry(pocket), seam, [0, 0, 0.129]);
    for (const x of [-0.19, 0.19]) {
      tube(group, [new THREE.Vector3(x, 0.77, 0.16), new THREE.Vector3(x * 1.15, 0.58, 0.19), new THREE.Vector3(x * 1.1, 0.41, 0.16)], 0.012, seam);
    }
  } else {
    const collar = new THREE.EllipseCurve(0, 1.05, 0.47, 0.31, Math.PI, Math.PI * 2, false, 0);
    tube(group, collar.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0.126)), 0.018, seam);
  }
}

function tote(group: THREE.Group, print: THREE.Material, product: Product) {
  const canvas = material('#e2dac6', 0.99);
  const edge = material('#ccc1a7', 0.99);
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.96, 0.52);
  bodyShape.lineTo(0.96, 0.52);
  bodyShape.lineTo(0.91, -1.3);
  bodyShape.quadraticCurveTo(0, -1.45, -0.91, -1.3);
  bodyShape.closePath();
  mesh(group, new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.27, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.04, bevelSegments: 3, steps: 1,
  }), canvas, [0, 0, -0.135]);
  for (const z of [-0.16, 0.19]) {
    tube(group, [
      new THREE.Vector3(-0.48, 0.46, z), new THREE.Vector3(-0.49, 1.15, z),
      new THREE.Vector3(0, 1.39, z), new THREE.Vector3(0.49, 1.15, z), new THREE.Vector3(0.48, 0.46, z),
    ], 0.045, canvas);
  }
  mesh(group, new THREE.BoxGeometry(1.86, 0.055, 0.025), edge, [0, 0.47, 0.176]);
  const width = 1.44;
  mesh(group, new THREE.PlaneGeometry(width, width * product.height / product.width), print, [0, -0.39, 0.184]);
}

function cap(group: THREE.Group, print: THREE.Material, product: Product) {
  const fabric = material('#ddd8c8', 0.97);
  const stitching = material('#c6bfae', 0.98);
  const dome = mesh(group, new THREE.SphereGeometry(1.12, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), fabric, [0, -0.27, 0]);
  dome.scale.set(1, 0.86, 1);
  const brim = new THREE.Shape();
  brim.moveTo(-0.97, 0);
  brim.bezierCurveTo(-1.24, 0.75, -0.79, 1.22, 0, 1.25);
  brim.bezierCurveTo(0.79, 1.22, 1.24, 0.75, 0.97, 0);
  brim.quadraticCurveTo(0, -0.36, -0.97, 0);
  const visor = mesh(group, new THREE.ExtrudeGeometry(brim, { depth: 0.065, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.02, bevelSegments: 2, steps: 1 }), fabric, [0, -0.27, 0.6]);
  visor.rotation.x = Math.PI / 2;
  const button = mesh(group, new THREE.SphereGeometry(0.08, 16, 12), stitching, [0, 0.705, 0]);
  button.scale.y = 0.4;
  const patchWidth = 1.07;
  const patch = mesh(group, new THREE.PlaneGeometry(patchWidth, patchWidth * product.height / product.width), print, [0, 0.17, 1.015]);
  patch.rotation.x = -0.29;
  for (const theta of [-Math.PI / 3, Math.PI / 3, Math.PI]) {
    const points: THREE.Vector3[] = [];
    for (let index = 1; index <= 24; index++) {
      const phi = index / 24 * Math.PI / 2;
      points.push(new THREE.Vector3(1.126 * Math.sin(phi) * Math.sin(theta), 0.967 * Math.cos(phi) - 0.27, 1.126 * Math.sin(phi) * Math.cos(theta)));
    }
    tube(group, points, 0.007, stitching);
  }
}

function drinkware(product: Product, group: THREE.Group, print: THREE.Material) {
  const ceramic = material('#f8f7ee', 0.26);
  if (product.id === 'bottle') {
    const metal = material('#dedfd8', 0.25);
    const lid = material(FOREST, 0.42);
    mesh(group, new THREE.CylinderGeometry(0.51, 0.53, 2.35, 64), metal, [0, -0.07, 0]);
    mesh(group, new THREE.CylinderGeometry(0.32, 0.51, 0.26, 64), metal, [0, 1.235, 0]);
    mesh(group, new THREE.CylinderGeometry(0.345, 0.345, 0.32, 64), lid, [0, 1.495, 0]);
    // A 100 × 150 mm print patch: it is not stretched around an entire bottle.
    mesh(group, new THREE.CylinderGeometry(0.535, 0.535, 1.65, 64, 1, true, -1.05, 2.1), print, [0, -0.12, 0]);
    return;
  }
  mesh(group, new THREE.CylinderGeometry(0.79, 0.76, 1.82, 72, 1, true, -Math.PI), print);
  const innerSurface = material('#e6e4db', 0.28);
  innerSurface.side = THREE.BackSide;
  mesh(group, new THREE.CylinderGeometry(0.71, 0.68, 1.71, 72, 1, true), innerSurface, [0, 0.047, 0]);
  mesh(group, new THREE.CylinderGeometry(0.77, 0.76, 0.095, 72), ceramic, [0, -0.887, 0]);
  const rim = mesh(group, new THREE.TorusGeometry(0.75, 0.04, 12, 72), ceramic, [0, 0.91, 0]);
  rim.rotation.x = Math.PI / 2;
  const handle = mesh(group, new THREE.TorusGeometry(0.48, 0.105, 12, 40), ceramic, [0.91, 0, 0]);
  handle.scale.set(0.91, 1.14, 1);
}

function book(product: Product, group: THREE.Group, print: THREE.Material) {
  const { width, height } = sizedPanel(product, 2.94);
  const board = material(FOREST, 0.85);
  const pages = material('#eeeadd', 0.96);
  const depth = product.id === 'magazine' ? 0.07 : product.id === 'photobook' ? 0.23 : 0.29;
  mesh(group, new THREE.BoxGeometry(width - 0.06, height - 0.06, depth), pages, [0.016, 0, 0]);
  cover(group, width, height, 0.025, print, board).position.z = depth / 2 + 0.015;
  mesh(group, new THREE.BoxGeometry(width, height, 0.025), board, [0, 0, -depth / 2 - 0.015]);
  mesh(group, new THREE.BoxGeometry(0.035, height, depth + 0.05), board, [-width / 2 + 0.016, 0, 0]);
  // Visible page edges communicate binding without inventing additional artwork.
  const pageEdge = material('#d9d4c5', 0.99);
  for (let i = 1; i < 7; i++) {
    mesh(group, new THREE.BoxGeometry(0.004, height - 0.09, 0.003), pageEdge, [width / 2 - 0.014, 0, -depth / 2 + depth * i / 7]);
  }
  if (product.id === 'calendar') {
    const wire = material('#737a73', 0.34);
    for (let i = 0; i < 13; i++) {
      mesh(group, new THREE.TorusGeometry(0.045, 0.009, 6, 12), wire, [-width * 0.43 + i * width * 0.86 / 12, height / 2, 0]).rotation.y = Math.PI / 2;
    }
  }
}

function sign(product: Product, group: THREE.Group, print: THREE.Material) {
  const aluminium = material('#aeb6b0', 0.36);
  const white = material(PAPER, 0.82);
  const { width, height } = sizedPanel(product, product.id === 'banner' ? 2.8 : 2.9);
  cover(group, width, height, product.id === 'acrylic' ? 0.035 : 0.019, print, white);
  if (product.id === 'banner') {
    group.position.y = 0.18;
    mesh(group, new THREE.CylinderGeometry(0.013, 0.013, height, 12), aluminium, [0, 0, -0.10]);
    mesh(group, new THREE.BoxGeometry(width + 0.14, 0.12, 0.24), aluminium, [0, -height / 2 - 0.065, 0]);
    mesh(group, new THREE.BoxGeometry(width + 0.06, 0.025, 0.033), aluminium, [0, height / 2, 0.026]);
    for (const x of [-width * 0.31, width * 0.31]) {
      mesh(group, new THREE.BoxGeometry(0.07, 0.025, 0.66), aluminium, [x, -height / 2 - 0.135, 0]);
    }
  } else if (product.id === 'yard') {
    group.position.y = 0.30;
    for (const x of [-width * 0.28, width * 0.28]) {
      mesh(group, new THREE.CylinderGeometry(0.012, 0.012, 0.85, 12), aluminium, [x, -height / 2 - 0.28, -0.025]);
    }
  } else if (product.id === 'vinyl' || product.id === 'acrylic') {
    for (const x of [-width / 2 + 0.09, width / 2 - 0.09]) {
      for (const y of [-height / 2 + 0.09, height / 2 - 0.09]) {
        mesh(group, new THREE.TorusGeometry(0.023, 0.008, 8, 16), aluminium, [x, y, 0.024]);
      }
    }
  }
}

function createProduct(product: Product, print: THREE.Material) {
  const group = new THREE.Group();
  if (measuredOnly.has(product.id)) {
    const { width, height } = sizedPanel(product);
    cover(group, width, height, 0.015, print, material(PAPER));
  } else if (product.id === 'mug' || product.id === 'bottle') {
    drinkware(product, group, print);
  } else if (product.id === 'tee' || product.id === 'hoodie') {
    garment(product, group, print);
  } else if (product.id === 'tote') {
    tote(group, print, product);
  } else if (product.id === 'cap') {
    cap(group, print, product);
  } else if (product.category === 'Books & publishing') {
    book(product, group, print);
  } else if (product.category === 'Signs & displays') {
    sign(product, group, print);
  } else if (product.id === 'box') {
    const board = material('#d4bb8d', 0.97);
    const { width, height } = sizedPanel(product, 2.8);
    // Artwork represents the lid panel, not a complete packaging dieline.
    cover(group, width, height, 0.72, print, board);
    mesh(group, new THREE.BoxGeometry(width + 0.025, 0.015, 0.74), material('#bca378', 0.96), [0, -height / 2 + 0.10, 0.01]);
  } else {
    const { width, height } = sizedPanel(product);
    const white = material(PAPER, 0.86);
    const depth = product.id === 'canvas' ? 0.16 : product.id === 'metal' ? 0.045 : 0.018;
    cover(group, width, height, depth, print, white);
    if (product.id === 'cards') {
      for (let i = 1; i <= 8; i++) {
        mesh(group, new THREE.BoxGeometry(width, height, 0.015), white, [i * 0.008, -i * 0.005, -i * 0.018]);
      }
    }
  }
  group.name = product.id;
  return group;
}

/** The print material and texture belong to the renderer, never to a product. */
function disposeProduct(group: THREE.Group, sharedMaterial: THREE.Material) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const surfaces = Array.isArray(object.material) ? object.material : [object.material];
    surfaces.forEach(surface => { if (surface !== sharedMaterial) materials.add(surface); });
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(surface => surface.dispose());
}

function setCamera(runtime: SceneRuntime, view: CameraView) {
  const position: Record<CameraView, [number, number, number]> = {
    front: [0, 0, 7.8], isometric: [4.6, 2.5, 6.2], back: [0, 0.45, -7.8],
  };
  runtime.controls.target.set(0, 0, 0);
  runtime.camera.position.set(...position[view]);
  runtime.controls.update();
  runtime.invalidate();
}

function description(product: Product) {
  if (measuredOnly.has(product.id)) return 'Measured artwork proof · Product shape requires a production template';
  if (product.id === 'cap') return 'Artwork placement · Thread, stitch and cap fit require sampling';
  if (product.id === 'box') return 'Mailer lid artwork · Complete dieline requires supplier review';
  if (product.id === 'brochure') return 'Unfolded outer artwork · Fold layout requires proof review';
  if (product.category === 'Books & publishing') return 'Front cover placement · Spine and interior require separate artwork';
  return 'Artwork placement preview · Material and colour vary in production';
}

export default function Mockup({ design, spin = false }: { design: Design; spin?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const flatCanvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<SceneRuntime | null>(null);
  const artworkVersion = useRef(0);
  const [failed, setFailed] = useState(false);
  const [artworkError, setArtworkError] = useState('');
  const [view, setView] = useState<CameraView>('isometric');
  const [rotation, setRotation] = useState({ prop: spin, value: spin });
  // External controls remain authoritative when the prop changes, while
  // the built-in buttons also work for callers that omit the spin prop.
  if (rotation.prop !== spin) setRotation({ prop: spin, value: spin });
  const spinning = rotation.prop === spin ? rotation.value : spin;
  const product = products.find(item => item.id === design.productId);

  // A renderer survives all artwork, finish and product changes. Only unmount
  // (or an actual WebGL failure) releases its context and scene resources.
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let current: SceneRuntime | undefined;
    let animation = 0;
    let dirty = true;
    let onScreen = true;
    let stopped = false;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let failFrame = 0;
    const contextLost = (event: Event) => {
      event.preventDefault();
      if (stopped) return;
      setFailed(true);
      stopped = true;
      cancelAnimationFrame(animation);
    };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor('#eeece4', 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute('aria-label', 'Interactive product mockup. Use the view buttons or drag to rotate.');
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      element.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.enablePan = false;
      controls.minDistance = 3.9;
      controls.maxDistance = 12;
      controls.maxPolarAngle = Math.PI * 0.85;
      controls.autoRotateSpeed = 1;
      const invalidate = () => { dirty = true; };
      controls.addEventListener('change', invalidate);
      const blank = document.createElement('canvas');
      blank.width = blank.height = 2;
      const blankContext = blank.getContext('2d');
      if (blankContext) { blankContext.fillStyle = PAPER; blankContext.fillRect(0, 0, 2, 2); }
      const texture = new THREE.CanvasTexture(blank);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const printMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0 });
      current = { renderer, scene, camera, controls, texture, printMaterial, product: null, invalidate, disposed: false };
      runtime.current = current;
      setCamera(current, 'isometric');

      scene.add(new THREE.HemisphereLight(0xfff9e9, 0x607569, 2.3));
      const key = new THREE.DirectionalLight(0xfff9eb, 3.2);
      key.position.set(-3.5, 6, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = key.shadow.camera.bottom = -4;
      key.shadow.camera.right = key.shadow.camera.top = 4;
      key.shadow.normalBias = 0.035;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xdce8e1, 1.65);
      fill.position.set(4, 1, -3);
      scene.add(fill);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.14 }));
      ground.name = 'product-ground';
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.7;
      ground.receiveShadow = true;
      scene.add(ground);

      const resize = () => {
        if (!current || current.disposed) return;
        const width = Math.max(1, element.clientWidth);
        const height = Math.max(1, element.clientHeight);
        current.renderer.setSize(width, height, false);
        current.camera.aspect = width / height;
        // Keep a whole product visible in narrow mobile viewports.
        current.camera.fov = width / height < 0.85 ? 45 : 34;
        current.camera.updateProjectionMatrix();
        dirty = true;
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(element);
      resize();
      if ('IntersectionObserver' in window) {
        intersectionObserver = new IntersectionObserver(entries => { onScreen = entries[0]?.isIntersecting ?? true; dirty = true; });
        intersectionObserver.observe(element);
      }
      const tick = () => {
        if (stopped || !current || current.disposed) return;
        if (onScreen && !document.hidden) {
          current.controls.update();
          if (dirty || current.controls.autoRotate) {
            try {
              current.renderer.render(current.scene, current.camera);
              dirty = false;
            } catch {
              setFailed(true);
              stopped = true;
              return;
            }
          }
        }
        animation = requestAnimationFrame(tick);
      };
      animation = requestAnimationFrame(tick);
    } catch {
      // State updates are scheduled because renderer availability is external.
      failFrame = requestAnimationFrame(() => { if (!stopped) setFailed(true); });
    }
    return () => {
      stopped = true;
      cancelAnimationFrame(animation);
      cancelAnimationFrame(failFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost);
      if (current) {
        current.disposed = true;
        current.controls.dispose();
        if (current.product) {
          current.scene.remove(current.product);
          disposeProduct(current.product, current.printMaterial);
        }
        current.scene.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const surfaces = Array.isArray(object.material) ? object.material : [object.material];
            surfaces.forEach(surface => surface.dispose());
          }
          if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
        });
        const source = current.texture.image as HTMLCanvasElement;
        current.texture.dispose();
        source.width = source.height = 0;
        current.printMaterial.dispose();
      }
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
      if (runtime.current === current) runtime.current = null;
    };
  }, []);

  // Product geometry is rebuilt only when the chosen product changes.
  useEffect(() => {
    const current = runtime.current;
    if (!current || current.disposed || !product) return;
    if (current.product) {
      current.scene.remove(current.product);
      disposeProduct(current.product, current.printMaterial);
    }
    current.product = createProduct(product, current.printMaterial);
    current.scene.add(current.product);
    const ground = current.scene.getObjectByName('product-ground');
    if (ground) ground.position.y = new THREE.Box3().setFromObject(current.product).min.y - 0.04;
    current.invalidate();
  }, [product]);

  useEffect(() => {
    const current = runtime.current;
    if (!current || current.disposed) return;
    current.printMaterial.roughness = design.finish === 'Gloss laminate' ? 0.25 : design.finish === 'Soft touch' ? 0.94 : 0.8;
    // A foil finish needs a separate mask, so artwork colours remain unaltered.
    current.printMaterial.metalness = 0;
    current.invalidate();
  }, [design.finish]);

  useEffect(() => {
    const current = runtime.current;
    if (!current || current.disposed) return;
    current.controls.autoRotate = spinning;
    current.invalidate();
  }, [spinning]);

  useEffect(() => {
    const version = ++artworkVersion.current;
    let cancelled = false;
    const update = async () => {
      try {
        const canvas = await designCanvas(design, 1800);
        if (cancelled || version !== artworkVersion.current) {
          canvas.width = canvas.height = 0;
          return;
        }
        const flat = flatCanvas.current;
        if (flat) {
          flat.width = canvas.width;
          flat.height = canvas.height;
          flat.getContext('2d')?.drawImage(canvas, 0, 0);
        }
        const current = runtime.current;
        if (current && !current.disposed) {
          const previousTexture = current.texture;
          const previous = previousTexture.image as HTMLCanvasElement;
          if (previous.width !== canvas.width || previous.height !== canvas.height) {
            // Three.js allocates immutable texture storage. A new physical
            // size (including the first artwork) needs a fresh GPU texture.
            const nextTexture = new THREE.CanvasTexture(canvas);
            nextTexture.colorSpace = THREE.SRGBColorSpace;
            nextTexture.anisotropy = previousTexture.anisotropy;
            current.texture = nextTexture;
            current.printMaterial.map = nextTexture;
            current.printMaterial.needsUpdate = true;
            previousTexture.dispose();
          } else {
            previousTexture.image = canvas;
            previousTexture.needsUpdate = true;
          }
          current.invalidate();
          if (previous !== canvas) previous.width = previous.height = 0;
        } else {
          canvas.width = canvas.height = 0;
        }
        setArtworkError('');
      } catch (error) {
        if (cancelled || version !== artworkVersion.current) return;
        const flat = flatCanvas.current;
        if (flat) flat.getContext('2d')?.clearRect(0, 0, flat.width, flat.height);
        setArtworkError(error instanceof Error ? error.message : 'This artwork could not be rendered. Re-upload the affected image.');
      }
    };
    void update();
    return () => { cancelled = true; };
  }, [design]);

  const changeView = (next: CameraView) => {
    setView(next);
    setRotation({ prop: spin, value: false });
    if (runtime.current && !runtime.current.disposed) setCamera(runtime.current, next);
  };
  const proofOnly = product ? measuredOnly.has(product.id) : true;
  const showFlat = failed || !product || !!artworkError;
  return (
    <div className="mockup-webgl" style={{ position: 'absolute', inset: 0, background: '#eeece4', color: FOREST, overflow: 'hidden' }}>
      <div ref={host} className="mockup-renderer" style={{ position: 'absolute', inset: 0, visibility: showFlat ? 'hidden' : 'visible' }} />
      <div className="mockup-status" style={{ position: 'absolute', top: 18, left: 18, fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase', pointerEvents: 'none' }}>
        {proofOnly ? 'Measured artwork proof' : 'Live product preview'}
      </div>
      <div className="mockup-dimensions" style={{ position: 'absolute', top: 18, right: 18, fontSize: 10, pointerEvents: 'none' }}>
        {product ? `${product.width} × ${product.height} mm artwork` : 'Choose a product'}
      </div>
      <div className="mockup-fallback" style={{ display: showFlat ? 'flex' : 'none', position: 'absolute', inset: '65px 24px 118px', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <canvas ref={flatCanvas} aria-label={`Flat artwork proof for ${design.name}`} style={{ display: artworkError ? 'none' : 'block', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', boxShadow: '0 18px 40px #173d3220' }} />
        {artworkError && <p role="alert" style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>{artworkError}</p>}
      </div>
      {!showFlat && <div className="mockup-controls" role="group" aria-label="Mockup camera controls" style={{ position: 'absolute', bottom: 61, left: 12, right: 12, display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
        {(['front', 'isometric', 'back'] as const).map(option => (
          <button key={option} type="button" aria-pressed={view === option && !spinning} onClick={() => changeView(option)} style={{ padding: '9px 13px', minHeight: 40, borderRadius: 22, background: view === option && !spinning ? FOREST : '#ffffffdf', color: view === option && !spinning ? '#fff' : FOREST, border: '1px solid #173d3222', fontSize: 11, textTransform: 'capitalize' }}>{option}</button>
        ))}
        <button type="button" aria-pressed={spinning} onClick={() => setRotation({ prop: spin, value: !spinning })} style={{ padding: '9px 13px', minHeight: 40, borderRadius: 22, background: spinning ? FOREST : '#ffffffdf', color: spinning ? '#fff' : FOREST, border: '1px solid #173d3222', fontSize: 11 }}>{spinning ? 'Pause rotation' : 'Rotate'}</button>
        <button type="button" onClick={() => changeView('isometric')} style={{ padding: '9px 13px', minHeight: 40, borderRadius: 22, background: '#ffffffdf', color: FOREST, border: '1px solid #173d3222', fontSize: 11 }}>Reset</button>
      </div>}
      <p className="mockup-instruction" style={{ position: 'absolute', bottom: 18, left: 20, right: 20, textAlign: 'center', fontSize: 10, lineHeight: 1.5, color: '#567063', pointerEvents: 'none' }}>
        {failed ? '3D is unavailable on this device. Your live artwork proof is shown above.' : product ? description(product) : 'Choose a product to prepare a preview.'}
        {!showFlat && <><br />Drag to rotate · Scroll or pinch to zoom{product?.id === 'mug' ? ' · Artwork wraps around the mug' : ' · Back artwork is not configured'}</>}
      </p>
    </div>
  );
}
