import * as THREE from "three";

export interface ThreeContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  glassesGroup: THREE.Group;
}

export function initThreeScene(canvas: HTMLCanvasElement): ThreeContext {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  // Ambient + directional light to match real-world illumination
  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(0, 1, 2);
  scene.add(sun);

  const aspect = canvas.clientWidth / canvas.clientHeight;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.01, 100);
  camera.position.z = 2;

  const glassesGroup = new THREE.Group();
  scene.add(glassesGroup);

  return { renderer, scene, camera, glassesGroup };
}

export function resizeRenderer(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement
): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function disposeThreeScene(ctx: ThreeContext): void {
  ctx.renderer.dispose();
}
