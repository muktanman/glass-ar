import * as THREE from "three";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { FaceCalibration } from "@/hooks/useFaceCalibration";

// Key MediaPipe face landmark indices
const LEFT_EYE_OUTER  = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EAR        = 234;
const RIGHT_EAR       = 454;
const FOREHEAD        = 10;
const CHIN            = 152;

export interface GlassesTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

/**
 * Computes the world-space transform for the glasses group.
 *
 * canvasAspect: canvas.width / canvas.height — corrects the horizontal
 *   coordinate so that x-landmark positions project to the right screen
 *   position under the Three.js perspective camera.
 *
 * calibration: result of the face scan. When provided, the glasses are
 *   scaled to exactly fit the measured face. Without it we fall back to
 *   a per-frame estimate (for the uncalibrated case).
 */
export function computeGlassesTransform(
  landmarks: NormalizedLandmark[],
  canvasAspect: number,
  calibration?: FaceCalibration | null
): GlassesTransform {
  // Convert MediaPipe NDC [0,1] → Three.js world space.
  // X is aspect-corrected AND negated to match the mirrored video.
  // With the camera FOV = 2*atan(0.5) and camera.z = 2, a landmark at
  // world (±1, ±1, 0) projects to the edge of the screen regardless of aspect.
  const toWorld = (lm: NormalizedLandmark): THREE.Vector3 =>
    new THREE.Vector3(
      -(lm.x - 0.5) * 2 * canvasAspect,
      -(lm.y - 0.5) * 2,
      -lm.z * 2
    );

  const leftEye  = toWorld(landmarks[LEFT_EYE_OUTER]);
  const rightEye = toWorld(landmarks[RIGHT_EYE_OUTER]);
  const leftEar  = toWorld(landmarks[LEFT_EAR]);
  const rightEar = toWorld(landmarks[RIGHT_EAR]);
  const forehead = toWorld(landmarks[FOREHEAD]);
  const chin     = toWorld(landmarks[CHIN]);

  // ── Position ───────────────────────────────────────────────────────────────
  // Eye midpoint in X and Y; use calibrated nose-bridge depth if available,
  // otherwise use the live nose-bridge z with a small forward push.
  const eyeMid = new THREE.Vector3()
    .addVectors(leftEye, rightEye)
    .multiplyScalar(0.5);

  const position = eyeMid.clone();

  if (calibration) {
    // Use the scanned eye Y so the glasses don't drift vertically.
    position.y = calibration.eyeMidY;
    // Place glasses at the measured nose-bridge depth + small forward offset.
    position.z = calibration.noseBridgeZ + 0.08;
  } else {
    const earSpread = leftEar.distanceTo(rightEar);
    position.z += earSpread * 0.04;
  }

  // ── Rotation ───────────────────────────────────────────────────────────────
  // Build orthonormal face basis from stable landmarks.
  const rightVec = new THREE.Vector3()
    .subVectors(rightEar, leftEar)
    .normalize();

  const rawUp = new THREE.Vector3()
    .subVectors(forehead, chin)
    .normalize();

  const forwardVec = new THREE.Vector3()
    .crossVectors(rightVec, rawUp)
    .normalize();

  const upVec = new THREE.Vector3()
    .crossVectors(forwardVec, rightVec)
    .normalize();

  const rotMatrix = new THREE.Matrix4().makeBasis(rightVec, upVec, forwardVec);
  const rotation  = new THREE.Euler().setFromRotationMatrix(rotMatrix, "XYZ");

  // ── Scale ──────────────────────────────────────────────────────────────────
  // Model is normalised to 1 unit wide (visual width after its rotation).
  // Scale so the frame spans temple-to-temple.
  let s: number;
  if (calibration) {
    // templeSpread already aspect-corrected from the scan; multiply by 0.95
    // so the frame fits snugly without overhanging the temples.
    s = calibration.templeSpread * 0.95;
    console.log("[glass-ar] calibrated scale:", s.toFixed(3), "templeSpread:", calibration.templeSpread.toFixed(3));
  } else {
    // Fallback: derive from live ear spread.
    const earSpread = Math.abs(leftEar.x - rightEar.x); // horizontal only
    s = earSpread * 1.4;
  }

  return {
    position,
    rotation,
    scale: new THREE.Vector3(s, s, s),
  };
}
