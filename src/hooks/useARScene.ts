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

      // Step 1: apply facing rotation FIRST.
      model.rotation.y = Math.PI / 2;

      // Step 2: force the full hierarchy to update its world matrices so
      // Box3.setFromObject measures the correct rotated extents.
      model.updateMatrixWorld(true);

      // Step 3: measure bounding box in world space after rotation.
      // size.x is now the visual width (left-right as the camera sees it).
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Debug: log sizes so we can verify normalization is working.
      console.log("[glass-ar] model raw size after rotation:", size);

      // Step 4: normalise so the visual width = 1 unit.
      // Use max(x, z) as a safety net — some models have their width in Z
      // even after rotation if their original orientation differs.
      const visualWidth = Math.max(size.x, size.z);
      const normalizeScale = visualWidth > 0.001 ? 1 / visualWidth : 1;
      model.scale.setScalar(normalizeScale);

      console.log("[glass-ar] normalizeScale:", normalizeScale, "→ model will be 1 unit wide");

      // Step 5: center the model at the group's local origin.
      model.position.set(
        -center.x * normalizeScale,
        -center.y * normalizeScale,
        -center.z * normalizeScale
      );

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
        // Debug (runs once per second to avoid log spam)
        if (Math.floor(performance.now() / 1000) !== (glassesGroup.userData.lastLog ?? -1)) {
          glassesGroup.userData.lastLog = Math.floor(performance.now() / 1000);
          console.log("[glass-ar] glassesGroup scale:", transform.scale.x.toFixed(3), "| position z:", transform.position.z.toFixed(3));
        }
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
