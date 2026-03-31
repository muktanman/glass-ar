"use client";

import { useRef, useCallback } from "react";
import * as THREE from "three";
import { initThreeScene, ThreeContext, resizeRenderer } from "@/lib/threeSetup";
import { loadModel } from "@/lib/modelLoader";
import { initFaceLandmarker, detectFace, disposeFaceLandmarker } from "@/lib/faceTracking";
import { computeGlassesTransform } from "@/lib/transformUtils";

export function useARScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeRef = useRef<ThreeContext | null>(null);
  const rafRef = useRef<number>(0);
  const currentModelRef = useRef<THREE.Group | null>(null);

  const init = useCallback(async (canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    threeRef.current = initThreeScene(canvas);
    await initFaceLandmarker();
  }, []);

  const loadGlasses = useCallback(async (modelUrl: string) => {
    if (!threeRef.current) return;
    const { glassesGroup } = threeRef.current;

    // Clear current model
    glassesGroup.clear();
    currentModelRef.current = null;

    try {
      const model = await loadModel(modelUrl);

      // Normalize model: center it and scale so its width = 1 unit.
      // This makes it frame-independent regardless of how the GLB was exported.
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const normalizeScale = 1 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(normalizeScale);
      // Re-center after scaling
      model.position.sub(center.multiplyScalar(normalizeScale));

      // Most GLB sunglasses models face +Z (away from camera).
      // Rotate 180° on Y so they face the viewer correctly.
      model.rotation.y = Math.PI;

      glassesGroup.add(model);
      currentModelRef.current = model;
    } catch {
      console.warn("Model not found, using placeholder geometry");
      const geo = new THREE.BoxGeometry(1, 0.15, 0.2);
      const mat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const mesh = new THREE.Mesh(geo, mat);
      glassesGroup.add(mesh);
      currentModelRef.current = mesh as unknown as THREE.Group;
    }
  }, []);

  const startLoop = useCallback((video: HTMLVideoElement) => {
    if (!threeRef.current) return;
    const { renderer, scene, camera, glassesGroup } = threeRef.current;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      // Resize if needed
      const canvas = renderer.domElement;
      resizeRenderer(renderer, camera, canvas);

      // Face tracking
      const result = detectFace(video);
      if (result?.faceLandmarks?.[0]) {
        const transform = computeGlassesTransform(
          result.faceLandmarks[0],
          video.videoWidth,
          video.videoHeight
        );
        glassesGroup.position.copy(transform.position);
        glassesGroup.rotation.copy(transform.rotation);
        glassesGroup.scale.copy(transform.scale);
        glassesGroup.visible = true;
      } else {
        glassesGroup.visible = false;
      }

      renderer.render(scene, camera);
    };

    tick();
  }, []);

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    disposeFaceLandmarker();
    threeRef.current?.renderer.dispose();
    threeRef.current = null;
  }, []);

  return { canvasRef, init, loadGlasses, startLoop, stopLoop };
}
