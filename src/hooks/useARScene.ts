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

      // Step 1: apply facing rotation FIRST so the bounding box
      // is computed in the correct visual orientation.
      // rotation.y = PI/2 turns -X-facing models to face +Z (toward camera).
      model.rotation.y = Math.PI / 2;

      // Step 2: compute bounding box AFTER rotation so size.x is the
      // actual visual width (left-right as seen by the camera).
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Step 3: normalise so the visual width (size.x) = 1 unit.
      // Previously we used max(x,y,z) which picked the wrong axis after
      // rotation and left the model appearing only a few % of its real size.
      const normalizeScale = size.x > 0.001 ? 1 / size.x : 1;
      model.scale.setScalar(normalizeScale);

      // Step 4: center the model at the group's local origin.
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
