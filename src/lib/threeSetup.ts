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

  // FOV is chosen so that the landmark world-space range [-1, 1] maps exactly
  // to the full visible height at z=0 (where the face sits).
  // tan(FOV/2) = 1 / camera_z  →  FOV = 2 * atan(1/2) ≈ 53.13°
  // Without this, Three.js renders at a wider FOV than the video, making
  // everything appear smaller relative to the camera feed.
  const fov = 2 * Math.atan(0.5) * (180 / Math.PI); // ≈ 53.13
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.01, 100);
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
