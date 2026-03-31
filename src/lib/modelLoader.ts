import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();

export async function loadModel(url: string): Promise<THREE.Group> {
  if (cache.has(url)) {
    return cache.get(url)!.clone();
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        cache.set(url, model);
        resolve(model.clone());
      },
      undefined,
      reject
    );
  });
}

export function clearModelCache(): void {
  cache.clear();
}
